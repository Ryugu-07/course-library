# 流形几何 IV · 曲率

> 曲率是“平行移动绕圈回来转了多少”的张量化账本。本页固定一个符号约定，依次看黎曼张量、截面/Ricci/标量曲率，以及测地线偏离和小圈和乐；有限实验只负责把缩并和尺度算清。

**先修回链**：[黎曼度量、联络与测地线](mfld-03-riemannian.html)、[微分形式与定向](mfld-02-forms-stokes.html)。以下取光滑、无边界黎曼流形，常曲率分类与比较定理的维数为 $n\ge2$。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="riemann-learning-title">

## 学习层：同一个小罗盘，为什么绕圈会留下不同的方向误差？

### 1. 具体情境：在球面、平面和双曲模型上巡检

巡检员从同一点出发，携带三个向量 \(X,Y,Z\)。他先用 \(X,Y\) 张成一个小平行四边形，把 \(Z\) 沿四条边平行移动；再比较两组测地线族：一组从相邻点出发且初始速度场的协变变化为零，另一组从同一点以微小夹角出发；最后把一个小方圈的面积逐渐放大。平面模型应当“绕圈不留痕”，正曲率模型的正交测地线束会聚，负曲率模型则发散。

但三个读数不是同一件事：\(R(X,Y)Z\) 依赖三个向量，截面曲率先除以 \(\lvert X\wedge Y\rvert^2\)，Ricci 是对一个指标做迹，标量曲率再取一次迹。实验把每个缩并的分母、单位和有限范围写出来。

### 2. 揭示前先预测

选择球面 \(K=+1/4\)、欧氏 \(K=0\) 或双曲 \(K=-1/4\)，再预测：

1. 当前 \(X,Y\) 张成的非退化截面曲率符号是什么？若 \(X\parallel Y\)，是否仍有截面？
2. 在 \(n\) 维常曲率模型中，\(\operatorname{Ric}^{\sharp}(X)\) 是 \(KX\)、\((n-1)KX\)，还是不能由迹得到？
3. 初始协变变化为零的正交分离 \(j\) 满足哪种行为：正曲率振荡、平直保持，还是负曲率按 \(\cosh\) 增长？
4. 一个小圈的首阶和乐角按 \(K\times\) 面积、\(K/\)面积，还是面积/\(K\) 缩放？

完成四项预测后才会揭示图和表。这里的有限常曲率算例是概念校验，不是对一般流形的全局证明。

### 3. 正式桥：从 \(R\) 到三个缩并

本页采用

$$
R(X,Y)Z=
\nabla_X\nabla_YZ-\nabla_Y\nabla_XZ-\nabla_{[X,Y]}Z.
$$

常曲率 \(K\) 的模型用

$$
R(X,Y)Z=K\bigl(\langle Y,Z\rangle X-\langle X,Z\rangle Y\bigr),\qquad
K(\sigma)=\frac{\langle R(X,Y)Y,X\rangle}{\lvert X\wedge Y\rvert^2}.
$$

这个写法明确保证正模型的截面曲率为正；换一套 \(R\) 符号约定时，截面曲率的定义式也须相应改号，才能继续表示同一个球面的正曲率；不能只改公式标题。

Ricci 是二阶张量

$$
\operatorname{Ric}(X,Y)=\operatorname{tr}\bigl[Z\mapsto R(Z,X)Y\bigr],\qquad
\operatorname{Ric}^{\sharp}(X)=(n-1)KX,\qquad
S=\operatorname{tr}_g\operatorname{Ric}=n(n-1)K
$$

在常曲率 \(n\) 维模型中的结果。取正交单位基 \(e_i\)，计算 \(\sum_i\langle R(e_i,X)Y,e_i\rangle=K(n\langle X,Y\rangle-\langle X,Y\rangle)\)，就得到 \((n-1)K\)；再对 \(X=Y=e_j\) 求和得到标量曲率。文献里写 \(\operatorname{Ric}(X)\) 时，可能指一形式 \(Y\mapsto\operatorname{Ric}(X,Y)\)；只有用度量升指标后，才把它当作向量 \(\operatorname{Ric}^{\sharp}(X)\)。

### 4. 动手揭示：把两个尺度一起画出

实验显示 \(R(X,Y)Z\)、非退化截面分母、Ricci/标量缩并，并画出

$$
\frac{D^2J}{ds^2}+R(J,T)T=0,\qquad J\perp T\Longrightarrow j''+Kj=0
$$

的解。这个方程来自一族测地线 $F(s,u)$：记 $T=\partial_sF,U=\partial_uF$，有 $[T,U]=0$。无挠给 $\nabla_TU=\nabla_UT$，而 $\nabla_TT=0$；按本页曲率定义，$R(T,U)T=\nabla_T\nabla_UT$。所以沿中心曲线取 $J=U$，得到 $D_s^2J=R(T,J)T=-R(J,T)T$。

这里 $s$ 是弧长、$T$ 为单位切向，$J=jE$，$E$ 是沿路径平行的单位法向；真正相邻曲线的分离为 $\varepsilon J+O(\varepsilon^2)$，不是让任意大的 $J$ 等于精确距离。对两组初值，解分别为

| 初值 | $K>0$ | $K=0$ | $K<0$ |
|---|---|---|---|
| $j(0)=1,j^{\prime}(0)=0$ | $\cos(\sqrt K s)$ | $1$ | $\cosh(\sqrt{-K}s)$ |
| $j(0)=0,j^{\prime}(0)=1$ | $\sin(\sqrt K s)/\sqrt K$ | $s$ | $\sinh(\sqrt{-K}s)/\sqrt{-K}$ |

第一行从相邻点出发，其首次零点 $\pi/(2\sqrt K)$ 是此测地线族的聚焦。**起点的共轭点**需要非恒零 Jacobi 场在起点和终点都为零；第二行才符合这个初值判据，首次正零点为 $\pi/\sqrt K$。$j<0$ 表示分量方向翻转，距离的一阶近似是 $\varepsilon|j|$。

小圈示意另用定向正交基，与向量选项中的斜基/退化组分开；改变向量组只改变张量缩并，不改变这个参考圈。实验还显示边长 \(\ell\) 小方圈的 \(\theta\approx K\ell^2\) 首阶账。小圈反向绕行时角度反号，高阶项和全局拓扑没有被隐藏进这个近似。

<div class="learning-lab" data-learning-lab="riemann-curvature" markdown="1">

**无 JavaScript 时的静态后备：**默认取球面模型 \(K=1/4\)、\(n=3\)、\(X=e_1,Y=Z=e_2\)、\(\ell=0.6\)、\(s=5\)。于是

| 项目 | 静态值 | 读法 |
|---|---:|---|
| \(R(X,Y)Z\) | \((1/4,0,0)\) | 采用本页 \(R=\nabla_X\nabla_Y-\nabla_Y\nabla_X-\nabla_{[X,Y]}\) |
| \(\lvert X\wedge Y\rvert^2\) | \(1\) | 非退化二维截面 |
| \(K(\sigma)\) | \(1/4\) | \(\langle R(X,Y)Y,X\rangle/\lvert X\wedge Y\rvert^2\) |
| \(\operatorname{Ric}^{\sharp}(X)\) | \((1/2,0,0)\) | \((n-1)KX\)，不是把 Ricci 误写成 \(KX\) |
| \(S\) | \(3/2\) | \(n(n-1)K\) |
| \(j(5)/j(0)\) | \(\cos(5/2)\approx-0.8011\) | 初始分离族已越过 s=π 的聚焦零点；不能据此称与起点共轭 |
| 小圈 \(\theta\) | \(K\ell^2=0.09\) rad | \(K\) 的 \(L^{-2}\) 与面积的 \(L^2\) 抵消 |

若选 \(X\parallel Y\)，R 仍可计算但分母为零，不能把退化平面叫作一个截面。有限图表不证明 Bonnet–Myers 或 Cartan–Hadamard，也不替代一般流形上的完备性、连通性和曲率界假设。

</div>

### 5. 定理边界

- “\(\Gamma=0\) 坐标存在当且仅当 \(R=0\)”必须读成**邻域内平坦坐标**：在一个足够小的邻域上，若 \(R\) 在该邻域恒为零，才可找坐标使全部 \(\Gamma^k_{ij}\) 在该邻域恒为零，反之亦然。单点总能取法坐标使 \(\Gamma(p)=0\)，这不推出 \(R(p)=0\)。
- **Bonnet–Myers**：连通、完备的 \(n\ge2\) 维黎曼流形若 \(\operatorname{Ric}\ge(n-1)k\,g\)、\(k>0\)，则直径不超过 \(\pi/\sqrt{k}\)，并推出紧致与基本群有限。实验没有检查完备性，也没有证明该定理。
- **Cartan–Hadamard**：完备、单连通且所有截面曲率 \(K\le0\) 时，\(\exp_p\) 是到流形的全局微分同胚。把三条有限曲线或一张 toy 图当成该全局结论是不合法的。
- 常曲率的完备、单连通模型按 \(K>0,=0,<0\) 分别对应球面型、欧氏型、双曲型，尺度由 \(\lvert K\rvert\) 决定；“三种模型”不是任意不完备或非单连通空间的分类。


### 6. 迁移题：相同的曲率标签，能推出相同结论吗？

1. 半径 $2$ 的球面上，$j_1(s)=\cos(s/2)$、$j_2(s)=2\sin(s/2)$。各自的首次正零点是什么？哪一组能证明起点与零点共轭？
2. 在定向正交基 $(e_1,e_2)$ 中，正向小圈面积近似 $A=.36$、$K=.25$。从 $v=e_1$ 出发，一阶向量变化朝 $+e_2$ 还是 $-e_2$？反向如何？
3. 圆柱 $S^1\times\mathbb R$ 配乘积平直度量，完备且 $K=0$。能否据此说 $\exp_p$ 全局单射？

<details class="answer" markdown="1"><summary>展开判据与计算</summary>

1. $j_1$ 在 $s=\pi$ 为零，但 $j_1(0)=1$，只显示这组初始分离族聚焦。$j_2(0)=0$，首次正零点在 $s=2\pi$，这是半径 $2$ 球面起点的首个共轭点。
2. 本页约定下 $R(e_1,e_2)e_1=-Ke_2$。按 $+e_1,+e_2,-e_1,-e_2$ 逆时针绕行，$P_\gamma v-v=-A R(e_1,e_2)v+o(A)=+.09e_2+o(A)$，即正旋转；反向变为 $-.09e_2$。向量算子的负号与角度 $\theta\approx+KA$ 不冲突。
3. 不能。圆柱非单连通，沿周向相差整圈的切向量可到同一点。Cartan–Hadamard 的单连通条件不可删除；局部平直也不意味着全局只有一张坐标图。

</details>

</section>

## 1. 黎曼曲率张量

曲率是联络二阶不交换的张量账本：

$$
R(X,Y)Z=\nabla_X\nabla_YZ-\nabla_Y\nabla_XZ-\nabla_{[X,Y]}Z.
$$

它对 \(X,Y,Z\) 张量化，而 Christoffel 符号本身不是张量。Levi-Civita 曲率降指标后的反对称性、交换对称性和第一 Bianchi 恒等式把独立分量从 \(n^4\) 压到 \(n^2(n^2-1)/12\)；\(n=2\) 时只有一个独立曲率分量，正是曲面只有一个 Gauss 曲率的高维对应。

单点法坐标只能让 \(\Gamma(p)=0\)，不能让曲率消失。只有邻域内平坦，才有邻域内全为零的 Christoffel 坐标。

## 2. 截面、Ricci 与标量曲率

对于非退化二维平面 \(\sigma=\operatorname{span}\{X,Y\}\)，

$$
K(\sigma)=\frac{\langle R(X,Y)Y,X\rangle}{\lvert X\wedge Y\rvert^2},\qquad
\lvert X\wedge Y\rvert^2=\lvert X\rvert^2\lvert Y\rvert^2-\langle X,Y\rangle^2.
$$

Ricci 记录沿一个方向的截面曲率迹，标量曲率是 Ricci 再取迹。对常曲率模型，\(\operatorname{Ric}=(n-1)K g\)、\(S=n(n-1)K\)；对一般度量不能把这两个等式当作无条件恒等式。

### 小圈的符号与适用范围

固定正交基 $X,Y$ 和正向路径 $+X,+Y,-X,-Y$。平行移动满足 $\dot v=-\Gamma(\dot\gamma)v$，沿四边展开至面积阶得到 $P_\gamma-I=-A R(X,Y)+o(A)$。在定向二维常曲率截面中，$R(X,Y)X=-KY$，因此向量由 $X$ 向 $Y$ 转的角度为 $\theta\approx KA$。图上的方形是切平面示意，$A\approx\ell^2$；这里没有求完整闭路的 ODE，也没有给有限 $\ell$ 的误差上界。在一般高维空间，和乐是正交变换，未必能由单一角度描述。

曲率为零只排除足够小可缩闭路的和乐；一般平坦联络仍可能有非可缩闭路的全局和乐。不能从一张局部方形图推断全部闭路。

## 3. 曲率与拓扑的第一批定理

Bonnet–Myers 和 Cartan–Hadamard 都是“曲率 + 完备性 + 全局拓扑假设”的定理，不能只凭局部 \(R\) 数值调用。正 Ricci 通过第二变分控制过长最短测地线；非正截面曲率与完备单连通性共同保证指数映射的全局性质。缺掉任何一组条件，结论都可能失效。

曲面的 Gauss–Bonnet 在高维通向 Chern–Gauss–Bonnet；Ricci 流 \(\partial_tg=-2\operatorname{Ric}\) 则把曲率变成演化方程。这里先把语言和边界立稳，不把后续深定理压缩成一张有限图。

## 4. 三个模型读数

**球面**：半径 \(r\) 时 \(K=1/r^2\)，\(\operatorname{Ric}=(n-1)g/r^2\)，\(S=n(n-1)/r^2\)。

**欧氏空间**：\(R=0\)，存在全局平直坐标，测地线偏离保持初始线性读数，所有小圈和乐为零。

**双曲空间**：\(K=-1/r^2\)，正交 Jacobi 场的模型解含 \(\cosh(s/r)\)，但“指数增长”仍是常曲率模型的解式，不等于对任意负曲率数据的一次 benchmark。

---

*下一门：代数拓扑把“洞”做成基本群、覆盖空间与同调；本页的和乐与指数映射会在那里继续留下全局痕迹。*


**原始资料**：[Lee 第2版作者页面及勘误](https://sites.math.washington.edu/~lee/Books/RM/)（Jacobi 场、共轭点、比较定理）；[Deane Yang：Holonomy is Curvature](https://cims.nyu.edu/~yangd/papers/holonomy.pdf)（联络与小圈和乐的关系；使用时须核对闭路方向）。上述两初值与小圈符号计算在正文中展开。
