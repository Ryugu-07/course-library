#!/usr/bin/env python3
"""
计算机讲义库 · 站点生成器（与 ai/comfy/math/grad-math/physics-course 同引擎）

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
LABS = ROOT / "labs"
PROJECTS = ROOT / "projects"
SITE = ROOT / "site"

SITE_TITLE = "计算机讲义库"
SITE_SUBTITLE = "原理 · 亲手实现 · 对标课程"

COURSE = [
    ("总览", [
        ("00-intro.md", "00 · 使用指南与课程地图"),
        ("labs.md", "实验总表 · 上机地图"),
    ]),
    ("理论线", [
        ("algo-01-divide-graph.md", "算法 I · 分治与图算法"),
        ("algo-02-flow-lp.md", "算法 II · 网络流与线性规划"),
        ("algo-03-random-approx.md", "算法 III · 随机化、近似与 NP 归约"),
        ("adv-01-streaming.md", "高级算法 I · 流算法与草图"),
        ("adv-02-spectral-online.md", "高级算法 II · 谱图论与在线算法"),
        ("toc-01-computability.md", "计算理论 I · 自动机与可计算性"),
        ("toc-02-complexity.md", "计算理论 II · 复杂度理论"),
        ("crypto-01-foundations.md", "密码学 I · 对称、公钥与数论基础"),
        ("crypto-02-protocols.md", "密码学 II · 协议、零知识与后量子"),
    ]),
    ("系统线", [
        ("csapp-01-representation.md", "CSAPP I · 机器级表示"),
        ("csapp-02-memory.md", "CSAPP II · 存储层级与缓存"),
        ("csapp-03-linking-ecf.md", "CSAPP III · 链接与异常控制流"),
        ("csapp-04-vm-malloc.md", "CSAPP IV · 虚拟内存与动态内存"),
        ("os-01-process-sched.md", "操作系统 I · 进程、线程与调度"),
        ("os-02-concurrency.md", "操作系统 II · 并发与同步"),
        ("os-03-filesystem.md", "操作系统 III · 文件系统与崩溃一致性"),
        ("net-01-tcpip.md", "网络 I · 分层、TCP/IP 与拥塞控制"),
        ("net-02-application.md", "网络 II · HTTP、TLS 与现代网络"),
        ("db-01-storage-index.md", "数据库 I · 存储与索引"),
        ("db-02-query.md", "数据库 II · 查询执行与优化"),
        ("db-03-transactions.md", "数据库 III · 事务、MVCC 与恢复"),
        ("dist-01-time-consistency.md", "分布式 I · 时钟与一致性模型"),
        ("dist-02-consensus.md", "分布式 II · 共识与 Raft"),
        ("dist-03-transactions-cases.md", "分布式 III · 分布式事务与大系统案例"),
        ("comp-01-parsing.md", "编译 I · 词法与语法分析"),
        ("comp-02-interpreter.md", "编译 II · 语义、类型检查与解释器"),
        ("comp-03-codegen.md", "编译 III · IR、优化与代码生成"),
    ]),
    ("并行与性能线", [
        ("perf-01-engineering.md", "性能 I · 测量、Roofline 与向量化"),
        ("perf-02-cache-practice.md", "性能 II · 缓存优化实战"),
        ("par-01-models.md", "并行 I · 并行模型与缓存一致性"),
        ("par-02-lockfree.md", "并行 II · 同步原语与无锁结构"),
        ("gpu-01-cuda-model.md", "GPU I · CUDA 编程模型"),
        ("gpu-02-optimization.md", "GPU II · 核函数优化阶梯"),
        ("mlsys-01-training.md", "MLSys I · 训练系统与并行策略"),
        ("mlsys-02-inference.md", "MLSys II · 推理系统与算子优化"),
    ]),
    ("语言线", [
        ("pl-01-lambda-types.md", "语言 I · λ 演算与类型系统"),
        ("pl-02-semantics-gc.md", "语言 II · 语义、函数式与垃圾回收"),
        ("py-01-data-model.md", "Python I · 数据模型与惯用法"),
        ("py-02-runtime-gil.md", "Python II · 运行时、GIL 与性能生态"),
        ("cpp-01-abstraction-raii.md", "C++ I · 抽象、RAII 与值/移动语义"),
        ("cpp-02-modern-stl.md", "C++ II · 现代 C++、STL、模板与并发"),
        ("rust-01-ownership.md", "Rust I · 所有权与借用检查"),
        ("rust-02-concurrency.md", "Rust II · 并发、trait 与 unsafe 边界"),
    ]),
    ("工程与全栈线", [
        ("web-01-anatomy.md", "全栈 I · 请求的一生（Medusa 解剖）"),
        ("web-02-backend.md", "全栈 II · 后端工程"),
        ("web-03-frontend.md", "全栈 III · 浏览器与前端工程"),
        ("se-01-git-testing.md", "软工 I · Git 内部原理与测试"),
        ("se-02-cicd-quality.md", "软工 II · CI/CD 与代码质量"),
        ("cloud-01-containers.md", "云 I · 容器与 Docker 原理"),
        ("cloud-02-orchestration.md", "云 II · 编排、K8s 与可观测性"),
        ("sec-01-attacks.md", "安全 I · 系统与 Web 攻防"),
        ("sec-02-engineering.md", "安全 II · 密钥、供应链与安全工程"),
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


def render_project_doc(src_path: Path, build_time: str) -> str:
    """Render project Markdown as a readable site page while keeping sources."""
    relative = src_path.relative_to(PROJECTS)
    nested = len(relative.parts) > 1
    asset_prefix = "../../" if nested else "../"
    site_root = "../../" if nested else "../"
    src = src_path.read_text(encoding="utf-8")
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    body = md.convert(src)

    body = re.sub(r'href="([^"#]+/README)\.md([#"]?)', r'href="\1.html\2', body)
    body = re.sub(r'href="(README|rubric|DESIGN)\.md([#"]?)', r'href="\1.html\2', body)
    body = re.sub(
        r'href="\.\./\.\./lectures/([^"#]+)\.md([#"]?)',
        rf'href="{site_root}\1.html\2',
        body,
    )
    body = re.sub(
        r'href="\.\./\.\./labs/[^"#]+/README\.(?:md|html)([#"]?)',
        rf'href="{site_root}labs.html\1',
        body,
    )

    toc = getattr(md, "toc", "")
    toc_block = ""
    if toc and toc.count("<li>") + toc.count("<li ") >= 3:
        toc_block = f'<details class="page-toc"><summary>本页目录</summary>{toc}</details>'

    heading = next(
        (line.removeprefix("# ").strip() for line in src.splitlines() if line.startswith("# ")),
        src_path.stem,
    )
    if nested:
        nav = (
            '<div class="nav-part"><div class="nav-part-title">课程入口</div><ul>'
            f'<li><a href="{site_root}labs.html">实验总表</a></li>'
            '<li><a href="../index.html">大项目索引</a></li>'
            '<li><a href="README.html">项目说明</a></li>'
            '<li><a href="rubric.html">评分细则</a></li>'
            '<li><a href="DESIGN.html">设计报告模板</a></li>'
            '</ul></div>'
        )
    else:
        nav = (
            '<div class="nav-part"><div class="nav-part-title">课程入口</div><ul>'
            f'<li><a href="{site_root}labs.html">实验总表</a></li>'
            f'<li><a href="{site_root}index.html">课程地图</a></li>'
            '</ul></div>'
        )

    page = PAGE_TMPL.format(
        title=html.escape(heading),
        site_title="CS 大项目",
        site_subtitle="教师版说明书 · starter · acceptance",
        nav=nav,
        toc_block=toc_block,
        body=body,
        prev_link='<span class="pager-slot prev"></span>',
        next_link='<span class="pager-slot next"></span>',
        build_time=build_time,
    )
    page = page.replace('href="assets/', f'href="{asset_prefix}assets/')
    page = page.replace('src="assets/', f'src="{asset_prefix}assets/')
    return page.replace(
        '<a class="site-title" href="index.html">',
        f'<a class="site-title" href="{site_root}index.html">',
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
    # 图片：把 images/ 源目录整体拷进 site/assets/img/（GPT 生成的插图放这里）
    img_src = ROOT / "images"
    if img_src.exists():
        img_dst = SITE / "assets" / "img"
        if img_dst.exists():
            shutil.rmtree(img_dst)
        shutil.copytree(img_src, img_dst)
    # 实验源码同时发布到站点，保证从 labs.html 可直接打开 README 与实现。
    if LABS.exists():
        labs_dst = SITE / "labs"
        if labs_dst.exists():
            shutil.rmtree(labs_dst)
        shutil.copytree(
            LABS,
            labs_dst,
            ignore=shutil.ignore_patterns(
                "build", "target", "__pycache__", "*.pyc", "*.out", "*.exe",
            ),
        )
    # 大项目作业包与站点同步发布，学生可从总表进入 README、starter 与验收工具。
    if PROJECTS.exists():
        projects_dst = SITE / "projects"
        if projects_dst.exists():
            shutil.rmtree(projects_dst)
        shutil.copytree(
            PROJECTS,
            projects_dst,
            ignore=shutil.ignore_patterns(
                "build", "target", "__pycache__", "*.pyc", "*.out", "*.exe",
            ),
        )
    write_pygments_css()

    build_time = time.strftime("%Y-%m-%d %H:%M")
    if PROJECTS.exists():
        project_docs = [PROJECTS / "README.md"]
        for project_dir in sorted(path for path in PROJECTS.iterdir() if path.is_dir()):
            project_docs.extend(
                path for name in ("README.md", "rubric.md", "DESIGN.md")
                if (path := project_dir / name).exists()
            )
        for src_path in project_docs:
            relative = src_path.relative_to(PROJECTS).with_suffix(".html")
            if relative == Path("README.html"):
                relative = Path("index.html")
            out = SITE / "projects" / relative
            out.write_text(render_project_doc(src_path, build_time), encoding="utf-8")

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
