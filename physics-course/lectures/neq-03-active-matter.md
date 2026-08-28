# 非平衡统计 III · 主动物质与持续随机游走

> **对标**：Marchetti et al.《Hydrodynamics of soft active matter》/ Bechinger et al.《Active particles in complex and crowded environments》/ Cates & Tailleur ｜ **前置**：neq-01、neq-02、fl-01
> 一只主动粒子即使没有外力，也能靠内部能量消耗持续游动。它的短时间位移可以是弹道的，长时间位移又会扩散；但“有效扩散更大”不等于系统回到了热平衡。本页用二维 active Brownian particle（ABP）得到精确的均方位移，并把它和被动粒子的 Einstein/FDT 关系逐项对照。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="active-matter-learning-title">

<h2 id="active-matter-learning-title">学习层：会自己推进的粒子，为什么仍会扩散？</h2>

### 1. 先预测：直线、扩散，还是两者都对？

对二维粒子，位置为 $\mathbf r(t)$，朝向为 $\mathbf p=(\cos\theta,\sin\theta)$。打开实验前判断：

1. 当推进速度 $v_0>0$、观察时间很短时，均方位移（MSD）更接近 $t$ 还是 $t^2$？
2. 旋转扩散率 $D_r$ 加倍，长时间的主动扩散贡献 $D_{\rm act}$ 加倍、减半，还是不变？
3. 当 $v_0=0$ 且 $D_t=\mu k_BT$ 时，MSD 是否回到平衡布朗运动？
4. 当主动推进打开时，能否只把总扩散系数代入 FDT，就宣布系统处于热平衡？

实验先隐藏曲线。揭示后可调 $v_0,D_r,D_t$ 和读数时刻，比较精确 ABP MSD、短时弹道近似、长时扩散渐近线以及一个被动 FDT 参考线；主动项和热噪声项会分别列账。

### 2. 最小模型：推进、平移噪声和转向噪声

取过阻尼二维 ABP：

$$
\dot{\mathbf r}=v_0\mathbf p(\theta)+\sqrt{2D_t}\,\boldsymbol\xi(t),
\qquad
\dot\theta=\sqrt{2D_r}\,\eta(t),
$$

其中 $\xi,\eta$ 是单位白噪声，$D_t$ 的单位是 $\mu\mathrm m^2/\mathrm s$，$D_r$ 的单位是 $\mathrm s^{-1}$。二维旋转扩散让方向相关衰减为

$$
\langle\mathbf p(t)\cdot\mathbf p(0)\rangle=e^{-D_rt}.
$$

这个相关时间 $\tau_r=1/D_r$ 是持续运动的记忆时间；持久长度为 $\ell_p=v_0/D_r$。

### 3. 从速度相关到 MSD：一条可核对的推导

位移是速度的时间积分。平移热噪声贡献 $4D_tt$；主动速度的相关积分给

$$
\begin{aligned}
\langle|\Delta\mathbf r(t)|^2\rangle
&=4D_tt+2v_0^2\int_0^t(t-s)e^{-D_rs}ds\\
&=4D_tt+\frac{2v_0^2}{D_r^2}
\left(D_rt-1+e^{-D_rt}\right).
\end{aligned}
$$

短时间展开 $e^{-D_rt}=1-D_rt+(D_rt)^2/2+\cdots$，因此

$$
\mathrm{MSD}(t)\simeq4D_tt+v_0^2t^2\quad(t\ll\tau_r).
$$

长时间 $t\gg\tau_r$ 时，定义二维有效扩散系数

$$
D_{\rm eff}=D_t+D_{\rm act},
\qquad
D_{\rm act}=\frac{v_0^2}{2D_r},
$$

就有 $\mathrm{MSD}\simeq4D_{\rm eff}t-2v_0^2/D_r^2$。常数负偏移表示“渐近直线”只在足够长时间才是好近似，并不影响长时斜率。

### 4. 静态 fallback：默认主动粒子的数字

实验默认取 $v_0=2\ \mu\mathrm m/\mathrm s$、$D_r=0.5\ \mathrm s^{-1}$、$D_t=0.2\ \mu\mathrm m^2/\mathrm s$，并以 $D_{\rm eq}=\mu k_BT=0.2\ \mu\mathrm m^2/\mathrm s$ 作被动平衡参考。代入同一条 MSD 公式：

<div class="learning-lab" data-learning-lab="physics-active-matter" markdown="1">

**无 JavaScript 时的静态读法：**二维模型的主动项为

$$
\mathrm{MSD}_{\rm act}(t)=\frac{2v_0^2}{D_r^2}(D_rt-1+e^{-D_rt}),
$$

被动项为 $4D_tt$。默认参数的持久时间是 $2\ \mathrm s$，持久长度是 $4\ \mu\mathrm m$。

| 账本 | 公式 | 默认结果 |
|---|---|---:|
| 主动扩散贡献 | $D_{\rm act}=v_0^2/(2D_r)$ | $4\ \mu\mathrm m^2/\mathrm s$ |
| 长时总扩散 | $D_{\rm eff}=D_t+D_{\rm act}$ | $4.2\ \mu\mathrm m^2/\mathrm s$ |
| $t=0.5\ \mathrm s$ 的 MSD | 精确式 | $1.3216\ \mu\mathrm m^2$ |
| $t=2\ \mathrm s$ 的 MSD | 精确式 | $13.3721\ \mu\mathrm m^2$ |
| $t=5\ \mathrm s$ 的 MSD | 精确式 | $54.6267\ \mu\mathrm m^2$ |
| 被动 FDT 参考斜率 | $4D_{\rm eq}t$ | $0.8t\ \mu\mathrm m^2$ |
| 主动长时/被动参考扩散比 | $D_{\rm eff}/D_{\rm eq}$ | $21$ |

短时 $t\ll2\ \mathrm s$ 时主动项近似 $v_0^2t^2=4t^2$；长时斜率趋于 $4D_{\rm eff}=16.8\ \mu\mathrm m^2/\mathrm s$。若把 $v_0$ 拖到 0，主动项消失；只有在同时满足 $D_t=\mu k_BT$ 的被动模型中，才可用 Einstein 关系把扩散与迁移率、温度相连。

**反例与迁移：**MSD 看起来像一条扩散直线，并不能证明详细平衡。主动稳态有持续能量输入、熵产生和方向性通量；不同 observable 或频率得到的“有效温度”可以不同。要判断是否平衡，需检查响应、涨落、时间反演和能量耗散，而不只拟合一个 $D_{\rm eff}$。

</div>

### 5. 边界和迁移任务

- $D_r\to0$ 时方向几乎不转，主动项应趋向 $v_0^2t^2$；直接把 $v_0^2/(2D_r)$ 当成有限的长期扩散系数会失效，因为“长期”必须晚于 $1/D_r$。
- 本实验是稀薄、无相互作用、平面无限介质中的 ABP。拥挤、壁面、流体耦合、趋化、粒子间排斥和集体相变会改变方向相关与 MSD。
- 平衡 FDT 的参考线只是一条条件化基线，不是给主动体系贴上的温度标签。

迁移题：若实验只给出 $t=10$ s 的 MSD 斜率，先估计 $D_{\rm eff}$，再设计一个短时测量区分“热噪声更大”和“主动推进更强”：检查 $t^2$ 区域、方向自相关和对外场的响应，而不是只看一个长时斜率。

</section>

## 1. 非平衡的最小标志：持续能量流

被动胶体在热浴中受到摩擦和热噪声。过阻尼 Langevin 方程可写成

$$
\dot{\mathbf r}=\mu\mathbf F+\sqrt{2D_t}\,\boldsymbol\xi,
\qquad D_t=\mu k_BT
$$

（最后一个等式是平衡 Einstein 关系的条件形式）。它反映涨落和耗散来自同一热浴；若没有外力，平均位移为零，长时间 MSD 为 $4D_tt$。

主动粒子多出一个内部产生的速度 $v_0\mathbf p$。细菌用鞭毛、合成 Janus 粒子用化学反应、细胞用马达和细胞骨架持续消耗自由能，把内部化学过程转成机械通量。宏观上可以仍用 Langevin 形式记账，但 $v_0\mathbf p$ 不是来自与热噪声配套的平衡摩擦项；它使详细平衡一般被破坏。

因此“主动”不是“温度更高”的同义词。提高温度会同时改变热噪声和耗散；增加 $v_0$ 则首先改变定向推进和时间反演性质。只有在一个非常有限的低阶 observable、频段和稀释极限里，才可能用有效温度做近似比较。

## 2. 方向记忆如何生成弹道—扩散交叉

方向角作布朗运动：$\langle[\theta(t)-\theta(0)]^2\rangle=2D_rt$。在二维中，指数 $e^{-D_rt}$ 来自 $\langle e^{i[\theta(t)-\theta(0)]}\rangle$；所以速度相关是

$$
\langle\mathbf v_{\rm act}(t)\cdot\mathbf v_{\rm act}(0)\rangle=v_0^2e^{-D_rt}.
$$

速度相关的面积决定长时扩散。一般地，对平稳零均值速度，$\mathrm{MSD}(t)=2\int_0^t(t-s)C_v(s)ds$（二维向量的点积已包含两个方向）。把指数相关代入就得到学习层公式。

短时方向还没有忘记初始朝向，所以粒子近似沿直线走：$|\Delta\mathbf r|\approx v_0t$，MSD 是 $t^2$。长时许多次转向后，方向记忆被平均掉，主动位移看起来像扩散，且额外扩散为 $v_0^2/(2D_r)$。这里的“像”只指二阶位移统计；轨迹的方向相关和响应仍保留非平衡信息。

## 3. 从单粒子到群体：何时需要水动力学？

单粒子 ABP 只描述稀薄极限。粒子密度提高后，排斥、碰撞和方向对齐会进入连续场方程，典型场包括密度 $\rho$、极化 $\mathbf P$ 和应力。主动应力能在没有外部机械力时推动流体，边界附近会产生取向层和异常压力，粒子之间的非互易耦合还可能生成群体运动。

这些现象不能由把 $D_t$ 换成 $D_{\rm eff}$ 完成。$D_{\rm eff}$ 只回答某个时间区间的单粒子二阶位移；群体的守恒方程、极化松弛、相互作用和边界通量需要另外写出。学习层的图故意只画单粒子解析 MSD，让参数和结论的适用域可追踪。

## 4. 主动系统为什么不自动满足 FDT？

在平衡态，线性响应的耗散部可以和对称涨落通过温度因子联系；neq-02 的 Kubo 页面把响应写成 retarded commutator。主动态中，稳态分布通常不是由一个 Boltzmann 权重产生的，且推进、转向噪声和摩擦不一定来自同一温浴。于是同一个“有效温度”无法保证所有频率、所有方向和所有 observable 都满足同一比例。

一个具体反例是默认参数：被动参考 $D_{\rm eq}=0.2$，主动长时 $D_{\rm eff}=4.2$，二者比为 $21$。若只看 MSD，可能想把 $T$ 乘 21；但测量方向自相关、对小力的迁移率或近壁压力时，通常不会得到同一个因子。这个差异不是拟合失败，而是非平衡驱动留下的物理信息。

## 5. 三个检查题

**例 1（短时）** 默认 $v_0=2$、$t=0.1$ s 时主动弹道项约为 $0.04\ \mu\mathrm m^2$，热项为 $0.08\ \mu\mathrm m^2$。在更短时间或更大 $v_0$ 时 $t^2$ 形状会更清楚；不能只用长时斜率推断短时机制。

**例 2（转向）** 保持 $v_0=2$，把 $D_r$ 从 $0.5$ 加到 $1$，$\ell_p$ 从 $4$ 降到 $2\ \mu$m，主动扩散从 $4$ 降到 $2\ \mu\mathrm m^2/\mathrm s$。推进仍然存在，但方向更快忘记。

**例 3（零转向边界）** $D_r=0$ 时粒子若初始方向固定，轨迹是 $\mathbf r(t)-\mathbf r(0)=v_0t\mathbf p$，MSD 的主动部分是 $v_0^2t^2$，不存在有限的长时 $D_{\rm act}$。这说明公式 $v_0^2/(2D_r)$ 需要先满足 $t\gg1/D_r$ 的顺序条件。

## 6. 小结：把“扩散更快”还原成机制

ABP 的推进速度、方向记忆与热噪声共同决定 MSD。短时看见 $t^2$，长时看见 $4D_{\rm eff}t$，而 $D_{\rm act}=v_0^2/(2D_r)$ 说明转向越慢，持续运动越能搬运粒子。平衡 Einstein/FDT 只在被动热浴条件下成立；主动项带来能量耗散和时间反演不对称，不能靠一个有效扩散常数抹平。

---

*核心句：主动力可以在二阶位移上伪装成额外温度，却不会因此恢复平衡的响应、涨落与耗散结构。*
