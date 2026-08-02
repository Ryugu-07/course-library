"""Small deterministic transport used only to preview fixture events.

It intentionally does not select leaders, replicate logs, or apply KV
commands.  Those are student-facing algorithms in ``protocol.py``.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Iterable, Optional, Set, Tuple

from protocol import RpcEnvelope


@dataclass(frozen=True)
class Delivery:
    envelope: RpcEnvelope
    delivered: bool
    reason: str = ""


class DeterministicTransport:
    """Queue, partition, heal, and deliver messages deterministically."""

    def __init__(self, node_ids: Iterable[str]) -> None:
        self.node_ids = frozenset(node_ids)
        self._queue: Deque[RpcEnvelope] = deque()
        self._blocked: Set[frozenset[str]] = set()

    def send(self, envelope: RpcEnvelope) -> None:
        if envelope.sender not in self.node_ids or envelope.recipient not in self.node_ids:
            raise ValueError("unknown transport endpoint")
        self._queue.append(envelope)

    def partition(self, left: Iterable[str], right: Iterable[str]) -> None:
        left_set, right_set = set(left), set(right)
        for source in left_set:
            for target in right_set:
                self._blocked.add(frozenset((source, target)))

    def heal(self) -> None:
        self._blocked.clear()

    def deliver_one(self) -> Optional[Delivery]:
        if not self._queue:
            return None
        envelope = self._queue.popleft()
        if frozenset((envelope.sender, envelope.recipient)) in self._blocked:
            return Delivery(envelope, False, "partitioned")
        return Delivery(envelope, True)

    def queued(self) -> int:
        return len(self._queue)
