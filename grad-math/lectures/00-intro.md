# 使用指南：标注体系与教材对照

> 这是[本科数学复习库](../../math-course/site/index.html)的研究生续篇：15 门硕士/博士资格考级课程的**讲义骨架**。与本科站的关键差异：研究生内容的正确性冗余更低，所以本站执行严格的**可信度标注制**——你永远知道哪句话可以直接信、哪句话需要翻教材核对。

## 标注体系（全站铁律）

- **【证明】**：完整证明，我对每一步负责——可直接用于复习与复述；
- **【骨架】**：给出证明的关键步骤与结构，技术细节（长簿记、精细常数）略去——复习"思路"够用，需要全文时按骨架去对标教材找；
- **【引用】**：只陈述定理，证明超出本站体例——教材章节已标明去处。

每页头部标注**对标教材与章节**。本站定位是"配教材的复习与导航层"，不是教材替代品——研究生阶段这不是谦虚，是对可靠性负责（无标注的研究生"讲义"你应当默认怀疑，包括 AI 写的一切）。

## 课程地图与对标教材

| 学科线 | 课程 | 对标教材 |
|---|---|---|
| **概率与分析** | 测度概率与鞅（4）| Durrett, *Probability: Theory and Examples* |
| | 高维概率（4）| Vershynin, *High-Dimensional Probability* |
| | 随机分析（4）| Øksendal, *Stochastic Differential Equations* |
| | 现代 PDE（3）| Evans, *Partial Differential Equations* 前半 |
| **统计与学习** | 渐近统计（3）| van der Vaart, *Asymptotic Statistics* 入门章 |
| | 统计学习理论（4）| Shalev-Shwartz & Ben-David；Mohri et al. |
| | MDP 与强化学习数学（3）| Puterman；Szepesvári |
| **优化与计算** | 凸优化（4）| Boyd & Vandenberghe；Nesterov 入门 |
| | 数值线性代数（3）| Trefethen & Bau |
| | 矩阵分析（3）| Horn & Johnson, *Matrix Analysis* |
| **信息与传输** | 信息论进阶（3）| Cover & Thomas 中后章 |
| | 最优传输（3）| Peyré & Cuturi；Santambrogio 入门 |
| **几何与代数** | 流形几何（4）| Lee, *Smooth Manifolds* / *Riemannian Manifolds* |
| | 代数拓扑（3）| Hatcher 第 0–2 章 |
| | 代数进阶（3）| Artin；Dummit & Foote |

上述课程正文已收录，侧栏可直接进入各页。阅读时先用学习层的问题、例题与实验建立理解，再回到速查层核对正式定义、条件和证明结构；页面收录不代表可省略教材核查。

## 与本科站的关系

先修关系已内置：每页开头列出所需的本科页（如"前置：实变 I–III、泛函 I–II"）。**先把本科站对应页复习到能复述，再进研究生页**——研究生数学的困难九成来自本科地基不牢，这是资格考的公开秘密。两站间 🔗 互引照旧。

## 诚实声明（比本科站更重要）

研究生内容中我出错概率最高的地方：长技术性证明的中段细节、精细常数、非主流教材间记号差异。**防线**：【证明】级内容我已尽力核查，但重要用途（考试、论文引用）请对照教材原文；发现可疑处，直接把该段与教材差异告诉 AI 复核。本站的价值在骨架、导航与跨课联络——细节的最终裁判永远是教材与你自己的推导。

---

*建议入口：概率与分析线的测度概率 I（全站地基），或按需直接跳到你正在用的课程。*


## 研究前沿：从定理工具进入活跃问题

下面三讲是彼此可独立选择的专题课。每讲先完成一个可算的入门模型，再明确进入正式理论还需要哪些对象与技术；不把有限演示当成大定理的证明。文献核查日期为 **2026-09-08**，论文的首发、修订与发表状态在各页分别列出。

| 专题课 | 已有课程的起点 | 本讲要跨过的门槛 | 完成后的自测 |
|---|---|---|---|
| [Schrödinger 桥与路径空间](frontier-01-schrodinger-bridge.html) | [最优传输与对偶](ot-01-monge-kantorovich.html)、[Girsanov](sc-04-girsanov.html) | 从端点耦合走到整个随机过程上的相对熵 | 为什么参考过程改变，最可能的桥也会改变？ |
| [奇异 SPDE 与重整化](frontier-02-singular-spde.html) | [分布与弱导数](pde2-01-distributions.html)、[Itô 积分](sc-02-ito-integral.html) | 普通乘法为何失效，需怎样定义修正后的对象 | 为什么减去发散均值仍不足以证明收敛？ |
| [几何 Langlands](frontier-03-geometric-langlands.html) | [覆盖空间](at-02-covering.html)、[群论](alg2-01-groups-advanced.html) | 从有限群 Fourier 类比进入局部系统、层与范畴 | 2024 证明系列解决的是哪个精确版本？ |

几何 Langlands 的完整证明需要代数几何、D-模、导出范畴等本库尚未完整开设的先修；本讲提供可核查的概念桥梁与论文入口，不宣称一讲即可掌握证明。三讲都将经典理论、近期结果、尚待解决的问题分开标注。

相关路线：[物理前沿](../../physics-course/site/index.html#研究前沿课程) · [AI 前沿](../../ai-course/site/index.html#研究前沿课程)。


<h2 id="research-curriculum">连续研究课程：从基础工具到研究问题</h2>

每条线按四讲顺序推进：先建立可算对象，再检验模型条件，最后进入研究文献。讲次之间有关联；与前面的专题课可以交叉阅读。

**现代数论入口**

[有限域上的椭圆曲线](nt-01-elliptic-counting.html) → [椭圆曲线群与有理点](nt-02-elliptic-group.html) → [模形式与 q 展开](nt-03-modular-forms.html) → [Frobenius 与 Galois 表示](nt-04-frobenius-galois.html)。

**微观到宏观**

[Liouville 与边缘分布](kinetic-01-liouville-marginals.html) → [碰撞与 Boltzmann 方程](kinetic-02-boltzmann-collisions.html) → [流体极限与闭合](kinetic-03-hydrodynamic-limits.html) → [波湍流与共振](kinetic-04-wave-kinetics.html)。

现代数论线先修群、环、域与复分析；微观到宏观线先修测度概率、常微分方程及 PDE。数论中的 Frobenius 提供算术动机，几何 Langlands 的概形、层与导出范畴仍需另外准备；请按[可自测的先修路线](frontier-03-geometric-langlands.html#langlands-prerequisite-route)逐项补齐。

<h2 id="foundation-route">基础衔接：先把代数与几何之间的计算接通</h2>

基础衔接目前有 **20 讲：代数与几何 15 讲，随机分析 5 讲**。它们不必按编号全部顺读。先用[从整数分解到导出观点的连续作业](route-01-derived-readiness.html)诊断，再按目标选择：

- 同调代数主线：模与商 → 复形 → 张量积与 Tor → 链同伦与映射锥；Ext 可在模与分解之后接入。
- 几何主线：局部化 → 层与粘合 → Čech；局部环与切空间、联络与水平截面按后续问题选读。
- 随机分析主线：Markov 桥与 Wick 极限分别接向对应研究专题。

这些是可计算的中间工具，尚不构成完整的交换代数、代数几何或导出范畴课程。

| 先独立尝试 | 若不会，回到哪里 | 本讲完成后的下一步 |
|---|---|---|
| 解释整数乘六为何单射却不满射，模六商为何不是向量空间 | [模、商与正合性](bridge-01-modules.html)；先补本科线性空间与环论 | 局部化、表示与分解 |
| 算出模十二反演二后还剩几个元素 | [局部化](bridge-02-localization.html) | 素谱、局部环与函数芽 |
| 写出三角形的边界矩阵，区分边框与填面 | [链复形](bridge-03-complexes.html) | 链映射、同伦与导出范畴 |
| 判断三弧局部系统是否有非零全局平坦截面 | [层与粘合](bridge-04-sheaves.html) | 向量丛、联络与局部系统 |
| 从自由分解算出循环模的张量积与 Tor₁，并反驳一次成功就证明平坦 | [张量积、平坦性与 Tor](bridge-05-tensor-tor.html) | 换底、导出张量积与交点 |
| 写出 O(−3) 的 Čech 微分，逐项消去 Laurent 多项式 | [Čech 与射影直线](bridge-06-cech.html) | 层上同调、扩张与丛的模问题 |
| 区分扩张类与中间模，给出非分裂扩张 | [Hom、Ext 与扩张](bridge-07-ext.html) | 同调代数与丛的变形 |
| 算出链同伦与映射锥，区分拟同构和同伦等价 | [链同伦与映射锥](bridge-12-homotopy-cones.html) | 导出观点、分解与等价的条件 |
| 用两张仿射图粘出射影直线，核对局部态射在重叠上的兼容 | [仿射图粘合与态射](bridge-13-affine-gluing.html) | 概形、分离性与局部到整体 |
| 从平方映射计算纤维与基变换，区分支撑点数、长度与约化性 | [纤维与基变换](bridge-14-fibers-base-change.html) | 平坦族、重数与相交的入口 |
| 比较相同双点背后的自由族与挠元族，计算乘法核和 Tor | [非平坦族与导出纤维](bridge-15-nonflat-derived-fibers.html) | 普通纤维、平坦性与导出张量的衔接 |
| 区分相切的交点长度与乘法核，计算直线自交 | [相交、接触阶与 Tor](bridge-16-intersections-tor.html) | 非横截并不自动产生高次 Tor |
| 从Koszul微分追踪类的乘法，区分合法分解与冗余方程 | [导出纤维积与乘法](bridge-20-derived-products.html) | 半自由模型、分次Leibniz、自交外代数 |
| 从局部环计算 m/m²，用双数提升核验一阶切向约束 | [局部环与切空间](bridge-11-tangent-spaces.html) | 概形的无穷小信息与奇点 |
| 写出 C* 上的水平解，检验一次绕行的单值化 | [联络、水平截面与 D-模](bridge-08-connections.html) | 局部系统、微分方程与几何 Langlands |

随机分析路线有两个计算入口。[Markov 桥与路径枚举](bridge-10-markov-paths.html)将端点重配落实为两步转移及八条路径，接回 Schrödinger 桥；[Wick 平均与 L² 极限](bridge-09-wick-limits.html)要求亲自写出同一 Fourier 耦合下两个截断的均方差，再进入奇异 SPDE 的核估计。
| 用终端倾斜推导连续漂移，对照路径KL与控制能量 | [连续时间路径熵与控制](bridge-17-continuous-control.html) | Girsanov、Doob变换与同扩散条件 |
| 从整个 Fourier 场的尾和证明随机分布极限，辨认临界失败 | [热核与随机分布](bridge-18-heat-distributions.html) | Sobolev 阈值、测试函数与同噪声热核极限 |
| 看见高频共振留下低频，核对乘积条件与局部重建假设 | [分布乘积与重建](bridge-19-products-reconstruction.html) | Bony乘积、Wick增强与重建的作用边界 |

验收应同时包含手算、解释条件和构造反例。每讲折叠答案供独立作答后核对；实验只检验所写模型。完成后再读[几何 Langlands 的分阶段先修表](frontier-03-geometric-langlands.html#langlands-prerequisite-route)及[导出交点计算](frontier-03-geometric-langlands.html#derived-intersection-calculation)。张量积与上同调已有可计算入口，一般概形理论、导出范畴、D-模及模叠仍有后续任务。

随机分析训练可从[路径熵与随机场极限的连续作业](route-02-stochastic-readiness.html)进入：有限路径桥与 Wick 平均分成两支，各自完成诊断、计算、退出题与复测。
