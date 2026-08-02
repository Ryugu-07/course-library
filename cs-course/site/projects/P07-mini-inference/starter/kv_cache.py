"""KV cache/page interfaces for P07; allocation and data movement are student work."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class KVHandle:
    request_id: str
    page_ids: tuple[int, ...]
    token_count: int


@dataclass(frozen=True)
class PageStats:
    allocated_pages: int
    free_pages: int
    resident_tokens: int
    bytes_used: int


class KVCacheManager:
    def __init__(self, page_size: int, max_pages: int, head_dim: int) -> None:
        self.page_size = page_size
        self.max_pages = max_pages
        self.head_dim = head_dim

    def allocate(self, request_id: str, token_count: int) -> KVHandle:
        raise NotImplementedError("TODO(P07-M2/M4): allocate pages without leaking or aliasing requests")

    def append(self, handle: KVHandle, key: Sequence[float], value: Sequence[float]) -> None:
        raise NotImplementedError("TODO(P07-M2/M4): append K/V and grow across page boundaries")

    def read(self, handle: KVHandle, position: int) -> tuple[Sequence[float], Sequence[float]]:
        raise NotImplementedError("TODO(P07-M2/M4): map logical token positions to physical pages")

    def release(self, handle: KVHandle) -> None:
        raise NotImplementedError("TODO(P07-M4): release all pages exactly once")

    def stats(self) -> PageStats:
        raise NotImplementedError("TODO(P07-M4): expose allocation, token, and byte counters")
