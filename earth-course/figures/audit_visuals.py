#!/usr/bin/env python3
"""Audit the Earth-system visual atlas and its lecture integration."""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN = Path(__file__).with_name("VISUAL_PLAN.md")
ROW_RE = re.compile(r"^\|\s*(\d{2})\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|$", re.MULTILINE)
SVG_NS = "{http://www.w3.org/2000/svg}"


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)


def main() -> int:
    rows = ROW_RE.findall(PLAN.read_text(encoding="utf-8"))
    failures: list[str] = []
    if len(rows) != 28:
        fail(f"visual plan has {len(rows)} page rows; expected 28", failures)

    lecture_files = sorted((ROOT / "lectures").glob("[0-9][0-9]-*.md"))
    lectures = {path.name[:2]: path for path in lecture_files if path.name[:2] != "00"}
    if len(lectures) != 28:
        fail(f"course has {len(lectures)} numbered lectures; expected 28", failures)

    assets_checked = 0
    for chapter, spatial_name, process_name in rows:
        lecture = lectures.get(chapter)
        if lecture is None:
            fail(f"chapter {chapter}: lecture file missing", failures)
            continue
        source = lecture.read_text(encoding="utf-8")
        if source.count('class="diagram visual-atlas"') < 2:
            fail(f"{lecture.name}: fewer than two visual-atlas figures", failures)

        for filename in (spatial_name, process_name):
            if f"assets/img/{filename}" not in source:
                fail(f"{lecture.name}: does not reference {filename}", failures)
            asset = ROOT / "images" / filename
            if not asset.exists():
                fail(f"{filename}: generated asset missing", failures)
                continue
            assets_checked += 1
            try:
                svg = ET.parse(asset).getroot()
            except ET.ParseError as error:
                fail(f"{filename}: invalid XML ({error})", failures)
                continue
            if svg.tag != SVG_NS + "svg":
                fail(f"{filename}: root is not SVG", failures)
            if not svg.get("viewBox"):
                fail(f"{filename}: viewBox missing", failures)
            title = svg.find(SVG_NS + "title")
            desc = svg.find(SVG_NS + "desc")
            if title is None or not "".join(title.itertext()).strip():
                fail(f"{filename}: accessible title missing", failures)
            if desc is None or len("".join(desc.itertext()).strip()) < 20:
                fail(f"{filename}: useful accessible description missing", failures)
            xml_text = asset.read_text(encoding="utf-8")
            if "<script" in xml_text or "<foreignObject" in xml_text:
                fail(f"{filename}: executable or foreign HTML content is forbidden", failures)

    if failures:
        print("Earth visual atlas audit: FAIL")
        for message in failures:
            print(f"- {message}")
        return 1
    print(f"Earth visual atlas audit: PASS (pages={len(rows)}, svg={assets_checked})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
