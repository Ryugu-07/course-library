#!/usr/bin/env python3
"""Mini Codex course project: inspect, edit, execute, trace, and verify."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Protocol


SYSTEM_PROMPT = """You are Mini Codex, a small local coding agent.

Rules:
- Inspect before editing and work only inside the workspace.
- Preserve existing user changes. Prefer search_text and apply_patch.
- Use tools for real actions; never claim a command ran unless a tool result says so.
- After changing files, run a relevant verification command and inspect the result.
- Stop when the task is complete, or explain the exact blocker.
"""


def function_tool(name: str, description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
                "additionalProperties": False,
            },
        },
    }


TOOLS = [
    function_tool(
        "list_files",
        "List files below a workspace-relative directory.",
        {"path": {"type": "string"}, "max_results": {"type": "integer", "minimum": 1, "maximum": 200}},
        ["path"],
    ),
    function_tool(
        "search_text",
        "Search text in UTF-8 files and return path, line number, and matching line.",
        {"query": {"type": "string"}, "path": {"type": "string"}, "max_results": {"type": "integer", "minimum": 1, "maximum": 100}},
        ["query"],
    ),
    function_tool(
        "read_file",
        "Read a bounded line range from a UTF-8 file.",
        {"path": {"type": "string"}, "start_line": {"type": "integer", "minimum": 1}, "max_lines": {"type": "integer", "minimum": 1, "maximum": 500}},
        ["path"],
    ),
    function_tool(
        "apply_patch",
        "Replace one exact old_text occurrence with new_text.",
        {"path": {"type": "string"}, "old_text": {"type": "string"}, "new_text": {"type": "string"}},
        ["path", "old_text", "new_text"],
    ),
    function_tool(
        "run_shell",
        "Run a command inside the workspace with timeout and bounded output.",
        {"command": {"type": "string"}, "timeout_seconds": {"type": "integer", "minimum": 1, "maximum": 120}},
        ["command"],
    ),
]


@dataclass
class ToolCall:
    call_id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class ToolResult:
    ok: bool
    tool: str
    output: Any = None
    error: str | None = None
    exit_code: int | None = None
    truncated: bool = False
    duration_ms: int = 0


@dataclass
class AgentState:
    task: str
    history: list[dict[str, Any]]
    turn: int = 0
    status: str = "running"
    stop_reason: str | None = None
    changed_files: set[str] = field(default_factory=set)
    checks: list[dict[str, Any]] = field(default_factory=list)
    recent_calls: list[str] = field(default_factory=list)


class Provider(Protocol):
    def complete(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> tuple[str, list[ToolCall], dict[str, Any]]:
        ...


class ChatProvider:
    """OpenAI-compatible Chat Completions adapter for OpenAI or DeepSeek."""

    def __init__(self, provider: str, model: str | None):
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise SystemExit("Install the openai package: python3 -m pip install openai") from exc

        if provider == "deepseek":
            key = os.environ.get("DEEPSEEK_API_KEY")
            if not key:
                raise SystemExit("Set DEEPSEEK_API_KEY.")
            self.client = OpenAI(api_key=key, base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))
            self.model = model or os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        else:
            key = os.environ.get("OPENAI_API_KEY")
            if not key:
                raise SystemExit("Set OPENAI_API_KEY.")
            self.client = OpenAI(api_key=key)
            self.model = model or os.environ.get("OPENAI_MODEL", "gpt-5.4")

    def complete(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> tuple[str, list[ToolCall], dict[str, Any]]:
        response = self.client.chat.completions.create(model=self.model, messages=messages, tools=tools, tool_choice="auto")
        message = response.choices[0].message
        calls: list[ToolCall] = []
        for raw in message.tool_calls or []:
            calls.append(ToolCall(raw.id, raw.function.name, json.loads(raw.function.arguments or "{}")))
        serial = {
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {"id": call.call_id, "type": "function", "function": {"name": call.name, "arguments": json.dumps(call.arguments)}}
                for call in calls
            ],
        }
        return message.content or "", calls, serial


class DemoProvider:
    """Deterministic offline provider for learning the event flow."""

    def __init__(self):
        self.step = 0

    def complete(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> tuple[str, list[ToolCall], dict[str, Any]]:
        script = [
            ToolCall("demo-1", "list_files", {"path": ".", "max_results": 30}),
            ToolCall("demo-2", "read_file", {"path": "README.md", "start_line": 1, "max_lines": 80}),
        ]
        if self.step < len(script):
            call = script[self.step]
            self.step += 1
            serial = {
                "role": "assistant",
                "content": "",
                "tool_calls": [{"id": call.call_id, "type": "function", "function": {"name": call.name, "arguments": json.dumps(call.arguments)}}],
            }
            return "", [call], serial
        text = "Demo complete: inspected the workspace and README. No files were changed."
        return text, [], {"role": "assistant", "content": text}


class Transcript:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, event: str, **data: Any) -> None:
        record = {"ts": round(time.time(), 3), "event": event, **data}
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, default=_json_default) + "\n")


def _json_default(value: Any):
    if isinstance(value, set):
        return sorted(value)
    raise TypeError(type(value).__name__)


class WorkspaceTools:
    IGNORED = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build"}

    def __init__(self, workspace: Path, yes: bool = False):
        self.workspace = workspace.resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)
        self.yes = yes

    def resolve(self, path_text: str) -> Path:
        candidate = (self.workspace / path_text).resolve()
        try:
            candidate.relative_to(self.workspace)
        except ValueError as exc:
            raise PermissionError(f"Path escapes workspace: {path_text}") from exc
        return candidate

    def execute(self, call: ToolCall) -> ToolResult:
        started = time.monotonic()
        try:
            if call.name == "list_files":
                result = self.list_files(**call.arguments)
            elif call.name == "search_text":
                result = self.search_text(**call.arguments)
            elif call.name == "read_file":
                result = self.read_file(**call.arguments)
            elif call.name == "apply_patch":
                result = self.apply_patch(**call.arguments)
            elif call.name == "run_shell":
                result = self.run_shell(**call.arguments)
            else:
                raise ValueError(f"Unknown tool: {call.name}")
            result.duration_ms = round((time.monotonic() - started) * 1000)
            return result
        except Exception as exc:
            return ToolResult(False, call.name, error=str(exc), duration_ms=round((time.monotonic() - started) * 1000))

    def list_files(self, path: str = ".", max_results: int = 100) -> ToolResult:
        root = self.resolve(path)
        if not root.is_dir():
            raise FileNotFoundError(path)
        files: list[str] = []
        for item in sorted(root.rglob("*")):
            if any(part in self.IGNORED for part in item.relative_to(self.workspace).parts):
                continue
            if item.is_file():
                files.append(str(item.relative_to(self.workspace)))
                if len(files) >= max_results:
                    break
        return ToolResult(True, "list_files", output={"files": files, "limited": len(files) >= max_results})

    def search_text(self, query: str, path: str = ".", max_results: int = 50) -> ToolResult:
        root = self.resolve(path)
        matches: list[dict[str, Any]] = []
        candidates = [root] if root.is_file() else root.rglob("*")
        for file_path in candidates:
            if not file_path.is_file() or any(part in self.IGNORED for part in file_path.relative_to(self.workspace).parts):
                continue
            try:
                for line_number, line in enumerate(file_path.read_text(encoding="utf-8").splitlines(), start=1):
                    if query.lower() in line.lower():
                        matches.append({"path": str(file_path.relative_to(self.workspace)), "line": line_number, "text": line[:300]})
                        if len(matches) >= max_results:
                            return ToolResult(True, "search_text", output={"matches": matches, "limited": True})
            except (UnicodeDecodeError, OSError):
                continue
        return ToolResult(True, "search_text", output={"matches": matches, "limited": False})

    def read_file(self, path: str, start_line: int = 1, max_lines: int = 200) -> ToolResult:
        target = self.resolve(path)
        lines = target.read_text(encoding="utf-8").splitlines()
        selected = lines[start_line - 1 : start_line - 1 + max_lines]
        return ToolResult(
            True,
            "read_file",
            output={"path": path, "start_line": start_line, "content": "\n".join(selected), "truncated": start_line - 1 + max_lines < len(lines)},
        )

    def apply_patch(self, path: str, old_text: str, new_text: str) -> ToolResult:
        if not old_text:
            raise ValueError("old_text must not be empty")
        target = self.resolve(path)
        current = target.read_text(encoding="utf-8")
        count = current.count(old_text)
        if count != 1:
            raise ValueError(f"Expected exactly one old_text match, found {count}")
        target.write_text(current.replace(old_text, new_text, 1), encoding="utf-8")
        return ToolResult(True, "apply_patch", output={"path": path, "removed_chars": len(old_text), "added_chars": len(new_text)})

    def run_shell(self, command: str, timeout_seconds: int = 30) -> ToolResult:
        if not self.yes:
            answer = input(f"Run in {self.workspace}: {command!r}? [y/N] ").strip().lower()
            if answer != "y":
                return ToolResult(False, "run_shell", error="User denied command")
        completed = subprocess.run(
            command,
            cwd=self.workspace,
            shell=True,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
        stdout, stdout_cut = _bounded(completed.stdout)
        stderr, stderr_cut = _bounded(completed.stderr)
        return ToolResult(
            completed.returncode == 0,
            "run_shell",
            output={"stdout": stdout, "stderr": stderr},
            exit_code=completed.returncode,
            truncated=stdout_cut or stderr_cut,
        )


def _bounded(text: str, limit: int = 8000) -> tuple[str, bool]:
    if len(text) <= limit:
        return text, False
    half = limit // 2
    return text[:half] + "\n... output truncated ...\n" + text[-half:], True


def call_fingerprint(call: ToolCall) -> str:
    raw = json.dumps({"name": call.name, "arguments": call.arguments}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def looks_like_check(command: str) -> bool:
    words = ("test", "pytest", "unittest", "lint", "mypy", "typecheck", "build", "compile")
    return any(word in command.lower() for word in words)


def run_agent(args: argparse.Namespace) -> int:
    workspace = Path(args.workspace).expanduser()
    tools = WorkspaceTools(workspace, yes=args.yes)
    transcript = Transcript(Path(args.transcript).expanduser())
    provider: Provider = DemoProvider() if args.provider == "demo" else ChatProvider(args.provider, args.model)
    state = AgentState(args.task, [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": args.task}])
    transcript.append("thread.started", task=args.task, workspace=str(workspace.resolve()))

    for turn in range(1, args.max_turns + 1):
        state.turn = turn
        transcript.append("turn.started", turn=turn)
        text, calls, assistant_message = provider.complete(state.history, TOOLS)
        state.history.append(assistant_message)

        if not calls:
            if state.changed_files and not state.checks:
                reminder = "Files changed but no verification command has run. Run a relevant check before finishing."
                state.history.append({"role": "user", "content": reminder})
                transcript.append("verification.required", changed_files=sorted(state.changed_files))
                continue
            state.status = "completed"
            state.stop_reason = "model_final"
            transcript.append("turn.completed", turn=turn, status=state.status, checks=state.checks)
            print(text)
            print(f"\nstatus={state.status}; transcript={transcript.path}")
            return 0

        for call in calls:
            fingerprint = call_fingerprint(call)
            state.recent_calls.append(fingerprint)
            if len(state.recent_calls) >= 3 and len(set(state.recent_calls[-3:])) == 1:
                state.status = "blocked"
                state.stop_reason = "repeated_tool_call"
                transcript.append("thread.blocked", reason=state.stop_reason, call=asdict(call))
                print("Blocked: the same tool call repeated three times without progress.")
                return 2

            transcript.append("tool.started", turn=turn, call=asdict(call))
            result = tools.execute(call)
            transcript.append("tool.completed", turn=turn, call_id=call.call_id, result=asdict(result))
            if call.name == "apply_patch" and result.ok:
                state.changed_files.add(str(result.output["path"]))
            if call.name == "run_shell" and looks_like_check(str(call.arguments.get("command", ""))):
                state.checks.append({"command": call.arguments["command"], "ok": result.ok, "exit_code": result.exit_code})
            state.history.append(
                {"role": "tool", "tool_call_id": call.call_id, "content": json.dumps(asdict(result), ensure_ascii=False)}
            )
            print(f"[{turn}] {call.name}: {'ok' if result.ok else 'failed'}")

    state.status = "blocked"
    state.stop_reason = "max_turns"
    transcript.append("thread.blocked", reason=state.stop_reason, state=asdict(state))
    print(f"Blocked after max_turns={args.max_turns}.")
    return 2


def self_test() -> int:
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        (root / "README.md").write_text("hello agent\n", encoding="utf-8")
        (root / "app.py").write_text("value = 1\n", encoding="utf-8")
        tools = WorkspaceTools(root, yes=True)
        assert tools.list_files().ok
        assert tools.search_text("agent").output["matches"][0]["path"] == "README.md"
        assert tools.read_file("app.py").output["content"] == "value = 1"
        assert tools.apply_patch("app.py", "1", "2").ok
        assert (root / "app.py").read_text() == "value = 2\n"
        assert tools.run_shell(f"{sys.executable} -c 'print(7)'").ok
        try:
            tools.resolve("../outside")
        except PermissionError:
            pass
        else:
            raise AssertionError("workspace escape was not rejected")
        call = ToolCall("1", "read_file", {"path": "app.py"})
        assert call_fingerprint(call) == call_fingerprint(call)
    print("mini_codex self-test ok")
    return 0


def demo_workspace(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    readme = path / "README.md"
    if not readme.exists():
        readme.write_text("# Demo workspace\n\nThis folder demonstrates Mini Codex event flow.\n", encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("task", nargs="?", default="Inspect the workspace and summarize it.")
    parser.add_argument("--provider", choices=["demo", "openai", "deepseek"], default="demo")
    parser.add_argument("--model")
    parser.add_argument("--workspace", default="./mini-codex-workspace")
    parser.add_argument("--transcript", default="./mini-codex-transcript.jsonl")
    parser.add_argument("--max-turns", type=int, default=10)
    parser.add_argument("--yes", action="store_true", help="Approve shell commands without prompting.")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args(argv)


if __name__ == "__main__":
    cli = parse_args(sys.argv[1:])
    if cli.self_test:
        raise SystemExit(self_test())
    if cli.provider == "demo":
        demo_workspace(Path(cli.workspace))
    raise SystemExit(run_agent(cli))
