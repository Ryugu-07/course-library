# P02 · 从零关系型数据库（教师版）

> 本项目给出一个可下发的关系数据库作业包，不给出页格式、B+ 树、MVCC 或 WAL 的完整答案。`starter/` 只提供数据模型、协议、fixture 适配和可运行的场景驱动；核心实现由学生分阶段完成。

## 先修知识

- Python 3.9+（或经教师批准的等价语言）中的模块、异常、迭代器、文件 I/O 和 `unittest`；能读类型标注。
- 数据结构：数组/链表、哈希表、树、B+ 树、排序和基本复杂度分析。
- 操作系统的页、缓存、并发、文件写入和崩溃一致性；关系代数和基本 SQL。
- 能用 Git 分阶段提交，能从一个最小失败案例定位“语义错、持久化错还是性能错”。

## 学习目标

完成后，学生应能：

1. 把变长 tuple 放进固定大小页，解释 RID、槽目录、删除/更新和页空间的生命周期。
2. 设计缓冲池的 pin/unpin、dirty、淘汰和磁盘访问边界，并实现可持久化的 B+ 树索引。
3. 将受限 SQL 解析为 AST/关系代数/物理算子，保持迭代器语义和可观察的 `EXPLAIN`。
4. 用版本可见性或两阶段锁定义事务语义，明确提交点、冲突和垃圾版本回收。
5. 用 WAL 把日志先落盘、提交、redo/undo 和崩溃恢复串成可测试的端到端路径。

## 周期、组队与平台条件

- 建议周期：7 周，每周 6–10 小时；2–3 人一组。每人负责至少一个端到端阶段，并能独立解释一个故障。
- starter 与公共检查只依赖 Python 标准库，可在 macOS/Linux/Windows 运行；不要求 Docker、数据库服务器或第三方 SQL 包。
- 学生如果改用 C++/Rust，必须提供与本 README 相同语义的命令行适配器；教师可以只对 Python 参考 harness 执行公开/隐藏契约。
- 性能数据必须注明硬件、文件系统、Python/编译器版本和数据规模。Python starter 的结构验证通过，不代表数据库性能或事务正确性通过。

## 目录

```text
P02-relational-db/
├── README.md                         # 发放说明、阶段边界和统一验收
├── rubric.md                         # 可复制评分表
├── DESIGN.md                         # 学生设计报告模板
├── starter/
│   ├── protocol.py                   # 页、RID、tuple、事务、WAL 数据模型与接口
│   ├── sql_ast.py                    # SQL 子集 AST 和解析器接口（留 TODO）
│   ├── driver.py                     # 读取 fixture、展示契约，不执行核心数据库
│   └── __init__.py
├── fixtures/
│   ├── contract_scenarios.json       # schema / 操作 / 期望语义
│   └── recovery_faults.json          # MVCC、WAL、buffer 边界/故障
├── tests/scaffold/test_scaffold.py   # 作业包结构和驱动检查，应该通过
├── acceptance/                       # 学生实现后的公开/隐藏验收说明
└── scripts/verify_scaffold.py        # 未完成 starter 也 exit 0
```

## 五个里程碑与学生任务边界

### M1 · 页式存储与 tuple（第 1–2 周）

- 教师提供固定页大小、`PageId`/`RID`/tuple 字段约定、随机插入/删除生成器和重启前后对照命令。
- 学生实现堆文件、槽目录、变长行的 insert/delete/update/get，并说明 RID 在删除、移动和重启后的语义。
- 允许实现页内布局和校验；不得把所有 tuple 放进一个 Python dict 再“导出”成页面，也不得更改公开字段编码而不更新设计报告。

### M2 · 缓冲池与持久化 B+ 树（第 2–3 周）

- 教师提供 pin/unpin、dirty、固定容量、崩溃/重启 fixture 和随机键序列；不提供分裂/合并代码。
- 学生实现缓冲池淘汰（LRU/Clock 等）、页读写边界、B+ 树查找/范围扫描、分裂/合并和重启后的索引一致性。
- 所有磁盘访问必须经过缓冲池；叶子链必须有序；固定容量下所有 pinned 页不能被淘汰。学生需报告顺序扫和索引扫的测量方法。

### M3 · SQL 子集与执行器（第 3–4 周）

- 教师提供 SQL 子集语法、AST 字段名、TPC-H 风格小数据、20 条公开查询和 golden result。
- 学生实现 `SELECT/FROM/WHERE/JOIN/GROUP BY/ORDER BY/LIMIT` 的解析、关系算子 `SeqScan/IndexScan/Filter/Project/Sort/Join/Aggregate` 和可打印的逻辑/物理计划。
- 允许暂不支持 NULL，但必须在 README/报告明示；每个算子要能通过 `next()` 流式消费，不得对任意大小输入无条件全量读入内存。

### M4 · 事务与 MVCC/2PL（第 5–6 周）

- 教师提供事务 API、并发调度器、隔离异常历史和线程交错 fixture。
- 学生选择 MVCC 快照隔离或 2PL 可串行化路线，实现 begin/commit/abort、版本可见性或锁管理、冲突/死锁处理，并解释选择。
- 不能把“按测试顺序串行执行”当隔离实现；必须定义提交点、读自己的写、不可见版本、回滚后的索引/数据一致性。

### M5 · WAL 与崩溃恢复（第 6–7 周）

- 教师提供日志记录格式、可注入的日志序号、四类 crash point 和重启检查器；不提供 redo/undo 顺序的完整实现。
- 学生实现 WAL 追加/刷盘、commit record、恢复扫描、已提交 redo 和未提交 undo（或在所选恢复设计中给出等价证明）。
- 任何数据页写回前，对应日志必须已持久化；撕裂尾部、重复恢复、空日志和错误 checksum 必须有明确行为。最终把一条 SQL 从解析、索引访问、提交到恢复画成路径图。

## 给定接口契约

`starter/protocol.py` 的数据类和 Protocol 是公共边界，不是实现提示。字段名和异常类别可被教师验收调用：

| 接口 | 语义 | 学生必须保证 |
|---|---|---|
| `StorageEngine.fetch_page(page_id)` / `write_page(page_id, page)` | 页式持久化 | 页大小固定；未授权的绕过访问要可审计 |
| `StorageEngine.insert(table, tuple_data)` / `delete(rid)` | tuple 生命周期 | RID/槽目录、删除和重启语义一致 |
| `Index.range_scan(lower, upper)` | 有序索引扫描 | 边界包含性在 README 中声明，叶链不乱序 |
| `SqlExecutor.execute(QueryRequest)` | SQL 子集执行 | 结果列顺序、聚合、错误和 `EXPLAIN` 格式稳定 |
| `TransactionManager.begin/commit/abort` | 事务状态机 | 提交点唯一；异常/重复结束调用不能污染状态 |
| `Wal.recover(records)` | 崩溃后重建状态 | 先检查完整记录/提交状态，再 redo/undo；重复运行幂等 |

`starter/sql_ast.py` 中的 `parse_sql(sql)` 只声明 AST 入口并保留 `NotImplementedFeature`。学生可使用自己的 parser，但必须能导出等价 AST 或教师适配器。

## 运行与验收命令

脚手架状态下运行以下命令；它们不调用任何未实现的数据库核心路径：

```bash
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests/scaffold -v
python3 starter/driver.py --scenario fixtures/contract_scenarios.json
```

学生实现后，再按阶段运行 `acceptance/README.md` 中的公开测试，并由教师注入隐藏查询、随机页操作、并发历史和 crash point。验收至少包括：重启后表/索引一致、20 条公开 + 20 条隐藏 SQL、索引/顺序扫描对照、隔离异常、WAL 四类崩溃点。脚手架 CI 不执行这些学生专属验收，避免有意 TODO 造成失败。

## 故障与边界测试

`fixtures/recovery_faults.json` 描述机器可读故障，学生要将每个场景转成至少一个测试，并补充一个自选场景：

- buffer pool 容量小于同时 pinned 页数：必须拒绝/等待，不能随机覆盖 pinned 页。
- 变长 tuple 恰好跨槽目录边界、删除后插入复用空槽、重启时页 checksum 错误。
- B+ 树根分裂、合并到根收缩、重复键/空范围/半开范围。
- MVCC 写偏斜、读自己的写、长读快照期间并发更新、重复 commit/abort。
- WAL 在 data page 前、日志记录中间、commit 前、commit 后和脏页刷盘后崩溃；尾部撕裂不能被误当完整提交。

报告要区分“应返回明确错误”“应等待/重试”“应恢复到旧状态”和“应保留已提交结果”，不能只写“程序没有崩”。

## 统一 Rubric（100 分）

| 项目 | 权重 | 评分证据 |
|---|---:|---|
| 功能正确性 | 40% | 页/缓冲池/B+ 树、SQL、事务和恢复的公共/隐藏契约 |
| 边界/故障测试 | 25% | 随机操作、隔离历史、重复恢复、crash point、自写测试和诊断日志 |
| 性能或资源指标 | 15% | 索引 vs 顺序扫、join/聚合、缓存命中、日志写放大或内存峰值，均有基线 |
| 代码结构与文档 | 10% | 存储/执行/事务层分离、接口稳定、错误和资源生命周期说明 |
| 实验报告与设计反思 | 10% | 端到端路径、路线取舍、失败案例、测量方法和个人贡献 |

## 交付物

1. 可运行源代码和固定版本的运行说明；不得提交数据库文件、构建缓存或包含答案的私有 fixture。
2. 分阶段测试日志、公开测试之外的自写边界测试、性能基线与原始数据。
3. 2–6 页 `DESIGN.md` 报告：页布局、索引、执行计划、事务路线、WAL 恢复、端到端路径和失败分析。
4. 组员分工与代码 walkthrough；教师可随机指定一条 tuple 或一条日志记录要求解释生命周期。

## 学术诚信与协作

允许讨论关系代数、阅读教材/论文、审阅测试和引用数据库实现资料，但必须标注来源。禁止复制其他组、往届作业、网上完整解答或第三方数据库核心实现。生成式工具可用于解释错误或生成非核心测试，但若其影响提交代码/报告必须披露；学生必须能说明每个页格式、可见性判断和恢复决策。教师会使用等价的新历史和 crash point 检查独立理解。

## 可选挑战

- LRU-K 或 Clock-Pro，并在混合顺序扫/热点查询上给出可重复对照。
- 统计信息与小型代价优化器，选择 join 顺序和索引；或 vectorized scan。
- Serializable Snapshot Isolation、死锁等待图、VACUUM/版本回收。
- group commit、压缩 WAL、模糊测试页解析/恢复；挑战不得替代基础契约。

## 与讲义的关系

- [db-01 · 存储与索引](../../lectures/db-01-storage-index.md)：M1–M2。
- [db-02 · 查询执行与优化](../../lectures/db-02-query.md)：M3。
- [db-03 · 事务、MVCC 与恢复](../../lectures/db-03-transactions.md)：M4–M5。
- [os-02 · 并发与死锁](../../lectures/os-02-concurrency.md) 和 [os-03 · 文件系统日志](../../lectures/os-03-filesystem.md) 是事务/恢复的前置桥梁。讲义中的 P02-A/B/C 提供课程动机，本 README 统一成一份可发放作业。
