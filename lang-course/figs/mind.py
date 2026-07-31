"""线五 · 心智二图：层级预测编码 / 语言-推理双分离。
运行：~/ai-course/.venv/bin/python figs/mind.py"""
import numpy as np
import matplotlib.patches as mpatches
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 mind-1 · 层级预测编码 ──────────────────────────────
def predcoding():
    fig, ax = plt.subplots(figsize=(6.4, 4.6))
    layers = [("Low level\nedges · phonemes", 0.5),
              ("Mid level\nparts · morphemes", 2.0),
              ("High level\nobjects · meaning · intent", 3.5)]
    w, h = 4.2, 1.05
    for name, y in layers:
        ax.add_patch(mpatches.FancyBboxPatch((0, y), w, h,
                     boxstyle="round,pad=0.02,rounding_size=0.08",
                     fc=ACC2, ec=ACC, lw=1.6, alpha=0.35))
        ax.text(w/2, y + h/2, name, ha="center", va="center", fontsize=11, color=INK)
    # 下行预测（实线）+ 上行误差（虚线）
    for y0, y1 in [(0.5, 2.0), (2.0, 3.5)]:
        ax.annotate("", xy=(1.3, y0 + h), xytext=(1.3, y1),
                    arrowprops=dict(arrowstyle="-|>", color=ACC, lw=2))
        ax.annotate("", xy=(2.9, y1), xytext=(2.9, y0 + h),
                    arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.8, ls=(0, (4, 3))))
    ax.text(0.75, 1.72, "predictions\n(top-down)", fontsize=9.5, color=ACC, ha="center")
    ax.text(3.45, 1.72, "prediction\nerrors (bottom-up)", fontsize=9.5, color=RED, ha="center")
    ax.text(w/2, 4.85, "sensory input arrives at the bottom", fontsize=9.5,
            color="#666", ha="center", style="italic")
    ax.annotate("", xy=(w/2, 0.42), xytext=(w/2, 0.0),
                arrowprops=dict(arrowstyle="-|>", color="#888", lw=1.4))
    ax.set_xlim(-0.3, 4.5); ax.set_ylim(-0.2, 5.1)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title("Hierarchical predictive coding", color=INK, fontsize=13)
    save(fig, "mind_predcoding")

# ── 图 mind-2 · 语言网络 ⊥ 推理网络（双分离）────────────
def dissociation():
    tasks = ["Language\n(read / speak)", "Arithmetic /\nlogic / code"]
    lang_net = [0.92, 0.12]      # 语言选择性网络的响应
    md_net   = [0.18, 0.85]      # 多需求网络的响应
    x = np.arange(len(tasks)); bw = 0.34
    fig, ax = plt.subplots(figsize=(6.4, 4.3))
    ax.bar(x - bw/2, lang_net, bw, color=ACC, label="language-selective network")
    ax.bar(x + bw/2, md_net, bw, color=RED, alpha=0.8, label="multiple-demand network")
    ax.set_xticks(x); ax.set_xticklabels(tasks, fontsize=11)
    ax.set_ylabel("network response  (normalized)")
    ax.set_title("Double dissociation: language $\\perp$ reasoning", color=INK)
    ax.legend(frameon=False, fontsize=10, loc="upper center")
    ax.set_ylim(0, 1.15)
    ax.annotate("crossover =\ndissociation", xy=(0.5, 0.5), xytext=(0.5, 1.0),
                fontsize=9.5, color="#555", ha="center",
                arrowprops=dict(arrowstyle="->", color="#999"))
    save(fig, "mind_dissociation")

if __name__ == "__main__":
    predcoding(); dissociation()
