#!/usr/bin/env python3
"""Rebuild every generated course site with its local generator."""

from __future__ import annotations

import argparse
from pathlib import Path
import subprocess
import sys


BUILDERS = {
    "agent-lab": "agent-lab/course/build_course.py",
    "ai-course": "ai-course/build_site.py",
    "auto-course": "auto-course/build_site.py",
    "bio-course": "bio-course/build_site.py",
    "clinic-course": "clinic-course/build_site.py",
    "comfyUI-course": "comfyUI-course/build_site.py",
    "cs-course": "cs-course/build_site.py",
    "grad-math": "grad-math/build_site.py",
    "lang-course": "lang-course/build_site.py",
    "materials-course": "materials-course/build_site.py",
    "math-course": "math-course/build_site.py",
    "mech-course": "mech-course/build_site.py",
    "med-course": "med-course/build_site.py",
    "micro-course": "micro-course/build_site.py",
    "photo-course": "photo-course/build_site.py",
    "physics-course": "physics-course/build_site.py",
    "psych-course": "psych-course/build_site.py",
    "wxb-course": "wxb-course/build_site.py",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "courses",
        nargs="*",
        choices=sorted(BUILDERS),
        help="optional course names; default is all courses",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    selected = args.courses or list(BUILDERS)
    for name in selected:
        builder = root / BUILDERS[name]
        print(f"\n==> Rebuilding {name}", flush=True)
        subprocess.run([sys.executable, builder.name], cwd=builder.parent, check=True)
    print(f"\nPASS: rebuilt {len(selected)} course site(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
