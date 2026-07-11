"""实验公共工具：中文字体、输出目录、随机种子。所有 lab 开头 import 它。"""
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np

OUTPUT = Path(__file__).parent / "output"
OUTPUT.mkdir(exist_ok=True)

# macOS 中文字体（避免图上中文变方块）
matplotlib.rcParams["font.sans-serif"] = ["PingFang SC", "Hiragino Sans GB", "Arial Unicode MS"]
matplotlib.rcParams["axes.unicode_minus"] = False

np.random.seed(42)


def save_and_show(fig, name: str):
    """图先存盘再弹窗：关掉窗口后程序继续。"""
    path = OUTPUT / name
    fig.savefig(path, dpi=150, bbox_inches="tight")
    print(f"  📈 图已保存: {path}")
    plt.show()
