# 渐近统计 II · MLE 的渐近理论

> **对标**：van der Vaart *AS* §5.2–5.5 ｜ **前置**：as-01、本科统计 II、mt-02
> 本科统计 II 承诺过"MLE 渐近正态且达 Cramér–Rao 界"——本页兑付：**相合性**（为什么 MLE 找得到真值）、**渐近正态性**（$\sqrt n$ 速率 + Fisher 信息的逆当方差）、**渐近有效性**（为什么它是"讲究人的选择"）。证明结构本身（M-估计的三段论）比结论更值得带走。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="mle-asymptotics-learning-title">

## 学习层：渐近钟形不是有限样本印章，边界也不会因样本变多而消失

<h3 id="mle-asymptotics-learning-title">1. 先预测：正则定理在哪些地方停止发证？</h3>

用 Bernoulli 模型 $X_i\sim\operatorname{Bernoulli}(p)$ 做一台可穷举的显微镜。MLE 为 $\hat p=K/n$，$K\sim\operatorname{Binomial}(n,p)$。先判断：

1. $\sqrt n(\hat p-p)\Rightarrow N(0,p(1-p))$ 是否意味着每个有限 $n$ 的 $\hat p$ 都精确正态？
2. 真值 $p=0$ 或 $1$ 时，能否直接沿用“真值为参数空间内点”的 Taylor/Fisher 证明？
3. 名义 95% 的 Wald 区间是否在所有 $(n,p)$ 上都精确覆盖 95%？

揭示后，实验不抽 Monte Carlo 样本，而是枚举 $K=0,\ldots,n$ 的全部二项质量；因此柱状图、均值、方差和区间覆盖率都是确定的，正态曲线才是近似层。

### 2. 静态后备：Bernoulli 内点是“恰好能双重对账”的特例

<div class="learning-lab" data-learning-lab="mle-asymptotics" markdown="1">

对 $0<p<1$，

$$
E(\hat p)=p,
\qquad
\operatorname{Var}(\hat p)=\frac{p(1-p)}n,
\qquad
I(p)=\frac1{p(1-p)}.
$$

所以这个特例中 $\operatorname{Var}(\hat p)=1/[nI(p)]$ 在有限样本就成立；这来自样本均值和一参数指数族的特殊结构，不能倒推出“一般 MLE 都在有限样本无偏并达到 CR 界”。

| 状态 | 精确分布 | 正态近似能否直接套 |
|---|---|---|
| $0<p<1$，$n$ 有限 | $P(\hat p=k/n)=\binom nkp^k(1-p)^{n-k}$ | 只是近似，质量仍在离散格点上 |
| $n\to\infty$，固定内点 $p$ | 标准化后二项分布趋正态 | 正则 CLT/Taylor 路线成立 |
| $p=0$ 或 $1$ | $\hat p$ 退化在边界 | 内点、非退化信息与常规正态极限失效 |

实验还对所有 $k$ 穷举 Wald 与 Wilson 区间是否覆盖真值，并按二项概率加权。固定 $n$ 时，覆盖率随 $p$ 变化通常含跳跃；“95%”是构造的名义目标或渐近校准，不是逐参数精确恒等式。

</div>

### 3. 从特例回到一般 MLE

- **相合性先于局部展开。**若可识别性、良分离最大点或一致大数律失败，先把 $\hat\theta$ 拉回 $\theta_0$ 邻域的步骤就不存在。
- **真值内点与信息非奇异不是装饰。**边界、混合模型、不可识别参数和奇异信息阵通常产生截断、混合或非 $\sqrt n$ 极限。
- **渐近有效性需要局部正则比较口径。**Hodges 型超有效现象说明“某一个点方差更小”不等于在邻域中普遍更好。
- **误设模型要换方差。**伪真值附近通常出现 sandwich 协方差；把模型内 Fisher 逆直接当真实抽样方差可能低估不确定性。

</section>

先修回链：[收敛工具与 Delta 方法](as-01-convergence-tools.html)、[大数律与中心极限定理](mt-02-lln.html)。

## 1. 相合性：KL 的胜利

MLE 是 **M-估计**（最大化经验准则 $M_n(\theta) = \frac1n\sum\ln f(X_i;\theta)$）的特例；总体准则 $M(\theta) = E_{\theta_0}\ln f(X;\theta)$。

以下把密度理解为相对于同一支配测度定义；分布可识别指不同参数给出不同概率分布，而不是仅在零测集上密度取值不同。先假定所写的总体对数似然期望有限，以避免 $\infty-\infty$；更一般的扩展值版本须直接处理对数似然比。

**引理（真值是总体冠军）【证明】** $M(\theta_0) - M(\theta) = E_{\theta_0}\ln\frac{f(X;\theta_0)}{f(X;\theta)} = D_{\mathrm{KL}}(f_{\theta_0}\|f_\theta) \geq 0$，可识别性（$\theta \neq \theta_0 \Rightarrow P_\theta \neq P_{\theta_0}$）时严格。$\blacksquare$——**MLE 的靶心就是 KL 的最小点**（本科信息论 II"MLE = 最小化 KL"在总体层面的重述）。

**定理（M-估计相合性的可用版本）** 设 $\theta_0$ 是总体准则的**良分离最大点**：对每个 $\varepsilon>0$，

$$
\sup_{d(\theta,\theta_0)\ge\varepsilon}M(\theta)<M(\theta_0).
$$

若 $\sup_\theta|M_n(\theta)-M(\theta)|\xrightarrow{P}0$，且估计量允许数值误差但满足

$$
M_n(\hat\theta_n)\ge\sup_{\theta\in\Theta}M_n(\theta)-o_P(1),
$$

则 $\hat\theta_n\xrightarrow{P}\theta_0$。在紧参数空间上，$M$ 连续且有唯一最大点是推出“良分离”的一组方便充分条件；可识别性通常用于证明唯一性，却不能单独替代连续性与分离条件。

**【证明】** 一致收敛与近似最大化给 $M(\hat\theta_n)\ge M(\theta_0)-o_P(1)$。固定 $\varepsilon>0$，良分离给出间隙 $\eta_\varepsilon=M(\theta_0)-\sup_{d(\theta,\theta_0)\ge\varepsilon}M(\theta)>0$；因此事件 $d(\hat\theta_n,\theta_0)\ge\varepsilon$ 只能发生在统一误差或优化误差至少吃掉 $\eta_\varepsilon$ 的情形，其概率趋零。$\blacksquare$

**读法**：条件各司其职——良分离（成绩接近才能推出位置接近）、ULLN（经验面不欺骗）、近似 argmax（允许实际优化器只做到 $o_P(1)$ 精度）。紧性 + 连续唯一最大点是一条建立良分离的路线，不是定理里可以悄悄省略的推理。**任何 M-估计（最小二乘、稳健回归、经验风险最小化）都要过同一套三段论**。

## 2. 渐近正态性（主定理）

**定理（一组常用的充分条件）** 设样本 iid、模型正确，$\hat\theta_n$ 已相合且真值是参数空间内点；邻域内对数密度二阶连续可微，可交换积分和求导，得分具有有限且正定的信息阵 $I(\theta_0)$，经验 Hessian 在该邻域满足一致大数律。若估计量满足平均得分为 $o_P(n^{-1/2})$（精确内点 MLE 得分为零），则：

$$
\sqrt n\,(\hat\theta_n - \theta_0) \;\xrightarrow{d}\; N\big(0,\ I(\theta_0)^{-1}\big)
$$

**【证明（一维 Taylor 路线）】** 得分函数 $\psi(\theta) = \frac1n\sum\partial_\theta\ln f(X_i;\theta)$，MLE 满足 $\psi(\hat\theta_n) = 0$。在 $\theta_0$ 处展开：

$$
0 = \psi(\theta_0) + \psi'(\tilde\theta)(\hat\theta_n - \theta_0)
\;\Rightarrow\;
\sqrt n(\hat\theta_n - \theta_0) = \big[-\psi'(\tilde\theta)\big]^{-1}\sqrt n\,\psi(\theta_0)
$$

三个部件：① $\sqrt n\,\psi(\theta_0) \xrightarrow{d} N(0, I(\theta_0))$——得分是 i.i.d. 零均值（正则条件：$E\partial\ln f = 0$）方差 $I$ 的和，**CLT**；② $-\psi'(\tilde\theta) \xrightarrow{P} I(\theta_0)$——二阶导的 LLN + 相合性把 $\tilde\theta$ 钉在 $\theta_0$ 邻域（一致性论证【骨架】）；③ Slutsky 合成 $I^{-1}N(0, I) = N(0, I^{-1})$。$\blacksquare$

**结构读法（与条件一起记）**：**"估计误差 = 曲率之逆 × 得分噪声"**——分子是随机性（CLT 管）、分母是可辨性（信息 = 对数似然峰的曲率，统计 II）；峰越尖（$I$ 大）方差越小。多维时不能一般地用同一个中间点表示整个向量差；改用线段积分 Hessian

$$
H_n=\int_0^1\nabla\psi\big(\theta_0+t(\hat\theta_n-\theta_0)\big)dt
$$

使 $\psi(\hat\theta_n)-\psi(\theta_0)=H_n(\hat\theta_n-\theta_0)$，再由相合性与统一控制得到 $-H_n\to_P I$。

**渐近有效性**：极限方差恰为 Cramér–Rao 下界 $I^{-1}$（统计 II）——MLE 在正则模型中渐近不可改进（严格表述需 Hájek–Le Cam 卷积定理堵住"超有效"漏洞——Hodges 反例：可在孤立点超越 C–R 但代价是邻域性能崩坏；局部渐近极小极大意义下 MLE 最优【引用】）。

**失效清单（工程同样重要）**：真值在边界时极限通常是 Gaussian 向切锥的投影，而不只是口头上的“截断正态”。最小例子是 $X_i\sim N(\theta,1)$、参数空间 $\Theta=[0,\infty)$、真值 $\theta_0=0$：

$$
\hat\theta_n=\max(0,\bar X),\qquad
\sqrt n\,\hat\theta_n\Rightarrow\max(0,Z),\quad Z\sim N(0,1).
$$

极限在 $0$ 处有质量 $1/2$，正半轴上保留标准正态密度；它不是把正态条件化到正半轴所得、总质量重新归一化的普通截断正态。参数维数随 $n$ 增长则需高维理论接管；模型误设时 $\hat\theta$ 收敛到 KL 最近点（“伪真值”），协方差一般变成 sandwich $I^{-1}JI^{-1}$（稳健标准误的出处【引用 White】）。

## 3. 练习与要点

**例 1（信息阵亲算）** 正态 $N(\mu, \sigma^2)$ 双参数：$I = \mathrm{diag}\big(\frac{1}{\sigma^2}, \frac{1}{2\sigma^4}\big)$（二阶导取期望）⇒ $\sqrt n(\hat\sigma^2 - \sigma^2) \xrightarrow{d} N(0, 2\sigma^4)$——与 as-01 例 1 对账吻合 ✓（两条独立路线同一答案，互为 verify）。

**例 2（Delta + MLE 流水线）** 泊松 $\hat\lambda = \bar X$，目标 $g(\lambda) = e^{-\lambda}$（零事件概率）：$\sqrt n(e^{-\bar X} - e^{-\lambda}) \xrightarrow{d} N(0,\ \lambda e^{-2\lambda})$（$I^{-1} = \lambda$ 进 Delta）——"任何参数函数的置信区间"标准作业。

**例 3（误设的体感，要把方差参数说清）** 用固定方差为 1 的工作模型 $N(\mu,1)$ 拟合真实的中心化 $t_3$ 数据。准 MLE 仍是 $\hat\mu=\bar X$ 且收敛到 0，但工作模型给 $I^{-1}=1$，真实得分方差为 $J=\operatorname{Var}(X)=3$，所以 $\sqrt n\hat\mu$ 的真实方差是 sandwich $I^{-1}JI^{-1}=3$；模型标准误 $1/\sqrt n$ 会低估为真实值的 $1/\sqrt3$。若同时自由估计正态方差，则在这个“纯 iid 均值”特例里伪真方差会对上 $\operatorname{Var}(X)$，不能继续声称必然低估；异方差回归或固定错方差才真正暴露 sandwich 差异。$\blacksquare$

**可评分迁移（边界投影）**：仍取 $\Theta=[0,\infty)$，但令真实局部参数 $\theta_n=h/\sqrt n$（固定 $h\ge0$）。求 $\sqrt n(\hat\theta_n-\theta_n)$ 的极限，并分别给出 $h=0$ 与 $h=1$ 时估计量卡在边界的极限概率。

<details markdown="1"><summary>独立作答后核对</summary>

因为 $\sqrt n\bar X=h+Z$，有 $\sqrt n\hat\theta_n\Rightarrow\max(0,h+Z)$，从而

$$
\sqrt n(\hat\theta_n-\theta_n)\Rightarrow\max(0,h+Z)-h.
$$

卡在边界的概率趋于 $P(h+Z\le0)=\Phi(-h)$：$h=0$ 时为 $1/2$，$h=1$ 时约为 $0.1587$。这说明局部备择下的边界效应不会被一句“样本很大”抹掉。

</details>

---

*下一页：检验的渐近理论——似然比/Wald/得分三大检验的等价性、Wilks 定理，渐近统计三页收官。*
