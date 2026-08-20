# 统计学习 III · Rademacher 复杂度与 margin 理论

> **对标**：Mohri *FML* §3.1–3.3、§5.4 ｜ **前置**：slt-01/02、hdp-01、mt-04（McDiarmid）
> VC 维是"最坏情形"的组合量；**Rademacher 复杂度**让数据自己报复杂度——更紧、适用任意实值损失、且对核方法与神经网络可直接计算。本页给主定理全证，并走到解释 SVM/boosting 泛化的 **margin 界**。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="rademacher-complexity-learning-title">

<h2 id="rademacher-complexity-learning-title">学习层：把经验复杂度、概率证书和一次 gap 分开</h2>

本实验固定一个 $m=6$ 的带标签样本、一个有限函数类和一个 12 点均匀参考分布。有限类让“sup”可以完整枚举；固定参考分布让一次 realized gap 可以精确复核，但它仍然不是高概率量词的替身。

### 1. 经验 Rademacher 复杂度：先对每个符号取上确界

把每个候选函数的损失限制写成 $\ell_h(S)=(\ell_h(z_1),\ldots,\ell_h(z_m))$。脚本逐一枚举 $2^m=64$ 个符号向量，而不是随机抽几个标签：

$$
\widehat{\mathfrak R}_S(\ell\circ\mathcal H)
=\frac1{2^m}\sum_{\sigma\in\{-1,+1\}^m}
\max_{h\in\mathcal H}\frac1m\sum_{i=1}^m\sigma_i\ell_h(z_i).
$$

函数类从 4 个候选切到 8 个候选时，上确界的候选集合变大，所以经验复杂度不会因为“候选更多”而降低；但一次把标签打乱后仍能拟合的观察，最多是高容量的证据，不能单独断言 $\widehat{\mathfrak R}_S$ 已接近某个上限。严格的 $\widehat{\mathfrak R}_S$ 必须保留“对每个 $\sigma$ 取 sup，再对所有 $\sigma$ 平均”的顺序。

### 2. 三个读数的量词

对 $[0,1]$ 值损失，实验显示经验风险 $R_S(h)$、参考分布风险 $R_D(h)$ 和一次 realized gap

$$
\operatorname{gap}_{\rm realized}=R_D(h)-R_S(h)
$$

分别属于不同账本。这里的 $R_D$ 是声明好的 12 点教学分布上的精确平均，所以可以复算；它不是“看了这一个 holdout 就得到的总体真理”。

经验 Rademacher 版本的统一高概率证书写成

$$
R_D(h)\le R_S(h)+2\widehat{\mathfrak R}_S(\ell\circ\mathcal H)
 +3\sqrt{\frac{\log(2/\delta)}{2m}},
\qquad\text{概率至少 }1-\delta,
$$

并利用 $R_D(h)\le1$ 把显示值裁到 1。证书是对 iid 样本量词的上界；realized gap 是这次固定账本的差；经验复杂度是符号平均。三者数值偶尔相近，也不能互换定义。

### 3. 预测门与静态后备：先承认这个界是空泛的

**无 JavaScript 时的静态读法：**默认选择 8 个候选的丰富有限类，固定 $m=6$、$2^m=64$，按上式完整枚举得到 $\widehat{\mathfrak R}_S$。取 $\delta=0.05$ 后，右端的原始证书按 $R_S+2\widehat{\mathfrak R}_S+3\sqrt{\log(40)/12}$ 计算；在本页的 $m=6$ 配置中它会超过 1，故显示证书裁成 1，是 **vacuous（空泛）** 的统一界，而不是一个有用的数值预测。账本保留“原始证书”和“裁剪后证书”两列。

| 对象 | 固定内容 | 精确/观测方式 | 应得出的结论 |
|---|---|---|---|
| $\widehat{\mathfrak R}_S$ | $m=6$，8 个有限候选 | 对 64 个 $\sigma$ 逐一算 $\max_h$ 再平均 | 这是经验复杂度；不靠一次随机标签实验下结论 |
| 高概率证书 | $\delta=0.05$ | 先保留原始右端，再显示 $\min(1,\text{right-hand side})$ | 本配置原始值 $>1$，裁剪值为 1，界是 vacuous |
| realized gap | 同一 ERM 行的 $R_D-R_S$ | 12 点固定参考分布逐项计算 | 这是一次已实现差，不是概率证书 |
| $\delta=0.01$ | 其他条件不变 | 松弛项增大 | 证书更保守，不会因为置信度更高而自动变紧 |

交互 SVG 左侧画 64 个符号向量的上确界，右侧把 $R_S$、$R_D$、原始/裁剪证书分开；表格逐个列出函数，避免把“随机标签可拟合”误写成 Rademacher 复杂度已达上限。

<div class="learning-lab" data-learning-lab="rademacher-complexity" markdown="1">

**静态读法提示：**脚本失效时仍可用本节公式复核：先枚举 $\sigma$，再取 sup 和平均；然后分别计算固定参考风险、realized gap 与原始证书。m=6 下证书裁到 1 是本实验需要被看见的教学结论。

</div>

</section>

## 1. 定义与直觉

**定义（经验 Rademacher 复杂度）** $\sigma_i$ i.i.d. 均匀 $\pm1$（Rademacher 变量——slt-02 对称化第三步的主角转正）：

$$
\hat{\mathfrak{R}}_S(\mathcal{F}) = E_\sigma\Big[\sup_{f\in\mathcal{F}}\frac1m\sum_{i=1}^m \sigma_i f(z_i)\Big], \qquad \mathfrak{R}_m(\mathcal{F}) = E_S\,\hat{\mathfrak{R}}_S(\mathcal{F})
$$

**直觉**：$\sigma$ 是纯噪声符号——$\hat{\mathfrak{R}}$ 度量**函数类与许多独立随机符号对齐的平均最优能力**。它与“把标签打乱看模型还能不能记住”的实验共享容量直觉，但两者不是同一个统计量：一次随机重标后训练误差归零，只给出高容量的证据；计算 $\hat{\mathfrak R}_S$ 仍须对每个 $\sigma$ 在整个函数类上取上确界，再对 $\sigma$ 求平均。

## 2. 主定理（全证）

**定理（Rademacher 泛化界）** $\mathcal{F}$ 取值 $[0,1]$，以概率 $\geq 1-\delta$，对一切 $f \in \mathcal{F}$：

$$
E f \;\leq\; \frac1m\sum_i f(z_i) + 2\,\mathfrak{R}_m(\mathcal{F}) + \sqrt{\frac{\ln(1/\delta)}{2m}}
$$

**【证明】** 两步。
**① 集中**：$\Phi(S) = \sup_{\mathcal{F}}(Ef - \frac1m\sum f(z_i))$ 换一个样本至多变 $\frac1m$ ⇒ **McDiarmid**（mt-04 §3）：$\Phi(S) \leq E\Phi + \sqrt{\ln(1/\delta)/2m}$ w.p. $1-\delta$。
**② 对称化到 Rademacher**：

$$
E_S\Phi = E_S\sup_{\mathcal{F}} E_{S'}\Big[\tfrac1m\sum(f(z_i') - f(z_i))\Big]
\leq E_{S,S'}\sup_{\mathcal{F}}\tfrac1m\sum(f(z_i') - f(z_i))
$$

（Jensen：sup 的期望 ≥ 期望的 sup 反向使用——把 $E_{S'}$ 拉出。）交换任一对 $(z_i, z_i')$ 不改变 $E_{S,S'}$ 的分布 ⇒ 可以插入随机符号 $\sigma_i$：

$$
= E_{\sigma,S,S'}\sup_{\mathcal{F}}\tfrac1m\sum\sigma_i(f(z_i') - f(z_i)) \leq 2\,E_{S}E_\sigma\sup_{\mathcal{F}}\tfrac1m\sum\sigma_i f(z_i) = 2\mathfrak{R}_m
$$

（拆成两个 sup，各是一份 Rademacher 复杂度。）$\blacksquare$
（对比 slt-02：同一套幽灵样本 + 符号技巧，但**不经过增长函数**——因此不限 0-1 损失、不需要组合结构；VC 界成为特例：Massart 引理【引用】$\hat{\mathfrak{R}} \leq \sqrt{2\ln\Pi(m)}/\sqrt m$ + Sauer 即回收 slt-02。）

## 3. 计算工具箱

- **Talagrand 收缩引理【引用】**：$\varphi$ 为 $L$-Lipschitz ⇒ $\mathfrak{R}(\varphi\circ\mathcal{F}) \leq L\,\mathfrak{R}(\mathcal{F})$——**损失函数一层"白过"**（hinge/logistic 都是 1-Lipschitz），只需算假设类本身；
- **线性类【证明】**：$\mathcal{F} = \{x \mapsto \langle w, x\rangle: \|w\| \leq B\}$，$\|x_i\| \leq R$：

$$
\hat{\mathfrak{R}}_S = \frac{B}{m}\,E_\sigma\Big\|\sum\sigma_i x_i\Big\| \leq \frac{B}{m}\sqrt{E\big\|\sum\sigma_ix_i\big\|^2} = \frac{B}{m}\sqrt{\sum\|x_i\|^2} \leq \frac{BR}{\sqrt m}
$$

（Cauchy–Schwarz 提出 $w$、Jensen 进根号、交叉项因 $E\sigma_i\sigma_j = 0$ 消灭——三行结束。）**维数不出现**：范数约束替维数付账——SVM/核方法在无穷维工作的理论执照（RKHS 中同式，$R$ = 核对角线界）；

- 组合规则：凸包不增、加法可加、常数平移不变——神经网络的逐层递归界（每层 Lipschitz × 权重范数连乘【引用】）由此搭起。

## 4. Margin 界：解释 SVM 与 boosting

0-1 损失的界受制于分类边界的脆弱；**margin 损失**（以间隔 $\rho$ 计分：$\gamma$-margin 内算错）搭配收缩引理给出：

**定理（margin 界，骨架级陈述）** 以概率 $1-\delta$，对一切 $\|w\| \leq B$：

$$
L_{\mathcal{D}}^{0\text{-}1}(w) \;\leq\; \hat L_S^{\rho}(w) + \frac{2BR/\rho}{\sqrt m} + \sqrt{\frac{\ln(1/\delta)}{2m}}
$$

**读法**：**泛化由 $\frac{BR}{\rho\sqrt m}$ 控制——与维数无关，与"间隔相对尺度"有关**。SVM 最大化 $\rho$ 正是在直接优化这个界（ai 课 02"大间隔 ⇒ 泛化"的定理版）；boosting 的"训练误差为零后继续训练还能降测试误差"之谜同解——它在继续扩大 margin【引用 Schapire et al.】；深度学习的 margin/范数分析是该纲领的现代延长线（部分成功、整体仍开放——诚实边界）。

## 5. 练习与要点

**例 1（有限类回收）** $|\mathcal{F}| = N$：Massart 给 $\hat{\mathfrak{R}} \leq \sqrt{2\ln N}/\sqrt m$ ⇒ 主定理回收 slt-01 定理 B（常数略异）——三条路线（union bound / VC / Rademacher）在有限类上会师，互为校验。

**例 2（噪声拟合实验的理论读法）** 大网络能把一组随机打乱的 CIFAR 标签训练到零误差，说明该训练管线具有很强的记忆能力；它**没有直接算出**函数类的 $\hat{\mathfrak R}_S$，更不能由单次重标断言复杂度已到上限。合理结论是：只依赖全局容量、且不利用数据分布或算法偏置的简单一致收敛界，很可能十分宽松；这推动我们研究 margin、稳定性（slt-04）、压缩和隐式偏置等更贴近训练过程的量。把证据、统计量与定理结论分开，才是著名随机标签实验的正确理论读法。

**例 3（线性界的量纲自检）** $\frac{BR}{\sqrt m}$：$B$ 与 $R$ 各自缩放会被 $w^\top x$ 的不变性抵消——界只依赖无量纲组合 $BR/\rho$（margin 版）：量纲分析（本科建模页）在学习论里同样是防错器。$\blacksquare$

---

*下一页：一致收敛之外的第二条泛化路线——算法稳定性与正则化，以及在线学习（感知机、OGD 与 regret），统计学习四页收官。*
