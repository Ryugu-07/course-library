# 电动力学 II · 推迟势与辐射

> **对标**：Jackson §6、§9、§14 主干 ｜ **前置**：em-02/03、ced-01、mp-01（推迟 Green 函数）
> 电动力学的动态篇：**源的消息以光速迟到**（推迟势）→ 偶极辐射的完整推导（em-03 Larmor 公式的欠条全额兑付）→ 相对论性辐射一瞥（同步辐射为何是"光源工厂"）。

## 1. 推迟势

Lorenz 规范下的波动方程（em-02 §3）用推迟 Green 函数（mp-01）解出：

$$
V(\mathbf r, t) = \frac{1}{4\pi\varepsilon_0}\int\frac{\rho(\mathbf r', t_r)}{|\mathbf r - \mathbf r'|}\,dV', \qquad t_r = t - \frac{|\mathbf r - \mathbf r'|}{c}
$$

（$\mathbf A$ 同型。）**读法**：形式与静电势一模一样，唯一改动是**源取推迟时刻**——因果律的显式实现（超前解被边界条件抛弃——时间之箭在电动力学的落点）。点电荷特化 = Liénard–Wiechert 势【引用】（分母多出 $(1 - \hat{\mathbf n}\cdot\boldsymbol\beta)$ 因子——相对论聚束的种子，§3）。

## 2. 偶极辐射（Larmor 的正式推导）

**【推导骨架（三步）】** 远区 + 长波近似（$r \gg \lambda \gg$ 源尺度）：
① $\mathbf A(\mathbf r, t) \approx \frac{\mu_0}{4\pi r}\dot{\mathbf p}(t_r)$（推迟势展开到最低阶——矢势由偶极矩变化率统治）；
② 取旋度/时间导数得远区场：

$$
\mathbf B = \frac{\mu_0}{4\pi c}\frac{\ddot{\mathbf p}\times\hat{\mathbf n}}{r}, \qquad \mathbf E = c\,\mathbf B\times\hat{\mathbf n}
$$

——横场、$\frac1r$ 衰减（em-03 Thomson 图像的公式化）；
③ Poynting 矢量积分立体角：

$$
\frac{dP}{d\Omega} = \frac{\ddot p^2}{16\pi^2\varepsilon_0c^3}\sin^2\theta, \qquad P = \frac{\ddot p^2}{6\pi\varepsilon_0c^3}
$$

$\blacksquare$——代 $\ddot p = qa$ 即 **Larmor 公式**（em-03 的量纲论证升级为定理）；$\sin^2\theta$ 花瓣角分布：**沿加速方向不辐射**（天线的零点方向、偶极天线水平架设的原因）。

**辐射的层级**：电偶极（主导）→ 磁偶极 + 电四极（压低 $(\frac{v}{c})^2$ 或 $(\frac{d}{\lambda})^2$）——原子谱线的选择定则被禁时走高阶（qm-04/aqm-01 的"禁戒线"其实是慢线）；引力辐射从**四极**起步（引力无偶极——动量守恒堵死，gr-03 的伏笔）。

**辐射反作用一嘴【引用】**：辐射带走能量 ⇒ 电荷受反冲（Abraham–Lorentz 力 $\propto\dot{\mathbf a}$）——自作用的病理（预加速/失控解）是经典电动力学的边界警告牌：完整答案在 QED（qft 线）。

## 3. 相对论性辐射一瞥

**聚束效应**：$v \to c$ 时 Liénard–Wiechert 的 $(1 - \hat{\mathbf n}\cdot\boldsymbol\beta)^{-1}$ 因子把辐射压进前向 $\sim\frac{1}{\gamma}$ 的锥角——**探照灯效应**；总功率 $P \propto \gamma^4$（圆周运动）【引用 Liénard 公式】。

**同步辐射**：环形加速器中的电子——宽谱（脉冲串的 Fourier：数分 IV）、高亮度、偏振可控 ⇒ **同步辐射光源**（材料/生物成像的国之重器：上海光源、SPring-8——"加速器的废热变成显微镜"）；也是圆形对撞机能量上限的诅咒（$\gamma^4$ 的电费——LHC 用质子、未来 lepton 对撞机考虑直线的原因）。天体版：脉冲星、活动星系核喷流的射电谱——宇宙的同步辐射无处不在。

## 4. 练习与要点

**例 1（天线功率）** 半波偶极天线辐射电阻 ~73 Ω 的出处：$P = \frac{(\ddot p)^2}{6\pi\varepsilon_0c^3}$ 对电流分布积分的工程化【引用】；短天线 $R_{\text{rad}} \propto (\frac{d}{\lambda})^2$——**天线短于波长就低效**：AM 电台天线百米高、手机天线靠共振设计的同一笔账。

**例 2（Thomson 散射截面）** 自由电子被光波驱动再辐射：$\sigma_T = \frac{8\pi}{3}r_e^2 \approx 0.665$ b（经典电子半径 $r_e = \frac{e^2}{4\pi\varepsilon_0mc^2}$）——太阳内部光子扩散、CMB 与电子的耦合（cosmo-02 复合时代的主角截面）都由它计价。

**例 3（$\gamma^4$ 的电费）** 同步辐射每圈能损 $\Delta E \propto \frac{\gamma^4}{R}$：LEP（电子，100 GeV，$\gamma \sim 2\times10^5$）每圈损 ~3 GeV——**加速一圈赔掉 3%**；同环换质子（LHC，$\gamma$ 小四个量级）损耗可忽略：对撞机选型的第一道物理算术。$\blacksquare$

---

*下一门：统计力学进阶——相变、Ising 与重整化群：多体物理"整体大于部分之和"的三部曲，也是与机器学习交汇最深的物理。*
