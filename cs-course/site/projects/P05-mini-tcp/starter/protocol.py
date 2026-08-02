"""Protocol interfaces for the student implementation.

Only the public shapes and state names are supplied. Reliable delivery, timers, ACK logic,
connection transitions, and congestion control are intentionally not implemented here.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

try:
    from .packet import Segment
except ImportError:  # pragma: no cover - script-style imports
    from packet import Segment


class ByteStream:
    def __init__(self, capacity: int = 65536) -> None:
        self.capacity = capacity

    def write(self, data: bytes) -> int:
        raise NotImplementedError("TODO(P05-M1): implement bounded byte stream and back-pressure")

    def read(self, limit: int = -1) -> bytes:
        raise NotImplementedError("TODO(P05-M1): implement ordered delivery and EOF")

    def close(self) -> None:
        raise NotImplementedError("TODO(P05-M1): define output close semantics")


class ConnectionState(str, Enum):
    CLOSED = "CLOSED"
    SYN_SENT = "SYN_SENT"
    SYN_RECEIVED = "SYN_RECEIVED"
    ESTABLISHED = "ESTABLISHED"
    FIN_WAIT = "FIN_WAIT"
    CLOSE_WAIT = "CLOSE_WAIT"
    LAST_ACK = "LAST_ACK"
    TIME_WAIT = "TIME_WAIT"
    RESET = "RESET"


@dataclass
class Sender:
    initial_seqno: int
    max_payload: int = 1200
    advertised_window: int = 65536

    def on_application_bytes(self, data: bytes) -> list[Segment]:
        raise NotImplementedError("TODO(P05-M2): segment application bytes and respect send windows")

    def on_segment(self, segment: Segment) -> None:
        raise NotImplementedError("TODO(P05-M2/M3): process ACKs, RTT samples, and retransmission state")

    def on_tick(self, now: int) -> list[Segment]:
        raise NotImplementedError("TODO(P05-M3/M5): expire timers and apply congestion control")


@dataclass
class Receiver:
    initial_seqno: int
    capacity: int = 65536

    def on_segment(self, segment: Segment) -> list[Segment]:
        raise NotImplementedError("TODO(P05-M2): reassemble, deduplicate, and emit cumulative ACK")

    def read(self, limit: int = -1) -> bytes:
        raise NotImplementedError("TODO(P05-M2): deliver only contiguous bytes")


class Connection:
    def __init__(self, *, state: ConnectionState = ConnectionState.CLOSED) -> None:
        self.state = state

    def submit(self, data: bytes) -> None:
        raise NotImplementedError("TODO(P05-M2/M4): connect application stream to sender")

    def tick(self, now: int) -> list[Segment]:
        raise NotImplementedError("TODO(P05-M3/M4/M5): drive timers and state transitions")

    def receive(self, segment: Segment, now: int) -> list[Segment]:
        raise NotImplementedError("TODO(P05-M2/M4): process packet and return response segments")
