#!/usr/bin/env python3
"""Rebuild every generated course site with its local generator."""

from __future__ import annotations

import argparse
from pathlib import Path
import re
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
    "earth-course": "earth-course/build_site.py",
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

BUILD_TIME_RE = re.compile(
    rb'(<div class="build-time">\xe6\x9e\x84\xe5\xbb\xba\xe4\xba\x8e )'
    rb'[^<]+'
    rb'(</div>)'
)
BUILD_TIME_SENTINEL = rb"\1__BUILD_TIME__\2"


def generated_pages(site: Path) -> dict[Path, bytes]:
    if not site.is_dir():
        return {}
    return {path: path.read_bytes() for path in site.rglob("*.html")}


def restore_timestamp_only_changes(previous: dict[Path, bytes]) -> int:
    restored = 0
    for path, old_bytes in previous.items():
        if not path.is_file():
            continue
        new_bytes = path.read_bytes()
        if new_bytes == old_bytes:
            continue
        old_stable = BUILD_TIME_RE.sub(BUILD_TIME_SENTINEL, old_bytes)
        new_stable = BUILD_TIME_RE.sub(BUILD_TIME_SENTINEL, new_bytes)
        if old_stable == new_stable:
            path.write_bytes(old_bytes)
            restored += 1
    return restored


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
        previous = generated_pages(builder.parent / "site")
        print(f"\n==> Rebuilding {name}", flush=True)
        subprocess.run([sys.executable, builder.name], cwd=builder.parent, check=True)
        restored = restore_timestamp_only_changes(previous)
        if restored:
            print(f"Preserved timestamps on {restored} unchanged page(s)")
    print(f"\nPASS: rebuilt {len(selected)} course site(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
