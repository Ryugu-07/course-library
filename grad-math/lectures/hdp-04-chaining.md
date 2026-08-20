# 高维概率 IV · 链式法与经验过程

> **对标**：Vershynin *HDP* §7.1–8.3 ｜ **前置**：hdp-01–03
> 收官页处理最一般的问题形态：**随机过程在无穷参数集上的上确界** $E\sup_{t\in T} X_t$——统计学习的泛化误差、经验过程的偏差都长这个样子。从"一步 ε-网"升级为"多尺度 chaining"，顶点是 Dudley 熵积分。这页是高维概率通往统计学习理论（slt 线）的桥。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="hdp04-learning-title">

<h2 id="hdp04-learning-title">学习层：一棵固定二叉树，三种“最大值”语言</h2>

### 1. 先预测：同一棵树上的三个数字不是同一个对象

实验固定一棵深度 $K$ 的完整二叉树。每条第 $k$ 层边的增量为独立 $g_e\sim N(0,1)$ 乘上

$$
\sigma_k=0.86\cdot0.42^{k-1},\qquad
X_v=\sum_{e\in\operatorname{path}(\mathrm{root},v)}\sigma_{\operatorname{level}(e)}g_e.
$$

同一份 seed 同时生成所有边，所以叶节点之间通过共同祖先相关，且增量满足由路径差定义的亚高斯度量。先预测：

1. 对 $|L|=2^K$ 个叶子一次性做 union bound，和把每一层的最大增量逐级记账，哪一个期望上界更紧？
2. 固定 seed 的 $\max_{v\in L}X_v$ 是期望上界、定理等式，还是一条样本路径的观测值？
3. Dudley / generic chaining 的自然量词是“每一条样本都等号成立”，还是 $E\sup$ 的上界语言？有限树上的图能否证明无限指标集的一般定理？

揭示前隐藏三种最大值和每一级数字；改变树深度或 seed 后预测重新上锁。

### 2. 两种理论账本与一条样本账本

令 $V=\sum_{k=1}^K\sigma_k^2$。把所有叶子当成一次性 $V$-次高斯变量，单尺度 union-bound 语言给出

$$
U_{\mathrm{single}}=\sqrt{2V\log|L|}.
$$

沿树按尺度接力，则第 $k$ 层有 $2^k$ 条边，逐级的高斯 max 项是

$$
u_k=\sigma_k\sqrt{2\log(2^k)},\qquad
U_{\mathrm{chain}}=\sum_{k=1}^K u_k.
$$

这是一个有限树上的多尺度 union-bound 账本，与 Dudley 熵积分 / generic chaining 的思想同向；它不是把常数、截断端点和一般度量空间的证明全部压缩成一个等式。对固定 seed，实验另外计算

$$
M_{\mathrm{sample}}=\max_{v\in L}X_v,\qquad
M_{\mathrm{chain}}=\sum_{k=1}^K\max_{e\text{ 在第 }k\text{ 层}}\Delta_e,
$$

其中 $M_{\mathrm{sample}}\le M_{\mathrm{chain}}$ 是这棵树上的样本级确定性不等式。它们都不能改名为 $E\sup$。

### 3. 可运行实验：看树、看逐级账、看量词

选择固定 seed 预设或调整有限深度 $K$。SVG 左侧画共享祖先与叶值，右侧并列单尺度上界、多尺度上界、固定 seed 样本最大值和样本级链上界；下方表格逐级列出 $\sigma_k$、实际最大增量和理论贡献。

<div class="learning-lab" data-learning-lab="chaining-tree" markdown="1">

**JavaScript 失效时的静态 fallback：**默认 $K=5$、seed=`31031`、叶节点数 $32$。尺度为 $0.86,0.3612,0.151704,0.06371568,0.0267605856$。三本账可读为：

| 账本 | 默认静态值 | 正确量词 |
|---|---:|---|
| 单尺度 $U_{\rm single}=\sqrt{2V\log32}$ | $2.494686$ | 期望上界语言 |
| 多尺度 $U_{\rm chain}=\sum_k\sigma_k\sqrt{2\log2^k}$ | $2.143879$ | 有限树的多尺度期望上界账本 |
| 固定 seed $\max_vX_v$ | $0.813619$ | 一次可复现样本的最大值 |
| 样本级 $\sum_k\max_e\Delta_e$ | $1.458464$ | 当前路径上的确定性链上界 |

默认 seed 只决定这一次边增量；它不是“Dudley 对每条样本都给出等式”的证据。

</div>

### 4. 边界、反例与迁移

- **Dudley / generic chaining 是期望上界语言**：$E\sup$、高概率版本和一次样本的 $\max X_v$ 必须分栏；固定 seed 的最大值可以偶然高于或低于某个期望上界，不能由一次路径裁决定理。
- **有限树不是一般定理证明**：这里的 $2^K$ 个叶子、固定几何尺度和 Gaussian 边增量是可计算教学模型；一般指标集需要覆盖数、度量、可测性和极限/积分条件。
- **单尺度不一定总输**：本实验的快速衰减尺度让多尺度账本更紧；换尺度、常数或度量后应重新比较，不能把“chaining 更小”当成无条件口号。
- **迁移提示**：把叶子换成函数类或数据集上的损失函数，写出 $d(f,g)^2$ 与覆盖数 $N(\varepsilon)$；再说明哪一项对应统计学习里的经验过程，而不是把有限树的样本最大值直接当作泛化误差。

</section>

## 1. 问题与亚高斯过程

**对象**：随机过程 $(X_t)_{t\in T}$，指标集 $T$ 带度量 $d$；**亚高斯增量条件**：

$$
\|X_t - X_s\|_{\psi_2} \leq d(t, s) \qquad (\text{近的参数, 差得少——概率版 Lipschitz})
$$

范例：高斯过程 $X_t = \langle g, t\rangle$（$g$ 标准高斯向量，$T \subseteq \mathbb{R}^n$，$d$ = 欧氏距离）；经验过程 $X_f = \frac{1}{\sqrt n}\sum_i(f(Z_i) - Ef)$（$T$ = 函数类 $\mathcal{F}$——slt 线的主角，此处埋人）。

目标：$E\sup_{t\in T}X_t$ 的上界——"这族随机量同时能有多大"。

## 2. 从一步网到 chaining

**一步网（hdp-03 的方法）**的代价：粒度 $\varepsilon$ 的网给 $E\sup \lesssim \sup_{\text{网点}} + \text{离散化误差}$——粗网省点数但误差大，细网反之，**单一尺度必有牺牲**。

**Chaining 的思想**【骨架级直觉】：**多尺度接力**。取一列越来越细的网 $\mathcal{N}_k$（粒度 $2^{-k}$），把任一点 $t$ 写成沿网的"链"：

$$
X_t = X_{t_0} + \sum_{k\geq 1}\big(X_{t_k} - X_{t_{k-1}}\big), \qquad t_k = \text{在 } \mathcal{N}_k \text{ 中最近的点}
$$

每级增量的尺度 $d(t_k, t_{k-1}) \leq 3\cdot2^{-k}$ 很小（亚高斯尾很尖），每级的 union bound 只需付该级网点数 $|\mathcal{N}_k|$ 的对数——**大跳靠粗网（点少）、细节靠细网（增量小）**，各尺度各付各账。

**定理（Dudley 熵积分）** 亚高斯增量过程：

$$
E\sup_{t \in T} X_t \;\leq\; C\int_0^{\infty}\sqrt{\ln N(T, d, \varepsilon)}\;d\varepsilon
$$

其中 $N(T,d,\varepsilon)$ = 覆盖数（ε-网最小点数）。
**【骨架】** 沿链逐级取期望最大值：第 $k$ 级贡献 $\lesssim 2^{-k}\sqrt{\ln|\mathcal{N}_k|}$（亚高斯 max 界：$m$ 个 $\psi_2$ 范数 $\leq\sigma$ 的量，$E\max \lesssim \sigma\sqrt{\ln m}$——hdp-01 尾界 + 积分一行）；对 $k$ 求和即熵积分的离散化（几何级数刻度下逐段矩形逼近）。$\blacksquare$

**读法**：**过程的最大值由"各尺度的复杂度 $\sqrt{\ln N(\varepsilon)}$ 沿尺度积分"控制**——几何复杂度（覆盖数）到概率界（sup 期望）的通用换算器。一步网 = 只取积分的一个矩形；chaining 的改进即"积分优于单点求值"。（前沿注脚【引用】：Talagrand 泛函 $\gamma_2$ 把 Dudley 收紧为双向匹配的 majorizing measures 定理——高斯过程 sup 的完全刻画；知其存在即可。）

## 3. 经验过程与一致大数定律

**统计学习的桥**：泛化误差的核心量是

$$
E\sup_{f \in \mathcal{F}}\Big|\frac1n\sum_i f(Z_i) - Ef\Big|
$$

——**函数类上的经验过程 sup**。SLLN（mt-02）管单个 $f$；学习需要**一致**版本（算法会挑 $f$——ai 课 01 讲"专挑训练误差最小"的那个陷阱的正式形态）。Dudley 给出通用答案：

$$
E\sup_{\mathcal{F}} \lesssim \frac{C}{\sqrt n}\int_0^\infty \sqrt{\ln N(\mathcal{F}, L^2(P_n), \varepsilon)}\,d\varepsilon
$$

函数类的覆盖数增长决定学习的样本复杂度——**"能学 = 覆盖数不太大 = 熵积分收敛"**。VC 类的覆盖数 $N(\varepsilon) \lesssim \varepsilon^{-Cd}$（Haussler【引用】）使积分收敛，给 $\sqrt{d/n}$ 速率——slt-02/03 将从另一条路（Rademacher + 对称化）抵达同一结论，两桥互证。

## 4. 高维概率四页资产盘点

| 工具 | 控制的对象 | 下游 |
|---|---|---|
| Chernoff/Hoeffding/Bernstein | 单个和 | 一切 |
| $\psi_2/\psi_1$ 语言 | 尾部的代数 | 全线组织语言 |
| ε-网三件套 | 球面 sup（矩阵谱） | 协方差/随机矩阵/压缩感知 |
| Chaining/Dudley | 任意参数集 sup | 经验过程、slt 线、高斯过程回归 |

## 5. 练习与要点

**例 1（亚高斯 max 界亲算）** $m$ 个 $\|X_i\|_{\psi_2}\leq\sigma$：$E\max X_i \leq C\sigma\sqrt{\ln m}$——用尾界积分 $E\max \leq t_0 + \int_{t_0}^\infty m\,e^{-ct^2/\sigma^2}dt$ 并取 $t_0 = \sigma\sqrt{\ln m}/\sqrt c$。（chaining 每级用的正是这一行；也解释了"$m$ 个高斯的最大值 $\approx \sigma\sqrt{2\ln m}$"——mt-01 例 1 的上界方向。）

**例 2（Dudley 应用：Lipschitz 类）** $[0,1]$ 上 1-Lipschitz 函数类：$\ln N(\varepsilon) \asymp \varepsilon^{-1}$ ⇒ 熵积分 $\int_0^1 \varepsilon^{-1/2}d\varepsilon < \infty$ 收敛——一致 LLN 成立，速率 $n^{-1/2}$；对比 $d$ 维 Lipschitz 类 $\ln N \asymp \varepsilon^{-d}$：$d \geq 2$ 时积分发散于 0 端——**非参数学习的维数灾难在熵积分的收敛性里现出原形**。

**例 3（桥的体感）** 有限类 $|\mathcal{F}| = m$：覆盖数 $\leq m$ 恒定，Dudley 退化为 $\sqrt{\ln m / n}$——恰是 ai 课 01 讲有限假设类泛化界。**那页的 $\ln|\mathcal{H}|$，在本页看来是熵积分最粗的一格矩形。**$\blacksquare$

---

*高维概率完卷。下一门：随机分析——布朗运动与 Itô 积分的严格版（本科 sde 三页的证明级重建）。*
