# P07 设计与系统报告模板

## 1. 模型与接口范围

- 组员、分工、提交 commit：
- 模型 schema、随机种子、tokenizer/参考实现：
- CPU、NumPy、GPU 路径分别支持什么：

## 2. 单请求与 KV cache

- prefill/decode 数据流：
- K/V 的 shape、dtype、page layout：
- cache 命中、append、释放和取消不变量：

## 3. Continuous batching scheduler

- submit/cancel/step 状态机：
- token budget、优先级/aging、公平性和防饿死证据：
- 一个请求时间线：

## 4. Paged KV 资源管理

- page size、handle、引用、回收和碎片：
- 预算不足/OOM、异常释放、请求隔离如何处理：

## 5. Quantization

- bits、scale/zero-point、group size、校准数据：
- 误差指标、反量化路径和精度边界：

## 6. 正确性与故障矩阵

| 场景 | 设备 | 结果/golden | TTFT | TPOT | KV bytes | 失败原因或修复 |
|---|---|---|---:|---:|---:|---|
|  |  |  |  |  |  |  |

## 7. 性能与平台

- 固定请求流、预热、重复、统计量：
- CPU/NumPy/Win 4060 Ti（如有）的版本与显存：
- batch utilization、page 碎片和量化增量收益：

## 8. 反思与后续

- 最大瓶颈是否从计算转移到内存/调度？
- 哪个优化牺牲了什么？
- 若再有两周，先实现哪个可选挑战？
