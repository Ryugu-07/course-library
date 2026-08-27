# 高级算法 I · 流算法与草图

> **对标**：MIT 6.854 / CMU 15-859 / Amazon–Cormode 综述 ｜ **前置**：algo-03（随机化）、数学站概率线（矩、集中）、信息论线
> 现代数据的现实：**数据流过一次就没了，且大到存不下**（网络包、日志、点击流）。流算法的约束是苛刻的——**一遍扫描、亚线性空间（远小于 $n$）**——却仍能给出可证明精度的近似。这条线是"用随机性和信息论换空间"的极致，也是 Medusa 这类持续摄入数据系统的底层直觉。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：一张小表，为什么敢回答没存过的键？</h2>
<div class="learning-puzzle">
<h3>具体谜题：重击手会被谁“借名”？</h3>
<p>流是 <code>a,b,a,c,d,b,a,e,c,b,f,a,d,c,b,a</code>，精确频率为 <span class="arithmatex">\(f_a=5,f_b=4,f_c=3,f_d=2,f_e=f_f=1\)</span>。如果只有 3 行、4 列的 Count-Min Sketch，查询 <code>b</code> 时某些行会混入别的键。取最小值是否可能低估？两台机器各处理半段后逐格相加，是否等于合并后重放？</p>
</div>
<div class="learning-prediction">
<h3>先预测单边误差</h3>
<p>先写下：<strong>①</strong> 每个计数格只加不减，所以估计值不低于真实频率；<strong>②</strong> 取多行最小值是在寻找碰撞较少的证据，不是平均所有噪声；<strong>③</strong> 固定哈希函数时，分片草图逐格相加与整流一次扫描应相同。实验会让你先选出最可能被高估的键，再打开矩阵。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：频率向量的压缩投影</h3>
<p>把海量键的频率向量 <span class="arithmatex">\(f\in\mathbb R^n\)</span> 投影到一个小矩阵。更新只触碰每行一个格子；查询一个键时读取它在各行的格子并取最小。Sketch 不记住“这个格子属于谁”，它只依赖碰撞噪声的方向性和可重复的哈希。</p>
</div>
<div class="learning-formal">
<h3>形式机制：上界与空间账</h3>
<p>更新规则是 <span class="arithmatex">\(C[i,h_i(x)]\leftarrow C[i,h_i(x)]+1\)</span>，查询是 <span class="arithmatex">\(\hat f_x=\min_i C[i,h_i(x)]\)</span>。因此 <span class="arithmatex">\(\hat f_x\ge f_x\)</span>；在均匀独立碰撞假设下，宽度取 <span class="arithmatex">\(w=\lceil e/\epsilon\rceil\)</span>、深度取 <span class="arithmatex">\(d=\lceil\ln(1/\delta)\rceil\)</span>，以概率至少 <span class="arithmatex">\(1-\delta\)</span> 有误差不超过 <span class="arithmatex">\(\epsilon m\)</span>。线性更新还给出可合并不变量：<span class="arithmatex">\(\mathrm{sketch}(A\mathbin\Vert B)=\mathrm{sketch}(A)+\mathrm{sketch}(B)\)</span>。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul>
<li>窄表或哈希相关会让碰撞偏大；“高概率”针对哈希/随机设定，不是对所有恶意输入无条件保证。</li>
<li>Count-Min 的单边保证依赖非负更新；有删除时要改用带符号的草图或其他频率结构。</li>
<li>一次查询的误差界不自动覆盖百万次查询；要用 union bound 调整 <span class="arithmatex">\(\delta\)</span>，或明确服务的查询预算。</li>
</ul>
</div>
<div class="learning-transfer">
<h3>迁移题：先决定可接受的误差方向</h3>
<p>为日志热度、去重计数和滑动窗口分别选择 Count-Min、HLL 或指数直方图。对每个选择写出：允许高估还是低估、更新是否可合并、窗口过期是否破坏线性不变量，以及在 <span class="arithmatex">\(10^9\)</span> 条事件下为什么不把全量键表当作默认方案。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-adv-01-streaming" markdown="1">
<p><strong>无 JavaScript 时的静态版本：</strong>16 个事件的精确计数为 <code>a:5,b:4,c:3,d:2,e:1,f:1</code>。用宽度 4、深度 3 的表时，每行查询 <code>b</code> 都读一个格子，最终取三者最小；碰撞只会把 4 推高，不会推低。把前 8 个和后 8 个事件分别建表再逐格相加，所有格子应与整流建表完全一致。页面脚本会显示矩阵、查询值和合并检查。</p>
</div>
</section>

## 1. 模型与不可能性

**数据流模型**：元素 $a_1,a_2,\dots,a_m$ 依次到达（可能是 $[n]$ 上的更新），算法只有 $O(\text{polylog})$ 空间、每元素 $O(1)$~$O(\text{polylog})$ 处理时间，**不能回看**。目标：估计流的某个统计量。

**先立不可能性**（信息论下界，🔗 信息论线）：精确求"出现次数最多的元素"（众数）在一遍 + 亚线性空间下**不可能**——用通信复杂度归约（Index 问题）可证。**所以流算法的一切成就都是"近似 + 高概率"**，这不是偷懒，是被信息论逼出来的最优。

## 2. 三个基石草图

**① 计数不同元素（$F_0$，distinct count）——HyperLogLog**
问题：流里有多少个不同值？精确要 $O(n)$ 空间。**思想**：随机哈希每个元素到 $[0,1]$，**最小值的期望 $\approx 1/(d+1)$**（$d$ = 不同元素数）——由最小哈希值反推 $d$。方差大 ⇒ 用多个哈希 / 分桶取调和平均（HyperLogLog 的精髓）：**用 1.5 KB 估计上亿基数、误差约 2%**。Redis 的 `PFCOUNT`、数据库的 `APPROX_COUNT_DISTINCT` 都是它。

<figure class="plot" markdown="1">
![HyperLogLog 最小哈希值估计基数直觉](assets/img/adv-01-hll-minhash.svg)
<figcaption><span class="fig-id">图 adv-01.1</span>MinHash / HLL 直觉——不同元素越多，最小哈希值越容易靠近 0，可反推基数规模。</figcaption>
</figure>

**② 频率估计（重击手）——Count-Min Sketch【推导级】**
问题：估计任意元素的出现频率 $f_x$。**结构**：$d$ 个哈希函数 × $w$ 列的计数矩阵。更新 $x$：每行 $h_i(x)$ 处 +1。查询：取 $d$ 行对应计数的**最小值** $\hat f_x = \min_i C[i, h_i(x)]$。
**分析**：$\hat f_x \ge f_x$（只会因碰撞高估）。单行期望超出 $E[\hat f_x - f_x]\le m/w$（其他元素均匀撒进 $w$ 列）；由 Markov，单行超出 $\epsilon m$ 的概率 $\le 1/(\epsilon w)$；$d$ 行取最小 ⇒ 全超出的概率 $\le (1/(\epsilon w))^d$。取 $w=e/\epsilon, d=\ln(1/\delta)$：**以 $1-\delta$ 概率误差 $\le\epsilon m$，空间 $O(\frac1\epsilon\log\frac1\delta)$**。$\blacksquare$ 这就是"用固定小表估计海量键频率"的工业标准（Medusa 若要在线统计实体热度而不建全表，正是它）。

<figure class="diagram" markdown="1">
![Count-Min Sketch 多行哈希计数矩阵](assets/img/adv-01-count-min.svg)
<figcaption><span class="fig-id">图 adv-01.2</span>Count-Min Sketch——元素经多行哈希更新计数，查询时取多行最小值以压低碰撞噪声。</figcaption>
</figure>

**③ 频率矩（$F_2$）——AMS 草图**
$F_2 = \sum_x f_x^2$（衡量分布集中度、与 self-join 大小、方差相关）。**思想**：给每个元素随机 $\pm1$ 符号 $s(x)$，维护 $Z=\sum_i s(a_i)$。则 $E[Z^2] = F_2$（交叉项因符号独立期望为零）——**一个随机投影就无偏估计了平方和**。多份取平均降方差。这是 **Johnson–Lindenstrauss** 降维在流上的化身：随机投影保持 $\ell_2$ 范数。

## 3. 统一视角：草图 = 线性投影 + 集中

三个草图的共同骨架：**把高维频率向量 $f\in\mathbb R^n$ 用一个随机线性映射 $\Pi$ 压成低维 $\Pi f$，在低维回答关于 $f$ 的问题**。线性带来一个珍贵性质——**可合并（mergeable）**：两个流的草图直接相加就是合并流的草图。这使草图天然适配分布式：各机器各自 sketch、汇总时相加（🔗 dist 线的聚合、MapReduce 的 combiner）。

**读法**：流算法 = 随机投影（线代）+ 集中不等式（概率）+ 通信下界（信息论）三门数学的合流。你三门都有，这条线读起来会很顺。

## 4. 采样与滑动窗口

- **蓄水池采样（reservoir）**：从未知长度的流里等概率抽 $k$ 个样本——第 $i$ 个元素以 $k/i$ 概率替换已选。**一行归纳证明每个元素最终留存概率 $=k/m$**，经典漂亮。
- **滑动窗口**：只统计最近 $W$ 个元素（旧的要过期）——指数直方图（Datar–Gionis–Indyk）在 $O(\frac1\epsilon\log^2 W)$ 空间内近似窗口内计数。实时监控、限流器的理论底座。

<figure class="diagram" markdown="1">
![蓄水池采样以 k/i 概率替换样本](assets/img/adv-01-reservoir.svg)
<figcaption><span class="fig-id">图 adv-01.3</span>蓄水池采样——未知长度数据流中，第 i 个元素以 k/i 概率进入样本池并随机替换。</figcaption>
</figure>

## 5. 练习与要点

**例 1（HLL 直觉）** 若你哈希 $d$ 个不同元素到 $[0,1]$，最小值期望 $\frac{1}{d+1}$——反过来观测到最小值 $0.001$ 时估计 $d\approx 1000$。手算这个反推，再想"为什么要分桶取调和平均"（答：单个最小值方差极大，等价于只用一个样本估计指数分布的率）。

**例 2（Count-Min 只高估）** 证明 Count-Min 永不低估：每次碰撞只增不减，取最小是为了"选碰撞最少的那行"——**误差单边性让它特别适合"找重击手"（只怕漏不怕多算）**。

**例 3（可合并性）** 两台 Win/Mac 各处理一半日志、各建 Count-Min，主机把两个矩阵**逐格相加**得到全局草图——验证这等于在合并流上直接建的草图。**这就是分布式聚合为什么偏爱线性草图**。$\blacksquare$

---

*下一页：高级算法 II——谱图论（把图交给特征值）与在线算法（不知未来如何决策）。*
