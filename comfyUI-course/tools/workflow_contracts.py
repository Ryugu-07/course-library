#!/usr/bin/env python3
"""Validate the paired ComfyUI UI/API teaching workflows."""

from __future__ import annotations

import json
from pathlib import Path


EXPECTED_STEMS = tuple(f"wf{index:02d}_" for index in range(1, 8))


def _load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _single_path(directory: Path, prefix: str, suffix: str) -> Path:
    matches = sorted(directory.glob(f"{prefix}*{suffix}"))
    if len(matches) != 1:
        raise ValueError(
            f"expected one {prefix}*{suffix} in {directory}, found {len(matches)}"
        )
    return matches[0]


def validate_ui(path: Path) -> int:
    payload = _load(path)
    if not isinstance(payload, dict):
        raise TypeError(f"{path}: UI workflow must be an object")
    nodes = payload.get("nodes")
    links = payload.get("links")
    if not isinstance(nodes, list) or not isinstance(links, list):
        raise TypeError(f"{path}: UI workflow needs nodes[] and links[]")
    node_ids = [node.get("id") for node in nodes if isinstance(node, dict)]
    if len(node_ids) != len(nodes) or len(set(node_ids)) != len(node_ids):
        raise ValueError(f"{path}: node ids must exist and be unique")
    node_id_set = set(node_ids)
    for link in links:
        if not isinstance(link, list) or len(link) < 5:
            raise ValueError(f"{path}: malformed UI link {link!r}")
        if link[1] not in node_id_set or link[3] not in node_id_set:
            raise ValueError(f"{path}: link references a missing node {link!r}")
    return len(nodes) + len(links)


def validate_api(path: Path) -> int:
    payload = _load(path)
    if not isinstance(payload, dict) or not payload:
        raise TypeError(f"{path}: API workflow must be a non-empty object")
    node_ids = set(payload)
    checks = 0
    samplers = []
    for node_id, node in payload.items():
        if not isinstance(node, dict):
            raise TypeError(f"{path}: node {node_id} must be an object")
        class_type = node.get("class_type")
        inputs = node.get("inputs")
        if not isinstance(class_type, str) or not isinstance(inputs, dict):
            raise TypeError(f"{path}: node {node_id} needs class_type and inputs")
        if class_type == "KSampler":
            samplers.append(node)
        for value in inputs.values():
            if (
                isinstance(value, list)
                and len(value) == 2
                and isinstance(value[0], str)
                and isinstance(value[1], int)
            ):
                if value[0] not in node_ids:
                    raise ValueError(
                        f"{path}: node {node_id} references missing node {value[0]}"
                    )
                checks += 1
    if not samplers:
        raise ValueError(f"{path}: teaching workflow has no KSampler")
    def find_text_encoder(start_id: str):
        pending = [start_id]
        visited = set()
        while pending:
            current_id = pending.pop()
            if current_id in visited:
                continue
            visited.add(current_id)
            current = payload.get(current_id, {})
            if (
                current.get("class_type") == "CLIPTextEncode"
                and isinstance(current.get("inputs", {}).get("text"), str)
            ):
                return current
            for value in current.get("inputs", {}).values():
                if (
                    isinstance(value, list)
                    and len(value) == 2
                    and isinstance(value[0], str)
                    and value[0] in node_ids
                ):
                    pending.append(value[0])
        return None

    for sampler in samplers:
        positive_ref = sampler["inputs"].get("positive")
        if not isinstance(positive_ref, list) or not positive_ref:
            raise ValueError(f"{path}: KSampler has no positive conditioning reference")
        positive = find_text_encoder(str(positive_ref[0]))
        if positive is None:
            raise ValueError(f"{path}: positive branch has no CLIPTextEncode text input")
        checks += 2
    return len(payload) + checks


def validate_all(workflow_root: Path) -> dict[str, int]:
    api_root = workflow_root / "api"
    totals = {"ui_files": 0, "api_files": 0, "checks": 0}
    for prefix in EXPECTED_STEMS:
        ui_path = _single_path(workflow_root, prefix, ".json")
        api_path = _single_path(api_root, prefix, "_api.json")
        totals["checks"] += validate_ui(ui_path)
        totals["checks"] += validate_api(api_path)
        totals["ui_files"] += 1
        totals["api_files"] += 1
    return totals


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "workflows"
    result = validate_all(root)
    print(
        "workflow contracts: PASS "
        f"({result['ui_files']} UI + {result['api_files']} API, "
        f"{result['checks']} checks)"
    )


if __name__ == "__main__":
    main()
