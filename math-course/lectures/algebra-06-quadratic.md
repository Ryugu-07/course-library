# 高代 VI · 二次型与内积空间

> 高等代数的收官页，两条线在此会师：二次型（合同标准形、正定性——多元极值判别的代数根据）与内积空间（长度、角度、正交——几何回归代数）。顶点是**实对称矩阵的谱定理**，以及它通往机器学习的直通车：主成分分析与奇异值分解。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="algebra06-learning-title">

<h2 id="algebra06-learning-title">学习层：二次型换坐标，保留下来的是什么？</h2>

**先修**：[线性空间与换基](algebra-04-linear-space.html)、[特征值与标准形](algebra-05-eigen.html)。本页以实有限维空间为主；函数空间和无限维投影会另列条件。后续可连接[最小二乘](stat-05-regression.html)、[数值线性系统](num-02-linear-systems.html)和[Hilbert 空间](func-02-hilbert.html)。

### 1. 一个具体的合同实例

实验使用同一组三个矩阵族，参数 $-1.8\le b\le1.8$：

$$A_+=\begin{pmatrix}2&b\\b&2\end{pmatrix},\qquad A_{\pm}=\begin{pmatrix}1&b\\b&-1\end{pmatrix},\qquad A_0=\begin{pmatrix}1&b\\b&b^2\end{pmatrix}.$$

它们分别始终正定、不定、秩为 1 的半正定。第一族的特征值为 $2\pm b>0$；第二族为 $\pm\sqrt{1+b^2}$；第三族因为 $q(x_1,x_2)=(x_1+bx_2)^2$，特征值为 $1+b^2,0$。这三个证明涵盖整个参数区间，不是从画面猜符号。

现在做可逆替换 $x=C_sy$，其中

$$C_s=\begin{pmatrix}1&s\\0&1\end{pmatrix},\qquad B=C_s^{\mathsf T}AC_s,\qquad -1.5\le s\le1.5.$$

若 $A=\begin{pmatrix}a&b\\b&c\end{pmatrix}$，则

$$B=\begin{pmatrix}a&as+b\\as+b&as^2+2bs+c\end{pmatrix}.$$

左右图分别用旧坐标 $x$ 与新坐标 $y$ 画同一等值集合，标记点满足 $y=C_s^{-1}x=(x_1-sx_2,x_2)$。坐标点会移动，**二次型的数值不变**：$x^{\mathsf T}Ax=y^{\mathsf T}By$。这不是线性算子矩阵的相似变换 $C_s^{-1}AC_s$。

### 2. 先预测：合同、惯性与正定

打开实验台前，先写下三个预测：

1. \(x=Cy\) 后二次型的矩阵是 \(C^\mathsf{T}AC\) 还是 \(C^{-1}AC\)？
2. 可逆合同变换一定保留特征值数值，还是只保留正、负、零三类的个数？
3. \(A=\operatorname{diag}(1,-1)\) 能不能通过可逆坐标替换变成正定矩阵？

提交后，实验台会同时列出 \(A\)、合同矩阵 \(C^\mathsf{T}AC\)、相似矩阵 \(C^{-1}AC\) 的谱与惯性指数，并画出 \(q(x,y)=1\) 的真实 SVG 截线。揭示前不会显示任何结果。

### 3. 正式桥：从替换公式到惯性定理

把 \(x=Cy\) 代入 \(x^\mathsf{T}Ax\)，得到

$$
x^\mathsf{T}Ax=y^\mathsf{T}(C^\mathsf{T}AC)y.
$$

若 \(A\) 是实对称矩阵，谱定理给出正交矩阵 \(Q\) 与 \(Q^\mathsf{T}AQ=\operatorname{diag}(\lambda_i)\)。惯性定理进一步断言：对任意可逆 \(C\)，

$$
\operatorname{Inertia}(C^\mathsf{T}AC)=\operatorname{Inertia}(A)=(p,q,r),
$$

其中 \(p,q,r\) 分别是正、负、零特征值的个数（计重数）。合同不变量是符号计数，不是一般意义下的特征值列表；相似变换才保留全部特征值、迹和行列式。

<div class="learning-lab" data-learning-lab="quadratic-forms" markdown="1">

**JavaScript 失效时的静态读法：**取 $b=0.5,s=1$，可逐项复算 $C_s^{\mathsf T}AC_s$。

| 族 | 原矩阵 $A$ | 合同矩阵 $B$ | 惯性 $(p,q,r)$ | $q=1$ |
|---|---|---|---|---|
| 正定 | $\begin{pmatrix}2&1/2\\1/2&2\end{pmatrix}$ | $\begin{pmatrix}2&5/2\\5/2&5\end{pmatrix}$ | $(2,0,0)$ | 椭圆 |
| 不定 | $\begin{pmatrix}1&1/2\\1/2&-1\end{pmatrix}$ | $\begin{pmatrix}1&3/2\\3/2&1\end{pmatrix}$ | $(1,1,0)$ | 双曲线 |
| 半正定 | $\begin{pmatrix}1&1/2\\1/2&1/4\end{pmatrix}$ | $\begin{pmatrix}1&3/2\\3/2&9/4\end{pmatrix}$ | $(1,0,1)$ | 两条平行直线 |

半正定族原等值线为 $x_1+\tfrac12x_2=\pm1$，换坐标后为 $y_1+\tfrac32y_2=\pm1$；取旧点 $(3/4,1/2)$，新坐标为 $(1/4,1/2)$，代入两式都得 1。这里 $\det C_s=1$，因此 $\det B=\det A$；一般可逆合同只有 $\det B=(\det C)^2\det A$，不能把剪切特例误当一般行列式不变。

</div>

### 4. 定理级结论与失败边界

- **定理级**：实对称二次型在可逆合同下由 \((p,q,r)\) 完全分类；正定等价于 \(p=n\)，也等价于所有特征值为正以及 Sylvester 顺序主子式全为正。
- **相似与合同边界**：\(T^{-1}AT\) 描述同一线性映射换基后的矩阵；\(C^\mathsf{T}AC\) 描述同一二次型换坐标后的矩阵。合同不保证一般特征值逐个不变。
- **有限证据**：一张等值线或有限个 \(x\) 的取值不能证明全空间正定；正定命题要求对所有非零 \(x\) 成立，或给出等价的谱、主子式或合同证书。
- **退化边界**：零特征值意味着退化，整体仍可能不定，需要把零惯性指数保留下来；接近零的浮点特征值不能自动当作精确零，必须说明容差或回到精确计算。

### 5. 迁移：从合同走向内积与低秩

1. $H=\operatorname{diag}(0,-1)$ 的两个顺序主子式都是 0。它半正定吗？哪一个主子式暴露了问题？
2. 半正定实验中取 $b=0.5,s=1$，原点 $x=(3/4,1/2)$ 对应哪个 $y$？求 $q$，并给出原矩阵与合同矩阵的零方向。
3. 对 $D=\operatorname{diag}(3,1,0)$ 求一个最优秩不超过 1 的近似，以及谱范数、Frobenius 范数误差。若换成 $\operatorname{diag}(1,1,0)$，Frobenius 最优解还唯一吗？

<details class="answer" markdown="1"><summary>展开三道迁移题答案</summary>

1. 不是：$e_2^{\mathsf T}He_2=-1$。第二个对角元素组成的一阶主子式为 $-1$；它不是左上角的顺序主子式。半正定必须检查全体主子式。
2. $y=C^{-1}x=(1/4,1/2)$；$(3/4+\tfrac12\cdot\tfrac12)^2=(1/4+\tfrac32\cdot\tfrac12)^2=1$。原零方向 $(-1/2,1)$，新零方向 $(-3/2,1)=C^{-1}(-1/2,1)$；零空间方向在坐标里改变，但维数仍为 1。
3. 取 $D_1=\operatorname{diag}(3,0,0)$，两种误差均为 1。对 $\operatorname{diag}(1,1,0)$，前两维任意单位向量 $u$ 都给出最优 $uu^{\mathsf T}$，Frobenius 误差仍为 1；相等的截断边界奇异值导致非唯一。

</details>

</section>

## 1. 二次型与合同

**定义** $n$ 元二次型 $f(x) = x^\top A x$（实数域，约定 $A$ 对称；因为 $x^{\mathsf T}Ax=x^{\mathsf T}(A+A^{\mathsf T})x/2$）。可逆线性替换 $x = Cy$ 后矩阵变为

$$
B = C^\top A\, C
$$

**定义（合同）** $B \simeq A \iff \exists$ 可逆 $C:\ B = C^\top A C$。（对照：相似是 $T^{-1}AT$——**相似 = 换基看变换，合同 = 换坐标看二次型**，第三种标准形理论开张。）

**化标准形三法**：配方法（万能）；初等变换法（对 $A$ 做成对的行列变换）；正交替换法（见 §3，能同时保持几何）。

**定理（惯性定理）** 实二次型的标准形 $\sum_{i=1}^{p} y_i^2 - \sum_{i=p+1}^{p+q} y_i^2$ 中正项数 $p$（正惯性指数）与负项数 $q$ 唯一确定。——**合同关系下的完全不变量是 $(p, q, n - p - q)$**（复数域上只剩秩）。

**为何正负个数不能被换坐标改变？** 在标准形中，正项坐标张成一个 $p$ 维正定子空间。若另有维数大于 $p$ 的子空间处处正定，它必与由负项和零项张成的 $n-p$ 维子空间有非零交点（用上一页维数公式），但该点的二次型值不大于零，矛盾。故 $p$ 是“限制为正定的子空间所能达到的最大维数”；可逆坐标变换双向保持这个性质和维数，$p$ 因而不变。对 $-q$ 同理得负指数不变，最后 $r=n-p-q$。这也解释了符号不变量的几何意义。

## 2. 正定性

<figure class="plot" markdown="1">
<div tabindex="0" role="region" aria-label="三类二次型与剪切图，可横向滚动" style="overflow-x:auto">
<img src="assets/img/algebra-06-quadratic-forms.svg" alt="三种矩阵在相同剪切下的q等于一曲线，蓝为旧坐标金为新坐标" style="min-width:720px;width:100%;display:block">
</div>
<figcaption><span class="fig-id">图 6.1</span>固定 \(b=1/2,s=1\)，三个模型与实验一致；只画 \(q=1\) 的等值线，不把它当作三维曲面。半正定例为秩 1 的平方型，两条平行直线垂直于非零特征方向；一般半定矩阵的正等值集也可能为空。</figcaption>
</figure>

**定义** $f$ 正定 $\iff x \neq 0 \Rightarrow x^\top A x > 0$。（半正定：$\geq 0$。）

**定理（正定判据大集合）** 实对称 $A$ 正定 $\iff$ 正惯性指数 $= n$ $\iff$ 一切特征值 $> 0$ $\iff$ **顺序主子式全 $> 0$**（Sylvester 准则）$\iff \exists$ 可逆 $C:\ A = C^\top C$（"正定 = 某个满秩矩阵的 Gram 矩阵"）。

**顺序主子式为何有效？** 正定矩阵限制在前 $j$ 个坐标组成的子空间上仍正定，其特征值全正，所以行列式 $\Delta_j>0$。反向若所有 $\Delta_j>0$，按顺序配方（等价于对称消元）得到 $A=LDL^{\mathsf T}$，$L$ 可逆，$D$ 的对角元为 $\Delta_j/\Delta_{j-1}$，约定 $\Delta_0=1$；它们全正，故 $x^{\mathsf T}Ax=(L^{\mathsf T}x)^{\mathsf T}D(L^{\mathsf T}x)>0$。半正定时零主元会破坏这条除法，不能把所有严格不等号直接换成非严格号。

半正定的对应版本：特征值 $\geq 0$；$A = C^\top C$（$C$ 不必满秩）；**注意顺序主子式 $\geq 0$ 不是半正定的充分条件**（需全体主子式 $\geq 0$）；例如 $\operatorname{diag}(0,-1)$ 的顺序主子式全为零却不是半正定。

**与优化、统计的连接**：$C^2$ 函数在驻点处 Hessian 正定，可由二阶 Taylor 展开推出严格局部极小；如果梯度不为零，单看 Hessian 不够。在开凸域上，$C^2$ 函数凸当且仅当每一点 Hessian 半正定；沿任意线段限制成一元函数可证明这个判据。核函数的半正定要求对**任意有限样本集**构造的 Gram 矩阵都半正定，只检查一个数据集不够；Mercer 特征展开还另需紧致性、连续性等相应假设。协方差矩阵半正定直接来自 $u^{\mathsf T}\operatorname{Cov}(X)u=\operatorname{Var}(u^{\mathsf T}X)\ge0$，前提是二阶矩存在。

## 3. 内积空间与正交

**定义（实内积空间）** 实线性空间 + 内积 $\langle\cdot,\cdot\rangle$（对称、双线性、正定）。标准例 $\langle x, y\rangle = x^\top y$；函数空间例 $\langle f, g\rangle = \int_a^b fg\,dx$，例如在 $a<b$ 的 $C[a,b]$ 上它是正定的；对一般平方可积函数则要把几乎处处相等者视为同一个元素，才得到 $L^2$ 内积。通常 Euclid 空间特指有限维实内积空间。

长度 $\|x\| = \sqrt{\langle x,x\rangle}$；**Cauchy–Schwarz** $|\langle x, y\rangle| \leq \|x\|\|y\|$（若 $y=0$ 显然；否则 $\|x+ty\|^2\ge0$ 是首项系数为 $\|y\|^2>0$ 的二次式，判别式非正即得结论；等号恰对应线性相关）；夹角、三角不等式随之成立。

**正交基与 Gram–Schmidt 正交化**：任意有限线性无关序列可逐个"减去在前面各向量上的投影"化为正交基：

$$
\beta_k = \alpha_k - \sum_{i<k} \frac{\langle \alpha_k, \beta_i\rangle}{\langle \beta_i, \beta_i\rangle}\beta_i
$$

独立性保证每个 $\beta_i\ne0$，再归一化得标准正交序列。若输入列表相关，某一步余量为零，不能继续除以其平方长度。数值计算还需关注舍入造成的正交性损失，见[数值线性系统](num-02-linear-systems.html)。标准正交基下坐标 = 内积投影 $x_i = \langle v, e_i\rangle$——Fourier 系数公式的有限维原型。

**正交矩阵** $Q^\top Q = I$：列为标准正交基；保内积保长度（等距变换）；$\det Q = \pm 1$（旋转/反射）；逆 = 转置（数值上零成本求逆——正交矩阵是数值计算的宠儿）。

**正交补与投影**：有限维内积空间的任意子空间都有 $V = W \oplus W^\perp$；无限维 Hilbert 空间需 $W$ 闭，普通内积空间不能无条件照搬。向 $W$ 的正交投影是"$W$ 中离 $v$ 最近的点"。🔗 **最小二乘的几何本相**：$Ax = b$ 无解时求 $\min\|Ax - b\|$，即把 $b$ 投影到列空间——法方程 $A^\top A\hat x = A^\top b$ 就是"残差 ⊥ 列空间"的代数写法。残差正交保证最近点唯一，但系数 $\hat x$ 只有在 $A$ 满列秩时唯一；不同系数可以表示同一投影点。

## 4. 谱定理（本页顶点）

**定理（实对称矩阵的谱定理）** 实对称 $A$ 必可**正交对角化**：存在正交矩阵 $Q$，

$$
Q^\top A\, Q = \mathrm{diag}(\lambda_1, \dots, \lambda_n), \qquad \lambda_i \in \mathbb{R}
$$

证明的主线是不断取出一个方向。先在复数域取特征向量 $z\ne0$；$z^*Az=\lambda z^*z$，左边因 $A^*=A$ 为实数，故 $\lambda$ 实。$z$ 的实部或虚部至少一个非零，于是可取实单位特征向量 $q_1$。若 $v\perp q_1$，则 $\langle Av,q_1\rangle=\langle v,Aq_1\rangle=0$，所以 $q_1^\perp$ 对 $A$ 不变；限制在这个低一维空间上仍对称，归纳得到完整正交特征基。不同特征值的方向自动正交；相同特征值内部仍要自行选正交基。

等价的**谱分解**写法：$A = \sum_i \lambda_i\, q_i q_i^\top$——对称矩阵 = 各特征方向上一维投影的加权和。

**双重身份**：对实对称矩阵，正交替换**同时是相似与合同**（$Q^\top = Q^{-1}$）——两大标准形理论在此合流：二次型的正交标准形对角元 = 特征值，正惯性指数 = 正特征值个数。几何应用：二次曲面 $x^\top A x = 1$ 的主轴方向 = 特征向量方向（"主轴定理"）。

## 5. 通往机器学习的两级台阶

**主成分分析（PCA）**：先将每个特征列减去样本均值，对中心化数据 $X\in\mathbb R^{N\times d}$ 取 $\Sigma=X^{\mathsf T}X/N$（若估计总体协方差也可约定除以 $N-1$）。对单位方向 $u$，投影方差为 $u^{\mathsf T}\Sigma u$；按特征值从大到小的正交基展开可知最大值是 $\lambda_1$，之后在其正交补里继续最大化。特征值等于相应方向方差——**"找数据的主轴" = 谱定理的统计应用**。降维即保留大特征值方向。

**奇异值分解（SVD）**：任意（不必方、不必对称）$m \times n$ 实矩阵

$$
A = U \Sigma V^\top
$$

$U, V$ 正交，$\Sigma$ 对角非负（奇异值 $\sigma_i = \sqrt{\lambda_i(A^\top A)}$）。这里 $U$ 为 $m\times m$、$V$ 为 $n\times n$，$\Sigma$ 为 $m\times n$ 的矩形对角矩阵。对 $A^{\mathsf T}A$ 取正交特征向量 $v_i$；当 $\sigma_i>0$ 时定义 $u_i=Av_i/\sigma_i$，由内积计算 $u_i^{\mathsf T}u_j=\delta_{ij}$。将这些 $u_i$ 补成输出空间的正交基；零奇异值对应 $Av_i=0$，不做除零。于是 $Av_i=\sigma_i u_i$ 给出 SVD。**读法：输入正交换坐标 → 各轴伸缩或压到零 → 输出正交换坐标**；正交变化可含反射，不全是旋转。

**Eckart–Young–Mirsky 定理（明确误差是什么）**：设 $\sigma_1\ge\cdots\ge\sigma_r>0$，$0\le k<r$，令 $A_k=\sum_{i=1}^k\sigma_i u_iv_i^{\mathsf T}$。在所有秩**不超过** $k$ 的矩阵中，它同时最小化谱范数和 Frobenius 范数误差：

$$\min_{\operatorname{rank}B\le k}\|A-B\|_2=\sigma_{k+1},\qquad \min_{\operatorname{rank}B\le k}\|A-B\|_F=\sqrt{\sum_{i>k}\sigma_i^2}.$$

若 $k\ge r$，取 $B=A$ 误差为零。谱范数下界可这样看：在 $\operatorname{span}(v_1,\ldots,v_{k+1})$ 中，$B$ 必有一个单位核向量 $v$，故 $\|(A-B)v\|=\|Av\|\ge\sigma_{k+1}$。截断矩阵达到此界。Frobenius 下界也能看清：设 $P$ 是到候选 $B$ 列空间的正交投影，则 $\|A-B\|_F^2\ge\|(I-P)A\|_F^2=\sum_i\sigma_i^2(1-\|Pu_i\|^2)$。权重 $\alpha_i=\|Pu_i\|^2$ 满足 $0\le\alpha_i\le1$、$\sum_i\alpha_i\le k$，所以最多保留前 $k$ 个最大平方奇异值之和；剩下至少是尾部平方和。截断 SVD 达到这个下界。若 $0<k<r$ 且 $\sigma_k>\sigma_{k+1}$，Frobenius 最优近似唯一；相等时可能不唯一。谱范数下即使有这个间隙也不保证唯一，例如 $\operatorname{diag}(3,1)$ 的 $\operatorname{diag}(3,0)$ 和 $\operatorname{diag}(2,0)$ 都有最优误差 1。

这条定理解释给定矩阵的低秩压缩误差；它并不证明神经网络训练更新必然低秩，也不保证任意低秩适配训练目标最优。

## 6. 典型例题

**例 1（正交对角化全流程）** $A = \begin{pmatrix} 2 & 1 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 2\end{pmatrix}$。
*解*：特征多项式 $(\lambda - 1)^2(\lambda - 4)$。$\lambda = 4$：$\xi = (1,1,1)^\top$；$\lambda = 1$：解出二维特征子空间，取基后 **Gram–Schmidt 正交化**（同特征值内部不自动正交！），可以具体选 $q_1=(1,1,1)/\sqrt3$、$q_2=(1,-1,0)/\sqrt2$、$q_3=(1,1,-2)/\sqrt6$，三向量单位化且两两正交，拼成 $Q$。$Q^\top AQ = \mathrm{diag}(4,1,1)$。

**例 2（带参数正定判别）** $f = x_1^2 + x_2^2 + 5x_3^2 + 2tx_1x_2 - 2x_1x_3 + 4x_2x_3$ 正定，求 $t$。
*解*：顺序主子式：$\Delta_1 = 1 > 0$；$\Delta_2 = 1 - t^2 > 0$；$\Delta_3 = \det A = -5t^2 - 4t > 0$。联立得 $-\frac45 < t < 0$。

**例 3（谱分解速算矩阵函数）** 对例 1 的 $A$ 求 $A^{100}$：令 $P_1=\frac13\mathbf 1\mathbf 1^\top=\frac13J$ 为到 $(1,1,1)$ 方向的正交投影，$P_2=I-P_1$，则 $A=4P_1+P_2$。由 $P_i^2=P_i$ 与 $P_1P_2=0$，立即得到 $A^{100}=4^{100}P_1+P_2$。**谱分解把矩阵函数变成特征值函数。**$\blacksquare$

---

## 7. 继续阅读

[MIT 18.065：Eckart–Young 课程](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-7-eckart-young-the-closest-rank-k-matrix-to-a/)继续讨论低秩近似及范数；[Boyd–Vandenberghe《Convex Optimization》§3.1.4](https://www.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf)给出二阶凸性判据及定义域条件。进入高阶应用前，应能解释为什么合同保符号、相似保谱、正交变化才额外保长度。
