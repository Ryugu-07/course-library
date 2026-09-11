# 随机分析 III · Itô公式与SDE存在唯一性

> **前置**：[布朗运动](sc-01-brownian-rigorous.html)、[Itô积分](sc-02-ito-integral.html)、常微分方程的Picard迭代。**目标**：证明二阶修正从何而来，再用已建立的积分构造随机微分方程的解。

<div class="sde-course" markdown="1">
<style>.sde-course .learning-lab{margin-left:0;margin-right:0;width:100%}.sde-course .fallback-scroll{overflow:auto;max-width:100%}.sde-course .fallback-scroll td{overflow-wrap:anywhere}.sde-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.sde-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>

<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：链式法则漏掉了哪一项？

先选平方函数。每段都满足“终点函数值变化＝一次项＋二次项”，二次项是实际的增量平方。换成四次方，还会出现可以直接算出的三次、四次余项。把分割加密，观察哪本账保留下来；每层的代数恒等式与无限细分的概率定理分别核查。

<div class="learning-lab" data-learning-lab="ito-quadratic-variation" markdown="1">

**先预测，再揭示。** 读取层L只选取同一路径的节点；提高生成层M保留原有节点。GBM的精确解与Euler近似也使用这条布朗路径。图线连接有限观测点，不能代替未观测区间上的真实路径。

<figure class="plot" markdown="1">
[![Itô公式与Euler近似的四个固定场景](assets/img/sc-03-ito-sde-ledgers.svg)](assets/img/sc-03-ito-sde-ledgers.svg)
<figcaption>图1.1：打开原图，依次比较有限恒等式、dt误差和Euler正性。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="Itô公式固定数值记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>平方场景读取层L</td><td>4</td></tr>
<tr><td>平方场景Q</td><td>1.302582507473014</td></tr>
<tr><td>平方一次项</td><td>-0.7156714385429651</td></tr>
<tr><td>平方二次项</td><td>1.302582507473014</td></tr>
<tr><td>平方余项</td><td>0</td></tr>
<tr><td>平方恒等式残差</td><td>-2.220446049250313e-16</td></tr>
<tr><td>平方dt修正后残差</td><td>0.30258250747301374</td></tr>
<tr><td>四次方一次项</td><td>-2.1823290519447514</td></tr>
<tr><td>四次方二次项</td><td>2.019528150424946</td></tr>
<tr><td>四次方余项</td><td>0.5072655043524177</td></tr>
<tr><td>四次方加权平方增量误差</td><td>-0.8695530926496122</td></tr>
<tr><td>四次方dt修正后残差</td><td>-0.36228758829719476</td></tr>
<tr><td>粗Euler精确终点</td><td>0.003957263901509246</td></tr>
<tr><td>粗Euler终点</td><td>-2.532202426482935</td></tr>
<tr><td>首个非正Euler节点</td><td>1</td></tr>
<tr><td>粗Euler解析均值</td><td>-1</td></tr>
<tr><td>零时域Q</td><td>0</td></tr>
<tr><td>零时域精确终点</td><td>1</td></tr>
<tr><td>零时域Euler终点</td><td>1</td></tr>
<tr><td>零时域首个非正节点</td><td>未出现</td></tr>
</tbody></table>
</div>

[下载四个场景的完整路径与账本(JSON)](assets/learning/projects/ito-quadratic-variation/run-snapshot.json)。均用M=4、seed=20260722；平方/四次场景T=1、L=4、μ=0.3、σ=0.8；粗Euler场景T=1、L=0、μ=−2、σ=2；零时域场景T=0、L=4。表内保留固定数值，图上刻度做显示舍入。


</div>

建议先读1–3节，理解有限账本；4–6节完成Itô公式的证明；7–9节证明SDE存在唯一性；10–12节把定理用于具体模型与练习。长表用于复算，第一次阅读不必全部展开。

</section>

## 1. 平方与四次方：先做完全精确的代数

令x为当前值、z为下一段增量。两条恒等式是

$$ (x+z)^2-x^2=2xz+z^2,$$

$$ (x+z)^4-x^4=4x^3z+6x^2z^2+4xz^3+z^4.$$

实验把最后两个高阶项合称余项，但按上式实际计算，并非把残差强行设为0。逐段相加后，左边望远镜消去，只剩端点函数值之差。浮点残差另外列出。

对布朗节点记

$$ A_pi=\sum_j f'(B_{t_j})\Delta B_j,\quad
C_pi=\frac12\sum_j f''(B_{t_j})(\Delta B_j)^2,\quad
D_pi=\frac12\sum_j f''(B_{t_j})\Delta t_j.$$

有限恒等式是端点差=A+C+余项。Itô公式要证明的是：A趋于随机积分，C趋于时间积分，而余项消失。实验显示的“用dt修正后的残差”恰为(C−D)+余项；它在有限层通常不为0。

平方函数的余项恒为0，C就是二次变差Q。四次方的二阶权重为6B²，不能只证明无权重Q趋于T，就跳过加权极限。

## 2. 光滑对照与取样反例

对连续有限变差路径a，任意最大段长趋于0的分割满足

$$ \sum_j(\Delta a_j)^2
\le\max_j|\Delta a_j|\sum_j|\Delta a_j|
\le\max_j|\Delta a_j|\operatorname{TV}(a)\longrightarrow0.$$

实验中的光滑曲线为a(t)=0.75sin(2πt)+0.25sin(6πt)，它的二次变差趋于0；布朗运动的二次变差则趋于T。连续性只负责最大增量趋于0，有限总变差才给出上式另一半控制。

还有一个更隐蔽的取样问题。令确定函数σ(t)=1_Q(t)，即在有理时间为1，其余为0。它可预测且在dt测度下等于0，所以

$$ \int_0^1\sigma(t)^2dt=0,\qquad \int_0^1\sigma(t)dB_t=0.$$

但是dyadic网格左端全为有理数，直接使用σ(tⱼ)会得到布朗增量和，完全没有逼近这个积分。**可测系数不能一律用指定网格的点值逼近。** 上一页的H²简单过程逼近处理的是等价类；本页证明保留σ在整个小段上的积分，只对连续的f导数取左端值。

## 3. 定理先交代清楚定义域

在通常过滤下，B为布朗运动，X₀为有限的F₀可测变量。设μ、σ可预测，并对每个有限T满足

$$ \int_0^T|\mu_s|ds<\infty,\qquad
\int_0^T\sigma_s^2ds<\infty\quad\text{几乎处处}.$$

用上一页的局部积分定义连续Itô过程

$$ X_t=X_0+\int_0^t\mu_sds+\int_0^t\sigma_sdB_s.$$

若f、fₜ、fₓ、fₓₓ连续，即f∈C^{1,2}，则几乎处处对所有t同时成立

$$ f(t,X_t)-f(0,X_0)
=\int_0^t\left(f_t+\mu_sf_x+\frac12\sigma_s^2f_{xx}\right)(s,X_s)ds
+\int_0^t f_x(s,X_s)\sigma_sdB_s.$$

漂移项中的μₛ、σₛ在(s,Xₛ)之外取值；括号只是把f的三个导数写在一起。各项先按局部意义定义。这个定理不额外要求f有时间二阶导数或时间—空间混合导数。

## 4. 加权二次变差：不用待证公式证明自己

先设σ∈H²，M=∫σdB，w为有界连续适应过程。我们证明，在确定性分割最大段长趋于0时，

$$ \sum_jw_{t_j}(\Delta M_j)^2
\xrightarrow{P}\int_0^T w_s\sigma_s^2ds.$$

**第一步：对被积过程的稳定性。** 取有界简单可预测σ⁽ᵐ⁾→σ于H²，并令M⁽ᵐ⁾=∫σ⁽ᵐ⁾dB。每段等距相加，给出

$$ \mathbb E\sum_j|\Delta(M-M^{(m)})_j|^2
=\|\sigma-\sigma^{(m)}\|_{\mathcal H_T^2}^2.$$

分解平方差，再对“概率×有限段编号”用Cauchy–Schwarz，得到

$$ \mathbb E\sum_j\left|(\Delta M_j)^2-(\Delta M^{(m)}_j)^2\right|
\le\|\sigma-\sigma^{(m)}\|_2\big(\|\sigma\|_2+\|\sigma^{(m)}\|_2\big).$$

乘上‖w‖∞也成立，且上界与分割无关。同样的平方差估计控制∫w(σ²−(σ⁽ᵐ⁾)²)。因此只需处理一个固定的有界简单过程。

**第二步：简单系数上的随机误差。** 设|σ⁽ᵐ⁾|≤K。除去跨越其有限个固定跳点的网格段，剩余每段的系数ξⱼ在左端已知，而且ΔM⁽ᵐ⁾ⱼ=ξⱼΔBⱼ。定义

$$ U_j=w_{t_j}\xi_j^2\big((\Delta B_j)^2-\Delta t_j\big).$$

Uⱼ是条件均值为0的鞅差，不同段交叉期望为0；高斯四阶矩给出

$$ \mathbb E\left|\sum_jU_j\right|^2
\le2\|w\|_\infty^2K^4\sum_j(\Delta t_j)^2
\le2\|w\|_\infty^2K^4T|\pi|\longrightarrow0.$$

被除去的小段总长度至多为“固定跳点数×最大段长”，它们的平方增量期望由等距控制，时间积分也由有界性控制，所以两者均在L¹中消失。剩余加权时间和由w路径连续、σ⁽ᵐ⁾分段恒定趋于∫w(σ⁽ᵐ⁾)²。先让分割变细，再令m增大，第一步的统一估计完成证明。

**第三步：加回漂移。** A=∫μds为连续有限变差过程，第2节给出Σ(ΔA)²→0。混合项满足

$$ \left|\sum_j w_{t_j}\Delta A_j\Delta M_j\right|
\le\|w\|_\infty\sqrt{\sum_j(\Delta A_j)^2}\sqrt{\sum_j(\Delta M_j)^2}\xrightarrow{P}0.$$

后一因子由已证的无权重结论在概率意义下有界。因此X的加权二次变差也等于∫wσ²。这一证明只使用上一页的等距、简单过程稠密性与布朗增量矩，没有预先调用Itô公式。

## 5. Taylor余项：把时间与空间分开

先处理f及相关导数有界且一致连续、σ∈H²的情形。记x=Xₜⱼ、z=ΔXⱼ、h=Δtⱼ。把增量拆成

$$ f(t_j+h,x+z)-f(t_j,x)
=\big[f(t_j+h,x+z)-f(t_j,x+z)\big]
+\big[f(t_j,x+z)-f(t_j,x)\big].$$

第一项沿时间积分fₜ；第二项在固定时间做空间二阶Taylor展开。因此

$$ \Delta f_j=f_t(t_j,X_{t_j})h+f_x(t_j,X_{t_j})z
+\frac12f_{xx}(t_j,X_{t_j})z^2+R_j.$$

若ωₜ、ωₓ分别控制fₜ与fₓₓ的一致连续性，则

$$ \sum_j|R_j|
\le T\,\omega_t\big(|\pi|+\max_j|\Delta X_j|\big)
+\frac12\omega_x\big(\max_j|\Delta X_j|\big)\sum_j(\Delta X_j)^2
\xrightarrow{P}0.$$

连续路径让两个ω趋于0；第4节让平方增量和在概率意义下有界。时间余项只需要h的一阶控制，没有暗中使用不存在的fₜₜ或fₜₓ。

时间一阶和趋于∫fₜds。空间一阶项分为漂移与随机积分。后者应准确写成

$$ \sum_j f_x(t_j,X_{t_j})\Delta M_j
=\int_0^T f_x(t_{\rm left}(s),X_{t_{\rm left}(s)})\sigma_s\,dB_s.$$

只对连续的fₓ(t,Xₜ)取左端值，保留σₛ。被积过程平方差受常数倍σ²支配，故由等距在L²中收敛。漂移项用|μ|的路径可积性与有界支配收敛。二阶项用第4节的权w=fₓₓ(t,Xₜ)。各项与余项归位，得到固定T的公式；对可数有理T取共同事件，再由所有积分过程连续，得到对所有t同时成立。

## 6. 局部化与协变差的含义

一般情形先取光滑截断fᴿ，使它在[0,T]×[−R,R]内与f相同、导数全局有界。对X、累计漂移总量和扩散能量使用停止时间

$$ \tau_R=T\wedge\inf\left\{t:|X_t|\ge R\ \text{或}\
\int_0^t|\mu_s|ds\ge R\ \text{或}\ \int_0^t\sigma_s^2ds\ge R\right\}.$$

停止扩散的期望能量至多R，属于H²。先对停止后的X和fᴿ应用第5节，再用停止公式在τᴿ处读取等式；在停止前截断导数与原导数一致。由于每条连续路径在有限区间有界、两种累计积分有限，随R→∞，最终不再提前停止，于是还原原公式。这里停的是累计量，未假设任意可测μ、σ都能靠“系数首次越界”变成有界过程。

若X、Y由同一个B驱动，扩散系数为σ、η，极化恒等式与第4节给出

$$ [X,Y]_t=\int_0^t\sigma_s\eta_sds.$$

特别[X]ₜ=∫σ²。对足够光滑的g，Itô公式说明g(t,Xₜ)的扩散系数为gₓσ，因此其与B的协变差为∫gₓσds。这才支持半个协变差的Stratonovich修正；本页不把它推广到任意不连续被积过程。

## 7. 强解：给定噪声后构造同一个过程

考虑

$$ X_t=X_0+\int_0^t b(s,X_s)ds+\int_0^t a(s,X_s)dB_s.$$

设b、a联合Borel可测，且存在统一常数L、C满足

$$ |b(t,x)-b(t,y)|+|a(t,x)-a(t,y)|\le L|x-y|,$$

$$ |b(t,x)|+|a(t,x)|\le C(1+|x|).$$

假设X₀∈L²(F₀)。结论是：每个有限T上存在连续适应解，E supₜ≤T|Xₜ|²<∞，同一初值与同一B下的两解不可区分。“强”指在给定的噪声和过滤上构造，而不是比较解的数值精度。

在连续适应过程的空间S²中，范数为

$$ \|X\|_{S_T^2}=\left(\mathbb E\sup_{t\le T}|X_t|^2\right)^{1/2}.$$

这个空间完备：从Cauchy列抽取子列，使相邻S²距离可求和。由E sup|差|≤S²范数，Tonelli说明相邻统一差之和几乎处处有限，所以子列一致收敛到连续过程；逐时适应性由过滤完备性保留。Fatou把Cauchy控制传到极限，给出S²收敛，进而原列也收敛。过程按不可区分关系取等价类。

可预测性也有出处：连续适应X可预测，(t,ω)↦(t,Xₜ(ω))可预测，复合联合Borel的a、b仍可预测。

## 8. Picard迭代：阶乘怎样保证收敛

定义

$$ (\Phi X)_t=X_0+\int_0^t b(s,X_s)ds+\int_0^t a(s,X_s)dB_s.$$

线性增长、漂移的Cauchy–Schwarz与随机积分的Doob L²控制保证Φ把S²映到自身。对两个过程，用两项平方≤两倍平方和，得到对t≤T

$$ \mathbb E\sup_{u\le t}|(\Phi X-\Phi Y)_u|^2
\le K_T\int_0^t\mathbb E\sup_{v\le s}|X_v-Y_v|^2ds,\qquad K_T=2L^2(T+4).$$

从常值过程X⁽⁰⁾=X₀开始，令X⁽ⁿ⁺¹⁾=ΦX⁽ⁿ⁾，并记dₙ(t)=E supᵤ≤t|X⁽ⁿ⁺¹⁾ᵤ−X⁽ⁿ⁾ᵤ|²。逐次积分给出

$$ d_n(T)\le d_0(T)\frac{(K_TT)^n}{n!}.$$

需要求和的是S²距离，也就是这个界的平方根。相邻项比值为√(KₜT/(n+1))→0，因此

$$ \sum_{n\ge0}\|X^{(n+1)}-X^{(n)}\|_{S_T^2}<\infty.$$

完备性给出极限X。前述差映射估计也说明Φ在S²中连续，因此ΦX=limΦX⁽ⁿ⁾=limX⁽ⁿ⁺¹⁾=X，积分方程成立。无需把Φ误称为任意长时间上的直接压缩。

## 9. 唯一性、矩界与条件的边界

两解之差的u(t)=E supₛ≤t|Xₛ−Yₛ|²满足

$$ u(t)\le K_T\int_0^t u(s)ds.$$

令v(t)=∫₀ᵗu(s)ds，则v′≤Kₜv且v(0)=0；乘e⁻ᴷᵀᵗ得到v=0。因此u(T)=0，即几乎处处在整个[0,T]上相同。对整数T取共同事件得到全时间不可区分唯一。

矩界也可写出常数。令m(t)=E supᵤ≤t|Xᵤ|²，三项平方不等式和线性增长给出

$$ m(t)\le3\mathbb E|X_0|^2+6C^2(T+4)\int_0^t(1+m(s))ds.$$

写Aₜ=6C²(T+4)，积分型Grönwall给出

$$ m(t)\le\big(3\mathbb E|X_0|^2+A_Tt\big)e^{A_Tt},\qquad t\le T.$$

有限时域矩受控，使所构造的解不会在有限时间爆破。不同T上的解由唯一性相容，可拼接。

这些是充分条件。若去掉Lipschitz，哪怕没有噪声，也可能不唯一：初值0的常微分方程dX=2√|X|dt，既有恒零解，也有任意等待时间c后开始的Xₜ=(t−c)₊²。若只有局部Lipschitz却无增长控制，dX=X²dt、X₀=1在t=1爆破。两个反例分别说明唯一性条件和全局延拓条件的作用。

## 10. 几何布朗运动：精确正性与Euler负值

设S₀=1，dS=μSdt+σSdB，μ、σ为常数。系数满足上一节条件。先用Itô公式直接验证严格为正的候选

$$ S_t=\exp\big((\mu-\sigma^2/2)t+\sigma B_t\big).$$

其时间导数与空间二阶项合起来为μS，随机项为σS；唯一性确认它就是解。此时再取log才有依据，漂移为μ−σ²/2。

实验还显示漏掉修正的指数exp(μt+σBₜ)，以及同一增量下的Euler递推

$$ Y_{j+1}=Y_j(1+\mu h+\sigma\Delta B_j),\qquad Y_0=1.$$

精确解总为正，Euler因子却可能非正。出现这种情况时，实验记录第一个非正节点，保留真实数值；不会偷偷取绝对值或对负数取log。网格最大误差只是在当前有限节点上与精确解比较，不是连续路径sup误差，更不是强误差期望。

独立增量让总体矩可递推。记n=T/h，则

$$ \mathbb EY_n=(1+\mu h)^n,\qquad
\mathbb EY_n^2=\big((1+\mu h)^2+\sigma^2h\big)^n,$$

而精确解满足

$$ \mathbb ES_T=e^{\mu T},\qquad \mathbb ES_T^2=e^{(2\mu+\sigma^2)T}.$$

这些来自理想高斯模型，单条路径的终点并不等于总体均值。固定T加密时，两个Euler矩分别趋于精确矩；这仅证明这两个矩的收敛，不单独证明路径强收敛阶。T=0时所有节点时间为0，精确解和Euler均为1。

## 11. OU过程与四阶矩：用定理解决新问题

对确定x₀，考虑dX=−θXdt+σdB。给e^{θt}Xₜ用Itô公式，得到

$$ X_t=e^{-\theta t}x_0+\sigma\int_0^t e^{-\theta(t-s)}dB_s.$$

核函数确定，所以X为高斯过程。等距给出

$$ \mathbb EX_t=e^{-\theta t}x_0,\qquad
\operatorname{Var}(X_t)=\begin{cases}
\sigma^2(1-e^{-2\theta t})/(2\theta),&\theta\ne0,\\
\sigma^2t,&\theta=0.
\end{cases}$$

θ<0时这个方差仍为正，只是过程不再均值回复。θ>0时极限方差σ²/(2θ)说明恢复力与噪声达到的平衡。若要从零时刻就平稳，应选独立的X₀∼N(0,σ²/(2θ))；确定x₀的解通常不平稳。一个时间步内的精确随机卷积并不只是“常数×同一个ΔB”，因为它还包含布朗桥噪声；本页不把这种替换叫作同路径精确模拟。

再看B⁴。Itô公式给出dB⁴=4B³dB+6B²dt。高斯六阶矩有限，保证E∫₀ᵀB⁶dt<∞，所以随机积分是真正的平方可积鞅，可以取零期望。于是

$$ \mathbb EB_t^4=6\int_0^t\mathbb EB_s^2ds=3t^2.$$

这重现了已知高斯矩；不能为了推导矩，未经可积性检查就把任意局部鞅的期望写成0。

## 12. 四道练习：检验推理能否迁移

<details class="answer" markdown="1">
<summary>练习一：为什么把Q换成T之后，有限层残差不再只剩舍入误差？</summary>

平方函数每层满足Bₜ²−B₀²=A+Q。用时间修正T替代Q后，残差为Q−T，通常非零。它有均值0和方差2T²/n，因此在L²中趋于0；这与有限代数恒等式是不同结论。四次方还要加上实际高阶余项和加权的平方增量误差。

</details>

<details class="answer" markdown="1">
<summary>练习二：σ(t)=1_Q(t)说明了哪一步不能省略？</summary>

σ在dt测度下为0，随机积分因此为0。但dyadic左值恒1，直接点采样得到Bₜ。必须证明被积过程在H²中逼近，不能仅凭可预测性就指定一组点值。本页对fₓ(t,Xₜ)取左值有连续性依据，同时保留σₛ原本的积分。

</details>

<details class="answer" markdown="1">
<summary>练习三：验证Xₜ=Bₜ/(1+t)的SDE</summary>

取f(t,x)=x/(1+t)，则fₜ=−x/(1+t)²、fₓ=1/(1+t)、fₓₓ=0。因此

$$ dX_t=-\frac{X_t}{1+t}dt+\frac1{1+t}dB_t.$$

二阶修正消失是因为空间二阶导数为0，并不意味着布朗运动的二次变差消失。该方程系数满足全局Lipschitz和线性增长，所以候选验证后可由唯一性确认。

</details>

<details class="answer" markdown="1">
<summary>练习四：Euler的一条路径更接近精确解，是否证明收敛阶？</summary>

不能。当前网格误差只涉及一个seed和有限节点，可能随层数非单调。强误差要求同噪声耦合下的期望范数估计；弱误差比较测试函数的期望；精确解正性又是另一条路径性质。实验能定位差异、检查实现，理论收敛阶仍需相应估计与假设。

</details>

下一页：[Girsanov与换测度](sc-04-girsanov.html)。本页的局部化、真鞅可积性与强解唯一性，会继续决定哪些形式计算可以成立。

**参考。** [Steven P. Lalley，Notes on the Itô Calculus](https://galton.uchicago.edu/~lalley/Courses/385/ItoIntegral.pdf)，第2节的Itô公式与证明框架。本页独立展开可测扩散系数的加权二次变差、时间/空间余项及Picard完备空间论证；OU的均值、方差与初值条件按所写方程直接推导。

</div>
