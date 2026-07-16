# 测度概率 IV · 鞅收敛与应用

> **对标**：Durrett *PTE* §4.2–4.7、§5.4 ｜ **前置**：mt-01–03
> 鞅论的丰收页：**上穿不等式 → 鞅收敛定理**（全证，本课程最优雅的证明链）、Doob 极大不等式、Azuma–Hoeffding。收尾把四页测度概率的资产盘点成表，交棒高维概率与随机分析。

## 1. 上穿不等式与鞅收敛定理

**思想**：数列不收敛 ⟺ 在某对有理数 $a < b$ 之间**上穿无穷次**。所以控制住上穿次数就控制住了收敛。

记 $U_n[a,b]$ = 到时刻 $n$ 为止完成的上穿次数（从 $\leq a$ 走到 $\geq b$ 算一次）。

**定理（Doob 上穿不等式）** 上鞅 $X$：

$$
(b - a)\,E\,U_n[a, b] \;\leq\; E\big[(X_n - a)^-\big]
$$

**【证明】** 构造赌博策略 $H_m \in \{0,1\}$：$X \leq a$ 后开仓持有、$X \geq b$ 后平仓（$H_m$ 由 $\mathcal{F}_{m-1}$ 决定——可预测）。策略收益 $(H\cdot X)_n = \sum H_m(X_m - X_{m-1})$：每次完整上穿至少赚 $(b-a)$，未完成的最后一段亏损至多 $(X_n - a)^-$，故 $(H\cdot X)_n \geq (b-a)U_n - (X_n - a)^-$。另一方面**对上鞅的可预测非负策略收益仍是上鞅**（取出已知，一行）⇒ $E(H\cdot X)_n \leq 0$。移项即得。$\blacksquare$
（读法：**"在下跌趋势的市场里做波段，期望不可能为正"**——不等式的字面意义。）

**定理（鞅收敛定理）** $L^1$ 有界的上鞅（$\sup_n E|X_n| < \infty$）a.s. 收敛于某可积 $X_\infty$。
**【证明】** 对每对有理 $a<b$：上穿不等式给 $E U_\infty[a,b] \leq \frac{\sup E|X_n| + |a|}{b - a} < \infty$ ⇒ $U_\infty < \infty$ a.s.；对可数对有理数取并：不收敛事件（= 某对 $(a,b)$ 上穿无穷次）概率零；极限有限性由 Fatou：$E|X_\infty| \leq \liminf E|X_n| < \infty$。$\blacksquare$

**推论**：非负上鞅必 a.s. 收敛（自动 $L^1$ 有界）。⚠️ **a.s. 收敛 ≠ $L^1$ 收敛**：临界分支过程 $Z_n/\mu^n \to 0$ a.s. 但期望恒 1——质量逃逸重演；**$L^1$ 收敛的充要条件是一致可积**（mt-01 §2 在此收租），UI 鞅还满足 $X_n = E[X_\infty \mid \mathcal{F}_n]$（"每个 UI 鞅都是 Doob 鞅"——Lévy 向上定理，**【骨架】**：UI + a.s. ⇒ $L^1$，局部平均性质过极限）。

## 2. Doob 极大不等式

**定理** 非负下鞅 $X$：$\displaystyle P\Big(\max_{k \leq n} X_k \geq \lambda\Big) \leq \frac{E X_n}{\lambda}$。
**【证明】** $\tau$ = 首次 $X_k \geq \lambda$（停时）。$\{\max \geq \lambda\} = \{\tau \leq n\}$，且其上 $X_\tau \geq \lambda$：

$$
\lambda P(\tau \leq n) \leq E[X_\tau \mathbb{1}_{\tau \leq n}] \leq E[X_n \mathbb{1}_{\tau \leq n}] \leq E X_n
$$

中间不等号用下鞅的 OST 变体（$E[X_n \mid \mathcal{F}_\tau] \geq X_\tau$ 于 $\{\tau \leq n\}$）。$\blacksquare$
**读法**：**全程最大值只比终点贵一个 Markov 不等式**——鞅结构把"每一步都要控制"压缩成"只控制最后一步"（Kolmogorov 极大不等式是 $X = S_n^2$ 的特例，mt-02 的欠条清偿）。$L^p$ 版【引用】：$\|\max_{k\leq n} X_k\|_p \leq \frac{p}{p-1}\|X_n\|_p$（$p>1$）。

## 3. Azuma–Hoeffding：鞅版集中不等式

**定理** 鞅 $X$ 增量有界 $|X_k - X_{k-1}| \leq c_k$，则

$$
P\big(|X_n - X_0| \geq t\big) \leq 2\exp\Big(-\frac{t^2}{2\sum_k c_k^2}\Big)
$$

**【骨架】** 指数鞅法三步：① 条件 Hoeffding 引理——有界零均值增量满足 $E[e^{\theta\Delta}\mid\mathcal{F}] \leq e^{\theta^2c^2/2}$（凸性插值，两行）；② 迭代条件化得 $E e^{\theta(X_n - X_0)} \leq e^{\theta^2\sum c_k^2/2}$；③ Chernoff：Markov 于 $e^{\theta X}$ 再对 $\theta$ 优化。$\blacksquare$

**应用范式（McDiarmid 差分有界法）**：任何"改动单个输入至多改变 $c$"的函数 $f(X_1,\dots,X_n)$（独立输入），对 Doob 鞅 $M_k = E[f\mid\mathcal{F}_k]$ 用 Azuma ⇒ $f$ 以 $e^{-2t^2/\sum c_i^2}$ 速率集中于均值——**不需要任何分布细节，只要"没有单点能翻盘"**。统计学习理论泛化界（slt 线）与随机图论证的主力发动机；这一步也正式交棒下一门课：高维概率 = 把"集中现象"做成系统学科。

## 4. 测度概率四页资产盘点

| 资产 | 出处 | 下游 |
|---|---|---|
| π–λ / UI / BC | mt-01 | 全站论证基建 |
| 0-1 律、SLLN | mt-02 | 渐近统计、MC 方法 |
| 条件期望 = 投影、OST | mt-03 | 金融定价（sc 线）、预测审计 |
| 鞅收敛、极大不等式、Azuma | 本页 | hdp 线、slt 线、随机分析 |

## 5. 练习与要点

**例 1（Polya 坛子）** 坛中红黑各一，每次抽出放回并加同色一球：红球比例 $X_n$ 是鞅（一行验证）+ 有界 ⇒ a.s. 收敛。极限分布是 $U(0,1)$（可算）——**鞅收敛保证"命运终将定形"，但每次重来命运不同**：路径依赖系统（技术锁定、先发优势）的概率模型。

**例 2（分支过程灭绝）** $Z_n/\mu^n$ 非负鞅 ⇒ a.s. 收敛。$\mu \leq 1$（临界/次临界）时可证极限为 0 且灭绝概率 1（配合灭绝概率的不动点方程——本科随机过程页的结论获得鞅证明）。

**例 3（McDiarmid 应用速写）** $f$ = $n$ 个独立样本的经验风险最小值：换一个样本至多改 $\frac{C}{n}$ ⇒ 集中 $e^{-2t^2 n/C^2}$——"训练误差是可靠的统计量"的一行证明（slt-03 的主料，提前尝味）。$\blacksquare$

---

*测度概率完卷。下一门：高维概率——把 Azuma 的"集中"哲学推向现代形态：亚高斯范数、随机矩阵、chaining。*
