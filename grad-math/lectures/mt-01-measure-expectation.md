# 测度概率 I · 测度论语言与期望

> **对标**：Durrett *PTE* §1.1–1.6 ｜ **前置**：本科实变 I–III、概率 I–IV
> 本页把本科概率的语言全面升级为测度论版本，并配齐三件研究生日常武器：π–λ 定理（"在生成元上验证就够了"的执照）、一致可积（$L^1$ 收敛的正确条件）、Borel–Cantelli（一切 a.s. 论证的起点）。

## 1. 概率空间与分布

概率空间 $(\Omega, \mathcal{F}, P)$ = 全测度为 1 的测度空间（实变 I 的理论整体继承）。随机变量 $X$ = 可测函数；其**分布** $\mu = P \circ X^{-1}$ 是 $(\mathbb{R}, \mathcal{B})$ 上的推前测度——"把概率从抽象空间搬到实数轴"，此后一切只与 $\mu$ 有关的问题都可以忘掉 $\Omega$（换元定理：$E[g(X)] = \int g\,d\mu$——本科 LOTUS 的正式版）。

**定理（π–λ / Dynkin）** π-系（对交封闭）$\mathcal{P}$ 生成的 σ-代数上，两个概率测度只要在 $\mathcal{P}$ 上相等就处处相等。
**【骨架】** 定义 λ-系（含 $\Omega$、对真差与单调升极限封闭）；验证"与固定 $A$ 相等的集合族"是 λ-系；引理"含 π-系的最小 λ-系 = 生成的 σ-代数"（对交封闭性逐层传递，两步交换论证）完成。$\blacksquare$
**用法（每天都在用却常不自知）**：分布函数决定分布（区间是 π-系）；独立性只需在生成元上验证（下一页）。**"σ-代数太大没法逐一验证"的万能解药。**

## 2. 期望 = Lebesgue 积分

三级构造（简单函数 → 非负取 sup → 拆正负部）与三大收敛定理（MCT / Fatou / DCT）整体**【引用】**实变 II——概率语言下逐字成立。研究生新增的关键概念是：

**定义（一致可积，UI）** 族 $\{X_i\}$ 一致可积：$\sup_i E\big[|X_i|\,\mathbb{1}_{|X_i| > M}\big] \to 0\ (M \to \infty)$——"尾部质量被一致地压住"。（充分条件：被同一可积变量控制；或 $\sup E|X_i|^{1+\varepsilon} < \infty$——后者是实战最常用的验证法。）

**定理（Vitali：$L^1$ 收敛的充要刻画）** $X_n \xrightarrow{P} X$ 时：$E|X_n - X| \to 0 \iff \{X_n\}$ 一致可积。
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
- 依概率 + UI ⇒ $L^1$（§2 Vitali）——补上图中缺的那条边。

## 5. 练习与要点

**例 1（BC-I 应用）** $X_n$ i.i.d. 标准正态，证 $\limsup \frac{X_n}{\sqrt{2\ln n}} \leq 1$ a.s.：尾界 $P(X_n > (1+\varepsilon)\sqrt{2\ln n}) \leq e^{-(1+\varepsilon)^2\ln n} = n^{-(1+\varepsilon)^2}$ 可和 ⇒ BC-I。（配合 BC-II 反向可证 $=1$——i.i.d. 正态的极值以 $\sqrt{2\ln n}$ 速度生长，极值理论第一课。）

**例 2（UI 判别）** $X_n \sim n\,\mathbb{1}_{(0, 1/n)}$（Fatou 反例）：$E[X_n \mathbb{1}_{X_n > M}] = 1\ (n > M)$——不一致可积 ✓ 与 $L^1$ 不收敛相符；而 $\sup E X_n^2 = n \to \infty$ 也印证"$1+\varepsilon$ 矩判据"失效。

**例 3（π–λ 用法）** 证明：$X, Y$ 的联合分布函数相等 ⇒ 联合分布相等——矩形族 $\{(-\infty,a]\times(-\infty,b]\}$ 是 π-系且生成 $\mathcal{B}(\mathbb{R}^2)$，π–λ 一步。$\blacksquare$

---

*下一页：独立性的正式理论与两大定律——Kolmogorov 0-1 律与强大数定律（四阶矩版全证）。*
