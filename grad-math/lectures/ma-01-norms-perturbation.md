# 矩阵分析 I · 范数、谱半径与扰动理论

> **对标**：Horn & Johnson *MA* §5.6–5.8、§6.3、Weyl 定理 ｜ **前置**：本科高代 V–VI、泛函 I、数值 I
> 矩阵分析 = 矩阵的"分析学"：极限、范数、扰动。本页三大件：**Gelfand 公式**（谱半径是渐近行为的裁判，但不承诺有限时刻单调）、**Weyl 扰动定理**（对称谱的完美稳定性）、**Gershgorin 圆盘**（谱的免费定位器）——全站多次引用的"谱半径决定长期行为"在此获得总证明。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：为什么稳定系统也会先放大？

### 1. 具体谜题：两个系统有同一对特征值，谁会先“爆一下”？

考虑离散系统 \(x_{j+1}=Ax_j\)，并固定

$$
A=\begin{pmatrix}0.9&10\\0&0.9\end{pmatrix},\qquad
N=0.9I=\begin{pmatrix}0.9&0\\0&0.9\end{pmatrix}.
$$

两者的特征值都只是 \(0.9,0.9\)，所以两者都有 \(\rho=0.9<1\)。如果“特征值就是全部动力学”，你会预测它们的每一步都差不多。可是从 \(x_0=e_2=(0,1)^\top\) 出发，

$$
Ae_2=(10,0.9)^\top,\qquad Ne_2=(0,0.9)^\top.
$$

先别算更多步：你预测 \(\|A^j e_2\|_2\) 会不会超过 \(1\)？换成 \(e_1\) 后，结论还会不会成立？谜底不是“谱半径失效”，而是**有限时间的方向性增益**没有被谱半径记录。

### 2. 最小模型：一个幂零方向把信息剪切到另一坐标

写成

$$
A=rI+gK,\qquad K=\begin{pmatrix}0&1\\0&0\end{pmatrix},\qquad K^2=0.
$$

因为 \(rI\) 与 \(K\) 对易，二项式展开只剩两项。对 \(k\geq1\)，当 \(r\neq0\) 时

$$
A^k=\begin{pmatrix}a&b\\0&a\end{pmatrix},\qquad
a=r^k,\quad b=kgr^{k-1}.
$$

这里的 \(kgr^{k-1}\) 正是“先把 \(e_2\) 的能量送进第一坐标，再由 \(r\) 逐步收缩”的剪切项。\(r=0\) 不能把 \(0^{k-1}\) 当作无条件安全的代数记号：明确地，\(A^0=I\)，\(A^1=\left(\begin{smallmatrix}0&g\\0&0\end{smallmatrix}\right)\)，而 \(A^k=0\)（\(k\ge2\)）。

对于 \(M=\left(\begin{smallmatrix}a&b\\0&a\end{smallmatrix}\right)\)，

$$
M^\top M=\begin{pmatrix}a^2&ab\\ab&a^2+b^2\end{pmatrix},\qquad
\|M\|_2^2=\frac{2a^2+b^2+|b|\sqrt{b^2+4a^2}}{2}.
$$

因此实验画出的蓝色包络是**精确的** \(\|A^j\|_2\)，不是 \(j|g||r|^{j-1}\) 的粗略替代；金色曲线则是所选单位方向 \(x_0=(\cos\theta,\sin\theta)^\top\) 的 \(\|A^jx_0\|_2\)。同谱正规控制 \(N=rI\) 的对应值恒为 \(\|N^jx_0\|_2=|r|^j\)。

### 3. 确定性实验：每一步都要能对账

下面的实验只使用上述闭式公式，不抽样、不动画化随机轨迹。调节 \(r\)、耦合 \(g\)、horizon \(k\) 和初始角 \(\theta\)，然后读三笔账：

1. **轨迹账**：\(\|A^jx_0\|_2\) 与同谱正规控制 \(|r|^j\) 的逐步比较；
2. **最坏方向账**：精确 \(\|A^j\|_2\)，以及当前窗口 \(0\le j\le k\) 的峰值；
3. **resolvent 账**：固定 \(z=1.30\)，显示有限 Neumann 和
   \(\displaystyle R_k(z)=\sum_{j=0}^k z^{-j-1}A^j\)，并与完整 \((zI-A)^{-1}\) 比较。

先按“放大案例”读一遍，再切换到 \(g=0\)、\(e_1\)、\(r=1\)、\(r=1.1\) 和 \(r=0\)。每次只改变一个旋钮：这样才能把“耦合造成的瞬态”“初始方向造成的可见性”和“最终谱半径造成的渐近行为”分开。

### 4. 术语边界：五个相近的量不是一回事

- **渐近稳定性**是 \(A^j\to0\)；本族中它等价于 \(|r|<1\)。它不等于每一步 \(\|A^{j+1}\|_2\le\|A^j\|_2\)，也不等于欧氏诱导范数 \(\|A\|_2<1\)。
- **瞬态增益**是某个有限 \(j\) 的 \(\|A^j x_0\|_2/\|x_0\|_2\)，或最坏方向的 \(\|A^j\|_2\)。它会依赖 \(j\) 和方向；Gelfand 公式只控制 \(j\to\infty\) 的 \(j\) 次根极限，不能给有限时间单调性背书。
- **奇异值**是 \(A^j\) 的伸缩因子；最大奇异值就是 \(\|A^j\|_2\)。它测的是最坏方向增益，不是特征值，也不是“某个特征向量被乘了多少”。
- **特征向量条件数**描述对角化 \(A=V\Lambda V^{-1}\) 时基 \(V\) 的敏感度。若 \(g\ne0\)，本例是重复特征值的缺陷 Jordan 块：只有 \(\operatorname{span}\{e_1\}\) 一个特征方向，根本没有可逆特征向量矩阵 \(V\)，所以不能给它塞一个有限的 \(\kappa_2(V)\)。\(g=0\) 时 \(A=rI\)，可选正交特征基，\(\kappa_2(V)=1\)。
- **特征值扰动敏感性**与上述瞬态增益相关但不同。取
  \(\displaystyle E=\left(\begin{smallmatrix}0&0\\\varepsilon&0\end{smallmatrix}\right)\)，则 \(A+E\) 的特征值是
  \(\displaystyle r\pm\sqrt{g\varepsilon}\)（取复平方根），呈平方根级分裂；这是缺陷性的谱敏感性，不是说 \(\|A^j\|_2\) 的某个数值本身就是特征值误差。

### 5. 伪谱的诚实读法：resolvent 是桥，不是同义词

对 \(z\notin\sigma(A)\)，

$$
(zI-A)^{-1}=\begin{pmatrix}
\dfrac1{z-r}&\dfrac{g}{(z-r)^2}\\[4pt]
0&\dfrac1{z-r}
\end{pmatrix}.
$$

因此 \(\|(zI-A)^{-1}\|_2\) 变大时，\(z\) 对小矩阵扰动更敏感；在 \(2\)-范数下，

$$
z\in\sigma_\varepsilon(A)\iff
\|(zI-A)^{-1}\|_2>\varepsilon^{-1},
$$

并且 \(\varepsilon=1/\|(zI-A)^{-1}\|_2=\sigma_{\min}(zI-A)\) 是把 \(z\) 推成谱点所需的最小谱范数扰动。实验中的 \(R_k(z)\) 是**有限 horizon 的 resolvent 诊断**；它不是把有限和直接冒充成伪谱定义，完整 resolvent 才给出上面的精确 \(\varepsilon\)-尺度。

### 6. 回到定理：谱半径负责长期，Jordan 项负责过程

由闭式公式，\(|r|<1\) 时 \(r^k\to0\) 且 \(k|r|^{k-1}\to0\)，所以 \(A^k\to0\)。反之 \(|r|>1\) 时指数项不衰减，\(|r|=1\) 时 \(g\ne0\) 还会留下 \(kg r^{k-1}\)；故本族确实满足

$$
A^k\to0\quad\Longleftrightarrow\quad\rho(A)=|r|<1.
$$

这正是 Gelfand 公式

$$
\rho(A)=\lim_{k\to\infty}\|A^k\|^{1/k}
$$

所说的“渐近速度”。它允许 \(\|A^k\|_2\) 在早期上升、达到峰值、再下降；所以“最终稳定”与“过程没有放大”是两条不同的工程要求。

### 7. 迁移问题：把 Jordan 极限带到不同特征值

考虑

$$
B=\begin{pmatrix}0.8&6\\0&0.95\end{pmatrix}.
$$

先不计算数值：你预计 \(B^k e_2\) 的第一坐标会不会出现有限时间峰值？由上三角乘法可得

$$
B^k=\begin{pmatrix}
0.8^k&6\,\dfrac{0.8^k-0.95^k}{0.8-0.95}\\
0&0.95^k
\end{pmatrix};
$$

当 \(0.8\to0.95=r\) 时，差商极限正好变成 \(k r^{k-1}\)。请说明：这里的“差异化/差商”与 Jordan 块的 \(kg r^{k-1}\) 是什么关系？若把 \(6\) 换成 \(0\)，哪些瞬态与扰动敏感性同时消失？

<div class="learning-lab" data-learning-lab="non-normal-transient" markdown="1">

**无 JavaScript 时的静态读法：**固定 \(r=0.9,g=10,\theta=90^\circ,k=10\)，即 \(x_0=e_2\)。使用

$$
A^j e_2=\bigl(jgr^{j-1},r^j\bigr)^\top,\qquad
\|A^j e_2\|_2=\sqrt{(jgr^{j-1})^2+r^{2j}},\qquad
\|N^j e_2\|_2=r^j.
$$

手算账本可取 \(j=0,1,2,5,10\)；其中 \(j=0\) 单独记 \(A^0e_2=e_2\)，而 \(j\ge1\) 使用上式。预期正规控制依次是 \(1,0.9,0.81,0.59049,0.348678\)，而非正规轨迹约为 \(1,10.040,18.018,32.810,38.744\)。第 \(10\) 步的精确算子增益由上面的奇异值公式得到约 \(38.745\)。脚本加载后可调 \(r,g,k,\theta\)，查看同谱控制、精确 \(\|A^j\|_2\)、逐步 ledger、边界案例和 resolvent 诊断；脚本失败时仍可依照这些闭式式子完成整页推理。

</div>

</section>

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
