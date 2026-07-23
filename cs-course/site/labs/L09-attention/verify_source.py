#!/usr/bin/env python3
from pathlib import Path


source = Path("attention.cu").read_text()
required = [
    "__global__ void attention_tiled",
    "row_max",
    "expf(scores[tid] - row_max)",
    "__shared__",
    "cudaEventElapsedTime",
]
missing = [marker for marker in required if marker not in source]
if missing:
    raise SystemExit(f"missing attention teaching markers: {missing}")
print("CUDA attention source structure: PASS")

