"""Fixture driver for the P04 scaffold.

It intentionally offers structural IR output while leaving backend stages to students.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

try:  # Works both as ``python starter/driver.py`` and as a package module.
    from .ir import IRContractError, Module, parse_module, validate_module
except ImportError:  # pragma: no cover - exercised by the documented script command.
    from ir import IRContractError, Module, parse_module, validate_module


def load_fixture(path: Path) -> Module:
    with path.open(encoding="utf-8") as handle:
        payload: dict[str, Any] = json.load(handle)
    return parse_module(payload)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="P04 IR/CFG scaffold driver")
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--dump-ir", action="store_true")
    parser.add_argument("--dump-ssa", action="store_true")
    parser.add_argument("--dump-regalloc", action="store_true")
    args = parser.parse_args(argv)

    try:
        module = load_fixture(args.fixture)
    except (OSError, ValueError, json.JSONDecodeError, IRContractError) as exc:
        parser.error(str(exc))
    errors = validate_module(module)
    if errors:
        parser.error("; ".join(errors))

    if args.dump_ir:
        print(json.dumps(module.to_dict(), ensure_ascii=False, indent=2, sort_keys=True))
    if args.dump_ssa:
        print("SSA: TODO(P04-M2) — scaffold exposes the interface but does not implement it")
    if args.dump_regalloc:
        print("regalloc: TODO(P04-M4) — scaffold exposes the interface but does not implement it")
    if not (args.dump_ir or args.dump_ssa or args.dump_regalloc):
        print(f"loaded module={module.name!r} functions={len(module.functions)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
