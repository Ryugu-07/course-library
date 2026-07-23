#!/usr/bin/env python3
"""Run the locally available acceptance checks for all twelve labs."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent

COMMANDS = [
    ("L01", ["make", "test"], "L01-cache-blocking"),
    ("L02", ["make", "test"], "L02-shell"),
    ("L03", ["make", "test"], "L03-malloc"),
    ("L04", [sys.executable, "-m", "unittest", "-v"], "L04-interpreter"),
    ("L05", [sys.executable, "-m", "unittest", "-v"], "L05-bplustree"),
    ("L06", [sys.executable, "-m", "unittest", "-v"], "L06-raft"),
    ("L07", ["make", "test"], "L07-simd"),
    ("L08", ["make", "test"], "L08-cuda-reduce"),
    ("L09", ["make", "test"], "L09-attention"),
    ("L10", ["make", "test"], "L10-lockfree"),
    ("L11", ["make", "test"], "L11-rust-ownership"),
    ("L12", [sys.executable, "-m", "unittest", "-v"], "L12-http-server"),
]


def main() -> int:
    failures: list[str] = []
    for label, command, directory in COMMANDS:
        print(f"\n=== {label}: {' '.join(command)} ===", flush=True)
        result = subprocess.run(command, cwd=ROOT / directory, check=False)
        if result.returncode:
            failures.append(label)
    if failures:
        print(f"\nFAILED: {', '.join(failures)}", file=sys.stderr)
        return 1
    print("\nAll locally available lab checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

