# 随机微积分 III · Black–Scholes、Greeks 与离散对冲

> **对标**：Shreve *Stochastic Calculus for Finance II* §5–7 ｜ **前置**：sde-01、sde-02、概率 II、PDE II
> 这页把三个容易混淆的对象拆开：连续完备市场中的定价定理、无套利的 put-call parity，以及一条固定 seed 的有限次 delta-hedge 场景。最后一个账本有误差并不反驳前两个结论。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="black-scholes-learning-title">

<h2 id="black-scholes-learning-title">学习层：先分清“公式、复制定理、一次路径”</h2>

### 1. 直觉案例：为什么价格里没有股票的历史漂移？

假设股票满足

$$
dS_t=\mu S_t\,dt+\sigma S_t\,dW_t,\qquad dM_t=rM_t\,dt,
$$

其中 $M_t$ 是银行账户。我们要给欧式 call
$C(S,t)=\text{value of }\max(S_T-K,0)$ 定价。

先做四个预测，再打开实验台：

1. 价格公式里的漂移应是历史/场景漂移 $\mu$，还是无风险利率 $r$？
2. 连续复制定理与每隔 $\Delta t$ 调一次仓的路径，哪一个允许出现 terminal hedge error？
3. $T=0$ 时，$d_1,d_2$ 是否仍可直接代入？
4. $\sigma=0$ 时，是“公式发散”，还是风险中性股票路径退化为确定路径？

核心直觉是：持有一份期权、做空 $\Delta$ 股股票时，股票的随机项可以在瞬间被抵消。能被股票直接对冲的方向风险不需要另付风险溢价；剩下的曲率和融资才进入定价方程。

### 2. 形式推导桥：从 Itô 到风险中性价格

对 $\Pi=C-\Delta S$ 用 Itô 引理：

$$
d\Pi=\left(C_t+\mu SC_S+\frac12\sigma^2S^2C_{SS}-\Delta\mu S\right)dt
 +(C_S-\Delta)\sigma S\,dW_t.
$$

取 $\Delta=C_S$，随机项消失；在**无摩擦、可连续交易且市场完备**的模型中，无风险组合只能按 $r$ 增长：

$$
d\Pi=r\Pi\,dt
\quad\Longrightarrow\quad
\boxed{C_t+\frac12\sigma^2S^2C_{SS}+rSC_S-rC=0}.
$$

因此 $\mu$ 在方程中抵消。等价地，在风险中性测度 $Q$ 下，

$$
\begin{aligned}
C_t=C(S_t,t)&=e^{-r\tau}E_t^Q[(S_T-K)^+],\qquad \tau=T-t,\\
dS_t&=rS_t\,dt+\sigma S_t\,dW_t^Q.
\end{aligned}
$$

### 3. 公式、平价和 Greeks：把每一笔放回自己的定义

令 $\tau=T-t>0$，且 $S>0,\sigma>0$：

$$
d_1=\frac{\ln(S/K)+(r+\frac12\sigma^2)\tau}{\sigma\sqrt{\tau}},
\qquad d_2=d_1-\sigma\sqrt{\tau}.
$$

实验台会同时显示

$$
C=S\Phi(d_1)-Ke^{-r\tau}\Phi(d_2),\qquad
P=C-S+Ke^{-r\tau}.
$$

一张到期支付 $K$ 的零息债券在到期时交付现金 $K$，今天的价格是
$Ke^{-r\tau}$。因此，

$$
\begin{aligned}
\text{call}+\text{债券}&\longrightarrow (S_T-K)^+ + K,\\
\text{put}+\text{股票}&\longrightarrow (K-S_T)^+ + S_T.
\end{aligned}
$$

两边都等于 $S_T$，无套利先给出今天的价格关系

$$
C_t+Ke^{-r\tau}=P_t+S_t,
$$

也就是

$$
\boxed{C_t-P_t=S_t-Ke^{-r\tau}}.
$$

不依赖 GBM 的具体分布；它是无套利现金流复制，不是“再加一个波动率公式”。

常用 Greeks（$\Theta=C_t$，按日历时间求导）是

| Greek | call | put |
|---|---|---|
| $\Delta$ | $\Phi(d_1)$ | $\Phi(d_1)-1$ |
| $\Gamma$ | $\frac{\phi(d_1)}{S\sigma\sqrt{\tau}}$ | 同 call |
| Vega | $S\phi(d_1)\sqrt{\tau}$ | 同 call |
| $\Theta$ | $-\frac{S\phi(d_1)\sigma}{2\sqrt{\tau}}-rKe^{-r\tau}\Phi(d_2)$ | $-\frac{S\phi(d_1)\sigma}{2\sqrt{\tau}}+rKe^{-r\tau}\Phi(-d_2)$ |
| $\rho$ | $K\tau e^{-r\tau}\Phi(d_2)$ | $-K\tau e^{-r\tau}\Phi(-d_2)$ |

### 4. 模型边界与常见误读

> **模型边界面板**
>
> - **连续复制**需要 GBM、常数 $r,\sigma$、无摩擦、市场完备和连续交易。
> - **有限网格账本**只生成一个固定 seed 的场景；它不是连续对冲定理，也不是最坏情形误差上界。
> - $\mu$ 不进入 B–S 价格，但可以作为生成路径的场景漂移；不要把“场景路径”读成“定价输入”。
> - $T=0$ 时价格直接是 payoff，$S=K$ 处 payoff 不可微；页内用 $\Delta=1/2$ 作为显示约定，$\Gamma$ 不是普通有限函数。
> - $\sigma=0$ 时风险中性股票确定为 $S_T=Se^{r\tau}$，call 变成 $\max(S-Ke^{-r\tau},0)$；在 forward-ATM $S=Ke^{-r\tau}$ 处，$\Delta$ 是单侧/显示约定，Vega 是 $\sigma\downarrow0$ 的单侧值，$\Gamma,\Theta,\rho$ 标为 unavailable，不能把 $0/0$ 的 $d_1$ 形式硬代进去。
> - 交互边界元数据会把 `one-sided` 与 `unavailable` 写出来；这不改变普通内点的数字 Greeks。

### 5. 确定性实验：先过预测门，再读两本账

预测提交后，实验台显示五个 Greeks、put-call parity 残差、GBM 路径，以及每一行的股票、目标 delta、持股、现金、组合价值和误差。切换“细分”只改变有限次再平衡的场景账本；切换“sigma=0”则把边界行为直接暴露出来。

<div class="learning-lab" data-learning-lab="black-scholes-hedge" markdown="1">

**无 JavaScript 时的静态读法：** 取 $S_0=K=100,r=0.05,\sigma=0.2,T=1$。标准正态函数记作 $\Phi,\phi$。

| 账本 | 公式/静态读数 | 量词 |
|---|---|---|
| 欧式 call | $C=S_0\Phi(d_1)-Ke^{-rT}\Phi(d_2)\approx10.4506$ | 模型价格 |
| 欧式 put | $P=C-S_0+Ke^{-rT}\approx5.5735$ | 由平价核对 |
| 平价残差 | $C-P-(S_0-Ke^{-rT})=0$ | 无套利恒等式 |
| 初始复制组合 | $\Delta_0=\Phi(d_1)$，现金 $=C-\Delta_0S_0$ | 连续理论的起点 |
| 有限路径 | $S_{j+1}=S_j\exp((\mu-\sigma^2/2)\Delta t+\sigma\sqrt{\Delta t}z_j)$ | 固定 seed 的场景 |
| 终点误差 | 最后组合价值 $-$ $(S_T-K)^+$ | **离散场景，不是定理** |
| $T=0$ | $C=(S-K)^+$；$\Delta=1,0$，ATM 显示约定 $1/2$；kink 上 $\Gamma,\text{Vega},\Theta$ unavailable，非 kink 的 $\Theta$ 只取到期前单侧值 | payoff 边界 |
| $\sigma=0$ | $C=\max(S-Ke^{-r\tau},0)$；远离 forward kink 时 $\Gamma=\text{Vega}=0$，forward-ATM 的 $\Delta$ 单侧、Vega 单侧且 $\Gamma,\Theta,\rho$ unavailable | 确定性边界 |

若交互失效，先用前五行复核公式和自融资关系，再把最后一行读成“本条路径在本调仓网格下发生了多少误差”，不要把它改写成“B–S 误差”。

</div>

</section>

## 1. 市场模型与无套利复制

本页的定理性声明有明确前提：

1. 股票按 GBM 演化，波动率 $\sigma$ 与短利率 $r$ 为常数；
2. 可以无摩擦交易、借贷和做空；
3. 交易连续，且股票和银行账户构成完备市场；
4. 期权是欧式，只有到期 payoff，没有提前行权。

若交易有 bid-ask spread、跳跃、随机波动率、融资约束或离散交易，下面的精确公式就变成基准模型，而不是完整现实。

## 2. Black–Scholes 公式与 Greeks

在普通区域 $\tau>0,\sigma>0,S>0$，风险中性解为

$$
C(S,t)=S\Phi(d_1)-Ke^{-r\tau}\Phi(d_2),
\quad
P(S,t)=Ke^{-r\tau}\Phi(-d_2)-S\Phi(-d_1).
$$

这里的 Vega 是对“波动率的一个绝对单位”求导；交易屏幕常把它再除以 $100$ 或按一天缩放。Theta 的符号也取决于日历时间和显示单位，不能只看一个未经标注的数字。

## 3. Put-call parity 的独立地位

持有 call 加上债券与持有 put 加股票的到期现金流分别是

$$
(S_T-K)^+ + K
\quad\text{和}\quad
(K-S_T)^+ + S_T.
$$

第一行中的零息债券今天值 $Ke^{-r\tau}$、到期支付 $K$；两边到期都等于 $S_T$，故今天价值必须满足

$$
C_t+Ke^{-r\tau}=P_t+S_t
\quad\Longleftrightarrow\quad
C_t-P_t=S_t-Ke^{-r\tau}.
$$

这个论证只依赖可复制现金流与无套利；它不需要知道 $\mu$，也不需要先相信 Black–Scholes 的 PDE。

## 4. 连续对冲与离散账本

连续理论的 delta 是 $C_S$。在有限网格 $0=t_0<\cdots<t_n=T$，实验按以下自融资规则记账：

$$
\begin{aligned}
B_{j+1}^{\rm pre}&=B_j e^{r\Delta t},\\
\Delta B_{j+1}&=-(\Delta_{j+1}-\Delta_j)S_{t_{j+1}},\\
V_{j+1}^{\rm hedge}&=\Delta_{j+1}S_{t_{j+1}}+B_{j+1}.
\end{aligned}
$$

到期前一行会再平衡；最后一行保留到期前的持仓，与 $(S_T-K)^+$ 比较。它是一个 deterministic seeded simulation：同一参数会重复同一账本，但它没有替代连续时间极限、概率量词或误差估计。

## 5. 三个检查题

**例 1（漂移隔离）** 把路径生成器的 $\mu$ 从 $0.08$ 改到 $-0.08$，公式价格不应变化；路径和有限对冲误差会变化。这正是定价测度与场景测度的接口。

**例 2（边界先于公式）** 在 $T=0,S=K$ 处，call 的价格为 $0$，但 payoff 的普通导数不存在。一个交互组件选择 $1/2$ 只是可重复的显示 convention，不是宣称 kink 有唯一经典 delta。

**例 3（平价审计）** 若屏幕给出的 $C_t-P_t$ 与 $S_t-Ke^{-r\tau}$ 不同，先检查股息、融资利率、行权/交割约定，再谈波动率模型；平价是最先应审计的现金流恒等式。$\blacksquare$

---

*本页收束随机微积分的金融接口：Itô 引理提供局部账本，delta 对冲消去随机项，风险中性定价给出精确公式；现实交易再用跳跃、随机波动率、交易成本和离散风险把模型边界补回来。*
