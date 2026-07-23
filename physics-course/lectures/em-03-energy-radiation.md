# 电磁 III · 场的能量、动量与辐射入门

> **对标**：Griffiths §8、§11 入门 ｜ **前置**：em-01/02
> 本页给"场是实在的"补齐力学证据：场携带**能量**（Poynting 定理）与**动量**（辐射压），并回答一个改变世界的问题——**加速电荷为什么辐射**（Larmor 公式）。这是本科电磁的收官，也是天线、同步辐射与"经典原子必塌缩"悖论（量子力学的引信）的出发点。

## 1. Poynting 定理：场的能量记账

**定理【推导】** 从 Lorentz 力对电荷做功率 $\mathbf J\cdot\mathbf E$ 出发，用 Ampère–Maxwell 消 $\mathbf J$、矢量恒等式 $\nabla\cdot(\mathbf E\times\mathbf B) = \mathbf B\cdot(\nabla\times\mathbf E) - \mathbf E\cdot(\nabla\times\mathbf B)$ 与 Faraday：

$$
\frac{\partial u}{\partial t} + \nabla\cdot\mathbf S = -\mathbf J\cdot\mathbf E, \qquad u = \frac{\varepsilon_0E^2}{2} + \frac{B^2}{2\mu_0}, \quad \mathbf S = \frac{\mathbf E\times\mathbf B}{\mu_0}
$$

**读法**：**连续性方程**（与电荷守恒同型——"守恒律的标准长相"：密度 + 流 + 源汇）：$u$ = 场的能量密度、$\mathbf S$（Poynting 矢量）= 能流密度、右端 = 场与物质的能量交换。**能量在场中流动**：给电阻供能的能量从导线**侧面**的场流入（算例经典【引用 Griffiths §8.1】）——颠覆"能量在电线里跑"的直觉。

## 2. 场的动量与辐射压

场还带动量：$\mathbf g = \varepsilon_0\,\mathbf E\times\mathbf B = \frac{\mathbf S}{c^2}$（动量密度）**【骨架】**（对 Lorentz 力密度做与 §1 平行的记账，应力张量 $T_{ij}$ 携带动量流【引用 §8.2】）。

**辐射压**：电磁波打在吸收面上 $P = \frac{I}{c}$（反射加倍）——阳光 $\sim 5\ \mu\mathrm{Pa}$：微小但真实（彗尾方向、太阳帆、光镊的原理——光镊已是诺奖级实验室日常）。**光子语言预告**：$E = pc$ 的经典对应（sr-01 四动量、atom-01 光电效应两处收线）。

## 3. 辐射：加速电荷发光

<figure class="plot" markdown="1">
![偶极辐射角分布](assets/img/em-03-dipole-radiation.svg)
<figcaption><span class="fig-id">图 3.1</span>偶极辐射的角分布 \(\propto\sin^2\theta\)：沿振荡轴方向不辐射、垂直方向最强——天线方向图的物理原型。</figcaption>
</figure>

**物理图像**：匀速电荷的场"跟着走"（无辐射——洛伦兹变换到静止系即静电场，sr-01 呼应）；**加速**时场线来不及调整，"扭结"以光速向外传播——这圈扭结就是辐射（Thomson 的图像论证：扭结区场的横向分量 $\propto \frac{1}{r}$ 而非静电的 $\frac{1}{r^2}$——只有 $\frac1r$ 场能把能量带到无穷远：$S \propto E^2 \propto \frac{1}{r^2}$ 乘以球面 $r^2$ 不衰减）。

**Larmor 公式【骨架】**（非相对论）：

$$
P = \frac{q^2 a^2}{6\pi\varepsilon_0 c^3}
$$

（量纲 + $\frac1r$ 场论证定形，系数由偶极辐射的角分布积分——完整推导在 ced-02 推迟势之后。）**辐射功率 $\propto$ 加速度平方**。

**三个立即的物理**：

- **天线**：驱动电荷振荡 $a \sim \omega^2 x_0$ ⇒ $P \propto \omega^4$——短波高效（天线尺寸 ~ 波长的工程根源）；
- **瑞利散射 $\propto \omega^4$**：束缚电子被阳光驱动再辐射——蓝光散射强于红光 16 倍：**天空为什么蓝、夕阳为什么红**，一个幂律的功劳；
- **经典原子的死刑判决**：绕核电子向心加速 ⇒ 持续辐射 ⇒ 能量流失 ⇒ 轨道塌缩（估算寿命 $\sim 10^{-11}$ s【引用】）——**经典物理自己证明了自己在原子尺度必须让位**：量子力学（qm-01）的引信在此点燃。

## 4. 练习与要点

**例 1（Poynting 流向亲算）** 充电中的平板电容：$\mathbf E$ 轴向增长、边缘 $\mathbf B$ 环向（位移电流的 Ampère 环）⇒ $\mathbf S = \frac{\mathbf E\times\mathbf B}{\mu_0}$ 指向**内部**——能量从侧面流入填充场能 $\frac{\varepsilon_0E^2}{2}$，记账严丝合缝（做一遍这道题，场的实在感落地）。

**例 2（辐射压数量级）** 100 kW 激光聚焦 1 g 反射帆：$F = \frac{2P}{c} \approx 0.67\ \mathrm{mN}$，$a \approx 0.67\ \mathrm{m/s^2}$——激光推进的可行性一算便知（突破摄星计划的物理底账）。

**例 3（ω⁴ 的应用题）** 为何微波炉（GHz）不"辐射逃逸"而手机信号穿墙：频率与结构尺度的匹配 + 网孔 ≪ 波长的屏蔽（波导截止）——em 三页知识的综合判断题。$\blacksquare$

---

*电磁三页完卷。下一页：把"光速对谁都一样"当公理会发生什么——狭义相对论：时空的重新装配。*
