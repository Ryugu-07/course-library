#!/usr/bin/env python3
"""Report coverage of the interactive learning-layer enrichment program."""

from __future__ import annotations

import argparse
import ast
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import re
import sys


FOCUS_COURSES = {
    "math-course": "Undergraduate mathematics",
    "grad-math": "Graduate mathematics",
    "physics-course": "Physics",
    "ai-course": "AI",
}
ENGINEERING_COURSES = {
    "auto-course": "Automation and control",
    "ee-course": "Electrical and electronics engineering fundamentals",
    "materials-course": "Materials science",
    "mech-course": "Mechanical engineering",
}
EXPANSION_COURSES = {
    "photo-course": "Photonics and optoelectronics",
    "micro-course": "Microelectronics",
    "cs-course": "Computer science",
}
SCIENCE_EXPANSION_COURSES = {
    "earth-course": "Earth system and climate science",
}
COURSES = (
    FOCUS_COURSES
    | ENGINEERING_COURSES
    | EXPANSION_COURSES
    | SCIENCE_EXPANSION_COURSES
)
EXCLUDED_LECTURES = {"00-intro.md", "labs.md"}
COURSE_EXCLUSIONS = {
    "photo-course": {"21-closing.md"},
    "micro-course": {"21-closing.md"},
}
LAB_RE = re.compile(r'\bdata-learning-lab\s*=\s*["\']([a-z0-9-]+)["\']')
LEARNING_LAYER_RE = re.compile(
    r'class=["\'][^"\']*\blearning-layer\b[^"\']*["\']'
)


@dataclass(frozen=True)
class Coverage:
    course: str
    label: str
    total: int
    enriched: int
    labs: int
    percent: float
    enriched_pages: tuple[str, ...]
    remaining_pages: tuple[str, ...]


def lecture_files(root: Path, course: str) -> list[Path]:
    lectures = root / course / "lectures"
    builder = root / course / "build_site.py"
    tree = ast.parse(builder.read_text(encoding="utf-8"), filename=str(builder))
    registered: list[str] | None = None
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(target, ast.Name) and target.id == "COURSE" for target in node.targets):
            continue
        course_spec = ast.literal_eval(node.value)
        excluded = EXCLUDED_LECTURES | COURSE_EXCLUSIONS.get(course, set())
        registered = [
            lecture[0]
            for _, section in course_spec
            for lecture in section
            if lecture[0] not in excluded
        ]
        break
    if registered is None:
        raise ValueError(f"COURSE registry not found in {builder}")
    missing = [name for name in registered if not (lectures / name).is_file()]
    if missing:
        raise FileNotFoundError(
            f"registered lecture files are missing in {course}: {', '.join(missing)}"
        )
    return [lectures / name for name in registered]


def page_contract(text: str) -> tuple[bool, list[str], list[str]]:
    labs = LAB_RE.findall(text)
    missing = []
    if text.count("data-learning-page") != 1:
        missing.append("data-learning-page")
    if len(LEARNING_LAYER_RE.findall(text)) != 1:
        missing.append("learning-layer")
    if not labs:
        missing.append("learning-lab")
    return not missing, labs, missing


def measure(root: Path, course: str) -> tuple[Coverage, list[str]]:
    enriched_pages: list[str] = []
    remaining_pages: list[str] = []
    labs: list[str] = []
    partial: list[str] = []
    files = lecture_files(root, course)
    labs_dir = root / "course-shared" / "labs"

    for path in files:
        text = path.read_text(encoding="utf-8")
        complete, page_labs, missing = page_contract(text)
        missing_lab_scripts = [
            name for name in page_labs if not (labs_dir / f"{name}.js").is_file()
        ]
        if missing_lab_scripts:
            complete = False
            missing.extend(f"lab-script:{name}" for name in missing_lab_scripts)
        if complete:
            enriched_pages.append(path.name)
            labs.extend(page_labs)
        else:
            remaining_pages.append(path.name)
            if any(
                marker in text
                for marker in (
                    "data-learning-page",
                    "learning-layer",
                    "data-learning-lab",
                )
            ):
                partial.append(f"{course}/{path.name}: missing {', '.join(missing)}")

    total = len(files)
    enriched = len(enriched_pages)
    coverage = Coverage(
        course=course,
        label=COURSES[course],
        total=total,
        enriched=enriched,
        labs=len(labs),
        percent=round(100 * enriched / total, 1) if total else 0.0,
        enriched_pages=tuple(enriched_pages),
        remaining_pages=tuple(remaining_pages),
    )
    return coverage, partial


def combined(name: str, label: str, parts: list[Coverage]) -> Coverage:
    total = sum(item.total for item in parts)
    enriched = sum(item.enriched for item in parts)
    return Coverage(
        course=name,
        label=label,
        total=total,
        enriched=enriched,
        labs=sum(item.labs for item in parts),
        percent=round(100 * enriched / total, 1) if total else 0.0,
        enriched_pages=tuple(
            f"{item.course}/{page}"
            for item in parts
            for page in item.enriched_pages
        ),
        remaining_pages=tuple(
            f"{item.course}/{page}"
            for item in parts
            for page in item.remaining_pages
        ),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="course-library root",
    )
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    parser.add_argument(
        "--remaining",
        action="store_true",
        help="list pages that have not reached the complete learning-layer contract",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    measured: list[Coverage] = []
    partial: list[str] = []
    for course in COURSES:
        result, warnings = measure(root, course)
        measured.append(result)
        partial.extend(warnings)

    mathematics = combined(
        "mathematics",
        "Mathematics combined",
        [item for item in measured if item.course in {"math-course", "grad-math"}],
    )
    focus = combined(
        "focus-total",
        "Math + physics + AI",
        [item for item in measured if item.course in FOCUS_COURSES],
    )
    engineering = combined(
        "engineering-total",
        "Control + electrical/electronics + materials + mechanical engineering",
        [item for item in measured if item.course in ENGINEERING_COURSES],
    )
    expansion = combined(
        "expansion-total",
        "Photonics + microelectronics + computer science",
        [item for item in measured if item.course in EXPANSION_COURSES],
    )
    report = measured + [mathematics, focus, engineering, expansion]

    if args.json:
        print(json.dumps({"coverage": [asdict(item) for item in report], "partial": partial}, ensure_ascii=False, indent=2))
    else:
        print("Learning-layer coverage (course-specific non-core pages excluded)")
        for item in report:
            print(
                f"{item.course:16} {item.enriched:3}/{item.total:<3} "
                f"({item.percent:5.1f}%) labs={item.labs}"
            )
        if args.remaining:
            for item in measured:
                print(f"\n[{item.course}] remaining={len(item.remaining_pages)}")
                print(" ".join(item.remaining_pages))
        if partial:
            print("\nPartial learning contracts:", file=sys.stderr)
            for warning in partial:
                print(f"- {warning}", file=sys.stderr)

    return 1 if partial else 0


if __name__ == "__main__":
    sys.exit(main())
