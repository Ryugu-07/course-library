#!/usr/bin/env python3
"""A teaching-sized SWE agent: loop + context + prompt + parser + executor."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PROJECT_DIR = Path.home() / "agent-lab"
WORKSPACE = PROJECT_DIR / "workspace"
DEFAULT_OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.4")
DEFAULT_DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")


# DESIGN REASON: system prompt / tool instructions
# Without this module, the model sees tools but not the contract for using them.
# The prompt is intentionally plain text so a learner can print the exact rules
# that steer the agent before any API call is sent.
SYSTEM_PROMPT = """You are a minimal SWE agent running in a teaching sandbox.

Goal:
- Help complete small software tasks by inspecting files, editing files, and
  running shell commands when needed.

Rules:
- Work only inside the provided workspace.
- Prefer reading files before changing them.
- Use tools for filesystem or shell actions; do not pretend you ran commands.
- After each tool result, decide whether another tool is needed.
- When the task is complete, stop calling tools and explain the result briefly.
"""


# DESIGN REASON: tool schemas
# Function calling is the production parser: the model emits structured tool
# calls that the API validates against these schemas. Removing this piece would
# force us to parse free-form assistant text for every action.
def function_tool(name: str, description: str, properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
    return {
        "type": "function",
        "name": name,
        "description": description,
        "parameters": {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        },
        "strict": True,
    }


PATH_PROP = {"type": "string", "description": "Relative path inside the workspace."}
CONTENT_PROP = {"type": "string", "description": "Full file contents to write."}
COMMAND_PROP = {"type": "string", "description": "Shell command to run."}

TOOLS = [
    function_tool(
        "read_file",
        "Read a UTF-8 text file inside the workspace.",
        {"path": PATH_PROP},
        ["path"],
    ),
    function_tool(
        "write_file",
        "Write UTF-8 text to a file inside the workspace.",
        {"path": PATH_PROP, "content": CONTENT_PROP},
        ["path", "content"],
    ),
    function_tool(
        "run_shell",
        "Run a shell command with cwd fixed to the workspace.",
        {"command": COMMAND_PROP},
        ["command"],
    ),
]


def chat_tools() -> list[dict[str, Any]]:
    """Convert Responses-style tools to Chat Completions-style tools."""
    converted = []
    for tool in TOOLS:
        converted.append(
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"],
                },
            }
        )
    return converted


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]
    call_id: str | None = None


class ToolError(Exception):
    """A tool failed in a way we should report back to the model."""


# DESIGN REASON: context management
# The model is stateless between API calls unless we resend useful history.
# This section keeps the raw input/output items visible, then drops old tool
# observations first when the request grows too long.
def user_item(text: str, provider: str) -> dict[str, Any]:
    if provider == "deepseek":
        return {"role": "user", "content": text}
    return {"role": "user", "content": [{"type": "input_text", "text": text}]}


def item_to_dict(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        return item
    if hasattr(item, "model_dump"):
        return item.model_dump(exclude_none=True)
    if hasattr(item, "dict"):
        return item.dict(exclude_none=True)
    raise TypeError(f"Cannot serialize response item: {item!r}")


def compact_context(items: list[dict[str, Any]], max_items: int) -> list[dict[str, Any]]:
    if len(items) <= max_items:
        return list(items)

    kept = list(items)
    index = 0
    while len(kept) > max_items and index < len(kept):
        if kept[index].get("type") == "function_call_output" or kept[index].get("role") == "tool":
            del kept[index]
        else:
            index += 1

    if len(kept) > max_items:
        kept = kept[:1] + kept[-(max_items - 1) :]
    return kept


# DESIGN REASON: prompt assembly
# build_prompt is deliberately separate and printable. It shows that an "agent"
# is mostly a normal model request plus instructions, history, and tool schemas.
def build_prompt(
    history: list[dict[str, Any]],
    *,
    model: str,
    max_context_items: int,
    provider: str,
) -> dict[str, Any]:
    if provider == "deepseek":
        return {
            "model": model,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}]
            + compact_context(history, max_context_items),
            "tools": chat_tools(),
            "tool_choice": "auto",
            "extra_body": {"thinking": {"type": "disabled"}},
        }
    return {
        "model": model,
        "instructions": SYSTEM_PROMPT,
        "input": compact_context(history, max_context_items),
        "tools": TOOLS,
        "parallel_tool_calls": False,
    }


def dump_prompt(request: dict[str, Any]) -> None:
    print("\n=== REQUEST SENT TO MODEL ===")
    print(json.dumps(request, indent=2, ensure_ascii=False))
    print("=== END REQUEST ===\n")


# DESIGN REASON: LLM provider boundary
# The rest of the agent does not know which SDK/provider is used. If this ever
# moves from OpenAI to DeepSeek or another Responses-compatible backend, this is
# the one function to replace.
def call_llm(request: dict[str, Any], provider: str) -> Any:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: python3 -m pip install --upgrade openai"
        ) from exc

    if provider == "deepseek":
        api_key = os.environ.get("DEEPSEEK_API_KEY")
        if not api_key:
            raise SystemExit("Set DEEPSEEK_API_KEY before using --provider deepseek.")
        client = OpenAI(
            api_key=api_key,
            base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        )
        return client.chat.completions.create(**request)

    client = OpenAI()
    if not hasattr(client, "responses"):
        raise SystemExit("OpenAI SDK is too old: python3 -m pip install --upgrade openai")
    return client.responses.create(**request)


# DESIGN REASON: output parser
# Main path: the API returns native function_call items. The tiny XML parser is
# included for comparison: it shows what function calling saves us from writing.
def extract_function_calls(response: Any) -> list[ToolCall]:
    calls: list[ToolCall] = []
    for item in getattr(response, "output", []):
        if getattr(item, "type", None) != "function_call":
            continue
        raw_arguments = getattr(item, "arguments", "{}") or "{}"
        try:
            arguments = json.loads(raw_arguments)
        except json.JSONDecodeError as exc:
            raise ToolError(f"Bad JSON arguments from model: {raw_arguments}") from exc
        calls.append(ToolCall(getattr(item, "name"), arguments, getattr(item, "call_id", None)))
    return calls


def extract_chat_tool_calls(response: Any) -> list[ToolCall]:
    message = response.choices[0].message
    calls: list[ToolCall] = []
    for tool in message.tool_calls or []:
        if tool.type != "function":
            continue
        try:
            arguments = json.loads(tool.function.arguments or "{}")
        except json.JSONDecodeError as exc:
            raise ToolError(f"Bad JSON arguments from model: {tool.function.arguments}") from exc
        calls.append(ToolCall(tool.function.name, arguments, tool.id))
    return calls


TEXT_TOOL_RE = re.compile(
    r"<tool\s+name=[\"'](?P<name>[A-Za-z_][A-Za-z0-9_]*)[\"']\s*>"
    r"(?P<body>.*?)"
    r"</tool>",
    re.DOTALL,
)


def parse_text_protocol(text: str) -> list[ToolCall]:
    """Parse: <tool name="read_file">{"path":"x.txt"}</tool>."""
    calls: list[ToolCall] = []
    for match in TEXT_TOOL_RE.finditer(text):
        body = match.group("body").strip()
        try:
            arguments = json.loads(body) if body else {}
        except json.JSONDecodeError as exc:
            raise ToolError(f"Bad text-protocol JSON: {body}") from exc
        if not isinstance(arguments, dict):
            raise ToolError("Text-protocol tool arguments must be a JSON object.")
        calls.append(ToolCall(match.group("name"), arguments, f"text-call-{len(calls) + 1}"))
    return calls


# DESIGN REASON: executor
# Tools are where model intentions become real effects. Keeping execution in
# three small functions makes the trust boundary obvious: model text is harmless
# until this module chooses to read, write, or run something.
def ensure_workspace() -> None:
    WORKSPACE.mkdir(parents=True, exist_ok=True)


def resolve_workspace_path(path_text: str) -> Path:
    ensure_workspace()
    base = WORKSPACE.resolve()
    raw = Path(path_text).expanduser()
    candidate = raw.resolve() if raw.is_absolute() else (base / raw).resolve()
    try:
        candidate.relative_to(base)
    except ValueError as exc:
        raise ToolError(f"Path escapes workspace: {path_text}") from exc
    return candidate


def tool_read_file(path: str) -> dict[str, Any]:
    target = resolve_workspace_path(path)
    if not target.is_file():
        raise ToolError(f"Not a file: {path}")
    text = target.read_text(encoding="utf-8")
    return {"ok": True, "path": str(target), "content": text}


def tool_write_file(path: str, content: str) -> dict[str, Any]:
    target = resolve_workspace_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return {"ok": True, "path": str(target), "bytes": len(content.encode("utf-8"))}


def tool_run_shell(command: str, *, yolo: bool) -> dict[str, Any]:
    ensure_workspace()
    print(f"\n[tool request] cwd={WORKSPACE}")
    print(f"[tool request] $ {command}")
    if not yolo:
        answer = input("Run this command? [y/N] ").strip().lower()
        if answer != "y":
            return {"ok": False, "error": "User denied shell command."}

    try:
        completed = subprocess.run(
            command,
            cwd=WORKSPACE,
            shell=True,
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Command timed out after 30 seconds."}

    return {
        "ok": completed.returncode == 0,
        "exit_code": completed.returncode,
        "stdout": completed.stdout[-8000:],
        "stderr": completed.stderr[-8000:],
    }


def execute_tool(call: ToolCall, *, yolo: bool) -> str:
    try:
        if call.name == "read_file":
            result = tool_read_file(**call.arguments)
        elif call.name == "write_file":
            result = tool_write_file(**call.arguments)
        elif call.name == "run_shell":
            result = tool_run_shell(**call.arguments, yolo=yolo)
        else:
            raise ToolError(f"Unknown tool: {call.name}")
    except Exception as exc:
        result = {"ok": False, "error": str(exc)}
    return json.dumps(result, ensure_ascii=False)


def response_text(response: Any, provider: str) -> str:
    if provider == "deepseek":
        return response.choices[0].message.content or ""

    direct = getattr(response, "output_text", None)
    if direct:
        return direct

    chunks: list[str] = []
    for item in getattr(response, "output", []):
        if getattr(item, "type", None) != "message":
            continue
        for part in getattr(item, "content", []):
            if getattr(part, "type", None) == "output_text":
                chunks.append(getattr(part, "text", ""))
    return "".join(chunks)


# DESIGN REASON: main loop
# This is the agent's heartbeat: ask model, parse tool call, execute, append
# observation, repeat until no tool call remains or max_turns stops runaway work.
def run_agent(args: argparse.Namespace) -> int:
    ensure_workspace()
    model = args.model or (
        DEFAULT_DEEPSEEK_MODEL if args.provider == "deepseek" else DEFAULT_OPENAI_MODEL
    )
    history = [user_item(args.task, args.provider)]

    for turn in range(1, args.max_turns + 1):
        request = build_prompt(
            history,
            model=model,
            max_context_items=args.max_context_items,
            provider=args.provider,
        )
        if args.dump_prompt:
            dump_prompt(request)
        if args.dry_run:
            return 0

        print(f"\n--- turn {turn} ---")
        response = call_llm(request, args.provider)
        if args.provider == "deepseek":
            history.append(item_to_dict(response.choices[0].message))
            calls = extract_chat_tool_calls(response)
        else:
            history.extend(item_to_dict(item) for item in response.output)
            calls = extract_function_calls(response)

        if not calls:
            print(response_text(response, args.provider).strip())
            return 0

        for call in calls:
            print(f"[tool call] {call.name}({json.dumps(call.arguments)})")
            output = execute_tool(call, yolo=args.yolo)
            print(f"[tool output] {output}")
            if args.provider == "deepseek":
                history.append({"role": "tool", "tool_call_id": call.call_id, "content": output})
            else:
                history.append({"type": "function_call_output", "call_id": call.call_id, "output": output})

    print(f"Stopped after max_turns={args.max_turns}.")
    return 2


def self_test() -> int:
    ensure_workspace()
    assert parse_text_protocol('<tool name="read_file">{"path":"a.txt"}</tool>')
    assert len(compact_context([{"type": "function_call_output"}] * 5, 2)) <= 2
    assert build_prompt(
        [user_item("hi", "deepseek")],
        model="deepseek-v4-flash",
        max_context_items=4,
        provider="deepseek",
    )["messages"][0]["role"] == "system"
    try:
        resolve_workspace_path("../outside.txt")
    except ToolError:
        pass
    else:
        raise AssertionError("workspace escape was not rejected")
    print("self-test ok")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Teaching-sized SWE agent.")
    parser.add_argument("task", nargs="?", help="Task for the agent.")
    parser.add_argument("--provider", choices=["openai", "deepseek"], default="openai")
    parser.add_argument("--model")
    parser.add_argument("--max-turns", type=int, default=8)
    parser.add_argument("--max-context-items", type=int, default=24)
    parser.add_argument("--dump-prompt", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--yolo", action="store_true", help="Skip shell y/n prompts.")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        args.task = args.task or "self-test"
        return args
    if not args.task:
        args.task = input("Task: ").strip()
    if not args.task:
        raise SystemExit("No task provided.")
    return args


if __name__ == "__main__":
    cli_args = parse_args(sys.argv[1:])
    raise SystemExit(self_test() if cli_args.self_test else run_agent(cli_args))
