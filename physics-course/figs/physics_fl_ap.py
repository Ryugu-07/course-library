"""流体线 6 图 + 天体线 6 图 + qft-03 跑动耦合。
运行：cd figs && ~/ai-course/.venv/bin/python physics_fl_ap.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

rng = np.random.default_rng(4)

# ══════════ 流体线 ══════════

def fl01_re():
    """不同 Re 下圆柱绕流形态（示意流线）"""
    fig, axes = plt.subplots(1, 3, figsize=(10.2, 3.3))
    titles = [r"$Re\ll1$: creeping, reversible",
              r"$Re\sim10^2$: Kármán vortex street",
              r"$Re\gtrsim10^5$: turbulent wake"]
    for ax, t, kind in zip(axes, titles, range(3)):
        ax.add_patch(plt.Circle((0, 0), 0.5, fc=ACC2, ec=ACC, lw=1.6, zorder=5))
        ys = np.linspace(-2.0, 2.0, 13)
        x = np.linspace(-3, 5, 400)
        for y0 in ys:
            if kind == 0:                       # 对称爬流
                y = y0*(1 + 0.35/np.maximum((x**2+y0**2), .3))
                y = np.where(x < 0, y, y0*(1 + 0.35/np.maximum((x**2+y0**2), .3)))
            elif kind == 1:                     # 涡街
                y = y0 + np.where(x > 0.6,
                                  0.42*np.exp(-(x-0.6)/6)*np.sin(2.2*x - 1.6*np.sign(y0))
                                  * np.exp(-(y0/1.5)**2), 0)
            else:                               # 湍流尾迹
                y = y0 + np.where(x > 0.6,
                                  0.30*np.exp(-(y0/1.6)**2)*(
                                      np.sin(6*x)*0.4 + rng.normal(0, .10, x.size).cumsum()*.05), 0)
            m = np.abs(y) < 2.6
            ax.plot(x[m], y[m], color=ACC, lw=1.0, alpha=.75)
        ax.set_xlim(-3, 5); ax.set_ylim(-2.6, 2.6)
        ax.set_xticks([]); ax.set_yticks([])
        ax.set_title(t, color=INK, fontsize=10.5)
        for s in ax.spines.values():
            s.set_visible(False)
    fig.tight_layout()
    save(fig, "fl-01-continuum-re")


def fl02_drag():
    """圆球 Cd-Re 曲线，含阻力危机"""
    Re = np.logspace(-1, 6.6, 900)
    Cd = 24/Re + 6/(1+np.sqrt(Re)) + 0.4
    crisis = 1 - 0.78/(1+np.exp(-(np.log10(Re)-5.5)*7))
    Cd = Cd*crisis
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    ax.loglog(Re, Cd, color=ACC, lw=2.6)
    ax.loglog(Re[Re < 2], 24/Re[Re < 2], "--", color=GREEN, lw=1.8,
              label=r"Stokes:  $C_D=24/Re$")
    ax.axvspan(2e5, 6e5, color=RED, alpha=.10)
    ax.annotate("drag crisis\n(laminar→turbulent BL)", xy=(4e5, 0.12),
                xytext=(6e2, 0.06), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel(r"Reynolds number  $Re$")
    ax.set_ylabel(r"drag coefficient  $C_D$")
    ax.set_title("Sphere drag across nine decades of Re", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10)
    ax.set_ylim(0.05, 200)
    save(fig, "fl-02-viscous-drag")


def fl03_spectrum():
    """Kolmogorov 能谱"""
    k = np.logspace(-1, 4, 800)
    kL, keta = 1.0, 800.0
    E = k**(-5/3)*(1-np.exp(-(k/kL)**3.5))*np.exp(-(k/keta)**1.2)
    E = E/np.nanmax(E)
    fig, ax = plt.subplots(figsize=(6.9, 4.3))
    ax.loglog(k, E, color=ACC, lw=2.6)
    ki = np.logspace(0.6, 2.4, 50)
    ax.loglog(ki, 0.42*ki**(-5/3), "--", color=RED, lw=2.0,
              label=r"$E(k)\propto k^{-5/3}$")
    for x0, x1, c, lab in [(0.1, 1.0, GREEN, "energy-\ncontaining"),
                           (1.0, 300, ACC2, "inertial range\n(cascade)"),
                           (300, 1e4, "#8a6a3a", "dissipation")]:
        ax.axvspan(x0, x1, color=c, alpha=.10)
    ax.text(0.13, 3e-4, "injection", fontsize=9, color=GREEN)
    ax.text(9, 4e-2, "inertial range", fontsize=10, color=INK)
    ax.text(9e2, 3e-4, r"$k>1/\eta$", fontsize=9, color="#8a6a3a")
    ax.set_xlabel(r"wavenumber  $k$")
    ax.set_ylabel(r"energy spectrum  $E(k)$")
    ax.set_title("Kolmogorov cascade", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10.5)
    ax.set_ylim(1e-7, 3)
    save(fig, "fl-03-turbulence-spectrum")


def fl04_bifurcation():
    """Rayleigh-Bénard 超临界分岔"""
    Rac = 1708.0
    Ra = np.linspace(0, 4000, 600)
    A = np.where(Ra > Rac, np.sqrt(np.maximum(Ra-Rac, 0)/Rac), 0)
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    ax.plot(Ra[Ra <= Rac], np.zeros((Ra <= Rac).sum()), color=ACC, lw=2.6,
            label="conduction (stable)")
    ax.plot(Ra[Ra > Rac], np.zeros((Ra > Rac).sum()), "--", color="#aaa", lw=1.8,
            label="conduction (unstable)")
    ax.plot(Ra[Ra > Rac], A[Ra > Rac], color=RED, lw=2.6, label="convection")
    ax.plot(Ra[Ra > Rac], -A[Ra > Rac], color=RED, lw=2.6)
    ax.axvline(Rac, color=GREEN, ls=":", lw=1.5)
    ax.text(Rac+60, -1.15, r"$\mathrm{Ra}_c\approx1708$", fontsize=11, color=GREEN)
    ax.annotate(r"$A\propto\sqrt{\mathrm{Ra}-\mathrm{Ra}_c}$", xy=(3000, 0.87),
                xytext=(1900, 1.15), fontsize=11, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel(r"Rayleigh number  $\mathrm{Ra}$")
    ax.set_ylabel("convection amplitude  $A$")
    ax.set_title("Supercritical (pitchfork) bifurcation", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    ax.set_ylim(-1.35, 1.35)
    save(fig, "fl-04-instability-bifurcation")


def fl05_lorenz():
    """Lorenz 吸引子 + Logistic 倍周期"""
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(10.0, 4.3))
    # Lorenz
    s, r, b = 10.0, 28.0, 8/3
    dt, n = 0.006, 12000
    x, y, z = 1.0, 1.0, 20.0
    X, Z = np.empty(n), np.empty(n)
    for i in range(n):
        dx = s*(y-x); dy = x*(r-z)-y; dz = x*y-b*z
        x += dt*dx; y += dt*dy; z += dt*dz
        X[i], Z[i] = x, z
    a1.plot(X, Z, color=ACC, lw=0.35, alpha=.85)
    a1.set_xlabel("$x$"); a1.set_ylabel("$z$")
    a1.set_title(r"Lorenz attractor ($\sigma$=10, $\rho$=28, $\beta$=8/3)",
                 color=INK, fontsize=11.5)
    # Logistic
    rs = np.linspace(2.8, 4.0, 1400)
    for rr in rs:
        xv = 0.5
        for _ in range(300):
            xv = rr*xv*(1-xv)
        pts = []
        for _ in range(120):
            xv = rr*xv*(1-xv); pts.append(xv)
        a2.plot([rr]*len(pts), pts, ",", color=ACC, alpha=.35)
    a2.axvline(3.5699, color=RED, ls=":", lw=1.4)
    a2.text(3.58, 0.06, r"$r_\infty$", fontsize=11, color=RED)
    a2.set_xlabel("$r$"); a2.set_ylabel("$x$")
    a2.set_title("Logistic map: period doubling", color=INK, fontsize=11.5)
    a2.set_xlim(2.8, 4.0)
    fig.tight_layout()
    save(fig, "fl-05-chaos-lorenz")


def fl06_regimes():
    """等离子体参数空间"""
    fig, ax = plt.subplots(figsize=(7.0, 4.6))
    n = np.logspace(4, 34, 200)
    # 简并边界 kT ~ E_F
    T_deg = 3.6e-11*n**(2/3)
    ax.loglog(n, T_deg, "--", color=ACC2, lw=1.8)
    # 强耦合 Gamma=1
    T_cpl = 1.6e-5*n**(1/3)
    ax.loglog(n, T_cpl, "--", color=GREEN, lw=1.8)
    items = [("interstellar\nmedium", 1e6, 1e4), ("solar\ncorona", 1e15, 1e6),
             ("solar core", 1e32, 1.5e7), ("tokamak", 1e20, 1e8),
             ("ICF", 1e31, 1e8), ("white dwarf\ninterior", 1e36, 1e7),
             ("lightning", 1e24, 3e4), ("flame", 1e20, 3e3)]
    for lab, nn, TT in items:
        ax.plot(nn, TT, "o", color=ACC, ms=8, zorder=5)
        ax.text(nn*1.6, TT*1.25, lab, fontsize=8.5, color=INK)
    ax.text(2e5, 4e2, "degenerate\n" r"($k_BT<E_F$)", fontsize=9, color=ACC2)
    ax.text(3e28, 2e2, "strongly\ncoupled", fontsize=9, color=GREEN)
    ax.set_xlabel(r"density  $n$  (m$^{-3}$)")
    ax.set_ylabel(r"temperature  $T$  (K)")
    ax.set_title("Plasma parameter space", color=INK, fontsize=12.5)
    ax.set_xlim(1e4, 1e38); ax.set_ylim(1e2, 1e10)
    save(fig, "fl-06-plasma-regimes")

# ══════════ 天体线 ══════════

def ap01_transfer():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.8, 4.0))
    tau = np.linspace(0, 6, 400)
    for I0, c, lab in [(0.0, ACC, r"$I_0=0$"), (2.0, RED, r"$I_0=2S$")]:
        I = I0*np.exp(-tau) + 1.0*(1-np.exp(-tau))
        a1.plot(tau, I, color=c, lw=2.4, label=lab)
    a1.axhline(1.0, color="#999", ls="--", lw=1.3)
    a1.text(4.2, 1.06, "$S$ (source function)", fontsize=10, color="#666")
    a1.set_xlabel(r"optical depth  $\tau$"); a1.set_ylabel(r"intensity  $I/S$")
    a1.set_title(r"$I\to S$ as $\tau\to\infty$", color=INK, fontsize=11.5)
    a1.legend(frameon=False, fontsize=10)
    # 谱线形成
    lam = np.linspace(-4, 4, 600)
    opac = 1 + 40*np.exp(-lam**2/0.25)
    Ttau = 1.0/(1+0.55*np.log1p(opac))
    a2.plot(lam, Ttau/Ttau.max(), color=ACC, lw=2.6)
    a2.set_xlabel(r"$\Delta\lambda$  (arb.)"); a2.set_ylabel("emergent flux")
    a2.set_title("Absorption line formation", color=INK, fontsize=11.5)
    a2.annotate("line core forms\nhigher & cooler", xy=(0, 0.42), xytext=(1.1, 0.60),
                fontsize=9, color=RED, arrowprops=dict(arrowstyle="->", color=RED))
    a2.set_ylim(0.3, 1.05)
    fig.tight_layout()
    save(fig, "ap-01-radiative-transfer")


def ap02_hr():
    fig, ax = plt.subplots(figsize=(6.9, 4.8))
    # 主序
    T = np.logspace(np.log10(2800), np.log10(42000), 300)
    L = (T/5772)**5.0
    ax.plot(np.log10(T), np.log10(L), color=ACC, lw=3.0, label="main sequence")
    # 巨星支
    Tg = np.logspace(np.log10(3200), np.log10(5600), 120)
    ax.plot(np.log10(Tg), np.log10((Tg/5772)**0.0*140), color=RED, lw=2.6,
            label="giant branch")
    # 白矮星
    Tw = np.logspace(np.log10(6000), np.log10(30000), 120)
    ax.plot(np.log10(Tw), np.log10((Tw/5772)**4*3e-4), color=GREEN, lw=2.4,
            label="white dwarfs")
    ax.plot([np.log10(5772)], [0], "o", color="#d4a017", ms=11, zorder=6)
    ax.text(np.log10(5772)-0.02, 0.22, "Sun", fontsize=10, color=INK)
    # 演化路径
    ax.annotate("", xy=(np.log10(4200), 2.15), xytext=(np.log10(5772), 0.05),
                arrowprops=dict(arrowstyle="->", color="#888", lw=1.6, ls="--"))
    ax.annotate("", xy=(np.log10(11000), -2.6), xytext=(np.log10(3900), 2.1),
                arrowprops=dict(arrowstyle="->", color="#888", lw=1.6, ls="--"))
    ax.set_xlim(4.68, 3.42)
    ax.set_xlabel(r"$\log_{10}T_{\rm eff}$  (K)   —— hotter to the left")
    ax.set_ylabel(r"$\log_{10}(L/L_\odot)$")
    ax.set_title("Hertzsprung–Russell diagram", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="lower left")
    save(fig, "ap-02-stellar-hr")


def ap03_gamow():
    E = np.linspace(0.1, 60, 800)
    kT = 1.3
    maxwell = np.exp(-E/kT)
    tunnel = np.exp(-np.sqrt(500/E))
    prod = maxwell*tunnel
    fig, ax = plt.subplots(figsize=(6.9, 4.3))
    ax.plot(E, maxwell/maxwell.max(), color=GREEN, lw=2.2,
            label=r"Maxwell–Boltzmann  $e^{-E/k_BT}$")
    ax.plot(E, tunnel/tunnel.max(), color=ACC2, lw=2.2,
            label=r"tunneling  $e^{-\sqrt{E_G/E}}$")
    ax.plot(E, prod/prod.max(), color=RED, lw=3.0, label="product = Gamow peak")
    E0 = E[np.argmax(prod)]
    ax.axvline(E0, color=RED, ls=":", lw=1.4)
    ax.text(E0+1.2, 0.72, f"$E_0\\approx{E0:.0f}$ keV\n$\\approx{E0/kT:.1f}\\,k_BT$",
            fontsize=10, color=RED)
    ax.text(1.0, 0.30, r"$k_BT$", fontsize=10, color=GREEN)
    ax.set_xlabel("energy  $E$  (keV)"); ax.set_ylabel("normalized rate")
    ax.set_title("Gamow peak: reactions live in the tail", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_xlim(0, 45); ax.set_ylim(0, 1.12)
    save(fig, "ap-03-gamow")


def ap04_massradius():
    fig, ax = plt.subplots(figsize=(6.9, 4.4))
    # 白矮星
    M = np.linspace(0.15, 1.38, 400)
    R_wd = 0.011*(M**(-1/3))*np.sqrt(np.maximum(1-(M/1.44)**(4/3), 1e-4))
    ax.loglog(M, R_wd*696340/6371, color=ACC, lw=2.8, label="white dwarfs")
    ax.axvline(1.44, color=RED, ls="--", lw=1.6)
    ax.text(1.47, 0.6, r"$M_{\rm Ch}\approx1.4M_\odot$", fontsize=10.5, color=RED)
    # 中子星（示意，单位换算到地球半径）
    Mn = np.linspace(0.6, 2.2, 300)
    R_ns = np.full_like(Mn, 11.5)*(1-0.10*(Mn/2.2)**3)
    ax.loglog(Mn, R_ns/6371, color=GREEN, lw=2.8, label="neutron stars")
    # 史瓦西半径
    Mall = np.logspace(-1, 0.6, 100)
    ax.loglog(Mall, 2.95*Mall/6371, ":", color=INK, lw=1.8, label=r"$r_s=2GM/c^2$")
    ax.set_xlabel(r"mass  $M/M_\odot$")
    ax.set_ylabel(r"radius  $R/R_\oplus$")
    ax.set_title("Compact objects: mass–radius relation", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="lower left")
    ax.set_xlim(0.15, 3); ax.set_ylim(1e-4, 3)
    save(fig, "ap-04-mass-radius")


def ap05_disk():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.8, 4.0))
    r = np.logspace(0, 3, 400)
    T = r**(-0.75)*(1-r**(-0.5))**0.25
    T = np.nan_to_num(T)
    a1.loglog(r, T/np.nanmax(T), color=ACC, lw=2.6)
    a1.loglog(r[r > 10], 0.42*r[r > 10]**(-0.75), "--", color=RED, lw=1.8,
              label=r"$T\propto r^{-3/4}$")
    a1.set_xlabel(r"radius  $r/r_{\rm in}$"); a1.set_ylabel("temperature (norm.)")
    a1.set_title("Thin-disc temperature profile", color=INK, fontsize=11.5)
    a1.legend(frameon=False, fontsize=10)
    nu = np.logspace(-2.5, 1.5, 500)
    F = nu**(1/3)*np.exp(-nu/2.2)*(1-np.exp(-(nu/0.02)**2))
    a2.loglog(nu, F/np.nanmax(F), color=ACC, lw=2.8)
    a2.loglog(nu[(nu > .06) & (nu < .8)], 1.15*nu[(nu > .06) & (nu < .8)]**(1/3),
              "--", color=RED, lw=1.8, label=r"$F_\nu\propto\nu^{1/3}$")
    a2.set_xlabel(r"frequency  $\nu$ (arb.)"); a2.set_ylabel(r"$F_\nu$ (norm.)")
    a2.set_title("Multi-colour blackbody spectrum", color=INK, fontsize=11.5)
    a2.legend(frameon=False, fontsize=10)
    a2.set_ylim(1e-3, 2)
    fig.tight_layout()
    save(fig, "ap-05-accretion-disk")


def ap06_rotation():
    r = np.linspace(0.3, 30, 400)
    v_disk = 200*np.sqrt(3.0/r)*(1-np.exp(-r/1.5))
    v_flat = 220*(1-np.exp(-r/1.8))
    v_halo = np.sqrt(np.maximum(v_flat**2 - v_disk**2, 0))
    fig, ax = plt.subplots(figsize=(6.9, 4.3))
    ax.plot(r, v_flat, color=ACC, lw=3.0, label="observed (flat)")
    ax.plot(r, v_disk, "--", color=RED, lw=2.2, label="visible matter only")
    ax.plot(r, v_halo, ":", color=GREEN, lw=2.2, label="required dark halo")
    robs = np.linspace(1.5, 28, 16)
    ax.errorbar(robs, np.interp(robs, r, v_flat), yerr=9, fmt="o",
                color=INK, ms=4.5, lw=1.1, capsize=2.5, zorder=5)
    ax.annotate("Keplerian decline\nexpected", xy=(20, 60), xytext=(12, 20),
                fontsize=9.5, color=RED, arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel("radius  (kpc)"); ax.set_ylabel("rotation velocity  (km/s)")
    ax.set_title("Galaxy rotation curve", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="lower right")
    ax.set_ylim(0, 265)
    save(fig, "ap-06-rotation-curve")

# ══════════ qft-03 ══════════

def qft03_running():
    mu = np.logspace(-1, 16, 500)          # GeV
    # 单圈 QED：1/α 随 log(μ) 线性下降；标定为 1/α(m_e)=137 → 1/α(M_Z)=128
    slope = (137 - 128)/np.log10(91.2/5.11e-4)      # ≈1.71 per decade
    inv_qed = 137 - slope*np.log10(mu/5.11e-4)
    alpha_qed = 1/np.maximum(inv_qed, 60)
    Lam = 0.2
    alpha_s = np.where(mu > Lam*1.3, 12*np.pi/(23*np.log(np.maximum(mu/Lam, 1.31)**2)), np.nan)
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.8, 4.1))
    a1.semilogx(mu, 1/alpha_qed, color=ACC, lw=2.8)
    a1.set_xlabel(r"energy scale  $\mu$  (GeV)")
    a1.set_ylabel(r"$1/\alpha_{\rm em}$")
    a1.set_title(r"QED: $\beta>0$ (screening)", color=INK, fontsize=11.5)
    a1.plot([91.2], [128], "o", color=RED, ms=8, zorder=5)
    a1.text(3e2, 129, r"$M_Z$: $\alpha^{-1}\approx128$", fontsize=9.5, color=RED)
    a1.text(1e-1, 136, r"$\alpha^{-1}=137$ at low $E$", fontsize=9.5, color="#666")
    a1.invert_yaxis()
    a2.loglog(mu, alpha_s, color=ACC, lw=2.8)
    a2.axvline(0.2, color=RED, ls="--", lw=1.5)
    a2.text(0.24, 0.9, r"$\Lambda_{\rm QCD}$", fontsize=10.5, color=RED)
    a2.text(3e3, 0.30, "asymptotic\nfreedom", fontsize=10, color=GREEN)
    a2.set_xlabel(r"energy scale  $\mu$  (GeV)")
    a2.set_ylabel(r"$\alpha_s$")
    a2.set_title(r"QCD: $\beta<0$ (anti-screening)", color=INK, fontsize=11.5)
    a2.set_xlim(0.15, 1e6); a2.set_ylim(0.05, 2)
    fig.tight_layout()
    save(fig, "qft-03-running")


if __name__ == "__main__":
    fl01_re(); fl02_drag(); fl03_spectrum(); fl04_bifurcation()
    fl05_lorenz(); fl06_regimes()
    ap01_transfer(); ap02_hr(); ap03_gamow(); ap04_massradius()
    ap05_disk(); ap06_rotation()
    qft03_running()
