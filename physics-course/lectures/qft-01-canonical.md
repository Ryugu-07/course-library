# 场论 I · 经典场与正则量子化

> **对标**：Peskin & Schroeder §2 ｜ **前置**：mech-02/04、qm-02（升降算符——本页的主角）、sr-01
> 量子场论是把量子原理、狭义相对论与局域相互作用放进同一套语言的标准框架。核心构造一句话：**自由场 = 每个独立模式一个谐振子；粒子 = 振子的激发量子**。本页对最简单的 Klein–Gordon 场把这句话完整推演——qm-02 升降算符的投资在此获得最大一笔分红。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="canonical-field-learning-title">

## 学习层：先在有限盒里数清模式，再谈连续场

<h3 id="canonical-field-learning-title">1. 先预测：一个正则化模式到底贡献什么？</h3>

实验使用 $1$ 维周期有限盒中的**自由实标量场**，长度 $L$ 固定为有限值，只保留 $|n|\le K$ 的有限模式。先回答：

1. 每个独立实模式是不是一个能级为 $(q+\frac12)\omega$ 的谐振子？
2. cutoff $K$ 增大时，占据数贡献与零点项是否要分开记账？
3. 有限盒、有限模式的精确求和，是否已经等同于相互作用 QFT 的非微扰构造？
4. 对实场，$a^\dagger$ 是否还需要另一个独立的反粒子产生算符？

揭示前只保留问题；提交后才显示模式表、能级、占据数、零点能、cutoff 和交互 SVG。这个实验是从正则量子化走向连续记号的受控桥梁，不把桥梁冒充终点。

### 2. 静态后备：有限实模式的逐项账本

<div class="learning-lab" data-learning-lab="canonical-field-modes" markdown="1">

**JavaScript 失效时的静态读法：**取 $L=2\pi$、$m=1$、$K=3$。用独立实模式的壳标记 $n=0,1,2,3$，其中 $g_0=1$，$g_n=2$（$n>0$，对应 cosine/sine 两个实模式；不是把复场的 $+k$、$-k$ 再重复计数）。

$$
k_n=\frac{2\pi n}{L},\qquad
\omega_n=\sqrt{k_n^2+m^2},\qquad
E_{n,r}=\left(q_{n,r}+\frac12\right)\omega_n.
$$

对 cutoff 内的全部独立实振子，

$$
H_K=\sum_{n=0}^{K}\sum_{r=1}^{g_n}
\left(q_{n,r}+\frac12\right)\omega_n
=E_{\rm exc}(K)+E_0(K),
$$

其中 $E_{\rm exc}(K)=\sum q_{n,r}\omega_n$，$E_0(K)=\frac12\sum g_n\omega_n$。例如默认的“$n=1$ 单模激发”可读成：

| $n$ | $g_n$ | $k_n$ | $\omega_n$ | $q_{n,r}$ | 零点项 $\frac12g_n\omega_n$ | 占据项 $\sum_rq_{n,r}\omega_n$ |
|---:|---:|---:|---:|---|---:|---:|
| 0 | 1 | 0 | 1 | $[0]$ | 0.50000 | 0 |
| 1 | 2 | 1 | 1.41421 | $[1,0]$ | 1.41421 | 1.41421 |
| 2 | 2 | 2 | 2.23607 | $[0,0]$ | 2.23607 | 0 |
| 3 | 2 | 3 | 3.16228 | $[0,0]$ | 3.16228 | 0 |
| **合计** | **7** | $\Lambda=3$ | — | — | **$E_0\approx7.31256$** | **$E_{\rm exc}\approx1.41421$** |

所以 $H_K\approx8.72678$，并且 $H_K-E_0-E_{\rm exc}=0$ 是最重要的代数对账。改变 $K$ 会改变有限盒里的零点和 cutoff 账本；改变占据 profile 则改变激发项。这里没有相互作用项、没有连续极限，也没有声称构造了相互作用 QFT 的非微扰 Hilbert 空间。

**边界提醒：**实标量场的 $a^\dagger$ 产生同一种中性粒子；只有复标量场才用独立的 $a$ 与 $b^\dagger$ 分别记粒子与反粒子。玻色对易关系是量子化选择，并受相对论局域理论的 spin–statistics 约束；不能说它单凭 $a^\dagger$ 互相对易就被“推出来”。Feynman $i\varepsilon$ 是时序传播子的边界处方，不等同于 retarded Green 函数的因果支撑。

</div>

### 3. 四笔账不能合并

实验把每个 shell 的 $g_n$、$\omega_n$、占据数、单振子能级、零点项和占据项分开显示，再报告

$$
M_K=1+2K,\qquad
\Lambda=\frac{2\pi K}{L},\qquad
H_K-E_0(K)-E_{\rm exc}(K)=0.
$$

$M_K$ 是有限盒里独立实振子数；正负动量的计数已经被实基的 degeneracy 吸收。$E_0(K)$ 对 cutoff 敏感，而固定占据 profile 的 $E_{\rm exc}(K)$ 只有在 cutoff 包含所占据的模式后才保持不变。正规排序在这个自由、受监管的模型里可以理解为减去一个 c-number 零点项，但不等于已经处理了相互作用、重整化或非微扰构造。

</section>

## 1. 为什么必须是"场"

自由方程的正频解可以组成一个单粒子子空间，所以问题不能粗略说成“负能解因完备性绝对不能丢”。真正的张力来自三处：Klein–Gordon 密度不像 Schrödinger 概率密度那样处处正；正能量、严格局域化与相对论因果结构不能同时按非相对论直觉实现；更关键的是，相对论性相互作用允许**粒子数改变**（对撞产生新粒子），固定粒子数的单粒子 Hilbert 空间不足以描述这种过程。**出路**：把场作为基本算符、把粒子视为其激发——Fock 空间容纳可变粒子数，复场同时容纳粒子与反粒子。

还要分清“相关”与“传信”：Feynman 传播子在类空间隔可以非零，这本身不表示能够超光速发送信息；局域玻色场在类空间隔的交换子为零（费米场用反交换子的相应条件），即**微因果性**，才是局域可观测量互不影响的操作性保证。

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

上式的连续积分是形式记号；做 cutoff 时先放入有限盒，再选独立的实模式。对本页的 $1$ 维示范，$n=0$ 有一个实模式，$n>0$ 的 cosine/sine 两个实模式合起来代表一对正负动量，不再把 $\pm k$ 当成两套额外的复场自由度重复相加。

**【推导】** 对易关系换算成 $[a_{\mathbf k}, a^\dagger_{\mathbf k'}] = (2\pi)^3\delta^3(\mathbf k - \mathbf k')$——**每个独立实模式一套升降算符**；哈密顿量对角化为

$$
\hat H = \int\frac{d^3k}{(2\pi)^3}\,\omega_{\mathbf k}\Big(a^\dagger_{\mathbf k}a_{\mathbf k} + \frac12\Big)
$$

$\blacksquare$ **世界观交割**：真空 $|0\rangle$（$a_{\mathbf k}|0\rangle=0$）；对**实标量场**，$a^\dagger_{\mathbf k}|0\rangle$ 是一种中性粒子的激发，不能再从同一个实场拆出独立的反粒子。对**复标量场**，场展开含独立的 $a_{\mathbf k}$ 与 $b^\dagger_{\mathbf k}$：前者对应粒子，后者对应反粒子。玻色对易关系是量子化时选取的代数，并由相对论局域理论的 spin–statistics 定理约束；多粒子态的对称性不能表述为单凭 $a^\dagger$ 对易就被推出来。负频率项在复场中与独立的反粒子算符配对，这是粒子/反粒子区分的正确位置。

**真空能一嘴**：$\int\frac12\omega_{\mathbf k}$ 发散——第一次撞见紫外无穷（能量差可测：Casimir 力 ✓ qm-02 例 3；引力语境则成宇宙学常数问题【第三档边界，如实标注】）；处理哲学（只有差值可测/正规排序）是 qft-03 重整化的序曲。

## 4. 传播子（通往 Feynman 图的接口）

**Feynman 传播子**：$D_F(x - y) = \langle0|T\phi(x)\phi(y)|0\rangle$（时序真空关联——"场在真空里的涟漪如何传播"）：

$$
\tilde D_F(k) = \frac{i}{k^2 - m^2 + i\epsilon}
$$

**【骨架】** 模式展开代入 + 时序的阶跃函数积分表示；$i\epsilon$ 处方选择 Feynman 时序传播子的极点边界条件。它不是 retarded Green 函数的定义，也不应单独改写成“类空间隔外的推迟因果支撑”；后者要回到交换子和 retarded 解的因果结构。$\blacksquare$ 静态极限对账：交换该传播子 ⇒ Yukawa 势 $\frac{e^{-mr}}{r}$（aqm-02 Born 近似的 $\frac{1}{q^2 + m^2}$ 认祖归宗）——**"力 = 交换虚粒子"的定量出生地**；下一页它是 Feynman 图的内线。

## 5. 练习与要点

**例 1（量纲体操）** 自然单位下 $[\mathcal L] = 4$（质量量纲）⇒ $[\phi] = 1$、$[m^2\phi^2]$ ✓、耦合 $\lambda\phi^4$ 的 $[\lambda] = 0$（无量纲——qft-03 可重整性判据的量纲预演）——一分钟学会场论的量纲速算。

**例 2（Noether 荷亲算）** 复 KG 场 $\phi \to e^{i\alpha}\phi$：$j^\mu = i(\phi^*\partial^\mu\phi - \phi\partial^\mu\phi^*)$，验证 $\partial_\mu j^\mu = 0$（用运动方程两行）——"电荷守恒 = 相位对称"的手算版。

**例 3（盒子归一化对账）** 把连续 $\int d^3k$ 换成盒中求和重推 $\hat H$：与 solid-01 声子气逐项同构——**"声子与介子是同一数学的两次上演"**：凝聚态与高能共享语法的直接体验。$\blacksquare$

---

*下一页：让场相互作用——微扰展开、Wick 定理与 Feynman 图：把"算散射"变成"画图查规则"。*
