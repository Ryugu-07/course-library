#!/usr/bin/env python3
"""
从症状到决策 · 站点生成器（与十六站讲义库同引擎）
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

SITE_TITLE = "从症状到决策"
SITE_SUBTITLE = "临床推理与循证医学 · 每条治疗都给出 NNT"

COURSE = [
    ("导论", [
        ("00-intro.md", "00 · 怎么读这门课（附免责声明）"),
    ]),
    ("线一 · 诊断推理的数学", [
        ("01-bayes.md", "诊断 I · 诊断即推断：先验、似然比、后验"),
        ("02-test-characteristics.md", "诊断 II · 检验特性：敏感度、ROC 与截断值"),
        ("03-screening.md", "诊断 III · 筛查悖论与过度诊断"),
        ("04-reasoning-errors.md", "诊断 IV · 临床推理的心理学与误诊"),
    ]),
    ("线二 · 循证医学", [
        ("05-study-design.md", "循证 I · 研究设计阶梯与因果推断"),
        ("06-effect-size.md", "循证 II · 效应量：RR、ARR、NNT 与 NNH"),
        ("07-bias.md", "循证 III · 偏倚目录"),
        ("08-meta.md", "循证 IV · 系统综述、meta 分析与 GRADE"),
        ("09-guidelines.md", "循证 V · 替代终点与指南是怎么做出来的"),
    ]),
    ("线三 · 以症状为纲的临床路径", [
        ("10-chest-pain.md", "路径 I · 胸痛"),
        ("11-dyspnea.md", "路径 II · 呼吸困难"),
        ("12-abdominal-pain.md", "路径 III · 腹痛"),
        ("13-fever.md", "路径 IV · 发热"),
        ("14-headache-altered.md", "路径 V · 头痛与意识改变"),
    ]),
    ("线四 · 慢病、筛查与预防", [
        ("15-cv-risk.md", "预防 I · 心血管风险与他汀/降压的决策分析"),
        ("16-diabetes.md", "预防 II · 糖尿病：目标值之争"),
        ("17-cancer-screening.md", "预防 III · 癌症筛查逐癌种证据对照"),
        ("18-vaccines-prophylaxis.md", "预防 IV · 疫苗与预防性用药"),
    ]),
    ("线五 · 治疗学的边界", [
        ("19-placebo.md", "边界 I · 安慰剂、自然史与均值回归"),
        ("20-drug-approval.md", "边界 II · 药物审批、加速批准与撤市"),
        ("21-cam.md", "边界 III · 补充替代医学的证据检视"),
    ]),
    ("线六 · 系统与前沿（核对于 2026-07）", [
        ("22-ai-clinic.md", "前沿 I · AI 进入临床：证据现状"),
        ("23-health-economics.md", "系统 I · 成本效果、QALY 与资源分配"),
        ("24-communication.md", "系统 II · 风险沟通与共同决策"),
    ]),
    ("收官", [
        ("25-closing.md", "收官 · 在不确定性下行动"),
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
