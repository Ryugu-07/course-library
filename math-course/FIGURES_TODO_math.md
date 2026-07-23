# math-course 插图清单

> 数学站 72 页。**[plot] 类（函数图/曲面/分布/相图等）已由 arch 用 matplotlib 生成并插入 44 张**（见 `figs/*.py`，图内英文/数学、中文在图注、`svg.fonttype=path` 无字距问题）。本文件列 **剩余的 [diagram]/[concept] 类**（结构/流程/概念示意），交 GPT 按 `~/COURSE_FIGURE_STYLE.md` 的「SVG 铁律」补齐。

## 管线与铁律（同 cs）
- 图放 `~/math-course/images/`，`build_site.py` 自动拷入站点；重建 `~/ai-course/.venv/bin/python build_site.py`。
- 主色靛蓝 `#3f5ca6`、辅 `#8ba0d0`；浅色/白底设计。
- **[diagram] SVG 铁律**：框按字宽定、`text-anchor="middle"`、长句进 figcaption、字号 ≥13、**出图后浏览器截图自查无文字溢出**。
- 图注里的行内数学用 `\(...\)`（**不是** `$...$`——figure 块内 `$` 不被渲染），块前后留空行。

## ✅ 已完成的 [plot]（44 张，供参考，勿重做）
分析线：epsilon-N 极限 / 导数切线 / 中值定理 / 黎曼和 / 级数部分和 / 切平面(3D) / 梯度场 / 方向场 / 阻尼三态 / 相图四类 / Riemann-Lebesgue / 正交投影 / 热衰减 / 热核 / 二重积分(3D) / 留数围道。
代数几何：特征向量椭圆 / 二次型等值线 / 二次曲面(3D) / 密切圆曲率 / 高斯曲率(3D)。
概率统计：四大分布 / 二维正态 / CLT / 抽样分布 / 置信区间 / 两类错误 / 最小二乘 / Poisson路径 / Markov收敛 / 布朗运动。
应用计算：Runge / Newton / 凸函数 / 梯度下降 / LP可行域 / 条件数。
扩展线：二元熵 / 二次变差 / 扩散前向 / GBM期权 / AR(1) / GARCH / KL散度。

## 📋 待 GPT 补的 [diagram] / [concept]（~16 张）

**代数与几何线**
- ★ `alg-abs-01-cyclic-group.svg` [diagram] — 循环群 \(\mathbb{Z}_n\) 画成时钟/正 n 边形旋转 + 一张 Cayley 表。锚点：alg-abs-01 §1。
- ○ `alg-abs-02-galois-lattice.svg` [diagram] — 域扩张塔 与 子群格 的 Galois 对应（倒挂的两个格 + 对应箭头）。锚点：alg-abs-02 Galois 段。
- ○ `algebra-04-linear-map.svg` [diagram/plot] — 线性映射把一组基/网格变成另一组（方格→平行四边形网格）。锚点：algebra-04 §线性映射。
- ○ `complex-01-conformal.svg` [plot] — 共形映射：\(z\mapsto z^2\) 或 \(e^z\) 把方格网变形、但保持角度不变（可用 matplotlib 画网格变换）。锚点：complex-01 C-R 段。

**拓扑线**
- ★ `top-01-homeomorphism.svg` [concept] — 同胚直觉：咖啡杯 ≅ 甜甜圈（连续形变，亏格不变）。锚点：top-01 连续映射/同胚段。
- ★ `top-02-compact-cover.svg` [diagram] — 紧致性：开覆盖 → 有限子覆盖（一堆开集盖住区间、圈出有限几个）。锚点：top-02 §紧致。

**概率统计线（补充 diagram）**
- ○ `prob-01-bayes-tree.svg` [diagram] — 贝叶斯：先验→似然→后验的概率树 / 混淆矩阵式方块图（如疾病检测假阳性）。锚点：prob-01 贝叶斯段。
- ○ `stoch-03-state-classes.svg` [diagram] — Markov 链状态分类：常返/暂态/吸收态的状态转移图（点 + 带权箭头）。锚点：stoch-03 §状态分类。

**应用计算线**
- ○ `num-01-float-line.svg` [diagram] — 浮点数在数轴上非均匀分布（大数间隙大）+ 机器精度。锚点：num-01 §浮点。
- ○ `opt-03-kkt.svg` [diagram] — KKT/对偶几何：约束梯度与目标梯度共线（\(\nabla f=\sum\lambda_i\nabla g_i\)）+ 互补松弛示意。锚点：opt-03。
- ○ `model-01-modeling-cycle.svg` [concept] — 数学建模循环：现实问题→假设→建模→求解→验证→迭代 的闭环流程图。锚点：model-01 §方法论。

**扩展线：图论 + 博弈论**
- ★ `graph-02-graph-types.svg` [diagram] — 一张示例图 + 图的基本概念（顶点/边/度/路径/连通分量），配几种特殊图（完全图/二部图/树）。锚点：graph-02 §基本理论。
- ★ `graph-03-bipartite-matching.svg` [diagram] — 二部图最大匹配 + 归约成网络流（加源汇、边容量 1）。锚点：graph-03。（可与 cs 站 algo-02 呼应）
- ○ `graph-01-pascal.svg` [plot/diagram] — Pascal 三角形 + 组合恒等式的图形（可 matplotlib 画数字三角 + 高亮路径）。锚点：graph-01 §计数。
- ★ `game-01-nash-payoff.svg` [diagram] — 2×2 收益矩阵（囚徒困境）+ 最佳反应箭头指向 Nash 均衡格。锚点：game-01 §Nash。
- ○ `game-02-minimax-tree.svg` [diagram] — 零和博弈的 minimax 博弈树 / 鞍点示意。锚点：game-02。

**信息论线**
- ○ `info-03-channel.svg` [diagram] — 有噪信道模型：输入 X →（转移概率矩阵/噪声）→ 输出 Y，信道容量 \(C=\max I(X;Y)\)。锚点：info-03 §信道容量。

## 备注
- 标 `[plot]` 或 `[plot/diagram]` 的（complex-01 共形、algebra-04 线性映射、graph-01 Pascal）其实也能用 matplotlib 出，GPT 若方便可走代码生成，质量更稳。
- 其余纯 [diagram]/[concept] 是真正的示意图，按 SVG 铁律画。
- 数学站文字较抽象的页（real-01/03、func-01/03、algebra-01/02/03、prob-04、stat-02 等）**可不配图**，不必强凑。
