# 场论 I · 经典场与正则量子化

> **对标**：Peskin & Schroeder §2 ｜ **前置**：mech-02/04、qm-02（升降算符——本页的主角）、sr-01
> 量子场论 = 狭义相对论 + 量子力学的唯一和解方案。核心构造一句话：**场 = 每个动量模式一个谐振子；粒子 = 振子的激发量子**。本页对最简单的 Klein–Gordon 场把这句话完整推演——qm-02 升降算符的投资在此获得最大一笔分红。

## 1. 为什么必须是"场"

单粒子相对论量子力学自败：$E = \pm\sqrt{p^2c^2 + m^2c^4}$ 的负能解无法丢弃（完备性）；因果性出漏（传播幅在类空间隔外不严格为零）；且 $E = mc^2$ 允许**粒子数改变**（对撞造新粒子——实验日常）——单粒子的 Hilbert 空间装不下。**出路**：把"粒子"降级为派生概念、把**场**升为基本对象——粒子数可变、反粒子自动出现、因果性由场的对易结构保证（§3）。

## 2. 经典场的拉格朗日力学

场论 = 无穷维的 mech-02：拉氏密度 $\mathcal L(\phi, \partial_\mu\phi)$，作用量 $S = \int\mathcal L\,d^4x$，Euler–Lagrange：

$$
\partial_\mu\frac{\partial\mathcal L}{\partial(\partial_\mu\phi)} - \frac{\partial\mathcal L}{\partial\phi} = 0
$$

**Klein–Gordon 场**（最简相对论标量场，自然单位 $\hbar = c = 1$，mp-01 的货币）：

$$
\mathcal L = \frac12\partial_\mu\phi\,\partial^\mu\phi - \frac12 m^2\phi^2 \;\Rightarrow\; (\Box + m^2)\phi = 0
$$

平面波解的色散 $\omega_{\mathbf k}^2 = \mathbf k^2 + m^2$——**场是耦合谐振子的连续极限**（solid-01 弹簧链 $\to$ 连续介质：色散关系里 $m$ 是"光学支的隙"——凝聚态与场论互为极限的第一照面）。**Noether 定理的场版**（mech-02 平移到场）：时空平移 ⇒ 能动张量守恒；内部相位对称 ⇒ 荷守恒（复场 $\phi \to e^{i\alpha}\phi$ 给出"电荷"——pp-01 规范原理的种子）。

## 3. 正则量子化（本页主菜）

**流程（qm-02 的仪式放大到无穷维）**：正则动量 $\pi = \dot\phi$、等时对易关系 $[\phi(\mathbf x), \pi(\mathbf y)] = i\delta^3(\mathbf x - \mathbf y)$（mech-03 字典的场版）；按模式展开：

$$
\phi(\mathbf x) = \int\frac{d^3k}{(2\pi)^3\sqrt{2\omega_{\mathbf k}}}\Big(a_{\mathbf k}e^{i\mathbf k\cdot\mathbf x} + a^\dagger_{\mathbf k}e^{-i\mathbf k\cdot\mathbf x}\Big)
$$

**【推导】** 对易关系换算成 $[a_{\mathbf k}, a^\dagger_{\mathbf k'}] = (2\pi)^3\delta^3(\mathbf k - \mathbf k')$——**每个 $\mathbf k$ 一套升降算符**；哈密顿量对角化为

$$
\hat H = \int\frac{d^3k}{(2\pi)^3}\,\omega_{\mathbf k}\Big(a^\dagger_{\mathbf k}a_{\mathbf k} + \frac12\Big)
$$

$\blacksquare$ **世界观交割**：真空 $|0\rangle$（一切 $a|0\rangle = 0$）；**粒子 = $a^\dagger_{\mathbf k}|0\rangle$**（能量 $\omega_{\mathbf k}$、动量 $\mathbf k$ 的激发量子——"粒子"从本体降为场的音符）；多粒子态自动对称（$a^\dagger$ 互相对易）——**玻色统计不是假设是推论**（自旋-统计定理的一半；费米场用反对易子给出另一半——qm-03/sm-03 的欠条在场论层面结清）。负能解的安置：$a^\dagger$ 系数携带正能反粒子——复场时 $e^{+i\omega t}$ 模式 = **反粒子的产生**：Dirac 之谜的现代答案。

**真空能一嘴**：$\int\frac12\omega_{\mathbf k}$ 发散——第一次撞见紫外无穷（能量差可测：Casimir 力 ✓ qm-02 例 3；引力语境则成宇宙学常数问题【第三档边界，如实标注】）；处理哲学（只有差值可测/正规排序）是 qft-03 重整化的序曲。

## 4. 传播子（通往 Feynman 图的接口）

**Feynman 传播子**：$D_F(x - y) = \langle0|T\phi(x)\phi(y)|0\rangle$（时序真空关联——"场在真空里的涟漪如何传播"）：

$$
\tilde D_F(k) = \frac{i}{k^2 - m^2 + i\epsilon}
$$

**【骨架】** 模式展开代入 + 时序的阶跃函数积分表示；$i\epsilon$ 处方 = 围道绕极点的选择（复变 III 留数在场论的岗位）= 因果边界条件（mp-01 推迟 Green 函数的量子亲戚）。$\blacksquare$ 静态极限对账：交换该传播子 ⇒ Yukawa 势 $\frac{e^{-mr}}{r}$（aqm-02 Born 近似的 $\frac{1}{q^2 + m^2}$ 认祖归宗）——**"力 = 交换虚粒子"的定量出生地**；下一页它是 Feynman 图的内线。

## 5. 练习与要点

**例 1（量纲体操）** 自然单位下 $[\mathcal L] = 4$（质量量纲）⇒ $[\phi] = 1$、$[m^2\phi^2]$ ✓、耦合 $\lambda\phi^4$ 的 $[\lambda] = 0$（无量纲——qft-03 可重整性判据的量纲预演）——一分钟学会场论的量纲速算。

**例 2（Noether 荷亲算）** 复 KG 场 $\phi \to e^{i\alpha}\phi$：$j^\mu = i(\phi^*\partial^\mu\phi - \phi\partial^\mu\phi^*)$，验证 $\partial_\mu j^\mu = 0$（用运动方程两行）——"电荷守恒 = 相位对称"的手算版。

**例 3（盒子归一化对账）** 把连续 $\int d^3k$ 换成盒中求和重推 $\hat H$：与 solid-01 声子气逐项同构——**"声子与介子是同一数学的两次上演"**：凝聚态与高能共享语法的直接体验。$\blacksquare$

---

*下一页：让场相互作用——微扰展开、Wick 定理与 Feynman 图：把"算散射"变成"画图查规则"。*
