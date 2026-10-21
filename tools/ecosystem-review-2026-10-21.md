# 2026-10-21 前沿批次的來源核驗

抓取發生在 2026-10-20 UTC（北京時間已是 2026-10-21）。賬本裡本次改過的 `verified_on` 寫 2026-10-20，與 HTTP 響應日期一致。沒有下載模型，沒有在 4060 Ti 上推理，沒有重跑 Lean 或 DeepInfer 的性能圖。

## 寫入課程的核對

- OpenAI 數學發佈：博客只確認 2026-10-06 的發佈說明。719 篇、372 族、未發佈內部模型、約 42% 來自 [openai/math README](https://github.com/openai/math)；300/719、3 篇因符號錯誤撤回、14 篇修訂來自 [history.md](https://github.com/openai/math/blob/main/history.md) 的 2026-10-07 條目。Lean 工具鏈為 `lean/lean-toolchain` 中的 `leanprover/lean4:v4.34.1`，核對方式按倉庫指向 [leanprover/comparator](https://github.com/leanprover/comparator)。071、084、361 的範圍按各自 `lean/docs` 原文轉述，沒有把 071 寫成“只證了剛性方向”。三篇撤回稿的標題不在當天的 `formalization.yaml` 來源列表中。
- Navier–Stokes 錯譯：[arXiv:2610.08144](https://arxiv.org/abs/2610.08144) 的 Example 3.1 對比 Lemma 8.6 式 (8.19) 的 $m+4$ 與 Lean 的 $m+5$，並寫明不對英文證明的正確性下判斷。OpenAI 宣佈頁本次返回 403，正文因此不寫 2026-09-08 這個日期。
- 費馬大定理形式化：只採用 Buzzard 2026-09-04 的第一人稱記錄（comparator 通過、超過 1340 萬行、11 天、順著 Darmon–Diamond–Taylor）。沒有另找 Anthropic 公告來改這些數字。
- AHM 聲明是陶哲軒博客上的客座轉載。正文沒有寫成“陶哲軒本人批評”。
- MiniMax H3：模板提交 `fc427f0009`（2026-09-22）把視頻 VAE 換成 int8。四件套字節來自 Hugging Face tree API，十進制合計 40,073,842,159（約 40.1 GB）。舊 42.5 GB 保留，並註明精確字節合計 42.47 GB。模板註釋裡的 2.62 GB 是同一 int8 文件的 GiB。`pruned_w6a8` 為 15,983,746,636 字節，但不是當前 T2V 模板默認文件。Union 2.0 權重在模型倉庫，當前 fun-controlnet 模板仍指向較早的 union int8 文件。LightVAE 只記 v0.41.0 的加載支持，沒有峰值顯存數字。許可鏈接仍是 MiniMax H3 Community License。
- Qwen-Image-2.1-Turbo：官方 README 新聞日期 2026-10-09，8 步，默認 CFG 1，許可證名 `qwen-research`。Comfy 模板提交是 2026-10-13，不是研究筆記裡的 10-14。union fun ControlNet 與 tiny VAE 的核心支持在 ComfyUI v0.38.0；tiny VAE 權重是 taesd 的 `.pth`，不在三件套目錄。int8/int4 cache 崩潰修復寫在 v0.39.0 發佈說明，沒有復現。OpenVINO 條目在 README 中標為 2026-09-20。`templates/` 下沒有 2.1 ControlNet 模板 JSON。
- DeepInfer 與 deepseek-recipe：範圍、缺省的 KV cache / 分離式 prefill-decode / 副本均衡、Apache-2.0 與 MIT，均按兩個倉庫 README 與 LICENSE。性能圖標為作者自測。前綴命中規則與 `deepseek-flash` 的命中/未命中價格來自 DeepSeek API 文檔當天頁面；1/50 是用價目表兩行相除，並寫明價格會變。DeepInfer 不包含 KV cache，因此沒有把命中計價算進該倉庫。
- DeepSeek Harness：README 仍為 developer preview、MIT。最新標籤 `dsh-v0.2.1-rc.2`，對應提交 2026-10-17。架構文檔仍有 Cordis、profile/bundle、會話日誌、guarded tool；Desktop 寫成 Electron 宿主。webhook 行仍在“新行為放哪裡”的表裡，所以沒有寫成“webhook 已刪除”。
- SWE-agent：README 警告寫明 mini-swe-agent 已取代它。main 上能看到的最近提交是 2026-07-16。mini-swe-agent 最新 release 仍是 v2.4.6（2026-07-23），README 仍描述約百行、僅 Bash、線性歷史、`subprocess.run`。沒有核實“橫幅從 2026 年 2 月就在”這一句。
- Qwen3.8-27B：GitHub 最近提交 2026-08-17；模型卡仍是 Apache-2.0、image-text-to-text，並寫明兼容 Transformers、vLLM、SGLang。AI 第 10/19 講正文未改。
- ComfyUI：發佈記錄 v0.42.1 的 `created_at` 為 2026-10-18T22:58:57Z，`published_at` 為 2026-10-19T01:33:54Z。課程裡的 0.22 與 v0.33.1 仍是歷史安裝快照。列出的 docs.comfy.org 頁面當天均返回 200；沒有逐段對照舊講義裡的每一句界面說明。

## 研究筆記裡未寫入正文的說法

- SWE-bench “v5 CLI 必須帶 `--task-repo`，結果在 `logs/evaluation/<run_id>/results.json`”：當天的 `run_evaluation.py` 參數表沒有註冊 `--task-repo`，雖然 `main()` 有同名參數，錯誤字符串裡也提到這個旗標。日誌目錄常量是 `logs/evaluation`，單實例報告是 `report.json`，運行元數據是 `run.json`，文件中沒有 `results.json`。
- Multimodal v2、480 題、2026-09-01 起：未在數據集卡或上述腳本裡核到 480 這個數。Hugging Face 上 `SWE-bench/SWE-bench_Multimodal` 的 `lastModified` 是 2026-08-18。正文不寫。
- “峰值顯存下降”：LightVAE 與 int8 VAE 的發佈說明都沒有給出本課可以引用的顯存測量。
- DeepSeek Harness 從 0.1.5 到 v0.2：只確認了當前最新標籤，沒有逐個審計更早標籤。
- 能源材料與計算材料兩條賬本到期日是 2026-10-24。本輪沒有重讀 CATL、NREL 與 Nature 正文，`verified_on` 保持 2026-08-25。

## 驗收

只重建 ai-course、comfyUI-course 與 agent-lab，並只提交源文件有改動的頁面。全庫 `python tools/course_audit.py` 通過（801 個源、876 個 HTML）。`python tools/learning_coverage.py` 通過。`python tools/ecosystem_freshness.py --strict` 在 2026-10-20 通過：12 條記錄，0 條過期；能源材料與計算材料仍是 due-soon（到期 2026-10-24），因為本輪沒有重讀它們的來源。ComfyUI 構建器對原有 7 份 UI 與 7 份 API 工作流的 286 項合同檢查通過。沒有跑全庫的數值實驗腳本，也沒有做瀏覽器實測。
