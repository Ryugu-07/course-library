# AI 课程：从找函数到智能体

一套自学课程：上篇 9 讲重演 AI 发展史（模式识别 → SVM → 神经网络 → CNN → Transformer → Scaling Laws → LLM 工程 → 智能体/MCP/Skills，含全量数学推导），下篇 9 讲应用实操（选型、安装、学习科研方法、代码/文生图/PPT/论文四大实战），配 10 个可运行实验。

## 快速开始

```bash
# 1. 浏览课程(二选一)
open site/index.html                          # 直接双击打开
python3 -m http.server -d site 8080           # 或本地服务 → http://localhost:8080

# 2. 跑实验
.venv/bin/python labs/lab01_find_function.py

# 3. lab08-10 需要 DeepSeek API key
cp labs/.env.example labs/.env    # 然后编辑填入 key
```

## 目录结构

```
ai-course/
├── lectures/          # 讲义源文件(markdown, 唯一内容源)
├── site/              # 生成的课程网站(KaTeX 本地打包, 无外网依赖)
├── labs/              # 10 个可运行实验 + requirements.txt
│   └── output/        # 实验产出的图表
├── build_site.py      # 站点生成器: 改完讲义跑一遍即可
└── .venv/             # Python 3.12 环境(numpy/sklearn/torch/openai)
```

## 修改讲义后重建站点

```bash
.venv/bin/python build_site.py
```

新增讲次：在 `lectures/` 加 markdown 文件，并在 `build_site.py` 顶部的 `COURSE` 列表登记。
