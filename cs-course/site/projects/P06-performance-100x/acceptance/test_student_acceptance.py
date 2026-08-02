from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(
    os.environ.get("RUN_STUDENT_ACCEPTANCE") == "1",
    "student acceptance is opt-in; candidate.c is intentionally a failing stub",
)
class StudentAcceptanceTests(unittest.TestCase):
    def test_candidate_matches_independent_oracle(self) -> None:
        compiler = shutil.which("cc") or shutil.which("clang") or shutil.which("gcc")
        if compiler is None:
            self.skipTest("no C11 compiler available")
        with tempfile.TemporaryDirectory() as directory:
            binary = Path(directory) / "benchmark"
            subprocess.run(
                [compiler, "-std=c11", "-O2", "starter/baseline.c", "starter/candidate.c",
                 "starter/benchmark.c", "-o", str(binary)],
                cwd=ROOT,
                check=True,
            )
            result = subprocess.run([str(binary), "--candidate"], text=True, capture_output=True, check=False)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("correct=1", result.stdout)


if __name__ == "__main__":
    unittest.main()
