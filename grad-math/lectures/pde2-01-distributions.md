# 现代 PDE I · 分布与弱导数

> **对标**：Evans *PDE* §5.2 / Friedlander–Joshi 入门章 ｜ **前置**：本科泛函 I–III、实变 II–III、pde 两页
> 现代 PDE 的第一步是**放宽"解"的定义**：经典解要求足够光滑，但物理与变分法给出的解常常不光滑（激波、尖角、点源）。出路：把求导从函数身上转嫁给**测试函数**——分布理论。δ"函数"从物理系的口头禅升格为严格对象。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="pde2-01-learning-title">

## 学习层：一个“跳跃的导数”怎样通过测试函数验收？

### 1. 先固定弱导数的验收协议

取 $\Omega=(-1,1)$，测试函数 $\varphi\in C_c^\infty(\Omega)$。若 $v$ 是 $u$ 的弱导数，定义要求对每个测试函数都有

$$
\int_{-1}^{1}u(x)\varphi'(x)\,dx
=-\int_{-1}^{1}v(x)\varphi(x)\,dx.
$$

若 $u$ 在 $c$ 处有跳跃 $[u]_c=u(c+)-u(c-)$，分段分部积分会留下

$$
Du=v_{\rm reg}+\sum_c [u]_c\,\delta_c,\qquad
\int u\varphi'=-\int v_{\rm reg}\varphi-\sum_c[u]_c\varphi(c).
$$

这里的边界项不是“数值修正项”：它是分布导数本身的 delta 配对。紧支集让 $x=\pm1$ 的外边界项消失，但内部跳点必须逐一记账。

### 2. 三项预测：先猜符号、点源与证据等级

1. 弱导数定义中，$\int u\varphi'$ 的右侧是 $+\langle Du,\varphi\rangle$ 还是 $-\langle Du,\varphi\rangle$？
2. Heaviside $H=\mathbf 1_{x>0}$ 的导数是普通函数 $0$，还是在 $0$ 处的 $\delta_0$？
3. 一组固定网格上残差很小，能否单独证明对所有 $\varphi\in C_c^\infty$ 的分布恒等式？

实验会比较 $|x|$、$H$ 与 $x+H$：第一者只有普通弱导数 $\operatorname{sign}(x)$；第二者是纯跳跃，$DH=\delta_0$；第三者把 $1$ 与 $\delta_0$ 同时放进公式。测试函数采用解析的紧支集 bump，网格只用于数值核对。

### 3. 静态 fallback：分部积分账本

对任意测试函数 $\varphi$，三种模型的理论账本是

| $u$ | 正则部分 $v_{\rm reg}$ | 跳跃项 | 分布导数 |
|---|---|---|---|
| $\lvert x\rvert$ | $\operatorname{sign}(x)$ | 无 | $\operatorname{sign}(x)$ |
| $H$ | $0$ | $[H]_0\delta_0=\delta_0$ | $\delta_0$ |
| $x+H$ | $1$ | $\delta_0$ | $1+\delta_0$ |

例如 $H$ 的分部积分是 $\int_0^1\varphi'(x)\,dx=-\varphi(0)$，所以

$$
\int H\varphi'=-\langle\delta_0,\varphi\rangle.
$$

脚本中的有限 Simpson 账本逐项显示 $\int u\varphi'$、正则部分 $-\int v_{\rm reg}\varphi$、跳跃贡献 $-\sum [u]_c\varphi(c)$ 和漏掉跳跃项时的残差。$\delta_0(\varphi)=\varphi(0)$ 是精确的定义级配对；窄 box 的 $\delta_\varepsilon$ 只是一种确定的数值逼近。

<div class="learning-lab" data-learning-lab="weak-derivative" markdown="1">

**无 JavaScript 时的静态读法：**在 $[-1,1]$ 上使用紧支集测试函数，分段积分在 $0$ 处拆开。对 $H$，正则项为 0、跳跃项为 $-\varphi(0)$；对 $|x|$，跳跃项为 0、正则项为 $-\int\operatorname{sign}(x)\varphi(x)\,dx$。若只用有限采样点近似这些积分，得到的是当前函数、测试函数和网格的证据，不是“对所有测试函数”的证明。

| 模型 | 弱导数账本 | 漏掉跳跃项会怎样 | 理论边界 |
|---|---|---|---|
| $\lvert x\rvert$ | $\int u\varphi'=-\int\operatorname{sign}(x)\varphi$ | 无额外 delta 残差 | 一阶弱导数是 $L^p_{\rm loc}$ 函数 |
| $H$ | $\int u\varphi'=-\varphi(0)$ | 把 $DH$ 写成 0 会留下 $\lvert\varphi(0)\rvert$ | $DH=\delta_0$，不是普通函数 |
| $x+H$ | $\int u\varphi'=-\int\varphi-\varphi(0)$ | 只保留 1 会漏掉点质量 | $D(x+H)=1+\delta_0$ |

### 4. 定理假设与失效边界

- **测试函数条件**：$\varphi$ 必须光滑且紧支集；若测试函数触及外边界，外边界项不能凭空删除，必须把边界条件写出来。
- **弱导数与分布导数要区分**：$|x|$ 的一阶分布导数仍是局部可积函数，故它有一阶弱导数；二阶导数 $2\delta_0$ 是分布但不是 $L^p_{\rm loc}$ 函数，因而不是通常意义的二阶弱导数。
- **跳跃项的系数**：对分段绝对连续函数，内部跳跃的系数是右值减左值；改变跳跃方向会改变 delta 的符号。
- **证据等级**：脚本的 Simpson 残差、box delta 近似和有限 SVG 只审计选定模型/测试函数/网格；分布恒等式是对所有测试函数的定理级命题，不能由有限网格外推。
</section>

## 1. 动机：经典求导的三处失灵

① 点源：单位点电荷的密度是什么函数？（没有——任何函数积分出不了"集中在一点的质量 1"）；② 激波：守恒律的解在有限时间形成间断，间断处经典导数不存在，但物理演化明明在继续；③ 变分法：能量泛函的极小元先天只有"积分意义的导数"（下一页 Sobolev 空间的成员）。三者共同指向：**需要一种"函数不必逐点可导也能谈导数"的框架**。

## 2. 分布：定义与运算

**测试函数空间** $\mathcal{D}(\Omega) = C_c^\infty(\Omega)$（光滑 + 紧支集——"最好说话的函数"，磨光核保证存在，实变 III 稠密性的主角）。

**定义（分布）** $\mathcal{D}'(\Omega)$ = $\mathcal{D}(\Omega)$ 上的连续线性泛函（连续性按测试函数的一致收敛族语义【引用】细节）。写 $\langle T, \varphi\rangle$。

**两大来源**：局部可积函数 $f \mapsto T_f = \int f\varphi$（普通函数嵌入分布——"分布是函数的推广"由此严格）；测度 $\mu \mapsto \int\varphi\,d\mu$，特例即 **Dirac δ**：

$$
\langle\delta_{x_0}, \varphi\rangle = \varphi(x_0)
$$

——"在 $x_0$ 处采样"这个泛函本身。它不是函数（若 $\delta = T_f$ 则 $f$ 在 $x_0$ 外 a.e. 为零 ⇒ 积分为零，与 $\varphi(x_0) \neq 0$ 矛盾**【证明】**），但作为分布身份完全合法。

**分布导数（本页核心定义）**：把分部积分公式当定义用——

$$
\langle T', \varphi\rangle := -\langle T, \varphi'\rangle
$$

（动机：$f$ 光滑时 $\int f'\varphi = -\int f\varphi'$，边界项被紧支集杀死。）**每个分布无穷可导**——求导的重担全数转嫁给了 $\varphi \in C^\infty$：这是整个理论的杠杆支点。

## 3. 名例三连（必会手算）

**例 A（阶跃函数）** Heaviside $H = \mathbb{1}_{x>0}$：

$$
\langle H', \varphi\rangle = -\int_0^\infty \varphi' = \varphi(0) = \langle\delta, \varphi\rangle \quad\Rightarrow\quad H' = \delta
$$

——"跳一下的导数是个尖峰"，工程口诀的两行证明。

**例 B（折角函数）** $f = |x|$：$f' = \mathrm{sign}(x)$（同法），$f'' = 2\delta$——折角处二阶导集中成点质量；**凸函数的分布二阶导是非负测度**（凸性的分布刻画，优化线呼应）。

**例 C（对数的拉普拉斯）** $\mathbb{R}^2$ 上 $\Delta\big(\frac{1}{2\pi}\ln|x|\big) = \delta$；$\mathbb{R}^3$ 上 $\Delta\big(\frac{-1}{4\pi|x|}\big) = \delta$**【骨架】**（挖去小球 $B_\varepsilon$ 分部积分两次，体积项消失、球面边界项 $\to \varphi(0)$——静电学"点电荷的势"的严格版）。由此定义**基本解**：$\Delta E = \delta$ ⇒ $\Delta(E * f) = f$——**卷积基本解解方程**，热核方法（本科 pde-02）的统一原理。

## 4. 弱导数：分布导数的 $L^p$ 版

**定义** $u \in L^1_{loc}$ 有弱导数 $v = D^\alpha u$：$v \in L^1_{loc}$ 且 $\int u\,D^\alpha\varphi = (-1)^{|\alpha|}\int v\,\varphi$ 对一切测试函数成立。

即：分布导数**恰好还是个函数**时称弱导数（例 B 的 $|x|$ 有一阶弱导数 $\mathrm{sign}$，无二阶弱导数——$\delta$ 不是函数：**弱导数存在与否是函数光滑度的分级线**，下一页 Sobolev 空间按它建制）。

**性质**：唯一（a.e.）；线性；乘积法则对 $C^1$ 因子成立；**磨光逼近**：$u_\varepsilon = \eta_\varepsilon * u$ 光滑且 $D(u_\varepsilon) = (Du)_\varepsilon$、在 $L^p_{loc}$ 收敛**【骨架】**（卷积求导换序 + 实变 III 逼近定理）——"弱导数 = 光滑函数导数的 $L^p$ 极限"，两种观点等价（下一页 $H = W$ 定理的雏形）。

## 5. 练习与要点

**例 1（手算弱导数）** $u(x) = x\mathbb{1}_{x>0}$（ReLU！）：弱导数 $= H(x)$（分部积分验证）；二阶分布导数 $= \delta$，非函数 ⇒ $u \in W^{1,p}$ 而 $\notin W^{2,p}$。**ReLU 网络的"导数"在分布意义下完全合法**——ai 课里含糊带过的"ReLU 在 0 处导数"在此有正式户口（优化 I 次梯度之外的第二种严格化）。

**例 2（分布收敛）** $f_n = \frac{n}{2}\mathbb{1}_{[-1/n, 1/n]} \to \delta$（分布意义）：$\langle f_n, \varphi\rangle \to \varphi(0)$（连续性一行）——"越来越尖的针"的极限身份；同理磨光核 $\eta_\varepsilon \to \delta$：**δ 是一切近似单位元的极限**（概率里的"退化分布"、信号里的"冲激响应"同源）。

**例 3（求基本解的用法）** 解 $-u'' = f$（全直线）：一维基本解 $E = -\frac12|x|$（例 B：$E'' = -\delta$）⇒ $u = E * f = -\frac12\int|x - y|f(y)dy$——验证两次弱求导即得。**"解 = 基本解卷数据"三例合一（Laplace/热/波各有其 $E$）。**$\blacksquare$

---

*下一页：把"有 $k$ 阶弱导数且 $L^p$ 可积"的函数组织成 Banach 空间——Sobolev 空间：嵌入定理、迹定理，现代 PDE 的主舞台。*
