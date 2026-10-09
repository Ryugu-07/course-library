#!/usr/bin/env python3
"""Verify the literature reading manifest, exact quotations and local links."""
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

from build_literature_course import ROOT, SITE, load, marked_original


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.quotations = [], [], []
        self.quote = None
        self.h1 = 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.h1 += tag == 'h1'
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == 'blockquote' and attrs.get('class') in ('original', 'parallel-original'):
            self.quote = []

    def handle_endtag(self, tag):
        if tag == 'blockquote' and self.quote is not None:
            self.quotations.append(''.join(self.quote))
            self.quote = None

    def handle_data(self, text):
        if self.quote is not None:
            self.quote.append(text)


def main():
    lessons = load()
    expected = {SITE / 'index.html'} | {SITE / (l['slug'] + '.html') for l in lessons}
    assert set(SITE.rglob('*.html')) == expected, 'Literature publication manifest differs'
    parsed = {p: Page(p.read_text(encoding='utf-8')) for p in expected}
    for path, page in parsed.items():
        assert page.h1 == 1 and len(page.ids) == len(set(page.ids)), path
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if target.is_dir():
                target /= 'index.html'
            assert target.is_relative_to(ROOT) and target.is_file(), (path, ref)
            if url.fragment and target.suffix == '.html':
                other = parsed[target] if target in parsed else Page(target.read_text(encoding='utf-8'))
                assert unquote(url.fragment) in other.ids, (path, ref)
    for lesson in lessons:
        marked_original(lesson)  # also rejects overlapping or invented annotations
        quotes = [lesson['original']['text']]
        if lesson.get('parallel'):
            quotes.append(lesson['parallel']['text'])
        assert parsed[SITE / (lesson['slug'] + '.html')].quotations == quotes, lesson['slug']
    print(json.dumps({'result': 'PASS', 'pages': len(expected), 'lessons': len(lessons), 'exact_quotations': 'PASS'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
