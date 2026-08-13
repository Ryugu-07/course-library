"""三新页配图：退相干 / 冷原子 / 能标阶梯。
运行：cd figs && ~/ai-course/.venv/bin/python physics_new3.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── oqs-01 · Bloch 球收缩 + T1/T2 衰减 ──────────────────
def decoherence():
    fig = plt.figure(figsize=(10.0, 4.2))
    a1 = fig.add_subplot(1, 2, 1, projection="3d")
    # Bloch 球
    u, v = np.mgrid[0:2*np.pi:60j, 0:np.pi:30j]
    a1.plot_surface(np.cos(u)*np.sin(v), np.sin(u)*np.sin(v), np.cos(v),
                    color=ACC2, alpha=0.13, linewidth=0)
    for r, c, lw, lab in [(1.0, ACC, 2.2, "pure state"),
                          (0.55, RED, 2.0, "partially mixed"),
                          (0.12, GREEN, 1.8, "fully mixed")]:
        th = np.linspace(0, 2*np.pi, 200)
        a1.plot(r*np.cos(th), r*np.sin(th), 0, color=c, lw=lw, label=lab)
    a1.quiver(0, 0, 0, 0.75, 0.35, 0.5, color=INK, lw=2, arrow_length_ratio=.12)
    a1.set_xlim(-1, 1); a1.set_ylim(-1, 1); a1.set_zlim(-1, 1)
    a1.set_xticks([]); a1.set_yticks([]); a1.set_zticks([])
    a1.set_title("Bloch sphere: decoherence shrinks the vector",
                 color=INK, fontsize=11)
    a1.legend(frameon=False, fontsize=8.5, loc="upper left")
    a1.set_box_aspect((1, 1, 1))
    # T1/T2
    a2 = fig.add_subplot(1, 2, 2)
    t = np.linspace(0, 6, 500)
    T1, T2 = 3.0, 0.8
    a2.plot(t, np.exp(-t/T1), color=ACC, lw=2.6,
            label=r"population  $e^{-t/T_1}$")
    a2.plot(t, np.exp(-t/T2), color=RED, lw=2.6,
            label=r"coherence  $e^{-t/T_2}$")
    a2.plot(t, np.exp(-t/T2)*np.cos(9*t), color=RED, lw=0.9, alpha=.45)
    a2.axhline(1/np.e, color="#999", ls=":", lw=1.2)
    a2.text(5.1, 0.40, "$1/e$", fontsize=9.5, color="#666")
    a2.annotate(r"$T_2\leq 2T_1$", xy=(T2, 1/np.e), xytext=(1.9, 0.72),
                fontsize=11, color=INK,
                arrowprops=dict(arrowstyle="->", color="#888"))
    a2.set_xlabel("time"); a2.set_ylabel("normalized signal")
    a2.set_title("Example parameters: coherence decays first", color=INK, fontsize=11)
    a2.legend(frameon=False, fontsize=9.5)
    a2.set_ylim(-0.55, 1.05)
    fig.tight_layout()
    save(fig, "oqs-01-decoherence", reproducible=True)

# ── amo-01 · 多普勒冷却力 + BEC 双峰 ────────────────────
def cold_atoms():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(10.0, 4.2))
    # 光学粘胶：两束对射的散射力之和
    v = np.linspace(-6, 6, 600)
    delta, G = -1.0, 1.0          # 失谐(单位 Γ)、线宽
    def force(v, sign):
        # sign=+1 的光束沿 +x 推；原子速度 v 使其感受失谐 δ-sign*k v
        d = delta - sign*v
        return sign*1.0/(1 + 4*d**2/G**2)
    # 每支 force() 已含各自方向的符号，净力是两者之和
    F = force(v, +1) + force(v, -1)
    a1.plot(v, force(v, +1), "--", color=ACC2, lw=1.6, label="beam →")
    a1.plot(v, force(v, -1), "--", color=GREEN, lw=1.6, label="beam ←")
    a1.plot(v, F, color=ACC, lw=2.8, label="net force")
    lin = v[np.abs(v) < 1.2]
    slope = (F[np.argmin(np.abs(v-0.2))]-F[np.argmin(np.abs(v+0.2))])/0.4
    a1.plot(lin, slope*lin, ":", color=RED, lw=1.8, label=r"$F\approx-\alpha v$")
    a1.axhline(0, color="#bbb", lw=.9); a1.axvline(0, color="#bbb", lw=.9)
    a1.set_xlabel(r"atomic velocity  $v$  (units of $\Gamma/k$)")
    a1.set_ylabel("scattering force  (arb.)")
    a1.set_title("Optical molasses: damping from Doppler shift",
                 color=INK, fontsize=11)
    a1.legend(frameon=False, fontsize=9)
    # BEC 双峰
    x = np.linspace(-4, 4, 700)
    thermal = np.exp(-x**2/2.4)
    cond = np.exp(-x**2/0.10)
    for frac, c, lab, off in [(0.0, ACC2, r"$T>T_c$: thermal", 0.0),
                              (0.45, RED, r"$T\approx T_c$", 0.0),
                              (0.9, ACC, r"$T\ll T_c$: BEC", 0.0)]:
        prof = (1-frac)*thermal + frac*1.0*cond
        a2.plot(x, prof/prof.max()+off, color=c, lw=2.5, label=lab)
    a2.set_xlabel("velocity / position after expansion")
    a2.set_ylabel("column density (norm.)")
    a2.set_title("BEC signature: bimodal distribution", color=INK, fontsize=11)
    a2.legend(frameon=False, fontsize=9.5)
    a2.annotate("sharp condensate peak", xy=(0, 0.97), xytext=(1.1, 0.80),
                fontsize=9, color=ACC, arrowprops=dict(arrowstyle="->", color=ACC))
    fig.tight_layout()
    save(fig, "amo-01-cold-atoms")

# ── beyond-01 · 能标阶梯 ────────────────────────────────
def scales():
    fig, ax = plt.subplots(figsize=(7.4, 4.4))
    items = [("chemistry\n(eV)", 1e-9, GREEN), ("nuclear\n(MeV)", 1e-3, GREEN),
             ("LHC\n($10^4$ GeV)", 1e4, ACC), ("GUT?\n($10^{16}$)", 1e16, RED),
             ("Planck\n($10^{19}$)", 1.2e19, RED)]
    for lab, E, c in items:
        ax.plot([E, E], [0, 1], color=c, lw=2.4)
        ax.plot(E, 1, "o", color=c, ms=9)
        ax.text(E, 1.10, lab, ha="center", fontsize=9.5, color=c)
    ax.axvspan(1e-10, 1e4, color=GREEN, alpha=.10)
    ax.axvspan(1e4, 3e19, color=RED, alpha=.08)
    ax.text(3e-6, 0.45, "experimentally\nverified", fontsize=11, color=GREEN,
            ha="center")
    ax.text(1e11, 0.45, "no direct experiment\n≈15 orders of magnitude",
            fontsize=11, color=RED, ha="center")
    ax.annotate("", xy=(1e4, 0.22), xytext=(1.2e19, 0.22),
                arrowprops=dict(arrowstyle="<->", color=RED, lw=2))
    ax.set_xscale("log")
    ax.set_xlim(1e-10, 3e20); ax.set_ylim(0, 1.35)
    ax.set_xlabel("energy scale  (GeV, log)")
    ax.set_yticks([])
    ax.set_title("The gap that makes quantum gravity hard", color=INK, fontsize=12.5)
    for s in ["left", "right", "top"]:
        ax.spines[s].set_visible(False)
    save(fig, "beyond-01-scales")

if __name__ == "__main__":
    decoherence(); cold_atoms(); scales()
