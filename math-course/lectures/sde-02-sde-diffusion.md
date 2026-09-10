# 随机微积分 II · SDE、OU 过程与扩散方程

> 一条路径回答“这次发生了什么”，概率分布回答“许多次实验如何分散”。随机微分方程把两者连接起来；数值算法还要回答第三个问题：看到的现象来自模型，还是来自步长？

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ou-learning-title">

<h2 id="ou-learning-title">学习层：均值正确，为什么还会模拟错？</h2>

把偏离平衡位置的量记作 $X_t$。最简单的回复与扰动模型是

$$
dX_t=-\theta X_t\,dt+\sigma\,dB_t,\qquad X_0=x_0.
$$

这里 $x_0$ 是确定数，$\theta\ge0,\sigma\ge0$。当 $\theta>0$ 时，漂移把状态拉向 0；这并不要求每条路径单调靠近 0。若 $X$ 的单位为长度，$\theta$ 的单位为时间倒数，$\sigma$ 的单位为长度除以时间平方根。

**预测：两个方法给出相同的终点均值，是否就说明它们同样准确？** 实验同时比较正确 EM 更新、把 $\sqrt h$ 错换成 $h$ 的更新，以及同一布朗驱动上的精确 OU 解。

<div class="learning-lab" data-learning-lab="sde-path-distribution" markdown="1">

**无 JavaScript 时也能核算：**设 $A=1-\theta h$，$T=nh$，两种更新分别是

$$
X_{k+1}^{h}=AX_k^h+\sigma\sqrt h\,Z_k,\qquad
\widetilde X_{k+1}^{h}=A\widetilde X_k^h+\sigma h\,Z_k,
$$

其中 $Z_k$ 独立服从 $N(0,1)$。两者的总体均值都为 $x_0A^n$，但

$$
\operatorname{Var}(X_n^h)=\sigma^2h\sum_{j=0}^{n-1}A^{2j},
\qquad
\operatorname{Var}(\widetilde X_n^h)=\sigma^2h^2\sum_{j=0}^{n-1}A^{2j}.
$$

在固定数值单位下，错误法方差是正确法的 $h$ 倍。$h=1$ 时这两次更新数值上恰好相同，仍不能证明错误缩放可用于其他步长；它本身也不符合原方程的量纲。

</div>

实验使用 3 组固定种子，每组 256 条伪随机路径、256 个细时间段，聚合为 4 至 256 步的七层网格。参数、种子和层级可以更改；“临界”与“失稳”预设专门检验连续模型与数值方法的区别。图形保留全部采样值，不为好看而截断发散路径。

</section>

## 1. 方程先是一条积分关系

一般标量 Itô SDE 写作

$$
dX_t=b(t,X_t)\,dt+a(t,X_t)\,dB_t,
$$

实际含义是

$$
X_t=X_0+\int_0^t b(s,X_s)\,ds+\int_0^t a(s,X_s)\,dB_s.
$$

“漂移”指条件下的局部平均变化率，并不是说 $b(t,X_t)$ 的数值不随机；它取决于随机状态。扩散系数 $a$ 控制条件增量方差的主项 $a^2\,dt$，而不是增量的绝对大小。

一个常用的充分条件是：系数对时间可测，对状态满足每个有限时段上一致的全局 Lipschitz 与线性增长界；初值为 $\mathcal F_0$ 可测且平方可积，$B$ 相对于该滤子是 Brownian 运动。于是存在唯一的连续适应强解，并有相应有限时段矩估计。这里“强”表示使用给定的概率空间与驱动；不是“噪声很强”。

这些是方便使用的充分条件，不是存在唯一性的必要条件。局部 Lipschitz 通常先给出爆炸前的解，还需要额外控制排除有限时爆炸；不要把“公式看起来光滑”当作全局定理。

## 2. OU 过程：路径、转移分布与平稳性

### 2.1 乘一个积分因子

对 $e^{\theta t}X_t$ 使用[Itô 乘积公式](sde-01-ito.html)，确定性因子没有 Brownian 二次变差项：

$$
d(e^{\theta t}X_t)=\sigma e^{\theta t}\,dB_t.
$$

积分后得到

$$
\boxed{X_t=x_0e^{-\theta t}
+\sigma\int_0^t e^{-\theta(t-s)}\,dB_s.}
$$

确定性函数的 Itô 积分是中心高斯变量。由等距，若 $\theta>0$，

$$
m_t=x_0e^{-\theta t},\qquad
v_t=\sigma^2\int_0^t e^{-2\theta(t-s)}ds
=\frac{\sigma^2}{2\theta}(1-e^{-2\theta t}).
$$

因此 $X_t\sim N(m_t,v_t)$，前提是本节的**确定性初值**。若初值随机且独立于未来 Brownian 增量，解是衰减初值与独立高斯项之和；非高斯初值一般给出高斯混合，而非单个高斯分布。

两个边界值得单独写出：

- $\theta=0$ 时，$X_t=x_0+\sigma B_t$，方差为 $\sigma^2t$；上式取连续极限，不能直接除以 0。
- $\sigma=0$ 时，过程完全确定，分布是点质量 $\delta_{x_0e^{-\theta t}}$。不能给方差加一个小正数，然后称它为真实密度。

### 2.2 精确离散采样不是 Euler

任意 $h>0$，独立未来增量给出

$$
X_{t+h}=e^{-\theta h}X_t+\varepsilon_t,\qquad
\varepsilon_t\sim N\!\left(0,\frac{\sigma^2}{2\theta}(1-e^{-2\theta h})\right),
$$

创新独立于 $\mathcal F_t$。$\theta=0$ 时创新方差为 $\sigma^2h$。

当 $\theta>0$，这是系数在 $(0,1)$ 内的特定 AR(1) 采样模型；一般 AR(1) 还允许负系数等情形，不能全部解释成这个标量 OU。条件均值的回复半衰期是 $\ln2/\theta$，不表示随机样本每过这段时间都减半。

### 2.3 接近平稳不等于已经平稳

$\theta>0$ 时，从确定初值出发，$m_t\to0$，$v_t\to\sigma^2/(2\theta)$，故单时刻分布趋于不变高斯分布。若一开始就取独立的
$X_0\sim N(0,\sigma^2/(2\theta))$，才得到平稳 OU 过程，其协方差为

$$
\operatorname{Cov}(X_s,X_t)=\frac{\sigma^2}{2\theta}e^{-\theta|t-s|}.
$$

从固定 $x_0$ 出发的早期过程不平稳。$\theta=0,\sigma>0$ 的布朗运动也没有这种有限方差平稳分布。

## 3. Euler–Maruyama：连续系统稳定，算法仍可能失稳

EM 在每段左端冻结系数：

$$
X_{k+1}^{h}=X_k^h+b(t_k,X_k^h)h
+a(t_k,X_k^h)\sqrt h\,Z_k.
$$

对 OU，它成为 $X_{k+1}^{h}=AX_k^h+\sigma\sqrt hZ_k$，$A=1-\theta h$。均值递推为 $m_{k+1}=Am_k$，方差递推为

$$
v_{k+1}=A^2v_k+\sigma^2h,\qquad v_0=0.
$$

这一步就能推导学习层的两个矩公式。噪声均值为零，所以错误地缩放噪声不会改变这两个离散法的总体均值，却会改变方差。

对 $\theta>0$，均方稳定要求 $|A|<1$，即

$$
0<\theta h<2.
$$

在稳定范围内，EM 的长期方差为

$$
v_\infty^{h}=\frac{\sigma^2h}{1-(1-\theta h)^2}
=\frac{\sigma^2}{2\theta-\theta^2h}.
$$

它仍不等于精确 OU 的 $\sigma^2/(2\theta)$；固定步长留下平稳分布偏差。当 $\theta h=2$，$A=-1$，没有收缩，且 $\sigma>0$ 时方差逐步累积；$\theta h>2$ 时模大于 1。$\sigma=0,X_0=0$ 的特殊零解当然不会发散，这不改变方法的稳定性判据。

一般 EM 强半阶定理需要正则性与矩条件。OU 是加性噪声线性特例，其终点强误差可达一阶；不能把此例的斜率当成所有 SDE 的收敛阶。某些超线性漂移即使连续解良好，显式 Euler 的矩也可能失控。

## 4. 怎样在同一噪声上构造精确参照？

<style>
.ou-static{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}
.ou-static img{display:block;width:1100px;max-width:none!important}
.ou-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style>

<div class="figure ou-static" role="region" aria-label="OU 稳定性、方差与概率流静态图，可横向滚动" tabindex="0" markdown="1">

![连续回复与 Euler 乘子、两种噪声缩放的方差，以及相同边缘分布的不同路径机制](assets/img/sde-02-diffusion.svg)

上两幅图直接使用解析乘子和方差，未筛选随机样本。下方的平稳概率流例子将在第 6 节推导。

</div>

“最细网格已经很细”不是精确性证明。本实验不把最细 EM 当成真解，而在每个细区间构造联合高斯变量。

设区间长度为 $\delta$，$x=\theta\delta$，

$$
\Delta B=\int_0^\delta dB_s,\qquad
J=\int_0^\delta e^{-\theta(\delta-s)}\,dB_s.
$$

定义

$$
c(x)=\int_0^1e^{-xu}du
=\frac{1-e^{-x}}x,\quad c(0)=1,
\qquad q(x)=c(2x)-c(x)^2.
$$

Itô 等距和协方差公式给出 $\operatorname{Var}(\Delta B)=\delta$、
$\operatorname{Cov}(J,\Delta B)=\delta c(x)$、$\operatorname{Var}(J)=\delta c(2x)$。因此可以用独立标准正态 $Z,W$ 表示

$$
\Delta B=\sqrt\delta\,Z,\qquad
J=c(x)\Delta B+\sqrt{\delta q(x)}\,W.
$$

额外的 $W$ 表示区间内 Brownian 波动未被端点增量完全确定的部分。只把 $J$ 写成某个倍数的 $\Delta B$，通常会丢掉这部分条件方差。

精确更新为 $X_{t+\delta}=e^{-\theta\delta}X_t+\sigma J$。各细区间独立，再把 $\Delta B$ 相加供粗网格 EM 使用，得到七层共同的 Brownian 驱动与一致的精确终点。这里的“精确”指采样时刻的联合分布构造没有时间离散偏差；有限精度、伪随机数与有限样本的限制仍在。

当 $x$ 很小，直接计算 $c(2x)-c(x)^2$ 会发生严重消减。实验利用正项恒等式

$$
q(x)=e^{-x}\sum_{k=1}^{\infty}
\frac{2k\,x^{2k}}{(2k+2)!}
=\frac{x^2}{12}+O(x^3),
$$

计算条件标准差；$\theta=0$ 时它严格为零。这个数值细节对应一个真实问题：不能因为机器舍入把小方差算成负数，就随意截成零。

### 4.1 解析强误差也能核算

令 $h=T/n$、$A=1-\theta h$。记终点均值偏差
$\beta_n=x_0(A^n-e^{-\theta T})$。按从终点向后第 $j$ 个区间展开，两种解使用同一噪声；独立区间的误差方差可相加，得到

$$
\begin{aligned}
\mathbb E|X_n^h-X_T|^2
={}&\beta_n^2+\sigma^2h\sum_{j=0}^{n-1}
\left[(A^j-e^{-\theta jh}c(\theta h))^2
+e^{-2\theta jh}q(\theta h)\right].
\end{aligned}
$$

每一项都非负。这比用“两个方差减两倍协方差”计算极小误差更稳定。图中分别给出该式平方根、256 条配对路径的样本 RMS，以及测试函数 $\varphi(x)=x$ 的弱误差 $|\beta_n|$。

弱误差不是一个脱离测试函数的单一数字。例如 $x_0=0$ 时两种总体均值均为 0，弱均值误差严格为零，但噪声驱动下的强误差通常不为零。

样本均值减去真均值还包含抽样波动：

$$
\bar X_h-\mathbb EX_T
=(\mathbb EX_h-\mathbb EX_T)+(\bar X_h-\mathbb EX_h).
$$

若 $D_i=X_{T,i}^h-X_{T,i}$，配对均差的标准误估计是
$\sqrt{\sum_i(D_i-\bar D)^2/[M(M-1)]}$。它依赖独立抽样的解释，不是固定伪随机样本的精确置信保证。对数图只画正误差；零值列在账本，不设人为地板。

## 5. 从路径到概率：Fokker–Planck 方程

### 5.1 先看测试函数的平均变化

对适当光滑测试函数 $\varphi$，Itô 公式产生生成元

$$
L_t\varphi=b(t,x)\varphi'(x)+\tfrac12a(t,x)^2\varphi''(x).
$$

在系数局部受控、测试函数紧支撑等足以令随机积分为真鞅的条件下，积分形式为

$$
\mathbb E\varphi(X_t)-\mathbb E\varphi(X_0)
=\int_0^t\mathbb E[L_s\varphi(X_s)]\,ds.
$$

这条弱关系不需要先假设分布有密度。若各时刻存在足够正则的密度 $p(t,x)$，再对空间分部积分，可得到

$$
\boxed{\partial_t p=-\partial_x(bp)+\tfrac12\partial_{xx}(a^2p).}
$$

当 $a$ 随 $x$ 变化，不能把第二项改成 $\tfrac12a^2\partial_{xx}p$。而 $\sigma=0$、确定初值的 OU 只有移动点质量；从确定初值且 $\sigma>0$ 出发，$t=0$ 初始条件也是 $\delta_{x_0}$，高斯密度公式适用于 $t>0$。

### 5.2 通量告诉我们概率如何进出

定义概率通量

$$
J=bp-\tfrac12\partial_x(a^2p),\qquad
\partial_t p=-\partial_xJ.
$$

因此区间 $[\ell,r]$ 内概率的变化率为 $J(t,\ell)-J(t,r)$。全空间的总质量守恒需要适当无穷远通量条件；有限区间要指定反射、吸收或其他边界。仅写一个 PDE，并没有自动指定完整概率模型。

对常噪声 $\sigma>0$、漂移 $b=-V'$，若求**零通量**平稳密度，

$$
-V'p_\infty-\tfrac{\sigma^2}{2}p_\infty'=0
\quad\Longrightarrow\quad
p_\infty(x)=Z^{-1}e^{-2V(x)/\sigma^2}.
$$

这要求 $Z=\int e^{-2V/\sigma^2}dx<\infty$，并匹配边界条件。得到一个不变密度不等于已经证明任意初值都收敛到它；遍历性需要另行核验。周期空间上还可能有非零平稳通量，不能把“平稳”普遍等同于“通量为零”。

OU 对应 $V(x)=\theta x^2/2$，$\theta>0$ 时恢复上述高斯密度。连续 Langevin 扩散的目标不变分布与离散采样算法也要区分：固定步长的未校正 Euler Langevin 通常有偏差，不能自动称为精确 MCMC。

## 6. 通往生成模型：反向 SDE 与概率流

这里只建立数学接口。取状态无关的标量噪声 $g(t)$，
$dX_t=f(t,X_t)dt+g(t)dB_t$。在正密度、光滑性及时间反演所需的条件下，设反向钟 $s=T-t$，则反向 SDE 的漂移为

$$
dY_s=\left[-f(T-s,Y_s)+g(T-s)^2
\nabla\log p_{T-s}(Y_s)\right]ds+g(T-s)d\bar B_s.
$$

必须从正确的终端分布 $Y_0\sim p_T$ 开始。若改用逐渐减小的原时钟 $t$，常写成漂移 $f-g^2\nabla\log p_t$ 且 $dt<0$；两个符号体系不要混用。状态相关扩散矩阵还有额外散度项，不能原样套本式。

### 6.1 同一组边缘分布，可以来自不同路径机制

概率流 ODE 使用原时钟：

$$
\boxed{\frac{dX_t}{dt}=f(t,X_t)-\frac12g(t)^2\nabla\log p_t(X_t).}
$$

原因可从通量直接看见：$g$ 与状态无关时，$p\nabla\log p=\nabla p$，ODE 的连续性方程正好等于原 SDE 的 Fokker–Planck 方程。这里是**减去半份 score 项**，不是任意再加一份。

在正则性、正确初始分布和精确 score 等条件下，它们有相同的单时刻边缘分布；这不表示路径、两时刻联合分布或转移核相同。换成学得的近似 score，再做有限步长数值求解，还会引入模型与离散误差。

### 6.2 VP 加噪为什么会接近高斯？

令 $\beta(t)\ge0$ 局部可积，取

$$
dX_t=-\tfrac12\beta(t)X_t\,dt+\sqrt{\beta(t)}\,dB_t,\qquad
\alpha_t=\exp\!\left[-\tfrac12\int_0^t\beta(s)ds\right].
$$

给定 $X_0=x_0$，
$X_t=\alpha_t x_0+\sqrt{1-\alpha_t^2}\,\varepsilon$ 于分布意义成立，$\varepsilon\sim N(0,I)$。对一般数据分布，边缘分布是这些条件高斯的混合；有限 $T$ 通常还不是精确标准高斯。

当 $\alpha_t\to0$ 时信号贡献消失，边缘分布趋向标准高斯。对 $1-\alpha_t^2>0$，噪声预测的总体最优平方损失解为条件期望，满足

$$
\nabla\log p_t(x)
=-\frac{\mathbb E[\varepsilon\mid X_t=x]}{\sqrt{1-\alpha_t^2}}.
$$

一次训练对中的具体噪声并不等于边缘 score。$t=0$ 附近若分布奇异，也不能直接把分母为零的公式代入。这里解释的是这一类 score 扩散构造，不涵盖所有生成模型或所有采样器。

## 7. 三道核算题

**题 1：稳定但仍有偏差。** 取 $\theta=1,\sigma=1,h=1$。连续 OU 与 EM 的长期方差分别是多少？每步 EM 是否还保留上一步状态？

<details class="answer" markdown="1">
<summary>展开：先算乘子，再算方差</summary>

$A=1-\theta h=0$，因此 EM 每步直接成为新标准正态噪声，长期方差为 1。连续 OU 平稳方差为 $1/2$，精确一步采样仍有系数 $e^{-1}>0$。方法满足 $|A|<1$，但稳定不等于无偏，也不等于时间相关性正确。

</details>

**题 2：为什么同样的均值会掩盖错误？** 取 $\theta=0,x_0=0,\sigma=1,T=1$、$h=1/n$，比较精确解、EM 和错误缩放法的终点方差。

<details class="answer" markdown="1">
<summary>展开：把独立增量的方差相加</summary>

精确解为 $B_1$，方差 1。EM 累加 $n$ 个方差为 $h$ 的增量，方差 $nh=1$，且在同一 Brownian 驱动的网格上精确。
错误法累加 $n$ 个方差为 $h^2$ 的增量，方差 $nh^2=h\to0$。三者均值均为 0；错误法却越来越集中到原点。单看均值会错过整个扩散机制。

</details>

**题 3：平稳密度的概率流 ODE 为什么可以不动？** 对 $\theta>0,\sigma>0$ 的平稳 OU，代入精确 score，计算概率流 ODE 的速度，并与 OU 的路径比较。

<details class="answer" markdown="1">
<summary>展开：静止样本也能保持同一边缘分布</summary>

平稳密度 $p(x)\propto e^{-\theta x^2/\sigma^2}$ 的 score 为 $-2\theta x/\sigma^2$。概率流速度
$-\theta x-\tfrac12\sigma^2(-2\theta x/\sigma^2)=0$。
若初始样本来自该平稳分布，ODE 让每个样本保持不动，所有时刻的边缘分布自然不变。
真正 OU 路径仍持续波动，其协方差随时间差衰减；静止 ODE 样本的两时刻协方差则始终等于初始方差。这正说明相同边缘分布不意味着相同路径规律。

</details>

## 8. 参考与下一步

- [Lawler，Stochastic Calculus](https://www.math.uchicago.edu/~lawler/finbook.pdf)：Itô 积分、扩散与生成元的基础。
- [Higham，数值模拟 SDE 的算法导论](https://webhomes.maths.ed.ac.uk/~dhigham/Publications/P42.pdf)：共享噪声、强弱误差与离散实验。
- [Song 等，Score-Based Generative Modeling through SDEs，§3.2、§4.3 与附录 D](https://arxiv.org/html/2011.13456v2)：反向时间约定、score 与概率流的数学接口。

继续学习时，先保留本页的三层区分：单条路径、总体概率、数值近似。前沿模型可以更复杂，这三本账仍不能混在一起。
