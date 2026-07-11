# 数分 III · 一元积分学

> 两个出身完全不同的概念——求原函数（微分的逆）与求面积（分割求和取极限）——被微积分基本定理焊在一起，这是整门课最漂亮的会师。本页四块：不定积分技巧、定积分理论（可积性）、基本定理、反常积分。

## 1. 不定积分

**定义** $F' = f$ 则称 $F$ 为 $f$ 的原函数，$\int f\,dx = F(x) + C$。连续函数必有原函数（由基本定理保证）；含第一类间断点的函数无原函数（导函数只能有第二类间断——Darboux 定理：导函数具介值性）。

**基本积分表**（默写级）：幂、指、对、三角、$\int \frac{dx}{1+x^2} = \arctan x$，$\int \frac{dx}{\sqrt{1-x^2}} = \arcsin x$，$\int \sec x\,dx = \ln|\sec x + \tan x|$，$\int \frac{dx}{x^2 - a^2} = \frac{1}{2a}\ln\left|\frac{x-a}{x+a}\right|$。

**三大技巧**：

1. **第一换元（凑微分）**：$\int f(\varphi(x))\varphi'(x)dx = \int f(u)du$——识别"谁的导数在旁边"；
2. **第二换元**：根式代换（$\sqrt{a^2 - x^2} \to x = a\sin t$；$\sqrt{a^2 + x^2} \to x = a\tan t$；$\sqrt{x^2 - a^2} \to x = a\sec t$）、万能代换 $t = \tan\frac x2$（三角有理式的最后手段）；
3. **分部积分** $\int u\,dv = uv - \int v\,du$：选 $u$ 的优先级"反对幂指三"（反三角/对数当 $u$，指数/三角进 $dv$）；循环型（$e^x\sin x$）两次分部解方程。

**有理函数积分**：多项式除法降次 → 部分分式分解（真分式按 $\frac{A}{(x-a)^k}$ 与 $\frac{Bx+C}{(x^2+px+q)^k}$ 拆）→ 逐项积分。**理论意义：有理函数的原函数必是初等函数**；而 $\int e^{-x^2}dx,\ \int \frac{\sin x}{x}dx$ 等不是初等函数——"积不出来"是定理不是无能。

## 2. 定积分：理论

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
| 平面面积 | $\int_a^b |f - g|\,dx$；极坐标 $\frac12\int_\alpha^\beta r^2(\theta)\,d\theta$ |
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
