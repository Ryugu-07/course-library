# 凸优化 IV · 内点法与半定规划

> **对标**：Boyd & Vandenberghe §11 / Nesterov–Nemirovski（理论源头）｜ **前置**：cvx-01–03、本科优化 IV、数值 II
> 凸优化收官：**内点法**——让"多项式时间解凸问题"成为定理的算法（本科优化 IV 提过名字，本页给机理与复杂度），及其最重要的应用疆域 **SDP**（半定规划：变量是矩阵的 LP，组合优化与控制论的瑞士军刀）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：先预测中心路径，再核对两本账

### 1. 一个明确的二维 LP

实验只处理

$$
\min_{x\in\mathbb R^2} c^Tx=-x_1-2x_2
\quad\mathrm{s.t.}\quad -x_1\leq0,\ -x_2\leq0,\ x_1+x_2\leq1.
$$

它有严格可行初值 $x_0=(1/3,1/3)$，最优顶点是 $(0,1)$。令

$$
s=(x_1,x_2,1-x_1-x_2),\qquad
F_t(x)=t(-x_1-2x_2)-\log x_1-\log x_2-\log(1-x_1-x_2).
$$

脚本对每个 $t>0$ 用带 backtracking 的 Newton 解 $\nabla F_t=0$，并保留每次最终的原始点、slack、乘子和残差，而不是只画一条“看起来像路径”的曲线。

### 2. 预测门：t、gap 和边界

先猜：增大 $t$ 时路径会靠近哪个顶点？三条不等式给出的对偶间隙是 $3/t$ 还是 $1/t$？从边界初值、或从可行集只有 $(0,0)$ 的退化 LP 启动时，Newton 是否应该给出一个数值答案？提交前结果隐藏；揭晓后可切换 $t$ 和四种正常/失败场景。

### 3. 透明账本：可行性、对偶性与互补性

对 $Ax\leq b$ 写 $s=b-Ax$。中心路径的驻点给出

$$
\lambda_i(t)=\frac{1}{t s_i},\qquad
c+A^T\lambda=0,\qquad
s_i\lambda_i=\frac1t.
$$

因此在本例 $m=3$ 时，脚本应同时显示

$$
\text{gap}=c^Tx-(-b^T\lambda)=\sum_i s_i\lambda_i=\frac3t,
$$

以及 primal slack 全为正、$\lambda_i\geq0$、stationarity residual 和互补 residual。$t\to\infty$ 时 $x_1$ 与第三个 slack 靠近零，但每个有限 $t$ 仍在严格内部。

### 4. 反例与迁移边界

- **不可严格可行**：加入 $x_1+x_2\leq0$ 后，和 $x_1,x_2\geq0$ 合起来只剩边界点 $(0,0)$；log barrier 没有定义域，实验给 `no-strict-feasible-point` 失败状态。
- **非严格/病态初值**：$x_1=0$ 在对数项处发散；$x_1=10^{-10}$ 虽形式上严格，却触发病态初值状态，不把浮点噪声包装成成功。
- **理论边界**：这张二维图只审计一个 LP 的中心路径方程和 Newton 数值，不是一般多项式复杂度证明。自和谐障碍的复杂度定理需要单独的函数类与参数条件；SDP 的 $-\log\det X$、锥内点和秩退化也单列，不能从这个三角形 toy 直接推出。

<div class="learning-lab" data-learning-lab="interior-central-path" markdown="1">

**JavaScript 失效时的静态 fallback：**默认 $t=1$、$x_0=(1/3,1/3)$。Newton 得到

$$
x^*(1)\approx(0.311108,0.451606),\quad
s\approx(0.311108,0.451606,0.237286),
$$

并给出

$$
\lambda\approx(3.214320,2.214320,4.214320),\quad
\text{primal}=-1.214320,\quad
\text{dual}=-4.214320,
$$

这里对偶目标按本页的 $Ax\leq b$ 约定是 $-b^T\lambda=-\lambda_3\approx-4.214320$，所以

$$
\text{primal}-\text{dual}=3=\frac{3}{t},
$$

且三行 $s_i\lambda_i\approx1$、最小 slack $\approx0.237286$。在 $t=10$ 时 $x\approx(0.089617,0.863121)$、gap $\approx0.3$，路径明显靠近 $(0,1)$；边界初值、病态初值和无严格可行 LP 都应显示失败原因而非伪造路径。这个二维数值实验不承担一般复杂度或 SDP 结论。

</div>

</section>

## 1. 障碍法：把约束烧进目标

约束问题 $\min f_0(x)\ \text{s.t.}\ f_i(x) \leq 0$。**对数障碍**：

$$
\phi(x) = -\sum_i \ln(-f_i(x)), \qquad x^*(t) = \arg\min\ \big[t f_0(x) + \phi(x)\big]
$$

$\phi$ 在边界处爆炸——**迭代点被"电网"关在严格内部**（名字的来历）。$\{x^*(t): t > 0\}$ 称**中心路径**。

**定理（中心路径的次优性）【证明】** $f_0(x^*(t)) - p^* \leq \dfrac{m}{t}$（$m$ = 约束数）。
*证*：$x^*(t)$ 的驻点条件 $t\nabla f_0 + \sum\frac{-\nabla f_i}{-f_i} = 0$ 表明 $\lambda_i(t) = \frac{1}{-t f_i(x^*(t))}$ 是对偶可行点，其对偶间隙 $\sum\lambda_i(-f_i) = \frac mt$——弱对偶收尾。$\blacksquare$
**读法**：中心路径是"带精度表的高速公路"——走到 $t = m/\varepsilon$ 即达 $\varepsilon$-最优；障碍法 = 沿路开车（对递增的 $t$ 序列各做几步 Newton——本科优化 II 的 Newton 法在此就业：障碍问题光滑无约束，正是它的主场）。

## 2. 自和谐：复杂度理论的钥匙

为什么 Newton 步数可以**不依赖条件数**地被控制？Nesterov–Nemirovski 的答案：

**定义（自和谐函数）** $|f'''(x)| \leq 2f''(x)^{3/2}$（多维沿每条直线）——"三阶导被二阶导自己控制"：Hessian 变化的速度以 Hessian 自身为尺度（**仿射不变**的光滑性——比 Lipschitz 梯度更适配 Newton 的几何）。$-\ln$ 及对数障碍全家自和谐【验证一行：$(-\ln)''' = -2x^{-3}, (-\ln)'' = x^{-2}$，恰取等】。

**定理（路径跟踪复杂度）【引用】** 自和谐障碍（参数 $\nu$；线性/二次约束的 $\nu = m$）的路径跟踪法达 $\varepsilon$-最优需

$$
O\big(\sqrt{\nu}\,\ln\tfrac{\nu}{\varepsilon}\big)\ \text{次 Newton 迭代}
$$

——**多项式时间凸优化的正式定理**（每次 Newton = 解一个线性系统，数值 II/III 的全部技术在内层服役）。工程事实：实践中几十次迭代解百万变量 LP/SOCP——"内点法迭代数几乎不随规模涨"的口碑之源；与单纯形法（顶点行走、最坏指数、实践极快）形成算法双雄（本科优化 IV 的预告闭环）。

## 3. 半定规划（SDP）

**定义**：变量为对称矩阵，约束"半正定"：

$$
\min\ \langle C, X\rangle \quad \text{s.t.}\quad \langle A_i, X\rangle = b_i,\quad X \succeq 0
$$

（$\langle A, B\rangle = \mathrm{tr}(A^\top B)$；半正定锥是凸锥——高代 VI 的判据划出的集合成为可行域。）LP 是对角矩阵特例；对数障碍 $-\ln\det X$ 自和谐（$\nu = n$）⇒ 内点法通吃。**对偶**与 LP 平行（锥对偶：半正定锥自对偶【引用】）。

**三大名应用（每个都值得知道机理）**：

- **Goemans–Williamson MaxCut**【骨架】：把 $x_i \in \{\pm1\}$ 松弛为单位向量，以半正定 Gram 矩阵 $X \succeq 0$ 解 SDP，再用随机超平面取整——**期望 0.878 倍最优**（比值 = $\min\frac{\theta/\pi}{(1-\cos\theta)/2}$ 的一页微积分）：组合优化近似算法的巅峰之作，"松弛-取整"范式的旗舰；
- **控制论的 LMI**：Lyapunov 不等式 $A^\top P + PA \prec 0$（ode-03 稳定性的矩阵版）是 SDP 可行性问题——"找 Lyapunov 函数"从艺术变成求解器调用；
- **多项式优化 / SOS**：$p(x) \geq 0$ 的"平方和证书"是 SDP——非凸多项式问题的凸层级逼近（Lasserre 层级【引用】）。

## 4. 凸优化四页收官盘点

| 页 | 资产 | 一句话 |
|---|---|---|
| I | 共轭 $f^*$、Fenchel 对偶 | 对偶的原子操作；四门课对偶的统一语法 |
| II | 势函数法、加速下界、prox | $1/k^2$ 是一阶光速；不可微项交 prox |
| III | 增广拉格朗日、ADMM | 拆分 + 协调 = 大规模与分布式 |
| IV | 自和谐、内点法、SDP | 多项式时间的定理；矩阵变量的疆域 |

方法选型的现代地图：超大规模/低精度 → 一阶（II/III）；中规模/高精度/结构约束 → 内点（IV）；两界之间 → 混合（一阶热身 + 二阶精修）。

## 5. 练习与要点

**例 1（中心路径亲算）** $\min x\ \text{s.t.}\ x \geq 0$（一维 LP）：$x^*(t) = \arg\min[tx - \ln x] = \frac1t$——路径从内部滑向最优点 $0$，间隙恰 $\frac1t = \frac mt$ ✓（定理在最小例子上的显影）。

**例 2（LMI 上手）** 判定 $\dot x = Ax$，$A = \begin{pmatrix}-1 & 2\\ 0 & -3\end{pmatrix}$ 的稳定性：解 $A^\top P + PA = -I$（Lyapunov 方程，线性！）得 $P \succ 0$ ⇒ 稳定——ode-03 的特征值判据与 SDP 路线双验证。

**例 3（松弛-取整的体感）** 三角形图 MaxCut：SDP 最优 = 2.25（向量排成 120°），随机超平面期望切 $= 3\times\frac{120°}{180°}=2$，比值 $\frac{2}{2.25} \approx 0.889 > 0.878$ ✓——GW 算法在最小非平凡图上走一遍。$\blacksquare$

---

*下一门：数值线性代数——同样的矩阵问题，问"在浮点与有限步的现实里怎么算得又快又稳"。*
