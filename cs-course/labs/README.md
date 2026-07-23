# L01-L12 可运行实验

本目录是课程的“小实验”层：每个实验都能独立运行，并带有自动验收入口。

```bash
python3 run_all.py
```

统一验收会在当前机器上编译并测试可用工具链：

- L01/L02/L03/L07/L10：Clang/C/C++；
- L04/L05/L06/L12：Python 标准库；
- L08/L09：Mac 运行 CPU 参考实现并检查 CUDA 源码；Windows + NVIDIA CUDA Toolkit
  上额外运行 `make test-cuda`；
- L11：安装 Rust 后运行 `cargo test`；没有 Rust 时仍会检查谜题集结构。

每个子目录的 `README.md` 给出学习目标、运行命令、观察点和扩展任务。默认命令只写入
各实验自己的 `build/` 或 Python 缓存目录。

