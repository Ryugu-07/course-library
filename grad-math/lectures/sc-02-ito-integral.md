# 随机分析 II · Itô 积分的构造

> **对标**：Øksendal §3 ｜ **前置**：sc-01、mt-03/04、泛函 I（等距延拓）
> 一阶变差无穷让 $\int f\,dB$ 无法逐路径定义（sc-01）。Itô 的出路是放弃逐路径、改走 $L^2$：**简单过程上显式定义 → 等距性质 → 稠密延拓**——与实变/泛函里"完备化"的手法完全同构。本页把这三步走严，并配齐鞅性质。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ito-learning-title">

## 学习层：左端点负责适应，二次变差负责修正，期望等距另算一笔

### 1. 先预测：同一条路径的三个和会差多少？

固定 $B_0=0$、均匀分割 $t_j=jT/n$，把被积函数取为适应过程 $H_t=B_t$。实验分别计算

$$
I_n^{\mathrm L}=\sum_j B_{t_j}\Delta B_j,\qquad
I_n^{\mathrm R}=\sum_j B_{t_{j+1}}\Delta B_j,\qquad
I_n^{\mathrm M}=\sum_j\frac{B_{t_j}+B_{t_{j+1}}}{2}\Delta B_j.
$$

先预测四件事：

1. 哪一个取值 $B_{t_j}$ 对 $\mathcal F_{t_j}$ 可测，因而是 Itô 简单过程的合法左端点？
2. 右端点和中点相对左端点分别多出 $Q_n$ 和 $Q_n/2$，还是都不多？
3. 一条路径上的 $Q_n=\sum_j(\Delta B_j)^2$ 能否证明二次变差定理？
4. $E[(\int_0^T B_t\,dB_t)^2]$ 与 $E\int_0^T B_t^2dt$ 的共同解析目标是 $T^2/2$、$T$ 还是 $0$？

### 2. 三种取点：可测性与修正不能混成一句话

逐段代数恒等式给出

$$
I_n^{\mathrm R}-I_n^{\mathrm L}=Q_n,\qquad
I_n^{\mathrm M}-I_n^{\mathrm L}=\frac12Q_n,\qquad
I_n^{\mathrm M}=\frac12B_T^2.
$$

左端 $B_{t_j}$ 是 $\mathcal F_{t_j}$-可测，符合适应性；右端 $B_{t_{j+1}}$ 偷看了下一段增量，中点也不是同一个左端点简单过程。对 Brownian 的细分极限，$Q_n$ 在适当分割下趋向 $T$，于是

$$
\int_0^T B_t\,dB_t=\frac{B_T^2-T}{2},\qquad
\int_0^T B_t\circ dB_t=\frac{B_T^2}{2},\qquad
I^{\mathrm R}\to\frac{B_T^2+T}{2}.
$$

最后一个右端和只是这里的修正对照；它不是因为“换一个写法”就自动成为 Itô 积分。

### 3. 一条路径与期望等距：两个量词，两个账本

单路径图只能回答“这条离散路径的 $Q_n$、左和、右和与中点和是多少”。它不能回答期望，也不能独自证明几乎处处、依概率或 $L^2$ 的收敛。对 $N$ 条由同一规则生成的独立路径，实验另记

$$
\widehat E[(I_n^{\mathrm L})^2],\qquad
\widehat E\left[\sum_j B_{t_j}^2\Delta t_j\right],\qquad
E\int_0^T B_t^2dt=\frac{T^2}{2}.
$$

前两项是有限样本的 Monte Carlo 诊断；第三项是解析目标。它们接近时是在检查离散模型与等距方向一致，仍不是一条样本“证明定理”。

### 4. 动手实验：固定 seed，沿嵌套分割读账

实验用固定 seed 生成最高 dyadic 层的 Gaussian 增量，再向下聚合到当前层；切换层数不会换一条路径。揭示前，路径、层数、样本数与账本全部隐藏；揭示后可调 $T$、分割层数、路径数和当前显示路径。

<div class="learning-lab" data-learning-lab="ito-integral-ledger" markdown="1">

**无 JavaScript 时的静态读法：** 取 $H_t=B_t$、$B_0=0$。对任何有限分割，左、右、中点三列满足

| 账本 | 公式 | 角色 |
|---|---|---|
| 左端 Itô 和 | $I_n^{\mathrm L}=\frac12(B_T^2-Q_n)$ | 适应，细分后趋向 Itô 积分 |
| 右端和 | $I_n^{\mathrm R}=I_n^{\mathrm L}+Q_n$ | 非左端点，极限比 Itô 多 $T$ |
| 中点和 | $I_n^{\mathrm M}=I_n^{\mathrm L}+Q_n/2=B_T^2/2$ | Stratonovich 型修正 |
| 单路径二次变差 | $Q_n=\sum(\Delta B_j)^2$ | 有限样本诊断，不能单独证明定理 |
| 期望等距 | $E[(\int B\,dB)^2]=E\int B^2dt=T^2/2$ | 需要期望/多路径量词 |

数值表的路径列和样本列必须分开阅读；有限 $N$ 的均值偏差是抽样误差，不是 Itô 等距失效。

</div>

### 5. 迁移问题：把“适应”带到一般被积过程

若 $H_t$ 不是 $B_t$ 而是一个只在 $t_j$ 时可观测的交易策略，左端和仍然如何定义？若改用中点方案，怎样用半鞅二次变差写出修正？请同时标注适应性、平方可积性和极限方式；不要以一条漂亮路径图代替条件期望或 $L^2$ 论证。

</section>

## 1. 适应性与简单过程

**被积函数的资格**（$\mathcal{V}[0,T]$ 类）：$f(t,\omega)$ 可测、**适应并取可预测版本**（$f_t \in \mathcal{F}_t$——不偷看未来；连续适应过程自动给出可预测版本）、$E\int_0^T f^2\,dt < \infty$。

**简单过程**：$\varphi(t) = \sum_j e_j\,\mathbb{1}_{[t_j, t_{j+1})}(t)$，$e_j \in \mathcal{F}_{t_j}$-可测有界。对它积分**显式定义**：

$$
\int_0^T \varphi\,dB := \sum_j e_j\big(B_{t_{j+1}} - B_{t_j}\big)
$$

（**左端点取值就藏在 $e_j \in \mathcal{F}_{t_j}$ 里**——"下注在开牌前"是定义的可测性要求，不是约定俗成。）

## 2. Itô 等距（构造的发动机）

**定理** 对简单过程：

$$
E\Big[\Big(\int_0^T\varphi\,dB\Big)^2\Big] \;=\; E\Big[\int_0^T \varphi^2\,dt\Big]
$$

**【证明】** 展开平方为双重和。交叉项（$i < j$）：$E[e_ie_j\Delta B_i\Delta B_j] = E\big[e_ie_j\Delta B_i\,E(\Delta B_j\mid\mathcal{F}_{t_j})\big] = 0$（塔性质 + 未来增量零均值——**适应性在此杀死交叉项**）；对角项：$E[e_j^2(\Delta B_j)^2] = E\big[e_j^2\,E((\Delta B_j)^2\mid\mathcal{F}_{t_j})\big] = E[e_j^2]\Delta t_j$。求和即得。$\blacksquare$

**读法**：积分映射 $\varphi \mapsto \int\varphi\,dB$ 是从可预测子空间 $L^2_{\mathrm{pred}}(dt\times dP)$ 到 $L^2(dP)$ 的**等距**——"随机积分的勾股定理"（本科 sde-01 预告的正式版）。等距 = 保范线性映射 = 可以安全延拓。

## 3. 稠密延拓（泛函分析收尾）

**引理（可预测简单过程的稠密性）【骨架】** 先把定义域写成可预测平方可积空间 $L^2_{\mathrm{pred}}(dt\times dP)$。其中的 elementary predictable processes

$$
\varphi(t,\omega)=\sum_j \xi_j(\omega)\,\mathbf 1_{(t_j,t_{j+1}]}(t),
\qquad \xi_j\in L^\infty(\mathcal F_{t_j}),
$$

在该空间中稠密。证明不靠普通时间卷积（卷积核可能读取 $t$ 之后的值而离开可预测 $\sigma$-代数），而按以下骨架进行：先对有界左连续适应过程用左端点阶梯逼近；再用可预测 $\sigma$-代数由集合 $A\times(s,t]$、$A\in\mathcal F_s$ 生成这一事实和单调类论证推广到一般有界可预测过程；最后对 $f^{(K)}=(-K)\vee(f\wedge K)$ 截断，并令 $K\to\infty$。在标准 Brownian 过滤下，也可把每个时间格的系数写成不偷看未来的条件期望投影

$$
\xi_{j,n}=
E\!\left[\left.\frac1{\Delta t_j}\int_{t_j}^{t_{j+1}}f_s\,ds\right|\mathcal F_{t_j}\right],
\qquad
\varphi_n=\sum_j\xi_{j,n}\mathbf 1_{(t_j,t_{j+1}]},
$$

再用 $L^2$ 条件期望的收缩性与网格加密得到逼近。三级逼近的关键是“可预测性先保住，再做 $L^2$ 极限”，不是把随机过程当作普通二维函数去磨光。$\blacksquare$

**定义（Itô 积分）** 取简单过程 $\varphi_n \to f$，则 $\int\varphi_n dB$ 是 $L^2(dP)$ 中的 Cauchy 列（**等距把被积函数的 Cauchy 性原样搬运**），其极限即 $\int_0^T f\,dB$——与逼近序列无关（等距再用一次）。$\blacksquare$
（**这就是泛函 I"有界线性算子在稠密子空间上定义后唯一延拓"的标准剧目**——随机积分是泛函分析定理的一次著名出演。）

## 4. 作为过程的 Itô 积分：鞅性质

**定理** $M_t = \int_0^t f\,dB$（$f \in \mathcal{V}$）满足：

1. **鞅**（关于 $\mathcal{F}_t$）——**【证明（简单过程情形）】**：$E[M_{t+s} - M_t\mid\mathcal{F}_t]$ 的每项含未来增量的条件零均值（§2 同款论证）；一般情形 $L^2$ 极限保持鞅性（条件期望是 $L^2$ 压缩，mt-03）；
2. 连续修正存在**【骨架】**：简单过程积分显式连续；Doob 极大不等式（mt-04）+ 等距控制逼近误差的**一致**范数 ⇒ 沿子列一致收敛，连续性保住（数分 IV 的一致极限定理第三次上岗）；
3. 等距与线性对一般 $f$ 成立（延拓自动携带）。

**零均值推论**：$E\int_0^t f\,dB = 0$——"公平赌博"从直觉变成定理链的产物。

**推广一嘴【引用】**：被积条件放宽到 $P(\int f^2 dt < \infty) = 1$ 时积分仍可定义但只是**局部鞅**（真鞅可能失守——金融里"局部鞅 ≠ 鞅"正是泡沫模型的数学缝隙）；对一般连续半鞅积分、协变差 $\langle M, N\rangle$ 的 Kunita–Watanabe 理论见 K–S §3。

## 5. 练习与要点

**例 1（亲手算 $\int_0^T B\,dB$）** 用分割 $\varphi_n = \sum B_{t_j}\mathbb{1}_{[t_j,t_{j+1})}$：

$$
\sum_j B_{t_j}\Delta B_j = \frac12\sum\big[(B_{t_{j+1}}^2 - B_{t_j}^2) - (\Delta B_j)^2\big] = \frac{B_T^2}{2} - \frac12\sum(\Delta B_j)^2 \to \frac{B_T^2 - T}{2}
$$

（末步 = sc-01 二次变差定理！）——本科 sde-01 那个"多出 $-T/2$"的著名结果，现在每一步都有出处。顺手验证：若右端点取值，极限变为 $\frac{B_T^2 + T}{2}$——**不同取点收敛到不同答案**，这就是"为什么必须钦定左端点"的计算级证明（中点 = Stratonovich）。

**例 2（等距的直接红利）** $\mathrm{Var}\big(\int_0^T \sigma(t)\,dB\big) = \int_0^T\sigma^2dt$——时变波动率组合的方差公式（金融的 term structure 计算天天在用），等距定理的一行应用。

**例 3（鞅性的用法）** $M_t = \int_0^t \mathrm{sign}(B_s)\,dB_s$：是鞅、二次变差 $= t$ ⇒ 由 Lévy 刻画（sc-01 §3）**它本身是一个布朗运动**（Tanaka 的例子——不同的被积函数可以"合成"出新 BM；也是"局部时"理论的门缝）。$\blacksquare$

---

*下一页：Itô 公式的严格证明与 SDE 的存在唯一性——本科 sde 线的两大口头支票在此兑付。*
