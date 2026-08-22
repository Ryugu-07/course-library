# 电磁 I · 静电与静磁

> **对标**：Griffiths *EM* §2–5 ｜ **前置**：数分 VI（三大公式）、pde-01（Laplace）
> 电磁学前半是"矢量微积分的物理正身"：Gauss 定律 = 散度定理的物理、环路定律 = Stokes 定理的物理。本页把静电静磁的骨架立起来：两对方程、势的语言、以及解题的三板斧（对称性 Gauss、镜像法、分离变量）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="em-01-learning-title">

## 学习层：Gauss 面到底能证明什么？

### 1. 先分开四种证书

设真空中 $\mathbf E=-\nabla V$、$\nabla\cdot\mathbf E=\rho/\varepsilon$。Gauss 定律给的是

$$
\Phi_S=\oint_S\mathbf E\cdot d\mathbf A
=\frac{Q_{\rm enc}}{\varepsilon}.
$$

这是**总通量的真值**：任意闭合面都成立，不需要球对称。可是从一个数 $\Phi_S$ 反推出面上每一点的 $\mathbf E$，还需要额外结构：球对称时 $\mathbf E=E(r)\hat{\mathbf r}$ 且 $E$ 在球面上恒定，平面对称时上下 pillbox 面的法向场大小相等。没有对称性的点电荷组仍有正确通量，但不能把 $\Phi_S$ 除以面积就当成局部场。

标势的另一张证书是 Poisson 方程

$$
\nabla^2V=-\frac{\rho}{\varepsilon}.
$$

它既可以在光滑源区逐点读，也可以在界面/点源处按分布读：无限电荷片两侧 $\nabla^2V=0$，但法向场跳跃 $E_n(0+)-E_n(0-)=\sigma/\varepsilon$；点电荷的源项是 $\delta$，避开点源的有限差分只能检查“那里近似调和”。

最后，$V$ 只有规范自由 $V\mapsto V+C$：$\mathbf E$ 不变。给定 Dirichlet 边界电势会固定 $C$；只给 Neumann 法向导数时，解通常只确定到一个加法常数，这和“场已唯一”不是同一句话。

### 2. 三项预测：通量、场恢复与边界

1. 非对称电荷分布的闭合面总通量，是否仍等于 $Q_{\rm enc}/\varepsilon$？
2. 已知非对称球面的总通量，能否直接得到球面每一点的电场？
3. 把电势加上常数会不会改变电场？只给 Neumann 数据能否固定电势零点？

实验固定三种可审计模型：均匀带电球、无限电荷片、两个非对称点电荷。揭示后可切换 $V$ 的规范常数和 Dirichlet/Neumann 解释，并同时看到通量真值、对称性场恢复误差、等势采样 spread 与 Poisson 证书。

### 3. 静态 fallback：一张证书账本

| 源数据 | Gauss 通量真值 | 能否由通量恢复场 | 等势结构 | Poisson / 边界读法 |
|---|---|---|---|---|
| 均匀带电球 | $Q_{\rm enc}/\varepsilon$ | 能；球面上 $E$ 恒定 | 同心球面 | 球内 $\nabla\cdot\mathbf E=\rho/\varepsilon$，球外为 $0$ |
| 无限电荷片 | $\sigma A/\varepsilon$ | 能；上下两面由平面对称配对 | 平行于电荷片的平面 | 两侧 Laplace，界面法向跳跃为 $\sigma/\varepsilon$ |
| 非对称点电荷 | $(\sum q_i)/\varepsilon$ | 不能；球面上 $E$ 一般不恒定 | 一般不是所选球面 | 避开点源处可数值看到 $\nabla^2V\approx0$，点源的 $\delta$ 需分布理论 |

**读图原则：**红色箭头只表示所选模型的代表性 $\mathbf E$，金色虚线只表示有限采样的等势检查；通量数值逼近趋近理论值，不会替代散度定理、对称性假设或边界唯一性证明。

<div class="learning-lab" data-learning-lab="electrostatic-certificates" markdown="1">

**无 JavaScript 时的静态读法：**先用上表判断证书等级。球/平面行可以把场从通量提出积分号，因为对称性使法向场恒定或成对相等；非对称行只能相信闭合面通量，不能相信“平均场 = 每点场”。规范常数只平移 $V$，而 Dirichlet 固定零点、Neumann 留一个常数自由度。

### 4. 定理假设与失效边界

- **Gauss 的适用边界**：闭合面足够分段光滑、$\mathbf E$ 与电荷满足 Maxwell 方程；通量结论本身不要求选面具有对称性，但“由通量恢复场”要求球、平面等对称性确实保持源与边界。
- **Poisson 的源项边界**：光滑 $\rho$ 时可逐点使用 $\nabla^2V=-\rho/\varepsilon$；界面电荷和点电荷要加入跳跃项或 $\delta$ 分布，不能把奇异源当成普通有限函数。
- **等势与唯一性**：等势面只说明切向场为零，不能由一条有限采样曲线证明整个曲面等势。Dirichlet 问题在合适区域给出唯一 $V$；Neumann 问题还需相容条件，并且 $V+C$ 的加法常数不可由法向导数消除。
- **证据等级**：脚本的通量求积、等势 spread 和点源附近有限差分只针对固定模型、采样面与步长；它们是数值证据。Gauss/Poisson/唯一性结论是带上述假设的定理级陈述。

</section>

## 1. 静电：从 Coulomb 到 Gauss


<figure class="diagram" markdown="1">
![高斯面/安培环路：用一个对称面/环把 Gauss、Ampère 定律的&quot;通量=电荷、环量=电流&quot;画清。](assets/img/em-01-gauss-ampere.svg)
<figcaption><span class="fig-id">图 em-01.2</span>高斯面/安培环路：用一个对称面/环把 Gauss、Ampère 定律的"通量=电荷、环量=电流"画清。</figcaption>
</figure>

<figure class="plot" markdown="1">
![电偶极子场线](assets/img/em-01-field-lines.svg)
<figcaption><span class="fig-id">图 1.1</span>电偶极子的电场线：从正电荷发出、终于负电荷，处处切于电场方向、密度表征场强。</figcaption>
</figure>

点电荷场 $\mathbf E = \frac{1}{4\pi\varepsilon_0}\frac{q}{r^2}\hat{\mathbf r}$ 叠加成一般场。两条等价定律**【推导】**：

**Gauss 定律**：$\oint\mathbf E\cdot d\mathbf A = \frac{Q_{\text{enc}}}{\varepsilon_0}$ ⟺ $\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}$（点电荷通量 = $\frac{q}{\varepsilon_0}$ 与半径无关——$\frac{1}{r^2}$ 与球面积 $r^2$ 恰好相消，**平方反比律的几何本质**；散度定理（数分 VI）升级为微分形式；$\nabla\cdot\frac{\hat{\mathbf r}}{r^2} = 4\pi\delta^3(\mathbf r)$——pde2-01 的 δ 在物理的原产地）。

**无旋性**：$\nabla\times\mathbf E = 0$（中心力保守，mech-01/数分 VI）⇒ 标势 $\mathbf E = -\nabla V$，$V = \frac{1}{4\pi\varepsilon_0}\int\frac{\rho\,dV'}{|\mathbf r - \mathbf r'|}$。

合并即**泊松方程** $\nabla^2 V = -\frac{\rho}{\varepsilon_0}$（真空处 Laplace）——**静电学 = 椭圆 PDE 的边值问题**（pde-01/pde2-03 的物理主顾；调和函数的极值原理翻译成"电势无内部极值 ⇒ 空腔屏蔽"）。

**解题三板斧**：

1. **对称性 + Gauss**（球/柱/面三种对称直接积分——例 1）；
2. **镜像法**：接地导体旁的点电荷 ⟺ 镜像电荷的双电荷问题（唯一性定理背书：边界条件相同则解相同【骨架：两解之差调和且边界为零 ⇒ 恒零——能量积分或极值原理】）；
3. **分离变量**：球坐标下 Laplace 方程的解 = Legendre 多项式级数（mp-01 的特殊函数在此上岗）。

**导体与电容**：静电平衡 ⇒ 导体内 $\mathbf E = 0$、表面等势、电荷聚于表面（曲率大处密——尖端放电）；电容 $C = Q/V$，能量 $U = \frac12 CV^2 = \frac{\varepsilon_0}{2}\int E^2\,dV$——**能量储于场中**（不是电荷上）：场的实在性第一证据（em-03 展开）。

## 2. 静磁：从 Biot–Savart 到 Ampère

电流产生磁场：$d\mathbf B = \frac{\mu_0}{4\pi}\frac{I\,d\boldsymbol\ell\times\hat{\mathbf r}}{r^2}$（Biot–Savart）。两条微分定律：

$$
\nabla\cdot\mathbf B = 0 \qquad (\text{无磁荷——磁力线永闭合}), \qquad \nabla\times\mathbf B = \mu_0\mathbf J \quad (\text{Ampère})
$$

（环路定律 ⟺ Stokes 定理（数分 VI）；$\nabla\cdot\mathbf B = 0$ ⇒ 矢势 $\mathbf B = \nabla\times\mathbf A$——"无散场必是旋度"，Poincaré 引理（grad-math 流形 II）的物理化身；规范自由 $\mathbf A \to \mathbf A + \nabla\chi$ 首次登场——它将长成 20 世纪物理的中心思想（pp-01））。

**静电静磁对照表**（结构之美）：

| | 静电 | 静磁 |
|---|---|---|
| 源 | 电荷 $\rho$ | 电流 $\mathbf J$ |
| 散度 | $\rho/\varepsilon_0$ | $0$（无磁单极） |
| 旋度 | $0$ | $\mu_0\mathbf J$ |
| 势 | 标势 $V$ | 矢势 $\mathbf A$ |
| 解题 | Gauss 面 | Ampère 环 |

**受力**：Lorentz 力 $\mathbf F = q(\mathbf E + \mathbf v\times\mathbf B)$——磁力不做功（$\perp \mathbf v$）；回旋运动 $\omega_c = \frac{qB}{m}$（质谱仪、回旋加速器、极光的一条公式）。

## 3. 介质一瞥（宏观场论的雏形）

极化 $\mathbf P$、磁化 $\mathbf M$ 把束缚电荷/电流打包：$\mathbf D = \varepsilon_0\mathbf E + \mathbf P$、$\mathbf H = \frac{\mathbf B}{\mu_0} - \mathbf M$——宏观 Maxwell 方程用自由源写（"平均掉微观自由度换有效理论"——粗粒化思想的第一次出场，重整化群（asm-03）哲学的远祖）。线性介质 $\varepsilon, \mu$；静电边界条件由积分定律跨界面收缩得到：$\mathbf n\cdot(\mathbf D_2-\mathbf D_1)=\sigma_{\rm free}$，只有没有自由面电荷时法向 $D$ 才连续；切向 $E$ 则连续【骨架】。

## 4. 练习与要点

**例 1（Gauss 三板斧样板）** 均匀带电球体：外部 $E = \frac{Q}{4\pi\varepsilon_0 r^2}$（如点电荷）、内部 $E = \frac{Qr}{4\pi\varepsilon_0R^3}$（线性）——"内部只看包住的电荷"；同法立得无限长线（$\propto 1/r$）与无限大面（常数）——三种衰减律一次记齐。

**例 2（镜像法经典）** 接地无限平面上方 $d$ 处点电荷 $q$：镜像 $-q$ 于 $-d$，表面感应电荷密度 $\sigma(r) = \frac{-qd}{2\pi(r^2 + d^2)^{3/2}}$（对 $V$ 求法向导数），总感应电荷 $= -q$（积分验证）——一套流程三个结论。

**例 3（Ampère 环样板）** 无限螺线管：环路取跨壁矩形 ⇒ 内部 $B = \mu_0 nI$ 均匀、外部为零——MRI 磁体、电感器的第一公式；能量密度 $\frac{B^2}{2\mu_0}$（em-03）由此可算电感储能。$\blacksquare$

---

*下一页：让场随时间动起来——Faraday 感应、位移电流的补丁，Maxwell 方程组合体，然后光从方程里跑出来。*
