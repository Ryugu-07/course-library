# 矩阵分析 II · Löwner 序、Schur 补与矩阵函数

> **对标**：Horn & Johnson §7.1–7.7、Zhang *Schur Complement* ｜ **前置**：本科高代 VI、ma-01
> 本页回答"矩阵能不能当数用"：**Löwner 偏序**（$A \succeq B$ 的运算法则与陷阱）、**Schur 补**（分块矩阵的正定判据——统计与优化的瑞士军刀）、**矩阵函数**（$e^A, A^{1/2}, \ln A$ 的正确定义与单调性的惊人失效）。

## 1. Löwner 偏序

**定义** $A \succeq B \iff A - B$ 半正定（对称阵上的偏序——不是全序：$\mathrm{diag}(2,0)$ 与 $\mathrm{diag}(0,2)$ 不可比）。

**安全运算**：加法保序；共轭保序（$A \succeq B \Rightarrow X^\top AX \succeq X^\top BX$——定义一行）；**求逆反序**（$A \succeq B \succ 0 \Rightarrow B^{-1} \succeq A^{-1}$【骨架：先证 $A \succeq I \Rightarrow I \succeq A^{-1}$（谱分解逐特征值），一般情形用 $B^{-1/2}$ 共轭归约】）；特征值逐个保序（Weyl 的推论，ma-01）。

**⚠️ 危险运算（数的直觉失效区）**：**乘法不保序**（$AB$ 甚至未必对称）；**平方不保序**：$A \succeq B \not\Rightarrow A^2 \succeq B^2$（反例存在于 $2\times2$——见例 1）。哪些函数保序？——这是 §3 Löwner 定理的问题。

## 2. Schur 补（分块世界的主定理）

分块对称阵 $M = \begin{pmatrix} A & B \\ B^\top & C\end{pmatrix}$（$A \succ 0$），**Schur 补** $S = C - B^\top A^{-1}B$。

**定理（正定判据）** $M \succ 0 \iff A \succ 0$ 且 $S \succ 0$。
**【证明】** 分块消元的合同变换：$\begin{pmatrix}I & 0\\ -B^\top A^{-1} & I\end{pmatrix}M\begin{pmatrix}I & -A^{-1}B\\ 0 & I\end{pmatrix} = \begin{pmatrix}A & 0\\ 0 & S\end{pmatrix}$——合同不变惯性（高代 VI Sylvester 惯性定律上岗），块对角的正定性逐块看。$\blacksquare$

**三重身份（每个都在别处执勤）**：

- **统计**：多维正态的**条件协方差** $\mathrm{Cov}(X_2\mid X_1) = \Sigma_{22} - \Sigma_{21}\Sigma_{11}^{-1}\Sigma_{12}$ **恰是 Schur 补**——条件化 = 分块消元（本科概率 III 二维正态条件分布公式的矩阵真身；Gauss 过程回归的预测方差同式）；
- **优化**：二次型部分最小化 $\min_{x_1} \binom{x_1}{x_2}^\top M\binom{x_1}{x_2} = x_2^\top S\, x_2$——"消掉一块变量剩 Schur 补"；LMI 技巧：非线性约束 $C \succeq B^\top A^{-1}B$ ⟺ 线性矩阵不等式 $M \succeq 0$（cvx-04 SDP 建模的第一技法）；
- **数值**：分块消元的枢轴（区域分解法的接口算子【引用】）。

## 3. 矩阵函数

**定义（谱演算）** 对称 $A = Q\Lambda Q^\top$：$f(A) = Q\,f(\Lambda)\,Q^\top$（对角逐元素作用）——与幂级数定义（收敛域内）一致【引用】；非对称走 Jordan/围道积分定义（复变 II 的 Cauchy 公式变身 $f(A) = \frac{1}{2\pi i}\oint f(z)(zI - A)^{-1}dz$——解析函数论在矩阵上复活）。

**三大常客**：$e^{A}$（ode-03 的矩阵指数：$e^{A+B} = e^Ae^B$ **仅当交换**——Lie 理论的门缝）；$A^{1/2}$（PSD 唯一平方根——白化、协方差的"标准差"）；$\ln A$（信息几何与矩阵优化的坐标）。

**定理（Löwner 单调性，陈述 + 名单）** $f$ 称算子单调若 $A \succeq B \Rightarrow f(A) \succeq f(B)$。**名单**：$t^{1/2}, \ln t, -1/t$ 算子单调；**$t^2, e^t$ 不是**（例 1）。完整刻画（Löwner 定理：算子单调 ⟺ 可解析延拓到上半平面且保上半平面）【引用】。
**实用读法**：**开方与取对数可以放心比大小，平方与指数不行**——矩阵不等式推导的红绿灯（量子信息与信息几何里这张名单是日用品）。

**迹不等式一嘴**：von Neumann 迹不等式 $\mathrm{tr}(AB) \leq \sum\sigma_i(A)\sigma_i(B)$、$\mathrm{tr}$ 与凸性（$A \mapsto \mathrm{tr}f(A)$ 对凸 $f$ 凸【引用】）——SDP 目标函数合法性的背书。

## 4. 练习与要点

**例 1（平方不保序的反例）** $A = \begin{pmatrix}2 & 1\\ 1& 1\end{pmatrix},\ B = \begin{pmatrix}1 & 0\\ 0 & 0\end{pmatrix}$：$A - B = \begin{pmatrix}1&1\\1&1\end{pmatrix} \succeq 0$ ✓；但 $A^2 - B^2 = \begin{pmatrix}4 & 3\\ 3 & 2\end{pmatrix}$ 行列式 $= -1 < 0$ ✗——两分钟亲手验证，"矩阵不是大号的数"从口号变体感。

**例 2（Schur 补三用合一）** $\Sigma = \begin{pmatrix}4 & 2\\ 2 & 3\end{pmatrix}$：条件方差 $3 - \frac{4}{4}\cdot 1 \cdot\cdots = 3 - 1 = 2$（回归掉 $X_1$ 后 $X_2$ 剩的方差）；同数字即"消 $x_1$ 后的二次型"与"$M \succ 0$ 判据的第二块"——一个数三张面孔。

**例 3（矩阵函数计算）** $A = \begin{pmatrix}0 & 1\\ 1 & 0\end{pmatrix}$：谱 $\pm1$、$e^A = \cosh(1)I + \sinh(1)A$（谱演算两行）——"矩阵函数 = 特征值上的标量函数 + 特征向量搬运"的最小演示。$\blacksquare$

---

*下一页：非负矩阵的世界——Perron–Frobenius 定理：正矩阵必有正主特征对，Markov 链、PageRank、人口模型的总后台，矩阵分析收官。*
