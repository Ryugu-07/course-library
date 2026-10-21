# 2026-10-21 Lean 保證範圍

本輪只核對新講 `ai-course/lectures/20-lean-proves.md` 用到的來源，以及第 13 講新增的一句指向。沒有改其他帳本的 `verified_on`。沒有編譯 OpenAI、Anthropic 或掛谷的倉庫。

## 本機實測

- Lean 4.26.0，commit `d8204c9fd894f91bbb2cdfec5912ec8196fd8562`。
- `ai-course/examples/and-swap.lean` 退出碼 0，兩個定理都不依賴公理。
- 對照檔沒有放進倉庫：`sorry` 的退出碼仍是 0，公理為 `sorryAx`；自訂 `axiom` 會出現在 `#print axioms`；`native_decide` 印出 `Lean.ofReduceBool` 與 `Lean.trustCompiler`；`decide` 不增加公理。
- `debug.skipKernelTC` 這個選項在該版能設定。沒有重跑官方測試裡的 `1 = 2`。

## 頁面

- OpenAI README、history.md、lean-toolchain（`v4.34.1`）、formalization.yaml、071/084/361 的範圍頁，抓取日 2026-10-21。yaml 計數是 173 條來源、200 條宣告，`review.status` 為 `unchecked`。三篇撤回標題不在來源標題中。
- arXiv:2610.08144 Example 3.1：式 (8.19) 的 \(m+4\) 與 Lean 的 \(m+5\)。作者不判斷英文證明。
- Buzzard 2026-09-04：comparator 通過、超過 1,340 萬行、\(p\ge 17\)、奇正則素數已有形式化、最小不正則素數 37。11 天是他轉述的時程。
- Reservoir 的 project-numina/kakeya：兩層陳述，無條件終點的公理閉包寫成標準三條。沒有引用該頁沒有寫出的行數。
- AHM 文本在陶哲軒網誌標成客座轉載。
- 空子的一次來源：Lean 手冊與 API 文件、PR 12217、提交 d8e719f、Zulip 的 skipKernelTC 討論、arXiv:2606.29493、arXiv:2608.29270、terminal-bench 議題 1303、frontier-bench PR 1305、lean-eval SECURITY.md、lean4checker 與 lean4lean 的 README。
