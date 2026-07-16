#!/usr/bin/env python3
"""
物理讲义库 · 站点生成器（与 ai/comfy/math-course 同引擎）

用法: ~/ai-course/.venv/bin/python build_site.py
COURSE 中已注册全部规划页；缺失文件构建时跳过并提示——它同时是进度清单。
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

SITE_TITLE = "物理讲义库"
SITE_SUBTITLE = "推导 · 直觉 · 对标教材"

COURSE = [
    ("总览", [
        ("00-intro.md", "00 · 使用指南与课程地图"),
    ]),
    ("本科 · 力学与场", [
        ("mech-01-newton.md", "力学 I · 牛顿力学与守恒律"),
        ("mech-02-lagrange.md", "力学 II · 拉格朗日力学与变分原理"),
        ("mech-03-hamilton.md", "力学 III · 哈密顿力学与相空间"),
        ("mech-04-oscillation-rigid.md", "力学 IV · 振动与刚体"),
        ("em-01-electrostatics.md", "电磁 I · 静电与静磁"),
        ("em-02-maxwell.md", "电磁 II · Maxwell 方程与电磁波"),
        ("em-03-energy-radiation.md", "电磁 III · 能量、动量与辐射入门"),
        ("sr-01-relativity.md", "狭义相对论 · 洛伦兹变换与四矢量"),
        ("opt-01-waves.md", "光学 · 干涉、衍射与傅里叶光学"),
    ]),
    ("本科 · 热、量子与物质", [
        ("sm-01-thermodynamics.md", "统计物理 I · 热力学定律与熵"),
        ("sm-02-ensembles.md", "统计物理 II · 系综与配分函数"),
        ("sm-03-quantum-stats.md", "统计物理 III · 量子统计"),
        ("qm-01-framework.md", "量子 I · 波函数与基本框架"),
        ("qm-02-1d-oscillator.md", "量子 II · 一维问题与谐振子"),
        ("qm-03-angular-hydrogen.md", "量子 III · 角动量、氢原子与自旋"),
        ("qm-04-perturbation.md", "量子 IV · 微扰论与近似方法"),
        ("atom-01-modern.md", "近代物理 · 原子、光谱与核"),
        ("solid-01-lattice.md", "固体 I · 晶格与声子"),
        ("solid-02-bands.md", "固体 II · 能带与半导体"),
        ("mp-01-special-functions.md", "数理方法 · 特殊函数与 Green 函数"),
    ]),
    ("研究生 · 理论核心", [
        ("aqm-01-symmetry.md", "高量 I · 对称性与角动量理论"),
        ("aqm-02-scattering.md", "高量 II · 散射理论"),
        ("aqm-03-path-density.md", "高量 III · 路径积分与密度矩阵"),
        ("ced-01-boundary.md", "电动力学 I · 边值问题与多极展开"),
        ("ced-02-radiation.md", "电动力学 II · 推迟势与辐射"),
        ("asm-01-phase-transitions.md", "统计进阶 I · 相变与 Landau 理论"),
        ("asm-02-ising.md", "统计进阶 II · Ising 模型"),
        ("asm-03-rg.md", "统计进阶 III · 重整化群入门"),
        ("gr-01-equivalence.md", "广相 I · 等效原理与测地线"),
        ("gr-02-einstein-schwarzschild.md", "广相 II · Einstein 方程与 Schwarzschild"),
        ("gr-03-blackholes-waves.md", "广相 III · 黑洞、引力波与宇宙学度规"),
        ("qi-01-qubits.md", "量子信息 I · Qubit、纠缠与 Bell 不等式"),
        ("qi-02-algorithms.md", "量子信息 II · 量子算法"),
        ("qi-03-error-correction.md", "量子信息 III · 量子纠错与 NISQ"),
        ("cosmo-01-frw.md", "宇宙学 I · FRW 与 Friedmann 方程"),
        ("cosmo-02-thermal.md", "宇宙学 II · 热历史与 CMB"),
        ("comp-01-methods.md", "计算物理 · 蒙卡与分子动力学"),
    ]),
    ("前沿基础（第二档）", [
        ("qft-01-canonical.md", "场论 I · 经典场与正则量子化"),
        ("qft-02-feynman.md", "场论 II · 相互作用与 Feynman 图"),
        ("qft-03-path-renorm.md", "场论 III · 路径积分与重整化【骨架】"),
        ("cm-01-second-quant.md", "凝聚态 I · 二次量子化与电子气"),
        ("cm-02-bcs.md", "凝聚态 II · 超导 BCS【骨架】"),
        ("pp-01-gauge.md", "粒子 I · 规范原理与粒子谱"),
        ("pp-02-electroweak.md", "粒子 II · 电弱统一与 Higgs【骨架】"),
        ("neq-01-fluctuation.md", "非平衡 · Langevin、线性响应与涨落定理"),
        ("mb-01-tensor-networks.md", "量子多体 · 张量网络与变分方法"),
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


def html_name(md_name: str) -> str:
    if md_name == "00-intro.md":
        return "index.html"
    return md_name.replace(".md", ".html")


def build_nav(current_html: str, existing: set) -> str:
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
        return (
            f'<a class="pager-slot {cls}" href="{html_name(item[0])}">'
            f'<span class="pager-label">{label}</span>{html.escape(item[1])}</a>'
        )

    title = nav_title.split("·", 1)[-1].strip() if "·" in nav_title else nav_title
    return PAGE_TMPL.format(
        title=html.escape(title), site_title=SITE_TITLE, site_subtitle=SITE_SUBTITLE,
        nav=build_nav(html_name(md_name), existing), toc_block=toc_block, body=body,
        prev_link=pager(prev_item, "上一页", "prev"),
        next_link=pager(next_item, "下一页", "next"),
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
        print("待写:", " ".join(m.replace('.md','') for m in missing[:12]), "…" if len(missing) > 12 else "")


if __name__ == "__main__":
    main()
