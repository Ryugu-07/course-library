# 从噪声到图像：生图模型原理与 ComfyUI 实战

《从找函数到智能体》的姊妹课程。上篇 5 讲推透扩散模型（DDPM ELBO / 采样器 ODE / SD 架构 / LoRA·ControlNet·IP-Adapter 数学），下篇 10 讲锚定 Win 机器 `E:\AI` 的真实 ComfyUI 安装实战，配 7 个分级工作流 JSON（已部署到 `E:\AI\Workflows\course\`）。

## 快速开始

```bash
# 浏览课程(二选一)
open site/index.html
python3 -m http.server -d site 8081

# 修改讲义后重建(复用 ai-course 的构建环境)
~/ai-course/.venv/bin/python build_site.py

# 重新生成工作流 JSON(改 tools/gen_workflows.py 后)
python3 tools/gen_workflows.py
```

## 目录结构

```
comfy-course/
├── lectures/        # 讲义源(markdown), 新增讲次要在 build_site.py 的 COURSE 登记
├── site/            # 生成的课程站(KaTeX 本地打包, 零外网依赖)
├── workflows/       # 7 个工作流: UI 格式(拖进画布) + api/ 下 API 格式(编程调用)
└── tools/           # 生成器与主题
```

Win 侧对应资产：ComfyUI 在 `E:\AI\ComfyUI_windows_portable`（:8188），工作流包在 `E:\AI\Workflows\course\`。
