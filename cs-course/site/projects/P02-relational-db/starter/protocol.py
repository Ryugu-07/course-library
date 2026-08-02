"""Data models and stable interfaces for the P02 assignment.

The models are intentionally useful for fixtures and adapters.  The storage,
execution, concurrency-control, and recovery algorithms remain student work.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Optional, Protocol, Sequence, Tuple


class NotImplementedFeature(RuntimeError):
    """Raised by a core database hook that students must implement."""


class DataType(str, Enum):
    INTEGER = "integer"
    TEXT = "text"
    BOOLEAN = "boolean"


class IsolationLevel(str, Enum):
    SNAPSHOT = "snapshot"
    SERIALIZABLE = "serializable"


class WalKind(str, Enum):
    BEGIN = "begin"
    UPDATE = "update"
    COMMIT = "commit"
    ABORT = "abort"


@dataclass(frozen=True)
class ColumnSpec:
    name: str
    data_type: DataType
    nullable: bool = False


@dataclass(frozen=True)
class TableSchema:
    name: str
    columns: Tuple[ColumnSpec, ...]
    primary_key: Optional[str] = None


@dataclass(frozen=True)
class Rid:
    page_id: int
    slot_id: int


@dataclass(frozen=True)
class TupleData:
    values: Tuple[object, ...]


@dataclass(frozen=True)
class PageRequest:
    page_id: int
    page_size: int
    pin: bool = False


@dataclass(frozen=True)
class BufferFrame:
    page_id: int
    pin_count: int
    dirty: bool
    lsn: int


@dataclass(frozen=True)
class WalRecord:
    lsn: int
    transaction_id: int
    kind: WalKind
    page_id: Optional[int] = None
    payload: str = ""
    checksum: str = ""


@dataclass(frozen=True)
class Transaction:
    transaction_id: int
    isolation: IsolationLevel
    snapshot_lsn: int
    state: str = "active"


@dataclass(frozen=True)
class QueryRequest:
    sql: str
    explain: bool = False


class StorageEngine(Protocol):
    def fetch_page(self, request: PageRequest) -> bytes:
        """Fetch one page through the buffer-pool boundary."""

        ...

    def write_page(self, page_id: int, page: bytes, lsn: int) -> None:
        """Persist one page only after the WAL rule is satisfied."""

        ...

    def insert(self, table: str, tuple_data: TupleData) -> Rid:
        ...

    def delete(self, rid: Rid) -> None:
        ...


class Index(Protocol):
    def range_scan(self, lower: object, upper: object) -> Iterable[Rid]:
        ...


class SqlExecutor(Protocol):
    def execute(self, request: QueryRequest) -> Sequence[TupleData]:
        ...


class TransactionManager(Protocol):
    def begin(self, isolation: IsolationLevel = IsolationLevel.SNAPSHOT) -> Transaction:
        ...

    def commit(self, transaction_id: int) -> None:
        ...

    def abort(self, transaction_id: int) -> None:
        ...


class Wal(Protocol):
    def append(self, record: WalRecord) -> int:
        ...

    def recover(self, records: Sequence[WalRecord]) -> Sequence[WalRecord]:
        ...


class TodoDatabase:
    """A named set of TODO hooks so the starter can be inspected safely."""

    def fetch_page(self, request: PageRequest) -> bytes:
        raise NotImplementedFeature("TODO(student): implement page fetch/buffer pinning")

    def write_page(self, page_id: int, page: bytes, lsn: int) -> None:
        raise NotImplementedFeature("TODO(student): implement WAL-before-page-write")

    def insert(self, table: str, tuple_data: TupleData) -> Rid:
        raise NotImplementedFeature("TODO(student): implement heap-file insert")

    def delete(self, rid: Rid) -> None:
        raise NotImplementedFeature("TODO(student): implement tuple delete and index cleanup")

    def execute(self, request: QueryRequest) -> Sequence[TupleData]:
        raise NotImplementedFeature("TODO(student): implement SQL execution")

    def begin(self, isolation: IsolationLevel = IsolationLevel.SNAPSHOT) -> Transaction:
        raise NotImplementedFeature("TODO(student): implement transaction begin")

    def commit(self, transaction_id: int) -> None:
        raise NotImplementedFeature("TODO(student): implement commit point and WAL flush")

    def abort(self, transaction_id: int) -> None:
        raise NotImplementedFeature("TODO(student): implement abort/rollback")

    def recover(self, records: Sequence[WalRecord]) -> Sequence[WalRecord]:
        raise NotImplementedFeature("TODO(student): implement crash recovery")


def validate_schema(schema: TableSchema) -> None:
    """Check only structural fixture invariants; not database semantics."""

    names = [column.name for column in schema.columns]
    if not schema.name or not names or len(names) != len(set(names)):
        raise ValueError("schema must have a name and unique non-empty columns")
    if schema.primary_key is not None and schema.primary_key not in names:
        raise ValueError("primary key must name an existing column")
