# 连续介质 I · 弹性波：纵横模式、阻抗与界面反射

> **对标**：Achenbach *Wave Propagation in Elastic Solids* ch.1–2 / Landau《弹性理论》§7 ｜ **前置**：fl-01（连续介质守恒）、solid-01（晶格与声子）、qm-02（波包）
> 固体不是“不会流动的空气”：受到扰动时，局部形变会通过应力把信息传给邻近区域。弹性波的速度由“恢复力有多硬”和“惯性有多大”共同决定；遇到材料界面时，波的振幅、相位和能量又由波阻抗共同约束。本页把纵波、剪切横波与界面反射放进同一份账本。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="elastic-wave-learning-title">

## 学习层：同一界面上，振幅为什么会反相而能量仍为正？

<h3 id="elastic-wave-learning-title">1. 具体谜题：超声波进入另一种材料后发生什么？</h3>

医学超声、地震波和金属探伤都要回答同一个问题：一列波从材料 1 进入材料 2，多少能量被反射，多少继续前进？先取一个法向入射的简化界面：铝在左，钢在右；频率 $f=1.00\ \mathrm{MHz}$。我们会在后面算出铝的纵波速度约 $6.402\ \mathrm{km/s}$，钢中约 $5.818\ \mathrm{km/s}$。

打开实验台以前，先预测：

1. 若材料的弹性模量相同而密度变大，波速会变快、变慢，还是不变？
2. 波从低阻抗材料进入高阻抗材料时，位移反射波是否反相？
3. 无耗散界面上，必须相加为 $1$ 的是振幅系数，还是能量系数？

“波很硬所以反射多”还不是计算。需要先从本构关系得到波速，再用位移与应力的边界条件得到阻抗匹配。

<h3>2. 最小模型：从应变到两种波速</h3>

位移场记作 $\mathbf u(\mathbf x,t)$，小应变张量为

$$
\varepsilon_{ij}=\frac12(\partial_i u_j+\partial_j u_i).
$$

各向同性线性材料的 Hooke 定律是

$$
\sigma_{ij}=\lambda_{\mathrm L}\delta_{ij}\,\nabla\cdot\mathbf u+2G\varepsilon_{ij},
$$

其中 $G$ 是剪切模量，$\lambda_{\mathrm L}$ 是 Lamé 第一参数。动量守恒
$\rho\,\partial_t^2u_i=\partial_j\sigma_{ij}$ 给出 Navier 方程：

$$
\rho\,\ddot{\mathbf u}
=(\lambda_{\mathrm L}+G)\nabla(\nabla\cdot\mathbf u)+G\nabla^2\mathbf u.
$$

把位移分解成无旋的纵向部分与无散的横向部分：

$$
\mathbf u=\mathbf u_{\mathrm L}+\mathbf u_{\mathrm T},\qquad
\nabla\times\mathbf u_{\mathrm L}=0,\qquad
\nabla\cdot\mathbf u_{\mathrm T}=0.
$$

两类部分各自满足波动方程。用体积模量
$K=\lambda_{\mathrm L}+2G/3$ 表示，速度是

$$
c_{\mathrm L}=\sqrt{\frac{K+4G/3}{\rho}},
\qquad
c_{\mathrm T}=\sqrt{\frac{G}{\rho}}.
$$

纵波的位移方向平行于传播方向，横波的位移方向垂直于传播方向。这里的横波是法向入射的 SH 剪切模式；斜入射时会出现 P-SV 模式转换，不能把一个标量反射系数直接搬过去。

<h3>3. 动手实验：模式、材料和界面一次只改一个</h3>

先完成三个预测，再打开实验台。预设包括铝到钢、反向传播、铝的剪切横波以及软材料界面。改变模式或材料后，波形图会同步改变速度与波长；能量柱显示反射率 $R$ 和透射率 $T$，因此可以检查“位移反相”与“能量守恒”不是同一个符号。

<div class="learning-lab" data-learning-lab="physics-elastic-wave" markdown="1">

**无 JavaScript 时的静态读法：**模型是各向同性、线性、无耗散材料的法向入射标量波。默认值为铝 $\to$ 钢、纵波、$f=1.00\ \mathrm{MHz}$。使用材料参数
$\rho_{\mathrm{Al}}=2700\ \mathrm{kg/m^3}$、$K_{\mathrm{Al}}=76\ \mathrm{GPa}$、$G_{\mathrm{Al}}=26\ \mathrm{GPa}$，
$\rho_{\mathrm{steel}}=7850\ \mathrm{kg/m^3}$、$K_{\mathrm{steel}}=160\ \mathrm{GPa}$、$G_{\mathrm{steel}}=79.3\ \mathrm{GPa}$。

| 量 | 铝（介质 1） | 钢（介质 2） |
|---|---:|---:|
| 纵波速 $c_{\mathrm L}$ | $6.402\ \mathrm{km/s}$ | $5.818\ \mathrm{km/s}$ |
| $1\ \mathrm{MHz}$ 波长 $\lambda=c/f$ | $6.402\ \mathrm{mm}$ | $5.818\ \mathrm{mm}$ |
| 纵波阻抗 $Z=\rho c$ | $17.286\ \mathrm{MRayl}$ | $45.673\ \mathrm{MRayl}$ |

把位移（或速度）振幅的反射、透射系数定义为

$$
r_u=\frac{Z_1-Z_2}{Z_1+Z_2}=-0.451,\qquad
t_u=\frac{2Z_1}{Z_1+Z_2}=0.549.
$$

所以默认界面有

| 能量项 | 数值 | 检查 |
|---|---:|---|
| 反射率 $R=\lvert r_u\rvert^2$ | $0.203$ | 约 $20.3\%$ |
| 透射率 $T=4Z_1Z_2/(Z_1+Z_2)^2$ | $0.797$ | 约 $79.7\%$ |
| $R+T$ | $1.000$ | 无耗散界面 |

负的 $r_u$ 表示铝侧的反射位移反相，不表示负能量。若换成钢 $\to$ 铝，$r_u$ 会变成正值，而 $R$ 与 $T$ 保持相同的交换对称结构。

<h3>4. 误区、反例与适用边界</h3>

- **速度不是只由密度决定。**$c$ 同时含模量与密度；软而轻的聚合物和硬而重的钢不能用“密度越大越慢”单独判断。
- **负振幅不是负功率。**能量流与阻抗、速度振幅的平方有关；反相说明波形翻转。
- **$R+T=1$ 需要无耗散和正确的能量归一化。**有黏弹性、吸收、粗糙界面或模式转换时，反射与透射之外还要记吸收和其他模式。
- **这是法向入射的标量界面。**斜入射的固体界面一般会发生纵横波转换，边界条件是位移与牵引力的向量连续，不能只保留一个 $Z$。
- **连续介质会失效。**当波长接近晶格常数，原子离散性带来色散和带隙；材料非线性显著时，波形会产生谐波甚至冲击。

<h3>5. 迁移题：把模式切换也纳入预测</h3>

保持铝 $\to$ 钢与 $f=1\ \mathrm{MHz}$，切换到剪切横波。铝的
$c_{\mathrm T}=\sqrt{G/\rho}\approx3.103\ \mathrm{km/s}$，因此波长约 $3.103\ \mathrm{mm}$；钢侧的剪切阻抗与纵波阻抗不同，反射相位和比例都要重新计算。先在纸上写出

$$
Z_{\mathrm T}=\rho c_{\mathrm T},\qquad
r_u=\frac{Z_1-Z_2}{Z_1+Z_2},\qquad
R=|r_u|^2.
$$

再用实验台核对。最后回答：如果只看到“钢更硬”，为什么仍不能直接猜出横波反射率？你必须指出速度公式里的 $G$ 和界面条件里的 $Z$ 分别承担了什么角色。

</div>

</section>

## 1. 小形变的几何与本构

连续介质近似把材料中足够大的局部区域视为平滑位移场。位移 $\mathbf u$ 的梯度描述邻近点相对移动；其对称部分是应变，反对称部分是刚体小转动。线性弹性只保留一阶应变，因而

$$
\varepsilon_{ij}=\frac12(\partial_i u_j+\partial_j u_i).
$$

应力 $\boldsymbol\sigma$ 是单位面积上的内力，线性各向同性本构写成

$$
\boldsymbol\sigma
=\lambda_{\mathrm L}(\nabla\cdot\mathbf u)\mathbf I+2G\boldsymbol\varepsilon.
$$

体积模量 $K$ 与 Lamé 参数的关系是
$K=\lambda_{\mathrm L}+2G/3$。正定的弹性能要求合适的模量约束；物理材料的压缩与剪切变形都要付出能量。

没有体力时，动量守恒是

$$
\rho\ddot{\mathbf u}=\nabla\cdot\boldsymbol\sigma.
$$

把本构代入，并利用 $\nabla\cdot\boldsymbol\varepsilon
=\frac12[\nabla(\nabla\cdot\mathbf u)+\nabla^2\mathbf u]$，得到

$$
\rho\ddot{\mathbf u}
=(\lambda_{\mathrm L}+G)\nabla(\nabla\cdot\mathbf u)+G\nabla^2\mathbf u.
$$

这里没有凭空假设“波速”；波速正是本构的恢复力系数除以质量密度后开平方的结果。

## 2. Helmholtz 分解与 P、S 波

对平面波 $\mathbf u=\mathbf u_0e^{i(\mathbf k\cdot\mathbf x-\omega t)}$，把振幅分成与 $\mathbf k$ 平行和垂直的部分。纵向部分满足
$\mathbf k\times\mathbf u_{\mathrm L}=0$，横向部分满足
$\mathbf k\cdot\mathbf u_{\mathrm T}=0$。代回 Navier 方程：

$$
\omega_{\mathrm L}^2=c_{\mathrm L}^2k^2,\qquad
\omega_{\mathrm T}^2=c_{\mathrm T}^2k^2,
$$

其中

$$
c_{\mathrm L}^2=\frac{\lambda_{\mathrm L}+2G}{\rho}
=\frac{K+4G/3}{\rho},
\qquad
c_{\mathrm T}^2=\frac{G}{\rho}.
$$

由于同一稳定材料满足 $\lambda_{\mathrm L}+G>0$，通常 $c_{\mathrm L}>c_{\mathrm T}$。纵波压缩/膨胀改变密度，地震学常称 P 波；剪切横波不改变一阶体积，常称 S 波。液体在静态剪切模量近似为零，所以不能支持同样的体积内横波，这个差异正是地震波探测地球内部的线索之一。

无耗散均匀介质的色散关系是线性的 $\omega=ck$，因此相速和群速都等于 $c$。这只是长波连续模型的结论；晶格离散性、黏弹性和频率依赖本构都会让 $\omega(k)$ 弯曲。

## 3. 能量流与波阻抗

弹性波的瞬时功率流可以写成应力对速度的作用：

$$
P_i=-\sigma_{ij}\dot u_j.
$$

负号取决于牵引力和外法线的约定，但能量守恒的结构不变：应力做功把能量从一层材料传给下一层。对一维简谐波，位移振幅 $U$、速度振幅 $\omega U$ 与应力振幅相乘，平均强度满足

$$
\langle I\rangle\propto Z\,|\dot U|^2,\qquad Z=\rho c.
$$

$Z$ 的单位为 $\mathrm{kg/(m^2s)}$，常称 MRayl。它衡量介质对运动的“惯性负担”；两种材料的 $c$ 可能接近，但若 $\rho$ 差异大，阻抗仍会明显不匹配。

## 4. 界面条件如何推出反射系数

设界面在 $x=0$，左侧入射波、反射波，右侧透射波。法向入射且没有界面质量时，界面处的位移连续：

$$
U_i+U_r=U_t.
$$

牵引应力连续；对向右传播和向左传播的平面波，速度方向与应力方向在反射波上相反，因此

$$
Z_1(U_i-U_r)=Z_2U_t
$$

（共同的 $-i\omega$ 因子已约去）。联立两式：

$$
\frac{U_r}{U_i}=\frac{Z_1-Z_2}{Z_1+Z_2},
\qquad
\frac{U_t}{U_i}=\frac{2Z_1}{Z_1+Z_2}.
$$

强度不是简单的振幅平方，因为左右介质的阻抗不同。用 $\langle I\rangle\propto Z|\dot U|^2$：

$$
R=\left|\frac{U_r}{U_i}\right|^2,\qquad
T=\frac{Z_2}{Z_1}\left|\frac{U_t}{U_i}\right|^2
=\frac{4Z_1Z_2}{(Z_1+Z_2)^2},
$$

于是 $R+T=1$。阻抗匹配 $Z_1=Z_2$ 时 $r_u=0$；完全反射的极限来自强失配，而不是材料“把波吞回去”。

## 5. 例子、驻波与模型升级

**例 1：自由端与固定端。**把第二介质阻抗趋近零，$r_u\to+1$，位移在界面同相反射；把阻抗趋近无穷大，$r_u\to-1$，位移反相。这是绳端反射两种极限的连续介质版本。

**例 2：有限棒的共振。**长度为 $L$ 的两端边界会把向前和反射波叠加成驻波。理想自由-自由或固定-固定棒的纵向本征频率近似为

$$
f_n=\frac{n c_{\mathrm L}}{2L},\qquad n=1,2,\ldots
$$

边界条件改变的是允许的节点结构，不是把材料内部的波速重新定义。

**例 3：从声子到宏观波。**设一维链相邻原子间的键力常数为 $k_s$（单位 $\mathrm{N/m}$）、原子质量为 $m$、晶格间距为 $a$。长波极限给出 $\omega\approx c k$；当 $ka$ 不再很小时，离散方程给出
$\omega=2\sqrt{k_s/m}\,\lvert\sin(ka/2)\rvert$。这里的 $k_s$ 不是前文单位为 Pa 的体积模量 $K$。此时群速可小于相速，甚至在带边为零；“固体里波速恒定”只属于连续、线性、低频近似。

工程上还要加入黏弹性损耗、界面粗糙度、晶粒散射和非线性。学习层的 $R,T$ 仍是第一层证书：它告诉我们边界条件如何工作，但不是对复杂材料的完整超声反演。

---

*弹性波把“局部应力”变成了携带能量和信息的传播解。下一章转向电磁场：介质中的色散会让相速与群速分开，金属边界还会把横向边界条件变成波导截止。*
