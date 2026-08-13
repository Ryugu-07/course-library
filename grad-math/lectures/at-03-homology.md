# 代数拓扑 III · 同调与边界账本

> **对标**：Hatcher §2.1–2.2 ｜ **前置**：at-01/02、高代 IV（商空间）、mfld-02（de Rham 预告）  
> 同调把空间翻译成链复形，再用 \(\ker\partial/\operatorname{im}\partial\) 记录“闭而未填”的障碍。本页同时维护两本账：理论可用 \(\mathbb Z\) 系数讨论定向与 torsion；下方交互实验**明确只在有限二维单纯复形上取 \(\mathbb F_2\) 系数**，只做 GF(2) 线性代数，**不冒充整数同调，也不检测 torsion**。

<div data-learning-page></div>

<figure class="diagram" markdown="1">
![单纯复形 + 边界算子 \partial，同调群数&quot;洞&quot;。](assets/img/at-03-homology.svg)
<figcaption><span class="fig-id">图 at-03.1</span>单纯复形与边界算子：同调不是把“洞”画出来，而是把闭链模掉边界后的代数障碍留下来。</figcaption>
</figure>

<section class="learning-layer" markdown="1">

## 学习层：同一条圈，填得掉还是填不掉？

### 1. 具体谜题：实心与空心三角形

取三个顶点 \(v_0,v_1,v_2\)，按边序

$$
e_{01},\quad e_{12},\quad e_{20}
$$

组成 1-chain

$$
c=e_{01}+e_{12}+e_{20}.
$$

先不要看矩阵，预测两件事：

1. 每个顶点在 \(c\) 的边界里出现几次？在 \(\mathbb F_2\) 中这会留下什么？
2. 若三角形内部有一个 2-simplex \(f_{012}\)，\(c\) 是否属于 \(\operatorname{im}\partial_2\)？若内部为空，答案会不会改变？

关键是：实心与空心的 \(\partial_1\) 完全相同，差别只在 \(C_2\) 和 \(\partial_2\)。因此“是 cycle”与“是 boundary”是两个不同问题。

### 2. 先预测：四个预设的账本

交互默认把三角边界选为 \(c\)，正好把前两个预设拉开：

| 预设 | \((V,E,F)\) | 预期 \((\beta_0,\beta_1,\beta_2)\)（\(\mathbb F_2\)） | 默认 \(c\) 的分类 |
|---|---:|---:|---|
| 实心三角形 | \((3,3,1)\) | \((1,0,0)\) | boundary：\(c=\partial_2 f_{012}\) |
| 只有三角边界 | \((3,3,0)\) | \((1,1,0)\) | homology class：\(c\in Z_1\setminus B_1\) |
| 三角环 + 孤立点 | \((4,3,0)\) | \((2,1,0)\) | homology class |
| 四面体表面 | \((4,6,4)\) | \((1,0,1)\) | boundary：默认链是某个面 \(f_{012}\) 的边界 |

这里的 \(\beta_2=1\) 不是“所有情况下有一个空腔”的同义词；它表示独立的 2-cycle 模掉 3-boundary 后还有一个维度。四面体表面是闭曲面的例子，实验本身没有 \(C_3\)，所以此处 \(\beta_2=\dim\ker\partial_2\)。

### 3. 最小模型：\(Z_1/B_1\) 的矩阵版本

对有限二维单纯复形 \(K\)，实验取

$$
C_2(K;\mathbb F_2)\xrightarrow{\partial_2}C_1(K;\mathbb F_2)\xrightarrow{\partial_1}C_0(K;\mathbb F_2),
\qquad \partial_1\partial_2=0.
$$

若把顶点、边、面分别排成基，\(\partial_1\) 是“顶点 × 边”的 0/1 矩阵，\(\partial_2\) 是“边 × 面”的 0/1 矩阵。对一个边系数向量 \(c\)：

$$
Z_1=\ker\partial_1,\qquad B_1=\operatorname{im}\partial_2,\qquad H_1=Z_1/B_1.
$$

所以界面先问“\(\partial_1c=0\) 吗？”；只有 \(c\in Z_1\) 时，才有资格问它是否在 \(B_1\) 中。三种结果的含义是：

- **not a cycle**：\(c\notin Z_1\)，它连 \(H_1\) 的代表都不是；
- **boundary**：\(c\in B_1\)，所以在商空间 \(Z_1/B_1\) 里是零类；
- **homology class**：\(c\in Z_1\setminus B_1\)，代表一个非零的 \(H_1\) 类。

GF(2) 消元只用“交换行、加另一行”，没有浮点误差。设 \(r_k=\operatorname{rank}_{\mathbb F_2}\partial_k\)，则在本实验的二维截断中

$$
\beta_0=V-r_1,\qquad
\beta_1=E-r_1-r_2,\qquad
\beta_2=F-r_2.
$$

这是逐层 rank–nullity：\(\dim Z_k=\dim C_k-r_k\)，再减去 \(\dim B_k=r_{k+1}\)。

### 4. 动手验证：读图、读矩阵、读分类

在“同调边界账本”中依次做：

1. 保持默认的三角边界链，比较“实心三角形”和“只有三角边界”；
2. 点击一条边，使 \(\partial_1c\) 出现非零顶点，确认它变成 **not a cycle**；
3. 在实心三角形中点击“取第一面边界”，观察一个 2-chain 见证 \(c=\partial_2 b\)；
4. 读 \(\partial_1,\partial_2\) 的 0/1 矩阵、秩、kernel 维数、Betti 数和 Euler 对账；
5. 切到四面体表面，选择一个面边界，再清空或改变边，区分“某面边界”和“整个表面的 2-cycle”。

<div class="learning-lab" data-learning-lab="homology-boundary" markdown="1">

**无 JavaScript 时的静态读法：**本实验固定 \(\mathbb F_2\) 系数，边界矩阵只有 0/1；实心与空心三角形的 \(\partial_1\) 相同，但只有实心者有 \(\partial_2\) 的面列。默认选 \(c=e_{01}+e_{12}+e_{20}\)。

| 预设 | \(\operatorname{rank}\partial_1\) | \(\operatorname{rank}\partial_2\) | \((\beta_0,\beta_1,\beta_2)\) | 默认链 |
|---|---:|---:|---:|---|
| 实心三角形 | 2 | 1 | \((1,0,0)\) | boundary |
| 只有三角边界 | 2 | 0 | \((1,1,0)\) | homology class |
| 三角环 + 孤立点 | 2 | 0 | \((2,1,0)\) | homology class |
| 四面体表面 | 3 | 3 | \((1,0,1)\) | 默认面边界是 boundary |

三角形的公共 \(\partial_1\)（行 \(v_0,v_1,v_2\)，列 \(e_{01},e_{12},e_{20}\)）为

$$
\partial_1=\begin{bmatrix}1&0&1\\1&1&0\\0&1&1\end{bmatrix}.
$$

实心三角形多出

$$
\partial_2=\begin{bmatrix}1\\1\\1\end{bmatrix},\qquad
\partial_1\partial_2=\begin{bmatrix}0\\0\\0\end{bmatrix}\quad\text{in }\mathbb F_2.
$$

因此默认 \(c=(1,1,1)^T\) 满足 \(\partial_1c=0\)；实心情形 \(c=\partial_2(1)\)，空心情形没有面列可供填充。若脚本失败，以上表格、矩阵和分类仍给出完整的手算路径。

</div>

### 5. 误区与边界：两本系数账不能混写

- **\(\mathbb F_2\) 不是 \(\mathbb Z\) 的简写。** 在 \(\mathbb F_2\) 中 \(1=-1\)，所以有向边反向只改一个本来就相同的符号；实验故意忘掉 orientation。它算的是 \(H_k(K;\mathbb F_2)\) 的维数，不是 \(H_k(K;\mathbb Z)\) 的完整结构。
- **Betti 数不检测 torsion。** 整数同调的有限生成分解写成 \(H_k(K;\mathbb Z)\cong \mathbb Z^{\beta_k}\oplus T_k\)，其中 \(T_k\) 是 torsion 子群；\(\beta_k\) 只记录自由部分的秩。只看秩无法区分 torsion。更进一步，\(\mathbb F_2\) 维数还可能受到整数 torsion 的影响：例如 \(\mathbb{RP}^2\) 的 \(H_1(-;\mathbb Z)\cong\mathbb Z/2\)，而 \(H_1(-;\mathbb F_2)\) 有一维，所以不能把 F₂ 的维数直接叫作整数 Betti 数。
- **整数矩阵需要 Smith normal form。** 对 \(\mathbb Z\) 系数，边界矩阵带有 \(\pm1\)，允许的行列变换必须是 unimodular 的；在 \(\mathbb Q\) 或 \(\mathbb R\) 上算 rank 只能看到自由秩，看不到对角元 \(d_i>1\) 产生的 \(\mathbb Z/d_i\) torsion。因此“同调就是线性代数”只有在明确系数是域（本实验是 \(\mathbb F_2\)）时才准确；整数同调要把 Smith normal form 的分解信息保留下来。
- **\(H_2\) 不等于任何空间的“空腔数”。** 定义始终是 \(H_2=Z_2/B_2=\ker\partial_2/\operatorname{im}\partial_3\)。它测 2-dimensional cycles modulo 3-boundaries；闭曲面的基本类是一个重要来源，但一般单纯复形中的 2-cycle 可能是组合性的、非流形的，不能一律命名为空腔。

### 6. 回到定理：为什么边界的边界为零？

整数系数下

$$
\partial[v_0,\ldots,v_k]=\sum_{i=0}^k(-1)^i[v_0,\ldots,\widehat v_i,\ldots,v_k].
$$

在 \(\partial^2\) 中，每个删去两个顶点的 \((k-2)\)-面有两条出现路径；两条路径的符号相反，于是相消。模 2 后符号被忘掉，但每项仍出现两次，而 \(1+1=0\)，所以同样得到 \(\partial^2=0\)。这不是某个预设的数值巧合，而是链复形可以定义同调商空间的结构原因。

### 7. 迁移问题：换系数、换空间、换不变量

1. 把实心三角形的 \(\partial_2=[1,1,1]^T\) 改回整数带向边界，写出带正负号的列；为什么把它逐项模 2 后 orientation 消失？
2. 设计一个整数边界矩阵，其 Smith normal form 有非平凡对角元；说明为什么只算 rational rank 会漏掉一个有限循环群。
3. 对 path-connected 空间 \(X\)，把八字形的 \(\pi_1=F_2\) abelianize，预测 \(H_1\)；再问：如果 \(X\) 不 path-connected，为什么必须逐个分支陈述这个比较？
4. 对一个有 3-simplex 的复形，重新检查 \(\beta_2=\dim\ker\partial_2-\operatorname{rank}\partial_3\)；这一步会怎样改变“面环”的直觉？

</section>

## 1. 单纯链复形：系数先行

设 \(K\) 是有限单纯复形，系数环 \(A\) 可以取 \(\mathbb Z\)，也可以取域 \(\mathbb F_2\)。选定每个单纯形的生成元后

$$
C_k(K;A)=\bigoplus_{\sigma\in K^{(k)}}A[\sigma],
\qquad \partial_k:C_k\to C_{k-1},\qquad \partial_{k-1}\partial_k=0.
$$

当 \(A=\mathbb Z\) 时，\(C_k\) 是自由交换群；选定向后用交替符号定义边界。改变一个 \(k\)-单纯形的 orientation 是把相应基向量乘以 \(-1\)，不会改变整数同调群的同构类型。

当 \(A=\mathbb F_2=\mathbb Z/2\) 时，\(-1=1\)。因此本页实验可把每条边、每个面只看作一个无向基元，边界矩阵是 0/1 矩阵，运算全部模 2。这是一个明确的系数选择，不是“把整数计算省略符号”后仍声称得到同一个群。

同调定义为

$$
H_k(K;A)=\frac{Z_k(K;A)}{B_k(K;A)},\qquad
Z_k=\ker\partial_k,\qquad B_k=\operatorname{im}\partial_{k+1}.
$$

非空复形的 \(H_0(K;\mathbb Z)\) 是各 path-component 的 \(\mathbb Z\) 直和；在 \(\mathbb F_2\) 上则是各连通分支的一维 \(\mathbb F_2\) 直和，所以 \(\beta_0\) 数连通分支。这里的“连通”对单纯复形等价于其 1-skeleton 的连通。

## 2. 矩阵、秩与 Betti 数

在域 \(F\) 上，选定基以后所有问题归结为精确的有限维线性代数。令

$$
r_k=\operatorname{rank}_F(\partial_k),\qquad
\beta_k^F=\dim_F H_k(K;F).
$$

一般公式是

$$
\beta_k^F=(\dim C_k-r_k)-r_{k+1}.
$$

有限二维实验没有 \(C_3\)，因而 \(r_3=0\)，得到

$$
\beta_0=V-r_1,\qquad \beta_1=E-r_1-r_2,\qquad \beta_2=F-r_2.
$$

秩—零化度定理还给出 Euler 对账：

$$
\chi(K)=\sum_k(-1)^k\dim_F C_k
       =\sum_k(-1)^k\beta_k^F.
$$

对整数同调，应把 \(\beta_k\) 理解为 \(H_k(K;\mathbb Z)\) 的自由秩；torsion 不贡献 Euler 特征，但也不会因为 Euler 对得上就自动消失。

## 3. 三角形手算与四面体表面

三角形公共边界矩阵是

$$
\partial_1=\begin{bmatrix}1&0&1\\1&1&0\\0&1&1\end{bmatrix}\quad(\mathbb F_2).
$$

三行相加为零，且任意两行独立，所以 \(\operatorname{rank}\partial_1=2\)。

**实心三角形**再添一个面，

$$
\partial_2=\begin{bmatrix}1\\1\\1\end{bmatrix},\qquad r_2=1.
$$

所以 \((\beta_0,\beta_1,\beta_2)=(3-2,3-2-1,1-1)=(1,0,0)\)。

**只有三角边界**没有 2-simplex，\(r_2=0\)，所以 \((\beta_0,\beta_1,\beta_2)=(1,1,0)\)。同一向量 \((1,1,1)^T\) 仍在 \(\ker\partial_1\)，但没有 \(\partial_2\) 的列可以生成它。

**三角环加孤立点**只是在 \(\partial_1\) 下面多一行零行：\(V=4,E=3,F=0,r_1=2\)，故 \((2,1,0)\)。这说明 \(\beta_0\) 与 \(\beta_1\) 记录的是不同维度的障碍。

**四面体表面**有 \(V=4,E=6,F=4\)。每个顶点—边连通图给 \(r_1=3\)；四个面边界的唯一模 2 关系是“每条边出现两次”的总和关系，故 \(r_2=3\)。于是 \((\beta_0,\beta_1,\beta_2)=(1,0,1)\)。这里的非零 \(H_2\) 类是整个闭表面的组合基本类；一个单独的三角面边界仍是 \(B_1\) 中的 1-chain。

## 4. 公理化红利与比较定理

奇异同调把“选定剖分”换成所有连续奇异单纯形，因此对一般空间有定义，并满足 Eilenberg–Steenrod 公理。本文采用的系数群为固定的 \(G\)，并把 **additivity** 明确约定为不交并的直和：

- **函子性与同伦不变性**：连续映射诱导同调群同态，同伦映射诱导同一个同态；
- **长正合列（exactness）**：一对 \((X,A)\) 有长正合列 \(\cdots\to H_n(A;G)\to H_n(X;G)\to H_n(X,A;G)\to H_{n-1}(A;G)\to\cdots\)；
- **切除（excision）**：在适当闭包条件下，从子空间切掉的部分不改变相对同调；
- **维数公理（dimension）**：\(H_0(\{\ast\};G)\cong G\)，而 \(H_n(\{\ast\};G)=0\)（\(n\ne0\)）；
- **加性公理（additivity）**：对不交并 \(X=\coprod_{\alpha}X_\alpha\)，\(H_n(X;G)\cong\bigoplus_{\alpha}H_n(X_\alpha;G)\)。这里是直和，因为奇异链是有限个奇异单纯形的形式和。

约化同调把维数公理改写成 \(\widetilde H_n(\{\ast\};G)=0\)；它不是装饰，而是在 degree 0 正确表达“一个可缩空间没有约化洞”。

### 4.1 Brouwer 不动点：\(n=1\) 也要用 reduced homology

若连续 \(f:D^n\to D^n\) 没有不动点，可沿着从 \(f(x)\) 经过 \(x\) 的射线取其与 \(S^{n-1}\) 的交点，得到一个 retraction

$$
r:D^n\to S^{n-1},\qquad r|_{S^{n-1}}=\operatorname{id}.
$$

令 \(i:S^{n-1}\hookrightarrow D^n\) 为包含，则 \(r\circ i=\operatorname{id}\)。对所有 \(n\ge1\) 在 \(\mathbb Z\) 系数的**约化同调**上取 degree \(n-1\)：

$$
\widetilde H_{n-1}(S^{n-1};\mathbb Z)\cong\mathbb Z,\qquad
\widetilde H_{n-1}(D^n;\mathbb Z)=0.
$$

于是 \(\widetilde H_{n-1}(r)\circ\widetilde H_{n-1}(i)\) 一方面应为恒等，另一方面因中间群为 0 只能为零，矛盾。特别地，\(n=1\) 时目标是 \(\widetilde H_0(S^0)\cong\mathbb Z\)，而 \(\widetilde H_0(D^1)=0\)；若误用普通 \(H_0(D^1)\cong\mathbb Z\)，这个反证确实会失效。

### 4.2 \(H_1\) 与基本群：先说清连通性

若 \(X\) **path-connected**，选定基点 \(x_0\)，则 Hurewicz 的低维结论给出

$$
H_1(X;\mathbb Z)\cong \pi_1(X,x_0)^{\mathrm{ab}}
 =\pi_1(X,x_0)/[\pi_1(X,x_0),\pi_1(X,x_0)].
$$

同调保留回路的交换化信息：八字形的 \(\pi_1=F_2\) 非交换，而 \(H_1\cong\mathbb Z^2\)。若 \(X\) 不是 path-connected，必须逐个 path-component 说明这条同构；不能把一个未连通空间的所有回路压成一个未经说明的单一基本群。

### 4.3 Mayer–Vietoris、Euler 与持续同调

Mayer–Vietoris 长正合列把 \(X=U\cup V\) 的同调接起来，是分块计算引擎。对球面可用两半球覆盖：交集同伦等价于 \(S^{n-1}\)，长正合列逐维推出

$$
H_k(S^n;\mathbb Z)\cong
\begin{cases}
\mathbb Z,&k=0,n,\\
0,&\text{otherwise},
\end{cases}
$$

（\(n\ge1\)，并按约化版本处理低维边界）。环面则有 \(H_1(T^2;\mathbb Z)\cong\mathbb Z^2\)、\(H_2(T^2;\mathbb Z)\cong\mathbb Z\)。这些整数结论不是本实验的 F₂ 输出，除非另行用系数变换与相应理论证明。

同调还给出三个经典兑现：

1. **Brouwer 不动点定理**的高维反证如上，关键是约化同调在 \(n=1\) 的正确 degree 0 行为；
2. **维数不变性**：去一点后 \(\mathbb R^m\setminus\{0\}\simeq S^{m-1}\)，不同维球面的约化同调不同；
3. **Euler 示性数统一**：\(V-E+F-\cdots\) 与 Betti 数交替和相等，但两者都不能替代整数 Smith 数据。

现代出口是持续同调：让剖分尺度变化，记录每个 \(H_k\) 类的生灭区间。每个尺度仍然要先选系数；“barcode 可计算”不等于“torsion 自动被测到”。

## 5. 整数同调的边界：Smith normal form 与 torsion

在 \(\mathbb Z\) 上，边界矩阵是整数矩阵。对 \(\partial_k\) 做 Smith normal form，使用左右 unimodular 矩阵把它化为

$$
U\partial_kV=\operatorname{diag}(d_1,\ldots,d_r,0,\ldots),\qquad d_i\mid d_{i+1}.
$$

非单位 \(d_i\) 携带有限循环群的 torsion 信息；仅仅在 \(\mathbb Q\) 上行化或只记录一个 rank，会把这些 \(d_i\) 全部抹掉。因而“整数同调也就是线性代数”需要补上 Smith normal form 这句限定：矩阵是输入，整数允许的变换和不变量结构才是答案。

系数换成 \(\mathbb F_2\) 后，\(\mathbb Z\) 的方向符号消失，且模 2 的维数未必等于整数自由秩。实验的优点是 GF(2) 消元快速、透明、适合检验 \(Z_1/B_1\) 的定义；它的边界也同样明确：不返回 \(H_k(K;\mathbb Z)\) 的群分解，不报告 Smith 对角元，不检测 torsion。

## 6. 练习与要点

**例 1（边界账本）** 对空心三角形写出 \(\partial_1\)，验证 \((1,1,1)^T\in Z_1\)，再说明 \(B_1=0\)。切换到实心三角形后写出 \(\partial_2\)，验证同一向量进入 \(B_1\)。

**例 2（球面表面）** 四面体表面的四个面相加是一个 2-cycle：每条边恰出现两次。它代表 \(H_2\) 的非零类；不要把这句话改写为“某个 2-chain 的边界”，因为这里讨论的是 2-chain 自身的边界为零。相反，一个单独面的三条边是某个 2-chain 的边界。

**例 3（系数对照）** 说明为什么 \(\mathbb{RP}^2\) 的整数 \(H_1\cong\mathbb Z/2\) 不能由整数 Betti 数看出，而在 \(\mathbb F_2\) 中会出现一维类。指出实验没有能力区分“整数无 torsion”和“某些 torsion 在模 2 后留下维数”。

**例 4（公理与应用）** 把 Brouwer 反证逐行写成 \(\widetilde H_{n-1}(S^{n-1})\to\widetilde H_{n-1}(D^n)\)，检查 \(n=1\) 的 \(S^0\)；再用 path-connected 假设把八字形的 \(H_1\) 与 \(\pi_1^{ab}\) 对账。

---

*代数拓扑三页收官：at-01 的 \(\pi_1\) 保留非交换回路，at-02 用覆盖与 van Kampen 分治，at-03 用链复形把各维闭链模掉边界；每次都要先写清不变量、系数与适用边界。*
