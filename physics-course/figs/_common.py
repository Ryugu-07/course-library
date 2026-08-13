import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

ACC   = "#a03d3d"   # 靛蓝主色
ACC2  = "#d18a8a"   # 浅靛蓝
INK   = "#222222"
GRID  = "#c9c9c9"
RED   = "#b3452f"
GREEN = "#2e7d55"

plt.rcParams.update({
    "svg.fonttype": "path",          # 文字烘焙成矢量路径：像素级一致、无字距错乱
    "font.size": 13,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.edgecolor": "#444", "axes.linewidth": 1.0,
    "xtick.color": "#444", "ytick.color": "#444",
    "figure.dpi": 100,
})

IMG = Path(__file__).resolve().parent.parent / "images"

def save(fig, name, reproducible=False):
    path = IMG / f"{name}.svg"
    if reproducible:
        with matplotlib.rc_context({"svg.hashsalt": "course-library"}):
            fig.savefig(
                path,
                format="svg",
                bbox_inches="tight",
                metadata={"Date": None},
            )
    else:
        fig.savefig(path, format="svg", bbox_inches="tight")
    plt.close(fig)
    if reproducible:
        text = path.read_text(encoding="utf-8")
        path.write_text(
            "\n".join(line.rstrip() for line in text.splitlines()) + "\n",
            encoding="utf-8",
        )
    print("✓", name)
