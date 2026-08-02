"""P01 interface-only contract mirror.

This module intentionally does not emulate xv6.  The functions are named
boundaries for fixtures and design discussions; students implement the real
behavior in the teacher-selected xv6-riscv baseline.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


class NotImplementedFeature(RuntimeError):
    """Raised when a student-facing kernel hook is still a TODO."""


@dataclass(frozen=True)
class PageMapping:
    virtual_address: int
    physical_address: int
    permissions: str
    page_size: int = 4096


@dataclass(frozen=True)
class MappingResult:
    ok: bool
    error: str = ""


@dataclass(frozen=True)
class SyscallRequest:
    syscall_number: int
    arguments: Tuple[int, ...]
    pid: int


@dataclass(frozen=True)
class SyscallResult:
    return_value: int
    error: str = ""


@dataclass(frozen=True)
class LockRequest:
    lock_name: str
    held_locks: Tuple[str, ...]


@dataclass(frozen=True)
class LockResult:
    acquired: bool
    error: str = ""


@dataclass(frozen=True)
class FsTransaction:
    transaction_id: int
    records: Tuple[str, ...]
    crash_after_record: int | None = None


@dataclass(frozen=True)
class RecoveryResult:
    replayed_records: Tuple[str, ...]
    discarded_records: Tuple[str, ...]


@dataclass(frozen=True)
class MmapFault:
    virtual_address: int
    file_offset: int
    access: str
    mapping_permissions: str
    file_length: int


@dataclass(frozen=True)
class MmapResult:
    action: str
    error: str = ""


def map_user_page(request: PageMapping) -> MappingResult:
    """Student hook: validate and install a user PTE."""

    raise NotImplementedFeature("TODO(student): implement page-table mapping")


def dispatch_syscall(request: SyscallRequest) -> SyscallResult:
    """Student hook: route a validated syscall request."""

    raise NotImplementedFeature("TODO(student): implement syscall dispatch")


def acquire_ordered_lock(request: LockRequest) -> LockResult:
    """Student hook: enforce the selected kernel lock-order policy."""

    raise NotImplementedFeature("TODO(student): implement lock policy")


def recover_transaction(request: FsTransaction) -> RecoveryResult:
    """Student hook: recover only complete, committed filesystem work."""

    raise NotImplementedFeature("TODO(student): implement filesystem recovery")


def resolve_mmap_fault(request: MmapFault) -> MmapResult:
    """Student hook: resolve a lazy file-backed mapping fault."""

    raise NotImplementedFeature("TODO(student): implement mmap fault handling")


__all__ = [
    "FsTransaction",
    "LockRequest",
    "MmapFault",
    "PageMapping",
    "SyscallRequest",
    "acquire_ordered_lock",
    "dispatch_syscall",
    "map_user_page",
    "recover_transaction",
    "resolve_mmap_fault",
]
