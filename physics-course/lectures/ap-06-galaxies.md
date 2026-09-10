# 天体 VI · 星系动力学与暗物质

> **对标**：Binney & Tremaine《Galactic Dynamics》、Mo, van den Bosch & White ｜ **前置**：[Newton 动力学](mech-01-newton.html)、[统计系综与相空间](sm-02-ensembles.html)、[宇宙学背景](cosmo-01-frw.html)
> 望远镜记录光和运动；质量来自带假设的反演；微观成分还需要另一层证据。本页把这三步连起来，既不把人工曲线冒充观测，也不把真实数据的拟合优劣变成粒子身份的判决。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="galaxy-learning-title">
<h2 id="galaxy-learning-title">学习层：先看一个真实星系，再拆开“称重”的假设</h2>

### 1. NGC3198 的外缘：速度有了，质量还要怎样算？

本页采用 SPARC 公开数据产品中 NGC3198 的全部 **43 个半径点**。最后一点是 $R=44.08\ {\rm kpc}$、$v_{\rm obs}=149\ {\rm km\,s^{-1}}$，表列速度误差为 $3\ {\rm km\,s^{-1}}$。这已经是经过几何建模与倾角校正的旋转曲线，不是望远镜直接输出的一列未处理速度。

在发布采用的 $D=13.8\ {\rm Mpc}$、$i=73^\circ$ 下，若取恒星质量光度比 $\Upsilon_d=0.5M_\odot/L_\odot$，该半径的重子圆速度贡献约 $64.713\ {\rm km\,s^{-1}}$，明显低于 $149\ {\rm km\,s^{-1}}$。加入一个参数化暗晕后可以缩小残差，但这一步还没有识别任何暗物质粒子。

如果进一步**假设球对称 Newton 引力**，才可把速度换成

$$
M_{\rm sph}(<R)=\frac{Rv_{\rm obs}^2}{G}
\simeq2.2753\times10^{11}M_\odot.
$$

真实恒星盘不是球形。实验因此把这个数标为“球对称等效质量”，不把它当成对盘内部真实三维包围质量的无条件测量。

### 2. 揭示前的五个预测

1. 各引力分量应当相加的是速度，还是有符号的径向力、即圆速度平方贡献？
2. 平坦球对称旋转曲线对应 $M(<r)$ 近似常数，还是正比于 $r$？
3. 一条旋转曲线能否直接判定暗物质就是 WIMP 或轴子？
4. 表列逐点速度误差是否已经包含全部倾角、距离和恒星质量光度比误差？
5. 只测视线速度弥散时，轨道各向异性是否通常仍影响质量反演？

### 3. 三个实验分别解决三个问题

<div class="learning-lab" data-learning-lab="galaxy-rotation" markdown="1">

**无 JavaScript 的默认读法。** 所有 SPARC 原始表列及课程提取文件可从本页数据链接下载。默认 $\Upsilon_d=0.5,D=13.8\ {\rm Mpc},i=73^\circ$；暗晕取 $v_\infty=134\ {\rm km\,s^{-1}},r_c=5.5\ {\rm kpc}$。这是说明计算的参数组，有限扫描得到的有限网格最优值另外列出。

| 默认计算 | 数值 | 解释 |
|---|---|---|
| 全部有效数据点 | 43 | 不因内缘误差较大而删除 |
| 外缘重子圆速度 | $64.713\ {\rm km\,s^{-1}}$ | 使用有符号气体项和 $\Upsilon_d$ |
| 外缘重子加晕速度 | $147.880\ {\rm km\,s^{-1}}$ | 与发布值 $149$ 比较 |
| 外缘标准化残差 | $-0.3733$ | $(v_{\rm model}-v_{\rm obs})/\epsilon_v$ |
| 当前参数的加权平方残差和 | $32.7251$ | 全部 43 点；未计完整协方差与系统误差 |
| 球对称基准在 $r=8$ 的总质量 | $14.2249$ | 该场景取 $G=1$，不是 NGC3198 拟合 |
| Jeans 默认圆速度 | $300\ {\rm km\,s^{-1}}$ | $\gamma=4,\beta=0,\sigma_{\rm los}=150\ {\rm km\,s^{-1}}$ |

</div>

**真实数据场景**保留全部误差棒、分项平方贡献和逐点残差；参数扫描只在明确的暗晕族和有限核半径网格中比较。**球对称场景**用完全公开的质量函数比较 Newton 重子、重子加暗晕与 MOND 加速度关系。**Jeans 场景**保持投影弥散不变，检查不同轨道结构给出的质量，并找出本模型中一个特殊的各向异性抵消点。

这些计算都可以逐行复算。模型能否解释一个真实星系，还要回到选择函数、气体与恒星运动、三维几何和系统误差；曲线画得平滑不是额外的证据。

</section>

<style>.gr-static{max-width:100%;overflow-x:auto}.gr-static img{display:block;width:1100px;min-width:1100px;max-width:none!important}.gr-static:focus-visible{outline:3px solid var(--accent);outline-offset:2px}</style>
<div class="gr-static" role="region" tabindex="0" aria-label="NGC3198完整观测点、模型残差与Jeans投影退化，可左右滚动"><img src="assets/img/ap-06-rotation-curve.svg" alt="NGC3198的43个发布旋转曲线点和误差棒，与明确参数的重子及暗晕模型比较；全部点的标准化残差；固定视线弥散的Jeans质量各向异性关系。" loading="lazy"></div>

## 1. 星系为什么近似是无碰撞系统？

“无碰撞”不是说引力不作用，而是说许多弱相遇造成的二体弛豫，在所考虑时间内不显著。对近似孤立、粒子数很大的系统，常用量级估算为

$$
t_{\rm relax}\sim\frac{N}{8\ln N}\,t_{\rm cross}.
$$

系数与密度分布、粒子质量谱和库仑对数有关。普通星系中这个时标通常很长；致密星团、核星团或局部致密区不能照搬全星系的 $N$ 就下结论。即使二体弛豫很慢，时变集体势仍会造成相混合和快速的粗粒化弛豫。

令 $f(\mathbf x,\mathbf v,t)$ 是示踪恒星的相空间数密度。在光滑平均势 $\Phi$ 下，相空间轨道满足 $\dot{\mathbf x}=\mathbf v,\dot{\mathbf v}=-\nabla\Phi$。沿轨道保持 $f$ 不变，链式法则给

$$
\frac{\partial f}{\partial t}
+\mathbf v\cdot\nabla_{\mathbf x}f
-\nabla\Phi\cdot\nabla_{\mathbf v}f=0.
$$

这就是无碰撞 Boltzmann 方程。若 $\Phi$ 由系统自身产生，还需 Poisson 方程 $\nabla^2\Phi=4\pi G\rho_{\rm total}$；示踪数密度 $\nu=\int f\,d^3v$ 不一定等于产生引力的总质量密度。

乘以 $v_i$ 并对速度积分，速度边界项消失时得到

$$
\frac{\partial(\nu\overline v_i)}{\partial t}
+\frac{\partial(\nu\overline{v_i v_j})}{\partial x_j}
=-\nu\frac{\partial\Phi}{\partial x_i}.
$$

这里对重复的 $j$ 求和。定义速度协方差 $C_{ij}=\overline{(v_i-\overline v_i)(v_j-\overline v_j)}$，则二阶矩包含平均运动和随机运动：
$\overline{v_i v_j}=\overline v_i\,\overline v_j+C_{ij}$。速度弥散的梯度可以承担一部分动力学支撑，所以“平均转得慢”不等于“引力弱”。椭圆星系也可能有显著旋转；支撑方式需要测量，不能只凭形态二分。

## 2. 从圆速度到密度：不要丢掉前面的系数

轴对称稳态势中，赤道面上的圆速度满足

$$
v_c^2(R)=R\frac{\partial\Phi}{\partial R}.
$$

只有球对称时，壳层定理才把它化为 $v_c^2=GM(<r)/r$。于是

$$
\rho(r)=\frac1{4\pi r^2}\frac{dM}{dr}
=\frac1{4\pi Gr^2}\frac{d(rv_c^2)}{dr}.
$$

若一段半径中 $v_c\propto r^\alpha$，则

$$
\rho(r)=\frac{(1+2\alpha)v_c^2}{4\pi Gr^2}.
$$

平坦曲线 $\alpha=0$ 给正的 $r^{-2}$ 密度。开普勒外区 $\alpha=-1/2$ 却使系数为零：那里的包围质量已饱和，不能把“指数形式变成 $r^{-3}$”误说成一个非零的 $r^{-3}$ 外层密度。若精确球对称圆速度的局部斜率小于 $-1/2$，该反演会给负密度，说明数据或假设需要重查。

真实数据的求导会放大噪声；有限差分斜率不等于真实局部导数。实际盘还可能有棒、翘曲、径向流和压强支撑，恒星平均旋转也会受非圆轨道影响。

### 视线投影和共享系统误差

对理想薄圆盘，

$$
v_{\rm los}-v_{\rm sys}=v_\phi\sin i\cos\phi.
$$

靠近面向观察者的盘，$\sin i$ 很小，倾角误差会被放大。在固定角位置和系统速度的圆盘主轴近似下，球对称等效质量按

$$
M_{\rm sph}\propto\frac{D(v_{\rm los}-v_{\rm sys})^2}{\sin^2 i},
\qquad
\frac{\delta M}{M}\simeq
\frac{\delta D}{D}
+2\frac{\delta v_{\rm los}}{v_{\rm los}-v_{\rm sys}}
-2\cot i\,\delta i
$$

变化，其中 $\delta i$ 用弧度。距离和倾角会共同移动许多点，不能当成 43 个互不相关的小误差重复平均掉。

## 3. 真实数据实验的完整计算约定

SPARC 表中的气体项已乘入氦的 $1.33$ 质量修正；恒星盘和核球速度项按 $3.6\,\mu{\rm m}$ 波段 $\Upsilon=1$ 提供。NGC3198 在该分解中的核球列全为零。

分量在势和径向力层面相加：

$$
v_b^2=V_{\rm gas}|V_{\rm gas}|
+\Upsilon_d V_{\rm disk}|V_{\rm disk}|.
$$

有六行 $V_{\rm gas}<0$。这是作者用带符号的“速度”记录局部向外的径向引力贡献：气体中心凹陷时，外部环带可以向外拉。它不是气体质量为负，也不是在这里报告反向公转。把每项无条件平方会丢掉这个信息。

本页暗晕选择有核对数势对应的圆速度

$$
v_h^2(r)=v_\infty^2\frac{r^2}{r^2+r_c^2},
\qquad v_{\rm model}^2=v_b^2+v_h^2.
$$

它的球对称密度为

$$
\rho_h(r)=\frac{v_\infty^2}{4\pi G}
\frac{r^2+3r_c^2}{(r^2+r_c^2)^2}.
$$

中心有限、外侧趋于 $r^{-2}$。若延伸到无穷远，总质量会发散，因此这只是本页径向范围内的参数化；它不是“已测出的唯一暗晕”。

改变距离为 $D$ 时，本页用 $d=D/D_0$ 缩放 $r\mapsto dr$、重子平方贡献 $\mapsto d v_b^2$。后者来自固定角分布下质量按 $D^2$、尺度按 $D$ 变化。改变平均倾角时，用 $\sin i_0/\sin i$ 同时缩放发布的速度和逐点速度误差。这是明确的校准敏感性实验，没有重新拟合三维数据立方、盘翘曲或表面亮度反投影。

### 加权残差和“最优”的范围

对每一行定义

$$
z_i=\frac{v_{\rm model}(r_i)-v_{{\rm obs},i}}{\epsilon_i},
\qquad \chi^2_{\rm diag}=\sum_{i=1}^{43}z_i^2.
$$

表列 $\epsilon_i$ 描述局部非圆运动与运动学不对称等误差，不包含完整倾角系统误差。这里也没有完整的协方差矩阵，所以保留“对角加权平方残差”的名称，不输出一个未经误差模型支持的显著性或粒子置信度。

为了让扫描可复算，固定 $\Upsilon_d,D,i$，只取 $r_c=0.5,0.6,\ldots,15.0\ {\rm kpc}$ 的 **146 个核半径**。在每个核半径下，令 $A=v_\infty^2\in[0,300^2]$，记 $b_i=v_b^2(r_i)$、$q_i=r_i^2/(r_i^2+r_c^2)$，则

$$
\frac{d\chi^2_{\rm diag}}{dA}
=\sum_i\frac{q_i}{\epsilon_i^2}
\left(1-\frac{v_{{\rm obs},i}}{\sqrt{b_i+Aq_i}}\right),
\qquad
\frac{d^2\chi^2_{\rm diag}}{dA^2}
=\sum_i\frac{v_{{\rm obs},i}q_i^2}
{2\epsilon_i^2(b_i+Aq_i)^{3/2}}>0.
$$

本数据和输入范围内 $b_i>0,v_{{\rm obs},i}>0$，所以这是一维严格凸问题。看端点导数即可判断边界极小值；否则对一阶导数二分。实验列出所有核半径的结果和最终 $A$ 区间，然后比较这些有限候选。它没有证明核半径连续域的全局最优，也没有探索其他暗晕族。

默认条件下，这个扫描给 $r_c=5.5\ {\rm kpc}$、$v_\infty\simeq134.2615\ {\rm km\,s^{-1}}$、$\chi^2_{\rm diag}\simeq32.4286$。它与手动默认 $134$ 的结果略有差别，二者不会被混成同一个数字。

## 4. 球对称基准：用守恒质量解释曲线

为了把几何条件控制住，第二个场景取 $G=1$，定义

$$
M_b(<r)=M_b\left[1-e^{-x}(1+x)\right],
\qquad x=r/R_d.
$$

这借用了二维指数盘的累计质量形状，但**把引力求解明确改成球对称**；不声称是精确薄盘势。对应的三维密度为

$$
\rho_b(r)=\frac{M_b e^{-r/R_d}}{4\pi R_d^2r}.
$$

中心有可积的 $1/r$ 尖点，总质量有限。小 $x$ 时
$1-e^{-x}(1+x)=x^2/2-x^3/3+x^4/8-\cdots$；数值程序用稳定级数，避免相近数相减把小质量误算成零。

由同一 $M_b(<r)$ 得 $v_b^2=M_b(<r)/r$。暗晕也从前节的 $v_h$ 推出 $M_h(<r)=rv_h^2$；表格同时列质量、密度和解析局部斜率，逐点检查 $dM/dr=4\pi r^2\rho$。这比只画三条任意归一化曲线多了一本守恒账。

### MOND 在这里究竟算了什么？

在球对称、孤立、静态的基准中，采用 simple 插值函数 $\mu(x)=x/(1+x)$：

$$
\mu(g/a_0)g=g_N
\quad\Longrightarrow\quad
g=\frac{g_N+\sqrt{g_N^2+4g_Na_0}}2.
$$

取圆速度 $v^2=gr$。高加速度端趋于 Newton；在有限重子质量的远处深 MOND 区，

$$
g\simeq\sqrt{g_Na_0}
=\frac{\sqrt{GM_ba_0}}r,
\qquad v_\infty^4=GM_ba_0.
$$

这解释了重子 Tully–Fisher 标度为何是一个必须认真面对的星系规律。表中的 $rv_{\rm MOND}^2/G$ 仅是若用 Newton 公式强行翻译所得的**等效质量**，不是该理论另外添加的一份粒子暗晕。

真实非球形系统可能需要求解相应场方程，并处理外场效应。不能把上述球对称代数关系直接宣称为任意盘的精确 MOND 解，也不能凭这一个关系判决全部宇宙学。

## 5. Jeans 反演：看不见的运动方向如何影响称重？

球对称、无净转动、稳态系统定义

$$
\beta=1-\frac{\sigma_\theta^2+\sigma_\phi^2}{2\sigma_r^2}.
$$

$\beta=0$ 表示各向同性，$\beta>0$ 偏径向，$\beta<0$ 偏切向。球对称 Jeans 方程给

$$
\frac{d(\nu\sigma_r^2)}{dr}
+\frac{2\beta}{r}\nu\sigma_r^2
=-\nu\frac{GM(<r)}{r^2}.
$$

因此

$$
M(<r)=-\frac{r\sigma_r^2}{G}
\left[\frac{d\ln(\nu\sigma_r^2)}{d\ln r}+2\beta\right].
$$

但外部星系通常主要提供视线速度，不是每颗恒星的三维速度。投影观测满足

$$
\Sigma(R)=2\int_R^\infty\frac{\nu(r)r\,dr}{\sqrt{r^2-R^2}},
\qquad
\Sigma(R)\sigma_{\rm los}^2(R)
=2\int_R^\infty
\left(1-\beta\frac{R^2}{r^2}\right)
\frac{\nu(r)\sigma_r^2(r)r\,dr}{\sqrt{r^2-R^2}}.
$$

只给 $\Sigma$ 和 $\sigma_{\rm los}$，通常不能唯一拆出 $\sigma_r$、$\beta$ 和 $M$。更多示踪族、适当的自行测量、透镜或更高阶速度统计可以补充约束，但各自也要建模。

### 一个能完整复算的投影例子

令示踪密度 $\nu\propto r^{-\gamma}$，背景势有常圆速度 $v_c$，$\beta$ 为常数。Jeans 方程的常弥散解是

$$
\sigma_r^2=\frac{v_c^2}{\gamma-2\beta}.
$$

本实验限定 $2\le\gamma\le5,-1\le\beta\le0.9$，保证分母为正。把 $r=R/\cos\theta$ 代入投影积分，可约掉共同因子，得到

$$
\frac{\sigma_{\rm los}^2}{\sigma_r^2}
=\frac{\int_0^{\pi/2}(1-\beta\cos^2\theta)
\cos^{\gamma-2}\theta\,d\theta}
{\int_0^{\pi/2}\cos^{\gamma-2}\theta\,d\theta}
=1-\beta\frac{\gamma-1}{\gamma}.
$$

最后一步用分部积分递推
$\int\cos^\gamma\theta\,d\theta=
[(\gamma-1)/\gamma]\int\cos^{\gamma-2}\theta\,d\theta$，积分区间均为 $[0,\pi/2]$。于是保持观测弥散不变时，

$$
v_c^2=\sigma_{\rm los}^2
\frac{\gamma-2\beta}{1-\beta(\gamma-1)/\gamma}.
$$

实验保留所有 $\beta$ 节点、投影权重和质量。$\gamma=4$ 时改变 $\beta$ 会改变质量；**$\gamma=3$ 时比值恰好恒为 $3$**，在这个理想化模型内消除了 $\beta$ 的影响。这有助于理解为什么一些特定半径附近的质量估计较稳健，但不是“任何星系、任何半径、任何各向异性都不重要”的定理。

这个解也不只是形式上的矩方程：在 $\Phi=v_c^2\ln(r/r_0)$ 中，取

$$
f(E,L)\propto L^{-2\beta}
\exp\left[-\frac{\gamma-2\beta}{v_c^2}E\right]
$$

可构造非负、速度积分收敛的分布函数，得到同样的密度幂律和弥散。它依赖 $\beta<1,\gamma>2\beta$。但无限延伸的对数势总质量发散，示踪幂律也不能在两端同时代表有限真实星系；这里用它验证局部尺度关系与投影机制。

## 6. 位力定理与透镜：不同方法补不同信息

从惯性矩 $I=\sum m_i r_i^2$ 两次求导，在孤立、自引力 Newton 系统中得 $\tfrac12\ddot I=2K+W$。束缚、适当时间平均且边界通量可忽略时，平均 $\ddot I$ 消失，给 $2K+W=0$。受潮汐作用、有显著边界项或正在并合的系统需补项。

因此 $M\sim C\sigma^2R/G$ 的结构因子 $C$ 不是一个对所有星系都固定为 $1$ 的常数。例如 $\sigma=1000\ {\rm km\,s^{-1}},R=1\ {\rm Mpc}$ 时，先得到 $\sigma^2R/G\simeq2.3250\times10^{14}M_\odot$；再选有根据的结构模型，才能确定 $C$。

引力透镜不需要恒星轨道各向异性，但依然使用引力理论、源和透镜距离及投影质量模型。弱透镜形变常约束约化剪切 $g=\gamma_{\rm lens}/(1-\kappa)$；变换

$$
\kappa\mapsto\lambda\kappa+(1-\lambda),
\qquad
\gamma_{\rm lens}\mapsto\lambda\gamma_{\rm lens}
$$

保持 $g$ 不变。这是质量片简并的一种表现。多源红移、放大信息、时间延迟或外部质量约束可以帮助打破简并；“不依赖恒星动力学”不等于“没有模型退化”。[质量片简并及源红移信息的适用条件](https://arxiv.org/abs/astro-ph/0405357)

## 7. 暗物质证据：跨尺度一致，不是一个图例

| 证据 | 直接约束的层次 | 要保留的条件 |
|---|---|---|
| 旋转曲线、恒星运动 | 径向引力和相空间结构 | 几何、稳态、支撑方式与示踪选择 |
| 星系团透镜和热气体 | 投影引力、气体分布与动力学 | 透镜简并；气体静力平衡或并合状态 |
| 碰撞星系团 | 引力质量中心与碰撞气体的空间关系 | 具体几何、引力理论与系统误差 |
| BBN 与 CMB | 重子密度、早期成分与扰动演化 | 核反应、复合、初始条件及宇宙学模型 |
| 大尺度结构 | 不同时期的密度与速度统计 | 偏置、非线性、重子过程与选择函数 |

在标准 GR 与 $\Lambda$CDM 框架下，非重子暗成分能共同解释这些资料。不能说某两个 CMB 峰高单独“直接读出精确的暗物质比”；参数来自完整模型对多项数据的联合拟合。

“冷”描述结构形成时期的有效速度与自由流尺度，不是实验室温度，也不只由粒子质量决定。标准模型中微子确实构成一小部分已知的热暗物质；限制是它们**不能充当主导的冷暗物质成分**。足够冷的非热产生粒子、温暗物质和混合成分要按各自产生史与结构预言检验。

候选包括轴子或类轴子、不同质量和相互作用的粒子、部分原初黑洞方案等。排除图限定的是质量、丰度、截面和天体物理假设的组合；“某类候选被全部排除”需要比一条上限曲线更强的证据。候选尚未获得公认的微观身份确认。[PDG 暗物质综述，2025 修订](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-dark-matter.pdf)

### 如何公平比较替代理论？

MOND 型星系规律是对任何星系形成理论都重要的约束。简单的星系加速度公式自身没有给出完整的透镜和宇宙学；但不能把它的缺项等同于所有相对论扩展已被逻辑排除。例如已有标量—矢量—张量扩展给出与线性 CMB 和物质功率谱相容的构造。这并不自动证明该理论解释全部非线性星系团和星系数据，仍需逐项比较新增场、稳定性和独立预言。[Skordis 与 Złośnik 的原始构造](https://arxiv.org/abs/2007.00082)

小尺度比较同样需要区分仅暗物质模拟与包含气体、恒星形成和反馈的模拟。探测不完备会影响卫星数目，重子作用会改变内区密度；剩余张力可以促使模型改进或约束新物理，不能忽略误差账后只挑一张图宣布胜负。

## 8. 形态、旋臂与研究入口

哈勃形态分类描述外观，不等于一条确定的演化年龄序列。椭圆星系常有较老星族和较强弥散支撑，旋涡星系常有气体和盘旋转，但真实系统有连续变化、环境作用和例外。

旋臂也不应一概写成“永恒的密度波”。准稳态波、瞬变再生结构、棒驱动和潮汐激发都可能参与；图样速度不一定在所有半径相同。区分图样与恒星运动仍然重要，但“恒星穿过固定堵点”的类比只对应其中一类情境。[旋臂动力学机制综述](https://arxiv.org/abs/1407.5062)

进入研究时，可以沿三个方向扩展本页：用更多示踪族与选择函数检验 Jeans 假设；在真实二维速度场或三维谱线数据立方中比较盘与晕；把星系动力学、透镜、恒星流和宇宙学的不同尺度约束放入一致模型。基础模型仍然负责检查单位、守恒、边界和可辨识性。

## 9. 完整练习

### 练习 A：外缘数据与气体项的负号

用 NGC3198 最后一行 $V_{\rm gas}=47.84,V_{\rm disk}=61.63$，取 $\Upsilon_d=0.5$，算重子圆速度。再解释 $r=2.89\ {\rm kpc}$ 的 $V_{\rm gas}=-1.43$ 应怎样加入。

<details class="answer" markdown="1"><summary>展开有符号径向力</summary>

外缘有 $v_b^2=47.84^2+0.5(61.63)^2=4187.79405\ ({\rm km\,s^{-1}})^2$，故 $v_b\simeq64.7132\ {\rm km\,s^{-1}}$。内侧负气体项为 $(-1.43)|-1.43|=-2.0449\ ({\rm km\,s^{-1}})^2$。它减少净向内的径向力贡献；不能先去掉符号再平方，也不能把它解读成负质量。

</details>

### 练习 B：平坦和开普勒外缘

从 $M=rv^2/G$ 推导 $\rho$；为什么 $\alpha=-1/2$ 不能直接读成非零的 $\rho\propto r^{-3}$？

<details class="answer" markdown="1"><summary>展开导数与零系数</summary>

若 $v=Cr^\alpha$，则 $M=C^2r^{1+2\alpha}/G$，微分并除以 $4\pi r^2$ 得

$$
\rho=\frac{(1+2\alpha)C^2}{4\pi G}r^{2\alpha-2}.
$$

$\alpha=0$ 给正的 $r^{-2}$；$\alpha=-1/2$ 时整个导数为零，意味着该外区没有继续增加包围质量。一般密度幂律 $\rho\propto r^{-\gamma}$ 的积分关系要同时检查系数、内边界和收敛条件，不能只对比指数。

</details>

### 练习 C：相同弥散下的不同质量

取 $\sigma_{\rm los}=150\ {\rm km\,s^{-1}},R=10\ {\rm kpc}$，比较 $\gamma=4$ 时 $\beta=0$ 与 $\beta=0.5$ 的质量；再取 $\gamma=3$。

<details class="answer" markdown="1"><summary>展开投影因子</summary>

$\gamma=4,\beta=0$ 给 $v_c^2=4\sigma_{\rm los}^2$，故 $v_c=300\ {\rm km\,s^{-1}}$，$M\simeq2.0925\times10^{11}M_\odot$。改取 $\beta=0.5$，分母是 $1-0.5(3/4)=0.625$，分子是 $4-1=3$，于是 $v_c^2=4.8\sigma_{\rm los}^2$，质量增加 $20\%$，而观测弥散完全相同。

$\gamma=3$ 时 $(3-2\beta)/(1-2\beta/3)=3$，在允许范围内与 $\beta$ 无关，给 $v_c=150\sqrt3\ {\rm km\,s^{-1}}$。抵消来自本模型的幂律、常圆速度与常各向异性条件，不能无条件移植到真实系统。

</details>

### 练习 D：拟合得好，为什么还不能识别粒子？

假设某个参数化晕降低了 43 点的平方残差。至少指出四个仍未解决的问题，并计算 $\kappa=0.3,\gamma_{\rm lens}=0.2,\lambda=0.8$ 的质量片变换。

<details class="answer" markdown="1"><summary>展开模型判断与透镜简并</summary>

仍要核对几何与非圆运动、距离和倾角共享误差、恒星质量光度比、数据协方差与选择函数、其他晕族及其他尺度的预言。粒子质量或相互作用不在这个旋转曲线参数组中，不能从较小残差直接读出。

原约化剪切为 $g=0.2/0.7=2/7$；变换后 $\kappa'=0.8(0.3)+0.2=0.44$，$\gamma'=0.16$，所以 $g'=0.16/0.56=2/7$。不同的会聚与剪切仍给同一约化剪切，说明补充观测要针对退化本身。

</details>

数据与方法：[SPARC 作者数据入口](https://astroweb.case.edu/SPARC/)、[质量模型原表](https://astroweb.case.edu/SPARC/MassModels_Lelli2016c.mrt)、[样本、距离、倾角与原始观测文献](https://astroweb.case.edu/SPARC/SPARC_Lelli2016c.mrt)、[SPARC 原论文 §3.2–3.3](https://astroweb.case.edu/ssm/papers/AJv152n157.pdf)、[球对称 Jeans 与投影所需条件](https://galaxiesbook.org/chapters/I-04.-Equilibria-of-Collisionless-Stellar-Systems_4-The-Jeans-equations.html)。

本地冻结资料：[数据说明](assets/learning/projects/sparc-ngc3198/README.md)、[全部43行原文](assets/learning/projects/sparc-ngc3198/NGC3198-extract.txt)、[结构化数值](assets/learning/projects/sparc-ngc3198/NGC3198.json)、[版本与校验和](assets/learning/projects/sparc-ngc3198/manifest.json)。
