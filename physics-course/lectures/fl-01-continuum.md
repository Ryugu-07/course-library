# 流体 I · 连续介质与 Navier–Stokes

> **对标**：Landau & Lifshitz《流体力学》§1–2 / Batchelor ch.1–3 / Kundu ch.4 ｜ **前置**：mech-01（守恒律）、mp-01（矢量分析）
> 从"一堆分子"跳到"一片连续的场"——这一步换来了偏微分方程的全部威力，也埋下了物理学最著名的未解问题（fl-03）。Navier–Stokes 是本站少数**方程完全已知、解却至今不懂**的对象：它的光滑性问题是千禧年七问之一。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="continuum-conservation-learning-title">

## 学习层：跟着流体走，还是守住一个控制体积？

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
2. $D\rho/Dt=0$ 是否在不加额外条件时就等价于 $\nabla\cdot\mathbf u=0$？
3. 对固定控制体积写动量守恒时，是否只需比较入口和出口的压力，而可以忽略 $\rho u^2A$ 的动量通量差？

### 3. 最小模型：连续性与动量分成两张账

实验使用平滑的喉部面积和固定质量流率 $\dot m$，令

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

实验把压力端力先列出，再把“动量通量差 − 已知压力/体力”作为所需壁面力，保证每一项的符号都能追溯；这不是 Navier–Stokes 解，而是一个可审计的控制体积账本。

### 4. 静态后备：一维喷管的有限账本

<div class="learning-lab" data-learning-lab="continuum-conservation" markdown="1">

**无 JavaScript 时的静态读法：**取 $A(x)=1-0.45\exp[-((x-0.5)/0.22)^2]$、$\dot m=1$。恒密度模式用 $\rho=1$，因此 $u=1/A$，喉部速度最大；变密度模式用 $\rho(x)=1+0.2x$，仍有 $\rho Au=1$，但 $D\rho/Dt=u\,d\rho/dx>0$，由连续性抵消准一维散度项。

| 模式 | $\rho Au$ | $D\rho/Dt$ | $A^{-1}d(Au)/dx$ | 连续性残差 | 理论标签 |
|---|---:|---:|---:|---:|---|
| 恒密度、稳态 | $1$ | $0$ | $0$ | $0$ | 不可压的这一模型 |
| 变密度、稳态 | $1$ | 通常 $>0$ | 通常 $<0$ | $0$ | 可压缩质量守恒，不是不可压 |

对任意固定 $[x_0,x_1]$，动量表还应显示 $(\rho u^2A)_{out}-(\rho u^2A)_{in}$、压力端力以及补足平衡所需的壁面力。脚本的曲线与表格只是在有限网格上检查这个构造；控制体积守恒律本身来自积分方程，而不是来自某一组采样点“看起来相等”。

### 5. 定理/模型假设与失效边界：三种“不可压”不能混为一谈

- **连续介质假设**：本页要求 $\mathrm{Kn}\ll1$，场量足够光滑，控制体积边界和通量有意义；稀薄气体、激波内部和微纳尺度需要 Boltzmann/DSMC 或其他非连续模型。
- **物质导数不是控制体积通量**：$D/Dt$ 描述随体局部变化；Reynolds 输运定理才把它与固定区域的积累和边界通量接起来。少写一项就会破坏守恒账。
- **不可压与恒密度**：连续性只给 $D\rho/Dt=-\rho\nabla\cdot u$。$D\rho/Dt=0$ 在正密度下推出散度为零；而“整个空间处处取同一常数密度”是更强的模型设定。变密度但沿流线恒定的特殊流动也不能被一句口号替代。
- **一维模型边界**：喷管账本假定准一维、平滑截面、稳态且没有激波/泄漏；壁面剪切、压力分布和体力若未给出，只能把剩余项记为壁面力，不能宣称已经解出完整动量方程。
- **证据等级**：SVG、有限差分残差和一组入口/出口数值是有限数值证据；积分守恒、连续性微分形式和 Navier–Stokes 的适用范围仍须由上述假设和方程承担。

</div>

</section>

<figure class="plot" markdown="1">
![不同雷诺数下圆柱绕流的形态演变。](assets/img/fl-01-continuum-re.svg)
<figcaption><span class="fig-id">图 fl-01.1</span>雷诺数控制绕流形态：\(Re\ll1\) 爬流对称可逆；\(Re\sim10^2\) 卡门涡街；\(Re\gtrsim10^5\) 湍流尾迹。</figcaption>
</figure>

## 1. 连续介质假设：什么时候可以忘掉分子

**判据是 Knudsen 数** $\mathrm{Kn} = \ell_{\text{mfp}}/L$（平均自由程 / 特征尺度）。$\mathrm{Kn}\ll1$ 时，任一"流体微元"内已有海量分子，涨落被平均掉（sm-02 的大数定律），可定义处处可微的 $\rho(\mathbf x,t),\ \mathbf u(\mathbf x,t),\ p(\mathbf x,t)$。

**失效边界【诚实标注】**：稀薄气体（高空、真空系统）、微纳流动（MEMS）、激波内部（厚度仅几个自由程）——需回到 Boltzmann 方程或 DSMC。**本页全部建立在 $\mathrm{Kn}\ll1$ 之上。**

**物质导数**：跟着流体微元走的时间变化率

$$\frac{D}{Dt} = \partial_t + (\mathbf u\cdot\nabla)$$

动量方程最醒目的非线性是 $(\mathbf u\cdot\nabla)\mathbf u$；它是湍流尺度耦合和许多流动不稳定性的核心来源之一。可压缩激波还涉及状态方程与守恒律的非线性通量，不能把所有机制都归给这一项。

## 2. 三条守恒律

**质量**（连续性）：$\partial_t\rho + \nabla\cdot(\rho\mathbf u)=0$；不可压时退化为 $\nabla\cdot\mathbf u = 0$。

**动量**（Cauchy）：$\rho\dfrac{D\mathbf u}{Dt} = \nabla\cdot\boldsymbol\sigma + \rho\mathbf g$。

**本构关系【牛顿流体 + Stokes 假设】**：对常剪切黏度、忽略独立体黏度的写法，应力线性正比于应变率

$$\sigma_{ij} = -p\delta_{ij} + \mu\left(\partial_i u_j + \partial_j u_i - \tfrac{2}{3}\delta_{ij}\nabla\cdot\mathbf u\right)$$

代入即得 **Navier–Stokes 方程**（不可压）：

$$\boxed{\ \rho\left(\partial_t\mathbf u + (\mathbf u\cdot\nabla)\mathbf u\right) = -\nabla p + \mu\nabla^2\mathbf u + \rho\mathbf g\ }$$

**非牛顿流体【引用】**：血液、聚合物熔体、泥浆——剪切变稀/变稠、粘弹性（Weissenberg 爬杆效应）。工业上极重要，物理上是另一门课。

## 3. 无量纲化：雷诺数的诞生

对不可压、等温、无额外体力且几何/边界条件已无量纲固定的简单问题，取特征尺度 $L,U$ 后 N–S 的方程主体只剩一个参数：

$$\mathrm{Re} = \frac{\rho U L}{\mu} = \frac{\text{惯性项}}{\text{粘性项}}$$

**这是流体力学最重要的数**。$\mathrm{Re}\ll1$ 粘性主导（Stokes 流，fl-02）；$\mathrm{Re}\gg1$ 惯性主导（边界层 + 湍流）。

**动力相似**：只有控制方程、无量纲几何/边界条件以及所有相关无量纲数都匹配时，模型与原型才动力相似。若问题确实只由 $\mathrm{Re}$ 控制，匹配它便足够；风洞还常需同时考虑 Mach、表面粗糙度等。其他重要无量纲数：Froude（重力波）、Prandtl（热扩散比，fl-04）、Rayleigh（对流，fl-04）。

## 4. 理想流体极限与涡量

$\mu\to0$ 给 **Euler 方程**。沿流线积分得 **Bernoulli**：$\tfrac12 u^2 + p/\rho + gz = \text{const}$。

**涡量** $\boldsymbol\omega = \nabla\times\mathbf u$ 满足（不可压、无粘）

$$\frac{D\boldsymbol\omega}{Dt} = (\boldsymbol\omega\cdot\nabla)\mathbf u$$

**Kelvin 环量定理【推导】**：理想正压流体中，随流体运动的闭合回路环量守恒 → **涡不能无中生有**。二维时右端消失，涡量随流体守恒。

**d'Alembert 佯谬**：理想流体中定常绕流的阻力为零——**与经验尖锐矛盾**。解决它需要粘性，且粘性的作用**不会随 $\mu\to0$ 而消失**（边界层，fl-02）。**这是"奇异摄动"最著名的物理实例：$\mu$ 乘在最高阶导数上，$\mu\to0$ 不是正则极限。**

## 5. 练习与要点

**例 1（Re 的手感）** 水中 $L=1$ m、$U=1$ m/s：$\mathrm{Re}\sim10^6$（湍流）；细菌 $L=1\ \mu$m、$U=10\ \mu$m/s：$\mathrm{Re}\sim10^{-5}$——**细菌生活在粘性完全主导的世界里，惯性对它毫无意义**（fl-02 扇贝定理）。

**例 2（涡量守恒的日常）** 拔掉浴缸塞子形成漩涡：初始微小涡量被向心收缩放大（$(\boldsymbol\omega\cdot\nabla)\mathbf u$ 的涡管拉伸项）——**与花样滑冰收臂加速是同一个角动量守恒**。

**例 3（为什么 N–S 难）** 非线性项使能量在尺度间传递，且三维涡管拉伸可能使涡量无界增长。**三维光滑解是否永远存在，至今未知**（千禧年问题）——**这是本站唯一一个"方程写在这里、人类却不会解"的对象**。$\blacksquare$

---

*下一页：粘性到底在哪里起作用？答案是"只在薄薄一层里"——但正是这一层决定了阻力、失速与几乎所有工程流动。*
