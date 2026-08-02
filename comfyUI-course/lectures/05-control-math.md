# 第 05 讲 · 控制与定制：LoRA / ControlNet / IP-Adapter 的数学

> 原理篇收官讲。底模（checkpoint）是通才，但你想要的是：特定画风、特定角色、按骨架图摆姿势、参考一张图保持一致性——**而重新训练一个 SDXL 要几十万美元**。本讲讲清楚四类"定制件"如何用极小的代价改装整机，以及它们分别动了第 04 讲三大件的哪个部位。这一讲读完，第 10–13 讲的实战就只剩"操作"没有"疑惑"。


<figure class="diagram" markdown="1">
![三种定制的注入点：LoRA（低秩旁路 W+BA）/ ControlNet（额外条件分支）/ IP-Adapter（图像提示）。](assets/img/05-lora-controlnet.svg)
<figcaption><span class="fig-id">图 5.1</span>三种定制的注入点：LoRA（低秩旁路 \(W+BA\)）/ ControlNet（额外条件分支）/ IP-Adapter（图像提示）。</figcaption>
</figure>

## 1. LoRA：低秩改装（几十 MB 改画风）

### 1.1 推导

想改变模型行为 = 想改权重矩阵。全量微调要动全部 26 亿参数，产物和底模一样大（6.6GB），训练要大显存——个人玩不起。**LoRA**（Hu et al. 2021，原为 LLM 发明，姊妹课程也提过）的假设：**微调造成的权重变化 $\Delta W$ 是低秩的**——改变"画风"这类模式性偏移，不需要满秩的自由度。

于是不学 $\Delta W \in \mathbb{R}^{d \times k}$ 本身，学它的低秩分解：

$$
W' = W + \Delta W = W + \frac{\alpha}{r}\, B A, \qquad B \in \mathbb{R}^{d \times r},\; A \in \mathbb{R}^{r \times k},\; r \ll \min(d, k)
$$

参数量从 $dk$ 降到 $r(d + k)$。取 $d = k = 1024$、秩 $r = 16$：$1024^2 \approx 10^5$ 对比 $16 \times 2048 \approx 3.3\times10^4$——**每个矩阵省 32 倍**；全模型加起来，一个 SDXL LoRA 通常 50–200MB，消费级显卡一晚上就能炼一个。$\alpha/r$ 是缩放约定；训练时 $B$ 初始化为零，保证起点 $\Delta W = 0$（从底模无扰动出发）。

### 1.2 三个实用推论

- **插在哪**：主要注入第 04 讲的 **cross-attention 层**的投影矩阵（Q/K/V/输出）——正是"文字如何影响画面"的通道，所以改画风/角色概念最有效；也可注入 FFN 层；
- **LoRA Loader 的 `strength` 是什么**：加载时执行 $W' = W + s \cdot \frac{\alpha}{r} BA$，$s$ 就是滑块——1.0 全量生效，0.5 半程，负值反向（能"减去"某种风格）。多个 LoRA = 多个 $\Delta W$ 叠加，故会互相干扰（第 11 讲的叠加纪律源于此）；
- **LoRA 依附于底模**：$\Delta W$ 是相对某个 $W$ 学的——SD1.5 的 LoRA 加到 SDXL 上维度都对不齐（直接报错），加到同架构但差异大的微调底模上则效果漂移（能跑但味不对）。下载 LoRA 必看"底模适配"栏的原因在此。

（顺带认识小兄弟 **Textual Inversion / embedding**：不动网络，只为词表新造一个 token 向量，几十 KB，能表达"一个新概念的名字"但表达力有限，如今主要当负面提示词包用，如 `easynegative`。）

## 2. ControlNet：给模型装"透视眼"（按结构图施工）

### 2.1 问题

提示词只能传达语义（"一个女孩站着"），传达不了**精确空间结构**（骨架关节的准确位置、建筑的透视线）。需要一条通道把"结构图"（骨架/边缘/深度）喂进去噪过程。

### 2.2 架构：可训练副本 + 零卷积

ControlNet（Zhang et al. 2023）的方案漂亮而克制：

1. **冻结整个底模 U-Net**（一个参数都不动——保住通才能力）；
2. **复制 U-Net 的编码器一半**做成可训练副本，输入 = 噪声图 + 结构条件图；
3. 副本各层的输出，经过 **零卷积**（初始化为全零的 1×1 卷积）加回底模解码器对应层。

零卷积是点睛之笔：训练起点上副本的注入恰好为零——**装上 ControlNet 的一刻，模型行为与原版严格一致**，训练只会从零开始温和地学习"结构信息该如何影响生成"，不会破坏底模（对比：直接微调容易灾难性遗忘）。这与 LoRA 的"零初始化 $B$"、ResNet 的"恒等捷径"是同一个设计哲学：**新组件从'不存在'开始渐入**。

### 2.3 使用语义

一个 ControlNet 权重对应一种条件类型（openpose 骨架 / canny 边缘 / depth 深度 / lineart 线稿……各是独立训练的，放 `Models/controlnet`）。生成时的心智模型：**提示词管"画什么"，ControlNet 管"画在哪、什么姿势、什么构图"**。`strength` 控制注入强度，还可设"只在前 60% 步生效"——回忆第 03 讲：构图在高噪声阶段定型，后段放开让细节自由（这个跨讲联动在第 12 讲实操里直接用）。

你 Mac 上已有的 `controlnet_aux` 工具链（给 VRChat 角色截图抽 openpose/canny/depth/lineart_anime 条件图）正是 ControlNet 的**上游预处理器**——Mac 出条件图、Win 出成图的分工在第 12 讲落地。

## 3. IP-Adapter：用图片当提示词

### 3.1 问题与方案

"生成**这个角色**在海边的样子"——角色长相用文字描述一百词也不够。IP-Adapter（2023）让**参考图**直接成为条件：

1. 参考图过 **CLIP 图像塔**（第 04 讲 CLIP 的另一半，`Models/clip_vision`）得到图像特征；
2. 在每个 cross-attention 处**新增一组并联的 K/V 投影**专门吃图像特征——**解耦 cross-attention**：

$$
\text{输出} = \underbrace{\mathrm{Attn}(Q,\, K_{\text{text}},\, V_{\text{text}})}_{\text{原有: 听文字的}} + \lambda\,\underbrace{\mathrm{Attn}(Q,\, K_{\text{img}},\, V_{\text{img}})}_{\text{新增: 看图的}}
$$

文字与图像**各占一路注意力再相加**，互不挤占（对比早期做法把图像特征拼进文字序列——两者会互相稀释）。底模照旧冻结，只训练新增的投影（产物几百 MB）。$\lambda$ 就是节点上的 `weight`：参考图的话语权。

### 3.2 与近亲的分工

| 需求 | 工具 | 原理差异 |
|---|---|---|
| 姿势/构图照着来 | ControlNet | 空间结构注入（逐像素对齐） |
| 风格/气质像这张图 | IP-Adapter | 语义特征注入（全局向量） |
| 脸像这个人 | IP-Adapter FaceID 系 | 换用人脸识别特征替代 CLIP 特征 |
| 严格的角色一致性 | 上述组合 + LoRA | 第 13 讲的专题 |

## 4. Inpaint 与放大：两个"半定制件"

**Inpaint 的机制**：把要重绘的区域做成掩码 $m$，每步去噪后执行"缝合"——保留区直接用原图对应噪声水平的真值覆盖（用第 02 讲闭式跳跃即可造出任意 $t$ 的原图版本），只有掩码区来自模型生成：

$$
x_{t-1} \leftarrow m \odot x_{t-1}^{\text{生成}} + (1 - m) \odot x_{t-1}^{\text{原图加噪}}
$$

朴素缝合在边界处易穿帮，故有**专用 inpaint 模型**（你已有的 `512-inpainting-ema` 就是）：U-Net 输入通道扩展，把掩码和被挖空的图作为额外输入一起训练——边界融合能力是学出来的。第 09 讲实操两种路线。

**放大的两条路线**：1. **前馈超分**（ESRGAN 家族，`Models/upscale_models`）：一个专门训练的卷积网络一步 4×，快、忠实但不添新细节；2. **扩散重绘放大**（hires 两段式 / tiled）：先放大再用低 denoise 图生图"补细节"——慢但细节是真的生成出来的。第 14 讲把两者拼成流水线。

## 5. 原理篇总图

五讲的知识拼成一张完整地图（也是 ComfyUI 画布的"骨架谱"）：

| 部件 | 动了哪里 | 文件夹 | 典型大小 | ComfyUI 节点 |
|---|---|---|---|---|
| checkpoint | 三大件本体 | `checkpoints` | 2–7GB | Checkpoint Loader |
| LoRA | attention 权重低秩增量 | `loras` | 20–300MB | LoRA Loader |
| ControlNet | 并联编码器副本 | `controlnet` | 0.3–2.5GB | Apply ControlNet |
| IP-Adapter | 并联图像 K/V | `ipadapter` + `clip_vision` | 0.1–1GB | IPAdapter Apply |
| VAE | 显影件替换 | `vae` | 0.1–0.3GB | VAE Loader |
| embedding | 词表新 token | `embeddings` | 10–100KB | 提示词里引用 |
| 超分模型 | 独立后处理网络 | `upscale_models` | 60–70MB | Upscale (with model) |

> 纵观五讲，同一个主题反复出现：**冻结主体、旁路注入、零点起步**（LoRA 零初始化 B / ControlNet 零卷积 / IP-Adapter 并联新路）。开源生图生态之所以能百花齐放——任何人几十 MB 就能分发一种新画风、新控制方式——根子就在这套"不动底模的外挂式改装"哲学。

---

*原理篇完。下篇开跑：先把你 E:\AI 这套安装的每个目录、每个脚本、每个配置文件过一遍——知道自己机器上有什么，是一切排障的起点。*
