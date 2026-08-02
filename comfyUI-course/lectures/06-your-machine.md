# 第 06 讲 · 你的这台机器与这套安装

> 实战篇从"盘家底"开始。这一讲把 `E:\AI` 下的每个目录、每个脚本、每个配置文件过一遍——全部内容都对照你机器的实际状态核实过。知道每样东西在哪、归谁管，是后面一切操作和排障的地基。

## 1. 大局：portable 版意味着什么

你装的是 **ComfyUI Windows Portable**（当前 0.22.0）：整个程序 + 一个**专属的内嵌 Python**（3.13 + PyTorch 2.11/cu130）都在 `E:\AI\ComfyUI_windows_portable` 里，与系统 Python、与 Medusa 的环境**完全隔离**——互不打扰，删目录即卸载。这是最省心的安装形态。你的启动命令还带了一整套定制参数（下面逐个讲），把所有"会长大的东西"都挪出了程序目录——这套组织相当干净，值得保持。

## 2. E:\AI 目录地图（实机核实版）

```text
E:\AI
├─ ComfyUI_windows_portable   程序本体+内嵌Python —— 别动里面的东西
├─ Models                     * 所有模型: checkpoints/loras/vae/controlnet/...
├─ Inputs                     图生图的输入图放这里(Load Image 节点读这里)
├─ Outputs                    * 生成结果落盘处(Save Image 节点写这里)
├─ Workflows                  你自己保存的工作流 .json(本课程的 course/ 包也放这)
├─ User                       设置、数据库(comfyui.db)、Manager 配置 —— 备份重点
├─ Cache                      临时文件(可随时清空换空间)
├─ Logs                       启动与运行日志 —— 排障第一现场
├─ Tools                      aria2、7-Zip 等下载解压工具
├─ Start/Stop/Open_ComfyUI.*  启停脚本(桌面快捷方式指向它们)
├─ extra_model_paths.yaml     * 模型路径配置(见第 4 节)
└─ ComfyUI_操作指南.md         GPT 写的速查手册(本课程的前身)
```

日常三个动作：**启动**双击桌面 `ComfyUI.lnk`（或 `Start_ComfyUI.bat`），首次要等十几秒；**访问** `http://127.0.0.1:8188`；**停止** `ComfyUI Stop.lnk`（释放约几 GB 显存——不用时记得停，Medusa 还在这台机器上干活）。

## 3. 启动参数逐个读（你的实际配置）

你的 ComfyUI 是带这些参数启动的（我从运行中的进程上读下来的），每个都值得知道：

| 参数 | 作用 |
|---|---|
| `--enable-manager` | 启用内置 Manager（装节点/装模型的应用商店，第 15 讲主角） |
| `--extra-model-paths-config E:\AI\extra_model_paths.yaml` | 模型路径外置（第 4 节） |
| `--input/--output/--temp/--user-directory ...` | 输入/输出/缓存/用户数据全部指到 E:\AI 下各目录 |
| `--database-url sqlite:///E:/AI/User/comfyui.db` | 元数据库也外置 |
| `--port 8188 --disable-auto-launch` | 端口与"启动不自动开浏览器" |

**含义**：程序目录是"无状态"的——你的一切资产（模型、成图、工作流、设置）都在外面。将来升级/重装 ComfyUI 本体，资产原地不动。

## 4. extra_model_paths.yaml：模型都去哪找

这个文件告诉 ComfyUI："除了程序自带的 models 目录，还去 `E:/AI/Models` 找"（你的配置里它是 `is_default: true`，即**主模型库**）。里面每一行 `loras: loras` 就是"LoRA 类型 → E:/AI/Models/loras 子目录"的映射。三条实用规则：

1. **下载的模型放对子目录**才会被对应节点看见（checkpoint 放 `checkpoints`、LoRA 放 `loras`……对不上号 = 下拉框里找不到，第 5 大常见"故障"其实是放错目录）；
2. 放入新文件后**不用重启**：在加载节点的下拉框上点刷新（或 Ctrl+R 刷新页面）即可；
3. 子目录里**可以再建文件夹分类**（如 `loras/anime/`、`loras/style/`），下拉框会显示相对路径——模型多了以后的救命习惯。

## 5. 16GB 显存的账本

第 04 讲讲过精度与大小，这里落到你这张卡的实际预算（推理时显存 ≈ 模型权重 + 激活值 + VAE 解码峰值）：

| 任务 | 显存占用（约） | 你的 16GB |
|---|---|---|
| SD1.5 @512 | 3–4GB | 随便跑，秒级出图 |
| SDXL @1024 | 7–9GB | **舒适主力区** |
| SDXL + LoRA×2 + ControlNet | 10–12GB | 可以，别再叠了 |
| FLUX.1 fp8 @1024 | 12–15GB | 能跑，慢（分体加载，T5 会吃内存） |
| FLUX fp16 / 视频模型 | 20GB+ | 超预算，需量化版或放弃 |

两个缓冲知识：ComfyUI 显存不够时会自动把部分权重挪到内存（变慢但不崩，你 32GB 内存是后备队）；真 OOM 了的排查顺序在第 15 讲。**经验红线：常驻别超 13GB**，给 VAE 解码峰值和系统留余量。

另外记住这台机器的特殊性：它同时是 Medusa 的生产机（常驻 python 进程 + Postgres + 每 4h 的抓取任务）。生图是重 GPU 轻 CPU 的活、Medusa 反之，二者基本兼容，但**大批量生图请避开 07:30–09:00 的分析窗口**——那是它一天中最忙的时候。

## 6. 更新与备份

- **更新 ComfyUI**：portable 包内有 `update` 目录（`update_comfyui.bat`），或用 Manager 的 Update 按钮。**别追最新**：生图生态的节点/模型兼容性以"能跑"为大，稳定运行的版本没事别升，升级前看一眼社区有没有炸锅；
- **备份什么**：`E:\AI\User`（设置+数据库）、`E:\AI\Workflows`（你的劳动成果）、`extra_model_paths.yaml`。**Models 不用备份**（都能重新下载，太大），记录一份"我装了哪些模型"的清单即可（第 10 讲给你清单模板）；
- **安全提醒**（呼应第 04 讲）：只下 `.safetensors`；自定义节点是**任意代码**，装之前看一眼 GitHub 星数和最近更新（第 15 讲展开）。

## 上机任务

1. 打开 `E:\AI`，把第 2 节的目录地图逐个点开对一遍——特别是 `Models` 下的空文件夹们，默念每个将来放什么（对不上的回第 05 讲总表）；
2. 启动 ComfyUI，打开 `http://127.0.0.1:8188`，在设置里把界面语言切成中文（如果还没有）；
3. 打开 `E:\AI\Logs` 里最新的日志文件，找到启动时打印的 `Total VRAM` 和加载的路径配置行——排障时你会回到这里；
4. 用完记得点 Stop，任务管理器里确认显存已释放。

---

*家底盘清了。下一讲把默认文生图工作流拖上画布，逐个节点对号入座——上篇五讲的每个数学对象，都会在画布上找到自己的位置。*
