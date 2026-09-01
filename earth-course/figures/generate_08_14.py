#!/usr/bin/env python3
"""Generate the Earth visual-atlas figures for lectures 08 through 14."""

from __future__ import annotations

from pathlib import Path

from svgkit import (
    PALETTE,
    arrow,
    circle,
    curved_arrow,
    document,
    ellipse,
    header,
    legend_item,
    line,
    multiline,
    panel,
    path,
    polygon,
    project,
    rect,
    save,
    text,
    world_map,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
P = PALETTE

WHITE = P["paper"]
INK = P["ink"]
MUTED = P["muted"]
GRID = P["grid"]
WARM = P["warm"]
COOL = P["cool"]
GOLD = P["gold"]
VIOLET = P["violet"]
TEAL = P["forest"]
ICE_BLUE = "#9edff2"
DEEP = P["deep_ocean"]
LAND_DARK = "#82936f"
SAND = "#e5c68f"
RAIN = P["cool"]


def finish(filename: str, title: str, description: str, body: str) -> None:
    save(OUT / filename, title, description, body)


def map_point(lon: float, lat: float, box: tuple[float, float, float, float]) -> tuple[float, float]:
    return project(lon, lat, *box)


def map_curve(
    points: tuple[tuple[float, float], tuple[float, float], tuple[float, float], tuple[float, float]],
    box: tuple[float, float, float, float],
    *,
    color: str,
    width: float = 3,
    dash: str | None = None,
) -> str:
    mapped = [map_point(lon, lat, box) for lon, lat in points]
    p0, p1, p2, p3 = mapped
    d = (
        f"M{p0[0]:.1f},{p0[1]:.1f} "
        f"C{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}"
    )
    return curved_arrow(d, color=color, width=width, dash=dash, marker="arrow")


def label_box(
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    subtitle: str | None = None,
    *,
    fill: str = WHITE,
    stroke: str = GRID,
    accent: str | None = None,
    title_size: float = 15,
    subtitle_size: float = 12,
) -> str:
    pieces = [rect(x, y, width, height, radius=7, fill=fill, stroke=stroke)]
    if accent:
        pieces.append(rect(x, y, 6, height, radius=3, fill=accent, stroke=accent))
    pieces.append(text(x + width / 2, y + 25, title, size=title_size, weight=750, anchor="middle"))
    if subtitle:
        pieces.append(
            multiline(
                x + width / 2,
                y + 47,
                subtitle.split("\n"),
                size=subtitle_size,
                line_height=16,
                fill=MUTED,
                anchor="middle",
            )
        )
    return "".join(pieces)


def footer_note(value: str, *, y: float = 575) -> str:
    return text(28, y, value, size=11, fill=MUTED)


def draw_cloud(x: float, y: float, scale: float, fill: str = WHITE, stroke: str = "#7eafc4") -> str:
    pieces = [
        ellipse(x, y + 17 * scale, 42 * scale, 14 * scale, fill=fill, stroke=stroke, stroke_width=1.5),
        circle(x - 24 * scale, y + 10 * scale, 15 * scale, fill=fill, stroke=stroke, stroke_width=1.5),
        circle(x, y, 22 * scale, fill=fill, stroke=stroke, stroke_width=1.5),
        circle(x + 24 * scale, y + 10 * scale, 16 * scale, fill=fill, stroke=stroke, stroke_width=1.5),
    ]
    return "".join(pieces)


def draw_sun(cx: float, cy: float, radius: float) -> str:
    pieces = [circle(cx, cy, radius, fill="#f8cf67", stroke=GOLD, stroke_width=2)]
    for dx, dy in ((0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)):
        pieces.append(
            line(
                cx + dx * (radius + 8),
                cy + dy * (radius + 8),
                cx + dx * (radius + 22),
                cy + dy * (radius + 22),
                stroke=GOLD,
                stroke_width=2,
            )
        )
    return "".join(pieces)


def cryosphere_components() -> None:
    title = "Cryosphere components: four stores with different boundaries"
    description = (
        "A schematic, non-navigation world map and component key distinguish seasonal snow, "
        "mountain glaciers, ice sheets, and sea ice by boundary, timescale, and sea-level relevance."
    )
    body = [header("冰冻圈的四个储库", "08 / spatial structure")]
    map_box = (28, 88, 500, 372)
    body.append(world_map(*map_box, title="Global cryosphere: schematic teaching map"))
    for lon, lat, label, color in [
        (-42, 72, "ice sheet", ICE_BLUE),
        (15, 68, "sea ice", "#d8f5fb"),
        (86, 68, "sea ice", "#d8f5fb"),
        (82, 30, "glacier", COOL),
        (-110, 50, "snow", WHITE),
        (0, -72, "ice sheet", ICE_BLUE),
    ]:
        px, py = map_point(lon, lat, map_box)
        body.append(circle(px, py, 8, fill=color, stroke=DEEP, stroke_width=1.5))
        body.append(text(px + 11, py + 4, label, size=11, fill=INK))
    body.append(
        panel(
            554,
            88,
            458,
            372,
            "Component key",
            "same substance, different control volume",
        )
    )
    rows = [
        ("季节性积雪 / seasonal snow", "months to years | water stored near the surface", WHITE, "短时水文储库"),
        ("山地冰川 / mountain glacier", "accumulation, flow, ablation | runoff source", ICE_BLUE, "陆地冰"),
        ("冰盖与冰架 / ice sheet + shelf", "continental ice | long dynamical memory", "#c9eef8", "陆地冰 / floating edge"),
        ("海冰 / sea ice", "frozen seawater | drift, melt ponds, salt flux", "#d8f5fb", "浮冰"),
    ]
    for index, (name, detail, color, tag) in enumerate(rows):
        y = 130 + index * 78
        body.append(rect(575, y, 18, 48, radius=3, fill=color, stroke=DEEP, stroke_width=1.2))
        body.append(text(610, y + 20, name, size=14, weight=750))
        body.append(text(610, y + 40, detail, size=11.5, fill=MUTED))
        body.append(text(972, y + 21, tag, size=11, fill=COOL if "陆地" in tag else TEAL, anchor="end", weight=700))
    body.append(legend_item(40, 505, "land / ice-covered land", P["land"]))
    body.append(legend_item(265, 505, "ocean / floating ice context", P["ocean"]))
    body.append(legend_item(520, 505, "marker = teaching location", DEEP))
    body.append(footer_note("SCHEMATIC / NON-NAVIGATION / geometry and marker locations are not to scale"))
    finish("cryosphere-components.svg", title, description, "".join(body))


def glacier_mass_balance() -> None:
    title = "Glacier mass balance: accumulation, flow, and ablation"
    description = (
        "A glacier cross-section shows the equilibrium line and mass-balance terms, with separate "
        "branches for the land-ice sea-level ledger and the surface-albedo energy ledger."
    )
    body = [header("冰川质量平衡", "08 / process mechanism")]
    body.append(panel(32, 86, 626, 424, "Glacier cross-section", "mass in, mass out, and transport"))
    body.append(rect(55, 128, 580, 320, fill=P["sky"], stroke="none"))
    body.append(
        polygon(
            [(55, 447), (110, 385), (170, 300), (230, 235), (285, 274), (365, 330), (450, 376), (540, 416), (635, 447)],
            fill=P["rock"],
            stroke=LAND_DARK,
            stroke_width=1.4,
        )
    )
    body.append(
        path(
            "M108,385 C150,330 188,276 230,258 C285,235 320,303 367,332 "
            "C420,364 478,390 545,420 L585,447 L190,447 C160,427 130,407 108,385 Z",
            fill=P["ice"],
            stroke=COOL,
            stroke_width=2.2,
        )
    )
    body.append(line(78, 319, 608, 319, stroke=VIOLET, stroke_width=1.5, dash="7 5"))
    body.append(text(82, 313, "equilibrium line / 平衡线", size=11, fill=VIOLET, weight=700))
    body.append(text(120, 205, "积累区", size=15, fill=COOL, weight=750))
    body.append(text(470, 395, "消融区", size=15, fill=WARM, weight=750))
    body.append(arrow(160, 160, 198, 255, color=COOL, width=3))
    body.append(text(106, 154, "snowfall + accumulation", size=12, fill=COOL))
    body.append(arrow(312, 304, 410, 365, color=DEEP, width=3))
    body.append(text(330, 292, "ice flow", size=12, fill=DEEP))
    body.append(arrow(468, 318, 500, 400, color=WARM, width=3))
    body.append(text(495, 332, "melt + runoff", size=12, fill=WARM))
    body.append(arrow(570, 445, 615, 445, color=RAIN, width=3))
    body.append(text(515, 470, "outlet", size=12, fill=RAIN))
    body.append(text(66, 430, "bedrock", size=11, fill=LAND_DARK))
    body.append(
        panel(
            680,
            86,
            332,
            424,
            "Two ledgers",
            "same glacier, different questions",
        )
    )
    body.append(label_box(704, 132, 284, 72, "dM/dt = accumulation - ablation + flow", "mass budget; signs must be defined", fill="#eef7fb", stroke=ICE_BLUE, accent=COOL, title_size=13))
    body.append(arrow(846, 205, 846, 238, color=COOL, width=2.5))
    body.append(label_box(704, 240, 284, 82, "land ice -> sea-level ledger", "extra mass enters the ocean after melt", fill="#fff1ed", stroke="#e5b1a9", accent=WARM, title_size=14))
    body.append(arrow(846, 323, 846, 356, color=WARM, width=2.5))
    body.append(label_box(704, 358, 284, 82, "snow / ice surface -> albedo ledger", "brightness changes absorbed shortwave", fill="#fff8e9", stroke="#e6cf93", accent=GOLD, title_size=14))
    body.append(text(704, 473, "Floating sea ice is a different control volume.", size=11.5, fill=MUTED))
    body.append(legend_item(38, 545, "accumulation", COOL, line_only=True))
    body.append(legend_item(210, 545, "flow / transport", DEEP, line_only=True))
    body.append(legend_item(380, 545, "ablation / melt", WARM, line_only=True))
    body.append(footer_note("A schematic budget: glacier geometry and rates are not observations or forecasts", y=575))
    finish("glacier-mass-balance.svg", title, description, "".join(body))


def coast_planform() -> None:
    title = "Coastal sediment cell: sources, pathways, and sinks"
    description = (
        "A schematic coastal planform and sediment-cell key show river input, waves, longshore "
        "transport, beach and dune storage, and offshore export. Geometry is not for navigation."
    )
    body = [header("海岸沉积单元", "09 / spatial structure")]
    body.append(panel(28, 86, 620, 424, "Coastal planform", "source -> pathway -> storage -> sink"))
    body.append(rect(48, 127, 580, 354, fill=P["ocean"], stroke=P["line"]))
    body.append(
        polygon(
            [(48, 127), (240, 127), (267, 170), (246, 215), (282, 261), (247, 308), (268, 362), (236, 481), (48, 481)],
            fill=P["land"],
            stroke=LAND_DARK,
            stroke_width=1.5,
        )
    )
    body.append(path("M240,127 C267,170 246,215 282,261 C247,308 268,362 236,481", stroke=LAND_DARK, stroke_width=3))
    body.append(
        polygon(
            [(282, 261), (345, 241), (418, 246), (492, 270), (492, 291), (418, 277), (345, 279)],
            fill="#d8edf1",
            stroke=COOL,
            stroke_width=1.2,
        )
    )
    body.append(text(358, 255, "active profile / beach", size=11, fill=DEEP, weight=700))
    body.append(curved_arrow("M82,180 C140,196 182,225 219,250 C244,267 262,264 285,260", color=RAIN, width=4))
    body.append(text(90, 170, "river input", size=12, fill=RAIN, weight=700))
    body.append(curved_arrow("M300,174 C360,154 420,164 475,190", color=WARM, width=3))
    body.append(curved_arrow("M300,350 C366,370 430,359 500,337", color=WARM, width=3))
    body.append(text(386, 154, "longshore drift", size=12, fill=WARM, weight=700))
    body.append(text(411, 382, "wave-driven path", size=11, fill=WARM))
    body.append(curved_arrow("M315,438 C380,420 450,426 548,443", color=DEEP, width=2, dash="7 5"))
    body.append(text(420, 464, "offshore export / shelf", size=11, fill=DEEP))
    for y in (196, 222, 248):
        body.append(path(f"M500,{y} l28,18 l28,-18", stroke="#ffffff", stroke_width=1.3, opacity=.85))
    body.append(text(72, 450, "land", size=12, fill=LAND_DARK, weight=700))
    body.append(
        panel(
            672,
            86,
            340,
            424,
            "Sediment-cell ledger",
            "boundary sets sign",
        )
    )
    ledger = [
        ("Qin", "river and cliff input", RAIN, "#eef7fb"),
        ("Qalong", "alongshore transfer", WARM, "#fff1ed"),
        ("Qs", "beach / dune storage", GOLD, "#fff8e9"),
        ("Qout", "shelf export or dredging", DEEP, "#edf1fa"),
    ]
    for index, (symbol, detail, color, fill) in enumerate(ledger):
        y = 132 + index * 70
        body.append(label_box(702, y, 280, 54, symbol, detail, fill=fill, stroke=GRID, accent=color, title_size=15, subtitle_size=11.5))
    body.append(text(702, 430, "dVs/dt = Qin - Qout + Qnour - Qdredge", size=13, weight=750))
    body.append(text(702, 459, "positive net storage can move a shoreline seaward", size=11.5, fill=MUTED))
    body.append(legend_item(42, 535, "water / wave field", P["ocean"]))
    body.append(legend_item(235, 535, "land", P["land"]))
    body.append(legend_item(365, 535, "sediment transport", WARM, line_only=True))
    body.append(footer_note("SCHEMATIC / NON-NAVIGATION / planform is a teaching boundary, not a coastal chart"))
    finish("coastal-sediment-cell.svg", title, description, "".join(body))


def coastal_profile(
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    *,
    higher_sea: bool,
    retreat: bool,
) -> str:
    sea_y = y + (148 if higher_sea else 174)
    shore_x = x + (120 if retreat else 155)
    pieces = [
        rect(x, y, width, height, radius=7, fill="#fbfdfe", stroke=GRID),
        text(x + 16, y + 26, title, size=14, weight=750),
        polygon(
            [(x + 16, y + height - 26), (x + 16, sea_y), (shore_x, sea_y - 2), (x + width - 18, sea_y - 65), (x + width - 18, y + height - 26)],
            fill=P["land"],
            stroke=LAND_DARK,
            stroke_width=1.2,
        ),
        polygon(
            [(x + 16, sea_y), (shore_x, sea_y), (x + width - 18, sea_y + 42), (x + width - 18, y + height - 26), (x + 16, y + height - 26)],
            fill=P["ocean"],
            stroke="none",
        ),
        line(x + 16, sea_y, x + width - 18, sea_y, stroke=COOL, stroke_width=2),
        text(x + width - 22, sea_y - 8, "relative sea level", size=10.5, fill=COOL, anchor="end"),
        text(x + 20, y + height - 10, "land", size=11, fill=LAND_DARK),
        text(x + width - 70, y + height - 10, "shelf", size=11, fill=DEEP),
    ]
    if retreat:
        pieces.append(arrow(x + 176, sea_y - 74, shore_x + 10, sea_y - 12, color=WARM, width=2.5))
        pieces.append(text(x + 150, y + 91, "shoreline retreat", size=11, fill=WARM, weight=700))
    else:
        pieces.append(arrow(x + 88, sea_y - 50, shore_x - 4, sea_y - 7, color=GOLD, width=2.5))
        pieces.append(text(x + 28, y + 102, "sediment supports beach", size=11, fill=GOLD, weight=700))
    return "".join(pieces)


def sea_level_shore_response() -> None:
    title = "Sea-level and sediment budgets: why shorelines respond"
    description = (
        "A paired coastal profile contrasts a sediment-supported beach with relative sea-level rise "
        "and sediment loss, then maps forcing terms to shoreline response without making a forecast."
    )
    body = [header("海平面与岸线响应", "09 / process mechanism")]
    body.append(panel(28, 86, 626, 424, "Profile response", "same coast, different budget terms"))
    body.append(coastal_profile(50, 126, 276, 338, "A  sediment in >= out", higher_sea=False, retreat=False))
    body.append(coastal_profile(346, 126, 276, 338, "B  RSL rises + sediment loss", higher_sea=True, retreat=True))
    body.append(
        panel(
            680,
            86,
            332,
            424,
            "Causal chain",
            "shoreline is output",
        )
    )
    chain = [
        ("relative sea level", "rise / fall", COOL, "#eef7fb"),
        ("waves + tides", "stress and redistribution", WARM, "#fff1ed"),
        ("sediment budget", "in - out + nourishment", GOLD, "#fff8e9"),
        ("shoreline", "retreat / advance / rollover", DEEP, "#edf1fa"),
    ]
    for index, (name, detail, color, fill) in enumerate(chain):
        y = 130 + index * 72
        body.append(label_box(710, y, 272, 54, name, detail, fill=fill, stroke=GRID, accent=color, title_size=14, subtitle_size=11.5))
        if index < len(chain) - 1:
            body.append(arrow(846, y + 55, 846, y + 70, color=color, width=2.2))
    body.append(text(710, 432, "dS/dt ~= (1 / h*L) dVs/dt", size=14, weight=750))
    body.append(text(710, 458, "a transparent morphology proxy, not a universal law", size=11.5, fill=MUTED))
    body.append(legend_item(42, 535, "higher relative sea level", COOL, line_only=True))
    body.append(legend_item(270, 535, "shoreline retreat", WARM, line_only=True))
    body.append(legend_item(475, 535, "sediment support", GOLD, line_only=True))
    body.append(footer_note("Profiles are schematic; local bathymetry, storms, engineering, and sediment supply matter"))
    finish("sea-level-shore-response.svg", title, description, "".join(body))


def earth_energy_budget() -> None:
    title = "Earth energy budget: geometry before arithmetic"
    description = (
        "A Sun-Earth-atmosphere schematic separates incoming shortwave, reflected shortwave, "
        "surface and atmospheric absorption, and outgoing longwave radiation; colors are ledger categories."
    )
    body = [header("地球能量收支", "10 / spatial structure")]
    body.append(panel(28, 86, 500, 424, "Sun-Earth geometry", "space -> atmosphere -> surface"))
    body.append(draw_sun(95, 257, 38))
    body.append(text(52, 329, "incoming SW", size=12, fill=GOLD, weight=700))
    body.append(arrow(137, 257, 178, 257, color=GOLD, width=3))
    body.append(circle(310, 287, 125, fill=P["ocean"], stroke=DEEP, stroke_width=2))
    body.append(path("M185,289 C230,260 278,254 338,266 C384,275 422,266 434,248 L434,352 C380,374 310,380 255,358 C220,345 199,329 185,289 Z", fill=P["land"], stroke=LAND_DARK, stroke_width=1.2))
    body.append(ellipse(310, 287, 132, 130, fill="none", stroke="#72b4ca", stroke_width=2, opacity=.7))
    body.append(line(198, 287, 422, 287, stroke="#ffffff", stroke_width=1.4, dash="5 5", opacity=.8))
    body.append(text(310, 281, "equatorial band", size=12, fill=DEEP, anchor="middle", weight=700))
    body.append(text(223, 413, "surface absorbs and stores energy", size=12, fill=INK))
    body.append(rect(180, 135, 260, 36, radius=18, fill="#e6f4f7", stroke=TEAL))
    body.append(text(310, 158, "atmosphere + clouds", size=14, fill=TEAL, anchor="middle", weight=750))
    body.append(arrow(260, 172, 260, 196, color=RAIN, width=2.5))
    body.append(arrow(360, 196, 360, 172, color=WARM, width=2.5))
    body.append(text(370, 194, "LW out", size=11, fill=WARM))
    body.append(text(145, 228, "solar angle", size=11, fill=GOLD))
    body.append(
        panel(
            558,
            86,
            454,
            424,
            "Energy ledger",
            "categories are not the same as pathways",
        )
    )
    body.append(label_box(590, 132, 388, 58, "100 units incoming shortwave", "top-of-atmosphere teaching normalization", fill="#fff8e9", stroke="#e6cf93", accent=GOLD, title_size=15))
    body.append(arrow(784, 191, 784, 218, color=GOLD, width=2.4))
    body.append(label_box(590, 220, 180, 70, "reflected SW", "clouds + bright surface", fill="#f6f9fb", stroke=GRID, accent=MUTED, title_size=14))
    body.append(label_box(798, 220, 180, 70, "absorbed SW", "atmosphere + surface", fill="#eef7fb", stroke=RAIN, accent=RAIN, title_size=14))
    body.append(arrow(784, 291, 784, 322, color=RAIN, width=2.4))
    body.append(label_box(590, 326, 388, 68, "outgoing longwave", "the balanced system sends energy back to space", fill="#fff1ed", stroke="#e5b1a9", accent=WARM, title_size=14))
    body.append(arrow(784, 395, 784, 425, color=WARM, width=2.4))
    body.append(text(590, 451, "At equilibrium: absorbed SW ~= outgoing LW.", size=13, weight=750))
    body.append(text(590, 476, "The budget can close even while reservoirs warm.", size=11.5, fill=MUTED))
    body.append(legend_item(40, 535, "shortwave input / reflection", GOLD))
    body.append(legend_item(265, 535, "absorption", RAIN))
    body.append(legend_item(430, 535, "longwave output", WARM))
    body.append(footer_note("Spatial and ledger elements are schematic; the 100-unit split is a teaching normalization"))
    finish("earth-energy-budget.svg", title, description, "".join(body))


def greenhouse_height() -> None:
    title = "Greenhouse effect: the effective emission height"
    description = (
        "A vertical atmospheric column shows shortwave transmission, surface longwave emission, "
        "greenhouse-gas absorption and re-emission, and the effective emission height in a teaching model."
    )
    body = [header("温室效应的高度机制", "10 / process mechanism")]
    body.append(panel(28, 86, 600, 424, "Radiative column", "one-dimensional teaching cross-section"))
    body.append(rect(62, 130, 532, 330, fill="url(#sky-to-space)", stroke=P["line"]))
    body.append(text(82, 153, "space", size=12, fill=WHITE, weight=750))
    body.append(text(82, 442, "surface", size=12, fill=INK, weight=750))
    body.append(rect(62, 408, 532, 52, fill=P["land"], stroke=LAND_DARK))
    body.append(text(328, 440, "surface emits LW after absorbing SW", size=13, anchor="middle", weight=750))
    body.append(arrow(200, 350, 200, 200, color=GOLD, width=3))
    body.append(text(116, 330, "SW in", size=12, fill=GOLD, weight=700))
    body.append(arrow(330, 408, 330, 218, color=WARM, width=4))
    body.append(text(342, 324, "surface LW", size=12, fill=WARM, weight=700))
    body.append(rect(162, 236, 340, 48, radius=22, fill="#dbeef0", stroke=TEAL, opacity=.95))
    body.append(text(332, 266, "greenhouse gases absorb / re-emit LW", size=13, fill=TEAL, anchor="middle", weight=750))
    body.append(arrow(332, 235, 332, 164, color=WARM, width=3))
    body.append(arrow(332, 285, 332, 377, color=WARM, width=3))
    body.append(text(350, 185, "upward re-emission", size=11.5, fill=WARM))
    body.append(text(350, 366, "downward re-emission", size=11.5, fill=WARM))
    body.append(line(105, 205, 555, 205, stroke=VIOLET, stroke_width=2, dash="8 5"))
    body.append(text(110, 197, "effective emission height", size=12, fill=VIOLET, weight=700))
    body.append(arrow(525, 188, 525, 164, color=VIOLET, width=2.3))
    body.append(
        panel(
            662,
            86,
            350,
            424,
            "Feedback chain",
            "hold boundaries in view",
        )
    )
    steps = [
        ("more GHG opacity", "longwave optical depth increases", TEAL, "#eef7f3"),
        ("emission height rises", "the effective layer is higher", VIOLET, "#f0eef8"),
        ("higher layer is colder", "in this simplified lapse-rate picture", COOL, "#eef7fb"),
        ("outgoing LW is reduced", "surface and lower atmosphere adjust", WARM, "#fff1ed"),
    ]
    for index, (name, detail, color, fill) in enumerate(steps):
        y = 132 + index * 65
        body.append(label_box(695, y, 284, 48, name, detail, fill=fill, stroke=GRID, accent=color, title_size=13.5, subtitle_size=11))
        if index < len(steps) - 1:
            body.append(arrow(837, y + 49, 837, y + 62, color=color, width=2.1))
    body.append(label_box(695, 405, 284, 54, "radiative balance is restored", "absorbed SW = outgoing LW at the top boundary", fill="#fff8e9", stroke="#e6cf93", accent=GOLD, title_size=13.5, subtitle_size=11))
    body.append(legend_item(42, 535, "shortwave", GOLD, line_only=True))
    body.append(legend_item(180, 535, "longwave", WARM, line_only=True))
    body.append(legend_item(315, 535, "emission height", VIOLET, line_only=True, dashed=True))
    body.append(footer_note("This column explains a mechanism, not a direct temperature prediction"))
    finish("greenhouse-height.svg", title, description, "".join(body))


def cell_loop(x_left: float, x_right: float, *, top: float, bottom: float, color: str, surface_to_left: bool) -> str:
    if surface_to_left:
        bottom_start, bottom_end = x_right, x_left
        top_start, top_end = x_left, x_right
    else:
        bottom_start, bottom_end = x_left, x_right
        top_start, top_end = x_right, x_left
    pieces = [
        arrow(bottom_start, bottom, bottom_end, bottom, color=color, width=2.4),
        arrow(bottom_end, bottom - 5, bottom_end, top + 8, color=color, width=2.4),
        arrow(top_end, top, top_start, top, color=color, width=2.4),
        arrow(top_start, top + 5, top_start, bottom - 8, color=color, width=2.4),
    ]
    return "".join(pieces)


def atmospheric_circulation() -> None:
    title = "Atmospheric circulation: three cells and three wind belts"
    description = (
        "A schematic meridional cross-section shows Hadley, Ferrel, and Polar cells, the ITCZ, "
        "subtropical highs, polar fronts, and the associated trade-wind and westerly belts."
    )
    body = [header("大气三圈环流", "11 / spatial structure")]
    body.append(panel(30, 82, 980, 432, "Meridional circulation", "idealized zonal-mean teaching section"))
    body.append(rect(58, 132, 924, 304, fill=P["sky"], stroke=P["line"]))
    body.append(rect(58, 132, 154, 304, fill="#eaf2f6", stroke="none", opacity=.65))
    body.append(rect(366, 132, 154, 304, fill="#fff8e9", stroke="none", opacity=.55))
    body.append(rect(674, 132, 154, 304, fill="#fff8e9", stroke="none", opacity=.55))
    body.append(rect(828, 132, 154, 304, fill="#eaf2f6", stroke="none", opacity=.65))
    body.append(line(58, 430, 982, 430, stroke=LAND_DARK, stroke_width=3))
    body.append(line(58, 185, 982, 185, stroke=VIOLET, stroke_width=1.4, dash="7 5"))
    body.append(text(70, 178, "tropopause / upper branch", size=11, fill=VIOLET))
    latitude_x = { -90: 75, -60: 215, -30: 370, 0: 520, 30: 670, 60: 825, 90: 965 }
    for lat, x in latitude_x.items():
        body.append(line(x, 132, x, 436, stroke="#ffffff", stroke_width=1, opacity=.75))
        body.append(text(x, 455, f"{abs(lat)}" + ("S" if lat < 0 else "N" if lat > 0 else ""), size=11, fill=MUTED, anchor="middle"))
    body.append(text(520, 152, "ITCZ / rising branch", size=12.5, fill=WARM, anchor="middle", weight=750))
    body.append(text(670, 418, "subtropical high", size=11.5, fill=INK, anchor="middle", weight=700))
    body.append(text(825, 418, "polar front", size=11.5, fill=INK, anchor="middle", weight=700))
    body.append(cell_loop(370, 520, top=210, bottom=416, color=WARM, surface_to_left=False))
    body.append(cell_loop(520, 670, top=210, bottom=416, color=WARM, surface_to_left=True))
    body.append(cell_loop(215, 370, top=230, bottom=416, color=VIOLET, surface_to_left=True))
    body.append(cell_loop(670, 825, top=230, bottom=416, color=VIOLET, surface_to_left=False))
    body.append(cell_loop(75, 215, top=250, bottom=416, color=COOL, surface_to_left=False))
    body.append(cell_loop(825, 965, top=250, bottom=416, color=COOL, surface_to_left=True))
    body.append(text(445, 245, "Hadley", size=13, fill=WARM, anchor="middle", weight=750))
    body.append(text(292, 265, "Ferrel", size=13, fill=VIOLET, anchor="middle", weight=750))
    body.append(text(145, 285, "Polar", size=13, fill=COOL, anchor="middle", weight=750))
    body.append(text(595, 245, "Hadley", size=13, fill=WARM, anchor="middle", weight=750))
    body.append(text(748, 265, "Ferrel", size=13, fill=VIOLET, anchor="middle", weight=750))
    body.append(text(895, 285, "Polar", size=13, fill=COOL, anchor="middle", weight=750))
    body.append(text(28, 548, "surface wind belts", size=12.5, fill=INK, weight=750))
    body.append(arrow(110, 545, 176, 545, color=COOL, width=2.5))
    body.append(text(185, 549, "polar easterlies", size=11, fill=MUTED))
    body.append(arrow(355, 545, 430, 545, color=VIOLET, width=2.5))
    body.append(text(440, 549, "westerlies", size=11, fill=MUTED))
    body.append(arrow(705, 545, 630, 545, color=VIOLET, width=2.5))
    body.append(text(715, 549, "westerlies", size=11, fill=MUTED))
    body.append(arrow(900, 545, 834, 545, color=COOL, width=2.5))
    body.append(text(910, 549, "polar easterlies", size=11, fill=MUTED))
    body.append(legend_item(28, 575, "Hadley / warm ascent", WARM, line_only=True))
    body.append(legend_item(244, 575, "Ferrel / indirect", VIOLET, line_only=True))
    body.append(legend_item(425, 575, "Polar / cold descent", COOL, line_only=True))
    finish("atmospheric-circulation.svg", title, description, "".join(body))


def cyclone_force_balance() -> None:
    title = "Cyclone force balance: pressure gradient, Coriolis, and friction"
    description = (
        "A force-balance schematic compares Northern and Southern Hemisphere low-pressure flow, "
        "showing inward pressure-gradient force, hemisphere-dependent Coriolis deflection, and surface friction."
    )
    body = [header("气旋的力平衡", "11 / process mechanism")]
    body.append(panel(28, 86, 620, 424, "Horizontal force diagram", "idealized near-surface low"))
    for cx, cy, hemisphere in ((200, 296, "NH: counterclockwise"), (460, 296, "SH: clockwise")):
        body.append(circle(cx, cy, 74, fill="#eef7fb", stroke=COOL, stroke_width=1.5))
        body.append(circle(cx, cy, 20, fill="#ffffff", stroke=WARM, stroke_width=2))
        body.append(text(cx, cy + 5, "L", size=18, fill=WARM, anchor="middle", weight=800))
        body.append(text(cx, cy - 92, hemisphere, size=12.5, fill=INK, anchor="middle", weight=750))
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            body.append(arrow(cx + dx * 108, cy + dy * 108, cx + dx * 28, cy + dy * 28, color=GOLD, width=2.3))
        if cx < 300:
            body.append(curved_arrow(f"M{cx+58},{cy-48} C{cx+92},{cy-10} {cx+87},{cy+48} {cx+40},{cy+65}", color=COOL, width=3))
            body.append(curved_arrow(f"M{cx-52},{cy+48} C{cx-88},{cy+10} {cx-82},{cy-46} {cx-36},{cy-66}", color=COOL, width=3))
        else:
            body.append(curved_arrow(f"M{cx-58},{cy-48} C{cx-92},{cy-10} {cx-87},{cy+48} {cx-40},{cy+65}", color=COOL, width=3))
            body.append(curved_arrow(f"M{cx+52},{cy+48} C{cx+88},{cy+10} {cx+82},{cy-46} {cx+36},{cy-66}", color=COOL, width=3))
        body.append(text(cx - 102, cy + 125, "pressure gradient -> inward", size=10.5, fill=GOLD))
        body.append(text(cx - 102, cy + 143, "Coriolis -> deflection", size=10.5, fill=COOL))
    body.append(path("M125,440 C235,420 345,424 555,440", stroke=MUTED, stroke_width=2, dash="7 5"))
    body.append(text(340, 464, "friction near surface slows and turns the wind inward", size=11.5, fill=MUTED, anchor="middle"))
    body.append(
        panel(
            680,
            86,
            332,
            424,
            "Vector ledger",
            "the terms change with scale",
        )
    )
    rows = [
        ("-grad p", "pressure-gradient force", GOLD, "#fff8e9"),
        ("-f k x u", "Coriolis deflection; sign flips by hemisphere", COOL, "#eef7fb"),
        ("-r u", "surface friction / boundary layer", MUTED, "#f6f9fb"),
        ("sum", "wind response is a balance, not one force", WARM, "#fff1ed"),
    ]
    for index, (symbol, detail, color, fill) in enumerate(rows):
        y = 132 + index * 70
        body.append(label_box(704, y, 284, 54, symbol, detail, fill=fill, stroke=GRID, accent=color, title_size=15, subtitle_size=11.2))
    body.append(text(704, 431, "gradient-wind balance", size=14, weight=750))
    body.append(text(704, 456, "away from the equator, with a boundary-layer caveat", size=11.5, fill=MUTED))
    body.append(legend_item(40, 535, "pressure gradient", GOLD, line_only=True))
    body.append(legend_item(225, 535, "Coriolis response", COOL, line_only=True))
    body.append(legend_item(415, 535, "frictional boundary", MUTED, line_only=True, dashed=True))
    body.append(footer_note("The low-pressure spirals are schematic; real storms require thermodynamics and 3-D structure"))
    finish("cyclone-force-balance.svg", title, description, "".join(body))


def cloud_atlas() -> None:
    title = "Cloud atlas: form, altitude, and phase"
    description = (
        "A vertical cloud atlas places stratus, cumulus, cumulonimbus, nimbostratus, and cirrus "
        "by approximate altitude and distinguishes liquid cloud water, ice, and precipitation."
    )
    body = [header("云型图谱", "12 / spatial structure")]
    body.append(panel(28, 86, 640, 424, "Vertical cloud atlas", "cloud shape is a visible proxy for process"))
    body.append(rect(58, 127, 586, 336, fill=P["sky"], stroke=P["line"]))
    body.append(line(120, 144, 120, 450, stroke=MUTED, stroke_width=1.5))
    for y, label in ((430, "surface"), (355, "2 km"), (270, "6 km"), (185, "10 km"), (145, "tropopause")):
        body.append(line(120, y, 630, y, stroke="#ffffff", stroke_width=1, dash="4 5", opacity=.75))
        body.append(text(112, y + 4, label, size=10.5, fill=MUTED, anchor="end"))
    body.append(draw_cloud(170, 390, 1.18, fill="#ffffff"))
    body.append(text(122, 429, "stratus / 层云", size=12, fill=DEEP, weight=750))
    body.append(draw_cloud(300, 335, .9, fill="#ffffff"))
    body.append(text(267, 375, "cumulus / 积云", size=12, fill=DEEP, weight=750))
    body.append(draw_cloud(470, 291, 1.05, fill="#f2fbfd"))
    body.append(text(430, 331, "nimbostratus", size=12, fill=DEEP, weight=750))
    body.append(draw_cloud(365, 227, .72, fill="#f7fbfc"))
    body.append(path("M332,250 C350,240 380,240 402,251", stroke=VIOLET, stroke_width=4))
    for dx in (343, 360, 377, 394):
        body.append(line(dx, 259, dx - 5, 280, stroke=RAIN, stroke_width=2))
    body.append(text(430, 278, "steady rain / snow", size=10.5, fill=RAIN))
    body.append(draw_cloud(550, 155, .62, fill="#ffffff"))
    body.append(path("M508,164 C535,145 566,164 600,148", stroke=VIOLET, stroke_width=2.4))
    body.append(text(493, 132, "cirrus / 卷云", size=12, fill=VIOLET, weight=750))
    body.append(draw_cloud(235, 276, .82, fill="#eef8fa", stroke=WARM))
    body.append(path("M215,299 C225,265 240,230 250,190 C258,160 269,145 276,132", stroke=WARM, stroke_width=4))
    body.append(text(110, 202, "cumulonimbus / 积雨云", size=12, fill=WARM, weight=750))
    for dx in (238, 252, 266):
        body.append(line(dx, 306, dx - 5, 352, stroke=RAIN, stroke_width=2))
    body.append(
        panel(
            700,
            86,
            312,
            424,
            "Reading the forms",
            "approx. altitude",
        )
    )
    items = [
        ("Stratus", "layered, stable uplift", "#ffffff", COOL),
        ("Cumulus", "localized convection", "#ffffff", COOL),
        ("Cumulonimbus", "deep convection + heavy precip", "#eef8fa", WARM),
        ("Nimbostratus", "broad, persistent precip", "#f2fbfd", DEEP),
        ("Cirrus", "high ice crystals", "#ffffff", VIOLET),
    ]
    for index, (name, detail, fill, color) in enumerate(items):
        y = 132 + index * 55
        body.append(ellipse(726, y + 22, 17, 9, fill=fill, stroke=color, stroke_width=1.5))
        body.append(text(755, y + 19, name, size=13.5, weight=750))
        body.append(text(755, y + 38, detail, size=11, fill=MUTED))
    body.append(text(720, 426, "Cloud presence is not the same as", size=12, fill=INK, weight=700))
    body.append(text(720, 446, "precipitation reaching the ground.", size=12, fill=INK, weight=700))
    body.append(legend_item(40, 535, "liquid / mixed cloud", ICE_BLUE))
    body.append(legend_item(235, 535, "ice-rich cloud", VIOLET))
    body.append(legend_item(405, 535, "precipitation", RAIN, line_only=True))
    body.append(footer_note("Schematic altitude bands are not a sounding or an aviation product"))
    finish("cloud-atlas.svg", title, description, "".join(body))


def precipitation_mechanisms() -> None:
    title = "Precipitation mechanisms: warm rain and ice-phase growth"
    description = (
        "A process comparison follows lifting and saturation into collision-coalescence warm rain "
        "and ice-phase deposition, riming, aggregation, and melting; dashed links are conditional."
    )
    body = [header("降水形成机制", "12 / process mechanism")]
    body.append(label_box(38, 92, 215, 58, "lift / 抬升", "expansion cooling", fill="#eef7fb", stroke=ICE_BLUE, accent=COOL, title_size=15))
    body.append(arrow(258, 121, 305, 121, color=COOL, width=2.5))
    body.append(label_box(310, 92, 215, 58, "saturation / 饱和", "RH reaches 100 percent", fill="#f0eef8", stroke="#c8bee3", accent=VIOLET, title_size=15))
    body.append(arrow(530, 121, 575, 121, color=VIOLET, width=2.5))
    body.append(label_box(580, 92, 215, 58, "cloud particles", "droplets and/or crystals", fill="#f6f9fb", stroke=GRID, accent=DEEP, title_size=15))
    body.append(arrow(800, 121, 845, 121, color=DEEP, width=2.5))
    body.append(label_box(850, 92, 150, 58, "falling", "hydrometeor", fill="#fff1ed", stroke="#e5b1a9", accent=RAIN, title_size=15))
    body.append(panel(28, 182, 476, 326, "Warm-rain path", "collision-coalescence"))
    body.append(panel(536, 182, 476, 326, "Ice-phase path", "deposition, riming, aggregation"))
    body.append(label_box(58, 232, 140, 58, "cloud droplets", "micron-scale", fill="#eef7fb", stroke=ICE_BLUE, accent=COOL, title_size=14))
    for i in range(5):
        body.append(circle(92 + i * 18, 337 + (i % 2) * 12, 5 + (i % 3), fill="#d8f3fa", stroke=COOL, stroke_width=1.2))
    body.append(arrow(200, 260, 256, 326, color=COOL, width=2.5))
    body.append(label_box(260, 303, 140, 58, "collisions", "some droplets grow", fill="#fff8e9", stroke="#e6cf93", accent=GOLD, title_size=14))
    body.append(arrow(400, 333, 455, 333, color=GOLD, width=2.5))
    body.append(ellipse(456, 333, 15, 23, fill="#8fd0e2", stroke=DEEP, stroke_width=1.5))
    body.append(arrow(456, 360, 456, 407, color=RAIN, width=2.5))
    body.append(text(407, 445, "rain", size=13, fill=RAIN, weight=750))
    body.append(text(58, 458, "needs liquid water, uplift, and enough residence time", size=11.5, fill=MUTED))
    body.append(label_box(566, 232, 140, 58, "ice crystals", "cold cloud / mixed phase", fill="#f0eef8", stroke="#c8bee3", accent=VIOLET, title_size=14))
    body.append(polygon([(635, 323), (643, 338), (660, 341), (647, 351), (650, 368), (635, 357), (620, 368), (623, 351), (610, 341), (627, 338)], fill="#eef7fb", stroke=VIOLET, stroke_width=1.5))
    body.append(arrow(706, 260, 755, 331, color=VIOLET, width=2.5))
    body.append(label_box(752, 303, 140, 58, "growth", "deposition + riming", fill="#f0eef8", stroke="#c8bee3", accent=VIOLET, title_size=14))
    body.append(arrow(893, 333, 950, 333, color=VIOLET, width=2.5))
    body.append(path("M956,319 C970,304 985,319 978,335 C987,349 973,363 961,350 C947,360 938,345 948,333 C939,326 947,317 956,319 Z", fill="#e9f8ff", stroke=VIOLET, stroke_width=1.5))
    body.append(arrow(960, 357, 960, 407, color=RAIN, width=2.5))
    body.append(text(915, 445, "snow / rain after melt", size=12.5, fill=RAIN, weight=750))
    body.append(path("M710,280 C740,245 795,245 820,276", stroke=VIOLET, stroke_width=1.8, dash="7 5"))
    body.append(text(570, 458, "phase changes create a second route to large hydrometeors", size=11.5, fill=MUTED))
    body.append(legend_item(42, 535, "liquid-water path", COOL, line_only=True))
    body.append(legend_item(235, 535, "ice / mixed-phase path", VIOLET, line_only=True))
    body.append(legend_item(465, 535, "conditional transition", MUTED, line_only=True, dashed=True))
    body.append(footer_note("A cloud can be present while conversion efficiency remains too small for surface precipitation"))
    finish("precipitation-mechanisms.svg", title, description, "".join(body))


def global_ocean_currents() -> None:
    title = "Global surface currents: gyres, western boundary currents, and upwelling"
    description = (
        "A schematic equirectangular, non-navigation world map highlights subtropical gyres, "
        "warm western boundary currents, cool eastern boundary currents, coastal upwelling, and the Antarctic Circumpolar Current."
    )
    body = [header("全球表层洋流", "13 / spatial structure")]
    map_box = (28, 86, 984, 394)
    body.append(world_map(*map_box, title="Surface circulation: schematic global map"))
    warm_curves = [
        ((130, 24), (144, 31), (151, 42), (146, 50)),
        ((-80, 25), (-60, 28), (-46, 39), (-28, 44)),
        ((-55, 11), (-34, 13), (-15, 18), (4, 22)),
        ((151, -36), (162, -25), (158, -12), (150, 2)),
        ((40, -34), (68, -31), (93, -22), (112, -8)),
    ]
    cool_curves = [
        ((-146, 43), (-140, 33), (-132, 23), (-120, 16)),
        ((-13, 36), (-20, 27), (-22, 19), (-18, 11)),
        ((-78, -8), (-84, -20), (-84, -32), (-78, -42)),
        ((18, -10), (13, -21), (10, -31), (8, -39)),
    ]
    for points in warm_curves:
        body.append(map_curve(points, map_box, color=WARM, width=4))
    for points in cool_curves:
        body.append(map_curve(points, map_box, color=COOL, width=3.5))
    body.append(map_curve(((-170, -52), (-80, -58), (70, -59), (170, -52)), map_box, color=DEEP, width=5))
    for lon, lat in ((-80, 15), (-79, -12), (10, -23)):
        px, py = map_point(lon, lat, map_box)
        body.append(arrow(px, py + 25, px, py - 12, color=COOL, width=3))
    body.append(text(*map_point(-68, 20, map_box), "eastern-boundary upwelling", size=11, fill=COOL, weight=750))
    body.append(text(*map_point(116, 56, map_box), "Kuroshio / western boundary", size=11, fill=WARM, weight=750))
    body.append(text(*map_point(-73, 47, map_box), "Gulf Stream", size=11, fill=WARM, weight=750))
    body.append(text(*map_point(-160, -64, map_box), "ACC / Antarctic Circumpolar Current", size=11, fill=DEEP, weight=750))
    body.append(text(*map_point(-135, 8, map_box), "subtropical gyre", size=11, fill=INK))
    body.append(text(*map_point(40, -48, map_box), "cool eastern boundary", size=10.5, fill=COOL))
    body.append(legend_item(40, 525, "warm surface current", WARM, line_only=True))
    body.append(legend_item(260, 525, "cool surface current", COOL, line_only=True))
    body.append(legend_item(475, 525, "circumpolar current", DEEP, line_only=True))
    body.append(legend_item(705, 525, "coastal upwelling", COOL, line_only=True))
    body.append(footer_note("SCHEMATIC / NON-NAVIGATION / current paths, widths, and coastlines are not to scale"))
    finish("global-ocean-currents.svg", title, description, "".join(body))


def overturning_circulation() -> None:
    title = "Ocean overturning: a slow loop linking surface and deep water"
    description = (
        "A schematic meridional ocean section separates warm poleward surface flow, high-latitude "
        "dense-water formation, cold deep return flow, and interior mixing from the faster wind-driven surface layer."
    )
    body = [header("海洋深层翻转", "13 / process mechanism")]
    body.append(panel(28, 86, 660, 424, "Meridional section", "surface heat route and deep density route"))
    body.append(rect(58, 132, 600, 310, fill="url(#ocean-depth)", stroke=P["line"]))
    body.append(polygon([(58, 132), (176, 132), (192, 166), (175, 212), (190, 250), (178, 442), (58, 442)], fill=P["land"], stroke=LAND_DARK, stroke_width=1.3))
    body.append(polygon([(550, 132), (658, 132), (658, 442), (548, 442), (530, 365), (548, 288), (526, 218)], fill=P["land"], stroke=LAND_DARK, stroke_width=1.3))
    body.append(line(58, 192, 658, 192, stroke="#e9fcff", stroke_width=2))
    body.append(text(70, 158, "high latitude", size=11, fill=LAND_DARK, weight=700))
    body.append(text(560, 158, "high latitude", size=11, fill=LAND_DARK, weight=700))
    body.append(curved_arrow("M175,184 C275,146 412,146 542,184", color=WARM, width=5))
    body.append(text(276, 153, "warm surface flow", size=13, fill=WARM, weight=750))
    body.append(arrow(545, 194, 545, 360, color=COOL, width=4))
    body.append(text(554, 286, "dense water formation", size=12, fill=COOL, weight=750))
    body.append(curved_arrow("M540,392 C420,430 265,430 180,392", color=DEEP, width=5))
    body.append(text(286, 423, "cold deep return", size=13, fill=WHITE, weight=750))
    body.append(arrow(178, 388, 178, 235, color=TEAL, width=3, dash="7 5"))
    body.append(text(82, 282, "mixing / upwelling", size=11.5, fill=WHITE, weight=750))
    body.append(arrow(283, 195, 283, 242, color=GOLD, width=2.5))
    body.append(text(294, 224, "wind / Ekman layer", size=11, fill=GOLD))
    body.append(
        panel(
            720,
            86,
            292,
            424,
            "Two drivers",
            "keep drivers distinct",
        )
    )
    body.append(label_box(746, 132, 240, 78, "surface circulation", "wind stress + pressure field\nfaster response", fill="#fff8e9", stroke="#e6cf93", accent=GOLD, title_size=14))
    body.append(arrow(866, 211, 866, 242, color=GOLD, width=2.3))
    body.append(label_box(746, 244, 240, 84, "deep overturning", "buoyancy + formation + mixing\nlonger memory", fill="#eef7fb", stroke=ICE_BLUE, accent=DEEP, title_size=14))
    body.append(arrow(866, 329, 866, 360, color=DEEP, width=2.3))
    body.append(label_box(746, 362, 240, 72, "boundary conditions", "basin shape, freshwater, ice, topography", fill="#f6f9fb", stroke=GRID, accent=VIOLET, title_size=14))
    body.append(text(746, 470, "density is a state diagnostic, not a full transport forecast", size=11.5, fill=MUTED))
    body.append(legend_item(42, 535, "warm surface", WARM, line_only=True))
    body.append(legend_item(220, 535, "cold deep", DEEP, line_only=True))
    body.append(legend_item(380, 535, "mixing / inferred link", TEAL, line_only=True, dashed=True))
    body.append(footer_note("Meridional geometry and branch widths are schematic, not a section of the real ocean"))
    finish("overturning-circulation.svg", title, description, "".join(body))


def enso_panel(x: float, state: str, subtitle: str, mode: str, accent: str) -> str:
    y = 86
    pieces = [
        rect(x, y, 314, 424, radius=8, fill="#fbfdfe", stroke=GRID),
        text(x + 157, y + 34, state, size=19, fill=accent, anchor="middle", weight=800),
        text(x + 157, y + 57, subtitle, size=11.5, fill=MUTED, anchor="middle"),
        rect(x + 20, y + 103, 274, 193, fill=P["ocean"], stroke=DEEP),
        rect(x + 20, y + 103, 38, 193, fill=P["land"], stroke=LAND_DARK),
        rect(x + 256, y + 103, 38, 193, fill=P["land"], stroke=LAND_DARK),
        text(x + 39, y + 122, "W", size=11, fill=LAND_DARK, anchor="middle", weight=750),
        text(x + 275, y + 122, "E", size=11, fill=LAND_DARK, anchor="middle", weight=750),
        line(x + 58, y + 141, x + 256, y + 141, stroke="#e9fcff", stroke_width=2),
    ]
    if mode == "elnino":
        pieces.append(polygon([(x + 58, y + 141), (x + 256, y + 141), (x + 256, y + 207), (x + 58, y + 188)], fill="#e9a39b", stroke="none", opacity=.9))
        thermocline = f"M{x+60},{y+205} C{x+120},{y+217} {x+190},{y+239} {x+254},{y+230}"
        pieces.append(arrow(x + 226, y + 76, x + 145, y + 76, color=WARM, width=2, dash="7 5"))
        pieces.append(text(x + 157, y + 91, "trades weakened", size=10.5, fill=WARM, anchor="middle", weight=700))
        pieces.append(text(x + 205, y + 176, "warm east", size=11, fill=WARM, weight=750))
        pieces.append(text(x + 202, y + 270, "upwelling weak", size=10.5, fill=MUTED, anchor="middle"))
    elif mode == "lanina":
        pieces.append(polygon([(x + 58, y + 141), (x + 180, y + 141), (x + 180, y + 191), (x + 58, y + 177)], fill="#e9a39b", stroke="none", opacity=.9))
        pieces.append(polygon([(x + 180, y + 141), (x + 256, y + 141), (x + 256, y + 209), (x + 180, y + 198)], fill="#83c9e2", stroke="none", opacity=.9))
        thermocline = f"M{x+60},{y+220} C{x+125},{y+205} {x+190},{y+177} {x+254},{y+156}"
        pieces.append(arrow(x + 246, y + 76, x + 86, y + 76, color=COOL, width=3))
        pieces.append(text(x + 157, y + 91, "trades strengthened", size=10.5, fill=COOL, anchor="middle", weight=700))
        pieces.append(text(x + 108, y + 176, "warm west", size=11, fill=WARM, weight=750))
        pieces.append(text(x + 226, y + 270, "upwelling strong", size=10.5, fill=COOL, anchor="middle", weight=700))
        pieces.append(arrow(x + 258, y + 225, x + 258, y + 173, color=COOL, width=2.5))
    else:
        pieces.append(polygon([(x + 58, y + 141), (x + 190, y + 141), (x + 190, y + 189), (x + 58, y + 180)], fill="#e9a39b", stroke="none", opacity=.9))
        pieces.append(polygon([(x + 190, y + 141), (x + 256, y + 141), (x + 256, y + 201), (x + 190, y + 194)], fill="#a5d9ea", stroke="none", opacity=.9))
        thermocline = f"M{x+60},{y+215} C{x+130},{y+206} {x+200},{y+184} {x+254},{y+169}"
        pieces.append(arrow(x + 246, y + 76, x + 86, y + 76, color=DEEP, width=2.5))
        pieces.append(text(x + 157, y + 91, "trade winds", size=10.5, fill=DEEP, anchor="middle", weight=700))
        pieces.append(text(x + 106, y + 176, "warm west", size=11, fill=WARM, weight=750))
        pieces.append(text(x + 224, y + 270, "upwelling", size=10.5, fill=COOL, anchor="middle", weight=700))
        pieces.append(arrow(x + 258, y + 225, x + 258, y + 176, color=COOL, width=2.2))
    pieces.extend(
        [
            path(thermocline, stroke=VIOLET, stroke_width=2.5),
            text(x + 157, y + 220, "thermocline / 温跃层", size=10.5, fill=VIOLET, anchor="middle"),
            line(x + 20, y + 310, x + 294, y + 310, stroke=GRID, stroke_width=1),
        ]
    )
    states = {
        "neutral": ("east-west contrast maintained", "东西温差维持"),
        "elnino": ("warm anomaly shifts east", "暖异常向东，冷舌减弱"),
        "lanina": ("cold tongue and upwelling strengthen", "冷舌与上升流增强"),
    }
    en, zh = states[mode]
    pieces.append(text(x + 157, y + 344, en, size=11.5, fill=INK, anchor="middle", weight=700))
    pieces.append(text(x + 157, y + 368, zh, size=11.5, fill=MUTED, anchor="middle"))
    return "".join(pieces)


def enso_three_states() -> None:
    title = "ENSO three states: trade winds, thermocline, and upwelling"
    description = (
        "Three schematic equatorial Pacific sections compare neutral, El Nino, and La Nina states "
        "using trade-wind direction, thermocline slope, warm or cool surface anomalies, and eastern upwelling."
    )
    body = [header("ENSO 三状态", "14 / spatial structure")]
    body.append(enso_panel(28, "Neutral", "背景态 / baseline", "neutral", DEEP))
    body.append(enso_panel(363, "El Nino", "暖事件 / warm anomaly", "elnino", WARM))
    body.append(enso_panel(698, "La Nina", "冷事件 / cool anomaly", "lanina", COOL))
    body.append(legend_item(40, 538, "warm SST anomaly", WARM))
    body.append(legend_item(245, 538, "cool SST / upwelling", COOL))
    body.append(legend_item(455, 538, "thermocline", VIOLET, line_only=True))
    body.append(legend_item(655, 538, "trade-wind vector", DEEP, line_only=True))
    body.append(footer_note("SCHEMATIC / NON-NAVIGATION / equatorial section is not a navigation chart or a fixed forecast"))
    finish("enso-three-states.svg", title, description, "".join(body))


def monsoon_panel(x: float, title: str, summer: bool) -> str:
    y = 86
    pieces = [
        rect(x, y, 472, 398, radius=8, fill="#fbfdfe", stroke=GRID),
        text(x + 236, y + 34, title, size=19, fill=WARM if summer else COOL, anchor="middle", weight=800),
        text(x + 236, y + 57, "land-sea thermal contrast", size=11.5, fill=MUTED, anchor="middle"),
        rect(x + 20, y + 100, 432, 210, fill=P["sky"], stroke=P["line"]),
        rect(x + 20, y + 250, 200, 60, fill=P["ocean"], stroke=DEEP),
        polygon(
            [(x + 220, y + 235), (x + 452, y + 205), (x + 452, y + 310), (x + 220, y + 310)],
            fill="#e5e3c3" if summer else "#dbe7d2",
            stroke=LAND_DARK,
            stroke_width=1.2,
        ),
        line(x + 20, y + 250, x + 452, y + 250, stroke=DEEP, stroke_width=2),
        text(x + 112, y + 299, "ocean", size=12, fill=DEEP, anchor="middle", weight=750),
        text(x + 335, y + 299, "land", size=12, fill=LAND_DARK, anchor="middle", weight=750),
    ]
    if summer:
        pieces.append(draw_sun(x + 346, y + 124, 25))
        pieces.append(arrow(x + 346, y + 164, x + 346, y + 218, color=GOLD, width=3))
        pieces.append(text(x + 365, y + 192, "strong heating", size=11, fill=GOLD, weight=700))
        pieces.append(circle(x + 345, y + 210, 21, fill="#fff1ed", stroke=WARM, stroke_width=2))
        pieces.append(text(x + 345, y + 215, "L", size=16, fill=WARM, anchor="middle", weight=800))
        pieces.append(arrow(x + 92, y + 238, x + 282, y + 238, color=RAIN, width=4))
        pieces.append(text(x + 187, y + 224, "moist onshore flow", size=11.5, fill=RAIN, anchor="middle", weight=750))
        pieces.append(arrow(x + 345, y + 245, x + 345, y + 190, color=WARM, width=2.8))
        for dx in (315, 335, 355, 375):
            pieces.append(line(x + dx, y + 205, x + dx - 4, y + 222, stroke=RAIN, stroke_width=2))
        pieces.append(text(x + 345, y + 185, "rising air + rain", size=11, fill=RAIN, anchor="middle", weight=750))
        pieces.append(text(x + 235, y + 344, "NH summer: ocean -> land", size=13, fill=WARM, anchor="middle", weight=750))
        pieces.append(text(x + 235, y + 368, "land low pressure draws moisture inland", size=11.5, fill=MUTED, anchor="middle"))
    else:
        pieces.append(draw_sun(x + 105, y + 135, 18))
        pieces.append(arrow(x + 105, y + 165, x + 105, y + 207, color=GOLD, width=2.2))
        pieces.append(text(x + 135, y + 190, "weaker heating", size=11, fill=GOLD, weight=700))
        pieces.append(circle(x + 345, y + 210, 21, fill="#eef7fb", stroke=COOL, stroke_width=2))
        pieces.append(text(x + 345, y + 215, "H", size=16, fill=COOL, anchor="middle", weight=800))
        pieces.append(arrow(x + 282, y + 238, x + 92, y + 238, color=COOL, width=4))
        pieces.append(text(x + 187, y + 224, "dry offshore flow", size=11.5, fill=COOL, anchor="middle", weight=750))
        pieces.append(arrow(x + 345, y + 190, x + 345, y + 245, color=COOL, width=2.8))
        pieces.append(text(x + 345, y + 185, "subsidence / drier land", size=11, fill=COOL, anchor="middle", weight=750))
        pieces.append(text(x + 235, y + 344, "NH winter: land -> ocean", size=13, fill=COOL, anchor="middle", weight=750))
        pieces.append(text(x + 235, y + 368, "cool land high pressure reverses the flow", size=11.5, fill=MUTED, anchor="middle"))
    return "".join(pieces)


def monsoon_seasonal_engine() -> None:
    title = "Monsoon seasonal engine: a pressure-gradient reversal"
    description = (
        "A paired Northern Hemisphere summer and winter cross-section shows land-sea heating contrast, "
        "pressure reversal, wind reversal, rising or sinking air, and the resulting precipitation redistribution."
    )
    body = [header("季风季节反转", "14 / process mechanism")]
    body.append(monsoon_panel(28, "NH summer / 夏季", True))
    body.append(monsoon_panel(540, "NH winter / 冬季", False))
    body.append(text(28, 514, "seasonal heating", size=12.5, fill=GOLD, weight=750))
    body.append(arrow(140, 509, 250, 509, color=GOLD, width=2.5))
    body.append(label_box(255, 486, 170, 48, "pressure gradient", "low / high contrast", fill="#f6f9fb", stroke=GRID, accent=VIOLET, title_size=13.5, subtitle_size=11))
    body.append(arrow(430, 509, 540, 509, color=VIOLET, width=2.5))
    body.append(label_box(545, 486, 170, 48, "wind reversal", "onshore / offshore", fill="#eef7fb", stroke=ICE_BLUE, accent=COOL, title_size=13.5, subtitle_size=11))
    body.append(arrow(720, 509, 830, 509, color=COOL, width=2.5))
    body.append(label_box(835, 486, 170, 48, "rainfall shift", "regional response", fill="#fff1ed", stroke="#e5b1a9", accent=RAIN, title_size=13.5, subtitle_size=11))
    body.append(legend_item(40, 565, "heating / pressure", GOLD, line_only=True))
    body.append(legend_item(235, 565, "moist onshore flow", RAIN, line_only=True))
    body.append(legend_item(455, 565, "dry offshore flow", COOL, line_only=True))
    body.append(text(1000, 568, "ENSO can modulate regional probability; it does not set one universal sign.", size=11, fill=MUTED, anchor="end"))
    finish("monsoon-seasonal-engine.svg", title, description, "".join(body))


def main() -> None:
    cryosphere_components()
    glacier_mass_balance()
    coast_planform()
    sea_level_shore_response()
    earth_energy_budget()
    greenhouse_height()
    atmospheric_circulation()
    cyclone_force_balance()
    cloud_atlas()
    precipitation_mechanisms()
    global_ocean_currents()
    overturning_circulation()
    enso_three_states()
    monsoon_seasonal_engine()
    print("generated 14 Earth visual-atlas SVGs in", OUT)


if __name__ == "__main__":
    main()
