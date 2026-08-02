"""[diagram] Structural materials diagrams for lectures 09--16.

The figures are intentionally compact: labels stay in English/math notation
inside the SVG, while the lecture prose carries the Chinese explanation.
Run from this directory with::

    python figs/materials_diagrams_09_16.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import (
    Arc,
    Circle,
    Ellipse,
    FancyBboxPatch,
    FancyArrowPatch,
    Polygon,
    Rectangle,
)


ACC = "#147d6f"
ACC2 = "#7cc6b9"
INK = "#263432"
GRID = "#a9bbb7"
RED = "#b3452f"
PALE = "#f3f8f7"
PALE_RED = "#f8e4de"
GOLD = "#b28642"
LW = 1.8

plt.rcParams.update(
    {
        "svg.fonttype": "path",
        "font.size": 12,
        "axes.linewidth": LW,
        "axes.edgecolor": INK,
        "xtick.color": INK,
        "ytick.color": INK,
        "figure.dpi": 100,
        "savefig.facecolor": "white",
        "figure.facecolor": "white",
    }
)

OUT = Path(__file__).resolve().parents[1] / "images"


def save(fig, name):
    """Save one diagram as a white-background, font-independent SVG."""
    OUT.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT / f"{name}.svg", format="svg", bbox_inches="tight")
    plt.close(fig)
    print(f"✓ {name}")


def no_axes(ax, xlim=(0, 1), ylim=(0, 1)):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_axis_off()


def arrow(ax, start, end, color=ACC, lw=LW, ms=12, style="-|>", **kwargs):
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle=style,
        mutation_scale=ms,
        linewidth=lw,
        color=color,
        shrinkA=0,
        shrinkB=0,
        **kwargs,
    )
    ax.add_patch(patch)
    return patch


def label(ax, x, y, text, **kwargs):
    defaults = {
        "ha": "center",
        "va": "center",
        "color": INK,
        "fontsize": 11,
    }
    defaults.update(kwargs)
    ax.text(x, y, text, **defaults)


def rounded_box(ax, xy, width, height, text, face=PALE, edge=ACC, **kwargs):
    box = FancyBboxPatch(
        xy,
        width,
        height,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=face,
        edgecolor=edge,
        linewidth=LW,
        **kwargs,
    )
    ax.add_patch(box)
    label(ax, xy[0] + width / 2, xy[1] + height / 2, text)
    return box


def draw_arrow_chain(ax, points, color=INK, node=True, lw=LW):
    points = np.asarray(points)
    ax.plot(points[:, 0], points[:, 1], color=color, lw=lw, solid_capstyle="round")
    if node:
        ax.scatter(points[:, 0], points[:, 1], s=32, facecolor="white", edgecolor=color, linewidth=1.5, zorder=3)


def fig_crack_tip():
    fig = plt.figure(figsize=(8.8, 5.3))
    gs = fig.add_gridspec(2, 2, height_ratios=(1.05, 1), hspace=0.28, wspace=0.16)

    ax = fig.add_subplot(gs[0, :])
    no_axes(ax, (0, 10), (0, 4.7))
    ax.add_patch(Rectangle((1, 0.8), 8, 3.0, facecolor=PALE, edgecolor=INK, linewidth=LW))
    ax.plot([1.45, 5.05], [2.3, 2.3], color=INK, lw=2.6, solid_capstyle="round")
    ax.plot([5.05, 5.42], [2.3, 2.3], color=RED, lw=2.4, solid_capstyle="round")
    for y, dy in ((0.55, 0.25), (4.05, -0.25)):
        for x in (2.2, 4.0, 5.8, 7.6):
            arrow(ax, (x, y), (x, y + dy), color=ACC, lw=LW, ms=10)
    for radius, alpha in ((0.35, 0.18), (0.72, 0.11), (1.05, 0.06)):
        ax.add_patch(Ellipse((5.1, 2.3), 2 * radius, 1.4 * radius, facecolor=ACC2, edgecolor=ACC, alpha=alpha, linewidth=LW))
    arrow(ax, (5.5, 3.65), (5.16, 2.52), color=RED, lw=LW, ms=11)
    label(ax, 2.25, 3.42, "Griffith crack", fontsize=12, weight="bold")
    label(ax, 3.35, 2.02, "$2a$", fontsize=12)
    label(ax, 7.0, 4.15, "remote stress $\\sigma$", color=ACC, fontsize=11)
    label(ax, 6.35, 3.05, "$K = Y\\sigma\\sqrt{\\pi a}$", color=RED, fontsize=12)
    label(ax, 5.7, 2.7, "crack tip", color=RED, fontsize=10)
    label(ax, 7.95, 1.05, "stress field", color=ACC, fontsize=10)

    for ax, title, radius, note in (
        (fig.add_subplot(gs[1, 0]), "brittle", 0.34, "small $r_p$"),
        (fig.add_subplot(gs[1, 1]), "tough", 0.82, "large $r_p$"),
    ):
        no_axes(ax, (0, 4), (0, 2.5))
        ax.add_patch(Rectangle((0.35, 0.35), 3.3, 1.8, facecolor=PALE, edgecolor=INK, linewidth=LW))
        ax.plot([0.55, 1.75], [1.25, 1.25], color=INK, lw=2.3, solid_capstyle="round")
        ax.plot([1.75, 2.0], [1.25, 1.25], color=RED, lw=2.2)
        ax.add_patch(Ellipse((1.8, 1.25), 1.8 * radius, 1.25 * radius, facecolor=ACC2, edgecolor=ACC, alpha=0.38, linewidth=LW))
        for angle in np.linspace(-65, 65, 5):
            r = np.deg2rad(angle)
            arrow(ax, (1.82 + 0.18 * np.cos(r), 1.25 + 0.18 * np.sin(r)), (1.82 + 0.75 * radius * np.cos(r), 1.25 + 0.55 * radius * np.sin(r)), color=ACC, lw=1.5, ms=8)
        label(ax, 2.0, 2.25, title, color=ACC, fontsize=12, weight="bold")
        label(ax, 2.0, 0.62, note, color=RED, fontsize=11)
        label(ax, 1.85, 1.82, "plastic zone", fontsize=9)
    save(fig, "mat-09-crack-tip")


def fig_fatigue_fracture():
    fig, ax = plt.subplots(figsize=(8.8, 4.5))
    no_axes(ax, (0, 12), (0, 6))
    fracture_face = Rectangle((0.75, 0.85), 10.5, 4.35, facecolor="white", edgecolor=INK, linewidth=LW)
    ax.add_patch(fracture_face)
    ax.add_patch(Polygon([(0.75, 0.85), (8.3, 0.85), (8.85, 5.2), (0.75, 5.2)], closed=True, facecolor=ACC2, alpha=0.32, edgecolor="none"))
    ax.add_patch(Polygon([(8.3, 0.85), (11.25, 0.85), (11.25, 5.2), (8.85, 5.2)], closed=True, facecolor=PALE_RED, edgecolor="none"))
    ax.add_patch(Circle((1.55, 3.0), 0.22, facecolor=RED, edgecolor=INK, linewidth=LW, zorder=4))
    for radius in (0.75, 1.2, 1.75, 2.3, 2.65, 2.9):
        arc = Arc((1.55, 3.0), 2 * radius, 1.48 * radius, theta1=-56, theta2=56, color=ACC, lw=1.5, alpha=0.88)
        arc.set_clip_path(fracture_face)
        ax.add_patch(arc)
    for y in np.linspace(1.2, 4.8, 7):
        ax.plot([8.85, 10.95], [y, y + 0.24 * np.sin(y * 5)], color=RED, lw=1.5, alpha=0.85)
    arrow(ax, (1.55, 5.62), (1.55, 3.32), color=RED, lw=LW, ms=11)
    arrow(ax, (0.2, 3.0), (1.28, 3.0), color=RED, lw=LW, ms=11)
    label(ax, 1.55, 5.68, "crack origin", color=RED, fontsize=11, weight="bold")
    label(ax, 4.3, 5.68, "stable growth", color=ACC, fontsize=12, weight="bold")
    label(ax, 4.3, 5.32, "striations", color=ACC, fontsize=10)
    label(ax, 9.75, 5.68, "fast fracture", color=RED, fontsize=12, weight="bold")
    label(ax, 6.05, 0.45, "growth direction  →", color=INK, fontsize=11)
    label(ax, 1.55, 2.55, "origin", color="white", fontsize=9, weight="bold")
    save(fig, "mat-09-fatigue-fracture")


def fig_chain_structures():
    fig, axes = plt.subplots(2, 2, figsize=(8.6, 6.1))
    for ax in axes.flat:
        no_axes(ax, (0, 10), (0, 6))

    ax = axes[0, 0]
    points = [(1.1, 2.9), (2.0, 3.7), (2.9, 2.5), (3.8, 3.6), (4.7, 2.6), (5.6, 3.5), (6.5, 2.7), (7.4, 3.6), (8.7, 2.8)]
    draw_arrow_chain(ax, points, ACC)
    label(ax, 5, 5.35, "linear", color=ACC, fontsize=13, weight="bold")
    label(ax, 5, 0.65, "one backbone", fontsize=10)

    ax = axes[0, 1]
    main = [(0.9, 2.8), (1.8, 3.6), (2.7, 2.6), (3.6, 3.5), (4.5, 2.7), (5.4, 3.6), (6.3, 2.8), (7.3, 3.5), (8.9, 2.7)]
    draw_arrow_chain(ax, main, ACC)
    for x, y, dx, dy in ((2.7, 2.6, -0.8, -1.2), (4.5, 2.7, 0.6, -1.4), (6.3, 2.8, -0.4, 1.4), (7.3, 3.5, 0.9, 1.0)):
        draw_arrow_chain(ax, [(x, y), (x + dx, y + dy)], ACC, lw=1.7)
    label(ax, 5, 5.35, "branched", color=ACC, fontsize=13, weight="bold")
    label(ax, 5, 0.65, "side chains", fontsize=10)

    ax = axes[1, 0]
    network = [
        [(1.2, 1.0), (2.6, 2.2), (1.8, 4.7)],
        [(2.6, 2.2), (4.3, 1.1), (4.8, 3.0), (3.9, 5.0)],
        [(4.8, 3.0), (6.7, 1.0), (8.5, 2.2), (8.1, 4.8)],
        [(3.9, 5.0), (6.0, 5.1), (8.1, 4.8)],
        [(2.6, 2.2), (4.8, 3.0), (6.7, 1.0)],
    ]
    for chain in network:
        draw_arrow_chain(ax, chain, ACC, node=False, lw=1.7)
    for x, y in ((1.2, 1.0), (2.6, 2.2), (1.8, 4.7), (4.3, 1.1), (4.8, 3.0), (3.9, 5.0), (6.7, 1.0), (8.5, 2.2), (8.1, 4.8), (6.0, 5.1)):
        ax.add_patch(Circle((x, y), 0.13, facecolor="white", edgecolor=RED, linewidth=1.5))
    label(ax, 5, 5.35, "crosslinked", color=ACC, fontsize=13, weight="bold")
    label(ax, 5, 0.65, "3D network", fontsize=10)

    ax = axes[1, 1]
    ax.add_patch(Circle((5.0, 3.0), 2.05, facecolor=ACC2, alpha=0.22, edgecolor=ACC, linewidth=LW))
    for angle in np.linspace(0, 2 * np.pi, 14, endpoint=False):
        r0, r1 = 0.45, 2.0
        x0, y0 = 5 + r0 * np.cos(angle), 3 + r0 * np.sin(angle)
        x1, y1 = 5 + r1 * np.cos(angle + 0.08), 3 + r1 * np.sin(angle + 0.08)
        ax.plot([x0, x1], [y0, y1], color=ACC, lw=1.6)
    for radius in (0.65, 1.1, 1.55):
        ax.add_patch(Circle((5, 3), radius, fill=False, edgecolor=ACC, linewidth=1.5, alpha=0.65))
    ax.add_patch(Circle((5, 3), 0.18, facecolor=RED, edgecolor=INK, linewidth=1.5))
    label(ax, 5, 5.35, "semicrystalline", color=ACC, fontsize=13, weight="bold")
    label(ax, 5, 0.65, "spherulite", fontsize=10)
    label(ax, 7.55, 4.95, "crystalline", fontsize=9, color=ACC)
    label(ax, 2.05, 1.1, "amorphous", fontsize=9, color=INK)
    save(fig, "mat-10-chain-structures")


def fig_transformation_toughening():
    fig = plt.figure(figsize=(8.8, 5.0))
    gs = fig.add_gridspec(2, 1, height_ratios=(0.62, 1.65), hspace=0.12)
    ax0 = fig.add_subplot(gs[0, 0])
    no_axes(ax0, (0, 10), (0, 2.1))
    rounded_box(ax0, (1.0, 0.42), 2.0, 1.05, "t-ZrO$_2$", face=PALE, edge=ACC)
    ax0.add_patch(Polygon([(1.55, 0.68), (2.05, 0.68), (2.25, 0.95), (2.05, 1.22), (1.55, 1.22), (1.35, 0.95)], facecolor=ACC2, edgecolor=ACC, linewidth=LW))
    arrow(ax0, (3.45, 0.95), (5.6, 0.95), color=ACC, lw=LW, ms=12)
    label(ax0, 4.5, 1.33, "stress-induced", fontsize=10, color=ACC)
    rounded_box(ax0, (6.1, 0.42), 2.0, 1.05, "m-ZrO$_2$", face=PALE_RED, edge=RED)
    ax0.add_patch(Polygon([(6.5, 0.55), (7.15, 0.7), (7.55, 1.0), (7.2, 1.28), (6.55, 1.12)], facecolor="#e79a82", edgecolor=RED, linewidth=LW))
    label(ax0, 8.95, 0.95, "$\\Delta V$ = 3--5%", color=RED, fontsize=11)

    ax = fig.add_subplot(gs[1, 0])
    no_axes(ax, (0, 10), (0, 4.6))
    ax.add_patch(Rectangle((0.45, 0.35), 9.1, 3.7, facecolor=PALE, edgecolor=INK, linewidth=LW))
    ax.plot([0.62, 3.95], [2.3, 2.3], color=INK, lw=2.7, solid_capstyle="round")
    ax.plot([3.95, 4.45, 4.9, 5.35], [2.3, 2.62, 2.45, 2.8], color=RED, lw=2.2, ls="--")
    for x, y, angle in ((4.2, 1.48, 15), (4.55, 3.02, -18), (5.0, 1.7, -24), (5.35, 3.3, 21), (5.85, 2.0, 14)):
        ax.add_patch(Ellipse((x, y), 0.54, 0.42, angle=angle, facecolor="#e79a82", edgecolor=RED, linewidth=LW))
        for dx, dy in ((-0.33, 0), (0.33, 0), (0, -0.28), (0, 0.28)):
            arrow(ax, (x, y), (x + dx, y + dy), color=RED, lw=1.5, ms=8)
    for y in (1.55, 3.05):
        arrow(ax, (6.75, y), (5.98, y), color=ACC, lw=LW, ms=10)
    label(ax, 7.6, 3.52, "compressive zone", color=ACC, fontsize=11, weight="bold")
    label(ax, 2.0, 3.65, "crack tip", color=RED, fontsize=11)
    label(ax, 7.0, 2.7, "crack closure", color=ACC, fontsize=10)
    label(ax, 5.25, 0.62, "transformed particles", color=RED, fontsize=10)
    save(fig, "mat-11-transformation-toughening")


def band_panel(ax, title, kind):
    no_axes(ax, (0, 1), (0, 10))
    ax.add_patch(Rectangle((0.23, 0.15), 0.54, 9.45, facecolor="white", edgecolor=INK, linewidth=LW))
    ax.text(0.5, 9.25, title, ha="center", va="center", fontsize=12, color=ACC, weight="bold")
    ax.text(0.03, 8.2, "E", ha="left", va="center", fontsize=10, color=INK)
    if kind == "metal":
        ax.add_patch(Rectangle((0.31, 3.4), 0.38, 3.45, facecolor=ACC2, alpha=0.65, edgecolor=ACC, linewidth=LW))
        ax.plot([0.31, 0.69], [5.0, 5.0], color=RED, lw=1.7)
        label(ax, 0.5, 7.15, "partly filled", fontsize=9)
        label(ax, 0.5, 2.25, "$E_g \\approx 0$", fontsize=10)
    elif kind == "semi":
        ax.add_patch(Rectangle((0.31, 6.0), 0.38, 1.0, facecolor=ACC2, alpha=0.7, edgecolor=ACC, linewidth=LW))
        ax.add_patch(Rectangle((0.31, 2.0), 0.38, 1.0, facecolor=ACC2, alpha=0.7, edgecolor=ACC, linewidth=LW))
        ax.plot([0.31, 0.69], [4.85, 4.85], color=RED, lw=1.5, ls="--")
        ax.plot([0.31, 0.69], [5.68, 5.68], color=GOLD, lw=1.7)
        ax.plot([0.31, 0.69], [2.42, 2.42], color=GOLD, lw=1.7)
        label(ax, 0.5, 5.48, "$E_D$", fontsize=9, color=GOLD)
        label(ax, 0.5, 2.2, "$E_A$", fontsize=9, color=GOLD)
        label(ax, 0.5, 4.45, "$E_F$", fontsize=9, color=RED)
        label(ax, 0.5, 4.0, "$E_g$", fontsize=10)
        ax.annotate("", xy=(0.73, 3.0), xytext=(0.73, 6.0), arrowprops=dict(arrowstyle="<->", color=INK, lw=1.5))
        label(ax, 0.9, 6.0, "$E_C$", fontsize=9, ha="left")
        label(ax, 0.9, 2.0, "$E_V$", fontsize=9, ha="left")
        label(ax, 0.5, 0.65, "dopants", fontsize=9)
    else:
        ax.add_patch(Rectangle((0.31, 7.6), 0.38, 0.75, facecolor=ACC2, alpha=0.68, edgecolor=ACC, linewidth=LW))
        ax.add_patch(Rectangle((0.31, 1.0), 0.38, 0.75, facecolor=ACC2, alpha=0.68, edgecolor=ACC, linewidth=LW))
        ax.plot([0.31, 0.69], [4.5, 4.5], color=GRID, lw=1.5, ls="--")
        ax.annotate("", xy=(0.73, 1.75), xytext=(0.73, 7.6), arrowprops=dict(arrowstyle="<->", color=INK, lw=1.5))
        label(ax, 0.5, 6.95, "large $E_g$", fontsize=9)
        label(ax, 0.9, 7.95, "$E_C$", fontsize=9, ha="left")
        label(ax, 0.9, 1.35, "$E_V$", fontsize=9, ha="left")


def fig_band_classes():
    fig, axes = plt.subplots(1, 3, figsize=(8.8, 4.8), gridspec_kw={"wspace": 0.28})
    band_panel(axes[0], "conductor", "metal")
    band_panel(axes[1], "semiconductor", "semi")
    band_panel(axes[2], "insulator", "insulator")
    save(fig, "mat-12-band-classes")


def fig_pn_junction():
    fig = plt.figure(figsize=(8.8, 5.5))
    gs = fig.add_gridspec(2, 1, height_ratios=(0.72, 1.25), hspace=0.18)
    ax = fig.add_subplot(gs[0, 0])
    no_axes(ax, (0, 10), (0, 3.1))
    ax.add_patch(Rectangle((0.65, 0.55), 3.45, 1.45, facecolor="#e3f2ef", edgecolor=ACC, linewidth=LW))
    ax.add_patch(Rectangle((4.10, 0.55), 1.8, 1.45, facecolor="#e8efee", edgecolor=INK, linewidth=LW))
    ax.add_patch(Rectangle((5.9, 0.55), 3.45, 1.45, facecolor=PALE, edgecolor=ACC, linewidth=LW))
    label(ax, 2.35, 1.3, "p-side", color=ACC, fontsize=12, weight="bold")
    label(ax, 5.0, 1.3, "depletion", color=INK, fontsize=10)
    label(ax, 7.65, 1.3, "n-side", color=ACC, fontsize=12, weight="bold")
    for x in np.linspace(4.35, 5.55, 4):
        label(ax, x, 0.86, "−", color=RED, fontsize=13)
    for x in np.linspace(4.35, 5.55, 4):
        label(ax, x, 1.7, "+", color=ACC, fontsize=13)
    arrow(ax, (6.95, 2.45), (3.05, 2.45), color=RED, lw=LW, ms=11)
    label(ax, 5.0, 2.78, "built-in field $E_{bi}$", color=RED, fontsize=11)
    arrow(ax, (2.8, 0.25), (4.25, 0.25), color=ACC, lw=1.6, ms=9)
    arrow(ax, (7.2, 0.25), (5.75, 0.25), color=RED, lw=1.6, ms=9)
    label(ax, 5.0, 0.08, "carrier diffusion", fontsize=9, va="bottom")

    ax = fig.add_subplot(gs[1, 0])
    no_axes(ax, (0, 10), (0, 8.2))
    ax.plot([0.8, 4.1, 5.9, 9.2], [6.6, 6.6, 4.8, 4.8], color=ACC, lw=2.2)
    ax.plot([0.8, 4.1, 5.9, 9.2], [4.65, 4.65, 2.85, 2.85], color=ACC, lw=2.2)
    ax.plot([0.8, 9.2], [3.8, 3.8], color=RED, lw=1.8, ls="--")
    ax.add_patch(Rectangle((4.1, 0.55), 1.8, 7.05, facecolor=ACC2, alpha=0.13, edgecolor=ACC, linewidth=1.5, linestyle="--"))
    ax.annotate("", xy=(6.0, 4.8), xytext=(6.0, 6.6), arrowprops=dict(arrowstyle="<->", color=RED, lw=1.5))
    label(ax, 6.45, 5.7, "$qV_{bi}$", color=RED, fontsize=11, ha="left")
    label(ax, 2.0, 7.05, "$E_C$", color=ACC, fontsize=11)
    label(ax, 2.0, 4.2, "$E_V$", color=ACC, fontsize=11)
    label(ax, 2.0, 3.55, "$E_F$", color=RED, fontsize=10)
    label(ax, 2.1, 7.75, "p-side", color=ACC, fontsize=11)
    label(ax, 8.0, 5.95, "n-side", color=ACC, fontsize=11)
    label(ax, 5.0, 7.85, "band bending", color=INK, fontsize=11)
    label(ax, 5.0, 0.25, "depletion region", color=ACC, fontsize=10, va="bottom")
    save(fig, "mat-12-pn-junction")


def domain_block(ax, directions, title, note, wall=False):
    no_axes(ax, (0, 4), (0, 3.5))
    ax.add_patch(Rectangle((0.45, 0.45), 3.1, 2.45, facecolor=PALE, edgecolor=INK, linewidth=LW))
    for (x, y, angle, color) in directions:
        dx, dy = 0.32 * np.cos(angle), 0.32 * np.sin(angle)
        arrow(ax, (x - dx, y - dy), (x + dx, y + dy), color=color, lw=1.6, ms=9)
    if wall:
        ax.plot([2.0, 2.0], [0.58, 2.77], color=ACC, lw=2.0, ls="--")
        arrow(ax, (1.25, 3.15), (2.65, 3.15), color=ACC, lw=LW, ms=10)
        label(ax, 2.0, 3.32, "wall motion", color=ACC, fontsize=9, va="bottom")
    label(ax, 2.0, 0.12, note, fontsize=9, va="bottom")
    label(ax, 2.0, 3.2 if not wall else 3.0, title, color=ACC, fontsize=11, weight="bold")


def fig_domains():
    fig, axes = plt.subplots(1, 3, figsize=(8.8, 3.8), gridspec_kw={"wspace": 0.18})
    directions = [
        (0.95, 1.0, 0.2, ACC),
        (1.7, 1.0, 1.9, RED),
        (2.55, 1.0, -0.6, ACC),
        (3.0, 1.65, 2.8, RED),
        (1.1, 2.25, -1.0, ACC),
        (2.0, 2.25, 2.3, RED),
        (2.85, 2.35, 0.7, ACC),
    ]
    domain_block(axes[0], directions, "multi-domain", "net $M \\approx 0$")
    aligned = [(0.95, 1.0, 0.18, ACC), (1.7, 1.0, 0.2, ACC), (2.55, 1.0, 2.9, RED), (3.0, 1.65, 0.2, ACC), (1.1, 2.25, 0.2, ACC), (2.0, 2.25, 0.2, ACC), (2.85, 2.35, 0.2, ACC)]
    domain_block(axes[1], aligned, "field applied", "domain walls move", wall=True)
    saturated = [(0.95, 1.0, 0.1, ACC), (1.7, 1.0, 0.1, ACC), (2.55, 1.0, 0.1, ACC), (3.0, 1.65, 0.1, ACC), (1.1, 2.25, 0.1, ACC), (2.0, 2.25, 0.1, ACC), (2.85, 2.35, 0.1, ACC)]
    domain_block(axes[2], saturated, "saturated", "single direction")
    save(fig, "mat-13-domains")


def fig_ingot_dendrite():
    fig, axes = plt.subplots(1, 2, figsize=(8.8, 4.8), gridspec_kw={"wspace": 0.22})
    ax = axes[0]
    no_axes(ax, (0, 5), (0, 6))
    ax.add_patch(Rectangle((0.45, 0.55), 4.1, 4.8, facecolor="white", edgecolor=INK, linewidth=LW))
    ax.add_patch(Rectangle((0.45, 0.55), 0.7, 4.1, facecolor=ACC2, alpha=0.42, edgecolor=ACC, linewidth=1.5))
    ax.add_patch(Rectangle((3.85, 0.55), 0.7, 4.1, facecolor=ACC2, alpha=0.42, edgecolor=ACC, linewidth=1.5))
    ax.add_patch(Rectangle((1.15, 0.55), 2.7, 4.1, facecolor="#eef5f3", edgecolor=ACC, linewidth=1.5))
    rng = np.random.default_rng(9)
    for x in np.linspace(0.66, 4.35, 8):
        for y in np.linspace(0.85, 4.35, 7):
            if x < 1.1 or x > 3.9:
                ax.add_patch(Ellipse((x + rng.uniform(-0.08, 0.08), y), 0.13, 0.19, angle=rng.uniform(-20, 20), facecolor="white", edgecolor=ACC, linewidth=1.5))
    for x in np.linspace(1.35, 3.65, 7):
        ax.plot([x, x], [0.75, 4.45], color=ACC, lw=1.5)
    for x in np.linspace(1.55, 3.45, 5):
        for y in np.linspace(1.0, 4.1, 5):
            ax.add_patch(Ellipse((x + rng.uniform(-0.08, 0.08), y), 0.17, 0.12, angle=90, facecolor="white", edgecolor=ACC, linewidth=1.5))
    label(ax, 0.8, 5.62, "chill zone", color=ACC, fontsize=10)
    label(ax, 2.5, 5.62, "columnar grains", color=ACC, fontsize=10)
    label(ax, 4.2, 5.62, "chill", color=ACC, fontsize=10)
    label(ax, 2.5, 5.05, "liquid", color=INK, fontsize=10)
    label(ax, 2.5, 0.16, "equiaxed core", color=INK, fontsize=10, va="bottom")
    arrow(ax, (0.1, 2.6), (0.4, 2.6), color=RED, lw=LW, ms=10)
    arrow(ax, (4.9, 2.6), (4.6, 2.6), color=RED, lw=LW, ms=10)
    label(ax, 2.5, 0.0, "heat flow  ←       →", color=RED, fontsize=9, va="bottom")

    ax = axes[1]
    no_axes(ax, (0, 5), (0, 6))
    ax.plot([2.5, 2.5], [0.65, 5.1], color=ACC, lw=2.2)
    branches = [
        ((2.5, 1.8), (1.65, 2.6)), ((2.5, 2.45), (3.35, 3.3)), ((2.5, 3.1), (1.35, 4.0)),
        ((2.5, 3.55), (3.65, 4.45)), ((2.5, 4.0), (1.95, 4.85)),
        ((1.65, 2.6), (1.1, 2.45)), ((1.65, 2.6), (1.75, 3.35)), ((3.35, 3.3), (3.95, 3.0)),
        ((3.35, 3.3), (3.2, 4.0)), ((1.35, 4.0), (0.9, 4.35)), ((1.35, 4.0), (1.05, 4.85)),
        ((3.65, 4.45), (4.1, 4.9)), ((3.65, 4.45), (3.25, 5.0)),
    ]
    for start, end in branches:
        ax.plot([start[0], end[0]], [start[1], end[1]], color=ACC, lw=1.8, solid_capstyle="round")
    arrow(ax, (4.5, 0.9), (4.5, 2.1), color=RED, lw=LW, ms=10)
    label(ax, 4.5, 0.55, "growth", color=RED, fontsize=10, va="bottom")
    label(ax, 2.5, 5.62, "dendrite", color=ACC, fontsize=12, weight="bold")
    label(ax, 3.2, 2.35, "primary arm", color=INK, fontsize=9, ha="left")
    label(ax, 1.05, 4.55, "secondary arm", color=INK, fontsize=9, ha="left")
    label(ax, 2.5, 0.15, "solidification front", color=INK, fontsize=9, va="bottom")
    save(fig, "mat-15-ingot-dendrite")


def fig_lpbf():
    fig, ax = plt.subplots(figsize=(9.0, 5.5))
    no_axes(ax, (0, 12), (0, 7))
    ax.add_patch(Rectangle((0.75, 0.55), 10.5, 0.7, facecolor="#b8c6c2", edgecolor=INK, linewidth=LW))
    label(ax, 6.0, 0.9, "build plate", color=INK, fontsize=10)
    for y in (1.25, 1.82, 2.39):
        ax.add_patch(Rectangle((0.75, y), 10.5, 0.57, facecolor=ACC2, alpha=0.33, edgecolor=ACC, linewidth=1.5))
    for x in np.linspace(1.0, 10.9, 36):
        for y in (2.7, 3.15, 3.6, 4.05):
            ax.add_patch(Circle((x + 0.05 * np.sin(x * 7 + y), y), 0.045, facecolor="white", edgecolor=ACC, linewidth=1.5))
    ax.add_patch(Rectangle((0.75, 4.3), 10.5, 0.34, facecolor="#d6dfdd", edgecolor=INK, linewidth=LW))
    arrow(ax, (1.2, 4.82), (10.8, 4.82), color=ACC, lw=LW, ms=11)
    label(ax, 6.0, 5.18, "recoater", color=ACC, fontsize=10)
    label(ax, 1.0, 3.88, "powder layer", color=ACC, fontsize=10, ha="left")
    ax.add_patch(Polygon([(5.55, 6.35), (6.45, 6.35), (5.95, 2.77)], facecolor="#f2b7a7", edgecolor=RED, linewidth=LW, alpha=0.5))
    arrow(ax, (6.0, 6.55), (5.96, 3.0), color=RED, lw=2.2, ms=12)
    label(ax, 6.85, 6.25, "laser", color=RED, fontsize=11, ha="left")
    ax.add_patch(Ellipse((5.96, 2.72), 1.75, 0.42, facecolor=RED, edgecolor=RED, alpha=0.65, linewidth=LW))
    label(ax, 5.95, 2.72, "melt pool", color="white", fontsize=10, weight="bold")
    for x in (4.7, 5.35, 6.0, 6.65, 7.3):
        arrow(ax, (x, 2.58), (x + 0.48, 2.58), color=ACC, lw=1.5, ms=8)
    label(ax, 8.45, 2.55, "hatch overlap", color=ACC, fontsize=9, ha="left")
    arrow(ax, (11.45, 1.1), (11.45, 3.7), color=ACC, lw=LW, ms=11)
    label(ax, 11.45, 4.05, "build", color=ACC, fontsize=10)
    ax.add_patch(Ellipse((3.2, 1.78), 0.55, 0.22, facecolor=PALE_RED, edgecolor=RED, linewidth=LW))
    ax.add_patch(Ellipse((8.3, 1.3), 0.5, 0.26, facecolor=PALE_RED, edgecolor=RED, linewidth=LW))
    arrow(ax, (2.3, 1.25), (3.0, 1.75), color=RED, lw=1.5, ms=9)
    label(ax, 1.0, 1.02, "lack of fusion", color=RED, fontsize=9, ha="left")
    arrow(ax, (9.45, 0.96), (8.5, 1.3), color=RED, lw=1.5, ms=9)
    label(ax, 9.65, 0.72, "keyhole pore", color=RED, fontsize=9, ha="left")
    save(fig, "mat-16-lpbf")


def fig_process_window():
    fig, ax = plt.subplots(figsize=(8.6, 5.0))
    ax.set_xlim(50, 1050)
    ax.set_ylim(40, 820)
    ax.set_facecolor("white")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(LW)
    ax.spines["bottom"].set_linewidth(LW)
    ax.tick_params(labelsize=10, width=1.5, length=5)
    ax.set_xlabel("scan speed $v$ (mm/s)", fontsize=12)
    ax.set_ylabel("laser power $P$ (W)", fontsize=12)
    ax.add_patch(Polygon([(80, 520), (260, 760), (560, 760), (760, 550), (900, 260), (760, 120), (290, 105), (120, 260)], facecolor=PALE_RED, edgecolor=RED, linewidth=LW, alpha=0.8))
    ax.add_patch(Polygon([(125, 250), (300, 565), (550, 615), (760, 500), (835, 290), (690, 175), (340, 170)], facecolor=ACC2, edgecolor=ACC, linewidth=2.2, alpha=0.9))
    ax.add_patch(Polygon([(315, 170), (690, 175), (835, 290), (760, 500), (550, 615), (300, 565)], facecolor="#d7efeb", edgecolor=ACC, linewidth=LW, alpha=0.8))
    ax.plot([300, 550, 760], [565, 615, 500], color=ACC, lw=1.6, ls="--")
    ax.plot([340, 690, 835], [170, 175, 290], color=ACC, lw=1.6, ls="--")
    label(ax, 520, 370, "usable window", color=ACC, fontsize=13, weight="bold")
    label(ax, 520, 330, "stable melt track", color=ACC, fontsize=10)
    label(ax, 175, 675, "keyhole / evaporation", color=RED, fontsize=10, rotation=35)
    label(ax, 785, 145, "lack of fusion", color=RED, fontsize=10, rotation=-12)
    label(ax, 870, 640, "balling", color=INK, fontsize=10, rotation=18)
    arrow(ax, (180, 95), (430, 95), color=ACC, lw=LW, ms=10)
    label(ax, 205, 76, "higher speed", color=ACC, fontsize=9, ha="left", va="top")
    arrow(ax, (92, 300), (92, 560), color=ACC, lw=LW, ms=10)
    label(ax, 100, 430, "higher power", color=ACC, fontsize=9, ha="left", rotation=90)
    fig.tight_layout(pad=0.8)
    save(fig, "mat-16-process-window")


def main():
    fig_crack_tip()
    fig_fatigue_fracture()
    fig_chain_structures()
    fig_transformation_toughening()
    fig_band_classes()
    fig_pn_junction()
    fig_domains()
    fig_ingot_dendrite()
    fig_lpbf()
    fig_process_window()
    print("10 diagrams written")


if __name__ == "__main__":
    main()
