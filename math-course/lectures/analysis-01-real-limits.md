# 数分 I · 实数完备性与极限

> 整座分析大厦立在一块地基上：**实数没有"洞"**（完备性）。本页先立地基（六大等价定理），再建两层楼：数列极限与函数极限，收尾于连续函数的四大定理。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="analysis01-learning-title">

<h2 id="analysis01-learning-title">学习层：给定 \(\varepsilon\)，你真的能找到 \(\delta\) 吗？</h2>

### 1. 把“靠近”改写成可审计的承诺

先看一个没有技巧遮挡的模型：

$$
f(x)=3x+1,\qquad x_0=2,\qquad L=7.
$$

要证明 \(\lim_{x\to2}f(x)=7\)，不是把 \(x\) 取成几组小数然后观察输出，而是要对**每个** \(\varepsilon>0\) 给出一个只依赖 \(\varepsilon\) 的 \(\delta>0\)，使

$$
0<|x-2|<\delta\Longrightarrow |(3x+1)-7|=3|x-2|<\varepsilon.
$$

因此 \(\delta=\varepsilon/3\) 是一条可证明的规则；\(\delta\) 不是某个试探点的距离，也不是允许随 \(x\) 重新挑选的数。量词顺序

$$
\forall\varepsilon>0\ \exists\delta>0\ \forall x\quad(\cdots)
$$

是定义的骨架。把它换成“对每个 \(x\) 都能找到一个 \(\delta\)”会把挑战者和应答者的角色颠倒，命题也随之变弱。

### 2. 先预测：规则、洞口与单侧极限

打开实验台前，先写下三个预测：

1. 对 \(f(x)=3x+1\)，四条候选规则 \(\delta=\varepsilon/3,\ \varepsilon,\ \sqrt{\varepsilon},\ \min(1,\varepsilon/3)\) 中，哪些规则能对所有 \(\varepsilon>0\) 作为证明证书？
2. 检查 \(0<|x-x_0|<\delta\) 时，为什么必须允许跳过 \(x=x_0\)？把点本身补上，是否会改变极限结论？
3. 对 \(f(x)=\operatorname{sgn}(x)\) 在 \(0\) 附近，左右两侧分别趋向什么；对 \(f(x)=1/x\)，有限的两侧极限是否还能存在？

提交后，实验把“候选规则的有限探针”与“定理级证书”分栏显示。探针能找到违规点，也能让正确规则变得直观；它永远不能把有限次检查升级成对所有实数 \(x\) 的证明。

### 3. 三笔账：候选 \(\delta\)、挖孔邻域、两侧一致性

对线性模型，误差恒等式给出精确账本 \(|f(x)-L|=3|x-x_0|\)。于是所有满足 \(\delta\le\varepsilon/3\) 的规则都通过定理检查；\(\delta=\varepsilon\) 在 \(\varepsilon=0.3\) 时允许误差接近 \(0.9\)，并非安全证书。

对 \(f(x)=x^2\) 在 \(x_0=1\)，

$$
|x^2-1|=|x-1||x+1|.
$$

若先限制 \(\delta\le1/2\)，则 \(|x+1|<5/2\)，取 \(\delta=\min(1/2,\varepsilon/3)\) 就是一个保守但完整的 \(\varepsilon\)-\(\delta\) 证明。这里的“先控制邻域，再控制函数因子”正是一般连续性证明的工作流。

反例则要拆成不同失败机制。\(\operatorname{sgn}(x)\) 的左极限为 \(-1\)、右极限为 \(1\)，所以两侧不能拼成同一个 \(L\)；\(1/x\) 的两侧还分别向 \(-\infty\)、\(+\infty\) 发散；\(\sin(1/x)\) 在 \(0\) 附近反复摆动，任意小的穿孔邻域都能找到输出相差很大的点。函数在 \(x_0\) 的取值本身不影响极限，但穿孔邻域内两侧的行为决定极限。

<div class="learning-lab" data-learning-lab="limit-quantifiers" markdown="1">

**JavaScript 失效时的静态 fallback：**默认取 \(f(x)=3x+1\)、\(x_0=2\)、\(L=7\)、\(\varepsilon=0.30\)，选择 \(\delta=\varepsilon/3=0.10\)。在 \(0<|x-2|<0.10\) 内有 \(|f(x)-7|=3|x-2|<0.30\)；有限探针只能复核这条不等式的若干点。反例账本如下：

| 模型 | 左侧读数 | 右侧读数 | 两侧极限 | 结论边界 |
|---|---:|---:|---|---|
| \(3x+1\) at \(2\) | \(7\) | \(7\) | 相同 | \(\delta=\varepsilon/3\) 是定理证书 |
| \(x^2\) at \(1\) | \(1\) | \(1\) | 相同 | 需先限制 \(|x-1|<1/2\) 再控因子 |
| \(\operatorname{sgn}(x)\) at \(0\) | \(-1\) | \(1\) | 不同 | 单侧存在不推出双侧存在 |
| \(1/x\) at \(0\) | \(-\infty\) | \(+\infty\) | 非有限 | 不存在有限极限 |

模型假设必须写在结论旁：线性规则使用精确的 Lipschitz 常数；平方规则使用局部邻域约束；反例的探针数值不是“不存在”的证明。真正的证明要给出任意 \(\varepsilon\) 下的统一 \(\delta\)，或构造两条趋向 \(x_0\) 而函数值极限不同的数列。

</div>

### 4. 定理级结论与失败边界

- **定理级**：\(\varepsilon\)-\(\delta\) 定义要求所有穿孔邻域点都满足误差界；若找到一个合法 \(x\) 违反它，候选 \(\delta\) 失败。对任意 \(\varepsilon\) 都能构造合格 \(\delta\)，才得到极限存在。
- **有限证据**：实验选取有限比例的 \(x\)，并把函数值截断到可画范围；“当前探针全绿”只说明这些点没有发现反例，不是量词 \(\forall x\) 的替代物。
- **Heine 方向**：要否定极限，找两条 \(x_n\to x_0\) 的路径并让 \(f(x_n)\) 趋向不同值足够；要证明极限，仍须控制所有合法路径，不能只画两条。
- **失败边界**：单侧极限相等才可拼成双侧极限；\(x_0\) 是否定义或取何值不影响穿孔极限，但把定义域误扩到没有函数值的点、或把一侧证书冒充两侧证书，都会越过定理假设。

</section>

## 1. 实数完备性：六大等价定理

**定义（上确界）** 非空集 $S \subset \mathbb{R}$ 的上确界 $\sup S$ 是最小的上界：1. $\forall x \in S,\ x \leq \sup S$；2. $\forall \varepsilon > 0,\ \exists x \in S,\ x > \sup S - \varepsilon$。下确界 $\inf S$ 对偶。

以下六条**两两等价**，共同刻画"实数轴无洞"（$\mathbb{Q}$ 上全部失效——这是背它们的最好方式：想想 $\{x \in \mathbb{Q}: x^2 < 2\}$ 如何逐条破坏它们）：

| 定理 | 陈述 | 典型用途 |
|---|---|---|
| **确界原理** | 非空有上界的集合必有上确界 | 定义 $e$、构造性证明的起点 |
| **单调有界定理** | 单调递增有上界的数列必收敛（$\to \sup$） | 递推数列收敛性 |
| **闭区间套定理** | $[a_{n+1},b_{n+1}] \subset [a_n,b_n]$ 且长度 $\to 0$，则交集为单点 | 二分法构造、存在性证明 |
| **聚点定理（B–W）** | 有界无穷点集必有聚点；即**有界数列必有收敛子列** | 紧性论证的核心引擎 |
| **Cauchy 收敛准则** | 数列收敛 $\iff$ $\forall\varepsilon\,\exists N:\ m,n>N \Rightarrow \lvert a_m - a_n\rvert < \varepsilon$ | **不知道极限值**也能判收敛 |
| **有限覆盖定理（H–B）** | 闭区间的任意开覆盖必有有限子覆盖 | "局部性质 → 整体性质"的桥 |

**证明环路思路**（复习时能画出这个环即算过关）：确界 ⇒ 单调有界（递增有上界数列收敛到其上确界，用确界的第 2 条验证 ε-N）⇒ 闭区间套（左端点递增有上界）⇒ 聚点（对有界数列所在区间反复二分，每次选含无穷多项的一半，区间套出聚点）⇒ Cauchy（Cauchy 列有界 → 有收敛子列 → Cauchy 性把全列拖向子列极限）⇒ 确界（对上界集合二分构造）。有限覆盖与闭区间套互推（反证：无有限子覆盖则二分出一列"坏区间"套向一点，该点的覆盖元即矛盾）。

🔗 **AI 衔接**：Cauchy 准则是"迭代算法收敛性"的原型语言；压缩映射原理（泛函页）与梯度下降的收敛证明都建在完备性上。

## 2. 数列极限

<figure class="plot" markdown="1">
![epsilon-N 极限定义的几何](assets/img/analysis-01-epsilon-limit.svg)
<figcaption><span class="fig-id">图 1.1</span>\(\epsilon\)-\(N\) 定义的几何：无论把误差带 \(L\pm\epsilon\) 收得多窄，总能找到门槛 \(N\)，其后所有项都落进带内。</figcaption>
</figure>

**定义（$\varepsilon$-$N$）** $\lim_{n\to\infty} a_n = A \iff \forall \varepsilon > 0,\ \exists N,\ \forall n > N:\ |a_n - A| < \varepsilon$。

**基本性质**：极限唯一；收敛必有界；**保号性**（$A > 0$ 则从某项起 $a_n > \frac{A}{2} > 0$）；保不等式；**夹逼定理**（$a_n \leq c_n \leq b_n$ 且两端同趋 $A$ ⇒ $c_n \to A$）；四则运算（分母极限非零）。

**子列**：$a_n \to A \iff$ 每个子列都 $\to A$ $\iff$ 奇偶子列同趋 $A$。逆否用法：找到两个极限不同的子列 ⇒ 发散（如 $(-1)^n$）。

**重要极限与技巧**：

$$
\lim_{n\to\infty}\Big(1 + \frac{1}{n}\Big)^n = e \quad (\text{单调有界定理的标准应用: 用二项式展开证递增有界});
\qquad \sqrt[n]{n} \to 1;\quad \frac{a^n}{n!} \to 0
$$

**定理（Stolz，$\tfrac{*}{\infty}$ 型）** $\{b_n\}$ 严格递增趋于 $+\infty$，若 $\lim \dfrac{a_{n+1} - a_n}{b_{n+1} - b_n} = L$（可为 $\pm\infty$），则 $\lim \dfrac{a_n}{b_n} = L$。——数列版洛必达，处理平均值型极限的首选（例：$a_n \to a \Rightarrow \frac{a_1 + \cdots + a_n}{n} \to a$，取 $b_n = n$ 秒杀）。

**上极限与下极限**：$\varlimsup a_n = \lim_{n\to\infty} \sup_{k \geq n} a_k$（最大的子列极限）。收敛 $\iff \varlimsup = \varliminf$ 有限。用途：不假设收敛时也能操作（级数根值判别法的严格形式用的就是它）。

## 3. 函数极限

**定义（$\varepsilon$-$\delta$）** $\lim_{x \to x_0} f(x) = A \iff \forall\varepsilon>0\ \exists\delta>0:\ 0 < |x - x_0| < \delta \Rightarrow |f(x) - A| < \varepsilon$。（注意挖掉 $x_0$ 本身；单侧极限、$x\to\infty$ 版本同构。）

**定理（Heine 归结原则）** $\lim_{x\to x_0} f(x) = A \iff$ 对**任何**以 $x_0$ 为极限的数列 $x_n \neq x_0$ 都有 $f(x_n) \to A$。——函数极限与数列极限的换乘站；证函数极限不存在的利器（找两条数列路径极限不同，如 $\sin\frac1x$ 在 $0$ 处）。

**两个重要极限**：

$$
\lim_{x\to 0}\frac{\sin x}{x} = 1 \ (\text{几何夹逼: } \sin x < x < \tan x), \qquad
\lim_{x\to 0}(1 + x)^{1/x} = e
$$

**无穷小的阶**：$f = o(g)$ 指 $f/g \to 0$；$f = O(g)$ 指 $f/g$ 有界；$f \sim g$ 指 $f/g \to 1$。**等价无穷小替换**（乘除可换、加减慎换）速查（$x \to 0$）：

$$
\sin x \sim x,\quad \tan x \sim x,\quad 1 - \cos x \sim \tfrac{x^2}{2},\quad \ln(1+x) \sim x,\quad e^x - 1 \sim x,\quad (1+x)^\alpha - 1 \sim \alpha x
$$

## 4. 连续函数

**定义** $f$ 在 $x_0$ 连续 $\iff \lim_{x\to x_0} f(x) = f(x_0)$。**间断点分类**：第一类（左右极限都存在：相等为可去、不等为跳跃）、第二类（至少一侧极限不存在，如振荡 $\sin\frac1x$、无穷 $\frac1x$）。

**闭区间上连续函数四大定理**（全部依赖完备性，开区间/不连续均有反例）：

**定理 1（有界性）** $f \in C[a,b]$ 必有界。*思路*：反证，取 $|f(x_n)| > n$，B–W 抽收敛子列 $x_{n_k} \to \xi$，连续性给出 $f(x_{n_k}) \to f(\xi)$ 有限，矛盾。

**定理 2（最值）** $f \in C[a,b]$ 必取到最大最小值。*思路*：设 $M = \sup f$（定理 1 + 确界原理），取 $f(x_n) \to M$，B–W 子列收敛到 $\xi$，连续性得 $f(\xi) = M$。

**定理 3（介值 / 零点存在）** $f(a)f(b) < 0 \Rightarrow \exists \xi \in (a,b),\ f(\xi) = 0$；一般地连续函数取遍两端点值之间的一切值。*思路*：二分法 + 闭区间套（每次选变号的一半），或对 $\{x: f(x) < 0\}$ 用确界。

**定理 4（Cantor 一致连续）** $f \in C[a,b] \Rightarrow f$ 在 $[a,b]$ **一致连续**（$\delta$ 只依赖 $\varepsilon$ 不依赖位置：$\forall\varepsilon\,\exists\delta:\ |x'-x''|<\delta \Rightarrow |f(x')-f(x'')|<\varepsilon$）。*思路*：反证 + B–W，或有限覆盖（局部连续的 $\delta$-邻域覆盖 $[a,b]$，取有限子覆盖统一 $\delta$——"局部到整体"的教科书示范）。

对比记忆：$f(x) = \frac1x$ 在 $(0,1)$ 连续但**不一致连续**（洞被挤压）；$\sqrt{x}$ 在 $[0,+\infty)$ 一致连续（导数无界≠不一致连续）。

## 5. 典型例题

**例 1（递推数列，单调有界法标准流程）** $a_1 = \sqrt{2},\ a_{n+1} = \sqrt{2 + a_n}$，证明收敛并求极限。
*解*：1.归纳证有界：$a_n < 2$（若 $a_n<2$ 则 $a_{n+1} = \sqrt{2+a_n} < \sqrt{4} = 2$）；2.证递增：$a_{n+1}^2 - a_n^2 = 2 + a_n - a_n^2 = (2-a_n)(1+a_n) > 0$；3.单调有界定理知收敛，设 $A$，对递推式取极限 $A = \sqrt{2+A}$，解得 $A = 2$（负根舍）。**流程"先证存在，再解方程"不可颠倒**——对发散数列解方程会得到假极限。

**例 2（Stolz）** 求 $\lim_{n\to\infty} \dfrac{1 + \frac12 + \cdots + \frac1n}{\ln n}$。
*解*：Stolz，$\dfrac{a_{n+1}-a_n}{b_{n+1}-b_n} = \dfrac{1/(n+1)}{\ln(1 + 1/n)} \to \dfrac{1/(n+1)}{1/n} \to 1$。

**例 3（Heine 判不存在）** 证明 $\lim_{x\to 0}\sin\frac1x$ 不存在：取 $x_n = \frac{1}{2n\pi} \to 0$ 与 $y_n = \frac{1}{2n\pi + \pi/2} \to 0$，则 $\sin\frac{1}{x_n} = 0$、$\sin\frac{1}{y_n} = 1$，两条路径极限不同。$\blacksquare$

---

*下一页：把"变化率"严格化——一元微分学，中值定理链是全页的主梁。*
