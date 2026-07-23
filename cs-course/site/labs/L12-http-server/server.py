#!/usr/bin/env python3
"""A minimal HTTP/1.1 server with keep-alive and chunked responses."""

from __future__ import annotations

import argparse
import mimetypes
import socketserver
from pathlib import Path
from urllib.parse import unquote, urlsplit


MAX_HEADERS = 64 * 1024


class HTTPError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message


class HTTPHandler(socketserver.BaseRequestHandler):
    server: HTTPServer

    def handle(self) -> None:
        self.request.settimeout(5)
        buffer = b""
        while True:
            try:
                parsed = self.read_request(buffer)
            except (ConnectionError, TimeoutError):
                return
            except HTTPError as error:
                self.send_bytes(error.status, error.message.encode(), close=True)
                return
            if parsed is None:
                return
            method, target, version, headers, buffer = parsed
            close = version != "HTTP/1.1" or headers.get("connection", "").lower() == "close"
            if method != "GET":
                self.send_bytes(405, b"method not allowed\n", close=True)
                return
            path = unquote(urlsplit(target).path)
            if path == "/":
                self.send_bytes(200, b"minimal HTTP/1.1 server\n", close=close)
            elif path == "/stream":
                self.send_chunked([b"socket\n", b"http\n", b"done\n"], close=close)
            elif path.startswith("/static/"):
                self.send_static(path.removeprefix("/static/"), close)
            else:
                self.send_bytes(404, b"not found\n", close=close)
            if close:
                return

    def read_request(self, buffer: bytes):
        while b"\r\n\r\n" not in buffer:
            chunk = self.request.recv(4096)
            if not chunk:
                return None
            buffer += chunk
            if len(buffer) > MAX_HEADERS:
                raise HTTPError(431, "request headers too large\n")
        raw_headers, buffer = buffer.split(b"\r\n\r\n", 1)
        try:
            lines = raw_headers.decode("iso-8859-1").split("\r\n")
            method, target, version = lines[0].split()
            headers = {}
            for line in lines[1:]:
                name, value = line.split(":", 1)
                headers[name.strip().lower()] = value.strip()
        except (ValueError, UnicodeError) as error:
            raise HTTPError(400, "bad request\n") from error
        if version not in {"HTTP/1.0", "HTTP/1.1"}:
            raise HTTPError(505, "HTTP version not supported\n")
        return method, target, version, headers, buffer

    def send_static(self, relative: str, close: bool) -> None:
        root = self.server.static_root.resolve()
        candidate = (root / relative).resolve()
        try:
            candidate.relative_to(root)
        except ValueError:
            self.send_bytes(403, b"forbidden\n", close=close)
            return
        if not candidate.is_file():
            self.send_bytes(404, b"not found\n", close=close)
            return
        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        self.send_bytes(200, candidate.read_bytes(), close=close, content_type=content_type)

    def send_bytes(
        self,
        status: int,
        body: bytes,
        *,
        close: bool,
        content_type: str = "text/plain; charset=utf-8",
    ) -> None:
        reason = {
            200: "OK", 400: "Bad Request", 403: "Forbidden", 404: "Not Found",
            405: "Method Not Allowed", 431: "Request Header Fields Too Large",
            505: "HTTP Version Not Supported",
        }[status]
        headers = (
            f"HTTP/1.1 {status} {reason}\r\n"
            f"Content-Length: {len(body)}\r\n"
            f"Content-Type: {content_type}\r\n"
            f"Connection: {'close' if close else 'keep-alive'}\r\n"
            "\r\n"
        ).encode("ascii")
        self.request.sendall(headers + body)

    def send_chunked(self, chunks: list[bytes], *, close: bool) -> None:
        headers = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/plain; charset=utf-8\r\n"
            "Transfer-Encoding: chunked\r\n"
            f"Connection: {'close' if close else 'keep-alive'}\r\n"
            "\r\n"
        ).encode("ascii")
        self.request.sendall(headers)
        for chunk in chunks:
            self.request.sendall(f"{len(chunk):x}\r\n".encode("ascii") + chunk + b"\r\n")
        self.request.sendall(b"0\r\n\r\n")


class HTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self, address, static_root: Path):
        self.static_root = static_root
        super().__init__(address, HTTPHandler)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8088)
    parser.add_argument("--root", type=Path, default=Path(__file__).parent / "public")
    args = parser.parse_args()
    with HTTPServer((args.host, args.port), args.root) as server:
        print(f"serving http://{args.host}:{args.port}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

