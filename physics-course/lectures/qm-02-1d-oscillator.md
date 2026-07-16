# 量子 II · 一维问题与谐振子

> **对标**：Griffiths §2 ｜ **前置**：qm-01、ode-02
> 一维定态问题是量子直觉的训练场：束缚态的量子化、隧穿的指数律。压轴是**谐振子的升降算符解法**——不解任何微分方程、纯代数摘下全部能谱：量子力学最优雅的三页纸，也是场论（qft-01"粒子 = 激发量子"）的原型。

## 1. 一维方法论与三个标准问题

定态方程 $-\frac{\hbar^2}{2m}\psi'' + V\psi = E\psi$。**通用直觉**：$E > V$ 区振荡、$E < V$ 区指数（经典禁区衰减尾）；束缚态要求归一化 ⇒ **边界条件挑出离散谱**（pde-01"边界量子化频率"的量子重演）；一维束缚态无简并、基态无节点、第 $n$ 态 $n$ 个节点【引用】。

**无限深方阱**：$\psi_n = \sqrt{\frac2L}\sin\frac{n\pi x}{L}$，$E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}$——"驻波量子化"最裸露的样本；$E_1 > 0$：**零点能**（不确定性原理不许静止，qm-01 例 2 同源）。

**有限深阱**：阱外指数尾——波函数**渗入经典禁区**；束缚态条件化为超越方程（图解法——数值 III 求根的物理练习）。

**隧穿【推导骨架】**：方势垒中 $\psi \sim e^{-\kappa x}$（$\kappa = \sqrt{2m(V_0 - E)}/\hbar$），透射率

$$
T \sim e^{-2\kappa a}
$$

——**对势垒宽度与高度指数敏感**。收租清单：α 衰变（Gamow：寿命跨 20 个数量级由指数解释）、扫描隧道显微镜（STM：距离变 1 Å 电流变一个量级——原子成像的灵敏度来源）、闪存写入、太阳核聚变（质子靠隧穿越过库仑壁——**太阳发光靠量子隧穿**）。

## 2. 谐振子：升降算符（本页主菜）

$\hat H = \frac{\hat p^2}{2m} + \frac12m\omega^2\hat x^2$。**定义**：

$$
\hat a = \sqrt{\frac{m\omega}{2\hbar}}\Big(\hat x + \frac{i\hat p}{m\omega}\Big), \qquad [\hat a, \hat a^\dagger] = 1 \quad (\text{由 } [\hat x,\hat p] = i\hbar \text{ 一行})
$$

**【推导（纯代数摘谱）】** $\hat H = \hbar\omega\big(\hat a^\dagger\hat a + \frac12\big)$（直接展开）。记数算符 $\hat n = \hat a^\dagger\hat a$：对易子给 $\hat n(\hat a^\dagger|\nu\rangle) = (\nu + 1)(\hat a^\dagger|\nu\rangle)$——$\hat a^\dagger$ **升一级**、$\hat a$ 降一级；非负性 $\nu = \|\hat a|\nu\rangle\|^2 \geq 0$ 要求阶梯有底 ⇒ 存在 $\hat a|0\rangle = 0$ 的基态、谱为非负整数：

$$
E_n = \hbar\omega\Big(n + \frac12\Big), \qquad n = 0, 1, 2, \dots
$$

$\blacksquare$（基态波函数由 $\hat a|0\rangle = 0$ 的一阶 ODE 解出——高斯 $e^{-m\omega x^2/2\hbar}$；激发态 $= (\hat a^\dagger)^n|0\rangle/\sqrt{n!}$——Hermite 函数不请自来。）

**为什么这页纸重要到超出谐振子**：

- **等间隔能级 $\hbar\omega$** ⇒ 能量以"份"存取——**量子（quantum）一词的实体**；黑体辐射 Planck 假设（sm-03）的力学基础；
- 任何势的极小值附近 ≈ 谐振子（Taylor 二阶，mech-04 小振动的量子版）——分子振动光谱、晶格声子（solid-01）全是它；
- **场论的原型**（qft-01 的预告）：电磁场 = 无穷多谐振子（每个模式一个，opt/em 的简正模），$\hat a^\dagger$ = "产生一个光子"——**粒子是场的激发量子**这句现代物理总纲，语法就是本页的升降算符。

## 3. 练习与要点

**例 1（代数法算矩阵元）** $\langle n|\hat x^2|n\rangle$：$\hat x = \sqrt{\frac{\hbar}{2m\omega}}(\hat a + \hat a^\dagger)$ 展开、只留不改变 $n$ 的组合（$\hat a\hat a^\dagger + \hat a^\dagger\hat a = 2\hat n + 1$）⇒ $= \frac{\hbar}{m\omega}\big(n + \frac12\big)$——验证基态恰饱和不确定性下限 $\sigma_x\sigma_p = \frac\hbar2$（**高斯态是最小不确定态**——信息论 III 高斯最大熵的量子亲戚）。

**例 2（隧穿数量级）** 电子、势垒 1 eV、宽 0.5 nm：$\kappa \approx 5.1\ \mathrm{nm}^{-1}$，$T \sim e^{-5.1} \approx 0.6\%$；宽度加倍 → $T \sim 4\times10^{-5}$——STM 灵敏度与闪存漏电的同一笔账。

**例 3（零点能实证）** 液氦常压不固化（零点振动能 > 晶格束缚）；Casimir 力（真空零点能的边界依赖——两块金属板被"真空压"到一起，已测量【引用】）——$\frac12\hbar\omega$ 不是记号游戏。$\blacksquare$

---

*下一页：转入三维——角动量的代数、氢原子的完整求解与自旋：元素周期表从三个量子数里长出来。*
