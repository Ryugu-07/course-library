# 随机过程 I · 基本概念与 Poisson 过程

> 随机过程研究一族随时间变化的随机变量，以及它们之间的联合关系。本页用 Poisson 过程串起三种描述：发生了多少次、两段时间是否互相影响、下一次还要等多久。它是有明确假设的到达模型，不是所有随机事件流的通用答案。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="poisson-learning-title">

## 学习层：同一事件流的三本账

### 1. 具体情境：客服队列如何描述“随机到达”？

某客服队列平均每小时接到 $\lambda=4$ 个电话。运营者想同时回答三件事：一小时的来电数如何分布；前 15 分钟和后 15 分钟的计数是否互相提供信息；已经等了很久还没有电话后，剩余等待时间是否会改变。

这三问分别对应计数、增量和等待时间。把 $\lambda$ 读成“每小时恰好来一个的概率”，或把一条短模拟路径当成过程定理的证明，都会把模型对象读错。

### 2. 先预测：先选语义，再打开路径

实验固定 $\lambda=2$、$T=4$ 的最小过程，并用固定 seed 生成一条阶梯路径与一批重复抽样。揭示前先判断：

1. $\lambda$ 首先是计数率、单次事件概率，还是每次等待时间？
2. 两个不重叠区间的计数增量应当独立、相等，还是互相排斥？
3. 指数等待时间的无记忆性如何把“已等 $u$”从条件中消掉？
4. 有限模拟能否证明独立平稳增量和 Poisson 计数的过程公理？

### 3. 正式桥：计数过程与等待时间互相翻译

强度 $\lambda$ 的 Poisson 过程满足

$$
N(0)=0,\qquad
N(t+s)-N(s)\sim\operatorname{Poisson}(\lambda t),
$$

这里取 $\lambda>0$，并使用从零出发、右连续、局部有限且每次跳 $1$ 的计数版本。不重叠区间的增量独立。于是

$$
E[N(t)]=\operatorname{Var}(N(t))=\lambda t,
$$

这里的 $\lambda$ 是单位时间的平均计数率；在长度为 $t$ 的区间内恰好发生一次的概率是 $\lambda t e^{-\lambda t}$，并不等于 $\lambda$。

令相邻事件间隔为 $W_1,W_2,\dots$，则等价刻画是

$$
W_i\stackrel{\mathrm{iid}}{\sim}\operatorname{Exp}(\lambda),
\qquad
P(W>u+v\mid W>u)=P(W>v)=e^{-\lambda v}.
$$

等待时间无记忆性解释了“等了多久”不会改变剩余等待分布；第 $k$ 次到达时间是 $S_k=W_1+\cdots+W_k\sim\operatorname{Gamma}(k,\lambda)$，这里第二个参数是速率（rate），不是尺度，故 $E[S_k]=k/\lambda$。这是计数语言与到达时刻语言之间的正式桥。

### 4. 定理、迁移与失败边界

- **计数率不是概率。**$\lambda$ 有单位“每时间”，$N(t)$ 的均值是 $\lambda t$；单个时间窗的计数概率还要由 Poisson 质量函数计算。
- **独立和平稳是两条不同性质。**独立增量说不重叠区间的随机增量不互相提供信息；平稳增量说分布只看区间长度。高峰时段的非齐次过程可以保留某些结构但失去平稳增量。
- **等待时间有无记忆性是模型结论。**一般分布的等待不会自动无记忆；指数分布才给出上面的条件尾概率。更新过程、聚集到达或抑制到达不能机械套用。
- **有限模拟不是过程公理证明。**固定 seed 的阶梯图、经验均值、方差和协方差只是有限样本的校准材料；它们不能证明所有区间上的独立平稳增量。
- **应用迁移要重查假设。**排队到达、稀疏化和叠加常用 Poisson 近似，但批量到达、容量反馈、季节性强度、事件互相触发时，应考虑复合、非齐次或自激过程。

### 5. 动手实验：揭示前隐藏结果，揭示后联动参数

提交四项预测前不显示路径、表格或答案。揭示后拖动 $\lambda$、$T$ 与重复次数，路径、经验直方图和统计账本同步更新；也可输入整数 seed 或切换到下一个 seed。四个预测检验模型语义，参数改变后可继续探索；若修改预测答案，则必须重新提交，重置会恢复默认参数并隐藏结果。

<div class="learning-lab" data-learning-lab="poisson-process" markdown="1">

**JavaScript 失效时的静态 fallback：**默认 $\lambda=2$、$T=4$。理论账本为

$$
E[N(4)]=\operatorname{Var}(N(4))=8,
\qquad
E[W]=\frac12,
\qquad
P(N(4)=0)=e^{-8}.
$$

取 $u=0.2$、$v=0.3$ 小时，则无记忆性写成

$$
P(W>u+v\mid W>u)=P(W>v)=e^{-0.6}\approx0.5488.
$$

| 对象 | 静态读法 | 不要偷换成 |
|---|---|---|
| $\lambda$ | 单位时间平均计数率 | 每个时间窗恰好一次的概率 |
| 不重叠增量 | 独立，分布只看各自长度 | 两段计数必须相等 |
| 等待时间 | 指数分布，具有无记忆性 | 任意等待分布都无记忆 |
| 固定 seed 路径 | 直觉和数值校准 | 有限图像已经证明过程公理 |

</div>

**三项读图约定。** 第一条阶梯路径只是一条实现；直方图则使用全部重复计数，最后一栏保留超过本批最大计数的理论尾概率，经验为零不等于理论为零。等待统计使用每次另抽的完整指数等待，并非只挑出观察窗内已经完成的短间隔。样本方差和协方差用 $R-1$ 作分母；表中的标准误描述抽样尺度，不是每批结果必须满足的硬误差界。

</section>

## 1. 基本语言

**定义** 随机过程 = 随机变量族 $\{X(t),\ t \in T\}$（$T$ 为指标集：离散 = 序列，连续 = 时间轴；$X(t)$ 的取值范围叫状态空间）。**双重视角**：固定 $t$ 看是随机变量（截面），固定样本点 $\omega$ 看是时间函数（**轨道/样本路径**）——过程 = “随机的函数”。

**有限维分布**是任意有限个时刻的联合分布，例如 $(X(t_1),X(t_2),X(t_3))$。对实值状态，若这些分布在取边缘、重排指标时相容，Kolmogorov 延拓定理可在乘积空间上构造相应过程。它不自动保证样本路径连续或右连续；路径正则性还要另行证明或选择合适版本。

一阶矩存在时定义均值函数 $m(t)=E[X(t)]$。实值过程具有有限二阶矩时，区分

$$
R(s,t)=E[X(s)X(t)],\qquad
C(s,t)=\operatorname{Cov}(X(s),X(t))
=R(s,t)-m(s)m(t).
$$

$R$ 是未中心化的自相关函数，$C$ 是自协方差函数；只有相应均值为零时两者才相同。

**平稳过程与平稳增量不是同一回事。** 严平稳指允许的时间平移不改变任意有限维分布；宽平稳要求有限二阶矩、均值常数且协方差只依赖时差。独立增量指不重叠时间区间上的增量互相独立；平稳增量只说增量分布由区间长度决定。

对 Poisson 过程，若 $s\le t$，则 $N(t)=N(s)+(N(t)-N(s))$，右侧两项独立，故

$$
m(t)=\lambda t,\qquad
C(s,t)=\lambda\min(s,t),\qquad
R(s,t)=\lambda\min(s,t)+\lambda^2st.
$$

均值随 $t$ 改变，所以 $N(t)$ 本身不是平稳过程；它具有平稳增量。不要把这两个词省略成同一个“平稳”。

## 2. 从局部到达规则推导计数分布

<style>
.poisson-static{max-width:100%;overflow-x:auto}.poisson-static img{width:1100px!important;min-width:1100px;max-width:none!important}.poisson-static:focus-visible{outline:3px solid var(--cl-focus)}
@media(prefers-reduced-motion:reduce){html:has(.poisson-static){scroll-behavior:auto!important}}
</style>
<figure class="plot" markdown="1">
<div class="poisson-static" role="region" tabindex="0" aria-label="可横向滚动的Poisson静态示意图" markdown="1">

![固定种子生成的计数阶梯与同一速率的理论计数概率；实心和空心区分到达后的值与到达前的左极限](assets/img/stoch-01-poisson-process.svg)

</div>
<figcaption><span class="fig-id">图 1.1</span>路径展示一次实现，概率图描述重复实验的分布。到达时 N(t) 取跳跃后的值；连起来的竖线只提示发生跳变。图框可聚焦后用方向键横向阅读。</figcaption>
</figure>

在通常的简单计数过程框架下，齐次 Poisson 模型可从独立、平稳增量及下列小时间规则定义：

$$
P(N(h)=1)=\lambda h+o(h),\qquad
P(N(h)\ge2)=o(h),\qquad N(0)=0.
$$

这里 $h\downarrow0$，且 $\lambda>0$；第一式不是对任意有限 $h$ 的精确等式。它与常见的“增量服从 $\operatorname{Poisson}(\lambda h)$”定义等价。

令 $p_k(t)=P(N(t)=k)$。独立增量把最后一小段时间与此前分开，得到

$$
p'_0(t)=-\lambda p_0(t),\qquad
p'_k(t)=\lambda p_{k-1}(t)-\lambda p_k(t)\quad(k\ge1),
$$

初值为 $p_0(0)=1,p_k(0)=0$。解得

$$
p_k(t)=e^{-\lambda t}\frac{(\lambda t)^k}{k!}.
$$

例如 $p_0(t)=e^{-\lambda t}$ 先由第一条方程得到，再依次代入后续方程。这个推导说明泊松分布来自独立增量和局部单次到达规则，不是画出一条阶梯后观察出来的定理。$\lambda=0$ 可单独定义为恒为零的退化过程，此时没有有限的下一次到达时间，不能再使用均值 $1/\lambda$。

### 计数与 iid 指数间隔为何等价？

第一步容易：

$$
P(W_1>t)=P(N(t)=0)=e^{-\lambda t}.
$$

但这一行只证明首次等待的分布。后续到达时刻 $S_n$ 是随机时刻，不能直接把“固定不重叠区间独立”当作已经证明了所有间隔 iid。可以用标准右连续 Poisson 过程的强 Markov 性处理随机时刻；下面给出更具体的反向构造。

从 $W_i$ iid $\operatorname{Exp}(\lambda)$ 出发，设 $S_0=0$、$S_n=\sum_{i=1}^nW_i$、$N(t)=\max\{n\ge0:S_n\le t\}$。因为 $S_n/n\to1/\lambda$，有限时间内几乎必然只有有限次到达。对有序时刻 $0<s_1<\cdots<s_n<T$，前 $n$ 个间隔的密度乘上“下一次尚未到达”的概率为

$$
\lambda^n e^{-\lambda s_n}e^{-\lambda(T-s_n)}
=\lambda^n e^{-\lambda T}.
$$

把 $(0,T]$ 分成长度 $\Delta_1,\dots,\Delta_m$ 的区间，规定各区间分别有 $n_1,\dots,n_m$ 次到达。每个区间内有序点区域的体积是 $\Delta_j^{n_j}/n_j!$，积分得

$$
P(\Delta N_j=n_j,\ 1\le j\le m)
=\prod_{j=1}^m e^{-\lambda\Delta_j}
\frac{(\lambda\Delta_j)^{n_j}}{n_j!}.
$$

联合概率分解为泊松概率的乘积，正好证明了该构造有独立平稳 Poisson 增量。相同的有限维分布和标准计数路径版本给出两种刻画的一致性，而不是只凭一个等待时间的无记忆性推断整条流。[Gallager：Poisson Processes](https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/3a19ce0e02d0008877351bfa24f3716a_MIT6_262S11_chap02.pdf)。

## 3. 三大运算：每条结论都依赖独立性的具体位置

**叠加。** 相互独立的 Poisson 过程之和仍是 Poisson，速率相加。独立性不能省略：把同一个过程加给自己得到 $2N(t)$，每次跳 $2$，显然不是正速率的简单 Poisson 计数过程。

**独立稀疏化。** 每个事件用独立于原流及其他标记的 Bernoulli$(p)$ 标记分到保留流 $A$ 或丢弃流 $B$。在长度 $t$ 的时间窗，联合概率母函数为

$$
E[z^{A(t)}w^{B(t)}]
=\exp\{\lambda t[pz+(1-p)w-1]\}
=e^{\lambda pt(z-1)}e^{\lambda(1-p)t(w-1)}.
$$

它分解成两个 Poisson 母函数；结合不重叠区间的独立性，得到两条独立 Poisson 流，速率分别为 $\lambda p,\lambda(1-p)$。若总数 $N(t)=n$ 已被固定，两条流的计数就受 $A+B=n$ 约束而负相关；条件化改变了问题。

**条件均匀性。** 给定 $N(T)=n$，有序到达时刻的联合密度为 $n!/T^n$，位于 $0<s_1<\cdots<s_n<T$ 的单纯形内。这正是 $n$ 个独立 $U(0,T)$ 点排序后的分布。排序前独立，排序后不独立；较早的到达不可能跑到较晚的到达之后。

### 非齐次与复合模型分别改了什么？

非齐次 Poisson 过程采用确定的非负、局部可积速率 $\lambda(t)$，记 $\Lambda(t)=\int_0^t\lambda(r)\,dr$。不重叠增量仍独立，但

$$
N(t)-N(s)\sim\operatorname{Poisson}(\Lambda(t)-\Lambda(s)).
$$

从固定时刻 $s$ 开始，再等 $v$ 仍没有事件的概率为
$\exp[-\int_s^{s+v}\lambda(r)\,dr]$，一般取决于绝对时刻 $s$，所以不能套用 iid 常速率指数间隔。若速率本身随机，或过去事件会改变未来速率，又是不同模型。

复合 Poisson 过程则让每次到达带上大小 $Y_i$，$Z(t)=\sum_{i=1}^{N(t)}Y_i$。若 $Y_i$ iid 且与整个计数过程独立，在相应矩有限时，

$$
E[Z(t)]=\lambda tE[Y],\qquad
\operatorname{Var}(Z(t))=\lambda tE[Y^2].
$$

第二式不是 $\lambda t\operatorname{Var}(Y)$，还包含事件总数本身波动带来的部分。新闻、订单、索赔或排队数据可以用这些模型作候选，但是否有季节性、批次、互相触发或反馈，需要数据检验，不能只凭“随机到达”四字认定为 Poisson。

## 4. 典型例题

**例 1（基本计算）** 客服电话 $\lambda = 4$ 次/小时。求 (a) 一小时内恰 2 次；(b) 15 分钟无电话；(c) 第 3 次电话在 1 小时内到来的概率。
*解*：(a) $P(N(1) = 2) = \frac{4^2}{2!}e^{-4} \approx 0.147$；(b) $P(N(0.25) = 0) = e^{-1} \approx 0.368$；(c) $P(S_3 \leq 1) = P(N(1) \geq 3) = 1 - e^{-4}(1 + 4 + 8) \approx 0.762$。（**到达时刻问题转成计数问题**——$S_n \leq t \iff N(t) \geq n$，本页最常用的翻译。）

**例 2（稀疏化）** 网站访问 $\lambda = 100$/分钟，每访客独立以 3% 概率下单。下单流是什么？
*解*：强度 $3$/分钟的 Poisson 过程；一分钟无订单概率 $e^{-3}$。

**例 3（条件均匀性）** 已知 $[0, 1]$ 小时内来了 2 封邮件，求都在前 20 分钟到达的概率。
*解*：可先取两个未排序位置 i.i.d. $U(0,1)$，再排序得到实际到达时刻 $(S_1,S_2)$；排序后的两时刻本身并不独立。“都在前 20 分钟”不受排序影响，所以 $P = (1/3)^2 = 1/9$。$\blacksquare$


## 5. 三道迁移题：区分条件化、变速与选择偏差

<details class="answer" markdown="1">
<summary>题 1：给定总数后，两半时间的计数还独立吗？</summary>

给定 $N(T)=n$，令 $A=N(T/2)$、$B=N(T)-N(T/2)$。条件均匀性给出
$A\mid N(T)=n\sim\operatorname{Binomial}(n,1/2)$，而 $B=n-A$，故

$$
\operatorname{Cov}(A,B\mid N(T)=n)=-n/4.
$$

未固定总数时，两段增量独立、协方差为零，两者不矛盾。全协方差公式给
$E[-N(T)/4]+\operatorname{Cov}(N(T)/2,N(T)/2)=0$。注意这个抵消核对了协方差，完整独立性仍来自模型的联合分布分解。

</details>

<details class="answer" markdown="1">
<summary>题 2：前半小时速率 4，后半小时速率 8，该怎样计算？</summary>

以小时为单位，设速率在 $[0,1/2]$ 为 $4$，在 $(1/2,1]$ 为 $8$。两个半小时的增量分别是独立的 Poisson$(2)$ 和 Poisson$(4)$，总数为 Poisson$(6)$，整小时无事件概率为 $e^{-6}$。

在时刻 $s=0$ 开始等四分之一小时，无事件概率 $e^{-1}$；在时刻 $s=1/2$ 开始等同样久，概率 $e^{-2}$。过程仍有独立增量，却没有平稳增量。速率改变后，不能把“等待均值一直为 $1/4$ 小时”作为结论。

</details>

<details class="answer" markdown="1">
<summary>题 3：只保留观察窗内完成的等待，平均值会怎样偏？</summary>

即使先只看首次等待，若只记录 $W\le T$ 的样本，记录到的分布也是截断指数，而非完整指数。计算得

$$
E[W\mid W\le T]
=\frac1\lambda-\frac{T}{e^{\lambda T}-1}
<\frac1\lambda\qquad(T>0).
$$

例如 $\lambda=2,T=1$ 时约为 $0.3435$，明显小于 $0.5$。实验因此在计数路径之外另抽完整等待来比较 $E[W]$ 和无记忆尾概率。现实观察中的右删失还可以用生存分析方法处理，不能直接把未完成等待丢掉。

</details>

---

*下一页：[Markov 链与转移](stoch-02-markov-1.html)。也可回看[条件分布与协方差](prob-03-multivariate.html)，核对“独立”与“不相关”的区别。*
