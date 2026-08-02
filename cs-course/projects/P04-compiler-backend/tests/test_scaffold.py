from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from ir import parse_module, validate_module  # noqa: E402


class ScaffoldTests(unittest.TestCase):
    def test_verify_scaffold_passes_without_backend_implementation(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/verify_scaffold.py"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fixture_is_parseable_and_structurally_valid(self) -> None:
        with (ROOT / "fixtures/branch_loop.json").open(encoding="utf-8") as handle:
            module = parse_module(json.load(handle))
        self.assertEqual(module.name, "branch_loop")
        self.assertEqual(validate_module(module), [])
        self.assertGreaterEqual(len(module.functions[0].blocks), 4)

    def test_driver_can_dump_ir(self) -> None:
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--fixture", "fixtures/branch_loop.json", "--dump-ir"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('"module": "branch_loop"', result.stdout)
        self.assertIn('"successors"', result.stdout)


if __name__ == "__main__":
    unittest.main()
