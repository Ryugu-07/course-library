# 第 27 章 · 轨迹、成本与评测

> 本章目标：让 Agent 的改进从“这次看起来不错”变成可回放、可比较、可定位原因的工程过程。

## 1. 为什么最终答案不够

两个 Agent 都给出正确代码，一个可能三轮完成，另一个读了五十个文件、花费十倍 Token 并尝试危险命令。只比较最终文本看不见这些差异。需要保存完整但脱敏的轨迹：模型请求摘要、工具调用、权限决定、状态变化、验证证据和耗时。

轨迹不是为了窥视隐藏推理，而是记录可观察行动。它帮助回答失败发生在哪层：检索没找到文件、模型选错工具、Executor 参数错误、权限阻塞，还是验证标准不足。

## 2. 基本指标

可以从五类指标开始：

| 类别 | 例子 |
|---|---|
| 任务结果 | 成功率、部分完成、错误完成 |
| 效率 | Turns、工具调用数、Token、延迟、费用 |
| 可靠性 | 重试、重复行为、崩溃、恢复成功率 |
| 安全 | 审批次数、拒绝、越界尝试、秘密暴露 |
| 质量 | 测试通过、审查发现、用户接受率 |

最危险的指标是“模型说完成”的比例。它应与独立验收结果比较，形成 false completion。

## 3. 建立任务集

评测任务要覆盖真实分布：小修复、跨文件功能、失败测试、模糊需求、大日志、权限受限和无法完成的任务。每个任务包含初始仓库状态、用户目标、允许工具、验收脚本和风险检查。

每次运行还要保存完整的系统配置，而不是只写模型名：

~~~text
RunConfig =
  dataset + instance + repository commit + environment image
  + model + decoding/reasoning settings
  + prompt + agent harness + tools + policy + task verifier
  + evaluation harness + grader version
  + budget + timeout + random seed
~~~

软件工程 benchmark 至少有两种容易混淆的 harness：**agent harness** 产生行动轨迹和最终补丁；**evaluation harness** 在隔离环境中应用补丁、运行验收并判分。SWE-bench 的官方 evaluation harness 使用分层 Docker 镜像来准备仓库环境、应用预测补丁、执行测试和产出结果。它让判分环境更可复现，却不会自动证明上游 agent 没见过测试、任务没有污染，或所有现实软件工程工作都被覆盖。

不要只收集成功案例。Agent 是否能在权限不足时正确停止、在测试不可用时诚实报告，也是能力的一部分。

## 4. 可重复与不确定性

模型输出有随机性，同一任务要运行多次，并记录模型版本、参数、工具版本和基点提交。一次 100% 成功不能证明稳定；平均成功率也可能掩盖某类任务全面退化。

对比版本时固定任务集和环境，报告置信区间或至少报告样本量。生产指标与离线评测互补：离线可控，生产更真实但受用户行为和环境影响。

最少做两条正交对照，才有资格讨论改进来自哪里：

| 对照 | 固定什么 | 改变什么 | 能回答什么 |
|---|---|---|---|
| model-only | prompt、agent harness、工具、权限、task verifier、evaluation harness、镜像、任务、预算与超时 | 模型/推理配置 | 在这套宿主与判分协议里，模型变化带来什么？ |
| harness-only | 模型、推理配置、prompt、evaluation harness、镜像、任务、预算与超时 | agent harness 的工具、上下文、循环、权限或任务内验证 | 宿主工程变化带来什么？ |

combined 对照可以回答“新系统整体是否更好”，却不能单独归因。若两个版本连仓库镜像、超时和验收器也不同，分数差甚至可能主要来自评测协议变化。

## 5. Trace 驱动改进

失败轨迹可以标注根因：

1. Context：没看到关键规则；
2. Planning：错误拆解或过早修改；
3. Tool：工具缺失、schema 模糊；
4. Runtime：重试、状态或协议错误；
5. Verification：测试选择不足；
6. Safety：策略过严或过宽。

修复根因后加入回归任务，避免只为一个示例调 prompt。许多能力提升来自工具和验证，而不是换更大模型。

## 6. 成本、缓存和路由

重复的仓库索引、相同文档和不变工具定义可以缓存；大日志摘要可以由便宜模型完成；高风险架构决策使用更强模型。成本优化不能破坏来源与版本检查，否则缓存旧文件会让 Agent 基于过期事实工作。

预算应与任务价值绑定。自动格式修复不值得无限推理；生产事故诊断可以分配更高时间和模型预算，但权限仍不能自动扩大。

## 7. 本章实验

实验 08 用模拟任务集比较 v0 与 v1。先选 model-only、harness-only 或 combined 对照，再调整故障率和候选策略；观察成功率、错误完成、安全事件和成本并不会同时朝同一方向变化。实验必须显示哪一层被改变，并把失败归入 context、tool、runtime、verification 或 safety，不能把所有退化都归咎于“模型不够聪明”。发布判断是多指标约束，而不是追求一个最高分。

!!! warning "评测污染"
    如果 Agent 见过验收脚本或直接针对固定答案优化，分数会虚高。把验收放在独立位置，保留隐藏任务，并定期加入真实失败案例。

**一手参考：**[SWE-bench evaluation harness](https://github.com/SWE-bench/SWE-bench/blob/main/docs/reference/harness.md)；[SWE-agent](https://github.com/SWE-agent/SWE-agent)；[mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent)。
