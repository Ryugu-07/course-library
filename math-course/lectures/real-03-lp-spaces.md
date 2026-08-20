# 实变 III · $L^p$ 空间

> 实变的收官动作是"升维视角"：不再看单个函数，而把**可积函数全体组织成空间**——$L^p$。两把不等式（Hölder、Minkowski）给它范数，完备性定理（Riesz–Fischer）给它 Banach 空间身份，$L^2$ 更兼得内积成为 Hilbert 空间——泛函分析的三大主角原型全部在此出场，本页即两门课的交接仪式。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：同一个向量，换测度会换几何

### 1. 预测门：p 增大到底往哪边走？

在三点空间 $E=\{1,2,3\}$ 上固定 $f=(1,2,4)$、$g=(2,1,3)$。先预测再揭晓：概率测度 $\mu_i=1/3$ 与计数测度 $\nu_i=1$ 下的 $L^p$ 曲线是否同向？$p\to\infty$ 会留下什么？Hölder/Minkowski 何时取等？交互实验逐项回答后才显示数值 SVG 和账本。

### 2. 纯几何账本：归一化不能藏在记号里

有限离散测度的统一写法是

$$
\|f\|_{p,\omega}=\left(\sum_{i=1}^n\omega_i|f_i|^p\right)^{1/p},
\qquad \|f\|_{\infty,\omega}=\max_i|f_i|
$$

其中概率测度取 $\omega_i=1/n$，计数测度取 $\omega_i=1$。更一般地，在 $\mu(E)<\infty$ 且 $p<q$ 时，Hölder 给出明确因子

$$
\|f\|_{p,\mu}\leq \mu(E)^{1/p-1/q}\|f\|_{q,\mu}.
$$

所以 $\mu(E)=1$ 时范数随 $p$ 增大单调不减；$n$ 点计数测度则带着 $n^{1/p-1/q}$ 的维数因子，不能把概率空间的直觉逐字搬过来。对均匀概率/计数这两个版本，逐个 $p$ 都满足

$$
\|f\|_{p,\mathrm{count}}=n^{1/p}\|f\|_{p,\mathrm{prob}};
$$

而 $p\to\infty$ 两者都回到 $\max_i|f_i|$。

### 3. Hölder、Minkowski 与等号条件

实验以 $q=p/(p-1)$（端点 $1\leftrightarrow\infty$）同时检查

$$
\sum_i\omega_i|f_ig_i|\leq\|f\|_p\|g\|_q,
\qquad
\|f+g\|_p\leq\|f\|_p+\|g\|_p.
$$

在 $1<p,q<\infty$ 且两边非零时，Hölder 取等当且仅当归一化的 $|f|^p$ 与 $|g|^q$ 在测度意义下相同（等价地 $|f|^p=c|g|^q$ a.e.，并处理共同支撑）；$p=1,\infty$ 要改用支撑/上确界条件。对实值 $1<p<\infty$，Minkowski 取等的典型条件是 $f,g$ a.e. 同向的非负倍数；端点 $p=1$ 的等号条件更宽。实验的等号预设只验证这些条件在有限模型中的充分/必要数值表现，不替代一般证明。

### 4. 边界、反例与迁移

- 有限离散图形只示范范数、支撑和等号的几何；它**不证明 Riesz--Fischer 完备性**，后者仍需一般测度空间中的抽子列、级数控制与 Fatou 论证。
- “简单、连续、光滑都稠密”必须带底空间条件：简单函数在 $L^p$（$1\leq p<\infty$）中一般可用来逼近；若 $E$ 是合适拓扑空间、测度是 Radon/正则，$C_c(E)$ 才有相应稠密性；在开集 $E\subset\mathbb R^d$ 的 Lebesgue 测度上，$C_c^\infty(E)$ 在 $L^p$（$p<\infty$）中稠密。$L^\infty$ 的范数稠密性另有边界，不能顺手补上。
- 无限测度空间没有统一的“高指数控制低指数”结论：$(0,1)$ 上的尖峰与 $(1,\infty)$ 上的长尾可分别破坏包含关系。迁移到一般 $L^p(E,\mu)$ 时，先写出 $\mu(E)$、测度正则性与 $p$ 的端点，再决定哪一条有限维直觉还保留。

<div class="learning-lab" data-learning-lab="lp-geometry" markdown="1">

**JavaScript 失效时的静态 fallback：**默认 $f=(1,2,4)$、$g=(2,1,3)$、$p=q=2$。概率测度下

$$
\|f\|_2=\sqrt7\approx2.646,\quad
\|g\|_2=\sqrt{14/3}\approx2.160,\quad
\sum_i\mu_i|f_ig_i|=16/3\approx5.333
$$

而计数测度下对应的三项是 $\sqrt{21}\approx4.583$、$\sqrt{14}\approx3.742$、$16$；两种测度的范数比为 $3^{1/2}$。两边都满足 Hölder 与 Minkowski，且 $p=\infty$ 时都回到 $4$。常数向量 $(1,1,1)$ 是归一化反例：概率范数在 $p=1,2,\infty$ 都是 $1$，计数范数依次是 $3,\sqrt3,1$。等号预设分别使用同向向量检验 Hölder/Minkowski；答案、维数因子和每一行 gap 会在预测门通过后由 SVG/账本显示。

</div>

</section>

## 1. 定义与两把不等式

**定义** $1 \leq p < \infty$：

$$
L^p(E) = \Big\{f \text{ 可测}: \|f\|_p = \Big(\int_E |f|^p\Big)^{1/p} < \infty\Big\}
$$

（$p = \infty$：$\|f\|_\infty$ = 本性上确界——a.e. 意义的最大值。a.e. 相等视为同一元素，实变 II 的等价类约定。）

**Hölder 不等式**（$\frac1p + \frac1q = 1$，共轭指数）：

$$
\int |fg| \leq \|f\|_p\, \|g\|_q
$$

（$p = q = 2$ 时即 Cauchy–Schwarz——高代 VI/概率 IV 那把不等式的积分版；证明用 Young 不等式 $ab \leq \frac{a^p}{p} + \frac{b^q}{q}$，凸性的一行应用——优化 I。）

**Minkowski 不等式**（$L^p$ 的三角不等式）：$\|f + g\|_p \leq \|f\|_p + \|g\|_p$（由 Hölder 推出）。至此 $\|\cdot\|_p$ 是合法**范数**，$L^p$ 是赋范线性空间。

**包含关系**（仅在**有限测度**空间上）：若 $p < q$，则

$$
\|f\|_{p}\leq \mu(E)^{1/p-1/q}\|f\|_{q},\qquad L^q(E)\subset L^p(E).
$$

在概率空间 $\mu(E)=1$ 上这给出“高指数范数不小于低指数范数”；在 $n$ 点计数测度上必须保留 $n^{1/p-1/q}$。⚠️ 全直线上不成立（长尾与尖峰各管一头：$\frac{1}{\sqrt x}\mathbb{1}_{(0,1)} \in L^1\setminus L^2$，$\frac1x\mathbb{1}_{(1,\infty)} \in L^2 \setminus L^1$）。

## 2. 完备性：Riesz–Fischer 定理

**定理** $L^p$（$1 \leq p \leq \infty$）是**完备**的赋范空间（Banach 空间）：Cauchy 列必收敛到空间内的元素。

*证明思路*：Cauchy 列抽子列使相邻距离 $< 2^{-k}$，级数比较 + MCT（实变 II）造出极限函数，再 Fatou 收尾。**这条定理是 Lebesgue 积分对 Riemann 的决定性胜利**：Riemann 可积函数按 $\|\cdot\|_p$ 不完备（极限会漏出去），Lebesgue 把洞全部补上——正如实数完备化有理数（数分 I 的故事在函数空间重演，这个类比是理解实变全课的钥匙）。

**稠密性**（带底空间条件的逼近工具箱）：简单函数在 $L^p$（$1\leq p<\infty$）中一般稠密；若 $E$ 带合适拓扑且测度正则/Radon，则 $C_c(E)$ 才有相应稠密性；若 $E\subset\mathbb R^d$ 是开集并取 Lebesgue 测度，$C_c^\infty(E)$ 在 $L^p$（$p<\infty$）中稠密。不能把连续或光滑紧支函数的结论无条件推广到任意测度空间，也不能顺手声称它们在 $L^\infty$ 范数中稠密。

## 3. $L^2$：万王之王

$L^2$ 是唯一自带**内积**的 $L^p$：

$$
\langle f, g\rangle = \int f\,\bar g, \qquad \|f\|_2 = \sqrt{\langle f, f\rangle}
$$

完备内积空间 = **Hilbert 空间**——几何直觉（长度、角度、正交、投影）在无穷维完整复活的唯一舞台：

- **正交系**：$\{\frac{e^{inx}}{\sqrt{2\pi}}\}$ 是 $L^2[-\pi,\pi]$ 的标准正交基——**Fourier 级数 = $L^2$ 中的正交展开**（数分 IV 的收敛难题在 $L^2$ 范数下烟消云散：对一切 $L^2$ 函数,级数按 $\|\cdot\|_2$ 收敛）；
- **Parseval 等式** $\|f\|_2^2 = \sum |c_n|^2$——无穷维勾股定理（数分 IV 的预告兑现）；
- 概率语境：$L^2(\Omega, P)$ = 二阶矩有限的随机变量空间，复值情形的内积是 $\langle X, Y\rangle = E[X\,\overline{Y}]$（实值时退化为 $E[XY]$），**条件期望 = 正交投影**（概率 IV"最佳预测"的几何真身——投影定理的照面在泛函 II）。

🔗 **AI 衔接**：均方损失的最小化天然生活在 $L^2$；核方法的 RKHS（ai 课 02 Mercer 定理的舞台）是带再生核的 Hilbert 空间；"函数空间上的优化"（泛函分析视角的机器学习）以本页为起点。

## 4. 收官一瞥：依测度收敛与收敛关系图

四种收敛的关系（陈述级，考试画图题）：$L^p$ 收敛 ⇒ 依测度收敛（Chebyshev 式不等式）；a.e. 收敛（有限测度上）⇒ 依测度收敛（Egorov 定理背书：a.e. 收敛 = 去掉任意小测度集后一致收敛——"几乎一致"）；依测度收敛 ⇒ 有 a.e. 收敛的**子列**。与概率 V 那张收敛关系表逐条对应（依概率收敛就是依测度收敛的概率方言）——两张图合成一张记。

## 5. 典型例题

**例 1（Hölder 实战）** $[0,1]$ 上证明 $\|f\|_1 \leq \|f\|_2$：$\int|f|\cdot 1 \leq \|f\|_2\|1\|_2 = \|f\|_2$。（有限测度上"高指数控制低指数"的一行版。）

**例 2（归属判定）** $f(x) = \frac{1}{\sqrt{x}(1 + |\ln x|)}$ 在 $(0,1)$：$p = 2$ 时 $\int_0^1 \frac{dx}{x(1+|\ln x|)^2}$ 换元 $u = \ln x$ 得 $\int_{-\infty}^0\frac{du}{(1+|u|)^2} < \infty$ ⇒ $f \in L^2$；$p$ 略大于 2 即发散——**对数因子是 $L^p$ 归属的裁边料**。

**例 3（$L^2$ 正交展开）** 在 $L^2[-\pi, \pi]$ 中把 $f(x) = x$ 展开：$c_n$ 即 Fourier 系数 $b_n = \frac{2(-1)^{n+1}}{n}$，Parseval 给 $\sum \frac{4}{n^2} = \frac{1}{\pi}\int_{-\pi}^{\pi}x^2 dx = \frac{2\pi^2}{3}$ ⇒ $\sum\frac{1}{n^2} = \frac{\pi^2}{6}$——Basel 和的第三种证法（数分 IV、实变 II 之后），三条路线在此会师。$\blacksquare$

---

*实变三页完工：测度（长度的公理化）→ 积分（换序的自由）→ $L^p$（函数成为空间中的点）。下一门泛函分析顺势接棒：研究这些无穷维空间本身。*
