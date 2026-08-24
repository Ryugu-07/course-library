#!/usr/bin/env python3
"""
材料的秩序 · 站点生成器（与十三站讲义库同引擎）
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

SITE_TITLE = "材料的秩序"
SITE_SUBTITLE = "结构 · 缺陷 · 性能 · 材料科学与工程讲义"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 怎么读这门课"),
    ]),
    ("线一 · 结构的语言", [
        ("01-bonding.md", "结构 I · 键合与材料四大家族"),
        ("02-crystal.md", "结构 II · 晶体学：秩序的几何"),
        ("03-defects.md", "结构 III · 缺陷：不完美的统治"),
        ("04-amorphous.md", "结构 IV · 非晶与玻璃"),
    ]),
    ("线二 · 热力学与动力学", [
        ("05-thermo-phase.md", "热力 I · 相图：材料的地图"),
        ("06-diffusion.md", "热力 II · 扩散"),
        ("07-transformation.md", "热力 III · 相变与热处理"),
    ]),
    ("线三 · 性能与失效", [
        ("08-strength.md", "性能 I · 强度的微观起源与强化四法"),
        ("09-fracture.md", "性能 II · 断裂、韧性与疲劳"),
        ("10-polymer.md", "性能 III · 高分子：链的物理"),
        ("11-ceramics.md", "性能 IV · 陶瓷与玻璃工程"),
    ]),
    ("线四 · 功能材料", [
        ("12-electronic.md", "功能 I · 电子材料"),
        ("13-magnetic-dielectric.md", "功能 II · 磁性与介电"),
        ("14-thermal-optical.md", "功能 III · 热与光"),
    ]),
    ("线五 · 工艺与表征", [
        ("15-solidification.md", "工艺 I · 凝固、铸造与成形"),
        ("16-powder-am.md", "工艺 II · 粉末、烧结与增材制造"),
        ("17-characterization.md", "工艺 III · 表征：材料科学家的眼睛"),
        ("18-corrosion.md", "工艺 IV · 腐蚀与防护"),
    ]),
    ("线六 · 前沿了望（核对于 2026-07）", [
        ("19-advanced-structural.md", "前沿 I · 先进结构材料"),
        ("20-energy-materials.md", "前沿 II · 能源材料"),
        ("21-computational-ai.md", "前沿 III · 计算材料学与 AI"),
    ]),
    ("收官", [
        ("22-selection-closing.md", "收官 · 材料选择与设计"),
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


def learning_assets(src):
    names = list(dict.fromkeys(LEARNING_LAB_RE.findall(src)))
    if not names:
        return "", ""
    missing = [name for name in names if not (SHARED / "labs" / f"{name}.js").exists()]
    if missing:
        raise FileNotFoundError(f"Missing learning lab scripts: {', '.join(missing)}")
    scripts = ['<script defer src="assets/learning/learning.js"></script>']
    scripts.extend(f'<script defer src="assets/learning/labs/{name}.js"></script>' for name in names)
    return "\n" + LEARNING_HEAD, "\n" + "\n".join(scripts)


def sync_learning_assets(existing):
    destination = SITE / "assets" / "learning"
    if destination.exists():
        shutil.rmtree(destination)
    names = []
    for md_name in existing:
        src = (LECTURES / md_name).read_text(encoding="utf-8")
        names.extend(LEARNING_LAB_RE.findall(src))
    names = list(dict.fromkeys(names))
    if not names:
        return
    (destination / "labs").mkdir(parents=True)
    for asset in ["learning.css", "learning.js"]:
        shutil.copy(SHARED / asset, destination / asset)
    for name in names:
        source = SHARED / "labs" / f"{name}.js"
        if not source.exists():
            raise FileNotFoundError(f"Missing learning lab script: {source}")
        shutil.copy(source, destination / "labs" / source.name)


def previous_build_time(out, fallback):
    if not out.exists():
        return fallback
    match = re.search(
        r'<div class="build-time">构建于 ([^<]+)</div>',
        out.read_text(encoding="utf-8"),
    )
    return match.group(1) if match else fallback


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
    sync_learning_assets(existing)
    missing = [m for m, _ in all_items if m not in existing]
    items = [it for it in all_items if it[0] in existing]
    for i, (md_name, nav_title) in enumerate(items):
        out = SITE / html_name(md_name)
        previous = out.read_text(encoding="utf-8") if out.exists() else None
        page_time = previous_build_time(out, build_time)
        page = render_page(md_name, nav_title,
                           items[i - 1] if i > 0 else None,
                           items[i + 1] if i < len(items) - 1 else None,
                           page_time, existing)
        if page != previous:
            page = render_page(md_name, nav_title,
                               items[i - 1] if i > 0 else None,
                               items[i + 1] if i < len(items) - 1 else None,
                               build_time, existing)
            out.write_text(page, encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: {len(items)} 页已建 / {len(missing)} 页待写 → {SITE}/")
    if missing:
        print("待写:", " ".join(m.replace('.md', '') for m in missing[:12]), "…" if len(missing) > 12 else "")


if __name__ == "__main__":
    main()
