"""Verify the incomplete P03 assignment package without executing consensus."""

from __future__ import annotations

import ast
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "README.md",
    "rubric.md",
    "DESIGN.md",
    "starter/__init__.py",
    "starter/protocol.py",
    "starter/transport.py",
    "starter/driver.py",
    "fixtures/contract_scenarios.json",
    "fixtures/linearizability_history.json",
    "tests/scaffold/test_scaffold.py",
    "acceptance/README.md",
)


def main() -> int:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        print("missing files:", ", ".join(missing), file=sys.stderr)
        return 1

    protocol_path = ROOT / "starter/protocol.py"
    tree = ast.parse(protocol_path.read_text(encoding="utf-8"), filename=str(protocol_path))
    classes = {node.name: node for node in tree.body if isinstance(node, ast.ClassDef)}
    required_classes = {"RaftNode", "Persister", "TodoKV", "ApplyMsg", "ShardConfig", "ShardTransfer"}
    if not required_classes <= set(classes):
        print("missing protocol classes:", sorted(required_classes - set(classes)), file=sys.stderr)
        return 1
    raft_methods = {
        node.name for node in classes["RaftNode"].body if isinstance(node, ast.FunctionDef)
    }
    if not {"start", "tick", "receive", "read_index", "restore"} <= raft_methods:
        print("missing Raft method contract", file=sys.stderr)
        return 1

    fixture = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
    history = json.loads((ROOT / "fixtures/linearizability_history.json").read_text(encoding="utf-8"))
    if fixture.get("schema_version") != 1 or len(fixture.get("nodes", [])) < 3 or not fixture.get("events"):
        print("invalid contract fixture", file=sys.stderr)
        return 1
    if history.get("schema_version") != 1 or not history.get("operations"):
        print("invalid history fixture", file=sys.stderr)
        return 1

    source = protocol_path.read_text(encoding="utf-8")
    if "NotImplementedFeature" not in source or "TODO(student)" not in source:
        print("consensus TODO markers missing; starter must remain incomplete", file=sys.stderr)
        return 1

    print(f"P03 scaffold OK: {len(fixture['nodes'])} nodes, {len(fixture['events'])} events")
    print("Student-only Raft/KV acceptance is intentionally not executed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
