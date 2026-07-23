# 随机微积分 II · SDE、Fokker–Planck 与扩散模型

> 常微分方程加上噪声项就是**随机微分方程（SDE）**——单条路径的演化规则。换到"上帝视角"看全体路径的**分布**如何演化，得到 Fokker–Planck 方程——SDE 与 PDE 的官方桥梁。本页最后与 comfy 课的扩散模型正面对账：**你在 KSampler 里跑的一切，都是本页的方程。**

## 1. SDE：带噪声的动力系统

$$
dX_t = \underbrace{\mu(X_t, t)\,dt}_{\text{漂移: 确定的力}} + \underbrace{\sigma(X_t, t)\,dB_t}_{\text{扩散: 随机的抖}}
$$

含义 = 积分方程 $X_t = X_0 + \int\mu\,ds + \int\sigma\,dB$（后者是上一页的 Itô 积分）。**存在唯一性**：$\mu, \sigma$ Lipschitz + 线性增长 ⇒ 强解存在唯一（与 ode-01 Picard 定理平行——压缩映像在 $L^2$ 路径空间上重跑一遍）。

**数值解（Euler–Maruyama）**：$X_{n+1} = X_n + \mu\,\Delta t + \sigma\sqrt{\Delta t}\,Z_n$（$Z_n \sim N(0,1)$）——数值线 Euler 法 + 一个 $\sqrt{\Delta t}$ 的随机项（**根号**：布朗增量的标度，写成 $\Delta t$ 是新手第一错）。模拟金融路径、Langevin 采样、扩散模型生成全用它或其变体。

## 2. OU 过程：均值回复的原型

$$
dX_t = -\theta X_t\,dt + \sigma\,dB_t \qquad (\theta > 0:\ \text{弹簧拉回原点, 噪声不断踢开})
$$

**求解**（常数变易，ode 手法照搬——乘积分因子 $e^{\theta t}$ 再 Itô 分部）：

$$
X_t = X_0 e^{-\theta t} + \sigma\int_0^t e^{-\theta(t-s)}\,dB_s \;\sim\; N\Big(X_0 e^{-\theta t},\ \frac{\sigma^2}{2\theta}\big(1 - e^{-2\theta t}\big)\Big)
$$

$t \to \infty$：**平稳分布 $N(0, \frac{\sigma^2}{2\theta})$**——初值被遗忘、方差收敛（对比布朗运动方差 $t$ 发散：拉回力驯服了扩散）。三重身份：金融的利率/波动率模型（Vasicek——均值回复是"利率不会跑去无穷"的建模语言）；**AR(1) 的连续时间真身**（时间序列页对账：OU 按 $\Delta t$ 采样恰是 AR(1)）；扩散模型前向加噪的骨架（见 §4）。

## 3. Fokker–Planck：从单路径到分布演化

同一个 SDE 的第二种读法：不问"这条路径去哪"，问"概率云怎么流"。$X_t$ 的密度 $p(x, t)$ 满足 **Fokker–Planck 方程**（前向 Kolmogorov）：

$$
\frac{\partial p}{\partial t} = -\frac{\partial}{\partial x}\big[\mu(x,t)\,p\big] + \frac{1}{2}\frac{\partial^2}{\partial x^2}\big[\sigma^2(x,t)\,p\big]
$$

（漂移项 = 概率的输运，扩散项 = 概率的抹平；推导via Itô 引理取期望 + 分部积分。）

**对账时刻**：纯布朗运动（$\mu = 0, \sigma = 1$）给 $p_t = \frac12 p_{xx}$——**热方程**（pde-02 的"布朗运动是热方程的微观真身"至此闭环：那页的热核 = 本页方程的基本解）。平稳分布 = 令 $\partial_t p = 0$：OU 代入解得高斯 ✓；一般梯度系统 $\mu = -\nabla V$ 给 **$p_\infty \propto e^{-2V/\sigma^2}$**（Boltzmann–Gibbs 分布——统计力学、模拟退火、MCMC 的共同心脏）。

## 4. 扩散模型：本页数学的旗舰应用（comfy 课正式对账）

<figure class="plot" markdown="1">
![扩散前向过程把数据加噪成高斯](assets/img/sde-02-diffusion.svg)
<figcaption><span class="fig-id">图 2.1</span>扩散前向过程把数据分布逐步加噪成高斯——双峰数据被抹平成钟形，正是 comfy 课扩散模型加噪的连续极限。</figcaption>
</figure>

**前向加噪 SDE**（VP-SDE，comfy 课 02 的离散加噪的连续极限）：

$$
dx = -\frac{1}{2}\beta(t)\,x\,dt + \sqrt{\beta(t)}\,dB_t
$$

——**时变系数的 OU 过程**：均值以 $e^{-\frac12\int\beta}$ 衰减、分布流向 $N(0, I)$（§2 的平稳分布机制；那页的 $\sqrt{\bar\alpha_t}$ 与 $1-\bar\alpha_t$ 就是本页 OU 解的均值方差）。

**反向去噪 SDE**（Anderson 1982，comfy 课 03 引用的那条定理）：

$$
dx = \Big[-\frac{1}{2}\beta x - \beta\,\underbrace{\nabla_x \log p_t(x)}_{\text{score}}\Big]dt + \sqrt{\beta}\,d\bar B_t
$$

时间倒流的 SDE 存在，且只需多知道一项——**score**（沿途每个时刻分布的对数梯度）；神经网络 $\epsilon_\theta$ 学的正是它（comfy 课 02 §3.5 的等价性）。**概率流 ODE**：存在与反向 SDE 边际分布完全相同的确定性 ODE（把噪声项换成再加一份 score 漂移）——**采样器下拉框里 ODE 系与 SDE/ancestral 系的分野**（comfy 课 03 的表格），在本页是同一个 Fokker–Planck 方程的两种路径实现。**Langevin 动力学**（$dx = \nabla\log p\,dx + \sqrt2\,dB$：以任意 $p$ 为平稳分布的 SDE——§3 Boltzmann 公式反用）是 score-based 采样的原型，也是 MCMC 家族的一员。

## 5. 典型例题

**例 1（E–M 模拟设计）** 模拟 GBM（$\mu = 0.05, \sigma = 0.2$）一年 252 步：$S_{n+1} = S_n(1 + 0.05\Delta t + 0.2\sqrt{\Delta t}Z_n)$，$\Delta t = \frac{1}{252}$——注意也可用上一页的显式解精确模拟（对数正态逐步采样），**有闭式解时别用数值离散**（数值线的教诲）。

**例 2（OU 半衰期）** Vasicek 利率 $\theta = 0.5$/年：偏离的半衰期 $= \frac{\ln 2}{\theta} \approx 1.4$ 年——"利率冲击约一年半消化一半"，均值回复速度的可读化（把 $\theta$ 翻译成半衰期是汇报模型的好习惯）。

**例 3（平稳分布验证）** 双井势 $V(x) = \frac{(x^2-1)^2}{4}$ 的 Langevin：$p_\infty \propto e^{-2V/\sigma^2}$ 双峰——粒子在两口井间偶尔跳跃（隐喻：非凸损失面上 SGD 的噪声帮助逃离局部井，优化 II 的那句话在此有了严格模型）。$\blacksquare$

---

*下一页：把这套演算对准市场——Delta 对冲推出 Black–Scholes 方程，风险中性定价，以及期权公式里每个符号的含义。*
