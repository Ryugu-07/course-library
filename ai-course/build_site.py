#!/usr/bin/env python3
"""
课程站点生成器：把 lectures/*.md 渲染成 site/ 下的静态博客站。

用法:
    .venv/bin/python build_site.py

设计要点:
- 完全本地自包含: KaTeX/CSS/JS 全部在 site/assets/, 无任何外网 CDN 请求
- 数学: pymdownx.arithmatex (generic 模式) + KaTeX auto-render
- 代码高亮: pygments, 昼夜两套配色
- 目录结构在下方 COURSE 里维护, 新增讲次改这里即可
"""

import html
import re
import shutil
import time
from pathlib import Path

import markdown
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).parent
LECTURES = ROOT / "lectures"
SITE = ROOT / "site"
SHARED = ROOT.parent / "course-shared"

LEARNING_LAB_RE = re.compile(r'data-learning-lab="([a-z0-9-]+)"')
LEARNING_HEAD = """<link rel="stylesheet" href="assets/learning/learning.css">
<script>
document.documentElement.classList.add('cl-js');
window.setTimeout(function () {
  document.documentElement.classList.add('cl-fallback-ready');
}, 4000);
try {
  document.documentElement.setAttribute(
    'data-reading-mode',
    localStorage.getItem('course-reading-mode') === 'reference' ? 'reference' : 'learn'
  );
} catch (error) {
  document.documentElement.setAttribute('data-reading-mode', 'learn');
}
</script>"""

SITE_TITLE = "从找函数到智能体"
SITE_SUBTITLE = "AI 原理与应用 · 自学讲义"

# (md 文件名, 侧栏短标题)。html 文件名 = md 文件名同名替换后缀; 00 号渲染为 index.html
COURSE = [
    ("课程导览", [
        ("00-intro.md", "00 · 课程导览与环境准备"),
    ]),
    ("上篇 · AI 发展史（原理）", [
        ("01-find-function.md", "01 · 机器学习就是找函数"),
        ("02-perceptron-svm.md", "02 · 感知机与支持向量机"),
        ("03-tree-bayes.md", "03 · 决策树与贝叶斯方法"),
        ("04-neural-networks.md", "04 · 神经网络的兴衰与反向传播"),
        ("05-alexnet-cnn.md", "05 · AlexNet 与深度学习热潮"),
        ("06-transformer.md", "06 · 从序列建模到 Transformer"),
        ("07-scaling-laws-llm.md", "07 · Scaling Laws 与大语言模型"),
        ("08-llm-engineering.md", "08 · 让输出更好更稳：四个工程"),
        ("09-tools-agents-mcp.md", "09 · 工具调用、智能体、MCP 与 Skills"),
    ]),
    ("下篇 · AI 应用（实操）", [
        ("10-model-landscape.md", "10 · 模型地图与选型"),
        ("11-setup-tools.md", "11 · 软件与环境安装"),
        ("12-ai-for-learning.md", "12 · 用 AI 促进学习"),
        ("13-ai-for-research.md", "13 · 用 AI 促进科研"),
        ("14-tips-and-pitfalls.md", "14 · 使用技巧与坑"),
        ("15-coding-analysis.md", "15 · 实战：写代码与数据分析"),
        ("16-text-to-image.md", "16 · 实战：文生图"),
        ("17-slides-docs.md", "17 · 实战：PPT 与文档"),
        ("18-paper-writing.md", "18 · 实战：论文与长文写作"),
    ]),
    ("专题 · AI 系统工程", [
        ("19-inference-serving.md", "19 · 推理服务：延迟、吞吐与排队"),
    ]),
    ("实验室", [
        ("labs.md", "实验总览（lab01–lab10）"),
    ]),
]

MD_EXTENSIONS = [
    "tables",
    "footnotes",
    "attr_list",
    "md_in_html",
    "admonition",
    "toc",
    "pymdownx.arithmatex",
    "pymdownx.superfences",
    "pymdownx.highlight",
    "pymdownx.betterem",
    "pymdownx.tilde",
]
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
<link rel="stylesheet" href="assets/pygments.css">{learning_head}
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
<script defer src="assets/site.js"></script>{learning_scripts}
</body>
</html>
"""


def learning_assets(src: str):
    names = list(dict.fromkeys(LEARNING_LAB_RE.findall(src)))
    if not names:
        return "", ""
    missing = [name for name in names if not (SHARED / "labs" / f"{name}.js").exists()]
    if missing:
        raise FileNotFoundError(f"Missing learning lab scripts: {', '.join(missing)}")
    scripts = ['<script defer src="assets/learning/learning.js"></script>']
    scripts.extend(f'<script defer src="assets/learning/labs/{name}.js"></script>' for name in names)
    return "\n" + LEARNING_HEAD, "\n" + "\n".join(scripts)


def previous_build_time(out: Path, fallback: str) -> str:
    if not out.exists():
        return fallback
    match = re.search(
        r'<div class="build-time">构建于 ([^<]+)</div>',
        out.read_text(encoding="utf-8"),
    )
    return match.group(1) if match else fallback


def build_nav(current_html: str) -> str:
    parts = []
    for part_title, lectures in COURSE:
        items = []
        for md_name, nav_title in lectures:
            href = html_name(md_name)
            cls = ' class="active"' if href == current_html else ""
            items.append(f'<li{cls}><a href="{href}">{html.escape(nav_title)}</a></li>')
        parts.append(
            f'<div class="nav-part"><div class="nav-part-title">{html.escape(part_title)}</div>'
            f'<ul>{"".join(items)}</ul></div>'
        )
    return "\n".join(parts)


def html_name(md_name: str) -> str:
    if md_name == "00-intro.md":
        return "index.html"
    return md_name.replace(".md", ".html")


def flat_lectures():
    out = []
    for _, lectures in COURSE:
        out.extend(lectures)
    return out


def render_page(md_name: str, nav_title: str, prev_item, next_item, build_time: str) -> str:
    src = (LECTURES / md_name).read_text(encoding="utf-8")
    learning_head, learning_scripts = learning_assets(src)
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    body = md.convert(src)
    # 页内目录（讲义正文较长, 折叠展示）
    toc = getattr(md, "toc", "")
    toc_block = ""
    if toc and toc.count("<li>") + toc.count("<li ") >= 3:
        toc_block = f'<details class="page-toc"><summary>本讲目录</summary>{toc}</details>'

    def pager(item, label, cls):
        if item is None:
            return f'<span class="pager-slot {cls}"></span>'
        return (
            f'<a class="pager-slot {cls}" href="{html_name(item[0])}">'
            f'<span class="pager-label">{label}</span>{html.escape(item[1])}</a>'
        )

    title = nav_title.split("·", 1)[-1].strip() if "·" in nav_title else nav_title
    return PAGE_TMPL.format(
        title=html.escape(title),
        site_title=SITE_TITLE,
        site_subtitle=SITE_SUBTITLE,
        nav=build_nav(html_name(md_name)),
        toc_block=toc_block,
        body=body,
        prev_link=pager(prev_item, "上一讲", "prev"),
        next_link=pager(next_item, "下一讲", "next"),
        build_time=build_time,
        learning_head=learning_head,
        learning_scripts=learning_scripts,
    )


def write_pygments_css():
    light = HtmlFormatter(style="default").get_style_defs(".highlight")
    dark_raw = HtmlFormatter(style="native").get_style_defs(".highlight")
    dark_lines = []
    for line in dark_raw.splitlines():
        if line.startswith(".highlight"):
            dark_lines.append('html[data-theme="dark"] ' + line)
        else:
            dark_lines.append(line)
    (SITE / "assets" / "pygments.css").write_text(
        light + "\n\n/* dark */\n" + "\n".join(dark_lines), encoding="utf-8"
    )


def main():
    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / "assets").mkdir(exist_ok=True)
    # 静态资源: style.css / site.js 由 tools/ 提供, katex 已在 assets 下
    for asset in ["style.css", "site.js"]:
        src = ROOT / "tools" / asset
        if src.exists():
            shutil.copy(src, SITE / "assets" / asset)
    learning_dst = SITE / "assets" / "learning"
    if learning_dst.exists():
        shutil.rmtree(learning_dst)
    if SHARED.exists():
        shutil.copytree(SHARED, learning_dst)
    # 图片：把 images/ 源目录整体拷进 site/assets/img/（GPT/matplotlib 生成的插图放这里）
    img_src = ROOT / "images"
    if img_src.exists():
        img_dst = SITE / "assets" / "img"
        if img_dst.exists():
            shutil.rmtree(img_dst)
        shutil.copytree(img_src, img_dst)
    write_pygments_css()

    build_time = time.strftime("%Y-%m-%d %H:%M")
    items = flat_lectures()
    missing = [m for m, _ in items if not (LECTURES / m).exists()]
    if missing:
        print("⚠️  缺少讲义文件, 先跳过:", ", ".join(missing))
    items = [it for it in items if (LECTURES / it[0]).exists()]
    for i, (md_name, nav_title) in enumerate(items):
        prev_item = items[i - 1] if i > 0 else None
        next_item = items[i + 1] if i < len(items) - 1 else None
        out = SITE / html_name(md_name)
        previous = out.read_text(encoding="utf-8") if out.exists() else None
        page_time = previous_build_time(out, build_time)
        page = render_page(md_name, nav_title, prev_item, next_item, page_time)
        if page != previous:
            page = render_page(md_name, nav_title, prev_item, next_item, build_time)
            out.write_text(page, encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: 共 {len(items)} 页 → {SITE}/")
    print("浏览: 直接双击 site/index.html, 或 python3 -m http.server -d site 8080")


if __name__ == "__main__":
    main()
