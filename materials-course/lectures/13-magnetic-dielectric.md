# 功能 II · 磁性与介电材料

> 电动机、变压器、硬盘、扬声器靠磁；电容、传感器、压电驱动、超声探头靠介电。磁性材料与**铁电材料**都可用“畴、翻转与钉扎”来理解软硬和记忆；普通线性介质则主要靠电子、离子或取向极化响应，并不都有可翻转电畴。先分清材料类别，才不会把两种损耗语言混在一起。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="materials-magnetic-dielectric-learning-title">

<h2 id="materials-magnetic-dielectric-learning-title">学习层：给一只 MLCC 与一颗软磁磁芯做双面损耗预算</h2>

<h3>1. 具体材料工程情境：高频电容与变压器磁芯的两种发热</h3>

一部电源模块同时需要 MLCC 限制电压纹波、软磁磁芯传递能量。工程师必须分清：介电材料在线性小信号下因极化弛豫产生的频率损耗，和磁芯在往复磁化中因磁滞回线面积产生的能量损耗。两者都能发热，却不应合并成一个“损耗角”或把一条代理回线当成真实牌号拟合。

<h3>2. 必须作答的预测门：Debye 峰、高频尾部与磁滞面积</h3>

揭示前回答三题：单一 Debye 弛豫的 $\varepsilon''$ 峰位在 $\omega\tau=0$、$1$ 还是无穷大？频率远高于该峰后，$\varepsilon''$ 与 $\tan\delta$ 会继续升高、保持峰值还是下降？在 $M_s,H_{\max}$ 和分支宽度固定、回线仍闭合的条件下，增大 $H_c$ 会让教学回线面积变大还是变小？三题完成后才显示两类响应的曲线和双面账本。

<h3>3. 正式模型桥：相量约定 → Debye 线性损耗 → tanh 磁滞代理</h3>

介电部分采用 $e^{+i\omega t}$ 相量约定，并写成

$$
\varepsilon^*=\varepsilon'-i\varepsilon''
=\varepsilon_{\infty}+\frac{\varepsilon_s-\varepsilon_{\infty}}{1+i\omega\tau}.
$$

因此 $1/(1+i\omega\tau)$ 的虚部是负的；本实验把正的损耗量定义为 $\varepsilon''=-\operatorname{Im}(\varepsilon^*)$。令 $x=\omega\tau$、$\Delta\varepsilon=\varepsilon_s-\varepsilon_{\infty}$，则

$$
\varepsilon'=\varepsilon_{\infty}+\frac{\Delta\varepsilon}{1+x^2},\qquad
\varepsilon''=\frac{\Delta\varepsilon x}{1+x^2},\qquad
\tan\delta=\frac{\varepsilon''}{\varepsilon'}.
$$

$\varepsilon''$ 的峰在 $x=1$。磁性部分只使用明确命名的双分支教学代理：

$$
M_{\uparrow}(H)=M_s\tanh\frac{H-H_c}{h},\qquad
M_{\downarrow}(H)=M_s\tanh\frac{H+H_c}{h},
$$

沿 $-H_{\max}\to+H_{\max}\to-H_{\max}$ 采样并用梯形法积分

$$
A_{\rm loop}=\left|\mu_0\oint H\,dM\right|
=\mu_0\left|\int_{-H_{\max}}^{H_{\max}}(M_{\downarrow}-M_{\uparrow})\,dH\right|
\quad [\mathrm{J\,m^{-3}\ per\ cycle}].
$$

数值积分显式把下降支终点连回上升支起点，或等价地使用两支之差积分，因此即使 $H_{\max}$ 未完全饱和、$h$ 较大，代理回线仍是闭合路径。它是现象学教学代理，不可反演真实动态磁滞。

这不是 Jiles–Atherton 模型，也不是任何真实材料的拟合。

<h3>4. 动手实验：分别调频率—弛豫与磁滞分支</h3>

<div class="learning-lab" data-learning-lab="materials-magnetic-dielectric-loss" markdown="1">

**JavaScript 失效时的静态 fallback：**默认取 $\varepsilon_{\infty}=2.5$、$\varepsilon_s=12$、$\tau=0.001\ \mathrm s$、$f=159.154943\ \mathrm{Hz}$，所以 $\omega\tau=1$；得到 $\varepsilon'=7.25$、正损耗定义下 $\varepsilon''=4.75$、$\tan\delta=0.655172$。磁性教学代理取 $M_s=100000\ \mathrm{A/m}$、$H_c=2000\ \mathrm{A/m}$、$h=500\ \mathrm{A/m}$、$H_{\max}=10000\ \mathrm{A/m}$，在同一递增 $H$ 网格配对升/降支并闭合端点后，数值回线面积 $A_{\rm loop}=1005.30965\ \mathrm{J/m^3/cycle}$。

| 账本量 | 静态结果 | 单位 / 读法 |
|---|---:|---|
| $\omega\tau$ | $1$ | Debye $\varepsilon''$ 峰位 |
| $\varepsilon'$ | $7.25$ | 无量纲；储能响应 |
| $\varepsilon''$ | $4.75$ | 正损耗；$\varepsilon^*=\varepsilon'-i\varepsilon''$ |
| $\tan\delta$ | $0.655172$ | 线性介电损耗因子 |
| $M_s/H_c$ | $100000/2000$ | A/m；tanh branch 参数 |
| 回线面积 | $1005.30965$ | J/m³/cycle；同一 $H$ 网格的 $\mu_0\int(M_{\downarrow}-M_{\uparrow})\,dH$，并闭合 $\oint H\,dM$ |

</div>

<h3>5. 误区与模型边界：两类损耗不能互换</h3>

- $\varepsilon''$ 与 $\tan\delta$ 是线性介电响应的损耗记账；磁滞面积是磁化路径依赖的能量记账。介电损耗不能用磁滞面积替代，磁滞损耗也不能从一个 Debye 峰外推。
- 单一 Debye 只表示一个弛豫时间；真实介电材料常有多弛豫、界面极化、温度激活、非线性幅值效应和电导损耗。频率与温度可能共同移动或展宽峰，需用测量相量约定和样品几何校准。
- 这里的 tanh 双分支是教学代理，面积对 $M_s,H_c,h,H_{\max}$ 敏感，绝不冒充 Jiles–Atherton、畴壁动力学或真实材料拟合。真实磁芯还受频率、温度、应力、各向异性、涡流和磁粘滞影响。
- 变压器铁损通常要分离磁滞、经典涡流和异常损耗；叠片、粉芯电阻率和厚度会改变涡流回路，不能把本实验的准静态面积直接当成任意频率下的总功率。

<div class="cl-transfer" markdown="1">

**迁移问题：**若 MLCC 的 $\varepsilon''$ 峰随温度展宽，你会先增加多弛豫谱、温度激活项还是修正电极/界面模型？若磁芯回线面积随频率上升而增加，哪些独立测量能把磁滞、涡流和介电/电导损耗分开？

</div>

</section>

## 1. 磁性的来源与五种类型

磁矩来自电子自旋与轨道角动量。五分类（记前两条与铁磁三兄弟即可）：抗磁（所有物质都有的弱负响应）、顺磁（无序磁矩被外场轻微对齐）、**铁磁**（Fe、Co、Ni——交换作用使相邻自旋平行，自发磁化）、反铁磁（相邻反平行、净磁化为零）、**亚铁磁**（反平行但大小不等 ⇒ 有净磁化——铁氧体的家族）。

**居里温度 $T_C$**：热扰动战胜交换作用 ⇒ 铁磁消失（Fe 770 °C、Co 1121 °C、Ni 358 °C）——🔗 物理站相变章的经典二级相变范例。

**磁畴**：为降低退磁场能，自发磁化分成方向各异的畴（畴壁厚度 ~10–100 nm）；宏观磁化过程 = **畴壁移动 + 畴转动**——这就是磁滞的舞台。

<figure class="diagram" markdown="1">
![Magnetic domains and domain-wall motion](assets/img/mat-13-domains.svg)
<figcaption><span class="fig-id">图 13.1</span>未磁化材料由方向杂乱的多畴组成；外场推动畴壁并使磁矩转向，最终形成近似单一方向的饱和磁化。</figcaption>
</figure>

## 2. 软磁 vs 硬磁：同一条曲线的两端

<figure class="plot" markdown="1">
![Soft vs hard magnetic hysteresis loops](assets/img/mat-13-hysteresis.svg)
<figcaption><span class="fig-id">图 13.2</span>磁滞回线：软磁矫顽力 \(H_c\) 极小、回线细窄（每周期损耗 = 回线面积，故变压器铁损低）；硬磁 \(H_c\) 巨大、回线肥硕（能"记住"磁化状态 = 永磁体与磁记录）。**同一物理量的两个极端方向，对应两个完全不同的产业。**</figcaption>
</figure>

| | 软磁 | 硬磁（永磁） |
|---|---|---|
| 目标 | $H_c$ 尽量小、$\mu$ 大、电阻大（抑涡流） | $H_c$ 与 $(BH)_{max}$ 尽量大 |
| 微观策略 | **消除钉扎**：高纯、无内应力、无晶界（非晶/纳米晶）、织构对齐 | **制造钉扎**：单畴颗粒、高磁晶各向异性、析出相 |
| 材料 | 硅钢（取向硅钢的 $\langle001\rangle$ 织构！结构 II）、坡莫合金、铁氧体、非晶带材（结构 IV） | **Nd–Fe–B**（当代最强，$(BH)_{max}$ ~400 kJ/m³）、SmCo（耐温好）、铁氧体（便宜） |
| 用途 | 变压器、电机铁芯、电感 | 电动车驱动电机、风机、硬盘、扬声器、耳机 |

**主线回响**：软磁通常要降低阻碍可逆磁化的钉扎与损耗，硬磁则要利用各向异性、微结构和受控钉扎抵抗退磁。目标不是笼统的“没有缺陷”或“全是缺陷”，而是让晶粒、第二相、织构与应力服务于指定的磁化路径。

**产业现实**：Nd–Fe–B 的高温性能靠添加**镝/铽**（重稀土，供应高度集中）——"少镝/无重稀土磁体"是长期研发热点；电机设计与材料选择在电动车上直接耦合（转子温度上限 ↔ 磁体牌号 ↔ 成本）。

**磁记录一瞥**：硬盘用垂直记录 + 高各向异性介质（记录密度 ↑ 需颗粒更小，但小到一定程度热扰动会擦除数据——**超顺磁极限**；HAMR 热辅助磁记录用局部加热临时降低矫顽力来突破它，是近年产业化的路线）。

## 3. 介电材料：从存电到发力

**基础**：极化机制（电子/离子/取向/界面）随频率依次"退场"——**介电常数是频率的函数**（高频用材料与工频完全不同）。采用 $e^{+i\omega t}$ 相量约定时写 $\varepsilon^*=\varepsilon'-i\varepsilon''$，所以由 $1/(1+i\omega\tau)$ 产生的虚部为负，正的损耗量定义为 $\varepsilon''=-\operatorname{Im}(\varepsilon^*)$；损耗因子 $\tan\delta=\varepsilon''/\varepsilon'$ 决定发热（微波炉正是利用水的取向极化在 2.45 GHz 的损耗）。

**电容器材料**：$C = \varepsilon_0\varepsilon_r A/d$——三条提升路径全部被工业用尽：高 $\varepsilon_r$（BaTiO₃ 系铁电陶瓷 $\varepsilon_r$ 可达数千）、薄介质层、大面积（**MLCC 多层陶瓷电容**把上百层叠起来：一部手机上千颗，是电子工业用量最大的元件之一；材料上的挑战是层厚已进入亚微米、且需去 Pb 与稳定温度特性）。

**铁电与压电（本页最有工程趣味的一段）**：

- **铁电**：自发极化且可被电场翻转（电畴——磁滞的电学镜像：$P$-$E$ 回线）——FeRAM、可调介质；
- **压电**：应力 ⇄ 电荷双向转换（PZT 是主力，$d_{33}$ 高；石英稳定用于振荡器）——超声探头、喷墨打印头、压电马达、爆震传感器、声呐，以及部分压电 MEMS 麦克风与触觉执行器；多数手机线性振动马达仍是电磁式，MEMS 麦克风也常采用电容式，不能只凭器件名称判断换能机理；
- **热释电**：温度变化 ⇒ 电荷 ⇒ 红外热释电传感器（走廊里的人体感应灯就是它）。

三者是同一层级的对称性阶梯（压电 ⊃ 热释电 ⊃ 铁电）——**晶体对称性直接决定能不能压电**（无对称中心才可以）：结构 II 的几何在此第三次决定功能。**无铅压电**（PZT 含铅）是持续多年的研发方向，目前尚无全面替代者。

## 4. 数字感与反直觉

- $\varepsilon_r$：真空 1 ｜ 聚乙烯 2.3 ｜ SiO₂ 3.9 ｜ Al₂O₃ 9 ｜ BaTiO₃ 1000–5000；
- $(BH)_{max}$ (kJ/m³)：铁氧体 ~30 ｜ AlNiCo ~50 ｜ SmCo ~200 ｜ Nd–Fe–B ~400——**四十年间永磁性能提升一个数量级**，直接使电动车驱动电机小型化成为可能；
- **反直觉**：变压器铁芯要**叠片**不是为了机械，而是为了缩短涡流回路；在相同近似条件下，经典涡流损耗随片厚平方增长。非晶、纳米晶、取向硅钢、铁氧体和 Fe–Co 等软磁体系各自在频率、磁通密度、温度、成本与加工上占优，不存在脱离工况的单一“最好材料”；压电功能则来自允许极化—应变耦合的非中心对称结构。

【研】对标 Coey《Magnetism and Magnetic Materials》、Jaffe《Piezoelectric Ceramics》；交换作用的量子起源、磁各向异性能、Landau 铁电理论（🔗 物理站相变）是研究生纵深。

---

*下一页功能线收官：热与光——从涡轮叶片的隔热涂层到透明的条件、从热电转换到光纤的 0.2 dB/km。*
