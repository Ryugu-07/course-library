"""Core teaching diagrams for photo-course lectures 12--21.

Run from ``photo-course`` with::

    rtk python figs/photo_diagrams_12_21.py

The SVGs deliberately keep all in-figure labels in English/math so that the
figures remain legible across locales.  Chinese explanation belongs in the
lecture figcaptions.
"""
from pathlib import Path
import re

import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle, Polygon
from matplotlib.patches import FancyArrowPatch

from _common import ACC, ACC2, GREEN, GRID, INK, RED, plt


OUT = Path(__file__).resolve().parents[1] / "images"
OUT.mkdir(parents=True, exist_ok=True)

# Match the photo-course palette and make the generated paths consistent.
plt.rcParams.update({
    "svg.fonttype": "path",
    "svg.hashsalt": "photo-course-12-21",
    "font.size": 11,
    "axes.linewidth": 1.5,
    "xtick.major.width": 1.5,
    "ytick.major.width": 1.5,
    "xtick.minor.width": 1.5,
    "ytick.minor.width": 1.5,
})

PALE = "#f4eee4"
PALE_PURPLE = "#eadcf4"
PALE_GREEN = "#dcefe5"
PALE_RED = "#f4ddd7"
BLUE = "#3d6ea8"
GOLD = "#b77b27"
WHITE = "#ffffff"


def save(fig, filename):
    """Save a fixed-size, path-text SVG with a stable viewBox."""
    path = OUT / filename
    fig.savefig(path, format="svg", facecolor=WHITE)
    # Matplotlib adds a wall-clock dc:date by default; remove it so reruns
    # produce byte-stable teaching assets as well as stable viewBoxes.
    svg = path.read_text(encoding="utf-8")
    svg = re.sub(r"\n\s*<dc:date>[^<]*</dc:date>", "", svg, count=1)
    path.write_text(svg, encoding="utf-8")
    plt.close(fig)
    print(f"✓ {filename}")


def schematic(ax, xlim=(0, 1), ylim=(0, 1)):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_axis_off()
    ax.set_facecolor(WHITE)
    return ax


def data_axes(ax):
    ax.set_facecolor(WHITE)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_linewidth(1.5)
    ax.spines["bottom"].set_linewidth(1.5)
    ax.tick_params(colors="#444444", width=1.5, length=4)
    return ax


def box(ax, x, y, w, h, label, face=PALE_PURPLE, edge=ACC, fontsize=10,
        text_color=INK, radius=0.025, lw=1.7):
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.012,rounding_size={radius}",
        facecolor=face, edgecolor=edge, linewidth=lw,
    )
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h / 2, label, ha="center", va="center",
            fontsize=fontsize, color=text_color, linespacing=1.15)
    return patch


def arrow(ax, start, end, color=ACC, lw=1.8, mutation=12, style="-|>",
          connectionstyle="arc3"):
    patch = FancyArrowPatch(
        start, end, arrowstyle=style, mutation_scale=mutation,
        linewidth=lw, color=color, connectionstyle=connectionstyle,
    )
    ax.add_patch(patch)
    return patch


def fiber_modes():
    fig = plt.figure(figsize=(8.4, 4.7), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.15, 1), left=0.06, right=0.97,
                          bottom=0.15, top=0.86, wspace=0.30)
    ax0 = fig.add_subplot(gs[0])
    ax0.set_aspect("equal")
    ax0.set_xlim(-2.65, 2.65)
    ax0.set_ylim(-2.55, 2.55)
    ax0.set_xticks([])
    ax0.set_yticks([])
    ax0.set_facecolor(PALE)

    n = 260
    xx = np.linspace(-2.2, 2.2, n)
    yy = np.linspace(-2.2, 2.2, n)
    X, Y = np.meshgrid(xx, yy)
    R = np.hypot(X, Y)
    cmap = LinearSegmentedColormap.from_list(
        "fiber_field", ["#f8f4ed", "#d8b7e9", ACC, RED]
    )
    field01 = np.exp(-1.45 * (X * X + Y * Y))
    field01[R > 1.75] = np.nan
    ax0.imshow(field01, extent=(-2.2, 2.2, -2.2, 2.2), origin="lower",
               cmap=cmap, vmin=0, vmax=1, interpolation="bilinear")
    ax0.add_patch(Circle((0, 0), 1.75, fill=False, edgecolor=INK, linewidth=2.0))
    ax0.text(0, 0, r"$\mathrm{LP}_{01}$", ha="center", va="center",
             fontsize=15, color=WHITE, weight="bold")
    ax0.text(0, -2.18, "core 8--10 um", ha="center", va="top", fontsize=10,
             color=INK)
    ax0.set_title("fundamental field", color=INK, fontsize=12)

    ax1 = fig.add_subplot(gs[1])
    data_axes(ax1)
    v = np.linspace(0, 6.2, 200)
    ax1.hlines(1, 0, 6.2, color=ACC, linewidth=4.0, capstyle="round")
    ax1.hlines(2, 2.405, 6.2, color=GREEN, linewidth=4.0, capstyle="round")
    ax1.hlines(3, 3.832, 6.2, color=RED, linewidth=4.0, capstyle="round")
    ax1.axvline(2.405, color=INK, linestyle="--", linewidth=1.8)
    ax1.axvline(3.832, color="#777777", linestyle=":", linewidth=1.8)
    ax1.text(1.05, 3.26, r"$V<2.405$", color=ACC, fontsize=11, weight="bold")
    ax1.text(2.46, 3.26, r"$V=2.405$", color=INK, fontsize=9.5)
    ax1.text(3.89, 2.55, r"$V=3.832$", color="#666666", fontsize=9.5)
    ax1.set_xlim(0, 6.2)
    ax1.set_ylim(0.55, 3.45)
    ax1.set_yticks([1, 2, 3])
    ax1.set_yticklabels([r"$\mathrm{LP}_{01}$", r"$\mathrm{LP}_{11}$",
                         r"$\mathrm{LP}_{21}/\mathrm{LP}_{02}$"])
    ax1.set_xlabel(r"normalized frequency $V=2\pi a\,\mathrm{NA}/\lambda$")
    ax1.set_title("mode cutoffs", color=INK, fontsize=12)
    ax1.text(0.02, 0.02, "one guided family", transform=ax1.transAxes,
             fontsize=9.5, color=ACC)
    fig.suptitle("Fiber modes are set by normalized frequency", color=INK,
                 fontsize=14, weight="bold")
    save(fig, "pho-12-fiber-modes.svg")


def link_budget():
    fig = plt.figure(figsize=(8.7, 5.35), facecolor=WHITE)
    gs = fig.add_gridspec(2, 1, height_ratios=(0.72, 1.35), left=0.06,
                          right=0.97, bottom=0.11, top=0.88, hspace=0.32)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "coherent optical link", ha="center", va="top",
             fontsize=12, color=INK, weight="bold")
    labels = ["DATA", "DSP", "LASER /\nMOD", "WDM", "FIBER /\nEDFA", "RX"]
    faces = [PALE, PALE_GREEN, PALE_PURPLE, PALE_RED, PALE_PURPLE, PALE_GREEN]
    xs = [0.02, 0.18, 0.34, 0.50, 0.66, 0.84]
    widths = [0.105, 0.105, 0.125, 0.105, 0.135, 0.105]
    for x, w, label, face in zip(xs, widths, labels, faces):
        box(ax0, x, 0.36, w, 0.25, label, face=face, fontsize=9.3)
    for i in range(len(xs) - 1):
        arrow(ax0, (xs[i] + widths[i] + 0.01, 0.485),
              (xs[i + 1] - 0.01, 0.485), color=ACC, mutation=10)
    ax0.text(0.50, 0.10,
             r"$P_{rx}=P_{tx}-\alpha L-\sum L_c+\sum G$",
             ha="center", va="center", fontsize=13, color=INK)

    ax1 = data_axes(fig.add_subplot(gs[1]))
    span = 50
    p_loss = 10
    distance = np.array([0, 50, 50, 100, 100, 150], dtype=float)
    power = np.array([0, -p_loss, 0, -p_loss, 0, -p_loss], dtype=float)
    ax1.plot(distance[[0, 1]], power[[0, 1]], color=ACC, linewidth=2.8)
    ax1.plot(distance[[1, 2]], power[[1, 2]], color=GREEN, linewidth=2.8)
    ax1.plot(distance[[2, 3]], power[[2, 3]], color=ACC, linewidth=2.8)
    ax1.plot(distance[[3, 4]], power[[3, 4]], color=GREEN, linewidth=2.8)
    ax1.plot(distance[[4, 5]], power[[4, 5]], color=ACC, linewidth=2.8,
             label="fiber loss")
    ax1.scatter([0, 50, 50, 100, 100, 150], [0, -10, 0, -10, 0, -10],
                color=INK, s=24, zorder=4, linewidths=1.5)
    ax1.axhline(-12, color=RED, linestyle="--", linewidth=1.8,
                label="receiver sensitivity")
    ax1.annotate("-10 dB / 50 km", xy=(25, -5), xytext=(11, -2.1),
                 color=ACC, fontsize=9.5,
                 arrowprops=dict(arrowstyle="-|>", color=ACC, lw=1.8))
    ax1.annotate("EDFA\n+10 dB", xy=(50, -5), xytext=(52.5, -1.7),
                 color=GREEN, fontsize=9.5, ha="left",
                 arrowprops=dict(arrowstyle="-|>", color=GREEN, lw=1.8))
    ax1.text(145, -9.2, r"$P_{rx}=-10\ \mathrm{dBm}$", ha="right",
             color=INK, fontsize=10)
    ax1.set_xlim(0, 150)
    ax1.set_ylim(-14.5, 2.3)
    ax1.set_xlabel("distance (km)")
    ax1.set_ylabel("optical power (dBm)")
    ax1.set_title("A span budget: loss is reset by gain", color=INK, fontsize=12)
    ax1.legend(frameon=False, loc="lower left", fontsize=9.5)
    save(fig, "pho-13-link-budget.svg")


def amplifier_nonlinear():
    fig = plt.figure(figsize=(8.7, 5.35), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(0.95, 1.2), left=0.055,
                          right=0.97, bottom=0.13, top=0.87, wspace=0.28)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "EDFA", ha="center", va="top", fontsize=13,
             color=INK, weight="bold")
    box(ax0, 0.02, 0.57, 0.23, 0.16, "signal\n1530--1565 nm",
        face=PALE_PURPLE, fontsize=9.5)
    box(ax0, 0.37, 0.54, 0.29, 0.22, "erbium fiber\nG > 20 dB",
        face=PALE_RED, edge=RED, fontsize=10)
    box(ax0, 0.77, 0.57, 0.21, 0.16, "amplified\nsignal",
        face=PALE_GREEN, edge=GREEN, fontsize=9.5)
    arrow(ax0, (0.25, 0.65), (0.37, 0.65), color=ACC)
    arrow(ax0, (0.66, 0.65), (0.77, 0.65), color=GREEN)
    arrow(ax0, (0.13, 0.21), (0.47, 0.54), color=GOLD, mutation=12)
    ax0.text(0.14, 0.14, "980 / 1480 nm pump", ha="left", va="top",
             fontsize=9.5, color=GOLD)
    arrow(ax0, (0.515, 0.76), (0.515, 0.91), color=RED, mutation=11)
    ax0.text(0.55, 0.91, "ASE", ha="left", va="center", fontsize=10,
             color=RED)
    ax0.text(0.50, 0.37, "stimulated emission", ha="center", va="center",
             fontsize=9.5, color=INK)

    ax1 = data_axes(fig.add_subplot(gs[1]))
    p = np.linspace(-6, 8, 400)
    ase = 0.65 * np.exp(-0.22 * (p + 6)) + 0.05
    kerr = 0.018 * np.exp(0.38 * (p + 6))
    total = ase + kerr
    p_opt = p[np.argmin(total)]
    ax1.plot(p, ase, color=GREEN, linewidth=2.5, linestyle="--",
             label="ASE noise")
    ax1.plot(p, kerr, color=RED, linewidth=2.5, linestyle="--",
             label="Kerr noise")
    ax1.plot(p, total, color=ACC, linewidth=3.0, label="total noise")
    ax1.axvline(p_opt, color=INK, linestyle=":", linewidth=1.8)
    ax1.text(p_opt + 0.18, 0.17, r"$P_{opt}$", color=INK, fontsize=10)
    ax1.text(-5.3, 0.82, "ASE-limited", color=GREEN, fontsize=10)
    ax1.text(3.7, 0.72, "Kerr-limited", color=RED, fontsize=10)
    ax1.text(0.98, 0.98, r"$n=n_0+n_2I$", transform=ax1.transAxes,
             ha="right", va="top", fontsize=11, color=INK)
    ax1.set_xlim(-6, 8)
    ax1.set_ylim(0, 1.02)
    ax1.set_xlabel("launch power  P (dBm)")
    ax1.set_ylabel("noise / signal (normalized)")
    ax1.set_title("Kerr nonlinearity creates a power ceiling", color=INK,
                  fontsize=12)
    ax1.legend(frameon=False, fontsize=9.3, loc="upper center")
    fig.suptitle("Amplification enables WDM; nonlinearity sets the operating point",
                 color=INK, fontsize=13.5, weight="bold")
    save(fig, "pho-14-amplifier-nonlinear.svg")


def silicon_photonics():
    fig = plt.figure(figsize=(8.8, 5.25), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(0.92, 1.25), left=0.055,
                          right=0.97, bottom=0.11, top=0.86, wspace=0.26)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "high-index contrast", ha="center", va="top",
             fontsize=12, color=INK, weight="bold")
    ax0.add_patch(Rectangle((0.08, 0.06), 0.84, 0.18, facecolor="#d9dde2",
                            edgecolor=INK, linewidth=1.7))
    ax0.add_patch(Rectangle((0.08, 0.24), 0.84, 0.28, facecolor="#f1eee7",
                            edgecolor=INK, linewidth=1.7))
    ax0.add_patch(Rectangle((0.28, 0.52), 0.44, 0.18, facecolor=ACC,
                            edgecolor=INK, linewidth=1.9))
    x = np.linspace(0.08, 0.92, 240)
    y = np.linspace(0.25, 0.87, 190)
    X, Y = np.meshgrid(x, y)
    mode = np.exp(-(((X - 0.5) / 0.24) ** 2 + ((Y - 0.61) / 0.20) ** 2))
    ax0.imshow(mode, extent=(0.08, 0.92, 0.25, 0.87), origin="lower",
               cmap=LinearSegmentedColormap.from_list("mode", ["#ffffff00", "#c39ee0cc"]),
               vmin=0, vmax=1, interpolation="bilinear", zorder=2)
    ax0.text(0.50, 0.605, "Si strip", ha="center", va="center", color=WHITE,
             fontsize=10, weight="bold", zorder=3)
    ax0.text(0.10, 0.82, r"$n_{Si}\approx3.48$", ha="left", va="center",
             fontsize=10, color=INK)
    ax0.text(0.10, 0.34, r"$n_{SiO_2}\approx1.44$", ha="left", va="center",
             fontsize=10, color=INK)
    ax0.text(0.50, 0.015, "450 nm scale", ha="center", va="bottom",
             fontsize=9.5, color=INK)
    ax0.set_title("sub-micron optical confinement", color=INK, fontsize=11.5,
                  pad=2)

    ax1 = schematic(fig.add_subplot(gs[1]))
    ax1.text(0.50, 0.98, "integrated building blocks", ha="center", va="top",
             fontsize=12, color=INK, weight="bold")
    ax1.text(0.08, 0.84, "MZI modulator", ha="left", va="center", fontsize=10.5,
             color=ACC, weight="bold")
    box(ax1, 0.02, 0.68, 0.14, 0.12, "laser", face=PALE_PURPLE, fontsize=9)
    box(ax1, 0.84, 0.68, 0.14, 0.12, "Ge PD", face=PALE_GREEN, edge=GREEN,
        fontsize=9)
    ax1.plot([0.16, 0.28], [0.74, 0.74], color=ACC, linewidth=2.2)
    ax1.plot([0.28, 0.39], [0.74, 0.84], color=ACC, linewidth=2.2)
    ax1.plot([0.28, 0.39], [0.74, 0.64], color=ACC, linewidth=2.2)
    ax1.plot([0.39, 0.72], [0.84, 0.84], color=ACC, linewidth=2.2)
    ax1.plot([0.39, 0.72], [0.64, 0.64], color=ACC, linewidth=2.2)
    ax1.plot([0.72, 0.84], [0.84, 0.74], color=ACC, linewidth=2.2)
    ax1.plot([0.72, 0.84], [0.64, 0.74], color=ACC, linewidth=2.2)
    box(ax1, 0.48, 0.78, 0.18, 0.10, "phase shifter", face=PALE_RED,
        edge=RED, fontsize=8.5)
    ax1.text(0.09, 0.43, "micro-ring filter", ha="left", va="center",
             fontsize=10.5, color=GREEN, weight="bold")
    ax1.plot([0.08, 0.92], [0.27, 0.27], color=GREEN, linewidth=2.4)
    ax1.add_patch(Circle((0.52, 0.27), 0.14, fill=False, edgecolor=GREEN,
                         linewidth=2.2))
    ax1.plot([0.52, 0.52], [0.41, 0.47], color=RED, linewidth=2.0)
    ax1.add_patch(Rectangle((0.44, 0.47), 0.16, 0.06, facecolor=PALE_RED,
                            edgecolor=RED, linewidth=1.7))
    ax1.text(0.66, 0.49, "heater /\nthermal tune", ha="left", va="center",
             fontsize=8.8, color=RED)
    ax1.text(0.50, 0.08, "CMOS-scale integration", ha="center", va="center",
             fontsize=10, color=INK)
    fig.suptitle("Silicon photonics: confinement, modulation, coupling", color=INK,
                 fontsize=13.5, weight="bold")
    save(fig, "pho-15-silicon-photonics.svg")


def display():
    fig = plt.figure(figsize=(8.8, 5.35), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.35, 0.85), left=0.055,
                          right=0.97, bottom=0.12, top=0.87, wspace=0.30)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "transmissive vs emissive pixels", ha="center",
             va="top", fontsize=12, color=INK, weight="bold")
    ax0.text(0.03, 0.82, "LCD", color=ACC, fontsize=11, weight="bold")
    lcd = [("backlight", 0.03, PALE), ("polarizer", 0.23, PALE_RED),
           ("LC shutter", 0.43, PALE_PURPLE), ("RGB filter", 0.63, PALE_GREEN),
           ("viewer", 0.83, PALE)]
    for label, x, face in lcd:
        box(ax0, x, 0.62, 0.14, 0.13, label, face=face, fontsize=8.3)
    for (_, x0, _), (_, x1, _) in zip(lcd[:-1], lcd[1:]):
        arrow(ax0, (x0 + 0.145, 0.685), (x1 - 0.01, 0.685), color=ACC,
              mutation=9)
    ax0.text(0.03, 0.52, r"$50\%\ \times\ 1/3\ \times\$ aperture", color=RED,
             fontsize=9.3)
    ax0.text(0.03, 0.35, "OLED", color=GREEN, fontsize=11, weight="bold")
    oled = [("TFT", 0.03, PALE), ("emissive layer", 0.27, PALE_PURPLE),
            ("RGB pixels", 0.55, PALE_RED), ("viewer", 0.80, PALE)]
    for label, x, face in oled:
        box(ax0, x, 0.15, 0.16, 0.13, label, face=face, edge=GREEN,
            fontsize=8.5)
    for (_, x0, _), (_, x1, _) in zip(oled[:-1], oled[1:]):
        arrow(ax0, (x0 + 0.165, 0.215), (x1 - 0.01, 0.215), color=GREEN,
              mutation=9)
    ax0.text(0.56, 0.07, "pixel OFF -> black", color=GREEN, fontsize=9.5)

    ax1 = schematic(fig.add_subplot(gs[1]))
    ax1.text(0.50, 0.98, "microLED transfer", ha="center", va="top", fontsize=12,
             color=INK, weight="bold")
    for row in range(5):
        for col in range(5):
            color = [ACC, RED, GREEN][(row + col) % 3]
            ax1.add_patch(Rectangle((0.16 + col * 0.12, 0.54 - row * 0.12),
                                    0.075, 0.075, facecolor=color,
                                    edgecolor=WHITE, linewidth=1.6))
    ax1.text(0.50, 0.04, r"99.99\% yield\ \rightarrow\ \sim2,500 defects",
             ha="center", va="bottom", fontsize=9.8, color=RED)
    ax1.text(0.50, 0.76, r"4K\approx25\,\mathrm{M}\ emitters", ha="center",
             va="center", fontsize=10.5, color=INK, weight="bold")
    arrow(ax1, (0.50, 0.80), (0.50, 0.69), color=ACC, mutation=10)
    ax1.text(0.50, 0.12, "transfer -> inspect -> repair", ha="center",
             va="center", fontsize=9.5, color=INK)
    fig.suptitle("Display architectures trade efficiency, black level, and yield",
                 color=INK, fontsize=13.5, weight="bold")
    save(fig, "pho-16-display.svg")


def lidar():
    fig = plt.figure(figsize=(8.8, 5.25), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.0, 1.18), left=0.055,
                          right=0.97, bottom=0.12, top=0.86, wspace=0.28)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "dToF: direct time of flight", ha="center", va="top",
             fontsize=11.5, color=INK, weight="bold")
    box(ax0, 0.03, 0.70, 0.23, 0.14, "laser\npulse", face=PALE_PURPLE,
        fontsize=9.5)
    box(ax0, 0.03, 0.17, 0.23, 0.14, "SPAD /\nTDC", face=PALE_GREEN, edge=GREEN,
        fontsize=9.5)
    ax0.add_patch(Polygon([[0.73, 0.50], [0.91, 0.65], [0.91, 0.35]],
                          closed=True, facecolor=PALE_RED, edgecolor=RED,
                          linewidth=1.8))
    ax0.text(0.83, 0.50, "target", ha="center", va="center", fontsize=9.5,
             color=INK, rotation=90)
    arrow(ax0, (0.26, 0.77), (0.73, 0.60), color=ACC, mutation=11)
    arrow(ax0, (0.73, 0.40), (0.26, 0.24), color=RED, mutation=11)
    ax0.text(0.44, 0.66, "pulse", color=ACC, fontsize=9.5, rotation=-18)
    ax0.text(0.42, 0.30, "echo", color=RED, fontsize=9.5, rotation=18)
    arrow(ax0, (0.34, 0.72), (0.34, 0.34), color=INK, mutation=10,
          style="<->")
    ax0.text(0.37, 0.53, r"$\Delta t$", color=INK, fontsize=11)
    ax0.text(0.50, 0.06, r"$R=c\Delta t/2$", ha="center", va="center",
             fontsize=13, color=INK, weight="bold")

    ax1 = data_axes(fig.add_subplot(gs[1]))
    t = np.linspace(0, 1, 400)
    tau = 0.23
    tx = 0.18 + 0.65 * t
    rx = 0.18 + 0.65 * np.clip(t - tau, 0, None)
    rx[t < tau] = np.nan
    ax1.plot(t, tx, color=ACC, linewidth=2.7, label=r"$f_{tx}$")
    ax1.plot(t, rx, color=RED, linewidth=2.7, label=r"$f_{rx}$ (delayed)")
    x_gap = 0.72
    y_tx = 0.18 + 0.65 * x_gap
    y_rx = 0.18 + 0.65 * (x_gap - tau)
    arrow(ax1, (x_gap, y_rx), (x_gap, y_tx), color=GREEN, mutation=10,
          style="<->")
    ax1.text(x_gap + 0.02, (y_rx + y_tx) / 2, r"$f_b=S\tau$", color=GREEN,
             fontsize=10)
    ax1.text(0.08, 0.86, "coherent mixer", color=INK, fontsize=9.5)
    ax1.text(0.98, 0.05, r"$f_b=2SR/c$", transform=ax1.transAxes,
             ha="right", va="bottom", fontsize=11, color=INK)
    ax1.set_xlim(0, 1)
    ax1.set_ylim(0.10, 0.94)
    ax1.set_xlabel("time  t")
    ax1.set_ylabel("instantaneous frequency  f")
    ax1.set_title("FMCW: delay becomes a beat frequency", color=INK, fontsize=11.5)
    ax1.legend(frameon=False, fontsize=9.2, loc="lower right")
    fig.suptitle("LiDAR measures distance by delay or coherent beating", color=INK,
                 fontsize=13.5, weight="bold")
    save(fig, "pho-17-lidar.svg")


def metasurface():
    fig = plt.figure(figsize=(8.8, 5.1), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.0, 1.15), left=0.055,
                          right=0.97, bottom=0.13, top=0.86, wspace=0.28)
    phase_cmap = plt.get_cmap("plasma")
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "meta-atoms: geometry -> phase", ha="center", va="top",
             fontsize=11.5, color=INK, weight="bold")
    centers = np.linspace(0.13, 0.87, 10)
    widths = np.array([0.055, 0.075, 0.095, 0.115, 0.135, 0.115, 0.095,
                       0.075, 0.055, 0.040])
    phases = np.linspace(0, 1, len(centers))
    ax0.add_patch(Rectangle((0.07, 0.12), 0.86, 0.08, facecolor="#d9dde2",
                            edgecolor=INK, linewidth=1.7))
    for c, w, phase in zip(centers, widths, phases):
        ax0.add_patch(Rectangle((c - w / 2, 0.20), w, 0.43,
                                facecolor=phase_cmap(phase), edgecolor=INK,
                                linewidth=1.6))
        arrow(ax0, (c, 0.87), (c, 0.68), color=ACC2, mutation=8)
    ax0.text(0.50, 0.91, "input wave", ha="center", va="center", fontsize=9.5,
             color=ACC)
    ax0.text(0.50, 0.05, r"unit-cell geometry $\rightarrow\ \varphi\in[0,2\pi]$",
             ha="center", va="center", fontsize=9.4, color=INK)
    ax0.text(0.50, 0.70, "subwavelength pillars", ha="center", va="center",
             fontsize=9.5, color=INK)

    ax1 = schematic(fig.add_subplot(gs[1]))
    ax1.text(0.50, 0.98, "phase gradient -> beam steering", ha="center",
             va="top", fontsize=11.5, color=INK, weight="bold")
    xcells = np.linspace(0.16, 0.84, 9)
    for c, phase in zip(xcells, np.linspace(0, 1, len(xcells))):
        ax1.add_patch(Rectangle((c - 0.025, 0.23), 0.05, 0.08,
                                facecolor=phase_cmap(phase), edgecolor=INK,
                                linewidth=1.6))
        arrow(ax1, (c, 0.89), (c, 0.70), color=ACC2, mutation=8)
        arrow(ax1, (c, 0.31), (c + 0.24, 0.78), color=GREEN, mutation=8)
    ax1.plot([0.08, 0.92], [0.21, 0.21], color=INK, linewidth=1.8)
    ax1.text(0.12, 0.65, "input", color=ACC, fontsize=9.5)
    ax1.text(0.73, 0.84, r"$\theta$", color=GREEN, fontsize=12)
    ax1.text(0.50, 0.08, r"$\sin\theta=(\lambda/2\pi)\,d\varphi/dx$",
             ha="center", va="center", fontsize=11.5, color=INK, weight="bold")
    ax1.text(0.50, 0.42, "local phase ramp", ha="center", va="center",
             fontsize=9.5, color=INK)
    fig.suptitle("A metasurface writes an optical phase profile on a flat plane",
                 color=INK, fontsize=13.5, weight="bold")
    save(fig, "pho-18-metasurface.svg")


def quantum_optics():
    fig = plt.figure(figsize=(8.8, 5.25), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.0, 1.1), left=0.06,
                          right=0.97, bottom=0.12, top=0.86, wspace=0.28)
    ax0 = data_axes(fig.add_subplot(gs[0]))
    n = np.logspace(0, 4, 300)
    sql = 0.65 / np.sqrt(n)
    heis = 0.65 / n
    floor = np.full_like(n, 0.018)
    ax0.loglog(n, sql, color=ACC, linewidth=2.8, label="SQL  $N^{-1/2}$")
    ax0.loglog(n, heis, color=GREEN, linewidth=2.8, label="Heisenberg  $N^{-1}$")
    ax0.loglog(n, floor, color=RED, linewidth=1.9, linestyle="--",
               label="loss floor")
    ax0.text(12, 0.34, "classical", color=ACC, fontsize=9.5)
    ax0.text(90, 0.0045, "ideal entanglement", color=GREEN, fontsize=9.5)
    ax0.text(500, 0.022, "loss", color=RED, fontsize=9.5)
    ax0.set_xlim(1, 1e4)
    ax0.set_ylim(5e-5, 1.0)
    ax0.set_xlabel("resource count  N")
    ax0.set_ylabel(r"phase uncertainty  $\Delta\varphi$")
    ax0.set_title("measurement scaling", color=INK, fontsize=11.5)
    ax0.legend(frameon=False, fontsize=8.8, loc="upper right")

    ax1 = schematic(fig.add_subplot(gs[1]))
    ax1.text(0.50, 0.98, "optical quantum resources", ha="center", va="top",
             fontsize=11.5, color=INK, weight="bold")
    box(ax1, 0.38, 0.73, 0.24, 0.13, "source", face=PALE_PURPLE,
        fontsize=10)
    states = [("single photon", 0.77, PALE), ("squeezed state", 0.50, PALE_GREEN),
              ("entangled pair", 0.23, PALE_RED)]
    for label, y, face in states:
        box(ax1, 0.04, y, 0.25, 0.12, label, face=face, fontsize=8.8)
        arrow(ax1, (0.38, 0.795), (0.29, y + 0.06), color=ACC, mutation=9)
    box(ax1, 0.42, 0.40, 0.23, 0.13, "interferometer", face=PALE_PURPLE,
        fontsize=9.5)
    arrow(ax1, (0.50, 0.73), (0.535, 0.53), color=ACC, mutation=10)
    box(ax1, 0.72, 0.40, 0.23, 0.13, "detector", face=PALE_GREEN, edge=GREEN,
        fontsize=9.5)
    arrow(ax1, (0.65, 0.465), (0.72, 0.465), color=GREEN, mutation=10)
    ax1.text(0.50, 0.18, "QKD  |  sensing  |  sampling", ha="center", va="center",
             fontsize=9.6, color=INK)
    ax1.text(0.50, 0.08, "loss turns ideal gain into an engineering problem",
             ha="center", va="center", fontsize=8.8, color=RED)
    fig.suptitle("Quantum optics offers new resources, but loss remains decisive",
                 color=INK, fontsize=13.5, weight="bold")
    save(fig, "pho-19-quantum-optics.svg")


def industry_chain():
    fig = plt.figure(figsize=(8.9, 5.25), facecolor=WHITE)
    gs = fig.add_gridspec(1, 2, width_ratios=(1.0, 1.08), left=0.055,
                          right=0.97, bottom=0.11, top=0.86, wspace=0.30)
    ax0 = schematic(fig.add_subplot(gs[0]))
    ax0.text(0.50, 0.98, "value chain", ha="center", va="top", fontsize=12,
             color=INK, weight="bold")
    levels = [
        ("MATERIALS / WAFERS", 0.26, 0.28, PALE_RED),
        ("COMPONENTS", 0.20, 0.40, PALE_PURPLE),
        ("MODULES", 0.14, 0.53, PALE_GREEN),
        ("SYSTEMS / EQUIPMENT", 0.08, 0.66, PALE),
        ("APPLICATIONS", 0.03, 0.79, "#eee8d5"),
    ]
    for i, (label, left, y, face) in enumerate(levels):
        right = 1 - left
        next_left = levels[i + 1][1] if i < len(levels) - 1 else left
        poly = Polygon([[left, y], [right, y], [1 - next_left, y + 0.10],
                        [next_left, y + 0.10]], closed=True, facecolor=face,
                       edgecolor=INK, linewidth=1.7)
        ax0.add_patch(poly)
        ax0.text(0.50, y + 0.05, label, ha="center", va="center", fontsize=8.7,
                 color=INK, weight="bold")
    arrow(ax0, (0.09, 0.83), (0.09, 0.23), color=RED, mutation=10,
          style="-|>")
    ax0.text(0.03, 0.53, "barrier /\nconcentration", ha="left", va="center",
             fontsize=8.7, color=RED)
    arrow(ax0, (0.91, 0.23), (0.91, 0.83), color=GREEN, mutation=10)
    ax0.text(0.96, 0.53, "market\nbreadth", ha="right", va="center",
             fontsize=8.7, color=GREEN)

    ax1 = schematic(fig.add_subplot(gs[1]))
    ax1.text(0.50, 0.98, "career entry points", ha="center", va="top",
             fontsize=12, color=INK, weight="bold")
    rows = [
        ("BSc", "test  |  assembly  |  support", 0.72, PALE),
        ("MSc", "design  |  R&D  |  systems", 0.48, PALE_PURPLE),
        ("PhD", "frontier  |  research  |  core equipment", 0.24, PALE_RED),
    ]
    for degree, path, y, face in rows:
        box(ax1, 0.05, y, 0.18, 0.13, degree, face=face, fontsize=10.5)
        box(ax1, 0.32, y, 0.62, 0.13, path, face=WHITE, edge=INK,
            fontsize=8.9)
        arrow(ax1, (0.23, y + 0.065), (0.32, y + 0.065), color=ACC, mutation=9)
    ax1.text(0.50, 0.08, "optics + algorithm + electronics + mechanics",
             ha="center", va="center", fontsize=9.3, color=INK)
    fig.suptitle("Optics industry: a deep value chain and widening skill boundary",
                 color=INK, fontsize=13.5, weight="bold")
    save(fig, "pho-20-industry-chain.svg")


def course_map():
    fig = plt.figure(figsize=(9.1, 5.65), facecolor=WHITE)
    ax = schematic(fig.add_subplot(111))
    ax.text(0.50, 0.985, "photo course map: physics -> devices -> systems -> judgment",
            ha="center", va="top", fontsize=13.2, color=INK, weight="bold")
    rows = [
        ("FOUNDATIONS", 0.78,
         [("01 Rays", 0.11), ("02 Aberration", 0.27), ("03 Interference", 0.43),
          ("04 Fourier", 0.59), ("05 Polarization", 0.75)], ACC),
        ("SOURCES / DETECTION", 0.54,
         [("06 Laser", 0.87), ("07 Gaussian", 0.72), ("08 LED/LD", 0.57),
          ("09 Detector", 0.42), ("10 Sensor", 0.27), ("11 MTF", 0.12)], GREEN),
        ("OPTICAL SYSTEMS", 0.30,
         [("12 Fiber", 0.12), ("13 Comm", 0.27), ("14 EDFA/Kerr", 0.42),
          ("15 SiPh", 0.57), ("16 Display", 0.72), ("17 LiDAR", 0.87)], RED),
        ("FRONTIER / SYNTHESIS", 0.07,
         [("18 Meta", 0.78), ("19 Quantum", 0.58), ("20 Industry", 0.38),
          ("21 Synthesis", 0.18)], GOLD),
    ]
    node_w = 0.125
    node_h = 0.105
    for label, y, nodes, color in rows:
        ax.text(0.012, y + 0.052, label, ha="left", va="center", fontsize=8.4,
                color=color, weight="bold")
        for i, (node_label, x) in enumerate(nodes):
            box(ax, x - node_w / 2, y, node_w, node_h, node_label,
                face=WHITE, edge=color, fontsize=7.8, radius=0.018, lw=1.7)
            if i < len(nodes) - 1:
                next_x = nodes[i + 1][1]
                arrow(ax, (x + node_w / 2 + 0.008, y + node_h / 2),
                      (next_x - node_w / 2 - 0.008, y + node_h / 2),
                      color=color, mutation=8)
    # Vertical hand-offs make the serpentine reading order explicit.
    arrow(ax, (0.87, 0.735), (0.87, 0.645), color=ACC, mutation=9)
    arrow(ax, (0.12, 0.495), (0.12, 0.405), color=GREEN, mutation=9)
    arrow(ax, (0.87, 0.255), (0.87, 0.175), color=RED, mutation=9)
    ax.text(0.50, 0.905, "follow the arrows", ha="center", va="center",
            fontsize=9.5, color=INK)
    ax.text(0.50, 0.01, "aperture  |  photons  |  bandwidth  |  manufacturability",
            ha="center", va="bottom", fontsize=9.5, color=INK)
    save(fig, "pho-21-course-map.svg")


def main():
    fiber_modes()
    link_budget()
    amplifier_nonlinear()
    silicon_photonics()
    display()
    lidar()
    metasurface()
    quantum_optics()
    industry_chain()
    course_map()


if __name__ == "__main__":
    main()
