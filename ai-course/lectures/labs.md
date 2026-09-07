# 实验总览（lab01–lab10）

> 讲义负责“懂”，实验负责“会”。十个实验按课程顺序排列：lab01–07 在本机计算，无需 API key；其中 lab05 会尝试联网下载 MNIST。lab08–10 需要联网和 DeepSeek API key，费用取决于实际调用量与服务当时的价格。所有实验源代码都有教学注释，建议逐块读懂再改参数。

## 首次运行与 CPU 最小检查

先按[课程导览的环境准备](index.html#environment)克隆公开仓库并安装 `labs/requirements.txt`。以下命令均在仓库的 `ai-course` 目录运行。

先运行 lab04：它只用 numpy 训练四个 XOR 样本，同时比较解析梯度与数值梯度，不需要 GPU、数据下载或 API。这是检查计算与画图流程能否跑通的最小起点。

```powershell
# Windows PowerShell
.\.venv\Scripts\python.exe labs/lab04_backprop_xor.py
```

```bash
# macOS / Linux
.venv/bin/python labs/lab04_backprop_xor.py
```

检查终端是否输出梯度相对误差、训练损失和四个点的预测，并查看 `labs/output/lab04_xor.png`。图表先保存再弹窗，关闭图窗后程序继续。梯度检查只检验这一组数值与实现的一致性，不能代替反向传播的推导。

无桌面环境时，在运行命令前设置 Matplotlib 的 `Agg` 后端，仅保存图片：PowerShell 执行 `$env:MPLBACKEND = "Agg"`；macOS / Linux 执行 `export MPLBACKEND=Agg`。恢复弹窗可分别执行 `Remove-Item Env:MPLBACKEND` 或 `unset MPLBACKEND`。

## lab08–10 的 API 配置

这三个实验使用 `labs/llm_utils.py` 中的 DeepSeek 接口与模型配置，不是离线实验。首次运行前复制配置模板：

```powershell
# Windows PowerShell
Copy-Item labs/.env.example labs/.env
```

```bash
# macOS / Linux
cp labs/.env.example labs/.env
```

编辑 `labs/.env`，将 `DEEPSEEK_API_KEY` 换成自己的有效 key；已有配置时无需再次复制。不要把该文件提交到仓库。随后用上面相同的 Python 路径运行相应脚本。

- **lab08** 调用文本生成接口，比较提示词与采样设置。
- **lab09** 除 API 外，还会在本机创建示例账单文件并执行代码中定义的计算、读文件工具。
- **lab10** 在本机生成销售 CSV，再执行模型生成的 Python 分析代码；当前实现没有沙箱隔离。应在不含私人文件和额外凭据的隔离实验环境中运行，并先读懂 `run_python` 的实现。

## 实验清单

| 实验 | 配套讲次 | 内容 | 依赖 |
|---|---|---|---|
| lab01 拟合与过拟合 | 01 | 多项式拟合亲手制造欠/过拟合，画出 U 形曲线，岭正则救场 | 本地 |
| lab02 感知机与 SVM | 02 | 从零实现感知机看收敛；SVM 线性/RBF 核对比、圈支持向量、调 C | 本地 |
| lab03 决策树与贝叶斯 | 03 | 手算信息增益；树深过拟合可视化；从零写垃圾短信分类器（平滑对照） | 本地 |
| lab04 反向传播 * | 04 | 纯 numpy 实现四个方程解 XOR + 数值梯度检查（全课程最值得手写） | 本地 |
| lab05 CNN 识数字 | 05 | 在 CPU 或可用的 MPS 上训小 CNN，对比全连接的参数量与准确率，可视化卷积核 | 本地* |
| lab06 注意力与 miniGPT | 06 | numpy 注意力矩阵可视化；用本课讲义当语料训一个 char-GPT | 本地 |
| lab07 Scaling Law | 07 | 训一族不同宽度的 miniGPT，log-log 拟合出你自己的幂律指数 | 本地 |
| lab08 提示词实验 | 08 | 直答 vs 思维链准确率、温度稳定性、自洽性投票，三组对照实验 | API |
| lab09 手搓智能体 * | 09 | 不用框架实现完整 agent loop：工具注册→模型决策→执行→回填 | API |
| lab10 分析智能体 | 15 | 给模型一个 CSV 和 run_python 工具，看它自主探索出数据里埋的规律 | API |

*lab05 优先下载 MNIST（约 12MB），网络不通自动退回离线的 sklearn digits 数据集。

## 建议玩法

1. **先跑通，再读码，再改坏**：每个实验末尾都有"动手改改"清单——把参数改到极端、观察怎么坏，比看十遍正确结果学得多；
2. **对照讲义公式读代码**：lab04 的四个方程、lab06 的注意力实现，都是讲义公式的逐行直译，代码里标了对应小节；
3. **(*) 两个必做**：lab04（反向传播 + 梯度检查）与 lab09（手搓 agent loop）——前者是理解深度学习的地基，后者是祛魅"智能体"的最短路径。

## 环境备忘

- 虚拟环境由你首次运行时创建于仓库的 `ai-course/.venv`，依赖清单见 `labs/requirements.txt`；
- 出现 `ModuleNotFoundError` 时，先确认使用了本页所示的虚拟环境 Python，再用同一个 Python 执行 `-m pip install -r labs/requirements.txt`；这类错误也可能来自依赖尚未成功安装；
- lab05–07 自动选择 MPS（可用时）或 CPU，当前代码不会自动选择 CUDA。默认训练耗时取决于硬件；lab06 可在源码调用处减小 `train_minigpt` 的 `steps`、`d` 与 `n_layer`（`d` 须能被 4 整除）；lab07 可减小 `STEPS`。它们没有对应的命令行参数，短运行只检查流程，不能据此判断生成质量或缩放规律。
