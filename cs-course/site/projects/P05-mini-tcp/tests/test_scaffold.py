from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from network import DiscreteNetwork, NetworkConfig  # noqa: E402
from packet import Segment  # noqa: E402


class ScaffoldTests(unittest.TestCase):
    def test_verify_scaffold_passes_with_protocol_todos(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/verify_scaffold.py"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_segment_round_trip(self) -> None:
        original = Segment(seqno=7, ackno=4, window=128, flags=("ACK",), payload=b"abc")
        self.assertEqual(Segment.from_dict(original.to_dict()), original)

    def test_discrete_network_delivers_without_loss(self) -> None:
        network = DiscreteNetwork(NetworkConfig(min_delay_ticks=2, max_delay_ticks=2, seed=3))
        network.send("a", "b", Segment(seqno=0, payload=b"fixture"))
        self.assertEqual(network.advance(1), [])
        deliveries = network.advance(1)
        self.assertEqual(len(deliveries), 1)
        self.assertEqual(deliveries[0].segment.payload, b"fixture")

    def test_driver_reads_machine_fixture(self) -> None:
        with (ROOT / "fixtures/loss_reorder.json").open(encoding="utf-8") as handle:
            scenario = json.load(handle)
        self.assertEqual(scenario["schema_version"], 1)
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--fixture", "fixtures/loss_reorder.json"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('"scenario_id": "loss-reorder-smoke"', result.stdout)


if __name__ == "__main__":
    unittest.main()
