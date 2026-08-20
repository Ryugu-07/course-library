# 电动力学 I · 边值问题与多极展开

> **对标**：Jackson §1–4 ｜ **前置**：em-01、mp-01（Legendre/Green 函数）、pde2-03（唯一性）
> Jackson 前半的主体是一门手艺：**在给定边界下解 Laplace/Poisson 方程**。本页把兵器谱配齐（唯一性定理、镜像法的进阶、分离变量的球谐版、Green 函数的正式化）并立起**多极展开**——"远看一切电荷分布"的标准语言。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="image-charge-learning-title">

## 学习层：镜像法不是魔术，而是一张可核对的边界账

<h3 id="image-charge-learning-title">1. 先固定接地平面模型</h3>

取物理区域为 $z>0$，接地导体平面为 $z=0$，真实点电荷 $q$ 放在 $(0,0,d)$，其中 $d>0$。用数学上的镜像电荷 $-q$ 放在 $(0,0,-d)$，在物理半空间内构造

$$
V(\rho,z)=kq\left[\frac1{\sqrt{\rho^2+(z-d)^2}}-\frac1{\sqrt{\rho^2+(z+d)^2}}\right],
\qquad k=\frac1{4\pi\varepsilon_0}.
$$

实验使用 $k=1$ 的无量纲单位，因此 $\varepsilon_0=1/(4\pi)$。先预测：平面上的 $V$ 是否逐点为零？法向场的方向和大小怎样随 $\rho$ 变？诱导总电荷会趋向 $-q$、$q$ 还是 $0$？

### 2. 四项透明核对

在 $z=0^+$，真实电荷和镜像到每个平面点的距离相等，所以

$$
V(\rho,0)=0,\qquad \mathbf E_t(\rho,0)=0,
$$

而法向分量为

$$
E_z(\rho,0^+)=-\frac{2kqd}{(\rho^2+d^2)^{3/2}},
\qquad
\sigma(\rho)=\varepsilon_0E_z(\rho,0^+)= -\frac{qd}{2\pi(\rho^2+d^2)^{3/2}}.
$$

把面电荷积分到半径 $R$ 的圆盘：

$$
Q_{\mathrm{ind}}(R)=-q\left(1-\frac{d}{\sqrt{R^2+d^2}}\right)\xrightarrow[R\to\infty]{}-q.
$$

真实电荷受到的力可以用镜像场计算，但镜像不是第二个真实电荷：

$$
\mathbf F=q\mathbf E_{\mathrm{image}}(0,0,d)= -\frac{kq^2}{4d^2}\,\hat{\mathbf z}.
$$

实验会逐点显示 $V$、切向场、$E_z$ 与闭式值的误差，再显示力和诱导电荷积分；这些是同一解析模型的交叉核对，不是抽样测量。

<div class="learning-lab" data-learning-lab="image-charge-boundary" markdown="1">

**JavaScript 失效时的静态 fallback：**默认 $q=1,d=1,k=1$。在 $\rho=0,1,2$ 三个平面点，边界电势与切向场均为 $0$；法向场分别为

| $\rho$ | $V(\rho,0)$ | $|E_t|$ | 闭式 $E_z$ | 真实电荷所受力 $F_z$ |
|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | $-2$ | $-1/4$ |
| 1 | 0 | 0 | $-1/\sqrt2\approx-0.707107$ | $-1/4$ |
| 2 | 0 | 0 | $-2/5^{3/2}\approx-0.178885$ | $-1/4$ |

对应 $\sigma(\rho)=-1/[2\pi(\rho^2+1)^{3/2}]$，其全平面积分是 $Q_{\mathrm{ind}}=-1=-q$，半径 $R$ 内的部分是 $-(1-1/\sqrt{R^2+1})$。图中的下方 $-q$ 只是构造 Dirichlet Green 函数的数学像，**不是物理区域内新放置的电荷**。

镜像结论依赖唯一性条件：物理区域取 $z>0$，给定平面上的 Dirichlet 值 $V=0$，并要求无穷远处解按所选衰减条件消失。若换成非零边界、有限导体、Neumann 问题或不指定无穷远行为，必须重新检查唯一性与附加条件；有限表格不能替代那个证明。

</div>

### 3. 读账边界

- **镜像不是物理源。**它只是在 $z>0$ 内产生同一个势的辅助源；导体表面真实的响应由 $\sigma=\varepsilon_0E_n$ 表示。
- **边界核对要分量。**$V=0$、$E_t=0$ 和 $E_z$ 的闭式值是不同证书；只看一张等势图不能证明场与力都正确。
- **唯一性是收尾条件。**验证边界后能否把构造解称为物理解，取决于区域、Dirichlet/Neumann 类型与无穷远条件；不能把“镜像法有效”写成无条件技巧。
- **有限点不是一般边值定理。**交互表只审计所选半径和参数，球面、带电平面及介质界面需要各自的 Green 函数或匹配条件。

</section>

## 1. 唯一性定理（一切技巧的执照）

**定理【推导】** 给定区域内 $\rho$ 与边界上的 $V$（Dirichlet），Poisson 方程解唯一；给定 $\frac{\partial V}{\partial n}$（Neumann）时，还必须满足由散度定理给出的总通量兼容条件，解才存在，并且只唯一到一个加法常数。
*证*：两解之差 $u$ 调和且边界项为零；Green 第一恒等式 $\int|\nabla u|^2 = \oint u\frac{\partial u}{\partial n} = 0$ ⇒ $\nabla u \equiv 0$。$\blacksquare$
**读法**：**"猜出来的解就是唯一的解"**——镜像法的合法性来源（猜一组像电荷、验证边界条件、唯一性收工）；也是 pde2-03 能量法的物理版。

**镜像法进阶（Jackson 名题）**：接地导体球外点电荷 $q$（距 $d$）：像电荷 $q' = -\frac{a}{d}q$ 于 $\frac{a^2}{d}$ 处【验证：球面上两电荷势恰抵消——反演点的几何】；不接地/带电球 = 再叠加中心像电荷——一套反演几何吃遍球类边值题。

## 2. 分离变量：球谐版全流程

轴对称 Laplace 通解（mp-01 的 Legendre 在主场）：

$$
V(r, \theta) = \sum_\ell\Big(A_\ell r^\ell + \frac{B_\ell}{r^{\ell+1}}\Big)P_\ell(\cos\theta)
$$

**样板（Jackson 必做题）**：均匀外场中的导体球——边界条件（球面等势 + 远场 $-E_0r\cos\theta$）只激活 $\ell = 1$：$V = -E_0\big(r - \frac{a^3}{r^2}\big)\cos\theta$——感应偶极矩 $p = 4\pi\varepsilon_0a^3E_0$（极化率 $\propto$ 体积：介电响应的原型；瑞利散射 $\propto\omega^4$（em-03）里的那个偶极子就这么来的）。介质球同法（内外解拼接 + 界面条件）——静电屏蔽/退极化因子全家。

## 3. Green 函数的正式化

**Dirichlet Green 函数**采用 Gaussian 型归一化：$\nabla'^2G_D(\mathbf r,\mathbf r')=-4\pi\delta^3(\mathbf r-\mathbf r')$、边界上 $G_D=0$，则

$$
V(\mathbf r) = \frac{1}{4\pi\varepsilon_0}\int\rho\,G_D\,dV' - \frac{1}{4\pi}\oint V_{\text{边界}}\,\frac{\partial G_D}{\partial n'}\,dA'
$$

**【骨架】** Green 第二恒等式（数分 VI 分部积分的对称形式）对 $V$ 与 $G_D$ 使用。$\blacksquare$
**读法**：**一次求 $G_D$、终身解该几何的一切边值题**（源与边界值都变成"查表积分"）；镜像法 = 构造 $G_D$ 的几何技巧（球的 $G_D$ 就是 §1 的像电荷公式——两板斧原是一把）；mp-01 的"逆算子"语言在此获得带边界的完整形态。

## 4. 多极展开（远场的标准语言）

对 $\frac{1}{|\mathbf r - \mathbf r'|}$ 用母函数展开（mp-01 例 1）：

$$
V(\mathbf r) = \frac{1}{4\pi\varepsilon_0}\Big[\frac{Q}{r} + \frac{\mathbf p\cdot\hat{\mathbf r}}{r^2} + \frac{1}{2}\sum_{ij}\frac{Q_{ij}\hat r_i\hat r_j}{r^3} + \cdots\Big]
$$

单极（总电荷）→ 偶极 $\mathbf p = \int\mathbf r'\rho\,dV'$ → 四极 $Q_{ij}$——**逐阶衰减快一个 $\frac1r$**：远场由第一个非零矩统治（中性分子看偶极、对称分子看四极——分子间力/介电常数微观论的记账单位）。偶极场的标准形态、偶极在外场中的能量 $-\mathbf p\cdot\mathbf E$ 与力矩——介质物理（em-01 §3）的微观地基。

**磁多极一嘴**：无磁单极（em-01）⇒ 磁展开从偶极起步 $\mathbf m = \frac12\int\mathbf r\times\mathbf J\,dV$——电流环、分子电流、地磁场的第一项都是它；下一页辐射场的主角（偶极辐射）已在后台候场。

## 5. 练习与要点

**例 1（镜像球亲算）** $q = 1\ \mu$C、$d = 2a$：$q' = -0.5\ \mu$C 于 $a/2$ 处；吸引力 $F = \frac{qq'}{4\pi\varepsilon_0(d - a^2/d)^2}$——代数三行；由此顺手得导体表面感应密度分布（法向导数）。

**例 2（展开阶数判断）** 水分子（偶极 ~6.2×10⁻³⁰ C·m）与 CO₂（对称、偶极为零、四极非零）：远场势分别 $\propto r^{-2}$ 与 $r^{-3}$——**分子对称性直接决定相互作用的衰减律**（范德华力谱系的第一分岔；CO₂ 是温室气体却"非极性"的电动力学注脚——红外吸收靠振动诱导偶极）。

**例 3（Green 函数复用演示）** 用 §1 球的 $G_D$ 解"球外任意电荷分布 + 球面给定电位"的组合题：两项积分各就各位——"一次投资、终身收租"的体验题。$\blacksquare$

---

*下一页：让源动起来——推迟势、Larmor 公式的正式推导与辐射场：em-03 的口头支票全额兑付。*
