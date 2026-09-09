"""流体线 6 图 + 天体线 6 图 + qft-03 跑动耦合。
运行：cd figs && ~/ai-course/.venv/bin/python physics_fl_ap.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

rng = np.random.default_rng(4)

# ══════════ 流体线 ══════════

def _preserve_reviewed_svg(name):
    """The reviewed SVG is source artwork; rebuilding sites copies it directly."""
    from pathlib import Path
    import xml.etree.ElementTree as ET
    source = Path(__file__).resolve().parents[1] / "images" / (name + ".svg")
    ET.parse(source)  # Fail explicitly if the authoritative source is missing/invalid.
    print(f"Preserved reviewed source SVG: {source.name}")


def fl01_re():
    """Legacy entry point: the lecture now uses a nozzle momentum diagram."""
    _preserve_reviewed_svg("fl-01-continuum-re")


def fl02_drag():
    """Legacy entry point: sphere traction + collocation Blasius profile."""
    _preserve_reviewed_svg("fl-02-viscous-drag")


def fl03_spectrum():
    """Legacy entry point: preserve reviewed spectrum and viscous balance."""
    _preserve_reviewed_svg("fl-03-turbulence-spectrum")


def fl04_bifurcation():
    """Preserve reviewed free-slip neutral and signed branch diagram."""
    _preserve_reviewed_svg("fl-04-instability-bifurcation")


def fl05_lorenz():
    """Preserve reviewed numerical orbit, finite scan and exact period-2 branches."""
    _preserve_reviewed_svg("fl-05-chaos-lorenz")


def fl06_regimes():
    """Preserve reviewed SI electron density/temperature boundaries."""
    _preserve_reviewed_svg("fl-06-plasma-regimes")

# ══════════ 天体线 ══════════

def ap01_transfer():
    # Preserve reviewed grey limb and explicit slab line model.
    _preserve_reviewed_svg("ap-01-radiative-transfer")


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
