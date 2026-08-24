# 性能 IV · 陶瓷与玻璃工程

> 陶瓷抗压强度可达钢的数倍、硬度与耐温冠绝群雄，却因为**脆**而长期只能做碗和砖。现代陶瓷工程的全部智慧就是回答一个问题：**如何与脆性共处**——统计设计（Weibull）、增韧机制、以及"扬长避短"的应用哲学。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="materials-ceramic-learning-title">

<h2 id="materials-ceramic-learning-title">学习层：给一根氧化铝承力件做 Weibull 风险账本，先预测尺寸与 proof test</h2>

<h3>1. 具体材料工程情境：氧化铝绝缘支柱的可靠性筛选</h3>

一批氧化铝绝缘支柱要装进高压设备。每根试件的表面加工与内部孔隙都可能留下不同尺寸的裂纹，设计者不能只抄一个平均弯曲强度，而要把**有效承载体积、应力分位数和 proof test 后的条件风险**放进同一张可追账的账本。这里用静态 weakest-link 代理讲清尺寸效应，不替代真实缺陷检测和结构应力积分。

<h3>2. 必须作答的预测门：有效体积、模数与 proof 后存活</h3>

揭示前回答三题：在同一应力、$\sigma_0$ 和 $m$ 下，$V/V_0$ 增大会让 $P_f$ 升高还是降低？在固定 $\sigma/\sigma_0=1.1>1$ 时，增大 Weibull 模数 $m$ 会让该应力处的 $P_f$ 怎样变化？理想静态模型中若 proof stress 高于 service stress 且试件通过 proof test，service 的条件存活率是多少？三题完成后才显示 CDF、分位强度与风险账本。

<h3>3. 正式模型桥：有效体积 → CDF → proof 条件概率</h3>

把 $V_0$ 作为参考体积，使用无量纲有效体积比：

$$
P_f(\sigma,V)=1-\exp\left[-\frac{V}{V_0}\left(\frac{\sigma}{\sigma_0}\right)^m\right],\qquad
S(\sigma,V)=1-P_f.
$$

失效概率为 $p$ 的分位强度为

$$
\sigma_p=\sigma_0\left[\frac{-\ln(1-p)}{V/V_0}\right]^{1/m}.
$$

在同一试件、同一有效体积的静态模型中，proof stress 为 $\sigma_{\rm proof}$ 后观察 service stress $\sigma_{\rm svc}$：

$$
P(\mathrm{survive\ svc}\mid\mathrm{survive\ proof})=
\begin{cases}
1,&\sigma_{\rm svc}\le\sigma_{\rm proof},\\
\exp\{-\frac{V}{V_0}[({\sigma_{\rm svc}}/{\sigma_0})^m-({\sigma_{\rm proof}}/{\sigma_0})^m]\},&\sigma_{\rm svc}>\sigma_{\rm proof}.
\end{cases}
$$

应力与 $\sigma_0$ 用 MPa，$V/V_0$ 和 $m$ 无量纲；$V$ 不能脱离 $V_0$ 裸带量纲进入指数。

<h3>4. 动手实验：把体积、缺陷离散度和筛选应力联动</h3>

<div class="learning-lab" data-learning-lab="materials-ceramic-weibull" markdown="1">

**JavaScript 失效时的静态 fallback：**默认取 $V/V_0=0.25$、$m=8$、$\sigma_0=300\ \mathrm{MPa}$、$\sigma_{\rm svc}=240\ \mathrm{MPa}$、$\sigma_{\rm proof}=300\ \mathrm{MPa}$。原始 service 失效概率 $P_f=0.0410756$，proof 通过概率为 $0.778801$，因为 proof 高于 service，静态模型给出的 proof 后 service 条件存活率为 $1.00000$；分位强度 $\sigma_{10}=269.286\ \mathrm{MPa}$、$\sigma_{50}=340.786\ \mathrm{MPa}$、$\sigma_{90}=395.964\ \mathrm{MPa}$。

| 账本量 | 静态结果 | 单位 / 读法 |
|---|---:|---|
| 有效体积比 $V/V_0$ | $0.25$ | 无量纲；指数中的尺寸尺度 |
| Weibull 模数 $m$ | $8$ | 无量纲 |
| $\sigma_0$ | $300$ | MPa |
| service 原始 $P_f$ | $0.0410756$ | 未经过 proof test |
| proof 通过概率 | $0.778801$ | $P(\mathrm{survive\ proof})$ |
| proof 后 service 条件存活 | $1.00000$ | 因 $\sigma_{\rm svc}<\sigma_{\rm proof}$ 的静态结果 |
| $\sigma_{10}/\sigma_{50}/\sigma_{90}$ | $269.286/340.786/395.964$ | MPa；CDF 分位强度 |

</div>

<h3>5. 误区与模型边界：筛选缺陷不等于改变材料本性</h3>

- weakest-link 的独立同分布缺陷假设把不同位置的失效风险相乘；真实缺陷可能成簇、与表面/加工方向相关，且应力场常不均匀。均匀体缺陷控制时把体积写成 $V/V_0$ 是有效体积积分的简化；若失效由表面加工缺陷主导，应改用相应的有效面积/表面应力积分与配套标定参数。
- $m$、$\sigma_0$ 和 $V_0$ 必须在相同材料、表面状态、加载模式和有效体积定义下标定；弯曲、拉伸、热应力与接触应力不能随意共用一组参数。
- proof test 会淘汰超过 proof 应力阈值的较大缺陷，使剩余批次的条件风险降低；它不提高剩余材料的本征断裂韧性，也不自动消除亚临界裂纹增长、疲劳、热冲击和后续损伤。
- CDF 是统计设计输入，不是对某一根零件的确定性寿命预言；还需要缺陷检测、应力场、环境和失效形貌证据。

<div class="cl-transfer" markdown="1">

**迁移问题：**若支柱从小试样放大到十倍有效体积，你会先重算 $V/V_0$、重新标定 $m$，还是直接沿用平均强度？若 proof test 后仍出现热循环断裂，哪些证据能区分 Weibull 静态缺陷筛选、亚临界裂纹增长与安装应力？

</div>

</section>

## 1. 脆性的根源与统计后果

**根源**（结构 I 的账）：离子/共价键的方向性与静电约束 ⇒ 位错难动 ⇒ 裂尖无塑性区 ⇒ $K_{IC}$ 只有金属的几十分之一（性能 II）。**后果**：强度由**最大缺陷**决定，而缺陷是随机分布的 ⇒ **强度本身是随机变量**。

<figure class="plot" markdown="1">
![Weibull failure probability curves](assets/img/mat-11-weibull.svg)
<figcaption><span class="fig-id">图 11.1</span>Weibull 分布：模数 \(m\) 越大强度越集中（工艺越稳定）。陶瓷典型 \(m = 5\text{–}20\)，金属可达 50+——设计陶瓷件时给出的不是"强度"而是"在某失效概率下的许用应力"。</figcaption>
</figure>

$$
P_f = 1 - \exp\Big[-\frac{V}{V_0}\Big(\frac{\sigma}{\sigma_0}\Big)^m\Big]
$$

**两个工程推论**：① **尺寸效应**——体积越大越弱（大件包含大缺陷的概率高，$V/V_0$ 在指数里）：小试样测的强度不能直接用于大件；更一般地应从有效体积中的缺陷风险积分得到该无量纲尺度项；② 设计输入是"$10^{-6}$ 失效概率下的应力"而非平均强度——**陶瓷设计天然是概率设计**（🔗 数学站统计 III/Weibull，随机过程的极值思想）。**证明试验（proof test）**：预先加载到设定应力，淘汰含大缺陷者——用破坏一部分换取剩余件的可靠性保证。

## 2. 增韧四法（与脆性共处的技术）

| 机制 | 原理 | 代表 |
|---|---|---|
| **相变增韧** | 裂尖应力诱发 ZrO₂ 四方→单斜相变、体积膨胀 3–5% 压住裂纹 | Y-TZP 氧化锆（$K_{IC}$ 可达 ~10）——牙科冠、刀具 |
| 微裂纹/桥接 | 晶粒拔出、纤维桥接消耗能量 | 晶须/纤维增强陶瓷、SiC/SiC |
| 残余压应力 | 表面受压需先抵消才能张开裂纹 | **钢化玻璃**（急冷）、化学强化（离子交换：手机盖板玻璃） |
| 复合/层状 | 界面偏转裂纹路径（仿贝壳珍珠层） | CMC 涡轮部件、层状陶瓷 |

<figure class="diagram" markdown="1">
![Transformation toughening at a zirconia crack tip](assets/img/mat-11-transformation-toughening.svg)
<figcaption><span class="fig-id">图 11.2</span>裂尖应力诱发稳定四方氧化锆转为单斜相，3–5% 的体积膨胀在裂尖周围建立压应力区，促使裂纹闭合并提高断裂韧性。</figcaption>
</figure>

**钢化玻璃的两个性格**：强度提升数倍，但一旦破坏（裂纹穿透压应力层）**整片爆成小颗粒**——安全玻璃的"安全"指碎片不锋利，不是不碎。**陶瓷基复合材料（CMC）**是航空发动机热端的当代主角：密度只有镍基高温合金的三分之一、耐温高 150–200 °C，代价是制造成本与环境障涂层配套（前沿 I 展开）。

## 3. 热冲击：陶瓷的第二杀手

温差 ⇒ 热应变受约束 ⇒ 应力 $\sigma \approx \dfrac{E\alpha\Delta T}{1-\nu}$。抗热冲击参数：

$$
R = \frac{\sigma_f(1-\nu)}{E\alpha}
$$

**读法**：要抗热冲击就要**低膨胀 + 低模量 + 高强度**。石英玻璃（$\alpha \approx 0.5\times10^{-6}$/K）可以烧红后扔进冷水而不裂；普通钠钙玻璃（$\alpha \approx 9\times10^{-6}$）几十度温差就炸。Pyrex/硼硅玻璃（$\alpha \approx 3.3$）做实验器皿正是这条公式的产品；堇青石（近零膨胀）做汽车尾气催化载体同理。**这是"性能靠成分设计"最干净的一个案例**。

## 4. 传统与先进陶瓷的分工

**传统**（黏土基：砖、瓷、水泥）：便宜、量大、抗压——水泥是人类用量最大的人造材料（也是 ~7–8% 的全球 CO₂ 排放源，低碳水泥是前沿 II 的议题）。

**先进/工程陶瓷**：Al₂O₃（绝缘、耐磨、生物相容）、ZrO₂（增韧之王）、SiC/Si₃N₄（高温结构、轴承球）、AlN（高导热绝缘基板——🔗 芯片站封装页）、BN、碳化硼（装甲）。**选材逻辑**：**扬长（硬度、耐温、耐蚀、绝缘、低密度）避短（禁止拉伸受力、禁止缺口、禁止热冲击）**——把陶瓷放在压缩与摩擦的岗位上，是工程师最基本的自觉。

## 5. 数字感与反直觉

- 抗压/抗拉比：金属 ~1，陶瓷可达 **10:1 以上**（氧化铝抗压 ~3000 MPa、抗弯 ~350）——**陶瓷不弱，只是不能拉**；
- 硬度（HV）：淬火钢 ~800 ｜ Al₂O₃ ~1800 ｜ SiC ~2500 ｜ B₄C ~3000 ｜ 金刚石 ~10000；
- **反直觉**：玻璃纤维比块体玻璃强百倍（表面缺陷少、尺寸效应有利）——"同一种材料，形态决定强度"；氧化锆刀不易钝但会崩（韧性换硬度的日常演示）；陶瓷最常见的失效原因不是超载，是**热冲击与安装应力**。

【研】对标 Kingery《Introduction to Ceramics》、Barsoum《Fundamentals of Ceramics》；R 曲线行为、慢速裂纹扩展（应力腐蚀）、Weibull 参数估计与尺寸缩放是研究生功课。

---

*线三收官：强度、断裂、高分子、陶瓷——力学性能的四张脸讲完。线四换一个维度：材料除了扛力，还能导电、储磁、发光、隔热——功能材料的世界。*
