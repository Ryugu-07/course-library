#!/usr/bin/env python3
"""Generate the mechanism diagrams for photo-course lectures 01, 02, 03, 05, 06, 08, 09 and 10.

The figures deliberately use English labels and mathematical notation so that the
Chinese explanation can stay in each lecture's figcaption.  The SVG canvas is
kept fixed (no tight bounding box) for stable viewBox values on the site.
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


# Match the existing photo-course plots.
ACC = "#7a3fb0"
ACC2 = "#c39ee0"
INK = "#222222"
GRID = "#c9c9c9"
RED = "#b3452f"
GREEN = "#2e7d55"
BLUE = "#3b6fa8"
GOLD = "#b07a27"
PALE = "#f5f0e3"

matplotlib.rcParams.update(
    {
        "svg.fonttype": "path",
        "font.family": "DejaVu Sans",
        "font.size": 10.5,
        "axes.linewidth": 1.6,
        "axes.edgecolor": INK,
        "axes.labelcolor": INK,
        "xtick.color": INK,
        "ytick.color": INK,
        "xtick.major.width": 1.6,
        "ytick.major.width": 1.6,
        "xtick.major.size": 4.5,
        "ytick.major.size": 4.5,
        "xtick.minor.width": 1.6,
        "ytick.minor.width": 1.6,
        "xtick.minor.size": 3.0,
        "ytick.minor.size": 3.0,
        "patch.linewidth": 1.6,
        "lines.linewidth": 1.8,
        "figure.facecolor": "white",
        "savefig.facecolor": "white",
        "savefig.edgecolor": "white",
    }
)

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "images"


def arrow(ax, start, end, color=ACC, lw=1.8, mutation=11, style="-|>", **kwargs):
    """Add a readable vector arrow with the course's minimum stroke width."""
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle=style,
        mutation_scale=mutation,
        linewidth=lw,
        color=color,
        shrinkA=0,
        shrinkB=0,
        **kwargs,
    )
    ax.add_patch(patch)
    return patch


def box(ax, xy, width, height, label, edge=ACC, face="white", fontsize=9.5, **kwargs):
    patch = FancyBboxPatch(
        xy,
        width,
        height,
        boxstyle="round,pad=0.025,rounding_size=0.08",
        linewidth=1.6,
        edgecolor=edge,
        facecolor=face,
        **kwargs,
    )
    ax.add_patch(patch)
    ax.text(
        xy[0] + width / 2,
        xy[1] + height / 2,
        label,
        ha="center",
        va="center",
        color=INK,
        fontsize=fontsize,
    )
    return patch


def clean_axes(ax, xlim=None, ylim=None):
    ax.set_facecolor("white")
    ax.tick_params(width=1.6, length=4.5, labelsize=9)
    if xlim is not None:
        ax.set_xlim(*xlim)
    if ylim is not None:
        ax.set_ylim(*ylim)
    return ax


def finish(fig, name):
    """Save a fixed-size SVG with path text and a stable viewBox."""
    IMG.mkdir(parents=True, exist_ok=True)
    path = IMG / f"{name}.svg"
    fig.savefig(path, format="svg", facecolor="white", edgecolor="white")
    plt.close(fig)
    print(f"✓ {path.name}")


def draw_lens(ax, x, y=3.0, height=2.6, width=0.42, edge=ACC):
    ax.add_patch(
        Ellipse(
            (x, y),
            width,
            height,
            facecolor=ACC2,
            edgecolor=edge,
            linewidth=1.8,
            alpha=0.85,
            zorder=4,
        )
    )


def draw_wave(ax, x0, x1, y, amplitude=0.18, cycles=3.0, color=ACC, lw=1.8):
    x = np.linspace(x0, x1, 300)
    yv = y + amplitude * np.sin(2 * np.pi * cycles * (x - x0) / (x1 - x0))
    ax.plot(x, yv, color=color, linewidth=lw)


def ray_matrix():
    fig = plt.figure(figsize=(10.6, 5.0), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.25, 1.0], wspace=0.08)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")

    ax.text(0.2, 5.58, "Ray transfer: propagate, then refract", fontsize=13, weight="bold", color=INK)
    ax.plot([0.45, 9.6], [3, 3], color=GRID, linewidth=1.6, linestyle=(0, (4, 4)))
    ax.text(9.15, 3.18, "optical axis", fontsize=8.5, color=GRID, ha="right")
    ax.plot([0.75, 0.75], [1.55, 4.45], color=INK, linewidth=1.8)
    ax.text(0.75, 1.28, "input plane", ha="center", fontsize=9, color=INK)

    draw_lens(ax, 5.15, height=2.7, width=0.5)
    ax.text(5.15, 1.28, "thin lens", ha="center", fontsize=9, color=INK)
    ax.text(2.9, 4.9, "propagation d", ha="center", fontsize=9, color=GREEN)
    arrow(ax, (1.15, 4.63), (4.35, 4.63), color=GREEN, lw=1.8, mutation=10)
    ax.text(7.75, 4.9, "lens f", ha="center", fontsize=9, color=ACC)

    rays = [
        ([0.75, 5.15, 8.8], [2.05, 2.65, 3.0], RED),
        ([0.75, 5.15, 8.8], [3.95, 3.35, 3.0], RED),
        ([0.75, 5.15, 8.8], [2.55, 2.8, 3.0], ACC),
        ([0.75, 5.15, 8.8], [3.45, 3.2, 3.0], ACC),
    ]
    for xs, ys, color in rays:
        ax.plot(xs[:2], ys[:2], color=color, linewidth=2.0, zorder=2)
        ax.plot(xs[1:], ys[1:], color=color, linewidth=2.0, zorder=2)
    arrow(ax, (8.8, 3.0), (9.2, 3.0), color=ACC, lw=1.8, mutation=10)
    ax.plot(8.8, 3.0, marker="o", markersize=7, color=ACC, markeredgecolor="white", markeredgewidth=1.6)
    ax.text(8.8, 2.58, "image point", ha="center", fontsize=9, color=ACC)
    ax.text(1.03, 4.1, r"$\mathbf{r}_{in}=(y,\theta)^T$", fontsize=9, color=RED)
    ax.text(2.3, 2.22, r"$P(d):\ y\mapsto y+d\theta$", fontsize=9, color=GREEN, rotation=8)
    ax.text(5.58, 3.78, r"$L(f):\ \theta\mapsto\theta-y/f$", fontsize=9, color=ACC, rotation=-7)

    right = fig.add_subplot(gs[0, 1])
    clean_axes(right, (0, 1), (0, 1))
    right.axis("off")
    right.text(0.03, 0.91, "The whole system is one matrix product", fontsize=12.5, weight="bold", color=INK)
    right.text(0.03, 0.77, r"$\mathbf{r}_{out}=\mathbf{M}\mathbf{r}_{in}$", fontsize=16, color=ACC)
    right.text(0.03, 0.66, r"$\mathbf{M}=\mathbf{L}(f)\,\mathbf{P}(d)$", fontsize=14, color=INK)
    box(right, (0.04, 0.39), 0.39, 0.18, r"$P(d)=[1\ d;\ 0\ 1]$", edge=GREEN, face="#f7fbf8", fontsize=10)
    box(right, (0.54, 0.39), 0.39, 0.18, r"$L(f)=[1\ 0;\ -1/f\ 1]$", edge=ACC, face="#fbf8fd", fontsize=10)
    right.text(0.04, 0.27, "Propagation changes height;", fontsize=10, color=GREEN)
    right.text(0.04, 0.19, "the lens changes angle.", fontsize=10, color=ACC)
    right.text(0.04, 0.08, "ABCD matrices scale to many elements.", fontsize=9.5, color=INK)
    finish(fig, "pho-01-ray-matrix")


def aberrations():
    fig = plt.figure(figsize=(10.8, 5.5), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.46, 0.88], wspace=0.10)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")
    ax.text(0.18, 5.57, "Aberration: marginal rays miss the paraxial focus", fontsize=12.7, weight="bold", color=INK)
    ax.plot([0.4, 9.55], [3, 3], color=GRID, linewidth=1.6, linestyle=(0, (4, 4)))
    draw_lens(ax, 2.05, height=3.15, width=0.55, edge=ACC)
    ax.text(2.05, 1.18, "spherical lens", ha="center", fontsize=9, color=INK)
    ax.add_patch(Rectangle((8.28, 1.25), 0.13, 3.5, facecolor="#eeeeee", edgecolor=INK, linewidth=1.6))
    ax.text(8.35, 0.98, "sensor", ha="center", fontsize=9, color=INK)

    # Paraxial rays (purple) and marginal rays (red) have different longitudinal foci.
    for y0, y_lens in [(2.5, 2.5), (3.5, 3.5)]:
        ax.plot([0.55, 2.05], [y0, y_lens], color=ACC, linewidth=2.0)
        ax.plot([2.05, 8.35], [y_lens, 3.0], color=ACC, linewidth=2.0)
    for y0, y_lens, xf in [(1.45, 1.45, 5.95), (4.55, 4.55, 5.95)]:
        ax.plot([0.55, 2.05], [y0, y_lens], color=RED, linewidth=2.0)
        ax.plot([2.05, xf], [y_lens, 3.0], color=RED, linewidth=2.0)
        ax.plot([xf, 8.35], [3.0, 4.1 if y_lens > 3 else 1.9], color=RED, linewidth=2.0, linestyle=(0, (4, 3)))
    ax.plot(5.95, 3, marker="o", markersize=7, color=RED, markeredgecolor="white", markeredgewidth=1.6)
    ax.plot(7.45, 3, marker="o", markersize=7, color=ACC, markeredgecolor="white", markeredgewidth=1.6)
    ax.text(5.95, 3.62, "marginal\nfocus", ha="center", va="center", fontsize=8.8, color=RED)
    ax.text(7.45, 3.48, "paraxial\nfocus", ha="center", va="center", fontsize=8.8, color=ACC)
    ax.add_patch(Ellipse((8.35, 3), 0.25, 2.15, facecolor=RED, alpha=0.18, edgecolor=RED, linewidth=1.6))
    ax.text(8.62, 3.0, "blur\ncircle", va="center", fontsize=9, color=RED)
    ax.text(0.55, 4.9, "parallel input", fontsize=9, color=INK)
    arrow(ax, (0.55, 5.03), (1.55, 5.03), color=INK, lw=1.8, mutation=10)
    ax.annotate("aperture D", xy=(1.10, 1.45), xytext=(0.72, 0.85), fontsize=9, color=RED, arrowprops={"arrowstyle": "-", "lw": 1.6, "color": RED})

    right = fig.add_subplot(gs[0, 1])
    clean_axes(right, (0, 1), (0, 1))
    right.axis("off")
    right.text(0.04, 0.92, "Design knobs", fontsize=12.5, weight="bold", color=INK)
    # Stop down.
    box(right, (0.04, 0.68), 0.92, 0.17, "STOP DOWN: marginal rays removed", edge=RED, face="#fdf7f5", fontsize=9.2)
    right.plot([0.14, 0.46], [0.725, 0.725], color=RED, linewidth=3.0)
    right.plot([0.60, 0.80], [0.725, 0.725], color=GREEN, linewidth=3.0)
    right.text(0.84, 0.725, r"$D\downarrow$", va="center", fontsize=10, color=GREEN)
    # Asphere.
    box(right, (0.04, 0.43), 0.92, 0.17, "ASPHERE: ray heights converge together", edge=ACC, face="#fbf8fd", fontsize=9.0)
    right.plot([0.17, 0.29], [0.515, 0.515], color=ACC, linewidth=2.0)
    right.plot([0.29, 0.74], [0.55, 0.515], color=ACC, linewidth=2.0)
    right.plot([0.29, 0.74], [0.48, 0.515], color=ACC, linewidth=2.0)
    right.plot(0.74, 0.515, marker="o", markersize=6, color=ACC)
    # Achromat.
    box(right, (0.04, 0.18), 0.92, 0.17, "ACHROMAT: wavelengths share one focus", edge=GREEN, face="#f7fbf8", fontsize=8.8)
    right.plot([0.18, 0.42], [0.265, 0.265], color=RED, linewidth=2.0)
    right.plot([0.18, 0.42], [0.305, 0.305], color=BLUE, linewidth=2.0)
    right.plot([0.42, 0.78], [0.265, 0.285], color=RED, linewidth=2.0)
    right.plot([0.42, 0.78], [0.305, 0.285], color=BLUE, linewidth=2.0)
    right.plot(0.78, 0.285, marker="o", markersize=6, color=GREEN)
    right.text(0.04, 0.07, "Off-axis rays produce coma, astigmatism,\nfield curvature and distortion.", fontsize=8.8, color=INK)
    finish(fig, "pho-02-aberrations")


def interference():
    fig = plt.figure(figsize=(10.8, 5.0), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.16, 1.0], wspace=0.11)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")
    ax.text(0.18, 5.58, "Interference converts phase into intensity", fontsize=12.7, weight="bold", color=INK)
    ax.add_patch(Circle((0.8, 3.0), 0.18, facecolor=ACC, edgecolor=INK, linewidth=1.6))
    ax.text(0.8, 2.52, "source", ha="center", fontsize=9, color=INK)
    # Beam splitter and arms.
    ax.add_patch(Polygon([(3.05, 2.75), (3.42, 3.12), (3.68, 2.86), (3.31, 2.49)], facecolor=ACC2, edgecolor=ACC, linewidth=1.8))
    ax.text(3.34, 2.1, "beam\nsplitter", ha="center", fontsize=8.8, color=INK)
    arrow(ax, (1.03, 3.0), (3.1, 3.0), color=ACC, lw=2.2, mutation=10)
    # Upper arm: reference.
    ax.plot([3.4, 3.4, 7.25], [3.08, 4.65, 4.65], color=GREEN, linewidth=2.2)
    arrow(ax, (5.3, 4.65), (6.9, 4.65), color=GREEN, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((7.18, 4.42), 0.12, 0.46, facecolor=INK, edgecolor=INK, linewidth=1.6))
    ax.text(6.0, 4.95, "reference arm", ha="center", fontsize=9, color=GREEN)
    ax.text(7.23, 4.12, "mirror", ha="center", fontsize=8.8, color=INK)
    # Lower arm: sample.
    ax.plot([3.55, 7.25], [2.75, 2.75], color=RED, linewidth=2.2)
    arrow(ax, (5.0, 2.75), (6.9, 2.75), color=RED, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((5.25, 2.58), 0.62, 0.34, facecolor="#fdf7f5", edgecolor=RED, linewidth=1.6))
    ax.text(5.56, 2.75, "sample", ha="center", va="center", fontsize=8.5, color=RED)
    ax.add_patch(Rectangle((7.18, 2.52), 0.12, 0.46, facecolor=INK, edgecolor=INK, linewidth=1.6))
    ax.text(7.23, 2.20, "mirror", ha="center", fontsize=8.8, color=INK)
    # Recombine and output.
    ax.plot([7.25, 3.4], [4.65, 3.08], color=GREEN, linewidth=1.9, linestyle=(0, (4, 3)))
    ax.plot([7.25, 3.55], [2.75, 2.86], color=RED, linewidth=1.9, linestyle=(0, (4, 3)))
    ax.plot([3.35, 8.95], [2.65, 1.25], color=ACC, linewidth=2.2)
    arrow(ax, (7.25, 1.65), (8.75, 1.28), color=ACC, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((8.8, 1.05), 0.16, 0.45, facecolor=PALE, edgecolor=INK, linewidth=1.6))
    ax.text(8.88, 0.75, "detector", ha="center", fontsize=8.8, color=INK)
    ax.text(7.95, 3.55, r"$\Delta\varphi=2\pi\,\mathrm{OPD}/\lambda$", fontsize=9, color=ACC, rotation=-15)
    ax.text(4.45, 1.22, r"mirror shift $\Delta x=\lambda/2$ gives one fringe", fontsize=8.7, color=INK)

    right = fig.add_subplot(gs[0, 1])
    x = np.linspace(-6, 6, 900)
    long = 0.5 + 0.42 * np.cos(2 * np.pi * x)
    envelope = np.exp(-(x / 2.0) ** 2)
    short = 0.5 + 0.42 * envelope * np.cos(2 * np.pi * x)
    right.plot(x, long, color=GREEN, linewidth=2.0, linestyle=(0, (5, 3)), label="long coherence")
    right.plot(x, short, color=ACC, linewidth=2.3, label="short coherence")
    right.plot(x, 0.5 + 0.42 * envelope, color=RED, linewidth=1.7, linestyle=(0, (3, 3)))
    right.plot(x, 0.5 - 0.42 * envelope, color=RED, linewidth=1.7, linestyle=(0, (3, 3)))
    right.set_xlabel("optical path difference / wavelength", fontsize=9.5)
    right.set_ylabel("normalized intensity", fontsize=9.5)
    right.set_title("Coherence gates the fringes", fontsize=12, color=INK, pad=10)
    right.legend(frameon=False, fontsize=8.5, loc="upper right")
    right.text(-5.8, 0.04, r"$I=I_1+I_2+2\sqrt{I_1I_2}|\gamma|\cos\Delta\varphi$", fontsize=9, color=INK)
    right.set_ylim(0, 1.03)
    right.set_xlim(-6, 6)
    clean_axes(right)
    finish(fig, "pho-03-interference")


def polarization():
    fig = plt.figure(figsize=(10.8, 5.2), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.2, 0.88], wspace=0.10)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")
    ax.text(0.15, 5.58, "Polarization control: vector + phase", fontsize=12.2, weight="bold", color=INK)
    # Main linear-polarization chain.
    ax.text(0.35, 4.72, "linear input", fontsize=9, color=INK)
    draw_wave(ax, 0.35, 1.55, 4.25, color=ACC, lw=1.8)
    arrow(ax, (1.62, 4.25), (2.15, 4.25), color=ACC, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((2.18, 3.55), 0.22, 1.4, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    ax.plot([2.19, 2.39], [3.62, 4.88], color=INK, linewidth=1.8)
    ax.text(2.29, 3.18, "P", ha="center", fontsize=10, weight="bold", color=INK)
    arrow(ax, (2.58, 4.25), (3.32, 4.25), color=ACC, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((3.38, 3.55), 0.52, 1.4, facecolor="#fbf8fd", edgecolor=ACC, linewidth=1.8))
    ax.plot([3.47, 3.81], [3.68, 4.82], color=ACC, linewidth=2.0)
    ax.text(3.64, 3.18, r"HWP $\theta$", ha="center", fontsize=9.2, color=ACC)
    # Rotated output polarization arrow.
    arrow(ax, (4.05, 4.25), (4.85, 4.7), color=GREEN, lw=2.1, mutation=10)
    ax.text(4.28, 4.88, r"$2\theta$", fontsize=9, color=GREEN)
    arrow(ax, (4.95, 4.7), (5.65, 4.7), color=GREEN, lw=2.0, mutation=10)
    ax.add_patch(Rectangle((5.72, 3.55), 0.22, 1.4, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    ax.plot([5.73, 5.93], [3.72, 4.78], color=RED, linewidth=1.8)
    ax.text(5.83, 3.18, "A", ha="center", fontsize=10, weight="bold", color=INK)
    arrow(ax, (6.15, 4.7), (6.92, 4.7), color=GREEN, lw=2.0, mutation=10)
    ax.add_patch(Circle((7.2, 4.7), 0.21, facecolor=GREEN, edgecolor=INK, linewidth=1.6))
    ax.text(7.2, 4.2, "detector", ha="center", fontsize=8.8, color=INK)
    ax.text(1.7, 2.55, r"$I=I_0\cos^2\phi$", fontsize=13, color=ACC)
    ax.text(0.35, 2.12, "A half-wave plate rotates linear polarization; the analyzer converts angle to intensity.", fontsize=8.8, color=INK)

    # Quarter-wave plate: a compact Poincare-like projection.
    ax.text(0.38, 1.37, r"QWP: $\Delta\varphi=\pi/2$", fontsize=9.7, weight="bold", color=INK)
    t = np.linspace(0, 2 * np.pi, 240)
    ax.plot(1.20 + 0.52 * np.cos(t), 0.72 + 0.52 * np.sin(t), color=ACC, linewidth=2.0)
    arrow(ax, (1.20, 1.24), (1.20, 0.76), color=ACC, lw=1.8, mutation=9)
    ax.text(1.20, 0.10, "circular state", ha="center", fontsize=8.8, color=INK)
    ax.plot([2.25, 3.35], [0.72, 0.72], color=ACC, linewidth=1.8)
    ax.plot([2.25, 2.25], [0.20, 1.24], color=INK, linewidth=1.6)
    ax.text(2.8, 0.98, r"$E_x$", ha="center", fontsize=8.5, color=ACC)
    ax.text(2.12, 0.8, r"$E_y$", fontsize=8.5, color=INK, rotation=90)

    right = fig.add_subplot(gs[0, 1])
    clean_axes(right, (0, 1), (0, 1))
    right.axis("off")
    right.text(0.04, 0.92, "Faraday isolator: non-reciprocal", fontsize=11.3, weight="bold", color=INK)
    box(right, (0.08, 0.62), 0.2, 0.16, "P", edge=INK, face=PALE, fontsize=10)
    box(right, (0.40, 0.62), 0.23, 0.16, "+45° FR", edge=ACC, face="#fbf8fd", fontsize=9.5)
    box(right, (0.75, 0.62), 0.2, 0.16, "P", edge=INK, face=PALE, fontsize=10)
    arrow(right, (0.29, 0.70), (0.39, 0.70), color=GREEN, lw=2.0, mutation=10)
    arrow(right, (0.64, 0.70), (0.74, 0.70), color=GREEN, lw=2.0, mutation=10)
    right.text(0.50, 0.55, "forward: pass", ha="center", fontsize=9.2, color=GREEN)
    arrow(right, (0.85, 0.50), (0.66, 0.50), color=RED, lw=2.0, mutation=10)
    right.plot(0.45, 0.50, marker="x", markersize=10, markeredgewidth=2.2, color=RED)
    right.text(0.50, 0.40, "reverse: blocked", ha="center", fontsize=9.2, color=RED)
    right.text(0.08, 0.23, "A reflected beam rotates again;\nit does not undo the first rotation.", fontsize=8.9, color=INK)
    right.text(0.08, 0.12, "This protects the laser from back-reflections.", fontsize=8.9, color=INK)
    finish(fig, "pho-05-polarization")


def laser_cavity():
    fig = plt.figure(figsize=(10.8, 5.2), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.25, 0.95], wspace=0.11)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")
    ax.text(0.17, 5.58, "Laser = population inversion + optical feedback", fontsize=12.4, weight="bold", color=INK)
    ax.plot([0.8, 8.55], [3.1, 3.1], color=GRID, linewidth=1.6, linestyle=(0, (4, 4)))
    # Mirrors and gain medium.
    ax.add_patch(Rectangle((0.95, 1.75), 0.18, 2.7, facecolor=INK, edgecolor=INK, linewidth=1.8))
    ax.add_patch(Rectangle((7.25, 1.75), 0.13, 2.7, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    ax.plot([7.29, 7.34], [1.9, 4.3], color=ACC, linewidth=1.8)
    ax.add_patch(Rectangle((3.0, 2.2), 2.15, 1.8, facecolor="#fbf8fd", edgecolor=ACC, linewidth=1.8))
    ax.text(4.08, 3.1, "gain medium", ha="center", va="center", fontsize=10, color=ACC)
    arrow(ax, (4.08, 5.1), (4.08, 4.05), color=GOLD, lw=2.1, mutation=11)
    ax.text(4.08, 5.28, "pump", ha="center", fontsize=9.4, color=GOLD)
    # Circulating photons and output.
    arrow(ax, (1.25, 3.62), (6.98, 3.62), color=GREEN, lw=2.3, mutation=11)
    arrow(ax, (6.98, 2.62), (1.25, 2.62), color=GREEN, lw=2.3, mutation=11)
    arrow(ax, (7.48, 3.1), (9.0, 3.1), color=ACC, lw=2.3, mutation=11)
    ax.text(8.55, 3.42, "coherent output", ha="center", fontsize=9.2, color=ACC)
    ax.text(1.0, 1.32, r"$R_1$", ha="center", fontsize=10, color=INK)
    ax.text(7.31, 1.32, r"$R_2<1$", ha="center", fontsize=10, color=INK)
    ax.text(4.08, 1.35, r"threshold: $R_1R_2e^{2(g-\alpha)L}=1$", ha="center", fontsize=10.3, color=INK)
    ax.text(1.04, 4.7, "high reflector", fontsize=8.7, color=INK, rotation=90, va="center")
    ax.text(7.43, 4.7, "output coupler", fontsize=8.7, color=INK, rotation=90, va="center")

    right = fig.add_subplot(gs[0, 1])
    right.set_xlim(0, 1)
    right.set_ylim(0, 1)
    right.axis("off")
    right.text(0.02, 0.92, "Threshold and modes", fontsize=12, weight="bold", color=INK)
    # Threshold graph.
    chart = fig.add_axes([0.62, 0.51, 0.31, 0.29])
    p = np.linspace(0, 1, 300)
    pout = np.where(p < 0.42, 0.06 + 0.06 * p, 0.06 + 1.85 * (p - 0.42) + 0.06 * p)
    chart.plot(p, pout, color=ACC, linewidth=2.3)
    chart.axvline(0.42, color=RED, linewidth=1.7, linestyle=(0, (4, 3)))
    chart.set_xlabel("pump", fontsize=8.5)
    chart.set_ylabel(r"$P_{out}$", fontsize=8.5)
    chart.text(0.45, 1.42, "$I_{th}$", fontsize=8.7, color=RED)
    chart.text(0.08, 0.18, "spontaneous", fontsize=8, color=INK)
    chart.text(0.60, 1.48, "stimulated", fontsize=8, color=ACC)
    chart.set_xlim(0, 1)
    chart.set_ylim(0, 1.95)
    clean_axes(chart)
    # Mode comb.
    modes = fig.add_axes([0.62, 0.15, 0.31, 0.23])
    freqs = np.arange(0.12, 1.0, 0.14)
    for f in freqs:
        modes.plot([f, f], [0, 0.82], color=GREEN, linewidth=2.0)
    modes.set_xlabel("frequency", fontsize=8.5)
    modes.set_ylabel("gain", fontsize=8.5)
    modes.set_xlim(0, 1)
    modes.set_ylim(0, 1)
    modes.text(0.05, 0.86, r"$\Delta\nu=c/(2nL)$", fontsize=8.8, color=INK)
    clean_axes(modes)
    finish(fig, "pho-06-laser-cavity")


def led_laser():
    fig = plt.figure(figsize=(11.0, 5.45), dpi=100)
    gs = fig.add_gridspec(1, 3, width_ratios=[1.04, 1.1, 0.95], wspace=0.12)
    # Band diagrams.
    band = fig.add_subplot(gs[0, 0])
    clean_axes(band, (-2.5, 2.5), (0, 4.8))
    band.set_xticks([-2, 0, 2])
    band.set_xticklabels([r"$-k$", "0", r"$+k$"])
    band.set_ylabel("energy", fontsize=9.5)
    band.set_title("Band structure sets emission", fontsize=11.3, color=INK, pad=9)
    k = np.linspace(-2.1, 2.1, 300)
    band.plot(k, 3.25 + 0.28 * k**2, color=ACC, linewidth=2.1, label="conduction")
    band.plot(k, 1.15 - 0.20 * k**2, color=GREEN, linewidth=2.1, label="valence")
    arrow(band, (0, 3.12), (0, 1.38), color=RED, lw=1.9, mutation=10)
    band.text(0.16, 2.18, "photon", fontsize=8.5, color=RED, rotation=90, va="center")
    band.text(-2.25, 3.95, "direct gap", fontsize=9.1, color=ACC)
    band.text(-2.25, 0.42, "same k: radiative", fontsize=8.5, color=INK)
    # Indirect inset.
    band.plot(k, 2.16 + 0.28 * (k - 1.0) ** 2, color=RED, linewidth=1.8, linestyle=(0, (4, 3)))
    band.plot(k, 0.50 - 0.20 * k**2, color=GREEN, linewidth=1.8, linestyle=(0, (4, 3)))
    arrow(band, (1.0, 2.05), (0, 0.73), color=GOLD, lw=1.8, mutation=9)
    band.text(0.55, 0.62, "indirect: phonon", fontsize=8.1, color=GOLD)

    # Heterostructure cross-section.
    device = fig.add_subplot(gs[0, 1])
    clean_axes(device, (0, 5), (0, 4.8))
    device.axis("off")
    device.set_title("Double heterostructure", fontsize=11.3, color=INK, pad=9)
    device.add_patch(Rectangle((0.78, 1.05), 3.45, 0.72, facecolor="#dfe8f2", edgecolor=BLUE, linewidth=1.8))
    device.add_patch(Rectangle((0.78, 0.58), 3.45, 0.47, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    device.add_patch(Rectangle((0.78, 1.77), 3.45, 0.85, facecolor=ACC2, edgecolor=ACC, linewidth=1.8))
    device.add_patch(Rectangle((0.78, 2.62), 3.45, 0.47, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    device.text(2.50, 2.20, "active quantum well", ha="center", va="center", fontsize=9.5, color=INK)
    device.text(2.50, 1.35, "n-cladding", ha="center", va="center", fontsize=8.8, color=INK)
    device.text(2.50, 2.86, "p-cladding", ha="center", va="center", fontsize=8.8, color=INK)
    arrow(device, (1.0, 3.75), (1.9, 2.78), color=RED, lw=1.9, mutation=10)
    arrow(device, (4.0, 0.02), (3.1, 1.68), color=BLUE, lw=1.9, mutation=10)
    device.text(0.72, 3.94, r"$e^-$", fontsize=9, color=RED)
    device.text(4.02, 0.03, r"$h^+$", fontsize=9, color=BLUE)
    x = np.linspace(1.15, 3.85, 240)
    mode = 2.2 + 0.38 * np.cos(2 * np.pi * (x - 1.15) / (3.85 - 1.15))
    device.plot(x, mode, color=ACC, linewidth=2.0)
    device.text(2.50, 3.45, "carriers + optical mode confined", ha="center", fontsize=8.8, color=ACC)
    device.add_patch(Rectangle((0.48, 0.48), 0.12, 2.75, facecolor=INK, edgecolor=INK, linewidth=1.6))
    device.add_patch(Rectangle((4.40, 0.48), 0.12, 2.75, facecolor=INK, edgecolor=INK, linewidth=1.6))
    device.text(2.50, 0.12, "LD: cleaved facets provide feedback", ha="center", fontsize=8.6, color=INK)

    # Spectral signature.
    spec = fig.add_subplot(gs[0, 2])
    lam = np.linspace(0, 10, 600)
    led = 0.95 * np.exp(-0.5 * ((lam - 5.0) / 1.65) ** 2)
    ld = 0.95 * np.exp(-0.5 * ((lam - 5.0) / 0.16) ** 2)
    spec.plot(lam, led, color=GREEN, linewidth=2.3, label="LED: spontaneous")
    spec.plot(lam, ld, color=ACC, linewidth=2.3, label="LD: stimulated")
    spec.set_xlabel("wavelength", fontsize=9.2)
    spec.set_ylabel("optical power", fontsize=9.2)
    spec.set_title("Output spectrum", fontsize=11.3, color=INK, pad=9)
    spec.legend(frameon=False, fontsize=8.0, loc="upper right")
    spec.set_xlim(0, 10)
    spec.set_ylim(0, 1.05)
    clean_axes(spec)
    spec.text(0.15, 0.08, r"$\lambda\,[\mu m]\approx1.24/E_g\,[eV]$", fontsize=8.5, color=INK)
    finish(fig, "pho-08-led-laser")


def detectors():
    fig = plt.figure(figsize=(10.8, 5.2), dpi=100)
    gs = fig.add_gridspec(1, 2, width_ratios=[1.08, 1.0], wspace=0.12)
    ax = fig.add_subplot(gs[0, 0])
    clean_axes(ax, (0, 10), (0, 6))
    ax.axis("off")
    ax.text(0.16, 5.58, "Photon -> charge -> shot-noise limit", fontsize=12.0, weight="bold", color=INK)
    # PIN structure.
    ax.add_patch(Rectangle((0.85, 1.15), 0.95, 2.8, facecolor="#dfe8f2", edgecolor=BLUE, linewidth=1.8))
    ax.add_patch(Rectangle((1.80, 1.15), 1.75, 2.8, facecolor="#fbf8fd", edgecolor=ACC, linewidth=1.8))
    ax.add_patch(Rectangle((3.55, 1.15), 0.95, 2.8, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    ax.text(1.33, 2.55, "p", ha="center", fontsize=12, color=BLUE)
    ax.text(2.67, 2.55, "i: depletion", ha="center", fontsize=9.5, color=ACC)
    ax.text(4.02, 2.55, "n", ha="center", fontsize=12, color=INK)
    arrow(ax, (2.08, 4.9), (2.08, 4.08), color=GOLD, lw=2.0, mutation=10)
    arrow(ax, (2.70, 4.9), (2.70, 4.08), color=GOLD, lw=2.0, mutation=10)
    arrow(ax, (3.32, 4.9), (3.32, 4.08), color=GOLD, lw=2.0, mutation=10)
    ax.text(2.70, 5.18, "photons", ha="center", fontsize=9.2, color=GOLD)
    arrow(ax, (2.30, 2.00), (1.35, 2.00), color=RED, lw=1.9, mutation=10)
    arrow(ax, (3.15, 3.08), (4.05, 3.08), color=GREEN, lw=1.9, mutation=10)
    ax.text(0.98, 1.62, r"$e^-$", fontsize=9.5, color=RED)
    ax.text(3.60, 3.33, r"$h^+$", fontsize=9.5, color=GREEN)
    ax.text(2.70, 0.73, "PIN photodiode", ha="center", fontsize=9.5, color=INK)
    ax.text(5.35, 2.6, r"$R=\eta\lambda/1.24$", fontsize=10.3, color=ACC)
    # APD inset.
    box(ax, (5.55, 1.15), 3.55, 1.05, "APD: gain $M$\nexcess noise $F(M)>1$", edge=RED, face="#fdf7f5", fontsize=9.0)

    right = fig.add_subplot(gs[0, 1])
    N = np.logspace(0, 4, 300)
    right.plot(N, np.sqrt(N), color=ACC, linewidth=2.5)
    right.set_xscale("log")
    right.set_yscale("log")
    right.set_xlabel("detected photons N", fontsize=9.5)
    right.set_ylabel("shot-noise-limited SNR", fontsize=9.5)
    right.set_title(r"Poisson limit: $\mathrm{SNR}_{max}=\sqrt{N}$", fontsize=11.8, color=INK, pad=10)
    right.plot([100, 100], [1, 10], color=RED, linewidth=1.7, linestyle=(0, (4, 3)))
    right.plot([1, 100], [10, 10], color=RED, linewidth=1.7, linestyle=(0, (4, 3)))
    right.plot(100, 10, marker="o", markersize=6, color=RED)
    right.text(125, 10.5, "10× SNR", fontsize=8.8, color=RED)
    right.text(2, 8.1, "needs 100× photons", fontsize=8.8, color=RED)
    right.text(0.06, 0.07, r"$i_{shot}^2=2qI\Delta f$", transform=right.transAxes, fontsize=9.8, color=INK)
    clean_axes(right)
    finish(fig, "pho-09-detectors")


def draw_pixel_grid(ax, x0, y0, cols, rows, cell, edge=GRID, fill="white"):
    for r in range(rows):
        for c in range(cols):
            ax.add_patch(
                Rectangle(
                    (x0 + c * cell, y0 + r * cell),
                    cell,
                    cell,
                    facecolor=fill,
                    edgecolor=edge,
                    linewidth=1.6,
                )
            )


def image_sensor():
    fig = plt.figure(figsize=(10.8, 5.45), dpi=100)
    gs = fig.add_gridspec(2, 2, height_ratios=[4.0, 1.15], width_ratios=[1, 1], hspace=0.16, wspace=0.10)
    # CCD.
    ccd = fig.add_subplot(gs[0, 0])
    clean_axes(ccd, (0, 5), (0, 5.8))
    ccd.axis("off")
    ccd.text(0.14, 5.48, "CCD: serial charge transfer", fontsize=12, weight="bold", color=INK)
    draw_pixel_grid(ccd, 0.55, 1.35, 4, 3, 0.68)
    ccd.text(1.91, 3.72, "pixel wells", ha="center", fontsize=8.8, color=INK)
    # Highlight charge packets and transfer arrows.
    for x, y in [(0.89, 2.03), (1.57, 2.03), (2.25, 2.03), (2.93, 2.03)]:
        ccd.add_patch(Circle((x, y), 0.14, facecolor=ACC, edgecolor="white", linewidth=1.6))
    arrow(ccd, (3.55, 2.03), (4.20, 2.03), color=ACC, lw=2.0, mutation=10)
    ccd.add_patch(Rectangle((4.18, 1.70), 0.42, 0.66, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    ccd.text(4.39, 1.18, "one\namplifier", ha="center", fontsize=8.8, color=INK)
    arrow(ccd, (1.0, 3.0), (1.0, 2.42), color=ACC, lw=1.8, mutation=9)
    arrow(ccd, (1.68, 3.0), (1.68, 2.42), color=ACC, lw=1.8, mutation=9)
    arrow(ccd, (2.36, 3.0), (2.36, 2.42), color=ACC, lw=1.8, mutation=9)
    ccd.text(0.55, 0.55, "high uniformity · slow readout · serial bottleneck", fontsize=8.8, color=INK)

    # CMOS APS.
    cmos = fig.add_subplot(gs[0, 1])
    clean_axes(cmos, (0, 5), (0, 5.8))
    cmos.axis("off")
    cmos.text(0.14, 5.48, "CMOS APS: parallel readout", fontsize=12, weight="bold", color=INK)
    draw_pixel_grid(cmos, 0.45, 1.35, 4, 3, 0.68)
    for r in range(3):
        for c in range(4):
            x = 0.45 + c * 0.68 + 0.34
            y = 1.35 + r * 0.68 + 0.34
            cmos.add_patch(Circle((x, y), 0.10, facecolor=GREEN, edgecolor="white", linewidth=1.6))
            arrow(cmos, (x + 0.12, y), (4.05, y), color=GREEN, lw=1.6, mutation=7, alpha=0.75)
    for y in [1.69, 2.37, 3.05]:
        cmos.add_patch(Rectangle((4.05, y - 0.12), 0.42, 0.24, facecolor=PALE, edgecolor=INK, linewidth=1.6))
        arrow(cmos, (4.52, y), (4.82, y), color=GREEN, lw=1.7, mutation=8)
    cmos.text(4.22, 0.96, "column ADCs", ha="center", fontsize=8.7, color=INK)
    cmos.text(0.45, 0.55, "random access · fast · logic can be stacked", fontsize=8.8, color=INK)

    # BSI strip, shared below both architecture panels.
    bsi = fig.add_subplot(gs[1, :])
    clean_axes(bsi, (0, 10), (0, 1.5))
    bsi.axis("off")
    bsi.text(0.0, 1.43, "BSI: light enters from the back and avoids front-side metal", fontsize=10.2, weight="bold", color=INK)
    bsi.add_patch(Rectangle((0.75, 0.18), 5.7, 0.36, facecolor=ACC2, edgecolor=ACC, linewidth=1.8))
    bsi.add_patch(Rectangle((0.75, 0.54), 5.7, 0.30, facecolor="#dfe8f2", edgecolor=BLUE, linewidth=1.8))
    bsi.add_patch(Rectangle((0.75, 0.84), 5.7, 0.22, facecolor=PALE, edgecolor=INK, linewidth=1.8))
    bsi.text(3.6, 0.36, "photodiode layer", ha="center", va="center", fontsize=8.8, color=INK)
    bsi.text(3.6, 0.69, "wiring / logic", ha="center", va="center", fontsize=8.8, color=INK)
    bsi.text(3.6, 0.95, "microlens", ha="center", va="center", fontsize=8.5, color=INK)
    for x in [1.25, 2.25, 3.25, 4.25, 5.25, 6.25]:
        arrow(bsi, (x, 1.34), (x, 1.10), color=GOLD, lw=1.8, mutation=8)
    bsi.text(7.25, 0.68, "higher fill factor\nand quantum efficiency", fontsize=8.9, color=GREEN, va="center")
    finish(fig, "pho-10-image-sensor")


def main():
    ray_matrix()
    aberrations()
    interference()
    polarization()
    laser_cavity()
    led_laser()
    detectors()
    image_sensor()


if __name__ == "__main__":
    main()
