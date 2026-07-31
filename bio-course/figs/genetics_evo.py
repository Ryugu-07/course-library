"""线三+线四图：遗传力回归 / 漂变 / GWAS Manhattan / 适应度景观 / 分子钟 / 溯祖树。
运行：cd figs && ~/ai-course/.venv/bin/python genetics_evo.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

rng = np.random.default_rng(11)

# ── 图 10-1 · 亲子回归与遗传力 ────────────────────────────
def heritability():
    fig, axes = plt.subplots(1, 2, figsize=(9.4, 4.2), sharey=True, sharex=True)
    for ax, h2, lab in [(axes[0], 0.8, "high heritability  $h^2=0.8$"),
                        (axes[1], 0.25, "low heritability  $h^2=0.25$")]:
        mp = rng.normal(0, 1, 260)                    # midparent (标准化)
        off = h2*mp + rng.normal(0, np.sqrt(1-h2**2), 260)
        ax.scatter(mp, off, s=11, color=ACC2, alpha=0.6, edgecolors="none")
        xs = np.linspace(-3, 3, 50)
        ax.plot(xs, h2*xs, color=RED, lw=2.2)
        ax.set_xlabel("midparent phenotype  (SD)")
        ax.set_title(lab, color=INK, fontsize=11.5)
        ax.axhline(0, color="#ccc", lw=.8); ax.axvline(0, color="#ccc", lw=.8)
    axes[0].set_ylabel("offspring phenotype  (SD)")
    axes[0].annotate(r"slope $=h^2$", xy=(1.6, 1.28), xytext=(-2.6, 2.1),
                     fontsize=11, color=RED,
                     arrowprops=dict(arrowstyle="->", color=RED))
    fig.tight_layout()
    save(fig, "bio_heritability")

# ── 图 11-1 · 遗传漂变 ────────────────────────────────────
def drift():
    def sim(N, gens=160, reps=14, p0=0.5):
        out = []
        for _ in range(reps):
            p, traj = p0, [p0]
            for _ in range(gens):
                p = rng.binomial(2*N, p)/(2*N)
                traj.append(p)
            out.append(traj)
        return np.array(out)
    fig, axes = plt.subplots(1, 2, figsize=(9.4, 4.2), sharey=True)
    for ax, N in [(axes[0], 25), (axes[1], 500)]:
        for traj in sim(N):
            ax.plot(traj, lw=1.3, alpha=0.8,
                    color=ACC if traj[-1] not in (0.0, 1.0) else ACC2)
        ax.set_xlabel("generation")
        ax.set_title(f"$N={N}$", color=INK, fontsize=12)
        ax.set_ylim(-0.02, 1.02)
        ax.axhline(1, color="#bbb", ls=":", lw=1)
        ax.axhline(0, color="#bbb", ls=":", lw=1)
    axes[0].set_ylabel("allele frequency  $p$")
    axes[0].text(80, 0.93, "fixation", fontsize=9.5, color="#666")
    axes[0].text(80, 0.04, "loss", fontsize=9.5, color="#666")
    fig.tight_layout()
    save(fig, "bio_drift")

# ── 图 12-1 · GWAS Manhattan ─────────────────────────────
def gwas():
    fig, ax = plt.subplots(figsize=(7.6, 4.0))
    n_chr, pos_all, p_all, col_all = 22, [], [], []
    offset, ticks, tlabels = 0, [], []
    for c in range(1, n_chr+1):
        n = int(2600*np.exp(-c/16))+260
        x = np.arange(n)+offset
        logp = rng.exponential(0.62, n)                # 背景
        # 少数真实信号（塔尖，含 LD 带起的邻居）
        if c in (2, 6, 9, 16):
            k = rng.integers(30, n-30)
            width = 26
            idx = np.arange(k-width, k+width)
            peak = 9 + rng.uniform(0, 5)
            logp[idx] += peak*np.exp(-((idx-k)/9.0)**2)
        pos_all.append(x); p_all.append(logp)
        col_all.append(ACC if c % 2 else ACC2)
        ticks.append(offset+n/2); tlabels.append(str(c) if c <= 12 or c % 2 else "")
        offset += n + 220
    for x, y, c in zip(pos_all, p_all, col_all):
        ax.scatter(x, y, s=2.4, color=c, alpha=0.75, edgecolors="none")
    ax.axhline(-np.log10(5e-8), color=RED, lw=1.5, ls="--")
    ax.text(offset*0.012, -np.log10(5e-8)+0.45, r"$p=5\times10^{-8}$",
            color=RED, fontsize=10)
    ax.set_xticks(ticks); ax.set_xticklabels(tlabels, fontsize=8.5)
    ax.set_xlabel("chromosome")
    ax.set_ylabel(r"$-\log_{10} p$")
    ax.set_title("GWAS Manhattan plot", color=INK)
    ax.set_xlim(-200, offset); ax.set_ylim(0, 16)
    save(fig, "bio_gwas")

# ── 图 15-1 · 适应度景观 ──────────────────────────────────
def landscape():
    x = np.linspace(0, 10, 700)
    w = (1.0*np.exp(-((x-2.2)/0.95)**2) + 1.6*np.exp(-((x-6.6)/1.15)**2)
         + 0.55*np.exp(-((x-9.2)/0.7)**2))
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    ax.plot(x, w, color=ACC, lw=2.6)
    ax.fill_between(x, 0, w, color=ACC2, alpha=0.22)
    ax.plot([2.2], [1.0], "o", color=RED, ms=9, zorder=5)
    ax.plot([6.6], [1.6], "o", color=GREEN, ms=9, zorder=5)
    ax.annotate("local peak\n(population stuck here)", xy=(2.2, 1.0),
                xytext=(0.2, 1.42), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.annotate("global peak", xy=(6.6, 1.6), xytext=(7.4, 1.72),
                fontsize=9.5, color=GREEN,
                arrowprops=dict(arrowstyle="->", color=GREEN))
    ax.annotate("fitness valley\n(selection cannot cross)", xy=(4.4, 0.18),
                xytext=(3.15, 0.62), fontsize=9.5, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.set_xlabel("genotype / phenotype space")
    ax.set_ylabel("fitness")
    ax.set_title("Adaptive landscape: selection climbs locally", color=INK, fontsize=12.5)
    ax.set_ylim(0, 2.0); ax.set_xticks([])
    save(fig, "bio_landscape")

# ── 图 16-1 · 分子钟 ─────────────────────────────────────
def molclock():
    t = np.linspace(0, 100, 400)                       # Myr
    def divergence(rate):                              # Jukes-Cantor 饱和
        p = 0.75*(1-np.exp(-4*rate*t/3))
        return p
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    ax.plot(t, divergence(0.010)*100, color=ACC2, lw=2.2, label="synonymous sites (fast)")
    ax.plot(t, divergence(0.0032)*100, color=ACC, lw=2.4, label="average protein")
    ax.plot(t, divergence(0.0009)*100, color=GREEN, lw=2.0, label="constrained gene (slow)")
    ax.plot(t, 0.010*t*100*0.75*4/3*0.75, "--", color="#999", lw=1.2,
            label="linear expectation")
    ax.set_xlabel("divergence time  (million years)")
    ax.set_ylabel("sequence divergence  (%)")
    ax.set_title("The molecular clock (and its saturation)", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    ax.set_ylim(0, 62)
    save(fig, "bio_molclock")

# ── 图 17-1 · 溯祖树 ─────────────────────────────────────
def coalescent():
    n = 8
    # 生成合并时间 T_k ~ Exp(C(k,2))，k = n..2
    ts, t = [], 0.0
    for k in range(n, 1, -1):
        t += rng.exponential(1.0/(k*(k-1)/2))
        ts.append(t)
    # 逐步合并：维护当前节点 (x 位置, 出生时间)
    nodes = [(i*1.0, 0.0) for i in range(n)]
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    for depth, tk in enumerate(ts):
        i, j = sorted(rng.choice(len(nodes), 2, replace=False))
        (x1, t1), (x2, t2) = nodes[i], nodes[j]
        ax.plot([x1, x1], [t1, tk], color=ACC, lw=1.7)
        ax.plot([x2, x2], [t2, tk], color=ACC, lw=1.7)
        ax.plot([x1, x2], [tk, tk], color=ACC, lw=1.7)
        newx = (x1+x2)/2
        nodes = [nd for m, nd in enumerate(nodes) if m not in (i, j)]
        nodes.append((newx, tk))
    ax.plot([nodes[0][0]], [ts[-1]], "o", color=RED, ms=9, zorder=5)
    ax.annotate("MRCA", xy=(nodes[0][0], ts[-1]), xytext=(nodes[0][0]+1.1, ts[-1]*0.97),
                fontsize=10.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    for i in range(n):
        ax.text(i*1.0, -ts[-1]*0.045, f"{i+1}", ha="center", fontsize=9, color="#666")
    ax.set_ylabel(r"time into the past  (units of $2N$ generations)")
    ax.set_xlabel("sampled sequences")
    ax.set_title("The coalescent: genealogy of a sample", color=INK, fontsize=12.5)
    ax.set_xticks([])
    ax.set_ylim(-ts[-1]*0.09, ts[-1]*1.1)
    save(fig, "bio_coalescent")

if __name__ == "__main__":
    heritability(); drift(); gwas(); landscape(); molclock(); coalescent()
