# 代数进阶 II · Galois 对应

> **对标**：Dummit & Foote §13–14 / Artin §16 ｜ **前置**：本科抽代 II（域扩张、极小多项式）、alg2-01
> Galois 理论的主定理：**域扩张的中间域 ⟷ Galois 群的子群，一一反序对应**——"解方程的可能性"被翻译成"群的结构"（at-02 覆盖空间对应的代数原型）。本页把对应立起来并配齐工作例；不可解性的引爆留给收官页。


<figure class="diagram" markdown="1">
![Galois 对应：域扩张塔 ↔ 子群格 的倒挂对应。](assets/img/alg2-02-galois.svg)
<figcaption><span class="fig-id">图 alg2-02.1</span>Galois 对应：域扩张塔 ↔ 子群格 的倒挂对应。</figcaption>
</figure>

## 1. 三个前置概念（各一段）

**分裂域**：$f$ 的全部根恰好都在、且由根生成的扩张 $K/F$（存在唯一至同构【骨架：逐根添加 + 同构延拓引理】）。

**正规扩张**：$F$ 上不可约多项式在 $K$ 中要么无根要么全根——"根不落单"（⟺ 某多项式的分裂域）。

**可分扩张**：极小多项式无重根。特征 0 与有限域上**自动可分**【骨架：重根 ⟺ $\gcd(f, f') \neq 1$，特征 0 时 $f' \neq 0$ 且次数更低】——本课程（特征 0 主场）可分性白送，不设障碍。

**Galois 扩张** = 正规 + 可分；**Galois 群** $\mathrm{Gal}(K/F)$ = 固定 $F$ 逐点的 $K$-自同构群。基本事实【骨架】：自同构把根搬到根（系数在 $F$ 里不动 ⇒ 代入保方程）⇒ $\mathrm{Gal}$ 嵌入根的置换群；$|\mathrm{Gal}(K/F)| = [K : F]$（Galois 扩张的标志性等式，由本原元定理或 Artin 引理【引用】）。

## 2. 主定理

**定理（Galois 对应）** $K/F$ 有限 Galois，$G = \mathrm{Gal}(K/F)$：

$$
\big\{\text{中间域 } F \subseteq E \subseteq K\big\} \;\longleftrightarrow\; \big\{\text{子群 } H \leq G\big\}
$$

$E \mapsto \mathrm{Gal}(K/E)$（固定 $E$ 的自同构），$H \mapsto K^H$（$H$ 的不动域）——**互逆、反序**（域越大群越小），且：$[K : E] = |H|$、$[E : F] = [G : H]$；**$E/F$ 正规 ⟺ $H \trianglelefteq G$**，此时 $\mathrm{Gal}(E/F) \cong G/H$。

**【骨架（两个引擎）】** 引擎一（Artin）：$|H| = [K : K^H]$——不动域的次数恰是群的阶（线性无关性论证：Dedekind 引理说不同自同构线性无关【引用】）；引擎二：Galois 扩张的判据 $K^G = F$（"被全群固定的只有底域"）。两引擎合成互逆性；正规性对应 = "共轭子群 ↔ 共轭中间域"的整理。$\blacksquare$

**与 at-02 的对表兑现**：中间域 ↔ 子群（反序）恰如覆盖空间 ↔ 子群；正规扩张 ↔ 正规子群恰如正规覆盖——**两张 Galois 对应表逐行同构**（范畴级同型的两个化身；本科抽代 II 的预告至此双向闭合）。

## 3. 工作例（把对应盘活）

**例 A（全站标准例）** $K = \mathbb{Q}(\sqrt2, \sqrt3)$：$[K:\mathbb{Q}] = 4$（本科已证），$G = \{\mathrm{id}, \sigma, \tau, \sigma\tau\} \cong V_4$（$\sigma: \sqrt2\mapsto-\sqrt2$；$\tau: \sqrt3\mapsto-\sqrt3$）。$V_4$ 的三个 2 阶子群 ↔ 三个中间二次域：

$$
\langle\sigma\rangle \leftrightarrow \mathbb{Q}(\sqrt3), \quad \langle\tau\rangle \leftrightarrow \mathbb{Q}(\sqrt2), \quad \langle\sigma\tau\rangle \leftrightarrow \mathbb{Q}(\sqrt6)
$$

（各是"谁固定谁"的一行验证——**第三个中间域 $\mathbb{Q}(\sqrt6)$ 靠肉眼容易漏、靠群论不可能漏**：对应的第一次实战价值。）

**例 B（不交换的样本）** $x^3 - 2$ 的分裂域 $\mathbb{Q}(\sqrt[3]2, \omega)$（$\omega$ = 三次单位根）：次数 6、$G \cong S_3$（三根的全置换实现）。$S_3$ 的子群格 ↔ 中间域格：$A_3 \trianglelefteq S_3$ ↔ 正规中间域 $\mathbb{Q}(\omega)$；三个不正规的 $\langle$对换$\rangle$ ↔ 三个共轭域 $\mathbb{Q}(\sqrt[3]2\,\omega^k)$（**不正规子群对应"根不齐"的域**——正规性判据的活教材）。

**例 C（有限域，一行全解）** $\mathrm{Gal}(\mathbb{F}_{p^n}/\mathbb{F}_p) = \langle\mathrm{Frob}: x\mapsto x^p\rangle \cong \mathbb{Z}_n$（循环！）——中间域 ↔ $n$ 的因子：本科抽代 II 的有限域结构定理原来是 Galois 对应的最简调用。

## 4. 练习与要点

**例 1（对应反查）** 例 B 中求固定 $\mathbb{Q}(\sqrt[3]2)$ 的子群：$[E:\mathbb{Q}] = 3 \Rightarrow [G:H] = 3 \Rightarrow |H| = 2$——是哪个对换？（固定实根、交换两复根者。）"次数算指数、指数锁子群"的标准操作。

**例 2（分圆域）** $\mathrm{Gal}(\mathbb{Q}(\zeta_n)/\mathbb{Q}) \cong (\mathbb{Z}/n)^*$【骨架：$\zeta_n \mapsto \zeta_n^k$，$k$ 互素】——交换！正十七边形可作图 = $(\mathbb{Z}/17)^*\cong\mathbb{Z}_{16}$ 有 2-幂塔（Gauss 19 岁的成名作在对应语言里两行讲清——本科尺规作图判据的正向应用）。

**例 3（对表默写）** 不看书写出 Galois/覆盖空间对应的六行对照表（对象/态射/正规性/商/万有对象/"群"）——两学科同构的记忆即理解。$\blacksquare$

---

*收官页：把对应变成判决——根式扩张 ⟺ 可解群，$S_5$ 的不可解引爆"五次方程无求根公式"，全站最后一张欠条销账。*
