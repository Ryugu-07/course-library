# 现代 PDE III · 椭圆方程的弱解理论

> **对标**：Evans *PDE* §6.1–6.3 ｜ **前置**：pde2-01/02、泛函 II
> 现代 PDE 的标准作业流程在本页完整走一遍：**弱形式化 → 在强制性条件下用 Lax–Milgram 给存在唯一 → 能量估计 → 正则性升级**。这套"先在弱空间里赢、再逐步赎回光滑性"的战略，是二十世纪分析学最成功的方法论之一。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="elliptic-coercivity-learning-title">

<h2 id="elliptic-coercivity-learning-title">学习层：余量穿过零点，结论如何分叉？</h2>

### 1. 先预测：强制性、可逆性与共振不是同一件事

固定一维光滑域 $\Omega=(0,1)$、齐次 Dirichlet 条件，并把

$$
-u''+cu=f,\qquad u(0)=u(1)=0
$$

放到归一化正弦基

$$
\phi_k(x)=\sqrt2\sin(k\pi x),\qquad \lambda_k=(k\pi)^2,\qquad
a(\phi_k,\phi_k)=d_k=\lambda_k+c
$$

上。实验前先回答五个问题：

1. $c>-\pi^2$ 时，$a$ 在 $H_0^1$ 上是否强制？
2. $c\approx-\pi^2$ 但不等于 $-\pi^2$ 时，$f_1\ne0$ 会得到“唯一但敏感”、无解还是多解？
3. $c=-\pi^2$ 且 $f_1=0$ 时，第一模态的 Fredholm 相容性给出什么？
4. $c=-\pi^2$ 且 $f_1\ne0$ 时，方程 $0\cdot u_1=f_1$ 能否成立？
5. $c<-\pi^2$ 但不在任何 $-\lambda_k$ 上时，强制性失败是否自动推出算子不可逆？

这里“强制性”指（以下用 $\|u'\|_{L^2}$ 作为 $H_0^1$ 的等价范数）

$$
\alpha_{H^1}(c)=\inf_{k\ge1}\frac{d_k}{\lambda_k}
 =\min\left\{1,1+\frac{c}{\pi^2}\right\}>0,
$$

它是 Lax–Milgram 的**充分条件**，不是可逆性的必要条件。第一模态的有符号余量 $\delta(c)=d_1=\pi^2+c$ 穿过零点时，双线性型会失去强制性；但 $c$ 只要不等于某个 $-\lambda_k$，一维 Dirichlet 算子仍可由谱分解判定为可逆。落在谱点时，才需要逐个检查 Fredholm 相容性 $f_k=0$。

### 2. 精确账本：Galerkin 截断与全模态结论

写 $f=\sum_{k\ge1}f_k\phi_k$、$u=\sum_{k\ge1}u_k\phi_k$。对 $V_N=\operatorname{span}\{\phi_1,\ldots,\phi_N\}$，Galerkin 方程逐模态对角化为

$$
d_k u_k^{(N)}=f_k\quad(1\le k\le N),
\qquad u_k^{(N)}=0\quad(k>N).
$$

因此在本确定性模型中，$d_k\ne0$ 时 $u_k=f_k/d_k$；$d_k=0$ 时，$f_k\ne0$ 是无解，$f_k=0$ 是自由核方向。有限 $N$ 只是在一个子空间里算这本账，不能替代一般 PDE 的存在性证明。

若有限方程可解，实验同时报告两种残差：有限矩阵内的模态残差，以及把 $u_N$ 代回完整方程的 $L^2$ 残差

$$
\|r_N\|_{L^2}^2=\sum_{k>N}|f_k|^2.
$$

在非共振或取共振自由系数为 $0$ 的规范代表时，截断误差有精确级数

$$
\|(u-u_N)'\|_{L^2}^2
 =\sum_{k>N}\lambda_k\left|\frac{f_k}{d_k}\right|^2,
\qquad
a(u-u_N,u-u_N)=\sum_{k>N}d_k\left|\frac{f_k}{d_k}\right|^2.
$$

后一项在强制区可视为能量平方；强制性失败后它只是**有符号的双线性型尾项**，不能被误叫作范数。

<div class="learning-lab" data-learning-lab="elliptic-coercivity" markdown="1">

**JavaScript 失效时的完整静态后备：**令 $\phi_k=\sqrt2\sin(k\pi x)$，取确定性强迫系数

$$
f_1=\begin{cases}0.85,&\text{一般强迫},\\0,&\text{第一模态相容强迫},\end{cases}
\qquad f_k=\frac{0.8(-1)^{k+1}}{k^2}\quad(k\ge2).
$$

每一行都只需检查 $d_k=(k\pi)^2+c$ 与 $d_ku_k=f_k$：

| 分支 | $c$ 与强迫 | 最小余量 / 强制性 | 全模态结论 | $N$ 阶截断读法 |
|---|---|---|---|---|
| 强制 | $c=0$，$f_1=0.85$ | $\delta=\pi^2$，$\alpha_{H^1}=1$ | 唯一 | 唯一且有 Lax–Milgram 证书 |
| 接近第一共振 | $c=-\pi^2+0.18$，$f_1=0.85$ | $\delta=0.18$，$\alpha_{H^1}\approx0.0182$ | 唯一但第一系数敏感 | 可算；证书存在但很弱 |
| 第一共振相容 | $c=-\pi^2$，$f_1=0$ | $\delta=0$，$\alpha_{H^1}=0$ | 多解：$u+t\phi_1$ | 共振行取 $u_1=0$ 只是规范代表 |
| 第一共振不相容 | $c=-\pi^2$，$f_1=0.85$ | $\delta=0$，$\alpha_{H^1}=0$ | 无解：$0\cdot u_1=0.85$ | 有限矩阵也报告不相容 |
| 下方非共振 | $c=-12$，$c\ne-\lambda_k$ | $\delta=\pi^2-12<0$ | 唯一，但 $a$ 不强制 | **本有限截断可算但无 Lax–Milgram 证书** |
| 截断陷阱 | $c=-4\pi^2$，$N=1$，$f_2=-0.2$ | 第 2 模态余量为 $0$ | 全问题无解 | $N=1$ 矩阵可算，却看不到第 2 模态相容性 |

第一模态附近的三行最能区分概念：近共振时 $u_1=f_1/(\pi^2+c)$ 很大但仍唯一；恰在共振且 $f_1=0$ 时核方向使解不唯一；恰在共振且 $f_1\ne0$ 时 Fredholm 相容性失败而无解。$c<-\pi^2$ 的非共振行则提醒：Lax–Milgram 失败不自动等于不可逆。

| $k$ | $\lambda_k$ | $f_k$ | $d_k=\lambda_k+c$ | $u_k^{(N)}$ | $u_k$（非共振时） | 有限模态残差 |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | $\pi^2$ | $0.85$ 或 $0$ | $\pi^2+c$ | $f_1/d_1$（若 $d_1\ne0$） | $f_1/d_1$ | $0$ |
| 2 | $4\pi^2$ | $-0.2$ | $4\pi^2+c$ | 同上（若 $2\le N$） | $f_2/d_2$ | $0$ |
| $k>N$ | $(k\pi)^2$ | $0.8(-1)^{k+1}/k^2$ | $(k\pi)^2+c$ | $0$ | $f_k/d_k$ | $-f_k$ |

共振相容时把自由系数选为 $u_j=0$，再用上式计算规范代表的尾误差；共振不相容时，全解系数与能量误差写作“未定义”，而不是把失败的有限求解器输出当成解。

</div>

### 3. 这个模型不能替代哪些一般定理？

- **强制性与可逆性。** Lax–Milgram 说“有界 + 强制 $\Rightarrow$ 对每个有界泛函存在唯一弱解并稳定依赖”；它是充分条件。强制性失败后，需用谱理论、Fredholm 理论或别的估计判断；失败本身不推出无解，也不推出非唯一。
- **Fredholm 相容性。** 在共振点 $c=-\lambda_j$，对称 Dirichlet 算子的核由相应特征函数张成；可解的必要条件是 $f$ 对核正交，即 $f_j=0$。相容时解集沿核平移，多解；不相容时无解。这比“把分母设为零”更完整，因为它保留了右端条件。
- **内正则性与边界正则性。** 内正则性只在 $\Omega'\Subset\Omega$ 上工作，不会自动穿过边界：在一致椭圆、系数足够光滑（例如 $A\in C^{0,1}$）且 $f\in L^2$ 的典型假设下，得到 $u\in H^2_{loc}(\Omega)$。若要全局 $H^2(\Omega)$，常见充分条件还包括 $\partial\Omega$ 为 $C^{1,1}$、系数有 Lipschitz 正则性以及相容的边界数据；仅 Lipschitz 域或角点可能产生奇性。L 形域的内角 $3\pi/2$ 给出 $u\sim r^{2/3}$ 的边界障碍，正是内正则性成立而全局 $H^2$ 失败的例子。
- **光滑度必须逐项说清。** 域的边界、主部系数 $A$、低阶系数 $c$、右端 $f$ 和边界数据分别进入不同的正则性定理。$C^\infty$ 数据只有在算子系数与边界同样满足相应光滑要求时，才可逐级 bootstrap 到 $C^\infty$；本实验的平滑区间和常系数只保证这个一维模态模型的精确代数。

这组正弦计算是 Galerkin/谱账本与相容性诊断，不是对一般域上的 Lax–Milgram、Fredholm 或正则性定理的有限模态“证明”。

</section>

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

**定理（内正则性）【骨架】** 在主部系数一致椭圆且具有足够局部正则性（例如 $A\in C^{0,1}$）时，$f \in L^2 \Rightarrow u \in H^2_{loc}$，且 $\|u\|_{H^2_{loc}} \leq C(\|f\|_{L^2} + \|u\|_{L^2})$；没有系数假设不能把这句话裸用。
*思路（差商法，Nirenberg）*：用平移差商 $D^h u = \frac{u(x+he) - u(x)}{h}$ 当测试函数的原料代入弱形式，能量估计给 $\|\nabla D^hu\|_{L^2}$ 关于 $h$ 一致有界 ⇒ 差商弱收敛的极限即二阶弱导数（"差商有界 ⇒ 导数存在"的 $L^2$ 版）。$\blacksquare$

**自举（bootstrap）**：在系数、域边界和边界数据也有相应光滑度时，$u \in H^2$ 使方程可逐项再差商 ⇒ $f \in H^k \Rightarrow u \in H^{k+2}_{loc}$；配合 Sobolev 嵌入（pde2-02：$H^k$，$k$ 大 ⇒ 连续可微）：**$f \in C^\infty$ 只在这些附加假设同时成立时才推出 $u \in C^\infty$**——椭圆算子把数据的光滑性"加二传递"。边界正则性还需平坦化与全局边界估计，粗糙域/角点不能直接套用内正则性。

**谱理论闭环【骨架】**：对对称、强制的 Dirichlet 形式（例如 $c\ge0$），解算子 $T: f \mapsto u$ 是 $L^2 \to H_0^1 \hookrightarrow L^2$ 的复合——**Rellich 紧嵌入（pde2-02）使 $T$ 紧**且对称正 ⇒ 泛函 III 紧自伴谱定理：存在特征值 $0 < \lambda_1 \leq \lambda_2 \to \infty$ 与 $L^2$ 正交基特征函数。$c$ 变号或强制性失败时，必须改用相应的自伴算子/Fredholm框架，不能无条件沿用“正解算子”措辞。**本科 pde-01 分离变量法的合法性证明书**在此正式签发（那页引用的 Sturm–Liouville 理论即本段的一维情形）。

## 4. 现代 PDE 三页资产盘点

| 资产 | 一句话 | 呼应 |
|---|---|---|
| 分布/弱导数 | 求导转嫁给测试函数；δ 有户口 | ReLU、基本解 |
| Sobolev 嵌入 | 导数可积 ⇄ 函数良好，按 $p$ vs $n$ 定价 | 变分法、逼近论 |
| Poincaré/Rellich | 钉边界 ⇒ 导数控制一切；紧性可购买 | 强制性、谱离散 |
| Lax–Milgram + 正则性 | 弱空间里赢存在性，自举赎回光滑 | 分离变量的执照、FEM |

（工程出口一嘴：**有限元方法** = 在 $H_0^1$ 的有限维子空间里解同一个弱形式——Galerkin 投影；Céa 引理说误差 = 最佳逼近误差的常数倍。弱解理论不是抽象洁癖，是 FEM 工业的直接地基【引用】。）

## 5. 练习与要点

**例 1（L–M 条件检查）** $-\Delta u + cu = f$，$c(x) \geq 0$：$B[u,u] = \|\nabla u\|^2 + \int cu^2 \geq \|\nabla u\|^2$——强制性照旧（$c \geq 0$ 白送）。若常数 $c< -\lambda_1$，强制性破产，但这本身不等于共振或不可逆；在 $c\ne-\lambda_k$ 的谱点之外，算子仍可能唯一可逆。恰在 $c=-\lambda_k$ 时，核出现，解是否存在由 $f$ 对该核的正交条件决定：相容则多解，不相容则无解（Fredholm 择一【引用】），这是本科 ode-02 共振现象的椭圆版。

**例 2（弱解亲手验证）** 一维 $-u'' = 1$ 于 $(0,1)$、零边界：$u = \frac{x(1-x)}{2}$；验证弱形式 $\int u'v' = \int v$ 对 $v \in C_c^\infty$（分部积分）——最小的完整弱解实例，值得写全。

**例 3（正则性的边界失效）** L 形域（内角 $\frac{3\pi}{2}$）上 $\Delta u = f$ 光滑数据：角点处 $u \sim r^{2/3}$——**不在 $H^2$**：内正则性 ✓ 而边界角点破坏全局正则性（FEM 在角点要加密网格的数学原因）。"正则性理论的边界条件"本身就是工程知识。$\blacksquare$

---

*概率与分析线九门全部完卷（测度概率/高维概率/随机分析/现代 PDE）。接下来：统计与学习线——渐近统计、统计学习理论、MDP。*
