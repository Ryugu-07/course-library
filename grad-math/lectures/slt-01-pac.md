# 统计学习 I · PAC 框架与有限假设类

> **对标**：Shalev-Shwartz & Ben-David *UML* §2–4 ｜ **前置**：hdp-01、本科 ai 课 01 讲
> 统计学习理论回答一个问题：**"从数据学出的规则，凭什么对新数据有效？"** 本页把 ai 课 01 讲的泛化故事升级为正式理论：PAC 可学性的定义、有限类的完整定理（可实现与不可知两种情形全证）、以及"没有免费午餐"的严格版。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="pac-learning-title">

## 学习层：先猜复杂度，再把定理与一次数据分开

<h3 id="pac-learning-title">1. 具体谜题：同一个有限假设类，保证和观测各自说什么？</h3>

先固定一个有限类 $\mathcal H$，大小记为 $H=|\mathcal H|$，再固定容许精度 $\varepsilon$ 与失败概率 $\delta$。本实验同时放入两本账：一本文字上可推广到所有 i.i.d. 分布的 **PAC 定理账**，以及一份固定数据排列上的 **realized train/test 观测账**。后者不是前者的替身。

### 2. 先预测：$\varepsilon$、$\delta$ 和 $H$ 到底怎样收费？

揭示前先回答：

1. 在有限类可实现情形，union bound 给出的样本复杂度按 $1/\varepsilon$ 还是 $1/\varepsilon^2$ 增长？不可知情形呢？
2. 把 $H$ 加倍，定理中的代价是加倍还是只增加一个对数项？
3. 一次固定训练/测试划分得到的 test error，是否自动等于 PAC 上界，或能替代概率 $1-\delta$ 的量词？

### 3. 两个有限类上界：先写清量词

在 realizable 假设下，存在零风险假设且一致 ERM 的经典有限类账本是

$$
m_{\mathrm{real}}(\varepsilon,\delta,H)=\left\lceil\frac{\ln(H/\delta)}{\varepsilon}\right\rceil,
\qquad
\Pr(\exists\text{ 坏假设全程不犯错})\le H e^{-m\varepsilon}.
$$

在 agnostic 情形，用 Hoeffding 加 union bound 控制所有有限假设的经验风险偏差，可用

$$
m_{\mathrm{agn}}(\varepsilon,\delta,H)=\left\lceil\frac{2\ln(2H/\delta)}{\varepsilon^2}\right\rceil.
$$

前者的 $1/\varepsilon$ 与后者的 $1/\varepsilon^2$ 是不同噪声假设下的**定理上界**。它们都不是某一次数据的 test error 预测，更不是从一次 ERM 运行反推分布保证。

### 4. 动手实验：先选答案，再揭示两本账

实验使用一个固定的有限二分类规则集和一份固定排列的 20 个样本。你可以改变 $H,\varepsilon,\delta$ 与训练前缀长度 $m$，先选择三项答案，再揭示：realizable/agnostic 的样本复杂度、union-bound 失败项、ERM 在这一次数据上的 train error 与 test error。最后两项只标为 **realized observation**，不写成 PAC 保证。

<div class="learning-lab" data-learning-lab="pac-sample-complexity" markdown="1">

**无 JavaScript 时的静态读法：**默认取 $H=8,\varepsilon=0.20,\delta=0.10,m=12$。理论项先独立记账：
$m_{\mathrm{real}}=\lceil\ln(8/0.1)/0.2\rceil=22$，
$m_{\mathrm{agn}}=\lceil2\ln(16/0.1)/0.2^2\rceil=254$，
而 $\min(1,8e^{-0.2\cdot12})\approx0.726$ 是 realizable union-bound failure 上界，不是实际失败频率。

| 账本种类 | 数值/读法 | 量词与身份 |
|---|---:|---|
| 有限类大小 $H$ | $8$ | 被 union bound 计数的假设数 |
| realizable 样本复杂度 | $22$ | 若 $m\ge22$，给出相应的 $\varepsilon,\delta$ 定理保证 |
| agnostic 样本复杂度 | $254$ | 噪声不被排除时的另一条上界 |
| 本次实际训练误差 | ERM 选 $h_2$：$1/12\approx0.0833$ | 一次 realized observation |
| 本次实际测试误差 | 同一 $h_2$ 在剩余 8 点：$4/8=0.5$ | 一次 realized observation，不是上界 |

静态阅读时，先把最后两行和前面三行分开：理论上界描述对随机样本的概率事件；一次 train/test 数字只描述这份已实现数据。即使 test error 小于上界，也不能把一次观测升级成证明；即使它大于某个未满足前提的数，也不能反向否定定理。

</div>

### 5. 误区 / 边界：先挑后估为什么要统一控制？

- 单个预先指定的 $h$ 可以用 Hoeffding；但 ERM 的 $\hat h$ 依赖同一份样本，必须对整个有限类做 union bound，不能把“挑完再估”伪装成单假设事件。
- $m_{\mathrm{real}}$ 和 $m_{\mathrm{agn}}$ 是给定 $H,\varepsilon,\delta$ 的 sufficient upper bounds，常数和更精细的算法/下界可改进，但不能把它们写成一次实验的预测值。
- 固定 train/test 划分不是自动的 i.i.d. 概率实验；本页把它标成审计样本，用来练习 ERM、误差分账和量词纪律。
- 有限类假设是关键归纳偏置；当 $H$ 无限时，逐函数 union bound 失效，要转向 VC、Rademacher、稳定性或其他复杂度。

### 6. 迁移题

若把 $H$ 从 $8$ 增长到 $8\times10^6$，在固定 $\varepsilon,\delta$ 下两条公式各增加多少？若把同一算法换成一个依赖测试集调参的流程，为什么“test error”不再是一个干净的 hold-out 观测？把这两个问题分别用 $\ln H$ 与“数据依赖的选择”回答。

</section>

## 1. 形式框架

**要素**：域 $\mathcal{Z} = \mathcal{X}\times\mathcal{Y}$、未知分布 $\mathcal{D}$、假设类 $\mathcal{H}$、损失 $\ell$（本页取 0-1）。**真实风险** $L_{\mathcal{D}}(h) = E_{\mathcal{D}}[\ell(h, Z)]$；**经验风险** $L_S(h) = \frac1m\sum\ell(h, z_i)$；学习算法 = 从样本 $S \sim \mathcal{D}^m$ 到假设的映射，**ERM**：$\hat h \in \arg\min_{h\in\mathcal{H}} L_S(h)$。

**定义（PAC 可学，agnostic 版）** $\mathcal{H}$ 可学：存在算法与样本复杂度 $m(\varepsilon, \delta)$，对**一切**分布 $\mathcal{D}$，$m \geq m(\varepsilon,\delta)$ 个样本以概率 $\geq 1-\delta$ 保证

$$
L_{\mathcal{D}}(\hat h) \leq \min_{h\in\mathcal{H}} L_{\mathcal{D}}(h) + \varepsilon
$$

（**P**robably（$\delta$）**A**pproximately（$\varepsilon$）**C**orrect；"对一切分布"是与经典统计的分野——**无分布假设，只押注假设类**。）

## 2. 有限类定理（两种情形全证）

**定理 A（可实现情形：存在零风险假设）** $|\mathcal{H}| < \infty$，则 $m \geq \frac{\ln(|\mathcal{H}|/\delta)}{\varepsilon}$ 使 ERM（此时 = 挑任一零经验风险假设）以概率 $1-\delta$ 满足 $L_{\mathcal{D}}(\hat h) \leq \varepsilon$。
**【证明】** 坏假设 $h$（$L_{\mathcal{D}}(h) > \varepsilon$）在单个样本上"装好"的概率 $\leq 1 - \varepsilon$，在整个 $S$ 上零错的概率 $\leq (1-\varepsilon)^m \leq e^{-\varepsilon m}$；union bound 于至多 $|\mathcal{H}|$ 个坏假设：$P(\text{某坏假设全对}) \leq |\mathcal{H}|e^{-\varepsilon m} \leq \delta$。$\blacksquare$

**定理 B（不可知情形）** $m \geq \frac{2\ln(2|\mathcal{H}|/\delta)}{\varepsilon^2}$ 使 ERM 满足 agnostic PAC。
**【证明】** 两步。① **一致收敛**：对每个 $h$，Hoeffding（hdp-01）给 $P(|L_S(h) - L_{\mathcal{D}}(h)| > \frac\varepsilon2) \leq 2e^{-m\varepsilon^2/2}$；union bound 得 $\sup_{h}|L_S - L_{\mathcal{D}}| \leq \frac\varepsilon2$ w.p. $1-\delta$。② **ERM 的两步三角**：

$$
L_{\mathcal{D}}(\hat h) \leq L_S(\hat h) + \tfrac\varepsilon2 \leq L_S(h^*) + \tfrac\varepsilon2 \leq L_{\mathcal{D}}(h^*) + \varepsilon
$$

（中间用 ERM 定义。）$\blacksquare$
**结构读法**：**"一致收敛 ⇒ ERM 成功"**——泛化理论的中心三段论（后两页只是把 ① 的工具从 union bound 升级为 VC/Rademacher）；$\varepsilon$ vs $\varepsilon^2$ 的速率差（可实现 $\frac1m$ vs 不可知 $\frac{1}{\sqrt m}$）：零风险情形"好消息更容易确认"——**噪声让学习贵一个平方**。

## 3. 没有免费午餐（严格版）

**定理（NFL）** 0-1 损失、$|\mathcal{X}| \geq 2m$：对任何学习算法 $A$，存在分布 $\mathcal{D}$（且可实现于全函数类）使 $E_S[L_{\mathcal{D}}(A(S))] \geq \frac18$（同时最优假设风险为 0）。
**【骨架】** 在 $2m$ 个点上均匀支撑、标签由随机函数生成：算法只见过一半的点，未见点上任何预测对"平均的真函数"错一半；对函数取平均后必存在单个坏函数（概率方法——期望论证的反向使用，图论组合线的老朋友）。$\blacksquare$
**读法**：**全函数类不可学**（$m(\varepsilon,\delta) = \infty$）——学习必须先押注归纳偏置（ai 课 01 讲 NFL 的正式版）；"$\mathcal{H}$ 的复杂度"因此不是技术参数而是**知识论承诺的度量**，量化它正是后两页的全部内容。

**误差分解定型**：$L_{\mathcal{D}}(\hat h) = \underbrace{\min_{\mathcal{H}}L_{\mathcal{D}}}_{\text{逼近误差}} + \underbrace{(L_{\mathcal{D}}(\hat h) - \min)}_{\text{估计误差}}$——类越大逼近越好、估计越难：**偏差–方差权衡的学习论版本**，模型选择（SRM/正则化，slt-04）在此谱系上运作。

## 4. 练习与要点

**例 1（样本复杂度手算）** 一百万个假设、$\varepsilon = 0.01, \delta = 0.001$：不可知情形 $m \geq \frac{2(\ln 2\times10^6 + \ln 10^3)}{10^{-4}} \approx 4.3\times10^5$——**假设数取对数后几乎免费**（$|\mathcal{H}|$ 翻倍只加 $\ln 2$）；贵的是精度平方（hdp-01 例 2 的口诀重现：对数便宜、平方贵）。

**例 2（离散化论证）** 实参数模型（如 $d$ 个 32 位浮点权重的网络）：$|\mathcal{H}| \leq 2^{32d}$ ⇒ $m = O\big(\frac{d + \ln(1/\delta)}{\varepsilon^2}\big)$——**参数量级的样本复杂度**，有限类定理已能给深度网络一个（粗糙的）界；"每个参数付常数个样本"的工程口感由此。但它解释不了过参数化网络为何泛化（$d \gg m$ 仍工作）——经典理论的著名裂缝（ai 课 01/07 的未解之谜在正式理论中的位置）。

**例 3（① 与 ② 的分工自检）** 若只要求"输出的 $\hat h$ 泛化"而不比 $h^*$：单假设 Hoeffding 够吗？——不够：$\hat h$ 依赖 $S$（挑出来的），单点界失效——**"先挑后估必须一致界"**，ai 课 01 讲那个 1000 人抛硬币的比喻在此是定理结构。$\blacksquare$

---

*下一页：从有限到无限——VC 维、Sauer 引理与学习论基本定理：ai 课 01 讲欠下的"完整证明"在此清偿。*
