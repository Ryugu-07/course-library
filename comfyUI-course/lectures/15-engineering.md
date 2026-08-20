# 第 15 讲 · 工程化与排障

> 基础实战篇的收束讲，四件事：扩展节点的安装与治理、工作流资产管理、把 ComfyUI 变成可编程服务（顺便解开你机器上 Codex_Bridge 的身世之谜）、以及一张排障总表。目标是把前面十四讲的玩法**沉淀成可持续运转的个人生产系统**，再进入 16–22 讲的多模态扩展。

## 1. 自定义节点：安装与治理

### 1.1 用 Manager 装（新旧界面先分清）

截至 2026-08-20，官方新 Manager 用左侧筛选、顶部搜索和右侧详情面板管理 node pack；旧界面的按钮名称可能不同。界面里打开 **Manager**：

- **搜索 Node Pack / Node**：先确认包的 Registry 唯一名、来源、所含节点和可选版本，再安装当前工作流真正需要的包；
- **Missing nodes 筛选/提示**：加载工作流出现红色节点时定位候选包。不要因为按钮允许 “Install All” 就跳过逐包审查；同名节点、弃用版本和图外依赖仍要核对；
- 装完**必须重启 ComfyUI**（节点在启动时注册）。

### 1.2 治理纪律（节点包 = 任意代码）

第 06 讲的提醒在此升级为纪律：自定义节点是**装进你机器的第三方 Python/前端代码**。Comfy Registry 会做规则扫描，并给通过标准的版本显示验证标记；Registry 标准禁止 `eval/exec`、运行时 `pip install` 和代码混淆。这个机制能降低风险，却不是“任意节点都安全”的证明，也不覆盖 Registry 之外的手工安装。三条红线：

1. 装前核对 Registry/GitHub 身份、许可、精确版本、最近维护、安全说明和将执行的安装步骤；星数不是代码审计；
2. **别囤积**：每装一个包，启动变慢一分、依赖冲突概率加一分。原则"用到才装，半年不用就卸"；
3. 出诡异问题（启动报错/节点失灵）时，Manager 里**禁用一半节点包二分排查**——依赖地狱的标准解法。portable 版的依赖装在内嵌 Python 里（第 06 讲），最坏情况整个 portable 目录重解压即满血复活，你的资产都在外面，无痛。

一手入口：[Manager 新界面](https://docs.comfy.org/manager/pack-management)；[Comfy Registry 版本与验证](https://docs.comfy.org/registry/overview)；[Registry 安全标准](https://docs.comfy.org/registry/standards)。

## 2. 工作流资产管理

- **命名与归档**：`E:\AI\Workflows` 下按用途分文件夹（`txt2img/`、`vrchat/`、`upscale/`），文件名带版本（`vrchat_pose_v3.json`）——和第 10 讲模型台账同一个精神：**三个月后的你是陌生人**；
- **带 metadata 的 PNG 可作回载线索**：ComfyUI 的标准保存节点通常把工作流写进 PNG metadata，拖回画布即可恢复；经过社交平台、截图、压缩或清理 metadata 后，这份信息可能丢失。Outputs 只能在确认 metadata 仍在时充当“带结果的版本历史”，重要配方仍要另存 JSON 并记录资产版本；
- **git 化（可选进阶）**：工作流 json 是文本，`E:\AI\Workflows` 完全可以 git init 起来——你在 Medusa 已有的版本管理习惯平移即可，改坏了随时回滚。

## 3. API：把 ComfyUI 变成服务（Codex_Bridge 解密）

### 3.1 机制

ComfyUI 本体就是个 HTTP 服务（你的 8188 端口）。它有两种工作流格式：**UI 格式**（画布用，含节点坐标）和 **API 格式**（纯执行图）。设置里开启开发者模式后，菜单多出 "Export (API)"——导出的 json 可以直接 POST：

```python
import json, requests

with open("workflow_api.json", encoding="utf-8") as handle:
    wf = json.load(handle)                         # API 格式执行图

# 从 KSampler 的 positive 支路逆向找文本编码器；ControlNet 等节点可能夹在中间。
def find_text_encoder(nodes, start_id):
    pending, seen = [str(start_id)], set()
    while pending:
        node_id = pending.pop()
        if node_id in seen:
            continue
        seen.add(node_id)
        node = nodes[node_id]
        if node.get("class_type") == "CLIPTextEncode" and "text" in node["inputs"]:
            return node
        for value in node.get("inputs", {}).values():
            if isinstance(value, list) and len(value) == 2 and str(value[0]) in nodes:
                pending.append(str(value[0]))
    raise ValueError("positive branch has no CLIPTextEncode")

sampler = next(node for node in wf.values() if node.get("class_type") == "KSampler")
positive = find_text_encoder(wf, sampler["inputs"]["positive"][0])
positive["inputs"]["text"] = "a cat in spacesuit"

response = requests.post(
    "http://127.0.0.1:8188/prompt",
    json={"prompt": wf},
    timeout=30,
)
response.raise_for_status()
prompt_id = response.json()["prompt_id"]
# 用 /ws 接收进度，或查询 /history/{prompt_id}；不要把“已入队”当“已出图”。
```

完整生命周期是：`POST /prompt` 先校验执行图并返回 `prompt_id`/队列位置或 `node_errors`；`/ws` 推送开始、缓存、执行、进度和错误事件；完成后 `/history/{prompt_id}` 给出该任务的结果。脚本必须分别处理“校验失败、已入队、执行中、执行失败、已完成”，不能只看 HTTP 200。

接口与事件以当前 [ComfyUI server routes](https://docs.comfy.org/development/comfyui-server/comms_routes) 为准。

**任何能发 HTTP 的东西都能指挥 ComfyUI 出图**——批量脚本、定时任务、别的 AI。

### 3.2 你机器上那个 Codex_Bridge 是什么

现在可以解密第 00 讲清单里的疑点了：`E:\AI\Workflows\Codex_Bridge_SDXL_Img2Img_API.json` + `Run_Codex_Bridge_Img2Img.ps1` 就是上面这套机制的现成实例——**一个 API 格式的图生图工作流 + 一段调用脚本，让 Codex（AI 编程助手）能远程指挥这台机器的 ComfyUI 生图**。这正是你 AIGC 工作流项目里“Claude 当管理、Codex 当生图操作员”分工的技术底座。用姊妹课程第 08 讲的话说：**ComfyUI 在这里是一个可调用、可记录的执行节点，AI 是编排者**。固定 seed 和版本有助于复现，却不保证所有 GPU kernel、第三方节点或外部资产都逐位确定；所以桥接脚本仍要保存环境与输出证据。

### 3.3 给你的展望（不急着做）

这个 API 通道可以把“骨架图 × 提示词矩阵”变成批处理，但 ComfyUI 本地服务不应未经认证直接暴露到公网。跨机器访问应放在受控私网/VPN、主机防火墙和明确访问规则后，输入输出目录也要限制；先在 `127.0.0.1` 跑通并保存请求、工作流哈希、`prompt_id` 与结果，再考虑远程队列。

## 4. 排障总表（贴墙级）

按症状查（日志永远在 `E:\AI\Logs`，报错第一现场）：

| 症状 | 最可能原因 | 解法 |
|---|---|---|
| **CUDA out of memory** | 显存超预算（第 06 讲账本） | 降分辨率/batch→卸一个 LoRA/CN→重启 ComfyUI 清碎片；持续吃紧考虑 fp8 版模型 |
| 出图全黑 | VAE 半精度数值溢出（个别模型的老毛病） | 挂第 10 讲清单 #3 的修复版 VAE；或启动参数加 `--fp32-vae` |
| 出图纯噪声/花屏 | 模型三件套不匹配（如 SDXL 底模配 SD1.5 VAE）或蒸馏模型用错参数 | 检查各加载节点是否同一家族；蒸馏模型回第 03 讲第 6 节 |
| 加载工作流一片红 | 缺自定义节点 | Manager → Install Missing → 重启 |
| 下拉框找不到模型 | 放错子目录 / 没刷新 | 第 06 讲第 4 节：核对目录，Ctrl+R |
| 突然变得极慢 | 显存溢出到内存（没崩但在爬行） | 任务管理器看专用 GPU 内存是否满载；按 OOM 行处理 |
| 复现不了以前的图 | 种子没固定 / 节点包版本变了 | PNG 拖回画布还原全部参数；升级前记版本 |
| 启动就崩 | 新装节点包依赖冲突 | 日志找报错包名 → Manager 禁用它；二分法排查 |
| 图质量突然变差 | 无意间改了 cfg/steps/底模，或 LoRA 叠多了 | 回到已知好的 PNG 配方，单变量重查（第 08 讲） |

## 课程结语

基础主线 00–15 至此闭环。回看这条路：从"学分布与采样"的第一性原理，到 DDPM 的 ELBO、采样器的 ODE、三大件与外挂件的架构，再到你 E:\AI 机器上每一个节点、每一个参数、每一条管线——**ComfyUI 的画布从头到尾就是原理篇那几页数学的可视化**。你现在拥有的不是一堆操作步骤，而是一张可维护的地图：新模型、新节点、新玩法出来时，你能判断它落在哪一层、改变了什么契约、该留下哪些版本和证据。16–22 讲再把这套方法扩展到视频、音频、3D 与声画联合工作流。

三个自然的下一步，按兴趣任选：**产量线**——把第 12/13 讲的 VRChat 管线跑成日常，攒素材库；**深度线**——用获得授权的角色截图训练第一个 LoRA（第 11 讲的预告；16GB 可进入低分辨率、合适精度与 batch 的实测队列，不对任意架构作保证）；**工程线**——写你自己的 API 批量脚本（第 3 节），把两台机器连成自动生产线。无论哪条，方法都是这门课反复练的那一句：**固定变量，单点实验，理解每一步为什么。**

祝出图愉快。

---

*工作流实验室页有全部 7 个配套工作流的加载说明与分级练习。*
