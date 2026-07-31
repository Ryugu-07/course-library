"""光电三图：艾里斑与瑞利判据 / 高斯光束传播 / 系统 MTF。
运行：cd figs && ~/ai-course/.venv/bin/python photo.py"""
import numpy as np
from scipy.special import j1
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 4-1 · 艾里斑与瑞利判据 ───────────────────────────
def airy():
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.6, 4.2))
    # 左：二维艾里图样
    n = 400
    x = np.linspace(-8, 8, n)
    X, Y = np.meshgrid(x, x)
    R = np.pi*np.sqrt(X**2+Y**2) + 1e-9
    I = (2*j1(R)/R)**2
    a1.imshow(np.power(I, 0.3), extent=[-8, 8, -8, 8], cmap="inferno")
    a1.set_title("Airy pattern (intensity$^{0.3}$)", color=INK, fontsize=12)
    a1.set_xlabel(r"radial coordinate  ($\lambda/\mathrm{NA}$ units)")
    a1.set_xticks([-5, 0, 5]); a1.set_yticks([-5, 0, 5])
    # 右：瑞利判据
    def airy1d(u):
        u = np.where(np.abs(u) < 1e-9, 1e-9, u)
        return (2*j1(np.pi*u)/(np.pi*u))**2
    u = np.linspace(-4, 6, 900)
    sep = 1.22
    A = airy1d(u); B = airy1d(u-sep)
    a2.plot(u, A, "--", color=ACC2, lw=1.6)
    a2.plot(u, B, "--", color=ACC2, lw=1.6)
    a2.plot(u, A+B, color=ACC, lw=2.6, label="sum (just resolved)")
    # 未分辨对比
    sep2 = 0.7
    a2.plot(u, airy1d(u)+airy1d(u-sep2), color=RED, lw=2.0, ls=":",
            label="closer: unresolved")
    a2.axvline(0, color="#ccc", lw=.8); a2.axvline(sep, color="#ccc", lw=.8)
    a2.annotate("", xy=(0, 1.45), xytext=(sep, 1.45),
                arrowprops=dict(arrowstyle="<->", color=INK, lw=1.4))
    a2.text(sep/2, 1.50, r"$1.22\lambda/D$", ha="center", fontsize=11, color=INK)
    a2.set_xlabel(r"position  ($\lambda/D$ units)")
    a2.set_ylabel("normalized intensity")
    a2.set_title("Rayleigh criterion", color=INK, fontsize=12)
    a2.legend(frameon=False, fontsize=9)
    a2.set_ylim(0, 1.75); a2.set_xlim(-3, 5)
    fig.tight_layout()
    save(fig, "pho_airy")

# ── 图 7-1 · 高斯光束传播 ───────────────────────────────
def gaussian():
    zR = 1.0
    z = np.linspace(-4, 4, 700)
    w = np.sqrt(1 + (z/zR)**2)
    fig, ax = plt.subplots(figsize=(7.0, 4.3))
    ax.plot(z, w, color=ACC, lw=2.4)
    ax.plot(z, -w, color=ACC, lw=2.4)
    ax.fill_between(z, -w, w, color=ACC2, alpha=0.22)
    # 渐近线
    ax.plot(z, np.abs(z)/zR, "--", color=RED, lw=1.5)
    ax.plot(z, -np.abs(z)/zR, "--", color=RED, lw=1.5)
    ax.axvline(0, color="#bbb", ls=":", lw=1.1)
    ax.axvline(zR, color=GREEN, ls=":", lw=1.3)
    ax.axvline(-zR, color=GREEN, ls=":", lw=1.3)
    ax.annotate("", xy=(0, 0), xytext=(0, 1),
                arrowprops=dict(arrowstyle="<->", color=INK, lw=1.5))
    ax.text(0.06, 0.48, r"$w_0$", fontsize=12, color=INK)
    ax.text(zR+0.06, -1.9, r"$z_R$", fontsize=12, color=GREEN)
    ax.text(-zR-0.42, -1.9, r"$-z_R$", fontsize=12, color=GREEN)
    ax.text(2.5, 2.5, r"$\theta=\lambda/\pi w_0$", fontsize=11.5, color=RED)
    ax.text(-3.7, 3.0, r"$w_0\theta=\lambda/\pi$ (invariant)", fontsize=11, color=INK)
    ax.set_xlabel(r"propagation distance  $z/z_R$")
    ax.set_ylabel(r"beam radius  $w/w_0$")
    ax.set_title("Gaussian beam: focus and divergence trade off", color=INK, fontsize=12.5)
    ax.set_ylim(-4, 4)
    save(fig, "pho_gaussian")

# ── 图 11-1 · 系统 MTF ──────────────────────────────────
def mtf():
    fc = 1.0                      # 归一化截止频率
    f = np.linspace(0, 1.15, 600)
    # 衍射极限 MTF
    fr = np.clip(f/fc, 0, 1)
    diff = (2/np.pi)*(np.arccos(fr) - fr*np.sqrt(1-fr**2))
    # 实际镜头（含像差）
    lens = diff*np.exp(-2.6*(f/fc)**2)
    # 探测器 MTF：像素间距 p，使 1/p = 0.85 fc
    p_inv = 0.85
    det = np.abs(np.sinc(f/p_inv))
    total = lens*det
    fig, ax = plt.subplots(figsize=(6.9, 4.4))
    ax.plot(f, diff, "--", color="#888", lw=1.8, label="diffraction limit")
    ax.plot(f, lens, color=ACC, lw=2.4, label="lens (with aberrations)")
    ax.plot(f, det, color=GREEN, lw=2.0, label="detector (pixel)")
    ax.plot(f, total, color=RED, lw=2.8, label="system = product")
    fN = p_inv/2
    ax.axvline(fN, color="#b06a8a", ls=":", lw=1.5)
    ax.text(fN+0.015, 0.86, "Nyquist\n$1/2p$", fontsize=9, color="#b06a8a")
    ax.axvline(fc, color="#999", ls=":", lw=1.2)
    ax.text(fc-0.14, 0.05, r"$f_c=2\mathrm{NA}/\lambda$", fontsize=9.5, color="#666")
    ax.set_xlabel("spatial frequency  (normalized to $f_c$)")
    ax.set_ylabel("MTF (contrast transfer)")
    ax.set_title("System MTF is the product of all stages", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5)
    ax.set_ylim(0, 1.02); ax.set_xlim(0, 1.15)
    save(fig, "pho_mtf")

if __name__ == "__main__":
    airy(); gaussian(); mtf()
