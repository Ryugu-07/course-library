"""心理学站 [plot] 轨插图：图内一律英文，中文进 figcaption。
运行: ~/ai-course/.venv/bin/python figs/psych.py
"""
from _common import plt, np, ACC, ACC2, INK, GRID, RED, GREEN, save

# ---------- 3.1 复现效应量缩水 ----------
def fig_replication():
    rng = np.random.default_rng(7)
    n = 100
    orig = rng.uniform(0.15, 1.1, n)
    # 复现效应 ~ 原始的一半 + 噪声，约 1/3 显著
    repl = orig*rng.uniform(0.05, 0.85, n) + rng.normal(0, 0.09, n)
    fig, ax = plt.subplots(figsize=(6.4, 4.4))
    lim = [-0.2, 1.2]
    ax.plot(lim, lim, color=GRID, lw=1.2, ls="--")
    ax.axhline(0, color=GRID, lw=0.8)
    # 阈值定在使成功比例 ≈ 36%（对齐 OSC 2015 与图例标注）
    thr = np.quantile(repl, 1 - 0.36)
    sig = repl > thr
    ax.scatter(orig[sig], repl[sig], s=34, color=ACC, alpha=.85, label="replicated (~36%)")
    ax.scatter(orig[~sig], repl[~sig], s=34, facecolors="none", edgecolors=RED,
               lw=1.2, label="failed to replicate")
    ax.annotate("y = x\n(perfect replication)", (0.86, 1.0), fontsize=10, color=INK)
    ax.annotate("most points fall below\n$\\rightarrow$ effects shrink ~50%", (0.42, -0.12),
                fontsize=10, color=INK)
    ax.set_xlabel("original effect size $d$"); ax.set_ylabel("replication effect size $d$")
    ax.set_xlim(lim); ax.set_ylim(-0.25, 1.2)
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    save(fig, "psy-03-replication")

# ---------- 6.1 睡眠结构 ----------
def fig_sleep():
    # stages: 0=Awake,1=REM,2=N1,3=N2,4=N3  (y 轴倒置显示)
    seq = [(0,0.15),(2,0.2),(3,0.6),(4,1.1),(3,0.3),(1,0.15),
           (2,0.15),(3,0.7),(4,0.8),(3,0.4),(1,0.35),
           (2,0.1),(3,0.9),(4,0.35),(3,0.4),(1,0.55),
           (2,0.1),(3,1.0),(1,0.7),(3,0.4),(1,0.75),(0,0.1)]
    t, y = [0.0], []
    xs, ys = [], []
    cur = 0.0
    for st, dur in seq:
        xs += [cur, cur+dur]; ys += [st, st]
        cur += dur
    fig, ax = plt.subplots(figsize=(6.8, 3.8))
    ax.step(xs, ys, where="post", color=ACC, lw=2.0)
    # REM 段高亮
    cur = 0.0
    for st, dur in seq:
        if st == 1:
            ax.axvspan(cur, cur+dur, color=RED, alpha=.18)
        cur += dur
    ax.set_yticks([0,1,2,3,4]); ax.set_yticklabels(["Awake","REM","N1","N2","N3 (deep)"])
    ax.invert_yaxis()
    ax.set_xlabel("hours of sleep")
    ax.annotate("deep sleep concentrated early", (0.9, 4.35), fontsize=10, color=ACC)
    ax.annotate("REM lengthens toward morning", (4.4, 0.55), fontsize=10, color=RED)
    ax.set_xlim(0, cur)
    save(fig, "psy-06-sleep")

# ---------- 7.1 SDT ROC ----------
def fig_sdt():
    from scipy.stats import norm
    fig, ax = plt.subplots(figsize=(5.8, 4.6))
    fa = np.linspace(0.001, 0.999, 400)
    for d, c, lab in [(0.0, GRID, "$d'=0$ (chance)"), (0.8, ACC2, "$d'=0.8$"),
                      (1.6, ACC, "$d'=1.6$"), (2.6, INK, "$d'=2.6$")]:
        hit = norm.cdf(norm.ppf(fa) + d)
        ax.plot(fa, hit, color=c, lw=2.0, label=lab)
    # 同一曲线上两个 criterion 点
    d = 1.6
    for f, lbl in [(0.08, "strict $\\beta$"), (0.42, "lax $\\beta$")]:
        h = norm.cdf(norm.ppf(f) + d)
        ax.plot([f], [h], "o", color=RED, ms=7)
        ax.annotate(lbl, (f+0.03, h-0.07), fontsize=10, color=RED)
    ax.set_xlabel("false alarm rate"); ax.set_ylabel("hit rate")
    ax.legend(frameon=False, loc="lower right", fontsize=9)
    ax.set_title("sensitivity $d'$ vs criterion $\\beta$", fontsize=11)
    save(fig, "psy-07-sdt")

# ---------- 8.1 习得-消退-自发恢复 ----------
def fig_conditioning():
    t1 = np.linspace(0, 10, 100)          # acquisition
    r1 = 1 - np.exp(-t1/2.2)
    t2 = np.linspace(10, 20, 100)         # extinction
    r2 = r1[-1]*np.exp(-(t2-10)/2.0)
    t3 = np.linspace(22, 30, 100)         # spontaneous recovery + re-extinction
    r3 = 0.45*np.exp(-(t3-22)/2.4)
    fig, ax = plt.subplots(figsize=(6.6, 4.0))
    ax.plot(t1, r1, color=ACC, lw=2.2)
    ax.plot(t2, r2, color=ACC, lw=2.2)
    ax.plot(t3, r3, color=ACC, lw=2.2)
    ax.axvspan(20, 22, color=GRID, alpha=.35)
    ax.annotate("rest", (21, 0.9), fontsize=10, ha="center", color=INK)
    ax.annotate("acquisition\n(CS+US)", (3.4, 0.35), fontsize=10, color=ACC)
    ax.annotate("extinction\n(CS alone)", (13.5, 0.55), fontsize=10, color=ACC)
    ax.annotate("spontaneous\nrecovery", (23.4, 0.55), fontsize=10, color=RED)
    ax.annotate("", xy=(22.2, 0.45), xytext=(22.2, 0.08),
                arrowprops=dict(arrowstyle="->", color=RED, lw=1.5))
    ax.set_xlabel("trials"); ax.set_ylabel("conditioned response strength")
    ax.set_ylim(0, 1.05); ax.set_xticks([])
    save(fig, "psy-08-conditioning")

# ---------- 9.1 遗忘曲线 + 间隔 ----------
def fig_forgetting():
    t = np.linspace(0, 30, 600)
    def curve(t0, strength, decay):
        return strength*np.exp(-(t-t0)/decay)
    fig, ax = plt.subplots(figsize=(6.6, 4.2))
    # 单次学习
    single = np.exp(-t/3.0)
    ax.plot(t, single, color=GRID, lw=2.0, label="single study session")
    # 间隔复习: 每次复习拉回 1.0 且衰减变慢
    reviews = [0, 5, 12, 22]
    decays = [3.0, 6.0, 11.0, 20.0]
    y = np.zeros_like(t)
    for i, (r, dec) in enumerate(zip(reviews, decays)):
        nxt = reviews[i+1] if i+1 < len(reviews) else t[-1]+0.01
        m = (t >= r) & (t <= nxt)
        y[m] = np.exp(-(t[m]-r)/dec)
    ax.plot(t, y, color=RED, lw=2.2, label="spaced review")
    for r in reviews[1:]:
        ax.axvline(r, color=RED, ls=":", lw=1)
    ax.annotate("each review resets\nAND flattens the curve", (15.2, 0.10), fontsize=10, color=RED)
    ax.set_xlabel("days since learning"); ax.set_ylabel("retention")
    # 顶部留白给图例，避免压在曲线峰上
    ax.set_ylim(0, 1.30); ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax.legend(frameon=False, loc="upper right", fontsize=9)
    save(fig, "psy-09-forgetting")

# ---------- 10.1 前景理论 ----------
def fig_prospect():
    x = np.linspace(-10, 10, 500)
    alpha, beta_, lam = 0.88, 0.88, 2.25
    v = np.where(x >= 0, x**alpha, -lam*(-x)**beta_)
    fig, ax = plt.subplots(figsize=(5.8, 4.6))
    ax.plot(x, v, color=ACC, lw=2.4)
    ax.axhline(0, color=GRID, lw=0.9); ax.axvline(0, color=GRID, lw=0.9)
    ax.annotate("reference point", (0.3, 1.0), fontsize=10, color=INK)
    ax.annotate("gains: concave\n(risk averse)", (3.4, 2.4), fontsize=10, color=INK)
    ax.annotate("losses: convex & steeper\n(risk seeking, loss averse)", (-9.6, -12.5),
                fontsize=10, color=RED)
    # 对称参考线
    ax.plot([5, 5], [0, 5**alpha], color=GREEN, lw=1, ls=":")
    ax.plot([-5, -5], [0, -lam*5**beta_], color=RED, lw=1, ls=":")
    ax.annotate("+$5 gain", (5.2, 1.6), fontsize=9, color=GREEN)
    ax.annotate("$-$$5 loss hurts ~2$\\times$ more", (-9.8, -6.5), fontsize=9, color=RED)
    ax.set_xlabel("outcome relative to reference"); ax.set_ylabel("subjective value")
    save(fig, "psy-10-prospect")

# ---------- 11.1 IQ 分布 + r=0.4 散点 ----------
def fig_iq():
    from scipy.stats import norm
    fig, axes = plt.subplots(1, 2, figsize=(9.2, 3.9))
    ax = axes[0]
    x = np.linspace(40, 160, 400)
    ax.plot(x, norm.pdf(x, 100, 15), color=ACC, lw=2.2)
    for lo, hi, a in [(85, 115, .35), (70, 130, .18)]:
        m = (x >= lo) & (x <= hi)
        ax.fill_between(x[m], norm.pdf(x[m], 100, 15), color=ACC2, alpha=a)
    ax.annotate("68%", (100, 0.009), ha="center", fontsize=10)
    ax.annotate("95%", (100, 0.0035), ha="center", fontsize=10)
    ax.set_xlabel("IQ score"); ax.set_yticks([])
    ax.set_title("mean 100, SD 15", fontsize=11)
    ax = axes[1]
    rng = np.random.default_rng(11)
    n, r = 400, 0.4
    a = rng.normal(0, 1, n); b = r*a + np.sqrt(1-r**2)*rng.normal(0, 1, n)
    ax.scatter(a*15+100, b, s=14, color=ACC, alpha=.55)
    xs = np.linspace(-3, 3, 20)
    ax.plot(xs*15+100, r*xs, color=RED, lw=2.0)
    ax.set_xlabel("IQ score"); ax.set_ylabel("life outcome (z)")
    ax.set_title("$r = 0.4$: real but a wide cloud", fontsize=11)
    save(fig, "psy-11-iq")

# ---------- 13.1 Yerkes-Dodson ----------
def fig_yerkes():
    x = np.linspace(0, 10, 400)
    easy = 1/(1+np.exp(-(x-2.2)))*0.95
    hard = np.exp(-((x-3.2)**2)/6.0)
    fig, ax = plt.subplots(figsize=(6.4, 4.0))
    ax.plot(x, hard, color=ACC, lw=2.4, label="complex task")
    ax.plot(x, easy, color=ACC2, lw=2.2, ls="--", label="simple / well-learned task")
    ax.axvline(3.2, color=RED, ls=":", lw=1.2)
    ax.annotate("optimum shifts left\nas task gets harder", (3.5, 0.55), fontsize=10, color=RED)
    ax.set_xlabel("arousal"); ax.set_ylabel("performance")
    ax.set_xticks([]); ax.set_yticks([])
    ax.legend(frameon=False, loc="lower center", fontsize=9)
    save(fig, "psy-13-yerkes")

# ---------- 14.1 大五 ----------
def fig_bigfive():
    labels = ["O\nopenness", "C\nconscient.", "E\nextraversion",
              "A\nagreeable.", "N\nneuroticism"]
    vals_a = [0.8, 0.75, 0.35, 0.6, 0.3]
    vals_b = [0.45, 0.4, 0.85, 0.5, 0.7]
    ang = np.linspace(0, 2*np.pi, len(labels), endpoint=False)
    ang = np.concatenate([ang, ang[:1]])
    fig, ax = plt.subplots(figsize=(5.4, 5.0), subplot_kw=dict(polar=True))
    for vals, c, lab in [(vals_a, ACC, "person A"), (vals_b, RED, "person B")]:
        v = np.array(vals + vals[:1])
        ax.plot(ang, v, color=c, lw=2.0, label=lab)
        ax.fill(ang, v, color=c, alpha=.13)
    ax.set_xticks(ang[:-1]); ax.set_xticklabels(labels, fontsize=10)
    ax.set_yticks([0.25, 0.5, 0.75]); ax.set_yticklabels([])
    ax.set_ylim(0, 1)
    ax.legend(frameon=False, loc="upper right", bbox_to_anchor=(1.15, 1.1), fontsize=9)
    save(fig, "psy-14-bigfive")

# ---------- 17.1 治疗效应量对比 ----------
def fig_therapy():
    items = [
        ("psychotherapy\n(overall vs control)", 0.50, ACC),
        ("CBT for anxiety", 0.60, ACC),
        ("antidepressants\n(vs placebo, all severity)", 0.30, ACC2),
        ("exercise for depression\n(estimates vary)", 0.40, ACC2),
        ("growth mindset\n(academic)", 0.08, RED),
        ("ego depletion\n(multi-lab)", 0.02, RED),
    ]
    fig, ax = plt.subplots(figsize=(6.8, 4.2))
    ys = np.arange(len(items))[::-1]
    for y, (lab, d, c) in zip(ys, items):
        ax.barh(y, d, color=c, height=.55)
        ax.annotate(f"d = {d:.2f}", (d+0.015, y), va="center", fontsize=10)
    ax.set_yticks(ys); ax.set_yticklabels([i[0] for i in items], fontsize=9.5)
    for v, lab in [(0.2, "small"), (0.5, "medium"), (0.8, "large")]:
        ax.axvline(v, color=GRID, ls=":", lw=1)
        ax.annotate(lab, (v, len(items)-0.35), fontsize=9, ha="center", color=INK)
    ax.set_xlabel("effect size $d$"); ax.set_xlim(0, 0.9)
    save(fig, "psy-17-therapy")

# ---------- 18.1 压力反应与恢复 ----------
def fig_stress():
    t = np.linspace(0, 12, 500)
    acute = 1.6*np.exp(-((t-2)**2)/0.6) + 0.15
    chronic = 0.15 + 0.9/(1+np.exp(-(t-2)*3)) - 0.25*np.exp(-((t-11)/3)**2)
    fig, ax = plt.subplots(figsize=(6.6, 4.0))
    ax.plot(t, acute, color=ACC, lw=2.3, label="acute stress: spike + recovery")
    ax.plot(t, chronic, color=RED, lw=2.3, label="chronic stress: no return to baseline")
    ax.axhline(0.15, color=GRID, ls="--", lw=1)
    ax.annotate("baseline", (0.1, 0.22), fontsize=10, color=INK)
    ax.annotate("allostatic load\naccumulates here", (7.2, 1.0), fontsize=10, color=RED)
    ax.set_xlabel("time"); ax.set_ylabel("cortisol / arousal (a.u.)")
    ax.set_yticks([]); ax.legend(frameon=False, fontsize=9)
    save(fig, "psy-18-stress")

if __name__ == "__main__":
    fig_replication(); fig_sleep(); fig_sdt(); fig_conditioning(); fig_forgetting()
    fig_prospect(); fig_iq(); fig_yerkes(); fig_bigfive(); fig_therapy(); fig_stress()
    print("all psych figures done")
