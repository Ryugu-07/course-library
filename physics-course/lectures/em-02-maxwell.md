# 电磁 II · Maxwell 方程与电磁波

> **对标**：Griffiths §7、§9 ｜ **前置**：em-01、pde-02（波动方程）
> 物理学史上最著名的"补丁"：Maxwell 给 Ampère 定律加了一项位移电流，方程组闭合的瞬间——**光从方程里跑了出来**。本页推导这一切，并把电磁波的性质（横波、偏振、能流）配齐。

## 1. Faraday 感应与位移电流

**Faraday 定律**：变化的磁通感生电场——$\oint\mathbf E\cdot d\boldsymbol\ell = -\frac{d\Phi_B}{dt}$ ⟺

$$
\nabla\times\mathbf E = -\frac{\partial\mathbf B}{\partial t}
$$

（负号 = Lenz 定律：感应总在抵抗变化——能量守恒的守门员；发电机、变压器的全部原理。）

**Maxwell 的补丁【推导】**：静磁的 $\nabla\times\mathbf B = \mu_0\mathbf J$ 与电荷守恒 $\nabla\cdot\mathbf J = -\frac{\partial\rho}{\partial t}$ 冲突（对前者取散度：左边恒零、右边非零——数分 V 的 $\nabla\cdot(\nabla\times) = 0$ 当检察官）。修复：补上**位移电流** $\varepsilon_0\frac{\partial\mathbf E}{\partial t}$，散度检验恰好通过（用 Gauss 定律）。$\blacksquare$——**由数学自洽性倒逼出的新物理**：理论物理方法论的第一次完整示范。

**Maxwell 方程组（真空）**：

$$
\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}, \quad \nabla\cdot\mathbf B = 0, \quad \nabla\times\mathbf E = -\frac{\partial\mathbf B}{\partial t}, \quad \nabla\times\mathbf B = \mu_0\mathbf J + \mu_0\varepsilon_0\frac{\partial\mathbf E}{\partial t}
$$

## 2. 光的诞生（教科书物理最高光的两行）

真空无源区（$\rho = 0, \mathbf J = 0$）：对 Faraday 取旋度、代入 Ampère–Maxwell，用 $\nabla\times(\nabla\times\mathbf E) = \nabla(\nabla\cdot\mathbf E) - \nabla^2\mathbf E$（解几/数分恒等式）与 $\nabla\cdot\mathbf E = 0$：

$$
\nabla^2\mathbf E = \mu_0\varepsilon_0\,\frac{\partial^2\mathbf E}{\partial t^2}
$$

——**波动方程**（pde-02 的双曲型主角），波速

$$
c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} \approx 3\times10^8\ \mathrm{m/s}
$$

**两个静态常数（电的 $\varepsilon_0$、磁的 $\mu_0$）拼出光速**——Maxwell 由此判定"光是电磁波"：理论统一的黄金标准案例（电、磁、光学三门学科在两行推导里合并）。

**平面波解的性质【推导】**：$\mathbf E = \mathbf E_0 e^{i(\mathbf k\cdot\mathbf r - \omega t)}$ 代回方程组——$\nabla\cdot\mathbf E = 0 \Rightarrow \mathbf k\perp\mathbf E$（**横波**）；Faraday 给 $\mathbf B = \frac{\mathbf k\times\mathbf E}{\omega}$（$\mathbf E \perp \mathbf B \perp \mathbf k$ 右手系、$|E| = c|B|$）。**偏振** = $\mathbf E$ 在横平面内的取向自由度（线偏/圆偏——两个独立分量的相位关系；偏振片、3D 眼镜、量子光学 qubit（qi-01）的物理载体）。

## 3. 势的语言与规范（承前启后）

$\mathbf B = \nabla\times\mathbf A$、$\mathbf E = -\nabla V - \frac{\partial\mathbf A}{\partial t}$：自动满足两条无源方程；剩下两条在 **Lorenz 规范**（$\nabla\cdot\mathbf A + \frac{1}{c^2}\frac{\partial V}{\partial t} = 0$）下解耦成对称的波动方程

$$
\Box V = -\frac{\rho}{\varepsilon_0}, \qquad \Box\mathbf A = -\mu_0\mathbf J \qquad \Big(\Box = \nabla^2 - \frac{1}{c^2}\frac{\partial^2}{\partial t^2}\Big)
$$

——带源波动方程：解即推迟势（ced-02 的主角）。**规范自由**（$\mathbf A \to \mathbf A + \nabla\chi$，$V \to V - \frac{\partial\chi}{\partial t}$ 不改场）此处是计算便利，到 pp-01 将升格为"决定相互作用形式的第一原理"。

## 4. 练习与要点

**例 1（数量级体感）** 阳光强度 $\sim 1.4\ \mathrm{kW/m^2}$：由 $I = \frac{c\varepsilon_0E_0^2}{2}$ 反解 $E_0 \approx 1\ \mathrm{kV/m}$、$B_0 \approx 3\ \mu\mathrm T$——阳光的电场千伏每米级、磁场却比地磁还弱：$|E| = c|B|$ 的日常读数。

**例 2（波段一览）** 同一方程组、不同 $\omega$：无线电—微波—红外—可见（400–700 nm）—紫外—X—γ——**"光谱只是频率轴上的地名"**；波长与结构尺度匹配决定应用（天线 ~ 波长、显微极限 ~ 波长——opt-01 衍射极限伏笔）。

**例 3（Lenz 判向练习）** 磁铁 N 极插向线圈：磁通增 ⇒ 感应电流产生反向磁场（面对磁铁一侧成 N 极）排斥之——"感应永远唱反调"；涡流刹车、无线充电的方向判断同法。$\blacksquare$

---

*下一页：场的力学身份——能量（Poynting）、动量（辐射压）与辐射入门：加速电荷为何发光。*
