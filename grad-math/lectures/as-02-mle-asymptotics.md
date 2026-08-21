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

实验还对所有 $k$ 穷举 Wald 与 Wilson 区间是否覆盖真值，并按二项概率加权。覆盖率是 $(n,p)$ 的离散函数；“95%”是构造的名义目标或渐近校准，不是逐参数精确恒等式。

### 3. 从特例回到一般 MLE

- **相合性先于局部展开。**若可识别性、良分离最大点或一致大数律失败，先把 $\hat\theta$ 拉回 $\theta_0$ 邻域的步骤就不存在。
- **真值内点与信息非奇异不是装饰。**边界、混合模型、不可识别参数和奇异信息阵通常产生截断、混合或非 $\sqrt n$ 极限。
- **渐近有效性需要局部正则比较口径。**Hodges 型超有效现象说明“某一个点方差更小”不等于在邻域中普遍更好。
- **误设模型要换方差。**伪真值附近通常出现 sandwich 协方差；把模型内 Fisher 逆直接当真实抽样方差可能低估不确定性。

</div>

</section>

## 1. 相合性：KL 的胜利

MLE 是 **M-估计**（最大化经验准则 $M_n(\theta) = \frac1n\sum\ln f(X_i;\theta)$）的特例；总体准则 $M(\theta) = E_{\theta_0}\ln f(X;\theta)$。

**引理（真值是总体冠军）【证明】** $M(\theta_0) - M(\theta) = E_{\theta_0}\ln\frac{f(X;\theta_0)}{f(X;\theta)} = D_{\mathrm{KL}}(f_{\theta_0}\|f_\theta) \geq 0$，可识别性（$\theta \neq \theta_0 \Rightarrow f_\theta \neq f_{\theta_0}$）时严格。$\blacksquare$——**MLE 的靶心就是 KL 的最小点**（本科信息论 II"MLE = 最小化 KL"在总体层面的重述）。

**定理（相合性）** 可识别 + 紧参数空间 + 准则的一致大数定律 $\sup_\theta|M_n(\theta) - M(\theta)| \xrightarrow{P} 0$ ⇒ $\hat\theta_n \xrightarrow{P} \theta_0$。
**【证明】** $M(\hat\theta_n) \geq M_n(\hat\theta_n) - \sup|M_n - M| \geq M_n(\theta_0) - o_P(1) \geq M(\theta_0) - 2\,o_P(1)$——**经验冠军的总体成绩逼近总体冠军**；可识别 + 紧性给"成绩接近 ⇒ 位置接近"（$M$ 连续、最大点良分离），故 $\hat\theta_n \to \theta_0$。$\blacksquare$
**读法**：三个条件各司其职——可识别（靶心唯一）、ULLN（经验面不欺骗，**hdp-04 一致大数定律在此交货**：紧集 + 连续性给覆盖数有限）、紧性（不会跑到无穷远）。**任何 M-估计（最小二乘、稳健回归、经验风险最小化）同一套三段论**——slt 线将对 ERM 重演它。

## 2. 渐近正态性（主定理）

**定理** 正则条件下（真值内点、$\ln f$ 二阶光滑、信息阵 $I(\theta_0)$ 正定、可换积分求导序）：

$$
\sqrt n\,(\hat\theta_n - \theta_0) \;\xrightarrow{d}\; N\big(0,\ I(\theta_0)^{-1}\big)
$$

**【证明（经典 Taylor 路线）】** 得分函数 $\psi(\theta) = \frac1n\sum\partial_\theta\ln f(X_i;\theta)$，MLE 满足 $\psi(\hat\theta_n) = 0$。在 $\theta_0$ 处展开：

$$
0 = \psi(\theta_0) + \psi'(\tilde\theta)(\hat\theta_n - \theta_0)
\;\Rightarrow\;
\sqrt n(\hat\theta_n - \theta_0) = \big[-\psi'(\tilde\theta)\big]^{-1}\sqrt n\,\psi(\theta_0)
$$

三个部件：① $\sqrt n\,\psi(\theta_0) \xrightarrow{d} N(0, I(\theta_0))$——得分是 i.i.d. 零均值（正则条件：$E\partial\ln f = 0$）方差 $I$ 的和，**CLT**；② $-\psi'(\tilde\theta) \xrightarrow{P} I(\theta_0)$——二阶导的 LLN + 相合性把 $\tilde\theta$ 钉在 $\theta_0$ 邻域（一致性论证【骨架】）；③ Slutsky 合成 $I^{-1}N(0, I) = N(0, I^{-1})$。$\blacksquare$

**结构读法（记这个不记条件清单）**：**"估计误差 = 曲率之逆 × 得分噪声"**——分子是随机性（CLT 管）、分母是可辨性（信息 = 对数似然峰的曲率，统计 II）；峰越尖（$I$ 大）方差越小。多维版同构（$I^{-1}$ 为矩阵逆）。

**渐近有效性**：极限方差恰为 Cramér–Rao 下界 $I^{-1}$（统计 II）——MLE 在正则模型中渐近不可改进（严格表述需 Hájek–Le Cam 卷积定理堵住"超有效"漏洞——Hodges 反例：可在孤立点超越 C–R 但代价是邻域性能崩坏；局部渐近极小极大意义下 MLE 最优【引用】）。

**失效清单（工程同样重要）**：真值在边界（方差非负约束）→ 极限变截断正态；参数维数随 $n$ 增长 → 一切失效（高维统计另立门户，hdp 线接管）；模型误设 → $\hat\theta$ 收敛到 KL 最近点（"伪真值"），方差变三明治公式 $I^{-1}JI^{-1}$（稳健标准误的出处【引用 White】——计量经济学天天在用）。

## 3. 练习与要点

**例 1（信息阵亲算）** 正态 $N(\mu, \sigma^2)$ 双参数：$I = \mathrm{diag}\big(\frac{1}{\sigma^2}, \frac{1}{2\sigma^4}\big)$（二阶导取期望）⇒ $\sqrt n(\hat\sigma^2 - \sigma^2) \xrightarrow{d} N(0, 2\sigma^4)$——与 as-01 例 1 对账吻合 ✓（两条独立路线同一答案，互为 verify）。

**例 2（Delta + MLE 流水线）** 泊松 $\hat\lambda = \bar X$，目标 $g(\lambda) = e^{-\lambda}$（零事件概率）：$\sqrt n(e^{-\bar X} - e^{-\lambda}) \xrightarrow{d} N(0,\ \lambda e^{-2\lambda})$（$I^{-1} = \lambda$ 进 Delta）——"任何参数函数的置信区间"标准作业。

**例 3（误设的体感）** 用正态模型拟合厚尾数据：$\hat\mu$ 仍相合（KL 最近的正态均值 = 真均值,对称时），但基于 $I^{-1}$ 的标准误**低估**真实波动——三明治公式修正。**"模型错了，点估计可能还行，置信区间先死"**——读实证研究时的验尸重点（呼应本科时序页伪回归的教训）。$\blacksquare$

---

*下一页：检验的渐近理论——似然比/Wald/得分三大检验的等价性、Wilks 定理，渐近统计三页收官。*
