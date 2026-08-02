from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "starter"))

from packet import Segment  # noqa: E402
from protocol import Receiver, Sender  # noqa: E402


@unittest.skipUnless(
    os.environ.get("RUN_STUDENT_ACCEPTANCE") == "1",
    "student acceptance is opt-in; protocol methods are intentionally incomplete",
)
class StudentAcceptanceTests(unittest.TestCase):
    def test_sender_segments_and_receiver_reassembles(self) -> None:
        sender = Sender(initial_seqno=100, max_payload=4)
        receiver = Receiver(initial_seqno=100)
        segments = sender.on_application_bytes(b"abcdefgh")
        self.assertGreaterEqual(len(segments), 2)
        for segment in segments:
            receiver.on_segment(segment)
        self.assertEqual(receiver.read(), b"abcdefgh")

    def test_timeout_produces_retransmission(self) -> None:
        sender = Sender(initial_seqno=0)
        sender.on_application_bytes(b"hello")
        retransmissions = sender.on_tick(now=10**6)
        self.assertTrue(retransmissions)


if __name__ == "__main__":
    unittest.main()
