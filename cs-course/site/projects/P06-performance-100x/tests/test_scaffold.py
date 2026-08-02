from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ScaffoldTests(unittest.TestCase):
    def test_verify_scaffold_passes_with_candidate_todo(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/verify_scaffold.py"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_c_scaffold_syntax_and_baseline_smoke(self) -> None:
        compiler = shutil.which("cc") or shutil.which("clang") or shutil.which("gcc")
        if compiler is None:
            self.skipTest("no C11 compiler available")
        with tempfile.TemporaryDirectory() as directory:
            binary = Path(directory) / "benchmark"
            compile_result = subprocess.run(
                [compiler, "-std=c11", "-Wall", "-Wextra", "-Wpedantic", "-Werror",
                 "starter/baseline.c", "starter/candidate.c", "starter/benchmark.c", "-o", str(binary)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(compile_result.returncode, 0, compile_result.stdout + compile_result.stderr)
            run_result = subprocess.run([str(binary), "--baseline"], text=True, capture_output=True, check=False)
            self.assertEqual(run_result.returncode, 0, run_result.stdout + run_result.stderr)
            self.assertIn("correct=1", run_result.stdout)


if __name__ == "__main__":
    unittest.main()
