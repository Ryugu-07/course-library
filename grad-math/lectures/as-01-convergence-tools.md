# 渐近统计 I · 收敛工具箱

> **对标**：van der Vaart *AS* §2–3 ｜ **前置**：mt-01/02、本科概率 V、统计 I–II
> 渐近统计 = "样本量趋于无穷时统计程序的精确行为"。本页配齐三件日用工具：**Slutsky**（收敛的代数）、**连续映射**（收敛的函数演算）、**Delta 方法**（"估计量的函数"的极限分布）——它们是后两页一切定理的语法。

## 1. 依分布收敛的正式基础

**定义升级（Portmanteau 定理，选三条常用）【引用】** $X_n \xrightarrow{d} X$ 等价于：对一切有界连续 $f$，$Ef(X_n) \to Ef(X)$；对一切 $P(X \in \partial A) = 0$ 的集合，$P(X_n \in A) \to P(X \in A)$；分布函数在连续点处处收敛（本科定义）。
（第一条是工作定义——"对一切温和的检验函数过关"；测度的弱收敛语言与实变/泛函的弱拓扑同源。）

**特征函数工具（Lévy 连续性定理）【引用】** $\varphi_{X_n}(t) \to \varphi_X(t)$ 逐点（极限在 0 连续）$\iff X_n \xrightarrow{d} X$——CLT 证明（本科概率 V）的引擎，正式引用备案。

**紧性（Prokhorov）一嘴【引用】**：胎紧（tight，质量不逃逸）⟺ 依分布收敛子列存在——"分布列的 Bolzano–Weierstrass"，证明存在极限分布时的兜底工具。

## 2. 三大工具

**定理（连续映射，CMT）** $X_n \xrightarrow{d} X$、$g$ 在 $X$ 的支撑上连续 ⇒ $g(X_n) \xrightarrow{d} g(X)$。
**【骨架】** Portmanteau 第一条：$Ef(g(X_n)) = E(f\circ g)(X_n)$，$f\circ g$ 有界连续。$\blacksquare$（对 $\xrightarrow{P}$、a.s. 同样成立。）

**定理（Slutsky）** $X_n \xrightarrow{d} X$，$Y_n \xrightarrow{P} c$（常数），则

$$
X_n + Y_n \xrightarrow{d} X + c, \qquad Y_nX_n \xrightarrow{d} cX, \qquad X_n/Y_n \xrightarrow{d} X/c\ (c \neq 0)
$$

**【骨架】** 联合收敛 $(X_n, Y_n) \xrightarrow{d} (X, c)$（一边是常数时联合收敛免费——一般情形不免费！），再 CMT。$\blacksquare$
⚠️ **$Y_n$ 收敛到"常数"是本质**：两个都收敛到非退化分布时和的极限不确定（依赖联合结构——本科概率"边缘定不了联合"的渐近版）。

**定理（Delta 方法）** $\sqrt n(T_n - \theta) \xrightarrow{d} N(0, \sigma^2)$、$g$ 在 $\theta$ 可微且 $g'(\theta) \neq 0$：

$$
\sqrt n\big(g(T_n) - g(\theta)\big) \xrightarrow{d} N\big(0,\ [g'(\theta)]^2\sigma^2\big)
$$

**【证明】** Taylor：$g(T_n) - g(\theta) = g'(\theta)(T_n - \theta) + R_n$，$R_n = o_P(|T_n - \theta|)$（可微性 + $T_n \xrightarrow{P}\theta$）。乘 $\sqrt n$：主项 CMT 给 $g'(\theta)N(0,\sigma^2)$，余项 $\sqrt n R_n = o_P(1)$，Slutsky 收尾。$\blacksquare$
**读法**：**"光滑函数不改变 $\sqrt n$ 速率，只按导数平方缩放方差"**——误差传播定律（物理实验课的公式）的严格版。$g'(\theta) = 0$ 时降速为 $n$、极限变 $\chi^2$ 型（二阶 Delta【引用】）——"参数恰在临界点"的检验为何行为异常的答案。

**记号纪律（$o_P/O_P$ 演算）**：$o_P(1)$ = 依概率趋零；$O_P(1)$ = 胎紧。运算规则如同小 o/大 O（$o_P\cdot O_P = o_P$ 等）——渐近论证的速记法，后两页全程使用。

## 3. 联合渐近与多维版

多维 Delta：$\sqrt n(T_n - \theta) \xrightarrow{d} N(0, \Sigma)$ ⇒ $\sqrt n(g(T_n) - g(\theta)) \xrightarrow{d} N(0,\ \nabla g^\top\Sigma\nabla g)$（同证，Jacobi 替导数）。**Cramér–Wold 装置【引用】**：多维依分布收敛 ⟺ 一切线性组合一维收敛——"多维问题一维化"的官方通道（多维 CLT 由一维 CLT + C–W 一行获得）。

## 4. 练习与要点

**例 1（样本方差的渐近分布，三工具合演）** $S_n^2 = \frac1n\sum(X_i - \bar X)^2$：分解 $= \frac1n\sum(X_i - \mu)^2 - (\bar X - \mu)^2$；第一项 CLT 给 $\sqrt n(\cdot - \sigma^2) \xrightarrow{d} N(0, \mu_4 - \sigma^4)$，第二项 $\sqrt n(\bar X - \mu)^2 = O_P(1)\cdot o_P(1) = o_P(1)$——Slutsky 合并：

$$
\sqrt n(S_n^2 - \sigma^2) \xrightarrow{d} N(0,\ \mu_4 - \sigma^4)
$$

（正态总体时 $= N(0, 2\sigma^4)$，与本科统计 I 的 χ² 精确分布对账：$n$ 大时一致 ✓。）

**例 2（Delta 实战）** 变异系数、相关系数、对数收益：$\sqrt n(\hat\sigma/\hat\mu - \sigma/\mu)$ 的渐近方差按二维 Delta 一次算清——**"任何光滑统计量的置信区间"的流水线**：CLT 出原料、Delta 出成品（金融里 Sharpe 比率的标准误正是此流程【引用 Lo 2002】）。

**例 3（Slutsky 的日常）** t 统计量 $\frac{\sqrt n(\bar X - \mu)}{S_n}$：分子 $\xrightarrow{d} N(0,\sigma^2)$、分母 $\xrightarrow{P}\sigma$ ⇒ 商 $\xrightarrow{d} N(0,1)$——**"t 检验在大样本下不需要正态总体"**（本科统计 III/IV 大样本通行证的三行证明），也是"为何 $n>30$ 口诀能横行"的定理出处。$\blacksquare$

---

*下一页：把工具箱对准统计的心脏——MLE 的相合性与渐近正态性、Fisher 信息与渐近有效性。*
