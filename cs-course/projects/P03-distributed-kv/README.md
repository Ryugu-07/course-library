# P03 · 分布式 KV 存储（教师版）

> 这是 Raft + 分片 KV 的课程作业边界，不是可运行的参考答案。`starter/` 提供消息/日志/配置/客户端数据模型、确定性传输预览器和 fixture；选举、日志复制、持久化、线性一致性和迁移协议均留给学生。

## 先修知识

- Python 3.9+ 标准库、面向对象、测试、序列化和确定性随机数；能读少量 Go/Rust/Python 网络模拟代码。
- 分布式故障模型、Lamport 时间/因果、CAP、一致性模型、RPC、复制状态机和 Raft 基本不变量。
- 哈希/分片、并发客户端、幂等请求、日志持久化；最好完成 P03 对应的 L06 Raft 小实验。
- 能用 Git 分阶段提交，并能从消息时间线解释“为什么这次读不能返回”。

## 学习目标

完成后，学生应能：

1. 把 Raft 的任期单调、日志匹配、已提交日志不丢写成状态机不变量和测试。
2. 在可控延迟、丢包、分区、崩溃重启下实现选举、日志复制、提交、apply、持久化和快照。
3. 把单 Raft 组变成幂等的 `Get/Put/Append` KV，处理 leader 变更、客户端重试和线性一致读。
4. 用 Raft 复制 shard controller 配置，实现 Join/Leave/Move/Query 和可解释的配置版本。
5. 设计分片迁移的 ownership/冻结/交接边界，在配置频繁变化和故障下做到不丢、不重、不双写。

## 周期、组队与平台条件

- 建议周期：8 周，每周 6–10 小时；2–3 人一组。阶段之间保留可运行的 commit，个人必须能解释一次丢包/分区故障。
- starter、确定性传输预览器和结构验收只依赖 Python 标准库，可在 macOS/Linux/Windows 运行；不要求真实多机、云服务或外部消息队列。
- 学生可用 Go/Rust/C++ 重写实现，但须提供等价的 JSON/RPC 适配器，接受同一份公开 fixture 和线性一致性历史。
- 本项目的网络和时钟是教学模拟器，不代表真实 TCP 超时、磁盘 fsync 或云平台故障语义；报告必须写出模拟器假设。性能结果不能把单进程模拟吞吐冒充生产系统指标。

## 目录

```text
P03-distributed-kv/
├── README.md                         # 发放说明、阶段边界和一致性约束
├── rubric.md                         # 可复制评分表
├── DESIGN.md                         # 学生设计报告模板
├── starter/
│   ├── protocol.py                   # Raft/KV/分片数据模型和 TODO 接口
│   ├── transport.py                  # 可运行的确定性消息队列/分区预览器
│   ├── driver.py                     # 读取 fixture 并演示网络事件，不运行 Raft 算法
│   └── __init__.py
├── fixtures/
│   ├── contract_scenarios.json       # 公开故障/边界事件序列
│   └── linearizability_history.json  # 公开历史与 checker 约定
├── tests/scaffold/test_scaffold.py   # 脚手架检查，应该通过
├── acceptance/                       # 学生实现后的分层验收
└── scripts/verify_scaffold.py        # 未完成 starter 也 exit 0
```

## 五个里程碑与学生任务边界

### M1 · 确定性网络与 Raft 状态边界（第 1 周）

- 教师提供离散 tick、消息 envelope、可控随机种子、分区/恢复/丢包注入和日志输出格式。
- 学生实现 follower/candidate/leader 状态、任期和投票规则；先在无丢包的 3 节点集群中验证不变量。
- starter 的 `DeterministicTransport` 只负责排队和分区预览，不包含选举/投票逻辑。学生不得让 KV 命令绕过 Raft 直接修改状态。

### M2 · 选举与日志复制（第 2–3 周）

- 教师提供 `RequestVote`/`AppendEntries`/心跳消息形状、apply channel 观察器和稳定/分区测试。
- 学生实现选举超时、任期降级、日志匹配、`nextIndex`/`matchIndex` 或等价机制、commit index 和 apply 顺序。
- 少数派分区不能提交；已提交条目在 leader 崩溃、新 leader 产生后不能丢失或改序。RPC handler 遇到更高任期必须立即降级。

### M3 · 持久化与快照（第 4 周）

- 教师提供 Persister 接口、崩溃重启脚本、快照大小/截断 fixture；不提供持久化顺序答案。
- 学生持久化 current term、vote、日志和快照元数据，实现重启恢复、日志截断和快照后的索引映射。
- 必须定义持久化点和应用点的顺序；不能以进程内全局变量假装崩溃后仍存在，也不能只保存最后状态而丢失可提交日志。

### M4 · 单组线性一致 KV（第 5–6 周）

- 教师提供 `Get/Put/Append` 客户端、客户端 ID/请求序号、leader 变更重试和线性一致性历史 checker。
- 学生把每次写放进 Raft 日志，实现状态机 apply、重复请求去重、旧 leader 错误、读索引/读屏障或等价的线性一致读路径。
- 同一请求重试不得重复 Append；读不能从未确认的 follower 直接返回“看起来新”的值。必须区分 NotLeader、Timeout、WrongGroup 等错误。

### M5 · shard controller 与迁移（第 7–8 周）

- 教师提供 `Join/Leave/Move/Query` 请求、配置版本、迁移故障注入和多客户端历史。
- 学生让配置变更本身进入 controller 的 Raft 日志；按配置路由 KV；实现旧组冻结/导出、新组导入/接管、重复迁移和配置跳跃的协议。
- 迁移期间一个 shard 不能由旧组和新组同时接受写入；导入数据、客户端去重表和 ownership 状态必须一并交接。读可继续或返回清晰的可重试错误，但不能静默返回旧组数据。

## 给定接口契约

`starter/protocol.py` 是语言中立设计的 Python 镜像；学生实现可换语言，但 JSON 字段和外部语义需保持等价：

| 契约 | 输入/输出 | 必须保持的语义 |
|---|---|---|
| `RaftNode.start(command)`（对应 `Start(command)`） | command → `(index, term, is_leader)` | 非 leader 不伪造提交；命令只能经日志进入状态机 |
| `RaftNode.tick(elapsed_ms)` / `receive(envelope)` | 离散时间和 RPC | 任期单调；更高任期立即降级；输出消息可重放/测试 |
| `ApplyMsg` | index、term、command 或 snapshot | 按 commit 顺序一次应用；快照和日志索引不混淆 |
| `Persister.save/restore` | 任期、投票、日志、快照 | 崩溃后只依赖持久化字节；恢复幂等 |
| `KVClient.request` | client/request ID、操作、key/value | 重试幂等；旧 leader/错误分片可明确重试 |
| `ShardConfig` / `ShardTransfer` | config number、ownership、数据+去重表 | 配置由共识序列化；迁移不丢、不重、不双写 |

`starter/protocol.py` 中 `RaftNode` 与 `TodoKV` 的核心方法会抛 `NotImplementedFeature`。`starter/transport.py` 的队列、分区和恢复是为了让教师/学生先观察事件；它不提供 Raft 算法答案。

## 运行与验收命令

脚手架状态下运行：

```bash
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests/scaffold -v
python3 starter/driver.py --scenario fixtures/contract_scenarios.json
```

学生实现后按 `acceptance/README.md` 分层运行：稳定网络选主/提交、少数派不提交、leader 崩溃、重启恢复、快照、重复 RPC、并发线性一致历史、Join/Leave/Move/Query 和迁移期间故障。脚手架 CI 不会直接调用 `RaftNode`/`TodoKV` 的 TODO 方法。

## 故障与边界测试

公开 fixture 至少涵盖：

- 5 节点被切成 3+2：多数派可以推进，少数派不能提交；恢复后日志按 Raft 规则收敛。
- leader 在 `Start` 后、commit 前崩溃；客户端重复发送同一 request ID，不应产生两次 Append。
- 更高任期 RPC、延迟旧心跳、空日志、日志冲突、快照后旧索引请求。
- controller 配置在迁移中再次变更；旧组/新组各自崩溃一次；导入消息重复或乱序。
- 线性一致性历史中的重叠读写、超时返回、WrongGroup/NotLeader 重试。

学生至少新增一个故障序列，并说明安全性（不能错）与活性（何时最终成功）的假设。不能只测“所有消息按顺序到达”的 happy path，也不能把最终一致当作线性一致的替代。

## 统一 Rubric（100 分）

| 项目 | 权重 | 评分证据 |
|---|---:|---|
| 功能正确性 | 40% | 选举、日志、提交/apply、持久化、KV 和配置/迁移契约 |
| 边界/故障测试 | 25% | 分区、崩溃、重复 RPC、旧 leader、快照、迁移和线性一致历史 |
| 性能或资源指标 | 15% | 消息/重试/日志增长、快照压缩、迁移流量、客户端延迟；有基线与模拟器条件 |
| 代码结构与文档 | 10% | Raft/KV/controller/transport 分层、状态机不变量、错误和重试语义 |
| 实验报告与设计反思 | 10% | 生命周期图、故障时间线、安全/活性取舍、失败案例和个人贡献 |

## 交付物

1. 可运行实现、配置和确定性测试命令；提交持久化/快照格式说明，清理生成日志和大文件。
2. 分阶段测试日志、至少一个公开 fixture 之外的故障历史、线性一致性 checker 输出。
3. 2–6 页 `DESIGN.md`：画出一次 `Put(k,v)` 经过客户端、分片路由、Raft 日志、apply、迁移的完整生命周期。
4. 组员分工、代码 walkthrough、模拟器假设（时钟、消息、磁盘）和可观察指标。

## 学术诚信与协作

允许阅读 Raft 论文、教材、MIT/CMU 课程材料，讨论不变量和测试设计，并在报告中引用。禁止复制其他组、往届作业、网上完整 Raft/KV 解答或让工具生成核心共识实现后不披露。工具可以协助画图、解释日志或生成非核心故障输入，但每位学生必须能手推任期/日志/迁移状态；教师会更换随机种子、消息顺序和故障点复核。

## 可选挑战

- Pre-vote、租约读/ReadIndex 对照，测线性一致性与延迟的取舍。
- 增量快照、日志压缩和流量/磁盘空间报告。
- 一致性哈希或带虚拟节点的 shard placement，并证明迁移量变化。
- 跨 shard 事务的 2PC/Saga 设计（只做设计或在基础契约完成后实现），说明它与 Raft 的故障边界。

## 与讲义的关系

- [dist-01 · 时间、一致性与 CAP](../../lectures/dist-01-time-consistency.md)：故障模型、CP 选择和线性一致语义。
- [dist-02 · 共识与 Raft](../../lectures/dist-02-consensus.md)：M1–M3，也是实验 L06 的扩展。
- [dist-03 · 分布式事务与分片案例](../../lectures/dist-03-transactions-cases.md)：M4–M5。
- [db-03 · 事务与恢复](../../lectures/db-03-transactions.md)：状态机、提交点和持久化的单机前置。讲义中的 P03-A/B 是课程动机，本 README 是统一发放版本。
