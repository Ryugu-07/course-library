# 高维概率 I · 亚高斯分布与集中不等式

> **对标**：Vershynin *HDP* §2.1–2.8 ｜ **前置**：mt-01/02/04、本科概率 V
> 高维概率的第一性原理：**独立随机量的和以指数速率集中于均值**。本页把本科的 Chebyshev（多项式尾）升级为 Chernoff 系（指数尾），并引入组织这一切的现代语言——亚高斯/亚指数范数。这是理解"为什么高维统计和机器学习在有限样本下就能工作"的数学地基。

## 1. Chernoff 方法：一个模板统治所有

**模板**【证明】：对任意 $\theta > 0$，

$$
P(X \geq t) = P(e^{\theta X} \geq e^{\theta t}) \leq e^{-\theta t}\, E e^{\theta X} \quad(\text{Markov}), \qquad \text{再对 } \theta \text{ 优化}
$$

独立和的矩母函数乘积分解 $Ee^{\theta S_n} = \prod Ee^{\theta X_i}$——**指数把"独立"变成"可乘"，Markov 把"可乘"变成"指数尾"**。mt-04 Azuma 的三步在此提纯为通用模板；一切集中不等式都是"给 $Ee^{\theta X}$ 找上界"的手艺差异。

**定理（Hoeffding）** $X_i$ 独立、$X_i \in [a_i, b_i]$：

$$
P\Big(\Big|\sum (X_i - EX_i)\Big| \geq t\Big) \leq 2\exp\Big(-\frac{2t^2}{\sum (b_i - a_i)^2}\Big)
$$

**【骨架】** Hoeffding 引理（有界零均值 ⇒ $Ee^{\theta X} \leq e^{\theta^2(b-a)^2/8}$：对 $\ln Ee^{\theta X}$ 二阶 Taylor + 方差上界 $\frac{(b-a)^2}{4}$）代入模板。$\blacksquare$（ai 课 01 讲泛化界里那个 Hoeffding 的正身。）

**定理（Bernstein）** 独立零均值、$|X_i| \leq M$、$\sigma^2 = \sum EX_i^2$：

$$
P\Big(\Big|\sum X_i\Big| \geq t\Big) \leq 2\exp\Big(-\frac{t^2/2}{\sigma^2 + Mt/3}\Big)
$$

**读法（两段尾巴）**：$t$ 小（$t \lesssim \sigma^2/M$）时是高斯尾 $e^{-t^2/2\sigma^2}$——**用真实方差**而非最坏区间宽（方差小时比 Hoeffding 强得多）；$t$ 大时退化为指数尾 $e^{-3t/2M}$——单个有界变量的极限速度。"**小偏差像高斯、大偏差像指数**"是本课程反复出现的地貌。

## 2. 亚高斯分布：组织语言

<figure class="plot" markdown="1">
![尾概率三档衰减](assets/img/hdp-01-subgaussian-tail.svg)
<figcaption><span class="fig-id">图 1.1</span>尾概率衰减的三档：亚高斯 \(2e^{-t^2/2}\)（最快）、亚指数、重尾——集中不等式的整个理论就是给随机量归这三类。</figcaption>
</figure>

**定义** $X$ **亚高斯**：尾部 $P(|X| \geq t) \leq 2e^{-t^2/K^2}$。等价刻画（互推常数因子级等价,【骨架】——矩与尾部的 Fubini 换算 + Stirling）：矩增长 $\|X\|_{L^p} \leq CK\sqrt{p}$；矩母函数 $Ee^{X^2/K'^2} \leq 2$。由最后者定义**亚高斯范数** $\|X\|_{\psi_2}$（Orlicz 范数，是真范数）。

成员：有界（Hoeffding 引理）、高斯、Rademacher。**性质**：独立和 $\|\sum X_i\|_{\psi_2}^2 \leq C\sum\|X_i\|_{\psi_2}^2$（"方差式相加"——独立亚高斯的和仍亚高斯，Hoeffding 型不等式的抽象重述）。

**亚指数**：尾 $e^{-t/K}$ 级（$\|\cdot\|_{\psi_1}$）。**关键事实**：亚高斯的平方是亚指数（$\|X^2\|_{\psi_1} = \|X\|_{\psi_2}^2$，代定义即得）——**范数、二次型这类"平方量"天然生活在亚指数世界**，这就是 Bernstein 型双段尾巴无处不在的原因。

**定理（Bernstein，亚指数版）【引用】** 独立零均值亚指数和：$P(|\sum X_i| \geq t) \leq 2\exp\big(-c\min\big(\frac{t^2}{\sum K_i^2}, \frac{t}{\max K_i}\big)\big)$。

## 3. 第一个高维定理：范数集中

**定理** $X \in \mathbb{R}^n$ 各分量独立、零均值、单位方差、$\|X_i\|_{\psi_2} \leq K$：

$$
\big\|\, \|X\|_2 - \sqrt{n}\, \big\|_{\psi_2} \leq CK^2
$$

即 $\|X\|_2 = \sqrt n \pm O(1)$，且偏差呈亚高斯尾。
**【骨架】** $\|X\|_2^2 - n = \sum(X_i^2 - 1)$ 是独立零均值亚指数和 ⇒ Bernstein 给 $\|X\|_2^2$ 集中于 $n$（宽度 $\sqrt n$ 级）；开方的 Lipschitz 处理（$|\sqrt a - \sqrt b| \leq |a-b|/\sqrt b$）把它翻译回 $\|X\|_2$ 集中于 $\sqrt n$（宽度 $O(1)$）。$\blacksquare$

**读法（高维几何的第一堂震撼课）**：$n$ 维标准高斯向量**几乎全部生活在半径 $\sqrt n$、厚度 $O(1)$ 的薄球壳上**——"钟形曲线"的直觉在高维完全失灵（原点附近密度最高却几乎没有质量：密度×体积的博弈，体积赢了）。推论级事实：两个独立高维高斯向量几乎正交（$\frac{\langle X,Y\rangle}{\|X\|\|Y\|} \approx O(n^{-1/2})$）。🔗 这些反直觉正是 ai 课"高维针尖流形"、embedding 空间"随机向量近正交所以能塞下海量概念"的定量出处。

## 4. 练习与要点

**例 1（模板亲算）** 标准正态：$Ee^{\theta X} = e^{\theta^2/2}$，模板优化 $\theta = t$ 给 $P(X \geq t) \leq e^{-t^2/2}$——与真尾部只差多项式因子：**Chernoff 在指数尺度上是紧的**（大偏差理论的起点，it2-03 再会）。

**例 2（Hoeffding 的样本量语言）** i.i.d. 有界 $[0,1]$，要 $P(|\bar X - \mu| > \varepsilon) \leq \delta$：$n \geq \frac{\ln(2/\delta)}{2\varepsilon^2}$——**精度的平方反比 × 置信度的对数**：$\delta$ 从 5% 压到 0.1% 只多付 $\ln$ 倍样本。"对数便宜、平方贵"是一切样本量设计的口诀（slt 线 PAC 界的原型）。

**例 3（方差感知的价值）** 稀有事件计数（$p = 0.01$，$n$ 次试验）：Hoeffding 宽度 $\sim\sqrt n$ 完全无视稀有性；Bernstein 用 $\sigma^2 = np(1-p) \approx 0.01n$ 给出 $\sim\sqrt{0.01 n}$——**紧 10 倍**。凡是"方差远小于范围"的场景（稀疏数据、罕见错误率）永远选 Bernstein。$\blacksquare$

---

*下一页：从单个和到随机向量——协方差估计需要多少样本、Johnson–Lindenstrauss 降维引理（全证）。*
