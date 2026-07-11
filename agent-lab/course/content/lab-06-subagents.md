# 实验 06 · 子 Agent 任务拆分器

> 对应第 19–21 章。本实验比较单 Agent、普通子 Agent 和独立 worktree，观察上下文噪声、并行收益与写入冲突。

## 1. 实验问题

多 Agent 的价值取决于任务独立性。探索认证流程和运行测试可以并行；两个任务都修改 server/auth.py 会发生写入与语义冲突。Worktree 能防止立即覆盖，却不能自动决定哪种设计正确。

先保持默认五项任务，切换三种模式；然后勾选“另一项任务也修改 server/auth.py”。

## 2. 运行拆分器

<div class="lab-shell" data-lab="subagents"></div>

主上下文噪声数字是教学模拟，用于表达趋势，不是精确 Token 估算。真正系统应从 trace 统计每个 Thread 的输入与输出。

## 3. 看懂调度结果

单 Agent 顺序执行最简单，所有中间日志进入主历史；子 Agent 并行缩短独立任务墙钟时间，并把原始过程留在子上下文；worktree 进一步隔离文件写入，但需要提交、合并和集成验证。

当写目标重叠时，普通并行可能互相覆盖；worktree 会把冲突推迟到合并。两者都需要先确定共享接口或由 Coordinator 做选择。

## 4. 写一份 TaskSpec

选择“实现 API 修改”，为它写：

- goal：明确行为，不写“完成后端”；
- depends_on：共享接口决定；
- read_scope 与 write_scope；
- allowed_tools；
- acceptance：局部测试和接口契约；
- max_turns 与风险；
- 返回格式：diff、测试、未知项。

如果 TaskSpec 仍需要子 Agent 自己猜产品决定，它就不够独立。

## 5. 失败传播

想象 Explorer 被权限拒绝、Implementer 测试失败、Reviewer 发现 P1。哪些可以降级，哪些必须阻塞集成？Coordinator 应根据 required 依赖传播状态，而不是把所有子任务失败都自动重跑。

后台 Agent 不能向用户弹审批时，默认拒绝并返回 blocked 比悄悄等待更可靠。

## 6. 代码挑战

用 dataclass 实现 TaskSpec 与 topological_layers。检测同一层 write_scope 重叠并拒绝普通并行；worktree 模式允许启动但标记 merge_risk。输出事件而不是只打印最终顺序。

完成实验后，你应能解释：子 Agent 解决上下文隔离，调度器解决依赖与预算，worktree 解决物理写入隔离，集成测试解决语义兼容。

