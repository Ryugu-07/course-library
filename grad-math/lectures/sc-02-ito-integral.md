# 随机分析 II · Itô积分：适应性、等距与连续过程

> **前置**：[布朗运动的构造与路径性质](sc-01-brownian-rigorous.html)、[条件期望与停止时间](mt-03-conditional-martingale.html)、[鞅收敛与极大不等式](mt-04-martingale-convergence.html)。本讲从简单过程出发，完成可预测L²空间中的积分构造，再解释实验里的两类误差。

<div class="ito-course" markdown="1">
<style>.ito-course .learning-lab{margin-left:0;margin-right:0;width:100%}.ito-course .fallback-scroll{overflow:auto;max-width:100%}.ito-course .fallback-scroll td{overflow-wrap:anywhere}.ito-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.ito-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>
<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：增加路径数，能补救过粗的时间网格吗？

取被积过程H=B，只用[0,1]的一段。左端值B₀=0，所以每条样本的左端和都是0；无论生成多少条路径，它们的平方平均仍为0。可是连续积分的二阶矩是1/2。

这里没有违反Itô等距。这个一步简单过程的能量也恰为0，等距在有限模型内完全正确。问题在于我们还没有让简单过程逼近整个B。**增加路径数改善对有限模型期望的估计；加密时间网格改善对连续积分的逼近。** 两个参数各有职责。

<div class="learning-lab" data-learning-lab="ito-integral-ledger" markdown="1">

**无脚本读法。** 先比较同一条路径的左端和、右端和、梯形平均，再读多路径的平方均值与能量均值。两者共同的有限分割目标、连续目标及其差额单独列出；单路径代数残差与多路径抽样误差分开记录。

<figure class="plot" markdown="1">
[![Itô积分的四个固定实验场景](assets/img/sc-02-ito-ledgers.svg)](assets/img/sc-02-ito-ledgers.svg)
<figcaption>图1.1：打开原图可比较取点、有限期望和样本标准误的适用边界。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="Itô积分固定数值记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>粗网格L</td><td>0</td></tr>
<tr><td>粗网格平均左和平方</td><td>0</td></tr>
<tr><td>粗网格平均能量</td><td>0</td></tr>
<tr><td>粗网格离散目标</td><td>0</td></tr>
<tr><td>连续目标</td><td>0.5</td></tr>
<tr><td>布朗场景读取层L</td><td>4</td></tr>
<tr><td>当前路径左端和</td><td>-0.35783571927148256</td></tr>
<tr><td>当前路径右端和</td><td>0.9447467882015312</td></tr>
<tr><td>当前路径梯形和</td><td>0.2934555344650243</td></tr>
<tr><td>当前路径Q</td><td>1.302582507473014</td></tr>
<tr><td>当前路径能量</td><td>0.4815135405124264</td></tr>
<tr><td>成对差样本均值</td><td>-0.29619264636074966</td></tr>
<tr><td>成对差估计标准误</td><td>0.1461431834369206</td></tr>
<tr><td>当前离散共同目标</td><td>0.46875</td></tr>
<tr><td>单路径场景N</td><td>1</td></tr>
<tr><td>单路径估计标准误</td><td>不适用</td></tr>
<tr><td>符号过程路径能量</td><td>1</td></tr>
<tr><td>符号过程离散目标</td><td>1</td></tr>
<tr><td>符号过程左端和</td><td>0.3373524120704071</td></tr>
<tr><td>布朗左和恒等式残差</td><td>1.1102230246251565e-16</td></tr>
</tbody></table>
</div>

[下载四个场景的全部路径与账本(JSON)](assets/learning/projects/ito-integral-ledger/run-snapshot.json)。各场景T=1、M=4、根种子20260722；除单路径场景外N=16。图上刻度为阅读做舍入，表内保留固定记录的数值。


</div>

实验提供H=1、H=t、H=B和H=sign₊(B)四种适应过程。所有原始高斯抽样、最细路径、逐层逐样本账本和当前路径的每一步贡献都可下载。固定种子时，增加样本数保留已有路径；提高生成层保留旧节点；改变读数层只读取同一路径的节点。

</section>

## 1. 先算有限和：为什么取点会改变答案

对任意有限序列b₀=0,…,bₙ，记Δbⱼ=bⱼ₊₁−bⱼ。无需概率就能写出

$$L_n=\sum_jb_j\Delta b_j,\qquad R_n=\sum_jb_{j+1}\Delta b_j,\qquad
C_n=\sum_j\frac{b_j+b_{j+1}}2\Delta b_j.$$

用平方差分解逐项计算：

$$C_n=\frac{b_n^2}{2},\qquad
L_n=\frac{b_n^2-Q_n}{2},\qquad
R_n=\frac{b_n^2+Q_n}{2},\qquad Q_n=\sum_j(\Delta b_j)^2.$$

对布朗节点，Q在确定性网格变细时以L²趋于T，因此三种和可以有不同极限。取哪个端点，与过程何时获得信息有关；它不是把同一个普通Riemann积分写成三种等价形式。

这里C是**两个端点值的梯形平均**。对H=B，它也是本例常说的对称和；它并没有额外生成真正时间中点的布朗值。对于一般H，有限恒等式只有

$$R_n-L_n=\sum_j(H_{t_{j+1}}-H_{t_j})\Delta B_j,\qquad C_n=(L_n+R_n)/2.$$

要把右边的极限称为协变差或Stratonovich修正，还需要相应条件和证明。特别对不连续的sign函数，本实验只显示有限对照，不能从几张数值图推断一般对称积分理论。

布朗总变差无限，也不表示任何被积函数都不能逐路径积分。例如确定的C¹函数f可以通过分部积分定义

$$\int_0^T f(t)\,dB_t=f(T)B_T-f(0)B_0-\int_0^T B_t f'(t)\,dt.$$

右边对每条连续路径都有意义。困难是为足够一般的随机适应过程建立统一的积分理论；本讲选用L²等距完成这件事。

## 2. 可预测：把“现在已经知道”写进定义域

固定有限T，并使用使B成为布朗运动的通常过滤。可预测σ代数由[0,T]上的集合

$$A\times(s,t],\quad A\in\mathcal F_s,\quad0\le s\lt t\le T,$$

以及零时刻的可测集合生成。一个过程H可预测，指(t,ω)↦Hₜ(ω)对这个σ代数可测。矩形A×(s,t]的含义是：在s时已经知道A是否发生，随后一段时间按这个已知事件取值。

有界左连续适应过程可用过去时刻阶梯值逐点逼近，所以可预测；连续适应过程当然也可预测。对可预测过程施加Borel函数仍可预测，因此B、B²以及sign₊(B)都符合这一可测性要求。

定义

$$\mathcal H_T^2=L^2_{\mathrm{pred}}([0,T]\times\Omega,dt\otimes\mathbb P),\qquad
\|H\|_{\mathcal H_T^2}^2=\mathbb E\int_0^T|H_t|^2\,dt.$$

这里元素是dt×P几乎处处相等的等价类。两个过程可以在某些随机时刻不同，却代表同一个积分输入；不能把这种等价关系误写成所有时刻同时相等。

“适应”本身只管每个时刻的可测性，并不独自说明联合可测性或平方可积性。本页明确以可预测L²空间为定义域，避免把这些不同条件缩成一句“不偷看未来”。

## 3. 简单过程：先把每一段的贡献定义清楚

取确定性分割0=t₀<⋯<tₙ=T，令

$$H_t=\sum_{j=0}^{n-1}\xi_j\mathbf1_{(t_j,t_{j+1}]}(t),\qquad
\xi_j\in L^\infty(\mathcal F_{t_j}).$$

使用左开右闭区间，使阶梯过程在跳点取旧值，成为左连续适应过程。计算时仍用在tⱼ已经知道的系数ξⱼ。若只改变有限个确定时刻的取值，dt×P等价类不变；这解释了数值书写中另一端点约定何时无害，却不允许把ξⱼ换成未来的 $B_{t_{j+1}}$。

对任意u∈[0,T]，定义整个积分过程

$$I_u(H)=\sum_j\xi_j\big(B_{u\wedge t_{j+1}}-B_{u\wedge t_j}\big).$$

它适应且连续：在每一段上，系数早已可测，布朗增量连续；只有有限段需要相接。在分割中额外插入一个时间点，布朗增量的可加性保证结果不变。对两种表示取公共细分，就得到表示无关性与线性。

有界系数使可积性首先没有困难。之后可将平方可积系数截断，再用等距延拓；因此例子 $\xi_j=B_{t_j}$虽然不是有界变量，仍有严格进入定义域的途径。

## 4. Itô等距：适应性在哪一步真正起作用

对终点积分展开平方。若i<j，则ξᵢΔBᵢ和ξⱼ都在tⱼ的过去信息内，于是

$$\mathbb E[\xi_i\xi_j\Delta B_i\Delta B_j]
=\mathbb E\!\left[\xi_i\xi_j\Delta B_i\,\mathbb E(\Delta B_j\mid\mathcal F_{t_j})\right]=0.$$

每个对角项则满足

$$\mathbb E[\xi_j^2(\Delta B_j)^2]
=\mathbb E\!\left[\xi_j^2\mathbb E((\Delta B_j)^2\mid\mathcal F_{t_j})\right]
=\mathbb E[\xi_j^2](t_{j+1}-t_j).$$

两者相加，得到

$$\mathbb E[I_T(H)^2]=\mathbb E\int_0^T H_t^2dt,\qquad \mathbb E I_T(H)=0.$$

对H+K、H−K用同一个等距并相减，还得到极化公式

$$\mathbb E[I_T(H)I_T(K)]=\mathbb E\int_0^T H_tK_tdt.$$

这是一条**期望中的恒等式**。单条路径上的积分平方，通常不等于该路径的能量∫H²dt。实验为每条路径记录它们的差D；D的期望为0，与每次实现D=0完全不同。

如果把系数改成下一时刻的值，取出条件期望的步骤就失去依据。这是等距证明对适应性的具体需求。

## 5. 简单过程为什么足够稠密

令μ=dt×P。有限时域使μ([0,T]×Ω)=T有限。取有界简单可预测过程张成的线性空间，并记它在L²(μ)中的闭包为V。

考虑集合族D：E∈D当且仅当指标1_E属于V。整个空间的指标属于V，零时刻部分的μ测度为0；若E∈D，则补集的指标1−1_E仍属于V。若Eₖ两两不交且都在D，有限部分和属于V，而且

$$\left\|\mathbf1_{\cup_kE_k}-\sum_{k=1}^n\mathbf1_{E_k}\right\|_{L^2(\mu)}^2
=\mu\!\left(\bigcup_{k>n}E_k\right)\longrightarrow0.$$

所以D是一个Dynkin系统。生成可预测σ代数的矩形构成π系统：两个矩形相交仍是这种矩形，因为两个事件的交在较晚的左端时间已可测。它们的指标本来就是允许的简单过程。π–λ定理因此说明，所有可预测集合的指标都在V。

对有界可预测H，按函数值分成越来越细的有限层，可得到简单可测函数以一致误差逼近H；其每个指标已在V，故H∈V。对一般平方可积H，再截断

$$H^{(K)}=(-K)\vee(H\wedge K),\qquad
\|H-H^{(K)}\|_{L^2(\mu)}\longrightarrow0$$

即可。这里收敛由|H|²可积和支配收敛保证。于是有界简单可预测过程在整个H²空间中稠密。

这份证明先保住了可预测σ代数，再做L²逼近；不需要可能读取未来值的对称时间卷积。

## 6. 等距延拓：逼近序列换掉，积分不会换掉

取H⁽ⁿ⁾为简单过程且在H²中趋于H。等距给出

$$\mathbb E|I_T(H^{(n)})-I_T(H^{(m)})|^2
=\|H^{(n)}-H^{(m)}\|_{\mathcal H_T^2}^2\longrightarrow0.$$

所以积分序列在完备的L²(P)中有唯一极限，定义为I_T(H)。若另选K⁽ⁿ⁾→H，则

$$\|I_T(H^{(n)})-I_T(K^{(n)})\|_2
=\|H^{(n)}-K^{(n)}\|_{\mathcal H_T^2}\longrightarrow0,$$

两种定义一致。线性、零均值、等距与极化公式都由L²极限保留。时间u处的积分可用H·1_(0,u]同样定义。

一个常见的具体逼近是“先平均，再投影到过去”。在确定网格上设

$$\xi_{j,n}=\mathbb E\!\left[\left.\frac1{\Delta t_j}\int_{t_j}^{t_{j+1}}H_sds\right|\mathcal F_{t_j}\right],\qquad
P_nH=\sum_j\xi_{j,n}\mathbf1_{(t_j,t_{j+1}]}.$$

条件Jensen不等式与时间Cauchy–Schwarz给出

$$\Delta t_j\mathbb E|\xi_{j,n}|^2\le\mathbb E\int_{t_j}^{t_{j+1}}|H_s|^2ds,$$

因此Pₙ是H²中的压缩。对有界生成矩形ξ1_(s,t]，所有完全落在(s,t]内部的网格段都正确读取ξ；可能有误差的只有至多两个边界段，其总长度趋于0。有界性使这部分L²误差趋于0。先对有限线性组合推广，再用上一节稠密性与压缩性，便得到PₙH→H。

这个公式是条件期望意义的构造，并不是拿一条实际样本的未来观测值直接当作现在的系数。

## 7. 从每个时刻的随机变量，得到一个连续鞅

分别定义每个Iₜ，还没有自动得到一个共同连续版本。这个步骤要用过程的统一控制。

简单过程积分是鞅。先在一段上看：条件期望会把未来布朗增量消去；跨越多个分割点时再用塔性质。对两个简单过程，连续时间Doob L²不等式与等距给出

$$\mathbb E\sup_{0\le t\le T}|I_t(H)-I_t(K)|^2
\le4\mathbb E|I_T(H-K)|^2
=4\|H-K\|_{\mathcal H_T^2}^2.$$

可选一条逼近序列满足‖H⁽ⁿ⁾−H‖≤2⁻³ⁿ。于是相邻积分的统一误差超过2⁻ⁿ的概率至多是一个常数乘2⁻⁴ⁿ，可求和。Borel–Cantelli保证，在共同的概率1事件上，相邻统一误差最终不超过2⁻ⁿ；级数可求和，使积分过程统一Cauchy。连续函数的一致极限仍连续，记为M。

对每个固定t，这个极限与此前定义的L²极限Iₜ(H)几乎处处相等，因此M是所需的连续修改。两种连续修改在有理时刻同时相等，再由连续性得到所有时刻同时相等。利用Fatou，前述Doob控制也延伸到一般H、K。

鞅性质可以直接传递：若s≤t，简单过程积分满足

$$\mathbb E[I_t(H^{(n)})\mid\mathcal F_s]=I_s(H^{(n)}).$$

条件期望是L²压缩，两边分别取L²极限，就得到E[Mₜ|Fₛ]=Mₛ。这说明一般积分是连续平方可积鞅。

还有一条有用的补偿关系：

$$M_t^2-\int_0^tH_s^2ds\quad\text{是鞅。}$$

简单过程时，在每个系数保持不变的时间段展开M的平方，线性项条件均值为0，新增平方的条件均值为ξ²Δt；与能量增量正好抵消。一般情形中，M⁽ⁿ⁾→M的L²收敛使其平方在L¹中收敛，而

$$\mathbb E\int_0^T|(H^{(n)})^2-H^2|dt
\le\|H^{(n)}-H\|_{\mathcal H_T^2}
\big(\|H^{(n)}\|_{\mathcal H_T^2}+\|H\|_{\mathcal H_T^2}\big)\longrightarrow0.$$

再用条件期望的L¹压缩即可。这个能量过程将在后续二次变差理论中扮演核心角色；补偿关系与有限样本逐路径相等仍是两回事。

## 8. 亲手算出布朗运动对自身的积分

令H⁽ⁿ⁾在每个 $(t_j,t_{j+1}]$ 上取 $B_{t_j}$。它与B的H²距离可以精确计算：

$$\mathbb E\int_0^T|B_s-H_s^{(n)}|^2ds
=\sum_j\int_{t_j}^{t_{j+1}}(s-t_j)ds
=\frac12\sum_j(\Delta t_j)^2\le\frac T2|\pi_n|.$$

因此，任意确定性网格最大段长趋于0，都给出H²逼近。等距使左端和趋于Itô积分；第1节的有限恒等式加上上一页的Q的L²收敛，便得到

$$\int_0^TB_t\,dB_t=\frac{B_T^2-T}{2}.$$

两条路线得到的是同一个L²极限，因而右边的公式有定义上的保证。沿dyadic分割，上一页还给出Q几乎处处收敛，所以此例的左端和也几乎处处趋于该值。

右端和与梯形和的相应极限分别为

$$\frac{B_T^2+T}{2},\qquad\frac{B_T^2}{2}.$$

对H=B，梯形极限是Stratonovich积分。这个结论有此处的有限代数与二次变差证明支持，不需要把“中点方案总会更准确”当成原则。

对于n个等长区间，平方可积误差还有明确大小：

$$\mathbb E\left|I_T(B)-L_n\right|^2=\frac{T^2}{2n}.$$

这是**积分随机变量的L²误差**，并不保证某条样本的误差恰好是T/√(2n)。另一方面，$B_T=\sqrt T\,Z$表明积分的分布是T(Z²−1)/2；一般随机被积过程的积分并不必然是高斯变量。

## 9. 两个迁移例子：确定函数与符号变换

**确定的平方可积f。** 对确定的简单函数f，积分是独立高斯增量的线性组合，服从中心高斯，方差为∫f²。一般f用L²逼近，特征函数通过收敛传递，故

$$\int_0^Tf(t)\,dB_t\sim N\!\left(0,\int_0^Tf(t)^2dt\right).$$

例如f=1时终点积分就是 $B_T$；f(t)=t时方差为T³/3。若f是C¹，离散分部积分与布朗路径连续性让剩余和趋于普通积分∫Bf′dt；再与Itô的L²极限比较，得到第1节的逐路径分部积分公式。这样，经典可逐路径定义的情形与新的L²构造确实相容。

**根据当前符号翻转噪声。** 定义sign₊(x)=1（x≥0），−1（x<0），并取

$$M_t=\int_0^t\operatorname{sign}_+(B_s)\,dB_s.$$

它是有界可预测被积过程的连续鞅。我们还可以直接证明M本身是一个布朗运动，而不提前调用尚未证明的Lévy刻画。

先将符号冻结在每个网格左端，得到系数ξⱼ∈{−1,1}。给定左端过去，ξⱼ已经确定，而未来增量为独立中心高斯。因此

$$\mathbb E[e^{iu\xi_j\Delta B_j}\mid\mathcal F_{t_j}]
=e^{-u^2\Delta t_j/2}.$$

这个条件特征函数不依赖过去。按时间顺序使用塔性质，得到变换后的各段增量仍独立且具有正确的高斯方差；如果测试时刻在网格内部，只需把网格再细分，系数在新增左端仍然已知，所以同一论证成立。每个阶梯符号积分都是连续布朗过程。

为了传到极限，注意对t>0有P(Bₜ=0)=0，Tonelli给出

$$\mathbb E\int_0^T\mathbf1_{\{B_t=0\}}dt=0.$$

故几乎每条路径在零点上花费的Lebesgue时间为0。对其余时刻，连续性使网格左端的符号最终与当前符号相同；有界支配收敛得到H²逼近。Doob控制使积分统一地以概率收敛到M，有限维特征函数随之收敛。M连续并保留布朗有限维分布，所以确实是布朗运动。

如果把sign(0)约定为0，两种被积过程只在上述零时间集合上不同，属于同一个H²等价类，积分相同。实验采用sign₊，因此每个有限网格的能量也恰为T，方便核查。

## 10. 期望实验：分清离散偏差与抽样误差

均匀n段、H=B时，两个有限模型的期望相等：

$$\mathbb E[L_n^2]=\mathbb E\sum_{j=0}^{n-1}B_{t_j}^2\Delta t
=\frac{T^2(n-1)}{2n}.$$

这是因为$\mathbb E[B_{t_j}^2]=t_j$，求和是一个等差数列。共同目标与连续T²/2相差−T²/(2n)，这部分偏差即使有无限多条独立样本也不会消失。

实验用$X_r=L_{n,r}^2$ 和 $Y_r=\sum_j B_{t_j,r}^2\Delta t$分别记录每条路径，并使用成对差Dᵣ=Xᵣ−Yᵣ。理想模型中E[Dᵣ]=0，但通常Dᵣ≠0。N条样本给出均值、无偏样本方差及估计标准误

$$\bar D=\frac1N\sum_{r=1}^ND_r,\qquad
s_D^2=\frac1{N-1}\sum_{r=1}^N(D_r-\bar D)^2,\qquad
\widehat{\mathrm{SE}}(\bar D)=s_D/\sqrt N.$$

N=1时后两者不适用。即使N>1，显示一个标准误也不自动建立严格的置信覆盖率；尾部较重的平方统计量尤其不能仅凭一次小样本就断言已经收敛。实验同时给出理想高斯模型的标准误作为参考，并明确伪随机样本只是可复算诊断。

### 选读：标准误的解析参考从哪里来

令d=T/n，并把**当前网格的标准化增量**记为Zⱼ=ΔBⱼ/√d（T>0）。这些Z是独立标准高斯；它们不一定等于生成器最初抽到的帽函数系数。有限账本可以写成两个高斯二次型：

$$L_n=Z^{\mathsf T}AZ,\qquad Y=Z^{\mathsf T}KZ,$$

其中A的对角为0、非对角为d/2，且

$$K_{ij}=d^2(n-1-\max(i,j)),\qquad0\le i,j\lt n.$$

后一公式来自展开每个 $B_{t_j}^2$：同一对增量在之后的多少个左端节点上共同出现，就贡献多少次。矩阵A的特征值为d(n−1)/2一次、−d/2重复n−1次，因此trA=0。

对足够小的u、v，正交对角化uA+vK和一维高斯积分给出

$$\log\mathbb E e^{uZ^{\mathsf T}AZ+vZ^{\mathsf T}KZ}
=\sum_{k\ge1}\frac{2^{k-1}}k\operatorname{tr}(uA+vK)^k.$$

比较二阶到四阶系数，可得

$$\operatorname{Var}(L_n^2)=48\operatorname{tr}(A^4)+8\operatorname{tr}(A^2)^2,\qquad
\operatorname{Var}(Y)=2\operatorname{tr}(K^2),$$

$$\operatorname{Cov}(L_n^2,Y)=8\operatorname{tr}(A^2K).$$

例如混合三阶矩为8tr(A²K)+2tr(A²)trK；减去E[L²]E[Y]=2tr(A²)trK，留下上式。四阶矩为48trA⁴+12(trA²)²，再减去二阶矩的平方，得到第一式。由此

$$\operatorname{Var}(D)=\operatorname{Var}(L_n^2)+\operatorname{Var}(Y)-2\operatorname{Cov}(L_n^2,Y)
=\frac{d^4n(n-1)}2(5n^2-13n+12).$$

所以理想独立样本均值的标准误是√(Var(D)/N)。实验记录所用矩阵规则、迹与特征值，便于与实际有限高斯模型核对。T=0时所有积分、能量及其总体方差均为0，不需要除以√d定义Z。

## 11. 四道练习：把定义、极限和统计各自用对

<details class="answer" markdown="1">
<summary>练习一：只用[0,T]的一段，H=B时增加样本数能得到连续积分吗？</summary>

每条路径都用左端H₀=B₀=0，所以L₁=0、Y₁=0、D₁=0，有限模型的等距精确成立，任意样本数的平均都为0。连续积分为 $(B_T^2-T)/2$，二阶矩T²/2。必须使网格变细才能让简单过程逼近B；N增加只能改善对当前有限模型的期望估计，无法替代n增加。T=0是两种目标同时为0的退化情况。

</details>

<details class="answer" markdown="1">
<summary>练习二：对于H(t)=t，求有限等距目标及其连续极限</summary>

左端系数tⱼ=jd是确定的，积分左和为Σjd·ΔBⱼ，服从中心高斯。方差与能量都是

$$d^3\sum_{j=0}^{n-1}j^2=\frac{d^3n(n-1)(2n-1)}6\longrightarrow\frac{T^3}{3}.$$

每条路径的能量在这个例子里都是相同的确定数，但积分平方仍有随机性；中心高斯G的Var(G²)=2Var(G)²，所以成对差的总体方差为上述有限目标平方的两倍。这个例子展示了期望相等不等于逐样本相等。

</details>

<details class="answer" markdown="1">
<summary>练习三：改动零时刻取值，与把左端改成右端，有什么区别？</summary>

只在一个确定时刻改变H，不改变dt×P等价类，所以不改变Itô积分。若把整个 $(t_j,t_{j+1}]$ 上的系数从 $B_{t_j}$ 改成 $B_{t_{j+1}}$，改变的是一整段正长度时间上的随机变量，并且它通常不在 $\mathcal F_{t_j}$ 中可测；这既不是只改端点零集，也不是原来的简单可预测过程。有限右和比左和多Qₙ，细分后多T，差异不会被“端点测度为零”消掉。

</details>

<details class="answer" markdown="1">
<summary>练习四：路径能量几乎处处有限，是否足以保证积分是真鞅？</summary>

不够。令Y独立于布朗运动，并在零时刻已知，满足P(Y=2ᵏ)=2⁻ᵏ，k=1,2,…。概率和为1，Y每次实现都有限，但E[Y]=∞。取Hₜ=Y，则每个有限T上的能量TY²几乎处处有限，而积分为YBₜ。

对t>0，独立性与Tonelli给出E|YBₜ|=E[Y]E|Bₜ|=∞，所以它连可积性都不满足，不能是真鞅。下一节的能量停止时间仍能把它局部化为平方可积鞅；“局部鞅”中的局部限制不能省略。

</details>

## 12. 停止与局部化：扩大定义域时保留哪些结论

先对H∈H²和有界停止时间τ证明停止公式

$$I_{t\wedge\tau}(H)=I_t\big(H\mathbf1_{[0,\tau]}\big).$$

过程1_[0,τ]左连续且适应，因此可预测。若τ只取有限个网格值，H也为简单过程，在共同细分上逐段核对，公式直接成立。一般τ用网格向上取整τₙ↓τ；积分连续使左边收敛，右边的被积过程由支配收敛在H²中收敛。最后用简单过程逼近一般H，左边用Doob统一控制，右边用等距，得到完整公式。

现在只要求H可预测，且对每个有限T有∫₀ᵀH²dt<∞几乎处处。定义

$$\tau_m=m\wedge\inf\left\{t:\int_0^tH_s^2ds\ge m\right\}.$$

积分能量过程连续、递增且适应，所以τₘ是停止时间。停止后的被积过程有总期望能量至多m，因此属于平方可积理论。随着m增大，τₘ几乎处处趋于∞；在任何固定有限时域上，最终不再发生停止。

停止公式保证两个不同截断得到的积分在较早停止时间之前相同。先对可数m和有理t取共同的概率1事件，再用连续性，就能把这些过程一致地拼接成一个连续局部鞅。这给出了局部平方可积被积过程的Itô积分。

如果缺少期望平方可积性，不能继续无条件使用本页的全局零均值与有限等距结论；练习四给出了甚至不具一阶可积性的具体例子。下一页将用这一构造建立[Itô公式与SDE存在唯一性](sc-03-ito-formula-sde.html)，在那里再讨论二阶修正如何系统地进入链式法则。

**参考。** [Steven P. Lalley，Notes on the Itô Calculus（2016）](https://galton.uchicago.edu/~lalley/Courses/385/ItoIntegral.pdf)，第1节的简单过程、等距延拓、停止与局部化。本页另外展开可预测空间的稠密性证明，并对有限高斯账本独立推导其误差公式。

</div>
