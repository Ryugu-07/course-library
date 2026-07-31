import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ACC   = "#a9553f"   # 赤陶主色
ACC2  = "#d99e88"   # 浅赤陶
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

IMG = "/Users/karasuakamatsu/psych-course/images"

def save(fig, name):
    fig.savefig(f"{IMG}/{name}.svg", format="svg", bbox_inches="tight")
    plt.close(fig)
    print("✓", name)
