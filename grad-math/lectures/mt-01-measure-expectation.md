# 测度概率 I · 测度论语言与期望

> **对标**：Durrett *PTE* §1.1–1.6 ｜ **前置**：本科实变 I–III、概率 I–IV
> 本页把本科概率的语言全面升级为测度论版本，并配齐三件研究生日常武器：π–λ 定理（"在生成元上验证就够了"的执照）、一致可积（在 $X_n\in L^1$、$X_n\to X$ 依概率时推出极限可积并给出 $L^1$ 收敛的条件）、Borel–Cantelli（一切 a.s. 论证的起点）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="expectation-learning-title">

<h2 id="expectation-learning-title">学习层：同一个期望，为什么有三种合法账本？</h2>

### 1. 先预测：把“取平均”拆成可审计的步骤

先不打开实验。考虑一个非负随机变量 $X$，以及一个可能变号的随机变量 $Y$，对下面三个判断各写下答案：

1. $X$ 用离散原子、密度或尾概率表示时，$\mathbb E X$ 是否只是同一个 Lebesgue 积分的三种坐标表达？
2. 若 $X_K=X\wedge K\uparrow X$，即使 $\mathbb E X=+\infty$，$\mathbb E X_K$ 能否单调上升到 $+\infty$？把极限与非负求和/积分交换是否需要先假设期望有限？
3. 若 $Y^+$ 与 $Y^-$ 的期望都为 $+\infty$，能否把“正负两边看起来对称”写成 $\mathbb E Y=0$？若只有正部分发散而负部分有限，结论应是未定义还是 $+\infty$？

这些问题把三个层次分开：表示法是建模选择，Tonelli/MCT 是非负极限的合法性证书，而 signed expectation 还要通过正负部的边界检查。

### 2. 最小模型：原子、密度、尾部三本账

对 $X\ge0$，三种表示分别是

$$
\mathbb E X=\sum_k x_kp_k,\qquad
\mathbb E X=\int_0^\infty x f_X(x)\,dx,\qquad
\mathbb E X=\int_0^\infty \mathbb P(X>t)\,dt.
$$

第一式要求 $\sum_kp_k=1$；第二式要求 $f_X$ 是相对于 Lebesgue 测度的密度；第三式是 layer-cake 公式，只对非负变量直接使用。实验用有限原子分布和 $\operatorname{Exp}(1)$ 密度作可复核样板：原子样本直接累加，密度样本做有限区间的确定性求积，尾部样本画 $\int_0^T\mathbb P(X>t)\,dt$，并把遗漏的尾部单独列出。

非负近似的核心账本是

$$
X_K=X\wedge K\uparrow X,\qquad
\mathbb E X_K\uparrow\mathbb E X.
$$

这是单调收敛定理；把非负函数写成 $\sum_n f_n$ 或把积分写成 $\int\int g$ 时，Tonelli 允许交换次序，即使两边的共同值是 $+\infty$。所以“每个有限截断都算出了一个数”与“极限是有限实数”必须分列记录。

### 3. 动手：把正负部也放进同一张总账

实验揭示后可切换原子、指数密度、尾积分、正的重尾和变号重尾；固定截断级别 $K$ 或尾部上限 $T$。图只展示有限截断的增长，表格则同时报告 $\mathbb E Y^+$、$\mathbb E Y^-$、$\mathbb E|Y|$ 与结论级别。

<div class="learning-lab" data-learning-lab="measure-expectation" markdown="1">

**无 JavaScript 时的静态读法：**原子样本取
$\mathbb P(X=0,1,2,4)=(1/2,1/4,1/8,1/8)$，所以
$\mathbb E X=1$。密度样本取 $f(x)=e^{-x}\mathbf1_{x\ge0}$，则
$\int_0^\infty xf(x)\,dx=1$，尾积分也给
$\int_0^\infty e^{-t}\,dt=1$；在有限上限 $T$ 时，尾账是 $1-e^{-T}$，不是已经完成的无限积分。

对 $p_k=c/k^2$、$c=6/\pi^2$：若 $X=k^2>0$，则
$\mathbb E X=+\infty$；若 $Y=(-1)^k k$，则
$\mathbb E Y^+=\mathbb E Y^-=+\infty$，所以 $\mathbb E Y$ 是未定义的 $\infty-\infty$，绝不能借对称性写成 $0$。

| 模型/账本 | 有限计算 | 定理级读法 | 边界 |
|---|---|---|---|
| 原子 $X$ | $\sum x_kp_k=1$ | 离散 LOTUS / Lebesgue 积分 | 要核对概率和为 $1$ |
| 指数密度 | $\int_0^T xe^{-x}\,dx$ | $T\to\infty$ 后为 $1$ | 有限 $T$ 还有尾部 |
| 尾积分 | $\int_0^T e^{-t}\,dt=1-e^{-T}$ | layer-cake 给 $\mathbb EX=1$ | 只对 $X\ge0$ 直接成立 |
| 正重尾 $k^2$ | $\mathbb E(X\wedge K)\uparrow+\infty$ | MCT/Tonelli 允许值为 $+\infty$ | 不属于 $L^1$ |
| 变号重尾 $(-1)^kk$ | 正负部截断都上升 | 两部都无限，signed 期望未定义 | “正负抵消”非法 |

</div>

### 4. 定理假设与失败边界

- **Tonelli** 只要求被积函数可测且非负；它保证交换后的共同值（允许为 $+\infty$）。对变号函数要用 Fubini，通常须先验证 $\int|f|<\infty$。不能把“正项级数可逐项相加”推广成任意交错项都能换序。
- **MCT** 要求 $X_K$ 可测、非负并且几乎处处单调上升到 $X$；它不保证极限期望有限。Fatou 只给下界不等式，不能无条件补成等式。
- 一般可积变量写成 $X=X^+-X^-$，其中 $\mathbb EX$ 作为有限实数至少要求 $\mathbb E|X|<\infty$；若仅有 $\mathbb EX^+<\infty$、$\mathbb EX^-=\infty$，扩展期望是 $-\infty$，反向类似为 $+\infty$；两部都无限则未定义。
- **Vitali/UI 的精确条件**：若每个 $X_n\in L^1$、$X_n\to X$ 依概率且 $\{X_n\}$ 一致可积，则 $X\in L^1$ 自动成立并且 $\mathbb E|X_n-X|\to0$，即 $L^1$ 收敛。反过来，若 $X\in L^1$ 且 $X_n\to X$ 在 $L^1$ 中，则 $\{X_n\}$ 一致可积。只写“依概率 + UI ⇒ $L^1$”而不说明这些可积性/极限条件，会把定理的适用域写宽。
- 计算器、有限截断和有限 Monte Carlo 只产生数值证据；它们不能决定 $K\to\infty$ 或 $T\to\infty$ 的量词，也不能把未定义的 $\infty-\infty$ 变成一个“稳定近零”的数。

</section>

## 1. 概率空间与分布

概率空间 $(\Omega, \mathcal{F}, P)$ = 全测度为 1 的测度空间（实变 I 的理论整体继承）。随机变量 $X$ = 可测函数；其**分布** $\mu = P \circ X^{-1}$ 是 $(\mathbb{R}, \mathcal{B})$ 上的推前测度——"把概率从抽象空间搬到实数轴"，此后一切只与 $\mu$ 有关的问题都可以忘掉 $\Omega$（换元定理：$E[g(X)] = \int g\,d\mu$——本科 LOTUS 的正式版）。

**定理（π–λ / Dynkin）** π-系（对交封闭）$\mathcal{P}$ 生成的 σ-代数上，两个概率测度只要在 $\mathcal{P}$ 上相等就处处相等。
**【骨架】** 定义 λ-系（含 $\Omega$、对真差与单调升极限封闭）；验证"与固定 $A$ 相等的集合族"是 λ-系；引理"含 π-系的最小 λ-系 = 生成的 σ-代数"（对交封闭性逐层传递，两步交换论证）完成。$\blacksquare$
**用法（每天都在用却常不自知）**：分布函数决定分布（区间是 π-系）；独立性只需在生成元上验证（下一页）。**"σ-代数太大没法逐一验证"的万能解药。**

## 2. 期望 = Lebesgue 积分

三级构造（简单函数 → 非负取 sup → 拆正负部）与三大收敛定理（MCT / Fatou / DCT）整体**【引用】**实变 II——概率语言下逐字成立。研究生新增的关键概念是：

**定义（一致可积，UI）** 族 $\{X_i\}$ 一致可积：$\sup_i E\big[|X_i|\,\mathbb{1}_{|X_i| > M}\big] \to 0\ (M \to \infty)$——"尾部质量被一致地压住"。（充分条件：被同一可积变量控制；或 $\sup E|X_i|^{1+\varepsilon} < \infty$——后者是实战最常用的验证法。）

**定理（Vitali：$L^1$ 收敛的充要刻画）** 若每个 $X_n\in L^1$ 且 $X_n \xrightarrow{P} X$，则

$$
X_n\xrightarrow{L^1}X \quad\Longleftrightarrow\quad \{X_n\}\text{ 一致可积}.
$$

右推左时 $X\in L^1$ 是结论，不必预先假设；左推右时 $L^1$ 收敛本身已包含 $X\in L^1$。
**【骨架】** （⇐）截断 $X_n$ 于 $M$：截断误差由 UI 一致控制，截断后的部分依概率收敛 + 有界 ⇒ DCT 收尾；（⇒）$L^1$ 收敛族的尾部由单个 $X$ 的尾部 + 收敛差控制。$\blacksquare$
**地位**：DCT 要"控制函数"，UI 只要"尾部一致小"——**取期望换极限的最弱实用条件**，鞅论（mt-04）与渐近统计到处是它。

## 3. Borel–Cantelli 引理

记 $\{A_n\ \text{i.o.}\} = \limsup A_n = \bigcap_N\bigcup_{n \geq N} A_n$（"无穷多个 $A_n$ 发生"）。

**定理（BC-I）** $\sum P(A_n) < \infty \Rightarrow P(A_n \text{ i.o.}) = 0$。
**【证明】** $P(\limsup A_n) \leq P\big(\bigcup_{n\geq N} A_n\big) \leq \sum_{n \geq N} P(A_n) \to 0$（收敛级数尾部）。$\blacksquare$

**定理（BC-II）** $\{A_n\}$ **独立**且 $\sum P(A_n) = \infty \Rightarrow P(A_n \text{ i.o.}) = 1$。
**【证明】** 对固定 $N$：$P\big(\bigcap_{n=N}^{M} A_n^c\big) = \prod (1 - P(A_n)) \leq \exp\big(-\sum_N^M P(A_n)\big) \to 0$（用 $1 - x \leq e^{-x}$ 与级数发散）。故 $P\big(\bigcup_{n \geq N} A_n\big) = 1$ 对每个 $N$，取交即得。$\blacksquare$

**读法**：概率的可加性 + 一个级数判敛 = "无穷多次发生"的 0-1 判决（独立时是精确二分法）。**a.s. 结论的工业标准起手式**：想证 $X_n \to X$ a.s.，验证 $\sum P(|X_n - X| > \varepsilon) < \infty$（"完全收敛"）即可。

## 4. 收敛方式全图（研究生版）

本科概率 V 的收敛图升级版，关系与反例配齐：

$$
\text{a.s.} \;\Rightarrow\; \text{依概率} \;\Rightarrow\; \text{依分布}; \qquad L^p \Rightarrow \text{依概率}
$$

- a.s. 与 $L^p$ 互不蕴含（反例：滑动的高瘦块 $n\mathbb{1}_{(0,1/n)}$ 是 a.s.→0 但 $L^1$ 不收敛；"打字机序列"$\mathbb{1}$ 块扫过 $[0,1]$ 是 $L^1$→0 但处处不 a.s. 收敛——**两个反例是本页必背**）；
- 依概率 ⇒ 有 a.s. 收敛子列（实变 III 已证）；
- 若每个 $X_n\in L^1$、$X_n\to X$ 依概率且族一致可积，则由 §2 Vitali 得 $X\in L^1$ 且 $X_n\to X$ 于 $L^1$——补上图中缺的那条边。

## 5. 练习与要点

**例 1（BC-I 应用）** $X_n$ i.i.d. 标准正态，证 $\limsup \frac{X_n}{\sqrt{2\ln n}} \leq 1$ a.s.：尾界 $P(X_n > (1+\varepsilon)\sqrt{2\ln n}) \leq e^{-(1+\varepsilon)^2\ln n} = n^{-(1+\varepsilon)^2}$ 可和 ⇒ BC-I。（配合 BC-II 反向可证 $=1$——i.i.d. 正态的极值以 $\sqrt{2\ln n}$ 速度生长，极值理论第一课。）

**例 2（UI 判别）** $X_n \sim n\,\mathbb{1}_{(0, 1/n)}$（Fatou 反例）：$E[X_n \mathbb{1}_{X_n > M}] = 1\ (n > M)$——不一致可积 ✓ 与 $L^1$ 不收敛相符；而 $\sup E X_n^2 = n \to \infty$ 也印证"$1+\varepsilon$ 矩判据"失效。

**例 3（π–λ 用法）** 证明：$X, Y$ 的联合分布函数相等 ⇒ 联合分布相等——矩形族 $\{(-\infty,a]\times(-\infty,b]\}$ 是 π-系且生成 $\mathcal{B}(\mathbb{R}^2)$，π–λ 一步。$\blacksquare$

---

*下一页：独立性的正式理论与两大定律——Kolmogorov 0-1 律与强大数定律（四阶矩版全证）。*
