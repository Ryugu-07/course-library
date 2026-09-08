# 量子 I · 波函数与基本框架

> **对标**：Griffiths *QM* §1–3 ｜ **前置**：泛函 II（Hilbert 空间——量子力学的数学就是它）、em-03（经典原子之死）、概率线
> 量子力学的基本框架：纯态 = Hilbert 空间中的射线、观测量 = 自伴算符、测量 = 谱投影 + Born 概率、演化 = Schrödinger 方程。你的泛函分析在此整体变现——**量子力学是 Hilbert 空间理论的物理实例化**。

先修自检：能否计算复内积、正交投影和条件概率？若不熟悉，先看[Hilbert 空间与投影](../../math-course/site/func-02-hilbert.html)、[算子与谱](../../math-course/site/func-03-operators.html)、[条件概率](../../math-course/site/prob-01-space-bayes.html)。本页采用理想投影测量；一般测量仪器还需要更广的 POVM/量子操作语言。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="qm-framework-learning-title">

## 学习层：从 Stern–Gerlach 的两束光斑到投影测量

<h3 id="qm-framework-learning-title">1. 具体情境：第二块磁铁会给出什么？</h3>

Stern–Gerlach 装置把银原子束送入**非均匀**磁场；磁矩与场梯度的相互作用把束流分成两个可分辨的空间通道。把其中一个通道选出来，就得到一个可重复制备的二能级输入，例如记作 $\lvert +z\rangle$。现在把第二块分析器绕 $y$ 轴转到方向 $\mathbf n(\theta_m)$：它仍然只有两个输出，记为“$+$”与“$-$”。

这里的箭头是 Bloch 球上对量子态/分析器的参数化，不是说原子在测量前已经带着一个等待被相机揭示的经典自旋方向。实验要比较的是**许多同样制备的原子**在两个输出通道的计数比例。

<h3>2. 先预测：在打开实验前写下四个比例</h3>

先不拖动下面的实验台，预测：

1. $+z$ 输入送入 $z$ 分析器，会不会全走“$+$”通道？
2. 同一个输入改送入 $x$ 分析器，两个通道各占多少？
3. $-z$ 输入再测 $z$，结果是否与 $+z$ 相反？
4. 对 $+z$ 先选择 $+x$，再把分析器转回 $z$，第二次还会不会确定？

不要把“同一次原子先后通过两块装置”与“许多次重复制备的频率”混为一谈：下面的条形宽度表达 Born 概率，不是一段随机动画。

<h3>3. 最小二能级模型：在 x–z 大圆上算概率</h3>

只看 Bloch 球的 $x$–$z$ 大圆（$y=0$），令角度从 $+z$ 朝 $+x$ 测量：

$$
\mathbf n(\theta)=(\sin\theta,0,\cos\theta),\qquad
\lvert +_\theta\rangle=\cos\frac\theta2\lvert +z\rangle+\sin\frac\theta2\lvert -z\rangle.
$$

$\theta_s$ 是制备态的参数，$\theta_m$ 是分析器的 $+$ 方向；$+z,+x,-z$ 分别可用 $0^\circ,90^\circ,180^\circ$ 标记。对自旋算符 $S_{\mathbf n}=\frac\hbar2\,\mathbf n\cdot\boldsymbol\sigma$，理想分析器的投影算符为

$$
P_\pm(\theta_m)=\frac12\left(I\pm\mathbf n(\theta_m)\cdot\boldsymbol\sigma\right).
$$

Born 规则给出本实验的核心数值（角度差可以取任意实数，平方会处理相应的周期性）：

$$
p(+)=\langle P_+\rangle=\cos^2\!\left(\frac{\theta_m-\theta_s}{2}\right),\qquad
p(-)=\langle P_-\rangle=\sin^2\!\left(\frac{\theta_m-\theta_s}{2}\right).
$$

只有相应分支的概率严格大于零时，才能归一化该分支；零概率结果不能作为后续条件态。若在一次理想投影测量中**条件选择**保留“$+$”分支，后续态更新为 $P_+\lvert\psi\rangle/\sqrt{p(+)}$，在这个大圆模型里就是 $\theta_s\leftarrow\theta_m$；保留“$-$”则是 $\theta_s\leftarrow\theta_m+\pi$。按钮不会替你抽一个随机结果，而是让你检查每一个条件分支的后续预测。

<h3>4. 动手实验：调分析器，再选择投影分支</h3>

先用 $+z,+x,-z$ 预设，再拖动分析器角度 $\theta_m$。观察二维大圆上的制备方向与分析器方向、两个概率条和分束示意如何一起变化。点击“保留 $+$”或“保留 $-$”会按投影公理更新当前态；随后把分析器留在原轴再看一次，或转到不相容轴后再看一次。实验只计算公式，不模拟随机抽样，因此每次刷新都给出同样的数值。

<div class="learning-lab" data-learning-lab="quantum-measurement" markdown="1">

**无 JavaScript 时的静态读法：**角度从 $+z$ 朝 $+x$ 计，使用
$p(+)=\cos^2((\theta_m-\theta_s)/2)$、$p(-)=\sin^2((\theta_m-\theta_s)/2)$。表中“选 $+x$”表示第一次测量在 $x$ 轴上**条件保留** $+$ 分支，第二次再测 $z$。

| 制备/历史 | 分析器 | $p(+)$ | $p(-)$ | 条件保留的分支 / 后续态 |
|---|---:|---:|---:|---|
| $+z$ | $z$ | $1$ | $0$ | 保留 $+$ → $+z$ |
| $+z$ | $x$ | $1/2$ | $1/2$ | 保留 $+$ → $+x$（保留 $-$ → $-x$） |
| $-z$ | $z$ | $0$ | $1$ | 保留 $-$ → $-z$ |
| $+z\to$ 选 $+x$ | $z$（第二次） | $1/2$ | $1/2$ | 第一步保留 $+$ → $+x$；第二步未选 |

点击实验中的“保留”是选择性投影后的条件更新，不是把一个本来就有经典方向的粒子“读出来”。

</div>

<h3>5. 误区 / 边界：这套图和按钮没有声称什么</h3>

- **不是隐藏经典箭头**：$\theta_s$ 是二能级纯态的 Bloch 参数；$p(+)\ne0,1$ 并不是装置不够精密，而是量子态对另一投影基的 Born 概率。
- **不是普遍三维自旋模拟**：这里限制在 $y=0$ 的大圆，省略了相位和一般方位角；完整 qubit 还需要 Bloch 球的第三个坐标。
- **不是工程级 Stern–Gerlach 仿真**：真实装置有场形状、速度分布、探测效率和退相干；这里把它们理想化为两个正交投影通道。
- **“塌缩”只作操作性简称**：本页采用理想射影测量/投影公理的教学模型；按钮能裁决的是给定分支下的后续状态更新，不能由此裁决测量问题的本体论。

<h3>6. 回到正式公理：为什么同轴重复确定、不相容轴又有概率？</h3>

投影满足 $P_+^2=P_+$、$P_-^2=P_-$、$P_+P_-=0$ 且 $P_++P_-=I$。因此，若第一次已经条件保留 $+\mathbf n$，紧接着沿同一轴测量：

$$
p(+\mathbf n\mid +\mathbf n)=\langle +\mathbf n\rvert P_+(\mathbf n)\lvert+\mathbf n\rangle=1,\qquad
p(-\mathbf n\mid +\mathbf n)=0.
$$

若在两次之间插入 $+x$ 轴，第一次的选择性投影把后续输入改为 $\lvert+x\rangle$；再测 $z$ 就有

$$
p(+z\mid +x)=\cos^2\frac{90^\circ}{2}=\frac12,\qquad p(-z\mid +x)=\frac12.
$$

密度算符满足 $\rho\ge0$、$\operatorname{tr}\rho=1$；纯态为 $\rho=|\psi\rangle\langle\psi|$，混合态可描述制备的不确定性。令 $p(\pm)=\operatorname{tr}(\rho P_\pm)$，选择性更新为 $\rho\mapsto P_\pm\rho P_\pm/p(\pm)$，要求 $p(\pm)>0$；忽略结果的更新为 $\rho\mapsto P_+\rho P_++P_-\rho P_-$，无需对零概率分支归一化。这两句把实验的“分束—选支—再测”收回到 Born 规则与投影公理，而不把图形当作经典轨迹的证据。

<h3>7. 迁移题：换一个角度，自己闭环</h3>

取初态 $+z$，把分析器调到 $\theta_m=60^\circ$，先手算 $p(+)$ 与 $p(-)$；若条件保留“$-$”，再把分析器调回 $z$，预测第二次的两个概率。然后用 $P_\pm(\theta)$ 验证：为什么这仍然是同一套公理，而不是为 Stern–Gerlach 另造一条经验规则？最后说明这个二维实验遗漏了哪一个 Bloch 球自由度。第一次为“$-$”且第二次为“$+$”的**联合概率**，和上述第二次的条件概率相同吗？

<details class="answer" markdown="1">
<summary>独立验算：条件概率、联合概率与遗漏的相位</summary>

第一次的两概率为 $3/4,1/4$。保留“$-$”后 $\theta_s=240^\circ$，故再测 $z$ 得 $p(+\mid\text{首次}-)=\cos^2(120^\circ)=1/4$，$p(-\mid\text{首次}-)=3/4$。联合概率为 $(1/4)(1/4)=1/16$：分母是全部初始制备次数，而条件概率的分母只是第一次被保留的次数。

也可直接算 $P_-(60^\circ)|+z\rangle=(1/4,-\sqrt3/4)^T$，范数平方 $1/4$；归一化后分量为 $(1/2,-\sqrt3/2)^T$，第一分量平方就是 $1/4$。它与 $|+_{240^\circ}\rangle$ 只差整体负号。

一般纯态可写成 $\cos(\vartheta/2)|+z\rangle+e^{i\varphi}\sin(\vartheta/2)|-z\rangle$；本实验没有自由变化的相对相位 $\varphi$，所以不能探查一般 $y$ 分量。整体相位不改变概率，相对相位会改变另一测量基的概率。

</details>

</section>


<figure class="diagram" markdown="1">
![Stern–Gerlach：非均匀磁场把银原子束分成上下两束的自旋分束与理想投影测量示意。](assets/img/qm-01-stern-gerlach.svg)
<figcaption><span class="fig-id">图 qm-01.1</span>Stern–Gerlach：非均匀磁场把银原子束分成上下两束的自旋分束与理想投影测量示意。</figcaption>
</figure>

## 1. 为什么必须量子（三条实验判决）

黑体辐射（sm-03：能量量子 $\hbar\omega$）；光电效应（光子 $E = \hbar\omega$——光的粒子性）；电子双缝干涉（**单个电子**逐个发射仍积累出干涉条纹——物质的波动性，de Broglie $p = \hbar k$）。合并：**微观对象既非经典粒子也非经典波**——需要新框架。

## 2. 公理体系（配泛函语言对照）

| 公理 | 内容 | 泛函分析对应 |
|---|---|---|
| 态 | 纯态是单位矢量 $\lvert\psi\rangle\in\mathcal H$ 模掉整体相位；一般态用正的迹一密度算符 $\rho$ | Hilbert 空间与迹类算符 |
| 观测量 | 自伴算符 $\hat A$ | 谱定理给实谱与投影值测度；只有纯点谱情形才有完备正交本征系 |
| 测量 | 得本征值 $a_n$，概率 $\langle\psi\rvert P_n\lvert\psi\rangle$（非简并时为 $\lvert\langle a_n\vert\psi\rangle\rvert^2$）；在理想投影模型中按 $P_n$ 更新后续态（非简并时才是唯一的本征态） | 正交投影（泛函 II 投影定理） |
| 演化 | $i\hbar\frac{\partial}{\partial t}\lvert\psi\rangle = \hat H\lvert\psi\rangle$ | 酉群 $e^{-i\hat Ht/\hbar}$（$\hat H$ 不显含时间；时变 $\hat H(t)$ 需用时间有序 $\mathcal T\exp[-\frac{i}{\hbar}\int_0^t\hat H(\tau)\,d\tau]$；保范——概率守恒） |

表中的测量行针对离散本征值。一般自伴算符用谱投影 $P_A(B)$ 描述读数落在 Borel 集 $B$ 的概率 $\operatorname{tr}(\rho P_A(B))$。位置的精确单点通常概率为零；实验记录的是有限区间。符号 $|x\rangle$ 是广义本征态，并不是 $L^2(\mathbb R)$ 中可归一化的矢量。时变无界 Hamiltonian 的传播子还需共同定义域和适当正则性；时间有序指数首先是形式记号。

位置表象：$\psi(x) = \langle x\vert\psi\rangle$，$\hat x = x$、$\hat p = -i\hbar\frac{\partial}{\partial x}$，$|\psi(x)|^2$ = 概率密度（$\mathcal H = L^2$——实变 III 的空间是量子态的家）。**正则对易关系**：

$$
[\hat x, \hat p] = i\hbar
$$

这个等式可先在共同不变稠密核 $\mathcal S(\mathbb R)$（快速衰减光滑函数）上验证，不能对所有 $L^2$ 矢量直接相乘无界算符。

（mech-03 的字典 $\{q,p\} = 1 \to \frac{1}{i\hbar}[\hat x,\hat p]$ 体现正则坐标的对应；任意经典观测量的乘积与泊松括号不能都无损翻译成算符恒等式，还会遇到排序问题。）

**期望值与演化**：$\langle A\rangle = \langle\psi|\hat A|\psi\rangle$；**Ehrenfest 定理【推导】**（Schrödinger 方程代入求导一行）：$\frac{d\langle A\rangle}{dt} = \frac{1}{i\hbar}\langle[\hat A, \hat H]\rangle + \left\langle\frac{\partial\hat A}{\partial t}\right\rangle$。这里假定相关向量在所需算符及乘积定义域内，期望可微；若 $\hat A$ 无显含时间，才没有最后一项。对 $H=p^2/(2m)+V(x)$ 得 $d\langle p\rangle/dt=-\langle V'(x)\rangle$，一般不是 $-V'(\langle x\rangle)$。例如 $V(x)=\lambda x^4/4$，均值为 $\mu$、方差为 $s^2$ 的高斯位置分布有 $\langle V'(x)\rangle=\lambda(\mu^3+3\mu s^2)$；额外项说明平均轨迹需要态的宽度信息。

## 3. 不确定性原理（定理，非哲学）

**定理（Robertson）【推导】** 对归一化态，假定方差有限且处于 $AB$、$BA$ 的定义域（以下使用算符对易子写法）：

$$
\sigma_A\,\sigma_B \;\geq\; \frac{1}{2}\big|\langle[\hat A, \hat B]\rangle\big|
$$

*证*：对 $|f\rangle = (\hat A - \langle A\rangle)|\psi\rangle$、$|g\rangle = (\hat B - \langle B\rangle)|\psi\rangle$ 用 **Cauchy–Schwarz** 得 $\sigma_A\sigma_B=\|f\|\|g\|\ge|\langle f|g\rangle|\ge|\operatorname{Im}\langle f|g\rangle|$。又 $2i\operatorname{Im}\langle f|g\rangle=\langle[A,B]\rangle$，即得结论。$\blacksquare$ 代 $[\hat x, \hat p] = i\hbar$：

$$
\sigma_x\sigma_p \geq \frac{\hbar}{2}
$$

**读法**：这里的下界不是简单的测量技术误差；非对易算符通常不存在共同的完备本征基，因而一般不能同时具有确定值。下界具体依赖态中的对易子期望 $\frac12\big|\langle[\hat A,\hat B]\rangle\big|$；对 $x,p$，还不存在可归一化的共同本征态。Fourier 对偶（数分 IV：窄函数宽频谱）的物理化身——位置与动量互为 Fourier 变换的表象。

## 4. 定态与一般解法

分离变量（pde-01 的方法在量子的主场）：$\hat H\psi_n = E_n\psi_n$（**定态 Schrödinger 方程**——自伴算符的本征值问题：能级 = 谱，泛函 III 的语言完全接管）；当 $H$ 不显含时间，且有完备的离散本征基时，可写

$$
\Psi(x, t) = \sum_n c_n\,\psi_n(x)\,e^{-iE_nt/\hbar}, \qquad c_n = \langle\psi_n|\Psi(0)\rangle
$$

若存在连续谱，须用谱积分 $|\Psi(t)\rangle=\int e^{-iEt/\hbar}\,dP_H(E)|\Psi(0)\rangle$，不能只留下离散求和。这是正交展开（泛函 II Fourier 展开的量子版）：**解量子问题 = 求谱 + 展开初态**。定态的 $|\Psi|^2$ 不随时间变（名字的由来）；动力学来自能级间的相位差拍（例 3）。

## 5. 练习与要点

**例 1（Born 规则手算）** 设 $\psi_1,\psi_2$ 归一且正交，对应不同的 $E_1\ne E_2$，$H$ 不显含时间。 $\Psi = \frac{1}{\sqrt2}\psi_1 + \frac{1}{\sqrt2}\psi_2$：测能量得 $E_1, E_2$ 各半概率；按投影公理更新后续态——紧接着重复同一理想测量必得同值（投影的幂等性；中间不能插入改变该子空间的操作）。期望 $\langle H\rangle = \frac{E_1+E_2}{2}$ 但**单次测量永远得不到这个值**——期望值 ≠ 可能读数：量子概率的第一课。

**例 2（不确定性数量级）** 电子限制在原子尺度 $\sigma_x \sim 10^{-10}$ m：$\sigma_p \geq \frac{\hbar}{2\sigma_x}$ ⇒ 动能 $\sim\frac{\sigma_p^2}{2m} \sim$ eV 级——**原子的尺寸-能量刻度由不确定性原理锁定**（电子不塌进核：压得越紧动能越贵——em-03 经典塌缩悖论的量子解答）。

**例 3（相位差拍）** 上例的复波函数一般给出

$$
|\Psi(x,t)|^2=\tfrac12(|\psi_1(x)|^2+|\psi_2(x)|^2)
+\operatorname{Re}\!\left[\psi_1(x)^*\psi_2(x)e^{-i(E_2-E_1)t/\hbar}\right].
$$

只有选取实波函数时，交叉项才直接写成 $\psi_1\psi_2\cos((E_2-E_1)t/\hbar)$。局部重叠为零处没有拍频项，积分后的总概率始终为 $1$（正交性消去交叉项）。能级差除以 $\hbar$ 是 Bohr **角频率**；出现可见光谱线还需相应耦合矩阵元不为零。

## 原始资料与进一步核查

[MIT 22.51 完整讲义](https://ocw.mit.edu/courses/22-51-quantum-theory-of-radiation-interactions-fall-2012/693972cea9cf9da5e4e9e86fbc72c9e7_MIT22_51F12_Notes.pdf) 第3章讨论公理和重复测量，第7章引入混合态；连续谱与广义本征态可衔接本站算子课程。上方概率例子用二阶投影矩阵即可独立复算。

---

*下一页：把框架跑起来——一维标准问题全家（方阱/隧穿）与谐振子的升降算符法：量子力学最优雅的代数。*
