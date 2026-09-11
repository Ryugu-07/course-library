# 高量 III · 路径积分与密度矩阵

> **前置**：[作用量与变分](mech-02-lagrange.html)、[量子态与测量](qm-01-framework.html)、高斯积分和矩阵特征值。读完本页，应能从带归一化的短时核得到一个可计算的路径积分，区分离散误差与抽样误差，再解释条件轨迹怎样平均成密度矩阵。

“把许多路径加起来”听起来很直观，但加什么、按什么权重加，决定了它是哪一种理论。本页始终区分三件事：

| 对象 | 加起来的量 | 本页实例 |
| --- | --- | --- |
| 实时间路径积分 | 带相位的复振幅 | 自由传播子与驻相近似 |
| 欧氏路径积分 | 本例中为正的高斯权重 | 热平衡谐振子的周期虚时配置 |
| 量子跳跃系综 | 给定监测方案的记录概率 | 光子计数下的一条阶跃及其平均 |

后两个实验都有随机数，却不能互相解释成同一类“粒子走过的路线”。先弄清每个实验计算的对象，再读图。

<div class="path-density-course" markdown="1">
<style>.path-density-course .learning-lab{margin-left:0;margin-right:0;width:100%}.path-density-course .fallback-scroll{overflow:auto;max-width:100%}.path-density-course .fallback-scroll td{overflow-wrap:anywhere}.path-density-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.path-density-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>

<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：同样画成路径，究竟在平均什么？

先看两个实验的输入和预测题。第一个实验研究热平衡谐振子的周期虚时配置，对应第1—7节；第二个实验研究光子计数的条件记录，对应第8—12节。暂时无法判断时，沿正文找到相应推导，再回来核对。切换到速查模式时，这一实验区收起，完整推导与练习仍可阅读。

### 实验一：虚时配置、切片数与样本数

<div class="learning-lab" data-learning-lab="euclidean-paths" markdown="1">

<figure class="plot" markdown="1">
[![周期虚时的四个固定场景](assets/img/aqm-03-euclidean-paths.svg)](assets/img/aqm-03-euclidean-paths.svg)
<figcaption>图3.1：打开原图，分别比较切片数与样本数的作用。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="周期虚时的四个固定场景固定记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>基准：N</td><td>8</td></tr>
<tr><td>基准：M</td><td>32</td></tr>
<tr><td>基准：ZN</td><td>0.4269072194757818</td></tr>
<tr><td>基准：热能EN</td><td>0.6523800866955108</td></tr>
<tr><td>基准：有限N方差</td><td>0.6523800866955116</td></tr>
<tr><td>基准：连续方差</td><td>0.6565176427496657</td></tr>
<tr><td>基准：样本方差估计</td><td>0.7902335895539169</td></tr>
<tr><td>基准：样本标准误</td><td>0.1630950216738779</td></tr>
<tr><td>单切片：ZN</td><td>0.49999999999999994</td></tr>
<tr><td>单切片：热能EN</td><td>0.5</td></tr>
<tr><td>较低温：log ZN</td><td>-3.8492413939404737</td></tr>
<tr><td>较低温：连续log Z</td><td>-3.999664481091923</td></tr>
<tr><td>软振子：有限N方差</td><td>16.331613675423963</td></tr>
<tr><td>软振子：样本方差估计</td><td>11.295254530679161</td></tr>
</tbody></table>
</div>

[下载两个实验的八组完整固定记录(JSON)](assets/learning/projects/quantum-path-density/run-snapshot.json)。路径实验取ℏ=1；四组种子均为20260912，样本数均32。各组参数写在图注，完整矩阵、随机整数、样本与所有收敛节点保存在JSON中。


</div>

### 实验二：光子计数、阶跃与删失

<div class="learning-lab" data-learning-lab="quantum-jump" markdown="1">

<figure class="plot" markdown="1">
[![量子跳跃的两个固定场景](assets/img/aqm-03-quantum-jump.svg)](assets/img/aqm-03-quantum-jump.svg)
<figcaption>图3.2：这里的时间是监测时间；它与前图的虚时含义不同。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="量子跳跃的两个固定场景固定记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>基准：轨迹数</td><td>32</td></tr>
<tr><td>基准：窗口T</td><td>4</td></tr>
<tr><td>基准：当前t</td><td>1.5</td></tr>
<tr><td>基准：样本P1</td><td>0.25</td></tr>
<tr><td>基准：解析P1</td><td>0.22313016014842982</td></tr>
<tr><td>基准：解析标准误</td><td>0.07360007892755743</td></tr>
<tr><td>基准：窗口内事件数</td><td>32</td></tr>
<tr><td>基准：右删失数</td><td>0</td></tr>
<tr><td>零窗口：右删失数</td><td>8</td></tr>
<tr><td>零窗口：首个随机整数</td><td>0</td></tr>
<tr><td>零窗口：首个u</td><td>1.1641532182693481e-10</td></tr>
<tr><td>零窗口：完整τ</td><td>1.1641532183371108e-10</td></tr>
</tbody></table>
</div>

[下载两个实验的八组完整固定记录(JSON)](assets/learning/projects/quantum-path-density/run-snapshot.json)。正率模型保存完整模拟τ和窗口内实际可用记录；零率结构性永不跳用null跳跃时间配合明确状态标记表示，不作为缺失数据。无脚本手算可取γ=1、u=1/2，得到τ=ln2；若T小于ln2，记录为右删失。


</div>

</section>

## 1. 先算一个完整的传播子

传播子回答的是：已知初始波函数，怎样得到稍后的波函数？位置基采用通常的狄拉克归一化。对质量为正的自由粒子，在正时间间隔内插入动量完备关系：

$$
\psi(x_b,t)=\int_{\mathbb R}K_0(x_b,x_a;t)\psi(x_a,0)\,dx_a,
\qquad
K_0=\int_{\mathbb R}\frac{dp}{2\pi\hbar}
\exp\!\left[\frac{i}{\hbar}p(x_b-x_a)-\frac{it}{2m\hbar}p^2\right]
=\sqrt{\frac{m}{2\pi i\hbar t}}
\exp\!\left[\frac{im(x_b-x_a)^2}{2\hbar t}\right].
$$

最后一步是配方后的振荡高斯积分，可先加一个趋于零的高斯阻尼再取极限。平方根的分支由从正时间连续延拓的自由演化固定。

指数里的量确实是连接两点的经典自由粒子作用量，但前面的平方根同样重要。它保证传播子的合成律，也使短时间极限在分布意义下回到位置狄拉克函数。传播子是积分核，量纲为长度的倒数；不能把它单独的模平方当作一个已归一化的位置概率密度。

## 2. 时间切片：路径积分的测度从哪里来

现在令 Hamiltonian 为动能加局域势能。把总时间分成等长小段，在相邻演化算符之间插入位置完备关系。以左右对称的势能分裂为例：

$$
e^{-i\epsilon(\hat T+\hat V)/\hbar}
\simeq e^{-i\epsilon\hat V/(2\hbar)}e^{-i\epsilon\hat T/\hbar}e^{-i\epsilon\hat V/(2\hbar)},
\qquad
K_\epsilon(x',x)\simeq
\sqrt{\frac{m}{2\pi i\hbar\epsilon}}
\exp\!\left\{\frac{i}{\hbar}\left[
\frac{m(x'-x)^2}{2\epsilon}-\frac{\epsilon}{2}\bigl(V(x')+V(x)\bigr)
\right]\right\}.
$$

在足够光滑、相关算符运算有定义的情形，对称分裂的形式局部误差是三阶，固定总时间下对应二阶全局误差。对于无界算符，这不是一个不加定义域条件的统一算符范数断言；本页数值实验只处理可精确检查的谐振子。

把这些短时核相乘，中间位置全部积分。记两端固定，便得到：

$$
K(x_b,x_a;t)=\lim_{N\to\infty}
\left(\frac{m}{2\pi i\hbar\epsilon}\right)^{N/2}
\int_{\mathbb R^{N-1}}\prod_{j=1}^{N-1}dx_j\,
\exp\!\left\{\frac{i}{\hbar}\sum_{j=0}^{N-1}
\left[\frac{m(x_{j+1}-x_j)^2}{2\epsilon}
-\frac{\epsilon}{2}\bigl(V(x_{j+1})+V(x_j)\bigr)\right]\right\},
\quad \epsilon=\frac{t}{N},\ x_0=x_a,\ x_N=x_b.
$$

符号“路径测度”浓缩了积分、前因子和取极限的方法；它并不表示实时间路径空间上存在一个普通的均匀概率分布。忘掉每段的前因子，就会丢失传播子的归一化；只写作用量指数还不是完整计算。

## 3. 驻相说明经典极限，但没有删掉其他路径

在作用量相对普朗克常数很大的渐近问题中，邻近配置的相位通常变化很快。驻相点附近的一阶相位变化为零，因此这些区域可能给出主导贡献。对端点固定的变分，分部积分给出：

$$
\delta S=\int_{t_a}^{t_b}
\left(\frac{\partial L}{\partial x}-\frac{d}{dt}\frac{\partial L}{\partial\dot x}\right)\delta x\,dt,
\qquad \delta S=0\ \Longrightarrow\
\frac{d}{dt}\frac{\partial L}{\partial\dot x}=\frac{\partial L}{\partial x}.
$$

这解释了经典方程为何出现在量子振幅的近似计算中。有限普朗克常数下，非驻相区域没有被精确删除；驻相路径周围的涨落仍贡献前因子，还可能存在多个驻相点、焦散及隧穿问题。“最小”也不是普遍条件，经典作用量可以在鞍点驻定。

双缝实验可以把全部路径按经过哪条缝分成两族，先在每族内求振幅，再把两族振幅相加；它并不是严格只剩两条细线。带电粒子的 Aharonov–Bohm 相位差还给出一个重要检查：闭合回路上的相位差由磁通决定，取模一个整周相位。

$$
\Delta\phi=\frac{q}{\hbar}\oint\mathbf A\cdot d\boldsymbol\ell
=\frac{q\Phi_B}{\hbar}\pmod{2\pi}.
$$

可观测的是适当比较后的规范不变干涉相位；矢势在某个规范下的数值本身不是规范不变量。

## 4. 虚时核与配分函数：还差一次取迹

对自伴、下有界的 Hamiltonian，可以研究由实时间演化延拓得到的热半群。物理虚时记为长度量纲为时间的变量，逆温度则有能量倒数的量纲：

$$
K_E(x_b,x_a;\tau)=\langle x_b|e^{-\tau\hat H/\hbar}|x_a\rangle,
\qquad \beta=\frac{1}{k_BT},\qquad
Z(\beta)=\operatorname{Tr}e^{-\beta\hat H}
=\int dx\,K_E(x,x;\beta\hbar).
$$

因此热配分函数对应首尾相接、周期为逆温度乘普朗克常数的路径积分。任意固定端点的虚时传播子并不等于配分函数。全直线自由粒子的取迹含有无限空间体积，不能直接当成有限的热配分函数；下面加入正频率谐振子势，使取迹有限。

在本例中，虚时作用量的动能和势能都非负，权重可用于概率抽样。一般实时间振幅有相位振荡，费米体系等还可能出现符号问题；不能由这个正权重例子推出所有量子问题都已变成容易的经典随机模拟。

## 5. 周期谐振子：把路径积分变成一个有限矩阵

从这里到第7节，实验单位统一取普朗克常数为1。质量、频率和逆温度均为正，势能为二次势。短时核沿周期路径相乘后，每个位置的两个半份势能合成一份：

$$
Z_N=\left(\frac{m}{2\pi\epsilon}\right)^{N/2}
\int_{\mathbb R^N}d^Nx\,e^{-\frac12 x^TA_Nx},
\qquad
\frac12x^TA_Nx=\sum_{j=0}^{N-1}\left[
\frac{m}{2\epsilon}(x_{j+1}-x_j)^2+
\frac{\epsilon m\omega^2}{2}x_j^2\right],
\quad \epsilon=\frac{\beta}{N},\ x_N=x_0.
$$

每条周期边贡献一个差分的平方。只有一个切片时，该边连接同一个变量，动能项正好为零；两个切片时，两条周期边连接同一对变量，但都是作用量中的独立项，不能漏掉其中一条。按边装配矩阵比机械套用“三对角矩阵”的印象更可靠。

矩阵正定，所以多元高斯积分与协方差可直接计算：

$$
Z_N=\frac{(m/\epsilon)^{N/2}}{\sqrt{\det A_N}},
\qquad C_N=\langle xx^T\rangle_N=A_N^{-1},
\qquad \lambda_p=\frac{m}{\epsilon}
\left[4\sin^2\!\left(\frac{\pi p}{N}\right)+(\epsilon\omega)^2\right],
\quad p=0,\ldots,N-1.
$$

特征值来自周期离散 Fourier 模式：平移一个格点，只把该模式乘上一个单位复相位。矩阵计算和谱模式计算是两种互相核对的方法。

进一步设一个实数使双曲余弦匹配上面的特征值因子。用单位根分解多项式，可把整个乘积化简：

$$
a=2\operatorname{arsinh}\frac{\epsilon\omega}{2},\qquad
\prod_{p=0}^{N-1}\left(2\cosh a-2\cos\frac{2\pi p}{N}\right)
=e^{-Na}(e^{Na}-1)^2=4\sinh^2\frac{Na}{2},
\qquad
Z_N=\frac{1}{2\sinh\!\left[N\operatorname{arsinh}\frac{\beta\omega}{2N}\right]}.
$$

这里每个因子可写成两个单位根因子的乘积再除以指数因子，因而乘积恒等式也适用于一个、两个切片。取切片数趋于无穷，就得到连续谐振子配分函数。它也等于按谐振子能级求和的几何级数：

$$
Z=\frac{1}{2\sinh(\beta\omega/2)}
=\sum_{n=0}^{\infty}e^{-\beta\omega(n+1/2)}.
$$

这一次，路径积分与能级求和真正算出了同一个数；相等不再只是一句类比。

## 6. 不只比较配分函数：热能与相关函数也要闭合

固定切片数求逆温度导数，得到离散近似对应的热能。记双曲函数的总自变量为一个新符号：

$$
u_N=N\operatorname{arsinh}\frac{\beta\omega}{2N},\qquad
E_N=-\frac{\partial\log Z_N}{\partial\beta}
=\frac{\omega\coth u_N}{2\sqrt{1+(\beta\omega/2N)^2}},
\qquad E=\frac{\omega}{2}\coth\frac{\beta\omega}{2}.
$$

也可以先对积分的前因子和作用量求导，再用协方差计算期望。这会得到同一个离散热能：

$$
E_N=\frac{N}{2\beta}
-\frac{mN}{2\beta^2}\sum_j\langle(x_{j+1}-x_j)^2\rangle_N
+\frac{m\omega^2}{2N}\sum_j\langle x_j^2\rangle_N.
$$

前两项分别可能很大，组合才有有限的连续极限。实验中的“动能部分”指这个热力学估计量的前两项，不把有限切片下的每一项都直接等同于连续理论的某个独立可观测量。

相关函数进一步检查不同虚时位置的关联。连续热平均按给定的算符顺序定义；在本例中可用升降算符直接求得：

$$
C(\tau)=\frac{\operatorname{Tr}\left[e^{-(\beta-\tau)\hat H}\hat x e^{-\tau\hat H}\hat x\right]}{Z}
=\frac{\cosh[\omega(\beta/2-\tau)]}{2m\omega\sinh(\beta\omega/2)},
\quad 0\le\tau\le\beta;
\qquad
(C_N)_{0j}=\frac1N\sum_{p=0}^{N-1}\frac{\cos(2\pi pj/N)}{\lambda_p}.
$$

令虚时为零就得到位置方差。高温下连续方差趋向经典的逆温度、质量与频率平方乘积的倒数；低温下保留零点涨落，不能趋于零。质量加倍而频率保持不变时，能级和配分函数不变，位置方差减半。这里保持频率固定也意味着势的劲度随质量变化。

## 7. 实验一：先消除离散误差，还是先增加样本



实验先用 Cholesky 分解求行列式与逆矩阵，算出有限切片的精确高斯积分；再从这个高斯分布抽样。若下三角因子满足作用量矩阵等于它与转置的乘积，只须解一个三角方程：

$$
A_N=LL^T,\qquad z\sim\mathcal N(0,I),\qquad L^Tx=z
\ \Longrightarrow\ \mathbb E[xx^T]=L^{-T}L^{-1}=A_N^{-1},
\qquad \frac12x^TA_Nx=\frac12z^Tz.
$$

因此每条路径不需要 Markov 链就能直接抽到，且两种作用量计算可以逐条比较。本实验中的“独立样本”指目标抽样模型；固定种子的伪随机生成器用于可重复的数值演示，不等同于物理随机源。

建议按以下顺序操作：

1. 选“只有一个时间切片”，再选“细化到32片”。看精确有限切片曲线怎样靠近连续解析曲线。此时改变的是积分近似。
2. 回到基准，只把样本数从8增到128。精确有限切片结果保持原位；样本曲线会改变，但不会自动消除切片误差。
3. 查看“样本逐个加入”。累计均值会向上或向下走，单次误差不保证随样本数单调变小。
4. 换种子，再看同样的差与标准误。标准误描述重复抽样的波动尺度，不是当前这一次误差的保证上界。

样本相关函数采用已知理论均值为零的未中心化二阶矩。零均值高斯变量的四阶矩可分成三种配对，因此其解析标准误为：

$$
\widehat C_{0j}=\frac1M\sum_{r=1}^{M}x_0^{(r)}x_j^{(r)},\qquad
\operatorname{SE}(\widehat C_{0j})=
\sqrt{\frac{(C_N)_{00}(C_N)_{jj}+(C_N)_{0j}^2}{M}},
\qquad
\widehat C_{0j}-C(\tau_j)=
\bigl[\widehat C_{0j}-(C_N)_{0j}\bigr]+
\bigl[(C_N)_{0j}-C(\tau_j)\bigr].
$$

等式右边分别是抽样误差与切片误差。把它们混成一项，会让人误以为“再多抽一些样本”能解决所有偏差。图中的折线只连接格点配置，虚时也不是实验钟表时间；不要把首尾相接的路径当作粒子运动录像。

## 8. 密度矩阵：同一套语言容纳纯态、混合与热态

若以给定概率制备不同纯态，观测量的平均可以写成一次迹运算：

$$
\rho=\sum_r p_r|\psi_r\rangle\langle\psi_r|,
\qquad p_r\ge0,\quad\sum_rp_r=1,
\qquad
\langle A\rangle=\sum_rp_r\langle\psi_r|A|\psi_r\rangle=\operatorname{Tr}(\rho A).
$$

密度矩阵自伴、半正定且迹为1。反过来，具有这些性质的矩阵可由谱分解解释成一个系综。它的纯度是特征概率平方的和，因此不大于1，等号当且仅当只有一个非零特征值。于是纯态等价于秩一投影。

但系综分解并不唯一。例如二能级的半个单位矩阵，既可由基态和激发态各半制备，也可由两个相反的等幅叠加态各半制备。只拿到局部密度矩阵，不能唯一倒推出制备者“究竟选了哪一种纯态”。

封闭系统的酉演化保持密度矩阵的全部特征值；热态则由热算符归一化而来：

$$
\rho(t)=U(t)\rho(0)U(t)^\dagger,\qquad
i\hbar\dot\rho=[H,\rho],\qquad
\rho_\beta=\frac{e^{-\beta H}}{Z}.
$$

虚时热核常被称作“未归一化密度矩阵”；若要用它计算归一化热期望，就必须除以配分函数。对自由核和热核保留前因子的要求，在这里再次出现。

## 9. 约化态与退相干：环境记录改变了什么

复合系统处于纯态时，只观测其中一部分，需要对未观测部分取偏迹。以两量子比特的 Bell 态为例：

$$
|\Psi\rangle=\frac{|00\rangle+|11\rangle}{\sqrt2},\qquad
\rho_A=\sum_{b=0}^{1}\langle b|\Psi\rangle\langle\Psi|b\rangle
=\frac12\bigl(|0\rangle\langle0|+|1\rangle\langle1|\bigr).
$$

全局纯度是1，局部纯度是二分之一，局部 von Neumann 熵为自然对数单位下的一个“ln 2”。这不矛盾：全局相干性保存在两部分之间的关联里。全局为纯态时，局部混合与两部分纠缠等价；全局本就混合时不能直接使用这个等价判据。

更一般地，系统的两个分支分别把环境带到两个态：

$$
|\Psi(t)\rangle=\alpha|0\rangle|e_0(t)\rangle+\beta_1|1\rangle|e_1(t)\rangle,
\qquad
\rho_A(t)=\begin{pmatrix}
|\alpha|^2&\alpha\beta_1^*\langle e_1(t)|e_0(t)\rangle\\
\alpha^*\beta_1\langle e_0(t)|e_1(t)\rangle&|\beta_1|^2
\end{pmatrix}.
$$

环境越能区分两个分支，这个基底下的相干项就越小。这里把激发振幅写成带下标的符号，避免与逆温度混淆。若环境重叠恰好是一个随时间振荡的余弦，相干性就会消失后再恢复；所以“与环境纠缠”本身并不推出普遍的单调指数衰减。

指数退相干需要相应模型与近似，速率依赖耦合、环境谱、温度以及讨论的基底。对环境取迹也没有单独选择出一次测量的唯一结果。它说明了局部干涉为何受抑制，不能替代对测量记录和条件化的说明。

## 10. 量子跳跃：未归一化分支与条件态分开算

第二个实验只研究零温、无驱动、初始激发的两能级系统，环境按理想光子计数方案监测。唯一跳跃算符把激发态送到基态，非选择性主方程为：

$$
L=\sqrt\gamma\,|0\rangle\langle1|,\qquad
\dot\rho=L\rho L^\dagger-\frac12\{L^\dagger L,\rho\},\qquad \gamma\ge0.
$$

对于尚未记录到光子的分支，有效 Hamiltonian 含有非厄米项。这个分支先保持未归一化，才能记录它发生的概率：

$$
H_{\rm eff}=-\frac{i\hbar\gamma}{2}|1\rangle\langle1|,
\qquad |\widetilde\psi_{\rm nj}(t)\rangle=e^{-\gamma t/2}|1\rangle,
\qquad S(t)=\|\widetilde\psi_{\rm nj}(t)\|^2=e^{-\gamma t}.
$$

如果我们已经知道“截至当前没有光子”，必须把这个分支归一化，条件态仍是激发态，激发布居等于1。指数因子属于分支概率，不是归一化条件态里“还剩多少激发态”。

若跳跃在某时刻发生，施加跳跃算符并归一化就得到基态，此后本模型没有再次激发。因而跳跃时间和一条条件轨迹满足：

$$
f(\tau)=\gamma e^{-\gamma\tau},\qquad
\Pr(\tau>t)=e^{-\gamma t},\qquad
p_1^{(r)}(t)=\mathbf1_{\{\tau_r>t\}},\qquad
\rho(t)=\mathbb E[|\psi_\tau(t)\rangle\langle\psi_\tau(t)|]
=\begin{pmatrix}1-e^{-\gamma t}&0\\0&e^{-\gamma t}\end{pmatrix}.
$$

在数学上的跳跃时刻采用右连续约定，即该时刻已经跳到基态。单条记录是阶跃；忽略记录、按发生概率平均，才得到平滑的密度矩阵。零跳跃率是单独的边界：此时跳跃算符为零，跳跃时间为无穷，系统结构性地永不跳跃。

## 11. 实验二：窗口没有看到跳跃，不等于在窗口末端跳跃



正跳跃率下，实验用逆分布抽样得到完整模拟时间。均匀变量由32位随机整数格点的中点构造，保证严格位于开区间；完整记录同时保存整数和变换后的数值：

$$
u=\frac{J+1/2}{2^{32}},\quad J\in\{0,\ldots,2^{32}-1\},\qquad
\tau=-\frac{\ln(1-u)}{\gamma},\qquad
\widehat P_1(t)=\frac1M\sum_{r=1}^{M}\mathbf1_{\{\tau_r>t\}},
\quad \operatorname{SE}(\widehat P_1)=\sqrt{\frac{e^{-\gamma t}(1-e^{-\gamma t})}{M}}.
$$

这个整数生成器是有限精度的可重复近似，均匀变量不是连续分布的无限精度抽样。数值求跳跃时间使用稳定的对数形式；很小的失活概率也用稳定的指数差计算。此节公式用样本数区分于前面的切片数；量子跳跃控制面板沿用“轨迹数 N”的标记，它对应这里的样本数，不是虚时切片数。

先选四项预测，再核对。金色曲线是一条条件记录，蓝色阶梯是有限样本平均，绿色虚线是解析生存概率。改动当前时刻或轨迹编号可以继续观察；改变跳跃率、轨迹数、观察窗后重新预测。

如果完整模拟时间晚于观察窗末端，我们在这段记录中只知道“晚于窗口”，这是右删失。不能把它改写成窗口末端恰好发生跳跃。空心标记位于观察窗边缘，只表示删失；零跳跃率没有有限事件点。观察窗为零时，所有正率轨迹都右删失，图中只保留一个零刻度。

账本同时写出当前时刻与窗口末端的激发布居。某条轨迹可能将在窗口内跳跃，但当前时刻还没有跳；这两个陈述不能混写。固定种子方便重放，仍不能保证某次样本平均恰好等于解析曲线。

给定同一个初态和 Lindblad 生成元，不同的环境监测方式可给出不同的条件演化；例如光子计数的跳跃与 homodyne 的扩散型记录。完整平均后应恢复同一非选择性密度矩阵。本台没有模拟驱动、有限温向上跳跃、探测效率不足或非 Markov 记忆；这些变化都需要修改模型，而不只是换一个随机种子。

## 12. 练习：用一个可检验的结果判断自己是否理解

**题1：**自由粒子的两个短时传播子合成后，为什么不能只保留作用量指数？

<details class="answer" markdown="1">
<summary>答案：前因子随高斯积分一起合成</summary>

把两个自由传播核相乘，对中间位置积分。二次项的系数与两个时间间隔倒数之和成正比，高斯积分产生一个平方根因子。它和原来的两个前因子相乘，恰好得到总时间对应的一个前因子；指数配方后只剩两端点间的经典作用量。若开始就删除前因子，合成后的归一化与短时间狄拉克极限都无法成立。

</details>

**题2：**实验只有一个虚时切片时，配分函数是什么？它为什么看起来像经典结果，却不能给出低温零点能？

<details class="answer" markdown="1">
<summary>答案：自连接动能为零，但归一化还在</summary>

周期条件使位置差为零，矩阵只剩一个元素，即逆温度乘质量与频率平方。代入带前因子的高斯积分，配分函数等于逆温度乘频率的倒数，热能等于逆温度的倒数。它是这个单切片近似的精确值，也等于谐振子的经典相空间积分结果。低温连续量子结果却由基态能控制；必须细化切片才能恢复。这里“精确积分”只说明有限维积分算准了，不说明离散模型已等于原量子理论。

</details>

**题3：**保持频率、逆温度和切片数不变，质量加倍。为什么配分函数不变，而位置方差减半？

<details class="answer" markdown="1">
<summary>答案：行列式与前因子的质量幂抵消</summary>

作用量矩阵整体乘2，行列式乘以2的切片数次方，平方根因而乘以2的切片数一半次方。归一化前因子也乘同一个倍数，配分函数不变。逆矩阵则整体除以2，方差与相关函数随之减半。连续公式给出相同结论。若改为固定劲度而改变质量，频率也会改变，就不能套用这个结论。

</details>

**题4：**Bell 态的一边是半个单位矩阵，是否能断言整体只是“有一半概率为00、一半概率为11”的经典混合？

<details class="answer" markdown="1">
<summary>答案：相同局部态不决定全局关联</summary>

不能。Bell 纯态还包含两个分支之间的全局非对角项，经典混合没有。它们给出相同的单边密度矩阵，却可由联合测量区分。例如同时测量两边的 Pauli X，所用 Bell 态的乘积期望为1，而这个经典混合的乘积期望为0。偏迹保留了所有局部可观测信息，主动舍弃了仅在关联中可见的信息。

</details>

**题5：**把量子跳跃初态改成一般纯叠加态，为什么“没有跳时仍保持原态”不再成立？

<details class="answer" markdown="1">
<summary>答案：两个分量的未归一化衰减不同</summary>

基态振幅保持不变，激发振幅乘以指数衰减的平方根，所以归一化后两者的相对权重通常改变。令衰减因子为实数，完整的非选择性通道可以写成两个 Kraus 算符：

$$
q=e^{-\gamma t},\qquad
K_0=\begin{pmatrix}1&0\\0&\sqrt q\end{pmatrix},\qquad
K_1=\begin{pmatrix}0&\sqrt{1-q}\\0&0\end{pmatrix},\qquad
\rho(t)=K_0\rho(0)K_0^\dagger+K_1\rho(0)K_1^\dagger.
$$

两个算符的伴随乘积相加等于单位矩阵，保证保迹。未归一化无跳分支的范数平方变成基态初始概率加上激发初始概率乘衰减因子。跳跃分支仍到基态；总体相干项乘衰减因子的平方根，激发概率乘衰减因子。页面实验的“无跳条件激发布居始终为1”因此必须连同“初始就是激发态”一起使用。

</details>

**题6：**有限温模型增加向上跳跃通道后，长期激发概率应该是多少？

<details class="answer" markdown="1">
<summary>答案：由上下跃迁流平衡决定</summary>

设两个时间无关的非负速率分别控制向下、向上跳跃，且它们的和为正。激发概率满足一个带源项的速率方程：

$$
\dot p_1=\gamma_\uparrow(1-p_1)-\gamma_\downarrow p_1,
\qquad
p_1(t)=\frac{\gamma_\uparrow}{\gamma_\uparrow+\gamma_\downarrow}
+\left[p_1(0)-\frac{\gamma_\uparrow}{\gamma_\uparrow+\gamma_\downarrow}\right]
e^{-(\gamma_\uparrow+\gamma_\downarrow)t}.
$$

长期极限是向上速率占总速率的比例。跳到基态后仍可能再次向上跳，所以原来的单个指数等待时间加一次阶跃不够。要进一步称它为某温度的热平衡，还须让两个速率满足对应能隙的详细平衡关系。若两个速率都为零，状态保持初值，不能使用分母为零的稳态比例。

</details>

**继续阅读与研究接口。**谐振子的有限虚时传播子也是研究高阶分裂算法的可解测试对象；[Chin 的离散谐振子研究](https://arxiv.org/abs/2310.18809)讨论了更高阶短时传播子的结构与优化。本页只实现上面推导的基本对称分裂，不把高阶算法的收敛阶移植到当前实验。量子轨迹怎样与多体数值方法结合，可接着读 [Daley 的量子轨迹综述](https://arxiv.org/abs/1405.6694)第III—IV节，再进入本站的开放量子系统课程。

这两个方向各自有明确的下一步：前者改变短时近似并重新核对热量与相关函数；后者改变 Hamiltonian、跳跃通道或监测条件，并重新核对记录平均与主方程。先保留这两条可检验的联系，再扩展到更复杂模型。


</div>
