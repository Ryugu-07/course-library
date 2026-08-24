# 性能 I · 强度的微观起源与强化四法

> 线一说"缺陷决定命运"，线二给了操纵组织的手段——本页收获：**强度到底是什么、怎么把它调上去**。对晶态金属的常温塑性近似而言，**塑性变形常可看作位错运动，所以强化常从给位错设障碍入手**。四种障碍物对应工业上常见的四类强化手段，每类都有可校准的定量关系。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="materials-strengthening-learning-title">

<h2 id="materials-strengthening-learning-title">学习层：给一根铝合金拉杆做强化预算，先预测四项障碍如何相加</h2>

<h3>1. 具体材料工程情境：热处理态铝合金的屈服强度预算</h3>

一根铝合金拉杆需要在不改变几何的情况下提高屈服强度。显微组织给出晶粒尺寸 $d$、位错密度 $\rho$、固溶元素浓度 $c$ 和硬质析出物间距 $\lambda$。材料工程师要先做一张可审计的教学账本，再决定细晶、加工、固溶或时效哪一个旋钮值得继续试验；这张账本不等同于标准牌号的完整本构模型。

<h3>2. 必须作答的预测门：尺度标度与叠加规则</h3>

揭示前回答三题：晶粒尺寸减半时 Hall-Petch 项向哪边变化？位错密度增加 4 倍时 Taylor 项增加几倍？析出物间距减小时，在仍由 Orowan 绕过控制的区间内，强化项如何变化？三题完成后才显示 MPa 贡献柱图和闭合账本。

<h3>3. 正式模型桥：四种障碍 → 有量纲的 MPa</h3>

本实验把 $d$、$b$、$\lambda$ 用 m，$G$ 用 Pa，$\rho$ 用 $\mathrm{m^{-2}}$，最后统一除以 $10^6$ 转成 MPa：

$$
\Delta\sigma_{HP}=k_y d^{-1/2},\qquad
\Delta\sigma_T=M\alpha Gb\sqrt{\rho},
$$

$$
\Delta\sigma_{SS}=K_{SS}\sqrt{c},\qquad
\Delta\sigma_O=0.40\,\frac{MGb}{\lambda}.
$$

默认 $\sigma_0=70\ \mathrm{MPa}$、$k_y=0.70\ \mathrm{MPa\sqrt m}$、$M=3$、$\alpha=0.25$、$G=26\ \mathrm{GPa}$、$b=0.286\ \mathrm{nm}$、$K_{SS}=120\ \mathrm{MPa}/\sqrt{\mathrm{wt\%}}$；$c$ 只是 wt% 教学代理。叠加规则明确取**线性相加**：

$$
\sigma_y^*=\sigma_0+\Delta\sigma_{HP}+\Delta\sigma_T+\Delta\sigma_{SS}+\Delta\sigma_O.
$$

线性相加是为了让每一项可追账，不是说真实障碍彼此独立，也不是说四项可以在所有温度、应变率和组织尺度下同时适用。

<h3>4. 动手实验：把晶粒、位错、溶质和析出物联动</h3>

<div class="learning-lab" data-learning-lab="materials-strengthening-ledger" markdown="1">

**JavaScript 失效时的静态 fallback：**默认取 $d=20\ \mu\mathrm m$、$\rho=10^{14}\ \mathrm{m^{-2}}$、$c=1.5\ \mathrm{wt\%}$（代理）、$\lambda=100\ \mathrm{nm}$。线性教学账本给出 $\Delta\sigma_{HP}=156.52$ MPa、$\Delta\sigma_T=55.77$ MPa、$\Delta\sigma_{SS}=146.97$ MPa、$\Delta\sigma_O=89.23$ MPa，合计 $\sigma_y^*=518.50$ MPa。

| 账本量 | 静态结果 | 单位 / 公式 |
|---|---:|---|
| 基体 $\sigma_0$ | 70.00 | MPa |
| Hall-Petch $\Delta\sigma_{HP}$ | 156.52 | MPa；$0.70/\sqrt{d(\mathrm m)}$ |
| Taylor $\Delta\sigma_T$ | 55.77 | MPa；$M\alpha Gb\sqrt\rho$ |
| 固溶 $\Delta\sigma_{SS}$ | 146.97 | MPa；$120\sqrt{c(\mathrm{wt\%})}$ 代理 |
| Orowan $\Delta\sigma_O$ | 89.23 | MPa；$0.40MGb/\lambda$ |
| 线性教学总账 | 518.50 | MPa；各项相加 |
| 闭合残差 | 0 | MPa |

</div>

<h3>5. 误区与模型边界：标度式有适用区间</h3>

- Hall-Petch 常在特定晶粒范围、温度和变形机制下近似线性；极细晶、晶界滑移、晶界偏聚和孔隙会改变甚至反转趋势，不能把一个 $k_y$ 迁移到所有材料。
- Taylor 关系把位错障碍平均成 $\sqrt\rho$ 的统计代理；位错排列、动态回复、织构、应变路径和应变率会改变系数。固溶 $\sqrt c$ 也依赖溶质尺寸失配、弹性模量失配、浓度范围和相互作用。
- Orowan 项只对应硬质粒子、绕过机制和可定义的间距；小而软的粒子可能被切过，过时效会粗化并使间距增大，高温还会发生溶解或回复。
- 线性叠加不是物理守恒定律；不同障碍可能共享同一位错群、屏蔽彼此的应力场，真实屈服强度需要显微、拉伸和温度/应变率校准。$E$ 通常比屈服强度对热处理更不敏感，但成分、相变、织构、孔隙、温度和测量方向仍可能改变它。

<div class="cl-transfer" markdown="1">

**迁移问题：**若你把晶粒细化到纳米级却发现强度不再按 Hall-Petch 上升，会先检查晶界滑移、偏聚还是测量应变率？若析出物从“切过”转为“Orowan 绕过”，应把账本中的哪一项和哪一个结构尺度换掉？

</div>

</section>

## 1. 先读懂一条应力-应变曲线

<figure class="plot" markdown="1">
![Stress-strain curves of three material families](assets/img/mat-08-stressstrain.svg)
<figcaption><span class="fig-id">图 8.1</span>三大家族的拉伸曲线（示意）：许多工程陶瓷弹性段陡而短、塑性很小；金属常见屈服后加工硬化再颈缩；许多高分子模量较低但可有较大应变——键合（结构 I）的性格在宏观曲线上显形，具体曲线依材料和测试温度而变。</figcaption>
</figure>

**五个必读量**：弹性模量 $E$（斜率——主要受键合、晶格和温度控制，热处理通常影响较小但并非绝对不变，结构 I）；**屈服强度 $\sigma_y$**（位错开始大规模运动——本页主角，可调三倍以上）；抗拉强度 $\sigma_{UTS}$（颈缩起点）；延伸率（韧性的粗指标）；曲线下面积（断裂功 ≈ 韧性）。

**工程应力应变 vs 真应力应变**：前者用原始截面（工程用、有"下降段"假象），均匀变形阶段的真应力可用瞬时截面定义；进入颈缩后截面和应变场已局部化，不能靠均匀截面换算得到可靠的真应力—真应变本构曲线，需要颈部几何、数字图像相关或本构反演。工程应力的下降不自动等于材料本构变软【研：Considère 判据 $d\sigma/d\varepsilon = \sigma$ 给颈缩起点】。

## 2. 强化四法（位错的四种障碍物）

| 方法 | 障碍物 | 定量关系 | 代价 |
|---|---|---|---|
| **加工硬化** | 位错互相缠结 | 特定应变区间可用 $\sigma \propto \sqrt{\rho}$（Taylor 代理） | 塑性耗尽、需退火恢复 |
| **固溶强化** | 溶质原子的应力场 | 某些稀释范围可用 $\Delta\sigma \propto \sqrt{c}$ | 导电导热可能下降，系数依溶质而变 |
| **细晶强化** | 晶界 | 在适用晶粒范围近似 **Hall–Petch** $\sigma_y = \sigma_0 + kd^{-1/2}$ | 常能兼顾强韧，但晶界稳定性、加工难度和极细晶机制要另算 |
| **析出/弥散强化** | 第二相粒子 | 切过 or 绕过（特定 Orowan 区间 $\Delta\sigma \propto 1/\lambda$） | 过时效、溶解和高温粗化风险 |

<figure class="plot" markdown="1">
![Hall-Petch relation](assets/img/mat-08-hallpetch.svg)
<figcaption><span class="fig-id">图 8.2</span>Hall–Petch 关系：在这组示意材料与晶粒范围内，屈服强度对 \(d^{-1/2}\) 近似呈直线；细晶常有机会同时改善强度与韧性，但并非所有材料、尺度和温度下都如此。</figcaption>
</figure>

<figure class="diagram" markdown="1">
![Four obstacle families for strengthening](assets/img/mat-08-strengthening.svg)
<figcaption><span class="fig-id">图 8.3</span>强化四法的共同骨架：位错前进时分别遇到位错缠结、溶质应变场、晶界和硬质析出粒子；障碍越难穿过或绕过，屈服强度越高。</figcaption>
</figure>

**析出强化的两种机制（铝合金与高温合金的命门）**：粒子小而软 ⇒ 位错**切过**（强化随粒子长大而增）；粒子大而硬 ⇒ 位错**绕过**留下位错环（Orowan，强化随间距增大而减）——两条曲线交点即**峰值时效**。工业上"固溶处理→淬火→时效"（T6 状态）就是把粒子尺寸精确停在这个交点上；过时效 = 走过头掉下来（🔗 热力 III 的形核长大在此收租）。

<figure class="diagram" markdown="1">
![Precipitation strengthening: cutting versus bypass](assets/img/mat-08-precipitation.svg)
<figcaption><span class="fig-id">图 8.4</span>析出强化的两条竞争路径：小而软的粒子被位错切过，大而硬的粒子迫使位错绕过并留下 Orowan 环；两条强度曲线的交点对应峰值时效，继续长大则进入过时效。</figcaption>
</figure>

**Hall–Petch 的边界**：在一些材料和试验条件下，晶粒进入纳米尺度后可能出现**反 Hall–Petch**（晶界体积占比增大、晶界滑移或扩散参与变强）；转折尺度不是普适的 10–20 nm 常数，需按材料、纯度、温度和应变率标定【研】。

## 3. 高温：另一套规则（蠕变）

当温度进入某材料的高温扩散/蠕变显著区（工程初筛有时以约 $0.4T_m$，$T_m$ 用 K 表示，但这不是普适阈值）后，"强度"这个概念要换成**蠕变抗力**：恒应力下应变随时间缓慢增长（一次/稳态/三次三段）。稳态蠕变率

$$
\dot\varepsilon = A\,\sigma^n \exp\Big(-\frac{Q_c}{RT}\Big)
$$

——又是 Arrhenius（热力 II 的老朋友）。抗蠕变设计的三类思路：提高熔点并控制扩散（钨、铌基等候选）；减少高温晶界滑移（某些涡轮叶片采用单晶，但制造、取向和环境有代价）；设计在服役温度下粗化较慢的析出相（镍基高温合金的 γ′ 体积分数和稳定性依成分、热处理和温度而变，仍会粗化或溶解）。

**主线回响**：室温怕位错动、高温怕晶界动——**"什么在动"决定"设计什么"**，服役温度是选材的第一分水岭。

## 4. 数字感与反直觉

- 强度谱（MPa）：退火纯铝 ~35 ｜ 6061-T6 ~276 ｜ 低碳钢 ~250 ｜ 4340 淬火回火 ~1500 ｜ 马氏体时效钢 ~2000 ｜ 碳纤维束 ~4000；
- 比强度（强度/密度）才是航空的货币：钛合金与高强钢强度相近但密度只有 57%；
- **反直觉三连**：加工硬化让金属变强却**可能变脆**（塑性储备被提前消耗）；最强的钢不是最硬的钢（硬度高≠承载能力强，还要看韧性——下一页）；细晶在许多工程窗口里能同时改善强度与韧性，但也有晶界稳定、成本、织构和纳米机制边界，并非无条件的强韧双赢。

【研】对标 Courtney《Mechanical Behavior of Materials》与 Dieter；Taylor 关系推导、Orowan 应力、蠕变机制图（Ashby map）、Larson–Miller 参数外推是研究生标准装备。

---

*强度讲完了"扛得住多大力"，但工程事故几乎从不发生在屈服——而在裂纹。下一页：断裂、韧性与疲劳，材料失效的真实剧本。*
