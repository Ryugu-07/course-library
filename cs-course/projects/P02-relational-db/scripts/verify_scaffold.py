"""Verify the incomplete P02 assignment package without running database logic."""

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
    "starter/sql_ast.py",
    "starter/driver.py",
    "fixtures/contract_scenarios.json",
    "fixtures/recovery_faults.json",
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
    names = {node.name for node in tree.body if isinstance(node, (ast.FunctionDef, ast.ClassDef))}
    required_names = {"StorageEngine", "TransactionManager", "Wal", "TodoDatabase", "validate_schema"}
    if not required_names <= names:
        print("missing protocol declarations:", sorted(required_names - names), file=sys.stderr)
        return 1

    sql_path = ROOT / "starter/sql_ast.py"
    sql_tree = ast.parse(sql_path.read_text(encoding="utf-8"), filename=str(sql_path))
    if "parse_sql" not in {node.name for node in sql_tree.body if isinstance(node, ast.FunctionDef)}:
        print("missing parse_sql contract", file=sys.stderr)
        return 1

    fixture = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
    faults = json.loads((ROOT / "fixtures/recovery_faults.json").read_text(encoding="utf-8"))
    if fixture.get("schema_version") != 1 or not fixture.get("schemas") or not fixture.get("scenarios"):
        print("invalid contract fixture", file=sys.stderr)
        return 1
    if faults.get("schema_version") != 1 or not faults.get("faults"):
        print("invalid recovery fixture", file=sys.stderr)
        return 1

    source = protocol_path.read_text(encoding="utf-8") + sql_path.read_text(encoding="utf-8")
    if "NotImplementedFeature" not in source or "TODO(student)" not in source:
        print("core TODO markers missing; starter must remain incomplete", file=sys.stderr)
        return 1

    print(f"P02 scaffold OK: {len(fixture['scenarios'])} contract scenarios, {len(faults['faults'])} faults")
    print("Student-only database acceptance is intentionally not executed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
