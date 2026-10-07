#!/usr/bin/env python3
"""Exercise removal and publication boundaries using a tiny temporary fixture."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import build_humanities as builder
from build_public_site import hub_files


def main():
    original = builder.HUB
    try:
        with TemporaryDirectory(prefix='humanities-manifest-') as temp:
            hub = Path(temp)
            builder.HUB = hub
            (hub / 'index.html').write_text('hub')
            (hub / 'assets').mkdir()
            (hub / 'assets' / 'reading.css').write_text('body{}')
            for section in ('history', 'society', 'frontier'):
                source = hub / 'content' / section
                source.mkdir(parents=True)
                catalog = {'modules': [{'lessons': [
                    {'slug': 'retained', 'status': 'ready'},
                    {'slug': 'withdrawn', 'status': 'planned'},
                ]}]}
                (source / 'catalog.json').write_text(json.dumps(catalog))
                (source / 'research-notes.md').write_text('internal')
                (hub / section).mkdir()
                for name in ('index', 'retained', 'withdrawn', 'renamed-old-slug'):
                    (hub / section / (name + '.html')).write_text(name)
            # The publisher must not leak retired pages before a rebuild either.
            packaged = {p.relative_to(hub).as_posix() for p in hub_files(hub)}
            expected = {'index.html', 'assets/reading.css'} | {
                f'{s}/{name}.html' for s in ('history', 'society', 'frontier')
                for name in ('index', 'retained')
            }
            assert packaged == expected, packaged ^ expected
            for section in ('history', 'society', 'frontier'):
                builder.remove_retired_pages(section, catalog)
                assert {p.name for p in (hub / section).glob('*.html')} == {'index.html', 'retained.html'}
                assert (hub / 'content' / section / 'research-notes.md').is_file()
            assert all(p.is_file() for p in hub_files(hub))
        print('PASS: withdrawn/renamed pages removed; publisher excludes stale pages and research sources.')
    finally:
        builder.HUB = original


if __name__ == '__main__':
    main()
