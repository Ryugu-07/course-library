# 第 10 讲 · 模型生态：选型与下载清单

> 你的安装缺的不是能力是弹药（第 00 讲的诊断）。本讲三件事：**去哪下、怎么挑、下什么**——最后一节是为"16GB 显卡 + VRChat 动漫素材"定制的第一批清单，照单抓药后，第 11–14 讲全部玩法解锁。

!!! warning "时效声明"
    模型圈以周为单位迭代，本讲的**具体模型名**是 2026 年初的快照，**挑选方法**长期有效。下载前在社区（civitai 排行榜）花五分钟确认有没有更新的主流选择。

## 1. 两大货源 + 国内通道

- **Civitai**（civitai.com）：社区微调模型与 LoRA 的绝对主阵地，按底模筛选、带示例图和参数、有排行榜。生图圈的"应用商店"；
- **Hugging Face**：官方权重（SDXL base、ControlNet、IP-Adapter 等一手发布）；
- **国内通道**：HF 有镜像 `hf-mirror.com`（把链接里的 huggingface.co 换成它即可）；civitai 访问不稳时可用 liblib 等国内站找同款热门模型。你 `E:\AI\Tools` 里的 **aria2** 是多线程下载器，大文件比浏览器稳得多：

```powershell
E:\AI\Tools\aria2\aria2c.exe -x 8 -s 8 -d E:\AI\Models\checkpoints "下载直链"
```

## 2. 怎么读一个 Civitai 模型页（防坑清单）

按重要性排序，五个必看栏目：

1. **Base Model**：写着 SDXL 1.0 / Illustrious / Pony / SD1.5 / FLUX——**第一过滤条件**。LoRA 必须配对应底模（第 05 讲：$\Delta W$ 依附于 $W$）；
2. **示例图的参数**：点开示例图能看到完整生成参数（提示词/采样器/cfg/steps）——**这是官方配方，第一张图照抄它**，跑通了再改；
3. **版本与文件**：选 `.safetensors`（第 04 讲的安全铁律）；同版本多个文件时，`pruned/fp16` 足够推理用（更小）；
4. **触发词（Trigger Words）**：LoRA 常需要特定词激活（第 11 讲展开），页面上明确标注；
5. **License/权限**：个人玩基本无碍；若图片要商用，看清该模型的许可条款（各家差异大）。

## 3. 动漫模型系谱：你的场景该用什么

动漫方向的微调模型有清晰的世代更替（都基于 SDXL 架构，但**互相不完全兼容 LoRA**，选定一系再下配件）：

| 世代 | 代表 | 特点 |
|---|---|---|
| SD1.5 动漫时代 | Anything、Counterfeit | 2023 年的经典，512 分辨率，已过时 |
| Pony 系 | Pony Diffusion V6 XL | 首个 danbooru 标签深度训练的 SDXL；需要 `score_9, score_8_up...` 一串专属质量咒语 |
| **Illustrious 系** | Illustrious-XL 及其微调（WAI、NoobAI 同源系） | **2025–26 动漫主流**：danbooru 标签理解极佳、角色词库全、构图质量高 |

**给你的建议：直接入 Illustrious 系**（跳过历史包袱），理由：VRChat 动漫角色风格匹配度最高、当前 LoRA 生态最活跃、对 danbooru 标签的理解意味着提示词有一套**确定性的词表**可查——这对数学背景的你是好消息：

```text
Illustrious 系提示词范式(danbooru 标签, 逗号分隔):
1girl, silver hair, long hair, red eyes, school uniform,
standing, classroom, window light,
masterpiece, best quality, highly detailed
负面: worst quality, low quality, bad anatomy, bad hands,
      extra digits, watermark, signature
```

标签不是自由发挥，是查表——danbooru 的标签维基就是词典；这套词表也正是第 12 讲 ControlNet + 你的 VRChat 截图工作流的提示词基础。

## 4. 第一批下载清单（约 18–22GB 磁盘）

按第 05 讲总表的"部件"组织，放进对应的 `E:\AI\Models` 子目录：

| # | 部件 | 推荐（2026 初快照） | 去处 | 大小 | 用途 |
|---|---|---|---|---|---|
| 1 | 动漫主力 checkpoint | Illustrious-XL 系热门微调（civitai 按 Illustrious 筛，排行榜前列挑口味） | `checkpoints/` | ~6.6GB | 第 11–13 讲主力 |
| 2 | 通用写实 checkpoint | Juggernaut XL 或 RealVisXL（任一） | `checkpoints/` | ~6.6GB | 写实/材质/场景 |
| 3 | SDXL 修复版 VAE | `sdxl_vae.safetensors`（fp16-fix 版） | `vae/` | ~330MB | 个别微调模型发灰时外挂 |
| 4 | ControlNet 万能包 | **Xinsir controlnet-union-sdxl (promax)** —— 一个文件同时支持 openpose/canny/depth/lineart 等 | `controlnet/` | ~2.5GB | 第 12 讲全部实验 |
| 5 | IP-Adapter 主体 | `ip-adapter_sdxl_vit-h.safetensors` | `ipadapter/` | ~700MB | 第 13 讲 |
| 6 | CLIP 图像塔 | CLIP-ViT-H-14 图像编码器（IP-Adapter 官方仓库配套） | `clip_vision/` | ~2.5GB | IP-Adapter 的眼睛 |
| 7 | 放大模型 | `4x-UltraSharp` + `RealESRGAN_x4plus_anime_6B`（动漫专用） | `upscale_models/` | 各 ~65MB | 第 14 讲 |
| 8 | 2–3 个 LoRA | 在 civitai 按"你的 #1 底模"筛选，挑画风/角色各一 | `loras/` | 各 ~50–200MB | 第 11 讲练手 |

清单刻意**不含** FLUX/Qwen（第二阶段，等 SDXL 生态玩顺再上，那时 16GB 下的 fp8 选型另议）和 SDXL-inpaint 专用模型（第 09 讲路线 A 暂够用；将来需要大面积重绘时再补）。

**管理纪律（从第一个文件开始养成）**：

1. 文件名保留版本号（`illustriousXL_v20.safetensors` 别改成 `anime.safetensors`——三个月后你分不清）；
2. `loras/` 下按 `style/`、`char/` 建子目录（第 06 讲：下拉框支持相对路径）；
3. 在 `E:\AI\Models\models.md` 里一行一条记录：`文件名 | 来源链接 | 底模 | 触发词`——这是你的弹药库台账，也是唯一需要"备份"的模型信息（第 06 讲）。

## 5. 换了模型之后：参数要跟着换

新 checkpoint 到手的标准动作（每次都做，形成流程）：

1. 模型页示例图的参数**原样跑一张**（提示词、采样器、cfg、steps 全抄）——先确认"药是好药"；
2. 换成你的提示词，参数不动，再跑——确认"药对你的症"；
3. 之后才开始按第 08 讲的方法调参。动漫系模型常见差异：cfg 甜区偏低（4–7）、质量词/负面词有各自约定（模型页会写）、`euler_ancestral` 或 `dpmpp_2s_ancestral` 是社区惯用搭配。

## 上机任务

1. 按清单下载 #1（动漫主力）+ #4（ControlNet union）+ #7（两个放大器）——这是后面三讲的最小弹药；其余可边学边补；
2. 建好 `models.md` 台账，把已有的 3 个底模也补记进去；
3. 用新动漫 checkpoint 照模型页配方出第一张图，然后用第 3 节的 danbooru 范式描述一个你的 VRChat 角色，看它能还原几成。

---

*弹药到位。下一讲把 LoRA 挂上工作流——几十 MB 改画风的低秩数学（第 05 讲），落到画布上只是一个节点加两个滑块，但滑多少、叠几个、为什么失效，全有讲究。*
