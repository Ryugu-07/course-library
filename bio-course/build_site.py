#!/usr/bin/env python3
"""
生命的逻辑 · 站点生成器（与八站讲义库同引擎）
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

SITE_TITLE = "生命的逻辑"
SITE_SUBTITLE = "基础 · 人体 · 遗传 · 演化 · 脑与前沿"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 怎么读这门课"),
    ]),
    ("线一 · 生命的基本盘", [
        ("01-cell-energy.md", "基础 I · 细胞、能量与代谢"),
        ("02-central-dogma.md", "基础 II · 中心法则与基因表达"),
        ("03-proteins.md", "基础 III · 蛋白质：从序列到机器"),
    ]),
    ("线二 · 人体", [
        ("04-homeostasis.md", "人体 I · 稳态作为控制系统"),
        ("05-scaling.md", "人体 II · 代谢、能量与标度律"),
        ("06-transport.md", "人体 III · 循环与呼吸的物理"),
        ("07-immunity.md", "人体 IV · 免疫：分布式识别与记忆"),
        ("08-microbiome.md", "人体 V · 微生物组与全生物体"),
        ("09-aging.md", "人体 VI · 衰老的生物学"),
    ]),
    ("线三 · 遗传", [
        ("10-mendel-quantitative.md", "遗传 I · 从孟德尔到定量遗传"),
        ("11-popgen.md", "遗传 II · 群体遗传学核心"),
        ("12-gwas.md", "遗传 III · 连锁、GWAS 与多基因分数"),
        ("13-genome.md", "遗传 IV · 基因组的结构与非编码世界"),
        ("14-epigenetics.md", "遗传 V · 表观遗传：机制与炒作"),
    ]),
    ("线四 · 演化", [
        ("15-selection.md", "演化 I · 选择的形式化"),
        ("16-neutral.md", "演化 II · 中性理论与分子钟"),
        ("17-coalescent.md", "演化 III · 溯祖理论"),
        ("18-phylogenetics.md", "演化 IV · 系统发生与物种形成"),
        ("19-human-evolution.md", "演化 V · 人类演化与古 DNA"),
        ("20-evolutionary-medicine.md", "演化 VI · 演化医学"),
    ]),
    ("线五 · 脑", [
        ("21-neuron.md", "脑 I · 神经元的定量物理"),
        ("22-synapse.md", "脑 II · 突触传递与可塑性"),
        ("23-circuits.md", "脑 III · 回路、编码与预测"),
        ("24-connectome.md", "脑 IV · 连接组学"),
        ("25-memory.md", "脑 V · 记忆的物质基础"),
        ("26-consciousness.md", "脑 VI · 意识研究的现状【争】"),
    ]),
    ("线六 · 前沿", [
        ("27-protein-design.md", "前沿 I · 结构预测与蛋白设计"),
        ("28-editing.md", "前沿 II · 基因编辑与基因治疗"),
        ("29-single-cell.md", "前沿 III · 单细胞与空间组学"),
        ("30-organoids.md", "前沿 IV · 类器官与胚胎模型"),
        ("31-ai-biology.md", "前沿 V · AI 进入生物学"),
        ("32-bci.md", "前沿 VI · 脑机接口"),
    ]),
    ("收官", [
        ("33-closing.md", "收官 · 生命的统一逻辑"),
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
        print("待写:", " ".join(m.replace('.md', '') for m in missing[:12]), "…" if len(missing) > 12 else "")


if __name__ == "__main__":
    main()
