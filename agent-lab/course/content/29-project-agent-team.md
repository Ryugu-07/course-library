# 第 29 章 · 项目二：Agent 工程团队

> 完整项目二：在 Mini Codex 之上增加主 Agent、探索、实现、测试和审查角色，用独立上下文与 worktree 完成一个跨前后端任务。

## 1. 项目目标

用户提交一个功能目标，Coordinator 先建立依赖图，再把只读探索并行分配，汇总接口决定后启动前后端实现。每个写入 Agent 使用独立 worktree；Tester 在集成分支验证；Reviewer 只读检查最终 diff。人类在共享接口和高风险发现处做决策。

验收不是“启动了很多 Agent”，而是：

**并行任务确实独立，主上下文只保留决定和证据，写入互不覆盖，合并后完整测试通过，所有发现可追溯。**

## 2. 角色与权限

| 角色 | 输入 | 工具与权限 | 输出 |
|---|---|---|---|
| Coordinator | 用户目标、项目规则 | 只读仓库、调度工具 | 依赖图、接口决定、汇总 |
| Explorer | 有界研究问题 | 只读搜索与测试查询 | 文件地图、证据、未知项 |
| Implementer | 已确认接口与任务 | 独立 worktree 写入 | diff、提交、局部测试 |
| Tester | 集成候选 | 命令执行、只改测试报告 | 结构化验证结果 |
| Reviewer | 需求、规则、最终 diff | 只读 | 按严重度 findings |

角色名不提供安全，工具和工作目录才提供。后台 Agent 无法请求新权限时应自动拒绝并返回 blocked。

## 3. 任务协议

Coordinator 生成 TaskSpec：

~~~json
{
  "id": "frontend-form",
  "goal": "Add validation UI using the agreed error schema",
  "depends_on": ["api-contract"],
  "read_scope": ["web/", "shared/schema.json"],
  "write_scope": ["web/"],
  "acceptance": ["frontend tests pass", "mobile layout checked"],
  "risk": "medium"
}
~~~

调度器只并行 depends_on 已满足且 write_scope 不冲突的任务。共享决策 api-contract 是栅栏，完成前不启动实现。

## 4. 上下文交接

Explorer 不把几十页日志发回主线程，而是返回 Findings：

~~~text
结论：后端错误统一为 {code, message, field}
证据：server/errors.py:12-38；tests/test_errors.py
未知：旧客户端是否依赖 detail 字段
建议：先搜索 detail 的外部使用
~~~

Coordinator 验证未知项，形成 DecisionRecord。Implementer 只接收自己的 TaskSpec、DecisionRecord 和必要代码入口。这样每个上下文都小而专注。

## 5. Worktree 管理

调度器从同一 base_commit 创建 worktree/task-api 与 worktree/task-web，登记 owner、branch、port 和状态。每个 worktree 使用独立临时目录与端口。Agent 只能写自己的 write_scope。

实现完成后先在各自分支运行局部测试并提交。Coordinator 检查 base 是否变化，再合并到 integration 分支。文本无冲突也必须运行跨模块测试，因为语义冲突不会被 Git 检测。

## 6. Reviewer 与修复闭环

Reviewer 收到原需求、项目规则、DecisionRecord、最终 diff 和测试摘要。Finding 必须包含位置、触发路径和影响。Coordinator 过滤无证据项，高严重度问题重新生成修复 TaskSpec，而不是让 Reviewer 直接随意修改。

修复后重新运行受影响测试，并让 Reviewer 验证 finding 是否关闭。拒绝 finding 时保存理由，方便后续评测误报。

## 7. 调度状态机

~~~text
planning
→ exploring
→ decision_required
→ implementing_parallel
→ integrating
→ testing
→ reviewing
→ completed / blocked
~~~

每次状态变化写入 event log。中断时停止新任务，等待或终止子进程，保存 worktree 与已完成提交。Resume 读取事件并检查分支状态，不能只靠最后一段自然语言摘要。

## 8. 完整练习任务

为示例仓库增加“表单字段级错误”：

1. Explorer A 查后端错误格式；
2. Explorer B 查前端表单与现有测试；
3. Coordinator 决定共享 schema；
4. Implementer A 修改 API；
5. Implementer B 修改 UI；
6. Tester 合并后运行 API、前端和浏览器检查；
7. Reviewer 检查兼容性、边界与缺失测试；
8. Coordinator 输出最终证据与残余风险。

主动加入一个冲突：两个实现都想修改 shared/schema.json。观察调度器应把共享 schema 提前变成串行 DecisionTask，而不是让两个 Agent 各写一版。

## 9. 评测项目二

与单 Agent 对比：总完成时间、主上下文 Token、重复读取、合并冲突、错误完成和最终质量。并行可能缩短墙钟时间，却增加总 Token；worktree 减少覆盖，却增加合并步骤。项目目标是看见这些权衡，而不是证明多 Agent 永远更好。

## 10. 代码与验收

[agent_team.py](downloads/agent_team.py) 提供离线调度模拟：读取 TaskSpec，生成依赖层，检测 write_scope 冲突并输出事件。真实 Provider 版可以复用 Mini Codex 作为 worker。先用 --self-test 和默认示例理解调度，再把 worker 替换为实际 Agent Thread。

~~~bash
python3 downloads/agent_team.py --self-test
python3 downloads/agent_team.py --mode worktrees
python3 downloads/agent_team.py --mode parallel --include-conflict
~~~

最终验收清单：

- 所有任务都有目标、范围、依赖和证据；
- 并行任务没有未处理的共享写入；
- 子 Agent 失败能传播为 blocked 或降级；
- 合并后执行完整验证；
- Reviewer 不能直接扩大权限；
- 中断后 worktree 和事件可恢复；
- 最终报告区分事实、决定和剩余风险。

!!! warning "项目二的核心难点"
    多 Agent 系统最难的不是“生成更多模型调用”，而是任务边界、共享决定、权限继承、失败传播和结果合并。任何一个没有显式协议，团队就只是多个并发聊天窗口。
