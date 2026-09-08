# 量子 II · 一维问题与谐振子

> **对标**：Griffiths §2 ｜ **前置**：qm-01、ode-02
> 一维定态问题是量子直觉的训练场：束缚态的量子化、隧穿的指数律。压轴是**谐振子的升降算符解法**——以代数推得允许能级，再由波函数证明存在性与完备性：量子力学最优雅的三页纸，也是场论（qft-01"粒子 = 激发量子"）的原型。

先修：[投影与量子态](qm-01-framework.html)、[二阶线性方程](../../math-course/site/ode-02-linear.html)。学完应能区分能量投影、算符乘积截断和位置网格三种操作，而不只背出 $E_n$。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="oscillator-learning-title">

## 学习层：无限维的精确阶梯，有限模型从哪里出现误差？

### 1. 先预测：能级、节点和顶端边界

先在无量纲单位 $\hbar=m=\omega=1$ 下预测：

1. $E_{n+1}-E_n$ 是常数 $1$ 还是随 $n$ 增长？
2. $a^\dagger|n\rangle$ 的系数是 $n+1$ 还是 $\sqrt{n+1}$？$|n\rangle$ 的波函数有几个节点？
3. 基态与激发态的归一化、$\sigma_x\sigma_p$ 是否仍能逐项写出精确账本？
4. 把 Fock 空间截成 $|0\rangle,\ldots,|N-1\rangle$ 后，顶端 $|N-1\rangle$ 的升算符和 $[a_N,a_N^\dagger]=1$ 会不会仍然无条件成立？

### 2. 精确账本：升降算符与波函数是同一套结构

在上述单位制中

$$
H=a^\dagger a+\frac12,\qquad
a|n\rangle=\sqrt n\,|n-1\rangle,\qquad
a^\dagger|n\rangle=\sqrt{n+1}\,|n+1\rangle,
$$

所以

$$
E_n=n+\frac12,\qquad
\langle x^2\rangle_n=\langle p^2\rangle_n=n+\frac12,\qquad
\sigma_x\sigma_p=n+\frac12\ge\frac12.
$$

位置表象的精确函数为

$$
\psi_n(x)=\frac{H_n(x)e^{-x^2/2}}{\pi^{1/4}\sqrt{2^n n!}},
$$

其中 $H_n$ 是物理学家 Hermite 多项式；从 $n=0$ 的基态开始编号，第 $n$ 个束缚态有恰好 $n$ 个实节点，并满足 $\int_{-\infty}^{\infty}|\psi_n|^2dx=1$。实验用有限 $[-X,X]$ 网格近似这些量，同时把解析值并排放入账本。

### 3. 有限 Fock 图：可计算，不等于无限维定理

在 $N$ 维截断中，顶层升算符被丢掉：

$$
a_N^\dagger|N-1\rangle=0,\qquad
[a_N,a_N^\dagger]=I_N-N|N-1\rangle\langle N-1|.
$$

令 $P_N$ 为前 $N$ 个 Fock 态的投影。**先算无限维能量再投影**得到 $P_NHP_N=a_N^\dagger a_N+I_N/2$，全部保留能级（包括顶层）仍为 $n+1/2$。**先截断再相乘**得到 $H_N=(a_N^\dagger a_N+a_Na_N^\dagger)/2$，顶层只有 $(N-1)/2$，比真实能量低 $N/2$。原因是投影不保持乘法：$P_Naa^\dagger P_N\ne(P_NaP_N)(P_Na^\dagger P_N)$。离开又返回子空间的路径被后者删掉了。有限网格还会丢掉 $|x|>X$ 的高斯尾。实验的 $\int_{-X}^X|\psi|^2$、$\int_{-X}^X x^2|\psi|^2$、$\int_{-X}^X|\psi'|^2$ 是原始求积值；未补尾、未重新归一化，组合所得只是全线不确定性乘积的数值诊断，不是新量子态的严格方差。硬切波函数还会引入边界不连续，不能据此宣称违反不确定性原理。图和数值只是在有限图上核对精确公式，不能证明无限 Hilbert 空间的完备谱定理，也不能把截断边界当成物理墙。

### 4. 动手实验：先锁定判断，再揭开两张账

揭示后可调激发数 $n$、截断维数 $N$ 和位置窗口 $X$。波函数图标出节点与有限窗口；账本同时列出精确能级、有限矩阵能级、归一化、节点数、不确定性和顶端对易子残差。

<div class="learning-lab" data-learning-lab="quantum-oscillator" markdown="1">

**无 JavaScript 时的静态读法：** 默认取 $\hbar=m=\omega=1$、$n=2$、$N=12$。无限维精确答案是

| 项目 | 精确账本 | 有限模型的读法 |
|---|---:|---|
| 能级 | $E_2=2.5$ | $n<N-1$ 时 $H_N$ 给同值；顶层会有截断误差 |
| 升算符 | $a^\dagger\lvert2\rangle=\sqrt3\lvert3\rangle$ | 若 $2<N-1$，系数保留 |
| 归一化 | $\int\lvert\psi_2\rvert^2dx=1$ | 有限 $X$ 网格只差尾部与求积误差 |
| 节点 | 恰好 $2$ 个 | 网格要足够覆盖零点，不能用稀疏图数节点 |
| 不确定性 | $\sigma_x\sigma_p=2.5$ | 解析列是定理；网格列是数值检查 |
| 截断边界 | $[a_N,a_N^\dagger]-I_N$ 只在顶层不为零 | 顶层残差是模型边界，不是量子力学新定律 |

有限图负责可复算的诊断；能级等间距、归一化和节点定理仍属于无限维模型及其定义域。

</div>

### 5. 迁移问题：从谐振子回到一般一维势

光滑势阱在非退化极小值 $x_0$（$V''(x_0)>0$）附近才有非零频率的谐振子近似，但有限深阱还要处理指数尾和边界匹配，隧穿率也依赖势垒积分而不是谐振子的等间距谱。请在换势、换边界或换基底时，分别标注“精确代数结果”“数值截断结果”和“半经典近似”，不要把有限矩阵的漂亮图线外推成任意势的定理。

先闭卷算三题，再打开答案：

1. $N=4$、输入 $|3\rangle$，分别求 $\langle P_NHP_N\rangle$、$\langle H_N\rangle$ 和 $\langle[a_N,a_N^\dagger]-I_N\rangle$。
2. $V(x)=\lambda x^4$（$\lambda>0$）在零点有极小值。为什么二阶小振动近似不能给出其束缚能级？
3. 归一化波函数 $\psi(x)\propto e^{-(1-ic)x^2/(4s^2)}$（$s>0,c\in\mathbb R$）的密度仍是高斯。求 $\sigma_x\sigma_p$，判断“高斯一定使乘积为 $\hbar/2$”是否成立。

<details class="answer" markdown="1">
<summary>迁移答案：三种近似不能混用</summary>

1. 三个数依次是 $7/2$、$3/2$、$-4$。最后一项的**残差范数**为 $4$；数值正负与范数不能混称。丢掉的是 $|3\rangle\xrightarrow{a^\dagger}2|4\rangle\xrightarrow{a}4|3\rangle$ 这条中间路径。
2. $V''(0)=0$，二阶 Taylor 项为零；首个束缚项为四次，不能借用等间距谱。仅由量纲，平衡 $\hbar^2/(m\ell^2)$ 与 $\lambda\ell^4$ 得 $\ell\sim(\hbar^2/(m\lambda))^{1/6}$，能量尺度为 $\hbar^{4/3}\lambda^{1/3}m^{-2/3}$；这仍没有确定每个无量纲能级常数。
3. $\langle x\rangle=\langle p\rangle=0$，$\sigma_x^2=s^2$。由 $p\psi=i\hbar(1-ic)x\psi/(2s^2)$ 得 $\sigma_p^2=\hbar^2(1+c^2)/(4s^2)$，故乘积为 $\hbar\sqrt{1+c^2}/2$，仅 $c=0$ 达到 $\hbar/2$。非零 $c$ 的位置—动量协方差为 $\hbar c/2$；它仍可饱和含协方差的 Robertson–Schrödinger 不等式。

</details>

</section>

## 1. 一维方法论与三个标准问题

<figure class="plot" markdown="1">
![无限深方势阱能级与波函数](assets/img/qm-02-square-well.svg)
<figcaption><span class="fig-id">图 2.1</span>无限深方势阱：边界把波函数量子化成驻波，能级 \(E_n\propto n^2\)——有限区间 Dirichlet 边界下的离散谱。曲线是波函数经任意幅度缩放后上移至对应能级，纵轴不能同时读作能量和波函数的物理单位。</figcaption>
</figure>

定态方程 $-\frac{\hbar^2}{2m}\psi'' + V\psi = E\psi$。**通用直觉**：常势区 $E>V$ 给振荡解、$E<V$ 给指数解；变势时这只是局部曲率直觉，WKB 形式还需势缓变并避开转向点。在这里的实、足够规则势与连通区间上，采用分离的自伴边界条件（或全线正规束缚条件），且不附加自旋等内部自由度，离散束缚本征值为单重，按能量排序的第 $n$ 态有 $n$ 个节点。环上的周期边界可能简并，不能照搬这一结论。有限方阱还有连续散射谱；归一化束缚态并不意味着整个谱都是离散的。

这里的节点编号约定从 $n=0$ 开始：基态是第 $0$ 个束缚态且无节点，第 $n$ 个束缚态才有 $n$ 个节点。

**无限深方阱**（此处改用常见的 $n=1,2,\ldots$ 编号，因此节点数为 $n-1$）：$\psi_n = \sqrt{\frac2L}\sin\frac{n\pi x}{L}$，$E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}$——"驻波量子化"最裸露的样本；$E_1 > 0$：**零点能**（不确定性原理不许静止，qm-01 例 2 同源）。

**有限深阱**：阱外指数尾——波函数**渗入经典禁区**；束缚态条件化为超越方程（图解法——数值 III 求根的物理练习）。

**隧穿【厚势垒 / WKB 主指数，不是完整透射率】**：方势垒中 $\psi \sim e^{-\kappa x}$（$\kappa = \sqrt{2m(V_0 - E)}/\hbar$）。在厚势垒、WKB 主导的极限，完整透射率的对数主项为

$$
T_{\mathrm{WKB}}\ \propto\ e^{-2\kappa a}
$$

前因子、界面匹配、共振和薄势垒修正不在这条主指数里——所以它不是任意参数下的完整 $T$ 公式——但它明确了**对势垒宽度与高度的指数敏感性**。收租清单：α 衰变（Gamow：隧穿主指数解释寿命对衰变能量的强敏感性）、扫描隧道显微镜（STM：距离改变 1 Å 就可显著改变电流，变化幅度取决于有效功函数——原子成像的灵敏度来源）、闪存写入、太阳核聚变（质子靠隧穿越过库仑壁——**太阳发光靠量子隧穿**）。

## 2. 谐振子：升降算符（本页主菜）

<figure class="plot" markdown="1">
![量子谐振子等间距能级](assets/img/qm-02-harmonic.svg)
<figcaption><span class="fig-id">图 2.2</span>量子谐振子：抛物势里能级等间距 \(E_n=\hbar\omega(n+\tfrac12)\)，波函数是 Hermite 多项式 × 高斯；图中各条波函数先按峰值缩放，再上移到对应能级，因此显示形状而非归一化幅度。</figcaption>
</figure>

$\hat H = \frac{\hat p^2}{2m} + \frac12m\omega^2\hat x^2$。**定义**：

$$
\hat a = \sqrt{\frac{m\omega}{2\hbar}}\Big(\hat x + \frac{i\hat p}{m\omega}\Big), \qquad [\hat a, \hat a^\dagger] = 1 \quad (\text{由 } [\hat x,\hat p] = i\hbar \text{ 一行})
$$

**【推导（纯代数摘谱）】** $\hat H = \hbar\omega\big(\hat a^\dagger\hat a + \frac12\big)$（直接展开）。记数算符 $\hat n = \hat a^\dagger\hat a$：对易子给 $\hat n(\hat a^\dagger|\nu\rangle) = (\nu + 1)(\hat a^\dagger|\nu\rangle)$——$\hat a^\dagger$ **升一级**、$\hat a$ 降一级；对归一化本征态（假定所需升降操作在定义域内），非负性给 $\nu=\|a|\nu\rangle\|^2\ge0$，且 $\|a^k|\nu\rangle\|^2=\nu(\nu-1)\cdots(\nu-k+1)$。若 $\nu$ 非整数，取 $k=\lfloor\nu\rfloor+2$，右边恰有一个负因子，与范数平方非负矛盾；所以允许本征值只能是非负整数。解 $a\psi_0=0$ 得可归一化基态，再升阶构造全部 Hermite 本征态；它们在 $L^2(\mathbb R)$ 中完备，从而确实没有漏掉其他谱：

$$
E_n = \hbar\omega\Big(n + \frac12\Big), \qquad n = 0, 1, 2, \dots
$$

$\blacksquare$（基态波函数由 $\hat a|0\rangle = 0$ 的一阶 ODE 解出——高斯 $e^{-m\omega x^2/2\hbar}$；激发态 $= (\hat a^\dagger)^n|0\rangle/\sqrt{n!}$——Hermite 函数不请自来。）

**为什么这页纸重要到超出谐振子**：

- **等间隔能级 $\hbar\omega$** ⇒ 能量以"份"存取——**量子（quantum）一词的实体**；黑体辐射 Planck 假设（sm-03）的力学基础；
- 光滑势的非退化极小值附近 $V''(x_0)>0$ 时可近似谐振子（Taylor 二阶，mech-04 小振动的量子版）——分子振动光谱、晶格声子（solid-01）全是它；
- **场论的原型**（qft-01 的预告）：电磁场 = 无穷多谐振子（每个模式一个，opt/em 的简正模），$\hat a^\dagger$ = "产生一个光子"——**粒子是场的激发量子**这句现代物理总纲，语法就是本页的升降算符。

## 3. 练习与要点

**例 1（代数法算矩阵元）** $\langle n|\hat x^2|n\rangle$：$\hat x = \sqrt{\frac{\hbar}{2m\omega}}(\hat a + \hat a^\dagger)$ 展开、只留不改变 $n$ 的组合（$\hat a\hat a^\dagger + \hat a^\dagger\hat a = 2\hat n + 1$）⇒ $= \frac{\hbar}{m\omega}\big(n + \frac12\big)$——验证基态恰饱和不确定性下限 $\sigma_x\sigma_p = \frac\hbar2$（**这里的实高斯基态使乘积达到下界**；带二次相位的高斯未必如此，见上方迁移题）。

**例 2（隧穿主指数数量级）** 电子、势垒高于入射能量 $V_0-E=1$ eV、宽 0.5 nm：$\kappa \approx 5.1\ \mathrm{nm}^{-1}$，$T_{\mathrm{WKB}}\propto e^{-5.1}$；宽度加倍时主指数变为 $e^{-10.2}$。这只是厚势垒主指数，前因子与匹配条件仍需另算——STM 灵敏度与闪存漏电的同一笔账。

**例 3（零点能与边界效应）** 液氦在低温常压下仍不固化，量子运动与原子间相互作用的竞争是关键，不能由一个孤立谐振子的能量比较直接判定相态。Casimir 实验测的是物体间随几何和材料改变的力，可用边界相关能量的导数计算，并非脱离参考态的“绝对零点能”读数。[Jaffe（2005）](https://journals.aps.org/prd/abstract/10.1103/PhysRevD.72.021301) 也展示了不诉诸零点能的 QED 表述，因此不能单凭这一实验把绝对 $\frac12\hbar\omega$ 当作已被直接测量。$\blacksquare$

## 原始资料与进一步核查

[NIST DLMF §18.39(i)](https://dlmf.nist.gov/18.39#i) 给出 Schrödinger 算符、离散/连续谱的区分与谐振子 Hermite 解；[MIT 8.04 第8讲](https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2013/808334d09369e3a726f6f20d82315c20_MIT8_04S13_Lec08.pdf) 可对照升降算符和基态推导。本页的有限矩阵反例与迁移题可由上述定义独立计算。

---

*下一页：转入三维——角动量的代数、氢原子的完整求解与自旋：元素周期表从三个量子数里长出来。*
