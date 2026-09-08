# 随机分析 IV · Girsanov、鞅表示与 Feynman–Kac

> **对标**：Øksendal §8 / Shreve *SCF-II* §5 ｜ **前置**：sc-01–03、mt-03/04、pde2 线（Feynman–Kac 一节）
> 随机分析收官：三大定理各管金融数学的一根支柱——**Girsanov**（风险中性测度为何存在）、**鞅表示**（在完备模型中如何构造对冲）、**Feynman–Kac**（SDE 与 PDE 的官方词典）。本科 sde-03 的"风险中性定价"从操作口诀升格为定理体系。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：先核对测度方向，再谈“去漂移”

### 1. Learning contract

本实验固定一组由 seed 生成的 Gaussian 增量，并把它们解释成 $P$ 下的 Brownian 路径。模型是

$$
X_t=\sigma\theta t+\sigma B_t,
\qquad
Z_T=\frac{dQ}{dP}\Big|_{\mathcal F_T}
=\exp\left(-\theta B_T-\frac12\theta^2T\right).
$$

目标不是把有限样本平均“调到正确”，而是先把以下四件事说对：RN 导数的**方向**是 $dQ/dP$，指数中的线性项是负号；$P$ 下的 $X$ 带漂移，$Q$ 下它变成无漂移；常数有限 $\theta$、有限 $T$ 时 Novikov 给出真鞅和等价测度；当 $|\theta|$ 变大时，有限重要性采样会出现权重退化。

实验中的路径积分使用 $N=48$ 段梯形和 $A_N$。令 $h=T/N$，在 $Q$ 下 $X=\sigma\widetilde B$，则

$$
A_N=\sigma h\sum_{j=1}^N\left(N-j+\frac12\right)\Delta\widetilde B_j,
\qquad \operatorname{Var}_Q(A_N)=\sigma^2T^3\left(\frac13-\frac1{12N^2}\right).
$$

这解释了账本“离散梯形目标”的来源；连续积分的方差为 $\sigma^2T^3/3$，二者不能因图像接近就写成同一个数。

先预测四件事，再打开实验：

1. 若 $B_t+\theta t$ 在 $Q$ 下是 Brownian，$dQ/dP$ 的 $B_T$ 项应取正号还是负号？
2. $P$ 下 $X_t=\sigma\theta t+\sigma B_t$，加权后的 $Q$ 下漂移是多少？
3. 常数有限 $\theta$、有限 $T$ 时，$E_P\exp(\frac12\theta^2T)$ 是有限数还是无法判断？
4. 保持样本量不变而增大 $|\theta|$，ESS 通常增大还是减小？

### 2. 符号、方向与目标矩

由 $\tilde B_t=B_t+\theta t$ 在 $Q$ 下为标准 Brownian，反解得 $B_t=\tilde B_t-\theta t$。因此

$$
X_t=\sigma\theta t+\sigma(\tilde B_t-\theta t)=\sigma\tilde B_t,
$$

这正是“$P$ 下带漂移，$Q$ 下无漂移”的方向。对任意终值或路径量 $G$，关系是

$$
E^Q[G]=E^P[Z_TG],
\quad
Z_T=\exp\left(-\theta B_T-\frac12\theta^2T\right),
\quad
E^P[Z_T]=1.
$$

例如 $X_T$ 的目标矩是 $E^Q[X_T]=0$、$E^Q[X_T^2]=\sigma^2T$；路径量 $A_T=\int_0^T X_tdt$ 也应在 $Q$ 下有零均值。实验把同一批增量代入**自归一化重要性估计** $\sum_iZ_iG_i/\sum_iZ_i$；它有限样本一般有偏，所以还报告原始权重均值、归一化和、ESS 与目标矩。换测度不改变 $X_t(\omega)$ 的取值，而改变每条路径被赋予的权重。图里的 $\sigma B_t$ 是另一随机变量在 $P$ 下的对照，其 $P$ 分布与 $X$ 的 $Q$ 分布相同，不能称为同一路径换测度后减掉漂移的结果。

### 3. Novikov、绝对连续边界与有限样本反例

常数参数时

$$
E^P\exp\left(\frac12\int_0^T\theta^2dt\right)=\exp\left(\frac12\theta^2T\right)<\infty,
$$

且 $Z_T>0$ 几乎处处，所以有限 $T$ 上 $Q\sim P$。$T=0$ 是退化但合法的边界：$Z_0=1$。这句话不能外推成“任何漂移都能换掉”：无限时间、未控制的随机 $\theta_t$、Novikov 失败或指数局部鞅不是真鞅时，需要另外的均匀可积性、Kazamaki 条件或局部化论证，不能自动得到同一个概率测度。

反例是重要性采样本身：把有限个 $Z_i$ 除以 $\sum_iZ_i$ 后权重和必为 $1$，这不是 $E^P[Z_T]=1$ 的证明；大漂移下一个或少数路径可能承担几乎全部权重，ESS 下降也不表示 Girsanov 定理失效。迁移到非 Gaussian 噪声或随机波动率时，指数形式、可积性和绝对连续性都要重新检查。

### 4. 动手实验：固定增量的预测门与权重账本

实验默认 $\theta=1,T=1,\sigma=1$，固定生成 $192$ 条、每条 $48$ 段的 Gaussian 增量。提交预测前，答案、图和账本隐藏；提交后可切换 $\theta,T,\sigma$。同一 seed 让参数变化只改变模型解释和权重，不重新抽样。

<div class="learning-lab" data-learning-lab="girsanov-weights" markdown="1">

**JavaScript 失效时的静态 fallback：** 默认模型为

$$
X_t=t+B_t,
\qquad
Z_1=\exp(-B_1-1/2),
\qquad
\frac{dQ}{dP}=Z_1.
$$

解析读法是 $E_P[Z_1]=1$、$E_Q[X_1]=0$、$E_Q[X_1^2]=1$，而 Novikov 值为 $e^{1/2}\approx1.6487$；路径量 $A_1=\int_0^1X_tdt$ 的 $Q$ 下目标均值也是 $0$。ESS 应按 $1/\sum_iw_i^2$ 读取，$|\theta|$ 大时通常下降。固定样本的数值只能检查这些目标的有限样本近似，不能证明 RN 指数是真鞅。

</div>

</section>

先修回链：[Itô 积分](sc-02-ito-integral.html)、[Itô 公式](sc-03-ito-formula-sde.html)、[鞅收敛](mt-04-martingale-convergence.html)。

## 1. Girsanov 定理：换测度 = 换漂移

**动机**：本科 sde-03 里"把 $\mu$ 换成 $r$"是黑箱操作。真相：**换一个概率测度，布朗运动的漂移就变了**。

**定理（Girsanov）** $\theta_t$ 可预测、$\int_0^T\theta_t^2dt<\infty$ a.s.，且满足 Novikov 条件 $E\exp\big(\frac12\int_0^T\theta_t^2dt\big)<\infty$。定义

$$
Z_T = \exp\Big(-\int_0^T\theta_s\,dB_s - \frac12\int_0^T\theta_s^2\,ds\Big), \qquad \frac{dQ}{dP} = Z_T
$$

则在新测度 $Q$ 下，$\tilde B_t = B_t + \int_0^t\theta_s ds$ 是标准布朗运动。

**【骨架】** 三步：① $Z_t$ 是指数局部鞅，Itô 公式给 $dZ_t=-\theta_tZ_t\,dB_t$；Novikov 把它升级为真鞅，$E_PZ_T=1$ 才能定义 $Q$。② 对任意有界停时局部化，Itô 乘积公式与 Bayes 公式说明 $Z_t\tilde B_t$（更准确地说其停时版本减去初值）在 $P$ 下是局部鞅，因此 $\tilde B$ 在 $Q$ 下是连续局部鞅。③ 二次变差是路径性质，$[\tilde B]_t=[B]_t=t$；Lévy 刻画于是给出 $\tilde B$ 是 $Q$-Brownian。$\blacksquare$

这里不能对随机适应的 $\theta_t$ 直接把 $B_t$ 当作与 $\theta$ 独立的 Gaussian 再“配方”：$\int\theta\,dB$ 的条件结构正是定理要控制的部分。只有常数或合适确定性 $\theta$ 时，简单的 Gaussian 矩母函数计算才可作为特例核对。

**读法**：**测度变换是"漂移的橡皮擦"**——$P$ 下的 $dX = \mu dt + \sigma dB$ 在 $Q$ 下可改写为 $dX = r\,dt + \sigma d\tilde B$（取 $\theta = \frac{\mu - r}{\sigma}$，**市场风险价格**）。波动率 $\sigma$ 换不掉（二次变差是路径性质，测度等价变换动不了它——sc-01 §2 的定理在此显出深意：**你能改变对世界的概率评估，改不了路径的粗糙度**）。$Z$ 的形态即统计学的似然比——Girsanov 是连续时间的似然比变换（与渐近统计线的 LAN 理论遥相呼应）。

## 2. 鞅表示定理：对冲的存在性执照

**定理** 布朗过滤下的任何平方可积鞅 $M_t$ 必可表示为

$$
M_t=M_0+\int_0^t h_s\,dB_s,\qquad
h\text{ 可预测},\quad E\int_0^T|h_s|^2ds<\infty,
$$

且 $h$ 只在 $dt\times dP$ 几乎处处意义下唯一。**【引用】**（证明经由“指数鞅的线性组合在 $L^2$ 中稠密”，Øksendal §4.3。）

**金融读法（完备性）**：价格过程

$$
V_t=E^Q[e^{-r(T-t)}\Phi(S_T)\mid\mathcal F_t]
$$

本身一般带有无风险漂移；真正的 $Q$-鞅是贴现价格

$$
\widetilde V_t=e^{-rt}V_t=E^Q[e^{-rT}\Phi(S_T)\mid\mathcal F_t].
$$

表示定理给 $d\widetilde V_t=h_t\,d\widetilde B_t$。若一只股票满足 $d\widetilde S_t=e^{-rt}\sigma_tS_t\,d\widetilde B_t$，自融资复制的持股数是

$$
\Delta_t=\frac{h_t}{e^{-rt}\sigma_tS_t},
$$

所以积分核 $h$ 不是未经换算的 Delta。多维情形还要求可交易风险资产的贴现扩散矩阵对 Brownian 噪声方向满秩，并且过滤中没有额外不可交易噪声；“噪声源与资产数相等”只是维数提示，满秩才是代数证书。

**定价三段论（本科 sde-03 的完整资格链）**：Girsanov 造 $Q$（漂移全成 $r$）→ 鞅表示保证可对冲 → 无套利定价 $V_0 = E^Q[e^{-rT}\Phi(S_T)]$。Black–Scholes 公式 = 该期望对对数正态的显式积分。

## 3. Feynman–Kac：SDE ⇄ PDE 词典

**定理（Feynman–Kac）** 设 $u(t,x)$ 解终值问题

$$
u_t + \mu(x)u_x + \frac12\sigma^2(x)u_{xx} - r\,u = 0, \qquad u(T, x) = \Phi(x)
$$

这里采用一个可核对的充分版本：$\mu,\sigma$ 全局 Lipschitz 且线性增长，使 SDE 在有限时段上不爆炸；$r$ 为常数；$u\in C^{1,2}([0,T)\times\mathbb R)$ 连续达到终值，并满足下面随机积分的平方可积条件与终值的 $L^1$ 收敛条件。则

$$
u(t, x) = E\Big[e^{-r(T-t)}\,\Phi(X_T)\;\Big|\;X_t = x\Big], \qquad dX = \mu\,dt + \sigma\,dB
$$

**【证明】** 对 $Y_s = e^{-r(s-t)}u(s, X_s)$ 用 Itô 公式：

$$
dY = e^{-r(s-t)}\Big[\underbrace{u_t + \mu u_x + \tfrac12\sigma^2u_{xx} - ru}_{=\,0\ (\text{PDE})}\Big]ds + e^{-r(s-t)}\sigma u_x\,dB
$$

漂移被 PDE 精确消灭先只给局部鞅。一个足够明确的升级条件是

$$
E\int_t^T e^{-2r(s-t)}|\sigma(X_s)u_x(s,X_s)|^2ds<\infty,
$$

并使终值可积且 $Y_s\to e^{-r(T-t)}\Phi(X_T)$ 在 $L^1$ 中成立；例如适当的多项式增长与相应矩界可以保证这些条件。此时随机积分均值为零，取期望得到：$u(t,x) = EY_t = EY_T = E[e^{-r(T-t)}\Phi(X_T)]$。$\blacksquare$

**读法**：**PDE 的解 = 沿扩散路径的期望**——两个世界的官方翻译器：Black–Scholes 方程 ⇄ 风险中性期望（sde-03 两条定价路线原是一条）；热方程 ⇄ 布朗运动期望（pde2 线/本科 pde-02 的"热核=转移密度"的定理版）；数值上开出两条路——解 PDE（网格法）或模拟 SDE（Monte Carlo），**维数低走 PDE、维数高走 MC** 的行业分工由此定型。反向词典（生成元、Kolmogorov 前后向方程）与位势项推广同框【引用】。

## 4. 随机分析四页资产盘点

| 定理 | 一句话 | 金融支柱 |
|---|---|---|
| 二次变差（sc-01） | 路径粗糙度 = $t$，不可磨灭 | 已实现波动率 |
| Itô 等距/积分（sc-02） | $L^2$ 等距延拓 | 对冲误差核算 |
| Itô 公式/存在唯一（sc-03） | 新链式法则 + Picard | 模型的合法性 |
| Girsanov / 鞅表示 / F–K（本页） | 换漂移 / 可对冲 / SDE⇄PDE | 定价三段论 |

## 5. 练习与要点

**例 1（Girsanov 亲手换）** GBM 在 $P$ 下 $\mu = 0.1, r = 0.03, \sigma = 0.2$：$\theta = 0.35$，$Q$ 下 $dS = 0.03\,S\,dt + 0.2\,S\,d\tilde B$——写出 $Z_T$ 并验证 $E^Q[S_T] = S_0e^{rT}$（这里是无分红、常系数 GBM 的期望；价格轨迹仍然随机，不是每条路径都按 $r$ 增长）。

**例 2（F–K 反向使用）** 用 F–K 表示解热方程 $u_t = \frac12 u_{xx}$（终值改初值、时间反向）：$u(t,x) = E[\varphi(x + B_t)]$ = 高斯卷积——热核公式（本科 pde-02）的三行概率证明。

**例 3（完备性思辨）** 加入随机波动率 $d\sigma=\alpha\,dt+\beta\,dW$，并假设 $W$ 含有相对股票 Brownian $B$ 的非退化独立分量（例如相关系数 $|\rho|<1$）。二维 Brownian 过滤中的鞅表示定理仍然成立：一般索赔核可写成 $h_t^1dB_t+h_t^2dW_t$；失败的是股票与债券的贴现扩散暴露只有秩 1，不能张成独立的波动率噪声方向。因此波动率风险不可由这两种资产完全对冲，等价鞅测度及衍生品价格在不加额外原则时不唯一。若 $W$ 与 $B$ 完全同向，则不能只凭“写了两个字母”断言不完备。**Heston 类模型要指定波动率风险价格**，数学原因正在这里。$\blacksquare$

**先做一次独立换测度计算**：设 $X_t=2t+2B_t$、$T=1$。写出使 $X$ 无漂移的 $dQ/dP$；若误把指数线性项改为正号，新的 $X_1$ 均值是多少？再只用两段梯形积分 $A_2=\tfrac12X_{1/2}+\tfrac14X_1$，求正确 $Q$ 下的方差。

<details markdown="1"><summary>核对测度方向与离散方差</summary>

$\theta=1$，故正确密度为 $e^{-B_1-1/2}$，$E_QX_1=0$。错误密度 $e^{B_1-1/2}$ 仍可定义概率测度，但此时 $B_t-t$ 才是新 Brownian，因而 $X_t=4t+2(B_t-t)$，终值均值变成 $4$。这说明归一化正确不等于漂移方向正确。

正确 $Q$ 下 $\operatorname{Cov}(X_s,X_t)=4\min(s,t)$，所以

$$
\operatorname{Var}(A_2)=\tfrac14\cdot2+\tfrac1{16}\cdot4
+2\cdot\tfrac12\cdot\tfrac14\cdot2=\tfrac54.
$$

连续积分方差为 $4/3$，两段梯形值为 $5/4$；要分别核对测度、离散规则与矩，不能拿一幅接近的曲线代替这三项证据。

</details>

**可评分迁移（二维秩检验）**：设两只贴现风险资产满足

$$
d\widetilde S_t^1=dB_t^1,\qquad d\widetilde S_t^2=dB_t^1+dB_t^2,
$$

某贴现索赔的表示核为 $h=(2,-1)^\top$。求持仓 $(\Delta^1,\Delta^2)$；再把第二只资产改成 $d\widetilde S_t^2=2dB_t^1$，判断 $B_T^2$ 能否复制。

<details markdown="1"><summary>独立作答后核对</summary>

第一种扩散矩阵的两行是 $(1,0)$、$(1,1)$，满秩；解
$\Delta^1(1,0)+\Delta^2(1,1)=(2,-1)$ 得 $(\Delta^1,\Delta^2)=(3,-1)$。改动后两行都在 $(1,0)$ 方向，秩为 1，任何自融资组合的 $dB^2$ 系数都是 0，因此终值依赖 $B_T^2$ 的索赔不能复制。

</details>

---

*随机分析完卷。概率与分析线还剩现代 PDE 三页；统计与学习线（渐近统计、SLT、MDP）在侧栏等待。*

继续[连续时间路径熵与控制](bridge-17-continuous-control.html)，用完整高斯模型对照终端倾斜、Doob漂移、条件桥与路径能量。
