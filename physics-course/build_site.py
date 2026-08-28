#!/usr/bin/env python3
"""
物理讲义库 · 站点生成器（与 ai/comfy/math-course 同引擎）

用法: ~/ai-course/.venv/bin/python build_site.py
COURSE 中已注册全部规划页；缺失文件构建时跳过并提示——它同时是进度清单。
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
        ("mech-05-central-scattering.md", "力学 V · 轨道、散射与截面"),
        ("cont-01-elastic-waves.md", "连续介质 · 弹性、应力与声波"),
        ("em-01-electrostatics.md", "电磁 I · 静电与静磁"),
        ("em-02-maxwell.md", "电磁 II · Maxwell 方程与电磁波"),
        ("em-03-energy-radiation.md", "电磁 III · 能量、动量与辐射入门"),
        ("em-04-media-waveguides.md", "电磁 IV · 介质、色散与波导"),
        ("sr-01-relativity.md", "狭义相对论 · 洛伦兹变换与四矢量"),
        ("opt-01-waves.md", "光学 · 干涉、衍射与傅里叶光学"),
    ]),
    ("本科 · 热、量子与物质", [
        ("sm-01-thermodynamics.md", "统计物理 I · 热力学定律与熵"),
        ("sm-02-ensembles.md", "统计物理 II · 系综与配分函数"),
        ("sm-03-quantum-stats.md", "统计物理 III · 量子统计"),
        ("sm-04-kinetic-transport.md", "统计物理 IV · 动理学与输运"),
        ("qm-01-framework.md", "量子 I · 波函数与基本框架"),
        ("qm-02-1d-oscillator.md", "量子 II · 一维问题与谐振子"),
        ("qm-03-angular-hydrogen.md", "量子 III · 角动量、氢原子与自旋"),
        ("qm-04-perturbation.md", "量子 IV · 微扰论与近似方法"),
        ("qm-05-identical-particles.md", "量子 V · 全同粒子与交换统计"),
        ("qm-06-wkb-variational-adiabatic.md", "量子 VI · WKB、变分与绝热近似"),
        ("atom-01-modern.md", "近代物理 · 原子、光谱与核"),
        ("nuc-01-structure-decay.md", "核物理 I · 核结构与衰变"),
        ("nuc-02-reactions-detectors.md", "核物理 II · 核反应与探测"),
        ("solid-01-lattice.md", "固体 I · 晶格与声子"),
        ("solid-02-bands.md", "固体 II · 能带与半导体"),
        ("solid-03-magnetism.md", "固体 III · 磁性与集体有序"),
        ("solid-04-topological.md", "固体 IV · Berry 相位与拓扑物态"),
        ("mp-01-special-functions.md", "数理方法 · 特殊函数与 Green 函数"),
    ]),
    ("实验物理与测量", [
        ("exp-01-measurement-uncertainty.md", "实验 I · 测量、不确定度与模型检验"),
        ("exp-02-noise-lockin.md", "实验 II · 噪声、频谱与锁相检测"),
        ("exp-03-spectroscopy-imaging.md", "实验 III · 光谱、成像与分辨率"),
        ("exp-04-vacuum-cryogenic-daq.md", "实验 IV · 真空、低温与数据采集"),
    ]),
    ("研究生 · 理论核心", [
        ("aqm-01-symmetry.md", "高量 I · 对称性与角动量理论"),
        ("aqm-02-scattering.md", "高量 II · 散射理论"),
        ("aqm-03-path-density.md", "高量 III · 路径积分与密度矩阵"),
        ("oqs-01-decoherence.md", "开放量子系统 · 退相干与主方程"),
        ("ced-01-boundary.md", "电动力学 I · 边值问题与多极展开"),
        ("ced-02-radiation.md", "电动力学 II · 推迟势与辐射"),
        ("asm-01-phase-transitions.md", "统计进阶 I · 相变与 Landau 理论"),
        ("asm-02-ising.md", "统计进阶 II · Ising 模型"),
        ("asm-03-rg.md", "统计进阶 III · 重整化群入门"),
        ("gr-01-equivalence.md", "广相 I · 等效原理与测地线"),
        ("gr-02-einstein-schwarzschild.md", "广相 II · Einstein 方程与 Schwarzschild"),
        ("gr-03-blackholes-waves.md", "广相 III · 黑洞、引力波与宇宙学度规"),
        ("gr-04-kerr-causal.md", "广相 IV · Kerr 黑洞与因果结构"),
        ("qi-01-qubits.md", "量子信息 I · Qubit、纠缠与 Bell 不等式"),
        ("qi-02-algorithms.md", "量子信息 II · 量子算法"),
        ("qi-03-error-correction.md", "量子信息 III · 量子纠错与 NISQ"),
        ("amo-01-cold-atoms.md", "原子分子光物理 · 激光冷却与量子气体"),
        ("cosmo-01-frw.md", "宇宙学 I · FRW 与 Friedmann 方程"),
        ("cosmo-02-thermal.md", "宇宙学 II · 热历史与 CMB"),
        ("cosmo-03-perturbations-structure.md", "宇宙学 III · 扰动与结构形成"),
        ("cosmo-04-inflation-darkenergy.md", "宇宙学 IV · 暴胀与暗能量"),
    ]),
    ("计算物理", [
        ("comp-01-methods.md", "计算 I · 蒙卡与分子动力学"),
        ("comp-02-dynamics-symplectic.md", "计算 II · 动力系统与辛积分"),
        ("comp-03-pde-fem.md", "计算 III · 偏微分方程与有限元"),
        ("comp-04-monte-carlo-lattice.md", "计算 IV · 格点模型与蒙特卡洛"),
        ("comp-05-inverse-uncertainty.md", "计算 V · 逆问题与不确定度量化"),
    ]),
    ("流体与非线性", [
        ("fl-01-continuum.md", "流体 I · 连续介质与 Navier–Stokes"),
        ("fl-02-viscous.md", "流体 II · 粘性、边界层与阻力"),
        ("fl-03-turbulence.md", "流体 III · 湍流与标度律"),
        ("fl-04-instability.md", "流体 IV · 不稳定性与对流"),
        ("fl-05-chaos.md", "非线性 · 混沌与奇怪吸引子"),
        ("fl-06-plasma-mhd.md", "等离子体 · 磁流体与聚变"),
    ]),
    ("天体物理", [
        ("ap-01-radiative.md", "天体 I · 辐射转移与恒星大气"),
        ("ap-02-stellar-structure.md", "天体 II · 恒星结构与演化"),
        ("ap-03-nucleosynthesis.md", "天体 III · 核合成与元素起源"),
        ("ap-04-compact.md", "天体 IV · 致密天体与简并压"),
        ("ap-05-accretion.md", "天体 V · 吸积、喷流与高能天体"),
        ("ap-06-galaxies.md", "天体 VI · 星系动力学与暗物质"),
    ]),
    ("前沿基础（第二档）", [
        ("qft-01-canonical.md", "场论 I · 经典场与正则量子化"),
        ("qft-02-feynman.md", "场论 II · 相互作用与 Feynman 图"),
        ("qft-03-path-renorm.md", "场论 III · 路径积分与重整化"),
        ("cm-01-second-quant.md", "凝聚态 I · 二次量子化与电子气"),
        ("cm-02-bcs.md", "凝聚态 II · 超导 BCS"),
        ("cm-03-greens-quasiparticles.md", "凝聚态 III · Green 函数与准粒子"),
        ("cm-04-transport-correlations.md", "凝聚态 IV · 强关联与量子输运"),
        ("pp-01-gauge.md", "粒子 I · 规范原理与粒子谱"),
        ("pp-02-electroweak.md", "粒子 II · 电弱统一与 Higgs"),
        ("pp-03-qcd-hadrons.md", "粒子 III · QCD、强子与禁闭"),
        ("pp-04-flavor-neutrinos.md", "粒子 IV · 味、混合与中微子"),
        ("pp-05-colliders-detectors.md", "粒子 V · 对撞机、探测器与事件重建"),
        ("neq-01-fluctuation.md", "非平衡 I · Langevin、线性响应与涨落定理"),
        ("neq-02-kubo-transport.md", "非平衡 II · Kubo 响应与输运"),
        ("neq-03-active-matter.md", "非平衡 III · 活性物质与自组织"),
        ("mb-01-tensor-networks.md", "量子多体 · 张量网络与变分方法"),
    ]),
    ("了望塔（第三档）", [
        ("beyond-01-lookout.md", "了望塔 · 量子引力与超越标准模型"),
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
        nav=build_nav(html_name(md_name), existing), toc_block=toc_block, body=body,
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
    # 图片：把 images/ 源目录整体拷进 site/assets/img/（GPT/matplotlib 生成的插图放这里）
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
        print("待写:", " ".join(m.replace('.md','') for m in missing[:12]), "…" if len(missing) > 12 else "")


if __name__ == "__main__":
    main()
