"""Public packet/segment schema for the P05 discrete simulator."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


class PacketContractError(ValueError):
    """Raised when a segment cannot enter the simulator."""


KNOWN_FLAGS = frozenset({"SYN", "ACK", "FIN", "RST", "SACK"})


@dataclass(frozen=True)
class Segment:
    seqno: int
    ackno: int | None = None
    window: int = 0
    flags: tuple[str, ...] = ()
    payload: bytes = b""
    checksum: int = 0

    def validate(self) -> list[str]:
        errors: list[str] = []
        if self.seqno < 0:
            errors.append("seqno must be non-negative")
        if self.ackno is not None and self.ackno < 0:
            errors.append("ackno must be non-negative when present")
        if self.window < 0:
            errors.append("window must be non-negative")
        if len(set(self.flags)) != len(self.flags):
            errors.append("flags must not repeat")
        if any(flag not in KNOWN_FLAGS for flag in self.flags):
            errors.append("flags contains an unknown value")
        if not isinstance(self.payload, bytes):
            errors.append("payload must be bytes")
        return errors

    def to_dict(self) -> dict[str, Any]:
        errors = self.validate()
        if errors:
            raise PacketContractError("; ".join(errors))
        return {
            "seqno": self.seqno,
            "ackno": self.ackno,
            "window": self.window,
            "flags": list(self.flags),
            "payload_hex": self.payload.hex(),
            "checksum": self.checksum,
        }

    @classmethod
    def from_dict(cls, payload: Mapping[str, Any]) -> "Segment":
        if not isinstance(payload, Mapping):
            raise PacketContractError("segment must be an object")
        try:
            segment = cls(
                seqno=int(payload["seqno"]),
                ackno=None if payload.get("ackno") is None else int(payload["ackno"]),
                window=int(payload.get("window", 0)),
                flags=tuple(payload.get("flags", [])),
                payload=bytes.fromhex(str(payload.get("payload_hex", ""))),
                checksum=int(payload.get("checksum", 0)),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise PacketContractError(f"invalid segment fields: {exc}") from exc
        errors = segment.validate()
        if errors:
            raise PacketContractError("; ".join(errors))
        return segment
