#!/usr/bin/env python3
"""Generate the first seven Earth-system visual-atlas plates.

The figures are deliberately teaching schematics: quantities and paths are
chosen to expose a model relationship, not to reproduce a measured map.
"""

from __future__ import annotations

from pathlib import Path

from svgkit import (
    HEIGHT,
    PALETTE,
    WIDTH,
    arrow,
    circle,
    curved_arrow,
    header,
    legend_item,
    line,
    multiline,
    panel,
    path,
    polygon,
    polyline,
    project,
    rect,
    save,
    tag,
    text,
    world_map,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
W = WIDTH
H = HEIGHT

INK = PALETTE["ink"]
MUTED = PALETTE["muted"]
LINE = PALETTE["line"]
GRID = PALETTE["grid"]
PAPER = PALETTE["paper"]
PANEL = PALETTE["panel"]
OCEAN = PALETTE["ocean"]
DEEP = PALETTE["deep_ocean"]
SKY = PALETTE["sky"]
LAND = PALETTE["land"]
FOREST = PALETTE["forest"]
ROCK = PALETTE["rock"]
MANTLE = PALETTE["mantle"]
CORE = PALETTE["core"]
ICE = PALETTE["ice"]
WARM = PALETTE["warm"]
COOL = PALETTE["cool"]
GOLD = PALETTE["gold"]
VIOLET = PALETTE["violet"]


def card(
    x: float,
    y: float,
    width: float,
    height: float,
    lines: list[str],
    *,
    fill: str = PANEL,
    stroke: str = LINE,
    size: float = 15,
    sub_size: float = 12,
) -> str:
    """A compact labelled teaching box with explicit line breaks."""
    pieces = [rect(x, y, width, height, radius=8, fill=fill, stroke=stroke)]
    if len(lines) == 1:
        pieces.append(text(x + width / 2, y + height / 2 + size * 0.34, lines[0], size=size,
                           weight=700, anchor="middle"))
    else:
        title_y = y + height / 2 - (len(lines) - 1) * 8
        pieces.append(multiline(x + width / 2, title_y, lines, size=size, line_height=19,
                                weight=700, anchor="middle"))
    return "".join(pieces)


def callout(
    x: float,
    y: float,
    width: float,
    title: str,
    value: str,
    *,
    fill: str = PAPER,
    stroke: str = LINE,
) -> str:
    pieces = [rect(x, y, width, 58, radius=7, fill=fill, stroke=stroke)]
    pieces.append(text(x + 12, y + 21, title, size=12, fill=MUTED, weight=650))
    pieces.append(text(x + 12, y + 44, value, size=16, weight=750))
    return "".join(pieces)


def legend_box(x: float, y: float, width: float, rows: list[tuple[str, str, bool, bool]]) -> str:
    height = 34 + 23 * len(rows)
    pieces = [rect(x, y, width, height, radius=7, fill=PAPER, stroke=GRID)]
    pieces.append(text(x + 14, y + 22, "图例", size=13, weight=750))
    for index, (label, color, line_only, dashed) in enumerate(rows):
        pieces.append(legend_item(x + 14, y + 49 + index * 23, label, color,
                                  line_only=line_only, dashed=dashed))
    return "".join(pieces)


def schematic_note(x: float, y: float, value: str, *, anchor: str = "start") -> str:
    return text(x, y, value, size=11, fill=MUTED, anchor=anchor)


def scale_bar(x: float, y: float, width: float, label: str) -> str:
    return (
        line(x, y, x + width, y, stroke=INK, stroke_width=2)
        + line(x, y - 5, x, y + 5, stroke=INK, stroke_width=2)
        + line(x + width, y - 5, x + width, y + 5, stroke=INK, stroke_width=2)
        + text(x + width / 2, y + 20, label, size=11, fill=MUTED, anchor="middle")
    )


def dashed_path(d: str, color: str = MUTED, width: float = 2) -> str:
    return path(d, stroke=color, stroke_width=width, dash="7 6")


def colored_marker_defs() -> str:
    """Local marker paints keep arrowheads matched to their colored paths."""
    marker_path = "M0,0 L0,6 L9,3 z"
    cool_marker = tag(
        "marker",
        tag("path", d=marker_path, fill=COOL),
        id="arrow-cool-local",
        marker_width=10,
        marker_height=10,
        ref_x=8,
        ref_y=3,
        orient="auto",
        marker_units="strokeWidth",
    )
    warm_marker = tag(
        "marker",
        tag("path", d=marker_path, fill=WARM),
        id="arrow-warm-local",
        marker_width=10,
        marker_height=10,
        ref_x=8,
        ref_y=3,
        orient="auto",
        marker_units="strokeWidth",
    )
    return tag("defs", cool_marker + warm_marker)


def system_reservoir_map() -> None:
    body = [header("地球系统的储库与边界", "01 · 空间结构 | Reservoir map")]
    body.append(world_map(38, 82, 570, 395, title="全球边界的教学投影"))
    body.append(schematic_note(50, 462, "地图为示意投影；大陆边界与距离非等比例，颜色表示储库类别。"))

    # Reservoir callouts are anchored to broad Earth-system locations rather than
    # pretending that a global inventory has a single geographic footprint.
    body.append(card(92, 118, 150, 70, ["大气", "Atmosphere"], fill="#eaf7fb", stroke=COOL))
    body.append(card(388, 386, 158, 70, ["海洋", "Ocean"], fill="#e5f4fb", stroke=DEEP))
    body.append(card(244, 212, 165, 70, ["陆地 / 土壤", "Land / soil"], fill="#f0f6e7", stroke=FOREST))
    body.append(card(418, 130, 142, 70, ["冰雪", "Ice / snow"], fill="#f0fbff", stroke=COOL))
    body.append(card(92, 322, 154, 70, ["生物圈", "Biosphere"], fill="#edf7ed", stroke=FOREST))

    body.append(curved_arrow("M 245 153 C 300 160, 340 184, 385 214", color=COOL, width=3))
    body.append(curved_arrow("M 325 282 C 348 322, 391 366, 431 386", color=DEEP, width=3))
    body.append(curved_arrow("M 469 386 C 444 330, 423 279, 405 244", color=WARM, width=3))
    body.append(curved_arrow("M 420 164 C 380 188, 340 210, 325 214", color=COOL, width=3))
    body.append(curved_arrow("M 168 322 C 154 272, 152 224, 164 188", color=FOREST, width=3))
    body.append(dashed_path("M 246 352 C 285 330, 320 314, 354 285", color=GOLD, width=2))
    body.append(arrow(255, 347, 274, 337, color=GOLD, width=2))
    body.append(text(278, 333, "交换 / exchange", size=11, fill=MUTED))

    # A small ledger makes the spatial grouping quantitative without implying
    # that the illustrative numbers are an Earth inventory.
    body.append(panel(640, 82, 366, 395, "空间边界内的账本", "教学量纲 / teaching units"))
    body.append(text(662, 139, "储库 S", size=13, fill=MUTED, weight=700))
    body.append(text(836, 139, "代表性变量", size=13, fill=MUTED, weight=700))
    body.append(line(660, 150, 986, 150, stroke=GRID, stroke_width=1))
    rows = [
        ("大气", "qᵥ / CO₂", SKY, COOL),
        ("海洋", "H₂O / heat", OCEAN, DEEP),
        ("陆地", "soil C / water", LAND, FOREST),
        ("冰雪", "ice mass", ICE, COOL),
        ("生物圈", "biomass", "#e1f0df", FOREST),
    ]
    for index, (name, variable, fill, stroke) in enumerate(rows):
        yy = 171 + index * 48
        body.append(rect(662, yy - 17, 16, 16, radius=3, fill=fill, stroke=stroke))
        body.append(text(690, yy - 3, name, size=14, weight=700))
        body.append(text(836, yy - 3, variable, size=13, fill=MUTED))
        body.append(line(660, yy + 13, 986, yy + 13, stroke=GRID, stroke_width=1))
    body.append(text(662, 420, "守恒检查", size=13, fill=MUTED, weight=700))
    body.append(text(662, 443, "dS/dt = Fᵢₙ", size=15, weight=800))
    body.append(text(662, 463, "− Fₒᵤₜ", size=15, weight=800))
    body.append(legend_box(836, 385, 140, [("陆地储库", LAND, False, False), ("水通量", COOL, True, False),
                                            ("交换 / 延迟", GOLD, True, True)]))
    save(OUT / "system-reservoir-map.svg", "地球系统的储库与边界",
         "教学示意地图把大气、海洋、陆地、冰雪和生物圈作为储库，并以方向性通量连接；地图边界与储库空间范围非等比例。",
         "".join(body))


def system_timescale_ladder() -> None:
    body = [header("扰动如何穿过快库与慢库", "01 · 过程机制 | Timescale ladder")]
    body.append(panel(38, 82, 964, 246, "同一输入，不同的系统记忆", "一阶响应 / first-order response"))
    body.append(text(70, 126, "脉冲输入", size=14, weight=750))
    body.append(path("M 83 174 L 83 145 L 114 145 L 114 174", stroke=WARM, stroke_width=4))
    body.append(text(83, 202, "Fᵢₙ", size=13, fill=WARM, anchor="middle"))
    body.append(arrow(121, 160, 186, 160, color=WARM, width=3))
    body.append(card(190, 130, 154, 62, ["快库", "τ = 1 年"], fill="#fff4e8", stroke=WARM))
    body.append(arrow(352, 160, 418, 160, color=WARM, width=3))
    body.append(card(424, 130, 154, 62, ["慢库", "τ = 20 年"], fill="#eaf5fb", stroke=COOL))
    body.append(arrow(586, 160, 650, 160, color=COOL, width=3))
    body.append(card(656, 130, 176, 62, ["输出", "Fₒᵤₜ = kS"], fill="#f2f6fa", stroke=LINE))
    body.append(text(92, 239, "响应剩余比例", size=13, fill=MUTED))
    body.append(line(185, 232, 904, 232, stroke=GRID, stroke_width=1.5))
    body.append(path("M 185 232 C 260 232, 285 240, 340 250 C 390 260, 420 266, 480 269 C 560 273, 630 274, 720 274", stroke=WARM, stroke_width=3))
    body.append(path("M 185 232 C 330 232, 420 234, 510 243 C 620 254, 710 263, 900 270", stroke=COOL, stroke_width=3))
    body.append(line(185, 276, 904, 276, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(text(185, 298, "t = 0", size=11, fill=MUTED, anchor="middle"))
    body.append(text(545, 298, "t = τ", size=11, fill=MUTED, anchor="middle"))
    body.append(text(904, 298, "时间 t", size=11, fill=MUTED, anchor="end"))
    body.append(text(545, 257, "e⁻¹ ≈ 0.37", size=12, fill=MUTED, anchor="middle"))
    body.append(legend_box(760, 92, 210, [("快库 / fast", WARM, True, False), ("慢库 / slow", COOL, True, False),
                                            ("输入脉冲", WARM, True, False)]))

    body.append(panel(38, 350, 964, 162, "时间尺度阶梯", "同一语法可迁移到水、碳与热"))
    levels = [("日", "hours–days", WARM), ("季节", "months", GOLD), ("年", "1 yr", FOREST),
              ("世纪", "10² yr", VIOLET), ("百万年", "Myr", DEEP)]
    x0 = 76
    widths = [132, 132, 132, 132, 166]
    heights = [34, 54, 76, 98, 120]
    for index, ((cn, en, color), width, height) in enumerate(zip(levels, widths, heights)):
        xx = x0 + sum(widths[:index]) + index * 12
        yy = 475 - height
        body.append(rect(xx, yy, width, height, radius=6, fill=color, stroke=color, opacity=.18))
        body.append(text(xx + width / 2, yy + height / 2 - 1, cn, size=16, weight=750, anchor="middle"))
        body.append(text(xx + width / 2, yy + height / 2 + 21, en, size=11, fill=MUTED, anchor="middle"))
    body.append(text(76, 497, "快响应", size=12, fill=WARM, weight=700))
    body.append(text(906, 497, "慢响应", size=12, fill=DEEP, weight=700, anchor="end"))
    body.append(text(38, 560, "核心关系：τ = S/Fₒᵤₜ = 1/k；虚线表示模型中的输入脉冲或延迟路径。", size=11, fill=MUTED))
    save(OUT / "system-timescale-ladder.svg", "扰动如何穿过快库与慢库",
         "过程示意展示输入脉冲经过不同驻留时间的快库和慢库时产生不同的指数响应；曲线不是观测时间序列。",
         "".join(body))


def deep_time_clock() -> None:
    body = [header("地层中的时间书签", "02 · 空间结构 | Deep-time clock")]
    body.append(panel(38, 82, 596, 430, "连续沉积剖面", "相对顺序 / relative order"))
    # The column is intentionally stylised; the ordering is the teaching signal.
    layer_specs = [
        ("上部砂岩", "young", "#e7cda8"),
        ("页岩", "", "#b8c7d1"),
        ("火山灰层", "marker bed", "#6d7f8d"),
        ("粉砂岩", "", "#d8b58c"),
        ("砾岩", "old", "#b98962"),
    ]
    x = 115
    y = 136
    widths = [390, 350, 370, 340, 400]
    heights = [54, 60, 48, 67, 72]
    for index, ((name, tag_name, fill), width, height) in enumerate(zip(layer_specs, widths, heights)):
        xx = x + (index % 2) * 8
        body.append(rect(xx, y, width, height, fill=fill, stroke="#92765e", stroke_width=1.2))
        body.append(text(xx + 18, y + height / 2 + 5, name, size=14, weight=700))
        if tag_name:
            body.append(text(xx + width - 18, y + height / 2 + 5, tag_name, size=12, fill=PAPER, anchor="end", weight=700))
        y += height
    body.append(line(78, 142, 78, 414, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(text(67, 130, "年轻 / young", size=12, fill=MUTED, rotate=-90, anchor="middle"))
    body.append(text(67, 466, "老 / old", size=12, fill=MUTED, rotate=-90, anchor="middle"))
    body.append(line(506, 289, 567, 289, stroke=GOLD, stroke_width=3, marker_end="arrow"))
    body.append(text(569, 284, "可对比的标志层", size=12, fill=GOLD, weight=700))
    body.append(text(569, 302, "tephra marker", size=11, fill=MUTED))
    body.append(schematic_note(56, 494, "剖面为示意；层厚、界面倾角和空间距离非等比例。"))

    body.append(panel(664, 82, 338, 430, "两类时间证据", "先后 ≠ 数值年龄"))
    body.append(card(696, 132, 274, 68, ["叠覆律", "下部较老 · 上部较新"], fill="#f6f0e8", stroke=ROCK))
    body.append(arrow(833, 211, 833, 241, color=ROCK, width=3))
    body.append(card(696, 246, 274, 74, ["放射性时钟", "f = N/N₀ · T₁/₂"], fill="#eef5fb", stroke=COOL))
    body.append(arrow(833, 330, 833, 359, color=COOL, width=3))
    body.append(card(696, 364, 274, 72, ["交叉约束", "t ± σₜ · 条件化年龄"], fill="#f2f7ee", stroke=FOREST))
    body.append(text(696, 469, "t = (T₁/₂ / ln 2) ln(1/f)", size=15, weight=800))
    body.append(text(696, 490, "f 需校正；封闭体系与误差模型不可省略。", size=11, fill=MUTED))
    body.append(legend_box(710, 516, 246, [("相对层序色带", "#b98962", False, False), ("标志层线", GOLD, True, False)]))
    save(OUT / "deep-time-clock.svg", "地层中的时间书签",
         "空间剖面示意把地层叠覆关系与火山灰标志层放在一起；层厚、倾角、距离均非等比例，数值年龄必须依赖独立定年与校正。",
         "".join(body))


def stratigraphy_dating() -> None:
    body = [header("从地层关系到年龄区间", "02 · 过程机制 | Stratigraphy + dating")]
    body.append(panel(38, 82, 964, 430, "两条证据链如何合流", "证据 → 模型 → 可检验结论"))
    # Left: relative stratigraphic evidence.
    body.append(text(78, 129, "A  相对顺序", size=15, weight=800))
    body.append(rect(80, 154, 220, 244, radius=5, fill="#faf7f1", stroke=ROCK))
    band_colors = ["#b98962", "#d8b58c", "#6d7f8d", "#b8c7d1", "#e7cda8"]
    band_names = ["下部", "中下部", "标志层", "中上部", "上部"]
    band_heights = [48, 47, 38, 51, 60]
    yy = 166
    for fill, name, bh in zip(band_colors, band_names, band_heights):
        body.append(rect(94, yy, 192, bh, fill=fill, stroke="#92765e", stroke_width=1))
        body.append(text(190, yy + bh / 2 + 5, name, size=13, fill=PAPER if name == "标志层" else INK,
                         anchor="middle", weight=700))
        yy += bh
    body.append(arrow(324, 272, 389, 272, color=ROCK, width=3))
    body.append(card(392, 236, 158, 72, ["相对排序", "A < marker < B"], fill="#f6f0e8", stroke=ROCK))

    # Middle: exponential decay as a compact, labelled graph.
    body.append(text(78, 432, "B  放射性衰变", size=15, weight=800))
    body.append(line(98, 477, 300, 477, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(line(98, 477, 98, 433, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(path("M 105 439 C 138 444, 160 454, 181 461 C 213 470, 251 474, 291 476", stroke=COOL, stroke_width=3))
    body.append(line(188, 438, 188, 477, stroke=GOLD, stroke_width=2, dash="6 4"))
    body.append(text(188, 429, "T₁/₂", size=12, fill=GOLD, anchor="middle", weight=700))
    body.append(text(102, 423, "N/N₀", size=11, fill=MUTED))
    body.append(text(300, 492, "时间 t", size=11, fill=MUTED, anchor="end"))
    body.append(arrow(570, 272, 640, 272, color=FOREST, width=3))
    body.append(card(644, 226, 198, 88, ["年龄估计", "t ± σₜ", "f, λ, 标准"], fill="#eef6ed", stroke=FOREST, size=14))
    body.append(arrow(852, 272, 921, 272, color=FOREST, width=3))
    body.append(card(868, 226, 108, 88, ["可检验", "对齐 / 复测"], fill="#f1f6fa", stroke=COOL, size=13))
    body.append(text(392, 361, "关键不是更多小数位，而是独立证据是否相容。", size=13, fill=MUTED, weight=650))
    body.append(text(392, 389, "σₜ ≈ σ_f / (λf)", size=17, weight=800))
    body.append(text(392, 410, "f 越小，比例误差对年龄的放大越明显。", size=11, fill=MUTED))
    body.append(legend_box(670, 392, 282, [("层序色带", "#b98962", False, False), ("衰变曲线", COOL, True, False),
                                            ("半衰期标记", GOLD, True, True)]))
    body.append(text(38, 552, "示意剖面与曲线；层厚、时间分辨率和距离非等比例。虚线表示半衰期标记。", size=11, fill=MUTED))
    save(OUT / "stratigraphy-dating.svg", "从地层关系到年龄区间",
         "过程示意把相对地层排序与指数衰变模型汇合为带不确定度的年龄约束；曲线和数值为教学参数。",
         "".join(body))


def earth_interior_cutaway() -> None:
    body = [header("地球内部的分层与尺度", "03 · 空间结构 | Interior cutaway")]
    body.append(panel(38, 82, 548, 444, "球壳剖面", "半径方向 / radial structure"))
    body.append(colored_marker_defs())
    cx, cy = 302, 303
    body.append(circle(cx, cy, 173, fill="#eef5e8", stroke=INK, stroke_width=2))
    body.append(circle(cx, cy, 151, fill=LAND, stroke="#81936e", stroke_width=1.2))
    body.append(circle(cx, cy, 112, fill=MANTLE, stroke="#ad5c49", stroke_width=1.5))
    body.append(circle(cx, cy, 52, fill=CORE, stroke="#b27c16", stroke_width=1.5))
    # A cutaway wedge reveals the nested shells and keeps the figure legible.
    body.append(path("M 302 303 L 475 303 A 173 173 0 0 0 388 153 Z", fill=PAPER, stroke=PAPER, stroke_width=1))
    body.append(path("M 302 303 L 414 303 A 112 112 0 0 0 358 206 Z", fill=PAPER, stroke=PAPER, stroke_width=1))
    body.append(path("M 302 303 L 354 303 A 52 52 0 0 0 328 258 Z", fill=PAPER, stroke=PAPER, stroke_width=1))
    body.append(path("M 302 303 L 475 303 A 173 173 0 0 0 388 153 Z", fill="none", stroke=INK, stroke_width=2))
    body.append(path("M 302 303 L 414 303 A 112 112 0 0 0 358 206 Z", fill="none", stroke=INK, stroke_width=1.5))
    body.append(path("M 302 303 L 354 303 A 52 52 0 0 0 328 258 Z", fill="none", stroke=INK, stroke_width=1.5))
    body.append(curved_arrow("M 157 350 C 224 252, 364 240, 452 277", color=WARM, width=3,
                             marker="arrow-warm-local"))
    body.append(curved_arrow("M 157 340 C 171 324, 182 311, 191 303", color=COOL, width=3,
                             dash="7 5", marker="arrow-cool-local"))
    body.append(text(198, 273, "P", size=13, fill=WARM, weight=800))
    body.append(text(156, 374, "S 波至外核边界", size=11, fill=COOL, weight=700))
    body.append(text(424, 214, "地幔", size=15, weight=750))
    body.append(text(424, 233, "mantle · μ > 0", size=12, fill=MUTED))
    body.append(text(358, 353, "液态外核", size=15, fill=WARM, weight=800))
    body.append(text(358, 372, "outer core · liquid · μ ≈ 0", size=11, fill=WARM, weight=700))
    body.append(text(321, 306, "内核", size=13, weight=750, anchor="middle"))
    body.append(text(321, 323, "solid", size=11, fill=MUTED, anchor="middle"))
    body.append(text(302, 134, "地表 / surface", size=12, fill=MUTED, anchor="middle"))
    body.append(line(302, 145, 302, 173, stroke=MUTED, stroke_width=1.5, dash="5 4"))
    body.append(scale_bar(136, 478, 122, "示意半径刻度"))
    body.append(schematic_note(58, 508, "球体、层界和深度均为概念比例；不是地球真实剖面比例。"))

    body.append(panel(616, 82, 386, 444, "波型为何能区分介质", "弹性参数 / elastic parameters"))
    body.append(card(648, 132, 144, 66, ["P 波", "压缩 · vP"], fill="#fff0ec", stroke=WARM))
    body.append(card(826, 132, 144, 66, ["S 波", "剪切 · vS"], fill="#eaf5fb", stroke=COOL))
    body.append(text(648, 239, "vP = √((K + 4μ/3) / ρ)", size=14, weight=750))
    body.append(text(648, 267, "vS = √(μ / ρ)", size=14, weight=750))
    body.append(line(648, 290, 970, 290, stroke=GRID, stroke_width=1))
    body.append(text(648, 320, "外核：μ ≈ 0", size=16, weight=800, fill=WARM))
    body.append(text(648, 346, "直达 S 波缺失，P 波仍可传播。", size=13, fill=MUTED))
    body.append(arrow(708, 373, 708, 411, color=COOL, width=3, marker="arrow-cool-local"))
    body.append(arrow(884, 373, 884, 411, color=WARM, width=3, marker="arrow-warm-local"))
    body.append(text(708, 430, "固体", size=13, fill=COOL, anchor="middle", weight=700))
    body.append(text(884, 430, "液体", size=13, fill=WARM, anchor="middle", weight=700))
    body.append(legend_box(739, 450, 231, [("P 波路径", WARM, True, False), ("S 波至外核边界", COOL, True, True)]))
    save(OUT / "earth-interior-cutaway.svg", "地球内部的分层与尺度",
         "球壳剖面示意展示地幔、液态外核与固态内核的概念分层，并以 P/S 波速度公式说明为何波型能够约束内部介质；几何非等比例。",
         "".join(body))


def seismic_ray_shadow() -> None:
    body = [header("波的路径如何留下影区", "03 · 过程机制 | Seismic ray shadow")]
    body.append(panel(38, 82, 530, 430, "路径与观测", "示意球面 / conceptual geometry"))
    cx, cy, r = 300, 300, 158
    body.append(circle(cx, cy, r, fill="#f5f8fb", stroke=INK, stroke_width=2))
    body.append(circle(cx, cy, 86, fill="#f9e4df", stroke=WARM, stroke_width=1.2, opacity=.8))
    body.append(text(cx, cy + 5, "液态外核", size=16, fill=WARM, anchor="middle", weight=750))
    body.append(text(cx, cy + 28, "μ ≈ 0", size=12, fill=MUTED, anchor="middle"))
    body.append(circle(159, 270, 6, fill=INK, stroke=INK))
    body.append(text(145, 250, "震源", size=12, fill=INK, anchor="middle", weight=700))
    body.append(circle(441, 187, 6, fill=INK, stroke=INK))
    body.append(circle(430, 421, 6, fill=INK, stroke=INK))
    body.append(text(472, 186, "台站 A", size=11, fill=MUTED))
    body.append(text(462, 425, "台站 B", size=11, fill=MUTED))
    body.append(curved_arrow("M 164 268 C 222 220, 328 175, 435 187", color=WARM, width=3))
    body.append(text(285, 201, "P：折射后到达", size=12, fill=WARM, weight=700))
    body.append(dashed_path("M 164 276 C 234 323, 362 358, 431 417", color=COOL, width=3))
    body.append(text(282, 361, "S：直达路径中断", size=12, fill=COOL, weight=700))
    body.append(path("M 431 417 L 472 456", stroke=COOL, stroke_width=2, dash="7 6"))
    body.append(text(472, 470, "缺失相位", size=11, fill=MUTED, anchor="middle"))
    body.append(schematic_note(58, 490, "射线为概念路径；角距、层厚和影区边界非等比例。"))

    body.append(panel(600, 82, 402, 430, "从波型到内部约束", "观测链 / inference chain"))
    steps = [
        ("1", "介质", "外核近似液态", "#fff0ec", WARM),
        ("2", "物理量", "μ ≈ 0 → vS ≈ 0", "#eef5fb", COOL),
        ("3", "观测", "直达 S 波缺失", "#edf7ed", FOREST),
        ("4", "约束", "影区几何限制界面", "#f4f0fa", VIOLET),
    ]
    for index, (num, label, value, fill, stroke) in enumerate(steps):
        yy = 122 + index * 75
        body.append(circle(632, yy + 28, 16, fill=stroke, stroke=stroke))
        body.append(text(632, yy + 34, num, size=13, fill=PAPER, anchor="middle", weight=800))
        body.append(card(662, yy, 296, 56, [label, value], fill=fill, stroke=stroke, size=14))
        if index < len(steps) - 1:
            body.append(arrow(632, yy + 46, 632, yy + 70, color=LINE, width=2, marker="arrow-small"))
    body.append(text(630, 440, "多台站 + 多震相", size=16, weight=800))
    body.append(text(630, 467, "才把单条路径的退化变成可检验模型。", size=12, fill=MUTED))
    body.append(legend_box(771, 426, 199, [("P 波", WARM, True, False), ("S 波 / 缺失", COOL, True, True)]))
    save(OUT / "seismic-ray-shadow.svg", "波的路径如何留下影区",
         "过程示意展示液态外核使 vS 近似为零、直达 S 波出现影区，再由多台站几何形成内部结构约束；射线不是实际地震层析追踪。",
         "".join(body))


def plate_global_map() -> None:
    body = [header("板块边界的全球几何", "04 · 空间结构 | Plate global map")]
    body.append(world_map(38, 82, 700, 414, title="相对运动的教学地图", ocean="#c9e5f1", land="#dae6c5"))
    # Stylised boundary traces follow the map projection but are not intended as
    # a navigation layer.
    def p(lon: float, lat: float) -> tuple[float, float]:
        return project(lon, lat, 38, 82, 700, 414)

    ridge = [p(-42, 65), p(-30, 35), p(-23, 5), p(-18, -25), p(-15, -52)]
    trench = [p(143, 50), p(138, 20), p(130, -8), p(120, -35), p(110, -55)]
    transform = [p(-122, 45), p(-123, 20), p(-112, 5)]
    body.append(polyline(ridge, stroke=WARM, stroke_width=4))
    body.append(polyline(trench, stroke=VIOLET, stroke_width=4, dash="8 5"))
    body.append(polyline(transform, stroke=GOLD, stroke_width=4, dash="3 7"))
    for lon, lat, dx, dy in [(-33, 43, -26, 0), (-25, 9, 24, 0), (132, 14, -23, 0), (124, -21, 23, 0), (-123, 29, 0, -25)]:
        xx, yy = p(lon, lat)
        body.append(arrow(xx - dx, yy - dy, xx + dx, yy + dy, color=INK, width=2.5))
    body.append(text(186, 157, "张性", size=12, fill=WARM, weight=750))
    body.append(text(584, 207, "汇聚", size=12, fill=VIOLET, weight=750))
    body.append(text(161, 275, "转换", size=12, fill=GOLD, weight=750))
    body.append(legend_box(499, 407, 222, [("海岭 / divergent", WARM, True, False), ("俯冲 / convergent", VIOLET, True, True),
                                            ("转换 / transform", GOLD, True, True)]))
    body.append(schematic_note(50, 486, "示意等经纬投影；板块边界、箭头与距离均非导航比例。"))

    body.append(panel(770, 82, 232, 414, "向量账本", "relative motion"))
    body.append(text(794, 133, "d = vt", size=22, weight=800))
    body.append(text(794, 161, "1 cm/yr × 1 Myr", size=13, fill=MUTED))
    body.append(text(794, 184, "= 10 km", size=15, weight=750, fill=COOL))
    body.append(line(794, 205, 974, 205, stroke=GRID, stroke_width=1))
    body.append(text(794, 239, "法向 n", size=13, fill=MUTED, weight=700))
    body.append(arrow(800, 267, 908, 267, color=WARM, width=3))
    body.append(text(921, 272, "张开 / 缩短", size=12, fill=WARM, weight=700))
    body.append(text(794, 322, "切向 s", size=13, fill=MUTED, weight=700))
    body.append(arrow(853, 346, 853, 414, color=GOLD, width=3))
    body.append(text(876, 384, "剪切", size=12, fill=GOLD, weight=700))
    body.append(text(794, 455, "v = ωR sin α", size=14, weight=750))
    save(OUT / "plate-global-map.svg", "板块边界的全球几何",
         "等经纬教学地图示意三类板块边界与相对运动向量；地图、边界和距离均非等比例，箭头只表示运动学方向。",
         "".join(body))


def plate_boundary_sections() -> None:
    body = [header("三类边界如何改变地表", "04 · 过程机制 | Plate-boundary sections")]
    body.append(panel(38, 82, 964, 430, "边界类型是速度向量的投影", "剖面示意 / sectional schematic"))
    sections = [
        (56, "张性", "divergent", WARM, "#fff0ec"),
        (352, "汇聚", "convergent", VIOLET, "#f4f0fa"),
        (648, "转换", "transform", GOLD, "#fff7e8"),
    ]
    for x, name, english, color, fill in sections:
        body.append(rect(x, 126, 260, 315, radius=8, fill=fill, stroke=color))
        body.append(text(x + 18, 155, name, size=17, weight=800, fill=color))
        body.append(text(x + 242, 154, english, size=11, fill=MUTED, anchor="end"))
    # Divergent section.
    x = 56
    body.append(polygon([(x + 18, 260), (x + 119, 242), (x + 128, 405), (x + 18, 405)], fill="#d9e6c5", stroke="#82936f"))
    body.append(polygon([(x + 242, 260), (x + 141, 242), (x + 132, 405), (x + 242, 405)], fill="#d9e6c5", stroke="#82936f"))
    body.append(path(f"M {x + 119} 242 C {x + 126} 269, {x + 130} 296, {x + 130} 405 L {x + 141} 405 C {x + 141} 295, {x + 138} 267, {x + 141} 242 Z", fill=MANTLE, stroke="#ad5c49"))
    body.append(arrow(x + 119, 206, x + 70, 206, color=WARM, width=3))
    body.append(arrow(x + 141, 206, x + 190, 206, color=WARM, width=3))
    body.append(text(x + 130, 230, "上涌 / upwelling", size=11, fill=WARM, anchor="middle", weight=700))
    body.append(text(x + 130, 421, "vₙ > 0", size=14, fill=WARM, anchor="middle", weight=750))
    # Convergent section.
    x = 352
    body.append(polygon([(x + 18, 258), (x + 118, 245), (x + 90, 405), (x + 18, 405)], fill="#d9e6c5", stroke="#82936f"))
    body.append(polygon([(x + 242, 258), (x + 142, 245), (x + 174, 405), (x + 242, 405)], fill="#e3c99c", stroke="#92765e"))
    body.append(path(f"M {x + 116} 246 C {x + 140} 281, {x + 145} 326, {x + 90} 405", fill="none", stroke=VIOLET, stroke_width=5))
    body.append(arrow(x + 72, 206, x + 125, 206, color=VIOLET, width=3))
    body.append(arrow(x + 188, 206, x + 135, 206, color=VIOLET, width=3))
    body.append(text(x + 130, 230, "俯冲 / subduction", size=11, fill=VIOLET, anchor="middle", weight=700))
    body.append(text(x + 130, 421, "vₙ < 0", size=14, fill=VIOLET, anchor="middle", weight=750))
    # Transform section.
    x = 648
    body.append(rect(x + 18, 258, 103, 147, fill="#d9e6c5", stroke="#82936f"))
    body.append(rect(x + 139, 258, 103, 147, fill="#d9e6c5", stroke="#82936f"))
    body.append(line(x + 130, 247, x + 130, 418, stroke=GOLD, stroke_width=4, dash="3 6"))
    body.append(arrow(x + 74, 226, x + 74, 274, color=GOLD, width=3))
    body.append(arrow(x + 186, 274, x + 186, 226, color=GOLD, width=3))
    body.append(text(x + 130, 230, "走滑 / slip", size=11, fill=GOLD, anchor="middle", weight=700))
    body.append(text(x + 130, 421, "vₛ ≠ 0", size=14, fill=GOLD, anchor="middle", weight=750))
    body.append(text(68, 474, "局部投影：dₙ = d cos φ，dₛ = d sin φ", size=14, weight=800))
    body.append(text(68, 498, "剖面、边界宽度与地幔流线均为示意；运动学不等于应力或灾害预报。", size=11, fill=MUTED))
    body.append(legend_box(761, 453, 200, [("张性", WARM, True, False), ("汇聚", VIOLET, True, False), ("剪切", GOLD, True, False)]))
    save(OUT / "plate-boundary-sections.svg", "三类边界如何改变地表",
         "三联剖面示意把相对速度分解为法向与切向分量，说明张性、汇聚和转换边界的过程差异；剖面边界和深度非等比例。",
         "".join(body))


def rock_cycle_landscape() -> None:
    body = [header("岩石循环连接地表与深部", "05 · 空间结构 | Rock-cycle landscape")]
    body.append(panel(38, 82, 964, 430, "一个景观中的多种储库", "地表—地下剖面示意 / landscape section"))
    # Sky and basin background.
    body.append(rect(58, 122, 924, 128, fill="#eaf7fb", stroke="none"))
    body.append(path("M 58 282 L 160 216 L 250 268 L 350 198 L 430 279 L 568 224 L 690 293 L 805 244 L 982 286 L 982 430 L 58 430 Z",
                     fill="#d7e5c1", stroke="#82936f", stroke_width=1.3))
    body.append(polygon([(160, 216), (219, 172), (282, 260), (250, 268)], fill=ROCK, stroke="#92765e"))
    body.append(polygon([(690, 293), (805, 244), (982, 286), (982, 430), (690, 430)], fill="#d9c09b", stroke="#92765e"))
    body.append(path("M 535 270 C 548 235, 573 208, 596 170 C 617 207, 641 236, 654 282 L 654 430 L 535 430 Z", fill=MANTLE, stroke="#ad5c49"))
    body.append(path("M 584 173 C 588 146, 595 136, 600 119 C 605 139, 614 148, 618 174", stroke=WARM, stroke_width=4))
    body.append(text(568, 151, "火山", size=14, fill=WARM, weight=800))
    body.append(text(564, 168, "magma", size=11, fill=MUTED))
    body.append(text(105, 317, "山地 / 抬升", size=14, weight=750))
    body.append(text(741, 333, "沉积盆地", size=14, weight=750))
    body.append(text(741, 351, "sediment", size=11, fill=MUTED))
    body.append(text(563, 403, "深部熔融区", size=13, fill=PAPER, weight=750))
    body.append(text(86, 249, "大气输入", size=11, fill=MUTED))
    # Material paths around the landscape.
    body.append(curved_arrow("M 246 255 C 290 276, 328 294, 394 309", color=COOL, width=3))
    body.append(text(280, 281, "风化", size=11, fill=COOL, weight=700))
    body.append(curved_arrow("M 413 315 C 500 322, 606 334, 726 335", color=GOLD, width=3))
    body.append(text(503, 307, "搬运 / transport", size=11, fill=GOLD, weight=700))
    body.append(curved_arrow("M 765 355 C 711 395, 681 412, 641 415", color=VIOLET, width=3))
    body.append(text(704, 408, "埋藏 / burial", size=11, fill=VIOLET, weight=700))
    body.append(curved_arrow("M 610 288 C 595 267, 597 241, 602 215", color=WARM, width=3))
    body.append(text(620, 254, "熔融", size=11, fill=WARM, weight=700))
    body.append(curved_arrow("M 630 175 C 660 213, 680 245, 711 276", color=WARM, width=3))
    body.append(text(667, 215, "火山作用", size=11, fill=WARM, weight=700))
    body.append(legend_box(734, 114, 236, [("固体储库", ROCK, False, False), ("搬运通量", GOLD, True, False),
                                            ("深部过程", WARM, True, False)]))
    body.append(schematic_note(62, 486, "景观剖面为示意；地形起伏、地层厚度与地下深度非等比例。"))
    save(OUT / "rock-cycle-landscape.svg", "岩石循环连接地表与深部",
         "景观剖面示意把抬升、风化、沉积、埋藏、熔融和火山作用放进同一空间；地形、地层和深度均非等比例。",
         "".join(body))


def magma_differentiation() -> None:
    body = [header("部分熔融如何产生分异", "05 · 过程机制 | Magma differentiation")]
    body.append(panel(38, 82, 964, 430, "从源岩到不同成分的岩浆", "元素分配 / phase partitioning"))
    body.append(card(68, 160, 170, 88, ["源岩", "source rock", "solid"], fill="#eef5e8", stroke=FOREST, size=14))
    body.append(arrow(246, 204, 314, 204, color=WARM, width=3))
    body.append(text(280, 185, "部分熔融", size=11, fill=WARM, anchor="middle", weight=700))
    body.append(card(320, 160, 180, 88, ["熔体", "melt", "液相 L"], fill="#fff0ec", stroke=WARM, size=14))
    body.append(arrow(510, 204, 580, 204, color=COOL, width=3))
    body.append(text(545, 185, "结晶", size=11, fill=COOL, anchor="middle", weight=700))
    body.append(card(586, 126, 152, 78, ["早期晶体", "Mg-rich"], fill="#eaf5fb", stroke=COOL, size=14))
    body.append(card(586, 222, 152, 78, ["残余熔体", "SiO₂ ↑"], fill="#fff7e8", stroke=GOLD, size=14))
    body.append(arrow(750, 165, 819, 165, color=COOL, width=3))
    body.append(arrow(750, 261, 819, 261, color=GOLD, width=3))
    body.append(card(824, 126, 136, 78, ["基性岩", "basalt"], fill="#eef5fb", stroke=COOL, size=13))
    body.append(card(824, 222, 136, 78, ["酸性岩", "rhyolite"], fill="#fff8e9", stroke=GOLD, size=13))

    body.append(text(68, 355, "组成坐标（示意）", size=13, fill=MUTED, weight=700))
    body.append(line(132, 430, 924, 430, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(text(132, 452, "Mg# 高", size=12, fill=COOL, anchor="middle", weight=700))
    body.append(text(924, 452, "SiO₂ 高", size=12, fill=GOLD, anchor="middle", weight=700))
    body.append(path("M 184 403 C 340 398, 488 403, 615 420 C 706 432, 774 426, 872 394", stroke=VIOLET, stroke_width=4))
    body.append(circle(210, 402, 7, fill=COOL, stroke=COOL))
    body.append(circle(872, 394, 7, fill=GOLD, stroke=GOLD))
    body.append(text(210, 385, "源岩 / melt", size=11, fill=COOL, anchor="middle"))
    body.append(text(872, 377, "残余熔体", size=11, fill=GOLD, anchor="middle"))
    body.append(text(390, 492, "元素库存：Xⱼ = Mⱼ cⱼ；质量守恒不等于所有元素等比例移动。", size=12, fill=MUTED, anchor="middle"))
    body.append(legend_box(754, 327, 215, [("液相 L", WARM, False, False), ("早期晶体", COOL, False, False),
                                            ("组成趋势", VIOLET, True, False)]))
    body.append(schematic_note(38, 554, "箭头表示教学过程方向；分配系数、温压和混合等真实约束未按比例展开。"))
    save(OUT / "magma-differentiation.svg", "部分熔融如何产生分异",
         "过程示意展示源岩部分熔融、晶体分离和残余熔体成分变化；组成坐标与物相比例为教学示意，不是具体岩浆样品。",
         "".join(body))


def critical_zone_section() -> None:
    body = [header("临界带把地表过程串起来", "06 · 空间结构 | Critical-zone section")]
    body.append(panel(38, 82, 620, 430, "坡面垂向剖面", "大气—根系—基岩—地下水"))
    body.append(rect(64, 124, 568, 78, fill=SKY, stroke=GRID))
    body.append(path("M 64 202 C 174 182, 253 197, 352 182 C 459 166, 530 188, 632 176 L 632 432 L 64 432 Z",
                     fill=LAND, stroke="#82936f", stroke_width=1.3))
    body.append(path("M 64 251 C 160 233, 251 251, 347 237 C 470 218, 544 243, 632 227 L 632 311 C 515 315, 432 286, 340 302 C 233 319, 162 294, 64 318 Z",
                     fill="#b89971", stroke="#92765e", stroke_width=1))
    body.append(path("M 64 311 C 180 295, 251 324, 353 302 C 447 281, 528 319, 632 296 L 632 432 L 64 432 Z",
                     fill="#a87852", stroke="#79563f", stroke_width=1))
    body.append(path("M 64 390 C 185 369, 270 404, 363 376 C 469 344, 545 383, 632 362 L 632 432 L 64 432 Z",
                     fill="#8a9c86", stroke="#5e735d", stroke_width=1))
    # Vegetation and roots.
    for xx, height in [(148, 33), (192, 26), (421, 31), (463, 23), (544, 35)]:
        body.append(line(xx, 202, xx - 8, 202 - height, stroke=FOREST, stroke_width=4))
        body.append(line(xx, 202, xx + 9, 202 - height + 5, stroke=FOREST, stroke_width=3))
        body.append(path(f"M {xx} 205 C {xx - 7} 232, {xx - 13} 254, {xx - 11} 286", stroke=FOREST, stroke_width=2))
    body.append(text(87, 151, "大气 / atmosphere", size=13, fill=MUTED, weight=700))
    body.append(text(87, 229, "枯落物 + 表土", size=13, weight=700))
    body.append(text(87, 281, "根区 / soil", size=13, weight=700))
    body.append(text(87, 360, "风化基岩 / regolith", size=13, fill=PAPER, weight=700))
    body.append(text(87, 416, "裂隙水 / bedrock water", size=12, fill=PAPER, weight=700))
    body.append(arrow(112, 164, 112, 222, color=COOL, width=3))
    body.append(text(124, 190, "P", size=12, fill=COOL, weight=700))
    body.append(arrow(576, 327, 534, 383, color=DEEP, width=3))
    body.append(text(574, 348, "q", size=12, fill=DEEP, weight=700))
    body.append(schematic_note(56, 489, "剖面是示意；垂向深度与坡面长度、土层厚度非等比例。"))

    body.append(panel(686, 82, 316, 430, "临界带的耦合变量", "可观测量 / observables"))
    vars_ = [("水", "H₂O · 入渗 / drainage", COOL), ("碳", "CO₂ · 酸度代理", WARM),
             ("热", "T · reaction rate", GOLD), ("物质", "solute · export", VIOLET)]
    for index, (name, value, color) in enumerate(vars_):
        yy = 132 + index * 64
        body.append(circle(720, yy + 21, 14, fill=color, stroke=color))
        body.append(text(720, yy + 26, name, size=12, fill=PAPER, anchor="middle", weight=800))
        body.append(text(750, yy + 19, value, size=13, weight=700))
        body.append(line(750, yy + 33, 970, yy + 33, stroke=GRID, stroke_width=1))
    body.append(text(718, 415, "dH/dt = ηRᵥ − Eₛₒᵢₗ", size=17, weight=800))
    body.append(text(718, 444, "反应生成与侵蚀输出共同决定库存。", size=12, fill=MUTED))
    body.append(legend_box(767, 462, 203, [("输入 / input", COOL, True, False), ("溶质 / solute", VIOLET, False, False)]))
    save(OUT / "critical-zone-section.svg", "临界带把地表过程串起来",
         "坡面垂向剖面示意把大气、水、根系、土壤、风化基岩和裂隙水连接起来；剖面深度与地表长度非等比例。",
         "".join(body))


def soil_weathering_front() -> None:
    body = [header("风化前沿如何推进", "06 · 过程机制 | Soil-weathering front")]
    body.append(panel(38, 82, 964, 430, "反应、留存与侵蚀的竞争", "物质通量 / material flux"))
    body.append(rect(68, 150, 244, 238, radius=6, fill="#8a9c86", stroke="#5e735d"))
    body.append(text(190, 210, "新鲜基岩", size=18, fill=PAPER, anchor="middle", weight=800))
    body.append(text(190, 237, "primary minerals", size=12, fill=PAPER, anchor="middle"))
    body.append(rect(68, 310, 244, 78, radius=0, fill="#a87852", stroke="#79563f"))
    body.append(text(190, 356, "反应前沿 / front", size=14, fill=PAPER, anchor="middle", weight=750))
    body.append(rect(68, 116, 244, 34, radius=6, fill="#b89971", stroke="#92765e"))
    body.append(text(190, 139, "土壤 / regolith", size=14, anchor="middle", weight=750))
    body.append(arrow(106, 100, 106, 144, color=COOL, width=3))
    body.append(text(120, 112, "H₂O", size=12, fill=COOL, weight=700))
    body.append(arrow(170, 100, 170, 144, color=WARM, width=3))
    body.append(text(183, 112, "CO₂", size=12, fill=WARM, weight=700))
    body.append(arrow(238, 100, 238, 144, color=GOLD, width=3))
    body.append(text(251, 112, "T", size=12, fill=GOLD, weight=700))

    body.append(arrow(327, 269, 400, 269, color=WARM, width=3))
    body.append(text(363, 248, "溶解 / transform", size=11, fill=WARM, anchor="middle", weight=700))
    body.append(card(407, 214, 190, 110, ["次生矿物", "secondary minerals", "+ 溶质"], fill="#f1f6ea", stroke=FOREST, size=14))
    body.append(arrow(613, 246, 686, 246, color=VIOLET, width=3))
    body.append(text(649, 225, "输出", size=11, fill=VIOLET, anchor="middle", weight=700))
    body.append(card(693, 214, 190, 110, ["河流 / 地下水", "solute export", "Eₛₒᵢₗ"], fill="#eef5fb", stroke=VIOLET, size=14))
    body.append(arrow(898, 269, 966, 269, color=VIOLET, width=3))
    body.append(text(932, 296, "外排", size=11, fill=MUTED, anchor="middle"))
    body.append(text(68, 430, "反应速率代理", size=13, fill=MUTED, weight=700))
    body.append(text(68, 456, "Rᵥ = R₀ fᵥ exp[−Eₐ/Rg(1/T − 1/T₀)] fₐcᵢd", size=15, weight=800))
    body.append(text(68, 483, "库存：dH/dt = ηRᵥ − Eₛₒᵢₗ；反应更快不保证土壤更厚。", size=12, fill=MUTED))
    body.append(legend_box(746, 355, 223, [("反应物输入", COOL, True, False), ("化学生成", WARM, True, False),
                                            ("侵蚀 / 外排", VIOLET, True, False)]))
    body.append(schematic_note(38, 554, "箭头为教学过程方向；反应前沿位置、层厚和输运路径非等比例。"))
    save(OUT / "soil-weathering-front.svg", "风化前沿如何推进",
         "过程示意展示水、二氧化碳和温度驱动矿物反应，生成次生矿物并由侵蚀与地下水输出；速率和前沿位置为教学代理。",
         "".join(body))


def watershed_hydrology() -> None:
    body = [header("流域把降水汇总到出口", "07 · 空间结构 | Watershed hydrology")]
    body.append(panel(38, 82, 620, 430, "地形控制体", "俯视示意 / plan-view schematic"))
    body.append(path("M 66 220 C 148 180, 210 196, 282 166 C 362 133, 433 190, 510 155 C 558 133, 612 157, 632 178",
                     fill="none", stroke="#82936f", stroke_width=2))
    contours = [
        "M 86 255 C 170 220, 222 232, 288 204 C 360 175, 421 223, 490 187 C 550 156, 601 185, 620 204",
        "M 112 296 C 186 264, 240 278, 300 244 C 363 210, 418 255, 477 224 C 530 196, 578 224, 598 242",
        "M 150 337 C 214 306, 254 318, 310 286 C 360 258, 411 292, 459 266 C 500 243, 544 261, 568 282",
        "M 205 378 C 248 353, 284 361, 324 335 C 363 310, 396 337, 430 316 C 459 298, 490 306, 510 324",
    ]
    for contour in contours:
        body.append(path(contour, fill="none", stroke="#9ab08e", stroke_width=1.5))
    body.append(path("M 64 149 C 158 119, 239 137, 326 113 C 423 86, 537 127, 632 137 L 632 432 L 64 432 Z",
                     fill="#e1edcf", stroke="none", opacity=.35))
    # Divide and stream network.
    divide = [(75, 218), (150, 183), (232, 197), (313, 170), (398, 190), (491, 158), (610, 190)]
    body.append(polyline(divide, stroke=VIOLET, stroke_width=3, dash="9 5"))
    body.append(text(84, 207, "分水岭 divide", size=12, fill=VIOLET, weight=750))
    streams = [
        [(188, 215), (236, 249), (294, 283), (360, 332), (461, 395)],
        [(337, 196), (350, 250), (360, 332)],
        [(475, 204), (445, 260), (425, 307), (461, 395)],
        [(548, 245), (505, 295), (461, 395)],
    ]
    for stream in streams:
        body.append(polyline(stream, stroke=DEEP, stroke_width=4))
    body.append(arrow(447, 377, 480, 402, color=DEEP, width=3))
    body.append(circle(461, 395, 7, fill=WARM, stroke=WARM))
    body.append(text(485, 410, "出口 Q", size=13, fill=WARM, weight=800))
    # Infiltration and groundwater arrows.
    for xx, yy in [(266, 229), (382, 221), (532, 218)]:
        body.append(arrow(xx, yy - 26, xx, yy + 7, color=COOL, width=2, marker="arrow-small"))
    body.append(text(548, 218, "入渗 I", size=11, fill=COOL, weight=700))
    body.append(path("M 165 410 C 250 379, 350 389, 461 420", stroke=COOL, stroke_width=3, dash="8 5", marker_end="url(#arrow)"))
    body.append(text(223, 421, "地下水流 q", size=11, fill=COOL, weight=700))
    body.append(text(88, 460, "P", size=16, fill=COOL, weight=800))
    body.append(text(108, 460, "降水", size=12, fill=MUTED))
    body.append(text(176, 460, "R", size=16, fill=DEEP, weight=800))
    body.append(text(196, 460, "径流", size=12, fill=MUTED))
    body.append(text(260, 460, "G", size=16, fill=FOREST, weight=800))
    body.append(text(280, 460, "补给", size=12, fill=MUTED))
    body.append(schematic_note(58, 490, "流域边界、等高线与地下水分水岭为示意，面积与坡度非等比例。"))

    body.append(panel(686, 82, 316, 430, "年度水账", "depth → volume"))
    body.append(text(716, 136, "P = R + ET + G", size=21, weight=800))
    body.append(text(716, 172, "P = 800 mm/yr", size=14, fill=COOL, weight=700))
    parts = [("R", "280", DEEP), ("ET", "364", WARM), ("G", "156", FOREST)]
    for index, (name, value, color) in enumerate(parts):
        yy = 218 + index * 54
        body.append(rect(716, yy - 16, 28, 28, radius=4, fill=color, stroke=color))
        body.append(text(758, yy + 5, name, size=14, weight=750))
        body.append(text(888, yy + 5, value + " mm/yr", size=13, fill=MUTED, anchor="end"))
    body.append(line(716, 378, 970, 378, stroke=GRID, stroke_width=1))
    body.append(text(716, 410, "V = h × A × 1000", size=17, weight=800))
    body.append(text(716, 439, "1 mm × 1 km² = 1000 m³", size=12, fill=MUTED))
    body.append(legend_box(793, 461, 177, [("地表水", DEEP, True, False), ("地下水", COOL, True, True)]))
    save(OUT / "watershed-hydrology.svg", "流域把降水汇总到出口",
         "流域俯视示意展示分水岭、河网、出口、入渗和地下水流向，并配套年度水量平衡；地形、边界和距离非等比例。",
         "".join(body))


def aquifer_cross_section() -> None:
    body = [header("含水层的补给、储量与流向", "07 · 过程机制 | Aquifer cross-section")]
    body.append(panel(38, 82, 964, 430, "从降水到基流的地下路径", "剖面示意 / cross-section schematic"))
    # Surface and geological layers.
    body.append(rect(62, 142, 908, 74, fill="#eaf7fb", stroke=GRID))
    body.append(path("M 62 216 C 180 188, 265 230, 356 203 C 470 170, 554 225, 658 197 C 769 167, 862 220, 970 190 L 970 470 L 62 470 Z",
                     fill="#d7e5c1", stroke="#82936f", stroke_width=1.3))
    body.append(path("M 62 292 C 194 260, 276 310, 373 281 C 482 248, 577 309, 684 278 C 798 245, 873 299, 970 264 L 970 367 C 850 390, 780 333, 682 366 C 568 402, 475 338, 367 376 C 259 414, 162 350, 62 387 Z",
                     fill="#a87852", stroke="#79563f", stroke_width=1))
    body.append(path("M 62 365 C 181 335, 261 389, 367 356 C 478 322, 570 390, 682 354 C 787 321, 858 372, 970 337 L 970 470 L 62 470 Z",
                     fill="#7f8f8c", stroke="#5e6c6b", stroke_width=1))
    # Aquifer and aquitard bands.
    body.append(path("M 62 250 C 173 220, 263 266, 370 237 C 481 208, 575 271, 685 236 C 795 204, 870 253, 970 224 L 970 304 C 860 333, 784 282, 682 315 C 570 349, 476 282, 367 319 C 258 355, 165 299, 62 332 Z",
                     fill="#d9eff7", stroke=DEEP, stroke_width=1.5))
    body.append(path("M 62 330 C 174 302, 257 346, 370 314 C 478 285, 575 348, 683 311 C 790 278, 865 329, 970 298 L 970 360 C 862 389, 787 338, 683 371 C 570 408, 474 344, 367 381 C 259 416, 165 356, 62 389 Z",
                     fill="#c5aaa0", stroke="#927d75", stroke_width=1))
    body.append(text(85, 175, "地表 / surface", size=13, fill=MUTED, weight=700))
    body.append(text(85, 270, "非承压含水层", size=14, fill=DEEP, weight=800))
    body.append(text(85, 288, "unconfined aquifer", size=11, fill=MUTED))
    body.append(text(85, 351, "隔水层 / aquitard", size=13, fill=PAPER, weight=750))
    body.append(text(85, 430, "承压含水层", size=14, fill=PAPER, weight=800))
    body.append(text(85, 448, "confined aquifer", size=11, fill=PAPER))
    # Water table.
    body.append(path("M 62 258 C 177 228, 263 272, 370 244 C 480 215, 576 278, 684 243 C 793 212, 870 260, 970 231",
                     stroke=COOL, stroke_width=3, dash="9 5"))
    body.append(text(772, 218, "水位 / water table", size=11, fill=COOL, weight=700))
    # Recharge and discharge.
    for xx in [188, 274, 370]:
        body.append(arrow(xx, 190, xx, 246, color=COOL, width=2.5, marker="arrow-small"))
    body.append(text(194, 178, "补给 G", size=12, fill=COOL, weight=750))
    body.append(curved_arrow("M 578 290 C 678 300, 756 333, 856 293", color=DEEP, width=3))
    body.append(text(688, 325, "Darcy 流 q = −K∇h", size=12, fill=DEEP, weight=750))
    body.append(curved_arrow("M 856 293 C 899 267, 928 236, 960 216", color=FOREST, width=3))
    body.append(text(874, 248, "基流 / discharge", size=11, fill=FOREST, weight=750))
    # Pumping cone and well.
    body.append(line(770, 187, 770, 343, stroke=INK, stroke_width=3))
    body.append(path("M 690 259 C 720 285, 746 298, 770 304 C 794 298, 822 284, 850 257", fill="none", stroke=WARM, stroke_width=2, dash="7 5"))
    body.append(text(770, 180, "井 / well", size=11, fill=INK, anchor="middle", weight=700))
    body.append(arrow(770, 338, 770, 292, color=WARM, width=3))
    body.append(text(792, 312, "抽水 W", size=11, fill=WARM, weight=750))
    body.append(schematic_note(56, 489, "剖面、层厚、井影响范围与流线为示意；不用于井位或可采量设计。"))

    body.append(panel(38, 526, 964, 44, "水量账本", ""))
    body.append(text(210, 555, "ΔS = G − W", size=17, weight=800))
    body.append(text(463, 555, "P = R + ET + G", size=15, fill=MUTED, weight=750))
    body.append(text(740, 555, "τ ≈ S/G", size=15, fill=MUTED, weight=750))
    body.append(legend_box(812, 120, 158, [("补给", COOL, True, False), ("流向", DEEP, True, False), ("抽水", WARM, True, False)]))
    save(OUT / "aquifer-cross-section.svg", "含水层的补给、储量与流向",
         "地下水剖面示意展示降水补给、水位、非承压与承压含水层、Darcy 流和抽水影响；剖面层厚与流线范围非等比例。",
         "".join(body))


FIGURES = [
    system_reservoir_map,
    system_timescale_ladder,
    deep_time_clock,
    stratigraphy_dating,
    earth_interior_cutaway,
    seismic_ray_shadow,
    plate_global_map,
    plate_boundary_sections,
    rock_cycle_landscape,
    magma_differentiation,
    critical_zone_section,
    soil_weathering_front,
    watershed_hydrology,
    aquifer_cross_section,
]


def main() -> None:
    for figure in FIGURES:
        figure()
    print(f"generated {len(FIGURES)} figures in {OUT}")


if __name__ == "__main__":
    main()
