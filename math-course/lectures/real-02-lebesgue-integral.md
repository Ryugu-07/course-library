# 实变 II · Lebesgue 积分与三大收敛定理

> **前置**：[Lebesgue测度](real-01-measure.html)、[函数列与级数](analysis-04-series.html)。逐点看不见尖峰以后，它的面积是否也消失？Lebesgue积分先用可测集合搭出简单函数，再说明哪些极限操作能够保留积分。这里的关键不是记住三条定理名字，而是能逐项核对它们的条件。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：极限先走，面积会不会跟上？

### 1. 具体谜题：尖峰真的“消失”了吗？

在 $[0,1]$ 上看

$$
f_n(x)=n\mathbb{1}_{(0,1/n)}(x).
$$

对每个固定的 $x>0$，当 $n$ 足够大时 $x\notin(0,1/n)$，所以 $f_n(x)\to0$；但每一根尖峰的面积都等于 $n\cdot(1/n)=1$。如果只盯着一个点，会预测

$$
\lim_n\int_0^1 f_n\,dx=\int_0^1\lim_n f_n\,dx=0
$$

这个预测为什么错？错的不是逐点极限，而是把“质量集中到越来越窄的区域”当成了“质量已经没有”。

### 2. 先做预测：三种序列分别能换序吗？

请先猜：$1_{[1/n,1]}$ 的面积会不会增加到极限面积？$n1_{(0,1/n)}$ 的面积会不会跟着点值一起下降？$x^n$ 应该用单调收敛还是控制收敛来处理？交互图把这三个答案放在同一条 $[0,1]$ 轴上，方便把“看起来趋于 0”和“积分真的趋于 0”分开。

### 3. 最小模型：三条定理各自检查什么？

把空间固定为 $( [0,1],\mathcal B,m )$，其中 $m([0,1])=1$。要交换 $\lim$ 与 $\int$，三组常用的充分条件是：

1. **MCT（Levi）**：$0\le f_n\uparrow f$；非负性和逐点单调递增共同保证 $\lim_n\int f_n=\int f$，不要求控制函数；
2. **Fatou**：只要 $f_n\ge0$ 可测，就有 $\int\liminf f_n\le\liminf\int f_n$；它给的是不等式，不会凭空替你补上等号；
3. **DCT**：$f_n\to f$ a.e.，并且存在 $g\in L^1$ 使 $|f_n|\le g$；这个可积“天花板”阻止质量逃逸，于是 $\int f_n\to\int f$。

### 4. 反例与边界：相似的图形，不相同的定理

$n1_{(0,1/n)}$ 非负，所以 Fatou 没有问题；它既不单调递增，也没有可积的统一控制函数，因而 MCT 与 DCT 都不能使用。相反，$x^n$ 在 $[0,1]$ 上有 $0\le x^n\le1$，DCT 适用，但它随 $n$ 递减，不满足 MCT 的“向上”条件。一个常见边界是：每个 $f_n$ 各自有界，远不等于存在同一个可积 $g$ 控制所有 $n$；尖峰正好展示这个差别。

### 5. 迁移提示：把新序列交给哪条定理？

遇到新的 $f_n$，按这个顺序写在草稿上：先问是否非负，再问是否单调递增，再问是否 a.e. 收敛，最后尝试找一个与 $n$ 无关且属于 $L^1$ 的 $g$。例如看到 $n1_{(0,1/n)}$，不要只写“逐点趋于 0”，还要写出为什么任何统一支配函数都至少呈 $1/x$ 级别，因而不可积。

<div class="learning-lab" data-learning-lab="lebesgue">
<p><strong>无 JavaScript 时的静态读法：</strong>本实验在 \( [0,1] \) 上比较三个序列：\(1_{[1/n,1]}\) 的积分为 \(1-1/n\)，\(n1_{(0,1/n)}\) 的积分恒为 \(1\)，\(x^n\) 的积分为 \(1/(n+1)\)。脚本加载后可选择序列、拖动 \(n\)，并查看 SVG 图像与 MCT/Fatou/DCT 条件检查；即使脚本不可用，上述公式仍给出完整判断。</p>
</div>

</section>

## 1. 积分的三级定义

<figure class="plot">
<div tabindex="0" role="region" aria-label="可横向滚动的水平分层积分图" style="overflow-x:auto">
<img src="assets/img/real-02-riemann-vs-lebesgue.svg" alt="对x乘以2减x作四分之一高度的简单函数逼近，每层宽度可由超水平集精确计算" style="min-width:760px;width:100%">
</div>
<figcaption>水平分层也要说明哪些集合被计入。图中第j层只覆盖函数值至少为j/4的位置，每层面积是高度1/4乘以该超水平集的长度。</figcaption>
</figure>

在测度空间 $(X,\mathcal A,\mu)$ 上，先限定函数可测，再定义积分。

1. 非负简单函数 $s=\sum_{i=1}^r a_i1_{E_i}$，其中 $E_i$ 可测且互不相交、$a_i\ge0$：定义 $\int s\,d\mu=\sum_i a_i\mu(E_i)$，约定 $0\cdot\infty=0$。把不同表示共同细分为不交块，可以核对结果与表示方式无关。
2. 非负可测 $f$：定义 $\int f=\sup\{\int s:0\le s\le f,\ s\text{为非负简单函数}\}$，允许结果为 $+\infty$。
3. 一般实值可测 $f=f^+-f^-$：若正负部积分不同时为无穷，可定义扩展积分 $\int f=\int f^+-\int f^-$；若两者都有限，才称 $f\in L^1$。若两者都无穷，表达式 $\infty-\infty$ 没有定义。

因此 Lebesgue 可积等价于 $\int|f|<\infty$。条件收敛的反常积分不一定是 Lebesgue 可积，例如 $\int_1^\infty\sin x/x\,dx$ 的有符号极限存在，但绝对积分发散。

在有限闭区间上，Riemann 可积函数一定 Lebesgue 可积且积分相同；有界函数的 Riemann 可积性等价于其不连续点集为零测集。$1_{\mathbb Q}$ 的不连续点是整个区间，所以不能 Riemann 积分，却因 a.e. 为零而有 Lebesgue 积分零。可测函数 a.e. 相等时，其定义了的积分相同；$L^1$ 因而把 a.e. 相等的函数视作同一个元素。

## 2. 三条定理怎样接起来

以下函数均在同一个测度空间上可测。MCT、Fatou、DCT 不按“强弱排行榜”使用；它们有不同的前提与结论。

### 2.1 单调收敛 MCT：从集合连续性到函数连续性

若 $0\le f_n\uparrow f$，则 $\int f_n\uparrow\int f$，允许极限为无穷。证明的关键是回到定义中的简单函数。

设 $L=\lim_n\int f_n$。因 $f_n\le f$，先有 $L\le\int f$。固定非负简单函数 $s\le f$ 和 $0<c<1$，令 $E_n=\{f_n\ge cs\}$。则 $E_n\uparrow X$：在 $s>0$ 处，$f_n\to f\ge s>cs$；在 $s=0$ 处不等式一直成立。于是

$$
\int f_n\ge c\int_{E_n}s\ \longrightarrow\ c\int s.
$$

最后一步只用有限个层集上的测度从下连续性。令 $c\uparrow1$，再对全部 $s\le f$ 取上确界，得 $L\ge\int f$，证毕。非负可测级数的部分和单调递增，所以 $\int\sum_jf_j=\sum_j\int f_j$，并不需要一致收敛。

### 2.2 Fatou：下确界把任意序列变成递增序列

若 $f_n\ge0$，定义 $h_n=\inf_{k\ge n}f_k$，则 $h_n\uparrow\liminf_nf_n$。MCT 与 $h_n\le f_k$ 给

$$
\int\liminf_nf_n=\lim_n\int h_n
\le\lim_n\inf_{k\ge n}\int f_k=\liminf_n\int f_n.
$$

集中尖峰 $n1_{(0,1/n)}$ 的左边为0、右边为1，说明这里确实可能严格不等。它的质量集中在原点附近，并没有向空间无穷远移动；另一个模型 $1_{[n,n+1]}$ 才是空间上的质量逃逸。

### 2.3 DCT：可积控制把 Fatou 的不等式补成等式

若 $f_n\to f$ a.e. 且存在 $g\in L^1$ 使所有 $|f_n|\le g$ a.e.，则 $|f|\le g$ a.e.。对非负函数 $2g-|f_n-f|$ 使用 Fatou，得到

$$
2\int g\le\liminf_n\left(2\int g-\int|f_n-f|\right)
=2\int g-\limsup_n\int|f_n-f|.
$$

这里 $\int g<\infty$ 才允许相减。因差的绝对值积分非负，只能有 $\|f_n-f\|_1\to0$；再由 $|\int f_n-\int f|\le\|f_n-f\|_1$ 得积分收敛。

**怎样证明尖峰没有可积控制函数？** 对 $0<x<1/2$，取 $n=\lceil1/(2x)\rceil$，则 $1/(2x)\le n<1/x$，所以 $f_n(x)=n\ge1/(2x)$。任何统一控制 $g$ 都至少有这个不可积下界；即使各不等式只在 a.e. 意义成立，可数个例外零测集的并仍是零测集，论证不变。

一致收敛和 DCT 不能无条件互相替代。在有限测度空间，若一致收敛到可积的 $f$，充分靠后的项被 $|f|+1$ 控制；在无限测度空间，$n^{-1}1_{[0,n]}\to0$ 一致收敛，积分却恒为1。另一方面，$x^n$ 并不一致趋于它的逐点极限，却被1控制，DCT适用。单调递减也不是永远不能换序：若 $0\le f_n\downarrow f$ 且 $f_1\in L^1$，可用DCT，或对 $f_1-f_n$ 使用MCT。

## 3. Tonelli 与 Fubini：先检验绝对值

采用清楚的标准版本：两个 **$\sigma$-有限**测度空间 $(X,\mathcal A,\mu)$、$(Y,\mathcal B,\nu)$，以及乘积 $\sigma$-代数上的可测函数 $f$。

- **Tonelli**：若 $f\ge0$，则两种累次积分与乘积测度积分相等，允许值为无穷。
- **Fubini**：若 $\int_{X\times Y}|f|\,d(\mu\times\nu)<\infty$，则几乎处处的截面可积，两种累次积分均等于乘积积分。

两步方法是：先对 $|f|$ 用Tonelli核查有限性，再将 $f=f^+-f^-$ 相减。没有绝对可积性，即使两种累次积分各自存在，也可能不同。例如在 $(0,1)^2$ 上

$$
f(x,y)=\frac{x^2-y^2}{(x^2+y^2)^2}.
$$

利用 $\partial_y[y/(x^2+y^2)]=f$，先积 $y$ 得 $1/(1+x^2)$，再积 $x$ 得 $\pi/4$；利用 $\partial_x[x/(x^2+y^2)]=-f$，反向顺序得到 $-\pi/4$。在原点附近用极坐标，$|f|\,dxdy=|\cos2\theta|\,dr\,d\theta/r$，径向积分发散。这正是Fubini条件失败的位置。

## 4. 微积分基本定理：绝对连续补上缺失条件

若 $f\in L^1([a,b])$，则 $F(x)=\int_a^x f(t)dt$ 绝对连续，并且 $F'=f$ a.e.。绝对连续的定义是：对任意 $\varepsilon>0$，存在 $\delta>0$，使任意有限组互不相交区间 $(a_i,b_i)\subset[a,b]$ 满足

$$
\sum_i(b_i-a_i)<\delta\quad\Longrightarrow\quad
\sum_i|F(b_i)-F(a_i)|<\varepsilon.
$$

对积分定义的 $F$，右边由 $\int_{\cup_i(a_i,b_i)}|f|$ 控制；可积函数在小测度集合上的积分可统一变小，给出绝对连续性。反过来，绝对连续 $F$ 的导数 a.e. 存在、属于 $L^1$，并对**每个** $x\in[a,b]$ 满足

$$
F(x)=F(a)+\int_a^xF'(t)dt.
$$

a.e. 可导与导数可积这两条单独还不够：Cantor 函数连续且单调，从0增至1，在 Cantor 集的补区间上恒定，因此导数a.e.为0，却不能由这个导数积分重建。单调函数a.e.可导是另一条定理，不应误读为单调函数必绝对连续。

## 5. 例题与迁移

**例1：用DCT求极限。** 对 $x>0$ 取 $f_n(x)=n\sin(x/n)/[x(1+x^2)]$，在 $x=0$ 连续定义为1。有 $|f_n|\le1/(1+x^2)$ 且逐点趋于这个控制函数，所以 $\lim_n\int_0^1f_n=\pi/4$。

**例2：非负级数逐项积分。** 在 $(0,1)$ 展开 $1/(1-x)=\sum_{n\ge0}x^n$。MCT允许

$$
\int_0^1\frac{-\log x}{1-x}dx
=\sum_{n\ge0}\int_0^1(-\log x)x^n dx
=\sum_{n\ge0}\frac1{(n+1)^2}=\frac{\pi^2}{6}.
$$

其中单项积分可令 $x=e^{-t}$ 化为 $\int_0^\infty t e^{-(n+1)t}dt$；最后的Basel级数值可回看[Fourier级数](analysis-04-series.html)。端点的定义不影响积分。

**迁移题**

1. 对 $f_n=n^\alpha1_{(0,1/n)}$，按实数 $\alpha$ 分类其积分极限与可积统一控制的存在性。逐点极限都是什么？
2. 用 $1-x^n$ 说明即使 $x^n$ 递减，也能通过MCT间接证明积分趋于零。为什么不能对任意递减非负序列都照搬？
3. 将Fubini反例的积分区域改成 $[\delta,1]^2$，$0<\delta<1$。两种顺序现在各得什么？这与原来两个不同结果矛盾吗？

<details class="answer" markdown="1">
<summary>迁移题参考答案</summary>

1. 对每个固定 $x$（含开区间端点 $x=0$），最终 $f_n(x)=0$。积分是 $n^{\alpha-1}$：$\alpha<1$ 时趋零、$\alpha=1$ 恒为1、$\alpha>1$ 发散。$\alpha\le0$ 时由1控制；$0<\alpha<1$ 时由 $x^{-\alpha}$ 控制且可积；$\alpha\ge1$ 时沿正文的 $n=\lceil1/(2x)\rceil$ 得 $g(x)\ge(2x)^{-\alpha}$，无可积控制。这个模型中DCT恰好解释 $\alpha<1$ 的换序，但一般序列中DCT不是换序成立的必要条件。
2. $0\le1-x^n\uparrow1$ a.e.，MCT给 $\int(1-x^n)\to1$。因总区间长度为1，可以相减得 $\int x^n\to0$。一般情形需一个可积的起始函数来保证相减合法；例如 $1_{[n,\infty)}\downarrow0$，每项积分仍为无穷。
3. 在这个紧方形上函数连续且绝对可积，Fubini适用。又因交换 $x,y$ 会改变符号而区域不变，双重积分为0，两种顺序均为0。令 $\delta\downarrow0$ 给的是同时删去原点附近条带的极限，并非原题先完成一个积分再完成另一个积分的过程；绝对可积性失败时，不同取极限程序可以得到不同值。

</details>

继续学习：[Lᵖ空间](real-03-lp-spaces.html)把DCT给出的 $L^1$ 收敛放进范数空间；[概率极限定理](prob-05-limit-theorems.html)进一步区分概率收敛、a.e.收敛和期望收敛。

[Sheldon Axler：Measure, Integration & Real Analysis](https://measure.axler.net/MIRA.pdf) 第3章给积分与收敛定理，第5章给乘积测度及Tonelli/Fubini；本页证明和反例按上述明确假设使用。
