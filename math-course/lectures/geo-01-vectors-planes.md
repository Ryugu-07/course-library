# 解几 I · 向量代数与平面直线

> 解析几何是"用代数算几何"的第一门课，实用核心两块：**三种向量乘积**（每种对应一类几何量）与**平面/直线的方程与位置关系**。它同时是高代的几何素材库与多元微积分的舞台布景——复习定位是把"公式—几何含义"的对照表擦亮。

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
\text{点向式 } \frac{x - x_0}{m} = \frac{y - y_0}{n} = \frac{z - z_0}{p}, \qquad \text{参数式 } \mathbf r = \mathbf r_0 + t\mathbf s
$$

一般式（两平面之交）化点向式：$\mathbf s = \mathbf n_1 \times \mathbf n_2$。

**距离公式全家**（结构统一：投影长）：

- 点到平面：$d = \dfrac{|Ax_1 + By_1 + Cz_1 + D|}{\sqrt{A^2 + B^2 + C^2}}$（差向量在 $\mathbf n$ 上的投影）；
- 点到直线：$d = \dfrac{|\overrightarrow{PM}\times\mathbf s|}{|\mathbf s|}$（平行四边形面积÷底）；
- **异面直线距离**：$d = \dfrac{|(\overrightarrow{M_1M_2},\ \mathbf s_1,\ \mathbf s_2)|}{|\mathbf s_1\times\mathbf s_2|}$（体积÷底面积——混合积的招牌应用）。

**位置关系与夹角**：线线/线面/面面的平行垂直全部翻译成 $\mathbf s, \mathbf n$ 的平行垂直（乘积表检验）；夹角用内积算余弦（线面角与法向量算的是余角——常错点）。

## 3. 典型例题

**例 1（外积定平面）** 过 $A(1,0,0), B(0,2,0), C(0,0,3)$ 的平面：$\mathbf n = \overrightarrow{AB}\times\overrightarrow{AC} = (6, 3, 2)$ ⇒ $6x + 3y + 2z = 6$（也可直接写截距式 $\frac x1 + \frac y2 + \frac z3 = 1$ 对账）。

**例 2（异面距离全流程）** $l_1: \frac{x}{1} = \frac{y}{0} = \frac{z}{0}$（$x$ 轴），$l_2$ 过 $(0,1,0)$ 方向 $(0,0,1)$：$\mathbf s_1\times\mathbf s_2 = (0,-1,0)$，$\overrightarrow{M_1M_2} = (0,1,0)$，混合积 $= -1$ ⇒ $d = 1$。

**例 3（投影点）** 求 $P(2,1,3)$ 在平面 $x + y + z = 3$ 上的投影：过 $P$ 沿 $\mathbf n = (1,1,1)$ 的参数线 $(2+t, 1+t, 3+t)$ 代入平面解 $t = -1$ ⇒ 投影 $(1, 0, 2)$。（"沿法向走到平面"——最小二乘投影的三维具象，高代 VI/泛函 II 的远亲。）$\blacksquare$

---

*下一页：二次曲面——六个标准脸谱与"截痕法"，并与高代 VI 的二次型分类正式对表。*
