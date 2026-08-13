# 量子信息 II · 量子算法

> **对标**：Nielsen & Chuang §4–6 ｜ **前置**：qi-01、数论一嘴（Shor 的归约）、信息论线
> 量子计算的加速从哪来？**不是“并行试所有答案”**（测量只给一个随机分支），而是把相位编排成可读出的干涉。三种 query contract 要分开：Deutsch–Jozsa 的 **exact quantum vs deterministic exact** 分离；Grover 的无结构搜索二次加速；Shor 的周期结构算法在理想算术模型下是量子多项式，而不是已证明的指数下界。

<div data-learning-page></div>

<figure class="diagram" markdown="1">
![Grover 搜索中的 Oracle 反射与均值扩散反射示意图。](assets/img/qi-02-quantum-circuits.svg)
<figcaption><span class="fig-id">图 qi-02.1</span>Grover 的两个反射：Oracle 反相 marked 子空间，diffusion 围绕均匀态（均值）反射。</figcaption>
</figure>

<section class="learning-layer" markdown="1" aria-labelledby="qi-algorithms-learning-title">

## 学习层：先看干涉账本，再谈“加速”

<h3 id="qi-algorithms-learning-title">1. 具体谜题：黑盒究竟允许你问什么？</h3>

把一个黑盒看成只能通过 query 访问的函数，而不是一段已经摊在桌上的答案表。Deutsch–Jozsa 给出承诺：$f:\{0,1\}^n\to\{0,1\}$ 不是恒常就是平衡；Grover 给出承诺：$N$ 个基态中有 $M$ 个 marked；Shor 则把分解归约为模幂函数的周期。三个问题都依赖干涉，但承诺、成功标准和 query 成本完全不同。

<h3>2. 先预测：符号翻转之后会发生什么？</h3>

先不打开实验台，回答四问：

1. Deutsch–Jozsa 中，若只随机抽 $t$ 个输入且结果全相同，能否**精确**断言 $f$ 恒常？若允许错误概率 $\delta$，$t$ 应如何随 $\delta$ 变化？
2. Grover 的 $N=4,M=1$ 取 marked index $2$。初始四个振幅都是 $1/2$；Oracle 后标记项是哪一个负的？此时均值是多少？再做 $a_i\mapsto2\bar a-a_i$，是否会把成功率推到 1？
3. Grover 的 $N=8,M=1$ 从 $k=0$ 开始，$p_0=1/8$。在 $k=1,2,3$ 时你预测概率继续上升，还是在某个峰后回落？
4. Shor 的 QFT 是“把所有答案读出来”，还是把周期梳变成频率峰？哪一步仍然需要经典连分数和算术验证？

<h3>3. 最小模型：正交的 good / bad 二维几何</h3>

Grover 的二维平面不是由 $|s\rangle$ 与单个 marked 态 $|w\rangle$ 组成的“基底”——它们一般不正交。正确的正交归一方向是

$$
|G\rangle=\frac1{\sqrt M}\sum_{x\in\mathrm{marked}}|x\rangle,
\qquad
|B\rangle=\frac1{\sqrt{N-M}}\sum_{x\notin\mathrm{marked}}|x\rangle,
\qquad \langle G|B\rangle=0.
$$

均匀初态在这两个方向上的分解为

$$
|s\rangle=\sqrt{\frac MN}|G\rangle+\sqrt{1-\frac MN}|B\rangle
=\sin\theta\,|G\rangle+\cos\theta\,|B\rangle,
\qquad \sin^2\theta=\frac MN.
$$

Oracle $O$ 在 good 方向乘 $-1$，在 bad 方向保持不变；扩散 $D=2|s\rangle\langle s|-I$。因此一次 $DO$ 把二维向量旋转 $2\theta$，完整迭代 $k$ 次后

$$
|\psi_k\rangle=\sin((2k+1)\theta)|G\rangle
 +\cos((2k+1)\theta)|B\rangle,
\qquad
p_k=\sin^2((2k+1)\theta).
$$

这里的“二维”是由两个**正交的均匀子空间方向**支撑的几何，不是说每个 marked 态被压成了一个任意选定的单态；从均匀初态出发，同一类中的每个基态振幅才保持相等。

<h3>4. 动手验证：把 Oracle、均值反射和过转拆开</h3>

实验台只维护 $N$ 个实振幅，直接显示符号，不把负振幅偷偷平方。它可以按 canonical 的 $O\to D$ 顺序逐步执行：初始化或完整迭代后只能进入 Oracle 半步；Oracle 后只能进入 Diffusion 半步，Diffusion 会闭合并计为完整的 $k+1$。下图把振幅柱、标记项、均值轴、半步流程与 $p_k$ 振荡放在同一视野。先选“$N=4,M=1$”，预测后再点完整迭代；然后选“过转：$N=8,M=1$”，观察达到峰值后继续运行为什么反而下降。Oracle query 只在 Oracle 半步增加一次，Diffusion 不算一次黑盒查询。

<div class="learning-lab" data-learning-lab="grover-amplification" markdown="1">

**无 JavaScript 时的静态读法：**默认预设为 $N=4,M=1$，marked index 为 $2$，即 $|10\rangle$。四个振幅按索引 $0,1,2,3$ 排列；$p_k$ 是 marked 子空间的总概率，不是单个 marked 振幅本身的平方。

| 状态 | signed amplitudes $(a_0,a_1,a_2,a_3)$ | 均值 $\bar a$ | 范数 $\|a\|_2$ | marked 成功率 | Oracle query |
|---|---|---:|---:|---:|---:|
| 初始化 $k=0$ | $(1/2,1/2,1/2,1/2)$ | $1/2$ | $1$ | $1/4$ | $0$ |
| Oracle 半步 | $(1/2,1/2,-1/2,1/2)$ | $1/4$ | $1$ | $1/4$ | $1$ |
| Diffusion 后、完整 $k=1$ | $(0,0,1,0)$ | $1/4$ | $1$ | $1$ | $1$ |

对任意一组柱，扩散都逐项使用 $a_i'=2\bar a-a_i$；它保持范数，但不保证成功率单调。固定 marked 集与默认预设的理论账如下：

| 预设 | marked indices | $\theta=\arcsin\sqrt{M/N}$ | 首峰附近精确整数步 | $\frac\pi4\sqrt{N/M}$ 近似 |
|---|---|---:|---:|---:|
| $N=4,M=1$ | $\{2\}$ | $\arcsin(1/2)$ | $k=1$ | $1.571$ |
| $N=8,M=1$ | $\{5\}$ | $\arcsin(1/\sqrt8)$ | $k=2$ | $2.221$ |
| $N=16,M=1$ | $\{11\}$ | $\arcsin(1/4)$ | $k=3$ | $3.142$ |
| $N=16,M=3$ | $\{1,6,14\}$ | $\arcsin(\sqrt3/4)$ | $k=1$ | $1.814$ |
| 过转 $N=8,M=1$ | $\{5\}$ | 同上 | 先到 $k=2$，再回落 | 同上 |

严格的**首峰**停步不是对所有 $k\ge0$ 做全局 $\arg\max$：正弦平方随后会周期性重复，某些 $\theta$ 的全局最大值甚至不会在整数 $k$ 上取到。先定义连续首峰位置

$$
\kappa=\frac\pi{4\theta}-\frac12,
$$

再只比较首峰附近的两个可执行整数

$$
\mathcal K_\kappa=
\left\{\max(0,\lfloor\kappa\rfloor),\max(0,\lceil\kappa\rceil)\right\},
\qquad
k_*\in\arg\max_{k\in\mathcal K_\kappa}p_k.
$$

在 $M/N$ 很小时，$\theta\approx\sqrt{M/N}$，所以

$$
\kappa\approx\frac\pi4\sqrt{\frac NM}-\frac12,
\qquad\text{常把查询数量级写作 }\frac\pi4\sqrt{\frac NM}.
$$

这里的 $\arg\max$ 只在 $\mathcal K_\kappa$ 这个首峰邻域内取；整数取整会留下残余失败概率，而且继续多跑会过转。

</div>

<h3>5. 误区与边界：平方、查询和停步不是一回事</h3>

- **不是指数加速的口号。** Grover 把无结构搜索的 query 数从 $O(N/M)$ 降到 $O(\sqrt{N/M})$，是关于候选数 $N$ 的二次加速；若用地址位数 $n=\log_2N$ 重写，$N=2^n$ 与 $\sqrt N=2^{n/2}$ 都呈指数形式，但这不改变“平方加速”的标准分类。
- **Oracle 不是免费电路。** query complexity 把一次可逆的“判断是否 marked”视为一个单位；总门数、Oracle 的数据访问成本、制备与测量成本另算。若经典算法能排序、哈希或利用结构，问题已经不是无结构搜索，Grover 的比较对象也要改。
- **$M$ 的知识改变停步问题。** 已知或可估 $M$ 时可选首峰附近的整数；未知 $M$ 时不能盲目重复同一个步数，需用不同轮数的调度、估计或验证策略。测量拿到一个候选后还要经典验证 Oracle，尤其在有多个 marked 时不能把“成功率”误读为“唯一答案”。

<h3>6. 回到定理，迁移到新问题</h3>

把实验台的柱状模型写成两行线性代数：验证 Oracle 是在 good/bad 子空间上的符号反射，Diffusion 是关于 $|s\rangle$ 的反射；再用 $N=2^{20}=1,048,576$、$M=1$ 估算 $\frac\pi4\sqrt N\approx804$ 次 Oracle query，而经典**随机排列**查找单个 marked 项的期望是精确的 $(N+1)/2=524,288.5$ 次，常简写为约 $N/2$。最后问：如果 Oracle 每次要跑一个昂贵的数据库查询，或者 $M$ 随时间改变，这个二次优势的“端到端”声明还缺什么账？

</section>

## 1. 干涉计算的最小样本：Deutsch–Jozsa

**问题**：黑盒 $f:\{0,1\}^n\to\{0,1\}$ 保证恒常（全 0 或全 1）或平衡（恰有一半输入映到 0、一半映到 1），判定是哪种。这里必须写清成功标准：量子算法与下面的经典复杂度都取 **exact**，即不允许错误。

**查询分离（exact quantum vs deterministic exact）**：确定性经典算法的最坏查询复杂度是 $2^{n-1}+1$：前 $2^{n-1}$ 个答案仍可能全来自某个平衡函数，必须再问一个才排除平衡。Deutsch–Jozsa 的量子线路只需 **1 次 exact quantum query**。这是一条 exact query separation，但不能写成“所有经典算法都要指数查询”：若允许有界错误的随机抽样，随机取 $t$ 个输入，看到不全相同就判平衡、全相同就判恒常；对平衡函数用有放回抽样时误判概率至多 $2^{1-t}$，所以取 $t=O(\log(1/\delta))$ 即可把错误压到 $\delta$，固定错误率时甚至是 $O(1)$。代价正是它不再 exact。

**【推导（电路三步）】** 先把辅助位制备为 $|-\rangle=(|0\rangle-|1\rangle)/\sqrt2$，数据寄存器经 $H^{\otimes n}$ 变成均匀叠加；相位 Oracle 通过相位回踢实现

$$
|x\rangle|-\rangle\xrightarrow{U_f}(-1)^{f(x)}|x\rangle|-\rangle.
$$

再对数据寄存器施 $H^{\otimes n}$，全零态的振幅为

$$
\frac1{2^n}\sum_x(-1)^{f(x)}
=\begin{cases}
\pm1,&f\text{ 恒常},\\
0,&f\text{ 平衡}.
\end{cases}
$$

因此 exact 测量在全零与非全零之间分开。一次 query 把函数的全局性质压进一个可测振幅，但没有把每个 $f(x)$ 单独读出来；“查询模型”和“输出目标”是加速声明的一部分。

## 2. Grover 搜索：无结构问题的平方加速

**问题**：$N$ 个候选中有 $M$ 个满足 Oracle；先取 $M$ 已知且 $1\le M<N$。经典随机查找的期望 query 数是 $\Theta(N/M)$，量子 Grover 在合适整数停步下使用 $\Theta(\sqrt{N/M})$ 次 Oracle query；对 $M=1$ 即 $O(N)$ 对 $O(\sqrt N)$。BBBV 混淆下界给出无结构搜索的量子 query 下界 $\Omega(\sqrt{N/M})$，所以这个量级不能靠换一套干涉图再消掉。

**正交二维推导**：令

$$
|G\rangle=\frac1{\sqrt M}\sum_{x\in\mathrm{marked}}|x\rangle,
\quad
|B\rangle=\frac1{\sqrt{N-M}}\sum_{x\notin\mathrm{marked}}|x\rangle,
\quad
|s\rangle=\sin\theta|G\rangle+\cos\theta|B\rangle,
\quad \sin^2\theta=M/N.
$$

$|G\rangle,|B\rangle$ 是 orthonormal good/bad uniform states。Oracle $O$ 反射 good 方向，扩散 $D=2|s\rangle\langle s|-I$ 反射均匀态；在这组正交基下，$DO$ 是角度 $2\theta$ 的旋转。于是

$$
|\psi_k\rangle=\sin((2k+1)\theta)|G\rangle+\cos((2k+1)\theta)|B\rangle,
\qquad p_k=\sin^2((2k+1)\theta).
$$

整数停步只取连续首峰

$$
\kappa=\frac\pi{4\theta}-\frac12
$$

附近的 $\max(0,\lfloor\kappa\rfloor)$ 与 $\max(0,\lceil\kappa\rceil)$，择其 $p_k$ 较大者；在 $M/N$ 小时 $\kappa\approx\frac\pi4\sqrt{N/M}-\frac12$，常写查询数量级 $\frac\pi4\sqrt{N/M}$。过转是同一旋转继续前进的必然结果：$p_k$ 振荡而非单调。

**复杂度边界**：Grover 的加速是二次而非 Shor 式的周期结构优势。它还要求无结构搜索和可反复调用的相干 Oracle；把 Oracle 造出来的时间、可逆工作空间、错误校正、候选验证和测量重复计入后，才是端到端成本。若 $M$ 未知，首峰位置未知，需估计或使用多轮数策略；如果问题有排序、索引、哈希等经典结构，也不能继续拿 $O(N)$ 的盲搜当唯一基线。

## 3. Shor 分解：周期结构与量子多项式

**归约链（经典部分）**：给定与 $N$ 互素的 $a$，寻找 $a^x\bmod N$ 的周期 $r$。若 $r$ 为偶数且 $a^{r/2}\not\equiv-1\pmod N$，则

$$
\gcd(a^{r/2}-1,N),\qquad \gcd(a^{r/2}+1,N)
$$

以非平凡概率给出因子；失败时换 $a$ 或重复。**周期求解（量子部分）**的骨架是：

1. 在第一寄存器叠加上可逆模幂，得到 $\sum_x|x\rangle|a^x\bmod N\rangle$；
2. 测第二寄存器后，第一寄存器保留间隔约为 $r$ 的周期梳；
3. QFT 把周期梳变成频率峰，测得接近 $kQ/r$ 的有理近似；
4. 经典连分数、候选验证与欧几里得算法恢复 $r$ 和因子。

若第一寄存器有 $n$ 个 qubit，在把受控相位视作基本门的标准**精确** QFT 分解中，包含 $n$ 个 Hadamard、$n(n-1)/2$ 个受控相位门和 $\lfloor n/2\rfloor$ 个末端 SWAP；高层门总数为

$$
n+\frac{n(n-1)}2+\left\lfloor\frac n2\right\rfloor=O(n^2).
$$

若把每个 SWAP 再分成 3 个 CNOT，原语门数相应改变。这是门数陈述，不是笼统的“电路 depth $O(n^2)$”；并行化、连线几何和是否允许近似旋转会改变深度与工程代价。

**复杂度应如何比较**：令输入数值 $N$ 的位长为 $n=\log N$。在理想可逆算术和门成本模型下，Shor 的模幂、QFT 和经典后处理整体是 $n$ 的多项式时间；常见粗略记号会写成某个 $O((\log N)^c)$，$c$ 取决于乘法、可逆算术和门模型。最好的已知经典分解算法（数域筛）是亚指数的 $L_N[1/3,c]$ 型，而不是已证明的指数下界。因此应说“量子多项式 vs 最佳已知经典亚指数”，不能把它写成已证明的指数级复杂度分离，也不能把 toy 电路的门数当作容错资源估计：逻辑 qubit、纠错码距、蒸馏、并行度、模乘实现与物理连通性都会改变资源账。

**读法与密码学边界**：加速仍来自全局干涉，但它瞄准的是模幂周期结构；RSA/Rabin 一类基于因子分解或离散对数的构造受直接威胁，AES 与哈希在黑盒模型下主要面对 Grover 级别的二次搜索威胁。后量子迁移要按具体参数、协议寿命和“先收集后解密”风险规划，而不是把“量子更快”当作所有密码都同样失效。

## 4. 练习与迁移

**例 1（exact 与 bounded-error 分账）**：取 $n=3$，确定性 exact 经典最坏要问 $2^2+1=5$ 次；若只容许 $\delta=1/16$ 的随机错误，用上面的有放回抽样界取 $t\ge5$，并解释为什么它仍可能在平衡函数上误判恒常。

**例 2（Grover 步数）**：取 $N=2^{20}=1,048,576,M=1$。首峰附近约需 $\frac\pi4\sqrt N\approx804$ 次 Oracle query，经典随机排列查找的精确期望是 $(N+1)/2=524,288.5$ 次；若实际候选数不是 $2^n$，可以嵌入到 $2^{\lceil\log_2N\rceil}$ 个地址，但必须让 padding 地址的 Oracle 语义与成功率一起计入，而不是静默改变问题。

**例 3（Shor 纸上 toy）**：$N=15,a=7$ 时 $7^x\bmod15=7,4,13,1,\ldots$，周期 $r=4$；$\gcd(7^2-1,15)=3$、$\gcd(7^2+1,15)=5$。这是一个常见的教学 toy，用来核对“周期 → 连分数候选 → gcd”链条；它不代表真实容错设备的资源规模，也不需要附带未经限定的历史优先断言。

**迁移问题**：如果 Oracle 的一次调用本身包含一个深的可逆算术电路，Grover 的 query 级平方加速如何转换成门级或墙钟时间？如果 $M$ 只知道范围而不知道精确值，哪一种停步/验证策略会避免系统性过转？如果 QFT 的受控旋转只能近似实现，哪些相位误差会进入周期峰的分辨率？把这三问分别写成“模型假设—可测指标—失败边界”的小表。

---

*下一页：让量子计算在嘈杂世界活下来——退相干、量子纠错与阈值定理，以及 NISQ 时代的现实地图。*
