#!/usr/bin/env python3
"""Generate the 15-21 Earth-system visual-atlas plates."""

from __future__ import annotations

from pathlib import Path

from svgkit import (
    HEIGHT,
    PALETTE,
    WIDTH,
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
ICE = PALETTE["ice"]
WARM = PALETTE["warm"]
COOL = PALETTE["cool"]
GOLD = PALETTE["gold"]
VIOLET = PALETTE["violet"]
DANGER = PALETTE["danger"]

W = WIDTH
H = HEIGHT


def card(
    x: float,
    y: float,
    width: float,
    height: float,
    lines: list[str],
    *,
    fill: str = PAPER,
    stroke: str = LINE,
    size: float = 14,
    line_height: float = 19,
) -> str:
    """Add a compact teaching card with deliberate line breaks."""
    pieces = [rect(x, y, width, height, radius=7, fill=fill, stroke=stroke)]
    if len(lines) == 1:
        pieces.append(text(x + width / 2, y + height / 2 + size * 0.34, lines[0],
                           size=size, weight=750, anchor="middle"))
    else:
        start_y = y + height / 2 - (len(lines) - 1) * line_height / 2 + size * 0.34
        pieces.append(multiline(x + width / 2, start_y, lines, size=size,
                                line_height=line_height, weight=750, anchor="middle"))
    return "".join(pieces)


def note(x: float, y: float, value: str, *, anchor: str = "start", size: float = 11) -> str:
    return text(x, y, value, size=size, fill=MUTED, anchor=anchor)


def legend_box(
    x: float,
    y: float,
    width: float,
    rows: list[tuple[str, str, bool, bool]],
    *,
    title: str = "图例",
) -> str:
    height = 30 + 19 * len(rows)
    pieces = [rect(x, y, width, height, radius=7, fill=PAPER, stroke=GRID)]
    pieces.append(text(x + 14, y + 20, title, size=13, weight=750))
    for index, (label, color, line_only, dashed) in enumerate(rows):
        pieces.append(legend_item(x + 14, y + 43 + index * 19, label, color,
                                  line_only=line_only, dashed=dashed))
    return "".join(pieces)


def dashed_path(d: str, color: str = MUTED, width: float = 2) -> str:
    return path(d, stroke=color, stroke_width=width, dash="7 5")


def scale_ribbon(x: float, y: float, labels: list[str], colors: list[str], width: float) -> str:
    """A horizontal support-scale ribbon used where a scale is the lesson."""
    step = width / (len(labels) - 1)
    pieces = [line(x, y, x + width, y, stroke=LINE, stroke_width=2)]
    for index, (label, color) in enumerate(zip(labels, colors)):
        xx = x + index * step
        pieces.append(circle(xx, y, 7, fill=color, stroke=PAPER, stroke_width=2))
        pieces.append(text(xx, y + 25, label, size=11, fill=MUTED,
                           anchor="middle", weight=650))
        if index < len(labels) - 1:
            pieces.append(arrow(xx + 11, y, xx + step - 11, y, color=color, width=2,
                                marker="arrow-small"))
    return "".join(pieces)


def carbon_cycle_landscape() -> None:
    body = [header("碳库、通量与时间窗口", "15 · 空间结构 | Carbon landscape")]
    body.append(panel(38, 82, 570, 452, "全球地景：碳库在哪里，通量怎样连接", "schematic · not to scale"))
    body.append(world_map(56, 124, 534, 254, title="示意全球地景"))
    body.append(ellipse(320, 146, 180, 20, fill="none", stroke=COOL, stroke_width=2))
    body.append(text(320, 142, "大气：可交换的 CO₂", size=12, fill=COOL, anchor="middle", weight=700))

    forest_x, forest_y = project(-105, 42, 56, 124, 534, 254)
    ocean_x, ocean_y = project(20, -8, 56, 124, 534, 254)
    deep_x, deep_y = project(155, -42, 56, 124, 534, 254)
    body.append(circle(forest_x, forest_y, 9, fill=FOREST, stroke=PAPER, stroke_width=2))
    body.append(text(forest_x + 14, forest_y + 4, "植被 / 土壤", size=12, weight=700))
    body.append(circle(ocean_x, ocean_y, 9, fill=DEEP, stroke=PAPER, stroke_width=2))
    body.append(text(ocean_x + 14, ocean_y + 4, "表层海洋", size=12, fill=DEEP, weight=700))
    body.append(circle(deep_x, deep_y, 9, fill=ROCK, stroke=PAPER, stroke_width=2))
    body.append(text(deep_x - 12, deep_y + 24, "沉积 / 岩石慢库", size=12, fill=INK, weight=700, anchor="middle"))
    body.append(curved_arrow(f"M 320 166 C 260 183, {forest_x + 8:.0f} {forest_y - 25:.0f}, {forest_x:.0f} {forest_y:.0f}",
                             color=FOREST, width=3))
    body.append(curved_arrow(f"M 350 166 C 390 190, {ocean_x - 8:.0f} {ocean_y - 32:.0f}, {ocean_x:.0f} {ocean_y:.0f}",
                             color=COOL, width=3))
    body.append(curved_arrow(f"M {ocean_x:.0f} {ocean_y + 10:.0f} C 430 318, {deep_x + 25:.0f} {deep_y - 16:.0f}, {deep_x:.0f} {deep_y:.0f}",
                             color=DEEP, width=3))
    body.append(curved_arrow(f"M {deep_x - 8:.0f} {deep_y - 5:.0f} C 470 287, 420 235, 386 177",
                             color=GOLD, width=2, dash="7 5"))
    body.append(text(397, 242, "慢交换 / 延迟返回", size=11, fill=GOLD, weight=700))

    stages = [
        ("快库", "叶片 · 土壤", "日–世纪", "#edf7ed", FOREST),
        ("中库", "表层 · 深海", "年–千年", "#eaf6fb", DEEP),
        ("慢库", "沉积 · 岩石", "千年–百万年", "#f7f0e9", ROCK),
    ]
    for index, (title, detail, timescale, fill, stroke) in enumerate(stages):
        x = 58 + index * 174
        body.append(card(x, 408, 160, 82, [title, detail, timescale], fill=fill, stroke=stroke,
                         size=13, line_height=17))
        if index < 2:
            body.append(arrow(x + 164, 449, x + 172, 449, color=LINE, width=2, marker="arrow-small"))

    body.append(panel(632, 82, 370, 452, "同一份碳预算的两种语言", "S = storage · F = flux"))
    body.append(text(654, 124, "储库 S", size=13, fill=MUTED, weight=700))
    body.append(text(844, 124, "示意容量", size=13, fill=MUTED, weight=700))
    body.append(line(654, 136, 980, 136, stroke=GRID, stroke_width=1))
    rows = [
        ("大气", "可交换", 118, SKY, COOL),
        ("陆地生物圈", "季节性", 188, LAND, FOREST),
        ("海洋无机碳", "缓冲", 244, OCEAN, DEEP),
        ("沉积 / 岩石", "长期", 304, ROCK, GOLD),
    ]
    for index, (name, descriptor, bar_width, fill, stroke) in enumerate(rows):
        yy = 164 + index * 45
        body.append(rect(654, yy - 16, 16, 16, radius=3, fill=fill, stroke=stroke))
        body.append(text(680, yy - 3, name, size=13, weight=700))
        body.append(text(796, yy - 3, descriptor, size=11, fill=MUTED))
        body.append(rect(878, yy - 12, bar_width / 2.3, 14, radius=3, fill=fill, stroke=stroke))
        body.append(line(654, yy + 14, 980, yy + 14, stroke=GRID, stroke_width=1))
    body.append(text(654, 358, "守恒式", size=13, fill=MUTED, weight=700))
    body.append(text(654, 385, "dS/dt = ΣFᵢₙ − ΣFₒᵤₜ", size=18, weight=800))
    body.append(text(654, 407, "箱子画储量；箭头画单位时间穿过边界的量。", size=11, fill=MUTED))
    body.append(legend_box(765, 420, 220, [
        ("储库 / storage", LAND, False, False),
        ("通量 / flux", COOL, True, False),
        ("慢或延迟路径", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 15A：地图和容量条只表达储库类别与相对连接；地理边界、面积、通量和数值均非比例。"))
    save(OUT / "carbon-cycle-landscape.svg", "碳库、通量与时间窗口",
         "空间教学示意把大气、陆地生物圈、海洋无机碳和沉积岩石作为不同储库，并以实线通量和虚线慢交换连接；地图与容量条均非比例。",
         "".join(body))


def ocean_carbon_pumps() -> None:
    body = [header("海洋如何搬运而不是删除碳", "15 · 过程机制 | Ocean carbon pumps")]
    body.append(panel(38, 82, 520, 456, "海洋碳泵的垂向剖面", "surface → deep ocean"))
    body.append(rect(78, 136, 440, 328, fill="url(#ocean-depth)", stroke=LINE, stroke_width=1.5))
    body.append(rect(78, 136, 440, 68, fill="#8fd5eb", opacity=.82))
    body.append(line(78, 204, 518, 204, stroke=PAPER, stroke_width=1.5, dash="6 4"))
    body.append(text(92, 157, "大气", size=13, fill=INK, weight=750))
    body.append(text(92, 190, "混合层", size=12, fill=INK, weight=700))
    body.append(text(92, 226, "温跃层 / 交换变慢", size=12, fill=PAPER, weight=700))
    body.append(text(92, 445, "深海储存：不是永久删除", size=12, fill=PAPER, weight=700))

    body.append(curved_arrow("M 170 149 C 142 190, 146 264, 184 332 C 199 360, 206 405, 218 443",
                             color=COOL, width=4))
    body.append(text(122, 285, "溶解度泵", size=12, fill=COOL, weight=800))
    body.append(text(122, 302, "冷水携带 DIC ↓", size=11, fill=PAPER))
    for xx, yy in [(294, 171), (319, 179), (342, 165), (365, 187)]:
        body.append(circle(xx, yy, 7, fill=FOREST, stroke=PAPER, stroke_width=1.5))
    body.append(curved_arrow("M 330 194 C 322 238, 330 295, 354 342 C 366 367, 370 399, 378 437",
                             color=FOREST, width=4))
    body.append(text(368, 274, "生物泵", size=12, fill=FOREST, weight=800))
    body.append(text(368, 291, "颗粒有机碳 ↓", size=11, fill=PAPER))
    for yy in (228, 268, 311, 358, 401):
        body.append(circle(365 + (yy % 3) * 8, yy, 4, fill=FOREST, stroke=PAPER, stroke_width=1))
    body.append(arrow(442, 180, 442, 239, color=GOLD, width=3))
    body.append(arrow(442, 239, 442, 298, color=GOLD, width=3))
    body.append(text(452, 218, "CO₂(aq)", size=11, fill=PAPER, weight=700))
    body.append(text(452, 279, "DIC / 碳酸盐", size=11, fill=PAPER, weight=700))
    body.append(curved_arrow("M 470 442 C 480 372, 476 282, 462 210", color=DEEP, width=3))
    body.append(text(402, 428, "上涌 / 返回", size=11, fill=PAPER, weight=700))

    body.append(panel(584, 82, 418, 490, "三条路径，三种边界", "pump ≠ sink forever"))
    body.append(card(616, 128, 354, 70, ["溶解度泵", "CO₂(g) → CO₂(aq) → DIC", "温度、盐度、混合层控制"],
                     fill="#eaf6fb", stroke=COOL, size=13, line_height=17))
    body.append(arrow(793, 202, 793, 222, color=COOL, width=2, marker="arrow-small"))
    body.append(card(616, 226, 354, 70, ["生物泵", "浮游植物 → 颗粒有机碳 ↓", "生产、食物网和再矿化"],
                     fill="#edf7ed", stroke=FOREST, size=13, line_height=17))
    body.append(arrow(793, 300, 793, 320, color=FOREST, width=2, marker="arrow-small"))
    body.append(card(616, 324, 354, 70, ["碳酸盐缓冲", "CO₂(aq) ⇌ HCO₃⁻ ⇌ CO₃²⁻", "吸收伴随酸化代价"],
                     fill="#f7f0e9", stroke=GOLD, size=13, line_height=17))
    body.append(text(616, 430, "时间窗口", size=13, fill=MUTED, weight=750))
    body.append(text(616, 452, "海气交换：日–年   ·   生物输出：周–年", size=12, weight=700))
    body.append(text(616, 473, "深海再分配：十年–千年   ·   埋藏：更慢", size=12, fill=MUTED))
    body.append(legend_box(748, 478, 222, [
        ("物理输送", COOL, True, False),
        ("生物转化", FOREST, True, False),
        ("延迟 / 边界依赖", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 15B：深海箭头表示再分配和时间延迟；虚线只用于边界依赖或难以直接观测的路径。"))
    save(OUT / "ocean-carbon-pumps.svg", "海洋如何搬运而不是删除碳",
         "过程示意把溶解度泵、生物泵和碳酸盐缓冲放在海洋剖面中；箭头表示搬运或转化，时间标签和酸化边界说明海洋吸收不是永久删除。",
         "".join(body))


def biosphere_biomes() -> None:
    body = [header("群系是碳循环的空间拼图", "16 · 空间结构 | Biome mosaic")]
    body.append(panel(38, 82, 610, 456, "纬度带中的群系与碳库", "schematic latitude bands"))
    body.append(world_map(58, 122, 570, 286, title="颜色表示群系带，不表示生产力排名"))
    bands = [
        (66, 90, "苔原 / 冻土", COOL, .19),
        (50, 66, "北方针叶林", DEEP, .15),
        (23, 50, "温带森林", FOREST, .12),
        (-23, 23, "热带森林 / 草原", "#86a64b", .20),
        (-50, -23, "南温带", GOLD, .12),
        (-90, -50, "冰雪与荒漠", ICE, .24),
    ]
    for high, low, label, color, opacity in bands:
        top = project(0, high, 58, 122, 570, 286)[1]
        bottom = project(0, low, 58, 122, 570, 286)[1]
        body.append(rect(58, top, 570, bottom - top, fill=color, opacity=opacity))
        if high - low > 20:
            body.append(text(74, (top + bottom) / 2 + 4, label, size=11, fill=INK, weight=700))
    for lon, lat, label, color in [
        (-75, 0, "雨林", FOREST), (20, 50, "温带", GOLD), (100, 60, "针叶林", DEEP),
        (25, -70, "冰雪", COOL),
    ]:
        xx, yy = project(lon, lat, 58, 122, 570, 286)
        body.append(circle(xx, yy, 7, fill=color, stroke=PAPER, stroke_width=2))
        body.append(text(xx + 11, yy + 4, label, size=11, fill=INK, weight=700))
    body.append(note(64, 430, "群系边界随水分、温度、土壤、扰动和季节移动；地图非导航比例。"))
    body.append(text(64, 462, "证据支持尺度", size=13, fill=MUTED, weight=750))
    body.append(scale_ribbon(92, 480, ["叶片", "样地", "通量塔", "像元"], [FOREST, GOLD, COOL, VIOLET], 470))

    body.append(panel(674, 82, 328, 456, "群系的碳账本", "limitation can move"))
    biome_rows = [
        ("热带森林", "生物量 C", "光 / N / P", FOREST, "#edf7ed"),
        ("温带草地", "土壤 C", "水分 / 火扰动", GOLD, "#faf5e6"),
        ("冻土苔原", "土壤 C", "解冻 / 呼吸", COOL, "#eaf6fb"),
    ]
    for index, (name, storage, limit, color, fill) in enumerate(biome_rows):
        yy = 128 + index * 78
        body.append(rect(696, yy, 284, 62, radius=7, fill=fill, stroke=color))
        body.append(rect(708, yy + 14, 12, 34, radius=3, fill=color, stroke=color))
        body.append(text(734, yy + 23, name, size=14, weight=750))
        body.append(text(734, yy + 43, f"储存：{storage} · 限制：{limit}", size=11, fill=MUTED))
    body.append(text(696, 382, "最小资源门", size=13, fill=MUTED, weight=750))
    body.append(text(696, 408, "GPP = GPPₘₐₓ · min(L, N, W)", size=16, weight=800))
    body.append(text(696, 430, "生产力增加 ≠ 长期碳汇增加", size=12, fill=WARM, weight=750))
    body.append(legend_box(752, 444, 228, [
        ("群系 / 储库类别", FOREST, False, False),
        ("资源限制", GOLD, False, False),
        ("观测支持尺度", VIOLET, True, False),
    ]))
    body.append(note(38, 574, "图 16A：群系带、碳库位置和观测尺度是概念层级；颜色不表示好坏或全球平均大小。"))
    save(OUT / "biosphere-biomes.svg", "群系是碳循环的空间拼图",
         "空间示意用纬度带和群系节点展示生物圈碳库的空间异质性，并将叶片、样地、通量塔和像元作为不同支持尺度；群系边界与面积非比例。",
         "".join(body))


def nitrogen_cycle() -> None:
    body = [header("氮循环把生物圈接上大气与水", "16 · 过程机制 | Nitrogen cycle")]
    body.append(panel(38, 82, 622, 456, "氮的形态转换与出口", "pools + fluxes"))
    body.append(card(264, 126, 170, 58, ["大气氮库", "N₂"], fill="#eaf6fb", stroke=COOL, size=16))
    body.append(card(112, 244, 166, 66, ["生物量", "有机 N"], fill="#edf7ed", stroke=FOREST))
    body.append(card(300, 372, 180, 66, ["土壤有机质", "有机 N"], fill="#f7f0e9", stroke=ROCK))
    body.append(card(474, 230, 144, 66, ["铵态氮", "NH₄⁺"], fill="#f8f3df", stroke=GOLD))
    body.append(card(486, 372, 132, 66, ["硝态氮", "NO₃⁻"], fill="#eaf6fb", stroke=DEEP))
    body.append(card(104, 414, 146, 54, ["河流 / 海洋", "输出"], fill="#eaf6fb", stroke=DEEP, size=13))

    body.append(curved_arrow("M 348 185 C 400 194, 456 208, 510 235", color=FOREST, width=3))
    body.append(text(407, 204, "固氮", size=12, fill=FOREST, weight=800))
    body.append(curved_arrow("M 474 264 C 408 240, 330 245, 278 273", color=FOREST, width=3))
    body.append(text(342, 235, "同化", size=11, fill=FOREST, weight=700))
    body.append(arrow(188, 310, 304, 380, color=ROCK, width=3))
    body.append(text(204, 351, "凋落 / 矿化", size=11, fill=ROCK, weight=700))
    body.append(curved_arrow("M 388 372 C 408 332, 447 300, 500 282", color=GOLD, width=3))
    body.append(text(417, 342, "矿化", size=11, fill=GOLD, weight=700))
    body.append(arrow(545, 298, 545, 368, color=COOL, width=3))
    body.append(text(553, 336, "硝化", size=11, fill=COOL, weight=700))
    body.append(curved_arrow("M 487 388 C 430 343, 377 255, 356 184", color=VIOLET, width=3))
    body.append(text(384, 295, "反硝化 → N₂", size=11, fill=VIOLET, weight=700))
    body.append(arrow(486, 418, 250, 438, color=DEEP, width=3))
    body.append(text(342, 430, "淋失 / 输出", size=11, fill=DEEP, weight=700))
    body.append(curved_arrow("M 356 184 C 293 220, 244 293, 212 372", color=GOLD, width=2, dash="7 5"))
    body.append(text(246, 234, "沉降（推断）", size=11, fill=GOLD, weight=700))
    body.append(note(58, 500, "实线是转化或输送路径；虚线表示依赖沉降、未直接观测的外部输入。"))

    body.append(panel(684, 82, 318, 456, "氮如何限制碳固定", "stoichiometry"))
    body.append(text(708, 132, "氮形态", size=13, fill=MUTED, weight=750))
    body.append(text(868, 132, "生态后果", size=13, fill=MUTED, weight=750))
    body.append(line(708, 144, 978, 144, stroke=GRID, stroke_width=1))
    for index, (form, detail, color) in enumerate([
        ("N₂", "大气惰性库", COOL), ("NH₄⁺", "还原态底物", GOLD),
        ("NO₃⁻", "易淋失 / 反硝化", DEEP), ("有机 N", "生物量与土壤", FOREST),
    ]):
        yy = 174 + index * 48
        body.append(rect(708, yy - 16, 18, 18, radius=3, fill=color, stroke=color))
        body.append(text(740, yy - 2, form, size=14, weight=750))
        body.append(text(868, yy - 2, detail, size=11, fill=MUTED))
        body.append(line(708, yy + 14, 978, yy + 14, stroke=GRID, stroke_width=1))
    body.append(text(708, 374, "化学计量桥", size=13, fill=MUTED, weight=750))
    body.append(text(708, 400, "固定 C 需要 N、P 和电子受体", size=15, weight=800))
    body.append(text(708, 423, "C:N:P 不是所有生态系统的全球常数。", size=11, fill=MUTED))
    body.append(legend_box(740, 442, 240, [
        ("生物转化", FOREST, True, False),
        ("化学 / 输送", COOL, True, False),
        ("外部或不确定输入", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 16B：氮形态、转化和输出的符号是过程类别；箭头粗细不表示全球通量大小。"))
    save(OUT / "nitrogen-cycle.svg", "氮循环把生物圈接上大气与水",
         "过程示意展示 N₂、NH₄⁺、NO₃⁻ 和有机氮之间的固定、同化、矿化、硝化、反硝化与淋失；实线和虚线区分过程路径与推断输入。",
         "".join(body))


def paleoclimate_archives() -> None:
    body = [header("古气候档案分布在不同保存环境", "17 · 空间结构 | Paleoclimate archives")]
    body.append(panel(38, 82, 570, 456, "档案在哪里留下时间顺序", "schematic archive map"))
    body.append(world_map(56, 122, 534, 286, title="档案位置是空间采样，不是全球平均"))
    archive_nodes = [
        (-45, 75, "冰芯", COOL, "气泡 / 同位素"),
        (-105, 45, "树轮", FOREST, "年轮宽度"),
        (145, -5, "珊瑚", WARM, "骨骼化学"),
        (20, 55, "沉积柱", ROCK, "花粉 / 微化石"),
    ]
    for lon, lat, label, color, detail in archive_nodes:
        xx, yy = project(lon, lat, 56, 122, 534, 286)
        body.append(circle(xx, yy, 9, fill=color, stroke=PAPER, stroke_width=2))
        body.append(text(xx + 13, yy - 2, label, size=12, weight=750))
        body.append(text(xx + 13, yy + 14, detail, size=10.5, fill=MUTED))
    body.append(line(92, 444, 548, 444, stroke=GRID, stroke_width=1))
    for index, (label, color) in enumerate([("保存材料", ROCK), ("代理信号", WARM), ("年龄约束", GOLD)]):
        xx = 88 + index * 150
        body.append(rect(xx, 464, 22, 14, radius=3, fill=color, stroke=color))
        body.append(text(xx + 31, 476, label, size=11, fill=MUTED, weight=650))
    body.append(note(58, 510, "档案响应具有区域、季节和保存偏差；地图、节点和距离均非比例。"))

    body.append(panel(632, 82, 370, 470, "一份档案的四层证据", "material → proxy → age"))
    rows = [
        ("冰芯", "气泡 / δ¹⁸O", "季节–千年", COOL, "#eaf6fb"),
        ("树轮", "宽度 / 密度", "年际–世纪", FOREST, "#edf7ed"),
        ("珊瑚", "同位素 / 密度", "季节–世纪", WARM, "#fff0ec"),
        ("沉积物", "花粉 / 微化石", "年–百万年", ROCK, "#f7f0e9"),
    ]
    for index, (name, signal, time_window, color, fill) in enumerate(rows):
        yy = 124 + index * 67
        body.append(rect(656, yy, 322, 53, radius=7, fill=fill, stroke=color))
        body.append(rect(670, yy + 12, 12, 29, radius=3, fill=color, stroke=color))
        body.append(text(696, yy + 22, name, size=13, weight=750))
        body.append(text(782, yy + 22, signal, size=11.5, fill=INK))
        body.append(text(696, yy + 42, f"时间分辨率：{time_window}", size=10.5, fill=MUTED))
    body.append(text(656, 414, "证据边界", size=13, fill=MUTED, weight=750))
    body.append(text(656, 438, "代理不是温度计；年龄模型不是附注。", size=14, fill=WARM, weight=800))
    body.append(legend_box(752, 450, 226, [
        ("保存介质", ROCK, False, False),
        ("响应信号", WARM, True, False),
        ("年龄 / 校准不确定", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 17A：档案的空间位置、保存材料、代理响应和年龄窗口必须分层解释。"))
    save(OUT / "paleoclimate-archives.svg", "古气候档案分布在不同保存环境",
         "空间示意以冰芯、树轮、珊瑚和沉积物为档案节点，右侧拆分保存材料、代理信号和年龄约束；位置与时间分辨率为教学概念而非产品目录。",
         "".join(body))


def proxy_age_depth() -> None:
    body = [header("从深度到年代，再到气候变量", "17 · 过程机制 | Proxy and age model")]
    body.append(panel(38, 82, 624, 456, "沉积柱中的年龄—深度关系", "z → t(z) with uncertainty"))
    body.append(rect(82, 142, 112, 286, fill="#f7f0e9", stroke=ROCK, stroke_width=1.5))
    layers = [("表层", 48, "#e7cda8"), ("粉砂", 58, "#d8b58c"), ("灰层", 42, "#788995"),
              ("黏土", 65, "#b8c7d1"), ("深层", 58, "#b98962")]
    yy = 150
    for label, height, fill in layers:
        body.append(rect(92, yy, 92, height, fill=fill, stroke="#92765e", stroke_width=1))
        body.append(text(138, yy + height / 2 + 4, label, size=11, fill=PAPER if label == "灰层" else INK,
                         anchor="middle", weight=700))
        yy += height
    body.append(text(138, 446, "深度 z", size=12, fill=MUTED, anchor="middle", weight=700))
    body.append(line(222, 142, 222, 428, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    body.append(text(211, 132, "年轻", size=11, fill=MUTED, anchor="middle"))
    body.append(text(211, 446, "更老", size=11, fill=MUTED, anchor="middle"))
    body.append(line(274, 428, 604, 428, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    body.append(line(274, 428, 274, 142, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    body.append(text(604, 450, "年龄 t", size=12, fill=MUTED, anchor="end", weight=700))
    body.append(text(248, 152, "深度 z", size=12, fill=MUTED, anchor="end", weight=700))
    curve = [(286, 160), (316, 204), (357, 244), (404, 292), (474, 352), (562, 418)]
    body.append(polyline(curve, stroke=COOL, stroke_width=4))
    upper = [(292, 160), (330, 204), (374, 244), (422, 292), (496, 352), (578, 418)]
    lower = [(280, 160), (304, 204), (340, 244), (386, 292), (452, 352), (546, 418)]
    body.append(polyline(upper, stroke=GOLD, stroke_width=2, dash="7 5"))
    body.append(polyline(lower, stroke=GOLD, stroke_width=2, dash="7 5"))
    for xx, yy in curve[1:-1]:
        body.append(circle(xx, yy, 5, fill=WARM, stroke=PAPER, stroke_width=1.5))
    body.append(text(452, 205, "t(z) 年龄模型", size=12, fill=COOL, weight=800))
    body.append(text(456, 224, "金色带 = 年龄不确定度", size=11, fill=GOLD, weight=700))
    body.append(text(310, 390, "层计数 / 放射性定年 / 沉积速率", size=11, fill=MUTED))
    body.append(note(58, 500, "年龄窗口沿水平轴展开；不能把 ±σₜ 当成温度振幅误差。"))

    body.append(panel(690, 82, 312, 470, "证据链的顺序", "signal → calibrated variable"))
    pipeline = [
        ("信号", "x(z)", WARM, "#fff0ec"),
        ("校准", "ΔT = a x", COOL, "#eaf6fb"),
        ("年龄", "t(z) ± σₜ", GOLD, "#faf5e6"),
        ("重建", "ΔT(t) + 区间", FOREST, "#edf7ed"),
    ]
    for index, (title_value, detail, color, fill) in enumerate(pipeline):
        yy = 124 + index * 68
        body.append(card(718, yy, 256, 50, [title_value, detail], fill=fill, stroke=color,
                         size=13, line_height=17))
        if index < len(pipeline) - 1:
            body.append(arrow(846, yy + 53, 846, yy + 64, color=color, width=2, marker="arrow-small"))
    body.append(text(718, 410, "误差单位要分开", size=13, fill=MUTED, weight=750))
    body.append(text(718, 435, "σ_amp [°C]   ≠   σₜ [yr]", size=16, weight=800))
    body.append(legend_box(752, 450, 222, [
        ("代理振幅", WARM, True, False),
        ("校准 / 变量", COOL, True, False),
        ("年龄不确定度", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 17B：年龄模型给出样品何时形成，校准关系给出信号与变量如何对应；二者不可合并成一个误差。"))
    save(OUT / "proxy-age-depth.svg", "从深度到年代，再到气候变量",
         "过程示意把沉积柱深度、年龄—深度模型、代理校准和重建变量串成四步，并显式区分温度振幅误差与年代窗口误差。",
         "".join(body))


def forcing_pathways() -> None:
    body = [header("外部强迫沿不同路径进入能量收支", "18 · 空间结构 | Forcing pathways")]
    body.append(panel(38, 82, 590, 456, "从排放源到全球辐射账本", "sign convention: downward +"))
    body.append(rect(60, 184, 546, 58, radius=7, fill="#edf7fb", stroke=COOL))
    body.append(text(82, 208, "大气与地表快速调整层", size=14, weight=800))
    body.append(text(82, 229, "辐射传输、云、地表反照率和化学组成", size=11, fill=MUTED))
    body.append(world_map(60, 258, 546, 200, title="空间分布不同，不能只看全球合计"))
    sources = [
        (92, 130, 156, 38, "CO₂ / 长寿命", WARM, "+"),
        (276, 130, 156, 38, "气溶胶 / 区域", COOL, "−"),
        (460, 130, 126, 38, "太阳", GOLD, "±"),
    ]
    for x, y, width, height, label, color, sign in sources:
        body.append(rect(x, y, width, height, radius=7, fill=PAPER, stroke=color, stroke_width=2))
        body.append(text(x + 14, y + 25, label, size=12, weight=750))
        body.append(text(x + width - 15, y + 26, sign, size=18, fill=color, weight=800, anchor="end"))
    body.append(arrow(170, 168, 170, 180, color=WARM, width=3))
    body.append(arrow(354, 168, 354, 180, color=COOL, width=3))
    body.append(arrow(523, 168, 523, 180, color=GOLD, width=3))
    body.append(curved_arrow("M 182 294 C 252 280, 320 282, 382 294", color=WARM, width=3))
    body.append(curved_arrow("M 440 332 C 493 328, 534 348, 562 374", color=COOL, width=3))
    body.append(text(202, 290, "全球混合（示意）", size=11, fill=WARM, weight=700))
    body.append(text(438, 370, "区域 / 垂直分布", size=11, fill=COOL, weight=700))
    body.append(note(66, 490, "几何表示覆盖与路径类别；源强、区域面积和全球平均不按图面比例。"))

    body.append(panel(650, 82, 352, 456, "强迫账本：输入先于响应", "W/m²"))
    body.append(text(674, 124, "项", size=13, fill=MUTED, weight=750))
    body.append(text(904, 124, "符号", size=13, fill=MUTED, weight=750, anchor="end"))
    body.append(line(674, 136, 978, 136, stroke=GRID, stroke_width=1))
    forcing_rows = [
        ("CO₂ 直接项", "+2.17", WARM, False),
        ("气溶胶直接项", "−0.40", COOL, False),
        ("云快速调整", "−0.60", COOL, True),
        ("太阳 / 地表", "±", GOLD, False),
    ]
    for index, (label, value, color, dashed) in enumerate(forcing_rows):
        yy = 164 + index * 43
        body.append(line(674, yy - 6, 704, yy - 6, stroke=color, stroke_width=4,
                         dash="7 5" if dashed else None))
        body.append(text(718, yy, label, size=12.5, weight=700))
        body.append(text(966, yy, value, size=14, fill=color, weight=800, anchor="end"))
        body.append(line(674, yy + 15, 978, yy + 15, stroke=GRID, stroke_width=1))
    body.append(text(674, 356, "F_ERF = 直接项 + 快速调整", size=16, weight=800))
    body.append(text(674, 378, "约 +1.07（教学合计，尚未是温度）", size=11, fill=MUTED))
    body.append(arrow(710, 407, 774, 407, color=WARM, width=3))
    body.append(card(780, 384, 74, 46, ["F", "强迫"], fill="#fff0ec", stroke=WARM, size=12, line_height=15))
    body.append(arrow(862, 407, 924, 407, color=COOL, width=3))
    body.append(card(930, 384, 48, 46, ["N", "收支"], fill="#eaf6fb", stroke=COOL, size=11, line_height=14))
    body.append(legend_box(738, 440, 240, [
        ("正：净向下辐射", WARM, True, False),
        ("负：净向下辐射", COOL, True, False),
        ("快速调整 / 定义依赖", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 18A：同一单位 W/m² 不代表同一寿命、区域分布或因果位置；强迫不是温度响应。"))
    save(OUT / "forcing-pathways.svg", "外部强迫沿不同路径进入能量收支",
         "空间教学示意把长寿命温室气体、区域气溶胶和太阳变化送入大气辐射账本，并用正负号区分净向下辐射方向；几何与强迫数值为教学量。",
         "".join(body))


def aerosol_cloud_effects() -> None:
    body = [header("气溶胶怎样改写云与辐射", "18 · 过程机制 | Aerosol-cloud effects")]
    body.append(panel(38, 82, 604, 456, "一束光穿过气溶胶—云系统", "microphysics + radiation"))
    body.append(rect(66, 126, 552, 318, fill="#eaf7fb", stroke=LINE, stroke_width=1.5))
    body.append(rect(66, 392, 552, 52, fill="#e9e1c9", stroke=ROCK, stroke_width=1))
    body.append(circle(116, 160, 25, fill=GOLD, stroke=GOLD))
    body.append(text(116, 165, "太阳", size=12, anchor="middle", weight=800))
    for xx in (154, 186, 218, 250):
        body.append(arrow(xx, 164, xx + 68, 248, color=GOLD, width=2, marker="arrow-small"))
    for xx, yy, radius in [(240, 210, 5), (266, 194, 4), (291, 222, 5), (322, 204, 4), (350, 224, 5), (382, 198, 4)]:
        body.append(circle(xx, yy, radius, fill=ROCK, stroke=ROCK))
    body.append(text(240, 182, "气溶胶粒子", size=11, fill=ROCK, weight=750))
    for cx, cy, rx, ry in [(282, 270, 64, 26), (350, 258, 73, 31), (430, 272, 70, 27), (500, 260, 54, 24)]:
        body.append(ellipse(cx, cy, rx, ry, fill=PAPER, stroke=COOL, stroke_width=2))
    body.append(text(388, 311, "云层：滴谱、寿命、降水", size=12, fill=COOL, weight=750, anchor="middle"))
    for xx in (300, 350, 400, 450):
        body.append(arrow(xx, 315, xx - 5, 384, color=COOL, width=2, marker="arrow-small"))
    body.append(arrow(338, 250, 278, 178, color=COOL, width=3))
    body.append(arrow(420, 247, 486, 176, color=COOL, width=3))
    body.append(text(262, 172, "散射反射 ↑", size=11, fill=COOL, weight=800))
    body.append(text(485, 172, "出射短波", size=11, fill=COOL, weight=800))
    body.append(arrow(546, 348, 546, 410, color=WARM, width=3, dash="7 5"))
    body.append(text(555, 376, "长波", size=11, fill=WARM, weight=750, rotate=90, anchor="middle"))
    body.append(text(82, 427, "地表短波到达量", size=11, fill=INK, weight=700))
    body.append(note(70, 475, "散射、吸收、云滴变化和降水的符号与强度依赖背景状态；全球平均冷却不是每处都成立。"))

    body.append(panel(672, 82, 330, 480, "从粒子到净效应", "path boundaries"))
    effects = [
        ("散射气溶胶", "短波到达地表 ↓", COOL, "#eaf6fb"),
        ("吸收性气溶胶", "大气加热层改变", WARM, "#fff0ec"),
        ("云凝结核", "滴数 / 反照率变化", GOLD, "#faf5e6"),
        ("云寿命与降水", "方向依赖状态", VIOLET, "#f1eff8"),
    ]
    for index, (name, detail, color, fill) in enumerate(effects):
        yy = 124 + index * 65
        body.append(card(700, yy, 274, 48, [name, detail], fill=fill, stroke=color,
                         size=12.5, line_height=16))
        if index < len(effects) - 1:
            body.append(arrow(837, yy + 51, 837, yy + 61, color=color, width=2, marker="arrow-small"))
    body.append(text(700, 402, "净项", size=13, fill=MUTED, weight=750))
    body.append(text(700, 427, "F_aer + F_cloud 需定义基准", size=15, weight=800))
    body.append(text(700, 450, "光学厚度 · 云型 · 湿度 · 垂直分布", size=11, fill=MUTED))
    body.append(legend_box(748, 468, 226, [
        ("净向下减少 / 冷色", COOL, True, False),
        ("加热或长波路径", WARM, True, False),
        ("状态依赖 / 不确定", VIOLET, True, True),
    ]))
    body.append(note(38, 574, "图 18B：虚线表示不能仅凭粒子数量确定的路径；辐射项仍须附参考状态、空间平均和时间窗。"))
    save(OUT / "aerosol-cloud-effects.svg", "气溶胶怎样改写云与辐射",
         "过程示意展示散射、吸收、云凝结核、云寿命和降水如何共同影响短波与长波；颜色表示辐射方向或机制类别，虚线表示状态依赖路径。",
         "".join(body))


def climate_feedback_loops() -> None:
    body = [header("反馈符号决定放大还是恢复", "19 · 过程机制 | Climate feedback loops")]
    body.append(panel(38, 82, 624, 456, "围绕温度扰动的四条反馈路径", "sign before magnitude"))
    body.append(circle(350, 310, 66, fill="#f6f9fb", stroke=INK, stroke_width=2))
    body.append(text(350, 304, "ΔT", size=26, weight=850, anchor="middle"))
    body.append(text(350, 330, "气候状态", size=12, fill=MUTED, anchor="middle", weight=700))
    body.append(card(78, 140, 186, 64, ["普朗克恢复", "+T → OLR ↑ → N ↓"], fill="#eaf6fb", stroke=COOL, size=12.5, line_height=17))
    body.append(curved_arrow("M 300 280 C 252 236, 226 211, 190 204", color=COOL, width=3))
    body.append(curved_arrow("M 166 208 C 181 279, 230 326, 293 335", color=COOL, width=3))
    body.append(text(95, 226, "负反馈 / 恢复", size=11, fill=COOL, weight=800))

    body.append(card(428, 140, 186, 64, ["水汽", "+T → WV ↑ → 温室效应 ↑"], fill="#fff0ec", stroke=WARM, size=12.5, line_height=17))
    body.append(curved_arrow("M 405 280 C 452 238, 482 211, 520 204", color=WARM, width=3))
    body.append(curved_arrow("M 545 208 C 526 275, 480 326, 407 338", color=WARM, width=3))
    body.append(text(488, 226, "正反馈 / 放大", size=11, fill=WARM, weight=800))

    body.append(card(78, 420, 214, 62, ["冰雪反照率", "+T → 冰雪 ↓ → 吸收 ↑"], fill="#fff0ec", stroke=WARM, size=12.5, line_height=17))
    body.append(curved_arrow("M 305 346 C 257 374, 230 405, 194 420", color=WARM, width=3))
    body.append(curved_arrow("M 198 417 C 247 443, 289 450, 324 365", color=WARM, width=3))
    body.append(text(100, 405, "暖色 = 净放大", size=11, fill=WARM, weight=800))

    body.append(card(428, 420, 186, 62, ["云", "短波 / 长波竞争"], fill="#f7f0e9", stroke=GOLD, size=12.5, line_height=17))
    body.append(curved_arrow("M 405 350 C 458 382, 488 409, 521 420", color=GOLD, width=2, dash="7 5"))
    body.append(curved_arrow("M 529 417 C 493 452, 449 449, 386 365", color=GOLD, width=2, dash="7 5"))
    body.append(text(476, 405, "符号依状态", size=11, fill=GOLD, weight=800))

    body.append(panel(684, 82, 318, 470, "把符号写进能量账本", "IPCC λ vs r"))
    body.append(text(708, 132, "N = F + λ_IPCC ΔT − H", size=18, weight=800))
    body.append(text(708, 158, "λ_IPCC < 0：净辐射随变暖减少", size=12, fill=COOL, weight=750))
    body.append(line(708, 177, 978, 177, stroke=GRID, stroke_width=1))
    body.append(text(708, 205, "r = −λ_IPCC > 0", size=18, weight=800))
    body.append(text(708, 231, "r = r_P − f_WV − f_alb − f_cloud", size=14, fill=MUTED, weight=700))
    body.append(text(708, 263, "反馈项", size=13, fill=MUTED, weight=750))
    feedback_rows = [("普朗克", "恢复", COOL, 3.2), ("水汽", "放大", WARM, 1.0),
                     ("冰雪", "放大", WARM, .3), ("云", "依状态", GOLD, .5)]
    for index, (name, role, color, amount) in enumerate(feedback_rows):
        yy = 294 + index * 34
        body.append(text(708, yy, name, size=12, weight=700))
        body.append(text(788, yy, role, size=11, fill=color, weight=750))
        body.append(rect(860, yy - 13, amount * 27, 13, radius=3, fill=color, opacity=.75))
    body.append(text(708, 438, "ΔT_eq = F / r；海洋热摄取 H 延迟到达平衡", size=11.5, fill=MUTED))
    body.append(legend_box(762, 456, 216, [
        ("负反馈 / 恢复", COOL, True, False),
        ("正反馈 / 放大", WARM, True, False),
        ("符号依状态", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 19A：同一颜色只承担符号或过程类别；云的符号必须随云型、基准和尺度一起报告。"))
    save(OUT / "climate-feedback-loops.svg", "反馈符号决定放大还是恢复",
         "过程示意围绕温度扰动展示普朗克恢复、水汽、冰雪反照率和云反馈，并同时给出负的 IPCC 反馈参数与正的恢复参数定义。",
         "".join(body))


def climate_response_timescales() -> None:
    body = [header("同一强迫会留下多层时间记忆", "19 · 时间结构 | Response timescales")]
    body.append(panel(38, 82, 624, 456, "从天气到地质的响应时间常数", "log-like teaching axis"))
    x_ticks = [(110, "日"), (190, "年"), (290, "十年"), (400, "世纪"), (505, "千年"), (600, "百万年")]
    body.append(line(110, 180, 600, 180, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    for xx, label in x_ticks:
        body.append(line(xx, 174, xx, 186, stroke=INK, stroke_width=1.5))
        body.append(text(xx, 201, label, size=11, fill=MUTED, anchor="middle", weight=700))
    rows = [
        ("大气", 110, 175, WARM, "日–月"),
        ("陆地 / 上层海", 160, 275, FOREST, "年–十年"),
        ("混合层", 238, 390, COOL, "十年–世纪"),
        ("深海", 350, 510, DEEP, "世纪–千年"),
        ("冰盖 / 岩石", 500, 600, VIOLET, "千年–百万年"),
    ]
    for index, (label, start, end, color, timescale) in enumerate(rows):
        yy = 238 + index * 42
        body.append(text(62, yy + 5, label, size=12, weight=750))
        body.append(rect(start, yy - 10, max(20, end - start), 21, radius=5, fill=color, opacity=.72))
        body.append(text(end + 9, yy + 5, timescale, size=10.5, fill=MUTED))
    body.append(line(62, 456, 600, 456, stroke=GRID, stroke_width=1))
    body.append(text(62, 482, "时间窗决定你看到的是瞬态、过渡还是接近平衡。", size=12, fill=MUTED, weight=700))
    body.append(note(58, 510, "条带是时间常数范围的示意，不是任何单一模式或指标的估计。"))

    body.append(panel(684, 82, 318, 470, "一个一阶响应的两条曲线", "ΔT + H"))
    body.append(line(718, 366, 964, 366, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    body.append(line(718, 366, 718, 174, stroke=INK, stroke_width=2, marker_end="url(#arrow)"))
    body.append(text(964, 387, "时间 t", size=11, fill=MUTED, anchor="end"))
    body.append(text(708, 172, "响应", size=11, fill=MUTED))
    body.append(path("M 730 350 C 754 315, 772 273, 804 244 C 841 211, 894 202, 950 198", stroke=WARM, stroke_width=4))
    body.append(path("M 730 212 C 764 224, 800 244, 830 274 C 866 308, 915 337, 950 351", stroke=COOL, stroke_width=4))
    body.append(text(846, 194, "ΔT(t) ↑", size=12, fill=WARM, weight=800))
    body.append(text(846, 341, "H(t) ↓", size=12, fill=COOL, weight=800))
    body.append(line(804, 176, 804, 366, stroke=GOLD, stroke_width=2, dash="7 5"))
    body.append(text(804, 165, "t ≈ τ", size=11, fill=GOLD, anchor="middle", weight=750))
    body.append(text(708, 420, "ΔT = ΔT_eq(1 − e⁻ᵗ⧸ᵗᵃᵘ)", size=15, weight=800))
    body.append(text(708, 447, "t ≪ τ：热摄取多；t → ∞：趋近平衡", size=11, fill=MUTED))
    body.append(legend_box(752, 460, 226, [
        ("表面响应 ΔT", WARM, True, False),
        ("热摄取 H", COOL, True, False),
        ("特征时间 τ", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 19B：快响应先出现，慢响应持续重分配能量；快慢不是重要性排序，而是系统记忆的不同层。"))
    save(OUT / "climate-response-timescales.svg", "同一强迫会留下多层时间记忆",
         "时间结构示意用对数式时间轴比较大气、陆地、混合层、深海和冰盖岩石的响应范围，并以一阶模型区分表面升温与海洋热摄取。",
         "".join(body))


def grid_icon(x: float, y: float, size: float, rows: int, cols: int, color: str) -> str:
    pieces = [rect(x, y, size, size, radius=4, fill=PAPER, stroke=color, stroke_width=1.5)]
    cell_w = size / cols
    cell_h = size / rows
    for row in range(1, rows):
        pieces.append(line(x, y + row * cell_h, x + size, y + row * cell_h, stroke=color, stroke_width=1))
    for col in range(1, cols):
        pieces.append(line(x + col * cell_w, y, x + col * cell_w, y + size, stroke=color, stroke_width=1))
    return "".join(pieces)


def model_hierarchy() -> None:
    body = [header("模型层级随问题改变", "20 · 空间结构 | Model hierarchy")]
    body.append(panel(38, 82, 566, 456, "从平均能量到耦合地球系统", "scope ≠ certainty"))
    levels = [
        ("EBM", "能量平衡模型", "全球 / 纬向平均", 72, 132, 444, 55, COOL, 2, 3),
        ("EMIC", "中等复杂度", "输送 + 简化海洋", 92, 218, 424, 60, FOREST, 3, 4),
        ("GCM", "三维环流模式", "动量、水、能量", 112, 306, 404, 66, WARM, 4, 5),
        ("ESM", "地球系统模型", "碳、氮、生态耦合", 132, 398, 384, 72, VIOLET, 5, 6),
    ]
    for index, (abbr, title_value, detail, x, y, width, height, color, rows, cols) in enumerate(levels):
        body.append(rect(x, y, width, height, radius=8, fill=PAPER, stroke=color, stroke_width=2))
        body.append(grid_icon(x + 14, y + 9, 42, rows, cols, color))
        body.append(text(x + 72, y + 26, f"{abbr}  {title_value}", size=14, weight=800))
        body.append(text(x + 72, y + 48, detail, size=11.5, fill=MUTED))
        if index < len(levels) - 1:
            body.append(arrow(x + width / 2, y + height + 5, x + width / 2, levels[index + 1][4] - 7,
                              color=color, width=2, marker="arrow-small"))
    body.append(text(72, 498, "格点更多、过程更多、计算代价更高；未解析过程仍需参数化。", size=11, fill=MUTED))

    body.append(panel(632, 82, 370, 456, "先问问题，再选层级", "choice by question"))
    questions = [
        ("全球能量收支", "EBM", COOL),
        ("纬向输送 / 海陆差异", "EMIC", FOREST),
        ("区域环流 / 极端", "GCM", WARM),
        ("碳—氮—植被反馈", "ESM", VIOLET),
    ]
    for index, (question, model, color) in enumerate(questions):
        yy = 132 + index * 58
        body.append(text(658, yy, question, size=13, weight=750))
        body.append(arrow(842, yy - 5, 886, yy - 5, color=color, width=2, marker="arrow-small"))
        body.append(rect(900, yy - 22, 74, 30, radius=15, fill=color))
        body.append(text(937, yy - 2, model, size=12, fill=PAPER, weight=800, anchor="middle"))
        body.append(line(658, yy + 17, 974, yy + 17, stroke=GRID, stroke_width=1))
    body.append(text(658, 384, "复杂度 ≠ 证据等级", size=16, fill=WARM, weight=800))
    body.append(text(658, 411, "集合 spread、结构误差、初值和情景要分栏。", size=11.5, fill=MUTED))
    body.append(legend_box(748, 438, 226, [
        ("模型层级 / scope", VIOLET, False, False),
        ("可解析过程", COOL, True, False),
        ("参数化 / 未解析", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 20A：阶梯表示能回答的问题范围和过程集合，不是从低到高的绝对准确度排名。"))
    save(OUT / "model-hierarchy.svg", "模型层级随问题改变",
         "空间教学示意用 EBM、EMIC、GCM 和 ESM 阶梯比较模型所覆盖的空间与过程范围，并明确复杂度不等于确定性。",
         "".join(body))


def earth_system_grid_column() -> None:
    body = [header("网格柱把连续地球离散成可计算单元", "20 · 过程机制 | Grid-column model")]
    body.append(panel(38, 82, 602, 456, "一个地球系统网格柱", "resolved + parameterized"))
    x0, y0, cell_w, cell_h = 100, 132, 74, 45
    fills = [SKY, "#e9f3f7", "#f0f7fa", "#bfe2f2", "#6faec9", DEEP]
    for row in range(6):
        for col in range(6):
            fill = fills[row]
            body.append(rect(x0 + col * cell_w, y0 + row * cell_h, cell_w, cell_h,
                             fill=fill, stroke=PAPER, stroke_width=1))
    body.append(rect(x0, y0, cell_w * 6, cell_h * 3, fill="none", stroke=COOL, stroke_width=2))
    body.append(rect(x0, y0 + cell_h * 3, cell_w * 6, cell_h * 2, fill="none", stroke=DEEP, stroke_width=2))
    body.append(rect(x0, y0 + cell_h * 5, cell_w * 6, cell_h, fill="#d7e5c1", stroke=FOREST, stroke_width=2))
    body.append(text(x0 + 12, y0 + 20, "大气", size=12, fill=INK, weight=750))
    body.append(text(x0 + 12, y0 + cell_h * 3 + 21, "海洋", size=12, fill=PAPER, weight=750))
    body.append(text(x0 + 12, y0 + cell_h * 5 + 27, "陆地 / 海底", size=12, fill=INK, weight=750))
    body.append(arrow(316, 150, 316, 218, color=WARM, width=3))
    body.append(arrow(316, 250, 316, 321, color=COOL, width=3))
    body.append(arrow(316, 345, 316, 420, color=DEEP, width=3))
    body.append(text(395, 185, "平流 / 辐射", size=11, fill=WARM, weight=700))
    body.append(text(395, 285, "混合 / 热输送", size=11, fill=COOL, weight=700))
    body.append(text(395, 383, "碳 / 营养交换", size=11, fill=FOREST, weight=700))
    body.append(dashed_path("M 150 236 C 222 212, 299 229, 386 213", color=GOLD, width=3))
    body.append(dashed_path("M 180 338 C 257 315, 328 340, 422 320", color=GOLD, width=3))
    body.append(text(444, 217, "云、对流", size=11, fill=GOLD, weight=750))
    body.append(text(444, 325, "湍流、沉降", size=11, fill=GOLD, weight=750))
    body.append(text(100, 444, "网格平均状态", size=12, fill=MUTED, weight=750))
    body.append(text(100, 469, "ū, T̄, q̄  →  守恒推进", size=15, weight=800))
    body.append(note(58, 510, "格点和柱高是示意；一格内仍可能包含未解析的云、对流和地形。"))

    body.append(panel(670, 82, 332, 456, "分辨率的代价与边界", "Δx and subgrid"))
    body.append(text(696, 132, "N_cell ∝ Δx⁻³", size=21, weight=850))
    body.append(text(696, 158, "三维格点数量的教学量级关系", size=11, fill=MUTED))
    body.append(line(696, 178, 976, 178, stroke=GRID, stroke_width=1))
    body.append(card(696, 202, 280, 58, ["已解析", "网格平均输送与收支"], fill="#eaf6fb", stroke=COOL, size=13, line_height=17))
    body.append(arrow(836, 265, 836, 284, color=COOL, width=2, marker="arrow-small"))
    body.append(card(696, 288, 280, 58, ["未解析", "云 · 对流 · 湍流 · 地形"], fill="#faf5e6", stroke=GOLD, size=13, line_height=17))
    body.append(dashed_path("M 836 351 C 836 372, 800 381, 758 390", color=GOLD, width=2))
    body.append(text(696, 393, "参数化是受约束的子模型", size=13, fill=GOLD, weight=800))
    body.append(text(696, 423, "守恒残差、时间步长和边界条件仍要验证。", size=11, fill=MUTED))
    body.append(legend_box(750, 442, 226, [
        ("解析输送", COOL, True, False),
        ("热 / 水 / 碳路径", DEEP, True, False),
        ("亚网格参数化", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 20B：网格变细会移动解析边界并增加计算量，但不会自动消除参数化或结构误差。"))
    save(OUT / "earth-system-grid-column.svg", "网格柱把连续地球离散成可计算单元",
         "过程示意用大气—海洋—陆地网格柱展示守恒推进、三维格点代价和亚网格参数化，并将实线解析路径与虚线参数化路径分开。",
         "".join(body))


def observing_system() -> None:
    body = [header("同一地球变量有不同观测支持尺度", "21 · 空间结构 | Observing system")]
    body.append(panel(38, 82, 610, 456, "现场、卫星与再分析的空间拼接", "coverage is not identity"))
    body.append(world_map(58, 122, 570, 286, title="观测网络为稀疏采样与覆盖带"))
    # A schematic orbit and swath.
    body.append(path("M 78 332 C 190 90, 452 84, 608 310", stroke=VIOLET, stroke_width=2, dash="8 5"))
    body.append(path("M 98 351 C 210 113, 443 107, 588 329", stroke=VIOLET, stroke_width=10, opacity=.15))
    body.append(circle(352, 129, 8, fill=VIOLET, stroke=PAPER, stroke_width=2))
    body.append(text(366, 133, "卫星轨道", size=11, fill=VIOLET, weight=750))
    stations = [(155, 226, "站"), (264, 281, "塔"), (487, 246, "浮标"), (531, 344, "船")]
    for xx, yy, label in stations:
        body.append(circle(xx, yy, 8, fill=FOREST if label != "船" else DEEP, stroke=PAPER, stroke_width=2))
        body.append(text(xx + 12, yy + 4, label, size=11, fill=INK, weight=750))
    body.append(line(155, 226, 264, 281, stroke=FOREST, stroke_width=2))
    body.append(line(264, 281, 487, 246, stroke=FOREST, stroke_width=2))
    body.append(line(487, 246, 531, 344, stroke=DEEP, stroke_width=2))
    body.append(curved_arrow("M 210 388 C 320 410, 444 401, 555 378", color=GOLD, width=2, dash="7 5"))
    body.append(text(250, 399, "插值 / 同化后的连续场", size=11, fill=GOLD, weight=750))
    body.append(note(62, 430, "地面点、卫星像元、轨道瞬时值与再分析网格不能直接当作同一种观测。"))
    body.append(text(62, 466, "支持尺度", size=13, fill=MUTED, weight=750))
    body.append(scale_ribbon(94, 484, ["点", "剖面", "像元", "网格"], [FOREST, DEEP, VIOLET, GOLD], 478))

    body.append(panel(674, 82, 328, 456, "证据身份与覆盖", "scale + coverage"))
    evidence_rows = [
        ("现场站", "点 / 剖面", "直接采样", FOREST, "#edf7ed"),
        ("卫星", "像元 / 条带", "辐亮度 → 反演", VIOLET, "#f1eff8"),
        ("再分析", "网格 / 连续", "模型 + 同化", GOLD, "#faf5e6"),
    ]
    for index, (name, scale, identity, color, fill) in enumerate(evidence_rows):
        yy = 126 + index * 76
        body.append(rect(698, yy, 280, 60, radius=7, fill=fill, stroke=color))
        body.append(rect(712, yy + 13, 12, 34, radius=3, fill=color, stroke=color))
        body.append(text(738, yy + 23, name, size=13.5, weight=800))
        body.append(text(834, yy + 23, scale, size=11, fill=INK))
        body.append(text(738, yy + 44, identity, size=11, fill=MUTED))
    body.append(text(698, 370, "覆盖率接近完整 ≠ 没有模型依赖", size=14, fill=WARM, weight=800))
    body.append(text(698, 398, "缺测、代表性误差、定标偏差要分别记录。", size=11.5, fill=MUTED))
    body.append(legend_box(752, 438, 226, [
        ("直接观测", FOREST, True, False),
        ("反演产品", VIOLET, True, True),
        ("再分析 / 同化", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 21A：颜色区分证据链角色；支持尺度由观测足迹和处理窗口决定，不由图像清晰度决定。"))
    save(OUT / "observing-system.svg", "同一地球变量有不同观测支持尺度",
         "空间示意把现场站、浮标、船舶、卫星轨道和再分析连续场放在同一地图中，并用点、剖面、像元和网格区分观测支持尺度。",
         "".join(body))


def remote_sensing_spectrum() -> None:
    body = [header("卫星先测电磁信号，再反演地球变量", "21 · 过程机制 | Remote-sensing spectrum")]
    body.append(panel(38, 82, 642, 456, "电磁谱与可观测变量", "radiance → retrieval"))
    bands = [
        (72, 110, "γ / X", VIOLET), (182, 76, "UV", COOL), (258, 86, "可见", FOREST),
        (344, 105, "近红外", GOLD), (449, 118, "热红外", WARM), (567, 92, "微波 / 雷达", DEEP),
    ]
    body.append(text(72, 126, "波长增大 →", size=11, fill=MUTED, weight=700))
    for x, width, label, color in bands:
        body.append(rect(x, 148, width, 48, radius=5, fill=color, stroke=PAPER, stroke_width=2))
        body.append(text(x + width / 2, 178, label, size=12, fill=PAPER, weight=800, anchor="middle"))
    body.append(text(72, 220, "同一传感器量可能对应多个状态变量；观测算子和先验决定反演。", size=11, fill=MUTED))
    targets = [
        (86, "可见 / 近红外", "反照率 · 植被", FOREST, "#edf7ed"),
        (296, "热红外", "地表温度", WARM, "#fff0ec"),
        (506, "微波 / 雷达", "土壤水分 · 降水 · 结构", DEEP, "#eaf6fb"),
    ]
    for x, source, target, color, fill in targets:
        body.append(arrow(x + 52, 199, x + 52, 268, color=color, width=2, marker="arrow-small"))
        body.append(card(x, 274, 164, 64, [source, target], fill=fill, stroke=color, size=12, line_height=17))
    body.append(text(72, 386, "支持尺度链", size=13, fill=MUTED, weight=750))
    body.append(scale_ribbon(106, 414, ["光子", "像元", "条带", "网格"], [GOLD, FOREST, VIOLET, DEEP], 506))
    body.append(note(62, 488, "波段标签是教学分类；云、视角、发射率、定标和算法版本都会进入误差。"))

    body.append(panel(708, 82, 294, 456, "观测方程的流水线", "H(x) + ε"))
    body.append(card(730, 124, 250, 54, ["传感器读数", "y = radiance + ε"], fill="#f7f0e9", stroke=ROCK, size=13, line_height=17))
    body.append(arrow(855, 183, 855, 202, color=ROCK, width=2, marker="arrow-small"))
    body.append(card(730, 206, 250, 54, ["观测算子", "y = H(x) + ε"], fill="#eaf6fb", stroke=COOL, size=13, line_height=17))
    body.append(arrow(855, 265, 855, 284, color=COOL, width=2, marker="arrow-small"))
    body.append(card(730, 288, 250, 54, ["反演变量", "x̂ = R(y, 先验)"], fill="#f1eff8", stroke=VIOLET, size=13, line_height=17))
    body.append(dashed_path("M 855 348 C 855 365, 800 372, 760 385", color=GOLD, width=2))
    body.append(text(730, 390, "质量控制：云掩膜 · 定标 · 验证", size=11.5, fill=GOLD, weight=800))
    body.append(text(730, 420, "反演不是凭空增加信息", size=14, fill=WARM, weight=800))
    body.append(legend_box(752, 438, 228, [
        ("传感器信号", ROCK, True, False),
        ("反演变量", VIOLET, True, True),
        ("先验 / 质量控制", GOLD, True, True),
    ]))
    body.append(note(38, 574, "图 21B：电磁谱显示的是可测信号类别，地球变量要经过观测算子、反演和质量控制；虚线表示间接支持。"))
    save(OUT / "remote-sensing-spectrum.svg", "卫星先测电磁信号，再反演地球变量",
         "过程示意把可见光、近红外、热红外和微波雷达信号连接到反照率、植被、地表温度、土壤水分和结构等变量，并显式保留观测算子、反演先验和质量控制。",
         "".join(body))


def main() -> None:
    generators = [
        carbon_cycle_landscape,
        ocean_carbon_pumps,
        biosphere_biomes,
        nitrogen_cycle,
        paleoclimate_archives,
        proxy_age_depth,
        forcing_pathways,
        aerosol_cloud_effects,
        climate_feedback_loops,
        climate_response_timescales,
        model_hierarchy,
        earth_system_grid_column,
        observing_system,
        remote_sensing_spectrum,
    ]
    for generate in generators:
        generate()
        print(f"generated {generate.__name__}")


if __name__ == "__main__":
    main()
