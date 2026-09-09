# 常微分 II · 高阶线性方程

> **前置**：[一阶ODE与存在唯一性](ode-01-first-order.html)、[线性空间与基](algebra-04-linear-space.html)。本页将初值、解空间与特征根连起来，再用线性振子区分自由衰减、拍频和受迫稳态峰。齐次解形成线性空间，非齐次解形成平移后的仿射集。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="linear-ode-resonance-learning-title">

## 学习层：频率“撞根”时，振幅为什么长出一个 \(t\)？

### 1. 具体情境：同一只无阻尼振子接受不同频率的推力

取固有角频率 $\omega_0>0$、单位质量驱动力幅度 $F$。对零初值问题

$$
y''+\omega_0^2y=F\cos(\omega t),\qquad y(0)=y'(0)=0,
$$

当 \(\omega\neq\omega_0\) 时

$$
y(t)=\frac{F}{\omega_0^2-\omega^2}
\left(\cos\omega t-\cos\omega_0t\right).
$$

两个相近频率会形成拍频；当 \(\omega\to\omega_0\) 时，分母和括号同时趋零，极限不是无穷常数，而是

$$
y(t)=\frac{F}{2\omega_0}\,t\sin(\omega_0t).
$$

这个 \(t\) 正是待定系数法里“试探频率撞上特征根就乘 \(t\)”的解析来源。

### 2. 先预测：根、基与受迫响应

1. 特征根为 \(-1\pm2i\) 时，实基本解组应包含指数包络、三角振荡，还是两者兼有？
2. 驱动 频率逐渐靠近 \(\omega_0\) 时，有限观察窗里先看到无限振幅，还是越来越慢的拍频包络？
3. 无阻尼共振的线性增长能否直接外推到有阻尼、非线性或会损坏的真实结构？

### 3. 最小实验：把代数重根与时间轨迹对齐

<div class="learning-lab" data-learning-lab="linear-ode-resonance" markdown="1">

**无 JavaScript 时的静态读法：**

| 驱动比 \(\omega/\omega_0\) | 解析结构 | 有界性 | 证据边界 |
|---:|---|---|---|
| \(0.7\) | 两个不同频率之差 | 理想模型内有界 | 包络由频差决定 |
| \(0.98\) | 慢拍频 | 仍有界，但有限窗可很大 | 不能把近共振误称精确共振 |
| \(1\) | \(t\sin(\omega_0t)\) | 无阻尼线性模型内无界增长 | 任意正阻尼会改变长期响应 |



</div>

实验揭示后可移动驱动比与观察终点。上图显示无阻尼受迫位移与真实解析包络；下图显示独立的阻尼自由响应。账本分别标明两方程的根/基、采样峰值和驱动分类。有限采样只画当前解析解，不能替代一般线性 ODE 的存在唯一性与基本解理论。

### 4. 两条不能混用的 Wronskian 结论

对同一个 \(n\) 阶齐次线性方程、且系数在区间上连续的一组解，Wronskian 在某点非零等价于它们线性无关；Abel–Liouville 公式还说明它要么处处非零，要么处处为零。对任意可微函数，某一点 \(W=0\) 并不能推出线性相关。实验只对解析基本解组出证书。

</section>

## 1. 为什么恰好需要 n 个初值？

先在区间 $I$ 上讨论

$$
y^{(n)}+a_1(x)y^{(n-1)}+\cdots+a_n(x)y=f(x),
$$

其中各系数和 $f$ 连续；原方程的最高阶系数若不是 $1$，须先保证它在 $I$ 不为零，再除过去。把 $Y=(y,y',\ldots,y^{(n-1)})^T$ 组成状态，便得到一个连续系数的一阶线性系统。存在唯一性定理保证：固定 $x_0\in I$ 后，每个初值向量唯一对应整个 $I$ 上的一个解。

对齐次方程，取初值映射 $E:y\mapsto Y(x_0)$。叠加原理说明 $E$ 线性，唯一性给单射，存在性给满射。因此齐次解空间与 $\mathbb R^n$ 同构，维数恰为 $n$。非齐次解集通常不经过零；若已有特解 $y_p$，任何其他解与它的差都齐次，故它是仿射集 $y_p+\ker L$。[Lebl，§2.3](https://www.jirka.org/diffyqs/html/sec_hol.html)

### Wronskian 的证书为什么有效？

将 $n$ 个解的初值列组成矩阵 $\Phi(x)=[y_j^{(i-1)}(x)]$。若 $W(x_0)=\det\Phi(x_0)\ne0$，任意初值都能由这些列唯一线性组合，故它们是一组基。若行列式为零，有非零常数向量 $c$ 使 $\Phi(x_0)c=0$；组合解有全零初值，由唯一性只能恒零，于是相关。

二阶方程 $y''+p(x)y'+q(x)y=0$ 尤其直观：

$$
W=y_1y_2'-y_1'y_2,\qquad
W'=y_1y_2''-y_1''y_2=-pW,
$$

所以 $W(x)=W(x_0)\exp[-\int_{x_0}^x p(s)ds]$。一般 $n$ 阶用行列式逐行求导：前 $n-1$ 项出现重复行而为零，末行代入方程后只剩 $-a_1W$，得到同一 Abel–Liouville 公式。指数不会在有限 $x$ 变成零；数值下溢为零则不是相关证据。

**必须是同一正规方程的解。** 任意函数 $1,x^2$ 在含零区间上无关，却有 $W(0)=0$。更强的例子 $x^2,x|x|$ 在 $\mathbb R$ 上都是 $C^1$，Wronskian 处处零，仍全局无关：正半轴要求两系数相加为零，负半轴要求相减为零，只有全零组合。它们不满足上述同一连续系数正规方程的解假设。

## 2. 特征根的重数如何变成一组基？

常系数算子记作 $P(D)$，$D=d/dx$。指数满足 $P(D)e^{\lambda x}=P(\lambda)e^{\lambda x}$，所以先解特征多项式 $P(\lambda)=0$。对实系数方程，复根成共轭对：

| 根及重数 | 对应实基函数 |
|---|---|
| 实根 $\lambda$，重数 $k$ | $x^je^{\lambda x}$，$j=0,\ldots,k-1$ |
| 非实共轭根 $\alpha\pm i\beta$，每个重数 $k$，$\beta>0$ | $x^je^{\alpha x}\cos\beta x$ 与 $x^je^{\alpha x}\sin\beta x$，$j=0,\ldots,k-1$ |

不是凭形状猜：移位恒等式

$$
P(D)\bigl(e^{\lambda x}v\bigr)=e^{\lambda x}P(D+\lambda)v
$$

把一个 $k$ 重根移到零，因子 $(D-\lambda)^k$ 作用后变成 $D^kv$；次数小于 $k$ 的多项式被消掉，产生这些解。将所有根计入重数，恰好得到 $n$ 个独立解。也可从相邻根合并看出 $[e^{(\lambda+\varepsilon)x}-e^{\lambda x}]/\varepsilon\to xe^{\lambda x}$。

例如 $y'''-y''+y'-y=0$，有 $P(\lambda)=(\lambda-1)(\lambda^2+1)$，故通解为 $C_1e^x+C_2\cos x+C_3\sin x$。若改成 $P(\lambda)=(\lambda^2+1)^2$，就要补上 $x\cos x,x\sin x$，不能只写两个三角函数。

## 3. 特解：先看算子，再选方法

### 待定系数中的“乘 x”有明确的重数

对于常系数方程，外力为多项式乘指数、正弦或余弦时，可以在有限维函数族中求系数。复写右端 $e^{\lambda x}R_m(x)$，若 $\lambda$ 是 $P$ 的 $k$ 重根（不是根则 $k=0$），可取

$$
y_p=e^{\lambda x}x^k Q_m(x).
$$

理由是移位后的算子含 $D^k$，它正好把 $x^kQ_m$ 的次数降回 $m$；剩余因子的常数项非零，逐级匹配能解出系数。三角项是复指数的实部/虚部，通常应同时试正弦和余弦，不能仅照抄右端一种。

例如 $y''+4y=\cos2x$，根 $2i$ 重数一，代入 $x(A\cos2x+B\sin2x)$ 得 $-4A\sin2x+4B\cos2x$，因此 $y_p=x\sin2x/4$。这是一个特解，指定初值还需添加齐次部分。

### 常数变易为何需要两条方程？

对已标准化的 $y''+py'+qy=f$，已知基本解 $y_1,y_2$ 后设 $y_p=C_1y_1+C_2y_2$。两个未知函数有表示冗余，可取辅助条件 $C_1'y_1+C_2'y_2=0$。代回原方程只剩

$$
\begin{pmatrix}y_1&y_2\\y_1'&y_2'\end{pmatrix}
\binom{C_1'}{C_2'}=\binom0f,
\qquad C_1'=-\frac{y_2f}{W},\quad C_2'=\frac{y_1f}{W}.
$$

在连续系数、$W\ne0$ 的区间上积分即可；不一定能写成初等函数。若最高阶系数为 $a(x)$，此处应使用标准化后的 $f/a$。[Lebl，§2.5](https://www.jirka.org/diffyqs/html/sec_nonhom.html)

以 $y''+y=\tan x$ 为例，只在不跨越 $\pi/2+k\pi$ 的区间求解。$W(\cos x,\sin x)=1$，$C_1'=-\sin x\tan x=\cos x-\sec x$，$C_2'=\sin x$，可取 $C_1=\sin x-\ln|\sec x+\tan x|$、$C_2=-\cos x$。交叉项相消，留下 $y_p=-\cos x\ln|\sec x+\tan x|$；直接求两次导数也能验回 $\tan x$。

### Euler 方程须把零点隔开

对 $x^2y''+axy'+by=0$，在任一不含零的半轴用 $t=\ln|x|$、$Y(t)=y(x)$：$xy'=Y_t$，$x^2y''=Y_{tt}-Y_t$，变为 $Y_{tt}+(a-1)Y_t+bY=0$。正负半轴分别给出解，不能把奇异点 $x=0$ 当成普通初值点。

## 4. 振动：根分类、拍频和稳态峰是三件事

取 $m,k>0$、$c\ge0$，定义 $\omega_0=\sqrt{k/m}$、$\zeta=c/(2\sqrt{mk})$。方程是

$$
y''+2\zeta\omega_0y'+\omega_0^2y=\frac{F_0}{m}\cos\omega t.
$$

### 无外力：比较时先固定初值和固有频率

特征根为 $-\zeta\omega_0\pm\omega_0\sqrt{\zeta^2-1}$。$0<\zeta<1$ 有衰减振荡，振荡角频率 $\omega_d=\omega_0\sqrt{1-\zeta^2}$；$\zeta=1$ 是负重根；$\zeta>1$ 有两个负实根；$\zeta=0$ 则不衰减。

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="可横向滚动的统一初值阻尼比较" style="overflow-x:auto">
<img src="assets/img/ode-02-damping.svg" alt="相同固有频率和相同初值下，三个阻尼比的自由响应与清楚刻度" style="width:100%;min-width:760px;max-width:none">
</div>
<figcaption><span class="fig-id">图 ode-02.1</span>左图统一 ω₀=1、q(0)=1、q′(0)=0，只改变 ζ=0.3、1、1.4；右图为同一组阻尼比的受迫稳态幅值。两种方程分别计算，不能把自由曲线的振荡频率当作右图峰的位置。</figcaption>
</figure>

对该初值，临界解为 $(1+\omega_0t)e^{-\omega_0t}$，始终正且单调趋零；过阻尼的慢根 $-\omega_0/(\zeta+\sqrt{\zeta^2-1})$ 更接近零，长期回归更慢。这解释“临界较快”的常用图景，但**最快**还取决于比较的初值、容许过冲与进入误差带的标准；例如特定初值可消掉过阻尼慢模态，不能只凭根类型断言所有解的排序。能量 $E=(m y'^2+k y^2)/2$ 满足 $E'=-cy'^2\le0$，说明自由阻尼过程耗能，不是受迫共振。

### 无阻尼受迫：拍频包络与极限

记单位质量驱动力 $F=F_0/m$，零初值解可写成无相消形式

$$
y(t)=\frac{Ft}{\omega+\omega_0}\sin\frac{(\omega+\omega_0)t}{2}\,
\operatorname{sinc}\frac{(\omega-\omega_0)t}{2},\qquad
\operatorname{sinc}s=\begin{cases}\sin s/s&s\ne0,\\1&s=0.\end{cases}
$$

因此图中真正的对称包络为 $\pm A(t)$，其中 $A(t)=|Ft\operatorname{sinc}((\omega-\omega_0)t/2)/(\omega+\omega_0)|$。当频率很近时包络慢变；并非任意离共振情形都呈现清楚的快慢分离。对任意固定观察窗，$\omega\to\omega_0$ 连续地趋于 $Ft\sin(\omega_0t)/(2\omega_0)$；若先取长期极限，非共振响应有界而精确共振无界，这两种取极限顺序不能混用。

实验的“近共振”仅约定为 $0<|\omega/\omega_0-1|\le0.08$ 的教学窗口，不是物理相变；精确共振严格要求相等。上图始终取 $\omega_0=F=1$，下图独立取无外力自由方程且 $q(0)=1,q'(0)=0$。改变下图的 $\zeta$ 不会改变上图的无阻尼条件；账本的 $W(\cos t,\sin t)=1$ 也只属于上图齐次方程。采样峰值只是有限网格的观测值，不能宣称精确连续最大值。

### 有正阻尼受迫：峰的位置会移动，甚至消失

用复振幅 $\widehat y=(F_0/m)/(\omega_0^2-\omega^2+2i\zeta\omega_0\omega)$，稳态位移幅值为

$$
B(\omega)=\frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2+4\zeta^2\omega_0^2\omega^2}}.
$$

这里 $F_0>0$ 且 $\zeta>0$。正阻尼使齐次暂态衰减，从而该周期解描述长期响应；无阻尼时齐次部分不会自动消失，不能把任意特解叫成吸引稳态。

对分母平方求导，除 $\omega=0$ 外的驻点满足 $\omega^2=\omega_0^2(1-2\zeta^2)$。所以只有 $0<\zeta<1/\sqrt2$ 才有正频率位移峰；更大阻尼时最大值位于零频率。这个峰频不同于自由衰减频率 $\omega_d$，也一般不等于 $\omega_0$。在 $\omega=\omega_0$，幅值仍有限，为 $F_0/(c\omega_0)$。[Lebl，§2.6](https://www.jirka.org/diffyqs/html/forcedo_section.html)

真实结构还可能发生非线性、参数变化、流固耦合失稳或破坏；无阻尼线性方程的无界解只标明模型内的能量累积，不能直接替代事故机制分析。

## 5. 迁移：把条件写进答案

1. 解 $(D-1)^2y=e^x$，并解释为何乘 $x^2$。比较 $W(e^x,xe^x)$ 与任意函数 $1,x^2$ 的 Wronskian，指出同一方程假设的作用。
2. 在任一不含零的区间求 $x^2y''-xy'+y=0$。零点处能否直接指定普通二阶初值？
3. 固定 $\omega_0=1$，比较 $\zeta=0.3$ 的自由振荡频率与受迫位移峰频率，再判断 $\zeta=0.8$ 是否有正频率位移峰。最后解释 $r=1+10^{-12}$ 为什么仍不是精确共振。

<details class="answer" markdown="1">
<summary>展开核对重根、奇异点与两种频率</summary>

**1.** 令 $y=e^xv$，有 $(D-1)^2y=e^xv''$，所以 $v''=1$，通解 $y=e^x(C_1+C_2x+x^2/2)$。根 $1$ 重数二，特解确需 $x^2$。基本解组的 $W=e^{2x}$，与标准化方程中 $p=-2$ 的 Abel 公式一致；$W(1,x^2)=2x$ 在零点消失，这两个函数不可能同为含零区间上某个连续系数正规二阶齐次方程的独立解。

**2.** 令 $t=\ln|x|$，得到 $Y''-2Y'+Y=0$，故 $y=|x|(C_1+C_2\ln|x|)$。在固定半轴上也可把 $|x|$ 换成 $x$ 并重新命名常数。$x=0$ 处最高阶系数为零，标准定理不能跨越它；若要拼接还须另行检查正则性与原方程。

**3.** $\omega_d=\sqrt{0.91}\approx0.95394$，位移峰频 $\omega_r=\sqrt{0.82}\approx0.90554$。$0.8>1/\sqrt2$，故没有正频率位移峰，尽管自由响应仍属于欠阻尼。$r=1+10^{-12}$ 的差非零，长期仍是有界非共振响应；有限窗或浮点显示与共振近似一致不改变这个分类。

</details>

---

*下一页：[一阶线性系统、相图与稳定性](ode-03-systems-stability.html)。*
