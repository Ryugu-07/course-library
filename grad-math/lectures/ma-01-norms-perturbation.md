# 矩阵分析 I · 范数、谱半径与扰动理论

> **对标**：Horn & Johnson *MA* §5.6–5.8、§6.3、Weyl 定理 ｜ **前置**：本科高代 V–VI、泛函 I、数值 I
> 矩阵分析 = 矩阵的"分析学"：极限、范数、扰动。本页三大件：**Gelfand 公式**（谱半径是渐近行为的唯一裁判）、**Weyl 扰动定理**（对称谱的完美稳定性）、**Gershgorin 圆盘**（谱的免费定位器）——全站多次引用的"谱半径决定长期行为"在此获得总证明。

## 1. 矩阵范数与谱半径

**诱导范数** $\|A\| = \sup_{\|x\|=1}\|Ax\|$（次可乘 $\|AB\| \leq \|A\|\|B\|$）；谱半径 $\rho(A) = \max|\lambda_i|$。

**基本不等式** $\rho(A) \leq \|A\|$（任何诱导范数；特征向量一行）。⚠️ 反向不成立：$A = \begin{pmatrix}0 & 1\\ 0& 0\end{pmatrix}$，$\rho = 0$ 而 $\|A\|_2 = 1$——**非正规矩阵的范数与谱可以严重脱节**（瞬态增长现象：$\|A^k\|$ 可先涨后消——伪谱理论的入口【引用 Trefethen–Embree】）。

**定理（Gelfand 公式）**

$$
\rho(A) = \lim_{k\to\infty}\|A^k\|^{1/k}
$$

**【证明】** （$\geq$）$\rho(A)^k = \rho(A^k) \leq \|A^k\|$。（$\leq$）对任意 $\varepsilon$，$B = A/(\rho + \varepsilon)$ 的谱半径 $< 1$ ⇒ $B^k \to 0$（Jordan 形逐块验证：$J^k$ 的元素是 $\lambda^{k-j}\binom kj$ 型，$|\lambda| < 1$ 时多项式×几何衰减归零——高代 V 的 Jordan 在此干活）⇒ $\|B^k\|$ 有界，$\|A^k\|^{1/k} \leq (\rho + \varepsilon)\cdot C^{1/k} \to \rho + \varepsilon$。$\blacksquare$

**推论（全站欠条的总清偿）** $A^k \to 0 \iff \rho(A) < 1$；幂级数 $\sum c_kA^k$ 的收敛判据以 $\rho$ 为半径——**迭代法收敛判据（数值 II）、Markov 链混合（随机过程）、AR 过程平稳性（时序）、离散动力系统稳定（ode-03）**：四门课引用的"谱半径 < 1"是同一条 Gelfand。另一实用件：$\forall\varepsilon\ \exists$ 范数使 $\|A\| \leq \rho + \varepsilon$（Jordan 基下加权——"谱半径是所有诱导范数的下确界"）。

## 2. 对称谱的扰动：Weyl 与 Davis–Kahan

**定理（Weyl）** 对称 $A, E$：

$$
|\lambda_i(A + E) - \lambda_i(A)| \;\leq\; \|E\|_2 \qquad \forall i
$$

**【证明】** Courant–Fischer 极小极大（$\lambda_i = \min_{\dim S = n-i+1}\max_{x\in S}\frac{x^\top Ax}{x^\top x}$——高代 VI Rayleigh 商的推广，本页顺带补全）：对同一子空间族，$\frac{x^\top(A+E)x}{x^\top x}$ 与 $\frac{x^\top Ax}{x^\top x}$ 逐点差 $\leq \|E\|$，min-max 保持不等式。$\blacksquare$

**读法**：**对称特征值是"条件数为 1"的完美量**——扰动多少、谱至多动多少（nla-02 引用的定理在此还账）；样本协方差谱因此可信到 $\|\hat\Sigma - \Sigma\|$ 级（hdp-03 的谱界直接换算成特征值误差——三门课在一行不等式上接通）。

**特征向量则不然（Davis–Kahan，$\sin\Theta$ 定理陈述）【引用】**：$\sin\angle(v_i, \hat v_i) \lesssim \frac{\|E\|}{\text{gap}_i}$——**谱隙做分母**：特征值挤在一起时方向失稳（nla-02 例 3 "PCA 单轴不可信"的定理出处）。"值稳定、向量看谱隙"六个字带走。

## 3. Gershgorin 圆盘（谱的免费定位）

**定理** $A$ 的每个特征值落在某个圆盘 $D_i = \{z: |z - a_{ii}| \leq \sum_{j\neq i}|a_{ij}|\}$ 内。
**【证明】** $Ax = \lambda x$，取 $|x_i|$ 最大的分量：$|\lambda - a_{ii}||x_i| = |\sum_{j\neq i}a_{ij}x_j| \leq |x_i|\sum|a_{ij}|$。$\blacksquare$（两行定理，性价比之王。）
**推论**：严格对角占优 ⇒ 可逆（0 不在任何圆盘）——数值 II Jacobi/GS 收敛条件的一行证明补齐；连通版本（$k$ 个圆盘的连通块恰含 $k$ 个特征值）用于谱的分离论证【引用】。

## 4. 练习与要点

**例 1（Gelfand 体感）** $A = \begin{pmatrix}0.9 & 10\\ 0 & 0.9\end{pmatrix}$：$\rho = 0.9 < 1$ 但 $\|A\|_2 \approx 10$——$\|A^k\|$ 先冲高（$k\cdot0.9^{k-1}\cdot10$ 型）至 $k \approx 10$ 才衰减：**"最终收敛"与"过程平稳"是两回事**（迭代法/RNN 的瞬态爆发同源；非正规性的实害一图看懂）。

**例 2（Weyl 应用）** 协方差估计误差 $\|\hat\Sigma - \Sigma\| \leq 0.1$：每个特征值误差 $\leq 0.1$——"解释方差前 5 名"的排序在特征值间隔 $> 0.2$ 时保序（Weyl 两次）；间隔更小时排序不可信——PCA 报告的严谨措辞由此。

**例 3（Gershgorin 速判）** $A = \begin{pmatrix}4 & 1 & 0\\ 1 & 3 & 1 \\ 0 & 1 & -2\end{pmatrix}$：圆盘 $[3,5], [1,5], [-4,0]$——立即知道：可能有负特征值（第三盘）、谱 $\subseteq [-4, 5]$、且 $\{-4\leq z\leq0\}$ 盘与前两盘不交 ⇒ 恰一个负特征值。**不解特征方程的谱侦察**。$\blacksquare$

---

*下一页：半正定世界的运算——Löwner 序、Schur 补与矩阵函数：把"矩阵当数用"的合法边界画清楚。*
