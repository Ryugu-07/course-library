# MDP I · Bellman 算子与压缩

> **对标**：Puterman *MDP* §6.1–6.2 / Szepesvári §1–2 ｜ **前置**：泛函 I（压缩映像）、本科优化 IV（DP）、随机过程 II–III
> 强化学习的数学地基是马尔可夫决策过程。本页把本科的 Bellman 方程（优化 IV 一行递推）升级为**算子理论**：价值函数生活在 Banach 空间里，Bellman 算子是压缩映射——存在唯一性、算法收敛性全部由泛函 I 的一个定理包办。

## 1. MDP 与目标

**五元组** $(\mathcal{S}, \mathcal{A}, P, r, \gamma)$：状态、动作、转移核 $P(s'\mid s,a)$、奖励 $r(s,a)$（有界 $|r| \leq R_{\max}$）、折现因子 $\gamma \in [0,1)$。**策略** $\pi(a\mid s)$；价值函数

$$
V^\pi(s) = E^\pi\Big[\sum_{t=0}^{\infty}\gamma^t\,r(s_t, a_t)\;\Big|\;s_0 = s\Big]
$$

（级数被 $\frac{R_{\max}}{1-\gamma}$ 绝对控制——$\gamma < 1$ 是一切良定性的来源；博弈论 II 重复博弈的折现、金融的贴现在此同款。）目标：$V^*(s) = \sup_\pi V^\pi(s)$ 与达到它的策略。

## 2. Bellman 算子

在 $B(\mathcal{S})$（有界函数空间，sup 范数——泛函 I 的 Banach 空间）上定义两个算子：

$$
(T^\pi V)(s) = E_{a\sim\pi}\Big[r(s,a) + \gamma\,E_{s'}V(s')\Big], \qquad
(TV)(s) = \max_a\Big[r(s,a) + \gamma\,E_{s'\mid s,a}V(s')\Big]
$$

（$T^\pi$ = 策略评估算子；$T$ = 最优性算子——本科优化 IV 的 Bellman 递推正是"$V = TV$"。）

**定理（压缩性）** $T$ 与 $T^\pi$ 都是 $(B(\mathcal{S}), \|\cdot\|_\infty)$ 上的 $\gamma$-压缩：

$$
\|TU - TV\|_\infty \leq \gamma\,\|U - V\|_\infty
$$

**【证明】** 对每个 $s$：$|(TU)(s) - (TV)(s)| \leq \max_a\big|\gamma E_{s'}[U(s') - V(s')]\big| \leq \gamma\|U - V\|_\infty$——第一步用 $|\max_a f(a) - \max_a g(a)| \leq \max_a|f - g|$（max 的非扩张性，一行验证），第二步期望是平均、不放大 sup。$\blacksquare$

**定理（Bellman 方程的存在唯一）** $V^*$ 是 $T$ 的唯一不动点，$V^\pi$ 是 $T^\pi$ 的唯一不动点；从任意 $V_0$ 迭代 $T^nV_0 \to V^*$，误差按 $\gamma^n$ 几何衰减。
**【证明】** 压缩映像原理（泛函 I，全站被引第五次——这次是它最著名的工程应用）给唯一不动点与收敛速率；"不动点 = $V^*$"需验证 $T$ 的不动点满足最优性【骨架】：由 $V = TV$ 展开 $n$ 步得 $V = \max$ 序列的 $n$ 步收益 + $\gamma^n$ 尾项，取极限证 $V \geq V^\pi\ \forall\pi$ 且贪心策略达到它（见 §3）。$\blacksquare$

## 3. 最优策略的存在与贪心原理

**定理（贪心策略最优）** 取 $\pi^*(s) \in \arg\max_a[r + \gamma E V^*]$（对 $V^*$ 贪心），则 $V^{\pi^*} = V^*$——**存在确定性平稳最优策略**。
**【证明】** 贪心使 $T^{\pi^*}V^* = TV^* = V^*$ ⇒ $V^*$ 是 $T^{\pi^*}$ 的不动点 ⇒ 由 $T^{\pi^*}$ 不动点唯一，$V^{\pi^*} = V^*$。$\blacksquare$

**读法（三连击的结构）**：压缩给存在唯一、迭代给算法、贪心给策略——**"解 MDP"在数学上是一个不动点问题**，其全部良好性质由 $\gamma < 1$ 一个假设购买。$\gamma \to 1$ 时压缩失效（平均奖励准则需另起炉灶【引用 Puterman §8】）；$\gamma$ 的双重身份：经济学的时间偏好 + 数学的收敛保险。

**Q 函数版**（RL 实用形态）：$Q^*(s,a) = r + \gamma E\max_{a'}Q^*(s',a')$——同构理论（算子在 $B(\mathcal{S}\times\mathcal{A})$ 上压缩）；**知道 $Q^*$ 不需要模型就能行动**（$\arg\max_a Q^*$），这是 mdp-03 无模型学习的伏笔。

## 4. 练习与要点

**例 1（误差的几何衰减手感）** $\gamma = 0.99$，要 $\|V_n - V^*\| \leq 10^{-3}\cdot\frac{R_{\max}}{1-\gamma}$：$n \geq \frac{\ln 10^3}{\ln(1/0.99)} \approx 690$ 次迭代——**有效视界 $\frac{1}{1-\gamma} = 100$ 决定一切成本**：$\gamma$ 越接近 1（越远视）问题越"深"。RL 调 $\gamma$ 的第一原理。

**例 2（两行解一个 MDP）** 两状态机器维护问题（好/坏，修或不修）：写出 $T$、猜不动点形式、验证——比本科 DP 的表格更快（小 MDP 的解析解练习，把算子语言过一遍手）。

**例 3（非扩张性的边界）** 若奖励无界或 $\gamma = 1$：给出 $V$ 不存在/不唯一的例子（如无折现的循环收益）——每个假设各挡一个反例（Evans 页的"验尸报告"法在 MDP 重演）。$\blacksquare$

---

*下一页：把不动点定理变成两大算法——价值迭代与策略迭代的收敛性证明，以及它们与线性规划的第三条等价路线。*
