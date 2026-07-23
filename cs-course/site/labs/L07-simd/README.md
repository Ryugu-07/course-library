# L07 SIMD 与自动向量化

同一个 `float` 点积有三条路径：禁止优化的标量基线、编译器自动向量化循环、手写
NEON（Apple Silicon）或 AVX2（x86-64）intrinsics。

```bash
make test
make run
make assembly
```

`make assembly` 生成汇编，便于搜索 `fmla`/`vfmadd` 等向量指令。计时只用于本机比较，
不把某个固定加速比写进测试。扩展任务：去掉 `restrict`，观察编译器是否仍愿意向量化。

