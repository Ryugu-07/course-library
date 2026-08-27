# 语言 II · 语义、函数式与垃圾回收

> **对标**：TAPL / Harper *PFPL* / GC 手册（Jones）｜ **前置**：pl-01（λ 演算、类型）、comp-02（解释器）
> pl-01 讲了语言的类型骨架，这一页补三块：**形式语义**（怎么严格定义"程序是什么意思"，而非靠直觉）、**函数式编程范式**（不可变、纯函数、高阶抽象的威力，以及它为什么在并发和 ML 时代复兴）、**垃圾回收**（内存自动管理的机制——你写 Python/JS 不用 free，底下发生了什么）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：对象互相引用，却为什么仍然可能是垃圾？</h2>
<div class="learning-puzzle">
<h3>具体谜题：一个两节点环应不应该被回收？</h3>
<p>根集合只有 <code>main</code>，它曾指向对象 A；A 指向 B，B 又指向 A。随后 <code>main</code> 被改为 <code>null</code>。A、B 之间仍有两条引用。追踪式 GC 和纯引用计数会分别判断什么？如果一个程序的循环不变量是“队列长度等于入队减出队”，语义规则如何帮助我们证明优化没有改变它？</p>
</div>
<div class="learning-prediction">
<h3>先预测可达集与回收时机</h3>
<p>预测：<strong>①</strong> 根不可达后 A、B 都应被追踪式 GC 回收，尽管每个引用计数仍为 1；<strong>②</strong> 纯函数的相同输入可安全替换为相同输出，副作用则不能；<strong>③</strong> 分代 GC 会优先扫描年轻代，但跨代引用必须由 remembered set 等机制保留。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：语义关系 + 可达图</h3>
<p>形式语义给程序定义状态如何一步步变化或映射到数学对象；内存管理把堆看成有向图，从 roots 出发的可达闭包是活对象。函数式风格减少可变边，GC 则在不再可达时回收节点，两者解决的是不同层面的推理与资源问题。</p>
</div>
<div class="learning-formal">
<h3>形式机制与不变量</h3>
<p>小步操作语义写成 \(\langle e,\sigma\rangle\to\langle e',\sigma'\rangle\)，大步语义写成 \(\langle e,\sigma\rangle\Downarrow v,\sigma'\)；Hoare 三元组 \(\{P\}\ C\ \{Q\}\) 要求从满足 \(P\) 的状态执行 \(C\) 后得到满足 \(Q\) 的状态。GC 的活集是 \(\mathrm{Reach}(R)=\mu X.\ R\cup\mathrm{children}(X)\)，mark-sweep 回收 \(H\setminus\mathrm{Reach}(R)\)。引用计数只维护局部方程 \(\mathrm{rc}(o)=\#\{\text{incoming references}\}\)，因此无法识别无根环。</p>
<p>语义保持的不变量是编译器变换前后对观察上下文产生相同结果；GC 的安全不变量是永不回收仍可从根访问的对象。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul><li>追踪式 GC 能处理环，但不保证低延迟；暂停、并发标记、碎片和写屏障仍是工程权衡。</li><li>引用计数及时，却可能因环泄漏，并且每次增减计数在多线程下需要同步；弱引用只改变图中的保持关系。</li><li>纯函数易推理不代表整个程序无副作用；I/O、时间、随机数和资源释放必须在语义或效果系统中显式建模。</li></ul>
</div>
<div class="learning-transfer">
<h3>迁移任务：把堆图接到 Python 与 Rust</h3>
<p>画出 Python 小对象图，分别标根、强引用、环和可回收集；再比较 Rust 所有权释放与 tracing GC 的时间点。对 comp-02 的解释器写一条 Hoare 规格，说明一个环境/堆优化保持了什么观察行为，并把真实 GC 实验与这张图对照。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-pl-02-semantics-gc" markdown="1">
<p><strong>无 JavaScript 时的静态读法：</strong>根 <code>main</code> 指向 A，A→B，B→A；当 <code>main=null</code> 后，\(\mathrm{Reach}(R)=\varnothing\)，追踪式 GC 回收 A、B。纯引用计数看到 A、B 各有 1 条环内引用，计数不归零，因而泄漏。交互版可切换根、边和 GC 策略，显示 mark/sweep、copying 与 ref-count 的状态变化。</p>
<table><thead><tr><th>对象</th><th>入引用（根失效后）</th><th>追踪式 GC</th><th>引用计数</th></tr></thead><tbody><tr><td>A</td><td>来自 B：1</td><td>回收</td><td>保留</td></tr><tr><td>B</td><td>来自 A：1</td><td>回收</td><td>保留</td></tr><tr><td>根</td><td>0</td><td>不在堆</td><td>不在堆</td></tr></tbody></table>
</div>
</section>

## 1. 形式语义：程序"意义"的严格定义

编译器/解释器要正确，先得说清"程序该做什么"——这就是**语义**。三种风格：

- **操作语义（operational）**：用**归约规则**定义"程序一步步怎么执行"（pl-01 的 β 归约、comp-02 的 `eval` 就是操作语义）。最直观、最常用于实现和证明。分小步（single-step，看每一步）和大步（big-step，直接给最终结果）。
- **指称语义（denotational）**：把程序**映射到数学对象**（函数、集合）——"这个程序 = 这个数学函数"。抽象、优雅，用于推理程序等价。
- **公理语义（axiomatic）**：用**逻辑断言**描述——**Hoare 逻辑** $\{P\}\,C\,\{Q\}$："若执行前 $P$ 成立，执行 $C$ 后 $Q$ 成立"。这是**程序验证**的基础（🔗 与形式化方法、Lean 证明程序正确性相通）——循环不变量、前置/后置条件都从这来。

**为什么要形式语义**：① 语言设计无歧义（规范书里的语义定义让不同实现行为一致）；② **证明编译器/优化正确**（comp-03 的优化不改变语义——"不改变语义"要先有语义的严格定义）；③ 程序验证（证明这段代码满足规约）。**"意义的数学化"是 PL 从手艺变成科学的关键**。

## 2. 函数式编程：不可变的威力

pl-01 的 λ 演算是函数式的根。函数式范式的核心信条：

- **纯函数**：输出只依赖输入、无副作用（不改全局、不做 I/O）——**引用透明**（同输入必同输出，可安全替换、缓存、并行）。
- **不可变数据**：不修改、只创建新版本——**消灭了一大类 bug 的根源**（别名导致的意外修改、并发的数据竞争 os-02）。
- **高阶函数**：函数当参数/返回值——`map`/`filter`/`reduce`（🔗 dist-03 MapReduce 直接借名！）、组合子、柯里化。

**为什么函数式在今天复兴**：

- **并发友好**：不可变 + 无共享状态 = **天然无数据竞争**（par 线/os-02 的噩梦大半消失）——Erlang/Elixir 靠这个做高并发、Rust 借鉴不可变默认。
- **ML/数据流友好**：纯函数 + 不可变正是 JAX/函数式 autodiff（mlsys-01）的基础——计算图是纯函数组合、可微、可并行、可优化。
- **易推理**：无副作用的代码好测试、好验证（Hoare 逻辑更简单）。

**实践中的融合**：现代主流语言都吸收了函数式特性——Python 的 `map`/lambda/列表推导、JS 的高阶函数、Rust 的迭代器 + `Option`/`Result`（避免 null，🔗 rust-01）。**你不必写纯函数式语言，但"优先不可变、优先纯函数"是能立刻用上的工程纪律**（写 Medusa 的数据处理时，纯函数管线比一堆可变状态好调试得多）。

## 3. 代数数据类型与模式匹配

函数式语言的一个杀手级特性，正在被所有现代语言抄——**代数数据类型（ADT）+ 模式匹配**：

- **和类型（sum type）** `type Shape = Circle(r) | Rect(w,h)`——"要么是这个要么是那个"，编译器**强制你处理所有情况**（🔗 pl-01 的和类型 $A+B$）。
- **模式匹配** `match shape { Circle(r) => ..., Rect(w,h) => ... }`——按形状解构 + 分发，**穷尽性检查**保证不漏 case。
- **`Option`/`Result` 消灭 null**：把"可能没有值""可能出错"编码进类型（`Option<T>` = 有 T 或没有），**强制处理"空"的情况**——Tony Hoare 称 null 是他的"十亿美元错误"，ADT 是解药（rust-01 会看到 Rust 靠它根除空指针）。

**这是本站反复出现的主题的又一例**：**把"容易忘的运行时情况"编码进类型、让编译器强制处理**——类型系统当纪律执行者（pl-01 的 soundness、rust 的所有权同一哲学）。

## 4. 垃圾回收：内存自动管理


<figure class="diagram" markdown="1">
![GC 三法：标记-清除 / 复制式 / 分代（新生代频繁回收）+ 可达性根。](assets/img/pl-02-gc.svg)
<figcaption><span class="fig-id">图 pl-02.1</span>GC 三法：标记-清除 / 复制式 / 分代（新生代频繁回收）+ 可达性根。</figcaption>
</figure>
<figure class="diagram" markdown="1">
![三条内存路线：手动(C) / GC(Java/Python) / 所有权(Rust) 对比（贯穿语言线）。](assets/img/pl-02-memory-routes.svg)
<figcaption><span class="fig-id">图 pl-02.2</span>三条内存路线：手动(C) / GC(Java/Python) / 所有权(Rust) 对比（贯穿语言线）。</figcaption>
</figure>

C 要手动 `malloc`/`free`（csapp-04 的痛），容易泄漏/悬垂。**垃圾回收（GC）**自动回收"不再可达"的内存——你写 Python/Java/JS/Go 不用管 free，靠的是它。核心机制：

- **可达性**：从根（栈、全局变量）出发能到达的对象是"活的"，到不了的是垃圾。
- **追踪式 GC**：
  - **标记-清除（mark-sweep）**：标记所有可达对象、清除其余。会产生碎片。
  - **复制式（copying）**：把活对象复制到新空间、整个旧空间回收——无碎片但用双倍空间。
  - **分代 GC（generational）**：**"大多数对象很快就死"（弱分代假说）**——把新对象放"年轻代"频繁快速回收、老对象放"老年代"少回收。**这是现代 GC（JVM、V8、Go）的主力**，抓住了对象生命周期的统计规律。
- **引用计数**：每对象记被引用次数、归零即回收（Python 的主力 + 循环检测）——**及时、平滑，但处理不了循环引用**（要辅助手段）、且计数更新有开销。

**GC 的权衡**：省心、消灭内存 bug——代价是**运行时开销 + 停顿（GC pause）**（回收时可能暂停程序，实时系统的敌人）。**这正是 Rust 的立场（rust-01）**：**不用 GC、也不手动 free，而是用所有权在编译期确定何时释放**——既无 GC 停顿又无内存 bug。**"手动管理（C）vs GC（Java/Python）vs 所有权（Rust）"是内存管理的三条路线**，各有取舍，本站语言线把三者讲全。

## 5. 练习与要点

**例 1（Hoare 逻辑手推）** 给一段"交换两变量"的代码，用 $\{P\}C\{Q\}$ 证明它确实交换了——**体会"用逻辑断言证明程序正确"**，程序验证的最小例子。

**例 2（纯函数改写）** 把一段用可变全局状态累加的代码改写成纯函数 + `reduce`——**体会引用透明如何让代码可测、可并行**。Medusa 数据处理可用。

**例 3（GC 判活）** 画一个有循环引用但从根不可达的对象图，判断追踪式 GC（能回收）vs 引用计数（漏掉）的区别——**理解"为什么 Python 除了引用计数还需要循环检测器"**。$\blacksquare$

---

*下一页：Python I——数据模型与惯用法：你天天用的 Python，它一切皆对象的世界观、dunder 协议与 Pythonic 惯用法。（语言线接下来走三门主力语言：Python 的高层生产力 → C++ 的系统级掌控 → Rust 的安全综合。）*
