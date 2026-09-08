# 统计物理 IV · 动力学与输运：从碰撞到扩散

> **对标**：Reif《统计物理》§14–15 / Cercignani *The Boltzmann Equation* 入门 ｜ **前置**：sm-01（热力学）、sm-02（系综）、sm-03（量子统计）、微积分与概率
> 热力学只告诉我们平衡态的状态方程；真实气体怎样从一个不均匀状态走向另一个状态？答案藏在速度分布、碰撞和平均自由程中。动力学输运把分子层面的随机飞行接到 Fick 扩散、Newton 黏性和 Fourier 热导，同时清楚标出连续介质近似何时会失效。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="kinetic-transport-learning-title">

## 学习层：没有额外推力，示踪粒子为什么仍有净通量？

<h3 id="kinetic-transport-learning-title">1. 具体谜题：香味传播是分子撞出来的吗？</h3>

在均匀氮气背景中给少量分子加上不改变质量和碰撞性质的理想标签。背景总数密度记 $n$，被标记粒子浓度记 $c$。即使背景整体静止，左右飞来的标记粒子数不同，也会形成相对背景的净通量。真实香味分子还需要不同质量与交叉碰撞截面，且空气对流经常重要，本实验只模拟这种示踪扩散。关键问题是：碰撞越频繁，分子走得越短；温度越高，分子走得越快。这两种效果怎样同时进入宏观系数？

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

这里外加加速度取与速度无关；一般情形要检查相空间散度。对单原子、等质量、二体弹性碰撞，碰撞算子守恒粒子数、总动量和总平动能，因此

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

先完成三个预测，再打开实验台。调节密度、温度、截面、宏观长度和浓度梯度；左图显示归一化 Maxwell 速率分布以及平均速率，右图用对数刻度显示 $\lambda/L$，避免把不可见的小自由程人为拉长。结果区同时给出 $D$、黏度估计 $\eta$、Knudsen 数和 Fick 通量，便于逐项检查缩放。

<div class="learning-lab" data-learning-lab="physics-kinetic-transport" markdown="1">

**无 JavaScript 时的静态读法：**实验台的默认滑块取
$\log_{10}(n/10^{25}\ \mathrm{m^{-3}})=0.398$，即
$n=2.500\times10^{25}\ \mathrm{m^{-3}}$；$T=300\ \mathrm K$，
$\sigma=4.30\times10^{-19}\ \mathrm{m^2}$，$L=1.00\ \mathrm{mm}$，
$\partial c/\partial x=0.50\times10^{27}\ \mathrm{m^{-4}}$。使用氮分子质量
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
| 示踪通量 $J_c$ | $-5.22\times10^{21}\ \mathrm{m^{-2}s^{-1}}$ | $-D\,\partial c/\partial x$ |

默认状态的几何 Kn 属于连续介质近似较可靠的区域；示踪 Fick 通量还需 $\lambda|\nabla c|\ll c$ 与浓度非负。实验没有输入局部 $c$，所以该通量只是给定梯度的线性响应估计，不能单靠 Kn 为它担保。这不表示单个分子没有自由飞行，而是说明 $L$ 内包含了很多碰撞长度。把密度降到稀薄微通道预设，或者把 $L$ 缩到微米量级，$\mathrm{Kn}$ 会上升，局部梯度和边界碰撞必须显式处理。

</div>

<h3>4. 误区、反例与适用边界</h3>

- **扩散不是“分子从高处被推到低处”的额外力。**它来自速度分布与空间不均匀的组合；外力存在时，Boltzmann 方程还要保留 $\mathbf a\cdot\nabla_{\mathbf v}f$。
- **$\lambda$ 不是所有气体的常数。**它随 $n$ 和有效截面变化；截面可能依赖速度、温度和分子内部状态。
- **$D\approx\lambda\bar v/3$ 是数量级闭合。**精确输运系数需要碰撞积分、分子势和 Chapman–Enskog 展开；系数前的 $1/3$ 不是普适定理。
- **Kn 小不是充分的“无边界效应”保证。**壁面吸附、温度跳跃、粗糙度和化学反应会在很薄的 Knudsen 层里修改边界条件。
- **经典气体假设有边界。**低温高密度时，热 de Broglie 波长与粒子间距可比，需改用 Bose–Einstein 或 Fermi–Dirac 统计；这里的氮气基线远离量子简并。

<h3>5. 迁移题：改变密度和尺度的顺序</h3>

1. 从默认状态出发，固定 $T,\sigma$，先把背景 $n$ 减半，再把 $L$ 减半，判断 $\lambda,\bar v,D,\eta,\mathrm{Kn}$ 的变化；若要保持 Kn，应怎样改变 $L$？
2. 只有纯气体总密度有梯度时，为什么不能直接把总数通量写成 $-D\nabla n$ 并忽略整体速度？
3. 若局部示踪浓度 $c=10^{24}\ \mathrm{m^{-3}}$、$|\nabla c|=5\times10^{26}\ \mathrm{m^{-4}}$、$\lambda=6.58\times10^{-8}\ \mathrm m$，一次自由程上的相对浓度变化是多少？若 $c$ 降低一百万倍，仅保持几何 Kn 小是否足够？

<details markdown="1" class="answer-key"><summary>核对迁移：两个密度与两个尺度</summary>

1. $\lambda,D$ 加倍，$\bar v$ 不变；$\rho$ 减半，因此本模型的 $\eta\approx\rho D$ 不变；Kn变成原值4倍。若想让 Kn不变，则在 $n$ 减半后将 $L$ 加倍。
2. 用 $\mathbf u=(\int\mathbf v f)/n$ 定义速度时，总数通量恒等于 $n\mathbf u$；总密度和压力梯度会与动量方程耦合，引起流动。标签组分的相对通量才是本页 Fick 量。
3. $\lambda|\nabla c|/c=3.29\times10^{-5}$；浓度降低一百万倍后为32.9，局部一阶浓度展开失败，即使同一个几何 Kn 没有改变。必须同时检查所关心场的变化尺度。

</details>

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

对数严格写作 $\ln(f/f_*)$，$f_*$ 是固定参考单位；粒子数守恒使此约定只改常数。在分子混沌假设与无熵通量的适当边界条件下满足 $dH/dt\le0$；熵 $S=-k_{\mathrm B}H$ 不减。对于非退化碰撞核，零碰撞熵产生要求速度分布在各位置为局部 Maxwell 形；空间输运仍可改变它，不能直接推出全局、静止的平衡态。这里的定理依赖稀薄气体的碰撞因子化假设，不能把它直接当作任意强相互作用多体系统的完整熵证明。

## 3. 平均自由程：从几何扫掠得到碰撞尺度

把一个分子视为有效直径对应截面 $\sigma$。若背景数密度为 $n$，在时间 $dt$ 内相对运动扫过体积约为 $\sigma v_{\mathrm rel}dt$，碰撞概率约为
$n\sigma v_{\mathrm rel}dt$。对 Maxwell 分布做相对速率平均，常用的硬球数量级把相对速度写成 $\sqrt2\bar v$，于是

$$
\lambda\simeq\frac{\bar v}{n\sigma\sqrt2\bar v}
=\frac1{\sqrt2 n\sigma}.
$$

该式告诉我们：加压或增密会缩短自由飞行；增大分子截面也会缩短它。温度对 $\lambda$ 的直接影响在固定硬球截面近似里很小，但真实分子势会使 $\sigma$ 随温度变。

## 4. 随机飞行如何产生示踪 Fick 定律

先分清被守恒的量。纯单组分气体若用质量平均速度 $\mathbf u$ 定义静止参考系，则
$\int(\mathbf v-\mathbf u)f\,d^3v=0$，其总粒子数通量就是 $n\mathbf u$。不能在同一个参考系又给它无条件添加 $-D\nabla n$。本页扩散的是标记浓度 $c$，未标记组分承担相反的相对通量。

为了看清 $1/3$ 从哪里来，另取一个明确的随机飞行简化模型：速率固定为 $v$，换向等待时间服从均值 $\tau$ 的指数分布，每次换向后方向独立且在球面均匀。球面对称性给 $\langle v_x^2\rangle=v^2/3$；到时间 $t$ 尚未换向的概率是 $e^{-t/\tau}$，而换向后的速度与初速度不相关。因此

$$
\langle v_x(t)v_x(0)\rangle=\frac{v^2}{3}e^{-t/\tau}.
$$

对位移 $X(t)-X(0)=\int_0^t v_x(s)ds$ 展开平方、利用平稳性，再除以 $2t$ 取长时极限，得到

$$
D=\lim_{t\to\infty}\frac{\operatorname{Var}X(t)}{2t}
 =\int_0^\infty\langle v_x(s)v_x(0)\rangle ds
 =\frac{v^2\tau}{3}=\frac{\lambda v}{3}.
$$

这个随机模型中等式精确；把固定速率 $v$ 替换为真实 Maxwell 平均速率 $\bar v$ 后，只是实验使用的数量级闭合。真实硬球输运需要速度相关碰撞积分，不能混用“一侧通量的四分之一”来声称严格推出同一个系数。

在均匀背景、弱而缓慢的示踪梯度、长于碰撞时间的局部近似下，

$$
\mathbf J_c=-D\nabla c,\qquad
\partial_tc+\nabla\cdot(c\mathbf u+\mathbf J_c)=0.
$$

$\mathbf u=0$ 且 $D$ 为常数时得到 $\partial_tc=D\nabla^2c$。负号表示正浓度梯度产生朝负方向的净通量；单条分子轨迹仍随机飞行。除了几何 Kn 小，还要有 $\lambda|\nabla c|/c\ll1$，才允许在一次飞行尺度内将浓度作局部展开。

## 5. 黏性与热输运：同一自由程的不同矩

剪切流中，相邻层的平均分子速度不同。分子飞过约 $\lambda$ 后把出发层的动量带到新位置，产生沿 $y$ 方向输运 $x$ 动量的非对流通量

$$
\Pi_{xy}=-\eta\,\frac{\partial u_x}{\partial y},
\qquad
\eta\approx\frac13\rho\lambda\bar v=\rho D.
$$

这里 $\Pi_{xy}$ 是动量通量；Cauchy 黏性应力的相应分量为 $+\eta\partial_yu_x$，符号相反。氮气近似只给平动输运量级，转动等内部自由度会影响热容、热导和体黏性。

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

延伸核对：[Tong动力学讲义§1](https://davidtong.org/pdfs/teaching/kinetic-theory/kinetic1.pdf)，进一步走向[Liouville与边缘分布](../../grad-math/site/kinetic-01-liouville-marginals.html)。
