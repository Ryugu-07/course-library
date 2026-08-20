# 第 30 章 · Coding Agent Harness 架构对照

> 本章是 2026-08-20 的公开资料快照。目标不是评判谁更强，而是把前 29 章的概念映射到成熟产品、开放源码和可复现评测。未公开的系统提示词、模型路由和私有调度算法会明确标为未知；developer preview 的接口也不会写成稳定承诺。

## 1. 共同的底层形态

Codex 与 Claude Code 都是 coding agent harness：模型负责推理，宿主提供文件、搜索、Shell、网络或外部工具，工具结果回到循环，系统管理上下文、权限、会话和验证。产品名称不同，核心仍是：

**Prompt / Context → Model → Tool Intent → Policy → Executor → Observation → Next Turn。**

Claude Code 官方把循环描述为 gather context、take action、verify results，并说明 harness 提供工具、上下文管理和执行环境。[How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

Codex Cloud 的公开流程是创建容器、检出仓库、运行 setup、应用网络策略，然后 Agent 在终端循环中编辑与验证，最后展示回答与 diff。[How Codex cloud tasks run](https://learn.chatgpt.com/docs/environments/cloud-environment#how-codex-cloud-tasks-run)

这里的 harness 指**产生行动和补丁的宿主**。SWE-bench 还把负责准备容器、应用补丁、运行测试和判分的外层程序称为 evaluation harness。两者都叫 harness，却处在内外两层：前者生成一次轨迹，后者比较许多轨迹的结果。

## 2. 四种公开切面：不是四份功能清单

### SWE-agent：Agent-Computer Interface 是研究变量

SWE-agent 以真实 GitHub issue 为任务，把模型放进专门设计的 Agent-Computer Interface；它强调工具界面、历史处理和环境怎样影响软件工程行为。它适合研究“给模型怎样的行动语言”，但公开 benchmark 结果仍属于指定模型、配置、任务和评测环境的联合结果。[SWE-agent 官方仓库](https://github.com/SWE-agent/SWE-agent)

### mini-swe-agent：把 harness 压到可一眼读完

mini-swe-agent v2 刻意走另一端：agent 类约百行 Python，只提供 Bash，历史线性追加，每个动作独立通过 `subprocess.run` 执行。它的价值是透明、易改和容易替换本地/容器执行环境，而不是证明专用工具永远无用。模型更强时，极简基线可以暴露“收益究竟来自模型还是复杂脚手架”；高风险写操作、长期会话和丰富产品交互仍可能需要额外层。[mini-swe-agent 官方仓库](https://github.com/SWE-agent/mini-swe-agent)

### DeepSeek Harness：把每一层做成插件接缝

DeepSeek Harness（`dsh`）是 DeepSeek AI 在 2026 年公开的 MIT 许可 agent harness。官方截至本快照明确标为 **developer preview**，并警告会有破坏性兼容变更，因此本课只学习其架构，不把命令和配置当长期稳定 API。

它基于 Cordis，把模型适配器、工具注册表、session log、agent loop 等都作为插件；profile 由有序 bundle 层叠形成，基础层再组合持久化、沙箱、审批、设置、凭据和 telemetry。最值得迁移的不是“插件越多越好”，而是三条设计纪律：

1. **模型可见即应可重放。** session event log 是模型上下文来源；进入模型请求的信息应能从日志重建，resume、fork、transcript 和 telemetry 才有共同事实源。
2. **能力有 definition/provider/consumer 三个角色。** 文件、Shell 或 subagent 的实现可以替换，而消费方依赖稳定接缝；替换 provider 不必分叉整个 agent loop。
3. **持久事实与实时拦截分开。** session events 保存 durable facts；`agent/*`、`tools/*` 和 capability events 用于观察或拦截进行中的请求、工具和策略。

默认 turn flow 仍能还原成本课的骨架：组装 prompt/tool schema，发出模型请求，流式记录 assistant 事件，经 guarded tool pipeline 执行，再由 stopping/validation 接缝决定是否继续。官方仓库可以运行 Web/headless profile，但“开源 harness”不等于 DeepSeek 托管产品全部内部实现，也不证明它参与了某个模型训练或已经稳定适合生产。[官方 README](https://github.com/deepseek-ai/deepseek-harness)；[架构文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)

### SWE-bench evaluation harness：补丁生成以后才开始

SWE-bench 的官方 evaluation harness 用分层 Docker 镜像准备实例，把预测补丁应用到指定仓库，再运行测试并判定是否解决任务。它解决跨平台复现和环境隔离，却不会替 agent 选择工具、管理上下文或生成补丁。读任何 SWE 成绩时，至少同时记录 agent harness、evaluation harness、镜像/仓库版本、预算、超时、重复口径和是否能访问测试。[官方 harness 文档](https://github.com/SWE-bench/SWE-bench/blob/main/docs/reference/harness.md)

## 3. Codex 与 Claude Code 概念映射表

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

## 4. Codex 的公开架构重点

Codex 的定制层公开包括 AGENTS.md、Memories、Skills、MCP 和 Subagents。官方建议用规则塑造长期行为、Skill 封装流程、MCP 连接外部系统，并使用渐进披露减少上下文占用。[Codex customization](https://learn.chatgpt.com/docs/customization/overview)

Codex App Server 对客户端暴露 thread/start、thread/resume、thread/fork、turn/start、turn/steer、turn/interrupt、review、approval、skills、hooks、MCP、文件和后台终端等事件接口。这说明成熟桌面或 IDE 客户端不是简单调用一次模型，而是在消费一个持续状态协议。[Codex App Server](https://learn.chatgpt.com/docs/app-server)

安全层公开区分 sandbox mode 与 approval policy。本地默认限制写入范围与网络，云端使用隔离容器，并把 setup 与 Agent 阶段的网络和秘密分开。[Codex approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)

## 5. Claude Code 的公开架构重点

Claude Code 官方说明会把消息、工具使用和结果保存为本地 JSONL session，并支持 resume、fork、文件快照与自动 compaction。上下文包含对话、文件、命令输出、CLAUDE.md、记忆、Skills 和系统指令。[How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)

Claude Code 的权限规则覆盖 Bash、Read、Edit、WebFetch、MCP 和 Agent；Bash sandbox 在操作系统层限制文件与网络，两层互补。[Claude Code permissions](https://code.claude.com/docs/en/permissions)

自定义 Subagent 可以拥有独立 prompt、tools、model、permissionMode、MCP、Hooks、Skills、memory、maxTurns 与 isolation。每个子 Agent 从新上下文开始，完成后向主线程返回摘要。[Claude Code subagents](https://code.claude.com/docs/en/sub-agents)

记忆方面，CLAUDE.md 属于每次加载的规则，auto memory 使用短索引与按需主题文件，强调机器本地与可编辑。[Claude Code memory](https://code.claude.com/docs/en/memory)

## 6. 差异应该怎样学习

不要背功能勾选表，应该追问产品选择：

- 状态存在哪里，能否恢复和分叉；
- 工具定义何时进入上下文；
- 权限拒绝怎样返回模型；
- 后台任务怎样申请权限；
- 并行写入怎样隔离和合并；
- 扩展是规则、Skill、MCP、Hook 还是 Plugin；
- 本地和云环境怎样交接。

这些问题比某个按钮当前在哪里更稳定。产品界面和命令会变化，数据流与安全责任不会轻易消失。

## 7. 哪些细节不能声称知道

公开文档没有完整披露内部 system prompt、训练数据、私有模型路由、隐藏评分器、全部压缩算法和云端调度实现。开源仓库也可能只包含插件、SDK、客户端或一个可替代实现，不等于同名托管产品的完整服务端。反过来，一个源码完整的 harness 也不包含它所调用模型的训练数据与权重生成过程。

课程可以做三件诚实的事：

1. 准确讲公开 API、配置和可观察行为；
2. 从这些行为推断必要的抽象，但明确写“推断”；
3. 在 Mini Codex 中实现一个等价机制，证明逻辑如何运转，而不冒充官方内部源码。

## 8. 从使用者转向架构负责人

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

再补一张版本卡，才能比较不同系统：模型与推理配置、prompt、agent harness、工具、权限/沙箱、verifier、environment、evaluation harness、预算、超时和重复次数。只写“用了 Qwen/DeepSeek/Codex/Claude”不足以复现一次结果。

## 9. 全课收束

最小 Agent 只有一个循环和三个工具；成熟产品增加了协议、状态、上下文治理、权限、执行环境、可恢复任务、多 Agent、扩展生态和多种客户端。它们不是突然出现的魔法，而是每次真实失败后增加的一层工程答案。

你不必成为熟练的语法工人，但需要能提出正确的系统问题。未来人与 AI 的分工不是“人只提一句需求，AI 包办一切”，而是人负责目标、边界、证据和价值取舍，Agent 负责在这些约束内执行、验证和汇报。

!!! note "毕业标准"
    你能不用产品名复述一遍：一个长期编码任务如何进入 Thread，模型怎样选择工具，Executor 怎样守住边界，观察怎样改变下一轮，子 Agent 怎样隔离噪声，最终结果凭什么被接受。做到这一点，你理解的是 Agent，而不只是会用某个按钮。
