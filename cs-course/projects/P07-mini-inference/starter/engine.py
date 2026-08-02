"""End-to-end inference service interface for P07."""

from __future__ import annotations

from collections.abc import Iterator, Sequence

try:
    from .schema import TokenEvent
except ImportError:  # pragma: no cover - script-style imports
    from schema import TokenEvent


class InferenceEngine:
    def submit(
        self,
        prompt_tokens: Sequence[int],
        max_tokens: int,
        *,
        request_id: str | None = None,
    ) -> str:
        raise NotImplementedError("TODO(P07-M1/M6): register a request and return a stable request ID")

    def stream(self, request_id: str) -> Iterator[TokenEvent]:
        raise NotImplementedError("TODO(P07-M1/M6): produce token events with TTFT/TPOT timestamps")

    def cancel(self, request_id: str) -> None:
        raise NotImplementedError("TODO(P07-M3/M4): cancel request and release its KV pages")
