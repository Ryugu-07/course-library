"""线五图：Hodgkin-Huxley 动作电位 / 层级预测编码。
运行：cd figs && ~/ai-course/.venv/bin/python brain.py"""
import numpy as np
import matplotlib.patches as mpatches
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

# ── 图 21-1 · Hodgkin-Huxley 数值求解 ────────────────────
def action_potential():
    # HH 参数（标准 squid axon, mV / ms / uF·cm^-2）
    C, gNa, gK, gL = 1.0, 120.0, 36.0, 0.3
    ENa, EK, EL = 50.0, -77.0, -54.387

    def alpha_m(V): return 0.1*(V+40)/(1-np.exp(-(V+40)/10))
    def beta_m(V):  return 4.0*np.exp(-(V+65)/18)
    def alpha_h(V): return 0.07*np.exp(-(V+65)/20)
    def beta_h(V):  return 1/(1+np.exp(-(V+35)/10))
    def alpha_n(V): return 0.01*(V+55)/(1-np.exp(-(V+55)/10))
    def beta_n(V):  return 0.125*np.exp(-(V+65)/80)

    dt, T = 0.01, 25.0
    t = np.arange(0, T, dt)
    V = np.full(t.size, -65.0)
    m = alpha_m(-65)/(alpha_m(-65)+beta_m(-65))
    h = alpha_h(-65)/(alpha_h(-65)+beta_h(-65))
    n = alpha_n(-65)/(alpha_n(-65)+beta_n(-65))
    ms, hs, ns = np.zeros(t.size), np.zeros(t.size), np.zeros(t.size)
    for i in range(t.size):
        ms[i], hs[i], ns[i] = m, h, n
        I = 25.0 if 2.0 <= t[i] < 3.0 else 0.0        # 阈上短脉冲刺激
        v = V[i]
        INa = gNa*m**3*h*(v-ENa); IK = gK*n**4*(v-EK); IL = gL*(v-EL)
        dv = (I - INa - IK - IL)/C
        m += dt*(alpha_m(v)*(1-m) - beta_m(v)*m)
        h += dt*(alpha_h(v)*(1-h) - beta_h(v)*h)
        n += dt*(alpha_n(v)*(1-n) - beta_n(v)*n)
        if i+1 < t.size: V[i+1] = v + dt*dv

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(6.8, 5.6), sharex=True,
                                   gridspec_kw={"height_ratios": [2, 1.2]})
    ax1.plot(t, V, color=ACC, lw=2.4)
    ax1.axhline(-65, color="#bbb", ls=":", lw=1)
    ax1.axhline(-55, color=RED, ls="--", lw=1.1)
    ax1.text(19.5, -53, "threshold", fontsize=9, color=RED)
    ax1.text(19.5, -69, "rest", fontsize=9, color="#777")
    ax1.set_ylabel("membrane potential  $V$  (mV)")
    ax1.set_title("Hodgkin-Huxley action potential", color=INK)
    ax1.annotate("Na$^+$ influx\n(positive feedback)", xy=(3.3, 20),
                 xytext=(6.2, 22), fontsize=9, color="#555",
                 arrowprops=dict(arrowstyle="->", color="#888"))
    ax1.annotate("K$^+$ efflux\n(repolarization)", xy=(5.0, -40),
                 xytext=(8.4, -30), fontsize=9, color="#555",
                 arrowprops=dict(arrowstyle="->", color="#888"))
    ax1.annotate("after-hyperpolarization", xy=(8.0, -78), xytext=(11.5, -88),
                 fontsize=9, color="#555",
                 arrowprops=dict(arrowstyle="->", color="#888"))

    ax2.plot(t, ms, color=RED, lw=1.9, label="$m$  (Na activation, fast)")
    ax2.plot(t, hs, color=GREEN, lw=1.9, label="$h$  (Na inactivation, slow)")
    ax2.plot(t, ns, color=ACC2, lw=1.9, label="$n$  (K activation, slow)")
    ax2.set_xlabel("time  (ms)")
    ax2.set_ylabel("gating variable")
    ax2.legend(frameon=False, fontsize=9, loc="upper right")
    ax2.set_ylim(-0.03, 1.05)
    fig.tight_layout()
    save(fig, "bio_action_potential")

# ── 图 23-1 · 层级预测编码 ───────────────────────────────
def predictive():
    fig, ax = plt.subplots(figsize=(6.4, 4.5))
    layers = [("Low level\nedges, phonemes", 0.4),
              ("Mid level\nparts, features", 1.85),
              ("High level\nobjects, causes, intent", 3.3)]
    w, h = 4.2, 1.0
    for name, y in layers:
        ax.add_patch(mpatches.FancyBboxPatch((0, y), w, h,
                     boxstyle="round,pad=0.02,rounding_size=0.08",
                     fc=ACC2, ec=ACC, lw=1.6, alpha=0.32))
        ax.text(w/2, y+h/2, name, ha="center", va="center", fontsize=10.5, color=INK)
    for y0, y1 in [(0.4, 1.85), (1.85, 3.3)]:
        ax.annotate("", xy=(1.25, y0+h), xytext=(1.25, y1),
                    arrowprops=dict(arrowstyle="-|>", color=ACC, lw=2))
        ax.annotate("", xy=(2.95, y1), xytext=(2.95, y0+h),
                    arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.8, ls=(0, (4, 3))))
    ax.text(0.68, 1.53, "predictions\n(top-down)", fontsize=9, color=ACC, ha="center")
    ax.text(3.55, 1.53, "prediction\nerrors (bottom-up)", fontsize=9, color=RED, ha="center")
    ax.annotate("", xy=(w/2, 0.33), xytext=(w/2, -0.05),
                arrowprops=dict(arrowstyle="-|>", color="#888", lw=1.4))
    ax.text(w/2, -0.22, "sensory input", fontsize=9.5, color="#666",
            ha="center", style="italic")
    ax.set_xlim(-0.35, 4.55); ax.set_ylim(-0.45, 4.55)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_title("Hierarchical predictive coding", color=INK, fontsize=13)
    save(fig, "bio_predictive")

if __name__ == "__main__":
    action_potential(); predictive()
