# 随机分析 III · Itô 公式与 SDE 理论

> **对标**：Øksendal §4–5 ｜ **前置**：sc-01/02、ode-01（本科）、泛函 I
> 两张本科欠条在本页兑付：**Itô 公式的证明**（"带 $(dB)^2 = dt$ 的 Taylor 展开"如何变成定理）与 **SDE 解的存在唯一性**（Picard 迭代在 $L^2$ 路径空间的重演）。

## 1. Itô 过程与 Itô 公式

**Itô 过程**：$X_t = X_0 + \int_0^t \mu_s\,ds + \int_0^t \sigma_s\,dB_s$（漂移 + Itô 积分；微分记号 $dX = \mu\,dt + \sigma\,dB$ 只是它的速记）。

**定理（Itô 公式）** $f \in C^{1,2}$（时间一阶、空间二阶连续可微）：

$$
df(t, X_t) = \Big(f_t + \mu f_x + \frac{1}{2}\sigma^2 f_{xx}\Big)dt + \sigma f_x\,dB_t
$$

**【证明骨架（结构完整，簿记略）】** 四步：
① **局部化**：停时截断使 $X, \mu, \sigma$ 有界（结论对停止过程证完后放开——研究生概率的标准开场白）；
② **Taylor 展开**：对分割 $\{t_j\}$，

$$
f(X_{t_{j+1}}) - f(X_{t_j}) = f_x\,\Delta X_j + \frac12 f_{xx}\,(\Delta X_j)^2 + R_j
$$

③ **逐项归位**：$\sum f_x\Delta X_j \to \int f_x\,dX$（Riemann 和收敛到 Itô 积分——sc-02 的构造在左端点采样，正好对上）；$(\Delta X_j)^2 = \sigma^2(\Delta B_j)^2 + \text{交叉与 } dt^2 \text{ 项}$，其中 $\sum\sigma^2(\Delta B_j)^2 \to \int\sigma^2\,dt$（**二次变差定理的加权版**——sc-01 §2 的 $L^2$ 论证带权重重跑），其余项按 $|\Delta B||\Delta t| \sim \Delta t^{3/2}$ 归零；
④ **余项控制**：$R_j = o((\Delta X_j)^2)$，由 $f_{xx}$ 的一致连续（紧区间）+ ③ 的二次变差有限压死。$\blacksquare$

**读法**：证明只做了一件事——**把"$(dB)^2 = dt$、其余高阶归零"的口诀逐项落实为极限定理**；二阶项存活的机理正是二次变差非零。多维版（$f(t, X^1,\dots,X^d)$，含协变差 $d\langle X^i, X^j\rangle$）同构【引用】。

## 2. SDE：强解的存在唯一性

**定理（Itô 存在唯一性）** SDE $\ dX = \mu(t, X)dt + \sigma(t, X)dB,\ X_0 = x_0$，若系数满足
（i）**Lipschitz**：$|\mu(t,x)-\mu(t,y)| + |\sigma(t,x)-\sigma(t,y)| \leq L|x-y|$；
（ii）线性增长：$|\mu| + |\sigma| \leq C(1 + |x|)$，
则存在唯一（不可区分意义）连续适应强解，且 $E\sup_{t\leq T}X_t^2 < \infty$。

**【证明骨架（Picard 在 $L^2$ 路径空间）】** 定义映射

$$
(\Phi X)_t = x_0 + \int_0^t\mu(s, X_s)ds + \int_0^t\sigma(s, X_s)dB_s
$$

在范数 $\|X\|^2 = E\sup_{t\leq T}|X_t|^2$ 的空间上：
① $\Phi$ 良定（线性增长 + 等距给平方可积）；
② **压缩估计**：$E\sup_{t\leq T}|(\Phi X - \Phi Y)_t|^2 \leq C_T\int_0^T E|X_s - Y_s|^2 ds$——漂移项用 Cauchy–Schwarz、扩散项用 **Doob $L^2$ 极大不等式 + Itô 等距**（mt-04 与 sc-02 各出一件兵器），Lipschitz 收口；
③ 迭代 $X^{(n+1)} = \Phi X^{(n)}$：②的积分形式给 $\|X^{(n+1)} - X^{(n)}\|^2 \leq \frac{(C_T T)^n}{n!}\|X^{(1)} - X^{(0)}\|^2$——**阶乘衰减**（比几何压缩更强），级数可和 ⇒ Cauchy 列，完备性给极限；BC-I（mt-01）升级为 a.s. 一致收敛；
④ 唯一性：两解之差代入②，**Grönwall 不等式**（$u(t) \leq C\int_0^t u\,ds \Rightarrow u \equiv 0$——ODE 理论的老朋友）判零。$\blacksquare$

**读法**：与 ode-01 Picard 定理**逐步对应**（映射—压缩—迭代—Grönwall），只是每步多穿一件概率装备（等距、Doob、BC）——"随机分析 = 经典分析 + 鞅论装备包"的全课程缩影。Lipschitz 失守的后果也同构：$\sigma(x) = |x|^\alpha,\ \alpha < \frac12$ 时唯一性可失（对照 ode-01 的 $\sqrt{|y|}$）；金融的 CIR 过程恰在临界 $\alpha = \frac12$ 上，另有专门论证（Yamada–Watanabe【引用】——强弱解与路径唯一性的一般理论同此引用）。

## 3. 两个立即收割

**几何布朗运动**（严格版）：$dS = \mu S dt + \sigma S dB$ 系数 Lipschitz ⇒ 唯一强解；对 $\ln S$ 用 Itô 公式（现在是定理了）得显式解 $S_t = S_0 e^{(\mu - \sigma^2/2)t + \sigma B_t}$——本科 sde-01 的计算获得完整资格链。

**OU 过程**：$dX = -\theta X dt + \sigma dB$ ⇒ 唯一强解 = $e^{-\theta t}x_0 + \sigma\int_0^t e^{-\theta(t-s)}dB_s$（对 $e^{\theta t}X_t$ 用 Itô 验证）；其为高斯过程、方差 $\frac{\sigma^2}{2\theta}(1 - e^{-2\theta t})$ 由**等距**一行算出——本科 sde-02 的公式全部落地。

## 4. 练习与要点

**例 1（Itô 公式即计算器）** 求 $E[B_t^4]$：对 $f = x^4$ 用 Itô，$dB_t^4 = 4B^3dB + 6B^2dt$，取期望（鞅项归零）得 $\frac{d}{dt}EB_t^4 = 6EB_t^2 = 6t$ ⇒ $EB_t^4 = 3t^2$——高斯四阶矩不查表自产（此法可递推全部偶数矩）。

**例 2（Grönwall 亲手用）** 由 §2 ②推矩估计 $E|X_t|^2 \leq C(1 + |x_0|^2)e^{Ct}$：线性增长代入、Grönwall 收口——解的矩不会爆破（有限时间内），数值格式（Euler–Maruyama）收敛性分析的前置件。

**例 3（验证型练习）** 证明 $X_t = \frac{B_t}{1+t}$ 满足 SDE $dX = -\frac{X}{1+t}dt + \frac{1}{1+t}dB$：对 $f(t,x) = \frac{x}{1+t}$ 用 Itô 公式（注意 $f_{xx} = 0$，修正项消失——线性函数不吃 Itô 税）。$\blacksquare$

---

*下一页：换测度的魔法——Girsanov 定理、鞅表示定理与 Feynman–Kac：金融数学三大支柱的严格版，随机分析收官。*
