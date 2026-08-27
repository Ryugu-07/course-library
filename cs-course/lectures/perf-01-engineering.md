# 性能 I · 测量、Roofline 与向量化

> **对标**：MIT 6.172（性能工程）/ Agner Fog 优化手册 ｜ **前置**：csapp-01/02（机器表示、缓存）
> 性能工程是把"能跑"变成"跑得快"的学问，也是你（数学 + 系统底子）最能出成果的方向之一。它的第一原则反直觉却至关重要：**先测量，别猜**。这一页建立性能的科学方法——怎么找瓶颈、Roofline 模型怎么告诉你"该优化什么"、以及现代 CPU 的两大加速武器（流水线与 SIMD 向量化）怎么用。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：应该把优化预算花在算术还是搬数据？</h2>
<div class="learning-puzzle">
<h3>具体谜题：一个点积到底能跑多快？</h3>
<p>某 CPU 的峰值算力是 <span class="arithmatex">\(64\ \mathrm{GFLOP/s}\)</span>，可持续内存带宽是 <span class="arithmatex">\(16\ \mathrm{GB/s}\)</span>。一个点积每个元素做 2 次浮点运算并读写 12 bytes。若循环的算术强度只有 <span class="arithmatex">\(2/12\ \mathrm{FLOP/Byte}\)</span>，把乘加指令再优化 4 倍会改变屋顶吗？先算出带宽屋顶，再决定要看 SIMD 还是数据布局。</p>
</div>
<div class="learning-prediction">
<h3>先预测，再打开实验</h3>
<p>写下三条可检验的预测：<strong>①</strong> 点积的带宽屋顶为 <span class="arithmatex">\(16\times2/12\approx2.67\ \mathrm{GFLOP/s}\)</span>，因此它先是 memory-bound；<strong>②</strong> 把只占 5% 时间的函数加速到无穷，总程序最多只快 <span class="arithmatex">\(1/0.95\approx1.05\times\)</span>；<strong>③</strong> 当算术强度超过 <span class="arithmatex">\(I^\*=P_{\max}/B=4\ \mathrm{FLOP/Byte}\)</span> 后，Roofline 才换成算力屋顶。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：两个屋顶和一个时间账</h3>
<p>把程序看成“搬数据 + 做计算”的组合：Roofline 给出由硬件带宽与峰值算力共同形成的上界，Amdahl 给出局部优化对端到端时间的上界。性能工程不是寻找最漂亮的内核，而是先找当前点受哪一项约束，再测量优化是否把点推向另一面。</p>
</div>
<div class="learning-formal">
<h3>形式机制与不变量</h3>
<p>设算术强度为 <span class="arithmatex">\(I=W/Q\)</span>（FLOP/Byte），带宽为 <span class="arithmatex">\(B\)</span>，峰值算力为 <span class="arithmatex">\(P_{\max}\)</span>，则可达性能满足：</p>
<p class="arithmatex">\(P\le \min(P_{\max},\,B I),\qquad I^\*=P_{\max}/B.\)</p>
<p>若总时间比例为 <span class="arithmatex">\(p\)</span> 的部分加速 <span class="arithmatex">\(s\)</span> 倍，端到端加速为 <span class="arithmatex">\(S=1/((1-p)+p/s)\)</span>。实验的核心不变量是：同一输入、编译选项、计时窗口和正确性阈值固定，before/after 的差异才可以归因于优化。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul><li>Roofline 是上界模型，不会告诉你分支、同步、NUMA、缓存容量或实现效率；落在屋顶下不等于存在一个简单的优化。</li><li>峰值带宽和峰值 FLOP 若来自宣传规格而非同一 workload 的实测，结论只能是数量级判断。</li><li>把计时器、I/O 或首次分配混入热循环，会把测量对象改成 harness，而不是算法本身；SIMD 也不能修复错误的复杂度。</li></ul>
</div>
<div class="learning-transfer">
<h3>迁移任务：写一张瓶颈诊断卡</h3>
<p>给你的图像卷积、点积或 N 体代码记录 <span class="arithmatex">\(W,Q,p\)</span>、实测带宽/算力和正确性误差，画出优化前后 Roofline 位置。先用 L01 的分块、L07 的 SIMD 和 perf 工具各提出一个假设，再说明哪条硬件计数器会证伪它；不要把“GPU 更快”当作瓶颈诊断。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-perf-01-engineering" markdown="1">
<p><strong>无 JavaScript 时的静态读法：</strong>在 \(B=16\ \mathrm{GB/s}\)、\(P_{\max}=64\ \mathrm{GFLOP/s}\) 时，转折强度是 \(4\ \mathrm{FLOP/Byte}\)。点积 \(I=2/12\) 的 Roofline 上限为 \(2.67\ \mathrm{GFLOP/s}\)，属于带宽受限；若只优化一个占 60% 时间的函数到 5 倍，Amdahl 加速为 \(1/(0.4+0.6/5)=1.92\times\)。交互版先让你预测 bound 与加速，再调整 \(p,s,I\) 查看两条上界和诊断账本。</p>
<table><thead><tr><th>工作负载</th><th>算术强度</th><th>Roofline 上限</th><th>首先检查</th></tr></thead><tbody><tr><td>点积</td><td>0.167</td><td>2.67 GFLOP/s</td><td>连续访问、L01 分块</td></tr><tr><td>高复用矩阵块</td><td>8</td><td>64 GFLOP/s</td><td>L07 SIMD、指令吞吐</td></tr></tbody></table>
</div>
</section>

## 1. 性能工程的第一铁律：测量，不要猜


<figure class="plot" markdown="1">
![Amdahl 定律曲线：不同串行占比下加速比随核数饱和。](assets/img/perf-01-amdahl.svg)
<figcaption><span class="fig-id">图 perf-01.3</span>Amdahl 定律曲线：不同串行占比下加速比随核数饱和。</figcaption>
</figure>

程序员对"哪里慢"的直觉**几乎总是错的**——瓶颈常在意想不到的地方（一个没注意的 O(n²)、一次意外的磁盘 I/O、缓存不命中）。所以铁律是：

> **先剖析（profile）定位真正的热点，只优化那 5% 真正耗时的代码。**

- **Amdahl 定律**：优化占比 $p$ 的部分、加速 $s$ 倍，总加速 $=\frac{1}{(1-p)+p/s}$。**推论**：只占 5% 的代码就算优化到无穷快，总共也只快 5%——**优化非瓶颈是白费力气**。这条定律是"先测量"的数学依据，也是并行加速的上限（par-01 再用）。
- **工具**：`perf`（Linux）、Instruments（Mac）、火焰图（flamegraph）——**看哪个函数占了最多时间、缓存命中率、分支预测失败率**。学会读火焰图是性能工程的入场券。

**方法论**：**建立"测量 → 找瓶颈 → 优化 → 再测量验证"的闭环**，永远用数据说话。每次优化都要有 before/after 的数字，否则你不知道是真快了还是心理作用（甚至变慢了）。

## 2. Roofline 模型：该优化什么


<figure class="plot" markdown="1">
![Roofline 模型：横轴算术强度、纵轴性能，带宽斜顶 + 算力平顶，标内存受限/算力受限区。](assets/img/perf-01-roofline.svg)
<figcaption><span class="fig-id">图 perf-01.2</span>Roofline 模型：横轴算术强度、纵轴性能，带宽斜顶 + 算力平顶，标内存受限/算力受限区。</figcaption>
</figure>

优化前要判断：程序是**算力受限（compute-bound）**还是**内存受限（memory-bound）**？——这决定优化方向。**Roofline 模型**用一张图回答：

- **横轴**：算术强度（arithmetic intensity）= 每字节内存访问做多少次浮点运算（FLOP/Byte）。
- **纵轴**：可达性能（FLOP/s）。
- **屋顶**由两条线构成：斜线 = **内存带宽**限制（低算术强度时，性能被搬数据的速度卡住）、平线 = **峰值算力**限制（高算术强度时，被 CPU 算力卡住）。

**你的程序落在哪决定策略**：

- **内存受限**（在斜线下，多数朴素程序）→ 优化**数据访问**：改善局部性、分块、减少访存（🔗 csapp-02、perf-02）。加更多计算单元没用，得喂饱它们。
- **算力受限**（在平线下）→ 优化**计算**：向量化、用更少指令、更好算法。

**这就是为什么矩阵乘法要分块**（csapp-02 的 L01）：朴素版内存受限（算术强度低），分块提高数据复用 = 提高算术强度 = 把程序从内存屋顶推向算力屋顶。**Roofline 是"先诊断再开药"的性能地图**——HPC 工程师的第一张图。

## 3. 现代 CPU 的两大加速武器


<figure class="diagram" markdown="1">
![SIMD：一条指令同时算 8 个 float（标量 vs 向量）。](assets/img/perf-01-simd.svg)
<figcaption><span class="fig-id">图 perf-01.1</span>SIMD：一条指令同时算 8 个 float（标量 vs 向量）。</figcaption>
</figure>

朴素的"一条指令一条指令顺序执行"远没榨干现代 CPU。两个必须理解的机制：

**① 流水线与乱序执行**：CPU 把每条指令拆成多个阶段（取指/译码/执行/写回）**流水线并行**，还会**乱序执行**（后面无依赖的指令先跑）、**推测执行**（猜分支方向提前跑）。

- **杀手——分支预测失败**：`if` 猜错要清空流水线（十几个周期），**难预测的分支（数据无规律）极伤性能**。著名案例："**排序后的数组遍历比未排序快数倍**"——因为排序让分支变得可预测。优化手段：用**无分支代码**（条件移动、位运算）替代难预测分支。
- **数据依赖**：一条指令等另一条的结果就没法并行——**打破依赖链**（如多个累加器并行求和）能显著提速。

**② SIMD 向量化**：一条指令同时对多个数据做同样运算（Single Instruction Multiple Data）——AVX 一次算 8 个 float、512 位一次 16 个。**理论上直接 8~16× 加速**。三种用法：

- **靠编译器自动向量化**（`-O3`，最省事但脆弱——循环有依赖/别名/复杂控制流就失败）。
- **编译器提示**（`#pragma`、`restrict` 消除别名疑虑让编译器敢向量化）。
- **手写 intrinsics**（`_mm256_add_ps`，最可控但费力）。

**这就是 [实验 L07]**：点积的标量版 / 编译器自动向量化版 / 手写 SIMD 版三者对比，实测加速比——**亲手看到"一条指令算 8 个数"的威力，也看到编译器什么时候会/不会帮你向量化**。

## 4. 数据导向设计（DOD）：布局即性能

现代性能优化的一大范式转变——**从"面向对象"到"面向数据"**：

- **AoS（结构体数组）** `struct{x,y,z} points[N]` vs **SoA（数组的结构体）** `struct{x[N],y[N],z[N]}`：若只处理 `x`，SoA 让 `x` 连续 → 缓存友好 + 可向量化（🔗 csapp-02、db-01 列存同理）。
- **"设计数据布局以匹配访问模式和硬件"**——游戏引擎、数据库、ML 框架的共同心法。**性能常常不在算法在布局**。

## 5. 练习与要点

**例 1（Amdahl 算账）** 一个程序 60% 时间在函数 A、40% 在 B。把 A 加速 5×，总加速多少？（$\frac{1}{0.4+0.6/5}\approx 1.9×$）——**理解"为什么优化前必须先知道占比"**。

**例 2（分支预测实验）** 遍历数组累加"大于阈值"的元素，对比数组排序前后的耗时——**排序后快数倍，亲眼见分支预测的代价**。这是最震撼的性能 demo 之一。

**例 3（Roofline 定位）** 判断"向量点积"和"N 体引力模拟"各是内存受限还是算力受限（点积算术强度低=内存受限、N 体每对都算=算力受限）——**据此决定优化方向**，Roofline 思维上手。$\blacksquare$

> **▶ 实验 L07（SIMD 与向量化）**：`labs/L07-simd/` —— 点积三版本（标量/自动向量化/intrinsics）+ 分支预测 demo。跑在 Mac（C）。

---

*下一页：性能 II——缓存优化实战：把 csapp-02 的缓存理论变成具体的优化手法和一个"优化 100×"的大挑战。*
