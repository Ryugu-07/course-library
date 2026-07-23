#!/usr/bin/env python3
"""
计算机讲义库插图生成器。

产物直接写入 images/，由 build_site.py 自动复制到 site/assets/img/。
图形保持浅色、白底、教科书风格，方便在亮/暗主题中共用。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from html import escape
from math import exp, log2
from pathlib import Path
from textwrap import wrap


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"

W = 960
H = 540

BLUE = "#2f6395"
BLUE_2 = "#8fb8e0"
BLUE_3 = "#dcebf8"
GREEN = "#4f9d69"
GREEN_2 = "#dff1e6"
ORANGE = "#d28a25"
ORANGE_2 = "#fff0d6"
RED = "#c65a5a"
RED_2 = "#f7dddd"
INK = "#333333"
MUTED = "#6b7280"
GRID = "#d9e1ea"
PANEL = "#f7fafc"
WHITE = "#ffffff"


def attrs(**kwargs: object) -> str:
    parts = []
    for key, value in kwargs.items():
        if value is None:
            continue
        key = key.rstrip("_").replace("_", "-")
        parts.append(f'{key}="{escape(str(value), quote=True)}"')
    return " ".join(parts)


@dataclass
class SVG:
    title: str
    width: int = W
    height: int = H
    parts: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.parts.append(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.width} {self.height}" '
            'font-family="-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Hiragino Sans GB\','
            '\'Microsoft YaHei\',Arial,sans-serif">'
        )
        self.parts.append("<defs>")
        self.parts.append(
            '<marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" '
            'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#2f6395"/></marker>'
        )
        self.parts.append(
            '<marker id="arrow-gray" markerWidth="10" markerHeight="10" refX="8" refY="5" '
            'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/></marker>'
        )
        self.parts.append(
            '<marker id="arrow-red" markerWidth="10" markerHeight="10" refX="8" refY="5" '
            'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#c65a5a"/></marker>'
        )
        self.parts.append("</defs>")
        self.rect(0, 0, self.width, self.height, fill=WHITE)
        self.text(38, 46, self.title, size=25, weight=700, fill=INK)
        self.line(38, 65, self.width - 38, 65, stroke=GRID, width=2)

    def add(self, raw: str) -> None:
        self.parts.append(raw)

    def rect(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        *,
        fill: str = PANEL,
        stroke: str = GRID,
        width: float = 1.5,
        rx: float = 8,
        opacity: float | None = None,
        dash: str | None = None,
    ) -> None:
        self.add(
            f"<rect {attrs(x=x, y=y, width=w, height=h, rx=rx, fill=fill, stroke=stroke, stroke_width=width, opacity=opacity, stroke_dasharray=dash)}/>"
        )

    def circle(
        self,
        x: float,
        y: float,
        r: float,
        *,
        fill: str = WHITE,
        stroke: str = BLUE,
        width: float = 2,
        opacity: float | None = None,
    ) -> None:
        self.add(
            f"<circle {attrs(cx=x, cy=y, r=r, fill=fill, stroke=stroke, stroke_width=width, opacity=opacity)}/>"
        )

    def ellipse(
        self,
        x: float,
        y: float,
        rx: float,
        ry: float,
        *,
        fill: str = WHITE,
        stroke: str = BLUE,
        width: float = 2,
        opacity: float | None = None,
    ) -> None:
        self.add(
            f"<ellipse {attrs(cx=x, cy=y, rx=rx, ry=ry, fill=fill, stroke=stroke, stroke_width=width, opacity=opacity)}/>"
        )

    def line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        *,
        stroke: str = MUTED,
        width: float = 2,
        dash: str | None = None,
        arrow: str | None = None,
        opacity: float | None = None,
    ) -> None:
        marker = f"url(#{arrow})" if arrow else None
        self.add(
            f"<line {attrs(x1=x1, y1=y1, x2=x2, y2=y2, stroke=stroke, stroke_width=width, stroke_dasharray=dash, marker_end=marker, opacity=opacity)}/>"
        )

    def path(
        self,
        d: str,
        *,
        fill: str = "none",
        stroke: str = BLUE,
        width: float = 2,
        dash: str | None = None,
        arrow: str | None = None,
        opacity: float | None = None,
    ) -> None:
        marker = f"url(#{arrow})" if arrow else None
        self.add(
            f"<path {attrs(d=d, fill=fill, stroke=stroke, stroke_width=width, stroke_dasharray=dash, marker_end=marker, opacity=opacity)}/>"
        )

    def polyline(
        self,
        pts: list[tuple[float, float]],
        *,
        fill: str = "none",
        stroke: str = BLUE,
        width: float = 2.5,
        dash: str | None = None,
    ) -> None:
        point_s = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.add(f"<polyline {attrs(points=point_s, fill=fill, stroke=stroke, stroke_width=width, stroke_dasharray=dash)}/>")

    def polygon(
        self,
        pts: list[tuple[float, float]],
        *,
        fill: str = PANEL,
        stroke: str = GRID,
        width: float = 1.5,
        opacity: float | None = None,
    ) -> None:
        point_s = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.add(f"<polygon {attrs(points=point_s, fill=fill, stroke=stroke, stroke_width=width, opacity=opacity)}/>")

    def text(
        self,
        x: float,
        y: float,
        content: str,
        *,
        size: float = 16,
        fill: str = INK,
        anchor: str = "start",
        weight: int | str = 400,
        family: str | None = None,
        opacity: float | None = None,
    ) -> None:
        self.add(
            f"<text {attrs(x=x, y=y, font_size=size, fill=fill, text_anchor=anchor, font_weight=weight, font_family=family, opacity=opacity)}>"
            f"{escape(content)}</text>"
        )

    def multiline(
        self,
        x: float,
        y: float,
        content: str,
        *,
        size: float = 15,
        fill: str = INK,
        anchor: str = "start",
        weight: int | str = 400,
        max_chars: int = 18,
        line_gap: float = 20,
    ) -> None:
        lines = []
        for part in content.split("\n"):
            lines.extend(wrap(part, max_chars, break_long_words=False) or [""])
        for i, line in enumerate(lines):
            self.text(x, y + i * line_gap, line, size=size, fill=fill, anchor=anchor, weight=weight)

    def box(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        label: str,
        *,
        fill: str = PANEL,
        stroke: str = BLUE_2,
        title_size: float = 16,
        sub: str | None = None,
        icon: str | None = None,
    ) -> None:
        self.rect(x, y, w, h, fill=fill, stroke=stroke, rx=10)
        tx = x + w / 2
        if icon:
            self.text(x + 18, y + h / 2 + 7, icon, size=25, fill=stroke, anchor="middle", weight=700)
            tx = x + w / 2 + 12
        self.multiline(tx, y + h / 2 - (8 if sub else -5), label, size=title_size, anchor="middle", weight=700, max_chars=13)
        if sub:
            self.multiline(tx, y + h / 2 + 22, sub, size=12.5, fill=MUTED, anchor="middle", max_chars=18, line_gap=16)

    def footer(self, note: str | None = None) -> None:
        if note:
            self.text(self.width - 38, self.height - 22, note, size=12.5, fill=MUTED, anchor="end")

    def finish(self) -> str:
        self.parts.append("</svg>\n")
        return "\n".join(self.parts)


def save(name: str, svg: SVG) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(svg.finish(), encoding="utf-8")


def draw_node(svg: SVG, x: float, y: float, label: str, *, fill: str = WHITE, stroke: str = BLUE, r: float = 22) -> None:
    svg.circle(x, y, r, fill=fill, stroke=stroke, width=2.4)
    svg.text(x, y + 6, label, size=15, fill=INK, anchor="middle", weight=700)


def draw_badge(svg: SVG, x: float, y: float, label: str, *, fill: str = BLUE_3, stroke: str = BLUE) -> None:
    svg.rect(x, y, 118, 28, fill=fill, stroke=stroke, width=1.2, rx=14)
    svg.text(x + 59, y + 19, label, size=13, fill=INK, anchor="middle", weight=700)


def fig_algo_01_recursion_tree() -> None:
    svg = SVG("主定理递归树：三种成本形状")
    panels = [
        (52, "叶子重", GREEN, "f(n) 小于叶子总量"),
        (348, "等重", BLUE, "每层成本近似相等"),
        (644, "根重", ORANGE, "根节点成本主导"),
    ]
    for x0, title, color, subtitle in panels:
        svg.rect(x0, 92, 264, 390, fill=PANEL, stroke=GRID)
        svg.text(x0 + 132, 124, title, size=19, fill=color, anchor="middle", weight=700)
        svg.text(x0 + 132, 149, subtitle, size=13, fill=MUTED, anchor="middle")
        levels = [
            [(x0 + 132, 195, "n")],
            [(x0 + 92, 265, "n/b"), (x0 + 172, 265, "n/b")],
            [(x0 + 62, 342, ""), (x0 + 112, 342, ""), (x0 + 152, 342, ""), (x0 + 202, 342, "")],
        ]
        for parent in levels[0]:
            for child in levels[1]:
                svg.line(parent[0], parent[1] + 16, child[0], child[1] - 16, stroke=GRID, width=2)
        for parent, children in zip(levels[1], [levels[2][:2], levels[2][2:]]):
            for child in children:
                svg.line(parent[0], parent[1] + 16, child[0], child[1] - 12, stroke=GRID, width=2)
        max_r = {"叶子重": [17, 19, 24], "等重": [20, 20, 20], "根重": [27, 20, 14]}[title]
        for i, level in enumerate(levels):
            for x, y, lab in level:
                svg.circle(x, y, max_r[i], fill=WHITE, stroke=color, width=2.5)
                if lab:
                    svg.text(x, y + 5, lab, size=12.5, anchor="middle", fill=INK, weight=700)
        svg.text(x0 + 32, 398, "第 k 层：a^k 个子问题", size=13.5, fill=INK)
        svg.text(x0 + 32, 424, "规模：n / b^k", size=13.5, fill=INK)
        svg.text(x0 + 32, 450, "叶层：n^(log_b a)", size=13.5, fill=MUTED)
    svg.footer("颜色表示每层总成本的相对重量")
    save("algo-01-recursion-tree.svg", svg)


def fig_algo_01_dfs_bfs() -> None:
    svg = SVG("DFS 与 BFS：访问顺序的差别")
    panels = [(55, "DFS：栈，先深入再回溯", BLUE), (505, "BFS：队列，按层扩展", GREEN)]
    base_nodes = {
        "A": (120, 160),
        "B": (70, 250),
        "C": (170, 250),
        "D": (45, 345),
        "E": (105, 345),
        "F": (205, 345),
        "G": (275, 345),
    }
    edges = [("A", "B"), ("A", "C"), ("B", "D"), ("B", "E"), ("C", "F"), ("C", "G"), ("E", "F")]
    orders = {
        "DFS：栈，先深入再回溯": ["A", "B", "D", "E", "F", "C", "G"],
        "BFS：队列，按层扩展": ["A", "B", "C", "D", "E", "F", "G"],
    }
    for x0, label, color in panels:
        svg.rect(x0, 95, 400, 385, fill=PANEL, stroke=GRID)
        svg.text(x0 + 200, 126, label, size=18, fill=color, anchor="middle", weight=700)
        order = orders[label]
        rank = {name: i + 1 for i, name in enumerate(order)}
        for a, b in edges:
            ax, ay = base_nodes[a]
            bx, by = base_nodes[b]
            svg.line(x0 + ax, ay, x0 + bx, by, stroke="#b8c5d1", width=2)
        for n, (nx, ny) in base_nodes.items():
            draw_node(svg, x0 + nx, ny, n, fill=WHITE, stroke=color)
            svg.circle(x0 + nx + 23, ny - 21, 10, fill=color, stroke=WHITE, width=1)
            svg.text(x0 + nx + 23, ny - 17, str(rank[n]), size=11, fill=WHITE, anchor="middle", weight=700)
        if "DFS" in label:
            flow = ["push A", "pop A → push C,B", "沿 B-D 深入", "回溯到 C-G"]
            icon = "栈"
        else:
            flow = ["enqueue A", "A 出队，B/C 入队", "先清完第 1 层", "再访问 D/E/F/G"]
            icon = "队列"
        svg.box(x0 + 260, 172, 142, 80, icon, fill=WHITE, stroke=color, title_size=17, sub="frontier")
        for i, txt in enumerate(flow):
            svg.text(x0 + 260, 285 + i * 26, txt, size=12.5, fill=MUTED)
    svg.footer("同一张图结构不同，差别只来自 frontier 的数据结构")
    save("algo-01-dfs-bfs.svg", svg)


def fig_algo_01_mst_cut() -> None:
    svg = SVG("MST 切割引理：跨切割最小边是安全边")
    svg.rect(48, 92, 864, 388, fill=PANEL, stroke=GRID)
    svg.path("M455,105 C420,165 515,225 440,300 C390,360 460,420 430,470", stroke="#a8b3bf", width=3, dash="9 8")
    svg.text(225, 124, "S", size=22, fill=BLUE, anchor="middle", weight=700)
    svg.text(680, 124, "V - S", size=22, fill=ORANGE, anchor="middle", weight=700)
    nodes = {
        "a": (160, 195),
        "b": (290, 250),
        "c": (185, 375),
        "d": (600, 190),
        "e": (755, 255),
        "f": (650, 390),
    }
    edges = [
        ("a", "b", 4, BLUE_2),
        ("b", "c", 6, BLUE_2),
        ("d", "e", 3, ORANGE),
        ("e", "f", 7, ORANGE),
        ("b", "d", 2, GREEN),
        ("a", "d", 8, MUTED),
        ("c", "f", 5, MUTED),
        ("b", "f", 9, MUTED),
    ]
    for u, v, w, color in edges:
        x1, y1 = nodes[u]
        x2, y2 = nodes[v]
        thick = 5 if (u, v) == ("b", "d") else 2.5
        svg.line(x1, y1, x2, y2, stroke=color, width=thick)
        svg.rect((x1 + x2) / 2 - 14, (y1 + y2) / 2 - 13, 28, 22, fill=WHITE, stroke="none", width=0, rx=5)
        svg.text((x1 + x2) / 2, (y1 + y2) / 2 + 4, str(w), size=13, fill=INK, anchor="middle", weight=700)
    for name, (x, y) in nodes.items():
        draw_node(svg, x, y, name, stroke=BLUE if x < 455 else ORANGE)
    draw_badge(svg, 482, 318, "最小跨割边", fill=GREEN_2, stroke=GREEN)
    svg.line(530, 318, 430, 243, stroke=GREEN, width=2.5, arrow="arrow-blue")
    svg.text(83, 446, "交换论证：若某棵 MST 没选这条最轻跨割边，加入它会形成环；环上另有一条跨割边可删，权重不增。", size=14, fill=MUTED)
    save("algo-01-mst-cut.svg", svg)


def fig_algo_02_flow_cut() -> None:
    svg = SVG("流网络与 s-t 割")
    svg.rect(48, 92, 864, 388, fill=PANEL, stroke=GRID)
    svg.path("M470,98 C420,175 515,248 455,326 C425,370 470,420 448,475", stroke=RED, width=3, dash="10 8")
    svg.text(365, 130, "S 集合", size=18, fill=BLUE, anchor="middle", weight=700)
    svg.text(605, 130, "T 集合", size=18, fill=ORANGE, anchor="middle", weight=700)
    nodes = {
        "s": (105, 285),
        "u": (310, 190),
        "v": (315, 382),
        "x": (620, 190),
        "y": (620, 382),
        "t": (835, 285),
    }
    edges = [
        ("s", "u", "10", BLUE),
        ("s", "v", "8", BLUE),
        ("u", "v", "2", MUTED),
        ("u", "x", "5", RED),
        ("u", "y", "4", RED),
        ("v", "y", "6", RED),
        ("x", "t", "7", ORANGE),
        ("y", "t", "9", ORANGE),
        ("x", "y", "3", MUTED),
    ]
    for a, b, cap, color in edges:
        x1, y1 = nodes[a]
        x2, y2 = nodes[b]
        arrow = "arrow-red" if color == RED else "arrow-blue"
        svg.line(x1 + 20, y1, x2 - 20, y2, stroke=color, width=3 if color == RED else 2.2, arrow=arrow)
        svg.rect((x1 + x2) / 2 - 24, (y1 + y2) / 2 - 15, 48, 24, fill=WHITE, stroke=color if color == RED else GRID, width=1, rx=6)
        svg.text((x1 + x2) / 2, (y1 + y2) / 2 + 3, f"c={cap}", size=12.5, fill=INK, anchor="middle")
    for n, (x, y) in nodes.items():
        draw_node(svg, x, y, n, stroke=BLUE if x < 470 else ORANGE, r=25)
    svg.rect(520, 430, 310, 48, fill=RED_2, stroke=RED, rx=10)
    svg.text(675, 460, "割容量 = 5 + 4 + 6 = 15", size=16, fill=INK, anchor="middle", weight=700)
    save("algo-02-flow-cut.svg", svg)


def fig_algo_02_residual_augment() -> None:
    svg = SVG("残量网络与增广路")
    svg.rect(48, 95, 390, 372, fill=PANEL, stroke=GRID)
    svg.rect(522, 95, 390, 372, fill=PANEL, stroke=GRID)
    svg.text(243, 127, "当前流 f / 容量 c", size=17, fill=BLUE, anchor="middle", weight=700)
    svg.text(717, 127, "残量边：正向剩余 + 反向撤销", size=17, fill=GREEN, anchor="middle", weight=700)
    nodes_l = {"s": (100, 282), "a": (245, 190), "b": (245, 375), "t": (390, 282)}
    edges_l = [
        ("s", "a", "6/10"),
        ("s", "b", "3/8"),
        ("a", "b", "1/4"),
        ("a", "t", "5/7"),
        ("b", "t", "4/9"),
    ]
    for a, b, lab in edges_l:
        x1, y1 = nodes_l[a]
        x2, y2 = nodes_l[b]
        svg.line(x1 + 18, y1, x2 - 18, y2, stroke=BLUE, width=2.5, arrow="arrow-blue")
        svg.rect((x1 + x2) / 2 - 25, (y1 + y2) / 2 - 15, 50, 24, fill=WHITE, stroke=GRID, rx=5)
        svg.text((x1 + x2) / 2, (y1 + y2) / 2 + 4, lab, size=12, fill=INK, anchor="middle")
    for n, (x, y) in nodes_l.items():
        draw_node(svg, x, y, n)

    nodes_r = {"s": (575, 282), "a": (720, 190), "b": (720, 375), "t": (865, 282)}
    edges_r = [
        ("s", "a", "4", BLUE, 0),
        ("a", "s", "6", MUTED, -16),
        ("s", "b", "5", BLUE, 0),
        ("a", "t", "2", BLUE, 0),
        ("b", "t", "5", BLUE, 0),
        ("t", "b", "4", MUTED, 16),
        ("a", "b", "3", GREEN, 0),
        ("b", "a", "1", MUTED, 18),
    ]
    for a, b, lab, color, off in edges_r:
        x1, y1 = nodes_r[a]
        x2, y2 = nodes_r[b]
        if off:
            dx, dy = y2 - y1, x1 - x2
            mag = max((dx * dx + dy * dy) ** 0.5, 1)
            dx, dy = dx / mag * off, dy / mag * off
        else:
            dx = dy = 0
        svg.line(x1 + dx, y1 + dy, x2 + dx, y2 + dy, stroke=color, width=2.2, arrow="arrow-blue" if color != MUTED else "arrow-gray")
        svg.text((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy - 8, lab, size=12.5, fill=color, anchor="middle", weight=700)
    for n, (x, y) in nodes_r.items():
        draw_node(svg, x, y, n, stroke=GREEN)
    svg.path("M575,282 C630,205 655,176 720,190 C785,204 812,245 865,282", stroke=RED, width=5, arrow="arrow-red")
    svg.text(657, 450, "增广路 s → a → t，瓶颈 = min(4,2) = 2", size=14, fill=RED, weight=700)
    save("algo-02-residual-augment.svg", svg)


def fig_algo_02_matching_reduction() -> None:
    svg = SVG("二分图匹配 → 单位容量最大流")
    svg.rect(48, 92, 864, 388, fill=PANEL, stroke=GRID)
    left = [(290, 160, "u1"), (290, 255, "u2"), (290, 350, "u3")]
    right = [(625, 155, "v1"), (625, 250, "v2"), (625, 345, "v3")]
    source = (105, 255, "s")
    sink = (850, 255, "t")
    for x, y, lab in left:
        svg.line(source[0] + 25, source[1], x - 25, y, stroke=BLUE, arrow="arrow-blue")
        svg.text((source[0] + x) / 2, (source[1] + y) / 2 - 9, "1", size=12, fill=BLUE, anchor="middle", weight=700)
    for x, y, lab in right:
        svg.line(x + 25, y, sink[0] - 25, sink[1], stroke=BLUE, arrow="arrow-blue")
        svg.text((sink[0] + x) / 2, (sink[1] + y) / 2 - 9, "1", size=12, fill=BLUE, anchor="middle", weight=700)
    bip = [(left[0], right[0]), (left[0], right[2]), (left[1], right[0]), (left[1], right[1]), (left[2], right[1]), (left[2], right[2])]
    chosen = {(left[0][2], right[2][2]), (left[1][2], right[0][2]), (left[2][2], right[1][2])}
    for u, v in bip:
        color = GREEN if (u[2], v[2]) in chosen else "#b8c5d1"
        svg.line(u[0] + 25, u[1], v[0] - 25, v[1], stroke=color, width=4 if color == GREEN else 2.2, arrow="arrow-blue")
        svg.text((u[0] + v[0]) / 2, (u[1] + v[1]) / 2 - 6, "1", size=12, fill=color, anchor="middle", weight=700)
    draw_node(svg, *source[:2], source[2], stroke=BLUE, r=26)
    draw_node(svg, *sink[:2], sink[2], stroke=BLUE, r=26)
    for x, y, lab in left:
        draw_node(svg, x, y, lab, stroke=BLUE)
    for x, y, lab in right:
        draw_node(svg, x, y, lab, stroke=ORANGE)
    svg.text(290, 112, "左部 U", size=16, fill=BLUE, anchor="middle", weight=700)
    svg.text(625, 112, "右部 V", size=16, fill=ORANGE, anchor="middle", weight=700)
    svg.box(337, 430, 292, 42, "每条 s-t 单位流 = 一条匹配边", fill=GREEN_2, stroke=GREEN, title_size=15)
    save("algo-02-matching-reduction.svg", svg)


def fig_algo_03_concentration() -> None:
    svg = SVG("尾概率界对比：Markov / Chebyshev / Chernoff")
    x0, y0, w, h = 105, 430, 740, 300
    svg.rect(70, 90, 830, 390, fill=PANEL, stroke=GRID)
    svg.line(x0, y0, x0 + w, y0, stroke=INK, width=2, arrow="arrow-gray")
    svg.line(x0, y0, x0, y0 - h, stroke=INK, width=2, arrow="arrow-gray")
    for i in range(1, 8):
        x = x0 + i * w / 8
        svg.line(x, y0, x, y0 - h, stroke=GRID, width=1)
        svg.text(x, y0 + 24, str(i), size=12, fill=MUTED, anchor="middle")
    for j, lab in enumerate(["1", "0.1", "0.01"]):
        y = y0 - j * h / 2
        svg.line(x0, y, x0 + w, y, stroke=GRID, width=1)
        svg.text(x0 - 18, y + 4, lab, size=12, fill=MUTED, anchor="end")

    def map_pt(t: float, p: float) -> tuple[float, float]:
        x = x0 + (t - 1) / 7 * w
        # 手动画在 log-like 轴上，让指数界的收紧更直观。
        p = max(min(p, 1), 0.004)
        y = y0 - (-log2(p) / -log2(0.004)) * h
        return x, y

    ts = [1 + i * 7 / 120 for i in range(121)]
    curves = [
        ("Markov ≤ 1/t", [map_pt(t, 1 / t) for t in ts], RED),
        ("Chebyshev ≤ 1/t²", [map_pt(t, 1 / (t * t)) for t in ts], ORANGE),
        ("Chernoff ≤ exp(-t)", [map_pt(t, exp(-t)) for t in ts], BLUE),
    ]
    for label, pts, color in curves:
        svg.polyline(pts, stroke=color, width=3)
    for i, (label, _, color) in enumerate(curves):
        y = 126 + i * 34
        svg.line(650, y, 705, y, stroke=color, width=4)
        svg.text(720, y + 5, label, size=14, fill=INK)
    svg.text(x0 + w / 2, 492, "偏离尺度 t", size=14, fill=INK, anchor="middle", weight=700)
    svg.text(52, 252, "尾概率上界", size=14, fill=INK, anchor="middle", weight=700)
    svg.text(515, 246, "指数型界在独立和场景中收紧最快", size=15, fill=BLUE, weight=700)
    save("algo-03-concentration.svg", svg)


def fig_algo_03_np_reduction_tree() -> None:
    svg = SVG("NP 归约链：把一个难题翻译成另一个")
    levels = [
        [("SAT", 430, 105)],
        [("3SAT", 430, 180)],
        [("团 CLIQUE", 235, 270), ("独立集 IS", 430, 270), ("顶点覆盖 VC", 625, 270)],
        [("哈密顿回路", 305, 365), ("图着色", 555, 365)],
        [("TSP", 305, 455), ("子集和", 555, 455)],
    ]
    for lev in levels:
        for label, x, y in lev:
            color = BLUE if label in {"SAT", "3SAT"} else ORANGE if "顶点" in label or "图" in label else GREEN
            svg.box(x - 72, y - 25, 144, 50, label, fill=WHITE, stroke=color, title_size=15)
    arrows = [
        ((430, 130), (430, 155)),
        ((430, 205), (235, 245)),
        ((430, 205), (430, 245)),
        ((430, 205), (625, 245)),
        ((235, 295), (305, 340)),
        ((625, 295), (555, 340)),
        ((305, 390), (305, 430)),
        ((555, 390), (555, 430)),
        ((430, 295), (625, 295)),
    ]
    for (x1, y1), (x2, y2) in arrows:
        svg.line(x1, y1, x2, y2, stroke=BLUE, width=2.3, arrow="arrow-blue")
    svg.rect(68, 392, 220, 82, fill=BLUE_3, stroke=BLUE, rx=10)
    svg.multiline(84, 423, "A ≤p B：若能快速解 B，就能快速解 A", size=14, fill=INK, max_chars=18, line_gap=20)
    svg.text(700, 444, "箭头方向 = 归约方向", size=15, fill=MUTED)
    save("algo-03-np-reduction-tree.svg", svg)


def fig_algo_03_vertex_cover() -> None:
    svg = SVG("顶点覆盖 2-近似：取匹配边两端")
    svg.rect(52, 94, 856, 380, fill=PANEL, stroke=GRID)
    nodes = {
        "a": (145, 170),
        "b": (295, 170),
        "c": (215, 300),
        "d": (430, 250),
        "e": (600, 160),
        "f": (745, 250),
        "g": (610, 375),
    }
    edges = [("a", "b"), ("a", "c"), ("b", "c"), ("c", "d"), ("d", "e"), ("d", "g"), ("e", "f"), ("f", "g"), ("e", "g")]
    matching = {("a", "b"), ("d", "g"), ("e", "f")}
    selected = {"a", "b", "d", "g", "e", "f"}
    for u, v in edges:
        color = GREEN if (u, v) in matching or (v, u) in matching else "#b8c5d1"
        svg.line(*nodes[u], *nodes[v], stroke=color, width=5 if color == GREEN else 2.3)
    for n, (x, y) in nodes.items():
        draw_node(svg, x, y, n, fill=GREEN_2 if n in selected else WHITE, stroke=GREEN if n in selected else BLUE)
    draw_badge(svg, 95, 414, "最大匹配 M", fill=GREEN_2, stroke=GREEN)
    svg.text(245, 433, "|OPT| ≥ |M|，算法选 2|M| 个端点 ⇒ ≤ 2OPT", size=16, fill=INK, weight=700)
    svg.text(560, 116, "被选端点覆盖所有匹配边；继续删掉相邻边直到没有边", size=14, fill=MUTED)
    save("algo-03-vertex-cover-2approx.svg", svg)


def fig_adv_01_count_min() -> None:
    svg = SVG("Count-Min Sketch：多行哈希计数")
    svg.rect(52, 92, 856, 390, fill=PANEL, stroke=GRID)
    svg.box(86, 218, 118, 64, "元素 x", fill=WHITE, stroke=BLUE, title_size=19, sub="到来一次")
    rows, cols = 4, 8
    x0, y0 = 365, 140
    cell_w, cell_h = 54, 52
    hits = [2, 6, 4, 1]
    for r in range(rows):
        svg.text(x0 - 42, y0 + r * cell_h + 32, f"h{r+1}", size=14, fill=BLUE, anchor="middle", weight=700)
        for c in range(cols):
            fill = BLUE_3 if c == hits[r] else WHITE
            stroke = BLUE if c == hits[r] else "#cfd8e3"
            svg.rect(x0 + c * cell_w, y0 + r * cell_h, cell_w, cell_h, fill=fill, stroke=stroke, rx=4)
            val = ["3", "7", "12", "4"][r] if c == hits[r] else ""
            if val:
                svg.text(x0 + c * cell_w + cell_w / 2, y0 + r * cell_h + 32, val, size=16, fill=INK, anchor="middle", weight=700)
    for r, hit in enumerate(hits):
        sx, sy = 204, 250
        tx, ty = x0 + hit * cell_w + cell_w / 2, y0 + r * cell_h + cell_h / 2
        svg.path(f"M{sx},{sy} C260,{145+r*45} 300,{ty} {tx-32},{ty}", stroke=BLUE, width=2, arrow="arrow-blue")
        svg.text(266, 142 + r * 45, "+1", size=13, fill=BLUE, weight=700)
    svg.box(676, 374, 188, 64, "查询估计", fill=GREEN_2, stroke=GREEN, title_size=17, sub="min(3,7,12,4)=3")
    svg.text(116, 430, "误差只会高估；多行取最小值压低碰撞噪声。", size=15, fill=MUTED)
    save("adv-01-count-min.svg", svg)


def fig_adv_01_hll_minhash() -> None:
    svg = SVG("MinHash / HLL 直觉：最小哈希值反推基数")
    svg.rect(58, 94, 844, 380, fill=PANEL, stroke=GRID)
    x0, y = 130, 278
    x1 = 780
    svg.line(x0, y, x1, y, stroke=INK, width=2, arrow="arrow-gray")
    svg.text(x0, y + 30, "0", size=13, fill=MUTED, anchor="middle")
    svg.text(x1, y + 30, "1", size=13, fill=MUTED, anchor="middle")
    values = [0.08, 0.17, 0.23, 0.34, 0.47, 0.58, 0.72, 0.83]
    for i, v in enumerate(values):
        x = x0 + v * (x1 - x0)
        color = GREEN if i == 0 else BLUE
        svg.line(x, y - 70, x, y + 10, stroke=color, width=2.2)
        svg.circle(x, y - 78, 8, fill=color, stroke=WHITE, width=1.5)
        svg.text(x, y - 92, f"h{i+1}", size=11, fill=color, anchor="middle", weight=700)
    min_x = x0 + values[0] * (x1 - x0)
    svg.path(f"M{min_x},{y-105} C210,122 300,135 382,174", stroke=GREEN, width=2.5, arrow="arrow-blue")
    svg.box(360, 132, 260, 82, "min hash 很小", fill=GREEN_2, stroke=GREEN, title_size=17, sub="样本越多，越容易靠近 0")
    svg.box(278, 360, 390, 62, "E[min] ≈ 1/(d+1)  ⇒  d ≈ 1/min - 1", fill=WHITE, stroke=BLUE, title_size=16)
    svg.text(96, 435, "HyperLogLog 使用“前导零最大值”等价地估计哈希落得有多靠前。", size=14, fill=MUTED)
    save("adv-01-hll-minhash.svg", svg)


def fig_adv_01_reservoir() -> None:
    svg = SVG("蓄水池采样：流只看一遍仍保持均匀")
    svg.rect(54, 94, 852, 380, fill=PANEL, stroke=GRID)
    svg.text(95, 155, "数据流", size=17, fill=BLUE, weight=700)
    for i in range(1, 10):
        x = 92 + i * 70
        fill = ORANGE_2 if i == 8 else WHITE
        svg.rect(x, 185, 48, 42, fill=fill, stroke=ORANGE if i == 8 else BLUE_2, rx=7)
        svg.text(x + 24, 211, str(i), size=15, fill=INK, anchor="middle", weight=700)
        if i < 9:
            svg.line(x + 50, 206, x + 68, 206, stroke=BLUE_2, arrow="arrow-blue")
    svg.box(95, 322, 255, 70, "第 i 个元素", fill=ORANGE_2, stroke=ORANGE, title_size=18, sub="以 k/i 概率进入水池")
    slots = [(520, 318), (590, 318), (660, 318)]
    svg.text(590, 295, "reservoir，k = 3", size=16, fill=GREEN, anchor="middle", weight=700)
    for j, (x, y0) in enumerate(slots):
        svg.rect(x, y0, 52, 52, fill=GREEN_2, stroke=GREEN, rx=8)
        svg.text(x + 26, y0 + 32, ["2", "5", "8"][j], size=16, fill=INK, anchor="middle", weight=700)
    svg.path("M350,357 C415,300 465,300 520,342", stroke=ORANGE, width=3, arrow="arrow-red")
    svg.text(725, 346, "若命中：随机替换一个槽", size=15, fill=MUTED)
    save("adv-01-reservoir.svg", svg)


def fig_adv_02_fiedler() -> None:
    svg = SVG("Fiedler 向量：用 λ₂ 的符号切图")
    svg.rect(54, 94, 852, 380, fill=PANEL, stroke=GRID)
    xs = [130 + i * 75 for i in range(8)]
    vals = [-0.72, -0.55, -0.32, -0.08, 0.12, 0.36, 0.57, 0.74]
    y_mid = 260
    for i in range(7):
        svg.line(xs[i], y_mid, xs[i + 1], y_mid, stroke="#b8c5d1", width=3)
    for i, (x, v) in enumerate(zip(xs, vals)):
        color = BLUE if v < 0 else ORANGE
        svg.circle(x, y_mid, 23, fill=BLUE_3 if v < 0 else ORANGE_2, stroke=color, width=2.4)
        svg.text(x, y_mid + 6, str(i + 1), size=13, anchor="middle", weight=700)
        bar_h = abs(v) * 82
        if v < 0:
            svg.rect(x - 10, y_mid + 38, 20, bar_h, fill=BLUE, stroke=BLUE, rx=3)
        else:
            svg.rect(x - 10, y_mid - 38 - bar_h, 20, bar_h, fill=ORANGE, stroke=ORANGE, rx=3)
    svg.line(110, y_mid, 720, y_mid, stroke=MUTED, width=1.3, dash="5 5")
    svg.line(430, 138, 430, 404, stroke=RED, width=2.3, dash="7 7")
    svg.text(405, 124, "按符号二分", size=14, fill=RED, weight=700)
    svg.text(128, 430, "路径图的第二小特征向量沿路径平滑变化；零点附近给出自然切割。", size=14, fill=MUTED)
    spectrum_x, spectrum_y = 720, 145
    svg.text(spectrum_x, spectrum_y - 22, "Laplacian 谱", size=15, fill=INK, weight=700)
    for i, lab in enumerate(["λ₁=0", "λ₂", "λ₃", "…"]):
        h = [18, 52, 78, 105][i]
        svg.rect(spectrum_x + i * 45, spectrum_y + 110 - h, 24, h, fill=BLUE_3 if i != 1 else ORANGE_2, stroke=BLUE if i != 1 else ORANGE, rx=4)
        svg.text(spectrum_x + i * 45 + 12, spectrum_y + 128, lab, size=12, fill=MUTED, anchor="middle")
    save("adv-02-fiedler.svg", svg)


def fig_adv_02_cheeger() -> None:
    svg = SVG("Cheeger 不等式：谱间隙夹住瓶颈")
    svg.rect(54, 94, 852, 380, fill=PANEL, stroke=GRID)
    left = [(155, 190), (220, 155), (235, 230), (165, 272)]
    right = [(430, 180), (500, 155), (520, 230), (450, 282)]
    for group, color in [(left, BLUE), (right, ORANGE)]:
        for i, a in enumerate(group):
            for b in group[i + 1 :]:
                svg.line(*a, *b, stroke="#cfd8e3", width=1.6)
        for idx, (x, y) in enumerate(group):
            draw_node(svg, x, y, "", stroke=color, fill=BLUE_3 if color == BLUE else ORANGE_2, r=17)
    svg.line(left[1][0], left[1][1], right[0][0], right[0][1], stroke=RED, width=4)
    svg.line(left[2][0], left[2][1], right[2][0], right[2][1], stroke=RED, width=4)
    svg.text(320, 142, "少量跨边", size=14, fill=RED, anchor="middle", weight=700)
    svg.box(610, 156, 232, 92, "λ₂/2 ≤ φ ≤ √(2λ₂)", fill=WHITE, stroke=BLUE, title_size=19, sub="谱量 λ₂ 反映最稀疏切割")
    svg.box(602, 305, 248, 70, "λ₂ 小", fill=RED_2, stroke=RED, title_size=17, sub="图容易被切开，存在瓶颈")
    svg.text(100, 418, "Cheeger 把连续的特征值问题和离散的图切割质量联系起来。", size=14, fill=MUTED)
    save("adv-02-cheeger.svg", svg)


def fig_adv_02_ski_rental() -> None:
    svg = SVG("Ski Rental：租到阈值 B 再买，2-竞争")
    svg.rect(72, 92, 824, 385, fill=PANEL, stroke=GRID)
    x0, y0, w, h = 130, 410, 650, 270
    svg.line(x0, y0, x0 + w, y0, stroke=INK, width=2, arrow="arrow-gray")
    svg.line(x0, y0, x0, y0 - h, stroke=INK, width=2, arrow="arrow-gray")
    Bx = x0 + 0.45 * w
    By = y0 - 0.45 * h
    svg.line(Bx, y0, Bx, y0 - h + 15, stroke=MUTED, dash="6 6")
    svg.text(Bx, y0 + 25, "B 天", size=13, fill=MUTED, anchor="middle")
    svg.polyline([(x0, y0), (Bx, By), (x0 + w * 0.88, By)], stroke=BLUE, width=3.5)
    svg.polyline([(x0, y0), (x0 + w * 0.45, y0 - h * 0.45), (x0 + w * 0.88, y0 - h * 0.88)], stroke=RED, width=2.8, dash="6 5")
    svg.line(x0, y0 - h * 0.45, x0 + w * 0.88, y0 - h * 0.45, stroke=GREEN, width=2.8, dash="8 5")
    svg.text(602, 230, "算法：租 B 天后买", size=15, fill=BLUE, weight=700)
    svg.text(602, 264, "总成本 ≤ 2B", size=14, fill=BLUE)
    svg.text(602, 314, "离线最优：min(天数, B)", size=14, fill=GREEN)
    svg.text(602, 358, "一直租：坏例子", size=14, fill=RED)
    svg.text(456, 455, "滑雪天数", size=14, fill=INK, anchor="middle", weight=700)
    svg.text(86, 270, "成本", size=14, fill=INK, anchor="middle", weight=700)
    save("adv-02-ski-rental.svg", svg)


def fig_toc_01_automata_hierarchy() -> None:
    svg = SVG("Chomsky 层级：语言类与机器模型")
    svg.rect(56, 92, 848, 390, fill=PANEL, stroke=GRID)
    svg.ellipse(480, 286, 350, 165, fill="#f5e5e5", stroke=RED, width=2)
    svg.ellipse(480, 295, 260, 125, fill="#fff0d6", stroke=ORANGE, width=2)
    svg.ellipse(480, 305, 170, 86, fill=BLUE_3, stroke=BLUE, width=2)
    svg.text(480, 160, "递归可枚举 RE · 图灵机 TM", size=18, fill=RED, anchor="middle", weight=700)
    svg.text(480, 220, "上下文无关 CFL · 下推自动机 PDA", size=17, fill=ORANGE, anchor="middle", weight=700)
    svg.text(480, 305, "正则语言 · DFA/NFA/Regex", size=17, fill=BLUE, anchor="middle", weight=700)
    svg.text(480, 342, "例：偶数个 1", size=13, fill=MUTED, anchor="middle")
    svg.text(480, 385, "例：括号匹配 / aⁿbⁿ", size=13, fill=MUTED, anchor="middle")
    svg.text(480, 435, "例：可被半判定的问题", size=13, fill=MUTED, anchor="middle")
    svg.box(655, 405, 190, 50, "不可识别语言", fill=WHITE, stroke=MUTED, title_size=15, sub="在 RE 之外")
    svg.text(105, 438, "包含关系：正则 ⊂ CFL ⊂ RE", size=15, fill=INK, weight=700)
    save("toc-01-automata-hierarchy.svg", svg)


def fig_toc_01_halting_diagonal() -> None:
    svg = SVG("停机问题：对角线自指取反")
    svg.rect(54, 94, 852, 380, fill=PANEL, stroke=GRID)
    x0, y0 = 120, 145
    cell = 50
    for i in range(5):
        svg.text(x0 + (i + 1) * cell + cell / 2, y0 - 16, f"M{i+1}", size=13, fill=MUTED, anchor="middle")
        svg.text(x0 - 20, y0 + i * cell + 31, f"M{i+1}", size=13, fill=MUTED, anchor="end")
    for r in range(5):
        for c in range(5):
            fill = RED_2 if r == c else WHITE
            svg.rect(x0 + (c + 1) * cell, y0 + r * cell, cell, cell, fill=fill, stroke="#cfd8e3", rx=2)
            mark = "H" if (r + c) % 2 == 0 else "L"
            svg.text(x0 + (c + 1) * cell + cell / 2, y0 + r * cell + 31, mark, size=13, fill=INK, anchor="middle")
    svg.text(x0 + 180, 430, "假设 H(M,x) 能判断停机/不停机", size=14, fill=MUTED, anchor="middle")
    svg.path("M450,230 C510,215 535,220 585,245", stroke=BLUE, width=3, arrow="arrow-blue")
    svg.box(585, 185, 220, 86, "构造 D(x)", fill=BLUE_3, stroke=BLUE, title_size=18, sub="若 H(x,x) 停机，则 D 故意循环；否则停机")
    svg.path("M695,275 C720,340 665,385 602,370", stroke=RED, width=3, arrow="arrow-red")
    svg.box(572, 350, 248, 68, "问 D(D) 会怎样？", fill=RED_2, stroke=RED, title_size=17, sub="停机 ⇔ 不停机，矛盾")
    save("toc-01-halting-diagonal.svg", svg)


def fig_toc_01_dfa_example() -> None:
    svg = SVG("DFA 示例：二进制数能被 3 整除")
    svg.rect(58, 94, 844, 380, fill=PANEL, stroke=GRID)
    r0, r1, r2 = (270, 270), (520, 170), (520, 370)
    for a, b, lab in [
        (r0, r1, "1"),
        (r1, r0, "1"),
        (r1, r2, "0"),
        (r2, r1, "0"),
        (r2, r2, "1"),
    ]:
        svg.path(f"M{a[0]},{a[1]} C{(a[0]+b[0])/2},{a[1]-80 if a[1]>=b[1] else a[1]+80} {(a[0]+b[0])/2},{b[1]-80 if a[1]>=b[1] else b[1]+80} {b[0]},{b[1]}", stroke=BLUE, width=2.5, arrow="arrow-blue")
        svg.text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 18, lab, size=14, fill=BLUE, anchor="middle", weight=700)
    svg.path("M210,230 C170,165 250,135 290,205", stroke=BLUE, width=2.5, arrow="arrow-blue")
    svg.text(208, 165, "0", size=14, fill=BLUE, anchor="middle", weight=700)
    svg.path("M560,400 C635,435 650,345 575,355", stroke=BLUE, width=2.5, arrow="arrow-blue")
    svg.text(653, 401, "1", size=14, fill=BLUE, anchor="middle", weight=700)
    svg.line(115, 270, 220, 270, stroke=MUTED, width=2.5, arrow="arrow-gray")
    for label, (x, y), sub in [("r0", r0, "余数 0，接受"), ("r1", r1, "余数 1"), ("r2", r2, "余数 2")]:
        svg.circle(x, y, 42, fill=WHITE, stroke=GREEN if label == "r0" else BLUE, width=3)
        if label == "r0":
            svg.circle(x, y, 34, fill="none", stroke=GREEN, width=2)
        svg.text(x, y + 3, label, size=18, fill=INK, anchor="middle", weight=700)
        svg.text(x, y + 26, sub, size=11.5, fill=MUTED, anchor="middle")
    svg.text(120, 440, "读入 bit b 后，新余数 = (2r + b) mod 3。", size=15, fill=MUTED)
    save("toc-01-dfa-example.svg", svg)


def fig_toc_02_complexity_map() -> None:
    svg = SVG("复杂度类地图：已知包含与未知边界")
    boxes = [
        (92, 115, 776, 330, "EXP", RED_2, RED),
        (142, 155, 676, 250, "PSPACE", ORANGE_2, ORANGE),
        (190, 195, 580, 170, "NP", "#eef7ef", GREEN),
    ]
    for x, y, w, h, label, fill, stroke in boxes:
        svg.rect(x, y, w, h, fill=fill, stroke=stroke, rx=18 if label in {"EXP", "PSPACE", "NP"} else 10)
        svg.text(x + 24, y + 30, label, size=19 if label in {"EXP", "PSPACE", "NP", "P"} else 13, fill=stroke, weight=700)
    svg.rect(245, 230, 245, 102, fill=BLUE_3, stroke=BLUE, rx=12)
    svg.text(270, 260, "P", size=19, fill=BLUE, weight=700)
    svg.rect(292, 272, 160, 44, fill=WHITE, stroke=BLUE, rx=10)
    svg.text(316, 300, "NL", size=14, fill=BLUE, weight=700)
    svg.rect(350, 285, 72, 20, fill=WHITE, stroke=BLUE, rx=10)
    svg.text(386, 300, "L", size=12, fill=BLUE, anchor="middle", weight=700)
    svg.rect(525, 225, 145, 82, fill=WHITE, stroke=GREEN, dash="7 6", rx=12)
    svg.text(598, 256, "NPC", size=16, fill=GREEN, anchor="middle", weight=700)
    svg.text(598, 280, "NP 完全", size=12, fill=MUTED, anchor="middle")
    svg.ellipse(505, 285, 135, 62, fill="none", stroke=MUTED, width=2, opacity=0.9)
    svg.text(505, 286, "coNP", size=15, fill=MUTED, anchor="middle", weight=700)
    svg.rect(360, 328, 135, 42, fill=WHITE, stroke=BLUE, dash="6 5", rx=12)
    svg.text(427, 354, "BPP ?", size=15, fill=BLUE, anchor="middle", weight=700)
    svg.text(692, 365, "IP = PSPACE", size=14, fill=ORANGE, anchor="middle", weight=700)
    svg.text(110, 470, "实线是已知包含；虚线/问号表示 P vs NP、NP vs coNP 等关键未知边界。", size=14, fill=MUTED)
    save("toc-02-complexity-map.svg", svg)


def fig_toc_02_verify_vs_solve() -> None:
    svg = SVG("P vs NP 直觉：验证证书 vs 搜索答案")
    svg.rect(54, 94, 852, 380, fill=PANEL, stroke=GRID)
    for x0, title, color in [(92, "验证：给答案后快速检查", GREEN), (535, "求解：从空局面搜索", RED)]:
        svg.rect(x0, 135, 330, 292, fill=WHITE, stroke=color, rx=12)
        svg.text(x0 + 165, 168, title, size=17, fill=color, anchor="middle", weight=700)
        gx, gy = x0 + 75, 195
        for r in range(9):
            for c in range(9):
                fill = GREEN_2 if x0 < 500 and (r + c) % 4 == 0 else WHITE
                svg.rect(gx + c * 20, gy + r * 20, 20, 20, fill=fill, stroke="#cfd8e3", width=1, rx=1)
        if x0 < 500:
            for i, txt in enumerate(["行列宫检查", "每格一次扫描", "证书长度多项式"]):
                svg.text(x0 + 85, 400 + i * 22, f"✓ {txt}", size=13, fill=GREEN)
        else:
            sx, sy = x0 + 115, 385
            for i in range(3):
                svg.line(sx, sy, sx - 55 + i * 55, sy + 35, stroke=RED, arrow="arrow-red")
                svg.circle(sx - 55 + i * 55, sy + 45, 12, fill=RED_2, stroke=RED)
            svg.text(x0 + 80, 405, "分支爆炸", size=13, fill=RED, weight=700)
    svg.text(455, 278, "证书", size=14, fill=BLUE, anchor="middle", weight=700)
    svg.line(424, 278, 522, 278, stroke=BLUE, width=2.5, arrow="arrow-blue")
    save("toc-02-verify-vs-solve.svg", svg)


def fig_crypto_01_dh_exchange() -> None:
    svg = SVG("Diffie-Hellman：公开交换，私下得到同一密钥")
    svg.rect(56, 94, 848, 380, fill=PANEL, stroke=GRID)
    alice_x, bob_x, eve_x = 180, 760, 470
    svg.box(alice_x - 70, 122, 140, 58, "Alice", fill=WHITE, stroke=BLUE, title_size=18, sub="私有 a")
    svg.box(bob_x - 70, 122, 140, 58, "Bob", fill=WHITE, stroke=GREEN, title_size=18, sub="私有 b")
    svg.box(eve_x - 70, 352, 140, 58, "Eve", fill=WHITE, stroke=RED, title_size=18, sub="只看网络")
    svg.line(alice_x, 192, alice_x, 425, stroke=BLUE_2, dash="6 6")
    svg.line(bob_x, 192, bob_x, 425, stroke=GREEN, dash="6 6")
    svg.line(eve_x, 250, eve_x, 342, stroke=RED, dash="6 6")
    svg.box(350, 105, 240, 45, "公开参数：p, g", fill=WHITE, stroke=MUTED, title_size=15)
    svg.line(alice_x, 235, bob_x, 235, stroke=BLUE, width=3, arrow="arrow-blue")
    svg.text(470, 222, "A = g^a mod p", size=14, fill=BLUE, anchor="middle", weight=700)
    svg.line(bob_x, 292, alice_x, 292, stroke=GREEN, width=3, arrow="arrow-blue")
    svg.text(470, 280, "B = g^b mod p", size=14, fill=GREEN, anchor="middle", weight=700)
    svg.text(alice_x, 342, "K = B^a = g^{ab}", size=15, fill=BLUE, anchor="middle", weight=700)
    svg.text(bob_x, 342, "K = A^b = g^{ab}", size=15, fill=GREEN, anchor="middle", weight=700)
    svg.text(eve_x, 430, "看到 p,g,A,B；离散对数难，算不出 a/b/K", size=14, fill=RED, anchor="middle")
    save("crypto-01-dh-exchange.svg", svg)


def fig_crypto_01_sym_vs_pub() -> None:
    svg = SVG("对称密钥 vs 公钥密码")
    for x0, title, color in [(60, "对称加密：同一把钥匙 K", BLUE), (510, "公钥加密：公钥锁，私钥开", GREEN)]:
        svg.rect(x0, 100, 390, 360, fill=PANEL, stroke=GRID)
        svg.text(x0 + 195, 134, title, size=17, fill=color, anchor="middle", weight=700)
        svg.box(x0 + 42, 205, 105, 54, "Alice", fill=WHITE, stroke=color, title_size=16)
        svg.box(x0 + 242, 205, 105, 54, "Bob", fill=WHITE, stroke=color, title_size=16)
        if x0 < 500:
            svg.line(x0 + 150, 232, x0 + 238, 232, stroke=color, width=3, arrow="arrow-blue")
            svg.text(x0 + 195, 214, "K 加密/解密", size=13, fill=color, anchor="middle", weight=700)
            svg.box(x0 + 120, 315, 150, 60, "问题", fill=ORANGE_2, stroke=ORANGE, title_size=16, sub="K 怎么安全分发？")
        else:
            svg.line(x0 + 150, 232, x0 + 238, 232, stroke=color, width=3, arrow="arrow-blue")
            svg.text(x0 + 195, 214, "Bob 公钥加密", size=13, fill=color, anchor="middle", weight=700)
            svg.text(x0 + 292, 292, "Bob 私钥解密", size=13, fill=GREEN, anchor="middle", weight=700)
            svg.box(x0 + 110, 315, 170, 60, "公开钥匙可广播", fill=GREEN_2, stroke=GREEN, title_size=16, sub="私钥不离开 Bob")
    save("crypto-01-sym-vs-pub.svg", svg)


def fig_crypto_01_rsa_flow() -> None:
    svg = SVG("RSA 流程：密钥生成、加密、解密")
    steps = [
        (75, "密钥生成", "选 p,q\nn=pq\nφ=(p-1)(q-1)\n选 e，求 d", BLUE),
        (370, "加密", "公钥 (n,e)\nc = m^e mod n", GREEN),
        (665, "解密", "私钥 d\nm = c^d mod n", ORANGE),
    ]
    for x, title, body, color in steps:
        svg.rect(x, 130, 220, 250, fill=PANEL, stroke=color, rx=12)
        svg.text(x + 110, 166, title, size=18, fill=color, anchor="middle", weight=700)
        svg.multiline(x + 110, 210, body, size=15, fill=INK, anchor="middle", max_chars=16, line_gap=27)
    svg.line(295, 255, 365, 255, stroke=BLUE, width=3, arrow="arrow-blue")
    svg.line(590, 255, 660, 255, stroke=GREEN, width=3, arrow="arrow-blue")
    svg.box(305, 410, 350, 54, "安全直觉：知道 n 很容易，分解 n=pq 很难", fill=RED_2, stroke=RED, title_size=15)
    save("crypto-01-rsa-flow.svg", svg)


def fig_crypto_02_tls_handshake() -> None:
    svg = SVG("TLS 握手：认证后协商对称密钥")
    svg.rect(58, 94, 844, 380, fill=PANEL, stroke=GRID)
    c_x, s_x = 250, 710
    svg.box(c_x - 75, 120, 150, 52, "浏览器", fill=WHITE, stroke=BLUE, title_size=17)
    svg.box(s_x - 75, 120, 150, 52, "服务器", fill=WHITE, stroke=GREEN, title_size=17)
    svg.line(c_x, 180, c_x, 430, stroke=BLUE_2, dash="6 6")
    svg.line(s_x, 180, s_x, 430, stroke=GREEN, dash="6 6")
    msgs = [
        (210, "ClientHello：版本/随机数/套件", BLUE, "→"),
        (255, "ServerHello + 证书 + ECDHE 参数", GREEN, "←"),
        (305, "验证证书链，发送 ECDHE 份额", BLUE, "→"),
        (355, "双方派生同一对称密钥", ORANGE, "↔"),
        (405, "HTTP 数据用 AEAD 对称加密", GREEN, "↔"),
    ]
    for y, text, color, direction in msgs:
        if direction == "←":
            svg.line(s_x - 10, y, c_x + 10, y, stroke=color, width=2.6, arrow="arrow-blue")
        elif direction == "→":
            svg.line(c_x + 10, y, s_x - 10, y, stroke=color, width=2.6, arrow="arrow-blue")
        else:
            svg.line(c_x + 10, y, s_x - 10, y, stroke=color, width=2.6)
            svg.line(s_x - 10, y + 10, c_x + 10, y + 10, stroke=color, width=2.6)
        svg.text(480, y - 8, text, size=13.5, fill=INK, anchor="middle")
    save("crypto-02-tls-handshake.svg", svg)


def fig_crypto_02_pki_chain() -> None:
    svg = SVG("PKI 信任链：从根 CA 到网站证书")
    svg.rect(56, 94, 848, 380, fill=PANEL, stroke=GRID)
    chain = [
        (140, 245, "根 CA", "自签名，预置于系统/浏览器", BLUE),
        (360, 245, "中间 CA", "由根 CA 签名", GREEN),
        (580, 245, "网站证书", "由中间 CA 签名", ORANGE),
        (800, 245, "example.com", "TLS 握手出示", RED),
    ]
    for x, y, title, sub, color in chain:
        svg.box(x - 75, y - 48, 150, 96, title, fill=WHITE, stroke=color, title_size=17, sub=sub)
    for i in range(len(chain) - 1):
        x1, y1 = chain[i][0] + 78, chain[i][1]
        x2, y2 = chain[i + 1][0] - 78, chain[i + 1][1]
        svg.line(x1, y1, x2, y2, stroke=BLUE, width=3, arrow="arrow-blue")
        svg.text((x1 + x2) / 2, y1 - 16, "签名验证", size=12.5, fill=BLUE, anchor="middle", weight=700)
    svg.box(280, 385, 400, 54, "信任不是“相信网站”，而是验证每一级签名是否能连回可信根。", fill=BLUE_3, stroke=BLUE, title_size=14)
    save("crypto-02-pki-chain.svg", svg)


def fig_crypto_02_zk_cave() -> None:
    svg = SVG("零知识洞穴：证明知道秘密，但不泄露秘密")
    svg.rect(56, 94, 848, 380, fill=PANEL, stroke=GRID)
    svg.path("M280,395 C175,330 170,185 300,145 C430,105 485,190 480,270", stroke=BLUE, width=24, opacity=0.28)
    svg.path("M680,395 C785,330 790,185 660,145 C530,105 475,190 480,270", stroke=BLUE, width=24, opacity=0.28)
    svg.path("M480,270 L480,190", stroke=RED, width=12)
    svg.text(480, 180, "秘密门", size=15, fill=RED, anchor="middle", weight=700)
    svg.circle(480, 418, 26, fill=WHITE, stroke=BLUE, width=3)
    svg.text(480, 424, "V", size=17, fill=BLUE, anchor="middle", weight=700)
    svg.text(480, 458, "验证者随机喊：左 / 右", size=14, fill=BLUE, anchor="middle")
    svg.circle(300, 248, 24, fill=GREEN_2, stroke=GREEN, width=3)
    svg.text(300, 254, "P", size=16, fill=GREEN, anchor="middle", weight=700)
    svg.text(300, 286, "证明者", size=13, fill=GREEN, anchor="middle")
    svg.line(480, 395, 340, 282, stroke=GREEN, width=3, arrow="arrow-blue")
    svg.line(480, 395, 620, 282, stroke=GREEN, width=3, arrow="arrow-blue")
    svg.rect(600, 330, 230, 74, fill=GREEN_2, stroke=GREEN, rx=10)
    svg.text(715, 360, "每轮只看到：能按要求出来", size=14, fill=INK, anchor="middle", weight=700)
    svg.text(715, 384, "重复多轮后可信度指数上升", size=12.5, fill=MUTED, anchor="middle")
    svg.text(120, 440, "零知识：相信“你知道”，但拿不到秘密本身。", size=14, fill=MUTED)
    save("crypto-02-zk-cave.svg", svg)


def fig_csapp_02_memory_pyramid() -> None:
    svg = SVG("存储金字塔：速度、容量、成本的权衡")
    tiers = [
        ("寄存器", "≈0.3 ns", "几 KB", "#2f6395", 165),
        ("L1 Cache", "≈1 ns", "32-64 KB", "#4c7faa", 225),
        ("L2/L3 Cache", "≈4-12 ns", "MB 级", "#6fa2cc", 305),
        ("主存 DRAM", "≈100 ns", "GB 级", "#8fb8e0", 390),
        ("SSD / 磁盘", "≈100 µs - ms", "TB 级", "#b7d1ea", 485),
    ]
    cx = 470
    top_y = 112
    tier_h = 66
    max_w = 720
    for i, (name, latency, cap, color, width) in enumerate(tiers):
        y = top_y + i * tier_h
        w = width
        x = cx - w / 2
        next_w = tiers[i + 1][4] if i + 1 < len(tiers) else max_w
        nx = cx - next_w / 2
        pts = [(x, y), (x + w, y), (nx + next_w, y + tier_h - 8), (nx, y + tier_h - 8)]
        svg.polygon(pts, fill=color, stroke=WHITE, width=2)
        svg.text(cx, y + 29, name, size=18, fill=WHITE if i < 3 else INK, anchor="middle", weight=700)
        svg.text(cx, y + 52, f"{latency} · {cap}", size=13.5, fill=WHITE if i < 3 else INK, anchor="middle")
    svg.line(110, 112, 110, 425, stroke=MUTED, width=2, arrow="arrow-gray")
    svg.text(82, 166, "更快", size=14, fill=BLUE, anchor="middle", weight=700)
    svg.text(83, 410, "更大/更便宜", size=14, fill=MUTED, anchor="middle", weight=700)
    svg.path("M705,136 C812,190 815,250 735,312", stroke=RED, width=3, dash="8 6", arrow="arrow-red")
    svg.box(715, 310, 175, 76, "L1 → DRAM", fill=RED_2, stroke=RED, title_size=17, sub="约 100× 延迟断崖")
    svg.text(130, 480, "每一层都是下一层的缓存：命中走上层，未命中才向下取。", size=15, fill=MUTED)
    save("csapp-02-memory-pyramid.svg", svg)


def fig_csapp_02_cache_line() -> None:
    svg = SVG("缓存行：一次读入相邻 64 字节")
    svg.rect(55, 94, 850, 380, fill=PANEL, stroke=GRID)
    x0, y0 = 115, 160
    cell_w, cell_h = 42, 48
    for i in range(16):
        fill = BLUE_3 if 4 <= i <= 9 else WHITE
        svg.rect(x0 + i * cell_w, y0, cell_w, cell_h, fill=fill, stroke=GRID, rx=2)
        svg.text(x0 + i * cell_w + cell_w / 2, y0 + 30, f"i{i}", size=12, anchor="middle", fill=INK)
    svg.rect(x0 + 4 * cell_w, y0 - 14, 6 * cell_w, cell_h + 28, fill="none", stroke=BLUE, width=3, rx=4)
    svg.text(x0 + 7 * cell_w, y0 - 26, "一条 64B cache line（16 个 int）", size=15, fill=BLUE, anchor="middle", weight=700)

    seq_y = 290
    svg.text(115, seq_y - 28, "顺序访问", size=16, fill=GREEN, weight=700)
    for i in range(10):
        x = 200 + i * 42
        svg.rect(x, seq_y, 30, 30, fill=GREEN_2 if i else ORANGE_2, stroke=GREEN if i else ORANGE, rx=4)
        svg.text(x + 15, seq_y + 21, "H" if i else "M", size=12, fill=GREEN if i else ORANGE, anchor="middle", weight=700)
        if i < 9:
            svg.line(x + 32, seq_y + 15, x + 40, seq_y + 15, stroke=GREEN, width=2, arrow="arrow-blue")
    svg.text(660, seq_y + 22, "一次 miss 后连续 hit", size=14, fill=MUTED)

    rand_y = 395
    svg.text(115, rand_y - 28, "随机跳跃", size=16, fill=RED, weight=700)
    for i in range(8):
        x = 210 + i * 62
        svg.rect(x, rand_y, 34, 30, fill=RED_2, stroke=RED, rx=4)
        svg.text(x + 17, rand_y + 21, "M", size=12, fill=RED, anchor="middle", weight=700)
        if i < 7:
            svg.path(f"M{x+36},{rand_y+15} C{x+50},{rand_y-20} {x+75},{rand_y+50} {x+95},{rand_y+15}", stroke=RED, width=1.6, arrow="arrow-red")
    svg.text(720, rand_y + 22, "频繁换行，局部性差", size=14, fill=MUTED)
    save("csapp-02-cache-line.svg", svg)


def fig_csapp_02_matmul_order() -> None:
    svg = SVG("矩阵乘访问顺序：ijk、ikj 与 tiling")
    panel_specs = [(55, "ijk：B 按列跨步", RED), (355, "ikj：B 按行连续", GREEN), (655, "tiling：小块复用", BLUE)]
    for x0, title, color in panel_specs:
        svg.rect(x0, 92, 250, 390, fill=PANEL, stroke=GRID)
        svg.text(x0 + 125, 122, title, size=16, fill=color, anchor="middle", weight=700)
        gx, gy = x0 + 45, 165
        for r in range(6):
            for c in range(6):
                fill = WHITE
                if "ijk" in title and c == 3:
                    fill = RED_2
                if "ikj" in title and r == 2:
                    fill = GREEN_2
                if "tiling" in title and 2 <= r <= 4 and 1 <= c <= 3:
                    fill = BLUE_3
                svg.rect(gx + c * 26, gy + r * 26, 26, 26, fill=fill, stroke="#cfd8e3", rx=1)
        svg.text(gx + 78, gy - 18, "B", size=15, fill=INK, anchor="middle", weight=700)
        if "ijk" in title:
            svg.path(f"M{gx+3*26+13},{gy} L{gx+3*26+13},{gy+156}", stroke=RED, width=4, arrow="arrow-red")
            notes = ["跨步读取", "每次跳一整行", "cache line 利用差"]
        elif "ikj" in title:
            svg.path(f"M{gx},{gy+2*26+13} L{gx+156},{gy+2*26+13}", stroke=GREEN, width=4, arrow="arrow-blue")
            notes = ["顺序扫一行", "邻近元素被复用", "命中率更高"]
        else:
            svg.rect(gx + 26, gy + 52, 78, 78, fill="none", stroke=BLUE, width=4, rx=2)
            notes = ["把小块搬进缓存", "C 小块反复累加", "降低内存流量"]
        for i, note in enumerate(notes):
            svg.text(x0 + 42, 360 + i * 26, f"• {note}", size=14, fill=MUTED)
    save("csapp-02-matmul-order.svg", svg)


FIGURES = [
    fig_algo_01_recursion_tree,
    fig_algo_01_dfs_bfs,
    fig_algo_01_mst_cut,
    fig_algo_02_flow_cut,
    fig_algo_02_residual_augment,
    fig_algo_02_matching_reduction,
    fig_algo_03_concentration,
    fig_algo_03_np_reduction_tree,
    fig_algo_03_vertex_cover,
    fig_adv_01_count_min,
    fig_adv_01_hll_minhash,
    fig_adv_01_reservoir,
    fig_adv_02_fiedler,
    fig_adv_02_cheeger,
    fig_adv_02_ski_rental,
    fig_toc_01_automata_hierarchy,
    fig_toc_01_halting_diagonal,
    fig_toc_01_dfa_example,
    fig_toc_02_complexity_map,
    fig_toc_02_verify_vs_solve,
    fig_crypto_01_dh_exchange,
    fig_crypto_01_sym_vs_pub,
    fig_crypto_01_rsa_flow,
    fig_crypto_02_tls_handshake,
    fig_crypto_02_pki_chain,
    fig_crypto_02_zk_cave,
    fig_csapp_02_memory_pyramid,
    fig_csapp_02_cache_line,
    fig_csapp_02_matmul_order,
]


def main() -> None:
    for make in FIGURES:
        make()
    print(f"generated {len(FIGURES)} figures in {OUT}")


if __name__ == "__main__":
    main()
