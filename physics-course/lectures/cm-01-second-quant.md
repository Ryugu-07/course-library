# 凝聚态 I · 二次量化、占据数与两模式相互作用

> **对标**：Altland & Simons §2、Coleman 入门 ｜ **前置**：qft-01、solid-02、qm-03
> 二次量化不是把粒子“变成第二次量子”，而是换一套适合全同粒子的坐标：用 Fock occupation 记录每个模式有几个粒子。先把 boson/fermion 的有限模式代数做精确，再用一个两模式 Hubbard-like ledger 看 hopping、相互作用和总粒子数守恒。有限 demo 不等于热力学极限的强相互作用理论。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="second-quantization-learning-title">

<h2 id="second-quantization-learning-title">学习层：从“有几个”到“能不能再造一个”</h2>

### 1. 直觉案例：全同粒子不需要名字，只需要 occupation

对一组单粒子模式，Fock state 写成

$$
|n_0,n_1,\ldots\rangle.
$$

先预测四件事：

1. boson 的 $a^\dagger|n\rangle$ 因子是 $1$、$n+1$ 还是 $\sqrt{n+1}$？
2. fermion 已有一个粒子时，$c_i^\dagger$ 能否再造一个？
3. 两个 fermion 模式交换次序，态矢会不会只改变名字而不改变符号？
4. hopping $c_0^\dagger c_1+c_1^\dagger c_0$ 会不会改变总数 $N=n_0+n_1$？

boson 可以共享模式，所以 $n=0,1,2,\ldots$；fermion 的反对易代数会直接把 $n_i=2$ 删掉。算符前面的平方根和符号不是装饰：它们正是归一化与交换统计进入计算的地方。

### 2. 形式推导桥：occupation algebra

定义

$$
[a_i,a_j^\dagger]=\delta_{ij},\qquad [a_i,a_j]=0
$$

以及

$$
\{c_i,c_j^\dagger\}=\delta_{ij},\qquad
\{c_i,c_j\}=0.
$$

在规范归一化的占据数基底上，

$$
\begin{aligned}
a_i|n_i\rangle&=\sqrt{n_i}|n_i-1\rangle,&
a_i^\dagger|n_i\rangle&=\sqrt{n_i+1}|n_i+1\rangle,\\
c_i|n\rangle&=(-1)^{\sum_{k<i}n_k}n_i|n-e_i\rangle,&
c_i^\dagger|n\rangle&=(-1)^{\sum_{k<i}n_k}(1-n_i)|n+e_i\rangle.
\end{aligned}
$$

第二行同时显示两件事：$n_i=1$ 时 creation 为零（Pauli exclusion），而模式的 canonical ordering 产生交换符号。实验台会在两个模式间切换并逐项显示 factor，而不是只画一个抽象箭头；fermion slider 的最大值和可见刻度都严格是 $1$，boson 的可见上限只是读图范围。

### 3. 小型相互作用桥：两模式 Hubbard-like ledger

取两个 spinless fermion 模式 $0,1$：

$$
H=-t(c_0^\dagger c_1+c_1^\dagger c_0)
 +\epsilon_0n_0+\epsilon_1n_1+Un_0n_1,
\qquad N=n_0+n_1.
$$

在 canonical basis
$|00\rangle,|10\rangle,|01\rangle,|11\rangle$ 中，

$$
H=
\begin{pmatrix}
0&0&0&0\\
0&\epsilon_0&-t&0\\
0&-t&\epsilon_1&0\\
0&0&0&\epsilon_0+\epsilon_1+U
\end{pmatrix},
\qquad \texttt{[H,N]}=0.
$$

所以 hopping 只在 $N=1$ sector 内交换占据；$U$ 只抬高双占据态。实验台把矩阵动作、$N$ 和能量分开列出，让“相互作用”不再是一个没有单位的标签。

### 4. 模型边界面板

> **边界与误解**
>
> - 两个模式、四个 fermion basis state 是有限代数演示；它不是无限晶格、连续动量、热力学极限或非微扰 Hubbard 相图。
> - boson 的 slider 截止只限制显示范围；公式本身允许任意非负 $n$。fermion 的 $0/1$ 则是精确代数约束，不是显示偏好。
> - $\texttt{[H,N]}=0$ 说明本模型的粒子数守恒，不等于模型已经解释 Mott 转变、超导或所有集体激发。
> - 两模式 spinless interaction 是 Hubbard-like 最小桥梁；真实电子还要加 lattice、spin、long-range terms、填充、极限与相应的 many-body 分析。

### 5. 确定性实验：先过预测门，再切换统计

预测提交后，左侧显示当前 Fock state 的 creation/annihilation factor、总数和精确关系；关系检查会在有限状态集合上组合完整的 state+coefficient 映射，并比较非目标态的系数，而不是只代入一个恒等式。右侧显示四个 basis state 的 Hubbard 动作、$N$ sector、单粒子本征值和 $\texttt{[H,N]}$ 残差。切换 $t$ 或 $U$ 只是在同一个有限模型内改变账本。

<div class="learning-lab" data-learning-lab="second-quantization" markdown="1">

**无 JavaScript 时的静态读法：** 取 fermion state $|1,0\rangle$，操作 mode 1；再取 boson state $|2,1\rangle$，操作 mode 0。

| 账本 | 精确结果 | 读法 |
|---|---|---|
| boson creation | $a_0^\dagger\lvert2,1\rangle=\sqrt3\,\lvert3,1\rangle$ | 可无限占据；因子是 $\sqrt{n+1}$ |
| boson annihilation | $a_0\lvert2,1\rangle=\sqrt2\,\lvert1,1\rangle$ | 因子是 $\sqrt n$ |
| fermion creation | $c_1^\dagger\lvert1,0\rangle=-\lvert1,1\rangle$ | 前面 mode 0 有一个粒子，所以有负号 |
| Pauli 边界 | $c_0^\dagger\lvert1,0\rangle=0$ | 不能双占据同一个 fermion mode |
| 两模式矩阵 | $H_{10,01}=H_{01,10}=-t$ | hopping 保持 $N=1$ |
| 双占据能量 | $E_{11}=\epsilon_0+\epsilon_1+U$ | $U$ 只在 $n_0n_1=1$ 时出现 |
| 守恒检查 | $\texttt{[H,N]}=0$ | 有限矩阵逐项核对，不是热力学极限结论 |

如果交互失效，仍可用这些行检查 creation/annihilation 的归一化、fermion sign、Pauli exclusion 和 number conservation；关系测试还会用真空、双占据和非目标输出态作边界/扰动反例，不要把这张四态表称作完整 Hubbard 理论。

</div>

</section>

## 1. Fock 空间与算符翻译

一次量子化把 $N$ 个全同粒子写成对称或反对称的多体波函数；二次量子化选择一组单粒子模式，把多体态写成 occupation vector。真空 $|0\rangle$ 是所有模式空的 reference，creation/annihilation 在其上生成整个 Fock space。

数算符为

$$
n_i=a_i^\dagger a_i\quad\text{或}\quad n_i=c_i^\dagger c_i,
\qquad N=\sum_i n_i.
$$

单体算符和两体相互作用通常翻译为

$$
\hat T=\sum_{ij}t_{ij}c_i^\dagger c_j,\qquad
\hat V=\frac12\sum_{ijkl}V_{ijkl}c_i^\dagger c_j^\dagger c_lc_k.
$$

“先 annihilate、再 create”是指标顺序的实际读法；fermion 还要跟踪 canonical order 产生的符号。

## 2. 交换统计与 Pauli exclusion

对 fermion，$c_i^{\dagger2}=0$ 直接来自
$\{c_i^\dagger,c_i^\dagger\}=0$。这不是额外写进程序的禁止清单，而是代数作用在 occupation state 上的结果。对 boson，重复 creation 不为零，归一化因子使

$$
\langle n|a_i a_i^\dagger|n\rangle=n+1,\qquad
\langle n|a_i^\dagger a_i|n\rangle=n.
$$

两式相减给 $[a_i,a_i^\dagger]=1$。交互实现采用精确平方根公式；显示上限只服务于可读图形，不应被误读为物理 cutoff 的连续极限。

## 3. 两模式 Hubbard-like 模型

在 $N=0$ sector，$|00\rangle$ 是真空；在 $N=1$ sector，矩阵是

$$
\begin{pmatrix}\epsilon_0&-t\\-t&\epsilon_1\end{pmatrix},
\qquad
E_\pm=\frac{\epsilon_0+\epsilon_1}{2}
\pm\sqrt{\left(\frac{\epsilon_0-\epsilon_1}{2}\right)^2+t^2}.
$$

在 $N=2$ sector，唯一基态 $|11\rangle$ 的能量是
$\epsilon_0+\epsilon_1+U$。由于 hopping 不改变总数，矩阵按 $N$ 分块；这是 number conservation 的最小可见证据。

若把模式解释为两格点、两个 spin、或两个轨道，物理语境会不同，但这张代数表仍然是同一类有限 Fock 账本。真正的凝聚态问题还要研究模式数、填充、边界条件、基态极限和关联函数如何随系统规模变化。

## 4. 三个检查题

**例 1（符号）** 直接算 $c_0^\dagger c_1|0,1\rangle=|1,0\rangle$，而
$c_1^\dagger c_0|1,0\rangle=|0,1\rangle$；改变 canonical basis 顺序会同步改变中间符号约定，不能只看绝对值。

**例 2（双占据）** 对 $|1,0\rangle$ 施加 $c_1^\dagger$ 可以进入 $|1,1\rangle$；再次施加 $c_0^\dagger$ 则为零。$U$ 不是“第二个粒子的质量”，而是双占据矩阵元的相互作用能。

**例 3（边界）** 如果有限两模式 ledger 显示 $\texttt{[H,N]}=0$，它证明的是这个写出的有限矩阵守恒；要讨论 Mott 绝缘体，还要把模型扩展到晶格与热力学极限，并分析相应的 many-body 状态。$\blacksquare$

---

*二次量子化的力量来自代数的可组合性：occupation、交换符号、相互作用和守恒都能落进同一本账。下一步不是把四态模型夸大，而是把模式数、对称性和极限逐层放回物理。*
