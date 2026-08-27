# Python II · 运行时、GIL 与性能生态

> **对标**：CPython 内部 / *Fluent Python* 并发章 / High Performance Python ｜ **前置**：py-01、comp-02（字节码/解释器）、par 线（并发）、mlsys 线
> py-01 讲 Python 的抽象，这一页讲它的**运行时真相**：CPython 怎么执行你的代码、为什么 Python"慢"、**GIL 如何限制多线程并行**（每个 Python 程序员迟早撞上的墙）、以及生态怎么补救（numpy 把热点降到 C、async 处理 I/O 并发、多进程绕开 GIL）。这决定了你在 Medusa 里该怎么选并发模型、什么时候 Python 够用、什么时候要下沉到 C/换语言。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：两个 Python 线程为什么没有把 CPU 密集循环做成两倍快？</h2>
<div class="learning-puzzle">
<h3>具体谜题：同一段工作，线程、进程还是异步？</h3>
<p>有 2 个 CPU 密集任务，各需 100 个时间单位；有 2 个网络等待任务，各只用 5 个 CPU 单位但等待 95。CPython 的 GIL 在字节码执行期间允许哪个粒度的并发？线程、进程、<code>asyncio</code> 分别会怎样影响完成时间与开销？</p>
</div>
<div class="learning-prediction">
<h3>先预测三条曲线</h3>
<p>预测：<strong>①</strong> 纯 Python CPU 循环用两个线程不会接近 2 倍加速，可能因切换和锁竞争更慢；<strong>②</strong> I/O 线程可在一个任务等待时运行另一个，吞吐改善不等于 CPU 并行；<strong>③</strong> 多进程能利用多个核心，但要付进程启动、序列化和内存复制代价，NumPy/C 扩展下沉后则可能绕开 Python 字节码瓶颈。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：字节码解释、GIL 时间片、外部并发</h3>
<p>CPython 以解释器循环执行字节码，Python 对象操作还包含引用计数和动态分派。GIL 把同一解释器内的 Python 字节码执行串成可切换的片段；I/O 或释放 GIL 的原生代码能让其他线程前进，进程则拥有独立解释器和地址空间。</p>
</div>
<div class="learning-formal">
<h3>形式机制与不变量</h3>
<p>把单个任务分成 CPU 时间 \(C\) 与等待时间 \(W\)。单线程两个独立任务的工作量是 \(\sum(C_i+W_i)\)；理想 I/O 交错的墙钟时间接近 \(\max C\) 加等待的覆盖部分，而 CPU 密集 Python 线程受共享解释器约束，\(T_{threads}\gtrsim\sum C_i\) 加调度开销。进程池的理想计算项约为 \(\max_i C_i/N\)，但还要加序列化、启动、通信和内存成本。</p>
<p>运行时不变量是引用计数/对象状态的内部一致性；应用层的正确性不变量仍需显式锁、队列或不可变消息，GIL 不是业务数据的事务协议。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul><li>“GIL 让所有 Python 并发都无用”是错误的：I/O、原生扩展、异步任务和多进程的瓶颈不同。</li><li>进程并行不保证线性加速；小任务、频繁 IPC、共享大数组和 NUMA 可能抵消收益。</li><li>异步只在等待可挂起、库遵守非阻塞协议时有效；把阻塞调用塞进 event loop 会让所有协程停住。</li></ul>
</div>
<div class="learning-transfer">
<h3>迁移任务：给 Medusa 任务选运行时</h3>
<p>把一个 CPU 预处理、HTTP 批量请求和 NumPy 矩阵运算分别标注为线程/进程/async/原生扩展候选。记录 wall time、CPU 利用率、上下文切换、序列化字节数和结果顺序，连接 par-01 的任务并行与 perf-01 的测量闭环。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-py-02-runtime-gil" markdown="1">
<p><strong>无 JavaScript 时的静态读法：</strong>两个 CPU 密集 Python 任务各需 100 CPU 单位时，单解释器线程的 Python 字节码总 CPU 工作仍是 200，第二线程主要交错而非同时执行；两个 I/O 任务各用 5 CPU、等待 95 时，线程可把等待重叠，墙钟时间接近一次等待窗口而非简单相加。交互版可切换 CPU/I/O 比例、线程/进程/async，并显示计算、等待、调度和通信账本。</p>\n+<table><thead><tr><th>工作类型</th><th>首选模型</th><th>可重叠部分</th><th>主要成本</th></tr></thead><tbody><tr><td>纯 Python CPU</td><td>进程/原生扩展</td><td>不同进程的 CPU</td><td>启动与 IPC</td></tr><tr><td>网络 I/O</td><td>线程/async</td><td>等待时间</td><td>阻塞库/切换</td></tr><tr><td>NumPy 热点</td><td>向量化/扩展</td><td>C 内核与 Python</td><td>数据搬运</td></tr></tbody></table>\n+</div>\n+</section>\n+\n+## 1. CPython 怎么跑你的代码


<figure class="diagram" markdown="1">
![CPython 执行：.py→字节码→解释器循环（慢在解释+装箱+动态）。](assets/img/py-02-cpython.svg)
<figcaption><span class="fig-id">图 py-02.3</span>CPython 执行：.py→字节码→解释器循环（慢在解释+装箱+动态）。</figcaption>
</figure>

你写的 `.py` 不是直接执行的。CPython（最主流的实现）分两步（🔗 comp-02 的"字节码 + 虚拟机"）：

1. **编译成字节码**：`.py` → 一串字节码指令（`.pyc` 缓存）——这是编译，不是机器码。
2. **字节码解释器执行**：一个大循环逐条取字节码、执行——**这就是 Python"慢"的根源**：每条操作都要经过解释器的分发、每个对象都是堆上的装箱对象（`int` 也是对象，带引用计数 + 类型信息）、动态类型意味着每次操作都要运行时查类型。

**"慢"的量级**：纯 Python 数值循环比 C 慢约 **50–100 倍**——因为 C 直接在寄存器上算，Python 每步都在解释 + 装箱。**但这不是 Python 的失败**——它用运行速度换开发速度和灵活性，且热点可以下沉（第 4 节）。**理解"Python 慢在解释 + 装箱 + 动态"，你就知道该在哪优化**（把热循环交给 numpy/C，而非用纯 Python 硬扛）。

**内存管理**：CPython 用**引用计数为主 + 分代 GC 补充**（🔗 pl-02）——对象引用归零立即回收（及时、可预测），循环引用靠周期性 GC 清。所以 Python 里"什么时候释放内存"比追踪式 GC 更可预测，但引用计数的更新有开销、且是 GIL 的一个原因。

## 2. GIL：多线程并行的墙


<figure class="diagram" markdown="1">
![GIL：多线程轮流拿锁，CPU 密集只用一核（多进程才并行 / I/O 等待时释放 GIL）。](assets/img/py-02-gil.svg)
<figcaption><span class="fig-id">图 py-02.2</span>GIL：多线程轮流拿锁，CPU 密集只用一核（多进程才并行 / I/O 等待时释放 GIL）。</figcaption>
</figure>

**全局解释器锁（GIL）**是每个 Python 程序员的必修痛点——**CPython 同一时刻只允许一个线程执行 Python 字节码**。即使你开 8 个线程、机器有 8 核，**CPU 密集的 Python 多线程也只用得上一个核**（线程们轮流拿 GIL）。

- **为什么有 GIL**：简化 CPython 实现 + 保护引用计数不被并发破坏（否则每个对象都要加锁，更慢）。它是历史 + 实现权衡的产物。
- **后果**：
  - **CPU 密集任务**（纯 Python 计算）：多线程**无并行加速**，甚至因锁竞争更慢（🔗 par-01 Amdahl 的极端——串行部分是整个解释器）。
  - **I/O 密集任务**：多线程**有效**——因为线程等 I/O 时**释放 GIL**，别的线程能跑。所以"多线程做并发下载/请求"在 Python 里是可行的。

**这直接决定 Medusa 的并发选择**：

- 等数据库、等 DeepSeek API = **I/O 密集** → **async 或多线程都行**（GIL 不碍事，等待时释放）。
- 本地跑 embedding、大量数值计算 = **CPU 密集** → 多线程没用，要**多进程**或**下沉到 C/numpy**（下节）。

## 3. 三条绕开 GIL / 提速的路

- **多进程（multiprocessing）**：每个进程有自己的解释器 + GIL——**真正并行用满多核**，代价是进程间通信要序列化（pickle）+ 内存不共享（🔗 os-01 进程 vs 线程、par-01 消息传递）。CPU 密集的 Python 并行正道。
- **异步（asyncio）**：单线程事件循环处理海量 I/O 并发（🔗 web-02 的 async 深入）——`async def` / `await`，遇 I/O 挂起去干别的。**高并发 I/O 的首选**，比多线程更省资源。FastAPI（Medusa 后端）就是它。
- **下沉到 C（最重要）**：把热点交给 C 扩展——**这些库在 C 层释放 GIL、直接操作连续内存**：numpy（向量化数值）、pandas、以及你的 pipeline 里的 sentence-transformers/torch。**"用 Python 写胶水、用 C 库做重活"是 Python 高性能的标准姿势**（下节展开）。

**近况一提**：Python 3.13 开始有**实验性无 GIL 构建（free-threading）**——长期可能移除 GIL 限制，但生态适配需时间。了解趋势即可，当下仍按上述三路走。

## 4. 生态：Python 慢，但它的 C 底座不慢


<figure class="diagram" markdown="1">
![下沉热点：Python 胶水层 + numpy/C/CUDA 底座。](assets/img/py-02-numpy-sink.svg)
<figcaption><span class="fig-id">图 py-02.1</span>下沉热点：Python 胶水层 + numpy/C/CUDA 底座。</figcaption>
</figure>

Python 之所以统治数据科学/AI，不是因为快，而是因为**它是一层友好的胶水，底下挂着高度优化的 C/Fortran/CUDA 库**：

- **numpy**：向量化数组运算——一个 `a * b`（数组）在 C 层用连续内存 + SIMD（🔗 perf-01）算完，**比 Python 循环快几十上百倍**。诀窍是**别写 Python 循环，写数组操作**（把循环下沉到 C）。
- **pandas / polars**：数据框，列式 + 向量化（🔗 db-02 列存、perf-02）。
- **PyTorch / JAX**：张量运算 + autodiff，底下是 CUDA（🔗 gpu 线、mlsys 线）——你的 embedding 生成、模型推理全靠它们把重活丢给 GPU。
- **Cython / C 扩展 / ctypes / PyO3(Rust)**：把你自己的热点函数写成编译语言。

**方法论**：**Python 性能优化的第一原则是"下沉热点"**——用 profiler（`cProfile`）找瓶颈，把热循环改成 numpy 向量化操作或 C 扩展，让 Python 只当调度层。**对 Medusa**：数据处理用 pandas/numpy 向量化而非 Python 循环；真要极致性能的小热点，可考虑 Rust 写扩展（🔗 rust 线，PyO3 让 Rust 无缝当 Python 库）。

## 5. 打包与依赖：Python 的另一个痛点

Python 的依赖管理是出了名的乱（🔗 csapp-03 动态链接、cloud-01 容器的动机之一就是治它）：

- **虚拟环境**：`venv`/`conda` 隔离每个项目的依赖——**别往全局装**（你的课程站都用独立 venv，正确）。
- **依赖锁定**：`requirements.txt`/`pyproject.toml` + lockfile 固定版本——保证可复现（🔗 se-02、sec-02 供应链）。
- **现代工具**：`uv`/`poetry`/`pip-tools` 让依赖管理更可靠。
- **容器化终极方案**：把 Python + 依赖打进 Docker（🔗 cloud-01）——彻底消除"环境不一致"，Medusa 的 Postgres 已容器化，应用层同理可控。

## 6. 练习与要点

**例 1（GIL 实证）** 写一个 CPU 密集函数（如大量纯 Python 求和），分别用单线程、多线程（4 线程）、多进程（4 进程）跑，测时间——**多线程不加速甚至更慢、多进程才快**，GIL 的墙亲眼可见。再换成 I/O 密集（sleep 模拟），多线程就有效了。

**例 2（numpy 下沉）** 同一个数组运算用 Python 循环 vs numpy 向量化，测加速比（几十倍起）——**理解"把循环下沉到 C"为什么是 Python 性能的正道**。Medusa 数据处理直接可用。

**例 3（选并发模型）** 给 Medusa 三个任务（并发调 100 个 DeepSeek API、本地算 1 万条 embedding、并发查数据库）各选 async / 多进程 / 多线程——**把"I/O 密集用 async、CPU 密集用多进程"的判断用到真实系统**。$\blacksquare$

---

*下一页：C++ I——抽象、RAII 与值/移动语义：一门"零成本抽象"的系统语言，如何在贴近硬件的同时提供高级抽象。*
