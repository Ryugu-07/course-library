# 第 30 章 · Codex 与 Claude Code 架构对照

> 本章是 2026-07 的公开资料快照。目标不是评判谁更强，而是把前 29 章的概念映射到两个成熟产品。未公开的系统提示词、模型路由和私有调度算法会明确标为未知。

## 1. 共同的底层形态

Codex 与 Claude Code 都是 coding agent harness：模型负责推理，宿主提供文件、搜索、Shell、网络或外部工具，工具结果回到循环，系统管理上下文、权限、会话和验证。产品名称不同，核心仍是：

**Prompt / Context → Model → Tool Intent → Policy → Executor → Observation → Next Turn。**

Claude Code 官方把循环描述为 gather context、take action、verify results，并说明 harness 提供工具、上下文管理和执行环境。[How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

Codex Cloud 的公开流程是创建容器、检出仓库、运行 setup、应用网络策略，然后 Agent 在终端循环中编辑与验证，最后展示回答与 diff。[How Codex cloud tasks run](https://learn.chatgpt.com/docs/environments/cloud-environment#how-codex-cloud-tasks-run)

## 2. 概念映射表

| 架构问题 | Codex 公开表面 | Claude Code 公开表面 |
|---|---|---|
| 项目持久规则 | AGENTS.md | CLAUDE.md 与 rules |
| 可复用方法 | Skills | Skills |
| 外部工具 | MCP、Connectors、Apps | MCP |
| 生命周期强制逻辑 | Hooks | Hooks |
| 专业子任务 | Subagents | Subagents / Agent tool |
| 会话连续性 | Thread、Turn、fork、compact | Session、resume、fork、compact |
| 本地隔离 | Sandbox + approval policy | Permissions + Bash sandbox |
| 并行写入 | managed worktree / cloud task | Git worktree 与并行 sessions |
| 程序化嵌入 | App Server、SDK、MCP server | Agent SDK、headless CLI |
| 分发扩展 | Plugins | Plugins |

同名概念的配置格式和具体能力不一定相同，不能把一个产品的文件直接假设为另一个产品可用。

## 3. Codex 的公开架构重点

Codex 的定制层公开包括 AGENTS.md、Memories、Skills、MCP 和 Subagents。官方建议用规则塑造长期行为、Skill 封装流程、MCP 连接外部系统，并使用渐进披露减少上下文占用。[Codex customization](https://learn.chatgpt.com/docs/customization/overview)

Codex App Server 对客户端暴露 thread/start、thread/resume、thread/fork、turn/start、turn/steer、turn/interrupt、review、approval、skills、hooks、MCP、文件和后台终端等事件接口。这说明成熟桌面或 IDE 客户端不是简单调用一次模型，而是在消费一个持续状态协议。[Codex App Server](https://learn.chatgpt.com/docs/app-server)

安全层公开区分 sandbox mode 与 approval policy。本地默认限制写入范围与网络，云端使用隔离容器，并把 setup 与 Agent 阶段的网络和秘密分开。[Codex approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)

## 4. Claude Code 的公开架构重点

Claude Code 官方说明会把消息、工具使用和结果保存为本地 JSONL session，并支持 resume、fork、文件快照与自动 compaction。上下文包含对话、文件、命令输出、CLAUDE.md、记忆、Skills 和系统指令。[How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

Claude Code 的权限规则覆盖 Bash、Read、Edit、WebFetch、MCP 和 Agent；Bash sandbox 在操作系统层限制文件与网络，两层互补。[Claude Code permissions](https://code.claude.com/docs/en/permissions)

自定义 Subagent 可以拥有独立 prompt、tools、model、permissionMode、MCP、Hooks、Skills、memory、maxTurns 与 isolation。每个子 Agent 从新上下文开始，完成后向主线程返回摘要。[Claude Code subagents](https://code.claude.com/docs/en/sub-agents)

记忆方面，CLAUDE.md 属于每次加载的规则，auto memory 使用短索引与按需主题文件，强调机器本地与可编辑。[Claude Code memory](https://code.claude.com/docs/en/memory)

## 5. 两者差异应该怎样学习

不要背功能勾选表，应该追问产品选择：

- 状态存在哪里，能否恢复和分叉；
- 工具定义何时进入上下文；
- 权限拒绝怎样返回模型；
- 后台任务怎样申请权限；
- 并行写入怎样隔离和合并；
- 扩展是规则、Skill、MCP、Hook 还是 Plugin；
- 本地和云环境怎样交接。

这些问题比某个按钮当前在哪里更稳定。产品界面和命令会变化，数据流与安全责任不会轻易消失。

## 6. 哪些细节不能声称知道

公开文档没有完整披露内部 system prompt、训练数据、私有模型路由、隐藏评分器、全部压缩算法和云端调度实现。开源仓库也可能只包含插件、SDK 或客户端部分，不等于完整产品服务端。

课程可以做三件诚实的事：

1. 准确讲公开 API、配置和可观察行为；
2. 从这些行为推断必要的抽象，但明确写“推断”；
3. 在 Mini Codex 中实现一个等价机制，证明逻辑如何运转，而不冒充官方内部源码。

## 7. 从使用者转向架构负责人

当你让 AI 实现一个新功能时，可以用最终检查表：

| 问题 | 你要做的决定 |
|---|---|
| 它需要看见什么 | 上下文来源与加载时机 |
| 它可以做什么 | 工具、schema 与权限 |
| 它怎样继续 | 状态机、停止与恢复 |
| 它怎样证明成功 | 验证器与验收标准 |
| 它会伤害什么 | 沙箱、审批与秘密 |
| 它怎样复用 | Rule、Skill、MCP、Hook、Plugin |
| 它怎样扩展 | 子 Agent、worktree、Cloud、SDK |
| 它怎样改进 | Trace、评测、成本和回归集 |

## 8. 全课收束

最小 Agent 只有一个循环和三个工具；成熟产品增加了协议、状态、上下文治理、权限、执行环境、可恢复任务、多 Agent、扩展生态和多种客户端。它们不是突然出现的魔法，而是每次真实失败后增加的一层工程答案。

你不必成为熟练的语法工人，但需要能提出正确的系统问题。未来人与 AI 的分工不是“人只提一句需求，AI 包办一切”，而是人负责目标、边界、证据和价值取舍，Agent 负责在这些约束内执行、验证和汇报。

!!! note "毕业标准"
    你能不用产品名复述一遍：一个长期编码任务如何进入 Thread，模型怎样选择工具，Executor 怎样守住边界，观察怎样改变下一轮，子 Agent 怎样隔离噪声，最终结果凭什么被接受。做到这一点，你理解的是 Agent，而不只是会用某个按钮。

