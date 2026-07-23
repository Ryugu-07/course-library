# 力学 III · 哈密顿力学与相空间

> **对标**：Goldstein §8–9 / Landau §7 ｜ **前置**：mech-02、cvx-01（Legendre 变换！）
> 力学的第三种写法：用 Legendre 变换把 $(q, \dot q)$ 换成 $(q, p)$——**相空间**。方程降为一阶对称形式、演化成为相空间的"流"、泊松括号让力学代数化。这不只是换记号：**量子力学（对易子）与统计物理（相空间测度）都从这扇门进屋**。

## 1. Legendre 变换与正则方程

**哈密顿量**：$H(q, p, t) = \sum_i p_i\dot q_i - L$，其中 $p_i = \frac{\partial L}{\partial\dot q_i}$（广义动量）——**这正是凸共轭**（cvx-01 的 $f^*$：$L$ 对 $\dot q$ 的 Legendre 变换；"物理学家的 Legendre 变换"在凸优化页有正式户口，两边互为注脚）。通常情形 $H = T + V$ = 总能量。

**正则方程【推导】** 对 $dH = \sum(\dot q\,dp + p\,d\dot q) - dL$ 展开，$dL$ 的 $\frac{\partial L}{\partial\dot q}d\dot q$ 项恰与 $p\,d\dot q$ 相消（共轭变换的设计目的），再用 EL 方程 $\frac{\partial L}{\partial q} = \dot p$：

$$
\dot q_i = \frac{\partial H}{\partial p_i}, \qquad \dot p_i = -\frac{\partial H}{\partial q_i}
$$

$2n$ 条一阶方程替代 $n$ 条二阶——相空间 $(q, p)$ 中的一阶流（ode-03 的动力系统语言全面接管：平衡点、相图、稳定性照单全收）。

## 2. 相空间的几何：Liouville 定理

<figure class="plot" markdown="1">
![单摆相空间](assets/img/mech-03-pendulum-phase.svg)
<figcaption><span class="fig-id">图 3.1</span>单摆相空间：小能量在不动点附近往复（闭轨），大能量越过顶点持续转动，二者被红色分界线（separatrix）隔开。</figcaption>
</figure>

**定理（Liouville）** 哈密顿流保持相空间体积。
**【推导】** 相流的"速度场" $v = \big(\frac{\partial H}{\partial p}, -\frac{\partial H}{\partial q}\big)$ 的散度：

$$
\nabla\cdot v = \sum_i\Big(\frac{\partial^2 H}{\partial q_i\partial p_i} - \frac{\partial^2 H}{\partial p_i\partial q_i}\Big) = 0
$$

（混合偏导相等——数分 V 又一次在关键处执勤。）散度为零 ⇒ 流不可压缩 ⇒ 体积不变（数分 VI 输运定理）。$\blacksquare$

**读法（两大后果）**：① **统计物理的地基**——相空间体积是演化不变的天然测度，微正则系综"等概率假设"因此有资格（sm-02 收线）；② 哈密顿系统**没有吸引子**（体积不能收缩）——耗散系统（阻尼）不哈密顿，这是"保守 vs 耗散"的几何分界。（更深一层【引用】：流保持的不止体积而是**辛形式** $\sum dq_i\wedge dp_i$——微分形式的语言（grad-math 流形 II）在此有物理岗位；辛几何是哈密顿力学的数学本体。）

## 3. 泊松括号：力学的代数形态

**定义** $\{f, g\} = \sum_i\Big(\frac{\partial f}{\partial q_i}\frac{\partial g}{\partial p_i} - \frac{\partial f}{\partial p_i}\frac{\partial g}{\partial q_i}\Big)$。

**万物演化的统一公式【推导】**（链式法则 + 正则方程一行）：

$$
\frac{df}{dt} = \{f, H\} + \frac{\partial f}{\partial t}
$$

——**$H$ 是时间演化的生成元**；$f$ 守恒 ⟺ $\{f, H\} = 0$（"与哈密顿量对易"）。基本括号：$\{q_i, p_j\} = \delta_{ij}$。性质：反对称、Jacobi 恒等式、Leibniz——**Lie 代数结构**（两个守恒量的括号仍守恒——Poisson 定理，造新守恒量的机器）。

**量子力学的门牌（本页最大伏笔）**：Dirac 的正则量子化处方——

$$
\{f, g\} \;\longrightarrow\; \frac{1}{i\hbar}[\hat f, \hat g]
$$

泊松括号换成对易子、$\{q, p\} = 1$ 变成 $[\hat q, \hat p] = i\hbar$——**量子力学的运动方程（Heisenberg 绘景）在形式上就是本页的公式**。经典力学不是被量子力学抛弃，而是被它按此字典整体翻译（qm-01/aqm 系列兑现）。

**正则变换与 Hamilton–Jacobi 一瞥【引用】**：保持括号结构的坐标变换（辛变换）；HJ 方程 $\frac{\partial S}{\partial t} + H\big(q, \frac{\partial S}{\partial q}\big) = 0$ 把力学化成一条一阶 PDE——作用量 $S$ 当"波前"：**力学的波动形态**，历史上是 Schrödinger 方程的直接跳板（经典极限 $\psi \sim e^{iS/\hbar}$ 的出处）。

## 4. 练习与要点

**例 1（正则方程解谐振子）** $H = \frac{p^2}{2m} + \frac12 m\omega^2q^2$：相流是椭圆（等能线）上的匀速转动——一维谐振子的相图一眼画出；Liouville：椭圆环带面积随流不变。

**例 2（括号练手）** 验证角动量分量 $\{L_x, L_y\} = L_z$（直接展开定义）——角动量的 Lie 代数（$SO(3)$ 的结构常数）在经典力学里已经在场；量子对易子 $[L_x, L_y] = i\hbar L_z$ 只是换字典（aqm-01 的主角提前露面）。

**例 3（守恒量速判）** $H = \frac{p^2}{2m} + V(r)$（中心势）：$\{L_z, H\} = 0$ 直接计算验证——"旋转对称 ⇒ 角动量与 $H$ 对易 ⇒ 守恒"：Noether（mech-02）在括号语言里的重述，三种力学写法在同一事实上会师。$\blacksquare$

---

*下一页：本科力学收官——小振动的普遍理论（简正模：一切"稳定平衡附近"的物理）与刚体转动。*
