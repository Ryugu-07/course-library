# L10 无锁栈、ABA 与内存序

实验分两部分：

- `TreiberStack` 用 CAS 实现并发 push/pop；节点延迟到析构时回收，明确隔离“算法正确性”
  与“安全内存回收”两个问题；
- `VersionedIndexStack` 把索引与版本号打包进 64 位原子，逐步复现 ABA，并证明旧 CAS
  因版本变化而失败。

```bash
make test
make tsan
```

`make tsan` 依赖当前编译器支持 ThreadSanitizer。扩展任务：用 hazard pointers 或 epoch
reclamation 让弹出的节点可以及时释放，并说明其进度保证。

