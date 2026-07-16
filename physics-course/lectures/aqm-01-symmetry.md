# 高量 I · 对称性与角动量理论

> **对标**：Sakurai *Modern QM* §3–4 ｜ **前置**：qm-03、mech-02（Noether）、抽代 I（群）
> 研究生量子力学的第一主题：**对称性从"解题技巧"升格为"理论的组织原理"**。本页三件事：对称性算符的一般理论（Wigner 定理）、角动量的合成（CG 系数）、以及对称性如何锁死矩阵元（Wigner–Eckart 定理——选择定则的总后台）。

## 1. 量子对称性的一般理论

**Wigner 定理【引用】**：保持一切跃迁概率 $|\langle\phi|\psi\rangle|^2$ 的变换必为**酉或反酉**算符——对称性在量子力学里的合法形态只有这两种（反酉的唯一常客：时间反演）。

**连续对称性 = 酉群 = 生成元**：$\hat U(\theta) = e^{-i\theta\hat G/\hbar}$——平移由动量生成、转动由角动量生成、时间平移由哈密顿量生成（Schrödinger 方程本身）。**对称 ⇒ 守恒【推导一行】**：$[\hat U, \hat H] = 0 \iff [\hat G, \hat H] = 0 \iff \frac{d\langle G\rangle}{dt} = 0$（Ehrenfest）——**Noether 定理的量子版**（mech-02 的表逐行平移：生成元即守恒量）。

**简并的对称性起源**：$[\hat G, \hat H] = 0$ 且 $|\psi\rangle$ 为本征态 ⇒ $\hat G|\psi\rangle$ 同能量——**简并子空间 = 对称群的表示空间**（抽代 I 群论在物理的正式岗位：氢原子 $2\ell + 1$ 重简并 = $SO(3)$ 的表示维数；"意外简并" = 更大的隐藏群——Runge–Lenz 的 $SO(4)$【引用】）。离散对称性同框：宇称 $\hat P$（本征值 $\pm1$——选择定则的另一位签发人）、时间反演（反酉，Kramers 简并【引用】）。

## 2. 角动量合成与 CG 系数

两个角动量 $j_1 \otimes j_2$ 的合成（自旋+轨道、双电子……）：积空间按总角动量分解——

$$
j_1 \otimes j_2 = |j_1 - j_2| \oplus \cdots \oplus (j_1 + j_2)
$$

（维数对账 $\sum(2j+1) = (2j_1+1)(2j_2+1)$ ✓。）换基系数即 **Clebsch–Gordan 系数** $\langle j_1m_1j_2m_2|JM\rangle$。

**构造算法【推导流程】**：最高态 $|J{=}j_1{+}j_2, M{=}J\rangle = |j_1j_1\rangle|j_2j_2\rangle$ 唯一 → 降算符 $\hat J_- = \hat J_{1-} + \hat J_{2-}$ 逐级往下 → 正交性补出下一多重态的顶——机械可执行（例 1 演示最小案例）。选择规则 $M = m_1 + m_2$、三角不等式——不满足者系数恒零。

**样板（两个自旋 ½）**：$\frac12\otimes\frac12 = 1 \oplus 0$——三重态（对称）+ 单态（反对称）$\frac{1}{\sqrt2}(|\!\uparrow\downarrow\rangle - |\!\downarrow\uparrow\rangle)$：**单态就是最大纠缠态**（qi-01 的 Bell 态提前出生）、氦原子的正/仲态、核磁的单三态——一次合成吃遍三个领域。

## 3. Wigner–Eckart 定理（选择定则的总后台）

**张量算符**：在转动下按角动量 $k$ 的表示变换的算符族 $\hat T^k_q$（标量 $k=0$、矢量 $k=1$——偶极算符 $\hat{\mathbf r}$ 是 $k=1$ 的三分量）。

**定理（Wigner–Eckart）**

$$
\langle \alpha' j'm'|\hat T^k_q|\alpha jm\rangle = \langle jm; kq|j'm'\rangle\,\langle\alpha'j'\|\hat T^k\|\alpha j\rangle
$$

——矩阵元 = **CG 系数（纯几何，查表）× 约化矩阵元（纯动力学，一个数）**。
**【骨架】** 对易关系 $[\hat J_\pm, \hat T^k_q]$ 与 CG 的递推完全同构 ⇒ $m$-依赖被对称性完全锁死。$\blacksquare$

**读法（分工宣言）**：**对称性管"形状"、动力学只出"一个整体系数"**——$(2j+1)(2j'+1)$ 个矩阵元只有 1 个自由参数。直接红利：**选择定则**（CG 为零即禁戒——qm-04 的 $\Delta\ell = \pm1, \Delta m = 0,\pm1$ 是 $k=1$ 的三角规则，出厂证明在此）；光谱强度比（同一多重态内的分支比 = CG 平方比——不做任何积分）。**方法论输出**：这是"对称性约束 + 少量待定常数"这一现代物理总策略的原型（有效场论、规范理论（pp-01）同款思维）。

## 4. 练习与要点

**例 1（CG 亲手构造）** $\frac12\otimes\frac12$：从 $|11\rangle = |\!\uparrow\uparrow\rangle$ 起降一级得 $|10\rangle = \frac{1}{\sqrt2}(|\!\uparrow\downarrow\rangle + |\!\downarrow\uparrow\rangle)$，正交补出 $|00\rangle$——五分钟把算法走通（§2 样板的全部系数到手）。

**例 2（选择定则速判）** 氢 $3d \to 1s$ 偶极跃迁？$\Delta\ell = 2$——CG 三角规则 $(2, 1, 0)$ 不成立 ⇒ 禁戒（只能双光子或级联）——亚稳态与激光介质选材的判据。

**例 3（投影定理应用）** 在固定 $j$ 子空间内任何矢量算符 $\propto \hat{\mathbf J}$（W–E 的 $k=1$ 特例）：Landé g 因子 $g_J = 1 + \frac{j(j+1)+s(s+1)-\ell(\ell+1)}{2j(j+1)}$ 由 $\hat{\boldsymbol\mu}\cdot\hat{\mathbf J}$ 投影一行导出——反常 Zeeman 谱的钥匙，"几何吃掉计算"的示范。$\blacksquare$

---

*下一页：量子力学的"实验接口"——散射理论：分波法与 Born 近似，从截面读出相互作用。*
