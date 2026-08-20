# 凸优化 III · 增广拉格朗日与 ADMM

> **对标**：Boyd et al. *Distributed Optimization via ADMM*（专著级综述）｜ **前置**：cvx-01/02、本科优化 III
> 大规模问题的解法哲学：**拆**——把纠缠的目标拆成各自好解的块，用对偶变量协调。本页从对偶上升法的缺陷出发，经增广拉格朗日的修复，抵达 **ADMM**：统计学习与分布式计算的主力求解器。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="splitting-learning-title">

## 学习层：一个精确 L1 问题，两种拆法，两本残差账

<h3 id="splitting-learning-title">1. 先固定能验算的凸问题</h3>

实验不把“跑得像”当成证明，只处理一个有闭式最优解的目标：

$$
\min_{x\in\mathbb R^2} F(x)=f(x)+g(x)
=\frac12\lVert x-b\rVert_2^2+\lambda\lVert x\rVert_1,
\qquad b=(3,-3/2),\quad\lambda=3/4.
$$

$\nabla f$ 的 Lipschitz 常数是 $L=1$，所以精确解由软阈值直接给出：

$$
x^*=\operatorname{soft}(b,\lambda)=(9/4,-3/4),
\qquad F^*=45/16=2.8125.
$$

比较两条实际轨迹：prox-gradient 直接处理 $f+g$；ADMM 把同一个目标改写成 $f(x)+g(z)$、约束 $x-z=0$。问题、最优点和 $F^*$ 都不换，换的只是协调变量与残差记账方式。

### 2. 预测门：步长假设和残差身份

先回答再揭晓：

1. 对 prox-gradient，标准单调下降的教科书条件是否是 $0<\alpha\le 1/L$？本 toy 的二次 $f$ 在 $\alpha<2/L$ 时还会显示稳定的谱因子，但这不是任意凸问题的通用保证。
2. 对 $x=z$ 的 ADMM，primal residual 是 $x-z$ 还是目标值差？scaled dual residual 又应写成 $\rho(z_k-z_{k-1})$ 还是 $z_k-z_{k-1}$？
3. 有限步的 $F(x_k)$ 很接近 $F^*$，是否就已经证明一般 ADMM 或 prox-gradient 的收敛定理？答案应是否定的。

预测提交前，轨迹、目标值、精确解和残差表都隐藏；换预设、$\alpha$、$\rho$ 或迭代次数会重新锁门。

### 3. 两个算法的透明模型

prox-gradient 的每一步是

$$
x_{k+1}=\operatorname{soft}\bigl(x_k-\alpha(x_k-b),\alpha\lambda\bigr),
\qquad
G_\alpha(x_k)=\frac{x_k-x_{k+1}}{\alpha}.
$$

账本中的 PG“原始残差”明确标作 $\lVert G_\alpha(x_k)\rVert$；它不是 ADMM 的约束残差，PG 没有独立的 dual residual。

ADMM 的 scaled form 是

$$
x_{k+1}=\frac{b+\rho(z_k-u_k)}{1+\rho},\qquad
z_{k+1}=\operatorname{soft}(x_{k+1}+u_k,\lambda/\rho),\qquad
u_{k+1}=u_k+x_{k+1}-z_{k+1},
$$

并记

$$
r_{k+1}=x_{k+1}-z_{k+1},\qquad
s_{k+1}=\rho(z_{k+1}-z_k).
$$

目标表同时显示目标函数 $F$（PG 在 $x_k$ 上、ADMM 在 $z_k$ 上）与 ADMM 的 split objective $f(x_k)+g(z_k)$。后者在有限步可能低于 $F^*$，因为 $x_k\ne z_k$ 时它不是原问题的可行点；不要把它误读成“突破最优下界”。

<div class="learning-lab" data-learning-lab="operator-splitting" markdown="1">

**JavaScript 失效时的静态 fallback：**默认从 $x_0=z_0=u_0=(0,0)$、$\alpha=0.8$、$\rho=1$ 运行 12 步。精确参照仍是

$$
x^*=(2.25,-0.75),\quad F^*=2.8125,
$$

并按下表区分两类残差：

| 方法 | 第一步可复核的目标 | 原始残差栏 | 对偶残差栏 | 步长/参数假设 |
|---|---:|---:|---:|---|
| prox-gradient | $F(x_1)=2.925$ | $\lVert G_{0.8}(x_0)\rVert\approx2.372$ | 不适用：没有 split dual variable | $0<\alpha\le1/L$ 给标准下降读法 |
| ADMM | $F(z_1)=4.21875$；$f(x_1)+g(z_1)=1.96875$ | $\lVert x_1-z_1\rVert\approx1.061$ | $\rho\lVert z_1-z_0\rVert=0.75$ | $\rho>0$；$f,g$ 闭、真、凸，未增广 Lagrangian 有鞍点且两子问题可取最小值 |

表中的数值只是有限轨迹的第一行，不是一般定理。透明证书要看 $F^*$、定义过的残差、$\alpha$/ $\rho$ 假设和问题结构是否同时满足。

</div>

### 4. 读账边界

- **PG 的步长要写清楚。**$0<\alpha\le1/L$ 是本页用来解释下降账的标准条件；若把 $\alpha$ 调到 $1/L$ 以上，脚本会单独显示“超出标准 PG 条件”，不会用这张二维图替代一般分析。
- **ADMM 的 $\rho$ 是正的度量/条件数参数，不是“越大压约束、越小压目标”的普适定律。**增大或减小 $\rho$ 会同时改变 $x/z$ 子问题的条件、primal residual 的尺度和 dual residual 的尺度；某个问题上 primal 变快时，dual 或目标进展可能变慢。残差平衡只是调参线索，不是最优参数证明。
- **有限迭代不是一般证明。**本实验能精确算 $x^*$，所以可以显示目标 gap 与真实误差作教学对照；一般 ADMM 收敛陈述要写明 $f,g$ 闭、真、凸，存在未增广 Lagrangian 的 primal-dual 鞍点，并且每个子问题的最小值能够取得（适当的约束资格可用于推出这些条件，但不能只写“强对偶”）。
- **split objective 不是原问题可行目标。**只有当 $x=z$ 时 $f(x)+g(z)=F(x)$；先看可行性，再解释目标数值。

</section>

## 1. 对偶上升法及其脆弱

约束问题 $\min f(x)\ \text{s.t.}\ Ax = b$，对偶函数 $q(y) = \min_x L(x, y)$。**对偶上升**：交替"给定 $y$ 解 $x$""对 $y$ 做梯度上升"（$\nabla q(y) = Ax^* - b$——对偶梯度恰是约束残差【一行：Danskin 定理/包络定理】）：

$$
x_{k+1} = \arg\min_x L(x, y_k), \qquad y_{k+1} = y_k + \alpha_k(Ax_{k+1} - b)
$$

**脆弱点**：内层 $\arg\min$ 要求 $f$ 严格凸且良态——$f$ 仿射方向平坦时 $x$-步无界（LP 就崩）；收敛还挑步长。**但它有一个宝贵基因**：$f$ 可分时 $x$-步逐块并行（**分布式的种子**）。

## 2. 增广拉格朗日（Method of Multipliers）

**修复**：给拉格朗日加二次罚项——

$$
L_\rho(x, y) = f(x) + y^\top(Ax - b) + \frac{\rho}{2}\|Ax - b\|^2
$$

$x$-步对 $L_\rho$ 求解。注意二次项的 Hessian 增量是 $\rho A^\top A$：它只沿 $A$ 能看见的方向提供曲率；$\ker A$ 中的方向仍然没有被罚项“撑起”。所以不能把增广项自动说成全空间强凸，$x$-子问题的有限可解性仍要由 $f$ 的曲率/强制性、$A$ 的秩或其他结构条件保证。$y$-步固定步长取 $\rho$：

$$
y_{k+1} = y_k + \rho\,(Ax_{k+1} - b)
$$

**为什么步长恰取 $\rho$【证明】**：$x_{k+1}$ 满足 $0 = \nabla f + A^\top y_k + \rho A^\top(Ax_{k+1} - b) = \nabla f + A^\top y_{k+1}$——**每步迭代后原始最优性条件自动精确成立**，只欠约束可行性；算法 = "保持对偶可行、逐步逼近原始可行"。$\blacksquare$
代价：罚项 $\|Ax - b\|^2$ 把各块 $x$ **耦合**了——可分性（对偶上升的宝贵基因）被杀死。鱼与熊掌，于是——

## 3. ADMM：既要稳健又要可拆

**问题形态**（与 cvx-01 Fenchel 同型）：$\min f(x) + g(z)\ \text{s.t.}\ Ax + Bz = c$。

**ADMM**（交替方向乘子法）：对增广拉格朗日**不联合求解而交替**：

$$
\begin{aligned}
x_{k+1} &= \arg\min_x L_\rho(x, z_k, y_k) \\
z_{k+1} &= \arg\min_z L_\rho(x_{k+1}, z, y_k) \\
y_{k+1} &= y_k + \rho(Ax_{k+1} + Bz_{k+1} - c)
\end{aligned}
$$

——**Gauss–Seidel 式的"轮流坐庄"**（数值 II 迭代法的既视感）：每块面对的都是"自己 + 二次项"的好问题（常有闭式：prox！cvx-02 的算子库整个接入——$g$ 是 L1 时 $z$-步 = 软阈值）。

**定理（收敛性）【骨架】** 对两块 $f,g$，需要它们是闭、真、凸函数，存在满足 $Ax^*+Bz^*=c$ 的 primal-dual 鞍点（即未增广 Lagrangian 的鞍点），并且每个交替子问题的最小值能够取得。满足这些条件时，标准两块 ADMM 给出原始残差 $Ax_k+Bz_k-c\to0$、目标值趋于最优，并在相应的解存在/取值条件下给出对偶变量收敛；“强对偶”或某个约束资格可以是推出鞍点存在的途径，但不能替代鞍点与子问题可解性的陈述。
*思路*：在鞍点存在且子问题确实取到最小值的前提下，标准证明用带解的 Lyapunov/firmly-nonexpansive 账本控制 $V_k$ 的下降；常见形式如 $V_k = \frac1\rho\|y_k-y^*\|^2+\rho\|B(z_k-z^*)\|^2$ 还要配合相应的秩与范数条件。三条最优性不等式相加才能得到残差控制，不能从一张有限轨迹图反推定理。$\blacksquare$
（速率：一般凸 $O(1/k)$（遍历意义）【引用】；不保证快。它的理论入口对任意 $\rho>0$ 都成立，但实际条件数、残差平衡和每步代价仍会随 $\rho$ 改变；“拆”才是它可分布式的结构优势。）

**读法**：ADMM = 增广拉格朗日的稳健 + 对偶上升的可拆——两代方法的合题。$\rho$ 改变的是增广度量与两个子问题的数值条件：它常让 primal/dual residual 以不同速度变化，具体目标进展取决于 $A,B,f,g$ 的谱与尺度；“让两类残差同量级”的自适应规则是工程启发式，不是“大 $\rho$ 压约束、小 $\rho$ 压目标”的一般定理【引用】。

## 4. 应用形态学（一个模板生成一族求解器）

| 问题 | 拆法 $f + g$ | $z$-步的 prox |
|---|---|---|
| Lasso | 最小二乘 + $\lambda\lVert z\rVert_1$（$x = z$） | 软阈值 |
| 鲁棒 PCA | 核范数 + L1（$L + S = M$） | 奇异值软阈值 + 软阈值 |
| 一致性优化（分布式） | $\sum_i f_i(x_i)$ + 一致约束 $x_i = z$ | 均值（$z$-步 = 各节点平均） |
| 图像去噪 TV | 保真项 + 全变差 | 逐边收缩 |

**一致性形态是分布式机器学习的原型**：各节点本地解自己的 $f_i$（数据不出门），只交换 $x_i$ 与乘子——联邦学习的优化骨架；🔗 你的 Medusa 若做多机 A/B 参数聚合，这就是教科书方案。

## 5. 练习与要点

**例 1（ADMM 手推 Lasso）** 写出三步的显式公式：$x$-步 = 解 $(A^\top A + \rho I)x = A^\top b + \rho(z - u)$（岭回归型——正则化的另一次上岗）、$z$-步 = 软阈值、$u$-步 = 残差累加（scaled form）。三行即一个可实现的 Lasso 求解器——亲手写进 30 行 numpy 是本页的最佳作业。

**例 2（为什么不三块交替）** 三块及以上的朴素 ADMM **可以发散**（Chen–He–Ye–Yuan 反例【引用】）——"两块的和谐不自动推广"：把问题重组成两块（变量堆叠）是标准规避法。定理边界即工程红线。

**例 3（对偶上升崩溃的实感）** $f(x) = c^\top x$（线性）+ 等式约束：$x$-步 $\arg\min$ 可能无界 ⇒ 对偶上升死。若 $A$ 对所有变量方向有足够秩，使 $A^\top A\succ0$，加入 $\frac\rho2\|Ax-b\|^2$ 才会给这个线性 toy 一个强凸二次骨架；若 $\ker A$ 中仍有 $c$ 的非零分量，增广项也不会自动良定。增广项只扶起它能观测的方向。$\blacksquare$

---

*下一页：二阶世界的高峰——内点法与半定规划：多项式时间凸优化的理论与 SDP 的应用版图，凸优化四页收官。*
