# 矩阵分析 II · Löwner序、Schur补与矩阵函数

> **本页问题**：两个协方差矩阵“谁更大”是什么意思？消去一组变量以后，剩下的二次型为什么是Schur补？平方、开方和取对数为什么遵守不同规则？
>
> 前置：[矩阵范数与扰动](ma-01-norms-perturbation.html)、[SVD与稳定计算](nla-01-svd-stability.html)。本页先用方向和配方建立判断，再讨论全维度矩阵函数定理。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="matrix-order-functions-learning-title">

## 学习层：先说清楚“比大小”在比较什么

<h3 id="matrix-order-functions-learning-title">同一个方向上的不确定性，能不能同时变小？</h3>

如果随机向量的协方差是 $A$，那么沿方向 $v$ 测量得到的标量方差是 $v^TAv$。说 $A\succeq B$，是说**每一个方向**的这个量都不小于 $B$ 的对应量。它没有要求每一个矩阵元素都更大。

| 你要做的操作 | 先问什么 | 本页如何核对 |
|---|---|---|
| 换测量坐标 | 是否是同一个合同变换？ | 将方向换成 $Xv$ |
| 求逆 | 两个矩阵是否正定？ | 用开方归约到单位矩阵 |
| 消掉变量 | 被消去的块是否有负方向或零方向？ | 配方，再检查范围条件 |
| 对矩阵取函数 | 是逐元素运算还是谱函数？ | 真正计算特征分解与函数矩阵 |
| 宣称普遍保序 | 是否覆盖所有维度、所有合法矩阵？ | 用证明或反例回答，不能只靠一组图 |

实验有三种模型：二维矩阵序与方向扫描、三维分块二次型、五种二维谱函数。每个输入矩阵和实际运算差都可展开；负值不会被显示成零，定义域外的量留空。

<div class="learning-lab" data-learning-lab="matrix-order-functions" markdown="1">

**关闭JavaScript仍可学习。** 下面保留固定输入的完整运行与参考值。交互图在当前浏览器重新运算；静态数据保持其生成时的运行来源。

固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵与计算记录](assets/learning/projects/matrix-order/run-snapshot.json)。正定与函数例采用δ=0.1、t=1；Schur例采用A=diag(4,0)、C=3，耦合分别为(2,0)与(2,1)。单位尺度均为1，凸组合权重为0.5。

| 固定参数下的量 | 参考值 |
|---|---:|
| 正定例A最小特征值 | 0.48196601125 |
| 正定例B最小特征值 | 0.1 |
| 正定例平方差行列式 | -1 |
| 正定例实际负方向二次型 | -0.152610922848 |
| 相容零枢轴的Schur值 | 2 |
| 相容零枢轴的有限最小值 | 2 |
| 相容例枢轴秩 | 1 |
| 相容例候选点实际二次型 | 2 |
| 失配例形式Schur值 | 2 |
| 失配例范围残差范数 | 1 |
| 失配例路径s=10的二次型 | -18 |
| 失配例存在有限最小值（1是0否） | 0 |
| 平方函数差的最小特征值 | -0.152610922848 |
| 指数函数差的最小特征值 | -0.0674036376215 |
| 平方根函数差的最小特征值 | 0.0355464342089 |
| 对数函数差的最小特征值 | 0.11703151374 |
| 负倒数函数差的最小特征值 | 2.87565963755e-16 |
| 平方凸性恒等式的实际缺陷 | 4.96506830649e-16 |

有限数值只描述这些存储矩阵。失配例的形式Schur值不是最小值；函数差中的极小负数或零须结合舍入缺陷和正文定理理解，不能据此否定全维度定理。


</div>

[![矩阵序、消元与函数差的四组证据](assets/img/ma-02-order-ledgers.svg)](assets/img/ma-02-order-ledgers.svg)

图可打开原尺寸。曲线上的采样点帮助观察方向和参数变化；证明中的“任意方向”或“任意维度”由正文论证承担。

</section>

## 1. Löwner序是二次型的偏序

本页理论使用同阶Hermitian矩阵，记共轭转置为 $*$；实对称实验中它就是转置。定义

$$
A\succeq B
\iff A-B\succeq0
\iff v^*(A-B)v\ge0\quad\text{对所有 }v.
$$

若对所有非零 $v$ 都严格大于零，则写 $A\succ B$。谱分解说明半正定等价于全部特征值非负，正定等价于全部特征值正。

这确实是偏序：自反、传递来自二次型；若 $A-B$ 与 $B-A$ 同时半正定，则 $A-B$ 的所有特征值既非负又非正，故 $A=B$。但它不是全序：

$$
\begin{pmatrix}2&0\\0&0\end{pmatrix}
\quad\text{与}\quad
\begin{pmatrix}0&0\\0&2\end{pmatrix}
$$

分别在两个坐标方向上占优，无法比较。沿少数方向测试得到非负，也不足以证明半正定；一个负方向则足以推翻它。

对实对称二阶矩阵

$$
H=\begin{pmatrix}a&b\\b&c\end{pmatrix},
$$

半正定的充要条件是 $a\ge0,c\ge0,ac-b^2\ge0$。仅检查顺序主子式非负不够，例如 $\operatorname{diag}(0,-1)$ 的两个顺序主子式均为零。一般半正定判据需要**所有主子式**非负；正定才可只查顺序主子式严格正。

实验用有限二进制数的精确整数运算判断二阶、三阶存储矩阵的主子式符号，同时另列浮点特征值。这是针对实际存储矩阵的判断，不是对原始测量误差或超越函数真值的区间证明。

## 2. 合同保序，求逆反序

若 $A\succeq B$，则对任何尺寸相容的 $X$，

$$
v^*X^*(A-B)Xv=(Xv)^*(A-B)(Xv)\ge0.
$$

于是 $X^*AX\succeq X^*BX$。$X$ 可以不满秩；不过这时正定可能降成半正定。只有 $X$ 可逆时，才能从变换后的序关系反推原来的序关系。

这里是**合同**，不是普通左乘或右乘；$AB$ 甚至未必Hermitian。合同也不同于保持特征值的相似变换：它保持惯性，即正、负、零特征值的数量，而不保持每个特征值。

接着设 $A\succeq B\succ0$。令

$$
T=B^{-1/2}AB^{-1/2}\succeq I.
$$

因为 $T$ 的特征值至少是1，按谱求逆得到 $T^{-1}\preceq I$。再合同变换：

$$
A^{-1}=B^{-1/2}T^{-1}B^{-1/2}
\preceq B^{-1}.
$$

求逆改变了方向。正定条件既保证逆存在，也让谱归约成立；不能只把它换成“可逆”。标量 $-1\le1$ 的倒数仍是 $-1\le1$，已经否定跨过零点的统一反序规则。

## 3. 即使严格正定，平方也不保序

使用一整族能手算的矩阵：

$$
B_\delta=\begin{pmatrix}1+\delta&0\\0&\delta\end{pmatrix},
\quad
A_{\delta,t}=B_\delta+
t\begin{pmatrix}1&1\\1&1\end{pmatrix},
\quad \delta\ge0,\ t\ge0.
$$

对任意 $v=(v_1,v_2)^T$，

$$
v^T(A_{\delta,t}-B_\delta)v=t(v_1+v_2)^2\ge0.
$$

当 $\delta>0$ 时两个矩阵都正定。但逐项相乘可得

$$
A_{\delta,t}^2-B_\delta^2=
\begin{pmatrix}
2t+2\delta t+2t^2&t+2\delta t+2t^2\\
t+2\delta t+2t^2&2\delta t+2t^2
\end{pmatrix},
$$

其行列式恰为 $-t^2$。因此任意 $t>0$ 都产生一个负特征值：平方在正定域也不保序。

取 $\delta=0,t=1$，得到熟悉的差矩阵

$$
\begin{pmatrix}4&3\\3&2\end{pmatrix}.
$$

取 $v=(1,-3/2)^T$ 则 $v^T(A^2-B^2)v=-1/2$，不用数值特征分解也能给出明确的负方向。方向扫描图显示这个负区域；图中的181个方向不是整个证明。

若两个半正定矩阵交换，它们可以同时酉对角化，此时平方等标量递增函数确实逐坐标保序。这个额外结构解释了为什么只用对角矩阵做实验很容易错过问题。

## 4. Schur补来自一次完整的配方

考虑分块Hermitian矩阵

$$
M=\begin{pmatrix}A&B\\B^*&C\end{pmatrix},
\qquad A\succ0.
$$

固定第二组变量 $y$，将第一组变量 $x$ 的二次项配方：

$$
\begin{pmatrix}x\\y\end{pmatrix}^*
M\begin{pmatrix}x\\y\end{pmatrix}
=(x+A^{-1}By)^*A(x+A^{-1}By)
+y^*Sy,
\quad S=C-B^*A^{-1}B.
$$

第一项非负，且在 $x_*=-A^{-1}By$ 唯一取零。因此

$$
\min_x\begin{pmatrix}x\\y\end{pmatrix}^*
M\begin{pmatrix}x\\y\end{pmatrix}=y^*Sy.
$$

Schur补 $S$ 是允许第一组变量充分调整以后，第二组变量剩下的二次代价。于是 $M\succeq0\iff S\succeq0$；严格正定也同样等价。

同一件事可写成消元矩阵的合同：

$$
L=\begin{pmatrix}I&0\\-B^*A^{-1}&I\end{pmatrix},
\qquad
LML^*=\begin{pmatrix}A&0\\0&S\end{pmatrix}.
$$

若 $A$ 仅可逆而不正定，这个代数等式仍成立，惯性仍可相加；但 $x$ 方向可能向负无穷逃逸，不能再把 $S$ 叫作最小值。

## 5. 零枢轴：广义逆不能替你补上范围条件

当 $A\succeq0$ 可能奇异时，用谱定义Moore–Penrose逆 $A^\dagger$：正特征值取倒数，零特征值仍取零。

设 $z\in\ker A$。沿 $x+sz$ 改变第一组变量时，二次项没有 $s^2$，却可能留下

$$
2s\,\operatorname{Re}(z^*By).
$$

若这个系数非零，选择 $s$ 的符号和大小就能让代价趋向负无穷。所以要对每个 $y$ 都有有限下界，必须满足

$$
\operatorname{range}(B)\subseteq\operatorname{range}(A),
\quad\text{等价于}\quad
(I-AA^\dagger)B=0.
$$

条件成立后，配方改用 $A^\dagger$；最小解为

$$
x_*=-A^\dagger By+z,\qquad z\in\ker A.
$$

于是完整判据为

$$
M\succeq0
\iff
A\succeq0,\quad
(I-AA^\dagger)B=0,\quad
C-B^*A^\dagger B\succeq0.
$$

范围条件不能省。例如 $A=0,B=1,C=1$，广义Schur补等于1，但

$$
M=\begin{pmatrix}0&1\\1&1\end{pmatrix},
\qquad \det M=-1.
$$

实验中的三维模型使用二阶对角枢轴。把第二个枢轴设为零后，可分别令相应耦合为零和非零：前者产生一族平坦的最小解，后者产生线性逃逸。二者都不应被一条“小特征值当零”的规则混成同一情况。

本节的分块与奇异情况可对照[Boyd与Vandenberghe附录A.5.5](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf#page=664)。

## 6. 条件协方差与线性预测：什么时候是同一个量

设中心化随机向量 $(X,Y)$ 有有限二阶矩，联合协方差为

$$
\Sigma=\begin{pmatrix}A&B\\B^T&C\end{pmatrix},
\qquad A\succ0.
$$

令 $R=Y-B^TA^{-1}X$。直接展开协方差可得

$$
\operatorname{Cov}(X,R)=0,\qquad
\operatorname{Cov}(R)=C-B^TA^{-1}B=S.
$$

更一般地，对任何线性预测矩阵 $K$，

$$
\operatorname{Cov}(Y-KX)
=S+(K-B^TA^{-1})A(K-B^TA^{-1})^T\succeq S.
$$

所以Schur补始终是最佳线性预测的残差协方差。当 $(X,Y)$ **联合高斯**时，$X$ 与 $R$ 不相关便独立，才进一步得到与观测值无关的条件协方差

$$
\operatorname{Cov}(Y\mid X)=S.
$$

一般分布没有这一步。取 $X\sim N(0,1)$、$Y=X^2-1$：它们协方差为零，线性预测残差方差为2；但给定 $X$ 后 $Y$ 已经确定，条件方差为0。

对标量联合高斯协方差 $\left(\begin{smallmatrix}4&2\\2&3\end{smallmatrix}\right)$，Schur补为 $3-2^2/4=2$。这里“条件方差2”的读法来自联合高斯条件，不是由矩阵元素自己声明概率分布。

## 7. 谱函数作用于特征值，不是逐元素按计算器

若Hermitian矩阵有谱分解 $A=\sum_\lambda\lambda P_\lambda$，且实函数 $f$ 定义在其谱上，定义

$$
f(A)=\sum_\lambda f(\lambda)P_\lambda.
$$

同一个重特征值对应整个特征子空间的正交投影，所以该定义不依赖子空间中选了哪一组基。对多项式，它与普通矩阵乘法定义一致。

例如

$$
A=\begin{pmatrix}0&1\\1&0\end{pmatrix},\qquad A^2=I,
$$

按指数级数分奇偶项得到

$$
e^A=\cosh(1)I+\sinh(1)A.
$$

这与把每个元素取指数得到的矩阵完全不同。

半正定 $A$ 有唯一半正定平方根；证明可先按谱构造。若另有半正定 $S$ 满足 $S^2=A$，则 $S$ 与 $A$ 交换，并在每个 $A$ 的特征子空间上只能取非负根，因此相同。矩阵对数则在正定域取实Hermitian主值；零特征值不能代入 $\log$ 或求逆。

对一般矩阵，指数仍可由处处收敛的幂级数定义。$AB=BA$ 是 $e^{A+B}=e^Ae^B$ 的充分条件；对任意一般矩阵，它不是必要条件。若对所有邻近零的实数 $t$ 都要求 $e^{t(A+B)}=e^{tA}e^{tB}$，比较二阶系数才会推出 $AB=BA$。参见[Higham的矩阵指数说明](https://nhigham.com/2020/05/28/what-is-the-matrix-exponential/)。

## 8. 开方与对数为什么能保序

“算子单调”要求：在指定实区间内，对任意维度、任意谱落在区间中的Hermitian矩阵，$A\succeq B$ 都推出 $f(A)\succeq f(B)$。

对数的标量积分公式可以直接积分核对：

$$
\log a=\int_0^\infty\left(\frac1{1+s}-\frac1{a+s}\right)\,ds,
\qquad a>0.
$$

按谱作用于正定矩阵，若 $A\succeq B\succ0$，则

$$
\log A-\log B
=\int_0^\infty\big[(B+sI)^{-1}-(A+sI)^{-1}\big]\,ds\succeq0.
$$

每个被积矩阵的正性来自求逆反序。有限维谱演算保证积分收敛，半正定锥对极限封闭，因此不需要假装 $A$ 与 $B$ 可以同时对角化。

平方根可用另一个容易代换验证的公式：

$$
\sqrt a=\frac2\pi\int_0^\infty\frac{a}{a+s^2}\,ds,\qquad a>0.
$$

对每个 $s>0$，

$$
A(A+s^2I)^{-1}=I-s^2(A+s^2I)^{-1}.
$$

求逆反序再次说明右边保序。积分后得到 $A^{1/2}\succeq B^{1/2}$；半正定边界可对 $A+\varepsilon I,B+\varepsilon I$ 取 $\varepsilon\downarrow0$。因此平方根可延到零，$\log$ 与 $-1/t$ 的本页结论仍留在正定域。

这些证明说明“矩阵不交换”不会让所有函数规则都失效：关键是函数有何结构。更完整的函数分类见[Tropp矩阵分析讲义第13、15讲](https://tropp.caltech.edu/notes/Tro22-Matrix-Analysis-LN.pdf#page=117)。

## 9. 导数怎样发现指数不保序

对谱位于函数光滑区间中的Hermitian矩阵，记一阶差商

$$
f^{[1]}(x,y)=
\begin{cases}
(f(x)-f(y))/(x-y),&x\ne y,\\
f'(x),&x=y.
\end{cases}
$$

在 $B=\operatorname{diag}(\lambda_1,\lambda_2)$ 的特征基中，Fréchet导数满足

$$
\big[D f(B)[H]\big]_{ij}=f^{[1]}(\lambda_i,\lambda_j)H_{ij}.
$$

对多项式可从

$$
D(B^k)[H]=\sum_{j=0}^{k-1}B^jHB^{k-1-j}
$$

逐元素推导；指数由收敛幂级数延伸，对数和平方根可由上一节积分求导得到相同形式。这里无需引入“特征向量保持不动”的错误假设。

取 $B=\operatorname{diag}(\delta+1,\delta)$、$H=\left(\begin{smallmatrix}1&1\\1&1\end{smallmatrix}\right)\succeq0$。对指数，

$$
D\exp(B)[H]
=e^\delta\begin{pmatrix}e&e-1\\e-1&1\end{pmatrix}.
$$

其行列式是

$$
e^{2\delta}\big(3e-e^2-1\big)\lt0.
$$

符号可严格核对：指数级数给出 $e>1+1+1/2+1/6=8/3$，而 $x^2-3x+1$ 在 $x\ge8/3$ 递增且起点值为 $1/9>0$。

所以存在固定方向 $v$ 使 $v^*D\exp(B)[H]v\lt0$。由可微性，

$$
v^*\big(e^{B+tH}-e^B\big)v
=t\,v^*D\exp(B)[H]v+o(t)\lt0
$$

对充分小的 $t>0$ 成立。与此同时 $B+tH\succeq B$；取 $\delta>0$ 即得到正定域的反例。数值实验比较真正的函数差、差商和导数，但“小 $t$”的存在由此论证保证。

极小 $t$ 可能在形成 $B+tH$ 或相减时损失精度。实验保留要求的扰动与实际矩阵差，也把导数矩阵的对称差商只计算一次，避免同一个对称元素走两条不一致的舍入路径。

## 10. 不保序，不代表不凸

矩阵凸是另一种量词：

$$
f(\alpha A+(1-\alpha)B)
\preceq\alpha f(A)+(1-\alpha)f(B),
\qquad 0\le\alpha\le1.
$$

平方虽然不保序，却是矩阵凸的，因为

$$
\alpha A^2+(1-\alpha)B^2-
(\alpha A+(1-\alpha)B)^2
=\alpha(1-\alpha)(A-B)^2\succeq0.
$$

这个恒等式保留了 $AB$ 和 $BA$ 两项，不需要交换。它也是实验中第二条独立核对：同一组矩阵能同时否定平方保序、支持平方凸性，没有矛盾。

迹凸比矩阵凸要求更弱。若标量 $f$ 凸，则 $A\mapsto\operatorname{tr}f(A)$ 在谱位于其区间的Hermitian矩阵上凸。一个证明是取 $C=\alpha A+(1-\alpha)B$ 的本征基 $u_i$，先用标量Jensen：

$$
f(u_i^*Cu_i)
\le\alpha f(u_i^*Au_i)+(1-\alpha)f(u_i^*Bu_i).
$$

再把 $u_i$ 展开到 $A$、$B$ 的本征基，分别再用Jensen，求和后便得到迹不等式。这个结论只比较标量迹，不能倒推出每个方向上的矩阵序。

Schur补也能把某些非线性约束改写为分块正性：

$$
C\succeq B^*A^{-1}B
\iff
\begin{pmatrix}A&B\\B^*&C\end{pmatrix}\succeq0,
\qquad A\succ0.
$$

要称为关于决策变量的**线性矩阵不等式**，还须整个分块矩阵对这些变量仿射。把任意非线性函数塞进 $A,B,C$，并不会自动得到LMI。

## 11. 四道迁移题与完整答案

### 题一：半正定判据不能只看顺序主子式

给出一个二阶实对称矩阵，其全部顺序主子式非负，却不是半正定。再解释为什么正定判据没有同样漏洞。

<details class="answer" markdown="1">
<summary>答案：零枢轴隐藏了另一个负方向</summary>

取 $H=\operatorname{diag}(0,-1)$，第一个顺序主子式与行列式都为0，但 $e_2^THe_2=-1$。漏掉的主子式是第二个对角元素 $-1$。严格正定要求顺序主子式全部严格正，消元时不会遇到这种零枢轴，因此Sylvester正定判据仍成立。

</details>

### 题二：只改一个耦合，最小值为何消失

取 $A=\operatorname{diag}(4,0)$、$C=3$，比较 $B=(2,0)^T$ 与 $B=(2,1)^T$。固定 $y=1$，分别求下确界。

<details class="answer" markdown="1">
<summary>答案：广义Schur补相同，范围条件不同</summary>

两种情况都有 $A^\dagger=\operatorname{diag}(1/4,0)$，所以形式上的广义Schur补均为 $3-4/4=2$。

第一种二次型是

$$
4x_1^2+4x_1+3=4(x_1+1/2)^2+2,
$$

在 $x_1=-1/2$、任意 $x_2$ 处达到最小值2。第二种多了 $2x_2$，令 $x_2\to-\infty$ 就无下界。正是第二个耦合落在 $A$ 的零空间方向，破坏了范围条件。

</details>

### 题三：线性预测残差不等于一般条件方差

设 $X\sim N(0,1)$、$Y=X^2-1$。求联合协方差及其Schur补，并与 $\operatorname{Var}(Y\mid X)$ 比较。

<details class="answer" markdown="1">
<summary>答案：零相关不能在非联合高斯时替代独立</summary>

利用正态矩 $E[X]=E[X^3]=0$、$E[X^2]=1$、$E[X^4]=3$，得到

$$
E[Y]=0,\quad
\operatorname{Cov}(X,Y)=0,\quad
\operatorname{Var}(Y)=3-2+1=2.
$$

所以联合协方差是 $\operatorname{diag}(1,2)$，Schur补是2，最优线性预测为零。但 $Y$ 是 $X$ 的确定函数，给定 $X$ 后没有随机性，条件方差为0。联合向量 $(X,Y)$ 不服从联合高斯分布。

</details>

### 题四：比较参数一阶项，区分凸性与单调性

取正文 $B_\delta$ 与 $H=\left(\begin{smallmatrix}1&1\\1&1\end{smallmatrix}\right)$。求平方映射的导数矩阵，说明其不保序，同时写出平方的凸性恒等式。

<details class="answer" markdown="1">
<summary>答案：同一个函数可以不单调而仍然凸</summary>

由乘积法则，

$$
D(B^2)[H]=BH+HB
=\begin{pmatrix}2+2\delta&1+2\delta\\1+2\delta&2\delta\end{pmatrix}.
$$

行列式为 $-1$，因此某个方向的一阶变化为负，即使输入沿 $H\succeq0$ 增大。完整有限扰动的平方差行列式为 $-t^2$，也已给出直接反例。

凸性则比较插值与函数值插值，其差是 $\alpha(1-\alpha)(A-B)^2\succeq0$。它比较的是另一对矩阵，量词与单调性不同，因此两种结论能够同时成立。

</details>

## 12. 把判断方法带到下一门课

在[凸优化与内点法](cvx-04-interior-point.html)中，先检查分块矩阵是否对变量仿射，再用Schur补改写约束；涉及边界秩变化时，把范围条件写出来。

在[统计渐近与估计](as-02-mle-asymptotics.html)中，用方向二次型理解协方差比较；涉及条件分布时，说明联合高斯或其他足以支持该结论的模型条件。

在量子信息里，态和可观测量的正性、对数和迹函数都使用本页的语言；但密度矩阵的支撑、非交换乘积和无穷维极限还有额外条件。本页有限维小实验不替代那些后续理论。

下一页进入[非负矩阵与Perron–Frobenius理论](ma-03-perron.html)。那里的“非负”通常指每个元素非负，与本页按二次型定义的“半正定”是不同概念；进入下一讲前，先写一个能区分两者的例子。

<style>
article:has(#matrix-order-functions-learning-title) .katex{position:relative}
[data-learning-lab="matrix-order-functions"]:not([data-cl-mounted="true"]) td:nth-child(2){white-space:nowrap;font-size:.9em;font-variant-numeric:tabular-nums}
</style>
