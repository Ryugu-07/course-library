# 高维概率 I · 从真实尾概率到集中不等式

> **路线**：MGF 与常数 → 独立和 → 稀有计数 → 高维薄壳。**前置**：[期望与积分](mt-01-measure-expectation.html)、[大数定律](mt-02-lln.html)、[鞅与集中](mt-04-martingale-convergence.html)。
> 做了 32 次试验，观察到一个看起来很极端的结果，它究竟有多罕见？回答需要分清分布模型、有效上界和数值计算。独立性本身不保证指数尾；方差很小也不保证某一种不等式在所有阈值上最好。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="hdp01-learning-title">
<h2 id="hdp01-learning-title">学习层：一个概率，为什么有几本不同的账？</h2>

### 1. 先算一个真正有限的例子

令 $R_i$ 独立地以相同概率取 $-1,+1$，$S_n=\sum_{i=1}^nR_i$。在 $n=32,t=12$ 时，二项式求和给

$$
P(|S_{32}|\ge12)\simeq0.05010246.
$$

同一事件的亚高斯上界却是

$$
P(|S_{32}|\ge12)\le2e^{-12^2/(2\cdot32)}
\simeq0.2107984.
$$

两者并不冲突：第一项用了完整离散分布，第二项只用了一个统一的 MGF 证书。上界容许比真实概率大。再保护 $m=5$ 个事件时，union bound 截断到 $1$，表示这个界已经不能提供有用的小失败率，不能解释成“失败必然发生”。

现在把独立性去掉，让 $R_1=\cdots=R_{32}=R$。此时 $S_{32}=32R$，同一事件的概率变成 $1$。每一个坐标的边缘分布完全没变，改变的是联合分布。

### 2. 揭示前的五个预测

1. 两个分布有相同的 MGF 代理尺度，真实尾概率是否必须相同？
2. 重尾分布的 MGF 在一个极小但非零的 $\lambda$ 上，能否直接当成 $1$？
3. 所有变量都共用同一个随机量时，和的方差按 $n$ 还是 $n^2$ 增长？
4. 稀有 Bernoulli 计数中，Bernstein 是否永远比 Hoeffding 紧？
5. 将 $m$ 个事件的概率上界相加，是否需要事件独立？

### 3. 三种实验

<div class="learning-lab" data-learning-lab="subgaussian-concentration" markdown="1">

**无 JavaScript 时的默认账本。**

| 模型与事件 | 分布模型值 | 有效上界或对照 |
|---|---:|---:|
| 独立 Rademacher，n=32，和的绝对值至少 12 | 0.05010246 | 亚高斯界 0.2107984 |
| 共用同一个 R，其余参数不变 | 1 | 独立公式已不适用 |
| B 服从 Bin(32, 0.01)，计数至少 5 | 0.00001607659 | Hoeffding 0.2543866 |
| 同一个二项式事件 | 同上 | Bernstein 0.002783779 |
| 同一个二项式事件 | 同上 | 优化 Chernoff/KL 0.00008040405 |
| 独立 32 维标准 Gaussian，壳厚 t=2 | 0.004324824 | Gaussian 壳界 0.2706706 |
| X=(Z,…,Z)，同一维数和壳厚 | 0.6578887 | 不满足上述独立性假设 |

第一场景比较五种中心化模型、全部 MGF 与单变量尾节点，再看独立和与共用变量的和。第二场景保留所有整数 k=0,…,n 的二项式质量和上尾。第三场景用卡方分布计算 Gaussian 壳概率，并保留相关坐标反例。

</div>

实验同时列出 $P$ 和 $\ln P$。$\ln P=-853.55$ 对应极小正概率，转成普通浮点数可能下溢；$\ln P=-\infty$ 才在这里表示数学上严格为零。MGF 的 $+\infty$ 表示发散。表格中“不适用”则是另一回事，不能把这些空缺都填成 $0$。

解释完实验，再问一个迁移问题：面对实际数据，你知道的是变量范围、真实方差，还是完整分布？能用哪一个界，首先取决于这份信息。

</section>

<style>.sg-static{max-width:100%;overflow-x:auto}.sg-static img{display:block;width:1100px;min-width:1100px;max-width:none!important}.sg-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}</style>
<div class="sg-static" role="region" tabindex="0" aria-label="Uniform的MGF常数、完整二项式尾与高维薄壳，可左右滚动"><img src="assets/img/hdp-01-subgaussian-tail.svg" alt="Uniform真实log MGF与最优和范围级代理；二项式全部计数尾概率及三种上界；独立Gaussian薄壳和共用一个Gaussian的相关反例。" loading="lazy"></div>

## 1. Chernoff：先把尾事件变成一个可优化的函数

令 $X$ 是已中心化的实随机量，$\Lambda_X(\lambda)=\ln Ee^{\lambda X}$ 是对数矩母函数。对 $\lambda>0$，指数函数保持大小关系，因此 Markov 不等式给

$$
P(X\ge t)
=P(e^{\lambda X}\ge e^{\lambda t})
\le \exp[-\lambda t+\Lambda_X(\lambda)].
$$

只能在 MGF 有限的定义域内优化 $\lambda$。如果这个期望发散，式子仍形式上给一个无限大上界，却没有提供集中信息。

假设对**所有实数** $\lambda$ 都有

$$
Ee^{\lambda X}\le e^{K_{\rm mgf}^2\lambda^2/2}.
$$

当 $K_{\rm mgf}>0$ 时，上侧选择 $\lambda=t/K_{\rm mgf}^2$；下侧对 $-X$ 重复。得到

$$
P(|X|\ge t)\le
\min\left\{1,2\exp\left(-\frac{t^2}{2K_{\rm mgf}^2}\right)\right\},
\qquad t>0.
$$

$t=0$ 的事件概率是 $1$；$K_{\rm mgf}=0$ 时 $X=0$ 几乎处处，正阈值事件概率为零，应直接处理，而不是计算 $0/0$。有限 MGF 图只是有限个函数读数，不能代替“所有 $\lambda$”的假设。

### 为什么必须中心化？

在零点展开 $Ee^{\lambda X}=1+\lambda EX+O(\lambda^2)$。右边的代理包络没有一次项，若要求正负 $\lambda$ 都满足不等式，就必须有 $EX=0$。同理比较二次项给

$$
\operatorname{Var}(X)\le K_{\rm mgf}^2.
$$

代理方差可以大于真实方差；不能反过来仅凭有限方差就补上 MGF 不等式。

## 2. 五个具体模型：同一个“尺度”也有不同尾部

| 中心化模型 | $Ee^{\lambda X}$ | 方差 | MGF 代理结论 |
|---|---|---:|---|
| $G\sim N(0,1)$ | $e^{\lambda^2/2}$ | $1$ | 最优 $K_{\rm mgf}^2=1$ |
| $R=\pm1$，各半 | $\cosh\lambda$ | $1$ | 最优 $K_{\rm mgf}^2=1$ |
| $U\sim\mathrm{Unif}[-1,1]$ | $\sinh\lambda/\lambda$，零点取 $1$ | $1/3$ | 最优 $K_{\rm mgf}^2=1/3$ |
| Laplace，密度 $e^{-\sqrt2\lvert x\rvert}/\sqrt2$ | $(1-\lambda^2/2)^{-1}$，仅 $\lvert\lambda\rvert<\sqrt2$ | $1$ | 亚指数，非亚高斯 |
| $P(\lvert H\rvert\ge t)=(1+t)^{-3}$ | 非零 $\lambda$ 时发散 | $1$ | 无有限亚高斯代理 |

Rademacher 的尾在 $t=1$ 仍是 $1$，在 $t>1$ 则是 $0$。Uniform 的尾为 $(1-t)_+$；Gaussian 的尾永远为正。这已经说明，相同的代理常数没有规定相同的真实尾。

Uniform 的最优常数可以直接证明。比较幂级数：

$$
\frac{\sinh\lambda}{\lambda}
=\sum_{k=0}^\infty\frac{\lambda^{2k}}{(2k+1)!}
\le\sum_{k=0}^\infty\frac{(\lambda^2/6)^k}{k!}
=e^{\lambda^2/6}.
$$

原因是 $(2k+1)!\ge6^k k!$：从第 $k$ 项到第 $k+1$ 项，多乘的 $(2k+3)(2k+2)$ 至少为 $6(k+1)$。再用方差下界 $K_{\rm mgf}^2\ge1/3$，最优性就确定了。若只知道取值范围 $[-1,1]$，Hoeffding 引理会给较宽的 $K_{\rm mgf}^2=1$；两种常数使用的信息不同。

重尾例子的二阶矩由尾积分给

$$
EH^2=2\int_0^\infty t(1+t)^{-3}\,dt=1.
$$

但其密度是 $3/[2(1+|x|)^4]$，非零指数权重总会在一侧压倒多项式衰减，所以 MGF 发散。即使 $\lambda=10^{-15}$ 也不会改变这个结论；数值上的“很接近零”不等于量词中的“等于零”。

## 3. Hoeffding：范围怎样变成证书？

若 $X\in[a,b]$，记中心化对数 MGF 为
$F(\lambda)=\ln Ee^{\lambda(X-EX)}$。指数倾斜只改变区间内的概率权重，不改变取值范围。求导得到

$$
F(0)=F'(0)=0,\qquad
F''(\lambda)=\operatorname{Var}_{\lambda}(X)
\le\frac{(b-a)^2}{4}.
$$

最后一步可用区间中点验证：方差是 $E(X-c)^2$ 对常数 $c$ 的最小值，而取 $c=(a+b)/2$ 时每个平方都不超过 $(b-a)^2/4$。二次积分于是给

$$
F(\lambda)\le\frac{\lambda^2(b-a)^2}{8}.
$$

这里的二阶导数是**倾斜分布**下的方差；不能只在 $\lambda=0$ 使用原分布方差后，便宣称整个实轴上的二阶导都一样小。

对独立 $X_i$，期望的乘积分解才允许

$$
\ln E\exp\left(\lambda\sum_i(X_i-EX_i)\right)
=\sum_i\ln Ee^{\lambda(X_i-EX_i)}
\le\frac{\lambda^2}{2}\sum_i K_i^2.
$$

因此

$$
P\left(\left|\sum_i(X_i-EX_i)\right|\ge t\right)
\le2\exp\left(-\frac{t^2}{2\sum_iK_i^2}\right).
$$

代入 $K_i=(b_i-a_i)/2$，得到范围形式的 Hoeffding：

$$
P\left(\left|\sum_i(X_i-EX_i)\right|\ge t\right)
\le2\exp\left(-\frac{2t^2}{\sum_i(b_i-a_i)^2}\right).
$$

这些表达式都可以再与 $1$ 取最小值。若所有 $X_i$ 共用同一个中心化 $X$，实际 MGF 是 $Ee^{n\lambda X}$，应使用 $n^2K_{\rm mgf}^2$；独立时才是 $nK_{\rm mgf}^2$。

### 样本量和多事件

独立 $[0,1]$ 变量的样本均值要满足失败率不超过 $\delta$，充分条件是

$$
n\ge\frac{\ln(2/\delta)}{2\varepsilon^2}.
$$

若有 $m$ 个这样的待保护事件，可以用

$$
P\left(\bigcup_{j=1}^m E_j\right)\le\sum_{j=1}^mP(E_j),
\qquad
n\ge\frac{\ln(2m/\delta)}{2\varepsilon^2}.
$$

并集这一步不需要事件独立；每个单事件上界本身仍需要它自己的假设。将 $p^m$ 当成并集概率会把“全部发生”与“至少一个发生”混淆。

## 4. Bernstein：把真实方差放进来，但保留适用范围

设独立中心化变量满足 $|X_i|\le M$，令
$V=\sum_iEX_i^2$。对 $|\lambda|M<3$，展开指数并使用
$|EX_i^k|\le M^{k-2}EX_i^2$ 与 $k!\ge2\cdot3^{k-2}$：

$$
Ee^{\lambda X_i}
\le1+\frac{\lambda^2EX_i^2}{2}
\sum_{j=0}^\infty\left(\frac{|\lambda|M}{3}\right)^j
=1+\frac{\lambda^2EX_i^2}{2(1-|\lambda|M/3)}.
$$

上式中二次项乘在几何级数前；它不是额外再加一次二次项。用 $\ln(1+x)\le x$ 并利用独立性，得到

$$
\ln Ee^{\lambda S}
\le\frac{\lambda^2V}{2(1-|\lambda|M/3)}.
$$

上侧选择 $\lambda=t/(V+Mt/3)$，当 $V>0,t>0$ 时位于允许区间。代回 Chernoff：

$$
P(S\ge t)\le
\exp\left[-\frac{t^2}{2(V+Mt/3)}\right].
$$

两侧合起来多一个因子 $2$。若 $V=0$，所有中心化变量都是零，正偏差事件直接不可能。

小偏差时 $Mt/3$ 比 $V$ 小，方差控制主要尺度；大偏差时线性项变重要。这是**上界指数的两段行为**，不保证真实分布的尾在两段都恰好等于这些指数，更不是有界变量能够越过自身有限支撑。

### 一个“并非永远更紧”的数值反例

对 $B\sim\mathrm{Bin}(n,p)$，中心变量 $Y_i-p$ 可取
$M=\max(p,1-p)$、$V=np(1-p)$。比较同一个正偏差 $t$ 的单侧 Hoeffding 和 Bernstein：

$$
\text{Bernstein 比 Hoeffding 紧}
\quad\Longleftrightarrow\quad
V+\frac{Mt}{3}<\frac n4.
$$

在 $n=32,p=0.01,k=5$ 时 $t=4.68$，Bernstein 确实紧得多。可是在 $k=32$ 时，

| 同一事件 $B\ge32$ | 概率 / 界 |
|---|---:|
| 真实值 $p^{32}$ | $10^{-64}$ |
| Hoeffding | $5.731531\times10^{-28}$ |
| Bernstein | $5.847719\times10^{-21}$ |

此时 Hoeffding 反而更紧。稀有性有价值，但“方差小就永远选 Bernstein”不是正确规则。实际可以对所有已经证明适用的上界取最小值。若 $p$ 未知，用样本方差代替 $np(1-p)$ 需要另行证明经验 Bernstein 型结论。

## 5. 完整 Bernoulli MGF：再利用一层分布信息

二项式模型给

$$
Ee^{\lambda B}=(1-p+pe^\lambda)^n.
$$

对 $q=k/n>p$，优化得到

$$
P(B\ge k)\le e^{-nD(q\|p)},\qquad
D(q\|p)=q\ln\frac qp+(1-q)\ln\frac{1-q}{1-p}.
$$

内部最优参数满足
$e^{\lambda_*}=q(1-p)/[p(1-q)]$。$q=1$ 用 $\lambda\to\infty$ 的极限，界恰好等于 $p^n$。$k\le np$ 时此上尾方法取平凡界 $1$，不能拿正偏差优化公式随意外推；$p=0,1$ 则直接处理确定性模型。

实验的“模型尾”来自完整有限和

$$
P(B\ge k)=\sum_{j=k}^{n}\binom njp^j(1-p)^{n-j}.
$$

计算保留每一项的对数，并公开浮点归一化修正量。它不是“无限精度精确值”，但也不是只抽几千次样本之后把未出现事件记成零。独立和的 Rademacher 场景同理使用 $S_n=2B-n$，按真实的 $\ge$ 边界选择计入项。

## 6. 亚高斯范数：统一语言，但不要混淆常数

定义

$$
\|X\|_{\psi_2}
=\inf\{s>0:Ee^{X^2/s^2}\le2\},
\qquad
\|Y\|_{\psi_1}
=\inf\{s>0:Ee^{|Y|/s}\le2\}.
$$

这是对应的 Orlicz 范数。标准等价定理（此处引用）指出，平方指数矩、Gaussian 型尾与
$\|X\|_{L^p}\lesssim\sqrt p$ 的增长条件等价到绝对常数；中心化后还等价到全实轴的 MGF 代理条件。这里“等价”不等于各定义的最优常数数值相同。

例如标准 Gaussian 有 $K_{\rm mgf}=1$，但
$\|G\|_{\psi_2}=\sqrt{8/3}$；Rademacher 也有 $K_{\rm mgf}=1$，却有
$\|R\|_{\psi_2}=1/\sqrt{\ln2}$。这些由各自的指数平方矩直接解出。

亚指数的 $\psi_1$ 条件容许指数尾，而不要求全实轴 Gaussian 型 MGF。直接代入定义得

$$
\|X^2\|_{\psi_1}=\|X\|_{\psi_2}^2.
$$

使用 Bernstein 时还需中心化平方。三角不等式与 Jensen 给
$\|X^2-EX^2\|_{\psi_1}\le2\|X\|_{\psi_2}^2$。于是独立平方和自然进入亚指数和的集中理论；这里不能漏掉中心化。

## 7. 高维薄壳：为什么半径约为 $\sqrt d$？

若各坐标独立、中心化、方差为 $1$，则
$E\|X\|_2^2=d$。仅有这个期望还不保证薄壳；进一步假设
$\|X_i\|_{\psi_2}\le K$，引用亚指数和的 Bernstein 定理给

$$
P\!\left(\left|\|X\|_2^2-d\right|\ge u\right)
\le2\exp\left[-c\min\left(\frac{u^2}{dK^4},\frac{u}{K^2}\right)\right].
$$

把平方半径翻译回半径时，需要区分两段：

- $0<t\le\sqrt d$：$|\|X\|-\sqrt d|\ge t$ 蕴含 $|\|X\|^2-d|\ge t\sqrt d$。
- $t>\sqrt d$：下侧事件已经不可能；上侧蕴含 $\|X\|^2-d\ge t^2$。

代入前式并使用 Jensen 给出的 $K\ge1/\sqrt{\ln2}>1$，两段指数都至少是绝对常数乘 $t^2/K^4$，可合并为

$$
P\bigl(|\|X\|_2-\sqrt d|\ge t\bigr)
\le2e^{-c't^2/K^4}.
$$

这才补全了大偏差段；只用一次“开平方 Lipschitz”估计，并不足以自动得到整个 $t$ 轴上的 Gaussian 指数。厚度 $O(1)$ 指在 $K$ 和目标失败率固定时不随维度增大；如果要求失败率 $\delta$ 越来越小，充分壳厚仍约为
$CK^2\sqrt{\ln(2/\delta)}$。

### Gaussian 例子：常数明确、概率可计算

对独立 $G_i\sim N(0,1)$，

$$
Q=\sum_{i=1}^dG_i^2\sim\chi_d^2,\qquad
Ee^{\lambda Q}=(1-2\lambda)^{-d/2},\quad\lambda<1/2.
$$

在 $q>1$ 的上侧，或 $0<q<1$ 的下侧，分别优化正负 $\lambda$，得到对应单侧界

$$
\exp\left[-\frac d2(q-1-\ln q)\right].
$$

令 $q=(1\pm t/\sqrt d)^2$。用 $\ln(1+a)\le a$ 和
$-\ln(1-a)\ge a$，每侧指数至少为 $t^2/2$，故可使用明确常数的

$$
P\bigl(|\|G\|_2-\sqrt d|\ge t\bigr)
\le\min(1,2e^{-t^2/2}).
$$

实验用 $\chi^2$ 的上下尾算模型概率；此界仍是一个较宽的统一证书。偶数 $d=2m$ 时，上尾还可以通过有限和检查：

$$
P(Q\ge x)=e^{-x/2}\sum_{j=0}^{m-1}\frac{(x/2)^j}{j!}.
$$

很小的下尾不能总用浮点 $1-\text{上尾}$ 计算，因此程序分别使用稳定级数与连分式，并保留两侧的对数。

### 密度与概率质量在哪里不同？

Gaussian 向量的点密度在原点最大，但半径 $R=\|G\|$ 的密度还乘入球壳面积：

$$
f_R(r)=\frac{r^{d-1}e^{-r^2/2}}
{2^{d/2-1}\Gamma(d/2)},\qquad r>0.
$$

它的众数是 $\sqrt{d-1}$；$\sqrt d$ 是平方半径均值的平方根，不是半径均值或众数的精确值。图示径向密度时不应标成“原点附近的点密度”。

再看 $X=(Z,\ldots,Z)$：每个坐标仍是单位方差 Gaussian，但
$\|X\|=\sqrt d\,|Z|$，随机起伏也随 $\sqrt d$ 放大。默认 $d=32,t=2$ 时，相关模型的壳外概率约 $0.6579$，远大于独立 Gaussian 的 $0.004325$。不是定理失败，而是独立性不成立。

这些集中机制会继续用于协方差估计、随机投影、经验过程和二次型；进入下一页时，仍要逐项检查独立性、中心化、方差或各向同性，以及控制的是一个方向还是所有方向。

## 8. 完整练习

### 练习 A：一个常数的两种定义

证明 Uniform 的最优 MGF 代理方差为 $1/3$，再计算 Rademacher 的 $\psi_2$ 范数。二者能否直接互换？

<details class="answer" markdown="1"><summary>展开级数与范数定义</summary>

使用前文逐系数比较，得到 $\sinh\lambda/\lambda\le e^{\lambda^2/6}$。二次项比较又要求 $K_{\rm mgf}^2\ge EU^2=1/3$，所以这是最优代理。对 Rademacher，$R^2=1$，故 $Ee^{R^2/s^2}=e^{1/s^2}\le2$ 当且仅当 $s\ge1/\sqrt{\ln2}$。它与 Rademacher 的 $K_{\rm mgf}=1$ 不同，不能把 MGF 公式的常数偷偷替换为同名的 Orlicz 范数。

</details>

### 练习 B：错误的独立性代价

在默认 $n=32,t=12$ 下，分别写出独立 Rademacher 和共用一个 Rademacher 的真实事件。再解释 $m=5$ 的 union bound 为何是 $1$。

<details class="answer" markdown="1"><summary>展开有限和与并集</summary>

独立时 $S=2B-32$，事件是 $B\le10$ 或 $B\ge22$，二项式求和为 $0.05010246$。共用时 $|S|=32$ 恒成立，所以 $P(|S|\ge12)=1$。独立 MGF 上界为 $0.2107984$，乘 $5$ 得 $1.053992$，截断成 $1$；这只是信息不足的上界。共用结构应使用 $n^2K^2$，不能保留错误的独立证书。

</details>

### 练习 C：何时该换一个界？

对 $n=32,p=0.01$，计算 Bernstein 比 Hoeffding 更紧的偏差范围。检查 $k=5$ 与 $k=32$，并说明后者的 KL 界。

<details class="answer" markdown="1"><summary>展开三个指数</summary>

$V=0.3168,M=0.99$，条件为
$t<3(8-0.3168)/0.99\simeq23.28242$。$k=5$ 给 $t=4.68$，位于该范围；$k=32$ 给 $t=31.68$，不在其中。后者真实事件要求全部成功，概率为 $p^{32}=10^{-64}$。$q=1$ 时 $D(1\|p)=\ln(1/p)$，因此优化 Chernoff 界也恰好等于 $p^{32}$。这里用到了完整分布信息，不是说任何有限方差模型都能得到这个答案。

</details>

### 练习 D：薄壳、相关性和极小概率

为什么 Rademacher 向量的范数无波动，而共用一个 Gaussian 的向量不集中在固定厚度的壳中？若程序给 $\ln P=-853.55$，概率输出为 $0$，该怎样写实验结论？

<details class="answer" markdown="1"><summary>展开范数与数值边界</summary>

Rademacher 每个平方恒为 $1$，所以范数恒为 $\sqrt d$；正壳厚的壳外事件严格不可能。共用 Gaussian 的范数为 $\sqrt d|Z|$，坐标并不独立，波动尺度随 $\sqrt d$ 增大。有限的 $\ln P=-853.55$ 对应正概率 $e^{-853.55}$，普通双精度指数运算下溢才输出 $0$；应报告对数概率和下溢状态，不能声称已经证明概率等于零。

</details>

继续阅读：[Vershynin 的高维概率教材入口（第二版）](https://webapps.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html)、[作者公开讲义 §1.1–1.4：亚高斯、亚指数与和的集中](https://arxiv.org/pdf/1612.06661)。本页各具体模型、常数计算、有限计数例子和实验按上述假设逐步推导；讲义中的绝对常数结论与这里的显式模型常数分别标明。
