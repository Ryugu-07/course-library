# NOAA CO₂课程数据包

数据来自 NOAA Global Monitoring Laboratory / Carbon Cycle and Greenhouse Gases group，Boulder, Colorado, USA。完整上游文件还注明早期 Scripps Institution of Oceanography 资料；本课程分析只使用1990—2021年的NOAA时期。

- `co2_mm_mlo_2026-08-05.txt`：上游原文快照，字节未改，含原始说明与引用要求。文件创建日期2026-08-05，抓取时间和SHA-256见`manifest.json`。
- `subset.csv` / `subset.json` / `data.js`：课程派生的384个月子集，保留原列值，另加整月索引与质量解释。不是NOAA另外发布的数据产品。
- `manifest.json`：来源、版本、单位、量纲与使用条件。最新上游可能修订；本课程不会在加载页面时悄悄更新数据。

这是已校准、按背景空气规则筛选、聚合并校正月中心的**月平均测量产品**，不是仪器原始信号。称“上游原始文件”只表示我们没有改写该文件，不能理解为未经处理的观测。

单位为干空气CO₂摩尔分数ppm。`daily_std`是每日均值的标准差，`monthly_unc`是官方月平均不确定度；后者依据天气尺度变动并考虑日际相关性，不等于仪器重复精度，不应擅自替换为`daily_std/sqrt(days)`。负的天数/标准差/不确定度表示缺失、插值或早期未知信息，不能当成零方差。本子集384行均有非负质量列；按最少有效天数额外筛选只是课程敏感性分析。

数据按[NOAA GML使用条款](https://gml.noaa.gov/about/disclaimer.html)免费公开使用，需保留来源致谢，不能宣称NOAA数据为课程原创、不能暗示NOAA背书、不能把课程派生模型冒充官方产品。NOAA政府数据不受本项目代码版权声明覆盖。

从已冻结文件复现：在仓库根运行`python tools/prepare_co2_data.py`；独立数值参照为`python tools/generate_co2_reference.py`（NumPy），验证为`node tools/check_co2_observations.js`。前一个命令不联网，不覆盖原始快照。

官方说明：

- [数据入口](https://gml.noaa.gov/ccgg/trends/data.html)
- [月均值、去季节、不确定度与站点变动](https://gml.noaa.gov/ccgg/trends/mlo.html)
- [数据版本与X2019量标变更](https://gml.noaa.gov/ccgg/trends/trends_log.html)
- [测量、定标与背景空气选择](https://gml.noaa.gov/ccgg/about/co2_measurements.html)

2020—2021只从本课程回归的训练集里留出。由于整份官方数据是2026年修订快照，月中心校正/校准也使用上游处理结果，这不构成“当年实时可得信息”的历史预测回测。反复查看留出结果并选模型后，还需另一份独立评估集。
