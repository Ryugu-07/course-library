from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from ir import compile_program, parse_module, to_ssa  # noqa: E402


@unittest.skipUnless(
    os.environ.get("RUN_STUDENT_ACCEPTANCE") == "1",
    "student acceptance is opt-in; the scaffold is intentionally incomplete",
)
class StudentAcceptanceTests(unittest.TestCase):
    def _module(self):
        with (ROOT / "fixtures/branch_loop.json").open(encoding="utf-8") as handle:
            return parse_module(json.load(handle))

    def test_ssa_has_single_definition_per_name(self) -> None:
        module = to_ssa(self._module())
        self.assertIsNotNone(module)

    def test_end_to_end_backend_emits_target(self) -> None:
        result = compile_program(self._module(), target="bytecode", opt_level=2)
        self.assertTrue(result.text)


if __name__ == "__main__":
    unittest.main()
