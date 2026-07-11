# agent-lab — 手搓 minimal SWE Agent（3.0 方向 2）

> 冷启动必读。本文件由 Claude(arch) 维护，记录项目状态与决策；实现方为 GPT/codex。

## 目标
教学用 minimal SWE agent：用户（应用数学背景，代码能力在提升）要**完全看懂逻辑**，不追求亲手写。验收标准 = 用户能复述每个模块"为什么这样设计"。推进要快，不钻牛角尖。

## 规格
见 `~/Downloads/spec_minimal_swe_agent_20260708.md`（实现前先读）。

## 当前状态
- 2026-07-08：立项，目录建立，spec 已出。
- 2026-07-08：GPT/Codex 已实现教学版 minimal SWE agent：`minimal_swe_agent.py` + `WALKTHROUGH.md`，待用户用自己的 `OPENAI_API_KEY` 跑 v0/v1 实测。
- 2026-07-08：已加入 DeepSeek 后端教学适配：`--provider deepseek`，读取 `DEEPSEEK_API_KEY`，本地 dry-run/self-test 已通过；未把用户 key 写入文件。
- 2026-07-08：补充中文教学讲解 `WALKTHROUGH.zh-CN.md`。
- 2026-07-09：按 `~/ai-course/site` 的博客教材形式，新增可读性更好的静态网页教学站：`site/index.html` + `site/assets/`。已用本地 HTTP 服务做桌面/手机视觉检查，修复流程图和代码块移动端横向溢出。
- 2026-07-10：教学站新增第二章 `site/extensions.html`，把 Agent 功能扩展整理为九部件设计公式、六个循环插入点、十个能力方向，以及验证、记忆、安全、多 Agent、Skills/MCP/Hooks 和分阶段升级路线。页面包含可编辑、浏览器本地保存和复制的功能设计卡实验。已验证模板切换、实时预览、保存恢复、复制、路线进度、两章导航和移动目录；桌面 1280px 与手机 390px 均无横向溢出或控制台错误。
- 2026-07-10：按用户反馈将概览版扩建为完整多页面课程 `site/course/`：7 阶段、30 章、8 个互动实验、2 个可运行项目，共 40 个 HTML 页面。课程源稿与生成器位于 `course/`，正文约 4.35 万非空白字符。八个实验已逐个验证状态变化；Mini Codex 与 Agent Team 的源文件和生成站下载副本均通过 self-test；1887 个站内链接/资源引用无缺失，桌面 1280px 与手机 390px 无横向溢出或页面控制台错误。当前本地服务使用 `http://127.0.0.1:8778/course/index.html`。

## 决策记录
- LLM 后端走用户 GPT key，留 provider 抽象（未来可换 DeepSeek）。
- 参考路线：Shunyu Yao 的 ReAct + SWE-agent 两篇论文先读。
- 核心五件套：loop 流程控制 / 上下文管理 / prompt 拼接 / output parser / executor（terminal 执行 + 读输出 + file I/O）。
- 实现保持单文件代码为主；`run_shell` 默认 y/n 确认，`--yolo` 可关闭确认。
- OpenAI Responses 与 DeepSeek Chat Completions 只是 API 方言不同；agent 内核仍是同一套 loop/context/prompt/parser/executor。
