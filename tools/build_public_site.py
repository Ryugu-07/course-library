#!/usr/bin/env python3
"""Assemble the generated course sites for static hosting."""

from __future__ import annotations

from pathlib import Path
import shutil
import sys


COURSES = (
    "agent-lab",
    "ai-course",
    "auto-course",
    "bio-course",
    "clinic-course",
    "comfyUI-course",
    "cs-course",
    "grad-math",
    "lang-course",
    "materials-course",
    "math-course",
    "mech-course",
    "med-course",
    "micro-course",
    "photo-course",
    "physics-course",
    "psych-course",
    "wxb-course",
)

INTERACTIVE_EDITIONS = (
    "eli5",
)

MAX_FILES = 20_000
MAX_FILE_BYTES = 25 * 1024 * 1024

HEADERS = """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN

/*.html
  Cache-Control: public, max-age=0, must-revalidate
"""


def format_mib(size: int) -> str:
    return f"{size / (1024 * 1024):.2f} MiB"


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output = root / "public"

    missing = [name for name in COURSES if not (root / name / "site").is_dir()]
    if missing:
        print(f"ERROR: missing generated site(s): {', '.join(missing)}", file=sys.stderr)
        return 1

    missing_editions = [name for name in INTERACTIVE_EDITIONS if not (root / name).is_dir()]
    if missing_editions:
        print(
            f"ERROR: missing interactive edition(s): {', '.join(missing_editions)}",
            file=sys.stderr,
        )
        return 1

    shutil.rmtree(output, ignore_errors=True)
    output.mkdir()
    shutil.copy2(root / "index.html", output / "index.html")

    for name in COURSES:
        destination = output / name / "site"
        destination.parent.mkdir(parents=True)
        shutil.copytree(root / name / "site", destination)

    for name in INTERACTIVE_EDITIONS:
        shutil.copytree(root / name, output / name)

    shutil.copy2(
        root / "agent-lab" / "minimal_swe_agent.py",
        output / "agent-lab" / "minimal_swe_agent.py",
    )

    (output / "_headers").write_text(HEADERS, encoding="ascii")

    files = [path for path in output.rglob("*") if path.is_file()]
    largest = max(files, key=lambda path: path.stat().st_size)
    total_size = sum(path.stat().st_size for path in files)

    if len(files) > MAX_FILES:
        print(f"ERROR: {len(files):,} files exceeds the {MAX_FILES:,} file limit", file=sys.stderr)
        return 1
    if largest.stat().st_size > MAX_FILE_BYTES:
        relative = largest.relative_to(output)
        print(
            f"ERROR: {relative} is {format_mib(largest.stat().st_size)}; "
            f"the limit is {format_mib(MAX_FILE_BYTES)}",
            file=sys.stderr,
        )
        return 1

    print(
        f"PASS: assembled {len(COURSES)} course sites and "
        f"{len(INTERACTIVE_EDITIONS)} interactive edition in {output}"
    )
    print(f"Files: {len(files):,}; total: {format_mib(total_size)}")
    print(
        f"Largest: {largest.relative_to(output)} "
        f"({format_mib(largest.stat().st_size)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
