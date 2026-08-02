# P07 starter

这些文件提供可解析的 tiny-model/request/page/quantization schema 和稳定的服务接口。KV
分配、连续批处理、推理、量化算法都保留 `NotImplementedError`；`numpy_backend.py` 只在
构造时尝试导入 NumPy，普通 schema 校验和 driver 不需要 NumPy、CUDA 或 GPU。

`fixtures/tiny_model.json` 包含短/长混合请求和 `win_4060_ti_extension` 标记。学生实现后，
先用 CPU oracle，再单独记录 Windows 4060 Ti 的扩展实验，避免把平台专属结果写进基础契约。
