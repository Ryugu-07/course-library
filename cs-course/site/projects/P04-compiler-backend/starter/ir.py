"""Small, serialisable IR contract for P04.

The data model and fixture parser are intentionally real so students can begin at M1.
SSA conversion, optimisation, register allocation, and code emission are interfaces only.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping, Sequence


class IRContractError(ValueError):
    """Raised when a fixture violates the public structural contract."""


@dataclass(frozen=True)
class Value:
    name: str
    ty: str = "i64"
    const: int | float | None = None


@dataclass
class Instruction:
    op: str
    result: str | None = None
    args: list[str] = field(default_factory=list)
    attrs: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> list[str]:
        errors: list[str] = []
        if not self.op:
            errors.append("instruction.op must be non-empty")
        if self.result is not None and not self.result:
            errors.append("instruction.result must be non-empty when present")
        if any(not isinstance(arg, str) or not arg for arg in self.args):
            errors.append(f"instruction {self.op!r} has an invalid argument")
        return errors


@dataclass
class BasicBlock:
    name: str
    instructions: list[Instruction] = field(default_factory=list)
    terminator: dict[str, Any] = field(default_factory=dict)
    successors: list[str] = field(default_factory=list)
    predecessors: list[str] = field(default_factory=list)

    def validate(self, known_blocks: set[str]) -> list[str]:
        errors: list[str] = []
        if not self.name:
            errors.append("basic block name must be non-empty")
        if not isinstance(self.terminator, dict) or not self.terminator.get("op"):
            errors.append(f"block {self.name!r} needs a terminator.op")
        if len(set(self.successors)) != len(self.successors):
            errors.append(f"block {self.name!r} repeats a successor")
        for successor in self.successors:
            if successor not in known_blocks:
                errors.append(f"block {self.name!r} points to unknown block {successor!r}")
        for instruction in self.instructions:
            errors.extend(f"{self.name}: {error}" for error in instruction.validate())
        return errors


@dataclass
class Function:
    name: str
    params: list[Value]
    blocks: list[BasicBlock]
    entry: str

    def validate(self) -> list[str]:
        errors: list[str] = []
        block_names = [block.name for block in self.blocks]
        known_blocks = set(block_names)
        if not self.name:
            errors.append("function name must be non-empty")
        if len(known_blocks) != len(block_names):
            errors.append(f"function {self.name!r} repeats a block name")
        if self.entry not in known_blocks:
            errors.append(f"function {self.name!r} has unknown entry {self.entry!r}")
        for block in self.blocks:
            errors.extend(f"function {self.name}: {error}" for error in block.validate(known_blocks))
        return errors


@dataclass
class Module:
    name: str
    functions: list[Function]
    metadata: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> list[str]:
        errors: list[str] = []
        names = [function.name for function in self.functions]
        if len(set(names)) != len(names):
            errors.append("module repeats a function name")
        for function in self.functions:
            errors.extend(function.validate())
        return errors

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": 1,
            "module": self.name,
            "metadata": self.metadata,
            "functions": [
                {
                    "name": function.name,
                    "params": [
                        {"name": param.name, "ty": param.ty, **({"const": param.const} if param.const is not None else {})}
                        for param in function.params
                    ],
                    "entry": function.entry,
                    "blocks": [
                        {
                            "name": block.name,
                            "instructions": [
                                {
                                    "op": instruction.op,
                                    "result": instruction.result,
                                    "args": instruction.args,
                                    "attrs": instruction.attrs,
                                }
                                for instruction in block.instructions
                            ],
                            "terminator": block.terminator,
                            "successors": block.successors,
                            "predecessors": block.predecessors,
                        }
                        for block in function.blocks
                    ],
                }
                for function in self.functions
            ],
        }


@dataclass(frozen=True)
class RegisterAllocation:
    mapping: dict[str, str]
    spills: tuple[str, ...] = ()


@dataclass
class CompileResult:
    target: str
    ir: Module
    text: str
    diagnostics: list[str] = field(default_factory=list)


def _value_from_payload(payload: Mapping[str, Any]) -> Value:
    if not isinstance(payload.get("name"), str) or not payload["name"]:
        raise IRContractError("parameter.name must be a non-empty string")
    ty = payload.get("ty", "i64")
    if not isinstance(ty, str) or not ty:
        raise IRContractError("parameter.ty must be a non-empty string")
    return Value(name=payload["name"], ty=ty, const=payload.get("const"))


def parse_module(payload: Mapping[str, Any]) -> Module:
    """Parse the public JSON shape without performing a backend transformation."""

    if not isinstance(payload, Mapping):
        raise IRContractError("module fixture must be an object")
    if payload.get("schema_version") != 1:
        raise IRContractError("schema_version must be 1")
    name = payload.get("module")
    raw_functions = payload.get("functions")
    if not isinstance(name, str) or not name:
        raise IRContractError("module must be a non-empty string")
    if not isinstance(raw_functions, list) or not raw_functions:
        raise IRContractError("functions must be a non-empty list")

    functions: list[Function] = []
    for raw_function in raw_functions:
        if not isinstance(raw_function, Mapping):
            raise IRContractError("each function must be an object")
        raw_params = raw_function.get("params", [])
        raw_blocks = raw_function.get("blocks")
        if not isinstance(raw_params, list) or not isinstance(raw_blocks, list) or not raw_blocks:
            raise IRContractError("function params must be a list and blocks must be non-empty")
        blocks: list[BasicBlock] = []
        for raw_block in raw_blocks:
            if not isinstance(raw_block, Mapping):
                raise IRContractError("each block must be an object")
            raw_instructions = raw_block.get("instructions", [])
            if not isinstance(raw_instructions, list):
                raise IRContractError("block.instructions must be a list")
            instructions = [
                Instruction(
                    op=item.get("op", "") if isinstance(item, Mapping) else "",
                    result=item.get("result") if isinstance(item, Mapping) else None,
                    args=list(item.get("args", [])) if isinstance(item, Mapping) else [],
                    attrs=dict(item.get("attrs", {})) if isinstance(item, Mapping) else {},
                )
                for item in raw_instructions
            ]
            blocks.append(
                BasicBlock(
                    name=raw_block.get("name", ""),
                    instructions=instructions,
                    terminator=dict(raw_block.get("terminator", {})),
                    successors=list(raw_block.get("successors", [])),
                    predecessors=list(raw_block.get("predecessors", [])),
                )
            )
        function = Function(
            name=raw_function.get("name", ""),
            params=[_value_from_payload(param) for param in raw_params],
            blocks=blocks,
            entry=raw_function.get("entry", ""),
        )
        functions.append(function)
    module = Module(name=name, functions=functions, metadata=dict(payload.get("metadata", {})))
    errors = module.validate()
    if errors:
        raise IRContractError("; ".join(errors))
    return module


def validate_module(module: Module) -> list[str]:
    """Return structural errors; this deliberately does not enforce SSA yet."""

    return module.validate()


def to_ssa(module: Module) -> Module:
    """Convert non-SSA IR to SSA. Student implementation required."""

    raise NotImplementedError("TODO(P04-M2): implement dominance, phi insertion, and renaming")


def optimize(module: Module, passes: Sequence[str]) -> Module:
    """Run named semantics-preserving passes. Student implementation required."""

    raise NotImplementedError("TODO(P04-M3): implement and verify optimization passes")


def allocate_registers(module: Module, registers: Sequence[str]) -> RegisterAllocation:
    """Allocate virtual values to physical registers, possibly with spills."""

    raise NotImplementedError("TODO(P04-M4): implement liveness, coloring, and spill rewriting")


def emit(module: Module, target: str) -> str:
    """Emit LLVM IR, bytecode, or a documented RISC-V subset. Student implementation required."""

    raise NotImplementedError("TODO(P04-M5): implement the selected target emitter")


def compile_program(module: Module, *, target: str, opt_level: int = 0) -> CompileResult:
    """Run the complete backend pipeline. Student implementation required."""

    raise NotImplementedError("TODO(P04-M5): connect the backend pipeline")
