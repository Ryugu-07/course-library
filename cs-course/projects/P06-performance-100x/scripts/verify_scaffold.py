#!/usr/bin/env python3
"""Validate the P06 C baseline/harness contract without requiring candidate correctness."""

from __future__ import annotations

import json
import re
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
        "Makefile",
        "fixtures/stencil.json",
        "starter/benchmark.h",
        "starter/baseline.c",
        "starter/candidate.c",
        "starter/benchmark.c",
        "tests/test_scaffold.py",
        "acceptance/test_student_acceptance.py",
        "scripts/verify_scaffold.py",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required files: {', '.join(missing)}")

    fixture = json.loads((ROOT / "fixtures/stencil.json").read_text(encoding="utf-8"))
    if fixture.get("schema_version") != 1 or fixture.get("workload") != "stencil5":
        fail("fixture must describe schema_version=1 workload=stencil5")
    for key in ("width", "height", "steps", "seed", "correctness", "benchmark"):
        if key not in fixture:
            fail(f"fixture is missing {key}")
    if min(fixture["width"], fixture["height"]) <= 0 or fixture["steps"] < 0:
        fail("fixture dimensions/steps are invalid")
    correctness = fixture["correctness"]
    if not correctness.get("must_match_oracle") or not correctness.get("must_touch_output"):
        fail("fixture must require independent oracle and output work")
    targets = fixture["benchmark"].get("targets", {})
    if [targets.get(name) for name in ("passing", "strong", "exceptional")] != [20.0, 50.0, 100.0]:
        fail("benchmark targets must expose 20x/50x/100x tiers")

    header = (STARTER / "benchmark.h").read_text(encoding="utf-8")
    for symbol in ("baseline_stencil", "student_stencil", "run_benchmark", "digest_grid", "BenchmarkResult"):
        if symbol not in header:
            fail(f"benchmark.h is missing {symbol}")
    baseline = (STARTER / "baseline.c").read_text(encoding="utf-8")
    harness = (STARTER / "benchmark.c").read_text(encoding="utf-8")
    candidate = (STARTER / "candidate.c").read_text(encoding="utf-8")
    if "baseline_stencil" not in baseline or "student_stencil" not in candidate:
        fail("baseline/candidate entry points are missing")
    for marker in ("oracle", "max_abs_error", "work_units", "digest_grid", "correct"):
        if marker not in harness:
            fail(f"benchmark harness lacks anti-cheating marker {marker}")
    if "TODO" not in candidate or "return -1" not in candidate:
        fail("candidate must remain an explicit unfinished stub")
    if re.search(r"#include\s*[<\"](?:cuda|omp)\.h", candidate):
        fail("the default candidate stub must not impose GPU/OpenMP dependencies")
    print("P06 scaffold: PASS (C baseline/harness/fixture valid; candidate TODO accepted)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ImportError, KeyError, TypeError, ValueError) as exc:
        print(f"P06 scaffold: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
