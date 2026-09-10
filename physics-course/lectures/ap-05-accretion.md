# 天体 V · 吸积、喷流与高能天体

> **对标**：Frank, King & Raine《Accretion Power in Astrophysics》、Rybicki & Lightman ｜ **前置**：[致密天体](ap-04-compact.html)、[连续介质](fl-01-continuum.html)、[MHD](fl-06-plasma-mhd.html)、[Schwarzschild 时空](gr-02-einstein-schwarzschild.html)
> 同样一束光，可以来自不同的质量流率；同样的流率，不同内边界与输运机制又能给出不同的谱。本页先把能量、角动量和两面辐射的账接起来，再讨论 MRI、喷流和多信使证据。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="accretion-learning-title">
<h2 id="accretion-learning-title">学习层：一张盘的总光度，能否与每个环带加起来的光度相同？</h2>

### 1. 一个必须核对的模型接口

取 $10M_\odot$ 的中心天体，观测光度为 $L=0.5L_{\rm Edd}$，盘内缘写成 $r_{\rm in}=6r_g$，其中 $r_g=GM/c^2$。先选一个辐射效率 $\eta$，就能从 $L=\eta\dot Mc^2$ 反推 $\dot M$。

但下一步不能随意换公式。如果使用 Newton 零力矩薄盘的局部通量，把整个盘两面的辐射积分后，必得到

$$
L_{\rm N}=\frac{GM\dot M}{2r_{\rm in}}
=\frac{\dot Mc^2}{2x_{\rm in}},\qquad x_{\rm in}=\frac{r_{\rm in}}{r_g}.
$$

因此这个模型自己的效率是 $\eta_{\rm N,disk}=1/(2x_{\rm in})$。当 $x_{\rm in}=6$，它等于 $1/12\approx0.08333$；而 Schwarzschild 相对论薄盘的理想效率是 $1-\sqrt{8/9}\approx0.05719$。二者属于不同模型，不能说“差不多”就把它们当成同一个能量账。

若先用 GR 效率反推流率，再把这个流率送入未修正的 Newton 通量，得到

$$
\frac{L_{\rm N}}L
=\frac{1/12}{1-\sqrt{8/9}}
\approx1.4571.
$$

这不是黑洞凭空多发了 $45.7\%$ 的能量，而是计算途中混用了两套假设。实验默认选 Newton 零力矩盘，使同一模型内的总能量一致；选择其他效率后，仍显示 Newton 盘的结果及不匹配比例，供你检查模型接口。

### 2. 先回答五个预测

1. 零力矩内缘处的局部辐射通量是零、有限正值还是无穷大？
2. 远离内缘，温度按 $r^{-3/4}$ 还是 $r^{-3}$ 变化？
3. 固定 $L$，效率从 $0.06$ 增到 $0.30$，所需流率怎样变化？
4. $t_{\rm visc}$ 如何依赖 $\alpha$ 与 $H/r$？
5. $x_{\rm in}=6$ 的 Newton 零力矩盘，其积分效率应取 $1/12$ 还是 Schwarzschild 的 $0.05719$？

### 3. 温度最高处不在零力矩内缘

定义 $y=r/r_{\rm in}$ 和温标

$$
T_*=\left(\frac{3GM\dot M}{8\pi\sigma_{\rm SB}r_{\rm in}^3}\right)^{1/4}.
$$

两条要比较的曲线必须使用**同一个温标**：

$$
\frac{T_{\rm eff}(y)}{T_*}
=y^{-3/4}(1-y^{-1/2})^{1/4},
\qquad
\frac{T_{\rm far}(y)}{T_*}=y^{-3/4}.
$$

前者在 $y=1$ 为零，在 $y=49/36$ 达到最大；后者只是远处渐近式，在内缘不适用。不能分别把两条曲线各自除以自己的最大值，再让它们在同一纵轴上冒充绝对可比。

### 4. 完整实验与静态读法

<div class="learning-lab" data-learning-lab="accretion-eddington" markdown="1">

**无 JavaScript 的默认算例。** 取纯氢电子散射、$M=10M_\odot$、$\lambda=0.5$、$x_{\rm in}=6$、$\eta=1/12$、外半径 $1000r_{\rm in}$，在 $r=10r_g$ 取样，$\alpha=0.01,H/r=0.05$。

| 项目 | 约值 | 读法 |
|---|---|---|
| $L_{\rm Edd}$ | $1.2571\times10^{32}\ {\rm W}$ | 纯氢、完全电离、电子散射模型 |
| $\dot M$ | $8.3923\times10^{15}\ {\rm kg\,s^{-1}}$ | 约 $1.3319\times10^{-7}M_\odot/{\rm yr}$ |
| $T_{\rm eff}(10r_g)$ | $6.3650\times10^6\ {\rm K}$ | 未加色温修正和 GR 传输 |
| $T_{\max}$ | $6.6107\times10^6\ {\rm K}$ | 位于 $(49/36)r_{\rm in}$ |
| $t_{\rm dyn}=1/\Omega$ | $1.5576\times10^{-3}\ {\rm s}$ | 轨道周期还要乘 $2\pi$ |
| $t_{\rm visc}$ | 约 $62.30\ {\rm s}$ | 参数化的薄盘输运时标 |
| 有限外半径内的光度比例 | $0.997063$ | 剩余部分在所画外半径之外 |

局域 MRI 模型取 $q=kv_A/\Omega=1$，增长率约 $0.74937\Omega$；这是满足理想、局域、垂直场假设的线性增长率，不是湍流 $\alpha$ 的预测。喷流取 $\beta=0.99,\theta=5^\circ$，视横向速度约 $6.2674c$；物质速度仍为 $0.99c$。

</div>

盘的完整径向表给出温度、通量、累计辐射及全部时标；频谱来自各环带 Planck 函数积分，不再用拼接的经验曲线代替。另两个场景分别检查 MRI 的不稳定范围和喷流光行时几何。无效参数会保留并隐藏输出，恢复合法输入后再手动揭示。

### 5. 先判断模型，再解释数字

光度比 $\lambda\le1$ 不足以证明某个真实源是标准薄盘。还要检查几何薄、光学厚、局部冷却、稳态、近 Kepler 转动、边界力矩、风和径向平流等条件。实验能检查所写公式的能量与量纲，不能替代辐射 MHD 或实际观测拟合。

</section>

<style>.ae-static{max-width:100%;overflow-x:auto}.ae-static img{display:block;width:1100px;min-width:1100px;max-width:none!important}.ae-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}</style>
<div class="ae-static" role="region" tabindex="0" aria-label="同标度薄盘温度、实际多色黑体积分与能量闭合图，可左右滚动"><img src="assets/img/ap-05-accretion-disk.svg" alt="同一个温标下的内边界温度与远处渐近式；由全部环带Planck函数积分出的多色黑体谱；累计双面辐射光度。" loading="lazy"></div>

## 1. 效率：表面、轨道绑定能与喷流功率不是一个口径

在弱场中，物质从远处落到半径 $R$ 的非旋转表面，最多可释放约 $GM/R$ 的单位质量势能，给 $\eta_{\rm surface}\sim GM/(Rc^2)$。但近圆轨道的总机械能为

$$
e_{\rm orb}=\frac12v_K^2-\frac{GM}{r}
=-\frac{GM}{2r}.
$$

所以一个零力矩 Kepler 盘只在到达内缘前辐射一半的势能量级。若内缘接一个缓慢旋转的物质表面，边界层还可释放剩余轨道动能；黑洞没有这样的静止物质表面。

| 模型或能源 | 效率口径 | 使用条件 |
|---|---|---|
| Newton 表面势能 | $1/(R/r_g)$ | 弱场、表面能量账；不是仅盘辐射 |
| Newton 零力矩盘 | $1/(2x_{\rm in})$ | 本页局部通量的整体积分 |
| Schwarzschild 理想薄盘 | $1-\sqrt{8/9}\approx0.05719$ | GR 的 ISCO 轨道绑定能 |
| 极端顺行 Kerr | $1-1/\sqrt3\approx0.42265$ | 理想 test-particle 极限 |
| 辐射俘获自旋上限附近 | 约 $0.30$ | $a_*\approx0.998$，具体值依辐射模型 |
| 氢聚变 | 约 $0.007$ | 反应物静质量亏损的口径 |

白矮星的表面效率通常在 $10^{-4}$ 量级；中子星需要强场、表面与自旋模型。高效率解释了吸积为何能供给很大的持续光度，但效率与源的大小、光度、自旋之间并非单一无条件对应。

## 2. Eddington 光度：力平衡的假设写进公式

球对称源在半径 $r$ 的通量为 $F=L/(4\pi r^2)$。若单位质量的通量平均不透明度为 $\kappa$，辐射加速度是 $\kappa F/c$。与 $GM/r^2$ 平衡得

$$
L_{\rm Edd}=\frac{4\pi GMc}{\kappa}.
$$

完全电离纯氢、Thomson 散射主导时，电子散射截面由电子提供，而惯性质量主要来自质子；静电耦合阻止二者长期分离，因此 $\kappa\simeq\sigma_T/m_p$，有

$$
L_{\rm Edd}\simeq1.2571\times10^{31}
\left(\frac{M}{M_\odot}\right){\rm W}.
$$

若只考虑完全电离 H/He 混合物，氢质量分数为 $X$，单位质量电子数约是纯氢的 $(1+X)/2$，于是 $\kappa_{\rm es}\simeq(\sigma_T/m_p)(1+X)/2$。这不是任意温度、频率和成分都通用的不透明度。

必须区分 $\lambda=L/L_{\rm Edd}$ 与无量纲质量流率。有人把 $\dot M_{\rm Edd}$ 定义为 $L_{\rm Edd}/c^2$，有人除以一个约定的参考效率 $\eta_0$；两个 $\dot m$ 数值相差 $\eta_0$，比较论文前要先读定义。

非球对称辐射、平流、外流、辐射俘获和非稳态都可能改变简单 Eddington 平衡；超 Eddington 不是“一切吸积都禁止”。反过来，以 $L/L_{\rm Edd}$ 小于某个阈值为由，也不能自动认证光学厚的薄盘。

## 3. 从角动量输运推到局部通量

设 $\dot M>0$ 表示向内的稳态质量流率，$\Sigma$ 为盘面密度，$v_r<0$，则 $\dot M=-2\pi r\Sigma v_r$。单位质量角动量为 $\ell=r^2\Omega=\sqrt{GMr}$。

定义向外传递角动量的正力矩 $\mathcal T(r)$。稳态、内缘零力矩时，角动量守恒要求

$$
\dot M\ell-\mathcal T=\dot M\ell_{\rm in},
\qquad
\mathcal T=\dot M(\ell-\ell_{\rm in}).
$$

邻近环带角速度不同；力矩跨过这段角速度差所耗散的功率为 $\mathcal T(-d\Omega/dr)\,dr$。两面环带的总面积是 $4\pi r\,dr$，所以**每一面**的局部辐射通量满足

$$
4\pi rF(r)\,dr
=\mathcal T(r)\left(-\frac{d\Omega}{dr}\right)dr.
$$

代入 $\Omega=(GM/r^3)^{1/2}$ 和上面的力矩：

$$
F(r)=\frac{3GM\dot M}{8\pi r^3}
\left(1-\sqrt{\frac{r_{\rm in}}r}\right),
\qquad \sigma_{\rm SB}T_{\rm eff}^4=F(r).
$$

因子 $3$ 来自角动量输运带来的能量重新分配，不是简单把每个环带的势能变化全都就地辐射。内缘零通量也依赖零力矩假设；磁应力、表面边界层或 GR 内区都可改变它。

### 总能量与有限外半径

对两面全盘积分，

$$
L_{\rm N}=4\pi\int_{r_{\rm in}}^\infty rF(r)\,dr
=\frac{GM\dot M}{2r_{\rm in}}.
$$

对有限 $Y=r_{\rm out}/r_{\rm in}$，

$$
\frac{L(<r_{\rm out})}{L_{\rm N}}
=1-\frac3Y+\frac2{Y^{3/2}}.
$$

令 $f=1-Y^{-1/2}$，同一个比例等于 $f^2(3-2f)$；这在接近内缘时比相近大数相减更稳定。每个对数半径区间的辐射为

$$
\frac1{L_{\rm N}}\frac{dL}{d\ln r}
=\frac3y(1-y^{-1/2}).
$$

它在 $y=9/4$ 达峰；温度峰却在 $49/36$。最热的环带不一定贡献最多光度，因为面积也在变化。

## 4. 从温度剖面推到真正的多色黑体谱

局部黑体比强度为

$$
B_\nu(T)=\frac{2h\nu^3}{c^2}
\frac1{\exp(h\nu/k_BT)-1}.
$$

黑体从一面向外半空间的通量是 $\pi B_\nu$。把两面环带相加，发射总光度谱是

$$
L_\nu=4\pi^2\int_{r_{\rm in}}^{r_{\rm out}}rB_\nu[T_{\rm eff}(r)]\,dr.
$$

这个 $L_\nu$ 不是接收端的 $F_\nu$。平直空间、远处距离 $D$、倾角 $i$ 且没有遮挡时，一面平盘给 $F_\nu=(2\pi\cos i/D^2)\int rB_\nu\,dr$；真实黑洞盘还要考虑引力红移、相对论运动、光线弯曲、盘大气和色温修正。

为复算谱形，令 $u=h\nu/(k_BT_*)$、$\theta(y)=T_{\rm eff}/T_*$。本页使用的无量纲谱为

$$
\frac{\nu L_\nu}{L_{\rm N}}
=\frac{45}{\pi^4}u^4
\int_1^Y\frac{y\,dy}{\exp[u/\theta(y)]-1}.
$$

利用 Planck 积分 $\int_0^\infty z^3/(e^z-1)\,dz=\pi^4/15$，对 $\ln\nu$ 再积分，应恢复上一节的有限外半径光度比例。这就是频谱与总能量之间的交叉检查。

**三个频段的条件。** 有限外半径下，足够低频是 Rayleigh–Jeans 的 $L_\nu\propto\nu^2$。在存在足够宽的温度范围、且主要发射环带远离两端时，用 $T\propto r^{-3/4}$，替换变量 $z\propto\nu r^{3/4}$，得到 $r\,dr\propto\nu^{-8/3}z^{5/3}dz$；乘上 Planck 前面的 $\nu^3$，才产生中频的 $\nu^{1/3}$。高频被最高温度控制，进入指数截断。有限盘通常只有近似的中频幂律段；它不是全部频率、全部观测谱都必须满足的“指纹”。

数值积分对每个频率使用同一径向温度与面积权重。为处理内缘的四分之一次温度变化，使用 $\ln y=t^4$，此时 $y\,dy=4t^3e^{2t^4}dt$。积分仍有有限网格误差，低于数值表示范围的 Wien 尾会下溢；这些数值限制不代表真实谱在某个频率突然严格为零。

## 5. 时标：轨道转一圈与向内输运差多少？

竖直静力平衡在 Kepler 薄盘中给 $H\simeq c_s/\Omega$。用 $\nu_{\rm kin}=\alpha c_sH$ 参数化输运，得到

$$
\nu_{\rm kin}\simeq\alpha(H/r)^2r^2\Omega,\qquad
t_{\rm visc}\sim\frac{r^2}{\nu_{\rm kin}}
=\frac1{\alpha(H/r)^2\Omega}.
$$

本页约定 $t_{\rm dyn}=1/\Omega$，轨道周期是 $2\pi/\Omega$；常用热时标估计是 $t_{\rm th}\sim1/(\alpha\Omega)$。当 $H/r\ll1$ 时，黏性时标远长于热时标。$\alpha$ 是有效应力的参数，不是一个适用于所有盘的自然常数。

分子黏性是否足够，要代入具体密度、碰撞截面、温度与尺度计算，不能无条件说“永远差十几个数量级”。许多天体盘需要额外角动量输运；磁应力、磁风、自引力结构等机制的适用范围也不同。

## 6. MRI：先看线性不稳定性，再谈湍流输运

纯流体的局域轴对称 Rayleigh 条件检查 $d\ell^2/dr>0$。Kepler 盘的 $\ell^2=GMr$，满足这个稳定条件；但磁张力能让不同半径的流体交换角动量，因此要重新检查。

在理想 MHD、局域不可压、弱垂直背景磁场、轴对称竖直波数 $k$ 的 Kepler 模型中，径向和方位位移满足

$$
\ddot\xi_x-2\Omega\dot\xi_y
=(3\Omega^2-k^2v_A^2)\xi_x,\qquad
\ddot\xi_y+2\Omega\dot\xi_x=-k^2v_A^2\xi_y.
$$

代入 $e^{-i\omega t}$ 并令行列式为零，取 $q=kv_A/\Omega$，得

$$
\left(\frac{\omega}{\Omega}\right)^4
-(1+2q^2)\left(\frac{\omega}{\Omega}\right)^2
+q^2(q^2-3)=0.
$$

两支平方频率是

$$
\frac{\omega_\pm^2}{\Omega^2}
=\frac{1+2q^2\pm\sqrt{1+16q^2}}2.
$$

当 $0<q<\sqrt3$，低支为负，产生指数增长；$q=0$ 和临界端点是中性边界，不能把它们算作严格增长。对增长率平方求导可得最大值位于 $q=\sqrt{15}/4$，且 $\gamma_{\max}=3\Omega/4$。

这不是“任意弱场、任意尺度都自动湍流”的结论。不稳定波长必须能放进盘的有效尺度，流体近似必须适用，磁场与流体必须充分耦合；电阻、Hall、双极扩散等非理想项会改变结果。线性增长率也不能直接给出非线性饱和的 $\alpha$。

## 7. 喷流：视超光速来自光行时

某团物质以 $v=\beta c<c$ 运动，与视线夹角为 $\theta$。两次发射在源系相隔 $\Delta t$；第二个发射位置更靠近观察者，光程缩短 $\beta c\Delta t\cos\theta$。因而

$$
\Delta t_{\rm arr}=\Delta t(1-\beta\cos\theta),\qquad
\Delta x_\perp=\beta c\Delta t\sin\theta.
$$

用到达时差去除横向位移，得到

$$
\beta_{\rm app}=\frac{\beta\sin\theta}{1-\beta\cos\theta}.
$$

最大值出现在 $\cos\theta=\beta$，为 $\beta_{\rm app,max}=\Gamma\beta=\sqrt{\Gamma^2-1}$。所以测得视超光速可以给 $\Gamma\ge\sqrt{1+\beta_{\rm app}^2}$ 的运动学下界；它不表示物质或信息超光速。

多普勒因子为 $\delta=[\Gamma(1-\beta\cos\theta)]^{-1}$。增亮还取决于频谱、发射区几何和连续流或离散团块的模型，不能给所有喷流套同一个增亮指数；从角位移反推 $\beta_{\rm app}$ 还要使用角直径距离和宇宙学时间膨胀。

### 喷流的能量来源

Blandford–Payne 机制从转动盘的磁离心风出发；Blandford–Znajek 机制通过磁场抽取黑洞总质量能中的转动部分。对 Kerr 黑洞，

$$
M_{\rm irr}=M\sqrt{\frac{1+\sqrt{1-a_*^2}}2},\qquad
E_{\rm rot}=(M-M_{\rm irr})c^2.
$$

理想极端极限的可提取转动能上界约为 $0.293Mc^2$。这不是当前吸积物质的辐射效率：若喷流还在消耗已有自旋能，以新流入物质的 $\dot Mc^2$ 为分母定义的外流效率可以超过 $1$，总能量仍守恒。磁阻滞盘模拟展示过这种情形，不能把模拟中的特定效率当成所有真实源的固定值。[原始数值研究](https://arxiv.org/abs/1108.0412)

## 8. 高能天体分类与多信使证据

| 系统 | 常见中心天体与能量过程 | 还需哪些信息 |
|---|---|---|
| 激变变星 | 白矮星吸积；可伴热核新星 | 表面、磁场、伴星与热核过程 |
| X 射线双星 | 中子星或黑洞；盘、热电子区与喷流 | 光谱、时变、偏振与动力学质量 |
| AGN | 超大质量黑洞吸积 | 倾角、遮挡、喷流方向、流率和环境 |
| GRB | 大质量星塌缩或致密天体并合等通道 | 持续时间以外的超新星、千新星、宿主和引力波证据 |

AGN 的观测角度与遮挡能解释许多类别差异，但不是所有 AGN 差异的唯一参数。GRB 的长短是观测分类，不能与成因一一对应：GRB 211211A 的长持续时间同时伴有千新星证据，支持并合起源。[NASA 观测说明](https://www.nasa.gov/universe/nasa-missions-probe-game-changing-cosmic-explosion/)

**GW170817 的时间线。** 2017 年双中子星并合的引力波之后约 $1.74\pm0.05$ 秒探测到 GRB 170817A，随后光学、红外和其他波段陆续观测到对应体。它们来自关联事件，不是所有信使都在同一时刻到达。

它支持中子星并合至少是一类短 GRB 的来源，千新星提供 r 过程核合成的证据；标准汽笛还可以结合宿主红移测量距离—膨胀关系。单次事件并不自动解决全部 r 过程来源或哈勃常数张力。

**速度检验不是证明严格相等。** 传播速度差与源内发射时差会共同影响到达时差。原研究使用保守距离 $26\ {\rm Mpc}$，并考虑伽马射线相对引力波的发射延迟从 $0$ 到约 $10$ 秒，给出

$$
-3\times10^{-15}\lesssim
\frac{v_{\rm GW}-v_{\rm EM}}{v_{\rm EM}}
\lesssim7\times10^{-16}.
$$

这是带发射时差假设的严格约束，不是实验数学式地证明 $v_{\rm GW}=c$。改变源内延迟假设会改变约束。[LIGO–Virgo–Fermi–INTEGRAL 原论文 §4.1](https://dcc.ligo.org/public/0145/P1700308/008/LIGO-P1700308.pdf)

## 9. 把基础模型推进到研究问题

每一步扩展都要保留能核对的量：把 Newton 通量换成 GR 盘模型后，重新积分到无穷远接收的能量；加入盘大气后，区分有效温度与色温；加入平流和风后，明确流率随半径的变化及辐射、机械与磁能分配；从 MRI 线性模式走向非线性辐射 MHD 时，检查应力、磁通量和数值分辨率，而不是只调一个 $\alpha$ 拟合曲线。

喷流研究还需区分盘与黑洞自旋供能、磁化程度、粒子成分和辐射机制。多信使研究则要把传播模型与源模型一起写进推断。这些问题都以本页的守恒账和适用条件为起点；更复杂的计算不会免除这些检查。

## 10. 完整练习

### 练习 A：盘的两面与能量预算

证明全盘效率为 $1/(2x_{\rm in})$，再算外半径 $4r_{\rm in}$ 以内辐射了多少。最后解释 $x_{\rm in}=6$ 时为何不能混用 Schwarzschild 效率。

<details class="answer" markdown="1"><summary>展开双面积分</summary>

$$
L_{\rm N}
=\frac{3GM\dot M}{2}
\int_{r_{\rm in}}^\infty
\left(r^{-2}-\sqrt{r_{\rm in}}r^{-5/2}\right)dr
=\frac{3GM\dot M}{2}
\left(\frac1{r_{\rm in}}-\frac2{3r_{\rm in}}\right)
=\frac{GM\dot M}{2r_{\rm in}}.
$$

$Y=4$ 时比例为 $1-3/4+2/8=1/2$。$x_{\rm in}=6$ 的 Newton 盘给 $1/12$，GR Schwarzschild 盘给约 $0.05719$；若后者反推流率而前者算通量，积分光度为输入 $L$ 的约 $1.4571$ 倍。解决办法是使用一致的 GR 通量与传输模型，或明确这只是两模型的并列比较，不能把曲线任意归一化掩盖差额。

</details>

### 练习 B：温度峰与黏性时标

求 $T_{\rm eff}$ 的峰位置。再对默认 $10M_\odot,r=10r_g,\alpha=0.01,H/r=0.05$，比较动力学、轨道、热和黏性时标。

<details class="answer" markdown="1"><summary>展开导数与单位</summary>

$$
\frac{T_{\rm eff}^4}{T_*^4}=y^{-3}-y^{-7/2},\qquad
\frac{d}{dy}\left(y^{-3}-y^{-7/2}\right)
=-3y^{-4}+\frac72y^{-9/2}.
$$

导数为零给 $\sqrt y=7/6$，故 $y=49/36$。本例 $GM/c^3\simeq4.9256\times10^{-5}\ {\rm s}$，乘 $10^{3/2}$ 得 $t_{\rm dyn}\simeq0.001558\ {\rm s}$；轨道周期约 $0.009787\ {\rm s}$，热时标约 $0.1558\ {\rm s}$，黏性时标约 $62.30\ {\rm s}$。若 $\alpha$ 加倍，后两者减半；若 $H/r$ 加倍，黏性时标降为四分之一。这里 $1/\Omega$ 不是转一整圈的周期。

</details>

### 练习 C：视超光速与喷流运动

取 $\beta=0.99,\theta=5^\circ$，求 $\Gamma,\delta,\beta_{\rm app}$。如果只测得 $\beta_{\rm app}=6$，可以推出什么？

<details class="answer" markdown="1"><summary>展开到达时差</summary>

分别代入可得 $\Gamma\simeq7.0888$、$\delta\simeq10.2466$、$\beta_{\rm app}\simeq6.2674$。到达时差只占源系发射间隔的 $1-\beta\cos\theta\simeq0.013767$，所以视横向速度可以很大。只知道 $\beta_{\rm app}=6$ 时，有 $\Gamma\ge\sqrt{37}\simeq6.0828$；不能唯一确定 $\beta$ 与 $\theta$，更不能声称物质速度是 $6c$。

</details>

### 练习 D：类星体的流率与观测时差

$L=10^{40}\ {\rm W}$、$\eta=0.1$ 时求流率。另用 $D=26\ {\rm Mpc}$、观测延迟 $1.74\ {\rm s}$，估算发射延迟 $0$ 与 $10\ {\rm s}$ 对速度差的影响。

<details class="answer" markdown="1"><summary>展开量纲与假设</summary>

流率约 $1.1127\times10^{24}\ {\rm kg\,s^{-1}}$，即 $17.7M_\odot/{\rm yr}$。这是由给定效率得到的流入质量，不是把每年这些质量全部转成光。

记 $\Delta t_{\rm em}$ 为源内伽马射线相对引力波的发射延迟，一阶近似为

$$
\frac{\Delta v}{c}
\simeq\frac{c(1.74\ {\rm s}-\Delta t_{\rm em})}{D}.
$$

取 $\Delta t_{\rm em}=0$ 给约 $6.5\times10^{-16}$，取 $10\ {\rm s}$ 给约 $-3.1\times10^{-15}$。考虑测量不确定性并适当取整，得到前述论文约束的量级。观测到达时差本身不足以独立确定源内延迟与传播速度差。

</details>

来源与延伸：[UMD 薄盘能量与光谱讲义](https://www.astro.umd.edu/~richard/ASTR680/A680_Accreting_sources_2019_lec5.pdf)、[NAOJ 局域 MRI 色散与非理想效应讲义](https://sci.nao.ac.jp/MEMBER/kataoka/lecture2023/site/5.%E5%9B%9E%E8%BB%A2%E5%86%86%E7%9B%A4%E3%81%AE%E4%B8%8D%E5%AE%89%E5%AE%9A%E6%80%A7/)。下一页：[星系与暗物质](ap-06-galaxies.html)。
