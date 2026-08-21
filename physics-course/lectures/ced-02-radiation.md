# 电动力学 II · 推迟势与辐射

> **对标**：Jackson §6、§9、§14 主干 ｜ **前置**：em-02/03、ced-01、mp-01（推迟 Green 函数）
> 源的消息以光速迟到：推迟势把因果律写进积分核，非相对论短偶极把这条迟到的消息变成远场 $1/r$ 场、Larmor 功率和 $\sin^2\theta$ 方向图。本页明确停在这个近似层，不把它冒充完整的 Liénard–Wiechert 或自力理论。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="retarded-radiation-learning-title">

<h2 id="retarded-radiation-learning-title">学习层：先追时间戳，再追能量流</h2>

### 1. 具体开场：同一个源事件，三个观察者

源在 $t_\mathrm{source}=2$ 发生一次加速变化。距离为 $R=1,2,4$ 的观察者不会同时收到这条消息；在 $c=1$ 的归一化账本里，收到时间分别是 $3,4,6$。若在 $t_\mathrm{obs}=5$ 观察距离 $R=2$ 的场，公式中应该取源的 $t_\mathrm{ret}=3$，而不是源在 $t=5$ 的状态。

接着还有第二个容易混淆的时间尺度：源附近的场可暂存并把能量送回源。远区让我们能从局部的 $1/r$ 场直接辨认辐射；而在周期稳态下，只要球面包住全部源且球面之间无耗散，任意这类球面的周期平均**积分**能流都等于辐射功率。局部瞬时流与球面积分后的周期平均不能混成一句话。

### 2. 先预测，再揭示

实验先隐藏推迟时间、区域分解、角分布和功率数字。请判断：

1. 观测时刻 $t$、路径长度 $R$ 和光速 $c$ 给出的源时间是 $t-R/c$ 还是 $t+R/c$？
2. 电偶极沿振荡轴的远场功率是零、最大，还是与角度无关？
3. $kr\ll1$、$kr\approx1$、$kr\gg1$ 分别对应近场、感应区和辐射区中的哪一项主导？
4. 在固定 $p_0$、短偶极、非相对论、谐稳态条件下，周期平均功率随 $\omega$ 如何缩放？
5. 远场电场幅度与距离、时间平均通量与距离分别按什么幂衰减？

### 3. 形式桥：推迟核到偶极账本

推迟 Green 函数把源的取值锁在光锥上：

$$
t_\mathrm{ret}=t-\frac{|\mathbf r-\mathbf r'|}{c}.
$$

点偶极的远场保留加速度项：

$$
|\mathbf E_\mathrm{rad}|=
\frac{|\ddot{\mathbf p}(t_\mathrm{ret})|\sin\theta}{4\pi\varepsilon_0c^2r},
\qquad
\mathbf B_\mathrm{rad}=\frac1c\hat{\mathbf n}\times\mathbf E_\mathrm{rad}.
$$

于是

$$
\frac{dP}{d\Omega}(t)=
\frac{|\ddot p(t_\mathrm{ret})|^2}{16\pi^2\varepsilon_0c^3}\sin^2\theta,
\qquad
P_\mathrm{Larmor}=\frac{q^2a^2}{6\pi\varepsilon_0c^3}.
$$

若 $p(t)=p_0\cos\omega t$，对一个周期平均 $\langle\ddot p^2\rangle=p_0^2\omega^4/2$，因此

$$
\left\langle\frac{dP}{d\Omega}\right\rangle=
\frac{p_0^2\omega^4}{32\pi^2\varepsilon_0c^3}\sin^2\theta,
\qquad
\langle P\rangle=\frac{p_0^2\omega^4}{12\pi\varepsilon_0c^3}.
$$

### 4. 静态后备：因果与辐射账本

<div class="learning-lab" data-learning-lab="retarded-radiation" markdown="1">

**静态读法：**实验默认 $c=\varepsilon_0=p_0=\omega=1$，观察时刻 $t=5$，源事件时刻 $2$。区域阈值是教学用的连续标尺，不是场的硬切换。

| 检查 | 静态读数 | 结论/边界 |
|---|---|---|
| $R=1,2,4$ 的到达时间 | $t_\mathrm{arr}=3,4,6$ | 事件沿光路以 $c$ 传播；观测 $t=5$ 时 $R=4$ 的事件尚未到达 |
| 推迟源时间 | $t_\mathrm{ret}=t-R/c$ | 取源的过去状态，不是超前时间 |
| 近场 | $kr\ll1$，$1/r^3$ 项显著 | 反应性能量可返回源；不把局部瞬时能流全叫辐射 |
| 感应区 | $kr\approx1$，$1/r^3$、$1/r^2$ 与 $1/r$ 同阶竞争 | 不能只套用纯远场方向关系 |
| 辐射区 | $kr\gg1$，除角分布节点外 $1/r$ 项主导 | $\lvert E_\mathrm{rad}\rvert\propto1/r$，局部平均通量 $\propto1/r^2$ |
| 角分布 | $\langle dP/d\Omega\rangle\propto\sin^2\theta$ | 轴向零点，赤道面最强 |
| 频率缩放 | 固定 $p_0$ 时 $\langle P\rangle\propto\omega^4$ | 只属于短偶极、非相对论、谐稳态模型 |

### 5. 边界与常见误读

- **推迟时间不是“把所有量都延迟一下”的口号。**积分中的距离和源位置共同决定光锥；点源近似只是本页的模型化起点。
- **近场不等于没有能量。**$1/r^3$ 和 $1/r^2$ 项可以储能、交换能量；远场用于从局部场分离辐射项。周期稳态中，包围全部源的无耗散球面之周期平均积分通量与半径无关，但其局部瞬时流仍可含反应性成分。
- **$\omega^4$ 不是任意天线效率定理。**真实尺寸、阻抗、材料损耗和相对论修正都可能改变工程结论。
- **本页不推导完整 Liénard–Wiechert 场。**相对论速度、前向聚束、加速源的精确几何因子另需完整点电荷解。
- **本页不做 Abraham–Lorentz–Dirac 自力问题。**辐射功率账与自作用方程是不同层次，不能由 Larmor 公式单独推出无病态的运动方程。

### 6. 迁移问题

若源尺寸不再远小于波长，哪一步的偶极截断先失效？若只测到一个方向的远场强度，怎样用 $\sin^2\theta$ 反推振荡轴，同时保留相位和多极干涉的不确定性？

</div>

</section>

## 1. 推迟势与因果性

Lorenz 规范下，波动方程由推迟 Green 函数选出因果解：

$$
V(\mathbf r,t)=\frac{1}{4\pi\varepsilon_0}
\int\frac{\rho(\mathbf r',t-|\mathbf r-\mathbf r'|/c)}{|\mathbf r-\mathbf r'|}\,dV',
$$

$$
\mathbf A(\mathbf r,t)=\frac{\mu_0}{4\pi}
\int\frac{\mathbf J(\mathbf r',t-|\mathbf r-\mathbf r'|/c)}{|\mathbf r-\mathbf r'|}\,dV'.
$$

超前解不满足本页选择的因果边界条件。对有限源，源内不同位置还有不同的路程，因此多极展开既是空间近似，也是对推迟时间的系统展开。

## 2. 非相对论短偶极的远场

设源尺寸远小于波长，观察距离在辐射区，且源速度远小于 $c$。在 $1/r$ 阶，电场和磁场横向，满足

$$
\mathbf E_\mathrm{rad}(\mathbf r,t)=
\frac{[(\hat{\mathbf n}\times\ddot{\mathbf p})\times\hat{\mathbf n}]_{t_\mathrm{ret}}}
{4\pi\varepsilon_0c^2r},
\qquad
\mathbf B_\mathrm{rad}=\frac1c\hat{\mathbf n}\times\mathbf E_\mathrm{rad}.
$$

这里的 $1/r$ 是关键：$E^2$ 带来 $1/r^2$，乘球面面积后得到与半径无关的功率。若保留全场，还会看到电场的 $1/r^3$ 近场项和 $1/r^2$ 感应项；它们在近源区域不能被辐射项抹掉。

## 3. Larmor 功率与角分布

对偶极轴与观察方向夹角 $\theta$，瞬时角功率为

$$
\frac{dP}{d\Omega}(t)=
\frac{|\ddot p(t_\mathrm{ret})|^2}{16\pi^2\varepsilon_0c^3}\sin^2\theta.
$$

利用 $\int\sin^2\theta\,d\Omega=8\pi/3$，并在点电荷极限取 $\ddot p=qa$，得到非相对论 Larmor 公式。谐振偶极的周期平均式多出 $1/2$，所以固定振幅时才得到 $\omega^4$ 标度。轴向 $\theta=0$ 是节点，赤道面 $\theta=\pi/2$ 最强。

## 4. 三个区域与模型边界

用 $k=\omega/c$ 衡量距离：$kr\ll1$ 近场以 $1/r^3$ 储能项为主，$kr\approx1$ 是近场、感应场和辐射场相互竞争的过渡区，$kr\gg1$ 才能把 $1/r$ 项作为远场主导。实验用可调 $kr$ 和账本把这三层同时列出，但不制造一条不连续的物理边界。

更高阶电多极、磁偶极以及有限源尺寸会修正方向图。相对论性点电荷辐射要使用完整 Liénard–Wiechert 场；辐射反作用还涉及自力方程、初值和有效理论。它们都超出本页的非相对论短偶极账本。

## 5. 练习

1. 由 $1/r$ 远场和 Poynting 矢量推导球面总功率与半径无关。
2. 对 $p(t)=p_0\cos\omega t$ 先算瞬时 $dP/d\Omega$，再做周期平均，检查 $1/32\pi^2$ 与 $1/12\pi$ 的系数。
3. 解释为什么在 $kr\ll1$ 的探测点看到的局部能流不能直接作为净辐射功率。

---

*下一门：统计进阶——相变、Ising 与重整化群。*
