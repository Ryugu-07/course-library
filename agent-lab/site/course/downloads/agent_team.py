#!/usr/bin/env python3
"""Agent Team course project: dependency scheduling and write-conflict detection."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class TaskSpec:
    id: str
    role: str
    goal: str
    depends_on: tuple[str, ...] = ()
    read_scope: tuple[str, ...] = ()
    write_scope: tuple[str, ...] = ()
    acceptance: tuple[str, ...] = ()
    required: bool = True


@dataclass
class Event:
    seq: int
    type: str
    task_id: str | None = None
    data: dict = field(default_factory=dict)


class ScheduleError(Exception):
    pass


class Orchestrator:
    def __init__(self, tasks: Iterable[TaskSpec], mode: str = "worktrees"):
        self.tasks = {task.id: task for task in tasks}
        self.mode = mode
        self.events: list[Event] = []
        self._seq = 0
        self._validate_graph()

    def emit(self, event_type: str, task_id: str | None = None, **data) -> None:
        self._seq += 1
        self.events.append(Event(self._seq, event_type, task_id, data))

    def _validate_graph(self) -> None:
        for task in self.tasks.values():
            missing = set(task.depends_on) - self.tasks.keys()
            if missing:
                raise ScheduleError(f"{task.id} depends on missing tasks: {sorted(missing)}")
            if task.id in task.depends_on:
                raise ScheduleError(f"{task.id} depends on itself")
        self.layers()

    def layers(self) -> list[list[TaskSpec]]:
        remaining = set(self.tasks)
        completed: set[str] = set()
        layers: list[list[TaskSpec]] = []
        while remaining:
            ready = sorted(
                [self.tasks[task_id] for task_id in remaining if set(self.tasks[task_id].depends_on) <= completed],
                key=lambda task: task.id,
            )
            if not ready:
                raise ScheduleError(f"Dependency cycle among: {sorted(remaining)}")
            layers.append(ready)
            completed.update(task.id for task in ready)
            remaining -= completed
        return layers

    @staticmethod
    def conflicts(tasks: Iterable[TaskSpec]) -> list[tuple[str, str, str]]:
        task_list = list(tasks)
        conflicts: list[tuple[str, str, str]] = []
        for index, left in enumerate(task_list):
            for right in task_list[index + 1 :]:
                for left_path in left.write_scope:
                    for right_path in right.write_scope:
                        if paths_overlap(left_path, right_path):
                            conflicts.append((left.id, right.id, common_prefix(left_path, right_path)))
        return conflicts

    def plan(self) -> list[list[TaskSpec]]:
        layers = self.layers()
        self.emit("thread.started", mode=self.mode, task_count=len(self.tasks))
        for index, layer in enumerate(layers, start=1):
            conflicts = self.conflicts(layer)
            self.emit(
                "schedule.layer",
                layer=index,
                tasks=[task.id for task in layer],
                conflicts=conflicts,
            )
            if conflicts and self.mode == "parallel":
                raise ScheduleError(f"Unsafe parallel write conflict in layer {index}: {conflicts}")
            if conflicts and self.mode == "worktrees":
                self.emit("merge.risk", layer=index, conflicts=conflicts)
        return layers

    def simulate(self) -> list[Event]:
        layers = self.plan()
        for layer_number, layer in enumerate(layers, start=1):
            for task in layer:
                environment = f"worktree/{task.id}" if self.mode == "worktrees" and task.write_scope else "shared-readonly"
                self.emit(
                    "task.started",
                    task.id,
                    role=task.role,
                    environment=environment,
                    goal=task.goal,
                )
                self.emit(
                    "task.completed",
                    task.id,
                    acceptance=list(task.acceptance),
                    evidence=[f"simulated:{item}" for item in task.acceptance],
                )
            self.emit("schedule.layer_completed", layer=layer_number)
        if self.mode == "worktrees":
            write_tasks = [task.id for task in self.tasks.values() if task.write_scope]
            self.emit("integration.started", branches=write_tasks)
            self.emit("integration.completed", checks=["api tests", "frontend tests", "review"])
        self.emit("thread.completed", status="completed")
        return self.events


def paths_overlap(left: str, right: str) -> bool:
    left_norm = left.strip("/")
    right_norm = right.strip("/")
    return left_norm == right_norm or left_norm.startswith(right_norm + "/") or right_norm.startswith(left_norm + "/")


def common_prefix(left: str, right: str) -> str:
    left_parts = Path(left).parts
    right_parts = Path(right).parts
    common: list[str] = []
    for a, b in zip(left_parts, right_parts):
        if a != b:
            break
        common.append(a)
    return str(Path(*common)) if common else "."


def demo_tasks(include_conflict: bool = False) -> list[TaskSpec]:
    tasks = [
        TaskSpec(
            "explore-api",
            "Explorer",
            "Find the current API error contract.",
            read_scope=("server/", "tests/"),
            acceptance=("API entry and tests identified",),
        ),
        TaskSpec(
            "explore-ui",
            "Explorer",
            "Find the form rendering and browser checks.",
            read_scope=("web/",),
            acceptance=("UI entry and tests identified",),
        ),
        TaskSpec(
            "api-contract",
            "Coordinator",
            "Decide the shared field-error schema.",
            depends_on=("explore-api", "explore-ui"),
            read_scope=("server/", "web/"),
            write_scope=("shared/schema.json",),
            acceptance=("schema decision recorded",),
        ),
        TaskSpec(
            "implement-api",
            "Implementer",
            "Return field-level errors from the API.",
            depends_on=("api-contract",),
            read_scope=("shared/schema.json", "server/"),
            write_scope=("server/",),
            acceptance=("API tests pass",),
        ),
        TaskSpec(
            "implement-ui",
            "Implementer",
            "Render field-level errors in the form.",
            depends_on=("api-contract",),
            read_scope=("shared/schema.json", "web/"),
            write_scope=("web/",),
            acceptance=("frontend tests pass", "mobile check passes"),
        ),
        TaskSpec(
            "integration-test",
            "Tester",
            "Verify the merged API and UI behavior.",
            depends_on=("implement-api", "implement-ui"),
            read_scope=("server/", "web/", "shared/"),
            acceptance=("integration tests pass",),
        ),
        TaskSpec(
            "review",
            "Reviewer",
            "Review the final diff against the requirement.",
            depends_on=("integration-test",),
            read_scope=(".",),
            acceptance=("no P0 or P1 findings",),
        ),
    ]
    if include_conflict:
        tasks.append(
            TaskSpec(
                "conflicting-api-edit",
                "Implementer",
                "Alternative change that also edits the server.",
                depends_on=("api-contract",),
                read_scope=("server/",),
                write_scope=("server/auth.py",),
                acceptance=("alternative test passes",),
                required=False,
            )
        )
    return tasks


def load_tasks(path: Path) -> list[TaskSpec]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [
        TaskSpec(
            id=item["id"],
            role=item["role"],
            goal=item["goal"],
            depends_on=tuple(item.get("depends_on", [])),
            read_scope=tuple(item.get("read_scope", [])),
            write_scope=tuple(item.get("write_scope", [])),
            acceptance=tuple(item.get("acceptance", [])),
            required=item.get("required", True),
        )
        for item in raw
    ]


def print_events(events: Iterable[Event]) -> None:
    for event in events:
        print(json.dumps(asdict(event), ensure_ascii=False))


def self_test() -> int:
    orchestrator = Orchestrator(demo_tasks(), mode="worktrees")
    layers = orchestrator.layers()
    assert [task.id for task in layers[0]] == ["explore-api", "explore-ui"]
    assert any(task.id == "api-contract" for task in layers[1])
    events = orchestrator.simulate()
    assert events[-1].type == "thread.completed"

    conflict_tasks = demo_tasks(include_conflict=True)
    try:
        Orchestrator(conflict_tasks, mode="parallel").plan()
    except ScheduleError as exc:
        assert "conflict" in str(exc).lower()
    else:
        raise AssertionError("parallel write conflict was not rejected")

    worktree = Orchestrator(conflict_tasks, mode="worktrees")
    worktree.plan()
    assert any(event.type == "merge.risk" for event in worktree.events)

    cycle = [
        TaskSpec("a", "Explorer", "a", depends_on=("b",)),
        TaskSpec("b", "Explorer", "b", depends_on=("a",)),
    ]
    try:
        Orchestrator(cycle)
    except ScheduleError:
        pass
    else:
        raise AssertionError("dependency cycle was not rejected")
    print("agent_team self-test ok")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tasks", type=Path, help="JSON TaskSpec list. Uses demo tasks when omitted.")
    parser.add_argument("--mode", choices=["single", "parallel", "worktrees"], default="worktrees")
    parser.add_argument("--include-conflict", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args(sys.argv[1:])
    if args.self_test:
        raise SystemExit(self_test())
    specs = load_tasks(args.tasks) if args.tasks else demo_tasks(args.include_conflict)
    try:
        print_events(Orchestrator(specs, mode=args.mode).simulate())
    except ScheduleError as exc:
        print(json.dumps({"status": "blocked", "reason": str(exc)}, ensure_ascii=False))
        raise SystemExit(2)
