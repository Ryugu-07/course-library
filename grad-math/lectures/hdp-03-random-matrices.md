# 高维概率 III · ε-网与随机矩阵的谱界

> **对标**：Vershynin *HDP* §4.2–4.6 ｜ **前置**：hdp-01/02、高代 V/VI、矩阵分析 I（可后补）
> 本页解决一个模式问题：**如何控制"无穷多个方向的上确界"**——矩阵谱范数 $\|A\| = \sup_{\|u\|=1}\|Au\|$ 是连续统上的 sup，union bound 直接失效。解法是本课程最重要的技术之一：**ε-网离散化**。产出：随机矩阵谱范数界与上一页欠下的协方差估计定理。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="hdp03-learning-title">

<h2 id="hdp03-learning-title">学习层：一次矩阵计算，究竟能替哪个结论作证？</h2>

### 1. 先预测，再打开账本

实验固定伪随机数发生器和 seed；默认矩阵很小，足够把 $A^\top A$ 的双精度特征值、power iteration 与有限方向扫描同时算出来。先不要看结果，预测：

1. 若 $\mathcal G\subset S^{n-1}$ 只是有限方向网格，$\max_{v\in\mathcal G}\|Av\|_2$ 与 $\|A\|$ 的关系是哪一个？它是否就是单位球面上的 supremum？
2. 对独立、零均值、单位尺度的 Gaussian 或 Rademacher 矩形矩阵，$\sqrt m+\sqrt n$ 应该读成一次样本的确定上界，还是高概率的典型尺度？
3. 把同一个名字“谱”搬到 Wigner、矩形 iid 矩阵和 sample covariance 上时，半圆律、Marchenko–Pastur 与算子范数结论能否直接互换？

点击“揭示账本”之前，实验隐藏数值结果；预测错了也保留这次记录。结果只解释当前固定矩阵，不把一条 seed 路径伪装成高概率定理。

### 2. 三个对象，三套归一化

| 对象 | 模型与归一化 | 应该引用的典型谱尺度 | 不应混用的结论 |
|---|---|---|---|
| Wigner | 对称 $W=W^\top$，独立上三角变量 $\xi_{ij}$，$W_{ij}=\xi_{ij}/\sqrt n$ | 半圆律的特征值支撑约为 $[-2,2]$；$\|W\|$ 的边缘尺度约为 $2$ | 这是对称特征值对象，不是矩形 iid 的 $\sqrt m+\sqrt n$ 表达式，也不是 MP |
| 矩形 iid | $A\in\mathbb R^{m\times n}$，条目独立、方差约为 $1$，不先除以 $\sqrt m$ | $\|A\|\sim\sqrt m+\sqrt n$ 的高概率尺度 | 这是算子范数尺度；不能把它当作 Wigner 的半圆律或 covariance 的特征值边缘 |
| sample covariance | $X\in\mathbb R^{m\times n}$，$S=X^\top X/m$ | $S$ 的 MP 上边缘约为 $(1+\sqrt{n/m})^2$；且 $\|S\|=\|X\|^2/m$ | MP 讨论 $S$ 的特征值；$\|X\|$ 仍是矩形矩阵问题，不能少掉平方与 $m$ 的归一化 |

因此本页实验把对象、矩阵形状、归一化、比较基准一起显示。`Gaussian` 与 `Rademacher` 都用固定 seed；相关/低秩和重尾预设则是**失败边界诊断**，不是 iid 次高斯定理的额外样本。

### 3. 实验怎样读

小矩阵的“精确”栏是针对本实验尺寸的双精度 Jacobi 特征值计算：矩形 iid 与 Wigner 先看 $A^\top A$，sample covariance 直接看 $S$。power iteration 从固定初始向量出发，只是一个近似算法；方向网格则只取有限个单位向量。

必有的确定性关系是

$$
\max_{v\in\mathcal G}\|Av\|_2\leq \sup_{\|u\|_2=1}\|Au\|_2=\|A\|.
$$

网格越密，通常越接近，但“网格最大值”不是单位球面上的 supremum，也不是一个自动成立的 $\varepsilon$-网证书。脚本用同一固定矩阵把这个下界、power iteration 近似和小矩阵特征值并排显示。

<div class="learning-lab" data-learning-lab="random-matrix-norm" markdown="1">

**JavaScript 失效时的静态 fallback：**默认预设是 $5\times4$ 的矩形 Gaussian 矩阵，条目服从 $N(0,1)$，seed 为 `20260722`；方向网格是各坐标二维平面上的有限角度网格，不是整个 $S^3$。下表的数值只描述这一张固定矩阵；加载脚本后还可切换 Rademacher、Wigner、sample covariance、相关/低秩与 heavy-tail 诊断。

| 账本 | 静态读法 |
|---|---|
| 精确/双精度值 | 默认 Gaussian：$\|A\|\approx3.539316$；以 $A^\top A$ 的最大特征值开平方得到，不是把有限方向扫描叫作精确值 |
| power iteration | 默认 18 步约为 $3.539316$；固定初始向量和有限步数得到近似，误差来自算法迭代，不是随机定理的失败概率 |
| 方向网格 | 共 148 个方向，默认最大值约为 $3.455315\le3.539316$；它不是单位球上确界 |
| 典型尺度 | $\sqrt m+\sqrt n$ 是 iid 次高斯的高概率阶，不是这次抽样的确定上界 |
| 量词 | 一次固定 seed 只给一个样本；不能单独证明“以高概率”或半圆律/MP 的渐近结论 |

切换到同一 seed `20260722` 的 Rademacher 后，精确/幂迭代/网格约为 $3.290658/3.290658/3.162278$；这两个固定矩阵都只是教学用的可复现实例。

</div>

### 4. 失效边界：先问假设，再读数字

- **相关/低秩：**若 $A=uv^\top+E$，秩一项的范数是 $\|u\|_2\|v\|_2$；它可以达到 $\sqrt{mn}$ 级，远离 iid 的 $\sqrt m+\sqrt n$。相关条目破坏了独立性，必须把结构写进模型或改用相应的协方差/低秩分析。
- **重尾：**若条目只有很弱的矩条件，甚至方差不存在，一个极端条目就可能支配 $\|A\|$；不能把亚高斯尾界的常数悄悄沿用。截断、稳健化或额外矩假设是另一条理论路线。
- **样本与定理：**即使 Gaussian 预设的数值落在 $\sqrt m+\sqrt n$ 附近，也只说明这次固定样本；高概率结论要对随机矩阵取概率，并保留独立性、尾部、归一化和维度量词。

</section>

## 1. ε-网：把球面数字化

**定义** $\mathcal{N} \subseteq S^{n-1}$ 是 **ε-网**：球面任一点距 $\mathcal{N}$ 不超过 $\varepsilon$。

**引理（网的大小）【证明】** 单位球面存在 $|\mathcal{N}| \leq \big(1 + \frac{2}{\varepsilon}\big)^n \leq \big(\frac{3}{\varepsilon}\big)^n$ 的 ε-网。
*证*：贪心取极大 ε-分离点集（两两距离 $> \varepsilon$，极大性保证它是 ε-网）；以各点为心 $\frac\varepsilon2$ 为半径的球两两不交、全装进半径 $1 + \frac\varepsilon2$ 的球——体积比给 $|\mathcal{N}| \leq \frac{(1+\varepsilon/2)^n}{(\varepsilon/2)^n}$。$\blacksquare$
（**指数于维数**——这是"高维的代价"最赤裸的形态；但只要尾概率也是指数小，就付得起：两指数赛跑，集中赢。）

**引理（sup 的离散化）【证明】** 对任意矩阵 $A$ 与 $\frac14$-网 $\mathcal{N}$：

$$
\|A\| \leq 2\max_{u \in \mathcal{N}} \|Au\|_2, \qquad \text{对称阵还有 } \|A\| \leq 2\max_{u\in\mathcal{N}}|\langle Au, u\rangle|
$$

*证*：取达到 $\|A\|$ 的 $u^*$，网点 $u$ 距其 $\leq \frac14$：$\|Au\| \geq \|Au^*\| - \|A\|\cdot\frac14 \geq \frac34\|A\|$……整理即得（对称版同法用二次型的 Lipschitz 性）。$\blacksquare$
**模式定型**：**连续 sup ≤ 常数 × 有限 max** + 每个网点用 hdp-01 集中 + union bound 付 $e^{Cn}$ 网点数——三件套从此通杀"算子级"的概率界。

## 2. 随机矩阵的谱范数

<figure class="plot" markdown="1">
![Wigner 半圆律](assets/img/hdp-03-semicircle.svg)
<figcaption><span class="fig-id">图 3.1</span>Wigner 半圆律：大随机对称矩阵的特征值分布收敛到半圆——随机矩阵谱的普适规律。</figcaption>
</figure>

**定理（亚高斯矩阵的算子范数）** $A \in \mathbb{R}^{m\times n}$ 元素独立、零均值、亚高斯范数 $\leq K$：以概率 $1 - 2e^{-t^2}$，

$$
\|A\| \;\leq\; CK\big(\sqrt{m} + \sqrt{n} + t\big)
$$

**【证明】** 三件套执行：取 $S^{m-1}, S^{n-1}$ 上的 $\frac14$-网（大小 $\leq 9^m, 9^n$）；固定网点对 $(u, v)$：$\langle Au, v\rangle = \sum_{ij}A_{ij}u_iv_j$ 是独立亚高斯量的线性组合，$\|\cdot\|_{\psi_2} \leq CK$（hdp-01 的"方差式相加"，权重平方和 $= \|u\|^2\|v\|^2 = 1$）⇒ 尾界 $2e^{-cs^2/K^2}$；union bound 于 $9^{m+n}$ 对网点，取 $s = CK(\sqrt m + \sqrt n + t)$ 吃掉网点数的指数。双侧离散化引理（$\|A\| \leq 2\max\langle Au, v\rangle$ 变体）收尾。$\blacksquare$

**读法**：对独立、零均值、单位尺度的 $m\times n$ 矩形 iid 矩阵，谱范数的典型尺度是 $\sqrt m+\sqrt n$——**元素是 $O(1)$ 的、矩阵却只有根号级的算子范数**：随机方向互相抵消，"无结构的噪声没有主方向"。这是高概率尺度，不是一次样本的确定上界；确定性最坏情形仍是 $\|A\|\leq\sqrt{mn}$（全 1 矩阵达到）。

不要把相邻的三个名字压成一个结论：Bai–Yin/矩形算子范数先服务于 iid 矩形矩阵；Wigner 半圆律要求对称且通常按 $1/\sqrt n$ 归一化；Marchenko–Pastur 描述 $S=X^\top X/m$ 的样本协方差特征值。归一化一换，数值尺度就要跟着换；一张固定矩阵也不可能单独证明这些高概率或渐近定理。

## 3. 兑现欠条：协方差估计定理

**定理（hdp-02 §2 的正身）** 亚高斯各向同性，$m$ 个样本：以概率 $1 - 2e^{-t^2}$，

$$
\|\hat\Sigma - I\|_{\mathrm{op}} \leq CK^2\Big(\sqrt{\frac{n + t^2}{m}} + \frac{n + t^2}{m}\Big)
$$

故 $m \gtrsim \varepsilon^{-2}(n + t^2)$ 时误差 $\leq \varepsilon$。
**【骨架】** 对称版三件套：$\langle(\hat\Sigma - I)u, u\rangle = \frac1m\sum_i\big(\langle X_i, u\rangle^2 - 1\big)$——独立零均值**亚指数**量（亚高斯的平方！hdp-01 §2 的那句话正是为此准备）的均值 ⇒ Bernstein 双段尾；union bound 于 $9^n$ 网点：小偏差段给 $\sqrt{n/m}$、大偏差段给 $n/m$，恰是定理的两项。$\blacksquare$

**读法**：**"样本 ≈ 维数"即可谱一致估计**；两项结构 = Bernstein 的高斯/指数双段在样本量上的投影（$m \gg n$ 时根号项主导——渐近统计的 $\sqrt{n/m}$ 速率；$m \sim n$ 时线性项显形——高维修正）。🔗 PCA 的样本量依据、高维回归 $(X^\top X)$ 的条件保障、以及"embedding 空间协方差白化要多少数据"全部由此定价。

## 4. 练习与要点

**例 1（网技术的手感）** 用 §1 双引理证明：对称随机符号矩阵（元素 ±1）$\|A\| \leq C\sqrt n$ w.h.p.——按三件套写全每一步（这是本页的标准自测题：三步能独立写出，ε-网就学会了）。

**例 2（数值对账）** 模拟 $1000\times1000$ 标准高斯矩阵：$\|A\| \approx 2\sqrt{1000} \approx 63$（Bai–Yin）；定理的常数 $C$ 给的是同阶上界——**理论管阶、模拟定常数**，两者互为 verify（你的实验习惯在此有理论座位）。

**例 3（各向异性推广）** 一般协方差 $\Sigma$：白化后套定理得 $\|\hat\Sigma - \Sigma\|_{\mathrm{op}} \leq \varepsilon\|\Sigma\|_{\mathrm{op}}$（相对误差版）——实际数据不各向同性时的正确引用姿势（直接搬绝对误差版是常见误用）。$\blacksquare$

---

*下一页：当"方向族"不再是球面而是任意函数类——chaining 与 Dudley 熵积分：一致大数定律的现代引擎，通往统计学习理论的桥。*
