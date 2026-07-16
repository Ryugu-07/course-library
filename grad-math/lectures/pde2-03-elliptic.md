# 现代 PDE III · 椭圆方程的弱解理论

> **对标**：Evans *PDE* §6.1–6.3 ｜ **前置**：pde2-01/02、泛函 II
> 现代 PDE 的标准作业流程在本页完整走一遍：**弱形式化 → Lax–Milgram 给存在唯一 → 能量估计 → 正则性升级**。这套"先在弱空间里赢、再逐步赎回光滑性"的战略，是二十世纪分析学最成功的方法论之一。

## 1. 弱形式：把方程变成积分等式

样板问题（Dirichlet）：

$$
-\Delta u = f \ \text{于 } \Omega, \qquad u = 0 \ \text{于 } \partial\Omega
$$

对测试函数 $v \in H_0^1$ 乘方程、分部积分（边界项被 $v|_{\partial\Omega} = 0$ 杀死）：

$$
\int_\Omega \nabla u\cdot\nabla v\,dx = \int_\Omega f v\,dx \qquad \forall v \in H_0^1(\Omega)
$$

**定义（弱解）**：满足上式的 $u \in H_0^1$。**只需一阶弱导数**——比经典解的 $C^2$ 便宜两个数量级；边界条件内化在空间 $H_0^1$ 里（pde2-02 迹定理的安排）。一般椭圆算子 $-\mathrm{div}(A\nabla u) + cu$ 同构，双线性形式 $B[u,v] = \int A\nabla u\cdot\nabla v + cuv$。

## 2. Lax–Milgram 定理（存在唯一性的发动机）

**定理（Lax–Milgram）** Hilbert 空间 $H$ 上的双线性形式 $B$ 若满足
（i）**有界**：$|B[u,v]| \leq \beta\|u\|\|v\|$；（ii）**强制（coercive）**：$B[u,u] \geq \alpha\|u\|^2$，
则对每个有界线性泛函 $F$，存在唯一 $u \in H$ 使 $B[u, v] = F(v)\ \forall v$，且 $\|u\| \leq \frac{1}{\alpha}\|F\|$。

**【证明】** ① 固定 $u$，$v \mapsto B[u,v]$ 有界线性 ⇒ Riesz 表示（泛函 II）给算子 $Au$：$B[u,v] = \langle Au, v\rangle$；$A$ 线性有界（(i)）。② 强制性给 $\alpha\|u\|^2 \leq \langle Au, u\rangle \leq \|Au\|\|u\|$ ⇒ $\|Au\| \geq \alpha\|u\|$：$A$ 单射且值域闭（Cauchy 列拉回）。③ 值域稠密：若 $w \perp \mathrm{ran}A$ 则 $\alpha\|w\|^2 \leq B[w,w] = \langle Aw, w\rangle = 0$ ⇒ $w = 0$。闭 + 稠 = 满射。④ $F$ 用 Riesz 表示成 $\langle w_F, \cdot\rangle$，解 $u = A^{-1}w_F$；唯一性与界由 ②。$\blacksquare$
（对称情形另有变分证明：$u = \arg\min \frac12 B[v,v] - F(v)$——**弱解 = 能量极小元**，Dirichlet 原理的严格版；非对称时 L–M 正是"没有变分结构也能活"的价值所在。）

**应用到样板**：$B[u,v] = \int\nabla u\cdot\nabla v$ 在 $H_0^1$（范数取 $\|\nabla u\|_{L^2}$）上：有界 = Cauchy–Schwarz；**强制 = Poincaré 不等式**（pde2-02 §3 在此交货——$B[u,u] = \|\nabla u\|^2 \gtrsim \|u\|_{H^1}^2$）⇒ **对每个 $f \in L^2$（甚至 $H^{-1}$），弱解存在唯一且 $\|u\|_{H_0^1} \leq C\|f\|$**——存在、唯一、稳定（连续依赖），Hadamard 适定性三条一次交齐（本科 pde-01 的悬念闭环）。

## 3. 能量估计与正则性：赎回光滑

弱解只有一阶导数——它"配得上"更多吗？

**定理（内正则性）【骨架】** $f \in L^2 \Rightarrow u \in H^2_{loc}$，且 $\|u\|_{H^2_{loc}} \leq C(\|f\|_{L^2} + \|u\|_{L^2})$。
*思路（差商法，Nirenberg）*：用平移差商 $D^h u = \frac{u(x+he) - u(x)}{h}$ 当测试函数的原料代入弱形式，能量估计给 $\|\nabla D^hu\|_{L^2}$ 关于 $h$ 一致有界 ⇒ 差商弱收敛的极限即二阶弱导数（"差商有界 ⇒ 导数存在"的 $L^2$ 版）。$\blacksquare$

**自举（bootstrap）**：$u \in H^2$ 使方程可逐项再差商 ⇒ $f \in H^k \Rightarrow u \in H^{k+2}_{loc}$；配合 Sobolev 嵌入（pde2-02：$H^k$，$k$ 大 ⇒ 连续可微）：**$f \in C^\infty \Rightarrow u \in C^\infty$**——椭圆算子把数据的光滑性"加二传递"（**椭圆正则性**：解永远比数据好两阶——热方程的无穷光滑化、复变解析函数的无穷可导都是这个家族的成员）。边界正则性需边界平坦化，结论同型【引用】。

**谱理论闭环【骨架】**：解算子 $T: f \mapsto u$ 是 $L^2 \to H_0^1 \hookrightarrow L^2$ 的复合——**Rellich 紧嵌入（pde2-02）使 $T$ 紧**且对称正 ⇒ 泛函 III 紧自伴谱定理：存在特征值 $0 < \lambda_1 \leq \lambda_2 \to \infty$ 与 $L^2$ 正交基特征函数。**本科 pde-01 分离变量法的合法性证明书**在此正式签发（那页引用的 Sturm–Liouville 理论即本段的一维情形）。

## 4. 现代 PDE 三页资产盘点

| 资产 | 一句话 | 呼应 |
|---|---|---|
| 分布/弱导数 | 求导转嫁给测试函数；δ 有户口 | ReLU、基本解 |
| Sobolev 嵌入 | 导数可积 ⇄ 函数良好，按 $p$ vs $n$ 定价 | 变分法、逼近论 |
| Poincaré/Rellich | 钉边界 ⇒ 导数控制一切；紧性可购买 | 强制性、谱离散 |
| Lax–Milgram + 正则性 | 弱空间里赢存在性，自举赎回光滑 | 分离变量的执照、FEM |

（工程出口一嘴：**有限元方法** = 在 $H_0^1$ 的有限维子空间里解同一个弱形式——Galerkin 投影；Céa 引理说误差 = 最佳逼近误差的常数倍。弱解理论不是抽象洁癖，是 FEM 工业的直接地基【引用】。）

## 5. 练习与要点

**例 1（L–M 条件检查）** $-\Delta u + cu = f$，$c(x) \geq 0$：$B[u,u] = \|\nabla u\|^2 + \int cu^2 \geq \|\nabla u\|^2$——强制性照旧（$c \geq 0$ 白送）；若 $c < -\lambda_1$（首特征值）强制性破产——**共振**：$c = -\lambda_k$ 时解不唯一/不存在（Fredholm 择一【引用】），本科 ode-02 共振现象的椭圆版。

**例 2（弱解亲手验证）** 一维 $-u'' = 1$ 于 $(0,1)$、零边界：$u = \frac{x(1-x)}{2}$；验证弱形式 $\int u'v' = \int v$ 对 $v \in C_c^\infty$（分部积分）——最小的完整弱解实例，值得写全。

**例 3（正则性的边界失效）** L 形域（内角 $\frac{3\pi}{2}$）上 $\Delta u = f$ 光滑数据：角点处 $u \sim r^{2/3}$——**不在 $H^2$**：内正则性 ✓ 而边界角点破坏全局正则性（FEM 在角点要加密网格的数学原因）。"正则性理论的边界条件"本身就是工程知识。$\blacksquare$

---

*概率与分析线九门全部完卷（测度概率/高维概率/随机分析/现代 PDE）。接下来：统计与学习线——渐近统计、统计学习理论、MDP。*
