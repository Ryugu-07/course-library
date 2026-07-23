# 广相 II · Einstein 方程与 Schwarzschild 解

> **对标**：Carroll §4–5 ｜ **前置**：gr-01、流形几何 IV（Ricci/Bianchi）
> 本页立起理论的心脏——**Einstein 场方程**（物质告诉时空怎么弯），并求出它最著名的精确解——**Schwarzschild 时空**（球对称真空），随即收割三大经典检验：水星进动、光线弯曲、雷达延迟。

## 1. Einstein 场方程

**需求清单**：张量方程（广义协变）；源 = 能动张量 $T_{\mu\nu}$（sr-01 四动量的场版——能量密度/动量流/应力打包）；守恒 $\nabla^\mu T_{\mu\nu} = 0$ 须自动成立；牛顿极限回收 Poisson 方程 $\nabla^2\Phi = 4\pi G\rho$。

**唯一答案【构造级论证】**：几何侧要一个"二阶导、对称、自动无散"的张量——**Bianchi 恒等式**（流形 IV）说 Einstein 张量 $G_{\mu\nu} = R_{\mu\nu} - \frac12 R\,g_{\mu\nu}$ 恰好 $\nabla^\mu G_{\mu\nu} \equiv 0$（几何恒等式 ⇒ 能量守恒不是附加假设而是**结构自带**）：

$$
G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\,T_{\mu\nu}
$$

系数由牛顿极限定标【骨架：弱场线性化 $g = \eta + h$，$G_{00} \approx -\frac12\nabla^2h_{00}$ 对上 Poisson】。$\Lambda$：宇宙学常数——数学允许的唯一附加项（cosmo 线的主角，暗能量的席位）。10 条非线性耦合 PDE（**非线性 = 引力场自己有能量、自己造引力**——与电磁的线性叠加的本质区别；也是精确解稀缺的原因）。变分出身一嘴：Einstein–Hilbert 作用量 $S = \frac{c^4}{16\pi G}\int R\sqrt{-g}\,d^4x$——mech-02 的哲学统治到引力（"曲率标量是最简单的协变拉氏量"）。

## 2. Schwarzschild 解

<figure class="plot" markdown="1">
![Schwarzschild 有效势](assets/img/gr-02-effective-potential.svg)
<figcaption><span class="fig-id">图 2.1</span>Schwarzschild 有效势比牛顿多一项 \(-L^2/r^3\)：近距离势垒被压低，允许粒子"坠入"——近日点进动与黑洞吸积的根。</figcaption>
</figure>

**定理（Schwarzschild 1916 / Birkhoff）** 球对称真空解唯一且静态：

$$
ds^2 = -\Big(1 - \frac{r_s}{r}\Big)c^2dt^2 + \Big(1 - \frac{r_s}{r}\Big)^{-1}dr^2 + r^2d\Omega^2, \qquad r_s = \frac{2GM}{c^2}
$$

**【骨架】** 球对称 ansatz $ds^2 = -e^{2\alpha(r)}dt^2 + e^{2\beta(r)}dr^2 + r^2d\Omega^2$ 代入 $R_{\mu\nu} = 0$：两条独立 ODE 给 $\alpha = -\beta$ 与 $(re^{2\alpha})' = 1$——积分即得；常数由牛顿极限对号（$g_{00} \to -(1 + \frac{2\Phi}{c^2})$，gr-01 字典）。$\blacksquare$（Birkhoff：球对称自动静态——球对称脉动不辐射引力波：ced-02"无偶极辐射"的引力版预告。）

**Schwarzschild 半径**：太阳 3 km、地球 9 mm——普通天体的 $r_s$ 深埋体内（外部解照用）；$r \leq r_s$ 的完整故事（视界、黑洞）留给 gr-03。

## 3. 三大经典检验（测地线的收割）

Schwarzschild 测地线：对称性给两个守恒量（能量 $E$、角动量 $L$——Killing 矢量，Noether/流形语言），化为一维有效势问题（mech-01 的方法在弯曲时空重演）：

$$
\frac12\dot r^2 + V_{\text{eff}}(r) = \text{const}, \qquad V_{\text{eff}} = -\frac{GM}{r} + \frac{L^2}{2r^2} - \underbrace{\frac{GML^2}{c^2r^3}}_{\text{广相新项}}
$$

**水星近日点进动【推导骨架】**：新 $\frac{1}{r^3}$ 项微扰 Kepler 轨道（qm-04 式的微扰思路用在轨道方程上）：每圈进动

$$
\Delta\varphi = \frac{6\pi GM}{c^2a(1 - e^2)} \approx 43''/\text{世纪}
$$

——牛顿力学解释不了的著名残差被一分不差吃下（Einstein 自述算出此数时"心悸数日"）。

**光线弯曲**：光测地线（$d\tau = 0$）同法：擦日偏转 $\theta = \frac{4GM}{c^2R_\odot} = 1.75''$——**恰是"牛顿粒子说"值的两倍**（空间弯曲贡献另一半——gr-01 §3"低速只看时间部分"的反面：光够快，空间部分平权）。1919 年 Eddington 日食观测 ✓——广相登上世界头条的时刻；现代版：**引力透镜**（星系团的光弧、微透镜找系外行星/暗物质——弯光从检验变成了望远镜）。

**Shapiro 雷达延迟**：掠日雷达信号往返多 ~200 μs【引用】——第四检验；卡西尼号验证至 $10^{-5}$ 精度。

## 4. 练习与要点

**例 1（进动量级迁移）** 同公式用于近双星 PSR B1913+16：进动 4.2°/年（水星的 3.5 万倍）——强场系统把"世纪级效应"变成"年级"；该双星的轨道衰减是引力波的首个证据（gr-03 接力）。

**例 2（有效势读图）** $V_{\text{eff}}$ 新项使小 $r$ 处势垒**有限**：$L$ 再大也存在最内稳定圆轨道 **ISCO $r = 6GM/c^2$**（对 $V_{\text{eff}}$ 求二阶导归零）——吸积盘内缘、黑洞成像亮环尺寸的理论刻度（gr-03/EHT）。

**例 3（透镜小算）** 太阳质量恒星在 1 kpc 处：Einstein 环半径 $\theta_E = \sqrt{\frac{4GM}{c^2}\frac{D_{LS}}{D_LD_S}} \sim$ mas 级——微透镜光变曲线的时标 ~ 周：OGLE 类巡天找暗天体的设计参数。$\blacksquare$

---

*下一页：把解推进视界之内——黑洞、引力波与宇宙学度规：广相的三大前沿出口一次打通。*
