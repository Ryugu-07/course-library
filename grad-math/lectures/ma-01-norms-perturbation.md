# 矩阵分析 I · 范数、谱半径与扰动证据

> **本页问题**：一个最终会衰减的系统，为什么能先把误差放大几十倍？特征值几乎没变，为什么主方向却转了很大的角度？
>
> 前置：[数值表示、SVD与后向误差](nla-01-svd-stability.html)、[特征值迭代](nla-02-eigen.html)、[Krylov方法与真实残差](nla-03-krylov.html)。这些问题需要不同的量来回答，本页逐个建立它们之间的联系。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ma-norm-learning-title">

## 学习层：先确定你在问哪个时刻、哪个方向

<h3 id="ma-norm-learning-title">同谱不等于同样的有限时间表现</h3>

把初始向量想成一次很小的扰动。矩阵反复作用后，它可能很快缩小，也可能先沿另一方向被放大，再慢慢衰减。“最终衰减”只回答足够久之后的问题，没有承诺中途安全。

| 问题 | 该读的量 | 不能直接推出什么 |
|---|---|---|
| 很久以后会不会归零？ | 谱半径与Gelfand极限 | 每一步的长度都下降 |
| 第几步最危险？ | 所选方向增益与算子范数 | 有限窗口峰值就是全时间峰值 |
| 改一点矩阵，谱会移多远？ | Weyl或伪谱，注意矩阵条件 | 单个特征方向也一样稳定 |
| 不求出全部特征值，能定位多少？ | Gershgorin圆盘及分离分组 | 圆盘内每一点都是真实特征值 |

实验使用二维Jordan块、二维对称扰动和三维对称链。每一个矩阵、向量、实际乘法和残差都有记录。小模型帮助理解判断依据；这里没有大型矩阵性能测试。

<div class="learning-lab" data-learning-lab="non-normal-transient" markdown="1">

**关闭JavaScript仍能核对。** 下表与插图来自固定运行；交互会在当前浏览器重新计算。公式描述的精确算术对象与实际浮点记录分别保留。

固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵、向量和运算记录](assets/learning/projects/matrix-norms/run-snapshot.json)。瞬态使用r=0.9、g=10、e₂与30步窗口；发散例使用A=0.9I、z=0.5与8阶部分和；对称例使用中心1、谱隙1、原轴0°、幅度0.1与扰动正轴45°；圆盘例使用正文三维链。各共同单位尺度均为1。

| 固定参数下的量 | 参考值 |
|---|---:|
| Jordan谱半径 | 0.9 |
| e₂第一步增益 | 10.040418318 |
| 窗口最大算子增益 | 38.7459227175 |
| 最早达到该峰值的步数 | 9 |
| e₂第30步增益 | 14.1304496783 |
| 发散例的逆矩阵范数 | 2.5 |
| 发散例第8阶部分和范数 | 493.39822592 |
| 逆矩阵减第8阶部分和范数 | 495.89822592 |
| 对称例实际扰动范数 | 0.1 |
| 首特征值绝对变化 | 0.00990195135928 |
| 首方向夹角的sin | 0.0985376179666 |
| 小扰动间隔估计 | 0.111111111111 |
| 第一行圆盘半径 | 1 |
| 第二行圆盘半径 | 2 |
| 第三行圆盘半径 | 1 |
| 分离组确定的负特征值数 | 1 |
| 分离组确定的正特征值数 | 2 |
| Jacobi最大本征残差 | 9.99200722163e-16 |

这里的峰值仅属于30步窗口。发散例的逆矩阵存在，但Neumann级数不收敛；对称方向估计依赖谱隙条件。圆盘计数来自定理与分离关系，Jacobi残差单独展示实际求解精度。


</div>

[![矩阵瞬态、Neumann余项、对称方向扰动与Gershgorin定位](assets/img/ma-01-norm-ledgers.svg)](assets/img/ma-01-norm-ledgers.svg)

插图可打开原尺寸；线性图保留真实零，对数图仅显示严格正的实际读数。没有出现的点需要回表查看，不能把空白读成零。

</section>

## 1. 范数测伸缩，谱半径测特征方向

先在有限维复向量空间上固定一个向量范数，定义诱导矩阵范数

$$
\|A\|=\sup_{x\ne0}\frac{\|Ax\|}{\|x\|}.
$$

将 $ABx$ 分两次估计，立即得到

$$
\|ABx\|\le\|A\|\,\|Bx\|
\le\|A\|\,\|B\|\,\|x\|,
\qquad \|AB\|\le\|A\|\,\|B\|.
$$

若 $Av=\lambda v$ 且 $v\ne0$，则 $|\lambda|\le\|A\|$，所以谱半径满足

$$
\rho(A)=\max_{\lambda\in\sigma(A)}|\lambda|
\le\|A\|.
$$

反向一般不成立。幂零矩阵

$$
K=\begin{pmatrix}0&1\\0&0\end{pmatrix}
$$

满足 $\rho(K)=0$，但 $\|K\|_2=1$：它把 $e_2$ 送到 $e_1$，再送到零。

欧氏诱导范数由最大奇异值给出。列和范数、行和范数与Frobenius范数则为

$$
\|A\|_1=\max_j\sum_i|a_{ij}|,\qquad
\|A\|_\infty=\max_i\sum_j|a_{ij}|,\qquad
\|A\|_F=\left(\sum_{i,j}|a_{ij}|^2\right)^{1/2}.
$$

其中Frobenius范数是矩阵元素上的欧氏范数；$n>1$ 时 $\|I\|_F=\sqrt n$，因此它不是同一空间上某个向量范数的诱导范数。有限维中这些范数相互控制，但常数可能依赖维数。不要在一个需要明确误差常数的式子里不加说明地互换它们。

## 2. Jordan块怎样制造瞬态

考虑

$$
A=rI+gK=\begin{pmatrix}r&g\\0&r\end{pmatrix},
\qquad K^2=0.
$$

当 $k\ge1$ 且 $r\ne0$，二项式展开给出

$$
A^k=r^kI+kg r^{k-1}K.
$$

若 $r=0$，应单独写 $A^0=I$、$A^1=gK$、$A^k=0$（$k\ge2$），不依赖含糊的零次幂约定。

从 $e_2$ 出发，剪切项把第二坐标传到第一坐标：

$$
A^ke_2=(kg r^{k-1},r^k)^T.
$$

取 $r=0.9,g=10$，第一步长度就超过10，尽管谱半径只有0.9。从 $e_1$ 出发却只有 $A^ke_1=r^ke_1$，完全看不到剪切项。因此所选方向的增益与最坏方向增益必须分开。

对任意实数 $a,b$，令 $T=\left(\begin{smallmatrix}a&b\\0&a\end{smallmatrix}\right)$。由 $T^TT$ 的二阶特征方程可得

$$
\sigma_{\max}(T)=\frac{\sqrt{4a^2+b^2}+|b|}{2},
\qquad
\sigma_{\min}(T)=\frac{a^2}{\sigma_{\max}(T)}
$$

（零矩阵另记两个奇异值均为0）。第二式利用两个奇异值的乘积为 $|\det T|=a^2$，避免直接相减两个接近的大数。

实验同时计算逐次矩阵乘法得到的 $A^j$ 与闭式结果，并记录两者差距。曲线来自浮点计算，不把公式里的“等于”自动解释成逐位一致。

## 3. Gelfand公式为什么只负责渐近速率

先证明一个基本事实：

$$
A^k\to0\quad\Longleftrightarrow\quad\rho(A)\lt1.
$$

若有 $|\lambda|\ge1$，沿相应特征向量的 $A^kv=\lambda^kv$ 就不趋于零。反过来，将矩阵化成Jordan块。对 $J=\lambda I+N$、$N^m=0$，

$$
J^k=\sum_{j=0}^{\min(k,m-1)}
\binom kj\lambda^{k-j}N^j.
$$

当 $0\lt|\lambda|\lt1$，每一项是固定次数的多项式乘几何衰减，趋于零；$\lambda=0$ 时整个块最终恰为零。相似变换只引入固定的范数常数，于是结论成立。

现在证明Gelfand公式。对诱导范数，特征向量论证先给

$$
\rho(A)\le\|A^k\|^{1/k}.
$$

任取 $\varepsilon>0$，令 $B=A/(\rho(A)+\varepsilon)$。其谱半径严格小于1，因此 $B^k\to0$，从而存在固定 $C$ 使所有 $\|B^k\|\le C$。于是

$$
\|A^k\|^{1/k}
\le(\rho(A)+\varepsilon)C^{1/k}.
$$

取上极限再令 $\varepsilon\downarrow0$，得到

$$
\lim_{k\to\infty}\|A^k\|^{1/k}=\rho(A).
$$

对任意其他矩阵范数，利用有限维范数等价即可转移结论，因为固定比较常数的 $k$ 次根趋于1。

这个证明没有给出第10步、第100步的实用误差预算，也没有推出序列 $\|A^k\|$ 单调。[Kozyakin的原始研究](https://arxiv.org/abs/0810.2856)进一步研究了有限步逼近速率；本页不把极限公式本身当作已有速率估计。

## 4. 能不能换一种长度，让范数接近谱半径？

可以，但改变长度也会改变“误差有多大”的含义。若 $A=VJV^{-1}$ 为Jordan分解，对每个大小为 $m$ 的块取

$$
D=\operatorname{diag}(1,t,t^2,\ldots,t^{m-1}),
\qquad t>0.
$$

那么 $D^{-1}JD$ 的超对角元从1变成 $t$。把各块的 $D$ 合并，并设 $S=VD$，在新范数

$$
\|x\|_{\rm new}=\|S^{-1}x\|_\infty
$$

下，诱导矩阵范数满足

$$
\|A\|_{\rm new}=\|S^{-1}AS\|_\infty
\le\rho(A)+t.
$$

所以所有诱导范数中的下确界是谱半径。不过，下确界不一定取得：非零幂零矩阵的谱半径是0，任何真正的矩阵范数却都不能把它记为0。随着 $t$ 很小，坐标变换还可能变得病态；这不是消除了原来欧氏长度下的瞬态。

## 5. Neumann和：有限恒等式与无限收敛要分开

对 $z\ne0$，定义有限和

$$
S_k(z)=\sum_{j=0}^k z^{-j-1}A^j.
$$

逐项相消给出不需要收敛假设的恒等式

$$
(zI-A)S_k(z)=I-z^{-k-1}A^{k+1}.
$$

若 $zI-A$ 可逆，令 $R(z)=(zI-A)^{-1}$，还有

$$
R(z)-S_k(z)=R(z)\,z^{-k-1}A^{k+1}.
$$

只有当 $\rho(A)/|z|\lt1$ 时，才可由上一节证明尾项趋于零，从而将无限Neumann和等同于 $R(z)$。**逆矩阵存在本身不保证这一展开收敛。** 比如 $A=0.9I,z=0.5$，逆矩阵存在，但每项含 $1.8^j$，不会趋于零。

一般标量幂级数 $\sum c_kz^k$ 若收敛半径为 $R$，$\rho(A)\lt R$ 是相应矩阵级数收敛的充分条件。边界 $\rho(A)=R$ 需要另查：即使是标量单位阵，$\sum I/k^2$ 与 $\sum I$ 就有不同结果；非平凡Jordan块还涉及导数型项。

实验逐项保留 $z^{-j-1}A^j$、部分和、尾项以及实际恒等式缺陷。$z=0$ 时这些有限和不定义；$z=r$ 时Jordan模型的逆矩阵不定义，两种失败原因分别标记。

## 6. 伪谱：把某个数变成特征值，需要改多少矩阵？

本页采用**闭** $\varepsilon$-伪谱约定，$\varepsilon\ge0$：

$$
\sigma_\varepsilon(A)
=\{z:\sigma_{\min}(zI-A)\le\varepsilon\}.
$$

它等价于存在 $\|E\|_2\le\varepsilon$ 使 $z\in\sigma(A+E)$。证明可以直接看最小扰动：

若 $(A+E)v=zv$ 且 $\|v\|_2=1$，则

$$
\|E\|_2\ge\|Ev\|_2
=\|(zI-A)v\|_2
\ge\sigma_{\min}(zI-A).
$$

反之取最小右奇异向量 $v$，记 $w=(zI-A)v$，令 $E=wv^*$，便有 $Ev=w$、$\|E\|_2=\|w\|_2$，达到这个下界。

当 $z$ 不在原谱中，

$$
\|R(z)\|_2=\frac1{\sigma_{\min}(zI-A)}.
$$

谱点处逆矩阵不存在，不能在代码中返回一个有限“逆矩阵”；在讨论伪谱时可约定逆范数为无穷。[Trefethen、Contedini与Embree的定义2.1](https://people.maths.ox.ac.uk/~trefethen/publication/PDF/2001_96.pdf)给出了这些等价描述。

实验把最小奇异值、实际浮点向量构造出的扰动范数和构造后残差分别列出。接近奇异时，最小奇异值可以很小，而浮点向量乘法会留下不同量级的舍入缺陷；不能擅自把这三列改成同一个数。

## 7. Weyl：对称特征值的绝对变化有界

对实对称矩阵，将特征值按

$$
\lambda_1(A)\ge\cdots\ge\lambda_n(A)
$$

排列。Courant–Fischer公式为

$$
\lambda_i(A)
=\min_{\dim S=n-i+1}\quad
\max_{\substack{x\in S\\\|x\|_2=1}}x^TAx.
$$

为什么维数是这个数？任意这样的 $S$ 都与前 $i$ 个特征向量张成的空间有非零交集，因此其最大Rayleigh商至少为 $\lambda_i$；取后 $n-i+1$ 个特征向量张成的空间，恰好达到该值。

若 $E=E^T$ 且 $\eta=\|E\|_2$，对所有单位向量都有

$$
-\eta\le x^TEx\le\eta.
$$

把它加到Rayleigh商中，再依次取最大值、最小值，得到

$$
|\lambda_i(A+E)-\lambda_i(A)|\le\eta.
$$

这是**绝对**变化界。若某个特征值很接近0，相同的绝对变化仍可能对应很大的相对变化。此外，有序的第 $i$ 个数与一个带有物理标签的方向是不同对象；在谱交叉附近，不能用“排序稳定”代替方向匹配的论证。[Hsu的讲义](https://www.cs.columbia.edu/~djhsu/AML/lectures/davis-kahan.pdf)给出了Weyl与子空间扰动的连贯说明。

## 8. 单个方向的稳定性：分母究竟是哪一道谱隙？

设 $A$ 对称，目标特征值 $\lambda_i$ 是单的，单位特征向量为 $v_i$。对任意单位候选向量 $\widehat v$ 和实数 $\mu$，定义

$$
r=(A-\mu I)\widehat v,\qquad
\delta=\min_{j\ne i}|\lambda_j-\mu|.
$$

若 $\delta>0$，在原矩阵的正交特征基中展开 $\widehat v=\sum_jc_jv_j$，便有

$$
\|r\|_2^2
=\sum_j|\lambda_j-\mu|^2|c_j|^2
\ge\delta^2\sum_{j\ne i}|c_j|^2.
$$

把两个方向看成不区分正负号的直线，得到

$$
\sin\angle(v_i,\widehat v)
\le\frac{\|r\|_2}{\delta}.
$$

若 $\widehat v$ 是 $A+E$ 的对应单位特征向量，$\mu=\lambda_i(A+E)$，则精确算术中 $r=-E\widehat v$。令原始间隔

$$
\gamma=\min_{j\ne i}|\lambda_j-\lambda_i|.
$$

在 $\eta=\|E\|_2\lt\gamma/2$ 条件下，Weyl给出 $\delta\ge\gamma-\eta>0$，于是

$$
\sin\angle(v_i,\widehat v)
\le\frac{\eta}{\gamma-\eta}.
$$

这里明确区分了原始间隔 $\gamma$ 与候选特征值到其他原始谱点的分离 $\delta$。若目标是重特征值，单个方向本来就不唯一，应改为讨论整个不变子空间，不能把零分母修成一个很小的正数来继续报单向量结论。

## 9. 将精确扰动定理带进浮点实验

实验先构造要求的扰动 $E_{\rm requested}$，再实际形成 $B=\operatorname{fl}(A+E_{\rm requested})$，单独记录 $E_{\rm actual}=B-A$。足够小的对角改动可能在形成 $B$ 时被舍入吸收；此时不能仍按“要求改了多少”假装输入矩阵确实改了同样的量。

两个对称矩阵都用二维闭式谱分解，保留本征方程残差、投影矩阵以及范数偏差。残差先形成移位矩阵 $A-\mu I$ 再乘向量，减少两个大乘积相减的损失；这样仍没有免除全部舍入。

页面同时显示原始 $\|r\|/\delta$ 读数及一个带有限精度缓冲的估计，缓冲尺度明示为 $64u(\|A\|_F+\|B\|_F)$，$u$ 是机器精度。它是教学诊断，不是经过向外舍入证明的区间证书。分离与该尺度不可区分时，不给出有效方向保证；真正需要严格数值证书时，应采用经证明的误差界或区间运算。

特别是，不能在实际特征向量、实际矩阵乘法已经有缺陷时，仍强制把理论上应为零的残差填成零。末位误差也不应被解释成定理失效。

## 10. Gershgorin：不用先求根，也能圈出谱

对任意复方阵，定义行圆盘

$$
D_i=\left\{z\in\mathbb C:
|z-a_{ii}|\le R_i\right\},
\qquad R_i=\sum_{j\ne i}|a_{ij}|.
$$

若 $Ax=\lambda x$，选取绝对值最大的非零分量 $x_i$。第 $i$ 行给出

$$
|\lambda-a_{ii}|\,|x_i|
=\left|\sum_{j\ne i}a_{ij}x_j\right|
\le R_i|x_i|.
$$

除以 $|x_i|$ 即知每个特征值都属于至少一个圆盘。对实对称矩阵，谱是实数，因此可以把圆盘与实轴相交，读成区间。

还有一个更强的计数结论：若一组共 $m$ 个圆盘的并与其余圆盘分离，那么这组区域恰包含 $m$ 个特征值，按代数重数计。令

$$
H(t)=D+t(A-D),\qquad 0\le t\le1,
$$

其中 $D$ 是对角部分。$t=0$ 时根就是对角元；随着 $t$ 增大，所有圆盘都包含在最终圆盘里。多项式的根作为含重数的集合连续变化，不能越过两个分离区域之间的空隙，所以每组计数保持不变。[Bindel的课程讲义](https://www.cs.cornell.edu/courses/cs6210/2025fa/lec/2025-10-22.html)说明了这一同伦论证。

闭圆盘相切时已经相连，不能仍视作分离。实验的相交判断对实际二进制输入作精确符号比较；图上的舍入小数只负责显示。

严格行对角占优意味着所有圆盘都排除0，故矩阵可逆。不过，这一步是在证明矩阵可逆。要证明Jacobi或Gauss–Seidel迭代收敛，还须分析各自的迭代矩阵或相应收缩估计。

## 11. 四道迁移题与完整答案

### 题一：谱半径为零，为什么矩阵范数不能也选成零？

对非零 $K=\left(\begin{smallmatrix}0&1\\0&0\end{smallmatrix}\right)$，构造使诱导范数任意小的向量范数，并解释下确界为什么不取得。

<details class="answer" markdown="1">
<summary>答案：任意接近零与等于零是两种陈述</summary>

取 $D=\operatorname{diag}(1,t)$，定义 $\|x\|_t=\|D^{-1}x\|_\infty$，则

$$
D^{-1}KD=\begin{pmatrix}0&t\\0&0\end{pmatrix},
\qquad \|K\|_t=t.
$$

任取正数 $t$ 都得到真正的向量范数，可以让它任意小。但 $K\ne0$，若某个矩阵范数把它记为0，就违反了范数的正定性。因此这里的下确界0不由任何一个范数取得。

</details>

### 题二：逆矩阵存在，Neumann和为什么还会失败？

取 $A=0.9I,z=0.5$。写出逆矩阵、有限和恒等式和不收敛的原因。

<details class="answer" markdown="1">
<summary>答案：展开的位置没有满足收敛条件</summary>

有 $zI-A=-0.4I$，因此 $R(z)=-2.5I$ 存在。但

$$
S_k(z)=2\sum_{j=0}^k1.8^jI
$$

的项不趋于0。有限恒等式仍成立：

$$
(-0.4I)S_k=I-1.8^{k+1}I.
$$

右端尾项没有消失，正好解释了为什么不能取极限得到逆矩阵。谱点处逆不存在与谱外展开不收敛是不同情况。

</details>

### 题三：特征值完全相同，主方向能否转45度？

取 $\delta>0$，比较 $A=\operatorname{diag}(1+\delta,1-\delta)$ 与 $B=Q A Q^T$，其中 $Q$ 为45度旋转。计算它们的谱、扰动大小和主方向夹角。

<details class="answer" markdown="1">
<summary>答案：绝对扰动可以小，方向变化仍然大</summary>

直接乘出

$$
B=\begin{pmatrix}1&\delta\\\delta&1\end{pmatrix},
\qquad
E=B-A=\begin{pmatrix}-\delta&\delta\\\delta&\delta\end{pmatrix}.
$$

两矩阵特征值都是 $1+\delta,1-\delta$，而 $\|E\|_2=\sqrt2\,\delta$。原主方向是 $e_1$，新主方向是 $(e_1+e_2)/\sqrt2$，夹角45度，与 $\delta$ 的大小无关。

原谱隙为 $2\delta$。让 $\delta\to0$ 会同时缩小扰动和谱隙，扰动与谱隙之比没有趋于0；这没有违反方向稳定性定理。极限 $\delta=0$ 时主方向本身不唯一。

</details>

### 题四：从三行数字准确数出正、负特征值

对

$$
A=\begin{pmatrix}4&1&0\\1&3&1\\0&1&-2\end{pmatrix}
$$

求三个行圆盘，并在不解特征多项式的条件下确定正、负特征值数目。

<details class="answer" markdown="1">
<summary>答案：第三行的半径是1</summary>

三行的非对角绝对值和分别为 $1,2,1$。由于矩阵对称，圆盘在实轴上给出

$$
[3,5],\qquad[1,5],\qquad[-3,-1].
$$

前两个区域相连并完全位于正半轴；第三个与它们分离，并完全位于负半轴。因此前一组恰含两个正特征值，后一组恰含一个负特征值，没有零特征值。圆盘只定位和计数，并没有给出这三个特征值的精确位置。

</details>

## 12. 继续使用这些证据

在离散动力系统中先问是否渐近稳定，再问有限时间的最坏增益；在PCA中分别报告特征值误差和方向分离条件；在求解器中保留实际残差，在谱定位中保留圆盘半径与分离判断。每个结论都对应一个具体对象。

下一讲[半正定矩阵、Schur补与矩阵函数](ma-02-psd-functions.html)会继续检查：哪些标量不等式能带到矩阵，哪些需要额外的对易或正定条件。也可用[NOAA CO₂数据项目](project-01-co2-trends.html)检验矩阵表示、尺度和误差如何影响真实拟合。

<style>
article:has(#ma-norm-learning-title) .katex{position:relative}
article:has(#ma-norm-learning-title) [data-learning-lab="non-normal-transient"]:not([data-cl-mounted="true"]) td:nth-child(2){white-space:nowrap;font-size:.9em;font-variant-numeric:tabular-nums}
</style>
