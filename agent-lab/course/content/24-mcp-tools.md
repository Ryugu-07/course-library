# 第 24 章 · MCP 与外部系统

> 本章目标：理解 MCP 怎样把外部工具与上下文接入 Agent，以及连接、认证、输出治理和副作用审批分别由谁负责。

## 1. MCP 解决 M × N 接入

没有标准协议时，每个 Agent 客户端都要为 GitHub、Figma、数据库和内部服务写专用适配器。MCP 让能力提供方实现 Server，Agent 宿主实现 Client，从而把组合成本从 M × N 降到 M + N。

MCP 不替代 Agent loop。它只是标准化外部能力如何被发现和调用。

## 2. 三类能力

MCP Server 可以暴露：

- Tools：模型可调用的动作；
- Resources：客户端或模型可读取的数据；
- Prompts：可复用提示模板。

读取 issue 是工具还是资源取决于交互设计；创建 issue 明显是有副作用工具。Server 应提供清楚描述和输入 schema，Client 仍需权限与审批。

## 3. 传输与生命周期

本地 Server 常通过 stdio 作为子进程运行，远程 Server 使用 HTTP。Client 负责启动或连接、初始化能力、列出工具、处理超时、关闭进程和认证状态。

Server 不应在任务结束后成为残留进程。远程连接需要重连与 OAuth 刷新，错误要归一化为 Agent 能理解的观察。

## 4. 工具发现的上下文成本

几十个 MCP Server 可能暴露几百个工具，完整 schema 会占用大量上下文。Client 可以只注入工具名和简述，需要时通过 tool search 加载详细定义。还可以把专用 Server 只配置给相关子 Agent。

MCP 输出也需要大小限制。数据库查询或文档搜索可能返回数万 tokens，应分页、截断并提供资源引用。

## 5. 信任与认证

安装 Server 之前审查来源、命令、网络和工具清单。API key 与 OAuth token 由宿主凭据层管理，不放进模型。企业环境可设置 Server allowlist、工具 denylist 和受管配置。

远程工具声明 read-only 或 destructive 有助于审批，但 Client 不能完全信任自我标注。高风险动作根据实际语义和目标服务再次检查。

## 6. Skill + MCP

MCP 提供手脚，Skill 提供工作方法。例如“处理设计稿”Skill 说明先读取组件规范、再调用 Figma 工具、生成代码、最后浏览器验证。没有 Skill，模型只有一堆工具；没有 MCP，Skill 只能描述却无法接触外部系统。

!!! danger "外部内容仍不可信"
    MCP 返回的 issue、文档和网页可能包含提示词注入。协议标准化了连接，不自动解决内容安全。最小权限、来源标记和副作用审批仍然必要。

