#!/usr/bin/env python3
"""An in-memory B+ tree with linked leaves."""

from __future__ import annotations

from bisect import bisect_left, bisect_right
from dataclasses import dataclass, field
from typing import Any, Iterator


@dataclass
class Leaf:
    keys: list[int] = field(default_factory=list)
    values: list[Any] = field(default_factory=list)
    next: Leaf | None = None


@dataclass
class Internal:
    keys: list[int] = field(default_factory=list)
    children: list[Leaf | Internal] = field(default_factory=list)


Node = Leaf | Internal


class BPlusTree:
    def __init__(self, order: int = 4):
        if order < 3:
            raise ValueError("order must be at least 3")
        self.order = order
        self.root: Node = Leaf()

    def _first_key(self, node: Node) -> int:
        while isinstance(node, Internal):
            node = node.children[0]
        return node.keys[0]

    def _rebuild_keys(self, node: Internal) -> None:
        node.keys = [self._first_key(child) for child in node.children[1:]]

    def insert(self, key: int, value: Any) -> None:
        split = self._insert(self.root, key, value)
        if split:
            separator, right = split
            self.root = Internal([separator], [self.root, right])

    def _insert(self, node: Node, key: int, value: Any) -> tuple[int, Node] | None:
        if isinstance(node, Leaf):
            index = bisect_left(node.keys, key)
            if index < len(node.keys) and node.keys[index] == key:
                node.values[index] = value
                return None
            node.keys.insert(index, key)
            node.values.insert(index, value)
            if len(node.keys) < self.order:
                return None
            midpoint = len(node.keys) // 2
            right = Leaf(node.keys[midpoint:], node.values[midpoint:], node.next)
            node.keys = node.keys[:midpoint]
            node.values = node.values[:midpoint]
            node.next = right
            return right.keys[0], right

        index = bisect_right(node.keys, key)
        split = self._insert(node.children[index], key, value)
        if not split:
            self._rebuild_keys(node)
            return None
        _, right = split
        node.children.insert(index + 1, right)
        self._rebuild_keys(node)
        if len(node.children) <= self.order:
            return None
        midpoint = len(node.children) // 2
        right_node = Internal(children=node.children[midpoint:])
        node.children = node.children[:midpoint]
        self._rebuild_keys(node)
        self._rebuild_keys(right_node)
        return self._first_key(right_node), right_node

    def get(self, key: int) -> Any:
        leaf = self._leaf_for(key)
        index = bisect_left(leaf.keys, key)
        if index == len(leaf.keys) or leaf.keys[index] != key:
            raise KeyError(key)
        return leaf.values[index]

    def _leaf_for(self, key: int) -> Leaf:
        node = self.root
        while isinstance(node, Internal):
            node = node.children[bisect_right(node.keys, key)]
        return node

    def range(self, start: int, stop: int) -> Iterator[tuple[int, Any]]:
        leaf = self._leaf_for(start)
        index = bisect_left(leaf.keys, start)
        while leaf:
            while index < len(leaf.keys):
                key = leaf.keys[index]
                if key >= stop:
                    return
                yield key, leaf.values[index]
                index += 1
            leaf = leaf.next
            index = 0

    def validate(self) -> None:
        leaf_depths: set[int] = set()
        leaves: list[Leaf] = []

        def walk(node: Node, depth: int, is_root: bool) -> tuple[int, int]:
            if isinstance(node, Leaf):
                assert node.keys == sorted(node.keys)
                assert len(node.keys) == len(node.values)
                assert is_root or (self.order // 2 <= len(node.keys) < self.order)
                leaf_depths.add(depth)
                leaves.append(node)
                return node.keys[0], node.keys[-1]
            assert len(node.children) == len(node.keys) + 1
            assert is_root or ((self.order + 1) // 2 <= len(node.children) <= self.order)
            ranges = [walk(child, depth + 1, False) for child in node.children]
            assert node.keys == [low for low, _ in ranges[1:]]
            for (_, left_high), (right_low, _) in zip(ranges, ranges[1:]):
                assert left_high < right_low
            return ranges[0][0], ranges[-1][1]

        if isinstance(self.root, Leaf) and not self.root.keys:
            return
        walk(self.root, 0, True)
        assert len(leaf_depths) == 1
        for left, right in zip(leaves, leaves[1:]):
            assert left.next is right
        assert leaves[-1].next is None


if __name__ == "__main__":
    tree = BPlusTree(order=4)
    for number in [8, 3, 12, 1, 5, 10, 14, 6, 9]:
        tree.insert(number, f"value-{number}")
    tree.validate()
    print(list(tree.range(5, 13)))

