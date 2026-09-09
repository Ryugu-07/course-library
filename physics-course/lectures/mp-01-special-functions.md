# 数理方法 · 特殊函数与 Green 函数

> **对标**：Arfken 主干 / 梁昆淼下册。**先修回链**：[分离变量](../../math-course/site/pde-01-separation.html)、[线性常微分方程](../../math-course/site/ode-02-linear.html)、[分布与基本解](../../grad-math/site/pde2-01-distributions.html)。
> 数学物理方法的主体（复变、PDE、变分）你的数学站已建成——本页只补物理特有的两块：**特殊函数全家福**（它们不是杂技，来自具体坐标、势与边界下的分离方程）与 **Green 函数方法**（物理人的"逆算子"语言）。定位：速查 + 认亲。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="special-function-boundaries-learning-title">

## 学习层：同一个微分方程，为什么边界一换谱就变？

### 1. 具体情境：圆膜半径把 Bessel 零点变成频率

柱坐标分离 Helmholtz 方程后，径向方程出现 \(J_m(kr)\)。但 \(J_m\) 本身还不是频谱；固定圆膜边缘要求

$$
J_m(kR)=0,
$$

于是 \(kR\) 只能取 Bessel 零点。方程决定候选函数族，定义域、权重和边界条件共同决定自伴算子、正交关系与离散谱。只背“柱坐标用 Bessel”会漏掉真正完成量子化的那道边界证书。

把推导写完整：理想均匀张力圆膜满足 $u_{tt}=c^2\Delta u$。取 $u=a(r)\cos(m\varphi)e^{-i\omega t}$，单值性要求整数 $m$，得到

$$
-(ra')'+\frac{m^2}{r}a=k^2ra,\qquad k=\omega/c,\qquad 0<r<R.
$$

这是权重 $r$ 的径向 Sturm–Liouville 问题；原点为奇异端点，取在原点正则的解（排除 $Y_m$），保留 $a=J_m(kr)$。对不同本征值，分部积分相减给

$$
(k_n^2-k_j^2)\int_0^R r a_n a_j\,dr
=\left[r(a_n a_j'-a_j a_n')\right]_0^R=0.
$$

最后一个零来自原点正则及同一组自伴外边界，不能跳过。轴对称 $m=0$ 时，**Dirichlet** 条件 $a(R)=0$ 给 $J_0(kR)=0$；**Neumann** 条件 $a'(R)=0$ 在 $k>0$ 时给 $J_0'(kR)=-J_1(kR)=0$，还须单独保留 $k=0$ 的常数零模。这里 Neumann 是规定法向导数为零的理想模型，不是对所有真实膜边缘装置的描述。

| 轴对称边界 | 零模 | 第一个正根 $kR$ | 半径变为两倍 |
|---|---|---|---|
| Dirichlet | 无 | $2.4048255577$ | 固定 $c$ 时所有 $\omega$ 减半 |
| Neumann | 常数模 $k=0$ | $3.8317059702$ | 所有非零 $\omega$ 减半，零模仍为零 |

### 2. 先预测：函数值、边界残差与点源跳跃

1. \(J_0(0)=1\)，固定边缘条件 \(J_0(kR)=0\) 的第一根是否会在 \(kR=0\)？
2. Legendre 多项式的正交性是否无需说明区间 \([-1,1]\) 与权重？
3. 对 \(-u''=\delta(x-\xi)\)，Green 函数的一阶导数应满足 \(G'_+-G'_-=+1\) 还是 \(-1\)？

### 3. 三个可审计边界问题

<div class="learning-lab" data-learning-lab="special-function-boundaries" markdown="1">

**无 JavaScript 时的静态读法：**

| 模型 | 方程/函数族 | 边界证书 | 可核对结果 |
|---|---|---|---|
| 固定圆膜轴对称模 | \(J_0(kr)\) | \(J_0(kR)=0\) | 第一根 \(kR\approx2.4048\) |
| 球面轴对称角模 | \(P_\ell(\cos\theta)\) | \([-1,1]\) 上正则、权重 1 | 不同 \(\ell\) 正交 |
| \(-u''=f,\ u(0)=u(L)=0\) | 分段线性 \(G(x,\xi)\) | 两端为零、连续 | \(G'_+-G'_-=-1\) |

实验揭示后可切换三种模型：Bessel 页比较两类边界与半径，正零点由扫描、二分得到；Neumann 第0模单列。Legendre 页用递推并允许选择对照次数，同奇偶的不同次数与同次范数都可检查。Green 页移动点源、改变长度并列左右导数。实验在 $|x|\le20$ 用128点中点求积计算 $J_0(x)=\pi^{-1}\int_0^\pi\cos(x\sin t)dt$，并由导数关系计算 $J_1$，避免较大 $x$ 下交错幂级数的消减；这仍是有范围的数值近似。数值零点只验证当前低阶问题；完备性来自相应自伴 Sturm–Liouville 定理，而不是曲线看起来“够多”。

</div>

### 4. 失效边界

- 实谱、正交与完备需要指定自伴域和边界条件；任意二阶方程不会自动继承整套结论。
- Green 函数依赖边界/初始或辐射条件。若算子有零模，普通逆不存在，需加规范、投影或广义逆。
- \(J_m(x)\) 的余弦渐近式是固定阶 \(m\)、\(x\to+\infty\) 的结论；阶与自变量同时变大要用一致渐近。


### 5. 迁移题：从点源核到真正的解

1. 在 $[0,L]$ 上，使用 $G(x,\xi)=x_<(L-x_>)/L$ 求解 $-u''=1$、两端为零。不要只抄核；把源位置积分拆成两段。
2. 如果边界换为 $u'(0)=u'(L)=0$，同一个载荷 $f=1$ 能否有解？若 $\int_0^L f=0$，解是否唯一？
3. 计算 $\int_{-1}^1P_2P_4dx$ 与 $\int_{-1}^1P_2^2dx$。为什么只检查 $P_2P_3$ 不足以区分正确的 Legendre 实现与任意奇偶多项式？

<details class="answer" markdown="1"><summary>展开积分与边界检查</summary>

**1. 分段计算。**

$$
u(x)=\frac{L-x}{L}\int_0^x\xi\,d\xi+\frac{x}{L}\int_x^L(L-\xi)\,d\xi=\frac{x(L-x)}2.
$$

于是 $u(0)=u(L)=0$ 且 $-u''=1$。核的连续性及导数跳跃也能直接推导：设左支 $A x$、右支 $B(L-x)$，连续给 $A\xi=B(L-\xi)$；在点源两侧积分 $-G''=\delta$ 给 $-B-A=-1$，解得 $A=(L-\xi)/L$、$B=\xi/L$。

**2. 兼容条件。** 积分方程得 $\int_0^L fdx=-u'(L)+u'(0)=0$，所以 $f=1$ 无解。零平均载荷时仍可加任意常数；加 $\int u=0$ 才选定一个逆。投影 Green 核应满足 $-G''=\delta(x-\xi)-1/L$，不是普通点源逆。

**3. 同奇偶的正交检查。** $P_2=(3x^2-1)/2$、$P_4=(35x^4-30x^2+3)/8$；乘积为 $(105x^6-125x^4+39x^2-3)/16$，积分为0，而 $\int P_2^2=2/5$。$P_2P_3$ 是奇函数，其积分为0还没有检验同奇偶阶之间的正交结构。

</details>

</section>

## 1. 特殊函数：一个来源，一张表

<div style="overflow-x:auto;position:relative" tabindex="0" role="region" aria-label="特殊函数图，可横向滚动">
<figure class="plot" markdown="1" style="min-width:820px">
![Bessel 与 Legendre 函数](assets/img/mp-01-special-functions.svg)
<figcaption><span class="fig-id">图 1.1</span>两族最常见的特殊函数：Bessel \(J_n\)（柱对称问题）与 Legendre \(P_n\)（球对称问题）——都是分离变量后的本征函数。</figcaption>
</figure>
</div>

**统一出身**：在对称坐标系里分离 Helmholtz/Laplace 方程（pde-01 的流程），径向/角向方程的解出现相应函数族；Hermite 与 Laguerre 还需要二次势、Coulomb 势等具体动力学，不能单由坐标系决定：

| 函数 | 出生地 | 物理岗位 | 关键性质 |
|---|---|---|---|
| **Legendre $P_\ell(x)$** | 球坐标角向（轴对称） | 多极展开（em-01/ced-01） | $L^2([-1,1],dx)$ 正交完备，范数平方 $2/(2\ell+1)$ |
| **球谐 $Y_\ell^m$** | 球坐标角向（一般） | 角动量本征函数（qm-03）、CMB 分解（cosmo-02） | $L^2$ 球面的正交基（泛函 II） |
| **Bessel $J_n$** | 柱坐标径向 | 圆膜振动、光纤模式、圆孔衍射（opt-01 Airy） | 正则性与指定边界一起选出径向谱 |
| **球 Bessel $j_\ell$** | 球坐标径向（自由粒子） | 散射分波（aqm-02） | $j_0=\sin x/x$，在 $x=0$ 取极限 $1$ |
| **Hermite $H_n$** | 直角坐标 + 二次势 | 谐振子（qm-02）、高斯光束模式 | 升降算符的产物 |
| **Laguerre $L_n^k$** | 球坐标 + $\frac1r$ 势 | 氢原子径向（qm-03） | 级数截断 → 主量子数 |

**方法论读法**：这些函数族可安放进相应的 **Sturm–Liouville 问题**（pde-01 §2 / 泛函 III 自伴谱理论的实例）；在给定区间、权重与自伴边界条件后，才继承**实谱、正交性、完备展开**。"用什么函数展开"要同时看坐标系、势和边界。物理人的实用三招：递推关系、母函数、渐近形式；例如固定阶 $n$ 且 $x\to+\infty$ 时 $J_n(x)\sim\sqrt{2/(\pi x)}\cos(x-n\pi/2-\pi/4)$，阶与自变量同时变大则需另一套一致渐近。

## 2. Green 函数：物理人的逆算子

**定义**：线性算子 $\hat L$ 的点源响应

$$
\hat L\,G(\mathbf r, \mathbf r') = \delta(\mathbf r - \mathbf r') \quad\Longrightarrow\quad u(\mathbf r) = \int G(\mathbf r, \mathbf r')\,f(\mathbf r')\,d\mathbf r'
$$

——**"任意源 = 点源的叠加，解 = 点源响应的叠加"**（线性性的全部利用；pde2-01 基本解的物理名字）。在边界/初始/辐射条件已固定且逆存在时，$G$ 是 $\hat L^{-1}$ 的积分核；有零模时需先投影或另加规范，不能直接逐谱除以零。

**三大常客【推导/引用】**：

- **三维无界静电**：$\hat L = -\nabla^2$，$G = \frac{1}{4\pi|\mathbf r - \mathbf r'|}$——单位点源的核，电势还须乘电荷与介电系数（em-01 的叠加积分原来就是 Green 函数方法）；带边界的 $G$ = 镜像法的正式身份（镜像电荷 = 构造满足边界条件的 Green 函数）；
- **三维无界波动**：对 $\hat L=c^{-2}\partial_t^2-\Delta$，取 $\tau=t-t'$、$\rho=|\mathbf r-\mathbf r'|$，推迟核为 $G_{\rm ret}=\delta(\tau-\rho/c)/(4\pi\rho)$；$c$ 是此方程的波速，只有电磁真空情境才特指光速。算子若改成 $\partial_t^2-c^2\Delta$，核需再除以 $c^2$。
- **无界热传导**：对 $\partial_t-D\Delta$，$D>0$，$d$ 维推迟热核为 $\Theta(\tau)(4\pi D\tau)^{-d/2}\exp[-\rho^2/(4D\tau)]$；它满足初始单位质量，边界存在时通常要另构造。


**本征函数展开【推导】**：先假设指定自伴算子具有离散完备正交归一基、没有零本征值，并假设源属于逆算子的定义域，按相应测度展开。$G = \sum_n\frac{\varphi_n(\mathbf r)\varphi_n^*(\mathbf r')}{\lambda_n}$（把 $\delta$ 按完备基展开、逐项除本征值——"逆算子 = 谱的倒数"：泛函 III 谱定理的直接应用）。连续谱需把求和改成谱积分；解与核的收敛意义也要说明。量子时间演化核的谱系数是 $e^{-iE_nt/\hbar}$，而预解式核是 $(E-E_n\pm i0)^{-1}$；Feynman、推迟、超前核的边界处方不同，不能统称为无条件的 $1/\lambda_n$。

🔗 对账：正定协方差核可定义正算子，但不必可逆，更不自动是某个局部微分算子的 Green 函数。例如常数核对应秩1算子，有大量零模。只有指定算子、函数空间、定义域及边界后，“核是逆算子”才成为可检验的命题。

## 3. 渐近与量纲（物理人的两件防身器）

**量纲分析**：数学站建模页已立（Buckingham π）；物理补一句——**自然单位制**（$\hbar = c = 1$：长度=时间=1/能量）是研究生板块的默认货币（qft/pp 线），换算锚点：$\hbar c \approx 197$ MeV·fm。

**渐近展开一嘴**：驻相法/最速下降（复变 III 围道思想的延伸【引用】）——大参数积分的物理直觉来源（短波极限 = 几何光学、经典极限 $\hbar \to 0$ = 驻相在经典路径——aqm-03 路径积分的预告）。

## 4. 练习与要点

**例 1（多极展开亲算）** $\frac{1}{|\mathbf r - \mathbf r'|} = \sum_\ell \frac{r'^\ell}{r^{\ell+1}}P_\ell(\cos\theta)$（仅当 $r^{\prime}<r$；对有界电荷分布，观测点需在全部源点外）——远场电势 = 单极 + 偶极 + 四极…（ced-01 的主粮）；总电荷为零时单极项消失，首个非零多极矩才控制远场，不能总以点电荷为主项。

**例 2（Green 函数用法演示）** 一维弦 $-u'' = f$、两端固定：$G(x, x') = \frac{x_<(L - x_>)}{L}$（分段线性、在 $x'$ 处满足 $G'_+-G'_-=-1$，因此 $-G''=\delta$）；任意载荷的挠度一个积分完事——工程与物理共用的"影响函数"。

**例 3（自然单位换算）** 质子静能 $mc^2\approx938$ MeV ⇒ 约化康普顿波长 $\frac{\hbar c}{mc^2} = \frac{197}{938} \approx 0.21$ fm——通常康普顿波长 $h/(mc)$ 还要乘 $2\pi$；此处为约化尺度：自然单位制的日常红利。$\blacksquare$

---

*继续学习：[高等量子力学中的散射](aqm-02-scattering.html)用球Bessel与出射边界，[静电边值问题](ced-01-boundary.html)继续使用Green函数。*


**原始参考**：[NIST DLMF：Bessel 积分表示](https://dlmf.nist.gov/10.9)、[零点](https://dlmf.nist.gov/10.21)、[经典正交多项式的权重和归一化](https://dlmf.nist.gov/18.3)。Green跳跃与零模兼容条件在本页直接推导。
