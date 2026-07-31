"""微电子七图：二极管IV / MOSFET IV / 缩放趋势 / 器件演进 / 反相器VTC / 时序 / ADC抖动 / 光刻 / 良率。
运行：cd figs && ~/ai-course/.venv/bin/python micro.py"""
import numpy as np
import matplotlib.patches as mpatches
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

VT = 0.02585  # kT/q at 300K

# ── 图 2-1 · 二极管 IV（线性 + 半对数）──────────────────
def diode():
    V = np.linspace(-0.2, 0.85, 600)
    Is = 1e-14
    I = Is*(np.exp(V/VT) - 1)
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 4.0))
    a1.plot(V, I*1e3, color=ACC, lw=2.4)
    a1.set_xlabel("$V$  (V)"); a1.set_ylabel("$I$  (mA)")
    a1.set_ylim(-0.5, 12); a1.set_xlim(-0.2, 0.85)
    a1.axvline(0.7, color=RED, ls="--", lw=1.2)
    a1.text(0.44, 9.0, 'apparent\n"turn-on"\n~0.7 V', fontsize=9.5, color=RED)
    a1.set_title("Linear scale", color=INK, fontsize=12)
    Vp = np.linspace(0.1, 0.85, 400)
    Ip = Is*np.exp(Vp/VT)
    a2.semilogy(Vp, Ip, color=ACC, lw=2.4)
    # 60 mV/dec 标注
    a2.annotate("", xy=(0.50, Is*np.exp(0.50/VT)), xytext=(0.44, Is*np.exp(0.44/VT)),
                arrowprops=dict(arrowstyle="<->", color=RED, lw=1.6))
    a2.text(0.52, Is*np.exp(0.455/VT), "~60 mV\nper decade", fontsize=10, color=RED)
    a2.set_xlabel("$V$  (V)"); a2.set_ylabel("$I$  (A, log)")
    a2.set_title("Semi-log scale: a straight line", color=INK, fontsize=12)
    fig.tight_layout()
    save(fig, "mic_diode")

# ── 图 3-1 · MOSFET 输出/转移特性 ───────────────────────
def mosfet_iv():
    k, Vth, lam = 2e-4, 0.4, 0.06
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.4, 4.1))
    Vds = np.linspace(0, 1.2, 400)
    for Vgs, c in zip([0.6, 0.8, 1.0, 1.2],
                      [ACC2, "#7fa0ac", ACC, "#31505c"]):
        Vov = Vgs - Vth
        Id = np.where(Vds < Vov,
                      k*(Vov*Vds - Vds**2/2),
                      0.5*k*Vov**2*(1 + lam*(Vds - Vov)))
        a1.plot(Vds, Id*1e3, color=c, lw=2.2, label=f"$V_{{GS}}$={Vgs} V")
        a1.plot([Vov], [0.5*k*Vov**2*1e3], "o", color=RED, ms=4.5, zorder=5)
    a1.plot([], [], "o", color=RED, ms=4.5, label="pinch-off")
    a1.set_xlabel("$V_{DS}$  (V)"); a1.set_ylabel("$I_D$  (mA)")
    a1.set_title("Output characteristics", color=INK, fontsize=12)
    a1.legend(frameon=False, fontsize=8.5, loc="upper left")
    a1.text(0.11, 0.062, "linear", fontsize=9, color="#666", rotation=62)
    a1.text(0.85, 0.045, "saturation", fontsize=9, color="#666")

    Vgs = np.linspace(0, 1.3, 400)
    Id = np.where(Vgs > Vth, 0.5*k*(Vgs-Vth)**2, 0)
    a2.plot(Vgs, Id*1e3, color=ACC, lw=2.6)
    a2.axvline(Vth, color=RED, ls="--", lw=1.2)
    a2.text(Vth+0.03, 0.055, "$V_{th}$", fontsize=11, color=RED)
    a2.set_xlabel("$V_{GS}$  (V)"); a2.set_ylabel("$I_D$  (mA)")
    a2.set_title("Transfer characteristic (square law)", color=INK, fontsize=12)
    fig.tight_layout()
    save(fig, "mic_mosfet_iv")

# ── 图 4-1 · 缩放趋势与 Dennard 终结 ────────────────────
def scaling():
    yr = np.arange(1975, 2026)
    def cap(x, knee, slope_a, slope_b, v0):
        return np.where(x < knee, v0*10**(slope_a*(x-1975)),
                        v0*10**(slope_a*(knee-1975) + slope_b*(x-knee)))
    tr = 2.3e3*10**(0.15*(yr-1975))                       # 晶体管数
    fr = cap(yr, 2004, 0.055, 0.004, 2.0)                 # 频率 MHz
    st = cap(yr, 2004, 0.048, 0.012, 1.0)                 # 单线程性能
    vd = np.where(yr < 2004, 5.0*10**(-0.020*(yr-1975)), 1.05)  # 电压
    co = np.where(yr < 2004, 1.0, 10**(0.055*(yr-2004)))  # 核心数
    fig, ax = plt.subplots(figsize=(7.4, 4.6))
    ax.semilogy(yr, tr, color=ACC, lw=2.4, label="transistors per chip")
    ax.semilogy(yr, fr, color=RED, lw=2.2, label="clock frequency (MHz)")
    ax.semilogy(yr, st, color=GREEN, lw=2.0, label="single-thread perf.")
    ax.semilogy(yr, co, color="#8a6a3a", lw=2.0, label="number of cores")
    ax.semilogy(yr, vd, color=ACC2, lw=2.0, ls="--", label="supply voltage (V)")
    ax.axvline(2004, color="#888", ls=":", lw=1.4)
    ax.text(2005, 3e8, "Dennard scaling\nends (~2005)", fontsize=9.5, color="#555")
    ax.annotate("frequency plateaus", xy=(2016, fr[yr == 2016][0]),
                xytext=(1988, 2e5), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.annotate("cores take over", xy=(2018, co[yr == 2018][0]),
                xytext=(1996, 4e1), fontsize=9.5, color="#8a6a3a",
                arrowprops=dict(arrowstyle="->", color="#8a6a3a"))
    ax.set_xlabel("year"); ax.set_ylabel("relative value  (log)")
    ax.set_title("Forty years of microprocessor trends (schematic)", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9, loc="upper left")
    ax.set_ylim(0.5, 1e10)
    save(fig, "mic_scaling")

# ── 图 5-1 · 器件结构演进 + 亚阈值 ──────────────────────
def device_evolution():
    fig = plt.figure(figsize=(9.6, 4.2))
    gs = fig.add_gridspec(1, 2, width_ratios=[1.25, 1])
    axL = fig.add_subplot(gs[0]); axR = fig.add_subplot(gs[1])
    # 左：三种结构示意
    def draw(ax, x0, kind, label):
        if kind == "planar":
            ax.add_patch(mpatches.Rectangle((x0, 0.2), 1.5, 0.42, fc=ACC2, ec=ACC, lw=1.4))
            ax.add_patch(mpatches.Rectangle((x0+0.25, 0.62), 1.0, 0.16, fc=RED, ec="none", alpha=.85))
            ax.text(x0+0.75, 0.86, "gate", ha="center", fontsize=9, color=RED)
        elif kind == "fin":
            ax.add_patch(mpatches.Rectangle((x0+0.55, 0.2), 0.4, 0.72, fc=ACC2, ec=ACC, lw=1.4))
            ax.add_patch(mpatches.Rectangle((x0+0.35, 0.34), 0.8, 0.16, fc=RED, ec="none", alpha=.5))
            ax.add_patch(mpatches.Rectangle((x0+0.35, 0.34), 0.8, 0.52, fc="none", ec=RED, lw=2.4))
            ax.text(x0+0.75, 0.98, "3 sides", ha="center", fontsize=9, color=RED)
        else:
            for i, yy in enumerate([0.28, 0.52, 0.76]):
                ax.add_patch(mpatches.Rectangle((x0+0.35, yy), 0.8, 0.13, fc=ACC2, ec=ACC, lw=1.3))
                ax.add_patch(mpatches.Rectangle((x0+0.28, yy-0.055), 0.94, 0.24,
                             fc="none", ec=RED, lw=2.0))
            ax.text(x0+0.75, 1.02, "all around", ha="center", fontsize=9, color=RED)
        ax.text(x0+0.75, 0.03, label, ha="center", fontsize=10.5, color=INK)
    draw(axL, 0.1, "planar", "Planar")
    draw(axL, 2.0, "fin", "FinFET")
    draw(axL, 3.9, "gaa", "GAA nanosheet")
    axL.set_xlim(0, 5.6); axL.set_ylim(-0.05, 1.15)
    axL.set_xticks([]); axL.set_yticks([])
    for s in axL.spines.values():
        s.set_visible(False)
    axL.set_title("Stronger gate control by wrapping", color=INK, fontsize=12)
    # 右：亚阈值斜率
    Vg = np.linspace(0, 0.7, 400)
    for SS, c, lab in [(100, "#b3452f", "planar  (SS ~100 mV/dec)"),
                       (75, ACC2, "FinFET  (~75)"),
                       (65, ACC, "GAA  (~65)")]:
        I = 1e-10*10**(Vg/(SS*1e-3))
        axR.semilogy(Vg, np.minimum(I, 1e-4), color=c, lw=2.3, label=lab)
    axR.set_xlabel("$V_{GS}$  (V)"); axR.set_ylabel("$I_D$  (A, log)")
    axR.set_title("Subthreshold swing", color=INK, fontsize=12)
    axR.legend(frameon=False, fontsize=8.5, loc="lower right")
    axR.set_ylim(1e-11, 3e-4)
    fig.tight_layout()
    save(fig, "mic_device_evolution")

# ── 图 6-1 · 反相器 VTC 与噪声容限 ──────────────────────
def inverter_vtc():
    Vdd, Vth = 1.0, 0.35
    Vin = np.linspace(0, Vdd, 700)
    # 简化解析：用 tanh 拟合陡峭过渡
    Vout = Vdd/2*(1 - np.tanh((Vin - Vdd/2)*14))
    fig, ax = plt.subplots(figsize=(6.4, 4.4))
    ax.plot(Vin, Vout, color=ACC, lw=2.8)
    VIL, VIH = 0.40, 0.60
    VOL, VOH = 0.03, 0.97
    ax.axvspan(0, VIL, color=GREEN, alpha=0.12)
    ax.axvspan(VIH, Vdd, color=GREEN, alpha=0.12)
    for x, lab in [(VIL, "$V_{IL}$"), (VIH, "$V_{IH}$")]:
        ax.axvline(x, color=RED, ls="--", lw=1.1)
        ax.text(x, -0.075, lab, ha="center", fontsize=10.5, color=RED)
    ax.annotate("", xy=(0, VOL), xytext=(0, VOH+0.0),
                arrowprops=dict(arrowstyle="<->", color="#888", lw=1.2))
    ax.plot([0, VIL], [VOH, VOH], color="#999", lw=.9, ls=":")
    ax.plot([VIH, Vdd], [VOL, VOL], color="#999", lw=.9, ls=":")
    ax.text(0.06, 0.80, "$NM_H$", fontsize=10.5, color="#444")
    ax.text(0.72, 0.12, "$NM_L$", fontsize=10.5, color="#444")
    ax.text(0.5, 0.55, "high gain\nregion", fontsize=9.5, color=RED, ha="center")
    ax.set_xlabel("$V_{in}$  (V)"); ax.set_ylabel("$V_{out}$  (V)")
    ax.set_title("CMOS inverter voltage transfer curve", color=INK, fontsize=12.5)
    ax.set_xlim(0, Vdd); ax.set_ylim(-0.02, 1.02)
    save(fig, "mic_inverter_vtc")

# ── 图 7-1 · 建立/保持时序窗口 ──────────────────────────
def timing():
    fig, ax = plt.subplots(figsize=(7.2, 3.9))
    T = 10.0
    t = np.linspace(0, 2*T, 1000)
    clk = 0.5*(1 + np.sign(np.sin(2*np.pi*t/T)))
    ax.plot(t, clk*0.55 + 2.5, color=ACC, lw=1.8)
    ax.text(-0.9, 2.78, "CLK", fontsize=10.5, color=ACC)
    # 边沿位置
    edge = T/2
    tsu, th = 1.6, 0.9
    ax.axvspan(edge-tsu, edge, color=RED, alpha=0.18)
    ax.axvspan(edge, edge+th, color="#b3452f", alpha=0.30)
    ax.axvline(edge, color=INK, lw=1.4, ls="--")
    ax.text(edge-tsu/2, 2.05, "$t_{su}$", ha="center", fontsize=10.5, color=RED)
    ax.text(edge+th/2+0.15, 2.05, "$t_h$", ha="center", fontsize=10.5, color="#b3452f")
    ax.text(edge, 3.35, "clock edge", ha="center", fontsize=9.5, color=INK)
    # 三种数据到达
    for y, arrive, c, lab in [(1.35, edge-3.4, GREEN, "OK: arrives in time"),
                              (0.75, edge-0.8, RED, "setup violation (too late)"),
                              (0.15, edge+0.45, "#8a6a3a", "hold violation (too early)")]:
        ax.plot([0, arrive], [y, y], color=c, lw=2.0)
        ax.plot([arrive, arrive+0.35], [y, y+0.32], color=c, lw=2.0)
        ax.plot([arrive+0.35, 2*T], [y+0.32, y+0.32], color=c, lw=2.0)
        ax.text(2*T+0.3, y+0.1, lab, fontsize=9, color=c, va="center")
    ax.set_xlim(-1, 2*T+7.5); ax.set_ylim(-0.15, 3.7)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title("Setup and hold: the forbidden window", color=INK, fontsize=12.5)
    save(fig, "mic_timing")

# ── 图 9-1 · ADC 抖动限制 ───────────────────────────────
def adc():
    fin = np.logspace(5, 10, 300)
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    for jit, c in [(1e-12, ACC2), (1e-13, ACC), (1e-14, GREEN)]:
        snr = -20*np.log10(2*np.pi*fin*jit)
        enob = (snr - 1.76)/6.02
        ax.semilogx(fin, enob, color=c, lw=2.4,
                    label=f"$\\sigma_t$ = {jit*1e15:.0f} fs")
    ax.axhline(12, color=RED, ls="--", lw=1.2)
    ax.text(1.4e5, 12.3, "12 bits", fontsize=9.5, color=RED)
    ax.set_xlabel("input signal frequency  (Hz, log)")
    ax.set_ylabel("ENOB limited by jitter  (bits)")
    ax.set_title("Clock jitter caps ADC resolution", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10)
    ax.set_ylim(0, 22)
    save(fig, "mic_adc")

# ── 图 12-1 · 光刻分辨率演进 ────────────────────────────
def litho():
    fig, ax = plt.subplots(figsize=(7.0, 4.3))
    yrs = [1985, 1990, 1995, 2000, 2004, 2007, 2011, 2015, 2019, 2023, 2026]
    hp = [1000, 500, 350, 180, 90, 45, 32, 14, 7, 3.5, 2.2]
    ax.semilogy(yrs, hp, "o-", color=ACC, lw=2.4, ms=6)
    for x, y, lab in [(1988, 700, "g/i-line\n436/365 nm"),
                      (1997, 260, "KrF 248 nm"),
                      (2003, 120, "ArF 193 nm"),
                      (2008, 40, "193i\n(immersion)"),
                      (2013, 20, "+ multiple\npatterning"),
                      (2020, 5.4, "EUV 13.5 nm"),
                      (2026, 1.55, "High-NA")]:
        ax.annotate(lab, xy=(x, y), fontsize=8.5, color="#555", ha="center")
    ax.set_xlabel("year"); ax.set_ylabel("half-pitch resolution  (nm, log)")
    ax.set_title("Lithography: squeezing every Rayleigh factor", color=INK, fontsize=12.5)
    ax.set_ylim(1, 2000)
    save(fig, "mic_litho")

# ── 图 14-1 · 良率 vs 面积 ──────────────────────────────
def yield_area():
    A = np.linspace(10, 800, 400)
    alpha = 3.0
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    for D0, c, lab in [(0.05, GREEN, "$D_0$ = 0.05 /cm$^2$"),
                       (0.10, ACC, "$D_0$ = 0.10 /cm$^2$"),
                       (0.20, RED, "$D_0$ = 0.20 /cm$^2$")]:
        Y = (1 + A/100*D0/alpha)**(-alpha)
        ax.plot(A, Y*100, color=c, lw=2.4, label=lab)
    ax.axvline(600, color="#888", ls=":", lw=1.3)
    ax.text(610, 82, "large GPU /\nAI accelerator", fontsize=9, color="#666")
    ax.axvline(150, color="#888", ls=":", lw=1.3)
    ax.text(158, 30, "chiplet-sized die", fontsize=9, color="#666")
    ax.set_xlabel("die area  (mm$^2$)"); ax.set_ylabel("yield  (%)")
    ax.set_title("Yield falls steeply with die area", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10)
    ax.set_ylim(0, 100)
    save(fig, "mic_yield")

if __name__ == "__main__":
    diode(); mosfet_iv(); scaling(); device_evolution()
    inverter_vtc(); timing(); adc(); litho(); yield_area()
