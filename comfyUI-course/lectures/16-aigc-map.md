# 第 16 讲 · AIGC 全景地图：四问拆解新模型

> 模型名字每月翻新，产品页面和模板目录也会移动；但一个生成系统总能按四问拆开：**representation、generation rule、conditioning、decoder/output**。本讲给你一张长期有效的地图，再给一套维护新模型的记录格式。表里的产品名只是索引，名单会过期。

!!! warning "时间边界"
    本页的产品/工具示例以 2026-08-20 为快照，不能当作当前排行榜或永久兼容名单。每次遇到新模型，都重新确认官方来源、ComfyUI 模板、loader、许可证和本机实测；开放权重、模板存在、第三方节点安全和 16GB 可运行互不等价。

<figure class="diagram" markdown="1">
![AIGC 全景地图：文/图/视频/音频/3D 五大模态 + 四问框架。](assets/img/16-aigc-map.svg)
<figcaption><span class="fig-id">图 16.1</span>不要从品牌名猜系统：先定位表示，再确认生成规则、条件入口和最终解码/输出。</figcaption>
</figure>

## 1. 四问框架：新模型先归位

### Q1 · Representation：模型在什么表示上工作？

原始数据往往太大或太冗余，系统会先选择一种表示：

- 图像常见连续 2D latent；Stable Diffusion 的 VAE 示例把 RGB 映射到更小的空间。
- 视频常见带时间轴的 3D 时空 latent；空间压缩比、时间压缩比和通道数要看具体 VAE。
- 文本、语音和音乐常见离散 token、codec token 或连续声学表示；同一产品也可能混用多种表示。
- 3D 可能使用多视图、点/体素、隐式场、mesh 或它们的中间 latent。

表示的 shape、时间轴和数值范围是第一层兼容性契约。看到一个新 loader，先问它读的张量形状是什么，不要只看节点名字。

### Q2 · Generation rule：它怎样生成？

| 规则 | 核心动作 | 常见优点 | 需要核验的接口 |
|---|---|---|---|
| 自回归（AR） | 逐 token 预测下一个 token | 长序列和流式输出自然 | tokenization、上下文长度、停止规则 |
| 扩散 | 从噪声逐步去噪 | 连续空间细节和多种控制 | scheduler、sampler、denoise、condition 类型 |
| 流匹配 | 学习连续路径上的速度场 | 与数值积分器共同决定采样路径 | time/sigma 参数化、guidance、solver |
| 混合 | AR 搭骨架，再用扩散/流补细节 | 兼顾结构与细节 | 两阶段之间的表示和传输格式 |

“用了 Transformer”不等于“就是自回归”；“有 latent”也不等于“就是扩散”。规则要从模型卡、官方代码或模板的执行图确认。

### Q3 · Conditioning：它接受什么条件？

条件可能是文字、参考图、首尾帧、姿态/边缘/深度、音频、布局、mask、相机轨迹或多模态上下文。把条件分成“编码器做什么”和“去噪/解码器在哪消费”两步：

```text
原始条件 → tokenizer / encoder / control preprocessor
         → CONDITIONING 或模型专用输入
         → generation rule 在指定层注入
```

同名的“ControlNet”“LoRA”“参考图”并不保证跨模型家族兼容；必须核对基座、权重格式、节点、模板和许可证。

### Q4 · Decoder/output：它怎样回到用户能消费的结果？

图像常由 VAE Decoder 回到 RGB；音频可能经过 neural codec/vocoder 回到波形；3D 需要 mesh/点云/材质提取；视频要把时空 latent 解成帧并写入容器。输出层还可能接放大、插帧、修复、声画封装等后处理。输出质量问题不一定来自生成规则，也可能来自 decoder 或后处理。

<div data-comfy-lab="aigc-map"></div>

## 2. 用四问填一张地图

下面的表不是“哪个产品最好”，而是用四问把问题拆成可验证的工作流。产品名只作 2026-08-20 快照索引；新版本出现后应优先查官方模板和模型卡。

| 模态 | Representation | Generation rule | Conditioning | Decoder/output | 示例索引（会过期） |
|---|---|---|---|---|---|
| 文本 | BPE/离散 token | AR 或混合 | system/user/context、工具结果 | token stream → 文本 | Qwen、DeepSeek 等；以当前模型卡为准 |
| 图像 | 2D 连续 latent 或 patch/token | 扩散/流匹配，也有 AR 路线 | 文本、参考图、结构、mask | VAE/专用 decoder → RGB | SD1.5、SDXL、FLUX、Qwen-Image |
| 视频 | 3D 时空 latent 或帧/patch token | 时空扩散/流匹配/混合 | 文本、首尾帧、参考视频、相机/姿态、音频 | 视频 decoder → 帧/容器 | Wan、HunyuanVideo、LTX 等；模板与文件需复核 |
| 语音 | codec token、mel 或连续声学 latent | AR-codec、扩散/流匹配或混合 | 文本、说话人/参考音频、韵律 | vocoder/codec decoder → 波形 | GPT-SoVITS、F5-TTS、CosyVoice 等；许可需复核 |
| 音乐 | codec token 或音频 latent | AR、扩散 DiT 或混合 | tags、歌词、旋律、参考音频、时间段 | audio decoder → WAV/音频轨 | ACE-Step、Stable Audio Open 等；版本需复核 |
| 3D | 多视图、隐式场、点/体素或 mesh latent | 扩散、重建或混合 | 单图、多视图、文本、相机/姿态 | mesh/材质/纹理提取 → GLB 等 | Hunyuan3D、TRELLIS 等；输出格式需复核 |
| 数字人 | 视频 latent + 关键点/音频/身份表示 | 混合 | 人脸/身份、动作视频、音频、文本 | 视频/音频 decoder → 可播放媒体 | LivePortrait 等；输入权利与节点依赖需复核 |

“开源本地可跑”不是一列，因为它同时依赖硬件、精度、版本、节点、模型文件和许可。把这些变量分别写进维护条目，才有可复现的判断。

## 3. 新模型维护条目：让地图可以更新

每发现一个新模型，先建立条目再写进正文或工作流。`last_verified` 是证据的日期，不是模型发布日期；`source` 要指向一手页面；`evidence_level` 不能用“听说”；`compatibility` 要写清楚缺什么证据。

```yaml
- model: 待核验的新模型或具体变体
  last_verified: 2026-08-20
  source: https://example.com/official-model-card-or-repository
  evidence_level: official-template + official-model-card
  representation: continuous-latent | discrete-token | video-latent | geometry | mixed
  generation_rule: autoregressive | diffusion | flow-matching | hybrid
  conditioning: text | image | structure | audio | multimodal | model-specific
  decoder_output: vae-rgb | vocoder-audio | video-frames | mesh | other
  compatibility:
    comfyui: 版本/前端/模板包；未知就写 unknown
    loader: loader 名称、输入输出类型、完整或分体
    assets: 文件名、目录、精度/量化、哈希、缺失项
    control: 适配的 LoRA/ControlNet/参考输入；未知就写 unknown
    dependencies: Registry/Manager/custom nodes 及精确版本
    license: 具体 LICENSE/model card 位置
    vram: local-test-required；写入分辨率、峰值、耗时与 OOM 后才能下结论
```

建议的证据等级从强到弱：

1. 官方模板 + 官方模型卡/权重仓库 + 具体许可证 + 本机最小工作流测试；
2. 官方模型卡/权重仓库 + 具体许可证，模板或本机兼容性仍待核验；
3. 官方代码/官方仓库但缺少当前模板或许可证细节；
4. 社区页面或截图，只能作为候选发现，不能单独作为兼容结论。

ComfyUI 官方 Templates 是支持证据之一：它可以提示缺模型并展示当前节点路线，但不能替你完成许可审查、第三方代码审查或 16GB 压力测试。Registry/Manager 解决的是安装和版本层；第三方节点仍按任意本地代码审查。

## 4. 你的两台机器：按证据路由任务

| 路由 | 适合先做的事 | 必须记录 |
|---|---|---|
| Win 4060 Ti 16GB | ComfyUI 图像/视频/音频/3D 的最小模板实验 | 目标分辨率、精度、控制件、峰值显存、耗时、OOM、输出检查 |
| Mac M4 24GB 统一内存 | 脚本、预处理、素材整理和轻量模型试验 | 后端、内存压力、版本、与 CUDA 工作流的差异 |

不要把“能在 Mac 载入”“能在 Win 16GB 出一张”“能批量稳定运行”混成同一个状态。每个状态都应有自己的实测证据。

## 5. 拓展篇路线图

- **17–18 视频**：从时空表示、视频扩散到官方模板与 16GB 实测协议；
- **19 语音**：从 codec/token 表示到声音克隆的条件、vocoder 与权利边界；
- **20 音乐与音效**：比较 AR、扩散和音频 decoder 的工作流差异；
- **21 3D、数字人与流水线**：把图像、视频、声音和 mesh 的四问重新串起来；
- **22 MiniMax H3**：把图像/视频/音频参考按职责送入多模态上下文，仍按四问记录 loader、输出和许可。

## 来源与更新纪律

- [ComfyUI 官方 Workflow Templates](https://docs.comfy.org/interface/features/template)
- [ComfyUI 官方模型概念与目录](https://docs.comfy.org/basic-concepts/models)
- [ComfyUI 官方 Qwen-Image 示例](https://github.com/comfyanonymous/ComfyUI_examples/tree/master/qwen_image)
- [FLUX.1-dev 官方模型卡](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- [Qwen-Image 官方模型卡](https://huggingface.co/Qwen/Qwen-Image)

下一轮更新本页时，先更新 `last_verified/source/evidence_level/compatibility`，再决定是否保留产品名称。不要用新的产品名单掩盖旧证据；产品列表会过期，四问和维护条目才是长期资产。

---

*以后看到“XX 一句话生成世界”或“YY 一键工作流”，先问四遍：它在哪种表示上生成？规则是什么？条件从哪里进？最后由谁解码成可交付输出？地图就不会被品牌名牵着走。*
