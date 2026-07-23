#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
cases = sorted((ROOT / "compile_fail").glob("*.rs"))
assert len(cases) == 4, f"expected four compile-fail puzzles, found {len(cases)}"
for case in cases:
    first_line = case.read_text().splitlines()[0]
    assert first_line.startswith("// expected:"), f"{case.name} lacks expected diagnostic"

rustc = shutil.which("rustc")
cargo = shutil.which("cargo")
if not rustc or not cargo:
    print("Rust toolchain unavailable: structure PASS, compile checks SKIPPED")
    raise SystemExit(0)

for case in cases:
    result = subprocess.run(
        [rustc, "--edition=2021", str(case), "-o", str(case.with_suffix(".out"))],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        raise SystemExit(f"{case.name} unexpectedly compiled")
    case.with_suffix(".out").unlink(missing_ok=True)
    print(f"{case.name}: rejected as expected")

subprocess.run([cargo, "test", "--quiet"], cwd=ROOT, check=True)
print("Rust ownership acceptance: PASS")
