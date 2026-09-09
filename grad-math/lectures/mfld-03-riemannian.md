# 流形几何 III · 黎曼度量、联络与测地线

> **对标**：Lee *Introduction to Riemannian Manifolds*（第2版）的度量、联络、测地线章节。**先修回链**：[流形与切空间](mfld-01-manifolds.html)、[微分形式](mfld-02-forms-stokes.html)。本页采用光滑、Hausdorff、第二可数、无边界的流形。
> 光滑结构只能谈"可微"，谈不了长度与角度——**黎曼度量**补上这块：每点切空间配一个内积、随点光滑变化。随之而来的核心难题：弯曲空间里**不同点的切向量怎么比较**（求导需要比较！）——答案是**联络**；由它定义"不转弯的曲线"——**测地线**。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="mfld-riemannian-learning-title">

<h2 id="mfld-riemannian-learning-title">学习层：同一条测地线，三本账不能混</h2>

### 1. 具体开场：平面原点是坏点，还是坏坐标？

取平面中的直线

$$
\gamma(t)=(-1+t,0),\qquad 0\le t\le2.
$$

在 Cartesian 坐标 \((x,y)\) 中，它显然穿过原点，\(g=dx^2+dy^2\)，\(\Gamma^k_{ij}=0\)，所以是仿射测地线。若改用极坐标

$$
x=r\cos\theta,\qquad y=r\sin\theta,\qquad
g=dr^2+r^2d\theta^2,
$$

则 \(\gamma(1)\) 的 \(r=0\)，\(\theta\) 没有唯一值，\(g_{\theta\theta}=0\)，\(1/r\) 型 Christoffel 也失效。先预测：这是否意味着平面流形在原点破裂？答案应是**否**；这是坐标图的边界，换回 Cartesian 图，点、长度和测地线都继续存在。

再把视线移到单位球：同一条大圆可以走一小段、走过半圈，或恰好走到对跖点。三种路径都满足仿射测地线方程，但全局距离结论不同。实验先收下四项预测，再揭示 \(g\)、\(\Gamma\)、能量、残差和最短性账本。

### 2. 形式桥：从度量到 Christoffel，再到 ODE

在坐标 \(x^i\) 中，黎曼度量是正定矩阵场 \(g_{ij}\)，长度、动能密度与固定时间区间上的能量泛函分别为

$$
L(\gamma)=\int\sqrt{g_{ij}(\gamma)\dot\gamma^i\dot\gamma^j}\,dt,\qquad
E(t)=\frac12g_{ij}(\gamma)\dot\gamma^i\dot\gamma^j,\qquad\mathcal E(\gamma)=\int_a^b E(t)\,dt.
$$

Levi-Civita 联络的坐标系数为

$$
\Gamma^k_{ij}=\frac12g^{k\ell}
(\partial_i g_{j\ell}+\partial_j g_{i\ell}-\partial_\ell g_{ij}),
$$

仿射参数下的测地线方程是

$$
\ddot\gamma^k+\Gamma^k_{ij}(\gamma)\dot\gamma^i\dot\gamma^j=0.
$$

沿这条方程，\(\nabla_{\dot\gamma}\dot\gamma=0\) 给出 \(E\) 恒定；但“方程的临界点”与“给定端点的全局最短路”是两个命题。后者还要看 cut locus、共轭点和路径长度。

**平面两张图。** Cartesian 图的 \(g=I,\Gamma=0\)；极坐标图的非零项是

$$
g_{ij}=\begin{pmatrix}1&0\\0&r^2\end{pmatrix},\qquad
\Gamma^r_{\theta\theta}=-r,\qquad
\Gamma^\theta_{r\theta}=\Gamma^\theta_{\theta r}=\frac1r.
$$

方程写成

$$
\ddot r-r\dot\theta^2=0,\qquad
\ddot\theta+\frac2r\dot r\dot\theta=0.
$$

这些 \(1/r\) 并不是额外的力；它们记录基向量随坐标移动的方式。

**球面两张图。** 用余纬 \(\theta\) 和经度 \(\varphi\)：

$$
g=d\theta^2+\sin^2\theta\,d\varphi^2,\qquad
\Gamma^\theta_{\varphi\varphi}=-\sin\theta\cos\theta,\qquad
\Gamma^\varphi_{\theta\varphi}=\Gamma^\varphi_{\varphi\theta}=\cot\theta.
$$

立体投影坐标 \((u,v)\)（排除北极）由

$$
(X,Y,Z)=\frac{(2u,2v,u^2+v^2-1)}{1+u^2+v^2},\qquad
g=\frac{4(du^2+dv^2)}{(1+u^2+v^2)^2}
$$

给出逆映射；正映射是 \((u,v)=(X/(1-Z),Y/(1-Z))\)。因此 \((u,v)=(0,0)\) 对应南极，\((u,v)=(2,0)\) 对应 \((4/5,0,3/5)\)，再正投影得到 \(2\)，可直接核对正逆一致。转换改变坐标分量和 Christoffel 表达式，却不改变嵌入点、内积或几何能量；北极没有有限的这张图坐标，不是球面出现了洞。

### 3. 误区与模型边界

| 误区 | 需要保留的边界 |
|---|---|
| “\(\Gamma\ne0\) 就是有曲率。” | Christoffel 不是张量；平面极坐标中 \(\Gamma\ne0\) 而曲率仍为 0。要用 Riemann 张量判断曲率。 |
| “测地线就是全局最短路。” | 测地线是局部临界曲线；球面的大圆优弧满足方程但不是端点间最短。 |
| “坐标图在极点失效，所以流形有奇点。” | 坐标奇异可由另一张图消除；流形奇异是没有任何兼容正则图覆盖，二者不能混称。 |
| “只看 \(L\) 就能得到数值方程。” | 长度不依赖保向重参数；能量泛函的驻点选出常速参数，非线性重参数通常引入沿切向加速度。 |
| “对跖点的最短测地线唯一。” | 球面一对对跖点有无穷多条长度 \(\pi\) 的最短大圆弧；唯一性需排除 cut locus。 |

### 4. 测地线—度量互动实验

实验提供五个确定性预设：Cartesian 平面直线、穿过极点的极坐标平面直线、球面短大圆弧、长大圆弧和对跖点。每次显示都把四件事并排记账：

1. \(g_{ij}\) 与非零 \(\Gamma^k_{ij}\)；
2. 仿射方程残差 \(\|\ddot\gamma^k+\Gamma^k_{ij}\dot\gamma^i\dot\gamma^j\|\)；
3. \(E\)、测地线长度和端点的全局距离；
4. 当前坐标图与另一张图之间的转换状态。

实验使用大圆/直线的解析路径；坐标速度与加速度由坐标映射的链式法则求得，再代入方程。不是先用待验证方程定义加速度再相消。数值账本的残差是坐标分量的欧氏范数，不是换图不变量，也不是严格误差界；过近极点会遇到浮点精度限制。实验的“仿射通过”不是预设标签：只有当前坐标图正则、坐标方程残差和嵌入中的解析测地线残差都在容差内才报告通过；坐标奇异处报告 **unavailable**，因为该坐标不能提供方程判定，而不是把流形误判为不满足测地线方程。

<div class="learning-lab" data-learning-lab="geodesic-metric" markdown="1">

**JavaScript 失效时的静态后备账本：**默认取单位球短大圆弧，球坐标 \(\theta=\pi/3,\varphi=-0.4\)，初速度 \((\dot\theta,\dot\varphi)=(0.55,0.9)\)，仿射时长 \(T=2\)。令 \(v^2=\dot\theta^2+\sin^2\theta\,\dot\varphi^2\)。

| 账本 | 静态读法 | 结论 |
|---|---|---|
| 度量张量 | \(g=\operatorname{diag}(1,\sin^2\theta)\)，初点 \(\sin^2\theta=3/4\) | 正定；极点之外坐标正则 |
| Christoffel | \(\Gamma^\theta_{\varphi\varphi}=-\sqrt3/4\)，\(\Gamma^\varphi_{\theta\varphi}=1/\sqrt3\) | 不是“外力”，是球坐标基的变化 |
| 能量 | \(E=\frac12(0.55^2+\frac34\,0.9^2)\approx0.455\) | 沿仿射测地线保持常数 |
| 长度 | \(L=2\sqrt{2E}\approx1.908\) | 小于 \(\pi\) |
| 全局距离 | \(d(p,q)=\arccos(p\cdot q)=L\)（此预设） | 短大圆弧是全局最短 |
| 方程残差 | \(\|\ddot\gamma+\Gamma(\dot\gamma,\dot\gamma)\|\approx0\) | 仿射测地线命中 |
| 图转换 | \((\theta,\varphi)\leftrightarrow(u,v)\) | 坐标变，嵌入点与能量不变 |

边界对照：把时长改为 \(4\) 得到同一大圆的长段，仍是仿射测地线但不再全局最短；把时长改为 \(\pi\) 且初速沿赤道取 1，到达对跖点，最短路长度为 \(\pi\) 但不唯一。切换到平面极坐标预设，\(t=1\) 的 \(r=0\) 行应显示“仿射判定 unavailable；坐标奇异；流形正则”，而不是 NaN 伪装成曲率。

</div>

### 5. 迁移问题

给出下列三份日志，分别判断失败发生在坐标、参数还是全局最短性上，并写出计算。

1. 北极立体投影坐标 \((u,v)=(2,0)\)，速度分量 \((1,0)\)：嵌入点与动能密度各是多少？
2. 平面路径 \(\eta(\tau)=(\tau^2,0)\)，\(1\le\tau\le2\)：轨迹是直线段，为什么仿射方程仍不成立？
3. 单位球沿赤道走长度 \(3\pi/2\)：路径长度与端点距离各是多少？

<details class="answer" markdown="1"><summary>展开计算与接口判断</summary>

1. 点为 \((4/5,0,3/5)\)，\(g=4I/25\)，所以 \(E=2/25\)。若另一图返回 \(Z=-3/5\)，是换图实现错误，不能解释成另一种能量。
2. \(\eta''=(2,0)\ne0\)，\(E(\tau)=2\tau^2\) 不恒定。它仍描出两端间最短线段，但 \(\tau\) 非仿射参数；改用 \(t=\tau^2\) 后方程成立。
3. \(L=3\pi/2\)，\(d=\arccos(\cos(3\pi/2))=\pi/2\)。这是仿射测地线，却不是全局最短。算法应分开报告坐标可用性、方程残差与距离，不能合为一个“成功”标签。

</details>

</section>

## 1. 黎曼度量

**定义** 黎曼度量 $g$：每点 $p$ 一个内积 $g_p: T_pM\times T_pM \to \mathbb{R}$，坐标下对称正定矩阵场 $g_{ij}(x)$（高代 VI 的正定性逐点站岗）。曲线长度 $L(\gamma) = \int\sqrt{g(\dot\gamma,\dot\gamma)}\,dt$；在每个连通分支内，由长度诱导有限距离；不同分支之间若定义路径长度下确界，则距离为无穷大，不能无条件称整个不连通空间为通常的有限值度量空间。

**例**：$\mathbb{R}^n$ 平直度量 $g_{ij} = \delta_{ij}$；曲面的第一基本形式（微分几何 II 的 $E, F, G$ 正是 $2\times2$ 的 $g_{ij}$——那门课原来一直在做二维黎曼几何）；**双曲平面** $g = \frac{dx^2 + dy^2}{y^2}$（上半平面——常负曲率世界，非欧几何的正式住所）；**Fisher 信息** $g_{ij}=\mathbb E[\partial_i\log p\,\partial_j\log p]$ 在满足微分/积分交换等正则性且矩阵有限、正定的可辨识参数化中给出黎曼度量。冗余参数或奇异模型中它可能仅半正定。例如 $p=N(a+b,1)$ 的信息阵是全 $1$ 的 $2\times2$ 矩阵，秩为 $1$；不能直接取逆叫作度量。

**存在性**：任何流形都有黎曼度量（单位分解拼局部内积【一行】）——度量不稀缺，**特定度量的性质**才是学问。

## 2. 联络：比较不同点的切向量

**困难**：$T_pM$ 与 $T_qM$ 是不同的线性空间——"$X(q) - X(p)$"没有意义 ⇒ 向量场无法直接求导。**仿射联络** $\nabla$：公理化"方向导数"（对方向线性、对被导向量场 Leibniz）；坐标下由 **Christoffel 符号** $\Gamma^k_{ij}$ 编码（$\nabla_{\partial_i}\partial_j = \Gamma^k_{ij}\partial_k$——"基向量自己怎么漂移"的记录）。

**定理（黎曼几何基本定理）** 每个黎曼流形上存在**唯一**的联络（Levi-Civita 联络）同时满足：① 与度量相容（$\nabla g = 0$：平移保内积）；② 无挠（坐标基中 $\Gamma^k_{ij}=\Gamma^k_{ji}$）。且

$$
\Gamma^k_{ij} = \frac12 g^{kl}\big(\partial_i g_{jl} + \partial_j g_{il} - \partial_l g_{ij}\big)
$$

**【证明】** Koszul 公式：把相容性写三遍（轮换指标）、加加减减解出 $g(\nabla_XY, Z)$ 的显式表达——坐标基的 Lie 括号为零，于是

$$
\partial_i g_{j\ell}=g(\nabla_i\partial_j,\partial_\ell)+g(\partial_j,\nabla_i\partial_\ell).
$$

把 $(i,j,\ell)$、$(j,i,\ell)$ 两式相加，再减去 $(\ell,i,j)$ 式，无挠使交叉项抵消，得 $2g_{k\ell}\Gamma^k_{ij}=\partial_i g_{j\ell}+\partial_j g_{i\ell}-\partial_\ell g_{ij}$。乘逆度量得到上述系数；定义出的联络满足两条件，且换图一致。$\blacksquare$
**读法**：**度量白送一个求导法则**——几何（长度）决定运动学（平移）；$\Gamma$ 不是张量（换坐标带二阶项）——平面曲线坐标的非零项可表现为惯性项；一般曲率空间的联络不能整体消去，不能一概称为假力。

**平行移动**：沿曲线解 $\nabla_{\dot\gamma}X = 0$（线性 ODE——存在唯一由 ode 理论白送）——"向量不转动地搬运"；**和乐（holonomy）**：绕闭路平移回来向量可以转了角度——足够小的可缩闭路上的偏差由曲率控制；一般非可缩闭路还可能探测全局拓扑，即使联络平坦也不必处处平凡。

## 3. 测地线

<div style="overflow-x:auto;position:relative" tabindex="0" role="region" aria-label="大圆长短弧机制图，可横向滚动">
<figure class="plot" markdown="1" style="min-width:950px">
![球面测地线是大圆弧](assets/img/mfld-03-geodesic.svg)
<figcaption><span class="fig-id">图 3.1</span>同一单位大圆上，蓝色短弧长 π/2；红色长弧长 3π/2。两者均可用仿射参数走过，但仅短弧实现这对端点的距离。</figcaption>
</figure>
</div>

**定义** $\nabla_{\dot\gamma}\dot\gamma = 0$——"速度向量沿自身平行移动"：不转弯的曲线。坐标方程：

$$
\ddot\gamma^k + \Gamma^k_{ij}\,\dot\gamma^i\dot\gamma^j = 0
$$

（二阶非线性 ODE——存在唯一性（ode-01/sc 线的 Picard）给：对每个初值 $(p,v)$，存在唯一测地线定义在包含 $0$ 的**最大开区间**上；它未必能延伸到所有时间。）

**变分身份与参数。** 固定端点及时间区间，对 $\mathcal E=\frac12\int g_{ij}\dot x^i\dot x^jdt$ 写 Euler–Lagrange 方程：

$$
\frac{d}{dt}(g_{kj}\dot x^j)-\frac12\partial_k g_{ij}\dot x^i\dot x^j=0.
$$

展开首项，再乘 $g^{\ell k}$，恰得到仿射测地线方程。度量相容给出 $dE/dt=g(\nabla_{\dot\gamma}\dot\gamma,\dot\gamma)=0$。长度泛函则对保向重参数不变；对非零速度的驻点，选常速参数才得到同一仿射方程。若 $\eta(\tau)=\gamma(f(\tau))$，则 $\nabla_{\eta'}\eta'=f''\dot\gamma$，一般不为零。每条测地线的足够短子段局部最短，但长段未必全局最短。

**指数映射** $\exp_p(v)=\gamma_{p,v}(1)$ 只在那些能把测地线至少延伸到时间 $1$ 的向量上定义；其定义域是 $T_pM$ 中含 $0$ 的开集，并在 $0$ 附近给出局部微分同胚（法坐标：$g_{ij}(p)=\delta_{ij}$、$\Gamma(p)=0$——**每点附近都可以“假装平直”到一阶**）。

**Hopf–Rinow 定理【引用】**：对**连通**黎曼流形，度量空间 $(M,d_g)$ 完备，当且仅当所有测地线可延伸到整个 $\mathbb R$，也等价于每个 $p$ 的 $\exp_p$ 定义在整个 $T_pM$；这些条件还推出任意两点间存在最短测地线。最后一条单独拿出来并不反推完备：开单位球 $B(0,1)\subset\mathbb R^n$ 配欧氏度量时，任意两点仍由球内线段最短连接，但从原点沿单位速度射线只活到 $t=1$，$\exp_0(v)$ 在 $\|v\|\ge1$ 的单位时间处无定义。这个反例把“局部 ODE 存在”“两点可连接”和“全局测地完备”分开。

## 4. 练习与要点

**例 1（球面测地线亲算）** $S^2$ 球坐标度量 $ds^2 = d\theta^2 + \sin^2\theta\,d\varphi^2$：算 $\Gamma$（非零者 $\Gamma^\theta_{\varphi\varphi} = -\sin\theta\cos\theta$、$\Gamma^\varphi_{\theta\varphi} = \cot\theta$），验证赤道 $\theta = \frac\pi2$ 满足测地线方程——**大圆 = 球面的直线**（航线为何走大圆的定理版）。

**例 2（双曲平面的测地线）** 上半平面度量下取 $x=x_0,y=e^t$，此时 $\Gamma^y_{yy}=-1/y$，故 $\ddot y-\dot y^2/y=0$，且速度为 $1$；直接用 $y=t$ 描述同一竖线则不是仿射参数——非欧几何的"直线"是竖线与半圆：**平行公理在此失效的实物模型**（过线外一点无穷多条"平行线"）。

**例 3（🔗 自然梯度）** 统计模型族上最速下降的正确方向是 $-I(\theta)^{-1}\nabla\ell$（Fisher 度量下的梯度）而非 $-\nabla\ell$：**坐标不变的梯度向量场**——普通梯度依赖坐标（换参数化方向就变），黎曼梯度只依赖几何。有限步坐标 Euler 更新一般不在非线性换坐标下精确不变；使用指数映射或合适的 retraction 还需另外定义离散算法。$\blacksquare$

---

*收官页：曲率——黎曼张量的定义与含义、截面曲率、以及 Gauss–Bonnet 的高维眺望。*


**原始资料**：[Lee 第2版作者页面及勘误](https://sites.math.washington.edu/~lee/Books/RM/)，对应度量、Levi-Civita 联络、测地线与完备性章节；本页的投影、变分和三份日志均可由给出的式子复算。
