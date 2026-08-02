from __future__ import annotations

import ast
import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class P01ScaffoldTest(unittest.TestCase):
    def test_required_files_and_markers_exist(self) -> None:
        required = [
            "README.md",
            "rubric.md",
            "DESIGN.md",
            "starter/api/contract.py",
            "starter/driver.py",
            "starter/xv6_hooks.h",
            "starter/xv6_hooks.c",
            "fixtures/contract_scenarios.json",
            "fixtures/fault_injection.json",
            "acceptance/README.md",
            "scripts/verify_scaffold.py",
        ]
        for relative in required:
            self.assertTrue((ROOT / relative).is_file(), relative)
        contract = (ROOT / "starter/api/contract.py").read_text(encoding="utf-8")
        self.assertIn("NotImplementedFeature", contract)
        self.assertIn("TODO(student)", contract)

    def test_contract_function_signatures_are_present(self) -> None:
        tree = ast.parse((ROOT / "starter/api/contract.py").read_text(encoding="utf-8"))
        functions = {node.name: node for node in tree.body if isinstance(node, ast.FunctionDef)}
        expected = {
            "map_user_page": ["request"],
            "dispatch_syscall": ["request"],
            "acquire_ordered_lock": ["request"],
            "recover_transaction": ["request"],
            "resolve_mmap_fault": ["request"],
        }
        for name, parameters in expected.items():
            self.assertIn(name, functions)
            self.assertEqual([arg.arg for arg in functions[name].args.args], parameters)

    def test_fixture_schema_and_driver_are_runnable(self) -> None:
        fixture = json.loads((ROOT / "fixtures/contract_scenarios.json").read_text(encoding="utf-8"))
        self.assertEqual(fixture["schema_version"], 1)
        self.assertGreaterEqual(len(fixture["scenarios"]), 4)
        result = subprocess.run(
            [sys.executable, "starter/driver.py", "--scenario", "fixtures/contract_scenarios.json"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Core kernel hooks are intentionally not called", result.stdout)


if __name__ == "__main__":
    unittest.main()
