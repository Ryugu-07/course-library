# 最优传输 I · Monge–Kantorovich 问题与对偶

> **对标**：Peyré & Cuturi *COT* §2 / Santambrogio §1 ｜ **前置**：优化 III/IV（LP 对偶）、实变 I、cvx-01
> 最优传输问一个 1781 年的问题：**把一堆土以最小代价搬成另一个形状，怎么搬？**（Monge）。二百年后它成为比较概率分布的第一等语言——KL 看"密度比"，OT 看"搬运距离"：支撑不重叠时 KL 爆炸而 OT 仍给出有意义的几何量。本页立好问题与对偶理论。

## 1. Monge 与 Kantorovich：从映射到耦合

**Monge 形式（1781）**：找映射 $T$ 把 $\mu$ 推前成 $\nu$（$T_\#\mu = \nu$），最小化 $\int c(x, T(x))\,d\mu$。**先天缺陷**：质量不可分割——一个点的质量必须整体搬走（$\mu = \delta_0$ 搬成两半的 $\nu$：无解）；可行集非凸、可能为空。

**Kantorovich 松弛（1942）**：允许**拆分**——找联合分布（**耦合/传输计划**）$\pi \in \Pi(\mu, \nu)$（边缘分别为 $\mu, \nu$——概率 III 的"边缘不定联合"在此成为优化变量）：

$$
W_c(\mu, \nu) = \min_{\pi \in \Pi(\mu,\nu)}\ \int c(x, y)\,d\pi(x, y)
$$

**为什么松弛对**：$\Pi$ 非空（乘积测度恒在）且凸紧（弱拓扑，Prokhorov——as-01 的紧性工具执勤）、目标线性 ⇒ **存在性免费**（线性目标 + 紧凸集）；离散情形它就是一个 **LP**（运输问题——优化 IV 的教科书例题原来是 OT 的有限版）。Monge 解 = 恰好不拆分的 $\pi$（集中在映射图上）——何时存在见下一页 Brenier。

## 2. Kantorovich 对偶

**定理（对偶）**

$$
W_c(\mu,\nu) = \sup_{\varphi(x) + \psi(y) \leq c(x,y)}\ \int\varphi\,d\mu + \int\psi\,d\nu
$$

**【证明思路（LP 对偶的无限维版）】** 拉格朗日化边缘约束：乘子 $\varphi, \psi$ 对偶边缘条件，$\inf_\pi\sup_{\varphi,\psi}$ 交换（Fenchel–Rockafellar，cvx-01——或有限情形直接 LP 强对偶，优化 IV）；内层 $\inf_{\pi\geq0}\int(c - \varphi - \psi)d\pi$ 有限当且仅当 $\varphi \oplus \psi \leq c$。$\blacksquare$

**经济学读法（Kantorovich 的诺奖直觉）**：外包商对"从 $x$ 装货"收 $\varphi(x)$、"到 $y$ 卸货"收 $\psi(y)$，报价不超自运成本（约束）；对偶说**最优外包收入 = 自运最小成本**——影子价格的搬运版。**c-变换**：最优的 $\psi$ 必为 $\varphi^c(y) = \inf_x[c(x,y) - \varphi(x)]$——**广义共轭**（$c = \langle x,y\rangle$ 时恰是 Legendre 共轭：cvx-01 的变换是 OT 对偶的特例——第四次收租）。

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

**例 2（对偶亲手验证）** 例 1 中取 $f(x) = |x|$（1-Lip）：$\int f d\nu - \int f d\mu = 1 = W_1$ ✓——K–R 对偶在最小例子上取等（最优检验函数就是"到支撑的距离"型）。

**例 3（一维手算）** $\mu = U(0,1)$，$\nu = U(2,3)$：分位数差恒为 2 ⇒ $W_p = 2$（任意 $p$）；对比 KL$= \infty$（支撑不交）——**"OT 在 KL 失明处仍有视力"**：生成模型早期用 JS/KL 训练崩溃、换 $W_1$ 起死回生的数学原因（ot-03 的 WGAN 故事在此埋线）。$\blacksquare$

---

*下一页：$W_2$ 的几何——Brenier 定理（最优映射 = 凸函数的梯度）、Wasserstein 空间的测地线与重心。*
