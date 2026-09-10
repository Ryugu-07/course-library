# 随机过程 IV · 布朗运动与鞅（一瞥）

> 从终点无法判断一条路径是否曾经越界。布朗运动让这个差别可以精确计算；鞅则说明，何时能把固定时刻的条件期望结论延伸到随机停止时刻。本页保留入门定位，但把极限、路径和停时各自需要的条件写出来。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：最大值看到的，比终点更多

### 1. 本页要学会什么

本页实验只处理从 $B_0=0$ 出发的**标准布朗运动**。你要区分四件事：终点事件 $\{B_T\ge a\}$、路径事件 $\{M_T\ge a\}$（其中 $M_T=\max_{0\le s\le T}B_s$）、首次通过时间 $\tau_a=\inf\{t\ge0:B_t\ge a\}$，以及密度 $f_{\tau_a}$。固定 seed 的折线只负责让“路径可能先越界、最后又回来”可见；反射原理和解析公式才是定理证据。

先写下预测，再打开实验：

1. 当 $a>0,T>0$ 时，$P(M_T\ge a)$ 是 $P(B_T\ge a)$ 的几倍？
2. $P(\tau_a\le T)$ 应该等于最大值事件、终点事件，还是密度在 $T$ 的数值？
3. 若 $a\le0$ 或 $T=0$，起点 $B_0=0$ 会怎样改写上面的连续公式？

### 2. 反射原理账本

对正阈值 $a>0$，把所有在 $T$ 前首次到达 $a$、但最终落在 $a$ 以下的路径，在首次到达时刻之后关于水平线 $a$ 反射。反射后的终点落在 $a$ 以上，且这一步保持 Wiener 路径的概率结构，因此

$$
P(M_T\ge a)=2P(B_T\ge a)=2\left[1-\Phi\left(\frac a{\sqrt T}\right)\right],
\qquad a>0,\ T>0.
$$

又因为 $\{\tau_a\le T\}=\{M_T\ge a\}$，所以首次通过时间的 CDF 是

$$
F_{\tau_a}(T)=2\left[1-\Phi\left(\frac a{\sqrt T}\right)\right],
\qquad
f_{\tau_a}(t)=\frac{a}{\sqrt{2\pi}\,t^{3/2}}\exp\left(-\frac{a^2}{2t}\right),\quad t>0.
$$

这里的“密度”不是把 CDF 再除以 $T$，而是对上式真正求导。特别是终点越界概率只看一个时刻，而最大值事件看整条连续路径；二者差的正是那些“先上穿、后回落”的路径。

### 3. 边界、反例与迁移

- 若 $a<0$，以及按 $\tau_a=\inf\{t\ge0:B_t\ge a\}$ 的约定取 $a=0$，起点已经在阈值上方或阈值处，所以 $\tau_a=0$ 几乎处处，CDF 在 $0$ 有原子，不能继续声称上面的 $t>0$ 密度覆盖全部分布。
- 若 $T=0$，$B_0=M_0=0$：$a>0$ 时两个越界事件概率都是 $0$；$a\le0$ 时都是 $1$。因此不能把 $T>0$ 的连续正态端点公式机械代入 $T=0$，也不能把 $2P(B_0\ge a)$ 当作一般反射定理。
- 反例：一条离散采样路径没有越过 $a$，不代表连续路径没有越过；线性插值也不等于 Brownian 桥的精确条件分布。固定 seed 图像是直觉材料，不是有限 Monte Carlo 对定理的证明。
- 迁移：带漂移的 $X_t=\mu t+\sigma B_t$（$\sigma>0$）满足越界条件 $B_t\ge(a-\mu t)/\sigma$，减去漂移会把常数阈值变成移动边界，不能再直接套固定阈值反射式；离散随机游走的首次越界还会遇到跳跃和格点 overshoot，不能直接照抄连续密度。

### 4. 动手实验：预测门、解析账本和固定路径

实验默认 $a=1,T=1$。答案提交前，理论读数和路径图保持隐藏；提交后可以切换 $a$、$T$，直接查看解析概率、首次通过密度和固定 seed 的三条离散路径。改变 $a$ 保留网格值；改变 $T$ 则把同一单位区间的样本按 $\sqrt T$ 缩放，并不是截取某条更长路径的前缀。程序使用有限精度伪随机数，折线不作为 Monte Carlo 频率估计。

<div class="learning-lab" data-learning-lab="brownian-first-passage" markdown="1">

**JavaScript 失效时的静态读法：** 默认 $a=T=1$。记 $\Phi$ 为标准正态 CDF，则

$$
P(B_1\ge1)=1-\Phi(1)\approx0.1587,
\quad P(M_1\ge1)=P(\tau_1\le1)=2[1-\Phi(1)]\approx0.3173,
$$

并且

$$
f_{\tau_1}(1)=\frac{e^{-1/2}}{\sqrt{2\pi}}\approx0.2420.
$$

边界读法是：$a\le0$ 时 $\tau_a=0$ 有点质量；$T=0,a>0$ 时三种越界/CDF 数值为 $0$，而 $T=0,a\le0$ 时起点事件为 $1$。固定 seed 路径只用于视觉检查“最大值不由终点完全决定”，不用于证明反射原理。程序还保留概率的自然对数：例如 $a=3,T=.05$ 时最大值越界概率约为 $4.8464\times10^{-41}$，不能因为小数显示不足就当成零。解析公式和其数值求值应分开，反射差中的末位舍入不代表定理失效。

</div>

</section>

## 1. 从随机游走到布朗运动：极限究竟在哪里？

设 $\xi_k$ 独立同分布、均值 $0$、方差 $1$，$S_n=\sum_{k=1}^n\xi_k$。把 $n^{-1/2}S_{\lfloor nt\rfloor}$ 作线性插值。**Donsker 不变原理**说明，它作为 $C([0,T])$ 上的随机函数，依分布趋向标准布朗运动。这里只要求有限方差；对称 $\pm1$ 步长是最直接的例子。

普通 CLT 可以解释单个时刻的正态极限，但**各时刻的极限不自动给出连续路径空间中的收敛**；还需要联合有限维分布及紧性等论证。步长满足 $(\Delta x)^2/\Delta t\to1$ 给单位方差率，若趋于常数 $\sigma^2>0$，则得到 $\sigma B_t$；不是只有字面上的 $\Delta x=\sqrt{\Delta t}$ 才能出现非平凡极限。

### 1.1 定义与信息流

标准布朗运动满足 $B_0=0$，具有几乎必然连续的轨道，并且对 $0\le s<t$，

$$
B_t-B_s\sim N(0,t-s),
$$

不相交时间区间的增量独立。讨论相对于信息流 $(\mathcal F_t)$ 的布朗运动时，还要求 $B_t$ 适应于它，且 $B_t-B_s$ 独立于 $\mathcal F_s$。不能任意把未来信息提前加入过滤后仍宣称鞅性质成立。

也可以先构造相容的高斯有限维分布，再用
$\mathbb E|B_t-B_s|^p=C_p|t-s|^{p/2}$（$p>2$）
和连续性定理取得连续版本。修改版本指每个固定时刻几乎必然相等；涉及整条轨道时还须留意零概率集合与量词。

由增量独立性，

$$
\mathbb EB_t=0,\quad \operatorname{Var}(B_t)=t,\quad
\operatorname{Cov}(B_s,B_t)=\min(s,t).
$$

例如 $s\le t$ 时，
$\mathbb E[B_sB_t]=\mathbb E[B_s^2]+\mathbb E[B_s(B_t-B_s)]=s$。
布朗运动本身不平稳，因为方差随时间变化；平稳的是增量分布。

### 1.2 缩放、不可导与二次变差

对 $c>0$，过程 $(B_{ct})_{t\ge0}$ 与 $(\sqrt c\,B_t)_{t\ge0}$ **同分布**，不是在同一条样本上处处相等。连续版本以概率 $1$ 处处不可导，并在任意固定紧区间上具有任意 $\alpha<1/2$ 阶的 Hölder 连续性；这些是路径定理，有限分辨率的折线不能证明它们。

给定 $[0,T]$ 上一列确定性分割，网格大小 $|\Pi_n|\to0$，令
$Q_n=\sum_i(B_{t_{i+1}}-B_{t_i})^2$。高斯增量独立且 $\operatorname{Var}(Z^2)=2v^2$（$Z\sim N(0,v)$），所以

$$
\mathbb EQ_n=T,\qquad
\operatorname{Var}(Q_n)=2\sum_i(\Delta t_i)^2
\le2T|\Pi_n|\longrightarrow0.
$$

因此 $Q_n\to T$ 在 $L^2$ 中成立。对二进制等分，偏离固定误差的概率可求和，Chebyshev 与 Borel–Cantelli 进一步给出几乎必然收敛。不能把这个结论改成“所有任意选取的随机分割都自动有同一种收敛”。

连续且有限全变差的函数满足
$\sum(\Delta f)^2\le\max|\Delta f|\sum|\Delta f|\to0$。
布朗运动在 $T>0$ 时有非零二次变差，因此几乎必然不是有限全变差路径。符号“$(dB)^2=dt$”是这种极限规律在随机积分中的记法，不是普通微分的代数恒等式。

## 2. 反射原理、首次通过与网格漏检

<div class="brownian-static" role="region" tabindex="0" aria-label="布朗反射静态示意图，可横向滚动" markdown="1">
<figure class="plot" markdown="1">
![首次到达后反射的折线示意，以及最大值和终点事件的解析概率曲线](assets/img/stoch-04-brownian.svg)
<figcaption><span class="fig-id">图 2.1</span>左图是人为选定的折线反射示意，不是完整布朗样本；它说明反射如何交换两个终点。右图是正阈值 a=1 时的解析概率，两条曲线始终相差两倍。手机可横向滚动。</figcaption>
</figure>
</div>
<style>
.brownian-static{max-width:100%;overflow-x:auto}.brownian-static figure{width:1100px;max-width:none;margin:0}.brownian-static img{width:1100px;max-width:none}.brownian-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style>

对 $a>0$，连续性保证首次达到“$\ge a$”时恰好等于 $a$。在 $\tau_a$ 有限的事件上，停时之后的增量具有独立标准布朗运动的条件分布，这是**强 Markov 性**，比仅在确定时刻成立的独立增量更强。再用增量正负对称性，首次到达后的反射保持路径律，由此得到前面列出的最大值公式；这里不需要预先假定必然到达。

### 2.1 几乎必然到达，期望却无穷

当 $T\to\infty$，$2[1-\Phi(a/\sqrt T)]\to1$，所以 $\tau_a<\infty$ 几乎必然。但

$$
\Pr(\tau_a>t)=2\Phi(a/\sqrt t)-1
\sim\sqrt{\frac2\pi}\,\frac a{\sqrt t},
\qquad
\mathbb E\tau_a=\int_0^\infty\Pr(\tau_a>t)\,dt=\infty.
$$

“最终会到”不等于“平均等待有限”。密度积分为 $1$，并不意味着它的一阶矩也有限。布朗缩放还给 $\tau_a\overset d=a^2\tau_1$。

### 2.2 端点都低于阈值，桥仍可能越过

在长为 $\Delta t>0$ 的一个区间，两端值为 $x,y<a$。给定这两个端点，内部是 Brownian 桥，越过 $a$ 的条件概率为

$$
p_{\rm bridge}
=\exp\left[-\frac{2(a-x)(a-y)}{\Delta t}\right].
$$

这是反射后的终点密度与原终点密度之比：

$$
\frac{\exp[-(2a-y-x)^2/(2\Delta t)]}
{\exp[-(y-x)^2/(2\Delta t)]}
=p_{\rm bridge}.
$$

若任一端点已经达到阈值，概率为 $1$。给定**全部网格值**后，各个区间的桥条件独立；若网格均低于 $a$，至少一个区间发生连续越界的条件概率为
$1-\prod_i(1-p_i)$。实验第二份账本显示这个量，计算时用对数保留很小的跨越概率。

例如 $x=y=0,a=1,\Delta t=1$，尽管线性插值整段为零，桥仍以 $e^{-2}\approx.1353$ 的概率上穿 $1$。反过来，网格已经上穿只说明连续路径也已上穿；首次**网格**达标时刻通常晚于真实首次通过时间。

这些条件公式属于理想高斯过程。固定种子、有限位数的 Box–Muller 生成和折线仅是可复现数值展示，不能把所有连续越界位置直接从三个样本恢复出来。

## 3. 鞅：条件期望与信息

离散过程 $(M_n)$ 关于过滤 $(\mathcal F_n)$ 是鞅，要求：

- 适应性：$M_n$ 是 $\mathcal F_n$ 可测的；
- 可积性：$\mathbb E|M_n|<\infty$；
- $\mathbb E[M_{n+1}\mid\mathcal F_n]=M_n$。

不等号“$\ge$”给下鞅，“$\le$”给上鞅。它们描述**条件期望方向**，不保证每条路径或每一步都向相同方向走。过滤表示当前可用的信息，不一定只能取过程自身的自然历史。

若 $\xi_{n+1}$ 独立于 $\mathcal F_n$、等概率为 $\pm1$，$S_n=\sum_{k=1}^n\xi_k$，则

$$
S_n,\qquad S_n^2-n,\qquad
\frac{e^{\theta S_n}}{(\cosh\theta)^n}
$$

都是鞅。第二式由
$\mathbb E[(S_n+\xi_{n+1})^2\mid\mathcal F_n]=S_n^2+1$；
第三式由 $\mathbb Ee^{\theta\xi_{n+1}}=\cosh\theta$。

连续时间下，要求对所有 $s\le t$ 有 $\mathbb E[M_t\mid\mathcal F_s]=M_s$。相对于布朗信息流，

$$
B_t,\qquad B_t^2-t,\qquad
\exp(\theta B_t-\theta^2t/2)
$$

也都是鞅；高斯独立增量可以逐项验证。平方减补偿的形式在离散和连续时间中互相对应。

## 4. 可选停时：必须写出的条件

非负整数值随机时间 $\tau$ 是停时，若 $\{\tau\le n\}\in\mathcal F_n$：到第 $n$ 步时就能决定是否已经停止。“第一次达到目标”是停时；“最后一次达到目标，然后才结束观察”通常需要未来信息，不能直接当作停时。

**有界停时版。** 若 $(M_n)$ 是鞅，且 $\tau\le N$ 几乎必然，其中 $N$ 是确定整数，则

$$
\mathbb E M_\tau=\mathbb E M_0.
$$

证明把停止值写成

$$
M_\tau=M_0+\sum_{k=1}^N
\mathbf1_{\{\tau\ge k\}}(M_k-M_{k-1}).
$$

指标 $\mathbf1_{\{\tau\ge k\}}$ 在第 $k-1$ 步已知；对 $\mathcal F_{k-1}$ 取条件期望，每项为零。

对无界但几乎必然有限的 $\tau$，可以先对 $\tau\wedge n$ 用有界版，再考虑令 $n\to\infty$。**不能只凭几乎必然收敛就交换极限和期望。** 一项充分条件是停止后的族 $\{M_{\tau\wedge n}\}_{n\ge1}$ 一致可积：

$$
\lim_{K\to\infty}\sup_n
\mathbb E\!\left[|M_{\tau\wedge n}|
\mathbf1_{\{|M_{\tau\wedge n}|>K\}}\right]=0.
$$

这保证 $L^1$ 收敛并保住期望。统一有界的停止值就是一个容易检查的特例。另一个实用充分条件是 $\mathbb E\tau<\infty$ 且鞅增量有统一绝对界；此时用可积的 $|M_0|+C\tau$ 控制停止过程。

### 4.1 反例：公平游走等到第一次赚到一元

从 $S_0=0$ 出发的对称整数游走，取 $\tau=\inf\{n:S_n=1\}$。上一页的常返性说明 $\tau<\infty$ 几乎必然，但 $S_\tau=1$，所以
$\mathbb ES_\tau=1\ne0$。这不反驳 OST：停止过程不一致可积，且 $\mathbb E\tau=\infty$。若误把“几乎必然最终停止”当作唯一条件，就会得出错误等式。

布朗运动等到首次到达 $a>0$ 也给出相同警示：$B_{\tau_a}=a$，不能无条件从 $\mathbb EB_t=0$ 推出 $\mathbb EB_{\tau_a}=0$。上面的长尾正好说明为何平均等待时间会出问题。

### 4.2 赌徒破产：先截断，再合法过极限

从本金 $i\in\{1,\ldots,N-1\}$ 出发的对称游走，在到 $0$ 或 $N$ 时停止。有限链的吸收论证保证 $\tau<\infty$ 几乎必然，且 $0\le S_{\tau\wedge n}\le N$。由有界停时和支配收敛，

$$
i=\mathbb ES_\tau=N\,\Pr_i(S_\tau=N),
\qquad \Pr_i(S_\tau=N)=i/N.
$$

对鞅 $S_n^2-n$ 先在 $\tau\wedge n$ 停止：

$$
\mathbb E(\tau\wedge n)=
\mathbb ES_{\tau\wedge n}^2-i^2\le N^2.
$$

左侧用单调收敛，右侧的平方用有界支配收敛，得到
$\mathbb E\tau=\mathbb ES_\tau^2-i^2=Ni-i^2=i(N-i)$。
这样没有先假定未知的期望有限再用它证明自己。

## 5. 几何布朗运动：一个明确的模型

设 $S_0>0$、$\mu,\sigma$ 为常数，定义

$$
S_t=S_0\exp\!\left((\mu-\sigma^2/2)t+\sigma B_t\right).
$$

正态矩母函数给出

$$
\mathbb ES_t=S_0e^{\mu t},\qquad
\operatorname{Var}(S_t)=S_0^2e^{2\mu t}(e^{\sigma^2t}-1).
$$

减去 $\sigma^2/2$ 是精确的指数矩补偿：$\mathbb Ee^{\sigma B_t}=e^{\sigma^2t/2}$；Jensen 不等式只能解释方向，不能单独给出这个系数。后续 Itô 引理会说明此过程满足 $dS_t=\mu S_t\,dt+\sigma S_t\,dB_t$。

这个模型具有独立正态的**对数增量**；$S_t$ 自身的增量通常既不独立也不平稳。这样的分布假设不等同于“有效市场”。在 Black–Scholes 模型中，还须区分真实概率下的漂移和风险中性定价测度下的漂移，并另给市场与无套利假设，不能从本页一个指数式就推出定价结论。

随机扩散方程也使用 $dB_t$，但数值生成算法可能采用随机 SDE、确定性概率流 ODE 或其他离散更新。不能断言每次 AIGC 采样都在生成一条布朗轨道。数学连接在于噪声的建模与离散化，具体算法须看实际方程。

## 6. 例题与练习

**例 1：零概率条件如何读？** $B_2\mid B_1=x$ 的一个正则条件分布版本为 $N(x,1)$，因此在该连续高斯条件核下，
$\Pr(B_2>1\mid B_1=1)=1/2$。因为 $\Pr(B_1=1)=0$，这里不是把两个事件概率直接相除。

**例 2：协方差。** $\operatorname{Var}(B_1+B_3)=1+3+2\min(1,3)=6$；独立的是不重叠增量，不是 $B_1$ 与 $B_3$。

### 练习 1：为什么“密度比概率大”并不矛盾？

对 $a=1$ 的首次通过密度，求它达到最大值的时间，并解释密度与 CDF 的单位。

<details class="answer" markdown="1">
<summary>展开推导</summary>

$\log f(t)=-\tfrac12\log(2\pi)-\tfrac32\log t-\tfrac1{2t}$，
导数为 $-3/(2t)+1/(2t^2)$，所以峰值在 $t=1/3$。一般阈值峰值在 $a^2/3$，密度峰高按 $1/a^2$ 缩放，可以超过 $1$。CDF 无单位且在 $[0,1]$；密度有“每单位时间”的量纲，只有积分才是概率。

</details>

### 练习 2：两端都没越界，桥会不会越界？

固定 $x=y=0,a=1$，比较区间长度 $1$ 和 $1/4$ 的条件越界概率。

<details class="answer" markdown="1">
<summary>展开推导</summary>

代入桥公式分别得到 $e^{-2}\approx.135335$ 和 $e^{-8}\approx.000335463$。缩短观察间隔且端点保持远离阈值，会大幅减小区间内漏检概率；线性插值在两种情况下都为零，却不能替代条件随机桥。若端点接近阈值，公式中的 $(a-x)(a-y)$ 也会变化，不能只看时间间隔。

</details>

### 练习 3：哪个停止论证成立？

比较“对称游走在首次到达 $+1$ 时停止”与“在首次到达 $-m$ 或 $+1$ 时停止”，其中 $m$ 是正整数。

<details class="answer" markdown="1">
<summary>展开推导</summary>

后一种停止位置有界，平移为区间 $[0,m+1]$ 的赌徒破产问题，从 $m$ 出发，达到 $+1$ 的概率为 $m/(m+1)$，达到 $-m$ 的概率为 $1/(m+1)$。停止值期望是 $m/(m+1)-m/(m+1)=0$，平均时长为 $m$。让 $m\to\infty$ 时，成功概率趋于 $1$，但罕见负值的幅度也增长，负向期望贡献并不消失。这正是缺少一致可积时不能交换极限与期望的具体机制。

</details>

依据与延伸：[MIT 的反射原理与首次通过讲义](https://ocw.mit.edu/courses/15-070j-advanced-stochastic-processes-fall-2013/aca1518a09539a09ddd37428ab0d0268_MIT15_070JF13_Lec7.pdf)、[MIT 的鞅与可选停时讲义](https://ocw.mit.edu/courses/18-440-probability-and-random-variables-spring-2014/95835880b8b2c186229980f4622897df_MIT18_440S14_Lecture35.pdf)。进一步学习：[Itô 积分](sde-01-ito.html)、[随机微分方程](sde-02-sde-diffusion.html)、[Black–Scholes 模型](sde-03-black-scholes.html)。这些基础页仍须分别建立积分、解和模型条件，不以“一瞥”代替后续课程。
