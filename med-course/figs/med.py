"""基础医学站 [plot] 轨插图：图内一律英文，中文进 figcaption。
运行: ~/ai-course/.venv/bin/python figs/med.py
"""
from _common import plt, np, ACC, ACC2, INK, GRID, RED, GREEN, save

# ---------- 3.1 体液分区与张力 ----------
def fig_fluid():
    fig, axes = plt.subplots(1, 2, figsize=(10.4, 4.2),
                             gridspec_kw={"width_ratios": [1.05, 1]})
    # 左：分区柱
    ax = axes[0]
    ax.bar([0], [28], width=.55, color=ACC, label="ICF  28 L")
    ax.bar([1], [11], width=.55, color=ACC2, label="interstitial  11 L")
    ax.bar([1], [3], width=.55, bottom=11, color=RED, label="plasma  3 L")
    ax.set_xticks([0, 1]); ax.set_xticklabels(["intracellular\n(ICF)", "extracellular\n(ECF)"])
    ax.set_ylabel("volume (L)"); ax.set_ylim(0, 32)
    ax.set_title("total body water 42 L  (70 kg, 60%)", fontsize=11)
    for x, y, t in [(0, 28, "40% BW"), (1, 14, "20% BW")]:
        ax.text(x, y + .8, t, ha="center", fontsize=10, color=INK)
    ax.legend(frameon=False, fontsize=9, loc="upper right")

    # 右：不同张力液体后细胞体积
    ax = axes[1]
    labels = ["isotonic\n(0.9% NaCl)", "hypotonic\n(free water)", "hypertonic\n(3% NaCl)"]
    icf = [0, 12, -10]      # 细胞体积变化 %
    ecf = [22, 8, 16]
    x = np.arange(3); w = .36
    ax.bar(x - w/2, icf, w, color=ACC, label="cell (ICF) volume")
    ax.bar(x + w/2, ecf, w, color=ACC2, label="ECF volume")
    ax.axhline(0, color="#444", lw=1)
    ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=9.5)
    ax.set_ylabel("change in volume (%)")
    ax.set_ylim(-16, 28)
    ax.annotate("cells swell\n(risk: cerebral edema)", (1, 14.5), ha="center",
                fontsize=9.5, color=RED)
    ax.annotate("cells shrink\n(risk: osmotic demyelination\nif corrected too fast)",
                (2, -15.5), ha="center", va="top", fontsize=9.5, color=RED)
    ax.legend(frameon=False, fontsize=9, loc="upper left")
    save(fig, "med-03-fluid")


# ---------- 4.1 氧解离曲线 ----------
def fig_oxygen():
    def sat(p, p50=27.0, n=2.8):
        return 100 * p**n / (p50**n + p**n)
    p = np.linspace(0.5, 110, 500)
    fig, ax = plt.subplots(figsize=(6.8, 4.8))
    ax.plot(p, sat(p), color=ACC, lw=2.6, label="normal  ($P_{50}=27$)")
    ax.plot(p, sat(p, 36), color=RED, lw=2.0, ls="--",
            label="right shift  ($\\uparrow$T, $\\uparrow P_{CO_2}$, $\\downarrow$pH, $\\uparrow$2,3-BPG)")
    ax.plot(p, sat(p, 20), color=GREEN, lw=2.0, ls=":",
            label="left shift  (CO, stored blood, alkalosis)")
    # P50 标记
    ax.plot([27, 27], [0, 50], color=GRID, lw=1)
    ax.plot([0, 27], [50, 50], color=GRID, lw=1)
    ax.text(28, 8, "$P_{50}$ = 27", fontsize=10, color=INK)
    # 生理点
    for px, txt, dy in [(100, "arterial\n$P_aO_2$ 100", 6), (40, "mixed venous\n40", -22)]:
        ax.plot([px], [sat(px)], "o", color=INK, ms=6)
        ax.annotate(txt, (px - 3, sat(px) + dy), fontsize=9.5, color=INK, ha="right")
    # 60 mmHg 悬崖
    ax.axvline(60, color=RED, lw=1.2, ls="-.")
    ax.annotate("60 mmHg $\\approx$ 90% sat:\nknee of the curve", (62, 26),
                fontsize=9.5, color=RED)
    ax.set_xlabel("$PO_2$ (mmHg)"); ax.set_ylabel("Hb $O_2$ saturation (%)")
    ax.set_xlim(0, 110); ax.set_ylim(0, 104)
    ax.legend(frameon=False, fontsize=9, loc="lower right")
    save(fig, "med-04-oxygen")


# ---------- 5.1 缺血损伤时间进程 ----------
def fig_injury():
    t = np.linspace(0, 60, 600)
    atp = 100 * np.exp(-t / 6.0) + 3
    na = 100 * (1 - np.exp(-t / 9.0))          # 细胞内钠 / 肿胀
    ca = 100 / (1 + np.exp(-(t - 26) / 4.0))   # 胞内钙飙升
    enz = 100 / (1 + np.exp(-(t - 40) / 5.0))  # 酶漏出
    fig, ax = plt.subplots(figsize=(7.4, 4.4))
    ax.plot(t, atp, color=ACC, lw=2.4, label="ATP")
    ax.plot(t, na, color=ACC2, lw=2.2, label="cell swelling (Na$^+$, water influx)")
    ax.plot(t, ca, color=RED, lw=2.4, label="cytosolic Ca$^{2+}$")
    ax.plot(t, enz, color=INK, lw=2.0, ls="--", label="enzyme leak into blood")
    ax.axvspan(0, 25, color=GREEN, alpha=.10)
    ax.axvspan(25, 60, color=RED, alpha=.08)
    ax.axvline(25, color=RED, lw=1.6)
    ax.annotate("point of no return\n(mPTP opening)", (26, 88), fontsize=10, color=RED)
    ax.text(12, 8, "REVERSIBLE", fontsize=11, color=GREEN, ha="center", weight="bold")
    ax.text(43, 8, "IRREVERSIBLE", fontsize=11, color=RED, ha="center", weight="bold")
    ax.set_xlabel("minutes of ischemia (myocardium)")
    ax.set_ylabel("relative level (%)")
    ax.set_xlim(0, 60); ax.set_ylim(0, 105)
    ax.legend(frameon=False, fontsize=9, loc="center right")
    save(fig, "med-05-injury")


# ---------- 7.1 休克四型 ----------
def fig_shock():
    fig, ax = plt.subplots(figsize=(6.8, 5.2))
    # (CO, SVR, filling pressure -> size)
    pts = [("hypovolemic", 45, 155, 22, ACC),
           ("cardiogenic", 42, 150, 62, RED),
           ("obstructive", 44, 148, 55, INK),
           ("distributive\n(septic, anaphylactic,\nneurogenic)", 145, 48, 30, GREEN)]
    ax.axvline(100, color=GRID, lw=1.2, ls="--")
    ax.axhline(100, color=GRID, lw=1.2, ls="--")
    for name, co, svr, size, c in pts:
        ax.scatter([co], [svr], s=size * 22, color=c, alpha=.45, edgecolors=c, lw=1.6)
        ax.scatter([co], [svr], s=26, color=c)
        va = "bottom" if svr > 100 else "top"
        ax.annotate(name, (co, svr + (16 if svr > 100 else -16)), ha="center",
                    va=va, fontsize=10, color=c)
    ax.text(100, 190, "normal", ha="center", fontsize=10, color=GRID)
    ax.scatter([100], [100], s=40, color=GRID)
    ax.text(30, 182, "cold, clammy skin", fontsize=10, color=INK)
    ax.text(118, 30, "warm skin (early)", fontsize=10, color=GREEN)
    ax.set_xlabel("cardiac output (% of normal)")
    ax.set_ylabel("systemic vascular resistance (% of normal)")
    ax.set_xlim(10, 190); ax.set_ylim(10, 200)
    ax.set_title("bubble size $\\propto$ filling pressure (preload)", fontsize=10.5)
    save(fig, "med-07-shock")


# ---------- 8.1 肿瘤生长与检出阈 ----------
def fig_tumor():
    n = np.arange(0, 41)            # 倍增次数
    cells = 2.0 ** n
    fig, ax = plt.subplots(figsize=(7.4, 4.6))
    ax.semilogy(n, cells, color=ACC, lw=2.6)
    ax.axhline(1e9, color=RED, lw=1.6, ls="--")
    ax.axhline(1e12, color=INK, lw=1.6, ls=":")
    ax.annotate("clinical detection limit\n$10^9$ cells $\\approx$ 1 g $\\approx$ 1 cm",
                (0.5, 3e9), fontsize=10, color=RED)
    ax.annotate("lethal burden $\\approx 10^{12}$", (0.5, 3e12), fontsize=10, color=INK)
    ax.axvspan(0, 30, color=ACC2, alpha=.22)
    ax.axvspan(30, 40, color=RED, alpha=.10)
    ax.text(15, 1e2, "occult:\n~30 doublings\nbefore detectable",
            ha="center", fontsize=10.5, color=INK)
    ax.text(35, 1e2, "clinically\napparent:\n10 doublings",
            ha="center", fontsize=10.5, color=RED)
    ax.set_xlabel("number of tumor doublings")
    ax.set_ylabel("tumor cell number (log scale)")
    ax.set_xlim(0, 40); ax.set_ylim(1, 1e14)
    save(fig, "med-08-tumor")


# ---------- 13.1 单剂量 PK ----------
def fig_pk_single():
    t = np.linspace(0, 12, 600)
    one = 100 * np.exp(-0.30 * t)
    two = 70 * np.exp(-1.6 * t) + 30 * np.exp(-0.22 * t)
    fig, ax = plt.subplots(figsize=(7.0, 4.6))
    ax.semilogy(t, one, color=ACC, lw=2.5, label="one-compartment")
    ax.semilogy(t, two, color=RED, lw=2.5, ls="--", label="two-compartment")
    # 消除相外推
    ax.semilogy(t, 30 * np.exp(-0.22 * t), color=GRID, lw=1.4, ls=":")
    ax.annotate("$\\alpha$ phase\n(distribution)", (0.35, 26), fontsize=10, color=RED)
    ax.annotate("$\\beta$ phase (elimination)", (5.4, 12), fontsize=10, color=RED)
    ax.annotate("slope $= -k/2.303$", (5.0, 30), fontsize=10, color=ACC)
    ax.set_xlabel("time after IV bolus (h)")
    ax.set_ylabel("plasma concentration (log scale)")
    ax.set_xlim(0, 12); ax.set_ylim(1, 130)
    ax.legend(frameon=False, fontsize=10, loc="upper right")
    save(fig, "med-13-pk-single")


# ---------- 13.2 多剂量与负荷剂量 ----------
def fig_pk_multi():
    thalf = 6.0
    k = np.log(2) / thalf
    T = 42.0
    t = np.linspace(0, T, 3000)

    def regimen(dose, tau, loading=0.0):
        c = np.zeros_like(t)
        if loading:
            c += loading * np.exp(-k * t)
        n = 0
        while n * tau <= T:
            m = t >= n * tau
            c[m] += dose * np.exp(-k * (t[m] - n * tau))
            n += 1
        return c

    css_avg = 100.0
    fig, ax = plt.subplots(figsize=(7.8, 4.6))
    ax.plot(t, regimen(100, 6), color=ACC, lw=2.3, label="100 mg q6h, no loading dose")
    ax.plot(t, regimen(50, 3), color=GREEN, lw=1.8, ls=":",
            label="50 mg q3h (same daily dose)")
    ax.plot(t, regimen(100, 6, loading=100), color=RED, lw=2.3, ls="--",
            label="with loading dose")
    # 半衰期刻度单独标在底部空白带，不与图例争位
    for i in range(1, 6):
        ax.axvline(i * thalf, color=GRID, lw=.8, ls=":")
        ax.text(i * thalf, 8, f"{i}", fontsize=9, color="#9a9a9a", ha="center")
    ax.text(5 * thalf + 2.2, 8, "half-lives", fontsize=9, color="#9a9a9a", ha="left")
    ax.axhline(200, color=INK, lw=1.2, ls="-.")
    ax.annotate("steady-state peak ($\\approx$ 4–5 $t_{1/2}$)", (0.6, 207),
                fontsize=10, color=INK)
    ax.set_xlabel("time (h),   $t_{1/2}$ = 6 h")
    ax.set_ylabel("plasma concentration (arb.)")
    ax.set_xlim(0, T); ax.set_ylim(0, 262)
    ax.legend(frameon=False, fontsize=9.5, loc="upper right")
    save(fig, "med-13-pk-multi")


# ---------- 14.1 量效曲线 ----------
def fig_doseresponse():
    d = np.logspace(-2, 3, 500)
    def curve(emax, ec50, base=0.0):
        return base + (emax - base) * d / (d + ec50)
    fig, axes = plt.subplots(1, 2, figsize=(11.0, 4.4), sharey=True)

    ax = axes[0]
    ax.semilogx(d, curve(100, 1), color=ACC, lw=2.6, label="full agonist")
    ax.semilogx(d, curve(55, 1), color=RED, lw=2.4, ls="--", label="partial agonist")
    ax.semilogx(d, curve(-30, 1, base=20), color=GREEN, lw=2.2, ls=":",
                label="inverse agonist")
    ax.axhline(20, color=GRID, lw=1.0)
    ax.text(0.012, 23, "constitutive activity", fontsize=9, color=GRID)
    ax.set_ylabel("response (% of maximum)")
    ax.set_xlabel("dose (log scale)")
    ax.set_title("intrinsic activity", fontsize=11)
    ax.legend(frameon=False, fontsize=9.5, loc="center left")

    ax = axes[1]
    ax.semilogx(d, curve(100, 1), color=ACC, lw=2.6, label="agonist alone")
    ax.semilogx(d, curve(100, 10), color=RED, lw=2.4, ls="--",
                label="+ competitive antagonist")
    ax.semilogx(d, curve(48, 1), color=INK, lw=2.4, ls=":",
                label="+ non-competitive / irreversible")
    ax.annotate("", xy=(9, 50), xytext=(1.1, 50),
                arrowprops=dict(arrowstyle="->", color=RED, lw=1.8))
    ax.text(2.0, 55, "parallel\nright shift", fontsize=9.5, color=RED, ha="center")
    ax.annotate("", xy=(300, 50), xytext=(300, 96),
                arrowprops=dict(arrowstyle="->", color=INK, lw=1.8))
    ax.text(150, 70, "$E_{max}$\nsuppressed", fontsize=9.5, color=INK, ha="right")
    ax.set_xlabel("agonist dose (log scale)")
    ax.set_title("antagonism", fontsize=11)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    ax.set_ylim(-12, 108)
    save(fig, "med-14-doseresponse")


# ---------- 17.1 压力-容积环 ----------
def fig_pvloop():
    def loop(edv, esv, peak, edp_a, edp_b, n=400):
        """构造 P-V 环：舒张充盈 -> 等容收缩 -> 射血 -> 等容舒张"""
        # 舒张末压容关系（指数）
        v_fill = np.linspace(esv, edv, n)
        p_fill = edp_a * (np.exp(edp_b * (v_fill - 20)) - 1)
        # 射血段（从 edv 到 esv，压力先升后降）
        v_ej = np.linspace(edv, esv, n)
        frac = (edv - v_ej) / (edv - esv)
        p_ej = peak * (0.72 + 0.28 * np.sin(np.pi * frac))
        p_iso_c = np.linspace(p_fill[-1], p_ej[0], 60)
        p_iso_r = np.linspace(p_ej[-1], p_fill[0], 60)
        v = np.concatenate([v_fill, np.full(60, edv), v_ej, np.full(60, esv)])
        p = np.concatenate([p_fill, p_iso_c, p_ej, p_iso_r])
        return v, p

    fig, ax = plt.subplots(figsize=(7.6, 5.4))
    # 先画两条舒张末压容关系(EDPVR)作背景——"僵硬"这个概念只有它能显示
    # 各条 EDPVR 只画到自身工作区，避免穿过别的环造成误读
    v1 = np.linspace(30, 150, 200)
    ax.plot(v1, 0.7 * (np.exp(0.024 * (v1 - 20)) - 1), color=GRID, lw=1.4)
    ax.text(133, 24, "normal\nEDPVR", fontsize=9, color="#8a8a8a")
    v2 = np.linspace(30, 122, 200)
    ax.plot(v2, 1.5 * (np.exp(0.032 * (v2 - 20)) - 1), color=GREEN, lw=1.4, alpha=.6)
    ax.text(96, 52, "stiff EDPVR\n(HFpEF)", fontsize=9, color=GREEN, ha="right")
    v3 = np.linspace(120, 235, 200)
    ax.plot(v3, 0.30 * (np.exp(0.0215 * (v3 - 20)) - 1), color=RED, lw=1.4, alpha=.5)
    ax.text(178, 12, "shifted-right EDPVR (HFrEF)", fontsize=9, color=RED, alpha=.85)

    v, p = loop(120, 50, 120, 0.7, 0.024)
    ax.plot(v, p, color=ACC, lw=2.6, label="normal   EDV 120, SV 70, EF 58%")
    v, p = loop(215, 158, 105, 0.30, 0.0215)
    ax.plot(v, p, color=RED, lw=2.4, ls="--", label="HFrEF   EDV 215, SV 57, EF 27%")
    v, p = loop(105, 45, 150, 1.5, 0.032)
    ax.plot(v, p, color=GREEN, lw=2.4, ls=":", label="HFpEF   EDV 105, SV 60, EF 57%")

    # 舒张末压力点：三者的关键差别
    for edv, a, b, c in [(120, 0.7, 0.024, ACC), (215, 0.30, 0.0215, RED),
                         (105, 1.5, 0.032, GREEN)]:
        edp = a * (np.exp(b * (edv - 20)) - 1)
        ax.plot([edv], [edp], "o", color=c, ms=7, zorder=5)
        ax.annotate(f"EDP {edp:.0f}", (edv + 3, edp + 3), fontsize=9.5, color=c)

    ax.annotate("dilated:\nlarge volume,\nsmall stroke volume", (222, 62),
                fontsize=9.5, color=RED, ha="right")
    ax.set_xlabel("LV volume (mL)"); ax.set_ylabel("LV pressure (mmHg)")
    ax.set_xlim(20, 240); ax.set_ylim(0, 205)
    ax.set_yticks([0, 20, 40, 60, 80, 100, 120, 140, 160])
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    save(fig, "med-17-pvloop")


# ---------- 18.1 流量-容积环 ----------
def fig_spirometry():
    def fvloop(tlc, rv, pef, scoop=0.0):
        """呼气支 + 吸气支；容积轴从 TLC 向 RV 递减"""
        v_ex = np.linspace(tlc, rv, 400)
        frac = (tlc - v_ex) / (tlc - rv)         # 0 -> 1
        # 呼气：快速达峰后线性下降；scoop 制造凹陷
        flow = pef * (1 - frac)
        rise = np.clip(frac / 0.10, 0, 1)
        flow = flow * rise
        if scoop:
            flow = flow * (1 - scoop * np.sin(np.pi * frac) ** 0.8)
        v_in = np.linspace(rv, tlc, 400)
        fin = -0.55 * pef * np.sin(np.pi * (v_in - rv) / (tlc - rv))
        return np.concatenate([v_ex, v_in]), np.concatenate([flow, fin])

    fig, ax = plt.subplots(figsize=(7.2, 5.0))
    v, f = fvloop(6.0, 1.5, 9.5)
    ax.plot(v, f, color=ACC, lw=2.6, label="normal")
    v, f = fvloop(7.8, 3.4, 6.2, scoop=0.62)
    ax.plot(v, f, color=RED, lw=2.4, ls="--", label="obstructive (COPD, asthma)")
    v, f = fvloop(3.6, 1.1, 6.0)
    ax.plot(v, f, color=GREEN, lw=2.4, ls=":", label="restrictive (fibrosis)")
    ax.axhline(0, color="#444", lw=1.0)
    ax.annotate("scooped-out\nexpiratory limb", (5.6, 1.3), fontsize=9.5, color=RED)
    ax.annotate("smaller loop,\nlower volumes", (2.15, 6.6), fontsize=9.5, color=GREEN,
                ha="center")
    # x 轴已反转：靠图右侧 = 小容积，故用 ha="left"
    ax.text(1.35, 8.6, "expiration $\\uparrow$", fontsize=10, color=INK, ha="left")
    ax.text(1.35, -5.4, "inspiration $\\downarrow$", fontsize=10, color=INK, ha="left")
    ax.invert_xaxis()
    ax.set_xlabel("lung volume (L)   —   TLC on the left, RV on the right")
    ax.set_ylabel("flow (L/s)")
    ax.set_ylim(-6.6, 11.5)
    ax.legend(frameon=False, fontsize=10, loc="upper left")
    save(fig, "med-18-spirometry")


# ---------- 20.1 OGTT 与胰岛素双相 ----------
def fig_glucose():
    fig, axes = plt.subplots(1, 2, figsize=(11.0, 4.3))
    t = np.linspace(0, 180, 400)

    def ogtt(base, peak, tp, decay):
        return base + (peak - base) * (t / tp) * np.exp(1 - t / tp) * np.exp(-t / decay * 0)

    ax = axes[0]
    for base, peak, tp, c, ls, lab in [
            (5.0, 8.0, 42, ACC, "-", "normal  (2 h < 7.8)"),
            (5.8, 11.0, 52, RED, "--", "IGT  (2 h 7.8–11.0)"),
            (7.6, 15.2, 66, INK, ":", "diabetes  (2 h $\\geq$ 11.1)")]:
        y = base + (peak - base) * (t / tp) * np.exp(1 - t / tp)
        ax.plot(t, y, color=c, lw=2.4, ls=ls, label=lab)
    ax.axhline(11.1, color=INK, lw=1.0, ls="-.")
    ax.axhline(7.8, color=RED, lw=1.0, ls="-.")
    ax.axvline(120, color=GRID, lw=1.2)
    ax.text(122, 3.2, "2 h", fontsize=10, color=GRID)
    ax.set_xlabel("minutes after 75 g oral glucose")
    ax.set_ylabel("plasma glucose (mmol/L)")
    ax.set_xlim(0, 180); ax.set_ylim(2, 17)
    ax.legend(frameon=False, fontsize=9.5, loc="upper right")
    ax.set_title("oral glucose tolerance test", fontsize=11)

    ax = axes[1]
    tt = np.linspace(0, 60, 400)
    first = 55 * np.exp(-((tt - 4) / 2.4) ** 2)
    second = 42 * (1 - np.exp(-tt / 22))
    ax.plot(tt, first + second, color=ACC, lw=2.5, label="normal")
    ax.plot(tt, 5 * np.exp(-((tt - 4) / 2.4) ** 2) + 52 * (1 - np.exp(-tt / 34)),
            color=RED, lw=2.4, ls="--", label="type 2 diabetes")
    ax.annotate("1st phase lost\n(earliest defect)", (7, 62), fontsize=9.5, color=RED)
    ax.annotate("2nd phase:\nprolonged, compensatory", (30, 20), fontsize=9.5, color=INK)
    ax.set_xlabel("minutes after IV glucose")
    ax.set_ylabel("insulin secretion (arb.)")
    ax.set_xlim(0, 60); ax.set_ylim(0, 105)
    ax.legend(frameon=False, fontsize=9.5, loc="lower right")
    ax.set_title("biphasic insulin secretion", fontsize=11)
    save(fig, "med-20-glucose")


if __name__ == "__main__":
    fig_fluid(); fig_oxygen(); fig_injury(); fig_shock(); fig_tumor()
    fig_pk_single(); fig_pk_multi(); fig_doseresponse()
    fig_pvloop(); fig_spirometry(); fig_glucose()
