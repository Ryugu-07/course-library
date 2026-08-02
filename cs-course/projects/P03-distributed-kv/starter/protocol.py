"""Protocol/data-model starter for the P03 distributed KV project.

The transport preview is runnable, but consensus, persistence, linearizable
reads, and shard migration are intentionally left to students.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Mapping, Optional, Sequence, Tuple


class NotImplementedFeature(RuntimeError):
    """Raised by a student-facing Raft or KV hook."""


class Role(str, Enum):
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"


class MessageType(str, Enum):
    REQUEST_VOTE = "request_vote"
    VOTE = "vote"
    APPEND_ENTRIES = "append_entries"
    APPEND_RESPONSE = "append_response"
    INSTALL_SNAPSHOT = "install_snapshot"
    CLIENT = "client"


class CommandType(str, Enum):
    GET = "get"
    PUT = "put"
    APPEND = "append"
    CONFIG = "config"
    SHARD_TRANSFER = "shard_transfer"


class ShardStatus(str, Enum):
    SERVING = "serving"
    FROZEN = "frozen"
    RECEIVING = "receiving"
    GC_PENDING = "gc_pending"


@dataclass(frozen=True)
class Command:
    command_type: CommandType
    key: str = ""
    value: str = ""
    client_id: str = ""
    request_id: int = 0
    config_number: Optional[int] = None


@dataclass(frozen=True)
class LogEntry:
    index: int
    term: int
    command: Command


@dataclass(frozen=True)
class ApplyMsg:
    index: int
    term: int
    command: Optional[Command] = None
    snapshot: Optional[bytes] = None


@dataclass(frozen=True)
class RpcEnvelope:
    sender: str
    recipient: str
    term: int
    message_type: MessageType
    payload: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class StartResult:
    index: int
    term: int
    is_leader: bool


@dataclass(frozen=True)
class ReadResult:
    value: Optional[str]
    error: str = ""


@dataclass(frozen=True)
class ShardConfig:
    number: int
    shard_to_group: Mapping[int, str]
    groups: Mapping[str, Tuple[str, ...]]


@dataclass(frozen=True)
class ShardTransfer:
    shard_id: int
    from_group: str
    to_group: str
    config_number: int
    status: ShardStatus
    kv: Mapping[str, str]
    dedup: Mapping[str, int]


class Persister:
    """Persistence boundary; byte layout and ordering are student work."""

    def save(self, term: int, voted_for: Optional[str], log: Sequence[LogEntry]) -> None:
        raise NotImplementedFeature("TODO(student): persist term, vote, and log")

    def save_snapshot(self, last_included_index: int, last_included_term: int, snapshot: bytes) -> None:
        raise NotImplementedFeature("TODO(student): persist snapshot and truncate log")

    def restore(self) -> Tuple[int, Optional[str], Sequence[LogEntry], Optional[bytes]]:
        raise NotImplementedFeature("TODO(student): restore after crash")


class RaftNode:
    """Stable Raft boundary with no election or replication implementation."""

    def __init__(self, node_id: str, peers: Sequence[str], persister: Persister) -> None:
        self.node_id = node_id
        self.peers = tuple(peers)
        self.persister = persister

    def start(self, command: Command) -> StartResult:
        raise NotImplementedFeature("TODO(student): implement Start(command) and log admission")

    def tick(self, elapsed_ms: int) -> Sequence[RpcEnvelope]:
        raise NotImplementedFeature("TODO(student): implement election/heartbeat clock")

    def receive(self, envelope: RpcEnvelope) -> Sequence[RpcEnvelope]:
        raise NotImplementedFeature("TODO(student): implement RPC handlers and term downgrade")

    def read_index(self) -> int:
        raise NotImplementedFeature("TODO(student): implement a linearizable read barrier")

    def restore(self) -> None:
        raise NotImplementedFeature("TODO(student): restore state before serving")


class TodoKV:
    """State-machine boundary; every write must be driven by Raft apply."""

    def apply(self, message: ApplyMsg) -> Optional[str]:
        raise NotImplementedFeature("TODO(student): apply committed command exactly once")

    def get(self, key: str) -> ReadResult:
        raise NotImplementedFeature("TODO(student): implement KV read with consistency boundary")

    def shard_transfer(self, transfer: ShardTransfer) -> None:
        raise NotImplementedFeature("TODO(student): implement idempotent shard ownership transfer")
