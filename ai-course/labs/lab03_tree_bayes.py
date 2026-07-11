"""
lab03 · 决策树与朴素贝叶斯（配第 03 讲）

  1. 手算信息增益(和讲义的公式逐项对照)
  2. 决策树深度 vs 过拟合: 决策边界可视化
  3. 从零实现朴素贝叶斯垃圾短信分类器(含拉普拉斯平滑对照实验)

运行: .venv/bin/python labs/lab03_tree_bayes.py
"""
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons
from sklearn.tree import DecisionTreeClassifier

from _common import save_and_show

# ---------- 1. 手算信息增益 ----------
# 小数据集: 根据[天气, 有无作业]决定是否出去玩, 8 个样本
#   天气: 晴=1/雨=0   作业: 有=1/无=0   玩: 是=1/否=0
data = np.array([
    # 天气 作业 玩
    [1, 0, 1], [1, 0, 1], [1, 1, 1], [1, 1, 0],
    [0, 0, 1], [0, 0, 1], [0, 1, 0], [0, 1, 0],
])
X_toy, y_toy = data[:, :2], data[:, 2]

def entropy(y):
    """H = -Σ p log2 p (第03讲 1.1 节)"""
    _, counts = np.unique(y, return_counts=True)
    p = counts / len(y)
    return float(-np.sum(p * np.log2(p)))

def info_gain(X, y, feat):
    """Gain = H(S) - Σ |Sv|/|S| · H(Sv)"""
    H = entropy(y)
    cond = 0.0
    for v in np.unique(X[:, feat]):
        mask = X[:, feat] == v
        cond += mask.mean() * entropy(y[mask])
    return H - cond

print("== 1. 手算信息增益 ==")
print(f"  根节点熵 H(S) = {entropy(y_toy):.4f} 比特 (5玩3不玩)")
for i, name in enumerate(["天气", "作业"]):
    print(f"  按[{name}]切分: Gain = {info_gain(X_toy, y_toy, i):.4f}")
print("  → 决策树的第一刀应该切在增益大的那个特征上。拿笔验算一遍!")

# ---------- 2. 树深 vs 过拟合 ----------
print("\n== 2. 决策树的深度滑块 ==")
X, y = make_moons(n_samples=300, noise=0.3, random_state=1)
X_test, y_test = make_moons(n_samples=1000, noise=0.3, random_state=2)

fig, axes = plt.subplots(1, 3, figsize=(15, 4.2))
for ax, depth in zip(axes, [2, 5, None]):
    clf = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X, y)
    x1, x2 = np.meshgrid(np.linspace(-2, 3, 300), np.linspace(-1.5, 2, 300))
    Z = clf.predict(np.c_[x1.ravel(), x2.ravel()]).reshape(x1.shape)
    ax.contourf(x1, x2, Z, alpha=0.25, colors=["#4a7dbd", "#d9903f"])
    ax.scatter(X[:, 0], X[:, 1], c=y, cmap="coolwarm", s=12, edgecolors="k", lw=0.3)
    tr, te = clf.score(X, y), clf.score(X_test, y_test)
    ax.set_title(f"max_depth={depth}  训练{tr:.2f} / 测试{te:.2f}", fontsize=10)
    print(f"  depth={str(depth):>4}  训练准确率={tr:.3f}  测试准确率={te:.3f}  叶子数={clf.get_n_leaves()}")
save_and_show(fig, "lab03_tree_depth.png")
# 注意不限深度那张图: 边界为迁就单个噪声点切出的"孤岛"——轴平行矩形的过拟合长相。

# ---------- 3. 朴素贝叶斯垃圾短信分类器(从零实现) ----------
print("\n== 3. 朴素贝叶斯: 从零实现 ==")
# 内置小语料(spam=1 垃圾, ham=0 正常), 按"字"切分(中文最简单的 tokenize)
spam = ["恭喜您获得百万大奖点击领取", "限时优惠低价代开发票", "您已被抽中免费领取苹果手机",
        "贷款秒批无需抵押利息超低", "点击链接领取现金红包", "独家内幕股票包赚不赔",
        "免费领取会员点击注册", "中奖通知请速与我们联系领奖"]
ham = ["今晚一起吃饭吗", "作业写完了记得提交", "明天上午十点开会别迟到",
       "帮我带杯咖啡谢谢", "论文改好了发你邮箱", "周末去爬山吗天气不错",
       "妈让你早点回家吃饭", "实验数据我传到群里了"]
docs = spam + ham
labels = np.array([1] * len(spam) + [0] * len(ham))

def tokenize(text):
    return list(text)   # 逐字切分

vocab = sorted({ch for d in docs for ch in tokenize(d)})
V = len(vocab)
idx = {ch: i for i, ch in enumerate(vocab)}
print(f"  语料: 垃圾{len(spam)}条 + 正常{len(ham)}条, 词表(字表)大小 V={V}")

def train_nb(docs, labels, alpha):
    """返回 log先验 与 log条件概率矩阵 [2, V]。alpha=平滑伪计数(第03讲2.4节)"""
    log_prior = np.log(np.bincount(labels) / len(labels))
    counts = np.zeros((2, V))
    for d, c in zip(docs, labels):
        for ch in tokenize(d):
            counts[c, idx[ch]] += 1
    # θ_kw = (n_kw + α) / (n_k + αV)  ← 讲义里 Dirichlet MAP 推出的公式
    theta = (counts + alpha) / (counts.sum(axis=1, keepdims=True) + alpha * V)
    return log_prior, np.log(theta), counts

def predict_nb(text, log_prior, log_theta):
    """对数域计算(第03讲2.5节: 防下溢), 未见过的字直接跳过"""
    scores = log_prior.copy()
    for ch in tokenize(text):
        if ch in idx:
            scores += log_theta[:, idx[ch]]
    return scores  # [P(ham|x), P(spam|x)] 的非归一化对数

tests = ["点击领取免费大奖", "明天记得交作业", "低价手机点击购买", "周末一起吃饭"]

for alpha in [1.0, 0.0]:
    tag = f"α={alpha}(有平滑)" if alpha > 0 else f"α={alpha}(无平滑!)"
    print(f"\n  -- {tag} --")
    with np.errstate(divide="ignore"):   # α=0 时 log(0)=-inf, 故意演示
        log_prior, log_theta, _ = train_nb(docs, labels, alpha)
        for t in tests:
            s = predict_nb(t, log_prior, log_theta)
            verdict = "垃圾" if s[1] > s[0] else "正常"
            print(f"    「{t}」→ {verdict}   log分数 ham={s[0]:.1f} spam={s[1]:.1f}")

print("""
  观察 α=0 的结果: 只要出现一个"训练时没在该类出现过"的字,
  该类得分立刻 -inf ——一票否决, 这就是讲义说的"零频率灾难"。

== 动手改改 ==
1. 往 tests 里加一条你自己编的短信, 看分类结果; 再故意混入"恭喜"二字试试。
2. 把 tokenize 改成相邻双字(bigram): ["恭喜","喜您",...], 准确性有变化吗?
3. 第2节把 noise 调到 0.1: 无限深的树还过拟合吗? 为什么?
""")
