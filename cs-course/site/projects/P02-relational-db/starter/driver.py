"""Runnable, implementation-neutral driver for P02 contract fixtures."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from protocol import DataType, TableSchema, ColumnSpec, validate_schema


def load_document(path: Path) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if document.get("schema_version") != 1 or document.get("project") != "P02-relational-db":
        raise ValueError("unsupported P02 fixture")
    if not document.get("scenarios"):
        raise ValueError("fixture must contain scenarios")
    return document


def schema_from_fixture(raw: dict[str, Any]) -> TableSchema:
    columns = tuple(ColumnSpec(item["name"], DataType(item["type"]), item.get("nullable", False)) for item in raw["columns"])
    schema = TableSchema(raw["name"], columns, raw.get("primary_key"))
    validate_schema(schema)
    return schema


def render_summary(document: dict[str, Any]) -> str:
    schemas = [schema_from_fixture(raw) for raw in document.get("schemas", [])]
    lines = [
        f"P02 scaffold driver: {len(schemas)} schema(s), {len(document['scenarios'])} contract scenarios",
        "Storage, SQL, MVCC, and WAL hooks remain intentionally unimplemented.",
    ]
    for scenario in document["scenarios"]:
        lines.append(f"- {scenario['id']}: {scenario['area']} / {scenario['kind']} (student acceptance)")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=Path, required=True)
    args = parser.parse_args()
    print(render_summary(load_document(args.scenario)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
