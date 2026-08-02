from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from engine import InferenceEngine  # noqa: E402
from kv_cache import KVCacheManager  # noqa: E402
from scheduler import ContinuousBatchScheduler  # noqa: E402
from schema import Request  # noqa: E402


@unittest.skipUnless(
    os.environ.get("RUN_STUDENT_ACCEPTANCE") == "1",
    "student acceptance is opt-in; engine/cache/scheduler are intentionally incomplete",
)
class StudentAcceptanceTests(unittest.TestCase):
    def test_engine_stream_matches_reference_contract(self) -> None:
        engine = InferenceEngine()
        request_id = engine.submit([1, 2], 3, request_id="short")
        events = list(engine.stream(request_id))
        self.assertEqual([event.token_id for event in events], [7, 8, 9])

    def test_scheduler_admits_and_cache_releases(self) -> None:
        scheduler = ContinuousBatchScheduler(8, 2, 4)
        scheduler.submit(Request("short", (1, 2), 3, 0))
        decision = scheduler.step(2)
        self.assertIn("short", decision.active)
        cache = KVCacheManager(page_size=4, max_pages=8, head_dim=8)
        handle = cache.allocate("short", 2)
        cache.release(handle)


if __name__ == "__main__":
    unittest.main()
