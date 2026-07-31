"""线一+线二图：米氏动力学 / 血红蛋白协同 / 负反馈增益 / Kleiber / VDJ / Gompertz。
运行：cd figs && ~/ai-course/.venv/bin/python basics_body.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 1-1 · 米氏方程 ──────────────────────────────────────
def michaelis():
    S = np.linspace(0, 10, 400)
    Vmax, Km = 1.0, 1.5
    v = Vmax * S / (Km + S)
    fig, ax = plt.subplots(figsize=(6.2, 4.2))
    ax.plot(S, v, color=ACC, lw=2.4)
    ax.axhline(Vmax, color="#888", ls=":", lw=1.2)
    ax.axhline(Vmax/2, color=ACC2, ls="--", lw=1.2)
    ax.plot([Km], [Vmax/2], "o", color=RED, ms=7, zorder=5)
    ax.annotate(r"$V_{\max}$", xy=(8.6, Vmax), xytext=(7.0, 0.86),
                fontsize=12, color="#555")
    ax.annotate(r"$K_M$", xy=(Km, 0), xytext=(Km+0.25, 0.08),
                fontsize=12, color=RED)
    ax.vlines(Km, 0, Vmax/2, color=RED, ls=":", lw=1.2)
    ax.set_xlabel(r"substrate concentration  $[S]$")
    ax.set_ylabel(r"reaction rate  $v$")
    ax.set_title("Michaelis-Menten kinetics", color=INK)
    ax.set_ylim(0, 1.12); ax.set_xlim(0, 10)
    save(fig, "bio_michaelis")

# ── 图 3-1 · 血红蛋白 vs 肌红蛋白 ─────────────────────────
def hemoglobin():
    p = np.linspace(0.01, 100, 500)          # pO2 (mmHg)
    # Hill equation
    def hill(p, P50, n): return p**n / (P50**n + p**n)
    hb = hill(p, 26, 2.8)                     # 血红蛋白
    mb = hill(p, 2.8, 1.0)                    # 肌红蛋白
    hb_r = hill(p, 36, 2.8)                   # 右移(Bohr)
    fig, ax = plt.subplots(figsize=(6.4, 4.3))
    ax.plot(p, mb*100, color=ACC2, lw=2.2, label="myoglobin  ($n=1$)")
    ax.plot(p, hb*100, color=ACC, lw=2.6, label="hemoglobin  ($n\\approx2.8$)")
    ax.plot(p, hb_r*100, color=RED, lw=1.8, ls="--",
            label="hemoglobin, Bohr shift")
    ax.axvline(40, color="#999", ls=":", lw=1.1)
    ax.axvline(100, color="#999", ls=":", lw=1.1)
    ax.text(41, 8, "tissue", fontsize=9.5, color="#666")
    ax.text(88, 8, "lung", fontsize=9.5, color="#666")
    ax.set_xlabel("oxygen partial pressure  $pO_2$  (mmHg)")
    ax.set_ylabel("saturation  (%)")
    ax.set_title("Cooperative oxygen binding", color=INK)
    ax.legend(frameon=False, fontsize=10, loc="lower right")
    ax.set_ylim(0, 103)
    save(fig, "bio_hemoglobin")

# ── 图 4-1 · 负反馈：增益与振荡 ───────────────────────────
def feedback():
    t = np.linspace(0, 30, 1200)
    def resp(G, tau, damp):
        # 二阶欠阻尼响应，示意不同增益/时滞
        wn = 0.35 + 0.10*G
        z = damp
        wd = wn*np.sqrt(max(1e-6, 1-z**2))
        y = np.exp(-z*wn*t)*np.cos(wd*t) + (z*wn/wd)*np.exp(-z*wn*t)*np.sin(wd*t)
        return (1/(1+G)) + (1 - 1/(1+G))*y
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    ax.axhline(0, color="#999", ls=":", lw=1.1)
    ax.plot(t, resp(1.2, 1, 0.95), color=GREEN, lw=2.0, label="low gain")
    ax.plot(t, resp(6.0, 1, 0.75), color=ACC, lw=2.4, label="moderate gain")
    ax.plot(t, resp(16.0, 1, 0.12), color=RED, lw=1.9, label="high gain + delay")
    ax.set_xlabel("time after disturbance")
    ax.set_ylabel("deviation from setpoint")
    ax.set_title("Negative feedback: gain vs stability", color=INK)
    ax.legend(frameon=False, fontsize=10)
    ax.text(24, 0.03, "setpoint", fontsize=9.5, color="#666")
    save(fig, "bio_feedback")

# ── 图 5-1 · Kleiber 定律 ─────────────────────────────────
def kleiber():
    rng = np.random.default_rng(3)
    M = np.logspace(-6, 5, 260)               # kg, 细菌→蓝鲸
    B = 3.5 * M**0.75
    obs = B * np.exp(rng.normal(0, 0.42, M.size))
    fig, ax = plt.subplots(figsize=(6.5, 4.4))
    ax.loglog(M, obs, ".", ms=3.0, color=ACC2, alpha=0.55, label="organisms")
    ax.loglog(M, B, "-", color=ACC, lw=2.6, label=r"$B\propto M^{3/4}$  (Kleiber)")
    ax.loglog(M, 3.5*M**1.0, "--", color="#999", lw=1.5, label=r"$B\propto M^{1}$  (volume)")
    ax.loglog(M, 3.5*M**(2/3), "--", color=RED, lw=1.5, label=r"$B\propto M^{2/3}$  (surface)")
    ax.set_xlabel("body mass  $M$  (kg, log)")
    ax.set_ylabel("metabolic rate  $B$  (W, log)")
    ax.set_title("Kleiber's law across 11 orders of magnitude", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    save(fig, "bio_kleiber")

# ── 图 7-1 · V(D)J 组合多样性 ─────────────────────────────
def vdj():
    stages = ["V×D×J\n(heavy)", "× V×J\n(light)", "× heavy-light\npairing",
              "× junctional\ndiversity"]
    vals = [40*25*6, 40*25*6*40*5, 40*25*6*40*5, 1e11]
    # 逐级累乘（第三级=配对已含在第二级，示意用）
    vals = [6e3, 1.2e6, 1.2e6, 1e11]
    x = np.arange(len(stages))
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    bars = ax.bar(x, vals, color=[ACC2, ACC2, ACC2, ACC], width=0.6)
    ax.set_yscale("log")
    ax.set_xticks(x); ax.set_xticklabels(stages, fontsize=9.5)
    ax.set_ylabel("antibody repertoire size  (log)")
    ax.set_title("Where antibody diversity comes from", color=INK)
    for xi, v in zip(x, vals):
        ax.text(xi, v*1.7, f"$10^{{{int(np.log10(v))}}}$", ha="center",
                fontsize=10, color=INK)
    ax.set_ylim(1e3, 1e13)
    ax.annotate("dominant\ncontribution", xy=(3, 1e11), xytext=(1.75, 3e11),
                fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    save(fig, "bio_vdj")

# ── 图 9-1 · Gompertz 死亡率 ──────────────────────────────
def gompertz():
    age = np.linspace(0, 100, 500)
    mu0, gamma = 2.2e-4, np.log(2)/8          # 每 8 年翻倍
    mu = mu0*np.exp(gamma*age)
    infant = 6e-3*np.exp(-age/1.1)            # 婴儿期
    total = mu + infant
    fig, ax = plt.subplots(figsize=(6.5, 4.3))
    ax.semilogy(age, total, color=ACC, lw=2.6, label="observed mortality")
    ax.semilogy(age, mu, "--", color=RED, lw=1.8,
                label=r"Gompertz  $\mu_0 e^{\gamma t}$")
    ax.set_xlabel("age  (years)")
    ax.set_ylabel("annual mortality rate  (log)")
    ax.set_title("Mortality doubles about every 8 years", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10, loc="lower right")
    ax.annotate("infant\nmortality", xy=(2, 4e-3), xytext=(11, 6e-3),
                fontsize=9.5, color="#666",
                arrowprops=dict(arrowstyle="->", color="#999"))
    ax.annotate("minimum\n(~10 yr)", xy=(10, 4.5e-4), xytext=(20, 1.4e-4),
                fontsize=9.5, color="#666",
                arrowprops=dict(arrowstyle="->", color="#999"))
    ax.set_ylim(1e-4, 3e-1)
    save(fig, "bio_gompertz")

if __name__ == "__main__":
    michaelis(); hemoglobin(); feedback(); kleiber(); vdj(); gompertz()
