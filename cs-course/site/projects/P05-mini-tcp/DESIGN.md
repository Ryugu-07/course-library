# P05 设计报告模板

## 1. 范围与协议版本

- 组员、分工、提交 commit：
- 协议版本、最大 payload、序号空间：
- 明确哪些行为不属于本项目（例如真实 socket）：

## 2. Packet 与字节流

- Segment 字段/flags/checksum：
- 序号与 ACK 的含义、回绕比较规则：
- ByteStream 容量、EOF、半关闭和取消：

## 3. Sender / Receiver 不变量

- sender 的已发送未确认区间：
- receiver 的 next expected、乱序缓存和交付规则：
- 重复/旧 ACK/非法包如何处理：

## 4. 定时器与重传

- 时钟注入方式和 RTO 公式：
- 超时、重复 ACK、重传计数：
- 如何避免同一段重复交付：

## 5. 连接状态机

粘贴状态图或 Mermaid/ASCII 图，说明 SYN、ACK、FIN、RST、TIME_WAIT 和半关闭的边界。

## 6. 流量控制与拥塞控制

- advertised window 与 cwnd 的最小值：
- slow start、congestion avoidance、退让规则：
- 多连接公平性假设和可观察指标：

## 7. 故障矩阵与性能

| 场景 | seed | 丢包/乱序/延迟 | 结果 | 重传 | goodput | 解释 |
|---|---:|---|---|---:|---:|---|
|  |  |  |  |  |  |  |

## 8. 失败尝试与后续工作

至少记录一个错误的 RTO/cwnd/窗口设计、观察到的症状、根因和修复；最后写已知限制与可选
挑战的取舍。
