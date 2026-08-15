# 统计物理 II · 系综与配分函数

> **对标**：Schroeder §6 / Pathria 入门章 ｜ **前置**：sm-01、概率线、mech-03（Liouville）、信息论 III（最大熵）
> 统计力学把宏观热力学写成微观状态的概率账本。本页先把“等概率”“熵”“系综”的适用条件钉牢，再用一个可精确计算的退化二能级模型，把配分函数、热容和宏观涨落放在同一张图上。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="canonical-learning-title">

## 学习层：温度升高时，为什么不一定“各占一半”？

<h3 id="canonical-learning-title">1. 先预测：退化、热容峰和集中分别由谁控制？</h3>

把一个单元的基态能量取为 $0$，激发态能量取为 $\varepsilon>0$；基态有 $g_0$ 个微观态，激发态有 $g_1$ 个微观态。请先回答三个问题，再打开实验：

1. 若 $g_0=1,g_1=3$ 且 $x\equiv\beta\varepsilon\to0$，激发占据 $p$ 会趋向 $1/2$、$3/4$，还是 $0$？
2. 对固定的正能隙，$C_V/(Nk_B)$ 在 $x\to0$ 与 $x\to\infty$ 的两端分别怎样？中间是否有峰？
3. 当 $g_0=g_1$ 时，Schottky 峰的位置是 $x\approx2.399$，还是等占据点 $x=0$？

这里的“退化”不是装饰参数：高温极限会数微观态，热容峰则来自占据随温度变化最快的区域。

### 2. 最小模型：一个单元的全部热力学

单元配分函数与激发占据是

$$
Z_1=g_0+g_1e^{-x},\qquad
p\equiv p_{\rm exc}=\frac{g_1e^{-x}}{Z_1}.
$$

对 $N$ 个**相互独立**的单元，$Z_N=Z_1^N$，而总激发单元数 $K$ 的精确分布是

$$
P(K=k)=\binom Nk p^k(1-p)^{N-k},\qquad K\sim\operatorname{Binomial}(N,p).
$$

因此

$$
\frac{U}{N\varepsilon}=p,\qquad
\frac{S}{Nk_B}=\ln Z_1+xp,\qquad
\frac{C_V}{Nk_B}=x^2p(1-p).
$$

实验台用对数和与对数概率计算这些量，避免在低温端直接计算 $e^{-x}$ 或极小的二项概率。揭晓后调节 $x,N,g_0,g_1$；横轴固定为 $K/N\in[0,1]$，所以改变 $N$ 时仍是在同一坐标上比较精确分布。

<div class="learning-lab" data-learning-lab="canonical-ensemble" markdown="1">

**无 JavaScript 时的静态读法：**

先用 $g_0=1,g_1=3$ 看高温端：$x\to0$ 时 $p\to3/(1+3)=3/4$，不是固定的 $1/2$。一般高温极限为 $p\to g_1/(g_0+g_1)$。

对等退化 $g_0=g_1=1$，

$$
\frac{C_V}{Nk_B}=\frac{x^2}{4\cosh^2(x/2)},\qquad
x\tanh(x/2)=2
$$

给出 Schottky 峰 $x_\star\approx2.399357$；等占据点是 $x=0$，此处反而 $C_V=0$。两端也都趋于零：$x\to0$ 时有能级但占据几乎不随温度变，$x\to\infty$ 时激发被冻结。

| 静态检查 | $p$ | $U/(N\varepsilon)$ | $S/(Nk_B)$ | $C_V/(Nk_B)$ |
|---|---:|---:|---:|---:|
| $x=0,g_0=1,g_1=3$ | $3/4$ | $3/4$ | $\ln4$ | $0$ |
| $x=2.399357,g_0=g_1=1$ | $\approx0.0832$ | $\approx0.0832$ | $\approx0.2866$ | $\approx0.4392$ |

任意固定 $x,g_0,g_1$ 下，$\mathbb E[K]=Np$、$\operatorname{Var}(K)=Np(1-p)$，所以

$$
\frac{\sigma_K}{\mathbb E[K]}=\sqrt{\frac{1-p}{Np}},\qquad
\sigma_{K/N}=\sqrt{\frac{p(1-p)}N}\propto\frac1{\sqrt N}.
$$

这说明 $N$ 改变总量和集中程度，却不改变单元占据 $p$，也不改变每单元的 $S/(Nk_B)$ 与 $C_V/(Nk_B)$。

</div>

### 3. 动手：先过预测门，再读两本账

实验的“预测门”逐项检查上面的三个判断。揭晓前只显示预测选项；揭晓后才开放预设、参数与结果：

- 单元账本：$\ln Z_1,p,U/(N\varepsilon),S/(Nk_B),C_V/(Nk_B)$，以及当前退化下的热容峰；
- 涨落账本：$\mathbb E[K]$、$\operatorname{Var}(K)$、$\sigma_K/\mathbb E[K]$、$\sigma_{K/N}$ 与 $1/\sqrt N$ 集中尺度；
- 固定 $K/N$ 坐标的全 $k=0,\ldots,N$ 精确二项分布，并标出均值与一倍标准差区间。

可用预设先切换“等退化”“激发三重简并”“大 $N$ 集中”和“低温冻结”，再在揭晓后拖动 $x,N,g_0,g_1$。重置会回到当前预设的初始状态。

### 4. 误区与边界：配分函数不是一张无条件的万能卡

- **Liouville 定理不是等概率原理的证明。**Hamilton 动力学保持细粒度相空间体积，说明演化可逆且体积不变；它单独不推出等先验概率，也不推出遍历性。等概率原理是对平衡态的建模假设，或需要由遍历/典型性、混合和初始条件等额外物理理由支持。
- **三种熵要标出对应条件。**Boltzmann 宏观态熵 $S_B=k\ln\Omega$ 数的是给定宏观约束下的微观态数；Gibbs/Shannon 系综熵 $S_G=-k\sum_i p_i\ln p_i$ 使用的是整个系综分布。若微正则系综在同一能量壳的 $\Omega$ 个态上均匀，才有 $S_G=k\ln\Omega$；热力学熵还要经过平衡识别、宏观变量和热力学极限等条件，不能无条件说三者“是同一个函数”。
- **第二定律需要桥梁。**细粒度 Gibbs 熵在可逆 Hamilton 演化下保持不变；宏观熵增要引入粗粒化、典型性/混合、宏观观测分辨率以及合适的低熵初始条件等额外结构。
- **$Z$ 的导数是累积量生成器，但 $Z$ 不是任意基准下已经归一化的 MGF。**在固定 $\beta$ 的正则分布下，$Z(\beta-t)/Z(\beta)=\langle e^{tE}\rangle_\beta$ 才是能量的 MGF；而 $-\partial_\beta\ln Z=\langle E\rangle$、$\partial_\beta^2\ln Z=\operatorname{Var}(E)$ 是配分函数导数关系。
- **涨落公式有前提。**在固定 $V$（以及其他外参）、Hamiltonian 不显含 $T$ 时，$C_V=(\partial U/\partial T)_V=\operatorname{Var}(E)/(k_BT^2)$。若 Hamiltonian 本身随温度改变，求导会多出显式依赖项。

### 5. 迁移问题

1. 令 $g_0=2,g_1=6$，不用实验写出 $x\to0$ 的 $p$、$U/(N\varepsilon)$ 和每单元熵；再解释为什么“高温”不等于“两个能级各半”。
2. 对等退化模型由 $C_V/(Nk_B)=x^2/[4\cosh^2(x/2)]$ 推出峰值方程 $x\tanh(x/2)=2$，并说明 $x=0$ 为什么不是峰。
3. 固定 $p$，把 $N$ 从 $25$ 改到 $100$：均值、方差、$\sigma_{K/N}$ 和相对涨落分别怎样缩放？哪些单元量完全不变？

</section>

## 1. 微正则系综：等概率从哪里来？

孤立系统的总能量、体积和粒子数固定。微正则描述的不是一条确定轨道，而是满足这些宏观约束的微观态集合；在最简单的离散记号中，集合大小为 $\Omega(E,V,N)$。

**Boltzmann 宏观态熵**定义为

$$
S_B(E,V,N)=k_B\ln\Omega(E,V,N).
$$

这里的 $\Omega$ 必须说明能量壳宽、宏观粗粒度和计数测度。若把同一能量壳中的态赋予均匀概率，则 Gibbs/Shannon 熵

$$
S_G=-k_B\sum_i p_i\ln p_i
$$

恰为 $k_B\ln\Omega$；但对非均匀系综或不同粗粒度，二者并不自动相等。

Liouville 定理说 Hamilton 流保持相空间体积：$\mathrm d\Gamma(t)=\mathrm d\Gamma(0)$。它保证细粒度分布的可逆输运，却不独自提供等概率原理或遍历性。平衡统计力学把等概率作为基本假设，或者在具体动力学中用遍历性、混合和典型性等论证它的适用范围。

热力学第二定律也不能只从“体积守恒”一行推出。微观方程可逆而宏观熵仍表现为增长，需要说明宏观观测的粗粒化、典型微观态以及初始低熵条件；这正是统计解释的工作。

## 2. 正则系综：热库如何产生 Boltzmann 权重

系统与大热库接触，总能量 $E_{\rm tot}$ 固定。对系统态 $s$，热库态数满足

$$
\ln\Omega_{\rm bath}(E_{\rm tot}-E_s)
\approx \ln\Omega_{\rm bath}(E_{\rm tot})-\frac{E_s}{k_BT},
$$

其中热库足够大，使 $T$ 在一次能量交换中近似不变。于是

$$
p_s=\frac{e^{-\beta E_s}}{Z(\beta)},\qquad
Z(\beta)=\sum_s e^{-\beta E_s},\qquad
\beta=\frac1{k_BT}.
$$

同一公式也可由给定平均能量约束下最大化 Shannon 熵得到，但那是推断路径；它与热库推导共享结果，不应混淆为“Liouville 已证明等概率”。

### 配分函数的导数账本

在固定外参且 Hamiltonian 不显含 $T$ 时，

$$
\begin{aligned}
U&=\langle E\rangle=-\frac{\partial\ln Z}{\partial\beta},\\
F&=-k_BT\ln Z,\\
S&=-\left(\frac{\partial F}{\partial T}\right)_{V,N},\\
C_V&=\left(\frac{\partial U}{\partial T}\right)_{V,N}
 =\frac{\operatorname{Var}(E)}{k_BT^2}.
\end{aligned}
$$

更高阶导数交替地产生能量累积量：$(-1)^n\partial_\beta^n\ln Z=\kappa_n(E)$。但 $Z$ 本身还带着态密度、能量零点和参考测度的约定；只有比值 $Z(\beta-t)/Z(\beta)$ 才是当前正则分布下的能量 MGF。把配分函数直接称为“概率论 MGF”会丢掉归一化条件。

### 二能级样板：简并如何进入热力学

一个单元的能级为 $(0,\varepsilon)$，简并度为 $(g_0,g_1)$。写 $x=\beta\varepsilon$，则

$$
Z_1=g_0+g_1e^{-x},\qquad p=\frac{g_1e^{-x}}{Z_1}.
$$

独立的 $N$ 个单元满足 $Z_N=Z_1^N$，所以

$$
\frac{U}{N\varepsilon}=p,\qquad
\frac{S}{Nk_B}=\ln Z_1+xp,\qquad
\frac{C_V}{Nk_B}=x^2p(1-p).
$$

总激发数的宏观态 $K=k$ 包含 $\binom Nk g_0^{N-k}g_1^k$ 个微观态，故其正则概率可写成

$$
P(K=k)=\frac{\binom Nk g_0^{N-k}g_1^k e^{-xk}}{Z_1^N}
 =\binom Nk p^k(1-p)^{N-k}.
$$

这条等式同时展示了“宏观态计数”和“系综概率”怎样对账：组合数与简并度进入 $P(K)$，而不是被一句固定的 $1/2$ 覆盖。高温极限是

$$
p\xrightarrow[x\to0]{}\frac{g_1}{g_0+g_1},
$$

低温极限则是 $p\to0$（当 $\varepsilon>0$ 且简并度有限）。

等退化时 $p=1/(1+e^x)$，Schottky 比热为

$$
\frac{C_V}{Nk_B}=\frac{x^2}{4\cosh^2(x/2)}.
$$

它在 $x\tanh(x/2)=2$ 的 $x\approx2.399357$ 处达到峰值；$x=0$ 是等占据点却是高温端的零热容点。这里“能隙对应温度”指占据对温度的响应最强的中间区域，而非一次跃迁的瞬时概率。

## 3. 三大系综与等价性的边界

| 系综 | 固定量 | 允许涨落 | 典型势函数 |
|---|---|---|---|
| 微正则 | $E,V,N$ | 无能量交换 | $S(E,V,N)$ |
| 正则 | $T,V,N$ | $E$ | $F(T,V,N)$ |
| 巨正则 | $T,V,\mu$ | $E,N$ | $\Phi=-k_BT\ln\Xi$ |

在短程相互作用、可加性成立、远离一阶相变共存区并取热力学极限 $N,V\to\infty$、$N/V$ 固定时，合适的宏观量和局域观测量通常表现出系综等价；正则系综中的相对能量涨落也常按 $N^{-1/2}$ 消失。有限系统仍有涨落，不能把“宏观上近似等价”说成每个 $N$ 都逐态相同。

长程相互作用、非可加系统、非凹微正则熵以及相变/相共存边界会破坏或细化这种等价性。此时不同系综可能选择不同稳定支，负热容等微正则现象也可能在正则系综中被相分离替代；必须回到具体 Hamiltonian 和极限顺序。

## 4. 两个日用连接：速度分布与反应速率

经典粒子的动能进入 Boltzmann 因子，但速度空间的球壳测度还给出

$$
f(v)\propto v^2e^{-mv^2/(2k_BT)}.
$$

所以最概然、平均和方均根速度不是同一个数；“Boltzmann 因子”与态密度要一起看。量子化能级在低温冻结，也正是经典均分定理失效的入口。

化学反应的 Arrhenius 形式应写成带前因子的**速率**

$$
k(T)=A(T)e^{-\Delta E/(k_BT)}.
$$

它不是一次碰撞的瞬时成功概率。若在一段时间内可用常速率 Poisson 近似，至少发生一次反应的概率是 $1-e^{-k(T)t}$；前因子包含尝试频率、动力学与输运因素，不能被指数项抹掉。

## 5. 练习与要点

1. 从热库态数展开推导正则分布，并指出“大热库”和一阶 Taylor 展开的适用条件。
2. 对退化二能级模型直接求 $\partial_\beta\ln Z_1$，验证 $U/(N\varepsilon)=p$；再由 $\partial_\beta^2\ln Z_N$ 得到 $\operatorname{Var}(E)=N\varepsilon^2p(1-p)$。
3. 解释为什么 Liouville 的细粒度熵守恒与宏观第二定律不矛盾；明确列出你使用的粗粒化或典型性假设。
4. 比较 $N=25$ 与 $N=100$ 的二项分布：指出均值和方差的标度，并说明为什么 $K/N$ 越来越集中而单元占据不变。

---

*下一页：当粒子不可分辨且遵守量子规则——Bose–Einstein 与 Fermi–Dirac 统计：白矮星、激光与金属电子的共同语言。*
