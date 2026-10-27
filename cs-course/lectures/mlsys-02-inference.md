# MLSys II · 推理系统与算子优化

> **对标**：vLLM / TensorRT-LLM 文档 / MLSys 推理论文 ｜ **前置**：mlsys-01、gpu-02（attention kernel）、comfy-course（你用的生成栈）
> 模型训好只是一半——**推理系统**负责让它高效服务：低延迟、高吞吐、省显存、稳定。这是你每天用 Claude/DeepSeek/本地 ComfyUI 时背后运转的引擎（Medusa 的 DeepSeek 调用、comfy 课的扩散推理都在此）。这一页讲 LLM 推理的独特挑战（自回归 + KV cache）、让它快起来的系统技术（连续批处理、PagedAttention）、以及压缩模型的量化与蒸馏。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：同一块 GPU，为什么吞吐上升却让短请求更慢？</h2>
<div class="learning-puzzle">
<h3>具体谜题：长请求挡在门口</h3>
<p>固定 toy 服务每 tick 能处理 24 个 prefill token，并同时推进 3 个 decode slot。R01 在 \(t=0\) 到达，prompt=18、output=12；R02 在 0.1 到达，prompt=6、output=2。若策略是来一个做完一个，R02 何时看到首 token？若静态 batch 等 R01，continuous batching 如何改变短请求的等待？</p>
</div>
<div class="learning-prediction">
<h3>先预测四个指标</h3>
<p>预测：<strong>①</strong> TTFT 包含排队和 prefill，不能用 TPOT 代替；<strong>②</strong> static batch 的 head-of-line 约束会让短请求等长请求，continuous batching 能在迭代边界重新填 decode slot；<strong>③</strong> 到达更密集可能增加排队；若长请求都没在窗口内完成，完成样本的 p95 反而可能下降，不能据此说服务变好；<strong>④</strong> KV-cache 预算按 active token 增长，batch size 不是并发上限的同义词。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：prefill、decode、KV 三本账</h3>
<p>Prefill 一次处理输入，决定首 token；decode 自回归逐 token 处理，每个 active sequence 都消耗服务机会和 KV-cache。scheduler 只改变工作何时进入这两阶段，不会删除 prompt/output token。比较策略时固定请求 trace、容量、观察窗和 SLO。</p>
</div>
<div class="learning-formal">
<h3>形式机制与不变量</h3>
<p>对请求 \(i\)，令到达、prefill 开始、首 token、完成分别为 \(a_i,s_i,f_i,c_i\)，输出 token 数为 \(n_i\)：\(\mathrm{TTFT}_i=f_i-a_i\)，\(\mathrm{TPOT}_i=(c_i-f_i)/(n_i-1)\)（要求 \(n_i>1\)），\(\mathrm{E2E}_i=c_i-a_i\)。只有一个输出 token 时没有相邻输出间隔，TPOT 不适用。若每 token KV 占 \(k\) bytes，则峰值 KV 为 \(k\cdot\max_t(\text{active prompt+output tokens at }t)\)。本实验从 0 计时，到最后一个请求到达后 1.4 s 截止；goodput = 窗内完成且 E2E 达标的请求数 / 观察时长，合格完成占比的分母则是窗内全部到达请求。改变到达倍率会改变 trace 与终点，比较策略时保持倍率相同。稳定系统的长期平均还满足 Little 定律 \(L=\lambda W\)，但有限 trace 或过载队列不能机械套用。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul><li>真实 batch 可能摊薄 kernel 开销，也可能因长度混合、prefill/decode 争用而伤害 TTFT；本 toy 不附送厂商吞吐红利。</li><li>完成样本的 p99 不能代表窗口内未完成请求；观察窗、删失标记和 SLO 分母必须写清楚。</li><li>PagedAttention 解决 KV 的碎片与分配问题，不会自动解决调度公平、取消、网络或模型质量。</li></ul>
</div>
<div class="learning-transfer">
<h3>迁移任务：从 toy ledger 到服务 SLO</h3>
<p>为一个短请求占 80%、长请求占 20% 的摘要服务设计 admission、batch/wait、最大 active sequence 和 KV reserve。先用 \(L=\lambda W\) 做数量级检查，再列出至少三项必须由真实压测测量的变量，并与 L09 的 attention kernel 和 L01 的缓存/分块联系起来。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-mlsys-02-inference" markdown="1">
<p><strong>无 JavaScript 时的静态读法：</strong>默认 prefill 容量 24 token/tick、decode 3 slot。R01 的 18-token prompt 可在一个 prefill tick 完成，R02 的 6-token prompt 还要遵守策略的排队规则；static batch 会等整批的最长 decode，continuous batching 在每个 tick 重新选择 ready sequence。若 \(k=0.25\) MB/token，按最大输出长度为 R01 预留 KV 预算需 \((18+12)\times0.25=7.5\) MB；这不是说它始终实际占用 7.5 MB。交互版的 KV 峰值按进入 prefill/decode 的 toy token 计数。交互版先让你预测，再比较 immediate/static/continuous 的 TTFT、TPOT、E2E、完成样本 p95、goodput、backlog 和 KV 峰值。</p>
<p><strong>观察窗算例：</strong>将到达倍率设为 2、最大 batch 设为 2、E2E SLO 设为 4 s，8 个请求均已到达，观察终点为 \(2.10/2+1.40=2.45\) s。immediate 在窗内完成 4 个，4 个尚未完成，因此 goodput 为 \(4/2.45\approx1.63\) req/s、合格完成占比为 4/8；continuous 在窗内完成 8 个且全部达标，为 \(8/2.45\approx3.27\) req/s、8/8。immediate 的其余请求后来也会完成，但不能计入这个窗口的分子。完整事件表仍显示窗后的执行，用于解释等待；未完成行的 E2E 只显示截至窗末的下界。</p>
<table><thead><tr><th>请求</th><th>到达</th><th>prompt</th><th>output</th><th>角色</th></tr></thead><tbody><tr><td>R01</td><td>0.00</td><td>18</td><td>12</td><td>长</td></tr><tr><td>R02</td><td>0.10</td><td>6</td><td>2</td><td>短</td></tr><tr><td>R03</td><td>0.22</td><td>5</td><td>3</td><td>短</td></tr><tr><td>R04</td><td>0.38</td><td>7</td><td>2</td><td>短</td></tr></tbody></table>
</div>
</section>

## 1. LLM 推理为什么特殊：自回归与两个阶段


<figure class="diagram" markdown="1">
![Prefill(并行,算力受限) vs Decode(逐token,内存受限) 两阶段。](assets/img/mlsys-02-prefill-decode.svg)
<figcaption><span class="fig-id">图 mlsys-02.3</span>Prefill(并行,算力受限) vs Decode(逐token,内存受限) 两阶段。</figcaption>
</figure>

LLM 生成是**自回归**的——一个 token 一个 token 地出，每个新 token 依赖前面所有 token。这带来独特的两阶段结构：

- **Prefill（预填充）**：处理输入 prompt，一次并行算完所有输入 token——**算力受限**（大矩阵乘，GPU 吃饱）。
- **Decode（解码）**：逐个生成输出 token，每步只算一个——**内存受限**（每步要读整个模型权重却只算一个 token，算术强度极低，Roofline 落在带宽屋顶，perf-01）。

**关键洞察**：**decode 阶段 GPU 算力大量闲置**（在等着把权重从显存搬进来），这决定了推理优化的方向——**要么提高每次搬权重服务的请求数（批处理），要么减少要搬的数据（量化）**。

## 2. KV Cache：推理的核心数据结构


<figure class="diagram" markdown="1">
![KV Cache：保留历史 K/V；单步新查询仍需访问已有序列，整段生成并非线性。](assets/img/mlsys-02-kv-cache.svg)
<figcaption><span class="fig-id">图 mlsys-02.1</span>KV Cache：保留历史 K/V；单步新查询仍需访问已有序列，整段生成并非线性。</figcaption>
</figure>
<figure class="diagram" markdown="1">
![PagedAttention 借 OS 分页管理 KV Cache（呼应 csapp-04）+ 连续批处理。](assets/img/mlsys-02-paged-attention.svg)
<figcaption><span class="fig-id">图 mlsys-02.2</span>PagedAttention 借 OS 分页管理 KV Cache（呼应 csapp-04）+ 连续批处理。</figcaption>
</figure>

自回归每生成一个 token 都要对前面所有 token 做 attention（gpu-02）。若每步重算所有历史 token 的 Key/Value，是巨大浪费。**KV Cache**：把已算过的 token 的 K、V **缓存下来**，新 token 只算自己的 + 复用缓存——**在固定每头维数下，新 token 的查询只需与 $N$ 个缓存键逐一作用，约为 $O(N)$；这是单步解码，不是整段生成总成本变线性**。

**代价——KV Cache 吃显存且随序列增长**：长上下文时 KV Cache 能比模型本身还大，成为**显存瓶颈和吞吐瓶颈**。这引出推理系统最重要的两个创新：

- **PagedAttention（vLLM 的核心）**：传统 KV Cache 要连续显存、按最大长度预分配 → 大量浪费（碎片 + 预留）。PagedAttention **借鉴操作系统的虚拟内存分页**（🔗 csapp-04！）——把 KV Cache 切成**页**、按需分配、用页表映射。**显存碎片几乎消失、利用率大增 → 能同时服务多得多的请求**。这是"OS 的分页思想搬到 GPU 显存管理"的漂亮跨界，本站 csapp-04 与本页在此呼应。
- **连续批处理（continuous batching）**：传统静态批处理要等一批请求全部生成完才换下一批（快的请求被慢的拖住，GPU 空转）。连续批处理**在 token 级别动态换入换出请求**——一个请求生成完立刻让新请求补位，减少空闲槽位；实际收益受请求长度、到达率、显存和调度限制，不能保证高并发时没有排队。

## 3. 算子优化：把计算榨干

- **算子融合（kernel fusion）**：把多个小算子（如 LayerNorm 的一串逐元素操作）**融合成一个 kernel**——减少 GPU kernel 启动开销 + 减少中间结果的显存往返（🔗 gpu-02、perf 的减少内存访问）。
- **FlashAttention**（gpu-02 [L09] 的生产版）：不落 $N\times N$ 中间矩阵的 attention——推理和训练都用，长上下文的关键。
- **投机解码（speculative decoding）**：用一个小的"草稿模型"快速生成几个候选 token，大模型**一次并行验证**——把内存受限的 decode 变得更"算力密集"、加速生成而不改变输出分布。**一个用小模型加速大模型的巧妙系统技巧**。

## 4. 模型压缩:量化、蒸馏、剪枝

让模型更小更快（尤其本地部署，你的 4060 Ti / comfy 课直接相关）：

- **量化（quantization）**：把权重从 fp16 降到 int8/int4——**显存减半再减半、decode 阶段搬权重更快**（decode 是内存受限，量化直接加速）。关键是**保持精度**（GPTQ/AWQ 等在量化时补偿误差）。70B 模型即使仅计 4-bit 权重也约需 35 GB，尚未算量化元数据、KV 和工作区，不能据此说它能装进任意消费级显卡——你在本地跑量化模型（GGUF/AWQ）时用的正是它。
- **蒸馏（distillation）**：用大模型（teacher）的输出训练小模型（student）——**小模型学到大模型的行为，体积小几倍**。DeepSeek/Qwen 的小模型多经蒸馏。
- **剪枝（pruning）**：删掉不重要的权重/结构——理论优雅但硬件加速不易（非结构化稀疏 GPU 不友好）。

**方法论**：**推理优化 = 减少要搬的数据（量化/压缩）× 提高硬件利用率（批处理/融合）× 减少冗余计算（KV cache/投机）**——这三类用于理解单机计算；生产服务还要处理队列、网络传输、资源池划分、故障和多租户 SLO。

## 5. 端到端：一次推理请求的旅程（Medusa 视角）

把全页串起来：下面是一个可能的服务架构，用来理解 API 行为；并非宣称知道 DeepSeek 托管服务的全部内部实现：

1. 请求进入调度器，**连续批处理**把它拼进当前 batch。
2. **Prefill** 阶段并行处理你的 prompt，建立 **KV Cache**（PagedAttention 分页管理）。
3. **Decode** 阶段逐 token 生成，每步复用 KV Cache、可能用**投机解码**加速。
4. 模型可能是**量化**版以省显存提吞吐。
5. 流式返回 token（🔗 net-02 的 SSE/流式）。

长 prompt 会增加 prefill 工作，首 token 也受排队影响；decode 的节奏还受其他请求和调度影响。连续批处理改善槽位利用，却不能让超载队列消失。

### 分离 prefill / decode：省下的干扰要付多少传输费？

把两个阶段放进不同工作池，可以分别配置资源并减少长 prompt 对 decode 的干扰；但 prefill 得到的 KV 必须送到 decode。链路是：

**入口队列 → prefill 池 → KV 传输 → decode 队列 → decode 池 → 流式输出。**

用简化模型写出首 token 时间：\(T_{first}=Q_p+T_p+B_{KV}/R+Q_d+T_{d,1}\)。这里 \(Q_p,Q_d\) 为排队时间，\(B_{KV}\) 为本次传输字节数，\(R\) 为实际有效字节率；还未计协议、打包或缓存命中带来的变化。分离是否值得，要比较减少的干扰是否大于新传输和排队成本。

**可复算的反例：**假设 KV 为 1 GB（十进制），有效链路 10 GB/s，则纯传输就需 100 ms。如果分离只省 40 ms 的阶段干扰，即使其他量不变，首 token 也约慢 60 ms。不能只看总 token/s；应在固定观察窗中统计同时满足 TTFT 与 TPOT 目标的请求数，未完成请求仍留在分母。

[vLLM 的分离 prefill 文档](https://docs.vllm.ai/en/latest/features/disagg_prefill/)在本次核查中仍标实验性，并明确此功能本身不提高吞吐。不同系统和连接器可能有不同收益，需固定版本实测。这个算账例子没有部署多卡集群。配合 [AI 第19讲](../../ai-course/site/19-inference-serving.html) 的 DeepInfer 与 llm-d 案例，区分引擎能力和生产服务能力。

## 6. 练习与要点

**例 1（KV Cache 算账）** 一个模型采用标准多头注意力（MHA），32 层、KV 总宽度 4096、fp16，估算 2048 token 上下文的 KV Cache 显存（2 × 32 × 4096 × 2048 × 2 = 1,073,741,824 字节 = 1 GiB，约 1.074 GB/请求；不计分配和管理开销）。GQA/MQA 应使用实际 KV 头数 × 每头维度，不能只看隐藏维——**理解"为什么长上下文 + 高并发那么吃显存"**，PagedAttention 为什么重要。

**例 2（prefill vs decode）** 解释"为什么 API 的首 token 延迟（TTFT）和后续每 token 延迟（TPOT）是两个不同指标、优化手段不同"——**把两阶段结构用到真实性能理解**。

**例 3（该量化吗）** 你要在 4060 Ti 16GB 上跑一个 14B 模型——fp16 装不下（28GB），int4 的裸权重约 7GB；还要为量化元数据、KV、激活和工作区留空间，并检查内核支持，不能只由权重大小判断可跑。判断量化的收益与精度代价。**把压缩技术用到你自己的本地部署决策**。$\blacksquare$

---

### 📋 大 Project P07 · 迷你推理引擎

> **教师版作业说明书，不提供完整解。** P07 是 MLSys 收官项目：不要求训练大模型，而是实现一个小而完整的自回归推理服务，理解 vLLM/TensorRT-LLM 这类系统的核心取舍。
>
> - **学习目标**：把 prefill/decode、KV Cache、连续批处理、PagedAttention、量化这些概念落到一个可测系统里。
> - **教师提供**：Tiny Transformer 权重或随机可复现模型、Tokenizer 简化版、单请求参考推理、请求流生成器、TTFT/TPOT/throughput benchmark、显存/内存统计脚本。
> - **学生任务**：① 实现单请求 greedy decode，输出与参考实现一致；② 加 KV Cache，避免重复计算历史 K/V；③ 实现连续批处理调度器，在 token 级别接入/移除请求；④ 实现分页 KV Cache 管理，支持变长上下文和回收；⑤ 实现 int8 或 int4 权重量化路径，并报告精度/速度/内存取舍。
> - **接口约束**：服务接口至少支持 `submit(prompt, max_tokens)`、流式 token 回调、取消请求；调度器不得让短请求长期饿死；Paged KV 的页分配、引用和释放必须可观测。
> - **验收测试**：单请求输出与参考一致；开启 KV Cache 后 decode 计算量明显下降；并发请求下吞吐提升且 TTFT/TPOT 有记录；长短混合请求无泄漏、无串 token；量化后内存下降并给出误差指标。
> - **评分重点**：单请求正确性 20%，KV Cache 20%，连续批处理 25%，Paged KV 20%，量化与系统报告 15%。
> - **延伸挑战**：加入 speculative decoding 或 prefix cache，并用请求级时间线说明它在哪些负载上有收益。

---

*并行与性能线彻底完成。下一页进入语言线——PL I：λ 演算与类型系统，程序语言的数学根，也是你未来 Lean4 计划的地基。*
