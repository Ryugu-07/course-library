# 高量 III · 路径积分与密度矩阵

> **对标**：Sakurai §2.6 / Feynman–Hibbs ｜ **前置**：mech-02（作用量）、qm-01、sc 线（数学站）
> 高量收官的两件现代武器：**路径积分**——量子力学的第三种表述（对一切历史求和），场论与统计物理的通用语言；**密度矩阵**——混合态与开放系统的语言，量子信息（qi 线）的记号地基，顺手回答"经典世界从哪来"（退相干）。


<figure class="diagram" markdown="1">
![路径积分：粒子的所有路径叠加，经典路径附近相位相长。](assets/img/aqm-03-path-integral.svg)
<figcaption><span class="fig-id">图 aqm-03.1</span>路径积分：粒子的所有路径叠加，经典路径附近相位相长。</figcaption>
</figure>

## 1. 路径积分：对一切历史求和

**命题（Feynman）** 传播子（$t_a \to t_b$ 的跃迁幅）：

$$
K(b, a) = \int\mathcal{D}[x(t)]\;e^{iS[x]/\hbar}
$$

——**对连接两端的一切路径求和，每条路径贡献相位 $e^{iS/\hbar}$**（$S$ = 经典作用量，mech-02 的主角）。

**【推导骨架（时间切片）】** 把 $e^{-i\hat Ht/\hbar}$ 切成 $N$ 段、每段插入位置完备基 $\int|x\rangle\langle x|dx$；单段幅用 $\langle x'|e^{-i(\hat p^2/2m + V)\epsilon/\hbar}|x\rangle$（Trotter 分解 + 动量高斯积分）= $e^{\frac{i\epsilon}{\hbar}[\frac{m}{2}(\frac{x'-x}{\epsilon})^2 - V]}$——指数上恰是 $L\,\epsilon$；连乘取极限即 $e^{iS/\hbar}$ 的路径积分。$\blacksquare$

**经典极限的一行解释**：$\hbar \to 0$ 时相位剧烈振荡、路径互相抵消，**唯有 $\delta S = 0$ 的驻相路径幸存**（mp-01 驻相法）——**最小作用量原理（mech-02）是量子干涉的宏观残影**：为什么自然界"走极值路径"的两百年之谜在此闭合。双缝干涉 = 两条路径的最小求和；AB 效应【引用】：矢势通过相位 $\frac{q}{\hbar}\oint\mathbf A\cdot d\boldsymbol\ell$ 影响干涉——规范势的物理实在性（pp-01 伏笔）。

**Wick 转动（跨界之桥）**：$t \to -i\tau$ 后 $e^{iS/\hbar} \to e^{-S_E/\hbar}$——**量子力学变成统计力学**（虚时传播子 = 配分函数：$Z = \mathrm{Tr}\,e^{-\beta\hat H}$ 是周期虚时的路径积分,温度 = 虚时周期的倒数）。这座桥的交通流量：量子蒙卡（comp-01）、场论的欧几里得方法（qft-03）、以及数学站 sc 线的 Feynman–Kac（同一公式的概率语言——三个学科在此共用一条隧道）。

## 2. 密度矩阵：混合态的语言

纯态不够用的两个场景：系综的统计混合（以概率 $p_i$ 制备 $|\psi_i\rangle$）、**纠缠系统的子系统**。

**定义**：$\hat\rho = \sum_i p_i|\psi_i\rangle\langle\psi_i|$；期望 $\langle A\rangle = \mathrm{Tr}(\hat\rho\hat A)$；性质：自伴、$\mathrm{Tr}\rho = 1$、半正定（矩阵分析 II 的 PSD 语言）。**纯度判据**：$\mathrm{Tr}\rho^2 = 1 \iff$ 纯态（$\rho^2 = \rho$ 即秩一投影）。演化：von Neumann 方程 $i\hbar\dot\rho = [\hat H, \rho]$（经典 Liouville 的量子版——mech-03 再对账）。热平衡态：$\rho = \frac{e^{-\beta\hat H}}{Z}$（sm-02 Boltzmann 的算符形态）。

**约化密度矩阵（纠缠的接口）**：复合系统 $|\Psi\rangle_{AB}$ 只看 A：$\rho_A = \mathrm{Tr}_B|\Psi\rangle\langle\Psi|$——**纠缠纯态的子系统是混合态**（信息在关联里而不在局部——qi-01 的中心事实）；纠缠熵 $S = -\mathrm{Tr}\rho_A\ln\rho_A$（von Neumann 熵——Shannon 熵（信息论线）的量子版：三条熵线在此三会）。

**退相干（"经典世界从哪来"的半个答案）【机制级】**：系统与环境纠缠 → 对环境取迹 → $\rho_A$ 的**非对角元（相干项）指数衰减**（环境"记录"了哪条路径 = 相位信息泄漏）；口袋里的猫态在 $\sim10^{-23}$ s 内退净【引用量级】——宏观叠加不是被禁止而是被**极速泄密**。测量问题的现代表述由此改写（残余的"选择基"问题仍开放——诚实边界）；量子计算的头号敌人（qi-03 纠错的对手）在此定性。

## 3. 练习与要点

**例 1（自由粒子传播子亲算）** 切片高斯积分逐层合成：$K \propto e^{\frac{im(x_b - x_a)^2}{2\hbar t}}$——指数恰是自由粒子经典作用量 $\frac{iS_{cl}}{\hbar}$（二次型拉氏量的普遍事实：路径积分 = 经典项 × 涨落行列式【引用】）。

**例 2（Bell 态的约化）** $|\Psi\rangle = \frac{1}{\sqrt2}(|\!\uparrow\downarrow\rangle - |\!\downarrow\uparrow\rangle)$：$\rho_A = \frac12 I$——**最大混合**（单看一边毫无信息）而全局是纯态：纠缠熵 $\ln 2$（一个 ebit）——qi-01 的第一笔账在此预付。

**例 3（Wick 桥体感）** 谐振子配分函数：虚时路径积分 = 周期边界的高斯积分 ⇒ $Z = \frac{1}{2\sinh(\beta\hbar\omega/2)}$——展开即 $\sum e^{-\beta\hbar\omega(n+1/2)}$ ✓（sm-02 的求和被一条积分再生产：桥是通车的）。$\blacksquare$

---

*下一门：经典电动力学（Jackson 主干）——把 em 三页升到研究生规格：边值问题的兵器谱与辐射的完整理论。*
