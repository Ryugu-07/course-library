# 流体 III · 湍流与标度律

> **对标**：Frisch《Turbulence》、Pope《Turbulent Flows》、Tong《Fluid Mechanics》第 6 章。**先修**：[质量、动量与能量守恒](fl-01-continuum.html)、[黏性与边界层](fl-02-viscous.html)、[标度与重整化群](asm-03-rg.html)。
> 搅拌器持续做功，水的平均动能却可以不再增长：输入的能量去了哪里？本页用尺度间的能量收支回答这个问题，并区分量纲假设、精确平衡式、有限尺度近似和经验指数模型。Navier–Stokes 方程可以有特殊解析解和可分辨的数值解；困难在于复杂湍流统计量的预测与闭合，不能概括成“没有解”。

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="可横向滚动的湍流能谱与黏性平衡图" style="overflow-x:auto;max-width:100%">
<img src="assets/img/fl-03-turbulence-spectrum.svg" alt="湍流能谱的斜率和有限黏性能量平衡" style="display:block;width:100%;min-width:700px">
</div>
<figcaption><span class="fig-id">图 fl-03.1</span>左：由公式生成的负五分之三能谱基线。右：在给定二阶结构函数的构造中，三阶矩项与黏性项相加为 0.8。曲线展示的是演算关系，不是实测湍流；惯性区需要黏性与强迫变化都相对较小。</figcaption>
</figure>

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="fl03-learning-title">

<h2 id="fl03-learning-title">学习层：沿尺度追踪同一笔能量</h2>

### 1. 先预测：小涡拿到的是更多能量吗？

把水槽中的流动按尺度分组：大尺度 $L$ 接受搅拌器的输入，较小尺度之间交换动能，黏性最终把动能变为内能。这个图景不要求每个大涡都像物体一样碎成小涡；实际能量传递来自速度场的非线性耦合。

设平均耗散率为 $\varepsilon$，单位是每千克每秒消耗的焦耳，即 $\mathrm{m^2/s^3}$。在统计定常状态，平均输入率等于 $\varepsilon$。回答三个问题后再打开实验：

1. 在远离注入和耗散的尺度内，平均能量通量 $\Pi(r)$ 随 $r$ 怎样变化？
2. 固定纵向增量的方向后，三维正向级串的有符号三阶矩是正还是负？
3. She–Lévêque 模型的 $p=6$ 指数比 K41 的 $6/3$ 大还是小？

### 2. 量纲桥：为什么出现三分之一次方？

**K41 假设**：在足够分离的惯性尺度 $\eta\ll r\ll L$，小尺度统计近似各向同性，典型速度增量只由 $\varepsilon,r$ 决定。若 $\delta u\sim\varepsilon^a r^b$，时间量纲要求 $-3a=-1$，长度量纲要求 $2a+b=1$，因此

$$
\delta u(r)\sim(\varepsilon r)^{1/3},\qquad
\tau_r\sim\frac r{\delta u(r)}=\varepsilon^{-1/3}r^{2/3}.
$$

小尺度的增量较小、周转时间也较短；$\delta u^2/\tau_r\sim\varepsilon$ 说明“通量相近”不等于“每个涡拥有相同能量”。这些式子保留了未知的无量纲常数，实验为比较尺度把前两个常数设为 1。

局部 Reynolds 数 $\delta u(r)r/\nu\sim1$ 给出耗散尺度

$$
\eta=\left(\frac{\nu^3}{\varepsilon}\right)^{1/4}.
$$

本页的能谱是**单位质量、三维各向同性壳层积分的谱**：

$$
\int_0^\infty E(k)\,\mathrm dk=\frac12\langle|\mathbf u|^2\rangle,
\qquad [E]=\mathrm{m^3/s^2}.
$$

由这一定义对 $E\sim\varepsilon^a k^b$ 做同样的量纲配平，得到 $a=2/3,b=-5/3$，即

$$E(k)\sim C_K\varepsilon^{2/3}k^{-5/3}.$$

$C_K=1.5$ 是本实验在这一谱约定下选用的参考值。一维纵向谱与三维壳层谱的系数不能直接混用；$k\approx1/r$ 也只是尺度代理，不是精确 Fourier 变换。改变 Fourier 归一化时须同时修改谱定义与系数。

### 3. 可操作实验：公式参考带与黏性修正

<div class="learning-lab" data-learning-lab="turbulence-cascade" markdown="1">

**JavaScript 失效时：**取 $L=1\,\mathrm m$、$\nu=10^{-5}\,\mathrm{m^2/s}$、$\varepsilon=1\,\mathrm{m^2/s^3}$。于是 $\eta\approx1.778\times10^{-4}\,\mathrm m$，$U=(\varepsilon L)^{1/3}=1\,\mathrm{m/s}$，$\mathrm{Re}=UL/\nu=10^5$。取 $r=0.01\,\mathrm m$，可复算下面的公式基线。

| 量 | 公式 | 本例数值 |
|---|---|---|
| 典型增量 | $(\varepsilon r)^{1/3}$ | $0.21544\,\mathrm{m/s}$ |
| 周转时间 | $r/\delta u$ | $0.04642\,\mathrm s$ |
| 波数代理 | $1/r$ | $100\,\mathrm{m^{-1}}$ |
| 能谱基线 | $1.5\varepsilon^{2/3}k^{-5/3}$ | $6.9624\times10^{-4}\,\mathrm{m^3/s^2}$ |
| 有符号三阶矩的惯性极限 | $-4\varepsilon r/5$ | $-0.008\,\mathrm{m^3/s^3}$ |
| 绝对值六阶指数 | K41 / She–Lévêque | $2$ / $16/9\approx1.7778$ |

实验选取 $10\eta\le r\le L/10$ 作为**人为的候选带**，只有宽度至少一个数量级并含至少两个采样点才展开实线和读数。它是显示规则，不是验证惯性区的判据。窄带时仍然能画出公式直线，不能据此宣称实际流动满足 K41。有限黏性图采用下文 §3 的给定 $S_2$ 构造。

</div>

### 4. 怎样读图才不会被直线说服？

能谱和通量由公式直接生成，因此平直斜率不是独立证据。真实检验还需测量速度增量、输入/耗散收支、方向依赖、时间稳定性和统计误差。实际数据里的有限带宽斜率也不能单独证明某个普适理论。

实验中 $L,\nu,\varepsilon$ 采用 SI 单位，$U=(\varepsilon L)^{1/3}$ 是为估算定义的大尺度速度。改变它们会改变 $\eta$ 与候选带；改变阶数 $p$ 只改变指数比较。有限黏性图给定统计函数后反算平衡项，尚未证明这个函数组能由某个真实流场实现。

</section>

## 1. 为什么平均方程还没有闭合？

在常密度、常黏度、不可压流动中，取能与时空导数交换的集合平均，写 $u_i=\bar u_i+u_i'$，其中 $\overline{u_i'}=0$。不可压性使 $u_j\partial_j u_i=\partial_j(u_i u_j)$；展开并平均后

$$
\overline{u_i u_j}=\bar u_i\bar u_j+\overline{u_i'u_j'},\qquad
\rho(\partial_t\bar u_i+\bar u_j\partial_j\bar u_i)
=-\partial_i\bar p+\mu\Delta\bar u_i-\rho\partial_j\overline{u_i'u_j'}.
$$

这里省略外部体力；若存在应保留其平均。$R_{ij}=\overline{u_i'u_j'}$ 是速度协方差，单位为 $\mathrm{m^2/s^2}$；作为动量方程中的附加应力通常写 $-\rho R_{ij}$，不要把协方差本身与应力单位混淆。只有另设平均流定常才能删除 $\partial_t\bar u_i$。

均值方程需要未知的 $R_{ij}$；为它写演化方程又引入三阶矩等量。这种统计层级来自非线性，称为**闭合问题**。RANS 模型为这些量提供模型关系；LES 解析较大尺度并模化未解析应力；DNS 不引入湍流闭合模型，但仍有空间、时间离散误差以及有限采样误差。三者分别回答不同精度与成本的问题；没有一套适合所有几何、Reynolds 数和流动机制的通用闭合公式。

## 2. K41 的前提不能由量纲分析证明

量纲配平是在“只有 $\varepsilon,r$ 重要”的假设下进行的，不会证明方向性、壁面距离、旋转频率或浮力真的可以忽略。定义上述 $U$ 后，代数上有

$$\frac L\eta=\mathrm{Re}^{3/4},\qquad \mathrm{Re}=\frac{UL}{\nu}.$$

在实测流动中若 $U$ 独立测得，通常写 $\varepsilon=C_\varepsilon U^3/L$，于是 $L/\eta=C_\varepsilon^{1/4}\mathrm{Re}^{3/4}$；实验相当于固定 $C_\varepsilon=1$。大 Re 有利于尺度分离，却不能保证流动已经湍化或小尺度各向同性。

惯性区中 $\Pi\approx\varepsilon$ 是统计能量收支：注入和直接黏性损失相对较小。有限 Re 下它们并非严格为零。二维流动还受涡量平方守恒的约束，可能出现能量逆级串与涡量平方正向级串；不能只把三维公式翻转符号来得到二维定律。

## 3. 从精确能量平衡到 4/5 律

### 3.1 固定增量方向与强迫约定

取 $\hat{\mathbf r}$ 从 $\mathbf x$ 指向 $\mathbf x+\mathbf r$，定义

$$
\delta u_L=[\mathbf u(\mathbf x+\mathbf r)-\mathbf u(\mathbf x)]\cdot\hat{\mathbf r},
\quad S_2(r)=\langle(\delta u_L)^2\rangle,
\quad S_3(r)=\langle(\delta u_L)^3\rangle.
$$

$S_3$ 保留符号，$\langle|\delta u_L|^3\rangle$ 则不保留；两者不可互换。设 $\mathbf f$ 是方程中的单位质量体力（加速度），令

$$
F_{LL}(r)=\langle f_L(\mathbf x)u_L(\mathbf x+\mathbf r)
+u_L(\mathbf x)f_L(\mathbf x+\mathbf r)\rangle.
$$

在三维、不可压、齐次、各向同性、统计定常且相关函数足够正则的条件下，Kármán–Howarth 方程给出

$$
\frac1{r^4}\frac{\mathrm d}{\mathrm dr}
\left[r^4\left(2\nu S_2'(r)-\frac{S_3(r)}3\right)\right]=2F_{LL}(r).
$$

这一步来自两点速度方程相乘、平均与各向同性张量化简，是相关函数的精确收支，不使用 $p/3$ 标度假设。由原点的正则性排除 $r^{-4}$ 积分常数，乘 $r^4$ 从 $0$ 积到 $r$：

$$
\boxed{S_3(r)=6\nu S_2'(r)-\frac6{r^4}\int_0^r s^4F_{LL}(s)\,\mathrm ds.}
$$

统计定常能量平衡使 $\langle\mathbf u\cdot\mathbf f\rangle=\varepsilon$，各向同性给 $F_{LL}(0)=2\varepsilon/3$。故也可写成

$$
S_3(r)=-\frac45\varepsilon r+6\nu S_2'(r)
-\frac6{r^4}\int_0^r s^4\left[F_{LL}(s)-\frac{2\varepsilon}3\right]\,\mathrm ds.
$$

**$4/5$ 从哪里来？** 常数强迫相关项的积分是 $\int_0^r s^4\,\mathrm ds=r^5/5$，再乘 $6\times2/3$，正好给出 $4r/5$。当 $r\ll L$ 时强迫相关变化可小；当 $r\gg\eta$ 时黏性项可小。在这两个相对修正同时消失的惯性极限，得到精确系数 $S_3=-4\varepsilon r/5$。有限 Re 的一个图上区间通常只能近似满足它。非定常或非各向同性时，不能直接使用已删去那些项的方程。

### 3.2 可复算反例：靠近原点不能一直画负斜线

对黏性正则流场，$\delta u_L=r\partial_Lu_L+O(r^2)$，所以 $S_2=O(r^2)$、$S_3=O(r^3)$。各向同性耗散关系给

$$S_2(r)\sim\frac{\varepsilon}{15\nu}r^2,
\qquad 6\nu S_2'(r)\sim\frac45\varepsilon r.$$

黏性项恰好抵消 $-4\varepsilon r/5$ 的一阶项。因此把惯性区直线直接画到 $r=0$ 会违反小尺度正则性。

为把抵消画出来，**人为选取一个光滑二阶函数**，令 $b=30^{3/4}$、$q=(r/(b\eta))^2$：

$$S_2^{\mathrm{toy}}(r)=\frac{\varepsilon r^2}{15\nu}(1+q)^{-2/3}.$$

它在 $r\ll b\eta$ 保留上面的二次式，在 $r\gg b\eta$ 给出 $2(\varepsilon r)^{2/3}$。把强迫相关近似为常数，并用同一个 $S_2^{\mathrm{toy}}$ 计算导数，可得

$$
V(r)=\frac{6\nu(S_2^{\mathrm{toy}})'(r)}{\varepsilon r}
=\frac45\frac{1+q/3}{(1+q)^{5/3}},\qquad
B(r)=\frac{-S_3^{\mathrm{toy}}}{\varepsilon r}=\frac45-V(r).
$$

实验的绿色是 $V$，蓝色是 $B$，金色是总和 $B+V=0.8$。这个恒等式来自构造，不是由测量验证的定律；$r$ 接近 $L$ 时，连强迫常数近似也需要改进。模型不是完整流场解，也不保证所选各阶矩能由真实湍流共同实现。它的用途是理解被略去的黏性项如何改变读图。

## 4. 间歇性：高阶矩为何更敏感？

定义无量纲绝对值结构函数 $M_p(\ell)=\langle|\delta u_L/U|^p\rangle$，其中 $\ell=r/L$。若在某个标度极限 $M_p\sim C_p\ell^{\zeta_p}$，K41 的基线是 $\zeta_p=p/3$。高阶矩把较大的增量加上更高次幂，因此对稀少的大事件更敏感；有限样本的高阶指数尤其需要误差与收敛检查。

**凹性不是一个任意拟合要求。** 当所需矩有限，Hölder 不等式给出

$$M_{\theta p+(1-\theta)q}\le M_p^\theta M_q^{1-\theta},\qquad0<\theta<1.$$

取对数，除以 $\log\ell<0$ 后不等号反向，再在标度极限略去有限常数项，得到

$$\zeta_{\theta p+(1-\theta)q}\ge\theta\zeta_p+(1-\theta)\zeta_q.$$

所以指数关于阶数是凹的；K41 的直线也满足凹性。**非线性偏离**才体现这里讨论的反常标度，不能把“凹”本身当成发现间歇性的证明。

本实验用 She–Lévêque 的现象学模型作对照：

$$\zeta_p^{\mathrm{SL}}=\frac p9+2\left[1-\left(\frac23\right)^{p/3}\right].$$

$p=6$ 时为 $16/9$，比 $2$ 小；$p=1,2$ 时反而略高于 $p/3$。两套模型在 $p=3$ 都给 $1$，也不能推出绝对值三阶矩必然等于 signed $S_3$ 的精确关系。重整化群、多重分形等提供了研究工具，但本模型不是从一般三维 Navier–Stokes 方程无附加统计假设推导出的普适闭合。

## 5. 把尺度估算用到计算和测量

**DNS 成本。** 对近似均匀三维域，按 $\Delta x\sim\eta$ 估算，格点数 $N\sim(L/\eta)^3\sim\mathrm{Re}^{9/4}$。若使用由大尺度平流速度 $U$ 限制的显式 CFL 步长 $\Delta t\sim\eta/U$，模拟一个大涡时间 $L/U$ 需要 $L/\eta\sim\mathrm{Re}^{3/4}$ 步，故格点更新次数约为 $\mathrm{Re}^3$。这不是所有算法和壁湍流的统一成本定律，还没计谱算法对数因子、并行通信、壁面各向异性网格及多个统计独立周转时间。

**大气估算。** $\varepsilon=10^{-3}\,\mathrm{m^2/s^3}$、$\nu=1.5\times10^{-5}\,\mathrm{m^2/s}$ 给 $\eta\approx1.36\,\mathrm{mm}$。即使将 $L$ 取为千米得到很大尺度比，也不能把整个区间都称作三维各向同性惯性区：旋转与稳定分层会引入新的长度和时间尺度。

**标量混合。** 对糖浓度等被动标量，分子扩散时间估算为 $L^2/D$，应与标量分子扩散率 $D$ 比较，而非把 $D$ 自动换成运动黏度 $\nu$。湍动拉伸、折叠产生细梯度后仍由分子扩散完成局部均匀化；大尺度有效扩散 $D_t\sim u'\ell_c$ 也是依赖流动与相关长度 $\ell_c$ 的模型估算。

## 6. 迁移题：不靠记忆斜率回答

1. 固定 $L,\varepsilon$，把 $\nu$ 减为原来的 $1/16$。$\eta$、尺度比、上述 DNS 格点数和每个大涡时间的更新次数各变几倍？
2. 给定小尺度 $S_2=\varepsilon r^2/(15\nu)+O(r^4)$，为什么 $S_3=-4\varepsilon r/5$ 不能在原点附近单独成立？这是否否定惯性极限的 $4/5$ 系数？
3. 在单位相同的归一化六阶矩上，固定两模型在 $\ell=1$ 的振幅。取 $\ell=10^{-3}$，SL 与 K41 的预测之比是多少？这一个比值能证明某次实验存在间歇性吗？

<details class="answer" markdown="1">
<summary>展开推导与答案</summary>

1. $\eta\propto\nu^{3/4}$，所以减为 $1/8$；$L/\eta$ 增为 $8$ 倍，格点数增为 $8^3=512$ 倍，CFL 步数增为 $8$ 倍，更新次数增为 $4096$ 倍。也可用 $\mathrm{Re}$ 增为 $16$ 倍复核 $16^{9/4}=512$、$16^3=4096$；这些估计沿用 §5 的域与时间步假设。

2. $6\nu S_2'=4\varepsilon r/5+O(r^3)$，正好抵消惯性直线的一阶项，留下 $S_3=O(r^3)$。极小尺度的黏性主导与惯性区的黏性可忽略是不同极限，二者不矛盾。

3. 指数差为 $16/9-2=-2/9$，故比值为 $(10^{-3})^{-2/9}=10^{2/3}\approx4.64$。这是固定振幅后的模型对比；真实推断还需实际速度样本、足够的统计量与尺度区间，并排查有限 Re 和强迫影响，不能用输入公式自证。

</details>

## 来源与后续

- [David Tong：Fluid Mechanics，§6.3.3–6.3.4](https://www.damtp.cam.ac.uk/user/tong/fluids/fluids.pdf)：两点相关的 Kármán–Howarth 方程与黏性修正。本文显式保留强迫相关的积分，区分精确平衡和惯性近似。
- [McComb、Yoffe、Linkmann、Berera：Spectral analysis of structure functions，§V.1](https://arxiv.org/html/1408.0539)：有限强迫、黏性以及 signed / absolute 结构函数的区别。
- [She、Lévêque：Universal scaling laws in fully developed turbulence（1994）](https://doi.org/10.1103/PhysRevLett.72.336)：本页指数模型的原始论文；模型假设不等同于一般流动的证明。

下一页：[流动失稳、对流与分岔](fl-04-instability.html)。线性失稳解释部分扰动的初始增长；有限振幅转捩和充分发展的湍流统计还需要后续分析。
