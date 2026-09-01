"""Small dependency-free SVG toolkit for the Earth-system visual atlas."""

from __future__ import annotations

from html import escape
from pathlib import Path
from typing import Iterable, Sequence


WIDTH = 1040
HEIGHT = 600

PALETTE = {
    "ink": "#17324d",
    "muted": "#5f7182",
    "line": "#a9bac8",
    "grid": "#dbe5ec",
    "paper": "#ffffff",
    "panel": "#f6f9fb",
    "ocean": "#bfe2f2",
    "deep_ocean": "#2679a8",
    "sky": "#dff1f7",
    "land": "#d7e5c1",
    "forest": "#4d8a63",
    "rock": "#c8a27a",
    "mantle": "#dc805f",
    "core": "#f0b53d",
    "ice": "#e9f8ff",
    "warm": "#d65a4a",
    "cool": "#2784b8",
    "gold": "#c58b20",
    "violet": "#7666a8",
    "danger": "#b54238",
}


def attrs(**values: object) -> str:
    parts = []
    for key, value in values.items():
        if value is None:
            continue
        name = key.rstrip("_").replace("__", ":").replace("_", "-")
        parts.append(f'{name}="{escape(str(value), quote=True)}"')
    return " ".join(parts)


def tag(name: str, content: str = "", **values: object) -> str:
    a = attrs(**values)
    return f"<{name}{' ' + a if a else ''}>{content}</{name}>"


def rect(x: float, y: float, width: float, height: float, *, radius: float = 0,
         fill: str = "none", stroke: str = "none", stroke_width: float = 1,
         class_: str | None = None, opacity: float | None = None) -> str:
    return tag(
        "rect",
        x=x,
        y=y,
        width=width,
        height=height,
        rx=radius,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        class_=class_,
        opacity=opacity,
    )


def circle(cx: float, cy: float, radius: float, *, fill: str = "none",
           stroke: str = "none", stroke_width: float = 1,
           class_: str | None = None, opacity: float | None = None) -> str:
    return tag(
        "circle",
        cx=cx,
        cy=cy,
        r=radius,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        class_=class_,
        opacity=opacity,
    )


def ellipse(cx: float, cy: float, rx: float, ry: float, *, fill: str = "none",
            stroke: str = "none", stroke_width: float = 1,
            opacity: float | None = None) -> str:
    return tag(
        "ellipse",
        cx=cx,
        cy=cy,
        rx=rx,
        ry=ry,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        opacity=opacity,
    )


def line(x1: float, y1: float, x2: float, y2: float, *, stroke: str = PALETTE["ink"],
         stroke_width: float = 2, dash: str | None = None,
         marker_end: str | None = None, marker_start: str | None = None,
         opacity: float | None = None) -> str:
    return tag(
        "line",
        x1=x1,
        y1=y1,
        x2=x2,
        y2=y2,
        stroke=stroke,
        stroke_width=stroke_width,
        stroke_dasharray=dash,
        marker_end=marker_end,
        marker_start=marker_start,
        opacity=opacity,
    )


def path(d: str, *, fill: str = "none", stroke: str = PALETTE["ink"],
         stroke_width: float = 2, dash: str | None = None,
         marker_end: str | None = None, marker_start: str | None = None,
         opacity: float | None = None, class_: str | None = None) -> str:
    return tag(
        "path",
        d=d,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        stroke_linecap="round",
        stroke_linejoin="round",
        stroke_dasharray=dash,
        marker_end=marker_end,
        marker_start=marker_start,
        opacity=opacity,
        class_=class_,
    )


def polygon(points: Sequence[tuple[float, float]], *, fill: str = "none",
            stroke: str = "none", stroke_width: float = 1,
            opacity: float | None = None, class_: str | None = None) -> str:
    data = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return tag(
        "polygon",
        points=data,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        opacity=opacity,
        class_=class_,
    )


def polyline(points: Sequence[tuple[float, float]], *, fill: str = "none",
             stroke: str = PALETTE["ink"], stroke_width: float = 2,
             dash: str | None = None, marker_end: str | None = None) -> str:
    data = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
    return tag(
        "polyline",
        points=data,
        fill=fill,
        stroke=stroke,
        stroke_width=stroke_width,
        stroke_linecap="round",
        stroke_linejoin="round",
        stroke_dasharray=dash,
        marker_end=marker_end,
    )


def text(x: float, y: float, value: object, *, size: float = 16,
         fill: str = PALETTE["ink"], weight: int | str = 500,
         anchor: str = "start", class_: str | None = None,
         rotate: float | None = None) -> str:
    transform = f"rotate({rotate} {x} {y})" if rotate is not None else None
    return tag(
        "text",
        escape(str(value)),
        x=x,
        y=y,
        font_size=size,
        font_weight=weight,
        text_anchor=anchor,
        fill=fill,
        class_=class_,
        transform=transform,
    )


def multiline(x: float, y: float, lines: Sequence[str], *, size: float = 15,
              line_height: float = 21, fill: str = PALETTE["ink"],
              weight: int | str = 500, anchor: str = "start") -> str:
    spans = []
    for index, value in enumerate(lines):
        spans.append(tag("tspan", escape(value), x=x, dy=0 if index == 0 else line_height))
    return tag(
        "text",
        "".join(spans),
        x=x,
        y=y,
        font_size=size,
        font_weight=weight,
        text_anchor=anchor,
        fill=fill,
    )


def panel(x: float, y: float, width: float, height: float, title: str,
          subtitle: str | None = None) -> str:
    pieces = [
        rect(x, y, width, height, radius=8, fill=PALETTE["panel"], stroke=PALETTE["grid"]),
        text(x + 18, y + 30, title, size=17, weight=750),
    ]
    if subtitle:
        pieces.append(text(x + width - 18, y + 29, subtitle, size=12, fill=PALETTE["muted"], anchor="end"))
    return "".join(pieces)


def pill(x: float, y: float, label: str, *, fill: str = PALETTE["ink"],
         text_fill: str = "#ffffff", width: float | None = None) -> str:
    w = width if width is not None else max(70, 18 + len(label) * 13)
    return rect(x, y, w, 30, radius=15, fill=fill) + text(
        x + w / 2,
        y + 20,
        label,
        size=12,
        fill=text_fill,
        weight=700,
        anchor="middle",
    )


def arrow(x1: float, y1: float, x2: float, y2: float, *, color: str = PALETTE["ink"],
          width: float = 3, dash: str | None = None, marker: str = "arrow") -> str:
    if marker == "arrow":
        marker = {
            PALETTE["ink"]: "arrow-ink",
            PALETTE["warm"]: "arrow-warm",
            PALETTE["cool"]: "arrow-cool",
            PALETTE["forest"]: "arrow-forest",
            PALETTE["gold"]: "arrow-gold",
            PALETTE["violet"]: "arrow-violet",
            PALETTE["danger"]: "arrow-danger",
            PALETTE["deep_ocean"]: "arrow-deep",
        }.get(color, "arrow-ink")
    return line(
        x1,
        y1,
        x2,
        y2,
        stroke=color,
        stroke_width=width,
        dash=dash,
        marker_end=f"url(#{marker})",
    )


def curved_arrow(d: str, *, color: str = PALETTE["ink"], width: float = 3,
                 dash: str | None = None, marker: str = "arrow") -> str:
    if marker == "arrow":
        marker = {
            PALETTE["ink"]: "arrow-ink",
            PALETTE["warm"]: "arrow-warm",
            PALETTE["cool"]: "arrow-cool",
            PALETTE["forest"]: "arrow-forest",
            PALETTE["gold"]: "arrow-gold",
            PALETTE["violet"]: "arrow-violet",
            PALETTE["danger"]: "arrow-danger",
            PALETTE["deep_ocean"]: "arrow-deep",
        }.get(color, "arrow-ink")
    return path(d, stroke=color, stroke_width=width, dash=dash, marker_end=f"url(#{marker})")


def legend_item(x: float, y: float, label: str, color: str, *, line_only: bool = False,
                dashed: bool = False) -> str:
    sample = line(x, y - 5, x + 28, y - 5, stroke=color, stroke_width=4,
                  dash="7 5" if dashed else None) if line_only else rect(
        x, y - 15, 28, 14, radius=3, fill=color
    )
    return sample + text(x + 38, y - 2, label, size=12, fill=PALETTE["muted"])


WORLD_LAND = [
    [(-168, 70), (-145, 70), (-125, 58), (-105, 52), (-83, 26), (-98, 15), (-118, 24), (-130, 45), (-160, 56)],
    [(-82, 12), (-66, 8), (-48, -8), (-53, -28), (-68, -55), (-78, -36)],
    [(-12, 72), (42, 72), (86, 63), (132, 50), (160, 58), (176, 42), (146, 8), (111, 4), (78, 20), (45, 34), (24, 31), (7, 42), (-10, 36), (-24, 57)],
    [(-18, 35), (12, 37), (42, 12), (32, -35), (14, -35), (-4, 5)],
    [(112, -11), (154, -12), (150, -40), (116, -35)],
    [(-52, 82), (-22, 78), (-30, 61), (-48, 60)],
    [(46, -13), (51, -16), (49, -25), (44, -22)],
]


def project(lon: float, lat: float, x: float, y: float, width: float, height: float) -> tuple[float, float]:
    return x + (lon + 180) / 360 * width, y + (90 - lat) / 180 * height


def world_map(x: float, y: float, width: float, height: float, *, title: str | None = None,
              ocean: str = PALETTE["ocean"], land: str = PALETTE["land"],
              grid: bool = True) -> str:
    pieces = [rect(x, y, width, height, radius=7, fill=ocean, stroke=PALETTE["line"])]
    if grid:
        for lon in range(-120, 180, 60):
            px, _ = project(lon, 0, x, y, width, height)
            pieces.append(line(px, y, px, y + height, stroke="#ffffff", stroke_width=1, opacity=.65))
        for lat in (-60, -30, 0, 30, 60):
            _, py = project(0, lat, x, y, width, height)
            pieces.append(line(x, py, x + width, py, stroke="#ffffff", stroke_width=1, opacity=.65))
    for shape in WORLD_LAND:
        pieces.append(polygon([project(lon, lat, x, y, width, height) for lon, lat in shape], fill=land,
                              stroke="#82936f", stroke_width=.8))
    if title:
        pieces.append(text(x + 12, y + 22, title, size=14, weight=750))
    return "".join(pieces)


def defs() -> str:
    return """<defs>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="context-stroke"/></marker>
  <marker id="arrow-ink" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#17324d"/></marker>
  <marker id="arrow-warm" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#d65a4a"/></marker>
  <marker id="arrow-cool" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#2784b8"/></marker>
  <marker id="arrow-forest" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#4d8a63"/></marker>
  <marker id="arrow-gold" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#c58b20"/></marker>
  <marker id="arrow-violet" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#7666a8"/></marker>
  <marker id="arrow-danger" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#b54238"/></marker>
  <marker id="arrow-deep" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#2679a8"/></marker>
  <marker id="arrow-small" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" fill="context-stroke"/></marker>
  <linearGradient id="sky-to-space" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#dff1f7"/><stop offset="1" stop-color="#325372"/></linearGradient>
  <linearGradient id="ocean-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#90d4ec"/><stop offset="1" stop-color="#185b83"/></linearGradient>
  <linearGradient id="crust-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7e5c1"/><stop offset="1" stop-color="#b27a52"/></linearGradient>
  <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#17324d" flood-opacity=".14"/></filter>
</defs>"""


def document(title: str, description: str, body: str, *, width: int = WIDTH,
             height: int = HEIGHT) -> str:
    css = """<style>
text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Noto Sans CJK SC",Arial,sans-serif;letter-spacing:0}
.caption{font-size:12px;fill:#5f7182}.label{font-size:14px;fill:#17324d;font-weight:650}.small{font-size:11px;fill:#5f7182}.title{font-size:24px;fill:#17324d;font-weight:800}.subtitle{font-size:13px;fill:#5f7182}
</style>"""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" '
        f'aria-labelledby="svg-title svg-desc">'
        f'<title id="svg-title">{escape(title)}</title>'
        f'<desc id="svg-desc">{escape(description)}</desc>'
        f'{defs()}{css}{rect(0, 0, width, height, fill=PALETTE["paper"])}{body}</svg>\n'
    )


def header(title: str, subtitle: str, *, width: int = WIDTH) -> str:
    return text(28, 40, title, size=24, weight=800) + text(width - 28, 39, subtitle, size=13,
                                                            fill=PALETTE["muted"], anchor="end")


def save(filename: str | Path, title: str, description: str, body: str,
         *, width: int = WIDTH, height: int = HEIGHT) -> Path:
    target = Path(filename)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(document(title, description, body, width=width, height=height), encoding="utf-8")
    return target


def concat(parts: Iterable[str]) -> str:
    return "".join(parts)
