# 凸优化 I · 共轭函数与 Fenchel 对偶

> **对标**：Boyd & Vandenberghe §3.3、§5 / Rockafellar 入门 ｜ **前置**：本科优化 I–III、泛函 II
> 研究生凸优化的第一件新武器是**共轭函数**（Legendre–Fenchel 变换）：它把"函数"编码成"支撑超平面族"，是对偶理论的原子操作——本科的 Lagrange 对偶、后两页的近端算法与 ADMM，全部由它统一生成。

## 1. 共轭函数

<figure class="plot" markdown="1">
![Fenchel 共轭的支撑线几何](assets/img/cvx-01-conjugate.svg)
<figcaption><span class="fig-id">图 1.1</span>Fenchel 共轭 \(f^*(s)=\sup_x(sx-f(x))\)：斜率 \(s\) 处最"贴"的支撑线的负截距——对偶的几何本相。</figcaption>
</figure>

**定义** $f: \mathbb{R}^n \to (-\infty, +\infty]$（允许 $+\infty$——约束以"示性函数"进目标的现代记法）：

$$
f^*(y) = \sup_x\ \big[\langle y, x\rangle - f(x)\big]
$$

**几何读法**：$f^*(y)$ = 斜率为 $y$ 的直线族里"恰好托住 $f$ 图像"所需的截距修正——**$f^*$ 记录了 $f$ 的全部支撑超平面**（本科优化 I 支撑超平面定理的函数化）。$f^*$ 恒凸（逐点 sup 保凸——即使 $f$ 不凸）。

**必会共轭对照表**（各一两行推导，动笔过一遍）：

| $f(x)$ | $f^*(y)$ |
|---|---|
| $\frac12\|x\|_2^2$ | $\frac12\|y\|_2^2$（自共轭，唯一） |
| $\frac1p\lvert x\rvert^p$ | $\frac1q\lvert y\rvert^q$（$\frac1p + \frac1q = 1$——Hölder 共轭指数的出处！） |
| $e^x$ | $y\ln y - y$（负熵） |
| $\sum x_i\ln x_i$（熵） | $\ln\sum e^{y_i}$（log-sum-exp——**熵与 softmax 互为共轭**） |
| 示性函数 $\iota_C$ | 支撑函数 $\sigma_C(y) = \sup_{x\in C}\langle y,x\rangle$ |
| 范数 $\lVert x\rVert$ | 对偶范数单位球的示性函数 |

**Fenchel–Young 不等式**（定义的直接重排）：$f(x) + f^*(y) \geq \langle x, y\rangle$，取等 $\iff y \in \partial f(x)$——**"共轭对 = 次梯度关系"**：$(x, y)$ 配对当且仅当 $y$ 是 $x$ 处的支撑斜率。

**定理（双共轭）** $f$ 闭凸（下半连续 + 凸）$\Rightarrow f^{**} = f$。
**【骨架】** $f^{**} \leq f$ 由定义两次展开；反向：闭凸函数是其全部支撑超平面的上确界（分离超平面定理应用于上镜图 epigraph——凸分析的中心构造），而 $f^{**}$ 恰好就是这个上确界。$\blacksquare$
**读法**：**闭凸函数与其支撑面族信息等价**——"点描述"与"斜率描述"可以无损互换（一般 $f$ 的 $f^{**}$ = 凸包络：非凸问题的"凸松弛"由此定义）。

## 2. Fenchel 对偶

**定理（Fenchel–Rockafellar）** 原问题 $\min_x f(x) + g(Ax)$ 的对偶为

$$
\max_y\ -f^*(A^\top y) - g^*(-y)
$$

弱对偶恒成立；$f, g$ 闭凸 + 约束品性（如 $A\,\mathrm{dom}f$ 与 $\mathrm{dom}g$ 相对内部相交——Slater 的共轭版）下强对偶。
**【骨架】** 引入拆分变量 $z = Ax$ 与拉格朗日乘子 $y$，对 $x, z$ 分别取 inf——两个 inf 各自产出一个共轭函数（$\inf_x [f(x) - \langle A^\top y, x\rangle] = -f^*(A^\top y)$ 正是定义）。$\blacksquare$

**统一性检阅**：LP 对偶（$f, g$ 取线性 + 示性）、Lagrange 对偶（一般约束的示性化）、SVM 对偶（hinge 与范数各自共轭——本科 ai 课 02 的推导本质是查上面那张表）、**熵与 log-sum-exp 的对偶 = 最大熵与指数族的对偶**（信息论 III 的拉格朗日推导的抽象真身）——**一张变换表统一四门课的对偶**，这就是共轭语言的购买力。

## 3. 次梯度演算（研究生版补全）

本科优化 I 定义了次梯度；共轭语言配齐运算律：$\partial(f + g) = \partial f + \partial g$（Moreau–Rockafellar，需约束品性【引用】）；$\partial(g\circ A) = A^\top\partial g(Ax)$；**最优性条件的对偶形式**：$0 \in \partial f(x^*) \iff x^* \in \partial f^*(0)$——原始解与对偶解通过次微分互为反函数（Fenchel–Young 取等的两读）。

## 4. 练习与要点

**例 1（共轭亲算）** 推 $f = \max(0, 1-x)$（hinge）：分段讨论 sup 得 $f^*(y) = y$ 于 $y \in [-1, 0]$、否则 $+\infty$——SVM 对偶变量的盒约束 $0 \leq \alpha \leq C$ 的出处（对照本科 ai 课 02 的结果——那里的"神奇盒约束"原来是 hinge 的共轭定义域）。

**例 2（不等式一行造）** Fenchel–Young 用于 $\frac1p|x|^p$ 对：得 Young 不等式 $xy \leq \frac{x^p}{p} + \frac{y^q}{q}$——实变 III Hölder 证明的那块砖，出厂车间在此。

**例 3（松弛的语义）** $f$ = 0-1 损失（非凸）：$f^{**}$ = 其凸包络 = 线性下界段——"用 hinge 替代 0-1"（本科 ai 02）在共轭语言里是"取双共轭的可行近似"：**凸松弛不是权宜是原理**。$\blacksquare$

---

*下一页：一阶方法的收敛性证明——梯度下降、Nesterov 加速与近端梯度：本科"收敛速率表"逐行兑付。*
