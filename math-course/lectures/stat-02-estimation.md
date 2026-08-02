# 统计 II · 点估计：矩法、极大似然与 Cramér–Rao

> 用样本给未知参数一个"最佳猜测"。两条造估计量的路（矩法、极大似然）、三把评价的尺（无偏、有效、相合）、一条理论天花板（Cramér–Rao 下界）。MLE 一节是全统计与机器学习交汇最深的地方——**训练神经网络的那个损失函数，就是本页的负对数似然**。

## 1. 矩估计：最朴素的路

**原理**：用样本矩顶替总体矩，解方程。总体 $k$ 阶矩 $\mu_k(\theta) = E X^k$ 是参数的函数，令

$$
\mu_k(\hat\theta) = \frac1n\sum_i X_i^k \quad (k = 1, 2, \dots \text{直到够解出参数})
$$

依据：大数定律保证样本矩 $\to$ 总体矩（概率 V）。**例**：$X \sim U(a, b)$——由 $EX = \frac{a+b}{2}$、$DX = \frac{(b-a)^2}{12}$ 解出 $\hat a = \bar X - \sqrt{3}\,\hat\sigma,\ \hat b = \bar X + \sqrt{3}\,\hat\sigma$。优点：万能、不需要知道分布全貌；缺点：不唯一、一般不最优——它是"能用"，MLE 才是"讲究"。

## 2. 极大似然估计（MLE，本页主菜）

**原理**：**让已发生的数据在你的模型下概率最大**。似然函数（把联合密度看成 $\theta$ 的函数）：

$$
L(\theta) = \prod_{i=1}^{n} f(x_i;\, \theta), \qquad \hat\theta_{\mathrm{MLE}} = \arg\max_\theta L(\theta) = \arg\max_\theta \underbrace{\sum_i \ln f(x_i; \theta)}_{\text{对数似然 } \ell(\theta)}
$$

**标准流程**：写 $L$ → 取对数 → 求导置零（似然方程）→ 验证是最大值。

**三个必会例子**（覆盖三种情形）：

- **正态 $N(\mu, \sigma^2)$**：$\ell = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2}\sum(x_i - \mu)^2$，解得 $\hat\mu = \bar X,\ \hat\sigma^2 = \frac1n\sum(X_i - \bar X)^2$（注意是 $\frac1n$——**MLE 可以有偏**，与 $S^2$ 的 $\frac{1}{n-1}$ 对照）；
- **泊松 $P(\lambda)$**：$\hat\lambda = \bar X$（求导一步）；
- **均匀 $U(0, \theta)$**：$L = \theta^{-n} \cdot I\{\theta \geq \max x_i\}$，对 $\theta$ **单调递减** ⇒ $\hat\theta = \max_i X_i$——**边界解，求导法失效**，必须回到"似然最大"的定义本身（考试最爱的陷阱）。

**不变性**：$\hat\theta$ 是 $\theta$ 的 MLE ⇒ $g(\hat\theta)$ 是 $g(\theta)$ 的 MLE（换参数免重算）。

🔗 **AI 衔接（本站最重要的一条线）**：最小化交叉熵 = 最大化对数似然（ai 课 07 讲 LLM 的训练目标 $-\sum\log P(w_t\mid w_{<t})$ 就是 $-\ell$）；最小二乘 = 高斯噪声假设下的 MLE（正态例子里 $\hat\mu$ 的推导已经证明了）；MAP = MLE + 先验 = 正则化（概率 I、ai 课 03 讲拉普拉斯平滑）。**"机器学习训练"在统计语言里就是大规模 MLE。**

## 3. 评价估计量：三把尺

**1. 无偏性**：$E\hat\theta = \theta$（瞄得正）。$\bar X$ 对 $\mu$ 无偏；$S^2$ 对 $\sigma^2$ 无偏而 $\hat\sigma^2_{\mathrm{MLE}}$ 偏小（差因子 $\frac{n-1}{n}$，大样本消失——"渐近无偏"）。

**2. 有效性**：同为无偏，方差小者优（瞄得正还要抖得少）。

**3. 相合性**：$\hat\theta_n \xrightarrow{P} \theta$（样本无限多时收敛到真值——底线要求，矩法与 MLE 在正则条件下都满足；依据是大数定律）。

## 4. Cramér–Rao 下界：无偏估计的天花板

**Fisher 信息**（单个样本携带的关于 $\theta$ 的信息量）：

$$
I(\theta) = E\left[\Big(\frac{\partial \ln f(X;\theta)}{\partial\theta}\Big)^2\right] = -E\left[\frac{\partial^2 \ln f(X;\theta)}{\partial\theta^2}\right]
$$

（第二个等号在正则条件下成立——信息 = 对数似然的期望曲率：**似然峰越尖，参数越好估**。）

**定理（Cramér–Rao）** 任何无偏估计 $\hat\theta$ 满足

$$
D(\hat\theta) \geq \frac{1}{n\, I(\theta)}
$$

达到下界者称**有效估计**。*例*：正态均值——$\ln f$ 对 $\mu$ 二阶导为 $-\frac{1}{\sigma^2}$，$I = \frac{1}{\sigma^2}$，下界 $\frac{\sigma^2}{n}$，而 $D\bar X = \frac{\sigma^2}{n}$ **恰好达界**——$\bar X$ 是 $\mu$ 的有效估计，"不可能有更好的无偏估计"。

**MLE 的渐近皇冠**（正则条件下，陈述级）：$\sqrt{n}(\hat\theta_{\mathrm{MLE}} - \theta) \xrightarrow{d} N\big(0, I(\theta)^{-1}\big)$——MLE 渐近无偏、渐近正态、**渐近达到 C–R 下界**（渐近有效）。这就是"讲究的人用 MLE"的理论判决书；渐近方差还顺手给出置信区间（统计 III 的大样本区间由此来）。

🔗 Fisher 信息在深度学习中的回声：自然梯度、K-FAC 二阶优化、持续学习的 EWC 正则——都在用 $I(\theta)$ 度量"参数空间哪个方向敏感"。

## 5. 典型例题

**例 1（矩法 vs MLE 同题对照）** $f(x;\theta) = \theta x^{\theta-1},\ 0 < x < 1$。
*矩法*：$EX = \frac{\theta}{\theta+1} = \bar X \Rightarrow \hat\theta_M = \frac{\bar X}{1 - \bar X}$。
*MLE*：$\ell = n\ln\theta + (\theta - 1)\sum\ln x_i$，$\ell' = \frac{n}{\theta} + \sum\ln x_i = 0 \Rightarrow \hat\theta_{\mathrm{MLE}} = -\frac{n}{\sum \ln X_i}$。两者不同——同一参数不同方法不同估计量，评价用第 3 节的尺。

**例 2（无偏修正）** $U(0,\theta)$ 的 MLE $\hat\theta = X_{(n)} = \max X_i$：$E X_{(n)} = \frac{n}{n+1}\theta$（有偏偏小——最大值永远够不到 $\theta$），修正 $\tilde\theta = \frac{n+1}{n}X_{(n)}$ 无偏。

**例 3（Fisher 信息计算）** 泊松 $P(\lambda)$：$\ln f = x\ln\lambda - \lambda - \ln x!$，二阶导 $-\frac{x}{\lambda^2}$，$I = \frac{E X}{\lambda^2} = \frac{1}{\lambda}$。C–R 下界 $\frac{\lambda}{n}$；而 $D\bar X = \frac{\lambda}{n}$ 达界——$\bar X$ 又一次称王。$\blacksquare$

---

*下一页：从"一个点"升级为"一个区间"——置信区间，以及它最容易被误读的那句话。*
