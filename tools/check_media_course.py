#!/usr/bin/env python3
"""Check source/publication boundaries and navigability of the media course."""
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'media-course'
SITE = COURSE / 'site'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.refs = [], []
        self.tags = Counter()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags[tag] += 1
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for attr in ('href', 'src'):
            if attrs.get(attr):
                self.refs.append(attrs[attr])


expected = {SITE / 'index.html'}
ready_count = planned_count = questions = characters = 0
planned = set()
for catalog_path in sorted((COURSE / 'content').glob('*/catalog.json')):
    catalog = json.loads(catalog_path.read_text())
    lane = catalog['id']
    expected.add(SITE / lane / 'index.html')
    for lesson in catalog['lessons']:
        source = catalog_path.parent / (lesson['slug'] + '.md')
        output = SITE / lane / (lesson['slug'] + '.html')
        if lesson['status'] == 'planned':
            planned_count += 1
            planned.add(output)
            assert not source.exists() and not output.exists(), f'Planned lesson masquerades as ready: {source}'
            continue
        assert lesson['status'] == 'ready'
        ready_count += 1
        text = source.read_text()
        assert text.startswith('# ' + lesson['title'] + '\n'), source
        assert len(re.findall(r'^# ', text, re.M)) == 1, source
        assert not re.search(r'\b(?:TODO|TBD|FIXME)\b', text), source
        assert text.count('<details') >= 3 and text.count('<details') == text.count('</details>'), source
        assert len(set(re.findall(r'https?://[^\s)<>]+', text))) >= 3, source
        chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        assert chars > 2000, f'Unexpectedly short lesson: {source}'
        characters += chars
        questions += text.count('<details')
        expected.add(output)

assert {c.parent.name for c in (COURSE / 'content').glob('*/catalog.json')} == {'communication', 'journalism', 'platforms', 'methods'}
actual = set(SITE.rglob('*.html'))
assert actual == expected, f'HTML manifest differs: {actual ^ expected}'
parsed = {path: Page(path.read_text()) for path in actual}
links = 0
for path, page in parsed.items():
    assert page.tags['h1'] == 1, path
    assert len(page.ids) == len(set(page.ids)), f'Duplicate IDs: {path}'
    assert page.tags['main'] == 1, path
    for ref in page.refs:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc:
            continue
        target = (path.parent / unquote(parts.path)).resolve() if parts.path else path
        if target.is_dir():
            target = target / 'index.html'
        assert target.exists(), f'Broken link: {path} -> {ref}'
        assert target not in planned, f'Link to unbuilt lesson: {ref}'
        assert target.is_relative_to(SITE) or target == ROOT / 'humanities/index.html', f'Unexpected local dependency: {path} -> {ref}'
        if parts.fragment and target.suffix == '.html':
            target_page = parsed[target] if target in parsed else Page(target.read_text())
            assert unquote(parts.fragment) in target_page.ids, f'Broken anchor: {path} -> {ref}'
        links += 1
print(json.dumps({'result': 'PASS', 'pages': len(actual), 'ready': ready_count, 'planned': planned_count, 'questions': questions, 'hanzi': characters, 'local_references': links}, ensure_ascii=False))
