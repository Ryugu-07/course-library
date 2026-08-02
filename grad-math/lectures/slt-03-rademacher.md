# 统计学习 III · Rademacher 复杂度与 margin 理论

> **对标**：Mohri *FML* §3.1–3.3、§5.4 ｜ **前置**：slt-01/02、hdp-01、mt-04（McDiarmid）
> VC 维是"最坏情形"的组合量；**Rademacher 复杂度**让数据自己报复杂度——更紧、适用任意实值损失、且对核方法与神经网络可直接计算。本页给主定理全证，并走到解释 SVM/boosting 泛化的 **margin 界**。

## 1. 定义与直觉

**定义（经验 Rademacher 复杂度）** $\sigma_i$ i.i.d. 均匀 $\pm1$（Rademacher 变量——slt-02 对称化第三步的主角转正）：

$$
\hat{\mathfrak{R}}_S(\mathcal{F}) = E_\sigma\Big[\sup_{f\in\mathcal{F}}\frac1m\sum_{i=1}^m \sigma_i f(z_i)\Big], \qquad \mathfrak{R}_m(\mathcal{F}) = E_S\,\hat{\mathfrak{R}}_S(\mathcal{F})
$$

**直觉**：$\sigma$ 是纯噪声标签——$\hat{\mathfrak{R}}$ 度量**函数类拟合随机噪声的能力**。能把噪声都拟合好的类必然过拟合；"复杂度 = 对噪声的亲和力"是比"打散点数"更贴近机器学习实感的定义（ai 课"把标签打乱看网络还能不能记住"的著名实验，测的就是它）。

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

**例 2（噪声拟合实验的理论读法）** 把 CIFAR 标签全打乱，大网络训练误差仍归零 ⇒ 其 $\hat{\mathfrak{R}} \approx$ 上限 ⇒ **一致收敛路线给不出非平凡界**（Zhang et al. 实验的正式含义）——不是"理论死了"，是"必须走数据/算法相关路线"（margin、稳定性 slt-04、隐式偏置）：把著名实验翻译成理论语言是本页的验收题。

**例 3（线性界的量纲自检）** $\frac{BR}{\sqrt m}$：$B$ 与 $R$ 各自缩放会被 $w^\top x$ 的不变性抵消——界只依赖无量纲组合 $BR/\rho$（margin 版）：量纲分析（本科建模页）在学习论里同样是防错器。$\blacksquare$

---

*下一页：一致收敛之外的第二条泛化路线——算法稳定性与正则化，以及在线学习（感知机、OGD 与 regret），统计学习四页收官。*
