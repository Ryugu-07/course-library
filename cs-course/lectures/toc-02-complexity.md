# 计算理论 II · 复杂度理论

> **对标**：Sipser 第 7–10 章 / Arora–Barak *Computational Complexity* ｜ **前置**：toc-01、algo-03（NP 归约）
> 可计算性问"能不能算"，复杂度理论问"要多少资源"。这一页把 P、NP 放进更大的**复杂度类地图**里，讲清它们的结构关系，并触及现代复杂度的深水区（随机、空间、交互、PCP）。这是一门"用资源丈量难度"的几何学。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：检查一张证书，为什么比找证书容易？</h2>
<div class="learning-puzzle">
<h3>具体谜题：一个赋值够不够证明可满足？</h3>
<p>考虑三条子句 <span class="arithmatex">\((x_0\lor x_1)\land(\lnot x_0\lor x_2)\land(\lnot x_1\lor\lnot x_2)\)</span>。给定赋值 <span class="arithmatex">\(x_0=0,x_1=1,x_2=0\)</span>，逐条检查很快；但没有赋值时，要试多少候选？若再加入 10 个不出现在子句中的变量，验证成本是否也乘上 <span class="arithmatex">\(2^{10}\)</span>？</p>
</div>
<div class="learning-prediction">
<h3>先预测两条增长曲线</h3>
<p>先写下：<strong>①</strong> 验证固定证书只需扫描 3 条子句，时间随输入长度多项式增长；<strong>②</strong> 盲搜 <span class="arithmatex">\(n\)</span> 个布尔变量的最坏候选数是 <span class="arithmatex">\(2^n\)</span>；<strong>③</strong> “验证快”并不推出“搜索快”，除非发生 <span class="arithmatex">\(P=NP\)</span> 这样的重大坍缩。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：资源化的证明系统</h3>
<p>复杂度类不是给问题贴“聪明/愚笨”标签，而是规定机器、资源和承诺。P 允许多项式时间直接决定；NP 允许一个短证书加一个多项式验证器；PSPACE 允许多项式工作空间，即使时间可能指数级。换一条资源轴，问题的归属就可能改变。</p>
</div>
<div class="learning-formal">
<h3>形式机制：验证器、包含与量词</h3>
<p><span class="arithmatex">\(L\in NP\)</span> 意味着存在多项式长度证书 <span class="arithmatex">\(w\)</span>，使 <span class="arithmatex">\(V(x,w)=1\)</span> 可在 <span class="arithmatex">\(\mathrm{poly}(|x|)\)</span> 时间完成；因此 <span class="arithmatex">\(P\subseteq NP\subseteq PSPACE\)</span>。把单个存在量词换成交替的 <span class="arithmatex">\(\exists x\forall y\)</span> 会让验证者必须面对对手式分支。细粒度下界则把“若编辑距离快于 <span class="arithmatex">\(n^2\)</span>”归约成 SAT 更快，说明多项式内部也有结构。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul>
<li>一个具体实例验证很快，不代表能为每个实例找到证书；证书长度也必须受多项式限制。</li>
<li>复杂度包含关系不能随意画成严格包含；目前已知的严格处主要来自时间层级，<span class="arithmatex">\(P\ne NP\)</span> 仍未证明。</li>
<li>平均输入很快不等于最坏输入很快；竞争比、参数化复杂度和细粒度假设分别回答不同的“快”。</li>
</ul>
</div>
<div class="learning-transfer">
<h3>迁移题：把“难”拆成机器与资源</h3>
<p>选择一个排程、程序验证或博弈问题，分别写出：输入、证书、验证器、最坏候选数和工作空间。若加入随机性或交互，说明新增的是算法能力、验证方式还是资源预算，并指出你依赖的是定理、猜想还是经验。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-toc-02-complexity" markdown="1">
<p><strong>无 JavaScript 时的静态版本：</strong>三条子句的赋值 <span class="arithmatex">\((0,1,0)\)</span> 可逐条在 3 次检查内验证；若有 <span class="arithmatex">\(n=13\)</span> 个变量，穷举最坏要检查 <span class="arithmatex">\(2^{13}=8192\)</span> 个赋值。加入 10 个无关变量不会增加这张证书的子句扫描，却会把盲搜空间乘以 1024。页面脚本会在 SAT/UNSAT 两种预设间逐项计数，显示验证成本与搜索成本的差异。</p>
</div>
</section>

## 1. 时间复杂度类与 P vs NP 的结构

- **P**：多项式时间可判定——"高效可解"的数学定义。
- **NP**：多项式时间可**验证**（存在多项式长证书，验证器多项式时间接受）。等价定义：非确定图灵机多项式时间。
- **NP 完全**：NP 中最难者（algo-03 已建），SAT 是第一个（Cook–Levin）。
- **coNP**：补问题在 NP（"否"有短证书）。

**P vs NP**：验证容易 $\Rightarrow$ 求解容易？普遍相信 $P\ne NP$，但**没有证明**——这是克雷千禧难题，也是整个算法领域"何时该放弃找多项式算法"的信仰基础。**若 $P=NP$**：密码学崩塌、优化/AI/数学证明搜索全部平凡化——所以它不只是学术问题。

**关键结构事实**：

- 若某个 NPC 问题 ∈ P，则 P=NP（NPC 是"多米诺骨牌的第一张"）。
- **NP-中间**：若 $P\ne NP$，存在既非 P 也非 NPC 的问题（Ladner 定理）——图同构、整数分解是疑似居民（分解的疑难正是 RSA 的安身之所，🔗 crypto-01）。
- **NP $\ne$ coNP 疑似成立**：找不到 UNSAT 的短证书，这是"证明一个公式无解为什么难"的复杂度表述。

## 2. 空间复杂度：另一根资源轴

- **L（对数空间）**：$O(\log n)$ 工作空间——只够存几个指针。图连通性 ∈ L（Reingold 定理，惊人结果）。
- **PSPACE**：多项式空间。**关键**：$P\subseteq NP\subseteq PSPACE$。PSPACE 完全问题的代表是**量化布尔公式 QBF**（$\exists x\forall y\dots$）与**双人博弈**（🔗 博弈论）——"你有必胜策略吗"通常 PSPACE 完全，比 NP 更难。
- **Savitch 定理**：$NPSPACE = PSPACE$（$O(\log^2)$ 空间模拟非确定性）——**空间上不确定性几乎免费**，与时间上（P vs NP）形成戏剧性对比。

**时间–空间的层级总览**：

$$
L\subseteq NL\subseteq P\subseteq NP\subseteq PSPACE\subseteq EXP
$$

其中已知 $P\subsetneq EXP$（时间层级定理——**更多时间严格能做更多事**，用对角线证），所以这条链里**至少有一处严格**，但我们不知道是哪处——**"链上每个 $\subseteq$ 是否 $\subsetneq$"几乎全是未解之谜**，复杂度理论的谦卑就在这里。

<figure class="diagram" markdown="1">
![复杂度类包含关系地图](assets/img/toc-02-complexity-map.svg)
<figcaption><span class="fig-id">图 toc-02.1</span>复杂度类地图——L、NL、P、NP、PSPACE、EXP 的已知包含，以及 NPC、coNP、BPP、IP 的位置。</figcaption>
</figure>

## 3. 随机与交互：更宽的世界

- **BPP**（有界错误多项式随机时间）：随机算法能高效解的类。**普遍相信 $P = BPP$**（去随机化猜想，靠伪随机生成器）——**"随机性可能不增加多项式算力"**，与 algo-03 里随机化的实用威力形成微妙张力：随机让算法更简单更快，但也许不改变"可解边界"。
- **IP（交互证明）**：验证者与全能但不可信的证明者对话。**震撼定理 $IP = PSPACE$**：通过交互 + 随机，验证者能被说服相信 PSPACE 难的事实，尽管自己算不出。
- **零知识证明**（🔗 crypto-02）：证明者让验证者相信"我知道秘密"却不泄露秘密——现代密码学与区块链的引擎，根在交互证明。

**PCP 定理**（复杂度的珠峰）：每个 NP 证明都能改写成一种格式，**验证者只随机读常数个比特就能以高概率判对错**。推论：**许多问题连近似都 NP 难**（algo-03 的不可近似性下界全部来自这里）。这是"验证的局部性"的深刻定理。

## 4. 细粒度复杂度：P 内部的战争

现代算法研究的新前线：**已经是多项式的问题，指数还能不能再降？** 例：编辑距离经典 $O(n^2)$，能否 $O(n^{1.9})$？**细粒度归约**表明——若能，则 SAT 有 $2^{0.99n}$ 算法（违反强指数时间假设 SETH）。**于是 $O(n^2)$ 很可能是编辑距离的天花板，理由是一个关于 SAT 的猜想**。这门学问给"为什么这个多项式算法快不起来"提供了 NP 理论那样的硬下界语言，是当前算法理论最活跃的方向之一。

## 5. 练习与要点

**例 1（验证 vs 求解的直觉）** 数独：填好的盘验证只需 $O(n^2)$，但求解一般盘是 NPC——**"改卷比考试容易"就是 $P\overset?=NP$ 的日常版**。把这个直觉刻进去，很多问题的难度你能秒判。

<figure class="diagram" markdown="1">
![数独验证容易求解困难的 P vs NP 直觉](assets/img/toc-02-verify-vs-solve.svg)
<figcaption><span class="fig-id">图 toc-02.2</span>验证 vs 求解——填好数独后检查很快，但从空盘搜索解一般要面对组合爆炸。</figcaption>
</figure>

**例 2（博弈更难）** 单人谜题（数独、扫雷判定）多在 NP；双人博弈（广义国际象棋、围棋的判定版）常 PSPACE 完全或更高——**"对手会最优应对"这一层量词 $\forall$ 让问题跳档**。这解释了为什么博弈 AI 比谜题求解器难得多。

**例 3（去随机化的赌注）** 若你相信 $P=BPP$，那么 algo-03 里所有随机算法原则上都有等效的确定性版本——只是我们还不会写。**"随机性是本质的还是仅仅方便的"至今悬而未决**，这是理论与实践张力的一个漂亮缩影。$\blacksquare$

---

*下一页：密码学 I——把 P vs NP 的"难"变成"安全"：对称加密、公钥与数论基础。*
