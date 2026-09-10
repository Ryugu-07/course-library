# 广相 I · 等效原理与测地线

> **起点**：[狭义相对论](sr-01-relativity.html)中的固有时与四速度，以及[流形](../../grad-math/site/mfld-01-manifolds.html)、[度规与联络](../../grad-math/site/mfld-03-riemannian.html)和[曲率](../../grad-math/site/mfld-04-curvature.html)。下面仍会写出本页所需的推导。
> **目标**：分别判断“某个坐标加速度消失”“两只静止钟速率不同”“相邻自由落体有相对加速度”。三句话涉及不同的比较，不能互相替代。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="equivalence-tides-learning-title">

## 学习层：电梯里消掉了什么？

### 1. 从一只钟、一个球到两个球

设想三次实验。先把一只钟留在塔底，一只钟支撑在塔顶，用光信号比较它们。再松开实验室，让一只小球与实验室一起自由落下。最后在自由落体实验室中释放两只相隔一定距离的小球。第一次比较两个地点的静止钟；第二次寻找局部惯性系；第三次测量邻近轨迹的相对加速度。明确设备、参考系和比较方式，才知道读数在检验什么。

本页使用号差 $(-,+,+,+)$，空间指标为 $i,j=1,2,3$。写联络公式时取 $x^0=ct$，使四个坐标都有长度量纲。光速记为 $c$，质量记为 $M$，Schwarzschild 半径为 $r_s=2GM/c^2$。

### 2. 四个预测

1. 塔顶收到的光频率比塔底发射时低，是否意味着塔顶自己的钟走得更慢？
2. 一个加速实验室有钟速梯度，能否由此断言时空曲率非零？
3. 两只球沿径向排开与沿横向排开，潮汐方向和大小是否一样？
4. 毫米高差的频率比在屏幕上显示为 1，是否意味着频率差严格为零？

### 3. 三种模型，共用一套可核对的读数

<div class="learning-lab" data-learning-lab="equivalence-tides" markdown="1">

**无 JavaScript 时的静态读法。** 下表的天体参数都是教学模型的圆整值，不是实验原始数据。塔楼取 M=5.9722×10²⁴ kg、R=6.371×10⁶ m；两只钟均被支撑在原位。

| 实验 | 可手算的结果 | 条件 |
|---|---|---|
| 地球塔楼，高差 22.5 m | 频率损失约 2.45847×10⁻¹⁵ | 低处发射，高处静止接收 |
| 同一地球模型，高差 1 mm | 频率损失约 1.09266×10⁻¹⁹ | 不能用舍入后的两个 1 相减 |
| 高差为 0 | 频率损失与红移均为 0 | 相对近似误差是 0/0，不定义 |
| 平直时空的 Rindler 实验室，χ=1/2 | 频率比 2/3，损失 1/3，谱线红移 z=1/2 | Riemann 曲率仍全部为 0 |
| 中心半径 r 处，双球沿径向分离 ℓ | 相对加速度 +2GMℓ/r³ | Newton 局部线性化，向外为正 |
| 同处沿横向分离 ℓ | 相对加速度 −GMℓ/r³ | 横向压缩，不是径向公式 |
| 有限分离长度为 0 | 两种 Newton 相对加速度均为 0 | 其相对差不定义 |

启用脚本后，先回答四个预测再揭示结果。两个图和三张表列出当前读数及全部作图节点。天体预设只用于静止钟与潮汐；Rindler 实验独立使用下钟加速度和无量纲高差。中子星预设只描述非旋转球对称外部，不包含自转、磁场或辐射转移。

</div>

### 4. 先划清模型边界

- 静止钟模型的 $h$ 是面积半径之差：半径为 $r$ 的球面面积是 $4\pi r^2$。它不是强场中拿尺逐段测出的径向固有距离。
- 光的频率由接收者自己的钟测量。光子频率比、静止钟速率比和谱线红移的分母不同。
- 有限双球对照使用 Newton 点质量场，只检验它自身的线性化误差。把该误差称为“强场相对论误差”没有依据。
- Rindler 坐标覆盖平直时空的一部分；支撑加速度与钟速梯度可以非零。潮汐曲率需另外检验。

</section>

<style>.et-static{max-width:100%;overflow-x:auto}.et-static img{display:block;width:1100px;min-width:1100px;max-width:none!important}.et-static:focus-visible{outline:3px solid var(--accent)}</style>
<div class="et-static" role="region" tabindex="0" aria-label="静止钟、加速世界线与潮汐方向，可左右滚动"><img src="assets/img/gr-01-light-bending.svg" alt="静止钟频率比与钟速率比互为倒数；Rindler曲率为零；径向双球伸长而横向双球压缩。" loading="lazy"></div>

## 1. 等效原理是一项物理主张

在 Newton 语言中，测试体满足 $m_{\rm i}\mathbf a=m_{\rm g}\mathbf g$。若 $m_{\rm g}/m_{\rm i}$ 对测试体的材料普适，就可统一单位，把不同材料的自由落体写为同一条运动规律。**弱等效原理**的核心是自由落体的普适性；测试体近似忽略自引力，实验还需排除电磁力、阻力等非引力作用。

**Einstein 等效原理**进一步要求：局部自由落体实验室中的非引力实验服从狭义相对论，其结果不依赖实验室的速度和位置。“局部”意味着实验区域与持续时间足够小，使潮汐变化在所需精度内可忽略。它不等于在一整片有曲率的区域里，把所有引力效应永久消除。

数学上，光滑 Lorentz 度规在一个事件 $p$ 处允许选择法坐标：

$$
g_{\mu\nu}(p)=\eta_{\mu\nu},\qquad
\partial_\rho g_{\mu\nu}(p)=0,\qquad
\Gamma^\lambda_{\mu\nu}(p)=0.
$$

这是关于度规和坐标的定理。**真实物质是否按同一个度规耦合、不同材料是否普适自由落体，仍是物理与实验问题。** 二阶导数中的曲率一般不为零，不能从上式推出整个邻域都是 Minkowski 时空。沿一条自由落体世界线还可使用 Fermi 正规坐标；离开该世界线的二阶空间变化仍携带潮汐。

例如 MICROSCOPE 最终结果对钛与铂的差分自由落体给出

$$
\eta_{\rm Ti,Pt}
=\frac{2(a_{\rm Ti}-a_{\rm Pt})}{a_{\rm Ti}+a_{\rm Pt}}
=[-1.5\pm2.3_{\rm stat}\pm1.5_{\rm syst}]\times10^{-15}.
$$

统计误差为 $1\sigma$；这是在该实验条件和误差预算下与零相容，不是证明所有物质的差异精确为零。[原始论文，PRL 129, 121102 (2022)](https://physics.aps.org/featured-article-pdf/10.1103/PhysRevLett.129.121102)

## 2. 从运动的变分到测地线方程

时空曲线的类时固有时满足

$$
c^2d\tau^2=-g_{\mu\nu}\,dx^\mu dx^\nu.
$$

对于无非引力作用的点状测试粒子，采用度规测地线作为运动规律。连接固定端点的类时测地线使固有时驻定；在足够短、无共轭点的区间内它局部最大。这不是任意长路径都“最长”的全局保证。

实际推导可用仿射参数 $\lambda$ 和二次作用量

$$
S=\frac12\int g_{\mu\nu}(x)\dot x^\mu\dot x^\nu\,d\lambda,
\qquad \dot x^\mu=\frac{dx^\mu}{d\lambda}.
$$

固定端点变分，Euler–Lagrange 方程逐步给出

$$
\frac{d}{d\lambda}(g_{\alpha\nu}\dot x^\nu)
-\frac12\partial_\alpha g_{\mu\nu}\dot x^\mu\dot x^\nu=0,
$$

$$
g_{\alpha\nu}\ddot x^\nu+
\frac12(\partial_\mu g_{\alpha\nu}
+\partial_\nu g_{\alpha\mu}-\partial_\alpha g_{\mu\nu})
\dot x^\mu\dot x^\nu=0.
$$

最后乘逆度规 $g^{\rho\alpha}$，得到

$$
\ddot x^\rho+\Gamma^\rho_{\mu\nu}\dot x^\mu\dot x^\nu=0,
\qquad
\Gamma^\rho_{\mu\nu}
=\frac12g^{\rho\alpha}
(\partial_\mu g_{\alpha\nu}+\partial_\nu g_{\alpha\mu}
-\partial_\alpha g_{\mu\nu}).
$$

类时情形可取 $\lambda=\tau$。这个二次作用量也适用于零测地线：先得到方程，再施加初始零范数 $g_{\mu\nu}\dot x^\mu\dot x^\nu=0$；度规相容性保证范数沿解保持。**不能先把零范数代进作用量，把被积函数写成零再变分。** 光沿线的固有时没有增长，因此不能用 $\tau$ 作光线参数。

若换成任意单调参数 $s$，链式法则给出

$$
\frac{d^2x^\rho}{ds^2}
+\Gamma^\rho_{\mu\nu}\frac{dx^\mu}{ds}\frac{dx^\nu}{ds}
=f(s)\frac{dx^\rho}{ds},
\qquad
f(s)=\frac{d^2\lambda/ds^2}{d\lambda/ds}.
$$

只有仿射重参数化 $\lambda=as+b$ 才使右侧为零。右侧沿切线的项改变参数步速，不改变曲线的几何轨迹。

## 3. 牛顿极限：量纲与近似一起保留

取弱场、静态且无时间—空间交叉项的坐标，最低阶有

$$
g_{00}=-(1+2\Phi/c^2),\qquad
g_{0i}=0,\qquad g_{ij}\simeq\delta_{ij},
\qquad |\Phi|/c^2\ll1,\quad |\mathbf v|/c\ll1.
$$

由于 $x^0=ct$，静态条件给出

$$
\Gamma^i_{00}
=-\frac12g^{ij}\partial_jg_{00}
\simeq\frac{\partial_i\Phi}{c^2}.
$$

空间测地线方程中，两次时间导数的项在低速极限主导。用 $dt/d\tau\simeq1$，并忽略相应高阶修正，

$$
\frac{d^2x^i}{d\tau^2}
\simeq-\Gamma^i_{00}\left(c\frac{dt}{d\tau}\right)^2
\quad\Longrightarrow\quad
\frac{d^2x^i}{dt^2}\simeq-\partial_i\Phi.
$$

右侧是加速度；这也检查了必须存在的 $c^2$ 因子。低速运动在这些坐标下主要探测 $g_{00}$，不表示所有引力现象都由一个“时间梯度”决定。光线、旋转时空和潮汐测量需要更多度规信息。等效原理与测试粒子运动也没有单独确定 Einstein 场方程；物质如何决定度规留到下一页。

## 4. 红移：先固定发射者和接收者

### 4.1 静态外部的精确比值

先借用下一页将研究的 Schwarzschild 外部度规：

$$
ds^2=-f(r)c^2dt^2+\frac{dr^2}{f(r)}+r^2d\Omega^2,
\qquad f(r)=1-\frac{r_s}{r},\qquad r>r_s.
$$

在固定半径被支撑的钟满足 $d\tau=\sqrt{f(r)}\,dt$。静态对称性使光子的 Killing 能量沿传播保持，而静止观察者测得的频率与 $1/\sqrt{f(r)}$ 成正比。低处 $r_1=R$ 发射、高处 $r_2=R+h$ 接收，因此

$$
\mathcal R=\frac{\nu_{\rm rec}}{\nu_{\rm em}}
=\sqrt{\frac{f(R)}{f(R+h)}}<1
\qquad(h>0).
$$

与此同时，两只静止钟在相同坐标时间间隔中积累的固有时之比是

$$
\frac{d\tau_{\rm upper}}{d\tau_{\rm lower}}
=\sqrt{\frac{f(R+h)}{f(R)}}=\mathcal R^{-1}>1.
$$

上钟更快，却把下方发来的脉冲数成更低的频率：上钟的一个“秒”所对应的发射钟读数更少。这两个结论完全一致。

还要区分**频率损失** $D=1-\mathcal R$ 与**谱线红移**

$$
z=\frac{\nu_{\rm em}}{\nu_{\rm rec}}-1
=\frac{1}{\mathcal R}-1=\frac{D}{1-D}.
$$

只有小差值时才有 $z\simeq D$。从表面发到无穷远时，$z_\infty=(1-r_s/R)^{-1/2}-1$。紧致度 $GM/(Rc^2)$ 为 0.2 的示例给出 $z_\infty\simeq0.2910$，不能把紧致度本身当作精确红移。

### 4.2 两层近似与稳定计算

弱场先展开平方根，得到

$$
D\simeq z\simeq\frac{\Delta\Phi}{c^2}
=\frac{GM}{c^2}\left(\frac1R-\frac1{R+h}\right)
=\frac{GMh}{c^2R(R+h)}.
$$

再增加 $h/R\ll1$，才可把势差近似成 $gh/c^2$，其中本式 $g=GM/R^2$。这与强场中维持静止所需的固有加速度 $GM/[R^2\sqrt{f(R)}]$ 不同。即使场很弱，高差很大也不能随意用地面 $g$ 乘整个高差；$gh$ 相对于完整 Newton 势差的相对误差恰为 $h/R$。

毫米红移在双精度下远小于 1 附近相邻可表示数的间距。因此脚本先计算

$$
q=\frac{(r_s/R)\,h/(R+h)}{1-r_s/R},
\qquad L=-\frac12\log(1+q),
\qquad D=-\operatorname{expm1}(L),\quad
z=\operatorname{expm1}(-L).
$$

其中 $\operatorname{expm1}(x)$ 稳定计算 $e^x-1$，对数用 $\operatorname{log1p}(q)$。关键是保留输入的 $h$，不要先通过两个近似相等的大半径相减重建它。显示出来的 $\mathcal R=1$ 可能只是舍入，账本中的 $D$ 仍非零。

真实实验已有毫米尺度的原子钟红移分辨。Bothwell 等在同一个锶原子样本中报告的最终梯度为 $-9.8(2.3)\times10^{-20}/{\rm mm}$，符号跟随该文坐标约定。论文中另一个 $7.6\times10^{-21}$ 数值是约 92 小时同步比较两个区域得到的分数频率不确定度，不能当作前述梯度的误差，也不能拿本页圆整地球模型冒充其测量数据。[作者原文，Nature 602, 420–424 (2022)](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=933368)

### 4.3 GPS 示例为什么需要两项？

本实验的 GPS 高度预设把两只钟都固定在空间中，只隔离重力项。真实卫星还在运动。非旋转地球、近圆轨道的弱场近似中，相对地面静止钟有

$$
\frac{\Delta\dot\tau}{\dot\tau}
\simeq\frac{\Phi_{\rm sat}-\Phi_{\rm ground}}{c^2}
-\frac{v_{\rm sat}^2}{2c^2}.
$$

用约 20200 km 高度和 $v_{\rm sat}\simeq3.9\ {\rm km/s}$，两项约为每天 $+45\ \mu{\rm s}$ 与 $-7\ \mu{\rm s}$，合计约 $+38\ \mu{\rm s}$。这是说明两类效应的圆整估算；工程钟参考还涉及地球自转、参考势面、轨道偏心率与信号传播。不要把本页的静止钟读数直接叫作完整 GPS 校正。

## 5. 反例：有红移的平直时空

在 Minkowski 时空引入 Rindler 坐标，令 $x$ 沿加速方向：

$$
cT=(c^2/a_0+x)\sinh(a_0t/c),\qquad
X=(c^2/a_0+x)\cosh(a_0t/c)-c^2/a_0.
$$

代入 $ds^2=-c^2dT^2+dX^2+dy^2+dz^2$ 后，

$$
ds^2=-N(x)^2c^2dt^2+dx^2+dy^2+dz^2,
\qquad N(x)=1+\frac{a_0x}{c^2}>0.
$$

位于 $x=0$ 的下钟固有加速度为 $a_0$；位于 $x=L$ 的上钟固有加速度为 $a_0/(1+a_0L/c^2)$。固定 Rindler 间隔要求不同位置有不同固有加速度，不能让整个有限刚性实验室都具有同一个固有加速度。

记 $\chi=a_0L/c^2$。两只固定 Rindler 位置的钟比较光信号，得到

$$
\mathcal R=\frac{1}{1+\chi},\qquad
D=\frac{\chi}{1+\chi},\qquad z=\chi.
$$

这里有红移，却没有曲率。直接检查也很短：取 $x^0=ct$，非零的相关联络为 $\Gamma^x_{00}=NN'$ 和 $\Gamma^0_{0x}=N'/N$。采用

$$
R^\rho{}_{\sigma\mu\nu}
=\partial_\mu\Gamma^\rho_{\nu\sigma}
-\partial_\nu\Gamma^\rho_{\mu\sigma}
+\Gamma^\rho_{\mu\alpha}\Gamma^\alpha_{\nu\sigma}
-\Gamma^\rho_{\nu\alpha}\Gamma^\alpha_{\mu\sigma},
$$

便有

$$
R^x{}_{0x0}=\partial_x(NN')-(N')^2=NN''=0.
$$

其他可能的分量同样为零，因为这是平直度规的坐标变换。它说明“联络非零”或“静止钟有梯度”都不单独证明曲率非零。

图中上行光线在惯性坐标里始终为 $X=cT$。把世界线与这条直线联立，得到抵达参数

$$
s_{\rm arr}=\frac{a_0t_{\rm arr}}{c}=\log(1+\chi).
$$

账本用同一个参数同时检验光子与上钟的交点。若取地球量级的 $a_0$ 却设 $\chi=1/2$，所需 $L$ 极大；这是放大效果的数学示例，不是在建议建造这种实验室。

## 6. 潮汐：一张有方向的加速度地图

取中心在 $\mathbf r=r\mathbf e_r$ 的小型自由落体实验室。Newton 点质量场为 $\mathbf g(\mathbf r)=-GM\mathbf r/r^3$。对位置做一阶展开，

$$
\Delta a_i\simeq T_{ij}\xi_j,\qquad
T_{ij}=\partial_jg_i
=\frac{GM}{r^3}(3n_in_j-\delta_{ij}).
$$

在一条径向和两条正交横向的基底中，

$$
T=\frac{GM}{r^3}\operatorname{diag}(2,-1,-1).
$$

因此沿径向排开的球被拉开，横向排开的球相互靠近；真空外部这三个特征值的和为零。若分离方向与径向夹角为 $\theta$，

$$
(\Delta a_r,\Delta a_\perp)
=\frac{GM\ell}{r^3}(2\cos\theta,-\sin\theta).
$$

图和表均使用这两个带符号的分量，不把横向小球误画成径向伸长。用本页 Riemann 号约定，邻近类时测地线的偏离满足

$$
\frac{D^2\xi^\mu}{D\tau^2}
=-R^\mu{}_{\alpha\nu\beta}u^\alpha\xi^\nu u^\beta.
$$

自由落体正交标架中的慢速极限给出 $T_{ij}=-c^2R^i{}_{0j0}$。这里是相邻自由落体的相对加速度；支撑在固定高度的两只钟并不是这一对自由落体。

为了检验“小型”假设，脚本还取同一瞬时 Cartesian 切片上关于中心对称的两点

$$
\mathbf r_\pm=r\mathbf e_r\pm\frac{\ell}{2}
(\cos\theta\,\mathbf e_r+\sin\theta\,\mathbf e_\perp),
\qquad
\Delta\mathbf a_{\rm finite}
=-\frac{GM\mathbf r_+}{|\mathbf r_+|^3}
+\frac{GM\mathbf r_-}{|\mathbf r_-|^3}.
$$

它与线性结果的相对差随 $\ell/r\to0$ 而趋于零。两点对称使领先修正一般为 $(\ell/r)^2$ 量级。程序用稳定的代数重排计算，不直接把两个近似相等的大加速度相减。小分离处先在解析展开中消去线性项，再计算二阶及更高阶修正，避免把浮点消差噪声当作真实修正。单独显示的两个加速度仍可能舍入成相同值；修正由稳定展开直接计算。

这整个有限分离对照仍是 Newton 模型。在中子星预设处尤其不能声称它给出了广相的有限实验室轨迹。另列的

$$
R_{\alpha\beta\gamma\delta}R^{\alpha\beta\gamma\delta}
=\frac{48G^2M^2}{c^4r^6}
$$

才是 Schwarzschild 外部的精确曲率标量；其单位为 $\mathrm{m}^{-4}$，不是加速度，也没有取代有限距离的观测协议。

## 7. 迁移练习与完整答案

<details markdown="1">
<summary>练习 1：上钟频率更低，为什么上钟反而更快？再算强差值。</summary>

把相同坐标时间内的发射周期与接收周期都换成各自的固有时。钟速率比是 $\mathcal R^{-1}$，光频率比是 $\mathcal R$。若 $\mathcal R=2/3$，上钟速率是下钟的 $3/2$，接收频率是发射频率的 $2/3$。频率损失为 $1/3$，谱线红移为 $1/2$。两者只在微小差值下近似相等。静止钟每一个下钟日多出的读数是 $(\mathcal R^{-1}-1)\times86400$ 秒；换成别的参考“日”，分母也要一起改。

</details>

<details markdown="1">
<summary>练习 2：给出有红移、曲率却为零的完整反例。</summary>

取 Rindler 度规 $N=1+a_0x/c^2$，令 $\chi=1/2$。红移账本给出 $\mathcal R=2/3$ 和 $z=1/2$。另一方面，$N''=0$，所以 $R^x{}_{0x0}=NN''=0$；坐标变换回 Minkowski 后可知全部曲率为零。下钟加速度为 $a_0$，上钟为 $2a_0/3$。光在惯性坐标中是直线，交点满足 $s_{\rm arr}=\log(3/2)$。如果坚持两钟固有加速度完全相同，它们便不是本例固定 Rindler 间隔的两条世界线。

</details>

<details markdown="1">
<summary>练习 3：把双球由径向旋转到横向；再判断有限 Newton 结果能证明什么。</summary>

写 $\boldsymbol\xi=\ell(\cos\theta,\sin\theta,0)$ 并乘 $T=(GM/r^3)\operatorname{diag}(2,-1,-1)$。当 $\theta=0$，得 $(2GM\ell/r^3,0)$；当 $\theta=\pi/2$，得 $(0,-GM\ell/r^3)$，模长减半且由伸长变压缩。当 $\theta=\pi/4$，分量为 $(\sqrt2,-1/\sqrt2)GM\ell/r^3$，模长为 $\sqrt{5/2}\,GM\ell/r^3$。有限 Newton 两点结果可检验这次 Taylor 展开的误差，不能验证 Schwarzschild 强场中的完整有限距离运动。零分离时两向量都为零，所以相对误差没有定义。

</details>

<details markdown="1">
<summary>练习 4：毫米红移消失在显示精度中怎么办？顺便检查大高差近似。</summary>

不从显示为 1 的频率比做减法。先用输入高差算 $q$，再用 $\operatorname{log1p}$ 与 $\operatorname{expm1}$ 算 $D$。地球模型 1 mm 的损失约 $1.09266\times10^{-19}$，非零；其数值模型不包含真实实验误差预算。对大高差，先算完整势差 $GMh/[R(R+h)]$；用地面 $gh$ 替代它会放大 $1+h/R$ 倍。例如 $h=R$ 时，$gh$ 是正确 Newton 势差的两倍，即使弱场条件仍然很好。弱场与小高差是两个独立条件。

</details>

## 8. 接着读什么

用 [Carroll 第 3 章的测地线与偏离推导](https://preposterousuniverse.com/wp-content/uploads/grnotes-three.pdf)复核参数与曲率约定，再用 [第 4 章](https://preposterousuniverse.com/wp-content/uploads/grnotes-four.pdf)核对等效原理、红移与 Newton 极限；该讲义常用 $c=1$，移回本页单位时应重新检查量纲。[下一页的 Einstein 场方程与 Schwarzschild 解](gr-02-einstein-schwarzschild.html)继续回答度规如何由物质决定，以及完整光线偏折为什么不能仅靠低速 Newton 极限算出。
