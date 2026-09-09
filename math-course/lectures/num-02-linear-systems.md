# 数值 II · 线性方程组的数值解法

> $Ax=b$ 是科学计算的头号内核（离散化 PDE、最小二乘、回归、图算法……最后都落到它）。高代 II 说“Cramer 法则给出解”；数值分析再追问：**这个解对输入有多敏感，算法又有没有额外添乱？**本页把直接法、迭代法和病态诊断放在同一张账上。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="linear-conditioning-learning-title">

## 学习层：小残差为什么不保证小前向误差？

<h3 id="linear-conditioning-learning-title">1. 先预测，再看交点</h3>

把二维方程组看成两条直线的交点。**这里两行法向都已归一化为单位长度**，才可以直接用夹角比较这个矩阵族的条件数；任意矩阵还要看行的尺度。两条法向的夹角很大时，右端有一点移动，交点只会轻轻移动；法向几乎平行时，两条直线像两把很窄的剪刀，右端同样大小的移动可能把交点沿着一条长方向推得很远。

先回答实验台的四个问题：

1. 病态矩阵的敏感方向受到一个很小的右端扰动时，前向误差会不会远大于残差？
2. 同一个 $A$ 换到非敏感方向，是否必然达到 $\kappa_2(A)$ 倍？
3. 报告小残差后，还要把哪些条件数和归一化量带回来？
4. 部分选主元是在治愈问题，还是只是在约束算法的舍入路径？

揭示前不显示数值参数、教学预设、图表或结果。提交后可以连续调节角度、扰动大小、扰动方向和真解尺度；“重新预测”会重新上锁。右端扰动可缩到 $10^{-18}$，也可切成零；此时重点比较理想模型与实际形成右端、实际消元的两张账。

<div class="learning-lab" data-learning-lab="linear-conditioning" markdown="1">

**无 JavaScript 时的静态读法：**令 $0<\theta\leq\pi/2$，

$$
A(\theta)=\begin{pmatrix}1&0\\ \cos\theta&\sin\theta\end{pmatrix},
\qquad x^*=\begin{pmatrix}1\\0\end{pmatrix},
\qquad b=A x^*.
$$

这里两行的法向夹角就是 $\theta$。因为

$$
A^\mathsf{T}A=\begin{pmatrix}1+\cos^2\theta&\cos\theta\sin\theta\\
\cos\theta\sin\theta&\sin^2\theta\end{pmatrix},
$$

其特征值为 $1+\cos\theta$ 与 $1-\cos\theta$，所以

$$
\sigma_{\max}=\sqrt{1+\cos\theta},\qquad
\sigma_{\min}=\sqrt{1-\cos\theta}=\sqrt2\sin(\theta/2),\qquad
\kappa_2(A)=\frac{\sigma_{\max}}{\sigma_{\min}}=\cot\frac\theta2.
$$

计算很小的 $\theta$ 时采用半角式，避免先算 $1-\cos\theta$ 发生相消。矩阵族在 $\theta>0$ 时可逆；一个不稳定表达式算出 0，不等于数学上的奇异。

取左奇异向量 $u_{\min}=(-1,1)^\mathsf{T}/\sqrt2$，令 $\delta b=\eta\|b\|_2u_{\min}$，例如 $\eta=0.01$。若 $\widehat x$ 精确解的是 $A\widehat x=b+\delta b$，那么

$$
r=b-A\widehat x=-\delta b,
\qquad
\rho=\frac{\|r\|_2}{\|b\|_2}=\eta,
$$

而当 $\delta b$ 沿某个单位方向 $u$ 时，前向误差满足这里的**精确关系**

$$
\frac{\|\widehat x-x^*\|_2}{\|x^*\|_2}
=\rho\,\frac{\|b\|_2}{\|x^*\|_2}
\|A^{-1}u\|_2.
$$

敏感方向给出 $\|A^{-1}u_{\min}\|_2=1/\sigma_{\min}$；非敏感方向则接近 $1/\sigma_{\max}$。因此 $\kappa_2$ 是 2-范数下的最坏方向因子和上界尺度，不是每一次扰动都会正好放大 $\kappa_2$ 倍。$\|b\|/\|x^*\|$、扰动方向和绝对/相对缩放都会进入残差到前向误差的换算。

| 预设 | $\theta$ | 扰动方向 | $\kappa_2(A)$ | $\rho=\|r\|/\|b\|$ | 前向误差的读法 |
|---|---:|---|---:|---:|---|
| 良态：直角 | $90^\circ$ | $u_{\min}$ | $1$ | $1\%$ | 约为 $1\%$ |
| 近乎平行 | $5^\circ$ | $u_{\min}$ | $\approx22.9$ | $1\%$ | 约为 $23\%$，但不必恰好等于 $\kappa\rho$ |
| 方向例外 | $5^\circ$ | $u_{\max}$ | $\approx22.9$ | $1\%$ | 约为 $1\%$；同一个 $\kappa$ 不会强迫最坏放大 |
| $b/x$ 陷阱 | $5^\circ$ | $u_{\min}$，$x^*=(0,1)^\mathsf{T}$ | $\approx22.9$ | $1\%$ | $\|b\|/\|x^*\|$ 变小，归一化改变读法 |

两条原始直线是 $x_1=b_1$ 与 $\cos\theta\,x_1+\sin\theta\,x_2=b_2$；虚线把右端换成 $b+\delta b$。绿色圈为 $x^*$，红色点为 $\widehat x$。脚本可用时，表格还会列出 $\|r\|/\|b\|$、标准后向误差、相对前向误差、$\kappa\rho$ 上界和精确恒等式。

</div>

### 2. 条件数与稳定性要分账

**问题条件性**问：输入稍微改变，精确答案会改变多少？对满秩方阵，$\kappa_2(A)=\|A\|_2\|A^{-1}\|_2$；它属于问题本身。**算法稳定性**问：舍入误差是否可以解释为某个邻近问题的误差？部分选主元通常改善 LU 的后向稳定性，却不改变 $\kappa_2(A)$；它不能把几乎平行的两条直线变成直角。

因此，**残差必须带归一化尺度**：一个小的绝对数，未必是相对于这个问题的小扰动。小的归一化后向误差也不能单独推出小前向误差。对精确的 $A$ 和 $b$ 扰动，常用相对上界是

$$
\frac{\|\widehat x-x\|_2}{\|x\|_2}
\leq \kappa_2(A)\frac{\|\delta b\|_2}{\|b\|_2},
\qquad b=Ax,
$$

但本页实验故意把“上界”和“本次方向”分开显示。$\kappa$ 约为 $10^k$ 只表示最坏情形存在 $10^k$ 数量级的相对放大风险；它不保证每个实例都损失恰好 $k$ 位，也不能替代输入精度、方向和算法误差的检查。

### 3. 动手核对：四个量必须同时出现

实验的精确账本使用

$$
\rho=\frac{\|r\|_2}{\|b\|_2},
\qquad
\eta_b=\frac{\|r\|_2}{\|A\|_2\|\widehat x\|_2+\|b\|_2},
\qquad
\eta_f=\frac{\|\widehat x-x^*\|_2}{\|x^*\|_2}.
$$

这些是实数模型的恒等式；实验先用奇异方向独立计算 $\delta x$ 与方向增益，再近似求值，不用已经算出的前向误差反过来定义增益。第二张实际计算表则真正形成 $\operatorname{fl}(b+\delta b)$ 并做部分选主元消元。

当请求扰动低于右端的浮点间距时，它可能在加法中消失。此时机器前向误差为 0，并不推翻解析模型中非零的 $\delta x$：**机器已经在求另一个输入问题**。实际残差也会舍入，显示为 0 不自动成为精确性证书。

### 4. 三道迁移题

**题 1：残差怎样掩盖前向误差？**令 $A=\operatorname{diag}(1,\epsilon)$，$0<\epsilon<1$，$x^*=(1,0)^\mathsf T$，$\widehat x=(1,1)^\mathsf T$。计算条件数、相对残差和相对前向误差。

<details class="answer" markdown="1">
<summary>展开推导</summary>

$b=(1,0)^\mathsf T$，$r=b-A\widehat x=(0,-\epsilon)^\mathsf T$。于是 $\kappa_2(A)=1/\epsilon$，$\rho=\epsilon$，前向误差为 1，恰达到 $\kappa_2\rho=1$。共同后向误差是 $\epsilon/(\sqrt2+1)$。任意小的 $\epsilon$ 都能产生小相对残差而不产生小前向误差。

</details>

**题 2：SPD 是否足以让 Jacobi 收敛？**考虑三阶矩阵，对角元都为 1，非对角元都为 $3/4$。判断正定性与 Jacobi 收敛性。

<details class="answer" markdown="1">
<summary>展开推导</summary>

$A=\frac14I+\frac34\mathbf1\mathbf1^\mathsf T$，特征值为 $5/2,1/4,1/4$，故 SPD。Jacobi 的 $D=I$，$G_J=I-A$ 的特征值为 $-3/2,3/4,3/4$，谱半径 $3/2>1$，不能对所有初值收敛。SPD 保证 Gauss–Seidel 收敛，并不自动保证 Jacobi。

</details>

**题 3：预条件器为什么要放在两边？**取 SPD 矩阵 $A,M$，解释为什么 $M^{-1}A$ 一般不对称，却仍可以用标准 PCG；应使用哪一个条件数？

<details class="answer" markdown="1">
<summary>展开推导</summary>

令 $x=M^{-1/2}z$，则系统化为 $Bz=M^{-1/2}b$，其中 $B=M^{-1/2}AM^{-1/2}$ 为 SPD。$M^{-1}A=M^{-1/2}BM^{1/2}$ 与 $B$ 相似，谱为正，但它的一般欧氏奇异值条件数不应直接塞进标准 CG 能量范数界。PCG 对应这个对称变换，界使用 $\kappa_2(B)=\lambda_{\max}(B)/\lambda_{\min}(B)$。

</details>

</section>

## 1. 直接法：Gauss 消元 = LU 分解

高代中的消元过程，矩阵语言重述为

$$
PA=LU\quad(P\text{ 为行置换},\ L\text{ 单位下三角},\ U\text{ 上三角}),
$$

可逆矩阵在精确算术中可用行选主元得到上述分解。不交换行的标准无零主元 LU，需要各阶顺序主子式非零，不能只由 $A$ 可逆就断言它存在。然后解两次三角系统：$Ly=Pb$（前代）、$Ux=y$（回代）。以下统一按“一次乘法或加法计 1 flop”计成本：稠密 LU 分解约为 $\frac23n^3$ flops，每个右端的两次三角解约为 $2n^2$ flops；选主元的比较、交换是 $O(n^2)$ 的低阶开销。**同一 $A$ 有多个右端时只做一次分解**，不要先求 $A^{-1}$ 再乘 $b$。

Cramer 法则没有一个脱离实现的唯一复杂度：若每个替换行列式都用 Laplace/余子式展开，$n$ 个行列式是 $O(n\,n!)$ 级别；若用消元来算每个行列式，也约为 $O(n^4)$。两种口径都比一次 LU 加回代差，而且 Cramer 的行列式相减也可能带来严重舍入误差，所以它适合证明存在性和小规模手算，不适合作为数值求解器。

**选主元为什么不可省。**若主元很小，消元乘数会很大，舍入误差可能沿后续运算放大。部分选主元在每列把绝对值最大的候选行换到主元位置，通常显著改善 LU 的算法稳定性；它改变的是计算路径，不改变问题的 $\kappa(A)$。即使 LU 后向稳定，病态问题仍可能有大的前向误差。

部分选主元使消元乘数绝对值不超过 1，却不保证所有中间元素都小。增长因子定义为消元过程中最大元素绝对值与原矩阵最大元素绝对值之比；它进入舍入误差界。最坏情形可达 $2^{n-1}$，所以“实际中通常可靠”不能升级成无条件、与问题规模无关的稳定保证。

**对称正定的特权（Cholesky）。**若 $A=A^\mathsf{T}$ 且 $x^\mathsf{T}Ax>0$（所有非零 $x$），则

$$
A=LL^\mathsf{T}.
$$

实稠密 Cholesky 分解约为 $\frac13n^3$ flops，约是 LU 主项的一半；每个右端仍需约 $2n^2$ flops 的三角解。SPD 前提成立时无需一般 LU 那样选主元，在正常完成、无溢出等标准条件下有后向稳定性结论；非常接近奇异的输入仍可能因舍入出现非正主元而中断；“分解出现正对角元”是实务中的正定诊断，但不是把任意对称矩阵都变成 SPD 的魔法。

正规方程要特别小心。满列秩 $A$ 时 $A^\mathsf{T}A$ 是 SPD，可以 Cholesky，但在 2-范数下

$$
\kappa_2(A^\mathsf{T}A)=
\frac{\sigma_{\max}(A)^2}{\sigma_{\min}(A)^2}
=\kappa_2(A)^2.
$$

所以最小二乘通常优先 QR 或 SVD，而不是为了省一步直接形成 $A^\mathsf{T}A$。

## 2. 病态方程组：条件数的主战场

<figure class="plot">
<div role="region" tabindex="0" aria-label="可横向滚动的方程交点静态图" style="overflow-x:auto"><img src="assets/img/num-02-condition.svg" alt="单位行法向角度90度与5度的方程交点，在相同相对右端扰动下的真实漂移" style="min-width:1100px"></div>
<figcaption><span class="fig-id">图 num-02.1</span>条件数的几何：良态方程组两直线交点清晰；病态方程组的两条法向近乎平行，右端微扰会让交点沿敏感方向漂移。学习层实验给出同一几何的可调精确账本。</figcaption>
</figure>

**矩阵条件数**

$$
\kappa(A)=\|A\|\,\|A^{-1}\|,
\qquad
\kappa_2(A)=\frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}
$$

（可逆时）。它给出 2-范数下对所有右端的最坏相对放大上界。固定 $A,b$ 后，右端问题的实际局部相对条件数为 $\|A^{-1}\|_2\|b\|_2/\|x\|_2$，可能严格小于 $\kappa_2(A)$；绝对求解增益最大的扰动方向是最小**左**奇异方向。一般带 $\delta A,\delta b$ 的前向误差公式是条件数乘输入相对扰动的一阶/上界量，具体实例还会受扰动方向、$\|b\|/\|x\|$ 和归一化方式影响。

对任意近似解 $\widehat x$，先定义残差

$$
r=b-A\widehat x.
$$

小 $\|r\|$ 说明 $\widehat x$ 是某个邻近右端问题的精确解，不能独立证明 $\widehat x$ 接近原问题的 $x$。规范的诊断顺序是：先报告 $\|r\|/\|b\|$ 或标准后向误差，再结合 $\kappa(A)$、输入尺度和目标前向误差；不能用“残差小”一句话代替条件性检查。

**共同范数后向误差为什么是这个分母？**固定非零 $b$ 和可逆 $A$，允许同时改变矩阵和右端，定义

\[
\eta=\min\left\{\epsilon\ge0:
(A+E)\widehat x=b+f,\quad
\|E\|_2\le\epsilon\|A\|_2,\
\|f\|_2\le\epsilon\|b\|_2\right\}.
\]

由 $r=E\widehat x-f$ 与三角不等式得到下界
\[
\eta\ge\frac{\|r\|_2}{\|A\|_2\|\widehat x\|_2+\|b\|_2}.
\]
若 $r,\widehat x\ne0$，令 $u=r/\|r\|$、$v=\widehat x/\|\widehat x\|$，以上式右端作为 $\eta$，取
$E=\eta\|A\|_2uv^\mathsf T$、$f=-\eta\|b\|_2u$，便达到等号。$r=0$ 时取零扰动；$\widehat x=0$ 时取 $E=0,f=-b$，仍成立。若只允许改 $b$，答案则是 $\|r\|/\|b\|$，不能混用。

若真输入同时有相对扰动 $\epsilon_A=\|\delta A\|/\|A\|$、$\epsilon_b=\|\delta b\|/\|b\|$，且 $\kappa(A)\epsilon_A<1$，从
$(A+\delta A)\delta x=\delta b-\delta A x$ 和逆矩阵扰动界可得
\[
\frac{\|\delta x\|}{\|x\|}
\le\frac{\kappa(A)}{1-\kappa(A)\epsilon_A}
(\epsilon_A+\epsilon_b).
\]
分母条件不能省；“条件数乘输入误差”是它的一阶近似形式。

经典例子是 Hilbert 矩阵 $h_{ij}=1/(i+j-1)$。它在较大阶数时极端病态，正规方程还会把条件数平方；这正是多项式拟合应优先使用正交基、QR 或 SVD 的数值理由。统计中的共线性、优化中的狭长谷底和这里的近乎平行直线，都是同一敏感度结构的不同外观。

## 3. 迭代法：大型稀疏的主场

**分裂法框架：**$A=M-N$，于是

$$
x^{(k+1)}=M^{-1}N x^{(k)}+M^{-1}b,
\qquad G=M^{-1}N.
$$

在 $M$ 可逆且使用固定线性迭代的前提下，**对任意初值都收敛到唯一解**的充要条件是 $\rho(G)<1$；误差满足 $e^{(k)}=G^k e^{(0)}$。$\rho(G)$ 越小，渐近收敛越快，但这不是说每一步都简单地乘上同一个标量。

以下约定 $A=D-L-U$，所以 $L,U$ 分别是原矩阵严格下、上三角部分的负值。

| 方法 | $M$ | 前提与特点 |
|---|---|---|
| **Jacobi** | $D$（对角） | $\rho(G_J)<1$ 才是充要条件；严格对角占优是常用充分条件，天然并行 |
| **Gauss–Seidel** | $D-L$（下三角） | 同样看迭代矩阵；严格对角占优或 SPD 等条件可保证收敛，边算边用新值 |
| SOR | $D/\omega-L$ | 对 SPD 矩阵，$0<\omega<2$ 保证收敛；其他矩阵需另查条件 |

**共轭梯度（CG）只给 SPD 矩阵。**它等价于在

$$
\min_x\ \frac12x^\mathsf{T}Ax-b^\mathsf{T}x
$$

上做 $A$-共轭方向搜索，因此要求 $A=A^\mathsf{T}\succ0$。精确算术中至多 $n$ 步得到精确解（也可能更早终止）；浮点运算中通常是近似收敛。对尚未精确终止且 $e_0\ne0$ 的迭代，经典能量范数界（$k\ge1$）为

$$
\frac{\|e_k\|_A}{\|e_0\|_A}
\leq
2\left(\frac{\sqrt{\kappa_2(A)}-1}{\sqrt{\kappa_2(A)}+1}\right)^k.
$$

稀疏矩阵每步主要成本是一次矩阵乘向量 $O(\mathrm{nnz})$；若采用固定 SPD 预条件器 $M$，PCG 对应 $M^{-1/2}AM^{-1/2}$ 上的 CG；应看该对称算子的谱与条件数，并计算每步求解 $Mz=r$ 的成本。预条件器不一定改善条件数，更不保证总时间更短；还要计入构造、应用与存储成本。对一般非对称矩阵，改看 GMRES 等方法，不能直接套 CG 的结论。

**迭代改进的入口。**先用已有分解求近似解，再以更高精度计算残差，解修正方程并更新解。这能在适当条件下提升精度，关键是残差精度、分解误差与收敛条件，不能仅把“多做几遍”当成保证。它直接连接下一步的混合精度数值计算。

**选型速查：**中小稠密一般矩阵 → 部分选主元 LU；SPD 稠密 → Cholesky；大型稀疏 SPD → CG 加预条件；大型稀疏一般矩阵 → GMRES 一族。

## 4. 典型例题

**例 1（选主元的必要性，手算级）。**

$$
\begin{pmatrix}10^{-8}&1\\1&1\end{pmatrix}x=
\begin{pmatrix}1\\2\end{pmatrix}.
$$

不选主元时第一步乘数为 $10^8$；在有限精度中，后续减法可能冲掉 $x_1$ 的信息。交换两行后主元为 1，舍入路径稳健得多。交换行改善的是算法稳定性，不是把这个矩阵的条件数改成 1。

**例 2（Jacobi 收敛判断）。**$A=\begin{pmatrix}4&1\\2&3\end{pmatrix}$ 严格对角占优，所以 Jacobi 与 Gauss–Seidel 都收敛。Jacobi 迭代矩阵

$$
G_J=\begin{pmatrix}0&-1/4\\-2/3&0\end{pmatrix},
\qquad
\rho(G_J)=\sqrt{1/6}\approx0.41;
$$

因此渐近误差按约 $0.41$ 的谱尺度衰减，而“约几步一位有效数字”仍取决于初始误差和停止准则。

**例 3（条件数体检）。**

$$
A=\begin{pmatrix}1&1\\1&1.0001\end{pmatrix}
$$

的两行法向几乎平行，$\kappa$ 约为 $4\times10^4$。这意味着某些方向上的输入相对扰动可能被放大到 $10^4$ 量级；它不是说任何 $b$ 的第 4 位小数都会必然改写答案的第 1 位，也不是说一个稳定的 LU 算法能消除这种问题条件性。$\blacksquare$

### 进一步阅读

- [LAPACK Users’ Guide：线性方程组误差界](https://www.netlib.org/lapack/lug/node81.html)：区别范数后向误差、分量后向误差与前向误差估计；其范数公式以无穷范数说明，本页单独推导了 2-范数版本。
- [Higham：消元的增长因子](https://nhigham.com/2020/07/14/what-is-the-growth-factor-for-gaussian-elimination/)：部分选主元为何通常有效，以及最坏情形的边界。
- [Shewchuk：共轭梯度导论](https://www.cs.cmu.edu/~quake-papers/painless-conjugate-gradient.pdf)：共轭方向、能量范数与预条件的几何推导。

---

*下一页：非线性方程求根（Newton 法的主场）与“用简单函数逼近复杂函数”——插值与拟合。*
