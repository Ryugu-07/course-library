# 统计物理 IV · 动力学与输运：从碰撞到扩散

> **对标**：Reif《统计物理》§14–15 / Cercignani *The Boltzmann Equation* 入门 ｜ **前置**：sm-01（热力学）、sm-02（系综）、sm-03（量子统计）、微积分与概率
> 热力学只告诉我们平衡态的状态方程；真实气体怎样从一个不均匀状态走向另一个状态？答案藏在速度分布、碰撞和平均自由程中。动力学输运把分子层面的随机飞行接到 Fick 扩散、Newton 黏性和 Fourier 热导，同时清楚标出连续介质近似何时会失效。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="kinetic-transport-learning-title">

## 学习层：一团气体怎样“知道”哪里更稀？

<h3 id="kinetic-transport-learning-title">1. 具体谜题：香味传播是分子撞出来的吗？</h3>

把一小段氮气想成许多不停飞行、碰撞和换向的分子。局部数密度有梯度时，左右飞来的分子平均携带着不同的浓度，于是穿过一个小面元的净通量不再为零。关键问题是：碰撞越频繁，分子走得越短；温度越高，分子走得越快。这两种效果怎样同时进入宏观系数？

实验台的基线是氮气近似：$m=4.65\times10^{-26}\ \mathrm{kg}$，$T=300\ \mathrm K$，数密度约 $2.5\times10^{25}\ \mathrm{m^{-3}}$，碰撞截面
$\sigma=4.3\times10^{-19}\ \mathrm{m^2}$，宏观长度 $L=1.00\ \mathrm{mm}$。先预测：

1. 在 $T,\sigma,L$ 固定时把 $n$ 加倍，平均自由程 $\lambda$ 会怎样？
2. 固定 $n,\sigma$ 提高温度，平均速率和估计的扩散系数 $D$ 会怎样？
3. 若 $\mathrm{Kn}=\lambda/L$ 很小，局部平衡和连续介质输运是否更可信？

不要把“随机”当作“没有方程”。下面的确定性计算是大量分子平均后的期望结构；单个分子的路径仍然需要概率分布描述。

<h3>2. 从 Boltzmann 方程到三个可测尺度</h3>

用 $f(\mathbf x,\mathbf v,t)$ 表示相空间分布，使
$f\,d^3x\,d^3v$ 给出一小块相空间中的粒子数。稀薄气体的动力学方程写成

$$
\frac{\partial f}{\partial t}
+\mathbf v\cdot\nabla_{\mathbf x}f
+\mathbf a\cdot\nabla_{\mathbf v}f
=C[f].
$$

碰撞算子不随意创造或消灭粒子、总动量和总能量，因此

$$
\int C[f]\begin{pmatrix}1\\\mathbf v\\v^2\end{pmatrix}d^3v
=\mathbf 0.
$$

对硬球数量级模型，有效扫掠体积率约为
$\sigma\langle v_{\rm rel}\rangle\simeq\sqrt2\,\sigma\bar v$；再乘数密度 $n$ 才得到碰撞率
$\nu_{\rm coll}\simeq\sqrt2\,n\sigma\bar v$，所以

$$
\lambda=\frac{1}{\sqrt2\,n\sigma},\qquad
\tau=\frac{\lambda}{\bar v}.
$$

Maxwell 速率分布给出

$$
\bar v=\sqrt{\frac{8k_{\mathrm B}T}{\pi m}},
\qquad
v_{\mathrm{th}}=\sqrt{\frac{2k_{\mathrm B}T}{m}}.
$$

平均自由程是碰撞几何尺度，$\bar v$ 是热运动速度尺度；两者相乘再除以三，得到三维随机游走的扩散数量级

$$
D\approx\frac13\lambda\bar v.
$$

<h3>3. 动手实验：把微观刻度与宏观长度放在一张图上</h3>

先完成三个预测，再打开实验台。调节密度、温度、截面、宏观长度和浓度梯度；左图显示归一化 Maxwell 速率分布以及平均速率，右图把平均自由程与 $L$ 对齐。结果区同时给出 $D$、黏度估计 $\eta$、Knudsen 数和 Fick 通量，便于逐项检查缩放。

<div class="learning-lab" data-learning-lab="physics-kinetic-transport" markdown="1">

**无 JavaScript 时的静态读法：**实验台的默认滑块取
$\log_{10}(n/10^{25}\ \mathrm{m^{-3}})=0.398$，即
$n=2.500\times10^{25}\ \mathrm{m^{-3}}$；$T=300\ \mathrm K$，
$\sigma=4.30\times10^{-19}\ \mathrm{m^2}$，$L=1.00\ \mathrm{mm}$，
$\partial n/\partial x=0.50\times10^{27}\ \mathrm{m^{-4}}$。使用氮分子质量
$m=4.65\times10^{-26}\ \mathrm{kg}$ 和
$\lambda=1/(\sqrt2 n\sigma)$、$\bar v=\sqrt{8k_{\mathrm B}T/(\pi m)}$。

| 量 | 默认数值 | 关系 |
|---|---:|---|
| 数密度 $n$ | $2.500\times10^{25}\ \mathrm{m^{-3}}$ | 对数滑块反解 |
| 平均自由程 $\lambda$ | $65.8\ \mathrm{nm}$ | $1/(\sqrt2 n\sigma)$ |
| 平均速率 $\bar v$ | $476.262\ \mathrm{m/s}$ | Maxwell 分布 |
| 碰撞时间 $\tau$ | $1.381\times10^{-10}\ \mathrm{s}$ | $\lambda/\bar v$ |
| 扩散系数 $D$ | $1.044\times10^{-5}\ \mathrm{m^2/s}$ | $\lambda\bar v/3$ |
| 黏度估计 $\eta$ | $1.214\times10^{-5}\ \mathrm{Pa\,s}$ | $\rho D,\ \rho=nm$ |
| Knudsen 数 $\mathrm{Kn}$ | $6.58\times10^{-5}$ | $\lambda/L$ |
| Fick 数通量 $J_n$ | $-5.22\times10^{21}\ \mathrm{m^{-2}s^{-1}}$ | $-D\,\partial n/\partial x$ |

默认状态属于连续介质近似较可靠的区域；这不表示单个分子没有自由飞行，而是说明 $L$ 内包含了很多碰撞长度。把密度降到真空预设，或者把 $L$ 缩到微米量级，$\mathrm{Kn}$ 会上升，局部梯度和边界碰撞必须显式处理。

<h3>4. 误区、反例与适用边界</h3>

- **扩散不是“分子从高处被推到低处”的额外力。**它来自速度分布与空间不均匀的组合；外力存在时，Boltzmann 方程还要保留 $\mathbf a\cdot\nabla_{\mathbf v}f$。
- **$\lambda$ 不是所有气体的常数。**它随 $n$ 和有效截面变化；截面可能依赖速度、温度和分子内部状态。
- **$D\approx\lambda\bar v/3$ 是数量级闭合。**精确输运系数需要碰撞积分、分子势和 Chapman–Enskog 展开；系数前的 $1/3$ 不是普适定理。
- **Kn 小不是充分的“无边界效应”保证。**壁面吸附、温度跳跃、粗糙度和化学反应会在很薄的 Knudsen 层里修改边界条件。
- **经典气体假设有边界。**低温高密度时，热 de Broglie 波长与粒子间距可比，需改用 Bose–Einstein 或 Fermi–Dirac 统计；这里的氮气基线远离量子简并。

<h3>5. 迁移题：改变密度和尺度的顺序</h3>

从默认状态出发，先把 $n$ 减半，再把宏观长度 $L$ 也减半。判断 $\lambda$、$\bar v$、$D$、$\eta$ 和 $\mathrm{Kn}$ 哪些改变，哪些不变。若只改变 $n$，$\lambda$ 与 $D$ 都约加倍，$\bar v$ 不变，且 $\eta=\rho D$ 在这个固定 $\sigma,T$ 的模型中近似不变，而 $\mathrm{Kn}$ 加倍；若之后 $L$ 也减半，$\mathrm{Kn}$ 将变成初始值的四倍，而不是回到原值。若想在 $n$ 减半后保持原来的 $\mathrm{Kn}$，应把 $L$ 加倍。请说明为什么“微观碰撞频率”和“宏观几何尺度”必须分开记账，而不能只报一个平均自由程。

</div>

</section>

## 1. 分布函数是动力学的状态变量

宏观场 $\rho(\mathbf x,t),\mathbf u(\mathbf x,t),T(\mathbf x,t)$ 只保留速度分布的低阶矩。微观层用单粒子分布 $f$，定义

$$
n(\mathbf x,t)=\int f\,d^3v,\qquad
n\mathbf u=\int\mathbf v f\,d^3v,
$$

能量密度则来自 $\int \frac12m v^2 f\,d^3v$。Boltzmann 方程

$$
\partial_t f+\mathbf v\cdot\nabla_{\mathbf x}f
+\mathbf a\cdot\nabla_{\mathbf v}f=C[f]
$$

左边是无碰撞相空间流，右边是局部碰撞改变速度的作用。对方程乘以 $1,\mathbf v,\frac12mv^2$ 并积分，碰撞项因微观碰撞守恒而消失，得到连续性、动量和能量方程的守恒骨架。宏观本构关系并不是这些守恒方程自动给出的，需要额外的局部平衡或输运展开。

## 2. 碰撞不变量与 H 定理

二体弹性碰撞把 $(\mathbf v,\mathbf v_1)$ 变为
$(\mathbf v',\mathbf v_1')$，满足

$$
\mathbf v+\mathbf v_1=\mathbf v'+\mathbf v_1',
\qquad
v^2+v_1^2=v'^2+v_1'^2.
$$

所以 $1,\mathbf v,v^2$ 是碰撞不变量。Boltzmann 的 H 函数

$$
H(t)=\int f\ln f\,d^3x\,d^3v
$$

在分子混沌假设与适当边界条件下满足 $dH/dt\le0$；熵 $S=-k_{\mathrm B}H$ 不减。等号对应 Maxwell 分布。这里的定理依赖稀薄气体的碰撞因子化假设，不能把它直接当作任意强相互作用多体系统的完整熵证明。

## 3. 平均自由程：从几何扫掠得到碰撞尺度

把一个分子视为有效直径对应截面 $\sigma$。若背景数密度为 $n$，在时间 $dt$ 内相对运动扫过体积约为 $\sigma v_{\mathrm rel}dt$，碰撞概率约为
$n\sigma v_{\mathrm rel}dt$。对 Maxwell 分布做相对速率平均，常用的硬球数量级把相对速度写成 $\sqrt2\bar v$，于是

$$
\lambda\simeq\frac{\bar v}{n\sigma\sqrt2\bar v}
=\frac1{\sqrt2 n\sigma}.
$$

该式告诉我们：加压或增密会缩短自由飞行；增大分子截面也会缩短它。温度对 $\lambda$ 的直接影响在固定硬球截面近似里很小，但真实分子势会使 $\sigma$ 随温度变。

## 4. 随机游走如何产生 Fick 定律

想象一维方向上，分子从距离 $x$ 左右约一个自由程的位置飞来。向右和向左的粒子各携带局部浓度，若 $n(x)$ 缓慢变化，Taylor 展开到一阶：

$$
n(x-\lambda)-n(x+\lambda)\approx-2\lambda\,\frac{\partial n}{\partial x}.
$$

再用每个方向约四分之一的分子通过单位面积的通量和平均速度，三维角平均给出数量级

$$
J_n=-D\nabla n,\qquad
D\approx\frac13\lambda\bar v.
$$

负号不是约定装饰：若右侧浓度随 $x$ 增大，$\partial_xn>0$，净通量指向负 $x$。把 Fick 定律代入连续性方程
$\partial_tn+\nabla\cdot J_n=0$，得到扩散方程

$$
\frac{\partial n}{\partial t}=D\nabla^2n
$$

（若 $D$ 空间恒定）。它是许多随机飞行的宏观极限，而不是说每条分子轨迹都沿浓度梯度平滑移动。

## 5. 黏性与热输运：同一自由程的不同矩

剪切流中，相邻层的平均分子速度不同。分子飞过约 $\lambda$ 后把出发层的动量带到新位置，产生剪切应力

$$
\tau_{xy}=-\eta\,\frac{\partial u_x}{\partial y},
\qquad
\eta\approx\frac13\rho\lambda\bar v=\rho D.
$$

温度梯度同样使分子把不同平均能量跨层搬运，得到 Fourier 形式
$\mathbf q=-\kappa_{\mathrm th}\nabla T$；热导率还要乘上单分子热容和速度尺度。三种系数并非同一个物理量，但都可以追溯到“飞多远、飞多快、每次携带什么守恒量”。

## 6. Knudsen 数与水动力极限

定义

$$
\mathrm{Kn}=\frac{\lambda}{L}.
$$

当 $\mathrm{Kn}\ll1$，分子在宏观变化尺度内碰撞很多次，局部 Maxwell 平衡与 Navier–Stokes/Fick/Fourier 闭合有机会成立；当 $\mathrm{Kn}\gtrsim0.1$，滑移、温度跳跃和非局部输运开始重要；当 $\mathrm{Kn}\gg1$，自由分子或弹道图像更合适。阈值不是硬墙，取决于几何、边界和要测的量。

Chapman–Enskog 方法把 $f$ 写成局部 Maxwell 分布加上按 Kn 展开的非平衡修正，碰撞不变量保证零阶方程给出 Euler 守恒律，一阶修正产生黏性与热导。更高 Kn 时，可直接求解 Boltzmann 方程、BGK 模型或 DSMC 粒子模拟；实验台的三项系数是决定“从哪一层模型开始”的快速诊断。

---

*输运理论的核心不是给每个宏观系数背一条经验式，而是辨认守恒量、碰撞尺度和几何尺度。下一页把这种“不可区分但必须交换”的思想带入量子力学：全同粒子会让交换路径发生干涉。*
