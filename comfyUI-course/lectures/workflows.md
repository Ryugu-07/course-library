# 工作流实验室（wf01–wf07）

> 课程配套 7 个分级工作流，每个都有可拖入画布的 UI JSON 和供 `/prompt` 使用的 API JSON。网页下载资产与仓库源文件来自同一次构建；2026-08-20 重新核对了 14 个 JSON 的可解析性、节点引用与 API 正向提示词节点。曾在特定机器跑通不等于你当前模型、节点和运行时仍兼容，运行前请完成下面的依赖账本。

## 加载方式

ComfyUI 界面 → 菜单 Workflow → Open（或直接把 UI `.json` 文件拖进画布）。iPad 阅读时可先在下表下载到“文件”，回到 Windows 后再放进 `E:\AI\Workflows\course\`；API JSON 不用于直接展示画布，而是交给第 15 讲的客户端脚本。

文件中的模型名来自课程编写时的环境快照或显式占位符，不代表你当前机器仍有同名、同哈希资产。加载后先按下面的依赖账本核对；带“换成你的…”字样的下拉框（如 wf05 的 LoRA、wf06 的条件图）必须换成经过家族、来源和许可检查的实际文件。

## 清单与练习

| 下载 | 配套讲次 | 内容 | 前置 |
|---|---|---|---|
| [wf01 UI](assets/workflows/wf01_sd15_txt2img.json) · [API](assets/workflows/api/wf01_sd15_txt2img_api.json) | 07 | SD1.5 文生图 512：最短的 checkpoint→conditioning→sample→decode 链 | 对应 checkpoint |
| [wf02 UI](assets/workflows/wf02_sdxl_txt2img.json) · [API](assets/workflows/api/wf02_sdxl_txt2img_api.json) | 07/08 | SDXL 文生图 1024：第 07 讲逐节点拆解的主骨架 | SDXL base |
| [wf03 UI](assets/workflows/wf03_sdxl_img2img.json) · [API](assets/workflows/api/wf03_sdxl_img2img_api.json) | 09 | 图生图：输入图经 VAE Encode，`denoise` 控制偏离程度 | SDXL base + 输入图 |
| [wf04 UI](assets/workflows/wf04_sdxl_inpaint.json) · [API](assets/workflows/api/wf04_sdxl_inpaint_api.json) | 09 | 局部重绘路线 A：图像、mask 与 latent 合流 | SDXL base + 输入图/mask |
| [wf05 UI](assets/workflows/wf05_sdxl_lora.json) · [API](assets/workflows/api/wf05_sdxl_lora_api.json) | 11 | LoRA 同时修改 MODEL/CLIP 路径；占位文件必须换成实际资产 | SDXL base + 兼容 LoRA |
| [wf06 UI](assets/workflows/wf06_sdxl_controlnet.json) · [API](assets/workflows/api/wf06_sdxl_controlnet_api.json) | 12 | ControlNet 条件支路；输入预处理和模型家族必须匹配 | SDXL base + ControlNet + 条件图 |
| [wf07 UI](assets/workflows/wf07_sdxl_ipadapter.json) · [API](assets/workflows/api/wf07_sdxl_ipadapter_api.json) | 13 | IP-Adapter 参考图支路；包含社区节点占位 | SDXL base + IP-Adapter 模型/节点包 |

## 运行前的五层依赖账本

不要把“JSON 能打开”当作“工作流可复现”。每次运行至少锁定：

| 层 | 要记录的字段 | 失败信号 |
|---|---|---|
| ComfyUI core/frontend | 稳定版本或 commit、安装形态 | 节点 schema、界面或 API 行为改变 |
| custom nodes | Registry 唯一名、精确版本、启用状态 | 红节点、输入输出端口改变、导入错误 |
| models | 家族、文件名、哈希、精度/量化、许可 | loader 找不到、shape/架构不匹配、输出异常 |
| workflow | UI/API JSON 哈希、模板版本、参数差异 | 打开的是旧图、脚本改错节点、缺连接 |
| run/output | seed、输入资产哈希、尺寸、采样、日志、输出 | 能出图但无法解释哪一层发生变化 |

Registry 的“verified”标记与语义化版本能降低风险并帮助锁定版本，但不是无限期安全保证；自定义节点仍是会在本机执行的代码。官方模板会检查缺失模型并提供配套路径，适合验证一等支持；课程 JSON 则用于学习最小骨架和做离线回归，两者证据角色不同。

## 建议玩法

1. **按讲次顺序解锁**：每讲的"上机任务"指定了用哪个 wf、做什么实验——工作流是教具，任务才是练习；
2. **改完另存**：调出自己满意的版本后 Save As 存到 `E:\AI\Workflows` 你自己的目录（别覆盖 course/ 原件；它们是结构与参数的课程基线，只有完成当前依赖账本和冒烟测试后，才可称为你机器上的可运行基准）；
3. **组合进阶**：学完 11–13 讲后，把 wf05 的 LoRA 段、wf06 的 ControlNet 段、wf07 的 IPAdapter 段**拼进同一个工作流**——三个外挂各走各的通道（第 05/13 讲），拼装本身就是最好的复习；
4. **对照 API 版**：`workflows/api/` 下是每个工作流的 API 格式（第 15 讲第 3 节）——将来写自动化脚本时直接用它们当模板。

## 拓展篇（视频/音乐/3D）为什么没有 wf 文件

拓展篇实战（第 18/20/21/22 讲）优先从 **ComfyUI 官方 Template Library**（菜单 → Workflow → Browse Templates 的 Video / Audio / 3D 分区）进入：模板由官方库维护，并能提示缺失模型；它通常比课程复制一份静态 JSON 更接近当前支持路径，但仍要记录 ComfyUI、模板和模型版本。H3 尤其应使用 T2V/I2V/R2V 的配套模板，因为 `fl2va` 与 `ref2va` 使用不同权重。各讲内有对应模板名与参数指引。

## 排障速记

- 节点红色 → 缺扩展（Manager → Install Missing，第 15 讲）；
- 下拉框值是红字/找不到 → 该模型文件不在对应目录（第 06 讲第 4 节）；
- 跑完没图 → 看 KSampler 是否报错（悬停红色边框）、`E:\AI\Logs` 最新日志；
- 其余按第 15 讲排障总表。
