#!/usr/bin/env python3
"""Validate P05 files, signatures, packet schema, and discrete-network boundaries."""

from __future__ import annotations

import inspect
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STARTER = ROOT / "starter"


def fail(message: str) -> None:
    raise AssertionError(message)


def method_parameters(method: object) -> list[str]:
    names = list(inspect.signature(method).parameters)
    return names[1:] if names and names[0] == "self" else names


def main() -> int:
    required = [
        "README.md",
        "rubric.md",
        "DESIGN.md",
        "fixtures/loss_reorder.json",
        "starter/__init__.py",
        "starter/packet.py",
        "starter/network.py",
        "starter/protocol.py",
        "starter/driver.py",
        "tests/test_scaffold.py",
        "acceptance/test_student_acceptance.py",
        "scripts/verify_scaffold.py",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    if missing:
        fail(f"missing required files: {', '.join(missing)}")

    fixture = json.loads((ROOT / "fixtures/loss_reorder.json").read_text(encoding="utf-8"))
    if fixture.get("schema_version") != 1 or not fixture.get("scenario_id"):
        fail("fixture needs schema_version=1 and scenario_id")
    for key in ("payload_hex", "network", "cases"):
        if key not in fixture:
            fail(f"fixture is missing {key}")
    if not isinstance(bytes.fromhex(fixture["payload_hex"]), bytes):
        fail("payload_hex must be valid hexadecimal")
    config = fixture["network"]
    for key in ("loss_rate", "duplicate_rate", "reorder_probability"):
        if not 0.0 <= float(config[key]) <= 1.0:
            fail(f"network.{key} must be in [0, 1]")
    if config["max_delay_ticks"] < config["min_delay_ticks"]:
        fail("network delay range is invalid")
    if not isinstance(fixture["cases"], list) or not fixture["cases"]:
        fail("fixture cases must be non-empty")

    for source_name in ("packet.py", "network.py", "protocol.py", "driver.py"):
        source = (STARTER / source_name).read_text(encoding="utf-8")
        if re.search(r"^\s*(?:from|import)\s+socket\b", source, re.MULTILINE):
            fail("starter must not import the operating-system socket module")

    sys.path.insert(0, str(STARTER))
    from network import DiscreteNetwork, NetworkConfig  # pylint: disable=import-outside-toplevel
    from packet import Segment  # pylint: disable=import-outside-toplevel
    from protocol import ByteStream, Connection, Receiver, Sender  # pylint: disable=import-outside-toplevel

    if method_parameters(Segment.from_dict) != ["payload"]:
        fail("Segment.from_dict(payload) signature changed")
    signatures = {
        "ByteStream.write": (["data"], ByteStream.write),
        "ByteStream.read": (["limit"], ByteStream.read),
        "Sender.on_application_bytes": (["data"], Sender.on_application_bytes),
        "Sender.on_segment": (["segment"], Sender.on_segment),
        "Sender.on_tick": (["now"], Sender.on_tick),
        "Receiver.on_segment": (["segment"], Receiver.on_segment),
        "Receiver.read": (["limit"], Receiver.read),
        "Connection.submit": (["data"], Connection.submit),
        "Connection.tick": (["now"], Connection.tick),
        "Connection.receive": (["segment", "now"], Connection.receive),
    }
    for name, (expected, method) in signatures.items():
        if method_parameters(method) != expected:
            fail(f"{name} signature {method_parameters(method)!r} != {expected!r}")
    network = DiscreteNetwork(NetworkConfig())
    if network.pending != 0 or Segment(seqno=0).validate():
        fail("basic packet/network scaffold contract failed")
    protocol_source = (STARTER / "protocol.py").read_text(encoding="utf-8")
    if "TODO" not in protocol_source or "NotImplementedError" not in protocol_source:
        fail("protocol core must remain visibly unfinished in the teacher scaffold")
    print("P05 scaffold: PASS (schema/network/signatures valid; TODO protocol accepted)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, ImportError, KeyError, TypeError, ValueError) as exc:
        print(f"P05 scaffold: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
