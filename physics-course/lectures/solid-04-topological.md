# 固体 IV · Berry 相位与拓扑能带

> **对标**：Berry 相位、Chern 绝缘体与二维两带模型 ｜ **前置**：solid-01/02（Bloch 能带与倒空间）、solid-03（交换与序参量）、qm-03（两能级系统与本征态）
> “有边缘态”是一个醒目的实验信号，却不是拓扑的定义。本讲用一个能算到底的两带模型，把 bulk gap、Berry phase、Berry curvature、Chern invariant 和边界谱放进同一套账本；你会看到边缘态怎样支持 bulk-boundary correspondence，也会看到为什么一条漂亮的边界色散不能独自证明 Chern 数。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="topological-band-learning-title">

## 学习层：边缘态为什么不能替代拓扑不变量？

<h3 id="topological-band-learning-title">1. 具体谜题：同一条边界色散，究竟证明了什么？</h3>

二维晶体的 Bloch 波函数不仅有能量，还有随着 $\mathbf k$ 改变的相位结构。相位可以局部改写，却可能在整个 Brillouin zone 上留下不能连续抹掉的整数。实验上，边缘输运或扫描谱常先看到一条穿过 bulk gap 的支，于是很容易把“有 edge state”直接等同于“有拓扑”。

先把问题说尖锐：

1. 改变质量参数 $m$ 时，bulk gap 在哪里必须闭合，系统才能从 $C_-= -1$ 变成 $C_-=+1$？
2. 固定 $k_y=0$ 绕一圈 $k_x$，Berry phase 是整张二维 BZ 的 Chern 数吗？
3. 若某个 $k_y$ 切片没有边缘态，它能否推翻整个二维系统的拓扑？

本实验采用 QWZ 两带模型。你先预测，再打开曲率热图、gap、Berry phase、Chern 数和 $x$-open 边界谱；所有数值都来自同一个 Hamiltonian。

<h3>2. 先预测：让相变先发生在你的脑中</h3>

实验默认 $m=-1,\ k_y=0$。这里的 $k_x,k_y$ 都以晶格常数为 1 的无量纲倒空间坐标表示。

1. 把 $m$ 从 $-1$ 连续调到 $+1$，若下带 Chern 数从 $-1$ 变为 $+1$，中途的 bulk gap 能否始终大于零？
2. 在默认切片 $k_y=0$ 上，Berry phase 更像 $0$ 还是 $\pi$？注意它是这条一维闭合回路的量。
3. 默认切片满足边缘条件吗？把 $k_y$ 改变到 $\pi$，整个二维相的拓扑会不会因此消失？

选择预测后再揭示结果。读图顺序建议固定为：先看 $\Delta$ 是否闭合，再看整张曲率积分得到的 $C_-$，最后用边界谱检查哪些 $k_y$ 切片承载边缘支。

<h3>3. 最小机制：两带 Hamiltonian 把几何变成向量</h3>

模型写成

$$
H(\mathbf k)=\mathbf d(\mathbf k)\cdot\boldsymbol{\sigma},
\qquad
\mathbf d=(\sin k_x,\ \sin k_y,\ m+\cos k_x+\cos k_y).
$$

这里 $\boldsymbol{\sigma}=(\sigma_x,\sigma_y,\sigma_z)$ 是轨道或赝自旋空间中的 Pauli 矩阵；它不必等同于真实电子自旋。两条能带为

$$
E_\pm(\mathbf k)=\pm|\mathbf d(\mathbf k)|.
$$

因此 bulk direct gap 是

$$
\Delta_{\mathrm{bulk}}=2\min_{(k_x,k_y)\in\mathrm{BZ}}|\mathbf d(\mathbf k)|.
$$

gap 什么时候可能为零？必须同时满足 $\sin k_x=0,\ \sin k_y=0$，所以只需检查四个高对称点：

| 点 | $(k_x,k_y)$ | $d_z$ |
|---|---|---:|
| $\Gamma$ | $(0,0)$ | $m+2$ |
| $X$ | $(\pi,0)$ | $m$ |
| $Y$ | $(0,\pi)$ | $m$ |
| $M$ | $(\pi,\pi)$ | $m-2$ |

相变边界是 $m=-2,0,2$。这也是实验计算 bulk gap 时必须显式纳入这些点的原因：只取一个不包含端点的均匀采样格，可能把真正的零误判为一个很小但非零的数。

<h3>4. Berry phase：一条闭合路径的相位账本</h3>

设下带归一化本征态为 $|u_-(\mathbf k)\rangle$。局部 Berry connection 可写为

$$
\mathbf A_-(\mathbf k)=i\langle u_-(\mathbf k)|\boldsymbol{\nabla}_{\mathbf k}u_-(\mathbf k)\rangle.
$$

沿固定 $k_y$ 的闭合 $k_x$ 回路，Berry phase 为

$$
\gamma(k_y)=\oint A_{-,x}\,dk_x\quad(\bmod\ 2\pi).
$$

数值上更稳健的离散写法是相邻本征态重叠的乘积：

$$
\gamma=-\arg\prod_j
\langle u_-(k_{x,j},k_y)\mid u_-(k_{x,j+1},k_y)\rangle.
$$

负号来自这里选取的 $\mathbf A=i\langle u|\nabla u\rangle$ 约定；换约定可能让所有相位与 Chern 数同时变号，但物理预测不变。$\gamma$ 只回答“一条回路绕了多少相位”，并不是自动等于二维 BZ 上的整数。

<h3>5. Berry curvature 与 Chern invariant：局部弯曲怎样累积成整数？</h3>

对于 $H=\mathbf d\cdot\boldsymbol{\sigma}$，下带的 Berry curvature 在本实验约定下为

$$
\Omega_-(\mathbf k)=
-\frac12
\frac{\mathbf d\cdot
(\partial_{k_x}\mathbf d\times\partial_{k_y}\mathbf d)}
{|\mathbf d|^3}.
$$

二维 Chern invariant 是整个 BZ 的积分：

$$
C_-=\frac1{2\pi}\int_{\mathrm{BZ}}\Omega_-(\mathbf k)\,d^2k.
$$

当 $\Delta_{\mathrm{bulk}}>0$ 时，$C_-$ 只能取整数，并且在连续改变参数时不能改变，除非 gap 闭合。对当前方向、下带和曲率符号约定，四个区间是

$$
C_-=
\begin{cases}
0,&m<-2,\\
-1,&-2<m<0,\\
+1,&0<m<2,\\
0,&m>2.
\end{cases}
$$

在 $m=0$ 等边界，下带与上带在 $X,Y$ 接触；此时“下带的 Chern 数”没有绝缘体意义。有限网格可能吐出 $-0.024$ 一类接近零的浮点结果，但不要把临界点的数值残差当成定义。

<h3>6. 边界谱：bulk-boundary correspondence 的一条可检验切片</h3>

沿 $x$ 方向截断、保留 $k_y$ 为好量子数，固定 $k_y$ 后模型可视作一维链。实验采用的理想边界条件给出有效质量

$$
m_{\mathrm{eff}}(k_y)=m+\cos k_y,
\qquad
|m_{\mathrm{eff}}(k_y)|<1.
$$

满足条件时有理想边界支，其能量为

$$
E_{\mathrm{edge},\pm}(k_y)=\pm\sin k_y,
$$

衰减因子为 $|\lambda|=|m_{\mathrm{eff}}|$。所以 $|m_{\mathrm{eff}}|$ 越小，状态越集中在边界；到 $m_{\mathrm{eff}}=0$ 时，这个代理模型给出零长度的极限化定位。这个公式描述的是干净、平移不变、理想边界的教学模型，不是任意真实表面的完整谱。

默认 $m=-1$、$k_y=0$ 时 $m_{\mathrm{eff}}=0$，故有 $E_{\mathrm{edge}}=0$ 的边缘切片。可是同一个质量参数在 $k_y=\pi$ 时 $m_{\mathrm{eff}}=-2$，该切片没有理想边界支。这不是矛盾，而是“边界支只存在于一段动量区间”的直接体现。

<div class="learning-lab" data-learning-lab="physics-topological-band" markdown="1">

<h3>7. 无 JavaScript 时的静态读法：把数值和公式对账</h3>

默认值是 $m=-1,\ k_y=0$。静态代入得到

$$
\Delta_{\mathrm{bulk}}=2,\qquad
C_-\approx-1,\qquad
\gamma(0)=\pi,\qquad
m_{\mathrm{eff}}(0)=0.
$$

因此默认实验应显示 gap 为 2、下带 Chern 数约为 $-1$、Berry phase 约为 $3.142\ \mathrm{rad}$，并报告当前切片存在零能边缘支。数值积分和离散重叠会有约 $10^{-15}$ 量级的浮点误差。

| 参数 | bulk gap $\Delta$ | 下带 $C_-$ | $k_y=0$ Berry phase | $k_y=0$ 边缘支 |
|---|---:|---:|---:|---|
| $m=-1$ | $2.0$ | $\approx-1$ | $\pi$ | 有，$E=0$ |
| $m=1$ | $2.0$ | $\approx+1$ | $0$ | 无；其他 $k_y$ 可有 |
| $m=2.6$ | $1.2$ | $\approx0$ | $0$ | 无 |
| $m=0$ | $0$ | 不定义 | 若回路穿过简并点则不定义 | 不可用绝缘体语言判断 |

特别留意第二行：$m=1$ 仍在非平庸区间，但默认的 $k_y=0$ 切片不满足 $|1+\cos0|<1$。所以“我没在一个动量切片看到 edge”不能推出 $C_-=0$。

</div>

<h3>8. 误区与失败边界</h3>

- **Berry phase 不是 Chern invariant。**前者依赖选定的闭合路径，后者积分整个二维 BZ；只有在额外条件下，随 $k_y$ 的 Berry phase 变化才与 Chern 数联系起来。
- **边缘态不是拓扑的定义。**边界势、有限宽度、无序和表面重构会移动或混合局部谱；Chern 数是在 bulk gap 打开的前提下定义的 bulk 量。
- **gap 不能只看一个点，也不能只看粗网格。**本模型的候选闭合点由 $\sin k_x=\sin k_y=0$ 给出；数值网格必须覆盖它们，或单独做高对称点检查。
- **临界点不拥有可靠的绝缘体 Chern 数。**gap 闭合时下带与上带不能在整个 BZ 上保持分离，有限采样得到的近似整数没有拓扑保护。
- **符号依赖约定。**交换 $k_x,k_y$ 的方向、改用上带或改变 Berry connection 定义，可能让报告的符号改变；先写清楚坐标取向、能带和公式。
- **两带 QWZ 模型不是所有材料的身份证。**真实系统还会有自旋简并、多个轨道、相互作用、非理想边界和 disorder；拓扑账本必须在相应有效 Hamiltonian 上重新建立。

<h3>9. 迁移任务：把“边界证据”升级成完整判据</h3>

设你在样品的一条边看到穿越费米能的色散支，但 bulk 光谱还有一个未确认的小 gap。请写一份最小验证清单：先如何测 bulk gap，如何在整个 BZ 或等价的参数空间上计算 Berry curvature，再如何判断边缘支是否在同一个 gap 中连接价带与导带？最后说明为什么在 gap 尚未确认打开时，不能把边缘输运直接命名为量子反常霍尔拓扑。

</div>

## 1. Bloch 态的相位为什么会留下几何

晶体平移对称性把波函数写成 Bloch 形式

$$
\psi_{n\mathbf k}(\mathbf r)=e^{i\mathbf k\cdot\mathbf r}u_{n\mathbf k}(\mathbf r),
$$

其中 $u_{n\mathbf k}$ 具有晶格周期。对每一个 $\mathbf k$，$|u_{n\mathbf k}\rangle$ 只确定到一个相位：$|u\rangle\to e^{i\chi(\mathbf k)}|u\rangle$。因此单点的相位不是可观测量，但沿路径累积的几何相位可以通过干涉、极化、轨道磁矩或输运响应体现出来。

这个“可局部改写、整体可能有障碍”的结构，和电磁学中的规范势很像。Berry connection 在规范变换下改变为

$$
\mathbf A\to\mathbf A-\boldsymbol{\nabla}_{\mathbf k}\chi
$$

（采用本讲的 $\mathbf A=i\langle u|\nabla_{\mathbf k}u\rangle$ 约定），所以闭合回路的 $\gamma$ 只在 $2\pi$ 意义下不变。曲率

$$
\Omega_{n,xy}=\partial_{k_x}A_{n,y}-\partial_{k_y}A_{n,x}
$$

则直接消除了局部规范选择。Chern 数把曲率在闭合 BZ 上积分，得到一个不依赖平滑规范的整数。

## 2. 两带球面映射与 gap 边界

把 $\hat{\mathbf d}=\mathbf d/|\mathbf d|$ 看作从动量环面到单位球面的映射。只要 $\mathbf d$ 不为零，$\hat{\mathbf d}$ 在整个 BZ 上连续；改变 $m$ 只能连续变形这张图，不能改变它包裹球面的整数次数。若 $\mathbf d=0$，归一化失效，正是 band gap closure。

本模型的三个分量各承担一个角色：$\sin k_x$ 与 $\sin k_y$ 在高对称点为零，决定可能的 Dirac 接触；$m+\cos k_x+\cos k_y$ 是质量项，决定这些接触点映到球面的北极还是南极。四个点的质量符号随 $m$ 改变，导致不同 Dirac 点的半整数曲率贡献重新组合为 $0,\pm1$。

可以直接算导数

$$
\partial_{k_x}\mathbf d=(\cos k_x,0,-\sin k_x),\qquad
\partial_{k_y}\mathbf d=(0,\cos k_y,-\sin k_y).
$$

它们的叉积为

$$
\partial_{k_x}\mathbf d\times\partial_{k_y}\mathbf d
=(\sin k_x\cos k_y,\ \cos k_x\sin k_y,\ \cos k_x\cos k_y).
$$

把它与 $\mathbf d$ 做点积，再除以 $|\mathbf d|^3$，就得到曲率热图中红蓝斑块的数值。靠近小质量的 Dirac 点时分母变小，曲率集中；远离相变时曲率更平缓。曲率“集中得很高”不等于 Chern 数已经很大，必须再乘面积元并在全 BZ 累积。

## 3. 从 Berry phase 到 Chern 数的连续关系

对每一个固定 $k_y$，沿 $k_x$ 定义 $\gamma(k_y)$。只要这条回路上的能带不闭合，$\gamma$ 随 $k_y$ 连续变化，允许在 $2\pi$ 意义下展开。由 Stokes 定理，在没有规范奇点的局部区域内

$$
\frac{\partial\gamma}{\partial k_y}
=-\int_{-\pi}^{\pi}\Omega_{-,xy}(k_x,k_y)\,dk_x.
$$

因此当 $k_y$ 从 $-\pi$ 走到 $\pi$，Berry phase 的总绕行数与 Chern 数相关：

$$
C_-=-\frac{\gamma(\pi)-\gamma(-\pi)}{2\pi}
$$

这里需要选择连续的 phase branch，并处理 BZ 边界的规范拼接；直接把每个切片都压回 $[-\pi,\pi]$ 后相减，可能把一次真实的 $2\pi$ 绕行藏掉。这正是实验台同时画曲率、显示单切片 Berry phase、再给出整区间数值 Chern 的理由。

在默认 $m=-1$、$k_y=0$，一维回路包围的是一个有效质量为 $m+1=0$ 的平面 Dirac 结构，离散重叠乘积给出 $\pi$。这是一条很好的预测线索，却仍需结合二维积分才能回答整个系统的拓扑类别。

## 4. 边界、局域化与输运

把 $x$ 方向变成有限链后，$k_y$ 仍然是守恒量。边界态的波函数沿 $x$ 方向近似按 $\lambda^x$ 衰减；教学模型的 $|\lambda|=|m+\cos k_y|$ 说明边缘态存在需要 $|\lambda|<1$。当条件变成等号，定位长度发散，边缘态与 bulk 连续谱接合；超过等号，解不再是可归一化的边界态。

能量 $E=\pm\sin k_y$ 在 $k_y=0$ 和 $\pi$ 过零，但是否真的属于 edge branch 要先检查存在条件。对于 $m=-1$，$|{-1+\cos k_y}|<1$ 给出一段围绕 $k_y=0$ 的边界区间；对于 $m=1$，存在区间转移到靠近 $\pi$ 的位置。质量跨过 $m=0$ 时，边界支的动量位置和传播方向发生重排，同时 bulk 在 $X,Y$ 点关闭并重新打开。

真实边界可以加入势 $V_{\mathrm{edge}}$、改变 hopping 或破坏 $k_y$ 平移对称性。这样色散形状不必仍是正弦，局域化长度也会改变，但只要 bulk gap 和相关对称条件保持，跨 gap 的净手性不能被任意小扰动消去。相反，一对相反传播的普通边界态可以互相散射并开 gap；所以“看到一条局部峰”与“存在受 Chern 差保护的净手性支”是不同强度的证据。

量子反常霍尔响应的理想化关系是

$$
\sigma_{xy}=C_-\frac{e^2}{h},
$$

但材料实验还要处理费米能位置、体漏电、接触电阻、温度和磁畴。公式给出拓扑能带对输运的贡献，不会替实验自动解决样品是否真的处于绝缘 bulk。

## 5. 如何报告一次可信的拓扑计算

一份可复现报告至少应包含四层信息。第一，写出 Hamiltonian、坐标方向、下带还是上带以及 Berry curvature 的符号。第二，给出 bulk gap 的最小值与搜索方法，说明是否显式检查高对称点。第三，说明曲率积分的网格、收敛性和 gap 接近零时的数值不稳定。第四，把边界条件、边界势和有限尺寸写清楚，不要只贴一条未标注坐标的谱线。

例如本实验在 $m=-1$ 使用中点网格近似曲率积分，得到 $C_-=-0.9999999999999981$ 一类的浮点数；应报告为 $-1$，同时保留“数值近似”的说明。$m=2.6$ 得到约 $5.7\times10^{-13}$，可报告为 $0$。在 $m=0$，高对称点检查给出 $\Delta=2.45\times10^{-16}$，物理上按零处理；此时不应把有限网格的 Chern 输出当作绝缘相标签。

## 6. 三个数量级例子

**例 1（默认相）** 取 $m=-1$。$\Gamma$、$X/Y$、$M$ 的质量分别为 $1,-1,-3$，最小的 $|\mathbf d|$ 为 1，故 $\Delta=2$；下带积分为 $C_-=-1$。在 $k_y=0$，$m_{\mathrm{eff}}=0$，边缘能量为 0。

**例 2（穿过相变）** 从 $m=-0.4$ 调到 $m=+0.4$。在 $m=0$，$X$ 与 $Y$ 的质量同时为零；gap 先降到零，再重新打开。前后两个绝缘区的 Chern 数分别为 $-1$ 与 $+1$，差值 2 对应两个相关的 Dirac 接触点贡献。若只在 $m=-0.4$ 和 $+0.4$ 测量而跳过临界点，很容易错过拓扑改变必须经过 gap closure 这一机制。

**例 3（拓扑与切片）** 取 $m=1$。它在 $0<m<2$，所以 $C_-=+1$；但 $k_y=0$ 时 $m_{\mathrm{eff}}=2$，没有该切片的理想 edge。改看靠近 $k_y=\pi$ 的区间，$m+\cos k_y$ 才可能落入 $(-1,1)$。这一个例子足以拆掉“一个切片无 edge，所以 bulk 平庸”的错误推理。$\blacksquare$

---

*下一页：从拓扑能带的几何不变量继续走向真实材料中的对称性保护、无序与测量误差。*
