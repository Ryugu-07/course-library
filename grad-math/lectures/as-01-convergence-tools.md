# 渐近统计 I · 收敛工具箱

> **对标**：van der Vaart *AS* §2–3 ｜ **前置**：mt-01/02、本科概率 V、统计 I–II
> 渐近统计 = "样本量趋于无穷时统计程序的精确行为"。本页配齐三件日用工具：**Slutsky**（收敛的代数）、**连续映射**（收敛的函数演算）、**Delta 方法**（"估计量的函数"的极限分布）——它们是后两页一切定理的语法。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="convergence-tools-learning-title">

<h2 id="convergence-tools-learning-title">学习层：结论证书与反例选择器</h2>

### 1. 先标记目标，再检查假设

这一页暂时不使用鞅。实验只处理可以完全写出有限 PMF、概率和矩的序列或三角阵列；它的任务不是用有限图证明极限定理，而是训练“我究竟拿到了哪一种收敛证书”。标量结论的常用方向是

$$
L^p\ (p\ge1)\Longrightarrow L^1\Longrightarrow \xrightarrow{P}\Longrightarrow\xrightarrow{d},
\qquad
\xrightarrow{\mathrm{a.s.}}\Longrightarrow\xrightarrow{P},
$$

但反向箭头通常需要额外条件。特别是“依分布收敛”若极限不是常数，并不自动给出同一概率空间上的依概率、a.s. 或 $L^p$ 结论。

实验有两个页签：**序列 / 三角阵列**显示 exact PMF、$E X_n$、$E|X_n|$、$E X_n^2$ 和证书表；**Slutsky / CMT / Delta**显示假设检查、结论与边界。提交预测前，曲线、数值和答案都隐藏。

### 2. 五个完全解析的序列模型

设 $U,U_1,U_2,\ldots$ 为 $[0,1]$ 上的均匀变量，$\varepsilon,\varepsilon_n,\varepsilon_{nk}$ 为取 $\pm1$ 且概率各为 $1/2$ 的 Rademacher 变量。三角阵列每一行内的变量相互独立；行间耦合未指定。其余模型是否共用变量或相互独立，以各自定义为准。

**nested rare spike** 取同一个 $U$：

$$
X_n=n\mathbf 1\{U\le1/n\}.
$$

因此 $P(X_n=n)=1/n$、$P(X_n=0)=1-1/n$、$E|X_n|=1$、$E X_n^2=n$。对每个 $U>0$，最终有 $n>1/U$，故 $X_n\to0$ a.s.，也依概率和依分布收敛到 $0$，但不 $L^1$、不 $L^2$。这是“a.s. 不自动给 $L^p$”的精确反例。

**independent rare spike** 改用独立的 $U_n$，有限时刻的 PMF 和上述完全相同，所以 $X_n\to0$ 依概率、依分布，但 $E|X_n|=1$、$E X_n^2=n$。另一方面，对 $N\le n\le M$ 没有尖峰的概率是

$$
\prod_{n=N}^{M}\left(1-\frac1n\right)=\frac{N-1}{M}\longrightarrow0.
$$

故尖峰无穷多次发生，a.s. 不收敛。这是“依概率不自动给 a.s.”的反例；它和上一个模型共享每个有限 $n$ 的账本，却有不同的路径结论。

**scaled Rademacher** 取 $X_n=\varepsilon_n/\sqrt n$。这里 $|X_n|=1/\sqrt n$ 是确定的，所以 a.s.、依概率、$L^1$、$L^2$ 都收敛到 $0$，且 $E X_n^2=1/n$。

**fixed Rademacher** 取 $X_n=\varepsilon$。它在同一空间上 a.s.、依概率、$L^1$、$L^2$ 收敛到非退化的 $\varepsilon$，依分布极限是 Rademacher，而不是常数 $0$。这提醒我们先写极限对象，不能把“收敛”默认为“趋零”。

**Rademacher triangular array** 的第 $n$ 行是

$$
T_n=\frac{\varepsilon_{n1}+\cdots+\varepsilon_{nn}}{\sqrt n},
\qquad
P\left(T_n=\frac{j}{\sqrt n}\right)=\binom n{(n+j)/2}2^{-n}
$$

（$j=-n,-n+2,\ldots,n$）。每一行精确满足 $E T_n=0$、$E T_n^2=1$、$E T_n^4=3-2/n$；CLT 才给出 $T_n\xrightarrow{d}N(0,1)$。行间没有默认的共同路径，所以实验只认证依分布结论；有限 lattice 图不能证明一般 CLT。

### 3. 静态 fallback：逐项结论证书

关闭 JavaScript 时，取 $n=8$。下表中的“有 / 无 / 不作断言”是理论结论，不是从有限柱状图猜出来的；PMF 和矩是该固定 $n$ 的精确快照。

| 模型 | a.s. | 依概率 | $L^1$ | $L^2$ | 依分布极限 | 精确账本 |
|---|---|---|---|---|---|---|
| nested spike | 有，极限 $0$ | 有 | 无 | 无 | $\delta_0$ | $P(X_n=n)=1/n$，$E\lvert X_n\rvert=1$，$E X_n^2=n$ |
| independent spike | 无 | 有，极限 $0$ | 无 | 无 | $\delta_0$ | 无尖峰区间概率 $(N-1)/M$ |
| scaled Rademacher | 有，极限 $0$ | 有 | 有 | 有 | $\delta_0$ | $\lvert X_n\rvert=n^{-1/2}$，$E X_n^2=1/n$ |
| fixed Rademacher | 有，极限 $\varepsilon$ | 有 | 有 | 有 | Rademacher | $P(\varepsilon=\pm1)=1/2$ |
| triangular array | 本页不作断言 | 本页不作断言 | 本页不作断言 | 本页不作断言 | $N(0,1)$（CLT） | $E T_n=0$，$E T_n^2=1$，$E T_n^4=3-2/n$ |

### 4. 三个工具的证书 / 反例

- **Slutsky**：若 $X_n\xrightarrow{d}X$ 且 $Y_n\xrightarrow{P}c$，其中 $c$ 是常数，则和、积、在 $c\ne0$ 时的商可由联合收敛和连续映射推出。若两个边缘都只收敛到非退化分布，边缘信息不决定联合结构：$X=Y=R$ 时 $X+Y=2R$，$X=R,Y=-R$ 时 $X+Y=0$，不能直接套定理。
- **连续映射**：精确条件是 $g$ 的不连续点集 $D_g$ 满足 $P(X\in D_g)=0$；在极限支撑上处处连续是更强的常用充分条件。$X_n=R/n\to0$、$g(x)=x^2$ 是可用证书；$X_n=1/n\to0$、$g(x)=1/x$ 在 $0$ 处不连续且极限质量全在 0，则 $g(X_n)=n$ 发散，不能把形式代入当作结论。
- **Delta method**：需要 $\sqrt n(T_n-\theta)\xrightarrow{d}Z$，并且 $g$ 在 $\theta$ 可微。一阶结论为 $g'(\theta)Z$；若希望一阶极限非退化，还需 $g'(\theta)\ne0$ 及非退化输入。取 $T_n=1+R/\sqrt n,g(x)=x^2$，有 $\sqrt n(g(T_n)-1)=2R+1/\sqrt n$；若改为 $\theta=0$，则 $g'(0)=0$，$\sqrt nT_n^2\to0$ 而 $nT_n^2=1$，若想看一阶零极限之外的非零主项，需要在这个平方函数特例中切换到二阶尺度；这里得到常数 1，仍不是非退化随机极限。

反例选择器让你先选择一个拟议箭头，再选模型：依概率不推出 a.s. 选 independent spike；a.s. 不推出 $L^2$ 选 nested spike；有限图不证明一般定理选 triangular array；两个非退化边缘不能直接套 Slutsky 选两种 coupling。选择器的答案是在提交后才显示。

### 5. 边界与迁移

- $L^p$、依概率、依分布的结论必须写明目标变量；“矩看起来稳定”不是 $L^p$ 收敛证书。
- 三角阵列的每行可以有精确 PMF，但行间独立、同分布、Lindeberg 条件或共同概率空间等信息要另行声明；有限图只展示当前行。
- 连续映射不要求 $g$ 处处连续，但要求极限变量以概率 1 避开它的不连续点；有界连续检验函数可用于依分布收敛，不连续函数需要检查极限在断点上的质量。
- 一阶 Delta 的导数为零不是小误差，而是主项消失；若要寻找非退化极限，须检查下一个非零阶导数再决定尺度，不能一律套二阶项。
- 迁移到 MLE、t 统计量或机器学习风险时，先把 CLT/相合性作为输入证书，再逐条检查 Slutsky、CMT、Delta 的条件；不要用一次 finite-n 图替代渐近证明。

<div class="learning-lab" data-learning-lab="convergence-tools" markdown="1">

**无 JavaScript 时的静态读法：**默认模型为 nested spike、$n=8$，反例选择器默认“依概率是否自动给 a.s.”。工具页默认 Slutsky 的常数极限案例。交互的每个 PMF、概率、矩和 toy 变换都由解析式直接计算；SVG 只画有限账本，结论证书来自上面的条件和反例论证。

</div>

</section>

先修回链：[测度与期望](mt-01-measure-expectation.html)、[大数律与 CLT](mt-02-lln.html)。

## 1. 依分布收敛的正式基础

**定义升级（Portmanteau 定理，选三条常用）【引用】** $X_n \xrightarrow{d} X$ 等价于：对一切有界连续 $f$，$Ef(X_n) \to Ef(X)$；对一切 $P(X \in \partial A) = 0$ 的集合，$P(X_n \in A) \to P(X \in A)$；分布函数在连续点处处收敛（本科定义）。
（第一条是工作定义——"对一切温和的检验函数过关"；测度的弱收敛语言与实变/泛函的弱拓扑同源。）

**特征函数工具（Lévy 连续性定理）【引用】** $\varphi_{X_n}(t) \to \varphi_X(t)$ 逐点（极限在 0 连续）$\iff X_n \xrightarrow{d} X$——CLT 证明（本科概率 V）的引擎，正式引用备案。

**紧性（Prokhorov）【引用】**：在 Polish 空间上，一族概率测度紧（tight，质量一致不逃逸）当且仅当它在弱拓扑中相对紧。对序列 $(\mu_n)$，等价表述是：**每个子序列**都有一个进一步弱收敛子序列。仅仅“原序列存在一个收敛子列”远远不够；例如 $\mu_{2n}=\delta_0$、$\mu_{2n+1}=\delta_n$ 有收敛的偶数子列，却不紧。

## 2. 三大工具

**定理（连续映射，CMT）** 设 $g$ 可测。若 $X_n\xrightarrow{d}X$，且 $g$ 的不连续点集 $D_g$ 满足 $P(X\in D_g)=0$，则 $g(X_n)\xrightarrow{d}g(X)$。要求 $g$ 在 $X$ 的整个支撑上连续是更强、但常用的充分条件。
**【骨架】** 若 $g$ 全局连续，Portmanteau 第一条可直接用于有界连续的 $f\circ g$。在一般的 $P(X\in D_g)=0$ 版本里，$f\circ g$ 未必全局连续，需用扩展 Portmanteau 定理（或 Skorokhod 表示后在连续点逐点传递）完成；不能仍把 $f\circ g$ 宣称为处处连续。$\blacksquare$（对 $\xrightarrow{P}$、a.s. 有对应版本。）

**定理（Slutsky）** $X_n \xrightarrow{d} X$，$Y_n \xrightarrow{P} c$（常数），则

$$
X_n + Y_n \xrightarrow{d} X + c, \qquad Y_nX_n \xrightarrow{d} cX, \qquad X_n/Y_n \xrightarrow{d} X/c\ (c \neq 0)
$$

**【骨架】** 联合收敛 $(X_n, Y_n) \xrightarrow{d} (X, c)$（一边是常数时联合收敛免费——一般情形不免费！），再 CMT。$\blacksquare$
⚠️ **$Y_n$ 收敛到"常数"是本质**：两个都收敛到非退化分布时和的极限不确定（依赖联合结构——本科概率"边缘定不了联合"的渐近版）。

**定理（Delta 方法）** $\sqrt n(T_n - \theta) \xrightarrow{d} N(0, \sigma^2)$、$g$ 在 $\theta$ 可微：

$$
\sqrt n\big(g(T_n) - g(\theta)\big) \xrightarrow{d} N\big(0,\ [g'(\theta)]^2\sigma^2\big)
$$

**【证明】** Taylor：$g(T_n) - g(\theta) = g'(\theta)(T_n - \theta) + R_n$，$R_n = o_P(|T_n - \theta|)$（可微性 + $T_n \xrightarrow{P}\theta$）。乘 $\sqrt n$：主项 CMT 给 $g'(\theta)N(0,\sigma^2)$，余项 $\sqrt n R_n = o_P(1)$，Slutsky 收尾。$\blacksquare$
**读法**：**"非零导数把一阶误差按线性系数搬运，方差按导数平方缩放"**——误差传播定律（物理实验课的公式）的严格版。$g'(\theta)=0$ 时，上面的一阶结论仍给零极限。只有再假定 $g$ 在邻域二阶连续可微且 $g''(\theta)\ne0$，才得到

$$
n\big(g(T_n)-g(\theta)\big)\Rightarrow\frac12g''(\theta)\sigma^2\chi_1^2.
$$

例如 $g(x)=x^2,\theta=0$ 用 $n$ 尺度；$g(x)=x^3,\theta=0$ 则一、二阶导都为零，要用 $n^{3/2}$ 尺度，极限是 $\sigma^3Z^3$，这里 $Z\sim N(0,1)$。可见“一阶导为零”本身并不指定下一种尺度或保证 χ² 极限。

**记号纪律（$o_P/O_P$ 演算）**：$o_P(1)$ = 依概率趋零；$O_P(1)$ = 依概率有界（等价地，相应分布族 tight）。运算规则如同小 o/大 O（$o_P\cdot O_P=o_P$ 等）——渐近论证的速记法，后两页全程使用。

## 3. 联合渐近与多维版

多维 Delta（这里 $g:\mathbb R^d\to\mathbb R$ 在 $\theta$ 可微）：$\sqrt n(T_n - \theta) \xrightarrow{d} N(0, \Sigma)$ ⇒ $\sqrt n(g(T_n) - g(\theta)) \xrightarrow{d} N(0,\ \nabla g^\top\Sigma\nabla g)$（同证，Jacobi 替导数）。**Cramér–Wold 装置【引用】**：多维依分布收敛 ⟺ 一切线性组合一维收敛——"多维问题一维化"的官方通道（多维 CLT 由一维 CLT + C–W 一行获得）。

## 4. 练习与要点

**例 1（样本方差的渐近分布，三工具合演）** 设 $X_i$ iid，$EX_i=\mu$、$\operatorname{Var}(X_i)=\sigma^2$，并且中心四阶矩 $\mu_4=E(X_i-\mu)^4<\infty$。 $S_n^2 = \frac1n\sum(X_i - \bar X)^2$：分解 $= \frac1n\sum(X_i - \mu)^2 - (\bar X - \mu)^2$；第一项 CLT 给 $\sqrt n(\cdot - \sigma^2) \xrightarrow{d} N(0, \mu_4 - \sigma^4)$，第二项 $\sqrt n(\bar X - \mu)^2 = O_P(1)\cdot o_P(1) = o_P(1)$——Slutsky 合并：

$$
\sqrt n(S_n^2 - \sigma^2) \xrightarrow{d} N(0,\ \mu_4 - \sigma^4)
$$

（正态总体时 $= N(0, 2\sigma^4)$，与本科统计 I 的 χ² 精确分布对账：$n$ 大时一致 ✓。）

**例 2（Delta 实战）** 沿用 iid 有限四阶矩，再设 $\mu\ne0,\sigma>0$。变异系数 $g(\mu,v)=\sqrt v/\mu$ 的梯度为 $(-\sigma/\mu^2,1/(2\mu\sigma))^\top$；均值与方差的联合 CLT 协方差阵是 $\begin{pmatrix}\sigma^2&\mu_3\\\mu_3&\mu_4-\sigma^4\end{pmatrix}$，其中 $\mu_3=E(X-\mu)^3$。于是$\sqrt n(\hat\sigma/\hat\mu - \sigma/\mu)$ 的渐近方差为 $\sigma^4/\mu^4-\mu_3/\mu^3+(\mu_4-\sigma^4)/(4\mu^2\sigma^2)$。接近零均值时导数放大，不能忽略分母条件。其余光滑函数也按相应梯度处理——**"任何光滑统计量的置信区间"的流水线**：CLT 出原料、Delta 出成品（金融里 Sharpe 比率的标准误正是此流程【引用 Lo 2002】）。

**例 3（Slutsky 的日常）** 设 iid 样本具有有限且非零方差。t 统计量 $\frac{\sqrt n(\bar X - \mu)}{S_n}$：分子 $\xrightarrow{d} N(0,\sigma^2)$、分母 $\xrightarrow{P}\sigma$ ⇒ 商 $\xrightarrow{d} N(0,1)$——**"t 检验在大样本下不需要正态总体"**（本科统计 III/IV 大样本通行证的三行证明），但定理没有给出普适的 $n>30$ 门槛；重尾、偏斜或相关数据需要另外核查矩条件、依赖结构和近似精度。$\blacksquare$


### 独立迁移：同样的“趋零”，可能需要不同工具

1. 把嵌套尖峰改为 $Y_n=\sqrt n\,\mathbf1\{U\le1/n\}$，分别判断 a.s.、$L^1$、$L^2$ 收敛到 0。
2. 已知 $\sqrt nT_n\Rightarrow Z\sim N(0,1)$。比较 $g(x)=x^2$ 与 $g(x)=x^3$ 的非退化尺度和极限。
3. iid 数据只有有限二阶矩，四阶矩无限时，能否直接调用本页样本方差的 $\sqrt n$ 正态公式？这是否同时否定样本均值 CLT？

<details markdown="1"><summary>核对独立迁移与条件</summary>

第一题仍因同一个 $U>0$ 最终离开缩小区间而 a.s. 趋零。$E|Y_n|=n^{-1/2}\to0$，所以也 $L^1$ 趋零；但 $EY_n^2=1$，不 $L^2$ 趋零。它补出本页默认尖峰没有展示的“$L^1$ 有、$L^2$ 无”层次。

第二题用 CMT 直接看：$nT_n^2=(\sqrt nT_n)^2\Rightarrow Z^2\sim\chi_1^2$；$n^{3/2}T_n^3=(\sqrt nT_n)^3\Rightarrow Z^3$。立方极限有正有负，不能误认成 χ²；两者的一阶 $\sqrt n$ 变换都退化为 0。

第三题不能调用方差例子的普通 CLT，因为 $(X-\mu)^2$ 的方差就是 $\mu_4-\sigma^4$，此时并不有限。样本均值的 iid CLT 只需有限二阶矩，仍可成立；一个统计量的条件失效并不自动否定另一个统计量的极限定理。

</details>

---

*下一页：把工具箱对准统计的心脏——MLE 的相合性与渐近正态性、Fisher 信息与渐近有效性。*


把渐近标准误的条件放回真实相关资料，可做[NOAA CO₂真实数据项目](project-01-co2-trends.html)。使用有版本和质量说明的固定快照，保留独立复算与模型边界。


本页 Delta 定理与样本方差例可对照 [van der Vaart《Asymptotic Statistics》预览中的定理3.1与例3.2–3.3](https://api.pageplace.de/preview/DT0400.9781107266308_A23760354/preview-9781107266308_A23760354.pdf)，特别留意有限四阶矩条件。
