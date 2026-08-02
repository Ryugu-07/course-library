"""Replay a minimal packet through the P05 discrete network harness."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

try:
    from .network import DiscreteNetwork, NetworkConfig
    from .packet import Segment
except ImportError:  # pragma: no cover - script-style imports
    from network import DiscreteNetwork, NetworkConfig
    from packet import Segment


def load_scenario(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        scenario = json.load(handle)
    if scenario.get("schema_version") != 1:
        raise ValueError("scenario schema_version must be 1")
    return scenario


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="P05 discrete network scaffold driver")
    parser.add_argument("--fixture", type=Path, required=True)
    args = parser.parse_args(argv)
    scenario = load_scenario(args.fixture)
    config = NetworkConfig.from_mapping(scenario["network"])
    network = DiscreteNetwork(config)
    segment = Segment(seqno=0, window=4096, payload=bytes.fromhex(scenario["payload_hex"]))
    network.send("sender", "receiver", segment)
    deliveries = network.drain(max_ticks=config.max_delay_ticks + 2)
    print(
        json.dumps(
            {
                "scenario_id": scenario["scenario_id"],
                "deliveries": [
                    {"now": item.now, "src": item.src, "dst": item.dst, "segment": item.segment.to_dict()}
                    for item in deliveries
                ],
                "stats": network.stats,
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
