# 微分几何 I · 曲线论

> 微分几何 = 用微积分研究弯曲的对象。第一站是空间曲线：**一条曲线的全部几何由两个函数决定——曲率（弯多快）与挠率（扭多快）**。这个"完全分类"由 Frenet 标架实现：给曲线随身携带一个正交坐标系，微积分与线性代数在此合演。

## 1. 参数曲线与弧长

**正则曲线** $\mathbf{r}(t): I \to \mathbb{R}^3$，$\mathbf{r}'(t) \neq \mathbf 0$（速度不歇——保证处处有切方向）。**弧长**

$$
s(t) = \int_{t_0}^{t}|\mathbf{r}'(u)|\,du
$$

（数分 III 弧长公式的空间版。）**弧长参数化**（$|\mathbf{r}'(s)| \equiv 1$，匀速单位速）是理论的标准挡位：一切公式在它之下最干净；实算时用一般参数的换算公式（§3 表）。

## 2. Frenet 标架：曲线的随身坐标系

<figure class="plot" markdown="1">
![密切圆半径等于曲率倒数](assets/img/dg-01-curvature.svg)
<figcaption><span class="fig-id">图 1.1</span>曲率 \(\kappa\) 的几何：密切圆是与曲线二阶相切的圆，半径 \(R=1/\kappa\)——曲线拐得越急、密切圆越小。</figcaption>
</figure>

弧长参数下（记 $' = \frac{d}{ds}$）：

- **单位切向量** $\mathbf{T} = \mathbf{r}'$；
- **曲率** $\kappa(s) = |\mathbf{T}'|$——切方向的转速，"弯的程度"；$\kappa \equiv 0 \iff$ 直线；
- **主法向量** $\mathbf{N} = \mathbf{T}'/\kappa$（指向弯曲的凹侧）；
- **副法向量** $\mathbf{B} = \mathbf{T}\times\mathbf{N}$（右手系补全；$\mathbf{T,N}$ 张成的平面 = 密切平面——"最贴曲线的平面"）；
- **挠率** $\tau$：$\mathbf{B}' = -\tau\mathbf{N}$——密切平面的翻转速度，"扭出平面的程度"；$\tau \equiv 0 \iff$ 平面曲线。

**Frenet 公式**（标架的运动方程，反对称矩阵形式——正交标架求导必反对称，高代 VI 正交阵的无穷小版本）：

$$
\begin{pmatrix}\mathbf{T}\\\mathbf{N}\\\mathbf{B}\end{pmatrix}' =
\begin{pmatrix} 0 & \kappa & 0\\ -\kappa & 0 & \tau \\ 0 & -\tau & 0\end{pmatrix}
\begin{pmatrix}\mathbf{T}\\\mathbf{N}\\\mathbf{B}\end{pmatrix}
$$

**定理（曲线论基本定理）** 给定连续函数 $\kappa(s) > 0$ 与 $\tau(s)$，存在唯一（差一个刚体运动）以之为曲率挠率的曲线。
——**$(\kappa, \tau)$ 是曲线的全部内在信息**（"自然方程"）；证明即对 Frenet 方程组用 ODE 存在唯一性定理（ode-01 的定理在几何里收租）。分类哲学的又一实例：找全不变量 ⇒ 完全分类（与高代的标准形、拓扑的指纹同一战略）。

## 3. 一般参数的实算公式（考试主力）

$$
\kappa = \frac{|\mathbf{r}'\times\mathbf{r}''|}{|\mathbf{r}'|^3}, \qquad
\tau = \frac{(\mathbf{r}',\ \mathbf{r}'',\ \mathbf{r}''')}{|\mathbf{r}'\times\mathbf{r}''|^2}
$$

（分子分别是外积模与混合积——解几 I 的三件套在此就业；平面曲线 $y = f(x)$ 特例：$\kappa = \frac{|f''|}{(1 + f'^2)^{3/2}}$——数分 II 见过的公式认祖归宗。）

**曲率的两个具象**：密切圆半径 $R = 1/\kappa$（最贴曲线的圆——"弯道半径"，公路与铁路设计的直接参数：缓和曲线就是让 $\kappa$ 连续变化避免方向盘突跳）；单摆线/悬链线等名曲线各有标志性 $\kappa(s)$。

🔗 **衔接**：曲率是"二阶几何量"（一阶给方向、二阶给弯曲——与 Taylor/Hessian 的层级一致，数分 II/V）；样条曲线（数值 III）的 $C^2$ 拼接条件正是"曲率连续"；机器人轨迹规划、自动驾驶的路径平滑都在优化 $\kappa$ 的连续性与上界。

## 4. 典型例题

**例 1（圆柱螺旋线全套，本章的果蝇）** $\mathbf{r} = (a\cos t,\ a\sin t,\ bt)$：$|\mathbf{r}'| = \sqrt{a^2 + b^2}$（匀速——弧长参数只差常数缩放）；套公式得

$$
\kappa = \frac{a}{a^2 + b^2}, \qquad \tau = \frac{b}{a^2 + b^2}
$$

**曲率挠率皆常数**——基本定理反推：常 $(\kappa, \tau)$ 的曲线只有螺旋线（含退化：$b = 0$ 圆、$a = 0$ 直线）。DNA 双螺旋、弹簧、螺纹的数学身份证。

**例 2（判平面曲线）** $\mathbf{r} = (t, t^2, t^3)$ 是平面曲线吗？$\tau$ 的分子 $(\mathbf{r}', \mathbf{r}'', \mathbf{r}''') = \det\begin{pmatrix}1 & 2t & 3t^2\\ 0 & 2 & 6t \\ 0 & 0 & 6\end{pmatrix} = 12 \neq 0$——$\tau \neq 0$，真三维扭曲（"扭曲三次曲线"）。**判平面性 = 验混合积**，一步到位。

**例 3（密切圆）** 抛物线 $y = x^2$ 顶点处：$\kappa = \frac{2}{(1+0)^{3/2}} = 2$ ⇒ 密切圆半径 $\frac12$，圆心 $(0, \frac12)$——顶点附近抛物线与该圆二阶吻合（Taylor 到二阶相同的几何说法）。$\blacksquare$

---

*下一页：从一维到二维——曲面论：两个基本形式、高斯曲率，以及那条改变几何学命运的"绝妙定理"。*
