# L07 SIMD 与自动向量化

同一个 `float` 点积有三条路径：禁止优化的标量基线、编译器自动向量化循环、手写
NEON（Apple Silicon）或 AVX2（x86-64）intrinsics。

```bash
make test
make run
make assembly
```

计时器会自动增加迭代次数，直到每组至少运行 50 ms，再取 7 组单次耗时的中位数；
结果同时与双精度参考值比较并显示相对误差。`make assembly` 生成汇编，便于搜索
`fmla`/`vfmadd` 等向量指令。加速比只用于本机比较，不写死进测试。扩展任务：去掉
`restrict`，观察编译器是否仍愿意向量化。
