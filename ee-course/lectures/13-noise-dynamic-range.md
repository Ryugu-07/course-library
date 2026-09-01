# 测量 I · 热噪声、SNR 与动态范围

> 示波器上“没有信号”的一条细线，也可能是探头底噪、热噪声和带宽共同画出来的。先把噪声密度写成每根带宽的单位，再积分到测量窗口，才能判断一个传感器的小变化是被物理噪声淹没，还是只是仪器没有被正确设置。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ee-noise-dynamic-range-learning-title">

<h2 id="ee-noise-dynamic-range-learning-title">学习层：增加带宽为什么会让底噪升高</h2>

<h3>1. 具体情境：一个毫伏级变化到底可不可见</h3>

低功耗节点的传感器输出只有毫伏级变化。工程师把示波器带宽从 $100\ \mathrm{Hz}$ 打开到 $1\ \mathrm{kHz}$，波形看起来突然更“粗”；如果只看峰峰值，可能会把带宽增加误判成传感器变差。电阻的热噪声、电路的输入等效噪声密度和测量带宽共同决定 rms 噪声，信号大小再决定 SNR 与动态范围。

以下数字是**教学设定**：$R=1.0\ \mathrm{k\Omega}$、$T=300\ \mathrm K$、等效噪声带宽 $B=1.0\ \mathrm{kHz}$、仪器白噪声密度 $5\ \mathrm{nV}/\sqrt{\mathrm{Hz}}$、目标信号 $10\ \mathrm{mV_{rms}}$、满量程 $1.0\ \mathrm V_{rms}$。它们用于演算和量级判断，不是某台仪器的动态噪声记录。

<h3>2. 揭示前预测：密度、积分和信噪比</h3>

打开实验前先预测：

1. 白噪声带宽扩大四倍，积分后的 rms 噪声会扩大约四倍、两倍还是不变？
2. 只把电阻值扩大四倍，热噪声电压密度会扩大约四倍、两倍还是不变？
3. 在满量程固定且噪声不变时，目标信号减半，SNR 和动态范围会变大还是变小？

提交后调节电阻、温度、带宽和仪器底噪。图中用 PSD $S_v$ 在频率轴上的矩形积分表示 $S_vB$，再开方得到 rms 噪声，而不是把一根噪声曲线冒充一条真实测量记录。

<h3>3. 公式桥：从噪声密度积分到 dB</h3>

热平衡下，理想电阻的 Johnson 电压幅度密度为

$$
e_{n,R}=\sqrt{4k_\mathrm BT R}\quad [\mathrm{V}/\sqrt{\mathrm{Hz}}],
$$

其中 $k_\mathrm B=1.380649\times10^{-23}\ \mathrm{J/K}$ 是定义常数，$T$ 是 K，$R$ 是 $\Omega$。对应的电压功率谱密度是

$$
S_{v,R}=e_{n,R}^2=4k_\mathrm BT R\quad [\mathrm{V^2/Hz}].
$$

在白噪声和矩形等效带宽的教学近似下，先对 PSD 积分再开方：

$$
v_{n,R}^2=\int_0^B S_{v,R}\,df=S_{v,R}B\quad [\mathrm{V^2}],
\qquad
v_{n,R}=\sqrt{S_{v,R}B}=e_{n,R}\sqrt B,
\qquad
v_{n,\mathrm{tot}}=\sqrt{v_{n,R}^2+v_{n,\mathrm{inst}}^2}.
$$

若仪器幅度密度为 $e_{n,\mathrm{inst}}$，则 $S_{v,\mathrm{inst}}=e_{n,\mathrm{inst}}^2$，独立源的 PSD 相加为 $S_{v,\mathrm{tot}}=S_{v,R}+S_{v,\mathrm{inst}}$，再由 $v_{n,\mathrm{tot}}=\sqrt{S_{v,\mathrm{tot}}B}$ 得到 rms 电压。图中的矩形“面积”因此是方差 $\mathrm{V^2}$，不是把幅度密度乘 $B$ 后称作功率。

独立噪声源用均方根平方相加，不直接相加幅值。若信号 rms 值为 $V_s$，

$$
\mathrm{SNR}_{\mathrm{dB}}=20\log_{10}\frac{V_s}{v_{n,\mathrm{tot}}}.
$$

若满量程可用信号 rms 值为 $V_{\mathrm{FS}}$，在同一个输入等效噪声定义下，动态范围可以记为

$$
\mathrm{DR}_{\mathrm{dB}}=20\log_{10}\frac{V_{\mathrm{FS}}}{v_{n,\mathrm{tot}}}.
$$

这两个 dB 量回答不同问题：SNR 针对当前信号，DR 针对可用最大信号与底噪之间的范围。量纲检查：$k_\mathrm BT$ 是 J，即 $\mathrm{V\,C}$；乘以 $R=\mathrm{V/A}$ 并利用 $\mathrm C=\mathrm{A\,s}$，得到 $\mathrm{V^2s}=\mathrm{V^2/Hz}$，开方后为 $\mathrm{V}/\sqrt{\mathrm{Hz}}$；再乘 $\sqrt B$ 回到 V。

默认教学值的热噪声密度约 $4.1\ \mathrm{nV}/\sqrt{\mathrm{Hz}}$，在 $1\ \mathrm{kHz}$ 下热噪声 rms 约 $0.129\ \mu\mathrm V$；仪器密度对应约 $0.158\ \mu\mathrm V$，合成底噪约 $0.204\ \mu\mathrm V$。因此 $10\ \mathrm{mV}$ 信号的 SNR 约 $94\ \mathrm{dB}$，$1\ \mathrm V$ 满量程的教学动态范围约 $134\ \mathrm{dB}$。这些数字是公式结果，不是仪器宣称。

<h3>4. 互动实验：看见“密度 × 带宽”的面积</h3>

<div class="learning-lab" data-learning-lab="ee-noise-dynamic-range" markdown="1">

**无 JavaScript 时的静态 fallback：**教学设定为 $R=1.0\ \mathrm{k\Omega}$、$T=300\ \mathrm K$、$B=1.0\ \mathrm{kHz}$、仪器噪声密度 $5\ \mathrm{nV}/\sqrt{\mathrm{Hz}}$、信号 $10\ \mathrm{mV_{rms}}$、满量程 $1.0\ \mathrm V_{rms}$。理想热噪声密度约 $4.07\ \mathrm{nV}/\sqrt{\mathrm{Hz}}$，热噪声 rms 约 $0.129\ \mu\mathrm V$；仪器项约 $0.158\ \mu\mathrm V$；独立源合成底噪约 $0.204\ \mu\mathrm V$，SNR 约 $93.8\ \mathrm{dB}$，教学动态范围约 $133.8\ \mathrm{dB}$。

| 账本项 | 默认结果 | 单位 / 解释 |
|---|---:|---|
| 电阻 $R$ | 1.00 | kΩ，教学输入 |
| 温度 $T$ | 300 | K，教学输入 |
| 等效带宽 $B$ | 1000 | Hz，矩形积分近似 |
| 热噪声密度 | 4.07 | nV/√Hz |
| 热噪声 rms | 0.129 | µV，$e_n\sqrt B$ |
| 仪器噪声 rms | 0.158 | µV，白噪声教学项 |
| 合成底噪 | 0.204 | µV，RSS |
| SNR | 93.8 | dB，当前信号 |
| 动态范围 | 133.8 | dB，满量程到底噪 |

图中的阴影面积代表在 $0$ 到 $B$ 内积分的噪声方差 $S_vB$（$\mathrm{V^2}$），旁边标出开方后的 $e_n\sqrt B$（$\mathrm{V_{rms}}$）；它不是把 $e_nB$ 称作功率，也不是一条伪造的频谱观测。

若当前信号 rms 值超过满量程 rms 值，即 $V_s>V_{\mathrm{FS}}$，实验输出状态为 **overload**。此时削顶已经破坏线性工作点，SNR 和动态范围均标为“不适用”，不能用噪声很小的公式给出虚假的高分数。

</div>

<h3>5. 真实修正：噪声密度和测量带宽都要定义</h3>

- **实际噪声未必是白的**：$1/f$ 噪声、爆米花噪声、开关尖峰、机械耦合和环境电磁干扰会让密度随频率变化，积分必须是 $\int S_v(f)df$，不能永远用 $e_n\sqrt B$。
- **带宽常常是 ENBW**：示波器带宽限制、数字滤波器、RBW、窗函数和平均算法有各自的等效噪声带宽；名义截止频率不是积分区间的全部说明。
- **噪声可能相关**：两个源若相关，不能简单 RSS；放大器的电压噪声和电流噪声还会通过源阻抗共同转化为输入等效噪声。
- **动态范围受上端限制**：满量程、削顶、线性范围、共模范围和热压缩会决定可用最大信号；底噪低不等于大信号不失真。

曲线和表格是教学仿真；短接输入、终端匹配和多次采样得到的底噪才是测量证据；器件噪声指标、带宽与标准测试方法要以具体数据手册和适用标准为准。

<h3>6. 测量方案：短接、终端、积分和重复性</h3>

先定义输入等效端口和测量带宽。用同轴端接或低噪声短接测仪器底噪，改变示波器带宽限制或数字带宽，检查 rms 噪声是否按 $\sqrt B$ 缩放；再接入已知电阻，改变 $R$ 或温度条件，在不改变其他设置的情况下拟合 $4kTR$ 斜率。记录采样率、记录长度、窗函数、RBW/ENBW、探头衰减、接地和重复统计量。

不要用示波器的峰峰值直接当作 rms 热噪声，也不要把一条带宽未知的 FFT 垂直刻度直接和 $\mathrm{nV}/\sqrt{\mathrm{Hz}}$ 相比。全程使用低压、限流、可断电信号源。

<h3>7. 模型失效与项目迁移</h3>

如果目标信号接近 $1/f$ 拐点、存在周期性干扰或噪声与信号相关，就需要频率相关 PSD、互谱、锁相或时域故障记录；单一白噪声 rms 不能支撑结论。若底噪已低于 ADC 量化噪声，下一步应接入第 14 讲的量化与采样预算，而不是继续假设模拟噪声主导。

迁移到贯穿项目时，保留噪声源表：传感器、偏置电阻、放大器、ADC、参考源和仪器分别写输入等效密度、积分带宽、相关性和证据类型；把目标最小变化、SNR 门槛、满量程和动态范围写在同一页。迁移问题：带宽加倍时为什么噪声只乘 $\sqrt2$？如果测得噪声随带宽线性增长，哪一个“白噪声 + 矩形带宽”假设最可能失效？

</section>

## 1. 热噪声的边界

Johnson 噪声是热平衡电阻的模型；温度、频率范围、端口定义和测量带宽必须清楚。真实电阻、传感器和放大器还可能有电流噪声、$1/f$ 噪声和外部干扰。把所有底噪都叫“热噪声”会掩盖可改进的布局、偏置和屏蔽问题。

## 2. SNR 与动态范围的分工

SNR 是当前信号相对于噪声的可辨认程度；动态范围是系统允许的最大线性信号相对于底噪的跨度。一个系统可能对当前小信号有足够 SNR，却因为满量程太小而容易削顶；也可能满量程很大，却在目标信号处 SNR 不够。必须同时给出信号定义、噪声积分带宽和上端线性边界。

## 3. 小结

先用噪声密度的单位，再用 PSD 在有效带宽上积分，最后用 rms 比值计算 SNR 和动态范围。白噪声近似给出有用的数量级：带宽四倍，rms 噪声两倍；电阻四倍，热噪声电压密度两倍。真实测量还要处理 $1/f$、相关源、ENBW、探头底噪、削顶和温度。

## 资料与边界

- 电路噪声、交流电路和能量量纲的基础入口是 [MIT OpenCourseWare 6.002: Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/) 与 [OpenStax University Physics Volume 2](https://openstax.org/details/books/university-physics-volume-2)。
- 测量带宽、实验记录和不确定度训练可参考 [MIT OpenCourseWare 6.071J: Introduction to Electronics, Signals, and Measurement](https://ocw.mit.edu/courses/6-071j-introduction-to-electronics-signals-and-measurement-spring-2006/)。
- 工程测试与标准入口是 [IEEE Standards](https://standards.ieee.org/)，本页不代替具体仪器、器件或标准测试方法。

页内数值均为教学设定或公式计算，不是动态噪声观测。互动只覆盖低压、限流、可断电的教学信号；不涉及市电测量、认证实验或高能系统。
