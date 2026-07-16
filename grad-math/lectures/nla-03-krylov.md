# 数值线代 III · Krylov 子空间方法

> **对标**：Trefethen & Bau Lectures 32–40 ｜ **前置**：nla-01/02、本科数值 II、优化 II（CG 预告）
> 当 $n$ 到百万级、矩阵稀疏（只有 $O(n)$ 个非零），分解法（$O(n^3)$）出局——唯一买得起的操作是**矩阵乘向量**。Krylov 方法的纲领：只用乘向量，在"乘出来的子空间"里找最优解。CG 的收敛性证明是本页主菜，预条件是本页的实战灵魂。

## 1. Krylov 子空间

$$
\mathcal{K}_k(A, b) = \mathrm{span}\{b,\ Ab,\ A^2b,\ \dots,\ A^{k-1}b\}
$$

——$k$ 次乘向量能触及的全部信息（信息论式的下界视角：任何"只乘向量"的方法第 $k$ 步的解必在其中 + 平移）。Krylov 方法 = 在 $\mathcal{K}_k$ 中按某种最优性选解：

| 方法 | 适用 | 最优性 |
|---|---|---|
| **CG** | 对称正定 | $A$-范数误差最小 |
| MINRES | 对称不定 | 残差最小 |
| **GMRES** | 一般 | 残差最小（需存全基 → 重启版实用） |
| Lanczos/Arnoldi | 特征值 | Krylov 基上的投影谱（Ritz 值） |

（Arnoldi = 对 Krylov 基做 Gram–Schmidt 得 Hessenberg 小矩阵；对称时退化为三项递推 Lanczos——**短递推是对称世界的厚礼**：不用存全基，CG 因此每步 $O(n)$ 内存。）

## 2. CG 的收敛性（主菜，证明结构完整）

**观察**：$\mathcal{K}_k$ 中的任何向量 = $p(A)b$（$p$ 为次数 $< k$ 的多项式）⇒ CG 的误差

$$
\|e_k\|_A = \min_{\deg p \leq k,\ p(0)=1}\ \|p(A)\,e_0\|_A \leq \min_p\ \max_{\lambda\in\mathrm{spec}(A)}|p(\lambda)|\cdot\|e_0\|_A
$$

（谱分解把矩阵多项式化成"多项式在特征值上的最大值"——高代 V 干活。）**求解器问题变成了逼近论问题**：找 $[\lambda_{\min}, \lambda_{\max}]$ 上小、且 $p(0) = 1$ 的多项式——答案正是**Chebyshev 多项式**（本科数值 III"最优逼近 = Chebyshev"的承诺在此兑付）：

**定理（CG 收敛率）**

$$
\|e_k\|_A \;\leq\; 2\left(\frac{\sqrt\kappa - 1}{\sqrt\kappa + 1}\right)^k \|e_0\|_A
$$

**【证明骨架】** 取平移缩放的 Chebyshev $p = T_k\big(\frac{2\lambda - \lambda_{\max} - \lambda_{\min}}{\lambda_{\max} - \lambda_{\min}}\big)/T_k(\cdot)$，区间上 $|T_k| \leq 1$、$T_k$ 在区间外的增长给出分母 $T_k\big(\frac{\kappa+1}{\kappa-1}\big) \geq \frac12\big(\frac{\sqrt\kappa+1}{\sqrt\kappa-1}\big)^k$（Chebyshev 的双曲余弦表示一行）。$\blacksquare$

**三个读出**：**$\sqrt\kappa$**——比梯度下降的 $\kappa$（优化 II）好一个开方（CG 是"加速的"一阶法：与 Nesterov 的 $\sqrt\kappa$ 同阶非巧合——二次情形两者同源【引用】）；**谱聚集比条件数更真**：特征值聚成几簇时，$p$ 只需在簇上取零——**几步即收敛**（谱尾部孤立大特征值先被"消灭"）；**有限步精确**（$n$ 步理论收敛——但浮点世界这条不作数，CG 实为迭代法，Lanczos 正交性损失【引用】）。

## 3. 预条件：实战的灵魂

思想：解 $M^{-1}Ax = M^{-1}b$——**选 $M \approx A$ 且 $M$ 易解**，让有效谱聚集。

| 预条件器 | 思路 | 场景 |
|---|---|---|
| Jacobi（对角） | $M = \mathrm{diag}(A)$ | 便宜的保底 |
| 不完全分解 IC/ILU | 按稀疏模式截断的 Cholesky/LU | 通用主力 |
| 多重网格 AMG | 分层消除各频率误差 | 椭圆 PDE 之王（pde2 线的 FEM 系统） |
| 问题特制 | 用物理/结构近似算子 | 上限最高 |

**读法**：**"好的预条件器 = 对问题结构的洞察"**——Krylov 框架是通用引擎，预条件是领域知识的接口；工业界解大问题的时间九成花在这里。（🔗 优化 II 的"Adam ≈ 对角预条件"、BatchNorm 改善条件数——同一思想在深度学习的方言。）

## 4. 随机化数值线代一瞥（现代附录）

**随机 SVD**【骨架】：$Y = A\Omega$（$\Omega$ 为 $n\times(k{+}p)$ 高斯随机阵）→ QR 得 $Q$ → 对小矩阵 $Q^\top A$ 做精确 SVD——**用随机投影抓列空间**（hdp-02 JL 引理的直系应用），误差以高概率 $\lesssim \sigma_{k+1}$【引用 Halko–Martinsson–Tropp】。大数据低秩近似的默认起手式（sklearn `randomized_svd` 即它）——**hdp 线与 nla 线在此正式握手**。

## 5. 练习与要点

**例 1（谱聚集实验设计）** 两个 $\kappa = 10^4$ 的 SPD 矩阵：谱均匀分布 vs 聚成 3 簇——CG 迭代数前者 ~数百、后者 ~10（各簇一根多项式零点）；**报告 CG 性能时"谱形状"比"条件数"信息量大**。

**例 2（Chebyshev 界亲算）** $\kappa = 100$：收缩因子 $\frac{9}{11} \approx 0.818$，要降 $10^6$ 倍需 $k \approx \frac{\ln 10^6}{\ln(11/9)} \approx 69$ 步——对照梯度下降同题 $\approx 3500$ 步（$\big(\frac{99}{101}\big)^k$）：$\sqrt\kappa$ 的现金价值。

**例 3（何时不用 Krylov）** $n = 500$ 稠密良态系统：直接 Cholesky（$O(n^3)$ 但常数小、稳定、可复用分解）完胜迭代——**"大稀疏用 Krylov、小稠密用分解"**：方法选型的第一分岔（数值 II 的表在研究生版续订）。$\blacksquare$

---

*下一门：矩阵分析——把"矩阵的分析学"补全：范数与谱半径的精确关系、扰动定理、非负矩阵的 Perron–Frobenius。*
