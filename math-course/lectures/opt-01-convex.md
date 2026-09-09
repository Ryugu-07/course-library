# 优化 I · 凸分析基础

> 优化理论的第一课不是算法而是**几何**：什么样的问题天生"好解"？答案常常是凸问题——凸性给出局部最优即全局最优；在适当约束资格（经典凸规划中如 Slater 条件）下才可推出强对偶/零对偶间隙；在步长、光滑性、强凸性或单调性等算法假设满足时，才有相应的收敛保证。凸与非凸是优化世界的"可靠/探险"分界线，深度学习属于后者，但它的一切算法语言仍是在凸世界里锻造的。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：固定斜率的直线，怎样抬到最高？

### 1. 具体谜题：给定斜率，谁是“最高”下界？

先把斜率固定为 $s$，只移动一条直线

$$
\ell_{s,b}(x)=sx-b.
$$

先检查这个斜率是否存在某条全局仿射下界。若存在，取足够大的 $b$，再逐渐减小它，直线会整体向上抬升。某些斜率根本没有有限的可用 $b$；不能靠“再往下移一些”解决。要让它始终是下界，必须有

$$
sx-b\le f(x)\quad(\forall x)
\quad\Longleftrightarrow\quad
b\ge sx-f(x)\quad(\forall x).
$$

所以允许的最小 $b$ 恰好是

$$
f^*(s)=\sup_x\bigl(sx-f(x)\bigr),
$$

最高的固定斜率下界就是

$$
\ell_s(x)=sx-f^*(s).
$$

这里的“支撑”不是凭空画一条切线，而是对所有 $x$ 同时检查：直线不能越过 $f$，并且已经抬到所给斜率允许的最高位置。

### 2. 先预测：拖动滑块前写下三句话

1. 对 $f(x)=x^2/2$，若 $s=1.5$，你预测接触点在哪里？$f^*(1.5)$ 应是多少？
2. 对 $f(x)=|x|$，为什么 $|s|>1$ 时不存在有限的最高下界？在 $|s|<1$、$s=1$ 时，接触集分别是什么？
3. 对 softplus，$s=0.5$ 会不会在有限的 $x$ 接触？$s=0$ 或 $1$ 虽然给出有限的 $f^*$，是否一定有有限接触点？

预测的关键词是“域”：$f^*(s)$ 可以是有限值，也可以是 $+\infty$。域外不是把图上的点画得很高，而是上确界无界，因而没有有限的支撑线和接触点。

### 3. 最小模型：共轭把位置坐标换成斜率坐标

若 $f$ 是 proper、下半连续、凸函数，Fenchel 共轭把每个斜率 $s$ 送到一笔“所需截距” $f^*(s)$。有限且在有限点接触时，

$$
s\in\partial f(x)
\quad\Longleftrightarrow\quad
f(x)+f^*(s)=sx
\quad\Longleftrightarrow\quad
x\in\partial f^*(s).
$$

若 $f$ 在 $x$ 可微，第一条条件是 $s=f'(x)$；只有 $f^*$ 在 $s$ 也可微时，才能再写 $x=(f^*)'(s)$。折点或定义域边界处必须保留次微分、极限接触和 $+\infty$ 这些信息。

### 4. 可操作实验：左边抬线，右边记账

先改变斜率 $s$，左图画函数，右图记共轭值。再用上移量 $\delta$ 改变直线：

$$
\ell_{s,\delta}(x)=sx-f^*(s)+\delta.
$$

只要 $f^*(s)$ 有限，就有一条不依赖有限图窗的判断依据：

$$
\inf_x\bigl(f(x)-\ell_{s,\delta}(x)\bigr)=-\delta.
$$

因此 $\delta<0$ 时直线仍在下方，但不是最高；$\delta=0$ 达到最高；$\delta>0$ 时一定存在某个 $x$ 使直线越过函数。**下确界为零也不必取到零。** softplus 的端点就是例子：最高线没有有限接触点。“支撑线”若严格要求接触，端点处应称最高仿射下界。

先选 softplus、$s=1$，保持 $\delta=0$；再略微上抬。穿越可能远在窗格外，不能因为图内没看到交点就说它还是下界。边界按钮可进一步比较 $1$ 与其两侧极接近的斜率，数值分类不使用“足够接近就算等于”的阈值。

<div class="learning-lab" data-learning-lab="fenchel-support" markdown="1">

**无 JavaScript 时的静态读法：**三个预设的精确答案如下。

- $f(x)=x^2/2$：$f^*(s)=s^2/2$，定义域为全部 $\mathbb R$，接触点是 $x=s$。
- $f(x)=|x|$：$f^*(s)=0$（当 $|s|\le1$），$f^*(s)=+\infty$（当 $|s|>1$）；$|s|<1$ 时接触点为 $x=0$，$s=1$ 的接触集为 $x\ge0$，$s=-1$ 的接触集为 $x\le0$。
- $f(x)=\log(1+e^x)$：$f^*(s)=s\log s+(1-s)\log(1-s)$，定义域为 $[0,1]$，约定 $0\log0=0$；$0<s<1$ 时 $x=\log\frac{s}{1-s}$，而 $s=0,1$ 只在 $x\to-\infty,+\infty$ 的极限上接触，域外为 $+\infty$。

若当前 $s$ 在 $\operatorname{dom}f^*$ 外，右图不应有有限的当前点，左图也不应伪造一条“最高”直线：此时 $\sup_x(sx-f(x))=+\infty$。

</div>

### 5. 条件边界：图像没有替定理放宽假设

- Fenchel–Young 不等式直接来自上确界定义；$s\in\partial f(x)$ 与等号的第一层等价不需要闭性。反向的 $x\in\partial f^*(s)$ 等价要谨慎：若函数没有闭性，$f^{**}$ 可能只恢复其下半连续凸包，不能不加检查地把 $f$ 与 $f^{**}$ 混用。
- $f^*(s)<+\infty$ 不自动意味着上确界在某个有限 $x$ 取到。softplus 的 $s=0,1$ 正是“有限但只在无穷远接触”的边界。
- 有限维 proper 凸函数的次微分在定义域相对内部非空，定义域边界却可能为空；因此“有一个斜率”与“存在一个有限接触点”不能在边界处画等号。

</section>

## 0. 读定理前，先给四个词具体含义

本页在有限维空间 $\mathbb R^n$ 中讨论。允许 $f(x)=+\infty$ 表示“这个点不允许”，但不允许 $-\infty$。

- **有效域** $\operatorname{dom}f=\{x:f(x)<+\infty\}$；**proper**（真函数）意味着这个域非空，即至少有一个有限值。
- **上图集** $\operatorname{epi}f=\{(x,t):t\ge f(x)\}$，是在函数图像上方的全部点。$f$ 凸等价于它的上图集凸；这把“函数的弦”变成“集合里的线段”。
- **下半连续**：$f(x)\le\liminf_{y\to x}f(y)$。函数在极限点不能突然向上跳；上图集是闭集与此等价。凸分析里“闭函数”指这个性质，不是说有效域必须闭。例如 $-\log x$ 在 $x>0$ 有限，域外为 $+\infty$，有效域开放，但它仍是闭凸函数。
- **相对内部** $\operatorname{ri}C$：在集合的仿射包里取内部。一条线段在平面里没有普通内点，在自身所在直线中却有相对内点。次梯度存在性与 Slater 条件经常需要这个区别。

把集合约束写成指标函数 $\delta_C(x)=0$（$x\in C$）与 $+\infty$（域外），便可将 $\min_{x\in C}f(x)$ 写成无约束的 $\min_x[f(x)+\delta_C(x)]$。$\delta_C$ 凸当且仅当 $C$ 凸；$C$ 闭时它下半连续。

## 1. 凸集

**定义** $C$ 凸 $\iff \forall x, y \in C,\ \lambda \in [0,1]:\ \lambda x + (1-\lambda)y \in C$（任两点连线段不出集合）。

**基本例子**：超平面 $\{a^\top x = b\}$ 与半空间 $\{a^\top x \leq b\}$；球；**多面体**（有限个半空间之交——线性规划的可行域，优化 IV）；半正定矩阵锥（高代 VI 的半正定判据给出的集合）。

**保凸运算**：任意多个凸集的**交**仍凸（并一般不凸）；仿射映射的像与原像。

**分离与支撑，要问有没有正间隔。** 对两个非空、不相交的凸集 $C,D\subset\mathbb R^n$，弱分离给出非零 $a$ 和实数 $b$，使

$$
\langle a,x\rangle\le b\le\langle a,y\rangle
\quad(x\in C,\ y\in D).
$$

这不保证两侧留有正间隔。例如 $C=(-\infty,0)$、$D=(0,\infty)$ 虽不相交，但距离为零。若进一步一集紧、另一集闭，仍不相交，则可得到正间隔的强分离。SVM 的正间隔不能仅由“不相交”三个字推出。

对非空凸集 $C$ 的边界点 $x_0$，有限维支撑定理给出某个 $a\ne0$，使 $\langle a,x-x_0\rangle\le0$ 对所有 $x\in C$ 成立。即使 $x_0$ 不属于 $C$，这条边界支撑关系仍有意义；而上图集的支撑面可能竖直，不能据此保证每个边界点都有有限次梯度。

## 2. 凸函数

<figure class="plot">
<div role="region" tabindex="0" aria-label="可横向滚动的凸性静态图" style="overflow-x:auto"><img src="assets/img/opt-01-convex.svg" alt="左图为二次函数的真实弦与切线，右图比较严格凸的x四次方和失败的二次下界" style="min-width:1080px"></div>
<figcaption><span class="fig-id">图 1.1</span>左图比较弦、函数与切线；右图说明严格凸仍可能没有任何正的强凸常数。</figcaption>
</figure>

**定义** $f$ 凸 $\iff$ 定义域凸且 $f(\lambda x + (1-\lambda)y) \leq \lambda f(x) + (1-\lambda)f(y)$（弦在图像上方）。**严格凸**：对不同的有限域点 $x\ne y$、$0<\lambda<1$，不等号严格；**$\mu$-强凸**（$\mu>0$）：$f - \frac{\mu}{2}\|x\|^2$ 仍凸（碗至少弯到二次程度——收敛速率的关键参数，优化 II）。

**三级判据**：以下一、二阶等价判据放在开凸域上讨论，可微性逐级增强；若有效域在低维仿射空间中，应改用相对坐标。

| 条件 | 判据 |
|---|---|
| 零阶（定义） | 弦在上方 |
| 一阶（可微） | $f(y) \geq f(x) + \nabla f(x)^\top (y - x)$——**切平面全局在下方** |
| 二阶（二阶可微） | Hessian $\nabla^2 f(x) \succeq 0$ 处处半正定（高代 VI 判据上岗） |

一阶条件是三者中最常被引用的：它说凸函数的局部线性信息（梯度）携带**全局**下界——这就是为什么梯度方法在凸世界有全局保证。

**常见凸函数清单**：仿射（唯一既凸又凹）、$e^{ax}$、$-\ln x$、范数、$\max(x_1,\dots,x_n)$、log-sum-exp $\ln\sum e^{x_i}$（softmax 的势函数；对 logits 的凸性不能直接推到网络参数）、二次型 $x^\top A x$（对称 $A\succeq0$ 时；一般 $A$ 只由对称部分决定）。

**保凸运算**：非负加权和；与仿射复合 $f(Ax + b)$；**逐点上确界** $\sup_\alpha f_\alpha(x)$（凸函数族的包络仍凸——对偶函数凹性的来源，优化 III）；复合规则（外凸内仿射，或外凸不减内凸）。

**Jensen 不等式**：例如 $f$ 为 proper、下半连续凸函数，$X$ 可积且 $f(X)$ 绝对可积时，$f(EX)\le E[f(X)]$。有限加权平均的版本直接反复使用凸性定义；期望版还要确保各项有意义，不能在不存在的期望上套公式。

**严格凸不等于强凸。** $x^4$ 在 $\mathbb R$ 上严格凸，但 $f''(0)=0$，不存在全局正的强凸常数；它也说明 Hessian 处处正定是严格凸的充分条件，非必要条件。强凸保证的是统一的二次下界，不只是“图像没有直线段”。

**log-sum-exp 的凸性可直接验算。** 设 $p_i=e^{z_i}/\sum_j e^{z_j}$，其 Hessian 为 $\operatorname{diag}(p)-pp^\top$。任意向量 $v$ 都满足

$$
v^\top\nabla^2 f(z)v=\sum_i p_i v_i^2-\Bigl(\sum_i p_i v_i\Bigr)^2\ge0,
$$

右边是加权方差。沿全一向量曲率为零，因此它在整个 logits 空间也不是强凸函数。交叉熵 $\log\sum_i e^{z_i}-z_k$ 对 $z$ 凸；若 $z$ 是参数的非线性函数，复合规则未必保凸。

## 3. 凸优化问题

**定义** $\min f(x)$ s.t. $g_i(x) \leq 0,\ Ax = b$，其中 $f, g_i$ 凸。这是标准凸规划的一种保证凸性的表示形式：等式约束写成仿射。不能反推“任何非仿射等式的可行域都不凸”；例如 $x^2=0$ 的可行集就是凸集 $\{0\}$。

**定理（局部即全局）** 凸问题的任何局部极小点都是全局极小点。
*证明（三行，值得记住）*：设 $x^*$ 局部极小而 $y$ 更优（$f(y) < f(x^*)$）。沿线段 $z_\lambda = (1-\lambda)x^* + \lambda y$，凸性给 $f(z_\lambda) \leq (1-\lambda)f(x^*) + \lambda f(y) < f(x^*)$ 对一切 $\lambda \in (0,1]$ 成立——$x^*$ 的任意小邻域内都有更优点，与局部极小矛盾。$\blacksquare$

（在**无约束、可微凸**问题且 $x^*$ 位于适当定义域内点时，$\nabla f(x^*) = 0 \iff$ $x^*$ 是全局最优；有约束问题要改用 KKT/法锥条件，边界点也不能直接套这句。）

**最优点是否存在，要另查。** 严格凸只保证最优点**至多一个**，不能保证存在；$e^x$ 的下确界为零，却在 $\mathbb R$ 上从不取到。甚至 $x^2$ 限制在 $(0,\infty)$ 上仍强凸，但也没有最小点。一个实用的充分条件是：proper、下半连续目标存在非空紧的次水平集 $\{x:f(x)\le\alpha\}$；此时可用紧性取得最小值，再用严格凸性取得唯一性。闭的可行域、无穷远的增长控制与凸性，各管一件事。

## 4. 次梯度：不可微时怎么办

凸函数可以有折点（$|x|$、hinge 损失、标量 ReLU）。**次梯度** $g$ 定义为满足一阶条件的向量：

$$
f(y) \geq f(x) + g^\top (y - x), \quad \forall y
$$

全体次梯度构成**次微分** $\partial f(x)$（它总是凸集；对有限维 proper 凸函数，在 $\operatorname{ri}(\operatorname{dom}f)$ 非空，但定义域边界可能为空；可微内点处退化为 $\{\nabla f\}$）。例：$f = |x|$ 在 0 处 $\partial f(0) = [-1, 1]$。无约束全局最优性恰为 $0\in\partial f(x^*)$。对闭凸约束 $C$，若 $f$ 在其邻域可微凸，可以改写成

$$
0\in\nabla f(x^*)+N_C(x^*),\qquad
N_C(x)=\{v:\langle v,y-x\rangle\le0\ \forall y\in C\}.
$$

例如在 $[0,\infty)$ 上最小化 $f(x)=x$，最优点 $x^*=0$ 的梯度是 $1$，但法锥 $N_C(0)=(-\infty,0]$ 含有 $-1$，恰好抵消。若目标也不可微，直接使用 $\partial(f+\delta_C)$ 最稳妥；把它拆成 $\partial f+N_C$ 还需要相应求和资格条件。

定义域边界无次梯度的例子是 $f(x)=-\sqrt{x}$（$x\ge0$），域外 $+\infty$。在零点若有有限次梯度 $g$，就应有 $-\sqrt y\ge gy$ 对每个 $y>0$ 成立，即 $g\le-1/\sqrt y$；令 $y\downarrow0$ 不可能。这是闭凸函数，缺少的是该点的相对内点条件。

🔗 **AI 衔接**：hinge 损失（ai 课 02 讲 SVM）、L1 正则的稀疏性可用一维模型精确说明：最小化 $\frac12(x-a)^2+\tau|x|$（$\tau\ge0$），条件为 $0\in x-a+\tau\partial|x|$，从而 $x^*=\operatorname{sign}(a)\max(|a|-\tau,0)$。当 $|a|\le\tau$ 时，一个参数区间都映到同一个零解；目标仍严格凸，最优解是唯一的，并非“有一段最优解”。ReLU 网络整体通常是非凸的；在**标量 ReLU 的折点 0**，框架可以选取约定导数（例如 `relu'(0)=0`），也可以把这个值看作从广义梯度/次微分 $[0,1]$ 中选取的一个代表，不能把整个非凸网络的 autodiff 值统称为凸次梯度。

## 5. Fenchel 共轭与支撑线

设 $f:\mathbb R^n\to(-\infty,+\infty]$ 是 proper、下半连续、凸函数。它的 **Fenchel 共轭**定义为

$$
f^*(s)=\sup_x\{\langle s,x\rangle-f(x)\}.
$$

固定 $s$，若仿射函数 $\ell(x)=\langle s,x\rangle-b$ 要满足 $\ell(x)\le f(x)$ 对所有 $x$ 成立，则必须有

$$
b\ge \sup_x\{\langle s,x\rangle-f(x)\}=f^*(s).
$$

因此 $\ell_s(x)=\langle s,x\rangle-f^*(s)$ 是该斜率下最高的全局仿射下界；若 $f^*(s)=+\infty$，说明这个斜率根本没有有限的全局下界截距。

直接由上确界定义就得到 Fenchel–Young 不等式（这一不等式本身不要求凸性或闭性）

$$
f(x)+f^*(s)\ge\langle s,x\rangle.
$$

在上述闭凸条件下，等号链是

$$
f(x)+f^*(s)=\langle s,x\rangle
\quad\Longleftrightarrow\quad
s\in\partial f(x)
\quad\Longleftrightarrow\quad
x\in\partial f^*(s).
$$

对 $x\in\operatorname{dom}f$，第一步来自“直线正好接触”，这一步无需闭性：$s\in\partial f(x)$ 意味着 $f(y)\ge f(x)+\langle s,y-x\rangle$，对 $y$ 取上确界即得等号；反向等号又把这条全局下界还原出来。将 $x\in\partial f^*(s)$ 反推回原函数的等号，需要 $f=f^{**}$（由 proper、下半连续、凸性保证），这正是不能省略闭性假设的地方。

三个一维预设的共轭账本是：

| $f(x)$ | $f^*(s)$ | 有限域与接触 |
|---|---|---|
| $x^2/2$ | $s^2/2$ | $s\in\mathbb R$；$x=s$ |
| $\lvert x\rvert$ | $0$（$\lvert s\rvert\le1$），否则 $+\infty$ | $\lvert s\rvert<1$ 接触 $x=0$；$s=1$ 接触 $x\ge0$；$s=-1$ 接触 $x\le0$ |
| $\log(1+e^x)$ | $s\log s+(1-s)\log(1-s)$ | $s\in[0,1]$；$0<s<1$ 时 $x=\log\frac{s}{1-s}$，端点只在无穷远接触 |

**不闭时会发生什么？** 取 $f=\delta_{(0,\infty)}$。它 proper 且凸，但在零点不下半连续。其共轭为 $f^*=\delta_{(-\infty,0]}$，再取共轭得到 $f^{**}=\delta_{[0,\infty)}$。闭包补入了零点：$0\in\partial f^*(-1)$，却没有 $-1\in\partial f(0)$，因为 $f(0)=+\infty$，零点根本不在原有效域中。这是不能省略闭性的具体反例。

## 6. 典型例题

**例 1（二阶判据）** 判断 $f(x, y) = x^2 + xy + y^2 - \ln(xy)$ 在 $x, y > 0$ 上的凸性。
*解*：Hessian $= \begin{pmatrix} 2 + \frac{1}{x^2} & 1 \\ 1 & 2 + \frac{1}{y^2} \end{pmatrix}$，顺序主子式 $> 0$（对角 $> 2$、行列式 $> 4 - 1 > 0$）——正定，故（严格）凸。

**例 2（逐点上确界）** 证明矩阵最大特征值 $\lambda_{\max}(A)$ 是对称矩阵空间上的凸函数。
*解*：Rayleigh 商表示 $\lambda_{\max}(A) = \sup_{\|v\|=1} v^\top A v$——对每个固定 $v$，$A \mapsto v^\top A v$ 是线性（凸）函数，逐点 sup 保凸。$\blacksquare$（一行用掉两个工具；这类"变分表示 + 保凸运算"是凸性证明的高级套路。）

**例 3（一阶条件应用）** $f$ 在开凸域上可微且凸，$x^*$ 是该域内点。证明 $\nabla f(x^*) = 0 \Rightarrow x^*$ 全局最优。
*解*：一阶条件 $f(y) \geq f(x^*) + \nabla f(x^*)^\top(y - x^*) = f(x^*)$ 对一切域内 $y$。完。——无约束凸世界里"梯度为零"就是终点线；若有约束或 $x^*$ 在边界，必须改用相应的可行方向/KKT 条件。


## 7. 迁移练习

<details class="answer" markdown="1">
<summary>练习 1：为什么 x⁴ 严格凸，却不能用任何正数 μ 作为全局强凸常数？</summary>

导数 $4x^3$ 严格递增，因此 $x^4$ 严格凸。若它 $\mu$-强凸，在 $x=0$ 的二次下界应给 $y^4\ge\mu y^2/2$。对非零 $y$ 除以 $y^2$，再令 $y\to0$，得到不可能的 $0\ge\mu/2$。正定 Hessian 不是严格凸的必要条件；统一正曲率才对应这里的强凸性。

</details>

<details class="answer" markdown="1">
<summary>练习 2：softplus 在 s=1 时没有有限接触点，上抬 δ>0 后为什么仍必然穿越？</summary>

此时最高下界为 $\ell_1(x)=x$。上移后的间隙

$$
\log(1+e^x)-(x+\delta)=\log(1+e^{-x})-\delta.
$$

随 $x\to+\infty$ 趋于 $-\delta<0$；所以足够大的有限 $x$ 已使间隙为负。交点满足 $x=-\log(e^\delta-1)$，数值计算可用 $-\log(\operatorname{expm1}\delta)$。当 $\delta$ 很小时，交点可以远在可视窗口外；下确界给出的全局判断仍有效。

</details>

<details class="answer" markdown="1">
<summary>练习 3：交叉熵对 logits 凸，为什么对网络参数未必凸？</summary>

取两个 logits 为 $(w^2,0)$，真实类别为第一类。损失为

$$
L(w)=\log(e^{w^2}+1)-w^2=\log(1+e^{-w^2}).
$$

在 $w=0$ 有 $L''(0)=-1<0$，所以对参数 $w$ 不凸。非线性参数化改变了几何；不能把 logits 的 Hessian 半正定直接搬到参数空间。

</details>

## 8. 阅读与后续连接

- [Boyd 与 Vandenberghe《Convex Optimization》作者页](https://web.stanford.edu/~boyd/cvxbook/)：凸集、凸函数、优化问题的标准形式与对偶理论。
- [MIT 课程：凸集、分离与支撑](https://ocw.mit.edu/courses/6-079-introduction-to-convex-optimization-fall-2009/26c4c530c9db63a12b898d720dd89a44_MIT6_079F09_lec02.pdf)：弱分离与更强分离条件。

下一步分别进入[无约束优化算法](opt-02-unconstrained.html)、[对偶与 KKT](opt-03-duality-kkt.html)、[线性规划与动态规划](opt-04-lp-dp.html)。先辨认域、闭性和曲率，再选择算法或最优性条件。
