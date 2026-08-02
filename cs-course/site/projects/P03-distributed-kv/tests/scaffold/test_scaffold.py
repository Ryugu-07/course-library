from __future__ import annotations

import ast
import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class P03ScaffoldTest(unittest.TestCase):
    def test_required_files_and_incomplete_markers(self) -> None:
        required = [
            "README.md",
            "rubric.md",
            "DESIGN.md",
            "starter/__init__.py",
            "starter/protocol.py",
            "starter/transport.py",
            "starter/driver.py",
            "fixtures/contract_scenarios.json",
            "fixtures/linearizability_history.json",
            "acceptance/README.md",
            "scripts/verify_scaffold.py",
        ]
        for relative in required:
            self.assertTrue((ROOT / relative).is_file(), relative)
        protocol = (ROOT / "starter/protocol.py").read_text(encoding="utf-8")
        self.assertIn("NotImplementedFeature", protocol)
        self.assertIn("TODO(student)", protocol)
        self.assertIn("class RaftNode", protocol)

    def test_protocol_signatures_and_transport_behavior(self) -> None:
        tree = ast.parse((ROOT / "starter/protocol.py").read_text(encoding="utf-8"))
        classes = {node.name: node for node in tree.body if isinstance(node, ast.ClassDef)}
        self.assertTrue({"RaftNode", "Persister", "TodoKV", "ApplyMsg"} <= set(classes))
        raft_methods = {
            node.name
            for node in classes["RaftNode"].body
            if isinstance(node, ast.FunctionDef)
        }
        self.assertTrue({"start", "tick", "receive", "read_index", "restore"} <= raft_methods)

        sys.path.insert(0, str(ROOT / "starter"))
        from transport import DeterministicTransport  # pylint: disable=import-outside-toplevel
        from protocol import MessageType, RpcEnvelope  # pylint: disable=import-outside-toplevel

        transport = DeterministicTransport(["n1", "n2"])
        transport.partition(["n1"], ["n2"])
        transport.send(RpcEnvelope("n1", "n2", 1, MessageType.APPEND_ENTRIES))
        delivery = transport.deliver_one()
        self.assertIsNotNone(delivery)
        self.assertFalse(delivery.delivered)

    def test_fixture_schema_and_driver_are_runnable(self) -> None:
        fixture = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
        history = json.loads((ROOT / "fixtures/linearizability_history.json").read_text(encoding="utf-8"))
        self.assertEqual(fixture["schema_version"], 1)
        self.assertGreaterEqual(len(fixture["events"]), 6)
        self.assertGreaterEqual(len(history["operations"]), 4)
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--scenario", "fixtures/contract_scenarios.json"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("are not called", result.stdout)
        self.assertIn("blocked", result.stdout)


if __name__ == "__main__":
    unittest.main()
