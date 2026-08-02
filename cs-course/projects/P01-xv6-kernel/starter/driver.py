"""Runnable, implementation-neutral driver for P01 contract fixtures."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REQUIRED_SCENARIO_KEYS = {"id", "area", "kind", "input", "expected_contract", "student_required"}


def load_scenarios(path: Path) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if document.get("schema_version") != 1:
        raise ValueError("unsupported P01 fixture schema")
    scenarios = document.get("scenarios")
    if not isinstance(scenarios, list) or not scenarios:
        raise ValueError("fixture must contain non-empty scenarios")
    for scenario in scenarios:
        missing = REQUIRED_SCENARIO_KEYS - set(scenario)
        if missing:
            raise ValueError(f"scenario {scenario.get('id', '<unknown>')} missing {sorted(missing)}")
    return document


def render_summary(document: dict[str, Any]) -> str:
    lines = [
        f"P01 scaffold driver: {len(document['scenarios'])} contract scenarios",
        "Core kernel hooks are intentionally not called; implement them in xv6-riscv.",
    ]
    for scenario in document["scenarios"]:
        status = "student acceptance" if scenario["student_required"] else "scaffold-only"
        lines.append(f"- {scenario['id']}: {scenario['area']} / {scenario['kind']} ({status})")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=Path, required=True)
    args = parser.parse_args()
    print(render_summary(load_scenarios(args.scenario)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
