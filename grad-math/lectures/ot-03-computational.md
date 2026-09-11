# 最优传输 III · Sinkhorn：先对平，再谈算准

> **前置**：[耦合与对偶证书](ot-01-monge-kantorovich.html)、[Wasserstein 几何](ot-02-wasserstein.html)、[互信息与率失真](it2-03-rate-distortion.html)。本页讨论有限概率分布与有限成本；先完成一个可以验算的矩阵问题，再连接生成模型。实验最多三行三列，不代表大模型训练或一般连续 OT 求解器。

<div data-learning-page></div>

<section class="learning-layer sinkhorn-course" markdown="1">

## 学习层：两张账轮流正确，为什么还需要第三张账？

三个仓库要向三个商店运货。源质量是 $a=(0.5,0.3,0.2)$，目标质量是 $b=(0.2,0.3,0.5)$，两侧位置都是 $0,1,2$，每单位货物的成本是距离平方。你看到一张“远路暗、近路亮”的热图，能据此说已经找到了最优运输吗？

不能只看形状。首先，货物是否全部送对：每行、每列的总量都要符合要求。其次，优化的是原始运输成本，还是额外带有熵项的目标。最后，计算机显示的零，是数学上的零，还是一个太小而无法表示的正数。

| 实验 | 可以改变什么 | 需要核对什么 |
|---|---|---|
| 交替缩放 | 质量、位置或自定义成本、ε、轮数 | 每个半步的行列账；修复后计划与原始 OT 成本上下界 |
| 正则化与去偏 | 同一实线上的两分布、ε、轮数 | 跨分布与两个自分布的三份计算；有限步数值差是否足够小 |
| 下溢对照 | 包括极小 ε 和全高成本 | 直接核法失败在哪一步；log 质量是否仍有限；边缘是否真的收敛 |

**先预测再打开结果**：一轮的最后一步刚对齐列账，行账一定正确吗？同一个分布和自己比较，熵正则化目标一定为零吗？把所有成本同时加上 100，最优耦合应不应该改变？

<div class="learning-lab" data-learning-lab="sinkhorn" markdown="1">

**无 JavaScript 时：**下面的固定图、完整参考表和第11节四道答案仍可阅读。可下载每个半步与精确补账的全部记录。

<figure class="plot" markdown="1">
[![Sinkhorn边缘、去偏与下溢](assets/img/ot-03-sinkhorn-ledgers.svg)](assets/img/ot-03-sinkhorn-ledgers.svg)
<figcaption>图1.1：固定输入的边缘残差、去偏估计和下溢对照；曲线连接半步读数。可打开原图查看四个面板。</figcaption>
</figure>

<div class="sinkhorn-fallback" markdown="1">

固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载每个半步、三份去偏问题及精确补账记录](assets/learning/projects/sinkhorn/run-snapshot.json)。三仓库例源质量0.5、0.3、0.2，目标0.2、0.3、0.5，两侧位置0、1、2，平方成本，ε=0.8，分别运行1轮、20轮；去偏扫描每个ε运行50轮。下溢例边缘相同，所有成本100，ε=0.0001，运行2轮。

| 固定参数下的量 | 参考值 |
|---|---:|
| 首例完整轮数 | 1 |
| 首例当前总质量 | 1 |
| 首例最大行残差 | 0.182571848981 |
| 首例最大列残差 | 1.11022302463e-16 |
| 首例运输部分 | 0.376516772241 |
| 首例修复成本上界 | 0.994328921917 |
| 首例精确成本下界 | 0.169919841681 |
| 首例原始LP最优值 | 0.6 |
| 20轮最大边缘残差 | 2.75410700801e-06 |
| 20轮熵数值上端减下端 | 3.96973565131e-11 |
| 20轮修复运输部分 | 0.759894824893 |
| 20轮修复完整熵目标 | 1.02637094562 |
| ε为0.8的去偏估计 | 0.445023872467 |
| 去偏数值上端减下端 | 3.88578058619e-16 |
| 全高成本核下溢格数 | 9 |
| 直接核失败轮数 | 1 |
| log法两轮边缘残差 | 5.55111512313e-17 |
| 全高成本精确上界 | 100 |

浮点残差与熵目标的数值差不是严格区间证书；非常小的负差仍保留符号。修复计划与原始线性成本证书以下载记录中的精确分数为准。直接核失败不会被偷偷替换成零分母的近似解。

</div>
</div>

参数是最多六位小数的十进制数，两侧质量必须分别精确合计为 1；不会偷偷归一化。零质量行列在缩放中剥离，记录中放回零；不存在的势或 log 质量显示“—”。ε 范围为 0.0001 到 100，最多 100 轮。这些是教学实验的运行边界；达到轮数上限不代表收敛。

</section>

<style>
.sinkhorn-course .learning-lab{margin-left:0;margin-right:0;width:100%}
.sinkhorn-course .katex{position:relative}
.sinkhorn-fallback table{width:100%}
.sinkhorn-fallback td{overflow-wrap:anywhere}
.sinkhorn-fallback td:nth-child(2){white-space:nowrap;font-size:.8em;font-variant-numeric:tabular-nums}
</style>

## 1. 三个容易混用的“成本”

设 $a\in\mathbb R_+^m$、$b\in\mathbb R_+^n$ 都是概率向量，$C_{ij}$ 有限。运输多面体与原始目标为

$$
\Pi(a,b)=\{P\ge0:P\mathbf1=a,\ P^T\mathbf1=b\},\qquad
\mathrm{OT}_0(a,b)=\min_{P\in\Pi(a,b)}\langle C,P\rangle.
$$

对 $\varepsilon>0$，本页统一使用相对于独立耦合的 KL 正则化：

$$
\mathrm{OT}_\varepsilon(a,b)=\min_{P\in\Pi(a,b)}J_\varepsilon(P),\qquad
J_\varepsilon(P)=\langle C,P\rangle+\varepsilon\sum_{ij}P_{ij}\log\frac{P_{ij}}{a_i b_j}.
$$

求得正则化最优计划 $P_\varepsilon$ 后，**运输部分** $\langle C,P_\varepsilon\rangle$ 与**完整目标** $\mathrm{OT}_\varepsilon$ 仍是不同的数，二者也一般不等于 $\mathrm{OT}_0$。只有当成本来自同一度量空间的距离 $p$ 次方时，原始目标的 $p$ 次方根才对应 $W_p$。

有的书采用 $F_\varepsilon(P)=\langle C,P\rangle+\varepsilon\sum P_{ij}(\log P_{ij}-1)$。在可行集上，若 $H(a)=-\sum_i a_i\log a_i$，则

$$
J_\varepsilon(P)=F_\varepsilon(P)+\varepsilon\{1+H(a)+H(b)\}.
$$

**固定边缘时最优计划相同，最优值不同。** 若边缘也在训练过程中改变，这个差额不再是与训练参数无关的常数，不能直接把两种损失及其梯度互换。

对还没有对平的非负矩阵，我们采用广义 KL 延拓

$$
\mathcal K(P\mid Q)=\sum_{ij}\left[P_{ij}\log\frac{P_{ij}}{Q_{ij}}-P_{ij}+Q_{ij}\right],
\qquad \widetilde J_\varepsilon(P)=\langle C,P\rangle+\varepsilon\mathcal K(P\mid a b^T).
$$

其中 $0\log0=0$。当 $P$ 质量为 1 时，它与前面的 $J_\varepsilon$ 相同。实验同时保留原始对数和、广义 KL、总质量，避免给一个质量不足的中间矩阵套上概率 KL 的解释。零边缘之外出现正质量会使 KL 无穷；实验始终禁止这种情况。

## 2. 为什么熵最优计划存在、唯一，而且有指数形式？

去掉零质量行列后，$a_i,b_j>0$。可行集非空，因为含有 $a b^T$；它又是有限维紧集，目标连续，所以存在最小值。函数 $p\log p$ 严格凸，因而目标在可行集上严格凸，最优计划唯一。

它在活跃矩形内还必须处处为正。否则取 $P_t=(1-t)P+t a b^T$：原先为零的格子在熵项中的增量含有正系数乘 $t\log t$，其右导数为负无穷；成本增量及原先正格子的导数有限。足够小的正 $t$ 会降低目标，矛盾。

将约束乘子记为 $f_i,g_j$，对广义 KL 形式逐格最小化拉格朗日函数，得到

$$
C_{ij}+\varepsilon\log\frac{P_{ij}}{a_i b_j}-f_i-g_j=0,
\qquad
P_{ij}=a_i b_j\exp\frac{f_i+g_j-C_{ij}}{\varepsilon}.
$$

这是“每条路的成本”与“两端的价格”共同决定货量。记 $u_i=e^{f_i/\varepsilon}$、$v_j=e^{g_j/\varepsilon}$、$K_{ij}=e^{-C_{ij}/\varepsilon}$，就有

$$
P=\operatorname{diag}(a\odot u)K\operatorname{diag}(b\odot v).
$$

与常见的 $\operatorname{diag}(\widehat u)K\operatorname{diag}(\widehat v)$ 写法相比，这里把边缘权重显式提出了。二者只差 $\widehat u=a\odot u$、$\widehat v=b\odot v$。

势不唯一：$f\mapsto f+c\mathbf1$、$g\mapsto g-c\mathbf1$ 不改变计划。实验每个半步用 $a^Tf=0$ 固定这个自由度。**势的平移不会改变货量，不应被误读为一次优化进展。**

## 3. 一轮由两个半步组成：刚对齐的账会怎样？

在本页的约定下，固定 $v$ 后对齐行边缘，固定新 $u$ 后对齐列边缘：

$$
u_i\leftarrow\frac{1}{\sum_j b_jK_{ij}v_j},\qquad
v_j\leftarrow\frac{1}{\sum_i a_iK_{ij}u_i}.
$$

第一式代回计划，行和恰为 $a_i$。第二式代回，列和恰为 $b_j$，但新的 $v$ 一般会再次改变行和。因此每次保存行缩放和列缩放后的**两种边缘**，并计算

$$
r_\infty(P)=\max\left\{\max_i|(P\mathbf1)_i-a_i|,\ \max_j|(P^T\mathbf1)_j-b_j|\right\},
$$

$$
r_1(P)=\|P\mathbf1-a\|_1+\|P^T\mathbf1-b\|_1.
$$

实验从 $u=v=1$ 开始，初始矩阵是 $a_i b_jK_{ij}$。当成本非负时总质量不超过 1，但一般不是 1，**它还不是一份合法运输计划**。

每个半步也是对偶中的一次精确块最大化，实数精确计算下对偶值不下降。边缘误差的每一个单独分量则不必逐步单调。实现只按指定轮数运行，不用一个未经说明的“误差足够小”按钮代替误差标准。

## 4. 一个完整的收敛论证：正性为什么重要？

下面给出易于检查、但不追求最优常数的有限矩阵证明。设 $0\lt L\le K_{ij}\le U$，对正向量定义 Hilbert 射影距离

$$
d_H(v,w)=\operatorname{osc}(\log v-\log w),\qquad
\operatorname{osc}(z)=\max_j z_j-\min_j z_j.
$$

它忽略整体倍数。逐项取倒数和乘一个固定正对角矩阵，都保持这个距离。关键是证明正矩阵作用会压缩：

$$
d_H(Kv,Kw)\le q\,d_H(v,w),\qquad q=1-L/U\lt1.
$$

令 $A_i(z)=\log\sum_jK_{ij}e^{z_j}$。其梯度是一份概率权重

$$
\partial_j A_i(z)=\frac{K_{ij}e^{z_j}}{\sum_kK_{ik}e^{z_k}}
\ge \frac LU\frac{e^{z_j}}{\sum_k e^{z_k}}.
$$

每一行梯度都包含同一份总质量 $L/U$ 的公共权重。把这部分剥掉，剩下的总质量是 $q$。对任意方向 $h$，不同两行的方向导数之差，绝对值不超过 $q\operatorname{osc}(h)$。沿从 $\log w$ 到 $\log v$ 的线段积分，就得到上面的压缩式。

常见缩放变量的一整轮为

$$
T(v)=b\oslash\left[K^T\left(a\oslash(Kv)\right)\right].
$$

两次正矩阵作用使压缩系数不超过 $q^2$。对数向量模去常数后是一个有限维完备空间，故 Banach 不动点定理给出唯一射影不动点和几何收敛。若 $T(v)=\lambda v$，令 $u=a\oslash(Kv)$，则当前计划的行质量为 1、列质量总和为 $1/\lambda$；两者必须一致，故 $\lambda=1$，不动点确实同时满足两侧边缘。

这个证明只用于有限、严格正的活跃核。实际二进制浮点若把正数下溢成零，便不再满足证明的假设。ε 变小时 $L/U$ 可能极小，压缩因子接近 1；“有几何收敛定理”与“100 轮就够”是两件事。更精细的迭代复杂度与可行化分析可读 [Altschuler–Weed–Rigollet 原文](https://arxiv.org/pdf/1705.09634)。

## 5. log 域计算：保住正路，不等于自动收敛

直接生成 $K_{ij}$ 可能遇到 $e^{-10^6}$。数学上它为正，常用浮点中却会变成 0。随后用 $10^{-300}$ 替换零分母，会把失败隐藏成另一套未经证明的迭代。本实验让直接核法明确记录失败位置。

在 log 域中写

$$
f_i\leftarrow-\varepsilon\operatorname{LSE}_j\left(\log b_j+\frac{g_j-C_{ij}}\varepsilon\right),\qquad
g_j\leftarrow-\varepsilon\operatorname{LSE}_i\left(\log a_i+\frac{f_i-C_{ij}}\varepsilon\right),
$$

$$
\operatorname{LSE}(z)=M+\log\sum_k e^{z_k-M},\qquad M=\max_k z_k.
$$

最大指数成为 1，所以求和不会因为所有项同时下溢而变成 0。最终的

$$
\log P_{ij}=\log a_i+\log b_j+(f_i+g_j-C_{ij})/\varepsilon
$$

可以仍是一个有限负数，即使把它指数化后的显示值为 0。实验完整保存两者；热图的暗格不能证明严格零质量。

全成本相同的例子最清楚。若 $C_{ij}=100$，每个可行计划的运输成本都是 100，KL 最小的计划是 $a b^T$。取 ε 为 0.0001，直接核完全下溢，log 计算仍能恢复独立耦合。另一方面，小 ε 的不均匀边缘例即便没有数值失败，100 轮后仍可能有很大行残差。**稳定表示解决了“怎样计算这一步”，没有替你完成尚未收敛的那些步。**

## 6. 第三张账：可行化与原始成本的精确上下界

中间矩阵 $F$ 未必可行，其成本既不一定是上界，也不是最优值。可以先只缩小过大的行，再只缩小过大的列：

$$
s_i=\min\{1,a_i/(F\mathbf1)_i\},\quad F'=\operatorname{diag}(s)F,
\qquad t_j=\min\{1,b_j/(F'^T\mathbf1)_j\},\quad F''=F'\operatorname{diag}(t).
$$

零分母时取缩放系数 1。此时两种边缘都不超过目标，令

$$
d=a-F''\mathbf1\ge0,\quad e=b-F''^T\mathbf1\ge0,\quad
\delta=\mathbf1^Td=\mathbf1^Te.
$$

若 $\delta>0$，补上 $d e^T/\delta$；若为零，直接保留 $F''$：

$$
Q=F''+d e^T/\delta\in\Pi(a,b).
$$

为什么正确？新增矩阵的第 $i$ 行总和是 $d_i$，第 $j$ 列总和是 $e_j$，且没有负质量。它正好补齐缺口。

这个修复的改动也有可控量级。设第一次削去质量 $A=\sum_i((F\mathbf1)_i-a_i)_+$，第二次削去质量 $B$。由于只做削减，$B\le\sum_j((F^T\mathbf1)_j-b_j)_+$。记初始总质量为 $M$，则

$$
\|Q-F\|_1\le A+B+(1-M+A+B)
\le\|F\mathbf1-a\|_1+2\|F^T\mathbf1-b\|_1\le2r_1(F).
$$

最后一步使用 $2A+1-M=\|F\mathbf1-a\|_1$ 及 $B$ 的上界。这是矩阵可行化，不是再运行一次熵优化。算法对应 [原论文 Algorithm 2 与 Lemma 7](https://arxiv.org/pdf/1705.09634)。

还需要下界。取任意有限源势 $\phi$，令 $\psi_j=\min_i(C_{ij}-\phi_i)$，便有 $\phi_i+\psi_j\le C_{ij}$。因此

$$
\underbrace{a^T\phi+b^T\psi}_{L_0}\le\mathrm{OT}_0\le
\underbrace{\langle C,Q\rangle}_{U_0},\qquad
U_0-L_0=\sum_{ij}Q_{ij}(C_{ij}-\phi_i-\psi_j)\ge0.
$$

实验把**浮点迭代值的十进制表示**转成精确分数，然后以分数完成削减、补账和取最小值；这些上下界证明的是所得有理数计划的原始离散成本。它们没有把指数、对数或正则化最优值变成精确数。额外的三行三列 LP 枚举给出精确基准；这是教学用的独立对照规模，不是 Sinkhorn 每轮需要做的工作。

## 7. 熵目标也有对偶，但不要把浮点差叫严格证书

广义 KL 的逐格共轭给出

$$
D_\varepsilon(f,g)=a^Tf+b^Tg+\varepsilon\left(1-\sum_{ij}a_i b_j e^{(f_i+g_j-C_{ij})/\varepsilon}\right).
$$

对任意有限势与任意可行 $Q$，令 $P^{f,g}_{ij}=a_i b_j e^{(f_i+g_j-C_{ij})/\varepsilon}$，直接展开可得

$$
J_\varepsilon(Q)-D_\varepsilon(f,g)=\varepsilon\mathcal K(Q\mid P^{f,g})\ge0.
$$

因此实数精确计算下，$D_\varepsilon\le\mathrm{OT}_\varepsilon\le J_\varepsilon(Q)$。而对于**不满足边缘的当前指数矩阵**，有

$$
\widetilde J_\varepsilon(P^{f,g})-D_\varepsilon(f,g)
=f^T(P^{f,g}\mathbf1-a)+g^T((P^{f,g})^T\mathbf1-b).
$$

它可能为负，不能当作标准原始—对偶间隙。实验采用修复后的 $Q$ 计算上端，保留当前势计算下端，同时展示行列残差。

这里的对数与指数仍用浮点求值，没有区间算术。极小的“上端减下端”可能因舍入显示为负，完整账本保留符号，不把它裁成零。它是**数值诊断**；上一节基于有理数线性成本的不等式才是本实验的精确证书。两个层次不能混称。

## 8. ε 改变了什么：有限步误差与极限偏差分开

在固定有限边缘下，任意可行计划的互信息满足

$$
0\le\mathrm{KL}(P\mid a b^T)=H(a)+H(b)-H(P)\le\min\{H(a),H(b)\}.
$$

右侧可由条件熵非负得到。将正则化最优计划与一个原始 OT 最优计划 $P_0$ 比较：

$$
\langle C,P_\varepsilon\rangle+\varepsilon\mathrm{KL}(P_\varepsilon\mid a b^T)
\le\mathrm{OT}_0+\varepsilon\mathrm{KL}(P_0\mid a b^T),
$$

$$
0\le\langle C,P_\varepsilon\rangle-\mathrm{OT}_0
\le\varepsilon\min\{H(a),H(b)\}.
$$

这是**已经求到熵最优解**时的偏差界，不能直接拿来保证只迭代一轮的结果。对有限步，先检查第 6 节的可行原始成本上下界和第 7 节的数值优化差。

当 ε 趋零，紧性保证子列极限；上式使所有极限都为原始 OT 最优计划。进一步，对任何原始最优计划 $P_0$，由同一比较式和运输成本不低于最优值得到 $\mathrm{KL}(P_\varepsilon\mid a b^T)\le\mathrm{KL}(P_0\mid a b^T)$。所以极限选择原始最优面上 KL 最小、等价于熵最大的唯一计划，不是任意挑一个顶点。

当 ε 趋无穷，与独立耦合比较：

$$
\mathrm{KL}(P_\varepsilon\mid a b^T)
\le\frac{\langle C,a b^T\rangle-\min_{ij}C_{ij}}\varepsilon\longrightarrow0.
$$

Pinsker 不等式给出 $P_\varepsilon\to a b^T$。这解释了大 ε 时路线更多地由边缘质量决定。它不意味着独立耦合是原始运输成本的最优解。

## 9. Sinkhorn 散度：要同时算好三份问题

对同一空间上的对称成本，用同一 ε 定义

$$
S_\varepsilon(a,b)=\mathrm{OT}_\varepsilon(a,b)
-\tfrac12\mathrm{OT}_\varepsilon(a,a)-\tfrac12\mathrm{OT}_\varepsilon(b,b).
$$

这确保 $S_\varepsilon(a,a)=0$。若换用第 1 节的 $F_\varepsilon$ 约定，三个额外的边缘熵常数恰好抵消，所以去偏后的值一致。

**非负性并不是任意成本矩阵做三次相减的代数事实。** 一个可用的定理条件是：紧度量空间、对称 Lipschitz 成本，且 $e^{-C/\varepsilon}$ 是正的 universal 核；此时散度非负，零值识别同一分布，并刻画弱收敛。有限有界实线上的平方距离对应高斯核，属于这个框架。定理见 [Feydy 等原文 Theorem 1](https://arxiv.org/pdf/1810.08278)。它没有承诺一般三角不等式，因此本页称“散度”。

数值上有三份误差。若实数算术的三个目标分别位于 $[D_{ab},U_{ab}]$、$[D_{aa},U_{aa}]$、$[D_{bb},U_{bb}]$，则

$$
D_{ab}-\tfrac12U_{aa}-\tfrac12U_{bb}\le S_\varepsilon(a,b)
\le U_{ab}-\tfrac12D_{aa}-\tfrac12D_{bb}.
$$

实验在五个相邻 ε 上分别重算三份问题，保留每份修复前后的计划、势、误差和数值端点。显示的估计是三个区间中点按上式相减；它不是一个已经严格求出的散度值。自分布问题如果还没算好，跨分布问题看起来稳定也不够。这里同样没有区间算术，负的舍入宽度会原样记录。

## 10. 从计算 OT 走向生成模型：哪些结论可以带走？

WGAN 连接的是 [第一页的 KR 对偶](ot-01-monge-kantorovich.html)：

$$
W_1(\mu,\nu)=\sup_{\operatorname{Lip}(f)\le1}\left(\mathbb E_\mu f-\mathbb E_\nu f\right).
$$

取 $\mu=\delta_{-1}$、$\nu=\delta_1$，函数 $f(x)=-x$ 给出 $1-(-1)=2$，达到距离 2；$f(x)=x$ 给出的是 $-2$。检验函数的符号与对偶中两个分布的顺序必须一起核对。

再取 $\nu_\theta=\delta_\theta$、$\mu=\delta_0$：$W_1=|\theta|$；当 $\theta\ne0$ 时，标准等权 JS 为 $\log2$，两个方向 KL 都为无穷。这是“支撑分离”的具体例子，不是说所有 KL 的梯度都为零。$|\theta|$ 在 0 还不可微；即使更换了分布距离，神经网络参数化和训练误差仍可能导致梯度问题。[WGAN 原文 Theorem 1](https://proceedings.mlr.press/v70/arjovsky17a/arjovsky17a.pdf)给的是带条件的连续性与几乎处处可微性。

有限神经网络检验函数类未必包含最优势；训练有限轮也未必到达上确界。权重裁剪约束的是参数范围，不能直接证明网络恰为 1-Lipschitz。[WGAN-GP 的梯度罚](https://arxiv.org/pdf/1704.00028)只在采样点施加软惩罚，不是全空间的精确 Lipschitz 证书。本页不把一个训练损失曲线标成已求出的 $W_1$。

流匹配中，给定端点耦合，令 $X_t=(1-t)X_0+tX_1$，平方回归的总体最优速度为

$$
v_t(z)=\mathbb E[X_1-X_0\mid X_t=z].
$$

若连续性方程及相应 ODE 有足够的存在唯一性、可积性条件，这个速度可保持指定的边缘路径。条件期望投影与 Jensen 不等式解释了为什么理想 rectification 可以降低凸位移成本。**这没有自动选出一个指定成本的全局最优耦合。** 见[作者对 Rectified Flow 与成本特定 OT 的区别说明](https://www.cs.utexas.edu/~lqiang/rectflow/html/intro.html#optimal-transport)。实际训练还增加了回归误差和数值 ODE 误差；[上一页的交叉配对反例](ot-02-wasserstein.html)已经说明直线粒子路径并不足以保证分布最短路。

## 11. 四道迁移题：每一道都给出可验算答案

**题 1：同价矩阵。** 两侧质量均为 $(1/2,1/2)$，所有成本为 3。写出原始最优值、正则化最优计划与完整 KL 正则化目标。若 ε 极小、核全下溢，哪些数学结论仍成立？

<details class="answer" markdown="1"><summary>展开答案：成本相同，熵选择独立</summary>

每个可行计划总质量都为 1，所以成本都是 3。KL 非负且仅在独立耦合时为零，因此

$$
P_\varepsilon=\begin{pmatrix}1/4&1/4\\1/4&1/4\end{pmatrix},\qquad
\mathrm{OT}_0=\mathrm{OT}_\varepsilon=3.
$$

取 $f=0$、$g=3$，指数中的 $f_i+g_j-C_{ij}$ 为零，故恢复 $a b^T$。直接计算核失败只说明该实现不能表示中间量，不会改变原始问题、最优计划或对偶结论。

</details>

**题 2：把近似计划补成合法计划。** 令 $a=b=(1/2,1/2)$，$F=\operatorname{diag}(0.6,0.2)$，成本对角为 0、非对角为 1。完成两次削减与补账，再用零势给出原始 OT 上下界。

<details class="answer" markdown="1"><summary>展开答案：补的是边缘缺口</summary>

先把第一行缩小为原来的 $5/6$，第二行不动：$F'=\operatorname{diag}(0.5,0.2)$。列都没有超额，所以 $F''=F'$。两侧缺口均为 $(0,0.3)$，缺口总量为 0.3；外积除以总量在右下角补上 0.3，得到

$$
Q=\operatorname{diag}(0.5,0.5),\quad \|Q-F\|_1=0.4,
\quad r_1(F)=0.8.
$$

零势及其 $c$ 变换仍为零。下界 0，上界 $\langle C,Q\rangle=0$，故原始最优值精确为 0。这里修复后的计划碰巧最优；一般的补账操作只保证可行。

</details>

**题 3：相同分布的自成本为何非零？** 两侧都均匀分布在位置 0、1，平方距离成本为 $\bigl(\begin{smallmatrix}0&1\\1&0\end{smallmatrix}\bigr)$。写出正则化最优计划与目标，解释去偏。

<details class="answer" markdown="1"><summary>展开答案：同一个分布仍有熵与成本的折中</summary>

记 $r=e^{-1/\varepsilon}$。对称性和唯一性使两个对角格相等、两个非对角格相等；指数形式给出非对角与对角之比为 $r$，边缘条件给出

$$
P_\varepsilon=\frac1{2(1+r)}\begin{pmatrix}1&r\\r&1\end{pmatrix},
\qquad \langle C,P_\varepsilon\rangle=\frac r{1+r}.
$$

代入 KL 目标或取相等常数势得到

$$
\mathrm{OT}_\varepsilon(a,a)=\varepsilon\log\frac2{1+e^{-1/\varepsilon}}>0.
$$

原始值为 0，而完整熵目标为正。三个自成本相减时，$S_\varepsilon(a,a)=0$。若使用不带 $a_i b_j$ 的负熵约定，自成本会整体平移，但去偏结果仍为零。

</details>

**题 4：没有训练误差也不能忽略前提。** 对 $\delta_{-1}$ 与 $\delta_1$ 写出正确 KR 检验函数。再说明：一个全空间恒等为零的检验函数是否 1-Lipschitz？它是否一定最优？

<details class="answer" markdown="1"><summary>展开答案：合法检验函数不等于最优检验函数</summary>

函数 $f(x)=-x$ 的 Lipschitz 常数为 1，对偶值为 2；由点质量唯一耦合的成本也是 2，可知它最优。零函数的 Lipschitz 常数为 0，属于允许的函数类，但对偶值为 0，不能达到这两个分布的距离。约束满足、函数类表达能力、优化是否完成，需要分别检查。对同一分布的两个副本，所有合法函数的期望差都为零，此时零函数又是最优的。

</details>

## 12. 下一步研究：先选清楚目标，再选择加速方法

本页完成有限平衡问题的机制与可核查误差。向大规模前进时，可以研究 ε 延续、稀疏截断与低秩核近似，但每次加速都要说明它改变了哪个对象、删掉了多少质量、误差如何进入最终目标。每轮稠密乘法是 $O(mn)$；总复杂度还乘以精度、ε、成本范围和边缘条件决定的迭代数，不能把单轮复杂度当作完整求解复杂度。

向不平衡 OT 前进，需要给边缘违约另设代价，重新推导对偶与缩放，不能对质量总和不同的输入偷偷归一化。向 Schrödinger 桥前进，需要明确参考路径测度、端点约束与相对熵；“都是熵”不是把任意生成 ODE 等同于桥过程的证明。向可微优化前进，需要区分对已收敛最优值求导、对有限展开迭代求导，以及忽略内层误差的近似。

统计采样误差又是第四张账：总体分布换成经验分布后，即使有限矩阵求得精确，也没有消除采样误差。固定 ε 的统计结论可能带有随 ε 恶化的常数；本页不把某个正则化估计量的根号样本数速率推广成所有维数下原始 Wasserstein 距离的普遍速率。

完成本页的退出条件是：能写清目标约定，解释两个半步，区分三种误差，用补账和对偶给出原始成本范围，并指出生成模型连接中尚未验证的条件。三页的主线分别是[耦合与证书](ot-01-monge-kantorovich.html)、[最短路径与重心](ot-02-wasserstein.html)、本页的数值求解；后续前沿需要沿这条链继续补证据。
