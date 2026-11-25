# 前沿中期掃描（2026-11-09 週報之後至 11-11 17:00，Asia/Shanghai）
只整理資料，沒有改倉庫、沒有開 PR。窗口起點是 11/9 週報寫成之後（該檔 mtime 約 09:11）；11/9 週報已列項目除非有實質新進展，否則不重複。可信度：一手＝官方原文；確認＝一手加至少一個獨立來源；單一來源。

## 1. 楊–米爾斯委員會釋出純 YM 存在性的 Lean 證明與評估（11/9 預告，11/10 上線）｜高｜一手＋確認
- 為什麼要緊：這是 11/3「hopefully next week」的兌現。委員會認為「純楊–米爾斯存在性」的形式化已經對上標準問題陳述；質量隙與 Clay 千年題仍未解決。
- 數字／範圍：評估日期 2026-11-10。對象是 OpenAI 10/28 提交的 Lean。委員會判斷：對任意單緊緻規範群，可用四維 Wilson 格點規範理論的縮放極限，構造滿足 Wightman 公理的相對論性量子場論。無限體積極限的唯一性未證（只證到子序列極限），質量隙未證。乾淨重建、公理審計與 Comparator 通過；只用 propext、Classical.choice、Quot.sound。評估**沒有**採用那份 1,147 頁非正式手稿。委員會寫明「用了 Astra 輔助消化 Lean，尚不宣稱已完全理解證明」。OpenAI 11/4 的另一次提交標為 work in progress。QCD／費米子耦合不在這次釋出範圍。
- 來源：[KITP 第三份聲明 PDF（11/9）](https://www.kitp.ucsb.edu/sites/default/files/3rd-Statement-About-Quantum-YangMills-Theory_Nov-9.pdf)；[KITP 聲明頁](https://www.kitp.ucsb.edu/statement-by-the-yangmills-working-group)；[yang-mills-group/YM](https://github.com/yang-mills-group/YM)（含 [assessment-1.pdf](https://github.com/yang-mills-group/YM/blob/main/docs/assessment-1.pdf)）；[OpenAI-YM-20261028](https://github.com/yang-mills-group/OpenAI-YM-20261028)。二手：[India Today 11/11](https://www.indiatoday.in/amp/technology/news/story/nobel-laureate-validates-openais-ai-generated-yang-mills-proof-but-1-million-problem-remains-open-3036638-2026-11-11)
- 放置：在 `physics-course/lectures/pp-03-qcd-hadrons.md`「### 2026-10-28 研究窗口」把 11/3 時間表改成 11/10 結果，分清存在性／唯一性／質量隙／Clay 獎；`ai-course/lectures/20-lean-proves.md` §5 補 2 句（Comparator 通過≠委員會已完全讀懂；陳述對上的是他們採用的存在性標準，不是完整 Jaffe–Witten）。不要新開一講，也不要寫成「千年題已解決」。帳目 `yang-mills-existence-2026-10` 改追 QCD／11/4 提交與質量隙。

## 2. Anthropic 發布 Claude Fable 5.2／Mythos 5.2（11/9）｜高｜一手＋媒體確認
- 為什麼要緊：新的最高檔模型，而且把編碼、形式化、硬體與機器人能力一次公開；許多驚人數字仍是公司自報，寫入時必須分開層次。
- 數字（皆公司宣布）：定價 $8／$40 每百萬 in／out token；可選 fast mode 快最多 2.5 倍，價為 $16／$80。相對 5.1 生成最多快約 30%。FrontierCode 2.0 在 Xhigh 為 49.1%（Opus 5.5 為 45.5%，GPT-6 Astra 為 42.8%）；High effort 約與 Opus 5.5 Max 持平，據稱每任務成本約一半。HLE（with tools）74.2%。RoboDojo Sim 內部最高努力為 64.9%（Astra 29.8%，Fable 5.1 為 27.6%）。Fable 與 Mythos 是同一底模；Fable 帶網絡／生物安全閘，Mythos 需通過驗證計畫。官方仍建議多數日常任務先用 Opus 5.5。
- 必須分開寫的附帶宣稱：
  - **FLT 形式化重跑**：約 1,000 個 Fable 5.2 agent、約 30 小時（有報道寫 28.7 小時）完成形式化；對照組 Opus 5.5 在同樣架上 18 小時只完成 26%，30 小時幾乎不再前進。這是重現 2026-09-04 已公布的形式化（那時用未發布研究模型花了 11 天、約 1,300 萬行 Lean），**不是新的 FLT 證明**，起點含中間定理清單（報道還提到路線草圖與先前已證引理）。
  - **兩個黑洞相關開放問題**：預印本日期為 11/7，題為 *The Hawking-Page transition at weak coupling* 與 *The spinless modular bootstrap at large central charge*（Hexagon 2611.00175、2611.00174）。尚未見到獨立核驗，不要寫成「已解決的物理定理」。
  - 三台可工作的電子裝置（語音助理、USB 會議麥克風、掌上虛擬寵物）與機器人演示，皆為公司實驗。
- 來源：[Anthropic 發布文](https://www.anthropic.com/claude-fable-and-mythos-5-2)；FLT 首次形式化背景（9/4，不是本週新證明）https://www.anthropic.com/research/formalizing-fermats-last-theorem
- 放置：`ai-course/lectures/10-model-landscape.md` 加 2026-11-09 選型卡（Fable／Mythos 對 Opus，價格與使用建議）。`20-lean-proves.md` §5 用 FLT 重跑講「形式化速度在加快，但人類仍要核對起點與陳述」。硬體段可與 11/3 Astra 裝置演示並列 1 句（`mech-course/lectures/22-frontier.md`）。不要把兩個物理預印本当成已確認突破單獨立項。

## 3. DeepMind Gemini Robotics 2.5（11/10）｜高｜一手＋確認
- 為什麼要緊：VLA 從實驗室演示走到汽車產線的概念驗證，並公開一套機器人越獄基準。
- 數字（公司宣布）：評測超過 200 項任務；相對先前基線，成功率依任務提高 30–100%，完成速度快 20–30%。與 Apptronik Apollo 2 在 Mercedes-Benz 匈牙利 Kecskemét 與德國 Sindelfingen 產線做零件配料（kitting）概念驗證，成功率 96%。推理時安全導引：繞障安全完成率 +33%，靠近人員 +43%。新公開基準 ASIMOV-Jailbreak：Gemini 4 Argon 越獄抵抗率 99.5%，對照先前 Gemini Robotics ER 2 為 82%。模型向合作夥伴推出，不是消費級產品。
- 來源：[DeepMind 部落格](https://deepmind.google/blog/gemini-robotics-2-5-accelerates-real-world-physical-intelligence/)；[Ars Technica](https://arstechnica.com/google/2026/11/deepmind-reveals-gemini-robotics-2-5-and-open-safety-benchmark-asimov-jailbreak/)；[The Verge](https://www.theverge.com/tech/1030134/google-deepminds-new-ai-model-gives-robots-improved-dexterity)
- 放置：`auto-course/lectures/21-safe-control.md` 或 `22-frontier.md`：產線 PoC 與越獄基準各 2 句；可與既有 RoboHarm 對照。標成概念驗證，不要寫成已量產部署。

## 4. NVIDIA GR00T 2 世界–動作模型（11/9，CoRL）｜高｜一手＋確認
- 為什麼要緊：同時預測未來影像與機器人動作，強調「只看人類／手持夾爪演示、在沒做過該任務的機器人上執行」。
- 數字（NVIDIA 專案頁）：預訓練混合約 402,730 小時第一人稱人類影像、10,184 小時手持 UMI、23,500 小時機器人遙操作。50 個目標機器人未見過的任務：零樣本成功率 40%（50 題中 40 題至少成功一次）；每題 5 次演示（不到 3 分鐘機器人資料）、單張 RTX 5090 微調 30 分鐘後成功率 95%。帶推理 agent 時，三款玩具組裝分別為 98／97／97 次成功（各 100 次試驗）。GR00T 2 Turbo 約 20 億參數，G1 機載 Jetson Thor 預測延遲 124 ms；爆米花任務 48／48，清理桌面 93%。權重／程式是否已開放，官方頁未寫死日期，寫入前不要採用「12 月開放」的二手說法。
- 來源：[NVIDIA GEAR 專案頁](https://research.nvidia.com/labs/gear/gr00t-2/)；[NVIDIA 博客（CoRL）](https://blogs.nvidia.com/blog/robotics-simulation-advancements-corl/)；[The Robot Report](https://www.therobotreport.com/nvidia-launches-gr00t-2-isaac-lab-3-0-corl/)
- 放置：`auto-course/lectures/20-learning-control.md`（sim2real／跨本體遷移）；可與 MorphMimic 並列，但這是真機加大量演示資料，不要混為同一類結果。

## 5. OpenAI Control Room：研究推論的集中急停（11/9）｜中高｜一手＋確認
- 為什麼要緊：把「停模型」做成推論引擎層的授權檢查，而不是指望分散的實驗程式自己停下來。
- 數字：決定介入後，最多 35 秒內停止繼續產生輸出（來自授權快取）；服務本身故障時 fail-closed，拒絕所有推論。已部署在研究基礎設施；對外服務棧本就較集中。每個做 agentic 推論的研究任務須關聯已批准的 safety case。
- 來源：[OpenAI](https://openai.com/index/control-room/)（新聞頁標 11/9）；[AI Affairs](https://www.aiaffairs.com/technology/openai-control-room-stop-research-model-output-35-seconds/)
- 放置：`agent-lab/course/content/16-sandbox-network.md` 或 `15-approval-policy.md` 2 句：急停要放在推論瓶頸，工作負載程式不可信；fail-closed 是設計選擇。屬插入。

## 6. MBZUAI／IFM 開放世界模型 PAN 2（11/10）｜中｜一手＋確認
- 為什麼要緊：少見的「權重＋完整訓練與推論程式」一併以 Apache 2.0 開放的世界模型，用途是模擬行動後果，而不是只做好看的影片。
- 數字：技術博客寫知覺骨幹是從零訓練的 **29B** 擴散 Transformer。多步計畫：步驟完成率 75.1%、完整計畫 34.0%（對照組中完整計畫最高）。作者自建 6D-PI 與公開 Physics-IQ／RBench；人類盲測在四個開放模型裡排第二。長期世界一致性仍是公開限制。
- 來源：[新聞稿](https://ifm.ai/pan2/press-release/)；[技術博客](https://ifm.ai/blog/pan2/)；[MarkTechPost](https://www.marktechpost.com/2026/11/10/ifm-pan-2-open-world-model/)
- 放置：`comfyUI-course` 影片／世界模型系譜 1–2 句（模擬≠生成好看影片）；`auto-course` 世界模型／規劃 1 句。沒有化學課程；本條也不是化學突破。

## 六項指定檢查的狀態
1. **楊–米爾斯 Lean**：已釋出。見第 1 項。11/3「hopefully next week」已兌現；質量隙與 1,147 頁手稿仍未公開。
2. **張瑞祥 IAS 研討會（11/9 22:30–23:30 Asia/Shanghai）**：活動已舉行，題目為 Kakeya 猜想導論，並預告會談對 OpenAI 10/26 局部光滑化證明的「個人第一印象」。[活動頁](https://www.ias.edu/math/events/seminar-openais-722-manuscripts-1) 仍在。截至本掃描，**沒有找到公開筆記、幻燈片、逐字稿或實質專家反應**；後續同系列還有 11/16 Lurie 等場次。不能把「已舉辦」寫成核驗結論。局部光滑化帳目：無新的獨立核驗。
3. **ETH 審查**：Impagliazzo、Paturi、Williams **仍無結論**；「參與≠認證」未改；年底線上會議仍只是提議。[ethdiscussion.blog](https://ethdiscussion.blog) 最新組織者帖仍是 11/1 的「New Results Related to ETH」。11/9–11/10 有新留言，但不是審查結論。11/9 週報已寫的 Lean 橋接／PR #62／Toledo 重放，本窗口沒有需要改寫的新事實。
4. **Moderna／默沙東 intismeran NEJM**：截至 11/11 17:00 Asia/Shanghai（此時美國東岸約凌晨 4 時），**未能核到 NEJM 正文已上線**（nejm.org 對本次抓取回 403）。先前報道仍是「已接收、計劃 11/11 刊登」，數據來自 10 月底 ESMO／公司披露（n=1,137，RFS HR 0.58，總生存仍不成熟），不要當成本週新讀出重寫。建議 11/12 再核一次。
5. **騰訊 Hy4 權重／系統卡**：尚未釋出。Hugging Face 仍只有 `tencent/Hy4-preview`（及 FP8）；正式版權重與系統卡仍是「計劃開放、無確定日期」。來源：[Hy4 介紹頁](https://hy.tencent.ai/research/hy4)（11/4）；[FrameSignal 截至 11/10 仍未見到檔案](https://framesignal.com/stories/tencent-hy4-ai-model-download-soon-trails-best-private-models)。繼續等一手再寫選型卡。
6. **Clone Torso 4**：未見到正式上市或出貨公告。官網產品／首頁仍是預購與既有產品敘述，沒有 Torso 4 發布稿。繼續追。

## 本窗口未單獨立項
- 化學／材料：未找到足以改寫教材的獨立論文。Fable 發布文裡有測試者稱把 Quantum ESPRESSO 聲子計算平均加快約 36 倍，這是引述，不是論文，不要當材料突破。
- arXiv Lean／AI 輔助證明：掃到的較完整條目（例如 Lea，arXiv:2611.08849）提交於 11/6，落在週報窗口內而非本中期窗口；本窗口沒有需要立刻寫入的新形式化大結果（YM 與 Fable 的 FLT 重跑除外）。
- OpenAI 11/9–11/11 的其餘產品新聞（ChatGPT Enterprise 上 AWS Marketplace、Businesses in ChatGPT、退伍軍人優惠等）與課程無關，跳過。
- 帳目：`deepseek-harness`（11/10）、`qwen-image-2.1`（11/11）本掃描未見到足以改寫講次的新發布；ETH／局部光滑化建議保持 11/18；楊–米爾斯改追後續提交與質量隙。
