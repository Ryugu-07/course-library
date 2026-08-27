# Rust II · 并发、trait 与 unsafe 边界

> **对标**：*The Rust Programming Language* / *Rust for Rustaceans*（Gjengset）｜ **前置**：rust-01（所有权）、par-02（无锁、数据竞争）、os-02（并发）
> 这一页把 Rust 的三块高级能力讲透：**无畏并发**（所有权如何在编译期消灭数据竞争——par 线所有噩梦的解药）、**trait**（Rust 的抽象与多态机制，接口 + 泛型的统一）、以及 **unsafe**（什么时候必须跳出安全网、以及安全抽象的边界哲学）。读完，你会明白 Rust 为什么能同时用于操作系统内核和 Web 后端。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：把引用送进线程，就自动变成线程安全了吗？</h2>
<div class="learning-puzzle">
<h3>具体谜题：计数器、通道与锁</h3>
<p>两个线程各执行 100 次 <code>counter += 1</code>。若共享的是裸可变引用，最终值为何可能小于 200？把数据改为每线程局部计数后通过 channel 汇总，或放进 <code>Arc&lt;Mutex&lt;u64&gt;&gt;</code>，Rust 分别凭什么允许或拒绝这些写法？</p>
</div>
<div class="learning-prediction">
<h3>先预测编译期边界</h3>
<p>预测：<strong>①</strong> 裸共享可变引用不能安全跨线程，编译器拒绝；<strong>②</strong> channel 转移消息所有权，接收端获得唯一 owner，能避免共享写；<strong>③</strong> <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> 通过原子引用计数 + 互斥锁提供共享同步，但仍可能死锁或造成争用。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：Send、Sync 与同步协议</h3>
<p><code>Send</code> 约束值能否转移到另一线程，<code>Sync</code> 约束共享引用能否跨线程；它们是由内部字段递归决定的 trait 边界。类型系统阻止无同步的别名写入，运行时原语仍负责排队、互斥、唤醒和内存顺序。</p>
</div>
<div class="learning-formal">
<h3>形式机制与不变量</h3>
<p>数据竞争要求两个并发访问同一位置、至少一个写、且没有 happens-before；Rust safe code 通过所有权/借用与 <code>Send</code>/<code>Sync</code> 边界拒绝这类别名。互斥不变量是同一时刻至多一个 guard 持有锁；channel 不变量是消息只能被符合类型的接收端消费一次。若原子 flag 用 release 写、acquire 读，则发布前的写入对读取方可见。</p>
<p>无锁算法还要保持 par-02 的线性化与回收不变量；trait 通过并不等于具体算法证明完成。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul><li><code>Arc</code> 只安全管理共享所有权，不会让内部数据自动可变；<code>Arc&lt;RefCell&lt;T&gt;&gt;</code> 通常不能跨线程，因为 <code>RefCell</code> 没有线程同步。</li><li><code>Mutex</code> 可避免数据竞争，却不能避免锁顺序造成的死锁、持锁 I/O 或饥饿。</li><li><code>unsafe</code> 可以绕过检查器，但必须由作者恢复别名、生命周期、同步和 FFI 契约，否则“编译通过”没有安全含义。</li></ul>
</div>
<div class="learning-transfer">
<h3>迁移任务：从 L10 的 bug 到 Rust API</h3>
<p>把 L10 的无锁栈、生产者消费者和共享计数器各画出所有权/同步图，分别选择 channel、<code>Mutex</code>、<code>AtomicUsize</code> 或安全封装。记录它们的线性化点、阻塞行为、内存序和错误路径，比较与 par-02 手写 CAS 的边界。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-rust-02-concurrency" markdown="1">
<p><strong>无 JavaScript 时的静态读法：</strong>两个线程各加 100 次，裸共享可变引用存在 data race，不能假设最终为 200；channel 让每个线程发送局部计数，主线程串行求和得到 200；<code>Arc&lt;Mutex&lt;u64&gt;&gt;</code> 每次加法需先锁定 guard，正确结果为 200，但会有锁争用。交互版切换裸引用、channel、Arc/Mutex 和原子计数，显示 Send/Sync gate、临界区时间线与结果不变量。</p>\n+<table><thead><tr><th>方案</th><th>跨线程权限</th><th>同步点</th><th>预期结果</th></tr></thead><tbody><tr><td>裸 <code>&mut</code></td><td>拒绝</td><td>无</td><td>不能构造</td></tr><tr><td>channel</td><td>转移 owner</td><td>send/recv</td><td>200</td></tr><tr><td>Arc/Mutex</td><td>共享 + 独占 guard</td><td>lock/unlock</td><td>200</td></tr><tr><td>AtomicUsize</td><td>原子读改写</td><td>原子操作</td><td>200</td></tr></tbody></table>\n+</div>\n+</section>\n+\n+## 1. 无畏并发：数据竞争的编译期终结

par-02/os-02 里，数据竞争是最难调的 bug（间歇性、不可复现）。**Rust 的洞见**：数据竞争的定义是"≥2 线程访问同一数据、≥1 个写、无同步"——而 rust-01 的**借用铁律（共享不可变 XOR 可变不共享）恰好禁止了"可变 + 共享"**。把它扩展到线程间，数据竞争就在编译期不可能。靠两个 trait：

- **`Send`**：类型的所有权可以安全**转移**到另一线程。
- **`Sync`**：类型可以安全地被多线程**共享引用**（`&T` 能跨线程）。

编译器自动为大多数类型推导这两个标记，并**强制**：想跨线程共享可变数据，必须用**同步类型**——`Mutex<T>`（互斥锁，os-02）、`Arc<T>`（原子引用计数，多线程共享所有权）、`atomic`（无锁原语，par-02）。**忘了加锁？编译不过**——borrow checker 拦下。**"数据竞争在 Rust 里是编译错误而非运行时灾难"**，这就是"无畏并发"的字面兑现——你可以大胆写多线程，编译过了就没有数据竞争（死锁仍可能，那是逻辑问题 os-02，但数据竞争没了）。

**典型模式**：

- 共享只读数据：`Arc<T>`（多线程共享所有权、不可变）。
- 共享可变数据：`Arc<Mutex<T>>`（引用计数 + 锁）——编译器强制你先拿锁才能改。
- 消息传递：`channel`（🔗 pl-02 函数式 + par-01 消息传递哲学）——"不要通过共享内存通信，要通过通信共享内存"（Go 的哲学 Rust 也支持）。

**这缝合了本站三条线**：os-02 的锁/竞态 + par-02 的原子/内存序 + rust-01 的所有权 = **Rust 把并发的正确性从"程序员自律"变成"编译器强制"**。你读到这里回看 par-02 那些 ABA、内存序噩梦，会明白 Rust 消灭的正是它们。

## 2. Trait：Rust 的抽象引擎

**trait** 是 Rust 的接口/多态机制——定义"一个类型能做什么"，是泛型和抽象的核心（类似 Java interface + Haskell typeclass，🔗 pl 线的类型类）：

- **定义共享行为**：`trait Draw { fn draw(&self); }`，任何类型 `impl Draw` 就能被当 `Draw` 用。
- **泛型约束（trait bound）**：`fn print_all<T: Display>(items: &[T])`——"T 必须能显示"，编译器检查。**这是 HM 类型推断（pl-01）+ 约束的实用形态**。
- **两种多态**：
  - **静态分发（泛型，单态化）**：编译期为每个具体类型生成专门代码——**零成本抽象**（rust-01），和手写一样快，但代码膨胀。
  - **动态分发（trait object `dyn Trait`）**：运行时虚表查找——灵活（异构集合）、有小开销。**"编译期特化 vs 运行时多态"的选择**，对应 comp 线的单态化 vs 虚函数。
- **标准 trait 组成生态**：`Iterator`（惰性迭代器，函数式 pl-02，零成本）、`Clone`/`Copy`（复制语义）、`Drop`（析构，所有权释放钩子）、`From`/`Into`（转换）——**trait 是 Rust 表达力和一致性的来源**。

**读法**：**trait 让 Rust 既有 C 的性能又有高级语言的抽象**——泛型 + trait bound 在编译期解决，运行时零负担。你写 `.iter().map().filter().collect()` 这样的函数式链，编译后和手写循环一样快。

## 3. unsafe：安全网的边界

Rust 的安全保证靠借用检查器，但有些事它**证明不了安全**（却确实安全）——底层内存操作、调用 C、实现无锁结构（par-02）、硬件寄存器访问。这时用 **`unsafe`** 块，解锁五种超能力（如解引用裸指针、调用 unsafe 函数）。

**关键哲学——安全抽象封装 unsafe**：

- `unsafe` **不是"关闭所有检查"**——它只解锁那五种操作，借用检查在 unsafe 块内照常工作。
- **正确用法**：用少量 `unsafe` 实现底层机制，然后**用安全接口封装它**、并**由人来证明这个 unsafe 块满足安全不变量**。标准库的 `Vec`、`Mutex` 内部都有 unsafe，但对外暴露完全安全的 API——**"把不安全关进一个被审查过的小盒子、外面全是安全的"**。
- **责任转移**：安全代码里的 bug 编译器帮你挡；`unsafe` 里的 bug **是你（人）在承诺"我证明过这里安全"**。所以 unsafe 要少、要集中、要审查、要注释清楚安全论证。

**这是 Rust 工程哲学的精髓**：不是"永远安全"（那做不了系统编程），而是**"默认安全 + 显式标记的不安全边界 + 人对边界负责"**——大部分代码享受编译器保护，极少数底层代码明确标出、集中审查。**这个"把危险局部化并显式化"的思想，本身就是一种优秀的工程纪律**（🔗 与 sec 线"缩小攻击面"、系统线"隔离"同构）。

## 4. Rust 的定位:什么时候用它

- **系统编程**：OS 内核（Linux 已接纳 Rust）、嵌入式、浏览器引擎、数据库——要 C 的性能又要安全。
- **高性能后端 / 基础设施**：Web 服务（actix/axum）、网络代理、CLI 工具、WASM——你的 Medusa 若某个热点组件要极致性能 + 可靠，Rust 是候选。
- **不太适合**：快速原型/脚本（Python 更快出活）、GC 停顿无所谓且开发速度优先的场景。
- **学习价值（对你）**：**即使不用 Rust 写生产，学它也让你彻底想清 C 的内存和并发规则**——它是最好的"系统思维教练"，把你在 csapp/os/par 线学的隐性规则显式化。

## 5. 练习与要点

**例 1（无畏并发实操）** 用 `Arc<Mutex<T>>` 让多个线程安全地共享递增一个计数器——对比 os-02 里 C 版的数据竞争（那里要小心加锁、错了静默出错），Rust 里忘加锁直接编译不过。**"编译器逼你正确"亲手体验**。

**例 2（trait 双分发）** 同一个 `Draw` trait，用泛型（静态分发）和 `Vec<Box<dyn Draw>>`（动态分发）各写一次——理解"编译期特化 vs 运行时虚表"的取舍。

**例 3（unsafe 边界）** 读标准库 `Vec::push` 的实现（内部有 unsafe 处理未初始化内存），理解"unsafe 实现 + 安全接口"的封装模式——**理解 Rust 不是没有 unsafe，而是把它关进审查过的盒子**。$\blacksquare$

---

*语言线完成（4 页）。下一页进入工程与全栈线——以你正在运营的 Medusa 为解剖标本，看一个请求从浏览器到数据库的完整旅程。*
