#!/usr/bin/env python3
"""Validate and report freshness deadlines for fast-moving course topics."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEDGER = Path(__file__).with_name("ecosystem_snapshots.json")


def parse_date(value: str, field: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} must use YYYY-MM-DD: {value!r}") from error


def load_ledger(path: Path = LEDGER) -> dict:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if payload.get("schema_version") != 1:
        raise ValueError("unsupported ecosystem snapshot schema")
    entries = payload.get("entries")
    if not isinstance(entries, list) or not entries:
        raise ValueError("ecosystem snapshot ledger needs entries")
    return payload


def audit(on_date: date, path: Path = LEDGER) -> list[dict]:
    payload = load_ledger(path)
    seen = set()
    report = []
    for entry in payload["entries"]:
        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id or entry_id in seen:
            raise ValueError(f"invalid or duplicate snapshot id: {entry_id!r}")
        seen.add(entry_id)
        verified = parse_date(entry.get("verified_on"), f"{entry_id}.verified_on")
        review_days = entry.get("review_days")
        if not isinstance(review_days, int) or review_days <= 0:
            raise ValueError(f"{entry_id}.review_days must be a positive integer")
        pages = entry.get("pages")
        sources = entry.get("sources")
        if not isinstance(pages, list) or not pages:
            raise ValueError(f"{entry_id} must list affected pages")
        if not isinstance(sources, list) or not sources:
            raise ValueError(f"{entry_id} must list primary sources")
        missing = [page for page in pages if not (ROOT / page).is_file()]
        if missing:
            raise ValueError(f"{entry_id} references missing pages: {missing}")
        if any(not isinstance(url, str) or not url.startswith("https://") for url in sources):
            raise ValueError(f"{entry_id} sources must be HTTPS URLs")
        due = verified + timedelta(days=review_days)
        days_left = (due - on_date).days
        state = "stale" if days_left < 0 else "due-soon" if days_left <= 7 else "current"
        report.append(
            {
                "id": entry_id,
                "state": state,
                "verified_on": verified.isoformat(),
                "due_on": due.isoformat(),
                "days_left": days_left,
                "pages": len(pages),
                "sources": len(sources),
            }
        )
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--on", dest="on_date", help="audit date in YYYY-MM-DD")
    parser.add_argument("--strict", action="store_true", help="fail when any entry is stale")
    args = parser.parse_args()
    on_date = parse_date(args.on_date, "--on") if args.on_date else date.today()
    report = audit(on_date)
    stale = 0
    for row in report:
        if row["state"] == "stale":
            stale += 1
        print(
            f"{row['state'].upper():8} {row['id']}: verified {row['verified_on']}, "
            f"review by {row['due_on']} ({row['days_left']} days), "
            f"{row['pages']} pages / {row['sources']} sources"
        )
    summary = "WARN" if stale else "PASS"
    print(f"ecosystem freshness: {summary} ({len(report)} entries, {stale} stale)")
    if args.strict and stale:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
