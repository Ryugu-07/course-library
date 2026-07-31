import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ACC   = "#9a7318"   # 赭金主色
ACC2  = "#d9c07a"   # 浅赭金
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

IMG = "/Users/karasuakamatsu/clinic-course/images"

def save(fig, name):
    fig.savefig(f"{IMG}/{name}.svg", format="svg", bbox_inches="tight")
    plt.close(fig)
    print("✓", name)
