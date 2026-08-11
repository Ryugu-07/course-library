#!/usr/bin/env python3
"""
本科数学复习库 · 站点生成器（与 ai-course/comfy-course 同引擎）

用法: ~/ai-course/.venv/bin/python build_site.py
新增课程页: lectures/ 加 md 文件 + 在下方 COURSE 登记。
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
try {
  document.documentElement.setAttribute(
    'data-reading-mode',
    localStorage.getItem('course-reading-mode') === 'reference' ? 'reference' : 'learn'
  );
} catch (error) {
  document.documentElement.setAttribute('data-reading-mode', 'learn');
}
</script>"""

SITE_TITLE = "本科数学复习库"
SITE_SUBTITLE = "定义 · 定理 · 证明思路 · 速查"

COURSE = [
    ("总览", [
        ("00-intro.md", "00 · 使用指南与课程地图"),
    ]),
    ("分析线", [
        ("analysis-01-real-limits.md", "数分 I · 实数完备性与极限"),
        ("analysis-02-differential.md", "数分 II · 一元微分学"),
        ("analysis-03-integral.md", "数分 III · 一元积分学"),
        ("analysis-04-series.md", "数分 IV · 级数"),
        ("analysis-05-multivar-diff.md", "数分 V · 多元微分学"),
        ("analysis-06-multivar-int.md", "数分 VI · 多元积分学"),
        ("ode-01-first-order.md", "常微分 I · 一阶方程与解的理论"),
        ("ode-02-linear.md", "常微分 II · 高阶线性方程"),
        ("ode-03-systems-stability.md", "常微分 III · 线性系统与稳定性"),
        ("complex-01-analytic.md", "复变 I · 解析函数与 C–R 方程"),
        ("complex-02-integration.md", "复变 II · Cauchy 定理与积分公式"),
        ("complex-03-residues.md", "复变 III · 级数与留数定理"),
        ("real-01-measure.md", "实变 I · Lebesgue 测度"),
        ("real-02-lebesgue-integral.md", "实变 II · 积分与收敛定理"),
        ("real-03-lp-spaces.md", "实变 III · Lp 空间"),
        ("func-01-banach.md", "泛函 I · 度量与 Banach 空间"),
        ("func-02-hilbert.md", "泛函 II · Hilbert 空间"),
        ("func-03-operators.md", "泛函 III · 有界算子与三大定理"),
        ("pde-01-separation.md", "偏微分 I · 三大方程与分离变量"),
        ("pde-02-characteristics-kernels.md", "偏微分 II · 特征线、行波与热核"),
    ]),
    ("代数与几何线", [
        ("algebra-01-polynomial.md", "高代 I · 多项式"),
        ("algebra-02-determinant.md", "高代 II · 行列式与线性方程组"),
        ("algebra-03-matrix.md", "高代 III · 矩阵"),
        ("algebra-04-linear-space.md", "高代 IV · 线性空间与线性映射"),
        ("algebra-05-eigen.md", "高代 V · 特征值与标准形"),
        ("algebra-06-quadratic.md", "高代 VI · 二次型与内积空间"),
        ("geo-01-vectors-planes.md", "解几 I · 向量代数与平面直线"),
        ("geo-02-quadrics.md", "解几 II · 二次曲面"),
        ("alg-abs-01-groups.md", "抽代 I · 群论"),
        ("alg-abs-02-rings-fields.md", "抽代 II · 环、域与 Galois 一瞥"),
        ("top-01-spaces.md", "拓扑 I · 拓扑空间与连续映射"),
        ("top-02-compact-connected.md", "拓扑 II · 紧致、连通与分离性"),
        ("dg-01-curves.md", "微分几何 I · 曲线论"),
        ("dg-02-surfaces.md", "微分几何 II · 曲面论与绝妙定理"),
    ]),
    ("概率统计线", [
        ("prob-01-space-bayes.md", "概率 I · 概率空间与贝叶斯"),
        ("prob-02-random-variables.md", "概率 II · 随机变量与分布"),
        ("prob-03-multivariate.md", "概率 III · 多维随机变量"),
        ("prob-04-moments.md", "概率 IV · 数字特征与条件期望"),
        ("prob-05-limit-theorems.md", "概率 V · 极限定理"),
        ("stat-01-sampling.md", "统计 I · 统计量与抽样分布"),
        ("stat-02-estimation.md", "统计 II · 点估计与 Cramér–Rao"),
        ("stat-03-interval.md", "统计 III · 区间估计"),
        ("stat-04-testing.md", "统计 IV · 假设检验"),
        ("stat-05-regression.md", "统计 V · 回归与方差分析"),
        ("stoch-01-poisson.md", "随机过程 I · Poisson 过程"),
        ("stoch-02-markov-1.md", "随机过程 II · Markov 链（一）"),
        ("stoch-03-markov-2.md", "随机过程 III · Markov 链（二）"),
        ("stoch-04-brownian.md", "随机过程 IV · 布朗运动与鞅"),
    ]),
    ("应用计算线", [
        ("num-01-error.md", "数值 I · 误差与数值稳定性"),
        ("num-02-linear-systems.md", "数值 II · 线性方程组"),
        ("num-03-roots-interp.md", "数值 III · 求根、插值与逼近"),
        ("num-04-quadrature-ode.md", "数值 IV · 数值积分与 ODE"),
        ("opt-01-convex.md", "优化 I · 凸分析基础"),
        ("opt-02-unconstrained.md", "优化 II · 无约束优化"),
        ("opt-03-duality-kkt.md", "优化 III · 对偶与 KKT"),
        ("opt-04-lp-dp.md", "优化 IV · 线性规划与动态规划"),
        ("model-01-methodology.md", "建模 I · 方法论与量纲分析"),
        ("model-02-classic-models.md", "建模 II · 经典模型谱"),
    ]),
    ("扩展线（信息 · 金融 · 离散）", [
        ("info-01-entropy.md", "信息论 I · 熵与信源编码"),
        ("info-02-kl-mi.md", "信息论 II · KL 散度与互信息"),
        ("info-03-maxent-channel.md", "信息论 III · 最大熵与信道容量"),
        ("sde-01-ito.md", "随机微积分 I · 二次变差与 Itô 引理"),
        ("sde-02-sde-diffusion.md", "随机微积分 II · SDE 与扩散模型"),
        ("sde-03-black-scholes.md", "随机微积分 III · Black–Scholes"),
        ("ts-01-stationary-arma.md", "时间序列 I · 平稳性与 ARMA"),
        ("ts-02-nonstationary-garch.md", "时间序列 II · GARCH 与预测纪律"),
        ("graph-01-counting.md", "图论组合 I · 计数与生成函数"),
        ("graph-02-graphs.md", "图论组合 II · 图的基本理论"),
        ("graph-03-matching-flows.md", "图论组合 III · 匹配与网络流"),
        ("game-01-nash.md", "博弈论 I · 策略型博弈与 Nash 均衡"),
        ("game-02-zerosum-dynamic.md", "博弈论 II · 零和、动态与机制设计"),
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
        return (
            f'<a class="pager-slot {cls}" href="{html_name(item[0])}">'
            f'<span class="pager-label">{label}</span>{html.escape(item[1])}</a>'
        )

    title = nav_title.split("·", 1)[-1].strip() if "·" in nav_title else nav_title
    return PAGE_TMPL.format(
        title=html.escape(title), site_title=SITE_TITLE, site_subtitle=SITE_SUBTITLE,
        nav=build_nav(html_name(md_name)), toc_block=toc_block, body=body,
        prev_link=pager(prev_item, "上一页", "prev"),
        next_link=pager(next_item, "下一页", "next"),
        build_time=build_time,
        learning_head=learning_head, learning_scripts=learning_scripts,
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
    items = [it for it in flat_lectures() if (LECTURES / it[0]).exists()]
    missing = [m for m, _ in flat_lectures() if not (LECTURES / m).exists()]
    if missing:
        print("⚠️  缺少文件, 先跳过:", ", ".join(missing))
    for i, (md_name, nav_title) in enumerate(items):
        out = SITE / html_name(md_name)
        previous = out.read_text(encoding="utf-8") if out.exists() else None
        page_time = previous_build_time(out, build_time)
        page = render_page(md_name, nav_title,
                           items[i - 1] if i > 0 else None,
                           items[i + 1] if i < len(items) - 1 else None,
                           page_time)
        if page != previous:
            page = render_page(md_name, nav_title,
                               items[i - 1] if i > 0 else None,
                               items[i + 1] if i < len(items) - 1 else None,
                               build_time)
            out.write_text(page, encoding="utf-8")
        print(f"✓ {out.name}")
    print(f"\n完成: 共 {len(items)} 页 → {SITE}/")


if __name__ == "__main__":
    main()
