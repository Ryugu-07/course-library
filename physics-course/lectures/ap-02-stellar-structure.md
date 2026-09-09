# 天体 II · 恒星结构与演化

> **对标**：Kippenhahn & Weigert《Stellar Structure and Evolution》/ Prialnik / Clayton ｜ **前置**：[辐射转移](ap-01-radiative.html)、[热力学](sm-01-thermodynamics.html)、[对流失稳](fl-04-instability.html)
> 恒星的结构需要同时满足力、质量和能量的平衡。给定对称性、边界、物态、组成与输运闭合后，四个结构方程可以构造一个模型；把这句话推广成“唯一确定真实恒星”通常被称为 Vogt–Russell 关系或猜想，而不是严格定理。本页先把结构账本立稳，再说明哪些主序与演化结论需要额外物理。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="stellar-structure-learning-title">

## 学习层：一层层的壳，怎样把恒星撑住？

<h3 id="stellar-structure-learning-title">1. 具身情境：把恒星切成同心薄壳</h3>

想象把一颗静止、球对称的恒星切成许多同心薄壳。半径 $r$ 内的质量 $m(r)$ 向内拉；外侧壳层的压力差向外顶。平衡不是“压力很大”一句话，而是每一层都满足

$$
\frac{dP}{dr}=-\frac{Gm\rho}{r^2},\qquad \frac{dm}{dr}=4\pi r^2\rho.
$$

下面的玩具把物态固定为多方关系 $P=K\rho^{1+1/n}$，用 Lane–Emden 的无量纲函数 $\theta(\xi)$ 逐步积分；它让中心、表面、质量、半径和维里账本都能被追踪。

<h3>2. 先预测：表面和维里哪两行应该对账？</h3>

先不打开实验台，预测：

- 从中心向外走到第一零点时，$\theta$、$\rho$ 和 $P$ 是否在同一表面同时归零？为什么这需要 $n>0$？
- 若外部表面压力取 $P(R)=0$，静力平衡的积分账本是否满足 $3\int P\,dV+\Omega\approx0$？
- 把中心密度从 $1$ 调到 $4$ 会不会改变同一个 $n$ 的无量纲零点 $\xi_1$？

<h3>3. 形式桥：Lane–Emden 到 M、R 与维里</h3>

令 $r=a\xi$、$\rho=\rho_c\theta^n$、$P=P_c\theta^{n+1}$，则

$$
\frac{1}{\xi^2}\frac{d}{d\xi}\left(\xi^2\frac{d\theta}{d\xi}\right)+\theta^n=0,
\quad \theta(0)=1,\quad \theta'(0)=0.
$$

本实验从正则中心展开式起步，找到第一个零点 $\xi_1$，并取

$$
a^2=\frac{(n+1)K\rho_c^{1/n-1}}{4\pi G},\quad R=a\xi_1,\quad
M=4\pi a^3\rho_c\big(-\xi_1^2\theta'(\xi_1)\big).
$$

对 $n<5$ 的这个零外压多方球，实验独立积分 $\Omega=-\int_0^M(Gm/r)\,dm$ 与 $3\int P\,dV$，并用解析恒等式 $\Omega=-\frac{3}{5-n}\frac{GM^2}{R}$ 交叉检查，把静力方程的积分结果翻译成维里残差。$n$、$K$ 和 $\rho_c$ 是模型输入，不是观测到的“恒星演化按钮”。

<div class="learning-lab" data-learning-lab="stellar-structure" markdown="1">

**无 JavaScript 时的静态读法（示范单位 $K=G=\rho_c=1$）：**

| 多方模型 | $\xi_1$ | $R$ | $M$ | $P(R)$ | $3\int P\,dV+\Omega$ |
|---|---:|---:|---:|---:|---:|
| $n=1.5$ | $3.65375$ | $1.62969$ | $3.02638$ | $0$ | $-6.0\times10^{-9}$ |
| $n=3$ | $6.89685$ | $3.89113$ | $4.55467$ | $0$ | $5.7\times10^{-12}$ |

中心条件是 $m(0)=0,\theta(0)=1,\theta'(0)=0$；表面条件是第一零点 $\theta(\xi_1)=0$，因此这里的外压为零。有限步长带来表中小残差；它不是新的物理常数。

</div>

<h3>4. 误区 / 边界：这个玩具没有偷偷包含什么？</h3>

- **假设是模型的一部分**：这里是 牛顿引力、静态、球对称、无旋转无磁场的静力模型；EOS 是固定多方关系。
- **不透明度与能量输运缺席**：没有 $\kappa$、辐射/对流温度梯度、核能率 $\epsilon$ 或 $dL/dr$，所以实验不能预测光度、主序寿命或演化路径。
- **维里项有边界条件**：若表面压力不为零，积分维里关系会带表面项；本页的 $3\int P\,dV+\Omega\approx0$ 依赖 $P(R)=0$。
- **多方曲线不是恒星族谱**：改变 $n$、$K$ 或 $\rho_c$ 得到的是一族 多方结构；不能把它们当成普遍的质量–光度律或真实恒星演化序列。
- **数值账本不是定理证明**：RK4 与有限步长检验这个具体模型；结构方程的一般存在性、稳定性和演化还需额外分析。

大质量恒星的核心坍缩超新星也不能只按初始质量贴标签：氢包层仍在时观测上归入 II 型；氢包层被风或伴星剥掉、氦层仍在时归入 Ib；氢和氦都被剥掉时归入 Ic。剥离程度取决于质量损失、金属丰度和双星相互作用，因此 II/Ib/Ic 是包层与谱线边界，不是一个只由 $M_{\rm ZAMS}$ 决定的硬质量阈值。

<h3>5. 回到正式语言</h3>

完整恒星结构还需把静力平衡、质量守恒、能量守恒和能量输运与 $P(\rho,T)$、$\kappa(\rho,T)$、$\epsilon(\rho,T)$ 及组成演化耦合。这个实验只计算静力平衡与给定状态方程，因此它适合检查边界和量纲，不适合替代恒星演化计算。

<h3>6. 迁移题</h3>

若把表面压力改成非零的 $P_s$，试从静力方程积分推断维里账本会多出哪一项。再说明为什么同一个无量纲 $n$ 的剖面，在改变 $K$ 或 $\rho_c$ 后可以改变 $M$、$R$ 和 $P_c$，却不自动得到一条真实主序演化轨迹。

</section>

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="可横向滚动的多方尺度与赫罗图读法" style="overflow-x:auto">
<img src="assets/img/ap-02-stellar-hr.svg" alt="固定多方指数的质量半径尺度关系，以及由Stefan-Boltzmann定义得到的赫罗图等半径线" style="width:100%;min-width:760px;max-width:none">
</div>
<figcaption><span class="fig-id">图 ap-02.1</span>左：固定 K、G 时改变中心密度，n=1.5 与 n=3 的相对 M、R 变化不同。右：赫罗图中的等半径线直接由 L=4πR²σT⁴ 生成；它们帮助读懂“同温度而更亮意味着半径更大”。本图不把任意连线标成某颗恒星的演化轨迹。</figcaption>
</figure>

## 1. 从薄壳平衡推到 Lane–Emden 方程

薄壳的质量为 $dm=4\pi r^2\rho\,dr$，内外压差提供的合力为 $-4\pi r^2(dP/dr)dr$，恰与 $Gm\,dm/r^2$ 平衡。要消去未知的 $m(r)$，先将静力方程改写成 $r^2P'/\rho=-Gm$，再求导：

$$
\frac{1}{r^2}\frac{d}{dr}\left(\frac{r^2}{\rho}\frac{dP}{dr}\right)=-4\pi G\rho.
$$

代入 $P=K\rho^{1+1/n}$、$\rho=\rho_c\theta^n$，有 $P'/\rho=(n+1)K\rho_c^{1/n}\,d\theta/dr$。选择

$$
a^2=\frac{(n+1)K\rho_c^{1/n-1}}{4\pi G},\qquad r=a\xi,
$$

恰好消掉方程前的量纲系数，得到 $\theta''+2\theta'/\xi=-\theta^n$。这里 $K$ 的单位随 $n$ 改变；实验的 $K=G=1$ 是每个多方模型各自选定的示范单位，不是比较不同状态方程时默认相同的 SI 常数。

中心看似有 $2\theta'/\xi$ 奇点。令正则解 $\theta=1+A\xi^2+B\xi^4+\cdots$ 代入，常数项给 $6A=-1$、二次项给 $20B=-nA$，于是

$$
\theta=1-\frac{\xi^2}{6}+\frac{n\xi^4}{120}-\frac{n(8n-5)\xi^6}{15120}+O(\xi^8).
$$

实验从此展开起步，RK4 同步推进 $\theta,\theta'$ 与两个能量积分，跨越零点后用步内二分定位第一零点。负 $\theta$ 不继续解释为分数幂的物质密度。可输入的数值范围为 $1\le n\le4.5$，并限制步长、搜索半径和工作量；未找到表面会明确失败，不把截断端点当表面。

对方程积分，$\mathcal M(\xi)=-\xi^2\theta'=\int_0^\xi t^2\theta(t)^n dt$。因此

$$
R=a\xi_1,\qquad M=4\pi a^3\rho_c\mathcal M(\xi_1),
$$

$$
R\propto K^{1/2}G^{-1/2}\rho_c^{(1-n)/(2n)},\qquad
M\propto K^{3/2}G^{-3/2}\rho_c^{(3-n)/(2n)}.
$$

在同一个 $n$ 下，中心密度不改变无量纲形状。$n=1.5$ 时 $R\propto\rho_c^{-1/6}$、$M\propto\rho_c^{1/2}$；$n=3$ 时 $M$ 与 $\rho_c$ 无关，$R\propto\rho_c^{-1/3}$。这只是静力结构族，不包含核燃烧或时间箭头。

一个可手算的校准是 $n=1$：$\theta=\sin\xi/\xi$，$\xi_1=\pi$、$\mathcal M(\xi_1)=\pi$。相反，$n=5$ 的 $\theta=(1+\xi^2/3)^{-1/2}$ 没有有限零点；不能无限等候一个并不存在的有限表面。[Princeton，Polytropes](https://www.astro.princeton.edu/~gk/A403/polytrop.pdf)

## 2. 维里关系约束什么，又没有保证什么？

将静力方程乘以 $4\pi r^3dr$ 并从中心积分至半径 $R$。左侧分部积分，右侧用 $dm=4\pi r^2\rho dr$：

$$
4\pi R^3P_s-3\int P\,dV
=-\int_0^M\frac{Gm}{r}\,dm\equiv\Omega,
$$

$$
\boxed{3\int P\,dV+\Omega=3P_sV},\qquad V=\frac{4\pi R^3}{3}.
$$

这就是压力必须作体积积分的原因：$P_c$ 的单位是能量密度，不能直接与引力能相加。零外压多方球的解析引力能也可以从这里推出来：定义比焓 $h=\int dP/\rho=(n+1)P/\rho$，静力方程给 $h+\Phi=\Phi(R)=-GM/R$，其中引力势在无穷远取零。乘 $\rho$ 作体积积分，并用 $\int\rho\Phi\,dV=2\Omega$，得到

$$
(n+1)\int P\,dV+2\Omega=-\frac{GM^2}{R}.
$$

代入零外压维里关系，便有 $\Omega=-3GM^2/[(5-n)R]$。实验将它与独立壳积分比较，而非用同一个公式在两边制造恒等残差。

**负热容需要热力学条件。** 对固定粒子数、单原子非相对论理想气体主导、可忽略表面项与整体运动的准静态星体，$U=\tfrac32\int P\,dV$，故 $2U+\Omega=0$、$E=U+\Omega=-U$。若通过辐射损失总能量而没有其他源项，$dE<0$ 对应 $dU>0$，质量加权温度上升。这不是局部材料热容变成负数；辐射压、简并、核能、质量损失及非静力过程会改变上述账本。仅给出 $P(\rho)$ 也不足以确定 $U$，还需要热能状态方程。

**平衡不等于稳定。** 一个简单径向检验是固定质量、同形缩放 $R\mapsto\lambda R$，若扰动绝热指数恒为 $\Gamma_1$，则 $U(\lambda)=U_0\lambda^{-3(\Gamma_1-1)}$、$\Omega(\lambda)=\Omega_0/\lambda$。记 $q=3(\Gamma_1-1)$，平衡给 $qU_0+\Omega_0=0$，而

$$
E''(1)=q(q-1)U_0.
$$

因此这一受限扰动族中 $\Gamma_1>4/3$ 才有正曲率，等于 $4/3$ 是边界。一般恒星的径向模、热稳定性与非径向对流还要分别求解，不能由一个静力剖面或负热容口号全部证明。多方指数 $n$ 描述平衡结构，不应未经热力学说明就令 $\Gamma_1=1+1/n$。

## 3. 真正的恒星还缺哪两本账？

在球对称、缓慢演化的牛顿模型中，前两式控制质量与压力，后两式控制能量与温度：

$$
\frac{dm}{dr}=4\pi r^2\rho,\qquad
\frac{dP}{dr}=-\frac{Gm\rho}{r^2},
$$

$$
\frac{dL}{dr}=4\pi r^2\rho\left(\epsilon_{\rm nuc}-\epsilon_\nu-\frac{Du}{Dt}-P\frac{D(1/\rho)}{Dt}\right),\qquad
\frac{dT}{dr}=\frac{T}{P}\nabla\frac{dP}{dr}.
$$

$u$ 是比内能，$\epsilon_{\rm nuc},\epsilon_\nu$ 分别是每单位质量的核能输入与中微子损失，单位均为 $\mathrm{W\,kg^{-1}}$；$D/Dt$ 沿质量壳。核反应静质量能记入 $\epsilon_{\rm nuc}$、不在 $u$ 重复计入。固定组成时，热力学第一定律可把后两个热项合为 $-T Ds/Dt$。只有热平衡等条件成立时，才能简化成核能率单独决定 $dL/dr$。[Pols，ch.7](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/chapter7-8.pdf)

光学厚、局部近热平衡的辐射扩散给

$$
F_{\rm rad}=-\frac{16\sigma_{\rm SB}T^3}{3\kappa_R\rho}\frac{dT}{dr},\qquad
\nabla_{\rm rad}=\frac{3\kappa_RLP}{64\pi\sigma_{\rm SB}GmT^4}.
$$

$\kappa_R$ 为每质量的 Rosseland 平均不透明度。成分均匀且小团块作近绝热位移时，$\nabla_{\rm rad}>\nabla_{\rm ad}$ 是 Schwarzschild 对流失稳条件。成分梯度需要 Ledoux 等扩展；对流出现后，实际梯度由辐射与对流通量共同决定，只在对流很高效时才近似绝热。表面稀薄层不能继续无条件使用扩散近似，需要与上一页的大气边界匹配。

## 4. 质光关系不能只写一个指数

在同源、理想气体主导、固定平均分子量 $\mu$ 的辐射模型中，量级关系 $\rho\sim M/R^3$、$T\sim\mu GM/R$（省略固定的粒子质量与 $k_B$）代入辐射扩散，得到

$$
L\sim\frac{T^4R}{\kappa\rho}.
$$

若 $\kappa=\kappa_0\rho^aT^b$，保留所有 $M,R$ 次幂：

$$
\boxed{L\propto\kappa_0^{-1}\mu^{4-b}M^{3-a-b}R^{3a+b}}.
$$

常不透明度给 $L\propto\mu^4M^3/\kappa_0$；Kramers 的 $a=1,b=-7/2$ 则给 $L\propto\mu^{7.5}M^{5.5}R^{-0.5}/\kappa_0$，**还保留半径**。必须再联立核反应与结构，才能消去它；不能把 Kramers 一词当成 $M^{3.5}$ 的推导。

主序寿命粗估为 $t_{\rm MS}\sim fXM Q_H/L$，其中 $X$ 是氢质量分数、$f$ 是可参与燃烧的质量比例，$Q_H$ 是每单位氢质量释放的能量。若人为在一段质量区间采用 $L\propto M^{3.5}$、固定 $fX$ 并用太阳 $10^{10}$ 年归一化，那么 $10M_\odot$ 给 $3.16\times10^7$ 年；这是条件化估计。对流核心与混合会改变 $f$，所以不能把它外推为所有恒星的精确寿命公式。

氢稳定燃烧下限在近太阳组成下约为 $0.08M_\odot$，组成会改变阈值。大质量端的辐射力可用 $\Gamma_{\rm Edd}=\kappa_F L/(4\pi cGM)$ 比较引力；这是与通量平均不透明度、光度有关的力比，不是固定的“100个太阳质量上限”。更多输运、质量损失与吸积问题见[吸积与高能辐射](ap-05-accretion.html)。

## 5. 演化分支与观测：看条件，不背唯一流程

离开主序后，核心与包层不必一起收缩。核心氢耗尽可形成收缩核心与氢燃烧壳，外层则可能膨胀、冷却；在赫罗图上这表现为有效温度降低而光度增加。赫罗图纵轴是 $L$，横轴是 $T_{\rm eff}$ 且常向左增大；由 $L\propto R^2T_{\rm eff}^4$ 可独立读出半径，而演化轨迹必须来自相应组成、质量和混合模型的时间计算。

| 条件／阶段 | 可能发生的过程与边界 |
|---|---|
| 能达到氦点火的低质量恒星，氦核已简并 | 氦点火可热失控，随后核心膨胀解除简并；氦闪不等于把整颗星炸成超新星 |
| 中等质量、氦点火时核心未强简并 | 氦可以较平稳点燃；不能把全部 $M\lesssim8M_\odot$ 都写成氦闪 |
| 核心氦燃烧结束、双壳燃烧阶段 | 可经历渐近巨星支、热脉冲与质量损失；最终遗迹和是否有可见行星状星云取决于后续条件 |
| 能继续高级燃烧的大质量核心 | 可经历碳、氖、氧、硅等阶段；时标依质量、结构与中微子冷却而变，不固定为统一“一天” |
| 最低质量、长寿命主序星 | 寿命可超过当前宇宙年龄，其远未来路径不能用太阳的一条演化链代替 |

近太阳组成的模型中，简并氦点火与较平稳氦点火的分界常在约 $2M_\odot$ 附近，但混合、组成与质量损失会移动它。核心坍缩后可留下中子星或黑洞；II、Ib、Ic 的谱型与外层氢／氦及可见谱线有关，受双星剥离和星风影响，不能只根据初始质量指定。[Pols，ch.9–11，尤其§10.3](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/chapter9-11.pdf)

星团提供近似共同距离和年龄的样本。主序转折点可与等龄线模型比较来估计年龄，但双星、年龄展宽、多族群组成、消光与模型混合参数仍需处理。日震学通过振荡频率约束太阳内部声速等剖面；它是检验内部模型的证据，不应写成对所有微观输入和输运假设的无条件证明。

## 6. 迁移练习

1. 外界压力为 $P_s>0$ 时，补全维里账本。若单原子理想气体与零外压条件成立、总能量缓慢减少 $\Delta E=-Q$，则 $\Delta U$ 与 $\Delta\Omega$ 分别是多少？
2. 固定 $K,G$，将中心密度乘 4。分别求 $n=1.5$ 与 $n=3$ 的半径、质量比。为什么 $n=3$ 的质量不变不代表计算器失灵？
3. 用同源标度推 Kramers 情形的 $M,R$ 指数。若再人为取 $R\propto M^{0.8}$，得到的 $L$ 指数是多少？这能否单独证明观测主序满足该关系？另用 $n=1$ 解析解核对第一零点与表面无量纲质量。

<details class="answer" markdown="1">
<summary>展开核对尺度、能量与条件</summary>

**1.** $3\int P\,dV+\Omega=3P_sV$。零外压理想气体给 $E=-U=\Omega/2$，所以 $\Delta U=Q$、$\Delta\Omega=-2Q$。若有核能、质量损失或其他能量项，不能继续把观测辐射全等同于 $-\Delta E$。

**2.** $n=1.5$：$R_2/R_1=4^{-1/6}\simeq0.7937$、$M_2/M_1=2$；$n=3$：$R_2/R_1=4^{-1/3}\simeq0.6300$、$M_2/M_1=1$。后者来自尺度中的 $\rho_c$ 次幂恰好抵消，不代表半径、中心压力或稳定性也相同。

**3.** $3-a-b=5.5$、$3a+b=-0.5$，故额外半径律给 $L\propto M^{5.1}$。它体现假设组合的输出，不能取代数据或完整结构解。$\theta=\sin\xi/\xi$ 的第一零点为 $\pi$，而 $-\xi^2\theta'=\sin\xi-\xi\cos\xi$ 在该处为 $\pi$。

</details>

**离页检查：**能从薄壳得到无量纲方程；能从分部积分写出表面压力项；能指出热平衡、静力平衡与稳定性的区别；能解释为何一张静力剖面没有演化时间。下一页进入[核合成与元素起源](ap-03-nucleosynthesis.html)，补上核反应产能与丰度账本。
