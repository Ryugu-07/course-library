# 凝聚态 II · 超导 BCS 理论

> **对标**：Tinkham《Introduction to Superconductivity》/ Altland & Simons §6 / de Gennes ｜ **前置**：cm-01、sm-03、asm-01（对称破缺/GL）
> 凝聚态最辉煌的定理级故事：**电子居然结对**（声子做媒的弱吸引 + Fermi 海托底 = 任意弱吸引都不稳定）→ 配对凝聚开能隙 → 零电阻与 Meissner 效应。BCS（1957）是"涌现"的旗舰案例，也是规范对称破缺（pp-02 Higgs）思想的凝聚态原产地。

<figure class="plot" markdown="1">
![BCS 能隙随温度的变化与准粒子态密度。](assets/img/cm-02-bcs-gap.svg)
<figcaption><span class="fig-id">图 cm-02.1</span>左：能隙 \(\Delta(T)\) 由自洽能隙方程解出，在 \(T_c\) 处连续趋零（二阶相变），零温值满足普适比 \(2\Delta_0/k_BT_c\approx3.53\)。右：准粒子态密度 \(N(E)=N(0)E/\sqrt{E^2-\Delta^2}\)，在 \(E=\Delta\) 处发散——<strong>隧道谱直接测量的就是这条曲线</strong>。</figcaption>
</figure>

## 1. 现象清单（理论要交的作业）

**零电阻**（$T<T_c$，超导环中电流年计无衰减）；**Meissner 效应**（完全抗磁，磁通被逐出——**不是"理想导体"的推论而是独立现象**，它才是"超导是新热力学相"的判据）；**比热在 $T_c$ 跳变**且低温呈 $e^{-\Delta/k_BT}$（**能隙存在的指纹**）；**同位素效应** $T_c\propto M^{-1/2}$（**媒人是晶格**——声子质量的指纹，破案的关键线索）。

## 2. Cooper 配对：Fermi 海上的不稳定性

**吸引从哪来【机理】**：电子极化晶格、留下正电尾迹，吸引后来者——**延迟的间接吸引**。能标为声子频率 $\omega_D$（solid-01），在 Fermi 面附近的窄壳层内胜过屏蔽后的库仑斥力。

**Cooper 问题【完整推导】**：在填满的 Fermi 海之上放两个电子（动量 $\mathbf k,-\mathbf k$，自旋单态），壳层 $\omega_D$ 内有常吸引 $-V$。设波函数 $\psi=\sum_k a_k|\mathbf k,-\mathbf k\rangle$，薛定谔方程给

$$(2\xi_k - E)a_k = V\sum_{k'}a_{k'}$$

两边除以 $(2\xi_k-E)$ 并对 $k$ 求和，消去公因子得**自洽条件**

$$1 = V\sum_k\frac{1}{2\xi_k-E}\approx N(0)V\int_0^{\omega_D}\frac{d\xi}{2\xi-E}$$

积分并解出束缚能：

$$E_b = 2\hbar\omega_D\,e^{-2/N(0)V}$$

**结论惊人：任意弱的吸引都产生束缚态**。三维自由空间做不到这一点——**是 Fermi 海的态密度托底改变了问题的维数性质**（Pauli 阻塞把二体问题变成"有底座的"二维型问题）。

**$e^{-1/x}$ 的非微扰性**：它对 $V$ 的一切阶泰勒展开皆为零——**微扰论永远看不见超导**（🔗 qft-02 §4 失效清单的凝聚态名例）。

## 3. BCS 基态与能隙方程

**变分波函数**：

$$|\mathrm{BCS}\rangle = \prod_{\mathbf k}\left(u_{\mathbf k}+v_{\mathbf k}c^\dagger_{\mathbf k\uparrow}c^\dagger_{-\mathbf k\downarrow}\right)|0\rangle,\qquad |u_k|^2+|v_k|^2=1$$

所有动量对"要么空、要么成对"的**相干叠加**。粒子数不确定而相位确定——**数与相的共轭在此显形**。

**平均场解耦 + Bogoliubov 变换【推导骨架】**：定义 $\Delta = V\sum_k\langle c_{-k\downarrow}c_{k\uparrow}\rangle$，哈密顿量被对角化为准粒子形式，准粒子能谱

$$E_k = \sqrt{\xi_k^2+\Delta^2}$$

**准粒子 = 电子与空穴的相干叠加**（cm-01 准粒子概念的极致）。自洽条件即**能隙方程**：

$$\Delta = \frac{V}{2}\sum_{\mathbf k}\frac{\Delta}{E_k}\tanh\frac{E_k}{2k_BT}$$

**三条产出**：

- **零温隙**：$\Delta_0 = 2\hbar\omega_D e^{-1/N(0)V}$（Cooper 指数再现）；
- **临界温度**：$k_BT_c = 1.14\,\hbar\omega_D e^{-1/N(0)V}$，两式相除给**普适比**

$$\frac{2\Delta_0}{k_BT_c}\approx3.53$$

**这个比值与材料无关**——BCS 最漂亮的"指纹预言"，被实验一一验证；
- **Fermi 面全面开隙** → 比热的指数律 ✓、隧道谱直接测出 $\Delta$ ✓、同位素效应 ✓（$\Delta\propto\omega_D\propto M^{-1/2}$）。

## 4. 对称破缺读法：与 pp-02 的会师

BCS 态破缺 **$U(1)$ 相位对称**，序参量 $\Delta=|\Delta|e^{i\varphi}$——**这是 asm-01 的 Ginzburg–Landau 理论的微观兑现**（GL 可由 BCS 在 $T\to T_c$ 附近导出，Gor'kov）。

**Meissner 效应 = 光子在超导体内变重**：规范场吃掉相位模而获得质量，磁场被指数屏蔽，穿透深度 $\lambda_L=\sqrt{m/\mu_0ne^2}$。

**这就是 Anderson–Higgs 机制的凝聚态原型**——**粒子物理的 Higgs（pp-02）是同一机制的真空版本**。

**宏观量子效应**：
- **磁通量子化** $\Phi_0 = h/2e$——**那个 2 就是配对的直接实验签名**；
- **Josephson 效应**：$I = I_c\sin\Delta\varphi$，两超导体间的相位差直接驱动电流。**SQUID 磁强计与超导量子比特**（🔗 qi 线的主流硬件）都建立在它之上——**量子计算机建在 BCS 之上**。

**类型 I / II**：由 GL 参数 $\kappa=\lambda/\xi$ 区分。$\kappa>1/\sqrt2$ 的第二类超导体允许磁通线（涡旋）穿入，**这才使高场超导磁体成为可能**（MRI、加速器、托卡马克，🔗 fl-06）。

## 5. 练习与要点

**例 1（非微扰指数的手感）** $N(0)V=0.3$：$\Delta_0\sim2\hbar\omega_D e^{-3.3}$。取 $\omega_D\sim300$ K 得 $\Delta\sim$ meV、$T_c\sim10$ K ✓。**这就是常规超导体的天花板逻辑**：$e^{-1/N(0)V}$ 把 $T_c$ 压在声子能标的百分之几——**高温超导为何必须另有机制的第一直觉**【未解，第三档边界】。

**例 2（普适比当体检）** 实测 $2\Delta_0/k_BT_c$：Al 约 3.4、Pb 约 4.4。**前者是教科书弱耦合 BCS，后者的偏离指向强耦合修正（Eliashberg）**——一个比值就能区分两类超导体。

**例 3（磁通量子的日常）** $\Phi_0=h/2e\approx2.07\times10^{-15}$ Wb。SQUID 以它为刻度测量脑磁场（fT 量级）——**"配对电荷 $2e$"每天在医院被数出来**。$\blacksquare$

---

*下一门：粒子物理两页——把"对称性决定相互作用"推到极致：规范原理、标准模型的粒子谱与 Higgs 机制。*
