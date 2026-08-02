# P04 starter

这里有真实的 IR/CFG 数据模型、fixture 解析和 dump 驱动，方便从 M1 开始。`ir.py` 中的
`to_ssa`、`optimize`、`allocate_registers`、`emit`、`compile_program` 是公开接口，当前
故意抛出 `NotImplementedError`。不要把这些占位符改成“看似能跑”的伪实现来绕过验收；
先在 `DESIGN.md` 固定不变量，再逐阶段实现。

`branch_loop.json` 不是 SSA：`acc` 和 `i` 在循环体中重复定义，正好用于练习 φ 和重命名。
