# P02 学生实现后验收（不属于 scaffold CI）

`tests/scaffold/` 和 `scripts/verify_scaffold.py` 只确认作业包完整、fixture 可读、接口签名存在。以下测试必须在学生实现核心逻辑后运行，不能把 TODO starter 当作失败提交。

## 公共层

1. **存储/索引**：随机变长 tuple、删除后槽复用、重启一致性、buffer pin/unpin/dirty、B+ 树随机插入/删除/范围扫描/根分裂。
2. **SQL**：20 条公开查询与 golden result；`EXPLAIN` 同时输出逻辑和物理计划；检查流式 `next()` 和错误语义。
3. **事务/恢复**：读自己的写、不可见未提交版本、选定隔离级别的冲突处理、WAL 四类 crash point、重复恢复幂等。

## 隐藏层

教师可替换页大小、缓存容量、键分布、SQL 字段顺序、并发交错、日志尾部完整性和故障序号。隐藏测试不要求特定内部类名，但会调用 `starter/protocol.py` 中公开的等价契约或学生提供的适配器。

建议命令由课程发放脚本填充；基础入口为：

```bash
python3 -m unittest discover -s tests -v
python3 -m unittest discover -s acceptance -v
```

如果 acceptance 测试需要第三方库或更长压力运行，必须在课程发布说明中单独列出；本 starter 的结构检查始终只依赖 Python 标准库。
