# 流体 I · 连续介质与 Navier–Stokes

> **先修**：[牛顿力学与守恒律](mech-01-newton.html)、[多元积分与散度定理](../../math-course/site/analysis-06-multivar-int.html)、[多元微分](../../math-course/site/analysis-05-multivar-diff.html)。本页从喷管的质量、动量账本进入连续场方程；会解具体流动，与证明任意三维光滑初值都保持光滑，是两个不同的问题。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="continuum-conservation-learning-title">

<h2 id="continuum-conservation-learning-title">学习层：跟着流体走，还是守住一个控制体积？</h2>

### 1. 具体情境：一段变截面喷管的两种记账法

取一段固定的一维喷管控制体积 $[x_0,x_1]$，截面积为 $A(x)$。守住空间盒子时，质量账是“盒内积累 + 流出 − 流入”；跟着一小团流体走时，质量账是物质导数。两种写法必须给出同一条连续性方程：

$$
\partial_t\rho+\nabla\cdot(\rho\mathbf u)=0
\quad\Longleftrightarrow\quad
\frac{D\rho}{Dt}+\rho\,\nabla\cdot\mathbf u=0,
\qquad
\frac D{Dt}=\partial_t+\mathbf u\cdot\nabla.
$$

在准一维喷管里，散度的对应量是 $A^{-1}\partial_x(Au)$。若 $\rho$ 恒定且无积累，窄处必须加速；若密度沿流向变化，也可能由密度变化承担一部分质量通量变化。动量则不能只看局部的 $\rho D\mathbf u/Dt$：固定控制体积还要把 $\rho u^2A$ 的流入/流出通量和压力、壁面、体力一起列入账本。

### 2. 先预测：打开喷管账本前回答三个问题

1. 稳态、恒密度、质量流率不变时，喷管变窄处的速度应变大、变小，还是不由连续性决定？
2. 已知连续性方程成立且 $\rho>0$，$D\rho/Dt=0$ 是否等价于 $\nabla\cdot\mathbf u=0$？这又是否要求空间各点密度相同？
3. 对固定控制体积写动量守恒时，是否只需比较入口和出口的压力，而可以忽略 $\rho u^2A$ 的动量通量差？

### 3. 最小模型：连续性与动量分成两张账

以下数值已用固定参考量无量纲化：$x=x_{\rm phys}/L_0$、$A=A_{\rm phys}/A_0$、$\rho=\rho_{\rm phys}/\rho_0$、$u=u_{\rm phys}/U_0$、$p=p_{\rm phys}/(\rho_0U_0^2)$。质量流率单位为 $\rho_0U_0A_0$，动量通量和力的单位同为 $\rho_0U_0^2A_0$；两者不能混为同一种纵轴量。实验使用平滑的喉部面积和固定质量流率 $\dot m$，令

$$
u(x)=\frac{\dot m}{\rho(x)A(x)}.
$$

于是稳态质量通量 $\rho Au$ 在每个采样点都相同，而

$$
\frac{D\rho}{Dt}+\rho\frac1A\frac{d(Au)}{dx}=0
$$

是连续性残差的物质导数版本。恒密度模式给出 $D\rho/Dt=0$ 且准一维散度为零；变密度模式仍可严格守恒质量，但 $D\rho/Dt\ne0$，所以不能把“质量流率不变”误说成“不可压”。

固定控制体积的动量账写成

$$
\underbrace{\frac d{dt}\int_{CV}\rho uA\,dx}_{\text{积累}}
 +\underbrace{(\rho u^2A)_{out}-(\rho u^2A)_{in}}_{\text{动量净流出}}
 =\underbrace{F_{p}+F_{wall}+F_{body}}_{\text{外力}}.
$$

这里采用截面近似均匀的速度与密度，侧壁不漏流，截面固定且平滑。先积分三维连续性方程，再除去截面，得到 $\partial_t(\rho A)+\partial_x(\rho Au)=0$；稳态使 $\rho Au=\dot m$。这一步并没有解出三维横向速度，也没有把准一维散度当成单纯的 $du/dx$。

压力取指定函数 $p(x)=1.4-0.3x$，端面压力合力为 $p(x_0)A(x_0)-p(x_1)A(x_1)$，体力固定为零。实验把剩余的“动量净流出 − 压力端力”记作**所需壁面合力**。它包含侧壁压力与剪切等尚未求出的作用，正值向右、负值向左。动量残差因此按构造为零，是算术一致性检查；它不能验证这组给定 $A,\rho,p$ 真能由某种黏性流体实现。还缺状态方程、能量闭合、壁面应力和边界条件。

### 4. 静态后备：一维喷管的有限账本

<div class="learning-lab" data-learning-lab="continuum-conservation" markdown="1">

**无 JavaScript 时的静态读法：**取 $A(x)=1-0.45\exp[-((x-0.5)/0.22)^2]$、$\dot m=1$。恒密度模式用 $\rho=1$，因此 $u=1/A$，喉部速度最大；变密度模式用 $\rho(x)=1+0.2x$，仍有 $\rho Au=1$，但 $D\rho/Dt=u\,d\rho/dx>0$，由连续性抵消准一维散度项。

| 模式 | $\rho Au$ | $D\rho/Dt$ | $A^{-1}d(Au)/dx$ | 连续性残差 | 理论标签 |
|---|---:|---:|---:|---:|---|
| 恒密度、稳态 | $1$ | $0$ | $0$ | $0$ | 不可压的这一模型 |
| 变密度、稳态 | $1$ | 通常 $>0$ | 通常 $<0$ | $0$ | 可压缩质量守恒，不是不可压 |

对任意固定 $[x_0,x_1]$，动量表还应显示 $(\rho u^2A)_{out}-(\rho u^2A)_{in}$、压力端力以及补足平衡所需的壁面力。图表数值使用浮点运算，对称例中约 $10^{-16}$ 的通量差属于舍入误差，不是新的物理效应。脚本的曲线与表格只是在有限网格上检查这个构造；控制体积守恒律本身来自积分方程，而不是来自某一组采样点“看起来相等”。

</div>

### 5. 定理/模型假设与失效边界：三种“不可压”不能混为一谈

- **连续介质假设**：本页要求 $\mathrm{Kn}\ll1$，场量足够光滑，控制体积边界和通量有意义；稀薄气体、激波内部和微纳尺度需要 Boltzmann/DSMC 或其他非连续模型。
- **物质导数不是控制体积通量**：$D/Dt$ 描述随体局部变化；Reynolds 输运定理才把它与固定区域的积累和边界通量接起来。少写一项就会破坏守恒账。
- **不可压与恒密度**：连续性只给 $D\rho/Dt=-\rho\nabla\cdot u$。$D\rho/Dt=0$ 在正密度下推出散度为零；而“整个空间处处取同一常数密度”是更强的模型设定。变密度但沿流线恒定的特殊流动也不能被一句口号替代。
- **一维模型边界**：喷管账本假定准一维、平滑截面、稳态且没有激波/泄漏；壁面剪切、压力分布和体力若未给出，只能把剩余项记为壁面力，不能宣称已经解出完整动量方程。
- **证据等级**：SVG、解析导数的浮点残差和一组入口/出口数值是有限数值证据；积分守恒、连续性微分形式和 Navier–Stokes 的适用范围仍须由上述假设和方程承担。

### 6. 三道迁移题

1. 取二维速度 $u=(1,0)$、密度 $\rho=1+y$（限 $y>-1$）。空间密度不均匀，是否仍满足连续性和不可压运动条件？
2. 恒密度模式中，为什么对称端点 $x_0=0.2,x_1=0.8$ 的动量净流出为零，但壁面合力不为零？其方向如何？
3. 若把实验压力整体增加常数 $c$，速度与质量流率保持不变，端面压力力和所需壁面力各改变多少？说明为什么“壁面力”不能只理解为剪切阻力。

<details class="answer" markdown="1"><summary>展开三道迁移题答案</summary>

1. $\nabla\cdot u=0$，$D\rho/Dt=\partial_x\rho=0$，所以连续性成立。不可压运动是流体微团体积不变，不要求不同微团密度相同；本例尚未指定压力和体力，因此只验证质量方程。
2. 面积函数关于 $x=0.5$ 对称，故两端速度相等，$\dot m(u_{out}-u_{in})=0$。但压力差为 $0.18$，端力 $0.18A(0.2)>0$；壁面合力须为 $-0.18A(0.2)$，指向左。零动量净流出不等于每项外力都为零。
3. 端力增加 $c[A(x_0)-A(x_1)]$；所需壁面力相应减少同一数值。对变截面侧壁，均匀压力也有轴向分量，恰好与端面项共同抵消；封闭表面的均匀压力合力为零。这是端面与侧壁压力分账的一致性要求。

</details>

</section>

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="喷管控制体积与有符号力图，可横向滚动" style="overflow-x:auto">
<img src="assets/img/fl-01-continuum-re.svg" alt="对称喷管入口出口等速，正压力端力与负壁面合力抵消" style="min-width:720px;width:100%;display:block">
</div>
<figcaption><span class="fig-id">图 fl-01.1</span>固定恒密度模型与对称端点：入口、出口动量通量相等，向右的压力端力由向左的壁面合力抵消。上方喷管轮廓用二维等效单位宽度表示面积；不声称已求得完整流场。</figcaption>
</figure>

## 1. 连续介质假设与随体导数

**Knudsen 数** $\mathrm{Kn}=\ell_{\mathrm{mfp}}/L$ 比较平均自由程与场量变化尺度。$\mathrm{Kn}\ll1$ 支持用局部平均场描述流体；还需平均体积内分子足够多，并在所讨论区域采用相应局部平衡和本构近似。小 Kn 不是场量自动处处可微的证明。本页微分推导限于光滑区域；激波可在宏观尺度用守恒律弱解与跳跃条件描述，激波内部的分子尺度结构则可能需要动理学。稀薄气体和微纳流动还要检查滑移边界及非连续效应。

沿流体轨迹 $X'(t)=u(X(t),t)$，链式法则给出

$$\frac d{dt}f(X(t),t)=\partial_t f+u\cdot\nabla f\equiv\frac{Df}{Dt}.$$

固定位置的时间变化与随流体运动的变化因此不同。一个稳态喷管可有 $\partial_t u=0$，却仍有随体加速度 $u\,du/dx\ne0$。

## 2. 从积分账本到质量、动量与能量

**Reynolds 输运定理**：对随流体运动的体域 $V(t)$ 与光滑标量场 $f$，边界速度就是 $u$，

$$\frac d{dt}\int_{V(t)}f\,dV=\int_{V(t)}[\partial_t f+\nabla\cdot(fu)]\,dV.$$

取 $f=\rho$，随体质量守恒，再利用任意小体域，得到 $\partial_t\rho+\nabla\cdot(\rho u)=0$；乘积法则立即给 $D\rho/Dt+\rho\nabla\cdot u=0$。在正密度下，连续性把 $D\rho/Dt=0$ 与 $\nabla\cdot u=0$ 等价起来。全域恒定密度只是其中一种更强设定。

**动量**：应力张量 $\sigma$ 使面法向 $n$ 上的牵引力为 $\sigma n$。对随体动量用输运定理，对边界应力用散度定理，得到

$$\partial_t(\rho u)+\nabla\cdot(\rho u\otimes u)=\nabla\cdot\sigma+\rho g.$$

左侧展开后，含 $u[\partial_t\rho+\nabla\cdot(\rho u)]$ 的部分因连续性消失，余下

$$\rho\frac{Du}{Dt}=\nabla\cdot\sigma+\rho g.$$

**牛顿流体本构**：令 $D=(\nabla u+\nabla u^T)/2$ 为应变率，$I$ 为三维单位矩阵。各向同性牛顿流体的一般形式为

$$\sigma=-pI+2\mu\left(D-\frac13(\nabla\cdot u)I\right)+\zeta(\nabla\cdot u)I,$$

其中 $\mu$ 是剪切黏度，$\zeta$ 是体黏度。Stokes 假设取 $\zeta=0$，不是所有流体的恒等事实。对不可压运动，体积项本来就为零；再取常 $\mu$，可得 $\nabla\cdot(2\mu D)=\mu\Delta u$，于是

$$\boxed{\rho(\partial_t u+u\cdot\nabla u)=-\nabla p+\mu\Delta u+\rho g,\qquad\nabla\cdot u=0.}$$

若 $\mu$ 随温度或位置变化，就不能把它直接移到散度外。非牛顿流体的应力还会依赖剪切率、历史或额外结构变量，需更换本构。

**能量与闭合**：写 $\sigma=-pI+\tau$，单位质量内能为 $e$，热流为 $q$，单位质量加热率为 $r$，则局部内能方程为

$$\rho\frac{De}{Dt}=-p\nabla\cdot u+\tau:\nabla u-\nabla\cdot q+\rho r.$$

压缩做功、黏性耗散和热传导由此分开。可压缩问题还需要 $p=p(\rho,T)$、$e=e(\rho,T)$、热流本构（如 $q=-k\nabla T$）及初边值条件；仅质量与动量两式通常不足。不可压等温模型可把热问题另行处理，压力则承担维持散度约束的作用。

## 3. 无量纲化与 Reynolds 数

对常 $\rho,\mu$、无额外体力的不可压模型，取 $x=Lx^*$、$t=(L/U)t^*$、$u=Uu^*$、$p=p_0+\rho U^2p^*$。惯性项的共同尺度为 $\rho U^2/L$，黏性项尺度为 $\mu U/L^2$；除去前者得到

$$\partial_{t^*}u^*+u^*\cdot\nabla^*u^*=-\nabla^*p^*+\frac1{\mathrm{Re}}\Delta^*u^*,\qquad\mathrm{Re}=\frac{\rho UL}{\mu}.$$

$\mathrm{Re}\ll1$ 表示在这套尺度下黏性相对强；$\mathrm{Re}\gg1$ 表示主体惯性相对强，**不直接证明流动已经湍流**。若驱动另有频率、可压性、自由表面、热输运或粗糙度，还会出现 Strouhal、Mach、Froude、Prandtl 等独立参数。动力相似须同时匹配相关无量纲数、几何与初边值条件。

用水的 $\rho\approx10^3\,\mathrm{kg/m^3}$、$\mu\approx10^{-3}\,\mathrm{Pa\,s}$ 作数量级估计：$L=1$ m、$U=1$ m/s 给 $\mathrm{Re}\approx10^6$；$L=1\,\mu\mathrm m$、$U=10\,\mu\mathrm m/\mathrm s$ 给 $10^{-5}$。后者惯性通常是小修正，并非物理上不存在。

## 4. 理想流体、Bernoulli 与 Kelvin

形式上去掉黏性应力得到 Euler 方程，但带无滑移壁面的 $\mu\to0$ 极限可能是奇异的，不能直接把黏性解的边界条件原封不动交给 Euler。

对**稳态、恒密度、无黏、保守体力** $g=-\nabla\Phi$，利用 $u\cdot\nabla u=\nabla(|u|^2/2)-u\times\omega$，其中 $\omega=\nabla\times u$，Euler 化为

$$\nabla B=u\times\omega,\qquad B=\frac{|u|^2}{2}+\frac p\rho+\Phi.$$

与 $u$ 点乘即 $u\cdot\nabla B=0$，所以 $B$ 沿每条流线恒定；不同流线的常数可以不同。若连通区域还满足 $\omega=0$，可进一步保证空间同一常数。例如剪切流 $u=(ay,0,0)$、常压、无体力满足稳态 Euler，但 $B=a^2y^2/2+p/\rho$ 随流线的 $y$ 改变，不能把不同流线共用一个 Bernoulli 常数。正压可压缩情形应把 $p/\rho$ 改为 $h(\rho)=\int^\rho p'(s)/s\,ds$。

**Kelvin 环量的推导**：令闭曲线 $C(t)$ 随光滑流体运动，$\Gamma(t)=\oint_{C(t)}u\cdot d\ell$。对曲线参数求导，线元自身的变化贡献 $\nabla(|u|^2/2)$，于是

$$\frac{d\Gamma}{dt}=\oint_{C(t)}\left[\frac{Du}{Dt}+\nabla\frac{|u|^2}{2}\right]\cdot d\ell.$$

光滑、无黏、正压流体 $p=p(\rho)$ 在保守体力下有 $Du/Dt=-\nabla(h+\Phi)$，右侧是单值梯度的闭路积分，故为零。不要求稳态；却要求随体回路一直位于光滑流体区域。黏性壁面、激波、非正压的斜压效应或非保守外力都可能破坏这些前提，所以不能把结论说成一般流动“永远不会生涡”。

恒密度、不可压、无黏且体力保守时，取旋度得到

$$\frac{D\omega}{Dt}=(\omega\cdot\nabla)u.$$

严格二维平面流 $u=(u_x(x,y,t),u_y(x,y,t),0)$ 中，$\omega$ 仅有 $z$ 分量且 $\partial_z u=0$，拉伸项为零。三维则可能拉伸涡管。真实排水涡还涉及三维几何、初始旋转、黏性壁面与自由表面，不能只用“收臂”类比当完整推导。

**d'Alembert 佯谬的边界**：在经典无界、定常、不可压、无黏势流绕体问题中，适当远场与无穿透条件导致零阻力。它不涵盖任意有旋尾流、非定常运动或所有 Euler 解。黏性边界层及其分离解释真实阻力的重要来源；低 Re 时黏性也可以贯穿整个流场。

## 5. 一个可直接代回的精确流动

在周期区域取 $u=(U_0e^{-\nu k^2t}\sin ky,0,0)$，$\rho$、$\nu=\mu/\rho$ 为正常数，压力常量、无体力。这里 $\nabla\cdot u=0$，对流项 $u\cdot\nabla u=0$（速度沿 $x$，却只随 $y$ 变化），而

$$\partial_t u=-\nu k^2u=\nu\Delta u.$$

因此它是完整不可压 Navier–Stokes 的精确解。空间平均动能密度为 $\rho U_0^2e^{-2\nu k^2t}/4$，耗散率 $\mu\langle|\nabla u|^2\rangle=\mu k^2U_0^2e^{-2\nu k^2t}/2$，恰等于动能减少率。周期边界下压力功和边界通量消失；若把黏性耗散忽略，能量账就错了。

对一般周期光滑不可压无外力解，与 $u$ 点乘并积分，同样得到 $\frac d{dt}\int\rho|u|^2/2=-\mu\int|\nabla u|^2$。这是有用的能量控制，却在三维不足以控制所有可能的梯度集中，不能据此宣布解决正则性问题。

## 6. 从基础走向开放问题

[Clay 的 Navier–Stokes 问题页](https://www.claymath.org/millennium/Navier-Stokes-Equation/)仍把三维存在性与光滑性列为未解决问题。严格对象是指定全空间或周期条件下的三维不可压方程与合适的光滑无散初值，核心是全时间光滑性或有限时间破裂。局部光滑解、二维结果、特殊精确解、一般全局弱解和数值模拟都不能互相替代。

[David Tong 流体讲义](https://www.damtp.cam.ac.uk/user/tong/fluids/fluids.pdf)第 2 章讨论 Euler、Bernoulli 与 Kelvin，第 3 章引入应力和黏性。继续学习[黏性与边界层](fl-02-viscous.html)时，应能先判断：黏性是全域主导，还是只在某些高梯度区域不可忽略？
