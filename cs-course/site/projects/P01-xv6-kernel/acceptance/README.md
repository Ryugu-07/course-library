# P01 学生实现后验收（不属于 scaffold CI）

本目录的清单描述教师在固定 xv6-riscv 基线中运行的测试层。`scripts/verify_scaffold.py` 和 `tests/scaffold/` 不会调用这些测试，因为 starter 有意未实现核心路径。

## 分层

1. **M1 公共**：`trace`/`sysinfo`/`setpriority`、非法 PID、fork/exit 计数、调度公平；`usertests` 回归。
2. **M2 公共**：页对齐、用户权限、缺页、fork/exit 页表资源和非法地址；检查无预先填满整个地址空间的特例。
3. **M3 公共**：`kalloctest`、`bcachetest`、锁争用计数、反序锁故障；修复后 60 秒压力运行无卡死。
4. **M4 公共**：大文件、二级间接块、跨目录符号链接、删除目标、循环深度上限，以及日志提交前后崩溃恢复。
5. **M5 公共/隐藏**：`mmap/munmap` 权限、懒加载、脏页写回、EOF、进程退出清理；最后运行完整 `usertests`。

## 运行条件

在教师指定的 Linux/WSL2/Docker xv6 环境中运行：

```bash
make qemu
make grade
```

公开 fixture 的输入形状可在 macOS 上用 Python 检查；这不等同于 xv6 验收。隐藏测试可以改变调度顺序、故障注入点、节点/页数量和路径深度，不能只硬编码公开样例。
