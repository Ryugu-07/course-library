"""
lab07 · 亲手复现 Scaling Law（配第 07 讲）

思路: 用 lab06 的 mini GPT, 只改一个变量——模型宽度 d(参数量 N 随之变化),
其余(数据、步数、超参)固定, 记录每个规模的验证损失, 画到 log-log 坐标上。
如果第 07 讲说的是真的, 你会看到一条近似直线: L ≈ a·N^(-α)。

总运行时间约 5-10 分钟(4 个模型)。

运行: .venv/bin/python labs/lab07_scaling_law.py
"""
import numpy as np
import matplotlib.pyplot as plt

from _common import save_and_show
from lab06_attention_transformer import train_minigpt

# 模型家族: 宽度翻倍, 层数固定 —— 参数量大约按 d² 增长
CONFIGS = [dict(d=16), dict(d=32), dict(d=64), dict(d=128)]
STEPS = 1200          # 固定训练步数(即固定数据量)

results = []
for cfg in CONFIGS:
    print(f"\n== 训练 d={cfg['d']} ==")
    n_params, val_loss, _ = train_minigpt(d=cfg["d"], n_layer=2, steps=STEPS, log=False)
    print(f"  参数 {n_params:>10,d}  验证损失 {val_loss:.4f}")
    results.append((n_params, val_loss))

N = np.array([r[0] for r in results], dtype=float)
L = np.array([r[1] for r in results])

# ---------- log-log 线性拟合: log L = log a - α log N ----------
# (严格说应拟合 L - E 的幂律, E 是不可约熵; 小规模下直接拟合 L 已能看出趋势)
coef = np.polyfit(np.log(N), np.log(L), 1)
alpha = -coef[0]
print(f"\n拟合结果: L ≈ {np.exp(coef[1]):.2f} · N^(-{alpha:.3f})")
print(f"你的幂律指数 α ≈ {alpha:.3f} (Kaplan 2020 在大模型上测得 α_N ≈ 0.076;")
print("量级不同很正常——指数依赖数据与设置, 关键是【直线】这个形状本身)")

fig, ax = plt.subplots(figsize=(7, 5))
ax.loglog(N, L, "o", ms=9, label="实测(4 个模型)")
Ns = np.linspace(N.min() * 0.8, N.max() * 1.2, 100)
ax.loglog(Ns, np.exp(coef[1]) * Ns ** coef[0], "r--",
          label=f"幂律拟合  L ∝ N^(-{alpha:.3f})")
ax.set_xlabel("参数量 N (log)")
ax.set_ylabel("验证损失 L (log)")
ax.set_title("你的 Scaling Law: log-log 坐标下近似一条直线")
ax.legend()
ax.grid(True, which="both", alpha=0.3)
save_and_show(fig, "lab07_scaling_law.png")

print("""
体会一下这张图的含义: OpenAI 就是靠(大得多的)这条直线,
在训练 GPT-3 之前预测了它的损失, 然后才敢砸下数百万美元。
"先用小实验定标度律, 再外推大投入"——这是大模型时代的工作方式。

== 动手改改 ==
1. 把 STEPS 翻倍(数据更多): 整条线下移吗? 大模型受益更多还是小模型?
2. 加一个 d=256 的点: 直线还延续吗? 还是开始弯了(数据不够喂, 撞到
   Chinchilla 说的"欠喂"区)?
3. 反过来固定 d=64, 扫 STEPS=[300,600,1200,2400]: 画 L(D) 的幂律。
""")
