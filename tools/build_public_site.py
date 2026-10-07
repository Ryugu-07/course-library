#!/usr/bin/env python3
"""Assemble the generated course sites for static hosting."""

from __future__ import annotations

from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import shutil
import sys
import json
import re


COURSES = (
    "agent-lab",
    "ai-course",
    "auto-course",
    "bio-course",
    "clinic-course",
    "comfyUI-course",
    "cs-course",
    "earth-course",
    "ee-course",
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
HUBS = ("humanities",)

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


def check_packaged_images(output: Path) -> tuple[int, list[str]]:
    """Check actual img src targets inside the deployment tree, not source dirs."""
    class Images(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.sources = []

        def handle_starttag(self, tag, attrs):
            if tag == "img":
                src = dict(attrs).get("src")
                if src:
                    self.sources.append(src)

    output = output.resolve()
    checked, missing = 0, []
    for page in output.rglob("*.html"):
        parser = Images()
        parser.feed(page.read_text(encoding="utf-8"))
        for src in parser.sources:
            parsed = urlsplit(src)
            if parsed.scheme or parsed.netloc:
                continue
            path = unquote(parsed.path)
            target = ((output / path.lstrip("/")) if path.startswith("/") else page.parent / path).resolve()
            checked += 1
            if not target.is_relative_to(output) or not target.is_file():
                missing.append(f"{page.relative_to(output)}: {src}")
    return checked, missing


def hub_files(hub: Path) -> list[Path]:
    """Publish only catalogued reading pages, even if a stale file remains."""
    files = [hub / 'index.html']
    files.extend(p for p in (hub / 'assets').rglob('*') if p.is_file())
    for section in ('history', 'society', 'frontier'):
        catalog = json.loads((hub / 'content' / section / 'catalog.json').read_text(encoding='utf-8'))
        files.append(hub / section / 'index.html')
        for module in catalog['modules']:
            for lesson in module['lessons']:
                if lesson['status'] == 'ready':
                    if not re.fullmatch(r'[a-z0-9-]+', lesson['slug']):
                        raise ValueError(f'Invalid lesson slug in {section}')
                    files.append(hub / section / (lesson['slug'] + '.html'))
    return files


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output = root / "public"

    missing = [name for name in COURSES if not (root / name / "site").is_dir()]
    if missing:
        print(f"ERROR: missing generated site(s): {', '.join(missing)}", file=sys.stderr)
        return 1
    missing_hubs = [name for name in HUBS if not (root / name / "index.html").is_file()]
    if missing_hubs:
        print(f"ERROR: missing hub(s): {', '.join(missing_hubs)}", file=sys.stderr)
        return 1

    hub_sources = {name: hub_files(root / name) for name in HUBS}
    missing_pages = [str(p.relative_to(root)) for files in hub_sources.values() for p in files if not p.is_file()]
    if missing_pages:
        print(f"ERROR: missing generated hub pages: {', '.join(missing_pages)}", file=sys.stderr)
        return 1

    shutil.rmtree(output, ignore_errors=True)
    output.mkdir()
    shutil.copy2(root / "index.html", output / "index.html")

    for name in COURSES:
        destination = output / name / "site"
        destination.parent.mkdir(parents=True)
        shutil.copytree(root / name / "site", destination)

    for name in HUBS:
        # A hub includes editable sources and research notes; publish only its
        # generated pages and reader-facing assets.
        for source in hub_sources[name]:
            destination = output / name / source.relative_to(root / name)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)

    shutil.copy2(
        root / "agent-lab" / "minimal_swe_agent.py",
        output / "agent-lab" / "minimal_swe_agent.py",
    )

    (output / "_headers").write_text(HEADERS, encoding="ascii")

    image_count, missing_images = check_packaged_images(output)
    if missing_images:
        print("ERROR: image targets missing from deployment package:", file=sys.stderr)
        for missing in missing_images:
            print(f"  {missing}", file=sys.stderr)
        return 1
    print(f"PASS: {image_count} local image references resolve inside the deployment package")

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
        f"{len(HUBS)} collection hub(s) in {output}"
    )
    print(f"Files: {len(files):,}; total: {format_mib(total_size)}")
    print(
        f"Largest: {largest.relative_to(output)} "
        f"({format_mib(largest.stat().st_size)})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
