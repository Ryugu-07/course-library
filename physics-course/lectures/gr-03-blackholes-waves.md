# 广相 III · 黑洞、引力波与宇宙学度规

> **对标**：Carroll §5–8 精选 ｜ **前置**：gr-01/02
> 广相收官三连：**黑洞**（视界不是墙是单行道）、**引力波**（度规的涟漪——线性化方程的辐射解，LIGO 的物理）、**宇宙学度规**（FRW——把整个宇宙当一个解，交棒 cosmo 线）。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">

## 学习层：chirp 的幂律、帧变换与适用边界

### 1. Learning contract

本实验只做**牛顿圆轨道、绝热 inspiral、领先 PN 阶**的 toy 模型。定义 chirp mass

$$
\mathcal M=\frac{(m_1m_2)^{3/5}}{(m_1+m_2)^{1/5}},
$$

并把 $f$ 明确读作**引力波频率**，不是轨道频率。最低阶公式是

$$
\frac{df}{dt}=\frac{96}{5}\pi^{8/3}\left(\frac{G\mathcal M}{c^3}\right)^{5/3}f^{11/3},
\qquad
\tau(f)=t_c-t=\frac5{256}\left(\frac{c^3}{G\mathcal M}\right)^{5/3}(\pi f)^{-8/3}.
$$

先预测五件事，再打开实验：

1. 固定 $f$ 把相应帧的 $\mathcal M$ 加倍时，chirp 率和剩余时间各怎样按幂律变化？
2. 固定 $\mathcal M$ 把 $f$ 加倍时，变化是线性还是 $11/3$、$-8/3$ 次幂？
3. 圆轨道主导 quadrupole 辐射下，$f_{\rm GW}$ 与 $f_{\rm orb}$ 的关系是什么？
4. 源帧质量与观测到的 redshifted chirp mass 是否相同？
5. 能不能把这条最低阶曲线一直外推过 ISCO、并合和 ringdown？

### 2. 源帧、观测帧与 chirp

源帧量满足 $f_{\rm src}$ 与 $\mathcal M_{\rm src}$ 的上述公式。FRW/宇宙学传播下

$$
f_{\rm obs}=\frac{f_{\rm src}}{1+z},
\qquad
dt_{\rm obs}=(1+z)dt_{\rm src},
\qquad
\mathcal M_{\rm obs}=(1+z)\mathcal M_{\rm src}.
$$

所以观测者仍可写同样的形式，但应使用 $f_{\rm obs}$ 与 $\mathcal M_{\rm obs}$；实验把 $\mathcal M_{\rm src}$ 和 $z$ 分开输入，默认 $z=0$，绝不把一个 z=0 toy 当作真实事件拟合。圆轨道时主导四极波的频率约为 $f_{\rm GW}=2f_{\rm orb}$，因此“频率爬升”读的是波形周期，不是把轨道频率错标一倍。

### 3. 反例、证据链与迁移

- 这条公式只描述渐近 inspiral。近 ISCO 的强场、并合和黑洞 ringdown 需要更高阶 PN、数值相对论或完整波形模型；把 $f\to\infty$ 的闭式发散当成真实铃宕频率是反例。
- redshifted chirp mass 与源帧质量的简并意味着仅凭观测 chirp 不能自动拆出 $z$ 与 $\mathcal M_{\rm src}$；需要距离、宇宙学模型或电磁对应体等额外信息。
- 迁移到真实数据时，质量比、自旋、偏心、探测器响应、宇宙学传播和噪声都会进模型；本实验只检查缩放和帧记号，不做事件参数估计。

### 4. 动手实验：把质量/频率缩放画出来

提交预测前，chirp 曲线和数字账本保持隐藏。提交后可调源帧 $\mathcal M_{\rm src}$、观测 $f_{\rm GW}$ 与红移 $z$；图中三条曲线比较 $\mathcal M_{\rm obs}/2$、当前 $\mathcal M_{\rm obs}$、$2\mathcal M_{\rm obs}$，横轴是观测时间，纵轴是观测到的 GW 频率。

<div class="learning-lab" data-learning-lab="gravitational-chirp" markdown="1">

**JavaScript 失效时的静态 fallback：** 默认取 $\mathcal M_{\rm src}=28M_\odot$、$z=0$、$f_{\rm obs}=30\,\mathrm{Hz}$，于是 $\mathcal M_{\rm obs}=28M_\odot$、$f_{\rm src}=f_{\rm obs}$，且 $f_{\rm orb}=15\,\mathrm{Hz}$。读数由

$$
\dot f=\frac{96}{5}\pi^{8/3}\left(\frac{G\mathcal M_{\rm obs}}{c^3}\right)^{5/3}f_{\rm obs}^{11/3},
\qquad
\tau=\frac5{256}\left(\frac{c^3}{G\mathcal M_{\rm obs}}\right)^{5/3}(\pi f_{\rm obs})^{-8/3}
$$

直接给出。加倍质量时 $(\dot f,\tau)$ 乘 $(2^{5/3},2^{-5/3})$；加倍频率时乘 $(2^{11/3},2^{-8/3})$。若 $z=1$ 而源帧质量仍是 $28M_\odot$，观测 chirp mass 是 $56M_\odot$，观测时间还比源帧时间长一倍。曲线的末端只接近 toy 模型的 coalescence，不是可观测的真实 ringdown。

</div>

</section>


<figure class="diagram" markdown="1">
![黑洞时空 + 双星并合引力波波形（波形可 [plot]）。](assets/img/gr-03-gw-blackhole.svg)
<figcaption><span class="fig-id">图 gr-03.1</span>黑洞时空 + 双星并合引力波波形（波形可 [plot]）。</figcaption>
</figure>

## 1. 黑洞：视界的正确理解

Schwarzschild 坐标在 $r = r_s$ 处"发散"是**坐标病**（换 Eddington–Finkelstein/Kruskal 坐标即光滑【引用】——曲率不变量 $R_{\mu\nu\rho\sigma}R^{\mu\nu\rho\sigma} \propto r^{-6}$ 在视界处有限、只在 $r = 0$ 真发散：**奇点在中心，不在视界**）。

**视界的本性**：$r < r_s$ 内 $g_{tt}, g_{rr}$ 变号——**$r$ 成为时间坐标**：向 $r = 0$ 的"前进"如同向明天前进一样不可拒绝（"落向奇点"是未来，不是方向）——**单行道而非墙**；自由落体者穿视界无局部异感（等效原理）。远方“冻结”是 Schwarzschild 坐标中远方接收者对越来越红移、越来越稀疏的信号的表述，不是视界上的局部不变量，也不是自由落体者真的停住。

**真实黑洞谱系**：Kerr（自转——能层与参考系拖曳【引用】）；在平稳、渐近平坦、四维、满足适当正则性并且电真空 Einstein–Maxwell 等假设下的无毛结论，才把孤立黑洞的外部解压到 $M,J,Q$——不能把它当成任意动态、有物质包围或修改引力理论中的无条件句子。天文身份证：X 射线双星、银心 Sgr A*（恒星轨道绕"看不见的 $4\times10^6M_\odot$"——诺奖 2020）、EHT 的亮环/阴影尺度。对 Schwarzschild toy，阴影半径是 $\sqrt{27}\,GM/c^2\approx5.2\,GM/c^2$（直径约 $10.4\,GM/c^2$）；真实亮环还受光子捕获区、发光等离子体和视线积分影响，不能等同于“光子环 + ISCO 内缘”。

**热力学一瞥（通往量子引力的窗）【引用】**：面积定理（视界面积不减）↔ 熵增；Hawking 温度 $T = \frac{\hbar c^3}{8\pi GMk_B}$（太阳质量 ~$10^{-7}$ K——观测无望但概念革命）；$S = \frac{k_Bc^3A}{4G\hbar}$——**熵正比面积而非体积**：全息原理的种子；信息悖论 = 量子引力的中心谜题（第三档"了望塔"的边界，如实标注）。

## 2. 引力波：度规的涟漪

**线性化【骨架】**：$g = \eta + h$（$|h| \ll 1$）代入场方程、选谐和规范（em-02 Lorenz 规范的引力版）：

$$
\Box\,\bar h_{\mu\nu} = -\frac{16\pi G}{c^4}T_{\mu\nu}
$$

——**波动方程**：引力扰动以光速传播；真空平面波解经 TT 规范剩两个物理自由度——**两种偏振 $h_+, h_\times$**（把圆环拉成十字/斜十字交替的椭圆——LIGO 臂长差的图案）。

**四极辐射公式【引用 + 机理】**：$P \propto \frac{G}{c^5}\langle\dddot Q_{ij}^2\rangle$——从**四极**起步（单极 = 质量守恒禁、偶极 = 动量守恒禁——ced-02 预告的兑现）；$\frac{G}{c^5}$ 极小 ⇒ 只有致密天体的剧烈运动可测。**证据链**：Hulse–Taylor 脉冲双星长期计时显示轨道周期衰减与四极辐射预测在 $10^{-3}$ 量级一致（需扣除系统加速度等修正；间接证据，诺奖 1993）→ **GW150914**（直接，$h\sim10^{-21}$：若用 $L=4\,\mathrm{km}$ 粗算，$\Delta L\sim hL\sim4\times10^{-18}\,\mathrm m$，约为质子直径 $1.7\times10^{-15}\,\mathrm m$ 的 $2\times10^{-3}$，即几百之一，而不是把口号当精确长度；实际测量依靠差分干涉与噪声工程，诺奖 2017）→ GW170817 双中子星 + 电磁对应体（该事件的到达时差把 $|v_g-c|/c$ 约束到 $10^{-15}$ 量级，约束依赖传播距离、源延迟和模型；千新星谱与光变支持致密并合是重元素 r-process 的重要产地，但不是“所有重元素只能由此产生”的万能定论）。

**波形三段**：旋近（chirp——完整波形模型中的频率爬升约束 redshifted chirp mass）→ 并合 → 铃宕（黑洞的简正模——mech-04 的思想在时空本身上响一次）。不能把一条最低阶 inspiral toy 曲线直接当成这三段的完整拟合。

## 3. 宇宙学度规（交棒 cosmo）

**宇宙学原理**（大尺度均匀各向同性）唯一锁定 **FRW 度规**：

$$
ds^2 = -c^2dt^2 + a(t)^2\Big[\frac{dr^2}{1 - kr^2} + r^2d\Omega^2\Big]
$$

——全部动力学压进一个**标度因子 $a(t)$**（$k = 0, \pm1$：平/闭/开的空间几何——微分几何常曲率空间的三选一）。在 FRW 的共动坐标描述下，光的波长随标度因子拉伸，故 $1+z=\frac{a_0}{a_{\rm em}}$；把它简单说成“不是多普勒”过强，因为把红移分解成宇宙学、局部引力或运动学部分依赖坐标与观测者。代入场方程得 Friedmann 方程——cosmo-01 的开场白，本页只交钥匙。

## 4. 练习与要点

**例 1（潮汐撕裂判据）** 视界处潮汐 $\sim \frac{GM}{r_s^3} \propto M^{-2}$：恒星级黑洞在视界外把人"面条化"、星系级黑洞（$10^9M_\odot$）穿视界无感——**越大的黑洞越"温柔"**：反直觉一算便知。

**例 2（chirp 质量读谱）** 以 GW150914 一类事件为例，并合前的频率与频率导数，连同完整波形模型和探测器响应，可约束 redshifted chirp mass 到约 $30M_\odot$ 的量级（四极公式只给最低阶直觉，不能把“从一段声频直接称重”当成无模型测量）。

**例 3（视界熵的荒诞数量级）** 太阳质量黑洞 $S \sim 10^{54}k_B$ vs 太阳本身 $\sim 10^{35}k_B$——坍缩使熵暴涨 19 个数量级：**宇宙的熵预算由黑洞统治**（Penrose 的"为什么早期宇宙熵如此低"由此成为宇宙学最深问题之一，cosmo 线的暗线）。$\blacksquare$

---

*下一门：量子信息三页——把 qm-03 的自旋 ½ 变成计算资源：叠加、纠缠、算法与纠错。*
