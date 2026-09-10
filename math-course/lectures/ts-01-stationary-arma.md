# 时间序列 I · 平稳性与 ARMA 模型

> 昨天的温度能帮助预测今天，但帮助有多大、能持续多久，需要一个明确的模型。本页从“规律是否随时间移动”出发，推导 AR/MA 的相关结构，再把预测均值与预测误差逐项算出来。**总体性质、有限样本诊断、未来预测是三件不同的事。**

<div data-learning-page></div>

先修：[矩、协方差与条件期望](prob-04-moments.html)、[最小二乘与回归](stat-05-regression.html)。只想先建立直觉，可以先做实验，再读第 2、3、6 节；根条件和 Wold 分解放在后面接上严格语言。

<section class="learning-layer" markdown="1" aria-labelledby="arma-learning-title">

## 学习层：一条样本能告诉我们多少？

<h3 id="arma-learning-title">先预测，再核对总体、样本和预测账</h3>

设冲击独立且服从 $N(0,1)$，均值和系数已知。先判断：

1. MA(1) 的 $|\theta|>1$ 是否意味着不平稳？
2. 总体 MA(1) 的 ACF 在 lag $>1$ 为零，样本也必须精确截尾吗？
3. 平稳模型的预测区间是否每一步都严格变宽？

<div class="learning-lab" data-learning-lab="arma-diagnostics" markdown="1">

### 无脚本也能核对的模型表

未启用 JavaScript 时，下面的模型表、推导、静态插图与展开题仍可阅读。

| 零均值模型，冲击方差 $\sigma^2>0$ | 本页采用的构造 | 总体方差 | 总体 ACF，$k\ge1$ |
|---|---|---|---|
| $X_t=\phi X_{t-1}+\varepsilon_t$，$\lvert\phi\rvert<1$ | 因果平稳解 | $\sigma^2/(1-\phi^2)$ | $\phi^k$ |
| 同一递推，$\lvert\phi\rvert\ge1$ | 从 $X_0=0$ 向前生成 | 随 $t$ 变化，不提供平稳方差证书 | 不套用上一行 |
| $X_t=\varepsilon_t+\theta\varepsilon_{t-1}$ | 有限 MA，对任意有限 $\theta$ 宽平稳 | $\sigma^2(1+\theta^2)$ | $k=1$ 为 $\theta/(1+\theta^2)$；$k>1$ 为 $0$ |

MA 的稳定因果逆另要求 $|\theta|<1$；不可逆不等于不平稳。AR 的“根在单位圆外”指本页的**因果平稳**条件；第 2 节会给出非因果反例，避免把范围扩大。

实验同时列出全部观测轨迹、总体与样本 ACF/PACF、未来 8 步预测账。AR 在 $|\phi|<1$ 时从准确的平稳高斯分布初始化；MA 使用独立的初始冲击。固定 seed 共用冲击流，增加观测数保留原有前缀，但样本均值与相关会重新计算。样本更长不保证这一次误差逐项减小。

### 怎样读图才不会过度推断

蓝色竖线是模型推导出的总体相关，金点是这一份有限样本的估计。前向非平稳 AR 不画总体相关线，**缺席表示不适用，不表示零**。红虚线 $\pm1.96/\sqrt n$ 仅是假设 iid 白噪声时、单个非零 lag 的渐近参考线；不是当前 AR/MA 的置信带，也不是“所有点同时有 95% 保证”。

预测区间使用已知参数和 iid 高斯冲击，只条件于观测 $X_1,\ldots,X_n$。MA 的一步预测会把看不见的末次冲击积分掉，不直接读取模拟器中的 $\varepsilon_n$。区间不含选模和参数估计误差。极大前向增长场景中，区间宽度相对预测值可能小到浮点端点无法区分；请读表中的条件标准差，不把重合的端点当成零风险。

</div>

</section>

## 1. 平稳性约束的是过程，不是一张图

**宽平稳**要求每个 $X_t$ 有有限二阶矩，并且

$$
\mathbb E X_t=\mu,\qquad
\gamma(k)=\operatorname{Cov}(X_t,X_{t+k})
$$

与起点 $t$ 无关。特别地 $\operatorname{Var}(X_t)=\gamma(0)$ 恒定。若 $\gamma(0)>0$，定义 $\rho(k)=\gamma(k)/\gamma(0)$，称为自相关函数 ACF；实值过程满足 $\rho(-k)=\rho(k)$。方差为零时，这个比值没有定义。

**严平稳**要求任意有限组 $(X_{t_1},\ldots,X_{t_m})$ 的联合分布在所有时间一起平移后不变。严平稳加有限二阶矩才推出宽平稳；例如 iid Cauchy 序列严平稳，却没有协方差。反过来也不成立：令各时刻相互独立，偶数时刻取标准正态，奇数时刻取等概率 $\pm1$；均值都是 0、方差都是 1、异时刻协方差都是 0，但边缘分布随奇偶变化。

对**联合高斯过程**，所有有限维分布由均值与协方差决定，因此宽平稳与严平稳等价。只知道每个单独 $X_t$ 呈正态还不够。

### 平稳不自动允许“时间平均替总体平均”

令 $Z\sim N(0,1)$，并让每个时刻都取 $X_t=Z$。过程严平稳且宽平稳，但

$$
\frac1n\sum_{t=1}^nX_t=Z,
$$

不会随 $n$ 增大变成总体均值 0。每条路径都很“稳定”，恰恰没有提供越来越多的独立信息。要让时间平均一致估计总体量，需要相应的遍历或弱依赖条件；不同统计量需要的条件也不完全一样。

平稳是一类有用的建模假设，并非所有时序模型的入场限制。趋势、季节变化、状态空间和单位根模型都能直接描述非平稳过程。问题在于是否把适用于平稳模型的推断错误地套上去。[Powell 的时序讲义](https://eml.berkeley.edu/~powell/e241b_f06/TS-intro.pdf)系统区分了平稳、遍历与线性预测。

### 白噪声只排除线性相关

本页“白噪声”指 $\mathbb E\varepsilon_t=0$、$\operatorname{Var}(\varepsilon_t)=\sigma^2\in(0,\infty)$，并且异时刻协方差为零。它未必独立，甚至未必严平稳。若再明确 iid，才有各次冲击的独立同分布结构。

一个可计算的反例是 $\varepsilon_t=Z_tZ_{t-1}$，其中 $Z_t$ iid 标准正态。相邻冲击的协方差为零，却共享 $Z_{t-1}$：平方后的相关能暴露这种依赖。第 7 节完整算出它。因此“残差 ACF 接近零”没有排除波动聚集或非线性可预测性。

## 2. AR(1)：过去冲击怎样留下痕迹？

先把均值移走，写

$$
X_t=\phi X_{t-1}+\varepsilon_t.
$$

**因果解**在这里指 $X_t$ 可由当前及过去冲击作收敛的线性表示，不需要未来冲击。反复代入 $m$ 次：

$$
X_t=\phi^m X_{t-m}+\sum_{j=0}^{m-1}\phi^j\varepsilon_{t-j}.
$$

当 $|\phi|<1$，冲击系数平方和收敛，得到均方意义下的因果平稳解

$$
\boxed{X_t=\sum_{j=0}^{\infty}\phi^j\varepsilon_{t-j},\qquad
\gamma(0)=\sigma^2\sum_{j=0}^{\infty}\phi^{2j}
=\frac{\sigma^2}{1-\phi^2}.}
$$

不同冲击不相关，所以方差求和时没有交叉项。再写 $X_{t+k}=\phi^kX_t+\sum_{j=0}^{k-1}\phi^j\varepsilon_{t+k-j}$；后半部分与 $X_t$ 不相关，于是

$$
\gamma(k)=\phi^k\gamma(0),\qquad \rho(k)=\phi^{|k|}.
$$

$0<\phi<1$ 给出同号衰减；$-1<\phi<0$ 的 ACF 正负交替衰减。不要把二者都说成轨迹“平滑消退”：单条轨迹还不断受到随机冲击。

<style>
.arma-static{max-width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:6px}.arma-static img{display:block;width:1100px;min-width:1100px;max-width:none}.arma-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}}
</style>
<figure class="plot arma-static" markdown="1" tabindex="0" role="region" aria-label="总体相关和预测方差静态图，左右键滚动">
![AR 与 MA 的总体相关和预测误差方差](assets/img/ts-01-ar-process.svg)
<figcaption><span class="fig-id">图 1.1</span>固定模型的总体量：上方比较 ACF，下方比较 PACF 与预测误差方差。AR 的负系数产生交替相关；MA 的 ACF 截尾不意味着 PACF 同样截尾。预测方差的增长也可以进入平台。</figcaption>
</figure>

### “因果平稳”不能省掉“因果”

从 $X_0=0$ 向前生成时，

$$
\operatorname{Var}(X_t)=\sigma^2\sum_{j=0}^{t-1}\phi^{2j}.
$$

当 $|\phi|\ge1$ 它不恒定，正是实验中的前向非平稳场景。但若允许双边时间和未来冲击，$|\phi|>1$ 时可以构造另一平稳解：

$$
X_t=-\sum_{j=1}^{\infty}\phi^{-j}\varepsilon_{t+j},\qquad
\operatorname{Var}(X_t)=\frac{\sigma^2}{\phi^2-1}.
$$

把 $\phi X_{t-1}$ 的第一项 $-\varepsilon_t$ 单独提出，就能验证同一个 AR 方程。它依赖未来，$\varepsilon_t$ 也不再是相对于过去观测的新息；例如 $\operatorname{Cov}(\varepsilon_t,X_{t-1})=-\sigma^2/\phi\ne0$。这不是本页用于在线预测的因果模型，却足以反驳“$|\phi|>1$ 不存在任何平稳解”。

$\phi=\pm1$ 则不同：由递推可把 $X_t-\phi^mX_{t-m}$ 写成 $m$ 个带符号白噪声之和，方差是 $m\sigma^2$；若 $X_t$ 宽平稳，左边方差至多 $4\gamma(0)$，矛盾。因此在非退化白噪声条件下没有有限方差平稳解。这里 $\sigma^2>0$ 不可漏掉。

### 与 OU 和 Markov 的联系有条件

若驱动是 iid 且独立于过去状态，AR(1) 才直接给出一阶 Markov 转移：给定 $X_t$ 后，更早历史不再改变下一步分布；仅有“白噪声不相关”不足以作这个结论。

对 [OU 过程](sde-02-sde-diffusion.html) $dX=-aX\,dt+b\,dB$，$a>0$，间隔 $h$ 的精确采样是高斯 AR(1)，系数 $e^{-ah}>0$，冲击方差 $b^2(1-e^{-2ah})/(2a)$。负系数 AR(1) 不是这一维 OU 的精确采样；Euler 离散系数 $1-ah$ 也不等于精确系数。

## 3. MA(1)：冲击有限，并不代表可从过去稳定恢复

令 $X_t=\varepsilon_t+\theta\varepsilon_{t-1}$。用“哪些冲击重叠”逐项算：

$$
\gamma(0)=\sigma^2(1+\theta^2),\qquad
\gamma(1)=\sigma^2\theta,\qquad
\gamma(k)=0\quad(|k|>1).
$$

所以任意有限 $\theta$ 都给出宽平稳过程。若冲击 iid，过程还严平稳；只假设白噪声时不能自动加上这一结论。

“可逆”在本页采用**稳定因果线性逆**的常用含义：从当前及过去观测，以绝对可和系数恢复驱动。形式上

$$
\varepsilon_t=X_t-\theta X_{t-1}+\theta^2X_{t-2}-\cdots
=\sum_{j=0}^{\infty}(-\theta)^jX_{t-j}.
$$

因此 $|\theta|<1$ 是该稳定逆的条件。$|\theta|=1$ 不满足绝对可和条件；这句话没有否定采用更弱的均方极限恢复定义时可能出现的边界结果。

为什么要选择可逆表示？当 $|\theta|>1$，换成

$$
\theta'=\frac1\theta,\qquad {\sigma'}^2=\theta^2\sigma^2
$$

会保留全部自协方差。以 $\theta=2,\sigma^2=1$ 为例，两种表示的方差都为 5，lag 1 协方差都为 2。**还要同时调整冲击方差**，不能只把系数倒过来。若两种驱动都是高斯，这些零均值过程具有相同有限维分布；非高斯时相同二阶结构不保证完整分布相同。

推广到 MA($q$)，只需计算有限冲击的重叠，便知 $|k|>q$ 时总体 ACF 为零。但有限样本的相关估计不会逐项复制这个精确零。

## 4. PACF、根条件与 Wold：三个层次的工具

ACF 问“隔 $k$ 期还相关吗”；**PACF**问“用中间 $k-1$ 个变量作最佳线性解释之后，两端残差还相关吗”。等价地，在用过去 $k$ 项线性预测当前值的回归中，取最后一项的系数。这里使用总体协方差，且相应协方差矩阵非奇异。

PACF 是线性投影量，并不一般等于条件独立性；联合高斯时才有相应的协方差与条件独立联系。因果 AR(1) 的 PACF 在 lag 1 为 $\phi$，之后为零。MA(1) 则为

$$
\alpha_k=\frac{(-1)^{k+1}\theta^k}{\sum_{j=0}^{k}\theta^{2j}},\qquad k\ge1.
$$

例如 $\theta=1$ 时 $\alpha_k=(-1)^{k+1}/(k+1)$，ACF 已在 lag 1 后截尾，PACF 仍拖尾。这条公式可由协方差的三对角结构或逐阶线性投影递推得到。

### ARMA 的两种根分别检查什么？

记滞后算子 $BX_t=X_{t-1}$，写

$$
\Phi(B)X_t=\Theta(B)\varepsilon_t,\quad
\Phi(z)=1-\sum_{j=1}^{p}\phi_jz^j,\quad
\Theta(z)=1+\sum_{j=1}^{q}\theta_jz^j.
$$

先约去共同因子、采用最小表示。$\Phi$ 的零点都在单位圆外，给出稳定因果的冲击展开；$\Theta$ 的零点都在单位圆外，给出稳定因果逆。不要把两种条件混成一句“平稳可逆”。

AR(1) 的滞后多项式根是 $1/\phi$，而前向状态递推乘子是 $\phi$；一个检查圆外，一个检查圆内，是互为倒数的坐标。$\phi=0$ 时多项式是常数 1，没有有限根。连续时间 ODE 的“实部为负”检查的是另一种时间演化算子，不能直接拿数字不加转换地比较。

### Wold 分解没有承诺一个低阶 ARMA 能包办一切

对去均值的平方可积宽平稳过程，Wold 分解写为

$$
X_t=D_t+\sum_{j=0}^{\infty}\psi_j u_{t-j},\qquad
\psi_0=1,\quad \sum_{j=0}^{\infty}\psi_j^2<\infty.
$$

其中 $D_t$ 是可由无限过去完全线性预测的部分；$u_t$ 是与过去观测线性空间正交的一步新息，不必 iid；两部分在所有时差上不相关。若纯确定部分占全部，新息方差可为零。“确定”是线性可预测的术语，$D_t$ 仍可随机，例如前面的 $X_t=Z$。

定理提供无限线性表示，并不保证精确的有限阶 ARMA，也没有自动给出遍历性或非线性预测的最优模型。有限阶模型的价值在于简约、可估计、可验证，阶数必须经数据和任务检验。

## 5. 样本诊断：把候选模型当作候选

本实验先减去同一份全样本均值，采用

$$
\widehat\rho(k)=
\frac{\sum_{t=k+1}^{n}(x_t-\bar x)(x_{t-k}-\bar x)}
{\sum_{t=1}^{n}(x_t-\bar x)^2}.
$$

分子没有另除 $n-k$，因此它是采用共同分母的常见有偏估计。不同软件选项可能用不同约定，核对之前先看定义。常数样本分母为零，ACF/PACF 未定义，不能填零。样本 PACF 用同一组协方差逐阶作 Durbin–Levinson 线性投影递推。

| 总体典型模式（最小、非退化的相应模型） | ACF | PACF |
|---|---|---|
| 因果 AR($p$) | 通常拖尾，可指数或振荡衰减 | $p$ 之后为零 |
| MA($q$) | $q$ 之后为零 | 通常拖尾 |
| 混合 ARMA | 通常两者都拖尾 | 通常两者都拖尾 |

零系数、降阶和约掉的因子会改变表面阶数。这张表描述总体结构；“样本 lag 1、2 显著，之后大多不显著”只使 MA(2) 成为候选，不足以唯一识别它。[Hyndman 与 Athanasopoulos 的 ARIMA 章节](https://otexts.com/fpp3/non-seasonal-arima.html)给出了用相关图辅助识别的实践背景。

估计可用相应模型下的最小二乘或似然；再比较 AIC/BIC、滚动时间验证和残差。训练/验证应尊重时间顺序，不能随机打乱后把未来泄漏给过去。

Ljung–Box 统计量

$$
Q_m=n(n+2)\sum_{k=1}^{m}\frac{\widehat\rho_{\mathrm{res}}(k)^2}{n-k}
$$

联合检查选定的前 $m$ 个残差相关。常规正确指定 ARMA、合适矩与估计正则条件下，常用 $\chi^2_{m-p-q}$ 渐近参照，要求自由度为正；具体模型和估计过程需相应调整。它不是对“所有 lag 独立”的证明，未拒绝也不是模型已正确。多个单 lag 检查会增加误报，重尾或条件异方差会影响常规校准。[残差诊断章节](https://otexts.com/fpp3/diagnostics.html)说明了为何要把一组相关联合检查。

残差 lag 12 偏大可以提示月度季节结构，也可能源于遗漏动态、结构变化或抽样波动。先结合机制与验证，再决定是否加季节项；不能凭一个点断言必须使用 SARIMA。

## 6. 预测：先写清可用信息，再算误差

### AR(1) 的逐步预测可直接手算

现在加强条件：冲击 iid $N(0,\sigma^2)$，参数已知，未来冲击独立于过去状态。递推给出

$$
X_{n+h}=\phi^hX_n+\sum_{j=0}^{h-1}\phi^j\varepsilon_{n+h-j}.
$$

因此给定 $X_1,\ldots,X_n$，

$$
\boxed{\widehat X_{n+h|n}=\phi^hX_n,\qquad
v_h=\sigma^2\sum_{j=0}^{h-1}\phi^{2j},\qquad
X_{n+h}\mid X_{1:n}\sim N(\phi^hX_n,v_h).}
$$

逐步 95% 预测区间是 $\phi^hX_n\pm1.959964\sqrt{v_h}$。即使前向模型有单位根，这个有限步条件预测仍成立；$\phi=1$ 时均值是 $X_n$，方差为 $h\sigma^2$。

$|\phi|<1$ 时，均值趋于零、方差趋于 $\sigma^2/(1-\phi^2)$；这来自系数衰减，不能推广为“所有平稳过程的长期预测都回总体均值”。随机常值过程 $X_t=Z$ 是反例：观察一次后永远知道它，预测误差为零。

若仅知道驱动是白噪声，上式在因果平稳模型中给出最佳**线性**预测和误差方差；要称为完整条件期望、再给出正态覆盖区间，还需要相应独立/高斯条件。

### MA(1) 的末次冲击不是一个已观测量

看似可以写 $\widehat X_{n+1|n}=\theta\varepsilon_n$，但有限观测 $X_1,\ldots,X_n$ 一般没有精确告诉我们 $\varepsilon_n$。本实验在 iid 高斯、已知参数、平稳 MA 初始化下作准确的有限观测条件化。

设 $\mathbf x=(X_1,\ldots,X_n)^\top$、$d=1+\theta^2$，单位冲击方差下，协方差矩阵 $\Sigma_n$ 的主对角为 $d$、相邻对角为 $\theta$，其他为零。未来一项与观测的协方差向量是 $\theta\mathbf e_n$，所以

$$
m_1=\theta\mathbf e_n^\top\Sigma_n^{-1}\mathbf x,\qquad
v_1=d-\theta^2(\Sigma_n^{-1})_{nn}.
$$

这正是联合正态的条件均值与方差。数值计算不必显式求逆：三对角分解递推 $d_1=d$、$d_i=d-\theta^2/d_{i-1}$，消元得到最后一项即可。对有限 $n$，$\theta=\pm1$ 时矩阵仍正定，预测依然有定义；逆滤波的边界与有限观测预测不是同一个问题。

当 $h\ge2$，$X_{n+h}$ 只包含与全部观测独立的新冲击，故 $m_h=0$、$v_h=d$。**区间从第二步起进入平台**，并非每一步严格变宽；$\theta=0$ 时第一步就进入平台。若冲击方差不为 1，上述方差整体乘 $\sigma^2$。

这些是未来单个观测的预测区间，不是均值估计的置信区间，也不是多步同时覆盖带。实际参数经过估计和选模，历史结构也可能变化，区间需要额外处理这些不确定性。[预测章节](https://otexts.com/fpp3/arima-forecasting.html)讨论了递推预测和参数估计带来的区间局限。

## 7. 三道可展开的核对题

<details class="answer" markdown="1">
<summary>题 1：白噪声怎么还能互相依赖？</summary>

取 $\varepsilon_t=Z_tZ_{t-1}$，$Z_t$ iid $N(0,1)$。均值为 0，方差 $\mathbb EZ_t^2\mathbb EZ_{t-1}^2=1$。相邻协方差

$$
\mathbb E[Z_tZ_{t-1}^2Z_{t-2}]=0;
$$

更远的冲击由不相交的 $Z$ 组成，也不相关。它因此是白噪声。但平方后的相邻协方差为

$$
\operatorname{Cov}(\varepsilon_t^2,\varepsilon_{t-1}^2)
=\mathbb E[Z_t^2Z_{t-1}^4Z_{t-2}^2]-1
=1\cdot3\cdot1-1=2.
$$

若独立，平方也应独立，协方差应为零；因此原冲击并不独立。只检查普通 ACF 会漏掉这类依赖。

</details>

<details class="answer" markdown="1">
<summary>题 2：φ=0.8、冲击方差为 1、最后观测为 2，三步预测怎么算？</summary>

已知参数与 iid 高斯冲击时，均值是 $0.8^3\cdot2=1.024$；误差方差是

$$
v_3=1+0.8^2+0.8^4=2.0496.
$$

标准差约 $1.43164$，95% 预测区间约 $[-1.7820,3.8300]$。总体平稳方差约 $2.77778$，比三步预测误差方差大，因为当前状态仍提供信息。

若仅知道白噪声不相关，可保留相应最佳线性预测论证，但不能凭这两个矩就宣称区间有精确正态覆盖。若 $\phi$ 是从这份数据估计的，还要计估计不确定性。

</details>

<details class="answer" markdown="1">
<summary>题 3：不可逆 MA 能否与一个可逆 MA 有相同相关图？</summary>

原模型 $\theta=2,\sigma^2=1$ 有 $\gamma(0)=5$、$\gamma(1)=2$、其余非零 lag 协方差为 0。换成 $\theta'=1/2,{\sigma'}^2=4$：

$$
\gamma'(0)=4(1+1/4)=5,\qquad
\gamma'(1)=4\cdot(1/2)=2.
$$

所以两者总体 ACF 与由它决定的 PACF 相同。若都是零均值高斯过程，联合分布也相同；非高斯情形不能只凭协方差作这一升级。

这说明相关图不会唯一指定驱动的参数化。选择稳定可逆表示是一项识别约定，不是从图上证明原来那个有限 MA 不平稳。实验中的 $|\theta|=1.2$ 采用单位冲击方差；与其倒数比较时，别忘了同时调整方差才有相同的完整二阶尺度。

</details>

---

下一页：[单位根、伪回归与波动模型](ts-02-nonstationary-garch.html)。继续保留同一条纪律：先明确数据生成和可用信息，再选择诊断、预测与不确定性计算。
