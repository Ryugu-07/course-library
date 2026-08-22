# 数值线代 III · Krylov 子空间方法

> **对标**：Trefethen & Bau Lectures 32–40 ｜ **前置**：nla-01/02、本科数值 II、优化 II（CG 预告）
> 当 $n$ 到百万级、矩阵稀疏（只有 $O(n)$ 个非零），分解法（$O(n^3)$）出局——唯一买得起的操作是**矩阵乘向量**。Krylov 方法的纲领：只用乘向量，在"乘出来的子空间"里找最优解。CG 的收敛性证明是本页主菜，预条件是本页的实战灵魂。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="nla-krylov-learning-title">

<h2 id="nla-krylov-learning-title">学习层：CG 的收敛，到底是 κ 还是谱的形状？</h2>

### 1. 具体谜题：同一个条件数，为什么实际步数可以差很多？

先把“系统很大”的干扰拿掉，只看一个完全可复核的对角 SPD 教学模型：

$$
A=\operatorname{diag}(\lambda_1,\ldots,\lambda_n),\qquad b=Ax_*,\qquad x_0=0.
$$

比较下面两组 $n=12$ 的谱：

$$
\begin{aligned}
\Lambda_{\rm uniform}&=\{1,\tfrac{35}{11},\tfrac{59}{11},\ldots,\tfrac{275}{11}\},\\
\Lambda_{\rm cluster}&=\{1,1,1,1,8,8,8,8,25,25,25,25\}.
\end{aligned}
$$

两者都有

$$
\kappa(A)=\frac{\lambda_{\max}}{\lambda_{\min}}=\frac{25}{1}=25,
$$

但第一组把谱铺满 $[1,25]$，第二组只有三个不同特征值。取 $x_*=(1,\ldots,1)^\top$，先不要运行：你预测哪一个更早让 $\|e_k\|_A$ 接近零？再问一个更尖锐的问题：若矩阵和 κ 都不变，只把 $e_0=x_*-x_0$ 改成只含最小、最大两个特征向量方向，实际步数会不会也改变？

### 2. 先预测，再展开账本

下面的实验只构造 $n\leq12$ 的**对角**系统，不生成稠密大矩阵、不抽样、不把百万维数据伪装成 benchmark。每个预设都固定 $A$、$b$ 和 $x_0$，只让你切换已经写进账本的教学问题：

1. **同 κ：均匀谱 vs 三簇谱**——预期三簇谱只需要消灭三个有效特征值方向，明显早于均匀谱。
2. **同谱：初始方向权重**——预期只含两个端点方向的误差在两步内结束；这不是 κ 变好了，而是其余特征向量方向的初始权重为零。
3. **透明预条件：分组对角 $M$**——预期 PCG 看到的是 $\mu_i=\lambda_i/m_i$ 的三档有效谱，条件数和实际步数都下降；$M$ 的每个对角条目在实验中公开列出。
4. **边界：$\kappa=1$ 与零残差**——$A=7I$ 的非零误差一步结束；若 $r_0=0$，根本不应计算 $\alpha_0$，零步已经是答案。

拖动“逐步展开到第 $k$ 步”时，蓝线是归一化 $A$-范数误差
$\|e_k\|_A/\|e_0\|_A$，红色虚线是归一化的**真**残差
$\|b-Ax_k\|_2/\|r_0\|_2$，金色点线是 Chebyshev 条件数上界。下方再看有效谱、初始能量权重、残差多项式滤波值和逐行 recurrence 账本。先在心里押一个答案，再点“核对预测”；反馈只针对当前这个小模型，不把定理界说成步数预言。

<div class="learning-lab" data-learning-lab="cg-spectrum" markdown="1">

**JavaScript 失效时的静态 fallback（可手算 2×2）：**取

$$
A=\begin{pmatrix}1&0\\0&4\end{pmatrix},\qquad
x_*=(1,1)^\top,\qquad x_0=(0,0)^\top,\qquad b=(1,4)^\top.
$$

于是 $r_0=b-Ax_0=(1,4)^\top$、$p_0=r_0$，并且

$$
\alpha_0=\frac{r_0^\top r_0}{p_0^\top Ap_0}=\frac{17}{65},\qquad
x_1=\left(\frac{17}{65},\frac{68}{65}\right)^\top.
$$

用 recurrence 得

$$
r_1=r_0-\alpha_0Ap_0=\left(\frac{48}{65},-\frac{12}{65}\right)^\top,
$$

而直接重算也给

$$
b-Ax_1=\left(1-\frac{17}{65},4-\frac{272}{65}\right)^\top
=\left(\frac{48}{65},-\frac{12}{65}\right)^\top.
$$

这就是本实验要求的“recurrence 与显式真残差对账”。接着

$$
\beta_0=\frac{r_1^\top r_1}{r_0^\top r_0}=\frac{144}{4225},
\qquad
p_1=r_1+\beta_0p_0=\left(\frac{3264}{4225},-\frac{204}{4225}\right)^\top,
$$

再算

$$
\alpha_1=\frac{r_1^\top r_1}{p_1^\top Ap_1}=\frac{65}{68},
\qquad r_2=0,\qquad x_2=x_*.
$$

所以 $\kappa=4$ 的这个 2×2 例子在两步内精确结束。逐步读数为

| $k$ | $\|e_k\|_A/\|e_0\|_A$ | $\|r_k\|_2/\|r_0\|_2$ | $2((\sqrt4-1)/(\sqrt4+1))^k$（截到 1） |
|---:|---:|---:|---:|
| 0 | $1$ | $1$ | $1$ |
| 1 | $6/\sqrt{325}\approx0.3328$ | $12/65\approx0.1846$ | $2/3$ |
| 2 | $0$ | $0$ | $2/9$ |

这里 CG 的 $A$-范数误差按嵌套 Krylov 空间最小化；残差二范数只是另一个读数，不能从这个例子的下降就推出“残差二范数总是单调”。

</div>

### 3. 最小模型：误差多项式、A-范数与真残差

令 $e_k=x_*-x_k$。对称正定 $A$ 给出内积

$$
\langle u,v\rangle_A=u^\top Av,\qquad \|u\|_A=\sqrt{u^\top Au}.
$$

CG 的精确算术目标不是“每一步都让任意范数下降”，而是

$$
x_k=\arg\min_{x\in x_0+\mathcal K_k(A,r_0)}\|x_*-x\|_A,
\qquad
\|e_k\|_A\leq\|e_{k-1}\|_A.
$$

在对角谱坐标里，$e_k=p_k(A)e_0$，其中 $p_k(0)=1$。因此第 $i$ 个特征方向的误差被 $p_k(\lambda_i)$ 乘上；而

$$
r_k=b-Ax_k=Ae_k,
$$

所以实验可以同时显示“方向权重 × 多项式滤波”。某个方向若 $e_{0,i}=0$，它虽然属于 $\operatorname{spec}(A)$，却不在这一次具体问题的有效误差里；实际收敛依赖这些权重，而不只依赖一个 κ。

标准 CG 的三项 recurrence 是

$$
\begin{aligned}
r_k&=b-Ax_k, & p_0&=r_0,\\
\alpha_k&=\frac{r_k^\top r_k}{p_k^\top Ap_k}, & x_{k+1}&=x_k+\alpha_kp_k,\\
r_{k+1}&=r_k-\alpha_kAp_k, &
\beta_k&=\frac{r_{k+1}^\top r_{k+1}}{r_k^\top r_k},\\
p_{k+1}&=r_{k+1}+\beta_kp_k.
\end{aligned}
$$

实验对每一行同时保留 recurrence 得到的 $r_k$ 和显式 $b-Ax_k$，用
$\|r_k^{\rm rec}-(b-Ax_k)\|_2$ 做断言。这样“残差很小”不会因为只维护一条递推而失去可审计性。

### 4. Chebyshev 界：最坏情形，不是预测器

记 $\kappa=\lambda_{\max}/\lambda_{\min}$。归一化的经典界为

$$
\frac{\|e_k\|_A}{\|e_0\|_A}
\leq \min\left\{1,\,2\left(\frac{\sqrt\kappa-1}{\sqrt\kappa+1}\right)^k\right\}.
$$

它只知道一个谱区间，故必须把它读成**所有允许初始方向和谱形状中的最坏情形上界**。三簇谱的实际多项式只需在三个点附近变小，可能远低于这个区间界；但“界很松”不等于定理错，也不等于下一次任意问题都会三步结束。

边界 $\kappa=1$ 要单独处理：$A=\lambda I$ 时 $r_0\neq0$ 的 CG 一步精确，不能把
$((\sqrt\kappa-1)/(\sqrt\kappa+1))^k$ 的 $0^0$ 当作普通数值表达式。$r_0=0$ 时 $x_0=x_*$，应在 $k=0$ 停止；否则 $\alpha_0$ 的分母和 $\beta_0$ 的分母可能被错误地写成零。

### 5. 透明预条件：改变有效谱，而不是隐藏捷径

预条件 CG 用一个易解的 SPD $M$ 改善几何。对本实验的对角模型，$M=\operatorname{diag}(m_i)$，所以

$$
z_k=M^{-1}r_k,\qquad \rho_k=r_k^\top z_k,
$$

并把标准公式中的 $r_k^\top r_k$ 换成 $r_k^\top z_k$。有效谱是

$$
\mu_i=\frac{\lambda_i}{m_i},\qquad
\kappa_{\rm eff}=\frac{\max_i\mu_i}{\min_i\mu_i}.
$$

实验的预设把 12 个均匀谱条目分成三组，公开选择 $m_i$ 使三组 $\mu_i$ 分别落在 $1,1.25,1.5$；因此原始 $\kappa=25$，但 $\kappa_{\rm eff}=1.5$，而且有效谱只有三档。这里的“预条件有效”来自谱结构的透明重标度，不是把答案直接塞进 $x_*$；账本仍然显示原始真残差 $b-Ax_k$。

### 6. 边界、有限精度与“n 步精确”的准确说法

- 精确算术中，CG 至多在最小多项式次数步结束；一般上界是 $n$，但重复特征值、有效初始方向和聚集谱都可能让实际次数小于 $n$。
- 浮点算术会损失 $A$-共轭方向的精确正交性，故“第 $n$ 步一定得到机器精确解”不是可交付的工程承诺。实验把达到容差和显式残差 gap 分开显示，不把浮点结果写成理论精确。
- $\|e_k\|_A$ 是 CG 的最小化对象；$\|r_k\|_2$ 没有同样的单调保证，甚至可以出现小幅回升。预条件改变的是有效几何，不会自动保证每个未预条件的残差读数都按同一比例下降。
- 真实大问题的成本取决于稀疏矩阵-向量乘、预条件器求解、内存和并行通信；本实验故意只做小型、可逐项断言的模型，不能从它外推“百万维需要几步”或壁钟性能。

</section>

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
