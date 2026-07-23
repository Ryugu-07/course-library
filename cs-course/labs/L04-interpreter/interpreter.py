#!/usr/bin/env python3
"""A small expression language with lexical closures."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


TOKEN_RE = re.compile(
    r"\s+|//[^\n]*|==|!=|<=|>=|[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|[(){};,=+\-*/<>!]"
)
KEYWORDS = {"let", "fn", "if", "else", "return", "true", "false"}


@dataclass(frozen=True)
class Token:
    kind: str
    text: str


def tokenize(source: str) -> list[Token]:
    tokens: list[Token] = []
    position = 0
    for match in TOKEN_RE.finditer(source):
        if match.start() != position:
            raise SyntaxError(f"unexpected character at {position}: {source[position]!r}")
        position = match.end()
        text = match.group()
        if text.isspace() or text.startswith("//"):
            continue
        if text[0].isdigit():
            kind = "NUMBER"
        elif text[0].isalpha() or text[0] == "_":
            kind = text if text in KEYWORDS else "IDENT"
        else:
            kind = text
        tokens.append(Token(kind, text))
    if position != len(source):
        raise SyntaxError(f"unexpected character at {position}: {source[position]!r}")
    tokens.append(Token("EOF", ""))
    return tokens


class Parser:
    PRECEDENCE = {
        "==": 1, "!=": 1, "<": 2, "<=": 2, ">": 2, ">=": 2,
        "+": 3, "-": 3, "*": 4, "/": 4,
    }

    def __init__(self, source: str):
        self.tokens = tokenize(source)
        self.index = 0

    @property
    def current(self) -> Token:
        return self.tokens[self.index]

    def take(self, kind: str) -> Token:
        if self.current.kind != kind:
            raise SyntaxError(f"expected {kind}, got {self.current.kind}")
        token = self.current
        self.index += 1
        return token

    def match(self, kind: str) -> bool:
        if self.current.kind == kind:
            self.index += 1
            return True
        return False

    def program(self) -> list[Any]:
        statements = []
        while self.current.kind != "EOF":
            statements.append(self.statement())
        return statements

    def block(self) -> list[Any]:
        self.take("{")
        body = []
        while self.current.kind != "}":
            if self.current.kind == "EOF":
                raise SyntaxError("unterminated block")
            body.append(self.statement())
        self.take("}")
        return body

    def statement(self) -> Any:
        if self.match("let"):
            name = self.take("IDENT").text
            self.take("=")
            value = self.expression()
            self.take(";")
            return ("let", name, value)
        if self.match("return"):
            value = self.expression()
            self.take(";")
            return ("return", value)
        value = self.expression()
        self.take(";")
        return ("expr", value)

    def expression(self, minimum: int = 0) -> Any:
        left = self.prefix()
        while self.current.kind in self.PRECEDENCE and self.PRECEDENCE[self.current.kind] >= minimum:
            op = self.current.kind
            precedence = self.PRECEDENCE[op]
            self.index += 1
            right = self.expression(precedence + 1)
            left = ("binary", op, left, right)
        return left

    def prefix(self) -> Any:
        token = self.current
        if token.kind == "NUMBER":
            self.index += 1
            value: int | float = float(token.text) if "." in token.text else int(token.text)
            node: Any = ("literal", value)
        elif token.kind in {"true", "false"}:
            self.index += 1
            node = ("literal", token.kind == "true")
        elif token.kind == "IDENT":
            self.index += 1
            node = ("name", token.text)
        elif token.kind in {"-", "!"}:
            self.index += 1
            node = ("unary", token.kind, self.expression(5))
        elif self.match("("):
            node = self.expression()
            self.take(")")
        elif self.match("fn"):
            self.take("(")
            params = []
            if self.current.kind != ")":
                params.append(self.take("IDENT").text)
                while self.match(","):
                    params.append(self.take("IDENT").text)
            self.take(")")
            node = ("fn", params, self.block())
        elif self.match("if"):
            self.take("(")
            condition = self.expression()
            self.take(")")
            then_branch = self.block()
            else_branch = self.block() if self.match("else") else []
            node = ("if", condition, then_branch, else_branch)
        else:
            raise SyntaxError(f"unexpected token {token.kind}")

        while self.match("("):
            args = []
            if self.current.kind != ")":
                args.append(self.expression())
                while self.match(","):
                    args.append(self.expression())
            self.take(")")
            node = ("call", node, args)
        return node


class Environment:
    def __init__(self, parent: Environment | None = None):
        self.parent = parent
        self.values: dict[str, Any] = {}

    def define(self, name: str, value: Any) -> None:
        self.values[name] = value

    def get(self, name: str) -> Any:
        if name in self.values:
            return self.values[name]
        if self.parent:
            return self.parent.get(name)
        raise NameError(name)


@dataclass
class Function:
    params: list[str]
    body: list[Any]
    closure: Environment

    def __call__(self, interpreter: Interpreter, args: list[Any]) -> Any:
        if len(args) != len(self.params):
            raise TypeError(f"expected {len(self.params)} args, got {len(args)}")
        local = Environment(self.closure)
        for name, value in zip(self.params, args):
            local.define(name, value)
        try:
            return interpreter.execute_block(self.body, local)
        except ReturnSignal as signal:
            return signal.value


class ReturnSignal(Exception):
    def __init__(self, value: Any):
        self.value = value


class Interpreter:
    def __init__(self, output=print):
        self.global_env = Environment()
        self.output = output
        self.global_env.define("print", self._print)

    def _print(self, _interpreter: Interpreter, args: list[Any]) -> None:
        if len(args) != 1:
            raise TypeError("print expects one argument")
        self.output(args[0])

    def run(self, source: str) -> Any:
        return self.execute_block(Parser(source).program(), self.global_env)

    def execute_block(self, statements: list[Any], env: Environment) -> Any:
        result = None
        for statement in statements:
            kind = statement[0]
            if kind == "let":
                env.define(statement[1], self.evaluate(statement[2], env))
            elif kind == "return":
                raise ReturnSignal(self.evaluate(statement[1], env))
            else:
                result = self.evaluate(statement[1], env)
        return result

    def evaluate(self, node: Any, env: Environment) -> Any:
        kind = node[0]
        if kind == "literal":
            return node[1]
        if kind == "name":
            return env.get(node[1])
        if kind == "unary":
            value = self.evaluate(node[2], env)
            return -value if node[1] == "-" else not value
        if kind == "binary":
            left, right = self.evaluate(node[2], env), self.evaluate(node[3], env)
            operations = {
                "+": lambda: left + right, "-": lambda: left - right,
                "*": lambda: left * right, "/": lambda: left / right,
                "==": lambda: left == right, "!=": lambda: left != right,
                "<": lambda: left < right, "<=": lambda: left <= right,
                ">": lambda: left > right, ">=": lambda: left >= right,
            }
            return operations[node[1]]()
        if kind == "fn":
            return Function(node[1], node[2], env)
        if kind == "if":
            branch = node[2] if self.evaluate(node[1], env) else node[3]
            return self.execute_block(branch, Environment(env))
        if kind == "call":
            callee = self.evaluate(node[1], env)
            args = [self.evaluate(arg, env) for arg in node[2]]
            if isinstance(callee, Function):
                return callee(self, args)
            if callable(callee):
                return callee(self, args)
            raise TypeError("value is not callable")
        raise RuntimeError(f"unknown AST node {kind}")


def main() -> int:
    if len(sys.argv) != 2:
        print(f"usage: {sys.argv[0]} PROGRAM", file=sys.stderr)
        return 2
    Interpreter().run(Path(sys.argv[1]).read_text())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

