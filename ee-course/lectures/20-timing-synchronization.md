# 20 · 时序与同步：把“偶发错误”拆成时间窗和概率

环境节点的中断输入大多数时候都能被 MCU 读到，偶尔却多出一次计数或少一次唤醒。逻辑值本身可能没有错，错的是边沿到达采样触发器的时间：数据没有满足建立/保持要求，时钟路径有偏斜和抖动，异步输入还可能让触发器进入亚稳态。工程上要做两件不同的事：**用余量检查确定性时序，用概率语言描述同步器风险**。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ee-timing-synchronization-learning-title">

## 学习层：先预测“哪种余量变差”，再谈同步器

### 1. 具体情境：一个异步传感器中断为什么难以复现

把传感器中断接到 MCU 的时钟域。教学设定为时钟周期 $100 \mathrm{ns}$，发射触发器的 $t_{CQ,max}=8 \mathrm{ns}$、$t_{CQ,min}=4 \mathrm{ns}$，组合逻辑最大/最小延迟为 $25/5 \mathrm{ns}$，接收触发器的 setup/hold 为 $10/4 \mathrm{ns}$，捕获时钟相对发射时钟正偏斜 $2 \mathrm{ns}$，再给 $1 \mathrm{ns}$ 的抖动预算。正 skew 统一定义为捕获边沿更晚；同步器相邻级间的教学布线延迟默认为 $0 \mathrm{ns}$。

这些是**教学设定**，不是某颗 MCU 的时序保证值。默认静态检查有 $58 \mathrm{ns}$ setup 余量和 $2 \mathrm{ns}$ hold 余量；它说明这条同步数据路径在该简化模型内通过，但异步边沿仍然可能落入敏感窗口。

### 2. 揭示前预测：把偏斜的两个方向分开

1. 捕获时钟变晚，也就是正 skew 增大时，setup 余量和 hold 余量会同向变化，还是一个变好、一个变差？
2. 同步器级数增加，应说“在模型中降低亚稳态传播概率”，还是说“从此绝对安全”？
3. setup 与 hold 共同定义的时间区域，是否就是异步边沿的敏感/危险窗口？

### 3. 公式桥：确定性余量与概率性风险

一条单周期路径的 setup 余量可以写成

$$
S_{setup}=T+skew-jitter-t_{CQ,max}-t_{logic,max}-t_{setup}.
$$

hold 余量则从最早数据到达与捕获窗口开始比较：

$$
S_{hold}=t_{CQ,min}+t_{logic,min}-skew-jitter-t_{hold}.
$$

所有量的单位都是时间；正余量表示模型内满足，负余量表示需要改路径、时钟或约束。由 setup 项得到的最低周期代理是

$$
T_{min}=t_{CQ,max}+t_{logic,max}+t_{setup}+jitter-skew.
$$

若 $N$ 级同步器的相邻级直接相连，每两个真实级之间各有一个解析窗口，而不是每一级都凭空增加一窗。第 $i$ 个级间窗口为

$$
W_i=\max\left(0,\,
T+skew-jitter-t_{CQ,max}-t_{route}-t_{setup}\right),
\qquad i=1,\ldots,N-1,
$$

因此

$$
t_{resolve}=\sum_{i=1}^{N-1}W_i=(N-1)W_i
$$

（本实验假设各窗口相同）。这里显式扣除了真实的 $t_{CQ,max}$、级间布线、下一级 setup、skew 和 jitter；正 skew 使捕获更晚，增加 setup/解析窗口，却减少 hold 余量。若 $T_{min}\le0$，setup 不产生有限的最大时钟频率上限，不能把它显示成 0 MHz；hold 余量仍单独报告。

异步输入的边沿若相对于采样时钟相位近似均匀，可用

$$
p_{window}\approx\min\left(1,\frac{t_{setup}+t_{hold}+t_{jitter}}{T}\right)
$$

表示落入敏感窗口的相位比例。这只是概率代理；它不包含实际触发器的解析时间常数、器件老化、温度、布局和输入波形斜率。

同步器常用的定性关系是

$$
MTBF\propto\frac{e^{t_{resolve}/\tau_m}}{f_{clk}f_{data}C_m}.
$$

其中 $\tau_m$、$t_{resolve}$ 是器件相关的时间量，$C_m$ 是实现常数。教学实验只显示相对的 $\log_{10}$ 风险代理，不把它伪装成器件 MTBF，也不把非零概率说成绝对安全。默认敏感窗口为 $15 \mathrm{ns}$，占周期 $15\%$；两级同步器只有 $N-1=1$ 个真实级间解析窗口，窗口为 $83 \mathrm{ns}$，总解析时间也是 $83 \mathrm{ns}$，相对风险对数约为 $-181.1$，这个极小数只说明指数模型的方向，不能当作现场失效率。

数量级判断：正 skew 每增加 $1 \mathrm{ns}$，setup 余量增加约 $1 \mathrm{ns}$，hold 余量减少约 $1 \mathrm{ns}$。一个看似很小的时钟分配差异，在 hold 只剩几 ns 时就可能决定成败。把同步器多加一级的收益来自额外解析时间，而不是“魔法清零”。

### 4. 互动实验：同时看时序窗和同步器链

<div class="learning-lab" data-learning-lab="ee-timing-synchronization" markdown="1">

**无 JavaScript 时的静态 fallback：**默认教学设定为 $T=100 \mathrm{ns}$、$t_{CQ,max/min}=8/4 \mathrm{ns}$、逻辑最大/最小延迟 $25/5 \mathrm{ns}$、setup/hold $10/4 \mathrm{ns}$、skew $2 \mathrm{ns}$、jitter $1 \mathrm{ns}$、同步器级间布线 $t_{route}=0 \mathrm{ns}$、两级同步器，亚稳态时间常数代理 $0.2 \mathrm{ns}$。正 skew 表示捕获时钟更晚。

| 账本项 | 默认结果 | 单位 / 解释 |
|---|---:|---|
| setup 余量 | 58.0 | ns；含 skew、jitter 和最长路径 |
| hold 余量 | 2.0 | ns；含最早路径 |
| setup 所需最小周期 | 42.0 | ns；教学最慢路径 |
| 最大时钟频率代理 | 23.81 | MHz；$10^3/T_{min}(ns)$ |
| 敏感窗口 | 15.0 | ns；setup + hold + jitter |
| 敏感窗口占比 | 15.00 | %；相位均匀假设代理 |
| 级间解析窗口 | 83.0 | ns；$T+skew-jitter-t_{CQ,max}-t_{route}-setup$ |
| 真实窗口数 | 1 | 个；$N-1$，两级同步器只有一个 |
| 两级总解析时间代理 | 83.0 | ns；窗口 × $(N-1)$ |
| log10 风险代理 | -181.06 | 相对指标；不是绝对失效率 |

**图意说明：**互动 SVG 应画出发射/捕获时钟、数据到达阶梯、setup 与 hold 敏感窗口，旁边画异步输入进入 FF1、FF2 的同步器链，并把每个真实级间窗口画成独立的 $W_i$，标注 $t_{CQ}$、级间布线、setup、skew、jitter 和 $N-1$ 个窗口。虚线、窗口底色、文字和级数共同编码，不能只靠颜色。

</div>

### 5. 真实修正：时序约束不是测量的替代物

- **setup/hold 是器件条件。** 不同电源、温度、工艺角、输入斜率和负载会改变 $t_{CQ}$、setup、hold 和最小脉宽；教学数字只能用于练习预算。
- **skew 和 jitter 不是同一件事。** skew 通常描述时钟到达位置的系统差异，jitter 描述随时间变化的边沿不确定性；时钟源、PLL、供电噪声和布线都会贡献它们。
- **最小延迟对 hold 特别重要。** 只用最大延迟做 setup，而忽略最快角和时钟早晚，可能在高频或低温时出现 hold 失败。
- **同步器只处理单比特采样风险。** 多比特计数器、脉冲宽度、事件丢失和跨域数据一致性还需要握手、Toggle、FIFO 或协议级设计。
- **MTBF 关系需要器件参数。** $\tau_m$ 和常数不能凭空填写；没有供应商表征、硅后测量和目标环境条件，就不应给出绝对可靠性数字。

### 6. 测量纪律：把偶发事件变成可复现记录

1. 记录时钟源、频率、供电、温度、探头带宽、触发设置和走线/连接条件；不要只记“偶尔错一次”。
2. 用示波器或逻辑分析仪分别观察源边沿、接收时钟、同步器输出和事件计数；采样率要足以分辨目标 ns 级窗口，仪器本身的抖动也要纳入解释。
3. 通过改变相位、频率、温度或输入边沿速度观察错误率趋势，保留测试时长、事件总数和未观察到错误的表述。没有观察到错误不等于证明概率为零。
4. 多位数据用协议级检查验证一致性；异步复位释放、时钟门控和低功耗唤醒要单独列时序约束。
5. 只在低压、限流、可断电的教学系统中做时序注入；不把实验结果外推到安全关键控制或市电设备。

### 7. 模型边界与项目产物

本页用固定延迟、固定 setup/hold、确定性 skew/jitter 预算、级间布线和 $N-1$ 个解析窗口构成最小模型。它不能给出具体触发器的 MTBF，不能捕捉所有相关抖动、输入斜率、温度、老化、布局串扰或多位 CDC 协议。

项目产物是“逻辑与时序余量表”：每条跨域信号记录发射/捕获时钟、最大/最小路径、setup/hold、skew、jitter、约束版本、同步结构、风险假设、测量日志和失效响应。对同步器写“降低概率、仍需验证”，不要写“绝对安全”。

## 1. setup 与 hold 的方向感

setup 问的是捕获边沿到来之前数据是否已经稳定足够久，hold 问的是边沿之后数据是否继续稳定足够久。时钟偏斜对两者方向相反，是因为捕获边沿相对于发射边沿的位移同时改变了“给数据的总时间”和“不能太早改变”的窗口。

工程约束中的数值通常来自库模型、静态时序分析和器件保证条件；示波器上的一次边沿只能作为测量证据的一部分。要覆盖最慢逻辑、最快逻辑、温度和电源角落，不能只在典型室温下看一个周期。

## 2. 亚稳态的正确语言

触发器在采样窗口附近可能需要更长时间解析到合法的逻辑状态。同步器通过把解析时间拉长来降低后续级仍受影响的概率；它不会改变“异步边沿可能落入窗口”这一事实，也不会使所有下游协议自动正确。

用概率语言还有一个实际好处：测试报告可以写“在 $N$ 次事件、$t$ 秒观察中未观察到错误，风险模型假设为……”，而不是写“安全”。这让测量、模型和工程要求保持可追溯。

## 3. 常见误判与纠正

- **误判：**setup 通过就够了。**纠正：**hold、最小延迟、时钟偏斜和抖动可能单独失败。
- **误判：**加两级触发器就绝对安全。**纠正：**级数降低概率，但风险仍非零，且需真实器件参数。
- **误判：**没有复现错误就没有时序问题。**纠正：**偶发事件是概率问题，测试时长和相位覆盖要写清。
- **误判：**同步器能修复多位数据撕裂。**纠正：**多位 CDC 需要握手、编码或 FIFO 等一致性结构。

## 4. 资料与边界

- 时域电路、动态响应与测量基础参见 [MIT OpenCourseWare 6.002: Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/) 与 [OpenStax University Physics Volume 2](https://openstax.org/details/books/university-physics-volume-2)。
- 电子信号和测量方法参见 [MIT OpenCourseWare 6.071J: Introduction to Electronics, Signals, and Measurement](https://ocw.mit.edu/courses/6-071j-introduction-to-electronics-signals-and-measurement-spring-2006/)。
- 接口与测试标准应从 [IEEE Standards](https://standards.ieee.org/) 的适用版本核对；工程设计、风险和验证能力可参考 [ABET Criteria for Accrediting Engineering Programs](https://www.abet.org/accreditation/accreditation-criteria/criteria-for-accrediting-engineering-programs-2025-2026/)。本讲的时序数字与风险数值是教学设定，不是芯片保证值或安全证明。

本讲只讨论低压、限流、可断电教学系统；不涉及市电、建筑配电、并网或高能系统。

## 5. 小结

时序问题先用 setup/hold、最大/最小路径和 skew/jitter 做确定性预算，再用同步器和概率模型描述亚稳态传播风险。同步器是降低概率的结构，不是绝对安全的许可证；多位数据、复位、时钟门控和低功耗唤醒还要分别验证。下一讲把事件时间线和 PWM 波形放入 MCU 的电流账本。
