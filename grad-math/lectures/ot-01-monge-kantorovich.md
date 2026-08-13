# 最优传输 I · Monge–Kantorovich 问题与对偶

> **对标**：Peyré & Cuturi *COT* §2 / Santambrogio §1 ｜ **前置**：优化 III/IV（LP 对偶）、实变 I、cvx-01
> 最优传输问一个 1781 年的问题：**把一堆土以最小代价搬成另一个形状，怎么搬？**（Monge）。二百年后它成为比较概率分布的第一等语言——KL 看"密度比"，OT 看"搬运距离"：支撑不重叠时 KL 爆炸而 OT 仍给出有意义的几何量。本页立好问题与对偶理论。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ot-duality-learning-title">

<h2 id="ot-duality-learning-title">学习层：最小运输计划如何与最大对偶证书对账</h2>

### 1. 先看具体问题：一处供给能否服务两处需求？

有一个位置 \(x_0=0\) 的供给点，质量 \(a_0=1\)；有两个需求点
\(y_0=-1,y_1=1\)，各需 \(b_j=\frac12\)。运输成本取
\(c_{0j}=|x_0-y_j|=1\)。先不要套定理，预测三件事：

- 若坚持 Monge 映射 \(T\)，\(x_0\) 只能去一个 \(y_j\)。它能同时满足两列需求吗？
- 若允许 Kantorovich 耦合 \(\pi\)，你预计哪两个单元格会承载质量？原始成本会是多少？
- 对偶势 \((\varphi_0,\psi_0,\psi_1)=(1,0,0)\) 是否可行？把它改成
  \((1+t,-t,-t)\) 后，哪一本账会改变？

把预测写下来，再打开下面的“拆分质量：一到两”预设。实验不抽样、不动画化：每次都是同一个有限 LP 的确定性解。

### 2. 四个边界先分清：映射、耦合、可行性、最优性

**Monge 与 Kantorovich 不是同一个变量。** Monge 只允许映射 \(T\)，质量
不能在一个 \(x_i\) 发往多个 \(y_j\)。Kantorovich 把变量放宽为矩阵
\(\pi=(\pi_{ij})\)，其中 \(\pi_{ij}\geq0\) 是从 \(x_i\) 到 \(y_j\) 的质量，边缘约束为

$$
\sum_j\pi_{ij}=a_i,\qquad \sum_i\pi_{ij}=b_j.
$$

所以“拆分”不是数值误差，而是松弛后的合法自由度；当一行出现两个正单元格时，正是在显示一个 Monge 映射无法表达的计划。

**Primal 与 dual 看同一个问题的两面。** 离散原始问题是

$$
\tag{P}
\min_{\pi\geq0}\ \sum_{i,j}c_{ij}\pi_{ij}
\quad\text{s.t.}\quad \pi\mathbf 1=a,\quad \pi^\top\mathbf 1=b.
$$

它直接选择搬多少；对偶问题是

$$
\tag{D}
\max_{\varphi,\psi}\ \sum_i a_i\varphi_i+\sum_j b_j\psi_j
\quad\text{s.t.}\quad \varphi_i+\psi_j\leq c_{ij}.
$$

它不搬货，而是给供给端和需求端报价；任何满足所有不等式的报价都是**对偶可行**的下界证书：对偶收入不会超过任何原始可行计划的运输成本。原始计划满足边缘约束则叫**原始可行**。可行不自动等于最优：还要在各自可行集合中达到最小成本或最大收入。

**强对偶与互补松弛是两种对账方式。** 对任意一对可行 \(\pi,(\varphi,\psi)\)，定义

$$
s_{ij}=c_{ij}-\varphi_i-\psi_j\geq0.
$$

直接展开可得

$$
\sum_{i,j}c_{ij}\pi_{ij}-\left(\sum_i a_i\varphi_i+\sum_j b_j\psi_j\right)
=\sum_{i,j}\pi_{ij}s_{ij}\geq0.
$$

左边是 **primal–dual gap**；右边是所有运输边的“质量 × reduced slack”总和。因此在有限运输 LP 中，强对偶说最优时 gap 可以为零；互补松弛进一步逐边解释它：

$$
\pi_{ij}>0\Longrightarrow s_{ij}=0,
\qquad s_{ij}>0\Longrightarrow \pi_{ij}=0.
$$

注意两种“唯一”都不能乱说。最优耦合可能不唯一（平局成本时尤其明显），对偶势也至少有平移规范

$$
(\varphi,\psi)\mapsto(\varphi+t\mathbf1,\psi-t\mathbf1),
$$

因为总供给等于总需求，所以约束、每个 \(s_{ij}\) 和对偶目标都不变。实验中的滑块只是选择这族证书的一个代表，不把某个势当作唯一答案。

### 3. 确定性实验：让两本账逐格相遇

操作顺序建议固定为：先看蓝色运输边和供需边缘，再看原始成本与对偶收入，最后检查每个 reduced slack 以及
\(\pi_{ij}s_{ij}\)。四个预设分别承担不同教学任务：

1. **拆分质量：一到两**：\(a=(1)\)、\(b=(1/2,1/2)\)，显式显示 Monge 无法完成而耦合
   \(\pi=(1/2,1/2)\) 合法。
2. **一维单调：分位数**：成本 \(|x-y|\)，正运输边按位置不交叉；同时观察第一行如何拆成两段，说明“单调”不等于“不可拆”。
3. **凸成本：平方距离**：把成本换成 \((x-y)^2\)，检查交换论证的单调结构保留，但价格和原始成本尺度改变。
4. **平局：多组最优计划**：所有 \(c_{ij}=1\)，固定算法会给出一组可复核的计划；另一组同成本计划也最优，专门用来抵抗“最优必唯一”的误读。

拖动“平移规范 \(t\)”并重读同一逐边表：\(\varphi_i+t,\psi_j-t\) 会变，
\(\varphi_i+\psi_j\)、\(s_{ij}\)、对偶目标和 gap 不变。脚本中的纯模型可在无 DOM 的 Node 环境导出；浏览器部分只负责把这些确定性数值呈现为网络、矩阵和 ledger。

<div class="learning-lab" data-learning-lab="transport-duality" markdown="1">

**JavaScript 失效时的静态 fallback（可手算）：** 先固定“拆分质量：一到两”。
\(a=(1)\)、\(b=(1/2,1/2)\)、\(C=(1,1)\)，所以

$$
\pi=(1/2,1/2),\quad C(\pi)=1;
\qquad \varphi=(1),\quad \psi=(0,0),\quad D(\varphi,\psi)=1.
$$

逐边 \(s=c-\varphi-\psi=(0,0)\)，故两条正质量边都紧，
\(\sum_i\pi_{i\bullet}=1\)、\(\sum_i\pi_{\bullet j}=1/2\)，gap \(=1-1=0\)。这就是“拆分质量”而非 Monge 映射。

再手算“一维单调：分位数”：
\(a=(3/4,1/4)\)、\(b=(1/4,3/4)\)，位置 \(x=(0,1)\)、\(y=(1/4,5/4)\)，成本矩阵

$$
c=\begin{pmatrix}1/4&5/4\\3/4&1/4\end{pmatrix},\qquad
\pi=\begin{pmatrix}1/4&1/2\\0&1/4\end{pmatrix}.
$$

行和列和分别是 \(a,b\)，正边按 \(x\) 与 \(y\) 的顺序不交叉；
\(C(\pi)=3/4\)。可取 \(\varphi=(5/4,1/4)\)、\(\psi=(-1,0)\)，于是

$$
s=\begin{pmatrix}0&0\\3/2&0\end{pmatrix},\qquad D=3/4,
\qquad C-D=\sum_{i,j}\pi_{ij}s_{ij}=0.
$$

最后把所有成本设成 \(1\)：任意合法耦合的成本都是 \(1\)，所以对角计划和反对角计划都是最优；例如
\(\pi=\left(\begin{smallmatrix}1/2&0\\0&1/2\end{smallmatrix}\right)\)、\(\varphi=(1,1)\)、\(\psi=(0,0)\)，四个 \(s_{ij}\) 全为 \(0\)。

</div>

### 4. 迁移问题：把“对账”带出运输表

- 一维凸成本为什么排斥交叉边？对 \(x_1<x_2\)、\(y_1<y_2\)，比较
  \(c(x_1,y_1)+c(x_2,y_2)\) 与 \(c(x_1,y_2)+c(x_2,y_1)\)，并说明等号时为何可能出现多组最优计划。
- 若一个未使用的边满足 \(s_{ij}=0\)，它是否必须被加入计划？如果不必，如何用它解释退化、非唯一性或换基？
- 把 \(c=|x-y|\) 换成一般成本矩阵后，哪些内容仍是有限 LP 的强对偶与互补松弛，哪些内容依赖“一维 + 凸成本”的单调结构？
- 回到连续公式：\(\varphi(x)+\psi(y)\leq c(x,y)\) 如何变成离散表的逐格不等式？在 \(W_1\) 的 Lipschitz 特例中，对偶势为什么又像一个“最会区分分布的检验函数”？

</section>

## 1. Monge 与 Kantorovich：从映射到耦合

**Monge 形式（1781）**：找映射 $T$ 把 $\mu$ 推前成 $\nu$（$T_\#\mu = \nu$），最小化 $\int c(x, T(x))\,d\mu$。**先天缺陷**：质量不可分割——一个点的质量必须整体搬走（$\mu = \delta_0$ 搬成两半的 $\nu$：无解）；可行集非凸、可能为空。

**Kantorovich 松弛（1942）**：允许**拆分**——找联合分布（**耦合/传输计划**）$\pi \in \Pi(\mu, \nu)$（边缘分别为 $\mu, \nu$——概率 III 的"边缘不定联合"在此成为优化变量）：

$$
W_c(\mu, \nu) = \min_{\pi \in \Pi(\mu,\nu)}\ \int c(x, y)\,d\pi(x, y)
$$

**为什么松弛对**：$\Pi$ 非空（乘积测度恒在）且凸；在 Polish 空间上，固定边缘的耦合集由紧性与闭性得到弱紧（Prokhorov——as-01 的紧性工具执勤）。若成本 $c$ 下半连续且有统一可积下界，Portmanteau 型论证给出目标的弱下半连续性，于是最小值能够取得；不能只凭“目标线性”跳过这些条件。离散情形则直接是有限维 **LP**（运输问题——优化 IV 的教科书例题原来是 OT 的有限版）。Monge 解 = 恰好不拆分的 $\pi$（集中在映射图上）——何时存在见下一页 Brenier。

## 2. Kantorovich 对偶

**定理（对偶）**

$$
W_c(\mu,\nu) = \sup_{\varphi(x) + \psi(y) \leq c(x,y)}\ \int\varphi\,d\mu + \int\psi\,d\nu
$$

**【证明思路（LP 对偶的无限维版）】** 拉格朗日化边缘约束：乘子 $\varphi, \psi$ 对偶边缘条件，$\inf_\pi\sup_{\varphi,\psi}$ 交换（Fenchel–Rockafellar，cvx-01——或有限情形直接 LP 强对偶，优化 IV）；内层 $\inf_{\pi\geq0}\int(c - \varphi - \psi)d\pi$ 有限当且仅当 $\varphi \oplus \psi \leq c$。$\blacksquare$

**经济学读法（Kantorovich 的诺奖直觉）**：外包商对"从 $x$ 装货"收 $\varphi(x)$、"到 $y$ 卸货"收 $\psi(y)$，报价不超自运成本（约束）；对偶说**最优外包收入 = 自运最小成本**——影子价格的搬运版。**c-变换**：固定 $\varphi$ 后，可把 $\psi$ 提升到 $\varphi^c(y) = \inf_x[c(x,y) - \varphi(x)]$——这是随成本 $c$ 定制的广义共轭。它与 Legendre–Fenchel 共轭密切相关但不能无视符号：例如 $c(x,y)=\langle x,y\rangle$ 时 $\varphi^c(y)=-\varphi^*(-y)$；平方距离成本则在剥离二次项、重写势函数后化为通常的凸共轭（cvx-01）。

**特例（Kantorovich–Rubinstein，$c = d$ 距离）**：

$$
W_1(\mu, \nu) = \sup_{\mathrm{Lip}(f)\leq1}\ \int f\,d\mu - \int f\,d\nu
$$

**【骨架】** $c$-变换对距离成本给 $\varphi^c = -\varphi$ 且 $\varphi$ 1-Lipschitz（三角不等式）。$\blacksquare$——**$W_1$ = "最会区分两个分布的 Lipschitz 检验函数"**：WGAN 判别器的权重裁剪/梯度惩罚就是在逼近这个 sup 的约束（ot-03 兑现）。

## 3. 一维的完全解（唯一能手算的情形，务必掌握）

**定理** $\mathbb{R}$ 上、凸成本 $c(x-y)$：最优方案 = **单调重排**（分位数对分位数）：

$$
W_p^p(\mu,\nu) = \int_0^1\big|F_\mu^{-1}(t) - F_\nu^{-1}(t)\big|^p\,dt
$$

**【骨架】** 交换论证：若计划中存在"交叉"配对（$x_1 < x_2$ 配 $y_1 > y_2$），解开交叉不增成本（凸成本的四点不等式）⇒ 最优必单调；单调耦合 = 分位数变换（概率 II 概率积分变换的双人版）。$\blacksquare$
**读法**：一维 OT = 排序（离散情形字面排序，$O(n\log n)$）——分位数匹配、直方图均衡、经验分布比较的理论身份；高维没有"排序"——这正是下一页 Brenier 定理要回答的。

## 4. 练习与要点

**例 1（Monge 无解、Kantorovich 有解）** $\mu = \delta_0$，$\nu = \frac12\delta_{-1} + \frac12\delta_1$：映射无解（一点不能去两处）；耦合 $\pi = \frac12\delta_{(0,-1)} + \frac12\delta_{(0,1)}$ 合法，$W_1 = 1$——松弛的必要性三行看懂。

**例 2（对偶亲手验证）** 按上面 $\int f\,d\mu-\int f\,d\nu$ 的符号约定，在例 1 中取 $f(x)=-|x|$（1-Lip）：$\int f\,d\mu-\int f\,d\nu=0-(-1)=1=W_1$ ✓。若换用相反的积分次序，就同时把 $f$ 换成 $|x|$；两种写法不能只改一边符号。

**例 3（一维手算）** $\mu = U(0,1)$，$\nu = U(2,3)$：分位数差恒为 2 ⇒ $W_p = 2$（任意 $p$）；对比 KL$= \infty$（支撑不交）——**"OT 在 KL 失明处仍有视力"**：生成模型早期用 JS/KL 训练崩溃、换 $W_1$ 起死回生的数学原因（ot-03 的 WGAN 故事在此埋线）。$\blacksquare$

---

*下一页：$W_2$ 的几何——Brenier 定理（最优映射 = 凸函数的梯度）、Wasserstein 空间的测地线与重心。*
