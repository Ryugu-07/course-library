"""Continuous-batching scheduler contract for P07."""

from __future__ import annotations

from dataclasses import dataclass

try:
    from .schema import Request
except ImportError:  # pragma: no cover - script-style imports
    from schema import Request


@dataclass(frozen=True)
class ScheduleDecision:
    admitted: tuple[str, ...]
    active: tuple[str, ...]
    finished: tuple[str, ...]
    token_budget: int
    step: int


class ContinuousBatchScheduler:
    def __init__(self, max_batch_tokens: int, max_active_requests: int, aging_ticks: int = 0) -> None:
        self.max_batch_tokens = max_batch_tokens
        self.max_active_requests = max_active_requests
        self.aging_ticks = aging_ticks

    def submit(self, request: Request) -> None:
        raise NotImplementedError("TODO(P07-M3): queue requests and account for prompt/decode budget")

    def cancel(self, request_id: str) -> None:
        raise NotImplementedError("TODO(P07-M3): cancel without starving or leaking a request")

    def step(self, budget_tokens: int) -> ScheduleDecision:
        raise NotImplementedError("TODO(P07-M3): implement token-level continuous batching and fairness")
