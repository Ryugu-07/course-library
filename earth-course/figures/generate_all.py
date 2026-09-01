#!/usr/bin/env python3
"""Regenerate every static figure in the Earth-system visual atlas."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SCRIPTS = [
    "generate_intro.py",
    "generate_01_07.py",
    "generate_08_14.py",
    "generate_15_21.py",
    "generate_22_28.py",
]


def main() -> int:
    missing = [name for name in SCRIPTS if not (ROOT / name).exists()]
    if missing:
        print("Missing visual generators: " + ", ".join(missing), file=sys.stderr)
        return 1
    for name in SCRIPTS:
        subprocess.run([sys.executable, str(ROOT / name)], cwd=ROOT, check=True)
    subprocess.run([sys.executable, str(ROOT / "audit_visuals.py")], cwd=ROOT, check=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
