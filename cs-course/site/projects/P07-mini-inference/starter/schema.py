"""Standard-library model/request schema for P07."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


class SchemaError(ValueError):
    """Raised for malformed or unsafe teaching fixtures."""


@dataclass(frozen=True)
class ModelConfig:
    vocab_size: int
    hidden_size: int
    num_layers: int
    num_heads: int
    max_context: int
    dtype: str
    seed: int


@dataclass(frozen=True)
class KVConfig:
    page_size: int
    max_pages: int
    head_dim: int


@dataclass(frozen=True)
class SchedulerConfig:
    max_batch_tokens: int
    max_active_requests: int
    aging_ticks: int


@dataclass(frozen=True)
class QuantizationConfig:
    mode: str
    bits: int
    group_size: int
    symmetric: bool


@dataclass(frozen=True)
class Request:
    request_id: str
    prompt_tokens: tuple[int, ...]
    max_tokens: int
    stop_token_id: int | None = None


@dataclass(frozen=True)
class TokenEvent:
    request_id: str
    token_id: int
    step: int
    finished: bool = False


@dataclass(frozen=True)
class Scenario:
    scenario_id: str
    model: ModelConfig
    kv_cache: KVConfig
    scheduler: SchedulerConfig
    quantization: QuantizationConfig
    requests: tuple[Request, ...]
    reference: dict[str, tuple[int, ...]]
    platform: dict[str, bool]


def _positive(payload: Mapping[str, Any], key: str) -> int:
    value = int(payload[key])
    if value <= 0:
        raise SchemaError(f"{key} must be positive")
    return value


def parse_scenario(payload: Mapping[str, Any]) -> Scenario:
    """Parse the public fixture schema; this does not run inference."""

    if payload.get("schema_version") != 1:
        raise SchemaError("schema_version must be 1")
    model_payload = payload.get("model", {})
    kv_payload = payload.get("kv_cache", {})
    scheduler_payload = payload.get("scheduler", {})
    quant_payload = payload.get("quantization", {})
    raw_requests = payload.get("requests")
    if not isinstance(raw_requests, list) or not raw_requests:
        raise SchemaError("requests must be a non-empty list")
    model = ModelConfig(
        vocab_size=_positive(model_payload, "vocab_size"),
        hidden_size=_positive(model_payload, "hidden_size"),
        num_layers=_positive(model_payload, "num_layers"),
        num_heads=_positive(model_payload, "num_heads"),
        max_context=_positive(model_payload, "max_context"),
        dtype=str(model_payload.get("dtype", "fp32")),
        seed=int(model_payload.get("seed", 0)),
    )
    kv_cache = KVConfig(
        page_size=_positive(kv_payload, "page_size"),
        max_pages=_positive(kv_payload, "max_pages"),
        head_dim=_positive(kv_payload, "head_dim"),
    )
    scheduler = SchedulerConfig(
        max_batch_tokens=_positive(scheduler_payload, "max_batch_tokens"),
        max_active_requests=_positive(scheduler_payload, "max_active_requests"),
        aging_ticks=int(scheduler_payload.get("aging_ticks", 0)),
    )
    quantization = QuantizationConfig(
        mode=str(quant_payload.get("mode", "none")),
        bits=int(quant_payload.get("bits", 32)),
        group_size=_positive(quant_payload, "group_size"),
        symmetric=bool(quant_payload.get("symmetric", True)),
    )
    requests: list[Request] = []
    seen_ids: set[str] = set()
    for raw_request in raw_requests:
        request_id = str(raw_request.get("request_id", ""))
        prompt_tokens = tuple(int(token) for token in raw_request.get("prompt_tokens", []))
        max_tokens = int(raw_request.get("max_tokens", -1))
        if not request_id or request_id in seen_ids:
            raise SchemaError("request IDs must be non-empty and unique")
        if max_tokens < 0 or len(prompt_tokens) > model.max_context:
            raise SchemaError(f"request {request_id!r} exceeds token limits")
        if any(token < 0 or token >= model.vocab_size for token in prompt_tokens):
            raise SchemaError(f"request {request_id!r} contains an out-of-vocabulary token")
        seen_ids.add(request_id)
        requests.append(
            Request(
                request_id=request_id,
                prompt_tokens=prompt_tokens,
                max_tokens=max_tokens,
                stop_token_id=(None if raw_request.get("stop_token_id") is None else int(raw_request["stop_token_id"])),
            )
        )
    reference = {
        str(request_id): tuple(int(token) for token in tokens)
        for request_id, tokens in dict(payload.get("reference", {})).items()
    }
    platform = {str(key): bool(value) for key, value in dict(payload.get("platform", {})).items()}
    scenario_id = str(payload.get("scenario_id", ""))
    if not scenario_id:
        raise SchemaError("scenario_id must be non-empty")
    return Scenario(scenario_id, model, kv_cache, scheduler, quantization, tuple(requests), reference, platform)
