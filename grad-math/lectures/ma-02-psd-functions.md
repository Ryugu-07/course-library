# 矩阵分析 II · Löwner 序、Schur 补与矩阵函数

> **对标**：Horn & Johnson §7.1–7.7、Zhang *Schur Complement* ｜ **前置**：本科高代 VI、ma-01
> 本页回答"矩阵能不能当数用"：**Löwner 偏序**（$A \succeq B$ 的运算法则与陷阱）、**Schur 补**（分块矩阵的正定判据——统计与优化的瑞士军刀）、**矩阵函数**（$e^A, A^{1/2}, \ln A$ 的正确定义与单调性的惊人失效）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="matrix-order-functions-learning-title">

## 学习层：哪一些“像数一样”的操作，实际上换了方向？

<h3 id="matrix-order-functions-learning-title">1. 具体情境：协方差、鲁棒约束与一个看似无害的平方</h3>

把 \(A\succeq B\) 想成“对每个方向 \(v\)，\(v^T(A-B)v\ge0\)”。在统计里，这表示一个协方差差异是半正定；在优化里，分块矩阵则可能是一个 LMI 约束。现在给出

$$
A=\begin{pmatrix}2&1\\1&1\end{pmatrix},\qquad
B=\begin{pmatrix}1&0\\0&0\end{pmatrix}.
$$

它们满足 \(A-B=\begin{pmatrix}1&1\\1&1\end{pmatrix}\succeq0\)。如果只凭标量直觉，可能会顺手写成 \(A^2\succeq B^2\)，但这一步正是本页的陷阱。

### 2. 先预测，再揭示

实验先藏住特征值、行列式和 Schur 补证书。请预测：

1. \(A\succeq B\) 是否必然推出 \(A^2\succeq B^2\)？若不然，哪一个 \(2\times2\) 证据会击穿它？
2. 对任意实矩阵 \(X\)，\(X^TAX-X^TBX\) 的方向关系会不会改变？
3. 若 \(A\succeq B\succ0\)，求逆后应保持方向还是反序？
4. 对分块矩阵 \(\begin{pmatrix}A&B\\B^T&C\end{pmatrix}\)，把 \(A^{-1}\) 写进 Schur 补时，为什么必须单独声明 \(A>0\)？

点“揭示账本”后，实验会给出平方反例的负特征值、共轭保序、求逆反序、条件方差 \(3-2\cdot(1/4)\cdot2=2\) 和 LMI 证书。固定 \(2\times2\) 数值是证据，不是对所有矩阵函数的定理证明。

### 3. 正式模型：二次型、共轭与 Schur 补

对称矩阵的 Löwner 序定义为

$$
A\succeq B\iff A-B\succeq0\iff v^T(A-B)v\ge0\quad(\forall v).
$$

因此

$$
A\succeq B\Longrightarrow X^TAX\succeq X^TBX
$$

只是把测试向量换成 \(Xv\)，不需要 \(X\) 可逆。若 \(A\succeq B\succ0\)，则

$$
B^{-1}\succeq A^{-1};
$$

它是反序，不是保序。对称 \(A=Q\Lambda Q^T\) 的矩阵函数按谱演算定义为 \(f(A)=Qf(\Lambda)Q^T\)。在**正定域**上，\(\sqrt t,\ \log t,\ -1/t\) 是常用的算子单调函数；标量函数单调并不自动推出算子单调。特别是 \(t^2\) 在正数上标量单调，却不是算子单调函数。

对 \(A>0\) 的分块矩阵，Schur 补是

$$
S=C-B^TA^{-1}B,\qquad
\begin{pmatrix}A&B\\B^T&C\end{pmatrix}\succeq0
\iff S\succeq0.
$$

这里的等价式明确使用 \(A>0\)；若只知道 \(A\succeq0\)，还要加入范围条件并使用广义逆，不能把同一行公式无条件延伸过去。

<div class="learning-lab" data-learning-lab="matrix-order-functions" markdown="1">

**JavaScript 失效时的静态读法：**以下四张证书对应默认的确定性 \(2\times2\) 例子。表格只做二次型/特征值的有限核对；“算子单调”仍是定理层面的全维度、全矩阵量词。

| 操作 | 静态证据 | 结论 | 边界 |
|---|---|---|---|
| 平方 | \(A-B=\begin{pmatrix}1&1\\1&1\end{pmatrix}\succeq0\)，但 \(A^2-B^2=\begin{pmatrix}4&3\\3&2\end{pmatrix}\)，行列式 \(-1\) | 平方不保 Löwner 序 | 一个反例可否定普遍命题，但不能替代算子函数定理 |
| 共轭 | \(X^T(A-B)X\succeq0\) 对固定 \(X\) 仍成立 | 共轭保序 | \(X\) 不要求可逆；这不是普通乘法保序 |
| 求逆 | \(A\succeq B\succ0\Rightarrow B^{-1}-A^{-1}\succeq0\) | 求逆反序 | 必须在正定域内求逆 |
| Schur/统计 | \(3-2\cdot(1/4)\cdot2=2\) | 条件方差等于 Schur 补 | LMI 等价使用 \(A>0\)；数值不替代正定假设 |

### 4. 定理、证据与模型边界

实验中的“PSD”“正定”“负行列式”是可复核的有限证据：对 \(2\times2\) 对称阵，特征值或主子式足以核对当前对象。它不能把标量单调性升级成算子单调性，也不能把 \(2\times2\) 的平方反例误读成“所有矩阵函数都不保序”。Löwner 单调性要对所有维度的自伴矩阵比较；\(\sqrt{\cdot},\log,\ -1/t\) 本页只在正定域陈述，靠近零或离开实对称正定框架时需要另行讨论。Schur 补证书同样依赖对称分块结构和 \(A>0\)。

</section>

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

**三大常客**：$e^{A}$（ode-03 的矩阵指数：$e^{A+B} = e^Ae^B$ **仅当交换**——Lie 理论的门缝）；$A^{1/2}$（正定矩阵的唯一正定平方根——白化、协方差的"标准差"）；$\ln A$（正定矩阵上的信息几何与矩阵优化坐标）。

**定理（Löwner 单调性，陈述 + 名单）** 在正定域 $t>0$ 上，$f$ 称算子单调若 $A \succeq B \succ0 \Rightarrow f(A) \succeq f(B)$。**名单**：$t^{1/2}, \ln t, -1/t$ 在此正定域上算子单调；**$t^2, e^t$ 不是**（例 1）。完整刻画（Löwner 定理：算子单调 ⟺ 可解析延拓到上半平面且保上半平面）【引用】。
**实用读法**：**开方与取对数可以放心比大小，平方与指数不行**——矩阵不等式推导的红绿灯（量子信息与信息几何里这张名单是日用品）。

**迹不等式一嘴**：von Neumann 迹不等式 $\mathrm{tr}(AB) \leq \sum\sigma_i(A)\sigma_i(B)$、$\mathrm{tr}$ 与凸性（$A \mapsto \mathrm{tr}f(A)$ 对凸 $f$ 凸【引用】）——SDP 目标函数合法性的背书。

## 4. 练习与要点

**例 1（平方不保序的反例）** $A = \begin{pmatrix}2 & 1\\ 1& 1\end{pmatrix},\ B = \begin{pmatrix}1 & 0\\ 0 & 0\end{pmatrix}$：$A - B = \begin{pmatrix}1&1\\1&1\end{pmatrix} \succeq 0$ ✓；但 $A^2 - B^2 = \begin{pmatrix}4 & 3\\ 3 & 2\end{pmatrix}$ 行列式 $= -1 < 0$ ✗——两分钟亲手验证，"矩阵不是大号的数"从口号变体感。

**例 2（Schur 补三用合一）** $\Sigma = \begin{pmatrix}4 & 2\\ 2 & 3\end{pmatrix}$：条件方差
$3 - 2\cdot(1/4)\cdot2 = 2$（回归掉 $X_1$ 后 $X_2$ 剩的方差）；同数字即"消 $x_1$ 后的二次型"与"$M \succ 0$ 判据的第二块"——一个数三张面孔。

**例 3（矩阵函数计算）** $A = \begin{pmatrix}0 & 1\\ 1 & 0\end{pmatrix}$：谱 $\pm1$、$e^A = \cosh(1)I + \sinh(1)A$（谱演算两行）——"矩阵函数 = 特征值上的标量函数 + 特征向量搬运"的最小演示。$\blacksquare$

---

*下一页：非负矩阵的世界——Perron–Frobenius 定理：正矩阵必有正主特征对，Markov 链、PageRank、人口模型的总后台，矩阵分析收官。*
