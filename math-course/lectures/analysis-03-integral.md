# 数分 III · 一元积分学

> 两个出身完全不同的概念——求原函数（微分的逆）与求面积（分割求和取极限）——被微积分基本定理焊在一起，这是整门课最漂亮的会师。本页四块：不定积分技巧、定积分理论（可积性）、基本定理、反常积分。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="riemann-learning-title">

<h2 id="riemann-learning-title">学习层：同一张分割表，怎样识别可积与不可积？</h2>

### 1. 先预测：上和、下和与取点会不会达成共识？

把区间固定为 $[0,1]$，先不看实验输出。对下面三个判断各写下一个答案：

1. 对连续函数 $f(x)=x^2$，均匀分割的上和与下和之差是否会随网格变细趋于 $0$？任意合法取点的 tagged Riemann 和是否被夹在两者之间？
2. Thomae 型函数 $t(x)=1/q$（$x=p/q$ 为既约有理数，$t(x)=0$ 对无理数）处处在有理点不连续；它的下和恒为 $0$，上和会不会也趋于 $0$？
3. Dirichlet 型函数 $d=\mathbf 1_{\mathbb Q}$ 在每个小区间都同时遇到有理数和无理数；若所有 tag 取有理数与所有 tag 取无理数，两列 tagged sums 会不会趋向同一个数？

预测的对象不是“图像像不像”：上、下和检验的是一个分割上的振幅，tagged sum 检验的是取点稳定性；只有把网格范数送到 $0$，才有资格谈 Riemann 积分。

### 2. 最小模型：三本账先分开

对分割 $P:0=x_0<\cdots<x_n=1$，记 $\Delta x_i=x_i-x_{i-1}$、$m_i=\inf_{I_i}f$、$M_i=\sup_{I_i}f$。三本有限账是

$$
L(f,P)=\sum_i m_i\Delta x_i,\qquad
U(f,P)=\sum_i M_i\Delta x_i,\qquad
R(f,P,\xi)=\sum_i f(\xi_i)\Delta x_i.
$$

只要 $f$ 有界且 $\xi_i\in I_i$，就有 $L(f,P)\le R(f,P,\xi)\le U(f,P)$。连续函数的统一连续性给出

$$
U(f,P)-L(f,P)\le (b-a)\,\omega_f(\|P\|)\longrightarrow0,
$$

所以连续函数的所有 tagged sums 都收敛到同一个值。这个估计把“矩形越来越窄”的图像直觉翻译成了定理。

四个样本分别暴露四种边界：

| 样本 | 上/下和的有限诊断 | tagged sum 的读法 | 定理级结论 |
|---|---|---|---|
| $x^2$ | $U_n-L_n=1/n$（均匀 $n$ 分割） | 任意 tag 都被同一夹逼 | Riemann 可积，积分 $1/3$ |
| 阶梯 $1_{x<1/2}+2_{x\ge1/2}$ | 只有含跳点的格子贡献振幅，差距随网格消失 | tag 取法的差异被一个小格子吸收 | 有界且只有一个间断点，故可积 |
| Thomae 型 $t$ | $L_n=0$；上和由每格最小分母控制，并在网格范数趋零时趋 $0$ | 有理 tag 的值由分母变小，无理 tag 值为 $0$ | 有界，间断点为可数集；可积且积分 $0$ |
| Dirichlet 型 $d$ | 每个非退化格子 $m_i=0,M_i=1$，故 $L=0,U=1$ | 全取有理 tag 得 $1$，全取无理 tag 得 $0$ | 上下和永不合拢，不可积 |

### 3. 动手：把“有限证据”与“无限定理”分栏

实验揭示后可切换四个样本、均匀分割数 $n$ 和 tag 规则。矩形图显示当前分割与 tagged sum，表格同时列出 $L,U,R,U-L$。Thomae 型函数的上和总体趋向 $0$，但相邻的均匀 $n$ 分割并不互为细分，读数可以小幅回升；脚本只计算有限分母/有限分割下的可复核诊断。Dirichlet 型函数则用两种 tag 直接展示不稳定。

<div class="learning-lab" data-learning-lab="riemann-integrability" markdown="1">

**无 JavaScript 时的静态读法：**对 $f(x)=x^2$ 和均匀 $n$ 分割，

$$
L_n=\frac1n\sum_{i=0}^{n-1}\left(\frac{i}{n}\right)^2,
\quad U_n=\frac1n\sum_{i=1}^{n}\left(\frac{i}{n}\right)^2,
\quad U_n-L_n=\frac1n,
$$

因而 $L_n,U_n\to1/3$；中点和也趋于 $1/3$。对阶梯函数，除跳点所在格外各格振幅为 $0$，而跳点格的宽度趋于 $0$。Thomae 型函数在每个非退化格的下确界为 $0$，上确界由该格中最小的既约分母给出；沿真正的嵌套细分，上和单调下降并趋于 $0$。实验的均匀 $n$ 分割序列一般不嵌套，因此只应读作 $U_n\to0$，不能把每一步都画成下降箭头。这支持其积分为 $0$，但一张有限表本身不是证明。Dirichlet 型函数对任何分割都有 $L=0,U=1$，全有理 tag 的和为 $1$、全无理 tag 的和为 $0$，所以没有唯一的 Riemann 极限。

| 账本 | 连续 $x^2$ | 阶梯函数 | Thomae 型 | Dirichlet 型 |
|---|---:|---:|---:|---:|
| 下和 $L$ | $\nearrow1/3$ | $\to3/2$ | $0$ | $0$ |
| 上和 $U$ | $\searrow1/3$ | $\to3/2$ | $\to0$（非嵌套均匀分割可局部回升） | $1$ |
| tagged 和 | 所有 tag 同极限 | 细分后稳定 | 有理/无理 tag 都趋 $0$ | 有理 $1$、无理 $0$ |

</div>

### 4. 定理假设与失败边界

- Darboux 判据讨论的是**有界函数在紧区间上的有限分割**：$f$ Riemann 可积当且仅当对任意 $\varepsilon>0$ 存在 $P$ 使 $U(f,P)-L(f,P)<\varepsilon$。无界函数不能直接套用这条有界区间判据；反常积分要另作极限。
- “有限个间断点可积”与“间断点为零测集”都带有有界性语境。Thomae 型函数虽然在每个有理点不连续，但其间断点集可数、测度为零；Dirichlet 型函数的有理与无理点都稠密，使每个格子的振幅保持 $1$。
- 有限分割只给诊断，不给 $\|P\|\to0$ 的结论；一张看起来已经合拢的表不能证明可积。反过来，某个粗分割上下和差距大，也不能推出不可积。
- tagged sum 的 tag 必须落在对应子区间；若函数不是有界 Riemann 可积，改换 tag 可能改变极限，甚至使极限不存在。把一次数值求积结果当作积分定义，是把有限数值证据越权成了定理。

</section>

## 1. 不定积分

**定义** $F' = f$ 则称 $F$ 为 $f$ 的原函数，$\int f\,dx = F(x) + C$。连续函数必有原函数（由基本定理保证）；含第一类间断点的函数无原函数（导函数只能有第二类间断——Darboux 定理：导函数具介值性）。

**基本积分表**（默写级）：幂、指、对、三角、$\int \frac{dx}{1+x^2} = \arctan x$，$\int \frac{dx}{\sqrt{1-x^2}} = \arcsin x$，$\int \sec x\,dx = \ln|\sec x + \tan x|$，$\int \frac{dx}{x^2 - a^2} = \frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right|$。

**三大技巧**：

1. **第一换元（凑微分）**：$\int f(\varphi(x))\varphi'(x)dx = \int f(u)du$——识别"谁的导数在旁边"；
2. **第二换元**：根式代换（$\sqrt{a^2 - x^2} \to x = a\sin t$；$\sqrt{a^2 + x^2} \to x = a\tan t$；$\sqrt{x^2 - a^2} \to x = a\sec t$）、万能代换 $t = \tan\frac x2$（三角有理式的最后手段）；
3. **分部积分** $\int u\,dv = uv - \int v\,du$：选 $u$ 的优先级"反对幂指三"（反三角/对数当 $u$，指数/三角进 $dv$）；循环型（$e^x\sin x$）两次分部解方程。

**有理函数积分**：多项式除法降次 → 部分分式分解（真分式按 $\frac{A}{(x-a)^k}$ 与 $\frac{Bx+C}{(x^2+px+q)^k}$ 拆）→ 逐项积分。**理论意义：有理函数的原函数必是初等函数**；而 $\int e^{-x^2}dx,\ \int \frac{\sin x}{x}dx$ 等不是初等函数——"积不出来"是定理不是无能。

## 2. 定积分：理论

<figure class="plot" markdown="1">
![黎曼和逼近曲线下面积](assets/img/analysis-03-riemann-sum.svg)
<figcaption><span class="fig-id">图 3.1</span>定积分是黎曼和的极限：矩形越细，其面积和越逼近曲线下的真实面积 \(\int_a^b f\,dx\)。</figcaption>
</figure>

**定义（Riemann 积分）** 分割 $a = x_0 < \cdots < x_n = b$，任取 $\xi_i \in [x_{i-1}, x_i]$，若 Riemann 和 $\sum f(\xi_i)\Delta x_i$ 在 $\|\Delta\| = \max \Delta x_i \to 0$ 时极限存在且与分割、取点无关，记为 $\int_a^b f\,dx$。

**可积性理论（Darboux 刻画）**：上和 $S = \sum M_i \Delta x_i$、下和 $s = \sum m_i \Delta x_i$。

$$
f \text{ 可积} \iff \lim_{\|\Delta\|\to 0}(S - s) = \sum \omega_i \Delta x_i \to 0 \quad (\omega_i = M_i - m_i \text{ 为振幅})
$$

**可积函数类**：连续函数；只有有限个间断点的有界函数；单调函数。**不可积代表**：Dirichlet 函数（处处振幅为 1）。🔗 实变页的 Lebesgue 准则给出终极刻画：可积 $\iff$ 有界且间断点集为零测集。

**性质**：线性、区间可加、保序、绝对值不等式 $\left|\int f\right| \leq \int |f|$、**积分第一中值定理**（$f$ 连续：$\int_a^b f g\,dx = f(\xi)\int_a^b g\,dx$，$g$ 不变号）。

## 3. 微积分基本定理

**定理（变上限积分）** $f \in C[a,b]$，则 $\Phi(x) = \int_a^x f(t)\,dt$ 可导且 $\Phi'(x) = f(x)$。
*证明关键步*：$\dfrac{\Phi(x+h) - \Phi(x)}{h} = \dfrac1h\int_x^{x+h} f(t)\,dt = f(\xi_h)$（积分中值定理），$h \to 0$ 时 $\xi_h \to x$，连续性收尾。——**连续函数的原函数被明确造了出来**。

**定理（Newton–Leibniz）** $f \in C[a,b]$，$F$ 是其任一原函数：

$$
\int_a^b f(x)\,dx = F(b) - F(a)
$$

*思路*：$F$ 与 $\Phi$ 差常数，代端点。**求导链式扩展**（考试高频）：$\dfrac{d}{dx}\int_{u(x)}^{v(x)} f(t)\,dt = f(v)v' - f(u)u'$。

**定积分技巧补充**：换元要同步换限；对称性（奇函数对称区间为零）；$\int_0^{\pi/2} f(\sin x)dx = \int_0^{\pi/2} f(\cos x)dx$ 类的区间再现代换 $x \to a+b-x$；Wallis 公式 $\int_0^{\pi/2}\sin^n x\,dx$ 递推。

## 4. 反常积分

两类：**无穷区间** $\int_a^{+\infty}$ 与**瑕积分**（被积函数在瑕点无界），都定义为常义积分的极限。

**判敛工具箱**（以 $\int_a^{+\infty} f\,dx$，$f \geq 0$ 为例）：

- **标尺**：$\int_1^{+\infty} \frac{dx}{x^p}$ 收敛 $\iff p > 1$；瑕积分 $\int_0^1 \frac{dx}{x^p}$ 收敛 $\iff p < 1$（**两个 $p$ 判据方向相反**，混淆高发区）；
- **比较判别法**及极限形式（与标尺比阶）；
- **绝对收敛 ⇒ 收敛**；条件收敛的代表 $\int_1^{+\infty}\frac{\sin x}{x}dx$（收敛但不绝对收敛）；
- **Dirichlet 判别法**：$\int_a^A f$ 一致有界 + $g$ 单调趋 0 ⇒ $\int fg$ 收敛（$\frac{\sin x}{x}$ 即由此）；**Abel 判别法**：$\int f$ 收敛 + $g$ 单调有界。

**名积分**：$\int_{-\infty}^{+\infty} e^{-x^2}dx = \sqrt{\pi}$（🔗 高斯分布归一化，概率页与 ai 课处处要用；证明用二重积分极坐标，数分 VI）。

## 5. 定积分应用公式表

| 量 | 公式 |
|---|---|
| 平面面积 | $\int_a^b \lvert f - g\rvert\,dx$；极坐标 $\frac12\int_\alpha^\beta r^2(\theta)\,d\theta$ |
| 弧长 | $\int_a^b \sqrt{1 + f'^2}\,dx$；参数式 $\int\sqrt{x'^2_t + y'^2_t}\,dt$ |
| 旋转体体积 | 绕 $x$ 轴 $\pi\int f^2 dx$；柱壳法绕 $y$ 轴 $2\pi\int x f\,dx$ |
| 旋转曲面侧面积 | $2\pi \int f\sqrt{1 + f'^2}\,dx$ |

## 6. 典型例题

**例 1（分部循环）** $I = \int e^x \cos x\,dx$：两次分部得 $I = e^x(\sin x + \cos x) - I$，故 $I = \frac{e^x(\sin x + \cos x)}{2} + C$。

**例 2（区间再现）** 求 $\int_0^\pi \dfrac{x\sin x}{1 + \cos^2 x}dx$。
*解*：代换 $x \to \pi - x$ 得 $I = \int_0^\pi \frac{(\pi - x)\sin x}{1+\cos^2 x}dx$，两式相加：$2I = \pi\int_0^\pi \frac{\sin x}{1+\cos^2 x}dx = \pi\big[-\arctan(\cos x)\big]_0^\pi = \frac{\pi^2}{2}$，$I = \frac{\pi^2}{4}$。

**例 3（判敛）** 讨论 $\int_0^{+\infty} \dfrac{dx}{x^p(1+x)}$ 的敛散。
*解*：拆成 $\int_0^1 + \int_1^\infty$。$0$ 端被积 $\sim \frac{1}{x^p}$，要 $p < 1$；$\infty$ 端 $\sim \frac{1}{x^{p+1}}$，要 $p + 1 > 1$ 即 $p > 0$。故 $0 < p < 1$ 时收敛。**"两端分开、各与标尺比阶"是反常积分判敛的标准流程。**$\blacksquare$

---

*下一页：把"无限求和"严格化——级数。一致收敛是全页的分水岭概念。*
