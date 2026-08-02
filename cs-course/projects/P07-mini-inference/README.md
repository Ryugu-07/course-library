# P07 迷你推理引擎：KV cache、连续批处理与量化

这是一个 6–8 周、2–3 人组队的 MLSys 收官项目。学生不训练大模型，而是用一个小型、可复现
的自回归模型/权重 schema，逐步实现单请求生成、KV cache、token 级连续批处理、分页 KV
管理和 int8/int4 量化。脚手架默认只依赖 Python 标准库；NumPy、GPU 和 Win 4060 Ti 都是
可选扩展，不会让基础 CI 失效。

## 先修

- `mlsys-01/02`：Transformer、prefill/decode、KV cache、吞吐/延迟；
- `gpu-01/02`：内存层级、kernel/算子和数值精度基本概念；
- Python 3.10+、类型标注、队列/资源生命周期、JSON schema；
- 了解 greedy decode、TTFT、TPOT、throughput、峰值内存的定义。不会 GPU 编程也可完成基础线。

## 目标

1. 让单请求 greedy decode 与给定参考 token 序列一致；
2. 用 KV cache 避免重复计算历史 K/V，并记录 cache 命中/分配/释放；
3. 在 token 级连续批处理中及时接入/移除请求，避免短请求长期饿死；
4. 用固定 page 管理变长上下文，处理碎片、回收、取消和请求隔离；
5. 实现 int8 或 int4 权重量化路径，报告误差、内存和速度的取舍。

## 周期与组队

建议 6–8 周，2–3 人一组，每周交一个可回放的请求时间线。个人项目仍需提交资源生命周期
图、性能表和失败案例；不得把“模型能输出文本”作为唯一验收。

## 目录

| 路径 | 内容 |
|---|---|
| `starter/schema.py` | 模型、请求、事件、量化和场景 JSON schema |
| `starter/kv_cache.py` | page/handle 与 KV cache manager 接口；分配/回收核心留 TODO |
| `starter/scheduler.py` | continuous batching 调度器接口与决策 schema |
| `starter/quantization.py` | 量化 tensor schema、配置校验和算法接口 |
| `starter/engine.py` | submit/stream/cancel 的推理服务接口 |
| `starter/numpy_backend.py` | NumPy 可选 backend；默认导入不需要 NumPy |
| `starter/driver.py` | 读取 tiny-model fixture、打印场景 manifest |
| `fixtures/tiny_model.json` | 模型/调度/page/量化/请求的机器可读场景 |
| `tests/test_scaffold.py` | 当前应通过的 schema、签名和无 NumPy 导入测试 |
| `acceptance/` | 学生实现后开启的生成/缓存/调度/量化验收 |
| `DESIGN.md` / `rubric.md` | 设计报告模板与评分细则 |

## 里程碑

1. **M1 · Schema 与参考生成（第 1 周）**：解析 fixture，固定 token/request/model schema，
   用最小参考模型完成单请求 greedy decode 的接口和 golden 序列。
2. **M2 · KV cache（第 2–3 周）**：实现 prefill/decode 分界、K/V append/read、cache 命中
   计数和取消回收；输出必须与不使用 cache 的参考一致。
3. **M3 · 连续批处理（第 4 周）**：实现 token 级 step，完成请求接入/完成/取消、batch
   budget 和公平性；记录 TTFT、TPOT 和每 step 的活跃请求。
4. **M4 · Paged KV（第 5 周）**：固定 page 分配、引用/释放、变长上下文、碎片和隔离；
   长短请求混合不得串 token 或泄漏 page。
5. **M5 · 量化（第 6 周）**：实现 int8 或 int4（scale/zero-point/group size 由设计固定），
   通过误差阈值并测量内存下降；不要把量化配置当作只改 dtype 的声明。
6. **M6 · 端到端与报告（第 7–8 周）**：多请求 benchmark、故障注入、CPU baseline 与可选
   NumPy/GPU 对照，提交完整时间线和精度/吞吐/内存取舍。

## 学生任务边界

教师提供 tiny model 的 schema、可复现权重/随机种子、tokenizer 简化版、单请求参考输出、
请求流生成器、公开时间线和指标定义。学生实现 cache 数据结构、调度策略、量化算法、服务
生命周期和必要的测试；不要求训练模型、不要求实现完整 Transformer kernel、不要求重写
GPU runtime。

不得复制 vLLM/TensorRT-LLM 的完整 scheduler/page allocator 或通过硬编码 fixture token
序列蒙混；不得在未声明的 GPU 上把失败请求丢弃。可以使用 NumPy 做数组 backend，必须有
标准库/CPU fallback 或明确标记为扩展路径。

## 给定接口契约

```python
class KVCacheManager:
    def allocate(self, request_id: str, token_count: int) -> KVHandle: ...
    def append(self, handle: KVHandle, key: Sequence[float], value: Sequence[float]) -> None: ...
    def read(self, handle: KVHandle, position: int) -> tuple[Sequence[float], Sequence[float]]: ...
    def release(self, handle: KVHandle) -> None: ...

class ContinuousBatchScheduler:
    def submit(self, request: Request) -> None: ...
    def cancel(self, request_id: str) -> None: ...
    def step(self, budget_tokens: int) -> ScheduleDecision: ...

class InferenceEngine:
    def submit(self, prompt_tokens: Sequence[int], max_tokens: int,
               *, request_id: str | None = None) -> str: ...
    def stream(self, request_id: str) -> Iterator[TokenEvent]: ...
    def cancel(self, request_id: str) -> None: ...
```

公开不变量：请求 token 只能来自自己的 prompt/cache；page 的引用、使用者和释放可观测；
取消后不能再产生 token；scheduler 必须在有限步内服务等待请求；量化 metadata 足以解释
反量化尺度；prefill/decode 的参考输出在允许的误差/采样约定内一致。

## 运行与验收命令

在本项目目录执行：

```bash
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests -v
python3 -m py_compile starter/*.py scripts/verify_scaffold.py tests/test_scaffold.py acceptance/test_student_acceptance.py
python3 starter/driver.py --fixture fixtures/tiny_model.json
RUN_STUDENT_ACCEPTANCE=1 python3 -m unittest discover -s acceptance -v
```

前四条不安装 NumPy、不访问 GPU，且 TODO starter 应通过。最后一条是学生实现后的验收，
当前会因 engine/cache/scheduler 尚未实现而失败；不要把它作为默认 CI 必过任务。

## 故障、边界与性能测试

公开测试：空 prompt、单 token、max_tokens=0、重复 request id、超 vocab token、超过最大
上下文、page 恰好填满/跨页、取消后再 step、释放后访问、batch budget 为 0、短长请求混合、
量化常量/全零/极值和不支持的 bits/group size。隐藏测试注入随机请求到达、长尾请求、异常
释放、内存预算不足、不同 page size 和多种 seed。

正确性至少比对 golden token、request ID、page 访问归属和取消事件；不要只看最终字符串。
性能记录 TTFT、TPOT、tokens/s、batch utilization、KV 峰值 bytes、page 内部碎片、量化
误差。固定请求流、模型 seed、预热和重复；分别比较无 cache、连续 batch、paged KV、量化的
增量收益。

## Rubric（40/25/15/10/10）

| 项目 | 权重 | 评分要点 |
|---|---:|---|
| 功能正确性 | 40% | 单请求、KV cache、连续批处理、paged KV、量化接口/输出契约 |
| 故障与边界 | 25% | 取消、OOM/预算、page 回收、长短混合、错误输入、量化极值 |
| 性能/资源 | 15% | TTFT/TPOT/吞吐、batch 利用率、KV bytes、碎片、量化收益/误差 |
| 结构与文档 | 10% | schema、生命周期、backend 分层、可观测事件、默认 CPU 可复现 |
| 报告与反思 | 10% | 设计取舍、失败案例、指标/时间线、精度—内存—速度权衡 |

详见 [`rubric.md`](rubric.md)。

## 交付物

- 可运行的 CPU/标准库基础路径和（可选）NumPy/GPU 扩展；
- `README.md`、`DESIGN.md`、请求时间线、golden/故障测试和性能表；
- 2–6 页报告，包含 KV page 图、scheduler 决策、量化公式/误差和资源数据；
- 明确模型版本、随机种子、设备、dtype、page size、batch budget 和已知限制。

## 学术诚信

可以阅读 vLLM、TensorRT-LLM、FlashAttention 论文和官方文档，必须注明参考内容与改动。
不得复制完整生产调度器、伪造 token/吞吐/显存结果、硬编码 golden 输出、绕过 request
隔离或把自动生成代码当作无需解释的答案。模型权重来源和许可证也要记录。

## 平台条件

基础线：Python 3.10+ 标准库、CPU、固定小 fixture；NumPy 仅在运行 `numpy_backend.py`
时可选。GPU 路径不是默认 CI 依赖。

### Win 4060 Ti 扩展测试

Win 4060 Ti（建议 16GB）是教师标记的扩展平台：可运行 NumPy/CuPy/PyTorch backend、测量
fp16/int8/int4、paged KV 显存峰值和 CUDA kernel。扩展结果必须与 CPU oracle 比对，记录
驱动/CUDA/Python/框架版本、显存预算和是否发生 OOM；扩展失败不扣基础脚手架分，但不能把
GPU-only 结果冒充跨平台结果。建议用 `P07_WIN_4060TI=1` 单独开启扩展验收 job。

## 可选挑战

- prefix cache 或 speculative decoding，并画请求级时间线；
- copy-on-write page、paged attention 的碎片/吞吐对照；
- 更公平的 aging/priority scheduler，并用 adversarial 长请求测试；
- 4-bit group-wise 量化、误差校准或混合精度；
- 在 Win 4060 Ti 上做 CUDA/torch compile kernel，对比 CPU/NumPy fallback。

## 讲义映射

- 主线：[`mlsys-02-inference.md`](../../lectures/mlsys-02-inference.md)；
- Transformer/训练接口：`mlsys-01-training.md`；
- attention kernel：`gpu-02-optimization.md` 与 [`labs/L09-attention`](../../labs/L09-attention/README.md)；
- 内存分页呼应：`csapp-04-vm-malloc.md`；
- 性能方法：`perf-01/02`。
