#!/usr/bin/env python3
"""Deterministic Raft election and log-replication simulator."""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Entry:
    term: int
    command: str


class Node:
    def __init__(self, node_id: int, cluster: Cluster):
        self.id = node_id
        self.cluster = cluster
        self.state = "follower"
        self.term = 0
        self.voted_for: int | None = None
        self.log: list[Entry] = []
        self.commit_index = -1
        self.votes: set[int] = set()
        self.match_index: dict[int, int] = {}
        self.elapsed = 0
        self.heartbeat_elapsed = 0
        self.reset_timeout()

    def reset_timeout(self) -> None:
        self.timeout = 7 + ((self.id * 3 + self.term * 2) % 5)
        self.elapsed = 0

    def become_follower(self, term: int) -> None:
        if term > self.term:
            self.term = term
            self.voted_for = None
        self.state = "follower"
        self.votes.clear()
        self.reset_timeout()

    def tick(self) -> None:
        if self.state == "leader":
            self.heartbeat_elapsed += 1
            if self.heartbeat_elapsed >= 2:
                self.heartbeat_elapsed = 0
                self.replicate()
            return
        self.elapsed += 1
        if self.elapsed >= self.timeout:
            self.start_election()

    def start_election(self) -> None:
        self.state = "candidate"
        self.term += 1
        self.voted_for = self.id
        self.votes = {self.id}
        self.reset_timeout()
        last_index = len(self.log) - 1
        last_term = self.log[-1].term if self.log else 0
        for peer in self.cluster.peer_ids(self.id):
            self.cluster.send(self.id, peer, ("vote_req", self.term, self.id, last_index, last_term))

    def become_leader(self) -> None:
        self.state = "leader"
        self.match_index = {self.id: len(self.log) - 1}
        self.heartbeat_elapsed = 0
        self.replicate()

    def propose(self, command: str) -> None:
        if self.state != "leader":
            raise RuntimeError("proposal requires a leader")
        self.log.append(Entry(self.term, command))
        self.match_index[self.id] = len(self.log) - 1
        self.replicate()

    def replicate(self) -> None:
        for peer in self.cluster.peer_ids(self.id):
            next_index = self.match_index.get(peer, -1) + 1
            prev_index = next_index - 1
            prev_term = self.log[prev_index].term if prev_index >= 0 else 0
            entries = tuple(self.log[next_index:])
            self.cluster.send(
                self.id,
                peer,
                ("append_req", self.term, self.id, prev_index, prev_term, entries, self.commit_index),
            )

    def receive(self, source: int, message: tuple[Any, ...]) -> None:
        kind, term = message[0], message[1]
        if term > self.term:
            self.become_follower(term)
        if kind == "vote_req":
            _, term, candidate, last_index, last_term = message
            local_last_term = self.log[-1].term if self.log else 0
            up_to_date = (last_term, last_index) >= (local_last_term, len(self.log) - 1)
            grant = term == self.term and up_to_date and self.voted_for in (None, candidate)
            if grant:
                self.voted_for = candidate
                self.reset_timeout()
            self.cluster.send(self.id, source, ("vote_resp", self.term, grant))
        elif kind == "vote_resp":
            _, term, granted = message
            if self.state == "candidate" and term == self.term and granted:
                self.votes.add(source)
                if len(self.votes) >= self.cluster.majority:
                    self.become_leader()
        elif kind == "append_req":
            _, term, leader, prev_index, prev_term, entries, leader_commit = message
            success = term == self.term
            if success:
                self.state = "follower"
                self.reset_timeout()
                if prev_index >= len(self.log) or (
                    prev_index >= 0 and self.log[prev_index].term != prev_term
                ):
                    success = False
                else:
                    insertion = prev_index + 1
                    for offset, entry in enumerate(entries):
                        index = insertion + offset
                        if index < len(self.log) and self.log[index] != entry:
                            del self.log[index:]
                        if index == len(self.log):
                            self.log.append(entry)
                    self.commit_index = min(leader_commit, len(self.log) - 1)
            match = len(self.log) - 1 if success else -1
            self.cluster.send(self.id, leader, ("append_resp", self.term, success, match))
        elif kind == "append_resp":
            _, term, success, match = message
            if self.state != "leader" or term != self.term:
                return
            if success:
                self.match_index[source] = match
                for index in range(len(self.log) - 1, self.commit_index, -1):
                    replicated = sum(value >= index for value in self.match_index.values())
                    if replicated >= self.cluster.majority and self.log[index].term == self.term:
                        self.commit_index = index
                        self.replicate()
                        break
            else:
                self.match_index[source] = max(-1, self.match_index.get(source, -1) - 1)
                self.replicate()


class Cluster:
    def __init__(self, size: int = 3, drop_rate: float = 0.0, seed: int = 1):
        if size < 3:
            raise ValueError("Raft lab expects at least three nodes")
        self.random = random.Random(seed)
        self.drop_rate = drop_rate
        self.blocked: set[tuple[int, int]] = set()
        self.queue: list[tuple[int, int, tuple[Any, ...]]] = []
        self.nodes = [Node(index, self) for index in range(size)]
        self.majority = size // 2 + 1

    def peer_ids(self, node_id: int):
        return (node.id for node in self.nodes if node.id != node_id)

    def send(self, source: int, target: int, message: tuple[Any, ...]) -> None:
        if (source, target) in self.blocked or self.random.random() < self.drop_rate:
            return
        self.queue.append((source, target, message))

    def step(self) -> None:
        for node in self.nodes:
            node.tick()
        queued, self.queue = self.queue, []
        for source, target, message in queued:
            if (source, target) not in self.blocked:
                self.nodes[target].receive(source, message)

    def run(self, steps: int) -> None:
        for _ in range(steps):
            self.step()

    def leader(self, allowed: set[int] | None = None) -> Node | None:
        candidates = [
            node for node in self.nodes
            if node.state == "leader" and (allowed is None or node.id in allowed)
        ]
        return max(candidates, key=lambda node: node.term) if candidates else None

    def partition(self, left: set[int], right: set[int]) -> None:
        for source in left:
            for target in right:
                self.blocked.add((source, target))
                self.blocked.add((target, source))

    def heal(self) -> None:
        self.blocked.clear()


if __name__ == "__main__":
    cluster = Cluster()
    cluster.run(20)
    leader = cluster.leader()
    assert leader
    leader.propose("set x=42")
    cluster.run(12)
    for node in cluster.nodes:
        print(node.id, node.state, node.term, node.commit_index, node.log)

