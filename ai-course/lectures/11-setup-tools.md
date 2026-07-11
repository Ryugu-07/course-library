# 第 11 讲 · 软件与环境安装

> 这一讲是纯工具课：把使用 AI 的整条工具链——从网页聊天到 API 到编程智能体到本地部署——装起来、跑通。按"投入从低到高"分六层，各层独立，用到哪层装哪层。示例以 macOS 为主（Windows 差异会标注）。

## 1. 六层工具链总览

| 层级 | 形态 | 安装成本 | 适合 |
|---|---|---|---|
| L1 网页聊天 | chat 网页/App | 零 | 所有人的起点 |
| L2 桌面客户端 | 官方桌面 App | 一次下载 | 高频使用者（快捷键、截图、文件拖拽） |
| L3 API 调用 | 写代码调模型 | 需编程基础 | 批处理、自动化、做应用 |
| L4 编程智能体 | 终端里的 agent | 一条命令 | 写代码、改项目、数据分析 |
| L5 IDE 集成 | 编辑器插件 | 一次配置 | 日常编码的补全与重构 |
| L6 本地部署 | 本机跑开源模型 | 中等 | 隐私数据、离线、折腾爱好者 |

## 2. 基础设施：包管理器与 Python 环境

macOS 先装 Homebrew（包管理器，此后一切软件一条命令）：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.12 node git
```

Python 铁律：**永远在虚拟环境里装包**，不污染系统：

```bash
python3.12 -m venv .venv          # 在项目目录建环境
source .venv/bin/activate         # 激活（Windows: .venv\Scripts\activate）
pip install openai python-dotenv  # 装到这个环境里
```

（进阶可用 `uv`——Rust 写的极速替代品，`brew install uv` 后 `uv venv` / `uv pip install`，习惯后回不去。）

## 3. API：跑通第一个调用

### 3.1 拿 key 与管钱

到模型厂商的**开放平台**（注意和聊天产品是两个入口）注册、充值、创建 API key。三条纪律从第一天养成：

1. **key 即密码**：泄漏者可用你的额度。存在 `.env` 文件里，**绝不写进代码、绝不提交 git**（`.gitignore` 加上 `.env`；一旦泄露立即到平台吊销重发）；
2. **设置用量上限**：平台后台设每月预算警报，避免代码写错循环刷爆账单；
3. **从小额开始**：充最低额度先玩，个人学习用量通常每月几块到几十块人民币（DeepSeek 档的价格）。

### 3.2 第一个调用

行业事实标准是 OpenAI 兼容接口——大多数厂商（包括 DeepSeek）都兼容，换模型只需改 `base_url` 和模型名：

```python
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()  # 从 .env 读取密钥
client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一个严谨的数学助教。"},
        {"role": "user", "content": "用一句话解释什么是特征值。"},
    ],
    temperature=0.2,
)
print(resp.choices[0].message.content)
```

`.env` 文件内容就一行：`DEEPSEEK_API_KEY=sk-xxxxxx`。跑通这十几行，你就拥有了批量处理、自动化、接入自己程序的全部入口——本课程 lab08–lab10 都基于它。

理解计费：按 token 双向计费（输入 + 输出），中文 1 token ≈ 0.6–0.7 个汉字。**上下文每轮都要重发**——对话越长每轮越贵，这是第 08 讲上下文经济学的账单形态。

## 4. 编程智能体（CLI Agent）

第 09 讲的智能体落到日常，就是终端里的编程 agent。以 Claude Code 为例：

```bash
npm install -g @anthropic-ai/claude-code
cd 你的项目目录
claude          # 启动后用自然语言指挥它读代码、改文件、跑命令
```

（OpenAI 的 Codex CLI、开源的多种 agent 同理，装其一即可。）它与 L1 聊天框的本质区别：**它能直接操作你的文件系统和终端**——读整个项目、改多个文件、跑测试、看报错自己修。第 15 讲专讲怎么用好它。安全提醒一次到位：它每次执行命令会请求确认，**别嫌烦就全开自动**，尤其涉及删除、网络、安装的命令（第 09 讲提示词注入的现实防线就在这些确认框上）。

## 5. IDE 集成

- **VS Code + Copilot** 或各家插件：行内补全 + 侧边对话，写代码时的"顺手"层；
- **Cursor**：以 AI 为中心重做的 VS Code 分支，多文件编辑体验好；
- 与 L4 的分工：IDE 插件适合"我在写、它辅助"；CLI agent 适合"它在干、我在审"。

## 6. 本地部署：你的 Mac 能跑大模型

开源权重 + 消费级硬件已经能跑相当不错的模型。意义：**数据完全不出机器**（隐私）、离线可用、零边际成本、以及——亲手感受模型的"重量"。

最简单的入口是 **Ollama**：

```bash
brew install ollama
ollama serve &                 # 启动服务
ollama run qwen3:8b            # 首次自动下载（约 5GB），然后直接对话
```

你的 M4 / 24GB 统一内存能跑什么（经验法则：**模型占用 ≈ 参数量 × 每参数字节数**；4-bit 量化约 0.5 字节/参数，再留出系统与上下文的内存）：

| 规模 | 4-bit 量化后占用 | 24GB Mac 体验 |
|---|---|---|
| 7–9B | ~5GB | 流畅，日常问答够用 |
| 14B | ~9GB | 流畅，质量明显上台阶 |
| 30B 级（含 MoE） | ~18GB | 能跑，接近机器上限，关掉大程序再跑 |
| 70B+ | 40GB+ | 跑不动，需要更大内存或多卡 |

**量化**是本地部署的核心技巧：把权重从 16 位浮点压到 4 位整数，内存降 4 倍，质量损失通常可接受——又是一个工程折中。本地模型的 API 也兼容 OpenAI 格式（`base_url="http://localhost:11434/v1"`），第 3.2 节的代码改两行就能指向本机——**同一套代码，云端本地随意切换**。

清醒的预期管理：本地 8B 模型的能力大约相当于两三年前的云端主力，写作和知识面明显弱于云端旗舰。它的定位是隐私场景、批量轻任务、学习实验，不是旗舰替代品。（Mac 生态另有 MLX 框架——Apple 官方的张量库，跑量化模型效率更高，折腾爱好者可探索 `mlx-lm`。）

## 7. 网络与账号的现实

国际厂商的服务在国内网络环境下不可直连，这是绕不开的现实约束。合规的路径包括：用国内模型（第 10 讲，能力已在同一梯队）、用有国内合规代理的企业服务、或在有合法国际网络的环境（如学校科研网络出口、海外访学）使用。请遵守所在网络的使用规定。好消息是：**本课程的全部实验都可用国内直连的 DeepSeek 完成**，工具链方法论与模型无关，换模型只是改一行 `base_url`。

## 本讲小结与安装清单

按需勾选（全装也就半小时）：

```bash
# 基础
brew install python@3.12 node git uv
# API 之路
mkdir myai && cd myai && python3.12 -m venv .venv
source .venv/bin/activate && pip install openai python-dotenv
echo "DEEPSEEK_API_KEY=你的key" > .env && echo ".env" >> .gitignore
# 编程智能体
npm install -g @anthropic-ai/claude-code
# 本地部署
brew install ollama && ollama run qwen3:8b
```

**动手**：跑通 3.2 的第一个 API 调用；如果对本地部署好奇，装 Ollama 跑一个 8B 模型，问它同一个问题，对比云端旗舰的差距——这个体感对第 10 讲的选型判断很有价值。

---

*下一讲开始进入"用 AI 干活"的方法论：先讲怎么用它学习——关键是让它当苏格拉底，而不是当答案贩子。*
