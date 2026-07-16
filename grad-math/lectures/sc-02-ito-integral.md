# 随机分析 II · Itô 积分的构造

> **对标**：Øksendal §3 ｜ **前置**：sc-01、mt-03/04、泛函 I（等距延拓）
> 一阶变差无穷让 $\int f\,dB$ 无法逐路径定义（sc-01）。Itô 的出路是放弃逐路径、改走 $L^2$：**简单过程上显式定义 → 等距性质 → 稠密延拓**——与实变/泛函里"完备化"的手法完全同构。本页把这三步走严，并配齐鞅性质。

## 1. 适应性与简单过程

**被积函数的资格**（$\mathcal{V}[0,T]$ 类）：$f(t,\omega)$ 可测、**适应**（$f_t \in \mathcal{F}_t$——不偷看未来，本科 sde-01 的 forward-only 在此是可测性条件）、$E\int_0^T f^2\,dt < \infty$。

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

**读法**：积分映射 $\varphi \mapsto \int\varphi\,dB$ 是从 $L^2(dt\times dP)$ 到 $L^2(dP)$ 的**等距**——"随机积分的勾股定理"（本科 sde-01 预告的正式版）。等距 = 保范线性映射 = 可以安全延拓。

## 3. 稠密延拓（泛函分析收尾）

**引理（稠密性）【骨架】** 任意 $f \in \mathcal{V}$ 可被简单过程按 $L^2(dt\times dP)$ 逼近：有界连续 → 用左端点采样的简单过程（DCT）；有界可测 → 磨光成连续（卷积，实变）；一般 → 截断。三级逼近与实变 II 的积分构造同构。$\blacksquare$

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
