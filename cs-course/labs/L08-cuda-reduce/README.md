# L08 CUDA Reduction + Scan

`reduce_scan.cu` 包含三种归约：每元素全局原子、共享内存树形归约、warp shuffle
归约；另有单 block Blelloch exclusive scan。Mac 上先跑确定性的 CPU 参考测试和源码
结构检查：

```bash
make test
```

在装有 CUDA Toolkit 的 Windows 4060 Ti 上：

```powershell
.\test_cuda.ps1
```

程序会与 CPU 结果核对并打印三种 kernel 的时间。扩展任务：用 CUB 作基线，并用
Nsight Compute 解释 shared 与 shuffle 版本的差距。

