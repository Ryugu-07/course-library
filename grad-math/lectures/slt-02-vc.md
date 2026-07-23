# 统计学习 II · VC 理论与学习论基本定理

> **对标**：SSBD *UML* §6、Mohri §3 ｜ **前置**：slt-01、本科 ai 课 01 讲（VC 维与 Sauer 已证）
> 无限假设类的 union bound 失效——出路是"数行为不数函数"（VC 维）。本科 ai 课已给 Sauer 引理全证；本页补齐真正的硬核：**双样本对称化技巧**（无限类一致收敛的证明引擎）与**学习论基本定理**（VC 有限 ⟺ 可学——充要！），并给下界的对偶面。


<figure class="diagram" markdown="1">
![VC 维：一族分类器能&quot;打散&quot;多少点（如直线打散 3 点、打不散 4 点的 XOR）。](assets/img/slt-02-vc-shatter.svg)
<figcaption><span class="fig-id">图 slt-02.1</span>VC 维：一族分类器能"打散"多少点（如直线打散 3 点、打不散 4 点的 XOR）。</figcaption>
</figure>

## 1. 快速复置（ai 课 01 已证部分）

增长函数 $\Pi_{\mathcal{H}}(m)$ = $m$ 个点上可实现的标签模式数；VC 维 $d$ = 最大可打散规模；**Sauer 引理**：$\Pi_{\mathcal{H}}(m) \leq \sum_{i\leq d}\binom mi \leq \big(\frac{em}{d}\big)^d$——多项式增长（证明见 ai 课 01 讲，本站不重复）。范例：半空间 $d = n+1$；区间并、多项式阈值各有公式；**凸多边形类 $d = \infty$**（圆上点集可任意打散——"看起来简单的类可以无限复杂"的警世例）。

## 2. 对称化：无限类一致收敛的引擎

**定理（VC 一致收敛）** 以概率 $1 - \delta$：

$$
\sup_{h\in\mathcal{H}}\big|L_S(h) - L_{\mathcal{D}}(h)\big| \;\leq\; C\sqrt{\frac{d\ln(m/d) + \ln(1/\delta)}{m}}
$$

**【证明骨架（对称化三步，结构完整）】**
**① 幽灵样本（symmetrization）**：引入独立副本 $S' \sim \mathcal{D}^m$：

$$
P\Big(\sup_{\mathcal{H}}|L_S - L_{\mathcal{D}}| > \varepsilon\Big) \;\leq\; 2\,P\Big(\sup_{\mathcal{H}}|L_S - L_{S'}| > \tfrac\varepsilon2\Big)
$$

（Chebyshev 说 $L_{S'}$ 大概率贴近 $L_{\mathcal{D}}$，把"与看不见的总体比"换成"与另一份样本比"——**总体从证明中消失了**。）
**② 行为有限化**：$\sup$ 里只剩 $2m$ 个样本点，$\mathcal{H}$ 在其上至多 $\Pi_{\mathcal{H}}(2m)$ 种行为——**union bound 的对象从无限函数变为有限模式**（Sauer 说这是多项式 $\big(\frac{2em}{d}\big)^d$）；
**③ 随机符号 + Hoeffding**：固定行为模式后，$L_S - L_{S'}$ 的分布可用随机交换对 $(z_i, z_i')$ 生成（Rademacher 符号 $\sigma_i$ 登场——下一页的主角在此出生），Hoeffding 给单模式尾界 $e^{-m\varepsilon^2/8}$；与 ② 的多项式相乘，解出 $\varepsilon$。$\blacksquare$

**结构读法**：三步分别解决"总体不可见 / 函数无限多 / 单事件要集中"——**对称化是把 hdp 的集中不等式送进无限函数类的运载火箭**（hdp-04 的 chaining 是另一枚：熵积分路线给同阶结果，两条路线在覆盖数处会师——Haussler 引理【引用】把 VC 维换算为覆盖数）。

## 3. 学习论基本定理

**定理（Fundamental Theorem of Statistical Learning）** 对二分类 0-1 损失，以下**等价**：
（a）$\mathcal{H}$ agnostic PAC 可学；（b）ERM 是成功的学习算法；（c）$\mathcal{H}$ 有一致收敛性质；（d）$\mathrm{VC}(\mathcal{H}) = d < \infty$。
且样本复杂度 $m(\varepsilon, \delta) = \Theta\big(\frac{d + \ln(1/\delta)}{\varepsilon^2}\big)$（可实现情形 $\varepsilon$ 一次方）。

**已证的拼图**：(d)⇒(c) 即 §2；(c)⇒(b)⇒(a) 即 slt-01 的三段论。剩下**下界方向 (a)⇒(d)**：
**【骨架（$d = \infty$ 不可学）】** 打散集上重演 slt-01 NFL 的构造——$d$ 个可打散点上放均匀分布 + 随机标签，任何算法在未见点上错一半；$d = \infty$ 时该构造对任意 $m$ 可行 ⇒ 样本复杂度无穷。定量下界 $m \gtrsim \frac{d}{\varepsilon^2}$ 同构造精细化（概率方法再次出手）。$\blacksquare$

**读法（这一定理的分量）**：**可学性被一个组合量完全刻画**——不多不少恰是 VC 维：上界（Sauer+对称化）与下界（NFL 构造）在同一量上会师，学习论少有的"闭合"定理。哲学收束：*"能学 = 假设类在有限点上的表达力受多项式约束"*——表达力与泛化的对立在此定量化（ai 课 01"深网 VC 界空洞"的裂缝也因此更醒目：现代网络逃出该框架的解释是 slt-03/04 的margin/稳定性路线与仍开放的部分）。

## 4. 练习与要点

**例 1（VC 维手算）** $\mathbb{R}^2$ 上轴平行矩形类：可打散 4 点（菱形排布）、任 5 点必有一点被其余"包围"（取各方向极值点的矩形必含第五点）⇒ $d = 4$。样本复杂度 $O(\frac{4 + \ln(1/\delta)}{\varepsilon^2})$ 立即可用。

**例 2（对称化的必要性自检）** 为何不能直接对无限类打 union bound？——事件数无限、和发散；为何幽灵样本能救？——sup 的随机性被限制在 $2m$ 个点的**已实现行为**上，Sauer 把它压成多项式。两问能答清，对称化就懂了。

**例 3（下界的实践读法）** VC 下界说 $m \gtrsim d/\varepsilon^2$ 对**最坏分布**成立——真实分布常远好于最坏（margin 大、低噪声），这正是"理论样本数悲观、实践少得多也行"的正解（而非理论错误）；分布相关的精细界即下一页 Rademacher 的卖点。$\blacksquare$

---

*下一页：把"最坏情形组合量"换成"数据自己说话的复杂度"——Rademacher 复杂度：更紧的界、更广的损失、以及 margin 理论。*
