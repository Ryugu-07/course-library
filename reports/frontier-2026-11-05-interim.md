# 前沿中期掃描（2026-11-02 至 11-05，Asia/Shanghai）
只整理資料，沒有改倉庫、沒有開 PR。可信度：一手＝官方原文；確認＝一手加至少一個獨立來源；單一來源。

## 1. OpenAI 自動化 Linux 核心漏洞流水線：948 個本地提權 exploit（11/4）｜一手＋確認
- 摘要：自主流程依序做靜態掃描、動態重現、寫 PoC、評估可利用性、生成補丁，最後由人工審核再回報維護者。用的是一個尚未發布的 cyber 模型；10 月中跑了一次。
- 數字：2,308 個候選、重現 1,724 個、291 個資訊洩漏 PoC、948 個可用的 LPE exploit；API 花費 $1,213,430（每個 LPE 約 $1,279）。在 kernelCTF 環境拿到 21 個 LPE（花費約 $32,936）。至少有 10 種新的利用技巧。
- 來源：https://openai.com/index/a-thousand-fewer-paths-to-root ；https://www.aiaffairs.com/technology/openai-linux-scan-948-exploits-candidate-patches/ ；HN https://news.ycombinator.com/item?id=50372929
- 放置：agent-lab 安全相關章（16 sandbox／17 trustworthy 附近）插 2–3 句：發現漏洞已能規模化，瓶頸變成驗證和排優先級；cs-course 作業系統／安全章 1 句。也可以考慮在 ai-course 開一講「AI 與網絡攻防」。屬於插入；累積幾條後可獨立成講。

## 2. Anthropic FlashProve：大模型推理的零知識證明（11/2）｜一手＋確認（TechCrunch 11/3）
- 摘要：用 zkSNARK 證明「這段輸出確實由某組已承諾的權重產生」，同時不洩露權重。Claude 參與設計和實作；用 Lean 寫完備性、可靠性、零知識這幾個頂層陳述，並附一個 Lean 驗證器。以 Apache 2.0 開源。
- 數字：Llama 4 Maverick（400B MoE，4-bit），單張 H100 證明約 110 token/s；每 1,024 token 的請求證明約 18.78 MB；CPU 驗證約 17 秒；耗時約為 vLLM 推理的 70–95 倍。限制：只覆蓋整數模型和貪婪解碼，上下文最長 1,024 token。
- 來源：https://www.anthropic.com/research/provable-inference ；https://techcrunch.com/2026/11/03/anthropic-is-working-on-a-system-to-prove-ai-models-identity/
- 放置：ai-course 20-lean-proves「研究案例」插 2 句（Lean 只保證陳述被證明，陳述仍需人工審核，和 ETH 是同一課題）；agent-lab 17 trustworthy 插 1 句；cs-course 密碼學／複雜度章可以作為 IOP→SNARK 的實例。屬於插入。

## 3. Weight-Space Programming 的新進展：Astra 從零「寫」權重（11/2 部落格，本週擴散）｜一手（作者部落格＋日誌倉庫），未經同儕審查
- 變化：已知的是 Qwen 去重複補丁。另一部分是 Astra 在沒有訓練、資料和梯度的情況下，直接寫出一個 MinAtar Breakout 策略網路（600→32→32→6），得 517.4 分；PPO 訓練 5 億步只得 25.3 分（媒體寫成「1 億回合」，以一手為準）。它還能從權重判斷網路玩的是哪個遊戲。不過挑出諂媚模型這一項，需要同時看到注意力模式才做得到，單看權重不行。另外兩個遊戲落後於訓練最久的基線。
- 來源：https://rikiyat.github.io/blog/weight-space-programming/ ；https://github.com/RikiyaT/lm_understand-logs/blob/main/exp5_write_from_scratch/README.md ；二手 https://www.tokenpost.com/news/technology/47302
- 放置：跟原本的 frontier-03 條目合併，多寫一句「從零寫權重」。

## 4. OpenAI：Astra 做實體硬體工程（11/3）｜一手＋確認
- 摘要：兩名工程師用 GPT-6 Astra 加 Codex，一週內完成一台 Codex 互動裝置的外殼、PCB、韌體和 UI，代工廠不到一個月做出原型。但 Astra 漏掉了製造限制、公差和組裝細節，經過多輪人工修訂。文中也提到 BenchCAD 2.0，公開的細節很少。
- 來源：https://openai.com/index/accelerating-engineering-for-the-physical-world ；http://rits.shanghai.nyu.edu/ai/openai-tests-astra-on-hardware-design-from-pcb-to-prototype/
- 放置：agent-lab 結尾的應用章，或 auto-course 21「真實的困難」旁插 1–2 句（agent 跨進物理世界，失敗點在製造約束）。屬於插入。

## 5. Westlake Pinal：用自然語言設計蛋白質（Nature，11/3 報導）｜確認（Nature DOI 10.1038/s41586-026-11205-z，Phys.org）
- 數字：1.7B 條蛋白質–文本配對（來自 1.35 億條序列）。螢光蛋白生成 50,000 條、篩到 29 條，只有 1 條發光；H 蛋白 20 條中 5 條有效，最好的一條把固碳步驟產出提升到 1.7 倍。精確控制性質仍很難。
- 來源：https://phys.org/news/2026-11-ai-protein.html ；https://doi.org/10.1038/s41586-026-11205-z
- 放置：bio-course 蛋白質設計章插 2–3 句（命中率低，正好拿來講篩選漏斗）。屬於插入。

## 6. DeepMind Antigravity 化學資訊學 Skills（11/3）｜一手（單一來源，官方部落格）
- 摘要：agent 在真實肺癌藥物資料上做匹配分子對分析，建立效力模型（採用時間序切分），一小時內提出剛性化大環分子和合成路線。官方自己強調設計只是假說，必須實驗驗證。
- 來源：https://deepmind.google/blog/agentic-cheminformatics-with-google-antigravity/
- 放置：ai-course 13-ai-for-research §5 和 Anthropic 藥物研發條目並列 1 句；agent-lab skills 章作為 Skills 的實例。屬於插入。

## 7. MorphMimic：一套權重控制多款人形機器人（11/3）｜單一來源（媒體）＋論文／GitHub 待核
- 數字：Unitree G1、AgiBot X2 Ultra、Booster T2 共用同一策略；128,786 段動作；用 125 維形態描述符。聯合模型接近各自的專用模型。
- 來源：https://robohorizon.com/en-us/news/2026/11/morphmimics-universal-ai-brain-controls-a-zoo-of-humanoid-robots/
- 放置：auto-course 人形或學習控制章 1 句。寫入前先取得論文原文。

## 可選（低）
- OpenAI Images 2.6（11/4，一手）：速度快 50%、可生成 GIF、API 分 flare／sunburst，支援 markup 局部編輯。→ comfyUI-course 模型系譜 1 句（閉源，ComfyUI 只能透過 API 節點用）。https://openai.com/index/introducing-images-2-6/
- 騰訊 Hy4 正式版（11/4）：770B MoE，新增視覺和 computer use，權重尚未釋出。Mistral Large 4 開放權重：部落格日期 10/29，在窗口邊緣；活躍參數一說 52B、一說 49B，有分歧。→ ai-course 10 選型卡，等核實再寫。https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B
- Anthropic Message Threads 公開測試版（11/3，媒體報導）：只傳新訊息加上一個回應 ID，Claude Code 預設開啟。→ agent-lab ch12 sessions 1 句（正好接上 replay／last_seq 的概念）。一手連結待取。

## 11/2 條目與帳目更新（11/04 到期）
- ETH：沒有實質結論。審查仍在進行，年底前預計開一次線上會議。PR #62 重建版本仍未合併，family 378 還沒有 comparator 結果。新出現一篇分析（arcxiv 2611.00517，非 arXiv，可信度低至中）：論文沒給常數；換算下來，任何可寫出的有界密度輸入都不比暴力搜尋快。→ 刷新帳目，延到 11/18。
- Yang–Mills：委員會還沒公開 1,147 頁證明或 Lean 檔，也沒有時間表。無變化，延到 11/18。
- 局部光滑化／Kakeya：Lean 證明的就是陳述的那條估計，但「陳述是否忠實」仍沒有獨立數學家核驗。無變化，延到 11/18。

---
## 追加（11/05 12:56 後）

### A. 全局吸引子猜想（GAC，化學反應網路，Horn 1974）
- 沒有找到「這兩週有人宣布完整證明 GAC」的一手文章、Quanta 報導或新聞。也沒搜到其他同名猜想的新聞。實際存在的是下面三條相關工作：
  1. **OpenAI 持久性／永久性定理**（2026-09-25 與 10-05，openai/math 第 149 族）｜一手，未經同儕審查
     - 內容：有限、弱可逆、速率為固定正數的質量作用系統，滿足有界性和持久性（Feinberg 的持久性猜想）；10/05 那篇進一步證明永久性。
     - 意義：複平衡系統必然弱可逆，而且已知其軌道收斂到平衡點集合，所以只要證得持久性，GAC 就會成立（Craciun–Nazarov–Pantea 早有此說明）。換句話說，**如果 OpenAI 的定理成立，GAC 作為推論被完整解決**，但 OpenAI 的論文沒有把這點當作標題。
     - Lean：第一篇的定理有 Lean 形式化（71 個檔案、約 7,758 行，第三方整理 aiprovedwhat 稱沒有找到未證步驟）。尚無獨立的人類專家結論。
     - 來源：https://raw.githubusercontent.com/openai/math/main/preprints/Uniform-Permanence-in-Weakly-Reversible-Mass-Action-Systems-October-5-2026/permanence.pdf ；https://aiprovedwhat.com/episodes/149-mass-action-permanence/ ；背景 https://people.math.wisc.edu/~craciun/PAPERS/Craciun_Nazarov_Pantea_PERSISTENCE_PERMANENCE.pdf
  2. **BitMiracle AI Lab：〈Global Convergence of Detailed Balanced Mass Action Systems〉**（arXiv 2610.30808，2026-10-19）｜一手預印本
     - 作者：Lv、Ni、Wang、He。
     - 內容：證明的是**細緻平衡**這一特例，比複平衡窄。持久性部分直接沿用 OpenAI 的論證和 71 個 Lean 模組，整套證明約 9,300 行 Lean，只用三條標準公理，沒有 sorry。§5.4 寫到同一論證可推廣到複平衡情形、回收 GAC，但這部分沒有形式化。
     - 製作方式：在 ClawsGO Science 中，由 Claude Opus 5.5 做研究決策、GPT-6 Astra 執行，人類作者負責審核。
     - 來源：https://arxiv.org/abs/2610.30808 ；https://github.com/BitMiracle-AI/detailed-balance-gac
  3. **Wiuf（哥本哈根）特例證明**（arXiv 2609.24553，2026-09-21）
     - 內容：滿足兩個結構條件的複平衡網路，允許多個連結類；非 AI 證明。
     - 11/03 在布達佩斯理工大學演講，題目附有「conversations with AI agents」。
     - 來源：https://arxiv.org/abs/2609.24553 ；https://anal.math.bme.hu/node/3392?language=en
- Craciun 2015 年的完整證明（arXiv 1501.02860，2026 年出了 v3）仍沒有公認的獨立核驗。
- 可信度：論文本身是一手；「GAC 已被完整證明」是推論，沒有專家公開確認。
- 放置：
  - ai-course 20-lean「研究案例」插 2–3 句：持久性 ⇒ GAC 的推論鏈，以及一個 AI 證明被另一個 AI 管線拿來當模組重用（OpenAI → BitMiracle）。
  - grad-math 常微分方程／動力系統章 1 段（Lyapunov 函數管不到邊界，所以需要持久性）。
  - bio-course 系統生物學可附 1 句。
  - 歸入「AI 數學」帳目，與 ETH 一起追蹤。

### B. FlashProve 一手核對（https://www.anthropic.com/research/provable-inference ，2026-11-02，Frontier Red Team＋EPFL／MIT 等）
- 證明的內容：模型提供者先公開一個對權重的「承諾」（commitment，相當於權重指紋，權重本身不公開）。之後每次回覆都附一份 zkSNARK 證明，證明「承諾的那組權重在這個 prompt 上（貪婪解碼）產生的正是這些 token」。
- 誰驗證：任何持有承諾、prompt 和回覆的人，例如用戶、評測方或監管方。只需 CPU，不需權重或 GPU。
- 不是從輸出猜模型（不同於浮水印或分類器）：如果沒有提供者配合附上證明，就無法驗證。
- 零知識：只隱藏權重和中間值，以及用了哪些專家；架構不隱藏。
- Lean 部分：協議規格，以及完備性、可靠性（在隨機預言模型下）、零知識三條頂層性質；附一個可執行但較慢的 Lean 驗證器。日常使用的 C++ 快速驗證器沒有形式化保證，只是在測試中與 Lean 版一致。prover 程式碼和三者是否一致，都沒有證明。
- 數字核對（全部屬實）：
  - Llama 4 Maverick 4-bit，單張 H100＋24 核，batch 24 時約 110 token/s，約 223 秒；
  - 每個 1,024-token 請求的證明為 18.78 MB；
  - 驗證約 17 秒（24 執行緒）或 21 秒（單執行緒）；
  - 承諾約 6.5 MB，離線生成約 39 分鐘，約 1,600 萬次請求後需要重新承諾；
  - GPU 時間約為 vLLM 的 72 倍（66–77），在 vLLM 最高負載下約 94 倍。
- 補正：
  1. 上一版寫「CPU 驗證約 17 秒」不夠精確，應註明 24 執行緒；
  2. 「70–95 倍」是每 GPU 的時間比，對照組是 8×H100 上跑 FP8 的 vLLM；
  3. 只證明整數化模型加貪婪解碼，上下文最長 1,024 token，屬於事後抽查，不是即時逐條證明；
  4. Anthropic 9/30 達成的 RSP 目標是另一個「簽名＋可信伺服器重算」的專案，不是 FlashProve。
