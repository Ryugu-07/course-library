# 微分几何 II · 曲面、法曲率与 Gauss 绝妙定理

> 一张纸可以卷成圆柱，却不能在完全不拉伸的情况下贴满球面。区别不是“看起来弯不弯”：第一基本形式记录曲面上的长度与角度，第二基本形式记录向周围空间弯曲的方式。我们从一条实际选定的切方向出发，算出法曲率，再连接高斯曲率与整体拓扑。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="surface-learning-title">

<h2 id="surface-learning-title">学习层：方向、法向和测量尺度都要说清楚</h2>

### 1. 四块可以逐项计算的曲面

| 曲面 | 参数式 | 默认法向 |
|---|---|---|
| 平面 | \((u,v,0)\) | 向上 |
| 半径 2 的球面 | \(2(\cos u\cos v,\cos u\sin v,\sin u)\) | 外向，坐标片要求 \(|u|<\pi/2\) |
| 半径 \(a=3/2\) 的圆柱 | \((a\cos u,a\sin u,v)\) | 外向 |
| 鞍面 | \((u,v,u^2-v^2)\) | \(z\) 分量为正 |

先预测 \(K\) 的符号、\(K=0\) 时的点型、两个主曲率的符号模式，以及翻转法向的一般变换律。揭晓后，红点对应实际参数点，网格由同一参数式采样。再转动绿色切方向 \(w\)，观察法曲率如何在两个主曲率之间变化。

### 2. 两个二次型怎样对应真实测量？

参数曲面正则时，\(r_u,r_v\) 线性无关。第一基本形式的矩阵是

\[
g=\begin{pmatrix}E&F\\F&G\end{pmatrix},
\quad E=\langle r_u,r_u\rangle,\ F=\langle r_u,r_v\rangle,\ G=\langle r_v,r_v\rangle.
\]

一个参数方向 \((a,b)\) 对应实际切向量 \(w=ar_u+br_v\)，长度平方为 \(Ea^2+2Fab+Gb^2\)，不能通常用 \(a^2+b^2\) 替代。

选定单位法向 \(n\)，本页使用

\[
h=\begin{pmatrix}L&M\\M&N\end{pmatrix},
\qquad L=\langle r_{uu},n\rangle,\ M=\langle r_{uv},n\rangle,\ N=\langle r_{vv},n\rangle.
\]

相应方向的**法曲率**为

\[
\kappa_n(w)=\frac{La^2+2Mab+Nb^2}{Ea^2+2Fab+Gb^2}.
\]

分母负责把方向的长度归一化。实验中的角度 \(\theta\) 相对于**正交单位切向基**测量，不是在一般斜坐标中把系数随便写成 \((\cos\theta,\sin\theta)\)。

### 3. 符号约定不能在同一页内改变

本页 \(II(X,Y)=\langle D_XY,n\rangle\)，相应形算子是 \(S=-dn\)。外向球面满足 \(dn(X)=X/R\)，所以主曲率为 \(-1/R\)，平均曲率 \(H=-1/R\)。若采用 \(S=+dn\) 并相应改变第二基本形式的符号，才会得到相反的主曲率。

翻转 \(n\) 时，\(II,S,H\) 和**同一几何方向**的法曲率变号，\(I,K\) 不变。若把主曲率按 \(k_1\ge k_2\) 排序，翻转后它们变成 \((-k_2,-k_1)\)，标签也会互换。零值变号后仍为零。

<div class="learning-lab" data-learning-lab="surface-curvature" markdown="1">

**无 JavaScript 时的静态读法：**

| 模型与代表点 | 主曲率（按大小排序） | \(K\) | \(H\) | 判断 |
|---|---|---|---|---|
| 平面 | \(0,0\) | \(0\) | \(0\) | 平面点，所有方向法曲率为零 |
| 外向球面 \(R=2\) | \(-1/2,-1/2\) | \(1/4\) | \(-1/2\) | 椭圆点，也是脐点；所有方向法曲率相同 |
| 外向圆柱 \(a=3/2\) | \(0,-2/3\) | \(0\) | \(-1/3\) | 抛物点；沿轴线不弯，沿圆周弯 |
| 鞍面原点、向上法向 | \(2,-2\) | \(-4\) | \(0\) | 双曲点；存在法曲率为零的渐近方向 |

四个模型说明不同现象，不构成任意曲面的证明。\(K\) 的量纲是长度的负二次方，\(H\) 和法曲率是长度的负一次方，数值大小不应放在同一把无单位尺子上比较。

</div>

### 4. 从一条方向曲线读出主曲率

若 \(\theta_1\) 是最大主曲率方向与正交基第一轴的夹角，

\[
\kappa_n(\theta)=k_1\cos^2(\theta-\theta_1)+k_2\sin^2(\theta-\theta_1).
\]

球面给水平直线；圆柱从零变到一个非零极值；鞍面跨过零。脐点 \(k_1=k_2\) 的主方向不唯一，图中只能任选一组正交基。网格图采用等比例正投影，但屏幕投影可能把空间直角压扁，正交性仍以实际内积为准。

</section>

## 1. 正则曲面与第一基本形式

以下在足够光滑（推导曲率的坐标公式时取 \(C^3\)）的参数曲面上讨论。正则性要求 \(r_u\times r_v\ne0\)。因此

\[
E>0,\qquad EG-F^2=|r_u\times r_v|^2>0,
\]

矩阵 \(g\) 正定。对曲面上的路径 \(r(u(t),v(t))\)，

\[
\operatorname{Length}=\int\sqrt{E\dot u^2+2F\dot u\dot v+G\dot v^2}\,dt,
\qquad dA=\sqrt{EG-F^2}\,du\,dv.
\]

两个非零切方向 \(a,b\) 的夹角由
\(\cos\alpha=(a^\mathsf Tgb)/\sqrt{(a^\mathsf Tga)(b^\mathsf Tgb)}\) 给出。参数坐标是测量的表示方式；换坐标会改变矩阵分量，却不改变被测的长度或夹角。

球坐标在南北极有 \(r_v=0\)，所以这张坐标图失效。球面本身在那里仍光滑，需要换坐标片；不能把极点的 \(0/0\) 读成球面曲率不存在。

## 2. 形算子为何是自伴随的？

沿曲面切向 \(X\)，由 \(n\cdot n=1\) 得 \(D_Xn\perp n\)，仍是切向。定义 \(S(X)=-D_Xn\)。对切向场 \(Y\) 求导 \(Y\cdot n=0\)，得到

\[
II(X,Y)=\langle D_XY,n\rangle
=-\langle Y,D_Xn\rangle
=I(SX,Y).
\]

由于 \(r_{uv}=r_{vu}\)，\(II\) 对称，因而 \(S\) 对 \(I\) 的内积自伴随。在坐标基 \(r_u,r_v\) 中，它的矩阵是 \(g^{-1}h\)。**这个矩阵通常不对普通欧氏内积对称**；它满足的是

\[
(g^{-1}h)^\mathsf T g=g(g^{-1}h)=h.
\]

选正交单位切向基后，矩阵才是普通实对称矩阵。谱定理给出两个实特征值和正交主方向；等价的坐标方程为

\[
h\,a=k\,g\,a.
\]

这就是主曲率的广义特征值问题。不能不看 \(g\) 就把 \(h\) 的普通特征值当成主曲率。

若用正交主方向 \(e_1,e_2\) 写单位向量 \(w=e_1\cos\theta+e_2\sin\theta\)，自伴随性使交叉项为零，立即得到 **Euler 法曲率公式**
\(\kappa_n(w)=k_1\cos^2\theta+k_2\sin^2\theta\)。所以主曲率恰为法曲率的最大、最小值。

## 3. 高斯曲率、平均曲率与点型

由形算子的行列式和迹，

\[
K=k_1k_2=\frac{LN-M^2}{EG-F^2},\qquad
H=\frac{k_1+k_2}{2}=\frac{EN-2FM+GL}{2(EG-F^2)}.
\]

- \(K>0\)：椭圆点，两主曲率同号。
- \(K<0\)：双曲点，两主曲率异号，Euler 公式给两条无向渐近方向。
- \(K=0\) 且恰一主曲率非零：抛物点。
- 两主曲率都零：平面点。这个名称指二阶数据为零，不保证附近真的有一块平面。

脐点要求 \(k_1=k_2\)，包括平面点。球面的每点都是非零脐点，所有方向同样弯；不能给它指定唯一的“最大主方向”。

<div role="region" aria-label="可横向滚动的三种曲面真实网格图" tabindex="0" style="max-width:100%;overflow-x:auto">
<figure class="plot" style="min-width:1100px">
<img src="assets/img/dg-02-gaussian-curvature.svg" alt="球面、圆柱与鞍面的真实参数网格、探针法向，以及各自两条主方向的曲率。">
<figcaption><span class="fig-id">图 dg-02.1</span>各图由所列参数式生成，采用等比例正投影；蓝色网格全部显示，不作遮挡处理。公式与参数点共同决定曲率。</figcaption>
</figure>
</div>

### 把四个模型算到底

外向球面 \(r=R(\cos u\cos v,\cos u\sin v,\sin u)\)，\(R>0,|u|<\pi/2\)，有

\[
E=R^2,\ F=0,\ G=R^2\cos^2u,\qquad
L=-R,\ M=0,\ N=-R\cos^2u.
\]

故 \(S=-I_{\rm tan}/R\)，两主曲率都是 \(-1/R\)，\(K=1/R^2,H=-1/R\)。这里 \(I_{\rm tan}\) 表示切平面上的恒等算子。

外向圆柱 \(r=(a\cos u,a\sin u,v)\)，\(a>0\)，有 \(g=\operatorname{diag}(a^2,1)\)、\(h=\operatorname{diag}(-a,0)\)。圆周方向主曲率 \(-1/a\)，轴向为零，故 \(K=0,H=-1/(2a)\)。

对向上的鞍面 \(r=(u,v,u^2-v^2)\)，记 \(D=\sqrt{1+4u^2+4v^2}\)，

\[
g=\begin{pmatrix}1+4u^2&-4uv\\-4uv&1+4v^2\end{pmatrix},
\quad h=\frac2D\begin{pmatrix}1&0\\0&-1\end{pmatrix},
\]

\[
K=-\frac4{D^4}<0,\qquad H=\frac{4(v^2-u^2)}{D^3}.
\]

原点 \(k_1=2,k_2=-2,H=0\)。但一般点的 \(H\) 不为零，所以这整张双曲抛物面不是极小曲面。\(H=0\) 必须在整片曲面上成立，才是极小曲面方程；它表达面积的一阶驻定，也不保证任意大区域都给出全局最小面积。

## 4. Gauss 绝妙定理：为什么外在算出的 K 是内在量？

把二阶导数分成切向与法向：

\[
r_{ij}=\Gamma^k_{ij}r_k+h_{ij}n.
\]

由对度量 \(g_{ij}=\langle r_i,r_j\rangle\) 求导，可以解出切向系数

\[
\Gamma^k_{ij}=\frac12g^{k\ell}
(\partial_i g_{j\ell}+\partial_j g_{i\ell}-\partial_\ell g_{ij}).
\]

这些系数只依赖 \(g\) 和一阶导数，定义切平面中的 Levi–Civita 联络。比较混合三阶导数、消去法向项，得到 **Gauss 方程**

\[
\langle R(\partial_u,\partial_v)\partial_v,\partial_u\rangle
=LN-M^2.
\]

这里固定 \(R(X,Y)Z=\nabla_X\nabla_YZ-\nabla_Y\nabla_XZ-\nabla_{[X,Y]}Z\)。例如左侧在坐标中是

\[
g_{u\ell}\left(
\partial_u\Gamma^\ell_{vv}-\partial_v\Gamma^\ell_{uv}
+\Gamma^m_{vv}\Gamma^\ell_{um}
-\Gamma^m_{uv}\Gamma^\ell_{vm}\right).
\]

于是把它除以 \(EG-F^2\)，就得到 \(K\) 仅由 \(g\) 及其前两阶导数表达。**局部等距保持 \(K\)**，这是 Gauss 绝妙定理的机制；只比较四个模型的数值并不能证明这个一般结论。

### 圆柱为什么可以局部展开，球面为什么不行？

映射

\[
\Phi(s,z)=(a\cos(s/a),a\sin(s/a),z)
\]

满足 \(|\Phi_s|=|\Phi_z|=1,\ \Phi_s\cdot\Phi_z=0\)，所以拉回的度量是 \(ds^2+dz^2\)，与平面相同。在不绕满一周的小坐标片中，它是局部等距。圆柱的外在 \(H\ne0\) 与内在平直并不冲突。

球面任意开片都有 \(K=1/R^2>0\)，因此连**局部**也不能等距摊到平面。反过来，两个点的 \(K\) 恰好相同，不足以说明它们附近等距；等距要求整个度量对应，不能只核对一个标量。

## 5. Gauss–Bonnet：把局部曲率加起来，需要哪些条件？

这里“闭曲面”指**紧致、无边界**的光滑曲面，并非仅仅作为 \(\mathbb R^3\) 子集闭。对闭定向曲面，

\[
\int_S K\,dA=2\pi\chi(S).
\]

对具有分段光滑边界的紧定向曲面区域，完整式为

\[
\int_S K\,dA+\int_{\partial S}\kappa_g\,ds+
\sum_j\beta_j=2\pi\chi(S).
\]

边界按“行进时区域在左侧”的正向取向，\(\kappa_g=\langle dT/ds,n\times T\rangle\) 是测地曲率，\(\beta_j\) 是边界拐角的有符号外转角。不能漏掉边界项或转角项。

平面圆盘的 \(K=0\)，但逆时针圆周有 \(\int\kappa_g\,ds=2\pi\)，与 \(\chi=1\) 相符。边界空间曲率 \(1/R\) 和测地曲率不是同一概念：球面大圆在三维空间仍然弯曲，却是球面测地线，\(\kappa_g=0\)。

对三条测地边围成的简单圆盘三角形，若内角为 \(\alpha,\beta,\gamma\)，则

\[
\alpha+\beta+\gamma-\pi=\int_{\triangle}K\,dA.
\]

所以“小三角形角盈余测曲率”必须使用测地边，并把积分与点值近似区分。球面常曲率时，角盈余恰等于面积除以 \(R^2\)。

闭球面的积分为 \((1/R^2)(4\pi R^2)=4\pi\)，故 \(\chi=2\)。对标准环面

\[
r(u,v)=((R+a\cos v)\cos u,(R+a\cos v)\sin u,a\sin v),\quad R>a>0,
\]

\[
K=\frac{\cos v}{a(R+a\cos v)},\qquad
dA=a(R+a\cos v)\,du\,dv.
\]

乘积为 \(\cos v\,du\,dv\)，在两个角度各一周上积分为零，与 \(\chi=0\) 一致。环面内外两侧的曲率正负相抵，不代表环面处处平直。

## 6. 三道迁移题

### 题 1：参数方向为什么不一定是主方向？

对向上鞍面 \(z=u^2-v^2\)，在 \(u=v=1/2\) 处计算两主曲率及沿 \(r_u\) 的法曲率。只看 \(II\) 的对角形式，能否说 \(r_u,r_v\) 是主方向？

<details class="answer" markdown="1"><summary>展开推导</summary>

此时 \(g=\begin{pmatrix}2&-1\\-1&2\end{pmatrix}\)，
\(h=(2/\sqrt3)\operatorname{diag}(1,-1)\)，所以 \(K=-4/9,H=0\)，主曲率为 \(2/3,-2/3\)。沿 \(r_u\) 的法曲率为 \(L/E=1/\sqrt3\)，既不是最大值也不是最小值。原因是参数基不正交；应解 \(ha=kga\)。在实验采用的正交单位基中，最大主方向与第一轴夹角为 \(15^\circ\)，而不是 \(0^\circ\)。

</details>

### 题 2：局部可展为什么不等于一张全局坐标纸？

验证 \(\Phi(s,z)=(a\cos(s/a),a\sin(s/a),z)\) 保持局部长度与角度，并说明它为何不是从整个平面到整个圆柱的一一等距坐标。

<details class="answer" markdown="1"><summary>展开推导</summary>

\(\Phi_s=(-\sin(s/a),\cos(s/a),0)\)、\(\Phi_z=(0,0,1)\)，内积矩阵是单位矩阵，所以局部保长、保角。但 \(\Phi(s+2\pi a,z)=\Phi(s,z)\)，不单射。展开一个圆柱坐标片时必须限制周向参数；全圆柱有绕轴的闭路和周期识别，不能把这张周期覆盖图直接当成全局一一坐标。

</details>

### 题 3：球面八分之一的角盈余在哪里？

取球面半径 \(R\)，由三个正坐标轴上的点连接成大圆弧三角形。用 Gauss–Bonnet 核对其三个直角与面积。

<details class="answer" markdown="1"><summary>展开推导</summary>

三条边都是测地线，\(\kappa_g=0\)，每个内角为 \(\pi/2\)，外转角也为 \(\pi/2\)。区域是圆盘，故
\(\int K\,dA+3\pi/2=2\pi\)，即 \(\int K\,dA=\pi/2\)。因 \(K=1/R^2\)，面积为 \(\pi R^2/2\)，正好是总面积 \(4\pi R^2\) 的八分之一；角盈余 \(3\pi/2-\pi=\pi/2\) 与积分一致。

</details>

## 进一步学习

第一基本形式推广为流形上的度量张量，联络和曲率便能在没有外部三维空间的情况下定义。主曲率则依赖嵌入和所选法向，应与这种内在推广分开。

证明与后续内容可参照 [Gabriel P. Paternain：Differential Geometry，第 2.3—2.6 节和第 4.2 节](https://www.dpmms.cam.ac.uk/~gpp24/dgnotes/dg.pdf)。比较教材时先核对形算子、法向及曲率张量的符号约定。
