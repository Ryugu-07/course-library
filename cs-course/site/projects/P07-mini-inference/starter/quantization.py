"""Quantization schema and algorithm interfaces; no int8/int4 answer is supplied."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

try:
    from .schema import QuantizationConfig
except ImportError:  # pragma: no cover - script-style imports
    from schema import QuantizationConfig


@dataclass(frozen=True)
class QuantizedTensor:
    values: tuple[int, ...]
    scales: tuple[float, ...]
    zero_points: tuple[int, ...]
    bits: int
    group_size: int


def validate_quantization(config: QuantizationConfig) -> list[str]:
    errors: list[str] = []
    if config.mode not in {"none", "int8", "int4"}:
        errors.append("mode must be none, int8, or int4")
    if config.mode == "int8" and config.bits != 8:
        errors.append("int8 mode requires bits=8")
    if config.mode == "int4" and config.bits != 4:
        errors.append("int4 mode requires bits=4")
    if config.group_size <= 0:
        errors.append("group_size must be positive")
    return errors


def quantize(values: Sequence[float], config: QuantizationConfig) -> QuantizedTensor:
    """Quantize a flat tensor. Student implementation required."""

    raise NotImplementedError("TODO(P07-M5): implement scale/zero-point/group-wise quantization")


def dequantize(tensor: QuantizedTensor) -> tuple[float, ...]:
    """Restore a tensor for the reference CPU path. Student implementation required."""

    raise NotImplementedError("TODO(P07-M5): implement dequantization and error accounting")
