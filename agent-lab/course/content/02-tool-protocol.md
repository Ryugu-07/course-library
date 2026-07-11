# 第 02 章 · 消息与工具调用协议

> 本章目标：理解模型与程序之间交换的不是“感觉”，而是一组有类型、有顺序要求的数据包。Provider 可以不同，Agent 的逻辑契约必须稳定。

## 1. 消息是 Agent 的总线

一次 Agent 请求通常包含系统规则、历史消息和工具定义。响应可能是自然语言，也可能是结构化工具调用。宿主执行工具后，还必须用调用编号把结果准确接回原来的请求。这个编号相当于快递单号：同一轮并行调用多个工具时，没有 call id 就无法知道哪份结果属于哪个动作。

常见消息角色有 user、assistant 和 tool，但不同 API 的外壳不同。OpenAI Responses 使用 function_call 与 function_call_output；DeepSeek 的兼容接口使用 assistant.tool_calls 和 role=tool；Anthropic Messages 使用 tool_use 与 tool_result 内容块。不要把这些字段名误认为三种不同 Agent，它们只是三种协议方言。

## 2. 工具定义为什么需要 JSON Schema

工具不是只有名称。模型需要知道用途、参数类型、必填项和限制。例如 read_file 的 path 必须是字符串；search_text 的 query 必填，max_results 应有上限。Schema 同时服务三个对象：

1. 模型据此选择并填写参数；
2. Runtime 据此验证模型输出；
3. 人类据此审查工具暴露了什么能力。

~~~json
{
  "name": "search_text",
  "description": "Search text inside the workspace",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {"type": "string"},
      "max_results": {"type": "integer", "minimum": 1, "maximum": 100}
    },
    "required": ["query"]
  }
}
~~~

工具说明写得含糊，模型就会误用；参数无限制，Executor 就可能收到巨大或危险请求；返回值没有稳定格式，下一轮模型会浪费上下文解析噪声。

## 3. 一次完整握手

工具调用不是“一发一收”，而是至少四步：

| 步骤 | 谁发送 | 数据含义 |
|---|---|---|
| 1 | Runtime → 模型 | 用户目标、历史、工具目录 |
| 2 | 模型 → Runtime | 工具名、参数、call id |
| 3 | Runtime → Executor | 通过校验的真实动作 |
| 4 | Runtime → 模型 | 与 call id 配对的结果或错误 |

模型收到工具结果后可能继续调用另一个工具，也可能生成最终回答。因此 parser 的任务不只是“解析 JSON”，还要区分文本、单个调用、并行调用、拒绝和不完整响应。

## 4. Provider 边界怎样设计

Agent 内核最好只认识统一对象：

~~~python
ToolCall(
    call_id="call_01",
    name="read_file",
    arguments={"path": "README.md"},
)
~~~

Provider adapter 负责把各家响应转换成 ToolCall，也负责把统一 history 转回各家请求格式。这样更换模型时，不需要改 Executor、权限、重试和验证。真正稳定的是内部协议，不是某个供应商当前的字段名。

适配层还要处理流式事件、参数 JSON 解析失败、模型没有返回 call id、并行调用顺序以及 API 重试。不要把 Provider SDK 对象直接散布到整个代码库，否则所有模块都会与一家 API 耦合。

## 5. 最常见的协议故障

<div class="failure-case"><strong>孤儿工具结果：</strong>Runtime 回填了 tool_result，却没有对应 tool_use。API 会拒绝，或者模型无法理解结果来源。</div>

其他常见故障包括：arguments 是 JSON 字符串却被当作字典；模型同时返回文本和工具调用但 parser 只保留一边；重试 API 时重复执行了已经成功的真实工具；工具异常被吞掉，只回填空字符串。

解决思路是把每个模型响应保存成可检查事件，并为协议转换写小型离线测试。你不需要真的调用 API，也能用固定样本验证 extract_tool_calls 和 append_tool_result。

## 6. 本章检查

看到任何 Provider 示例时，先寻找三样东西：工具目录怎样声明、调用意图怎样表达、执行结果怎样与原调用配对。字段名可以忘，三段逻辑不能忘。

!!! note "对应实验"
    实验 02 会让你切换 OpenAI、DeepSeek 与 Anthropic 数据包。注意每次切换时，哪部分只是包装变化，哪部分是 Agent 不可缺少的逻辑。

