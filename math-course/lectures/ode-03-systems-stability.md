# 常微分 III · 线性系统与稳定性

> 一个系统最终回到原点，并不表示它一路都在靠近原点。线性系统把这个差别说得很精确：特征值控制长期命运，特征向量的几何还会控制途中怎样绕行、拉伸和暂时放大。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="ode-stability-learning-title">

## 学习层：同样都“稳定”，为什么一杯水会先晃得更厉害？

<h3 id="ode-stability-learning-title">1. 具体谜题：最终回去，途中会不会越走越远？</h3>

设状态满足 $\dot{\mathbf x}=A\mathbf x$。下面三句话看起来相近，其实层级不同：

1. 每条轨线最终都趋于原点；
2. 从足够近处出发，轨线永远不会跑出指定邻域；
3. 欧氏长度 $\|\mathbf x(t)\|_2$ 从一开始就单调下降。

第一句是渐近吸引，第二句是 Lyapunov 稳定，二者合起来才是渐近稳定；第三句更强。非正规矩阵可以同时满足前两句，却让某些初值先被拉长，再缓慢衰减。

### 2. 先预测：不要先看相图

依次选择“稳定结点”“鞍点”“稳定焦点”“中心”和“非正规瞬态”预设，先判断：

- 所有解是否趋于零？
- 原点是否 Lyapunov 稳定？
- 是否可能出现 $\|\mathbf x(t)\|_2>\|\mathbf x(0)\|_2$？

特别留意中心和零实部 Jordan 块：它们的特征值实部都不为正，却不能据此得到相同结论。

### 3. 最小模型：长期、局部与瞬态三本账

常系数线性系统的解是

$$
\mathbf x(t)=e^{At}\mathbf x_0,
\qquad
e^{At}=\sum_{k=0}^{\infty}\frac{(At)^k}{k!}.
$$

对实 $2\times2$ 矩阵，记 $\tau=\operatorname{tr}A$、$\Delta=\det A$、$D=\tau^2-4\Delta$。特征值为

$$
\lambda_{1,2}=\frac{\tau\pm\sqrt{D}}{2}.
$$

二维连续系统是 Hurwitz 的充要条件为 $\tau<0$ 且 $\Delta>0$，等价于全部特征值实部严格为负。此时原点全局渐近稳定。若 $D<0$，轨线旋转；若 $D>0$，看见的是实特征方向；若 $\Delta<0$，一正一负，必为鞍点。

但长度是否立即下降，要看对称部分

$$
\frac{d}{dt}\frac12\|\mathbf x\|_2^2
=\mathbf x^\mathsf T\frac{A+A^\mathsf T}{2}\mathbf x.
$$

只有对称部分半负定，欧氏长度才对所有初值不增。它不是 Hurwitz 稳定的必要条件。

### 4. 动手验证：同时看相图和长度账本

实验固定一个二维初值，直接计算 $e^{At}\mathbf x_0$。左图显示轨线与方向场，右图显示 $\|\mathbf x(t)\|_2/\|\mathbf x_0\|_2$；账本另列迹、行列式、判别式、特征值、最大放大和最终状态。改变预设或初始方向，核对自己的预测。

<div class="learning-lab" data-learning-lab="ode-stability" markdown="1">

**无 JavaScript 时的静态读法：**以下结论已经覆盖实验的关键边界。

| 预设矩阵 | 特征值 | 长期行为 | 欧氏长度 |
|---|---|---|---|
| $\begin{pmatrix}-1&0\\0&-2\end{pmatrix}$ | $-1,-2$ | 全部趋零 | 单调下降 |
| $\begin{pmatrix}1&0\\0&-1\end{pmatrix}$ | $1,-1$ | 鞍点，不稳定 | 某些方向增长 |
| $\begin{pmatrix}-0.25&-1\\1&-0.25\end{pmatrix}$ | $-0.25\pm i$ | 螺旋趋零 | 单调下降 |
| $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ | $\pm i$ | Lyapunov 稳定但不吸引 | 保持不变 |
| $\begin{pmatrix}-1&8\\0&-2\end{pmatrix}$ | $-1,-2$ | 最终趋零 | 某些方向先放大 |
| $\begin{pmatrix}0&1\\0&0\end{pmatrix}$ | $0,0$ | 非平凡 Jordan 块，不稳定 | 线性增长 |

</div>

### 5. 误区与边界

- **“实部都不大于零就稳定”是错的。**虚轴上的特征值必须是半单的，非平凡 Jordan 块会产生 $t^k$ 增长；只有全部特征值实部严格为负才能保证渐近稳定。
- **Hartman–Grobman 不是一句万能判稳口号。**它只在双曲平衡点附近给出流的拓扑等价；出现零实部特征值时，高阶项可能改变稳定性。
- **相图分类不等于欧氏距离分类。**换一个等价范数或 Lyapunov 二次型，Hurwitz 系统总能找到严格下降的“能量”，但指定的 $\|\cdot\|_2$ 仍可短暂增加。
- **线性化只回答局部问题。**非线性系统远离平衡点后可能遇到别的平衡点、极限环或逃逸区域。

### 6. 回到定理：Lyapunov 方程把谱变成能量

若 $A$ Hurwitz，则对任意正定 $Q$，存在唯一正定 $P$ 满足

$$
A^\mathsf TP+PA=-Q.
$$

于是 $V(\mathbf x)=\mathbf x^\mathsf TP\mathbf x$ 沿轨线严格下降。这个定理解释了为何非正规系统即使欧氏长度先放大，仍有另一把“尺子”能单调记录它走向原点。

### 7. 迁移问题

梯度流在极小点附近的 Jacobian 是负 Hessian；RNN 的离散传播则看特征值模和奇异值。请解释：为什么“谱半径小于 1”描述离散系统的长期命运，却仍不能单独保证每一步的梯度范数都缩小？

</section>

## 1. 化组与矩阵指数

$n$ 阶标量方程可通过 $x_1=y,x_2=y',\dots$ 化为一阶系统。齐次常系数问题

$$
\dot{\mathbf x}=A\mathbf x,\qquad \mathbf x(0)=\mathbf x_0
$$

的唯一解为 $\mathbf x(t)=e^{At}\mathbf x_0$。若 $A=Q\Lambda Q^{-1}$ 可对角化，则 $e^{At}=Qe^{\Lambda t}Q^{-1}$；Jordan 块会额外产生多项式因子。非齐次系统的常数变易公式为

$$
\mathbf x(t)=e^{At}\mathbf x_0+\int_0^t e^{A(t-s)}\mathbf f(s)\,ds.
$$

## 2. 平面线性系统分类

<figure class="plot" markdown="1">
![稳定结点、鞍点、稳定焦点与中心的相图。](assets/img/ode-03-phase-portrait.svg)
<figcaption><span class="fig-id">图 3.1</span>特征值决定长期类型，特征向量和非正规性决定轨线如何进入或离开。</figcaption>
</figure>

| 特征值 | 类型 | 稳定性 |
|---|---|---|
| 两个负实根 | 稳定结点 | 渐近稳定 |
| 两个正实根 | 不稳定结点 | 不稳定 |
| 一正一负 | 鞍点 | 不稳定 |
| $\alpha\pm i\beta,\alpha<0$ | 稳定焦点 | 渐近稳定 |
| $\alpha\pm i\beta,\alpha>0$ | 不稳定焦点 | 不稳定 |
| 纯虚共轭根且半单 | 中心型 | 稳定但不渐近稳定 |

重复或虚轴特征值必须继续检查 Jordan 结构；“连续看实部、离散看模”只在严格不等式的双曲情形最省心。

## 3. 非线性系统与 Lyapunov 方法

对 $\dot{\mathbf x}=F(\mathbf x)$ 的平衡点 $\mathbf x^*$，线性化矩阵为 $J=DF(\mathbf x^*)$。若 $J$ 没有虚轴特征值，则线性化给出局部定性分类；若有零实部特征值，需用高阶项、中心流形或 Lyapunov 方法继续判断。

Lyapunov 直接法寻找 $V(\mathbf x^*)=0$、邻域内 $V>0$ 的函数。若 $\dot V\le0$ 可得到稳定性的条件；若 $\dot V<0$ 可得到渐近稳定。半负定情形要结合 LaSalle 不变性原理，不能仅凭一个等号方向自动宣告趋于平衡点。

## 4. 典型例题

**例 1。** $A=\begin{pmatrix}0&1\\-2&-3\end{pmatrix}$ 的特征值为 $-1,-2$，故为稳定结点，通解可写成两个衰减特征模之和。

**例 2。** $A=\begin{pmatrix}1&-2\\1&-1\end{pmatrix}$ 有 $\tau=0,\Delta=1,D=-4$，特征值为 $\pm i$。该具体矩阵可对角化并产生有界周期轨线；但不能把“纯虚根”脱离半单条件推广到任意矩阵。

**例 3。** 对 $x'=-x+y^2,\ y'=-y+x^2$，取 $V=(x^2+y^2)/2$。在足够小邻域内，三次项被负二次项控制，故 $\dot V<0$，原点局部渐近稳定。

---

*这页把“特征值决定长期命运”补成了完整说法：谱给结局，几何给过程，Lyapunov 函数给证书。*
