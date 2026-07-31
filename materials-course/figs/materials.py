"""材料站 [plot] 轨插图：全部函数图/曲线，中文进 figcaption 不进图。
运行: ~/ai-course/.venv/bin/python figs/materials.py
"""
from _common import plt, np, ACC, ACC2, INK, GRID, RED, GREEN, save

# ---------- 1.1 原子间势阱 ----------
def fig_potential():
    r = np.linspace(0.88, 2.2, 500)
    eps, sig = 1.0, 1.0
    U = 4*eps*((sig/r)**12 - (sig/r)**6)
    r0 = 2**(1/6)*sig
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.plot(r, U, color=ACC, lw=2.2)
    ax.axhline(0, color=GRID, lw=0.8)
    ax.axvline(r0, color=GRID, ls="--", lw=0.9)
    ax.plot([r0], [-eps], "o", color=RED, ms=6)
    ax.annotate("$r_0$: bond length", (r0, -eps), xytext=(1.45, -0.75),
                arrowprops=dict(arrowstyle="->", color=INK), fontsize=11)
    ax.annotate("curvature $\\rightarrow$ modulus $E$", (r0*1.02, -0.9), xytext=(1.5, -0.45),
                fontsize=11, color=INK)
    ax.annotate("asymmetry $\\rightarrow$ thermal\nexpansion", (1.35, -0.35), xytext=(1.62, -0.12),
                fontsize=11, color=INK)
    ax.annotate("repulsion", (0.93, 1.2), fontsize=11, color=INK)
    ax.annotate("attraction $\\sim -1/r^6$", (1.6, 0.08), fontsize=11, color=INK)
    ax.set_xlabel("interatomic distance $r/\\sigma$"); ax.set_ylabel("$U(r)/\\varepsilon$")
    ax.set_ylim(-1.4, 2.0)
    save(fig, "mat-01-potential")

# ---------- 3.1 空位浓度 ----------
def fig_vacancy():
    T = np.linspace(300, 1800, 400)
    k = 8.617e-5  # eV/K
    n = np.exp(-1.0/(k*T))
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.semilogy(T, n, color=ACC, lw=2.2)
    for Tm, lbl in [(300, "RT"), (933, "Al m.p."), (1811, "Fe m.p.")]:
        v = np.exp(-1.0/(k*Tm))
        ax.plot([Tm], [v], "o", color=RED, ms=5)
        ax.annotate(f"{lbl}\n{v:.0e}", (Tm, v), xytext=(Tm-140, v*3e2), fontsize=10)
    ax.set_xlabel("temperature $T$ (K)")
    ax.set_ylabel("vacancy fraction $n_v/N$")
    ax.set_title("$n_v/N=\\exp(-E_v/k_BT)$,  $E_v=1$ eV", fontsize=12)
    ax.grid(True, which="both", alpha=0.25)
    save(fig, "mat-03-vacancy")

# ---------- 4.1 玻璃转变 ----------
def fig_glass():
    T = np.linspace(0.2, 1.4, 400)
    Tm, Tg1, Tg2 = 1.0, 0.55, 0.65
    a_liq, a_cry, a_gla = 0.55, 0.22, 0.26
    Vm = 1.0
    Vliq = Vm + a_liq*(T - Tm)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    # liquid / supercooled
    ax.plot(T[T>=Tg1], Vliq[T>=Tg1], color=ACC, lw=2.2)
    # crystal path
    Tc = T[T<=Tm]; Vc = (Vm-0.13) + a_cry*(Tc - Tm)
    ax.plot(Tc, Vc, color=INK, lw=2.0)
    ax.plot([Tm, Tm], [Vc[-1], Vm], color=INK, lw=2.0)
    # glass 1 (slow-ish quench)
    Tg_ = T[T<=Tg1]
    Vg1 = (Vm + a_liq*(Tg1-Tm)) + a_gla*(Tg_ - Tg1)
    ax.plot(Tg_, Vg1, color=ACC, lw=2.2)
    # glass 2 (faster quench): branch at higher Tg
    Tgf = T[(T<=Tg2)]
    Vg2 = (Vm + a_liq*(Tg2-Tm)) + a_gla*(Tgf - Tg2)
    ax.plot(Tgf, Vg2, color=ACC2, lw=1.8, ls="--")
    for x, lbl in [(Tg1, "$T_{g,slow}$"), (Tg2, "$T_{g,fast}$"), (Tm, "$T_m$")]:
        ax.axvline(x, color=GRID, ls=":", lw=0.8)
        ax.annotate(lbl, (x, 0.62), fontsize=11, ha="center")
    ax.annotate("liquid", (1.18, Vm + a_liq*0.13 + 0.02), fontsize=11, color=ACC)
    ax.annotate("glass", (0.28, 0.86), fontsize=11, color=ACC)
    ax.annotate("crystal", (0.35, 0.72), fontsize=11, color=INK)
    ax.set_xlabel("temperature $T/T_m$"); ax.set_ylabel("specific volume $V$ (a.u.)")
    ax.set_yticks([])
    save(fig, "mat-04-glasstransition")

# ---------- 5.1 匀晶相图 + 杠杆 ----------
def fig_lens():
    x = np.linspace(0, 1, 200)
    TA, TB = 1085, 1455  # Cu, Ni melting pts
    liq = TA + (TB-TA)*x + 90*np.sin(np.pi*x)      # liquidus (上弓)
    sol = TA + (TB-TA)*x - 90*np.sin(np.pi*x)      # solidus (下弓)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.plot(x*100, liq, color=RED, lw=2.0)
    ax.plot(x*100, sol, color=ACC, lw=2.0)
    ax.fill_between(x*100, sol, liq, color=ACC2, alpha=0.25)
    ax.annotate("Liquid", (18, 1420), fontsize=12)
    ax.annotate("L + $\\alpha$", (46, 1265), fontsize=12)
    ax.annotate("$\\alpha$ (solid solution)", (55, 1080), fontsize=12)
    ax.annotate("liquidus", (72, 1415), fontsize=10, color=RED)
    ax.annotate("solidus", (80, 1330), fontsize=10, color=ACC)
    # tie line at T*=1280 for C0=50%
    Tstar = 1280
    # solve intersections numerically
    xl = x[np.argmin(np.abs(liq - Tstar))]*100
    xs = x[np.argmin(np.abs(sol - Tstar))]*100
    ax.plot([xl, xs], [Tstar, Tstar], color=INK, lw=1.4)
    for xx, lbl in [(xl, "$C_L$"), (50, "$C_0$"), (xs, "$C_\\alpha$")]:
        ax.plot([xx], [Tstar], "o", color=INK, ms=4)
        ax.annotate(lbl, (xx, Tstar+14), fontsize=11, ha="center")
    ax.set_xlabel("composition (wt% B)"); ax.set_ylabel("temperature ($^\\circ$C)")
    ax.set_title("isomorphous system (Cu-Ni type), tie line at $T^*$", fontsize=11)
    save(fig, "mat-05-lens")

# ---------- 6.1 渗碳扩散剖面 ----------
def fig_diffusion():
    from scipy.special import erfc
    x = np.linspace(0, 2.0, 300)  # mm
    D = 1e-11  # m^2/s (~ C in gamma-Fe at 950C)
    Cs, C0 = 1.2, 0.2
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for t_h, c in [(1, ACC2), (4, ACC), (16, INK)]:
        t = t_h*3600
        C = C0 + (Cs-C0)*erfc((x*1e-3)/(2*np.sqrt(D*t)))
        ax.plot(x, C, color=c, lw=2.0, label=f"t = {t_h} h")
        xd = 2*np.sqrt(D*t)*1e3  # 特征深度 mm
        ax.axvline(xd, color=c, ls=":", lw=0.8)
    ax.set_xlabel("depth $x$ (mm)"); ax.set_ylabel("carbon (wt%)")
    ax.legend(frameon=False)
    ax.set_title("carburizing: $C(x,t)$, depth $\\sim\\sqrt{Dt}$ (dotted)", fontsize=11)
    save(fig, "mat-06-diffusion")

# ---------- 7.1 TTT 图 ----------
def fig_ttt():
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    A1 = 727.0
    T = np.linspace(A1-5, 250, 300)
    nose_T, nose_t = 550, 1.0
    lt_start = np.log10(nose_t) + 6e-5*(T-nose_T)**2
    lt_end = lt_start + 0.9
    ax.plot(10**lt_start, T, color=ACC, lw=2.0)
    ax.plot(10**lt_end, T, color=ACC, lw=2.0)
    ax.fill_betweenx(T, 10**lt_start, 10**lt_end, color=ACC2, alpha=0.3)
    # A1 共析线: C 曲线终止于此
    ax.axhline(A1, color=INK, lw=1.4, ls="-")
    ax.annotate("$A_1$ = 727 $^\\circ$C (eutectoid)", (0.013, A1+12), fontsize=10, color=INK)
    ax.axhline(220, color=RED, lw=1.6)
    ax.annotate("$M_s$ (martensite start)", (1.4e2, 228), color=RED, fontsize=10)
    ax.annotate("austenite\n(unstable)", (0.10, 620), fontsize=10)
    ax.annotate("pearlite /\nbainite", (30, 500), fontsize=10)
    ax.annotate("start", (10**lt_start[150]*0.42, T[150]), fontsize=9, color=ACC)
    ax.annotate("finish", (10**lt_end[150]*1.4, T[150]), fontsize=9, color=ACC)
    # 淬火路径: 抢在鼻尖左侧下穿 Ms, 止于图内
    t_q = np.logspace(-2, 0.1, 100)
    Tq = A1 - (A1-170)*(np.log10(t_q)+2)/2.1
    ax.plot(t_q, Tq, color=RED, lw=1.6, ls="--")
    ax.annotate("quench $\\rightarrow$ martensite", (0.012, 300), color=RED, fontsize=10)
    # 慢冷路径: 穿过 C 曲线
    t_s = np.logspace(0.3, 3.6, 100)
    Ts = A1 - 105*np.log10(t_s*3)
    ax.plot(t_s, Ts, color=GREEN, lw=1.6, ls="--")
    ax.annotate("slow cool $\\rightarrow$ pearlite", (100, 430), color=GREEN, fontsize=10)
    ax.set_xscale("log"); ax.set_xlim(0.01, 5e3); ax.set_ylim(150, 790)
    ax.set_xlabel("time (s, log)"); ax.set_ylabel("temperature ($^\\circ$C)")
    ax.set_title("TTT diagram (eutectoid steel, schematic)", fontsize=11)
    save(fig, "mat-07-ttt")

# ---------- 8.1 三家族应力应变 ----------
def fig_stress_strain():
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    # ceramic: steep, brittle
    e = np.linspace(0, 0.002, 50)
    ax.plot(e*100, 300e3*e/1e3, color=INK, lw=2.2)   # E=300GPa → MPa
    ax.plot([0.2], [600], "x", color=INK, ms=9, mew=2.5)
    ax.annotate("ceramic: stiff, brittle", (0.24, 590), fontsize=10)
    # metal: yield + hardening + necking
    e1 = np.linspace(0, 0.0015, 30); e2 = np.linspace(0.0015, 0.25, 200)
    s1 = 210e3*e1/1e3  # E=210GPa
    s2 = 315 + 340*(1 - np.exp(-(e2-0.0015)/0.07)) - 260*np.maximum(e2-0.18, 0)**1.5*30
    ax.plot(np.concatenate([e1, e2])*100, np.concatenate([s1, s2]), color=ACC, lw=2.2)
    ax.plot([25], [s2[-1]], "x", color=ACC, ms=9, mew=2.5)
    ax.annotate("metal: yields, work-hardens", (6, 700), fontsize=10, color=ACC)
    # polymer: soft, huge strain (drawn, 断轴示意用箭头)
    e3 = np.linspace(0, 0.30, 200)
    s3 = 60*np.tanh(e3/0.02)*0.7 + 90*e3
    ax.plot(e3*100, s3, color=GREEN, lw=2.2)
    ax.annotate("polymer: compliant,\nlarge strain $\\rightarrow$", (20.5, 120), fontsize=10, color=GREEN)
    ax.set_xlabel("strain (%)"); ax.set_ylabel("stress (MPa)")
    ax.set_xlim(0, 30); ax.set_ylim(0, 1000)
    save(fig, "mat-08-stressstrain")

# ---------- 8.2 Hall-Petch ----------
def fig_hallpetch():
    d = np.array([250, 100, 40, 16, 8, 4])  # μm
    x = 1/np.sqrt(d*1e-6)   # m^-1/2
    sigma = 70 + 0.55e-3*x/1e3*1e3  # σ0=70MPa, k=0.55 MPa·m^1/2 → σ=70+0.55*x(m^-1/2)/1e3? 直接算:
    sigma = 70 + 0.55*x/np.sqrt(1e6)*1e3  # k=0.55 MPa*mm^1/2 换算——直接用数值构造
    sigma = 70 + 0.11*x  # k·x, k=0.11 MPa·m^{1/2}
    rng = np.random.default_rng(3)
    pts = sigma + rng.normal(0, 8, len(sigma))
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    xs = np.linspace(0, x.max()*1.05, 50)
    ax.plot(xs, 70 + 0.11*xs, color=ACC, lw=2.0)
    ax.plot(x, pts, "o", color=RED, ms=6)
    for xi, di, yi in zip(x, d, pts):
        ax.annotate(f"{di} $\\mu$m", (xi, yi+11), fontsize=9, ha="center")
    ax.set_xlabel("$d^{-1/2}$ (m$^{-1/2}$)")
    ax.set_ylabel("yield strength $\\sigma_y$ (MPa)")
    ax.set_title("Hall-Petch: $\\sigma_y=\\sigma_0+k\\,d^{-1/2}$", fontsize=11)
    save(fig, "mat-08-hallpetch")

# ---------- 9.1 S-N 疲劳 ----------
def fig_sn():
    N = np.logspace(3, 8, 300)
    steel = 700*N**(-0.09)
    steel = np.maximum(steel, 320)     # 疲劳极限
    al = 480*N**(-0.11)                # 无极限
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.semilogx(N, steel, color=ACC, lw=2.2, label="steel: fatigue limit")
    ax.semilogx(N, al, color=RED, lw=2.2, label="aluminum: no limit")
    ax.axhline(320, color=GRID, ls=":", lw=1)
    ax.annotate("endurance limit\n$\\approx 0.4$–$0.5\\,\\sigma_{UTS}$", (2e6, 340), fontsize=10, color=ACC)
    ax.set_xlabel("cycles to failure $N$ (log)"); ax.set_ylabel("stress amplitude (MPa)")
    ax.legend(frameon=False)
    save(fig, "mat-09-sn")

# ---------- 10.1 聚合物模量-温度 ----------
def fig_modulusT():
    T = np.linspace(-50, 250, 500)
    Tg, Tf = 100, 200
    logE_amorph = 9.5 - 3.4/(1+np.exp(-(T-Tg)/6)) - 2.6/(1+np.exp(-(T-Tf)/8))
    logE_cross = 9.5 - 3.4/(1+np.exp(-(T-Tg)/6))   # 交联: 无流动段
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.plot(T, logE_amorph, color=ACC, lw=2.2, label="linear (thermoplastic)")
    ax.plot(T, logE_cross, color=GREEN, lw=2.0, ls="--", label="crosslinked (thermoset/rubber)")
    ax.axvline(Tg, color=GRID, ls=":", lw=1)
    ax.annotate("$T_g$", (Tg+4, 9.2), fontsize=12)
    ax.annotate("glassy $\\sim$GPa", (-45, 9.05), fontsize=10)
    ax.annotate("rubbery plateau $\\sim$MPa", (105, 6.35), fontsize=10)
    ax.annotate("flow", (215, 4.0), fontsize=10, color=ACC)
    ax.set_xlabel("temperature ($^\\circ$C)"); ax.set_ylabel("$\\log_{10} E$ (Pa)")
    ax.legend(frameon=False, loc="lower left")
    save(fig, "mat-10-modulusT")

# ---------- 11.1 Weibull ----------
def fig_weibull():
    s = np.linspace(0, 2, 300)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for m, c in [(5, ACC2), (10, ACC), (25, INK)]:
        F = 1 - np.exp(-(s)**m)
        ax.plot(s, F, lw=2.0, color=c, label=f"m = {m}")
    ax.axhline(0.632, color=GRID, ls=":", lw=1)
    ax.annotate("63.2% at $\\sigma=\\sigma_0$", (0.05, 0.66), fontsize=10)
    ax.set_xlabel("stress $\\sigma/\\sigma_0$"); ax.set_ylabel("failure probability $F$")
    ax.set_title("Weibull: $F=1-\\exp[-(\\sigma/\\sigma_0)^m]$", fontsize=11)
    ax.legend(frameon=False)
    save(fig, "mat-11-weibull")

# ---------- 12.1 半导体载流子 ----------
def fig_carriers():
    invT = np.linspace(1.0, 12, 400)   # 1000/T, T: 83–1000 K
    T = 1000/invT
    k = 8.617e-5
    Nd = 1e17
    Eg, Ed = 1.12, 0.045
    ni = 5e15*(T/300)**1.5*np.exp(-Eg/(2*k*T))*1e4   # 归一化的本征
    n_freeze = Nd*np.exp(-Ed/(2*k*T)*(T<120))        # 冻结段近似
    n = np.where(T > 500, ni + Nd, np.where(T > 120, Nd, Nd*np.exp(-Ed/(2*k*T))))
    n = np.maximum(n, ni)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.semilogy(invT, n, color=ACC, lw=2.2)
    ax.semilogy(invT, ni, color=RED, lw=1.4, ls="--")
    ax.annotate("intrinsic\n(slope $-E_g/2k$)", (1.2, 3e17), fontsize=10, color=RED)
    ax.annotate("extrinsic plateau\n$n\\approx N_d$ (device regime)", (4.5, 2.2e17), fontsize=10)
    ax.annotate("freeze-out", (10.2, 1.5e16), fontsize=10)
    ax.set_xlabel("$1000/T$ (K$^{-1}$)"); ax.set_ylabel("carrier density $n$ (cm$^{-3}$)")
    ax.set_ylim(1e14, 1e19)
    save(fig, "mat-12-carriers")

# ---------- 13.1 磁滞回线 ----------
def fig_hysteresis():
    H = np.linspace(-3, 3, 400)
    def loop(Hc, Ms):
        up = Ms*np.tanh((H+Hc)/0.6)
        dn = Ms*np.tanh((H-Hc)/0.6)
        return up, dn
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for Hc, c, lbl in [(0.15, ACC, "soft (transformer)"), (1.6, RED, "hard (permanent magnet)")]:
        up, dn = loop(Hc, 1.0)
        ax.plot(H, up, color=c, lw=2.0, label=lbl)
        ax.plot(H, dn, color=c, lw=2.0)
    ax.axhline(0, color=GRID, lw=0.8); ax.axvline(0, color=GRID, lw=0.8)
    ax.annotate("$H_c$ small\n= low loss", (-2.9, 0.55), fontsize=10, color=ACC)
    ax.annotate("$H_c$ large\n= hard to demagnetize", (0.75, -0.8), fontsize=10, color=RED)
    ax.set_xlabel("applied field $H$ (a.u.)"); ax.set_ylabel("magnetization $M/M_s$")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    save(fig, "mat-13-hysteresis")

# ---------- 22.1 Ashby 图 ----------
def fig_ashby():
    fams = [  # (name, rho range g/cc, E range GPa, color)
        ("foams", (0.03, 0.3), (1e-4, 0.2), ACC2),
        ("polymers", (0.9, 1.5), (0.1, 5), GREEN),
        ("woods", (0.4, 0.9), (2, 20), "#a58549"),
        ("metals", (2.5, 9), (40, 220), ACC),
        ("ceramics", (2.3, 4.0), (80, 450), INK),
        ("composites", (1.4, 2.0), (40, 250), RED),
    ]
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    from matplotlib.patches import Ellipse
    import matplotlib.transforms as mtr
    for name, (r1, r2), (e1, e2), c in fams:
        cx, cy = np.sqrt(r1*r2), np.sqrt(e1*e2)
        w, h = np.log10(r2/r1), np.log10(e2/e1)
        ell = Ellipse((np.log10(cx), np.log10(cy)), w, h, facecolor=c, alpha=0.30, edgecolor=c, lw=1.5)
        ax.add_patch(ell)
        ax.annotate(name, (np.log10(cx), np.log10(cy)), fontsize=10, ha="center", color=INK)
    # guideline E^{1/2}/rho = const (stiff beam per weight)
    r = np.linspace(-1.6, 1.05, 50)
    ax.plot(r, 2*r + 1.2, color=GRID, lw=1.2, ls="--")
    ax.annotate("guide: $E^{1/2}/\\rho$ = const\n(light stiff beam)", (-1.5, -1.15), fontsize=9)
    ax.set_xlim(-1.7, 1.15); ax.set_ylim(-4.3, 3.2)
    ax.set_xlabel("$\\log_{10}$ density (g/cm$^3$)")
    ax.set_ylabel("$\\log_{10}$ Young's modulus (GPa)")
    ax.set_title("Ashby chart: stiffness vs density (schematic)", fontsize=11)
    save(fig, "mat-22-ashby")

if __name__ == "__main__":
    fig_potential(); fig_vacancy(); fig_glass(); fig_lens(); fig_diffusion()
    fig_ttt(); fig_stress_strain(); fig_hallpetch(); fig_sn(); fig_modulusT()
    fig_weibull(); fig_carriers(); fig_hysteresis(); fig_ashby()
    print("all figures done")
