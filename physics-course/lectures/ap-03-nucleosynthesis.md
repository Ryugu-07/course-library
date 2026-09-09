# 天体 III · 核合成与元素起源

> **对标**：Clayton《Principles of Stellar Evolution and Nucleosynthesis》/ Rolfs & Rodney / B²FH (1957) ｜ **前置**：[核结构与衰变](nuc-01-structure-decay.html)、[反应截面](nuc-02-reactions-detectors.html)、[WKB 隧穿](qm-06-wkb-variational-adiabatic.html)、[恒星结构](ap-02-stellar-structure.html)
> 太阳中心的典型热能远低于质子间的库仑势垒，它为什么还能持续发光？为什么氢能烧很久，晚期的燃烧却越来越急？本页从“有多少粒子能反应”走到“反应能否赶上环境变化”，再把机制接到元素来源的观测证据。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="nucleosynthesis-network-learning-title">

## 学习层：守恒的账本，是否一定算得准？

<h3 id="nucleosynthesis-network-learning-title">1. 具体情境：六个池子同时转移</h3>

先用六个**有效权重池**理解网络：\(H\to He\to Be8\to C\to O\to Fe\)，初值依次为 \((0.72,0.27,0,0.005,0.005,0)\)。标签借用元素名称，每个 \(Y_i\) 是归一化权重，\(\sum_iY_i=1\)。本模型的“一份从源池转到汇池”不是一次真实核反应，不能从图中读出某颗恒星的元素质量分数。

温度倍数 \(\theta\) 和时间都无量纲；五个有效系数为

$$
(k_1,k_2,k_3,k_4,k_5)=(0.012\theta^4,\ 0.06\theta^{18},\ 3,\ 0.035\theta^8,\ 0.022\theta^6).
$$

这些教学参数制造一个慢入口、温度敏感的桥、快速清空的中间池及两条后续通道，并非核反应数据库拟合。

### 2. 先预测，再揭示

先回答：升温时哪条系数增长更快？默认温度下慢入口使哪个池留存？源减汇加能否守恒？宏观系数很小时是否就能断言反应永远停止？揭示后先看默认情形，再切换高温和冷却；最后保持热史不变，将每大步的子步数从 1 增到 8，比较实线和虚线。

**观察任务**：若两条曲线各自总和都为 1，却彼此不同，应检查守恒，还是检查如何近似“同时反应”？小量看数值表，不以线宽代替数值。

### 3. 正式模型：同时反应与逐条更新

令 \(r_j=k_jY_j\)，不存在的边界通量为 \(r_0=r_6=0\)。同时反应方程为

$$\dot Y_i=r_{i-1}-r_i,\qquad\frac{d}{dt}\sum_{i=1}^6Y_i=0.$$

逐条更新时，对 \(i\to i+1\) 先算

$$\delta_i=Y_i(1-e^{-k_i h}),\qquad Y_i\leftarrow Y_i-\delta_i,\quad Y_{i+1}\leftarrow Y_{i+1}+\delta_i.$$

因为 \(0\le1-e^{-k_i h}\le1\)，每条更新保正、守恒，且精确解了**这一条孤立通道**。但后续通道已经看到刚转来的权重；依次执行五条，一般不等于让五条同时运行。这是 Lie 分裂：固定热史下减小子步 \(h\)，才应逐渐接近同时反应的解。

每大步 \(\Delta t=0.5\)，段内温度固定。恒温取 \(\theta_s=\theta_0\)，冷却取

$$\theta_s=\max(0.12,\theta_0e^{-\gamma s}),\qquad s=0,1,\ldots$$

\(\gamma\) 是**每大步**的冷却指数。增加子步不改变这张分段恒温表。虚线用同一表中的 \(\dot Y=QY\) 作参照：\(Q\) 的前五列各有流出项 \(-k_i\) 和下一行的 \(+k_i\)，第六列为零。取 \(\lambda=\max_i k_i\)、\(P=I+Q/\lambda\)，则 \(P\) 每列非负且和为 1：

$$e^{Q\Delta t}Y=e^{-z}\sum_{n=0}^{\infty}\frac{z^n}{n!}P^nY,\qquad z=\lambda\Delta t.$$

这是以 Poisson 权重混合保正守恒的离散步。算到 \(n=N\)，若 \(z/(N+2)<1\)，余下权重满足

$$R_N\le\frac{e^{-z}z^{N+1}/(N+1)!}{1-z/(N+2)}.$$

实验显示各大步截尾预算之和及 \(\sum_i|Y_i^{\rm split}-Y_i^{\rm ref}|\)。预算仅控制级数截尾，浮点舍入另计；程序不靠重新归一化掩盖误差。

<div class="learning-lab" data-learning-lab="nucleosynthesis-network" markdown="1">

**JavaScript 不可用时：**默认 \(\theta=1\)，\(k_1=0.012\) 是有初始源的四条宏观通道中最慢的系数。第一大步后两种算法都给出 \(Y_H=0.72e^{-0.006}\approx0.715693\)，但 He 同时接收 H 并向 Be8 流出，逐条更新与同时反应不再相同。用上面的矩阵方程和转移量公式分别核对：两种算法守恒不意味着结果相同。

</div>

### 4. 证据与模型边界

“初始最慢宏观系数”只是候选慢通道：实际通量还乘源权重 \(k_iY_i\)，限速也受供给、竞争和反馈影响。红色竖线仅标记 \(\max_{j\in\{1,2,4,5\}}k_j<0.01\) 首次成立的**段起点**，不含 \(k_3=3\)，也不是通量判据。低温恒温也能从第 0 段满足它。冷却有正温度下限，所有系数保持正，所以有限观察窗内的近平台不是无限时间停止反应。

真实核网络常定义每重子丰度 \(\mathcal Y_i=n_i/n_b\)，用质量数 \(A_i\) 核对 \(\sum_iA_i\mathcal Y_i=1\)，按化学计量加减核素。比如 \(2\alpha\leftrightarrow{}^8Be\) 与 \({}^8Be+\alpha\to{}^{12}C+\gamma\) 都显式消耗 He；本实验没有这样计数。真实计算还需要密度、逆反应、弱作用与电子、能量和中微子损耗、输运及恒星结构。本实验能检验自身方程的求解，不能证明实际核合成产额。

</section>

<figure class="plot" markdown="1">
![热尾和隧穿的指数代价相加形成 Gamow 峰；比较完整指数核与局部高斯近似。](assets/img/ap-03-gamow.svg)
<figcaption><span class="fig-id">图 ap-03.1</span><strong>找到参与反应的能量。</strong>上图比较两个指数代价及其和，下图只将完整指数核除以自身峰值；虚线是局部高斯近似。教学取值 \(k_BT=1.3\,\mathrm{keV}, E_G=500\,\mathrm{keV}\)。峰外贡献不为零，宽度也不是硬截止。</figcaption>
</figure>

## 1. 从热运动到反应率：Gamow 峰怎样出现？

太阳中心 \(T\sim1.5\times10^7\,\mathrm K\)，所以 \(k_BT\sim1.3\,\mathrm{keV}\)，远低于核尺度上的质子库仑势垒（约 MeV 量级，取决于接近距离）。经典 Maxwell 高能尾并非严格为零，但越过这一高度的比例极小。量子隧穿使势垒下的粒子仍可能反应。

先分清**有某种能量的概率**与**它贡献多少反应**。非简并、非相对论、热平衡的相对运动，约化质量为 \(\mu\)，相对能量分布与速度为

$$f_E(E)=\frac{2\sqrt E}{\sqrt\pi(k_BT)^{3/2}}e^{-E/(k_BT)},\qquad v(E)=\sqrt{2E/\mu}.$$

每体积反应次数为 \(r_{12}=n_1n_2\langle\sigma v\rangle/(1+\delta_{12})\)；同种核除以 2，避免一对粒子算两遍。带电粒子非共振截面常写成

$$\sigma(E)=\frac{S(E)}E e^{-\sqrt{E_G/E}},\qquad E_G=2\mu c^2(\pi\alpha Z_1Z_2)^2,$$

其中 \(Z_i\) 是电荷数，\(\alpha\) 是精细结构常数，\(S\) 的量纲为能量乘面积。将 \(f_Ev\sigma\) 相乘，两个平方根提供的 \(E\) 抵消 \(1/E\)，得到

$$\langle\sigma v\rangle=\sqrt{\frac8{\pi\mu}}(k_BT)^{-3/2}\int_0^\infty S(E)e^{-F(E)}\,dE,\qquad F(E)=\frac E{k_BT}+\sqrt{\frac{E_G}E}.$$

热尾惩罚过高能量，隧穿惩罚过低能量。若 \(S\) 在主贡献区缓变，指数核最大处就是 \(F\) 的最小值：

$$F'(E)=\frac1{k_BT}-\frac{\sqrt{E_G}}{2E^{3/2}}=0\quad\Rightarrow\quad E_0=\left[\frac{E_G(k_BT)^2}4\right]^{1/3}.$$

利用 \(F(E_0)=3E_0/(k_BT)\)、\(F''(E_0)=3/(2E_0k_BT)\) 作二阶展开：

$$e^{-F(E)}\approx e^{-3E_0/(k_BT)}\exp\!\left[-\frac{(E-E_0)^2}{(\Delta/2)^2}\right],\qquad\Delta=4\sqrt{\frac{E_0k_BT}3}.$$

\(\Delta\) 是**高斯近似降到峰值 \(1/e\) 的全宽**，不是半高全宽，更不是全部反应所在区间。图中 \(E_0\approx5.96\,\mathrm{keV}\)、\(\Delta\approx6.43\,\mathrm{keV}\)，高斯并不精确描述不对称尾部。

**何时失效？**狭窄共振可使 \(S\) 急变，不能只找指数峰；中子反应没有同样的带电库仑因子，强屏蔽或简并环境也要重审假设。实验核物理需要在相关能区测截面，而不是只测容易到达的高能区。[热核反应推导讲义](https://www.astro.princeton.edu/~burrows/classes/403/nucl.masses.fusion.pdf)

## 2. 氢燃烧：能量账与时间账要分开

pp 链慢入口 \(p+p\to d+e^++\nu_e\) 需要弱相互作用把质子变成中子。后续较快步骤不能凭空获得更多氘，这与实验中“下游快但缺供给”相通。不过恒星会调节结构和温度，不能仅改变一个系数就推断整颗星的寿命。

若只写 \(4p\to\alpha+2e^++2\nu_e\)，产物仍有两个正电子的静质量，质量差约 24.69 MeV。将它们与环境中的两个电子湮灭也算入，完整账为

$$4p+2e^-\longrightarrow\alpha+2\nu_e+Q,\qquad Q\approx26.73\,\mathrm{MeV}.$$

\(Q\) 包括动能、辐射和中微子能量；留给恒星的热量是 \(Q-\langle E_{\nu,1}+E_{\nu,2}\rangle\)。太阳 pp 链中微子损耗为总释放能量的百分之几，随分支比例变化，不能将全部 \(Q\) 当光子光度。

CNO 循环用 C、N、O 核作催化剂，净效果同样是氢变氦。较大电荷提高库仑阻挡，温度敏感性更强。\(\epsilon\propto T^4\)（pp）、\(T^{\sim17}\)（CNO）只是特定温区、密度与组成下的**局部斜率近似**。常见组成下更大质量恒星逐渐转向 CNO 主导；“约 \(1.5M_\odot\)”不是与金属丰度无关的边界。

集中的产能会增加输运负担，但对流仍需检验 \(\nabla_{\rm rad}>\nabla_{\rm ad}\)（均匀组成 Schwarzschild 判据）等条件，不能由温度指数推出“必然对流”。

**中微子如何检验反应链？**SNO 用带电流测电子味分量、中性流测三种活跃味的总 \({}^8B\) 通量。电子味亏缺而总活跃通量与太阳模型相容，支持味转换；不同实验与能区的亏缺并非统一“三分之一”。接着读[中微子混合](pp-04-flavor-neutrinos.html)。[SNO 总活跃通量测量](https://sno.phy.queensu.ca/sno/results_09_03/salt_flux.pdf)

## 3. 从氦到铁：跨过不稳定中间态

两个 \(\alpha\) 暂时形成不稳定 \({}^8Be\)，在它衰变前再俘获一个 \(\alpha\)，可能形成激发碳核并辐射退激：

$$2\alpha\rightleftharpoons{}^8Be,\qquad{}^8Be+\alpha\to{}^{12}C^*\to{}^{12}C+\gamma.$$

这不要求三个粒子严格同时碰撞。\({}^{12}C\) 约 7.65 MeV 的 Hoyle 激发态靠近相关阈值，显著增强过程；它说明核能级结构可改变天体反应率，也说明“缓变 \(S\)”不能替代共振处理。产碳量还取决于密度、温度及竞争的 \({}^{12}C(\alpha,\gamma){}^{16}O\)。

更大质量恒星还能经历碳、氖、氧、硅燃烧；“燃烧”指净核反应供能，不一定是简单两核聚合。氖燃烧含光致解离与后续俘获，硅燃烧涉及大量反应间的准平衡。

结合能曲线说明接近铁峰的总体供能趋势，但**每条反应是否放能，必须算 \(Q=(m_{\rm in}-m_{\rm out})c^2\)**。并非所有轻于铁的聚合都放能：\(\alpha+\alpha\to{}^8Be\) 需吸收约 92 keV。铁峰后的持续聚变不再提供通常的长期支撑能源。具体同位素丰度还由路径、电子比例和冻结历史决定，不能只看结合能最高点。电子俘获、光致蜕变与压力支撑通向[致密天体](ap-04-compact.html)。

## 4. 铁之后：比的是俘获和衰变时间

中子无电荷，俘获不用越过带电粒子间的库仑势垒。对不稳定核定义

$$\tau_{n\gamma}=\frac1{n_n\langle\sigma v\rangle},\qquad\tau_\beta=\frac1{\lambda_\beta}=\frac{t_{1/2}}{\ln2}.$$

俘获远慢于 β 衰变时，核通常先衰变再俘获，路径接近稳定谷，称 s 过程；俘获远快于 β 衰变时，可先积累多个中子，环境冷却后再衰变回来，称 r 过程。在二者可比处出现分支。稳定核的 β 寿命可视为无限，不能将这一比较不加区分地套给所有核。

| 过程 | 主要竞争 | 典型环境与限制 |
|---|---|---|
| s | 不稳定分支核一般 \(\tau_{n\gamma}\gg\tau_\beta\) | AGB 星及大质量恒星的弱 s 成分；产物由中子曝光量、种子核和分支决定 |
| r | 活跃阶段常 \(\tau_{n\gamma}\ll\tau_\beta\) | 中子星并合是重要来源；路径还涉及光致解离、裂变、电子比例与膨胀 |

2017 年 GW170817 的引力波和千新星观测支持并合产生 r 过程重元素。证据链为“并合源→抛射物→放射性加热与辐射输运→光变/光谱”，产额估计依赖模型。它不意味着每种重元素的比例都已直接测出，也未证明并合是唯一场所。[LIGO 对抛射物及重元素贡献的分析](https://ligo.org/science-summaries/GW170817Kilonova/)

## 5. 大爆炸核合成：为何约四分之一是氦？

早期宇宙降温时，弱作用转换中子与质子的速率逐渐赶不上膨胀；自由中子随后继续衰变。氘不再被大量高能光子立即破坏后，核合成才能推进。取开始时 \(n/p\approx1/7\)，若几乎全部中子进入 \({}^4He\)，每个氦核要两个中子，则氦的重子份额

$$Y_p\approx\frac{4(n/2)}{n+p}=\frac{2(n/p)}{1+n/p}\approx\frac14.$$

忽略小的结合能质量修正，得到约 25% 氦、75% 剩余氢的质量比例，不是粒子数比例。最初几分钟的 BBN 还留下少量 D、\({}^3He\)、\({}^7Li\)。检验需寻找恒星加工少的环境；氘与 CMB 对重子密度的约束总体相容。按 PDG 2025，贫金属星推断的原初锂仍比标准预言低数倍，恒星耗损及观测系统误差等尚需处理，不能直接当作新物理发现。[PDG：BBN 与锂问题](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-bbang-nucleosynthesis.pdf)

## 6. 三个迁移练习

**例 1｜能量够烧多久？**取 \(M_\odot=1.99\times10^{30}\,\mathrm{kg}\)、\(L_\odot=3.83\times10^{26}\,\mathrm W\)、可参与燃烧的恒星质量份额 \(f=0.1\)、氢份额 \(X=0.7\)、转氦效率 \(\eta=0.007\)。估计寿命；忘记 \(X\) 时误差朝哪边？

<details class="answer" markdown="1">
<summary>查看能量账与边界</summary>

$$t\sim\frac{\eta fXM_\odot c^2}{L_\odot}\approx2.29\times10^{17}\,\mathrm s\approx7.3\times10^9\,\mathrm{yr}.$$

这是接近百亿年的数量级，不能写成精确恒星寿命。燃烧区范围、光度演变和中微子损耗都会影响结果。漏掉 \(X\) 会高估约 \(1/0.7\) 倍。相应每秒消耗氢 \(L_\odot/(\eta c^2)\approx6.1\times10^{11}\,\mathrm{kg/s}\)，辐射对应质量差约 \(4.3\times10^9\,\mathrm{kg/s}\)，二者不能混淆。

</details>

**例 2｜温度翻倍，窗口怎样移动？**同一非共振反应的 \(E_G\) 不变，温度翻倍。求 \(E_0\)、\(\Delta\) 的比值；反应率是否只乘其中一个比值？

<details class="answer" markdown="1">
<summary>查看标度与边界</summary>

\(E_0\propto T^{2/3}\)，峰位乘 \(2^{2/3}\approx1.587\)；\(\Delta\propto T^{5/6}\)，宽度乘 \(2^{5/6}\approx1.782\)。总反应率还含 \(T^{-3/2}\)、\(S(E)\) 和指数高度 \(e^{-3E_0/(k_BT)}\)，不能将横轴位移当总面积变化。若窗口跨过狭窄共振，缓变 \(S\) 近似也需重审。

</details>

**例 3｜分支点不是只看密度。**不稳定核 \(t_{1/2}=10\,\mathrm s\)，\(\langle\sigma v\rangle=10^{-20}\,\mathrm{cm^3/s}\)。取 \(n_n=10^{18}\) 和 \(10^{22}\,\mathrm{cm^{-3}}\)，比较两个时间尺度。若环境仅持续 \(10^{-4}\,\mathrm s\)，第二种能否保证大量俘获？

<details class="answer" markdown="1">
<summary>查看计算与热史检查</summary>

\(\tau_\beta=10/\ln2\approx14.43\,\mathrm s\)。两种密度下 \(\tau_{n\gamma}=100\,\mathrm s\) 和 \(0.01\,\mathrm s\)：前者通常先衰变，后者俘获远快于衰变。但只持续 \(10^{-4}\,\mathrm s\) 时，第二种单次俘获概率仅约 \(1-e^{-0.01}\approx0.00995\)。除反应间比赛，还要比较环境时间。真实冻结常涉及 \(\Gamma\tau_{\rm env}\lesssim1\)，不是任意固定系数阈值。

</details>

---

*下一页用简并压与引力平衡解释：燃料耗尽后，为何有的恒星留下白矮星，有的形成中子星或黑洞？*
