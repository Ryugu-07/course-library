# 流体 II · 黏性、边界层与阻力

> **先修**：[连续介质与守恒律](fl-01-continuum.html)、[常微分方程](../../math-course/site/ode-01-first-order.html)。本页比较两种不同极限：低 Re 中黏性贯穿流场，高 Re 层流中黏性集中在壁面高梯度区。先识别尺度和边界，再选近似。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="viscous-boundary-learning-title">

<h2 id="viscous-boundary-learning-title">学习层：剖面、层厚和摩阻必须来自同一个模型</h2>

### 1. 先预测，再看两种极限

1. 球的 Stokes 阻力 $F_D=6\pi\mu aU$ 能否直接外推到 $\mathrm{Re}=10^5$？
2. 外流 Re 很大时，能否在包括无滑移壁面的整个区域删掉黏性项？
3. 零压梯度平板的 Blasius 厚度公式能否单独确定逆压梯度中的分离点？

实验先让你预测，再展示解析球阻与数值平板剖面。改变预测会收起结果，允许重新核对理由。

### 2. 静态后备：两类模型各记一本账

<div class="learning-lab" data-learning-lab="viscous-boundary-layer" markdown="1">

**无 JavaScript 时的静态读法**：球半径 $a$，以直径定义 $\mathrm{Re}=2\rho Ua/\mu$，迎风面积 $\pi a^2$。Stokes 解给出

$$F_D=6\pi\mu aU,\qquad C_D=\frac{F_D}{\tfrac12\rho U^2\pi a^2}=\frac{24}{\mathrm{Re}},\qquad \frac{F_D}{6\pi\mu aU}=1.$$

本实验固定 $a=1$ m、$\mu=1$ Pa·s、$\rho=1\,\mathrm{kg/m^3}$，只通过 $U=\mathrm{Re}/2$ m/s 扫描 Re。这是便于核对的参数组合，不指定某种真实材料。Re 从 $10^{-3}$ 到 $10$；越过低 Re 区后，仍可计算公式，但不能当作实际阻力预测。$\mathrm{Re}<0.1$ 只是本实验的保守提示线，不是严格误差保证，也不是可逆性突然失效的临界点。

平板取 $U=10$ m/s、$\rho=1.2\,\mathrm{kg/m^3}$；独立调 $x$ 和 $\mathrm{Re}_x$ 时，隐含改变 $\nu=Ux/\mathrm{Re}_x$。相似变量与流函数为

$$\eta=y\sqrt{\frac U{\nu x}},\qquad\psi=\sqrt{\nu Ux}\,f(\eta),\qquad\frac uU=f'(\eta).$$

满足边界条件的 Blasius 方程及关键数值为

$$f'''+\frac12ff''=0,\qquad f(0)=f'(0)=0,\quad f'(\infty)=1,$$

$$f''(0)\approx0.33205734,\qquad f'(\eta_{99})=0.99,\quad\eta_{99}\approx4.90999.$$

| 读数 | 同一解给出的表达式 | 默认 $x=1$ m、$\mathrm{Re}_x=10^4$ |
|---|---|---|
| 相似长度 $\ell=\sqrt{\nu x/U}$ | $x/\sqrt{\mathrm{Re}_x}$ | $0.01$ m |
| 99% 层厚 | $\delta_{99}=\eta_{99}\ell$ | 约 $0.04910$ m |
| 局部摩阻系数 | $C_{f,x}=2f''(0)/\sqrt{\mathrm{Re}_x}$ | 约 $0.006641$ |
| 壁面切应力 | $\tau_w=\tfrac12\rho U^2C_{f,x}$ | 约 $0.39847$ Pa |
| 回算运动黏度 | $\nu=Ux/\mathrm{Re}_x$ | $0.001\,\mathrm{m^2/s}$ |

图中纵轴为 $\eta$，横轴为 $u/U$；因采用相似变量，改参数后曲线形状保持不变，但同一个 $\eta$ 对应的物理高度 $y=\eta\ell$ 改变。虚线标的是 $f'=0.99$，不是速度严格等于 $U$ 的有限“外缘”。

数值方法：将无穷远截为 $\eta=12$，用四阶 Runge–Kutta 步长 $0.01$ 积分，以二分射击调 $f''(0)$ 使 $f'(12)=1$；剖面和 $\eta_{99}$ 在网格间线性插值。图表是近似计算，不声称无限域边值问题已被机器精确求解；步长与截断变化还要独立核查。

</div>

### 3. 模型边界与不能外推的结论

- 球阻要求稳态或准稳态、不可压 Newtonian 流体、无界流体中的孤立刚性无滑移球、$\mathrm{Re}\ll1$。靠近壁面、稀薄气体滑移、非牛顿介质都会改变阻力。
- 小对流 Re 不自动允许删掉 $\rho\partial_tu$：若驱动时间尺度为 $T$，还须检查 $\rho a^2/(\mu T)\ll1$，否则可能需要非定常 Stokes 方程。
- 平板解要求稳态、二维、不可压、常物性、光滑平板、零压梯度、层流且距前缘足够远使 $\delta/x\ll1$。$\mathrm{Re}_x\approx5\times10^5$ 是常用转捩参考量级，真实转捩依赖自由流扰动、粗糙度与其他条件。
- 零压梯度解没有分离机制；不能由它的厚度直接确定逆压梯度下的分离点。曲线薄不等于壁面剪切不重要。

### 4. 三道迁移题

1. 保持 $a,\rho,\mu$，把 $U$ 加倍。Stokes 阻力、Re、$C_D$ 各怎样变？何时这种推论失去物理适用性？
2. 保持同一种流体的 $\nu$ 和外流 $U$，从 $x$ 走到 $4x$。$\mathrm{Re}_x$、$\delta_{99}$、$C_{f,x}$ 与 $\tau_w$ 如何变化？为什么不能在本实验中只拨 $x$ 而固定 Re 来模拟它？
3. 用代用剖面 $u/U=2s-s^2$、$s=y/\delta$，并令 $\delta=5x/\sqrt{\mathrm{Re}_x}$。其壁面摩阻系数是多少？能否同时宣称是 Blasius 的 $0.664/\sqrt{\mathrm{Re}_x}$？

<details class="answer" markdown="1"><summary>展开三道迁移题答案</summary>

1. $F_D$ 与 Re 都加倍，$C_D$ 减半，因为系数的分母含 $U^2$。若加速后不再有 $\mathrm{Re}\ll1$，公式仍能算，但真实阻力不受这条渐近式保证。
2. Re 变为四倍，层厚两倍，局部摩阻与切应力均减半。保持 Re 而把 $x$ 拨到四倍，会让回算 $\nu$ 也变四倍，已经换了物性。
3. 壁面梯度为 $2U/\delta$，所以 $C_{f,x}=\mu(2U/\delta)/(\rho U^2/2)=4\nu/(U\delta)=0.8/\sqrt{\mathrm{Re}_x}$。它与 $0.664/\sqrt{\mathrm{Re}_x}$ 不同；满足无滑移和某个外缘值不足以保证剖面满足原微分方程。必须把剖面、层厚和摩阻当作同一模型核对。

</details>

</section>

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="球表面力与平板相似剖面图，可横向滚动" style="overflow-x:auto">
<img src="assets/img/fl-02-viscous-drag.svg" alt="球阻的压力与剪切二比四分解，以及同一Blasius解给出的99%厚度与壁面斜率" style="min-width:720px;width:100%;display:block">
</div>
<figcaption><span class="fig-id">图 fl-02.1</span>左：Stokes 球阻中压力贡献 \(2\pi\mu aU\)，剪切贡献 \(4\pi\mu aU\)。右：数值 Blasius 剖面同时决定 \(f''(0)\) 与 \(\eta_{99}\)，它们不能来自两条不相容的曲线。</figcaption>
</figure>

## 1. 为什么球阻有一个 $6\pi$？

在球固定、远处流速 $Ue_z$ 的参考系，球坐标角 $\theta$ 从正 $z$ 轴量起。Stokes 方程 $-\nabla p+\mu\Delta u=0$、$\nabla\cdot u=0$ 的经典解为

$$u_r=U\cos\theta\left(1-\frac{3a}{2r}+\frac{a^3}{2r^3}\right),$$

$$u_\theta=-U\sin\theta\left(1-\frac{3a}{4r}-\frac{a^3}{4r^3}\right),\qquad p-p_\infty=-\frac{3\mu Ua}{2r^2}\cos\theta.$$

它在 $r=a$ 满足无滑移，远处趋于均匀流。在球面取指向流体的法向 $e_r$，流体作用于球的牵引力为 $\sigma e_r$。表面分量为

$$\sigma_{rr}=-p,\qquad\sigma_{r\theta}=-\frac{3\mu U}{2a}\sin\theta,$$

其中 $\partial_ru_r|_{r=a}=0$。投影到 $z$ 轴：$t_z=\sigma_{rr}\cos\theta-\sigma_{r\theta}\sin\theta$。常压力 $p_\infty$ 的封闭表面合力为零，其余两部分为

$$F_p=\frac{3\mu U}{2a}\int_{S_a}\cos^2\theta\,dS=2\pi\mu aU,$$

$$F_\tau=\frac{3\mu U}{2a}\int_{S_a}\sin^2\theta\,dS=4\pi\mu aU.$$

相加得到 $6\pi\mu aU$。这个阻力既有压力贡献，也有剪切贡献；不能因它叫“黏性阻力”就把压力项删掉。

## 2. 可逆性与扇贝定理：线性方程还需要什么？

准稳态 Stokes 方程对速度和驱动力是线性的。若在同一几何环境中将全部边界运动按相反时间顺序重放，理想轨迹可逆。实际实验还受惯性、扩散、布朗运动、非牛顿记忆与操作误差影响，“反向驱动”不能脱离整个运动历史来理解。

对无外力、无外力矩的微小游泳者，在不可压 Newtonian 流体的准稳态 Stokes 极限、固定环境中，**沿同一形状路径去而复返的互易周期**不能产生净游动位移。形变速度反向时瞬时游动速度反向，积分中的来回两段相消；形变快慢不会打破这条几何抵消。具有非互易循环的多自由度形变、旋转鞭毛等可以游动。该结论不能直接搬到有记忆的非牛顿流体或显著惯性情形。

## 3. 从边界层方程得到 Blasius

高 Re 并不允许忽略无滑移壁面的法向大梯度。用 $U^2/x\sim\nu U/\delta^2$ 得 $\delta/x\sim\mathrm{Re}_x^{-1/2}$；这只是标度，尚未决定“99%厚度”的系数。

对零压梯度平板，边界层方程为

$$u_x+v_y=0,\qquad uu_x+vu_y=\nu u_{yy}.$$

令 $u=\psi_y,v=-\psi_x$，连续性自动满足。代入前述 $\psi=\sqrt{\nu Ux}f(\eta)$，有

$$u=Uf',\qquad v=\frac12\sqrt{\frac{\nu U}{x}}(\eta f'-f),$$

$$uu_x+vu_y=-\frac{U^2}{2x}ff'',\qquad\nu u_{yy}=\frac{U^2}{x}f'''.$$

所以得到 $f'''+ff''/2=0$。同一个解给出

$$\tau_w=\mu U\sqrt{\frac U{\nu x}}f''(0),\qquad C_{f,x}=\frac{2f''(0)}{\sqrt{\mathrm{Re}_x}}\approx\frac{0.6641}{\sqrt{\mathrm{Re}_x}}.$$

把局部摩阻沿长 $L$ 的单面板积分，得到平均系数 $\overline C_f\approx1.3282/\sqrt{\mathrm{Re}_L}$。这是层流相似解的积分预测；前缘近场和转捩仍要单独检查。局部系数、平均平板系数与迎风面积定义的球 $C_D$ 不是同一对象。

## 4. 分离、阻力危机与升力

二维稳态边界层在逆压梯度 $dp/dx>0$ 下可能出现壁面切应力降为零、继而近壁倒流的分离。非定常或三维流动的分离判据更复杂，不能把一个零切应力条件当成所有流动的充分判据。

光滑球在某些实验条件下于 Re 为几乘 $10^5$ 的量级出现阻力危机：边界层转捩会增强近壁动量输运、推迟分离并缩窄尾流，压差阻力下降。阈值与降幅依赖粗糙度、扰动等；高尔夫球凹坑可改变转捩和分离，但不能据此宣称任何速度下阻力都更小、飞行距离一定翻倍。判断具体物体的阻力曲线，需要相应实验或经过验证的计算。

总阻力是表面压力与剪切在来流方向的积分；二者受几何和流态共同决定。Kutta–Joukowski 关系针对二维定常理想外流，给**单位翼展**升力大小 $|L'|=\rho U|\Gamma|$，方向依环量约定。真实机翼起动中，黏性边界附近生成与输运涡量，理想化起动涡图景可以解释环量分配；不能在不满足 Kelvin 前提的壁面过程直接套“环量绝对守恒”口号。

## 5. 数量级与下一步

若把层流平板公式形式上用于 $L=1$ m、$\mathrm{Re}_L=10^7$，得到 $\delta_{99}\approx4.91/\sqrt{10^7}$ m，约 $1.55$ mm；不是省掉系数后的 $0.3$ mm。但这样的 Re 已远超常用层流转捩参考，真实机翼还涉及压力梯度与三维效应，这个外推不能估计整架飞机阻力。

沿同一种流体、固定 $U$ 的平板向下游，厚度增大而局部切应力减小。先能从同一相似解复算这种关系，再进入[湍流](fl-03-turbulence.html)和[流动失稳](fl-04-instability.html)，区分解析解、渐近模型、经验相关式和直接数据。

## 6. 原始材料

[David Tong 流体讲义](https://www.damtp.cam.ac.uk/user/tong/fluids/fluids.pdf) §3.4.1 展开球的速度、压力与表面应力积分，§3.5.2 从平板边界层得到 Blasius 方程；实验数值还与独立边值求解路径比较，而不是只重算同一份代码。

[NASA Glenn 球体阻力说明](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-of-a-sphere/)展示Re和表面粗糙度怎样影响球阻；它提供经验背景，不替代本页两种渐近模型的条件。
