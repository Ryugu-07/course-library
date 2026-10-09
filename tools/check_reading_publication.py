#!/usr/bin/env python3
"""Check that stale pages and internal notes cannot leak into publication."""
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from build_public_site import reading_course_files
from build_literature_course import SLUGS


def main():
    with TemporaryDirectory(prefix='reading-publication-') as temp:
        root = Path(temp)
        for name in ('media-course', 'literature-course'):
            course = root / name
            site = course / 'site'
            (site / 'assets').mkdir(parents=True)
            (site / 'assets/reading.css').write_text('body{}')
            (site / 'index.html').write_text('index')
            (site / 'retired.html').write_text('stale')
            (site / 'internal-notes.md').write_text('not a web page')
            expected = {'index.html', 'assets/reading.css'}
            if name == 'media-course':
                for lane in ('communication', 'journalism', 'platforms', 'methods'):
                    source = course / 'content' / lane
                    source.mkdir(parents=True)
                    (source / 'catalog.json').write_text(json.dumps({'lessons': [
                        {'slug': 'ready', 'status': 'ready'},
                        {'slug': 'withdrawn', 'status': 'planned'},
                    ]}))
                    (site / lane).mkdir()
                    for slug in ('index', 'ready', 'withdrawn', 'renamed-old'):
                        (site / lane / (slug + '.html')).write_text(slug)
                    expected.update((f'{lane}/index.html', f'{lane}/ready.html'))
            else:
                (course / 'content').mkdir()
                (course / 'content/catalog.json').write_text(json.dumps({'lessons': [
                    *({'slug': slug, 'status': 'ready'} for slug in SLUGS),
                    {'slug': 'retired', 'status': 'planned'},
                ]}))
                expected.update(slug + '.html' for slug in SLUGS)
                for slug in SLUGS:
                    (site / (slug + '.html')).write_text(slug)
            files = reading_course_files(course)
            assert {p.relative_to(site).as_posix() for p in files} == expected
            assert all(p.is_file() for p in files)
    # Cloudflare only assembles committed HTML, without installing Markdown.
    subprocess.run([sys.executable, '-I', '-S', '-c',
                    "import sys; from pathlib import Path; sys.path.insert(0, sys.argv[1]); "
                    "from build_public_site import reading_course_files; "
                    "assert len(reading_course_files(Path(sys.argv[2]))) > 1",
                    str(Path(__file__).resolve().parent),
                    str(Path(__file__).resolve().parents[1] / 'literature-course')], check=True)
    print('PASS: reading publication excludes planned/retired pages and internal notes.')


if __name__ == '__main__':
    main()
