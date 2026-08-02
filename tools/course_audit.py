#!/usr/bin/env python3
"""Dependency-free structural audit for the generated course library."""

from __future__ import annotations

import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


LOCAL_ATTRS = {"href", "src", "poster"}
SKIP_SCHEMES = {"data", "http", "https", "javascript", "mailto", "tel"}
PARAGRAPH_RE = re.compile(r"<p(?:\s[^>]*)?>(.*?)</p>", re.IGNORECASE | re.DOTALL)
RAW_LIST_RE = re.compile(r"(?m)^[ \t]*(?:[-+*]|\d+[.)])[ \t]+")


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[str] = []
        self.images_without_alt = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)
        for name in LOCAL_ATTRS:
            value = values.get(name)
            if value:
                self.refs.append(value)
        if tag == "img" and not values.get("alt"):
            self.images_without_alt += 1


def site_html_files(root: Path) -> list[Path]:
    pages = [root / "index.html"] if (root / "index.html").is_file() else []
    for site in sorted(root.glob("*/site")):
        pages.extend(site.rglob("*.html"))
    return sorted(set(pages))


def is_local_ref(value: str) -> bool:
    if not value or value.startswith("#"):
        return False
    return urlsplit(value).scheme.lower() not in SKIP_SCHEMES


def audit_html(root: Path, details: list[str], counts: Counter[str]) -> None:
    for page in site_html_files(root):
        counts["html"] += 1
        text = page.read_text(encoding="utf-8")
        parser = PageParser()
        try:
            parser.feed(text)
        except Exception as exc:  # HTMLParser errors are rare but should be visible.
            counts["html_parse"] += 1
            details.append(f"HTML parse: {page.relative_to(root)}: {exc}")
            continue

        duplicate_ids = [name for name, n in Counter(parser.ids).items() if n > 1]
        for element_id in duplicate_ids:
            counts["duplicate_id"] += 1
            details.append(f"Duplicate id: {page.relative_to(root)}#{element_id}")

        if parser.images_without_alt:
            counts["img_no_alt"] += parser.images_without_alt
            details.append(
                f"Missing img alt: {page.relative_to(root)} "
                f"({parser.images_without_alt})"
            )

        for ref in parser.refs:
            counts["refs"] += 1
            if not is_local_ref(ref):
                continue
            path = unquote(urlsplit(ref).path)
            if not path:
                continue
            target = (page.parent / path).resolve()
            if not target.exists():
                counts["missing_ref"] += 1
                details.append(f"Missing ref: {page.relative_to(root)} -> {ref}")

        malformed_blocks = []
        for body in PARAGRAPH_RE.findall(text):
            marker_count = len(RAW_LIST_RE.findall(body))
            if marker_count:
                malformed_blocks.append(marker_count)
        if malformed_blocks:
            counts["malformed_list_block"] += len(malformed_blocks)
            counts["malformed_list_item"] += sum(malformed_blocks)
            details.append(
                f"Malformed list: {page.relative_to(root)} "
                f"({len(malformed_blocks)} blocks, {sum(malformed_blocks)} items)"
            )


def audit_svg(root: Path, details: list[str], counts: Counter[str]) -> None:
    for svg in root.rglob("*.svg"):
        if ".git" in svg.parts:
            continue
        counts["svg"] += 1
        try:
            ET.parse(svg)
        except (ET.ParseError, OSError) as exc:
            counts["bad_svg"] += 1
            details.append(f"Invalid SVG: {svg.relative_to(root)}: {exc}")


def audit_workflows(root: Path, details: list[str], counts: Counter[str]) -> None:
    workflow_root = root / "comfyUI-course" / "workflows"
    if not workflow_root.is_dir():
        return
    for path in workflow_root.rglob("*.json"):
        counts["workflow_json"] += 1
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            counts["bad_workflow_json"] += 1
            details.append(f"Invalid workflow JSON: {path.relative_to(root)}: {exc}")
            continue
        if not isinstance(data, (dict, list)):
            counts["bad_workflow_shape"] += 1
            details.append(f"Invalid workflow shape: {path.relative_to(root)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="course-library root",
    )
    parser.add_argument("--max-details", type=int, default=40)
    args = parser.parse_args()

    root = args.root.resolve()
    counts: Counter[str] = Counter()
    details: list[str] = []
    audit_html(root, details, counts)
    audit_svg(root, details, counts)
    audit_workflows(root, details, counts)

    failures = {
        name: counts[name]
        for name in (
            "html_parse",
            "duplicate_id",
            "img_no_alt",
            "missing_ref",
            "malformed_list_block",
            "bad_svg",
            "bad_workflow_json",
            "bad_workflow_shape",
        )
        if counts[name]
    }

    print(
        "Audit summary: "
        f"html={counts['html']} refs={counts['refs']} svg={counts['svg']} "
        f"workflows={counts['workflow_json']} "
        f"malformed_list_items={counts['malformed_list_item']}"
    )
    if failures:
        print("Failures: " + " ".join(f"{name}={value}" for name, value in failures.items()))
        for item in details[: args.max_details]:
            print(f"- {item}")
        remaining = len(details) - args.max_details
        if remaining > 0:
            print(f"- ... {remaining} more detail entries")
        return 1

    print("PASS: generated pages and local assets are structurally valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
