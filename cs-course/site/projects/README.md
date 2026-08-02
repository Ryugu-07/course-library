# CS Course 大项目索引

这里存放可下发给学生的**教师版大项目说明书**：教师给出问题边界、接口、公开契约和验收分层，学生分阶段完成核心实现、测试与设计报告。脚手架中的 `TODO`/`NotImplemented` 是有意保留的教学边界，不是仓库缺陷。

| 编号 | 项目 | 主题 | 状态 |
|---|---|---|---|
| P01 | [xv6 内核实验全套](P01-xv6-kernel/README.md) | 页表、系统调用、进程、锁、文件系统、mmap | 本目录已提供教师版资产 |
| P02 | [从零关系型数据库](P02-relational-db/README.md) | 页式存储、索引、SQL 子集、MVCC、WAL 恢复 | 本目录已提供教师版资产 |
| P03 | [分布式 KV 存储](P03-distributed-kv/README.md) | Raft、线性一致读写、分片与迁移 | 本目录已提供教师版资产 |
| P04 | [编译器后端](P04-compiler-backend/README.md) | IR、SSA、寄存器分配、窥孔优化 | 本目录已提供教师版资产 |
| P05 | [迷你 TCP](P05-mini-tcp/README.md) | 滑动窗口、重传、拥塞控制 | 本目录已提供教师版资产 |
| P06 | [性能工程 100×](P06-performance-100x/README.md) | 基线分析、优化、性能证据 | 本目录已提供教师版资产 |
| P07 | [迷你推理引擎](P07-mini-inference/README.md) | KV cache、连续批处理、量化 | 本目录已提供教师版资产 |

## 统一下发约定

- 每个项目的 `README.md` 是教师发放入口；`rubric.md` 是可复制到评分表的细则，`DESIGN.md` 是学生设计报告模板。
- `starter/` 只包含接口、数据模型、协议/fixture 适配和可运行驱动。核心算法故意以 `TODO` 或 `NotImplemented` 留给学生。
- `tests/scaffold/` 和 `scripts/verify_scaffold.py` 检查“作业包是否完整”，应在未完成脚手架上通过；`acceptance/` 记录学生完成实现后才运行的验收契约。
- 统一 rubric：功能正确性 40%，边界/故障测试 25%，性能或资源指标 15%，代码结构与文档 10%，实验报告与设计反思 10%。项目若因平台条件调整性能分，必须在发放前写入项目 README。
