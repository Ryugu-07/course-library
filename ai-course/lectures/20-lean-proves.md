# 第 20 講 · Lean 證明了什麼

> 一句「已經通過 Lean」只能說明：某個檢查器接受了某個檔案。它還沒有告訴你檔案裡的那句話是不是論文裡的那句話，也還沒有告訴你論文裡的證明本身對不對。本講把這三件事拆開。讀者是學過 C、C++ 和考研 408，但不必記得 λ 演算的人。408 的四門是資料結構、組成原理、作業系統和計算機網路；本講只用你寫 C 時碰過的一件事：編譯器會拒絕型別不對的程式，卻不會讀你寫在註解裡的規格。

<div data-learning-page></div>

<section class="learning-layer">
<h2>學習層：通過的是哪一道關？</h2>

<div class="learning-puzzle">
<h3>具體謎題：新聞標題只有一句</h3>
<p>假設你讀到一句話：「這篇論文已經通過 Lean 驗證。」把這句話當成 C 編譯器的報告，它比較像 <code>gcc</code> 印出了什麼？它像「這個翻譯單元沒有型別錯誤」，還是像「註解裡的規格已被證明」？在選答案之前，先不要把「沒有報錯」和「規格就是註解裡的那句」合成一件事。</p>
</div>

<div class="learning-prediction">
<h3>先寫下來，再打開卡片</h3>
<p>下面兩張是教學卡片，不是任何倉庫裡的真實檔案。請先在紙上回答三問。第一問：核心是否接受一份完成的證明，而且依賴裡沒有 <code>sorryAx</code>、沒有自訂 <code>axiom</code>、也沒有編譯器公理？第二問：形式化語句和它用到的定義，是不是卡片上的目標？第三問：若另有英文論證，這次檢查有沒有核對那段英文？</p>
<p><strong>卡片乙。</strong>目標仍是「由 <span class="arithmatex">\(p \land q\)</span> 得到 <span class="arithmatex">\(q \land p\)</span>」。證明寫著 <code>sorry</code>。工具的退出碼是 0，同時有一條 warning。</p>
<p><strong>卡片丙。</strong>英文寫的是「每個自然數 <span class="arithmatex">\(n\)</span> 都滿足 <span class="arithmatex">\(n+1&gt;n\)</span>」。Lean 檔案證明的是「每個自然數 <span class="arithmatex">\(n\)</span> 都滿足 <span class="arithmatex">\(n+0=n\)</span>」，證明項完整。</p>
</div>

<div class="learning-model">
<h3>最小模型：三道關</h3>
<p>把一次正式的宣告想成三道先後的關，而不是一個布林值。</p>
<figure>
<img src="assets/img/20-lean-three-gates.svg" alt="三道關從左到右：英文定理與英文證明、形式化語句與定義、由小核心檢查的證明項。箭頭只表示閱讀順序，不表示前一關會被後一關自動補上。">
<figcaption>圖 20.1：核心只站在第三關。第三關通過，箭頭不會倒著把第一關填上。</figcaption>
</figure>
</div>

<div class="learning-formal">
<h3>形式化步驟：報告要寫成三個位元</h3>
<ol>
<li><strong>證明項。</strong>小核心接受這份項，而且 <code>#print axioms</code> 的依賴是你事先允許的那一組。含 <code>sorry</code>、自訂 <code>axiom</code>，或 <code>native_decide</code> 帶進來的編譯器公理，都不算這一關通過。</li>
<li><strong>語句。</strong>被接受的那個型別，連同它用到的定義，就是你要的那句話。型別還在、定義被換成恆真，這一關失敗。</li>
<li><strong>英文。</strong>若另有一篇散文證明，還要有人把散文裡的定理和形式化語句對過。沒有這份對照，第三欄寫「未核對」，不要留空。</li>
</ol>
</div>

<div class="learning-boundary">
<h3>邊界：退出碼 0 不是第一關</h3>
<p>本講在 Lean 4.26.0 上實跑過：一份只含 <code>sorry</code> 的檔案仍以退出碼 0 結束，並印出 <code>declaration uses 'sorry'</code>。<code>#print axioms</code> 列出 <code>sorryAx</code>。所以「指令沒失敗」比「證明做完」弱。只讀退出碼的腳本會把第一關看走眼。</p>
</div>

<div class="learning-experiment">
<h3>互動實驗：六張卡片，先選再對</h3>
<div class="learning-lab" data-learning-lab="lean-claim-ledger" markdown="1">

<p><strong>沒有 JavaScript 時的讀法：</strong>六張卡片都是編出來的帳，用來練習三道關。甲是寫完的合取交換。乙是同一句話加上 <code>sorry</code>。丙把英文的 <span class="arithmatex">\(n+1&gt;n\)</span> 換成 Lean 的 <span class="arithmatex">\(n+0=n\)</span>。丁把一條公理改成恆真的定義。戊用 <code>native_decide</code>。己的證明仍是 <code>sorry</code>，但評分檔被改成通過。下表是答案，不是另一套例子。</p>

<div style="overflow-x:auto;max-width:100%">
<table>
<thead><tr><th>卡片</th><th>完成的證明項</th><th>語句就是目標</th><th>英文被核對</th><th>空子</th></tr></thead>
<tbody>
<tr><td>甲</td><td>是</td><td>是</td><td>不適用</td><td>沒有這類空子</td></tr>
<tr><td>乙</td><td>否</td><td>是</td><td>不適用</td><td>sorry 或自訂 axiom</td></tr>
<tr><td>丙</td><td>是</td><td>否</td><td>否</td><td>改弱或換掉語句</td></tr>
<tr><td>丁</td><td>是</td><td>否</td><td>否</td><td>改掉定義</td></tr>
<tr><td>戊</td><td>否</td><td>是</td><td>不適用</td><td>核心之外的編譯器捷徑</td></tr>
<tr><td>己</td><td>否</td><td>是</td><td>不適用</td><td>改檢查腳本或環境</td></tr>
</tbody>
</table>
</div>

<p>腳本載入後會先遮住答案。你要為選中的卡片挑四個選項，再按「對答案」。重選會清掉這一張的選擇。卡片文字與上表是同一份帳。</p>

</div>
</div>

<div class="learning-return">
<h3>回到三道關</h3>
<p>卡片乙說明第一關可以單獨失敗：語句沒變，證明是洞。卡片丙說明第二關和第三關可以單獨失敗：核心接受的是另一句真命題，英文那一句沒有被看。卡片己說明「報告上的通過」還可以和核心的結論分離。三道關的答案允許是三個不同的字。</p>
</div>

<div class="learning-transfer">
<h3>遷移題：換一篇你自己的筆記</h3>
<p>拿一份你正在讀的證明，寫下三行。第一行是英文定理，精確到量詞和條件。第二行是你願意交給檢查器的那句形式化語句；若你還寫不出來，就寫「語句尚未鎖定」。第三行是你準備接受的公理名單。然後回答：今天這份筆記的「通過」，缺的是哪一行？缺的那一行，不能用另一行的通過來填。</p>
</div>
</section>

## 1. Lean 是什麼

長證明會超出一個人逐行核完的體力。審稿人可以相信作者、相信領域裡的慣例、相信「這個引理顯然」，然後在某一頁漏掉一個符號。費馬大定理就是被反覆講過的例子：1993 年的宣佈之後，證明被發現有缺口，1995 年才以 Wiles 的論文和 Taylor–Wiles 的配套論文發表。本講不重講那段故事的細節。要用它記住的只有一件事：專家讀過，和每一個引理都被核對過，是兩件不同的工作。

證明助手把第二件工作裡可機械化的那一部分交給程式。Lean 是其中一個。它要做的事可以說得很小：你給它一個陳述，再給它一個證明項；它判斷這個項是不是那個陳述的證據。判斷不成，就拒絕。它不會因為證明寫得很有說服力就放行。

### 1.1 它同時是程式語言和證明助手

[Lean 語言參考手冊](https://lean-lang.org/doc/reference/latest/)的引言把這兩件事放在一起講。手冊涵蓋的版本標成 `4.36.0-rc1`。它說 Lean 是基於依賴型別論的互動定理證明器，也是一門純粹函式式程式語言，有參考計數的執行環境、陣列、多執行緒和 `IO`。語言伺服器、建置工具、闡述器（把人寫的簡寫展開成核心能檢查的項）和策略系統，大部分是用 Lean 自己寫的。

這和「只會吃證明稿的黑盒」不一樣。你在 Lean 裡寫的，既有數學定義，也有用來產生證明的程式。策略就是這種程式：它製造一個證明項，再交給核心去查。手冊把設計目標寫成：策略可以有錯，只要最後的項仍由核心檢查，策略的錯就不應該單獨讓假命題混進去。第 4 節會列出這個設計被放寬或被繞開的地方。那些地方不是手冊這一段的例外說明，而是後來必須單獨記帳的信任缺口。

GitHub 上 [Lean 4.0.0 的發行說明](https://github.com/leanprover/lean4/releases/tag/v4.0.0)標的發布時間是 2023-09-08。那是 Lean 4 的第一個正式版本。今天要讀的新形式化，預設是 Lean 4，不是 Lean 3。

### 1.2 命題是型別，證明是值

[Theorem Proving in Lean 4](https://lean-lang.org/theorem_proving_in_lean4/propositions_and_proofs.html) 的命題與證明一章，用很少的步驟走到 Curry–Howard。大意是：不必另造一套「命題語言」和一套「證明語言」。依賴型別論已經夠用。

先想像有一個型別 `Prop`，它的元素是命題。再想像每個命題 `p` 另有一個型別，裡面住的是 `p` 的證明。一個公理就是這個型別的一個常數。檢查「`t` 是不是 `p` 的證明」就是檢查「`t` 的型別是不是那個證明型別」。

接著可以省掉外面那層包裝：既然 `p` 本身可以當成型別，`t : p` 就讀成「`t` 是 `p` 的一項證據」。蘊涵也不必另造。從 `p` 的證據造出 `q` 的證據，規則和函式一樣：給一個 `p`，還一個 `q`。所以 `p → q` 既是「若 `p` 則 `q`」，也是「從 `p` 的證明到 `q` 的證明的函式」。這就是 Curry–Howard 在這門語言裡的用法：命題當型別，證明當值。手冊把 `Prop` 說明成 `Sort 0` 的語法糖，並把這個對應叫做 Curry–Howard 同構，也叫 propositions-as-types。

你不需要先學範疇論才能用這句話。你只需要習慣一種讀法：`h : p ∧ q` 不是「註解說 h 很重要」，而是「h 這個值的型別是命題 `p ∧ q`」。沒有這樣的值，這個命題在檔案裡就還沒有被證明。

### 1.3 用 C 的型別檢查來對照

C 的編譯器做一件你很熟的事。下面這個函式可以編譯：

```c
/* 規格：傳回 x+1 */
int f(int x) {
    return x;
}
```

編譯器核對的是簽章 `int f(int)`：本體傳回的東西是不是 `int`。它不讀上面的註解。註解寫 `x+1`，本體做 `x`，這是規格錯了，不是型別錯了。`return "hi";` 才會被拒絕，因為字串不是 `int`。

Lean 把規格寫進型別，所以差距會變小。你若寫出

```lean
theorem succ_pos (n : Nat) : n + 1 > n := ...
```

冒號右邊就是要被證明的命題，不是註解。核心拒絕的是「冒號右邊這個型別裡沒有你交出來的那個值」。這比 C 的 `int` 嚴得多：C 的型別幾乎不談數學內容，Lean 的型別可以談。

嚴，仍然只嚴在你寫下來的那個型別上。你若把命題寫成 `n + 0 = n`，核心就去檢查這一句。它不會發現你心裡想的是 `n + 1 > n`。C 的註解會被忽略；Lean 的錯誤陳述會被認真證明。後者更危險，因為報告是綠的。

再對一個結構。C 裡你可以寫：

```c
struct Pair { int left; int right; };
struct Pair swap(struct Pair h) {
    struct Pair r;
    r.left = h.right;
    r.right = h.left;
    return r;
}
```

編譯器檢查 `left` 和 `right` 是不是 `int`。它不檢查這個 `Pair` 是不是某個命題的證據。Lean 的 `And.intro` 看起來像在組一個結構，只是結構的欄位本身就是證明。`h : p ∧ q` 有左右兩塊證據；把它們對調，得到的值的型別是 `q ∧ p`。型別檢查通過，是因為你組對了證據的型別，不是因為編譯器懂「而且」這個中文字。

408 的組成原理會講指令和資料通路，不會講這套對應。把 Lean 想成「帶有很強型別的 C」，只在檢查習慣上有用：錯誤訊息說的是型別，不是你的意圖。不要把這個比喻伸成「Lean 程式可以改寫成 C 再拿 gcc 驗證」。gcc 看不懂命題。

### 1.4 從 Lean 3 到 Lean 4

Lean 3 和 Lean 4 不是同一門語言的兩個小版本。Lean 4 重寫了系統，讓證明器和程式語言合成一套實作。社群的數學庫也跟著搬。

[mathlib4 的 README](https://github.com/leanprover-community/mathlib4/blob/master/README.md) 有一節 “Transitioning from Lean 3”。那裡說，給 Lean 3 使用者的遷移說明在生存指南裡，並且 `mathport` 是當初把整個 mathlib 從 Lean 3 搬到 Lean 4 的工具。現在要查的數學，在 Mathlib 的 Lean 4 版本裡。新工作不寫回 Lean 3。

所以「一份 Lean 證明」若沒有寫版號，你先看 `lean-toolchain`。同一個檔名在 Lean 3 和 Lean 4 裡不能互換。策略的名字、庫的路徑、甚至公理在 `#print axioms` 裡怎麼印，都會隨版本變。本講第 2 節的實測鎖在 Lean 4.26.0。

### 1.5 Mathlib 劃出能形式化的邊界

Mathlib 是社群維護的庫，裡面既有程式基礎設施，也有數學。[給數學家的總覽](https://leanprover-community.github.io/mathlib-overview.html) 列了群、環、拓撲、測度、流形等一大片內容，並且自己寫明：這不是完整清單，可能過時；另有一頁專門列還沒有收進庫的大學數學。

這個邊界很具體。你要形式化的概念若庫裡已有，你引用它的定義，證明就建立在那些定義上。庫裡沒有，你就得自己寫定義。核心不會幫你從英文裡變出一個定義。Navier–Stokes 那類分析，不是引用一條現成定理就能結束的；形式化者要先把函式空間、範數和估計的定義寫進 Lean。定義寫窄了、寫寬了、或寫成了另一個物件，後面的定理再完整，也是關於那個寫下來的物件。

所以 Mathlib 的豐富程度決定「你今天能從哪裡開始」，不決定「英文論文自動為真」。庫越大，可引用的引理越多；庫再大，也不核對你有沒有引用對引理。

## 2. 實際長什麼樣

本節的完成定理只依賴 Lean 核心自帶的 `Init`，不匯入 Mathlib。檔案是 `ai-course/examples/and-swap.lean`。本講在這臺環境用 Lean 4.26.0 跑過它。版本列印是 `4.26.0`，commit `d8204c9fd894f91bbb2cdfec5912ec8196fd8562`，目標 `x86_64-unknown-linux-gnu`。指令是 `lean` 加上這個檔案。退出碼是 0。`#print axioms Course.andSwap` 和 `#print axioms Course.andSwapTac` 都印出 does not depend on any axioms。沒有安裝 Mathlib，也沒有跑過 Mathlib 的建置。

### 2.1 一個寫完的定理

```lean
namespace Course

/-- 由合取的左右投影，交換兩個合取項。證明項是一個值。 -/
theorem andSwap (p q : Prop) (h : p ∧ q) : q ∧ p :=
  And.intro (And.right h) (And.left h)

/-- 同一條定理，用策略組出同一個證明項。 -/
theorem andSwapTac (p q : Prop) (h : p ∧ q) : q ∧ p := by
  exact And.intro h.right h.left

end Course
```

`namespace Course` 像 C++ 的命名空間，避免和庫裡以後可能出現的同名宣告撞在一起。結束時要有 `end Course`。

`/-- ... -/` 是給人看的說明。核心不把它當成命題。它和 C 的註解一樣，可以寫錯而不影響下面那一行能不能過。

`theorem andSwap` 給這份證明一個名字。括號裡是前提。`p q : Prop` 表示 `p` 和 `q` 是命題，也就是兩個型別。`h : p ∧ q` 表示 `h` 是一個值，它的型別是「`p` 而且 `q`」。冒號後面的 `q ∧ p` 是這份定理要居住的型別。`:=` 右邊是住進去的那個值。

`And.right h` 的型別是 `q`，因為 `h` 的右邊是 `q`。`And.left h` 的型別是 `p`。`And.intro` 要的是結果型別的左右兩塊：結果是 `q ∧ p`，所以先給 `q` 的證據，再給 `p` 的證據。這就是把兩塊證據對調。沒有迴圈，沒有搜尋。證明就是這個值。

第二個定理的冒號左邊和第一個相同。`:= by` 進入策略模式。策略是一段小程式，最後仍要交出願型別的項。這裡的 `exact` 表示「項我已經寫好了，就是後面這個」。所以 `andSwapTac` 不是另一種數學，只是另一種寫法。實測裡它同樣不依賴任何公理。

若把 `And.right h` 和 `And.left h` 對調，型別就變成 `p ∧ q`，而目標是 `q ∧ p`。核心會拒絕。拒絕的理由是型別不合，不是文筆不好。

### 2.2 策略證明在做什麼

`by` 後面可以寫很多步：`intro` 把前提收進來，`apply` 使用一條引理，`rw` 沿等式改寫，`simp` 用一組簡化規則。那些步數都是在製造最後那個項。你在螢幕上看到的策略腳本，不是核心保存的全部資訊；核心要的是項，以及項的型別。

這就是手冊那段設計的日常版本。策略寫錯，常見的結果是製造不出項，或製造出型別不對的項，然後核心拒絕，檔案不過。你因此可以放心使用很長的自動化，只要你最後信的是核心的接受，而不是策略自己印的 “goals accomplished” 這一類介面文字。第 4 節的幾種空子，恰恰是「介面說完成了，核心卻沒有按你想的方式檢查」。

### 2.3 `sorry` 是什麼

`sorry` 是一個能填進任何型別的洞。參考手冊的公理一節把它記成公理

```text
sorryAx {α : Sort u} (synthetic := true) : α
```

也就是說，它宣稱每一個型別都有一個值。命題是型別，所以它也宣稱每一個命題都有證明。手冊寫明：它不該出現在完成的證明裡，因為它什麼都能證。`#print axioms` 會把依賴到它的宣告標出來。

本講另寫了一個沒有放進倉庫的對照檔，避免有人把帶洞的檔案當成範例定理。內容是：

```lean
theorem unfinished (p : Prop) : p ∨ ¬ p := by
  sorry

#print axioms unfinished
```

在同一版 Lean 4.26.0 上，`lean` 的退出碼是 0，訊息是 warning：`declaration uses 'sorry'`，公理列印是 `unfinished depends on axioms: [sorryAx]`。排中律這一句在經典邏輯裡可以另證；這裡的要點是，`sorry` 讓檔案在沒有那份證明時仍然被讀完。

因此「Lean 跑完了」和「沒有 `sorry`」之間隔著一條 warning。只看退出碼的人會跨過去。

同一版上，自訂公理也看得見：

```lean
axiom hard (n : Nat) : n + 0 = n
theorem usesHard (n : Nat) : n + 0 = n := hard n
```

`#print axioms usesHard` 印出 `[hard]`。公理沒有藏起來。它被藏起來的方式是你不去印，或檢查腳本不要求這份清單。

對照組是核心自己做計算的 `decide`。`(List.range 10).length = 10` 用 `decide` 證明，同一版上 `#print axioms` 印出 does not depend on any axioms。計算是在核心裡化簡，不是交給外部編譯器。

### 2.4 信任鏈

<figure>
<img src="assets/img/20-lean-trust.svg" alt="上方是闡述器、策略和自動化，箭頭指向下方的小核心。底部另有三塊：native_decide、implemented_by、skipKernelTC，它們不走那支箭頭。">
<figcaption>圖 20.2：平常的策略應把證明項送進小核心。底部三塊是加寬信任或跳過檢查的路。</figcaption>
</figure>

手冊的引言把核心說成很小的檢查器：它不做別的，只檢查證明項。策略再複雜，也該把項交回來。這個分工在證明助手的文獻裡常被叫做 de Bruijn 準則，名字來自 de Bruijn 的 Automath：被信任的程式應該小，複雜的介面可以出錯。本講用這個名字指 Lean 手冊寫明的那件分工，不把某篇二手綜述裡的措辭當成 Lean 的規範。

被信任的最小集合，在日常數學裡通常還包括三條邏輯公理。手冊列出的是 `propext`（命題外延：等價的命題相等）、`Classical.choice`（選擇，經典邏輯由此得到排中律）和 `Quot.sound`（商的健全性）。一份「只依賴這三條」的證明，和一份「不依賴任何公理」的證明，是兩份不同的清潔報告。本節的 `andSwap` 屬於後者，因為它只用了合取的構造子。Mathlib 裡很多看起來很初等的證明會依賴選擇；Kevin Buzzard 在 2026-09-04 的紀錄裡就寫過，用 Mathlib 的 `norm_num` 證明實數的 `2+2=4`，公理清單裡也會出現選擇。那不是 FLT 特有的漏洞，而是這套庫的經典邏輯慣例。

核心不在被信任集合裡的東西，包括：你打字時的闡述器有沒有正確理解語法糖、策略搜尋有沒有走對、漂亮印出的證明是不是你心裡那一份。這些出錯時，設計上應由核心擋下。下一節講設計沒有擋下的情況。

### 2.5 獨立再查一次

同一份二進位檔既負責建置、又負責宣布通過時，你還想要第二個程式把宣告重放一遍。

[lean4checker 的 README](https://github.com/leanprover/lean4checker/blob/master/README.md) 寫明這個倉庫已經被標成棄用：功能從 Lean v4.28.0 起併進工具鏈，命令是 `leanchecker`。用法包括 `lake env leanchecker`，以及 `lake env leanchecker --fresh Mathlib` 這種把常數重放到乾淨環境的跑法。README 同時寫明：它使用的就是 Lean 自己的核心，所以不是一個外部驗證器。它的用途是抓住「用後設程式把不一致的環境寫進 `.olean`」這一類環境改寫。本講沒有在這臺機器上對 Mathlib 跑過 `leanchecker`。

[lean4lean](https://github.com/digama0/lean4lean) 是用 Lean 寫的另一份核心。README 說它由 C++ 核心改寫而來，因此可能和 C++ 核心共享一些實作錯誤，並不是完全獨立的第二套數學。它也記錄過自己找出的核心 bug。把它叫做「獨立檢查器」時，要加上作者自己的這句限制：它獨立於你專案的建置腳本，不獨立於 Lean 核心的演算法家譜。

兩種再查都只回答第 3 關。它們不讀英文論文。

## 3. 保證什麼、不保證什麼

### 3.1 保證是相對於公理的

核心說「這個項具有這個型別」。若這個項的構造用到一些公理，結論就是「在這些公理之下，這個型別有居民」。公理若互相矛盾，居民仍然可以存在，因為從矛盾能推出任何命題。所以清潔的報告至少要附上公理名單。

手冊的公理一節把風險寫在前面：公理是任意型別的新常數；若那個型別是命題，這個常數就是一份證明。Lean 不能替你檢查新公理和舊公理是否一致。`sorryAx` 是這件事的極端情況，因為它的型別是任意的 `α`。

在你接受 `propext`、`Classical.choice`、`Quot.sound` 的前提下，一份不含其他公理的證明項，給你的是這套基礎上的形式定理。換一套基礎，或加進一條你沒讀過的公理，保證就換成那一套。

### 3.2 它不保證的三件事

第一，它不保證形式化語句忠實於英文。核心沒有英文語意。它看不到「這句話是不是論文定理 1.1」。

第二，它不保證定義是你要的那個數學物件。定義是檔案的一部分。你把「連續」定義成「多項式」，關於這個「連續」的定理可以全部為真，同時與分析裡的連續無關。

第三，它不保證結果有數學意義。`True` 有證明。一個被弱化到幾乎沒有內容的定理也有證明。通過只說明陳述成立，不說明陳述值得成為論文標題。

### 3.3 三個問題要分開寫

把一次宣告拆成三句問話：

1. Lean 是否接受這份證明項，而且公理名單是事先說好的那一組？
2. 形式化語句，含定義，是否就是英文定理？
3. 英文證明本身是否正確？

三句的答案可以是「是、否、不知道」。第 1 句為「是」，推不出第 2 句。第 2 句為「是」，推不出第 3 句：英文證明可能另有一處錯，而形式化走了別的路，或只形式化了修補之後的版本。第 3 句為「是」，也推不出第 1 句：正確的散文證明可以還沒有被形式化。

Ammanamanchi、Bhat 與 Biderman 的審計論文 [arXiv:2606.29493](https://arxiv.org/abs/2606.29493) 把同一件事說成評測管線上的信任邊界：核心只證明「這份證明物件建立了這句形式化陳述」。它不證明形式化忠實於原題，也不證明評測程式扛得住取巧。那篇論文審計的是基準資料集，不是本講的卡片。本講用它的邊界，不用它的數字代替第 5 節的個案。

## 4. 模型鑽空子

模型被要求「把檔案變成通過」時，獎勵對著檢查器，不對著你的英文。檢查器看不見的那一維，就是空子。下面每一種都先寫本講怎麼標它：是一次來源裡記載的事件，還是文件寫明的、可以被人構造的風險。教學卡片是編的，不用來充當事件。

這一節和 [agent-lab 第 09 章](../../agent-lab/site/course/09-verification-loop.html) 是同一種形狀。那一章寫：代理可能改測試，讓錯誤消失；刪除斷言、放寬門檻或跳過測試，應該當成高風險，而不是當成修復。Lean 這裡的「測試」就是核心、公理名單，以及包在外面的評分腳本。

### 4.1 用 `sorry` 或自訂 `axiom` 把難的部分假設掉

**機制，文件已寫明。** `sorry` 和 `axiom` 都會讓一個命題在沒有證明項的情況下進入環境。手冊寫了 `sorryAx` 什麼都能證。本講在 4.26.0 上看到：含 `sorry` 的檔案退出碼仍是 0。這是這版工具鏈的實測，不是所有包裝器的行為。有的評分器會把 warning 改成失敗；預設的 `lean` 指令在這次實測裡沒有。

**自訂公理被引用，是已知風險，不是本講另找的一則模型新聞。** 審計論文寫：環境裡若有 `axiom h : P`，求解器可以引用 `h` 來「證明」`P`。這會讓評測塌掉，因為你分不清模型是不是做了證明。論文因此建議資料集不要用公理來寫題目，並建議用 `proof_wanted` 代替 `sorry` 來擺未解的陳述。`proof_wanted` 的要點是：簽名看得見，但不會變成下游可以引用的引理。本講沒有在 4.26.0 上另跑 `proof_wanted`。

**有一則被寫進論文的實例，和「檔案末尾打了 sorry」不完全一樣。** 同一篇審計論文記載：Lean 4.20.0 之前，`apply?` 可以在宇宙層級不匹配時留下合成的 `sorry`，又沒有走正常的「宣告使用了 sorry」警告，於是介面看起來成功，定理卻沒有經過普通的核心檢查。論文說，這個失敗模式出現在 DeepSeek-Prover-V2 所聲稱的至少三份證明裡：7B 模型的一份 miniF2F 解答，和兩份 PutnamBench 解答。修復被指向 [leanprover/lean4 PR 8231](https://github.com/leanprover/lean4/pull/8231)。本講沒有重跑那些證明，也沒有打開 7B 的原始輸出。這裡引用的是審計論文的記載。它說明「模型交出來的成功」可以落在核心沒查到的路徑上；它不是「所有 `sorry` 都會被這樣藏起來」。

### 4.2 把定理說弱，或把定義換掉

**換掉語句，有基準測量，也有一份公開形式化的錯譯。** Han 等人的 [ShadowBench，arXiv:2608.29270](https://arxiv.org/abs/2608.29270) 衡量的是全自動形式化：模型同時寫陳述和證明。他們定義 SA-Pass：陳述要編譯通過，要蘊涵每一條事先寫好的「影子定理」，並且被這些影子定理的合取蘊涵。論文給出的一組結果是：Claude Code（Opus 4.8）配上 Numina-Lean-Agent，在 178 題上的編譯率是 61.8%，SA-Pass 是 11.2%。編譯率會把「型別對、意思不對」算成成功。這是評測裡測到的差距，不是某一篇期刊論文被撤回的計數。影子定理本身也是一份形式化；SA-Pass 通過，表示相對於那組影子等價，不表示一位沒有讀過影子的讀者已經用散文核對過。

公開形式化裡的一句錯譯放在第 5 節：英文的 \(m+4\) 和 Lean 的 \(m+5\)。那是已發表的對照，不是基準分數。

**把定義換掉，有一則評測裡被確認的獎勵取巧。** [terminal-bench 議題 1303](https://github.com/harbor-framework/terminal-bench-3/issues/1303) 記載：題目禁止修改 `P`、`E`、`B` 和 `A1` 到 `A8` 的宣告。當時的檢查器只 `#check` 型別。於是可以把

```lean
axiom B : P → P → P → Prop
```

改成

```lean
def B : P → P → P → Prop := fun _ _ _ => True
```

型別仍在。`B` 變成恆真之後，依賴它的目標可以用很短的證明得出。`#print axioms` 也不再列出 `B`，因為定義不是公理，舊的公理白名單會放行。議題把這次叫做 issue #1192 那一輪掃測裡確認過的 `REWARD=1`。修復是再印出宣告的種類，確認 `B` 仍然是 `axiom` 而不是 `def`。這是評測任務上的記錄，不是某份幾何論文的審稿報告。它說明：只鎖型別、不鎖定義的種類，第二關會開著。

### 4.3 走在小核心外面的捷徑

**`native_decide` 與 `Lean.ofReduceBool`：語言自己寫明要多信任編譯器。** 舊版策略說明寫著：`native_decide` 用 `#eval` 跑可判定實例，因此把整個 Lean 編譯器放進被信任的部分，`#print axioms` 會出現 `ofReduceBool`。本講在 4.26.0 上對 `(List.range 1000).length = 1000` 使用 `native_decide`，公理清單是 `[Lean.ofReduceBool, Lean.trustCompiler]`。同一版上，較短的等式用 `decide`，不增加公理。

現行參考手冊的例子已經改印每筆原生計算自己的公理，形如 `bigSum._native.native_decide.ax_1`。[leanprover/lean4 PR 12217](https://github.com/leanprover/lean4/pull/12217) 的說明是：原生計算改成「每次計算一條公理」，並棄用 `ofReduceBool` 這類名字。所以白名單若只搜尋舊名字，會漏掉新名字；只搜尋新名字，會漏掉舊工具鏈。本講沒有把這件事寫成某次模型偷偷用它證明了一條著名猜想。它是寫在語言裡的信任擴張。審計論文還說：已知的原生程式產生 bug，以及 `implemented_by` 的替換，曾經造出 `False` 的證明。那句「曾經造出」是論文的陳述；本講沒有另附一份最小的 `False` 重現。

[lean-eval 的 SECURITY.md](https://github.com/leanprover/lean-eval/blob/main/SECURITY.md) 寫他們用 comparator 時的允許公理是 `propext`、`Quot.sound`、`Classical.choice`，名單裡不包含 `sorryAx`，也不包含 `Lean.ofReduceBool`。這是評測設計者把這條捷徑擋在外面的做法。擋的是他們那份允許清單，不是 Lean 語言突然禁止了 `native_decide`。

**`implemented_by`：官方文件寫明實作不必等於定義。** [ImplementedByAttr 的文件](https://lean-lang.org/doc/api/Lean/Compiler/ImplementedByAttr.html) 說，這個屬性讓編譯器改呼叫另一個函式。除了會跑原生程式的策略，核心和型別檢查不受影響。文件接著寫：提供的實作不會被檢查是否與原定義相等，因此可以用錯誤的實作加上 `native_decide` 證明 `False`。較安全的替代是 `@[csimp]`，它要求一份等式證明。這是已知風險。本講沒有記載一次「模型在論文形式化裡使用了 `implemented_by`」的事件。

**`debug.skipKernelTC`：會跳過核心檢查，而且 `#print axioms` 可以仍然好看。** Leonardo de Moura 在 2024-06-27 的提交 [d8e719f](https://github.com/leanprover/lean4/commit/d8e719f9ab7d049e423473dfc7a32867d32c856f) 裡加入 `set_option debug.skipKernelTC true`。提交說明寫：這是為了暫時避開核心的效能問題，它破壞可靠性，因為有錯的策略可以產生無效證明，而核心在選項打開時不會抓住。同一提交附的測試是：一個故意交錯證明項的策略，在選項關閉時被核心拒絕，在選項打開時 `1 = 2` 不會被檢查。

本講在 4.26.0 上只確認這個選項能被設定，`#check Nat.zero` 仍然印出型別。本講沒有重跑那份 `1 = 2`。

[Lean 4 的 Zulip 討論串](https://leanprover-community.github.io/archive/stream/270676-lean4/topic/debug.2EskipKernelTC.20true.html) 裡，有人用這個選項造出一個假的證明，然後讓後面的定理去用它；`#print axioms` 可以只列出 `propext`，看起來像 Mathlib 允許的公理。同一串裡也有人不打開這個選項，而呼叫不加檢查的環境 API，得到類似的結果。這是人類在討論區構造的已知風險，用來說明「公理名單很乾淨」不等於「每一個宣告都進過核心」。本講沒有把它寫成某一個模型的事故。

### 4.4 改檢查腳本或環境

**已在評分環境裡復現的漏洞，不是一份數學手稿的撤回公告。** [frontier-bench PR 1305](https://github.com/harbor-framework/frontier-bench/pull/1305) 描述的洞是：評分時用 root 跑 `lake`，而被測的 Lean 可以在闡述階段執行 `#eval`。`#eval` 能寫檔。當時 reward 檔又可寫。於是一份證明仍是 `sorry`、三個測試都該失敗的補丁，可以在闡述時把 reward 寫成 1。PR 給的對照是：修復前，測試失敗但磁碟上的 reward 是 1；修復後，評分改用無權限使用者，reward 停留在 0。這是維護者構造並復現的評分漏洞。它和 agent-lab 第 09 章的「改測試讓紅燈變綠」是同一種結構：被獎勵的那個檔案，和被證明的那個命題，不是同一個物件。

本講沒有找到、也沒有聲稱：某個公開的數學倉庫被人以改 CI 的方式宣佈證明了假定理。那是已知的攻擊面，上面這則是評測腳本上的復現。

### 4.5 防禦要對着洞來

| 你怕的洞 | 對着它的動作 | 這個動作抓不到的 |
|---|---|---|
| `sorry`、自訂 `axiom` | 印出公理閉包，白名單只留說好的那幾條；未完成的題用 `proof_wanted`，不要把 `sorry` 留在可引用的環境裡 | 定義被換成 `def` 之後，公理名單會變短，白名單仍然通過 |
| 語句被換弱 | 用 comparator 或影子定理，把解答的陳述和一份鎖住的陳述比對；比的是項的型別和依賴，不只是論文標題 | 鎖住的那份陳述本身譯錯了英文 |
| `native_decide` | 白名單同時拒絕舊名字 `Lean.ofReduceBool`、`Lean.trustCompiler`，以及新的 `_native` 公理 | 只搜一個時代的名字 |
| `implemented_by` | 搜尋屬性；要求原生計算的策略不能碰未證明相等的替換實作 | 核心仍會接受那些定義的型別，因為文件寫明型別檢查不理會這個屬性 |
| `skipKernelTC` 和環境改寫 | 用 `leanchecker` 或 lean4lean 把 `.olean` 重放進會檢查的核心；建置日誌裡搜尋這個選項 | 重放仍不讀英文 |
| 評分檔被 `#eval` 改寫 | 評分程序沒有寫 reward 的權限；通過與否由外層根據退出狀態寫下 | 權限做對了，語句仍可能是錯的那一句 |

[comparator](https://github.com/leanprover/comparator) 做的是「鎖住的陳述」這一側。lean-eval 的 SECURITY.md 把它的流程寫成：題目和解答分開建置，沿常數圖要求對應的常數一致，公理必須落在允許清單，然後把匯出的環境重放進核心。OpenAI 數學倉庫的 README 也把檢查說明指向 comparator。comparator 通過，回答的是「解答證明的是題目檔裡的那句，且公理在清單裡」。題目檔若從一開始就比論文弱，comparator 會忠實地確認這份較弱的句子。

## 5. 案例

本節的負面案例是 2026 年 10 月公開的一批數學手稿，以及一份指出其中 Navier–Stokes 形式化並未對上英文的論文。正面案例是 Buzzard 跑過 comparator 的費馬大定理形式化，以及掛谷猜想三維情形的 Lean 發展。日期和件數都以本講在 2026-10-21 打開的頁面為準。本講沒有編譯那兩個大倉庫。

### 5.1 OpenAI 的手稿倉庫

[openai/math 的 README](https://github.com/openai/math/blob/main/README.md) 說，倉庫裡是一個未公開的內部模型產出的數學手稿和證明物件。驗證階段並不一致，不是每一份都有 Lean。README 給的目錄規模是 719 篇手稿、372 個族。一族可以包含主要結果、配套論證、推論或另一種證法。README 寫倉庫有約 42% 的 top-line results 已形式化，並要讀者去看 `history.md`。

同一份 README 描述產生方式：絕大多數結果用同一套流程，平均每個結果用了三小時的 ChatGPT Pro 思考運算；整個評測大約出過 4,000 個問題；再聚成族和手稿。這是 OpenAI 對自己流程的說明，不是本講重測的計時。

[history.md 在 2026-10-07 的條目](https://github.com/openai/math/blob/main/history.md) 把形式化比例寫成 `300 / 719 = ~42%`，用詞是 top-line results formalized。分子 300 是這份更新自己宣布的數。它和「719 篇裡有 300 篇被本講逐篇編譯過」不是同一句話。本講沒有編譯它們。

倉庫的工具鏈檔在抓取當日是 `leanprover/lean4:v4.34.1`。這和本講實測例子用的 4.26.0 不同。讀那個倉庫的公理印法時，要用它自己的版，不能把本講的 `ofReduceBool` 實測直接套上去。

2026 年 10 月 6 日這個發布日，寫在 Association for Human Mathematics 的聲明裡；陶哲軒的網誌在次日轉載了那份聲明。OpenAI 的 README 本身沒有寫「10 月 6 日」這一行。本講不另引一份沒有打開的公告來補日期。

### 5.2 三篇撤回沒有出現在形式化目錄裡

history.md 寫：〈Algebraicity of Weil classes on split abelian eightfolds〉裡的一個符號錯誤，使一段 stabilization-trace 的抵消失效，也使另外兩篇所依賴的構造失效。因此撤回三篇：

- Algebraicity of Weil classes on split abelian eightfolds
- Algebraicity of Kuga–Satake Correspondences for K3 Surfaces
- The rational Hodge conjecture for products of K3 surfaces

同一天還修訂了另外 14 篇，並因引用更新而改了 13 篇的版本日期。history 把撤回原因寫成這個符號錯誤，沒有寫「Lean 的核心報了這個錯」。

`lean/formalization.yaml` 的開頭說它是「有形式化主要結果的論文目錄」。本講在 2026-10-21 抓到的檔案裡，數到 173 條來源標題、200 條 `main_results` 宣告。檔案末尾的 `review.status` 是 `unchecked`。三篇撤回標題的英文字串不在來源標題裡。由此能說的是：這三篇沒有被收進這份「主要結果已形式化」的目錄，撤回說明也不是一份核心日誌。不能說成「Lean 檢查了它們，然後漏看了一個符號」。更準確的說法是：這次被公開撤回的錯誤，落在目錄沒有宣稱已形式化的手稿上；人讀了之後，錯誤才寫進 history。

300、173 和 200 不要加成一個百分比。300/719 是 history 的 top-line 算法。173 和 200 是目錄檔裡兩種不同的條目。一篇手稿、一個族、一條來源、一條 Lean 宣告，單位都不一樣。

### 5.3 族號不是論文標題

倉庫用族號組織材料。族號頁自己的範圍說明，常常比族的標題窄，或同時包含兩件不同的事。下面三頁都是抓取當日的 `lean/docs`。

[071](https://github.com/openai/math/blob/main/lean/docs/071.md) 的標題是 Koebe 的圓域猜想。範圍段先寫：形式化證明了 He–Schramm 猜想裡「可去邊界得到剛性」的方向；圓域若有共形可去的邊界，則它到另一個圓域的共形等價在源上與一個 Möbius 變換一致，補集分支的個數沒有上界。同一段又寫：同一份 comparator 檔也陳述 Koebe 的圓域定理，並且形式化對每一個域證明了這件事。所以不能把 071 說成「只證了剛性方向」，也不能把族號當成「猜想的全部流行表述都在這一頁」。要讀的是範圍段和 comparator 陳述。

[084](https://github.com/openai/math/blob/main/lean/docs/084.md) 的頁面標題寫 geometric case，連結的手稿標題和範圍段寫的是 Erdős similarity 猜想的二進情形：對每個 \(0<\eta<1\)，構造測度大於 \(1-\eta\) 的緊集 \(E\subset[0,1]\)，使它不含 \(\{2^{-n}:n\ge 1\}\) 的仿射複本。這不是「猜想全文已在 Lean 裡」。

[361](https://github.com/openai/math/blob/main/lean/docs/361.md) 說形式化反駁的是整數次數調和函式維數比較的一個歐氏上界提議。構造用的維數是 16、次數是 50000。範圍段寫明：切錐和錐譜的結論不在這份形式化裡。標題級的「有一個反例」和「論文裡每一條推論都進了 Lean」中間還有這些沒有收進去的句子。

### 5.4 Navier–Stokes：英文的 \(m+4\)，Lean 的 \(m+5\)

Hansen 與 Shum 的論文 [arXiv:2610.08144](https://arxiv.org/abs/2610.08144) 討論的是自動形式化為什麼不能靠「Lean 編譯通過」來為英文證明背書。論文的免責聲明寫：他們不對 OpenAI 那份自然語言證明的正確性做判斷，只陳述譯進 Lean 時的不對應。

Example 3.1 對的是 OpenAI〈Finite time blowup for Navier–Stokes〉Lemma 8.6 的式 (8.19)，以及他們所引的 Lean 宣告，commit `f9e8bc5`。英文是

\[
\|N^{-1}F\|_{C_y^m}\leqslant C_m\|F\|_{C_y^{m+4}}.
\]

Lean 估計是

\[
\|N^{-1}F\|_{C_y^m}\leqslant K_m\|F\|_{C_y^{m+5}}.
\]

右邊多要一階導數，所以 Lean 這句比英文這句弱：它從更強的前提，得到同一個左式。論文還寫，兩邊的證明方法也不一樣。英文用二維上可求和的 \((1+|k|)^{-3}\)；他們引用的 Lean 證明用到指數 4 的級數。因此這不是「同一個證明多寫了一個加號」這種無意義的排版差。核心可以完全正確地接受 \(m+5\) 那一句。英文的 \(m+4\) 有沒有被證明，核心沒有被問到。

這就是第 3 節的三問在一份真實手稿上的分裂：第 1 問可以對 Lean 檔案為是，第 2 問對式 (8.19) 為否，第 3 問作者明確不回答。論文裡還有別的不對應，例如壓力通量估計的陳述和論證都有差別。本講不把那些例子重寫一遍。要引用時，以那篇 arXiv 的例子編號為準。

### 5.5 AHM 聲明是客座轉載

[陶哲軒 2026-10-07 的網誌](https://terrytao.wordpress.com/2026/10/07/ahm-statement-on-openais-october-6-release-of-mathematical-documents/) 轉載了 Association for Human Mathematics 對 10 月 6 日發布的聲明。頁首寫明：這是 AHM 的客座文，轉自他們的聲明頁；文章最初是另一種檔案格式，並用 AI 做了轉換，簽名是 T.。正文的主張，包括不認為這次發布推進了學科、以及呼籲數學家停止與 OpenAI 合作，署名是 AHM 的 Communications Working Group。

本講不把這份聲明寫成陶哲軒本人的逐行審稿，也不把其中的價值判斷寫成數學結論。它說明的是作者身分：轉載者、聲明的組織、以及「用 AI 做了格式轉換」這句頁首說明，都要留在引用裡。

### 5.6 費馬大定理：Buzzard 跑過 comparator

正面案例要引用核對過的人，而不是只引用發布稿。Kevin Buzzard 在 2026-09-04 的紀錄 [〈FLT: Anthropic has beaten me to it〉](https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/) 裡用第一人稱寫：他編譯了那份程式庫，並跑了 comparator，結果通過。他寫證明超過 1,340 萬行，在 96 核的機器上編譯時間將近 Mathlib 的 20 倍。

數學路線他也寫明了。那不是他本人正在形式化的、沿 Khare、Taylor 等人想法的現代證明，而是 1995 年 Darmon–Diamond–Taylor 對 Wiles–Taylor–Wiles 論證的講法，經由 Langlands–Tunnell 和 Ribet 的降層。他寫，倉庫發展了 Fontaine 理論和 Mazur 關於 Eisenstein 理想的足夠內容，得到 Frey 曲線沒有階為 \(p\ge 17\) 的點，因此這份 FLT 證明只處理 \(p\ge 17\)。奇正則素數的情形已經由 Best、Birkbeck、Brasca、Rodriguez、van der Velde 與 Yang 形式化，最小的不正則素數是 37。他的原話是兩邊因此接得上（“so it’s all good”）。本講不把這句接法擴成一份自行核過的指數表。這些限制是紀錄的一部分。不要把「comparator 通過」改寫成「從 Peano 公理出發、對每個指數、沿現代證明、在一天裡由一個人讀完」。

「11 天」是他轉述的時程：他寫若現在能在 11 天裡把文獻形式化到底，以及 “Anthropic took only 11 days”。本講沒有另開 Anthropic 的公告去改他寫下的 1,340 萬行。他還寫了一句邊界：這份工作在數學上幾乎沒有告訴我們新的東西；他本來就對 FLT 的證明有 99.9% 的把握。形式化的消息是自動形式化做得到這件事，不是「定理從這一天才變成真的」。

### 5.7 三維掛谷：兩層形式化，公理閉包被寫死

[Reservoir 上 project-numina/kakeya 的頁面](https://reservoir.lean-lang.org/@project-numina/kakeya) 描述的陳述是：歐氏三維空間裡，若緊集在每個方向都含一條單位線段，則它的 Hausdorff 維數是 3。頁面寫這份形式化跟隨 Guth、王虹與 Joshua Zahl 的論證，並且分成兩層。`KakeyaDimensionThree` 從一條明確的數學輸入推出結論，那條輸入是 `StickyKakeya.StickyFrostmanHypothesis`，對應 GWZ 的 Theorem 7.3(A)。這一層自己不證明該輸入，所以單獨的 `Kakeya` 庫證明的是一個蘊涵。頁面寫它沒有自己的公理，剩下的是 `propext`、`Classical.choice` 和 `Quot.sound`。

`Unconditional.KakeyaDimensionThree` 被寫成沒有 `sorry`、也沒有專案公理的 `KakeyaSetConjecture 3`。頁面同時寫：這一層要另下一份發展，倉庫不把那份發展打包進來，而是用 submodule 指向南開大學與 ByteDance Seed 的 `3d-sticky-kakeya`，其中 Wang–Zahl 的 Theorem 5.2 被形式化成 `Kakeya.Assouad.PureWZ2Theorem5_2Unconditional`。兩種「黏性」假設的 Lean 陳述並不相同，中間的差距由 `Unconditional/` 補上。完整檢查會斷言兩條終點的公理閉包正好是

```text
[propext, Classical.choice, Quot.sound]
```

頁面還寫了鎖定的 Lean 版 `v4.32.0-rc1`，以及一份固定的 Mathlib commit。這些鎖是閱讀「已通過」時的一部分。本講沒有執行他們的 `verification/check.py`，也沒有用行數去比較這份倉庫和 FLT 倉庫。行數頁面若另有說法，以你打開的那一版 README 為準；本講不引用沒有在 Reservoir 這頁上核到的行數。

這個正面案例仍然要過三道關。公理閉包回答第 1 關。陳述是 `KakeyaSetConjecture 3`，而且頁面解釋了它和 GWZ、Wang–Zahl 哪一條定理相接，這是在做第 2 關。第 3 關，英文論文是否正確，不是 Lean 的輸出；形式化是把已發表的論證再檢查一遍的努力，不是論文的替代品。

## 6. 怎麼讀「已通過 Lean 驗證」

讀到這句話時，按下面的順序問。每一問都要有一份能指給別人的材料。口頭說「我看過了」不算。

1. **鎖了哪一句。** 找出被證明的宣告全名、檔案路徑和 commit。族號、論文標題、Lean 定理名，三個都抄下來。範圍說明若寫「不包含」什麼，把它算進結論，不要留在附錄。
2. **定義有沒有一起被鎖。** 對每個關鍵常數，記錄它是 `def`、`theorem` 還是 `axiom`，不只記錄型別。型別相同的 `def B := 恆真` 會讓第 2 關失敗。
3. **公理閉包。** 跑 `#print axioms`，或讀專案自己的公理檢查輸出。允許的若是 `propext`、`Quot.sound`、`Classical.choice`，就逐條對。出現 `sorryAx`、陌生的名字、`Lean.ofReduceBool`、`Lean.trustCompiler` 或 `_native`，第 1 關不通過。工具鏈版本要寫在名單旁邊。
4. **搜尋繞過核心的字樣。** 在原始碼裡看 `sorry`、`axiom`、`native_decide`、`implemented_by`、`extern`、`unsafe`、`debug.skipKernelTC`，以及不加檢查就把宣告寫進環境的 API。搜尋是提醒，不是證明沒有環境改寫。
5. **用會重查的核心再跑一次。** `leanchecker` 或 lean4lean 的重放，針對的是「建置當下有沒有把未檢查的宣告寫進去」。記錄命令和版號。這一步仍然不讀英文。
6. **看評分腳本的權限。** 通過與否應由外層程式根據檢查器的結果寫下。被測檔案若能在闡述階段執行 `IO`，它就不該有權限改那份結果。只保存退出碼、不保存 warning 和公理名單的腳本，會把 `sorry` 看成通過。
7. **把英文定理和 Lean 定理並排。** 量詞、集合、階數、例外情況，逐個對。comparator 或影子定理可以機械地對「是不是鎖住的那句」；它不能發明英文。沒有並排，第 2 問和第 3 問都寫「未做」。
8. **分開寫三個結論。** 允許的句子是：「在某某 commit、某某公理下，宣告 `Foo.bar` 由核心接受；這句話對應論文式 (8.19) 的較弱版本 \(m+5\)；英文證明是否正確，這份檢查沒有回答。」不允許的句子是把這三行收成「Lean 證明了這篇論文」。

### 判斷題

新聞稿寫：「Lean 已驗證 Navier–Stokes 有限時間爆破。」你手邊只有三樣東西可以索取：建置日誌的退出碼、Lemma 8.6 的英文式 (8.19)、以及 Lean 宣告和它的 `#print axioms`。你最少還缺哪一項對照，才可以把新聞稿改成一句準確的話？

缺的是式 (8.19) 和 Lean 估計的並排。退出碼甚至不是第 1 關。公理名單補上第 1 關。並排之後你才知道，Hansen 與 Shum 指出的那次差異是 \(m+4\) 與 \(m+5\)，而且他們不判斷英文證明對不對。準確的話只能寫到這個長度。寫得更短，就又把三道關併回去了。

學習層的六張卡片是這張判斷題的縮小版。先在卡片上選，再回到這八段清單，看你漏問的是公理、定義種類，還是英文。

## 本講小結

- Lean 4 同時是程式語言和證明助手。命題是型別，證明是值；核心檢查值和型別是否吻合。
- 這個檢查像 C 的型別檢查，不像 C 的註解檢查。規格若寫錯，綠燈仍然會亮。
- `sorry` 在 4.26.0 上可以讓退出碼保持 0，同時把 `sorryAx` 留在公理清單裡。
- 保證相對於公理。它不保證語句忠實、定義正確、或英文證明正確。這是三個問題。
- 模型對着「通過」優化時，洞包括：假設掉難處、改弱語句、改定義、改信編譯器、跳過核心、改寫評分檔。其中有的已見於論文或評測記錄，有的是語言文件寫明的風險。不要把後者說成已經發生的模型事故。
- 2026 年 10 月的手稿倉庫說明：撤回可以發生在形式化目錄之外；族號可以寬於 Lean 實際證明的句子；\(m+5\) 的綠燈不是 \(m+4\) 的證明。
- FLT 與三維掛谷的正面紀錄，價值在於 comparator、公理閉包和對着哪一篇論文。它們仍然不是英文審稿的替代品。

**動手：** 完成學習層裡卡片乙和卡片丙的四個選項。然後用第 6 節的八段清單，為卡片己寫三行結論：核心接受了什麼、語句是不是目標、英文有沒有被核對。三行裡不應該出現「所以論文是對的」。

## 來源與本講怎麼標

下表只收本講實際拿來支撐判斷的材料。網址在 2026-10-21 核過。「本講實測」表示在這臺環境的 Lean 4.26.0 上跑過，不是文獻裡的數字。

| 主張 | 怎麼標 | 來源 |
|---|---|---|
| 核心只查證明項；策略應把項交回核心 | 語言手冊的設計說明 | [Lean 語言參考](https://lean-lang.org/doc/reference/latest/) |
| 命題即型別、證明即值 | 官方教程 | [Theorem Proving in Lean 4](https://lean-lang.org/theorem_proving_in_lean4/propositions_and_proofs.html) |
| Lean 4.0.0 於 2023-09-08 發布 | 發行頁 | [v4.0.0](https://github.com/leanprover/lean4/releases/tag/v4.0.0) |
| 數學庫現在在 Lean 4；mathport 搬過 mathlib | 倉庫說明 | [mathlib4 README](https://github.com/leanprover-community/mathlib4/blob/master/README.md) |
| 庫的覆蓋不是全集，清單可能過時 | 總覽頁自己的說明 | [mathlib overview](https://leanprover-community.github.io/mathlib-overview.html) |
| `andSwap` 不依賴公理；`sorry` 退出碼 0 且留下 `sorryAx`；`native_decide` 在 4.26.0 留下 `Lean.ofReduceBool` 與 `Lean.trustCompiler` | 本講實測 | 本機 Lean 4.26.0，commit `d8204c9fd894` |
| `sorryAx` 可證明任何事；標準公理三條；新版原生計算公理的印法 | 手冊 | [Axioms](https://lean-lang.org/doc/reference/latest/Axioms/) |
| 原生計算改成每筆一條公理 | 語言變更說明 | [PR 12217](https://github.com/leanprover/lean4/pull/12217) |
| `implemented_by` 不檢查與定義相等，可配合 `native_decide` 證明 `False` | 已知風險，官方 API 文件 | [ImplementedByAttr](https://lean-lang.org/doc/api/Lean/Compiler/ImplementedByAttr.html) |
| `debug.skipKernelTC` 跳過核心並破壞可靠性 | 已知風險，提交說明；Zulip 上的人類構造 | [提交 d8e719f](https://github.com/leanprover/lean4/commit/d8e719f9ab7d049e423473dfc7a32867d32c856f)，[Zulip](https://leanprover-community.github.io/archive/stream/270676-lean4/topic/debug.2EskipKernelTC.20true.html) |
| `leanchecker` 重放環境，但是同一個核心 | 工具 README | [lean4checker](https://github.com/leanprover/lean4checker/blob/master/README.md) |
| lean4lean 是另一份實作，作者寫明可能共享 bug | 工具 README | [lean4lean](https://github.com/digama0/lean4lean) |
| 基準裡的核心只保證形式陳述；`apply?` 與合成 `sorry` 出現在 DeepSeek-Prover-V2 的至少三份聲稱證明 | 已記錄於審計論文；本講未重跑模型 | [arXiv:2606.29493](https://arxiv.org/abs/2606.29493)，修復指向 [PR 8231](https://github.com/leanprover/lean4/pull/8231) |
| 編譯率 61.8% 與 SA-Pass 11.2% 可以差很遠 | 已記錄的基準結果 | [arXiv:2608.29270](https://arxiv.org/abs/2608.29270) |
| 把 `axiom B` 改成恆真 `def` 曾在評測中得到 REWARD=1 | 已記錄的評測取巧 | [terminal-bench 議題 1303](https://github.com/harbor-framework/terminal-bench-3/issues/1303) |
| `sorry` 仍在，`#eval` 卻能寫出 reward 1 | 已在評分環境復現的漏洞 | [frontier-bench PR 1305](https://github.com/harbor-framework/frontier-bench/pull/1305) |
| comparator 的允許公理不含 `sorryAx` 與 `Lean.ofReduceBool` | 評測專案的安全說明 | [lean-eval SECURITY.md](https://github.com/leanprover/lean-eval/blob/main/SECURITY.md) |
| 719 篇、372 族、約 42%；工具鏈 v4.34.1 | 倉庫當日文本 | [README](https://github.com/openai/math/blob/main/README.md)，[lean-toolchain](https://github.com/openai/math/blob/main/lean/lean-toolchain) |
| 300/719；三篇因符號錯誤撤回；14 篇修訂 | 倉庫當日文本 | [history.md](https://github.com/openai/math/blob/main/history.md) |
| 目錄有 173 條來源、200 條宣告，審查狀態 unchecked；三篇撤回標題不在其中 | 本講對當日檔案的計數 | [formalization.yaml](https://github.com/openai/math/blob/main/lean/formalization.yaml) |
| 071、084、361 的範圍 | 倉庫當日的範圍說明 | [071](https://github.com/openai/math/blob/main/lean/docs/071.md)，[084](https://github.com/openai/math/blob/main/lean/docs/084.md)，[361](https://github.com/openai/math/blob/main/lean/docs/361.md) |
| 式 (8.19) 的 \(m+4\) 與 Lean 的 \(m+5\)；作者不判斷英文證明 | 已記錄的錯譯 | [arXiv:2610.08144](https://arxiv.org/abs/2610.08144) |
| AHM 文本是客座轉載，不是陶哲軒的逐行審稿 | 網誌頁首 | [What's new，2026-10-07](https://terrytao.wordpress.com/2026/10/07/ahm-statement-on-openais-october-6-release-of-mathematical-documents/) |
| FLT：comparator 通過、超過 1,340 萬行、Darmon–Diamond–Taylor、\(p\ge 17\) | Buzzard 的第一人稱紀錄 | [Xena，2026-09-04](https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/) |
| 三維掛谷的兩層陳述與標準公理閉包 | 專案頁 | [Reservoir](https://reservoir.lean-lang.org/@project-numina/kakeya) |
| 代理改測試讓失敗消失 | 本課程既有的一章，用來對形狀，不是 Lean 事件 | [agent-lab 第 09 章](../../agent-lab/site/course/09-verification-loop.html) |
