# 统计物理 III · 量子统计

> **对标**：Schroeder §7 / Pathria §7–8 ｜ **前置**：sm-02、qm-01（可后补）
> 量子世界给统计加两条新规：**全同粒子不可分辨** + **自旋定社会性格**（费米子排他 / 玻色子扎堆）。由此长出两套分布，解释了经典物理的三大悬案：黑体辐射（量子论的出生地）、金属比热、以及低温下的凝聚现象。

## 1. 全同性与两种统计

<figure class="plot" markdown="1">
![三种统计的占据数](assets/img/sm-03-quantum-stats.svg)
<figcaption><span class="fig-id">图 3.1</span>三种统计的占据数：费米-狄拉克（\(\le 1\)，泡利不相容）、玻色-爱因斯坦（低能可聚集）、经典极限下都趋于玻尔兹曼。</figcaption>
</figure>

全同粒子交换不产生新态——多粒子波函数只许两种对称性（qm-03 详证，此处引用）：**玻色子**（整数自旋，波函数对称，可同态堆叠）与**费米子**（半整数自旋，反对称，**Pauli 不相容**——一态一粒）。

**两大分布【推导】**（巨正则系综下对单模求和，sm-02 §3）：单粒子态 $\varepsilon$ 的平均占据数——玻色：$\Xi = \sum_{n=0}^\infty e^{-n(\varepsilon-\mu)\beta}$ 几何级数；费米：$n \in \{0, 1\}$ 两项：

$$
\langle n\rangle_{BE} = \frac{1}{e^{(\varepsilon - \mu)/k_BT} - 1}, \qquad
\langle n\rangle_{FD} = \frac{1}{e^{(\varepsilon - \mu)/k_BT} + 1}
$$

（高能/稀薄极限两者同趋 Boltzmann $e^{-(\varepsilon-\mu)/k_BT}$——经典统计是量子统计的退化极限，适用判据：热波长 $\ll$ 粒子间距。）一个 $\mp$ 号分出两个世界：BE 在 $\varepsilon \to \mu$ 处发散（**扎堆的许可**）、FD 恒 $\leq 1$（**排他的执行**）。

## 2. 玻色世界：黑体辐射与 BEC

**黑体辐射（量子论出生地）【推导】**：腔内光子气（$\mu = 0$——光子数不守恒），模式密度 $g(\omega) \propto \omega^2$（驻波计数——三维 k 空间球壳）× BE 占据 × $\hbar\omega$：

$$
u(\omega) = \frac{\hbar\omega^3}{\pi^2c^3}\,\frac{1}{e^{\hbar\omega/k_BT} - 1} \quad (\text{Planck 公式})
$$

低频退化为 Rayleigh–Jeans（$\propto \omega^2T$——经典均分），高频被指数压灭——**紫外灾难的解除**：能量量子化 $E = \hbar\omega$ 让高频模式"买不起入场券"（1900 年 Planck 由此打开量子世界）。积分得 **Stefan–Boltzmann** $u \propto T^4$、峰值 Wien 位移 $\lambda_{\max}T = $ 常数——太阳表面 5800 K 峰在可见光、人体 310 K 峰在红外（热成像）、宇宙 2.725 K 峰在微波（CMB——cosmo-02 的主角就是一条完美 Planck 曲线）。

**声子比热**：Debye 模型把晶格振动当"声子气"同法处理——低温 $C_V \propto T^3$（实验吻合，Dulong–Petit 低温失效的解答；solid-01 详展）。

**Bose–Einstein 凝聚（BEC）【骨架】**：$T$ 降低时 $\mu \uparrow 0$，激发态容纳能力 $\int\frac{g(\varepsilon)d\varepsilon}{e^{\varepsilon/k_BT}-1}$ 有限饱和 ⇒ 多余粒子**宏观占据基态**——相变到"量子态放大到宏观"的物态（1995 年冷原子实现，诺奖；超流氦、激光的受激辐射聚束是近亲）。

## 3. 费米世界：简并电子气

金属自由电子（$T \ll T_F$ 时"简并"）：**Fermi 能** $\varepsilon_F$ = $T = 0$ 时填到的最高能级——

$$
\varepsilon_F = \frac{\hbar^2}{2m}(3\pi^2 n)^{2/3}
$$

【推导：k 空间填球到 $k_F$，计数 $n = \frac{k_F^3}{3\pi^2}$（含自旋 2）】。金属 $\varepsilon_F \sim$ 几 eV ⇒ $T_F \sim 5\times10^4$ K——**室温金属电子是"冷"的**（$T \ll T_F$）：Pauli 排斥把电子逼上 eV 级动能，与温度无关。

**三大悬案的解答**：金属比热为何只有均分预言的 ~1%——只有 Fermi 面附近 $\sim\frac{T}{T_F}$ 比例的电子能被热激发（$C_e \propto T$，线性项——低温实验的金属指纹）；Pauli 顺磁、电子简并压（**白矮星靠它抗引力**——Chandrasekhar 极限 $1.4M_\odot$：费米统计称出恒星命运的体重秤，超过则中子星/黑洞——gr-03 接力）。

**化学势的性格对照**：费米 $\mu \approx \varepsilon_F > 0$（排队队尾的高度）；玻色 $\mu \leq 0$（挤在底层）——一图看懂两种社会。

## 4. 练习与要点

**例 1（Planck 峰手算）** 太阳 5800 K：Wien $\lambda_{\max} = \frac{2.9\times10^{-3}}{5800} \approx 500$ nm（绿光——人眼灵敏度峰与之吻合非巧合：演化对着太阳谱优化）；人体 310 K → 9.4 μm（红外热像仪的工作波段）。

**例 2（简并判据）** 金属电子 $n \sim 10^{29}/\mathrm{m}^3$：$T_F \sim 10^5$ K ⇒ 高度简并 ✓；常温气体 $n \sim 10^{25}$、质量大 ⇒ 热波长远小于间距——经典 ✓；冷原子 BEC 要把温度压到 nK——两个极限的定量分界（热 de Broglie 波长 $\lambda_T = \frac{h}{\sqrt{2\pi mk_BT}}$ 与间距比较）。

**例 3（白矮星量级）** 简并压 $P \propto n^{5/3}$（$T=0$ 费米气体，一行积分）对抗引力 $\propto \frac{M^2}{R^4}$：平衡给 $R \propto M^{-1/3}$——**越重越小**的反常星体；相对论修正（$E = pc$ 使 $P \propto n^{4/3}$）让平衡在 $1.4M_\odot$ 处消失——Chandrasekhar 极限的三行版。$\blacksquare$

---

*统计物理三页完卷（进阶三页在研究生板块等着：相变、Ising、重整化群）。下一门：量子力学——从黑体辐射点燃的革命本体。*
