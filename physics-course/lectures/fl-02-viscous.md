# 流体 II · 粘性、边界层与阻力

> **对标**：Batchelor ch.4–5 / Schlichting《边界层理论》/ Purcell "Life at Low Reynolds Number" ｜ **前置**：fl-01
> 粘性的作用极不均匀：在大部分区域可以忽略，却在紧贴壁面的薄层里完全主导——而正是这一层决定了阻力、升力与失速。Prandtl 1904 年的这个洞见，把流体力学从"漂亮但没用"变成了工程学科。

<figure class="plot" markdown="1">
![圆球阻力系数随雷诺数的变化，含阻力危机。](assets/img/fl-02-viscous-drag.svg)
<figcaption><span class="fig-id">图 fl-02.1</span>圆球阻力系数 \(C_D(\mathrm{Re})\)：低 \(Re\) 的 Stokes 律 \(C_D=24/\mathrm{Re}\)、中段平台、以及 \(\mathrm{Re}\sim3\times10^5\) 处因边界层转捩导致的<strong>阻力危机</strong>。</figcaption>
</figure>

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="viscous-boundary-learning-title">

## 学习层：两条渐近公式住在两个不同世界，不能跨雷诺数搬家

<h3 id="viscous-boundary-learning-title">1. 先预测：小粘性是否等于处处无粘？</h3>

实验并排放置两种经典近似：低雷诺数无界流体中的刚性球 Stokes 阻力，以及高雷诺数、零压梯度平板上的层流 Blasius 标度。先判断：

1. $F=6\pi\mu aU$ 能否直接外推到 $\mathrm{Re}=10^5$？
2. 外流雷诺数很大时，粘性项是否可以在包含无滑移壁面的整个区域处处删掉？
3. $\delta_{99}\approx5x/\sqrt{\mathrm{Re}_x}$ 能否单独预测逆压梯度中的分离点？

提交后，Stokes 模式会在离开 creeping-flow 区时停止物理证书；平板模式则把厚度、局部摩阻和转捩提示分账，不让“薄”被误读成“不重要”。

### 2. 静态后备：先读无量纲比，再选公式

<div class="learning-lab" data-learning-lab="viscous-boundary-layer" markdown="1">

球半径为 $a$ 时取直径定义

$$
\mathrm{Re}=\frac{2\rho Ua}{\mu},
\qquad
F_D=6\pi\mu aU,
\qquad
C_D=\frac{F_D}{\tfrac12\rho U^2\pi a^2}=\frac{24}{\mathrm{Re}}.
$$

最后两个等式是同一个 Stokes 解的两种写法，都要求 $\mathrm{Re}\ll1$ 及相应的无界、稳态、刚性无滑移球假设。把 $24/\mathrm{Re}$ 画到高 $\mathrm{Re}$ 只能展示错误外推，不能预测尾流、分离或阻力危机。

对零压梯度光滑平板层流，局部参考量为

$$
\mathrm{Re}_x=\frac{Ux}{\nu},
\qquad
\delta_{99}\approx\frac{5x}{\sqrt{\mathrm{Re}_x}},
\qquad
C_{f,x}=\frac{0.664}{\sqrt{\mathrm{Re}_x}}.
$$

交互台把 $\mathrm{Re}_x$ 与长度 $x$ 当作两项独立的**相似缩放参数**，并固定 $U$；因此每组读数都隐含回算 $\nu=Ux/\mathrm{Re}_x$。若研究同一种流体的沿程发展，就不能独立拨这两个旋钮，而应固定 $U,\nu$ 后由 $x$ 自动决定 $\mathrm{Re}_x$。

| 量 | 它回答什么 | 它不回答什么 |
|---|---|---|
| $\delta_{99}$ | 速度达到约 $0.99U$ 的层厚尺度 | 逆压梯度分离位置 |
| $C_{f,x}$ | 当前 $x$ 的局部壁面摩阻 | 整块板或钝体的总阻力系数 |
| 常用转捩 $\mathrm{Re}_x$ | 光滑低扰动平板的经验参考 | 任意粗糙度、自由流扰动下的普适阈值 |

### 3. 边界层是一种奇异摄动

- 高外流 $\mathrm{Re}$ 只说明远离壁面时粘性相对小；无滑移条件制造很大的法向速度梯度，使薄层内 $\mu\nabla^2\mathbf u$ 仍与惯性同阶。
- 零压梯度 Blasius 解没有分离机制。逆压梯度需要新的边界层方程与壁面切应力演化，不能靠厚度公式单独判断。
- Stokes 时间可逆性与扇贝定理依赖 creeping-flow 极限及形变/边界条件。小但非零惯性、非牛顿流体或非互易驱动会改变结论。
- 图中的速度剖面用满足无滑移和外缘匹配的二次曲线作教学示意；Blasius 相似剖面本身需数值解非线性 ODE。

</div>

</section>

## 1. 低雷诺数：Stokes 流的怪异世界

$\mathrm{Re}\ll1$ 时丢掉惯性项，N–S 退化为**线性**的 Stokes 方程：

$$\nabla p = \mu\nabla^2\mathbf u,\qquad \nabla\cdot\mathbf u = 0$$

**Stokes 阻力【推导】**：球体 $F = 6\pi\mu a U$。

**两个反直觉后果**：

**① 时间可逆性。** 方程无时间导数、无非线性 → **把驱动反向，流体精确回到原处**（著名的甘油演示实验）。

**② 扇贝定理（Purcell）**：低 $\mathrm{Re}$ 下，**任何往复对称的形变都不产生净位移**——一开一合的扇贝原地不动。**所以细菌必须用非往复的方式游动**：螺旋鞭毛的旋转、或纤毛的非对称拍打。**这是一条纯粹由方程对称性推出的生物学约束**（🔗 bio 站的鞭毛马达）。

## 2. 高雷诺数：边界层

$\mathrm{Re}\gg1$ 时，粘性项系数很小，但**不能直接丢弃**——因为壁面要求无滑移 $\mathbf u=0$，而 Euler 方程只能满足法向条件。**矛盾在壁面附近厚度为 $\delta$ 的薄层中化解**。

**量级平衡【标度推导】**：层内粘性与惯性同量级 $\dfrac{\mu U}{\delta^2}\sim\dfrac{\rho U^2}{L}$ 给

$$\frac{\delta}{L}\sim\frac{1}{\sqrt{\mathrm{Re}}}$$

**Blasius 解【引用】**：平板层流边界层的相似解，$\delta\approx5.0\,x/\sqrt{\mathrm{Re}_x}$，壁面切应力 $\tau_w\propto x^{-1/2}$。

**这就是 d'Alembert 佯谬的解答**（fl-01）：无论 $\mu$ 多小，边界层始终存在，且**它的存在改变了整个外流**。

## 3. 分离：升力消失的地方

**逆压梯度**（$dp/dx>0$，如翼型后半段）会减速近壁流体，一旦壁面切应力变号，边界层**脱离壁面**——**流动分离**。

**后果**：

- 尾流增大 → **压差阻力（形阻）急剧上升**；
- 机翼失速：攻角过大 → 分离 → **升力骤降**；
- 分离点位置决定一切，而它对边界层状态极敏感。

**阻力危机【经典现象】**：$\mathrm{Re}\sim3\times10^5$ 时，边界层由层流转捩为**湍流**。湍流边界层动量输运强、更"抗压"，**分离点后移** → 尾流变窄 → **阻力系数骤降约 3–4 倍**（图 fl-02.1 的陡坎）。

**这解释了高尔夫球的酒窝**：粗糙表面**提前触发转捩**，把阻力危机拉到更低的 $\mathrm{Re}$，使球飞得更远。**"人为制造湍流以减小阻力"——一个彻底反直觉、却每天被验证的工程事实。**

## 4. 阻力的分解与升力

$$F_D = \underbrace{\text{摩擦阻力}}_{\tau_w\ \text{积分}} + \underbrace{\text{压差阻力}}_{\text{分离决定}}$$

流线型物体以摩擦阻力为主（分离被推迟），钝体以压差阻力为主。

**升力**：由绕翼型的**环量** $\Gamma$ 给出 Kutta–Joukowski 定理 $L = \rho U\Gamma$。环量并非凭空产生——Kelvin 定理（fl-01）要求总环量守恒，**起动时脱落的"起动涡"携带等量反向环量**。**升力的产生与一个被留在身后的涡严格配对。**

## 5. 练习与要点

**例 1（细菌与人的世界之别）** 人游泳 $\mathrm{Re}\sim10^6$：停止划水仍滑行数米（惯性）。细菌 $\mathrm{Re}\sim10^{-5}$：**停止转动鞭毛后滑行距离约为原子尺度**——惯性完全不存在，"游泳"等价于"在极稠的糖浆中拧螺丝"。

**例 2（边界层有多薄）** 机翼弦长 1 m、$\mathrm{Re}=10^7$：$\delta\sim L/\sqrt{\mathrm{Re}}\sim0.3$ mm。**整架飞机的阻力，取决于不到半毫米厚的一层流体。**

**例 3（阻力危机的量级）** 光滑球 $C_D$ 从 0.5 降到 0.1 附近——**同样速度下阻力降至约 1/5**。高尔夫球正是靠它把飞行距离提高约一倍。$\blacksquare$

---

*下一页：$\mathrm{Re}$ 继续升高会怎样？流动失去规则性，进入物理学最著名的未解难题——湍流。这里我们只能得到标度律，得不到解。*
