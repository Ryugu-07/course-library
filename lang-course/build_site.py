#!/usr/bin/env python3
"""
语言·信息·智能 · 站点生成器（与六站同引擎）
用法: ~/ai-course/.venv/bin/python build_site.py
COURSE 注册全部规划页；缺失文件构建时跳过并标 ⏳（进度清单）。
"""
import html, shutil, time
from pathlib import Path
import markdown
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).parent
LECTURES = ROOT / "lectures"
SITE = ROOT / "site"

SITE_TITLE = "语言 · 信息 · 智能"
SITE_SUBTITLE = "符号系统如何产生智能与文明 · 研究型 seminar"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 定位、三术语与裁判地图"),
    ]),
    ("线一 · 语言是什么", [
        ("ling-01-saussure.md", "语言 I · 结构主义：符号与差异系统"),
        ("ling-02-chomsky.md", "语言 II · 生成语法：递归与普遍语法"),
        ("ling-03-functional.md", "语言 III · 功能主义：语言来自使用"),
        ("ling-04-cognitive.md", "语言 IV · 认知语言学：隐喻与构式"),
    ]),
    ("线二 · 信息论（数学核心）", [
        ("info-01-entropy.md", "信息 I · 熵、信道与 Zipf 律"),
        ("info-02-surprisal.md", "信息 II · 可预测性与加工难度"),
        ("info-03-efficiency.md", "信息 III · 通信效率塑造语言"),
        ("info-04-compression.md", "信息 IV · 三种压缩与它的边界"),
    ]),
    ("线三 · 从语料到意义", [
        ("mean-01-distributional.md", "意义 I · 分布假说与向量语义"),
        ("mean-02-learnability.md", "意义 II · 可学习性之争"),
        ("mean-03-grounding.md", "意义 III · 符号接地问题"),
        ("mean-04-debates.md", "意义 IV · 三条正交争议轴"),
    ]),
    ("线四 · 从个体到文明", [
        ("civ-01-cultural-evolution.md", "文明 I · 文化演化与累积文化"),
        ("civ-02-literacy.md", "文明 II · 识字性与语言起源"),
        ("civ-03-distributed.md", "文明 III · 分布式认知与集体智能"),
    ]),
    ("线五 · 预测的心智", [
        ("mind-01-predictive-brain.md", "心智 I · 预测脑与贝叶斯大脑"),
        ("mind-02-language-thought.md", "心智 II · 语言与思维的关系"),
        ("mind-03-consciousness.md", "心智 III · 自由能与意识【争·思】"),
    ]),
    ("线六 · 机器里的语言与智能", [
        ("ai-01-emergence.md", "机器 I · 涌现、Scaling 与世界模型"),
        ("ai-02-understanding.md", "机器 II · 预测等于理解吗"),
        ("ai-03-language-lab.md", "机器 III · LLM 作为语言理论实验室"),
    ]),
    ("实验与收官", [
        ("labs.md", "实验双轨 · 代码 + 思想实验"),
        ("capstone.md", "收官 · 我的语言—智能理论草案"),
    ]),
]

MD_EXTENSIONS = ["tables", "footnotes", "attr_list", "md_in_html", "admonition", "toc",
    "pymdownx.arithmatex", "pymdownx.superfences", "pymdownx.highlight",
    "pymdownx.betterem", "pymdownx.tilde"]
MD_CONFIG = {
    "pymdownx.arithmatex": {"generic": True},
    "pymdownx.highlight": {"css_class": "highlight", "guess_lang": False},
    "toc": {"permalink": "", "toc_depth": "2-3"},
}

PAGE_TMPL = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · {site_title}</title>
<link rel="stylesheet" href="assets/katex/katex.min.css">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/pygments.css">
<script>
(function() {{
  var t = localStorage.getItem('theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
}})();
</script>
</head>
<body>
<button id="sidebar-toggle" aria-label="目录">☰</button>
<nav id="sidebar">
  <div class="site-head">
    <a class="site-title" href="index.html">{site_title}</a>
    <div class="site-subtitle">{site_subtitle}</div>
  </div>
  {nav}
  <div class="sidebar-foot">
    <button id="theme-toggle">☀ / ☾</button>
    <div class="build-time">构建于 {build_time}</div>
  </div>
</nav>
<main id="content">
<article>
{toc_block}
{body}
</article>
<footer class="pager">
  {prev_link}
  {next_link}
</footer>
</main>
<script defer src="assets/katex/katex.min.js"></script>
<script defer src="assets/katex/auto-render.min.js"></script>
<script defer src="assets/site.js"></script>
</body>
</html>
"""


def html_name(md_name):
    return "index.html" if md_name == "00-intro.md" else md_name.replace(".md", ".html")


def build_nav(current_html, existing):
    parts = []
    for part_title, lectures in COURSE:
        items = []
        for md_name, nav_title in lectures:
            if md_name not in existing:
                items.append(f'<li class="pending"><span style="opacity:.45">{html.escape(nav_title)} ⏳</span></li>')
                continue
            href = html_name(md_name)
            cls = ' class="active"' if href == current_html else ""
            items.append(f'<li{cls}><a href="{href}">{html.escape(nav_title)}</a></li>')
        parts.append(f'<div class="nav-part"><div class="nav-part-title">{html.escape(part_title)}</div><ul>{"".join(items)}</ul></div>')
    return "\n".join(parts)


def flat_lectures():
    out = []
    for _, lectures in COURSE:
        out.extend(lectures)
    return out


def render_page(md_name, nav_title, prev_item, next_item, build_time, existing):
    src = (LECTURES / md_name).read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    body = md.convert(src)
    toc = getattr(md, "toc", "")
    toc_block = ""
    if toc and toc.count("<li>") + toc.count("<li ") >= 3:
        toc_block = f'<details class="page-toc"><summary>本页目录</summary>{toc}</details>'

    def pager(item, label, cls):
        if item is None:
            return f'<span class="pager-slot {cls}"></span>'
        return (f'<a class="pager-slot {cls}" href="{html_name(item[0])}">'
                f'<span class="pager-label">{label}</span>{html.escape(item[1])}</a>')

    title = nav_title.split("·", 1)[-1].strip() if "·" in nav_title else nav_title
    return PAGE_TMPL.format(
        title=html.escape(title), site_title=SITE_TITLE, site_subtitle=SITE_SUBTITLE,
        nav=build_nav(html_name(md_name), existing), toc_block=toc_block, body=body,
        prev_link=pager(prev_item, "上一页", "prev"), next_link=pager(next_item, "下一页", "next"),
        build_time=build_time)


def write_pygments_css():
    light = HtmlFormatter(style="default").get_style_defs(".highlight")
    dark_raw = HtmlFormatter(style="native").get_style_defs(".highlight")
    dark_lines = [('html[data-theme="dark"] ' + l) if l.startswith(".highlight") else l
                  for l in dark_raw.splitlines()]
    (SITE / "assets" / "pygments.css").write_text(light + "\n\n/* dark */\n" + "\n".join(dark_lines), encoding="utf-8")


def main():
    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / "assets").mkdir(exist_ok=True)
    for asset in ["style.css", "site.js"]:
        src = ROOT / "tools" / asset
        if src.exists():
            shutil.copy(src, SITE / "assets" / asset)
    img_src = ROOT / "images"
    if img_src.exists():
        img_dst = SITE / "assets" / "img"
        if img_dst.exists():
            shutil.rmtree(img_dst)
        shutil.copytree(img_src, img_dst)
    write_pygments_css()

    build_time = time.strftime("%Y-%m-%d %H:%M")
    all_items = flat_lectures()
    existing = {m for m, _ in all_items if (LECTURES / m).exists()}
    missing = [m for m, _ in all_items if m not in existing]
    items = [it for it in all_items if it[0] in existing]
    for i, (md_name, nav_title) in enumerate(items):
        out = SITE / html_name(md_name)
        out.write_text(render_page(md_name, nav_title,
                                   items[i - 1] if i > 0 else None,
                                   items[i + 1] if i < len(items) - 1 else None,
                                   build_time, existing), encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: {len(items)} 页已建 / {len(missing)} 页待写 → {SITE}/")
    if missing:
        print("待写:", " ".join(m.replace('.md', '') for m in missing[:14]), "…" if len(missing) > 14 else "")


if __name__ == "__main__":
    main()
