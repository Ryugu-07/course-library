"""线四 · 文明二图：累积文化棘轮 / 外部符号存储阶梯。
运行：~/ai-course/.venv/bin/python figs/civ.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 civ-1 · 累积文化棘轮（高/低保真传递）──────────────
def ratchet():
    gens = np.arange(0, 40)
    improve = 0.12                       # 每代改进
    hi = np.zeros_like(gens, dtype=float)   # 高保真：几乎不丢
    lo = np.zeros_like(gens, dtype=float)   # 低保真：损耗抵消改进
    for i in range(1, len(gens)):
        hi[i] = hi[i-1] * 0.99 + improve + 0.02 * hi[i-1]   # 复利式累积
        lo[i] = lo[i-1] * 0.72 + improve                    # 高损耗 → 平台
    fig, ax = plt.subplots(figsize=(6.4, 4.3))
    ax.plot(gens, hi, "-", color=ACC, lw=2.4, label="high-fidelity transmission (language)")
    ax.plot(gens, lo, "--", color=RED, lw=2.0, label="low-fidelity (imitation only)")
    ax.fill_between(gens, lo, hi, color=ACC2, alpha=0.15)
    ax.set_xlabel("generations")
    ax.set_ylabel("cultural complexity  (accumulated)")
    ax.set_title("The ratchet effect of cumulative culture", color=INK)
    ax.legend(frameon=False, fontsize=10.5, loc="upper left")
    ax.annotate("ratchet climbs", xy=(32, hi[32]), xytext=(18, hi[32]),
                fontsize=10, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.annotate("stuck at plateau", xy=(32, lo[32]), xytext=(20, lo[32]-1.4),
                fontsize=10, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    save(fig, "civ_ratchet")

# ── 图 civ-2 · 外部符号存储的量级阶梯 ─────────────────────
def timeline():
    labels = ["spoken\nlanguage", "writing", "printing", "digital /\nnetwork"]
    # 示意的"可外部储存并传递的信息量"（对数刻度，任意单位）
    logvals = [2, 5, 8, 13]
    x = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(6.6, 4.2))
    ax.step(np.append(x, x[-1]+0.5), np.append(logvals, logvals[-1]),
            where="post", color=ACC2, lw=1.4, alpha=0.7)
    ax.plot(x, logvals, "o", color=ACC, ms=11, zorder=5)
    for xi, yi, lab in zip(x, logvals, labels):
        ax.text(xi, yi + 0.5, lab, ha="center", fontsize=10.5, color=INK)
    # 阶梯箭头标注"跨过阈值"
    for i in range(len(x)-1):
        ax.annotate("", xy=(x[i+1], logvals[i+1]-0.3), xytext=(x[i], logvals[i]+0.3),
                    arrowprops=dict(arrowstyle="-|>", color="#888", lw=1.3))
    ax.set_xticks([])
    ax.set_ylabel("externally stored & transmittable\ninformation  (log, schematic)")
    ax.set_title("Symbol technologies ratchet up collective memory", color=INK, fontsize=12.5)
    ax.set_ylim(0, 15.5); ax.set_xlim(-0.5, len(x)-0.2)
    save(fig, "civ_timeline")

if __name__ == "__main__":
    ratchet(); timeline()
