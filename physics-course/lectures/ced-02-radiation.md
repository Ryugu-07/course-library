# 电动力学 II · 推迟势与辐射

> **前置**：[Maxwell方程](em-02-maxwell.html)、[能量与辐射](em-03-energy-radiation.html)、[边值问题](ced-01-boundary.html)。**目标**：从推迟势求出有方向的场，区分瞬时能流、周期平均功率与脉冲总能量。

<div class="radiation-course" markdown="1">
<style>.radiation-course .learning-lab{margin-left:0;margin-right:0;width:100%}.radiation-course .fallback-scroll{overflow:auto;max-width:100%}.radiation-course .fallback-scroll td{overflow-wrap:anywhere}.radiation-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.radiation-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>

<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：能量有没有可能暂时流向源？

一个偶极正在振荡，远处持续收到辐射。但在源附近，电场和磁场也会交换储存的能量，某个时刻的Poynting流可以向内。这与“平均向外辐射”并不矛盾：一个是瞬时读数，一个是完整周期的平均。

先选近场回流场景，查看完整场的带符号能流，再与只保留辐射项的结果比较。接着选有限脉冲：观察者收到信号之前，所有场都应为0；信号经过后，累计收到的净能量才能与整段辐射能量比较。

<div class="learning-lab" data-learning-lab="retarded-radiation" markdown="1">

**先预测，再揭示。** 实验取k=1，因此ε₀=1/(4π)，μ₀=4π/c²。振幅A是偶极矩振幅，不是某个粒子的速度。空间点固定在r>0，方向使用标准球坐标：θ从+z轴向下增加。

<figure class="plot" markdown="1">
[![推迟辐射的四个固定场景](assets/img/ced-02-radiation-ledgers.svg)](assets/img/ced-02-radiation-ledgers.svg)
<figcaption>图2.1：打开原图，分别读瞬时功率、累计能量、时间延迟和静电场。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="推迟辐射固定数值记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>回流：推迟源时刻</td><td>0</td></tr>
<tr><td>回流：完整Eθ</td><td>119.99999999999997</td></tr>
<tr><td>回流：完整Bφ</td><td>-5</td></tr>
<tr><td>回流：完整球面瞬时功率</td><td>-15.999999999999995</td></tr>
<tr><td>回流：辐射项功率</td><td>0.6666666666666666</td></tr>
<tr><td>回流：周期平均功率</td><td>0.3333333333333333</td></tr>
<tr><td>脉冲：当前推迟时刻</td><td>1</td></tr>
<tr><td>脉冲：当前偶极矩</td><td>1</td></tr>
<tr><td>脉冲：当前二阶导</td><td>-8</td></tr>
<tr><td>脉冲：闭式完整能量</td><td>26.188211788211788</td></tr>
<tr><td>脉冲：Simpson完整能量</td><td>26.18821178230543</td></tr>
<tr><td>脉冲：积分差</td><td>-5.906358069296402e-9</td></tr>
<tr><td>前沿：到达时刻</td><td>4</td></tr>
<tr><td>前沿：当前推迟时刻</td><td>0</td></tr>
<tr><td>前沿：完整Eθ</td><td>0</td></tr>
<tr><td>前沿：完整球面功率</td><td>0</td></tr>
<tr><td>静态：完整Er</td><td>1.0000000000000002</td></tr>
<tr><td>静态：完整Eθ</td><td>0.8660254037844386</td></tr>
<tr><td>静态：完整Bφ</td><td>0</td></tr>
<tr><td>静态：球面功率</td><td>0</td></tr>
</tbody></table>
</div>

[下载四个场景的完整数值与账本(JSON)](assets/learning/projects/retarded-radiation/run-snapshot.json)。均k=c=A=1、t₀=0；回流为谐波ω=1、r=t=0.2、θ=90°；脉冲中点D=2、r=1、t=2、θ=60°；前沿D=2、r=t=4、θ=60°；静态ω=0、r=1、t=5、θ=60°。图上刻度做显示舍入，表内保留固定数值。


</div>

1–5节从Maxwell方程走到完整偶极场；6–8节建立能流与平均功率的关系；9–10节讨论有限脉冲和观测时间；11节划清模型边界，12节给出可复算练习。先读图上的物理量和单位，再比较曲线；电场、磁场、功率与能量分别作图。

</section>

## 1. 势并不任意：规范与连续方程必须相容

在真空中，引入标势V和矢势A：

$$ \mathbf B=\nabla\times\mathbf A,\qquad
\mathbf E=-\nabla V-\partial_t\mathbf A,\qquad
c^{-2}=\varepsilon_0\mu_0. $$

这自动满足∇·B=0和Faraday定律。选Lorenz规范

$$ \nabla\cdot\mathbf A+c^{-2}\partial_tV=0, $$

把另外两条Maxwell方程化成有源波动方程。记L=Δ−c⁻²∂ₜ²，则

$$ LV=-\frac{\rho}{\varepsilon_0},\qquad
L\mathbf A=-\mu_0\mathbf J. $$

规范变换A→A+∇χ、V→V−∂ₜχ不改变E、B。要消除原来非零的规范偏差，需要解相应的有源波动方程；可用同样的Green方法构造，并配上适当初边界条件。规范选择不会替我们指定所有物理自由波。

源必须满足连续方程

$$ \partial_t\rho+\nabla\cdot\mathbf J=0. $$

例如先给一个随时间改变的电荷密度，再任意令J=0，一般就违反这条关系。对空间局域、过去适当衰减的源，时空卷积后分部积分，把对Green核的观察变量导数转成源变量导数，得到

$$ \nabla\cdot\mathbf A+c^{-2}\partial_tV
=\mu_0G_{\rm ret}*(\nabla\cdot\mathbf J+\partial_t\rho)=0, $$

这里G的归一化将在下一节固定。对永久谐波，按出射频域解或绝热开启的极限理解，不把过去无穷的边界项直接当作自动消失。这个相容性检查也见[Tong讲义6.1.3节](https://www.damtp.cam.ac.uk/user/tong/em/el5.pdf)。

## 2. 推迟核：从空间衰减走到光锥

取波算子□=c⁻²∂ₜ²−Δ，与上一节L相反。满足□G=δ³(x)δ(t)的三维推迟核为

$$ G_{\rm ret}(\mathbf x,t)
=\frac{\delta(t-r/c)}{4\pi r},\qquad r=|\mathbf x|. $$

可以先把它与任意光滑时间函数f卷积，得到f(t−r/c)/(4πr)。在r>0处，将径向Laplace算子直接作用上去，波动项相消；在原点附近，对小球积分，径向通量由1/r项给出−f(t)，时间项的体积积分趋于0。因此L作用的分布源为−f(t)δ³(x)，正好对应□G=δ。这也固定了4π和符号。

对给定源，卷积给出

$$ V(\mathbf x,t)=\frac1{4\pi\varepsilon_0}
\int\frac{\rho(\mathbf x',t-R/c)}R\,d^3x',\qquad
\mathbf A(\mathbf x,t)=\frac{\mu_0}{4\pi}
\int\frac{\mathbf J(\mathbf x',t-R/c)}R\,d^3x',\quad
R=|\mathbf x-\mathbf x'|. $$

每个源点有自己的R和推迟时刻，不能把整个有限源一律延迟同一个时间，除非之后说明采用了什么近似。

换成δ(t+r/c)得到超前核，它也满足波动方程；Maxwell方程本身允许时间反演。推迟选择表达“没有从未来或无穷远特意安排的入射响应”。还可以叠加满足齐次方程、符合所需初始数据的自由场，所以“给出源”与“完全指定电磁场”之间还差初边界条件。

以e⁻ⁱωᵗ为时间约定，推迟核对应e⁺ⁱωʳ⁄ᶜ/r的出射球波。只要求势在无穷远按1/r变小，不能区分出射与入射；这是本页与静电Dirichlet问题的一个重要区别。

## 3. 偶极近似有两个小参数

设有限源尺寸为a，观察距离r≫a。对源位置x′展开

$$ R=r-\hat{\mathbf n}\cdot\mathbf x'+O(a^2/r),\qquad
t-R/c=t-r/c+\hat{\mathbf n}\cdot\mathbf x'/c+O(a^2/(rc)). $$

展开1/R由a/r控制；展开源在不同推迟时刻的差，由源变化时间与a/c比较来控制。谐波下，另一个小参数是ωa/c。观察者可以处于a≪r≪c/ω：点偶极近似成立，但仍位于偶极的近场。

定义p(t)=∫xρ(x,t)d³x。用连续方程并在无穷远去掉局域电流的边界项：

$$ \dot p_i=-\int x_i\partial_jJ_j\,d^3x
=\int J_i\,d^3x. $$

所以最低阶矢势由ṗ决定。总电荷Q=∫ρ在局域闭合系统中守恒，其静态单极项不会产生这种时变偶极辐射。若偶极项恰因对称性消失，磁偶极或电四极等更高阶项可能成为首项，不能仍把零偶极式当作全部辐射。

短电流元的尺度假设与角分布可对照[Fitzpatrick的Hertz偶极推导](https://farside.ph.utexas.edu/teaching/em/lectures/node94.html)。实际天线的电流分布和损耗不是本实验的输入，因此本页不根据偶极振幅直接推断天线效率。

## 4. 理想点偶极：给完整外部场一个明确模型

为同时研究近场和远场，取沿z轴的理想点偶极p(t)ẑ。形式上它的源为

$$ \rho(\mathbf x,t)=-p(t)\partial_z\delta^3(\mathbf x),\qquad
\mathbf J(\mathbf x,t)=\dot p(t)\delta^3(\mathbf x)\hat{\mathbf z}. $$

时间导数与散度恰好抵消，满足连续方程。它是一个分布源模型，不是声称有限电荷真的无限紧密排列。将分布与推迟核卷积，在r>0得到

$$ V=k\cos\theta\left(\frac{p(\tau)}{r^2}
+\frac{\dot p(\tau)}{cr}\right),\qquad
\mathbf A=\frac{k}{c^2r}\dot p(\tau)\hat{\mathbf z},\qquad
\tau=t-r/c,\quad k=\frac1{4\pi\varepsilon_0}. $$

标势也可写成−k∂z[p(t−r/c)/r]。对z求导时，既要导1/r，也要导推迟时刻，正是这两处产生上式两项。

这些势给出理想点偶极在r>0的完整解；实际有限源只能在第3节近似条件下使用。原点是奇点，本页不在那里赋予有限场值，也不把对全空间积分的点源自能当成可测有限量。

## 5. 亲自求导：保留方向，再谈平方

使用标准球坐标基，ẑ=cosθr̂−sinθθ̂。由A可读出Aᵣ和Aθ，结合∂rτ=−1/c，求得

$$ E_r=2k\cos\theta\left(\frac p{r^3}+\frac{\dot p}{cr^2}\right), $$

$$ E_\theta=k\sin\theta\left(\frac p{r^3}
+\frac{\dot p}{cr^2}+\frac{\ddot p}{c^2r}\right),\qquad E_\varphi=0, $$

$$ B_\varphi=\frac{k\sin\theta}{c^2}
\left(\frac{\dot p}{r^2}+\frac{\ddot p}{cr}\right),\qquad B_r=B_\theta=0. $$

所有p及其导数均在τ取值。以Eᵣ为例，−∂rV含有p̈/(c²r)cosθ，而−∂ₜAᵣ含有其相反数，所以径向没有1/r项。这是辐射场横向性的直接来源。

1/r电场的向量形式为

$$ \mathbf E_{\rm rad}
=\frac{k}{c^2r}\hat{\mathbf n}\times
\big(\hat{\mathbf n}\times\ddot{\mathbf p}(\tau)\big),\qquad
\mathbf B_{\rm rad}=\frac1c\hat{\mathbf n}\times\mathbf E_{\rm rad}. $$

注意叉乘顺序：n×(n×p̈)=n(n·p̈)−p̈。它与(n×p̈)×n相差一个负号。模长或功率只看平方，会漏掉这个方向错误；必须用势求导或一个固定坐标例子检查。对n=x̂、p̈沿+z，电场沿−z；标准θ̂在此也沿−z，因此Eθ的正号与向量式一致。

实验分别保留近场、感应场、辐射场贡献；完整场由实际相加得到。ω=0时p为常量，磁场与辐射项都为0，但静电偶极场仍存在。θ=0或π时远场为0，径向近场也不必为0。

## 6. Poynting流：近区为什么可以回流？

能流与能量密度分别是

$$ \mathbf S=\frac1{\mu_0}\mathbf E\times\mathbf B,
\qquad u=\frac{\varepsilon_0}2|\mathbf E|^2
+\frac1{2\mu_0}|\mathbf B|^2. $$

对当前轴偶极，方向分量为

$$ S_r=\frac{E_\theta B_\varphi}{\mu_0},\qquad
S_\theta=-\frac{E_rB_\varphi}{\mu_0}. $$

完整Eθ与Bφ在近区未必同号，所以Sr可为负。仅取辐射项时Bφ=Eθ/c，则Sr≥0。这两种曲线计算的是不同部分，不能把近区完整场强直接代入平面波公式S=ε₀cE²。

源外真空满足Poynting定理。由向量恒等式

$$ \nabla\cdot(\mathbf E\times\mathbf B)
=\mathbf B\cdot(\nabla\times\mathbf E)
-\mathbf E\cdot(\nabla\times\mathbf B) $$

代入Maxwell方程即得∂ₜu+∇·S=0。对r₁&lt;r&lt;r₂的无源球壳积分：

$$ \frac d{dt}\int_{r_1<r<r_2}u\,d^3x
=P(r_1,t)-P(r_2,t). $$

外球与内球在同一时刻的功率不相等，差额就是壳中储能变化。该球壳排除原点，因此这里没有擅自处理发散自能。

## 7. 完整球面瞬时功率：辐射项加一个时间导数

因为Eθ、Bφ均带sinθ，积分只需

$$ \int\sin^2\theta\,d\Omega
=2\pi\int_{-1}^{1}(1-v^2)\,dv=\frac{8\pi}{3}. $$

将第5节完整场相乘，注意两次出现的ṗp̈交叉项，得到

$$ P(r,t)=\frac{2k}{3c^3}\left[
\ddot p^2+\frac{2c}{r}\dot p\ddot p
+\frac{c^2}{r^2}(\dot p^2+p\ddot p)
+\frac{c^3}{r^3}p\dot p\right]_{\tau}. $$

第一项是传播到无穷远仍保留的辐射功率，其余项可写成时间导数：

$$ P(r,t)=P_{\rm rad}(\tau)+\partial_\tau W_r(\tau),\qquad
P_{\rm rad}=\frac{2k}{3c^3}\ddot p^2, $$

$$ W_r=\frac{2k}{3}\left[
\frac{\dot p^2}{c^2r}+\frac{p\dot p}{cr^2}
+\frac{p^2}{2r^3}\right]. $$

Wᵣ在这里定义为反应性功率项的原函数，不将它直接命名为“整个空间的全部场能”。它的导数说明了瞬时回流如何与净辐射并存。

实验在v=cosθ上用32段Simpson实际求积，另列各节点场值和面积权重。当前角因子是二次多项式，Simpson对它在精确算术下恰好积分；实际残差仍来自浮点运算。这个角积分事实不能推广成“Simpson对任意辐射方向图都精确”。

## 8. 谐波平均：任意包围球都可核对净功率

取p=Acosωτ，ω>0，周期T=2π/ω。Wᵣ是周期函数，所以完整周期平均的导数为0；又有〈p̈²〉=A²ω⁴/2，故

$$ \langle P(r,t)\rangle
=\frac{kA^2\omega^4}{3c^3}
=\frac{A^2\omega^4}{12\pi\varepsilon_0c^3}. $$

在理想谐偶极的完整外部场中，平均径向角功率同样为

$$ \left\langle\frac{dP}{d\Omega}\right\rangle
=\frac{kA^2\omega^4}{8\pi c^3}\sin^2\theta. $$

它并非只能在远区成立；在近区，完整场的交叉项经过周期平均恰好抵消。远区的优势是可以在局部直接识别向外的1/r辐射场，而无需先平均消去反应性成分。

实验直接平均完整EθBφ，不只平均辐射场的平方。32个等间隔相位对谐波乘积中的常数项和二倍频项可精确取平均：非零的一阶、二阶离散Fourier和为0。每个相位的角积分还用两个Gauss节点v=±1/√3，权重均为1，恰好积分当前二次角因子。所有相位与角节点保留在账表中。

ω=0时没有有限周期，但系统变成静态，B=0、S=0。实验明确显示静态重复读数，不用无限周期、无穷观察半径或0/0伪装成平均值。

非相对论点电荷在电偶极近似中有p̈=qa，远区总功率因此为

$$ P_{\rm Larmor}=\frac{q^2a^2}{6\pi\varepsilon_0c^3}. $$

这是功率关系，不是已经解出了粒子的辐射反作用运动方程。该近似仍需要速度远小于c及相应尺度分离；实验中任意改变偶极矩A并不自动指定一个满足这些条件的粒子轨迹。

## 9. 有限脉冲：把前沿与总能量算出来

永久谐波没有真正的“刚刚开机”。为观察因果前沿，另取有限脉冲，令s=(τ−t₀)/D：

$$ p(\tau)=
\begin{cases}
256A\,s^4(1-s)^4,&0<s<1,\\
0,&\text{其他时间}.
\end{cases} $$

峰值在s=1/2，恰为A。端点处p及前三阶导数连续归0，足够让本页源外Maxwell场和能量守恒关系正常成立。它不是严格带限信号；D给主要变化尺度，不能据此声称所有高频分量都被截断。

对固定r，脉冲最早可能在t=t₀+r/c出现；端点处场仍为0，在之后才连续增长。晚于t₀+D+r/c后，该点的场再次归0。改变传播速度会移动这两个时刻。

由于脉冲前后Wᵣ均归0，对完整时间轴积分：

$$ \int_{-\infty}^{\infty}P(r,t)\,dt
=\frac{2k}{3c^3}\int_{-\infty}^{\infty}\ddot p(\tau)^2\,d\tau. $$

不同半径在同一个时刻看到的功率可以不同，但等脉冲全部通过后，收到的净能量相同。令f(s)=256s⁴(1−s)⁴，则

$$ \int_0^1[f''(s)]^2\,ds=\frac{1572864}{5005},\qquad
E_{\rm pulse}=\frac{1048576}{5005}\frac{kA^2}{c^3D^3}. $$

这个分数由有限多项式平方后逐项积分得到。实验使用整数系数和精确分数计算闭式参考，再用256段Simpson积分实际p̈²作有限近似，两者不共享一个预先填好的结果。靠近脉冲端点时，直接使用含s和1−s因子的导数形式，避免展开大多项式后发生严重相消。

累计能量图积分的是辐射项，横轴使用源时刻τ。在脉冲尚未完整通过时，完整场穿过半径r球面的累计净能量还要加上当前Wᵣ；它可以与图中累计辐射能量不同。只有脉冲前后Wᵣ归0，两者的完整积分才相等。时间扫描同时在源脉冲与推迟脉冲的区间加密采样，避免传播延迟很大时，均匀网格漏掉短脉冲。

## 10. 比较不同距离，先决定比较哪一个时刻

如果两个观察者在同一个观察时刻t读场，分别使用τ₁=t−r₁/c和τ₂=t−r₂/c，他们看到的是源的不同历史。谐波会有相位差；有限脉冲还可能只有一位观察者收到了信号。

如果希望比较同一个源事件τ，就应使用

$$ t_1=\tau+r_1/c,\qquad t_2=\tau+r_2/c. $$

此时辐射球面功率P辐射(τ)相同，辐射场幅度按1/r衰减。完整瞬时功率仍含Wᵣ的导数，近区不必相同。实验同时列“同观察时刻”和“同源时刻”，避免把传播相位变化误认为能量不守恒。

谐波中定义κ=ωr/c。κ≪1、κ约1、κ≫1分别帮助判断近场、过渡区与辐射区，但并没有三个区域的硬边界。不同角度、不同相位可以让某一项恰好消失；只比较r的幂次不能保证某个瞬间的主导项。脉冲有多个频率，更应直接查看各场项和时间尺度，不能机械地给它指定唯一κ。

## 11. 从这页走向更复杂的辐射问题

有限源的下一阶包含磁偶极与电四极，涉及源的空间结构及不同方向之间的相位干涉。完整运动点电荷场还会出现由源运动决定的隐式推迟时间和相对论角因子；不能只在本页公式里把某个速度改大。

辐射反作用需要额外处理自场、有效方程和初值问题；量子辐射又涉及能级、光子统计与开放系统。这里已经建立的检查方法仍适用：首先固定模型与近似条件，然后分别验证场方向、传播时间、能量守恒与可观测功率。

本页提供的是理想源的经典外部场实验。它可以帮助理解近场探测、脉冲传播和多极散射的基础，但没有包含真实器件的尺寸、电路匹配、材料色散或损耗模型。

## 12. 四道练习与完整解答

### 练习1：一个坐标例子检查双叉乘

观察方向n=x̂，源的p̈=aẑ，a>0。给出辐射E、B方向，并验证Poynting流向外。

<details class="answer" markdown="1">
<summary>展开完整解答：先算方向，最后才算功率</summary>

n·p̈=0，因此n×(n×p̈)=−aẑ，E沿−z。再算B=n×E/c=x̂×(−ẑ)/c，方向为+y。最后(−ẑ)×ŷ=+x̂，故能流沿观察方向向外。

若把两场同时翻转，Poynting平方检查仍通过；这就是仅检查功率不足以验收电场向量公式的原因。与势求导或源相位的比较才会暴露方向问题。

</details>

### 练习2：瞬时回流与正的平均功率能否同时成立？

取k=c=A=ω=1，r=0.2，在源相位τ=0观察。计算完整球面瞬时功率、辐射项功率与周期平均功率。

<details class="answer" markdown="1">
<summary>展开完整解答：保留近场交叉项</summary>

τ=0时p=1、ṗ=0、p̈=−1。完整球面功率为

$$ P=\frac23\left(1-\frac1{r^2}\right)
=\frac23(1-25)=-16. $$

辐射项单独为2/3，周期平均则为1/3。完整瞬时负值表示此刻有净能量跨过这个球面向内流动；整个周期中反应性项的导数平均为0，仍有正的净辐射。所需观察时刻是t=τ+r/c=0.2，不是直接把t设为0。

</details>

### 练习3：有限脉冲何时到达，收到多少能量？

取k=c=A=1、D=2、t₀=0，观察者在r=4。求信号可能非零的时间区间及完整脉冲净能量。

<details class="answer" markdown="1">
<summary>展开完整解答：区分到达时间和积分总量</summary>

推迟时刻τ=t−4。只有0&lt;τ&lt;2时源脉冲活跃，所以观察场只可能在4&lt;t&lt;6非零；在两个端点场也为0。完整辐射能量为

$$ E_{\rm pulse}=\frac{1048576}{5005\cdot8}
=\frac{131072}{5005}\approx26.1882118. $$

t=5只说明脉冲正在经过，不能把截至此刻的通量积分直接写成完整脉冲能量。若换到r=8，到达区间变为8&lt;t&lt;10，但等完整脉冲通过后，净能量不变。

</details>

### 练习4：保持同源时刻比较远场

两个观察者位于r₁=2、r₂=8，方向相同，c=1。选择同一个源事件τ=3，分别求观察时刻；在该事件的辐射项不为零时，比较辐射场幅度、局部辐射通量和角功率。

<details class="answer" markdown="1">
<summary>展开完整解答：幅度衰减与面积因子配对</summary>

观察时刻分别为t₁=5、t₂=11。辐射幅度之比是r₁/r₂=1/4，局部辐射通量之比为1/16；角功率dP/dΩ=r²Sr把面积因子补回，所以两者相同。

这些比例针对同源时刻的辐射项。若同时在t=5读数，远处观察者看到τ=−3，与近处不是同一个事件；若使用完整近场，额外的1/r²、1/r³项也会改变比例。方向节点处两幅度都为0，不应写成0/0比值。

</details>

</div>
