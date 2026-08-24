# 性能 II · 断裂、韧性与疲劳

> 工程结构的灾难性事故几乎从不是"应力超过屈服强度"，而是**裂纹**：从看不见的缺陷长起来，某一刻突然贯穿。本页给三件真正决定安全的知识——断裂力学（裂纹的判据）、韧脆转变（温度的陷阱）、疲劳（时间的陷阱）。这也是本站与机器的力学站（:8091 失效线）分工最清楚的一页：那边讲怎么算，这边讲**为什么材料是这个韧性**。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="materials-fracture-learning-title">

<h2 id="materials-fracture-learning-title">学习层：一条 2 mm 裂纹，何时只是疲劳，何时已经失稳？</h2>

### 1. 具体材料情境：带缺口的齿轮轴

一根齿轮轴有可检测的半裂纹长度 **a = 2 mm**，几何因子 $Y=1.12$，循环载荷的最大应力为 **180 MPa**、应力比 $R=\sigma_{min}/\sigma_{max}=0.1$，材料 $K_{IC}=50$ MPa√m。设计者既要问最大载荷会不会立即断，也要问循环中的 $\Delta K$ 是否越过疲劳阈值；这不是同一个问题。

### 2. 必须作答的预测门：当前属于哪一段？

先选一个：**$\Delta K\le\Delta K_{th}$ 阈值区**、**$\Delta K_{th}<\Delta K<K_{IC}$ 的 Paris 稳定扩展区**、或 **$K_{max}\ge K_{IC}$ 的失稳区**。请先比较 $K_{max}$ 与 $K_{IC}$，再比较 $\Delta K$ 与 $\Delta K_{th}$；揭示后才显示裂纹长度扫描图、临界尺寸与循环账本。

### 3. 正式公式桥：最大载荷、循环范围与裂纹寿命

线弹性断裂力学把裂尖强度写成

$$
K_I=Y\sigma\sqrt{\pi a},\qquad K_{max}<K_{IC},\qquad
a_c=\frac{1}{\pi}\left(\frac{K_{IC}}{Y\sigma_{max}}\right)^2.
$$

疲劳循环另有

$$
\Delta K=Y(\sigma_{max}-\sigma_{min})\sqrt{\pi a},\qquad
\frac{da}{dN}=C(\Delta K)^m\quad\text{仅在 }\Delta K_{th}<\Delta K<K_{IC}\text{ 的稳定区适用}.
$$

因此安全因子可记为 $n_K=K_{IC}/K_{max}$；$K_{IC}$ 是断裂韧性，$\Delta K_{th}$ 是疲劳增长阈值，不能把“低于一个”推成“低于另一个”。

### 4. 误区与模型边界

- 应力低于屈服并不等于裂纹安全；$K_I$ 还随 $\sqrt a$ 增长，几何因子 $Y$ 由试样/结构决定。
- Paris 定律不是所有裂纹长度的通用寿命公式：阈值下近似不增长，接近 $K_{IC}$ 时进入快速失稳；短裂纹、过载迟滞、平均应力和环境会改变它。
- $K_{IC}$ 的平面应变材料常数需要合格试样与小范围屈服条件；用一个教学数值不能替代标准断裂试验或损伤容限验证。
- Paris 积分给的是模型内的循环数估计，不是免检承诺；检测能力、载荷谱和裂纹形状必须另行纳入安全决策。

<div class="learning-lab" data-learning-lab="materials-fracture-ledger" markdown="1">

**无 JavaScript 时的静态 fallback：**默认值给出 $K_{max}\approx15.98$ MPa√m、$K_{min}\approx1.60$ MPa√m、$\Delta K\approx14.38$ MPa√m。于是安全因子 $K_{IC}/K_{max}\approx3.13$，临界裂纹约 $a_c=19.58$ mm；若取 $C=3\times10^{-11}$、$m=3$，当前点落在 Paris 区，$da/dN\approx8.92\times10^{-8}$ m/cycle，模型积分到 $a_c$ 约 30,495 cycles。

| 账本量 | 静态结果 | 解释 |
|---|---:|---|
| $K_{max}$ | 15.98 MPa√m | 与 $K_{IC}=50$ 比较 |
| $\Delta K$ | 14.38 MPa√m | 与 $\Delta K_{th}=4$ 比较 |
| 安全因子 | 3.13 | $K_{IC}/K_{max}$ |
| $a_c$ | 19.58 mm | 单调最大应力下的临界尺寸 |
| $da/dN$ | $8.92\times10^{-8}$ m/cycle | 仅 Paris 稳定区 |
| 判定 | Paris 稳定扩展区 | 阈值与失稳分开记账 |

</div>

</section>

## 1. 断裂力学：为什么强度不够用

**Griffith 的洞察（1920）**：脆性材料的实际强度远低于理论值，因为存在裂纹——裂尖应力集中放大到局部断键。能量判据：裂纹扩展当"释放的弹性能 ≥ 新建表面的能量"：

$$
\sigma_f = \sqrt{\frac{2E\gamma_s}{\pi a}} \quad\Longrightarrow\quad \boxed{\sigma_f \propto 1/\sqrt{a}}
$$

**读法**：**断裂强度由最大裂纹长度决定，不由材料的键强决定**——这是材料工程最重要的思维转向之一（也是结构 IV"玻璃很强却一划就断"的答案：表面微裂纹）。

**现代形式（Irwin）**：应力强度因子 $K = Y\sigma\sqrt{\pi a}$ 描述裂尖场强度，材料抵抗值 $K_{IC}$（**断裂韧性**，单位 MPa·√m）是新的材料常数。判据 $K < K_{IC}$。金属的 $K_{IC}$ 高不是因为表面能大（$\gamma_s$ 只有 J/m² 级），而是**裂尖塑性区消耗巨额功**（$G_c$ 可达 kJ/m²——三个数量级的差距全在塑性）：**韧性 = 让位错在裂尖前面帮你挡刀**。

<figure class="diagram" markdown="1">
![Crack-tip stress concentration and plastic zone](assets/img/mat-09-crack-tip.svg)
<figcaption><span class="fig-id">图 9.1</span>裂纹把远场应力集中到裂尖，\(K=Y\sigma\sqrt{\pi a}\) 描述场强；脆性材料的塑性区很小，韧性材料能以更大的塑性区钝化裂尖、耗散断裂功。</figcaption>
</figure>

**容许缺陷尺寸**（设计的真正问题）：$a_c = \frac{1}{\pi}\big(\frac{K_{IC}}{Y\sigma}\big)^2$——**它把无损检测的能力与设计应力绑在一起**：能测出 2 mm 的裂纹，就得保证 $a_c > 2$ mm。"损伤容限设计"（航空标准做法）的全部数学在这一行。

**强度-韧性的反相关**：高强钢的 $K_{IC}$ 通常更低（强度靠限制位错、韧性靠位错耗能——**同一个机制的两面**）。这是材料界最顽固的权衡之一，Ashby 图上表现为一条压制线；突破它是先进材料研究的永恒主题（前沿 I）。

## 2. 韧脆转变：温度的陷阱

BCC 金属（碳钢！）与部分 HCP 存在**韧脆转变温度 DBTT**：低于它，冲击功断崖式下跌——因为 BCC 位错运动的 Peierls 应力强烈温度敏感（结构 II 的伏笔），低温下位错动不了，裂尖无法产生塑性区 ⇒ 韧性归零。

**历史现场**：二战期间数百艘 Liberty 轮在冷水中船体脆断（部分断成两截）——低温 + 焊接残余应力 + 高硫钢的三重叠加；泰坦尼克号钢板的低温冲击韧性同样是事后分析的焦点。**FCC 金属（奥氏体不锈钢、铝、铜）没有 DBTT**——所以 LNG 储罐（-162 °C）与低温设备一律用奥氏体不锈钢或铝合金：**这是"晶体结构直接决定选材"最硬的一条工程规则**。

## 3. 疲劳：时间的陷阱

**80–90% 的机械失效来自疲劳**：远低于屈服强度的**交变**应力，循环足够多次后断裂。三阶段：裂纹萌生（表面滑移带、缺口、夹杂）→ 稳定扩展（每循环推进一点，断口留下**疲劳辉纹**）→ 瞬断。

<figure class="diagram" markdown="1">
![Three zones in a fatigue fracture surface](assets/img/mat-09-fatigue-fracture.svg)
<figcaption><span class="fig-id">图 9.2</span>疲劳断口从源区萌生，稳定扩展区留下同心推进的辉纹，最后进入粗糙的瞬断区；断口上的三区对应疲劳寿命的三个阶段。</figcaption>
</figure>

<figure class="plot" markdown="1">
![S-N curves for steel and aluminum](assets/img/mat-09-sn.svg)
<figcaption><span class="fig-id">图 9.3</span>S–N 曲线：钢存在疲劳极限（约 0.4–0.5 \(\sigma_{UTS}\)，低于它可近似无限寿命），铝合金没有——曲线一路下滑，任何应力幅下都有寿命上限。这条差别决定了铝制飞机必须按"有限寿命 + 定期检查"设计。</figcaption>
</figure>

**Paris 定律**（裂纹扩展速率）：$\dfrac{da}{dN} = C(\Delta K)^m$（$m \approx 3$）——寿命预测的工作马；结合 $a_c$ 与检测间隔即得**检修周期**。

**疲劳的工程铁律**（每条都可救命）：① 表面是战场——抛光、喷丸（引入残余压应力）、渗氮可提升寿命数倍；② **应力集中是元凶**——尖角、螺纹根、焊趾；圆角半径加大是最便宜的改进；③ 平均拉应力有害（Goodman 图修正）；④ 腐蚀环境下疲劳极限消失（腐蚀疲劳——工艺 IV 再会）。

**彗星号客机（1954）**：方形舷窗角的应力集中 + 增压循环疲劳导致空中解体——现代客机所有舱窗都是圆角，这是用生命换来的一条设计规则。

## 4. 数字感与反直觉

- $K_{IC}$（MPa·√m）：玻璃 ~0.7 ｜ 氧化铝 ~4 ｜ 铸铁 ~20 ｜ 中碳钢 ~50 ｜ 韧性压力容器钢 ~100+ ｜ 韧性铝 ~30；
- 由此算容许裂纹：$\sigma = 500$ MPa 的高强钢（$K_{IC} = 50$）$a_c \approx 3$ mm；同应力下 $K_{IC} = 100$ 的钢 $a_c \approx 13$ mm——**韧性翻倍，容许缺陷四倍**（平方关系）；
- **反直觉**：陶瓷不是"强度低"（抗压强度极高），是**韧性低**——它输在裂纹面前而不是应力面前；提高材料强度可能**降低**结构安全性（$a_c$ 缩小到检测不出来）——这是"越强越安全"直觉最危险的失效点。

【研】对标 Anderson《Fracture Mechanics》；J 积分、CTOD、小范围屈服修正、疲劳短裂纹与损伤容限方法论是研究生纵深。🔗 机器的力学站失效线给宏观算法，本页给微观机理，两站配合读。

---

*金属与陶瓷的力学讲完了。下一页换一个家族——高分子：链的物理学，一套完全不同的规则（时间与温度可以互换！）。*
