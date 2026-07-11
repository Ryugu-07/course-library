"""
lab02 · 感知机与支持向量机（配第 02 讲）

  1. 从零实现感知机, 看"犯错就修正"如何收敛
  2. sklearn SVM: 线性核 vs RBF 核的决策边界, 圈出支持向量
  3. 调 C: 亲眼看软间隔的偏差-方差滑块

运行: .venv/bin/python labs/lab02_perceptron_svm.py
"""
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs, make_moons
from sklearn.svm import SVC

from _common import save_and_show

# ---------- 1. 感知机从零实现 ----------
X, y = make_blobs(n_samples=60, centers=2, cluster_std=1.0, random_state=6)
y = np.where(y == 0, -1, 1)   # 标签用 ±1(第02讲的约定)

def perceptron(X, y, max_epochs=100):
    """返回 (w, b, 更新次数)。完全照抄第02讲的三行算法。"""
    w = np.zeros(X.shape[1]); b = 0.0; updates = 0
    for epoch in range(max_epochs):
        errors = 0
        for xi, yi in zip(X, y):
            if yi * (w @ xi + b) <= 0:        # 分错(或压线)
                w += yi * xi                   # 往正确方向掰
                b += yi
                updates += 1; errors += 1
        if errors == 0:                        # 一整轮没错 → 收敛
            print(f"  感知机收敛: {epoch+1} 轮, 共更新 {updates} 次")
            return w, b, updates
    print("  ⚠️ 未收敛(数据可能线性不可分)")
    return w, b, updates

print("== 1. 感知机 ==")
w, b, _ = perceptron(X, y)

# Novikoff 上界 R²/γ² 验证: 用最终解近似 γ
gamma = np.min(y * (X @ w + b)) / np.linalg.norm(w)
R = np.max(np.linalg.norm(X, axis=1))
print(f"  间隔 γ≈{gamma:.3f}, R={R:.2f}, Novikoff 上界 R²/γ² ≈ {R**2/gamma**2:.0f} 次更新")

def plot_boundary(ax, clf_predict, X, y, title):
    """通用决策边界绘制: 对平面网格逐点预测, 上色。"""
    x1, x2 = np.meshgrid(np.linspace(X[:,0].min()-1, X[:,0].max()+1, 300),
                         np.linspace(X[:,1].min()-1, X[:,1].max()+1, 300))
    Z = clf_predict(np.c_[x1.ravel(), x2.ravel()]).reshape(x1.shape)
    ax.contourf(x1, x2, Z, alpha=0.25, levels=[-2,0,2], colors=["#4a7dbd","#d9903f"])
    ax.scatter(X[:,0], X[:,1], c=y, cmap="coolwarm", s=25, edgecolors="k", lw=0.4)
    ax.set_title(title, fontsize=10)

fig, ax = plt.subplots(figsize=(5.5, 4.5))
plot_boundary(ax, lambda P: np.sign(P @ w + b), X, y, "感知机找到的分界线(碰巧的一条, 不是最优)")
save_and_show(fig, "lab02_perceptron.png")

# ---------- 2. SVM: 最大间隔 + 支持向量 ----------
print("\n== 2. 线性 SVM: 同样数据, '最好'的那条线 ==")
svm_lin = SVC(kernel="linear", C=1e3).fit(X, y)   # C 很大 ≈ 硬间隔
print(f"  支持向量个数: {len(svm_lin.support_vectors_)} / {len(X)} 个样本")

fig, ax = plt.subplots(figsize=(5.5, 4.5))
plot_boundary(ax, svm_lin.predict, X, y, "SVM: 决策边界只由圈出的支持向量决定")
# 画间隔带: decision_function = ±1 的等高线
x1, x2 = np.meshgrid(np.linspace(X[:,0].min()-1, X[:,0].max()+1, 300),
                     np.linspace(X[:,1].min()-1, X[:,1].max()+1, 300))
Z = svm_lin.decision_function(np.c_[x1.ravel(), x2.ravel()]).reshape(x1.shape)
ax.contour(x1, x2, Z, levels=[-1, 0, 1], colors="k", linestyles=["--","-","--"], linewidths=1)
ax.scatter(*svm_lin.support_vectors_.T, s=140, facecolors="none", edgecolors="g", lw=1.8)
save_and_show(fig, "lab02_svm_margin.png")

# ---------- 3. 核技巧: 线性核搞不定月牙形 ----------
print("\n== 3. RBF 核 vs 线性核(月牙数据, 线性不可分) ==")
Xm, ym = make_moons(n_samples=200, noise=0.2, random_state=0)
fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
for ax, kernel in zip(axes, ["linear", "rbf"]):
    clf = SVC(kernel=kernel, C=1.0).fit(Xm, ym)
    acc = clf.score(Xm, ym)
    plot_boundary(ax, clf.predict, Xm, ym, f"{kernel} 核  训练准确率={acc:.2f}")
save_and_show(fig, "lab02_kernel.png")
# RBF 核在原空间画出弯曲边界——它其实是无穷维空间里的一张"超平面"(第02讲4.2节)

# ---------- 4. C 的偏差-方差滑块 ----------
print("\n== 4. 软间隔参数 C ==")
fig, axes = plt.subplots(1, 3, figsize=(15, 4.2))
for ax, C in zip(axes, [0.01, 1, 1000]):
    clf = SVC(kernel="rbf", C=C, gamma=2).fit(Xm, ym)
    nsv = len(clf.support_vectors_)
    plot_boundary(ax, clf.predict, Xm, ym, f"C={C:g}  支持向量={nsv}个")
    print(f"  C={C:<6g} 支持向量 {nsv:3d} 个  训练准确率={clf.score(Xm, ym):.3f}")
save_and_show(fig, "lab02_C_slider.png")

print("""
== 动手改改 ==
1. 把 make_blobs 的 cluster_std 调到 2.5(两类重叠): 感知机还收敛吗?
2. C=1000 的边界为什么弯弯绕绕? 它在迁就哪些点? 这是欠拟合还是过拟合?
3. 试试 gamma=50: RBF 核的 σ 变小意味着什么?(提示: 每个样本的"势力范围")
""")
