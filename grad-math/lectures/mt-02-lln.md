# 测度概率 II · 独立性与大数定律

> **对标**：Durrett *PTE* §2.1–2.4 ｜ **前置**：mt-01、本科概率 V
> 本页两座里程碑：**Kolmogorov 0-1 律**（尾事件没有中间地带）与**强大数定律**。SLLN 的四阶矩版本给全证——它是"BC 引理 + 截断思想"的教科书演出；一般 $L^1$ 版本给骨架并说明难点在哪。

## 1. 独立性的测度论定义

σ-代数族 $\{\mathcal{F}_i\}$ 独立：任取有限个、各取一事件，概率乘积分解。随机变量独立 = 各自生成的 σ-代数独立。

**定理（π-系判据）** 若各 $\mathcal{P}_i$ 是 π-系且在其上乘积分解成立，则 $\sigma(\mathcal{P}_i)$ 独立。
**【骨架】** 固定其余，对一个坐标用 π–λ（mt-01）升级到 σ-代数，逐坐标轮换。$\blacksquare$
**收益**：验证独立只需查分布函数分解（矩形是 π-系）——本科"密度乘积分解"判据的正式执照；且**独立性对"分组再加工"封闭**：$f(X_1,\dots,X_m) \perp g(X_{m+1},\dots)$（各自σ-代数的包含关系）。

## 2. Kolmogorov 0-1 律

**尾 σ-代数** $\mathcal{T} = \bigcap_n \sigma(X_n, X_{n+1}, \dots)$——"不依赖任何有限前缀"的事件（级数 $\sum X_n$ 收敛与否、$\limsup \frac{S_n}{n}$ 的值域事件、BC 的 i.o. 事件……）。

**定理** $\{X_n\}$ 独立 ⇒ 尾事件概率非 0 即 1。
**【证明】** 记 $\mathcal{F}_n = \sigma(X_1,\dots,X_n)$。① $\mathcal{F}_n \perp \sigma(X_{n+1},\dots) \supseteq \mathcal{T}$，故每个 $\mathcal{F}_n \perp \mathcal{T}$；② 于是 π-系 $\bigcup_n \mathcal{F}_n \perp \mathcal{T}$，π-系判据升级到 $\sigma(\bigcup\mathcal{F}_n) = \sigma(X_1, X_2, \dots) \perp \mathcal{T}$；③ 但 $\mathcal{T} \subseteq \sigma(X_1, X_2,\dots)$——**$\mathcal{T}$ 与自己独立**：$A \in \mathcal{T}$ 给 $P(A) = P(A \cap A) = P(A)^2$ ⇒ $P(A) \in \{0, 1\}$。$\blacksquare$

**读法**：独立序列的长期行为**没有"半概率"事件**——"$\frac{S_n}{n}$ 收敛"这类命题要么必然要么不可能（所以 SLLN 只需证"概率正"就自动升级为"概率 1"——0-1 律是大数定律的哲学背书）。"与自己独立"那步是全书最俏皮的三行。

## 3. 强大数定律

**定理（SLLN，四阶矩版）** $X_i$ i.i.d.，$EX_1 = \mu$，$EX_1^4 < \infty$，则 $\frac{S_n}{n} \to \mu$ a.s.
**【证明】** 不妨 $\mu = 0$。展开 $E S_n^4$：独立零均值使含单独一次幂的项全灭，仅存 $n$ 个 $EX_i^4$ 与 $3n(n-1)$ 个 $E X_i^2 X_j^2 = (EX^2)^2$ 项：

$$
E S_n^4 = n\,EX^4 + 3n(n-1)(EX^2)^2 \leq C n^2
$$

Markov（四次方版）：$P\big(|S_n/n| > \varepsilon\big) \leq \frac{ES_n^4}{n^4\varepsilon^4} \leq \frac{C}{n^2\varepsilon^4}$——**可和**！BC-I 给 $|S_n/n| > \varepsilon$ 只发生有限次（每个 $\varepsilon$），沿 $\varepsilon = 1/k$ 取交即 a.s. 收敛。$\blacksquare$

**方法论读出**（比定理本身更值钱）：二阶矩给 $1/n$ 衰减（不可和，只够弱大数）；**抬到四阶矩换来 $1/n^2$ 可和性**——"提高矩的阶数买 BC 的门票"是 a.s. 论证的标准交易；这也正是下门课（高维概率）"矩条件 ⇄ 尾部衰减"哲学的第一课。

**定理（Kolmogorov SLLN，最优版）** i.i.d. + $E|X_1| < \infty$ 即可（且 $E|X| = \infty$ 时必发散——条件精确）。
**【骨架】**（Etemadi 路线）① 正负部分拆，不妨 $X \geq 0$；② **截断** $Y_n = X_n\mathbb{1}_{X_n \leq n}$：$\sum P(X_n \neq Y_n) = \sum P(X > n) \leq E X < \infty$，BC-I 说两序列 a.s. 终同；③ 方差求和技巧 $\sum \frac{\mathrm{Var}(Y_n)}{n^2} < \infty$（关键估计：$\sum_{n \geq x} n^{-2} \leq C/x$ 与 Fubini 交换）；④ 沿几何子列 $n_k = \lfloor\alpha^k\rfloor$ 用 Chebyshev + BC-I 证子列收敛，再用非负性 + 单调性把子列间隙夹住；$\alpha \downarrow 1$ 收尾。$\blacksquare$
难点自白：③④ 的簿记是本页最重的技术活——骨架四步是可复述的，全文见 Durrett §2.4。

**配套武器【引用】**：Kolmogorov 极大不等式（$P(\max_{k\leq n}|S_k| > x) \leq \mathrm{Var}(S_n)/x^2$——Chebyshev 的"全程版"，mt-04 将由 Doob 不等式统一收编）；三级数定理（独立和 a.s. 收敛的充要三条件）。

## 4. 练习与要点

**例 1（0-1 律速判）** i.i.d. 非退化序列，"$X_n > 0$ i.o."：尾事件 + BC-II（$\sum P(X_n > 0) = \infty$）⇒ 概率 1。"收敛半径 $\limsup |X_n|^{1/n}$ 是常数 a.s."——尾函数 + 0-1 律推论（尾可测函数 a.s. 为常数）。

**例 2（矩条件的必要性体感）** Cauchy 分布（$E|X| = \infty$）：$\frac{S_n}{n}$ **仍是标准 Cauchy**（特征函数一行：$(e^{-|t|/n})^n = e^{-|t|}$）——永不收敛、永不集中：SLLN 的 $L^1$ 条件不是技术洁癖。

**例 3（蒙特卡洛的理论执照）** $\hat\theta_n = \frac1n\sum g(X_i)$（$E|g| < \infty$）a.s. 收敛于 $Eg$——SLLN 就是一切 MC 方法（本科数值 IV、你的模拟实验）的"终极正确性"声明；速率则要回到 CLT/集中不等式（下门课）。$\blacksquare$

---

*下一页：全书的心脏——条件期望的测度论定义与鞅：过滤、停时、可选停止定理。*
