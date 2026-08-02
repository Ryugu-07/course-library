"""Load and display the P07 model/request schema without running a model."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

try:
    from .schema import parse_scenario
except ImportError:  # pragma: no cover - script-style imports
    from schema import parse_scenario


def load_fixture(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="P07 schema/manifest scaffold driver")
    parser.add_argument("--fixture", type=Path, required=True)
    args = parser.parse_args(argv)
    scenario = parse_scenario(load_fixture(args.fixture))
    print(
        json.dumps(
            {
                "scenario_id": scenario.scenario_id,
                "model": asdict(scenario.model),
                "requests": [asdict(request) for request in scenario.requests],
                "quantization": asdict(scenario.quantization),
                "platform": scenario.platform,
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
