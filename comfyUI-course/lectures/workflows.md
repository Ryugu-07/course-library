# 工作流包使用说明（wf01–wf07）

> 课程配套的 7 个分级工作流，已放到你 Win 机器的 `E:\AI\Workflows\course\`（源文件在 Mac `~/comfy-course/workflows/`）。**wf01–wf04 用你现有的 3 个底模即可运行**；wf05–wf07 需要先按第 10 讲清单补对应模型。wf01 和 wf02 已在你的机器上实测出图（结果在 `E:\AI\Outputs\course\`）。

## 加载方式

ComfyUI 界面 → 菜单 Workflow → Open（或直接把 `.json` 文件**拖进画布**）→ 选 `E:\AI\Workflows\course\` 下的文件。

每个文件里的模型名对应你机器的实际文件；带"换成你的…"字样的下拉框（wf05 的 LoRA、wf06 的骨架图）加载后点开下拉框选成你的实际文件即可。

## 清单与练习

| 文件 | 配套讲次 | 内容 | 前置 |
|---|---|---|---|
| `wf01_sd15_txt2img` | 07 | SD1.5 文生图 512——最快的练手配置，秒级出图 | 无 ✅ |
| `wf02_sdxl_txt2img` | 07/08 | SDXL 文生图 1024——主力骨架，第 07 讲逐节点拆的就是它 | 无 ✅ |
| `wf03_sdxl_img2img` | 09 | 图生图（denoise=0.45 起手）——图片放 `E:\AI\Inputs` 后在 LoadImage 里选 | 无 ✅ |
| `wf04_sdxl_inpaint` | 09 | 局部重绘路线 A——LoadImage 上右键 Open in MaskEditor 画遮罩 | 无 ✅ |
| `wf05_sdxl_lora` | 11 | LoRA 挂载（MODEL+CLIP 双线全串）——换成你的 LoRA + 触发词 | 第 10 讲 #8 |
| `wf06_sdxl_controlnet` | 12 | ControlNet 姿势控制——骨架图放 Inputs，union 模型自动适配 | 第 10 讲 #4 |
| `wf07_sdxl_ipadapter` | 13 | IP-Adapter 参考图——**需先装 IPAdapter_plus 扩展**（第 15 讲），未装时节点显示红色 | 第 10 讲 #5#6 + 扩展 |

## 建议玩法

1. **按讲次顺序解锁**：每讲的"上机任务"指定了用哪个 wf、做什么实验——工作流是教具，任务才是练习；
2. **改完另存**：调出自己满意的版本后 Save As 存到 `E:\AI\Workflows` 你自己的目录（别覆盖 course/ 原件，它们是"已知能跑"的基准，排障时要回来对照）；
3. **组合进阶**：学完 11–13 讲后，把 wf05 的 LoRA 段、wf06 的 ControlNet 段、wf07 的 IPAdapter 段**拼进同一个工作流**——三个外挂各走各的通道（第 05/13 讲），拼装本身就是最好的复习；
4. **对照 API 版**：`workflows/api/` 下是每个工作流的 API 格式（第 15 讲第 3 节）——将来写自动化脚本时直接用它们当模板。

## 拓展篇（视频/音乐/3D）为什么没有 wf 文件

拓展篇实战（第 18/20/21/22 讲）**直接使用 ComfyUI 内置模板**（菜单 → Workflow → Browse Templates 的 Video / Audio / 3D 分区）：这些模板与模型版本配套发布、随 ComfyUI 更新自动更新，比课程自带静态 JSON 更不易过期。H3 尤其应从 Template Library 的 T2V/I2V/R2V 官方模板进入，因为 `fl2va` 与 `ref2va` 使用不同权重；课程不复制一份会迅速过期的静态 JSON。各讲内有对应的模板名与参数指引。

## 排障速记

- 节点红色 → 缺扩展（Manager → Install Missing，第 15 讲）；
- 下拉框值是红字/找不到 → 该模型文件不在对应目录（第 06 讲第 4 节）；
- 跑完没图 → 看 KSampler 是否报错（悬停红色边框）、`E:\AI\Logs` 最新日志；
- 其余按第 15 讲排障总表。
