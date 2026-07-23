#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path


binary = Path(sys.argv[1]).resolve()
with tempfile.TemporaryDirectory() as temp:
    output = Path(temp) / "out.txt"
    script = (
        "echo hello|tr a-z A-Z\n"
        f"echo file-data>{output}\n"
        f"cat<{output}\n"
        "pwd\n"
        f"cd {temp}\n"
        "pwd\n"
        "sleep 0.01&\n"
        "exit\n"
    )
    result = subprocess.run(
        [binary],
        input=script,
        text=True,
        capture_output=True,
        timeout=5,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    assert lines[0] == "HELLO", lines
    assert lines[1] == "file-data", lines
    assert Path(lines[-1]).resolve() == Path(temp).resolve(), lines
    assert output.read_text() == "file-data\n"
print("shell acceptance: PASS")
