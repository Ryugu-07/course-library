# 统计学习 IV · 稳定性、正则化与在线 regret

> **对标**：SSBD *Understanding Machine Learning* §13–14、§21 ｜ **前置**：slt-01–03、凸优化、McDiarmid
> 本页收束两条不同的路线：正则化 ERM 用“换一个训练点，算法输出改变多少”连接到统计泛化；Hedge 则允许损失序列由对手逐轮给出，用事后最佳固定专家定义 comparator regret。前者的 iid/期望量词不能偷渡到后者，后者的一次 realized regret 也不能被叫作 worst-case bound。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="stability-online-learning-title">

<h2 id="stability-online-learning-title">学习层：先把两个量词放到不同账本</h2>

### 1. 直觉案例：换掉一条数据，模型会不会换脸？

给定样本 $S=(z_1,\ldots,z_m)$，正则化 ERM 取

$$
A(S)=\arg\min_w\left\{\frac1m\sum_{i=1}^m\ell(w,z_i)+\frac{\lambda}{2}\|w\|^2\right\}.
$$

把一个点换成 $z_i'$ 得 $S^{(i)}$。先预测：

1. 增大 $m$ 或 $\lambda$，邻居输出的损失差通常变大还是变小？
2. $\beta=2L^2/(\lambda m)$ 是一个“这条测试样本已经泛化良好”的 realized 数字，还是算法稳定性的统一证书？
3. 在 Hedge 中，对手是否需要先承诺一个 iid 分布？
4. 运行完一条 12 轮序列后的 regret，是这条序列的 ledger，还是所有未来序列的最坏上界？

直觉上，强凸正则把目标函数变成一个有“弹簧”的碗；删掉一个样本只会轻微移动碗底。Hedge 的直觉不同：它不是从样本分布估计风险，而是在每轮把权重向过去损失较小的专家移动。

### 2. 形式推导桥 A：正则化 ERM 的稳定性证书

假设 $\ell(\cdot,z)$ 凸且对 $w$ 是 $L$-Lipschitz，$\lambda>0$。目标函数的正则项让它 $\lambda$-强凸。两个邻居最优点 $w=A(S)$ 与 $w'=A(S^{(i)})$ 的强凸不等式，加上只有一项样本被替换，可得

$$
\|w-w'\|\lesssim\frac{2L}{\lambda m},
\qquad
\sup_z|\ell(w,z)-\ell(w',z)|
\leq \boxed{\beta=\frac{2L^2}{\lambda m}}.
$$

这一步的对象是**算法对单点替换的最大敏感度**。在 $S$ 是来自同一分布 $\mathcal D$ 的 iid 样本、损失满足上述条件时，交换训练点与独立测试点的双重期望技巧给出

$$
\left|E_S\left[L_{\mathcal D}(A(S))-L_S(A(S))\right]\right|\leq\beta.
$$

这是期望泛化声明；高概率版本还需要有界差分/McDiarmid 等额外步骤。一个固定参考分布上计算出的
$L_{\mathcal D}(A(S))-L_S(A(S))$ 仍是一次 realized gap，不是自动获得的概率定理。

### 3. 形式推导桥 B：Hedge 与 comparator regret

有 $K$ 个专家，每轮先选分布 $p_t$，观察损失
$\ell_{t,k}\in[0,1]$，再更新

$$
w_{t+1,k}=w_{t,k}e^{-\eta\ell_{t,k}},
\qquad
p_{t,k}=\frac{w_{t,k}}{\sum_jw_{t,j}}.
$$

学习者损失是 $\widehat\ell_t=\sum_kp_{t,k}\ell_{t,k}$，事后最佳固定专家的 comparator 损失是
$\min_k\sum_t\ell_{t,k}$。因此账本中的 realized regret 是

$$
\operatorname{Reg}_T^{\rm ledger}
=\sum_t\widehat\ell_t-\min_k\sum_t\ell_{t,k}.
$$

对 $[0,1]$ 损失使用 Hoeffding 引理和权重势函数，得到对**每一条合法损失序列**成立的证书

$$
\operatorname{Reg}_T
\leq\frac{\log K}{\eta}+\frac{\eta T}{8}.
$$

右边是 theorem bound；实验台的红色曲线是某一条已选序列的 realized regret。它们同量纲但不是同一对象。序列可以是自适应或对抗的，因而这里没有 iid 泛化假设；“分布无关”来自协议和损失范围，不是来自稳定性定理。

### 4. 模型边界面板：两条保证不能互换

> **模型边界**
>
> - 稳定性：需要凸/Lipschitz、$\lambda>0$ 和正则化 ERM 的结构；把它转成泛化时需要 iid 样本和期望（或另加集中不等式）。
> - 在线 regret：需要逐轮协议、损失范围和 comparator 定义；不需要数据分布，但只保证相对事后最佳固定专家。
> - $\beta$ 不是一次测试集 gap 的数值替身。
> - 一条 Hedge 序列的 realized regret 不是 worst-case bound；只有右侧显式写出的不等式才是上界证书。
> - 在线学习者若换成“每轮事后挑最小损失专家”，会产生信息泄漏；Hedge 的概率必须在看到本轮损失前确定。

### 5. 确定性实验：同一屏，两种量词

预测门提交后，左侧调节 $m,\lambda,L$ 和一个声明好的两点参考分布，右侧选择固定的对抗序列与 $\eta$。左侧显示 beta certificate、一个邻居替换的实际最大损失差、以及固定参考分布上的 realized gap；右侧显示每轮概率、学习者损失、最佳固定专家和 regret。每次重置都会回到同一配置。

<div class="learning-lab" data-learning-lab="online-regret" markdown="1">

**无 JavaScript 时的静态读法：** 默认取 $m=48,\lambda=0.5,L=1$，则
$\beta=2/(0.5\cdot48)=1/12\approx0.08333$。这只是满足假设时的稳定性证书。

| 账本 | 计算 | 正确读法 |
|---|---|---|
| ERM 稳定性证书 | $\beta=2L^2/(\lambda m)$ | iid/期望泛化路线的算法证书 |
| 邻居检查 | $\max_{y\in\{-1,1\}}\lvert\ell(w,y)-\ell(w',y)\rvert$ | 一次有限 probe 的实测敏感度 |
| 固定参考 gap | $L_{\rm ref}(A(S))-L_S(A(S))$ | realized gap，不是自动的高概率结论 |
| Hedge 更新 | $p_{t,k}=w_{t,k}/\sum_jw_{t,j}$，$w_{t+1,k}=w_{t,k}e^{-\eta\ell_{t,k}}$ | 先预测后观测的在线协议 |
| comparator regret | $\sum_t\widehat\ell_t-\min_k\sum_t\ell_{t,k}$ | 这条序列的 realized regret |
| theorem bound | $\log(K)/\eta+\eta T/8$，损失在 $[0,1]$ | 对合法序列的显式最坏情形证书 |

例如默认 Hedge 设 $K=3,T=12,\eta=0.55$，显示的上界为
$\log(3)/0.55+0.55\cdot12/8\approx2.82$。不要因为某条序列的红色 regret 小，就删掉右侧的损失范围、comparator 或 theorem bound 标签。

</div>

</section>

## 1. 一致稳定性与泛化

算法 $A$ 称为 $\beta$-uniformly stable，如果任意相邻样本集和任意测试点 $z$ 满足

$$
\sup_z|\ell(A(S),z)-\ell(A(S^{(i)}),z)|\leq\beta.
$$

它控制的是算法映射 $S\mapsto A(S)$ 的敏感度，而不是假设类的 VC 维或 Rademacher 复杂度。正则化 ERM 的强凸性给出稳定性，是“算法本身温和”这一事实的定量化。

稳定性泛化证明把

$$
E_S L_{\mathcal D}(A(S))
\quad\text{和}\quad
E_S L_S(A(S))
$$

写成训练点与独立点交换后的两个期望；只有在 iid 抽样与交换合法时，差值才可由 $\beta$ 控制。若数据有时间依赖、分布漂移或算法查看了验证集，必须重新审计这一步。

## 2. 在线专家与 Hedge

在线协议是

$$
\text{选 }p_t\ \longrightarrow\ \text{看 }\ell_t\ \longrightarrow\ \text{付 }\langle p_t,\ell_t\rangle\ \longrightarrow\ \text{更新}.
$$

Hedge 的势函数证明把专家 $k$ 的权重写成
$w_{T+1,k}=K^{-1}\exp(-\eta\sum_t\ell_{t,k})$，一方面上界权重总和，另一方面下界最佳专家权重，得到前述 regret inequality。若 $\eta\asymp\sqrt{\log K/T}$，上界是 $O(\sqrt{T\log K})$，平均 regret 才趋于 0。

注意 comparator 是“事后最好的固定专家”，不是每轮最好的专家；后者通常需要额外信息，不能直接作为可实现基准。专家数量、损失范围、$\eta$ 和比较对象都应写入实验账本。

## 3. 与 OGD 和 online-to-batch 的接口

在凸决策域直径 $D$、次梯度范数 $\leq G$ 的 OGD 中，势函数同样给出

$$
\operatorname{Reg}_T
\leq\frac{D^2}{2\eta}+\frac{\eta G^2T}{2}.
$$

这是在线协议内部的分布无关结论。若再把在线样本假设为 iid，并对在线迭代平均应用 Jensen，才可导出 online-to-batch 的期望统计结论；那是额外的桥梁，不是 Hedge 账本已经完成的事情。

## 4. 三个检查题

**例 1（正则太弱）** 若 $\lambda=1/m$，公式给 $\beta=2L^2/(\lambda m)=2L^2$ 量级的常数而不会随 $m$ 消失；稳定性路线也有失效区。

**例 2（对抗序列）** 让一个专家前半程最好、另一个后半程最好，Hedge 会因惯性付出切换代价；这不表示算法违反 regret 定理，因为 comparator 仍是一个固定专家。

**例 3（量词翻译）** 想把稳定性变成测试风险结论时，补上 iid、损失有界/集中条件与概率量词；想把 Hedge 变成统计泛化时，另写 online-to-batch 的抽样桥。$\blacksquare$

---

*统计学习的两条边界在这里并列：稳定性解释“这个算法为何不太依赖某一个样本”，在线 regret 解释“没有分布时仍能追平一个固定基准”。它们都强大，但各自的量词必须留在原位。*
