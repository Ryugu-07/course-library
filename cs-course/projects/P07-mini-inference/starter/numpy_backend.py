"""Optional NumPy adapter.

Importing this module never imports NumPy. Constructing the adapter may require it; the base
scaffold and verifier do not instantiate the adapter, so NumPy/GPU is not a default dependency.
"""

from __future__ import annotations

from typing import Any


class NumpyBackend:
    def __init__(self) -> None:
        try:
            import numpy as np  # type: ignore
        except ImportError as exc:  # pragma: no cover - depends on environment
            raise RuntimeError("NumPy backend is optional; install numpy to use this adapter") from exc
        self._np = np

    def empty(self, shape: tuple[int, ...], dtype: str = "float32") -> Any:
        return self._np.empty(shape, dtype=dtype)

    def matmul(self, left: Any, right: Any) -> Any:
        raise NotImplementedError("TODO(P07-EXT): select and measure a NumPy/GPU matmul path")
