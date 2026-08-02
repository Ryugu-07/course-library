from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from schema import parse_scenario  # noqa: E402


class ScaffoldTests(unittest.TestCase):
    def test_verify_scaffold_passes_without_numpy_or_engine(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/verify_scaffold.py"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fixture_schema_is_parseable(self) -> None:
        with (ROOT / "fixtures/tiny_model.json").open(encoding="utf-8") as handle:
            scenario = parse_scenario(json.load(handle))
        self.assertEqual(scenario.scenario_id, "tiny-greedy-batch")
        self.assertEqual(len(scenario.requests), 2)
        self.assertTrue(scenario.platform["win_4060_ti_extension"])

    def test_driver_is_cpu_only_manifest_command(self) -> None:
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--fixture", "fixtures/tiny_model.json"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('"scenario_id": "tiny-greedy-batch"', result.stdout)
        self.assertIn('"numpy_optional": true', result.stdout)


if __name__ == "__main__":
    unittest.main()
