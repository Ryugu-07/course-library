#!/usr/bin/env python3
"""Check publication status, local navigation, sources and generated HTML."""
from collections import Counter
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'humanities'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.h1 = [], [], 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.h1 += tag == 'h1'
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.links.append(attrs[key])


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--complete', action='store_true', help='Require every catalog entry to have a complete article.')
    options = args.parse_args()
    parsed, expected, forbidden, ready = {}, {HUB / 'index.html'}, set(), []
    for section in ('history', 'society', 'frontier'):
        directory = HUB / 'content' / section
        cat = json.loads((directory / 'catalog.json').read_text())
        expected.add(HUB / section / 'index.html')
        for mod in cat['modules']:
            for lesson in mod['lessons']:
                page = HUB / section / (lesson['slug'] + '.html')
                if lesson['status'] == 'ready':
                    source = (directory / (lesson['slug'] + '.md')).read_text()
                    assert source.lstrip().startswith('# '), f'Missing source title: {page}'
                    assert source.strip().splitlines()[0] == '# ' + lesson['title'], f'Catalog/source title mismatch: {page}'
                    assert not re.search(r'\b(?:TODO|TBD|PLACEHOLDER)\b', source), page
                    assert len(set(re.findall(r'https?://[^\s)>]+', source))) >= 3, f'Missing sources: {page}'
                    assert source.count('<summary') >= 3, f'Expected three reader questions: {page}'
                    assert len(re.findall(r'[\u4e00-\u9fff]', source)) >= 2500, f'Article needs fuller explanation: {page}'
                    ready.append(str(page.relative_to(ROOT)))
                    expected.add(page)
                else:
                    forbidden.add(page.resolve())
    assert len(expected) == len(ready) + 4, 'Catalog and page manifest disagree'
    if options.complete:
        assert not forbidden, f'Route still has {len(forbidden)} unfinished articles'
    generated = {HUB / 'index.html'}
    for section in ('history', 'society', 'frontier'):
        generated.update((HUB / section).rglob('*.html'))
    assert generated == expected, f'Unexpected or missing generated pages: {generated ^ expected}'
    for path in expected:
        assert path.is_file(), f'Missing generated page: {path}'
        page = Page(path.read_text())
        assert page.h1 == 1, f'{path}: expected one h1'
        assert len(page.ids) == len(set(page.ids)), f'{path}: duplicate IDs {Counter(page.ids)}'
        parsed[path.resolve()] = page
    count = 0
    for path, page in parsed.items():
        for ref in page.links:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            target = ((ROOT / unquote(url.path).lstrip('/')) if url.path.startswith('/') else path.parent / unquote(url.path)).resolve() if url.path else path
            if target.is_dir():
                target = target / 'index.html'
            assert target.is_file(), f'{path}: missing {ref}'
            assert target not in forbidden, f'{path}: planned lesson is linked: {ref}'
            if url.fragment and target in parsed:
                assert unquote(url.fragment) in parsed[target].ids, f'{path}: missing anchor {ref}'
            count += 1
    print(json.dumps({'result': 'PASS', 'pages': len(parsed), 'readyArticles': len(ready), 'plannedUnlinked': len(forbidden), 'localReferences': count}, ensure_ascii=False))


if __name__ == '__main__':
    main()
