"""机械七图：应力应变 / 截面效率 / 屈曲 / 共振 / 转子 / 齿轮失效 / S-N / 泵工作点 / 颤振叶瓣。
运行：cd figs && ~/ai-course/.venv/bin/python mech.py"""
import numpy as np
import matplotlib.patches as mpatches
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 2-1 · 应力应变曲线 ───────────────────────────────
def stress_strain():
    fig, ax = plt.subplots(figsize=(6.8, 4.4))
    # 延性金属
    e1 = np.linspace(0, 0.002, 60); s1 = 210000*e1
    e2 = np.linspace(0.002, 0.02, 80); s2 = 420 + 0*e2       # 屈服平台
    e3 = np.linspace(0.02, 0.16, 200)
    s3 = 420 + 250*(1-np.exp(-(e3-0.02)/0.05))               # 强化
    e4 = np.linspace(0.16, 0.24, 100)
    s4 = s3[-1] - 120*((e4-0.16)/0.08)**1.6                  # 颈缩
    E = np.concatenate([e1, e2, e3, e4]); S = np.concatenate([s1, s2, s3, s4])
    ax.plot(E, S, color=ACC, lw=2.6, label="ductile (mild steel)")
    ax.plot([E[-1]], [S[-1]], "x", color=ACC, ms=11, mew=2.5)
    # 脆性
    eb = np.linspace(0, 0.012, 120); sb = 160000*eb - 1.6e6*eb**2
    ax.plot(eb, sb, color=RED, lw=2.4, label="brittle (cast iron)")
    ax.plot([eb[-1]], [sb[-1]], "x", color=RED, ms=11, mew=2.5)
    # 0.2% offset
    eo = np.linspace(0.002, 0.006, 20)
    ax.plot(eo, 210000*(eo-0.002), "--", color="#888", lw=1.3)
    ax.annotate(r"$\sigma_{0.2}$", xy=(0.0032, 420), xytext=(0.012, 300),
                fontsize=11, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.annotate("necking", xy=(0.20, 600), xytext=(0.155, 720),
                fontsize=9.5, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.annotate("fracture", xy=(E[-1], S[-1]), xytext=(0.20, 380),
                fontsize=9.5, color="#555",
                arrowprops=dict(arrowstyle="->", color="#888"))
    ax.set_xlabel("strain  $\\varepsilon$"); ax.set_ylabel("stress  $\\sigma$  (MPa)")
    ax.set_title("Stress-strain: ductile vs brittle", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10, loc="lower right")
    ax.set_xlim(0, 0.26); ax.set_ylim(0, 780)
    save(fig, "mec_stress_strain")

# ── 图 3-1 · 截面抗弯效率 ───────────────────────────────
def section():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 4.0),
                                 gridspec_kw={"width_ratios": [1.15, 1]})
    A = 1.0
    # 各截面在等面积下的 W（归一化到实心圆）
    names = ["solid\ncircle", "solid\nsquare", "tube\n(d/D=0.7)", "I-beam"]
    W = [1.0, 1.12, 2.05, 3.1]
    # 左：示意图形
    def draw(ax, x, kind):
        c = ACC2
        if kind == 0:
            ax.add_patch(mpatches.Circle((x, 0.5), 0.30, fc=c, ec=ACC, lw=1.6))
        elif kind == 1:
            ax.add_patch(mpatches.Rectangle((x-0.27, 0.23), 0.54, 0.54, fc=c, ec=ACC, lw=1.6))
        elif kind == 2:
            ax.add_patch(mpatches.Circle((x, 0.5), 0.36, fc=c, ec=ACC, lw=1.6))
            ax.add_patch(mpatches.Circle((x, 0.5), 0.25, fc="white", ec=ACC, lw=1.4))
        else:
            ax.add_patch(mpatches.Rectangle((x-0.30, 0.72), 0.60, 0.12, fc=c, ec=ACC, lw=1.5))
            ax.add_patch(mpatches.Rectangle((x-0.30, 0.16), 0.60, 0.12, fc=c, ec=ACC, lw=1.5))
            ax.add_patch(mpatches.Rectangle((x-0.055, 0.28), 0.11, 0.44, fc=c, ec=ACC, lw=1.5))
    for i, x in enumerate([0.6, 1.7, 2.8, 3.9]):
        draw(a1, x, i)
        a1.text(x, 0.02, names[i], ha="center", fontsize=9.5, color=INK)
    a1.axhline(0.5, color=RED, ls="--", lw=1.2)
    a1.text(4.35, 0.53, "neutral\naxis", fontsize=9, color=RED)
    a1.set_xlim(0.1, 4.6); a1.set_ylim(-0.08, 1.0)
    a1.set_xticks([]); a1.set_yticks([])
    for s in a1.spines.values():
        s.set_visible(False)
    a1.set_title("Same area, different shape", color=INK, fontsize=12)
    # 右：柱状对比
    a2.bar(range(4), W, color=[ACC2, ACC2, ACC, ACC], width=0.6)
    a2.set_xticks(range(4)); a2.set_xticklabels(names, fontsize=9)
    a2.set_ylabel("section modulus $W$  (normalized)")
    a2.set_title("Bending capacity at equal weight", color=INK, fontsize=12)
    for i, v in enumerate(W):
        a2.text(i, v+0.07, f"{v:.2f}×", ha="center", fontsize=10, color=INK)
    a2.set_ylim(0, 3.7)
    fig.tight_layout()
    save(fig, "mec_section")

# ── 图 4-1 · 屈曲：临界应力 vs 柔度 ─────────────────────
def buckling():
    lam = np.linspace(10, 200, 500)
    E, sy = 210000.0, 300.0
    euler = np.pi**2*E/lam**2
    lam_p = np.pi*np.sqrt(E/sy)
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    ax.plot(lam[lam >= lam_p], euler[lam >= lam_p], color=ACC, lw=2.6,
            label=r"Euler:  $\sigma_{cr}=\pi^2E/\lambda^2$")
    ax.plot(lam[lam < lam_p], np.full((lam < lam_p).sum(), sy), color=RED, lw=2.6,
            label=r"yield-controlled:  $\sigma_{cr}=\sigma_y$")
    # 中柔度经验过渡
    lam_m = np.linspace(60, lam_p, 100)
    ax.plot(lam_m, sy - (sy-np.pi**2*E/lam_p**2)*((lam_m-60)/(lam_p-60))**1.4,
            "--", color=GREEN, lw=2.0, label="empirical (inelastic)")
    ax.axvline(lam_p, color="#999", ls=":", lw=1.3)
    ax.text(lam_p+3, 250, r"$\lambda_p$", fontsize=12, color="#666")
    ax.text(25, 320, "short:\nstrength", fontsize=9.5, color=RED)
    ax.text(140, 120, "slender:\nbuckling", fontsize=9.5, color=ACC)
    ax.set_xlabel(r"slenderness  $\lambda=\mu L/i$")
    ax.set_ylabel(r"critical stress  $\sigma_{cr}$  (MPa)")
    ax.set_title("Buckling vs strength control", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_ylim(0, 400)
    save(fig, "mec_buckling")

# ── 图 7-1 · 共振放大因子 ───────────────────────────────
def resonance():
    r = np.linspace(0, 3.2, 900)
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    for z, c, lab in [(0.02, RED, r"$\zeta=0.02$"), (0.05, "#a05a7a", r"$\zeta=0.05$"),
                      (0.10, ACC, r"$\zeta=0.10$"), (0.30, GREEN, r"$\zeta=0.30$")]:
        M = 1/np.sqrt((1-r**2)**2 + (2*z*r)**2)
        ax.plot(r, M, color=c, lw=2.2, label=lab)
    ax.axvline(1, color="#999", ls=":", lw=1.2)
    ax.axvline(np.sqrt(2), color=GREEN, ls="--", lw=1.3)
    ax.axhline(1, color="#bbb", ls=":", lw=1.0)
    ax.text(1.02, 22, "resonance", fontsize=9.5, color="#666")
    ax.text(np.sqrt(2)+0.05, 14, r"$r=\sqrt{2}$" "\nisolation begins",
            fontsize=9, color=GREEN)
    ax.text(0.15, 3.2, "stiffness\ncontrolled", fontsize=9, color="#666")
    ax.text(2.5, 3.2, "mass\ncontrolled", fontsize=9, color="#666")
    ax.set_xlabel(r"frequency ratio  $r=\omega/\omega_n$")
    ax.set_ylabel("magnification factor")
    ax.set_title("Forced vibration: only damping helps at resonance", color=INK, fontsize=12)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_ylim(0, 27)
    save(fig, "mec_resonance")

# ── 图 9-1 · 转子响应与自动对中 ─────────────────────────
def rotor():
    r = np.linspace(0, 4, 900)
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    for z, c, lab in [(0.03, RED, r"$\zeta=0.03$"), (0.10, ACC, r"$\zeta=0.10$"),
                      (0.25, GREEN, r"$\zeta=0.25$")]:
        A = r**2/np.sqrt((1-r**2)**2+(2*z*r)**2)
        ax.plot(r, A, color=c, lw=2.3, label=lab)
    ax.axhline(1, color="#999", ls="--", lw=1.3)
    ax.axvline(1, color="#bbb", ls=":", lw=1.2)
    ax.text(2.55, 1.10, r"$A/e \to 1$: self-centering", fontsize=10, color=INK)
    ax.text(1.04, 6.2, "critical\nspeed", fontsize=9.5, color="#666")
    ax.annotate("supercritical operation", xy=(3.2, 1.02), xytext=(2.2, 3.4),
                fontsize=9.5, color=GREEN,
                arrowprops=dict(arrowstyle="->", color=GREEN))
    ax.set_xlabel(r"speed ratio  $\omega/\omega_n$")
    ax.set_ylabel(r"whirl amplitude  $A/e$")
    ax.set_title("Jeffcott rotor: faster can be smoother", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_ylim(0, 8)
    save(fig, "mec_rotor")

# ── 图 11-1 · 齿轮两种失效 ──────────────────────────────
def gear():
    fig, ax = plt.subplots(figsize=(7.0, 4.4))
    # 齿廓示意（两个齿）
    def tooth(x0, y0, h=1.0, w=0.55):
        pts = [(x0-w, y0), (x0-w*0.62, y0+h*0.86), (x0-w*0.26, y0+h),
               (x0+w*0.26, y0+h), (x0+w*0.62, y0+h*0.86), (x0+w, y0)]
        return pts
    for i, x0 in enumerate([1.0, 2.4]):
        ax.add_patch(mpatches.Polygon(tooth(x0, 1.5), closed=False,
                     fill=False, ec=ACC, lw=2.2))
    ax.plot([0.2, 3.2], [1.5, 1.5], color=ACC, lw=2.2)
    # 齿根裂纹
    ax.plot([1.0-0.55, 1.0-0.42], [1.5, 1.62], color=RED, lw=2.6)
    ax.annotate("bending fatigue:\ncrack at root fillet\n→ tooth breakage",
                xy=(0.47, 1.55), xytext=(0.05, 2.55), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    # 齿面点蚀
    rng = np.random.default_rng(2)
    px = 2.4 + rng.uniform(-0.2, 0.24, 14)
    py = 1.5 + rng.uniform(0.45, 0.88, 14)
    ax.plot(px, py, "o", color="#8a5a2b", ms=3.6)
    ax.annotate("contact fatigue:\nsubsurface cracks\n→ pitting/spalling",
                xy=(2.55, 2.0), xytext=(3.35, 2.55), fontsize=9.5, color="#8a5a2b",
                arrowprops=dict(arrowstyle="->", color="#8a5a2b"))
    ax.text(0.3, 0.75, r"$\sigma_F \propto 1/m$ → increase module",
            fontsize=10, color=RED)
    ax.text(0.3, 0.35, r"$\sigma_H$ → increase diameter or surface hardness",
            fontsize=10, color="#8a5a2b")
    ax.set_xlim(0, 5.4); ax.set_ylim(0.1, 3.2)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title("Two distinct gear failure modes", color=INK, fontsize=12.5)
    save(fig, "mec_gear")

# ── 图 14-1 · S-N 曲线 ──────────────────────────────────
def sn_curve():
    N = np.logspace(3, 9, 400)
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    steel = np.maximum(700*N**(-0.085), 300)
    alu = 420*N**(-0.115)
    ax.loglog(N, steel, color=ACC, lw=2.6, label="steel (has endurance limit)")
    ax.loglog(N, alu, color=RED, lw=2.4, label="aluminium (no endurance limit)")
    ax.axhline(300, color=ACC2, ls="--", lw=1.4)
    ax.text(2e8, 320, r"$\sigma_{-1}$", fontsize=12, color=ACC)
    ax.axvline(1e7, color="#bbb", ls=":", lw=1.2)
    ax.text(1.2e7, 620, "$10^7$", fontsize=9.5, color="#666")
    ax.annotate("keeps falling —\nfinite life only", xy=(3e8, alu[N.searchsorted(3e8)]),
                xytext=(2e6, 130), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel("cycles to failure  $N$  (log)")
    ax.set_ylabel("stress amplitude  (MPa, log)")
    ax.set_title("S-N curves: a crucial difference", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_ylim(80, 900)
    save(fig, "mec_sn")

# ── 图 13-1 · 泵与管路工作点 ────────────────────────────
def pump():
    Q = np.linspace(0, 100, 400)
    H_pump = 50 - 0.0035*Q**2
    H_sys1 = 10 + 0.0042*Q**2
    H_sys2 = 10 + 0.0100*Q**2     # 节流后
    eff = 0.82*np.exp(-((Q-58)/34)**2)
    fig, ax = plt.subplots(figsize=(6.9, 4.4))
    ax.plot(Q, H_pump, color=ACC, lw=2.6, label="pump curve")
    ax.plot(Q, H_sys1, color=RED, lw=2.2, label="system curve")
    ax.plot(Q, H_sys2, "--", color="#a05a7a", lw=1.9, label="system, throttled")
    # 工作点
    i1 = np.argmin(np.abs(H_pump-H_sys1)); i2 = np.argmin(np.abs(H_pump-H_sys2))
    ax.plot([Q[i1]], [H_pump[i1]], "o", color=INK, ms=9, zorder=5)
    ax.plot([Q[i2]], [H_pump[i2]], "o", color="#a05a7a", ms=8, zorder=5)
    ax.annotate("operating point", xy=(Q[i1], H_pump[i1]), xytext=(Q[i1]-38, H_pump[i1]+12),
                fontsize=10, color=INK, arrowprops=dict(arrowstyle="->", color="#666"))
    ax2 = ax.twinx()
    ax2.plot(Q, eff*100, ":", color=GREEN, lw=2.0)
    ax2.set_ylabel("efficiency  (%)", color=GREEN)
    ax2.tick_params(axis="y", colors=GREEN)
    ax2.set_ylim(0, 100)
    ax.set_xlabel("flow rate  $Q$"); ax.set_ylabel("head  $H$  (m)")
    ax.set_title("Pump selection: where the system actually runs", color=INK, fontsize=12)
    ax.legend(frameon=False, fontsize=9.5, loc="lower left")
    ax.set_ylim(0, 60)
    save(fig, "mec_pump")

# ── 图 18-1 · 切削稳定性叶瓣图 ──────────────────────────
def chatter():
    n = np.linspace(1500, 14000, 4000)     # rpm
    fn, zeta = 800.0, 0.03                 # Hz
    teeth = 4
    alim = np.full_like(n, np.inf)
    for k in range(0, 9):
        # 经典叶瓣构造（示意）
        eps = np.linspace(0.02, np.pi-0.02, 4000)
        for j in range(1):
            pass
    # 用简化解析形式绘制若干叶瓣
    fig, ax = plt.subplots(figsize=(7.0, 4.3))
    base = 1.0
    curves = []
    for k in range(1, 8):
        eps = np.linspace(0.05, 2*np.pi-0.05, 1200)
        fc = fn*(1 + 0.06*np.sin(eps/2))
        nn = 60*fc/(teeth*(k + eps/(2*np.pi)))
        aa = base*(1 + (1-np.cos(eps))/ (2*np.sin(eps/2)**2 + 0.35))*(1+2*zeta*8)
        aa = base*(1/np.maximum(np.sin(eps/2)**2, 0.02))*0.06
        m = (nn > 1500) & (nn < 14000) & (aa < 12)
        curves.append((nn[m], aa[m]))
        ax.plot(nn[m], aa[m], color=ACC, lw=1.9)
    ax.axhline(base*0.42, color=RED, ls="--", lw=1.5)
    ax.text(1700, base*0.50, "conservative limit (always stable)", fontsize=9, color=RED)
    ax.fill_between([1500, 14000], 0, base*0.42, color=GREEN, alpha=0.10)
    ax.text(9200, 3.4, "stable pockets:\nhigher speed allows\ndeeper cuts",
            fontsize=9.5, color=INK)
    ax.set_xlabel("spindle speed  (rpm)")
    ax.set_ylabel("limiting depth of cut  (mm)")
    ax.set_title("Stability lobe diagram (regenerative chatter)", color=INK, fontsize=12.5)
    ax.set_ylim(0, 6); ax.set_xlim(1500, 14000)
    save(fig, "mec_chatter")

if __name__ == "__main__":
    stress_strain(); section(); buckling(); resonance()
    rotor(); gear(); sn_curve(); pump(); chatter()
