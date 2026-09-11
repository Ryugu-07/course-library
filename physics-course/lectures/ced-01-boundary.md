# 电动力学 I · 边值问题与多极展开

> **前置**：[静电与介质](em-01-electrostatics.html)、[数学物理方法](mp-01-special-functions.html)、向量分析的散度定理与分部积分。**目标**：从边界条件构造电势，推导导体响应，再说明远场近似何时可信。

<div class="boundary-course" markdown="1">
<style>.boundary-course .learning-lab{margin-left:0;margin-right:0;width:100%}.boundary-course .fallback-scroll{overflow:auto;max-width:100%}.boundary-course .fallback-scroll td{overflow-wrap:anywhere}.boundary-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.boundary-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>

<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：同一颗球，接地和孤立有什么不同？

把一个正电荷靠近金属球，两种情况下球面都会重新分布电荷。接地允许电荷与储库交换，规定的是球面电位；孤立则规定球的总电荷。它们都满足“金属内部电场为零”，但外部的解并不相同。

先在实验中比较接地球和孤立中性球。预测三个量：球面电位、总感应电荷、真实电荷所受的力。然后看边界势、表面密度和累计积分是否支持你的预测。最后改变远场半径和展开阶数，观察近似误差；离源不够远时，多加一阶未必改善很多。

<div class="learning-lab" data-learning-lab="image-charge-boundary" markdown="1">

**先预测，再揭示。** 本实验取k=1、ε₀=1/(4π)。平面模型的d是到平面的距离；球模型的d=a+间隙。图中像电荷位于被排除的区域，只用于构造外部解。零电荷的位置仍可标出，但没有人为补上的场方向。

<figure class="plot" markdown="1">
[![导体边值与多极的四个固定场景](assets/img/ced-01-boundary-ledgers.svg)](assets/img/ced-01-boundary-ledgers.svg)
<figcaption>图1.1：打开原图，比较积分区域、导体条件和零电荷。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="边值问题固定数值记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>平面边界势</td><td>0</td></tr>
<tr><td>平面完整电荷</td><td>-1</td></tr>
<tr><td>平面有限积分</td><td>-0.8759652654107837</td></tr>
<tr><td>平面未覆盖电荷</td><td>-0.12403473458920833</td></tr>
<tr><td>平面受力</td><td>-0.25</td></tr>
<tr><td>平面相互作用能</td><td>-0.25</td></tr>
<tr><td>接地球离心像</td><td>-0.5</td></tr>
<tr><td>接地球像位置</td><td>0.5</td></tr>
<tr><td>接地球电位</td><td>0</td></tr>
<tr><td>接地球总电荷</td><td>-0.5</td></tr>
<tr><td>接地球受力</td><td>-0.2222222222222222</td></tr>
<tr><td>接地球相互作用能</td><td>-0.16666666666666666</td></tr>
<tr><td>孤立中性球中心像</td><td>0.5</td></tr>
<tr><td>孤立中性球电位</td><td>0.5</td></tr>
<tr><td>孤立中性球总电荷</td><td>0</td></tr>
<tr><td>孤立中性球受力</td><td>-0.09722222222222221</td></tr>
<tr><td>孤立中性球相互作用能</td><td>-0.041666666666666664</td></tr>
<tr><td>零电荷边界场</td><td>0</td></tr>
<tr><td>零电荷受力</td><td>0</td></tr>
<tr><td>零电荷多极尾界</td><td>0</td></tr>
</tbody></table>
</div>

[下载四个场景的完整数值与账本(JSON)](assets/learning/projects/image-charge-boundary/run-snapshot.json)。四场景均a=1、间隙=1、Q=0、r/d=2、L=4、探针45°；平面/接地球/孤立球q=1，零电荷平面q=0。平面d=1，球模型d=2。表内保留固定数值，图上刻度做显示舍入。


</div>

建议分三次阅读：1–5节解决平面与球的导体问题；6–8节理解分离变量和Green函数；9–11节建立带误差界的远场展开，最后完成第12节练习。长表可下载复算，第一次阅读先抓住边界、总量与误差三条线。

</section>

## 1. 先写清楚问题，唯一性才有意义

静电势满足Poisson方程，场由势的梯度给出：

$$ \Delta V=-\frac{\rho}{\varepsilon_0},\qquad
\mathbf E=-\nabla V,\qquad k=\frac1{4\pi\varepsilon_0}. $$

先考虑有界、连通、边界足够光滑的区域Ω，给定足够光滑的源和边界数据，并假设所比较的经典解存在。设两解之差u=V₁−V₂，则Δu=0。Green第一恒等式给出

$$ \int_\Omega |\nabla u|^2\,d^3x
=\oint_{\partial\Omega}u\,\partial_nu\,dA. $$

如果给定Dirichlet值，两解在边界相同，u=0，右边为0。如果给定Neumann值，则∂ₙu=0，右边也为0。被积函数连续非负，故∇u处处为0；连通性让u是一个常数。Dirichlet条件再把常数固定为0。纯Neumann问题只确定到加法常数；非连通区域的每个连通分支各有自己的常数。

Neumann数据g还必须满足

$$ \oint_{\partial\Omega}g\,dA
=-\frac1{\varepsilon_0}\int_\Omega\rho\,d^3x. $$

这是散度定理给出的**必要兼容条件**。上面的差解证明讨论唯一性，没有自动证明任意粗糙区域、任意数据下的存在性。存在性还要选择函数空间、正则性与归一化；不能只检查总通量就宣布所有边值问题都有解。能量证明也可对照[Fitzpatrick的唯一性讲义](https://farside.ph.utexas.edu/teaching/355/Surveyhtml/node81.html)。

外部区域还需要远处条件。对本页的点源问题，要求候选解有同样的Coulomb奇点，并在远处趋于0；差解在源点的奇性可去。在接地平面或球外，截断到大球后用最大值原理，内边界差为0、远球面差一致趋于0，便得u=0。若不规定远处行为，平面上V=0还可以叠加Cz；这会改变电场。

孤立导体的边界值虽然未知，但每个导体必须等势且总电荷给定。差解在某导体表面为常数c，固定总电荷意味着其法向导数通量差为0。该表面的能量边界项便是c乘以0。对本页球外问题，差解u=O(1/r)、∇u=O(1/r²)，远球面的能量项O(1/r)消失；仍得∇u=0，再由无穷远归零得u=0。这是“固定总电荷”版本的唯一性。

## 2. 接地平面：从等距离得到外部解

物理域是z>0，接地导体占据z≤0；真实q位于(0,0,d)，d>0。把辅助电荷−q放到(0,0,−d)，得到

$$ V(\rho,z)=kq\left[
\frac1{\sqrt{\rho^2+(z-d)^2}}
-\frac1{\sqrt{\rho^2+(z+d)^2}}\right]. $$

这一步只提出候选解。现在逐项检查：z>0内只有真实q的奇点；每个z=0点到两源等距，故V=0；远处势趋于0。第1节唯一性因此把候选解确定为物理解。导体内部真正的V与E都为0，不能把两点源公式继续延伸进去，当成金属内部的场。

对势求导，在外侧表面得到

$$ E_z(\rho,0^+)=-\frac{2kqd}{(\rho^2+d^2)^{3/2}},\qquad
E_\rho(\rho,0^+)=0. $$

导体外法向指向+z。跨表面的Gauss小柱给出ε₀(E外−E内)·n=σ，而E内=0，于是

$$ \sigma(\rho)=-\frac{qd}{2\pi(\rho^2+d^2)^{3/2}}. $$

q>0时，整张平面带负的感应密度；距离最近处密度最大。把环面积2πρdρ乘进去，积分到半径R的圆盘：

$$ Q_{\rm disk}(R)=-q\left(1-\frac d{\sqrt{R^2+d^2}}\right),
\qquad Q_{\rm plane}=-q. $$

实验只显示到R=8d。因此尚未覆盖的电荷为−q/√65，约为完整电荷的12.4%；这不是数值积分失败，而是积分区域有限。实现用等价的有理化形式计算小R时的差，减少相近浮点数相减的损失。

## 3. 接地球：反演点为何恰好有用？

球半径a，中心在原点，真实q在z=d>a。对球面上的点x，记其到真实源距离R₁，到轴上位置b的辅助源距离R₂。选择

$$ b=\frac{a^2}{d},\qquad q'=-\frac adq. $$

因为球面上|x|=a，直接展开平方距离：

$$ R_1^2=a^2+d^2-2ad\cos\theta,\qquad
R_2^2=a^2+b^2-2ab\cos\theta
=\frac{a^2}{d^2}R_1^2. $$

所有距离为正，所以R₂=(a/d)R₁。于是q/R₁+q′/R₂=0，不只是南北极抵消，而是**整个球面**抵消。球外势为

$$ V_g(\mathbf x)=k\left(
\frac q{|\mathbf x-d\hat{\mathbf z}|}
-\frac{aq/d}{|\mathbf x-(a^2/d)\hat{\mathbf z}|}\right),\qquad r>a. $$

像位于球内，球外没有新增奇点；远处归零。与平面一样，边界和唯一性完成论证。反演几何及接地/孤立的构造也见[Fitzpatrick的镜像法讲义](https://farside.ph.utexas.edu/teaching/355/Surveyhtml/node85.html)。

令R(θ)=√(d²+a²−2adcosθ)。将两个点源场投影到球面外法向r̂，整理得

$$ E_n(\theta)=-\frac{kq(d^2-a^2)}{aR(\theta)^3},\qquad
\sigma_g(\theta)=-\frac{q(d^2-a^2)}{4\pi aR(\theta)^3}. $$

切向场为0，因为球面电位处处为常数。积分时面积元是2πa²sinθdθ；换元R²=(d−a)²+2ad(1−cosθ)，则RdR=adsinθdθ，得到北极到θ的球帽电荷

$$ Q_{\rm cap,g}(\theta)
=-\frac{q(d^2-a^2)}{2d}
\left(\frac1{d-a}-\frac1{R(\theta)}\right). $$

取θ=π、R=d+a，恰得全球感应电荷−aq/d=q′。它小于平面模型的|q|，因为有限球面只能截获部分通量。近接触时，R(0)=d−a很小，表面峰变尖，实验用自适应积分，而不是用65个显示节点直接套一个粗求积式。

## 4. 孤立球：补一个中心像，固定的是总量

现在球不接地，总电荷保持Q。在接地球解上加一个位于球心的辅助源

$$ q_0=Q-q'=Q+\frac adq,\qquad
V_i=V_g+\frac{kq_0}{r}. $$

球心项在球面上是常数，因此没有破坏等势。它增加均匀表面电荷q₀/(4πa²)，于是

$$ V_i(a,\theta)=\frac{kq_0}{a},\qquad
\sigma_i=\sigma_g+\frac{q_0}{4\pi a^2},\qquad
Q_{\rm sphere}=q'+q_0=Q. $$

远场仍归零。等势、总电荷和真实源都满足，第1节的孤立导体唯一性适用。球帽电荷再加q₀(1−cosθ)/2；北极附近可为负，背面可为正，积分才恢复规定的总Q。

例如a=1、d=2、q=1。接地球q′=−1/2，总电荷为−1/2，球面V=0。孤立中性球Q=0，需要q₀=1/2；它的总电荷为0，但球面电位为k/2，绝不是接地球。球面等势只说“各点相同”，不说“常数等于零”。

## 5. 受力与能量：半因子不能靠猜

真实点电荷处的自场没有有限值。计算它的受力时，使用导体响应的场；镜像构造给出的正是这一部分。在轴上，平面模型有

$$ F_z=-\frac{kq^2}{4d^2},\qquad U_g(d)=-\frac{kq^2}{4d}. $$

势能的零点取U(∞)=0，定义为把q从无穷远准静态移来所做的外力功，因此−dU/dd=Fz。若把q与移动中的−q像当成两个独立真实粒子，写kq(−q)/(2d)，会多一倍。像的位置和电荷响应由边界约束决定，不是额外的物理自由度。

球模型中，真实q与离心像距离为d−a²/d，中心像距离为d，所以

$$ F_z=-\frac{kq^2ad}{(d^2-a^2)^2}+\frac{kqq_0}{d^2}. $$

接地时q₀=0，沿d积分得

$$ U_g(d)=-\frac{kq^2a}{2(d^2-a^2)}
=\frac12 qV_{\rm image}(d). $$

这里的半因子也可从线性响应看出：把真实电荷由0充到q时，诱导势随充入电荷线性增加，积分∫₀^qV诱导(q̃)dq̃给出一半。接地储库保持零电位，必须把这一约束纳入功的定义。

孤立球保持Q固定，把总像势拆成已有Q产生的kQ/d，以及由q引起的零总量感应部分。前者不随充入量变化，贡献全量qkQ/d；后者仍有一半。结果是

$$ U_i(d)=\frac{kqQ}{d}
-\frac{kq^2a^3}{2d^2(d^2-a^2)}. $$

对上式求导，保持q、Q、a固定，可得

$$ -\frac{dU_i}{dd}
=\frac{kqQ}{d^2}
-\frac{kq^2a^3(2d^2-a^2)}{d^3(d^2-a^2)^2}, $$

代入q₀=Q+aq/d后，与像场受力公式相同。实验用四个实际邻近能量值做差分，另列差分步长和残差；这种数值核对不能替代求导证明。

U是相互作用能，已扣除点电荷无限自能及不随间距变化的球自能。它可为负；这不等于说未扣除自能的ε₀∫|E|²/2为负。Q=0且d≫a时，

$$ U_i\sim-\frac{kq^2a^3}{2d^4},\qquad
F_z\sim-\frac{2kq^2a^3}{d^5}. $$

中性金属球仍吸引外部电荷，吸引来自感应极化。Q与q同号时，远处kqQ/d²可主导排斥；近表面感应吸引又能占优。

## 6. 分离变量：边界形状决定要保留哪些项

轴对称无源区域的Laplace方程为

$$ \frac1{r^2}\partial_r(r^2\partial_rV)
+\frac1{r^2\sin\theta}\partial_\theta(\sin\theta\,\partial_\theta V)=0. $$

令V=R(r)Θ(θ)，分离常数取ℓ(ℓ+1)。要求角函数在两极正则，得到Legendre多项式Pℓ(cosθ)，ℓ=0,1,…；径向方程为

$$ r^2R''+2rR'-\ell(\ell+1)R=0. $$

代入R=rˢ，特征方程s(s+1)=ℓ(ℓ+1)，所以s=ℓ或−ℓ−1。在合适的球壳无源区域，轴对称解可展开为

$$ V(r,\theta)=\sum_{\ell=0}^\infty
\left(A_\ell r^\ell+\frac{B_\ell}{r^{\ell+1}}\right)P_\ell(\cos\theta). $$

球内包含原点且无源时排除奇异项；外部要求扰动在远处衰减时排除增长项。球面Dirichlet数据V(a,θ)=f(cosθ)的系数由正交性给出

$$ f_\ell=\frac{2\ell+1}{2}\int_{-1}^{1}f(u)P_\ell(u)\,du,\qquad
\int_{-1}^{1}P_\ell(u)P_m(u)\,du=\frac{2\delta_{\ell m}}{2\ell+1}. $$

例如球外归零解为Σfℓ(a/r)^{ℓ+1}Pℓ。对于足够光滑的边界数据，该级数在远离边界的紧集上一致收敛并可逐项求导；一般L²数据先按边界迹的L²意义理解，不承诺任意不连续边界值在每一点都以普通点值收敛。非轴对称问题改用球谐函数Yℓm，不能仍只保留m=0。

## 7. 均匀外场中的导体球与介质球

给定远场E₀ẑ，背景势是−E₀rcosθ。它只有ℓ=1，因此导体球的衰减响应也只需同一角模。取球面V=0，得到

$$ V=-E_0\left(r-\frac{a^3}{r^2}\right)\cos\theta,
\qquad \sigma=3\varepsilon_0E_0\cos\theta. $$

这里远处V本身不归零；归零的是**相对于已给背景的扰动**。比较偶极势kp cosθ/r²，读得p=4πε₀a³E₀。球面密度积分为0，与中性条件相符。该标准边界实例可对照[Tong电磁学讲义2.4.4节](https://davidtong.org/pdfs/teaching/electromagnetism/electro1.pdf)。

若球内为线性均匀介质ε₁，外部为ε₂，二者均为正常数，界面无自由面电荷，设

$$ V_{\rm in}=-AE_0r\cos\theta,\qquad
V_{\rm out}=-E_0r\cos\theta+BE_0\frac{a^3}{r^2}\cos\theta. $$

势连续给A=1−B；D法向连续给ε₁A=ε₂(1+2B)。联立即

$$ A=\frac{3\varepsilon_2}{\varepsilon_1+2\varepsilon_2},\qquad
B=\frac{\varepsilon_1-\varepsilon_2}{\varepsilon_1+2\varepsilon_2}. $$

ε₁=ε₂时B=0，界面不产生扰动；ε₁/ε₂→∞时A→0、B→1，恢复导体形式。这里使用的是D法向连续，而不是E法向连续；极化束缚电荷可以使E法向跳变。固定频率下的复介电常数、耗散和共振需要动态模型，本节静态正介质结论不能直接当作那类系统的完整解。

## 8. Green函数：把边界响应写进核

采用本页约定：对源变量x′求导，Dirichlet核满足

$$ \Delta'G_D(\mathbf x,\mathbf x')=-4\pi\delta^3(\mathbf x-\mathbf x'),
\qquad G_D|_{\partial\Omega}=0. $$

这是把自由空间核写成1/|x−x′|的归一化。不同书可把−4π吸收入核，必须连同表示公式一起换，不能只换一处符号。

把Green第二恒等式用于V与G，观察点x固定在域内，处理核的小球奇点后得

$$ \int_\Omega(V\Delta'G-G\Delta'V)\,d^3x'
=\oint_{\partial\Omega}(V\partial_{n'}G-G\partial_{n'}V)\,dA'. $$

左边等于−4πV(x)+(1/ε₀)∫Gρ，右边因G=0只剩第一项。解出V便是

$$ V(\mathbf x)=k\int_\Omega\rho(\mathbf x')G_D(\mathbf x,\mathbf x')\,d^3x'
-\frac1{4\pi}\oint_{\partial\Omega}V(\mathbf x')\partial_{n'}G_D(\mathbf x,\mathbf x')\,dA'. $$

n′始终是**求解域Ω的外法向**。若Ω是球外区域，其内边界的n′指向球心；第3节计算σ时的导体外法向却指向球外。这两个方向相反，不能拿同一个导数不加说明地代入两式。外域公式还须令远球面项消失；本页紧支撑源、有限边界数据与Coulomb衰减满足这一要求。

球外核可由任意源点x′的Kelvin像构造，令r′=|x′|>a、x′*=a²x′/r′²：

$$ G_D(\mathbf x,\mathbf x')=
\frac1{|\mathbf x-\mathbf x'|}
-\frac a{r'}\frac1{|\mathbf x-\mathbf x'^*|}. $$

表面消去的几何与第3节相同。看似不对称的第二项实际等于

$$ \frac a{\sqrt{r^2r'^2-2a^2\mathbf x\cdot\mathbf x'+a^4}}, $$

所以交换x与x′不变。这同时验证核在两变量中的边界条件和互易性。对于一般Dirichlet域，互易性也可将两个点核代入Green第二恒等式，边界项为0，由两个δ项得到。

具体复用一次：球外有若干真实qⱼ，球面规定同一常数V₀，则

$$ V(\mathbf x)=k\sum_jq_jG_D(\mathbf x,\mathbf x_j)+V_0\frac ar. $$

第一项球面为0，第二项球面为V₀，二者远处都衰减。若规定的是球总电荷Q而非V₀，必须再用总通量确定常数V₀，不能把固定电位的解直接称作固定电荷解。

## 9. 多极展开：先规定观测点在所有源之外

设电荷分布支撑于|x′|≤b，且总变差电荷M=∫|ρ|d³x′有限。观测r>b。由Legendre母函数

$$ \frac1{|\mathbf x-\mathbf x'|}
=\frac1r\sum_{\ell=0}^\infty
\left(\frac{r'}r\right)^\ell P_\ell(\hat{\mathbf x}\cdot\hat{\mathbf x}'), $$

且|Pℓ(u)|≤1（−1≤u≤1），该级数被几何级数控制。对ρ积分与求和可交换；保留到L阶有绝对尾界

$$ |V-V_L|\le\frac{kM}{r}
\frac{(b/r)^{L+1}}{1-b/r}. $$

这是一个对所有观测角统一的上界。它可以很保守，但清楚说明：控制精度的量是b/r，光说“已经取了十阶”没有意义。r≤b时这一证明失效，不能让公式外推到源区。

写出前三项，定义总电荷、偶极矩和无迹四极张量：

$$ Q=\int\rho\,d^3x',\quad
\mathbf p=\int\mathbf x'\rho\,d^3x',\quad
Q_{ij}=\int(3x'_ix'_j-r'^2\delta_{ij})\rho\,d^3x'. $$

于是

$$ V(\mathbf x)=k\left[
\frac Qr+\frac{\mathbf p\cdot\hat{\mathbf x}}{r^2}
+\frac1{2r^3}\sum_{ij}Q_{ij}\hat x_i\hat x_j\right]+R_2. $$

四极前的1/2来自P₂(u)=(3u²−1)/2；Qᵢⱼ对称，迹为0。若第一个非零矩为ℓ阶，它给出的势按r^{−ℓ−1}衰减，但某些观察方向上角因子可为0；不能断言每个方向都由同一非零系数主导。

本实验的有限辅助源都在z轴，轴向矩mℓ=Σqᵢzᵢ^ℓ。逐阶贡献为

$$ V_\ell(r,\theta)=\frac{k\,m_\ell}{r^{\ell+1}}P_\ell(\cos\theta),\qquad
|V-V_L|\le\sum_i\frac{k|q_i|}{r}
\frac{(|z_i|/r)^{L+1}}{1-|z_i|/r}. $$

负zᵢ的符号保留在zᵢ^ℓ中。中心源只有单极贡献，之后的尾界为0。取r>d，便包围真实源和所有像，级数绝对收敛。平面模型虽有无限延伸的真实表面电荷，实验展开的是在**上半空间产生同一个势的有限辅助源**；这并不声称那张无限平面的每个高阶真实电荷矩都有限。

## 10. 怎样读误差图，怎样使用多极矩

多极图的直接值由点源逐个求势得到，截断值由Legendre递推和源矩得到；尾界来自上节解析不等式。三者没有互相填入同一列。真实势在对称方向可以恰好为0，因此实验显示绝对误差，不把零点附近的除法放大叫作“物理失效”。浮点舍入仍会给精确零和界带来末位误差，严格界约束的是数学级数尾部。

表面电荷积分是另一项计算：自适应Simpson把一个区间细分，比较粗细两个近似，按差值/15估计误差并校正。这个估计依赖光滑度和渐近行为，不是无条件上界。实验保留全部最终叶子的函数值、细粗积分、容差和是否达到容差，另与闭式帽/盘电荷核对。**不要把Simpson估计误差与多极严格尾界混成一个精度证书。**

改变原点也会改变矩。若新原点位于旧坐标c处，则

$$ Q_{\rm new}=Q,\qquad \mathbf p_{\rm new}=\mathbf p-Q\mathbf c. $$

中性分布的偶极矩因此与原点无关；带净电荷时不具有这一性质。四极变换还含偶极和总电荷项，不能从“中性”单独推出四极矩原点不变。

永久电偶极在缓慢变化的外场中，展开两端电荷能量，最低阶得

$$ U=-\mathbf p\cdot\mathbf E,\qquad
\boldsymbol\tau=\mathbf p\times\mathbf E,\qquad
\mathbf F=\nabla(\mathbf p\cdot\mathbf E), $$

此处p按固定永久偶极处理。感应偶极p=αE在线性可逆响应下的能量是−αE²/2，不能直接把p(E)塞进固定偶极能量而忽略建立极化所需的功。中性分子的永久偶极或四极决定部分静态远场结构；涨落诱导的色散力还涉及量子涨落与频率响应，不由“第一个永久矩”独自决定全部分子间作用。

## 11. 连接磁偶极与后续课程

对局域、稳恒、散度为零且边界衰减充分的电流，磁偶极矩定义为

$$ \mathbf m=\frac12\int\mathbf x\times\mathbf J(\mathbf x)\,d^3x. $$

其远场首个可能非零项是偶极项；若m=0，还需看更高阶，而不是强行说每个电流分布都有非零偶极。没有磁单极项与∇·B=0相容。小平面电流环给m=I面积向量，提供可直接核对的例子。时变源还要计入传播延迟，本页静态多极并未证明辐射功率。

这些方法为后续主题补齐基础：腔体和波导的模展开、散射中的多极截断、Green函数的边界响应，以及数值边界元的积分表示。继续推进前沿时，应保留这条判断链：物理域与边界条件→存在/唯一性适用条件→构造解→可核对观测量→近似误差的范围。

## 12. 四道练习与完整解答

### 练习1：同一组参数，接地和中性孤立差在哪里？

取k=a=q=1、d=2，分别求两种球的像、电位、总电荷、Fz和U。

<details class="answer" markdown="1">
<summary>展开完整解答：分别代入边界条件</summary>

两者离心像均为q′=−1/2、b=1/2。接地q₀=0，V球=0、Q球=−1/2，力与能量为

$$ F_g=-\frac29,\qquad U_g=-\frac16. $$

中性孤立球Q=0，故q₀=1/2，V球=1/2、Q球=0。中心像提供+1/8的排斥力，总力

$$ F_i=-\frac29+\frac18=-\frac7{72},\qquad
U_i=-\frac1{24}. $$

两者都吸引，但中性孤立球吸引较弱；中心补偿电荷使总量满足0。若算出的孤立球电位也为0，就没有真正更换边界条件。用实验“接地球”和“孤立中性球”可直接复算这些值。

</details>

### 练习2：为何图中积分未达到−q？

接地平面取q=d=1，实验积分到R=8。算出有限积分与剩余电荷；若希望遗漏电荷绝对值小于0.01，R至少应多大？

<details class="answer" markdown="1">
<summary>展开完整解答：区域截断误差与求积误差分开</summary>

圆盘电荷为−1+1/√65≈−0.875965265，剩余为−1/√65≈−0.124034735。把积分容差从10⁻⁶改到10⁻¹²，不会让半径8的区域变成无限平面。

要求遗漏绝对值1/√(R²+1)<0.01，平方并整理得到

$$ R>\sqrt{9999}\approx99.995. $$

因此必须扩大积分区域，或把已知解析尾部单独加回，而不是继续细分同一个圆盘。若使用≤0.01，端点可取等号。

</details>

### 练习3：球外Green核如何同时处理源和电位？

球半径a，外部单点q位于d，球面电位给定V₀。写出候选解，并求球总电荷；再反解固定Q对应的V₀。

<details class="answer" markdown="1">
<summary>展开完整解答：先构造，再用总通量切换约束</summary>

候选解为接地像对势加V₀a/r。后一项等效于中心像q₀=V₀a/k；它在球面正好贡献V₀。球外只有原来的真实奇点，远处归零，故满足Dirichlet唯一性。

导体总电荷为内部辅助源之和，也可直接积分表面密度：

$$ Q=-\frac adq+\frac{aV_0}{k},\qquad
V_0=\frac ka\left(Q+\frac adq\right). $$

这恰好恢复第4节孤立球常数电位。物理域的内边界法向指向球心；若用Green表示公式求法向导数，应先固定这个方向，再与导体向外的σ=ε₀En换号。

</details>

### 练习4：远场截断到几阶才有保证？

平面像对取q=d=k=1，观测半径r=2。用逐源绝对尾界保证所有上半空间方向的绝对势误差≤0.01；给出一个足够的L，并解释为什么这不一定是最小阶数。

<details class="answer" markdown="1">
<summary>展开完整解答：从几何级数求阶数</summary>

两源|qᵢ|=1、|zᵢ|=1，每源界为(1/2)(1/2)^{L+1}/(1−1/2)。两项相加得

$$ |V-V_L|\le2^{-L}. $$

L=7时2⁻⁷=0.0078125≤0.01，因此七阶足够。这个界对源贡献先取绝对值，没有利用像对的偶数阶相消，也没有利用某一角度的Pℓ小值，所以可能保守。在平面θ=90°，直接势和所有有效奇数阶项都为0，实际误差可远小于统一界。

若把半径改为1.05，几何比从1/2变成1/1.05，界明显变差；同样七阶不再由该界保证0.01。解释精度时应同时报告观测半径、阶数和采用的误差界。

</details>

---

*继续阅读：[电动力学 II · 辐射与推迟势](ced-02-radiation.html)。本页的静态边界方法会继续使用，但时变源必须加入传播时间。*

</div>
