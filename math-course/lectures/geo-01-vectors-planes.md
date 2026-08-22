# 解几 I · 向量代数与平面直线

> 解析几何是"用代数算几何"的第一门课，实用核心两块：**三种向量乘积**（每种对应一类几何量）与**平面/直线的方程与位置关系**。它同时是高代的几何素材库与多元微积分的舞台布景——复习定位是把"公式—几何含义"的对照表擦亮。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="geo01-learning-title">

<h2 id="geo01-learning-title">学习层：点、自由向量与位置关系要分层判断</h2>

### 1. 一个具体的直线—平面实例

令

$$
P:\ \mathbf n\cdot(\mathbf x-\mathbf p)=0,\qquad
\mathbf n=(0,0,1),\quad \mathbf p=(0,0,0),
$$

以及

$$
L:\ \mathbf x=\mathbf q+\tau\mathbf d,\qquad
\mathbf q=(1,1,h),\quad \mathbf d=(1,0,k).
$$

这里 \(\mathbf q\) 是一个点的位置，\(\mathbf d\) 是可以平移到任意起点的自由方向向量；它们不是同一种对象。当 \(k\ne0\) 时直线穿过平面，参数为 \(\tau=-h/k\)；当 \(k=0,h\ne0\) 时平行而不相交；当 \(k=0,h=0\) 时整条直线落在平面内。

### 2. 先预测：法向、方向、平行与退化

打开实验台前，先写下三个预测：

1. 把点 \(\mathbf q\) 换成 \(\mathbf q+\mathbf d\) 会改变自由向量 \(\mathbf d\) 吗？点与向量能否直接相加后仍叫同一个几何对象？
2. 若 \(\mathbf n\cdot\mathbf d=0\)，直线是否必然在平面内？还需要检查哪一个点条件？
3. 两个平面法向量平行时，它们一定相交吗；什么额外条件会让它们重合？零法向量或零方向向量又表示什么？

提交后，实验台会揭示点法式、参数式、点积证书、交点参数或重合/平行判定，并用 SVG 显示当前几何截面。结果表在预测完成前保持隐藏。

### 3. 正式桥：两个标量决定直线—平面关系

把直线代入平面方程：

$$
\mathbf n\cdot(\mathbf q+\tau\mathbf d-\mathbf p)=0
\Longleftrightarrow
(\mathbf n\cdot\mathbf d)\tau=-\mathbf n\cdot(\mathbf q-\mathbf p).
$$

若 \(\mathbf n\cdot\mathbf d\ne0\)，有唯一交点；若 \(\mathbf n\cdot\mathbf d=0\)，则还必须看 \(\mathbf n\cdot(\mathbf q-\mathbf p)\)：为零表示直线包含于平面，否则表示平行不相交。

两个平面 \(P_i:\mathbf n_i\cdot\mathbf x=c_i\) 则先看 \(\mathbf n_1\times\mathbf n_2\)：非零给出相交直线方向；平行时比较归一化后的常数 \(c_i\)，相容为重合，不相容为平行。所有这些结论都默认法向量和方向向量是非零的。

<div class="learning-lab" data-learning-lab="vectors-planes" markdown="1">

**JavaScript 失效时的静态 fallback：**固定 \(P:z=0\)，取 \(L:\mathbf x=(1,1,h)+\tau(1,0,k)\)。

| \(h\) | \(k\) | \(\mathbf n\cdot\mathbf d\) | \(\mathbf n\cdot(\mathbf q-\mathbf p)\) | 结论 |
|---:|---:|---:|---:|---|
| \(1\) | \(1\) | \(1\) | \(1\) | 相交，\(\tau=-1\)，交点 \((0,1,0)\) |
| \(1\) | \(0\) | \(0\) | \(1\) | 平行且不相交 |
| \(0\) | \(0\) | \(0\) | \(0\) | 直线包含于平面 |
| 任意 | \(0\)，且 \(\mathbf n=\mathbf0\) | \(0\) | 不可判 | 退化：不是一个合法平面 |

若改做两个平面，平行法向量加上相同比例的常数才是重合；仅凭法向量平行不能跳过常数项检查。

</div>

### 4. 定理级结论与失败边界

- **定理级**：非零法向量定义一个平面，非零方向向量定义一条直线；代入后一次方程的系数与常数同时决定相交、平行、重合或包含。
- **对象边界**：点是位置，向量是位移/方向；法向量垂直于平面，直线方向向量沿直线。把法向量当作平面上的点，或把点的坐标直接当作自由向量，会破坏方程的几何意义。
- **退化边界**：零法向量使 \(0=0\) 或 \(0=c\) 失去唯一平面；零方向向量不定义一条有方向的直线。数值实现中的“零”还必须附带容差。
- **位置关系边界**：点积为零只给出平行/垂直的一部分信息；平行法向量不自动推出重合，必须继续核对常数项和点是否满足方程。

</section>

## 1. 三种乘积：一表定乾坤

| 乘积 | 定义 | 结果 | 几何含义 | 检验什么 |
|---|---|---|---|---|
| 内积 $\mathbf{a}\cdot\mathbf{b}$ | $\lvert\mathbf a\rvert\lvert\mathbf b\rvert\cos\theta$ | 数 | 投影、夹角 | **垂直**（$= 0$） |
| 外积 $\mathbf{a}\times\mathbf{b}$ | 模 $\lvert\mathbf a\rvert\lvert\mathbf b\rvert\sin\theta$，右手定向 | 向量 | **平行四边形面积** + 公垂方向 | **平行**（$= \mathbf 0$） |
| 混合积 $(\mathbf a, \mathbf b, \mathbf c) = (\mathbf a\times\mathbf b)\cdot\mathbf c$ | $3\times3$ 行列式 | 数 | **平行六面体体积**（带定向） | **共面**（$= 0$） |

坐标算法：内积=对应分量乘加；外积=形式行列式 $\begin{vmatrix}\mathbf i & \mathbf j & \mathbf k \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3\end{vmatrix}$；混合积=三行行列式（行列式的几何意义=体积——高代 II 那句话的出生地）。

反交换 $\mathbf a\times\mathbf b = -\mathbf b\times\mathbf a$、不满足结合律；双重外积公式 $\mathbf a\times(\mathbf b\times\mathbf c) = \mathbf b(\mathbf a\cdot\mathbf c) - \mathbf c(\mathbf a\cdot\mathbf b)$（"BAC-CAB"）。

## 2. 平面与直线：方程的四副面孔

**平面**（本质数据：一点 + 法向量 $\mathbf n = (A,B,C)$）：

$$
\text{点法式 } A(x - x_0) + B(y - y_0) + C(z - z_0) = 0 \quad\Longleftrightarrow\quad \text{一般式 } Ax + By + Cz + D = 0
$$

**读方程先读法向量**——平面题的第一反射。三点定平面：两条边向量的外积给 $\mathbf n$。

**直线**（本质数据：一点 + 方向向量 $\mathbf s = (m, n, p)$）：

$$
\text{对称式（仅 }mnp\ne0\text{） } \frac{x - x_0}{m} = \frac{y - y_0}{n} = \frac{z - z_0}{p}, \qquad \text{参数式 } \mathbf r = \mathbf r_0 + t\mathbf s
$$

一般式（两平面之交）化点向式：$\mathbf s = \mathbf n_1 \times \mathbf n_2$。

**距离公式全家**（结构统一：投影长）：

- 点到平面：$d = \dfrac{|Ax_1 + By_1 + Cz_1 + D|}{\sqrt{A^2 + B^2 + C^2}}$（差向量在 $\mathbf n$ 上的投影）；
- 点到直线：$d = \dfrac{|\overrightarrow{PM}\times\mathbf s|}{|\mathbf s|}$（平行四边形面积÷底）；
- **异面直线距离**：$d = \dfrac{|(\overrightarrow{M_1M_2},\ \mathbf s_1,\ \mathbf s_2)|}{|\mathbf s_1\times\mathbf s_2|}$（体积÷底面积——混合积的招牌应用）。

**位置关系与夹角**：线线/线面/面面的平行垂直全部翻译成 $\mathbf s, \mathbf n$ 的平行垂直（乘积表检验）；夹角用内积算余弦（线面角与法向量算的是余角——常错点）。

## 3. 典型例题

**例 1（外积定平面）** 过 $A(1,0,0), B(0,2,0), C(0,0,3)$ 的平面：$\mathbf n = \overrightarrow{AB}\times\overrightarrow{AC} = (6, 3, 2)$ ⇒ $6x + 3y + 2z = 6$（也可直接写截距式 $\frac x1 + \frac y2 + \frac z3 = 1$ 对账）。

**例 2（异面距离全流程）** $l_1:(x,y,z)=(t,0,0)$（等价于 $y=0,z=0$ 的 $x$ 轴），$l_2$ 过 $(0,1,0)$、方向 $(0,0,1)$：$\mathbf s_1\times\mathbf s_2 = (0,-1,0)$，$\overrightarrow{M_1M_2} = (0,1,0)$，混合积 $= -1$ ⇒ $d = 1$。方向分量为零时应使用参数式或直接写恒定坐标，不能制造 $y/0$、$z/0$。

**例 3（投影点）** 求 $P(2,1,3)$ 在平面 $x + y + z = 3$ 上的投影：过 $P$ 沿 $\mathbf n = (1,1,1)$ 的参数线 $(2+t, 1+t, 3+t)$ 代入平面解 $t = -1$ ⇒ 投影 $(1, 0, 2)$。（"沿法向走到平面"——最小二乘投影的三维具象，高代 VI/泛函 II 的远亲。）$\blacksquare$

---

*下一页：二次曲面——六个标准脸谱与"截痕法"，并与高代 VI 的二次型分类正式对表。*
