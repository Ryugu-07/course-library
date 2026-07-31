"""线六 · 机器一图：scaling 律 + 涌现的度量假象（双面板）。
运行：~/ai-course/.venv/bin/python figs/ai.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

def scaling():
    fig, (axL, axR) = plt.subplots(1, 2, figsize=(9.2, 4.2))

    # 左：scaling 律（loss vs compute，双对数幂律）
    C = np.logspace(0, 6, 200)
    L = 1.6 + 5.0 * C ** (-0.075)
    axL.loglog(C, L, "-", color=ACC, lw=2.4)
    axL.set_xlabel("compute  $C$  (log)")
    axL.set_ylabel("test loss  $L$  (bits/token, log)")
    axL.set_title("Scaling law: loss falls as a power law", color=INK, fontsize=12)
    axL.annotate(r"$L\approx L_\infty+(C_0/C)^{\alpha}$", xy=(1e3, 2.2),
                 xytext=(30, 3.2), fontsize=11, color="#555",
                 arrowprops=dict(arrowstyle="->", color="#888"))

    # 右：同一能力，两种指标 —— 阈值化(陡跳) vs 平滑(渐进)
    x = np.logspace(0, 4, 200)                 # model scale
    skill = 1 / (1 + (200 / x) ** 1.3)         # 底层能力：平滑上升
    acc = (skill > 0.5).astype(float) * skill  # 精确匹配：阈值化 → 陡跳
    # 让"陡跳"更像台阶
    acc = np.where(x < 260, 0.02, skill)
    logp = 0.15 + 0.8 * skill                  # 对数似然：平滑
    axR.semilogx(x, acc, "-", color=RED, lw=2.4, label="exact-match accuracy (thresholded)")
    axR.semilogx(x, logp, "-", color=ACC, lw=2.2, label="per-token log-likelihood (smooth)")
    axR.axvline(260, color="#888", lw=1, ls=":")
    axR.set_xlabel("model scale  (log)")
    axR.set_ylabel("performance  (normalized)")
    axR.set_title('"Emergence": real jump or metric mirage?', color=INK, fontsize=12)
    axR.legend(frameon=False, fontsize=9, loc="upper left")
    axR.annotate("same ability,\ndifferent metric", xy=(260, 0.5), xytext=(600, 0.28),
                 fontsize=9.5, color="#555",
                 arrowprops=dict(arrowstyle="->", color="#999"))
    fig.tight_layout()
    save(fig, "ai_scaling")

if __name__ == "__main__":
    scaling()
