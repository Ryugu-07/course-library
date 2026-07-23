#!/usr/bin/env python3
from pathlib import Path


source = Path("reduce_scan.cu").read_text()
required = [
    "__global__ void reduce_atomic",
    "__global__ void reduce_shared",
    "__shfl_down_sync",
    "__global__ void exclusive_scan",
    "cudaEventElapsedTime",
]
missing = [marker for marker in required if marker not in source]
if missing:
    raise SystemExit(f"missing CUDA teaching markers: {missing}")
print("CUDA source structure: PASS")

