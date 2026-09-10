# 高维概率 II · 随机向量、协方差与 Johnson–Lindenstrauss 降维

> **路线**：有限点对 → 真实概率模型 → 球面网 → 协方差相对误差。**前置**：[亚高斯与集中](hdp-01-subgaussian.html)、[随机矩阵的后续训练](hdp-03-random-matrices.html)。
> 本页把随机向量的集中语言接到两个核心问题：协方差矩阵怎样在谱范数下估计，以及一张与数据无关的随机图怎样保住一个有限点集的距离。重点不是“随机投影永远保距”，而是把对象、量词、失败概率和适用边界逐一写清。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="hdp02-learning-title">

<h2 id="hdp02-learning-title">学习层：一张随机图，究竟保住了什么？</h2>

### 1. 先看一个可以审计的几何谜题

实验固定一个 $\mathbb R^{32}$ 中的 12 点集：原点、坐标轴方向、一个二维方形面上的点，以及局部块、全局平均和对比方向。令 $A\in\mathbb R^{k\times32}$ 的条目独立服从 $N(0,1/k)$。先不打开结果，预测下面三件事：

1. 对一个固定非零差向量 $v$，$\|Av\|_2^2/\|v\|_2^2$ 的期望会不会随 $k$ 改变？
2. 对这 12 个点的全部 $\binom{12}{2}$ 个点对，一次抽到的 $A$ 是否**保证**都落在 $[1-\varepsilon,1+\varepsilon]$？
3. 把同一份随机矩阵的前 $k$ 行依次拿出来并按 $1/\sqrt{k}$ 缩放时，$k$ 增大是否必然让这条固定 seed 路径上的最坏误差单调下降？

实验先收下这三个预测；提交后才开放 $k$、$\varepsilon$ 和命名 seed，并显示图、比值分布和逐点对账。它计算的是固定有限点集上的一次有限结果，不能替代理论中的高概率陈述。

### 2. 具体点集：局部几何和全局几何同时出现

记 $e_i$ 为第 $i$ 个标准基向量（下标从 1 开始）。实验点集可用下列 12 个代表来读：

$$
\begin{aligned}
x_0&=0, & x_1&=e_1, & x_2&=e_2, & x_3&=e_1+e_2,\\
x_4&=\frac1{\sqrt8}(1,\ldots,1,0,\ldots,0), &
x_5&=\frac1{\sqrt8}(1,-1,\ldots,1,-1,0,\ldots,0),\\
x_6&=\frac1{\sqrt{32}}(1,1,\ldots,1), &
x_7&=\frac1{\sqrt{32}}(1,-1,\ldots,1,-1),\\
x_8&=\frac14(\underbrace{1,\ldots,1}_{16},0,\ldots,0), &
x_9&=\frac14(0,\ldots,0,\underbrace{1,\ldots,1}_{16}),\\
x_{10}&=\frac12(e_1+e_2+e_3+e_4), &
x_{11}&=\frac12(e_1-e_2+e_3-e_4).
\end{aligned}
$$

它们不是从实验运行时抽出来的样本：点集本身是固定的解析输入。$x_0,x_1,x_2,x_3$ 让一个二维方形面可见；$x_4,x_5$ 比较同一局部块中的平均与振荡；$x_6,x_7$ 比较全局平均与全局对比；$x_8,x_9$ 把非零坐标分到两个半块。这样，点对差向量既有稀疏方向，也有分散到很多坐标的方向。

### 3. 打开以后读三本账

实验默认 $k=8$、$\varepsilon=0.20$、seed 为 `20260722`，但可把 $k$ 调到 $2\le k\le32$，把 $\varepsilon$ 调到 $0.1$–$0.6$，并切换命名 seed。每个点对记录

$$
r_{ij}=\frac{\|A(x_i-x_j)\|_2^2}{\|x_i-x_j\|_2^2},
\qquad
\text{inside}_{ij}=\mathbf 1\{1-\varepsilon\le r_{ij}\le1+\varepsilon\}.
$$

屏幕上三本账的读法是：

- **散点图**：横轴是 $\|x_i-x_j\|^2/D_*^2$，纵轴是投影后的平方距离除以同一个固定 $D_*^2$；归一化分母不变；坐标范围覆盖当前全部点，大比值不会被移到边界。对角线两侧的带是 $1\pm\varepsilon$ 容差带。
- **比值分布**：看 $r_{ij}$ 的整体落点，不能只看均值；一个很大的离群比值也可能使最坏点对失败。
- **ledger**：逐行给出原始平方距离、投影平方距离、比值与是否在带内；“全部通过”只指这一个固定点集和这一次固定 map。

可选的“有限种子诊断”只汇总一小组命名 seed，并明确标为**诊断，不是证明**。它不能把有限次重复变成尾界，也不能证明所有随机图都成功。

<div class="learning-lab" data-learning-lab="jl-projection" markdown="1">

**无脚本时也能读取的默认账本。** 固定12点、d=32、seed 20260722、k=8、ε=0.20。这里的数值是一次有限PRNG运算，理想独立Gaussian模型的概率保证另列。

| 量 | 默认读数 | 解释 |
|---|---:|---|
| 点对数 | 66 | 12×11/2 |
| 最小 / 最大平方距离比 | 约0.331 / 2.494 | 不是理论概率 |
| 最大绝对偏差 | 约1.494 | 只对当前点集与矩阵 |
| 容差内点对 | 16/66 | 比值在[0.8,1.2] |
| 固定seed的k=4→5 | 最坏偏差约0.959→1.327 | 不逐步单调 |
| δ=0.05的保守充分维数 | 892 | 显式Gaussian尾界；不是必要维数 |
| 二维协方差相对op误差 | 0.5618280 | m=8，同一原始矩阵前两列 |
| 二维原坐标绝对op误差 | 0.4918184 | 单位和缩放不同 |

揭示后另外提供完整32×32原始矩阵、全部31个前缀、全部15个直方图箱、二维样本外积、16个网方向与181个绘图节点。矩阵表按7位小数显示，计算保留双精度；复算程序可调用导出的模型读取完整浮点数。有限种子诊断仅描述命名种子，不证明尾界。

</div>

### 4. 先把证明的三个量词分开

对固定单位向量 $u$，若 $A_{\ell *}$ 是第 $\ell$ 行，则

$$
\|Au\|_2^2=\sum_{\ell=1}^k\langle A_{\ell *},u\rangle^2,
\qquad
k\|Au\|_2^2\sim\chi_k^2,
\qquad E\|Au\|_2^2=1.
$$

这是**一个固定向量**的随机变量。因为 $Z^2-1$ 是亚指数的，Bernstein 型估计给出（$0<\varepsilon<1$）

$$
P_A\left(\left|\|Au\|_2^2-1\right|>\varepsilon\right)
\le 2\exp(-c k\varepsilon^2).
$$

对点集中的一个点对 $(i,j)$，把 $u=(x_i-x_j)/\|x_i-x_j\|$ 代入即可。对所有 $\binom N2$ 个差向量做 union bound，得到失败概率至多

$$
2\binom N2 e^{-c k\varepsilon^2}.
$$

这一步才把“一个方向”升级为“这个有限点集的所有点对”。因此，概率是对随机 map $A$ 说的：高概率表示抽 map 的大多数结果满足性质，而不是每一个 map 都满足；即使上界很小，也存在一次抽到失败 map 的可能。

同一条固定 seed 的嵌套路径还要再读一遍量词：每个 $k$ 的 map 都有正确的期望和相应的分布，但“$k=8$ 成功，所以 $k=9$ 一定更好”没有定理支持。新增一行会重新平衡平方和，最坏点对或通过比例可能上升；单调性是分布层面的集中趋势，不是固定样本路径的逐点序关系。

### 5. 边界与迁移

- JL 的目标是有限点集。若 $k\ge d$，就没有降到更低维；若数据实际落在秩为 $r\ll d$ 的已知或可估计子空间，先做 span-aware 坐标化、正交基表示或直接使用恒等/填零嵌入，可能比盲目随机 map 更好。随机矩阵的“与数据无关”是优点，也是它不利用已知结构的代价。
- 常写的“约 $\log N$ 维”隐藏了 $\varepsilon^{-2}$、失败概率和普适常数。$\varepsilon$ 越小，代价是平方级；不同教材对 $\log$ 的底、尾界版本和常数 $C$ 的吸收不同。
- 最优性下界是**最坏情形**的说法：在相应的有限集/近似保距嵌入、误差参数和参数区间下，存在点集迫使维数达到 $\Omega(\varepsilon^{-2}\log N)$ 量级。它不说每个真实数据集都需要这个维数，也不说某个特定随机 map 的每次结果都达到下界。
- 因而“把 4096 压到 512 就自动几乎无损”不是 JL 定理的直接推论。要知道 $N$、目标 $\varepsilon$、失败概率、数据的有效秩和下游任务；检索保真还应在真实查询/邻居指标上验证。

</section>

<style>.jl-static{max-width:100%;overflow-x:auto}.jl-static img{display:block;width:1100px;min-width:1100px;max-width:none!important}.jl-static:focus-visible{outline:3px solid var(--accent)}</style>
<div class="jl-static" role="region" tabindex="0" aria-label="有限点对、嵌套前缀与二维方向网，可左右滚动"><img src="assets/img/hdp-02-concentration.svg" alt="66个点对与全部31个前缀展示固定矩阵的有限行为，二维协方差方向图对应16方向网的覆盖证明。" loading="lazy"></div>

## 1. 随机向量的语言：各向同性与亚高斯

随机向量 $X\in\mathbb R^d$ **各向同性**是

$$
EX=0,\qquad E[XX^\top]=I_d.
$$

这表示每个方向的方差都是 1，但不表示坐标必须独立或分布必须高斯。更强的 $K$-亚高斯向量条件是对所有 $u\in S^{d-1}$，

$$
\|\langle X,u\rangle\|_{\psi_2}\le K.
$$

独立标准Gaussian向量、独立Rademacher坐标向量是维数无关常数的例子。单个有界向量也亚高斯，但其常数可能随维数增长。“每个坐标分别亚高斯”和“所有单位方向共享同一个维数无关常数”不能混用。

**各向同性亚高斯向量不自动有薄壳。** 取独立Rademacher向量 $R$，再取与之独立的开关 $S$，以各半概率取 $0,\sqrt2$，令 $X=SR$。则 $EX=0$ 且 $E[XX^\top]=I_d$，对所有单位 $u$，

$$
Ee^{\lambda\langle X,u\rangle}
=\frac12+\frac12\prod_{j=1}^d\cosh(\sqrt2\lambda u_j)
\le\frac12+\frac12e^{\lambda^2}
\le e^{\lambda^2}.
$$

所有方向的MGF代理平方至多2，故ψ2常数也可维数无关；但

$$
P(\|X\|_2=0)=P(\|X\|_2=\sqrt{2d})=\frac12.
$$

因此宽度为固定常数的壳不能容纳大维数时的大部分概率。共享开关使坐标平方相关。上一页的独立坐标薄壳定理仍然正确；本页协方差定理只需**样本向量之间独立**，并不要求每个样本内部坐标独立。

本页把“各向同性”与 $EX=0$ 同时规定；一些文献仅把 $E[XX^\top]=I_d$ 称为各向同性，再单独要求中心化。核对定理时要查两个条件。

## 2. 协方差估计：算子级的同时准确

给定独立样本 $X_1,\ldots,X_m$，先假设它们来自中心化各向同性 $K$-亚高斯分布：

$$
\widehat\Sigma=\frac1m\sum_{s=1}^m X_sX_s^\top.
$$

一个常用的代表性界是：存在只依赖约定的普适常数 $C,c>0$，以至少 $1-2e^{-t^2}$ 的概率，

$$
\|\widehat\Sigma-I_d\|_{\mathrm{op}}
\le CK^2\left(\sqrt{\frac{d+t^2}{m}}+\frac{d+t^2}{m}\right).
$$

因此在 $m$ 大于 $K^4\varepsilon^{-2}(d+t^2)$ 的量级时，谱范数误差达到 $\varepsilon$；把 $K$ 当成一个隐形的 1 会掩盖重尾程度对样本量常数的影响。证明骨架是固定 $u$ 后控制 $m^{-1}\sum_s(\langle X_s,u\rangle^2-1)$，再用球面的 $1/4$-网和 union bound 把有限方向升级为算子范数。

### 把网论证补成一个可以检查的证明

设 $B=\widehat\Sigma-I_d$，先固定一个单位向量 $u$。由于
$\|\langle X_s,u\rangle^2-1\|_{\psi_1}\le2K^2$，独立样本的亚指数Bernstein界给

$$
P(|u^\top Bu|>a)
\le2\exp\left[-c m\min\left(\frac{a^2}{K^4},\frac a{K^2}\right)\right].
$$

这一步集中的是跨样本之和，不能把同一个向量重复记录 $m$ 次冒充独立样本。

现在选球面上一个极大η分离集 $\mathcal N$，$0<\eta<1/2$。若有一点离所有网点都超过η，还能添入，违背极大性，所以它覆盖球面。各网点为心、半径η/2的开球不相交，并包含在半径 $1+\eta/2$ 的大球内。比较体积得到

$$
|\mathcal N|(\eta/2)^d\le(1+\eta/2)^d,
\qquad |\mathcal N|\le(1+2/\eta)^d.
$$

对任意单位 $v$ 取 $\|v-u\|\le\eta$ 的网点，由对称性与算子范数定义，

$$
\begin{aligned}
|v^\top Bv-u^\top Bu|
&=|(v-u)^\top Bv+u^\top B(v-u)|\\
&\le2\eta\|B\|_{\rm op}.
\end{aligned}
$$

再对 $v$ 取上确界并移项，得到确定性结论

$$
\max_{u\in\mathcal N}|u^\top Bu|
\le\|B\|_{\rm op}
\le\frac{\max_{u\in\mathcal N}|u^\top Bu|}{1-2\eta}.
$$

取η=1/4，网点数至多 $9^d$，放大因子为2。对网点做联合界后，

$$
P(\|B\|_{\rm op}>2a)
\le2\exp\left[d\ln9-cm\min\left(\frac{a^2}{K^4},\frac a{K^2}\right)\right].
$$

令 $L=d\ln9+\ln(2/\delta)$ 并取
$a=C_0K^2(\sqrt{L/m}+L/m)$，选择足够大的普适 $C_0$ 即使指数不超过 $\ln(\delta/2)$。这给出上面的界。这里的普适常数尚未做最优追踪，不能直接往实验里填 $C_0=1$ 当数值保证。

若要求误差ε且 $0<\varepsilon<1$，完整充分量级是
$m\gtrsim L\max(K^4/\varepsilon^2,K^2/\varepsilon)$。各向同性蕴含
$K^2\ge1/\ln2>1$，所以第一项主导，才可简写成 $K^4\varepsilon^{-2}L$。

若 $m<d$，$\widehat\Sigma$ 的秩至多m，有单位零向量 $v$，因而 $Bv=-v$、$\|B\|_{\rm op}\ge1$。这是不用概率就能看到的样本量障碍。

非各向同性时不能把 $I_d$ 直接换成一个任意的 $\Sigma$ 就继续引用同一个绝对误差式。若 $X=\Sigma^{1/2}Y$ 且白化后的 $Y$ 满足适当的 $K$-亚高斯条件，可以先讨论相对误差

$$
\left\|\Sigma^{-1/2}(\widehat\Sigma-\Sigma)\Sigma^{-1/2}\right\|_{\mathrm{op}},
$$

或使用带有效秩的非各向同性结果。常见的有效秩是

$$
r_{\mathrm{eff}}(\Sigma)=\frac{\operatorname{tr}\Sigma}{\|\Sigma\|_{\mathrm{op}}};
$$

在合适的矩条件下，精细界会用 $r_{\mathrm{eff}}$（并可能伴随尾参数、谱衰减或额外线性项）替代生硬的 $d$。这是结构性改进，不是无条件的维数消失；只有坐标分别亚高斯、或样本重尾时，白化和上述界也未必可直接使用，可能需要稳健协方差估计、截断或额外矩假设。

### 白化的定义域、均值与一个完整二维模型

上面的逆平方根要求 $\Sigma$ 正定。如果仅半正定，先在其正特征值张成的支撑子空间工作。中心化且 $v^\top\Sigma v=E(v^\top X)^2=0$ 蕴含 $v^\top X=0$ 几乎处处，因此不会丢失随机变化。可以用伪逆表示同一限制，但不能把零特征值直接取倒数。零协方差时 $X=0$ 几乎处处，另行处理，$r_{\rm eff}=0/0$ 无定义。

在正定情形，记白化误差为 $B$，由合同变换，

$$
\widehat\Sigma-\Sigma=\Sigma^{1/2}B\Sigma^{1/2},
\qquad
\|\widehat\Sigma-\Sigma\|_{\rm op}
\le\|\Sigma\|_{\rm op}\|B\|_{\rm op}.
$$

这不是一般的等式。若总体均值未知，用样本均值中心化又会改变矩阵：

$$
\frac1m\sum_{s=1}^m(X_s-\bar X)(X_s-\bar X)^\top
=\frac1m\sum_{s=1}^mX_sX_s^\top-\bar X\bar X^\top.
$$

对iid样本，左式的期望为 $(m-1)\Sigma/m$；分母改为 $m-1$ 才是通常的无偏样本协方差。已知总体均值为零时，原始二阶矩本身已经无偏。不能混用这两个实验。

本页另取 $X_s=(2G_{s1},G_{s2}/2)$，所以 $\Sigma=\operatorname{diag}(4,1/4)$。原始G取同一命名seed的矩阵前m=k行前两列，逐样本列出外积；不用“画起来像椭圆”代替计算。若

$$
\widehat\Sigma=\begin{pmatrix}a&b\\b&c\end{pmatrix},
\qquad
B=\begin{pmatrix}a/4-1&b\\b&4c-1\end{pmatrix}
=\begin{pmatrix}\alpha&\beta\\\beta&\gamma\end{pmatrix},
$$

则

$$
\lambda_\pm=\frac{\alpha+\gamma}{2}
\pm\sqrt{\left(\frac{\alpha-\gamma}{2}\right)^2+\beta^2},
\qquad \|B\|_{\rm op}=\max(|\lambda_-|,|\lambda_+|).
$$

实验默认得到 $a\approx3.8607254,b\approx0.3856765,c\approx0.1801045$；
相对op误差约0.561828，原坐标绝对op误差约0.4918184。这两个读数不是互换的单位。

方向图取 $u_\theta=(\cos\theta,\sin\theta)$：

$$
u_\theta^\top Bu_\theta
=\alpha\cos^2\theta+2\beta\sin\theta\cos\theta+\gamma\sin^2\theta.
$$

16个等间隔方向覆盖整个圆，最近点角差至多π/16，故欧氏覆盖半径为
$\eta=2\sin(\pi/32)<1/2$。用已证明的网界就得到连续全部方向的确定性上界；181个绘图节点只是展示曲线。这里的解析覆盖证书与有限抽样有本质不同。浮点末位误差仍需按数值精度理解，表格不宣称区间算术证书。

## 3. Johnson–Lindenstrauss 引理：有限集的平方距离形式

**定理（JL，有限集版本）** 设 $x_1,\ldots,x_N\in\mathbb R^d$ 是两两不同的点，$0<\varepsilon<1$、$0<\delta<1$。令 $A\in\mathbb R^{k\times d}$ 的条目独立服从 $N(0,1/k)$。存在普适常数 $C>0$，只要

$$
k\ge C\varepsilon^{-2}\left(\log N+\log\frac1\delta\right),
$$

则以至少 $1-\delta$ 的概率，对所有 $1\le i<j\le N$ 同时有

$$
(1-\varepsilon)\|x_i-x_j\|_2^2
\le \|A x_i-A x_j\|_2^2
\le(1+\varepsilon)\|x_i-x_j\|_2^2.
$$

这里的 $C$、$c$ 和“至少”的常数版本随证明使用的尾界、$\log$ 的底、是否把 $\binom N2$ 精确保留而变化；应该把它读成 universal-constant/convention caveat，而不是一个无条件的数值处方。若点集有重复点，距离比值的分母为 0，应先合并重复点或改写命题；本页始终取两两不同的点。

### 证明骨架：固定方向 → 集中 → 联合界

**第一步：固定一个单位向量。** 写 $A_{\ell r}=g_{\ell r}/\sqrt k$，其中 $g_{\ell r}\sim N(0,1)$。高斯旋转不变性给出 $\langle A_{\ell *},u\rangle\sim N(0,1/k)$，故

$$
k\|Au\|_2^2=\sum_{\ell=1}^k g_\ell^2\sim\chi_k^2,
\qquad E_A\|Au\|_2^2=1.
$$

**第二步：一个方向的尾部。** 由 $\chi^2$ 的 Chernoff 界，或由 $g_\ell^2-1$ 的亚指数 Bernstein 界，

$$
P_A\left(\left|\|Au\|_2^2-1\right|>\varepsilon\right)
\le2e^{-c k\varepsilon^2},\qquad 0<\varepsilon<1.
$$

**第三步：把方向换成点对。** 对每个 $v_{ij}=x_i-x_j\ne0$ 取 $u_{ij}=v_{ij}/\|v_{ij}\|_2$。这是有限的 $\binom N2$ 个方向，所以

$$
P_A\left(\exists i<j:\left|\frac{\|A v_{ij}\|_2^2}{\|v_{ij}\|_2^2}-1\right|>\varepsilon\right)
\le2\binom N2e^{-c k\varepsilon^2}.
$$

让右侧不超过 $\delta$，得到

$$
k\ge \frac1{c\varepsilon^2}
\left[\log\left(\frac{2\binom N2}{\delta}\right)\right],
$$

再把括号中的量吸收到普适常数和 $\log N+\log(1/\delta)$ 中即得定理。注意三个层次不能合并成一句“随机投影保距”：单向量集中是一个事件，union bound 是有限点集的事件，高概率仍是对抽取随机 map 的概率；一个单独样本可以失败。

### 显式Gaussian常数：从MGF算出维数预算

为了让“存在C”变成一个保守但可算的保证，令 $W\sim\chi_k^2$，直接使用
$Ee^{sW}=(1-2s)^{-k/2}$，$s<1/2$。上尾优化取
$s=\varepsilon/[2(1+\varepsilon)]$；下尾对负s优化，取
$s=-\varepsilon/[2(1-\varepsilon)]$。代回得到

$$
\begin{aligned}
P(W/k>1+\varepsilon)&\le e^{-kh_+(\varepsilon)},
&h_+(\varepsilon)&=\frac{\varepsilon-\ln(1+\varepsilon)}2,\\
P(W/k<1-\varepsilon)&\le e^{-kh_-(\varepsilon)},
&h_-(\varepsilon)&=\frac{-\varepsilon-\ln(1-\varepsilon)}2.
\end{aligned}
$$

$h_-\ge h_+>0$；可对差求导验证。因此全部点对失败概率至多

$$
\min\left\{1,\binom N2
\left(e^{-kh_+(\varepsilon)}+e^{-kh_-(\varepsilon)}\right)\right\}
\le\min\{1,N(N-1)e^{-kh_+(\varepsilon)}\}.
$$

一个明确的充分维数是

$$
k\ge
\left\lceil\frac{\ln[N(N-1)/\delta]}{h_+(\varepsilon)}\right\rceil.
$$

默认 $N=12,\varepsilon=0.2,\delta=0.05$，$h_+\approx0.0088392216$，
给出892维。它超过原维数32，因此在这个苛刻的通用保证下，直接保留原坐标比照抄随机投影预算更有用。这不意味着当前12点需要892维：原始32维恒等映射已经保距，而这些具体点实际还在更低秩子空间中。充分上界大，不是必要性下界。

概率定理面向理想独立连续Gaussian条目。实验用32位确定性PRNG和Box–Muller变换演示矩阵计算；单个命名seed不是随机事件，有限seed均值也不能验证精确Gaussian分布。固定32×32矩阵后取前k行并重新除以√k，仅用于比较嵌套路径。

## 4. $k$ 的选择、下界与实际几何

### 4.1 维数预算不是无条件的“越低越好”

JL 的表达式不依赖 $d$，但它没有说目标维数一定小于 $d$。若算出的 $k$ 超过 $d$，盲目随机投影没有完成降维；可以使用恒等映射、补零坐标，或在已知数据张成的 $r$ 维子空间上选正交基后再工作。若数据矩阵的有效秩很低，PCA、已知物理约束或 span-aware embedding 往往能利用结构，胜过一张不看数据的盲随机图。

### 4.2 一个数量级例子，但不要把它变成保证

若 $N=10^6$、$\varepsilon=0.1$，则 $\log N\approx13.8$，公式只告诉我们 $k$ 是 $\varepsilon^{-2}\log N$ 乘一个普适常数的量级；实际 $C$、$\delta$、数据结构和下游容许误差决定可用值。它并不自动推出“4096 压到 512 维就几乎无损”：那个工程判断还要明确保谁的距离、看多少点对、允许什么失败概率，并在目标检索任务上测量。

### 4.3 “最优”下界的量词

Larsen–Nelson 的原始结果给出：对整数 $d,N\ge2$ 以及 $(\min\{N,d\})^{-0.4999}<\varepsilon<1$，存在 $N$ 点集，使任何满足平方距离条件的嵌入（不只线性映射）需要 $\Omega(\varepsilon^{-2}\log N)$ 维。它说明对所有点集都想要的通用保证不能普遍再降一个数量级；它不声称每个真实数据集都达到下界，更不替代对一个具体数据集的谱、有效秩或邻居稳定性检查。

## 5. 三个可迁移的几何例子

**例 1：球面上的近正交。** $d$ 维单位球面上的许多随机方向具有小内积；把一组固定方向一起送入随机 map 时，单个方向的长度集中仍要为点对数付出 union-bound 的 $\log N$。单方向图像不能直接变成全体方向的算子范数结论；后者需要 $\varepsilon$-网，代价变成维数级的网大小。

**例 2：线段、方形面与局部块。** 对 $\{0,e_1,e_2,e_1+e_2\}$，四个点的六个距离同时保真，至少包含两条轴边、两条对角线和方形边；对 $x_4,x_5$，一个局部块的平均方向与振荡方向正交，能检验 map 是否把不同支撑模式混得过分。实验的 ledger 把这些几何直觉翻成可审计的平方距离比。

**例 3：协方差与 JL 的不同量词。** 协方差估计要对球面上连续的所有方向控制二次型，因此用网技术；JL 只对预先给定的有限差向量控制，因此 union bound 就够。若点集是事后看了 $A$ 才选出来的，原来的“固定点集”量词已经改变，不能直接复用同一个保证。

## 6. 四道迁移题与完整解答

### 题1：把失败概率预算落实成数字

N=12、ε=0.2时，分别求δ=0.1与δ=10⁻⁶的上述保守充分维数。它们是否表示这个点集的必要维数？

<details class="answer" markdown="1">
<summary>展开推导与解释</summary>

代入同一个 $h_+(0.2)=(0.2-\ln1.2)/2$，得到

$$
k_{0.1}=\left\lceil\frac{\ln1320}{h_+(0.2)}\right\rceil=813,\qquad
k_{10^{-6}}=\left\lceil\frac{\ln(132\times10^6)}{h_+(0.2)}\right\rceil=2116.
$$

分子之差为 $\ln10^5$，所以固定ε时，维数预算对更小失败概率只有对数增长。这是该证明下Gaussian随机图的充分预算。原始32维恒等映射已经精确保距，足以反驳“需要至少813维”的误读。

</details>

### 题2：相同方向尾条件，为什么仍然没有薄壳？

对正文开关模型 $X=SR$，证明它各向同性，找出破坏薄壳的依赖；再计算Gaussian JL比值的方差，并解释固定seed前缀不单调。

<details class="answer" markdown="1">
<summary>展开推导与解释</summary>

有 $ES^2=1$、$ERR^\top=I_d$ 且S与R独立，所以 $EXX^\top=I_d$；
$ER=0$ 又给中心化。范数平方为 $dS^2$，两个取值0与2d各占一半。不同坐标平方全部等于 $S^2$，完全相关，不能对其和套用独立Bernstein。MGF的方向界已在正文逐项证明。

Gaussian比值 $Q_k=k^{-1}\sum_{\ell=1}^k g_\ell^2$；
$Eg^2=1,Eg^4=3$，所以

$$
EQ_k=1,\qquad \operatorname{Var}(Q_k)=\frac{k(3-1)}{k^2}=\frac2k.
$$

但同一前缀有

$$
Q_{k+1}-1=\frac{k(Q_k-1)+(g_{k+1}^2-1)}{k+1}.
$$

新项可以把偏差推得更远。方差降低是跨随机抽取的陈述，不是每条路径偏差降低；多个点对中的最大值更无此保证。

</details>

### 题3：相对误差、绝对误差与有限方向

取 $\Sigma=\operatorname{diag}(4,1/4)$ 和
$\widehat\Sigma=\begin{pmatrix}4&0.2\\0.2&0.25\end{pmatrix}$。
若只检查两个坐标方向，会漏掉什么？减去样本均值 $(0.1,0.2)$ 后，分母m的中心化矩阵是什么？

<details class="answer" markdown="1">
<summary>展开推导与解释</summary>

白化误差 $B=\begin{pmatrix}0&0.2\\0.2&0\end{pmatrix}$；
两个坐标方向的二次型都是零，但 $(1,1)/\sqrt2$ 给0.2。
特征值±0.2，所以相对op误差为0.2。原坐标误差恰好也有特征值±0.2；这一次数值相同源于这个矩阵的特殊非对角结构，不能推广成一般等式。通用上界为 $4\times0.2=0.8$。

中心化要减去 $\bar X\bar X^\top$：

$$
\widehat\Sigma_{\rm centered}
=\begin{pmatrix}4&0.2\\0.2&0.25\end{pmatrix}
-\begin{pmatrix}0.01&0.02\\0.02&0.04\end{pmatrix}
=\begin{pmatrix}3.99&0.18\\0.18&0.21\end{pmatrix}.
$$

只检查两个坐标方向没有η<1/2的球面覆盖证书；16等间隔方向则有
$\eta=2\sin(\pi/32)$，可用明确的放大因子升级为全部方向界。

</details>

### 题4：看到随机图以后再选点，会发生什么？

当k<d，找一个依赖A的两点集，使JL的正下界失败。若协方差只知道有限四阶矩，网证明在哪一步不再给指数失败率？

<details class="answer" markdown="1">
<summary>展开推导与解释</summary>

由秩–零度定理，任意 $A\in\mathbb R^{k\times d}$ 都存在非零 $v\in\ker A$。
事后选 $\{0,v\}$，投影距离为0，原始距离为正，任意ε<1的正下界失败。
这与固定点集的高概率定理不矛盾，因为点集现在依赖A。

有限四阶矩可使固定方向的平方有有限方差，因而可用Chebyshev控制样本均值；但不自动有亚指数MGF。上面固定方向的指数Bernstein界失去前提，把多项式尾乘上指数大小的网无法保留同样样本量结论。可研究截断或稳健估计，但须给出新的估计量与矩条件，不能只把字母K换掉。

</details>

## 原始来源与后续

- [Vershynin：Four lectures on probabilistic methods for data science](https://arxiv.org/pdf/1612.06661)，§1.5–1.6的随机向量/JL与§4.4的协方差。本文网论证、显式Gaussian维数预算、开关反例和二维账本均在正文给出计算，不要求读者凭引用补齐关键步骤。
- [Larsen–Nelson：Optimality of the Johnson–Lindenstrauss Lemma](https://arxiv.org/abs/1609.02094)，最坏情形非线性嵌入下界及其参数区间；本页引用结论，未展开其完整证明。

下一页：[随机矩阵与谱界](hdp-03-random-matrices.html)。连续球面还可以用更精细的几何复杂度分析；这里保留完整的网法训练，不将有限实验当成更强定理。
