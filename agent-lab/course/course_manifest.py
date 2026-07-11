"""Full Agent course structure used by the static-site builder."""

STAGES = [
    (
        "第一阶段 · 最小 Agent 透明内核",
        [
            ("01-mental-model.md", "01 · Agent 到底是什么"),
            ("02-tool-protocol.md", "02 · 消息与工具调用协议"),
            ("03-loop-state.md", "03 · 主循环、状态与停止条件"),
            ("04-executor-boundary.md", "04 · Executor 与工作区边界"),
        ],
    ),
    (
        "第二阶段 · 可靠的本地编码 Agent",
        [
            ("05-repo-discovery.md", "05 · 仓库发现与代码搜索"),
            ("06-patch-diff.md", "06 · 精确补丁与 Diff"),
            ("07-shell-runtime.md", "07 · Shell、PTY 与后台进程"),
            ("08-errors-retries.md", "08 · 错误、重试与幂等"),
            ("09-verification-loop.md", "09 · 验证闭环"),
        ],
    ),
    (
        "第三阶段 · 上下文与长期任务",
        [
            ("10-context-anatomy.md", "10 · 上下文窗口解剖"),
            ("11-compaction.md", "11 · 压缩、摘要与上下文腐化"),
            ("12-sessions-threads.md", "12 · Session、Thread 与恢复"),
            ("13-memory-rules.md", "13 · 记忆、规则与学习"),
            ("14-planning-budget.md", "14 · 计划、任务状态与预算"),
        ],
    ),
    (
        "第四阶段 · 安全与人类控制",
        [
            ("15-approval-policy.md", "15 · 审批策略"),
            ("16-sandbox-network.md", "16 · 沙箱、文件与网络"),
            ("17-injection-secrets.md", "17 · 提示词注入与秘密保护"),
            ("18-human-interface.md", "18 · Diff、打断、转向与审计"),
        ],
    ),
    (
        "第五阶段 · 多 Agent 与并行",
        [
            ("19-subagent-isolation.md", "19 · 子 Agent 与上下文隔离"),
            ("20-parallel-orchestration.md", "20 · 并行调度与结果汇总"),
            ("21-worktrees-conflicts.md", "21 · Worktree 与写入冲突"),
            ("22-reviewer-judge.md", "22 · Reviewer、Judge 与共识"),
        ],
    ),
    (
        "第六阶段 · 可扩展 Agent 平台",
        [
            ("23-instructions-skills.md", "23 · 指令、Skills 与渐进加载"),
            ("24-mcp-tools.md", "24 · MCP 与外部系统"),
            ("25-hooks-plugins.md", "25 · Hooks、Plugins 与生命周期"),
            ("26-product-surfaces.md", "26 · CLI、IDE、App、Cloud 与 SDK"),
        ],
    ),
    (
        "第七阶段 · 生产化与完整项目",
        [
            ("27-observability-evals.md", "27 · 轨迹、成本与评测"),
            ("28-project-mini-codex.md", "28 · 项目一：Mini Codex"),
            ("29-project-agent-team.md", "29 · 项目二：Agent 工程团队"),
            ("30-codex-claude-code.md", "30 · Codex 与 Claude Code 架构对照"),
        ],
    ),
]

LABS = [
    ("lab-01-loop.md", "实验 01 · Agent 循环逐帧播放器", "03-loop-state.html"),
    ("lab-02-provider.md", "实验 02 · 三种 Provider 数据包检查器", "02-tool-protocol.html"),
    ("lab-03-retry.md", "实验 03 · 重试与停止状态机", "08-errors-retries.html"),
    ("lab-04-context.md", "实验 04 · 上下文预算模拟器", "10-context-anatomy.html"),
    ("lab-05-permission.md", "实验 05 · 权限与沙箱判定台", "15-approval-policy.html"),
    ("lab-06-subagents.md", "实验 06 · 子 Agent 任务拆分器", "20-parallel-orchestration.html"),
    ("lab-07-extension.md", "实验 07 · 扩展机制选择器", "25-hooks-plugins.html"),
    ("lab-08-eval.md", "实验 08 · Agent 版本评测台", "27-observability-evals.html"),
]

PROJECT_CHAPTERS = {"28-project-mini-codex.md", "29-project-agent-team.md"}


def flat_chapters():
    return [item for _, chapters in STAGES for item in chapters]

