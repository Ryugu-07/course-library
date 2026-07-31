"""线二 · 信息论四图：Zipf / surprisal-RT / 词长-可预测性 / MDL 权衡。
运行：~/ai-course/.venv/bin/python figs/info.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

rng = np.random.default_rng(7)

# ── 图 info-1 · Zipf 双对数 ────────────────────────────────
def zipf():
    r = np.arange(1, 8000)
    f = 1e6 / (r ** 1.02)                       # 理想 Zipf
    noise = np.exp(rng.normal(0, 0.18, r.size))  # 词频抽样噪声
    f_obs = f * noise
    fig, ax = plt.subplots(figsize=(6.4, 4.4))
    ax.loglog(r, f_obs, ".", ms=2.4, color=ACC2, alpha=0.55, label="observed word frequency")
    ax.loglog(r, f, "-", color=RED, lw=2, label=r"$f \propto r^{-1}$ (Zipf)")
    ax.set_xlabel("rank  $r$  (log)")
    ax.set_ylabel("frequency  $f$  (log)")
    ax.set_title("Zipf's law in a text corpus", color=INK)
    ax.legend(frameon=False, fontsize=11)
    ax.annotate("function words\n(the, of, a)", xy=(1.5, 6e5), xytext=(8, 3e4),
                fontsize=10, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.annotate("hapax legomena\n(long tail)", xy=(5000, 130), xytext=(200, 4),
                fontsize=10, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    save(fig, "info_zipf")

# ── 图 info-2 · 阅读时间 vs surprisal（线性）─────────────────
def surprisal_rt():
    S = np.linspace(0, 20, 220)
    beta, alpha = 12.0, 300.0                    # ms per bit, baseline
    RT = alpha + beta * S + rng.normal(0, 22, S.size)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.scatter(S, RT, s=10, color=ACC2, alpha=0.55, edgecolors="none")
    ax.plot(S, alpha + beta * S, "-", color=RED, lw=2,
            label=r"$\mathrm{RT}=\alpha+\beta\,S$")
    ax.set_xlabel("surprisal  $S(w)=-\\log_2 P(w\\mid \\mathrm{context})$   (bits)")
    ax.set_ylabel("reading time  (ms)")
    ax.set_title("Reading time is linear in surprisal", color=INK)
    ax.legend(frameon=False, fontsize=12, loc="upper left")
    ax.annotate(r"slope $\beta$ = ms per bit", xy=(14, alpha + beta * 14),
                xytext=(2.5, 520), fontsize=11, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    save(fig, "info_surprisal_rt")

# ── 图 info-3 · 词长 vs 平均 surprisal ─────────────────────
def wordlen():
    x = np.linspace(1, 12, 200)                  # mean surprisal (bits)
    length = 1.1 + 0.9 * x + rng.normal(0, 0.0, x.size)
    xs = rng.uniform(1, 12, 240)
    ys = 1.1 + 0.9 * xs + rng.normal(0, 0.9, xs.size)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.scatter(xs, ys, s=11, color=ACC2, alpha=0.5, edgecolors="none")
    ax.plot(x, length, "-", color=RED, lw=2,
            label=r"$\mathrm{len}\propto \mathbb{E}[-\log P]$")
    ax.set_xlabel("mean surprisal of the word   (bits)")
    ax.set_ylabel("word length   (characters)")
    ax.set_title("Predictable words are shorter", color=INK)
    ax.legend(frameon=False, fontsize=12, loc="upper left")
    save(fig, "info_wordlen")

# ── 图 info-4 · MDL 双项权衡 ───────────────────────────────
def mdl():
    c = np.linspace(0.2, 10, 300)                # model complexity
    L_model = 6 * c                              # 描述模型的代价 ↑
    L_data = 260 / (c + 0.6) + 4                 # 用模型编码数据的残差 ↓
    total = L_model + L_data
    kstar = c[np.argmin(total)]
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.plot(c, L_model, "--", color=ACC2, lw=1.8, label=r"$L(M)$  model cost")
    ax.plot(c, L_data, "--", color=GREEN, lw=1.8, label=r"$L(D\mid M)$  data given model")
    ax.plot(c, total, "-", color=RED, lw=2.4, label=r"$L(M)+L(D\mid M)$")
    ax.axvline(kstar, color="#888", lw=1, ls=":")
    ax.plot([kstar], [total.min()], "o", color=INK, ms=6)
    ax.annotate("best model\n(shortest total)", xy=(kstar, total.min()),
                xytext=(kstar + 1.4, total.min() + 40), fontsize=10, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.set_xlabel("model complexity")
    ax.set_ylabel("description length   (bits)")
    ax.set_title("MDL: learning = compression", color=INK)
    ax.legend(frameon=False, fontsize=10.5, loc="upper center")
    save(fig, "info_mdl")

if __name__ == "__main__":
    zipf(); surprisal_rt(); wordlen(); mdl()
