#!/usr/bin/env python3
"""Check external links in Markdown without adding a third-party dependency."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from ipaddress import ip_address
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit, urlunsplit
from urllib.request import Request, urlopen


URL_RE = re.compile(r"https?://[^\s)>]+")
FENCE_RE = re.compile(r"^[ \t]{0,3}(?P<fence>`{3,}|~{3,})")
INLINE_CODE_RE = re.compile(r"(?P<fence>`+).*?(?P=fence)", re.DOTALL)
RESTRICTED_BUT_REACHABLE = {401, 403, 429}
PATH_QUOTE_SAFE = "/%:@!$&'()*+,;=-._~"
URL_TERMINATORS = "\"'`{}<>，。；：、！？（）【】「」『』《》〈〉“”‘’…"
TRAILING_URL_PUNCTUATION = ".,;:!?"


def prepare_url(url: str) -> str:
    """Quote only URL path bytes while preserving URL structure and query data."""
    parts = urlsplit(url)
    path = quote(parts.path, safe=PATH_QUOTE_SAFE)
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def exception_status(exc: Exception) -> str:
    """Return a stable, compact status for an unexpected per-URL failure."""
    return type(exc).__name__


def strip_code(text: str) -> str:
    """Remove fenced blocks and inline code before scanning for clickable URLs."""
    visible_lines: list[str] = []
    fence_char: str | None = None
    fence_length = 0
    for line in text.splitlines(keepends=True):
        match = FENCE_RE.match(line)
        if fence_char is not None:
            if (
                match
                and match.group("fence")[0] == fence_char
                and len(match.group("fence")) >= fence_length
                and not line[match.end() :].strip()
            ):
                fence_char = None
            continue
        if match:
            fence = match.group("fence")
            fence_char, fence_length = fence[0], len(fence)
            continue
        visible_lines.append(line)
    return INLINE_CODE_RE.sub("", "".join(visible_lines))


def clean_url(raw_url: str) -> str:
    """Cut a Markdown URL at the first prose delimiter, then trim ASCII stops."""
    for index, character in enumerate(raw_url):
        if character == "]" and _is_ipv6_closing_bracket(raw_url, index):
            continue
        if character == "]":
            raw_url = raw_url[:index]
            break
        if character in URL_TERMINATORS:
            raw_url = raw_url[:index]
            break
    return raw_url.rstrip(TRAILING_URL_PUNCTUATION)


def _is_ipv6_closing_bracket(url: str, index: int) -> bool:
    """Keep the matched closing bracket in an IPv6 URL authority."""
    authority_start = url.find("://")
    if authority_start < 0:
        return False
    authority_start += 3
    authority_end = len(url)
    for delimiter in "/?#":
        delimiter_index = url.find(delimiter, authority_start)
        if delimiter_index >= 0:
            authority_end = min(authority_end, delimiter_index)
    if not authority_start <= index < authority_end:
        return False
    return url.rfind("[", authority_start, index) > url.rfind("]", authority_start, index)


def is_local_url(url: str) -> bool:
    """Return whether URL points to a local loopback service example."""
    try:
        hostname = urlsplit(url).hostname
    except ValueError:
        return False
    if not hostname:
        return False
    hostname = hostname.rstrip(".").lower()
    if hostname == "localhost":
        return True
    try:
        return ip_address(hostname).is_loopback
    except ValueError:
        return False


def find_urls(paths: list[Path]) -> list[str]:
    urls: set[str] = set()
    for path in paths:
        files = path.rglob("*.md") if path.is_dir() else [path]
        for file in files:
            text = strip_code(file.read_text(encoding="utf-8"))
            for raw_url in URL_RE.findall(text):
                url = clean_url(raw_url)
                if url and not is_local_url(url):
                    urls.add(url)
    return sorted(urls)


def check(url: str, timeout: float) -> tuple[str, int | str]:
    headers = {"User-Agent": "course-library-link-check/1.0"}
    try:
        request_url = prepare_url(url)
    except Exception as exc:
        return url, exception_status(exc)

    try:
        request = Request(request_url, headers=headers, method="HEAD")
        with urlopen(request, timeout=timeout) as response:
            return url, response.status
    except HTTPError as exc:
        if exc.code not in {405, 501}:
            return url, exc.code
    except (URLError, TimeoutError, OSError):
        pass
    except Exception as exc:
        return url, exception_status(exc)

    try:
        request = Request(
            request_url, headers={**headers, "Range": "bytes=0-0"}
        )
        with urlopen(request, timeout=timeout) as response:
            return url, response.status
    except HTTPError as exc:
        return url, exc.code
    except (URLError, TimeoutError, OSError) as exc:
        return url, exception_status(exc)
    except Exception as exc:
        return url, exception_status(exc)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", type=Path)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=15.0)
    args = parser.parse_args()

    urls = find_urls(args.paths)
    failures: list[tuple[str, int | str]] = []
    restricted = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(check, url, args.timeout): url
            for url in urls
        }
        for future in as_completed(futures):
            source_url = futures[future]
            try:
                url, status = future.result()
            except Exception as exc:
                url, status = source_url, exception_status(exc)
            if status in RESTRICTED_BUT_REACHABLE:
                restricted += 1
            elif not isinstance(status, int) or status >= 400:
                failures.append((url, status))

    print(
        f"Checked {len(urls)} unique URL(s): "
        f"restricted={restricted} failures={len(failures)}"
    )
    for url, status in sorted(failures):
        print(f"- {status}: {url}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
