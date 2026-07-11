# 高代 III · 矩阵

> 矩阵在本页完成身份升级：从"方程组的系数表"变成**自带代数运算的对象**。乘法为什么那样定义、逆矩阵何时存在、分块怎么用、秩的不等式体系——这些是后面一切结构理论（相似、合同、分解）的操作基础。

## 1. 运算与乘法的本质

加法、数乘逐元素；**乘法** $(AB)_{ij} = \sum_k a_{ik}b_{kj}$。为什么这样定义？因为**矩阵乘法 = 线性映射的复合**（高代 IV 将正式建立；先记住这个视角，乘法的一切"怪癖"都由它解释）：

- **不交换**：$AB \neq BA$（映射复合本来就不交换）；
- **有零因子**：$AB = 0 \nRightarrow A = 0$ 或 $B = 0$；**不能消去**：$AB = AC \nRightarrow B = C$（除非 $A$ 可逆）；
- 结合律、分配律成立；$(AB)^\top = B^\top A^\top$（穿衣脱衣顺序）。

**方阵幂与多项式**：$A^k$、$f(A) = a_n A^n + \cdots + a_0 I$；同一矩阵的多项式彼此交换——这一小事实是高代 V 里 Cayley–Hamilton 与最小多项式理论的操作基础。

**特殊矩阵速查**：对角、数量矩阵 $kI$（与一切方阵交换，且只有它们如此）、上/下三角（乘积保持三角）、对称 $A^\top = A$ / 反对称 $A^\top = -A$（任意方阵 = 对称 + 反对称的唯一分解 $A = \frac{A + A^\top}{2} + \frac{A - A^\top}{2}$）、正交矩阵（高代 VI）、幂等 $A^2 = A$（投影）、幂零 $A^k = 0$。

## 2. 逆矩阵

**定义** $AB = BA = I$ 则 $B = A^{-1}$（存在必唯一）。

**定理（可逆判别大集合）** 对 $n$ 阶方阵，以下等价：$A$ 可逆 $\iff \det A \neq 0 \iff \mathrm{rank}\,A = n \iff Ax = 0$ 只有零解 $\iff$ 行（列）向量组线性无关 $\iff A$ 可写成初等矩阵之积 $\iff$ 0 不是 $A$ 的特征值。**这张等价清单是线性代数的"中枢神经"，各页概念在此汇合，值得整体背诵。**

**求逆两法**：伴随法 $A^{-1} = \frac{1}{\det A}\mathrm{adj}(A)$（理论用、$2\times2$ 速算 $\begin{pmatrix} a&b\\c&d\end{pmatrix}^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d&-b\\-c&a\end{pmatrix}$）；初等变换法 $(A \mid I) \xrightarrow{\text{行变换}} (I \mid A^{-1})$（实算用）。

性质：$(AB)^{-1} = B^{-1}A^{-1}$；$(A^\top)^{-1} = (A^{-1})^\top$；$\det A^{-1} = (\det A)^{-1}$。

**伴随矩阵补充公式**（考试常客）：$\det(\mathrm{adj} A) = (\det A)^{n-1}$；$\mathrm{rank}(\mathrm{adj}A) = n / 1 / 0$ 分别对应 $\mathrm{rank}A = n / n{-}1 / {<}n{-}1$。

## 3. 分块矩阵

把矩阵按块划分，**块当元素做运算**（乘法要求分法相容）。三个高频武器：

- **分块对角**：$\mathrm{diag}(A_1, A_2)$ 的逆/幂/行列式逐块算，$\det = \det A_1 \det A_2$；
- **分块三角**：$\det\begin{pmatrix} A & C \\ 0 & B \end{pmatrix} = \det A \det B$；
- **打洞（Schur 补）**：用块消元处理 $\begin{pmatrix} A & B \\ C & D\end{pmatrix}$，$A$ 可逆时行列式 $= \det A \cdot \det(D - CA^{-1}B)$。🔗 Schur 补在数值分析（分块消元）、统计（条件高斯分布的协方差！概率页）中反复出现。

**列/行视角**（比元素视角更重要的思维方式）：$Ax$ = A 的**列的线性组合**（系数是 $x$ 的分量）；$AB$ 的每列 = $A$ 乘 $B$ 的对应列。🔗 神经网络每层 $Wx$ 就该这样读（ai 课 04 讲）。

## 4. 初等矩阵与等价标准形

**初等矩阵** = 单位阵做一次初等变换；左乘 = 行变换、右乘 = 列变换。初等矩阵皆可逆。

**定理（等价标准形）** 任意 $m \times n$ 矩阵存在可逆 $P, Q$：

$$
PAQ = \begin{pmatrix} I_r & 0 \\ 0 & 0 \end{pmatrix}, \qquad r = \mathrm{rank}\,A
$$

——**在"两边随便乘可逆阵"的等价关系下，秩是唯一的不变量**。这是三大标准形（等价/相似/合同）中最粗的一个，后两个分别在高代 V、VI 登场，"变换群越小、不变量越细"的主线由此开始。

## 5. 秩的不等式体系

（证明思路多为"解空间包含关系"或"分块打洞"，每条至少会用。）

| 不等式 | 备注 |
|---|---|
| $\mathrm{rank}(A + B) \leq \mathrm{rank}A + \mathrm{rank}B$ | |
| $\mathrm{rank}(AB) \leq \min(\mathrm{rank}A, \mathrm{rank}B)$ | 乘法不增秩 |
| $\mathrm{rank}(AB) \geq \mathrm{rank}A + \mathrm{rank}B - n$ | **Sylvester**；$AB = 0 \Rightarrow \mathrm{rank}A + \mathrm{rank}B \leq n$ |
| $P, Q$ 可逆 ⇒ $\mathrm{rank}(PAQ) = \mathrm{rank}A$ | 可逆乘法保秩 |
| $\mathrm{rank}(A^\top A) = \mathrm{rank}A$ | 实矩阵；最小二乘法方程可解性的依据 |

🔗 **AI 衔接**：低秩 = 信息冗余可压缩——LoRA（comfy 课 05 讲 $\Delta W = BA$，$\mathrm{rank} \leq r$）、推荐系统矩阵分解、模型压缩全部立足于秩的语言。

## 6. 典型例题

**例 1（求逆）** $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 5 & 3 \\ 1 & 0 & 8 \end{pmatrix}$：$(A\mid I)$ 行变换到 $(I \mid A^{-1})$，得 $A^{-1} = \begin{pmatrix} -40 & 16 & 9 \\ 13 & -5 & -3 \\ 5 & -2 & -1 \end{pmatrix}$（验算 $AA^{-1} = I$ 一次，防手滑）。

**例 2（Sylvester 应用）** $A^2 = I$（对合矩阵），证明 $\mathrm{rank}(A + I) + \mathrm{rank}(A - I) = n$。
*解*：$(A+I)(A-I) = 0$ ⇒ 秩和 $\leq n$（Sylvester）；又 $(A+I) - (A-I) = 2I$ ⇒ 秩和 $\geq \mathrm{rank}(2I) = n$。两头夹住等号。**"乘积为零 + 和为可逆"双夹是这类题的固定拳法。**

**例 3（分块求逆）** $M = \begin{pmatrix} A & 0 \\ C & B \end{pmatrix}$（$A, B$ 可逆），验证 $M^{-1} = \begin{pmatrix} A^{-1} & 0 \\ -B^{-1}CA^{-1} & B^{-1} \end{pmatrix}$（按块乘一遍即可；记结构不记公式：对角块取逆，角块"左右夹逆再变号"）。$\blacksquare$

---

*下一页离开具体矩阵，进入公理化的世界：线性空间与线性映射——"矩阵是线性映射在基下的照片"这句话将正式成立。*
