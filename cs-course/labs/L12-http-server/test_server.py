from __future__ import annotations

import socket
import threading
import unittest
from pathlib import Path

from server import HTTPServer


def read_response(connection: socket.socket, pending: bytes = b""):
    while b"\r\n\r\n" not in pending:
        pending += connection.recv(4096)
    raw_headers, pending = pending.split(b"\r\n\r\n", 1)
    lines = raw_headers.decode().split("\r\n")
    status = int(lines[0].split()[1])
    headers = dict(line.split(": ", 1) for line in lines[1:])
    if headers.get("Transfer-Encoding") == "chunked":
        body = b""
        while True:
            while b"\r\n" not in pending:
                pending += connection.recv(4096)
            raw_size, pending = pending.split(b"\r\n", 1)
            size = int(raw_size, 16)
            if size == 0:
                while len(pending) < 2:
                    pending += connection.recv(4096)
                pending = pending[2:]
                break
            while len(pending) < size + 2:
                pending += connection.recv(4096)
            body += pending[:size]
            pending = pending[size + 2:]
    else:
        length = int(headers["Content-Length"])
        while len(pending) < length:
            pending += connection.recv(4096)
        body, pending = pending[:length], pending[length:]
    return status, headers, body, pending


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).parent / "public"
        cls.server = HTTPServer(("127.0.0.1", 0), root)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.address = cls.server.server_address

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def connect(self):
        return socket.create_connection(self.address, timeout=2)

    def test_keep_alive_two_requests(self):
        with self.connect() as connection:
            connection.sendall(b"GET / HTTP/1.1\r\nHost: lab\r\n\r\n")
            status, _, body, pending = read_response(connection)
            self.assertEqual((status, body), (200, b"minimal HTTP/1.1 server\n"))
            connection.sendall(
                b"GET /static/hello.txt HTTP/1.1\r\nHost: lab\r\nConnection: close\r\n\r\n"
            )
            status, headers, body, _ = read_response(connection, pending)
            self.assertEqual(status, 200)
            self.assertEqual(headers["Connection"], "close")
            self.assertIn(b"L12 static", body)

    def test_chunked_response(self):
        with self.connect() as connection:
            connection.sendall(
                b"GET /stream HTTP/1.1\r\nHost: lab\r\nConnection: close\r\n\r\n"
            )
            status, headers, body, _ = read_response(connection)
            self.assertEqual(status, 200)
            self.assertEqual(headers["Transfer-Encoding"], "chunked")
            self.assertEqual(body, b"socket\nhttp\ndone\n")

    def test_path_traversal_is_blocked(self):
        with self.connect() as connection:
            connection.sendall(
                b"GET /static/../server.py HTTP/1.1\r\nHost: lab\r\nConnection: close\r\n\r\n"
            )
            status, _, _, _ = read_response(connection)
            self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
