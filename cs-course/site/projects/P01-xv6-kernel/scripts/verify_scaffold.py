"""Verify that the intentionally incomplete P01 assignment package is complete."""

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
    "starter/api/__init__.py",
    "starter/api/contract.py",
    "starter/driver.py",
    "starter/xv6_hooks.h",
    "starter/xv6_hooks.c",
    "fixtures/contract_scenarios.json",
    "fixtures/fault_injection.json",
    "tests/scaffold/test_scaffold.py",
    "acceptance/README.md",
)
REQUIRED_HOOKS = {
    "map_user_page",
    "dispatch_syscall",
    "acquire_ordered_lock",
    "recover_transaction",
    "resolve_mmap_fault",
}


def main() -> int:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        print("missing files:", ", ".join(missing), file=sys.stderr)
        return 1

    contract_path = ROOT / "starter/api/contract.py"
    tree = ast.parse(contract_path.read_text(encoding="utf-8"), filename=str(contract_path))
    functions = {node.name for node in tree.body if isinstance(node, ast.FunctionDef)}
    if not REQUIRED_HOOKS <= functions:
        print("missing contract hooks:", sorted(REQUIRED_HOOKS - functions), file=sys.stderr)
        return 1

    scenarios = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
    faults = json.loads((ROOT / "fixtures/fault_injection.json").read_text(encoding="utf-8"))
    if scenarios.get("schema_version") != 1 or not scenarios.get("scenarios"):
        print("invalid contract fixture", file=sys.stderr)
        return 1
    if faults.get("schema_version") != 1 or not faults.get("faults"):
        print("invalid fault fixture", file=sys.stderr)
        return 1

    c_source = (ROOT / "starter/xv6_hooks.c").read_text(encoding="utf-8")
    if "P01_ERR_NOT_IMPLEMENTED" not in c_source or "TODO(student)" not in c_source:
        print("C adapter must retain explicit incomplete markers", file=sys.stderr)
        return 1

    print(f"P01 scaffold OK: {len(scenarios['scenarios'])} contract scenarios, {len(faults['faults'])} faults")
    print("Student-only xv6 acceptance is intentionally not executed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
