#!/usr/bin/env python3
"""Audit the EE course's one-page/one-lab teaching contract."""

from __future__ import annotations

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parent
LECTURES = ROOT / "lectures"
LABS = ROOT.parent / "course-shared" / "labs"

SLUGS = (
    "system-safety",
    "lumped-components",
    "kcl-kvl-nodal",
    "network-equivalents",
    "nonlinear-loadline",
    "power-thermal-ratings",
    "first-order",
    "rlc-resonance",
    "phasors-impedance",
    "ac-power-transformers",
    "lti-convolution",
    "fourier-filters",
    "noise-dynamic-range",
    "sampling-quantization",
    "real-components",
    "protection-switches",
    "opamp-interface",
    "sensors-transducers",
    "digital-electrical",
    "timing-synchronization",
    "mcu-pwm",
    "hardware-buses",
    "power-tree",
    "grounding-emc",
    "signal-integrity",
    "pcb-dft",
    "reliability-bringup",
    "capstone-sensor-node",
)

LAB_RE = re.compile(r'data-learning-lab=["\']([a-z0-9-]+)["\']')
COMPUTE_RE = re.compile(r"function\s+compute[A-Za-z0-9_]*\s*\(")


def main() -> int:
    failures: list[str] = []
    seen_ids: set[str] = set()

    for number, slug in enumerate(SLUGS, 1):
        lecture = LECTURES / f"{number:02d}-{slug}.md"
        lab_id = f"ee-{slug}"
        lab = LABS / f"{lab_id}.js"

        if not lecture.is_file():
            failures.append(f"missing lecture: {lecture.relative_to(ROOT.parent)}")
            continue
        source = lecture.read_text(encoding="utf-8")
        if "\t" in source:
            failures.append(f"{lecture.name}: contains a literal tab character")
        ids = LAB_RE.findall(source)
        if source.count("data-learning-page") != 1:
            failures.append(f"{lecture.name}: expected one data-learning-page")
        if source.count('class="learning-layer"') != 1:
            failures.append(f"{lecture.name}: expected one learning-layer")
        if ids != [lab_id]:
            failures.append(f"{lecture.name}: expected only {lab_id}, found {ids}")
        if "无 JavaScript 时的静态 fallback" not in source:
            failures.append(f"{lecture.name}: missing static fallback")
        if "资料与边界" not in source:
            failures.append(f"{lecture.name}: missing sources-and-boundaries section")
        if lab_id in seen_ids:
            failures.append(f"duplicate lab id: {lab_id}")
        seen_ids.add(lab_id)

        if not lab.is_file():
            failures.append(f"missing lab: {lab.relative_to(ROOT.parent)}")
            continue
        script = lab.read_text(encoding="utf-8")
        if "\t" in script:
            failures.append(f"{lab.name}: contains a literal tab character")
        required = {
            f'register("{lab_id}"': "registration",
            "DEFAULTS": "DEFAULTS",
            "function mount(": "mount",
            "rootNode.appendChild(shell)": "visible shell mount",
            "function selfTest(": "selfTest",
        }
        for marker, label in required.items():
            if label and marker not in script:
                failures.append(f"{lab.name}: missing {label}")
        if not COMPUTE_RE.search(script):
            failures.append(f"{lab.name}: missing pure compute function")
        if 'createElementNS' not in script or '"title"' not in script or '"desc"' not in script:
            failures.append(f"{lab.name}: missing accessible SVG construction")
        if "module.exports" not in script:
            failures.append(f"{lab.name}: missing CommonJS/UMD export")

    if failures:
        print(f"EE course audit: FAIL ({len(failures)} issue(s))", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print(f"EE course audit: PASS (pages={len(SLUGS)}, labs={len(seen_ids)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
