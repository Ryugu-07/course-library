# 统计学习 IV · 稳定性、正则化与在线学习

> **对标**：SSBD *UML* §13–14、§21 ｜ **前置**：slt-01–03、优化线（本科）
> 收官页两大主题：**算法稳定性**——泛化的第二条路线（不看假设类看算法：换一个样本输出变多少），它给正则化以定理级辩护；**在线学习**——把"分布假设"整个扔掉的第三种学习范式（regret 框架），感知机定理（ai 课 02）在此获得正式家族。

## 1. 算法稳定性：泛化的第二条路线

**定义（一致稳定性）** 算法 $A$ 是 $\beta$-稳定：把训练集换掉一个样本，任意点的损失变化 $\leq \beta$：$\sup_z|\ell(A(S), z) - \ell(A(S^{(i)}), z)| \leq \beta$。

**定理（稳定 ⇒ 泛化）** $\beta$-稳定算法满足 $\big|E_S[L_{\mathcal{D}}(A(S)) - L_S(A(S))]\big| \leq \beta$。
**【证明】** 双重期望换样本技巧：

$$
E_S L_S(A(S)) = E_{S,z_i'}\big[\ell(A(S^{(i)}), z_i')\big] \quad(\text{换名: 训练点与新点身份互换})
$$

而 $E_S L_{\mathcal{D}}(A(S)) = E_{S, z'}\ell(A(S), z')$——两式的差恰是"换一个样本对同一点的损失差"，按定义 $\leq \beta$。$\blacksquare$（高概率版由 McDiarmid 补齐【骨架】。）

**定理（正则化 ⇒ 稳定）** $\ell$ 凸且 $L$-Lipschitz，则 Tikhonov 正则化 ERM $\hat h = \arg\min L_S(h) + \lambda\|h\|^2$ 是 $\beta$-稳定，$\beta = \frac{2L^2}{\lambda m}$。
**【骨架】** 目标是 $2\lambda$-强凸 ⇒ 最优点对目标扰动敏感度 $\|h - h'\| \leq \frac{\text{扰动幅度}}{\lambda}$（强凸的二次下界，优化 II）；换一个样本扰动经验风险至多 $\frac{2L}{m}$ 级 ⇒ 输出移动 $\leq \frac{2L}{\lambda m}$，Lipschitz 换回损失。$\blacksquare$

**合成读法**：泛化差 $\lesssim \frac{L^2}{\lambda m}$——**正则化强度直接购买泛化**（λ 的双重身份：优化上保强凸、统计上保稳定——本科"正则化 = 偏差方差滑块 = 先验"之外的第三种严格解释）。稳定性路线**不经过假设类复杂度**——对"复杂度爆炸但算法温和"的场景（如 SGD 训练的深网【引用 Hardt et al.】）是比一致收敛更有希望的解释框架（部分成立、整体开放——与 slt-03 例 2 呼应的诚实边界）。

## 2. 在线学习：没有分布也能学

**协议**：逐轮 $t = 1..T$——预测 $\hat y_t$、看真值、受损失；**对手可以恶意**。目标不再是风险而是 **regret**：

$$
\mathrm{Reg}_T = \sum_t \ell(h_t, z_t) - \min_{h\in\mathcal{H}}\sum_t \ell(h, z_t)
$$

（"比事后最优的固定策略差多少"——$o(T)$ 的 regret = "平均意义上追平事后诸葛"。）

**定理（在线梯度下降 OGD）** 凸损失、次梯度范数 $\leq G$、决策域直径 $\leq D$，步长 $\eta = \frac{D}{G\sqrt T}$：

$$
\mathrm{Reg}_T \;\leq\; GD\sqrt{T}
$$

**【证明】** 势函数法。记 $\Phi_t = \|w_t - w^*\|^2$（$w^*$ = 事后最优）：

$$
\Phi_{t+1} = \|w_t - \eta g_t - w^*\|^2 = \Phi_t - 2\eta\langle g_t, w_t - w^*\rangle + \eta^2\|g_t\|^2
$$

凸性 $\ell_t(w_t) - \ell_t(w^*) \leq \langle g_t, w_t - w^*\rangle$，代入移项对 $t$ 求和（$\Phi$ 望远镜相消）：

$$
\mathrm{Reg}_T \leq \frac{\Phi_1}{2\eta} + \frac{\eta}{2}\sum\|g_t\|^2 \leq \frac{D^2}{2\eta} + \frac{\eta G^2T}{2}
$$

代入 $\eta$ 平衡两项。$\blacksquare$（投影步不增距离——凸集投影的非扩张性，泛函 II。）

**读法**：**对抗世界里 $\sqrt T$ 的代价就是全部**——不需要任何统计假设；每轮平均 regret $\frac{GD}{\sqrt T} \to 0$。感知机定理（ai 课 02 的 Novikoff）是其可分特例（错误数 $\leq R^2/\gamma^2$ = 零 regret 的间隔版）；**Online-to-Batch【骨架】**：对 i.i.d. 数据取平均假设，regret 界直接变泛化界（期望版 Jensen 一行）——在线是比统计更强的范式（"能对抗恶意就能对抗随机"）。

**与实践的接线**：SGD 就是"随机版 OGD"，$\frac{1}{\sqrt T}$ 速率同源（优化 II 的表在此有了无分布出身）；专家问题/乘法权重（Hedge）是另一支主干【引用】——它与博弈论 minimax、boosting 的等价性是二十世纪末算法理论最美的三角之一（本科博弈 II 的 LP 对偶在此有算法化身）。

## 3. 统计学习四页资产盘点

| 路线 | 复杂度度量 | 核心工具 | 解释力所及 |
|---|---|---|---|
| 一致收敛（slt-01/02） | $\ln\lvert\mathcal{H}\rvert$ / VC 维 | union bound、对称化 | 经典模型、充要刻画 |
| Rademacher/margin（slt-03） | 噪声亲和力 / $BR/\rho$ | McDiarmid、收缩 | 核方法、boosting、范数控制的网络 |
| 稳定性（本页） | 算法敏感度 $\beta$ | 强凸、换样本技巧 | 正则化、SGD 型算法 |
| 在线/regret（本页） | 无（对抗式） | 势函数 | 流式、无分布场景 |

四条路线对深度学习各有部分解释、无一完整——**"过参数化网络为何泛化"仍是开放问题**：本站在此诚实收针（研究前沿的入口坐标已给足）。

## 4. 练习与要点

**例 1（β 的数值感）** SVM 级正则（$\lambda = \frac{1}{m}$ 量级常见）：$\beta = O(1)$——不衰减！稳定性界要求 $\lambda \gg \frac1m$ 才有意义 ⇒ "λ 太小时稳定性路线也保不了你"：三条路线各有失效区，交叉引用是必需而非装饰。

**例 2（OGD 亲手跑）** 二维凸域、手造三轮对抗损失，按证明里的势函数逐轮记账——验证望远镜求和的每一步（这是把证明变成肌肉记忆的最短路径）。

**例 3（online-to-batch 应用）** 用 OGD 的 $GD\sqrt T$ 界导出统计设定下 $E L_{\mathcal{D}}(\bar w) - L_{\mathcal{D}}(w^*) \leq \frac{GD}{\sqrt T}$：对 regret 取期望 + Jensen（$\ell$ 凸对 $\bar w$）——两个范式的官方换算器，三行写全。$\blacksquare$

---

*下一门：MDP 与强化学习的数学——把"学习"放进"决策与时间"里：Bellman 算子、收敛性、随机逼近。*
