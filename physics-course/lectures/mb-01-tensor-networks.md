# 量子多体 · 张量网络与变分方法

> **对标**：Schollwöck（DMRG 综述）/ Orús（TN 入门）｜ **前置**：cm-01、qi-01（纠缠熵）、数学站 nla（SVD——本页的发动机）
> 量子多体的根本困境：$N$ 个自旋的 Hilbert 空间维数 $2^N$——50 个自旋就存不下。现代解法的洞察：**物理态只住在这个空间的极小角落**（低纠缠态），张量网络就是这个角落的坐标系。本页立起 MPS/DMRG 的思想（SVD 的物理加冕）与变分蒙卡，收尾连到神经网络波函数与量子模拟——全站最后一页，恰好停在"物理 × 计算 × ML"三线交汇的前沿入口。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="mb-tensor-learning-title">

## 学习层：一条量子链的“桥”到底要多宽？

<h3 id="mb-tensor-learning-title">1. 具体谜题：把一条切开的链交给一个窄接口</h3>

把 $N=6$ 个 qubit 排成一条链，在第 $k$ 个位置切开。左边有 $k$ 个 qubit，右边有 $N-k$ 个 qubit；整态仍有 $2^N$ 个振幅，但切口两边只通过一个“接口”交换信息。谜题是：**接口至少需要多少条独立通道，才能不丢掉这个态？**

这里的“通道数”不是物理上的粒子数，而是系数矩阵的秩。它会把四个容易混在一起的词拆开：

- **Schmidt rank**：精确表示所需的通道数；
- **Schmidt coefficients** $\sigma_i$：每条通道的权重；
- **entanglement spectrum**：约定 $\xi_i=-\ln p_i$，其中 $p_i=\sigma_i^2$ 是约化密度矩阵的本征值；
- **截断误差**：固定接口宽度 $\chi$ 时，被丢掉的总权重，而不是“丢掉了多少个系数”。

<h3>2. 先做预测：先猜桥宽，再打开实验台</h3>

对下面四个 $N=6$ 的确定态，先写下第 $k=3$ 个 cut 的 Schmidt rank，再预测 $\chi=2$ 是否能在所有 cuts 上精确表达：

1. product：$|000000\rangle$；
2. GHZ：$\bigl(|000000\rangle+|111111\rangle\bigr)/\sqrt2$；
3. 链式 cluster-like：$\prod_{j=1}^{5}\mathrm{CZ}_{j,j+1}|+\rangle^{\otimes 6}$；
4. 固定种子的实随机 toy：把 64 个确定性伪随机振幅归一化。

特别预测两件反直觉的事：GHZ 并不需要随链长增长的 rank；而随机 toy 的中间 cut 通常会把 $8$ 条独立通道都用上。最后问自己：如果只知道 $S\leq\ln\chi$，是否就能断言“精确”或“高保真”？

<h3>3. 最小模型：双分割 coefficient matrix → SVD → 纠缠谱</h3>

以计算基底的二进制字符串为行列索引，把全态振幅重排为

$$
C^{(k)}_{\alpha\beta}=c_{\alpha\beta},
\qquad C^{(k)}\in\mathbb{C}^{2^k\times 2^{N-k}},
\qquad \sum_{\alpha,\beta}\lvert C^{(k)}_{\alpha\beta}\rvert^2=1.
$$

对这一个**双分割系数矩阵**做 SVD：

$$
C^{(k)}=U\,\mathrm{diag}(\sigma_1,\sigma_2,\ldots)\,V^{\dagger},
\qquad \sigma_1\geq\sigma_2\geq\cdots\geq0.
$$

它等价于 Schmidt 分解

$$
\lvert\psi\rangle=\sum_i\sigma_i\lvert u_i\rangle_A\lvert v_i\rangle_B.
$$

因此 $p_i=\sigma_i^2$，$\rho_A=CC^{\dagger}$ 的非零本征值就是 $p_i$；纠缠熵为

$$
S_k=-\sum_i p_i\ln p_i,
\qquad \xi_i=-\ln p_i\quad(p_i>0),
\qquad r_k=\#\{i:\sigma_i>0\}.
$$

$\sigma_i$ 是 Schmidt 系数，不能未经说明就把它们本身叫作 entanglement spectrum；本页采用 $\xi_i=-\ln p_i$ 的约定。实验会同时显示 $C^{(k)}$、$p_i$ 和 $\xi_i$，让三个层次互相对账。

### 4. 动手验证：固定 bond dimension，看截断究竟保留了什么

实验台的控制顺序就是算法顺序：先选态，再选 cut，再调固定 bond dimension $\chi$。

1. **Coefficient matrix** 面板显示 $C^{(k)}$ 的每个振幅；矩阵尺寸随 $2^k\times2^{N-k}$ 改变。
2. **Schmidt/SVD** 面板显示 $p_i=\sigma_i^2$ 的权重柱、被 $\chi$ 切开的尾部和 $\xi_i=-\ln p_i$。
3. 对最优 rank-$\chi$ 近似，Eckart–Young 给出 $\varepsilon_\chi=\sum_{i>\chi}p_i=1-\sum_{i\leq\chi}p_i$、$F_\chi=\sqrt{1-\varepsilon_\chi}$、$F_\chi^2=1-\varepsilon_\chi$。这里 $F_\chi$ 明确指归一化截断态的 overlap amplitude，$F_\chi^2$ 是常用的 squared fidelity；实验两者都标出，避免“保真度”口径漂移。
4. 链底部把每个 cut 画成一座桥，标出 $(r_k,S_k)$。金色标记“最窄桥”（局部 rank/entropy 最小），蓝色标记精确 MPS 的最大需求 $\chi_* = \max_k r_k$；这两个量不要混为一个“瓶颈”。

<div class="learning-lab" data-learning-lab="entanglement-cut" markdown="1">

**无 JavaScript 时的静态读法：**固定 $N=6$，$k=3$ 时 $C$ 是 $8\times8$ 矩阵。默认 GHZ 态的非零元只有

<pre><code>C^{(3)}_{0,0}=C^{(3)}_{7,7}=1/√2，其他元为 0。
σ=(1/√2, 1/√2, 0, …)，p=(1/2, 1/2, 0, …)，S=ln 2，r=2。
χ=1: εχ=1/2，Fχ=1/√2，Fχ²=1/2；χ=2: εχ=0，Fχ=1。</code></pre>

| 固定态（$N=6$） | 各 cut 的 exact Schmidt rank | 中间 cut 的读法 | $\chi=2$ 能否跨过所有 cut？ |
|---|---:|---|---|
| product 态（全零计算基） | $1,1,1,1,1$ | $S_k=0$ | 能，精确 |
| GHZ | $2,2,2,2,2$ | $p=(1/2,1/2)$，$S_k=\ln2$ | 能，精确 |
| 链式 cluster-like | $2,2,2,2,2$ | 每个相邻 cut 至多一条 graph-state 纠缠边，$S_k=\ln2$ | 能，精确 |
| 固定随机 toy | $2,4,8,4,2$（本 toy 为满秩） | 权重通常不均匀，$S_3$ 需由完整谱计算 | 不能精确跨过中间 cut |

因此 exact MPS bond dimension 是 $\chi_*=\max_k r_k$；但若只求近似，真正要看的不是 rank，而是 $\sum_{i>\chi}p_i$。随机行只是一组 $64$ 维的可复现实验数据，不是 Page 定理，也不声称代表随机态系综的渐近平均。

</div>

<h3>5. 误区与边界：低熵、低 rank、面积律不是同一句话</h3>

- **Exact rank 与近似 $\chi$ 不同。** 一个态可以有很大的 exact rank，但尾部权重极小，因而用小 $\chi$ 得到高保真近似；反过来，若保真度目标很高，必须检查具体谱的尾和，而不是只看一个 rank 标签。
- **$S\leq\ln\chi$ 只是容量上界。** 它是 rank-$\chi$ 表示的必要条件，不是充分条件。比如谱权重 $(0.8,0.1,0.1)$ 的熵约为 $0.639<\ln2$，但 exact rank 是 $3$，$\chi=2$ 时最多保留 $F^2=0.9$；熵没有告诉你尾部如何分布。
- **面积律有前提。** 一维、局域、短程、通常还要有能隙和适当的基态条件时，许多体系的基态纠缠熵才呈现与边界相关的面积律；临界基态可有对数修正，激发态、长时间演化态、无序/随机态和高维问题不能直接套用“所有局域哈密顿量都满足面积律”。面积律也主要约束熵；它本身不把 exact rank 变成固定小数，也不自动给出某个保真度下的 $\chi$。
- **MPS 有规范冗余。** 内部键上做可逆变换 $A^{s_j}\mapsto X_{j-1}^{-1}A^{s_j}X_j$，物理态不变。$\chi$ 是表示容量，不是唯一参数坐标；左/右规范或 mixed-canonical form 才把 SVD 的 Schmidt 系数放到清楚的位置。
- **随机 toy 不是定理。** 本实验的伪随机向量、有限 $N$ 和有限精度只用于把“中间 cut 需要更多通道”变成可复核观察；Page 型陈述必须另行声明随机系综、平均/典型性与维数极限。

<h3>6. 回到 formal：MPS 为什么把每个 cut 的答案串起来</h3>

开放边界 MPS 写成

$$
c_{s_1\cdots s_N}=\sum_{a_1,\ldots,a_{N-1}}
A^{s_1}_{1a_1}A^{s_2}_{a_1a_2}\cdots A^{s_N}_{a_{N-1}1}.
$$

在第 $k$ 个 cut 上，虚拟指标 $a_k$ 的取值最多为 $\chi_k$，所以 $r_k\leq\chi_k$ 且 $S_k\leq\ln\chi_k$。对所有 cuts 同时要求精确表示时，最小的统一 bond dimension 为

$$
\chi_*=\max_{1\leq k<N}r_k.
$$

这解释了链图的两种读法：金色“最窄桥”告诉你哪里局部最容易压缩；蓝色最大桥需求才决定统一 MPS 的 exact capacity。DMRG 做的不是凭空假定态低秩，而是在一组有限 $\chi$ 的 MPS 中变分最小化 $\langle\psi|H|\psi\rangle$；若能隙、纠缠谱衰减等条件让截断尾部很小，它就会高效，但“低熵”仍不能替代对谱尾和误差的检查。

### 7. 迁移问题：把桥宽账本带到新态

1. 对六 qubit 的 Bell-pair 链 $\lvert\Phi^+\rangle_{12}\lvert\Phi^+\rangle_{34}\lvert\Phi^+\rangle_{56}$，其中 $\lvert\Phi^+\rangle=(\lvert00\rangle+\lvert11\rangle)/\sqrt2$，预测 cuts $k=1,2,3,4,5$ 的 rank 图样。哪几座桥是最窄的？统一 exact $\chi_*$ 是多少？
2. 构造一个只在某个 cut 有 Schmidt 权重 $(0.8,0.1,0.1)$ 的态。为什么 $S<\ln2$ 仍不能说 $\chi=2$ 精确？若要求 squared fidelity 至少 $0.99$，你还缺什么信息？
3. 把“局域基态通常可压缩”迁移到二维 PEPS、临界链或 quench 后的态：逐项写下你需要重新检查的条件，并区分“有一个近似算法表现不错”与“有一个无条件定理”。

</section>


<figure class="diagram" markdown="1">
![MPS/张量网络图：张量方块 + 物理腿/虚拟键的连线。](assets/img/mb-01-tensor-network.svg)
<figcaption><span class="fig-id">图 mb-01.1</span>MPS/张量网络图：张量方块 + 物理腿/虚拟键的连线。</figcaption>
</figure>

## 1. 指数墙与纠缠的地图

一般态 $|\psi\rangle = \sum c_{s_1\cdots s_N}|s_1\cdots s_N\rangle$——$2^N$ 个系数。**但一类物理基态特殊**：在一维短程局域、能隙等条件下，许多局域哈密顿量的基态满足**面积律**【引用】——子区域纠缠熵 ∝ 边界面积而非体积（一维 = 常数！对比典型高维随机系综的体积律）：**自然界的一部分基态是低纠缠的**——指数空间里的可压缩角落（🔗 与"自然图像住在低维流形"（ai 课/mfld-01 例 3）完全同构：**物理与 ML 面对同一种"名义维数巨大、实际结构低维"的幸运**）。这不是所有局域哈密顿量、所有激发态或所有有限随机 toy 的无条件结论。

## 2. 矩阵乘积态（MPS）：SVD 的物理加冕

**构造【推导级】**：对系数张量沿链逐点做 SVD（数学站 nla-01 的 Eckart–Young 连环使用），每步只保留前 $\chi$ 个奇异值：

$$
c_{s_1s_2\cdots s_N} \approx \sum_{\{a\}} A^{s_1}_{a_1}A^{s_2}_{a_1a_2}\cdots A^{s_N}_{a_{N-1}}
$$

——**态 = 一串小矩阵的乘积**；参数从 $2^N$ 压到 $O(N\chi^2)$。**键维 $\chi$ 的含义**：截断处的奇异值是 Schmidt 系数，其平方 $p_i=\sigma_i^2$ 是约化密度矩阵的谱（常用 entanglement spectrum 再记作 $\xi_i=-\ln p_i$）——$\chi$ 直接封顶纠缠熵 $S \leq \ln\chi$。对**一维有能隙局域哈密顿量的基态**，面积律使 MPS 通常能以适中的 $\chi$ 高效逼近，而不是说每个面积律态都能被固定的小 $\chi$ 精确表示；临界系统还会出现对数纠缠修正。压缩格式与物理规律因此相配（Eckart–Young + 纠缠谱衰减，是 DMRG 成功的核心解释）。

**DMRG【机理级】**：在 MPS 族内变分极小化 $\langle\psi|H|\psi\rangle$（qm-04 变分法的多体版）——逐点扫描优化局部张量（交替最小二乘的气质，数学站优化线）。**战绩**：一维量子系统的基态能量算到机器精度级——凝聚态数值的金标准（White 1992【引用】）；二维用 PEPS 推广（收缩变难【引用】）、临界系统用 MERA（尺度分层——**RG 思想（asm-03）内建进网络结构**：张量网络是"RG 的数据结构化"）。

## 3. 变分蒙卡与神经网络波函数

**VMC 框架**：参数化试探态 $|\psi_\theta\rangle$，蒙卡采样（comp-01 Metropolis 按 $|\psi|^2$）估计能量与梯度、随机梯度下降——**"猜家族 + 采样 + 优化"**：物理版的机器学习训练循环（逐项对应：模型/损失/SGD）。

**神经网络波函数（2017–）【引用 Carleo–Troyer】**：试探态取 RBM/深网——**用 ML 的表达力换更大的纠缠覆盖**（超越 MPS 的面积律限制）；自旋系统与量子化学（FermiNet 类）上已具竞争力——**Hubbard/高温超导（cm 线的未解）是它与 DMRG、量子计算机（qi-03 量子模拟）三方赛跑的共同靶场**：本站三大板块（物理/数值/ML）在此汇成同一条前沿。

**符号问题一嘴**（comp-01 的欠条）：费米子行列式的负权重使 QMC 指数变慢——正是这堵墙让"量子模拟量子"（费曼初心）与神经网络方法有了不可替代的席位。

## 4. 全站收束

物理讲义库的最后一页停在这里是有意的：**多体物理的前沿方法 = 线性代数（SVD）+ 统计（蒙卡）+ 优化（变分）+ 信息（纠缠熵）+ ML（神经拟设）**——你的五个站点在一个活的研究领域里全部上岗。往前每一步（更好的拟设、更聪明的采样、量子硬件）都在本站的知识地图上有坐标。

## 5. 练习与要点

**例 1（MPS 手算最小例）** 四自旋 GHZ 态 $\frac{|0000\rangle + |1111\rangle}{\sqrt2}$：$\chi = 2$ 的 MPS 显式写出（每个矩阵 $2\times2$ 对角）——"宏观叠加纠缠熵却只有 $\ln2$"：低纠缠 ≠ 平庸的样本。

**例 2（面积律的反差数感）** 随机态的半链纠缠熵 $\sim \frac N2\ln2$（体积律）需要 $\chi \sim 2^{N/2}$；基态 $S \sim O(1)$ 只需 $\chi \sim$ 几十——**同一空间里"天堂角落"与"荒野"的压缩比差指数**：DMRG 为什么专治基态、难治高激发/长时间演化（纠缠随时间线性增长【引用】）的一句话答案。

**例 3（VMC 玩具全流程）** 一维横场 Ising（$N = 10$）：RBM 拟设 + Metropolis + SGD 找基态、对照精确对角化——百行代码在你的 4060 Ti 上十分钟收敛：**全站最后一个上机作业，物理 × ML 的毕业设计**。$\blacksquare$

---

## 物理讲义库落成

四十七页走完：牛顿的苹果 → 场与波 → 熵与量子 → 时空曲率 → 规范对称 → 多体涌现。回望全程，三条母题反复出现：**变分原理**（力学-量子-场论-ML 的通用语法）、**对称性**（Noether-规范-破缺——守恒与相互作用与质量的总出处）、**统计涌现**（配分函数-相变-RG——多者异也）。它们与数学站的地基、AI 站的应用连成一张网——**物理是这张网的中枢**：往下是数学的严格，往上是计算与智能的工程。祝复习顺利、常回来查表。
