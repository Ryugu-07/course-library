#!/usr/bin/env python3
"""Audit generated pages, local references, and lecture-source hygiene."""

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
SKIP_TEXT_TAGS = {"code", "pre", "script", "style"}
PARAGRAPH_RE = re.compile(r"<p(?:\s[^>]*)?>(.*?)</p>", re.IGNORECASE | re.DOTALL)
RAW_LIST_RE = re.compile(r"(?m)^[ \t]*(?:[-+*]|\d+[.)])[ \t]+")
ALLOWED_SOURCE_CONTROLS = {"\n", "\r"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[str] = []
        self.images_without_alt = 0
        self.raw_dollar_text: list[str] = []
        self.learning_page_markers = 0
        self.learning_layers = 0
        self.learning_labs: list[str] = []
        self.script_srcs: list[str] = []
        self.stylesheet_hrefs: list[str] = []
        self._skip_text_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in SKIP_TEXT_TAGS:
            self._skip_text_depth += 1
        values = dict(attrs)
        if "data-learning-page" in values:
            self.learning_page_markers += 1
        lab_name = values.get("data-learning-lab")
        if lab_name:
            self.learning_labs.append(lab_name)
        classes = set((values.get("class") or "").split())
        if "learning-layer" in classes:
            self.learning_layers += 1
        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)
        for name in LOCAL_ATTRS:
            value = values.get(name)
            if value:
                self.refs.append(value)
        if tag == "img" and not values.get("alt"):
            self.images_without_alt += 1
        if tag == "script" and values.get("src"):
            self.script_srcs.append(values["src"])
        if (
            tag == "link"
            and "stylesheet" in (values.get("rel") or "").split()
            and values.get("href")
        ):
            self.stylesheet_hrefs.append(values["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag in SKIP_TEXT_TAGS and self._skip_text_depth:
            self._skip_text_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_text_depth or "$" not in data:
            return
        snippet = " ".join(data.split())
        if snippet:
            self.raw_dollar_text.append(snippet[:120])


def site_html_files(root: Path) -> list[Path]:
    pages = [root / "index.html"] if (root / "index.html").is_file() else []
    for site in sorted(root.glob("*/site")):
        pages.extend(site.rglob("*.html"))
    return sorted(set(pages))


def lecture_source_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for lecture_dir in sorted(root.glob("*/lectures")):
        files.extend(lecture_dir.rglob("*.md"))
    return sorted(set(files))


def audit_source_text(root: Path, details: list[str], counts: Counter[str]) -> None:
    """Reject C0 controls that commonly come from accidentally escaped LaTeX."""
    for path in lecture_source_files(root):
        counts["source_docs"] += 1
        text = path.read_text(encoding="utf-8")
        for index, character in enumerate(text):
            codepoint = ord(character)
            if (codepoint >= 32 and codepoint != 127) or character in ALLOWED_SOURCE_CONTROLS:
                continue
            counts["source_control_character"] += 1
            line = text.count("\n", 0, index) + 1
            details.append(
                f"Source control character: {path.relative_to(root)}:{line} "
                f"(U+{codepoint:04X})"
            )
        for line_number, source_line in enumerate(text.splitlines(), 1):
            for command_name in ("qquad", "quad"):
                start = 0
                while True:
                    command = source_line.find(command_name, start)
                    if command < 0:
                        break
                    before = source_line[command - 1] if command else ""
                    after_index = command + len(command_name)
                    after = source_line[after_index] if after_index < len(source_line) else ""
                    has_word_boundaries = not (before.isalnum() or before == "_") and not (
                        after.isalnum() or after == "_"
                    )
                    if has_word_boundaries and before != "\\":
                        counts["source_bare_latex_command"] += 1
                        details.append(
                            f"Bare LaTeX command: {path.relative_to(root)}:{line_number} "
                            f"({command_name} is missing its backslash)"
                        )
                    start = after_index


def is_local_ref(value: str) -> bool:
    if not value or value.startswith("#"):
        return False
    return urlsplit(value).scheme.lower() not in SKIP_SCHEMES


def has_asset(refs: list[str], suffix: str) -> bool:
    return any(unquote(urlsplit(ref).path).endswith(suffix) for ref in refs)


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

        for snippet in parser.raw_dollar_text:
            counts["raw_math_delimiter"] += 1
            details.append(
                f"Unrendered math delimiter: {page.relative_to(root)}: {snippet}"
            )

        if parser.learning_page_markers or parser.learning_labs:
            counts["learning_pages"] += 1
            counts["learning_labs"] += len(parser.learning_labs)
            contract_errors = []
            if parser.learning_page_markers != 1:
                contract_errors.append(
                    f"expected one data-learning-page marker, got "
                    f"{parser.learning_page_markers}"
                )
            if parser.learning_layers != 1:
                contract_errors.append(
                    f"expected one learning-layer section, got {parser.learning_layers}"
                )
            if not has_asset(parser.script_srcs, "assets/learning/learning.js"):
                contract_errors.append("missing learning.js")
            if not has_asset(
                parser.stylesheet_hrefs, "assets/learning/learning.css"
            ):
                contract_errors.append("missing learning.css")
            for lab_name in sorted(set(parser.learning_labs)):
                if not has_asset(
                    parser.script_srcs, f"assets/learning/labs/{lab_name}.js"
                ):
                    contract_errors.append(f"missing lab script for {lab_name}")
            for error in contract_errors:
                counts["learning_contract"] += 1
                details.append(
                    f"Learning contract: {page.relative_to(root)}: {error}"
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
    audit_source_text(root, details, counts)
    audit_html(root, details, counts)
    audit_svg(root, details, counts)
    audit_workflows(root, details, counts)

    failures = {
        name: counts[name]
        for name in (
            "html_parse",
            "duplicate_id",
            "img_no_alt",
            "raw_math_delimiter",
            "missing_ref",
            "malformed_list_block",
            "bad_svg",
            "bad_workflow_json",
            "bad_workflow_shape",
            "learning_contract",
            "source_control_character",
            "source_bare_latex_command",
        )
        if counts[name]
    }

    print(
        "Audit summary: "
        f"sources={counts['source_docs']} html={counts['html']} "
        f"refs={counts['refs']} svg={counts['svg']} "
        f"workflows={counts['workflow_json']} "
        f"learning_pages={counts['learning_pages']} "
        f"learning_labs={counts['learning_labs']} "
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
