#!/usr/bin/env python3
"""Generate the visual roadmap used by the Earth-course introduction."""

from pathlib import Path

from svgkit import PALETTE, arrow, circle, concat, header, line, panel, path, pill, rect, save, text


OUT = Path(__file__).resolve().parents[1] / "images"


def main() -> None:
    parts = [header("一颗行星，四本账，七条学习路径", "Earth-system visual roadmap")]
    parts.append(panel(24, 62, 500, 500, "空间剖面：圈层不是彼此隔离的盒子", "schematic · not to scale"))
    cx, cy = 272, 320
    parts.extend([
        circle(cx, cy, 184, fill=PALETTE["sky"], stroke=PALETTE["line"], stroke_width=2),
        circle(cx, cy, 157, fill=PALETTE["ocean"], stroke="#6da6bf", stroke_width=2),
        circle(cx, cy, 139, fill=PALETTE["land"], stroke="#82936f", stroke_width=2),
        circle(cx, cy, 105, fill=PALETTE["mantle"], stroke="#b7583d", stroke_width=2),
        circle(cx, cy, 53, fill=PALETTE["core"], stroke="#a96d10", stroke_width=2),
        path(f"M{cx} {cy} L{cx + 184} {cy} A184 184 0 0 1 {cx} {cy - 184} Z", fill="#ffffff", stroke=PALETTE["line"], stroke_width=2),
        path(f"M{cx} {cy} L{cx + 157} {cy} A157 157 0 0 1 {cx} {cy - 157} Z", fill=PALETTE["land"], stroke="#82936f", stroke_width=2),
        path(f"M{cx} {cy} L{cx + 105} {cy} A105 105 0 0 1 {cx} {cy - 105} Z", fill=PALETTE["mantle"], stroke="#b7583d", stroke_width=2),
        path(f"M{cx} {cy} L{cx + 53} {cy} A53 53 0 0 1 {cx} {cy - 53} Z", fill=PALETTE["core"], stroke="#a96d10", stroke_width=2),
        text(283, 147, "大气圈", size=13, weight=700),
        text(395, 238, "水圈 / 冰冻圈", size=13, weight=700),
        text(389, 293, "岩石圈", size=13, weight=700),
        text(343, 349, "地幔", size=13, weight=700),
        text(286, 318, "核", size=13, weight=800),
        arrow(92, 480, 452, 480, color=PALETTE["gold"], width=4),
        text(92, 509, "能量", size=13, fill=PALETTE["gold"], weight=750),
        text(452, 509, "太阳输入 → 海气输送 → 长波散失", size=12, fill=PALETTE["muted"], anchor="end"),
        arrow(92, 529, 452, 529, color=PALETTE["forest"], width=4),
        text(92, 552, "物质", size=13, fill=PALETTE["forest"], weight=750),
        text(452, 552, "岩石 · 水 · 碳 · 营养元素", size=12, fill=PALETTE["muted"], anchor="end"),
    ])

    parts.append(panel(544, 62, 472, 500, "课程路径：每一步都把上一层接入下一层", "28 lessons + 28 labs"))
    rows = [
        ("01", "系统账本", "储库 · 通量 · 驻留时间", PALETTE["violet"]),
        ("02", "深部骨架", "深时 · 地震波 · 板块 · 岩石", PALETTE["mantle"]),
        ("03", "地表水文", "风化 · 流域 · 冰冻圈 · 海岸", PALETTE["forest"]),
        ("04", "气海热机", "辐射 · 环流 · 云雨 · 洋流 · ENSO", PALETTE["cool"]),
        ("05", "气候变化", "碳循环 · 强迫 · 反馈 · 古气候", PALETTE["warm"]),
        ("06", "模型与证据", "模型 · 遥感 · 同化 · 归因", PALETTE["ink"]),
        ("07", "风险与选择", "灾害 · 复合风险 · 行动 · 数字孪生", PALETTE["gold"]),
    ]
    y = 104
    for index, (number, title_value, detail, color) in enumerate(rows):
        parts.append(rect(570, y, 420, 52, radius=7, fill="#ffffff", stroke=PALETTE["grid"], stroke_width=1.5))
        parts.append(circle(598, y + 26, 18, fill=color))
        parts.append(text(598, y + 31, number, size=11, fill="#ffffff", weight=800, anchor="middle"))
        parts.append(text(630, y + 22, title_value, size=15, weight=800))
        parts.append(text(630, y + 41, detail, size=11.5, fill=PALETTE["muted"]))
        if index < len(rows) - 1:
            parts.append(line(598, y + 52, 598, y + 62, stroke=PALETTE["line"], stroke_width=2))
        y += 62
    parts.append(pill(590, 535, "守恒", fill=PALETTE["forest"], width=86))
    parts.append(pill(692, 535, "尺度", fill=PALETTE["cool"], width=86))
    parts.append(pill(794, 535, "证据", fill=PALETTE["violet"], width=86))
    parts.append(pill(896, 535, "决策", fill=PALETTE["gold"], width=86))

    save(
        OUT / "earth-visual-roadmap.svg",
        "地球系统与气候科学视觉路线图",
        "左侧是地球圈层剖面和能量物质通量，右侧按系统账本、深部骨架、地表水文、气海热机、气候变化、模型证据、风险选择排列七条课程路径。所有几何均为教学示意而非比例图。",
        concat(parts),
    )
    print("generated earth-visual-roadmap.svg")


if __name__ == "__main__":
    main()
