# 泛函 II · Hilbert 空间

> Banach 空间只有长度，Hilbert 空间还有**角度**——内积带来正交、投影、最佳逼近的全套欧氏几何，且在无穷维完好运转。本页三大件：投影定理、正交基与 Fourier 展开、Riesz 表示定理。高代 VI 的内积空间一页是它的有限维预告片；条件期望、最小二乘、Fourier 级数在此获得统一的几何身份。

## 1. 内积空间与两条身份判据

**定义** 内积 $\langle\cdot,\cdot\rangle$（线性、共轭对称、正定）⇒ 范数 $\|x\| = \sqrt{\langle x,x\rangle}$；完备者称 **Hilbert 空间**。主角：$\ell^2$、$L^2$（实变 III——$p = 2$ 独享内积的原因见下）。

**Cauchy–Schwarz**：$|\langle x, y\rangle| \leq \|x\|\|y\|$（全站第四次出场，正式的抽象版）。

**平行四边形法则**：$\|x+y\|^2 + \|x-y\|^2 = 2\|x\|^2 + 2\|y\|^2$——**范数来自内积的充要判据**（不满足即无缘内积：$L^p (p \neq 2)$、$C[a,b]$ 全被此式排除——"$L^2$ 特殊"有了一行证明）。

## 2. 投影定理（Hilbert 几何的顶梁柱）

<figure class="plot" markdown="1">
![正交投影是最佳逼近](assets/img/func-02-orthogonal-projection.svg)
<figcaption><span class="fig-id">图 2.1</span>最佳逼近定理：子空间 \(M\) 上离 \(x\) 最近的点是正交投影 \(\hat x\)，误差 \(x-\hat x\perp M\)——最小二乘的几何本质。</figcaption>
</figure>

**定理（最佳逼近 + 正交分解）** $M$ 是 Hilbert 空间 $H$ 的闭子空间，则任意 $x \in H$ 存在**唯一**分解

$$
x = P_M x + z, \qquad P_M x \in M,\ z \perp M
$$

且 $P_M x$ 是 $M$ 中距 $x$ 最近的点（$\|x - P_M x\| = \min_{m \in M}\|x - m\|$）。

*证明思路*：取距离最小化序列，**平行四边形法则**逼出它是 Cauchy 列（凸性 + 中点技巧），完备性给极限；垂直性由变分法一阶条件（扰动 $P_Mx + tm$ 求导置零）。$\blacksquare$

**一网打尽的应用**（同一定理的四张面孔）：

| 场景 | $H$ | $M$ | $P_M x$ |
|---|---|---|---|
| 最小二乘（高代/统计 V） | $\mathbb{R}^n$ | $X$ 的列空间 | $\hat y = X\hat\beta$ |
| **条件期望**（概率 IV） | $L^2(\Omega)$ | $\sigma(X)$-可测函数 | $E[Y \mid X]$——"最佳预测=投影"的正式身份 |
| Fourier 部分和（数分 IV） | $L^2[-\pi,\pi]$ | 前 $n$ 个三角函数张成 | 部分和 $S_n f$（最佳均方逼近） |
| 正则化/约束优化 | — | 约束集（闭凸推广） | 投影算子（近端方法的原型） |

## 3. 正交基与 Fourier 展开

**标准正交系** $\{e_n\}$；**Bessel 不等式** $\sum|\langle x, e_n\rangle|^2 \leq \|x\|^2$（部分和是投影，投影不长）。**完全**（=正交基）时升级为等式：

**定理（正交基的等价刻画）** 以下等价：① $\{e_n\}$ 完全（张成稠密）；② 展开式 $x = \sum \langle x, e_n\rangle e_n$ 对一切 $x$ 成立；③ **Parseval 等式** $\|x\|^2 = \sum|\langle x, e_n\rangle|^2$。

**后果（可分 Hilbert 空间的大一统）**：一切可分无穷维 Hilbert 空间同构于 $\ell^2$——坐标映射 $x \mapsto (\langle x, e_n\rangle)$ 保内积。**"本质上只有一个 Hilbert 空间"**：$L^2$ 的函数、$\ell^2$ 的序列、量子态空间，同一个抽象对象的不同穿着（高代 IV"同构=换记号"哲学的无穷维加冕）。Fourier 级数理论至此收官定调：三角系是 $L^2$ 的一组正交基，Fourier 展开就是无穷维坐标表示（数分 IV 的全部收敛纠结，在 $L^2$ 视角下是一句话）。

## 4. Riesz 表示定理

**定理** Hilbert 空间上任一连续线性泛函 $\varphi$ 必可表示为与某**唯一**向量的内积：

$$
\varphi(x) = \langle x, y_\varphi\rangle, \qquad \|\varphi\| = \|y_\varphi\|
$$

（*思路*：$\ker\varphi$ 是闭超平面，投影定理取其正交补的方向向量。）**读法**：Hilbert 空间的对偶就是自己（自对偶）——"测量"与"向量"同一。应用射程：量子力学 bra-ket 记号的数学许可、PDE 弱解存在性（Lax–Milgram 定理是其变体）、以及——

🔗 **RKHS 与核方法（ai 课 02 的欠条）**：再生核 Hilbert 空间 = "求值泛函 $f \mapsto f(x)$ 连续"的函数 Hilbert 空间；Riesz 表示给出再生核 $K(x, \cdot)$ 使 $f(x) = \langle f, K(x,\cdot)\rangle$——**Mercer 定理构造的特征空间正是 RKHS**，SVM 的核技巧在泛函分析里有正式户口；表示定理（解落在样本核函数张成的子空间）就是投影定理的应用。

## 5. 典型例题

**例 1（投影实算）** 在 $L^2[0,1]$ 中求 $f = x^2$ 到 $M = \mathrm{span}\{1, x\}$ 的投影。
*解*：设 $P f = a + bx$，正交条件 $\langle f - Pf, 1\rangle = \langle f - Pf, x\rangle = 0$ 给方程组：$a + \frac b2 = \frac13$，$\frac a2 + \frac b3 = \frac14$ ⇒ $a = -\frac16, b = 1$。$Pf = x - \frac16$——这同时是"用直线拟合 $x^2$"的最小二乘解（统计 V 的连续版）。

**例 2（Parseval 反用）** $x$ 的 Fourier 系数平方和（实变 III 例 3 已演示 Basel 和）——正交基的等式③是"算级数和"的秘密武器。

**例 3（平行四边形排除法）** 证 $C[0,1]$ 配 $\|\cdot\|_\infty$ 非内积空间：取 $f = 1, g = x$，$\|f+g\|^2 + \|f-g\|^2 = 4 + 1 = 5 \neq 2(1 + 1) = 4$。一票否决。$\blacksquare$

---

*最后一页：研究空间之间的映射——有界线性算子与泛函分析三大定理，无穷维线性代数的完成式。*
