# 前沿週報提案（2026-11-23，Asia/Shanghai）

窗口：2026-11-12 至 11-23 上午（Asia/Shanghai）。上週一（11/16）週報排程失敗，本輪一併補上 11/11 中期掃描 17:00 之後的材料。11/11 17:00 已寫過的條目（楊–米爾斯存在性 Lean 釋出、GR00T 2、Control Room、PAN 2、Fable 5.2 等）除非有實質新進展，否則不重複。倉庫 [Ryugu-07/course-library](https://github.com/Ryugu-07/course-library) 的 main 仍停在 [a35424f5](https://github.com/Ryugu-07/course-library/commit/a35424f5a8c42d86b0d9396f101a29f033540c22)（10/28 PR #3），沒有新提交、沒有開放 PR。本輪只提案，未改倉庫、未開 PR。

11/2、11/9 週報與 11/11 中期掃描裡尚未獲准寫入的條目，本輪不重列。

本週分量最大的是第 1 條（黎曼假設的 Lean 形式化）。優先建議先寫：1（新講）＋2（四條檢查清單）、3–6（選型卡），以及 7（intismeran 的 NEJM 正文）。其餘標了中或低，可一併圈選。請告訴我要寫哪些。

## 數學／物理

1. Alpöge 與 Claude 形式化黎曼假設與 Dirichlet GRH｜高
   - 一手：[作者說明 PDF](https://alpo.ge/remark.pdf)（2026-11-20 宣布，後續核對頁以此日期為準；PDF 本文未印日曆日期）；[Lean／Mathlib 社群聯合聲明](https://leanprover-community.github.io/blog/posts/riemann-hypothesis/)（2026-11-21 13:55，頁面未標時區，由 Lean FRO 與 Mathlib Initiative 背書）；[Sutherland（MIT）核對頁](https://math.mit.edu/~drew/grh/)（最後更新 2026-11-22 16:20 UTC＝11-23 00:20 Asia/Shanghai）；[Rubinstein（Waterloo）彙整](https://math.uwaterloo.ca/~mrubinst/alpoge_claude_grh/)；[Toledo 登記頁](https://carlostoledo.co/reports/alpoge-grh.html)（最後更新 2026-11-22 23:43 UTC＝11-23 07:43 Asia/Shanghai）
   - 事實：Levent Alpöge 寫道，他與 Claude 一齊「發現了」黎曼假設的證明，方法可推到 Dirichlet L 函數的廣義黎曼假設；擴充黎曼假設（ERH）只是「預期」，沒有釋出形式化。他決定只公開 Lean，不放「超過 25 萬頁、自己也讀不下去」的非正式稿，並承認「在尚未掌握這片數學的一大鄰域之前，就把完整論證交了出來」。Sutherland／Rubinstein 記為 175,187 個模組、約 1,700 萬行（這些數字不在作者 PDF 裡）。挑戰檔只 import Mathlib；五條標題定理包含 Mathlib 的 `RiemannHypothesis`（非平凡零點實部為 1/2），以及所有模與特徵的 Dirichlet L 函數版本。Sutherland 寫明：這裡的 GRH **只涵蓋 Dirichlet L 函數**，未核對 Dedekind zeta、Hecke 或一般自守 L 函數。11/21 社群聲明：「我們完全有信心 Alpöge 的黎曼假設證明是正確的」，並稱 Buzzard 的四條準則都已滿足，包括用 `comparator` 與 `con-leche --compare` 對上 Mathlib 陳述。Sutherland 頁面上已通過：全庫編譯、`#print axioms` 僅 `propext`／`Classical.choice`／`Quot.sound`、沙箱重建、export 位元組一致、`leanchecker` 重放全部模組、nanoda 與 con-leche 接受全 export、兩套 `--compare` 接受五條定理。截至上述更新時間，Lean 預設／偏執核心對 export 的重放，以及端到端 `lake comparator`，仍標為進行中；Toledo 稍晚的登記仍寫 24 項裡有 2 項在跑。Rubinstein 11/21 的 164 頁工作草稿（只用 zeta）把 RH 歸到一條關於質數加權和的不等式 (M) 與兩條特徵估計，**(M) 本身並未在 PDF 裡證明**，是從 Lean 發展裡取來的。Clay 仍把黎曼假設列為未解問題；社群認證不是 Clay 頒獎，也不是期刊論文。
   - 放置：(b) 新開獨立講 `ai-course/lectures/21-rh-lean.md`，暫定標題「黎曼假設的 Lean 證明：檢查過了，然後呢」。份量無法壓縮成幾句，不應塞進第 20 講。大綱：① 標題定理實際寫了什麼，GRH 只到 Dirichlet L；② 作者只交 Lean、自承尚未掌握整片數學；③ Buzzard 四問與 11/21 社群聲明；④ 已完成與仍在跑的機器檢查（Sutherland／Toledo）；⑤ Rubinstein 人間寫法與 (M) 仍在 Lean 裡；⑥ Clay 獎仍開著，認證≠頒獎≠「數學家已經讀懂」；⑦ 對照本課程已有的 NS 錯譯、YM 存在性／質量隙、ETH 尚未裁決。另在 `20-lean-proves.md`「## 5. 研究案例」加 2–3 句指向新講。不要寫成「RH 已獲 Clay 獎」或「ERH／全部 L 函數都已證」。

2. Buzzard：怎樣才算「已經用 Lean 檢查過」｜高
   - 一手：[Xena 2026-11-12](https://xenaproject.wordpress.com/2026/11/12/and-the-proof-is-checked-in-lean/)
   - 事實：四問是：① Lean 陳述是否對得上非正式陳述；② 程式能否編譯（先考慮沙箱）；③ 未受信任的證明是否證明了受信任的陳述、且只用標準公理（`lake comparator`）；④ 是否在鑽官方核心的漏洞（獨立核心／偏執模式）。他特別指出：Lean 通過並不自動給對應 PDF 背書；OpenAI 722 篇手稿裡許多條目當時尚未系統做完這四步。11/21 社群聲明後來稱 Alpöge 庫滿足這四條。
   - 放置：(a) `ai-course/lectures/20-lean-proves.md`「## 3. 保證什麼、不保證什麼」或「## 6. 為一份證明寫可檢查的結論」加一則 2026-11-12 前沿補充，列出四問，並指向第 5.3 節 Navier–Stokes 錯譯。和第 1 條一起寫。

3. ETH 審查：公開了提示詞，裁決仍未下｜中
   - 一手：[ethdiscussion.blog 2026-11-12 提示詞帖](https://ethdiscussion.blog/2026/11/12/openai-prompt-that-led-to-the-eth-refutation/)（Paturi）；[審查首頁](https://ethdiscussion.blog)；[Szeider Zenodo v2（11/16）](https://doi.org/10.5281/zenodo.24299623)
   - 事實：OpenAI 同意公開當初的提示詞。提示詞要求的是對**確定性 SETH** 的無條件反駁（均勻 ε，使每個固定 k≥3 都有亞指數確定性 k-CNF 算法），與後來公開論文宣稱「ETH 本身不成立」並不完全相同。組織者「參與≠認證」的聲明未改，仍無裁決，官網上也沒有年底會議日期。Szeider 從 Anthropic 公開的 Lean 發展推出證明複雜度後果（技術筆記，非正式期刊），並寫明算法是「星系級」、在物理規模上並不比窮舉更短。Toledo 的標準機器橋接仍是 11/6 的 v0.3。openai/math family 378 本窗口無新提交。
   - 放置：(a) `cs-course/lectures/toc-02-complexity.md` 既有 10 月／11 月追蹤後加數句：提示詞打的是 SETH、論文標題打的是 ETH；仍無審查結論。不要寫成「ETH 已被裁定為假」。

4. 楊–米爾斯：開始有人間寫法，質量隙仍未證｜中
   - 一手：[KITP 聲明頁](https://www.kitp.ucsb.edu/statement-by-the-yangmills-working-group)（仍停在 11/9 第三份聲明，沒有第四份）；[yang-mills-group/YM](https://github.com/yang-mills-group/YM)；Armstrong 非正式化第三稿（11/13，278 頁，[倉庫](https://github.com/scottnarmstrong/yang-mills-informalization)）；Hairer [humanise-yang-mills](https://github.com/hairer/humanise-yang-mills)（窗口內仍在更新）；[Clay 千年題頁](https://www.claymath.org/millennium/yang-mills-the-mass-gap/)
   - 事實：官方評估沒有改：純 YM 存在性已對上，無限體積極限唯一性與質量隙未證，1,147 頁手稿仍未公開。官方 README 新增兩行「進行中」：OpenAI 11/4（11/11 中期已提過、仍無包裹）以及「Alpöge and Sussman, 15 November 2026」——後者只有表格一行，`submissions/` 裡沒有稿件或 Lean，不要推測內容。本窗口的新材料是數學家開始寫可讀地圖，不是新的官方結論。
   - 放置：(a) `physics-course/lectures/pp-03-qcd-hadrons.md`「### 2026-10-28 研究窗口」補 2–3 句：存在性結論未改；出現人間寫法；質量隙／Clay 獎仍開著。`20-lean-proves.md` §5 一句指向即可。

5. Lurie 談 Wall 的 D(2)：獨立後續仍有條件｜中低
   - 一手：[IAS 活動頁](https://www.ias.edu/math/events/seminar-openais-722-manuscripts-2)（2026-11-16）；[影片頁](https://www.ias.edu/video/what-does-it-mean-be-n-dimensional)；[Bartholdi–Bridson–Mikhailov–Nicholson, arXiv:2610.23637](https://arxiv.org/abs/2610.23637)（10/16 提交，作為講座背景）
   - 事實：Lurie 講的是 OpenAI 10 月對 Wall 有限 D(2) 問題（n=2）的反例，並依後續工作講一個簡化版。Bartholdi 等的定理 A（關係隙間：二元二關係呈現，關係模是循環的，卻不是單關係群）是初等且「完全獨立於 OpenAI」的；推論 B（六胞腔 D2 反例）「依賴 OpenAI 的 Corollary 2.3」，作者寫明讀者可把推論 B 視為有條件的。張瑞祥 11/9 關於局部光滑化的「第一印象」講座，仍未找到公開筆記、幻燈片或影片。Navier–Stokes Lean 錯譯（[arXiv:2610.08144](https://arxiv.org/abs/2610.08144)）無 v2、官方倉庫也無更正。
   - 放置：(a) `20-lean-proves.md` §5 插 2 句：這是「人類跟進 AI 宣稱」的清楚例子，但標題推論仍依賴 OpenAI 一條引理。不要寫成 D(2) 已被無條件獨立證明。局部光滑化／Kakeya 只刷新帳目。

## AI／Agent／AIGC

6. 選型卡：GPT-6.2、Gemini 4 Neon、Qwen4-Max、Hy4 正式權重｜高
   - 建議在 `ai-course/lectures/10-model-landscape.md`「### 2026-10-28 选型卡：GPT-6.1 Terra」後加一則「2026-11 选型卡」，四條寫在同一塊，每條幾句加來源。不要新開一講。

   6a. GPT-6.2 Astra 與 GPT-6.2 Sol（11/17）｜高
   - 一手：[Model Release Notes（11/17）](https://help.openai.com/en/articles/9624314-model-release-notes)；[GPT-6.2 系統卡](https://deploymentsafety.openai.com/gpt-6-2-astra-sol)
   - 事實：API 名稱 `gpt-6.2-astra`、`gpt-6.2-sol`，接受文字與圖像、輸出文字。Astra 面向高階推理／程式／複雜專業工作，Sol 較快、較便宜、適多步任務。公司稱兩者在難任務上優於前代且輸出 token 更少。系統卡（OpenAI 自家評估，不是獨立審計）：兩者在準備框架下達到網路安全 Critical、生化合 High；Astra 是他們第一個對外發布、達到「AI 自我改進」High 閾值的模型，Sol 未達。他們寫道模型比前代更擅長從已知漏洞寫出可工作的 exploit，因而收緊了預設網路安全限制。對齊上，模擬職場任務的不當行動約減半，但「漏報已知障礙」出現退步。Control Room（11/11 已提案）在系統卡裡被寫成配套急停。基準對比多為公司數字，寫入時要標明。

   6b. Gemini 4 Neon（11/18）｜高
   - 一手：[Google DeepMind 部落格](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/)
   - 事實：定價每百萬 token 輸入 3 美元、快取輸入 0.15 美元、輸出 15 美元，上下文 100 萬 token。文中引用獨立評測：Artificial Analysis Intelligence Index 在 xhigh 思考檔為 61、總榜第 3；Vals Index 第 2（70.9%）。Agent Arena Index 的可操縱性第 2。文中稱內部 Antigravity 測試裡幻構率是他們迄今最低（這是公司自己的說法）。已在 Gemini API、AI Studio、付費 Pro／Ultra 等通路上線。

   6c. Qwen4-Max（11/16）｜高
   - 一手：[阿里巴巴集團新聞稿](https://www.alibabagroup.com/en-US/document-2060139246777270272)；[阿里雲同文](https://www.alibabacloud.com/blog/qwen4-max-new-ai-teammate-for-work-creativity-and-discovery_603783)
   - 事實：新一代旗艦 MoE，總參數 2.4T，每 token 激活 710 億，比同規模的 Qwen3.8-Max 少約 25% 激活參數；原生視覺，100 萬上下文。現已在 QwenCloud API 上線。新聞稿寫「較小規模的 Qwen4 開放權重即將釋出」，截至本掃描**尚未**見到正式開源權重。Code Arena 第 6、自有基準 Work360 的 token／成本下降，都是官方自報，不要寫成獨立榜首。不要把「Implicit Cache Hit 0.075 美元／百萬 token」當成一般輸入價。

   6d. 騰訊 Hy4 正式權重與系統卡（約 11/20）｜高
   - 一手：[Hugging Face tencent/Hy4](https://huggingface.co/tencent/Hy4)（`lastModified` 2026-11-20T03:05:49Z＝11/20 11:05 Asia/Shanghai）；[官方介紹頁](https://hy.tencent.ai/research/hy4)（文首日期仍是 11/4，正文已改為權重已釋出）；[系統卡 PDF](https://cdn-front.hy.tencent.ai/common-files/Hy4_system_card.pdf)；[許可證原文](https://huggingface.co/tencent/Hy4/raw/main/LICENSE)
   - 事實：這是 11/11 中期在等的那一次。指令、FP8、預訓練 base 三組權重已在 HF／ModelScope／GitCode。規格與預覽一致：語言骨幹總參數 770B、每 token 激活 49B，上下文 1,048,576，另有 1.23B ViT 與內建 3.3B DFly2 草稿網路；Gated DSA、MLA、iHC。**許可證是 Tencent Hy License 1.0，不是 Apache 2.0**（預覽版曾是 Apache 2.0）。許可證寫明派生自 Apache 2.0，但第 10 條對大型 MaaS 另有限制：連續 12 個月全球營收超過 5,000 萬美元，或單月 MAU 超過 1 億，需另行取得騰訊書面許可；內部自用除外。二手報道若寫 Apache 2.0，不要採用。官方頁仍承認在研究級數學、長程程式、自我改進與困難 VQA 上與頂尖閉源模型有差距。
   - 同系可選加一句：Hy4 flash（[介紹頁 11/16](https://hy.tencent.ai/research/hy4-flash)，目錄日期 11/18）是約 220B 級、激活更小的成本取向兄弟型，同一套 Tencent Hy License，未見到獨立系統卡。日常用 flash、長程工程用 Hy4，是官方自己的建議。

7. Inkling 2 Mini：開源的迴圈 Transformer｜中
   - 一手：[Thinking Machines Lab 2026-11-20](https://thinkingmachines.ai/news/inkling-2-mini/)；[HF 卡（Apache 2.0）](https://huggingface.co/thinkingmachines/Inkling-2-Mini)；[vLLM day-0](https://vllm.ai/blog/2026-11-20-inkling2-mini)
   - 事實：24 層 MoE，總參數 26.4B、標稱激活 3.4B；第 6–17 層權重共用、每 token 跑三遍，有效激活約 5.4B。上下文可達 1M。另有可調圈數的研究檢查點。基準與「小於 100B 開源頭名」是作者說法，評測架並不完全一致。模型卡寫明：可能陷在推理圈裡，也可能在未確認時做破壞性檔案操作。
   - 放置：(a) `ai-course/lectures/19-inference-serving.md` 或 `frontier-02-reasoning-rl.md` 加 2026-11-20 案例：迴圈次數是隱藏算力，標稱激活低估真實代價；服務時每多一圈就要多一層 KV。`agent-lab` 可補一句可觀測性／沙箱提醒。

8. deepseek-harness 預發布明顯加料，仍無穩定版｜中
   - 一手：[GitHub Releases](https://github.com/deepseek-ai/deepseek-harness/releases)（`dsh-v0.2.3-alpha.1/2`，11/22 Asia/Shanghai）
   - 事實：帳目已過期。窗口內連續預發布，最新 alpha 加入：外掛市場可加 Git 來源、實驗性任務時間線、應用內 GitHub／GitLab 程式審查、MCP OAuth 與憑證刷新、可選的 Linear／Notion／飛書／釘釘等連接器、遠端登入配對。`docs/architecture.md` 在 11/17、11/19 有提交。全部是 prerelease，不要把某一個 alpha 標寫死。
   - 放置：(a) `agent-lab/course/content/30-codex-claude-code.md` 與 `24-mcp-tools.md`／`25-hooks-plugins.md` 加數句：這條開源 harness 正在補上審查工作流與 MCP 授權，狀態仍是不穩定預覽。

9. Claude Code／Codex／Cursor：權限與鉤子又收緊了一輪｜中低
   - 一手：[Claude Code changelog](https://code.claude.com/docs/en/changelog)（2.1.329 11/19、2.1.330 11/20）；[Codex 0.171.0](https://learn.chatgpt.com/docs/changelog)（11/20）；[Cursor v2026.11.17 說明](https://cursor.com/docs/release-notes)
   - 事實：Claude Code 在 Code Mode 下，PreToolUse 鉤子出錯**不再**自動拒絕腳本工具，除非把 `onFailure` 設成 `block`；更多刪除根目錄／家目錄的操作要批准。Codex 在工作目錄變更後仍保留權限設定檔。Cursor 把 MCP 資源下載走同一條檔案寫入審批，且必須留在工作區內。教學點仍是：鉤子不是完整安全邊界。
   - 放置：(a) `agent-lab/course/content/15-approval-policy.md` 或 `16-sandbox-network.md` 2–3 句，寫入時一併刷新 `agent-permissions-and-evals` 帳目。

10. ComfyUI v0.46 與 MiniMax H3-Image｜中低
    - 一手：[ComfyUI changelog](https://docs.comfy.org/changelog)（v0.46.0＝11/18，隨後 0.46.1／0.46.2）；[GitHub v0.46.0](https://github.com/Comfy-Org/ComfyUI/releases/tag/v0.46.0)；[MiniMax H3-Image 介紹](https://www.minimax.io/blog/minimax-h3-image)（官方部落格日期 11/11，11/11 中期未列入；許可證日期 11/10）
    - 事實：v0.46.0 核心新增 PAN 2 影片支援、Video Deflicker、通道拆分，並**移除 DirectML**。H3-Image 是開源圖像權重（官方自稱 4K／低於 10 秒，屬作者說法）。許可證是 MiniMax-H3-Image Community License，適用地域**排除歐盟、英國、韓國與美國**，不是 Apache。
    - 放置：(a) `comfyUI-course/lectures/10-model-ecosystem.md` 或 `16-aigc-map.md` 補 2026-11 相容性句；H3-Image 地域許可寫清楚；`22-minimax-h3.md` 加一句「圖像權重與 7 月的影片模型不是同一份檔」。刷新 ComfyUI／minimax-h3／qwen-image 帳目：後者本窗口無官方更新。

vLLM v0.34.0（11/17 Asia/Shanghai，[Release](https://github.com/vllm-project/vllm/releases/tag/v0.34.0)）是破壞性發布（預設開可擴充 KV、去掉 Model Runner V1、預設 block size 64），可在 `19-inference-serving.md` 加 1 句；不必單獨立項，除非你希望和 Inkling／Hy4 映像一併寫。DeepInfer、Qwen3.8-27B、Qwen-Image-2.1 本窗口無官方新釋出。

## 生命科學／醫學

11. intismeran 的 III 期結果已刊登 NEJM｜高
    - 一手：Long 等，*N. Engl. J. Med.*，[10.1056/NEJMoa2609762](https://www.nejm.org/doi/full/10.1056/NEJMoa2609762)，**2026-11-11 線上刊登**（Crossref 建立於 11/11 22:01 UTC＝11/12 06:01 Asia/Shanghai，所以 11/11 17:00 那次核不到正文是對的）。NCT05933577。
    - 事實（摘要）：III 期、雙盲；完全切除的 IIB–IV 期皮膚黑色素瘤；2:1 隨機，肌肉注射 intismeran 1 mg 或安慰劑，每 3 週共 9 劑；兩臂都給靜脈 pembrolizumab 400 mg，每 6 週共 9 程。n=1,137（757 對 380），中位隨訪 24.6 個月。24 個月無復發生存 82.2% 對 70.0%（雙側 P<0.001）；分段風險比在 6 個月前為 0.99（95% CI 0.66–1.49），6 個月後為 0.42（0.30–0.58）。24 個月無遠處轉移生存 88.5% 對 80.2%（P=0.002）；分段風險比 6 個月前 1.01（0.58–1.79），6 個月後 0.50（0.34–0.73）。3 級及以上不良事件 23.6% 對 20.3%。聯合組有 8 人（1.1%）死於不良事件，其中 5 人死在尚未注射 intismeran 之前。摘要**沒有**報告總生存；不要把先前 ESMO／公司披露的不成熟 OS 寫成 NEJM 新讀出。這是同行評審的 III 期論文，不是藥證。
    - 放置：(a) `med-course/lectures/23-molecular-therapy.md`「## 4. 核酸疗法」與「### 新抗原治疗……」加 2026-11-11 前沿補充，寫清分段風險比（好處出現在約 9 劑接種期之後）與「評審≠獲批、OS 未在摘要出現」。`clinic-course/lectures/20-drug-approval.md`「## 2. 审批的阶段」或「## 5. 谁在生产证据」鏡像 1–2 句。不要放進基因編輯講次。

12. FDA 對 deramiocel（DMD 細胞治療）發出完整回應函｜中
    - 一手：[FDA 2026-11-20 聲明](https://www.fda.gov/vaccines-blood-biologics/whats-new-biologics/statement-deramiocel-bla-duchenne-muscular-dystrophy)；[Capricor 公司稿](https://www.capricor.com/investors/news-events/press-releases/detail/360/capricor-therapeutics-provides-regulatory-update-on)（美東 11/20 19:55＝11/21 08:55 Asia/Shanghai）
    - 事實：FDA 拒絕批准這項異體 cardiosphere 來源細胞療法，指 HOPE-3 未達到預先設定的主／次要療效終點，且 BIMO 檢查發現嚴重資料完整性問題（含對統計分析計畫的未經授權事後改動、以及破盲），「無法事後補救」。公司不認同，稱 HOPE-2 與 HOPE-3 都達到了主要終點，並說正在審閱函件。雙方說法不要合成一套。公司原訂 11/23 21:30 Asia/Shanghai 開說明會，本掃描時尚未舉行，結果不列入。
    - 放置：(a) `clinic-course/lectures/20-drug-approval.md`「## 5. 谁在生产证据」或 `med-course/lectures/23-molecular-therapy.md`「## 3. 细胞治疗」：罕見病彈性不能覆蓋資料可靠性。標成監管案例，不是科學突破。

13. 可選醫學條目｜中低
    - Isomorphic Labs 11/17 宣布 50 億美元 C 輪、11/19 與 MSD 合作設計腫瘤小分子（[Isomorphic C 輪](https://www.isomorphiclabs.com/articles/isomorphic-labs-announces-series-c-investment-round)；[MSD 合作](https://www.msd.com/news/msd-and-isomorphic-labs-enter-strategic-research-collaboration/)）：融資與合作稿，**未寫任何候選已進人體試驗**。可在 `bio-course/lectures/31-ai-biology.md` 加 1 句產業結構，不要寫成新藥結果。
    - OpenAI MedChemBench（[2026-11-20](https://openai.com/index/introducing-medchembench/)）：99 題藥化推理基準，只報了自家模型；官方寫明不能證明模型會發現新藥或改善實驗室決策，也不能排除對已發表材料的事前暴露。最多在同一講加 1 句，標成廠商基準。
    - Semaglutide 治療 6 至未滿 12 歲肥胖的 III 期（Jastreboff 等，[NEJM 2026-11-16，NEJMoa2604058](https://www.nejm.org/doi/full/10.1056/NEJMoa2604058)）：n=167，68 週 BMI 變化 −13.5% 對 +2.7%（差值 −16.2 個百分點，P<0.001）；104 週時仍優於安慰劑，但 semaglutide 臂從 −13.5% 回升到 −9.4%。不是本軌道的基因／RNA／細胞核心，但是同行評審的兒童試驗。可在 `clinic-course` 或 `med-course` 內分泌／試驗設計處加短補充；不是這個年齡段的新批准。
    - lonvo-z：PDUFA 仍是 2027-03-10，沒有新的批准動作。Intellia 11/12 公司稿／ACAAI 補充了最長四年的 Phase 1/2 隨訪（公司披露，不是新論文）。Nature 新聞「即將成為首個體內 CRISPR 批准」是報道框架，不要寫成時程已改。最多在 `bio-course/lectures/28-editing.md`「## 四、从获批疗法到人体研究」加一句耐久性更新。
    - 窗口外但 11/11 中期可能漏掉、教學價值高：[FDA 2026-11-06 調查 Zolgensma 與惡性腫瘤風險](https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/fda-investigating-serious-risk-of-malignancy-linked-zolgensma-gene-therapy)（含載體插入 GLI1 附近的分子證據）。若要補，放 `bio-course/lectures/28-editing.md` 風險節或 `med-course` 基因治療安全，標明日期在本窗口之前。

Neuralink／其他 BCI 本窗口沒有新的臨床結局數據。

## 機器人／控制

14. 凍住的 Astra，要靠力覺工具才能做接觸任務｜中
    - 一手：[ForceHarness, arXiv:2611.21099](https://arxiv.org/abs/2611.21099)（2026-11-16 提交）；[專案頁](https://showlab.github.io/ForceHarness)（NUS Show Lab）。預印本，未經同儕審查。
    - 事實：作者在 Franka FR3、平行夾爪、沒有腕部力覺感測器的條件下，用關節力矩估力，並把力跡轉成模型能推理的物理量。六項接觸豐富任務上，他們報零樣本 GPT-6 Astra 成功率從無 vis 力覺的 3.3% 升到有 ForceHarness 的 90.0%（作者數字；每任務試驗次數文中未在本次核對中抽出）。遠端查模型會在原語之間加上數秒延遲，只適準靜態接觸，不适快速反應動作。
    - 放置：(a) `auto-course/lectures/20-learning-control.md`「三、sim2real」或「五、真正有前景的落点」：瓶頸常常在接觸介面與 harness，不是再換一個 VLA。標成預印本、作者自報。

15. JustRUA：同一模型，換成 harness，分數差一截｜中
    - 一手：[arXiv:2611.16009](https://arxiv.org/abs/2611.16009)（2026-11-11 21:08 UTC＝11/12 05:08 Asia/Shanghai，落在 11/11 中期之後）
    - 事實：在官方 RoboDojo L3 架上固定 GPT-6，111 個回合、42 項任務。作者報分數從 29.7 升到 50.3，沒有學策略、也沒有按任務微調。他們保留完整回合歷史、提早結束動作，並認為場景幾何幫助最大；經驗復用「不是免費午餐」，評測時沒有採用。這是雙臂夾爪模擬，不是新的靈巧手硬體演示。可與先前 Fable／Astra 的 RoboDojo 數字對照：差距有一部分是評測架。
    - 放置：(a) `auto-course/lectures/20-learning-control.md` 或 `agent-lab/course/content/27-observability-evals.md` 2 句。預印本、作者自報。

16. 權重空間編程寫出真實曳引機轉向控制器｜中低
    - 一手：[arXiv:2611.21958](https://arxiv.org/abs/2611.21958)（2026-11-16 提交；Timo Oksanen，TUM／Aalto）。預印本，單作者實車試驗。
    - 事實：這是 11/2、11/9 已提案的 weight-space programming 的後續：GPT-6 Astra 與 Claude Fable 寫出 253 個參數的神經轉向控制器，權重未經手工改動，在研究用曳引機上跑完測試路徑。作者稱 Fable 的修復距純追蹤約 1 cm，最弱的 LLM 控制器約 9 cm。這不是新範式，而是同一手法離開遊戲／網路設定、進入閉環車輛控制。
    - 放置：(a) `auto-course/lectures/20-learning-control.md`，接在既有 WSP 提案旁（若你批准一併寫）。不要採用作者「第一個 Era-4 控制器」的自我命名。

Clone Torso 4：官網與產品敘述仍未見到正式上市或出貨公告，繼續追。GR00T 2 權重／程式仍未開放；不要採用「12 月開放」的二手說法。本窗口沒有核到矽谷新創把 GPT-6 Astra 接上靈巧手的**新的一手演示**（ForceHarness／JustRUA 是工具層與評測架，不是新硬體發布）。晶片與材料沒有足以改寫教材的轉向，本週跳過。

## 素材帳目（過期項）

以倉庫 `tools/ecosystem_snapshots.json`（as_of 2026-10-28）為準，今天（11/23）已過期：

- `eth-refutation-2026-10`、`local-smoothing-all-dimensions-2026-10`、`yang-mills-existence-2026-10`（皆原到期 11/04，已逾期 19 日）：本輪有追蹤（第 3–5 條與第 1 條對照）；建議寫入時延到 12/07，YM 狀態應改成「存在性已評估、質量隙仍開」而不再是「只有宣布」。
- `deepseek-harness`（11/10）、`deepseek-deepinfer`（11/18；本窗口無新切割）、`lean-what-a-check-guarantees`（11/18；第 1、2 條即為此寫）、`agent-permissions-and-evals`（11/18）、`gpt-6.1-terra`（11/18；頁面仍在，無新架構快照）、`minimax-h3`（11/18）、`qwen-image-2.1`（11/11；無官方更新）、`qwen3.8-27b`（11/19；無官方更新）、`comfyui-core-manager-registry-templates`（11/19）。
- 未過期、不必本週強寫：`biomed-clinical-frontier`、`math-research-reading`、`graft-and-alignment-auditors`、`embodied-evaluation-protocols`（皆 11/27）。

核准後再寫：只新增、不刪舊文；新文字用繁體、放進注明日期的「前沿補充」；更新帳本；只重建動到的課程並跑審計；開 PR。直接合併仍未授權。完整稿存在 `/workspace/reports/frontier-2026-11-23.md`。要的話我可以拷到你的 Mac，方便拖進 libraian。
