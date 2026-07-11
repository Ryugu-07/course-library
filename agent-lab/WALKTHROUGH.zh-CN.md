# Minimal SWE Agent 中文讲解

这个项目不是生产级框架，而是一个教学用的最小 agent。它要让你看懂
Codex、Claude Code、SWE-agent 这类工具的最小内核：模型本身不会真的读写文件
或运行命令，它只是提出“我要调用某个工具”。真正动手的是我们写的 Python 程序。

一句话版：

```text
人类任务 -> 拼 prompt -> 模型决定是否调工具 -> 解析工具调用 -> 本地执行
-> 把结果塞回上下文 -> 再问模型 -> 直到模型不再调工具
```

## 先建立一个心智模型

你可以把这个 agent 想成一个“小项目经理 + 执行员”的组合。

模型像项目经理：

- 它读任务。
- 它判断下一步应该做什么。
- 它说：“我要读文件”“我要写文件”“我要跑命令”。

Python 程序像执行员：

- 它检查模型提出的工具调用是不是合法。
- 它真的去读文件、写文件、跑 shell。
- 它把结果记录下来，再交给模型继续判断。

所以重点不是“模型变成了电脑操作系统”，而是：

```text
模型负责决策，程序负责执行，history 负责记忆。
```

## 五件套总览

### 1. 主循环 loop

位置：[minimal_swe_agent.py](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:369)

主循环就是 agent 的心跳。

普通聊天通常是：

```text
问模型一次 -> 模型回答 -> 结束
```

agent 是：

```text
问模型 -> 模型要工具 -> 执行工具 -> 把结果给模型
-> 模型再判断 -> 可能继续要工具 -> 最后总结
```

如果没有 loop，模型最多只能说“我想运行 ls”，但没法看到 `ls` 的结果，也没法继续下一步。

### 2. 上下文管理 context

位置：[minimal_swe_agent.py](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:135)

模型每次 API 调用本质上都是“失忆”的。它能记住前面发生了什么，是因为我们把
history 重新传给它。

history 里会放：

- 用户最初的任务
- 模型上一次说的话
- 模型上一次提出的工具调用
- 工具真实执行后的结果

如果 history 无限增长，请求会越来越大。所以 `compact_context()` 会在太长时优先丢
旧的工具结果，因为命令输出、文件内容通常最占空间。

### 3. prompt 拼接

位置：[minimal_swe_agent.py](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:155)

`build_prompt()` 做的事是把三类东西合成一次模型请求：

- `SYSTEM_PROMPT`：告诉模型身份、规则、工作目录、安全要求。
- `history`：到目前为止发生过什么。
- `TOOLS`：模型可以调用哪些工具，以及每个工具需要什么参数。

这一步是教学重点，因为 agent 没有魔法。你可以直接 dump 出模型实际收到的东西：

```bash
python3 minimal_swe_agent.py --dump-prompt --dry-run "List files and summarize."
```

DeepSeek 版：

```bash
python3 minimal_swe_agent.py --provider deepseek --dump-prompt --dry-run "List files and summarize."
```

看懂这个 dump，你就已经摸到 agent 的骨架了。

### 4. output parser

OpenAI Responses 解析位置：
[extract_function_calls()](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:211)

DeepSeek Chat Completions 解析位置：
[extract_chat_tool_calls()](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:231)

模型输出如果只是普通文字，就不能直接变成本地动作。比如模型说：

```text
我想运行 ls
```

这对程序来说不够可靠。程序需要结构化数据：

```json
{"name": "run_shell", "arguments": {"command": "ls"}}
```

function calling 的意义就是让模型以结构化方式说：“我要调用哪个函数，参数是什么。”

项目里还保留了一个 XML 文本协议 parser：

```xml
<tool name="read_file">{"path":"notes.txt"}</tool>
```

它是教学对照：让你看到，如果没有 API 原生 function calling，我们就得自己写这种解析器。

### 5. executor

位置：[minimal_swe_agent.py](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:333)

executor 是真正“动手”的地方。

当前只有三个工具：

- `read_file`：读 `workspace/` 里的文件
- `write_file`：写 `workspace/` 里的文件
- `run_shell`：在 `workspace/` 里跑 shell 命令

注意安全边界：模型只能提出请求，真正执行前必须经过 executor。路径也会被锁在：

```text
/Users/karasuakamatsu/agent-lab/workspace
```

如果模型试图读：

```text
../secret.txt
```

路径检查会拒绝，因为它逃出了 workspace。

## OpenAI 和 DeepSeek 的区别

这个项目现在支持两个 provider：

```bash
python3 minimal_swe_agent.py --provider openai ...
python3 minimal_swe_agent.py --provider deepseek ...
```

它们的 agent 内核一样，不同的是 API 方言。

OpenAI Responses 更像：

```python
client.responses.create(...)
```

DeepSeek 使用 OpenAI-compatible Chat Completions：

```python
client.chat.completions.create(...)
```

所以代码里有一个 provider boundary：

位置：[call_llm()](/Users/karasuakamatsu/agent-lab/minimal_swe_agent.py:190)

你可以这样理解：

```text
agent 内核 = 人类任务、history、工具、loop、executor
provider 适配层 = 把同一套意思翻译成不同模型 API 听得懂的格式
```

DeepSeek 还有一个“thinking mode”。为了教学清楚，代码默认关闭 thinking：

```python
"extra_body": {"thinking": {"type": "disabled"}}
```

原因是：先看懂普通工具循环，再研究 reasoning 内容回传。否则第一课会太绕。

## 一轮完整运行长什么样

假设你输入：

```bash
python3 minimal_swe_agent.py --provider deepseek "List files and summarize."
```

程序会这样跑：

1. `parse_args()` 读到任务和 provider。
2. `run_agent()` 创建第一条 history：用户任务。
3. `build_prompt()` 拼出请求：system prompt + history + tools。
4. `call_llm()` 调 DeepSeek。
5. DeepSeek 返回：我想调用 `run_shell`，参数是 `ls`。
6. `extract_chat_tool_calls()` 把这个工具调用解析出来。
7. `execute_tool()` 真正在 workspace 里运行 `ls`。
8. 程序把命令结果追加成 `role=tool` 的消息。
9. loop 进入下一轮，把结果再次发给 DeepSeek。
10. DeepSeek 看到 `ls` 结果，最后生成总结，不再调工具。
11. loop 发现没有工具调用，于是打印最终回答并退出。

## 怎么本地跑

先安装依赖：

```bash
cd /Users/karasuakamatsu/agent-lab
python3 -m pip install --upgrade -r requirements.txt
```

OpenAI：

```bash
export OPENAI_API_KEY=...
python3 minimal_swe_agent.py "List the current directory files and summarize them."
```

DeepSeek：

```bash
read -s DEEPSEEK_API_KEY
export DEEPSEEK_API_KEY
python3 minimal_swe_agent.py --provider deepseek "List the current directory files and summarize them."
```

如果你只想看 prompt，不想真实调用模型：

```bash
python3 minimal_swe_agent.py --provider deepseek --dump-prompt --dry-run "List files."
```

## 读代码顺序建议

不要从第一行一路硬啃。按这个顺序读更顺：

1. 先读 `SYSTEM_PROMPT`：看模型被要求扮演什么角色。
2. 再读 `TOOLS`：看模型被允许调用什么。
3. 再读 `run_agent()`：看主循环。
4. 再读 `build_prompt()`：看一次请求怎么拼出来。
5. 再读 `call_llm()`：看 OpenAI / DeepSeek 差异被隔离在哪里。
6. 再读 parser：看模型输出怎么变成工具调用。
7. 最后读 executor：看真实动作在哪里发生。

## 最重要的理解

agent 不是一个神秘生物。它就是一个循环：

```text
模型给计划 -> 程序执行 -> 结果回填 -> 模型再计划
```

如果你以后负责人类逻辑，而让 AI 负责写代码，那么你真正要掌握的是：

- 任务如何被拆成下一步动作
- 哪些动作应该交给工具执行
- 工具结果怎样改变下一步判断
- 哪些边界必须由程序硬性保护

代码只是把这套逻辑写成机器能运行的形式。
