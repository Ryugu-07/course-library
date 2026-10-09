#!/usr/bin/env python3
"""Build the communication and journalism course from publication catalogs."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'media-course'
SITE = COURSE / 'site'
LANES = {
    'communication': ('传播学', '意义怎样在人与人之间形成？', '从一句话的理解，到组织、文化与公共议题。'),
    'journalism': ('新闻学', '公共事实怎样成为可信的报道？', '从选题与采访，到核实、叙事、编辑和责任。'),
    'platforms': ('媒介与平台研究', '谁组织了我们看见的世界？', '追踪分发、商业与治理如何共同塑造可见性。'),
    'methods': ('研究方法', '我们凭什么得出这个结论？', '让概念、材料、比较与推论彼此对得上。'),
}


def esc(value):
    return html.escape(str(value), quote=True)


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding='utf-8') != text:
        path.write_text(text, encoding='utf-8')


def load():
    catalogs = {}
    for lane in LANES:
        source = COURSE / 'content' / lane
        catalog = json.loads((source / 'catalog.json').read_text(encoding='utf-8'))
        assert catalog['id'] == lane
        seen = set()
        for lesson in catalog['lessons']:
            slug = lesson['slug']
            assert re.fullmatch(r'[a-z0-9-]+', slug) and slug not in seen
            assert lesson['status'] in ('ready', 'planned')
            seen.add(slug)
            if lesson['status'] == 'ready':
                text = (source / f'{slug}.md').read_text(encoding='utf-8')
                assert text.startswith('# ' + lesson['title'] + '\n'), slug
        catalogs[lane] = catalog
    return catalogs


def shell(title, description, body, lane='', depth=0):
    prefix = '../' * depth
    links = []
    for key, value in LANES.items():
        current = ' aria-current="true"' if key == lane else ''
        links.append(f'<a href="{prefix}{key}/index.html"{current}>{esc(value[0])}</a>')
    nav = ''.join(links)
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{esc(description)}"><meta name="color-scheme" content="light">
<title>{esc(title)} · 传播与新闻</title><link rel="stylesheet" href="{prefix}assets/reading.css"><link rel="stylesheet" href="{prefix}assets/media.css">
<script defer src="{prefix}assets/reading.js"></script><script defer src="{prefix}assets/media.js"></script></head>
<body data-section="{esc(lane)}"><a class="skip" href="#main">跳到正文</a>
<header class="masthead"><a class="brand" href="{prefix}index.html"><span class="brand-mark" aria-hidden="true">传</span><span>传播与新闻<small>COURSE LIBRARY</small></span></a><nav aria-label="课程导航">{nav}</nav></header>
{body}<footer class="site-footer"><span>传播与新闻 · 首批课程</span><a href="{prefix}../../humanities/">文史与社会 ↗</a><span>2026 年 10 月版</span><a href="#main">回到正文 ↑</a></footer></body></html>'''


def ready(catalog):
    return [lesson for lesson in catalog['lessons'] if lesson['status'] == 'ready']


def curriculum(lane, catalog, prefix='', open_by_default=False):
    rows = []
    for number, lesson in enumerate(catalog['lessons'], 1):
        if lesson['status'] == 'ready':
            label = f'<a href="{prefix}{lesson["slug"]}.html" data-lesson="{lane}/{lesson["slug"]}">{esc(lesson["title"])}</a>'
            status = '<span class="status ready">正文可读</span>'
        else:
            label = f'<span>{esc(lesson["title"])}</span>'
            status = '<span class="status">待建设</span>'
        rows.append(f'<li><span class="lesson-number">{number:02d}</span><div>{label}<p>{esc(lesson["summary"])}</p></div>{status}</li>')
    return f'<details class="module media-module" id="map-{lane}"{" open" if open_by_default else ""}><summary><span class="module-number">{len(ready(catalog))}/{len(catalog["lessons"])}</span><span>{esc(catalog["title"])}<small>{esc(catalog["description"])}</small></span><span class="expand" aria-hidden="true">＋</span></summary><ol class="syllabus">{"".join(rows)}</ol></details>'


def home(catalogs):
    count = sum(len(ready(c)) for c in catalogs.values())
    total = sum(len(c['lessons']) for c in catalogs.values())
    paths = []
    rows = []
    for number, (lane, catalog) in enumerate(catalogs.items(), 1):
        label, question, description = LANES[lane]
        first = ready(catalog)[0]
        paths.append(f'<section class="entry-path"><span class="path-number">0{number}</span><div><p class="eyebrow">{esc(label)}</p><h2><a href="{lane}/index.html">{esc(question)}</a></h2><p>{esc(description)}</p><a class="first-lesson" href="{lane}/{first["slug"]}.html">先读：{esc(first["title"])} ↗</a></div></section>')
        for lesson in ready(catalog):
            rows.append(f'<article class="catalog-item" data-search="{esc(label + " " + lesson["title"] + " " + lesson["summary"])}"><span class="catalog-label">{esc(label)}</span><div><h3><a href="{lane}/{lesson["slug"]}.html" data-lesson="{lane}/{lesson["slug"]}">{esc(lesson["title"])}</a></h3><p>{esc(lesson["summary"])}</p></div><span class="catalog-time">约 {lesson["minutes"]} 分钟</span></article>')
    maps = ''.join(curriculum(k, v, k + '/') for k, v in catalogs.items())
    content = f'''<main id="main" class="collection media-home">
<section class="media-hero"><div><p class="eyebrow">COMMUNICATION · JOURNALISM · MEDIA STUDIES</p><h1>我们如何<br>知道彼此，<br>理解世界<span class="title-dot">。</span></h1><p class="lead">一句话为何被听成另一种意思？<br>一个事实怎样走进公共生活？</p><a class="primary-link" href="#paths">从一个问题进入 ↓</a></div><aside class="field-map" aria-label="学科关系示意"><p class="eyebrow">四种相互补充的追问</p><div class="map-cell"><b>人 ↔ 人</b><span>意义、关系、理解</span><small>传播学</small></div><div class="map-cell"><b>材料 → 报道</b><span>发现、核实、表达</span><small>新闻学</small></div><div class="map-cell"><b>内容 ⇄ 平台 ⇄ 受众</b><span>可见性、规则、利益</span><small>媒介与平台研究</small></div><div class="map-base"><strong>研究方法</strong><span>概念 → 材料 → 比较 → 有边界的结论</span></div><p class="map-caption">这是研究问题的分工；现实中的一次传播，往往同时涉及几条线。</p></aside></section>
<div class="edition-strip"><span><strong>{count}</strong> 讲正文可读</span><span><strong>{total}</strong> 讲课程地图</span><span>案例 · 原始资料 · 带解析练习</span></div>
<section id="paths" class="entry-paths">{''.join(paths)}</section>
<section class="start-route"><p class="eyebrow">第一次读，可以这样走</p><h2>先学会拆开问题，再判断证据。</h2><p>依次读传播学第一讲、研究方法第一讲，再进入新闻学的三讲材料练习。对信息流和创作者经济更感兴趣，可以从媒介与平台研究开始，遇到抽样和因果问题时回到方法线。</p><p>本版完成四条线的起始单元。后续采访、田野与采编课程还需要真实实践和反馈；阅读正文不能替代这部分训练。</p></section>
<section id="reading" class="reading-section"><div class="section-heading"><div><p class="eyebrow">本版正文</p><h2>找到你想弄清的问题</h2></div><div class="search-box enhanced" hidden><label for="reading-search">检索可读课程</label><input id="reading-search" type="search" placeholder="例如：采访、信源、抽样" autocomplete="off"></div></div><p id="search-count" class="search-count" role="status"></p><div class="course-directory">{''.join(rows)}</div></section>
<section class="course-map" id="course-map"><p class="eyebrow">完整课程地图</p><h2>从基础走向研究与实践</h2><p class="scope">四条线各 10 讲。“正文可读”可以直接进入；“待建设”说明后续范围。本路线是本课程的编排，不是任何院校培养方案的复刻。</p>{maps}</section>
<details class="course-sources"><summary>这套课程参照了哪些专业培养内容？</summary><p>范围编排参考中国传媒大学的新闻学与传播学专业介绍、USC 的传播学课程和 Medill 的新闻学课程，保留理论、文化与制度、采编实践、研究方法几种不同训练。以下是课程范围参照；具体知识与证据在每讲末尾列出。</p><ul><li><a href="https://xinwenxueyuan.cuc.edu.cn/rcpy/list.htm">中国传媒大学新闻学院：本科专业介绍</a></li><li><a href="https://annenberg.usc.edu/academics/undergraduate-communication/curriculum">USC Annenberg：Communication Curriculum</a></li><li><a href="https://www.medill.northwestern.edu/journalism/undergraduate-journalism/curriculum/">Northwestern Medill：Journalism Curriculum</a></li></ul></details>
</main>'''
    write(SITE / 'index.html', shell('我们如何知道彼此，理解世界', '传播学、新闻学、媒介与平台研究及研究方法的独立课程。', content))


def section(lane, catalog):
    cards = []
    for number, lesson in enumerate(ready(catalog), 1):
        cards.append(f'<article class="reading-card"><div class="card-meta"><span>{number:02d}</span><span>约 {lesson["minutes"]} 分钟</span></div><h3><a href="{lesson["slug"]}.html" data-lesson="{lane}/{lesson["slug"]}">{esc(lesson["title"])}</a></h3><p>{esc(lesson["summary"])}</p><span class="card-foot">开始阅读 ↗</span></article>')
    body = f'<main id="main" class="section-page"><a class="breadcrumb" href="../index.html">← 传播与新闻</a><header class="section-hero"><p class="eyebrow">{len(ready(catalog))} 讲可读 · {len(catalog["lessons"])} 讲路线</p><h1>{esc(catalog["title"])}</h1><p class="lead">{esc(LANES[lane][1])}</p><p class="introduction">{esc(catalog["description"])}</p></header><div class="reading-grid">{"".join(cards)}</div><section class="course-map"><h2>沿着这条路线读下去</h2>{curriculum(lane, catalog, open_by_default=True)}</section></main>'
    write(SITE / lane / 'index.html', shell(catalog['title'], catalog['description'], body, lane, 1))


def article(lane, catalog, lesson):
    source = (COURSE / 'content' / lane / f'{lesson["slug"]}.md').read_text(encoding='utf-8')
    source = re.sub(r'\A# [^\n]+\n', '', source, count=1)
    md = markdown.Markdown(extensions=['tables', 'footnotes', 'fenced_code', 'md_in_html', 'toc'], extension_configs={'toc': {'slugify': slugify_unicode, 'toc_depth': '2'}})
    prose = md.convert(source)
    prose = re.sub(r'<table>(.*?)</table>', r'<div class="table-scroll" role="region" aria-label="阅读表格，可横向滚动" tabindex="0"><table>\1</table></div>', prose, flags=re.S)
    lessons = ready(catalog)
    index = lessons.index(lesson)
    pager = []
    for delta, label in ((-1, '上一篇'), (1, '下一篇')):
        i = index + delta
        pager.append(f'<a href="{lessons[i]["slug"]}.html"><small>{label}</small>{esc(lessons[i]["title"])}</a>' if 0 <= i < len(lessons) else '<a href="index.html"><small>阅读路线</small>返回本线目录</a>')
    body = f'''<main id="main" class="article-page" data-reading-id="{lane}/{lesson['slug']}"><a class="breadcrumb" href="index.html">← {esc(catalog['title'])}</a><header class="article-header"><p class="eyebrow">{esc(catalog['title'])} / {index+1:02d}</p><h1>{esc(lesson['title'])}</h1><p class="dek">{esc(lesson['summary'])}</p><div class="article-meta"><span>约 {lesson['minutes']} 分钟 · 可分段阅读</span><span>2026 年 10 月首批课程</span></div></header><div class="article-layout"><aside class="reading-sidebar"><details class="contents" open><summary>本篇目录</summary>{md.toc}</details><div class="reading-tools enhanced" hidden><span>阅读字号</span><div><button id="font-smaller" type="button" aria-label="缩小正文字号">A−</button><button id="font-larger" type="button" aria-label="放大正文字号">A＋</button></div><button id="mark-read" type="button" aria-pressed="false">标记读完</button><small>阅读状态仅保存在本机浏览器</small><p id="reading-feedback" role="status"></p></div></aside><div class="article-column"><article class="prose">{prose}</article><nav class="article-pager" aria-label="上下篇">{''.join(pager)}</nav></div></div></main>'''
    write(SITE / lane / f'{lesson["slug"]}.html', shell(lesson['title'], lesson['summary'], body, lane, 1))


def main():
    catalogs = load()
    expected = {SITE / 'index.html'}
    for lane, catalog in catalogs.items():
        expected.add(SITE / lane / 'index.html')
        expected.update(SITE / lane / (lesson['slug'] + '.html') for lesson in ready(catalog))
    for old in SITE.rglob('*.html'):
        if old not in expected:
            old.unlink()
    # Reuse the established reading interface; separate storage prevents cross-course collisions.
    write(SITE / 'assets/reading.css', (ROOT / 'humanities/assets/reading.css').read_text(encoding='utf-8'))
    write(SITE / 'assets/reading.js', (ROOT / 'humanities/assets/reading.js').read_text(encoding='utf-8').replace('course-library-humanities-reading-v1', 'course-library-media-reading-v1'))
    for name in ('media.css', 'media.js'):
        write(SITE / 'assets' / name, (COURSE / 'assets' / name).read_text(encoding='utf-8'))
    home(catalogs)
    for lane, catalog in catalogs.items():
        section(lane, catalog)
        for lesson in ready(catalog):
            article(lane, catalog, lesson)
    print(f'Media course: {sum(len(ready(c)) for c in catalogs.values())} lessons / {sum(len(c["lessons"]) for c in catalogs.values())} mapped')


if __name__ == '__main__':
    main()
