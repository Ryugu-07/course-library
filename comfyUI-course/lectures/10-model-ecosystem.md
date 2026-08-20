# 第 10 讲 · 模型生态：兼容性与核验清单

> 模型生态真正缺的不是“一个排行榜”，而是一套能在版本变化后继续工作的核验方法。本讲用模型家族、任务、条件接口、loader、证据和许可把选择拆开；具体名称只是 **2026-08-20 快照**，不是永久推荐。

!!! warning "快照与边界"
    2026-08-20 的模型、模板、节点包、许可证和文件名都可能过期。官方模板存在不等于模型开放，模型开放不等于你的 16GB 能跑，16GB 跑通也不等于可以商用。每次换版本、变体或精度，都重新核验。

## 1. 证据先于下载

选择一个模型时，先把“它是什么”和“我怎样证明它能接入”分开记录：

| 证据层 | 能证明什么 | 不能证明什么 |
|---|---|---|
| **ComfyUI 官方 Workflow Templates** | 当前 ComfyUI 支持的工作流入口、节点连法、所需文件名；加载模板时会检查缺失模型 | 你的显存一定够、具体变体一定有同一许可证、第三方节点安全 |
| 官方模型卡/权重仓库 | 架构描述、文件组成、使用条件、许可证与来源 | 本机 ComfyUI 版本、模板版本或 16GB 峰值 |
| Comfy Registry / Manager | 节点包的版本、安装和启用层；可辅助定位缺失节点 | 模型质量、模型与 loader 的兼容性、任意第三方代码的安全保证 |
| 社区模型页 | 候选发现、示例图、触发词、社区工作流线索 | 官方支持、许可证清晰、当前版本仍可复现 |

**官方模板库是一等支持证据之一**，因为它把工作流、模型链接和缺模型检查放在同一个入口；它不是“质量排名”。Registry/Manager 是版本/安装层，不是模型兼容性证明。第三方节点仍要审查来源、精确版本、安装脚本和会执行的代码。

官方入口：[Templates](https://docs.comfy.org/interface/features/template)、[ComfyUI workflow templates 仓库](https://github.com/Comfy-Org/workflow_templates)、[ComfyUI Registry](https://registry.comfy.org/)。

## 2. 长期有效的模型兼容矩阵

矩阵只描述接口契约；“控制需求”表示需要继续寻找匹配的 adapter/ControlNet/模型专用节点，不表示它们天然互换。

| 家族 | 适合先核对的任务 | 去噪/条件骨架 | 常见 loader 形态 | 控制兼容性要查 | 证据与许可 |
|---|---|---|---|---|---|
| SD1.5 | txt2img、img2img、基础结构控制 | U-Net；CLIP → CONDITIONING；SD VAE 形状契约 | `CheckpointLoaderSimple` 常见，也可能拆件 | adapter/ControlNet 必须标明 SD1.5；不要只看文件名 | 官方文生图教程 + 具体模型卡/许可证 |
| SDXL | txt2img、img2img、SDXL 生态中的控制与 LoRA | U-Net；双 text encoder → CONDITIONING；SDXL VAE 契约 | 完整 checkpoint 或与模板配套的分体 loader | LoRA、ControlNet、IP-Adapter 要确认 SDXL 变体 | Stability 官方仓库 + 当前模板 + 具体微调版许可 |
| FLUX | 长提示词、图像生成/编辑等模型专用工作流 | 多模态 Diffusion Transformer；文本编码组合与 flow 采样按变体 | 常见分体 model/text encoder/VAE loader；以模板为准 | FLUX 专用 adapter、编辑模型和节点要逐项核验 | [官方模型卡](https://huggingface.co/black-forest-labs/FLUX.1-dev) + 当前模板 + FLUX 变体许可 |
| Qwen-Image | 文字渲染、图像生成/编辑等官方路线 | DiT-style diffusion model；Qwen 文本编码器与模型专用 conditioning | 官方示例为 `diffusion_models/` + `text_encoders/` + `vae/` | Qwen-Image 专用 control/edit/LoRA 与模板要配套 | [官方 Qwen-Image 示例](https://github.com/comfyanonymous/ComfyUI_examples/tree/master/qwen_image) + [模型卡](https://huggingface.co/Qwen/Qwen-Image) + 具体许可证 |

矩阵不输出“最好”或“第一名”。一个候选只有在任务、家族、条件类型、loader、模板、文件、精度、依赖和许可证都对上后，才值得进入本机测试。

## 3. 互动选择器：先生成核验队列

下面的选择器按五个维度筛选：任务、模型家族、显存预算、控制需求、许可/来源证据。结果是**需要核验的清单，不是虚构排名**；“16GB”选项只会把候选放进实测队列，不会替你宣称能运行。

<div data-comfy-lab="model-selector"></div>

## 4. 每个候选都要填的核验卡

把模型页、模板页和本机实验放进同一条记录。文件名可以变，字段不要省：

```text
model:            具体仓库名 / 变体名
family:           SD1.5 | SDXL | FLUX | Qwen-Image | 其他
task:             txt2img / img2img-edit / structure-control / ...
source:           官方模型卡或仓库 URL；社区页只作发现入口
license:          具体版本的 LICENSE / model card 原文位置
template:         当前 ComfyUI 官方模板名、版本或截图记录
loader:           CheckpointLoader / UNET-Model + CLIP + VAE / 专用节点
model_files:      文件名、目录、哈希、是否缺模型
precision:        fp32 / fp16 / bf16 / fp8 / 量化名称；不要只写“轻量”
dependencies:     ComfyUI 版本、模板包、Registry/Manager 节点包及精确版本
control:          文本 / 参考图 / ControlNet / LoRA / 模型专用控制
vram_test:        分辨率、batch、峰值、耗时、offload、OOM 与输出检查
verified_at:      YYYY-MM-DD
```

### 4.1 Loader 与模板的核对顺序

1. 从当前官方模板或官方教程开始，确认节点类型和模型目录；模板弹出的缺模型列表只说明“文件未找到”，不说明许可证或显存。
2. 对照模型卡核对 denoiser、文本编码器、VAE、精度和许可证；不要用同名文件替换不同家族组件。
3. 只有在核心节点跑通后，才加入 LoRA、ControlNet、IP-Adapter 或第三方节点；每加一层都固定 seed 并记录显存变化。
4. Registry/Manager 只负责安装/版本层的操作；若工作流出现红节点，先审查该节点包，再决定是否安装。

### 4.2 16GB 实测，而不是预算徽章

“显存预算”筛选的意义是安排实验：

| 预算档 | 先记录 | 不得推断 |
|---|---|---|
| 8GB 或更低 | 低分辨率、CPU offload、batch、VAE 峰值 | 不得推断所有低精度文件都能跑 |
| 16GB | 精度/量化、目标分辨率、控制件数量、峰值与耗时 | 不得推断“官方模板存在”就是通过 |
| 24GB 以上/外部算力 | 模型加载、并发、长提示词和多图控制 | 不得推断换回 16GB 仍有同样边界 |
| 未知 | 先查官方来源，再做最小模板实验 | 不得用社区截图替代本机证据 |

一次跑通只回答“这组变量曾经通过”；要判断是否可用，还要重复并记录稳定性、输出质量、依赖版本和许可证。

## 5. 社区模型页的安全读法

社区页依然有用，但它适合作为候选发现，不应承担官方证明的职责。至少核对：

- Base model/family 是否明确，LoRA、ControlNet 和 checkpoint 是否属于同一接口家族；
- 示例图是否给出完整参数，能否迁移到当前模板；
- 文件格式、版本、哈希、触发词和依赖是否写清；
- LICENSE、训练数据/人物权利、可否商用是否来自具体版本，而不是评论区一句话；
- 下载后是否只在隔离、可回滚的目录里加载；模型文件和第三方节点都不要盲信。

`safetensors` 是文件格式选择，不等于许可证；“公开下载”也不等于“开放许可”。

## 上机任务

1. 在官方 Templates 中分别搜索 SD1.5、SDXL、FLUX、Qwen-Image 的当前入口，记录模板版本和缺模型清单。
2. 从四个家族各挑一个候选，填写上面的核验卡；先不比较画质排名，只比较证据是否完整。
3. 在固定 seed、固定输入和固定分辨率下，逐个记录 loader、精度、峰值显存、耗时、OOM 与输出检查。
4. 对每个第三方节点包记录 Registry/GitHub 来源、精确版本、许可和安全审查结果；没有记录就不加入工作流。

## 来源与快照说明

本页的动态事实以 **2026-08-20** 为记录日；产品名单、模板目录、Registry 版本和社区热门程度会变化。更新页面时优先重新读取官方 Templates、官方模型卡和具体许可证，再修改矩阵；不要仅把“最新”换成另一个名称。

---

*选型完成的标志不是下载了一堆文件，而是每个文件都能回答：它属于哪个家族、由哪个 loader 读取、由哪份模板证明、在什么变量下实测、许可证来自哪里。*
