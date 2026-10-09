#!/usr/bin/env python3
"""Build the original-language world literature reading course."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'literature-course'
SITE = COURSE / 'site'
SLUGS = ['01-kafka', '02-marti', '03-ibsen', '04-akutagawa', '05-tagore', '06-plaatje']


def e(value):
    return html.escape(str(value), quote=True)


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding='utf-8') != text:
        path.write_text(text, encoding='utf-8')


def load():
    lessons = []
    for number, slug in enumerate(SLUGS, 1):
        data = json.loads((COURSE / 'content' / f'{slug}.json').read_text(encoding='utf-8'))
        assert data['slug'] == slug and data['number'] == number, slug
        assert len(data['segments']) >= 3 and len(data['variants']) >= 2, slug
        ids = {source['id'] for source in data['sources']}
        assert len(ids) == len(data['sources']) and data['original']['sourceId'] in ids, slug
        if data.get('parallel'):
            assert data['parallel']['sourceId'] in ids, slug
        for source in data['sources']:
            assert re.fullmatch(r'[a-z0-9-]+', source['id']), slug
            assert source['url'].startswith('https://'), slug
        data['body'] = (COURSE / 'content' / f'{slug}.md').read_text(encoding='utf-8')
        assert data['body'].count('%%WORKBENCH%%') == 1, slug
        assert len(re.findall(r'^## ', data['body'], re.M)) >= 4, slug
        assert data['body'].count('<summary>') >= 3, slug
        lessons.append(data)
    return lessons


def shell(title, description, body, page='home'):
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="description" content="{e(description)}"><title>{e(title)} · 世界现代文学</title>
<link rel="stylesheet" href="assets/reading.css"><script defer src="assets/reading.js"></script></head>
<body class="{page}"><a class="skip" href="#main">跳到正文</a>
<header class="masthead"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">文</span><span>世界现代文学<small>READING ACROSS LANGUAGES</small></span></a>
<nav aria-label="主导航"><a href="index.html#readings">六篇细读</a><a href="index.html#approach">阅读方法</a><a href="../../humanities/">文史与社会 ↗</a></nav><span class="edition">2026 年 10 月版</span></header>
{body}
<footer class="site-footer"><a href="index.html">世界现代文学 · 原文细读</a><span>2026 年 10 月 · 六篇细读</span><a href="#main">回到正文 ↑</a></footer></body></html>'''


def marked_original(data):
    """Annotations never rewrite the cited passage, and must not overlap."""
    original = data['original']['text']
    positions = []
    for i, segment in enumerate(data['segments']):
        text = segment['text']
        start = original.find(text)
        if start < 0 or not text:
            raise ValueError(f'{data["slug"]}: annotation not found: {text!r}')
        positions.append((start, start + len(text), i, text))
    def quote_text(text):
        escaped = e(text)
        if data.get('lineation') == 'verse':
            escaped = escaped.replace('\n', '<span class="line-end" aria-hidden="true"></span>\n')
        return escaped
    parts, at = [], 0
    for start, end, i, text in sorted(positions):
        if start < at:
            raise ValueError(f'{data["slug"]}: overlapping annotation {text!r}')
        parts.append(quote_text(original[at:start]))
        parts.append(f'<span class="phrase" data-note="note-{i}">{quote_text(text)}</span>')
        at = end
    parts.append(quote_text(original[at:]))
    return ''.join(parts)


def workbench(data):
    notes = []
    for i, segment in enumerate(data['segments']):
        notes.append(f'''<details class="word-note" id="note-{i}"><summary><span class="note-number">{i+1:02d}</span><span lang="{e(data['original']['lang'])}">{e(segment['text'])}</span><span class="note-kind">{e(segment['kind'])}</span></summary><div class="note-content"><p class="gloss-label">这一处怎么读</p><p class="word-gloss">{e(segment['gloss'])}</p><p>{e(segment['note'])}</p></div></details>''')
    variants = ''.join(f'<article class="variant"><span class="variant-number">{i:02d}</span><h4>{e(v["label"])}</h4><p class="variant-text">{e(v["text"])}</p><p>{e(v["note"])}</p></article>' for i, v in enumerate(data['variants'], 1))
    lineation_note = ' ↵ 标记底本换行；窄屏上长行会自动折行。' if data.get('lineation') == 'verse' else ''
    original = f'<blockquote class="original" lang="{e(data["original"]["lang"])}">{marked_original(data)}</blockquote>'
    if data.get('parallel'):
        parallel = data['parallel']
        original = f'''<div class="original-pair"><div><p class="version-label">{e(data['originalLabel'])}</p>{original}</div><div class="parallel-version"><p class="version-label">{e(parallel['label'])}</p><blockquote class="parallel-original" lang="{e(parallel['lang'])}">{e(parallel['text'])}</blockquote><p class="parallel-gloss"><span>中文教学释义</span>{e(parallel['gloss'])}</p><a class="source-jump" href="#{e(parallel['sourceId'])}">核对英语底本 ↗</a></div></div>'''
    return f'''<section class="workbench" id="close-reading" aria-labelledby="bench-title">
<div class="bench-heading"><div><p class="eyebrow">贴近原文</p><h2 id="bench-title">慢读这一段原文</h2></div><a class="source-jump" href="#{e(data['original']['sourceId'])}">查看底本 ↗</a></div>
<p class="bench-hint">展开词句旁注，观察措辞如何改变阅读。<span class="enhanced" hidden>也可以点击原文中带下划线的词句。</span></p>
{original}
<p class="original-note">{e(data['original']['note'])}{lineation_note}</p>
<details class="translation-gloss"><summary>展开中文教学释义</summary><p>{e(data['gloss'])}</p><small>本课自拟释义，用于理解原文；不冒充已出版译文。</small></details>
<div class="annotations">{''.join(notes)}</div>
<div class="variant-heading"><h3>中文怎样接住这一处？</h3><p>以下均为本课自拟的对照措辞，用来观察取舍。它们不构成对已出版译本的评价。</p></div>
<div class="variants">{variants}</div></section>'''


def source_list(data):
    items = ''.join(f'''<li id="{e(s['id'])}"><h3><a href="{e(s['url'])}">{e(s['label'])} ↗</a></h3><p>{e(s['edition'])}</p><p class="source-scope"><span>本课核读范围</span>{e(s['scope'])}</p></li>''' for s in data['sources'])
    return f'<section class="sources" id="editions"><p class="eyebrow">回到材料</p><h2>底本与核读范围</h2><p class="source-intro">讲解中的语言事实与文学解释分别呈现；有歧义的地方保留可讨论的读法。以下记录本课实际使用的材料。</p><ol>{items}</ol></section>'


def lesson_page(data, lessons):
    md = markdown.Markdown(extensions=['tables', 'footnotes', 'md_in_html', 'toc'], extension_configs={'toc': {'slugify': slugify_unicode, 'toc_depth': '2'}})
    body = md.convert(data['body'])
    marker = '<p>%%WORKBENCH%%</p>'
    assert marker in body, data['slug']
    body = body.replace(marker, workbench(data))
    body = re.sub(r'<table>(.*?)</table>', r'<div class="table-scroll" role="region" tabindex="0" aria-label="阅读表格，可横向滚动"><table>\1</table></div>', body, flags=re.S)
    sidebar = ''.join(f'<a href="{l["slug"]}.html"{chr(32)+"aria-current=page" if l["slug"] == data["slug"] else ""}><span>{l["number"]:02d}</span>{e(l["author"])}</a>' for l in lessons)
    index = data['number'] - 1
    pager = []
    for at, label in [(index-1, '上一篇'), (index+1, '下一篇')]:
        if 0 <= at < len(lessons):
            other = lessons[at]
            pager.append(f'<a href="{other["slug"]}.html"><small>{label} / {e(other["language"])}</small>{e(other["title"])}</a>')
        else:
            pager.append('<a href="index.html#readings"><small>回到书架</small>选择另一篇细读</a>')
    content = f'''<main id="main" class="article-page"><a class="breadcrumb" href="index.html#readings">← 六篇原文细读</a>
<header class="article-header"><p class="eyebrow">{data['number']:02d} / {e(data['skill'])} · {e(data['language'])}</p><h1>{e(data['title'])}</h1><p class="dek">{e(data['subtitle'])}</p><div class="article-meta"><span>{e(data['author'])} · {e(data['work'])}</span><span>{e(data['year'])} · {e(data['region'])}</span><span>约 {e(data['minutes'])} 分钟</span></div></header>
<div class="article-layout"><aside class="sidebar"><details class="contents"><summary>本篇路径</summary>{md.toc}<a href="#close-reading">原文与词句旁注</a><a href="#editions">底本与核读范围</a></details><div class="reading-tools enhanced" hidden><span>正文字号</span><div><button type="button" id="font-smaller" aria-label="缩小正文字号">A−</button><button type="button" id="font-larger" aria-label="放大正文字号">A＋</button></div><p id="reading-feedback" role="status"></p></div><nav class="shelf-nav" aria-label="六篇细读"><p class="eyebrow">继续阅读</p>{sidebar}</nav></aside>
<div class="article-column"><div class="reading-question"><span>带着这个问题读</span><p>{e(data['question'])}</p></div><article class="prose">{body}</article>{source_list(data)}<nav class="article-pager" aria-label="上下篇">{''.join(pager)}</nav></div></div></main>'''
    write(SITE / f'{data["slug"]}.html', shell(data['title'], data['subtitle'], content, 'lesson'))


def home(lessons):
    cards = []
    for data in lessons:
        cards.append(f'''<article class="book-card"><div class="card-top"><span>{data['number']:02d} / {e(data['skill'])}</span><span>{e(data['language'])}</span></div><h3><a href="{data['slug']}.html">{e(data['title'])}</a></h3><p class="card-author">{e(data['author'])} · {e(data['work'])}</p><p class="card-description">{e(data['lede'])}</p><div class="card-foot"><span>{e(data['region'])} · {e(data['year'])}</span><span>进入原文 ↗</span></div></article>''')
    data = lessons[0]
    languages = [('de', 'Deutsch'), ('es', 'Español'), ('da', 'Dansk–norsk'), ('ja', '日本語'), ('bn', 'বাংলা'), ('en', 'English')]
    language_strip = ''.join(f'<span lang="{lang}">{label}</span>' for lang, label in languages)
    content = f'''<main id="main" class="collection"><section class="hero"><div class="hero-copy"><p class="eyebrow">世界现代文学 / 原文细读</p><h1>越过语言，<br>走进一句话。</h1><p class="lead">用中文读懂作品。<br>也看见原文里，尚未被译出的可能。</p><p class="hero-intro">从一个词、一种声音、一次停顿开始。<br>沿着作者的语言选择，读进人物与时代。</p><a class="primary-link" href="#readings">选择一篇细读 <span>↓</span></a></div>
<div class="folio" aria-label="卡夫卡原文选段"><div class="folio-top"><span>一扇阅读的窗口</span><span>01 / 06</span></div><p class="folio-original" lang="de">{e(data['original']['text'])}</p><div class="folio-rule"></div><p class="folio-question">是怎样的生物，<br>还是怎样被人看待？</p><a href="01-kafka.html#close-reading">从 <span lang="de">Ungeziefer</span> 开始 ↗</a><span class="folio-credit">Franz Kafka · <span lang="de">Die Verwandlung</span> · 1915</span></div></section>
<div class="language-strip" aria-label="本批原文语言">{language_strip}</div>
<section id="readings" class="readings"><div class="section-heading"><div><p class="eyebrow">六篇完整细读</p><h2>每一种声音，都有自己的来路。</h2></div><p>欧洲、加勒比、东亚、南亚与南非。<br>六个入口，尝试六种读法。</p></div><div class="books">{''.join(cards)}</div><p class="scope-note">本批选取 19 世纪末至 20 世纪初的作品，检验小说、诗歌、戏剧和文学性非虚构的讲解方式。它是世界现代文学课程的起点，尚未覆盖全部地区、语言与当代写作。</p></section>
<section id="approach" class="approach"><div><p class="eyebrow">怎样读</p><h2>不必先学会外语，<br>也能更接近原文。</h2><p>先进入场景，再观察语言。每一次比较，最终都回到作品。</p></div><ol><li><span>01</span><div><h3>先看见发生了什么</h3><p>讲清人物、场景和必要背景，再给出原文与可展开的中文释义。</p></div></li><li><span>02</span><div><h3>留意作者怎样说</h3><p>点开关键措辞，观察称谓、语序、声音和省略如何改变阅读。</p></div></li><li><span>03</span><div><h3>比较取舍，形成判断</h3><p>用本课自拟的中文对照措辞试读，带着证据回答一个仍可争论的问题。</p></div></li></ol></section>
<section class="edition-note"><h2>原作也有版本。</h2><p>每篇注明所用底本与实际核读范围。作者自译、后人翻译和本课教学释义分别标明。文学解释从具体语言出发，并保留有根据的不同读法。</p><a href="05-tagore.html">看泰戈尔怎样重新写出另一种语言的诗 ↗</a></section></main>'''
    write(SITE / 'index.html', shell('越过语言，走进一句话', '六篇世界现代文学课程：从德语、西班牙语、丹麦—挪威书面语、日语、孟加拉语与英语原作进入文学。', content))


def main():
    lessons = load()
    for asset in ('reading.css', 'reading.js'):
        write(SITE / 'assets' / asset, (COURSE / 'assets' / asset).read_text(encoding='utf-8'))
    expected = {'index.html'} | {lesson['slug'] + '.html' for lesson in lessons}
    for old in SITE.glob('*.html'):
        if old.name not in expected:
            old.unlink()
    home(lessons)
    for lesson in lessons:
        lesson_page(lesson, lessons)
    print(f'PASS: built {len(lessons)+1} world literature pages.')


if __name__ == '__main__':
    main()
