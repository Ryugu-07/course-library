#!/usr/bin/env python3
"""Check P04's teacher scaffold without requiring any student backend pass.

This checker is intentionally strict about files, signatures, and fixture shape, but treats
TODO/NotImplemented markers as valid starter state and exits zero for that state.
"""

from __future__ import annotations

import inspect
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STARTER = ROOT / "starter"


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> int:
    required = [
        "README.md",
        "rubric.md",
        "DESIGN.md",
        "fixtures/branch_loop.json",
        "starter/__init__.py",
        "starter/ir.py",
        "starter/driver.py",
        "tests/test_scaffold.py",
        "acceptance/test_student_acceptance.py",
        "scripts/verify_scaffold.py",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required files: {', '.join(missing)}")

    fixture = json.loads((ROOT / "fixtures/branch_loop.json").read_text(encoding="utf-8"))
    if fixture.get("schema_version") != 1 or not fixture.get("functions"):
        fail("fixture must have schema_version=1 and a non-empty functions list")
    for function in fixture["functions"]:
        if not function.get("name") or not function.get("entry") or not function.get("blocks"):
            fail("each fixture function needs name, entry, and blocks")
        names = {block.get("name") for block in function["blocks"]}
        if function["entry"] not in names:
            fail("fixture entry must name a block")
        for block in function["blocks"]:
            if not block.get("name") or not isinstance(block.get("instructions"), list):
                fail("each fixture block needs name and instructions")
            if not isinstance(block.get("successors"), list):
                fail("each fixture block needs a successors list")
            if any(successor not in names for successor in block["successors"]):
                fail("fixture contains an unknown successor")

    sys.path.insert(0, str(STARTER))
    from ir import (  # pylint: disable=import-outside-toplevel
        allocate_registers,
        compile_program,
        emit,
        optimize,
        parse_module,
        to_ssa,
        validate_module,
    )

    module = parse_module(fixture)
    if validate_module(module):
        fail("the public fixture must pass structural validation")
    signatures = {
        "parse_module": ["payload"],
        "validate_module": ["module"],
        "to_ssa": ["module"],
        "optimize": ["module", "passes"],
        "allocate_registers": ["module", "registers"],
        "emit": ["module", "target"],
        "compile_program": ["module", "target", "opt_level"],
    }
    functions = {
        "parse_module": parse_module,
        "validate_module": validate_module,
        "to_ssa": to_ssa,
        "optimize": optimize,
        "allocate_registers": allocate_registers,
        "emit": emit,
        "compile_program": compile_program,
    }
    for name, expected in signatures.items():
        actual = list(inspect.signature(functions[name]).parameters)
        if actual != expected:
            fail(f"{name} signature {actual!r} does not match {expected!r}")

    ir_source = (STARTER / "ir.py").read_text(encoding="utf-8")
    if "TODO" not in ir_source or "NotImplementedError" not in ir_source:
        fail("backend stages must remain visibly unfinished in the teacher scaffold")
    print("P04 scaffold: PASS (structure/signatures/fixture valid; TODO stages accepted)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ImportError, KeyError, TypeError, ValueError) as exc:
        print(f"P04 scaffold: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
