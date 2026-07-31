"""线三 · 意义三图：词类比平行四边形 / 可学习性样本复杂度 / 三正交轴。
运行：~/ai-course/.venv/bin/python figs/meaning.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN, GRID

# ── 图 mean-1 · 词向量类比平行四边形 ──────────────────────
def analogy():
    pts = {
        "man":   (1.0, 1.0),
        "woman": (1.0, 2.4),
        "king":  (3.6, 1.3),
        "queen": (3.6, 2.7),
    }
    fig, ax = plt.subplots(figsize=(6.2, 4.6))
    # 两条平行的 gender 向量
    for a, b in [("man", "woman"), ("king", "queen")]:
        ax.annotate("", xy=pts[b], xytext=pts[a],
                    arrowprops=dict(arrowstyle="-|>", color=RED, lw=2.2))
    # 两条 royalty 向量（虚线）
    for a, b in [("man", "king"), ("woman", "queen")]:
        ax.annotate("", xy=pts[b], xytext=pts[a],
                    arrowprops=dict(arrowstyle="-|>", color=ACC, lw=1.6, ls=(0, (4, 3))))
    for w, (x, y) in pts.items():
        ax.plot(x, y, "o", color=INK, ms=7, zorder=5)
        ax.text(x, y + 0.13, w, ha="center", fontsize=13, color=INK, zorder=6)
    ax.text(1.02, 1.72, "gender", color=RED, fontsize=11, rotation=90, va="center")
    ax.text(2.25, 1.02, "royalty", color=ACC, fontsize=11, ha="center")
    ax.set_xlim(0.3, 4.5); ax.set_ylim(0.4, 3.3)
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(r"$\vec{king}-\vec{man}+\vec{woman}\approx\vec{queen}$", color=INK, fontsize=14)
    save(fig, "mean_analogy")

# ── 图 mean-2 · 样本复杂度 / 归纳偏置 ─────────────────────
def learnability():
    m = np.linspace(1, 100, 400)                 # 样本量
    def curve(d): return 0.05 + 0.9 * np.exp(-m / d)  # 误差随样本下降，d=空间复杂度
    fig, ax = plt.subplots(figsize=(6.4, 4.3))
    for d, c, lab in [(6, GREEN, "strong bias (low VC)"),
                      (18, ACC, "medium bias"),
                      (45, RED, "weak bias (high VC)")]:
        ax.plot(m, curve(d), color=c, lw=2.2, label=lab)
    ax.axvline(22, color="#888", lw=1.2, ls=":")
    ax.text(23, 0.82, "child's data", color="#666", fontsize=10, rotation=0)
    ax.set_xlabel("training samples  $m$")
    ax.set_ylabel("generalization error")
    ax.set_title("Sample complexity vs inductive bias", color=INK)
    ax.legend(frameon=False, fontsize=10.5)
    ax.set_ylim(0, 1.0)
    save(fig, "mean_learnability")

# ── 图 mean-3 · 三条正交争议轴 ────────────────────────────
def axes3():
    fig, ax = plt.subplots(figsize=(6.8, 4.8))
    ax.set_xlim(-1.15, 1.15); ax.set_ylim(-1.15, 1.25)
    # 轴 I（水平）、轴 II（竖直）、轴 III（斜，等距投影）
    ax.annotate("", xy=(1.05, 0), xytext=(-1.05, 0),
                arrowprops=dict(arrowstyle="-|>", color="#555", lw=1.6))
    ax.annotate("", xy=(0, 1.05), xytext=(0, -1.05),
                arrowprops=dict(arrowstyle="-|>", color="#555", lw=1.6))
    dz = 0.72
    ax.annotate("", xy=(dz, dz), xytext=(-dz, -dz),
                arrowprops=dict(arrowstyle="-|>", color=ACC2, lw=1.6, ls=(0, (5, 3))))
    ax.text(1.06, -0.12, "emergent", fontsize=9.5, color="#555", ha="right")
    ax.text(-1.06, -0.12, "nativist", fontsize=9.5, color="#555", ha="left")
    ax.text(0.03, 1.10, "language shapes thought", fontsize=9.5, color="#555", ha="left")
    ax.text(0.03, -1.14, "thought before language", fontsize=9.5, color="#555", ha="left")
    ax.text(dz + 0.02, dz + 0.06, "predict = understand", fontsize=9.5, color=ACC, ha="left")
    ax.text(-dz - 0.02, -dz - 0.12, "predict $\\neq$ understand", fontsize=9.5, color=ACC, ha="right")
    ax.text(0.62, 0.02, "axis I", fontsize=8.5, color="#999")
    ax.text(0.03, 0.62, "axis II", fontsize=8.5, color="#999")
    ax.text(0.40, 0.30, "axis III", fontsize=8.5, color="#9bbfc4")
    # 学派落点
    schools = {
        "Chomsky":        (-0.78, 0.18, RED),
        "connectionist":  (0.80, -0.30, GREEN),
        "cognitive ling.": (0.55, 0.72, ACC),
        "world-model":    (0.62, 0.05, INK),
        "Fodor":          (-0.55, -0.72, "#8a5a2b"),
    }
    for name, (x, y, c) in schools.items():
        ax.plot(x, y, "o", color=c, ms=8, zorder=5)
        ax.text(x, y + 0.07, name, fontsize=9, color=c, ha="center", zorder=6)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title("Three orthogonal axes of debate", color=INK, fontsize=13)
    save(fig, "mean_axes")

if __name__ == "__main__":
    analogy(); learnability(); axes3()
