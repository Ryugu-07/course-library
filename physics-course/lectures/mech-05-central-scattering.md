# 力学 V · 中心势散射：有效势、冲量参数与 Rutherford 角分布

> **对标**：Taylor *Classical Mechanics* ch. scattering / Goldstein §3、§5 ｜ **前置**：mech-01（守恒量）、mech-02（变分与对称性）、mech-03（相空间）
> 把一束粒子射向一个看不见的中心，屏幕上为什么会出现一条有规律的角分布？中心势散射把“轨道长什么样”和“实验会数到多少粒子”接成一条链：角动量给出有效势，双曲线给出偏折角，冲量参数的面积元素给出微分截面。Rutherford 散射不是一条孤零零的公式，而是这三本账的合账。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="central-scattering-learning-title">

## 学习层：先猜一条轨道，再看它怎样变成角分布

<h3 id="central-scattering-learning-title">1. 具体谜题：没有接触，粒子为什么会转弯？</h3>

设一个带正电的入射粒子在远处有动能 $E$，与散射中心的初始侧向错开量为冲量参数 $b$。中心势取排斥的

$$
V(r)=\frac{\kappa}{r},\qquad \kappa>0.
$$

这里的 $r$ 是相对坐标，$\kappa$ 的单位是 MeV fm；实验台用的是 $\mu$ 已吸收到轨道尺度后的 MeV、fm 记账。以默认值 $E=2\ \mathrm{MeV}$、$b=3\ \mathrm{fm}$、$\kappa=2\ \mathrm{MeV\,fm}$ 为例，先不要看答案，预测：

1. 把 $b$ 变小，散射角 $\chi$ 会变大还是变小？
2. 固定 $b$ 和 $\kappa$，把入射能量提高，偏折会变强还是变弱？
3. 有角动量时，最近接点由 $V(r)=E$，还是由包含离心项的 $V_{\mathrm{eff}}(r)=E$ 决定？

“离中心越近，力越强”只是方向提示，还没有给出角度。可判决的量是角动量和径向能量预算。

<h3>2. 最小模型：两项势能，两个几何后果</h3>

远处速度为 $v_\infty$ 时

$$
E=\frac12\mu v_\infty^2,\qquad
L=\mu v_\infty b,\qquad
\frac{L^2}{2\mu}=E b^2.
$$

把平面运动的动能写成径向和切向两项：

$$
E=\frac12\mu\dot r^2+
\underbrace{\frac{L^2}{2\mu r^2}+\frac{\kappa}{r}}_{V_{\mathrm{eff}}(r)}.
$$

因此本实验的转向条件不是只看 Coulomb 势，而是
$E=V_{\mathrm{eff}}(r_{\min})$。令
$a=\kappa/(2E)$，解二次方程得到

$$
r_{\min}=a+\sqrt{a^2+b^2},\qquad
\chi=2\arctan\frac{a}{b}.
$$

在默认值下 $a=0.500\ \mathrm{fm}$，所以
$r_{\min}=3.541\ \mathrm{fm}$，$\chi=18.925^\circ$。最近接并不发生在 $r=b$；$b$ 是无相互作用时的直线偏移量，不是实际轨道的最短半径。

<h3>3. 动手实验：让有效势与屏幕读数同步</h3>

先完成三个预测，再打开实验台。四个预设分别强调基线、小 $b$、高能和强排斥。拖动 $E,b,\kappa$ 时，左图给出双曲线轨道的几何支线，右图画出总能量线与有效势的交点；下方把最近接距离、偏心率和微分截面分开显示。

<div class="learning-lab" data-learning-lab="physics-scattering-orbit" markdown="1">

**无 JavaScript 时的静态读法：**本页只讨论排斥 Coulomb 散射，$E$ 用 MeV，$b,r$ 用 fm，$\kappa$ 用 MeV fm。实验台的默认输入为
$E=2$、$b=3$、$\kappa=2$。定义

$$
a=\frac{\kappa}{2E}=0.500\ \mathrm{fm},\quad
r_{\min}=a+\sqrt{a^2+b^2},\quad
\chi=2\arctan(a/b).
$$

| 量 | 默认数值 | 由什么得到 |
|---|---:|---|
| 能量尺度 $E$ | $2.000\ \mathrm{MeV}$ | 远处相对动能 |
| 冲量参数 $b$ | $3.000\ \mathrm{fm}$ | 无相互作用入射直线的偏移 |
| Coulomb 长度 $a=\kappa/(2E)$ | $0.500\ \mathrm{fm}$ | 势强与能量之比 |
| 最近接距离 $r_{\min}$ | $3.541\ \mathrm{fm}$ | $E=V_{\mathrm{eff}}(r_{\min})$ |
| 偏折角 $\chi$ | $18.925^\circ$ | $\chi=2\arctan(a/b)$ |
| 双曲线偏心率 $\varepsilon$ | $6.083$ | $\sqrt{1+(b/a)^2}$ |
| 微分截面 $d\sigma/d\Omega$ | $85.563\ \mathrm{fm^2/sr}$ | $(\kappa/4E)^2\csc^4(\chi/2)$ |

在这个默认点，$V_{\mathrm{eff}}(r_{\min})=2.000\ \mathrm{MeV}$。若把 $b$ 从 $3$ 减小到 $1\ \mathrm{fm}$，同样的公式给出更大的 $\chi$；若把 $E$ 从 $2$ 提高到 $8\ \mathrm{MeV}$，$a$ 变成 $0.125\ \mathrm{fm}$，偏折减弱。

<h3>4. 误区、反例与适用边界</h3>

- **$b$ 不是最近接距离。**它是无穷远入射线的几何参数；只有没有力时轨道才是一条与中心保持 $b$ 的直线。
- **有效势不是额外的物理力。**$L^2/(2\mu r^2)$ 是把切向动能用 $r$ 表示后出现的径向势垒；它编码了角动量守恒。
- **微分截面不是某一个粒子的概率。**$d\sigma/d\Omega$ 把一圈冲量参数环带映到一个立体角环带；真正的计数还要乘入射通量、靶数和探测器立体角。
- **单条经典轨道不是 Rutherford 公式成立的必要条件。**当 de Broglie 波长与 $b$ 可比时，确定轨道的图像失效；但对理想、未屏蔽、非相对论 Coulomb 势，精确量子散射仍给出 Rutherford 角分布。真正会改动分布的因素包括电子屏蔽、有限核半径、自旋与全同性、相对论修正和多重散射。
- **正碰是极限而不是普通双曲线。**$b=0$ 时 $L=0$，轨道退化为径向反弹；实验台仍给 $\chi=180^\circ$ 与 $r_{\min}=\kappa/E$，但不能再用含 $b/a$ 的非退化轨道图像。

<h3>5. 迁移题：从一组数字反推整个链条</h3>

取 $E=4\ \mathrm{MeV}$、$b=2\ \mathrm{fm}$、$\kappa=2\ \mathrm{MeV\,fm}$。先手算
$a$、$r_{\min}$ 和 $\chi$，再用

$$
\frac{d\sigma}{d\Omega}
=\left(\frac{\kappa}{4E}\right)^2
\frac{1}{\sin^4(\chi/2)}
$$

估计角分布。你应得到 $a=0.250\ \mathrm{fm}$、$r_{\min}\approx2.266\ \mathrm{fm}$、$\chi\approx14.251^\circ$，以及约 $66.016\ \mathrm{fm^2/sr}$。最后说明：为什么同一个 $a/b$ 同时出现在轨道偏折和截面公式中？这一步要求你把“轨道问题”和“统计多少条轨道”接回同一几何参数。

</div>

</section>

## 1. 从实验坐标到相对坐标

两粒子质量为 $m_1,m_2$，位置为 $\mathbf r_1,\mathbf r_2$。用质心坐标

$$
\mathbf R=\frac{m_1\mathbf r_1+m_2\mathbf r_2}{m_1+m_2},
\qquad
\mathbf r=\mathbf r_1-\mathbf r_2
$$

分离平动与相对运动。动能成为

$$
T=\frac12 M\dot{\mathbf R}^{\,2}
+\frac12\mu\dot{\mathbf r}^{\,2},
\qquad
M=m_1+m_2,\quad
\mu=\frac{m_1m_2}{m_1+m_2}.
$$

若势能只依赖 $r=|\mathbf r|$，质心匀速，真正的散射动力学只需研究约化质量 $\mu$ 在平面内的中心势运动。这一步给出的 $\chi$ 是相对运动、也就是质心系中的散射角。实验室实际看到的是各粒子的实验室系角度；只有在散射中心固定或靶质量 $m_2\gg m_1$ 时，入射粒子的实验室角才近似等于 $\chi$。质量可比时必须再做参考系变换。

中心力 $\mathbf F(r)=F(r)\hat{\mathbf r}$ 的力矩为零：

$$
\boldsymbol\tau=\mathbf r\times\mathbf F=0
\quad\Longrightarrow\quad
\mathbf L=\mu\mathbf r\times\dot{\mathbf r}
\ \text{守恒}.
$$

因此轨道被限制在垂直于 $\mathbf L$ 的平面。用极坐标，

$$
T=\frac12\mu\left(\dot r^2+r^2\dot\phi^2\right),
\qquad
L=\mu r^2\dot\phi.
$$

角向运动的速度不是独立自由度：$\dot\phi=L/(\mu r^2)$。这就是离心项的来源。

## 2. 有效势：把二维轨道变成一维预算

能量守恒写成

$$
E=\frac12\mu\dot r^2+V_{\mathrm{eff}}(r),\qquad
V_{\mathrm{eff}}(r)=V(r)+\frac{L^2}{2\mu r^2}.
$$

径向运动允许出现的区域必须满足 $E\ge V_{\mathrm{eff}}(r)$。当 $\dot r=0$ 时到达转向点；在排斥 Coulomb 势中，入射粒子先靠近、在 $r_{\min}$ 停止径向靠近，再离开。把

$$
L=\mu v_\infty b,\qquad E=\frac12\mu v_\infty^2
$$

代入，有 $L^2/(2\mu)=Eb^2$，于是

$$
E r_{\min}^2-\kappa r_{\min}-Eb^2=0.
$$

取正根正好得到学习层的
$r_{\min}=a+\sqrt{a^2+b^2}$。另一个根为负，不代表一个额外的物理半径。

对吸引势，$V=-\kappa/r$，有效势可能没有同样的排斥转向结构；若再加入有限尺寸、耗散或捕获半径，$E=V_{\mathrm{eff}}$ 的根和轨道分类都要重新检查。有效势法的普遍性在于它依赖中心对称与守恒量，不依赖 Coulomb 这一特殊形式。

## 3. Coulomb 轨道：为什么是双曲线

令 $u=1/r$，用

$$
\frac{d\phi}{dt}=\frac{L}{\mu r^2}
$$

把时间导数改成角度导数。中心势轨道方程为

$$
\frac{d^2u}{d\phi^2}+u
=-\frac{\mu}{L^2u^2}F(1/u).
$$

排斥 Coulomb 力为 $F(r)=\kappa/r^2$，带方向的径向力写入后得到常系数方程

$$
\frac{d^2u}{d\phi^2}+u
=-\frac{\mu\kappa}{L^2}.
$$

选取最近接方向为 $\phi=0$，解可写成

$$
u(\phi)=\frac{\mu\kappa}{L^2}
\left(\varepsilon\cos\phi-1\right),
\qquad
\varepsilon=\sqrt{1+\frac{2EL^2}{\mu\kappa^2}}
=\sqrt{1+\left(\frac{b}{a}\right)^2}.
$$

当 $b>0$ 时 $\varepsilon>1$，这是双曲线；当 $b=0$ 时 $\varepsilon=1$，退化为正碰。无穷远处 $u\to0$，所以

$$
\cos\phi_\infty=\frac1\varepsilon.
$$

两条无穷远渐近线关于最近接方向对称，几何角度整理为

$$
\chi=2\arctan\frac{a}{b}.
$$

这说明偏折角不是通过逐点积分“猜”出来的；在 $1/r$ 势中，守恒量和圆锥曲线已经把积分压缩成代数关系。

## 4. 从冲量参数到 Rutherford 微分截面

一圈入射轨道的冲量参数在 $b$ 与 $b+db$ 之间，远处横截面积为

$$
d\sigma=2\pi b\,db.
$$

中心对称使出射方向只由极角 $\chi$ 决定，对应立体角环带

$$
d\Omega=2\pi\sin\chi\,d\chi.
$$

由

$$
b=a\cot\frac{\chi}{2},
\qquad
\left|\frac{db}{d\chi}\right|
=\frac a2\csc^2\frac{\chi}{2}
$$

得到

$$
\frac{d\sigma}{d\Omega}
=\frac{b}{\sin\chi}\left|\frac{db}{d\chi}\right|
=\frac{a^2}{4}\csc^4\frac{\chi}{2}
=\left(\frac{\kappa}{4E}\right)^2
\frac1{\sin^4(\chi/2)}.
$$

四次方反比来自两次几何放大：小角度对应大的 $b$ 环带，而角度环带本身的面积又含 $\sin\chi$。当 $\chi\to0$，理想无限范围的 Coulomb 截面发散；真实束流、屏蔽和有限探测器会提供截止，不能把数学发散直接当作无限计数。

这里的 $d\Omega$ 与 $\chi$ 属于质心系；固定靶极限下可直接作为实验室系结果。若两粒子质量可比，把截面换到实验室系时还要变换角度并乘相应的立体角 Jacobian，不能只把 $\chi$ 改名为实验室角。

## 5. 数量级例子与实验边界

**例 1：正碰。**$b=0$ 时 $L=0$，$E=\kappa/r_{\min}$，所以默认 $E=2,\kappa=2$ 给 $r_{\min}=1\ \mathrm{fm}$。粒子沿径向接近后反向，$\chi=180^\circ$。这不是“撞到一个硬球”；转向来自势能把动能暂时全部换掉。

**例 2：远掠。**当 $b\gg a$，$\arctan(a/b)\approx a/b$，所以

$$
\chi\approx\frac{2a}{b}=\frac{\kappa}{Eb}.
$$

偏折对能量是反比，对冲量参数也是反比。高能束流更容易穿过同一中心的近似直线方向。

**例 3：何时经典近似会坏。**若 de Broglie 波长 $\lambda=h/p$ 与 $b$、核半径或势变化尺度同量级，单条轨道不再是可分辨的基本对象，要用散射振幅与部分波；在量子但弱势极限，Born 近似会从势的 Fourier 变换给出角分布。若靶厚到一次粒子会多次碰撞，独立中心散射的微分截面也不能直接相加。

中心势散射的迁移价值正在这里：有效势用于黑洞和行星轨道，冲量参数与截面用于核物理、等离子体和粒子探测，而“守恒量先减维、几何再计数”的工作流也会在量子散射中保留下来。

---

*力学的五个镜头至此闭环：局部受力、作用量、相空间、稳定模态，以及中心势中的轨道与截面。下一步若把“轨道”换成“连续介质中的扰动”，就会进入弹性波。*
