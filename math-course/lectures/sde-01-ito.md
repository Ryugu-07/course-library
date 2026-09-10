# 随机微积分 I · 二次变差与 Itô 引理

> 把一段波动的平方加起来，会留下什么？光滑路径的答案趋于零；布朗运动的答案却趋于经过的时间。Itô 公式里的二阶修正来自这个可证明的极限。$(dB)^2=dt$ 是它的记账方式。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ito-learning-title">

<h2 id="ito-learning-title">学习层：一条路径、一次样本平均、一个期望</h2>

设一个正量从 $X_0=1$ 开始增长。无噪声模型是 $dX=aX\,dt$；加入比例噪声后，Itô 模型为

$$
dX_t=aX_t\,dt+\sigma X_t\,dB_t.
$$

这里 $a$ 的量纲是时间的倒数，$\sigma$ 是时间平方根的倒数；$B$ 的增量方差等于时间增量。噪声项是 $\sigma X_n\sqrt h\,Z_n$，其中 $Z_n$ 为独立标准正态，不能把 $\sqrt h$ 换成 $h$。

先回答一个问题：**64 条数值路径的终点均值，减去解析真均值，是否就是弱离散误差？** 读完账本后，还应能够解释为什么一条路径的偏差不能回答这个问题。

<div class="learning-lab" data-learning-lab="ito-sde" markdown="1">

**无 JavaScript 时的读法：**取 $T=1,X_0=1,a=0.35,\sigma=0.7$。把同一批细网格布朗增量聚合为 $n=8,16,32,64,128$ 步；$h=T/n$。以下公式可独立核对：

| 模型 | 同噪声的解析终点 | 解析总体均值 |
|---|---|---|
| ODE | $X_0e^{aT}$ | $X_0e^{aT}$ |
| Itô | $X_0e^{(a-\sigma^2/2)T+\sigma B_T}$ | $X_0e^{aT}$ |
| 相同书面漂移的 Stratonovich | $X_0e^{aT+\sigma B_T}$ | $X_0e^{(a+\sigma^2/2)T}$ |

ODE 与 Itô EM 的**离散总体均值**均为 $X_0(1+ah)^n$。本实验的 Stratonovich 随机 Heun 法有离散均值
$X_0[1+ah+(a^2h^2+\sigma^2h)/2]^n$。因此弱均值误差可以直接从这两种解析均值计算，不必混入 Monte Carlo 抽样噪声。

同一条路径上的另一本账是

$$
\sum B_{t_i}\Delta B_i
=\frac{B_T^2-\sum(\Delta B_i)^2}{2},\qquad
\sum\frac{B_{t_i}+B_{t_{i+1}}}{2}\Delta B_i=\frac{B_T^2}{2}.
$$

这两个有限和恒等式逐项就能验证；它们为何趋向不同积分，是本页的主线。

</div>

实验使用 3 组固定种子，每组 64 条伪随机路径，每条先生成 256 个正态增量，再聚合到各网格。更换步长保留同一批噪声；更换种子可观察样本波动。折线只连接采样时刻的值，不是完整的布朗路径。有限样本与有限层级可以检验计算，不能证明几乎必然结论或一般收敛阶。

</section>

## 1. 二次变差：先证明，再使用微分记号

### 1.1 分割必须真正变细

回顾[布朗运动](stoch-04-brownian.html)：$B_0=0$，增量独立且 $B_t-B_s\sim N(0,t-s)$，路径连续，**几乎必然处处不可微**。增量的均方根为 $\sqrt{t-s}$，但“差商的方差发散”本身不是处处不可微的完整证明。

固定 $T>0$，取确定性分割 $\pi=\{0=t_0<\cdots<t_n=T\}$，网格宽度为 $|\pi|=\max_i(t_{i+1}-t_i)$。定义

$$
Q_\pi=\sum_i(\Delta B_i)^2.
$$

正态四阶矩给出 $\operatorname{Var}[(\Delta B_i)^2]=2(\Delta t_i)^2$，加上独立增量，

$$
\mathbb E Q_\pi=T,\qquad
\mathbb E(Q_\pi-T)^2=2\sum_i(\Delta t_i)^2
\le2T|\pi|.
$$

因此只要 $|\pi_m|\to0$，就有 $Q_{\pi_m}\to T$ 于 $L^2$，从而依概率收敛。**仅增加分割段数还不够**：若始终保留一段长度为 $T/2$ 的大区间，它的波动不会消失。

对等长 $n$ 段，

$$
\operatorname{Var}(Q_n)=\frac{2T^2}{n},\qquad
\operatorname{SD}(Q_n)=T\sqrt{\frac2n}.
$$

这是总体分布的标准差，不是每条路径的误差上界。沿二分网格 $n=2^m$，Chebyshev 上界可求和，再用 Borel–Cantelli 可推出固定 $T$ 处的几乎必然收敛；不能把 $L^2$ 收敛直接改写成“对任意一切分割、每条路径都收敛”。

### 1.2 与连续有限变差路径对比

若连续路径 $A$ 在 $[0,T]$ 上总变差有限，则

$$
\sum_i(\Delta A_i)^2
\le\max_i|\Delta A_i|\,\operatorname{TV}(A;[0,T])\longrightarrow0.
$$

连续性使最大增量趋零。对 Brownian 部分与有限变差部分的交叉和，Cauchy–Schwarz 又给出
$|\sum\Delta A_i\Delta B_i|\le[\sum(\Delta A_i)^2\sum(\Delta B_i)^2]^{1/2}\to0$
（依概率）。所以可写

$$
[B]_t=t,\qquad [A]_t=[A,B]_t=0.
$$

简写成 $(dB)^2=dt$、$dt\,dB=(dt)^2=0$ 时，说的是**细分后累加的极限贡献**。单个 $(\Delta B)^2$ 仍然随机，绝不逐步等于 $\Delta t$。

<style>
.ito-static{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}
.ito-static img{display:block;width:1100px;max-width:none!important}
.ito-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style>

<div class="figure ito-static" role="region" aria-label="二次变差与积分静态图，可横向滚动" tabindex="0" markdown="1">

![二次变差的总体波动随网格缩小，以及同一组离散增量的左端和与梯形和](assets/img/sde-01-quadratic-variation.svg)

上图画的是可证明的总体标准差，没有挑选一条恰好靠近极限的路径。下图使用明确给定的教学增量核算两个有限和，不把这些人工数值当作 Brownian 分布证据。

</div>

## 2. Itô 积分：不读取未来的信息

固定满足通常条件的滤子 $(\mathcal F_t)$，令 $B$ 是相对于该滤子的 Brownian 运动；特别是未来增量独立于当前 $\mathcal F_t$。这比仅要求“$B$ 本身有独立增量”更明确：不能提前把未来轨迹放进当前信息集。

对简单可预测过程

$$
H_s=\sum_i\xi_i\,\mathbf1_{(t_i,t_{i+1}]}(s),
\qquad \xi_i\in L^2(\mathcal F_{t_i}),
$$

定义 $\int_0^T H_s\,dB_s=\sum_i\xi_i\Delta B_i$。系数在每段开始时已经确定。由于增量的条件均值为零，不同区间的交叉项期望为零，而

$$
\mathbb E[\xi_i^2(\Delta B_i)^2]
=\mathbb E[\xi_i^2\,\mathbb E((\Delta B_i)^2\mid\mathcal F_{t_i})]
=\mathbb E[\xi_i^2]\Delta t_i.
$$

于是得到 **Itô 等距**

$$
\mathbb E\left|\int_0^T H_s\,dB_s\right|^2
=\mathbb E\int_0^T H_s^2\,ds.
$$

对可预测 $H$ 满足 $\mathbb E\int_0^T H_s^2ds<\infty$，先在 $L^2(\Omega\times[0,T])$ 中用简单过程逼近，再由等距定义积分的 $L^2(\Omega)$ 极限。等距保证极限不依赖所选近似。得到的积分过程是平方可积鞅，均值为零。

**不能把一般积分定义成任意左端采样。** 对连续适应过程，在适当平方可积控制下可用左端阶梯近似；但一般 $L^2$ 过程只按几乎处处等价类定义。例如确定性 $H_s=\mathbf1_{\mathbb Q}(s)$ 的积分是 0；若分割端点全是有理数，机械取 $H_{t_i}=1$ 的左和却是 $B_T$。这些阶梯过程没有在所需的 $L^2$ 空间逼近 $H$。

若仅有 $\int_0^T H_s^2ds<\infty$ 几乎必然，可用停时局部化构造积分，通常首先得到**连续局部鞅**。局部鞅不自动是真鞅；“微分中没有 $dt$ 项”不足以保证期望恒定，仍要检查积分性或一致可积等条件。

## 3. Itô 公式：带二次变差的链式法则

设连续 Itô 过程

$$
X_t=X_0+\int_0^t a_s\,ds+\int_0^t b_s\,dB_s,
$$

系数适当可测，且每个有限时段上 $\int(|a_s|+b_s^2)\,ds<\infty$ 几乎必然；可预测版本用于随机积分。若 $f(t,x)\in C^{1,2}$，即时间一阶、空间二阶导数连续，则

$$
\boxed{
df(t,X_t)=
\left(f_t+a_t f_x+\tfrac12b_t^2 f_{xx}\right)(t,X_t)\,dt
+b_t f_x(t,X_t)\,dB_t.}
$$

它是积分恒等式的简写，并不是对处处不可微的 $X_t$ 作经典求导。一般先局部化到系数、过程和导数受控的区间，再解除停时；公式本身不保证随机积分项有零期望。

### 3.1 二阶项为什么没有消失

形式 Taylor 展开提供计算路线：

$$
\Delta f\approx f_t\Delta t+f_x\Delta X
+\tfrac12f_{xx}(\Delta X)^2.
$$

在分割上求和后，有限变差平方和与交叉项消失，而扩散部分的加权平方和留下 $\int b_s^2 f_{xx}(s,X_s)\,ds$。真正的证明还须控制局部化后的 Taylor 余项，并在相应概率或积分范数中取极限；只写“$(dB)^2=dt$”是推导提示，不替代这些步骤。

当 $f$ 在空间上凸时，修正项 $\tfrac12b^2f_{xx}$ 非负，说明波动经弯曲函数变换后产生额外的局部漂移。这没有声称总漂移非负：$f_t+a f_x$ 也可能为负；无积分性时更不能直接对整个公式取期望。

### 3.2 乘积与多个噪声

若 $dX=a\,dt+b\,dB$、$dY=c\,dt+d\,dB$，则

$$
d(XY)=X\,dY+Y\,dX+bd\,dt.
$$

两个变量共享同一噪声，交叉二次变差不能漏掉。若改为两个独立 Brownian 驱动，交叉二次变差为零；若联合 Brownian 驱动满足常相关系数 $\rho$，则 $dB^1dB^2=\rho\,dt$。高维 Itô 公式的二阶项是 Hessian 与扩散协方差矩阵的配对。含跳过程另有跳跃修正，不能原样套本页连续过程公式。

## 4. 左端与对称积分为何不同

对 $f(x)=x^2$ 应用 Itô 公式，

$$
d(B_t^2)=2B_t\,dB_t+dt,\qquad
\int_0^T B_t\,dB_t=\frac{B_T^2-T}{2}.
$$

也可以完全从有限和开始：$B_{i+1}^2-B_i^2=2B_i\Delta B_i+(\Delta B_i)^2$。望远镜求和后，左和为 $(B_T^2-Q_\pi)/2$；二次变差极限提供那个 $-T/2$。

相反，梯形和逐项满足

$$
\frac{B_i+B_{i+1}}2\,\Delta B_i
=\frac{B_{i+1}^2-B_i^2}{2},
$$

其和直接为 $B_T^2/2$。连续半鞅情形可定义 Stratonovich 积分

$$
\int H\circ dB=\int H\,dB+\tfrac12[H,B].
$$

对足够光滑的标量扩散系数 $\sigma(x)$，

$$
dX=a(X)\,dt+\sigma(X)\circ dB
\quad\Longleftrightarrow\quad
dX=\left[a(X)+\tfrac12\sigma(X)\sigma'(X)\right]dt+\sigma(X)\,dB.
$$

Stratonovich 形式保留相应的经典链式法则，但并非任何被积过程都可无条件用“中点取值”定义。它的积分也不是一定不为鞅：确定性适当被积函数使交叉变差为零；而 $\int B\circ dB=B_T^2/2$ 的期望为 $T/2$，这例确实不是鞅。两种约定都用于建模，应根据模型推导选择，不能仅按学科名称断定。

## 5. 几何布朗运动：先构造正解，再取对数

对常数 $a,\sigma$ 和确定性 $X_0>0$，定义

$$
X_t=X_0\exp[(a-\sigma^2/2)t+\sigma B_t].
$$

该过程显然为正；对指数函数应用 Itô 公式，直接验证它满足 $dX=aX\,dt+\sigma X\,dB$。线性系数的全局 Lipschitz 条件给出唯一强解，因此再对 $\ln X_t$ 使用 Itô 是合法的，而不是预先假定了待证的正性。

$$
d\ln X_t=(a-\sigma^2/2)\,dt+\sigma\,dB_t.
$$

若 $X_0=0$，唯一解恒为零，不能取对数；若 $X_0<0$，同一指数表达式保持负号，可处理 $\ln|X|$，但它不再是通常的正量模型。实验仅开放正初值。

高斯矩母函数给出

$$
\mathbb E X_t=X_0e^{at},\qquad
\operatorname{Var}(X_t)=X_0^2e^{2at}(e^{\sigma^2t}-1),\qquad
\operatorname{median}(X_t)=X_0e^{(a-\sigma^2/2)t}.
$$

所以 $-\sigma^2/2$ 修正的是对数增长率；它没有把 $\mathbb E X_t$ 的增长率从 $a$ 改掉。这是明确模型内的均值与中位数区别，不能脱离假设推广成所有现实过程的增长定律。若相同书面漂移改用 Stratonovich 约定，解为 $X_0e^{at+\sigma B_t}$，其均值相应改变。

## 6. 数值实验究竟估计什么

### 6.1 三种更新

设 $h=T/n$，在所有方法中共享同一组 $\Delta B_i$。ODE Euler 用 $X_{i+1}=X_i(1+ah)$；Itô Euler–Maruyama 用

$$
X_{i+1}=X_i(1+ah+\sigma\Delta B_i).
$$

对本页标量线性 Stratonovich 模型，预测校正即随机 Heun 法可写为

$$
u_i=ah+\sigma\Delta B_i,\qquad
X_{i+1}=X_i(1+u_i+\tfrac12u_i^2).
$$

EM 的乘子可能为负，因此粗网格数值解可能穿过零；实验保留这些值并报告负终点个数，不截断成零。Heun 乘子为 $[(u_i+1)^2+1]/2>0$，在这个特定线性模型中保持正性；不能据此声称一般 SDE 的 Heun 方法都保正。

### 6.2 总体误差、样本估计与抽样误差

终点强 $L^2$ 误差为

$$
\left(\mathbb E|X_T^{(h)}-X_T|^2\right)^{1/2}.
$$

必须把数值解与真解放在**同一噪声**上比较。实验用 $M=64$ 条配对路径的 RMS 估计它；单一路径绝对差也不是这个期望范数，更不是整个时间区间的最大误差。

弱误差依赖测试函数。这里固定 $\varphi(x)=x$，因此

$$
e_{\rm weak}(h)=|\mathbb E X_T^{(h)}-\mathbb E X_T|.
$$

独立增量使每步乘子的期望可以相乘。EM/ODE 的离散均值为 $X_0(1+ah)^n$；Heun 的为 $X_0[1+ah+(a^2h^2+\sigma^2h)/2]^n$。实验用这些公式计算弱均值误差，接近相等时用 $\operatorname{log1p}$、$\operatorname{expm1}$ 的数值版本避免消减。

设 $\bar X_h$ 为数值样本均值，则严格分解为

$$
\bar X_h-\mathbb E X_T
=\underbrace{\mathbb E X_T^{(h)}-\mathbb E X_T}_{\text{离散偏差}}
+\underbrace{\bar X_h-\mathbb E X_T^{(h)}}_{\text{抽样偏差}}.
$$

另外令 $D_j=X_{T,j}^{(h)}-X_{T,j}$，配对均差 $\bar D$ 估计离散偏差。实验报告

$$
\widehat{\operatorname{SE}}(\bar D)
=\sqrt{\frac{\sum_j(D_j-\bar D)^2}{M(M-1)}}.
$$

这是把路径视为独立抽样时的样本标准误估计；固定伪随机样本和大尾部可能令估计不稳定，不能把 $\bar D\pm2\,\widehat{\rm SE}$ 自动称为精确置信区间。直方图展示完整 64 个终点的频数，不是解析密度。

### 6.3 阶数的条件与退化情形

常见全局 Lipschitz、增长与时间正则条件下，EM 强 $L^2$ 误差为 $O(h^{1/2})$；弱一阶还需相应系数和测试函数的光滑性、矩控制。强/弱**数值收敛**不同于强/弱**解**：强解在给定滤子与 Brownian 运动上构造；弱解允许概率空间与驱动一起作为待构造对象。

本页非零乘性噪声的 EM 通常展示强半阶，标量光滑 Stratonovich 随机 Heun 法通常展示强一阶；但 $\sigma=0$ 时它们退化为确定性 Euler 一阶和 Heun 二阶。若同时 $a=0,\sigma=0$，解和更新均为常数，误差为零，谈拟合斜率没有意义。对 Itô 模型即使 $a=0,\sigma>0$，测试函数 $x$ 的弱均值误差也恰为零，不能由此推出路径误差为零。

实验只对正误差点拟合有限层级斜率；零值另列，不在对数图上放一个人为地板。改变步长、样本量、种子可能改变拟合值，图中的一条直线不是一般定理的证明。

## 7. 三道逐步核算题

**题 1：有限分割上“少掉的半个时间”在哪里？** 给定四个教学增量 $(0.5,-0.25,0.75,-0.5)$，$B_0=0,T=1$，计算终点、二次变差、左端和、梯形和及 Itô 目标。不要假设这四个数已经满足 $Q=T$。

<details class="answer" markdown="1">
<summary>展开：先列路径端点再累加</summary>

路径端点为 $0,0.5,0.25,1,0.5$，所以 $B_T=0.5$、$Q=0.25+0.0625+0.5625+0.25=1.125$。
左端和为 $0-0.125+0.1875-0.5=-0.4375=(0.25-1.125)/2$；梯形和为 $0.125=B_T^2/2$。
Itô 目标是 $(0.25-1)/2=-0.375$。有限左和与目标相差 $-0.0625=-(Q-T)/2$；误差来自这组离散二次变差，不是因为恒等式失效。

</details>

**题 2：消掉漂移足够证明真鞅吗？** 对 $M_t=B_t^3-3tB_t$ 应用 Itô，并补足有限时段上的积分性核验。

<details class="answer" markdown="1">
<summary>展开：公式消漂移，矩估计完成证明</summary>

$$
dM_t=3(B_t^2-t)\,dB_t.
$$

这一步先给出局部鞅。用 $\mathbb EB_t^2=t$、$\mathbb EB_t^4=3t^2$，

$$
\mathbb E\int_0^T9(B_t^2-t)^2dt
=9\int_0^T2t^2dt=6T^3<\infty.
$$

故积分是平方可积真鞅，$M_0=0$，$\mathbb EM_t=0$。一般“没有漂移”只能完成第一步；本例能升级，是因为额外的矩估计。

</details>

**题 3：弱误差为零，数值法是否已经精确？** 取 Itô 模型 $a=0,\sigma>0,X_0=1$。比较 EM 的终点均值与方差。

<details class="answer" markdown="1">
<summary>展开：换一个测试函数，误差就显现</summary>

每步 EM 乘子 $1+\sigma\Delta B$ 的均值是 1，二阶矩为 $1+\sigma^2h$。独立相乘给出

$$
\mathbb EX_T^{(h)}=1=\mathbb EX_T,\qquad
\operatorname{Var}(X_T^{(h)})=(1+\sigma^2h)^n-1.
$$

真解方差为 $e^{\sigma^2T}-1$。有限 $h>0$ 时，**EM 方差严格小于真解方差**：因为 $\ln(1+z)<z$（$z>0$），且 $nh=T$，

$$
n\ln(1+\sigma^2h)<\sigma^2T
\quad\Longrightarrow\quad
(1+\sigma^2h)^n-1<e^{\sigma^2T}-1.
$$

所以对 $\varphi(x)=x$ 弱误差为零，对 $\varphi(x)=x^2$ 却不为零，路径也没有因此精确。实验中的 64 条样本均值仍可偏离 1；那是抽样偏差。

</details>

## 8. 参考与下一步

- [Lawler，Stochastic Calculus，第 2.8、3、4.1 节](https://www.math.uchicago.edu/~lawler/finbook.pdf)：二次变差、随机积分与局部鞅的系统论述。
- [Higham，数值模拟 SDE 的算法导论](https://webhomes.maths.ed.ac.uk/~dhigham/Publications/P42.pdf)：沿同噪声构造数值实验，并区别强收敛和弱收敛。

下一页：[SDE、OU 过程与 Fokker–Planck 方程](sde-02-sde-diffusion.html)。本页追踪路径上的函数变换；下一页进一步问，一群路径的概率密度如何演化。
