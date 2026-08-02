"""Deterministic unreliable network harness for P05.

This module is deliberately a discrete event simulator. It has no operating-system network
access; students implement the reliable protocol that uses this harness.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import heapq
import random
from typing import Any, Mapping

try:
    from .packet import PacketContractError, Segment
except ImportError:  # pragma: no cover - script-style imports
    from packet import PacketContractError, Segment


@dataclass(frozen=True)
class NetworkConfig:
    loss_rate: float = 0.0
    duplicate_rate: float = 0.0
    reorder_probability: float = 0.0
    min_delay_ticks: int = 1
    max_delay_ticks: int = 1
    bandwidth_bytes_per_tick: int = 1 << 30
    seed: int = 0

    @classmethod
    def from_mapping(cls, payload: Mapping[str, Any]) -> "NetworkConfig":
        config = cls(
            loss_rate=float(payload.get("loss_rate", 0.0)),
            duplicate_rate=float(payload.get("duplicate_rate", 0.0)),
            reorder_probability=float(payload.get("reorder_probability", 0.0)),
            min_delay_ticks=int(payload.get("min_delay_ticks", 1)),
            max_delay_ticks=int(payload.get("max_delay_ticks", 1)),
            bandwidth_bytes_per_tick=int(payload.get("bandwidth_bytes_per_tick", 1 << 30)),
            seed=int(payload.get("seed", 0)),
        )
        if not 0.0 <= config.loss_rate <= 1.0:
            raise ValueError("loss_rate must be in [0, 1]")
        if not 0.0 <= config.duplicate_rate <= 1.0:
            raise ValueError("duplicate_rate must be in [0, 1]")
        if not 0.0 <= config.reorder_probability <= 1.0:
            raise ValueError("reorder_probability must be in [0, 1]")
        if config.min_delay_ticks < 0 or config.max_delay_ticks < config.min_delay_ticks:
            raise ValueError("delay range is invalid")
        if config.bandwidth_bytes_per_tick <= 0:
            raise ValueError("bandwidth_bytes_per_tick must be positive")
        return config


@dataclass(frozen=True, order=True)
class _Queued:
    ready_at: int
    ordinal: int
    src: str = field(compare=False)
    dst: str = field(compare=False)
    segment: Segment = field(compare=False)


@dataclass(frozen=True)
class Delivery:
    now: int
    src: str
    dst: str
    segment: Segment


class DiscreteNetwork:
    """A replayable fault-injection layer; no raw sockets or production TCP are involved."""

    def __init__(self, config: NetworkConfig) -> None:
        self.config = config
        self.now = 0
        self._ordinal = 0
        self._queue: list[_Queued] = []
        self._rng = random.Random(config.seed)
        self.stats = {"sent": 0, "dropped": 0, "duplicated": 0, "delivered": 0}

    @property
    def pending(self) -> int:
        return len(self._queue)

    def _enqueue(self, src: str, dst: str, segment: Segment, delay: int) -> None:
        self._ordinal += 1
        heapq.heappush(self._queue, _Queued(self.now + delay, self._ordinal, src, dst, segment))

    def send(self, src: str, dst: str, segment: Segment) -> bool:
        """Inject one segment and return whether at least one copy was scheduled."""

        errors = segment.validate()
        if errors:
            raise PacketContractError("; ".join(errors))
        self.stats["sent"] += 1
        if self._rng.random() < self.config.loss_rate:
            self.stats["dropped"] += 1
            return False
        delay = self._rng.randint(self.config.min_delay_ticks, self.config.max_delay_ticks)
        if self._rng.random() < self.config.reorder_probability and self._queue:
            delay = max(self.config.min_delay_ticks, delay - 1)
        self._enqueue(src, dst, segment, delay)
        if self._rng.random() < self.config.duplicate_rate:
            self.stats["duplicated"] += 1
            self._enqueue(src, dst, segment, delay + 1)
        return True

    def advance(self, ticks: int = 1) -> list[Delivery]:
        if ticks < 0:
            raise ValueError("ticks must be non-negative")
        self.now += ticks
        deliveries: list[Delivery] = []
        while self._queue and self._queue[0].ready_at <= self.now:
            queued = heapq.heappop(self._queue)
            deliveries.append(Delivery(self.now, queued.src, queued.dst, queued.segment))
        self.stats["delivered"] += len(deliveries)
        return deliveries

    def drain(self, max_ticks: int = 1000) -> list[Delivery]:
        deliveries: list[Delivery] = []
        for _ in range(max_ticks):
            deliveries.extend(self.advance(1))
            if not self._queue:
                break
        return deliveries
