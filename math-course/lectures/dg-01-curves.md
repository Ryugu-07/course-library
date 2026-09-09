# 微分几何 I · 曲线、曲率与挠率

> 同一条弯道，走得快一些会让向心加速度增大，却不会把弯道本身变得更弯。本页先分清参数速度与曲线形状，再用切向、法向和副法向描述空间曲线，最后说明曲率与挠率在什么条件下能确定整条曲线。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="dg-curves-learning-title">

<h2 id="dg-curves-learning-title">学习层：换钟表时，先确认比较的是同一个点</h2>

### 1. 四个可以直接核算的模型

| 模型 | 基曲线 \(\mathbf r(u)\) | 要观察的区别 |
|---|---|---|
| 直线 | \((u,0,0)\) | 正则、曲率为零；\(T\) 存在，但 Frenet \(N,B,\tau\) 未定义 |
| 半径 2 的圆 | \((2\cos u,2\sin u,0)\) | \(\kappa=1/2,\tau=0\)，加速不会改变半径 |
| 螺旋线 | \((2\cos u,2\sin u,u)\) | \(\kappa=2/5,\tau=1/5\)；空间里 \(T,N,B\) 正交，投影到屏幕后未必显成直角 |
| 拐点曲线 | \((u,u^3,0)\) | \(\kappa=6|u|/(1+9u^4)^{3/2}\)，不同位置曲率不同；只有 \(u=0\) 的 Frenet 标架失效 |

实验把基曲线换成 \(\widetilde{\mathbf r}(t)=\mathbf r(\lambda t)\)。**比较不变量时必须在 \(u=\lambda t\) 的同一个几何点比较。**把 \(\mathbf r(t)\) 与 \(\mathbf r(\lambda t)\) 都代入同一个数字 \(t\)，通常是在比较两个位置；拐点曲线的曲率随位置改变，这不能否定重参数化不变性。

### 2. 定义域先于除法

\(C^2\) 正则曲线满足 \(\mathbf r'\ne0\)，速度 \(v=|\mathbf r'|\)，单位切向 \(T=\mathbf r'/v\)，曲率

\[
\kappa=\left|\frac{dT}{ds}\right|
=\frac{|\mathbf r'\times\mathbf r''|}{|\mathbf r'|^3}.
\]

曲率可以为零，零曲率本身仍是合法的几何量。只有 \(\kappa>0\) 时，才能再定义 \(N=(dT/ds)/\kappa\)、\(B=T\times N\)。挠率的三阶导数公式还要求 \(C^3\)：

\[
\tau=\frac{(\mathbf r'\times\mathbf r'')\cdot\mathbf r'''}
{|\mathbf r'\times\mathbf r''|^2}.
\]

例如直线和拐点处，\(\kappa=0\) 仍保持不变，未定义的是 \(N,B,\tau\)。很小的非零曲率也不能被一个数值阈值改名为“精确零”。

### 3. 正向、反向与镜像

在对应点，非零常数 \(\lambda\) 给出

\[
\widetilde v=|\lambda|v,\qquad
\widetilde\kappa=\kappa,\qquad
\widetilde\tau=\tau
\quad(\tau\text{ 有定义时}).
\]

若 \(\lambda<0\)，运动方向反转，\(\widetilde T=-T,\widetilde N=N,\widetilde B=-B\)，挠率仍不变。把整个空间作镜像则不同：例如把螺旋线的 \(z\) 改成 \(-z\)，曲率不变，挠率变号。一个是沿原路倒着走，一个是改变空间中的手性。

<div class="learning-lab" data-learning-lab="frenet-frame" markdown="1">

**JavaScript 失效时的静态读法：**默认螺旋线、\(t=0.8,\lambda=1\)。在 \(\lambda=2\) 而仍固定 \(t=0.8\) 时，已走到 \(u=1.6\)；同点基准应取 \(\mathbf r(1.6)\)。

| 量 | 默认值 | 解释 |
|---|---|---|
| 速度 | \(\sqrt5\) | 随参数钟表改变 |
| 有向弧长 | \(0.8\sqrt5\) | 从参数零点起，负参数时可为负 |
| 曲率、挠率 | \(2/5,\ 1/5\) | 在对应点不变 |
| \(T\) | \((-0.641,0.623,0.447)\) | 单位切向 |
| \(N\) | \((-0.697,-0.717,0)\) | 曲率非零时唯一确定 |
| \(B\) | \((0.321,-0.312,0.894)\) | \(T\times N\) |

直线和 \((u,u^3,0)\) 的 \(u=0\) 处仍正则，但不能用 \(0/0\) 算出法向。拐点曲线的弧长没有使用初等闭式，实验给出数值积分及误差估计；该估计不等于经过证明的误差上界。

</div>

### 4. 从图读什么，从证明读什么？

先作四项预测，再揭晓实验。左图按等比例正投影显示曲线和探针；右图把该点的单位标架移到原点放大，避免长曲线让单位箭头小到看不见。屏幕上的角度不能直接当成三维夹角，正交性要核算内积。

改变参数、速率或方向后重新作答。表中既列同点不变量，也列误用同一时刻时另一点的曲率，帮助定位“比较对象变了”的错误。

</section>

## 1. 正则性、弧长与速度：为什么需要换参数？

设 \(I\) 是区间，\(\mathbf r:I\to\mathbb R^3\) 至少 \(C^1\)。它**正则**是指每点 \(\mathbf r'(t)\ne0\)。这保证局部有确定切方向；它不保证曲线没有自交，也不保证参数一次走过的像不会重复。

固定 \(t_0\)，定义有向弧长坐标

\[
s(t)=\int_{t_0}^{t}|\mathbf r'(q)|\,dq.
\]

因为 \(s'(t)=v(t)>0\)，它严格增加，可局部反解 \(t=t(s)\)。链式法则给

\[
\frac{d\mathbf r}{ds}=\frac{\mathbf r'(t)}{v(t)},\qquad
\left|\frac{d\mathbf r}{ds}\right|=1.
\]

弧长参数消除了“钟表快慢”。当 \(t<t_0\) 时，\(s(t)<0\)；从 \(t_0\) 到该点沿参数段走过的长度是 \(|s(t)|\)，长度本身并不为负。

非正则参数未必意味着几何像有尖点：\((t^3,0,0)\) 在 \(t=0\) 速度为零，但像是直线。该参数无法在这里直接套正则公式，换成 \(u=t^3\) 后像有正常的直线参数；这个换参的逆在零点不满足正则重参数化的要求。

## 2. 从单位切向推导 Frenet 方程

以下在 \(C^3\) 正则曲线的一个区间上讨论，采用弧长 \(s\)，并假设 \(\kappa>0\)。记对弧长的导数为撇号：

\[
T=\mathbf r',\qquad \kappa=|T'|,\qquad N=T'/\kappa,\qquad B=T\times N.
\]

由于 \(T\cdot T=1\)，有 \(T'\cdot T=0\)，所以 \(N\perp T\)。\(T,N,B\) 是右手正交单位标架。

对单位向量 \(B\) 求导，有 \(B'\perp B\)。又因 \(B\cdot T=0\)，
\(B'\cdot T=-B\cdot T'=-\kappa B\cdot N=0\)，因此 \(B'\) 只能沿 \(N\)。**本页约定** \(B'=-\tau N\) 定义挠率。再对 \(N\cdot T=0\) 和 \(N\cdot B=0\) 求导，可得

\[
T'=\kappa N,\qquad
N'=-\kappa T+\tau B,\qquad
B'=-\tau N.
\]

于是

\[
\begin{pmatrix}T\\N\\B\end{pmatrix}'=
\begin{pmatrix}
0&\kappa&0\\-\kappa&0&\tau\\0&-\tau&0
\end{pmatrix}
\begin{pmatrix}T\\N\\B\end{pmatrix}.
\]

反对称系数不是凑出来的：正交单位向量的内积保持不变，迫使导数系数两两相反。有些教材使用相反挠率符号；核对时应先检查 \(B=T\times N\) 与 \(B'=-\tau N\) 这两个约定。

### 零曲率与平面性各需要什么前提？

在一个正则 \(C^2\) 区间上，\(\kappa\equiv0\) 等价于 \(T\) 常向，因而像包含在一条直线上。这并不替直线定义一个唯一的 Frenet 法向。

在上面 **\(\kappa>0\) 的 \(C^3\) 区间**上，\(\tau\equiv0\) 等价于曲线落在固定平面。若 \(\tau=0\)，\(B\) 常向，而
\((\mathbf r\cdot B)'=T\cdot B=0\)，所以 \(\mathbf r\cdot B\) 常数；反过来，平面曲线的 \(T,N\) 在该平面内，连续的单位 \(B\) 固定，于是 \(\tau=0\)。

不能把“除零处没有计算的挠率”补成零，再凭几段的零挠率证明整条曲线在同一平面内；在零曲率连接处，完整 Frenet 判据已经失去前提。

## 3. 一般参数与同一点的重参数化

在任意正则参数下，

\[
\kappa=\frac{|\mathbf r'\times\mathbf r''|}{|\mathbf r'|^3},
\qquad
\tau=\frac{(\mathbf r'\times\mathbf r'')\cdot\mathbf r'''}
{|\mathbf r'\times\mathbf r''|^2}.
\]

第一式只要求 \(C^2\) 和速度非零，允许分子为零；第二式要求 \(C^3\) 且外积非零。

例如 \(\mathbf r'=vT\)，再次求导得
\(\mathbf r''=\dot vT+v^2\kappa N\)。外积消去切向项，
\(|\mathbf r'\times\mathbf r''|=v^3\kappa\)，即得曲率公式。对 \(B=(\mathbf r'\times\mathbf r'')/|\mathbf r'\times\mathbf r''|\) 求导，并用 \(d/ds=v^{-1}d/dt\)，得到挠率式。

对 \(C^3\) 的正则换参 \(u=\phi(t)\)，\(\phi'\ne0\)，有

\[
\widetilde{\mathbf r}'=\phi'\mathbf r_u,\qquad
\widetilde{\mathbf r}''=(\phi')^2\mathbf r_{uu}+\phi''\mathbf r_u.
\]

所以外积变为 \((\phi')^3(\mathbf r_u\times\mathbf r_{uu})\)，混合积变为 \((\phi')^6(\mathbf r_u,\mathbf r_{uu},\mathbf r_{uuu})\)：含重复向量的额外项都消失。分母分别带 \(|\phi'|^3\) 与 \((\phi')^6\)，因子相消，得到在**对应点**的 \(\widetilde\kappa=\kappa,\widetilde\tau=\tau\)。

这个论证对负的 \(\phi'\) 也成立。它不会把零曲率变成非零曲率；\(\kappa=0\) 处仍可比较曲率，只是不能比较一个未定义的挠率值。

### 曲率怎样进入实际运动？

若用物理时间，速度向量是 \(vT\)，加速度分解为

\[
\mathbf a=\dot v\,T+v^2\kappa N
\quad(\kappa>0).
\]

同一弯道以两倍速度通过，法向加速度是四倍，而曲率没有变。在 \(\kappa=0\) 时可写成始终合法的形式
\(\mathbf a=\dot vT+v^2(dT/ds)\)，法向项为零，不需要任意选一个 \(N\)。

## 4. 密切圆：相同切向和相同二阶弯曲

在 \(\kappa(s_0)>0\) 的点，密切圆位于 \(T,N\) 张成的平面，圆心与半径为

\[
C=\mathbf r(s_0)+\frac{N(s_0)}{\kappa(s_0)},\qquad R=\frac1{\kappa(s_0)}.
\]

令 \(h=s-s_0\)。按同一弧长取向参数化该圆：

\[
c(h)=C+R\left[-N\cos(h/R)+T\sin(h/R)\right].
\]

于是 \(c(0)=\mathbf r(s_0)\)、\(c'(0)=T\)、\(c''(0)=\kappa N\)，与原曲线的二阶 Taylor 数据相同。这是“二阶相切”的具体含义；它不表示两条曲线在一段区间内相等，也不表示给整段曲线作全局最小二乘拟合。

<div role="region" aria-label="可横向滚动的抛物线与密切圆图" tabindex="0" style="max-width:100%;overflow-x:auto">
<figure class="plot" style="min-width:1100px">
<img src="assets/img/dg-01-curvature.svg" alt="抛物线y=x²与顶点密切圆，圆心(0,1/2)，半径1/2；两侧局部图核对二阶相同而四阶不同。">
<figcaption><span class="fig-id">图 dg-01.1</span>坐标采用同一比例。圆心沿主法向移动一个曲率半径；局部差别由展开式定量说明。</figcaption>
</figure>
</div>

对图形 \(y=f(x)\)，\(\kappa=|f''|/(1+(f')^2)^{3/2}\)。抛物线 \(y=x^2\) 在顶点有 \(\kappa=2\)，故 \(R=1/2,C=(0,1/2)\)。圆的下半支

\[
y=\frac12-\sqrt{\frac14-x^2}
=x^2+x^4+O(x^6)
\]

与抛物线的常数、一次和二次项相同，却从四次项起分开。这里恰因对称性三次项也相同，不能把“四次才分开”当成所有密切圆的普遍性质。

## 5. 曲率与挠率在什么意义下确定曲线？

采用经典导数公式的一组充分条件是：区间 \(I\) 上 \(\kappa\in C^1\)、\(\kappa>0\)，\(\tau\) 连续。给定 \(s_0\) 处的位置和右手正交单位标架，Frenet 方程先确定唯一标架，再积分 \(\mathbf r'=T\)，得到一条 \(C^3\) 单位速曲线，曲率与挠率恰为所给函数。

为什么解一直保持正交？把三个向量作为矩阵 \(F\) 的列，方程是 \(F'=FA\)，其中 \(A\) 是上一节系数矩阵的转置，仍有 \(A^\mathsf T=-A\)。矩阵 \(G=F^\mathsf TF\) 满足 \(G'=A^\mathsf TG+GA\)，而 \(G=I\) 是相同初值的解；由线性 ODE 唯一性，\(G\equiv I\)。行列式连续且初值为 \(1\)，所以一直保持右手取向。由 \(T'=\kappa N\) 等式直接核对曲率和挠率。

不固定初始位置和标架时，唯一性是**相差一个保向刚体运动** \(\mathbf x\mapsto Q\mathbf x+\mathbf a,\ Q\in SO(3)\)。一般正交变换满足

\[
\widetilde\kappa=\kappa,\qquad
\widetilde\tau=(\det Q)\tau.
\]

反射的 \(\det Q=-1\)，会改变挠率符号。曲率与挠率是曲线在三维空间中摆放形状的**外在不变量**；若只看一维弧长度量，小段直线与小段圆弧都与一个区间等距，单凭这个内在度量看不出弯曲。

此外，给任意周期的 \(\kappa,\tau\) 并不自动得到闭曲线；位置和标架回到起点还需额外的闭合条件。零曲率处则需分段处理，或引入 Bishop 等其他标架，不能省掉 \(\kappa>0\) 后继续引用同一个基本定理。

### 两个空间曲线例子

对 \(\mathbf r(t)=(a\cos t,a\sin t,bt)\)，取 \(a>0,b\in\mathbb R\)，

\[
v=\sqrt{a^2+b^2},\qquad
\kappa=\frac{a}{a^2+b^2},\qquad
\tau=\frac{b}{a^2+b^2}.
\]

当 \(b=0\) 得圆；若固定 \(\kappa>0,\tau\) 都为常数，反解
\(a=\kappa/(\kappa^2+\tau^2),b=\tau/(\kappa^2+\tau^2)\)，结合基本定理得到对应螺旋线。\(a=0,b\ne0\) 另成直线，此时曲率零、Frenet 挠率未定义；\(a=b=0\) 更是非正则常值曲线。

扭曲三次曲线 \((t,t^2,t^3)\) 的导数外积为 \((6t^2,-6t,2)\)，始终非零，混合积为 \(12\)。所以

\[
\tau(t)=\frac{3}{9t^4+9t^2+1}>0,
\]

不在固定平面内。这里同时检查了混合积非零和公式定义域。

对样条连接，**正则 \(C^2\)** 是曲率连续的充分条件。不能把几何曲率连续与某个参数表示的 \(C^2\) 性说成同义条件：参数速度的光滑程度也会影响二阶参数导数。轨迹设计既要检查几何连接，也要检查所选时间规律。

## 6. 三道迁移题

### 题 1：重参数化为什么被误报为改变曲率？

设 \(\mathbf r(u)=(u,u^3,0)\)，\(\widetilde{\mathbf r}(t)=\mathbf r(2t)\)。在 \(t=1/2\) 处分别计算新曲率、同点基准曲率，以及错误地使用 \(u=1/2\) 得到的曲率。

<details class="answer" markdown="1"><summary>展开推导</summary>

新曲线在 \(u=1\) 的点。其一、二阶导数为 \((2,6,0),(0,24,0)\)，外积模 \(48\)，速度 \(2\sqrt{10}\)。因此新曲率为 \(48/(2\sqrt{10})^3=3/(5\sqrt{10})\)，等于基曲线 \(\kappa(1)\)。若错取 \(\kappa(1/2)\)，得到 \(3/(1+9/16)^{3/2}=192/125\)。二者不同，是因为位置从 \((1,1,0)\) 换成了 \((1/2,1/8,0)\)，不是不变量定理失效。

</details>

### 题 2：倒着走与镜中曲线为什么不同？

对 \(\mathbf r(u)=(2\cos u,2\sin u,u)\)，比较 \(\mathbf r(-t)\) 与空间反射 \((2\cos t,2\sin t,-t)\) 的曲率、挠率。

<details class="answer" markdown="1"><summary>展开推导</summary>

两者曲率都为 \(2/5\)。反向参数化的混合积分子和分母都带 \((-1)^6=1\)，所以挠率仍为 \(1/5\)；在对应点 \(T,B\) 反向而 \(N\) 不变。空间反射的矩阵为 \(\operatorname{diag}(1,1,-1)\)，行列式 \(-1\)，所以挠率变为 \(-1/5\)。镜像改变手性，倒着沿同一螺旋线走不改变手性。

</details>

### 题 3：两倍速度意味着什么？停下时公式还安全吗？

在圆上取 \(\mathbf q(t)=(2\cos(t^2),2\sin(t^2),0)\)，\(t>0\)。计算速度、曲率和法向加速度大小；再说明 \(t=0\) 处的问题。

<details class="answer" markdown="1"><summary>展开推导</summary>

速度 \(v=4t\)，圆的几何曲率仍为 \(1/2\)。法向加速度为 \(v^2\kappa=8t^2\)，切向加速度大小为 \(\dot v=4\)。在 \(t=0\) 参数速度为零，\(|\mathbf q'|^3\) 分母为零，不能直接用该参数的曲率商式；圆本身仍光滑且曲率 \(1/2\)，这是参数停下造成的公式失效。

</details>

## 进一步学习

下一页进入[曲面论](dg-02-surfaces.html)。曲面有多个切方向，曲率需要先说明沿哪个方向测量。

更完整的证明与习题见 [Gabriel P. Paternain：Differential Geometry，第 2.1 节](https://www.dpmms.cam.ac.uk/~gpp24/dgnotes/dg.pdf)，以及 [Silvio Fanzon：Curvature and Torsion](https://www.silviofanzon.com/2024-Differential-Geometry-Notes/sections/chap_2.html)。本页固定右手标架和挠率符号，比较不同讲义前先核对约定。
