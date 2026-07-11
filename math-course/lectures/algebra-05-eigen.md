# 高代 V · 特征值与标准形

> 上一页的问题在此求解：给定线性变换，找一组基使它的矩阵最简单。答案分两层——运气好（可对角化）时矩阵能变成对角阵，变换 = 沿特征方向各自伸缩；运气不好时也有兜底的最简形态：Jordan 标准形。特征值理论是线性代数的"光谱学"：**看一个变换，就看它的特征值**。

## 1. 特征值与特征向量

**定义** $A\xi = \lambda\xi\ (\xi \neq 0)$：$\xi$ 是只被**伸缩不被转向**的方向，$\lambda$ 是伸缩率。

**求法**：$(\lambda I - A)\xi = 0$ 有非零解 $\iff$ **特征多项式** $f(\lambda) = \det(\lambda I - A) = 0$。$n$ 阶方阵在 $\mathbb{C}$ 上恰有 $n$ 个特征值（计重数）。

**两个恒等式**（验算神器 + 考试常客）：

$$
\sum_{i} \lambda_i = \mathrm{tr}\,A, \qquad \prod_i \lambda_i = \det A
$$

**性质速查**：$A$ 与 $A^\top$ 特征值相同；$f(A)$ 的特征值为 $f(\lambda_i)$（多项式映射特征值——由 $A^k\xi = \lambda^k \xi$ 逐项得）；可逆时 $A^{-1}$ 的特征值为 $\lambda_i^{-1}$；相似矩阵特征多项式相同（$\det(\lambda I - T^{-1}AT) = \det(T^{-1}(\lambda I - A)T)$）；三角阵特征值 = 对角元。

**特征子空间** $V_\lambda = \ker(\lambda I - A)$。**几何重数** $\dim V_\lambda$ ≤ **代数重数**（$\lambda$ 在特征多项式中的重数）——这条不等式是能否对角化的胜负手。

## 2. 对角化

**定理（对角化判据）** $n$ 阶方阵 $A$ 可对角化（$\exists$ 可逆 $T$：$T^{-1}AT = \mathrm{diag}(\lambda_1,\dots,\lambda_n)$）$\iff$ $A$ 有 $n$ 个线性无关的特征向量 $\iff$ 每个特征值的几何重数 = 代数重数。**充分条件**：$n$ 个特征值互异（不同特征值的特征向量自动线性无关——归纳可证）。

$T$ 的列 = 特征向量，对角元 = 对应特征值（顺序配套）。**对角化的红利**：

$$
A^k = T\,\mathrm{diag}(\lambda_1^k, \dots, \lambda_n^k)\,T^{-1}
$$

矩阵幂/矩阵函数一步到位（线性递推如 Fibonacci 通项、Markov 链极限——🔗 随机过程页——全靠它）。

**不可对角化的最小反例**：$\begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}$——特征值 0（代数重数 2），特征向量只有一维（几何重数 1）。缺的那个方向就是 Jordan 理论要补的。

## 3. Cayley–Hamilton 与最小多项式

**定理（Cayley–Hamilton）** 把 $A$ 代入自己的特征多项式得零矩阵：$f(A) = 0$。（用途：降幂——高次 $A^k$ 用特征多项式除法降到 $n$ 次以下；求逆的多项式表达。）

**最小多项式** $m(\lambda)$：使 $m(A) = 0$ 的最低次首一多项式。性质：整除一切零化多项式（尤其 $m \mid f$）；根恰为全部特征值（重数可低于代数重数）。**判据升级**：

$$
A\ \text{可对角化} \iff m(\lambda)\ \text{无重根}
$$

（例：幂等阵 $A^2 = A$ 的 $m \mid \lambda^2 - \lambda$ 无重根 ⇒ 投影必可对角化，特征值只有 0/1——与高代 IV 例 3 的直和分解互为表里。）

## 4. Jordan 标准形（兜底定理）

**Jordan 块** $J_k(\lambda) = \begin{pmatrix} \lambda & 1 & & \\ & \lambda & \ddots & \\ & & \ddots & 1 \\ & & & \lambda \end{pmatrix}$（对角 $\lambda$、上对角 1）。

**定理** 复数域上任意方阵相似于唯一的（不计块序）**Jordan 形** $J = \mathrm{diag}(J_{k_1}(\lambda_1), \dots)$。

结构解读：$J_k(\lambda) = \lambda I + N$，$N$ 幂零（$N^k = 0$）——**任何线性变换 = 对角部分（伸缩）+ 幂零部分（"错位推移"）**。对角化失败的全部障碍被隔离进幂零部分。

**计算实务**（会算 $\leq 4$ 阶即可）：特征值 $\lambda$ 的块总数 = 几何重数；块的尺寸分布由秩序列 $\mathrm{rank}(A - \lambda I)^j$ 决定（$j$ 阶秩差数出 $\geq j$ 阶块的个数）。

🔗 **AI 衔接**：矩阵幂的行为由最大特征值主宰（$\|A^k\| \sim |\lambda_{\max}|^k$）——RNN 梯度消失/爆炸的谱分析（ai 课 06 讲 $\|W\|^{t-k}$）、幂法求主特征向量（PageRank、数值页）都是特征值理论的直接变现。

## 5. 实用速查：矩阵幂三条路

| 场景 | 方法 |
|---|---|
| 可对角化 | $A^k = T\Lambda^k T^{-1}$ |
| 不可对角化 | Jordan：$J_k(\lambda)^m$ 有显式二项式公式（$\lambda I$ 与 $N$ 交换）|
| 只要低次信息 | Cayley–Hamilton 降幂 |

## 6. 典型例题

**例 1（完整对角化流程）** $A = \begin{pmatrix} 4 & 6 & 0 \\ -3 & -5 & 0 \\ -3 & -6 & 1 \end{pmatrix}$。
*解*：$\det(\lambda I - A) = (\lambda - 1)^2(\lambda + 2)$。$\lambda = 1$：解 $(I - A)x = 0$ 得两个无关特征向量 $(-2,1,0)^\top, (0,0,1)^\top$（几何重数 2 = 代数重数 ✓）；$\lambda = -2$：$(1,-1,1)^\top$。可对角化，$T$ 三列拼特征向量，$T^{-1}AT = \mathrm{diag}(1,1,-2)$。**流程：特征多项式 → 逐特征值解齐次组 → 数无关向量个数做判据。**

**例 2（Fibonacci 通项）** $\begin{pmatrix} F_{n+1} \\ F_n \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} F_n \\ F_{n-1} \end{pmatrix}$。特征值 $\varphi = \frac{1+\sqrt5}{2},\ \psi = \frac{1-\sqrt5}{2}$，对角化后取幂得

$$
F_n = \frac{\varphi^n - \psi^n}{\sqrt 5}
$$

——"对角化解线性递推"的招牌演出。

**例 3（C–H 降幂）** $A^2 = A + 2I$（即 $m(\lambda) \mid \lambda^2 - \lambda - 2 = (\lambda-2)(\lambda+1)$，无重根 ⇒ 可对角化），求 $A^{10}$ 关于 $A, I$ 的表达。
*解*：设 $\lambda^{10} = q(\lambda)(\lambda^2 - \lambda - 2) + a\lambda + b$，代 $\lambda = 2, -1$：$1024 = 2a + b,\ 1 = -a + b$ ⇒ $a = 341, b = 342$。故 $A^{10} = 341A + 342 I$。$\blacksquare$

---

*最后一页：给空间装上"长度与角度"（内积），实对称矩阵的谱定理在此加冕，并连向机器学习的第一主力分解——SVD。*
