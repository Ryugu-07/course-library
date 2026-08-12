#!/usr/bin/env python3
"""
课程站点生成器（comfy-course 版）：把 lectures/*.md 渲染成 site/ 静态博客站。

用法（复用 ai-course 的构建环境，里面已装 markdown/pymdownx/pygments）:
    ~/ai-course/.venv/bin/python build_site.py

与 ai-course 的生成器同源，仅课程配置不同。
"""

import html
import shutil
import time
from pathlib import Path

import markdown
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).parent
LECTURES = ROOT / "lectures"
SITE = ROOT / "site"

SITE_TITLE = "从噪声到图像"
SITE_SUBTITLE = "生图模型原理与 ComfyUI 实战"

COURSE = [
    ("课程导览", [
        ("00-intro.md", "00 · 导览：你的机器现状与路线图"),
    ]),
    ("上篇 · 原理（为什么这样设计）", [
        ("01-generative-models.md", "01 · 生成模型：学分布与采样"),
        ("02-ddpm.md", "02 · 扩散模型 I：DDPM 全推导"),
        ("03-samplers-cfg.md", "03 · 扩散模型 II：采样器与 CFG"),
        ("04-architecture.md", "04 · 潜空间与整机架构"),
        ("05-control-math.md", "05 · 控制与定制：LoRA / ControlNet / IP-Adapter"),
    ]),
    ("下篇 · ComfyUI 实战（E:\\AI 实机）", [
        ("06-your-machine.md", "06 · 你的这台机器与这套安装"),
        ("07-first-workflow.md", "07 · 节点=原理的落地：逐节点拆解"),
        ("08-parameters.md", "08 · 参数手册：钉死变量再调参"),
        ("09-img2img-inpaint.md", "09 · 图生图与局部重绘"),
        ("10-model-ecosystem.md", "10 · 模型生态：选型与下载清单"),
        ("11-lora-practice.md", "11 · LoRA 实战"),
        ("12-controlnet-practice.md", "12 · ControlNet 实战"),
        ("13-ipadapter-consistency.md", "13 · IP-Adapter 与角色一致性"),
        ("14-upscale-detail.md", "14 · 放大与精修流水线"),
        ("15-engineering.md", "15 · 工程化与排障"),
    ]),
    ("拓展篇 · AIGC 全景", [
        ("16-aigc-map.md", "16 · AIGC 全景地图与四步框架"),
        ("17-video-principles.md", "17 · 视频生成 I：原理"),
        ("18-video-practice.md", "18 · 视频生成 II：16GB 实机实战"),
        ("19-speech-generation.md", "19 · 语音生成：TTS 与声音克隆"),
        ("20-music-audio.md", "20 · 音乐与音效生成"),
        ("21-3d-avatar-pipeline.md", "21 · 3D、数字人与全本地流水线"),
        ("22-minimax-h3.md", "22 · MiniMax H3：全模态声画工作流"),
    ]),
    ("工作流实验室", [
        ("workflows.md", "工作流包使用说明（wf01–wf07）"),
    ]),
]

MD_EXTENSIONS = [
    "tables", "footnotes", "attr_list", "md_in_html", "admonition", "toc",
    "pymdownx.arithmatex", "pymdownx.superfences", "pymdownx.highlight",
    "pymdownx.betterem", "pymdownx.tilde",
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
<link rel="stylesheet" href="assets/style.css?v=20260802">
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


def html_name(md_name: str) -> str:
    if md_name == "00-intro.md":
        return "index.html"
    return md_name.replace(".md", ".html")


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


def flat_lectures():
    out = []
    for _, lectures in COURSE:
        out.extend(lectures)
    return out


def render_page(md_name, nav_title, prev_item, next_item, build_time):
    src = (LECTURES / md_name).read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    body = md.convert(src)
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
        title=html.escape(title), site_title=SITE_TITLE, site_subtitle=SITE_SUBTITLE,
        nav=build_nav(html_name(md_name)), toc_block=toc_block, body=body,
        prev_link=pager(prev_item, "上一讲", "prev"),
        next_link=pager(next_item, "下一讲", "next"),
        build_time=build_time,
    )


def write_pygments_css():
    light = HtmlFormatter(style="default").get_style_defs(".highlight")
    dark_raw = HtmlFormatter(style="native").get_style_defs(".highlight")
    dark_lines = [('html[data-theme="dark"] ' + l) if l.startswith(".highlight") else l
                  for l in dark_raw.splitlines()]
    (SITE / "assets" / "pygments.css").write_text(
        light + "\n\n/* dark */\n" + "\n".join(dark_lines), encoding="utf-8")


def main():
    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / "assets").mkdir(exist_ok=True)
    for asset in ["style.css", "site.js"]:
        src = ROOT / "tools" / asset
        if src.exists():
            shutil.copy(src, SITE / "assets" / asset)
    # 图片：把 images/ 源目录整体拷进 site/assets/img/（GPT/matplotlib 生成的插图放这里）
    img_src = ROOT / "images"
    if img_src.exists():
        img_dst = SITE / "assets" / "img"
        if img_dst.exists():
            shutil.rmtree(img_dst)
        shutil.copytree(img_src, img_dst)
    write_pygments_css()

    build_time = time.strftime("%Y-%m-%d %H:%M")
    items = [it for it in flat_lectures() if (LECTURES / it[0]).exists()]
    missing = [m for m, _ in flat_lectures() if not (LECTURES / m).exists()]
    if missing:
        print("⚠️  缺少讲义文件, 先跳过:", ", ".join(missing))
    for i, (md_name, nav_title) in enumerate(items):
        out = SITE / html_name(md_name)
        out.write_text(render_page(md_name, nav_title,
                                   items[i - 1] if i > 0 else None,
                                   items[i + 1] if i < len(items) - 1 else None,
                                   build_time), encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: 共 {len(items)} 页 → {SITE}/")


if __name__ == "__main__":
    main()
