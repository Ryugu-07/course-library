# 现代 PDE II · Sobolev 空间

> **对标**：Evans *PDE* §5.1–5.7 ｜ **前置**：pde2-01、泛函 I–II、实变 III
> 把"拥有 $k$ 阶弱导数"的函数组织成完备空间——**Sobolev 空间**：变分法与弱解理论的主场。核心问题只有一个：**"导数可积"能兑换多少"函数本身的好性质"？**答案是嵌入定理——现代分析最常引用的定理家族。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="sobolev-scaling-learning-title">

<h2 id="sobolev-scaling-learning-title">学习层：固定梯度预算，\(p^*\) 为什么是临界指数？</h2>

### 1. 先猜：尖峰能不能骗过 Sobolev 控制？

在 $\mathbb R^n$ 中给一个径向帽函数，并把一阶梯度预算精确钉为 $\|Du_\varepsilon\|_{L^p}=1$。当 $\varepsilon$ 变小时，帽子变窄；但振幅会怎样，$L^q$ 范数又会怎样？这里的目标不是画一族“好看的函数”，而是逐项审计**振幅、支撑体积、梯度预算和 $L^q$ 范数的缩放账本**。

先不要打开账本，写下四个预测：

1. 在 $1\leq p<n$ 时，$\varepsilon\downarrow0$，$\|u_\varepsilon\|_\infty$ 会增大、保持不变，还是减小？
2. 取 $q=p^*=np/(n-p)$，$\varepsilon\downarrow0$ 时 $\|u_\varepsilon\|_{L^q}$ 会趋于 $0$、保持同一尺度，还是发散？
3. 取 $q>p^*$，$\varepsilon\downarrow0$ 时 $\|u_\varepsilon\|_{L^q}$ 会趋于 $0$、保持同一尺度，还是发散？
4. 在同一归一化预算下，$\|Du_\varepsilon\|_{L^p}$ 会随 $\varepsilon$ 改变，还是始终等于 $1$？

实验会先收下这四个预测；提交后才解锁连续的 $\varepsilon$、$q$ 和有限维度预设。揭示之后，每一次调节都同时更新帽形图、对数账本、精确 Beta 因子和临界性判别。

### 2. 精确模型：四本账合起来只剩一个指数

实验只使用 $1\leq p<n$。记单位球体积

$$
\omega_n=|B_1(0)|=\frac{\pi^{n/2}}{\Gamma(n/2+1)},
\qquad
u_\varepsilon(x)=A_\varepsilon\left(1-\frac{|x|}{\varepsilon}\right)_+,
$$

其中

$$
A_\varepsilon=\varepsilon^{1-n/p}\omega_n^{-1/p}.
$$

几乎处处有 $|Du_\varepsilon|=A_\varepsilon/\varepsilon$（$|x|<\varepsilon$），所以

$$
\|Du_\varepsilon\|_p^p
=\left(\frac{A_\varepsilon}{\varepsilon}\right)^p\omega_n\varepsilon^n
=1.
$$

用极坐标和 $B(a,b)=\Gamma(a)\Gamma(b)/\Gamma(a+b)$，对 $q\geq1$ 得到

$$
\begin{aligned}
|\operatorname{supp}u_\varepsilon|&=\omega_n\varepsilon^n,\\
\|u_\varepsilon\|_\infty&=A_\varepsilon
=\omega_n^{-1/p}\varepsilon^{1-n/p},\\
\|u_\varepsilon\|_q^q
&=A_\varepsilon^q\,n\omega_n\varepsilon^n B(n,q+1),\\
\|u_\varepsilon\|_q
&=\omega_n^{-1/p}\bigl[n\omega_n B(n,q+1)\bigr]^{1/q}
\varepsilon^{\,1-n/p+n/q}.
\end{aligned}
$$

因此真正决定极限的是

$$
s(q)=1-\frac np+\frac nq.
$$

令 $p^*=np/(n-p)$，则 $s(q)=0$ 恰好等价于 $q=p^*$。于是当 $\varepsilon\downarrow0$ 时：

$$
q<p^*\Longrightarrow \|u_\varepsilon\|_q\to0,
\qquad
q=p^*\Longrightarrow \|u_\varepsilon\|_q\text{ 保持尺度},
\qquad
q>p^*\Longrightarrow \|u_\varepsilon\|_q\to\infty.
$$

这只是尺度的必要性/障碍诊断，不给出 Sobolev 不等式的 sharp constant。帽函数是 $W^{1,p}$ 中的 Lipschitz 代表，不是 $C^\infty$ 函数；用尺度相称的卷积平滑可在 $W^{1,p}$ 中逼近它，并保留上述幂指数，但平滑过程本身不产生 sharp 常数。

<div class="learning-lab" data-learning-lab="sobolev-scaling" markdown="1">

**JavaScript 失效时的静态后备：**取默认 $n=3,p=2,\varepsilon=1$，于是 $\omega_3=4\pi/3$、$p^*=6$、$A_1=\sqrt{3/(4\pi)}$，且 $\|Du_1\|_2=1$、$|\operatorname{supp}u_1|=4\pi/3$。对任意 $q\geq1$，

$$
\|u_\varepsilon\|_q
=\left(\frac{3}{4\pi}\right)^{1/2}
\bigl[4\pi B(3,q+1)\bigr]^{1/q}
\varepsilon^{-1/2+3/q}.
$$

读三行即可复核临界性：$q=2$ 的指数是 $1$，$q=6$ 的指数是 $0$，$q=8$ 的指数是 $-1/8$。同一预算下把 $\varepsilon$ 从 $1$ 缩到 $1/4$ 时，支撑体积变为原来的 $1/64$，振幅变为原来的 $2$ 倍，而梯度 $L^2$ 范数仍为 $1$。这张表是精确公式的静态读法，不是对一般函数的 sharp Sobolev 常数声明。

| 量 | 精确账本 | 默认例的 $\varepsilon$ 指数 |
|---|---|---:|
| 梯度预算 | $\|Du_\varepsilon\|_p=1$ | $0$ |
| 支撑体积 | $\omega_n\varepsilon^n$ | $n$ |
| 峰值 | $\omega_n^{-1/p}\varepsilon^{1-n/p}$ | $1-n/p$ |
| $L^q$ 范数 | $\omega_n^{-1/p}[n\omega_nB(n,q+1)]^{1/q}\varepsilon^{s(q)}$ | $s(q)=1-n/p+n/q$ |

</div>

### 3. 误区与边界：同一个 $p^*$ 不能替代所有嵌入定理

- **$\mathbb R^n$ 的齐次 GNS。** 当 $1\leq p<n$，对 $u\in C_c^\infty(\mathbb R^n)$（再以齐次范数完备化）有 $\|u\|_{L^{p^*}}\leq C\|Du\|_{L^p}$。右侧只看梯度，是尺度不变的齐次陈述；一般 $W^{1,p}$ 范数还包含 $\|u\|_{L^p}$，不能把两种语境混写。
- **有界 Lipschitz 域。** 对 $1\leq p<n$，$W^{1,p}(\Omega)\hookrightarrow L^q(\Omega)$ 对 $q\leq p^*$ 成立，且 $q<p^*$ 时紧；$p=n$ 时对每个有限 $q$ 有嵌入/紧嵌入但一般没有 $L^\infty$ 嵌入；$p>n$ 时由 Morrey 得到 Hölder 连续代表，并且可在较低 Hölder 指数上得到紧嵌入。域的有界性和 Lipschitz 边界是这些版本的条件，不是装饰。
- **临界维度 $p=n$。** 此时 $p^*$ 不应写成一个有限目标指数。常用结论是所有有限 $L^q$，以及带有有界域、零迹或归一化等条件的 Trudinger–Moser 型指数可积；齐次版本涉及 BMO 等临界空间。它不等于一般的 $L^\infty$ 控制。
- **$p>n$。** Morrey 的 Hölder 指数是 $\alpha=1-n/p$，需要把域、局部版本或全局 $W^{1,p}$ 语境说清；这与 $p<n$ 的“升可积性”不是同一结论。
- **Poincaré 的常数自由度。** $\|Du\|_p$ 是半范数，常数函数是核。必须用零迹、零均值或其他钉住条件消掉常数自由度，并在有界（通常还要求连通）域上使用相应版本。
- **迹与零迹。** 下面的迹句子是 $k=1$、$1\leq p<\infty$、有界 Lipschitz 域的版本：$T:W^{1,p}(\Omega)\to L^p(\partial\Omega)$ 有界，$W_0^{1,p}=\ker T$。更高阶 $k$ 需要相应的高阶迹数据与边界正则性，不能由这一行自动推出。

### 4. 证明映射：实验每一行对应哪一步？

1. 极坐标把径向积分写成 $n\omega_n\int_0^\varepsilon f(r)r^{n-1}dr$；换元 $r=\varepsilon t$ 产生支撑体积的 $\varepsilon^n$。
2. 帽函数在球内的径向斜率是 $A_\varepsilon/\varepsilon$；把它的 $p$ 次方与球体积相乘，正好得到梯度预算的三个幂次 $A_\varepsilon^p\varepsilon^{-p}\varepsilon^n$。
3. $L^q$ 账本剩下的无量纲积分是 $B(n,q+1)$；所有几何常数进入前面的系数，所有缩放信息集中到 $s(q)$。
4. 将 $s(q)=0$ 解为 $q=np/(n-p)$，这解释了“临界指数”为什么不是凭记忆指定的。真正的 GNS 证明还需要分析估计；本实验只映射尺度和反例机制，不证明定理，也不声称帽函数达到最优常数。

### 5. 迁移问题：换测试族时，哪一笔账会改变？

把帽函数换成 $u_\varepsilon(x)=\varepsilon^{-a}\phi(x/\varepsilon)$，其中 $\phi$ 固定且光滑紧支撑。请先推导 $\|Du_\varepsilon\|_p$ 的指数 $1-a-n/p$，再问：选择哪个 $a$ 才能固定梯度预算？在这个选择下，$\|u_\varepsilon\|_q$ 的指数是否仍为 $1-n/p+n/q$？最后说明：当 $p=n$ 时为什么这套“解出有限 $p^*$”的读法停止，当 $p>n$ 时为什么 Morrey 连续性取代了同一类临界 $L^q$ 叙事；若把定义域改成有界 Lipschitz 域，哪些全空间缩放会被边界截断？

</section>

## 1. 定义与基本性质

**定义**（$1\leq p<\infty$）$W^{k,p}(\Omega) = \{u \in L^p : D^\alpha u \in L^p,\ |\alpha| \leq k\}$（弱导数，pde2-01），配范数

$$
\|u\|_{W^{k,p}} = \Big(\sum_{|\alpha|\leq k}\|D^\alpha u\|_{L^p}^p\Big)^{1/p}
$$

**定理（完备性）** $W^{k,p}$ 是 Banach 空间；$p = 2$ 时记 $H^k = W^{k,2}$，是 **Hilbert 空间**。
**【证明】** Cauchy 列的各阶弱导数各自在 $L^p$ 中 Cauchy（范数控制）⇒ 各有极限（实变 III 完备性）；弱导数定义中的积分等式对极限过关（Hölder 控制）⇒ 极限函数的弱导数恰是导数们的极限。$\blacksquare$（"弱导数与极限交换"这份从容正是弱定义的回报——经典导数做不到。）

**$H = W$ 定理（Meyers–Serrin，$1\leq p<\infty$）【引用】**：$C^\infty(\Omega)\cap W^{k,p}(\Omega)$ 在 $W^{k,p}$ 中稠密——Sobolev 函数可由光滑函数按 Sobolev 范数逼近（实变 III 的“完备化”叙事再现）。**边界零值空间** $W_0^{k,p}$ 定义为 $C_c^\infty(\Omega)$ 的闭包；只有在边界与阶数满足迹定理的条件时，才能把它进一步翻译成相应迹数据为零。对本页后文的有界 Lipschitz 域和 $k=1$，这正是齐次 Dirichlet 边界条件的容身处。

## 2. Sobolev 嵌入定理（本页顶点）

**问题**：$u \in W^{1,p}(\mathbb{R}^n)$——一阶导数 $L^p$ 可积——$u$ 本身能好到什么程度？答案由 $p$ 与 $n$ 的赛跑决定：

**定理（齐次 Gagliardo–Nirenberg–Sobolev，$1\leq p<n$，$\mathbb R^n$）** 对 $u\in C_c^\infty(\mathbb R^n)$，并延拓到相应的齐次 Sobolev 空间，

$$
\|u\|_{L^{p^*}} \leq C\|Du\|_{L^p}, \qquad p^* = \frac{np}{n - p}
$$

这是只由梯度控制的齐次陈述。若讨论一般的 $W^{1,p}$ 范数，控制量是 $\|u\|_{L^p}+\|Du\|_{L^p}$；在全空间和有界域之间还要分别检查定义域与边界条件。指数 $p^*>p$ 给出**可积性升级**。
**【骨架】**（$p = 1$ 核心情形）：沿每个坐标轴 $|u(x)| \leq \int|\partial_i u|\,dx_i$（微积分基本定理弱版），$n$ 个不等式相乘开 $\frac{1}{n-1}$ 次方、逐变量用广义 Hölder 积分——纯粹的"多轴 Fubini + Hölder 体操"；一般 $p$ 对 $|u|^\gamma$ 套用并选 $\gamma$ 配平指数。$\blacksquare$
（指数 $p^*$ 不用背：**量纲分析**——对 $u(\lambda x)$ 两边算标度，唯一能让不等式标度不变的指数就是 $p^*$。本科建模页的量纲法在纯分析里执勤。）

**定理（Morrey，$p > n$）** 在合适的有界 Lipschitz 域（或局部版本）上，$W^{1,p} \hookrightarrow C^{0,\alpha}$，$\alpha = 1 - \frac np$：**导数可积性够高 ⇒ 函数有 Hölder 连续代表**。这不是 $p<n$ 时的 $L^{p^*}$ 结论。
**【骨架】** 球平均比较：$|u(x) - u(y)|$ 由 $|Du|$ 在双球上的积分平均控制（极坐标 + Hölder），$p > n$ 恰使奇性积分收敛。$\blacksquare$

**分水岭读法**（记这张图不记指数；$p=n$ 不提供一个有限的 $p^*$）：

$$
p < n:\ \text{升可积性};\qquad p = n:\ \text{临界（有限 }L^q\text{/指数可积，非一般 }L^\infty\text{）};\qquad p > n:\ \text{变连续}
$$

一维（$n = 1$）时 $W^{1,1}$ 已嵌入连续函数——绝对连续（实变 II 的 N–L 条件）原来是 Sobolev 嵌入的最低维特例；维数越高，"导数可积"越不值钱——**维数灾难的分析学形态**。

**定理（Rellich–Kondrachov 紧嵌入）【引用】** 在有界 Lipschitz 域上，若 $1\leq p<n$，则 $W^{1,p}\hookrightarrow L^q$（$q<p^*$）是**紧算子**；若 $p=n$，每个有限 $q$ 都是紧嵌入；若 $p>n$，则在 $0\leq\beta<1-n/p$ 时有到 $C^{0,\beta}$ 的相应紧嵌入。这里的 $p^*$ 只属于 $p<n$ 的分支。**变分法的氧气**：极小化序列凭它抽出收敛子列（泛函 I"无穷维闭球不紧"的困境，被"多一阶导数的控制"局部破解——紧性是花导数买来的）。

## 3. 迹与 Poincaré 不等式

**迹定理【引用】**（$k=1$、$1\leq p<\infty$）：有界 Lipschitz 域上存在有界线性算子 $T: W^{1,p}(\Omega) \to L^p(\partial\Omega)$ 延拓"取边界值"——$L^p$ 函数本无逐点边界值（边界零测！），**一阶弱导数恰好买回"在边界上有意义"**；$W_0^{1,p} = \ker T$（§1 的定义与直觉对齐）。更高阶 $k$ 的迹还包括导数的边界数据，需另加假设。

**定理（Poincaré 不等式）** 有界 Lipschitz 域、$1\leq p<\infty$、$u \in W_0^{1,p}$：

$$
\|u\|_{L^p} \leq C(\Omega)\,\|Du\|_{L^p}
$$

**【证明（矩形域情形）】** 一维基本定理 $u(x) = \int_{a}^{x_1}\partial_1 u$（边界为零起步），Hölder 给 $|u|^p \leq C\int|\partial_1 u|^p dx_1$，积掉其余变量。$\blacksquare$
**地位**：**"钉住边界后，函数大小由导数完全控制"**——下一页椭圆方程强制性（coercivity）的直接来源；若不取零迹，则通常改成 $\|u-u_\Omega\|_{L^p}\leq C\|Du\|_{L^p}$（连通域）或加入均值/其他钉住条件。特征值语言里 $C(\Omega)^{-2}$ 联于 Laplace 首特征值（本科 pde-01 的 $\lambda_1$）——最优常数是个谱问题。

## 4. 练习与要点

**例 1（归属判断）** 取 $a>0$、$1\leq p<n$，令 $u = |x|^{-a}$（$\mathbb{R}^n$ 的单位球上）。此时 $u \in W^{1,p} \iff a < \frac{n-p}{p}$（极坐标积分两条：$u$ 与 $|Du| \sim |x|^{-a-1}$ 各自 $L^p$）——**奇点强度与维数、可积指数的三方讨价**，Sobolev 直觉的标准砂纸。$n = 3, p = 2$：$a < \frac12$——点奇性 $|x|^{-1/3} \in H^1$：**$H^1$ 函数可以无界**（$p = 2 < n = 3$ 在分水岭左侧，只升可积不保连续——嵌入定理的反面教材）。

**例 2（量纲法定指数）** 验证 GNS 指数：$u_\lambda(x) = u(\lambda x)$，$\|u_\lambda\|_{L^q} = \lambda^{-n/q}\|u\|_{L^q}$，$\|Du_\lambda\|_{L^p} = \lambda^{1 - n/p}\|Du\|_{L^p}$——两边标度相等 $\iff q = p^*$。**不变量分析替代记忆**（全站第 N 次）。

**例 3（Poincaré 失效面）** 去掉"钉边界"（常数函数：$Du = 0$ 而 $u \neq 0$）或"有界域"（长条上拉伸的鼓包）都使不等式失效——每个假设各挡一个反例：定理条件的"验尸报告"式理解法。$\blacksquare$

---

*下一页：地基完工，开始盖楼——二阶椭圆方程的弱解理论：Lax–Milgram、能量估计与正则性，现代 PDE 三页收官。*
