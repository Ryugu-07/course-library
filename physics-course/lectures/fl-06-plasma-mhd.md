# 等离子体 · 磁流体与聚变

> **对标**：Chen《Introduction to Plasma Physics》/ Freidberg《Ideal MHD》/ Kulsrud ｜ **前置**：fl-01、em-02（Maxwell）、sm-02
> **宇宙中绝大部分重子物质处于等离子体态**——恒星、星际介质、吸积盘、日冕，以及地面上的聚变装置。本页把 N–S 与 Maxwell 缝在一起，给出磁流体（MHD）方程，并说明为什么"磁冻结"这一条几乎解释了等离子体的全部奇特行为。

<figure class="plot" markdown="1">
![等离子体参数空间：密度—温度平面上的各类等离子体与简并/耦合边界。](assets/img/fl-06-plasma-regimes.svg)
<figcaption><span class="fig-id">图 fl-06.1</span>等离子体参数空间（\(n\)–\(T\)）：从星际介质、日冕、聚变装置到白矮星内部，跨越二十多个数量级；虚线为<strong>简并边界</strong>（\(T\sim T_F\)，接 ap-04）与<strong>强耦合边界</strong>（\(\Gamma\sim1\)）。</figcaption>
</figure>

## 1. 什么算等离子体：三个判据

**① 集体性主导**：Debye 屏蔽长度

$$\lambda_D = \sqrt{\frac{\varepsilon_0 k_BT}{ne^2}}$$

**电荷在 $\lambda_D$ 之外被屏蔽**（与 cm-01 的 Thomas–Fermi 屏蔽同源）。要求 $\lambda_D\ll L$。

**② 多粒子屏蔽**：Debye 球内粒子数 $N_D = n\lambda_D^3\gg1$（否则是"强耦合等离子体"，需另做处理）。

**③ 电磁主导碰撞**：等离子体频率 $\omega_p=\sqrt{ne^2/\varepsilon_0 m}$ 远大于碰撞频率。

**$\omega_p$ 的物理后果**：频率低于 $\omega_p$ 的电磁波**无法传播**（被反射）。**这就是电离层反射短波无线电的原理**，也是激光等离子体相互作用的临界密度判据。

## 2. 单粒子图像：回旋与漂移

磁场中带电粒子作**回旋运动**，$\omega_c = qB/m$，Larmor 半径 $r_L = v_\perp/\omega_c$。

**绝热不变量** $\mu = mv_\perp^2/2B$ 在缓变场中守恒 → 粒子进入强场区时 $v_\perp$ 增大、$v_\parallel$ 减小，可能被**磁镜**反射。

**这直接解释了范艾伦辐射带**：地磁场两极强、赤道弱，形成天然磁镜，把高能粒子囚禁其中。

**各种漂移**：$\mathbf E\times\mathbf B$ 漂移（**与电荷符号无关**，故不产生电流）、梯度漂移、曲率漂移（**与符号有关，产生环电流**）。

## 3. 磁流体（MHD）方程

把等离子体当作单一导电流体，联立 N–S 与 Maxwell（略去位移电流）：

$$\rho\frac{D\mathbf u}{Dt} = -\nabla p + \mathbf J\times\mathbf B + \mu\nabla^2\mathbf u,\qquad \mathbf J = \sigma(\mathbf E+\mathbf u\times\mathbf B)$$

消去 $\mathbf E,\mathbf J$ 得**感应方程**：

$$\boxed{\ \partial_t\mathbf B = \nabla\times(\mathbf u\times\mathbf B) + \eta_m\nabla^2\mathbf B\ },\qquad \eta_m = \frac{1}{\mu_0\sigma}$$

**磁雷诺数** $\mathrm{Rm}=UL/\eta_m$ 度量两项之比。**天体中 $\mathrm{Rm}$ 极大**（$10^{10}$ 量级不罕见）。

**Alfvén 冻结定理【推导】**：$\mathrm{Rm}\to\infty$ 时，**磁通被冻结在流体中**——磁力线随流体一起运动，如同被"粘"住。

**这一条几乎解释了等离子体的一切奇特行为**：
- 流体运动**拉伸、缠绕、放大**磁场 → **发电机机制**（地磁场、太阳磁场的起源）；
- 磁场反过来通过 $\mathbf J\times\mathbf B$ 约束流体 → **磁约束聚变**的基本思想；
- 磁力线不能轻易穿越 → 等离子体被"贴"在磁力线上运动（日珥的形态）。

**磁压与磁张力**：$\mathbf J\times\mathbf B = -\nabla\left(\dfrac{B^2}{2\mu_0}\right)+\dfrac{(\mathbf B\cdot\nabla)\mathbf B}{\mu_0}$——**磁场像有压强与沿线张力的弹性介质**。由此得 **Alfvén 波**（磁力线的横波）：

$$v_A = \frac{B}{\sqrt{\mu_0\rho}}$$

**等离子体 $\beta = p/(B^2/2\mu_0)$** 判断谁主导：$\beta\ll1$ 磁场主导（日冕），$\beta\gg1$ 流体主导（恒星内部）。

## 4. 磁重联：冻结定理的破缺

冻结定理禁止磁拓扑改变——**但太阳耀斑在几分钟内释放巨量磁能，必须改变拓扑**。

**磁重联**：在薄电流片中，局部 $\eta_m$ 项恢复重要性，**磁力线断开重连**，磁能转为动能与热能。

- **Sweet–Parker 模型**给出的速率 $\propto\mathrm{Rm}^{-1/2}$，**比观测慢几个数量级**；
- **快速重联**（Petschek、湍流重联、无碰撞效应）是活跃研究方向【前沿/未完全解决】。

**重联是空间物理的核心过程**：太阳耀斑、日冕物质抛射、地磁亚暴、以及托卡马克中的锯齿崩塌，全部由它驱动。

## 5. 聚变约束

**Lawson 判据**：点火要求三乘积

$$n T \tau_E \gtrsim 3\times10^{21}\ \mathrm{keV\cdot s\cdot m^{-3}}\quad(\text{D–T}) $$

**两条路线**：
- **磁约束（托卡马克）**：$\beta$ 低、$\tau_E$ 长（秒级）、$n$ 低。核心难题是**输运反常**（远大于经典预言，由微观湍流驱动）与**不稳定性**（撕裂模、边界局域模）；
- **惯性约束**：$n$ 极高、$\tau_E$ 极短（纳秒）。核心难题是**压缩对称性与 Rayleigh–Taylor 不稳定性**（fl-04）。

**共同的物理障碍是不稳定性与湍流输运**——**这正是本线前几页内容在聚变工程中的汇合点**。

## 6. 练习与要点

**例 1（日冕为何百万度）** 日冕温度比光球（约 5800 K）高两个数量级。主流解释指向**磁能耗散**（波加热与纳耀斑重联）——**"加热问题"至今未完全定论**【争】，是空间物理的经典难题。

**例 2（冻结的量级）** 太阳对流区 $\mathrm{Rm}\sim10^{9}$；实验室等离子体 $\mathrm{Rm}\sim10^2$–$10^4$。**天体等离子体几乎完美冻结，实验室则不然**——这使实验室复现天体过程极其困难。

**例 3（Alfvén 速度）** 日冕 $B\sim10$ G、$n\sim10^{15}\ \mathrm{m^{-3}}$：$v_A\sim10^3$ km/s——**耀斑扰动以此速度传播，与观测的爆发时标一致**。$\blacksquare$

---

*流体线到此结束：从连续介质假设，到边界层、湍流、失稳、混沌，再到等离子体。下一线转向天体——把这些物理用到恒星与星系上。*
