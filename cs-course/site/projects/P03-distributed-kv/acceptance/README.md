# P03 学生实现后验收（不属于 scaffold CI）

脚手架验证只检查协议、fixture、确定性传输预览器和报告资产；它不会调用 `RaftNode`/`TodoKV` 的 TODO 方法。以下层级在学生实现后运行。

## 公共层

1. **Raft 基础**：3/5 节点稳定网络选主、任期变化、心跳、日志复制、commit/apply 顺序。
2. **故障与持久化**：3+2 分区、leader 崩溃、重复/延迟 RPC、反复崩溃重启、快照后旧日志截断；少数派不能提交。
3. **单组 KV**：`Get/Put/Append`、旧 leader 错误、客户端重复请求去重、状态机仅应用已提交命令、线性一致历史 checker。
4. **controller/迁移**：`Join/Leave/Move/Query` 配置进入 Raft；配置频繁变化、导入重复、旧/新组崩溃时不丢不重不双写。

## 隐藏层

教师改变节点数（奇数）、随机种子、超时、消息顺序、磁盘故障序号、client retry 次数和迁移配置跳跃。不能硬编码 fixture 节点名或把所有读写集中到一个“永远在线”的节点。

建议命令由课程发放脚本填充；接口层入口为：

```bash
python3 -m unittest discover -s tests -v
python3 -m unittest discover -s acceptance -v
```

线性一致性验收应使用操作的真实开始/结束区间，而不是仅比较最终副本值；报告要指出模拟器对时钟、网络和持久化的假设。
