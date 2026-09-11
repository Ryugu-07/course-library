# 矩阵分析 III · 非负矩阵与 Perron–Frobenius

> **前置**：ma-01 的谱半径与非正规性、ma-02 的矩阵序、线性代数中的特征空间、有限 Markov 链。
> **本课问题**：同一个网络反复传递资源，长期比例何时唯一，何时轮换，何时依赖起点？学完后，你应能从矩阵写出正确方向的图，区分不可约、本原与可约情形，并用实际迭代和可核对的误差界检验计算。

<div data-learning-page></div>
<style>
.perron-course .katex{position:relative}
.perron-course .pf-fallback td:last-child{white-space:nowrap;font-size:.9em}
</style>
<noscript><style>.perron-course span.arithmatex{overflow-wrap:anywhere;word-break:break-word;white-space:normal}</style></noscript>
<div class="perron-course" markdown="1">

<section class="learning-layer" markdown="1" aria-labelledby="perron-learning-title">

## 学习层：先分清“能到达”和“会混合”

<h3 id="perron-learning-title">从两间房轮流开灯开始</h3>

两间房之间只有互相通往对方的门。人可以从任一房到另一房，网络完全连通；但如果所有人每分钟都必须过门，那么奇数分钟与偶数分钟的位置一直不同。**连通解决“最终能不能到”，非周期性才解决“会不会只在固定节拍到”。**

本课把数量放进列向量，采用

$$
x_{k+1}=Ax_k,\qquad (Ax)_i=\sum_j A_{ij}x_j.
$$

所以 $A_{ij}>0$ 的箭头是 **$j\to i$**。行随机矩阵教材常用相反约定；只要相应转置，理论不变。先固定约定，再讨论资源流向、左右特征向量或排名。

### 先预测，再看数据

1. 不可约网络一定会混合吗？
2. 可约矩阵的主特征空间一定多维吗？
3. 迭代几十步看起来不动，能证明本原吗？
4. PageRank 中的残差界在 $\alpha=1$ 时还能使用吗？

### 三种实验，各自回答一个问题

| 实验 | 可以改变什么 | 应当核对什么 |
|---|---|---|
| 二维非负矩阵 | 四个矩阵元素、起点、单位尺度 | 主空间维数与代数重数、左右向量、周期、每一步实际乘法 |
| 带权三环 | 三条边的权重、共同自环 | 三个复特征值，为什么自环可以改变周期但整体缩放不改变周期 |
| 随机链与 PageRank | 悬挂节点、惰性化、个性化跳转、阻尼 | 精确列和、精确参考分布、实际误差与残差上界 |

二维与三环实验归一化每一步的数量；PageRank 实验直接迭代概率。**不要把这两种归一化方式混在一起。**图上零值保留；对数图只能放正数。相等或重叠的曲线不会被人为分开。

<div class="learning-lab" data-learning-lab="perron-frobenius" markdown="1">

**无 JavaScript 时：**先看下方固定参数图与数值，再完成第 11 节四道练习。静态图来自随课程保存的完整计算记录；交互页面则按当前浏览器重新计算。

<figure class="plot" markdown="1">
[![网络方向、完整复谱、周期迭代与PageRank误差](assets/img/ma-03-perron-ledgers.svg)](assets/img/ma-03-perron-ledgers.svg)
<figcaption>图3.1：同一组输入的实际计算。可点开原图；四个面板分别核对传递方向、三周期相位、原始轮换与误差上界。</figcaption>
</figure>

<div class="pf-fallback" markdown="1">

固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵、精确分数与计算记录](assets/learning/projects/perron-frobenius/run-snapshot.json)。三环权重为(2,0.5,1)，无自环；交换例起点(1,0.25)；Jordan例为[[1,1],[0,1]]、起点(1,1)；PageRank为三周期列随机矩阵、α=0.5、跳转分布(0.5,0.25,0.25)、起点(1,0,0)。观察24步，单位尺度为1。

| 固定参数下的量 | 参考值 |
|---|---:|
| 三环谱半径 | 1 |
| 三环次根实部 | -0.5 |
| 三环次根正虚部 | 0.866025403784 |
| 三环周期 | 3 |
| 三环右主向量第0分量 | 0.25 |
| 三环右主向量第1分量 | 0.5 |
| 交换矩阵谱半径 | 1 |
| 交换矩阵另一个根 | -1 |
| 交换矩阵周期 | 2 |
| 交换例第0步第0分量 | 0.8 |
| 交换例第1步第0分量 | 0.2 |
| 交换例初始CW下界 | 0.25 |
| Jordan主空间维数 | 1 |
| Jordan主根代数重数 | 2 |
| Jordan第24步L¹方向误差 | 0.0769230769231 |
| PageRank精确分布第0分量的近似值 | 0.392857142857 |
| PageRank精确分布第1分量的近似值 | 0.321428571429 |
| PageRank精确分布第2分量的近似值 | 0.285714285714 |

分数的有限位显示不等于精确分数本身；严格CW夹逼和PageRank残差上界以快照中的整数分子、分母为准。三环使用解析谱，有限迭代曲线不替代周期定理。Jordan误差对应当前归一化向量，不能拿一维主空间冒充代数单根。

</div>

</div>

### 哪些结论不是一条曲线能给出的

支持图中的边由实际元素是否严格大于零决定。微小正数仍是一条边；不存在“太小所以按零处理”的图论定义。主根的重数、不可约性与周期是结构结论；几十步迭代是否看似平稳是有限观察。精确分数可为当前存储矩阵与当前向量提供证书，但不会替代一般定理的证明。

</section>

## 1. 四个层次：非负、不可约、本原、严格正

这里 $A\geq0$ 是**每个元素非负**，不表示 ma-02 中的半正定矩阵序。交换矩阵

$$
A=\begin{pmatrix}0&1\\1&0\end{pmatrix}
$$

逐元素非负，却有特征值 $-1$，因此不是半正定矩阵。

对 $n\geq2$ 的非负矩阵：

- **不可约**：支持图强连通，任意两节点能沿有向边到达。
- **本原**：存在正整数 $m$，使 $A^m>0$。它要求某个共同的步数可以把每个节点连到每个节点。
- **严格正**：$A>0$，一步已经做到所有传递。

于是

$$
A>0\ \Longrightarrow\ A\text{本原}\
\Longrightarrow\ A\text{不可约}\ \Longrightarrow\ A\geq0,
$$

反向一般不成立。例子依次可取

$$
\begin{pmatrix}1&1\\1&1\end{pmatrix},\quad
\begin{pmatrix}0&1\\2&1\end{pmatrix},\quad
\begin{pmatrix}0&1\\1&0\end{pmatrix},\quad
\begin{pmatrix}2&0\\0&1\end{pmatrix}.
$$

**一维零块要单列。**按允许长度为零路径的强连通约定，单节点零图仍是一个 SCC；但它没有正长度闭路，$\rho([0])=0$，也不本原。本课将其周期记为“不适用”，不把“不可约即 $\rho>0$”无条件套到它身上。一维正标量则周期为 $1$。

## 2. 正矩阵的主方向从哪里来

**Perron 定理。**若 $A>0$，则谱半径 $\rho>0$ 是代数单特征值，存在正左右向量

$$
Av=\rho v,\qquad w^\mathsf TA=\rho w^\mathsf T,
\qquad v,w>0.
$$

其余特征值满足 $|\lambda|\lt\rho$。向量的“唯一”都指相差一个非零倍数；例如可固定 $\mathbf1^\mathsf Tv=1$。

下面把“存在”“占优”“单根”分别证明。

**先在闭单纯形上取得固定点。**令

$$
\Delta=\{x\geq0:\mathbf1^\mathsf Tx=1\},\qquad
F(x)=\frac{Ax}{\mathbf1^\mathsf TAx}.
$$

$\Delta$ 非空、紧且凸。正性保证分母始终正，$F$ 连续并把 $\Delta$ 映入其内部。Brouwer 不动点定理给出 $F(v)=v$，所以 $Av=rv$，其中 $v>0,r>0$。对 $A^\mathsf T$ 同理得到 $w>0$ 与左特征值 $s$；由

$$
s\,w^\mathsf Tv=w^\mathsf TAv=r\,w^\mathsf Tv
$$

得 $s=r$。

**再把矩阵变成随机矩阵。**设 $D=\operatorname{diag}(v)$，则

$$
P=\frac1rD^{-1}AD>0,\qquad P\mathbf1=\mathbf1.
$$

$P$ 的每行是正权重且和为 $1$，故 $\|P\|_\infty=1$；它的全部特征值模不超过 $1$，从而 $r=\rho(A)$。

若 $Pz=\mu z$ 且 $|\mu|=1$，在 $|z_i|$ 最大的行使用

$$
|\mu z_i|=\left|\sum_jP_{ij}z_j\right|
\leq\sum_jP_{ij}|z_j|\leq\max_j|z_j|.
$$

两次不等式必须都取等。由于每个权重严格正，所有 $z_j$ 必须等模且同相，于是 $z$ 是常向量，$\mu=1$。这个论证适用于**复向量**，不需要把复向量说成“有正有负”。

**最后排除 Jordan 链。**主特征空间已一维；若存在 $(A-\rho I)y=cv$ 且 $c\ne0$，左乘 $w^\mathsf T$ 会得到 $0=cw^\mathsf Tv$，矛盾。因此主根还是代数单根。

这一路线中的紧性用于闭单纯形，不能直接用来断言开正锥上的比值函数取得极值。[Boyle 讲义的正矩阵与本原矩阵证明](https://math.umd.edu/~mboyle/papers/pfnotes.pdf)也从固定点和随机化出发。

## 3. Collatz–Wielandt：用正测试向量夹住谱半径

设 $A\geq0$，$x>0$，定义

$$
m(x)=\min_i\frac{(Ax)_i}{x_i},\qquad
M(x)=\max_i\frac{(Ax)_i}{x_i}.
$$

总有

$$
m(x)\leq\rho(A)\leq M(x).
$$

一种证明是取非负左 Perron 向量 $w\ne0$。因为 $w^\mathsf Tx>0$，

$$
\rho(A)=
\frac{w^\mathsf TAx}{w^\mathsf Tx}
=\sum_i\frac{w_ix_i}{w^\mathsf Tx}\frac{(Ax)_i}{x_i},
$$

右边是各分量比值的加权平均。一般非负矩阵也有非负 Perron 向量：可对 $A+\varepsilon\mathbf1\mathbf1^\mathsf T$ 应用上一节，再令 $\varepsilon\downarrow0$ 取归一化向量的收敛子列；特征方程与谱半径的连续性给出结论。

不可约且排除零块例外时 $v>0$，代入主向量就取得上下界的共同值：

$$
\rho(A)=\max_{x>0}m(x)=\min_{x>0}M(x).
$$

**不要把这组“取得极值”的等式直接搬到所有可约矩阵。**例如 $A=\operatorname{diag}(2,1)$，对任意 $x>0$ 都有 $m(x)=1,M(x)=2$；下界永远不会提高到 $\rho=2$。

对 $A=\begin{pmatrix}2&1\\1&2\end{pmatrix}$，起点 $x=(1,1/4)^\mathsf T$ 给出比值 $9/4$ 与 $6$。下一步先乘得 $(9/4,3/2)^\mathsf T$；由于整体缩放不改变比值，新的夹逼变成

$$
\frac83\leq3\leq\frac72.
$$

实验把存储的每个有限二进制数转为精确有理数，再计算这些比值。因此展开表中的**分子、分母**构成当前输入的严格夹逼；图中有限位小数只是该分数的近似显示。测试向量有零或负分量时，这张比值表留空。

## 4. 不可约性、闭路周期与外围复谱

对有正长度闭路的强连通图，周期定义为

$$
h=\gcd\{\text{全部正长度闭路的长度}\}.
$$

强连通保证从不同节点计算得到同一个 $h$。如果分层按步数模 $h$ 分类，每条边只能从第 $j$ 类通向第 $j+1\bmod h$ 类。适当排列坐标后，矩阵呈循环分块形式。

不可约非负矩阵的 $\rho>0$ 为代数单根，有唯一正主方向；但外围谱是

$$
\rho,\ \rho e^{2\pi i/h},\ \ldots,\
\rho e^{2\pi i(h-1)/h}.
$$

这些外围根均为单根。**本原当且仅当不可约且 $h=1$。**可用 $(I+A)^{n-1}>0$ 先得到不可约矩阵的正主向量；外围相位则由循环分块及三角不等式的取等条件确定。[Boyle 的第 3 节](https://math.umd.edu/~mboyle/papers/pfnotes.pdf)给出了循环分块到外围谱的推导。

三节点带权环

$$
N=\begin{pmatrix}0&0&r\\p&0&0\\0&q&0\end{pmatrix},
\qquad p,q,r>0
$$

满足 $N^3=pqrI$。令 $\beta=(pqr)^{1/3}$，全部特征值为

$$
\beta,\quad-\frac{\beta}{2}
+i\frac{\sqrt3\,\beta}{2},\quad
-\frac{\beta}{2}-i\frac{\sqrt3\,\beta}{2}.
$$

对任一根 $\lambda$，向量 $(\lambda^2,p\lambda,pq)^\mathsf T$ 都可直接代入检查。本课三环实验保留完整复向量与实际残差。它使用明确的三次方程，**不是通用矩阵特征值求解器**；也不能把未经收敛判定的 QR 对角线当作完整复谱。

加入 $\delta I$ 会把所有根平移 $\delta$。当 $\delta>0$ 时，自环让周期变为 $1$；整体乘正数则只缩放谱，不改变支持图与周期。

## 5. 幂法为何收敛，起点又能怎样破坏它

对本原矩阵，选 $w^\mathsf Tv=1$，有

$$
\rho^{-k}A^k\longrightarrow vw^\mathsf T.
$$

因此只要 $x_0\geq0$ 且 $x_0\ne0$，正左向量就保证 $w^\mathsf Tx_0>0$，从而

$$
\frac{A^kx_0}{\|A^kx_0\|_1}
\longrightarrow\frac{v}{\|v\|_1}.
$$

**逐元素严格正是足够条件，但不是必要条件。**非零非负起点即使含零分量，也被本原性涵盖。

如果允许实带符号起点，必须看左投影。以

$$
A=\begin{pmatrix}2&1\\1&2\end{pmatrix},\qquad
x_0=(1,-1)^\mathsf T
$$

为例，$w\propto(1,1)^\mathsf T$，$w^\mathsf Tx_0=0$。实际上 $Ax_0=x_0$，归一化迭代始终停在次特征方向。若左投影为负，极限方向则是 $-v/\|v\|_1$。一般浮点内积很小，并不能证明精确投影为零；实验仅在有精确公式的分支作精确零判定。

原始迭代与 $A+\tau I$ 的迭代也不能混称为同一个实验。对不可约非负矩阵，$\tau>0$ 保留主特征方向并消除周期；但有限步速度取决于 $\tau$。整体单位改变时，本课让 $\tau$ 随同一尺度改变，避免固定加 $I$ 造成单位相关的假象。

## 6. 可约矩阵：临界类、支持与 Jordan 耦合

把支持图拆成 SCC 并按类之间的有向无环关系排列，就得到分块三角矩阵。全局谱是各对角块谱的并，$\rho(A)$ 是各块谱半径的最大值；达到这个最大值的块称为临界块。

但临界块之间的耦合也影响主空间。比较：

$$
A_1=\begin{pmatrix}2&1\\0&1\end{pmatrix},\quad
A_2=\begin{pmatrix}2&0\\1&1\end{pmatrix},\quad
A_3=I,\quad
A_4=\begin{pmatrix}1&1\\0&1\end{pmatrix}.
$$

| 矩阵 | 主空间 | 应当避免的结论 |
|---|---|---|
| $A_1$ | $\rho=2$，$\ker(A_1-2I)=\operatorname{span}(1,0)$ | 可约不等于主空间多维 |
| $A_2$ | $\rho=2$，$\ker(A_2-2I)=\operatorname{span}(1,1)$ | 可约也可能有唯一的全正主方向 |
| $A_3$ | $\rho=1$，主空间二维 | 任意初始比例都保持，不能报告唯一排名 |
| $A_4$ | $\rho=1$，主空间一维，代数重数二 | 几何一维不等于代数单根 |

最后一个例子的幂为

$$
A_4^k=\begin{pmatrix}1&k\\0&1\end{pmatrix}.
$$

从 $(1,1)^\mathsf T$ 出发，归一化方向趋 $(1,0)^\mathsf T$，但误差按 $1/k$ 量级下降，$\rho^{-k}A_4^k$ 也不趋于有限秩一矩阵。左右主向量分别为 $(1,0)^\mathsf T$、$(0,1)^\mathsf T$，内积为零，不能套用上一节简单主根的投影公式。

若矩阵为 $N=\begin{pmatrix}0&1\\0&0\end{pmatrix}$，则 $N^2=0$。迭代遇到全零向量后，归一化已经没有定义，应明确停止，不能伪造一个“收敛方向”。

## 7. Markov 链：概率守恒、平稳分布与平均

本课采用列随机矩阵：

$$
P\geq0,\quad\mathbf1^\mathsf TP=\mathbf1^\mathsf T,
\qquad x_{k+1}=Px_k.
$$

所以概率和保持为 $1$。平稳分布是满足 $P\pi=\pi$、$\pi\geq0$、$\mathbf1^\mathsf T\pi=1$ 的**右**特征向量。若教材采用行随机矩阵 $Q$，则 $P=Q^\mathsf T$，同一分布写成 $\pi^\mathsf TQ=\pi^\mathsf T$。

有限不可约链有唯一严格正平稳分布；再加非周期性，任意初始概率分布的 $P^kx_0$ 才都趋向它。可约链的闭 SCC 对应闭的常返类，平稳分布由各闭类平稳分布的凸组合构成；瞬时概率极限还需检查各相关闭类的周期。

周期链可以改看时间平均：

$$
\bar x_K=\frac1{K+1}\sum_{k=0}^{K}P^kx_0,\qquad
P\bar x_K-\bar x_K=
\frac{P^{K+1}x_0-x_0}{K+1}.
$$

对概率向量，右边的 $L^1$ 范数不超过 $2/(K+1)$。有限不可约链的平均趋向唯一平稳分布，即使原始迭代仍在轮换；一般有限链也有平均极限，但可能依赖起点。

这里平均的是**随机链的概率向量**。一般非负矩阵逐步归一化后的方向，其 Cesàro 平均未必等于 Perron 方向；不能把上面的线性伸缩恒等式照搬过去。

惰性化

$$
P_\ell=\ell I+(1-\ell)P,\qquad0\lt\ell\lt1
$$

保留平稳分布，并使不可约链变为非周期。$\ell=1$ 则完全不移动，不能继续声称不可约。

## 8. PageRank：先补悬挂列，再证明唯一性

没有出边的节点会造成全零列，原矩阵便不守恒。先用概率向量 $v$ 补齐这些列，得到列随机矩阵 $P$；再定义

$$
G=\alpha P+(1-\alpha)v\mathbf1^\mathsf T,\qquad
0\leq\alpha\lt1,\quad v\geq0,\quad\mathbf1^\mathsf Tv=1.
$$

这里 $\alpha$ 是**跟随链接**的概率，$1-\alpha$ 是跳转概率。部分资料反过来命名，阅读时要检查定义。[信息检索教材的 PageRank 计算章节](https://www-nlp.stanford.edu/IR-book/html/htmledition/the-pagerank-computation-1.html)采用行向量写法，与本课转置对应。

在概率单纯形上，迭代等价于

$$
F(x)=\alpha Px+(1-\alpha)v.
$$

由于 $\|P\|_1=1$，

$$
\|F(x)-F(y)\|_1\leq\alpha\|x-y\|_1.
$$

所以只要 $\alpha\lt1$，仿射固定点就唯一且迭代收敛，**不要求 $v$ 每个分量都正**。若 $v>0$，$G$ 还严格正，可直接应用 Perron 定理；若 $v$ 含零，唯一性仍由收缩给出，但最终分布可能含零。

同一个固定点满足

$$
(I-\alpha P)\pi=(1-\alpha)v,\qquad
\pi=(1-\alpha)\sum_{k=0}^\infty\alpha^kP^kv.
$$

这也说明 $\pi$ 非负且总和为 $1$。当 $\alpha=0$ 时一步到达 $v$；当 $\alpha=1$ 时，收缩论证失效，原始链的问题重新出现。此时齐次方程 $(I-P)x=0$ 没有唯一向量解，并不等于“加上总和为 1 后仍无唯一平稳分布”。

## 9. 把“差不多收敛了”变成可验算的误差界

对任意候选向量 $\widehat\pi$，令

$$
r=F(\widehat\pi)-\widehat\pi.
$$

利用 $\pi=F(\pi)$ 与三角不等式，

$$
\|\widehat\pi-\pi\|_1
\leq\|r\|_1+\alpha\|\widehat\pi-\pi\|_1,
$$

得到后验界

$$
\boxed{\|\widehat\pi-\pi\|_1\leq
\frac{\|r\|_1}{1-\alpha}}\qquad(\alpha\lt1).
$$

分母解释了为什么接近 $1$ 的阻尼更难验收：相同残差对应更大的误差上限。该界适用于同一个实际候选向量，不要求它的浮点分量恰好和为 $1$。

本实验将概率参数限制为 $1/1024$ 的整数倍。补列、惰性化与跳转所形成的有限二进制矩阵，其列和可以精确核对为 $1$；然后用有理数消元求参考解。每一步保留：

1. 实际浮点仿射计算结果；
2. 将这个存储向量代回精确线性方程后的残差；
3. 到精确参考分布的误差；
4. 上式给出的精确分数上界；
5. 概率和偏差与一步舍入缺陷。

这不是把浮点计算假设成精确运算。比如实际 $Gx$ 与实际 $\alpha Px+(1-\alpha)v$ 在概率和略偏离 $1$ 时也可能不同，实验把这项差单独列出。一般应用若使用近似残差，需要把残差计算误差也纳入上界；直接拿几位小数残差当严格证书并不充分。

## 10. 速率、人口与投入产出：结论各有条件

本原矩阵的秩一极限可写为

$$
\left\|\rho^{-k}A^k-vw^\mathsf T\right\|
=O(k^{s-1}r^k),\qquad
0\lt r=\frac{\max_{\lambda\ne\rho}|\lambda|}{\rho}\lt1,
$$

其中 $s$ 是次外围模上最大的 Jordan 块大小。若全部非主特征值为零，则相应部分幂零，经过有限步后消失，应单独处理，不能把 $r=0$ 生硬代入渐近表达式。相应部分可对角化时可去掉多项式因子，常数仍依赖特征向量的条件数。

对可逆 Markov 链，$P$ 在合适的加权内积下自伴，绝对次特征值控制 $L^2$ 衰减。总变差混合时间还带有误差阈值和初始分布的因子。非可逆链中，非正规性、Jordan 结构与奇异值都可能影响有限步行为；不能只报一个谱隙倒数。

**两年龄段人口模型**可以写为

$$
L=\begin{pmatrix}f_0&f_1\\s&0\end{pmatrix}.
$$

$f_0,f_1$ 是繁殖系数，$s$ 是存活转入下一年龄段的比例。若 $sf_1>0$ 则不可约；再有 $f_0>0$ 才本原。若 $f_0=0$，周期为 $2$，稳定年龄比例未必由原始逐年方向收敛给出。

**Leontief 投入产出**要求 $C\geq0$、最终需求 $d\geq0$，总产出满足 $x=Cx+d$。有

$$
\rho(C)\lt1
\quad\Longleftrightarrow\quad
(I-C)^{-1}\text{存在且逐元素非负}.
$$

正向由 Neumann 级数得到

$$
x=(I-C)^{-1}d=\sum_{k=0}^\infty C^kd\geq0.
$$

反向取 $Cu=\rho u$ 的非零非负向量。$\rho=1$ 与可逆性冲突；若 $\rho>1$，则 $u=(1-\rho)(I-C)^{-1}u\leq0$，与 $u\geq0,u\ne0$ 矛盾。这里每个 $C^kd$ 是第 $k$ 轮间接需求，非负需求的条件不能省略。

## 11. 四道练习：用一次反例改正一条口号

**练习一：含零矩阵为什么仍能混合？** 对 $A=\begin{pmatrix}0&1\\2&1\end{pmatrix}$，计算左右 Perron 向量、$A^2$，并从 $x_0=(1,1)^\mathsf T$ 写出秩一主项与剩余项。

<details class="answer" markdown="1">
<summary>展开完整解答</summary>

特征多项式为 $\lambda^2-\lambda-2=(\lambda-2)(\lambda+1)$。右主向量可取 $v=(1,2)^\mathsf T$，左向量取 $w=(1/3,1/3)^\mathsf T$，恰有 $w^\mathsf Tv=1$。并且

$$
A^2=\begin{pmatrix}2&1\\2&3\end{pmatrix}>0.
$$

因此本原，但原矩阵并非严格正。谱分解给出

$$
A^k=2^kvw^\mathsf T+(-1)^k(I-vw^\mathsf T).
$$

对 $x_0$，主项系数为 $w^\mathsf Tx_0=2/3$，剩余向量为 $(1/3,-1/3)^\mathsf T$。归一化方向趋 $(1/3,2/3)^\mathsf T$，非主项相对主增长每步带因子 $-1/2$。这解释了方向误差的交替，而不是说归一化误差在每一步都严格减半。

</details>

**练习二：周期网络能有静止曲线吗？** 令 $S=\begin{pmatrix}0&1\\1&0\end{pmatrix}$，分别从 $(1,0)^\mathsf T$ 和 $(1/2,1/2)^\mathsf T$ 出发。求时间平均，并比较 $(I+S)/2$。

<details class="answer" markdown="1">
<summary>展开完整解答</summary>

$S^2=I$，外围谱是 $1,-1$，图的周期为 $2$。第一种起点在两个坐标向量之间轮换；第二种起点恰为平稳分布，所以每一步都不变。后者不能证明网络本原。

对第一种起点，若 $K=2m+1$，从第 $0$ 步到第 $K$ 步恰有相同次数的两个状态，故平均为 $(1/2,1/2)^\mathsf T$；若 $K=2m$，

$$
\bar x_K=\left(\frac{m+1}{2m+1},\frac{m}{2m+1}\right)^\mathsf T.
$$

两者都趋平稳分布。惰性矩阵 $(I+S)/2$ 的每列都为该分布，一步便到达；这是本例的特殊简化，不能推广成所有惰性链一步混合。

</details>

**练习三：可约且一维，为什么仍不是简单主根？** 对 $J=\begin{pmatrix}1&1\\0&1\end{pmatrix}$ 求 $\ker(J-I)$、左右主向量和从 $(1,1)^\mathsf T$ 出发的归一化误差。

<details class="answer" markdown="1">
<summary>展开完整解答</summary>

主根 $1$ 的代数重数为二，而 $\ker(J-I)=\operatorname{span}(1,0)$ 只有一维。左主空间是 $\operatorname{span}(0,1)$，与右主空间正交，无法归一化到 $w^\mathsf Tv=1$。

$$
J^k(1,1)^\mathsf T=(k+1,1)^\mathsf T,\qquad
x_k=\left(\frac{k+1}{k+2},\frac1{k+2}\right)^\mathsf T.
$$

到 $(1,0)^\mathsf T$ 的 $L^1$ 误差为 $2/(k+2)$。虽然方向最终趋于一条射线，$J^k$ 的非对角元仍线性增长；既没有本原性，也没有简单主根的指数秩一收敛。

</details>

**练习四：真正验收一次 PageRank。** 取三环 $P=\begin{pmatrix}0&0&1\\1&0&0\\0&1&0\end{pmatrix}$，$\alpha=1/2$，$v=(1/2,1/4,1/4)^\mathsf T$。求精确分布，并用候选值 $\widehat\pi=v$ 核对残差上界。

<details class="answer" markdown="1">
<summary>展开完整解答</summary>

三个固定点方程是

$$
\pi_0=\tfrac12\pi_2+\tfrac14,\qquad
\pi_1=\tfrac12\pi_0+\tfrac18,\qquad
\pi_2=\tfrac12\pi_1+\tfrac18.
$$

依次代入得

$$
\pi=\left(\frac{11}{28},\frac9{28},\frac8{28}\right)^\mathsf T.
$$

候选向量的实际精确残差为

$$
r=\tfrac12Pv+\tfrac12v-v=(-1/8,1/8,0)^\mathsf T,
\qquad\|r\|_1=\tfrac14.
$$

所以 $\|\widehat\pi-\pi\|_1\leq(1/4)/(1/2)=1/2$。直接相减得到真实误差 $3/14$，确实不超过 $1/2$。界可以不紧，但它必须对同一个候选向量有效。继续迭代并重新计算残差，才会得到更有用的验收上界。

</details>

## 12. 通往更大网络与正算子

这门课的下一步不只是把矩阵做大。可以沿三条路线继续：

- **稀疏网络与迭代算法**：从 [Krylov 方法](nla-03-krylov.html)出发，研究隐式矩阵乘法、停止准则和非正规暂态。大矩阵不能只靠固定步数“看起来收敛”。
- **正算子与无限维问题**：有限维的紧性、正锥内部和谱分离在无限维会发生变化，进一步需要紧算子与 Krein–Rutman 理论等条件。不能直接把有限矩阵定理逐字移植。
- **非负张量与非线性谱问题**：先分清使用的特征值定义、齐次性、不可约条件与归一化方式，再讨论唯一性或幂法。它们与矩阵 PF 理论相关，但并非同一个定理。

回到具体模型时，按这个次序检查：**状态与箭头约定 → 非负性与守恒 → SCC与周期 → 主空间与起点 → 实际数值误差。**能写出这条推理链，才算把“主方向”从一个图上的点变成了可以解释、复核和使用的结论。

</div>
