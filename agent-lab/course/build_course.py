#!/usr/bin/env python3
"""Build the full multi-page Agent course into site/course/."""

from __future__ import annotations

import html
import re
import shutil
from pathlib import Path

import markdown

from course_manifest import LABS, PROJECT_CHAPTERS, STAGES, flat_chapters

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"
ASSETS = ROOT / "assets"
PROJECTS = ROOT / "projects"
OUTPUT = ROOT.parent / "site" / "course"

SITE_TITLE = "从 SWE Agent 到 Codex"
SITE_SUBTITLE = "编码智能体完整架构课"

MD_EXTENSIONS = [
    "tables",
    "fenced_code",
    "admonition",
    "attr_list",
    "md_in_html",
    "toc",
    "pymdownx.superfences",
    "pymdownx.highlight",
]
MD_CONFIG = {
    "toc": {"permalink": "", "toc_depth": "2-3"},
    "pymdownx.highlight": {"css_class": "highlight", "guess_lang": False},
}

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title} · {site_title}</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%2352745d'/%3E%3Cpath d='M15 18h34v7H15zm0 12h24v7H15zm0 12h34v7H15z' fill='white'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="assets/course.css?v=20260710-full">
  <script>(function(){{var t=localStorage.getItem('agentCourseTheme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}})();</script>
</head>
<body id="top" data-page-key="{page_key}">
  <button id="sidebar-toggle" aria-label="打开课程目录">☰</button>
  <nav id="sidebar" aria-label="完整课程目录">
    <div class="site-head">
      <a class="site-title" href="index.html">{site_title}</a>
      <div class="site-subtitle">{site_subtitle}</div>
    </div>
    {nav}
    <div class="sidebar-foot">
      <button id="theme-toggle" type="button" aria-label="切换主题">☀ / ☾</button>
      <a href="../index.html">返回最小 Agent 原始讲解</a>
    </div>
  </nav>
  <main id="content">
    <div class="reading-progress"><span style="width:{progress}%"></span></div>
    <article>
      <div class="chapter-meta"><span>{stage_label}</span><span>{position}</span></div>
      {toc_block}
      {body}
      {complete_block}
    </article>
    <footer class="pager">{prev_link}{next_link}</footer>
  </main>
  <script src="assets/course.js?v=20260710-full"></script>
</body>
</html>
"""


def html_name(md_name: str) -> str:
    return md_name.replace(".md", ".html")


def page_title(nav_title: str) -> str:
    return nav_title.split("·", 1)[-1].strip()


def all_pages():
    chapters = [(md, title, "chapter") for md, title in flat_chapters()]
    labs = [(md, title, "lab") for md, title, _ in LABS]
    return chapters + labs


def build_nav(current_html: str) -> str:
    parts = ['<div class="nav-home"><a href="index.html">课程总览</a><a href="labs.html">8 个互动实验</a></div>']
    for stage_title, chapters in STAGES:
        is_open = any(html_name(md) == current_html for md, _ in chapters)
        links = []
        for md_name, title in chapters:
            href = html_name(md_name)
            current = ' class="current" aria-current="page"' if href == current_html else ""
            links.append(f'<li><a{current} href="{href}">{html.escape(title)}</a></li>')
        parts.append(
            f'<details class="nav-stage"{" open" if is_open else ""}>'
            f'<summary>{html.escape(stage_title)}</summary><ul>{"".join(links)}</ul></details>'
        )
    lab_open = any(html_name(md) == current_html for md, _, _ in LABS)
    lab_links = []
    for md_name, title, _ in LABS:
        href = html_name(md_name)
        current = ' class="current" aria-current="page"' if href == current_html else ""
        lab_links.append(f'<li><a{current} href="{href}">{html.escape(title)}</a></li>')
    parts.append(
        f'<details class="nav-stage"{" open" if lab_open else ""}>'
        f'<summary>互动实验室</summary><ul>{"".join(lab_links)}</ul></details>'
    )
    return "\n".join(parts)


def render_markdown(path: Path):
    source = path.read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    body = md.convert(source)
    toc = getattr(md, "toc", "")
    toc_block = ""
    if toc and toc.count("<li") >= 3:
        toc_block = f'<details class="page-toc"><summary>本章目录</summary>{toc}</details>'
    return source, body, toc_block


def stage_for(md_name: str):
    for index, (title, chapters) in enumerate(STAGES, start=1):
        if any(md == md_name for md, _ in chapters):
            return index, title
    return 8, "互动实验室"


def pager(item, label: str, css_class: str):
    if item is None:
        return f'<span class="pager-slot {css_class}"></span>'
    md_name, title, _ = item
    return (
        f'<a class="pager-slot {css_class}" href="{html_name(md_name)}">'
        f'<span>{label}</span><strong>{html.escape(title)}</strong></a>'
    )


def render_page(item, index: int, pages):
    md_name, nav_title, kind = item
    source, body, toc_block = render_markdown(CONTENT / md_name)
    stage_index, stage_title = stage_for(md_name)
    if kind == "lab":
        lab_index = [md for md, _, _ in LABS].index(md_name) + 1
        position = f"实验 {lab_index} / {len(LABS)}"
        progress = round(lab_index / len(LABS) * 100)
    else:
        chapter_index = [md for md, _ in flat_chapters()].index(md_name) + 1
        position = f"第 {chapter_index} / 30 章"
        progress = round(chapter_index / 30 * 100)
    return PAGE_TEMPLATE.format(
        page_title=html.escape(page_title(nav_title)),
        site_title=SITE_TITLE,
        site_subtitle=SITE_SUBTITLE,
        page_key=md_name.removesuffix(".md"),
        nav=build_nav(html_name(md_name)),
        progress=progress,
        stage_label=html.escape(stage_title),
        position=position,
        toc_block=toc_block,
        body=body,
        complete_block=(
            f'<div class="chapter-complete"><label><input type="checkbox" '
            f'data-reading-complete="{md_name.removesuffix(".md")}"><span>'
            f'我已经能复述本章的核心逻辑</span></label></div>'
        ),
        prev_link=pager(pages[index - 1] if index else None, "上一页", "prev"),
        next_link=pager(pages[index + 1] if index < len(pages) - 1 else None, "下一页", "next"),
    ), source


def render_overview() -> str:
    stage_blocks = []
    number = 1
    for stage_index, (stage_title, chapters) in enumerate(STAGES, start=1):
        links = []
        for md_name, title in chapters:
            links.append(
                f'<a href="{html_name(md_name)}"><span>{number:02d}</span><strong>{html.escape(page_title(title))}</strong></a>'
            )
            number += 1
        stage_blocks.append(
            f'<section class="overview-stage"><div class="overview-stage-head"><span>阶段 {stage_index}</span>'
            f'<h2>{html.escape(stage_title.split("·", 1)[-1].strip())}</h2></div>'
            f'<div class="overview-chapters">{"".join(links)}</div></section>'
        )
    body = f"""
      <header class="course-hero">
        <p class="eyebrow">7 个阶段 · 30 章 · 8 个互动实验 · 2 个完整项目</p>
        <h1>从最小 SWE Agent 到 Codex 与 Claude Code</h1>
        <p>这是一门架构理解课。代码可以交给 AI 编写，但你要能判断任务怎样进入循环、信息怎样进入上下文、工具怎样越过或守住边界，以及系统凭什么宣布成功。</p>
        <div class="hero-actions"><a href="01-mental-model.html">从第 1 章开始</a><a href="labs.html">进入互动实验室</a></div>
      </header>
      <section class="course-contract">
        <div><strong>每章都回答</strong><span>为什么出现、怎样运行、哪里会失败、代码加在哪里。</span></div>
        <div><strong>两个项目</strong><span>单 Agent 的 Mini Codex，以及带隔离与审查的 Agent 工程团队。</span></div>
        <div><strong>学习方式</strong><span>先理解数据流，再运行实验，最后用项目把模块接成系统。</span></div>
      </section>
      {''.join(stage_blocks)}
    """
    return PAGE_TEMPLATE.format(
        page_title="课程总览",
        site_title=SITE_TITLE,
        site_subtitle=SITE_SUBTITLE,
        page_key="overview",
        nav=build_nav("index.html"),
        progress=0,
        stage_label="完整课程",
        position="课程总览",
        toc_block="",
        body=body,
        complete_block="",
        prev_link='<span class="pager-slot prev"></span>',
        next_link='<a class="pager-slot next" href="01-mental-model.html"><span>开始学习</span><strong>01 · Agent 到底是什么</strong></a>',
    )


def render_labs_overview() -> str:
    cards = []
    for index, (md_name, title, related) in enumerate(LABS, start=1):
        cards.append(
            f'<div class="lab-index-row"><span>{index:02d}</span><div><strong>{html.escape(page_title(title))}</strong>'
            f'<p>对应正文：<a href="{related}">{html.escape(related.removesuffix(".html"))}</a></p></div>'
            f'<a href="{html_name(md_name)}">打开实验</a></div>'
        )
    body = f"""
      <header class="course-hero compact"><p class="eyebrow">互动实验室</p><h1>把抽象架构变成可以拨动的系统</h1>
      <p>每个实验都会改变真实状态并给出反馈。先猜结果，再操作，最后回到对应章节解释为什么。</p></header>
      <div class="lab-index">{''.join(cards)}</div>
    """
    return PAGE_TEMPLATE.format(
        page_title="互动实验室",
        site_title=SITE_TITLE,
        site_subtitle=SITE_SUBTITLE,
        page_key="labs-overview",
        nav=build_nav("labs.html"),
        progress=0,
        stage_label="互动实验室",
        position="8 个实验",
        toc_block="",
        body=body,
        complete_block="",
        prev_link='<a class="pager-slot prev" href="index.html"><span>返回</span><strong>课程总览</strong></a>',
        next_link='<a class="pager-slot next" href="lab-01-loop.html"><span>开始实验</span><strong>实验 01 · Agent 循环逐帧播放器</strong></a>',
    )


def audit_source(md_name: str, source: str, kind: str):
    text = re.sub(r"```.*?```", "", source, flags=re.S)
    compact = re.sub(r"\s+", "", text)
    minimum = 650 if kind == "lab" else 900
    if md_name in PROJECT_CHAPTERS:
        minimum = 1700
    issues = []
    if len(compact) < minimum:
        issues.append(f"正文过短 {len(compact)} < {minimum}")
    if source.count("\n## ") < 3:
        issues.append("少于 3 个二级章节")
    if "TODO" in source or "待补充" in source:
        issues.append("包含占位文本")
    return issues


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    output_assets = OUTPUT / "assets"
    output_assets.mkdir(exist_ok=True)
    for asset in ["course.css", "course.js"]:
        shutil.copy2(ASSETS / asset, output_assets / asset)
    downloads = OUTPUT / "downloads"
    downloads.mkdir(exist_ok=True)
    for project in ["mini_codex.py", "agent_team.py"]:
        shutil.copy2(PROJECTS / project, downloads / project)

    pages = all_pages()
    missing = [md for md, _, _ in pages if not (CONTENT / md).exists()]
    if missing:
        raise SystemExit("缺少课程源稿: " + ", ".join(missing))

    audit_failures = []
    for index, item in enumerate(pages):
        rendered, source = render_page(item, index, pages)
        md_name, _, kind = item
        issues = audit_source(md_name, source, kind)
        if issues:
            audit_failures.append(f"{md_name}: {'; '.join(issues)}")
        (OUTPUT / html_name(md_name)).write_text(rendered, encoding="utf-8")

    if audit_failures:
        raise SystemExit("课程内容审计失败:\n" + "\n".join(audit_failures))

    (OUTPUT / "index.html").write_text(render_overview(), encoding="utf-8")
    (OUTPUT / "labs.html").write_text(render_labs_overview(), encoding="utf-8")
    print(f"Built 7 stages, {len(flat_chapters())} chapters, {len(LABS)} labs, 2 projects -> {OUTPUT}")


if __name__ == "__main__":
    main()
