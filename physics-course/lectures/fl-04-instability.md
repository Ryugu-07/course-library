# 流体 IV · 不稳定性与对流

> **对标**：Drazin & Reid《Hydrodynamic Stability》/ Chandrasekhar / Cross & Hohenberg RMP ｜ **先修**：[连续介质与守恒](fl-01-continuum.html)、[黏性边界](fl-02-viscous.html)、[对称破缺与序参量](asm-01-phase-transitions.html)
> 一层下热上冷的液体何时开始流动？小扰动增长以后是否一定发展成湍流？线性失稳、非线性饱和和充分发展的湍流是不同的问题。本页用 Rayleigh–Bénard（RBC）把一条中性曲线、一个近临界正规形和**真实改变胞格宽度的对流图案**接起来；其余经典失稳则明确写出适用边界。

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="可横向滚动的自由滑移中性曲线与分岔图" style="overflow-x:auto;max-width:100%">
<img src="assets/img/fl-04-instability-bifurcation.svg" alt="自由滑移边界的中性曲线及正规形正负分支" style="display:block;width:100%;min-width:700px">
</div>
<figcaption><span class="fig-id">图 fl-04.1</span>静态图与实验统一采用自由滑移、等温边界：最低中性值为 27π⁴/4≈657.51。右图是选定超临界正规形的正负分支，初始振幅恰为零时仍留在零解；无滑移刚性边界的临界值约 1707.76，属于另一个本征值问题。</figcaption>
</figure>

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="fl-instability-learning-title">

## 学习层：中性曲线怎样选出真实的对流胞

<h3 id="fl-instability-learning-title">1. 先把 RBC 的边界条件钉死</h3>

考虑无限水平层 \(0<z<d\)，下热上冷，温差 \(\Delta T>0\)。近似是 **Boussinesq**：密度只在浮力项中随温度线性变化，其余物性取常数；上下边界等温。Rayleigh 数为

$$
\mathrm{Ra}=\frac{g\alpha\Delta T\,d^3}{\nu\kappa},
$$

其中 \(\nu\) 是运动黏度、\(\kappa\) 是热扩散率。线性化的是静止导热态；水平波数写成 \(k=a/d\)，因此 \(a\) 是无量纲水平波数。无穷水平意味着 \(a\) 可以连续取值，最先失稳的是中性曲线最低点对应的模式。

同样是“等温水平层”，机械边界不同，临界数就不同：

| 机械边界（上下均等温） | 临界数据与读法 |
|---|---|
| 无滑移刚性边界 | \(\mathrm{Ra}_c\approx1707.76\)，\(a_c\approx3.1163\)，\(\lambda_c/d\approx2.016\)；常用实验/刚性容器参考值 |
| 自由滑移边界 | \(\mathrm{Ra}_c=27\pi^4/4\approx657.51\)，\(a_c=\pi/\sqrt2\approx2.2214\)，\(\lambda_c/d=2\sqrt2\approx2.828\)；本互动实验唯一使用的解析模型 |

图 fl-04.1 和实验统一使用第二行；第一行只作边界条件改变后的对照，不混入解析曲线。

<h3>2. 自由滑移解析中性曲线与符号正确的 \(\mu\)</h3>

用层厚 $d$、热扩散时间 $d^2/\kappa$、速度 $\kappa/d$ 和温差 $\Delta T$ 无量纲化。这里 $\kappa$ 是**热扩散率**（$\mathrm{m^2/s}$），$\mathrm{Pr}=\nu/\kappa$。静止导热态的温度随 $z$ 线性下降；扰动温度 $\theta$ 与速度满足

$$
\partial_t\mathbf u=-\nabla p+\mathrm{Pr}\Delta\mathbf u
+\mathrm{Ra}\,\mathrm{Pr}\,\theta\hat{\mathbf z},\qquad
\partial_t\theta=w+\Delta\theta,\qquad\nabla\cdot\mathbf u=0.
$$

温度方程中的 $+w$ 来自上升流携带较热的流体，黏性与热扩散分别削弱速度和温度扰动。取动量方程的双旋度以消去压力，再取竖直分量：

$$\partial_t\Delta w=\mathrm{Pr}\Delta^2w+\mathrm{Ra}\,\mathrm{Pr}\Delta_h\theta.$$

上下自由滑移且不可穿透要求 $w=\partial_z^2w=0$，等温要求 $\theta=0$。因而可以取 $w=W(t)\sin(\pi z)\cos(ax)$、$\theta=\Theta(t)\sin(\pi z)\cos(ax)$。记 $Q=a^2+\pi^2$，代入得真实的**线性二模系统**

$$
\frac{\mathrm d}{\mathrm dt}\begin{pmatrix}W\\\Theta\end{pmatrix}
=\begin{pmatrix}-\mathrm{Pr}Q&\mathrm{Pr}\mathrm{Ra}a^2/Q\\1&-Q\end{pmatrix}
\begin{pmatrix}W\\\Theta\end{pmatrix}.
$$

其增长率满足

$$
(\sigma+\mathrm{Pr}Q)(\sigma+Q)=\frac{\mathrm{Pr}\mathrm{Ra}a^2}{Q},\qquad
\sigma_\pm=-\frac{(\mathrm{Pr}+1)Q}{2}
\pm\frac12\sqrt{(\mathrm{Pr}-1)^2Q^2+\frac{4\mathrm{Pr}\mathrm{Ra}a^2}{Q}}.
$$

$\mathrm{Pr}>0,\mathrm{Ra}>0$ 时根为实数，$\sigma_-<0$。令另一个根为零，得到

$$\mathrm{Ra}_N(a)=\frac{(a^2+\pi^2)^3}{a^2}.$$

对于第 $n\ge1$ 垂直模，把 $\pi^2$ 换为 $n^2\pi^2$；最低门槛出现在 $n=1$。这说明中性曲线的来源，也说明它只约束线性起始阶段。

令 \(q=a^2\)，则

$$
\frac{\mathrm d\mathrm{Ra}_N}{\mathrm dq}
 =\frac{(q+\pi^2)^2(2q-\pi^2)}{q^2},
\qquad
q_c=\frac{\pi^2}{2},
$$

从而

$$
a_c=\frac{\pi}{\sqrt2},\qquad
\mathrm{Ra}_c=\mathrm{Ra}_N(a_c)=\frac{27\pi^4}{4}.
$$

为把“当前 \(a\) 模式离中性线有多远”写成一个符号正确、无量纲的教学量，实验定义

$$
\mu=\frac{\mathrm{Ra}}{\mathrm{Ra}_N(a)}-1.
$$

\(\mu>0\) 表示该波数在这个近临界模型中位于不稳定一侧，\(\mu<0\) 表示位于稳定一侧。它是近临界控制量/增长倾向的代理，**不是有物理单位的精确增长率**；上面的 $\sigma_+$ 是该自由滑移第一垂直模的线性增长率，时间单位为 $d^2/\kappa$；换回秒需乘 $\kappa/d^2$。实验加入 Pr 控制直接计算它。近临界时 $\sigma_+\approx[\mathrm{Pr}Q/(1+\mathrm{Pr})]\mu$，因此 $\mu$ 与 $\sigma_+$ 同号，却不是同一个数。

<h3>3. 动手实验：同一中性判据，右图真的重画胞格</h3>

先点四个预设，再拖动 \(\mathrm{Ra}\)、\(a\)、初始振幅 \(A_0\)、Prandtl 数与正规形进度 \(\tau\)。左/上图标出 \(\mathrm{Ra}_N(a)\)、当前点和最低点；右/下图在固定的 \(L/d=10\) 水平窗口内构造

$$
\psi=A\sin(\pi z)\sin(ax),\qquad
u=\frac{\partial\psi}{\partial z},\qquad
w=-\frac{\partial\psi}{\partial x}.
$$

这里 \(x,z\) 已用 \(d\) 无量纲化。为让热冷方向与速度符号一致，图中还用
\(\theta'\propto-A\sin(\pi z)\cos(ax)\) 做符号示意：\(w>0\) 的区域标为热上升，\(w<0\) 的区域标为冷下降。改变 \(a\) 会同时改变 \(\lambda/d=2\pi/a\)、零点分割和固定窗口内的胞数，而不是只让一条曲线换个位置。竖直方向为看清胞格而放大，箭头先按横纵坐标比例变换，再把长度归一化，所以仍与屏幕上的流线相切。热冷阴影只表达符号，未标定温差大小；改变振幅符号会反转流动方向与热冷区。

实验的幅度演化使用选定的超临界近临界正规形

$$
\frac{\mathrm dA}{\mathrm d\tau}=\mu A-gA^3,\qquad g=1.2,
\qquad
A_\infty=\begin{cases}\operatorname{sgn}(A_0)\sqrt{\mu/g},&\mu>0,\ A_0\ne0,\\0,&\mu\le0\ \text{或}\ A_0=0.\end{cases}
$$

\(\tau\) 只是模型时间的记号；若把它写成 \(t\)，同一条式子就是
\(\mathrm dA/\mathrm dt=\mu A-gA^3\)。它描述的是选定的超临界近临界情形，
不是所有 RBC 装置的普适全局动力学。

\(A\) 与 \(\tau\) 都是教学归一化变量；\(A_\infty\) 是这个正规形的饱和值，不是任意 RBC 装置的普适全局饱和值。实验用该方程的解析解画 $A(\tau)$。Pr 滑块改变上文的线性 $\sigma_+$，但这里的 $\tau$ 是重新归一化的正规形时间，所以此曲线不会随 Pr 自动改变；不能把两个时钟混为一谈。

令 $q_A=A^2$，则 $q_A'=2\mu q_A-2gq_A^2$，分离变量可得

$$
A(\tau)=\begin{cases}
\displaystyle\frac{A_0e^{\mu\tau}}{\sqrt{1+(gA_0^2/\mu)(e^{2\mu\tau}-1)}},&\mu\ne0,\\[6pt]
\displaystyle\frac{A_0}{\sqrt{1+2gA_0^2\tau}},&\mu=0.
\end{cases}
$$

分子保留 $A_0$ 的符号。即使 $\mu>0$，初值恰为零也始终为零；“不稳定”意味着附近扰动会增长，不意味着无扰动的确定性解会自行离开。临界时非零振幅按 $\tau^{-1/2}$ 衰减，不能把显示上四舍五入的微小 $\mu$ 当成精确零。

<div class="learning-lab" data-learning-lab="rayleigh-benard" markdown="1">

**无 JavaScript 时的静态读法：**只使用自由滑移解析式
\(\mathrm{Ra}_N(a)=(a^2+\pi^2)^3/a^2\)，其最低点为
\((a_c,\mathrm{Ra}_c)=(\pi/\sqrt2,27\pi^4/4)\approx(2.2214,657.51)\)。
\(\mu=\mathrm{Ra}/\mathrm{Ra}_N(a)-1\) 的正负决定所选波数模式在此教学模型中位于中性线哪一侧；\(\lambda/d=2\pi/a\) 决定固定 \(L/d=10\) 窗口内胞格的尺度与数量。流线与速度由
\(\psi=A\sin(\pi z)\sin(ax)\)、\(u=\partial_z\psi\)、\(w=-\partial_x\psi\) 构造。

| 预设 | \(\mathrm{Ra}\) | \(a\) | 读图 |
|---|---:|---:|---|
| 亚临界衰减 | \(500\) | \(\pi/\sqrt2\) | \(\mathrm{Ra}<657.51\)，\(\mu<0\)，\(A\) 衰减 |
| 临界模式 | \(27\pi^4/4\) | \(\pi/\sqrt2\) | \(\mu=0\)，只剩三次项的缓慢衰减 |
| 超临界选模 | \(900\) | \(\pi/\sqrt2\) | 最低点附近 \(\mu>0\)，\(A\) 趋向 \(\sqrt{\mu/1.2}\) |
| 离开最优波数后重新稳定 | \(900\) | \(4.4\) | 虽然 \(\mathrm{Ra}>657.51\)，但该 \(a\) 的 \(\mathrm{Ra}_N(a)>900\)，所以 \(\mu<0\) |

振幅 $A$ 是无量纲教学归一化，$\mu$ 不是精确增长率。默认 Pr=7、Ra=900、$a=\pi/\sqrt2$ 时，上述线性系统给 $\sigma_+\approx4.59878$，而 $\mu\approx0.368798$。两者使用不同的时间归一化。

</div>

<h3>4. 模式选择：为什么近 onset 先看到 rolls</h3>

在理想 Boussinesq、近临界、上下对称的设置中，平移/反射等对称性使一组平行 **rolls**（滚筒状对流胞）成为最直接的首选分支。六边形（hexagons）并非“同一条自由滑移曲线必然选出的图案”：它通常需要非 Boussinesq 效应、上下不对称、温度依赖物性或其他额外的对称性破缺来允许相应耦合。继续升高 \(\mathrm{Ra}\) 后，rolls 的失稳、振荡、侧带、缺陷和混沌路线依赖几何、边界、Prandtl 数 \(\mathrm{Pr}\) 与扰动；不能把“倍周期”写成所有 RBC 装置的必然路线。Lorenz 三模方程是一个重要截断模型，不是所有高 \(\mathrm{Ra}\) 对流的全球动力学定理。

<h3>5. 迁移题：改变边界、波数与初值</h3>

1. 换成上下无滑移刚性边界后，能否继续使用 $657.51$ 和 $\sin(\pi z)$ 模式？
2. Ra=900、$a=4.4$ 时为什么所选模式衰减，而系统仍存在不稳定模式？
3. $\mu>0$ 时，把正初值减半、变号、或精确设成零，长期极限分别怎样改变？Pr 改变时，$\sigma_+$ 与正规形曲线是否一定同步改变？

<details class="answer" markdown="1">
<summary>展开推导与答案</summary>

1. 不能。刚性边界还要求切向速度为零，竖直模需满足 $w=\partial_zw=0$；$\sin(\pi z)$ 的边界导数不为零。必须重解本征问题，才得到 $\mathrm{Ra}_c\approx1707.76$、$a_c\approx3.1163$。
2. $\mathrm{Ra}_N(4.4)\approx1289.922>900$，故 $\mu\approx-0.302283$。但最低点的中性值只有 $657.511\ldots$，所以其附近模式仍会增长；“这个波数稳定”不等于“所有扰动稳定”。
3. 任意非零正初值趋于 $+\sqrt{\mu/g}$，减半只改变瞬态；负初值趋于负分支；零初值永远保持零。真实装置的噪声可提供扰动，但本实验没有加噪声。Pr 改变线性二模系统的增长时间；选定正规形使用自己的 $\tau$，本实验固定其 $\mu,g$ 时曲线不变，不能把该不变性误认为物理增长率与 Pr 无关。

</details>

</section>

## 1. 线性稳定性分析：标准流程

给定基本流 \(\bar{\mathbf u}\)，加小扰动并作 Fourier/本征模分解，例如
\(\mathbf u'\propto e^{ikx+\sigma t}\)。线性化 Navier–Stokes 与能量方程后，求本征值 \(\sigma(k)\)：

$$
\operatorname{Re}\sigma>0\Longrightarrow\text{指数增长},\qquad
\operatorname{Re}\sigma=0\Longrightarrow\text{中性},\qquad
\operatorname{Re}\sigma<0\Longrightarrow\text{线性衰减}.
$$

中性曲线是参数空间中 \(\operatorname{Re}\sigma=0\) 的集合；其最低点通常给出最先失稳的控制参数和最偏好的尺度。但“最低点选出哪个模式”仍要连同边界、几何、非线性耦合和扰动来源一起读，不能把一条曲线当作完整的全局动力学。

## 2. Rayleigh–Bénard：图案形成的原型

下热上冷时，浮力驱动上升，黏性和热扩散阻碍运动。RBC 的经典之处不是只有一个临界数，而是同一问题同时展示了：

- **自发对称破缺**：均匀导热态失稳后，水平平移对称被选定的波数和相位打破；
- **尺度选择**：自由滑移解析曲线的最低点在 \(a_c=\pi/\sqrt2\)，而刚性边界的标准参考值在 \(a_c\approx3.1163\)；
- **正规形**：在选定的超临界、近 onset 分支上，\(A\) 的平方根标度来自 \(dA/d\tau=\mu A-gA^3\)，但这不是所有装置的普适远离临界动力学；
- **模式竞争**：Boussinesq 对称性近 onset 倾向 rolls，hexagons 与后续转捩需要额外条件，路线取决于 \(\mathrm{Pr}\)、几何和边界。

因此，\(\mathrm{Ra}>\mathrm{Ra}_c\) 的意思首先是“至少有一类波数进入不稳定侧”，不是“任意预先选定的 \(a\) 都会长大”。

## 3. 几种经典失稳机制

| 机制 | 驱动 | 判据/适用边界 |
|---|---|---|
| **Kelvin–Helmholtz** | 速度剪切 | “任意小波长不稳定”只对理想无粘、零厚度涡片且忽略重力、表面张力和有限剪切层等正规化时成立；真实界面会被这些效应截断或改变 |
| **Rayleigh–Taylor** | 重流体在轻流体之上 | 浮力倒置导致指进；增长谱会受黏性、表面张力、有限厚度和几何影响 |
| **Rayleigh–Plateau** | 表面张力 | 理想无限圆柱、轴对称扰动下，液柱在 \(\lambda>2\pi R\) 的长波段倾向断裂成液滴 |
| **Taylor–Couette** | 旋转离心 | 同轴筒间出现 Taylor 涡，是研究分岔与模式竞争的经典实验台 |
| **Rayleigh 旋转判据** | 角动量分布 | \(d(r^2\Omega)^2/dr<0\) 的判据限定于无粘、轴对称扰动；不能直接替代磁化盘的判据 |
| **磁旋转不稳定（MRI）** | 磁张力与差分旋转 | 在局域、理想MHD、竖直背景磁场和轴对称竖直波数的经典模型中，需有 $0<k_z^2v_A^2<-\mathrm d\Omega^2/\mathrm d\ln r$ 的可用波段；几何、磁扩散与场强都会限制失稳 |

这里 $v_A=B/\sqrt{\mu_0\rho}$ 是 Alfvén 速度，$k_z$ 是竖直波数。经典谱中磁张力太强也会稳定短波，所以“有弱场且角速度下降”仍须检查系统是否容纳相应波段。

尤其不要把 Rayleigh 判据和 MRI 写成同一个结论：MRI 依赖磁场耦合，即使角动量分布满足无粘轴对称判据，也可能通过另一条磁流体谱失稳。

## 4. 转捩：线性稳定不等于任意条件下必然层流

对于理想直圆管中的充分发展 Newtonian Hagen–Poiseuille 基流，经典谱计算支持其线性稳定；实验仍可在有限振幅扰动下发生亚临界转捩。这里引用数值与实验结论，不把有限参数谱扫描宣称为所有 Reynolds 数的数学证明。工程上常引用 \(\mathrm{Re}\sim2000\) 作为量级提示，而不是材料常数或普适阈值：入口长度、粗糙度、弯头、来流噪声、扰动幅度和测量判据都会改变观察到的转捩位置。

矛盾由两层机制化解：

- 非正规线性算子可在所有本征值衰减时产生很大的瞬态放大；
- 被放大的有限扰动进入非线性自维持结构，才可能走向湍流。

所以“线性稳定”只排除了无穷小扰动的指数失稳，不能保证任意 \(\mathrm{Re}\)、任意入口条件和任意扰动下都保持可观察的层流。

## 5. 练习与要点

**例 1（对流胞尺度）** 一层 \(1\,\mathrm{cm}\) 厚的水，\(\Delta T=5\,\mathrm K\) 时，取量级物性 $\alpha=2.1\times10^{-4}\,\mathrm{K^{-1}}$、$\nu=10^{-6}\,\mathrm{m^2/s}$、$\kappa=1.4\times10^{-7}\,\mathrm{m^2/s}$ 与 $g=9.81\,\mathrm{m/s^2}$，得到 $\mathrm{Ra}\approx7.36\times10^4$；实际锅内还会受自由表面、侧壁和物性变化影响，不能把它当成无限水平自由滑移精确实验。

**例 2（地幔对流）** 地幔模型中常见的是**动力黏度**
\(\eta\approx10^{21}\,\mathrm{Pa\,s}\)，不是运动黏度。二者关系是

$$
\nu=\frac{\eta}{\rho},\qquad [\eta]=\mathrm{Pa\,s},\qquad [\nu]=\mathrm{m^2\,s^{-1}}.
$$

把 \(\eta\) 直接写进 \(\nu\) 的位置会造成单位错误；地幔 Rayleigh 数还要结合 \(\rho,\kappa,\alpha,\Delta T,d\) 与有效黏度的温压依赖估算。虽然 \(d^3\) 很大、对流时间尺度约为百万至亿年，但这不意味着可以忽略黏度模型。

**例 3（RT 不稳定与聚变）** 惯性约束聚变压缩时，轻流体推动重流体会激发 Rayleigh–Taylor 指进，破坏燃料层的对称压缩；抑制并预测有限厚度、黏性和界面扰动下的增长，是工程核心难题之一。 \(\blacksquare\)

---

## 原始来源与后续

- [Tong《Fluid Mechanics》§5.3.2](https://www.damtp.cam.ac.uk/user/tong/fluids/fluids.pdf)：Boussinesq 线性化、自由滑移边界与色散关系。该书用热导参数除以热容表达扩散率，本文统一记为 $\kappa$。
- [Meseguer 与 Trefethen：Linearized pipe flow to Reynolds number 10⁷](https://people.maths.ox.ac.uk/trefethen/publication/PDF/2003_104.pdf)：圆管线性谱计算，注意数值计算范围与一般定理的区别。
- [Balbus 与 Hawley：Instability, turbulence, and enhanced transport in accretion disks](https://courses.physics.ucsd.edu/2020/Winter/physics116/Balbus_Hawley_RMP.pdf)：经典理想MHD的MRI色散关系与波段条件。
- [Cross 与 Hohenberg：Pattern formation outside of equilibrium](https://doi.org/10.1103/RevModPhys.65.851)：弱非线性正规形和模式竞争的综述来源。

下一页：[确定性混沌与 Lorenz 模型](fl-05-chaos.html)。从线性增长到饱和，再到多个自由度之间的非线性反馈。
