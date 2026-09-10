# 宇宙学 IV · 两种加速时代：暴胀与晚期暗能量

宇宙在加速膨胀，并不意味着哈勃参数一定增大；共动哈勃半径正在缩小，也不意味着光已经走过的路程缩短。本页先把这些几何量分清，再用一个真实的标量场模型计算早期加速怎样结束，最后比较晚期暗能量的背景。前置：[FRW 与距离](cosmo-01-frw.html)、[热历史](cosmo-02-thermal.html)、[结构增长](cosmo-03-perturbations-structure.html)。

<style>article:has(#acceleration-learning-title) .katex { position: relative; }</style>
<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="acceleration-learning-title">
<h2 id="acceleration-learning-title">学习层：先判断变化，再选择机制</h2>

| 层次 | 本页的可算问题 | 需要另加的信息 |
|---|---|---|
| 运动学 | 给定 $\epsilon_H$，$a$、$H$、光程如何变化？ | 什么物质或引力理论产生这个背景？ |
| 场动力学 | 二次势中的场从给定位置和速度出发，何时停止加速？ | 与哪些粒子耦合，怎样产生热浴？ |
| 晚期背景 | 给定物质比例和常数 $w$，何时开始加速？ | 扰动、偏置、系统误差以及真实观测数据 |

先作四个预测，再揭示实验。改变一个量时，留意哪些假设仍然成立。二次势模式包含完整场方程，并保留四种步长的对照；它是解释动力学的模型，不因“可以算”就获得观测支持。

<div class="learning-lab" data-learning-lab="physics-inflation-darkenergy" markdown="1">
### 无脚本也能复算的参考账本

几何例取常 εH=0、N=60；场例取初始 φ/Mpl=15、初始 d(φ/Mpl)/dN=0；晚期例取今天 Ωm=0.3、ΩDE=0.7、w=−1、a=1。Mpl 是约化 Planck 质量。这些是指定的教学输入。

| 量 | 数值 | 含义 |
|---|---:|---|
| 几何例的尺度因子比 | 1.14200739e+26 | e^60 |
| 几何例的共动哈勃半径比 | 8.75651076e-27 | e^−60 |
| 几何例的累计光程比 | 1 | 1−e^−60，双精度显示约1 |
| 场背景退出 N | 57.1219781 | 完整场方程，ΔN=0.025 |
| 场背景退出 φ/Mpl | 1.00934278 | 由 εH=1 定位 |
| 场背景 H结束/H初始 | 0.0824124915 | 独立积分 lnH |
| 场的慢滚总 N 估计 | 55.75 | 近似 (15²−2)/4 |
| 晚期今天 q | -0.55 | 负值表示加速 |
| 晚期今天 εH | 0.45 | 正值表示 H 仍下降 |
| 晚期加速转折 a | 0.598408481 | ρm=2ρΛ |
| 晚期等密度 a | 0.753947441 | 发生在加速开始之后 |

场的退出时刻由 εH=1 的首次交点定位。二分误差只描述交点在一个数值步内的位置，不能替代整条轨道的步长误差。
</div>
</section>

<figure>
<img src="assets/img/cosmo-04-acceleration-ledgers.svg" alt="常哈勃参数背景中的尺度与光程、二次势场的完整轨道和退出，以及晚期物质加暗能量的加速转折" loading="lazy">
<figcaption>几何模型按经过的 e-fold 数计时，场模型积分到实际退出，晚期模型以今天 a=1 归一化。三者的起点不能直接混用。</figcaption>
</figure>

## 1 · 加速与 H 增大是两个问题

本页动力学公式使用 $\hbar=c=1$，$\rho$ 表示能量密度，$p$ 表示压强；约化 Planck 质量定义为
$M_{\rm Pl}=(8\pi G_N)^{-1/2}$。它与使用 $G_N^{-1/2}$ 的非约化质量相差 $\sqrt{8\pi}$，公式系数也要相应改变。写出光传播尺度时会显式恢复 $c$。

由 $H=\dot a/a$ 直接求导：

$$
\dot H=\frac{\ddot a}{a}-H^2,\qquad
q=-\frac{\ddot a}{aH^2},\qquad
\epsilon_H=-\frac{\dot H}{H^2},\qquad
\boxed{q=\epsilon_H-1.}
$$

在膨胀支 $H>0$，$q<0$ 表示尺度因子加速增长。可是 $\epsilon_H>0$ 又意味着 $H$ 下降。因此 $0<\epsilon_H<1$ 同时满足“加速膨胀”和“哈勃参数下降”，无需矛盾。

令向未来增加的 $N=\ln(a/a_i)$，则

$$
\frac{d\ln H}{dN}=-\epsilon_H,\qquad
\frac{d\ln r_H}{dN}=\epsilon_H-1=q,
\qquad r_H=\frac{c}{aH}.
$$

$r_H$ 是共动哈勃半径。其增减恰好跟 $q$ 的符号一致。在固定空间曲率 $K\ne0$ 时，$\Omega_K=-Kc^2/(a^2H^2)$ 还满足

$$
\frac{|\Omega_K(N)|}{|\Omega_K(0)|}
=\left[\frac{r_H(N)}{r_H(0)}\right]^2.
$$

这解释了加速阶段如何降低曲率项的相对重要性；若 $K=0$，两端都为零，不能把比值写成 $0/0$。几何变化本身也不是“任意初始条件必然演化到我们的宇宙”的证明。

## 2 · 常 εH 的精确几何例子

若 $\epsilon_H=\epsilon$ 为常数，积分得到

$$
\frac{a}{a_i}=e^N,\qquad
\frac{H}{H_i}=e^{-\epsilon N},\qquad
\frac{r_H}{r_{H,i}}=e^{(\epsilon-1)N}.
$$

真实经过的时间与从指定起点积累的共动光程分别为

$$
H_i(t-t_i)=\int_0^Ne^{\epsilon n}\,dn
=\begin{cases}(e^{\epsilon N}-1)/\epsilon,&\epsilon\ne0,\\N,&\epsilon=0,\end{cases}
$$

$$
\frac{\chi(t_i,t)}{r_{H,i}}
=\frac{\int_{t_i}^t c\,dt'/a(t')}{c/(a_iH_i)}
=\int_0^Ne^{(\epsilon-1)n}\,dn
=\begin{cases}
(e^{(\epsilon-1)N}-1)/(\epsilon-1),&\epsilon\ne1,\\
N,&\epsilon=1.
\end{cases}
$$

光程始终增加。以 $\epsilon=0$ 为例，$r_H/r_{H,i}=e^{-N}$ 缩小，而 $\chi/r_{H,i}=1-e^{-N}$ 增加并趋近 1。这一有限积分从指定的 $t_i$ 开始，不等同于已经知道宇宙全部过去历史后的粒子视界。实验把光程画成 $\log_{10}(1+\chi/r_{H,i})$，以便保留起点的零；这与其它曲线的普通对数纵轴已分别标注。

当 $\epsilon>0$，消去 $N$ 可得 $a/a_i=[1+\epsilon H_i(t-t_i)]^{1/\epsilon}$。$\epsilon<1$ 的幂指数大于 1，仍会加速。$\epsilon=0$ 的指数膨胀没有自动退出机制；增加一个结束时刻只是指定背景的终点，还没有说明怎样回到热宇宙。

## 3 · 标量场如何真正驱动背景

考虑平直 FRW 中一个最小耦合、标准正动能的标量场。用度规号差 $(-,+,+,+)$，作用量是

$$
S=\int d^4x\sqrt{-g}\left[
\frac{M_{\rm Pl}^2}{2}R-\frac12g^{\mu\nu}\partial_\mu\phi\,\partial_\nu\phi-V(\phi)
\right].
$$

对均匀背景，能量密度、压强及方程为

$$
\rho_\phi=\frac12\dot\phi^2+V,\quad
p_\phi=\frac12\dot\phi^2-V,\quad
3M_{\rm Pl}^2H^2=\rho_\phi,\quad
\ddot\phi+3H\dot\phi+V_{,\phi}=0.
$$

将最后一式乘 $\dot\phi$，立即得到
$\dot\rho_\phi=-3H\dot\phi^2=-3H(\rho_\phi+p_\phi)$，说明场方程与能量守恒一致。再对 Friedmann 约束求导：

$$
\dot H=-\frac{\dot\phi^2}{2M_{\rm Pl}^2},\qquad
\epsilon_H=\frac{\dot\phi^2}{2M_{\rm Pl}^2H^2}
=\frac{3\dot\phi^2}{\dot\phi^2+2V}.
$$

所以加速需要 $\dot\phi^2<V$。这比完整慢滚条件弱：慢滚通常还要求 $\dot\phi^2/2\ll V$，以及 $\ddot\phi$ 相对 $3H\dot\phi$ 可忽略。不能只看到负压，就把全部慢滚近似都当成已成立。背景推导与质量约定可对照 [PDG 暴胀综述第 23.2 节](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-inflation.pdf)。

实验选择 $V=\tfrac12m^2\phi^2$，令

$$
u=\frac{\phi}{M_{\rm Pl}},\qquad v=\frac{du}{dN},\qquad
\epsilon_H=\frac{v^2}{2}.
$$

利用 $\ddot\phi=M_{\rm Pl}H^2(v_N-\epsilon_Hv)$，将场方程和约束合起来：

$$
\boxed{
u_N=v,\qquad
v_N=-(3-v^2/2)\left(v+\frac2u\right),\qquad
\frac{d\ln(H/H_i)}{dN}=-\frac{v^2}{2}.
}
$$

约束另给出

$$
\frac{H}{m}=\frac{u}{\sqrt{2(3-v^2/2)}},\qquad
\left(\frac H{H_i}\right)_{\rm constraint}
=\frac u{u_i}\sqrt{\frac{3-v_i^2/2}{3-v^2/2}}.
$$

$m$ 决定绝对能量和时间尺度，但这些以 $N$ 为时间、以 $H_i$ 为归一化的背景曲线不需要先指定 $m$。程序同时积分 $\ln(H/H_i)$，并与代数约束比较；两条计算路线的差为数值误差提供诊断。

## 4 · 退出要由方程找到，不能预先画在 √2

程序从给定的 $u_i,v_i$ 出发，逐步积分至第一次 $\epsilon_H=1$。若初始 $v_i>0$，场可以先向势能更高处运动，再掉头下落；同一个起始位置并不保证相同的总膨胀。比较的四种步长为 $\Delta N=0.1,0.05,0.025,0.0125$，完整图和阶段表使用 $0.025$。

每个 RK4 步都保留起点、三组中间状态、四个导数和终点。一旦跨过 $\epsilon_H=1$，固定该步起点，对步长二分，重新积分每个试探；用首次交点结束这条轨道。二分区间宽小于 $10^{-11}$，表示交点在**这一条数值轨道**中的定位精度；它不能让前面几千步的离散误差一起消失。最细步长也是数值结果，不是精确答案。

参考 $u_i=15,v_i=0$ 得到 $N_{\rm end}\approx57.121978$、$u_{\rm end}\approx1.00934$。为什么常见慢滚估计给的不是这个值？在慢滚近似中

$$
3H\dot\phi\simeq-V_{,\phi},\qquad
3M_{\rm Pl}^2H^2\simeq V,\qquad
\epsilon_V=\frac{M_{\rm Pl}^2}{2}\left(\frac{V_{,\phi}}V\right)^2,\quad
\eta_V=M_{\rm Pl}^2\frac{V_{,\phi\phi}}V.
$$

二次势给出 $\epsilon_V=\eta_V=2/u^2$、$u_N\simeq-2/u$，因此

$$
u(N)^2\simeq u_i^2-4N,\qquad
u_{\rm end,SR}\simeq\sqrt2,\qquad
N_{\rm end,SR}\simeq\frac{u_i^2-2}{4}=55.75.
$$

最后一步是用 $\epsilon_V\simeq\epsilon_H$ 估计退出，而退出附近慢滚已经不精确；初始静止也不是慢滚吸引子上的速度。这些差别都有物理来源。实验同时画 $\epsilon_H$ 和 $\epsilon_V$，让误差显现出来。它在首次退出后停止，尚未计算再热。

## 5 · 涨落从哪里来：先解一个量子模式

背景方程只告诉我们均匀场怎样动，还没有产生上一课的随机密度场。先考虑一个明确的可解近似：精确 de Sitter 背景中的自由、无质量标量测试场 $\varphi$，忽略其对背景的反作用。它不必就是驱动背景的场。

共形时间满足 $d\tau=dt/a$，取 $\tau<0$ 且 $a=-1/(H\tau)$。将傅里叶模式重标度为 $v_k=a\varphi_k$，运动方程成为

$$
v_k''+\left(k^2-\frac{a''}{a}\right)v_k=0,
\qquad \frac{a''}{a}=\frac2{\tau^2}.
$$

撇号在本节专指 $\tau$ 导数，区别于前面的 $N$ 导数。对初始处于 $|k\tau|\gg1$ 的模式，选择趋于平直时空正频率真空的解

$$
v_k(\tau)=\frac{e^{-ik\tau}}{\sqrt{2k}}
\left(1-\frac{i}{k\tau}\right).
$$

它满足方程及 Wronskian 归一化 $v_kv_k^{*'}-v_k'v_k^*=i$。因此

$$
|\varphi_k|^2=\frac{|v_k|^2}{a^2}
=\frac{H^2}{2k^3}(1+k^2\tau^2),\qquad
\Delta_\varphi^2=\frac{k^3|\varphi_k|^2}{2\pi^2}
=\left(\frac H{2\pi}\right)^2(1+k^2\tau^2).
$$

当 $|k\tau|\ll1$，模式振幅趋于常数，无量纲谱趋于 $(H/2\pi)^2$，与 $k$ 无关。这里“冻结”是模式解的行为；仅凭这个计算还没有完成量子到经典随机性的全部解释。

还有一个容易遗漏的因子：在 $k=aH$ 即 $|k\tau|=1$ 的瞬间，括号为 2；常用的“在哈勃尺度离开时取 $H_*$”是用该时刻背景参数表述之后的冻结谱，并非把精确模式在那个瞬间的振幅当作已达到渐近值。

对于真正驱动背景的场，标量场涨落与度规扰动耦合，不能一律使用测试场方程。设空间度规标量部分为 $a^2(1+2C)\delta_{ij}$，时间切片改变 $t\mapsto t+\delta t$ 时

$$
\delta\phi\mapsto\delta\phi-\dot\phi\,\delta t,\qquad
C\mapsto C-H\delta t.
$$

于是组合

$$
Q=\delta\phi-\frac{\dot\phi}{H}C,\qquad
\mathcal R=C-\frac H{\dot\phi}\delta\phi=-\frac H{\dot\phi}Q
$$

不受这一线性切片变换影响。完整线性约束消去后，$v_k=aQ_k$ 满足 Mukhanov–Sasaki 方程

$$
v_k''+\left(k^2-\frac{z''}{z}\right)v_k=0,\qquad z=\frac{a\dot\phi}{H}.
$$

测试场的 $a''/a$ 与这里的 $z''/z$ 不能混用。对标准单场、慢滚吸引子、绝热扰动和上述真空选择，得到领先阶冻结谱

$$
\mathcal P_{\mathcal R}(k)\simeq
\left(\frac H{\dot\phi}\right)^2\left(\frac H{2\pi}\right)^2
=\frac{H^2}{8\pi^2\epsilon_HM_{\rm Pl}^2}\bigg|_* .
$$

这里 $\mathcal P_{\mathcal R}$ 是无量纲谱，对应上一课的 $\Delta_{\mathcal R}^2$。规范变量、模式方程与适用条件见 [PDG 暴胀综述第 23.3 节](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-inflation.pdf)。当 $\dot\phi=0$，均匀场不能充当时间标尺，$\mathcal R=-HQ/\dot\phi$ 的写法退化；不能把精确 de Sitter 模式的 $\epsilon_H=0$ 代入最后一式，宣称物理曲率谱必然无穷大。本页静止初值也不直接输出曲率谱。

## 6 · 从时间变化得到谱倾斜

定义向未来的 $\epsilon_1=\epsilon_H$、$\epsilon_2=d\ln\epsilon_1/dN$。模式离开哈勃尺度时 $k=aH$，因此

$$
\frac{d\ln k}{dN}=1-\epsilon_1,\qquad
n_s-1\equiv\frac{d\ln\mathcal P_{\mathcal R}}{d\ln k}
\simeq-2\epsilon_1-\epsilon_2.
$$

最后一式保留慢滚的一阶项。由 $\epsilon_V\propto(V'/V)^2$ 和 $\phi_N\simeq-M_{\rm Pl}^2V'/V$，

$$
\epsilon_2\simeq4\epsilon_V-2\eta_V,\qquad
n_s-1\simeq-6\epsilon_V+2\eta_V.
$$

所以只写 $n_s-1=-2\epsilon$ 通常漏掉了曲率谱中 $1/\epsilon$ 的时间变化。标准单场的张量谱按两个偏振的通常总谱约定为

$$
\mathcal P_t\simeq\frac{2H^2}{\pi^2M_{\rm Pl}^2},\qquad
r=\frac{\mathcal P_t}{\mathcal P_{\mathcal R}}\simeq16\epsilon_V,\qquad
n_t\simeq-2\epsilon_V\simeq-\frac r8.
$$

这些是指定理论与状态下的关系，不是所有早期宇宙模型共有的恒等式。

以二次势为例，若一个模式离开哈勃尺度后**还剩** $N_*$ 个 e-fold，慢滚给出

$$
u_*^2\simeq4N_*+2,\qquad
n_s\simeq1-\frac2{N_*+1/2},\qquad
r\simeq\frac8{N_*+1/2}.
$$

$N_*$ 向结束倒数，与实验从开始向前计数的 $N$ 不同。取 $N_*=60$，得到 $n_s\simeq0.96694$、$r\simeq0.13223$。这说明模型能给出具体、可被否定的预言。作为有固定版本的历史比较，[2021 年发表的 BK18 联合分析](https://arxiv.org/abs/2110.00483) 在其模型与前景假设下给出 $r_{0.05}<0.036$ 的 95% 置信上限；该二次势例的 $r$ 已明显过大。这里不把历史分析冒充持续更新的最新联合约束。

## 7 · 退出不等于再热

场停止加速，只表示能量分配跨过一个阈值。要恢复热历史，还需要把场能转移给粒子并使其达到热平衡。在二次势最低点附近，若振荡频率远高于膨胀率，周期平均动能与势能相等，故 $\langle p_\phi\rangle\simeq0$，场平均起来像无压物质。

再作弱耦合、微扰衰变、常衰变率 $\Gamma$ 的近似，可写

$$
\dot\rho_\phi+3H\rho_\phi=-\Gamma\rho_\phi,\qquad
\dot\rho_r+4H\rho_r=\Gamma\rho_\phi.
$$

相加后内部能量交换抵消，剩下总能量守恒。若辐射已热化，$\rho_r=(\pi^2/30)g_*T^4$，并以 $H\sim\Gamma$ 估计转化阶段的尺度，就有

$$
T_{\rm reh}\sim
\left(\frac{90}{\pi^2g_*}\right)^{1/4}\sqrt{\Gamma M_{\rm Pl}}.
$$

这不是只凭“发生了暴胀”就确定的温度；耦合、非微扰预热、热化时间和自由度都可能改变过程。本页场实验没有求解这些能量交换方程。

从某个枢轴模式到今天的尺度连接也包含再热：

$$
\frac{k}{a_0H_0}
=e^{-N_*}\frac{a_{\rm end}}{a_{\rm reh}}
\frac{a_{\rm reh}}{a_0}\frac{H_*}{H_0}.
$$

若再热阶段可用平均常数 $w_{\rm reh}$ 表示，则
$\rho\propto a^{-3(1+w_{\rm reh})}$；热化后还需使用熵自由度连接温度与尺度因子。改变这一段历史，会改变同一个今日 $k$ 对应的 $N_*$。因此 $N_*=60$ 是例题条件，不能由“暴胀”一词直接推出来。

## 8 · 晚期暗能量：先从守恒算密度

对不与其它成分交换能量的暗能量，$\dot\rho_{\rm de}+3H(1+w)\rho_{\rm de}=0$。一般解为

$$
\frac{\rho_{\rm de}(a)}{\rho_{\rm de}(1)}
=\exp\left[-3\int_1^a(1+w(a'))\,d\ln a'\right].
$$

常数 $w$ 时，密度比简化为 $a^{-3(1+w)}$。本页晚期模型忽略辐射与曲率，今天的物质比例为 $\Omega_m$，其余明确取 $\Omega_{\rm de}=1-\Omega_m$：

$$
E^2(a)=\Omega_m a^{-3}+(1-\Omega_m)a^{-3(1+w)},
\qquad
q(a)=\frac12\left[1+3w\,\Omega_{\rm de}(a)\right].
$$

由 $q=0$ 可得加速转折条件

$$
\rho_m=-(1+3w)\rho_{\rm de},\qquad
a_{\rm tr}=
\left[\frac{-\Omega_m}{(1+3w)(1-\Omega_m)}\right]^{-1/(3w)}.
$$

这个正转折要求存在暗能量，且 $w<-1/3$。纯物质或 $w\ge-1/3$ 没有这样的有限加速转折。等密度则是另一个条件：

$$
a_{\rm eq,de}=\left[\frac{\Omega_m}{1-\Omega_m}\right]^{-1/(3w)}.
$$

对 $\Omega_m=0.3,w=-1$，得到 $a_{\rm tr}\simeq0.598408$，等密度点约为 $0.753947$。随 $a$ 增加，先开始加速，再达到等密度。因为 $d\ln r_H/d\ln a=q$，晚期图上共动哈勃半径的最高点正对应加速转折。

两种条件在特殊参数下也可能重合：$w=-2/3$ 时 $-(1+3w)=1$，加速恰在两种密度相等时开始。实验把重合的标记合并，同时保留两种条件的账本。

$w<-1$ 时暗能量密度随膨胀增大，足够晚时 $\dot H$ 也可为正。但标准正动能标量场满足 $\rho_\phi+p_\phi=\dot\phi^2\ge0$，在 $\rho_\phi>0$ 时不能得到 $w_\phi<-1$。实验中的这一参数区只规定现象学背景，不能悄悄套用前面的同一标量场解释。

距离是对 $1/H$ 的积分，增长还需要扰动方程，单一背景曲线不唯一决定暗能量机制。有关守恒、背景与增长的分工，见 [PDG 暗能量综述第 28.2 节](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-dark-energy.pdf)。本实验没有把任何参数输入当成新观测结果。

## 9 · 四道迁移题与完整解答

<details class="answer" markdown="1">
<summary>题 1：N=60 时，εH=0.1 与恒 H 的半径收缩相同吗？</summary>

两者的尺度因子都增长 $e^{60}$，但 $\epsilon_H=0.1$ 时 $H/H_i=e^{-6}\approx0.00247875$，所以

$$
\frac{r_H}{r_{H,i}}=e^{-54}\approx3.53263\times10^{-24},
\qquad q=-0.9.
$$

恒 $H$ 的结果是 $e^{-60}\approx8.75651\times10^{-27}$。前者的末半径是后者的 $e^6\approx403.429$ 倍，两者都在缩小，只是收缩程度不同。累计光程分别为 $(1-e^{-54})/0.9$ 与 $1-e^{-60}$，都增加。

当 $\epsilon_H\to1$，用 $e^x=1+x+O(x^2)$ 可得光程表达式连续趋于 $N$；不能因分母出现零就判成发散。
</details>

<details class="answer" markdown="1">
<summary>题 2：二次势在 φ=√2 Mpl 退出，是精确命题吗？</summary>

精确条件是 $\epsilon_H=v^2/2=1$，即下坡轨道首次到达 $v=-\sqrt2$；它并不规定 $u$。只有使用 $v\simeq-2/u$ 的慢滚近似，才得到 $u\simeq\sqrt2$。同理，$N\simeq(u_i^2-2)/4$ 还依赖这段近似能持续成立。

参考实验 $u_i=15,v_i=0$ 的慢滚估计为 $55.75$，真实背景数值积分约为 $57.121978$，退出 $u$ 约为 $1.00934$。这里“真实”指求解完整背景方程，数值结果仍有离散误差。将步长逐次减半，退出位置趋于稳定；把二分区间做得再窄也不能修复粗步长传播误差。

初始 $v_i=1$ 还会先上坡，进一步改变退出前的总膨胀。仅指定势函数和场位置，不足以确定二阶场方程的全部初值。
</details>

<details class="answer" markdown="1">
<summary>题 3：为什么精确 de Sitter 的测试场谱有限，却不能直接令曲率谱公式 εH=0？</summary>

测试场方程给出

$$
\Delta_\varphi^2=\frac{H^2}{4\pi^2}(1+k^2\tau^2)
\longrightarrow\frac{H^2}{4\pi^2}.
$$

这个极限不需要用背景场作时钟。要把 $Q$ 换成曲率扰动，却使用了 $\mathcal R=-HQ/\dot\phi$；$\dot\phi=0$ 时，均匀场切片不再给出唯一时间标记。失效的是这一步变量转换的条件，不能将除零结果当成可观测无穷大。

另外，在 $|k\tau|=1$ 的瞬间，测试场谱是最终冻结谱的两倍。引用冻结谱时在星号处取背景 $H_*$，与声称模式恰在交点瞬间就完全冻结，是两件不同的事。
</details>

<details class="answer" markdown="1">
<summary>题 4：晚期模型若改成 w(a)=w0+wa(1−a)，密度与加速方程怎样变？</summary>

先积分守恒，而不是把常数 $w$ 的幂指数直接替换为 $w(a)$：

$$
\int_1^a[1+w(a')]\,d\ln a'
=(1+w_0+w_a)\ln a-w_a(a-1).
$$

因此

$$
\frac{\rho_{\rm de}(a)}{\rho_{\rm de}(1)}
=a^{-3(1+w_0+w_a)}e^{3w_a(a-1)}.
$$

再把它代入 $E^2$。若同时保留辐射和曲率，

$$
E^2=\Omega_ra^{-4}+\Omega_ma^{-3}+\Omega_Ka^{-2}
+\Omega_{\rm de}a^{-3(1+w_0+w_a)}e^{3w_a(a-1)},
$$

$$
q(a)=\frac{
2\Omega_ra^{-4}+\Omega_ma^{-3}
+[1+3w(a)]\Omega_{\rm de}\rho_{\rm de}(a)/\rho_{\rm de}(1)
}{2E^2(a)}.
$$

曲率没有直接进入加速度方程的分子，却通过 $E^2$ 改变分母。$w_a=0$ 才恢复实验的常 $w$ 形式；$w_0=-1,w_a=0$ 才回到 $\Lambda$。这种参数化主要用来描述有限红移范围，不能凭它对遥远未来的外推宣布一种确定结局。
</details>

## 10 · 用哪些观测区分机制？

超新星距离、BAO 标尺和 CMB 几何帮助约束膨胀史；结构增长、红移空间畸变与透镜检查同一背景下的扰动。早期模型还需同时面对标量谱、张量谱、非高斯性和再热历史。把相同的 $q$ 拟合出来，只完成了这些检验中的一部分。

这条宇宙学路线到这里连接了背景、热历史、结构增长和两种加速机制。继续可进入 [规范场与相互作用](pp-01-gauge.html)、[场论的正则量子化](qft-01-canonical.html)，或 [蒙特卡洛与格点方法](comp-04-monte-carlo-lattice.html)；前沿模型要在相应动力学和观测条件下另行训练。
