# 流体 III · 湍流与标度律

> **对标**：Frisch《Turbulence》/ Pope《Turbulent Flows》/ Landau §31–34 ｜ **前置**：fl-01、fl-02、asm-03（标度与 RG 的思想）
> 费曼称湍流为"经典物理最后一个未解的重要问题"。**方程完全已知，解却无从谈起**——这在物理学中极其罕见。本页讲清我们**确实知道**的部分：Kolmogorov 的标度律，以及它为什么既漂亮又不完备。

<figure class="plot" markdown="1">
![湍流能谱的 Kolmogorov -5/3 律与三个尺度区。](assets/img/fl-03-turbulence-spectrum.svg)
<figcaption><span class="fig-id">图 fl-03.1</span>湍流能谱 \(E(k)\)：含能区（注入）、<strong>惯性区 \(E(k)\propto k^{-5/3}\)</strong>（能量级串，无耗散无注入）、耗散区（\(k>1/\eta\) 指数截断）。</figcaption>
</figure>

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="fl03-learning-title">

<h2 id="fl03-learning-title">学习层：把级串读成一张尺度账，而不是一台 DNS</h2>

### 1. 具体故事：搅拌器送进来的能量去了哪里？

把水槽想成有三个账房：大尺度 \(L\) 接受外部输入，小涡在惯性区把能量向更小的 \(r\) 传递，Kolmogorov 微尺度 \(\eta\) 最后交给黏性耗散。你要追踪的不是每个涡的轨迹，而是同一笔单位质量能量通量 \(\varepsilon\) 在尺度之间怎样保持。

先预测，再打开实验台：

1. 在惯性区内，能量通量会随 \(r\) 增大、减小，还是近似恒定？
2. 三维正向级串的纵向三阶结构函数 \(S_3(r)\) 的符号是什么？
3. 在同一个 \(p=6\) 上，间歇性修正的 \(\zeta_6\) 会比 \(6/3\) 大还是小？

实验揭示前只保留预测门；揭示后才显示尺度带、能谱、通量、\(4/5\) 律和 K41/She–Lévêque 指数对照。

### 2. 正式桥：K41 尺度基线与带条件的精确关系

若 \([\varepsilon]=L^2T^{-3}\)，且声明的局域各向同性、足够宽的惯性区和高 Reynolds 数条件成立，量纲分析给出尺度 \(r\) 上的速度差和涡周转时间：

$$
\delta u(r)\sim(\varepsilon r)^{1/3},\qquad
\tau_r\sim\frac r{\delta u(r)}=\varepsilon^{-1/3}r^{2/3}.
$$

能谱和 Kolmogorov 微尺度分别写成

$$
E(k)=C_K\varepsilon^{2/3}k^{-5/3},\qquad
\eta=\left(\frac{\nu^3}{\varepsilon}\right)^{1/4},\qquad k_\eta\sim\eta^{-1}.
$$

其中 \(\delta u(r)\)、\(\tau_r\) 和 \(E(k)\) 只有在声明假设、教学窗口宽度和样本门槛同时满足时才作为 K41 读数发证；区外只标作 extrapolation 或 null。

本页采用的 \(E(k)\) 是**按单位质量、三维各向同性壳层积分的能谱约定**：

$$
\int_0^\infty E(k)\,\mathrm dk=\frac12\left\langle|\mathbf u|^2\right\rangle.
$$

因此 \([E]=L^3T^{-2}\)（SI 为 \(\mathrm{m^3\,s^{-2}}\)）；若记录的是单位体积能量，需再乘 \(\rho\)。这里 \(k\approx1/r\) 只表示尺度对应关系，不是 Fourier 变量与实空间间隔的精确等号。\(C_K\approx1.5\) 只是这个约定下的教学基准，不是脱离定义的普适数字：它会随一维/三维（壳层、纵向或横向）谱定义和 Fourier 归一化约定改变。

在 \(10\eta\lesssim r\lesssim L/10\) 的候选惯性带内，且至少有 **1 个 decade、2 个惯性样本**并满足已声明假设时，级串通量的尺度读数才写成

$$
\Pi(r)\approx\varepsilon,
$$

不是说每个瞬时涡都携带相同能量，而是统计平均上的通量 ledger 近似平坦。

三维不可压、齐次、各向同性、统计定常且高 Reynolds 数的教学窗口内，还有一个带条件的精确纵向 \(4/5\) 律。先固定符号：取 \(\hat{\mathbf r}=\mathbf r/|\mathbf r|\) 从 \(\mathbf x\) 指向 \(\mathbf x+\mathbf r\)，定义

$$
\delta u_\parallel(\mathbf x,\mathbf r)=\big[\mathbf u(\mathbf x+\mathbf r)-\mathbf u(\mathbf x)\big]\cdot\hat{\mathbf r}.
$$

于是

$$
S_3(r)=\left\langle(\delta u_\parallel)^3\right\rangle
=-\frac45\varepsilon r.
$$

负号与三维正向能量级串的方向一致；它不是“所有湍流数据在所有尺度都自动满足”的图形标签。有限 Reynolds 数、强各向异性、非定常、边界和强迫修正都要重新检查条件。图外或门槛不足的 \(S_3\) 只作 extrapolation，或留为 null。

### 3. 可操作实验：同一张尺子比较 K41 与间歇性

<div class="learning-lab" data-learning-lab="turbulence-cascade" markdown="1">

**JavaScript 失效时的静态读法：**默认账本可取 \(L=1\)、\(\nu=10^{-5}\)、\(\varepsilon=1\)、\(C_K=1.5\)。于是
\(\eta=(10^{-15})^{1/4}\approx1.778\times10^{-4}\)，\(L/\eta\approx5623\)，而可读的惯性带必须避开两端，例如只把 \(10\eta\lesssim r\lesssim L/10\) 当作教学窗口；本实验把至少 **1 个 decade 且至少 2 个惯性样本**作为发证门槛。门槛之外的 K41 数值是 extrapolation 或 null，不是已验证结果。

| 读数 | K41 | 间歇性对照（She–Lévêque） |
|---|---|---|
| 结构函数指数 | \(\zeta_p=p/3\) | \(\zeta_p=p/9+2[1-(2/3)^{p/3}]\) |
| \(p=3\) | \(1\) | \(1\)，这里只比较 \(\langle|\delta u|^3\rangle\) 的绝对值标度；signed \(S_3\) 的 \(4/5\) 律单独记账 |
| \(p=6\) | \(2\) | \(\approx1.778\)，高阶标度被压低 |
| 三维纵向 signed 三阶矩 | \(S_3=-4\varepsilon r/5\) | 这是精确律条件下的独立账，不由绝对值拟合指数重新证明 |

实验的 scale ledger 逐行列出 \(r,k,\delta u,\tau_r,E(k),\Pi(r)\) 和 signed \(S_3(r)\)，并明确标出 under-assumed-conditions 或 extrapolation/null；通量图使用同一无量纲纵轴 \(\Pi/\varepsilon\) 与 \(-S_3/(\varepsilon r)\)。再用同一组 \(p\) 画出常用绝对值结构函数的两套 \(\zeta_p\)。能谱和通量曲线是由公式直接生成的确定性教学数据，不是 DNS 样本。

</div>

### 4. 误区与适用边界

| 过强说法 | 更准确的读法 |
|---|---|
| “看到 \(k^{-5/3}\) 就证明流动是湍流。” | 这是一个标度诊断；有限带宽、各向异性和非定常系统都可能制造相似斜率。 |
| “K41 说明每个结构函数都严格是 \(p/3\)。” | 间歇性使高阶 \(\zeta_p\) 偏离 \(p/3\)；K41 是基线尺度假设，不是所有阶数的精确定理。 |
| “\(4/5\) 律只要三维就无条件成立。” | 还需要不可压、齐次、各向同性、统计定常和惯性区/高 Reynolds 数等条件，并注意强迫与黏性修正。 |
| “这台实验已经解析了湍流。” | 它是尺度账本：不解 Navier–Stokes，不生成 DNS，不证明每个真实流动服从 K41。 |

本页把“可由量纲推出的尺度”“统计通量的读法”“带条件的精确律”和“经验间歇性比较”分成四栏。换成二维逆级串、壁湍流、旋转/分层流或低 Reynolds 数后，符号、区间和适用条件都要重新核对。

</section>

## 1. 问题：闭合困难

把速度分解为均值与脉动 $\mathbf u = \bar{\mathbf u}+\mathbf u'$，代入 N–S 取平均得 **Reynolds 方程**（若另声明统计稳态，才可删去第一项）：

$$\rho\left(\partial_t\bar u_i+\bar u_j\partial_j\bar u_i\right) = -\partial_i\bar p + \mu\nabla^2\bar u_i - \rho\,\partial_j\underbrace{\overline{u'_iu'_j}}_{\text{Reynolds 应力}}$$

**新出现的 $\overline{u'_iu'_j}$ 未知**。为它写方程，又会出现三阶矩；如此无穷递归——**这就是闭合问题（closure problem）**，是非线性项 $(\mathbf u\cdot\nabla)\mathbf u$ 的直接后果。

**工程对策【引用，非严格】**：涡粘模型（$k$–$\varepsilon$、$k$–$\omega$ SST）用经验关系强行闭合；LES 只解大涡、模化小涡；DNS 完全求解但**代价随 $\mathrm{Re}^{9/4}$ 增长**（见 §4），只能用于低 $\mathrm{Re}$ 研究。**至今没有第一性原理的闭合方案。**

## 2. Richardson 级串与 Kolmogorov 1941

**图景**：大涡从平均流获得能量 → 失稳破碎成小涡 → 逐级传递 → 在最小尺度被粘性耗散。Richardson 的名句概括了它："大涡有小涡以其速度为食……"

**K41 的三条假设**：

1. **局域各向同性**：小尺度忘记了大尺度的方向性；
2. **惯性区**：存在 $\eta \ll r \ll L$ 的尺度范围，统计量**只依赖能量耗散率 $\varepsilon$ 与尺度 $r$**（既不依赖注入方式，也不依赖粘性）；本页把 \(10\eta\lesssim r\lesssim L/10\)、至少 1 个 decade 且至少 2 个样本作为教学窗口门槛；
3. **能量级串守恒**：惯性区内传递率 = 耗散率 $\varepsilon$。

**纯量纲分析【推导】**：$[\varepsilon]=\mathrm{m^2/s^3}$，要构造速度差 $\delta u(r)$；这给出惯性窗口内的 K41 基线，不会单独证明窗口存在：

$$\delta u(r)\sim(\varepsilon r)^{1/3}\quad\Longrightarrow\quad S_2(r)=\overline{(\delta u)^2}\propto(\varepsilon r)^{2/3}$$

傅里叶空间即得**著名的 $-5/3$ 律**：

$$\boxed{\,E(k) = C_K\,\varepsilon^{2/3}k^{-5/3}\,}$$

**$C_K\approx1.5$ 只是特定谱约定下的常用基准**；它依赖一维/三维谱的定义、是否做壳层或分量积分，以及 Fourier 归一化。不能把不同 convention 的数值直接比较成同一个普适常数。

**Kolmogorov 微尺度**：粘性主导的截断尺度

$$\eta = \left(\frac{\nu^3}{\varepsilon}\right)^{1/4},\qquad \frac{L}{\eta}\sim\mathrm{Re}^{3/4}$$

## 3. 一个带条件的精确关系：4/5 律

K41 大部分是量纲分析；在三维不可压、齐次、各向同性、统计定常的高 Reynolds 数惯性窗口中，N–S 还严格给出下面这个关系（Kolmogorov 1941）：

$$S_3(r)=\overline{(\delta u_\parallel)^3} = -\tfrac{4}{5}\,\varepsilon r$$

这是湍流理论中少数带条件的 exact laws 之一；**负号直接给出三维能量向小尺度正向级串的方向**。二维不能只写成“把符号反过来”：二维同时受能量和涡量平方（enstrophy）守恒约束，典型情形是**能量逆级串到大尺度、涡量平方正向级串到小尺度**。两种级串对应不同的 exact laws、通量定义和标度（系数也依赖符号约定），不能把三维 \(4/5\) 律原样套到二维或其他流动。

## 4. K41 的裂缝：间歇性

**Landau 的批评**：$\varepsilon$ 在空间上并非均匀，而是**高度间歇**——耗散集中在稀疏的强涡结构中。

**后果**：高阶结构函数偏离 K41 预言

$$
S_p^{\mathrm{abs}}(r)=\left\langle|\delta u_\parallel|^p\right\rangle\propto r^{\zeta_p},\qquad \zeta_p \ne p/3\ (p\ \text{较大时}).
$$

这里的 \(S_p^{\mathrm{abs}}\) 是常用的绝对值高阶结构函数；signed 的 \(S_3=\langle(\delta u_\parallel)^3\rangle\) 另由 \(4/5\) 律单独记账，不能用绝对值 \(\zeta_3\) 代替它。

**实测 $\zeta_p$ 是 $p$ 的凹函数**——这就是**反常标度**。相对于 K41，较高阶的 \(\zeta_p\) 降低意味着小尺度增量的尾部更重、绝对值结构函数随尺度缩小衰减得更慢；它不是把 signed \(S_3\) 的符号改掉。多重分形模型（She–Lévêque 等）能拟合，但**尚无第一性原理的推导**。

**这与 asm-03 的重整化群形成有趣对照**：临界现象中反常指数已由 RG 解释；**湍流中同样的"反常标度"至今没有对应的理论**。**这是本站最坦率的一处"未解"标注。**

## 5. 练习与要点

**例 1（DNS 为什么贵）** 需解析到 $\eta$，网格数 $\sim(L/\eta)^3\sim\mathrm{Re}^{9/4}$，加上时间步长约束，总计算量 $\sim\mathrm{Re}^{3}$。**$\mathrm{Re}=10^6$ 的飞机绕流，DNS 所需算力远超任何现有超算**——这就是工程必须依赖模型的原因。

**例 2（大气的级串）** 取 $\varepsilon\sim10^{-3}$ W/kg、$\nu\approx1.5\times10^{-5}$ m²/s：$\eta\sim(\nu^3/\varepsilon)^{1/4}\approx1.36$ mm。若天气尺度取几公里，$L/\eta$ 约为 $10^6$，即**约六个 decades** 的级串，最终在毫米尺度上变成热。

**例 3（湍流为什么"混合得好"）** 湍流扩散系数 $\sim u'L \gg \nu$。**这就是搅拌咖啡的原理**：分子扩散需要数小时，湍流混合只要几秒——**代价是耗散了你搅拌的能量**。$\blacksquare$

---

*下一页：湍流从哪里来？答案是层流的失稳。线性稳定性分析、对流胞与分岔——从有序到混沌的第一步。*
