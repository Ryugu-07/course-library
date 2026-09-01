#!/usr/bin/env python3
"""Generate the visual-atlas plates for Earth-system lectures 22--28.

These are reproducible teaching schematics.  Their geometry is arranged for
legibility; it is not a map scale, an observing product, or a forecast.
"""

from __future__ import annotations

from pathlib import Path

from svgkit import (
    HEIGHT,
    PALETTE,
    arrow,
    circle,
    curved_arrow,
    ellipse,
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
    text,
    world_map,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
W = 1040
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
WARM = PALETTE["warm"]
COOL = PALETTE["cool"]
GOLD = PALETTE["gold"]
VIOLET = PALETTE["violet"]
DANGER = PALETTE["danger"]


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
    line_height: float = 19,
) -> str:
    """Draw a compact labelled teaching box with fixed line breaks."""
    pieces = [rect(x, y, width, height, radius=8, fill=fill, stroke=stroke)]
    if len(lines) == 1:
        pieces.append(
            text(
                x + width / 2,
                y + height / 2 + size * 0.34,
                lines[0],
                size=size,
                weight=700,
                anchor="middle",
            )
        )
    else:
        top = y + height / 2 - (len(lines) - 1) * line_height / 2 + size * 0.34
        pieces.append(
            multiline(
                x + width / 2,
                top,
                lines,
                size=size,
                line_height=line_height,
                weight=700,
                anchor="middle",
            )
        )
    return "".join(pieces)


def note(x: float, y: float, value: str, *, anchor: str = "start") -> str:
    return text(x, y, value, size=11, fill=MUTED, anchor=anchor)


def section_label(x: float, y: float, value: str, *, color: str = INK) -> str:
    return text(x, y, value, size=14, fill=color, weight=800)


def legend_box(
    x: float,
    y: float,
    width: float,
    rows: list[tuple[str, str, bool, bool]],
) -> str:
    height = 34 + 23 * len(rows)
    pieces = [rect(x, y, width, height, radius=7, fill=PAPER, stroke=GRID)]
    pieces.append(text(x + 14, y + 22, "图例", size=13, weight=750))
    for index, (label, color, line_only, dashed) in enumerate(rows):
        pieces.append(
            legend_item(
                x + 14,
                y + 49 + index * 23,
                label,
                color,
                line_only=line_only,
                dashed=dashed,
            )
        )
    return "".join(pieces)


def metric_row(
    x: float,
    y: float,
    width: float,
    label: str,
    value: str,
    color: str,
) -> str:
    return (
        rect(x, y, width, 42, radius=5, fill=PAPER, stroke=GRID)
        + rect(x, y, 8, 42, radius=4, fill=color, stroke=color)
        + text(x + 20, y + 18, label, size=12, fill=MUTED, weight=700)
        + text(x + width - 16, y + 27, value, size=14, anchor="end", weight=800)
    )


def dashed_path(d: str, *, color: str = MUTED, width: float = 2) -> str:
    return path(d, stroke=color, stroke_width=width, dash="7 6")


def sensor(cx: float, cy: float, color: str, label: str) -> str:
    return (
        circle(cx, cy, 9, fill=PAPER, stroke=color, stroke_width=3)
        + circle(cx, cy, 3, fill=color, stroke=color)
        + text(cx + 14, cy + 5, label, size=11, fill=color, weight=750)
    )


def assimilation_cycle() -> None:
    body = [header("数据同化的时间循环", "22 · 过程机制 | Assimilation cycle")]
    body.append(panel(38, 82, 630, 430, "状态、观测与更新", "每一步都是条件化估计"))
    body.append(
        card(
            276,
            108,
            170,
            62,
            ["分析状态 xᵃₜ", "analysis field"],
            fill="#eef6ed",
            stroke=FOREST,
        )
    )
    body.append(
        card(
            463,
            222,
            148,
            72,
            ["模型推进 Mₜ", "xᵃₜ → xᶠₜ₊₁"],
            fill="#eef5fb",
            stroke=COOL,
            size=13,
        )
    )
    body.append(
        card(
            276,
            394,
            170,
            62,
            ["先验 xᶠₜ₊₁", "forecast state"],
            fill="#fff4e8",
            stroke=WARM,
            size=14,
        )
    )
    body.append(
        card(
            78,
            222,
            148,
            72,
            ["观测 yₜ", "有限采样 + ε"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    body.append(
        card(
            262,
            222,
            188,
            78,
            ["创新与更新", "d = y − Hxᶠ", "xᵃ = xᶠ + Kd"],
            fill="#fff9e6",
            stroke=GOLD,
            size=13,
            line_height=17,
        )
    )
    body.append(curved_arrow("M 447 139 C 506 147, 530 183, 535 222", color=COOL, width=3))
    body.append(curved_arrow("M 537 294 C 535 352, 475 402, 444 423", color=WARM, width=3))
    body.append(arrow(360, 392, 360, 305, color=WARM, width=3))
    body.append(arrow(226, 258, 258, 258, color=VIOLET, width=2.5, dash="7 5"))
    body.append(arrow(356, 219, 356, 174, color=GOLD, width=3))
    body.append(text(472, 186, "动力学方向", size=11, fill=COOL, weight=700))
    body.append(text(232, 342, "观测算子 H", size=11, fill=VIOLET, weight=700))
    body.append(text(376, 354, "过程误差 Q", size=11, fill=WARM, weight=700))
    body.append(text(58, 476, "创新是观测与先验的差；K 由误差协方差决定，不是硬替换。", size=12, fill=MUTED))
    body.append(
        legend_box(
            56,
            332,
            194,
            [
                ("模型 / 状态方向", COOL, True, False),
                ("观测进入", VIOLET, True, True),
                ("不确定性路径", WARM, True, False),
            ],
        )
    )

    body.append(panel(694, 82, 308, 430, "四本证据账", "教学变量"))
    body.append(text(716, 128, "同一状态的四种角色", size=13, fill=MUTED, weight=700))
    body.append(metric_row(716, 146, 264, "模型推进后的先验", "xᶠ, Pᶠ", WARM))
    body.append(metric_row(716, 198, 264, "传感器 / 遥感读数", "y, R", VIOLET))
    body.append(metric_row(716, 250, 264, "创新与权重", "d, K", GOLD))
    body.append(metric_row(716, 302, 264, "更新后的分析", "xᵃ, Pᵃ", FOREST))
    body.append(
        rect(716, 366, 264, 66, radius=7, fill="#fff4e8", stroke=WARM)
        + text(732, 390, "边界提醒", size=12, fill=WARM, weight=800)
        + text(732, 414, "分析场 ≠ 真值；后验 ≠ 观测替身", size=13, weight=750)
    )
    body.append(note(716, 465, "先验、观测、误差模型和更新规则必须可追溯。"))
    body.append(note(38, 554, "循环、箭头和状态空间为教学示意，布局与数量非按比例；合成场景不是实时预报。"))
    save(
        OUT / "assimilation-cycle.svg",
        "数据同化的时间循环",
        "教学示意展示模型先验、有限观测、创新和分析状态之间的循环；箭头方向表示信息与动力学关系，状态空间和不确定性均非按比例，分析场不是地球状态真值。",
        "".join(body),
    )


def inverse_problem_resolution() -> None:
    body = [header("反问题的分辨率与信息方向", "22 · 信息结构 | Inverse resolution")]
    body.append(panel(38, 82, 650, 430, "从隐藏状态到可见信号，再反向估计", "H 是信息瓶颈"))
    body.append(section_label(68, 126, "正问题：给定状态，生成观测", color=COOL))
    body.append(
        card(
            68,
            150,
            156,
            72,
            ["隐藏状态 x", "土壤水 / 温度"],
            fill="#eef6ed",
            stroke=FOREST,
            size=14,
        )
    )
    body.append(arrow(230, 186, 308, 186, color=FOREST, width=3))
    body.append(
        card(
            314,
            150,
            136,
            72,
            ["观测算子 H", "辐射 / 回波"],
            fill="#eef5fb",
            stroke=COOL,
            size=14,
        )
    )
    body.append(arrow(456, 186, 534, 186, color=COOL, width=3))
    body.append(
        card(
            540,
            150,
            112,
            72,
            ["信号 y", "+ 噪声 ε"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    body.append(section_label(68, 286, "反问题：从观测回到估计", color=WARM))
    body.append(
        card(
            68,
            316,
            156,
            72,
            ["信号 y", "有限、带噪"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=14,
        )
    )
    body.append(arrow(230, 352, 308, 352, color=WARM, width=3, dash="8 5"))
    body.append(
        card(
            314,
            316,
            136,
            72,
            ["正则化", "R⁻¹ + λL"],
            fill="#fff9e6",
            stroke=GOLD,
            size=14,
        )
    )
    body.append(arrow(456, 352, 534, 352, color=WARM, width=3, dash="8 5"))
    body.append(
        card(
            540,
            316,
            112,
            72,
            ["估计 x̂", "带区间"],
            fill="#eef6ed",
            stroke=FOREST,
            size=13,
        )
    )
    body.append(dashed_path("M 382 388 C 375 421, 310 433, 262 413", color=GOLD))
    body.append(text(68, 426, "小奇异值方向", size=12, fill=GOLD, weight=750))
    body.append(text(182, 447, "对噪声敏感；先验提供偏好，不凭空增加信息。", size=11, fill=MUTED))
    body.append(text(68, 479, "y = Hx + ε", size=17, weight=800))
    body.append(text(225, 479, "J(x) = ‖y − Hx‖² + λ‖L(x − xᵦ)‖²", size=14, fill=MUTED, weight=700))
    body.append(text(70, 500, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(108, 500, "状态", FOREST, line_only=True))
    body.append(legend_item(230, 500, "观测", COOL, line_only=True))
    body.append(legend_item(350, 500, "反向估计", WARM, line_only=True, dashed=True))

    body.append(panel(714, 82, 288, 430, "可辨识性账本", "分辨率不是像素数"))
    body.append(text(736, 128, "观测维数 m  <  状态维数 n", size=15, weight=800))
    body.append(text(736, 153, "弱方向需要正则化或降维。", size=12, fill=MUTED))
    body.append(text(736, 188, "奇异值 σᵢ", size=13, fill=MUTED, weight=700))
    bars = [("强", 184, COOL), ("中", 126, FOREST), ("弱", 62, GOLD), ("近零", 28, WARM)]
    for index, (label, width, color) in enumerate(bars):
        yy = 207 + index * 38
        body.append(text(736, yy + 16, label, size=12, fill=MUTED, weight=700))
        body.append(rect(780, yy, width, 22, radius=4, fill=color, stroke=color, opacity=.82))
        body.append(text(780 + width + 10, yy + 16, "σ", size=11, fill=MUTED))
    body.append(line(736, 375, 980, 375, stroke=GRID, stroke_width=1))
    body.append(
        card(
            736,
            394,
            244,
            66,
            ["证据边界", "估计依赖 H、R、先验和尺度"],
            fill="#fff4e8",
            stroke=WARM,
            size=13,
        )
    )
    body.append(note(736, 486, "估计场是条件化分析，不是直接观测的真值。"))
    body.append(note(38, 554, "矩形、奇异值和箭头均为示意；合成观测只说明信息方向，不代表任何传感器产品。"))
    save(
        OUT / "inverse-problem-resolution.svg",
        "反问题的分辨率与信息方向",
        "过程示意把正问题的状态到观测方向与反问题的观测到估计方向并列，并显示正则化和小奇异值方向；图中估计是条件化结果，不是分析场真值或预报。",
        "".join(body),
    )


def attribution_fingerprints() -> None:
    body = [header("指纹回归：检测不等于归因", "23 · 证据结构 | Attribution fingerprints")]
    body.append(panel(38, 82, 532, 430, "合成异常序列", "观测 y 与模型指纹 x"))
    body.append(section_label(64, 126, "标准化异常", color=INK))
    body.append(line(78, 416, 522, 416, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(line(78, 416, 78, 150, stroke=INK, stroke_width=2, marker_end="arrow"))
    body.append(text(518, 438, "季节索引", size=11, fill=MUTED, anchor="end"))
    body.append(text(66, 150, "+", size=12, fill=MUTED))
    body.append(text(66, 286, "0", size=12, fill=MUTED))
    body.append(text(66, 414, "−", size=12, fill=MUTED))
    observed = [(88, 327), (126, 310), (164, 323), (202, 278), (240, 294), (278, 247),
                (316, 256), (354, 218), (392, 229), (430, 187), (468, 205), (506, 166)]
    fingerprint = [(88, 337), (126, 326), (164, 314), (202, 303), (240, 292), (278, 280),
                   (316, 269), (354, 258), (392, 246), (430, 235), (468, 223), (506, 212)]
    band_top = [(x, y - 22) for x, y in fingerprint]
    band_bottom = [(x, y + 22) for x, y in reversed(fingerprint)]
    body.append(polygon(band_top + band_bottom, fill="#e9eef2", stroke="none", opacity=.85))
    body.append(polyline(fingerprint, stroke=COOL, stroke_width=3))
    body.append(polyline(observed, stroke=WARM, stroke_width=3))
    for x, y in observed:
        body.append(circle(x, y, 4, fill=WARM, stroke=PAPER, stroke_width=1))
    body.append(text(92, 181, "内部变率带", size=11, fill=MUTED))
    body.append(text(376, 194, "观测异常 y", size=12, fill=WARM, weight=750))
    body.append(text(374, 246, "指纹 x", size=12, fill=COOL, weight=750))
    body.append(text(78, 490, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(112, 490, "观测 y", WARM, line_only=True))
    body.append(legend_item(248, 490, "指纹 x", COOL, line_only=True))
    body.append(legend_item(380, 490, "零假设带", "#aebac4", line_only=False))

    body.append(panel(596, 82, 406, 430, "从信号到系数", "投影 + 区间"))
    body.append(text(622, 126, "向量空间中的一致度", size=14, fill=MUTED, weight=700))
    body.append(line(668, 354, 928, 354, stroke=GRID, stroke_width=1.5))
    body.append(line(724, 408, 724, 166, stroke=GRID, stroke_width=1.5))
    body.append(arrow(724, 354, 880, 239, color=WARM, width=4))
    body.append(arrow(724, 354, 906, 316, color=COOL, width=4))
    body.append(line(880, 239, 906, 316, stroke=GOLD, stroke_width=2, dash="7 5"))
    body.append(text(882, 228, "y", size=15, fill=WARM, weight=800))
    body.append(text(910, 334, "x", size=15, fill=COOL, weight=800))
    body.append(text(800, 333, "ρ", size=16, fill=GOLD, weight=800))
    body.append(text(784, 383, "投影长度 → β̂", size=12, fill=MUTED, anchor="middle"))
    body.append(
        card(
            622,
            142,
            160,
            66,
            ["检测", "信号超出零假设？"],
            fill="#fff4e8",
            stroke=WARM,
            size=14,
        )
    )
    body.append(
        card(
            804,
            142,
            160,
            66,
            ["归因", "与指纹相容？"],
            fill="#eef5fb",
            stroke=COOL,
            size=14,
        )
    )
    body.append(text(622, 454, "β̂ = (xᵀy)/(xᵀx)", size=15, weight=800))
    body.append(text(622, 480, "ρ、Σ、时间窗与零假设共同限定解释。", size=12, fill=MUTED))
    body.append(note(38, 554, "序列、向量和箭头为合成教学示意，不按观测时间或量值比例绘制；归因结果不提供事件预报。"))
    save(
        OUT / "attribution-fingerprints.svg",
        "指纹回归：检测不等于归因",
        "教学示意把合成异常序列、内部变率带和外部强迫指纹放在同一证据图中，并以向量投影说明检测与归因的区别；数值与几何均非真实观测。",
        "".join(body),
    )


def event_attribution_worlds() -> None:
    body = [header("反事实世界如何进入极端事件归因", "23 · 对照实验 | Counterfactual worlds")]
    body.append(panel(38, 82, 964, 430, "改变强迫，比较事件分布", "不是把历史重演一遍"))
    body.append(text(64, 126, "同一事件定义：阈值、时长、区域和观测质量先固定", size=13, fill=MUTED, weight=700))
    worlds = [
        (64, "自然强迫反事实", "control: N", "#eef5fb", COOL),
        (370, "事实世界集合", "all forcings", "#fff4e8", WARM),
        (676, "观测事件窗口", "observed y", "#f3f0fb", VIOLET),
    ]
    for x, title, subtitle, fill, stroke in worlds:
        body.append(rect(x, 156, 258, 190, radius=8, fill=fill, stroke=stroke))
        body.append(text(x + 16, 184, title, size=16, weight=800))
        body.append(text(x + 16, 207, subtitle, size=11, fill=MUTED))
    # Ensemble distributions: the heights are deliberately schematic.
    for index, height in enumerate([32, 54, 82, 104, 88, 58, 34]):
        x = 93 + index * 29
        body.append(rect(x, 320 - height, 18, height, radius=2, fill=COOL, opacity=.66))
    for index, height in enumerate([22, 36, 58, 82, 112, 105, 72]):
        x = 399 + index * 29
        body.append(rect(x, 320 - height, 18, height, radius=2, fill=WARM, opacity=.68))
    for index, height in enumerate([18, 35, 64, 96, 70, 42, 26]):
        x = 705 + index * 29
        body.append(rect(x, 320 - height, 18, height, radius=2, fill=VIOLET, opacity=.7))
    for x in (64, 370, 676):
        body.append(line(x + 28, 320, x + 232, 320, stroke=INK, stroke_width=1.5))
        body.append(text(x + 130, 338, "事件强度 I", size=11, fill=MUTED, anchor="middle"))
    body.append(arrow(322, 250, 360, 250, color=GOLD, width=3, dash="8 5"))
    body.append(arrow(628, 250, 666, 250, color=GOLD, width=3, dash="8 5"))
    body.append(text(341, 234, "对照", size=11, fill=GOLD, anchor="middle", weight=750))
    body.append(text(647, 234, "核验", size=11, fill=GOLD, anchor="middle", weight=750))

    body.append(
        card(
            130,
            376,
            230,
            70,
            ["概率比", "P(event | all) / P(event | N)"],
            fill="#fff9e6",
            stroke=GOLD,
            size=13,
        )
    )
    body.append(
        card(
            405,
            376,
            230,
            70,
            ["强度差", "ΔI = I_all − I_N"],
            fill="#fff9e6",
            stroke=GOLD,
            size=14,
        )
    )
    body.append(
        card(
            680,
            376,
            230,
            70,
            ["证据门", "观测 ≠ 反事实模拟"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=14,
        )
    )
    body.append(text(64, 486, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(100, 486, "自然集合", COOL))
    body.append(legend_item(235, 486, "全强迫集合", WARM))
    body.append(legend_item(390, 486, "观测窗口", VIOLET))
    body.append(note(64, 506, "虚线仅表示对照推断；改变强迫并不自动排除其他机制。"))
    body.append(note(38, 554, "三个世界是情景/观测边界内的教学对象，分布、柱高和比较量非按真实概率比例；不是未来事件预报。"))
    save(
        OUT / "event-attribution-worlds.svg",
        "反事实世界如何进入极端事件归因",
        "教学示意比较自然强迫反事实、全强迫模拟集合和有限观测事件窗口，并显示概率比与强度差；这些世界是条件情景，不是另一条真实历史，也不构成事件预报。",
        "".join(body),
    )


def hazard_processes() -> None:
    body = [header("从物理过程到灾害风险", "24 · 过程机制 | Hazard processes")]
    body.append(panel(38, 82, 964, 430, "三类灾害的物理链", "hazard 先于 risk"))
    body.append(text(64, 124, "事件源", size=13, fill=WARM, weight=800))
    body.append(text(335, 124, "传播 / 转换", size=13, fill=COOL, weight=800))
    body.append(text(610, 124, "局地强度", size=13, fill=VIOLET, weight=800))
    body.append(text(844, 124, "社会账本", size=13, fill=INK, weight=800))

    lanes = [
        (154, "地震", "断层滑动", "地震波", "地面运动", "建筑 / 人口"),
        (244, "火山", "岩浆压力", "灰 / 熔岩 / 碎屑流", "落灰 / 冲击", "基础设施"),
        (334, "海啸", "海底位移", "长波传播", "沿岸淹没", "社区 / 港口"),
    ]
    for y, name, source, transfer, intensity, society in lanes:
        body.append(text(68, y + 34, name, size=16, weight=800))
        body.append(card(146, y, 150, 68, [source, "source"], fill="#fff4e8", stroke=WARM, size=13))
        body.append(arrow(306, y + 34, 350, y + 34, color=WARM, width=3))
        body.append(card(356, y, 194, 68, [transfer, "pathway"], fill="#eef5fb", stroke=COOL, size=13))
        body.append(arrow(560, y + 34, 604, y + 34, color=COOL, width=3))
        body.append(card(610, y, 170, 68, [intensity, "local intensity"], fill="#f3f0fb", stroke=VIOLET, size=13))
        body.append(arrow(790, y + 34, 834, y + 34, color=VIOLET, width=3))
        body.append(card(840, y, 132, 68, [society, "exposure"], fill="#f1f6fa", stroke=LINE, size=12))

    body.append(line(824, 142, 824, 414, stroke=DANGER, stroke_width=2.5, dash="8 5"))
    body.append(text(832, 164, "物理 hazard | 社会风险", size=11, fill=DANGER, weight=800))
    body.append(
        card(
            150,
            430,
            205,
            56,
            ["H：概率 × 强度", "不等于损失"],
            fill="#fff4e8",
            stroke=WARM,
            size=13,
        )
    )
    body.append(
        card(
            394,
            430,
            205,
            56,
            ["E：谁在路径上", "单位必须明确"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    body.append(
        card(
            638,
            430,
            205,
            56,
            ["V：冲击到后果", "能力会改变"],
            fill="#eef6ed",
            stroke=FOREST,
            size=13,
        )
    )
    body.append(text(64, 500, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(102, 500, "物理源", WARM))
    body.append(legend_item(210, 500, "传播", COOL, line_only=True))
    body.append(legend_item(310, 500, "社会层", VIOLET))
    body.append(note(38, 554, "三条链的形状和箭头是机制示意；事件概率、时间窗与空间尺度非按比例，hazard 图不是发生预报。"))
    save(
        OUT / "hazard-processes.svg",
        "从物理过程到灾害风险",
        "教学示意把地震、火山和海啸的源、传播、局地强度与社会暴露分开；hazard、exposure 和 vulnerability 的边界清楚，图示不提供灾害发生时间或损失预报。",
        "".join(body),
    )


def plate_hazard_belts() -> None:
    body = [header("板块带是危险性背景，不是风险预报", "24 · 空间结构 | Hazard belts")]
    body.append(panel(38, 82, 622, 430, "全球板块带教学投影", "示意地图 / not navigation"))
    body.append(world_map(56, 116, 586, 346, title="简化的活动带"))
    map_x, map_y, map_w, map_h = 56, 116, 586, 346
    pacific = [
        project(-170, 52, map_x, map_y, map_w, map_h),
        project(-150, 18, map_x, map_y, map_w, map_h),
        project(-132, -22, map_x, map_y, map_w, map_h),
        project(-112, -52, map_x, map_y, map_w, map_h),
        project(-78, -55, map_x, map_y, map_w, map_h),
        project(-72, -20, map_x, map_y, map_w, map_h),
        project(-80, 8, map_x, map_y, map_w, map_h),
        project(-98, 32, map_x, map_y, map_w, map_h),
    ]
    ridge = [
        project(-35, 65, map_x, map_y, map_w, map_h),
        project(-28, 30, map_x, map_y, map_w, map_h),
        project(-20, -5, map_x, map_y, map_w, map_h),
        project(-15, -38, map_x, map_y, map_w, map_h),
        project(-10, -65, map_x, map_y, map_w, map_h),
    ]
    alpine = [
        project(-10, 35, map_x, map_y, map_w, map_h),
        project(28, 38, map_x, map_y, map_w, map_h),
        project(70, 35, map_x, map_y, map_w, map_h),
        project(105, 32, map_x, map_y, map_w, map_h),
        project(140, 35, map_x, map_y, map_w, map_h),
    ]
    body.append(polyline(pacific, stroke=WARM, stroke_width=4))
    body.append(polyline(ridge, stroke=COOL, stroke_width=3, dash="9 5"))
    body.append(polyline(alpine, stroke=GOLD, stroke_width=3, dash="9 5"))
    for lon, lat, color in [
        (-150, 40, WARM),
        (-118, -30, WARM),
        (142, 36, WARM),
        (30, 36, GOLD),
        (0, -30, COOL),
    ]:
        cx, cy = project(lon, lat, map_x, map_y, map_w, map_h)
        body.append(circle(cx, cy, 6, fill=PAPER, stroke=color, stroke_width=3))
    body.append(text(86, 482, "简化板块带、震源/火山点位；大陆形状、带宽和距离非等比例。", size=11, fill=MUTED))
    body.append(text(74, 505, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(110, 505, "活动带", WARM, line_only=True))
    body.append(legend_item(245, 505, "扩张带", COOL, line_only=True, dashed=True))
    body.append(legend_item(365, 505, "其他带", GOLD, line_only=True, dashed=True))

    body.append(panel(692, 82, 310, 430, "风险边界三本账", "地图只画 hazard"))
    body.append(
        card(
            716,
            134,
            262,
            68,
            ["① Hazard", "源区、传播、强度与频率"],
            fill="#fff4e8",
            stroke=WARM,
            size=14,
        )
    )
    body.append(arrow(847, 207, 847, 232, color=WARM, width=3))
    body.append(
        card(
            716,
            240,
            262,
            68,
            ["② Exposure", "人口、建筑、港口、道路"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=14,
        )
    )
    body.append(arrow(847, 313, 847, 338, color=VIOLET, width=3))
    body.append(
        card(
            716,
            346,
            262,
            68,
            ["③ Vulnerability", "结构、预警、撤离与资源"],
            fill="#eef6ed",
            stroke=FOREST,
            size=13,
        )
    )
    body.append(text(716, 454, "R_toy = H × E × V", size=17, weight=800))
    body.append(text(716, 478, "同一危险带 ≠ 同一风险；不画发生日期。", size=11, fill=MUTED))
    body.append(note(38, 554, "地图为示意性等距圆柱投影，不用于导航、选址或地震/火山发生预报；颜色表示物理活动带，不表示损失等级。"))
    save(
        OUT / "plate-hazard-belts.svg",
        "板块带是危险性背景，不是风险预报",
        "示意地图以简化板块活动带说明物理 hazard 的空间背景，并在旁边分开 exposure 与 vulnerability；地图投影、带宽、点位和距离均非按比例，也不构成风险或事件预报。",
        "".join(body),
    )


def compound_extremes() -> None:
    body = [header("热、旱、洪如何形成复合压力", "25 · 过程机制 | Compound extremes")]
    body.append(panel(38, 82, 964, 430, "边际 hazard + 耦合项", "同一窗口或连续窗口"))
    body.append(text(64, 126, "合成时间窗 t₀ → t₁ → t₂", size=13, fill=MUTED, weight=700))
    body.append(line(170, 146, 940, 146, stroke=INK, stroke_width=1.5, marker_end="arrow"))
    for x, label in [(250, "t₀"), (515, "t₁"), (780, "t₂")]:
        body.append(line(x, 138, x, 459, stroke=GRID, stroke_width=1, dash="5 5"))
        body.append(text(x, 130, label, size=11, fill=MUTED, anchor="middle", weight=700))

    rows = [
        (174, "热 h", WARM, [(202, 180), (470, 90), (735, 72)], "能量需求 / ET"),
        (248, "旱 d", GOLD, [(202, 78), (470, 164), (735, 174)], "土壤水 / 库存"),
        (322, "洪 f", DEEP, [(202, 38), (470, 48), (735, 140)], "集中降雨 / 径流"),
    ]
    for y, label, color, blocks, descriptor in rows:
        body.append(text(68, y + 22, label, size=15, fill=color, weight=800))
        body.append(text(104, y + 22, descriptor, size=11, fill=MUTED))
        for x, height in blocks:
            body.append(rect(x, y + 34 - height / 4, 210, height / 4, radius=4, fill=color, opacity=.72))
    body.append(text(826, 207, "高温", size=11, fill=WARM, weight=700))
    body.append(text(826, 281, "水分亏缺", size=11, fill=GOLD, weight=700))
    body.append(text(826, 355, "强降雨 / 高径流", size=11, fill=DEEP, weight=700))

    body.append(
        card(
            94,
            410,
            174,
            62,
            ["边际压力", "h, d, f ∈ [0, 1]"],
            fill="#f6f9fb",
            stroke=LINE,
            size=13,
        )
    )
    body.append(arrow(280, 441, 342, 441, color=GOLD, width=3))
    body.append(
        card(
            348,
            410,
            174,
            62,
            ["耦合门 κ", "共同驱动 / 记忆"],
            fill="#fff9e6",
            stroke=GOLD,
            size=13,
        )
    )
    body.append(arrow(534, 441, 596, 441, color=GOLD, width=3))
    body.append(
        card(
            602,
            410,
            174,
            62,
            ["复合压力 C", "max + κ·min"],
            fill="#fff4e8",
            stroke=WARM,
            size=13,
        )
    )
    body.append(arrow(788, 441, 850, 441, color=WARM, width=3))
    body.append(
        card(
            856,
            410,
            114,
            62,
            ["风险账", "C × E × V"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=12,
        )
    )
    body.append(text(64, 503, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(100, 503, "热", WARM))
    body.append(legend_item(170, 503, "旱", GOLD))
    body.append(legend_item(240, 503, "洪", DEEP))
    body.append(note(330, 506, "色带高度只是教学编码；耦合不是联合概率，情景不是下一季天气预报。"))
    body.append(note(38, 554, "时间窗、阈值、持续时间与空间范围是情景边界；条带、耦合门和风险边界均非按观测比例。"))
    save(
        OUT / "compound-extremes.svg",
        "热、旱、洪如何形成复合压力",
        "过程示意把热、旱、洪三个边际压力放入同一或连续教学窗口，再通过耦合项连接到复合分数和风险账；色带与时间布局非按比例，合成情景不是天气预报。",
        "".join(body),
    )


def flood_drought_watershed() -> None:
    body = [header("干旱记忆如何放大流域洪水级联", "25 · 空间结构 | Watershed cascade")]
    body.append(panel(38, 82, 610, 430, "流域状态与观测", "俯视示意 / not a forecast map"))
    body.append(path("M 72 198 C 160 148, 232 184, 310 145 C 410 96, 520 158, 616 126 L 616 466 L 72 466 Z",
                     fill="#e1edcf", stroke="#82936f", stroke_width=1.5, opacity=.72))
    contours = [
        "M 88 240 C 176 196, 250 230, 321 194 C 408 150, 500 214, 598 170",
        "M 108 286 C 192 248, 250 274, 329 238 C 414 204, 490 255, 577 218",
        "M 150 338 C 220 302, 276 323, 340 292 C 409 260, 466 307, 540 274",
        "M 207 390 C 260 364, 300 379, 350 353 C 404 328, 438 362, 486 340",
    ]
    for contour in contours:
        body.append(path(contour, stroke="#9ab08e", stroke_width=1.5))
    divide = [(82, 220), (170, 178), (260, 196), (345, 160), (442, 190), (566, 152), (610, 184)]
    body.append(polyline(divide, stroke=VIOLET, stroke_width=3, dash="9 5"))
    body.append(text(90, 211, "分水岭", size=11, fill=VIOLET, weight=750))
    body.append(polyline([(150, 226), (235, 270), (321, 318), (420, 372), (522, 420)],
                          stroke=DEEP, stroke_width=5))
    body.append(polyline([(370, 206), (356, 270), (321, 318)], stroke=DEEP, stroke_width=4))
    body.append(polyline([(526, 220), (468, 282), (420, 372)], stroke=DEEP, stroke_width=4))
    body.append(arrow(486, 400, 548, 430, color=DEEP, width=3))
    body.append(circle(522, 420, 7, fill=WARM, stroke=WARM))
    body.append(text(540, 447, "出口 Q", size=12, fill=WARM, weight=800))
    # A dry storage area and a later rainfall pulse.
    body.append(rect(170, 300, 116, 44, radius=6, fill="#fff4e8", stroke=GOLD))
    body.append(text(228, 327, "土壤储量低", size=12, fill=GOLD, anchor="middle", weight=750))
    for x in [182, 228, 274]:
        body.append(arrow(x, 264, x, 294, color=COOL, width=2, marker="arrow-small"))
    body.append(text(180, 253, "短时强降雨 P", size=11, fill=COOL, weight=750))
    body.append(path("M 164 356 C 230 337, 278 346, 330 334", stroke=GOLD, stroke_width=3, dash="8 5"))
    body.append(text(162, 374, "低入渗 / 快响应", size=11, fill=GOLD, weight=750))
    body.append(sensor(122, 178, COOL, "雨量"))
    body.append(sensor(312, 235, FOREST, "土壤"))
    body.append(sensor(493, 374, VIOLET, "河道"))
    body.append(note(60, 489, "分水岭、等高线、流线和传感器位置均为示意，不按比例。"))
    body.append(text(350, 507, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(390, 507, "降水", COOL, line_only=True))
    body.append(legend_item(480, 507, "状态", GOLD))
    body.append(legend_item(560, 507, "观测点", VIOLET))

    body.append(panel(678, 82, 324, 430, "级联账本", "状态 → 通量 → 暴露"))
    chain = [
        (708, 136, 264, 54, ["旱期状态", "S↓ · 土壤/水库余量"], "#fff4e8", GOLD),
        (708, 206, 264, 54, ["强降雨输入", "P↑ · 时间集中"], "#eef5fb", COOL),
        (708, 276, 264, 54, ["径流路由", "Q = cP + O"], "#eaf5fb", DEEP),
        (708, 346, 264, 54, ["暴露节点", "道路 · 居民 · 取水口"], "#f3f0fb", VIOLET),
    ]
    for x, y, width, height, labels, fill, stroke in chain:
        body.append(card(x, y, width, height, labels, fill=fill, stroke=stroke, size=13))
    for y, color in [(191, GOLD), (261, COOL), (331, DEEP)]:
        body.append(arrow(840, y, 840, y + 14, color=color, width=3))
    body.append(line(694, 420, 986, 420, stroke=DANGER, stroke_width=2, dash="8 5"))
    body.append(text(708, 444, "影响边界：需要 E、V 与恢复时间", size=13, fill=DANGER, weight=800))
    body.append(text(708, 472, "级联方向 ≠ 某地洪水预警", size=12, fill=MUTED))
    body.append(note(38, 554, "这是合成流域情景；观测点是有限代理，状态估计不是事实真值，级联图也不是风险或洪水预报。"))
    save(
        OUT / "flood-drought-watershed.svg",
        "干旱记忆如何放大流域洪水级联",
        "流域示意展示土壤储量低、集中降雨、径流路由和暴露节点之间的可能级联，并将有限观测点与状态分开；地形与网络非按比例，情景不构成洪水预报。",
        "".join(body),
    )


def climate_action_portfolio() -> None:
    body = [header("减缓与适应：同一风险的双路径", "26 · 选择结构 | Climate action portfolio")]
    body.append(panel(38, 82, 964, 430, "两个作用点，两个账本", "情景比较 / not a policy command"))
    body.append(text(66, 126, "上游：累积排放与气候 hazard", size=13, fill=WARM, weight=800))
    body.append(text(66, 302, "下游：暴露系统与残余影响", size=13, fill=COOL, weight=800))
    body.append(
        card(
            66,
            150,
            150,
            68,
            ["排放 E(t)", "累积输入"],
            fill="#fff4e8",
            stroke=WARM,
            size=14,
        )
    )
    body.append(arrow(226, 184, 282, 184, color=WARM, width=3))
    body.append(
        card(
            288,
            150,
            184,
            68,
            ["减缓", "减排 · 清除 · 预算"],
            fill="#fff9e6",
            stroke=GOLD,
            size=14,
        )
    )
    body.append(arrow(482, 184, 540, 184, color=GOLD, width=3))
    body.append(
        card(
            546,
            150,
            174,
            68,
            ["气候 hazard", "强迫 → 响应"],
            fill="#f6f9fb",
            stroke=LINE,
            size=14,
        )
    )
    body.append(arrow(730, 184, 786, 184, color=WARM, width=3))
    body.append(
        card(
            792,
            150,
            176,
            68,
            ["长期风险轨迹", "受累积量影响"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )

    body.append(
        card(
            66,
            326,
            150,
            68,
            ["暴露 E", "谁 / 什么在路径上"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    body.append(arrow(226, 360, 282, 360, color=COOL, width=3))
    body.append(
        card(
            288,
            326,
            184,
            68,
            ["适应", "预警 · 设计 · 恢复"],
            fill="#eef6ed",
            stroke=FOREST,
            size=14,
        )
    )
    body.append(arrow(482, 360, 540, 360, color=FOREST, width=3))
    body.append(
        card(
            546,
            326,
            174,
            68,
            ["残余脆弱性", "V(1 − a)"],
            fill="#eef5fb",
            stroke=COOL,
            size=14,
        )
    )
    body.append(arrow(730, 360, 786, 360, color=COOL, width=3))
    body.append(
        card(
            792,
            326,
            176,
            68,
            ["即时 / 局地风险", "HEV(1 − a)"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    body.append(line(532, 128, 532, 430, stroke=GRID, stroke_width=1.5, dash="7 5"))
    body.append(text(540, 420, "共享 hazard 接口", size=11, fill=MUTED, weight=700))
    body.append(text(66, 456, "减缓账本：B_rem = B₀ − (G − DT)", size=15, weight=800))
    body.append(text(438, 456, "适应账本：R_after = H × E × V × (1 − a)", size=14, fill=MUTED, weight=750))
    body.append(text(66, 500, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(102, 500, "减缓", WARM, line_only=True))
    body.append(legend_item(190, 500, "适应", COOL, line_only=True))
    body.append(legend_item(278, 500, "风险接口", VIOLET))
    body.append(note(420, 505, "减缓和适应可互补，但不能把适应效果从碳预算中扣除。"))
    body.append(note(38, 554, "两条路径、箭头与账本边界是合成情景示意；不代表全球排放路径、政策处方或未来风险预测。"))
    save(
        OUT / "climate-action-portfolio.svg",
        "减缓与适应：同一风险的双路径",
        "过程示意把减缓放在累积排放到气候 hazard 的上游，把适应放在暴露与脆弱性到残余影响的下游；账本和路径为合成情景，非政策指令或风险预报。",
        "".join(body),
    )


def adaptation_risk_chain() -> None:
    body = [header("适应改变风险链的哪个环节？", "26 · 选择结构 | Adaptation risk chain")]
    body.append(panel(38, 82, 964, 430, "从 hazard 到残余影响", "作用点与上限"))
    columns = [
        (66, 148, 166, "Hazard", "热 / 洪 / 旱", WARM, "#fff4e8"),
        (254, 148, 166, "Exposure", "人口 / 设施", VIOLET, "#f3f0fb"),
        (442, 148, 166, "Vulnerability", "结构 / 能力", FOREST, "#eef6ed"),
        (630, 148, 166, "Impact", "健康 / 服务", DANGER, "#fff4e8"),
    ]
    for x, y, width, title, subtitle, color, fill in columns:
        body.append(card(x, y, width, 84, [title, subtitle], fill=fill, stroke=color, size=15))
    for x, color in [(232, WARM), (420, VIOLET), (608, FOREST)]:
        body.append(arrow(x, 190, x + 18, 190, color=color, width=3))
    body.append(text(66, 126, "基线风险链", size=14, fill=INK, weight=800))
    body.append(text(66, 278, "适应杠杆", size=14, fill=COOL, weight=800))
    adaptation = [
        (66, "减暴露", "分区 / 遮荫 / 退让", VIOLET, 238),
        (254, "降脆弱", "加固 / 降温 / 预警", FOREST, 426),
        (442, "增恢复", "备援 / 医疗 / 维护", COOL, 614),
    ]
    for x, title, subtitle, color, target_x in adaptation:
        body.append(
            card(
                x,
                304,
                166,
                70,
                [title, subtitle],
                fill="#eef5fb" if color == COOL else "#f3f0fb",
                stroke=color,
                size=13,
            )
        )
        body.append(arrow(x + 83, 300, target_x, 238, color=color, width=2.5, dash="8 5"))
    body.append(
        card(
            630,
            304,
            166,
            70,
            ["残余影响", "条件函数，不是零"],
            fill="#fff4e8",
            stroke=DANGER,
            size=13,
        )
    )
    body.append(arrow(796, 339, 862, 339, color=DANGER, width=3))
    body.append(
        card(
            862,
            304,
            108,
            70,
            ["恢复时间", "τᵣ"],
            fill="#f6f9fb",
            stroke=LINE,
            size=13,
        )
    )
    body.append(line(66, 402, 970, 402, stroke=GRID, stroke_width=1.5))
    body.append(text(66, 430, "上限与副作用", size=13, fill=GOLD, weight=800))
    body.append(text(184, 430, "提前量 · 覆盖率 · 维护 · 公平 · 水/能/土地反馈", size=13, fill=MUTED))
    body.append(text(66, 490, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(104, 490, "hazard", WARM))
    body.append(legend_item(202, 490, "适应路径", COOL, line_only=True, dashed=True))
    body.append(legend_item(332, 490, "残余影响", DANGER))
    body.append(note(500, 506, "虚线是条件化作用路径；适应不保证降低 hazard，本图不计算具体损失。"))
    body.append(note(38, 554, "链条和节点是非比例教学示意；情景边界由输入、暴露、脆弱性与维护条件给出，不是未来风险预报。"))
    save(
        OUT / "adaptation-risk-chain.svg",
        "适应改变风险链的哪个环节？",
        "教学示意将 hazard、exposure、vulnerability、impact 和恢复时间分开，并标出适应杠杆及其条件上限；节点和箭头非按比例，残余影响不是具体损失预报。",
        "".join(body),
    )


def planetary_climate_comparison() -> None:
    body = [header("三种大气：同一能量骨架，不同表面结果", "27 · 对照实验 | Planetary climates")]
    body.append(panel(38, 82, 964, 430, "行星能量账本", "教学参数 / not live observations"))
    body.append(text(64, 124, "短波入射", size=13, fill=GOLD, weight=800))
    body.append(text(798, 124, "长波逃逸", size=13, fill=COOL, weight=800))
    planets = [
        (92, "金星样", "Venus-like", "#f8e5c6", WARM, "s = 1.9 · A = 0.75", "G = 210 K"),
        (376, "地球样", "Earth-like", "#dff1f7", COOL, "s = 1.0 · A = 0.30", "G = 33 K"),
        (660, "火星样", "Mars-like", "#f3ded1", ROCK, "s = 0.43 · A = 0.25", "G = 8 K"),
    ]
    for x, title, subtitle, fill, color, sunlight, greenhouse in planets:
        body.append(rect(x, 150, 246, 296, radius=8, fill=fill, stroke=color))
        body.append(text(x + 18, 180, title, size=17, weight=800))
        body.append(text(x + 18, 201, subtitle, size=11, fill=MUTED))
        body.append(arrow(x + 123, 213, x + 123, 235, color=GOLD, width=4))
        body.append(text(x + 123, 228, "S(1−A)/4", size=11, fill=GOLD, anchor="middle", weight=750))
        # Atmosphere band thickness is a teaching encoding, not a pressure scale.
        band = 44 if title == "金星样" else 25 if title == "地球样" else 13
        body.append(rect(x + 32, 244, 182, band, radius=8, fill=color, stroke=color, opacity=.28))
        body.append(text(x + 123, 271 if band > 30 else 262, "大气 / 云", size=12, fill=color, anchor="middle", weight=750))
        body.append(circle(x + 123, 332, 45, fill=color, stroke=color, opacity=.78))
        body.append(text(x + 123, 337, "表面", size=14, fill=PAPER, anchor="middle", weight=800))
        body.append(dashed_path(f"M {x + 94} 312 C {x + 66} 285, {x + 62} 245, {x + 76} 222", color=COOL, width=2))
        body.append(text(x + 84, 219, "IR ↑", size=11, fill=COOL, weight=750))
        body.append(text(x + 123, 397, sunlight, size=12, fill=MUTED, anchor="middle", weight=700))
        body.append(text(x + 123, 420, greenhouse, size=12, fill=WARM if title == "金星样" else MUTED, anchor="middle", weight=700))
    body.append(text(64, 481, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(100, 481, "短波", GOLD, line_only=True))
    body.append(legend_item(190, 481, "长波", COOL, line_only=True, dashed=True))
    body.append(legend_item(280, 481, "G", WARM, line_only=True))
    body.append(text(394, 482, "F_abs = sS₀(1−A)/4", size=17, weight=800))
    body.append(text(394, 507, "Tₑ = (F_abs/σ)¹ᐟ⁴；Tₛ = Tₑ + G", size=14, fill=MUTED, weight=750))
    body.append(note(38, 554, "三列、气氛厚度、颜色和参数为机制对照示意；不按行星尺度或实测压强绘制，也不预测行星未来状态。"))
    save(
        OUT / "planetary-climate-comparison.svg",
        "三种大气：同一能量骨架，不同表面结果",
        "教学示意用相同的顶层能量收支骨架比较金星样、地球样和火星样大气；入射、温室偏移和气氛厚度是教学参数，图形非比例且不是行星观测或未来预测。",
        "".join(body),
    )


def habitable_zone_context() -> None:
    body = [header("宜居带只是边界条件的一部分", "27 · 空间结构 | Habitable-zone context")]
    body.append(panel(38, 82, 610, 430, "轨道照度的教学背景", "相对几何 / not a scale model"))
    body.append(circle(208, 292, 42, fill="#f6d47a", stroke=GOLD, stroke_width=2))
    body.append(circle(208, 292, 18, fill="#f4b83f", stroke=GOLD, stroke_width=1))
    body.append(text(208, 298, "恒星", size=13, anchor="middle", weight=800))
    body.append(ellipse(208, 292, 112, 74, fill="none", stroke="#e3c36c", stroke_width=2))
    body.append(ellipse(208, 292, 182, 121, fill="none", stroke=COOL, stroke_width=2))
    body.append(ellipse(208, 292, 258, 172, fill="none", stroke="#c8a27a", stroke_width=2))
    body.append(path("M 322 226 A 182 121 0 0 1 322 358", fill="none", stroke="#bfe2f2", stroke_width=36, opacity=.45))
    body.append(text(348, 184, "教学宜居带", size=14, fill=COOL, weight=800))
    body.append(text(348, 204, "仅表示一段照度条件", size=11, fill=MUTED))
    for cx, cy, label, color in [(290, 239, "金星", WARM), (390, 292, "地球", FOREST), (466, 292, "火星", ROCK)]:
        body.append(circle(cx, cy, 11, fill=color, stroke=PAPER, stroke_width=2))
        body.append(text(cx + 16, cy + 5, label, size=12, fill=color, weight=800))
    body.append(arrow(88, 454, 314, 454, color=GOLD, width=3))
    body.append(text(88, 438, "相对照度", size=12, fill=GOLD, weight=750))
    body.append(text(314, 471, "S ∝ d⁻²", size=16, weight=800, anchor="end"))
    body.append(note(60, 491, "轨道线、带宽与行星点位是概念布局，距离和大小非按比例。"))
    body.append(text(360, 503, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(398, 503, "轨道", "#c8a27a", line_only=True))
    body.append(legend_item(480, 503, "照度带", COOL, line_only=True))
    body.append(legend_item(565, 503, "行星点", FOREST))

    body.append(panel(678, 82, 324, 430, "从照度到表面状态", "条件链"))
    body.append(
        card(
            708,
            132,
            264,
            62,
            ["轨道边界", "入射能量 / 反照率"],
            fill="#fff9e6",
            stroke=GOLD,
            size=14,
        )
    )
    body.append(arrow(840, 200, 840, 226, color=GOLD, width=3))
    body.append(
        card(
            708,
            236,
            264,
            62,
            ["大气边界", "组成 / 云 / 光谱"],
            fill="#eef5fb",
            stroke=COOL,
            size=14,
        )
    )
    body.append(arrow(840, 304, 840, 330, color=COOL, width=3))
    body.append(
        card(
            708,
            340,
            264,
            62,
            ["历史与反馈", "水、碳、热惯性"],
            fill="#eef6ed",
            stroke=FOREST,
            size=14,
        )
    )
    body.append(text(708, 444, "同一宜居带 ≠ 同一表面温度", size=14, fill=DANGER, weight=800))
    body.append(text(708, 470, "需要观测/模型共同约束表面状态。", size=11, fill=MUTED))
    body.append(note(38, 554, "轨道示意不是天体历表；宜居带与条件链用于拆分机制，不是宜居性判定或行星气候预报。"))
    save(
        OUT / "habitable-zone-context.svg",
        "宜居带只是边界条件的一部分",
        "空间与过程示意把相对轨道照度、教学宜居带和大气/反馈条件链分开；轨道几何与带宽非按比例，宜居带本身不是表面状态观测或未来预测。",
        "".join(body),
    )


def digital_twin_architecture() -> None:
    body = [header("流域数字孪生的可追溯架构", "28 · 系统架构 | Digital twin")]
    body.append(panel(38, 82, 964, 430, "模型、数据、场景和证据分层", "闭合 ≠ 正确"))
    body.append(text(64, 124, "输入与边界", size=13, fill=GOLD, weight=800))
    body.append(text(298, 124, "过程与状态", size=13, fill=FOREST, weight=800))
    body.append(text(558, 124, "观测与更新", size=13, fill=COOL, weight=800))
    body.append(text(800, 124, "影响与决策接口", size=13, fill=VIOLET, weight=800))
    body.append(
        card(
            64,
            154,
            188,
            76,
            ["情景输入", "P · ET · I · 参数组"],
            fill="#fff9e6",
            stroke=GOLD,
            size=14,
        )
    )
    body.append(arrow(260, 192, 302, 192, color=GOLD, width=3))
    body.append(
        card(
            308,
            154,
            210,
            76,
            ["过程模型", "守恒 · 通量 · 参数化"],
            fill="#eef6ed",
            stroke=FOREST,
            size=14,
        )
    )
    body.append(arrow(526, 192, 568, 192, color=FOREST, width=3))
    body.append(
        card(
            574,
            154,
            206,
            76,
            ["状态 / 分析场", "S · Q · 估计区间"],
            fill="#eef5fb",
            stroke=COOL,
            size=14,
        )
    )
    body.append(arrow(788, 192, 830, 192, color=COOL, width=3))
    body.append(
        card(
            836,
            154,
            136,
            76,
            ["影响接口", "H · E · V"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=13,
        )
    )
    # Observation lane enters the state update, without pretending to be the state.
    body.append(
        card(
            64,
            286,
            188,
            76,
            ["观测数据", "雨量 · 水位 · 卫星"],
            fill="#f3f0fb",
            stroke=VIOLET,
            size=14,
        )
    )
    body.append(dashed_path("M 260 324 C 350 270, 458 262, 568 232", color=VIOLET, width=3))
    body.append(text(310, 278, "H + R", size=12, fill=VIOLET, weight=800))
    body.append(
        card(
            308,
            286,
            210,
            76,
            ["证据更新", "创新 · K · 拒绝规则"],
            fill="#fff4e8",
            stroke=WARM,
            size=14,
        )
    )
    body.append(arrow(526, 324, 568, 324, color=WARM, width=3, dash="8 5"))
    body.append(text(540, 310, "条件化", size=11, fill=WARM, weight=750))
    body.append(dashed_path("M 676 286 C 676 257, 676 244, 676 232", color=WARM, width=3))
    body.append(
        card(
            574,
            286,
            206,
            76,
            ["诊断", "守恒 · 创新 · 缺测"],
            fill="#f6f9fb",
            stroke=LINE,
            size=14,
        )
    )
    body.append(
        card(
            836,
            286,
            136,
            76,
            ["风险出口", "不是损失预言"],
            fill="#fff4e8",
            stroke=DANGER,
            size=12,
        )
    )
    body.append(arrow(788, 324, 830, 324, color=VIOLET, width=3))
    body.append(line(64, 406, 972, 406, stroke=GRID, stroke_width=1.5))
    body.append(
        rect(64, 426, 908, 58, radius=7, fill="#f6f9fb", stroke=GRID)
        + text(84, 451, "证据层 / provenance", size=13, fill=INK, weight=800)
        + text(278, 451, "版本 · 时间戳 · 单位 · 随机种子 · 诊断 · 不确定性", size=13, fill=MUTED, weight=700)
    )
    body.append(text(64, 503, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(100, 503, "模型", FOREST, line_only=True))
    body.append(legend_item(200, 503, "观测", VIOLET, line_only=True, dashed=True))
    body.append(legend_item(300, 503, "推断", WARM, line_only=True, dashed=True))
    body.append(note(420, 503, "场景是条件输入，分析场是估计，数据是有限采样；三者不可互换。"))
    body.append(note(38, 554, "架构层、连接和反馈是系统示意；不按真实流域尺寸绘制，闭合账本不等于真实预报能力。"))
    save(
        OUT / "digital-twin-architecture.svg",
        "流域数字孪生的可追溯架构",
        "架构示意将情景输入、过程模型、状态估计、有限观测、更新诊断、影响接口和 provenance 分层；连接表示条件化信息流，分析场不是现实真值，系统不产生自动预报。",
        "".join(body),
    )


def watershed_observation_network() -> None:
    body = [header("一条流域需要怎样的观测网", "28 · 空间结构 | Observation network")]
    body.append(panel(38, 82, 616, 430, "多源观测覆盖不同状态", "空间网络示意 / not to scale"))
    body.append(path("M 62 194 C 150 150, 236 176, 316 136 C 418 84, 518 158, 632 122 L 632 468 L 62 468 Z",
                     fill="#e1edcf", stroke="#82936f", stroke_width=1.5, opacity=.72))
    for contour in [
        "M 76 237 C 160 198, 240 224, 319 188 C 410 146, 510 214, 620 166",
        "M 98 290 C 182 250, 242 278, 328 240 C 416 204, 502 263, 598 222",
        "M 142 345 C 220 311, 280 332, 340 302 C 417 267, 476 316, 558 282",
        "M 198 397 C 258 372, 300 389, 354 359 C 412 332, 452 361, 502 346",
    ]:
        body.append(path(contour, stroke="#9ab08e", stroke_width=1.5))
    body.append(polyline([(78, 218), (158, 176), (248, 195), (338, 158), (440, 188), (560, 148), (625, 181)],
                          stroke=VIOLET, stroke_width=3, dash="9 5"))
    body.append(text(82, 208, "分水岭", size=11, fill=VIOLET, weight=750))
    body.append(polyline([(148, 224), (232, 270), (324, 326), (430, 386), (542, 432)],
                          stroke=DEEP, stroke_width=5))
    body.append(polyline([(378, 210), (355, 270), (324, 326)], stroke=DEEP, stroke_width=4))
    body.append(polyline([(548, 214), (490, 282), (430, 386)], stroke=DEEP, stroke_width=4))
    body.append(circle(542, 432, 7, fill=WARM, stroke=WARM))
    body.append(text(558, 438, "出口", size=12, fill=WARM, weight=800))
    body.append(sensor(126, 174, COOL, "雨量站"))
    body.append(sensor(224, 262, FOREST, "土壤湿度"))
    body.append(sensor(410, 382, VIOLET, "河道水位"))
    body.append(sensor(526, 306, ROCK, "地下水井"))
    body.append(ellipse(326, 238, 96, 24, fill="none", stroke=GOLD, stroke_width=2))
    body.append(text(326, 232, "卫星过境 / 代理观测", size=11, fill=GOLD, anchor="middle", weight=750))
    body.append(dashed_path("M 324 238 C 400 252, 472 286, 526 306", color=GOLD, width=2))
    body.append(note(58, 491, "站点、卫星足迹、河网和分水岭为示意；空间覆盖与距离非按比例。"))
    body.append(text(352, 507, "图例", size=11, fill=MUTED, weight=750))
    body.append(legend_item(390, 507, "现场", FOREST))
    body.append(legend_item(470, 507, "遥感", GOLD, line_only=True, dashed=True))
    body.append(legend_item(560, 507, "河网", DEEP, line_only=True))

    body.append(panel(684, 82, 318, 430, "观测算子账本", "看见什么 ≠ 状态本身"))
    body.append(text(708, 126, "数据源", size=13, fill=MUTED, weight=700))
    body.append(text(850, 126, "约束对象", size=13, fill=MUTED, weight=700))
    body.append(line(706, 138, 980, 138, stroke=GRID, stroke_width=1))
    rows = [
        ("雨量站", "P_t", COOL),
        ("土壤探头", "θ / S", FOREST),
        ("水位计", "H(Q)", VIOLET),
        ("卫星代理", "H(S) + ε", GOLD),
        ("地下水井", "h_g", ROCK),
    ]
    for index, (source, target, color) in enumerate(rows):
        yy = 158 + index * 46
        body.append(rect(708, yy, 14, 14, radius=3, fill=color, stroke=color))
        body.append(text(736, yy + 12, source, size=13, weight=700))
        body.append(text(850, yy + 12, target, size=13, fill=MUTED, weight=750))
        body.append(line(706, yy + 31, 980, yy + 31, stroke=GRID, stroke_width=1))
    body.append(
        card(
            708,
            404,
            272,
            62,
            ["误差账本", "仪器 · 代表性 · 缺测 · 同步"],
            fill="#fff4e8",
            stroke=WARM,
            size=13,
        )
    )
    body.append(text(708, 492, "代理观测约束状态，不把分析场变成真值。", size=11, fill=MUTED))
    body.append(note(38, 554, "观测网是有限采样和观测算子示意；站点选择、流域范围与信号方向不用于实时监测或水文预报。"))
    save(
        OUT / "watershed-observation-network.svg",
        "一条流域需要怎样的观测网",
        "流域空间示意展示雨量站、土壤湿度、河道水位、地下水井和卫星代理观测如何覆盖不同状态；站点和足迹非按比例，观测只提供有限约束，不是状态真值或预报。",
        "".join(body),
    )


FIGURES = [
    assimilation_cycle,
    inverse_problem_resolution,
    attribution_fingerprints,
    event_attribution_worlds,
    hazard_processes,
    plate_hazard_belts,
    compound_extremes,
    flood_drought_watershed,
    climate_action_portfolio,
    adaptation_risk_chain,
    planetary_climate_comparison,
    habitable_zone_context,
    digital_twin_architecture,
    watershed_observation_network,
]


def main() -> None:
    for figure in FIGURES:
        figure()
    print(f"generated {len(FIGURES)} figures in {OUT}")


if __name__ == "__main__":
    main()
