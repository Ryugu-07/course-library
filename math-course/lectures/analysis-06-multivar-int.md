# 数分 VI · 多元积分学

> 数学分析的终章：积分从区间推广到平面区域、空间体、曲线与曲面，最后 Green–Gauss–Stokes 三大公式把"区域内部的积分"与"边界上的积分"接通——它们是 Newton–Leibniz 公式在高维的化身，也是现代数学"边界算子与微分算子对偶"思想的第一次露面。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="change-of-variables-learning-title">

**先修**：[一元积分](analysis-03-integral.html)、[多元微分与 Jacobian](analysis-05-multivar-diff.html)、[行列式与面积缩放](algebra-02-determinant.html)。先分清标量面积、定向与覆盖，再看边界定理；相关物理例见[Maxwell 方程](../../physics-course/site/em-02-maxwell.html)。

## 学习层：换坐标时，面积到底被数了几次？

### 1. 具体情境：把一个圆盘摊成参数矩形

设 $T(u,v)=(x(u,v),y(u,v))$。换变量不是把 $dx\,dy$ 换成一串“看起来像长度”的符号，而是要回答三件事：一个小参数矩形的方向是否被翻转，面积被放大了多少，以及像中的一点有几个原像。极坐标

$$
T(r,\theta)=(r\cos\theta,r\sin\theta),\qquad
\det DT=r
$$

把 $[0,R]\times[0,2\pi)$ 映到圆盘；$r=0$ 的整条边被压成原点，若把角区间暂时闭合，$\theta=0$ 与 $2\pi$ 两条边映到同一射线；半开约定只保留其中一条。它不是处处一一对应的矩形到圆盘微分同胚，但这些例外是零面积边界，且圆盘内部几乎处处只有一个原像。

### 2. 先预测：打开实验前交出三个判断

1. 若 $T(u,v)=(-u,v)$ 把单位正方形反射过去，积分 $\iint 1\,dx\,dy$ 应该使用 $\det DT=-1$，还是 $|\det DT|=1$？
2. 极坐标把 $r=0$ 的整条边映到原点，是否意味着圆盘的面积公式因此失效？
3. 让 $\theta$ 跑满 $4\pi$ 时，参数域里的 $\iint |J|\,dr\,d\theta$ 与圆盘面积之间应相差一个什么因子？

### 3. 最小模型：三本账不能混写

先用一个条件完整的版本：设 $U,V\subset\mathbb R^2$ 为开集，$T:U\to V$ 为 $C^1$ 微分同胚（双射且逆也为 $C^1$），$f$ 是 $V$ 上的非负可测函数，或 $f\in L^1(V)$。则

$$
\iint_{T(U)}f(x,y)\,dx\,dy
=\iint_U f(T(u,v))\,|\det DT(u,v)|\,du\,dv.
$$

非负版本允许两边同为 $+\infty$；有正负号时要求绝对可积。极坐标可先取 $0<r<R,0<\theta<2\pi$，它微分同胚到删去原点和一条射线的开圆盘，再用零测集不改变积分补回；不能凭一句“几乎处处一一”省略全部正则性条件。

绝对值来自**无向面积**；若计算的是带定向的二次微分形式或有向面积，则保留带符号的 Jacobian，反射会贡献负号。第二本账是覆盖重数：一般面积公式把参数域积分写成像域上对原像求和；若每个正则像点有 $m$ 个原像，参数域积分会把该点计数 $m$ 次。例如参数域由有限个单射的 $C^1$ 正则片组成（接缝及其像为零测集），逐片换元后相加给出

$$\int_U f(T(u))\lvert\det DT(u)\rvert\,du=\int f(y)N(y)\,dy,$$

其中 $N(y)$ 是覆盖次数。若 $N(y)$ 随位置变化，就不能用一个常数去除整个积分；要逐点按重数处理，或选择不重叠的像片。

第三本账是定义域。极坐标圆盘应取 $0\le r\le R$、长度为 $2\pi$ 的半开角区间；原点和接缝只影响边界/零测集。若把 $r$ 允许为负，$(r,\theta)$ 与 $(-r,\theta+\pi)$ 会重复覆盖；若角度跑两圈，则圆盘内部几乎处处被覆盖两次。

### 4. 静态后备：先看映射账本，再看数值图

<div class="learning-lab" data-learning-lab="change-of-variables" markdown="1">

**无 JavaScript 时的静态读法：**对 $f\equiv1$，单位正方形恒等映射的带符号面积与几何面积都是 $1$；反射映射的带符号面积为 $-1$，但几何面积仍为 $1$，所以普通二重积分必须取绝对值。半径为 $R$ 的圆盘面积是 $\pi R^2$。极坐标一圈的 Jacobian 积分为

$$
\int_0^{2\pi}\int_0^R r\,dr\,d\theta=\pi R^2,
$$

而两圈为 $2\pi R^2$，因为圆盘内部几乎处处被覆盖两次；除以覆盖重数 $2$ 才回到一次面积。

| 映射/参数域 | $\int J$（有向） |  $\int \lvert J\rvert$（参数账） | 像域一次面积 | 覆盖判断 |
|---|---:|---:|---:|---|
| 恒等映射，单位正方形 | $1$ | $1$ | $1$ | 一一对应 |
| 反射 $(u,v)\mapsto(-u,v)$ | $-1$ | $1$ | $1$ | 一一对应但反向 |
| 极坐标一圈，$0\le r\le R$ | $\pi R^2$ | $\pi R^2$ | $\pi R^2$ | 除原点/接缝外一一 |
| 极坐标两圈，$0\le r\le R$ | $2\pi R^2$ | $2\pi R^2$ | $\pi R^2$ | 几乎处处二重覆盖 |

实验揭示后可以调 $R\in[0.25,2.5]$、选择反射或极坐标，并把一圈改成两圈。图中参数片 $R/2\le r\le R,\ \pi/6\le\theta\le\pi/3$ 的像是扇环，其一次面积为 $\pi R^2/16$；两圈时再加 $2\pi$ 的参数片落在同一扇环。标记点的两个参数记录是 $(3R/4,\pi/4)$ 与 $(3R/4,9\pi/4)$，像点相同。两块参数片是**覆盖证据**，不是两个不同的像区域。

</div>

### 5. 定理假设与失效边界：何时能直接套公式？

- **局部条件**：经典公式通常在 $C^1$ 映射、非退化 Jacobian 的局部区域上建立；全局使用时还要处理边界、可测性、可积性以及单射/有限覆盖分解。$J=0$ 的点不是自动“非法”，但不能把它当作局部可逆的普通点。
- **绝对值不是装饰**：普通 Lebesgue/Riemann 面积积分不随参数方向改变；只有有向积分、微分形式或定向流形上的积分才保留符号。
- **重数不是误差项**：非单射映射可按原像求和，或在覆盖重数恒定的区域除以重数；有限个实验点只能显示当前映射的计数，不能替代一般的面积公式。
- **极坐标边界**：原点的退化和角接缝是本例的结构性例外；对含原点的奇异被积函数，还必须另行检查可积性，不能只看 $r\,dr\,d\theta$。

这些固定模型的面积和覆盖关系有上面的解析推导，实验把计算和点对画出来；它没有证明任意映射都满足换元条件。

### 6. 三道迁移题

1. 单位圆盘上积分 $f(x,y)=x^2+y^2$，若使用两圈极坐标，参数积分与像域一次积分分别是多少？为什么仍须除以 2？
2. $f(x,y)=(x^2+y^2)^{-p/2}$ 在单位圆盘原点附近何时可积？“原点是零测集”为什么不能自动保证答案有限？
3. 在环域 $1\le x^2+y^2\le4$ 上，$F=(-y,x)/(x^2+y^2)$ 的旋度为零。求外圈逆时针、内圈顺时针及整个边界的环积分。能否据此说 $F$ 在环域有单值势函数？

<details class="answer" markdown="1"><summary>展开三道迁移题答案</summary>

1. 参数积分 $\int_0^{4\pi}\int_0^1 r^3\,dr\,d\theta=\pi$；像域一次积分为 $\pi/2$。每个非零像点被计数两次，乘上的 $f=r^2$ 不会消掉覆盖重数。
2. 极坐标给出 $2\pi\int_0^1 r^{1-p}\,dr$，恰在 $p<2$ 时有限，值为 $2\pi/(2-p)$。$p=2$ 为对数发散；$p>2$ 也发散。问题来自原点附近每一个小环带的累积，不是原点处单独取什么值。
3. 沿任意半径的逆时针圆周，$F\cdot dr=d\theta$，所以外圈 $2\pi$，内圈顺时针 $-2\pi$，总边界为零，与 Green 一致。外圈本身仍有非零环积分，因此没有全局单值势；Green 的带洞版本与无旋场势函数问题不能混为一谈。

</details>

</section>

## 1. 重积分

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="换序切片与补边定向图，可横向滚动" style="overflow-x:auto">
<img src="assets/img/analysis-06-double-integral.svg" alt="三角区域换积分次序，以及上半圆补边后的正向边界" style="min-width:720px;width:100%;display:block">
</div>
<figcaption><span class="fig-id">图 6.1</span>左：同一个三角区域，竖切读成 \(x\le y\le1\)，横切读成 \(0\le x\le y\)。右：上半圆从右向左走，补上从左向右的直径，区域始终在左侧；闭合积分还须减去补边贡献。对应例 1、例 2。</figcaption>
</figure>

**定义**：把区域分割成小块，以函数值乘小块面积后求和，再取网格趋细的极限。Riemann 版本可在有界 Jordan 可测区域（边界零面积）上使用；其闭包上连续的函数可积。Lebesgue 版本在可测区域上讨论，并单独检查可积性。只有 $f\ge0$ 时 $\iint_D f\,dA$ 才是区域与曲面间的普通体积；有正负时是带符号的累计量，例如单位正方形上 $f=x-y$ 的积分为零，却并非处处没有高度。

**计算三板斧**：

**1. 化累次（Fubini/Tonelli）**：把函数乘区域示性函数放到矩形上。非负可测时 Tonelli 允许换序（可为无穷）；绝对可积时 Fubini 保证两种累次积分一致，内积分只需几乎处处存在。带正负但不绝对可积时不能无条件换序。$X$-型区域 $\iint_D f\,d\sigma = \int_a^b dx \int_{y_1(x)}^{y_2(x)} f\,dy$。**交换积分次序**是高频操作：画出区域→按另一变量重新描述边界（有些积分只有换序后才积得动，如 $\int_0^1 dx\int_x^1 e^{-y^2}dy$）。

**不能换序的反例**：在 $(0,1]^2$ 取 $f=(x^2-y^2)/(x^2+y^2)^2$。固定 $x>0$，因为 $f=\partial_y[y/(x^2+y^2)]$，先积 $y$ 得 $1/(1+x^2)$，再积 $x$ 得 $\pi/4$；固定 $y>0$，先积 $x$ 得 $-1/(1+y^2)$，再积 $y$ 得 $-\pi/4$。两次累次积分都存在却不同：原点附近 $|f|\,dA=|\cos2\theta|\,dr\,d\theta/r$ 不可积，Fubini 的绝对可积条件恰在此失效。

**2. 变量替换**：

$$
\iint_D f(x,y)\,dx\,dy = \iint_{D'} f\big(x(u,v), y(u,v)\big)\,\Big|\det\frac{\partial(x,y)}{\partial(u,v)}\Big|\,du\,dv
$$

Jacobi 行列式 = 局部面积缩放率（🔗 与数分 V 隐函数定理、概率页"随机变量变换的密度公式"、归一化流同源）。**极坐标** $dx\,dy = r\,dr\,d\theta$；**柱坐标** $dV = r\,dr\,d\theta\,dz$；**球坐标**取 $x=\rho\sin\varphi\cos\theta,y=\rho\sin\varphi\sin\theta,z=\rho\cos\varphi$，其中 $\rho\ge0,0\le\varphi\le\pi,0\le\theta<2\pi$，则 $dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$。$\varphi$ 是从正 $z$ 轴量起的极角；若换成纬度，Jacobian 就不能照抄。

**3. 对称性**：区域对称 + 被积函数奇偶性，先砍再算；轮换对称性（$x,y,z$ 地位对等时 $\iiint x^2 = \frac13\iiint(x^2+y^2+z^2)$）。

**名例（高斯积分）**：非负性允许先用 Tonelli，再取不断扩大的圆盘极限。$I = \int_{-\infty}^\infty e^{-x^2}dx$，则 $I^2 = \iint e^{-(x^2+y^2)}dx\,dy \xrightarrow{\text{极坐标}} \int_0^{2\pi}\!\!\int_0^\infty e^{-r^2} r\,dr\,d\theta = \pi$，故 $I = \sqrt\pi$。🔗 概率论正态分布的入场券。

## 2. 曲线积分

下面曲线取分段 $C^1$ 正则参数化，被积场连续。参数若重复走同一条曲线，会重复累计；“与方向无关”不等于“与走过次数无关”。

**第一类（对弧长，标量场）**：$\int_L f\,ds$，物理原型是曲线质量。计算：参数化后 $ds = \sqrt{x'^2 + y'^2}\,dt$。与方向无关。

**第二类（对坐标，向量场）**：$\int_L P\,dx + Q\,dy = \int_L \mathbf{F}\cdot d\mathbf{r}$，物理原型是**做功**。与方向有关（反向变号）。计算：参数化直接代入。

两类关系：$\int_L \mathbf F \cdot d\mathbf r = \int_L (\mathbf F \cdot \boldsymbol\tau)\,ds$（$\boldsymbol\tau$ 为单位切向量）。

## 3. 曲面积分

正则参数片 $r(u,v)$ 满足 $r_u\times r_v\ne0$；面积元为 $dS=\|r_u\times r_v\|\,du\,dv$，有向面积元为 $d\mathbf S=(r_u\times r_v)\,du\,dv$。前者取长度，后者保定向；交换参数次序会改变后者符号。多片覆盖要避免重复计数。

**第一类（对面积）**：$\iint_S f\,dS$，$z = z(x,y)$ 时 $dS = \sqrt{1 + z_x^2 + z_y^2}\,dx\,dy$。

**第二类（对坐标，通量）**：$\iint_S \mathbf F \cdot d\mathbf S = \iint_S \mathbf F\cdot\mathbf n\,dS$，物理原型是**流量穿过曲面**。依赖侧的选取（法向定向）。计算：投影法逐分量，或统一化为第一类。

## 4. 三大公式（本页顶点）

**定理（Green 公式）** 设 $D$ 为有界平面区域，边界由有限条分段 $C^1$ 简单闭曲线组成，$P,Q$ 在包含 $\overline D$ 的开邻域上为 $C^1$。边界按“区域始终在行进方向左侧”定向：外边界逆时针，孔的内边界顺时针。**允许有孔**：

$$
\oint_{\partial D} P\,dx + Q\,dy = \iint_D \Big(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\Big)\,d\sigma
$$

**定理（Gauss 公式 / 散度定理）** 设 $\Omega$ 为有界体域，边界分片光滑，$F\in C^1$ 于包含 $\overline\Omega$ 的开邻域；$\partial\Omega$ 取相对于体域的外法向（孔洞处指向洞内）：

$$
\oiint_{\partial\Omega} \mathbf F\cdot d\mathbf S = \iiint_\Omega \nabla\cdot\mathbf F\,dV, \qquad \nabla\cdot\mathbf F = P_x + Q_y + R_z\ \text{（散度）}
$$

**定理（Stokes 公式）** 设 $S$ 为紧致、可定向、分片光滑曲面，边界分段光滑；$F\in C^1$ 于曲面的开邻域，法向与边界行进方向按右手规则一致：

$$
\oint_{\partial S} \mathbf F\cdot d\mathbf r = \iint_S (\nabla\times\mathbf F)\cdot d\mathbf S \qquad (\nabla\times\mathbf F\ \text{为旋度})
$$

**为什么内部项会变成边界项？** 对小矩形 $[a,b]\times[c,d]$，先对 $Q_x$ 积分得到右边减左边，再对 $-P_y$ 积分得到下边减上边，正好是逆时针的四边积分。拼接相邻矩形或光滑小片时，共用边的两个方向相反，内部边彼此抵消，只剩真正边界；孔边因此方向相反。Gauss 把通量面的这种抵消推广到小体块，Stokes 则在曲面参数片上做同样的拼接。严格推广还须极限与正则性条件。

**统一读法**：三条都是

$$
\int_{\text{区域}} (\text{导数型量}) = \int_{\text{边界}} (\text{原量})
$$

——Newton–Leibniz（$\int_a^b F' = F(b) - F(a)$：区域 = 区间，边界 = 两个端点）的高维推广；在微分形式语言下三者是同一条**广义 Stokes 公式** $\int_M d\omega = \int_{\partial M} \omega$（微分几何页的预告）。

**选方法**：先比较边界上的场与区域内的导数哪个更简单，再决定是否用边界定理。曲线可补线段形成闭路，曲面可补面形成闭面，但都须保持正确方向，最后减去补上的积分；被积函数在内部有奇点（如 $\frac{-y\,dx + x\,dy}{x^2+y^2}$ 围原点）时不能直接用，挖洞处理。

## 5. 保守场与路径无关

先设 $D$ 是开、连通区域，$F=(P,Q)\in C^1(D)$。存在单值势函数、所有分段光滑路径的积分只由端点决定、任意闭路积分为零，这三者等价，**不要求单连通**。由路径无关定义 $u(x)=\int_{x_0}^xF\cdot dr$，沿很短坐标线段求导就得到 $\nabla u=F$；反向由一元微积分基本定理直接成立。

无旋条件 $Q_x=P_y$ 是必要的；若 $D$ 再单连通，它也是充分的。因此在单连通开域上四种说法等价。单连通是对任意无旋场作此保证的充分条件，不是某个场有势函数的必要条件：环域上的常向量场 $(1,0)=\nabla x$ 就有势，而 $(-y,x)/(x^2+y^2)$ 没有。三维在单连通开域上相应使用 $\nabla\times F=0$。求势可沿域内允许的路径积分，不能让所谓折线路径穿出定义域。

**场论速查**：梯度 $\nabla f$（标量→向量）、散度 $\nabla\cdot\mathbf F$（向量→标量，源强度）、旋度 $\nabla\times\mathbf F$（向量→向量，涡强度）；在所涉及函数为 $C^2$ 时，混合偏导可交换，给出恒等式 $\nabla\times(\nabla f)=0$、$\nabla\cdot(\nabla\times\mathbf F) = 0$；$\nabla\cdot\nabla f = \Delta f$（Laplace 算子，PDE 页的主角）。

## 6. 典型例题

**例 1（换序救场）** 计算 $\int_0^1 dx\int_x^1 e^{-y^2}dy$。
*解*：$e^{-y^2}$ 无初等原函数，换序：区域为 $0\leq x\leq y\leq 1$，$= \int_0^1 e^{-y^2}\Big(\int_0^y dx\Big)dy = \int_0^1 y e^{-y^2}dy = \frac{1 - e^{-1}}{2}$。

**例 2（Green 公式 + 补线）** 计算 $\int_L (x^2 - y)\,dx + (x + \sin y)\,dy$，$L$ 为上半圆 $y = \sqrt{1 - x^2}$ 从 $(1,0)$ 到 $(-1,0)$。
*解*：补线段 $\overline{(-1,0)(1,0)}$ 成闭合（注意方向凑成正向），Green：$Q_x - P_y = 1 - (-1) = 2$，$\oint = 2 \cdot \frac{\pi}{2} = \pi$。再减补线贡献：线段上 $y = 0, dy = 0$，$\int_{-1}^{1} x^2 dx = \frac23$。故原积分 $= \pi - \frac23$。

**例 3（Gauss 公式）** 求 $\oiint_S (x\,dy\,dz + y\,dz\,dx + z\,dx\,dy)$，$S$ 为球面 $x^2+y^2+z^2 = R^2$ 外侧。
*解*：散度 $= 3$，Gauss 给 $3 \cdot \frac43\pi R^3 = 4\pi R^3$。（顺带记住：这个积分 $= 3V$，是"用边界积分算体积"的通用公式。）$\blacksquare$

**例 4（Stokes 的定向检验）** 取 $F=(-y/2,x/2,0)$，$S$ 为 $z=1-x^2-y^2\ge0$ 的抛物面帽，法向向上。旋度为 $(0,0,1)$，投影到单位圆盘给出 $\iint_S(\nabla\times F)\cdot n\,dS=\pi$。边界从上方看逆时针，参数 $(\cos t,\sin t,0)$，$F\cdot dr=\tfrac12dt$，同样得到 $\pi$。若法向改向下，边界也须改顺时针，两边一起变成 $-\pi$；只改一边会破坏等式。

## 7. 继续阅读

[Toronto MAT237 换变量讲义](https://www.math.utoronto.ca/courses/mat237y1/20199/notes/Chapter4/S4.4.html)说明开集、可逆 $C^1$ 映射与 Jacobian 的作用；[MIT 18.022 Green 公式](https://math.mit.edu/~djk/18_022/chapter10/section01.html)明确内外边界定向与内部边抵消。进入电磁学与流体力学前，应能同时说清积分对象、积分区域、方向和场的奇点。
