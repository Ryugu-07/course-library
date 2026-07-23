# 计算机讲义库 · 插图与项目清单（课程建设用）

> 本文件是 `~/cs-course`（54 页）的全站插图规划与项目定位清单。图片管线已由 arch 搭好并实机验证通过（示例见 csapp-02.1 占位图）。插图按本清单逐张补齐；大 project 则在讲义内作为课程作业说明书展开，给学生留下分阶段实现空间。

---

## 0. 使用说明

### 管线（已就绪）
- **图片放这里**：`~/cs-course/images/`。构建时 `build_site.py` 自动把整个 `images/` 拷进 `site/assets/img/`，无需手动搬。
- **命名**：`<页面stem>-<英文slug>.svg`（或 `.png`）。例：`algo-01-recursion-tree.svg`、`csapp-04-page-table.svg`。清单里每张图已给定文件名，**照用**。
- **格式**：
  - 结构/流程/架构/状态机 → **SVG**（矢量、清晰、体积小）。
  - 精确函数图/数据对比图 → 用本地 matplotlib/plotly 出 **SVG**（坐标要准，别手绘）。
  - 3D / 渲染类 → **PNG**（≥1200px 宽）。
- **主题**：站点 CSS 给 `figure img` 加了**白底 + 圆角 + 边框**，所以图**统一按浅色/白底设计**即可，暗色模式下也有干净白底，不用做深色版。
- **配色**：主色钢蓝 `#2f6395`（强调）、辅蓝 `#8fb8e0`；正文灰 `#333`；可用少量语义色（红=危险/慢、绿=安全/快、橙=警告）。风格：**干净、教科书式、少装饰、标注清楚**，中文标注优先。

### 插入方式（两选一，推荐 A）
**A. 只生成图片、正文已有/将有 `<figure>` 块**：最省事。清单里标 `✅已插占位` 的，正文已有 `<figure>` 引用 + 占位图，生成真图后**同名覆盖 `images/` 里的文件**即可，正文一字不改。
**B. GPT 自己插入 `<figure>` 块**：对未插入的图，在指定「锚点」段落后粘贴下面模板（**上下各留一空行**）：

```markdown
<figure class="diagram" markdown="1">
![alt 文字](assets/img/<文件名>)
<figcaption><span class="fig-id">图 X.N</span>图注一句话。</figcaption>
</figure>
```
- 函数图/数据图把 `class="diagram"` 换成 `class="plot"`（都白底，语义区分而已）。
- **🔴 铁律**：`<figure>` 块前后必须各留一个空行，否则 markdown 会把它折进段落。（这也是本站 display `$$` 的同一条铁律。）

### 重建
改完跑：`~/ai-course/.venv/bin/python build_site.py`（在 `~/cs-course/` 下），浏览 http://localhost:8085 核对。

### 优先级 / 类型标记
- **★** = 核心图（强烈建议，概念离了图不直观）；**○** = 增强图（锦上添花）。
- `[plot]` 精确函数/数据图（本地 matplotlib）｜ `[diagram]` 示意/流程/架构｜ `[3d]` 3D｜ `[concept]` 概念插画。

---

## 1. 图清单（按课程顺序，共 ~115 张）

### 理论线

**algo-01 分治与图算法**
- ★ `algo-01-recursion-tree.svg` [diagram] — 主定理递归树：每层 $a^k$ 个规模 $n/b^k$ 的节点，三情形（叶子重/等重/根重）用三种配色的树对比。锚点：§1 主定理公式后。
- ★ `algo-01-dfs-bfs.svg` [diagram] — 同一张图上 DFS(栈,深入回溯) vs BFS(队列,按层扩展)，用编号/箭头显示访问顺序差异。锚点：§2。
- ○ `algo-01-mst-cut.svg` [diagram] — MST 切割引理：一个切割 + 跨切割最小边必在 MST 中的交换论证示意。锚点：§4。

**algo-02 网络流与线性规划**
- ★ `algo-02-flow-cut.svg` [diagram] — 流网络：源 s、汇 t、边容量、一个 s-t 割，标出割容量 = 跨割边容量和。锚点：§1 定义段后。
- ★ `algo-02-residual-augment.svg` [diagram] — 残量网络 + 一条增广路（正向剩余/反向边），示意 Ford-Fulkerson 推流。锚点：§1 定理证明后。
- ○ `algo-02-matching-reduction.svg` [diagram] — 二分图匹配归约成流：加源汇、边容量 1。锚点：§3。

**algo-03 随机化、近似与 NP 归约**
- ★ `algo-03-concentration.svg` [plot] — 三条尾概率界（Markov/Chebyshev/Chernoff）对同一分布的上界对比曲线，Chernoff 指数收紧最明显。
- ★ `algo-03-np-reduction-tree.svg` [diagram] — NP 归约链：SAT→3SAT→{团/独立集/顶点覆盖}→哈密顿→TSP→子集和→图着色 的箭头树。锚点：§3。
- ○ `algo-03-vertex-cover-2approx.svg` [diagram] — 顶点覆盖 2-近似：取一条边两端点 + 匹配下界夹逼。锚点：§4/例3。

**adv-01 流算法与草图**
- ★ `adv-01-count-min.svg` [diagram] — Count-Min Sketch：d×w 计数矩阵，一个元素经 d 个哈希 +1，查询取 d 行最小值。锚点：§2 ②。
- ○ `adv-01-hll-minhash.svg` [plot] — HyperLogLog 直觉：d 个均匀随机哈希值的最小值期望 ≈ 1/(d+1)，反推基数。
- ○ `adv-01-reservoir.svg` [diagram] — 蓄水池采样：第 i 个元素以 k/i 概率替换。锚点：§4。

**adv-02 谱图论与在线算法**
- ★ `adv-02-fiedler.svg` [plot] — 路径图/小图的 Fiedler 向量（λ₂ 特征向量）按正负号二分，配特征值谱条。锚点：§1。
- ○ `adv-02-cheeger.svg` [diagram] — Cheeger 不等式：λ₂ 夹住电导 φ 的双向不等式示意。锚点：§1。
- ○ `adv-02-ski-rental.svg` [plot] — ski rental 竞争比：租金累计 vs 买断阈值 B，2-竞争。锚点：§3 样板二。

**toc-01 自动机与可计算性**
- ★ `toc-01-automata-hierarchy.svg` [diagram] — Chomsky 层级同心圆：正则⊂上下文无关⊂递归可枚举，各配机器(DFA/PDA/TM)与不可识别例子。锚点：§1 表后。
- ★ `toc-01-halting-diagonal.svg` [diagram] — 停机问题对角线论证：D(D) 自指取反制造矛盾的示意（对照康托尔对角线）。锚点：§3 证明后。
- ○ `toc-01-dfa-example.svg` [diagram] — 一个 DFA 状态转移图（如"能被3整除的二进制数"）。锚点：§1。

**toc-02 复杂度理论**
- ★ `toc-02-complexity-map.svg` [diagram] — 复杂度类包含图：L⊆NL⊆P⊆NP⊆PSPACE⊆EXP，标注 NPC/coNP/BPP/IP 位置，未知边界用虚线。锚点：§2 层级公式后。
- ○ `toc-02-verify-vs-solve.svg` [concept] — "改卷比考试容易"隐喻 P vs NP（数独：验证易/求解难）。锚点：§5 例1。

**crypto-01 对称、公钥与数论基础**
- ★ `crypto-01-dh-exchange.svg` [diagram] — Diffie-Hellman 密钥交换时序：Alice/Bob 各发 g^a/g^b、各算 g^ab，窃听者算不出。锚点：§3。
- ★ `crypto-01-sym-vs-pub.svg` [diagram] — 对称(同一密钥) vs 公钥(公钥加密/私钥解密) 的钥匙示意对比。锚点：§3 开头。
- ○ `crypto-01-rsa-flow.svg` [diagram] — RSA：密钥生成→加密 c=m^e→解密 m=c^d，安全靠分解难。锚点：§4。

**crypto-02 协议、零知识与后量子**
- ★ `crypto-02-tls-handshake.svg` [diagram] — TLS 握手时序图：协商→ECDHE 换密钥→证书验身→对称加密数据。锚点：§1 TLS 段。
- ★ `crypto-02-pki-chain.svg` [diagram] — PKI 信任链：根 CA→中间 CA→网站证书 的签名链。锚点：§1。
- ○ `crypto-02-zk-cave.svg` [concept] — 零知识"阿里巴巴洞穴"：验证者喊左/右，证明者每次都能出来。锚点：§2。

### 系统线

**csapp-01 机器级表示**
- ★ `csapp-01-twos-complement.svg` [plot] — 补码数轴/圆环：位模式↔有符号值映射，突出 -128 无相反数、溢出回绕。锚点：§1 整数段。
- ★ `csapp-01-struct-layout.svg` [diagram] — 结构体内存布局 + 对齐填充：`{char;int;char}` 12 字节 vs 重排 8 字节。锚点：§2。
- ○ `csapp-01-ieee754.svg` [diagram] — IEEE754 位布局（符号|阶码|尾数）+ 浮点是对数刻度网格。锚点：§1 浮点段。
- ○ `csapp-01-stack-frame.svg` [diagram] — 函数调用栈帧：返回地址、保存寄存器、局部变量。锚点：§3。

**csapp-02 存储层级与缓存**
- ★ `csapp-02-memory-pyramid.svg` [diagram] — ✅**已插占位**（图 csapp-02.1）。存储金字塔，对数刻度延迟，主存比 L1 慢 100 倍断崖。**GPT 覆盖此文件即可。**
- ★ `csapp-02-cache-line.svg` [diagram] — 缓存行(64字节)搬运：读一个 int 拉邻近 16 个，顺序访问 vs 随机跳跃的命中差异。锚点：§2 局部性。
- ○ `csapp-02-matmul-order.svg` [diagram] — 矩阵乘 ijk vs ikj 的内存访问模式（按行连续 vs 按列跨步）+ 分块 tiling。锚点：§4。

**csapp-03 链接与异常控制流**
- ★ `csapp-03-linking.svg` [diagram] — 多个 .o → 符号解析 + 重定位 → 可执行文件的拼装。锚点：§1。
- ★ `csapp-03-ecf-four.svg` [diagram] — 异常控制流四类（中断/陷阱/故障/终止）：触发者、同异步、是否返回。锚点：§3 表。
- ○ `csapp-03-fork-tree.svg` [diagram] — `fork();fork();` 产生 4 进程的进程树。锚点：§5 例2。

**csapp-04 虚拟内存与动态内存**
- ★ `csapp-04-vm-mapping.svg` [diagram] — 虚拟地址空间→页表→物理内存映射，两进程同虚拟地址映到不同物理页（隔离）。锚点：§1。
- ★ `csapp-04-page-table.svg` [diagram] — 多级页表翻译：虚拟地址[页号|偏移]→查表→物理页帧，配 TLB 缓存。锚点：§2。
- ○ `csapp-04-malloc-freelist.svg` [diagram] — 显式空闲链表 + 边界标记 + 合并。锚点：§3。
- ○ `csapp-04-cow.svg` [diagram] — 写时复制：fork 后父子共享只读页，写时才复制。锚点：§2 COW。

**os-01 进程、线程与调度**
- ★ `os-01-process-states.svg` [diagram] — 进程三态机：运行↔就绪↔阻塞 的转换 + 触发事件。锚点：§1。
- ★ `os-01-schedulers.svg` [diagram] — 调度算法对比（FIFO 护航效应 / SJF / RR 时间片 / MLFQ 多级）甘特图。锚点：§3。
- ○ `os-01-context-switch.svg` [diagram] — 上下文切换：时钟中断→存 A 寄存器→载 B→换页表。锚点：§2。

**os-02 并发与同步**
- ★ `os-02-race-interleaving.svg` [diagram] — `counter++` 两线程读-改-写交错导致丢失更新的时序。锚点：§1。
- ★ `os-02-deadlock.svg` [diagram] — 死锁四条件 + 等待环（A 持锁1等锁2 / B 持锁2等锁1）。锚点：§4。
- ○ `os-02-producer-consumer.svg` [diagram] — 生产者-消费者 + 条件变量 wait/signal。锚点：§3。

**os-03 文件系统与崩溃一致性**
- ★ `os-03-fs-layout.svg` [diagram] — 磁盘布局：超级块|inode位图|数据位图|inode表|数据块 + inode 多级间接指针。锚点：§1。
- ★ `os-03-journaling.svg` [diagram] — 崩溃一致性：写日志→提交→应用；崩溃在提交前后的两种恢复。锚点：§3。
- ○ `os-03-path-resolve.svg` [diagram] — 路径解析 /a/b/c 逐级查目录 inode。锚点：§5 例1。

**net-01 分层、TCP/IP 与拥塞控制**
- ★ `net-01-layers-encap.svg` [diagram] — TCP/IP 四层 + 封装：[以太网[IP[TCP[HTTP]]]] 套信封。锚点：§1。
- ★ `net-01-handshake.svg` [diagram] — TCP 三次握手 SYN/SYN-ACK/ACK 时序 + 为什么三次。锚点：§3。
- ★ `net-01-aimd.svg` [plot] — AIMD 拥塞窗口锯齿曲线：慢启动指数→拥塞避免线性增→丢包减半。锚点：§4。

**net-02 HTTP、TLS 与现代网络**
- ★ `net-02-http-evolution.svg` [diagram] — HTTP 0.9→1.1→2→3 演进，每代解决的队头阻塞瓶颈。锚点：§1 表。
- ★ `net-02-request-life.svg` [diagram] — DNS→TCP→TLS→HTTP→CDN→响应→渲染 全链路（与 web-01 呼应，可共用）。锚点：§4 或 web-01。
- ○ `net-02-cdn.svg` [diagram] — CDN 边缘缓存：用户就近取，不回源。锚点：§4。

**db-01 存储与索引**
- ★ `db-01-bplus-tree.svg` [diagram] — B+ 树：矮胖多路、数据全在叶、叶子链表串起支持范围扫描。锚点：§3。
- ★ `db-01-page-slot.svg` [diagram] — 堆文件页 + 槽目录（变长行、删除空洞）。锚点：§1。
- ○ `db-01-row-vs-col.svg` [diagram] — 行存 vs 列存 的物理布局与适用场景。锚点：§1。

**db-02 查询执行与优化**
- ★ `db-02-plan-tree.svg` [diagram] — 一条 SQL → 关系代数 → 算子树（Scan/Filter/Join/Sort）执行计划。锚点：§1/§3。
- ★ `db-02-join-algos.svg` [diagram] — 三种 JOIN（嵌套循环/排序归并/哈希）机制与适用对比。锚点：§2 表。
- ○ `db-02-volcano-vec.svg` [diagram] — 火山模型(逐行) vs 向量化(逐批) 执行。锚点：§3。

**db-03 事务、MVCC 与恢复**
- ★ `db-03-mvcc.svg` [diagram] — MVCC 多版本：更新造新版本、读读快照、旧版本待 VACUUM 回收。锚点：§3。
- ★ `db-03-wal-recovery.svg` [diagram] — WAL：先写日志→提交→崩溃后 redo 已提交/undo 未提交。锚点：§4。
- ○ `db-03-conflict-graph.svg` [diagram] — 冲突图无环⟺可串行化（拓扑排序）。锚点：§2。

**dist-01 时钟与一致性模型**
- ★ `dist-01-lamport.svg` [diagram] — Lamport 逻辑时钟：三节点收发消息 + max+1 规则，因果先后⇒时间戳递增。锚点：§2。
- ★ `dist-01-cap.svg` [diagram] — CAP 定理：网络分区时 C/A 二选一，标 CP(etcd/Postgres) vs AP(Cassandra/DNS)。锚点：§4。
- ○ `dist-01-consistency-spectrum.svg` [diagram] — 一致性光谱：线性→顺序→因果→最终，强度 vs 性能。锚点：§3 表。

**dist-02 共识与 Raft**
- ★ `dist-02-raft-states.svg` [diagram] — Raft 三态机 Follower↔Candidate↔Leader + 任期/心跳/选举超时。锚点：§3 ①。
- ★ `dist-02-raft-log.svg` [diagram] — 日志复制：Leader 追加→多数派确认→提交→应用。锚点：§3 ②。
- ○ `dist-02-quorum.svg` [diagram] — 5 节点多数派交集：任两个多数派必相交（防脑裂）。锚点：§5 例1。

**dist-03 分布式事务与大系统案例**
- ★ `dist-03-2pc.svg` [diagram] — 两阶段提交时序 + 协调者崩溃导致的阻塞。锚点：§1。
- ★ `dist-03-consistent-hash.svg` [diagram] — 一致性哈希环：机器/key 上环，加节点只影响相邻段。锚点：§3。
- ○ `dist-03-mapreduce.svg` [diagram] — MapReduce 数据流：Map→shuffle→Reduce（词频例）。锚点：§4。

**comp-01 词法与语法分析**
- ★ `comp-01-pipeline.svg` [diagram] — 编译流水线：源码→词法→语法→语义→IR→优化→目标码，标前端/后端/IR 枢纽。锚点：§1。
- ★ `comp-01-ast.svg` [diagram] — `1+2*3` 的 AST：`*` 在 `+` 子节点下，树形编码优先级。锚点：§3。
- ○ `comp-01-lexer-dfa.svg` [diagram] — 词法分析器 = 跑 DFA（标识符/数字的状态转移）。锚点：§2。

**comp-02 语义、类型检查与解释器**
- ★ `comp-02-eval-env.svg` [diagram] — 解释器 eval(AST, env)：环境链式作用域 + 闭包捕获环境。锚点：§3。
- ○ `comp-02-scope-stack.svg` [diagram] — 词法作用域栈：进块压入、离块弹出、内层查不到往外找。锚点：§1。
- ○ `comp-02-bytecode-vm.svg` [diagram] — 树遍历→字节码→VM→JIT 的性能阶梯。锚点：§4。

**comp-03 IR、优化与代码生成**
- ★ `comp-03-ssa-cfg.svg` [diagram] — CFG 基本块 + SSA（变量单赋值、汇合处 φ 函数）。锚点：§1。
- ★ `comp-03-reg-alloc.svg` [diagram] — 寄存器分配 = 冲突图 k 着色，装不下则 spill。锚点：§3。
- ○ `comp-03-llvm.svg` [diagram] — LLVM 架构：多前端→LLVM IR→多后端 的 m+n 解耦。锚点：§4。

### 并行与性能线

**perf-01 测量、Roofline 与向量化**
- ★ `perf-01-roofline.svg` [plot] — Roofline 模型：横轴算术强度、纵轴性能，带宽斜顶 + 算力平顶，标内存受限/算力受限区。锚点：§2。
- ★ `perf-01-amdahl.svg` [plot] — Amdahl 定律曲线：不同串行占比下加速比随核数饱和。锚点：§1。
- ○ `perf-01-simd.svg` [diagram] — SIMD：一条指令同时算 8 个 float（标量 vs 向量）。锚点：§3 ②。

**perf-02 缓存优化实战**
- ★ `perf-02-optim-ladder.svg` [diagram] — 优化层级金字塔：算法→数据布局→向量化→多核→GPU→分布式（收益递减、代价递增）。锚点：§4。
- ○ `perf-02-array-vs-list.svg` [diagram] — 数组(连续,预取,少 miss) vs 链表(散落,每节点 miss) 的缓存行为。锚点：§2。

**par-01 并行模型与缓存一致性**
- ★ `par-01-amdahl-gustafson.svg` [plot] — Amdahl(固定问题,悲观) vs Gustafson(问题随核扩,乐观) 对比。锚点：§1。
- ★ `par-01-mesi.svg` [diagram] — MESI 缓存一致性状态机 + 伪共享（两核改同一缓存行乒乓）。锚点：§2。
- ○ `par-01-data-task.svg` [diagram] — 数据并行 vs 任务并行 的分解方式。锚点：§3。

**par-02 同步原语与无锁结构**
- ★ `par-02-cas-loop.svg` [diagram] — CAS loop：读旧值→算新值→CAS 尝试→失败重试 的乐观并发环。锚点：§1。
- ★ `par-02-aba.svg` [diagram] — ABA 问题：A→B→A 骗过 CAS 的时序 + 版本号修复。锚点：§2。
- ○ `par-02-memory-order.svg` [diagram] — acquire/release 配对建立 happens-before 可见性。锚点：§3。

**gpu-01 CUDA 编程模型**
- ★ `gpu-01-cpu-vs-gpu.svg` [diagram] — CPU(少数强核,大控制/缓存) vs GPU(数千弱核,几乎全是算术单元) 芯片示意。锚点：§1。
- ★ `gpu-01-thread-hierarchy.svg` [diagram] — Grid→Block→Warp(32线程锁步)→Thread 层级 + warp 发散。锚点：§2。
- ★ `gpu-01-gpu-memory.svg` [diagram] — GPU 内存层级(寄存器/共享/全局) + 合并访问(相邻线程读相邻地址)。锚点：§3。

**gpu-02 核函数优化阶梯**
- ★ `gpu-02-tiling.svg` [diagram] — 共享内存 tiling：把块搬进共享内存复用，全局访问从 O(1) 提到 O(块边长)。锚点：§2。
- ★ `gpu-02-flash-attention.svg` [diagram] — FlashAttention：分块 + 在线 softmax，不落 N×N 中间矩阵，访存 O(N²)→O(N)。锚点：§4。
- ○ `gpu-02-reduce-ladder.svg` [diagram] — 归约优化阶梯 naive 原子加→共享内存树形→warp shuffle。锚点：§3。

**mlsys-01 训练系统与并行策略**
- ★ `mlsys-01-memory.svg` [diagram] — 训练显存四部分（参数/梯度/优化器状态/激活），16 字节/参数条形图。锚点：§2。
- ★ `mlsys-01-parallelism.svg` [diagram] — 三种并行：数据(切batch) / 张量(切层内) / 流水线(切层) 对比。锚点：§3 表。
- ○ `mlsys-01-autodiff.svg` [diagram] — 反向模式 autodiff：计算图前向存中间值、反向链式累积梯度。锚点：§1。

**mlsys-02 推理系统与算子优化**
- ★ `mlsys-02-prefill-decode.svg` [diagram] — Prefill(并行,算力受限) vs Decode(逐token,内存受限) 两阶段。锚点：§1。
- ★ `mlsys-02-kv-cache.svg` [diagram] — KV Cache：缓存历史 K/V，新 token 只算自己，attention O(N²)→O(N)。锚点：§2。
- ★ `mlsys-02-paged-attention.svg` [diagram] — PagedAttention 借 OS 分页管理 KV Cache（呼应 csapp-04）+ 连续批处理。锚点：§2。

### 语言线

**pl-01 λ 演算与类型系统**
- ★ `pl-01-curry-howard.svg` [diagram] — Curry-Howard 对照桥：命题↔类型、证明↔程序、蕴含↔函数、∧↔积、∨↔和。锚点：§4 表后。
- ○ `pl-01-beta-reduction.svg` [diagram] — β 归约代换步骤：`(λx.λy.x) a b → a`。锚点：§1。
- ○ `pl-01-type-derivation.svg` [diagram] — 类型推导树（分数线规则堆叠成树）。锚点：§2。

**pl-02 语义、函数式与垃圾回收**
- ★ `pl-02-gc.svg` [diagram] — GC 三法：标记-清除 / 复制式 / 分代（新生代频繁回收）+ 可达性根。锚点：§4。
- ○ `pl-02-memory-routes.svg` [diagram] — 三条内存路线：手动(C) / GC(Java/Python) / 所有权(Rust) 对比（贯穿语言线）。锚点：§4 末/可复用到 cpp-01/rust-01。

**py-01 数据模型与惯用法**
- ★ `py-01-name-binding.svg` [diagram] — 名字绑定对象：`a=[1,2]; b=a` 两名字指同一对象（对比 C 的值盒子）。锚点：§1。
- ○ `py-01-dunder.svg` [diagram] — dunder 协议：语法 `len(x)/x[k]/for` ↔ `__len__/__getitem__/__iter__` 的钩子映射。锚点：§2 表。
- ○ `py-01-generator.svg` [diagram] — 生成器惰性：yield 逐条产出，内存恒定 vs list 全载。锚点：§4。

**py-02 运行时、GIL 与性能生态**
- ★ `py-02-gil.svg` [diagram] — GIL：多线程轮流拿锁，CPU 密集只用一核（多进程才并行 / I/O 等待时释放 GIL）。锚点：§2。
- ○ `py-02-cpython.svg` [diagram] — CPython 执行：.py→字节码→解释器循环（慢在解释+装箱+动态）。锚点：§1。
- ○ `py-02-numpy-sink.svg` [diagram] — 下沉热点：Python 胶水层 + numpy/C/CUDA 底座。锚点：§4。

**cpp-01 抽象、RAII 与值/移动语义**
- ★ `cpp-01-raii.svg` [diagram] — RAII：构造获取资源、离作用域析构自动释放（含异常路径），对照 C 手动易漏。锚点：§3。
- ★ `cpp-01-move-vs-copy.svg` [diagram] — 移动(偷内部缓冲, O(1)) vs 拷贝(复制全部, O(n))，通往 Rust 所有权。锚点：§4。
- ○ `cpp-01-value-semantics.svg` [diagram] — 值语义(b 是 a 的拷贝) vs 引用/指针，栈上对象。锚点：§2。

**cpp-02 现代 C++、STL、模板与并发**
- ★ `cpp-02-stl-orthogonal.svg` [diagram] — STL 正交设计：容器—迭代器—算法解耦（m+n 而非 m×n）。锚点：§1。
- ★ `cpp-02-three-languages.svg` [diagram] — Python/C++/Rust 三语言对照雷达/矩阵（内存/速度/安全/并发/适用）。锚点：§5 表。
- ○ `cpp-02-template-mono.svg` [diagram] — 模板单态化：一份代码为每个类型生成专门代码（零成本泛型）。锚点：§2。

### 工程与全栈线

**web-01 请求的一生（Medusa 解剖）**
- ★ `web-01-request-life.svg` [diagram] — **重点图**。Medusa 请求全链路：浏览器→DNS→Cloudflare 边缘→cloudflared 隧道→FastAPI→Postgres→响应→React 渲染，8 步标注。锚点：§2。
- ★ `web-01-online-offline.svg` [diagram] — 在线(用户读)vs离线(schtasks 抓取→聚类→分析→写库) 双路径，读写分离。锚点：§1。
- ○ `web-01-layers.svg` [diagram] — 全栈分层 + Medusa 实体对照（React/Cloudflare/FastAPI/Postgres）。锚点：§1 表。

**web-02 后端工程**
- ★ `web-02-n-plus-1.svg` [diagram] — N+1 查询：列表 1 次 + 循环每项 1 次 = N+1，改 JOIN 预加载 1 次。锚点：§2。
- ★ `web-02-async-loop.svg` [diagram] — 异步事件循环：单线程遇 I/O 挂起去干别的（I/O 密集高效 vs 阻塞线程池）。锚点：§3。
- ○ `web-02-request-flow.svg` [diagram] — 后端骨架：路由→中间件→校验→处理→数据库→响应。锚点：§1。

**web-03 浏览器与前端工程**
- ★ `web-03-render-pipeline.svg` [diagram] — 浏览器渲染管线：HTML→DOM + CSS→CSSOM→渲染树→布局→绘制→合成，标 reflow 昂贵。锚点：§1。
- ★ `web-03-virtual-dom.svg` [diagram] — React 虚拟 DOM diff：state 变→新虚拟树→diff→只改变化的真实 DOM。锚点：§2。
- ○ `web-03-ssg-ssr-spa.svg` [diagram] — SSG(你的博客站)/SSR/SPA(Medusa) 三种渲染模式对比。锚点：§5。

**se-01 Git 内部原理与测试**
- ★ `se-01-git-objects.svg` [diagram] — **重点图**。Git 对象模型：commit→tree→blob 的内容寻址 DAG + 分支只是指针。锚点：§1。
- ★ `se-01-test-pyramid.svg` [diagram] — 测试金字塔：单元(多快)→集成→E2E(少慢脆)。锚点：§3 表。
- ○ `se-01-branch-merge.svg` [diagram] — commit DAG + 分支指针 + 三方合并。锚点：§1/§2。

**se-02 CI/CD 与代码质量**
- ★ `se-02-cicd-pipeline.svg` [diagram] — CI/CD 流水线：push→构建→测试→静态检查→审查→部署(金丝雀→全量)→监控→回滚。锚点：§5。
- ○ `se-02-tech-debt.svg` [concept] — 技术债：短期加速借款、长期付利息的曲线/隐喻。锚点：§4。

**cloud-01 容器与 Docker 原理**
- ★ `cloud-01-container-vs-vm.svg` [diagram] — 容器(共享内核,轻) vs 虚拟机(各带内核,重) 分层对比。锚点：§2 表。
- ★ `cloud-01-namespace-cgroup.svg` [diagram] — 容器 = namespace(隔离可见性) + cgroup(限制配额) + 分层镜像(COW)。锚点：§3。
- ○ `cloud-01-image-layers.svg` [diagram] — 分层镜像 + 联合文件系统 + 写时复制层。锚点：§3 ③。

**cloud-02 编排、K8s 与可观测性**
- ★ `cloud-02-k8s-control-loop.svg` [diagram] — K8s 控制循环：声明期望状态→观察实际→对比→调整（自愈），配 Pod/Deployment/Service/etcd 架构。锚点：§2。
- ★ `cloud-02-observability.svg` [diagram] — 可观测性三支柱：指标/日志/追踪 + 告警（回收 Medusa 静默失败教训）。锚点：§4。

**sec-01 系统与 Web 攻防**（防御视角）
- ★ `sec-01-buffer-overflow.svg` [diagram] — 缓冲区溢出：写越界覆盖栈上返回地址的示意（教学用，讲防御：canary/ASLR/DEP）。锚点：§2。
- ★ `sec-01-xss-vs-csrf.svg` [diagram] — XSS(恶意脚本进你的页面) vs CSRF(你的登录态被别站利用) 机理对比 + 各自防御。锚点：§4。
- ○ `sec-01-injection.svg` [diagram] — SQL 注入：拼接 vs 参数化查询（数据与代码分离）。锚点：§3。

**sec-02 密钥、供应链与安全工程**
- ★ `sec-02-stride.svg` [diagram] — STRIDE 威胁建模 + 数据流信任边界。锚点：§3。
- ★ `sec-02-security-crosscut.svg` [diagram] — 安全是横切每一层（系统/网络/数据/应用/流程）的属性，六板块会师。锚点：§5。
- ○ `sec-02-secrets.svg` [diagram] — 密钥管理：硬编码进 git（永久泄露）vs .env+gitignore+密钥管理器+轮换。锚点：§1。

---

## 2. 参考示例（已插入的占位）

**csapp-02** 的 §1 已插入 `图 csapp-02.1`，正文 markdown 为：
```markdown
<figure class="diagram" markdown="1">
![存储金字塔：从寄存器到磁盘的速度—容量—成本权衡](assets/img/csapp-02-memory-pyramid.svg)
<figcaption><span class="fig-id">图 csapp-02.1</span>存储金字塔——越往上越快越贵越小……</figcaption>
</figure>
```
`images/csapp-02-memory-pyramid.svg` 现为占位图。生成真图后同名覆盖即可，其余按方式 A/B 处理。

---

## 3. Lab / 大 Project 位置（讲义内按课程作业说明书展开）

### ★ 本站已给可运行小实验（12 个，讲义末尾有引用）
labs 目录：`~/cs-course/labs/`（每个实验一个子目录）。清单见 [实验总表](site/labs.html) 或 `lectures/labs.md`。
- L01 缓存分块矩阵乘（C/Mac）· csapp-02 / perf-02 页末
- L02 手写 shell（C/Mac）· csapp-03 页末
- L03 显式空闲链表 malloc（C/Mac）· csapp-04 页末
- L04 tree-walk 解释器（Python/Mac）· comp-01 + comp-02 页末
- L05 B+ 树（Python/Mac）· db-01 页末
- L06 Raft 选主 + 日志复制（Python/Mac）· dist-02 页末
- L07 SIMD 与向量化（C/Mac）· perf-01 页末
- **L08 CUDA reduction+scan（CUDA/Win 4060Ti）· gpu-01/02 页末**
- **L09 玩具 attention kernel（CUDA/Win 4060Ti）· gpu-02 页末**
- L10 无锁栈/队列（C++/Rust/Mac）· par-02 页末
- L11 Rust 所有权谜题集（Rust/Mac）· rust-01 页末
- L12 极简 HTTP 服务器（Python/Mac）· net-02 / web-02 页末

### 📋 第二档大 Project（7 个，讲义页末有分阶段说明书 + 验收 + 对标课）
- **P01 xv6 内核全套**（系统调用/调度/锁/文件系统/mmap）· 作业说明书分三阶段在 **os-01 / os-02 / os-03 页末**
- **P02 从零关系型数据库**（存储引擎/查询执行/事务恢复）· 作业说明书分三阶段在 **db-01 / db-02 / db-03 页末**
- **P03 分片分布式 KV**（Raft + 分片 + 线性一致）· 作业说明书在 **dist-02 / dist-03 页末**
- **P04 编译器后端**（IR/SSA/寄存器分配/代码生成）· 作业说明书在 **comp-03 页末**
- **P05 迷你 TCP**（用户态可靠传输：滑窗/重传/拥塞）· 作业说明书在 **net-01 页末**
- **P06 性能工程优化 100×**（逐层优化基线程序）· 作业说明书在 **perf-02 页末**
- **P07 迷你推理引擎**（KV cache/连续批处理/量化）· 作业说明书在 **mlsys-02 页末**

> 后续课程建设顺序建议：先易后难 L01→L07→L12（Mac 纯逻辑）→ L08/L09（Win CUDA）→ 大 project 先打磨一个完整样板（P02 或 P04 教学价值高、单机可做）。
