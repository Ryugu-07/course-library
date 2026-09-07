# 课程导览：从找函数到智能体

> 这是一门"把 AI 重演一遍"的自学课程。上篇沿着历史的脉络把概念和原理讲透——每个概念都回答两个问题：**它诞生时要解决什么问题？为什么是这个方案胜出？** 下篇是应用实操手册——怎么选模型、装工具、用 AI 促进学习科研，以及文生图、PPT、代码、论文四大实战。

## 课程地图

**上篇 · AI 发展史（9 讲，含全量数学推导）**

| 讲次 | 主题 | 核心问题 |
|---|---|---|
| 01 | 机器学习就是找函数 | 什么是"学习"？为什么泛化是可能的？ |
| 02 | 感知机与支持向量机 | 线性分类器怎么找？哪条分界线最好？ |
| 03 | 决策树与贝叶斯方法 | 不用几何用逻辑与概率，怎么分类？ |
| 04 | 神经网络的兴衰与反向传播 | 复合函数怎么训练？NN 为何两起两落？ |
| 05 | AlexNet 与深度学习热潮 | 为什么 2012 年深度学习突然爆发？ |
| 06 | 从序列建模到 Transformer | 语言这种变长序列怎么处理？注意力是什么？ |
| 07 | Scaling Laws 与大语言模型 | 为什么"大力出奇迹"？LLM 怎么被造出来？ |
| 08 | 让输出更好更稳：四个工程 | 提示词 → 上下文 → 编排 → 循环 |
| 09 | 工具调用、智能体、MCP 与 Skills | LLM 怎么一步步变得更强大、更通用？ |

**下篇 · AI 应用（9 讲，实操向）**

| 讲次 | 主题 |
|---|---|
| 10 | 模型地图与选型：每个模型有什么特点、适合干什么活 |
| 11 | 软件与环境安装：从聊天网页到 CLI 智能体到本地部署 |
| 12 | 用 AI 促进学习：当导师而不是答案机 |
| 13 | 用 AI 促进科研：文献、推导、复现、写作 |
| 14 | 使用技巧与坑：幻觉、谄媚、上下文腐烂与 verify 文化 |
| 15 | 实战：写代码与数据分析 |
| 16 | 实战：文生图 |
| 17 | 实战：PPT 与文档 |
| 18 | 实战：论文与长文写作 |

**专题 · AI 系统工程（1 讲）**

| 讲次 | 主题 | 核心问题 |
|---|---|---|
| 19 | 推理服务：延迟、吞吐与排队 | 同一块硬件怎样在首 token、单请求等待与总吞吐之间取舍？ |

**实验室（10 个可运行实验）**：每个原理讲次都配一个动手实验，"跑过一遍"比"读过一遍"记得牢。lab01–lab07 在本机计算（numpy / scikit-learn / PyTorch），不需要 API key；lab05 首次会尝试下载数据。lab08–lab10 调用 DeepSeek API，需要联网、账号与有效 API key。

## 怎么使用这门课

1. **读讲义**：浏览器里按顺序读。公式不要跳——上篇的推导是为你的数学背景定制的，动笔跟一遍推导是本课程最有价值的部分。
2. **跑实验**：读完一讲，跑对应的 lab。实验代码里有密集的教学注释，建议逐块读懂再改参数玩。
3. **改着玩**：每个 lab 末尾有"动手改改"建议。把参数改坏、观察怎么坏，比看十遍正确结果学得多。

推荐节奏：每讲 1–2 天（读讲义 + 跑实验 + 推导），全程约 4–6 周。上下篇可以交替读（比如每周 2 讲原理 + 1 讲应用），应用篇相互独立可跳读。

## 环境准备 {#environment}

阅读网页无需安装实验环境。运行 Python 实验时，先安装 Git 与 Python 3.12，在你希望保存课程的目录打开终端。以下命令从公开仓库开始；如果已克隆，直接进入其中的 `ai-course` 目录，从创建虚拟环境那一步继续。

**Windows PowerShell：**

```powershell
git clone https://github.com/Ryugu-07/course-library.git
cd course-library/ai-course
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r labs/requirements.txt
.\.venv\Scripts\python.exe -c "import numpy, matplotlib, sklearn, torch; print('OK')"
.\.venv\Scripts\python.exe labs/lab01_find_function.py
```

**macOS / Linux：**

```bash
git clone https://github.com/Ryugu-07/course-library.git
cd course-library/ai-course
python3.12 -m venv .venv
.venv/bin/python -m pip install -r labs/requirements.txt
.venv/bin/python -c "import numpy, matplotlib, sklearn, torch; print('OK')"
.venv/bin/python labs/lab01_find_function.py
```

依赖清单是仓库内的 `ai-course/labs/requirements.txt`，首次安装需要联网。命令直接指定虚拟环境中的 Python，无需额外激活环境。图表会先保存到 `labs/output/`，再弹窗；关闭图窗后程序继续。无桌面环境的运行方法、CPU 最小检查和 API 配置见[实验总览](labs.html)。

普通 CPU 可以运行实验，无需 M4。lab05–lab07 的代码在 MPS 可用时使用 Apple GPU，否则使用 CPU；训练时间随硬件和参数变化，先完成短实验再尝试默认训练配置。

## 讲义如何更新

讲义源文件是 `lectures/*.md`，站点由 `build_site.py` 生成。在上面的 `ai-course` 目录中，使用已安装依赖的虚拟环境重建：

```powershell
# Windows PowerShell
.\.venv\Scripts\python.exe build_site.py
```

```bash
# macOS / Linux
.venv/bin/python build_site.py
```

浏览全部课程时，从仓库根目录启动服务：Windows 使用 `py -3.12 -m http.server 8778`，macOS / Linux 使用 `python3.12 -m http.server 8778`，然后打开 `http://localhost:8778/`。这样跨课程相对链接也能正常访问。

!!! note "关于时效"
    上篇的历史与数学不会过期。下篇涉及具体产品与模型（第 10、11 讲尤其），以 2026 年初为基准写成——AI 产品迭代极快，实操前用最新信息核对一遍（讲义里标注了哪些结论易变、哪些方法论长期有效）。

---

*下一讲我们从一个 1936 年就存在的问题出发：给你一朵鸢尾花的测量数据，判断它是哪个品种——机器学习的一切，从这里开始。*


<h2 id="研究前沿课程">研究前沿：生成、推理与内部机制</h2>

三讲各回答一个技术问题：生成模型如何学习连续运动；可验证奖励与更多推理计算到底改变了什么；怎样把相关激活升级为因果证据。每讲包含数学模型、关键推导、论文窗口与迁移题，文献核查日期为 **2026-09-08**。这组课程不依赖某个商业模型的当前排名。

| 专题课 | 已有基础 | 核心问题 | 学完应能检查什么 |
|---|---|---|---|
| [Flow Matching](frontier-01-flow-matching.html) | [神经网络](04-neural-networks.html)、概率与常微分方程 | 怎样用条件速度的回归学到分布运动？ | 端点、耦合、边际路径与采样误差是否混为一谈？ |
| [推理强化学习](frontier-02-reasoning-rl.html) | [大模型训练](07-scaling-laws-llm.html)、[Bellman](../../grad-math/site/mdp-01-bellman.html) | 奖励、策略优化与测试时搜索分别贡献什么？ | pass@k、实际选中正确答案和推理链真实性是否分别评估？ |
| [机制可解释性](frontier-03-mechanistic-interpretability.html) | [神经网络](04-neural-networks.html)、[Transformer](06-transformer.html) | 怎样从特征表征走到可检验的因果电路？ | 消融、补丁与冗余路径的结论是否超出干预证据？ |

先把玩具模型手算出来，再对照论文中的真实系统规模、数据和评估。预印本结论、论文报告的经验现象与已经证明的恒等式会分别标明；不同论文的测量协议不能直接混成同一个排行榜。

相关路线：[数学前沿](../../grad-math/site/index.html) · [物理前沿](../../physics-course/site/index.html#研究前沿课程)。


<h2 id="research-curriculum">连续研究课程：从基础工具到研究问题</h2>

每条线按四讲顺序推进：先建立可算对象，再检验模型条件，最后进入研究文献。讲次之间有关联；与前面的专题课可以交叉阅读。

**科学机器学习**

[算子学习](research-01-operator-learning.html) → [Fourier 神经算子](research-02-fourier-operator.html) → [等变网络](research-03-equivariant-networks.html) → [模拟推断](research-04-simulation-inference.html)。

**世界模型与具身智能**

[潜在动力学](research-05-latent-world-model.html) → [基于模型的规划](research-06-model-based-planning.html) → [视觉语言动作模型](research-07-vision-language-action.html) → [泛化与任务评估](research-08-embodied-evaluation.html)。

科学机器学习线先修神经网络、线性代数、概率与微分方程；世界模型与具身线先修动力学、优化和条件概率。实验使用明确的低维模型，便于手算与复验；论文中的大模型训练和机器人评测另列数据、算力及环境条件。
