#!/usr/bin/env python3
"""Generate the five structural diagrams used by the Wang Xiaobo course.

The figures are intentionally label-light: the SVGs carry short English
labels, while the Chinese captions in the lectures carry the interpretation.
Matplotlib renders all labels as paths so the diagrams do not depend on the
reader's installed fonts.

Run from this directory or any other working directory with::

    python wxb-course/figs/wxb_diagrams.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"


# The palette follows the course site's warm paper-and-ink theme while keeping
# the diagram strokes and fills sufficiently distinct in print and on screens.
INK = "#2c2a26"
MUTED = "#6b6557"
ACCENT = "#9d5c3f"
ACCENT_SOFT = "#c47f7f"
TEAL = "#4f7770"
TEAL_LIGHT = "#dcebe7"
BLUE = "#4f6b7a"
BLUE_LIGHT = "#e3ebef"
GOLD = "#b5812d"
GOLD_LIGHT = "#f5e8c8"
PAPER = "#f5f0e3"
PAPER_LIGHT = "#fbfaf7"
LINE = "#cfc4ad"
WHITE = "#ffffff"


plt.rcParams.update(
    {
        "svg.fonttype": "path",
        "svg.hashsalt": "wxb-course-diagrams",
        "font.family": "DejaVu Sans",
        "font.size": 14,
        "axes.linewidth": 1.7,
        "axes.edgecolor": INK,
        "patch.linewidth": 1.7,
        "text.color": INK,
        "figure.dpi": 110,
    }
)


def canvas(width=10.0, height=5.2):
    """Return a clean, normalized drawing canvas."""

    fig, ax = plt.subplots(figsize=(width, height), facecolor=WHITE)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    return fig, ax


def save(fig, name):
    """Save one responsive SVG with deterministic metadata and close it."""

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.svg"
    fig.savefig(
        path,
        format="svg",
        bbox_inches="tight",
        pad_inches=0.14,
        facecolor=WHITE,
        metadata={"Date": None, "Creator": "wxb-course/figs/wxb_diagrams.py"},
    )
    plt.close(fig)
    print(f"saved {path.relative_to(ROOT)}")


def rounded_box(
    ax,
    x,
    y,
    width,
    height,
    label,
    *,
    face=PAPER_LIGHT,
    edge=LINE,
    text_color=INK,
    size=14,
    weight="bold",
    radius=0.035,
    lw=1.7,
    zorder=3,
):
    """Draw a centered rounded box in normalized axes coordinates."""

    patch = FancyBboxPatch(
        (x - width / 2, y - height / 2),
        width,
        height,
        boxstyle=f"round,pad=0.012,rounding_size={radius}",
        facecolor=face,
        edgecolor=edge,
        linewidth=lw,
        transform=ax.transData,
        zorder=zorder,
    )
    ax.add_patch(patch)
    ax.text(
        x,
        y,
        label,
        ha="center",
        va="center",
        color=text_color,
        fontsize=size,
        fontweight=weight,
        linespacing=1.05,
        zorder=zorder + 1,
    )
    return patch


def circle_node(
    ax,
    x,
    y,
    label,
    *,
    radius=0.042,
    face=ACCENT,
    edge=ACCENT,
    text_color=WHITE,
    size=13,
    weight="bold",
    zorder=4,
):
    """Draw a circular node with a short label."""

    ax.add_patch(
        Circle(
            (x, y),
            radius,
            facecolor=face,
            edgecolor=edge,
            linewidth=1.7,
            transform=ax.transData,
            zorder=zorder,
        )
    )
    ax.text(
        x,
        y,
        label,
        ha="center",
        va="center",
        color=text_color,
        fontsize=size,
        fontweight=weight,
        zorder=zorder + 1,
    )


def arrow(
    ax,
    start,
    end,
    *,
    color=ACCENT,
    lw=2.1,
    mutation_scale=14,
    style="-|>",
    linestyle="-",
    connectionstyle="arc3",
    zorder=2,
):
    """Draw an arrow in data coordinates."""

    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle=style,
            mutation_scale=mutation_scale,
            linewidth=lw,
            color=color,
            linestyle=linestyle,
            shrinkA=0,
            shrinkB=0,
            connectionstyle=connectionstyle,
            transform=ax.transData,
            zorder=zorder,
        )
    )


def section_label(ax, x, y, label, color=MUTED, size=11.5):
    ax.text(
        x,
        y,
        label,
        ha="center",
        va="center",
        color=color,
        fontsize=size,
        fontweight="bold",
        zorder=5,
    )


def fig_timeline():
    """Course sequence: from intellectual ground to a way of reading."""

    fig, ax = canvas(10.8, 4.55)
    ax.text(
        0.5,
        0.96,
        "COURSE TIMELINE",
        ha="center",
        va="center",
        fontsize=18,
        fontweight="bold",
        color=INK,
    )
    ax.text(
        0.5,
        0.885,
        "from spirit  →  novels  →  craft  →  re-reading",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )

    # Four quiet bands make the nine stops readable without turning the figure
    # into a second table of contents.
    groups = [
        (0.06, 0.245, "GROUNDING", ACCENT),
        (0.255, 0.545, "NOVELS", TEAL),
        (0.555, 0.755, "CRAFT", BLUE),
        (0.765, 0.90, "CLOSING", GOLD),
    ]
    for left, right, label, color in groups:
        ax.plot(
            [left, right],
            [0.73, 0.73],
            color=color,
            linewidth=4.2,
            solid_capstyle="round",
            alpha=0.72,
            zorder=1,
        )
        section_label(ax, (left + right) / 2, 0.80, label, color=color, size=11.5)

    x_positions = [0.10 + i * 0.10 for i in range(9)]
    labels = [
        "01\nMIND",
        "02\nDOUBT",
        "03\nBODY",
        "04\nENTROPY",
        "05\nREWRITE",
        "06\nIRONY",
        "07\nSENTENCE",
        "08\nLETTERS",
        "09\nPLACE",
    ]
    colors = [ACCENT, ACCENT, TEAL, TEAL, TEAL, BLUE, BLUE, GOLD, GOLD]

    ax.plot(
        [x_positions[0], x_positions[-1]],
        [0.47, 0.47],
        color=LINE,
        linewidth=3.2,
        solid_capstyle="round",
        zorder=1,
    )
    for i, (x, label, color) in enumerate(zip(x_positions, labels, colors)):
        ax.add_patch(
            Circle(
                (x, 0.47),
                0.032,
                facecolor=WHITE,
                edgecolor=color,
                linewidth=3.0,
                transform=ax.transData,
                zorder=3,
            )
        )
        ax.add_patch(
            Circle(
                (x, 0.47),
                0.013,
                facecolor=color,
                edgecolor=color,
                transform=ax.transData,
                zorder=4,
            )
        )
        label_y = 0.32 if i % 2 == 0 else 0.62
        ax.text(
            x,
            label_y,
            label,
            ha="center",
            va="center",
            fontsize=12.5,
            linespacing=1.0,
            fontweight="bold",
            color=INK,
            zorder=5,
        )

    ax.text(
        0.5,
        0.10,
        "A reader moves from the author's mind to the shape of a life.",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )
    save(fig, "wxb-00-timeline")


def fig_argument_map():
    """Argument structure for body, proof, and the official record."""

    fig, ax = canvas(10.2, 5.55)
    ax.text(
        0.5,
        0.96,
        "FROM PUBLIC CLAIM TO PRIVATE FACT",
        ha="center",
        va="center",
        fontsize=17.5,
        fontweight="bold",
    )
    ax.text(
        0.5,
        0.885,
        "a proof trap turns the body into evidence",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )

    section_label(ax, 0.16, 0.77, "PUBLIC VOICE", ACCENT)
    rounded_box(ax, 0.16, 0.66, 0.19, 0.115, "CROWD\nCLAIM", face=GOLD_LIGHT, edge=GOLD, size=13.5)
    rounded_box(ax, 0.42, 0.66, 0.20, 0.115, "NO NEGATIVE\nPROOF", face=PAPER, edge=ACCENT_SOFT, size=13.5)
    rounded_box(ax, 0.70, 0.66, 0.22, 0.115, "LABEL =\nREALITY", face="#f8e5e1", edge=ACCENT, size=13.5)
    arrow(ax, (0.255, 0.66), (0.315, 0.66), color=ACCENT)
    arrow(ax, (0.52, 0.66), (0.59, 0.66), color=ACCENT)

    section_label(ax, 0.16, 0.49, "THE MOVE", TEAL)
    rounded_box(ax, 0.29, 0.39, 0.21, 0.12, "BODY /\nEVENT", face=TEAL_LIGHT, edge=TEAL, size=14)
    rounded_box(ax, 0.65, 0.39, 0.24, 0.12, "UNDENIABLE\nFACT", face=TEAL_LIGHT, edge=TEAL, size=14)
    arrow(ax, (0.70, 0.60), (0.39, 0.46), color=TEAL, connectionstyle="arc3,rad=0.18")
    arrow(ax, (0.395, 0.39), (0.53, 0.39), color=TEAL)

    # The two records of an event deliberately do not collapse into one.
    section_label(ax, 0.18, 0.23, "TWO RECORDS", BLUE)
    rounded_box(ax, 0.35, 0.16, 0.22, 0.11, "LIVED\nFACT", face=BLUE_LIGHT, edge=BLUE, size=14)
    rounded_box(ax, 0.67, 0.16, 0.24, 0.11, "OFFICIAL\nRECORD", face=PAPER, edge=ACCENT_SOFT, size=14)
    arrow(ax, (0.29, 0.33), (0.35, 0.22), color=BLUE, connectionstyle="arc3,rad=0.10")
    arrow(ax, (0.70, 0.60), (0.67, 0.22), color=ACCENT_SOFT, linestyle="--", connectionstyle="arc3,rad=-0.08")
    ax.text(0.51, 0.16, "≠", ha="center", va="center", fontsize=24, fontweight="bold", color=ACCENT, zorder=6)

    rounded_box(ax, 0.35, 0.055, 0.22, 0.07, "PRIVATE TRUTH", face=ACCENT, edge=ACCENT, text_color=WHITE, size=12.5, radius=0.02)
    arrow(ax, (0.35, 0.105), (0.35, 0.10), color=ACCENT, mutation_scale=12)
    save(fig, "wxb-03-argument-map")


def fig_rewriting_map():
    """The rusting of freedom and the open loop of rewriting."""

    fig, ax = canvas(10.3, 5.55)
    ax.text(
        0.5,
        0.96,
        "THE REWRITING MACHINE",
        ha="center",
        va="center",
        fontsize=18,
        fontweight="bold",
    )
    ax.text(
        0.5,
        0.885,
        "freedom rusts when fixed; a story lives while it can change",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )

    # Upper path: the knight's freedom turns into the order that contains it.
    section_label(ax, 0.17, 0.76, "THE KNIGHT", ACCENT)
    rounded_box(ax, 0.17, 0.63, 0.19, 0.115, "FREEDOM", face=GOLD_LIGHT, edge=GOLD, size=14)
    rounded_box(ax, 0.46, 0.63, 0.19, 0.115, "ORDER", face=PAPER, edge=ACCENT_SOFT, size=14)
    rounded_box(ax, 0.75, 0.63, 0.19, 0.115, "RUST", face="#f8e5e1", edge=ACCENT, size=14)
    arrow(ax, (0.265, 0.63), (0.365, 0.63), color=ACCENT)
    arrow(ax, (0.555, 0.63), (0.655, 0.63), color=ACCENT)

    # Lower left: a fixed version closes the story.
    section_label(ax, 0.18, 0.43, "THE STORY", TEAL)
    rounded_box(ax, 0.18, 0.30, 0.20, 0.115, "DRAFT A", face=TEAL_LIGHT, edge=TEAL, size=14)
    rounded_box(ax, 0.48, 0.30, 0.22, 0.115, "FIXED\nVERSION", face=PAPER, edge=ACCENT_SOFT, size=13.5)
    rounded_box(ax, 0.79, 0.30, 0.17, 0.115, "DEAD", face="#f8e5e1", edge=ACCENT, size=14)
    arrow(ax, (0.28, 0.30), (0.37, 0.30), color=TEAL)
    arrow(ax, (0.59, 0.30), (0.705, 0.30), color=ACCENT, connectionstyle="arc3,rad=-0.02")

    # The rewriting loop is the visual centre of the figure.
    rounded_box(ax, 0.49, 0.095, 0.22, 0.11, "REWRITE", face=TEAL, edge=TEAL, text_color=WHITE, size=14)
    rounded_box(ax, 0.79, 0.12, 0.18, 0.11, "OPEN", face=GOLD_LIGHT, edge=GOLD, text_color=INK, size=14)
    arrow(ax, (0.28, 0.255), (0.42, 0.15), color=TEAL, connectionstyle="arc3,rad=0.16")
    arrow(ax, (0.60, 0.12), (0.70, 0.12), color=TEAL)
    arrow(ax, (0.79, 0.185), (0.61, 0.15), color=TEAL, style="-|>", connectionstyle="arc3,rad=0.28")
    ax.annotate(
        "",
        xy=(0.43, 0.25),
        xytext=(0.55, 0.25),
        arrowprops={
            "arrowstyle": "<->",
            "color": TEAL,
            "linewidth": 1.9,
            "connectionstyle": "arc3,rad=0.55",
        },
    )
    ax.text(0.49, 0.20, "A  ↔  B  ↔  C", ha="center", va="center", fontsize=11.5, color=TEAL)

    # The third novel adds search to the same anti-erasure movement.
    rounded_box(ax, 0.12, 0.12, 0.18, 0.11, "FORCED\nFORGETTING", face=PAPER, edge=BLUE, size=12.5)
    arrow(ax, (0.21, 0.12), (0.38, 0.12), color=BLUE)
    ax.text(0.11, 0.014, "SEARCH", ha="left", va="center", fontsize=11.5, color=BLUE, fontweight="bold")
    ax.text(0.77, 0.014, "POSSIBILITY", ha="center", va="center", fontsize=11.5, color=GOLD, fontweight="bold")
    save(fig, "wxb-05-rewriting-map")


def fig_sentence_structure():
    """Sentence construction: translation, logic, and audible rhythm."""

    fig, ax = canvas(10.4, 5.65)
    ax.text(
        0.5,
        0.96,
        "HOW A SENTENCE IS BUILT",
        ha="center",
        va="center",
        fontsize=18,
        fontweight="bold",
    )
    ax.text(
        0.5,
        0.885,
        "plain language  +  logical gait  +  audible rhythm",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )

    # Three sources enter one sentence-making process.
    rounded_box(ax, 0.15, 0.69, 0.20, 0.11, "TRANSLATION", face=GOLD_LIGHT, edge=GOLD, size=13.5)
    rounded_box(ax, 0.15, 0.49, 0.20, 0.11, "LOGIC", face=BLUE_LIGHT, edge=BLUE, size=13.5)
    rounded_box(ax, 0.15, 0.29, 0.20, 0.11, "EAR / RHYTHM", face=TEAL_LIGHT, edge=TEAL, size=13.5)
    rounded_box(ax, 0.43, 0.49, 0.20, 0.16, "CLEAR\nBASE", face=PAPER_LIGHT, edge=ACCENT, size=14)
    arrow(ax, (0.25, 0.69), (0.34, 0.55), color=GOLD, connectionstyle="arc3,rad=-0.16")
    arrow(ax, (0.25, 0.49), (0.33, 0.49), color=BLUE)
    arrow(ax, (0.25, 0.29), (0.34, 0.43), color=TEAL, connectionstyle="arc3,rad=0.16")

    # A sentence is shown as a sequence of moves, not as a quotation.
    section_label(ax, 0.75, 0.75, "SENTENCE WALK", ACCENT)
    blocks = [
        (0.57, "CLAIM", BLUE_LIGHT, BLUE, 0.095),
        (0.68, "BECAUSE", PAPER, LINE, 0.12),
        (0.80, "SO", PAPER, LINE, 0.07),
        (0.90, "TURN", GOLD_LIGHT, GOLD, 0.10),
    ]
    for x, label, face, edge, width in blocks:
        rounded_box(ax, x, 0.58, width, 0.105, label, face=face, edge=edge, size=12.5, radius=0.022)
    arrow(ax, (0.617, 0.58), (0.62, 0.58), color=INK, mutation_scale=11)
    arrow(ax, (0.74, 0.58), (0.76, 0.58), color=INK, mutation_scale=11)
    arrow(ax, (0.835, 0.58), (0.85, 0.58), color=INK, mutation_scale=11)

    # The lower line makes pauses and length visible without using a quotation.
    ax.plot([0.38, 0.93], [0.27, 0.27], color=LINE, linewidth=2.5, zorder=1)
    rhythm_points = [(0.40, 0.27), (0.54, 0.27), (0.60, 0.27), (0.75, 0.27), (0.83, 0.27), (0.93, 0.27)]
    for i, (x, y) in enumerate(rhythm_points):
        ax.add_patch(Circle((x, y), 0.018 if i not in (2, 4) else 0.027, facecolor=TEAL, edgecolor=TEAL, zorder=3))
    ax.plot([0.60, 0.60], [0.20, 0.34], color=TEAL, linewidth=2.0, zorder=2)
    ax.plot([0.83, 0.83], [0.20, 0.34], color=TEAL, linewidth=2.0, zorder=2)
    ax.text(0.39, 0.14, "SHORT", ha="center", va="center", fontsize=11.5, color=MUTED, fontweight="bold")
    ax.text(0.60, 0.14, "PAUSE", ha="center", va="center", fontsize=11.5, color=TEAL, fontweight="bold")
    ax.text(0.75, 0.14, "PUSH", ha="center", va="center", fontsize=11.5, color=MUTED, fontweight="bold")
    ax.text(0.83, 0.14, "PAUSE", ha="center", va="center", fontsize=11.5, color=TEAL, fontweight="bold")
    ax.text(0.93, 0.14, "TURN", ha="center", va="center", fontsize=11.5, color=GOLD, fontweight="bold")

    rounded_box(ax, 0.65, 0.04, 0.47, 0.065, "LISTENABLE SENTENCE", face=ACCENT, edge=ACCENT, text_color=WHITE, size=12.5, radius=0.018)
    save(fig, "wxb-07-sentence-structure")


def fig_influence_map():
    """Eight course threads converge on one stance and return to the reader."""

    fig, ax = canvas(10.6, 6.0)
    ax.text(
        0.5,
        0.96,
        "FROM NINE THREADS TO ONE STANCE",
        ha="center",
        va="center",
        fontsize=18,
        fontweight="bold",
    )
    ax.text(
        0.5,
        0.885,
        "the first eight chapters gather at the centre of the ninth",
        ha="center",
        va="center",
        fontsize=12.5,
        color=MUTED,
    )

    center_x, center_y = 0.43, 0.52
    center_w, center_h = 0.23, 0.22
    rounded_box(
        ax,
        center_x,
        center_y,
        center_w,
        center_h,
        "ONE STANCE\nFREE / CLEAR\nPLAYFUL / HONEST",
        face=ACCENT,
        edge=ACCENT,
        text_color=WHITE,
        size=13.5,
        radius=0.05,
        lw=2.2,
        zorder=4,
    )

    nodes = [
        (0.43, 0.78, "01 MIND", ACCENT, GOLD_LIGHT, GOLD),
        (0.70, 0.69, "02 DOUBT", BLUE, BLUE_LIGHT, BLUE),
        (0.63, 0.50, "03 BODY", TEAL, TEAL_LIGHT, TEAL),
        (0.67, 0.30, "04 ENTROPY", ACCENT, "#f8e5e1", ACCENT),
        (0.43, 0.19, "05 REWRITE", TEAL, TEAL_LIGHT, TEAL),
        (0.18, 0.30, "06 IRONY", ACCENT, "#f8e5e1", ACCENT),
        (0.14, 0.50, "07 SENTENCE", BLUE, BLUE_LIGHT, BLUE),
        (0.18, 0.69, "08 LETTERS", GOLD, GOLD_LIGHT, GOLD),
    ]
    for x, y, label, edge, face, _ in nodes:
        rounded_box(ax, x, y, 0.17, 0.095, label, face=face, edge=edge, size=12.5, radius=0.026, zorder=3)

    # The short spokes are intentionally routed around the central box; this
    # keeps every strand legible on a narrow mobile viewport.
    for x, y, _, edge, _, _ in nodes:
        dx, dy = center_x - x, center_y - y
        length = (dx * dx + dy * dy) ** 0.5
        start = (x + dx * 0.18 / length, y + dy * 0.10 / length)
        end = (center_x - dx * center_w / (2 * length), center_y - dy * center_h / (2 * length))
        arrow(ax, start, end, color=edge, lw=1.8, mutation_scale=12, zorder=2)

    rounded_box(
        ax,
        0.82,
        0.52,
        0.18,
        0.15,
        "09 PLACE\nRE-READ\nTODAY",
        face=GOLD_LIGHT,
        edge=GOLD,
        text_color=INK,
        size=13,
        radius=0.035,
        zorder=4,
    )
    arrow(ax, (center_x + center_w / 2, center_y), (0.72, 0.52), color=GOLD, lw=2.2, mutation_scale=14)
    ax.text(
        0.50,
        0.06,
        "a complete way of reading, not a single label",
        ha="center",
        va="center",
        fontsize=12,
        color=MUTED,
    )
    save(fig, "wxb-09-influence-map")


def main():
    fig_timeline()
    fig_argument_map()
    fig_rewriting_map()
    fig_sentence_structure()
    fig_influence_map()


if __name__ == "__main__":
    main()
