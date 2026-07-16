# 量子 I · 波函数与基本框架

> **对标**：Griffiths *QM* §1–3 ｜ **前置**：泛函 II（Hilbert 空间——量子力学的数学就是它）、em-03（经典原子之死）、概率线
> 量子力学的公理体系一页立齐：态 = Hilbert 空间矢量、观测量 = 自伴算符、测量 = 谱投影 + Born 概率、演化 = Schrödinger 方程。你的泛函分析在此整体变现——**量子力学是 Hilbert 空间理论的物理实例化**。

## 1. 为什么必须量子（三条实验判决）

黑体辐射（sm-03：能量量子 $\hbar\omega$）；光电效应（光子 $E = \hbar\omega$——光的粒子性）；电子双缝干涉（**单个电子**逐个发射仍积累出干涉条纹——物质的波动性，de Broglie $p = \hbar k$）。合并：**微观对象既非经典粒子也非经典波**——需要新框架。

## 2. 公理体系（配泛函语言对照）

| 公理 | 内容 | 泛函分析对应 |
|---|---|---|
| 态 | 归一化矢量 $\lvert\psi\rangle \in \mathcal H$（相位不物理） | Hilbert 空间（泛函 II） |
| 观测量 | 自伴算符 $\hat A$ | 谱定理保实谱+正交本征系（泛函 III） |
| 测量 | 得本征值 $a_n$，概率 $\lvert\langle a_n\vert\psi\rangle\rvert^2$（Born 规则），测后塌缩到本征态 | 正交投影（泛函 II 投影定理） |
| 演化 | $i\hbar\frac{\partial}{\partial t}\lvert\psi\rangle = \hat H\lvert\psi\rangle$ | 酉群 $e^{-i\hat Ht/\hbar}$（保范——概率守恒） |

位置表象：$\psi(x) = \langle x\vert\psi\rangle$，$\hat x = x$、$\hat p = -i\hbar\frac{\partial}{\partial x}$，$|\psi(x)|^2$ = 概率密度（$\mathcal H = L^2$——实变 III 的空间是量子态的家）。**正则对易关系**：

$$
[\hat x, \hat p] = i\hbar
$$

（mech-03 的字典 $\{q,p\} = 1 \to \frac{1}{i\hbar}[\hat x,\hat p]$ 兑现——经典力学按泊松括号整体翻译。）

**期望值与演化**：$\langle A\rangle = \langle\psi|\hat A|\psi\rangle$；**Ehrenfest 定理【推导】**（Schrödinger 方程代入求导一行）：$\frac{d\langle A\rangle}{dt} = \frac{1}{i\hbar}\langle[\hat A, \hat H]\rangle$——期望值走经典方程（对应原理的定理形态；与经典 $\frac{df}{dt} = \{f, H\}$ 逐字平行）。

## 3. 不确定性原理（定理，非哲学）

**定理（Robertson）【推导】** 对任意态：

$$
\sigma_A\,\sigma_B \;\geq\; \frac{1}{2}\big|\langle[\hat A, \hat B]\rangle\big|
$$

*证*：对 $|f\rangle = (\hat A - \langle A\rangle)|\psi\rangle$、$|g\rangle = (\hat B - \langle B\rangle)|\psi\rangle$ 用 **Cauchy–Schwarz**（全站第 N 次），取虚部整理出对易子。$\blacksquare$ 代 $[\hat x, \hat p] = i\hbar$：

$$
\sigma_x\sigma_p \geq \frac{\hbar}{2}
$$

**读法**：不是测量技术的缺陷，是**非对易算符没有共同本征态**的数学事实；Fourier 对偶（数分 IV：窄函数宽频谱）的物理化身——位置与动量互为 Fourier 变换的表象。

## 4. 定态与一般解法

分离变量（pde-01 的方法在量子的主场）：$\hat H\psi_n = E_n\psi_n$（**定态 Schrödinger 方程**——自伴算符的本征值问题：能级 = 谱，泛函 III 的语言完全接管），一般解

$$
\Psi(x, t) = \sum_n c_n\,\psi_n(x)\,e^{-iE_nt/\hbar}, \qquad c_n = \langle\psi_n|\Psi(0)\rangle
$$

——正交展开（泛函 II Fourier 展开的量子版）：**解量子问题 = 求谱 + 展开初态**。定态的 $|\Psi|^2$ 不随时间变（名字的由来）；动力学来自能级间的相位差拍（例 3）。

## 5. 练习与要点

**例 1（Born 规则手算）** $\Psi = \frac{1}{\sqrt2}\psi_1 + \frac{1}{\sqrt2}\psi_2$：测能量得 $E_1, E_2$ 各半概率；测后塌缩——再测必得同值（投影的幂等性）。期望 $\langle H\rangle = \frac{E_1+E_2}{2}$ 但**单次测量永远得不到这个值**——期望值 ≠ 可能读数：量子概率的第一课。

**例 2（不确定性数量级）** 电子限制在原子尺度 $\sigma_x \sim 10^{-10}$ m：$\sigma_p \geq \frac{\hbar}{2\sigma_x}$ ⇒ 动能 $\sim\frac{\sigma_p^2}{2m} \sim$ eV 级——**原子的尺寸-能量刻度由不确定性原理锁定**（电子不塌进核：压得越紧动能越贵——em-03 经典塌缩悖论的量子解答）。

**例 3（相位差拍）** 上例叠加态的 $|\Psi(x,t)|^2$ 含 $\cos\frac{(E_2 - E_1)t}{\hbar}$ 项——概率密度以 Bohr 频率振荡：**"能级差 = 跃迁频率"**（光谱线的出处，atom-01 收线）。$\blacksquare$

---

*下一页：把框架跑起来——一维标准问题全家（方阱/隧穿）与谐振子的升降算符法：量子力学最优雅的代数。*
