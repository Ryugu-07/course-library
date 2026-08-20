# 第 04 讲 · 潜空间与整机架构

> 前两讲把“扩散”数学讲完了，但一直把网络 $\epsilon_\theta$ 当黑盒、把图像假装成直接在像素上加噪。本讲拆开 ComfyUI 的整机：**表示/潜空间、文本编码与条件、去噪网络、VAE 输出**。模型家族可以换，层与线的职责不会凭空消失。

<figure class="plot" markdown="1">
![潜空间降维](assets/img/04-latent.svg)
<figcaption><span class="fig-id">图 4.1</span>潜扩散：不在像素上、而在压缩后的潜空间跑扩散。Stable Diffusion 的形状账本见下方互动剖面。</figcaption>
</figure>

## 1. 潜空间：扩散的工作台

### 1.1 像素扩散为什么贵

在 $512 \times 512 \times 3$ 的像素空间跑扩散，每步去噪都要处理全分辨率图像。Latent Diffusion 的办法是先用 VAE Encoder 把图像压成紧凑表示，在潜空间里加噪/去噪，再用 VAE Decoder 回到像素空间：

$$
x \in \mathbb{R}^{H \times W \times 3}
\xrightarrow{\text{VAE Encoder}}
z
\xrightarrow{\text{扩散或流匹配}}
z'
\xrightarrow{\text{VAE Decoder}}
x'
$$

对 Stable Diffusion 的典型 $f=8$ VAE，$H \times W \times 3$ 会变成 $(H/8) \times (W/8) \times 4$。这不是所有新模型的通用接口；FLUX/Qwen-Image 的 latent 布局必须跟着对应模型卡和官方工作流核验。

### 1.2 1024×1024 的形状账本

把每一步都写出来，就不会把“像素尺寸”和“潜张量尺寸”混为一谈：

| 账本项 | 形状 | 标量槽位 | 说明 |
|---|---:|---:|---|
| RGB 输入 | $1024 \times 1024 \times 3$ | $3,145,728$ | 人眼看到的像素 |
| 每轴压缩 8 倍 | $128 \times 128 \times 4$ | $65,536$ | Stable Diffusion VAE 示例 |
| 空间槽位变化 | $1024^2 \to 128^2$ | 降为 $1/64$ | 两个空间轴各除以 8 |
| 总标量槽位 | RGB → latent | 降为 $1/48$ | $3,145,728 / 65,536 = 48$ |

因此“空间缩小 8 倍”与“总标量槽位缩小 48 倍”是两件不同的事：通道数从 3 变成 4，不能只算面积。这个算术是 SD VAE 的形状示例，不应反推 FLUX/Qwen-Image 的通道数或显存峰值。

### 1.3 由此解释的 ComfyUI 现象

- **KSampler 的输入输出是 LATENT**（粉色线）；它全程在潜空间工作，从没见过最终 RGB 图。
- **VAE Decode** 是“显影”：潜空间 → 像素；**VAE Encode** 是图生图/重绘进入潜空间的入口。
- **Empty Latent Image 的尺寸填像素尺寸**，节点或模板负责把它映射到模型所需的 latent 网格；不要手填一个猜来的通道数。
- **VAE 是模型契约的一部分**：色彩、细节和数值稳定性都要随具体模型/精度测试，外置 VAE 也必须确认家族匹配。

## 2. 文本编码：提示词怎样变成条件

提示词通常经历 `tokenize → embedding/Transformer → conditioning`，输出一组供去噪网络使用的条件。ComfyUI 里常见的线型是：黄色 `CLIP` 表示编码器，橙色 `CONDITIONING` 表示已经编码的条件；节点名和编码器组合由模型家族决定。

- **SD1.5**：官方模型卡描述为固定的 CLIP ViT-L/14 文本编码器，非 pooled 文本表示经 cross-attention 进入 U-Net。
- **SDXL**：官方权重仓库暴露两个 text encoder；ComfyUI 的双编码器 loader 和模板负责把对应组件接起来。
- **FLUX.1**：官方模型卡说明它是 rectified-flow transformer；ComfyUI 工作流通常把模型、文本编码器和 VAE 作为需要配套核对的组件，确切 loader 以当前模板为准。
- **Qwen-Image**：ComfyUI 官方示例把 diffusion model、Qwen 文本编码器和 VAE 分开列出；这意味着“提示词能否被正确编码”首先是组件与节点配对问题，不是把任意 CLIP 塞进去就行。

条件不只有文字：参考图、姿态、边缘、深度、遮罩和多模态输入都可以在编码后汇入 conditioning 或模型专用输入。阅读工作流时先问“条件在哪生成、以什么类型传入”，再问提示词长短。

## 3. 去噪网络：U-Net 与 Diffusion Transformer

<figure class="diagram" markdown="1">
![去噪网络结构：U-Net（下采样-瓶颈-上采样 + skip）→ DiT，标出时间步/条件注入点。](assets/img/04-unet-dit.svg)
<figcaption><span class="fig-id">图 4.2</span>去噪网络的骨架可以从 U-Net 变为 Transformer；条件入口和 latent/VAE 契约仍要逐模型核验。</figcaption>
</figure>

### 3.1 U-Net：SD 系列的经典骨架

SD1.5/SDXL 的经典路径使用 U-Net：编码路径逐级下采样，瓶颈聚合上下文，解码路径恢复分辨率，同分辨率层之间用 skip connection 传回细节。时间步嵌入告诉网络当前噪声阶段，cross-attention 让空间特征读取文本条件。

### 3.2 DiT 与多流变体：把潜张量变成 token 序列

Diffusion Transformer（DiT）把潜空间切成 patch/token 序列，用 Transformer block 预测去噪或速度场。不同家族会采用双流、单流或其他多模态注意力组织；**MMDiT** 只是其中一种具体架构名，不是“所有 Transformer 去噪器”的同义词。FLUX 的具体 block 组织、Qwen-Image 的具体实现，以及某个社区微调版是否保留同一结构，都要回到模型卡或官方代码核验。

### 3.3 去噪目标也会变

传统 DDPM 路径学习噪声或等价参数化；FLUX 等模型采用 rectified flow/flow matching 一类的速度场目标。工程上不要把 SDXL 的 sampler、CFG、steps 直接复制给另一家族：先读官方模板的 loader、conditioning、采样器和默认值，再逐项做单变量实验。

## 4. 四个家族的架构剖面

下面的容器由 `tools/ecosystem-labs.js` 挂载。按钮可以切换 SD1.5、SDXL、FLUX、Qwen-Image；每次都同时看四层：文本/条件、denoiser、latent/VAE、完整 checkpoint 与分体 loader。交互中的“16GB”只是实测计划，不是通过标签。

<div data-comfy-lab="architecture"></div>

### 4.1 先看职责，不背参数量

| 家族 | 去噪层 | 条件层 | 常见资产形态 | 16GB 判定 |
|---|---|---|---|---|
| SD1.5 | U-Net | CLIP → CONDITIONING | 许多入门工作流使用完整 checkpoint | 作为低预算测试起点；仍需记录峰值与耗时 |
| SDXL | U-Net | 双 text encoder → CONDITIONING | 完整 checkpoint 与分体资产都可能遇到 | 以目标分辨率、精度和外挂组合实测 |
| FLUX | 多模态/双流与单流 Transformer 剖面；具体变体以来源为准 | 模型专用文本编码组合 | 官方/社区工作流常见分体 loader | 不能由 fp8 文件名推断本机体验，必须实测 |
| Qwen-Image | DiT-style diffusion model；具体变体以来源为准 | Qwen 文本编码器 → 模型专用 conditioning | 官方 ComfyUI 示例采用 diffusion model + text encoder + VAE | 不能把官方模板存在等同于 16GB 可运行 |

这张表只表达接口职责和核验方向，不写死随版本、精度或变体变化的参数量、速度和显存结论。

### 4.2 完整 checkpoint 与分体 loader

在 ComfyUI 的经典文生图教程里，`Load Checkpoint` 会从一个 checkpoint 取出 `MODEL`、`CLIP`、`VAE` 三条线。它解释了“整机文件”的便利，但不意味着所有模型都应合成一个文件：

```text
完整 checkpoint：CheckpointLoaderSimple
    ├─ MODEL ───────→ sampler
    ├─ CLIP ────────→ Text Encode ─→ CONDITIONING ─→ sampler
    └─ VAE ─────────→ VAE Encode/Decode

分体 loader：UNET/Model Loader + CLIP/DualCLIP Loader + VAE Loader
    └─ 文件、节点、精度和命名必须与同一模型家族的官方模板配套
```

FLUX/Qwen-Image 不能因为“都叫 diffusion model”就互换 loader。Qwen 的官方 ComfyUI 示例明确把文件放在 `diffusion_models/`、`text_encoders/`、`vae/`；加载成功只说明文件找到了，还要检查 conditioning 类型、latent shape 和 VAE 输出是否一致。

精度/量化是显存实验变量，不是质量或性能保证。每个候选至少记录：文件名与哈希、精度/量化、ComfyUI 与模板版本、分辨率、batch、LoRA/ControlNet、峰值显存、耗时和是否 OOM。

## 5. 一条完整流水线（SDXL 形状示例）

```text
提示词 ──双文本编码器──▶ 条件向量组 c ───────────────┐
                                                    ▼
随机种子 ──▶ 潜空间噪声 z_T ──▶ [U-Net 去噪 × N 步] ──▶ z_0
   (128×128×4：SD VAE 示例)       (CFG/采样器按模板)       │
                                                   VAE Decode ▼
                                                     1024×1024 RGB
```

读任何工作流时顺着粉色 `LATENT` 主线走，再分别追踪黄色 `CLIP`、橙色 `CONDITIONING` 和红色 `VAE`。这比从节点数量猜模型大小可靠得多。

### 5.1 16GB 的实测协议

“16GB 能不能跑”不是架构标签能回答的问题。请固定一个模板和一个输入，逐次只改一个变量，并把以下结果写入实验台账：

| 记录项 | 示例要求 |
|---|---|
| 环境 | GPU、空闲显存、ComfyUI/前端/模板版本 |
| 资产 | 模型文件名、来源、哈希、精度/量化、VAE 与文本编码器 |
| 工作流 | loader、分辨率、batch、steps、LoRA/ControlNet、offload 设置 |
| 结果 | 峰值显存、耗时、输出是否可用、是否 OOM/CPU offload |

所以本讲只给出“需实测”的边界，不对 16GB 的速度、显存峰值或成功率作保证。

## 本讲小结

| 概念 | 一句话 |
|---|---|
| 潜空间 | 扩散工作的表示空间；1024 RGB 到 $128×128×4$ 是 SD VAE 的形状示例 |
| 文本编码器 | 把提示词变成模型约定的 conditioning，不能跨家族随便替换 |
| U-Net / Diffusion Transformer | 去噪骨架的不同谱系；双流、单流、MMDiT 等名字必须由具体模型来源确认 |
| Checkpoint / 分体 | 一个节点拆三件套，或按官方模板分别装载；两者都必须满足同家族契约 |
| 16GB | 需要固定变量实测，不从参数名、模板存在或精度文件名推断结果 |

## 来源与核验入口

- [ComfyUI 文生图与 checkpoint 说明](https://docs.comfy.org/tutorials/basic/text-to-image)
- [ComfyUI 官方模板与缺模型检查](https://docs.comfy.org/interface/features/template)
- [Stable Diffusion v1.5 官方模型卡](https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5)
- [Stable Diffusion XL 官方权重仓库](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0)
- [FLUX.1-dev 官方模型卡](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- [ComfyUI 官方 Qwen-Image 示例](https://github.com/comfyanonymous/ComfyUI_examples/tree/master/qwen_image)

来源能证明的只是各自页面写明的组件、接口、许可或模板行为；模型开放、模板存在、第三方节点安全和 16GB 可用性仍是四个不同问题。

---

*三大件的职责已经对上了。下一步是把外挂件接进这些接口：LoRA 改哪条权重、ControlNet 怎样注入结构、IP-Adapter 如何引入参考图。*
