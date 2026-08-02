from __future__ import annotations

import ast
import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class P02ScaffoldTest(unittest.TestCase):
    def test_required_files_and_incomplete_markers(self) -> None:
        required = [
            "README.md",
            "rubric.md",
            "DESIGN.md",
            "starter/__init__.py",
            "starter/protocol.py",
            "starter/sql_ast.py",
            "starter/driver.py",
            "fixtures/contract_scenarios.json",
            "fixtures/recovery_faults.json",
            "acceptance/README.md",
            "scripts/verify_scaffold.py",
        ]
        for relative in required:
            self.assertTrue((ROOT / relative).is_file(), relative)
        protocol = (ROOT / "starter/protocol.py").read_text(encoding="utf-8")
        self.assertIn("NotImplementedFeature", protocol)
        self.assertIn("TODO(student)", protocol)
        self.assertIn("class StorageEngine(Protocol)", protocol)

    def test_protocol_and_sql_signatures_exist(self) -> None:
        protocol_tree = ast.parse((ROOT / "starter/protocol.py").read_text(encoding="utf-8"))
        protocol_names = {
            node.name
            for node in protocol_tree.body
            if isinstance(node, (ast.FunctionDef, ast.ClassDef))
        }
        self.assertTrue({"StorageEngine", "TransactionManager", "TodoDatabase", "validate_schema"} <= protocol_names)
        sql_tree = ast.parse((ROOT / "starter/sql_ast.py").read_text(encoding="utf-8"))
        sql_names = {node.name for node in sql_tree.body if isinstance(node, ast.FunctionDef)}
        self.assertIn("parse_sql", sql_names)

    def test_fixture_schema_and_driver_are_runnable(self) -> None:
        fixture = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
        faults = json.loads((ROOT / "fixtures/recovery_faults.json").read_text(encoding="utf-8"))
        self.assertEqual(fixture["schema_version"], 1)
        self.assertGreaterEqual(len(fixture["scenarios"]), 4)
        self.assertGreaterEqual(len(faults["faults"]), 4)
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--scenario", "fixtures/contract_scenarios.json"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("hooks remain intentionally unimplemented", result.stdout)


if __name__ == "__main__":
    unittest.main()
