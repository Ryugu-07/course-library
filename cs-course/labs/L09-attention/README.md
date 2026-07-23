# L09 玩具 Attention Kernel

实现单头 scaled dot-product attention。每个 CUDA block 负责一个 query 行，线程并行计算
`QK^T` 分数，在 shared memory 中做最大值与指数和归约，再协作生成输出；减去行最大值
保证 softmax 数值稳定。

```bash
make test
```

Windows 4060 Ti：

```powershell
.\test_cuda.ps1
```

规模刻意限制为 `N <= 128, D <= 64`，让算法结构比极限性能更清楚。扩展任务：把 Q/K/V
分块搬入 shared memory，并比较不落地完整注意力矩阵时的显存流量。

