# 实验总表 · 上机地图

> 计算机的知识一半在键盘上。本表是全站动手清单。两类：**★ 本站已写**（`labs/` 下可直接跑的小实验）与 **📋 大 project**（第二档课程作业）。大 project 的目标不是把答案交给学生，而是给出教师版说明书：目标、阶段、接口、测试、评分与可选挑战；实现留给学习者分阶段完成。

## 分工与运行约定

- **Mac（主力）**：C/Python/Rust 的 shell、malloc、缓存分块、解释器、B+ 树、Raft 选主、SIMD 等——`labs/` 下每个子目录一个 `README` + 源码 + `make run` 或运行命令。
- **Win 4060 Ti（CUDA/大 project）**：`gpu-*` 的核函数系列、需要 GPU 或长时间跑的实验。课程侧提供脚手架、运行命令与验收脚本；学生按阶段在目标机器上实现和测试。
- **凡标 📋 的**：对应讲义页末尾给出 **课程作业说明书**（学习目标 / 阶段拆解 / 给定接口 / 学生任务边界 / 验收测试 / 评分 Rubric / 对标原课作业）。这些是教师视角的项目设计，不是替学生完成实现。

## 大 Project 教学约定

每个大 project 都按同一套课程作业格式组织：

- **教师提供**：问题背景、推荐脚手架目录、公开测试、故障注入或 benchmark harness、阅读提示、常见坑提示。
- **学生实现**：核心算法与系统逻辑、必要的数据结构、测试补充、实验报告；不得直接照搬生产系统源码或完整参考解。
- **验收分层**：功能正确性 40%，边界/故障测试 25%，性能或资源指标 15%，代码结构与文档 10%，实验报告与设计反思 10%。
- **交付物**：源码、`README`、测试日志、设计报告（2-6 页，说明取舍、失败案例、性能数字）。

## ★ 本站已写的可运行实验

| 编号 | 实验 | 语言/机器 | 对应讲义 | 教学点 |
|---|---|---|---|---|
| L01 | [缓存分块矩阵乘法（naive vs blocked vs 转置）实测加速比](labs/L01-cache-blocking/README.md) | C / Mac | csapp-02、perf-02 | 存储层级不是抽象——同一算法差 10× |
| L02 | [手写 shell（fork/exec/pipe/重定向/后台作业）](labs/L02-shell/README.md) | C / Mac | os-01 | 进程控制系统调用的肌肉记忆 |
| L03 | [显式空闲链表 malloc（首次适配 + 合并 + 边界标记）](labs/L03-malloc/README.md) | C / Mac | csapp-04 | 堆的真实模样 |
| L04 | [Tree-walk 解释器（一门小语言：词法→Pratt 解析→求值→闭包）](labs/L04-interpreter/README.md) | Python / Mac | comp-01/02 | 编译前端全流程最小可运行 |
| L05 | [B+ 树（插入/分裂/范围扫描）](labs/L05-bplustree/README.md) | Python / Mac | db-01 | 数据库索引的心脏 |
| L06 | [Raft 选主 + 日志复制（单机离散时钟模拟网络）](labs/L06-raft/README.md) | Python / Mac | dist-02 | 共识不再是黑盒 |
| L07 | [SIMD 与自动向量化对照（点积：标量 / 编译器向量化 / 手写 intrinsics）](labs/L07-simd/README.md) | C / Mac | perf-01、par-01 | Roofline 的实感 |
| L08 | [CUDA reduction + scan 优化阶梯（naive→shared→warp shuffle）](labs/L08-cuda-reduce/README.md) | CUDA / Win | gpu-01/02 | GPU 内存层级与并行原语 |
| L09 | [玩具 attention kernel（tiling + softmax 数值稳定）](labs/L09-attention/README.md) | CUDA / Win | gpu-02、mlsys-02 | FlashAttention 的最小内核直觉 |
| L10 | [无锁栈（CAS + ABA 演示 + 内存序）](labs/L10-lockfree/README.md) | C++ / Mac | par-02 | 并发的深水区 |
| L11 | [Rust 所有权谜题集（借用检查器为什么拒绝 + 如何改）](labs/L11-rust-ownership/README.md) | Rust / Mac | rust-01 | 把编译错误读成设计信号 |
| L12 | [从 socket 到 HTTP：极简 HTTP/1.1 服务器（keep-alive + 分块）](labs/L12-http-server/README.md) | Python / Mac | net-02、web-02 | Medusa 后端下面那层 |

## 📋 大 project 课程作业（教师版说明书）

| 编号 | Project | 对标原课 | 讲义页给出的说明书 |
|---|---|---|---|
| P01 | xv6 内核实验全套（页表 / 系统调用 / 锁 / 文件系统 / mmap） | MIT 6.S081 | os-01/02/03 页末分阶段作业说明书 |
| P02 | 从零关系型数据库（存储引擎 + SQL 子集 + MVCC + WAL 恢复） | CMU 15-445 | db-01/02/03 三页累进作业说明书 |
| P03 | 分布式 KV 存储（Raft + 分片 + 线性一致读） | MIT 6.824 | dist-02/03 页末作业说明书 |
| P04 | 编译器后端（IR + SSA + 寄存器分配 + 窥孔优化） | Stanford CS143 后半 | comp-03 页末作业说明书 |
| P05 | 迷你 TCP（用户态可靠传输：滑动窗口 + 重传 + 拥塞） | Stanford CS144 | net-01 页末作业说明书 |
| P06 | 性能工程终极题（把一个基线程序优化 100×） | MIT 6.172 | perf-02 页末作业说明书 |
| P07 | 迷你推理引擎（KV cache + 连续批处理 + 量化） | MLSys 课群 | mlsys-02 页末作业说明书 |

## 读法建议

讲义先行、实验随后。每读完一条线的核心页，去跑对应的 ★ 实验，原理会从"看过"变成"做过"。📋 大 project 作为长周期课程作业使用：先读说明书和评分标准，再按阶段做设计、实现、测试和报告。

---

*返回 [课程地图](index.html)，或从理论线第一页开始。*
