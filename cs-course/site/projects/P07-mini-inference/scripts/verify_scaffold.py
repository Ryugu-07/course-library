#!/usr/bin/env python3
"""Validate P07 schema/interfaces while accepting unfinished inference stages."""

from __future__ import annotations

import inspect
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STARTER = ROOT / "starter"


def fail(message: str) -> None:
    raise AssertionError(message)


def params(method: object) -> list[str]:
    names = list(inspect.signature(method).parameters)
    return names[1:] if names and names[0] == "self" else names


def main() -> int:
    required = [
        "README.md",
        "rubric.md",
        "DESIGN.md",
        "fixtures/tiny_model.json",
        "starter/__init__.py",
        "starter/schema.py",
        "starter/kv_cache.py",
        "starter/scheduler.py",
        "starter/quantization.py",
        "starter/engine.py",
        "starter/numpy_backend.py",
        "starter/driver.py",
        "tests/test_scaffold.py",
        "acceptance/test_student_acceptance.py",
        "scripts/verify_scaffold.py",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required files: {', '.join(missing)}")

    fixture = json.loads((ROOT / "fixtures/tiny_model.json").read_text(encoding="utf-8"))
    for key in ("schema_version", "scenario_id", "model", "kv_cache", "scheduler", "quantization", "requests", "reference", "platform"):
        if key not in fixture:
            fail(f"fixture is missing {key}")
    if fixture["schema_version"] != 1 or not fixture["requests"]:
        fail("fixture schema_version/requests invalid")
    if fixture["kv_cache"]["page_size"] <= 0 or fixture["scheduler"]["max_batch_tokens"] <= 0:
        fail("fixture cache/scheduler budget invalid")
    if not fixture["platform"].get("cpu_required") or not fixture["platform"].get("numpy_optional"):
        fail("fixture must declare CPU required and NumPy optional")
    if not fixture["platform"].get("win_4060_ti_extension"):
        fail("fixture must mark the Win 4060 Ti extension")

    for source_name in ("schema.py", "kv_cache.py", "scheduler.py", "quantization.py", "engine.py", "driver.py"):
        source = (STARTER / source_name).read_text(encoding="utf-8")
        if re.search(r"^\s*(?:from|import)\s+numpy\b", source, re.MULTILINE):
            fail(f"{source_name} must not require a top-level NumPy import")

    sys.path.insert(0, str(STARTER))
    from engine import InferenceEngine  # pylint: disable=import-outside-toplevel
    from kv_cache import KVCacheManager  # pylint: disable=import-outside-toplevel
    from scheduler import ContinuousBatchScheduler  # pylint: disable=import-outside-toplevel
    from schema import parse_scenario  # pylint: disable=import-outside-toplevel

    parse_scenario(fixture)
    signatures = {
        "KVCacheManager.allocate": (["request_id", "token_count"], KVCacheManager.allocate),
        "KVCacheManager.append": (["handle", "key", "value"], KVCacheManager.append),
        "KVCacheManager.read": (["handle", "position"], KVCacheManager.read),
        "KVCacheManager.release": (["handle"], KVCacheManager.release),
        "ContinuousBatchScheduler.submit": (["request"], ContinuousBatchScheduler.submit),
        "ContinuousBatchScheduler.cancel": (["request_id"], ContinuousBatchScheduler.cancel),
        "ContinuousBatchScheduler.step": (["budget_tokens"], ContinuousBatchScheduler.step),
        "InferenceEngine.submit": (["prompt_tokens", "max_tokens", "request_id"], InferenceEngine.submit),
        "InferenceEngine.stream": (["request_id"], InferenceEngine.stream),
        "InferenceEngine.cancel": (["request_id"], InferenceEngine.cancel),
    }
    for name, (expected, method) in signatures.items():
        if params(method) != expected:
            fail(f"{name} signature {params(method)!r} != {expected!r}")
    unfinished = "\n".join(
        (STARTER / name).read_text(encoding="utf-8")
        for name in ("kv_cache.py", "scheduler.py", "quantization.py", "engine.py")
    )
    if "TODO" not in unfinished or "NotImplementedError" not in unfinished:
        fail("core inference stages must remain visibly unfinished in the teacher scaffold")
    print("P07 scaffold: PASS (schema/signatures/optional backend valid; TODO stages accepted)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ImportError, KeyError, TypeError, ValueError) as exc:
        print(f"P07 scaffold: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
