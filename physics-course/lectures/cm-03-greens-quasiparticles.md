# 凝聚态 III · 格林函数、谱函数与准粒子寿命

> **对标**：Mahan《Many-Particle Physics》/ Altland & Simons §4 / Fetter & Walecka ｜ **前置**：cm-01、cm-02、qm-04
> 实验上看到的是一条有宽度的能谱峰，而不是“某个粒子正在这里”。本页用 retarded Green function 把三件事接起来：因果传播、谱函数的峰形、以及准粒子的有限寿命。峰的位置是能量，峰的宽度是衰减尺度；二者不能混成同一个“能量不确定度”口号。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="greens-quasiparticle-learning-title">

<h2 id="greens-quasiparticle-learning-title">学习层：一条谱峰究竟告诉你什么？</h2>

### 1. 先预测：窄峰、宽峰与“粒子寿命”

光电子谱、隧穿谱或中子散射常把信号画成能量 $E$ 的函数。请在打开实验前判断：

1. 把半宽 $\Gamma$ 加倍，谱峰的全宽半高（FWHM）怎样变？峰顶高度怎样变？
2. 如果谱函数来自一个单一 pole，它在整个能量轴上的面积会不会随 $\Gamma$ 改变？
3. 在本页约定下，振幅包络 $e^{-\Gamma t/\hbar}$ 与概率包络 $e^{-2\Gamma t/\hbar}$ 的时间尺度哪个更短？
4. retarded propagator 在 $t<0$ 是否可以响应一个尚未施加的扰动？

这里的 $\Gamma$ 是**能量单位的半宽**，不是频率。先把“峰宽”和“寿命”放进同一套单位账，才能判断一条峰是长寿命准粒子、短寿命激发，还是根本没有清晰 pole。

### 2. 最小可算模型：一个带自能的 retarded pole

固定某个动量 $k$，把准粒子的重整化能量记为 $\varepsilon_k$。在忽略能量依赖自能的窄峰近似中，写

$$
G^R(k,E)=\frac{1}{E-\varepsilon_k-\Sigma^R(k,E)}
\simeq \frac{1}{E-\varepsilon_k+i\Gamma}.
$$

谱函数定义为

$$
A(k,E)=-\frac{1}{\pi}\operatorname{Im}G^R(k,E)
=\frac{1}{\pi}\frac{\Gamma}{(E-\varepsilon_k)^2+\Gamma^2}.
$$

它不是“粒子在能量上的概率密度”的无条件替代，而是单粒子添加/移除谱的响应权重；在本单 pole 模型中它满足严格的谱权重和规则

$$
\int_{-\infty}^{\infty}A(k,E)\,dE=1.
$$

峰顶为 $A(k,\varepsilon_k)=1/(\pi\Gamma)$，半高点在 $|E-\varepsilon_k|=\Gamma$，所以

$$
\mathrm{FWHM}=2\Gamma.
$$

### 3. 时间域桥：同一个 $\Gamma$ 如何变成寿命？

采用能量 Fourier 约定 $G^R(E)=\int_{-\infty}^{\infty}dt\,e^{iEt/\hbar}G^R(t)$；对逆变换的 $E$ 积分，在 $t>0$ 时闭合到 retarded 的下半平面，pole $E=\varepsilon_k-i\Gamma$ 给出

$$
G^R(k,t)=-\frac{i}{\hbar}\,\theta(t)\exp\left(-\frac{i\varepsilon_k t}{\hbar}\right)
\exp\left(-\frac{\Gamma t}{\hbar}\right).
$$

因此本页明确采用两种时间标度：

$$
\tau_{\rm amp}=\frac{\hbar}{\Gamma},
\qquad
\tau_{\rm pop}=\frac{\hbar}{2\Gamma}.
$$

第一项是传播振幅衰减到 $e^{-1}$ 的时间，第二项是 $|G^R|^2$ 这种概率权重衰减到 $e^{-1}$ 的时间。文献若把“寿命”直接写成 $\hbar/\Gamma$ 或 $\hbar/(2\Gamma)$，必须先查它把 $\Gamma$ 定义成半宽还是全宽，以及讨论的是振幅还是占据。

### 4. 静态数值与交互实验

实验默认取 $\varepsilon_k=1\ \mathrm{meV}$、$\Gamma=2\ \mathrm{meV}$、探测偏移 $\delta E=4\ \mathrm{meV}$，并用 $\hbar=0.6582\ \mathrm{meV\,ps}$。打开后可以拖动中心能量、半宽和偏移，左图画 $A(E)$，右图画 retarded 振幅与概率包络；图中的面积、FWHM 和时间单位同步更新。

<div class="learning-lab" data-learning-lab="physics-greens-quasiparticle" markdown="1">

**无 JavaScript 时的静态读法：**在单 pole 模型

$$
A(E)=\frac{1}{\pi}\frac{\Gamma}{(E-\varepsilon)^2+\Gamma^2}
$$

中代入 $\varepsilon=1\ \mathrm{meV}$、$\Gamma=2\ \mathrm{meV}$。由于 $\hbar=0.6582\ \mathrm{meV\,ps}$，以下数字是实验的默认核对值：

| 账本 | 公式 | 默认结果 |
|---|---|---:|
| 峰顶 | $1/(\pi\Gamma)$ | $0.15915\ \mathrm{meV}^{-1}$ |
| FWHM | $2\Gamma$ | $4\ \mathrm{meV}$ |
| 振幅时间 | $\hbar/\Gamma$ | $0.3291\ \mathrm{ps}$ |
| 概率时间 | $\hbar/(2\Gamma)$ | $0.1646\ \mathrm{ps}$ |
| 偏移 $\delta E=4\ \mathrm{meV}$ 处 | $A(\varepsilon+\delta E)$ | $0.03183\ \mathrm{meV}^{-1}$ |
| 相对峰顶 | $A(\varepsilon+4)/A(\varepsilon)$ | $0.2000$ |
| 谱权重 | $\int A(E)dE$ | $1$ |

所以把 $\Gamma$ 加倍会使 FWHM 从 $4$ 变成 $8\ \mathrm{meV}$，峰顶减半，谱权重仍为 $1$；概率寿命从 $0.1646$ 变成 $0.0823\ \mathrm{ps}$。retarded 时间图在 $t<0$ 保持为零，这个因果边界不是画图约定，而是 $\theta(t)$ 的定义。

**反例与迁移：**真实系统可以有多个 pole、连续谱、能量依赖的 $\Sigma^R$ 或非 Lorentzian 尾巴。此时“FWHM = $2\Gamma$”只属于窄峰近似；谱权重总和规则仍需把所有峰和连续部分一起积分，不能只对可见的局部峰归一化。

</div>

### 5. 边界检查：峰宽不是万能的测量误差

- $\Gamma$ 描述相互作用、自能虚部与不可逆散射在该模型中的合成效果；仪器分辨率、温度卷积和杂质展宽也会拓宽实验曲线，但不自动等同于内禀寿命。
- 一个峰变宽可能是单粒子寿命变短，也可能是多个未分辨分支叠加。只有拟合的自能、动量依赖和独立的分辨率模型都支持时，才可把宽度解释为内禀散射。
- $A(k,E)$ 的正性和积分规则是强检查；“峰顶越高所以粒子越多”是错误读法，面积才是本单 pole 模型中固定的谱权重。
- retarded 的 $t<0$ 为零只表达因果边界；它不等于系统没有量子涨落。涨落要由相关函数或 Keldysh/greater-lesser Green functions 另行记录。

### 6. 迁移任务

若 ARPES 在同一 $k$ 点观察到峰顶下降一半、FWHM 增加一倍，先判断是 $\Gamma$ 加倍还是谱权重减少，再说明需要什么额外数据来区分：至少要检查背景、仪器卷积、峰面积、动量依赖和温度依赖。这个任务把“读峰”迁移成实验建模，而不是只套 $\tau=\hbar/\Gamma$。

</section>

## 1. 为什么要从 Green function 开始？

直接追踪一个受相互作用的电子，必须同时处理所有其他电子的扰动；单粒子波函数通常不再是稳定的本征态。Green function 换了一个问题：在 $t=0$ 加入一个具有动量 $k$ 的粒子，系统在之后的时间和位置上留下多大的传播振幅？这个“从源到响应”的对象既能编码传播，也能接到实验的谱强度。

对费米子，retarded Green function 可写成

$$
G^R(k,t)=-\frac{i}{\hbar}\theta(t)
\left\langle\{c_k(t),c_k^\dagger(0)\}\right\rangle.
$$

反对易子让添加粒子和移除粒子都进入同一对象；$\theta(t)$ 则把响应限制在源之后。对玻色子把反对易子换成对易子，因果结构仍在。

在平移不变的系统里做时间傅里叶变换，非相互作用电子给

$$
G_0^R(k,E)=\frac{1}{E-\varepsilon_k+i0^+},
\qquad
A_0(k,E)=\delta(E-\varepsilon_k).
$$

无相互作用时谱是一条理想的 delta 峰；相互作用把 $i0^+$ 替换成由自能产生的有限虚部，同时也会移动峰的位置。

## 2. 自能：实部改位置，虚部改可活多久

Dyson 方程把所有相互作用修正打包进自能：

$$
G^R=G_0^R+G_0^R\Sigma^R G^R,
\qquad
G^R(k,E)=\frac{1}{E-\varepsilon_k-\Sigma^R(k,E)}.
$$

写 $\Sigma^R=\operatorname{Re}\Sigma^R+i\operatorname{Im}\Sigma^R$。retarded 函数的耗散约定使稳定的谱峰满足 $\operatorname{Im}\Sigma^R\le0$。峰位置近似由

$$
E_k-\varepsilon_k-\operatorname{Re}\Sigma^R(k,E_k)=0
$$

决定；若在峰附近忽略自能的能量导数，也就是取 $Z_k\simeq1$，再把 $-\operatorname{Im}\Sigma^R$ 近似为常数 $\Gamma$，就得到学习层的 Lorentzian。

更精细地，若自能随能量变化，准粒子 residue 为

$$
Z_k=\left[1-\left.\frac{\partial\operatorname{Re}\Sigma^R(k,E)}{\partial E}\right|_{E_k}\right]^{-1}.
$$

把分母在 $E_k$ 附近展开后，物理半高半宽应定义为

$$
\Gamma_k=-Z_k\operatorname{Im}\Sigma^R(k,E_k)>0.
$$

于是窄峰近似变成 $A\simeq Z_k\Gamma_k/[\pi((E-E_k)^2+\Gamma_k^2)]$。这里的 $Z_k$ 同时重标度色散斜率与 pole 宽度，不能沿用 $Z_k=1$ 时的 $-\operatorname{Im}\Sigma^R$ 而漏掉它；剩余谱权重进入非相干连续部分。residue 小也不等于寿命短：一个激发可能有清晰但权重很小的 pole，也可能有很宽而难以称为准粒子的峰。

## 3. 谱函数与测量的字典

谱函数的 Lehmann 表示把它写成真实跃迁的加权和。对费米系统，在给定温度下实验强度还会乘上 Fermi 分布和矩阵元；所以 ARPES 的原始亮度不是裸的 $A(k,E)$。隧穿谱还会卷积探针态密度、温度和电压转换。学习层画的是最小模型的 intrinsic spectral function，目的是先锁住 pole、宽度和面积三者的关系。

三条检查可以跨实验复用：

1. **正性**：物理谱权重不能在可测区间凭空变成负数。
2. **和规则**：对规范归一化的单粒子谱，$\int dE\,A(k,E)=1$；如果局部拟合的峰面积变化，需问权重是否转移到了背景或另一支。
3. **因果解析性**：retarded 函数在复能量上解析于上半平面，实部与虚部由 Kramers–Kronig 关系相连。随意独立调节峰位和损耗，可能构造出不对应任何因果响应的曲线。

这些检查比“看起来像一条峰”更强：一个数值拟合若破坏和规则或解析性，即便残差漂亮，也不能自动叫作物理自能。

## 4. 准粒子何时成立？

准粒子不是额外添加的一种粒子，而是 Green function 在复能量平面上的长寿命 pole。若

$$
\Gamma_k\ll E_{\rm scale}
$$

并且在峰宽内自能变化不大，时间上才有许多振荡周期，能量上才有可分辨的峰。Fermi 液体在费米面附近常见 $\Gamma\to0$ 的长寿命趋势；高温、强无序、接近量子临界区或低维强涨落时，$\Gamma$ 可能与能量尺度同阶，准粒子语言便需要谨慎。

“寿命有限所以违反能量守恒”也是误解。完整平移不变系统仍有时间平移对称与总能量守恒；有限宽度描述的是一个添加粒子态向许多多体末态散射，单粒子子空间的能量分布变宽。把整个系统的守恒量和某个投影态的衰减混为一谈，会得到错误的悖论。

## 5. 三个算术检查

**例 1（半高点）** 若 $\Gamma=0.50\ \mathrm{meV}$，则 $A(\varepsilon+0.50)/A(\varepsilon)=1/2$，FWHM 为 $1.00\ \mathrm{meV}$；不能把 $\Gamma$ 本身叫全宽。

**例 2（时标）** 若峰的能量半宽为 $0.10\ \mathrm{meV}$，且 $\hbar=0.6582\ \mathrm{meV\,ps}$，则 $\tau_{\rm amp}=6.582\ \mathrm{ps}$、$\tau_{\rm pop}=3.291\ \mathrm{ps}$。振幅的指数率与概率的指数率相差一倍，这正是单位和二次方都要写出来的原因。

**例 3（面积）** 两个峰各自面积为 $0.6$ 与 $0.4$，即便第二个峰很宽，合计单粒子谱权重仍可为 $1$；不能用峰高比较权重。

## 6. 小结：把“看见一个峰”升级成机制判断

Green function 给传播，retarded 条件给因果，谱函数给实验可见的能量权重，自能的实部和虚部分别控制重整化位置与衰减。窄 Lorentzian 只是一个可检验的局部模型；和规则、解析性、独立卷积模型以及动量/温度依赖共同决定它能否被称为准粒子。

下一页的相关输运会把“谱峰如何衰减”换成“空间密度模式如何扩散”：那里的相关长度与扩散时间是另一套账，不应把单粒子 lifetime 当作宏观输运系数。

---

*核心句：准粒子是一个 pole 的近似语言；谱峰位置、谱权重与谱宽分别回答不同问题。*
