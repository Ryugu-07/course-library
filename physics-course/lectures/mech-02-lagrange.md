# 力学 II · 拉格朗日力学与变分原理

> **对标**：Goldstein §1–2 / Landau *Mechanics* §1–2 ｜ **前置**：mech-01、数分 V（变分预备）、优化 III（约束）
> 拉格朗日力学把“画出每个约束力”换成“在位形空间上写一个标量 \(L\)”。核心不是一句“自然界总在最小化作用量”，而是固定端点下的**驻作用量**：真实路径的一阶变分为零。由此得到 Euler–Lagrange 方程、循环坐标和 Noether 守恒律；每一步都要把模型的对称性、边界条件和适用范围说清楚。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="mech-02-learning-title">

<h2 id="mech-02-learning-title">学习层：椭圆轨道上的角动量，为什么会“漏掉”？</h2>

### 1. 先看一个可计算的谜题

取二维振子

$$
L=\frac12(\dot x^2+\dot y^2)-\frac12(\omega_x^2x^2+\omega_y^2y^2),
\qquad \omega_x,\omega_y>0,
$$

并固定非轴初值

$$
(x_0,y_0,\dot x_0,\dot y_0)=(1,0.7,0.35,0.8).
$$

它的解不需要数值积分：

$$
x(t)=x_0\cos(\omega_xt)+\frac{\dot x_0}{\omega_x}\sin(\omega_xt),
\quad
y(t)=y_0\cos(\omega_yt)+\frac{\dot y_0}{\omega_y}\sin(\omega_yt).
$$

先不要打开实验台，预测三件事：

1. 当 \(\omega_x=\omega_y\) 时，\(L_z=x\dot y-y\dot x\) 是否恒定？
2. 当 \(\omega_x\ne\omega_y\) 时，能量是否仍恒定？
3. 一般各向异性初值的 \(L_z\) 是单调变化，还是来回振荡？

关键的对账式是

$$
E=\frac12(\dot x^2+\dot y^2)+\frac12(\omega_x^2x^2+\omega_y^2y^2),
\qquad
L_z=x\dot y-y\dot x,
$$

$$
\frac{dL_z}{dt}=(\omega_x^2-\omega_y^2)xy.
$$

所以“能量守恒”与“旋转对称”是两笔不同的账：时间不显含保证前者；平面旋转不改变 \(L\) 才保证后者。

### 2. 驻值不是一般的最小值

Hamilton 原理说：在 \(t_1,t_2\) 固定且端点 \(q(t_1),q(t_2)\) 固定的路径变分中，真实路径满足

$$
\delta S=0,
\qquad S[q]=\int_{t_1}^{t_2}L(q,\dot q,t)\,dt.
$$

这只是**一阶条件**。二阶变分在某些问题上为正时，路径才是局部最小；它也可能是局部最大或鞍点。出现共轭点（存在非零 Jacobi 变分、端点处再次相交的变分方向）后，局部最小性还会丢失。因此“最小作用量原理”是容易误导的简称，不是一般定理；本页始终使用“驻作用量”。

### 3. 动手：先提交三项判断

下面的实验台只在提交三项预测后显示轨道、能量/角动量读数和精确时间账本。滑块改变 \(\omega_y/\omega_x\) 与时间视窗；所有轨迹都由上面的正弦余弦闭式解直接计算。

<div class="learning-lab" data-learning-lab="noether-symmetry" markdown="1">

**无 JavaScript 时的静态读法：**令 \(\omega_x=1\)，\(r=\omega_y/\omega_x\)。一般预设使用同一非轴初值 \((1,0.7,0.35,0.8)\)，故 \(L_z(0)=0.555\)。下表的 \(E\) 是精确常数；“\(L_z\)”描述整条解析轨迹，而不是某个有限采样点的噪声。

| 预设 | \(r=\omega_y/\omega_x\) | 初值 \((x,y,\dot x,\dot y)\) | \(E\) | 对称性与 \(L_z\) |
|---|---:|---|---:|---|
| 各向同性 | \(1\) | \((1,0.7,0.35,0.8)\) | \(1.12625\) | 旋转对称；\(L_z=0.555\) 恒定 |
| 弱破缺 | \(1.2\) | \((1,0.7,0.35,0.8)\) | \(1.23405\) | 无旋转对称；一般 \(L_z\) 有界振荡 |
| 强破缺 | \(1.8\) | \((1,0.7,0.35,0.8)\) | \(1.67505\) | 无旋转对称；一般 \(L_z\) 有界振荡 |
| 轴轨道例外 | \(1.8\) | \((1,0,0.35,0)\) | \(0.56125\) | \(y=\dot y=0\)，故 \(L_z=0\)；这不恢复模型的旋转对称 |

\(E\) 在所有 \(\omega_x,\omega_y\) 不显含时间的预设上都恒定。弱/强破缺的“有界振荡”来自精确的 \(x(t),y(t)\)；轴轨道是故意选出的不显露扭矩的特殊初态。若脚本可用，提交后再用固定坐标轴的 \(x\)-\(y\) 轨道和 \(E,L_z\) 时间账本核对这些结论。

</div>

### 4. 三个“对称”不要混为一谈

以各向异性振子为例：

| 层次 | 要问的问题 | 本模型的答案 |
|---|---|---|
| 方程/模型 | 把所有位形同时旋转，\(L\) 是否不变？ | 仅当 \(\omega_x=\omega_y\)；这是 Noether 对称性条件。 |
| 轨迹 | 某一条解曲线是否看起来有轴或镜像？ | 可以；例如 \(y=\dot y=0\) 的解永远在 \(x\) 轴上。 |
| 初始状态 | 选定的 \((q_0,\dot q_0)\) 是否被某变换固定？ | 轴初值被离散反射 \(y\mapsto-y\) 固定，却不被任意连续旋转固定；它不能替整个方程宣布旋转对称。 |

一条轨迹的偶然几何性质不是一条作用量对所有路径的连续变换不变性。Noether 守恒量属于后者。

</section>

## 1. 位形空间、约束与广义坐标

牛顿方程在笛卡尔坐标中会把杆长、接触面、铰链等约束力也当成未知量。拉格朗日方法先描述允许的位形：若约束可写成

$$
f_a(q,t)=0,
$$

并且约束梯度在局部保持满秩，它们是**正则的完整（holonomic）约束**。用足够少的广义坐标 \(q_1,\ldots,q_n\) 参数化约束面，理想约束的虚功在允许虚位移上为零，约束力就不必显式求出。单摆用 \(\theta\) 取代 \((x,y)\) 加一条杆长方程，就是这个思想。

“任意换个变量都行”也不准确。Euler–Lagrange 方程的坐标形式在**光滑、正则的广义坐标变换**下等价：局部变换 \(Q=Q(q,t)\) 要有非退化 Jacobian，速度按链式法则变换；若是时间依赖变换，还要把显含时间和边界项一起带上。一个不可逆、不可微、把不同位形粘在一起的任意代换，不能被称为坐标不变性。非完整约束或奇异拉格朗日量还需要额外的约束动力学，不能偷偷塞进普通的独立 \(q_i\) 方程。

## 2. Hamilton 原理与 Euler–Lagrange 方程

一般力学模型先写成标量

$$
L=L(q,\dot q,t),
\qquad S[q]=\int_{t_1}^{t_2}L(q,\dot q,t)\,dt.
$$

这里的 \(L=T-V\) 只对**自然机械系统**是方便的特例：动能是速度的正定二次型，势能 \(V\) 不依赖速度（可另有显含时间）。一般相互作用必须保留完整的 \(L(q,\dot q,t)\)，后面仍使用同一个变分方程。

### Euler–Lagrange 的三行推导

取光滑扰动 \(q_i^\epsilon=q_i+\epsilon\eta_i\)，并令固定端点的扰动满足 \(\eta_i(t_1)=\eta_i(t_2)=0\)。链式法则给出

$$
\left.\frac{dS[q^\epsilon]}{d\epsilon}\right|_{\epsilon=0}
=\int_{t_1}^{t_2}\sum_i\left(
\frac{\partial L}{\partial q_i}\eta_i+
\frac{\partial L}{\partial\dot q_i}\dot\eta_i
\right)dt.
$$

令 \(p_i=\partial L/\partial\dot q_i\)，对第二项分部积分：

$$
\delta S=\left[\sum_i p_i\eta_i\right]_{t_1}^{t_2}
+\int_{t_1}^{t_2}\sum_i\left(
\frac{\partial L}{\partial q_i}-\frac{dp_i}{dt}
\right)\eta_i\,dt.
$$

边界项因固定端点消失；基本引理说对任意内部 \(\eta_i\) 积分为零只能来自被积函数恒为零，于是

$$
\boxed{\frac{d}{dt}\frac{\partial L}{\partial\dot q_i}-\frac{\partial L}{\partial q_i}=0.}
$$

在自然系统 \(L=\frac12g_{ij}(q)\dot q_i\dot q_j-V(q)\) 中，\(g_{ij}\) 是位形空间的动能度量。把同一个标量 \(T\) 写到极坐标、球坐标或摆角坐标里，会自动带出坐标基底的 \(q\) 依赖；这正是广义坐标的力量，而不是“随便替换符号”。

## 3. \(L=T-V\) 的边界与坐标表达

若粒子在平面中心势中运动，

$$
L=\frac12m(\dot r^2+r^2\dot\theta^2)-V(r).
$$

这里是自然系统，\(\theta\) 是循环坐标，后面会立即得到角动量。单摆也属于此类：

$$
L=\frac12ml^2\dot\theta^2+mgl\cos\theta
\quad\Longrightarrow\quad
\ddot\theta+\frac gl\sin\theta=0.
$$

但带速度耦合的电磁相互作用不能写成单纯的 \(T-V\)：

$$
L=\frac12m\dot{\mathbf r}^{\,2}+e\mathbf A(\mathbf r,t)\!\cdot\!\dot{\mathbf r}-e\phi(\mathbf r,t).
$$

它的 Euler–Lagrange 方程在适当单位约定下给出 \(m\ddot{\mathbf r}=e(\mathbf E+\dot{\mathbf r}\times\mathbf B)\)。向量势项不是势能 \(V(\mathbf r)\)；它依赖速度，仍然是合法的广义拉格朗日量。对这类模型，能量也必须用 \(E=\sum_i p_i\dot q_i-L\) 检查，不能机械套 \(T+V\)。

## 4. 循环坐标：守恒量的最快入口

若某个 \(q_k\) 不显含在 \(L\) 中，

$$
\frac{\partial L}{\partial q_k}=0
\quad\Longrightarrow\quad
\frac{dp_k}{dt}=0,
\qquad p_k=\frac{\partial L}{\partial\dot q_k}.
$$

这就是循环坐标（cyclic/ignorable coordinate）。中心势的 \(\theta\) 循环，因此

$$
p_\theta=mr^2\dot\theta=L_z
$$

守恒；它是旋转对称的 Noether 定理在极坐标中的一行版本。自由粒子的平移坐标也给出线动量。若外场显含位置或时间，先检查对应的 \(L\) 是否真的不变，不能只看轨迹画得像对称。

## 5. Noether：从精确不变性到守恒律

考虑固定时间的单参数变换

$$
q_i\longmapsto q_i+\varepsilon K_i(q,t),
\qquad
\delta q_i=K_i.
$$

### 精确对称性

若作用量的局部拉格朗日量在该变换下精确不变，\(\delta L=0\)，则

$$
\begin{aligned}
\delta L
&=\sum_i\left(\frac{\partial L}{\partial q_i}K_i+p_i\frac{dK_i}{dt}\right)\\
&=\sum_i\left(\frac{\partial L}{\partial q_i}-\dot p_i\right)K_i
 +\frac{d}{dt}\left(\sum_i p_iK_i\right).
\end{aligned}
$$

沿 Euler–Lagrange 轨迹，第一项为零，所以

$$
\boxed{Q=\sum_i p_iK_i,\qquad \frac{dQ}{dt}=0.}
$$

平移 \(K=\hat{\mathbf n}\) 给动量；平面旋转 \(K=(-y,x)\) 给 \(Q=xp_y-yp_x=L_z\)。二维振子只有在 \(\omega_x=\omega_y\) 时对任意旋转满足 \(\delta L=0\)。

### 准对称性与边界项

有些变换不让 \(L\) 原地不动，而是只改变一个全导数：

$$
\delta L=\frac{dF(q,t)}{dt}.
$$

同样的恒等式给出

$$
\boxed{Q=\sum_i p_iK_i-F,\qquad \frac{dQ}{dt}=0.}
$$

这是准对称性（quasi-symmetry），不能把 \(F\) 悄悄删掉。具体地，自由粒子 \(L=\frac12m\dot x^2\) 在 Galilei boost 的无穷小变换 \(\delta x=t\) 下有 \(\delta L=m\dot x=d(mx)/dt\)，所以 \(F=mx\)，守恒量

$$
Q=pt-mx=-m(x-\dot x\,t)
$$

正是匀速运动的初始位置账本。加入一个全导数 \(dG(q,t)/dt\) 不改 Euler–Lagrange 方程，却会改变动量的表示和 Noether 边界项；这就是“作用量相同到边界项”必须保留的原因。

## 6. 时间平移与能量：条件式结论

定义

$$
E=\sum_i p_i\dot q_i-L.
$$

沿真实运动直接微分：

$$
\frac{dE}{dt}
=\sum_i(\dot p_i-\partial L/\partial q_i)\dot q_i-\frac{\partial L}{\partial t}
=-\frac{\partial L}{\partial t}.
$$

因此当 \(\partial L/\partial t=0\) 时，\(E\) 守恒。对速度二次齐次、无显含时间的自然系统，它退化为熟悉的 \(T+V\)；对含 \(\mathbf A\cdot\dot{\mathbf r}\) 的模型则必须回到定义。外部驱动、时间依赖约束或时变电磁势都可能使 \(\partial L/\partial t\ne0\)，这时 \(E\) 的变化率正由该项给出。

同一条件的对称性说法是：时间平移若是模型的对称变换，就有能量守恒。不要把一个无显含时间的局部力学模型外推为任意宇宙背景下的“全局能量守恒”：膨胀时空可能没有全局时间平移 Killing 场，有限系统的边界和外源也会改变全局账本。是否存在全局能量，要另查时空对称性、边界条件和定义域。

## 7. 一套可复核的拉格朗日工作流

1. **先列约束和自由度**：确认是正则的完整约束，选局部可逆的广义坐标。
2. **写完整 \(L(q,\dot q,t)\)**：自然系统可用 \(T-V\)，速度依赖相互作用不能硬拆成势能。
3. **求共轭动量并做变分**：\(p_i=\partial L/\partial\dot q_i\)，再套 Euler–Lagrange。
4. **先找循环坐标与连续对称**：精确不变给 \(Q=p\cdot K\)，准对称还要减 \(F\)。
5. **检查显含时间**：\(E=p\cdot\dot q-L\)，并验证 \(dE/dt=-\partial_tL\)。
6. **分别检查方程、轨迹和初态**：一条特殊轨迹的几何性质不能替代整个模型的对称性证明。

### 迁移题

- 对中心势用极坐标重新推导 \(p_\theta=mr^2\dot\theta\)，并说明这一步使用的是旋转不变性还是仅仅使用了一个坐标记号。
- 对自由粒子的 Galilei boost 验证 \(\delta L=d(mx)/dt\)，再解释为什么 \(Q=pt-mx\) 在 \(\dot x\) 恒定时不随时间变。
- 对各向异性振子从 \(\delta q=(-y,x)\) 直接算出 \(\delta L\)，并指出轴轨道为什么不能反推旋转对称。
- 给一个显含时间的 \(V(q,t)\)，用 \(dE/dt=-\partial_tL\) 说明能量变化来自外部做功，而不是 Euler–Lagrange 失效。

---

*下一页：把 \((q,\dot q)\) 换成 \((q,p)\)——Legendre 变换、Hamilton 方程、相空间流与 Poisson 括号。*
