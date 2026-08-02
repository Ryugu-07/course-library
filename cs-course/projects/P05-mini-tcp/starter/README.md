# P05 starter

`packet.py` 定义可序列化的 Segment，`network.py` 提供可复现的离散网络故障注入，
`protocol.py` 只给 ByteStream、sender、receiver 和 connection 的接口与状态名。后者的
可靠传输、定时器、状态机和拥塞控制方法故意保留 `NotImplementedError`。

这里没有 `AF_INET`、真实端口或操作系统 TCP；`DiscreteNetwork` 是教学 harness。先让学生
在事件 tick 上实现协议，再讨论它和生产 TCP/QUIC 的差异。
