# 复变 I · 解析函数与 Cauchy–Riemann 方程

> 复变函数论只研究一类函数——**解析函数**（复可导），但这一个条件的后果好得不像话：可导一次就无穷可导、局部就是幂级数、由边界值定内部值……本页先讲清"复可导为什么这么强"：答案藏在 Cauchy–Riemann 方程里。


<figure class="plot" markdown="1">
![共形映射：z\mapsto z^2 或 e^z 把方格网变形、但保持角度不变（可用 matplotlib 画网格变换）。](assets/img/complex-01-conformal.svg)
<figcaption><span class="fig-id">图 complex-01.1</span>共形映射：\(z\mapsto z^2\) 或 \(e^z\) 把方格网变形、但保持角度不变（可用 matplotlib 画网格变换）。</figcaption>
</figure>

## 1. 复可导：一个苛刻得多的条件

**定义** $f: \mathbb{C} \to \mathbb{C}$ 在 $z_0$ 可导：$f'(z_0) = \lim_{\Delta z \to 0}\frac{f(z_0 + \Delta z) - f(z_0)}{\Delta z}$。形式与实函数一样，**杀伤力在极限过程**：$\Delta z$ 可以沿复平面**任何方向**趋零，所有方向必须给出同一个极限——二维的自由度全被锁死（对比数分 V：多元实函数各偏导存在远不足以可微；复可导比"可微"还强得多）。在区域内处处可导称**解析（全纯）**。

**定理（Cauchy–Riemann 方程）** $f = u(x,y) + iv(x,y)$ 在一点可导 $\iff$ $u, v$ 可微且

$$
\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}, \qquad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}
$$

*推导（两行，必会）*：沿实轴 $\Delta z = \Delta x$ 求极限得 $f' = u_x + iv_x$；沿虚轴 $\Delta z = i\Delta y$ 得 $f' = v_y - iu_y$；两者相等，实虚部各自对齐即 C–R。$\blacksquare$

**几何读法**：C–R ⟺ Jacobi 矩阵形如 $\begin{pmatrix} a & -b \\ b & a\end{pmatrix}$ = 旋转 × 伸缩——解析映射在导数非零处**保角**（保持曲线夹角，共形映射的出身；这类"旋转伸缩"矩阵正是复数乘法的矩阵表示，高代呼应）。

**名反例**：$f(z) = \bar z$（处处不可导——C–R 给 $1 = -1$）；$|z|^2$ 只在原点可导。**含 $\bar z$ 的表达式基本无缘解析**——解析函数是"纯 $z$ 的函数"。

## 2. 调和函数：解析的实部与虚部

解析函数的 $u, v$ 都满足 **Laplace 方程** $u_{xx} + u_{yy} = 0$（对 C–R 交叉求导即得）——称**调和函数**。反之，单连通域上任一调和 $u$ 都可配出**共轭调和** $v$ 使 $u + iv$ 解析（用 C–R 积分出 $v$，例 2 演示）。

🔗 这是复变与物理/PDE 的接口：平面静电场、稳态温度场、理想流体的势都调和——解析函数论 = 平面位势理论的语言（PDE 页 Laplace 方程再会）。

## 3. 初等函数：熟脸的复身份

**指数** $e^z = e^x(\cos y + i\sin y)$（Euler 公式为定义之本）：处处解析，$(e^z)' = e^z$，但**以 $2\pi i$ 为周期**——实函数没有的新性格，也是对数多值的根源。

**三角** $\cos z = \frac{e^{iz} + e^{-iz}}{2}$：复平面上 $|\cos z|$ **无界**（$\cos(iy) = \cosh y \to \infty$）——"有界性"是实轴的错觉。

**对数（多值性的大本营）**：$\mathrm{Ln}\, z = \ln|z| + i(\arg z + 2k\pi)$——无穷多值，相邻枝差 $2\pi i$。取主辐角 $\arg z \in (-\pi, \pi]$ 得**主值** $\ln z$，在割破负实轴的平面上解析。**幂** $z^a = e^{a\,\mathrm{Ln}z}$ 一般多值（$i^i = e^{-\pi/2 - 2k\pi}$——全是实数，复变第一惊奇）。

多值处理的纪律：算之前先选定单值分支（割线 + 主值），跨越割线必换枝——留数计算实积分时（复变 III）这是主要坑源。

## 4. 典型例题

**例 1（C–R 判可导）** $f(z) = x^2 + iy^2$：C–R 要求 $2x = 2y$ 且 $0 = 0$——仅在直线 $y = x$ 上可导，**无处解析**（解析需要邻域）。"可导点集"与"解析区域"的区别一题看清。

**例 2（共轭调和全流程）** $u = x^2 - y^2 + x$，求 $v$ 使 $f = u + iv$ 解析。
*解*：$v_y = u_x = 2x + 1 \Rightarrow v = 2xy + y + \varphi(x)$；再 $v_x = 2y + \varphi' = -u_y = 2y \Rightarrow \varphi' = 0$。故 $v = 2xy + y + C$，且 $f = z^2 + z + iC$（拼回 $z$ 的表达式验明正身）。

**例 3（多值实算）** 解方程 $e^z = -1$：$z = \mathrm{Ln}(-1) = i(\pi + 2k\pi)$——实数世界"无解"的方程在复平面有一列解；$e^{i\pi} = -1$ 是 $k = 0$ 枝。$\blacksquare$

---

*下一页：复积分——Cauchy 两大定理把"解析"的全部魔力兑现：无穷可导、Liouville、代数基本定理，一页收割。*
