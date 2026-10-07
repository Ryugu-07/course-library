#!/usr/bin/env python3
"""Build the humanities reading collection from explicit publication catalogs."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / 'humanities'
SECTIONS = {
    'history': ('历史', '过去留下了什么？', '从史前到当代，沿着证据理解世界怎样改变。'),
    'society': ('社会', '我们怎样生活在一起？', '把日常经验放进理论，再把理论放到材料面前。'),
    'frontier': ('哲学研究现场', '一个争论，走到了哪里？', '进入正在发生的研究，跟住理由、异议与回应。'),
}


def e(value):
    return html.escape(str(value), quote=True)


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding='utf-8') != content:
        path.write_text(content, encoding='utf-8')


def entries(catalog):
    return [lesson for module in catalog['modules'] for lesson in module['lessons']]


def load_catalogs():
    result = {}
    for section in SECTIONS:
        source = HUB / 'content' / section
        catalog = json.loads((source / 'catalog.json').read_text(encoding='utf-8'))
        seen = set()
        for module in catalog['modules']:
            if not re.fullmatch(r'[a-z0-9-]+', module['id']):
                raise ValueError(f'Invalid module id: {section}/{module["id"]}')
            for lesson in module['lessons']:
                slug = lesson['slug']
                if not re.fullmatch(r'[a-z0-9-]+', slug) or slug in seen:
                    raise ValueError(f'Invalid/duplicate slug: {section}/{slug}')
                seen.add(slug)
                if lesson['status'] not in ('ready', 'planned'):
                    raise ValueError(f'Invalid status: {section}/{slug}')
                if lesson['status'] == 'ready' and not (source / f'{slug}.md').is_file():
                    raise FileNotFoundError(f'Ready lesson has no source: {section}/{slug}')
        result[section] = catalog
    return result


def shell(title, description, section, content, depth=0, body_class=''):
    prefix = '../' * depth
    links = []
    for key, label in SECTIONS.items():
        current = ' aria-current="true"' if key == section else ''
        links.append(f'<a href="{prefix}{key}/index.html"{current}>{label[0]}</a>')
    nav = ''.join(links)
    return f'''<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="description" content="{e(description)}">
<title>{e(title)} · 文史与社会</title>
<link rel="stylesheet" href="{prefix}assets/reading.css">
<script defer src="{prefix}assets/reading.js"></script></head>
<body class="{e(body_class)}" data-section="{e(section)}">
<a class="skip" href="#main">跳到正文</a>
<header class="masthead"><a class="brand" href="{prefix}index.html"><span class="brand-mark" aria-hidden="true">文</span><span>文史与社会<small>COURSE LIBRARY</small></span></a><nav aria-label="分馆导航">{nav}</nav><a class="library-link" href="{prefix}../index.html">理工分馆 ↗</a></header>
{content}
<footer class="site-footer"><span>文史哲分馆 · Course Library</span><span>2026 年 10 月版</span><a href="#main">回到正文 ↑</a></footer>
</body></html>'''


def lesson_card(section, lesson, number, relative=''):
    return f'''<article class="reading-card">
<div class="card-meta"><span>{e(SECTIONS[section][0])} / {number:02d}</span><span>约 {lesson['minutes']} 分钟</span></div>
<h3><a href="{relative}{lesson['slug']}.html" data-lesson="{section}/{lesson['slug']}">{e(lesson['title'])}</a></h3>
<p>{e(lesson['summary'])}</p><span class="card-foot">开始阅读 <span aria-hidden="true">↗</span></span></article>'''


def directory_row(section, lesson):
    terms = lesson['title'] + ' ' + lesson['summary'] + ' ' + SECTIONS[section][0]
    return f'''<article class="catalog-item" data-search="{e(terms)}"><span class="catalog-label">{e(SECTIONS[section][0])}</span><div><h3><a href="{section}/{lesson['slug']}.html" data-lesson="{section}/{lesson['slug']}">{e(lesson['title'])}</a></h3><p>{e(lesson['summary'])}</p></div><span class="catalog-time">约 {lesson['minutes']} 分钟</span></article>'''


def home(catalogs):
    lanes = []
    for number, (section, (label, question, intro)) in enumerate(SECTIONS.items(), 1):
        catalog = catalogs[section]
        ready = [l for l in entries(catalog) if l['status'] == 'ready']
        count = len(entries(catalog))
        count_label = f'{len(ready)} 篇专题' if section == 'frontier' else f'{len(ready)} / {count} 讲可读'
        lanes.append(f'''<section class="shelf shelf-{section}" aria-labelledby="shelf-{section}"><div class="shelf-label"><span class="number">0{number}</span><span>{label}</span></div><div class="shelf-copy"><h2 id="shelf-{section}"><a href="{section}/index.html">{question}</a></h2><p>{intro}</p><div class="shelf-bottom"><span>{count_label}</span><a href="{section}/index.html">进入{label} <span aria-hidden="true">↗</span></a></div></div><div class="shelf-reading"><span class="eyebrow">从这里读起</span><a href="{section}/{ready[0]['slug']}.html">{e(ready[0]['title'])}</a><p>{e(ready[0]['summary'])}</p></div></section>''')
    all_ready = [(section, lesson) for section, catalog in catalogs.items() for lesson in entries(catalog) if lesson['status'] == 'ready']
    cards = ''.join(lesson_card(section, l, i, f'{section}/') for section, catalog in catalogs.items() for i, l in enumerate([x for x in entries(catalog) if x['status']=='ready'][:2], 1))
    rows = ''.join(directory_row(section, lesson) for section, lesson in all_ready)
    counts = {s: sum(l['status'] == 'ready' for l in entries(c)) for s, c in catalogs.items()}
    content = f'''<main id="main" class="collection">
<section class="collection-hero"><div><p class="eyebrow">历史 · 社会 · 哲学研究</p><h1>理解我们<br>共同生活的世界<span class="title-dot">。</span></h1><p class="lead">从过去的痕迹，到眼前的生活。<br>读材料，追问解释，形成自己的判断。</p><a class="primary-link" href="#shelves">选择一条阅读路径 <span aria-hidden="true">↓</span></a></div><aside class="edition"><p class="eyebrow">2026 年 10 月版</p><p class="edition-title">证据、机会<br>与判断</p><p>{counts['history']} 讲历史课程<br>{counts['society']} 讲社会课程<br>{counts['frontier']} 篇哲学研究专题</p><p class="edition-note">沿课程地图连续读。<br>也可以从关心的问题进入。</p></aside></section>
<div id="shelves" class="shelves">{''.join(lanes)}</div>
<section id="reading" class="reading-section"><div class="section-heading"><div><p class="eyebrow">阅读入口</p><h2>从一个具体问题开始</h2></div><div class="search-box enhanced" hidden><label for="reading-search">检索全馆文章</label><input type="search" id="reading-search" placeholder="例如：农业、教育、AI" autocomplete="off"></div></div><p id="search-count" class="search-count enhanced" role="status" hidden></p><div class="reading-grid">{cards}</div><details class="catalog-browser" id="all-readings"><summary>浏览全部 {len(all_ready)} 篇正文</summary><div class="course-directory">{rows}</div></details></section>
<section class="reading-note"><div><p class="eyebrow">怎样读</p><h2>读到分歧处，<br>停留一会儿。</h2></div><p>每篇提供充分展开的讲解、可核查的来源和带解析的阅读问题。重要的分歧会回到具体材料与论证；需要背景的地方，随文补足。你可以沿课程连续读，也可以先进入最关心的问题。</p></section>
<a class="legacy" href="../wxb-course/site/index.html"><span>文学书架 · 既有专题</span><strong>重读王小波</strong><span>作品、思想与文体的九章细读 ↗</span></a>
</main>'''
    write(HUB / 'index.html', shell('理解我们共同生活的世界', '历史课程、社会课程与哲学研究现场的阅读入口。', '', content))


def section_page(section, catalog):
    all_lessons = entries(catalog)
    ready = [l for l in all_lessons if l['status'] == 'ready']
    cards = ''.join(lesson_card(section, l, i) for i, l in enumerate(ready[:3], 1))
    modules = []
    for number, module in enumerate(catalog['modules'], 1):
        lessons = []
        for lesson in module['lessons']:
            if lesson['status'] == 'ready':
                title = f'<a href="{lesson["slug"]}.html" data-lesson="{section}/{lesson["slug"]}">{e(lesson["title"])}</a>'
                status = '<span class="status ready">正文可读</span>'
            else:
                title = f'<span>{e(lesson["title"])}</span>'
                status = '<span class="status">候选 · 待研究</span>' if section == 'frontier' else '<span class="status">规划中</span>'
            lessons.append(f'<li><div>{title}<p>{e(lesson["summary"])}</p></div>{status}</li>')
        modules.append(f'<details class="module" id="{module["id"]}"{" open" if number==1 else ""}><summary><span class="module-number">{number:02d}</span><span>{e(module["title"])}<small>{e(module["description"])}</small></span><span class="expand" aria-hidden="true">＋</span></summary><ol class="syllabus">{"".join(lessons)}</ol></details>')
    count = f'{len(ready)} 篇专题可读' if section == 'frontier' else f'{len(ready)} 讲可读 · {len(all_lessons)} 讲路线'
    theory = ''
    if catalog.get('theory_routes'):
        routes = []
        modules_by_id = {m['id']: m for m in catalog['modules']}
        ready_slugs = {l['slug'] for l in ready}
        for route in catalog['theory_routes']:
            if route['status'] == 'ready':
                if route['slug'] not in ready_slugs:
                    raise ValueError('Theory route must link to a ready lesson')
                heading = f'<a href="{route["slug"]}.html">{e(route["name"])} ↗</a>'
                label = '本单元可读'
            else:
                if route['module_id'] not in modules_by_id:
                    raise ValueError('Theory route must name an existing module')
                heading = e(route['name'])
                label = '规划中'
            routes.append(f'<li><span class="status {"ready" if route["status"]=="ready" else ""}">{label}</span><h3>{heading}</h3><p>{e(route["description"])}</p></li>')
        theory = f'<section class="theory-routes" id="theory"><p class="eyebrow">另一条阅读路径</p><h2>沿着一位作者的论证深入</h2><p class="scope">从问题进入，也可以带着问题回到原典。以下入口对应具体课程单元；完整的思想家原典课程仍需逐步建设。</p><ul>{"".join(routes)}</ul></section>'
    editorial = ''
    if section == 'frontier':
        editorial = '''<section class="editorial"><p class="eyebrow">编辑与跟踪</p><h2>跟住问题的下一步</h2><p>每篇标出所读论文、发表状态与核查日期，区分原作者观点、已发表异议和讲义自己的分析。新的回应值得纳入时，在原专题中补充变化记录。</p><p>按每周检索、月度深读的节奏跟踪期刊、作者公开论文和专业研究项目。只有摘要可读的材料会明确注明；候选题需要充分审读后才能成稿。周检收集研究线索与待审稿件，公开更新经过审阅。</p><p>本版核查至 <time datetime="2026-10-07">2026 年 10 月 7 日</time>。</p></section>'''
    content = f'''<main id="main" class="section-page"><a class="breadcrumb" href="../index.html">← 文史与社会</a><header class="section-hero"><p class="eyebrow">{e(SECTIONS[section][0])} / {count}</p><h1>{e(catalog['title'])}</h1><p class="lead">{e(catalog['subtitle'])}</p><p class="introduction">{e(catalog['introduction'])}</p><div class="hero-actions"><a class="primary-link" href="{ready[0]['slug']}.html">从第一篇开始 ↗</a><a href="#course-map">查看完整路线 ↓</a></div></header><section class="current-reading"><div class="section-heading"><h2>{'从这些专题读起' if section=='frontier' else '从这三讲开始'}</h2><span>充分展开的正文 · 来源 · 阅读问题</span></div><div class="reading-grid">{cards}</div></section><section id="course-map" class="course-map"><p class="eyebrow">{'研究专题目录' if section=='frontier' else '课程地图'}</p><h2>{'沿着争论继续研究' if section=='frontier' else '沿着完整路线阅读'}</h2><p class="scope">{e(catalog['scope'])}</p>{''.join(modules)}</section>{editorial}</main>'''
    content = content.replace('</main>', theory + '</main>')
    write(HUB / section / 'index.html', shell(catalog['title'], catalog['subtitle'], section, content, 1))


def article_page(section, catalog, lesson):
    src = (HUB / 'content' / section / f'{lesson["slug"]}.md').read_text(encoding='utf-8')
    src = re.sub(r'\A\s*# [^\n]+\n', '', src, count=1)
    md = markdown.Markdown(extensions=['tables', 'footnotes', 'fenced_code', 'md_in_html', 'toc'], extension_configs={'toc': {'slugify': slugify_unicode, 'toc_depth': '2', 'permalink': False}})
    body = md.convert(src)
    body = re.sub(r'<table>(.*?)</table>', r'<div class="table-scroll" role="region" aria-label="阅读表格，可横向滚动" tabindex="0"><table>\1</table></div>', body, flags=re.S)
    ready = [l for l in entries(catalog) if l['status']=='ready']
    index = ready.index(lesson)
    nav = []
    for step, label in ((-1, '上一篇'), (1, '下一篇')):
        at = index+step
        if 0 <= at < len(ready):
            other = ready[at]
            nav.append(f'<a href="{other["slug"]}.html"><small>{label}</small>{e(other["title"])}</a>')
        else:
            nav.append('<a href="index.html"><small>继续探索</small>返回阅读路线</a>')
    date = f'<span>文献核查：<time datetime="{e(lesson["reviewed"])}">{e(lesson["reviewed"])}</time></span>' if 'reviewed' in lesson else '<span>2026 年 10 月版</span>'
    content = f'''<main id="main" class="article-page" data-reading-id="{section}/{lesson['slug']}"><a class="breadcrumb" href="index.html">← {e(catalog['title'])}</a><header class="article-header"><p class="eyebrow">{e(SECTIONS[section][0])} / {index+1:02d}</p><h1>{e(lesson['title'])}</h1><p class="dek">{e(lesson['summary'])}</p><div class="article-meta"><span>约 {lesson['minutes']} 分钟 · 可分段阅读</span>{date}</div></header><div class="article-layout"><aside class="reading-sidebar"><details class="contents" open><summary>本篇目录</summary>{md.toc}</details><div class="reading-tools enhanced" hidden><span>阅读字号</span><div><button type="button" id="font-smaller" aria-label="缩小正文字号">A−</button><button type="button" id="font-larger" aria-label="放大正文字号">A＋</button></div><button type="button" id="mark-read" aria-pressed="false">标记读完</button><small>阅读状态仅保存在本机浏览器</small><p id="reading-feedback" role="status"></p></div></aside><div class="article-column"><article class="prose">{body}</article><nav class="article-pager" aria-label="上下篇">{''.join(nav)}</nav><div class="return-note">可沿上下篇连续阅读，或返回课程地图选择另一条路径。</div></div></div></main>'''
    write(HUB / section / f'{lesson["slug"]}.html', shell(lesson['title'], lesson['summary'], section, content, 1, 'article-body'))


def remove_retired_pages(section, catalog):
    """These directories contain generated HTML only; catalogs own their scope."""
    expected = {'index.html'} | {f'{l["slug"]}.html' for l in entries(catalog) if l['status'] == 'ready'}
    for path in (HUB / section).glob('*.html'):
        if path.name not in expected:
            path.unlink()


def main():
    catalogs = load_catalogs()
    home(catalogs)
    count = 1
    for section, catalog in catalogs.items():
        section_page(section, catalog)
        count += 1
        for lesson in entries(catalog):
            if lesson['status']=='ready':
                article_page(section, catalog, lesson)
                count += 1
    for section, catalog in catalogs.items():
        remove_retired_pages(section, catalog)
    print(f'PASS: built {count} humanities pages from 3 catalogs; planned lessons stay unlinked.')


if __name__ == '__main__':
    main()
