#!/usr/bin/env python3
"""
机器的力学 · 站点生成器（与十一站讲义库同引擎）
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

SITE_TITLE = "机器的力学"
SITE_SUBTITLE = "固体力学 · 振动 · 传动 · 制造 · 机械工程讲义"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 怎么读这门课"),
    ]),
    ("线一 · 本科核心：固体力学", [
        ("01-statics.md", "力学 I · 静力学与受力分析"),
        ("02-stress-strain.md", "力学 II · 应力、应变与材料行为"),
        ("03-beam-torsion.md", "力学 III · 弯曲与扭转"),
        ("04-buckling.md", "力学 IV · 组合变形与屈曲"),
        ("05-energy-elasticity.md", "力学 V · 能量法与弹性力学入门"),
    ]),
    ("线二 · 本科核心：动力学与振动", [
        ("06-rigid-dynamics.md", "动力 I · 刚体动力学与转动惯量"),
        ("07-vibration-sdof.md", "动力 II · 单自由度振动"),
        ("08-vibration-mdof.md", "动力 III · 多自由度与模态分析"),
        ("09-rotordynamics.md", "动力 IV · 转子动力学与工程振动"),
    ]),
    ("线三 · 机构、传动与流体", [
        ("10-mechanisms.md", "传动 I · 机构运动学"),
        ("11-gears.md", "传动 II · 齿轮与传动系统"),
        ("12-bearing-tribology.md", "传动 III · 轴系、轴承与摩擦学"),
        ("13-fluid-machinery.md", "传动 IV · 工程流体与泵风机要点"),
    ]),
    ("线四 · 失效与精度", [
        ("14-fatigue.md", "失效 I · 疲劳与断裂"),
        ("15-tolerance.md", "失效 II · 公差、配合与几何量"),
        ("16-reliability.md", "失效 III · 安全系数与可靠性设计"),
    ]),
    ("线五 · 制造", [
        ("17-forming.md", "制造 I · 铸、锻、焊"),
        ("18-machining.md", "制造 II · 切削与精密加工"),
        ("19-additive.md", "制造 III · 增材制造"),
        ("20-materials.md", "制造 IV · 材料选择与热处理"),
    ]),
    ("线六 · 计算与前沿", [
        ("21-fem.md", "前沿 I · 有限元与结构优化"),
        ("22-frontier.md", "前沿 II · 产业前沿与职业路径"),
    ]),
    ("收官", [
        ("23-closing.md", "收官 · 力的传递"),
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
