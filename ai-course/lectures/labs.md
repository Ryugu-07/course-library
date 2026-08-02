# 实验总览（lab01–lab10）

> 讲义负责"懂"，实验负责"会"。十个实验按课程顺序排列：lab01–07 纯本地运行（无需联网、无需 API key），lab08–10 需要 DeepSeek API key（总花费不到一元）。所有实验源代码都有密集的教学注释——**代码本身就是讲义的一部分**，建议逐块读懂再改参数玩。

## 运行方式

```bash
cd ~/ai-course
.venv/bin/python labs/lab01_find_function.py     # 以 lab01 为例
```

图表会弹窗显示，同时自动保存到 `labs/output/`。lab08–10 首次运行前：

```bash
cp labs/.env.example labs/.env
# 编辑 labs/.env，填入 platform.deepseek.com 创建的 API key
```

## 实验清单

| 实验 | 配套讲次 | 内容 | 依赖 |
|---|---|---|---|
| lab01 拟合与过拟合 | 01 | 多项式拟合亲手制造欠/过拟合，画出 U 形曲线，岭正则救场 | 本地 |
| lab02 感知机与 SVM | 02 | 从零实现感知机看收敛；SVM 线性/RBF 核对比、圈支持向量、调 C | 本地 |
| lab03 决策树与贝叶斯 | 03 | 手算信息增益；树深过拟合可视化；从零写垃圾短信分类器（平滑对照） | 本地 |
| lab04 反向传播 * | 04 | 纯 numpy 实现四个方程解 XOR + 数值梯度检查（全课程最值得手写） | 本地 |
| lab05 CNN 识数字 | 05 | M4/MPS 上训小 CNN，对比全连接的参数量与准确率，可视化卷积核 | 本地* |
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

- 虚拟环境在 `~/ai-course/.venv`（Python 3.12），依赖清单见 `labs/requirements.txt`；
- 出现 `ModuleNotFoundError` 说明用了系统 Python，务必用 `.venv/bin/python` 运行；
- lab06/07 用 MPS（Apple GPU）加速，单个实验 2–10 分钟；嫌慢可减小 `steps`。
