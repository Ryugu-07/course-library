# 宇宙学 IV · 两种加速时代：inflation 与晚期暗能量

> **对标**：Mukhanov / Ryden §17–20 / Dodelson *Modern Cosmology* ｜ **前置**：cosmo-01（FRW）、cosmo-02（CMB）、cosmo-03（结构增长）、gr-02（能量条件）
> 宇宙在早期可能经历过极快的加速膨胀，而在晚期又出现了加速膨胀。两个阶段都可以让 $q<0$，但这一个符号并不能告诉我们它们是不是同一种物理。我们要先预测可计算的运动学，再问观测到底支持了哪一层解释。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="cosmo-accel-learning-title">

## 学习层：同一个 q，不同的历史

<h2 id="cosmo-accel-learning-title">1. 预测门：加速判据能告诉你多少？</h2>

定义

$$
H=\frac{\dot a}{a},\qquad
q=-\frac{a\ddot a}{\dot a^2},\qquad
\epsilon_H=-\frac{d\ln H}{d\ln a}.
$$

它们满足

$$
q=\epsilon_H-1.
$$

打开实验前先判断：

1. $q<0$ 直接说明了什么？它是否已经证明宇宙处在 inflation，或已经证明存在 $\Lambda$？
2. 恒 $H$ 的早期 toy 走 $N=60$ 个 e-fold 后，共动 Hubble 半径 $(aH)^{-1}$ 的末/初比值是接近 $1$、接近 $e^{60}$，还是接近 $e^{-60}$？
3. 晚期物质加 $\Lambda$ toy 由减速变加速的转折，满足 $\rho_m=\rho_\Lambda$ 还是 $\rho_m=2\rho_\Lambda$？

实验室揭晓后可切换两种模式。**早期恒 $H$ toy** 只规定 $N$ 个 e-fold 的膨胀历史：$q=-1$、$\epsilon_H=0$，而 $(aH)^{-1}$ 按 $e^{-N}$ 缩小。**晚期平直物质加 $\Lambda$ toy** 用 $\Omega_m=0.3,\Omega_\Lambda=0.7$ 计算 $q(a)$；它会从物质主导的减速转向晚期加速。相同的 $q<0$ 只是运动学事实，不自动等于同一种机制。

### 2. 无 JavaScript 时的静态读法

早期模式取 $N=60$，恒 $H$ 意味着

$$
\frac{a_{\rm end}}{a_{\rm start}}=e^{60}
\approx1.1420\times10^{26},
\qquad
\frac{[(aH)^{-1}]_{\rm end}}{[(aH)^{-1}]_{\rm start}}
=e^{-60}\approx8.7565\times10^{-27}.
$$

所以它不是“空间中每个物体以某个固定速度飞走”的图像，而是尺度因子指数增加，导致共动 Hubble 半径急剧缩小。这个 toy 的 $q=-1$、$\epsilon_H=0$ 是输入的恒 $H$ 结果；它没有告诉我们是什么场或修正引力实现了这段历史。

晚期模式的默认输入是 $a=1,\Omega_m=0.3,\Omega_\Lambda=0.7$。实验室用

$$
E(a)=\frac{H(a)}{H_0}
=\sqrt{\Omega_m a^{-3}+\Omega_\Lambda},
\qquad
\Omega_m(a)=\frac{\Omega_m a^{-3}}{E^2(a)}.
$$

在今天的 toy 点，

$$
E(1)=1,\quad \epsilon_H=\frac32\Omega_m(1)=0.45,\quad
q=-0.55,\quad (aH)^{-1}H_0=1.
$$

转折点由 $q=0$ 给出：

$$
\frac32\Omega_m(a_{\rm tr})=1
\quad\Longleftrightarrow\quad
\rho_m(a_{\rm tr})=2\rho_\Lambda,
\qquad
a_{\rm tr}=\left(\frac{\Omega_m}{2\Omega_\Lambda}\right)^{1/3}
\approx0.598408.
$$

因此“物质密度等于暗能量密度”不是加速开始的精确条件；那时仍有 $\rho_m=2\rho_\Lambda$。若切换到纯物质边界 $\Omega_m=1,\Omega_\Lambda=0$，实验室给 $q=0.5$，宇宙仍在减速。

<div class="learning-lab" data-learning-lab="physics-inflation-darkenergy" markdown="1">

**无 JavaScript 时的静态 fallback：**早期恒 $H$ toy 取 $N=60$，得到 $q=-1$、$\epsilon_H=0$、$a_{\rm end}/a_{\rm start}=e^{60}\approx1.1420\times10^{26}$，共动 Hubble 半径末/初为 $e^{-60}\approx8.7565\times10^{-27}$。晚期默认取 $a=1,\Omega_m=0.3,\Omega_\Lambda=0.7$，得到 $E=1$、$\epsilon_H=0.45$、$q=-0.55$、$(aH)^{-1}H_0=1$；加速转折在 $a_{\rm tr}\approx0.598408$，条件是 $\rho_m=2\rho_\Lambda$。

实验室的上下图只比较 $q$ 和共动 Hubble 半径的演化。它们是由输入背景产生的模型输出；超新星距离、BAO、CMB 几何、结构增长和透镜等才是需要与数据比较的观测量。恒 $H$ toy 不是完整 inflation 理论，$\Lambda$ toy 也不是对暗能量微观本性的证明。

</div>

### 3. 观测、推断与失败边界

- **运动学观测/拟合：**从距离、红移和角尺度数据重建或拟合 $H(a)$，可以检验是否存在一段 $q<0$。
- **模型推断：**把平直 $\Lambda$CDM、动态 $w(a)$、标量场或修正引力代入 Friedmann 和扰动方程，才得到某个 $q(a)$、增长率或扰动谱。
- **机制解释：**声称早期加速由某个 inflaton 势产生，或声称晚期加速来自真空能，是比“$q<0$”更强的假设；本 lab 不把它们当作已被一个曲线单独证明的事实。

失败边界也要先说清：恒 $H$ toy 没有 graceful exit、reheating 或微观势；晚期 toy 忽略辐射、重子细节、质量中微子和可能的曲率/修正引力；$H^{-1}$ 或 $(aH)^{-1}$ 是有用的尺度，不等同于完整的粒子视界或事件视界。改变输入参数后，先问是同一个模型的新参数，还是已经跨出了该模型的近似范围。

### 4. 迁移任务

1. 若有人只给出 $q=-0.4$，列出至少三项仍未知的信息：时代、能量成分、扰动谱、是否有 reheating 等。说明为什么一个数字不能单独命名机制。
2. 证明晚期物质加 $\Lambda$ toy 的转折条件 $\rho_m=2\rho_\Lambda$，并比较密度相等点与加速转折点的先后。
3. 令早期模式的 $N$ 从 50 改为 60，计算共动 Hubble 半径再多缩小多少；再说明若 $H$ 不是常数，为什么不能直接写成 $e^{-N}$ 而要积分 $d\ln[(aH)^{-1}]$。

</section>

## 正式讲义：把“加速”拆成运动学、动力学和起源

### 1. 先问可检验的问题

“宇宙在加速”是一个关于 $a(t)$ 二阶导数的陈述；“有暗能量”是一个关于能量预算或引力理论的模型语言；“有 inflation”还包含早期时代、足够的膨胀、退出和扰动初始条件。它们相关，却不是同义词。一个可靠的推理链应是：

$$
\text{距离/角尺度/增长数据}
\longrightarrow H(a)\ \text{或}\ q(a)
\longrightarrow \text{背景模型}
\longrightarrow \text{扰动与起源模型}.
$$

链条越往右，假设越多。学习时最容易犯的错误，是把最后一步的名字写在第一步的数据旁边。

平直 FRW 背景的基本量是

$$
H=\frac{\dot a}{a},\qquad
\frac{\ddot a}{a}=-\frac{4\pi G}{3}(\rho+3p),
$$

在普通 Einstein 引力和各向同性平均下，后一个式子说明负压可以促成加速。把它改写成 $q$ 和 $\epsilon_H$：

$$
q=-\frac{\ddot a}{aH^2},\qquad
\epsilon_H=-\frac{\dot H}{H^2}
=-\frac{d\ln H}{d\ln a},\qquad q=\epsilon_H-1.
$$

因此 $q<0$ 等价于 $\ddot a>0$，这是运动学判据。若背景由一个常数方程状态 $w=p/\rho$ 的流体主导，在标准 GR 中 $\epsilon_H=3(1+w)/2$，加速需要 $w<-1/3$。但把一个有效的 $w$ 叫作“某种粒子”仍需要额外证据。

### 2. 早期 inflation：缩小共动 Hubble 半径

早期加速膨胀的核心几何特征是

$$
\frac{d}{dt}\left(\frac{1}{aH}\right)<0.
$$

定义 e-fold 数

$$
N=\ln\frac{a_{\rm end}}{a_{\rm start}},
$$

若 $H$ 近似常数，便有

$$
\frac{(aH)^{-1}_{\rm end}}{(aH)^{-1}_{\rm start}}\simeq e^{-N}.
$$

一个原来比 Hubble 尺度小的共动模式，可以在 $aH$ 增长时越过 $k=aH$，随后处于“超 Hubble”区间；之后在 reheating 和辐射/物质时代，$aH$ 的演化改变，模式又可能进入。这里的“越过”是尺度比较，不应粗略说成信息以超光速传播。

最常见的可计算候选是慢滚标量场 $\phi$。在最小耦合、标准动能的示意模型中，

$$
\rho_\phi=\frac12\dot\phi^2+V(\phi),\qquad
p_\phi=\frac12\dot\phi^2-V(\phi),
$$

场方程为

$$
\ddot\phi+3H\dot\phi+V_{,\phi}=0.
$$

若势能暂时压过动能，$p_\phi\simeq-\rho_\phi$，便可得到接近 $q=-1$ 的膨胀。常用慢滚参数是

$$
\epsilon_V=\frac{M_{\rm Pl}^2}{2}
\left(\frac{V_{,\phi}}{V}\right)^2,\qquad
\eta_V=M_{\rm Pl}^2\frac{V_{,\phi\phi}}{V},
$$

或直接使用几何参数 $\epsilon_H$。但“慢滚标量场”是候选实现，不是由 $q<0$ 单独推出的唯一实现；非标准动能、多个场和其他早期模型也会产生相似的背景历史。

在一类标准量子涨落计算中，曲率扰动的功率谱有示意关系

$$
\mathcal P_{\mathcal R}(k)
\simeq\frac{H^2}{8\pi^2\epsilon_H M_{\rm Pl}^2}
\bigg|_{k=aH},
$$

谱倾斜则由 $H$ 和慢滚参数随时间的变化决定。这个公式的适用条件包括近似慢滚、真空选择、自由度和引力理论；它不是“所有 inflation 都必然给出同一谱”的定理。CMB 中接近尺度不变的标量谱、各向同性与近高斯性等是对早期模型的约束线索，但从谱到具体势 $V(\phi)$ 仍有退化。

同样，$N$ 也不是一个脱离模型的直接观测数字。哪一个共动尺度对应今天的 pivot scale，取决于 inflation 结束后的 reheating 温度、方程状态和后续热史。因此“需要约若干 e-fold”通常是把几何要求与一套热史假设合并后的推断；实验室用 $N=60$ 只是清晰的数量级例子。

### 3. 晚期加速：物质与 $\Lambda$ 的竞争

对忽略辐射和曲率的平直物质加 $\Lambda$ toy，

$$
E^2(a)=\Omega_m a^{-3}+\Omega_\Lambda,\qquad
\Omega_m+\Omega_\Lambda=1.
$$

因为无压强物质满足 $\rho_m\propto a^{-3}$，而真空样项的密度保持常数，瞬时份额为

$$
\Omega_m(a)=\frac{\Omega_m a^{-3}}{E^2(a)},\qquad
\Omega_\Lambda(a)=\frac{\Omega_\Lambda}{E^2(a)}.
$$

从 $\dot H=-4\pi G(\rho+p)$ 可得

$$
\epsilon_H=\frac32\Omega_m(a),\qquad
q=\frac12\Omega_m(a)-\Omega_\Lambda(a).
$$

于是 $q=0$ 要求

$$
\frac12\rho_m-\rho_\Lambda=0
\quad\Longrightarrow\quad \rho_m=2\rho_\Lambda.
$$

默认 $\Omega_m=0.3,\Omega_\Lambda=0.7$ 时，

$$
a_{\rm tr}=\left(\frac{0.3}{1.4}\right)^{1/3}
=0.598408\ldots,
$$

今天 $a=1$ 的 toy 读数是 $\epsilon_H=0.45$、$q=-0.55$。这说明模型背景正在加速，不等于我们已经在实验室中“看见了 $\Lambda$ 粒子”。$\Lambda$ 是把数据压缩得很有效的一种参数化，也可能与动态暗能量或修正引力在有限数据范围内发生背景退化。

晚期加速的观测链条主要包含：标准烛光给出的距离模量、BAO 的标准尺、CMB 对早期标尺与角距离的约束，以及星系聚类和弱透镜对扰动增长的约束。前几者更直接地约束背景，后者还会检查同一背景下结构如何增长。系统误差、星系偏差、质量校准和模型先验必须纳入推断，不能把一条距离曲线直接翻译成微观机制。

### 4. 为什么两个阶段不能只看 q？

在早期恒 $H$ toy 中，$q=-1$ 伴随共动 Hubble 半径从初始值按 $e^{-N}$ 缩小；在晚期 $\Lambda$ toy 中，$q$ 只在足够晚时变负，而半径的曲线经历了物质时代的另一段演化。即便某个时刻两个模型的 $q$ 相同，以下问题仍不同：

- 它们发生在不同的能量尺度、不同的热史和不同的观测红移；
- 早期模型需要解释初始扰动、退出和 reheating，晚期模型需要解释当前背景、增长和未来渐近行为；
- 同一背景 $H(a)$ 可能由不同的扰动方程产生，反之同一类扰动谱也可能对应不唯一的背景。

$(aH)^{-1}$ 是一个很有用的模式尺度记账工具，但它不是完整的因果边界。粒子视界要积分过去的共形时间，事件视界要积分未来的共形时间；把三者都叫“Hubble horizon”会把几何问题混在一起。

### 5. 证据层级与模型边界

可以把结论分成三层：

1. **数据层**：测量温度/偏振角功率、距离、红移、角位置、形状和相关函数；
2. **背景与扰动层**：在 FRW、引力理论、成分和选择函数下拟合 $H(a)$、$q(a)$、$D(a)$、谱形和透镜响应；
3. **起源层**：选择 inflaton 势、reheating、真空能、动态场或修正引力，并检查它们是否同时解释多个观测。

每上升一层，参数退化与理论先验都增多。比如一个动态 $w(a)$ 模型可能在背景上模仿 $\Lambda$，但在结构增长上不同；修正引力也可能改变 Poisson 方程，使“同一 $H(a)$”不再意味着“同一 $D(a)$”。反过来，若只看背景距离，可能完全看不到这个区别。

因此本讲的结论应写成精确句子：$q<0$ 是加速的运动学判据；恒 $H$ 的 $N$-e-fold toy 展示共动 Hubble 半径如何缩小；平直物质加 $\Lambda$ toy 给出晚期加速及 $\rho_m=2\rho_\Lambda$ 的转折。至于自然界的早期微观机制、暗能量本性或是否需要修改引力，必须由更完整的多探针数据和模型比较继续检验。

### 6. 迁移练习

1. 将一个含辐射、物质、曲率与动态 $w(a)$ 的 $E^2(a)$ 写出，并由 $q=-1-d\ln H/d\ln a$ 判定可能的加速区间。指出每个新成分改变了哪个假设。
2. 取同一今天的 $q=-0.55$，比较一个有效常数 $w$ 流体与修正引力模型。列出至少一个只看背景不够、必须加入结构增长或透镜的观测量。
3. 在慢滚近似下从 $\rho_\phi,p_\phi$ 推出 $\epsilon_H\simeq\epsilon_V$ 的条件；然后说明当动能不再小、多个场参与或 reheating 开始时，哪一步会失效。
4. 画出 $N=50$ 和 $N=60$ 的 $\log_{10}[(aH)^{-1}/(aH)^{-1}_{\rm start}]$，再画出 $\Omega_m=0.3,\Omega_\Lambda=0.7$ 从 $a=0.2$ 到 $5$ 的对应曲线。用图说明“同样 q<0”不能抹掉两个时代的历史差异。
