# 2026-10-21 前沿批次的来源核验

抓取发生在 2026-10-20 UTC（北京时间已是 2026-10-21）。账本里本次改过的 `verified_on` 写 2026-10-20，与 HTTP 响应日期一致。没有下载模型，没有在 4060 Ti 上推理，没有重跑 Lean 或 DeepInfer 的性能图。

## 写入课程的核对

- OpenAI 数学发布：博客只确认 2026-10-06 的发布说明。719 篇、372 族、未发布内部模型、约 42% 来自 [openai/math README](https://github.com/openai/math)；300/719、3 篇因符号错误撤回、14 篇修订来自 [history.md](https://github.com/openai/math/blob/main/history.md) 的 2026-10-07 条目。Lean 工具链为 `lean/lean-toolchain` 中的 `leanprover/lean4:v4.34.1`，核对方式按仓库指向 [leanprover/comparator](https://github.com/leanprover/comparator)。071、084、361 的范围按各自 `lean/docs` 原文转述，没有把 071 写成“只证了刚性方向”。三篇撤回稿的标题不在当天的 `formalization.yaml` 来源列表中。
- Navier–Stokes 错译：[arXiv:2610.08144](https://arxiv.org/abs/2610.08144) 的 Example 3.1 对比 Lemma 8.6 式 (8.19) 的 $m+4$ 与 Lean 的 $m+5$，并写明不对英文证明的正确性下判断。OpenAI 宣布页本次返回 403，正文因此不写 2026-09-08 这个日期。
- 费马大定理形式化：只采用 Buzzard 2026-09-04 的第一人称记录（comparator 通过、超过 1340 万行、11 天、顺着 Darmon–Diamond–Taylor）。没有另找 Anthropic 公告来改这些数字。
- AHM 声明是陶哲轩博客上的客座转载。正文没有写成“陶哲轩本人批评”。
- MiniMax H3：模板提交 `fc427f0009`（2026-09-22）把视频 VAE 换成 int8。四件套字节来自 Hugging Face tree API，十进制合计 40,073,842,159（约 40.1 GB）。旧 42.5 GB 保留，并注明精确字节合计 42.47 GB。模板注释里的 2.62 GB 是同一 int8 文件的 GiB。`pruned_w6a8` 为 15,983,746,636 字节，但不是当前 T2V 模板默认文件。Union 2.0 权重在模型仓库，当前 fun-controlnet 模板仍指向较早的 union int8 文件。LightVAE 只记 v0.41.0 的加载支持，没有峰值显存数字。许可链接仍是 MiniMax H3 Community License。
- Qwen-Image-2.1-Turbo：官方 README 新闻日期 2026-10-09，8 步，默认 CFG 1，许可证名 `qwen-research`。Comfy 模板提交是 2026-10-13，不是研究笔记里的 10-14。union fun ControlNet 与 tiny VAE 的核心支持在 ComfyUI v0.38.0；tiny VAE 权重是 taesd 的 `.pth`，不在三件套目录。int8/int4 cache 崩溃修复写在 v0.39.0 发布说明，没有复现。OpenVINO 条目在 README 中标为 2026-09-20。`templates/` 下没有 2.1 ControlNet 模板 JSON。
- DeepInfer 与 deepseek-recipe：范围、缺省的 KV cache / 分离式 prefill-decode / 副本均衡、Apache-2.0 与 MIT，均按两个仓库 README 与 LICENSE。性能图标为作者自测。前缀命中规则与 `deepseek-flash` 的命中/未命中价格来自 DeepSeek API 文档当天页面；1/50 是用价目表两行相除，并写明价格会变。DeepInfer 不包含 KV cache，因此没有把命中计价算进该仓库。
- DeepSeek Harness：README 仍为 developer preview、MIT。最新标签 `dsh-v0.2.1-rc.2`，对应提交 2026-10-17。架构文档仍有 Cordis、profile/bundle、会话日志、guarded tool；Desktop 写成 Electron 宿主。webhook 行仍在“新行为放哪里”的表里，所以没有写成“webhook 已删除”。
- SWE-agent：README 警告写明 mini-swe-agent 已取代它。main 上能看到的最近提交是 2026-07-16。mini-swe-agent 最新 release 仍是 v2.4.6（2026-07-23），README 仍描述约百行、仅 Bash、线性历史、`subprocess.run`。没有核实“横幅从 2026 年 2 月就在”这一句。
- Qwen3.8-27B：GitHub 最近提交 2026-08-17；模型卡仍是 Apache-2.0、image-text-to-text，并写明兼容 Transformers、vLLM、SGLang。AI 第 10/19 讲正文未改。
- ComfyUI：发布记录 v0.42.1 的 `created_at` 为 2026-10-18T22:58:57Z，`published_at` 为 2026-10-19T01:33:54Z。课程里的 0.22 与 v0.33.1 仍是历史安装快照。列出的 docs.comfy.org 页面当天均返回 200；没有逐段对照旧讲义里的每一句界面说明。

## 研究笔记里未写入正文的说法

- SWE-bench “v5 CLI 必须带 `--task-repo`，结果在 `logs/evaluation/<run_id>/results.json`”：当天的 `run_evaluation.py` 参数表没有注册 `--task-repo`，虽然 `main()` 有同名参数，错误字符串里也提到这个旗标。日志目录常量是 `logs/evaluation`，单实例报告是 `report.json`，运行元数据是 `run.json`，文件中没有 `results.json`。
- Multimodal v2、480 题、2026-09-01 起：未在数据集卡或上述脚本里核到 480 这个数。Hugging Face 上 `SWE-bench/SWE-bench_Multimodal` 的 `lastModified` 是 2026-08-18。正文不写。
- “峰值显存下降”：LightVAE 与 int8 VAE 的发布说明都没有给出本课可以引用的显存测量。
- DeepSeek Harness 从 0.1.5 到 v0.2：只确认了当前最新标签，没有逐个审计更早标签。
- 能源材料与计算材料两条账本到期日是 2026-10-24。本轮没有重读 CATL、NREL 与 Nature 正文，`verified_on` 保持 2026-08-25。

## 验收

只重建 ai-course、comfyUI-course 与 agent-lab，并只提交源文件有改动的页面。全库 `python tools/course_audit.py` 通过（801 个源、876 个 HTML）。`python tools/learning_coverage.py` 通过。`python tools/ecosystem_freshness.py --strict` 在 2026-10-20 通过：12 条记录，0 条过期；能源材料与计算材料仍是 due-soon（到期 2026-10-24），因为本轮没有重读它们的来源。ComfyUI 构建器对原有 7 份 UI 与 7 份 API 工作流的 286 项合同检查通过。没有跑全库的数值实验脚本，也没有做浏览器实测。
