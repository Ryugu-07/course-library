#!/usr/bin/env python3
"""Generate the first structural-diagram set for the materials course.

The diagrams are deliberately compact and label-light: explanatory prose stays
in the lecture figcaptions.  All text is rendered as SVG paths so the figures
do not depend on fonts installed on the reader's device.

Run from this directory or any other working directory with::

    python materials-course/figs/materials_diagrams_02_08.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import (
    Arc,
    Circle,
    FancyArrowPatch,
    PathPatch,
    Polygon,
    Rectangle,
)
from matplotlib.path import Path as MplPath


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"

ACC = "#147d6f"
ACC2 = "#7cc6b9"
INK = "#222222"
PALE = "#e3f2ef"
PALE2 = "#f4faf9"
GRID = "#9bbdb7"
RED = "#b3452f"

plt.rcParams.update(
    {
        "svg.fonttype": "path",
        "font.size": 13,
        "axes.linewidth": 1.8,
        "axes.edgecolor": INK,
        "xtick.color": INK,
        "ytick.color": INK,
        "figure.dpi": 100,
        "patch.linewidth": 1.8,
    }
)


def save(fig, name):
    """Save one figure with a responsive SVG viewBox and close it."""

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.svg"
    fig.savefig(
        path,
        format="svg",
        bbox_inches="tight",
        pad_inches=0.16,
        facecolor="white",
    )
    plt.close(fig)
    print(f"saved {path.relative_to(ROOT)}")


def atom(ax, xy, radius=0.08, face=PALE, edge=ACC, lw=1.7, zorder=4):
    ax.add_patch(
        Circle(
            xy,
            radius,
            facecolor=face,
            edgecolor=edge,
            linewidth=lw,
            zorder=zorder,
        )
    )


def arrow(ax, start, end, color=ACC, lw=2.0, mutation_scale=13, zorder=6, **kwargs):
    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=mutation_scale,
            linewidth=lw,
            color=color,
            shrinkA=0,
            shrinkB=0,
            zorder=zorder,
            **kwargs,
        )
    )


def project_cube(point):
    """Small oblique projection used for the FCC/BCC sketches."""

    x, y, z = point
    return np.array([x + 0.52 * z, y + 0.32 * z])


def draw_cube(ax):
    vertices = np.array(
        [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0, 0, 1],
            [1, 0, 1],
            [1, 1, 1],
            [0, 1, 1],
        ]
    )
    edges = [
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 0),
        (4, 5),
        (5, 6),
        (6, 7),
        (7, 4),
        (0, 4),
        (1, 5),
        (2, 6),
        (3, 7),
    ]
    for i, j in edges:
        p, q = project_cube(vertices[i]), project_cube(vertices[j])
        ax.plot(
            [p[0], q[0]],
            [p[1], q[1]],
            color=INK,
            linewidth=1.8,
            zorder=2,
        )
    return vertices


def fig_cells():
    fig, axes = plt.subplots(1, 3, figsize=(10.4, 3.8))
    for ax in axes:
        ax.set_aspect("equal")
        ax.axis("off")

    # FCC: face-centered atoms and a highlighted {111} plane.
    ax = axes[0]
    vertices = draw_cube(ax)
    plane = [project_cube(p) for p in ([1, 0, 0], [0, 1, 0], [0, 0, 1])]
    ax.add_patch(
        Polygon(
            plane,
            closed=True,
            facecolor=ACC2,
            edgecolor=ACC,
            linewidth=2.0,
            alpha=0.42,
            zorder=1,
        )
    )
    for p in vertices:
        atom(ax, project_cube(p), radius=0.075, face=PALE2, edge=ACC)
    for p in (
        [0.5, 0.5, 0],
        [0.5, 0.5, 1],
        [0.5, 0, 0.5],
        [0.5, 1, 0.5],
        [0, 0.5, 0.5],
        [1, 0.5, 0.5],
    ):
        atom(ax, project_cube(p), radius=0.09, face=ACC2, edge=ACC)
    ax.text(0.50, 1.08, "FCC", transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, r"CN = 12   P = 0.74   N = 4", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.text(0.60, 0.18, r"$\{111\}$ plane", transform=ax.transAxes, ha="center", va="center", color=ACC, fontsize=11)
    ax.set_xlim(-0.30, 1.70)
    ax.set_ylim(-0.34, 1.58)

    # BCC: corner atoms plus the body-centered atom.
    ax = axes[1]
    vertices = draw_cube(ax)
    for p in vertices:
        atom(ax, project_cube(p), radius=0.075, face=PALE2, edge=ACC)
    atom(ax, project_cube([0.5, 0.5, 0.5]), radius=0.12, face=ACC, edge=INK)
    ax.text(0.50, 1.08, "BCC", transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, r"CN = 8   P = 0.68   N = 2", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.text(0.69, 0.56, "body center", transform=ax.transAxes, ha="center", va="center", color=ACC, fontsize=11)
    ax.set_xlim(-0.30, 1.70)
    ax.set_ylim(-0.34, 1.58)

    # HCP: hexagonal prism, with the basal plane highlighted.
    ax = axes[2]
    angles = np.deg2rad(np.arange(0, 360, 60) + 30)
    ring_xy = np.column_stack([0.50 + 0.43 * np.cos(angles), 0.52 + 0.32 * np.sin(angles)])

    def project_hcp(p):
        x, y, z = p
        return np.array([x + 0.36 * z, y + 0.28 * z])

    bottom = [project_hcp([x, y, 0]) for x, y in ring_xy]
    top = [project_hcp([x, y, 1]) for x, y in ring_xy]
    ax.add_patch(Polygon(top, closed=True, facecolor=ACC2, edgecolor=ACC, linewidth=2.0, alpha=0.32, zorder=1))
    for ring in (bottom, top):
        ring_closed = np.vstack([ring, ring[0]])
        ax.plot(ring_closed[:, 0], ring_closed[:, 1], color=INK, linewidth=1.8, zorder=2)
    for p, q in zip(bottom, top):
        ax.plot([p[0], q[0]], [p[1], q[1]], color=INK, linewidth=1.8, zorder=2)
    for p in bottom + top:
        atom(ax, p, radius=0.075, face=PALE2, edge=ACC)
    middle_angles = np.deg2rad([90, 210, 330])
    for angle in middle_angles:
        p = project_hcp([0.50 + 0.22 * np.cos(angle), 0.52 + 0.16 * np.sin(angle), 0.50])
        atom(ax, p, radius=0.085, face=ACC, edge=INK)
    ax.text(0.50, 1.08, "HCP", transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, r"CN = 12   P = 0.74   N = 6", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.text(0.56, 0.18, r"basal $\{0001\}$", transform=ax.transAxes, ha="center", va="center", color=ACC, fontsize=11)
    ax.set_xlim(-0.35, 1.75)
    ax.set_ylim(-0.34, 1.62)

    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.20, top=0.86, wspace=0.08)
    save(fig, "mat-02-cells")


def draw_packed_layers(ax, sequence, title):
    radius = 0.18
    spacing = 0.36
    height = np.sqrt(3) * radius
    offsets = {"A": 0.00, "B": 0.18, "C": 0.36}
    colors = {"A": ACC, "B": ACC2, "C": "#b9d9d4"}
    n = 10
    for row, layer in enumerate(sequence):
        y = 0.50 + row * height
        x0 = 0.48 + offsets[layer]
        for i in range(n):
            atom(ax, (x0 + i * spacing, y), radius=radius, face=colors[layer], edge=ACC)
        ax.text(4.34, y, layer, ha="left", va="center", fontweight="bold", color=ACC)
    ax.text(0.50, 1.06, title, transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, "close-packed layers", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.set_xlim(0.15, 4.75)
    ax.set_ylim(0.20, 2.56)
    ax.set_aspect("equal")
    ax.axis("off")


def fig_stacking():
    fig, axes = plt.subplots(1, 2, figsize=(9.0, 3.7))
    draw_packed_layers(axes[0], "ABCABC", "FCC: ABCABC")
    draw_packed_layers(axes[1], "ABABAB", "HCP: ABAB")
    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.15, top=0.84, wspace=0.10)
    save(fig, "mat-02-stacking")


def draw_lattice(ax, x_values, y_values, color=GRID, atom_face=PALE2, atom_edge=ACC2):
    for y in y_values:
        ax.plot([min(x_values), max(x_values)], [y, y], color=color, linewidth=1.6, alpha=0.58, zorder=1)
    for x in x_values:
        ax.plot([x, x], [min(y_values), max(y_values)], color=color, linewidth=1.6, alpha=0.58, zorder=1)
    for x in x_values:
        for y in y_values:
            atom(ax, (x, y), radius=0.075, face=atom_face, edge=atom_edge, zorder=3)


def fig_edge_dislocation():
    fig, ax = plt.subplots(figsize=(9.0, 4.8))
    x_values = np.arange(0.75, 8.25, 0.60)
    y_values = np.arange(0.62, 4.72, 0.58)
    draw_lattice(ax, x_values, y_values)

    core_x = 4.20
    core_y = 2.36
    ax.plot([core_x, core_x], [core_y, 4.72], color=ACC, linewidth=3.0, zorder=2)
    for y in np.arange(core_y + 0.02, 4.72, 0.58):
        atom(ax, (core_x, y), radius=0.085, face=ACC2, edge=ACC, lw=2.0, zorder=5)
    atom(ax, (core_x, core_y), radius=0.12, face=ACC, edge=INK, lw=2.2, zorder=7)

    loop = [(2.35, 1.15), (2.35, 3.86), (6.10, 3.86), (6.10, 1.15), (4.20, 1.15)]
    for start, end in zip(loop[:-1], loop[1:]):
        arrow(ax, start, end, color=INK, lw=2.0, mutation_scale=12, zorder=8)
    ax.plot([loop[-1][0], loop[0][0]], [loop[-1][1], loop[0][1]], color=ACC2, linewidth=2.0, linestyle=(0, (5, 4)), zorder=7)
    arrow(ax, loop[-1], loop[0], color=RED, lw=2.2, mutation_scale=13, zorder=9)
    ax.text(3.26, 1.36, r"$\mathbf{b}$", color=RED, ha="center", va="bottom", fontweight="bold")

    ax.annotate(
        "extra half-plane",
        xy=(core_x, 4.20),
        xytext=(5.65, 4.82),
        ha="center",
        va="bottom",
        color=ACC,
        arrowprops=dict(arrowstyle="-|>", color=ACC, linewidth=2.0, shrinkA=0, shrinkB=5),
    )
    ax.annotate(
        "dislocation core",
        xy=(core_x, core_y),
        xytext=(5.75, 2.30),
        ha="center",
        va="center",
        color=INK,
        arrowprops=dict(arrowstyle="-|>", color=INK, linewidth=1.8, shrinkA=0, shrinkB=6),
    )
    ax.text(4.22, 4.48, "edge dislocation", ha="center", va="bottom", fontweight="bold")
    ax.text(4.35, 4.08, "Burgers circuit", ha="center", va="bottom", color=INK)
    ax.text(0.60, 0.12, "closure failure = $\\mathbf{b}$", color=RED, ha="left", va="bottom")
    ax.set_xlim(0.25, 8.55)
    ax.set_ylim(-0.05, 5.20)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.03, top=0.95)
    save(fig, "mat-03-edge-dislocation")


def draw_carpet(ax, wrinkle=False):
    x0, y0, size = 0.75, 0.72, 0.50
    rows, cols = 4, 8
    for row in range(rows):
        for col in range(cols):
            shift = 0.0
            if wrinkle and col >= 4:
                shift = 0.12
            ax.add_patch(
                Rectangle(
                    (x0 + col * size + shift, y0 + row * size),
                    size,
                    size,
                    facecolor=PALE2,
                    edgecolor=ACC2,
                    linewidth=1.6,
                    zorder=2,
                )
            )
    if not wrinkle:
        arrow(ax, (0.88, 3.24), (4.25, 3.24), color=RED, lw=2.4, mutation_scale=14)
        ax.plot([0.88, 4.38], [0.60, 0.60], color=ACC2, linewidth=2.0, linestyle=(0, (5, 4)))
        ax.text(2.55, 3.47, "whole-plane slip", ha="center", color=RED, fontweight="bold")
        ax.text(2.55, 0.30, r"all bonds move together", ha="center", color=INK, fontsize=11)
    else:
        fold_x = x0 + 4 * size + 0.06
        ax.add_patch(
            Polygon(
                [[fold_x - 0.28, 0.60], [fold_x, 1.30], [fold_x + 0.28, 0.60]],
                closed=True,
                facecolor=ACC2,
                edgecolor=ACC,
                linewidth=2.2,
                alpha=0.76,
                zorder=5,
            )
        )
        for x in (1.20, 2.50, 3.80):
            arrow(ax, (x, 3.35), (x + 0.35, 3.35), color=ACC, lw=2.0, mutation_scale=12)
        ax.annotate(
            "moving wrinkle",
            xy=(fold_x, 1.25),
            xytext=(3.55, 1.45),
            ha="center",
            color=ACC,
            arrowprops=dict(arrowstyle="-|>", color=ACC, linewidth=1.8, shrinkA=0, shrinkB=5),
        )
        ax.text(2.55, 3.60, "wrinkle-by-wrinkle", ha="center", color=ACC, fontweight="bold")
        ax.text(2.55, 0.30, "local bonds move", ha="center", color=INK, fontsize=11)
    ax.set_xlim(0.25, 4.75)
    ax.set_ylim(0.05, 3.95)
    ax.set_aspect("equal")
    ax.axis("off")


def fig_carpet():
    fig, axes = plt.subplots(1, 2, figsize=(9.0, 3.8))
    draw_carpet(axes[0], wrinkle=False)
    draw_carpet(axes[1], wrinkle=True)
    axes[0].text(0.50, 1.05, "idealized slip", transform=axes[0].transAxes, ha="center", va="bottom", fontweight="bold")
    axes[1].text(0.50, 1.05, "dislocation motion", transform=axes[1].transAxes, ha="center", va="bottom", fontweight="bold")
    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.10, top=0.84, wspace=0.10)
    save(fig, "mat-03-carpet-analogy")


def rotated_lattice(ax, xlim, ylim, center, angle_deg, spacing=0.52):
    angle = np.deg2rad(angle_deg)
    rotation = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    center = np.asarray(center)
    points = []
    for i in range(-6, 7):
        for j in range(-6, 7):
            p = center + rotation @ np.array([i * spacing, j * spacing])
            points.append(p)
    for p in points:
        if xlim[0] - 0.1 <= p[0] <= xlim[1] + 0.1 and ylim[0] <= p[1] <= ylim[1]:
            for basis in (np.array([spacing, 0.0]), np.array([0.0, spacing])):
                q = p + rotation @ basis
                if xlim[0] <= q[0] <= xlim[1] and ylim[0] <= q[1] <= ylim[1]:
                    ax.plot([p[0], q[0]], [p[1], q[1]], color=ACC2, linewidth=1.6, alpha=0.56, zorder=1)
    for p in points:
        if xlim[0] <= p[0] <= xlim[1] and ylim[0] <= p[1] <= ylim[1]:
            atom(ax, p, radius=0.075, face=PALE2, edge=ACC, zorder=3)


def fig_grain_boundary():
    fig, ax = plt.subplots(figsize=(9.0, 4.8))
    ax.add_patch(Rectangle((3.74, 0.42), 0.52, 3.92, facecolor=ACC2, edgecolor=ACC, linewidth=2.0, alpha=0.28, zorder=0))
    rotated_lattice(ax, (0.42, 3.74), (0.48, 4.28), (2.05, 2.36), 14)
    rotated_lattice(ax, (4.26, 7.58), (0.48, 4.28), (5.95, 2.36), -14)

    arrow(ax, (0.65, 1.15), (3.45, 1.15), color=RED, lw=2.2, mutation_scale=13, zorder=7)
    ax.text(1.90, 1.38, "dislocation", color=RED, ha="center", va="bottom")
    arrow(ax, (4.00, 0.80), (4.00, 3.90), color=ACC, lw=2.2, mutation_scale=13, zorder=7)
    ax.text(4.46, 3.76, "fast diffusion", color=ACC, ha="left", va="center")
    ax.annotate(
        "barrier",
        xy=(3.76, 1.15),
        xytext=(1.02, 0.20),
        ha="center",
        va="center",
        color=RED,
        arrowprops=dict(arrowstyle="-|>", color=RED, linewidth=1.8, shrinkA=0, shrinkB=6),
    )
    ax.annotate(
        "weak band",
        xy=(4.10, 0.65),
        xytext=(6.20, 0.20),
        ha="center",
        va="center",
        color=INK,
        arrowprops=dict(arrowstyle="-|>", color=INK, linewidth=1.8, shrinkA=0, shrinkB=6),
    )
    ax.text(2.05, 4.56, "grain A", ha="center", va="bottom", fontweight="bold")
    ax.text(5.95, 4.56, "grain B", ha="center", va="bottom", fontweight="bold")
    ax.text(4.00, 4.50, "grain boundary", ha="center", va="bottom", color=ACC, fontsize=11)
    ax.set_xlim(0.15, 7.85)
    ax.set_ylim(-0.02, 4.88)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.03, top=0.94)
    save(fig, "mat-03-grain-boundary")


def add_phase_region(ax, vertices, color, alpha=0.5):
    ax.add_patch(Polygon(vertices, closed=True, facecolor=color, edgecolor="none", alpha=alpha, zorder=0))


def fig_fe_c():
    fig, ax = plt.subplots(figsize=(8.8, 5.4))

    # A deliberately simplified metastable Fe--Fe3C map: the teaching targets
    # are the eutectoid/eutectic landmarks and the five named roles.
    add_phase_region(ax, [(0, 600), (6.67, 600), (6.67, 727), (0, 727)], "#eef7f5", 0.95)
    add_phase_region(ax, [(0, 727), (0, 912), (0.77, 727)], "#d8eee9", 0.82)
    add_phase_region(
        ax,
        [(0, 912), (0, 1394), (0.17, 1493), (2.14, 1148), (0.77, 727), (0, 727)],
        "#c8e7e1",
        0.78,
    )
    add_phase_region(ax, [(0.77, 727), (2.14, 1148), (2.14, 727)], "#b8ddd6", 0.82)
    add_phase_region(ax, [(0.17, 1493), (2.14, 1148), (4.30, 1148), (6.67, 1255), (6.67, 1600), (0.17, 1600)], "#f5fbfa", 0.98)

    liquidus_x = [0.0, 0.17, 0.77, 2.14, 4.30, 6.67]
    liquidus_y = [1538, 1493, 1455, 1320, 1148, 1255]
    solidus_x = [0.0, 0.17, 2.14]
    solidus_y = [1394, 1493, 1148]
    ax.plot(liquidus_x, liquidus_y, color=INK, linewidth=2.2, zorder=4)
    ax.plot(solidus_x, solidus_y, color=ACC, linewidth=2.2, zorder=4)
    ax.plot([0.0, 0.77], [912, 727], color=ACC, linewidth=2.2, zorder=4)
    ax.plot([0.77, 2.14], [727, 1148], color=ACC, linewidth=2.2, zorder=4)
    ax.plot([0.0, 6.67], [727, 727], color=INK, linewidth=2.0, zorder=4)
    ax.plot([2.14, 4.30], [1148, 1148], color=INK, linewidth=2.0, zorder=4)

    for x in (0.77, 2.14):
        ax.axvline(x, color=ACC2, linewidth=1.6, linestyle=(0, (4, 4)), zorder=2)
    ax.axhline(1148, xmin=2.14 / 6.67, xmax=4.30 / 6.67, color=ACC2, linewidth=1.6, linestyle=(0, (4, 4)), zorder=2)

    ax.text(0.18, 790, r"$α$ ferrite", ha="left", va="center", color=INK, fontweight="bold")
    ax.text(1.18, 1110, r"$γ$ austenite", ha="center", va="center", color=INK, fontweight="bold")
    ax.text(0.82, 655, "pearlite", ha="center", va="center", color=ACC, fontweight="bold")
    ax.text(5.20, 835, r"Fe$_3$C", ha="center", va="center", color=INK, fontweight="bold")
    ax.text(5.20, 1435, "liquid", ha="center", va="center", color=INK, fontweight="bold")
    ax.text(2.95, 1268, r"L + $γ$", ha="center", va="center", color=ACC, fontsize=12)
    ax.text(1.42, 820, r"$γ$ + Fe$_3$C", ha="center", va="center", color=INK, fontsize=11)

    ax.annotate(
        "727 °C\nEUTECTOID",
        xy=(0.77, 727),
        xytext=(3.75, 690),
        ha="center",
        va="top",
        color=RED,
        fontweight="bold",
        arrowprops=dict(arrowstyle="-|>", color=RED, linewidth=1.8, shrinkA=0, shrinkB=5),
        bbox=dict(boxstyle="round,pad=0.22", facecolor="white", edgecolor=RED, linewidth=1.6),
    )
    ax.annotate(
        "1148 °C\nEUTECTIC",
        xy=(4.30, 1148),
        xytext=(5.35, 1190),
        ha="center",
        va="bottom",
        color=RED,
        fontweight="bold",
        arrowprops=dict(arrowstyle="-|>", color=RED, linewidth=1.8, shrinkA=0, shrinkB=5),
        bbox=dict(boxstyle="round,pad=0.22", facecolor="white", edgecolor=RED, linewidth=1.6),
    )
    ax.text(0.77, 1570, "0.77% C", ha="center", va="top", color=ACC, fontweight="bold")
    ax.text(2.14, 1570, "2.14% C", ha="center", va="top", color=ACC, fontweight="bold")

    ax.set_xlim(0, 6.67)
    ax.set_ylim(600, 1600)
    ax.set_xlabel("carbon, C (wt%)")
    ax.set_ylabel("temperature (°C)")
    ax.set_title("Fe–C phase diagram (simplified)", pad=10, fontweight="bold")
    ax.set_xticks([0, 0.77, 2.14, 4.30, 6.67])
    ax.set_xticklabels(["0", "0.77", "2.14", "4.30", "6.67"])
    ax.tick_params(width=1.8, length=5)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(1.8)
    ax.spines["bottom"].set_linewidth(1.8)
    fig.subplots_adjust(left=0.12, right=0.97, bottom=0.14, top=0.88)
    save(fig, "mat-05-fe-c")


def draw_host_lattice(ax, x0=0.48, y0=0.55, nx=6, ny=5, spacing=0.52):
    points = [(x0 + i * spacing, y0 + j * spacing) for j in range(ny) for i in range(nx)]
    for x, y in points:
        atom(ax, (x, y), radius=0.105, face=PALE2, edge=ACC, zorder=3)
    return points


def fig_diffusion_mechanisms():
    fig, axes = plt.subplots(1, 2, figsize=(9.0, 4.0))
    for ax in axes:
        ax.set_aspect("equal")
        ax.axis("off")

    # Vacancy mechanism.
    ax = axes[0]
    points = draw_host_lattice(ax)
    vacancy = (2.56, 1.59)
    atom(ax, vacancy, radius=0.12, face="white", edge=ACC, lw=2.2, zorder=5)
    moving = (2.04, 1.59)
    atom(ax, moving, radius=0.12, face=ACC, edge=INK, lw=2.0, zorder=6)
    arrow(ax, moving, vacancy, color=RED, lw=2.2, mutation_scale=13, zorder=8)
    ax.text(2.56, 0.98, "vacancy", ha="center", va="top", color=ACC)
    ax.text(1.38, 3.03, "substitutional atom", ha="center", va="bottom", color=INK, fontsize=11)
    ax.text(2.30, 2.82, "jump", ha="center", va="bottom", color=RED, fontweight="bold")
    ax.text(0.50, 1.08, "vacancy mechanism", transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, "host-site exchange", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.set_xlim(0.10, 3.95)
    ax.set_ylim(0.15, 3.25)

    # Interstitial mechanism.
    ax = axes[1]
    draw_host_lattice(ax)
    small_points = [(1.82, 1.33), (2.22, 1.70), (2.66, 1.40)]
    for p in small_points[:-1]:
        atom(ax, p, radius=0.075, face=ACC2, edge=ACC, lw=1.8, zorder=5)
    atom(ax, small_points[-1], radius=0.085, face=ACC, edge=INK, lw=2.0, zorder=6)
    path = MplPath(
        [small_points[0], (2.02, 1.65), small_points[1], (2.45, 1.64), small_points[2]],
        [MplPath.MOVETO, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3],
    )
    ax.add_patch(PathPatch(path, facecolor="none", edgecolor=RED, linewidth=2.2, zorder=7))
    arrow(ax, (2.40, 1.62), small_points[-1], color=RED, lw=2.2, mutation_scale=13, zorder=8)
    ax.text(2.96, 0.92, "interstitial atom", ha="center", va="top", color=ACC, fontsize=11)
    ax.text(2.34, 2.68, "jump path", ha="center", va="bottom", color=RED, fontweight="bold")
    ax.text(0.50, 1.08, "interstitial mechanism", transform=ax.transAxes, ha="center", va="bottom", fontweight="bold")
    ax.text(0.50, -0.08, "small atom hops", transform=ax.transAxes, ha="center", va="top", fontsize=11)
    ax.set_xlim(0.10, 3.95)
    ax.set_ylim(0.15, 3.25)

    fig.subplots_adjust(left=0.03, right=0.97, bottom=0.14, top=0.86, wspace=0.10)
    save(fig, "mat-06-diffusion-mechanisms")


def draw_dislocation_path(ax, points, color=ACC, lw=2.3):
    points = np.asarray(points)
    ax.plot(points[:, 0], points[:, 1], color=color, linewidth=lw, zorder=7)
    midpoint = points[len(points) // 2]
    next_point = points[len(points) // 2 + 1]
    arrow(ax, midpoint, next_point, color=color, lw=lw, mutation_scale=11, zorder=8)


def fig_strengthening():
    fig, axes = plt.subplots(1, 4, figsize=(12.4, 3.9))
    titles = ["work\nhardening", "solid\nsolution", "grain\nboundary", "precipitate"]
    for ax, title in zip(axes, titles):
        ax.set_aspect("equal")
        ax.axis("off")
        ax.text(0.50, 1.07, title, transform=ax.transAxes, ha="center", va="bottom", fontweight="bold", linespacing=1.0)
        ax.set_xlim(0.0, 3.8)
        ax.set_ylim(0.0, 3.55)

    # Work hardening: a forest of intersecting dislocations.
    ax = axes[0]
    for x in (1.15, 2.05, 2.85):
        ax.plot([x - 0.45, x + 0.45], [0.55, 3.10], color=ACC2, linewidth=2.0, zorder=2)
    draw_dislocation_path(ax, [(0.35, 1.90), (1.00, 2.00), (1.45, 1.45), (2.05, 2.25), (3.38, 2.20)], color=ACC)
    ax.text(1.90, 0.28, "dislocation forest", ha="center", va="bottom", color=ACC, fontsize=11)

    # Solid solution: size-mismatched solute atoms distort the local lattice.
    ax = axes[1]
    draw_host_lattice(ax, x0=0.45, y0=0.55, nx=6, ny=5, spacing=0.55)
    for p, r in [((1.55, 1.10), 0.16), ((2.55, 2.10), 0.15), ((1.05, 2.70), 0.14)]:
        atom(ax, p, radius=r, face=ACC2, edge=INK, lw=2.0, zorder=5)
    draw_dislocation_path(ax, [(0.25, 1.90), (1.05, 1.92), (1.55, 2.35), (2.10, 1.72), (3.45, 1.78)], color=ACC)
    ax.text(1.90, 0.28, "solute strain field", ha="center", va="bottom", color=ACC, fontsize=11)

    # Grain refinement: the dislocation meets a boundary.
    ax = axes[2]
    ax.add_patch(Rectangle((2.05, 0.42), 0.34, 2.85, facecolor=ACC2, edgecolor=ACC, linewidth=2.0, alpha=0.34, zorder=1))
    for y in np.arange(0.75, 3.05, 0.55):
        ax.plot([0.35, 1.95], [y, y], color=GRID, linewidth=1.6, zorder=2)
        ax.plot([2.50, 3.45], [y + 0.10, y - 0.08], color=GRID, linewidth=1.6, zorder=2)
    draw_dislocation_path(ax, [(0.25, 1.80), (1.05, 1.83), (1.72, 2.18), (2.02, 2.18)], color=ACC)
    ax.text(2.22, 0.28, "boundary", ha="center", va="bottom", color=ACC, fontsize=11)

    # Precipitates: hard particles force a bypass.
    ax = axes[3]
    draw_host_lattice(ax, x0=0.42, y0=0.55, nx=6, ny=5, spacing=0.55)
    for p in ((1.52, 1.35), (2.42, 2.25), (2.72, 1.10)):
        atom(ax, p, radius=0.19, face=ACC, edge=INK, lw=2.0, zorder=5)
    draw_dislocation_path(ax, [(0.25, 1.85), (0.95, 1.88), (1.30, 2.50), (1.78, 2.62), (2.10, 1.78), (3.45, 1.78)], color=ACC)
    ax.text(1.90, 0.28, "hard particles", ha="center", va="bottom", color=ACC, fontsize=11)

    fig.text(0.50, 0.015, r"four obstacle families:  $σ_y$ rises when dislocation motion is blocked", ha="center", va="bottom", fontsize=11)
    fig.subplots_adjust(left=0.02, right=0.96, bottom=0.12, top=0.82, wspace=0.10)
    save(fig, "mat-08-strengthening")


def draw_matrix_row(ax):
    for x in np.linspace(0.42, 4.10, 10):
        atom(ax, (x, 1.00), radius=0.10, face=PALE2, edge=ACC, zorder=2)
        atom(ax, (x + 0.18, 1.42), radius=0.10, face=PALE2, edge=ACC, zorder=2)


def fig_precipitation():
    fig = plt.figure(figsize=(9.0, 6.2))
    grid = fig.add_gridspec(2, 2, height_ratios=[1.20, 1.0], hspace=0.42, wspace=0.12)
    ax_curve = fig.add_subplot(grid[0, :])
    ax_cut = fig.add_subplot(grid[1, 0])
    ax_bypass = fig.add_subplot(grid[1, 1])

    r = np.linspace(0.15, 8.0, 500)
    cut = 0.12 + 0.72 * (1.0 - np.exp(-r / 2.5))
    bypass = 0.14 + 0.88 / (r + 1.15)
    crossing = np.argmin(np.abs(cut - bypass))
    r_peak, s_peak = r[crossing], cut[crossing]
    ax_curve.plot(r, cut, color=ACC2, linewidth=2.4, label="cut-through")
    ax_curve.plot(r, bypass, color=ACC, linewidth=2.4, label="bypass / Orowan")
    ax_curve.plot(r_peak, s_peak, marker="o", markersize=7, color=RED, markeredgecolor=INK, markeredgewidth=1.6, zorder=6)
    ax_curve.axvline(r_peak, color=RED, linewidth=1.6, linestyle=(0, (4, 4)))
    ax_curve.annotate(
        "peak-aged",
        xy=(r_peak, s_peak),
        xytext=(r_peak + 1.0, s_peak + 0.15),
        color=RED,
        fontweight="bold",
        arrowprops=dict(arrowstyle="-|>", color=RED, linewidth=1.8, shrinkA=0, shrinkB=5),
    )
    ax_curve.text(5.85, 0.70, "cut-through", color=ACC, ha="center", va="bottom")
    ax_curve.text(5.95, 0.28, "bypass / Orowan", color=ACC, ha="center", va="bottom")
    ax_curve.set_xlabel(r"particle radius $r$  (aging $\rightarrow$)")
    ax_curve.set_ylabel(r"strength increment $\Delta\sigma$")
    ax_curve.set_title("precipitation strengthening", fontweight="bold", pad=8)
    ax_curve.set_xlim(0, 8.2)
    ax_curve.set_ylim(0, 1.08)
    ax_curve.tick_params(width=1.8, length=5)
    ax_curve.spines["top"].set_visible(False)
    ax_curve.spines["right"].set_visible(False)
    ax_curve.spines["left"].set_linewidth(1.8)
    ax_curve.spines["bottom"].set_linewidth(1.8)

    for ax in (ax_cut, ax_bypass):
        ax.set_aspect("equal")
        ax.axis("off")
        ax.set_xlim(0.0, 4.55)
        ax.set_ylim(0.25, 2.65)

    # Small/soft particles are cut by the dislocation.
    ax = ax_cut
    draw_matrix_row(ax)
    particle = (2.25, 1.22)
    atom(ax, particle, radius=0.34, face=ACC2, edge=INK, lw=2.0, zorder=4)
    ax.plot([0.32, 4.15], [2.05, 2.05], color=ACC, linewidth=2.4, zorder=6)
    arrow(ax, (1.10, 2.05), (1.72, 2.05), color=ACC, lw=2.4, mutation_scale=13, zorder=7)
    ax.plot([particle[0] - 0.24, particle[0] + 0.24], [particle[1] - 0.24, particle[1] + 0.24], color=RED, linewidth=2.0, zorder=7)
    ax.plot([particle[0] - 0.24, particle[0] + 0.24], [particle[1] + 0.24, particle[1] - 0.24], color=RED, linewidth=2.0, zorder=7)
    ax.text(2.25, 2.42, "cut-through", ha="center", va="bottom", color=ACC, fontweight="bold")
    ax.text(2.25, 0.38, "small / soft", ha="center", va="bottom", color=INK, fontsize=11)

    # Large/hard particles are bypassed and leave an Orowan loop.
    ax = ax_bypass
    draw_matrix_row(ax)
    particle = (2.25, 1.22)
    atom(ax, particle, radius=0.36, face=ACC, edge=INK, lw=2.0, zorder=4)
    bypass_path = MplPath(
        [(0.32, 2.05), (1.30, 2.05), (1.55, 2.30), (2.25, 2.50), (2.95, 2.30), (3.20, 2.05), (4.15, 2.05)],
        [MplPath.MOVETO, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3, MplPath.CURVE3],
    )
    ax.add_patch(PathPatch(bypass_path, facecolor="none", edgecolor=ACC, linewidth=2.4, zorder=6))
    arrow(ax, (0.90, 2.05), (1.30, 2.05), color=ACC, lw=2.4, mutation_scale=13, zorder=7)
    ax.add_patch(Arc((2.25, 1.22), 0.98, 0.70, theta1=10, theta2=170, edgecolor=RED, linewidth=2.0, zorder=7))
    ax.text(2.25, 2.42, "bypass", ha="center", va="bottom", color=ACC, fontweight="bold")
    ax.text(2.25, 0.38, "large / hard · Orowan loop", ha="center", va="bottom", color=INK, fontsize=11)

    fig.subplots_adjust(left=0.08, right=0.96, bottom=0.08, top=0.91)
    save(fig, "mat-08-precipitation")


def main():
    fig_cells()
    fig_stacking()
    fig_edge_dislocation()
    fig_carpet()
    fig_grain_boundary()
    fig_fe_c()
    fig_diffusion_mechanisms()
    fig_strengthening()
    fig_precipitation()


if __name__ == "__main__":
    main()
