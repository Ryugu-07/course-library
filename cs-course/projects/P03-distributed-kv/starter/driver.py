"""Runnable fixture driver that previews network events without Raft logic."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from protocol import MessageType, RpcEnvelope
from transport import DeterministicTransport


def load_document(path: Path) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if document.get("schema_version") != 1 or document.get("project") != "P03-distributed-kv":
        raise ValueError("unsupported P03 fixture")
    if not document.get("nodes") or not document.get("events"):
        raise ValueError("fixture must contain nodes and events")
    return document


def preview(document: dict[str, Any]) -> str:
    transport = DeterministicTransport(document["nodes"])
    lines = [
        f"P03 scaffold driver: {len(document['nodes'])} nodes, {len(document['events'])} events",
        "Raft election, persistence, linearizable reads, and shard migration are not called.",
    ]
    for event in document["events"]:
        kind = event["kind"]
        if kind == "partition":
            transport.partition(event["left"], event["right"])
            lines.append(f"- partition {event['left']} | {event['right']}")
        elif kind == "heal":
            transport.heal()
            lines.append("- heal network")
        elif kind == "message":
            envelope = RpcEnvelope(
                sender=event["sender"],
                recipient=event["recipient"],
                term=event.get("term", 0),
                message_type=MessageType(event["message_type"]),
                payload=event.get("payload", {}),
            )
            transport.send(envelope)
            delivery = transport.deliver_one()
            result = "delivered" if delivery and delivery.delivered else "blocked"
            lines.append(f"- message {envelope.sender}->{envelope.recipient}: {result}")
        else:
            lines.append(f"- {event['id']}: student-only event ({kind})")
    lines.append(f"- preview queue length: {transport.queued()}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=Path, required=True)
    args = parser.parse_args()
    print(preview(load_document(args.scenario)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
