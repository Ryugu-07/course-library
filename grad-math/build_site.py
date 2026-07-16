#!/usr/bin/env python3
"""
研究生数学讲义库 · 站点生成器（与 ai/comfy/math-course 同引擎）

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

SITE_TITLE = "研究生数学讲义库"
SITE_SUBTITLE = "定理 · 证明 · 对标教材"

COURSE = [
    ("总览", [
        ("00-intro.md", "00 · 使用指南：标注体系与教材对照"),
    ]),
    ("概率与分析线", [
        ("mt-01-measure-expectation.md", "测度概率 I · 测度论语言与期望"),
        ("mt-02-lln.md", "测度概率 II · 独立性与大数定律"),
        ("mt-03-conditional-martingale.md", "测度概率 III · 条件期望与鞅"),
        ("mt-04-martingale-convergence.md", "测度概率 IV · 鞅收敛与应用"),
        ("hdp-01-subgaussian.md", "高维概率 I · 亚高斯与集中不等式"),
        ("hdp-02-random-vectors.md", "高维概率 II · 随机向量与降维"),
        ("hdp-03-random-matrices.md", "高维概率 III · 随机矩阵与谱界"),
        ("hdp-04-chaining.md", "高维概率 IV · 链式法与经验过程"),
        ("sc-01-brownian-rigorous.md", "随机分析 I · 布朗运动的严格构造"),
        ("sc-02-ito-integral.md", "随机分析 II · Itô 积分的构造"),
        ("sc-03-ito-formula-sde.md", "随机分析 III · Itô 公式与 SDE 理论"),
        ("sc-04-girsanov.md", "随机分析 IV · Girsanov 与 Feynman–Kac"),
        ("pde2-01-distributions.md", "现代 PDE I · 分布与弱导数"),
        ("pde2-02-sobolev.md", "现代 PDE II · Sobolev 空间"),
        ("pde2-03-elliptic.md", "现代 PDE III · 椭圆方程弱解理论"),
    ]),
    ("统计与学习线", [
        ("as-01-convergence-tools.md", "渐近统计 I · 收敛工具箱"),
        ("as-02-mle-asymptotics.md", "渐近统计 II · MLE 渐近理论"),
        ("as-03-testing-asymptotics.md", "渐近统计 III · 三大检验与局部理论"),
        ("slt-01-pac.md", "统计学习 I · PAC 框架与有限类"),
        ("slt-02-vc.md", "统计学习 II · VC 理论"),
        ("slt-03-rademacher.md", "统计学习 III · Rademacher 复杂度"),
        ("slt-04-stability-online.md", "统计学习 IV · 稳定性与在线学习"),
        ("mdp-01-bellman.md", "MDP I · Bellman 算子与压缩"),
        ("mdp-02-iteration.md", "MDP II · 价值迭代与策略迭代"),
        ("mdp-03-stochastic-approx.md", "MDP III · 随机逼近与 Q 学习"),
    ]),
    ("优化与计算线", [
        ("cvx-01-conjugate.md", "凸优化 I · 共轭函数与 Fenchel 对偶"),
        ("cvx-02-first-order.md", "凸优化 II · 一阶方法收敛性证明"),
        ("cvx-03-splitting.md", "凸优化 III · 增广拉格朗日与 ADMM"),
        ("cvx-04-interior-point.md", "凸优化 IV · 内点法与 SDP"),
        ("nla-01-svd-stability.md", "数值线代 I · SVD、QR 与后向稳定性"),
        ("nla-02-eigen.md", "数值线代 II · 特征值算法"),
        ("nla-03-krylov.md", "数值线代 III · Krylov 子空间方法"),
        ("ma-01-norms-perturbation.md", "矩阵分析 I · 范数、谱半径与扰动"),
        ("ma-02-psd-functions.md", "矩阵分析 II · 半正定、Schur 补与矩阵函数"),
        ("ma-03-perron.md", "矩阵分析 III · Perron–Frobenius"),
    ]),
    ("信息与传输线", [
        ("it2-01-aep.md", "信息论进阶 I · AEP 与典型集"),
        ("it2-02-channel.md", "信息论进阶 II · 信道编码定理"),
        ("it2-03-rate-distortion.md", "信息论进阶 III · 率失真与大偏差"),
        ("ot-01-monge-kantorovich.md", "最优传输 I · Monge–Kantorovich 与对偶"),
        ("ot-02-wasserstein.md", "最优传输 II · Wasserstein 几何与 Brenier"),
        ("ot-03-computational.md", "最优传输 III · Sinkhorn 与生成模型"),
    ]),
    ("几何与代数线", [
        ("mfld-01-manifolds.md", "流形几何 I · 光滑流形与切空间"),
        ("mfld-02-forms-stokes.md", "流形几何 II · 微分形式与 Stokes"),
        ("mfld-03-riemannian.md", "流形几何 III · 黎曼度量与测地线"),
        ("mfld-04-curvature.md", "流形几何 IV · 曲率"),
        ("at-01-fundamental-group.md", "代数拓扑 I · 同伦与基本群"),
        ("at-02-covering.md", "代数拓扑 II · 覆盖空间与 van Kampen"),
        ("at-03-homology.md", "代数拓扑 III · 同调"),
        ("alg2-01-groups-advanced.md", "代数进阶 I · Sylow 与可解群"),
        ("alg2-02-galois.md", "代数进阶 II · Galois 对应"),
        ("alg2-03-insolvability.md", "代数进阶 III · 五次不可解"),
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
