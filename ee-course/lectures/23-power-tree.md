# 供电 · 电源树、稳压与负载瞬态

> 节点不是“有一个 3.3 V 就够了”：唤醒瞬间需要的电流、稳压器本身消耗的静态电流、去耦电容能撑多久，以及热从哪里出去，必须在同一棵电源树里对账。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ee-power-tree-learning-title">

<h2 id="ee-power-tree-learning-title">学习层：一条看似合格的 3.3 V 供电为何会掉压</h2>

### 1. 具体情境：休眠很漂亮，传感器唤醒却让 MCU 重启

低压限流实验台给节点提供教学输入 $5.0\ \mathrm{V}$。万用表测得 3.3 V，休眠电流也很小；但 MCU 唤醒传感器、打开指示灯和启动总线时，示波器在负载端看到短暂下陷，复位脚随后动作。问题不一定是“稳压器坏了”：可能是 LDO 的压降余量、开关稳压器的效率/控制环、输出电容的 ESR/ESL、供电走线阻抗或限流器设置共同造成。

本页只使用低压、限流、可断电电源。电池和电容也会储能；任何负载步进或短路实验都先断电、限流并确认连接方向，不涉及市电接线、带电市电测量或建筑配电。

### 2. 揭示前预测：先判断哪个量会恶化

1. 对固定的 $V_{out}$ 和 $I_{out}$，LDO 的 $V_{in}-V_{out}$ 增大时，耗散功率会增加还是减少？
2. 若负载阶跃相同、保持时间相同，输出电容加倍，理想电容造成的瞬态下陷会怎样变化？
3. 当输入电压低于 $V_{out}+V_{dropout}$ 时，LDO 还能保持额定输出吗？

提交三项预测后才揭示稳压器类型、参数和瞬态图。交互中的效率、ESR 和压降是合成教学输入，不能替代具体稳压器数据手册的稳定性、最大电流、热和瞬态曲线。

### 3. 公式桥：功率、静态电流和瞬态

输出功率为

$$
P_{out}=V_{out}I_{out}.
$$

LDO 的一阶耗散近似是

$$
P_{loss,LDO}\approx(V_{in}-V_{out})I_{out}+V_{in}I_Q,
$$

其中 $I_Q$ 是静态电流。于是

$$
\eta=\frac{P_{out}}{P_{in}},
\qquad
P_{in}=V_{in}I_{in}.
$$

额定输出必须先通过压降可达性检查。对不可调 LDO，令请求输出为 $V_{out,req}$，则

$$
V_{out,reach}=\max(0,V_{in}-V_{dropout}),\qquad
\text{ratedOutputValid}\iff V_{in}\ge V_{out,req}+V_{dropout},
$$

实际可交付电压按 $V_{out,del}=\min(V_{out,req},V_{out,reach})$ 记账；若 `ratedOutputValid=false`，额定输出账本必须标为无效，不能把请求值当成已调节输出。能量账本使用

$$
P_{out}=V_{out,del}I_{out},\qquad P_{loss}=P_{in}-P_{out},\qquad P_{in}\ge P_{out},\quad \eta\le100\%.
$$

本实验的“开关稳压器”明确是 **buck 教学模型**：只接受 $V_{in}>V_{out}$ 的降压方向，不用它假装升压。

若输出负载在短时间 $\Delta t$ 内增加 $\Delta I$，只由电容提供电荷的教学近似为

$$
\Delta V_C\approx\frac{\Delta I\,\Delta t}{C},
\qquad
\Delta V_{ESR}\approx\Delta I\,ESR,
$$

总下陷还可能包括走线电阻、封装电感和控制环响应。量纲检查：$\mathrm{A\cdot s/F=V}$，$\mathrm{A\cdot\Omega=V}$；若 $\Delta I$ 用 mA、$\Delta t$ 用 μs、$C$ 用 μF，$\Delta V_C$ 的数值直接是 mV。

负载电阻与输出电容还给出一个**负载电容被动时间尺度**：

$$
\tau_{load,C}=R_{load}C.
$$

它只是被动网络的数量级，不代表控制环动态响应；控制环动态响应必须由环路测量或器件资料单独证明。

默认教学输入 $V_{in}=5\ \mathrm{V}$、$V_{out}=3.3\ \mathrm{V}$、$I_{out}=80\ \mathrm{mA}$、$C=10\ \mathrm{\mu F}$、$\Delta I=60\ \mathrm{mA}$、$\Delta t=20\ \mathrm{\mu s}$ 时，电容项约 $120\ \mathrm{mV}$，ESR 为 $50\ \mathrm{m\Omega}$ 时再加约 $3\ \mathrm{mV}$。这是一百毫伏量级的教学现象，不是任何型号的保证值。

### 4. 互动实验：沿电源树追踪能量和下陷

<div class="learning-lab" data-learning-lab="ee-power-tree" markdown="1">

**无 JavaScript 时的静态 fallback：**默认是低压限流教学设定：输入 $5.0\ \mathrm{V}$，请求输出 $3.3\ \mathrm{V}$，LDO，负载 $80\ \mathrm{mA}$，静态电流 $0.5\ \mathrm{mA}$，压降输入 $0.2\ \mathrm{V}$，输出电容 $10\ \mathrm{\mu F}$，ESR $50\ \mathrm{m\Omega}$，负载阶跃 $60\ \mathrm{mA}$ 持续 $20\ \mathrm{\mu s}$，瞬态教学预算 $150\ \mathrm{mV}$。默认 LDO 可达 $4.8\ \mathrm{V}$，所以额定 $3.3\ \mathrm{V}$ 有效；若把输入降到 dropout 边界以下，必须显示额定账本无效并按可达输出计算。

| 账本项 | 默认读数 | 单位 / 解释 |
|---|---:|---|
| 输入到输出余量 | 1.70 | V；$V_{in}-V_{out}$ |
| LDO 压降余量 | 1.50 | V；减去教学输入 $V_{dropout}$ |
| 请求 / 可达输出 | 3.3 / 4.8 | V；$V_{out,req}$ / $V_{out,reach}$ |
| 额定输出账本 | 有效 | $V_{in}\ge V_{out,req}+V_{dropout}$ |
| 输出功率 | 0.264 | W；$3.3\ \mathrm{V}\times80\ \mathrm{mA}$ |
| LDO 输入功率 | 0.403 | W；含静态电流的教学计算 |
| LDO 耗散 | 0.139 | W；热负担的数量级 |
| 估算效率 | 65.6 | %；不超过 100%，非数据手册效率曲线 |
| 能量账本 | PASS | $P_{in}\ge P_{out}$；额定输出有效 |
| 电容下陷 | 120 | mV；$\Delta I\Delta t/C$ |
| ESR 下陷 | 3 | mV；$\Delta I\,ESR$ |
| 总瞬态下陷 | 123 | mV；未含走线/控制环寄生 |
| 剩余瞬态余量 | 27 | mV；预算减去教学下陷 |
| 负载电容被动时间尺度 | 0.4125 | ms；$R_{load}C$，不代表控制环动态响应 |

切换到 **buck 开关稳压器教学模型** 时，实验只用一个合成效率输入观察降压趋势；它不建模电感饱和、开关节点 EMI、补偿网络或具体器件的最小导通/关断时间，也不允许用 buck 输出高于输入电压。

</div>

### 5. 真实修正：电源树不是理想电压源的串联清单

**LDO** 结构直观，噪声和布局可能较容易管理，但压差几乎全部转成热，静态电流在休眠时可能比传感器平均电流更重要。不可调 LDO 的 $V_{in}$ 低于请求输出加压降时，额定输出无效；“还能测到 3.1 V”并不等于满足负载的规格，账本应改记可达输出而不是宣称 3.3 V 已调节。

**buck 开关稳压器教学模型** 通过电感、开关和控制环把较高输入能量转换到较低输出，电压差较大或功率较高时通常有更好的效率潜力，但会引入开关纹波、布局敏感的高 $di/dt$ 回路、最小负载/脉冲跳跃行为和 EMI 耦合。效率必须以器件在目标输入、电流、温度和布局下的曲线为证据，不能把一个百分比当常数。

**去耦** 分层而不是“电容越大越好”：芯片附近电容先承担最快的边沿，较远的储能电容承担较慢的负载变化；ESR、ESL、直流偏置、封装和回流路径都会改变有效阻抗。输出电容还可能是控制环稳定性的条件，必须读数据手册的允许范围。

### 6. 测量方案：同时测电压、电流和位置

1. 在稳压器输入、输出引脚、负载连接器和传感器电源脚分别标注测点；示波器地线用短回路/弹簧接法，避免把地线电感测成下陷。
2. 用电流测量或电源分析记录休眠、唤醒、总线活动和传感器加热等状态；把采样带宽、分流电阻、探头压降和限流设置写进记录。
3. 对负载步进先做可逆、低压、限流的教学波形，改变一个参数一次：电容、ESR 代理、走线长度或负载阶跃。记录下陷幅度、持续时间、恢复时间和复位状态。
4. 用热像或温度探头观察稳压器和电阻的温升，但不要把无接触温度读数当成结温；结温需要封装和热阻条件的证据。

### 7. 项目迁移与验收

把电源树账本交给后续讲次：每个 rail 的输入范围、工作/休眠/峰值电流、静态电流、估算与实测功率、压降余量、去耦位置/有效值、负载瞬态和热余量。低功耗验收不能只看平均功率；必须在唤醒、总线同时活动和传感器切换时测到负载脚电压，并证明不会越过项目定义的复位或测量窗口。

</section>

## 1. 画电源树的四层

一棵可审计的电源树至少显示：能源入口、保护/限流、转换器、负载分组以及每个节点的回流。示意为

$$
V_{in}\rightarrow\text{保护/限流}\rightarrow\{\text{LDO rail},\ \text{switcher rail}\}\rightarrow\{\text{MCU},\ \text{传感器},\ \text{总线}\}.
$$

每条支路同时记录电压、电流、功率和状态。若传感器在休眠时被断电，开关的漏电、GPIO 反向供电和启动时间也要进入账本；不能只从主电源芯片的静态电流推断全系统。

## 2. 效率与静态电流的数量级

当负载从几十 mA 变成几百 μA 时，$I_Q$ 在能量账本中的占比会迅速上升。对 LDO，输入电流通常接近输出电流加静态电流，所以大压差会直接变成热；对开关转换，输入电流与 $V_{out}/(V_{in}\eta)$ 同量级，但轻载行为必须看实际曲线。

不要用一个“典型效率”覆盖所有模式。项目应分别列出休眠、测量、通信和故障四个工作点；每个点保留输入电压、负载电流、温度和仪器分辨率。

## 3. 模型失效边界

$\Delta V=\Delta I\Delta t/C$ 假设电容独占负载供电，忽略控制环已响应、走线电阻、ESL、连接器和电源限流器。它适合先判断“是 mV、几十 mV 还是 V 级”，不适合预测完整振铃。LDO 的压降、开关稳压器的效率、输出电容稳定性和热阻都随型号、频率、温度、布局和版本变化；课程只提供教学输入，不伪造动态标准限值。

## 4. 资料与边界

基础功率和动态电路可查 [OpenStax University Physics Volume 2](https://openstax.org/details/books/university-physics-volume-2) 与 [MIT OCW 6.002: Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/)。测量实践可查 [MIT OCW 6.071J: Introduction to Electronics, Signals, and Measurement](https://ocw.mit.edu/courses/6-071j-introduction-to-electronics-signals-and-measurement-spring-2006/)。具体稳压器、电容、热阻、效率、最小/最大电容和 EMC 条款必须回到制造商数据手册与 [IEEE Standards](https://standards.ieee.org/) 的适用版本。

## 5. 小结

电源树的正确问题不是“输出有没有 3.3 V”，而是“在每个工作点，电能、压降、瞬态、热和回流是否同时有余量”。先用 $P=VI$ 和 $\Delta V\approx\Delta I\Delta t/C+\Delta I\,ESR$ 做数量级预测，再用负载端测量验证；下一讲继续追踪回流：为什么两个都叫 GND 的点仍会产生可测的噪声？
