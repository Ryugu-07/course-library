# 统计学习 I · PAC 框架与有限假设类

> **对标**：Shalev-Shwartz & Ben-David *UML* §2–4 ｜ **前置**：hdp-01、本科 ai 课 01 讲
> 统计学习理论回答一个问题：**"从数据学出的规则，凭什么对新数据有效？"** 本页把 ai 课 01 讲的泛化故事升级为正式理论：PAC 可学性的定义、有限类的完整定理（可实现与不可知两种情形全证）、以及"没有免费午餐"的严格版。

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
