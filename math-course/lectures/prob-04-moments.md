# 概率 IV · 数字特征与条件期望

> 分布是完整档案，数字特征是"体检报告摘要"：期望定位、方差定散度、协方差定联动。本页的顶点是**条件期望**——它不只是一个数，而是一个随机变量，并且是"最佳预测"的数学化身：机器学习整个回归问题的理论答案在此写就。

## 1. 数学期望

**定义** 离散 $E X = \sum x_k p_k$（要求绝对收敛——否则重排改变"平均"，数分 IV 条件收敛的警钟）；连续 $EX = \int x f(x)\,dx$。

**LOTUS（函数期望，"无意识统计学家定律"）**：求 $E[g(X)]$ **不必先求 $g(X)$ 的分布**：

$$
E[g(X)] = \int g(x) f_X(x)\,dx, \qquad E[g(X,Y)] = \iint g\, f(x,y)\,dx\,dy
$$

**性质**：线性 $E[aX + bY] = aEX + bEY$（**不需要独立**——期望的线性是无条件的，这是它最强的性质）；$X \perp Y \Rightarrow E[XY] = EX \cdot EY$（反之不真）。

⚠️ $E[g(X)] \neq g(EX)$（除非 $g$ 线性）；凸 $g$ 的方向由 **Jensen 不等式**给出：$E[g(X)] \geq g(EX)$（数分 II 的 Jensen 在概率语言下的形态——🔗 KL 散度非负、ELBO 推导（comfy 课 02 讲）的那一步 $\log E \geq E \log$ 正是它）。

## 2. 方差与矩

**定义** $DX = E[(X - EX)^2]$；**计算公式** $DX = E X^2 - (EX)^2$（展开即得，实算首选）。标准差 $\sigma = \sqrt{DX}$。

**性质**：$D(aX + b) = a^2 DX$（平移不变、缩放平方）；

$$
D(X \pm Y) = DX + DY \pm 2\,\mathrm{Cov}(X, Y) \qquad (X \perp Y \text{ 时 } D(X\pm Y) = DX + DY)
$$

**标准化** $X^* = \frac{X - EX}{\sigma}$：零均值单位方差（🔗 特征标准化、BatchNorm/LayerNorm 的原型操作）。**矩**：$k$ 阶原点矩 $E X^k$、中心矩 $E(X - EX)^k$（三阶定偏度、四阶定峰度）。

## 3. 协方差与相关系数

**定义** $\mathrm{Cov}(X, Y) = E[(X - EX)(Y - EY)] = E[XY] - EX\,EY$；**相关系数** $\rho = \dfrac{\mathrm{Cov}(X,Y)}{\sigma_X \sigma_Y}$。

**性质**：$|\rho| \leq 1$（对随机变量内积 $\langle X, Y\rangle = E[XY]$ 用 Cauchy–Schwarz——高代 VI 的不等式换个舞台重演）；$|\rho| = 1 \iff Y = aX + b$（**$\rho$ 只度量线性关系的强度**）。

⚠️ **不相关（$\rho = 0$）≠ 独立**：$X \sim U(-1,1),\ Y = X^2$——完全函数依赖却不相关（对称抵消）。独立 ⇒ 不相关；逆命题仅对二维正态成立（概率 III 性质 3）。

**协方差矩阵** $\Sigma = \big[\mathrm{Cov}(X_i, X_j)\big]$：对称、**半正定**（$a^\top \Sigma a = D(a^\top X) \geq 0$——一行证明，高代 VI 半正定判据的天然例子）。🔗 PCA 对 $\Sigma$ 做谱分解（高代 VI §5）；多维正态由 $(\boldsymbol\mu, \Sigma)$ 完全决定。

## 4. 条件期望（本页顶点）

**定义** $E[Y \mid X = x] = \int y\, f_{Y\mid X}(y \mid x)\,dy$ 是 $x$ 的函数；把 $x$ 换回 $X$，得随机变量 $E[Y \mid X]$——"用 $X$ 的信息对 $Y$ 做的最优摘要"。

**定理（全期望公式 / 塔性质）**

$$
E\big[E[Y \mid X]\big] = E[Y]
$$

（"分组平均再总平均 = 总平均"。全概率公式的期望版；分层/分阶段问题的主武器。）

**定理（条件期望 = 最佳预测）** 在均方误差意义下，

$$
E[Y \mid X] = \arg\min_{g}\; E\big[(Y - g(X))^2\big]
$$

*证明思路*：对任意 $g$，把 $Y - g(X) = (Y - E[Y|X]) + (E[Y|X] - g(X))$ 展开，交叉项用塔性质归零（第一项对给定 $X$ 均值为零），剩下 $\text{MSE}(g) = E[(Y - E[Y|X])^2] + E[(E[Y|X] - g(X))^2]$，第二项取 $g = E[Y|X]$ 时消失。$\blacksquare$

🔗 **这就是 ai 课 01 讲"平方损失下贝叶斯最优预测是条件期望"的完整证明**——回归问题的理论天花板；整个监督学习是在有限数据下逼近 $E[Y\mid X]$。**方差分解**（全方差公式）：$DY = E[D(Y|X)] + D(E[Y|X])$——"组内方差 + 组间方差"，方差分析（统计页）与 bias-variance 直觉的源头。

## 5. 母函数与特征函数

**矩母函数** $M_X(t) = E[e^{tX}]$；**特征函数** $\varphi_X(t) = E[e^{itX}]$（恒存在，模 $\leq 1$）。三大功能：

1. **生成矩**：$\varphi^{(k)}(0) = i^k E X^k$（逐阶求导取零点）；
2. **唯一决定分布**（反演公式）——"验明正身"的手段；
3. **独立和 → 乘积**：$\varphi_{X+Y} = \varphi_X \varphi_Y$——卷积（概率 III）在变换域变乘法（与 Fourier 变换同一机理，数分 IV），三大可加族一行验证，也是下一页 CLT 证明的引擎。

常用对照：$N(\mu,\sigma^2)$ 的 $\varphi(t) = e^{i\mu t - \sigma^2 t^2/2}$；$P(\lambda)$ 的 $\varphi(t) = e^{\lambda(e^{it}-1)}$。

## 6. 典型例题

**例 1（示性函数分解求期望）** $n$ 个人随机把帽子发回，求拿对帽子人数 $X$ 的期望与方差。
*解*：$X = \sum I_k$（$I_k$ = 第 $k$ 人拿对）。$E I_k = \frac1n \Rightarrow EX = 1$（线性不需要独立！）。方差：$E[I_jI_k] = \frac{1}{n(n-1)}$，算得 $DX = 1$。**"拆成示性函数之和"是组合期望的万能钥匙。**

**例 2（塔性质 / Wald 型）** 每天写卡片数 $N \sim P(\lambda)$，每张独立以概率 $p$ 优质，求日优质数 $Y$ 期望。
*解*：$E[Y\mid N] = Np$，塔性质 $EY = p\,EN = \lambda p$。（实际上 $Y \sim P(\lambda p)$——泊松稀疏化，随机过程页再会。）

**例 3（相关系数）** $X \sim U(0, 2\pi)$，$Y = \sin X,\ Z = \cos X$：$E[YZ] = \frac{1}{2\pi}\int_0^{2\pi}\sin x\cos x\,dx = 0 = EY \cdot EZ$ ⇒ 不相关；但 $Y^2 + Z^2 = 1$ 严格依赖——不相关 ≠ 独立的又一实锤。$\blacksquare$

---

*最后一页：当随机变量成千上万地相加，确定性从随机中涌现——大数定律与中心极限定理。*
