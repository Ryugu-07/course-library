# 力学 I · 牛顿力学与守恒律

> **对标**：任何理论力学教材开篇 / Kleppner–Kolenkow ｜ **前置**：数分 II/V、ode 线
> 牛顿力学是全部物理的原型：**给定力，运动由二阶 ODE 决定**。本页把框架立严（三定律的真实逻辑地位）、把三大守恒律从方程中推出来，并给出"守恒律 = 求解捷径"的方法论——它是下一页变分力学的铺垫，也是 Noether 定理的直觉预演。


<figure class="diagram" markdown="1">
![三大守恒（能量/动量/角动量）与对称性（时间/空间平移/转动）的 Noether 对应表。](assets/img/mech-01-conservation.svg)
<figcaption><span class="fig-id">图 mech-01.1</span>三大守恒（能量/动量/角动量）与对称性（时间/空间平移/转动）的 Noether 对应表。</figcaption>
</figure>

## 1. 三定律的逻辑结构

**第二定律** $\mathbf F = m\ddot{\mathbf r}$ 是核心：给定力场，轨迹是二阶 ODE 的解——初位置 + 初速度定全程（ode-01 存在唯一性定理的物理化身：**经典力学的决定论就是 Picard 定理**）。第一定律定义惯性系（第二定律成立的参考系——不是第二定律的特例而是它的适用声明）；第三定律 $\mathbf F_{12} = -\mathbf F_{21}$ 是守恒律的来源（见 §2）。

非惯性系的代价：加惯性力（离心力 $-m\boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r)$、Coriolis 力 $-2m\boldsymbol\omega\times\mathbf v$——**【推导】**对旋转系求两次导，$\frac{d}{dt}\big|_{\text{惯性}} = \frac{d}{dt}\big|_{\text{旋转}} + \boldsymbol\omega\times$ 用两遍即得）。台风旋向、傅科摆是 Coriolis 的名场面。

## 2. 三大守恒律（各配两行推导）

**动量**：$\dot{\mathbf P} = \sum\mathbf F_{\text{ext}}$（内力按第三定律成对相消）——外力为零则 $\mathbf P$ 守恒。质心定理：$M\ddot{\mathbf R}_{cm} = \mathbf F_{\text{ext}}$——**复杂系统的质心走简单轨迹**（烟花在空中炸开，质心仍走抛物线）。

**角动量**：$\dot{\mathbf L} = \boldsymbol\tau = \sum\mathbf r\times\mathbf F$（**【推导】**$\dot{\mathbf L} = \dot{\mathbf r}\times m\dot{\mathbf r} + \mathbf r\times m\ddot{\mathbf r}$，第一项自叉积为零）——中心力场（$\mathbf F \parallel \mathbf r$）角动量守恒 ⇒ 轨道在平面内 + Kepler 第二定律（扫面速度 $= \frac{L}{2m}$ 恒定）。

**能量**：$W = \int\mathbf F\cdot d\mathbf r = \Delta T$（动能定理，**【推导】**$\mathbf F\cdot\dot{\mathbf r} = m\ddot{\mathbf r}\cdot\dot{\mathbf r} = \frac{d}{dt}\frac12 m\dot r^2$）；**保守力** = 做功与路径无关 ⟺ $\mathbf F = -\nabla V$ ⟺ $\nabla\times\mathbf F = 0$（单连通域——数分 VI 的三个等价在物理的原产地）⇒ $E = T + V$ 守恒。

**方法论读法**：守恒律把二阶 ODE **降阶为一阶甚至代数问题**——能量守恒的一维运动直接分离变量 $t = \int\frac{dr}{\sqrt{2(E - V)/m}}$，根本不解牛顿方程。"找守恒量优先于解方程"是整个物理的工作习惯；**守恒律从哪来**（为什么恰好这三个）——下一页 Noether 定理给出惊人的回答：对称性。

## 3. 中心力场与 Kepler 问题（本页的完整战役）

中心力场 $V(r)$：角动量守恒把三维问题压到平面、再压到一维——**有效势**：

$$
E = \frac12 m\dot r^2 + \underbrace{\frac{L^2}{2mr^2} + V(r)}_{V_{\text{eff}}(r)}
$$

（离心项 $\frac{L^2}{2mr^2}$ 是角向运动"折算"进径向的能量。）**看 $V_{\text{eff}}$ 图定性读全部轨道**：极小值处圆轨道、$E < 0$ 束缚振荡、$E > 0$ 散射——不解方程先知命运（ode-01 相线分析的力学版）。

**Kepler 问题**（$V = -\frac{k}{r}$）**【推导骨架】**：轨道方程用 Binet 换元 $u = 1/r$，$\frac{d^2u}{d\theta^2} + u = \frac{mk}{L^2}$——**谐振子方程**（！）——解为圆锥曲线：

$$
r = \frac{p}{1 + e\cos\theta}
$$

$e < 1$ 椭圆（Kepler 第一定律）、$e = 1$ 抛物线、$e > 1$ 双曲线（解几 II 的圆锥曲线获得天体力学户口）。第三定律 $T^2 \propto a^3$ 由第二定律积分全椭圆面积得出。（隐藏彩蛋【引用】：Kepler 问题有额外守恒量 Runge–Lenz 矢量——轨道不进动的深层原因，也是氢原子能级简并的经典先声。）

## 4. 练习与要点

**例 1（有效势速判）** $V = -\frac{k}{r}$ 加小扰动 $+\frac{\epsilon}{r^3}$：$V_{\text{eff}}$ 极小点仍存在但圆轨道频率 ≠ 角向频率 ⇒ **椭圆进动**——水星近日点进动问题的牛顿框架版（真实答案要等广相 II）。

**例 2（Coriolis 数量级）** 北纬 45° 自由落体 100 m：东偏 $\approx \frac13\omega g t^3\cos\lambda \sim 1.5$ cm——小但可测；炮弹弹道、气旋方向的日常证据。

**例 3（守恒律解题示范）** 卫星椭圆轨道近地点 $r_1$ 速度 $v_1$，求远地点速度：$L$ 守恒给 $v_2 = v_1 r_1/r_2$，$E$ 守恒定 $r_2$——两个代数式替代整条 ODE：守恒律方法论的最小完整案例。$\blacksquare$

---

*下一页：把力学重写成一条原理——最小作用量与拉格朗日力学，Noether 定理把"守恒从哪来"一并回答。*
