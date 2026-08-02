# P06 性能工程终极题：把一个基线程序优化到 100×

这是一个 6–8 周、2–3 人组队的性能工程项目。学生从一个刻意朴素但正确的 C baseline
开始，按照“测量 → 假设 → 一次改动 → 复测”的纪律，逐层尝试算法/数据布局/缓存/SIMD/
多线程/可选 GPU。目标不是承诺每台机器都正好 100×，而是用可审计证据解释收益、退化和
瓶颈迁移。本目录提供 baseline、benchmark harness 和防止删工作的 correctness contract，
不提供任何直接优化答案。

## 先修

- `csapp-01/02`：内存层级、缓存、数据表示；
- `perf-01/02`：测量方法、Roofline、局部性和优化层级；
- C11、编译器优化级别、指针/数组、基本多线程概念；
- 能阅读 benchmark 输出并区分 wall time、吞吐、误差和噪声。

## 目标

1. 建立固定机器/编译器/输入/重复次数的可信 baseline；
2. 用性能计数器或替代指标定位算力、内存、分支、同步和 I/O 瓶颈；
3. 逐次完成至少三层优化，并保存每次 before/after 和失败尝试；
4. 在不改变输出语义的情况下，争取分档加速：20×、50×、100×；
5. 解释为什么某一优化只在某些规模、核心数或编译器上有效。

## 周期与组队

建议 6–8 周，2–3 人一组。每个主要优化点使用一个独立 commit，提交前由另一名成员复核
正确性命令和 benchmark 参数。个人完成时同样保留优化日志。

## 目录

| 路径 | 内容 |
|---|---|
| `starter/benchmark.h` | workload、结果和 baseline/candidate 函数契约 |
| `starter/baseline.c` | 可编译、可运行、故意朴素的标量 5-point stencil oracle |
| `starter/candidate.c` | 学生实现入口；当前是带 TODO 的失败 stub |
| `starter/benchmark.c` | 计时、独立 oracle、全输出比较、checksum、删工作检测 |
| `Makefile` | 本地 C11 build/run 入口 |
| `fixtures/stencil.json` | workload、误差阈值、重复和分档目标 |
| `tests/test_scaffold.py` | 当前应通过的结构、编译和 baseline smoke test |
| `acceptance/` | 开启后要求 candidate 正确并达成契约；当前 stub 预期失败 |
| `scripts/verify_scaffold.py` | Python 标准库检查文件、C 接口和 fixture |
| `DESIGN.md` / `rubric.md` | 报告模板与评分细则 |

## 里程碑

1. **M1 · 基线与契约（第 1 周）**：编译并运行 `--baseline`，理解输入生成、五点 stencil、
   checksum、独立 oracle 和 `work_units`；固定机器信息。
2. **M2 · 测量（第 2 周）**：重复取中位数/分位数，记录 cache miss、IPC、频率、线程数或
   可用替代指标，画出 Roofline/瓶颈假设。
3. **M3 · 算法/布局/缓存（第 3–4 周）**：每次只改一个主要因素，尝试数据布局、blocking、
   循环顺序或算法替换；保留退化实验。
4. **M4 · SIMD/多线程（第 5–6 周）**：自动向量化、intrinsics 或线程并行，说明对齐、
   边界、伪共享、同步和可扩展性；不得为了加速跳过 oracle。
5. **M5 · 终局与报告（第 7–8 周）**：隐藏规模无退化，达到分档目标或解释瓶颈，提交完整
   优化阶梯、正确性日志、资源数据和反思。

## 学生任务边界

教师提供一个简单、正确、可编译的 baseline 和 candidate 函数入口。学生实现 `candidate.c`
（可拆成自己的 `.c/.h`），并可改动数据布局、算法、编译选项和并行策略，但必须保持公共
函数签名或提供兼容适配器。benchmark harness 的 oracle、误差阈值、输入规模和防删工作检查
不得被削弱；任何更改都必须在报告中解释并由教师批准。

禁止把编译器的 `-O3` 单独当作学生优化、硬编码 fixture 输出、缩小输入、跳过计算、只返回
预存 checksum、删除边界元素或把计时区间移到工作之外。允许使用标准 C、OpenMP、SIMD
intrinsics、Metal/CUDA（可选），但平台依赖和 fallback 必须明确。

## 给定接口契约

```c
typedef struct {
    size_t width, height, steps;
    uint32_t seed;
} WorkloadConfig;

int baseline_stencil(const float *input, float *output,
                     size_t width, size_t height, size_t steps);
int student_stencil(const float *input, float *output,
                    size_t width, size_t height, size_t steps);
int run_benchmark(const WorkloadConfig *config, int use_student,
                  BenchmarkResult *result);
uint64_t digest_grid(const float *grid, size_t count);
```

正确性契约：harness 在独立 buffer 上运行 teacher baseline 作为 oracle；candidate 输出必须与
oracle 的每个元素在 `max_abs_error` 内一致，并通过 digest、边界/哨兵检查。`work_units` 和
输入/输出大小会被记录；candidate 返回错误、没有写出结果或只生成常量都会失败。benchmark
结果的 `correct` 只能由 harness 计算，不能由 candidate 自报。

## 运行与验收命令

在本项目目录执行：

```bash
make clean all
./build/benchmark
./build/benchmark --candidate
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests -v
python3 -m py_compile scripts/verify_scaffold.py tests/test_scaffold.py acceptance/test_student_acceptance.py
RUN_STUDENT_ACCEPTANCE=1 python3 -m unittest discover -s acceptance -v
```

`make clean all`、baseline、脚手架检查和语法/结构测试应通过；candidate 在当前 TODO stub
上返回非零，属于预期未完成状态。默认 CI 不运行 opt-in acceptance。学生实现后，candidate
必须先通过正确性，再谈 20×/50×/100× 的性能分档。

## 故障、边界与性能测试

公开边界：宽高小于 3、非方形网格、steps=0/1/多步、奇数尺寸、输入全零/高梯度、浮点误差、
输出缓冲未初始化、溢出风险。隐藏测试使用不同 seed、大小、steps、编译器和线程数；检查
边界不越界、输出全网格一致、候选不会依赖固定 fixture。

性能测试固定 CPU 亲和/频率策略（能做到时）、编译器版本、`CFLAGS`、输入、预热和重复数，
报告中位数与离散度。至少记录 baseline/candidate 的 wall time、加速比、吞吐、cache miss/
IPC（或替代指标）、内存占用和线程扩展；每次主要改动只出现一个因果解释。

## Rubric（40/25/15/10/10）

| 项目 | 权重 | 评分要点 |
|---|---:|---|
| 功能正确性 | 40% | candidate 通过独立 oracle、误差、边界和防删工作契约 |
| 故障与边界 | 25% | 尺寸/steps/seed/浮点/编译器/线程变化和退化输入 |
| 性能/资源 | 15% | 测量纪律、优化阶梯、分档加速、cache/IPC/内存/扩展性 |
| 结构与文档 | 10% | 小步 commit、接口稳定、构建复现、工具链和平台说明 |
| 报告与反思 | 10% | 假设—实验—结论、失败尝试、瓶颈迁移、成员分工和限制 |

详见 [`rubric.md`](rubric.md)。

## 交付物

- candidate 源码、构建文件和可在规定平台复现的命令；
- baseline/candidate 的正确性日志、每次优化 commit 与 benchmark CSV/文本；
- 2–6 页报告：硬件/编译器、baseline、优化阶梯、性能计数器、失败尝试、误差和结论；
- 若使用 GPU/并行，附 fallback、线程/显存条件和可重复的资源记录。

## 学术诚信

可以使用编译器手册、CPU/GPU 官方 intrinsic 文档和论文，必须标注引用与平台。不得复制
完整 6.172/生产库 benchmark、伪造 counters、硬编码答案、删除 oracle、隐藏错误结果或把
他人优化 commit 改写为自己的原创。自动生成代码必须能解释内存访问、同步和正确性证明。

## 平台条件

baseline 和脚手架默认只需要 C11 编译器（Mac 的 clang、Linux gcc/clang、Windows clang-cl/
MinGW 均可）和 Python 3.10+。`perf`、`likwid`、VTune、OpenMP、Metal/CUDA 为可选工具；报告
必须写清实际使用的工具。GPU 不是基础评分的必要条件。

## 可选挑战

- 设计 cache-oblivious 或 tiled 版本并解释工作集；
- 比较 auto-vectorization、SIMD intrinsics 和多线程的 Roofline 迁移；
- 添加 NUMA/线程亲和、伪共享对照或精度/吞吐可调模式；
- 在 Win 4060 Ti 上做 CUDA/共享内存版本，但保持 C/Python CPU oracle；
- 用 perf counter 或 sanitizer 找出一次“速度变快但其实错误”的尝试。

## 讲义映射

- 主线：[`perf-02-cache-practice.md`](../../lectures/perf-02-cache-practice.md)；
- 测量与 Roofline：`perf-01-engineering.md`；
- 数据/缓存表示：`csapp-01/02`；
- SIMD/并行：[`labs/L01-cache-blocking`](../../labs/L01-cache-blocking/README.md)、
  [`labs/L07-simd`](../../labs/L07-simd/README.md)、`par-01/02`、`gpu-01/02`。
