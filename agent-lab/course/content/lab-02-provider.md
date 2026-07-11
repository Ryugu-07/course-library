# 实验 02 · 三种 Provider 数据包检查器

> 对应第 02 章。本实验使用同一项逻辑任务，对比 OpenAI Responses、DeepSeek Chat Completions 与 Anthropic Messages 的请求、工具意图和结果回填。

## 1. 实验问题

更换模型供应商时，初学者容易重写整个 Agent。其实需要变化的是 Provider adapter：消息字段、工具 schema 包装、调用对象和工具结果格式。Executor、workspace、权限和完成条件都不应认识供应商 SDK。

先写下你认为三种协议一定共同拥有的字段。然后切换 Provider，检查 call id、工具名、参数和结果分别藏在哪里。

## 2. 检查数据包

<div class="lab-shell" data-lab="provider"></div>

示例使用通用模型占位符，避免把课程绑在某个会变化的具体型号。关注协议结构，不要把 model 字符串当成本实验重点。

## 3. 共同不变量

三种格式都必须表达：

- 给模型的任务和系统约束；
- 可用工具与输入 schema；
- 模型选择的工具名称和参数；
- 唯一调用编号；
- 宿主执行后的结果；
- 结果与原调用的配对关系。

如果内部 ToolCall 数据类能表达这些信息，Provider adapter 就能把外部格式转成统一事件。AgentState 只保存统一事件，恢复和评测也不会依赖一家 API。

## 4. 故障注入

手动想象四个坏样本：arguments 不是合法 JSON；call id 缺失；一个响应包含两个工具调用；API 在返回调用后连接中断。分别判断错误应由 parser、Runtime、Executor 还是幂等层处理。

不要把解析失败直接转成空调用并让模型生成最终回答。协议错误必须可见，否则 Agent 可能在从未执行工具的情况下宣布完成。

## 5. 改造挑战

给当前项目增加 Provider 抽象测试：准备三份固定响应样本，断言 extract_calls 都返回相同 ToolCall。再准备统一 ToolResult，断言三种 append_result 生成各自正确格式。整个测试不需要 API key。

实验完成的标准不是记住字段名，而是能用一句话说明：API 方言可以变化，内部调用契约与执行安全边界保持不变。

