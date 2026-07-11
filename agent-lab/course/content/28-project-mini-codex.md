# 第 28 章 · 项目一：Mini Codex

> 完整项目一：把当前 minimal_swe_agent.py 升级成一个可靠、可恢复、能验证的小型本地编码 Agent。目标不是复制商业产品，而是亲手接通它们最核心的工程逻辑。

## 1. 项目目标与非目标

最终程序接收一个仓库任务，先探索相关文件，再用精确补丁修改，运行验证并输出带证据的结果。它支持 OpenAI 或 DeepSeek Provider，所有真实动作受 workspace 和审批策略约束，任务轨迹可以恢复。

本项目不追求图形界面、云端容器、数百工具或复杂自主规划。限制规模是为了让每条数据流都能被你解释。

验收用一句话描述：

**给定一个带失败测试的小仓库，Mini Codex 能在不覆盖用户已有变化的前提下定位、修复、复测，并报告 diff 与证据。**

## 2. 最终目录

~~~text
mini_codex/
├── agent.py          # 主循环与 AgentState
├── providers.py      # OpenAI / DeepSeek 适配
├── tools.py          # 文件、搜索、补丁、Shell
├── policy.py         # workspace 与审批规则
├── transcript.py     # JSONL 事件与恢复
├── verify.py         # diff、测试与完成协议
├── prompts.py        # 短小稳定的系统规则
└── tests/
    ├── test_paths.py
    ├── test_parser.py
    └── test_replay.py
~~~

课程附带的 solution 为了方便阅读仍可合并成单文件，但上面这张图表示真实责任边界。你应先理解模块，再决定是否拆文件。

## 3. 核心数据结构

AgentState 保存目标、history、turn、status、最近工具指纹、变更文件、验证记录和预算。ToolCall 是 Provider 与 Runtime 之间的统一协议。ToolResult 保留 ok、输出、错误类型、退出码、截断和耗时。

~~~python
@dataclass
class AgentState:
    task: str
    history: list[dict]
    turn: int = 0
    status: str = "running"
    changed_files: set[str] = field(default_factory=set)
    checks: list[dict] = field(default_factory=list)
    recent_calls: list[str] = field(default_factory=list)
~~~

不要直接把 SDK response 存进状态。Provider adapter 应转换为标准事件，才能切换模型和离线回放。

## 4. 六个实现里程碑

### 里程碑 A：可观察循环

保留现有 read_file、write_file、run_shell，但把每轮请求、模型响应、工具开始、工具结果和停止理由写入 JSONL。加入 --dry-run 与 --self-test。验收是不用 API 也能回放固定工具调用样本。

### 里程碑 B：仓库发现

增加 list_files 与 search_text，默认忽略 .git、依赖和构建目录，限制结果数量。Agent 在修改前必须读取 git status 和项目规则。验收是它能用两三次查询定位失败测试，而不是全量读取仓库。

### 里程碑 C：精确修改

增加 apply_patch 或严格 replace_text，写入前核对旧内容，失败时返回当前位置。每次写入后记录 changed_files 和当前 diff。禁止在已有用户修改时整文件覆盖。

### 里程碑 D：可靠运行

给模型 API 加瞬时故障退避，给工具加超时与输出截断；加入重复调用指纹和 max_turns。权限拒绝、测试失败和 API 故障使用不同错误类型。

### 里程碑 E：验证协议

任务开始时从规则或用户目标得到 verification_commands。修改后运行相关测试、审查 diff，只有出现完成证据才能 status=completed。否则输出 blocked 或 partial。

### 里程碑 F：保存与恢复

每个 Thread 使用独立 JSONL。--resume 读取最后状态，重新验证工作树版本，避免重复执行已经完成的副作用工具。API key 从环境重新注入，不写入轨迹。

## 5. 主循环的完成形态

~~~python
while state.status == "running":
    enforce_budgets(state)
    request = provider.build_request(state)
    response = provider.call(request)
    events = provider.parse(response)

    if events.tool_calls:
        for call in events.tool_calls:
            policy.check(call)
            result = tools.execute(call)
            transcript.append(call, result)
            state.observe(result)
        continue

    candidate = events.final_text
    evidence = verifier.check(state)
    state.status = "completed" if evidence.satisfied else "running"
~~~

真实实现还要处理审批、打断和异常，但这段骨架说明最终回答本身不能绕过 verifier。

## 6. 测试任务

准备一个小仓库，故意加入三个问题：

1. quantity 计算漏乘数量，已有失败单测；
2. README 给出测试命令；
3. 用户预先修改一个无关文件但未提交。

运行 Agent 后检查：只修改目标代码和必要测试；保留无关用户变化；失败测试转为通过；轨迹能解释每一步；拒绝 workspace 外路径；达到预算时不会谎报完成。

## 7. 失败注入

为了确认系统可靠，主动模拟 Provider 第一次 429、工具输出超过上限、补丁上下文过期、用户拒绝 shell、测试持续失败和中途 Ctrl+C。可靠性不是正常路径能跑，而是这些状态都有明确结果并能恢复。

## 8. 人类在项目中的工作

你负责定义工具边界、完成标准和何时必须审批。AI 可以生成代码与测试，但每个里程碑完成后，你应该能回答：

- 新状态保存在哪里；
- 哪个模块拥有真实副作用；
- 什么证据让 status 变成 completed；
- 如果进程在此刻崩溃，恢复会不会重复动作。

## 9. 项目交付与下一步

完整项目代码位于 [mini_codex.py](downloads/mini_codex.py)。先运行 --self-test，再用默认 demo Provider 看离线轨迹，最后设置 Provider key 做真实小任务。不要一开始就在重要仓库开启全权限。

~~~bash
python3 downloads/mini_codex.py --self-test
python3 downloads/mini_codex.py --provider demo
python3 downloads/mini_codex.py --provider deepseek "Inspect this workspace and run its tests"
~~~

!!! note "项目一的真正成果"
    不是“拥有一个简化版 Codex”，而是你能从一次工具调用一路追到文件副作用、验证证据和最终状态。这套判断能力可以迁移到任何 Agent 产品。
