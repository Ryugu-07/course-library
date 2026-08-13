# 第 11 讲 · 软件与环境安装：先固定环境，再诊断差异

> 工具、版本、接口和硬件会随项目与平台变化。本讲不把某个操作系统、设备、模型型号或价格当作默认答案，而是建立一份可复核的环境契约：项目声明什么、当前终端选择什么、每一层证据如何通过，以及安全问题为什么不能被“能运行”掩盖。

<div data-learning-page></div>

<section class="learning-layer" aria-labelledby="environment-learning-title">
<h2 id="environment-learning-title">学习层：works in one terminal, fails in another</h2>

<div class="learning-puzzle">
<h3>具体谜题：同一项目为什么只在一个终端成功？</h3>
<p>终端甲可以启动项目，终端乙却报错。两边都显示“安装过依赖”，但它们可能读了不同的项目元数据、解释器、隔离目录、可选后端、网络 endpoint 或凭据 scope。请先不要重装一切：诊断的任务是找出<strong>按顺序最早不能成立的层</strong>，并把可复现性与安全性分成两本账。</p>
<p>本 lab 的数据全部虚构，不连接网络、不读取环境变量，也不包含任何真实 key。它把“works in one terminal, fails in another”压缩成六个情境，方便练习证据顺序。</p>
</div>

<div class="learning-prediction">
<h3>先做预测，再 reveal</h3>
<p>选一个情境后，先预测三件事：<strong>①</strong> 哪一层最先需要解释；<strong>②</strong> 可复现性是 <code>READY</code> 还是 <code>REVISE</code>；<strong>③</strong> 安全门是 <code>READY</code> 还是 <code>BLOCKED</code>。最后才打开 ordered evidence ledger。</p>
<ul>
<li>runtime 选错、全局包 ghost dependency、endpoint 不一致，先影响可复现性，通常得到 <code>REVISE</code>；</li>
<li>缺少可选 accelerator 但 CPU fallback 满足项目契约时，可以是 <code>READY</code>，同时记录性能边界；GPU 不是默认必需条件；</li>
<li>发现 secret 已进入日志、截图、源码或 shell history 时，安全门必须是 <code>BLOCKED</code>，即使环境本身仍然可复现；</li>
<li>“包安装成功”只说明安装步骤完成，不证明当前解释器能 import，更不证明 endpoint/API smoke test 成功。</li>
</ul>
</div>

<div class="learning-model">
<h3>最小模型：九层诊断账本</h3>
<table>
<thead><tr><th>顺序</th><th>层</th><th>要核对什么</th><th>通过的含义</th></tr></thead>
<tbody>
<tr><td>1</td><td>项目 / lock 元数据</td><td>manifest、lock、runtime profile、endpoint profile 是否同一份项目声明</td><td>两终端有同一可追溯基线</td></tr>
<tr><td>2</td><td>selected interpreter / runtime</td><td>实际绝对路径、版本和启动器是否符合项目声明</td><td>不是只看终端提示符或系统默认值</td></tr>
<tr><td>3</td><td>隔离</td><td>环境前缀、site-packages、工作目录和全局包是否越过边界</td><td>依赖来自项目环境，不来自“碰巧装过”的全局目录</td></tr>
<tr><td>4</td><td>包 import</td><td>用选定 runtime 执行最小本地 import，并记录实际加载位置</td><td>当前环境能找到声明的包；不是安装记录的替代品</td></tr>
<tr><td>5</td><td>accelerator 兼容性</td><td>项目是否要求某 backend；缺失时是否有明确 CPU fallback</td><td>把“可运行”与“性能/后端要求”分开</td></tr>
<tr><td>6</td><td>endpoint / 网络</td><td>endpoint、解析、代理、TLS、超时和组织网络策略</td><td>远端路径与项目契约一致；本地 import 通过并不推出这一点</td></tr>
<tr><td>7</td><td>credential scope</td><td>凭据是否存在、作用域是否足够且不过宽</td><td>权限问题与网络问题有独立证据</td></tr>
<tr><td>8</td><td>secret 泄漏</td><td>源码、日志、截图、工件和 shell history 是否出现秘密</td><td>只记录“发现/未发现”，不回显 secret 值</td></tr>
<tr><td>9</td><td>最小 smoke test</td><td>用固定、最小、可审计的本地或安全远端测试验证真实目标</td><td>把 package、endpoint/API 和功能结果分开记录</td></tr>
</tbody>
</table>
</div>

<div class="learning-formal">
<h3>形式化步骤：每层只回答一个问题</h3>
<ol>
<li><strong>先冻结比较对象。</strong>记录项目目录、manifest/lock 摘要和允许的 runtime；两个终端必须比较同一提交或同一工作副本。</li>
<li><strong>再确认实际启动器。</strong>用所选 runtime 的路径与版本检查，而不是凭命令名、shell 提示符或 IDE 状态猜测。</li>
<li><strong>再确认隔离。</strong>检查 package search path 和环境前缀；全局包能让一个终端“偶然成功”，却不能成为项目依赖。</li>
<li><strong>然后做 import。</strong>用项目声明的解释器执行最小导入，并记下加载位置。安装器报告成功，不等于 import 成功。</li>
<li><strong>只在本地层通过后看 backend。</strong>缺 accelerator 时先问 fallback 是否满足任务契约；不要因为 GPU 缺失就把所有运行失败归因于硬件。</li>
<li><strong>再分离 endpoint 与 credential。</strong>endpoint/网络负责“能否到达正确服务”，credential scope 负责“权限是否合适”；两者都不能由包安装证明。</li>
<li><strong>安全检查可以阻断整条流程。</strong>一旦秘密泄漏，立即按已泄漏处理：撤销、轮换、清理可见副本并复核范围；诊断输出不得回显秘密。</li>
<li><strong>最后跑最小 smoke test。</strong>固定输入、固定断言、最少权限；本地 smoke 只证明本地路径，远端 smoke 才能在安全前提下证明 API 路径。</li>
</ol>
</div>

<div class="learning-boundary">
<h3>误区边界：READY、REVISE、BLOCKED 不是同一条轴</h3>
<ul>
<li><strong>可复现性 READY：</strong>项目声明、runtime、隔离、包层和必要的 endpoint/smoke 证据相互一致；仍应记录 CPU fallback 或性能限制。</li>
<li><strong>可复现性 REVISE：</strong>存在可修订的项目、runtime、依赖或 endpoint 差异。先改声明/环境，再重跑同一账本，不要凭“我这台能跑”签字。</li>
<li><strong>安全 BLOCKED：</strong>秘密曾被暴露，或 scope/处理方式不满足安全门。它不是“多装一个包”能修的；即使复现状态 READY，也必须先处置安全事件。</li>
<li><strong>GPU 不是安装证明：</strong>项目若只要求可运行，CPU fallback 可以满足 READY；若任务明确要求某 accelerator，则把它写入项目契约并单独验收。</li>
<li><strong>安装不等于 API 健康：</strong>安装记录、import、endpoint 连通性、凭据权限和真实最小调用分别有不同失败层，不能互相冒充。</li>
<li><strong>secret safety：</strong>key 是密码。不要把真实 secret 贴进代码、日志、截图或 shell history，也不要用回显 secret 的方式确认它是否存在；使用受控注入、最小权限和轮换流程。</li>
</ul>
</div>

<div class="learning-transfer">
<h3>把证据账本带回自己的项目</h3>
<p>项目初始化时写一份短契约：使用哪种 runtime、哪份 lock、隔离环境如何创建、哪些 accelerator 是必需/可选、endpoint 如何配置、凭据需要什么最小 scope、smoke test 的输入与通过条件是什么。出现“一个终端能跑、另一个不能”时，把两边的证据逐层并排记录；不要只复制一条“重新安装成功”的日志。</p>
<p>可用 runtime 自己的检查命令询问路径与版本，再用该 runtime 调用包管理器查询安装位置；具体命令随平台和项目而定。示意形式是 <code>&lt;runtime&gt; --version</code>、<code>&lt;runtime&gt; -c "print(runtime_path)"</code>、<code>&lt;runtime&gt; -m &lt;package-manager&gt; show &lt;package&gt;</code>。任何需要 secret 的命令都不应把真实值写在命令行参数里。</p>
</div>

<div class="learning-experiment">
<h3>交互实验：environment-doctor</h3>
<div class="learning-lab" data-learning-lab="environment-doctor">
<p><strong>无 JavaScript 时的静态读法：</strong>先按下表预测首个需要解释的层，再判断可复现性与安全门；动态结果会在三项预测完成后展开。</p>
<table>
<thead><tr><th>虚构情境</th><th>首个 issue</th><th>可复现性</th><th>安全门</th><th>最小动作</th></tr></thead>
<tbody>
<tr><td>错选 interpreter</td><td>selected interpreter / runtime</td><td>REVISE</td><td>READY</td><td>切换到项目声明的 runtime，记录路径与版本</td></tr>
<tr><td>global-package ghost dependency</td><td>项目 / lock 元数据</td><td>REVISE</td><td>READY</td><td>把真实依赖写入声明并重建隔离环境</td></tr>
<tr><td>missing accelerator backend with CPU fallback</td><td>accelerator 兼容性</td><td>READY</td><td>READY</td><td>记录 CPU fallback 与性能边界</td></tr>
<tr><td>exposed secret</td><td>secret 泄漏</td><td>READY</td><td>BLOCKED</td><td>撤销、轮换、清理并复核 scope；不回显值</td></tr>
<tr><td>endpoint issue</td><td>endpoint / 网络</td><td>REVISE</td><td>READY</td><td>核对 endpoint 与网络路径后重跑最小 smoke</td></tr>
<tr><td>healthy locked environment</td><td>全部层通过</td><td>READY</td><td>READY</td><td>保存 ledger，环境变更后重新诊断</td></tr>
</tbody>
</table>
<p>所有诊断文字、endpoint、scope 和结果都是 fictional teaching data；lab 不联网、不读取真实环境，也不显示任何 key。结果初始隐藏，预测错误也会打开同一份 ordered evidence ledger 供复盘。</p>
</div>
</div>
</section>

## 1. 工具链地图：按责任边界选择，而不是按品牌背型号

一个 AI 项目的工具链通常包含几类责任边界：

| 层 | 它解决什么 | 先留下什么证据 |
|---|---|---|
| 网页或桌面客户端 | 交互、文件输入与人工复核 | 产品入口、账号范围、数据处理规则 |
| API 调用 | 把模型能力接入程序 | endpoint、请求协议、超时、凭据 scope、最小 smoke |
| CLI / 编程智能体 | 读项目、改文件、跑检查 | 仓库版本、命令审批、文件/网络权限、测试日志 |
| IDE 集成 | 在编辑流程中提供辅助 | 插件权限、工作区范围、生成内容的审查方式 |
| 本地运行 | 离线、隐私或实验 | 权重/运行时来源、资源约束、后端选择、离线 smoke |

这些形态可以组合，但不共享同一个默认环境。客户端能登录，不代表本地 runtime 能 import；本地包能导入，也不代表远端 endpoint 或账号权限正确。选择工具时先写任务、数据边界和失败代价，再按当前项目文档确认安装入口与支持范围。

## 2. 创建可复现的项目环境

### 2.1 项目契约先于安装命令

在安装前确认项目是否已经声明：

1. 使用的语言 runtime / interpreter 及其选择方式；
2. 依赖清单与 lock 文件，以及生成它们的工具；
3. 隔离目录或环境前缀；
4. 必需与可选的 accelerator backend；
5. endpoint、代理和网络限制；
6. credential scope、secret 注入方式与撤销流程；
7. 不需要真实数据的最小 smoke test。

没有这些信息时，先问清楚或补一份项目 README；不要用系统全局包“试到能跑”为止。项目安装器、lock 文件和隔离环境的具体接口由项目选择，不能把一个平台的命令当成所有项目的通用答案。

### 2.2 隔离环境的中性示意

下面只展示概念顺序；runtime、激活方式和依赖文件名都应以项目声明为准：

```bash
<runtime> -m venv .venv
# 按当前 shell / 平台的项目说明激活 .venv
<runtime-in-venv> -m <package-manager> install --locked
<runtime-in-venv> -c "run the smallest local smoke test"
```

如果项目没有 `--locked` 这一类选项，不要臆造参数；查项目自己的安装说明。关键不是某个命令长什么样，而是“从声明安装、在隔离环境运行、用固定 smoke 验证”这三个证据都留下来。

## 3. API：把本地包层与远端服务层拆开

一个调用链至少有五个可独立失败的位置：代码能否启动、SDK/包能否 import、endpoint 是否正确可达、credential scope 是否允许该动作、服务响应是否满足最小断言。安装 SDK 只覆盖其中很小的一段。

教学或开发时可以使用项目提供的 secret manager、受控环境注入或本地忽略文件；`.env` 若被项目采用，应加入忽略规则并只保留占位模板。不要把真实 key 写入源代码、提交记录、日志、截图或命令行参数，也不要用 `echo` 把真实 key 写进 shell history。若怀疑泄漏，先撤销并轮换，再清理可见副本和审计范围；不要回显旧值来确认“它是不是那一个 key”。

真实调用的 endpoint、模型名、协议字段、配额和价格都应以当前服务文档与账户配置为准。本讲不把“兼容某种 API”推广成所有厂商都兼容，也不提供可执行的真实 endpoint 或 key；课堂实验使用 fictional diagnostics。

## 4. CLI agent 与 IDE：能力越大，确认边界越重要

CLI agent 可以读写项目、执行测试并根据结果继续行动；IDE 插件更贴近编辑器工作区。无论入口是什么，都应检查：

- 是否只授予当前仓库所需的文件权限；
- 安装、网络、删除、发布和凭据读取是否需要逐次确认；
- 工具输出是否被当作不可信数据而不是新的系统指令；
- 每次修改是否有 diff、测试和人工复核记录。

“自动化”不是跳过环境诊断和安全门的理由。一个 agent 在终端甲成功，也不证明终端乙拥有相同 runtime、lock、权限或网络策略。

## 5. 本地运行：先写资源契约，再谈后端

本地部署是否合适，取决于隐私、离线需求、资源预算、延迟、吞吐、模型/运行时支持和维护成本。不要把参数规模、量化占用、设备体验或云端能力写成固定等价关系；这些结果会受权重格式、上下文、并发、系统余量和实现变化影响，应在目标机器和当前构建上测量。

accelerator 是能力条件，不是安全或 API 健康的同义词。项目若声明 CPU fallback，缺少 GPU 可以是性能提示而不是阻断；项目若明确要求某后端，则把后端探测和性能 smoke 写成独立验收项。无论本地还是托管，最小 smoke 都要说明它测的是本地运算、服务连通性、权限，还是端到端结果。

## 6. 网络与账号：四个问题不要混答

遇到远端调用失败时，分别问：

1. 请求是否使用了项目声明的 endpoint 和协议；
2. 当前网络、代理、DNS、TLS 和组织策略是否允许路径通过；
3. credential 是否存在且 scope 足够、不过宽；
4. 最小请求是否真的得到预期响应，而不是只得到“包已安装”。

这些问题的修复动作不同。endpoint 错误不靠重装依赖解决；权限不足不靠安装 accelerator 解决；secret 泄漏则必须先进入安全处置流程。平台、地区、账户和组织政策可能不同，使用前应查看当前适用规则并遵守网络与服务条款。

## 本讲小结与安装清单

- 先固定项目 / lock 元数据，再确认实际 runtime、隔离、import、backend、endpoint、scope、secret 与 smoke；
- `READY` / `REVISE` 描述可复现性，`BLOCKED` 描述安全门，三者不能压成一个“能不能跑”；
- GPU 不是默认必需条件；CPU fallback 要记录性能边界；
- 包安装成功不等于 import 成功，更不等于 API 成功；
- 凭据按密码处理：最小 scope、安全注入、不要进入 shell history，疑似泄漏立即撤销和轮换；
- 工具、版本、价格、模型和硬件能力均以当前项目/服务文档与实测为准，不从旧快照外推。

**动手**：为一个不含真实 secret 的小项目写九层诊断表，先故意比较两个不同 runtime 或隔离目录，再用同一个最小 smoke test 重放。把每一层的证据、状态和最小动作记录下来；不要只保留最终“成功”截图。

---

*下一讲开始进入“用 AI 干活”的方法论：先讲怎么让它促进学习，而不是把答案直接交给你。*
