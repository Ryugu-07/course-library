# 数值线代 I · SVD、QR 与后向稳定性

> **对标**：Trefethen & Bau *NLA* Lectures 1–19 ｜ **前置**：本科高代 V–VI、数值 I–II
> 研究生数值线代的纲领（Trefethen 的开篇宣言）：**一切算法围绕矩阵分解组织，一切误差分析围绕"后向稳定 + 条件数"组织**。本页立起这两根柱子：SVD 作为"最诚实的分解"、Householder QR 作为稳定算法的典范、以及后向误差分析的正式语言。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="svd-learning-title">

## 学习层：奇异值很稳，不代表奇异向量也稳

<h3 id="svd-learning-title">1. 先预测：Weyl、gap 与低秩残差各管哪一笔账？</h3>

实验固定一个对称正定的 $2\times2$ toy：

$$
A=\begin{pmatrix}\sigma_1&0\\0&\sigma_2\end{pmatrix},\qquad
E=\begin{pmatrix}0&\eta\\\eta&0\end{pmatrix},\qquad
\sigma_1>\sigma_2>0.
$$

先判断四件事：奇异值位移是否总受 $\|E\|_2$ 控制；同样大小的 $\|E\|_2$ 在小谱隙下是否能明显旋转奇异向量；rank-1 截断残差是否等于下一奇异值；以及 gap 证书何时失效。提交前隐藏参数、图表和结果，揭示后才打开可调账本。

### 2. 静态后备：把数值稳定性与方向敏感性分开

<div class="learning-lab" data-learning-lab="svd-perturbation" markdown="1">

**JavaScript 失效时的静态读法：**奇异值的 Weyl 不等式是

$$
|\sigma_i(A+E)-\sigma_i(A)|\le \|E\|_2.
$$

它不含 gap，因此即使 $\sigma_1-\sigma_2$ 很小，奇异值仍然有这个范数级稳定性。相反，奇异向量需要分离条件：Wedin 或 Davis–Kahan 型结论的共同形状是“扰动范数除以有效谱隙”，而不是只看 $\|E\|_2$。在本对称 toy 中可以直接算出顶右奇异向量的旋转角

$$
\theta=\frac12\arctan\frac{2\eta}{\sigma_1-\sigma_2}.
$$

若 $\mathrm{gap}=\sigma_1-\sigma_2$ 且 $\mathrm{gap}-\|E\|_2>0$，一个保守的分离证书是

$$
\sin\theta\le
\min\!\left(1,\frac{\|E\|_2}{\mathrm{gap}-\|E\|_2}\right).
$$

这是本 toy 的 gap 证书形状；当分母不为正时，实验明确显示“证书失效”，而不是把它叫作向量收敛或稳定。对一般矩阵要按 Wedin 的左右奇异子空间分离量和相应残差形式重新核对，不能把这个 $2\times2$ 公式外推成无条件定理。

| 预设 | $(\sigma_1,\sigma_2,\eta)$ | Weyl 最大位移 | gap / 角度 | rank-1 残差 |
|---|---|---:|---:|---:|
| 大 gap | $(3,1,0.05)$ | $\approx0.00125\le0.05$ | gap $=2$，$\theta\approx1.43^\circ$ | $\|A+E-A_1\|_2=\sigma_2(A+E)\approx0.99875$ |
| 小 gap | $(3,2.95,0.05)$ | $\approx0.03090\le0.05$ | gap $=0.05$，$\theta\approx31.72^\circ$ | $\sigma_2(A+E)\approx2.91910$ |
| 证书边界 | $(3,2.9,0.15)$ | 仍 $\le0.15$ | gap $-\|E\|_2<0$，角度证书无效 | 仍由下一奇异值精确核对 |

Eckart–Young 在这张账上是另一件事：

$$
\|A+E-(A+E)_1\|_2=\sigma_2(A+E),\qquad
\|A+E-(A+E)_1\|_F=\sigma_2(A+E)
$$

（因为这里是 $2\times2$ 且只剩一个尾项）。所以“奇异值对输入扰动稳定”“奇异向量对小 gap 敏感”“低秩逼近残差由尾部奇异值定价”必须分成三行，不可用一个残差图替代。

### 3. 原始残差不是自动的“小后向误差”

对线性方程 $\widehat x$ 的原始残差 $r=b-A\widehat x$，$\|r\|_2$ 仍带着问题的量纲和尺度；允许同时扰动 $A,b$ 的范数向相对后向误差记为

$$
\eta_{A,b}=\frac{\|r\|_2}{\|A\|_2\|\widehat x\|_2+\|b\|_2}.
$$

因此“小原始残差”只有在报告 $\|A\|_2\|\widehat x\|_2+\|b\|_2$ 的归一化后，才可以称为小的相对后向误差。若只允许 $b$ 扰动，分母才取 $\|b\|_2$。前向误差还要经过条件数、方向和问题尺度转换；本实验的 SVD 残差 $\sigma_2(A+E)$ 是低秩逼近误差，不要把它改名成线性方程求解的后向误差。
</div>

</section>

## 1. SVD：数值世界的中心分解

<figure class="plot" markdown="1">
![SVD 低秩逼近误差随秩衰减](assets/img/nla-01-svd-lowrank.svg)
<figcaption><span class="fig-id">图 1.1</span>SVD 低秩逼近误差 \(\sqrt{\sum_{i>k}\sigma_i^2}\)（Eckart–Young）：奇异值衰减越快，低秩压缩越准。</figcaption>
</figure>

$A = U\Sigma V^\top$（本科高代 VI 已证存在）。数值视角下它的三重身份：

- **几何真相**：任何矩阵 = 旋转 × 拉伸 × 旋转——条件数 $\kappa_2 = \sigma_1/\sigma_n$（数值 I 的定义在此显出几何脸：最大与最小拉伸比）；
- **最佳低秩逼近（Eckart–Young）【证明】**：$\min_{\mathrm{rank}(B)\leq k}\|A - B\|_2 = \sigma_{k+1}$，达于截断 SVD $A_k$。*证*：上界显然（$\|A - A_k\| = \sigma_{k+1}$）；下界——任取秩 $\leq k$ 的 $B$，$\ker B$ 维数 $\geq n - k$，与 $V$ 的前 $k+1$ 列张成空间必相交于非零 $w$：$\|(A - B)w\| = \|Aw\| \geq \sigma_{k+1}\|w\|$。$\blacksquare$（PCA/压缩/推荐系统低秩近似的最优性执照——高代 VI 预告的兑付。）
- **数值秩**：浮点世界没有"恰好为零"的奇异值——秩的实用定义是 $\#\{\sigma_i > \mathrm{tol}\}$：**秩是个带公差的工程量**（数值 I 哲学的深化）。

## 2. 后向稳定性：误差分析的正确提问

**定义** 算法 $\tilde f$ 计算 $f$ 是**后向稳定**：对每个输入 $x$，存在小扰动 $\|\Delta x\| = O(\varepsilon_{\text{mach}})\|x\|$ 使

$$
\tilde f(x) = f(x + \Delta x)
$$

——"**给出的是附近某个问题的精确答案**"。前向误差由此分解（数值 I 的公式获得正式地位）：

$$
\text{前向误差} \;\lesssim\; \kappa(x)\cdot\text{后向误差}
$$

**读法（分工宣言）**：算法只对后向误差负责（把它压到机器精度），条件数是问题自带的病情——**"稳定的算法 + 病态的问题 = 精确解错题"是无法避免的宿命，但责任在问题不在算法**。此语言下的判决先例：内积、Householder QR、回代求解三角系统皆后向稳定【引用 Higham】；**经典 Gram–Schmidt 不稳定**（正交性损失 $\sim\kappa^2\varepsilon$；改良版 MGS 半救、Householder 全救——见下）；正规方程法 $A^\top Ax = A^\top b$ 把条件数**平方**（$\kappa(A^\top A) = \kappa(A)^2$）——最小二乘的第一戒律。

## 3. Householder QR：稳定算法的典范

**Householder 反射**：$H = I - 2vv^\top/(v^\top v)$——关于超平面的镜像（正交对称阵）。选 $v = x \pm \|x\|e_1$ 使 $Hx = \mp\|x\|e_1$：**一次反射清零一整列的下方**（符号取与 $x_1$ 同号者避免相消——数值 I 的病例在细节处站岗）。逐列反射 $H_{n-1}\cdots H_1 A = R$ ⇒ $A = QR$。

**为什么稳定【机理级】**：全程只乘**正交矩阵**——正交变换保 2-范数（$\kappa_2(Q) = 1$），**误差被搬运而不被放大**；对比消元法靠选主元"祈祷"增长因子不爆。"能用正交变换就用正交变换"是数值线代的第一美德（Givens 旋转是稀疏场景的替补【引用】）。

**最小二乘的标准作业**：$\min\|Ax - b\|_2$ ⇒ QR 后解 $Rx = Q^\top b$——后向稳定且条件数不平方；病态到 $\kappa$ 巨大时上 SVD（截断小奇异值 = 正则化：与岭回归殊途同归【引用】，统计 V/优化线的老朋友以数值身份三会）。

## 4. 练习与要点

**例 1（Eckart–Young 实感）** 秩 50 的 $1000\times1000$ 图像矩阵：存 SVD 前 50 项 = 原存储的 10%，误差 $\sigma_{51}$——"图像压缩几行代码"背后的最优性定理；同时是"embedding 矩阵低秩近似"的定价公式。

**例 2（正规方程 vs QR 数值实验设计）** 取 $\kappa(A) = 10^6$ 的病态最小二乘：正规方程有效精度 $\sim 10^{-16}\times10^{12} = 10^{-4}$，QR $\sim 10^{-10}$——**六位数字的差距**来自"条件数是否被平方"一个决定。sklearn 的 `lstsq` 走 SVD/QR 而非正规方程，原因在此。

**例 3（后向语言的翻译练习）** "解 $Ax = b$ 得到的 $\tilde x$ 原始残差 $\|A\tilde x - b\|$ 很小"——这是一个未归一化的残差陈述，不应直接叫“小后向误差”。相对后向误差应写为

$$
\eta_{A,b}=\frac{\|A\tilde x-b\|}{\|A\|\,\|\tilde x\|+\|b\|}.
$$

这是允许同时扰动 $A,b$ 的范数向相对后向误差；若题目只允许右端 $b$ 扰动，则使用 $\|A\tilde x-b\|/\|b\|$。

它说明 $\tilde x$ 精确解决了某个邻近输入问题；残差小仍不等于前向误差小，后者还差条件数和扰动方向。$\blacksquare$

---

*下一页：特征值怎么算——幂法的理论、QR 迭代的机理与收敛，以及"为什么特征值必须迭代"。*
