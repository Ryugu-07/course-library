# 第 22 讲 · MiniMax H3：把参考素材编排成一条声画镜头

> **组件、模板、FastH3-Omni 与许可补核：2026-10-28；机器环境保留原快照日期，未执行模型推理。** MiniMax 于 2026-07-31 正式发布 H3；ComfyUI 随后提供公开权重的原生 T2V、I2V 与 R2V 模板。本讲从“写提示词生成视频”，走向“给每份图片、视频和声音分配明确职责，再生成同步声画”。学会基础路线后，再区分蒸馏加速、量化与运行时，避免把几个名字相似的版本拼成无法复现的工作流。

<figure class="diagram h3-routing" markdown="1">
![MiniMax H3 把文字、身份图、动作视频与声音参考按角色编排为同步声画输出](assets/img/22-h3-context-routing.svg)
<figcaption><span class="fig-id">图 22.1</span>H3 工作流的关键不是“参考越多越好”，而是<strong>每份参考只承担一个说得清的职责</strong>。提示词负责声明素材之间的关系，模型再把身份、运动、镜头与声音放进同一上下文。</figcaption>
</figure>

## 1. 它真正改变了什么

传统视频工作流常像后期流水线：先生成无声画面，再分别做配音、拟音、音乐和口型；角色参考、动作参考与首尾帧控制也经常属于不同模型或插件。H3 的设计目标是把这些任务放进同一个多模态上下文：

- **输入**可以混合文本、图片、视频和音频；
- **关系**由自然语言说明，例如“图 1 只提供人物身份，视频 1 只提供运镜，音频 1 只提供音色”；
- **输出**是带原生双声道的音视频，语音、音效与音乐不是事后简单叠上去的三条独立轨道；
- **模式**不再只是一串彼此隔离的 T2V/I2V 按钮，本讲以T2V、I2V、R2V三个基础模板作为学习入口。2026-09-11的官方总览还列出Multiframe Reference与Fun ControlNet Union，共五类示例；这些示例也不是模型全部可用模式。

MiniMax 官方发布页给出的能力上限是最长约 15 秒、最高 2K；当前 ComfyUI 本地开放权重教程却建议先在 **768 px 短边、最大约 768×1344、边长为 32 的倍数**这一原生画布上工作。模板以 24 fps 输出，时长输入会落到模型的 **$17k+5$ 帧网格**，所以界面中的任意秒数不一定对应任意帧数。两句话并不矛盾：官方发布还描述了基模参与的 in-context regeneration；本地模板的稳定起点并不是直接把 Resolution Selector 拉到“2K”。课程实验以下面的本地模板约束为准。

## 2. 三个模板不是三个近义按钮

| 模式 | 核心节点/权重 | 最适合回答的问题 | 不应拿它做什么 |
|---|---|---|---|
| **T2V** | `MiniMaxH3ImageToVideo` 路线；`fl2va` 权重 | 没有既定角色资产时，先探索场景、镜头与声场 | 用十段形容词强行“锁脸” |
| **I2V / FL2V** | 同为 `fl2va`；接 `first_frame`，可再接 `last_frame` | 已有关键视觉，想控制起点、终点和中间运动 | 把首帧当风格参考后又要求完全换构图 |
| **R2V** | `MiniMaxH3ReferenceToVideo`；独立的 `ref2va` 权重 | 分开指定身份、风格、动作、运镜或声音 | 不写角色分工，把一堆互相冲突的素材全塞进去 |

这里最容易踩的安装坑是：**T2V/I2V 的 `fl2va` 与 R2V 的 `ref2va` 不是同一个 diffusion model 文件。** 文本编码器、视频 VAE 与音频 VAE 可以共用，但切到 R2V 时必须装对应权重，不能只改节点名字。

## 3. 四类文件各自负责什么

按 **2026-10-28** 核对的 ComfyUI 官方原生模板，T2V/I2V 的四个基础组件是下面这一组；模板还可能引用后文列出的 LoRA 与 embedding，因此这不是全部下载清单：

```text
ComfyUI/
└── models/
    ├── diffusion_models/
    │   └── minimax_h3_fl2va_pruned_int8_convrot.safetensors   # 约 21.0 GB
    ├── text_encoders/
    │   └── qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors       # 约 15.7 GB
    └── vae/
        ├── minimax_h3_video_vae_int8_convrot.safetensors      # 约 2.81 GB
        └── minimax_h3_audio_vae_fp32.safetensors              # 约 0.61 GB
```

四类文件对应四本账：

| 文件 | 角色 | 换错时最可能看到的症状 |
|---|---|---|
| `fl2va` / `ref2va` diffusion model | 联合声画潜变量上的生成主干 | 模式不匹配、节点无法执行或输出语义失控 |
| Qwen3-VL 文本编码器 | 理解提示词、参考标签及素材关系 | 指令与参考分工理解变差，或直接加载失败 |
| video VAE | 视频像素与视频 latent 之间编码/解码 | 解码报错、显存峰值或画面异常 |
| audio VAE | 音频波形与音频 latent 之间编码/解码 | 无法得到正常音轨或音频解码失败 |

当前[官方原生模板文档](https://docs.comfy.org/tutorials/video/minimax/minimax-h3-native)将 Turbo LoRA 列入模板模型扫描：T2V/I2V 的 8 步文件为 <code style="overflow-wrap:anywhere">minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16</code>，R2V 的 4 步文件为 <code style="overflow-wrap:anywhere">minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16</code>，扩展名均为 `.safetensors`，放在 `models/loras/`。Turbo 模式可以不启用，但模板扫描仍可能要求其文件。当前 T2V/I2V JSON 还列出 4 步 FL2V LoRA，三个基础模板都出现 `minimaxh3_art_is_explosion.safetensors`；应按实际启用分支、loader 与模型扫描核对，不能看到仓库目录就把所有文件都下载，也不能把另一模式的 LoRA 硬接过来。

上述四文件的仓库字节数相加为 **40,073,842,159 字节，约 40.07 GB 磁盘**，不含 LoRA、embedding、缓存或 R2V 权重。旧讲义的 42.5 GB 对应 FP16 视频 VAE，作为历史记录仍成立；官方模板在 [2026-09-22 的提交](https://github.com/Comfy-Org/workflow_templates/commit/fc427f00097817d3f7d8099c5259837fa51e1267)切换到 INT8 视频 VAE。GB 按 $10^9$ 字节计，GiB 按 $1024^3$ 字节计，显示数字不同也可能只是单位不同。

| 历史与当前 | 视频 VAE | 四基础文件磁盘合计 |
|---|---|---|
| 2026-08-13 课程组合 | `minimax_h3_video_vae_fp16.safetensors`，约 5.21 GB | 约 42.47 GB（原文四舍五入为 42.5） |
| 本轮核对的模板组合 | `minimax_h3_video_vae_int8_convrot.safetensors`，约 2.81 GB | 约 40.07 GB |

这是模板默认值变化，不表示旧 FP16 VAE 已不能使用。本轮固定模板仓库提交为 `3c2199b9362457b12b9c60c6cc303501526ebd62`：[T2V JSON](https://raw.githubusercontent.com/Comfy-Org/workflow_templates/3c2199b9362457b12b9c60c6cc303501526ebd62/templates/video_minimax_h3_t2v.json)、[I2V JSON](https://raw.githubusercontent.com/Comfy-Org/workflow_templates/3c2199b9362457b12b9c60c6cc303501526ebd62/templates/video_minimax_h3_i2v.json)、[R2V JSON](https://raw.githubusercontent.com/Comfy-Org/workflow_templates/3c2199b9362457b12b9c60c6cc303501526ebd62/templates/video_minimax_h3_r2v.json)。已读文件引用，未执行模型扫描和推理；实际安装仍需记录核心与前端版本。

磁盘占用不是峰值显存：即使另选约 15.98 GB 的 `minimax_h3_fl2va_pruned_w6a8.safetensors`，也没有给激活、编码器和 VAE 留出同等空间；它也不是上述模板的默认 INT8 文件。对 16GB 卡，阶段加载与卸载会把问题转移到系统内存、传输和等待时间，不能仅凭单文件接近显存容量就宣布跑通。

这台 Win 机在 2026-07-10 的快照是 PyTorch 2.11/cu130、ComfyUI 0.22.0；v0.33.1 是 2026-08-20 的安装快照。现在应从[官方发布页](https://github.com/Comfy-Org/ComfyUI/releases)选择稳定版本并记录实际 commit，让对应模板完成预检；旧最低版本号不是当前全部功能的兼容证书。基础 Comfy 模型卡对 `nvfp4_awq` 文件的加载说明，也不能外推为所有运行时都支持硬件原生 NVFP4 加速。

### 3.1 三条加速路线不能靠名字互换

| 路线 | 实际改变什么 | 应如何辨认 |
|---|---|---|
| 原生 H3 + Turbo LoRA | 在匹配的基础权重上使用特定加速适配器 | `fl2v` 与 `ref2v`、4 步与 8 步各按对应模板 |
| 较早的 FastH3 | 独立加速权重与 T2V/I2V 模板 | [2026-09-15 模板提交](https://github.com/Comfy-Org/workflow_templates/commit/0217ec3ef1c0de94ec5145005509cd892701523d)中的 `fastvideo_fasth3_8step_v2_pruned_int8_convrot` |
| FastH3-Omni | 新的多参考声画蒸馏模型 | [2026-10-20 作者发布](https://haoailab.com/blogs/fastvideo-omniref-update/)，Comfy 文件以 `fasth3_omniref_8step_pruned_` 开头 |

蒸馏需要学习用较少的模型求值完成生成；量化改变数值表示；运行时优化改变计算与搬运的执行方法。这三件事可以组合，却不是同一个旋钮。把原版 H3 的 steps 从 50 改成 8，不会自动获得蒸馏后的能力；把新权重改成旧文件名，也不会获得匹配的条件接口。

[FastH3-Omni 的 Comfy 模型卡](https://huggingface.co/FastVideo/FastH3-Omni-Comfy)给出 BF16 与 INT8 ConvRot 两种生成权重，使用原生 H3 Reference to Video 条件节点、配套文本编码器及双 VAE，8 步、guidance 1、video shift 12、audio shift 3。选一组匹配的组件即可；这不是在旧 FastH3 上再叠一个同名 LoRA。该卡注明加速 NVFP4 文本编码需要 Blackwell，其他设备选择 BF16/INT8 路线。ComfyUI、FastVideo 与 UniServe 的文件布局和内核不同，输出也可能不同。

### 3.2 “快了多少”要把完整配方写出来

作者报告 8 次 Transformer 求值代替基线 50 次，并在 **8×GB200、27 个参考组成与时长组合、1344×768、24 fps** 下测得 **5.6–11.9 倍**端到端加速。每种配置一次预热、三个测量种子，计时到完整 MP4，**不含模型加载与服务器启动**。基线使用 SGLang 的 `lossless` 策略，并非更严格的 `exact`；两侧权重、注意力和运行实现都变了。因此这是完整生成配方的作者比较，不是仅改变蒸馏一个因素的消融，也不是本课实测。

用一个教学时间账本看清为何步数比不是总加速比。设固定的参考编码与解码耗时为 $F$，每次模型求值耗时为 $c$；在其他条件都相同的简化模型中，$T_N=F+Nc$。从 50 次降到 8 次的比值是 $(F+50c)/(F+8c)$：只要 $F>0$，它就小于 $50/8$。实际新配方还可能改变 $F$、$c$ 和每次求值做的工作，因此这个式子只用于定位要计时的阶段，不能预测论文加速倍数。

相同 seed 也不保证两个模型同图同音。验收应分别看参考身份、动作、时点、音轨和总耗时；作者样片是定性材料，不是质量等价证明。上述八卡成绩不能移植成 4060 Ti 16GB 的承诺，本课没有执行任何一种 H3 推理。

## 4. 这台 4060 Ti 16GB 应该怎样开始

把“能打开模板”“能跑出一条”和“能高频迭代”分成三层，不要用一次侥幸运行替代可用性判断。

### 路线 A：先在 Comfy Cloud 学会语义

官方教程为 T2V、I2V、R2V 都提供 Cloud 入口。它适合先验证提示词结构和参考分工，不需要在本地下载四十多 GB 文件；代价是按服务计费，素材会离开本机，上传前要确认隐私、肖像、声音授权与当前服务条款。

### 路线 B：本地只装 `fl2va`，先跑最小镜头

1. 备份 `user/`、自定义节点列表和当前工作流，再把 ComfyUI 更新到当前稳定版（**v0.33.1仅是2026-08-20的历史快照**）；0.30.0 只是教程最低门槛，不应把“刚过最低版本”当作完整兼容证书。不要在旧 0.22 环境里手抄新节点。
2. 在 Template Library → Video 搜索 **MiniMax H3 T2V**，让模板弹窗给出当前配套文件；先只装 T2V/I2V 共用的 `fl2va` 组合。
3. 使用模板自带的 preview megapixels、短时长、单镜头。固定 seed，只改提示词；先证明端到端声画能输出，再增加像素与帧数。
4. 同时记录磁盘读取、系统内存、峰值显存、首轮加载时间与第二轮生成时间。若系统内存持续顶满或反复在 CPU/GPU 间搬运导致迭代不可接受，就停止堆优化插件，转云端或更大显存机器。
5. 只有当 I2V 已能稳定迭代，并且你确实需要身份/动作/声音分工时，再下载 `ref2va` 进入 R2V。

本课程没有在这台 16GB 机器上替你声称“实测流畅”。官方开放权重证明它可本地部署，**不证明你的具体硬件能以可接受速度跑每种模式**。这是一次需要日志与计时表的工程实验。

## 5. 提示词从“画面清单”升级为“镜头契约”

### 5.1 T2V：时间、镜头和声音写在同一份脚本里

先写一个镜头，不要一上来塞三次转场：

```text
6-second single shot. A quiet tram stop after rain at blue hour.
The camera slowly dollies toward a woman holding a transparent umbrella.
At 2 seconds she looks up; at 4 seconds the tram light crosses her face.
Audio: light rain in stereo, a tram bell approaching from rear left,
one soft breath, no dialogue, no background music.
Keep the face stable; no cuts; no on-screen text.
```

这个结构有六个槽位：**时长与镜头数 → 场景 → 主体动作时间线 → 镜头运动 → 声音事件与空间位置 → 禁止项**。它比“cinematic, masterpiece, 8K”更可检验，因为每句话都能在输出里判定成功或失败。

### 5.2 R2V：标签只负责寻址，句子负责分工

参考按连接顺序编号。官方文档使用 `<Picture 1>`、`<Video 1>`、`<Audio 1>` 这样的标签；标签本身不会告诉模型“该抄什么”，必须紧接职责：

```text
Use <Picture 1> only for the performer's identity and clothing.
Use <Video 1> only for body motion and camera timing; do not copy its person.
Use <Audio 1> only for the authorized speaker's voice color and cadence.
Create one 6-second medium shot in a rehearsal room.
The performer repeats the motion from <Video 1> and says: "Ready for take two."
Keep the room tone quiet; preserve the face and jacket from <Picture 1>.
```

R2V 当前文档列出的上限是 9 张参考图、3 段参考视频和 3 段独立音频；`ref_image_size=match` 会把参考缩到生成分辨率以换速度，`max` 可保留到 2048 px 短边以争取身份细节，但更慢。上限不是建议量。第一次实验只用“一图 + 一视频”，先验证身份与运动能否解耦。

## 6. 四轮对照实验：别凭一条最好看的样片下结论

固定 seed、时长、分辨率和基础场景，建立如下实验账本：

| 轮次 | 工作流变化 | 要回答的问题 | 记录指标 |
|---|---|---|---|
| A · T2V 基线 | 只有镜头契约 | 模型能否独立完成动作、运镜和声场？ | 动作完成、声画时点、文字/脸部异常、耗时 |
| B · I2V | 增加首帧 | 首帧提高身份一致性时，是否压低了动作幅度？ | 首帧相似、末帧漂移、动作幅度 |
| C · FL2V | 再增加尾帧 | 两个端点能否被合理连接，还是中段发生突变？ | 端点误差、中段形变、速度连续性 |
| D · R2V | 身份图 + 动作视频，逐句声明职责 | 身份与运动是否真的分开继承？ | 身份、服装、动作节拍、运镜，各自 0–2 分 |

音频单独打四项：**对白内容、音色授权与保持、事件时点、左右声场**。画面漂亮但台词错、声场反向或参考人物被复制，都不是“整体成功”。每轮至少保留 seed、模板版本、模型文件名、提示词、分辨率、帧数、耗时和输出 MP4；否则第二天无法知道改进来自哪一个变量。

A–C 可在同一 `fl2va` 权重下逐步增加端点条件；D 切换到 `ref2va`，同时改变权重与条件接口，属于工作流比较，不能把改善全归因于“增加参考图”。若研究职责句是否有效，应在同一 R2V 模板中仅增删该句，其余输入保持不变。

## 7. 失效边界与安全线

- **多模态统一不等于约束必然满足。** 身份、动作、镜头和语音可能竞争；参考越多，冲突和错误寻址的空间越大。
- **首尾帧是边界条件，不是完整运动轨迹。** 中间怎样走仍由模型生成；复杂接触、手部遮挡和快速旋转仍可能崩坏。
- **原生音频不等于事实正确或口型绝对同步。** 对白、拟音、音乐和空间声场都应逐项验收，重要成片仍可能需要剪辑与混音。
- **权重、工具与托管服务各有授权。** FastH3-Omni 模型卡沿用 H3 Community License，随包工具保留自己的许可证。开源工具的许可不自动覆盖模型权重和输出；Cloud 服务有其合同，不能仅凭有 Cloud 按钮推断所有地区与用途都获授权。
- 只使用自己或获得明确许可的人脸、动作与声音。未经同意克隆真人身份或音色，会把一个技术练习变成肖像、人格与欺诈风险。
- H3 页面与模板刚发布不久。节点名、量化文件、硬件建议、价格和许可都属于时效信息；发现课程与官方页面不一致时，以当前一手文档为准并更新本页快照。

### 7.1 输出不是模型衍生物，为何仍要读地域条款

本课 **2026-10-28** 核读的 [H3 LICENSE](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)标注版本日期 **2026-08-02**。这是该许可文本的范围，不是对各地法律或另一份服务合同的概括：

- I、II 节定义并限定适用地域，排除欧盟、英国、韩国、美国。
- **V.4 明确覆盖输出及结果**，限制在适用地域以外使用、复制、修改、分发或展示。I 节说输出不属于模型衍生物、VI.4 说许可方不主张输出所有权，都不能取消这条限制。
- IV.1 对商业产品与服务年收入超过 **2000 万美元或等值金额**要求事先单独书面授权；IV.2 要求相关商业界面显著标示 MiniMax H3。
- V.3 限制用作品、输出或结果改进其他 AI 模型，例外是 H3 或其模型衍生物。

实际判断应同时列出“用的模型及版本、在哪里使用或展示、做什么、依据哪份授权”，而不是只写“开源”。需要超出该文本的用途时，核对另行取得的授权；本课没有核验任何个人的商业合同或 Cloud 的最新合同。

## 理解检查

<details markdown="1"><summary>1. 一份 H3 权重约 15.98 GB，放在 16GB 显卡上是否已证明能运行？</summary>

没有。磁盘文件只占账本一项，加载后的表示、激活、参考条件与 VAE 仍需内存。阶段卸载可能让流程执行，但还要报告系统内存、传输与加载时间。应按实际配套组件记录端到端日志，不能把文件体积当作运行峰值。
</details>

<details markdown="1"><summary>2. 用新版完整配方比旧版快六倍，是否已经证明蒸馏本身快六倍且质量相同？</summary>

没有。若模型、量化、注意力、并行策略和解码器同时变化，只能先报告整个配方的差异。归因于某一项，需要能固定其他条件的消融；质量也须单独评估，不能靠相同 seed 或一对样片证明等价。冷启动时间和稳定生成时间还应分列。
</details>

<details markdown="1"><summary>3. 许可证说输出不是 Model Derivatives，能否推断输出不受地域限制？</summary>

不能。定义条款回答输出是否归入某一类别，V.4 则直接点名输出与结果。阅读许可要把适用对象、授权和限制合起来，而非从单句推出豁免；是否另有商业或托管授权，也须由那份具体合同确认。
</details>

## 上机任务

1. 不下载模型，先打开 ComfyUI 官方 H3 教程，分别画出 T2V、I2V/FL2V、R2V 的输入与权重差异；能解释 `fl2va` 和 `ref2va` 才进入安装。
2. 用第 5.1 节的六槽结构写一个属于你的 6 秒单镜头，明确三件可判定的声音事件；把“cinematic”等风格词放到最后，而不是拿它代替动作脚本。
3. 先用 Cloud 或可用的大显存环境跑 A/B 两轮，固定 seed 做 T2V 与 I2V 对照；按第 6 节表格评分，不只保存最好看的一条。
4. 获得授权素材后做一次“一图身份 + 一视频动作”的 R2V；随后只删除职责句、其他不变，再比较错误寻址是否增加。
5. 若决定在 4060 Ti 上本地尝试，先升级 ComfyUI 并只装 `fl2va` 组合。记录首轮/第二轮耗时、峰值显存和系统内存；数据表完成前不下载 `ref2va`。

## 一手资料

- [MiniMax H3 官方发布页（2026-07-31）](https://www.minimax.io/blog/minimax-h3)
- [ComfyUI 官方 H3 总览](https://docs.comfy.org/tutorials/video/minimax/minimax-h3)
- [ComfyUI 官方 H3 原生模板、Turbo依赖与参考限制](https://docs.comfy.org/tutorials/video/minimax/minimax-h3-native)
- [Comfy-Org/MiniMax-H3 模型文件、体积与许可](https://huggingface.co/Comfy-Org/MiniMax-H3)
- [ComfyUI 官方 workflow templates](https://github.com/Comfy-Org/workflow_templates)
- [FastH3-Omni 作者方法与基准，2026-10-20](https://haoailab.com/blogs/fastvideo-omniref-update/)：核读蒸馏说明、结果及完整计时协议；未下载视频、重跑基准或验证质量等价。
- [FastH3-Omni 的 Comfy 文件与配置](https://huggingface.co/FastVideo/FastH3-Omni-Comfy)：核读模型卡正文，区分运行时格式和硬件要求。
- [MiniMax H3 许可证](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)：核读 I–VI 节，重点 IV、V；版本日期 2026-08-02，不代替另行授权。

本轮核验还读取了三个基础模板的 JSON 文件名引用及仓库文件大小元数据，确认 INT8 VAE 与额外依赖；没有下载模型、升级本机安装或执行工作流。模板 main 会继续变化，实际运行应保存所用 JSON 与 commit。

---

*这一讲真正要带走的不是一个新模型名，而是一种新的工作流读法：素材不是“都拿来参考”，每份素材都有职责；生成不是“碰运气出片”，每个约束都有验收账本。*
