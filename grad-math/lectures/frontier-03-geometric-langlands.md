# 数学前沿 III · 几何 Langlands：从特征标走向范畴的谱分解

> 本讲的可算起点只需复数、矩阵与群表示。读懂正式定理还需要代数曲线、主丛、层、D-模和导出范畴；这些不是可以省掉的技术细节。课程先说明它们各自承担什么任务，再读 2024 年证明系列及后续修订的准确范围。有限 Fourier 实验是入门类比，不是几何 Langlands 定理本身。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="frontier-langlands-title">

<h2 id="frontier-langlands-title">一个“对称操作”能否在另一侧变成可读的谱数据？</h2>

## 1. 从三格循环开始

把三个位置编号为 $0,1,2$，加法按模 3 计算，这就是群 $\mathbb Z/3\mathbb Z$。一个复值函数是向量 $f=(f(0),f(1),f(2))$。循环移位定义为

$$
(Tf)(j)=f(j+1),\qquad
T=\begin{pmatrix}0&1&0\\0&0&1\\1&0&0\end{pmatrix}.
$$

在位置坐标中，$T$ 交换三个数。设 $\omega=e^{2\pi i/3}=-1/2+i\sqrt3/2$；因为 $\omega^3=1$、$1+\omega+\omega^2=0$，三个函数

$$
\phi_k(j)=\frac{\omega^{kj}}{\sqrt3},\quad k=0,1,2
$$

正交归一。这里 $\chi_k(j)=\omega^{kj}$ 满足 $\chi_k(j+\ell)=\chi_k(j)\chi_k(\ell)$，叫作**特征标**：它把群的加法变成复数乘法。

直接代入而不是凭图猜测：

$$
(T\phi_k)(j)=\frac{\omega^{k(j+1)}}{\sqrt3}
=\omega^k\phi_k(j).
$$

同一个循环操作，在特征标坐标中只是乘 $1,\omega,\omega^2$。令 Fourier 矩阵 $F_{kj}=\omega^{-kj}/\sqrt3$，就得到

$$
FTF^*=\operatorname{diag}(1,\omega,\omega^2).
$$

“把难直接观察的操作，转成谱侧的简单作用”是本讲保留的直觉。这个三维矩阵等式没有涉及代数曲线、主丛或层，不能冒充后面的定理。

<figure class="plot" markdown="1">
![位置侧有0、1、2三个循环位置，经Fourier变换转到三个特征标；移位在谱侧分别乘1、ω、ω²。图下标明这里只是有限类比。](assets/img/frontier-langlands.svg)
<figcaption>上层是可以逐项验证的有限谱分解。真正的几何对应需要把“向量与线性操作”升级为对象、态射及相容的范畴操作。</figcaption>
</figure>

## 2. 为什么要把函数升级成层与范畴

几何对象会随参数变化，还会有自同构、退化与不同的粘合方式。仅列出一串对象名称，不能记录这些结构。**层**把局部数据及其限制、粘合规则一起保存；**范畴**同时记录对象、对象之间的态射和态射的复合。

例如向量丛在曲线每一点放一个向量空间，并规定不同坐标片怎样粘合。$G=GL_n$ 时，主 $G$-丛对应秩 $n$ 向量丛；一般连通约化群 $G$ 则允许更一般的对称结构。所有这类丛形成模空间 $\operatorname{Bun}_G$；由于丛有自同构，准确对象是**模叠**，并非一个普通点集。

另一侧的**局部系统**描述可沿路径平行运输的数据。在复曲线上，它可由平坦联络描述，也与基本群的表示相联系；绕闭路后的变换记录单值化。这里“局部”不表示只研究一个小邻域，而是局部常值的数据怎样在整体上粘合。

几何 Langlands 用对偶群 $\check G$ 的局部系统作谱参数。$\check G$ 来自根数据中根与余根的交换，不是随便把矩阵取转置；$GL_n$ 自对偶只是一个方便例子。

## 3. 正式对应的两侧是什么

为固定讨论范围，取复数域上的光滑完备曲线 $X$，以及连通约化群 $G$。de Rham 版本的范畴对应写成

$$
\mathbb L_G:
\operatorname{D-mod}_{1/2}(\operatorname{Bun}_G)
\simeq
\operatorname{IndCoh}_{\operatorname{Nilp}}
(\operatorname{LS}_{\check G}).
$$

左侧是丛模叠上适当半扭曲的 D-模范畴：D-模由微分算子作用组织，能表达随几何变化的微分方程数据。右侧是对偶群 de Rham 局部系统模叠上、带**幂零奇异支撑条件**的 ind-coherent 层范畴。$\operatorname{Nilp}$ 约束的是奇异支撑方向，不是说局部系统的所有矩阵都幂零。[GLC I 的正式设定](https://arxiv.org/html/2405.03599v3)

这些是带导出结构的范畴；完整定义需学习复形、同调和高阶相容性。本讲给出公式的角色图，尚未建立这些先修。等价要求保留态射信息，并使每个对象在同构意义下都有原像；它远强于“两侧对象数相同”。

## 4. Hecke 操作为什么像“特征值方程”

在曲线一点 $x$ 修改一个丛，会产生 Hecke 对应；对应诱导对自守侧对象的操作。用对偶群表示 $V$ 标记相应函子 $H_{V,x}$。给定局部系统 $E$，其在 $x$ 的纤维经 $V$ 得到向量空间 $V_{E,x}$。Hecke 特征对象满足示意关系

$$
H_{V,x}(\mathcal F_E)
\simeq\mathcal F_E\otimes V_{E,x},
$$

并且这些同构必须随 $x$ 变化、对表示的张量积彼此相容。这里的“特征值”已经是几何数据；右侧也不是乘一个普通复数。

有限例中的 $T\phi_k=\omega^k\phi_k$ 帮助记住操作与谱参数的关系，却没有建立 Hecke 函子与循环移位之间的等同。特别是：找到若干特征对象，还不等于证明整个范畴等价；还要控制它们组成的族、态射和非不可约部分。

## 5. 2024 年证明系列解决的范围

作者项目将五篇工作合称**全局、无分歧、范畴化几何 Langlands**的证明。I 构造由自守侧到谱侧的函子，并比较特征零下 de Rham/Betti 等版本；III 检查与抛物诱导相关操作的相容性，证明 Eisenstein 生成子范畴上的等价；V 通过局部系统模叠的几何与重数一结论完成系列。[作者项目页](https://people.mpim-bonn.mpg.de/gaitsgde/GLC/)

“无分歧”指本设定不在曲线上另设带额外奇异/层级数据的分歧点；“全局”指整条曲线。它没有宣布所有局部、分歧、量子版本一并解决，也没有宣布数域上的整个算术 Langlands 纲领完成。I 中构造函子和 V 中证明等价，是不同阶段，阅读日期不能混成一个孤立新闻标题。

<div class="learning-lab" data-learning-lab="frontier-lab" data-frontier-topic="langlands" markdown="1">

**完整静态后备：**实验只验证 $\mathbb Z/3\mathbb Z$ 的 Fourier 对角化。移位方向固定为 $T_sf(j)=f(j+s)$；特征向量使用正指数 $\phi_k(j)=\omega^{kj}/\sqrt3$，对应特征值为 $\omega^{ks}$。先预测移位两次后相位是否平方，再核对：

| $k$ | $s=0$ | $s=1$（默认） | $s=2$ |
|---:|---|---|---|
| 0 | $1$ | $1$ | $1$ |
| 1 | $1$ | $\omega$ | $\omega^2$ |
| 2 | $1$ | $\omega^2$ | $\omega$ |

额外手算取 $f=(1,2,0)$。其 Fourier 系数为 $Ff=(\sqrt3,-i,i)$；移位后 $Tf=(2,0,1)$，对应

$$
F(Tf)=\left(\sqrt3,\frac{\sqrt3}{2}+\frac i2,
\frac{\sqrt3}{2}-\frac i2\right)
=\operatorname{diag}(1,\omega,\omega^2)Ff.
$$

两侧范数平方都为 $5$，可作为归一化核对。若改变 Fourier 指数或移位方向，特征值要相应共轭；不能只改图上的箭头。验证这些等式，只验证有限群模型。

</div>

## 6. 两道迁移题

**题 1。** 令 $A=T+T^{-1}$，计算它在三个 $\phi_k$ 上的特征值。只知道 $A$ 的特征值，能区分 $k=1$ 和 $k=2$ 吗？

<details markdown="1">
<summary>独立作答后核对题 1</summary>

$A\phi_k=(\omega^k+\omega^{-k})\phi_k$，特征值为 $2,-1,-1$。后两个方向退化，单个操作的谱不能区分它们；需要更多相容操作。几何理论关心整族 Hecke 操作及其相容性，也不能只拿一个数值不变量代替全部谱数据。

</details>

**题 2。** 范畴 $\mathcal A$ 只有一个对象、一个恒等态射；$\mathcal B$ 也只有一个对象，但有两个自同构 $1,s$，且 $s^2=1$。对象显然能一一配对，范畴是否等价？

<details markdown="1">
<summary>独立作答后核对题 2</summary>

不等价。等价函子必须在每对对象的态射集合上给出双射，而这里自同态集合分别有 1 个和 2 个元素。丛与局部系统的自同构同样是重要数据；这解释了为什么正式理论需要模叠和范畴，不能降为点集间的名单匹配。

</details>

## 7. 原始论文与阅读边界

以下来源均于 **2026-09-08** 实际打开核对；本讲准确转述选定系列的结构，不声称完整复核数百页证明，也不声称穷尽最新进展。

- Gaitsgory、Raskin，[GLC I：Construction of the functor](https://arxiv.org/abs/2405.03599)：首发 **2024-05-06**，所查修订 **2025-09-30**；构造函子并比较版本。正文采用其中的 de Rham 设定。
- Campbell 等，[GLC III：Compatibility with parabolic induction](https://arxiv.org/abs/2409.07051)：首发 **2024-09-11**；证明与 Eisenstein/常数项操作的相容性及相应子范畴等价。
- Gaitsgory、Raskin，[GLC V：The multiplicity one theorem](https://arxiv.org/abs/2409.09856)：首发 **2024-09-15**，所查修订 **2026-01-16**；系列结篇明确证明所构造函子的等价性。其不可约局部系统的特征对象唯一性带有“可张量一个向量空间”的限定。
- [作者维护的五篇项目目录](https://people.mpim-bonn.mpg.de/gaitsgde/GLC/)：将结论限定为范畴化、无分歧的几何 Langlands，并列出各篇职责。

</section>

## 速查：有限类比与正式定理

| 层次 | 对象与作用 | 结论边界 |
|---|---|---|
| $\mathbb Z/3\mathbb Z$ | $T_sf(j)=f(j+s)$，$T_s\phi_k=\omega^{ks}\phi_k$ | 完整可算的有限 Fourier 模型 |
| Hecke 特征对象 | $H_{V,x}(\mathcal F_E)\simeq\mathcal F_E\otimes V_{E,x}$ | 需要整族相容性，不只是标量特征值 |
| 几何 Langlands | 丛侧 D-模与局部系统侧带支撑条件的层范畴等价 | 本讲聚焦特征零、全局、无分歧版本 |

2024 年系列及后续修订给出这里讨论的几何结论；整个算术 Langlands 纲领并未因此自动完成。
