"""自动化八图：开环vs闭环 / 阶跃阻尼 / 根轨迹 / Bode裕度 / LQR / Kalman / 混叠 / Buck / 相平面 / MPC。
运行：cd figs && ~/ai-course/.venv/bin/python auto.py"""
import numpy as np
from _common import plt, save, ACC, ACC2, INK, RED, GREEN

rng = np.random.default_rng(5)

# ── 图 1-1 · 开环 vs 闭环抗扰 ───────────────────────────
def openloop_vs_closed():
    t = np.linspace(0, 30, 1500)
    dist_t = 5.0
    def resp(G, tau_d, zeta, wn):
        y = np.zeros_like(t)
        m = t >= dist_t
        td = t[m] - dist_t
        steady = 1.0/(1.0+G)
        env = np.exp(-zeta*wn*td)
        osc = np.cos(wn*np.sqrt(max(1e-9, 1-zeta**2))*td)
        y[m] = steady + (1.0-steady)*env*osc
        return y
    fig, ax = plt.subplots(figsize=(7.0, 4.3))
    ax.axhline(0, color="#999", ls=":", lw=1.1)
    ax.plot(t, np.where(t >= dist_t, 1.0, 0.0), color="#999", lw=2.0,
            label="open loop (no correction)")
    ax.plot(t, resp(1.5, 0, 0.95, 0.55), color=GREEN, lw=2.0, label="low gain")
    ax.plot(t, resp(9.0, 0, 0.75, 0.95), color=ACC, lw=2.4, label="moderate gain")
    ax.plot(t, resp(30.0, 1, 0.10, 1.7), color=RED, lw=1.9, label="high gain + delay")
    ax.axvline(dist_t, color="#bbb", ls="--", lw=1.1)
    ax.text(dist_t+0.25, 1.05, "disturbance", fontsize=9.5, color="#666")
    ax.text(26.5, 0.045, "setpoint", fontsize=9.5, color="#666")
    ax.set_xlabel("time"); ax.set_ylabel("output deviation from setpoint")
    ax.set_title("What feedback buys, and what it costs", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper right")
    ax.set_ylim(-0.55, 1.35)
    save(fig, "aut_openloop_vs_closed")

# ── 图 3-1 · 二阶阶跃响应随阻尼比 ───────────────────────
def step_damping():
    t = np.linspace(0, 14, 900)
    wn = 1.0
    fig, ax = plt.subplots(figsize=(6.8, 4.3))
    for z, c, lab in [(0.2, RED, r"$\zeta=0.2$"), (0.4, "#c07a3a", r"$\zeta=0.4$"),
                      (0.7, ACC, r"$\zeta=0.7$"), (1.0, GREEN, r"$\zeta=1.0$"),
                      (2.0, ACC2, r"$\zeta=2.0$")]:
        if z < 1:
            wd = wn*np.sqrt(1-z**2)
            y = 1 - np.exp(-z*wn*t)*(np.cos(wd*t) + z/np.sqrt(1-z**2)*np.sin(wd*t))
        elif z == 1:
            y = 1 - np.exp(-wn*t)*(1+wn*t)
        else:
            r1 = -wn*(z - np.sqrt(z**2-1)); r2 = -wn*(z + np.sqrt(z**2-1))
            y = 1 + (r2*np.exp(r1*t) - r1*np.exp(r2*t))/(r1-r2)
        ax.plot(t, y, color=c, lw=2.2, label=lab)
    ax.axhline(1, color="#999", ls=":", lw=1.1)
    ax.annotate("overshoot", xy=(3.1, 1.52), xytext=(5.4, 1.62),
                fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel("time  ($\\omega_n t$)"); ax.set_ylabel("output")
    ax.set_title("Second-order step response vs damping", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=10, loc="lower right")
    ax.set_ylim(0, 1.75)
    save(fig, "aut_step_damping")

# ── 图 4-1 · 根轨迹 ─────────────────────────────────────
def rootlocus():
    # L(s) = K / (s(s+1)(s+5))
    poles = np.array([0, -1, -5])
    Ks = np.concatenate([np.linspace(0, 30, 900), np.linspace(30, 90, 400)])
    roots = np.array([np.roots([1, 6, 5, K]) for K in Ks])
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    for i in range(3):
        pts = roots[:, i]
        ax.plot(pts.real, pts.imag, ".", ms=1.6, color=ACC, alpha=0.75)
    ax.plot(poles, np.zeros_like(poles), "x", color=RED, ms=11, mew=2.4,
            label="open-loop poles")
    # 临界点：K=30 → 交虚轴 ±j√5
    ax.plot([0, 0], [np.sqrt(5), -np.sqrt(5)], "o", color=GREEN, ms=8,
            label=r"crossing at $K=30$")
    ax.axvline(0, color="#aaa", lw=1.0)
    ax.axhline(0, color="#aaa", lw=1.0)
    ax.axvspan(0, 3, color=RED, alpha=0.07)
    ax.text(0.35, 2.75, "unstable\n(right half-plane)", fontsize=9.5, color=RED)
    ax.set_xlabel("Re"); ax.set_ylabel("Im")
    ax.set_title(r"Root locus of $L(s)=\dfrac{K}{s(s+1)(s+5)}$", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    ax.set_xlim(-6.5, 3); ax.set_ylim(-4, 4)
    save(fig, "aut_rootlocus")

# ── 图 5-1 · Bode 图与裕度 ──────────────────────────────
def bode_margins():
    w = np.logspace(-2, 2, 1200)
    # L(s) = 10 / (s(s/2+1)(s/10+1))
    L = 10/(1j*w*(1j*w/2+1)*(1j*w/10+1))
    mag = 20*np.log10(np.abs(L)); ph = np.angle(L, deg=True)
    ph = np.unwrap(np.angle(L))*180/np.pi
    fig, (a1, a2) = plt.subplots(2, 1, figsize=(6.8, 5.4), sharex=True)
    a1.semilogx(w, mag, color=ACC, lw=2.4)
    a1.axhline(0, color="#999", ls=":", lw=1.1)
    idx_c = np.argmin(np.abs(mag))
    wc = w[idx_c]
    a1.axvline(wc, color=GREEN, ls="--", lw=1.3)
    a1.text(wc*1.1, 22, r"$\omega_c$", fontsize=11, color=GREEN)
    a1.set_ylabel("magnitude  (dB)")
    a1.set_title("Open-loop Bode plot and stability margins", color=INK, fontsize=12.5)
    # 相位裕度
    a2.semilogx(w, ph, color=ACC, lw=2.4)
    a2.axhline(-180, color=RED, ls=":", lw=1.2)
    a2.axvline(wc, color=GREEN, ls="--", lw=1.3)
    pm = ph[idx_c] + 180
    a2.annotate("", xy=(wc, ph[idx_c]), xytext=(wc, -180),
                arrowprops=dict(arrowstyle="<->", color=GREEN, lw=1.8))
    a2.text(wc*1.15, (ph[idx_c]-180)/2, f"PM ≈ {pm:.0f}°", fontsize=10.5, color=GREEN)
    # 增益裕度：相位过 -180 处
    idx_g = np.argmin(np.abs(ph + 180))
    wg = w[idx_g]
    a1.axvline(wg, color=RED, ls="--", lw=1.2)
    a1.annotate("", xy=(wg, 0), xytext=(wg, mag[idx_g]),
                arrowprops=dict(arrowstyle="<->", color=RED, lw=1.8))
    a1.text(wg*1.12, mag[idx_g]/2, f"GM ≈ {-mag[idx_g]:.0f} dB", fontsize=10.5, color=RED)
    a2.set_ylabel("phase  (deg)"); a2.set_xlabel(r"frequency  $\omega$  (rad/s, log)")
    a2.set_ylim(-280, -60)
    fig.tight_layout()
    save(fig, "aut_bode_margins")

# ── 图 8-1 · LQR 权衡 ───────────────────────────────────
def lqr():
    # 双积分器（质量块位置控制）: xdot = Ax + Bu —— R 的影响在此清晰可见
    A = np.array([[0, 1], [0, 0]]); B = np.array([[0], [1.0]])
    Q = np.eye(2)
    def dlqr_gain(R):
        # 连续 Riccati 迭代求解
        P = np.eye(2)
        for _ in range(20000):
            dP = A.T@P + P@A - P@B@np.linalg.inv(np.array([[R]]))@B.T@P + Q
            P = P + 1e-4*dP
        return (np.linalg.inv(np.array([[R]]))@B.T@P), P
    t = np.linspace(0, 5, 800); dt = t[1]-t[0]
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.6, 4.1))
    costs = []
    for R, c, lab in [(0.05, ACC, "$R=0.05$ (aggressive)"),
                      (1.0, "#b06a8a", "$R=1$"),
                      (20.0, GREEN, "$R=20$ (gentle)")]:
        K, _ = dlqr_gain(R)
        x = np.array([0.4, 0.0]); xs, us = [], []
        for _ in t:
            u = float((-K@x).item()); xs.append(x[0]); us.append(u)
            x = x + dt*(A@x + B.flatten()*u)
        a1.plot(t, xs, color=c, lw=2.3, label=lab)
        a2.plot(t, us, color=c, lw=2.0)
        costs.append((np.sum(np.array(xs)**2)*dt, np.sum(np.array(us)**2)*dt))
    a1.axhline(0, color="#999", ls=":", lw=1.0)
    a1.set_xlabel("time (s)"); a1.set_ylabel("angle  (rad)")
    a1.set_title("State response", color=INK, fontsize=12)
    a1.legend(frameon=False, fontsize=9)
    a2.set_xlabel("time (s)"); a2.set_ylabel("control effort  $u$")
    a2.set_title("Control signal", color=INK, fontsize=12)
    a2.axhline(0, color="#999", ls=":", lw=1.0)
    fig.tight_layout()
    save(fig, "aut_lqr")

# ── 图 9-1 · 卡尔曼滤波跟踪 ─────────────────────────────
def kalman():
    n = 220; dt = 0.1
    A = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0]])
    Q = np.array([[1e-3, 0], [0, 1e-2]]); R = np.array([[0.9]])
    x = np.array([0.0, 1.0]); xs, zs = [], []
    for k in range(n):
        x = A@x + np.array([0, 0.35*np.sin(k*dt*0.9)])*dt
        xs.append(x[0]); zs.append(x[0] + rng.normal(0, np.sqrt(R[0, 0])))
    xs = np.array(xs); zs = np.array(zs)
    xh = np.array([0.0, 0.0]); P = np.eye(2)*4.0
    est, sig = [], []
    for k in range(n):
        xh = A@xh; P = A@P@A.T + Q
        K = P@H.T@np.linalg.inv(H@P@H.T + R)
        xh = xh + (K@(np.array([zs[k]]) - H@xh)).flatten()
        P = (np.eye(2) - K@H)@P
        est.append(xh[0]); sig.append(np.sqrt(P[0, 0]))
    est = np.array(est); sig = np.array(sig)
    t = np.arange(n)*dt
    fig, ax = plt.subplots(figsize=(7.0, 4.3))
    ax.plot(t, zs, ".", ms=3.2, color="#aaa", label="noisy measurements")
    ax.plot(t, xs, "--", color=INK, lw=1.8, label="true state")
    ax.plot(t, est, color=ACC, lw=2.4, label="Kalman estimate")
    ax.fill_between(t, est-2*sig, est+2*sig, color=ACC2, alpha=0.30,
                    label=r"$\pm2\sigma$ uncertainty")
    ax.set_xlabel("time (s)"); ax.set_ylabel("position")
    ax.set_title("Kalman filter: fusing model and measurement", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper left")
    save(fig, "aut_kalman")

# ── 图 10-1 · 混叠 ──────────────────────────────────────
def aliasing():
    t = np.linspace(0, 1, 2000)
    f_hi, fs = 9.0, 10.0
    ts = np.arange(0, 1, 1/fs)
    f_alias = abs(f_hi - fs)
    fig, ax = plt.subplots(figsize=(7.0, 4.0))
    ax.plot(t, np.sin(2*np.pi*f_hi*t), color="#bbb", lw=1.6,
            label=f"true signal  {f_hi:.0f} Hz")
    ax.plot(t, np.sin(2*np.pi*f_alias*t + np.pi), "--", color=RED, lw=2.0,
            label=f"aliased  {f_alias:.0f} Hz")
    ax.plot(ts, np.sin(2*np.pi*f_hi*ts), "o", color=ACC, ms=8, zorder=5,
            label=f"samples  ($f_s$={fs:.0f} Hz)")
    ax.set_xlabel("time (s)"); ax.set_ylabel("amplitude")
    ax.set_title("Aliasing: high frequency masquerading as low", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="upper right")
    ax.set_ylim(-1.65, 1.65)
    save(fig, "aut_aliasing")

# ── 图 11-1 · Buck 变换器波形 ───────────────────────────
def buck():
    fsw, D = 20.0, 0.4
    t = np.linspace(0, 3/fsw, 3000)
    sw = (np.mod(t*fsw, 1) < D).astype(float)
    # 电感电流三角波
    iL = np.zeros_like(t); i = 1.0
    dt = t[1]-t[0]
    for k in range(len(t)):
        iL[k] = i
        i += dt*((12*sw[k]-4.8)/2e-3)*1e-3
    vo = 4.8 + 0.06*np.sin(2*np.pi*fsw*t - np.pi/2)
    fig, axes = plt.subplots(3, 1, figsize=(6.9, 5.4), sharex=True)
    axes[0].plot(t*1e3, sw*12, color=ACC, lw=1.9)
    axes[0].set_ylabel("switch\n(V)"); axes[0].set_ylim(-1, 14)
    axes[0].set_title(f"Buck converter waveforms  ($D$={D}, $V_{{out}}=D\\,V_{{in}}$)",
                      color=INK, fontsize=12)
    axes[1].plot(t*1e3, iL, color=RED, lw=2.0)
    axes[1].set_ylabel("inductor\ncurrent (A)")
    axes[2].plot(t*1e3, vo, color=GREEN, lw=2.0)
    axes[2].axhline(4.8, color="#999", ls=":", lw=1.1)
    axes[2].set_ylabel("output\nvoltage (V)"); axes[2].set_xlabel("time (ms)")
    axes[2].set_ylim(4.6, 5.0)
    fig.tight_layout()
    save(fig, "aut_buck")

# ── 图 15-1 · 单摆相平面 ────────────────────────────────
def phase_portrait():
    th = np.linspace(-2*np.pi, 2*np.pi, 700)
    om = np.linspace(-3.5, 3.5, 700)
    TH, OM = np.meshgrid(th, om)
    E = 0.5*OM**2 - np.cos(TH)          # 能量
    fig, ax = plt.subplots(figsize=(7.0, 4.4))
    ax.contour(TH, OM, E, levels=np.linspace(-1, 3.0, 16),
               colors=[ACC2], linewidths=0.9)
    ax.contour(TH, OM, E, levels=[1.0], colors=[RED], linewidths=2.2)
    for c in [-2*np.pi, 0, 2*np.pi]:
        ax.plot([c], [0], "o", color=GREEN, ms=9, zorder=5)
    for c in [-np.pi, np.pi]:
        ax.plot([c], [0], "x", color=RED, ms=11, mew=2.4, zorder=5)
    ax.text(0.15, 0.28, "stable\n(center)", fontsize=9.5, color=GREEN)
    ax.text(np.pi+0.15, 0.28, "saddle\n(inverted)", fontsize=9.5, color=RED)
    ax.text(-2.0, 2.55, "separatrix", fontsize=9.5, color=RED)
    ax.set_xlabel(r"angle  $\theta$"); ax.set_ylabel(r"angular velocity  $\dot\theta$")
    ax.set_title("Pendulum phase portrait", color=INK, fontsize=12.5)
    ax.set_xlim(-2*np.pi, 2*np.pi); ax.set_ylim(-3.5, 3.5)
    save(fig, "aut_phase_portrait")

# ── 图 17-1 · MPC 滚动时域 ──────────────────────────────
def mpc():
    fig, ax = plt.subplots(figsize=(7.2, 4.4))
    N = 12
    t_past = np.arange(-8, 1)
    y_past = 1.0 - 0.75*np.exp(-0.28*(t_past+8))
    ax.plot(t_past, y_past, "o-", color=ACC, lw=2.2, ms=4, label="past output")
    ymax = 1.06
    ax.axhspan(ymax, 1.35, color=RED, alpha=0.13)
    ax.text(6.5, 1.16, "output constraint", fontsize=9.5, color=RED)
    ax.axhline(1.0, color="#999", ls=":", lw=1.2)
    ax.text(-7.6, 1.015, "setpoint", fontsize=9, color="#666")
    # 三次滚动的预测
    for shift, alpha, c in [(0, 0.30, ACC2), (2, 0.55, ACC2), (4, 1.0, RED)]:
        tf = np.arange(shift, shift+N)
        pred = 1.0 - 0.30*np.exp(-0.45*(tf-shift)) + 0.0
        pred = np.minimum(pred, ymax-0.005)
        ax.plot(tf, pred, "--", color=c, lw=1.9, alpha=alpha,
                label="predicted trajectory" if shift == 4 else None)
        ax.plot([shift], [pred[0]], "o", color=c, ms=8, alpha=alpha, zorder=5)
    ax.axvline(0, color="#bbb", ls="--", lw=1.2)
    ax.text(0.2, 0.55, "now", fontsize=9.5, color="#666")
    ax.annotate("only the first move\nis applied", xy=(4, 0.70),
                xytext=(6.2, 0.52), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED))
    ax.set_xlabel("time step"); ax.set_ylabel("output")
    ax.set_title("MPC: receding horizon optimization", color=INK, fontsize=12.5)
    ax.legend(frameon=False, fontsize=9.5, loc="lower right")
    ax.set_ylim(0.15, 1.35)
    save(fig, "aut_mpc")

if __name__ == "__main__":
    openloop_vs_closed(); step_damping(); rootlocus(); bode_margins()
    lqr(); kalman(); aliasing(); buck(); phase_portrait(); mpc()
