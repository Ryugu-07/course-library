"""
lab01 · 机器学习就是找函数（配第 01 讲）

亲手制造欠拟合与过拟合：
  1. 生成带噪声的数据（真实函数 = sin）
  2. 用不同次数的多项式去"找函数"
  3. 画出训练误差 vs 测试误差随复杂度变化的 U 形曲线
  4. 看正则化（岭回归）如何拯救高次多项式

运行: .venv/bin/python labs/lab01_find_function.py
"""
import numpy as np
import matplotlib.pyplot as plt

from _common import save_and_show

# ---------- 1. 造数据: y = sin(2πx) + 噪声 ----------
# "真实函数"我们知道(sin), 但模型不知道——它只能看到 30 个带噪声的点。
# 这模拟了第01讲的设定: 数据来自未知分布 D。
def true_f(x):
    return np.sin(2 * np.pi * x)

n_train, n_test = 30, 200
x_train = np.sort(np.random.rand(n_train))
y_train = true_f(x_train) + np.random.randn(n_train) * 0.25   # σ=0.25 的噪声
x_test = np.linspace(0, 1, n_test)
y_test = true_f(x_test) + np.random.randn(n_test) * 0.25      # 测试集同样有噪声

# ---------- 2. 假设空间: k 次多项式 ----------
# 找函数三要素在这里的对应:
#   假设空间 H = { k次多项式 }  (k 是复杂度旋钮)
#   损失     = 平方损失
#   优化     = 最小二乘(有解析解, np.polyfit 内部就是解正规方程)
def fit_poly(x, y, degree, lam=0.0):
    """多项式最小二乘, lam>0 时是岭回归 (X^T X + λI)^{-1} X^T y"""
    X = np.vander(x, degree + 1)            # 范德蒙矩阵: [x^k, ..., x, 1]
    A = X.T @ X + lam * np.eye(degree + 1)
    w = np.linalg.solve(A, X.T @ y)
    return w

def predict(w, x):
    return np.vander(x, len(w)) @ w

def mse(y_hat, y):
    return float(np.mean((y_hat - y) ** 2))

# ---------- 3. 三种复杂度的直观对比 ----------
fig, axes = plt.subplots(1, 3, figsize=(14, 4))
for ax, k in zip(axes, [1, 4, 15]):
    w = fit_poly(x_train, y_train, k)
    xs = np.linspace(0, 1, 300)
    ax.scatter(x_train, y_train, s=18, label="训练数据")
    ax.plot(xs, true_f(xs), "g--", lw=1.5, label="真实函数 sin")
    ax.plot(xs, predict(w, xs), "r-", lw=2, label=f"{k} 次多项式")
    ax.set_ylim(-1.8, 1.8)
    tag = {1: "欠拟合(偏差大)", 4: "刚刚好", 15: "过拟合(方差大)"}[k]
    ax.set_title(f"k={k}: {tag}")
    ax.legend(fontsize=8)
save_and_show(fig, "lab01_fit_compare.png")

# ---------- 4. U 形曲线: 误差 vs 复杂度 ----------
degrees = range(1, 16)
tr_err, te_err = [], []
for k in degrees:
    w = fit_poly(x_train, y_train, k)
    tr_err.append(mse(predict(w, x_train), y_train))
    te_err.append(mse(predict(w, x_test), y_test))
    print(f"k={k:2d}  训练MSE={tr_err[-1]:.4f}  测试MSE={te_err[-1]:.4f}")

fig, ax = plt.subplots(figsize=(7, 4.5))
ax.plot(degrees, tr_err, "o-", label="训练误差(只会单调下降)")
ax.plot(degrees, te_err, "s-", label="测试误差(U形!)")
ax.axhline(0.25**2, color="gray", ls=":", label="噪声下限 σ²=0.0625")
ax.set_xlabel("多项式次数(模型复杂度)")
ax.set_ylabel("MSE")
ax.set_yscale("log")
ax.set_title("第01讲的核心图像: 偏差-方差权衡")
ax.legend()
save_and_show(fig, "lab01_u_curve.png")

# 注意: 测试误差永远压不破 σ²=0.0625 这条线——那是贝叶斯误差(不可约噪声)。

# ---------- 5. 正则化救场: 15 次多项式 + 岭回归 ----------
fig, ax = plt.subplots(figsize=(7, 4.5))
xs = np.linspace(0, 1, 300)
ax.scatter(x_train, y_train, s=18, color="k", label="训练数据")
ax.plot(xs, true_f(xs), "g--", lw=1.5, label="真实函数")
for lam, style in [(0.0, "r-"), (1e-4, "b-"), (1.0, "m-")]:
    w = fit_poly(x_train, y_train, 15, lam=lam)
    te = mse(predict(w, x_test), y_test)
    ax.plot(xs, predict(w, xs), style, lw=1.8, label=f"λ={lam:g}  测试MSE={te:.3f}")
    print(f"λ={lam:<8g} 测试MSE={te:.4f}  权重范数‖w‖={np.linalg.norm(w):.1f}")
ax.set_ylim(-1.8, 1.8)
ax.set_title("同样是15次多项式: λ 是偏差-方差滑块")
ax.legend(fontsize=9)
save_and_show(fig, "lab01_ridge.png")

print("""
== 动手改改 ==
1. 把 n_train 从 30 改成 300: U 形曲线右移了吗?(数据多 → 撑得起更复杂的模型)
2. 把噪声 0.25 改成 0: 过拟合还存在吗? 为什么?
3. λ=1.0 时权重范数很小但测试误差反而变差——这是欠拟合还是过拟合?
""")
