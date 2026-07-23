# 凝聚态 II · 超导 BCS 理论【骨架】

> **对标**：Altland & Simons §6 / Tinkham ｜ **前置**：cm-01、sm-03、asm-01（对称破缺/GL）
> 凝聚态最辉煌的定理级故事：**电子居然结对**（声子做媒的弱吸引 + Fermi 海的托底 = 任意弱吸引都不稳定）→ **配对凝聚开能隙** → 零电阻与 Meissner 效应。BCS（1957）是"涌现"的旗舰案例，也是规范对称破缺（pp-02 Higgs）思想的凝聚态原产地。


<figure class="plot" markdown="1">
![BCS 能隙 \Delta(T) 随温度、及 Cooper 对态密度。](assets/img/cm-02-bcs-gap.svg)
<figcaption><span class="fig-id">图 cm-02.1</span>BCS 能隙 \(\Delta(T)\) 随温度、及 Cooper 对态密度。</figcaption>
</figure>

## 1. 现象清单（理论要交的作业）

零电阻（$T < T_c$，电流环持流年计无衰减）；**Meissner 效应**（完全抗磁——磁通被逐出：不是"理想导体"的推论而是独立现象，超导 = 新热力学相的判据）；比热在 $T_c$ 跳变 + 低温指数行为 $e^{-\Delta/k_BT}$（**能隙存在的指纹**——sm 线 Boltzmann 因子读谱法）；同位素效应 $T_c \propto M^{-1/2}$（**媒人是晶格**——声子的质量指纹：机制的破案线索）。

## 2. Cooper 配对：Fermi 海上的不稳定性

**声子超交换的吸引【机理】**：电子极化晶格留下正电尾迹、吸引后来者——延迟的间接吸引（能标 $\sim\omega_D$ 声子频率，solid-01）在 Fermi 面附近胜过屏蔽后的库仑斥力。

**Cooper 问题【推导骨架】**：Fermi 海之上放两个电子（动量相反 $\mathbf k, -\mathbf k$、自旋单态），弱吸引 $-V$（壳层 $\omega_D$ 内）：束缚态方程给

$$
E_b \approx 2\hbar\omega_D\,e^{-2/N(0)V}
$$

——**任意弱的吸引都出束缚态**（三维自由空间做不到——Fermi 海的态密度托底改变了问题：Pauli 阻塞把二体问题变成"有底座的"二维型问题）。$e^{-1/x}$ 的**非微扰性**：对 $V$ 的一切阶泰勒展开皆零——微扰论永远看不见超导（qft-02 §4 失效清单的凝聚态名例）。

## 3. BCS 理论【骨架级完整】

**变分波函数**：$|\text{BCS}\rangle = \prod_{\mathbf k}\big(u_{\mathbf k} + v_{\mathbf k}c^\dagger_{\mathbf k\uparrow}c^\dagger_{-\mathbf k\downarrow}\big)|0\rangle$——所有动量对"要么空要么成对"的相干叠加（粒子数不定——相位确定：数与相的共轭在此显形）。平均场解耦 + Bogoliubov 变换（准粒子 = 电子与空穴的叠加——cm-01 准粒子概念的极致）对角化，自洽出**能隙方程**：

$$
\Delta = \frac{V}{2}\sum_{\mathbf k}\frac{\Delta}{\sqrt{\xi_{\mathbf k}^2 + \Delta^2}}\tanh\frac{\sqrt{\xi_{\mathbf k}^2 + \Delta^2}}{2k_BT}
$$

**产出三条【骨架】**：零温隙 $\Delta_0 = 2\hbar\omega_D e^{-1/N(0)V}$（Cooper 指数再现）；$T_c$ 同型公式且**普适比** $\frac{2\Delta_0}{k_BT_c} \approx 3.53$（材料无关——实验一一验证：BCS 的"指纹预言"）；准粒子谱 $E = \sqrt{\xi^2 + \Delta^2}$——**Fermi 面全面开隙**（比热指数律 ✓、隧道谱直接量 $\Delta$ ✓）。同位素效应 ✓（$\Delta \propto \omega_D \propto M^{-1/2}$）。

**对称破缺读法（asm-01/pp-02 的接口）**：BCS 态破缺 $U(1)$ 相位对称（序参量 $\Delta = |\Delta|e^{i\varphi}$——GL 理论的微观兑现）；**Meissner 效应 = 光子在超导体内"变重"**（规范场吃掉相位模获得质量 ⇒ 磁场指数屏蔽 $\lambda_L$）——**Anderson–Higgs 机制的凝聚态原型**：粒子物理的 Higgs（pp-02）是同一机制的真空版——本站两大板块在此握手。**宏观量子性**：磁通量子化 $\Phi_0 = \frac{h}{2e}$（**那个 2 = 配对的直接实验签名**）、Josephson 效应（两超导体相位差驱动电流 $I = I_c\sin\Delta\varphi$——SQUID 磁强计与超导 qubit（qi 线的主流硬件！）的工作原理：**量子计算机建在 BCS 之上**）。

## 4. 练习与要点

**例 1（非微扰指数的手感）** $N(0)V = 0.3$：$\Delta_0 \sim 2\hbar\omega_D e^{-3.3}$——$\omega_D \sim 300$ K 给 $\Delta \sim$ meV、$T_c \sim 10$ K 量级 ✓（常规超导体的天花板逻辑：$e^{-1/N(0)V}$ 把 $T_c$ 压在声子能标的百分之几——高温超导为何需要新机制的第一直觉【未解，第三档边界】）。

**例 2（普适比当体检）** 实测 $\frac{2\Delta_0}{k_BT_c}$：Al 3.4、Pb 4.4——弱耦合 BCS ✓ 与强耦合偏离（Eliashberg 修正【引用】）：一个比值区分"教科书超导"与"强耦合超导"。

**例 3（磁通量子化算术）** $\Phi_0 = \frac{h}{2e} \approx 2.07\times10^{-15}$ Wb：SQUID 以它为刻度测脑磁（fT 级）——"配对电荷 $2e$"每天在医院被数出来。$\blacksquare$

---

*下一门：粒子物理两页——把"对称性决定相互作用"推到极致：规范原理、标准模型的粒子谱与 Higgs 机制。*
