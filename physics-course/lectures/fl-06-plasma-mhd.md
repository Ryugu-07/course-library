# 等离子体 · 磁流体与聚变

> **对标**：Chen《Introduction to Plasma Physics》/ Freidberg《Ideal MHD》/ Kulsrud ｜ **前置**：[连续介质与守恒](fl-01-continuum.html)、[Maxwell 方程](em-02-maxwell.html)、[统计系综](sm-02-ensembles.html)
> 从日冕到聚变装置，带电粒子的集体响应会把流体运动与电磁场联在一起。本页依次问三个问题：何时能用经典等离子体近似？何时能进一步压缩成单流体 MHD？磁场的输运与耗散分别留下什么可检验的结果？磁冻结是其中一项有条件的约束。

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="可横向滚动的电子参数图" style="overflow-x:auto">
<img src="assets/img/fl-06-plasma-regimes.svg" alt="电子密度温度平面的理想Fermi温度与经典耦合曲线" style="width:100%;min-width:700px;max-width:none">
</div>
<figcaption><span class="fig-id">图 fl-06.1</span>坐标明确取电子密度与电子温度；蓝线为含相对论动能的理想电子 Fermi 温度，红虚线为经典电子耦合 Γₑ=1。曲线下方需改变近似，不能凭点在图中某个位置就宣布 MHD 成立。绿色点为 NRL 2023 第40页的代表量级，灰点为自设高密度示例。</figcaption>
</figure>

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="fl-06-learning-title">

<h2 id="fl-06-learning-title">学习层：先预测，磁场是被搬运还是被抹平？</h2>

### 1. 先过预测门：只给一个周期 Fourier 模态

本实验先不解一般三维 PDE，而是固定周期区间 \(0\le x<L\)、常数速度 \(U\) 和磁扩散率 \(\eta\)，从

$$
\partial_t B_y+U\partial_xB_y=\eta\partial_{xx}B_y,
\qquad B_y(x+L,t)=B_y(x,t)
$$

出发。初态取单一模态 \(B_y(x,0)=B_0\cos(q_nx+\phi)\)，其中 \(q_n=2\pi n/L\)。先不要打开实验台，预测四件可判决的事：

1. 理想冻结 \(\eta=0\) 时，模态的幅度会不会衰减？波峰向哪边移动？
2. 在同一个 \(\eta,t\) 下，把波数 \(n\) 加倍，幅度衰减率会变成几倍？
3. 纯扩散 \(U=0,\eta>0\) 时，图形还会不会平移？
4. 磁能量 \(E_B\) 的比值应当服从 \(e^{-\eta q_n^2t}\)，还是 \(e^{-2\eta q_n^2t}\)？

### 2. 固定模型：用 Fourier 模态的解析推进

实验台只推进这一模态的闭式解

$$
B_y(x,t)=B_0e^{-\eta q_n^2t}
\cos\!\left[q_n(x-Ut)+\phi\right],
\qquad
\mathrm{Rm}=\frac{|U|L}{\eta},
$$

这里 \(\eta\) 是下文的磁扩散率 \(\eta_m\)，单位为长度平方/时间，不是电阻率 \(\eta_\Omega\)。实验用参考长度 \(\ell_*\)、时间 \(t_*\)、磁场 \(B_*\) 无量纲化：\(U=U_{\rm phys}t_*/\ell_*\)、\(\eta=\eta_{m,\rm phys}t_*/\ell_*^2\)，能量密度单位为 \(B_*^2/\mu_{0,\rm phys}\)。界面固定 \(L=B_0=\mu_0=1\) 是这个归一化约定，不能把 \(\mu_0=1\) 当作 SI 真空常数。并把 \(\eta=0\) 解释为理想极限（\(\mathrm{Rm}=\infty\)，若 \(U\ne0\)）。两个宏观时间尺度是

$$
\tau_{\rm adv}=\frac{L}{|U|},
\qquad
\tau_{\rm diff}=\frac{L^2}{\eta},
\qquad
\tau_{\rm diff,n}=\frac{1}{\eta q_n^2}.
$$

这里的数值推进不是手写显式 PDE 时间步，而是直接乘上每个 Fourier 模态的相位因子与衰减因子，没有 PDE 时间离散的 CFL 稳定性限制，但指数、相位和求积仍有浮点误差；过小的非零振幅也可能下溢为 0。

<div class="learning-lab" data-learning-lab="resistive-mhd" markdown="1">

**无 JavaScript 时的静态读法：**对一个模态，振幅因子是 \(A(t)/A(0)=e^{-\eta q_n^2t}\)，磁能量密度在一个周期上的平均值取

$$
E_B(t)=\frac{1}{2\mu_0L}\int_0^L B_y^2\,dx
=E_B(0)e^{-2\eta q_n^2t},
$$

并满足周期边界下的能量账本

$$
\frac{dE_B}{dt}
=-\frac{\eta}{\mu_0L}\int_0^L(\partial_xB_y)^2\,dx
=-2\eta q_n^2E_B.
$$

| 情形 | 选择 | 解析检查 |
|---|---|---|
| 理想冻结 | \(\eta=0,\ U>0\) | 振幅与磁能量不变，只发生平移 |
| 有限电阻 | \(\eta>0,\ U>0\) | 平移与扩散同时发生，\(\mathrm{Rm}\) 有限 |
| 纯扩散 | \(U=0,\ \eta>0\) | 没有平移，振幅与磁能量按指数衰减 |
| 高波数 | \(n\) 较大 | 振幅衰减率 \(\eta q_n^2\) 按 \(n^2\) 增大，能量衰减率再多一个因子 2 |

实验台解锁后，先选预设，再改变 \(U,\eta,n,t\)，最后用固定的 \(0,t/4,t/2,3t/4,t\) 账本核对解析式。速度也可为负，观察波峰向左移动。能量图用明示的 log(1+g t) 横坐标（g=2ηq²）同时展示快速初期衰减与较晚时刻；η=0 时退回线性时间轴。

**预测门答案：**\(\eta=0\) 只平移不衰减；\(n\) 加倍使振幅衰减率变为 4 倍；\(U=0\) 时只有扩散没有平移；磁能量比值是 \(e^{-2\eta q_n^2t}\)。

</div>

### 3. 适用域与不能推出的结论

这是**一维、周期、常系数、给定速度场、单模态**的感应方程模型。它可以把平流时间尺度、磁扩散时间尺度和单模态磁能量账本放在同一张图上；它不能模拟磁重联、Hall/动理学尺度、激波、聚变约束或一般三维发电机，也不能把一维磁能衰减直接当成完整等离子体的总能量演化。完整 MHD 中速度会受磁场反馈，电阻耗散还要与内能和状态方程一起记账。

### 4. 解析能量式为何成立，数值账本又检查什么？

把感应方程乘以 \(B_y/(\mu_0L)\) 后积分。平流项是 \(-U[B_y^2]_0^L/(2\mu_0L)=0\)；扩散项分部积分，边界项因周期性也为零，留下负的梯度平方。对整数 \(n\ge1\)，\(\int_0^L\cos^2(q_nx+\phi)dx=L/2\)，于是

$$
E_B(0)=\frac{B_0^2}{4\mu_0},\qquad
Q(t)=E_B(0)\bigl(1-e^{-2\eta q_n^2t}\bigr).
$$

这才是解析守恒关系的理由。交互账本另用四阶中心差分估计 \(\partial_xB_y(x,0)\)，周期中点求积得到初始 Joule 功率，再对它的指数时间因子作自适应 Simpson 积分。时间变量换成 \(u=2\eta q_n^2t\)，积分上限大于 40 时省略尾部并保留 \(e^{-40}\) 量级的界。表中“差额/E₀”比较稳定计算的解析损失与这次数值积分，**不是把同一个解析式复制两遍，也不是严谨误差证书**。

当 \(2\eta q_n^2t\) 极小时，直接算 \(1-e^{-z}\) 会相消；使用 \(-\operatorname{expm1}(-z)\) 能保留小的耗散量。空间点数随模态增加，避免把高波数误采样成低波数。

</section>

## 1. 先选尺度，再选等离子体近似

等离子体包含可集体响应电磁场的自由电荷；下面是**经典、弱耦合、近准中性体区**的常用检查，不是排除所有强耦合、简并或碰撞性等离子体的定义。

**屏蔽长度。** 对温度 \(T_e\) 的经典电子、静止均匀离子背景，Boltzmann 响应 \(n_e\simeq n_0(1+e\varphi/k_BT_e)\) 代入 Poisson 方程，得到点电荷外的

$$
(\nabla^2-\lambda_{De}^{-2})\varphi=0,\qquad
\lambda_{De}=\sqrt{\frac{\varepsilon_0k_BT_e}{n_e e^2}},\qquad
\varphi(r)\propto\frac{e^{-r/\lambda_{De}}}{r}.
$$

线性化要求 \(|e\varphi|\ll k_BT_e\)，屏蔽是指数衰减，不是在某个半径突然归零。若多个经典物种都参与静态响应，则 \(\lambda_D^{-2}=\sum_s n_s q_s^2/(\varepsilon_0k_BT_s)\)。在远离鞘层的 \(L\gg\lambda_D\) 尺度上，准中性近似常有用；鞘层恰恰不能用同一近似抹去电荷分离。

**屏蔽球内的粒子数。** 电子口径取

$$
N_{De}=\frac{4\pi}{3}n_e\lambda_{De}^3\gg1.
$$

有些教材把 \(n_e\lambda_{De}^3\) 称为等离子体参数，差的是几何因子。用平均间距 \(a_e=[3/(4\pi n_e)]^{1/3}\) 和经典耦合参数 \(\Gamma_e=e^2/(4\pi\varepsilon_0a_ek_BT_e)\)，可核对 \(N_{De}=(3\Gamma_e)^{-3/2}\)。电子简并或离子强耦合时，需分别换用量子响应与相应物种的耦合尺度。

**响应时间。** 电子位移造成恢复电场，得到 \(\omega_{pe}=\sqrt{n_ee^2/(\varepsilon_0m_e)}\)。若研究清晰的集体振荡，要比较碰撞频率 \(\nu\) 与 \(\omega_{pe}\)；\(\nu\ll\omega_{pe}\) 是弱阻尼条件，并不意味着碰撞较强的电离气体就一概“不算等离子体”。

**低于等离子体频率都不能传播吗？** 在均匀、冷、无背景磁场、无碰撞、忽略离子高频响应的模型中，横向电磁波满足

$$
\omega^2=\omega_{pe}^2+c^2k^2.
$$

因此 \(\omega<\omega_{pe}\) 时该分支的 \(k\) 为虚数，是倏逝场；等号处 \(k=0\)，并无有限群速度传播。磁化等离子体还有低频分支，不能把这条截止结论推广到全部波。电离层无线电还涉及密度分层、地磁场、入射角与吸收。[Fitzpatrick 的冷无磁波推导](https://farside.ph.utexas.edu/teaching/plasma/lectures1/node72.html) 给出了这一限定模型。

### 1.1 参数图中的两条边界

横轴固定为电子密度 \(n_e\,[\mathrm{m^{-3}}]\)，纵轴为电子温度 \(T_e\,[\mathrm K]\)。对于理想、自旋二重简并的电子气，\(p_F=\hbar(3\pi^2n_e)^{1/3}\)，图中的退化温度采用含相对论动能的

$$
k_BT_F=\sqrt{m_e^2c^4+p_F^2c^2}-m_ec^2.
$$

非相对论极限为 \(T_F\simeq4.2315\times10^{-15}[n_e/(\mathrm{m^{-3}})]^{2/3}\,\mathrm K\)。经典 \(\Gamma_e=1\) 线则是 \(T_\Gamma\simeq2.6937\times10^{-5}[n_e/(\mathrm{m^{-3}})]^{1/3}\,\mathrm K\)。在 \(T_e\ll T_F\) 区域，经典 \(\Gamma_e\) 线只作形式参照，不能替代量子多体判据；离子耦合也必须另算。关于 Fermi 动量及相对论极限，可回看 [Tong 的量子气体讲义](https://www.damtp.cam.ac.uk/user/tong/statphys/statmechhtml/S3.html)。

## 2. 回旋、磁镜与漂移：三个不同近似

在非相对论均匀磁场中，有符号回旋频率 \(\Omega_s=q_sB/m_s\) 指示旋转方向；半径必须非负：\(\rho_{Ls}=v_\perp/|\Omega_s|\)。当场的空间变化尺度远大于回旋半径、变化频率远小于回旋频率，且碰撞与共振扰动可忽略时，磁矩

$$
\mu_s=\frac{m_sv_\perp^2}{2B}
$$

近似守恒。在静磁场且无电势变化时，动能也守恒，故从 \(B_0\)、投掷角 \(\alpha_0\) 出发，有 \(v_\parallel^2=v^2[1-(B/B_0)\sin^2\alpha_0]\)。若沿途达到 \(B/B_0=1/\sin^2\alpha_0\)，就发生磁镜反射；若最大磁场仍不够大，粒子从损失锥逃逸。地球辐射带的俘获可用这种几何理解，但粒子来源、波粒散射、漂移和损失还需额外物理。

在缓变、低频的导引中心近似下，\(\mathbf v_E=\mathbf E\times\mathbf B/B^2\) 不依赖电荷符号。若物种共同作同一漂移，其对流电流是 \(\sum_s n_sq_s\mathbf v_E=\rho_q\mathbf v_E\)，准中性时领先阶相消；这不排除极化、梯度/曲率漂移或边界电流。不能从“电荷无关”直接推出整个系统没有电流。

## 3. 磁流体（MHD）方程

### 3.1 完整的最简闭合系统

把等离子体当作单一导电流体，需要另查尺度：非相对论、低频长波、近准中性，离子惯性长度与回旋尺度相对宏观尺度足够小，且所选标量压强与电阻率闭合合理。各向异性、Hall 项与电子压强张量显著时，下面的最简模型不足。联立流体守恒与 Maxwell，略去位移电流。在无外力、黏性和热传导的最简电阻 MHD 中，质量、动量、感应、磁场约束和总能量方程可写成

$$
\partial_t\rho+\nabla\cdot(\rho\mathbf u)=0,
$$

$$
\rho\left(\partial_t\mathbf u+\mathbf u\cdot\nabla\mathbf u\right)
=-\nabla p+\mathbf J\times\mathbf B,
\qquad
\mathbf J=\frac{1}{\mu_0}\nabla\times\mathbf B,
$$

$$
\partial_t\mathbf B
=\nabla\times(\mathbf u\times\mathbf B)
-\nabla\times\left(\eta_m\nabla\times\mathbf B\right),
\qquad
\boxed{\nabla\cdot\mathbf B=0}.
$$

欧姆定律是 \(\mathbf E+\mathbf u\times\mathbf B=\eta_\Omega\mathbf J\)，其中 \(\eta_\Omega=1/\sigma=\mu_0\eta_m\)。当 \(\eta_m\) 为常数且满足 \(\nabla\cdot\mathbf B=0\) 时，感应方程化为

$$
\boxed{\ \partial_t\mathbf B
=\nabla\times(\mathbf u\times\mathbf B)+\eta_m\nabla^2\mathbf B\ },
\qquad \eta_m=\frac{1}{\mu_0\sigma}.
$$

总能量与状态方程闭合为

$$
\mathcal E=\frac{p}{\gamma-1}+\frac{1}{2}\rho u^2+\frac{B^2}{2\mu_0},
\qquad
p=(\gamma-1)\left(\mathcal E-\frac{1}{2}\rho u^2-\frac{B^2}{2\mu_0}\right),
$$

$$
\partial_t\mathcal E+\nabla\cdot\left[
\left(\mathcal E+p+\frac{B^2}{2\mu_0}\right)\mathbf u
-\frac{(\mathbf u\cdot\mathbf B)\mathbf B}{\mu_0}
+\frac{\eta_m}{\mu_0}(\nabla\times\mathbf B)\times\mathbf B
\right]=0,
\qquad \gamma>1.
$$

最后一式取的是无外力、无黏性/热传导的总能量守恒形式；电阻造成的 Joule 加热在总能量中与磁能损失相抵。若恢复黏性、热传导或外力，必须把相应的应力、热流和功率项一起加入，不能只给动量方程添一项而仍称系统闭合。

本页实验只抽取上面**感应方程**的一维分量：令 \(\mathbf u=U\hat{\mathbf x}\)、\(\mathbf B=B_y(x,t)\hat{\mathbf y}\)，并把 \(U\) 当作不受磁场反馈的给定常数，就得到学习层中的 advection–diffusion toy。由于 \(B_y\) 不依赖 \(y\)，此 ansatz 自动满足 \(\nabla\cdot\mathbf B=0\)；它没有求解质量、动量和总能量方程。

**磁雷诺数** $\mathrm{Rm}=|U|L/\eta_m$ 度量给定长度尺度上平流与磁扩散的相对强弱。若 $U=\eta_m=0$，这个比值是 $0/0$，不定义；若 $U\ne0,\eta_m=0$，才写作理想极限 $\mathrm{Rm}=\infty$。天体大尺度上的 $\mathrm{Rm}$ 往往很大，但薄电流片的局部长度尺度更小，局部扩散仍可能重要。

### 3.2 磁通冻结：守恒的是哪个曲面的通量？

取随流体运动的**闭合回路** \(C(t)\)，以及以它为边界的定向曲面 \(S(t)\)。曲面通常是开曲面；任意闭合曲面的磁通本来就因 \(\nabla\cdot\mathbf B=0\) 而为零，不能用它表达非平凡的冻结约束。移动回路的感应定律给出

$$
\frac{d}{dt}\int_{S(t)}\mathbf B\cdot d\mathbf S
=-\oint_{C(t)}(\mathbf E+\mathbf u\times\mathbf B)\cdot d\boldsymbol\ell.
$$

在足够光滑、速度流映射存在且理想欧姆定律成立时，右侧为零。有限电阻时则为 \(-\oint\eta_\Omega\mathbf J\cdot d\boldsymbol\ell\)，不必为零。这把“搬运曲面”与“场本身的变化”一起计算了，不能只用固定曲面的 Faraday 定律遗漏运动项。[Fitzpatrick 的磁通冻结推导](https://farside.ph.utexas.edu/teaching/plasma/lectures1/node106.html) 展示这两项如何合并。

还可把理想感应与连续性方程合成局部形式：

$$
\frac{D\mathbf B}{Dt}=(\mathbf B\cdot\nabla)\mathbf u-\mathbf B\nabla\cdot\mathbf u,
\qquad
\frac{D}{Dt}\left(\frac{\mathbf B}{\rho}\right)
=\left(\frac{\mathbf B}{\rho}\cdot\nabla\right)\mathbf u.
$$

右侧和物质线元的伸长方程相同，这是“场线随流体”比喻背后的几何机制。场线不是有编号的实体细线；大尺度 \(\mathrm{Rm}\gg1\) 也不排除薄电流片、奇异极限或动理学效应破坏所需近似。

这条约束连接了许多宏观现象：

- 流体运动**拉伸、缠绕、放大**磁场 → **发电机机制**（地磁场、太阳磁场的起源）；
- 磁场反过来通过 $\mathbf J\times\mathbf B$ 约束流体 → **磁约束聚变**的基本思想；
- 跨磁场运动受到强约束，而沿场运动仍可发生 → 许多日冕结构会沿磁场方向组织；“贴在线上”只是理想 MHD 的几何比喻。

**磁压与磁张力**：$\mathbf J\times\mathbf B = -\nabla\left(\dfrac{B^2}{2\mu_0}\right)+\dfrac{(\mathbf B\cdot\nabla)\mathbf B}{\mu_0}$——**磁场像有压强与沿线张力的弹性介质**。由此得 **Alfvén 波**（磁力线的横波）：

$$v_A = \frac{B}{\sqrt{\mu_0\rho}}$$

对均匀平衡 \(\mathbf B_0=B_0\hat z\)、\(\rho_0\)，取只随 \(z\) 变化的横向小扰动，可直接线性化：

$$
\rho_0\partial_t\mathbf u_\perp=\frac{B_0}{\mu_0}\partial_z\mathbf b_\perp,
\qquad
\partial_t\mathbf b_\perp=B_0\partial_z\mathbf u_\perp.
$$

再对时间求导即得 \(\partial_{tt}\mathbf u_\perp=v_A^2\partial_{zz}\mathbf u_\perp\)，因此这里的 Alfvén 波是沿背景磁场传播的横向扰动。它不是本页“预先给定 U”的平流扩散实验：后者没有同时求解这两个反馈方程。

**等离子体 $\beta = p/(B^2/2\mu_0)$** 判断谁主导：$\beta\ll1$ 磁场主导（日冕），$\beta\gg1$ 流体主导（恒星内部）。

## 4. 磁重联：冻结定理的破缺

在上述光滑理想条件内，场线连通关系被保持。解释观测中的重联时，需要明确是哪一项非理想机制允许连通关系改变；不能仅凭某次能量释放就断言其全部拓扑演化。

**磁重联**：在薄电流片中，非理想电场、有限电阻、Hall 或动理学效应使理想冻结条件失效；场线连通关系改变，磁能可转为动能、热能和粒子非热能量。

在不可压、稳态、二维、均匀电阻的 Sweet–Parker 薄层模型中，设电流片长 \(L\)、厚 \(\delta\)，出流速度约为 \(v_A\)。质量守恒给 \(v_{\rm in}L\sim v_A\delta\)，电阻与平流电场匹配给 \(v_{\rm in}\sim\eta_m/\delta\)。所以

$$
\frac{v_{\rm in}}{v_A}\sim\frac{\delta}{L}\sim S^{-1/2},\qquad S=\frac{Lv_A}{\eta_m}.
$$

这里用 **Lundquist 数 S**，速度基准是 \(v_A\)，不是任意给定 \(U\) 下的 Rm。高 \(S\) 电流片可能产生磁岛链失稳；无碰撞/Hall 效应与全局边界也会改变速率。因而 \(S^{-1/2}\) 是这个层流模型的标度，而非所有重联的定律。进一步可读 [Fitzpatrick 的快速重联讨论](https://farside.ph.utexas.edu/teaching/plasma/Plasma/node101.html)。

**重联是空间与聚变等离子体中的核心过程之一**：它参与太阳耀斑、日冕物质抛射、地磁亚暴和托卡马克锯齿崩塌，但每类事件还受全局驱动、边界条件、湍流与粒子动力学共同控制。

## 5. 聚变约束

**Lawson 判据先是一份功率账本。** 设均匀、完全电离、等比例 D–T 燃料，\(n_D=n_T=n_e/2=n/2\)，离子和电子同温，记热能单位的温度 \(\Theta=k_BT\)。忽略杂质、氦灰和辐射损失，并假设 α 粒子的 \(E_\alpha=3.5\,\mathrm{MeV}\) 全部沉积，点火的简化条件是

$$
P_\alpha=\frac{n^2}{4}\langle\sigma v\rangle E_\alpha
\ge \frac{3n\Theta}{\tau_E},\qquad
n\Theta\tau_E\ge\frac{12\Theta^2}{\langle\sigma v\rangle E_\alpha}.
$$

这里 \(\tau_E\) 是热能与所定义能量损失功率之比。\(\Theta\)、\(E_\alpha\) 必须用相同能量单位；反应率强烈依赖温度，所以右侧不是恒定门槛。NRL 表在 \(\Theta=10\,\mathrm{keV}\) 给 \(\langle\sigma v\rangle\simeq1.1\times10^{-16}\,\mathrm{cm^3/s}=1.1\times10^{-22}\,\mathrm{m^3/s}\)，代入得约 \(3.12\times10^{21}\,\mathrm{keV\,s\,m^{-3}}\)。常见的“\(3\times10^{21}\)”应这样理解为给定 D–T 条件附近的量级，而非任意温度、燃料或工程装置的充分条件。

若用 \(\tau_E\) 只记录输运损失，还要另加辐射项；若它已包含全部损失，就不能重复计入。等离子体点火也不等于装置净发电，还需核对加热、驱动、转换和辅助系统的能量账本。[NRL 2023 手册第 44–45 页](https://www.nrl.navy.mil/Portals/38/PDF%20Files/NRL_Plasma_Formulary_2023.pdf) 提供反应能量与 Maxwell 分布平均反应率。

**两条路线**：

- **磁约束（托卡马克）**：$\beta$ 低、$\tau_E$ 长（秒级）、$n$ 低。核心难题是**输运反常**（远大于经典预言，由微观湍流驱动）与**不稳定性**（撕裂模、边界局域模）；
- **惯性约束**：$n$ 极高、$\tau_E$ 极短（纳秒）。核心难题是**压缩对称性与 Rayleigh–Taylor 不稳定性**（fl-04）。

**共同的物理障碍是不稳定性与湍流输运**——**这正是本线前几页内容在聚变工程中的汇合点**。

## 6. 可复算量级与迁移题

设一团纯氢等离子体 \(n_e=n_p=10^{15}\,\mathrm{m^{-3}}\)、\(T_e=10^6\,\mathrm K\)、\(B=10\,\mathrm G=10^{-3}\,\mathrm T\)。电子屏蔽近似给 \(\lambda_{De}\approx2.18\,\mathrm{mm}\)、\(N_{De}\approx4.35\times10^7\)，\(\omega_{pe}\approx1.78\times10^9\,\mathrm{rad/s}\)。取 \(\rho\simeq m_p n_p\)，则 \(v_A\approx6.90\times10^5\,\mathrm{m/s}=690\,\mathrm{km/s}\)。这说明磁扰动可以很快传播；实际事件时标还要给出路径长度、背景结构和模型有效性，不能仅凭一个速度证明耀斑机制。

1. 固定 \(L=1,U=0.6,\eta=0.025,t=1.2\)。把 \(n=1\) 改成 2，振幅比和能量比各怎样变？为什么全局 Rm 没变，短尺度扩散却强得多？
2. 用 \(\mathbf u=(ax,-ay,0)\)、初始均匀 \(\mathbf B=(B_0,0,0)\) 检查理想冻结：场强会不会保持不变？选一个法向沿 x 的物质小面，核对通量。
3. 在上面的 D–T 简化例中，若 \(n=10^{20}\,\mathrm{m^{-3}}\)，需要多大的 \(\tau_E\)？如果只有一半 α 能量沉积且其他条件不变，阈值怎样变？再说明为什么这个算例不能宣布某个装置已净发电。

<details class="answer" markdown="1">
<summary>展开三题的计算与边界</summary>

**1.** \(z=\eta(2\pi)^2t\approx1.18435\)，故 \(A_1/A_0=e^{-z}\approx0.30594\)，\(E_1/E_0=e^{-2z}\approx0.09360\)。波数加倍使 \(z\to4z\)，振幅比约 \(0.00876\)、能量比约 \(7.68\times10^{-5}\)。全局 \(\mathrm{Rm}=0.6/0.025=24\) 不变；但在模态长度 \(1/q_n\) 上，平流项与扩散项之比为 \(|U|/(\eta q_n)\)，随 n 增大而减小。不能把“Rm大”直接翻译成所有尺度都冻结。

**2.** \(\nabla\cdot\mathbf u=0\)，所以理想感应给 \(B_x(t)=B_0e^{at}\)。物质面的 y 边长乘 \(e^{-at}\)、z 边长不变，面积缩小同样倍数；\(B_xS_x\) 保持不变。冻结守恒的是随动通量，场强可以因拉伸而增长。这里把速度当作给定场；若要讨论从哪取得磁能，还必须联立动量与能量方程。

**3.** \(n\Theta\tau_E\ge3.12\times10^{21}\) 给 \(\tau_E\gtrsim3.12\,\mathrm s\)。沉积能量减半使右侧加倍，即约 \(6.23\,\mathrm s\)。这只是同温、均匀、纯燃料且省略额外损失的等离子体功率条件；它没有计算装置耗电、能量转换及连续运行。

</details>

---

*流体线从连续介质、边界层、湍流、失稳与混沌走到等离子体。下一页：[辐射转移](ap-01-radiative.html)，把能量如何穿过介质的问题接到天体物理。*
