# 流体 IV · 不稳定性与对流

> **对标**：Drazin & Reid《Hydrodynamic Stability》/ Chandrasekhar / Cross & Hohenberg RMP ｜ **前置**：fl-01、asm-01（对称破缺与序参量）
> 湍流不是凭空出现的，而是层流在扰动、几何和非线性共同作用下可能到达的失稳终点。本页用 Rayleigh–Bénard（RBC）把一条中性曲线、一个近临界正规形和**真实改变胞格宽度的对流图案**接起来；其余经典失稳则明确写出适用边界。

<figure class="plot" markdown="1">
![Rayleigh–Bénard 对流的分岔图与临界 Rayleigh 数。](assets/img/fl-04-instability-bifurcation.svg)
<figcaption><span class="fig-id">图 fl-04.1</span>这张静态分岔图采用上下<strong>无滑移刚性边界</strong>的参考临界值 \(\mathrm{Ra}_c\approx1707.76\)，所以 \(A\propto\sqrt{\mathrm{Ra}-\mathrm{Ra}_c}\) 只是近临界超临界分岔的示意。下面的互动实验<strong>明确只采用自由滑移边界的解析中性曲线</strong>，两种边界条件不可混用。</figcaption>
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

因此，图 fl-04.1 的 \(1707.76\) 不能被拿来替换实验中的自由滑移临界值。下面的“中性曲线”也不是刚性边界的拟合，而是自由滑移解析解。

<h3>2. 自由滑移解析中性曲线与符号正确的 \(\mu\)</h3>

自由滑移、等温边界下，取第一垂直模 \(\sin(\pi z/d)\)，线性稳定性给出

$$
\mathrm{Ra}_N(a)=\frac{(a^2+\pi^2)^3}{a^2}.
$$

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

\(\mu>0\) 表示该波数在这个近临界模型中位于不稳定一侧，\(\mu<0\) 表示位于稳定一侧。它是近临界控制量/增长倾向的代理，**不是有物理单位的精确增长率**；真正的线性增长率还要由带 \(\nu,\kappa,\mathrm{Pr}\) 和边界条件的线性化 Boussinesq 本征值问题给出。

<h3>3. 动手实验：同一中性判据，右图真的重画胞格</h3>

先点四个预设，再拖动 \(\mathrm{Ra}\)、\(a\)、初始振幅 \(A_0\) 和演化进度 \(\tau\)。左/上图标出 \(\mathrm{Ra}_N(a)\)、当前点和最低点；右/下图在固定的 \(L/d=10\) 水平窗口内构造

$$
\psi=A\sin(\pi z)\sin(ax),\qquad
u=\frac{\partial\psi}{\partial z},\qquad
w=-\frac{\partial\psi}{\partial x}.
$$

这里 \(x,z\) 已用 \(d\) 无量纲化。为让热冷方向与速度符号一致，图中还用
\(\theta'\propto-A\sin(\pi z)\cos(ax)\) 做符号示意：\(w>0\) 的区域标为热上升，\(w<0\) 的区域标为冷下降。改变 \(a\) 会同时改变 \(\lambda/d=2\pi/a\)、零点分割和固定窗口内的胞数，而不是只让一条曲线换个位置。箭头方向由速度场决定，箭头长度为了可读性做了归一化。

实验的幅度演化使用选定的超临界近临界正规形

$$
\frac{\mathrm dA}{\mathrm d\tau}=\mu A-gA^3,\qquad g=1.2,
\qquad
A_\infty=\sqrt{\max(\mu/g,0)}.
$$

\(\tau\) 只是模型时间的记号；若把它写成 \(t\)，同一条式子就是
\(\mathrm dA/\mathrm dt=\mu A-gA^3\)。它描述的是选定的超临界近临界情形，
不是所有 RBC 装置的普适全局动力学。

\(A\) 与 \(\tau\) 都是教学归一化变量；\(A_\infty\) 是这个正规形的饱和值，不是任意 RBC 装置的普适全局饱和值。实验用该方程的确定性解析解画 \(A(\tau)\)，不抽随机数，也不把它冒充精确的物理增长率。

<div class="learning-lab" data-learning-lab="rayleigh-benard" markdown="1">

**无 JavaScript 时的静态读法：**只使用自由滑移解析式
\(\mathrm{Ra}_N(a)=(a^2+\pi^2)^3/a^2\)，其最低点为
\((a_c,\mathrm{Ra}_c)=(\pi/\sqrt2,27\pi^4/4)\approx(2.2214,657.51)\)。
\(\mu=\mathrm{Ra}/\mathrm{Ra}_N(a)-1\) 的正负决定所选波数模式在此教学模型中位于中性线哪一侧；\(\lambda/d=2\pi/a\) 决定固定 \(L/d=10\) 窗口内胞格的尺度与数量。流线与速度由
\(\psi=A\sin(\pi z)\sin(ax)\)、\(u=\partial_z\psi\)、\(w=-\partial_x\psi\) 构造。

| 预设 | \(\mathrm{Ra}\) | \(a\) | 读图 |
|---|---:|---:|---|
| 亚临界衰减 | \(500\) | \(\pi/\sqrt2\) | \(\mathrm{Ra}<657.51\)，\(\mu<0\)，\(A\) 衰减 |
| 临界模式 | \(657.51\) | \(\pi/\sqrt2\) | \(\mu=0\)，只剩三次项的缓慢衰减 |
| 超临界选模 | \(900\) | \(\pi/\sqrt2\) | 最低点附近 \(\mu>0\)，\(A\) 趋向 \(\sqrt{\mu/1.2}\) |
| 离开最优波数后重新稳定 | \(900\) | \(4.4\) | 虽然 \(\mathrm{Ra}>657.51\)，但该 \(a\) 的 \(\mathrm{Ra}_N(a)>900\)，所以 \(\mu<0\) |

振幅 \(A\) 是无量纲教学归一化，不是以米、秒或温度计量的装置振幅；\(\mu\) 也不是带单位的精确增长率。

</div>

<h3>4. 模式选择：为什么近 onset 先看到 rolls</h3>

在理想 Boussinesq、近临界、上下对称的设置中，平移/反射等对称性使一组平行 **rolls**（滚筒状对流胞）成为最直接的首选分支。六边形（hexagons）并非“同一条自由滑移曲线必然选出的图案”：它通常需要非 Boussinesq 效应、上下不对称、温度依赖物性或其他额外的对称性破缺来允许相应耦合。继续升高 \(\mathrm{Ra}\) 后，rolls 的失稳、振荡、侧带、缺陷和混沌路线依赖几何、边界、Prandtl 数 \(\mathrm{Pr}\) 与扰动；不能把“倍周期”写成所有 RBC 装置的必然路线。Lorenz 三模方程是一个重要截断模型，不是所有高 \(\mathrm{Ra}\) 对流的全球动力学定理。

<h3>5. 迁移题：换条件时，哪些结论还能搬过去？</h3>

1. 若把实验换成无滑移刚性边界，能否仍用 \(\mathrm{Ra}_N=(a^2+\pi^2)^3/a^2\) 和 \(657.51\)？
   **不能。** 这条解析曲线属于自由滑移模型；刚性边界的临界数据是 \(\mathrm{Ra}_c\approx1707.76\)、\(a_c\approx3.1163\)、\(\lambda_c/d\approx2.016\)，需要相应的刚性边界本征值问题。
2. 在实验中取 \(\mathrm{Ra}=900\)、\(a=4.4\)，为什么整体已经高于自由滑移最低临界值，却仍可“重新稳定”？
   因为临界值是对所有 \(a\) 的最小值；固定的这个模式要比较 \(900\) 与 \(\mathrm{Ra}_N(4.4)\)。若后者更大，则 \(\mu<0\)，只是该波数重新稳定，其他更接近 \(a_c\) 的模式仍可能不稳定。
3. 在 \(\mu>0\) 时把 \(A_0\) 减半，会不会改变 \(A_\infty\)？
   **在这条正规形内不会。**它改变的是到达饱和值的确定性瞬态；\(A_\infty=\sqrt{\mu/g}\) 由 \(\mu,g\) 决定。真实装置若存在噪声、缺陷或多个竞争模，选模历史会更复杂。

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
| **Rayleigh–Plateau** | 表面张力 | 液柱在 \(\lambda>2\pi R\) 的长波段倾向断裂成液滴 |
| **Taylor–Couette** | 旋转离心 | 同轴筒间出现 Taylor 涡，是研究分岔与模式竞争的经典实验台 |
| **Rayleigh 旋转判据** | 角动量分布 | \(d(r^2\Omega)^2/dr<0\) 的判据限定于无粘、轴对称扰动；不能直接替代磁化盘的判据 |
| **磁旋转不稳定（MRI）** | 磁张力与差分旋转 | 弱磁场可使 \(d\Omega/dr<0\) 的磁化盘失稳，是与无粘 Rayleigh 判据不同的机制 |

尤其不要把 Rayleigh 判据和 MRI 写成同一个结论：MRI 依赖磁场耦合，即使角动量分布满足无粘轴对称判据，也可能通过另一条磁流体谱失稳。

## 4. 转捩：线性稳定不等于任意条件下必然层流

理想圆管中的 Hagen–Poiseuille 基流对无穷小扰动是经典线性稳定的，但实验中仍能在有限振幅扰动下发生亚临界转捩。工程上常引用 \(\mathrm{Re}\sim2000\) 作为量级提示，而不是材料常数或普适阈值：入口长度、粗糙度、弯头、来流噪声、扰动幅度和测量判据都会改变观察到的转捩位置。

矛盾由两层机制化解：

- 非正规线性算子可在所有本征值衰减时产生很大的瞬态放大；
- 被放大的有限扰动进入非线性自维持结构，才可能走向湍流。

所以“线性稳定”只排除了无穷小扰动的指数失稳，不能保证任意 \(\mathrm{Re}\)、任意入口条件和任意扰动下都保持可观察的层流。

## 5. 练习与要点

**例 1（对流胞尺度）** 一层 \(1\,\mathrm{cm}\) 厚的水，\(\Delta T=5\,\mathrm K\) 时，使用室温水的量级物性可得 \(\mathrm{Ra}\) 远高于 \(10^3\) 的临界量级；实际锅内还会受自由表面、侧壁和物性变化影响，不能把它当成无限水平自由滑移精确实验。

**例 2（地幔对流）** 地幔模型中常见的是**动力黏度**
\(\eta\approx10^{21}\,\mathrm{Pa\,s}\)，不是运动黏度。二者关系是

$$
\nu=\frac{\eta}{\rho},\qquad [\eta]=\mathrm{Pa\,s},\qquad [\nu]=\mathrm{m^2\,s^{-1}}.
$$

把 \(\eta\) 直接写进 \(\nu\) 的位置会造成单位错误；地幔 Rayleigh 数还要结合 \(\rho,\kappa,\alpha,\Delta T,d\) 与有效黏度的温压依赖估算。虽然 \(d^3\) 很大、对流时间尺度约为百万至亿年，但这不意味着可以忽略黏度模型。

**例 3（RT 不稳定与聚变）** 惯性约束聚变压缩时，轻流体推动重流体会激发 Rayleigh–Taylor 指进，破坏燃料层的对称压缩；抑制并预测有限厚度、黏性和界面扰动下的增长，是工程核心难题之一。 \(\blacksquare\)

---

*下一页：失稳之后是什么？Lorenz 从对流方程截出三个模，展示确定性系统中的不可预测——混沌。*
