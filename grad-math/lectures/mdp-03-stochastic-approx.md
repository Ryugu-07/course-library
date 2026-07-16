# MDP III · 随机逼近与 Q-learning

> **对标**：Szepesvári §3 / Borkar（随机逼近）｜ **前置**：mdp-01/02、mt-03/04（鞅）、优化 II
> 模型未知时，Bellman 迭代的期望算不了——只能用**采样代替期望**。这正是 **Robbins–Monro 随机逼近**（1951）的问题形态：用带噪观测解方程。本页给随机逼近的框架与鞅证明思路，然后把 TD 与 Q-learning 安放进去——"RL 算法为何收敛"的正式答案，统计与学习线收官。

## 1. Robbins–Monro：带噪解方程

**问题**：解 $h(\theta) = 0$，但只能观测 $h(\theta_t) + \xi_t$（噪声）。**RM 迭代**：

$$
\theta_{t+1} = \theta_t + \alpha_t\big[h(\theta_t) + \xi_t\big]
$$

**定理（RM 收敛）** 若 ① 步长满足

$$
\sum_t \alpha_t = \infty, \qquad \sum_t \alpha_t^2 < \infty
$$

② 噪声是鞅差（$E[\xi_t\mid\mathcal{F}_t] = 0$、二阶矩有界）；③ $h$ 有全局渐近稳定平衡点 $\theta^*$（如 $h = -\nabla f$，$f$ 强凸），则 $\theta_t \to \theta^*$ a.s.

**【骨架（鞅方法的结构）】** 分解更新 = 确定性漂移 + 鞅增量：累积噪声 $M_T = \sum\alpha_t\xi_t$ 是鞅且 $\sum E[(\alpha_t\xi_t)^2] \leq C\sum\alpha_t^2 < \infty$ ⇒ **鞅收敛定理**（mt-04：$L^2$ 有界鞅 a.s. 收敛）说噪声的累积效应有限；剩余的确定性部分靠 $\sum\alpha_t = \infty$ 走完到 $\theta^*$ 的路程（Lyapunov 函数 $\|\theta_t - \theta^*\|^2$ 的超鞅论证：Robbins–Siegmund 引理【引用】收尾）。$\blacksquare$

**步长条件的读法（RL 每个从业者该会背的一对级数）**：$\sum\alpha = \infty$——"总步长要够走到任何地方"（走得完）；$\sum\alpha^2 < \infty$——"噪声的累积方差有限"（噪声被平均掉）。$\alpha_t = 1/t$ 恰好双满足；常数步长则收敛到 $\theta^*$ 的邻域内震荡（工程常态：换稳态精度买适应性）。**SGD 正是 $h = -\nabla f$ 的 RM**——优化 II 的收敛速率表与本页 a.s. 收敛是同一算法的两面（速率 vs 必达）。（ODE 方法一嘴【引用 Borkar】：$\theta_t$ 的插值轨迹逼近 ODE $\dot\theta = h(\theta)$——"随机算法的极限行为 = 常微分方程"，本科 ode-03 的相图分析由此接管 RL 算法的定性分析。）

## 2. TD 学习：采样版策略评估

评估 $V^\pi$ 的 Bellman 方程 $V = T^\pi V$，模型未知时用转移采样 $(s_t, r_t, s_{t+1})$：

$$
V(s_t) \leftarrow V(s_t) + \alpha_t\big[\underbrace{r_t + \gamma V(s_{t+1}) - V(s_t)}_{\text{TD 误差 } \delta_t}\big]
$$

**框架安放**：这是 RM，其中 $h(V) = T^\pi V - V$（期望更新方向 = Bellman 残差——采样的 $r + \gamma V(s')$ 是 $(T^\pi V)(s)$ 的无偏估计），噪声 = 采样偏差（鞅差 ✓）。表格情形按 RM + 压缩性收敛【引用 Tsitsiklis–Van Roy】；**线性函数逼近**下收敛到投影不动点 $\Pi T^\pi$ 的解（on-policy 采样时 $\Pi T^\pi$ 在 $\mu$-加权范数下仍压缩——mdp-02 §4 预警的正面结果），off-policy 时可发散（致命三合一）。

## 3. Q-learning：采样版价值迭代

$$
Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha_t\big[r_t + \gamma\max_{a'}Q(s_{t+1}, a') - Q(s_t, a_t)\big]
$$

**定理（Watkins–Dayan）** 表格情形，若每个 $(s,a)$ 被访问无穷次且步长满足 RM 条件（逐状态动作），则 $Q_t \to Q^*$ a.s.
**【骨架】** $h(Q) = TQ - Q$（$T$ = 最优性算子）：期望方向正确（$\max$ 的采样版无偏于……注意 $\max$ 在**下一状态**的 $Q$ 上、采样在转移上——仍无偏）；$T$ 的 $\gamma$-压缩性（mdp-01）+ RM 框架的异步版本（各分量以不同频率更新——"异步随机逼近"【引用 Tsitsiklis】）收口。$\blacksquare$

**三个实践对应**：**探索条件**（"每个 (s,a) 无穷次"）= ε-greedy 存在的数学理由——不探索则收敛定理前提破产；**off-policy 合法性**：$Q$-learning 的目标算子不依赖行为策略（max 内生）——可以边看别人的数据边学最优，但也正因此与函数逼近相性差（三合一的成员）；**maximization bias**：$E\max \geq \max E$（Jensen）使 $\max_{a'}Q$ 系统性高估——Double Q-learning 的动机（把"选择"与"评估"分开解耦偏差【引用】）。

## 4. 统计与学习线收官盘点

| 课程 | 中心问题 | 发动机 |
|---|---|---|
| 渐近统计 | 估计与检验的极限行为 | CLT + Delta + Taylor |
| 统计学习理论 | 有限样本下为何能泛化 | 集中 + 复杂度（VC/Rad）+ 稳定性 |
| MDP 与 RL | 决策的最优性与算法收敛 | 压缩不动点 + 单调性 + 鞅/RM |

三门课共用的底座正是概率与分析线（CLT/鞅/压缩映像/集中不等式）——研究生数学"先立地基再盖楼"的结构在此完整呈现。

## 5. 练习与要点

**例 1（步长实验设计）** 表格 Q-learning 跑 GridWorld：对比 $\alpha_t = 1/t$（满足 RM，慢但必达）、$\alpha = 0.1$ 常数（快但震荡）、$\alpha_t = 1/\sqrt t$（违反 $\sum\alpha^2 < \infty$？——不违反：$\sum 1/t$ 发散但 $\sum 1/t^{}$…注意 $\sum t^{-1}$ 发散、$\sum t^{-1/2\cdot2} = \sum t^{-1}$ 发散——**$1/\sqrt t$ 不满足平方可和**，理论上噪声不灭：实验观察其残余震荡）——把一对级数条件变成三条学习曲线。

**例 2（maximization bias 亲手造）** 两动作、真值全零、奖励噪声 $N(0,1)$：$E[\max_a \hat Q] \approx 0.56$（两个标准正态的最大值期望 $= 1/\sqrt\pi$）——偏差凭空出现；Double 版消偏验证。

**例 3（无穷访问的反例）** 纯贪心（无探索）Q-learning：构造两臂问题使其以正概率永远锁死劣臂——收敛定理"每个 (s,a) 无穷次"条件的验尸；探索不是工程装饰而是定理前提。$\blacksquare$

---

*统计与学习线十页完卷。剩余：优化与计算线（凸优化/数值线代/矩阵分析）、信息与传输线（信息论进阶/最优传输）、几何与代数线（流形/代数拓扑/代数进阶）。*
