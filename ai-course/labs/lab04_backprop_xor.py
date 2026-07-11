"""
lab04 · 纯 numpy 反向传播解 XOR（配第 04 讲）★ 全课程最值得亲手写的实验

  1. 按讲义的"四个方程"逐行实现反向传播
  2. 用数值梯度检查验证推导正确(相对误差应 < 1e-7)
  3. 训练 2-2-1 网络解 XOR ——1969 年判死刑的问题, 40 行代码翻案
  4. 可视化决策面与隐藏神经元学到的"分工"

运行: .venv/bin/python labs/lab04_backprop_xor.py
"""
import numpy as np
import matplotlib.pyplot as plt

from _common import save_and_show

# ---------- XOR 数据: 4 个点, 线性不可分(第01/04讲) ----------
X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)   # 每行一个样本
Y = np.array([[0],[1],[1],[0]], dtype=float)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def sigmoid_prime(z):
    s = sigmoid(z)
    return s * (1 - s)      # 注意最大值 1/4 ——梯度消失的元凶(第04讲)

class MLP:
    """2-H-1 两层网络。为了和讲义完全对齐, 不用任何框架。"""

    def __init__(self, hidden=2, seed=0):
        rng = np.random.default_rng(seed)
        self.W1 = rng.normal(0, 1.0, (hidden, 2))   # 第1层权重 [H, 2]
        self.b1 = np.zeros((hidden, 1))
        self.W2 = rng.normal(0, 1.0, (1, hidden))   # 第2层权重 [1, H]
        self.b2 = np.zeros((1, 1))

    def forward(self, X):
        """前向: 缓存所有 z, a 供反向使用(讲义算法第1步)"""
        self.a0 = X.T                                # [2, N] 每列一个样本
        self.z1 = self.W1 @ self.a0 + self.b1        # [H, N]
        self.a1 = sigmoid(self.z1)
        self.z2 = self.W2 @ self.a1 + self.b2        # [1, N]
        self.a2 = sigmoid(self.z2)
        return self.a2

    def backward(self, Y):
        """反向: 四个方程的直译。对照第04讲 3.2 节逐行看。"""
        N = Y.shape[0]
        # 方程一: δ^L = ∇_a ℓ ⊙ σ'(z^L)   (平方损失: ∇_a ℓ = a - y)
        delta2 = (self.a2 - Y.T) * sigmoid_prime(self.z2)          # [1, N]
        # 方程二: δ^l = (W^{l+1}ᵀ δ^{l+1}) ⊙ σ'(z^l)
        delta1 = (self.W2.T @ delta2) * sigmoid_prime(self.z1)     # [H, N]
        # 方程三/四: ∂ℓ/∂W = δ aᵀ,  ∂ℓ/∂b = δ  (对 batch 取平均)
        gW2 = delta2 @ self.a1.T / N
        gb2 = delta2.mean(axis=1, keepdims=True)
        gW1 = delta1 @ self.a0.T / N
        gb1 = delta1.mean(axis=1, keepdims=True)
        return gW1, gb1, gW2, gb2

    def loss(self, X, Y):
        return float(np.mean((self.forward(X) - Y.T) ** 2) / 2)

    def params(self):
        return [self.W1, self.b1, self.W2, self.b2]

# ---------- 1. 数值梯度检查: 你的推导对不对, 让中心差分说话 ----------
# 原理: ∂L/∂θ ≈ [L(θ+ε) - L(θ-ε)] / 2ε  (与解析梯度比相对误差)
# 这是排查一切手写梯度的金标准, 也是第13讲"数值验证"思想的第一次实战。
print("== 1. 梯度检查 ==")
net = MLP(hidden=2, seed=0)
net.forward(X)                   # 先前向(缓存 z, a), 再反向求解析梯度
grads = net.backward(Y)

eps = 1e-5
worst = 0.0
for p, g in zip(net.params(), grads):
    num_g = np.zeros_like(p)
    for i in np.ndindex(p.shape):
        old = p[i]
        p[i] = old + eps; L_plus = net.loss(X, Y)
        p[i] = old - eps; L_minus = net.loss(X, Y)
        p[i] = old
        num_g[i] = (L_plus - L_minus) / (2 * eps)
    rel = np.abs(num_g - g).max() / (np.abs(num_g).max() + np.abs(g).max() + 1e-12)
    worst = max(worst, rel)
print(f"  最大相对误差 = {worst:.2e}  {'✅ 推导正确!' if worst < 1e-7 else '❌ 有 bug, 检查四个方程'}")

# ---------- 2. 训练解 XOR ----------
print("\n== 2. 训练 2-2-1 网络解 XOR ==")
net = MLP(hidden=2, seed=3)
lr, losses = 2.0, []
for step in range(8000):
    net.forward(X)
    grads = net.backward(Y)
    for p, g in zip(net.params(), grads):
        p -= lr * g                      # 最朴素的梯度下降
    losses.append(net.loss(X, Y))
    if step % 2000 == 0:
        print(f"  step {step:5d}  loss={losses[-1]:.5f}")

pred = net.forward(X)
print("  最终预测:")
for xi, yi, pi in zip(X, Y.ravel(), pred.ravel()):
    print(f"    {xi} → {pi:.3f} (目标 {yi:.0f}) {'✓' if round(pi)==yi else '✗'}")

# ---------- 3. 可视化 ----------
fig, axes = plt.subplots(1, 3, figsize=(15, 4.2))
axes[0].plot(losses); axes[0].set_yscale("log")
axes[0].set_title("训练损失"); axes[0].set_xlabel("step")

x1, x2 = np.meshgrid(np.linspace(-0.5, 1.5, 200), np.linspace(-0.5, 1.5, 200))
grid = np.c_[x1.ravel(), x2.ravel()]
Z = net.forward(grid).reshape(x1.shape)
cs = axes[1].contourf(x1, x2, Z, levels=20, cmap="coolwarm")
axes[1].scatter(X[:,0], X[:,1], c=Y.ravel(), cmap="coolwarm", s=120, edgecolors="k")
axes[1].set_title("网络输出: 非线性决策面解开 XOR")
fig.colorbar(cs, ax=axes[1])

# 隐藏层两个神经元各自的输出——看它们怎么"分工"(通常一个学 OR 一个学 AND)
h = sigmoid(net.W1 @ grid.T + net.b1)
for k in range(2):
    axes[2].contour(x1, x2, h[k].reshape(x1.shape), levels=[0.5],
                    colors=["g", "m"][k], linewidths=2)
axes[2].scatter(X[:,0], X[:,1], c=Y.ravel(), cmap="coolwarm", s=120, edgecolors="k")
axes[2].set_title("两个隐藏神经元的 0.5 等值线(各自是一条直线!)")
save_and_show(fig, "lab04_xor.png")

print("""
  右图是精髓: 每个隐藏神经元仍然只会画直线(它就是个感知机),
  但两条直线的输出再组合一次, 就围出了 XOR 需要的区域。
  深度 = 复合 = 用简单件搭复杂物(第04讲第2节)。

== 动手改改 ==
1. hidden=1 训练会怎样? (一条直线注定失败——亲眼确认)
2. 把 sigmoid 换成 ReLU(注意 relu_prime), 收敛更快吗?
3. 把 seed 换几个值: 有时会卡在 loss=0.125 附近——那是局部极小值,
   四个点错一个。非凸优化的现实, 眼见为实。
""")
