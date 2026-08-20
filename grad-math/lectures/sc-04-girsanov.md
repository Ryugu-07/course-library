# 随机分析 IV · Girsanov、鞅表示与 Feynman–Kac

> **对标**：Øksendal §8 / Shreve *SCF-II* §5 ｜ **前置**：sc-01–03、mt-03/04、pde2 线（Feynman–Kac 一节）
> 随机分析收官：三大定理各管金融数学的一根支柱——**Girsanov**（风险中性测度为何存在）、**鞅表示**（为何一切期权都能对冲）、**Feynman–Kac**（SDE 与 PDE 的官方词典）。本科 sde-03 的"风险中性定价"从操作口诀升格为定理体系。

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

先预测四件事，再打开实验：

1. 若 $B_t+\theta t$ 在 $Q$ 下是 Brownian，$dQ/dP$ 的 $B_T$ 项应取正号还是负号？
2. $P$ 下 $X_t=\sigma\theta t+\sigma B_t$，加权后的 $Q$ 下漂移是多少？
3. 常数有限 $\theta$、有限 $T$ 时，$E_P\exp(\frac12\theta^2T)$ 是有限数还是无法判断？
4. 保持样本量不变而增大 $|\theta|$，ESS 会更均匀还是更集中？

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

例如 $X_T$ 的目标矩是 $E^Q[X_T]=0$、$E^Q[X_T^2]=\sigma^2T$；路径量 $A_T=\int_0^T X_tdt$ 也应在 $Q$ 下有零均值。实验把同一批增量代入这些加权平均，并同时报告原始权重均值、归一化和、ESS 与目标矩。

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

## 1. Girsanov 定理：换测度 = 换漂移

**动机**：本科 sde-03 里"把 $\mu$ 换成 $r$"是黑箱操作。真相：**换一个概率测度，布朗运动的漂移就变了**。

**定理（Girsanov）** $\theta_t$ 适应且满足 Novikov 条件 $E\exp\big(\frac12\int_0^T\theta^2dt\big) < \infty$。定义

$$
Z_T = \exp\Big(-\int_0^T\theta_s\,dB_s - \frac12\int_0^T\theta_s^2\,ds\Big), \qquad \frac{dQ}{dP} = Z_T
$$

则在新测度 $Q$ 下，$\tilde B_t = B_t + \int_0^t\theta_s ds$ 是标准布朗运动。

**【骨架】** 三步：① $Z_t$ 是指数鞅（Itô 公式验证 $dZ = -\theta Z\,dB$，无漂移项——sc-01 §3 鞅③的推广；Novikov 保证真鞅而非仅局部鞅，$EZ_T = 1$ 使 $Q$ 是概率测度）；② 计算 $\tilde B$ 在 $Q$ 下的矩母函数：$E^Q[e^{\lambda\tilde B_t}] = E^P[Z_t e^{\lambda\tilde B_t}]$——两个指数合并配方（高斯配方术），得 $e^{\lambda^2t/2}$；③ 独立增量同法逐段验证，Lévy 刻画（sc-01 §3）收尾。$\blacksquare$

**读法**：**测度变换是"漂移的橡皮擦"**——$P$ 下的 $dX = \mu dt + \sigma dB$ 在 $Q$ 下可改写为 $dX = r\,dt + \sigma d\tilde B$（取 $\theta = \frac{\mu - r}{\sigma}$，**市场风险价格**）。波动率 $\sigma$ 换不掉（二次变差是路径性质，测度等价变换动不了它——sc-01 §2 的定理在此显出深意：**你能改变对世界的概率评估，改不了路径的粗糙度**）。$Z$ 的形态即统计学的似然比——Girsanov 是连续时间的似然比变换（与渐近统计线的 LAN 理论遥相呼应）。

## 2. 鞅表示定理：对冲的存在性执照

**定理** 布朗过滤下的任何平方可积鞅 $M_t$ 必可表示为

$$
M_t = M_0 + \int_0^t h_s\,dB_s \qquad (h \text{ 适应、唯一})
$$

**【引用】**（证明经由"指数鞅的线性组合在 $L^2$ 中稠密"，Øksendal §4.3。）

**金融读法（完备性）**：期权到期收益的条件期望过程 $V_t = E^Q[e^{-r(T-t)}\Phi(S_T)\mid\mathcal{F}_t]$ 是 $Q$-鞅 ⇒ 必可写成对 $d\tilde B$（即对可交易资产 $dS$）的积分——**积分核 $h$ 就是对冲头寸**（Delta）。"任何期权都能动态复制"不是市场经验，是布朗过滤的数学性质；若价格由多源噪声驱动而可交易资产不足（不完备市场），表示定理失效、完美对冲不存在——**模型的完备性 = 噪声源与资产数的匹配**，一句话看穿一大类金融模型的分野。

**定价三段论（本科 sde-03 的完整资格链）**：Girsanov 造 $Q$（漂移全成 $r$）→ 鞅表示保证可对冲 → 无套利定价 $V_0 = E^Q[e^{-rT}\Phi(S_T)]$。Black–Scholes 公式 = 该期望对对数正态的显式积分。

## 3. Feynman–Kac：SDE ⇄ PDE 词典

**定理（Feynman–Kac）** 设 $u(t,x)$ 解终值问题

$$
u_t + \mu(x)u_x + \frac12\sigma^2(x)u_{xx} - r\,u = 0, \qquad u(T, x) = \Phi(x)
$$

（系数良好、$u$ 足够光滑），则

$$
u(t, x) = E\Big[e^{-r(T-t)}\,\Phi(X_T)\;\Big|\;X_t = x\Big], \qquad dX = \mu\,dt + \sigma\,dB
$$

**【证明】** 对 $Y_s = e^{-r(s-t)}u(s, X_s)$ 用 Itô 公式：

$$
dY = e^{-r(s-t)}\Big[\underbrace{u_t + \mu u_x + \tfrac12\sigma^2u_{xx} - ru}_{=\,0\ (\text{PDE})}\Big]ds + e^{-r(s-t)}\sigma u_x\,dB
$$

漂移被 PDE 精确消灭 ⇒ $Y$ 是（局部）鞅；取期望（有界性/局部化论证后）：$u(t,x) = EY_t = EY_T = E[e^{-r(T-t)}\Phi(X_T)]$。$\blacksquare$

**读法**：**PDE 的解 = 沿扩散路径的期望**——两个世界的官方翻译器：Black–Scholes 方程 ⇄ 风险中性期望（sde-03 两条定价路线原是一条）；热方程 ⇄ 布朗运动期望（pde2 线/本科 pde-02 的"热核=转移密度"的定理版）；数值上开出两条路——解 PDE（网格法）或模拟 SDE（Monte Carlo），**维数低走 PDE、维数高走 MC** 的行业分工由此定型。反向词典（生成元、Kolmogorov 前后向方程）与位势项推广同框【引用】。

## 4. 随机分析四页资产盘点

| 定理 | 一句话 | 金融支柱 |
|---|---|---|
| 二次变差（sc-01） | 路径粗糙度 = $t$，不可磨灭 | 已实现波动率 |
| Itô 等距/积分（sc-02） | $L^2$ 等距延拓 | 对冲误差核算 |
| Itô 公式/存在唯一（sc-03） | 新链式法则 + Picard | 模型的合法性 |
| Girsanov / 鞅表示 / F–K（本页） | 换漂移 / 可对冲 / SDE⇄PDE | 定价三段论 |

## 5. 练习与要点

**例 1（Girsanov 亲手换）** GBM 在 $P$ 下 $\mu = 0.1, r = 0.03, \sigma = 0.2$：$\theta = 0.35$，$Q$ 下 $dS = 0.03\,S\,dt + 0.2\,S\,d\tilde B$——写出 $Z_T$ 并验证 $E^Q[S_T] = S_0e^{rT}$（风险中性世界一切资产按 $r$ 增值）。

**例 2（F–K 反向使用）** 用 F–K 表示解热方程 $u_t = \frac12 u_{xx}$（终值改初值、时间反向）：$u(t,x) = E[\varphi(x + B_t)]$ = 高斯卷积——热核公式（本科 pde-02）的三行概率证明。

**例 3（完备性思辨）** 加入随机波动率 $d\sigma = \alpha\,dt + \beta\,dW$（第二个布朗源）：只交易股票与债券时鞅表示对二维过滤失效 ⇒ 波动率风险不可对冲 ⇒ 期权价格不唯一（区间定价）——**Heston 模型要引入"波动率风险价格"参数的数学原因**，也是 IV 曲面（本科 sde-03 §4）存在自由度的深层出处。$\blacksquare$

---

*随机分析完卷。概率与分析线还剩现代 PDE 三页；统计与学习线（渐近统计、SLT、MDP）在侧栏等待。*
