#!/usr/bin/env python3
"""
光的工程 · 站点生成器（与十二站讲义库同引擎）
用法: ~/ai-course/.venv/bin/python build_site.py
COURSE 注册全部规划页；缺失文件构建时跳过并标 ⏳（进度清单）。
"""
import html, re, shutil, time
from pathlib import Path
import markdown
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).parent
LECTURES = ROOT / "lectures"
SITE = ROOT / "site"
SHARED = ROOT.parent / "course-shared"

LEARNING_LAB_RE = re.compile(r'\bdata-learning-lab\s*=\s*["\']([a-z0-9-]+)["\']')
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

SITE_TITLE = "光的工程"
SITE_SUBTITLE = "光学 · 激光 · 探测 · 光纤 · 光电信息讲义"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 怎么读这门课"),
    ]),
    ("线一 · 本科核心：光的两种描述", [
        ("01-geometric.md", "光学 I · 几何光学与成像"),
        ("02-aberration.md", "光学 II · 像差与光学系统设计"),
        ("03-interference.md", "光学 III · 干涉与相干性"),
        ("04-fourier-optics.md", "光学 IV · 衍射与傅里叶光学"),
        ("05-polarization.md", "光学 V · 偏振与晶体光学"),
    ]),
    ("线二 · 光源", [
        ("06-laser.md", "光源 I · 激光原理"),
        ("07-gaussian-beam.md", "光源 II · 高斯光束与谐振腔"),
        ("08-semiconductor-light.md", "光源 III · LED 与半导体激光"),
    ]),
    ("线三 · 探测与成像", [
        ("09-detector.md", "探测 I · 光电探测器与噪声"),
        ("10-image-sensor.md", "探测 II · 图像传感器"),
        ("11-imaging-mtf.md", "探测 III · 成像质量与计算成像"),
    ]),
    ("线四 · 光纤与光通信", [
        ("12-fiber.md", "光纤 I · 波导原理与色散"),
        ("13-optical-comm.md", "光纤 II · 光通信系统"),
        ("14-amplifier-nonlinear.md", "光纤 III · 光放大与非线性"),
    ]),
    ("线五 · 集成与应用", [
        ("15-silicon-photonics.md", "应用 I · 集成光子与硅光"),
        ("16-display.md", "应用 II · 显示技术"),
        ("17-sensing-lidar.md", "应用 III · 光谱传感与 LiDAR"),
    ]),
    ("线六 · 前沿", [
        ("18-metasurface.md", "前沿 I · 超表面与超构光学"),
        ("19-quantum-optics.md", "前沿 II · 光计算与量子光学"),
        ("20-industry.md", "前沿 III · 产业与职业路径"),
    ]),
    ("收官", [
        ("21-closing.md", "收官 · 光作为工具"),
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


def learning_assets(src):
    names = list(dict.fromkeys(LEARNING_LAB_RE.findall(src)))
    if not names:
        return "", ""
    missing = [name for name in names if not (SHARED / "labs" / f"{name}.js").is_file()]
    if missing:
        raise FileNotFoundError(f"Missing learning lab scripts: {', '.join(missing)}")
    scripts = ['<script defer src="assets/learning/learning.js"></script>']
    scripts.extend(f'<script defer src="assets/learning/labs/{name}.js"></script>' for name in names)
    return "\n" + LEARNING_HEAD, "\n" + "\n".join(scripts)


def sync_learning_assets(md_names):
    destination = SITE / "assets" / "learning"
    if destination.exists():
        shutil.rmtree(destination)
    names = []
    for md_name in md_names:
        src = (LECTURES / md_name).read_text(encoding="utf-8")
        names.extend(LEARNING_LAB_RE.findall(src))
    names = list(dict.fromkeys(names))
    if not names:
        return
    (destination / "labs").mkdir(parents=True)
    for asset in ("learning.css", "learning.js"):
        shutil.copy(SHARED / asset, destination / asset)
    for name in names:
        source = SHARED / "labs" / f"{name}.js"
        if not source.is_file():
            raise FileNotFoundError(f"Missing learning lab script: {source}")
        shutil.copy(source, destination / "labs" / source.name)


def render_page(md_name, nav_title, prev_item, next_item, build_time, existing):
    src = (LECTURES / md_name).read_text(encoding="utf-8")
    learning_head, learning_scripts = learning_assets(src)
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
        build_time=build_time, learning_head=learning_head, learning_scripts=learning_scripts)


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
    sync_learning_assets(md_name for md_name, _ in items)
    for i, (md_name, nav_title) in enumerate(items):
        out = SITE / html_name(md_name)
        out.write_text(render_page(md_name, nav_title,
                                   items[i - 1] if i > 0 else None,
                                   items[i + 1] if i < len(items) - 1 else None,
                                   build_time, existing), encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: {len(items)} 页已建 / {len(missing)} 页待写 → {SITE}/")
    if missing:
        print("待写:", " ".join(m.replace('.md', '') for m in missing[:12]), "…" if len(missing) > 12 else "")


if __name__ == "__main__":
    main()
