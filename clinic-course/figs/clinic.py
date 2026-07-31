"""临床决策站 [plot] 轨插图：图内一律英文，中文进 figcaption。
运行: ~/ai-course/.venv/bin/python figs/clinic.py
"""
from _common import plt, np, ACC, ACC2, INK, GRID, RED, GREEN, save

# ---------- 1.1 后验 vs 先验，按似然比 ----------
def fig_bayes():
    pre = np.linspace(0.001, 0.999, 500)
    fig, ax = plt.subplots(figsize=(6.8, 5.0))
    for lr, c, ls in [(10, ACC, "-"), (5, ACC2, "-"), (3, GREEN, "-"),
                      (1.5, INK, ":"), (0.3, RED, "--"), (0.1, RED, "-")]:
        odds = pre / (1 - pre) * lr
        post = odds / (1 + odds)
        ax.plot(pre * 100, post * 100, color=c, lw=2.2, ls=ls, label=f"LR = {lr:g}")
    ax.plot([0, 100], [0, 100], color=GRID, lw=1.2, ls="-.")
    ax.text(70, 64, "LR = 1\n(no information)", fontsize=9.5, color=GRID)
    # 例题标注
    ax.plot([60], [81.8], "o", color=INK, ms=8)
    ax.annotate("60% $\\rightarrow$ 82%\n(LR 3, typical chest pain)",
                (57, 84), fontsize=9, color=INK, ha="right")
    ax.plot([5], [13.6], "o", color=INK, ms=8)
    ax.annotate("5% $\\rightarrow$ 14%\nsame test result", (8, 10), fontsize=9, color=INK)
    ax.set_xlabel("pre-test probability (%)")
    ax.set_ylabel("post-test probability (%)")
    ax.set_xlim(0, 100); ax.set_ylim(0, 100)
    ax.legend(frameon=False, fontsize=9.5, loc="lower right")
    save(fig, "cli-01-bayes")


# ---------- 2.1 重叠分布 + ROC ----------
def fig_roc():
    from scipy.stats import norm
    fig, axes = plt.subplots(1, 2, figsize=(11.2, 4.4))

    ax = axes[0]
    x = np.linspace(-4, 8, 600)
    d0, d1 = norm.pdf(x, 0, 1), norm.pdf(x, 2.6, 1)
    ax.plot(x, d0, color=GRID, lw=2.0)
    ax.plot(x, d1, color=ACC, lw=2.2)
    cut = 1.35
    ax.axvline(cut, color=RED, lw=2.0)
    ax.fill_between(x, 0, d0, where=(x >= cut), color=RED, alpha=.30)
    ax.fill_between(x, 0, d1, where=(x <= cut), color=ACC, alpha=.30)
    ax.text(-2.4, 0.30, "without\ndisease", fontsize=10, color="#7a7a7a", ha="center")
    ax.text(4.4, 0.30, "with\ndisease", fontsize=10, color=ACC, ha="center")
    ax.annotate("false\npositives", (2.3, 0.055), fontsize=9.5, color=RED)
    ax.annotate("false\nnegatives", (0.15, 0.055), fontsize=9.5, color=ACC, ha="right")
    ax.annotate("cutoff", (cut + 0.12, 0.40), fontsize=10, color=RED)
    ax.annotate("", xy=(cut + 1.5, 0.435), xytext=(cut - 1.5, 0.435),
                arrowprops=dict(arrowstyle="<->", color=RED, lw=1.4))
    ax.text(cut, 0.45, "moving it only trades one error for the other",
            fontsize=9, color=RED, ha="center")
    ax.set_xlabel("test value"); ax.set_yticks([])
    ax.set_ylim(0, 0.50)

    ax = axes[1]
    fa = np.linspace(0.0005, 0.9995, 500)
    for sep, c, ls in [(2.6, ACC, "-"), (1.4, ACC2, "--"), (0.0, GRID, ":")]:
        hit = norm.cdf(norm.ppf(fa) + sep)
        auc = norm.cdf(sep / np.sqrt(2))
        ax.plot(fa, hit, color=c, lw=2.3, ls=ls, label=f"AUC = {auc:.2f}")
    h = norm.cdf(norm.ppf(1 - norm.cdf(cut)) + 2.6)
    ax.plot([1 - norm.cdf(cut)], [h], "o", color=RED, ms=8)
    ax.annotate("the cutoff on the left", (1 - norm.cdf(cut) + 0.05, h - 0.06),
                fontsize=9.5, color=RED)
    ax.set_xlabel("false positive rate (1 $-$ specificity)")
    ax.set_ylabel("true positive rate (sensitivity)")
    ax.legend(frameon=False, fontsize=9.5, loc="lower right")
    save(fig, "cli-02-roc")


# ---------- 3.1 领先时间偏倚 ----------
def fig_leadtime():
    fig, ax = plt.subplots(figsize=(9.0, 4.0))
    # 两条时间轴
    for y, lab, dx in [(1.0, "no screening", 6.0), (0.0, "with screening", 2.0)]:
        ax.plot([0, 12], [y, y], color=GRID, lw=2.0)
        ax.text(-0.4, y, lab, fontsize=10.5, ha="right", va="center", color=INK)
        # 生物学发病
        ax.plot([2.0], [y], "o", color=INK, ms=8)
        # 诊断
        ax.plot([dx], [y], "s", color=ACC, ms=11)
        # 死亡
        ax.plot([9.0], [y], "X", color=RED, ms=13)
        # 生存期区间
        ax.annotate("", xy=(9.0, y + 0.16), xytext=(dx, y + 0.16),
                    arrowprops=dict(arrowstyle="<->", color=ACC, lw=1.8))
        ax.text((dx + 9.0) / 2, y + 0.23,
                f"apparent survival = {9.0-dx:.0f} years", fontsize=10,
                ha="center", color=ACC)
    ax.text(2.0, 1.32, "biological onset", fontsize=9.5, ha="center", color=INK)
    ax.text(9.0, -0.35, "death — identical in both", fontsize=10.5, ha="center", color=RED)
    ax.annotate("", xy=(6.0, 0.55), xytext=(2.0, 0.55),
                arrowprops=dict(arrowstyle="<->", color=RED, lw=1.6))
    ax.text(4.0, 0.62, "lead time (4 years)", fontsize=10, ha="center", color=RED)
    ax.plot([9.0, 9.0], [-0.2, 1.2], color=RED, lw=1.2, ls=":")
    ax.set_xlim(-3.2, 12.6); ax.set_ylim(-0.5, 1.5)
    ax.set_xlabel("years")
    ax.set_yticks([]); ax.spines["left"].set_visible(False)
    save(fig, "cli-03-leadtime")


# ---------- 6.1 同一 RRR，不同基线风险 ----------
def fig_nnt():
    rrr = 0.25
    base = np.array([1, 2.5, 5, 7.5, 10, 15, 20, 30])
    arr = base * rrr
    nnt = 100 / arr
    fig, ax = plt.subplots(figsize=(7.8, 4.8))
    ax.bar(np.arange(len(base)), arr, width=.6, color=ACC, label="ARR (left axis)")
    ax.set_xticks(np.arange(len(base)))
    ax.set_xticklabels([f"{b:g}%" for b in base])
    ax.set_xlabel("baseline 10-year risk")
    ax.set_ylabel("absolute risk reduction (%)")
    ax.set_ylim(0, 9)
    for i, (a, n) in enumerate(zip(arr, nnt)):
        ax.text(i, a + 0.15, f"{a:.2f}", ha="center", fontsize=9, color=ACC)

    ax2 = ax.twinx()
    ax2.plot(np.arange(len(base)), nnt, color=RED, lw=2.4, marker="o", ms=6,
             label="NNT (right axis)")
    for i, n in enumerate(nnt):
        ax2.text(i, n + 14, f"{n:.0f}", ha="center", fontsize=9.5, color=RED)
    ax2.set_ylabel("NNT", color=RED)
    ax2.tick_params(axis="y", colors=RED)
    ax2.set_ylim(0, 480)
    ax2.spines["right"].set_visible(True)
    ax.set_title("relative risk reduction fixed at 25%", fontsize=11)
    h1, l1 = ax.get_legend_handles_labels(); h2, l2 = ax2.get_legend_handles_labels()
    ax.legend(h1 + h2, l1 + l2, frameon=False, fontsize=9.5, loc="upper center")
    save(fig, "cli-06-nnt")


# ---------- 8.1 森林图 ----------
def fig_forest():
    studies = [("Study A, 2009", 0.82, 0.61, 1.10, 14),
               ("Study B, 2012", 0.74, 0.55, 1.00, 17),
               ("Study C, 2014", 1.28, 0.95, 1.72, 15),
               ("Study D, 2016", 0.69, 0.52, 0.92, 19),
               ("Study E, 2019", 1.15, 0.88, 1.50, 16),
               ("Study F, 2023", 0.71, 0.58, 0.87, 19)]
    pooled = (0.87, 0.70, 1.07)   # DerSimonian-Laird，由上表数据算得
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    ys = np.arange(len(studies))[::-1] + 1
    for y, (name, rr, lo, hi, w) in zip(ys, studies):
        ax.plot([lo, hi], [y, y], color=INK, lw=1.5)
        ax.plot([lo, lo], [y - .1, y + .1], color=INK, lw=1.5)
        ax.plot([hi, hi], [y - .1, y + .1], color=INK, lw=1.5)
        ax.scatter([rr], [y], s=w * 13, color=ACC, marker="s", zorder=4)
        ax.text(0.30, y, name, fontsize=10, va="center", ha="left")
        ax.text(3.6, y, f"{rr:.2f} [{lo:.2f}, {hi:.2f}]", fontsize=9.5,
                va="center", ha="right")
    # 合并菱形
    rr, lo, hi = pooled
    ax.fill([lo, rr, hi, rr], [0, 0.22, 0, -0.22], color=RED, zorder=5)
    ax.text(0.30, 0, "Pooled (random effects)", fontsize=10, va="center",
            fontweight="bold")
    ax.text(3.6, 0, f"{rr:.2f} [{lo:.2f}, {hi:.2f}]", fontsize=9.5,
            va="center", ha="right", fontweight="bold")
    ax.axvline(1.0, color=GRID, lw=1.4, ls="--")
    ax.set_xscale("log")
    ax.set_xlim(0.28, 4.0); ax.set_ylim(-0.7, len(studies) + 0.8)
    from matplotlib.ticker import NullLocator, NullFormatter
    ax.xaxis.set_minor_locator(NullLocator())      # 关掉 log 轴自动次刻度标签
    ax.xaxis.set_minor_formatter(NullFormatter())
    ax.set_xticks([0.5, 0.75, 1.0, 1.5, 2.0])
    ax.set_xticklabels(["0.5", "0.75", "1.0", "1.5", "2.0"])
    ax.set_xlabel("risk ratio (log scale)   —   favours treatment $\\leftarrow$ | $\\rightarrow$ favours control")
    ax.set_yticks([]); ax.spines["left"].set_visible(False)
    ax.text(1.0, len(studies) + 0.55, "$I^2 = 73\\%$  (substantial heterogeneity)",
            fontsize=10, ha="center", color=RED)
    save(fig, "cli-08-forest")


# ---------- 8.2 漏斗图 ----------
def fig_funnel():
    rng = np.random.default_rng(5)
    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.4), sharey=True)
    true = 0.0
    se = np.concatenate([rng.uniform(0.32, 0.55, 22), rng.uniform(0.16, 0.32, 14),
                         rng.uniform(0.05, 0.16, 8)])
    eff = true + rng.normal(0, 1, se.size) * se

    for ax, drop, title in [(axes[0], False, "symmetric — no evidence of bias"),
                            (axes[1], True, "asymmetric — small negative studies missing")]:
        e, s = eff.copy(), se.copy()
        if drop:
            keep = ~((s > 0.28) & (e > 0.10))
            e, s = e[keep], s[keep]
        ax.scatter(e, s, s=34, color=ACC, alpha=.8, edgecolors="none")
        # 漏斗
        smax = 0.60
        for z, ls in [(1.96, "--")]:
            ax.plot([true - z * smax, true], [smax, 0], color=GRID, lw=1.4, ls=ls)
            ax.plot([true + z * smax, true], [smax, 0], color=GRID, lw=1.4, ls=ls)
        ax.axvline(true, color=GRID, lw=1.2)
        if drop:
            ax.annotate("missing", (0.62, 0.44), fontsize=10, color=RED)
            ax.annotate("", xy=(0.42, 0.40), xytext=(0.62, 0.43),
                        arrowprops=dict(arrowstyle="->", color=RED, lw=1.6))
        ax.set_xlim(-1.3, 1.3); ax.set_ylim(0.62, -0.02)
        ax.set_xlabel("effect size (log scale, centred)")
        ax.set_title(title, fontsize=10.5)
    axes[0].set_ylabel("standard error\n(larger studies at top)")
    save(fig, "cli-08-funnel")


# ---------- 15.1 他汀绝对获益 vs 基线风险 ----------
def fig_risk():
    base = np.linspace(1, 30, 300)
    arr = base * 0.25
    nnt = 100 / arr
    fig, ax = plt.subplots(figsize=(7.8, 4.8))
    ax.fill_between(base, 0, arr, color=ACC, alpha=.30)
    ax.plot(base, arr, color=ACC, lw=2.6, label="ARR over 10 years (left)")
    ax.axvspan(7.5, 10, color=GREEN, alpha=.18)
    ax.text(8.75, 7.3, "common\ntreatment\nthreshold", fontsize=9.5, ha="center",
            color=GREEN)
    ax.set_xlabel("baseline 10-year cardiovascular risk (%)")
    ax.set_ylabel("absolute risk reduction (%)")
    ax.set_xlim(1, 30); ax.set_ylim(0, 8.2)

    ax2 = ax.twinx()
    ax2.plot(base, nnt, color=RED, lw=2.4, label="NNT (right)")
    ax2.axhline(100, color=INK, lw=1.4, ls="-.")
    ax2.text(23.5, 118, "NNH $\\approx$ 100 (muscle symptoms)", fontsize=9.5,
             color=INK, ha="right")
    ax2.set_ylabel("NNT", color=RED); ax2.tick_params(axis="y", colors=RED)
    ax2.set_ylim(0, 430); ax2.spines["right"].set_visible(True)
    for x in (2.5, 5, 10, 20):
        ax2.plot([x], [100 / (x * 0.25)], "o", color=RED, ms=6)
        ax2.text(x + 0.4, 100 / (x * 0.25) + 12, f"NNT {100/(x*0.25):.0f}",
                 fontsize=9, color=RED)
    h1, l1 = ax.get_legend_handles_labels(); h2, l2 = ax2.get_legend_handles_labels()
    ax.legend(h1 + h2, l1 + l2, frameon=False, fontsize=9.5, loc="upper left")
    save(fig, "cli-15-risk")


# ---------- 17.1 每 1000 人筛查的结局构成 ----------
def fig_screening():
    fig, ax = plt.subplots(figsize=(8.6, 4.4))
    cats = ["deaths\nprevented", "over-\ndiagnosed", "false positives\n(further tests)",
            "no effect either way"]
    vals = [1, 3, 120, 876]
    colors = [GREEN, RED, ACC2, GRID]
    left = 0
    for v, c, lab in zip(vals, colors, cats):
        ax.barh([0], [v], left=left, height=.5, color=c, edgecolor="white", lw=.8)
        left += v
    ax.set_xlim(0, 1000); ax.set_ylim(-0.9, 1.5)
    ax.set_yticks([]); ax.spines["left"].set_visible(False)
    ax.set_xlabel("people per 1000 screened")
    # 引线标注
    ann = [(1, 0.5, "1 death prevented", GREEN, 60),
           (2.5, 4, "~3 overdiagnosed and treated", RED, 250),
           (64, 124, "~120 false positives", ACC2, 480),
           (560, 1000, "~876 unaffected", "#6f6f6f", 780)]
    for x, _, txt, c, tx in ann:
        ax.annotate(txt, xy=(x, 0.27), xytext=(tx, 0.95),
                    arrowprops=dict(arrowstyle="->", color=c, lw=1.4),
                    fontsize=10, color=c, ha="center")
    ax.set_title("illustrative magnitudes — not a specific cancer", fontsize=10.5)
    save(fig, "cli-17-screening")


# ---------- 19.1 均值回归 ----------
def fig_regression():
    rng = np.random.default_rng(3)
    n, rho = 400, 0.6
    x1 = rng.normal(50, 10, n)
    x2 = 50 + rho * (x1 - 50) + np.sqrt(1 - rho**2) * rng.normal(0, 10, n)
    sel = x1 > 65
    fig, axes = plt.subplots(1, 2, figsize=(10.8, 4.4),
                             gridspec_kw={"width_ratios": [1.35, 1]})
    ax = axes[0]
    ax.scatter(x1[~sel], x2[~sel], s=18, color=GRID, alpha=.6)
    ax.scatter(x1[sel], x2[sel], s=26, color=RED, alpha=.85)
    ax.axvspan(65, 90, color=RED, alpha=.10)
    ax.plot([20, 85], [20, 85], color=GRID, lw=1.4, ls="--")
    ax.axhline(50, color=INK, lw=1.0, ls=":")
    ax.axvline(50, color=INK, lw=1.0, ls=":")
    ax.text(76, 22, "selected:\nworst at\nbaseline", fontsize=9.5, color=RED, ha="center")
    ax.text(30, 78, "line of no change", fontsize=9.5, color=GRID)
    ax.set_xlabel("measurement 1 (e.g. symptom score)")
    ax.set_ylabel("measurement 2 (no treatment given)")
    ax.set_xlim(20, 90); ax.set_ylim(15, 88)

    ax = axes[1]
    m1, m2 = x1[sel].mean(), x2[sel].mean()
    # 同一组人测两次 → 用同一颜色（不同色会被读成两组人）
    ax.bar([0, 1], [m1, m2], width=.5, color=RED, alpha=.85)
    ax.axhline(50, color=INK, lw=1.2, ls=":")
    ax.text(1.42, 51.5, "population mean", fontsize=9.5, color=INK, ha="right")
    for i, m in enumerate([m1, m2]):
        ax.text(i, m + 1.0, f"{m:.1f}", ha="center", fontsize=10.5)
    ax.annotate("", xy=(1, m2 + 3.4), xytext=(0, m1 + 3.4),
                arrowprops=dict(arrowstyle="->", color=RED, lw=2.0))
    ax.text(0.5, m1 + 6.6, f"\"improvement\" of {m1-m2:.1f}\nwith NO treatment",
            ha="center", fontsize=10, color=RED)
    ax.set_xticks([0, 1]); ax.set_xticklabels(["before", "after"])
    ax.set_ylabel("mean score of the selected group")
    ax.set_ylim(0, 88)
    save(fig, "cli-19-regression")


# ---------- 23.1 成本效果平面 ----------
def fig_cea():
    rng = np.random.default_rng(9)
    fig, ax = plt.subplots(figsize=(7.4, 5.4))
    lam = 30000.0                      # 支付意愿阈值 (每 QALY)
    e = np.linspace(-0.6, 1.2, 10)
    ax.plot(e, lam * e, color=GREEN, lw=2.0)
    ax.text(1.19, lam * 1.19 + 1200, "willingness-to-pay threshold\n(30k per QALY)",
            fontsize=9.5, color=GREEN, ha="right", va="bottom")
    ax.axhline(0, color=INK, lw=1.2); ax.axvline(0, color=INK, lw=1.2)
    # 象限标注
    ax.text(0.10, 39500, "more effective,\nmore costly $\\rightarrow$\nthreshold decides",
            fontsize=9.5, color=INK, ha="left", va="top")
    ax.text(-0.36, 41000, "DOMINATED\nreject", fontsize=10.5, color=RED, ha="center")
    ax.text(1.02, -20000, "DOMINANT\nadopt", fontsize=10.5, color=GREEN, ha="center")
    # 概率敏感性分析散点
    de = rng.normal(0.42, 0.16, 320)
    dc = rng.normal(9500, 5200, 320)
    below = dc < lam * de
    ax.scatter(de[below], dc[below], s=13, color=ACC, alpha=.55)
    ax.scatter(de[~below], dc[~below], s=13, color=RED, alpha=.55)
    ax.scatter([de.mean()], [dc.mean()], s=90, color=INK, marker="D", zorder=6)
    ax.annotate(f"ICER = {dc.mean()/de.mean():,.0f} per QALY",
                (de.mean() + 0.10, dc.mean() - 11000), fontsize=10, color=INK)
    ax.text(-0.56, -34000, f"{below.mean()*100:.0f}% of simulations below threshold",
            fontsize=10, color=ACC)
    ax.set_xlabel("incremental effect (QALYs gained)")
    ax.set_ylabel("incremental cost")
    ax.set_xlim(-0.6, 1.2); ax.set_ylim(-38000, 52000)
    save(fig, "cli-23-cea")


if __name__ == "__main__":
    fig_bayes(); fig_roc(); fig_leadtime(); fig_nnt()
    fig_forest(); fig_funnel(); fig_risk(); fig_screening()
    fig_regression(); fig_cea()
