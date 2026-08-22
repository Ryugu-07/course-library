# 流形几何 IV · 曲率

> 曲率是“平行移动绕圈回来转了多少”的张量化账本。本页固定一个符号约定，依次看黎曼张量、截面/Ricci/数量曲率，以及测地线偏离和小圈和乐；有限实验只负责把缩并和尺度算清。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="riemann-learning-title">

## 学习层：同一个小罗盘，为什么绕圈会留下不同的方向误差？

### 1. 具体情境：在球面、平面和双曲模型上巡检

巡检员从同一点出发，携带三个向量 \(X,Y,Z\)。他先用 \(X,Y\) 张成一个小平行四边形，把 \(Z\) 沿四条边平行移动；再让两条相邻测地线从同一点以很小夹角出发，观察它们的间距；最后把一个小方圈的面积逐渐放大。平面模型应当“绕圈不留痕”，正曲率模型的正交测地线束会聚，负曲率模型则发散。

但三个读数不是同一件事：\(R(X,Y)Z\) 依赖三个向量，截面曲率先除以 \(\lvert X\wedge Y\rvert^2\)，Ricci 是对一个指标做迹，数量曲率再取一次迹。实验把每个缩并的分母、单位和有限范围写出来。

### 2. 揭示前先预测

选择球面 \(K=+1/4\)、欧氏 \(K=0\) 或双曲 \(K=-1/4\)，再预测：

1. 当前 \(X,Y\) 张成的非退化截面曲率符号是什么？若 \(X\parallel Y\)，是否仍有截面？
2. 在 \(n\) 维常曲率模型中，\(\operatorname{Ric}^{\sharp}(X)\) 是 \(KX\)、\((n-1)KX\)，还是不能由迹得到？
3. 初始速度为零的正交分离 \(j\) 满足哪种行为：正曲率振荡、平直保持，还是负曲率按 \(\cosh\) 增长？
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

这个写法明确保证正模型的截面曲率为正；换一套 \(R\) 符号约定，后续 \(K\) 的符号也要一并换，不能只改公式标题。

Ricci 是二阶张量

$$
\operatorname{Ric}(X,Y)=\operatorname{tr}\bigl[Z\mapsto R(Z,X)Y\bigr],\qquad
\operatorname{Ric}^{\sharp}(X)=(n-1)KX,\qquad
S=\operatorname{tr}_g\operatorname{Ric}=n(n-1)K
$$

在常曲率 \(n\) 维模型中的结果。文献里写 \(\operatorname{Ric}(X)\) 时，可能指一形式 \(Y\mapsto\operatorname{Ric}(X,Y)\)；只有用度量升指标后，才把它当作向量 \(\operatorname{Ric}^{\sharp}(X)\)。

### 4. 动手揭示：把两个尺度一起画出

实验显示 \(R(X,Y)Z\)、非退化截面分母、Ricci/标量缩并，并画出

$$
\frac{D^2J}{ds^2}+R(J,T)T=0,\qquad J\perp T\Longrightarrow j''+Kj=0
$$

的有限解，以及边长 \(\ell\) 小方圈的 \(\theta\approx K\ell^2\) 首阶账。小圈反向绕行时角度反号，高阶项和全局拓扑没有被隐藏进这个近似。

<div class="learning-lab" data-learning-lab="riemann-curvature" markdown="1">

**无 JavaScript 时的静态后备：**默认取球面模型 \(K=1/4\)、\(n=3\)、\(X=e_1,Y=Z=e_2\)、\(\ell=0.6\)、\(s=5\)。于是

| 项目 | 静态值 | 读法 |
|---|---:|---|
| \(R(X,Y)Z\) | \((1/4,0,0)\) | 采用本页 \(R=\nabla_X\nabla_Y-\nabla_Y\nabla_X-\nabla_{[X,Y]}\) |
| \(\lvert X\wedge Y\rvert^2\) | \(1\) | 非退化二维截面 |
| \(K(\sigma)\) | \(1/4\) | \(\langle R(X,Y)Y,X\rangle/\lvert X\wedge Y\rvert^2\) |
| \(\operatorname{Ric}^{\sharp}(X)\) | \((1/2,0,0)\) | \((n-1)KX\)，不是把 Ricci 误写成 \(KX\) |
| \(S\) | \(3/2\) | \(n(n-1)K\) |
| \(j(5)/j(0)\) | \(\cos(5/2)\approx-0.8011\) | 正曲率的有限振荡；越过首个共轭点后符号反映 Jacobi 场方向 |
| 小圈 \(\theta\) | \(K\ell^2=0.09\) rad | \(K\) 的 \(L^{-2}\) 与面积的 \(L^2\) 抵消 |

若选 \(X\parallel Y\)，R 仍可计算但分母为零，不能把退化平面叫作一个截面。有限图表不证明 Bonnet–Myers 或 Cartan–Hadamard，也不替代一般流形上的完备性、连通性和曲率界假设。

</div>

### 5. 定理边界

- “\(\Gamma=0\) 坐标存在当且仅当 \(R=0\)”必须读成**邻域内平坦坐标**：在一个足够小的邻域上，若 \(R\) 在该邻域恒为零，才可找坐标使全部 \(\Gamma^k_{ij}\) 在该邻域恒为零，反之亦然。单点总能取法坐标使 \(\Gamma(p)=0\)，这不推出 \(R(p)=0\)。
- **Bonnet–Myers**：完备 \(n\) 维流形若 \(\operatorname{Ric}\ge(n-1)k\,g\)、\(k>0\)，则直径不超过 \(\pi/\sqrt{k}\)，并推出紧致与基本群有限。实验没有检查完备性，也没有证明该定理。
- **Cartan–Hadamard**：完备、单连通且所有截面曲率 \(K\le0\) 时，\(\exp_p\) 是到流形的全局微分同胚。把三条有限曲线或一张 toy 图当成该全局结论是不合法的。
- 常曲率的完备、单连通模型按 \(K>0,=0,<0\) 分别对应球面型、欧氏型、双曲型，尺度由 \(\lvert K\rvert\) 决定；“三种模型”不是任意不完备或非单连通空间的分类。

</section>

## 1. 黎曼曲率张量

曲率是联络二阶不交换的张量账本：

$$
R(X,Y)Z=\nabla_X\nabla_YZ-\nabla_Y\nabla_XZ-\nabla_{[X,Y]}Z.
$$

它对 \(X,Y,Z\) 张量化，而 Christoffel 符号本身不是张量。曲率的反对称性、交换对称性和第一 Bianchi 恒等式把独立分量从 \(n^4\) 压到 \(n^2(n^2-1)/12\)；\(n=2\) 时只有一个独立曲率分量，正是曲面只有一个 Gauss 曲率的高维对应。

单点法坐标只能让 \(\Gamma(p)=0\)，不能让曲率消失。只有邻域内平坦，才有邻域内全为零的 Christoffel 坐标。

## 2. 截面、Ricci 与数量曲率

对于非退化二维平面 \(\sigma=\operatorname{span}\{X,Y\}\)，

$$
K(\sigma)=\frac{\langle R(X,Y)Y,X\rangle}{\lvert X\wedge Y\rvert^2},\qquad
\lvert X\wedge Y\rvert^2=\lvert X\rvert^2\lvert Y\rvert^2-\langle X,Y\rangle^2.
$$

Ricci 记录沿一个方向的截面曲率迹，数量曲率是 Ricci 再取迹。对常曲率模型，\(\operatorname{Ric}=(n-1)K g\)、\(S=n(n-1)K\)；对一般度量不能把这两个等式当作无条件恒等式。

## 3. 曲率与拓扑的第一批定理

Bonnet–Myers 和 Cartan–Hadamard 都是“曲率 + 完备性 + 全局拓扑假设”的定理，不能只凭局部 \(R\) 数值调用。正 Ricci 通过第二变分控制过长最短测地线；非正截面曲率与完备单连通性共同保证指数映射的全局性质。缺掉任何一组条件，结论都可能失效。

曲面的 Gauss–Bonnet 在高维通向 Chern–Gauss–Bonnet；Ricci 流 \(\partial_tg=-2\operatorname{Ric}\) 则把曲率变成演化方程。这里先把语言和边界立稳，不把后续深定理压缩成一张有限图。

## 4. 三个模型读数

**球面**：半径 \(r\) 时 \(K=1/r^2\)，\(\operatorname{Ric}=(n-1)g/r^2\)，\(S=n(n-1)/r^2\)。

**欧氏空间**：\(R=0\)，存在全局平直坐标，测地线偏离保持初始线性读数，所有小圈和乐为零。

**双曲空间**：\(K=-1/r^2\)，正交 Jacobi 场的模型解含 \(\cosh(s/r)\)，但“指数增长”仍是常曲率模型的解式，不等于对任意负曲率数据的一次 benchmark。

---

*下一门：代数拓扑把“洞”做成基本群、覆盖空间与同调；本页的和乐与指数映射会在那里继续留下全局痕迹。*
