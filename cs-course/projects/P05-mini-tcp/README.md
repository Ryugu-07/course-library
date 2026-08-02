# P05 迷你 TCP：用户态可靠传输与离散网络模拟

这是一个 6–8 周、2–3 人组队的大项目。学生在一个**离散事件、不可靠网络模拟器**上实现
可靠、有序、受流量控制并带拥塞控制的字节流协议。这里的 UDP/网络只是教学 harness；本项目
明确**不是 raw socket 生产 TCP，也不要求替换操作系统 TCP 栈**。

## 先修

- `net-01`：TCP/IP 分层、序号/确认、滑动窗口、AIMD 与慢启动；
- `os-01/02`：文件描述符、定时器、状态机和并发的基本概念；
- Python 3.10+、`dataclasses`、队列/堆和 `unittest`；
- 能用不变量描述“已发送未确认”“接收窗口”“下一个期望字节”。

## 目标

1. 把“可靠字节流”拆成分段、序号、累积 ACK、乱序重组和 EOF；
2. 在可控的丢包、重复、乱序、延迟网络上实现 RTO/重传和流量控制；
3. 用显式连接状态机处理握手、关闭、半关闭和 TIME_WAIT；
4. 实现慢启动、拥塞避免、超时退让，并用日志解释 cwnd 的变化；
5. 用参考 endpoint 和文件 checksum 证明实现不是只在 happy path 上工作。

## 周期与组队

建议 6–8 周，2–3 人一组；每周提交一个可回放的场景日志。个人项目必须保留同样的设计
审查、故障矩阵和抓包/事件分析记录。

## 目录

| 路径 | 内容 |
|---|---|
| `starter/packet.py` | Segment/packet JSON schema 与结构校验 |
| `starter/network.py` | 可注入丢包、重复、乱序、延迟和限速的离散网络接口 |
| `starter/protocol.py` | ByteStream、Sender、Receiver、Connection 的公开接口；核心方法 TODO |
| `starter/driver.py` | 读取网络 fixture 并回放一条最小 packet 事件 |
| `fixtures/loss_reorder.json` | 机器可读网络场景、载荷和测试 cases |
| `tests/test_scaffold.py` | 当前应通过的结构、schema、网络 harness 测试 |
| `acceptance/` | 学生实现后才开启的可靠传输验收，默认跳过 |
| `scripts/verify_scaffold.py` | 仅 Python 标准库的脚手架检查 |
| `DESIGN.md` / `rubric.md` | 设计报告模板与细化评分 |

## 里程碑

1. **M1 · ByteStream 与 packet（第 1 周）**：确定字节流 EOF/容量契约，完成 Segment 编解码、
   序号空间和 checksum/字段合法性测试。
2. **M2 · sender/receiver（第 2–3 周）**：分段、累积 ACK、乱序重组、重复包和接收窗口；
   在 0% 丢包、可乱序场景下与参考 endpoint 互通。
3. **M3 · 定时与重传（第 4 周）**：可注入时钟、RTO 估计、超时重传、重传去重；每个计时器
   都能在单元测试中推进，不读取真实 wall clock。
4. **M4 · 连接状态机（第 5 周）**：三次握手、四次挥手、半关闭、RST/错误和 TIME_WAIT，
   日志可说明每次状态转移原因。
5. **M5 · 流量/拥塞控制（第 6–7 周）**：同时服从接收窗口和 cwnd，完成慢启动/AIMD；
   输出吞吐、重传、RTT、cwnd/ssthresh 的时间序列。
6. **M6 · 互通与报告（第 8 周）**：0/10/30% 丢包、重复/乱序/长延迟混合测试，与参考
   endpoint 互通，提交故障矩阵和性能报告。

## 学生任务边界

教师提供 packet 字段约定、离散网络、事件回放、公开 fixture、参考黑盒 endpoint 的调用
边界和 checksum/文件校验规则。学生实现 ByteStream、sender/receiver、RTO/重传、连接
状态机、流量控制和拥塞控制；可替换数据结构但不可改变公开方法的语义。

不得调用真实网络、操作系统 TCP、第三方可靠传输库或把一个现成 TCP 实现改名提交。可以
使用 Python 标准库中的 `heapq`、`random`、`enum` 和日志工具。harness 的随机种子、时钟
和故障注入必须可复现。

## 给定接口契约

```python
@dataclass(frozen=True)
class Segment: ...

class ByteStream:
    def write(self, data: bytes) -> int: ...
    def read(self, limit: int = -1) -> bytes: ...

class Sender:
    def on_application_bytes(self, data: bytes) -> list[Segment]: ...
    def on_segment(self, segment: Segment) -> None: ...
    def on_tick(self, now: int) -> list[Segment]: ...

class Receiver:
    def on_segment(self, segment: Segment) -> list[Segment]: ...
    def read(self, limit: int = -1) -> bytes: ...

class Connection:
    def submit(self, data: bytes) -> None: ...
    def tick(self, now: int) -> list[Segment]: ...
    def receive(self, segment: Segment, now: int) -> list[Segment]: ...
```

`starter/network.py` 的 `DiscreteNetwork` 是教师提供的故障注入层，学生不得把它改成真实
套接字。发送端的有效发送量必须满足 `min(advertised_window, congestion_window)`；序号空间、
ACK 累积规则、timer 单调时间和连接状态转移应在 `DESIGN.md` 中明确。

## 运行与验收命令

在本项目目录执行：

```bash
python3 scripts/verify_scaffold.py
python3 -m unittest discover -s tests -v
python3 -m py_compile starter/*.py scripts/verify_scaffold.py tests/test_scaffold.py acceptance/test_student_acceptance.py
python3 starter/driver.py --fixture fixtures/loss_reorder.json
RUN_STUDENT_ACCEPTANCE=1 python3 -m unittest discover -s acceptance -v
```

前四条属于脚手架 CI，当前 TODO 也应通过；最后一条显式开启学生验收，在未实现 sender/
receiver 时预期失败。教师 CI 不应无条件执行该 job。

## 故障、边界与性能测试

公开层覆盖：0% 丢包、单包/空 payload、最大 payload、重复包、乱序包、ACK 过期、窗口为 0、
延迟大于 RTO、序号回绕、SYN/FIN 丢失、半关闭、RST 和连接取消。隐藏场景组合 10%/30% 丢包、
突发丢包、重复+乱序、ACK-only 包、带宽上限、长 RTT 和多个并发连接。

正确性必须用文件长度、字节 checksum、首个/最后一个序号和 receiver 输出对照，而不是只看
“连接最终关闭”。性能至少记录 goodput、总 ticks、重传数、峰值 in-flight、cwnd/ssthresh、
RTO/RTT；固定 seed，比较窗口大小和故障率，并解释吞吐/公平性的变化。

## Rubric（40/25/15/10/10）

| 项目 | 权重 | 评分要点 |
|---|---:|---|
| 功能正确性 | 40% | 字节流、分段、ACK、重组、重传、连接与拥塞控制的契约测试 |
| 故障与边界 | 25% | 丢包/乱序/重复/延迟/窗口为 0/回绕/关闭与错误路径 |
| 性能/资源 | 15% | goodput、ticks、重传率、cwnd/RTO 数据和可复现实验 |
| 结构与文档 | 10% | 层次边界、状态机、可观察日志、可注入时钟、测试组织 |
| 报告与反思 | 10% | 故障矩阵、抓包/事件分析、失败尝试、成员分工与限制 |

详见 [`rubric.md`](rubric.md)。

## 交付物

- 可在无网络权限环境运行的模拟协议实现；
- `README.md`、`DESIGN.md`、补充单元/场景测试和固定 seed 的事件日志；
- 2–6 页报告，包含状态机图、序号/窗口不变量、RTO/cwnd 曲线和至少一个失败案例；
- 0%、10%、30% 丢包/乱序矩阵、与参考 endpoint 的互通结果和运行环境。

## 学术诚信

可查阅 RFC、教材和课程讲义，必须注明引用。不得复制 Linux/BSD/QUIC/第三方可靠 UDP 的
实现、绕过故障注入、篡改参考 checksum、伪造丢包实验或伪造抓包日志。自动生成代码也必须
由提交者解释状态机和每个不变量。

## 平台条件

脚手架、离散网络和公开测试只需要 Python 3.10+ 标准库，Mac/Windows/Linux 均可。不要把
管理员权限、真实网卡、UDP 端口、root、特定内核 TCP 行为写入作业依赖。若选做实时可视化，
把它放在非必需的报告工具中。

## 可选挑战

- fast retransmit/fast recovery，并比较超时与三次重复 ACK；
- SACK 或 selective repeat 的事件日志；
- 两条连接共享 bottleneck 时的 AIMD 公平性实验；
- 用性质测试检查重复/乱序的任意排列都不改变最终字节流；
- 将同一协议适配到真实 UDP，仅作隔离实验，必须与核心评分路径分开并说明风险。

## 讲义映射

- 主线：[`net-01-tcpip.md`](../../lectures/net-01-tcpip.md)；
- 进程/计时器背景：`os-01/02`；
- 应用层互通背景：`net-02-application.md`；
- 小实验对照：[`labs/L12-http-server`](../../labs/L12-http-server/README.md)（只借鉴测试组织，
  不把 HTTP/TCP 生产 socket 当作本项目实现）。
