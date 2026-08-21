# 凸优化 II · 一阶方法的收敛性证明

> **对标**：Nesterov *Lectures* §2 / Bubeck *Convex Optimization* §3 ｜ **前置**：本科优化 II、cvx-01
> 本科优化 II 给了收敛速率表；本页逐行兑付证明，并补上两块新版图：**Nesterov 加速**（$1/k^2$——一阶方法的速度极限）与**近端梯度**（把 L1 等不可微正则项收编进梯度法）。证明模板只有一个：**找对势函数**。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="first-order-learning-title">

<h2 id="first-order-learning-title">学习层：先把目标和残差分清，再谈“加速”</h2>

### 1. 具体玩具：一个碗、一个 L1 折角、两套公平比较

实验固定

$$
f(x)=\frac12\big[(x_1-2)^2+4(x_2+2)^2\big],\qquad
g(x)=\frac12\lVert x\rVert_1,\qquad F(x)=f(x)+g(x),
$$

从 $x_0=(5,4)$ 出发。$f$ 是 $L=4$-光滑、$\mu=1$-强凸的二次函数；$g$ 是闭、真、凸但在坐标轴上不可微的 L1 项。两个精确参照点不同：

$$
x_f^*=(2,-2),\quad f^*=0;\qquad
x_F^*=(3/2,-15/8),\quad F^*=\frac{59}{32}=1.84375.
$$

因此实验把比较分成两组，并在表头明确写出目标：

- **平滑组**：GD 与 Nesterov 动量法都最小化 $f$，可核对 $L,\mu$ 下的平滑目标 gap 与梯度残差；
- **复合组**：proximal gradient（ISTA）与 FISTA-style 近端加速都最小化 $F$，可核对 prox-gradient mapping 与复合目标 gap。

GD/Nesterov 的 $F(x_k)-F^*$ 只作为“把平滑轨迹放回复合问题后会怎样”的诊断，不能假装它们在求解 L1 目标。这样才不会把不同目标的曲线排成一个虚假的冠军榜。

### 2. 精确桥梁：步长、残差和可用的界

平滑梯度步为

$$
x_{k+1}=x_k-\alpha\nabla f(x_k),\qquad
G_f(x_k)=\nabla f(x_k).
$$

近端梯度步为

$$
x_{k+1}=\operatorname{soft}_{\alpha/2}
\bigl(x_k-\alpha\nabla f(x_k)\bigr),\qquad
G_{\alpha,F}(x_k)=\frac{x_k-x_{k+1}}{\alpha}.
$$

这里的 $\operatorname{soft}_{\tau}(t)=\operatorname{sign}(t)\max(|t|-\tau,0)$；PG 的残差是 prox-gradient mapping，不是普通梯度范数。若 $0<\alpha\le1/L$，凸光滑目标的标准账本为

$$
f(x_k)-f^*\le \frac{\lVert x_0-x_f^*\rVert^2}{2\alpha k},
$$

而在本页的 $\mu$-强凸平滑情形，GD 还可用

$$
f(x_k)-f^*\le(1-\alpha\mu)^k\bigl(f(x_0)-f^*\bigr).
$$

对 FISTA/近端加速，若使用任意 $0<\alpha\le1/L$，复合凸问题的一种标准最坏情形界是

$$
F(x_k)-F^*\le\frac{2\lVert x_0-x_F^*\rVert^2}{\alpha(k+1)^2};
$$

普通 PG 的对应 $1/k$ 界是 $\lVert x_0-x_F^*\rVert^2/(2\alpha k)$。这些都是带着目标、强凸性和步长假设的证书；实验的有限行只核对证书，不替代一般证明。

### 3. 预测门：速率界不是逐点承诺

先回答，再揭示轨迹、目标 gap、残差和界：

1. 默认 $\alpha=1/L=1/4$ 是否满足平滑组与复合组的标准步长假设？把步长调到 $1.25/L$ 后，有限二次轨迹仍可能运行，这是否恢复一般下降定理？
2. “$1/k^2$”应读成最坏情形的速率界，还是每一个 $k$ 都比 GD 的函数值小？
3. PG 的残差应读作 $\|\nabla f(x_k)\|$，还是 $\|G_{\alpha,F}(x_k)\|$？
4. 一张有限曲线是否能证明加速法在每个点、每个函数上都更快？

改变步长预设或迭代次数会重新锁门；提交前不显示任何数值轨迹和界。

### 4. 动手实验：两张目标账、四条有限轨迹

揭示后可选择安全步长、保守步长或超出标准条件的诊断预设，并调整迭代次数。SVG 左栏比较同一个 $f$ 上的 GD/Nesterov，右栏比较同一个 $F$ 上的 PG/FISTA；表格逐行报告各自的 objective gap、残差、$1/k$ 或 $1/k^2$ 界，以及当前假设是否有效。加速曲线可以非单调、可以交叉；“达到更好的最坏情形阶数”不等于点态排序。

<div class="learning-lab" data-learning-lab="first-order-methods" markdown="1">

**无 JavaScript 时的静态读法：**默认 $\alpha=1/L=1/4$、$x_0=(5,4)$。平滑参照为 $x_f^*=(2,-2)$、$f^*=0$；复合参照为 $x_F^*=(3/2,-15/8)$、$F^*=59/32$。第一步可手算为：

| 方法 | 目标 | 第一步点 | objective gap | 残差 | 第一步有效界 |
|---|---|---|---:|---:|---:|
| GD | $f$ | $(17/4,-2)$ | $81/32=2.53125$ | $9/4=2.25$（$\|\nabla f\|$） | 凸界 $90$；强凸界 $459/8=57.375$ |
| Nesterov | $f$ | $(17/4,-2)$ | $81/32$ | $9/4$（$\|\nabla f\|$） | $90$（$2LR_f^2/4$） |
| PG / ISTA | $F$ | $(33/8,-15/8)$ | $441/128\approx3.4453125$ | $\|G_{1/4,F}(x_1)\|=21/8$ | $R_F^2/(2\alpha)=2993/32=93.53125$ |
| FISTA-style | $F$ | $(33/8,-15/8)$ | $441/128$ | $\|G_{1/4,F}(x_1)\|=21/8$ | $2LR_F^2/4=R_F^2/(2\alpha)$ |

其中 $R_f^2=\|(5,4)-(2,-2)\|^2=45$、$R_F^2=\|(5,4)-(3/2,-15/8)\|^2=2993/64$。表中的界是“在假设成立时的上界”，不是下一步实际 gap 的预测值；有限轨迹不能替代证书。

</div>

### 5. 边界：加速是速率声明，不是逐点竞赛

- **目标必须相同。**本实验的 GD/Nesterov 平滑组与 PG/FISTA 复合组分别比较；把 $f$ 的 gap 与 $F$ 的 gap 直接排序没有数学意义。
- **步长必须带假设。**$0<\alpha\le1/L$ 给出这里使用的标准下降/速率读法；超步长可能在这个二维二次上暂时稳定，但不自动拥有一般凸问题的证书。
- **加速不保证逐点更小。**动量会让目标值或残差出现波纹、交叉和回撤；$O(1/k^2)$ 是最坏情形阶数，不能改写成“每一步都赢”。
- **有限实验不是证明。**一张轨迹只能检查本玩具的数值与假设标记；一般收敛定理仍需凸性、光滑性/强凸性、近端可计算性和相应步长。

</section>

## 1. 梯度下降：两条速率的完整证明

<figure class="plot" markdown="1">
![一阶方法收敛速率对比](assets/img/cvx-02-rates.svg)
<figcaption><span class="fig-id">图 2.1</span>一阶方法收敛速率：凸 \(O(1/k)\)、Nesterov 加速 \(O(1/k^2)\)、强凸线性——加速把速率提了一个数量级。</figcaption>
</figure>

**引理（下降引理）【证明】** $L$-光滑（$\nabla f$ Lipschitz）⇒ $f(y) \leq f(x) + \langle\nabla f(x), y - x\rangle + \frac L2\|y - x\|^2$（对 $g(t) = f(x + t(y-x))$ 微积分基本定理 + Lipschitz 估计积分）。取 $y = x - \frac1L\nabla f$：**每步至少降 $\frac{1}{2L}\|\nabla f\|^2$**。

**定理（凸 + $L$-光滑，$\alpha = 1/L$）** $f(x_k) - f^* \leq \dfrac{L\|x_0 - x^*\|^2}{2k}$。
**【证明】** 势函数 $\Phi_k = \|x_k - x^*\|^2$：

$$
\Phi_{k+1} = \Phi_k - \frac2L\langle\nabla f_k, x_k - x^*\rangle + \frac{1}{L^2}\|\nabla f_k\|^2.
$$

对凸且 $L$-光滑的函数，强化的一阶不等式

$$
\langle\nabla f(x),x-x^*\rangle
\ge f(x)-f^*+\frac{1}{2L}\|\nabla f(x)\|^2
$$

由光滑凸插值不等式得到（等价地，可对 $f(\cdot)-\langle\nabla f(x),\cdot\rangle$ 使用下降引理）。代回上式后梯度范数项恰好抵消，得到 $\frac2L(f_k-f^*)\le\Phi_k-\Phi_{k+1}$；望远镜求和，再用 $f_k$ 单调下降，便有 $f_k-f^*\le L\Phi_0/(2k)$。$\blacksquare$

**定理（+$\mu$-强凸）** $\Phi_{k+1} \leq \big(1 - \frac\mu L\big)\Phi_k$——线性收敛。
**【证明】** 同一展开，凸性条件换强凸版 $\langle\nabla f_k, x_k - x^*\rangle \geq f_k - f^* + \frac\mu2\Phi_k$，配合下降引理消去函数值项。$\blacksquare$（本科优化 II 那张表的两行至此有据可查；condition number $\kappa = L/\mu$ 的统治力在证明里显形。）

## 2. Nesterov 加速：$1/k^2$ 与下界

**算法（实验采用的 FISTA 型动量形式）**：令 $t_0=1$、$y_0=x_0$，

$$
x_{k+1}=y_k-\frac1L\nabla f(y_k),\qquad
t_{k+1}=\frac{1+\sqrt{1+4t_k^2}}2,
$$

$$
y_{k+1}=x_{k+1}+\frac{t_k-1}{t_{k+1}}(x_{k+1}-x_k).
$$

**定理（Nesterov 1983）** 凸 + $L$-光滑：$f(x_k) - f^* \leq \dfrac{2L\|x_0 - x^*\|^2}{(k+1)^2}$。
**【骨架】** 估计序列/双势函数法：构造 $\Phi_k=A_k(f(x_k)-f^*)+\frac L2\|z_k-x^*\|^2$（$z_k$ 为辅助点、$A_k\sim k^2$），逐步验证 $\Phi_{k+1}\le\Phi_k$。上面的 $t_k$ 递推是一种让代数配平成立的经典日程，并非唯一可行的加速系数；其他 Nesterov 参数化也可得到同阶界。$\blacksquare$

**定理（一阶 oracle 下界，Nesterov）【骨架】** 对每个给定的确定性一阶 oracle 方法和步数 $k$，在维数相对 $k$ 足够大、初始半径受限为 $\|x_0-x^*\|\le R$ 的函数类中，存在一个依赖该方法的 $L$-光滑凸函数，使

$$
f(x_k)-f^*\ge \frac{cLR^2}{(k+1)^2}.
$$

随机化方法需要相应的随机 oracle 下界版本，量词不能写成“先固定一个函数，再难住所有方法”。在线性张成假设下，链条函数的梯度每步只能点亮一个新坐标；去掉该假设则需 resisting-oracle 构造来旋转尚未暴露的方向。$\blacksquare$
**合读**：加速法在这个 oracle 模型下达到阶意义的下界，因此 $1/k^2$ 是该函数类的一阶最坏情形最优阶；强凸版在相应假设下把条件数依赖从 $\kappa$ 改进到 $\sqrt\kappa$。

## 3. 近端梯度：收编不可微项

**问题形态**：$\min f(x) + h(x)$——光滑损失 + 不可微但"简单"的正则项（L1、示性函数、核范数）。

**近端算子**（cvx-01 语言的运算化）：

$$
\mathrm{prox}_{\lambda h}(v) = \arg\min_x\ \Big[h(x) + \frac{1}{2\lambda}\|x - v\|^2\Big]
$$

（对 $h = \iota_C$ 即投影——投影是 prox 的特例；对 $h = \lambda\|\cdot\|_1$ 有闭式**软阈值** $\mathrm{sign}(v)\max(|v| - \lambda, 0)$【一行推导：逐坐标一维问题分段求导】。）

**算法（ISTA / 近端梯度）**：$x_{k+1} = \mathrm{prox}_{h/L}\big(x_k - \frac1L\nabla f(x_k)\big)$——"光滑部分走梯度、简单部分交 prox"。
**定理【引用（证明与 §1 平行）】** 速率与纯梯度法同：凸 $1/k$、强凸线性、可加速为 FISTA 的 $1/k^2$【引用 Beck–Teboulle】。

**读法**：**Lasso、稀疏字典、低秩补全的求解器骨架就是这一行迭代**；软阈值算子解释了 L1 的稀疏机理（小于阈值的分量被精确置零——本科优化 I 次微分含区间的算法化身）。prox 演算与共轭的关系：Moreau 分解 $v = \mathrm{prox}_h(v) + \mathrm{prox}_{h^*}(v)$——cvx-01 的变换表直接变成算子库【引用】。

## 4. 练习与要点

**例 1（证明的迁移测试）** 把 §1 凸情形证明改写为投影梯度法版本（约束凸集 $C$）：唯一改动 = 投影非扩张性 $\|\Pi_C(x) - x^*\| \leq \|x - x^*\|$（泛函 II）插入势函数链——能独立完成此改写，势函数法即入手。

**例 2（软阈值亲算）** $\min \frac12(x - 3)^2 + |x|$：prox 一步 $x^* = \mathrm{sign}(3)\max(3 - 1, 0) = 2$；改 $|x|$ 系数为 4：$x^* = 0$——**正则强到一定程度解精确归零**，稀疏性的最小实例。

**例 3（加速的震荡副作用）** 加速法的 $f(x_k)$ **非单调**（动量冲过头再拉回——阻尼振荡，ode-02 欠阻尼的既视感；严格对应：加速法的连续极限是二阶 ODE $\ddot x + \frac3t\dot x + \nabla f = 0$【引用 Su–Boyd–Candès】）——训练曲线"加速方法有波纹"不是 bug 而是速度的代价。$\blacksquare$

---

*下一页：把"拆分"做成方法论——增广拉格朗日与 ADMM：大规模与分布式优化的主力发动机。*
