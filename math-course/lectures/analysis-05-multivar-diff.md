# 数分 V · 多元微分学

> 一元到多元，三件事发生了质变：**极限有了无穷多个逼近方向**、**"可微"与"偏导存在"分了家**、**极值判别从符号升级为矩阵的正定性**。本页是四年数学里与机器学习重叠度最高的一页——梯度、Hessian、Lagrange 乘数法全部诞生于此。

## 1. 多元极限与连续

**定义** $\lim\limits_{(x,y)\to(x_0,y_0)} f = A$：$\forall\varepsilon\,\exists\delta$，$0 < \|(x,y)-(x_0,y_0)\| < \delta \Rightarrow |f - A| < \varepsilon$——要求**沿一切路径**逼近结果一致。

**杀手锏（证不存在）**：找两条路径极限不同。例：$f = \dfrac{xy}{x^2+y^2}$ 沿 $y = kx$ 得 $\frac{k}{1+k^2}$ 随 $k$ 变——极限不存在。**注意**：沿所有直线极限存在且相等**仍不保证**极限存在（$\frac{x^2 y}{x^4 + y^2}$ 沿抛物线 $y = x^2$ 露馅）——路径要多刁钻有多刁钻。

累次极限与重极限：互不蕴含；两者都存在时必相等（用于反证）。

## 2. 偏导数、全微分与可微性

**偏导数** $f_x(x_0,y_0) = \lim\limits_{h\to0}\frac{f(x_0+h, y_0) - f(x_0,y_0)}{h}$：固定其余变量的一元导数。

**定义（可微）** $\Delta f = A\Delta x + B\Delta y + o(\rho)$，$\rho = \sqrt{\Delta x^2 + \Delta y^2}$——**能被线性函数逼近**才叫可微（数分 II 的视角在此成为本体），此时全微分 $df = f_x dx + f_y dy$。

**关系图（考点核心，反例都要能举）**：

$$
\text{偏导连续} \;\Rightarrow\; \text{可微} \;\Rightarrow\; \text{连续、偏导存在}
$$

- 偏导存在 $\nRightarrow$ 连续（$\frac{xy}{x^2+y^2}$ 在原点偏导都是 0，却不连续——偏导只管坐标轴方向）；
- 可微 $\nRightarrow$ 偏导连续（$(x^2+y^2)\sin\frac{1}{x^2+y^2}$）；
- 一切箭头均不可逆。

**高阶偏导**：**Clairaut/Schwarz 定理**——$f_{xy}, f_{yx}$ 连续 ⇒ $f_{xy} = f_{yx}$（混合偏导可换序；不连续时有反例）。

**链式法则**（多元核心技术）：$z = f(u, v),\ u = u(x,y),\ v = v(x,y)$：

$$
\frac{\partial z}{\partial x} = \frac{\partial f}{\partial u}\frac{\partial u}{\partial x} + \frac{\partial f}{\partial v}\frac{\partial v}{\partial x}
$$

——"沿每条依赖路径求导再相加"。🔗 这正是反向传播的数学本体（ai 课 04 讲的四个方程就是它的矩阵化组织）。

## 3. 梯度与方向导数

**方向导数**（单位向量 $\ell$ 方向的变化率）：$f$ 可微时 $\dfrac{\partial f}{\partial \ell} = \nabla f \cdot \ell$，其中**梯度**

$$
\nabla f = \Big(\frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n}\Big)^\top
$$

由 Cauchy–Schwarz，$\frac{\partial f}{\partial \ell} = \|\nabla f\|\cos\theta$：**梯度方向是增长最快的方向，模长是最大变化率；负梯度方向下降最快**——🔗 梯度下降（ai 课 04 讲）的全部几何依据就这一行。梯度垂直于等值线/等值面（沿等值面方向导数为零）。

## 4. 隐函数定理与反函数定理

**定理（隐函数）** $F(x, y)$ 在 $(x_0, y_0)$ 邻域连续可微，$F(x_0,y_0) = 0$ 且 $F_y(x_0, y_0) \neq 0$，则方程 $F = 0$ 在该点附近唯一确定连续可微的 $y = y(x)$，且

$$
\frac{dy}{dx} = -\frac{F_x}{F_y}
$$

多变量/方程组版本：条件换成 **Jacobi 行列式** $\det\frac{\partial(F_1,\dots,F_m)}{\partial(y_1,\dots,y_m)} \neq 0$。**读法**：$m$ 个方程能局部解出 $m$ 个变量 $\iff$ 对这些变量的 Jacobi 矩阵可逆——"非退化则可解"，线性代数直觉的非线性版。**反函数定理**是其特例：$\det Jf(x_0) \neq 0 \Rightarrow f$ 局部可逆且 $J(f^{-1}) = (Jf)^{-1}$。

（🔗 归一化流、变量替换公式（数分 VI）、以及一切"坐标变换合法性"的判据都是 Jacobi 行列式。）

## 5. 多元 Taylor 与极值

**二阶 Taylor**（矩阵形式，机器学习通用写法）：

$$
f(x_0 + h) = f(x_0) + \nabla f(x_0)^\top h + \frac12 h^\top H(x_0)\, h + o(\|h\|^2),
\qquad H = \Big[\frac{\partial^2 f}{\partial x_i \partial x_j}\Big] \text{（Hessian, 对称）}
$$

**无条件极值**：必要条件 $\nabla f(x_0) = 0$（驻点）。充分判别看 Hessian（由二阶 Taylor：驻点处 $\Delta f \approx \frac12 h^\top H h$，符号由 $H$ 的定性决定——与高代 VI 二次型正定性在此会师）：

| $H(x_0)$ | 结论 |
|---|---|
| 正定 | 严格极小 |
| 负定 | 严格极大 |
| 不定 | 鞍点 |
| 半定 | 失效，需更高阶信息 |

二元情形的老写法 $AC - B^2 > 0$ 且 $A > 0$ ⇒ 极小，即为 $2\times2$ 正定判别（顺序主子式）。🔗 深度学习损失面上鞍点远多于局部极小（高维随机对称矩阵特征值同号概率指数小）——ai 课 04 讲"SGD 逃鞍点"的背景数学。

**条件极值（Lagrange 乘数法）**：求 $f$ 在约束 $g(x) = 0$ 上的极值 ⇒ 解

$$
\nabla f = \lambda \nabla g, \qquad g = 0
$$

*几何直觉*：极值点处 $f$ 的等值面与约束面相切，两梯度共线（否则沿约束面还能移动使 $f$ 变化）。多约束版本 $\nabla f = \sum_i \lambda_i \nabla g_i$。**流程**：建 Lagrange 函数 $L = f - \lambda g$ → 求驻点 → 与边界/端点比较定最值。🔗 SVM 对偶（ai 课 02 讲）、熵最大化、以及运筹页的 KKT 条件都是它的直系后代——**这是本科数学通往现代优化的正门**。

## 6. 典型例题

**例 1（可微性判定）** $f(x,y) = \sqrt{|xy|}$ 在原点：偏导 $f_x(0,0) = f_y(0,0) = 0$ 存在；若可微则 $\Delta f = o(\rho)$，但沿 $y = x$：$\frac{|x|}{\sqrt2 |x|} = \frac{1}{\sqrt2} \not\to 0$，故**不可微**。（标准流程：先求偏导、再验 $\frac{\Delta f - f_x\Delta x - f_y \Delta y}{\rho} \to 0$。）

**例 2（Lagrange 乘数法）** 求原点到曲面 $z^2 = xy + 4$ 的最短距离。
*解*：最小化 $f = x^2 + y^2 + z^2$，约束 $g = xy + 4 - z^2 = 0$。方程组：$2x = \lambda y,\ 2y = \lambda x,\ 2z = -2\lambda z,\ g = 0$。由前两式 $x^2 = y^2$；若 $z \neq 0$ 则 $\lambda = -1$ 得 $x = -y$… 逐支求解得候选点 $(0, 0, \pm2)$，$f = 4$，最短距离 $= 2$。

**例 3（隐函数求导）** $\sin z = xyz$ 确定 $z(x,y)$，求 $\frac{\partial z}{\partial x}$。
*解*：$F = \sin z - xyz$，$\frac{\partial z}{\partial x} = -\frac{F_x}{F_z} = \frac{yz}{\cos z - xy}$（$\cos z \neq xy$ 处成立——隐函数定理的条件不是装饰）。$\blacksquare$

---

*下一页：多元积分学——重积分、曲线曲面积分，以及把它们全部统一起来的三大公式。*
