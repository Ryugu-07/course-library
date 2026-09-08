# 基础衔接 23 · 模叠：参数空间为什么必须记住自同构

> 先修：[层与粘合](bridge-04-sheaves.html)、[仿射图粘合](bridge-13-affine-gluing.html)、[纤维与基变换](bridge-14-fibers-base-change.html)、[导出范畴](bridge-21-derived-category-roofs.html)。本讲固定底域 $k=\mathbb C$。我们从函子点与群胚值模问题出发，完整计算 $B\mathbb G_m$ 和 $[\mathbb A^1/\mathbb G_m]$ 的两个权作用；目标是看懂“族、基变换、自同构、下降、atlas 与对角线”各自承担什么，不把一张轨道图冒充为模叠。

<div data-learning-page></div>
<section class="learning-layer" markdown="1" aria-labelledby="moduli-stacks-title">

<h2 id="moduli-stacks-title">若所有对象只剩一个名字，它们原来的对称性去了哪里？</h2>

## 1. 模问题不是一张对象名单，而是一套随底空间变化的族

一个几何模问题首先问：对每个测试概形 $T$，有哪些以 $T$ 为参数的对象族？因此它自然表现为反变赋值

$$
\mathcal M:(\mathrm{Sch}/k)^{\mathrm{op}}
\longrightarrow\mathrm{Groupoids}.
$$

$\mathcal M(T)$ 的对象是 $T$-族，箭头是族的同构。之所以取群胚，是因为模问题通常只把同构当作可逆比较；非可逆退化由底空间和族本身编码，不直接作为纤维群胚中的箭头。

给态射

$$
f:T'\longrightarrow T,
$$

每个 $T$-族 $E$ 都必须能拉回成 $T'$-族

$$
f^*E\in\mathcal M(T').
$$

若再有 $g:T''\to T'$，则 $(fg)^*E$ 与 $g^*f^*E$ 有规范同构，并满足更高的结合相容性。为了入门常把它写成严格等号，但真正的纤维范畴保存这些规范同构；忽略它们会在复杂基变换中产生不相容选择。

例如“秩 $r$ 向量丛”的 $T$-点不是一个固定向量空间，而是 $T$ 上秩 $r$ 的局部自由层。沿 $f$ 拉回后得到 $f^*E$。只列代数闭点上的同构类，既看不到非平凡族，也看不到族在无穷小底空间上的变形。

## 2. 为什么取同构类集合会丢失可计算信息

给群胚 $\mathcal M(T)$ 取对象的同构类集合

$$
\pi_0\mathcal M(T)
$$

会删掉每个对象 $E$ 的自同构群

$$
\operatorname{Aut}_T(E).
$$

这不是只少了“对象有多对称”的注释。自同构控制对角线、稳定子、变形理论中的负一次方向，以及许多积分和计数公式中的权重。两个模问题即使有相同的同构类集合，也可能因稳定子不同而不是同一个叠。

最小例子是一个一维复向量空间。所有一维空间彼此同构，所以同构类集合只有一个元素；但一个给定的一维空间有自同构群

$$
\mathbb C^\times.
$$

把它压成一个普通点，会把所有非零缩放都删掉。模叠 $B\mathbb G_m$ 正是保存这份信息的对象。

## 3. $B\mathbb G_m$：几何点只有一类，群胚却绝不平凡

对任意测试概形 $T$，定义

$$
B\mathbb G_m(T)
=\{\mathbb G_m\text{-torsors on }T\}
$$

及其 torsor 同构组成的群胚。$\mathbb G_m$-torsor 与线丛等价，所以也可写成

$$
B\mathbb G_m(T)
=\{\text{line bundles on }T\text{ and their isomorphisms}\}.
$$

当 $T=\operatorname{Spec}\mathbb C$ 时，每个线丛都平凡，因此只有一个同构类；但平凡线丛的自同构群是 $\mathbb G_m(\mathbb C)=\mathbb C^\times$。所以

$$
B\mathbb G_m(\mathbb C)
\simeq */\!/\mathbb C^\times,
$$

右边表示“一个对象及其全部自同构”的群胚，不是普通单点集合。

更重要的是，换成 $T=\mathbb P^1$ 后会出现 $\mathcal O(d)$ 等非平凡线丛。它们在每张仿射图上都平凡，却不能由一个全局基向量描述。若只看

$$
*/\mathbb G_m(T)
$$

这类使用全局函数作规范变换的朴素作用群胚，只能得到平凡 torsor；正确的 $B\mathbb G_m(T)$ 必须允许在覆盖上平凡、再用过渡函数粘合的 torsor。

## 4. 商叠 $[X/G]$ 的 T-点：torsor 加等变映射

令代数群 $G$ 左作用在概形 $X$ 上。商叠不能只定义成点集 $X/G$。它在测试概形 $T$ 上的对象是

$$
\boxed{(P\to T,\ u:P\to X),}
$$

其中 $P\to T$ 是右 $G$-torsor，而 $u$ 满足

$$
u(pg)=g^{-1}u(p).
$$

箭头是与 $u$ 相容的 torsor 同构。这个定义自动包含非平凡 torsor，也让基变换明确可算：

$$
(P,u)\longmapsto
(P\times_TT',\ u|_{P\times_TT'}).
$$

取 $X=\operatorname{Spec}k$ 且作用平凡，就恢复

$$
[\operatorname{Spec}k/G]=BG.
$$

若 $T=\operatorname{Spec}\mathbb C$ 且 torsor 平凡，群胚可以画成普通作用群胚：对象是 $x\in X(\mathbb C)$，从 $x$ 到 $y$ 的箭头是满足 $g\cdot x=y$ 的群元素。特别地，

$$
\operatorname{Aut}(x)=G_x
$$

就是稳定子。这个几何点画面适合算稳定子，但不能替代任意 $T$ 上的 torsor 定义。

## 5. 主模型：$\mathbb G_m$ 以权 $w$ 作用在 $\mathbb A^1$

令

$$
\lambda\cdot x=\lambda^w x,
\qquad w\ge1,
$$

并记商叠为

$$
\mathcal X_w=[\mathbb A^1/\mathbb G_m].
$$

一个 $T$-点可具体改写成

$$
\boxed{(L,s),\qquad
L\text{ 是 }T\text{ 上线丛},\quad
s\in\Gamma(T,L^{\otimes w}).}
$$

理由是：按上面的右 torsor 约定，令 $L=P\times^{\mathbb G_m}\mathbb C_1$，其中 $(p\lambda,v)\sim(p,\lambda v)$。条件 $u(p\lambda)=\lambda^{-w}u(p)$ 正好让 $u$ 下降成 $L^{\otimes w}$ 的截面。沿 $f:T'\to T$ 基变换时，

$$
(L,s)\longmapsto(f^*L,f^*s).
$$

所以“参数移动”不是把一个复数 $x$ 代入另一张表，而是连线丛与截面一起拉回。

先在复几何点上算轨道。无论 $w=1$ 还是 $w=2$，都有两个轨道类型：

$$
\{0\},
\qquad \mathbb C^\times.
$$

非零轨道的闭包包含 $0$。坐标环中的正权单项式都不是不变量，因此

$$
\mathbb C[x]^{\mathbb G_m}=\mathbb C.
$$

所以仿射不变量商是单点，连两个轨道类型都不能分开。朴素轨道集合保留两个元素，却仍删掉下面的稳定子。

<figure markdown="1">
![顶部说明模问题把每个测试概形送到对象与同构组成的群胚，并沿基变换拉回。中部把商叠的T点拆成G torsor和等变映射。底部比较Gm作用在仿射直线的权一和权二：两者都有零轨道与非零轨道，不变量环都只有常数，但权一非零点稳定子平凡，权二非零点稳定子为正负一组成的mu二。](assets/img/bridge-23-moduli-stacks.svg)
<figcaption markdown="1">轨道集合与不变量商都不能区分权 1、权 2 的全部几何；商叠保留的稳定子立刻看出差异。对一般底空间，还必须把平凡轨道图升级为 torsor 与下降数据。</figcaption>
</figure>

## 6. 权 1 与权 2：同一轨道图，不同稳定子

若 $x=0$，任意 $\lambda\in\mathbb G_m$ 都固定它，所以

$$
\operatorname{Stab}(0)=\mathbb G_m
$$

对两个权都成立。

若 $x\ne0$，稳定条件是

$$
\lambda^w x=x
\quad\Longleftrightarrow\quad
\lambda^w=1.
$$

因此

$$
\operatorname{Stab}_{w=1}(x)=\{1\},
$$

而

$$
\boxed{
\operatorname{Stab}_{w=2}(x)=\mu_2=\{1,-1\}.
}
$$

权 $2$ 的 $-1$ 实际上固定每一个点，所以该作用有全局核 $\mu_2$；权 $1$ 的非零轨道则是自由的。两种作用的轨道集合都是“零、非零”两个类型，不变量环也同为 $\mathbb C$，但商叠在稠密非零轨道上的稳定子不同。因此

$$
[\mathbb A^1/\mathbb G_m]_{w=1}
\not\simeq
[\mathbb A^1/\mathbb G_m]_{w=2}.
$$

用 $(L,s)$ 语言也能看到同一结论。对权 $1$ 的非零 $s\in L$，截面把 $L$ 平凡化，保持 $s$ 的线丛自同构只能是恒等。对权 $2$，非零 $s\in L^{\otimes2}$ 只把 $L^2$ 平凡化；缩放 $L$ 的 $-1$ 仍保持 $s$，于是留下 $\mu_2$。

## 7. 下降：局部对象和重叠同构何时来自一个全局对象

令 $\{T_i\to T\}$ 是 fppf 覆盖。模问题成为 stack in groupoids，需要两类下降条件：

1. 对两个对象 $E,F\in\mathcal M(T)$，它们的同构在覆盖上构成一个层；局部同构若在重叠上一致，就唯一粘合。
2. 给每个 $T_i$ 上的对象 $E_i$，以及重叠 $T_{ij}$ 上的同构

$$
\phi_{ij}:E_j|_{T_{ij}}\xrightarrow{\sim}E_i|_{T_{ij}},
$$

若在三重重叠满足 cocycle

$$
\phi_{ij}\phi_{jk}=\phi_{ik},
$$

则这些数据必须来自某个全局对象 $E$，并且这个粘合在同构意义下唯一。

对 $B\mathbb G_m$，这就是线丛的下降。沿用 [Čech 讲义](bridge-06-cech.html)的基向量约定，以 $\mathbb P^1=U_0\cup U_1$ 为例，两张图上取平凡线丛，并在重叠上规定 $e_1=z^d e_0$，就粘出 $\mathcal O(d)$。当 $d\ne0$ 时，不能用两张图上的可逆正则函数把 $z^d$ 同时消成 $1$，所以得到真正的非平凡全局 torsor。

这解释了为什么商叠定义要使用 torsor。只写 $X(T)$ 上的全局群作用，只捕捉已经全局平凡化的 torsor；stackification 补入所有局部平凡且满足下降的数据。

## 8. 何时称为代数叠：下降还不够

一个 fppf stack in groupoids $\mathcal X$ 若要成为本讲约定下的**代数叠**，还要满足两条几何可表示性条件：

$$
\boxed{
\Delta_{\mathcal X}:\mathcal X\to\mathcal X\times\mathcal X
\text{ 可由代数空间表示},
}
$$

并且存在概形 $U$ 与光滑满射

$$
\boxed{U\longrightarrow\mathcal X.}
$$

第二支箭头叫光滑 atlas。它允许用一张概形图覆盖叠，但叠本身通常不是概形。第一条对角线条件并非技术附录：对两个 $T$-对象 $E,F$，纤维积

$$
T\times_{(E,F),\,\mathcal X\times\mathcal X}\mathcal X
$$

正是 $\operatorname{Isom}_T(E,F)$。因此对角线可表示，意味着“同构与自同构也组成可控的代数几何对象”。

若 $G$ 是光滑仿射代数群并作用在概形 $X$ 上，标准映射

$$
X\longrightarrow[X/G]
$$

是光滑满射 atlas；沿一个 $T$-点 $(P,u)$ 拉回这张 atlas，得到的正是 torsor $P\to T$。对角线则记录等变同构。于是本讲的

$$
B\mathbb G_m,
\qquad[\mathbb A^1/\mathbb G_m]
$$

都是代数叠。

Deligne-Mumford 条件要求可取 étale atlas，因而稳定子必须是离散的相应群概形。$[\mathbb A^1/\mathbb G_m]$ 在 $0$ 处有正维稳定子 $\mathbb G_m$，所以无论权 $1$ 还是权 $2$，都不是 Deligne-Mumford 叠。权 $2$ 的非零稳定子 $\mu_2$ 是有限的，并不能消除原点处的失败。

## 9. 同时计算轨道、稳定子与非平凡族

<div class="learning-lab" data-learning-lab="research-moduli-stacks" data-research-topic="quotient-gm"></div>

先在复几何点上改变权与零/非零类型。图画单位圆上的群元素 λ 与其像 λ^w x，标出完整的有限稳定子 μ_w；x=0 时整个复乘法群都是稳定子，单位圆仅是其中的实截面，不能把它当作整个 Gm。表格同时保留轨道集和不变量商，比较信息丢在哪里。

<div class="learning-lab" data-learning-lab="research-moduli-stacks" data-research-topic="descent"></div>

再把底空间换成 P¹，实际拉回过渡函数。图沿重叠圆 z=e^(iθ) 展示 z^d 与 (z^m)^d 的相位，次数变化来自代入，不是把若干离散点粘起来。截面空间维数由两张图的正则性计算：对 L^w=O(wd)，局部多项式次数必须在0到wd之间，所以维数为 max(wd+1,0)。负次数时只有零截面；零截面始终是合法对象。

对非负 wd，例取齐次截面 X₀^(wd)，它在无穷远的零点阶为 wd，拉回后为 mwd。当 wd>0 时这不是处处非零截面；它的零点不能被“非零轨道”按钮抹掉。两个实验分别审查几何点和全局族，不能把前者的非零数值冒充任意线丛的全局非零框架。

默认 $w=2,x=1,T=\operatorname{Spec}\mathbb C$ 时：

$$
\operatorname{Orb}(1)=\mathbb C^\times,
\qquad
\overline{\operatorname{Orb}(1)}=\mathbb A^1,
$$

$$
\operatorname{Stab}(1)=\mu_2,
\qquad
\mathbb C[x]^{\mathbb G_m}=\mathbb C.
$$

因此轨道集合报告“非零”这一类，不变量商报告一个点，stack 视图还必须报告自同构 $\{1,-1\}$。切到 $x=0$ 后稳定子变成整个 $\mathbb G_m$；切到权 $1$ 后非零稳定子变平凡。组件若只显示两个轨道点，就没有实现本讲的教学目标。

对 $T=\mathbb P^1,d=1$，无脚本状态显示过渡函数 $z$ 给出 $\mathcal O(1)$。它在 $U_0,U_1$ 上分别平凡，基变换到任一图后确实成为平凡 torsor；但在整个 $\mathbb P^1$ 上不能选出无零全局框架。

## 10. 两道迁移题

**题一。** 把主模型改成权 $3$ 作用

$$
\lambda\cdot x=\lambda^3x.
$$

写出商叠的 $T$-点，计算 $x=0$ 与 $x\ne0$ 的稳定子，并求仿射不变量环。它与权 $1$ 商叠能否等价？

<details markdown="1"><summary>查看线丛、截面与稳定子</summary>

一个 $T$-点是线丛 $L$ 与截面

$$
s\in\Gamma(T,L^{\otimes3}).
$$

$x=0$ 的稳定子是整个 $\mathbb G_m$。若 $x\ne0$，稳定条件 $\lambda^3=1$ 给出

$$
\operatorname{Stab}(x)=\mu_3.
$$

所有正次单项式都有正权，所以

$$
\mathbb C[x]^{\mathbb G_m}=\mathbb C.
$$

权 $1$ 与权 $3$ 的轨道类型和仿射不变量商相同，但非零点稳定子分别为平凡群与 $\mu_3$，因此商叠不等价。

</details>

**题二。** 在 $B\mathbb G_m(\mathbb P^1)$ 中，用两张标准仿射图和基向量关系 $e_1=z^2e_0$ 构造线丛。再沿

$$
F_3:[X_0:X_1]\longmapsto[X_0^3:X_1^3]
$$

拉回。新的过渡函数和线丛是什么？为什么这个计算同时检验了族的基变换与下降，而不只是次数相乘的口诀？

<details markdown="1"><summary>查看重叠上的实际拉回</summary>

$z^2$ 粘出 $\mathcal O(2)$。在 $U_0$ 上，$F_3$ 把目标坐标 $z$ 拉回成源坐标 $z^3$，所以过渡函数拉回为

$$
(z^3)^2=z^6.
$$

它粘出

$$
F_3^*\mathcal O(2)\cong\mathcal O(6).
$$

计算不是只比较整数：局部平凡线丛先沿两张图拉回，重叠同构 $z^2$ 也必须沿 $F_3$ 拉回，并仍满足 cocycle。正是这组拉回后的下降数据定义了全局线丛；次数 $3\cdot2=6$ 是计算结果。

</details>

## 11. 通往几何 Langlands 还差哪些具体门槛

本讲的 quotient stack 是入口，不是研究级模叠理论的替代品。要读懂

$$
\operatorname{D-mod}_{1/2}(\operatorname{Bun}_G)
\simeq
\operatorname{IndCoh}_{\operatorname{Nilp}}
(\operatorname{LS}_{\check G}),
$$

至少还要逐项补齐：

1. 把 $\operatorname{Bun}_G(T)$ 写成曲线 $X\times T$ 上主 $G$-丛的群胚，并掌握其 atlas、对角线、非准紧性与连通分支。
2. 学习 cotangent complex 与 derived mapping stack。对象的无穷小自同构、变形和障碍不是一张经典切空间能同时保存的；例如 $G$-丛 $P$ 的变形复形由 $R\Gamma(X,\operatorname{ad}P)[1]$ 控制。
3. 在叠上构造 D-模的导出范畴及六函子，处理非安全映射、扭曲和 $\operatorname{Bun}_G$ 上的半密度修正；上一讲的单个 Weyl 商模远远不够。
4. 理解 Hecke correspondence 怎样通过拉回、张量与推前成为函子，并验证不同点、不同表示之间的张量相容性。
5. 在谱侧学习 derived stack $\operatorname{LS}_{\check G}$、IndCoh 与奇异支撑；$\operatorname{Nilp}$ 是余切方向中的全局幂零条件，不是“稳定子含幂零矩阵”的简称。

完成这些门槛后，才进入[几何 Langlands 前沿讲](frontier-03-geometric-langlands.html#langlands-prerequisite-route)的正式公式。权作用实验只证明“稳定子与族必须保留”，没有构造 $\operatorname{Bun}_G$、局部系统模叠、Hecke 特征对象或范畴等价。

</section>

## 速查与资料

模问题把 $T$ 送到 $T$-族及其同构组成的群胚，并沿基变换拉回。$BG(T)$ 是 $G$-torsor 群胚；$[X/G](T)$ 是 torsor 加等变映射。对权 $w$ 的 $\mathbb G_m\curvearrowright\mathbb A^1$，$T$-点是 $(L,s\in L^w)$；权 $1,2$ 的轨道与不变量商相同，非零稳定子却分别为 $1,\mu_2$。代数叠还要求可表示对角线与光滑满射 atlas。

stack in groupoids 的下降定义见 [Stacks Project：Stacks in groupoids](https://stacks.math.columbia.edu/tag/02ZH)，代数叠的三项条件见 [Algebraic stacks](https://stacks.math.columbia.edu/tag/026N)，商叠构造见 [Quotient stacks](https://stacks.math.columbia.edu/tag/04UI)，$BG$ 与 torsor 的精确定义见 [Classifying torsors](https://stacks.math.columbia.edu/tag/036Z)。本讲没有建立一般 Artin 可表示性、coarse moduli space、GIT 稳定性、cotangent complex 或 derived stack；它们是进入研究级模空间前必须继续学习的内容。核查：2026-09-09。
