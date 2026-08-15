# 随机分析 III · Itô 公式与 SDE 理论

> **对标**：Øksendal §4–5 ｜ **前置**：sc-01/02、ode-01（本科）、泛函 I
> 两张本科欠条在本页兑付：**Itô 公式的证明**（“带 $(dB)^2 = dt$ 的 Taylor 展开”如何变成定理）与 **SDE 解的存在唯一性**（Picard 迭代在 $L^2$ 路径空间的重演）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="sc03-learning-title">

<h2 id="sc03-learning-title">学习层：普通链式法则漏掉的那一本账</h2>

### 1. 具体谜题：为什么 $x^2$ 需要一项额外的 $dt$？

在光滑微积分里，分割 $0=t_0<\cdots<t_N=T$ 上有

$$
X_{t_{j+1}}^2-X_{t_j}^2
 =2X_{t_j}\Delta X_j+(\Delta X_j)^2,
 \qquad \Delta X_j=X_{t_{j+1}}-X_{t_j}.
$$

如果把最后一项想当然地当成高阶小量，普通链式法则会预测
$X_T^2-X_0^2\approx\sum_j2X_{t_j}\Delta X_j$。但对 Brownian 路径，
每个增量的典型大小是 $\sqrt{\Delta t}$，所以 $(\Delta B_j)^2$ 与
$\Delta t$ 同阶：它们相加后不会自动消失。

本页实验把这件事写成两笔可核对的账。写 $n=2^L$，则：

$$
I_n=\sum_{j=0}^{n-1}2B_{t_j}\Delta B_j,\qquad
Q_n=\sum_{j=0}^{n-1}(\Delta B_j)^2,\qquad t_j=jT/n,
$$

并逐层显示离散恒等式

$$
B_T^2-B_0^2=I_n+Q_n.
$$

先别看结果，预测三件事：

1. Brownian 的 $Q_L$ 在 $L$ 加大时会趋向 $0$、$T$，还是没有稳定口径？
2. $\int_0^T2B_t\,dB_t$ 的左端和极限，是 $B_T^2-B_0^2$、$B_T^2-B_0^2-T$，还是别的量？
3. 对 $dS_t=\mu S_t\,dt+\sigma S_t\,dB_t$，$\log S_t$ 的漂移是 $\mu$、$\mu+\sigma^2/2$，还是 $\mu-\sigma^2/2$？

实验会先锁住这三项判断；提交前不显示 seed、分割层数、路径图或账本结果。揭示后可以连续切换样本、层数和路径类型，重置则重新门控。

### 2. 最小模型：最高层生成，同一路径向下聚合

固定 $T=1$ 和一个最高 dyadic 层 $M$。脚本只生成一次独立高斯细增量

$$
\Delta B_{M,r}=\sqrt{T2^{-M}}\,\zeta_r,\qquad \zeta_r\sim N(0,1),
$$

再把相邻的细增量相加：

$$
\Delta B_{L,j}=
\sum_{r=j2^{M-L}}^{(j+1)2^{M-L}-1}\Delta B_{M,r},\qquad L\le M.
$$

因此不同 $L$ 使用同一条样本路径，粗层端点是细层端点的子集，尤其保持同一个 $B_T$；切换层数不是重新抽样。对照路径取

$$
f(t)=0.75\sin(2\pi t)+0.25\sin(6\pi t),
$$

在相同的 uniform nested partitions 上计算同样的 $Q_L$、左端和与总变差。光滑路径的有限变差保证 $Q_L\to0$，但“连续”本身并不足以推出这个结论。

### 3. 读账本：恒等式是精确的，极限要分清量词

对任意一条离散路径，逐段展开就得到

$$
2X_{t_j}\Delta X_j+(\Delta X_j)^2
=X_{t_{j+1}}^2-X_{t_j}^2;
$$

所以 $I_n+Q_n$ 在每一层都应与端点平方差相等（只差浮点舍入）。对 Brownian，$Q_n$（实验中记作 $Q_L$）是一条有限样本上的诊断：它通常围绕 $T$ 波动，不要求单调，也绝不凭一条样本冒充证明。对应的随机分析定理是：对固定 $t$ 和确定性 uniform/dyadic 分割 $\pi_n$，

$$
Q_t(\pi_n)=\sum_j(B_{t_{j+1}}-B_{t_j})^2
\xrightarrow{L^2}t,\qquad\text{因而}\qquad Q_t(\pi_n)\xrightarrow{P}t.
$$

沿 dyadic 分割还可由方差可和与 Borel–Cantelli 得到几乎处处收敛；这里的交互图只展示固定有限层和固定样本。可选的 $\sum|\Delta B|^3$ 或总变差能帮助观察“更高阶项变小”，但它们不是二次变差定理本身。

对 $x^2$，这本账在极限中读成

$$
d(B_t^2)=2B_t\,dB_t+dt,\qquad
\int_0^T2B_t\,dB_t=B_T^2-B_0^2-T.
$$

这正是普通链式法则漏掉的项：二次变差把二阶 Taylor 项留下来了。

<div class="learning-lab" data-learning-lab="ito-quadratic-variation" markdown="1">

**无 JavaScript 时的静态读法：**固定 $T=1$，先在最高 dyadic 层生成一批 seeded Gaussian 增量，再向下聚合；每个层的端点和 $B_T$ 都来自同一条路径。对任意当前层 $L$，直接计算

$$
Q_n=\sum(\Delta X)^2,\qquad I_n=\sum2X_{\rm left}\Delta X,\qquad
X_T^2-X_0^2-I_n-Q_n=0
$$

（数值上只剩舍入误差）。Brownian 的单样本 $Q_L$ 只是围绕 $T$ 的有限诊断，可能上下波动；光滑对照的 $Q_L$ 随 uniform nested partition 加细而趋向 $0$。揭示后的账本还会并列显示 $I_L$、$Q_L$、端点平方差和残差，并标出
$\int_0^T2B_t\,dB_t=B_T^2-B_0^2-T$。这些有限层数值不能替代 $L^2$/概率（dyadic 时再加几乎处处）收敛定理。

| 账本 | Brownian 样本 | 光滑路径 | 读法 |
|---|---:|---:|---|
| $Q_L=\sum(\Delta X)^2$ | 单样本在 $T$ 附近波动 | $\to0$ | 诊断，不是证明 |
| $I_L=\sum2X_{\rm left}\Delta X$ | $B_T^2-B_0^2-T$ 的离散近似 | $X_T^2-X_0^2$ 的离散近似 | 左端点约定 |
| $I_L+Q_L$ | $X_T^2-X_0^2$ | $X_T^2-X_0^2$ | 每层 telescoping 恒等式 |

</div>

### 4. 迁移：从账本回到定理

看到一般的 $dX_t=\mu_tdt+\sigma_tdB_t$ 时，先问二次变差是哪一项：
$d\langle X\rangle_t=\sigma_t^2dt$。若 $f\in C^{1,2}$，时间一阶、空间二阶连续可微，
那么二阶空间导数正好会乘上这本账的密度 $\sigma_t^2dt$。但图上的一个 seed、一个最高层和一组分割，只是理解机制的实验接口；定理仍需要适应性、可积性和极限论证。

</section>

## 1. Itô 过程与 Itô 公式

**Itô 过程**：

$$
X_t=X_0+\int_0^t\mu_s\,ds+\int_0^t\sigma_s\,dB_s,
$$

其中微分记号 $dX_t=\mu_tdt+\sigma_tdB_t$ 只是速记。对每个有限时间区间 $[0,T]$，通常要求 $X$ 连续且适应，$\mu,\sigma$ 渐进可测，并满足相应的平方可积条件，例如

$$
E\int_0^T(|\mu_s|^2+|\sigma_s|^2)\,ds<\infty;
$$

更一般的局部版本由停时局部化处理。这样 Itô 积分和公式中的各项才有定义。

**定理（Itô 公式）** 若 $f\in C^{1,2}$（时间一阶、空间二阶连续可微），并且在所用的局部化/可积性条件下各项可积，则

$$
df(t,X_t)=\Big(f_t+\mu_tf_x+\frac12\sigma_t^2f_{xx}\Big)dt
+\sigma_tf_x\,dB_t.
$$

这里的 $C^{1,2}$ 不是装饰：$f_t$、$f_x$、$f_{xx}$ 分别承担时间一阶项、随机一阶项和幸存的二阶空间项。

**【证明骨架（结构完整，簿记略）】** 四步：

① **局部化**：令停时在 $X$、$\mu$、$\sigma$ 或相关积分超过 $R$ 时截断，使停止过程和系数落在有界区域；先对每个 $R$ 证明，再让 $R\uparrow\infty$。这是把局部估计接回原过程的步骤，不是把无界问题默认为有界。

② **二维 Taylor 展开**：对分割 $\{t_j\}$，在左端点展开

$$
\begin{aligned}
f(t_{j+1},X_{t_{j+1}})-f(t_j,X_{t_j})
={}&f_t\,\Delta t_j+f_x\,\Delta X_j
 +\frac12f_{xx}(\Delta X_j)^2+R_j.
\end{aligned}
$$

时间一阶项由有限变差积分负责；空间二阶项不能沿 Brownian 路径直接丢掉。

③ **逐项归位**：$\sum f_x\Delta X_j$ 的左端和按 sc-02 收敛到
$\int f_x\,dX$。又因为

$$
(\Delta X_j)^2=\sigma_{t_j}^2(\Delta B_j)^2
 +2\mu_{t_j}\sigma_{t_j}\Delta t_j\Delta B_j
 +\mu_{t_j}^2(\Delta t_j)^2+\text{逼近误差},
$$

加总后第一项给出 $\int\sigma_s^2ds$；交叉项和 $dt^2$ 项由局部化后的矩估计归零。这就是二次变差定理的加权版本。

④ **余项控制**：在局部化的紧集上，$f_{xx}$ 一致连续，故
$R_j=o((\Delta X_j)^2)$；结合增量矩估计和二次变差收敛，余项和趋于零。再解除局部化，得到公式。\(\blacksquare\)

**读法**：证明把“$(dB)^2=dt$、其余高阶项归零”的口诀逐项落实为极限，而不是把微分符号当作先验代数规则。多维版把 $\sigma^2dt$ 换成协变差矩阵 $d\langle X^i,X^j\rangle$，结构相同【引用】。

**Itô 与 Stratonovich 的约定**：Itô 积分用左端点、被积过程适应；Stratonovich 记作 $\circ dB$，在足够光滑时满足

$$
\int_0^T H_t\circ dB_t
=\int_0^T H_t\,dB_t+\frac12[H,B]_T.
$$

若 $H_t=g(t,X_t)$ 且 $dX_t=\mu_tdt+\sigma_tdB_t$，则
$[H,B]_t=\int_0^t g_x(s,X_s)\sigma_sds$；因此把 Stratonovich SDE 改写成 Itô 形式会多出相应的半个导数漂移修正。两种 convention 都有用途，但本页的左端点账本和公式默认是 Itô。

## 2. SDE：强解的存在唯一性

考虑

$$
dX_t=\mu(t,X_t)dt+\sigma(t,X_t)dB_t,\qquad X_0=x_0.
$$

**定理（Itô 存在唯一性）** 假设 $\mu,\sigma$ 对时间可测，并且存在与 $t$ 无关的常数 $L,C$，对所有 $t,x,y$ 有

$$
|\mu(t,x)-\mu(t,y)|+|\sigma(t,x)-\sigma(t,y)|\le L|x-y|
$$

以及全局线性增长

$$
|\mu(t,x)|+|\sigma(t,x)|\le C(1+|x|).
$$

若 $X_0$ 是平方可积的 $\mathcal F_0$-可测随机变量，则对每个有限 $T$ 存在唯一（不可区分意义）的连续适应**强解**，并且

$$
E\sup_{t\le T}|X_t|^2<\infty.
$$

这里“强”表示解由给定的 Brownian motion 和过滤构造，适应性不是事后补上的标签。全局 Lipschitz + 线性增长是一个方便的充分条件版本，不是所有 SDE 的最弱假设。

**【证明骨架（Picard 在 $L^2$ 路径空间）】** 定义

$$
(\Phi X)_t=x_0+\int_0^t\mu(s,X_s)ds+\int_0^t\sigma(s,X_s)dB_s.
$$

在 $\|X\|_{T,2}^2=E\sup_{t\le T}|X_t|^2$ 的完备空间上：

① $\Phi$ 良定：线性增长、Cauchy–Schwarz 与 Itô 等距给出平方可积性，适应性来自 $X$ 的适应性和积分构造。

② **积分型估计**：对 $X,Y$，漂移项用 Cauchy–Schwarz，扩散项用 **Doob $L^2$ 极大不等式 + Itô 等距**，得到

$$
E\sup_{t\le T}|(\Phi X-\Phi Y)_t|^2
\le C_T\int_0^T E|X_s-Y_s|^2ds.
$$

这不是在任意 $T$ 上已经得到的“直接压缩”：右侧是 Volterra 型积分估计。可以在足够短的时间片上选范数使其成为压缩，再逐片延拓；也可以直接对 Picard 差分迭代该估计，得到阶乘衰减

$$
\|X^{(n+1)}-X^{(n)}\|_{T,2}^2
\le \frac{(C_TT)^n}{n!}\|X^{(1)}-X^{(0)}\|_{T,2}^2,
$$

从而在任意给定有限 $T$ 上求和。

③ **存在性**：$X^{(n+1)}=\Phi X^{(n)}$ 的差分级数在路径空间中 Cauchy，完备性给出极限；再用 Itô 积分的稳定性把极限送回积分方程。需要路径级结论时，可用 Doob 控制和 Borel–Cantelli 沿子列得到几乎处处一致收敛。

④ **唯一性**：两解之差满足同型的积分估计；令 $u(t)=E\sup_{s\le t}|X_s-Y_s|^2$，由 Grönwall 不等式

$$
u(t)\le C\int_0^t u(s)ds\quad\Longrightarrow\quad u(t)=0,
$$

得到不可区分唯一。\(\blacksquare\)

**读法**：与 ode-01 的 Picard 定理逐步对应（映射—压缩/积分估计—迭代—Grönwall），只是每步多穿一件概率装备（Itô 等距、Doob、Borel–Cantelli）。若 Lipschitz 失守，唯一性可能失效：例如 $\sigma(x)=|x|^\alpha$、$\alpha<1/2$ 的情形需额外讨论；CIR 的临界平方根扩散则需要专门论证【引用】。

## 3. 两个立即收割

**几何 Brownian motion**（严格版）：取 $S_0>0$，考虑

$$
dS_t=\mu S_tdt+\sigma S_tdB_t
$$

的系数满足全局 Lipschitz 与线性增长，故有唯一强解。对 $\log S_t$ 使用 Itô 公式前要先交代正性：可令
$\tau_\varepsilon=\inf\{t:S_t\le\varepsilon\}$，在逼近零的停时局部化区间上对
$\log S_{t\wedge\tau_\varepsilon}$ 计算；或者先直接验证下面严格为正的指数候选，再由强解唯一性确认它就是原解，从而确认 $S_t>0$。

$$
S_t=S_0\exp\big((\mu-\tfrac12\sigma^2)t+\sigma B_t\big).
$$

漂移修正 $-\sigma^2/2$ 正是二次变差留下的二阶项，不是记号偏好。

**OU 过程**：以下方差公式先假设 $\theta>0$（稳定 OU 情形）：

$$
dX_t=-\theta X_tdt+\sigma dB_t
$$

有唯一强解

$$
X_t=e^{-\theta t}x_0+\sigma\int_0^t e^{-\theta(t-s)}dB_s.
$$

对 $e^{\theta t}X_t$ 用 Itô 公式验证；它是高斯过程，方差
$\frac{\sigma^2}{2\theta}(1-e^{-2\theta t})$ 由 Itô 等距一行算出。并且
\[
\lim_{\theta\downarrow0}\frac{\sigma^2}{2\theta}(1-e^{-2\theta t})=\sigma^2t;
\]
在 $\theta=0$ 时方程变为 $dX_t=\sigma\,dB_t$，故（确定性 $x_0$ 下）方差确为 $\sigma^2t$。

## 4. 练习与要点

**例 1（Itô 公式即计算器）** 求 $E[B_t^4]$：对 $f=x^4$ 用 Itô，

$$
dB_t^4=4B_t^3dB_t+6B_t^2dt.
$$

取期望（鞅项归零）得 $\frac d{dt}EB_t^4=6EB_t^2=6t$，所以
$EB_t^4=3t^2$；高斯四阶矩可由此自产，并可递推全部偶数矩。

**例 2（Grönwall 亲手用）** 由存在性估计得到

$$
E|X_t|^2\le C(1+|x_0|^2)e^{Ct}.
$$

线性增长先给出积分型矩界，再由 Grönwall 收口；这说明解在有限时间内矩不会爆破，也是 Euler–Maruyama 收敛性分析的前置件。

**例 3（验证型练习）** 证明

$$
X_t=\frac{B_t}{1+t}
$$

满足

$$
dX_t=-\frac{X_t}{1+t}dt+\frac1{1+t}dB_t.
$$

对 $f(t,x)=x/(1+t)$ 用 Itô 公式；注意 $f_{xx}=0$，所以线性函数不吃 Itô 税。\(\blacksquare\)

---

*下一页：换测度的魔法——Girsanov 定理、鞅表示定理与 Feynman–Kac：金融数学三大支柱的严格版，随机分析收官。*
