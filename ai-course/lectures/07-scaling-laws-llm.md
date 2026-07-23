# 第 07 讲 · Scaling Laws 与大语言模型

> **诞生场景**：2017 年架构问题解决后，一个朴素到近乎莽撞的问题摆上台面：**把模型做大，会发生什么？**做大要烧真金白银（百万、千万、上亿美元的算力），没人敢盲赌。2020 年 OpenAI 的 Kaplan 等人给出了定量答案：损失随规模按**幂律**平滑下降，可预测、可外推。这条曲线成了大模型时代的投资依据——OpenAI 据此敢在 GPT-3 上押 460 万美元的训练费，后来者据此敢烧数亿。本讲讲清楚三件事：LLM 到底在学什么（下一词预测的深意）、Scaling Laws 的数学、以及一个"互联网续写机"如何被驯化成 ChatGPT。

## 1. 语言模型：找"下一个词"的函数

回到第 01 讲的框架。语言模型的任务：给定前文，预测下一个词（token）的概率分布——

$$
f: (w_1, w_2, \dots, w_{t-1}) \mapsto \mathbb{P}(w_t \mid w_1, \dots, w_{t-1})
$$

整句话的概率由链式法则分解：$\mathbb{P}(w_1, \dots, w_T) = \prod_{t=1}^{T} \mathbb{P}(w_t \mid w_{<t})$。这就是**自回归**语言建模，用 decoder-only Transformer（第 06 讲，因果掩码保证不偷看未来）实现。

三要素齐了：假设空间 = 某个规模的 Transformer；**损失 = 交叉熵**；优化 = SGD 的改良版（Adam）。交叉熵损失就是负对数似然：

$$
L = -\frac{1}{T}\sum_{t=1}^{T} \log \mathbb{P}_\theta(w_t \mid w_{<t})
$$

信息论含义（接第 03 讲的熵）：交叉熵 $H(p, q) = -\sum_x p(x)\log q(x) = H(p) + D_{\mathrm{KL}}(p \| q)$——最小化交叉熵 = 最小化模型分布 $q$ 与真实分布 $p$ 的 KL 距离，下界是语言本身的熵。工程上常报**困惑度** $\mathrm{PPL} = e^{L}$，直观读法："模型平均在多少个候选词之间犹豫"。

两个工程细节：**token** 不是词也不是字——BPE（字节对编码）从字符出发反复合并高频相邻对，得到几万个子词单元的词表（"transformer"可能切成 "trans+form+er"），在词表大小与序列长度之间折中；**训练数据**就是互联网文本本身——下一词预测**不需要人工标注**（标签就是文本里的下一个词），这让"用全互联网训练"成为可能。监督信号免费且无限，是这条路线能规模化的第一前提。

### 为什么"预测下一词"能逼出智能？

表面看这是打字联想。往深看：要在**任意**文本上把下一词预测好，你需要什么？

- "巴黎是法国的\_\_" → 需要**世界知识**；
- "3 + 5 = \_\_" → 需要**计算**；
- "他把冰淇淋忘在车里，回来发现\_\_" → 需要**物理常识**；
- 一段侦探小说的结尾"凶手是\_\_" → 需要**读懂全文并推理**。

下一词预测是一个**万能任务的外壳**：预测做到极致，等价于对文本背后的生成过程（世界、逻辑、说话人意图）建模。理论视角：最优压缩即最优预测（香农），一个把互联网压缩得足够好的模型，必然内化了产生这些文本的规律。这个论证 2018 年时只有少数人当真，OpenAI 是其中之一，并且真金白银地下注。

## 2. GPT 路线：预训练范式的确立

- **GPT-1（2018，1.17 亿参数）**：验证"无监督预训练 + 有监督微调"在 NLP 可行（第 05 讲 CNN 迁移学习的语言版）；
- **GPT-2（2019，15 亿）**：发现不微调也行——预训练模型**零样本**就能做翻译、摘要、问答（论文标题即宣言：Language Models are Unsupervised Multitask Learners）。因为互联网文本里天然混着所有任务的示范：法英对照、"TL;DR:" 后接摘要……**学语言的过程顺带学了所有任务**；
- **GPT-3（2020，1750 亿）**：规模跳了两个数量级，冒出**上下文学习（in-context learning）**：在提示里给几个示例（few-shot），模型当场"学会"新任务——**没有任何梯度更新**。任务适配从"改参数"变成"改输入"，这直接催生了第 08 讲的提示词工程。

从 GPT-2 到 GPT-3 敢跳两个数量级，靠的就是下一节的曲线。

## 3. Scaling Laws：大力出奇迹的数学

<figure class="plot" markdown="1">
![Scaling Laws 幂律](assets/img/07-scaling-laws.svg)
<figcaption><span class="fig-id">图 7.1</span>Scaling Laws：模型损失随算力/参数/数据按幂律下降（log-log 上是直线）——"大力出奇迹"的定量依据。</figcaption>
</figure>

### 3.1 Kaplan 定律（2020）

系统实验发现：测试损失 $L$ 与三个规模量——参数量 $N$、数据量 $D$（token 数）、计算量 $C$（FLOPs）——各自满足**幂律**（其余两者不受限时）：

$$
L(N) \approx \left(\frac{N_c}{N}\right)^{\alpha_N}, \qquad L(D) \approx \left(\frac{D_c}{D}\right)^{\alpha_D}, \qquad L(C) \approx \left(\frac{C_c}{C}\right)^{\alpha_C}
$$

拟合指数 $\alpha_N \approx 0.076$，$\alpha_D \approx 0.095$。在 log-log 坐标下是笔直的线，横跨**七个数量级**不弯——这意味着可以**用小模型的实验外推大模型的性能**，训练前就能预算出结果（GPT-4 技术报告称其最终损失由千分之一算力的小实验预测，误差极小）。同期发现：架构细节（宽深比、头数）影响远小于规模本身——**规模是一等公民，架构是二等公民**。这重塑了整个领域的研究议程，"把它做大"从工程口号升格为科学策略。

### 3.2 计算量核算：$C \approx 6ND$

训练的 FLOPs 有个简洁的近似。对每个 token：前向传播中每个参数约参与 2 次浮点运算（一乘一加），计 $2N$；反向传播要算对激活和对参数的两组梯度，代价约为前向的 2 倍，计 $4N$（第 04 讲"反向 ≈ 2 次前向"的账，这里到期兑现）。合计每 token $6N$，故总计算量

$$
C \approx 6\,N\,D
$$

给定算力预算 $C$，$N$ 和 $D$ 就是跷跷板的两端：大模型少喂数据，还是小模型多喂数据？

### 3.3 Chinchilla：最优配比的完整推导

DeepMind（2022）用 400 多次训练拟合出联合损失面：

$$
L(N, D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}
$$

（拟合值 $E \approx 1.69$（英文文本的不可约熵——第 01 讲贝叶斯误差的 LLM 版），$A \approx 406.4,\ B \approx 410.7,\ \alpha \approx 0.34,\ \beta \approx 0.28$。）在约束 $C = 6ND$ 下最小化 $L$。代入 $D = C/(6N)$ 消元：

$$
L(N) = E + A N^{-\alpha} + B\left(\frac{6N}{C}\right)^{\beta}
$$

对 $N$ 求导置零：

$$
\frac{dL}{dN} = -\alpha A N^{-\alpha - 1} + \beta B \frac{6^\beta}{C^\beta} N^{\beta - 1} = 0
\;\Longrightarrow\;
N^{\alpha + \beta} = \frac{\alpha A}{\beta B} \cdot \frac{C^{\beta}}{6^{\beta}}
$$

解得最优参数量与数据量：

$$
N^* \propto C^{\frac{\beta}{\alpha + \beta}}, \qquad D^* = \frac{C}{6N^*} \propto C^{\frac{\alpha}{\alpha + \beta}}
$$

代入拟合值 $\alpha \approx 0.34, \beta \approx 0.28$：两个指数都 $\approx 0.5$——**算力翻倍时，参数量和数据量应各扩 $\sqrt{2}$ 倍，等比增长**；换算成经验口诀：每个参数约配 **20 个 token**。对照现实：GPT-3 用 1750 亿参数只喂了 3000 亿 token（每参数 1.7 个）——按此标准**严重欠喂**；Chinchilla 用 GPT-3 四分之一的参数（700 亿）配 1.4 万亿 token，同算力下全面胜出。此后业界转向"小而多喂"（Llama 系列每参数喂几百上千 token——考虑推理成本后，甚至值得越过训练最优点继续喂）。**一页微积分改写了行业的资源分配。**

### 3.4 涌现：规模的意外礼物？

规模曲线上还观察到一类不连续现象：某些能力（多步算术、思维链推理）在小模型上完全没有，跨过某个规模后突然出现——**涌现能力**（Wei et al. 2022）。但 Schaeffer et al. (2023) 泼了盆冷水：许多"涌现"是**度量的伪影**——用"完全答对才得分"这类非线性指标，平滑进步也会显示成突变；换成连续指标，曲线大多恢复平滑。这场争论未完全落幕，务实的结论是：**底层能力平滑增长，任务级表现可以突变**；对"更大规模会冒出什么"保持敬畏（无论惊喜还是风险）。

!!! note "呼应第 01 讲的未解之谜"
    LLM 的参数量（$10^{11}$）远超训练 token 数都能过拟合的经典界限，VC 泛化界在此完全空洞，可它偏偏泛化——第 01 讲"双下降"与"经典理论失效"在这里达到极致。Scaling Laws 本身也只是经验规律：**为什么是幂律？指数由什么决定？**目前只有部分理论假说（数据流形维数、技能组合模型）。你正在见证一个"实验跑在理论前面"的物理学式时代。

## 4. 从续写机到助手：对齐三部曲

2020 年的 GPT-3 是个天才的"互联网续写机"，但不是助手：问它"怎么给孩子办生日派对？"，它可能回你一串更多的问题（因为互联网上问题常常成串出现）。它只忠实地模拟训练分布——**能力有了，意图没对齐**。把它变成 ChatGPT 需要三步（InstructGPT 配方，2022）：

### 4.1 SFT：示范

雇人写几万条"理想对话"（问题 + 高质量回答），用它们微调预训练模型——还是下一词预测，只是数据换成了示范。模型学会"助手腔"。但示范贵、覆盖不了万事万物，且人类**评价**答案好坏比**写出**完美答案容易得多——这个不对称引出下一步。

### 4.2 奖励模型：把偏好变成数字（Bradley–Terry 推导）

让模型对同一问题生成多个回答，人只做排序（"A 比 B 好"）。要从成对比较学出一个打分函数 $r_\phi(x, y)$，用 **Bradley–Terry 模型**（1952 年就有的配对比较模型）：假设"A 胜过 B"的概率由分差决定，

$$
\mathbb{P}(y_w \succ y_l \mid x) = \frac{e^{r(x, y_w)}}{e^{r(x, y_w)} + e^{r(x, y_l)}} = \sigma\big(r(x, y_w) - r(x, y_l)\big)
$$

（$\sigma$ 是 sigmoid，$y_w$ = 人选中的赢家，$y_l$ = 输家。）对人类标注数据做极大似然，即最小化

$$
L_{\mathrm{RM}}(\phi) = -\mathbb{E}_{(x, y_w, y_l)}\Big[\log \sigma\big(r_\phi(x, y_w) - r_\phi(x, y_l)\big)\Big]
$$

得到一个能给任意回答打分的**奖励模型**——人类品味的可微替身。

### 4.3 RLHF：追着奖励爬山

用强化学习让语言模型 $\pi_\theta$ 最大化奖励，但必须拴一条绳——不许离起点（SFT 模型 $\pi_{\mathrm{ref}}$）太远，否则模型会找到奖励模型的漏洞（**reward hacking**：比如发现空洞的长篇大论能骗高分）：

$$
\max_\theta \; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta(\cdot \mid x)}\Big[r_\phi(x, y)\Big] - \beta\, D_{\mathrm{KL}}\big(\pi_\theta(\cdot \mid x)\,\|\,\pi_{\mathrm{ref}}(\cdot \mid x)\big)
$$

OpenAI 用 PPO 算法优化此目标，得到 InstructGPT / ChatGPT。RLHF 工程上出名地娇气（四个模型同时在显存里、超参敏感），于是有了下面这个漂亮的替代。

### 4.4 DPO：把 RL 整个消掉（完整推导）

**第一步：上面的 KL 正则目标有闭式解。**逐 $x$ 展开目标（记 $Z$ 为归一化因子）：

$$
\max_\pi \mathbb{E}_{y \sim \pi}\left[r(x,y) - \beta \log\frac{\pi(y|x)}{\pi_{\mathrm{ref}}(y|x)}\right]
= -\beta\, \min_\pi\, \mathbb{E}_{y\sim\pi}\left[\log\frac{\pi(y|x)}{\pi_{\mathrm{ref}}(y|x)\, e^{r(x,y)/\beta}}\right]
$$

右边括号内是 $\pi$ 与分布 $\pi^*(y|x) = \frac{1}{Z(x)}\pi_{\mathrm{ref}}(y|x)\,e^{r(x,y)/\beta}$ 的 KL 散度（差一个与 $\pi$ 无关的 $\log Z$）。KL 在两分布相等时取最小，故最优策略为

$$
\pi^*(y \mid x) = \frac{1}{Z(x)}\, \pi_{\mathrm{ref}}(y \mid x)\, \exp\!\big(r(x,y)/\beta\big)
$$

**第二步：反解奖励。**两边取对数整理：

$$
r(x, y) = \beta \log\frac{\pi^*(y \mid x)}{\pi_{\mathrm{ref}}(y \mid x)} + \beta \log Z(x)
$$

**第三步：代回 Bradley–Terry。**偏好概率只依赖**分差**，讨厌的 $\log Z(x)$（对同一 $x$ 的两个回答相同）**恰好相消**：

$$
\mathbb{P}(y_w \succ y_l \mid x) = \sigma\!\left(\beta\log\frac{\pi^*(y_w|x)}{\pi_{\mathrm{ref}}(y_w|x)} - \beta\log\frac{\pi^*(y_l|x)}{\pi_{\mathrm{ref}}(y_l|x)}\right)
$$

于是可以**跳过奖励模型和 RL**，直接对策略做极大似然——**DPO 损失**（Rafailov et al. 2023）：

$$
L_{\mathrm{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l)}\left[\log\sigma\!\left(\beta\log\frac{\pi_\theta(y_w|x)}{\pi_{\mathrm{ref}}(y_w|x)} - \beta\log\frac{\pi_\theta(y_l|x)}{\pi_{\mathrm{ref}}(y_l|x)}\right)\right]
$$

**你的语言模型本身，暗中就是一个奖励模型**（论文标题：Your Language Model is Secretly a Reward Model）。整条推导只用了 KL 的非负性和 BT 模型，两页纸把一套复杂的 RL 流水线替换成一个监督损失——数学上是本课程最优雅的推导之一，值得完整重走一遍。

## 5. ChatGPT 时刻与其后（2022–2026）

2022 年 11 月 30 日 ChatGPT 上线，两个月破亿用户，史上最快。此后的主线速览（细节留给第 10 讲的模型地图）：

- **2023**：GPT-4（多模态、专业考试水平）；Meta 开源 Llama 系列，开源生态爆发；
- **2024**：上下文窗口卷到百万级（Gemini）；多模态原生化；**推理模型**出现——OpenAI o1 用强化学习训练"思维链"（先长篇思考再作答），在数学、编程上跃升。这开辟了第二条 scaling 轴：**测试时计算**（thinking 越久越准），与训练时 scaling 并行；
- **2025**：DeepSeek R1 以极低成本复现推理能力并开源，证明配方可平价化；训练范式向 **RLVR**（可验证奖励的强化学习：数学有答案、代码有测试，奖励不再依赖人类偏好而是客观对错）倾斜；
- 与此同时，单靠预训练规模的收益放缓（高质量数据渐趋耗尽——Chinchilla 公式里 $D$ 的一端逼近物理极限），行业重心转向后训练、推理时计算与工程化——**这恰好是下一讲的主题**。

一条值得记住的时间线收束：1957 感知机 → 1986 反向传播 → 2012 AlexNet → 2017 Transformer → 2020 Scaling Laws → 2022 ChatGPT。每一步的主角都还是那个"找函数"：只是函数从"分两类点"长成了"给定任何前文，预测人类会说的下一个词"。

## 本讲小结

| 概念 | 一句话 |
|---|---|
| 语言建模 | $\prod_t \mathbb{P}(w_t \mid w_{<t})$；交叉熵 = 压缩 = 预测 |
| 下一词预测 | 万能任务外壳：预测到极致必须建模世界 |
| Kaplan 定律 | $L \propto N^{-\alpha}$ 等幂律，log-log 直线跨七个数量级 |
| $C = 6ND$ | 前向 2N + 反向 4N；算力预算的跷跷板 |
| Chinchilla | 约束优化给出 $N^*, D^* \propto C^{0.5}$：等比扩展、每参数约 20 token |
| 涌现 | 任务级突变，部分是度量伪影；底层能力平滑增长 |
| SFT | 示范微调，学会"助手腔" |
| RLHF | BT 奖励模型 + KL 正则的策略优化 |
| DPO | 闭式最优策略反解奖励代回 BT，RL 化为监督学习 |
| 推理模型 | RL 训练思维链；测试时计算成为第二条 scaling 轴 |

**动手**：跑 `labs/lab07_scaling_law.py`——在你的 M4 上训一族从小到大的 mini Transformer，把损失-参数量画到 log-log 坐标上，亲手拟合出属于你的幂律指数。用几分钟的算力复现大模型时代的核心发现。

**延伸阅读**：Kaplan et al. "Scaling Laws for Neural Language Models" (2020)；Hoffmann et al. "Training Compute-Optimal LLMs" (Chinchilla, 2022)；Rafailov et al. "Direct Preference Optimization" (2023)；Ouyang et al. "Training LMs to follow instructions" (InstructGPT, 2022)。

---

*上篇的"造模型"故事到此完整。但 2022 年之后，世界上 99.9% 的人不造模型，而是「用」模型——怎么让一个概率性的、会犯错的、健忘的文本预测器稳定地干活？答案不再是数学，而是工程。下一讲：提示词工程、上下文工程、编排工程、循环工程。*
