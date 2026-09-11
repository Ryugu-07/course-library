# 信息论进阶 III · 率失真、反注水与稀有事件

> **前置**：it2-01 的有限信源与典型性、it2-02 的编码量词、条件熵/KL、凸优化的约束与对偶。
> **本课问题**：允许丢掉什么信息，才谈得上“压缩到多少”？一个优化器停止变化，是否已经最优？一个很小的稀有事件概率，怎样从完整有限计数接到 KL 指数？

<div data-learning-page></div>
<style>
.distortion-course .katex{position:relative}
.distortion-course .distortion-fallback td:last-child{white-space:nowrap;font-size:.9em}
</style>
<noscript><style>.distortion-course span.arithmatex{overflow-wrap:anywhere;word-break:break-word;white-space:normal}</style></noscript>
<div class="distortion-course" markdown="1">

<section class="learning-layer" markdown="1" aria-labelledby="distortion-learning-title">

## 学习层：误差平均很小，每一条也安全吗？

<h3 id="distortion-learning-title">只存“更像000还是111”，会丢掉多少？</h3>

一段三位序列中，每位独立以概率 0.1 取 1。我们只用一位标签记录它更接近 000 还是 111，再用这个代表词重构。全部八种原词都可以列出来：平均每位错 0.09，但有些词仍错三分之一；失真超过 0.1 的概率是 0.27。

因此，“平均失真不超过 0.1”“超过 0.1 的概率很小”和“每条都不超过 0.1”是三个不同目标。只有写清目标，才能比较一个具体压缩器与理论边界。

| 实验 | 看见的有限对象 | 与理论连接的位置 |
|---|---|---|
| 二元率失真与BA | 最优联合分布、前后向条件概率、每次迭代和对偶差 | 测试信道的最优性 |
| 有限有损码本 | 每个源词、代表词、距离、平均和超预算概率 | 具体码的实际性能与信息下界 |
| 类型与稀有事件 | 全部整数类型、精确概率、条件分布 | Sanov的有限前因子与格点 |
| 高斯反注水 | 每个方差方向的失真和码率 | 总预算怎样分配 |

### 先预测四个问题

1. 平均失真达标，能否推出每条序列都达标？
2. 偏置二元源的最优前向测试信道，仍然总是对称翻转吗？
3. BA边缘一动不动，能否单凭这一点判定全局最优？
4. “正面恰好占0.7”在任何样本长度下都有可能吗？

<div class="learning-lab" data-learning-lab="rate-distortion" markdown="1">

**无 JavaScript 时：**固定图、18 项参考值及第 11 节完整答案仍可阅读。交互重新计算当前参数；固定记录包含全源词、全类型、BA全轨迹和逐分量分配。

<figure class="plot" markdown="1">
[![最优测试联合分布、逐词失真、有限类型前因子与高斯反注水](assets/img/it2-03-rate-distortion-ledgers.svg)](assets/img/it2-03-rate-distortion-ledgers.svg)
<figcaption>图1.1：固定输入的实际失真与概率账本；图线连接离散点只作读图辅助。可打开原图查看四个面板。</figcaption>
</figure>

<div class="distortion-fallback" markdown="1">

固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载完整测试信道、BA轨迹、源词、类型与水位记录](assets/learning/projects/rate-distortion/run-snapshot.json)。偏置源p=0.1、预算D=0.05、BA的beta=3且初始重构P(1)=0.5迭代40步；有限源p=0.1、三位码本000和111、预算0.1；类型例p=0.5、n=100、比例至少0.7；独立实高斯方差9、4、1、整个向量预算3。

| 固定参数下的量 | 参考值 |
|---|---:|
| 偏置源信息率失真 | 0.182598636473 |
| 最优重构P(1) | 0.0555555555556 |
| 前向0误判为1 | 0.00308641975309 |
| 前向1误判为0 | 0.472222222222 |
| 最优联合平均失真 | 0.05 |
| 三位码本平均每位失真 | 0.09 |
| 三位码本支持最大失真 | 0.333333333333 |
| 三位码本超0.1概率 | 0.27 |
| 三位重构标签熵bit/块 | 0.18426059334 |
| 百次公平硬币至少0.7概率 | 3.9250698228e-05 |
| 百次事件有限速率 | 0.146369221562 |
| 闭尾事件渐近KL速率 | 0.118709100769 |
| 百次事件条件平均比例 | 0.706613947501 |
| 高斯总预算3的水位 | 1 |
| 高斯bit/三维向量 | 2.58496250072 |
| 高斯平均bit/坐标 | 0.861654166907 |
| 第一坐标前向均值系数 | 0.888888888889 |
| 第一坐标前向噪声方差 | 0.888888888889 |

离散点连线只作读图辅助，重合曲线可能覆盖。有限计数、概率和失真以精确分数为准；熵、对数与BA为浮点近似，诊断不是严格区间证书。有限码本的实际性能与单字母渐近边界分别解释，零事件没有条件分布。

</div>

</div>

十进制概率和预算按最多六位小数的精确分数解释。有限词的概率、平均失真、类型事件和反注水分配用有理数计算；熵、KL、对数和BA迭代用浮点数。极小概率保留对数，未定义条件分布和无穷码率明确标记。BA对偶差是浮点诊断，不冒充严格区间证书。

</section>

## 1. 三种失真目标，以及一个容易遗漏的零点

编码器把 $X^n$ 映射为标签 $J\in\{0,\ldots,M-1\}$，译码器从标签重构 $\widehat X^n$。固定长度码率为 $r_n=\log_2M/n$。对非负单字母失真 $d$，令

$$
d_n(x^n,\hat x^n)=\frac1n\sum_{i=1}^n d(x_i,\hat x_i).
$$

平均准则约束 $\mathbb E d_n\leq D$；超额失真准则约束 $P(d_n>D)$；逐条准则要求源支持中的每条序列都满足 $d_n\leq D$。三者的有限最优码本通常不同。基本定义与有限信息下界见 [MIT 6.441 第23.2节](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/880c39878ba7dc35a5fbb35758d42a69_MIT6_441S16_chapter_23.pdf)。

本课的单字母信息率失真函数定义为

$$
R_{\rm info}(D)=\min_{W(\hat x\mid x):\,\mathbb E d(X,\widehat X)\leq D}I(X;\widehat X).
$$

先考虑有限字母表、IID源、有界失真。用允许 $\limsup_n\mathbb E d_n\leq D$ 的渐近准则时，适当的编码定理把它接到最小渐近码率。**这与先对每个有限 $n$ 强制精确零失真再取极限不同。**

例如 $0\lt p\lt 1$ 的 Bernoulli 源，在 Hamming 失真下，每个二元词都有正概率。若有限平均失真严格等于零，就必须恢复全部 $2^n$ 个词，故 $M\geq2^n$，码率至少为 1。另一方面，允许失真随 $n$ 趋零，可以使用几乎无损信源码，渐近率为 $H_2(p)$。所以

$$
R_{\rm info}(0)=H_2(p)
$$

不等于“每个有限码都严格零失真”的最小率。确定性源只需一个代表词，另作零率处理。

## 2. 偏置二元源：最优的是反向对称信道

设 $X\sim\operatorname{Bernoulli}(p)$，重构也是二元，$d=\mathbf1_{\{X\ne\widehat X\}}$。记 $D_0=\min(p,1-p)$。完整公式为

$$
R_{\rm info}(D)=
\begin{cases}
H_2(p)-H_2(D),&0\leq D\leq D_0,\\
0,&D\geq D_0.
\end{cases}
$$

负预算不可行。零率平台由重构为最常见符号达到。对 $D\leq D_0\leq1/2$，误差位 $E=X\oplus\widehat X$ 给出

$$
I(X;\widehat X)=H_2(p)-H(X\mid\widehat X)
\geq H_2(p)-H(E)\geq H_2(p)-H_2(D).
$$

最后一步使用二元熵在 $[0,1/2]$ 单调递增，不能把这个推导延长到所有预算。

为了取等，先独立生成 $\widehat X\sim\operatorname{Bernoulli}(q)$ 与 $Z\sim\operatorname{Bernoulli}(D)$，再令 $X=\widehat X\oplus Z$。满足源边缘的条件是

$$
p=D+q(1-2D),\qquad q=\frac{p-D}{1-2D}.
$$

在正码率段这个 $q$ 合法，且 $H(X\mid\widehat X)=H_2(D)$。这是**从重构到原信源**的反向 BSC；实际前向 $W(\hat x\mid x)$ 应由 Bayes 公式算出，一般不对称。公平源才使两方向同时对称。$p=D=1/2$ 的零率点直接选常数重构，避免使用 $0/0$。这种构造见 [MIT 第25.1.1节](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/5721b7df786b416dadad7c7bb3364d00_MIT6_441S16_chapter_25.pdf)。

实验同时保留 $P_{X\widehat X}$、两个边缘与两个方向的条件概率。边缘为零时，相应条件分布没有唯一含义，记为不适用。

## 3. 一份具体有限码本怎样记账

固定重构词 $c_0,\ldots,c_{M-1}$。对每个源词 $x^n$，选择 Hamming 距离最近者；平局按标签顺序选第一个。若重复词出现两次，标签仍保留，但不会凭空增加可重构的信息。

设实际映射为 $j(x^n)$，则

$$
\bar D=\sum_{x^n}P(x^n)\frac{d_H(x^n,c_{j(x^n)})}{n},
$$

$$
P_{\rm exc}(D)=\sum_{x^n:\,d_H(x^n,c_{j(x^n)})/n>D}P(x^n).
$$

实验逐词累加，不抽样估计；最大失真只对**正概率源支持**取最大。它还把各重构区域的质量相加，得到 $P(J=j)$。确定性映射满足 $H(J\mid X^n)=0$，所以 $I(X^n;J)=H(J)$。

编码信息通过 $X^n\to J\to\widehat X^n$。若重复标签从未被使用，它们不增加标签熵。一般有限码都有

$$
\log_2M\geq H(J)\geq I(X^n;\widehat X^n).
$$

对 IID 源，写 $D_i=\mathbb E d(X_i,\widehat X_i)$，则

$$
\begin{aligned}
I(X^n;\widehat X^n)
&=\sum_iH(X_i)-H(X^n\mid\widehat X^n)\\
&\geq\sum_i\big[H(X_i)-H(X_i\mid\widehat X_i)\big]\\
&\geq\sum_iR_{\rm info}(D_i)
\geq nR_{\rm info}(\bar D).
\end{aligned}
$$

最后一步是凸性。由此 $r_n\geq R_{\rm info}(\bar D)$，但不保证某个有限码恰好达到边界。实验并列显示实际码率、每符号标签熵和实际失真对应的信息下界。

## 4. 从测试信道到长码：覆盖概率不可省略

互信息关于固定源边缘下的测试信道为凸函数。混合两个测试信道使失真线性混合、互信息不超过加权平均，因而 $R_{\rm info}$ 凸且不增。这也解释了为何可以在有余量的预算间连续逼近。

取一个测试联合分布 $P_{X\widehat X}$，令其平均失真为 $D'\lt D$、互信息为 $I$。独立抽取 $M$ 个重构词，每个服从 $P_{\widehat X}^n$。对每个原词，寻找一条同时失真小、信息密度不过大的候选。

记可接受集合 $F_n$ 满足

$$
d_n(x^n,\hat x^n)\leq D'+\epsilon,
\qquad
\imath(x^n;\hat x^n)\leq n(I+\epsilon).
$$

在真实测试联合分布下，IID大数定律使 $P(F_n^c)=\eta_n\to0$。除概率至多 $\sqrt{\eta_n}$ 的坏原词外，条件接受率至少为 $1-\sqrt{\eta_n}$。对这样的好原词，由似然比换测度，独立候选的命中率至少为

$$
P_{\widehat X}^n(F_n\mid x^n)
\geq2^{-n(I+\epsilon)}(1-\sqrt{\eta_n}).
$$

独立造码本使全部候选都失败的条件概率为 $(1-q_x)^M\leq e^{-Mq_x}$。所以平均覆盖失败率至多

$$
\sqrt{\eta_n}+
\exp\!\left[-M2^{-n(I+\epsilon)}(1-\sqrt{\eta_n})\right].
$$

取 $M=\lceil2^{nR}\rceil$ 且 $R>I+\epsilon$，两项都趋零。有界失真下，失败事件的期望成本也趋零；再选择 $D'+\epsilon\lt D$，便得到达标的长码。存在性来自对码本取平均，不承诺所有随机码本都好。

这段证明明确用了有限字母表与有界失真。高斯平方误差是无界情形，还需尾部可积性处理。一般可达性和边界条件见 [MIT 第24章](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/aaa8d18ddecde45f97134d3f3dcee4a3_MIT6_441S16_chapter_24.pdf)。

## 5. BA迭代：边缘不动，并不足以保证最优

采用自然对数单位，固定 $\beta\geq0$，最小化

$$
I_{\rm nat}(X;\widehat X)+\beta\mathbb E d.
$$

若互信息以 bit 计算，则同一目标中的系数为 $\beta/\ln2$；不能把数值相同的两个乘子直接互换。

BA从重构边缘 $q^{(t)}$ 出发，交替执行

$$
Z_x^{(t)}=\sum_yq_y^{(t)}e^{-\beta d(x,y)},
\quad
W^{(t)}(y\mid x)=\frac{q_y^{(t)}e^{-\beta d(x,y)}}{Z_x^{(t)}},
$$

$$
q_y^{(t+1)}=\sum_xp_xW^{(t)}(y\mid x).
$$

它交替最小化 $\sum_xp_xD_{\rm KL}(W_x\|q)+\beta\mathbb E d$。固定 $W$ 时最优 $q$ 是其输出边缘；固定 $q$ 时用归一化指数公式得到最优 $W$。

如果某个 $q_y^{(0)}=0$，其后每一步该分量都为零。于是一个坏的边界起点可能原地不动：例如 $p=0.1,\beta=3,q^{(0)}=(1,0)$，重构永远为 0，边缘变化量为 0，失真仍是 0.1。这不能当作全局最优。

实验保留固定步数的全部轨迹，以 log-sum-exp 计算；很小但非零的内部概率保留对数，不靠人为添加最小正数改变支持。最后的微小负互信息或负对偶差若由舍入产生，也保留原始值并标为浮点诊断。

## 6. 给BA一个可复算的上下界

对当前 $q$，记

$$
g(q)=-\sum_xp_x\ln Z_x,
\qquad
c_y=\sum_x\frac{p_xe^{-\beta d(x,y)}}{Z_x}.
$$

设 $A=\max_yc_y$。因为 $\sum_yq_yc_y=1$，有 $A\geq1$。取 $a_x=(AZ_x)^{-1}$，则每个 $y$ 都满足

$$
\sum_xp_xa_xe^{-\beta d(x,y)}\leq1.
$$

为什么这给下界？对任意联合分布，把 $p_xa_xe^{-\beta d(x,y)}$ 看成总质量不超过 1 的候选反向分布。KL非负给出

$$
\sum_xp(x\mid y)\ln\frac{p(x\mid y)}{p_x}
+\beta\sum_xp(x\mid y)d(x,y)
\geq\sum_xp(x\mid y)\ln a_x.
$$

对 $y$ 平均，得到所有测试信道共同遵守的下界

$$
L=g(q)-\ln A
\leq\min_W\{I_{\rm nat}(W)+\beta D(W)\}.
$$

当前实际 $W$ 的 $U=I_{\rm nat}(W)+\beta D(W)$ 是上界。于是 $U-L$ 比边缘变化量更直接反映最优性余量；它同时检查未被当前 $q$ 使用的输出列，能发现支持锁死。

在二元 Hamming 模型中，还能独立核对最优失真

$$
D_\beta=\min\!\left\{p,1-p,\frac1{1+e^\beta}\right\},
$$

然后代入第2节公式得到最优目标。此处算法用固定乘子，并不是“输入一个预算就自动求出相应乘子”。面板把预算下的解析最优信道与乘子下的BA轨迹分别列明。

## 7. 高斯反注水：保留方向也要付精度成本

设独立实高斯坐标 $X_i\sim N(0,\lambda_i)$，总平方误差预算为 $D_{\rm tot}$。这里先按**每个向量**计率，不除以坐标数。单坐标 $\lambda_i>0$ 时，$0\lt D_i\lt \lambda_i$ 的信息率为 $\tfrac12\log_2(\lambda_i/D_i)$；$D_i\geq\lambda_i$ 时零率；$D_i=0$ 时无穷率。

高斯的可达联合分布可以反向写成

$$
X_i=\widehat X_i+Z_i,
\quad
\widehat X_i\sim N(0,\lambda_i-D_i),
\quad Z_i\sim N(0,D_i),
\quad \widehat X_i\perp Z_i.
$$

下界来自 $h(X_i\mid\widehat X_i)=h(X_i-\widehat X_i\mid\widehat X_i)\leq h(X_i-\widehat X_i)$ 与给定方差的高斯最大熵性质。精确模型并不要求前向误差独立于原信号。

最小化各坐标码率之和，并约束 $\sum_iD_i\leq D_{\rm tot}$。对活动坐标求导，

$$
-\frac1{2\ln2\,D_i}+\mu=0.
$$

因此活动坐标获得相同绝对失真水位 $\theta$，被丢弃的坐标最多花掉自身方差：

$$
D_i=\min(\lambda_i,\theta),\qquad
\sum_i\min(\lambda_i,\theta)=D_{\rm tot}
$$

（预算小于总方差时），且

$$
R_{\rm vector}=\frac12\sum_{\lambda_i>\theta}\log_2\frac{\lambda_i}{\theta}.
$$

零方差坐标不承载信息；总预算超过总方差时，全部重构为零即可，剩余预算不必用尽。实验用精确分数确定活动集合和水位，再计算对数码率。若需每坐标率，将总率除以维数。

相关高斯向量可以正交对角化协方差，平方误差在正交变换下不变，再对特征值反注水。小方差方向可能被舍弃，大方差方向却仍有有限精度成本；这比“只保留几个PCA分量”多了一步。参阅 [Stanford EE274 变换编码讲义](https://stanforddatacompressionclass.github.io/notes/lossy/transform_coding_theory.html)。

## 8. 类型概率：先保留有限前因子

对二元 IID 源，$K$ 为 1 的个数，$q=k/n$。给定类型有 $\binom nk$ 个词，每个词的概率为 $p^k(1-p)^{n-k}$。因此

$$
P(K=k)=\binom nkp^k(1-p)^{n-k}.
$$

当 $0\lt p\lt 1$ 时，单词概率可写为

$$
p^k(1-p)^{n-k}
=2^{-n[H_2(q)+D_2(q\|p)]}.
$$

二元类型基数满足一个够用的多项式界

$$
(n+1)^{-2}2^{nH_2(q)}\leq\binom nk\leq2^{nH_2(q)}.
$$

下界也可取更紧的 $(n+1)^{-1}$：在 Bernoulli$(q=k/n)$ 下，$k$ 是二项分布的众数，其质量至少为 $1/(n+1)$。乘回每词概率便得到所需类型基数下界。上界来自该类型在同一分布下的总概率不超过 1。

所以 $2^{-nD_2(q\|p)}$ 表示指数部分，**不等于有限类型的精确质量**。若 $p$ 为端点而类型使用了源中不可能的符号，则质量为零、KL为无穷，不能用截到某个小正数的曲线替代。

对于任意已选择的类型集合，实验精确计算其总概率 $P_E$、其中最大的类型质量 $m_*$ 和正概率类型数 $N_E$。可直接核对

$$
m_*\leq P_E\leq\min(1,N_Em_*).
$$

这个有限分数界与依赖对数的KL诊断并列显示；空事件时各质量为零，没有条件分布。

## 9. Sanov：开集、闭集与格点各做什么

设有限字母表上的 IID 真分布为 $P$，经验分布为 $\widehat P_n$。以整个概率单纯形的相对拓扑取事件 $E$ 的内部和闭包，Sanov给出

$$
-\inf_{Q\in E^\circ}D_2(Q\|P)
\leq\liminf_n\frac1n\log_2P(\widehat P_n\in E)
$$

$$
\leq\limsup_n\frac1n\log_2P(\widehat P_n\in E)
\leq-\inf_{Q\in\overline E}D_2(Q\|P).
$$

约定空集上的下确界为 $+\infty$，不满足绝对连续的 $Q$ 的KL也为 $+\infty$。只有内外两侧的最小代价一致时，这份夹逼才给出一个共同指数。该表述的更一般形式见 [Chafaï：From Boltzmann to random matrices and beyond，第648页](https://numdam.org/item/10.5802/afst.1459.pdf)。

有限字母表上的证明可以直接接第8节：类型数至多为多项式，上界对各类型求和；下界在事件内部选一个分布，用越来越细的整数类型逼近它。内部条件确保近似类型最终仍在事件里。

例如“恰好 $K/n=0.7$”是一个单点事件。若 $n$ 不是 10 的倍数，根本没有对应整数类型，概率为零；若 $n$ 是 10 的倍数，又有正概率。不能把某个有限KL值当成所有长度都适用的概率等式。实验的单点模式用分数精确判断格点，不借浮点容差把相邻比例算作相等。

相比之下，公平硬币事件 $K/n\geq0.7$ 的极限速率是 $D_2(0.7\|0.5)\approx0.118709100769$。在 $n=100$ 时，实际概率约 $3.9250698228\times10^{-5}$，实际负对数除以100约为 $0.146369221562$；有限前因子仍看得见。

## 10. 条件分布与指数倾斜：有限平均不等于极限点

二元事件的完整条件分布为

$$
P(K=k\mid E)=\frac{\mathbf1_E(k)P(K=k)}{P(E)}.
$$

公平硬币在 $n=100,K/n\geq0.7$ 条件下，平均正面比例约为 $0.706613947501$，并非精确的 0.7。在这一闭尾事件中，KL在 $q\geq0.7$ 上唯一最小于 0.7；更远区域有严格更大代价，因此条件质量随长度增长集中到边界附近。

一般有限字母表、正的真分布 $p_i$、线性均值约束下，KL最小化的驻点满足

$$
q_i(\lambda)=\frac{p_i e^{\lambda f_i}}{\sum_jp_j e^{\lambda f_j}}.
$$

令 $\psi(\lambda)=\ln\sum_i p_i e^{\lambda f_i}$，则 $\psi'(\lambda)=\mathbb E_{q_\lambda}f$。在可行的内部均值 $a$ 上选择 $\psi'(\lambda)=a$，有

$$
D_{\rm nat}(q_\lambda\|p)=\lambda a-\psi(\lambda).
$$

所以 Cramér 速率函数是**对数矩母函数**的 Legendre 变换；KL最小化给出同一个代价。不能把两种对象的名字交换。对一般集合，还需核对唯一投影和事件正则性，才有条件集中到某个单一分布的结论。信息投影的推导见 [MIT 第12章](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/70ca499b4657031ee80dedff6f4a5a22_MIT6_441S16_chapter_12.pdf)。

## 11. 四道完整练习：从有限记录走回证明

### 练习一：偏置源的前向信道究竟长什么样？

令 $p=0.1,D=0.05$，构造最优测试联合分布，并求两个前向错误概率。

<details class="answer" markdown="1">
<summary>展开完整答案：对称的是反向，不是任意方向</summary>

$q=(p-D)/(1-2D)=1/18$。按行 $X=0,1$、列 $\widehat X=0,1$ 排列，

$$
P_{X\widehat X}=\frac1{360}
\begin{pmatrix}323&1\\17&19\end{pmatrix}.
$$

行和是 $0.9,0.1$；两项错误质量之和为 $18/360=0.05$。由行归一化，

$$
P(\widehat X=1\mid X=0)=\frac1{324},
\qquad
P(\widehat X=0\mid X=1)=\frac{17}{36}.
$$

两者明显不同，但加权平均仍为 0.05。反向条件于重构时，错误概率才都是 0.05。互信息为 $H_2(0.1)-H_2(0.05)\approx0.182598636473$ bit/符号。这个联合分布证明单字母优化取等；它本身不是一份任意有限长度的确定性码本。

</details>

### 练习二：平均达标为什么仍有四分之一以上的坏块？

三位独立 Bernoulli$(0.1)$，重构词为000和111，最近邻编码。求平均每位失真、最大支持失真与超过0.1的概率。

<details class="answer" markdown="1">
<summary>展开完整答案：平均、最大与超额概率三列分开</summary>

全零和全一词准确重构。其余六个词都有一位重构错误，总概率为

$$
3(0.1)(0.9)^2+3(0.1)^2(0.9)=0.27.
$$

这些词每位失真为 $1/3$，所以平均为 $0.27/3=0.09$，最大为 $1/3$，超过 0.1 的概率为 0.27。该码率为 $1/3$ bit/符号。使用标签1的概率为至少两个1的概率，即 $3(0.1)^2(0.9)+(0.1)^3=0.028$；标签熵约为0.184260593340 bit/块。

这个结果满足信息下界，但平均达标没有推导出逐条达标。若严格要求零失真，因为八个词都有正概率，需八个不同重构词，码率为1。允许长度增长且平均失真趋零时，才可接到熵率约0.468995593589的几乎无损边界。

</details>

### 练习三：三维高斯的预算怎样分配？

独立坐标方差为 $9,4,1$，总平方失真预算为3。求反注水水位、逐坐标码率和前向重构条件分布。

<details class="answer" markdown="1">
<summary>展开完整答案：保留方向仍有非零误差</summary>

方程 $\min(9,\theta)+\min(4,\theta)+\min(1,\theta)=3$ 给出 $\theta=1$。失真分配为 $(1,1,1)$，逐坐标码率为

$$
\left(\frac12\log_2 9,\frac12\log_2 4,0\right)
=(1.584962500721,1,0).
$$

总率约为2.584962500721 bit/三维向量；每坐标约为0.861654166907 bit。第三个方向重构为零，前两个方向仍有误差方差1。

一般 $\lambda>0$ 的前向最优条件分布为

$$
\widehat X\mid X=x\sim N\!\left(\frac{\lambda-D}{\lambda}x,
\frac{D(\lambda-D)}{\lambda}\right).
$$

因此两个活动方向分别为均值 $8x/9$、噪声方差 $8/9$，以及均值 $3x/4$、噪声方差 $3/4$。独立性出现在反向分解 $X=\widehat X+Z$，不能把这个前向模型误写成原信号加独立单位噪声。

</details>

### 练习四：同样写0.7，为何有时概率恰好为零？

比较公平硬币在 $n=100$ 与 $n=101$ 时“正面比例恰好0.7”，再说明“至少0.7”为何不同。

<details class="answer" markdown="1">
<summary>展开完整答案：格点先于渐近指数</summary>

在 $n=100$ 时，单点事件为 $K=70$，概率是 $\binom{100}{70}2^{-100}$。在 $n=101$ 时，需要 $K=70.7$，没有整数计数，因此概率严格为零。沿10的倍数可见有限KL指数，沿其他长度却为零；完整序列上不能写同一个有限指数极限。

“至少0.7”在 $n=101$ 时对应 $K\geq71$，始终有可行类型。这类闭尾事件的边界可由内部类型逼近，内外最小KL一致，极限指数才是 $D_2(0.7\|0.5)$。有限概率应按实际整数阈值求和，不能直接把指数部分当作精确值。

</details>

## 12. 怎样把这些结论带到真实压缩问题

高斯正码率段满足 $D=\sigma^2 2^{-2R}$，所以在同一理想模型中增加一比特，最优平方失真预算除以4，对应约6.02dB。这个等式不自动说明某份音频从16位改成8位就损失48dB：真实源分布、削波、量化方法、感知度量和编解码器的有限性能都需要另测。第23.1节的高码率标量量化近似也有自己的假设。

神经压缩的训练目标同样需要清楚的账本。例如对编码分布 $q(z\mid x)$ 与候选先验 $p(z)$，在KL有定义时，

$$
\mathbb E_XD_{\rm KL}(q(Z\mid X)\|p(Z))
=I_q(X;Z)+D_{\rm KL}(q(Z)\|p(Z)).
$$

右端第二项是边缘模型失配代价，因此一个训练中的KL项不自动等于互信息，更不自动等于最终文件字节数。用率失真思想分析工程系统时，应明确源、失真函数、码率口径、模型限制及实际编码方式。

进入最优传输前，可以复述四个机制：反向测试信道怎样构造边界，有限码本怎样付出真实失真，反注水怎样分配精度，类型计数怎样留下KL指数。它们共享优化与概率工具，但各自约束和可观测量必须完整保留。

</div>
