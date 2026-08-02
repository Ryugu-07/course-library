"""[diagram] 结构示意图 for lectures 17, 18 and 22.

All labels in the SVGs are English or mathematical symbols.  Matplotlib is
configured to convert text to vector paths so the figures have no font
dependency in the course site.

Run from ``materials-course`` with the repository's RTK command, for example::

    rtk proxy ~/ai-course/.venv/bin/python figs/materials_diagrams_17_22.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import (
    Circle,
    Ellipse,
    FancyArrowPatch,
    FancyBboxPatch,
    Polygon,
    Rectangle,
)


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "images"

ACC = "#147d6f"
ACC2 = "#7cc6b9"
INK = "#203b39"
MUTED = "#60716f"
GRID = "#c9d9d5"
RED = "#b3452f"
RED_SOFT = "#f2d8d1"
FILL = "#eaf5f2"
FILL_2 = "#f6fbfa"
METAL = "#dce9e6"
LW = 1.8
LW_BOLD = 2.4


matplotlib.rcParams.update(
    {
        "svg.fonttype": "path",
        "font.family": "DejaVu Sans",
        "font.size": 11,
        "axes.linewidth": LW,
        "lines.linewidth": LW,
        "lines.markeredgewidth": LW,
        "patch.linewidth": LW,
        "xtick.major.width": LW,
        "ytick.major.width": LW,
        "xtick.minor.width": LW,
        "ytick.minor.width": LW,
        "grid.linewidth": LW,
    }
)


def save(fig, name):
    """Save one white-background SVG and close the figure."""

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    out = IMAGE_DIR / f"{name}.svg"
    fig.savefig(
        out,
        format="svg",
        bbox_inches="tight",
        pad_inches=0.08,
        facecolor="white",
        edgecolor="none",
    )
    plt.close(fig)
    print(f"✓ {out.relative_to(ROOT)}")


def arrow(ax, start, end, color=ACC, lw=LW_BOLD, mutation_scale=14, **kwargs):
    patch = FancyArrowPatch(
        start,
        end,
        arrowstyle="-|>",
        mutation_scale=mutation_scale,
        linewidth=lw,
        color=color,
        **kwargs,
    )
    ax.add_patch(patch)
    return patch


def box(ax, x, y, w, h, face=FILL_2, edge=ACC, radius=0.08, alpha=1.0):
    patch = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle=f"round,pad=0.02,rounding_size={radius}",
        facecolor=face,
        edgecolor=edge,
        linewidth=LW,
        alpha=alpha,
    )
    ax.add_patch(patch)
    return patch


def fig_scale_map():
    """Map common characterization techniques onto scale and information."""

    fig, ax = plt.subplots(figsize=(9.6, 5.25))
    ax.set_xscale("log")
    ax.set_xlim(0.04, 3e6)
    ax.set_ylim(-0.16, 3.72)
    ax.set_yticks([2.7, 1.7, 0.7])
    ax.set_yticklabels(
        ["MORPHOLOGY", "STRUCTURE", "COMPOSITION / STATE"],
        fontsize=10.5,
        fontweight="bold",
        color=INK,
    )
    ax.set_xticks([0.1, 1, 100, 1e3, 1e5, 1e6])
    ax.set_xticklabels(
        [r"$0.1$ nm", r"$1$ nm", r"$100$ nm", r"$1\,\mu$m", r"$100\,\mu$m", r"$1$ mm"],
        fontsize=9.5,
        color=INK,
    )
    ax.tick_params(axis="both", which="major", width=LW, length=6, colors=INK, pad=7)
    ax.grid(axis="x", color=GRID, linewidth=LW, alpha=0.85)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_linewidth(LW)
        spine.set_color(INK)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.set_xlabel("characteristic scale / sampling depth", fontsize=11.5, labelpad=11, color=INK)
    ax.set_ylabel("information type", fontsize=10.5, labelpad=14, color=INK)

    # Soft bands keep the three information types distinct on a narrow screen.
    ax.axhspan(2.22, 3.18, facecolor=FILL_2, edgecolor="none", zorder=-2)
    ax.axhspan(1.22, 2.18, facecolor=FILL, edgecolor="none", zorder=-2)
    ax.axhspan(0.22, 1.18, facecolor=FILL_2, edgecolor="none", zorder=-2)

    ax.set_title(
        "CHARACTERIZATION TECHNIQUES: SCALE MAP",
        loc="left",
        fontsize=14,
        fontweight="bold",
        color=ACC,
        pad=24,
    )
    ax.text(
        0.04,
        3.52,
        "resolution is not the same as representativeness",
        fontsize=9.5,
        color=MUTED,
        ha="left",
        va="center",
    )
    ax.text(0.045, 3.27, "atomic detail", fontsize=9.2, color=MUTED, ha="left")
    ax.text(2.8e6, 3.27, "bulk average", fontsize=9.2, color=MUTED, ha="right")

    def technique(x, y, label, color=ACC, width=0.55, text_color=INK, fontsize=9.4):
        x1 = x / (10 ** (width / 2))
        x2 = x * (10 ** (width / 2))
        ax.add_patch(
            Rectangle(
                (x1, y - 0.22),
                x2 - x1,
                0.44,
                facecolor=color,
                edgecolor=color,
                linewidth=LW,
                alpha=0.92,
                zorder=3,
            )
        )
        ax.text(
            x,
            y,
            label,
            ha="center",
            va="center",
            fontsize=fontsize,
            color="white" if color == ACC else text_color,
            fontweight="bold",
            linespacing=1.05,
            zorder=4,
        )

    # The x positions are characteristic feature sizes or sampling depths;
    # broad-sampling methods are explicitly tagged as bulk.
    technique(0.16, 2.70, "TEM / STEM", color=ACC, width=0.72, fontsize=8.8)
    technique(8, 2.70, "AFM / STM", color=ACC2, width=0.62, fontsize=8.8)
    technique(1.8e3, 2.70, "SEM", color=ACC2, width=0.55)
    technique(1.8e5, 2.70, "OM", color=ACC, width=0.55)

    technique(0.20, 1.70, "e− diffraction", color=ACC2, width=0.74, fontsize=8.6)
    technique(3.2, 1.70, "LEED", color=ACC, width=0.52)
    technique(1.5e3, 1.70, "EBSD", color=ACC2, width=0.54)
    technique(1.5e5, 1.70, "XRD\n(bulk)", color=ACC, width=0.70, fontsize=8.8)

    technique(0.42, 0.70, "APT", color=ACC, width=0.47)
    technique(6, 0.70, "XPS\n~5 nm", color=ACC2, width=0.60, fontsize=8.7)
    technique(22, 0.70, "SIMS", color=ACC, width=0.54)
    technique(1.8e3, 0.70, "EDS / WDS", color=ACC2, width=0.72, fontsize=8.8)
    technique(2.2e5, 0.70, "XRF", color=ACC, width=0.55)

    fig.subplots_adjust(left=0.17, right=0.985, top=0.80, bottom=0.18)
    save(fig, "mat-17-scale-map")


def fig_corrosion_cell():
    """Draw the four-link electrochemical corrosion cell."""

    fig, ax = plt.subplots(figsize=(9.25, 5.35))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.35)
    ax.axis("off")

    ax.text(0.35, 6.04, "CORROSION CELL", fontsize=14, fontweight="bold", color=ACC, ha="left")
    ax.text(
        0.35,
        5.70,
        "four links; break one to control corrosion",
        fontsize=10,
        color=MUTED,
        ha="left",
    )

    # The electrolyte is the central ion-conduction region.
    box(ax, 0.70, 1.65, 8.60, 2.78, face=FILL, edge=ACC, radius=0.12)
    ax.text(5.00, 4.15, "ELECTROLYTE", fontsize=11, fontweight="bold", color=ACC, ha="center")
    ax.text(5.00, 3.82, r"H$_2$O + ions", fontsize=10, color=MUTED, ha="center")

    # Two dissimilar electrochemical roles are connected by the metal path.
    ax.add_patch(Rectangle((2.00, 0.83), 1.25, 2.42, facecolor=RED_SOFT, edgecolor=RED, linewidth=LW_BOLD))
    ax.add_patch(Rectangle((6.75, 0.83), 1.25, 2.42, facecolor=FILL_2, edgecolor=ACC, linewidth=LW_BOLD))
    ax.text(2.62, 5.08, "ANODE", fontsize=11.5, fontweight="bold", color=RED, ha="center")
    ax.text(2.62, 4.73, r"Fe $\rightarrow$ Fe$^{2+}$ + 2e$^-$", fontsize=9.8, color=INK, ha="center")
    ax.text(7.38, 5.08, "CATHODE", fontsize=11.5, fontweight="bold", color=ACC, ha="center")
    ax.text(7.38, 4.73, r"O$_2$ + 2H$_2$O + 4e$^-$ $\rightarrow$ 4OH$^-$", fontsize=8.8, color=INK, ha="center")

    # Dissolution, reduction products, and ionic transport in solution.
    arrow(ax, (2.62, 3.08), (2.62, 3.70), color=RED, lw=LW, mutation_scale=12)
    ax.text(2.98, 3.42, r"Fe$^{2+}$", fontsize=9.7, color=RED, ha="left", va="center")
    arrow(ax, (7.38, 3.08), (7.38, 3.70), color=ACC, lw=LW, mutation_scale=12)
    ax.text(7.04, 3.42, r"OH$^-$", fontsize=9.7, color=ACC, ha="right", va="center")
    arrow(ax, (3.35, 2.35), (6.42, 2.35), color=ACC2, lw=LW, mutation_scale=12, linestyle="--")
    ax.text(5.00, 2.62, "ion transport", fontsize=9.4, color=MUTED, ha="center")

    # External electronic path: electrons leave the anode and enter the cathode.
    ax.add_patch(Rectangle((2.65, 0.52), 4.70, 0.34, facecolor=METAL, edgecolor=INK, linewidth=LW_BOLD))
    arrow(ax, (3.30, 0.69), (6.70, 0.69), color=INK, lw=LW_BOLD, mutation_scale=13)
    ax.text(5.00, 0.22, r"electron path: e$^-$", fontsize=10, color=INK, ha="center")

    # Small numbered markers make the four required links explicit.
    for x, y, number, color in [
        (1.18, 3.95, "1", RED),
        (8.82, 3.95, "2", ACC),
        (1.18, 2.05, "3", ACC),
        (8.82, 0.69, "4", INK),
    ]:
        ax.add_patch(Circle((x, y), 0.18, facecolor=color, edgecolor=color, linewidth=LW))
        ax.text(x, y - 0.01, number, color="white", fontsize=9.5, fontweight="bold", ha="center", va="center")

    box(ax, 3.05, 5.88, 3.90, 0.30, face=ACC, edge=ACC, radius=0.08)
    ax.text(5.00, 6.02, "BREAK ANY LINK  $\u2192$  PROTECTION", fontsize=9.7, color="white", fontweight="bold", ha="center", va="center")
    save(fig, "mat-18-corrosion-cell")


def _metal_bar(ax, x, y, w=0.76, h=0.18, face=METAL, edge=INK):
    ax.add_patch(Rectangle((x - w / 2, y), w, h, facecolor=face, edgecolor=edge, linewidth=LW))


def _damage_dot(ax, x, y, radius=0.035, color=RED):
    ax.add_patch(Circle((x, y), radius, facecolor=color, edgecolor=color, linewidth=LW))


def _form_uniform(ax, cx, cy):
    _metal_bar(ax, cx, cy - 0.10)
    ax.add_patch(Rectangle((cx - 0.38, cy + 0.08), 0.76, 0.05, facecolor=RED_SOFT, edgecolor=RED, linewidth=LW))
    for dx in (-0.28, -0.12, 0.05, 0.24):
        _damage_dot(ax, cx + dx, cy + 0.14, radius=0.025)


def _form_galvanic(ax, cx, cy):
    ax.add_patch(Rectangle((cx - 0.34, cy - 0.02), 0.18, 0.22, facecolor=RED_SOFT, edgecolor=RED, linewidth=LW))
    ax.add_patch(Rectangle((cx - 0.08, cy - 0.02), 0.42, 0.22, facecolor=FILL, edgecolor=ACC, linewidth=LW))
    ax.add_patch(Rectangle((cx - 0.36, cy - 0.12), 0.74, 0.08, facecolor="#e6f2ef", edgecolor=ACC2, linewidth=LW))
    ax.plot([cx - 0.25, cx + 0.22], [cy + 0.35, cy + 0.35], color=INK, linewidth=LW_BOLD)
    arrow(ax, (cx - 0.20, cy + 0.35), (cx + 0.16, cy + 0.35), color=INK, lw=LW, mutation_scale=9)
    ax.text(cx - 0.25, cy + 0.08, "A", fontsize=8.3, color=RED, ha="center", va="center", fontweight="bold")
    ax.text(cx + 0.13, cy + 0.08, "C", fontsize=8.3, color=ACC, ha="center", va="center", fontweight="bold")


def _form_pitting(ax, cx, cy):
    _metal_bar(ax, cx, cy - 0.10)
    ax.add_patch(Polygon([[cx - 0.24, cy + 0.08], [cx - 0.14, cy + 0.08], [cx - 0.18, cy - 0.10]], facecolor=RED, edgecolor=RED, linewidth=LW))
    ax.add_patch(Polygon([[cx + 0.04, cy + 0.08], [cx + 0.14, cy + 0.08], [cx + 0.08, cy - 0.04]], facecolor=RED, edgecolor=RED, linewidth=LW))
    ax.add_patch(Polygon([[cx + 0.22, cy + 0.08], [cx + 0.29, cy + 0.08], [cx + 0.25, cy - 0.14]], facecolor=RED, edgecolor=RED, linewidth=LW))


def _form_crevice(ax, cx, cy):
    _metal_bar(ax, cx, cy - 0.14, w=0.78, h=0.16)
    ax.add_patch(Rectangle((cx - 0.39, cy + 0.07), 0.78, 0.16, facecolor=METAL, edgecolor=INK, linewidth=LW))
    ax.plot([cx - 0.30, cx - 0.30], [cy + 0.07, cy + 0.01], color=RED, linewidth=LW_BOLD)
    ax.plot([cx - 0.30, cx + 0.24], [cy + 0.01, cy + 0.01], color=RED, linewidth=LW_BOLD)
    ax.text(cx + 0.25, cy - 0.02, "O$_2$ low", fontsize=7.7, color=RED, ha="left", va="center")


def _form_intergranular(ax, cx, cy):
    ax.add_patch(Rectangle((cx - 0.38, cy - 0.10), 0.76, 0.42, facecolor=METAL, edgecolor=INK, linewidth=LW))
    for xoff in (-0.22, -0.02, 0.18):
        ax.plot([cx + xoff, cx + xoff + 0.07], [cy - 0.10, cy + 0.32], color=RED, linewidth=LW_BOLD)
    ax.plot([cx - 0.38, cx + 0.38], [cy + 0.11, cy + 0.11], color=RED, linewidth=LW_BOLD)
    ax.plot([cx - 0.28, cx + 0.32], [cy + 0.32, cy - 0.10], color=RED, linewidth=LW_BOLD)


def _form_selective(ax, cx, cy):
    _metal_bar(ax, cx, cy - 0.10, w=0.78, h=0.42, face=METAL)
    for dx, dy in [(-0.26, 0.12), (-0.10, 0.22), (0.07, 0.09), (0.24, 0.20), (0.18, 0.00)]:
        _damage_dot(ax, cx + dx, cy + dy, radius=0.045, color=RED)
    ax.plot([cx - 0.20, cx + 0.27], [cy + 0.03, cy + 0.28], color=RED, linewidth=LW)


def _form_erosion(ax, cx, cy):
    _metal_bar(ax, cx, cy - 0.13, w=0.78, h=0.16)
    ax.plot([cx - 0.36, cx + 0.36], [cy + 0.03, cy + 0.03], color=RED, linewidth=LW_BOLD)
    for yoff in (0.16, 0.28, 0.40):
        arrow(ax, (cx - 0.34, cy + yoff), (cx + 0.25, cy + yoff), color=ACC, lw=LW, mutation_scale=9)
    for dx, dy, r in [(-0.16, 0.30, 0.055), (0.02, 0.42, 0.045), (0.19, 0.28, 0.035)]:
        ax.add_patch(Circle((cx + dx, cy + dy), r, facecolor=FILL, edgecolor=ACC2, linewidth=LW))


def _form_scc(ax, cx, cy):
    ax.add_patch(Rectangle((cx - 0.38, cy - 0.10), 0.76, 0.42, facecolor=METAL, edgecolor=INK, linewidth=LW))
    crack = [
        (cx - 0.02, cy + 0.33),
        (cx - 0.08, cy + 0.22),
        (cx - 0.01, cy + 0.14),
        (cx - 0.10, cy + 0.03),
        (cx - 0.03, cy - 0.10),
    ]
    xs, ys = zip(*crack)
    ax.plot(xs, ys, color=RED, linewidth=LW_BOLD)
    arrow(ax, (cx - 0.60, cy + 0.11), (cx - 0.41, cy + 0.11), color=INK, lw=LW, mutation_scale=9)
    arrow(ax, (cx + 0.60, cy + 0.11), (cx + 0.41, cy + 0.11), color=INK, lw=LW, mutation_scale=9)
    ax.text(cx, cy + 0.48, "$\u03c3$", fontsize=9, color=INK, ha="center")


def fig_corrosion_forms():
    """Show eight common corrosion morphologies as compact schematics."""

    fig, ax = plt.subplots(figsize=(9.6, 6.05))
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 2.56)
    ax.axis("off")
    ax.text(0.05, 2.40, "EIGHT CORROSION FORMS", fontsize=14, fontweight="bold", color=ACC, ha="left")
    ax.text(
        0.05,
        2.15,
        "local attack can hide a small total mass loss",
        fontsize=10,
        color=MUTED,
        ha="left",
    )

    forms = [
        ("uniform", _form_uniform),
        ("galvanic", _form_galvanic),
        ("pitting", _form_pitting),
        ("crevice", _form_crevice),
        ("intergranular", _form_intergranular),
        ("selective", _form_selective),
        ("erosion / cavitation", _form_erosion),
        ("SCC", _form_scc),
    ]
    card_w = 0.93
    card_h = 0.93
    x_gap = 0.07
    y_bottom = 0.06
    y_top = 1.08
    for index, (label, drawer) in enumerate(forms):
        row, col = divmod(index, 4)
        x = col + x_gap / 2
        y = y_top if row == 0 else y_bottom
        box(ax, x, y, card_w, card_h, face=FILL_2 if row == 0 else FILL, edge=GRID, radius=0.06)
        drawer(ax, x + card_w / 2, y + 0.48)
        ax.text(
            x + card_w / 2,
            y + 0.13,
            label,
            fontsize=8.8 if len(label) < 15 else 7.9,
            color=INK,
            ha="center",
            va="center",
            fontweight="bold",
        )
    fig.subplots_adjust(left=0.02, right=0.98, top=0.94, bottom=0.04)
    save(fig, "mat-18-corrosion-forms")


def fig_selection_flow():
    """Draw Ashby's translate-screen-rank-implement workflow."""

    fig, ax = plt.subplots(figsize=(8.1, 6.65))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.35)
    ax.axis("off")

    ax.text(0.55, 7.02, "MATERIAL SELECTION LOOP", fontsize=14, fontweight="bold", color=ACC, ha="left")
    ax.text(0.55, 6.70, "from an engineering need to a defensible choice", fontsize=10, color=MUTED, ha="left")

    steps = [
        ("1", "TRANSLATE", "function · constraints · objective · variables", "requirements"),
        ("2", "SCREEN", "remove materials that violate the constraints", "property chart"),
        ("3", "RANK", "maximize the material index for the objective", "index"),
        ("4", "IMPLEMENT", "process · supply · cost · standards · reuse", "evidence"),
    ]
    ys = [5.55, 4.18, 2.81, 1.44]
    for i, ((number, title, detail, tag), y) in enumerate(zip(steps, ys)):
        face = FILL_2 if i % 2 == 0 else FILL
        box(ax, 0.70, y, 8.60, 0.88, face=face, edge=ACC, radius=0.11)
        ax.add_patch(Circle((1.22, y + 0.44), 0.25, facecolor=ACC, edgecolor=ACC, linewidth=LW))
        ax.text(1.22, y + 0.43, number, fontsize=10.5, fontweight="bold", color="white", ha="center", va="center")
        ax.text(1.72, y + 0.58, title, fontsize=11.2, fontweight="bold", color=INK, ha="left", va="center")
        ax.text(1.72, y + 0.30, detail, fontsize=9.3, color=MUTED, ha="left", va="center")
        tag_w = 1.26 if tag != "property chart" else 1.55
        box(ax, 7.45 - (tag_w - 1.26), y + 0.26, tag_w, 0.35, face="white", edge=ACC2, radius=0.07)
        ax.text(7.45 - (tag_w - 1.26) + tag_w / 2, y + 0.435, tag, fontsize=8.0, color=ACC, ha="center", va="center")
        if i < len(ys) - 1:
            arrow(ax, (5.00, y - 0.05), (5.00, ys[i + 1] + 0.93), color=ACC, lw=LW_BOLD, mutation_scale=14)

    box(ax, 1.45, 0.30, 7.10, 0.50, face=ACC, edge=ACC, radius=0.10)
    ax.text(
        5.00,
        0.55,
        "BEST FIT = PERFORMANCE × COST × PROCESS × CONTEXT",
        fontsize=9.4,
        fontweight="bold",
        color="white",
        ha="center",
        va="center",
    )
    save(fig, "mat-22-selection-flow")


def main():
    fig_scale_map()
    fig_corrosion_cell()
    fig_corrosion_forms()
    fig_selection_flow()
    print("all diagram figures done")


if __name__ == "__main__":
    main()
