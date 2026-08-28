# 非平衡统计 II · Kubo 线性响应与因果输运

> **对标**：Kubo et al.《Statistical Physics II》/ Forster《Hydrodynamic Fluctuations》/ Mahan §3 ｜ **前置**：neq-01、cm-04、qm-04
> 施加一个很小的电场，电流为什么不会在电场到达以前出现？Kubo 公式把这个常识提升为可计算的约束：响应是一个 retarded commutator 的卷积，因果性让频域函数具有解析结构。这里用单弛豫时间 Drude toy 贯通时间响应、复电导和 Kramers–Kronig；它不是所有材料的输运定律，也不是平衡涨落耗散定理本身。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="kubo-response-learning-title">

<h2 id="kubo-response-learning-title">学习层：外场施加之后，响应从哪里开始？</h2>

### 1. 先预测：线性响应的第一道门

考虑一个幅度为 $E_0$ 的电场阶跃 $E(t)=E_0\theta(t)$。在打开实验前判断：

1. $t<0$ 时电流响应能否非零？
2. 弛豫时间 $\tau$ 加倍，固定频率 $\omega$ 下，复电导的相位偏移绝对值会变大还是变小？
3. 当 $\omega\tau=1$ 时，若 $\sigma(\omega)=\sigma_0/(1-i\omega\tau)$，$\operatorname{Re}\sigma$ 与 $\operatorname{Im}\sigma$ 的大小关系是什么？
4. 一个平衡相关函数是否可以不加说明地替代 retarded response？

前两项是因果和动力学问题，第四项是概念边界：相关函数记录系统自己怎样涨落，响应函数记录外场耦合后怎样改变平均值。两者只在特定平衡条件下由 fluctuation-dissipation theorem 联系，并不是定义上相同。

### 2. 最小 retarded kernel：从时间到频率

用一个有单位的电导核表示电流响应：

$$
J(t)=\int_{-\infty}^{\infty}\Phi(t-t')E(t')dt',
\qquad
\Phi(t)=\theta(t)\frac{\sigma_0}{\tau}e^{-t/\tau}.
$$

这里 $\Phi(t<0)=0$ 是因果条件，而不是数值绘图的裁剪。取本页的 Fourier 约定

$$
\sigma(\omega)=\int_0^\infty\Phi(t)e^{i\omega t}dt
=\frac{\sigma_0}{1-i\omega\tau}.
$$

于是

$$
\operatorname{Re}\sigma=\frac{\sigma_0}{1+(\omega\tau)^2},\qquad
\operatorname{Im}\sigma=\frac{\sigma_0\omega\tau}{1+(\omega\tau)^2}.
$$

对阶跃电场，时间积分给

$$
J(t)=\sigma_0E_0(1-e^{-t/\tau})\theta(t).
$$

### 3. 静态 fallback：默认 Drude 账本

默认取 $\sigma_0=1$、$\tau=2\ \mathrm{fs}$、$E_0=1$，并在 $t=2\ \mathrm{fs}$、$\omega=0.5\ \mathrm{fs}^{-1}$ 读数。此时 $\omega\tau=1$，所有数字可由上面的三条公式直接复算：

<div class="learning-lab" data-learning-lab="physics-kubo-response" markdown="1">

**无 JavaScript 时的静态读法：**把 $\tau$、$t$ 和 $\omega$ 都用表中的同一时间单位表示。响应核、阶跃响应和频域电导是同一个 toy 的三个投影。

| 账本 | 公式 | 默认结果 |
|---|---|---:|
| 因果边界 | $\Phi(t<0)$ | $0$ |
| 读数时刻 | $t=\tau$ | $2\ \mathrm{fs}$ |
| 阶跃电流 | $J(\tau)/(\sigma_0E_0)=1-e^{-1}$ | $0.63212$ |
| 频率无量纲量 | $\omega\tau$ | $1$ |
| 耗散部 | $\operatorname{Re}\sigma/\sigma_0=1/(1+1)$ | $0.5$ |
| 色散部 | $\operatorname{Im}\sigma/\sigma_0=1/(1+1)$ | $0.5$ |
| 幅值 | $\lvert\sigma\rvert/\sigma_0=1/\sqrt2$ | $0.70711$ |
| 相位 | $\arg\sigma=\arctan(\omega\tau)$ | $45^\circ$ |

如果把 $\tau$ 加倍而保持 $\omega=0.5\ \mathrm{fs}^{-1}$，则 $\omega\tau=2$，所以 $\operatorname{Re}\sigma/\sigma_0=0.2$、$\operatorname{Im}\sigma/\sigma_0=0.4$，相位为 $\arctan2\approx63.4^\circ$。这说明“响应更慢”同时改变了时间曲线和频域相位。

实验揭示后可拖动 $\tau$、$\omega$、$E_0$，左图显示阶跃前后的 $J(t)$，右图显示 $\operatorname{Re}\sigma$ 与 $\operatorname{Im}\sigma$ 随 $\omega\tau$ 的曲线。负时间区域被保留在图中，用来让因果零响应可见。

**反例与迁移：**若一个拟合只画出吸收峰，却没有与色散部相容的实部/虚部关系，它可能不是一个 causal response。更换为多弛豫时间、记忆核或磁场下的张量电导时，简单 Drude 形式会失效，但 retarded 卷积和 Kramers–Kronig 约束仍是检查入口。

</div>

### 4. 线性与因果的边界

- Kubo 线性响应假定外场足够小，只保留响应对场的一阶导数；强场、加热和整流会产生高阶响应。
- $\sigma_0$、$\tau$ 是本 toy 的参数。真实系统还要处理多带、声子、杂质、相互作用、边界、磁场和接触电阻。
- 热平衡 FDT 的核心前提是平衡密度矩阵的 KMS 条件与线性响应；微观时间反演对称不是一般 FDT 的必要条件，外磁场下平衡系统仍满足相应的 FDT。时间反演更直接约束 Onsager--Casimir 互易关系和某些交叉相关的形式。主动物质或被驱动稳态则不能把平衡 FDT 当作自动真理。
- retarded 函数的零点在 $t<0$ 是因果结构；它不表示平衡涨落在负时间不存在。相关函数与响应函数的时间箭头要分开记。

### 5. 迁移任务

给一条实验电导曲线：低频 $\operatorname{Re}\sigma$ 约为 $\sigma_0$，在 $\omega\tau\simeq1$ 附近色散部最大。请先从交叉频率估计 $\tau$，再问哪些事实会破坏单 Drude 解释：多种散射时间、相干峰、能隙、接触效应还是非线性加热。最后说明为什么仍需检查实部和虚部的因果相容性。

</section>

## 1. 从扰动哈密顿量到 Kubo 公式

设未扰动系统处于密度矩阵 $\rho_0$，外场 $f(t)$ 通过算符 $B$ 耦合：

$$
H'(t)=-f(t)B.
$$

想测的可观测量为 $A$。在相互作用绘景中，一阶 Dyson 展开给出

$$
\delta\langle A(t)\rangle
=\int_{-\infty}^{t}dt'\,\chi^R_{AB}(t-t')f(t'),
$$

其中量子 retarded susceptibility 是

$$
\chi^R_{AB}(t)=\frac{i}{\hbar}\theta(t)
\left\langle[B(0),A(t)]\right\rangle_0.
$$

符号会随 $H'=+fB$ 的约定一起改变，但三件事不变：有一个 commutator、平均取在参考态、以及 $\theta(t)$ 限制积分上限。它不是“把相关函数加一条箭头”这么简单；对易子取的是扰动前后顺序的差异，正是因果反应的量子编码。

对电导，把 $A$ 选成电流 $J$，把 $f$ 选成电场或矢势的相应耦合，处理 diamagnetic/contact 项后才能得到具体的 $\sigma(\omega)$。不同规范和边界条件会改变公式的中间长相，但物理电流和最终可测量响应必须一致。

## 2. 为什么频域知道因果？

若 $\chi^R(t)$ 在负时间为零，并且足够快衰减，则

$$
\chi^R(z)=\int_0^\infty dt\,e^{izt}\chi^R(t)
$$

在 $\operatorname{Im}z>0$ 收敛并解析。解析性把实部和虚部绑在一起，产生 Kramers–Kronig 关系。以一个常见的无穷积分写法为例：

$$
\operatorname{Re}\chi(\omega)=\frac{1}{\pi}\,\mathcal P\int_{-\infty}^{\infty}
\frac{\operatorname{Im}\chi(\omega')}{\omega'-\omega}d\omega',
$$

虚部的关系带有相应的符号与收敛减法。这里 $\mathcal P$ 表示避开极点的 Cauchy principal value。实验上因此不能任意只拟合吸收（虚部）而完全忽略色散（实部）；有限频段和高频尾巴需要外推与 sum rule，但约束本身来自因果。

本页 Drude kernel 的解析性可以直接看见：$\sigma(z)=\sigma_0/(1-iz\tau)$ 的 pole 位于 $z=-i/\tau$，在上半平面没有 pole。若把指数写成增长的 $e^{+t/\tau}$，pole 会跑到错误半平面，既会让时间响应发散，也会破坏 retarded 的解析性。

## 3. Drude toy 的三个读法

第一种读法是时间域。阶跃场刚打开时，电流从零连续起步；在 $t\ll\tau$，$J\approx\sigma_0E_0t/\tau$，系统还没有建立稳态通量；在 $t\gg\tau$，$J\to\sigma_0E_0$。这里的稳态是模型设定，不意味着任何真实晶体都会以单指数到达同一常数。

第二种读法是频域。$\omega\tau\ll1$ 时电导主要是实数，电流近似跟随慢变化的电场；$\omega\tau\gg1$ 时幅值按 $1/(\omega\tau)$ 下降，虚部相对重要，响应显示出储能/惯性相位。耗散功率的周期平均与 $\operatorname{Re}\sigma$ 相连，而不是与虚部直接相连。

第三种读法是量纲。$\omega$ 只能和 $\tau$ 组合成无量纲 $\omega\tau$；所以改变单位而保持这个乘积不变，图形应保持相同。实验台用 fs 只是可读的时间尺度，换成 ps 时必须同步换频率单位。

## 4. Kubo、相关与 FDT 的分层

平衡态中，涨落的对称相关常写成

$$
S_{AB}(t)=\frac12\langle\{A(t),B(0)\}\rangle_0.
$$

它描述无外场时的自然噪声；retarded susceptibility 用 commutator 描述外场后的有序响应。FDT 由热平衡的 KMS 条件把 $S$ 与 $\operatorname{Im}\chi^R$ 通过温度因子相连，即使磁场打破微观时间反演也仍有相应关系；Onsager--Casimir 互易和部分张量对称性才需要额外追踪时间反演。因而“有相关”不自动意味着“有同样的响应”；离开平衡/KMS 条件后，二者可以独立改变。

这条分层是主动物质的关键。持续推进的粒子有非零熵产生和定向通量，稳态通常没有一套全局的平衡 $T$ 让所有 observable 同时满足 FDT。可以定义有效温度作比较，却必须注明频率、观测量和参数范围；不能用一条拟合比例把非平衡驱动抹掉。

## 5. 三个检查题

**例 1（阶跃）** $t=\tau$ 时 $1-e^{-1}=0.63212$，不是“已经达到 1”；若把 $t=0$ 的响应写成 $\sigma_0E_0$，就把阶跃场和无限快的无记忆电导混在一起了。

**例 2（交叉频率）** 若吸收部降到低频值的一半，$1/[1+(\omega\tau)^2]=1/2$，所以 $\omega\tau=1$。测得 $\omega=2\times10^{12}\ \mathrm s^{-1}$ 时，toy 的 $\tau=0.5\ \mathrm{ps}$；这是从频域反推时间记忆的最小例子。

**例 3（因果失败）** 设有人提出 $\Phi(t)=\sigma_0\tau^{-1}e^{-|t|/\tau}$。它可以画出漂亮的对称衰减，但 $t<0$ 仍有响应，所以不是 retarded kernel；它更像一个两时间相关的候选，不能直接放进外场响应积分。

## 6. 小结：先问“谁驱动谁”

Kubo 公式的核心不是一条特殊的 Drude 曲线，而是“微扰通过 retarded commutator 卷积产生一阶响应”。因果性在时间域表现为 $t<0$ 的零，在频域表现为解析性和实虚部约束。平衡 FDT 是在额外条件下把噪声与耗散联系起来的定理，不是响应的定义。

---

*核心句：相关函数告诉你系统怎样自行涨落，retarded 响应告诉你外场怎样改变它；Kubo 公式把后者的因果性写进算符和积分上限。*
