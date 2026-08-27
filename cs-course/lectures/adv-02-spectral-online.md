# 高级算法 II · 谱图论与在线算法

> **对标**：MIT 6.854 / Spielman *Spectral Graph Theory* / 竞争分析经典 ｜ **前置**：adv-01、数学站线代（特征值、Rayleigh 商）、概率线
> 两个高级主题，各自展示一种"数学直接变算法"的美：**谱图论**把图的组合性质编码进拉普拉斯矩阵的特征值（你在线代里学的 Rayleigh 商直接上岗）；**在线算法**处理"必须在看到未来前决策"的问题，用竞争比量化"不知未来的代价"。

<div data-learning-page></div>

<section class="learning-layer" markdown="1">
<h2>学习层：谱隙和“看不见未来”各自测量什么？</h2>
<div class="learning-puzzle">
<h3>具体谜题：哪张图更容易被切开？</h3>
<p>比较四点路径 <span class="arithmatex">\(0-1-2-3\)</span> 与两条紧密小团之间只有一条弱桥的图。把每个点标成一个实数，要求相邻点差别不要太大：哪张图的非平凡最光滑标注代价更小？再想 ski rental：每天租 1 元、买断价 <span class="arithmatex">\(B=5\)</span>，只知道今天，不知道还会滑几天，什么时候买才不至于被最坏未来击穿？</p>
</div>
<div class="learning-prediction">
<h3>先预测两个量</h3>
<p>先写下：<strong>①</strong> 两个不连通分量的 <span class="arithmatex">\(\lambda_2\)</span> 应为 0，弱桥图的 <span class="arithmatex">\(\lambda_2\)</span> 小于路径图；<strong>②</strong> 租到累计 5 元再买的确定性策略最坏接近 2 倍离线最优；<strong>③</strong> 谱量给的是结构证据，竞争比给的是对手证据，二者都不是“平均表现”。</p>
</div>
<div class="learning-model">
<h3>最小心智模型：能量与遗憾</h3>
<p>拉普拉斯二次型把图标注的粗糙度加总；在去掉常数向量后，最小 Rayleigh 商就是最平滑的非平凡方向。在线算法则保存一个当前策略和它付出的成本，拿它与事后知道整个序列的离线最优比较。一个是空间结构的证书，一个是信息不足的代价。</p>
</div>
<div class="learning-formal">
<h3>形式机制：Rayleigh 商与竞争比</h3>
<p>对无向图 <span class="arithmatex">\(L=D-A\)</span>，有 <span class="arithmatex">\(x^TLx=\sum_{(u,v)\in E}(x_u-x_v)^2\ge0\)</span>，且 <span class="arithmatex">\(\lambda_2=\min_{x\perp\mathbf1}x^TLx/(x^Tx)\)</span>。Cheeger 不等式把它与稀疏割 <span class="arithmatex">\(\phi\)</span> 夹住。在线成本用 <span class="arithmatex">\(\sup_\sigma C_{\mathrm{on}}(\sigma)/C_{\mathrm{off}}(\sigma)\)</span> 定义；ski rental 在阈值 <span class="arithmatex">\(B\)</span> 处购买，成本至多 <span class="arithmatex">\(2\min(H,B)\)</span>。</p>
</div>
<div class="learning-boundary">
<h3>反例与失效边界</h3>
<ul>
<li><span class="arithmatex">\(\lambda_2=0\)</span> 只说明不连通；Fiedler 向量的符号切分是有理论支持的启发式，不等于所有图上的最小割。</li>
<li>谱值会依赖加权/归一化约定；把组合拉普拉斯与随机游走矩阵的特征值直接互换会错一个模型。</li>
<li>竞争比是最坏序列比值，不等于平均延迟；一个在线策略可以平均很好，却被一个精心安排的未来击中。</li>
</ul>
</div>
<div class="learning-transfer">
<h3>迁移题：识别证据的类型</h3>
<p>对社交图聚类、PageRank、缓存淘汰和云资源租赁，分别写出你要观察的谱量或势函数、离线基准和失败边界。说明何时应选特征向量来发现结构，何时应选竞争分析来保证不知道未来时仍有上界。</p>
</div>
<div class="learning-lab" data-learning-lab="cs-adv-02-spectral-online" markdown="1">
<p><strong>无 JavaScript 时的静态版本：</strong>四点路径的已知第二特征值约为 <span class="arithmatex">\(\lambda_2=2-\sqrt2\approx0.586\)</span>；两条分离的边有两个连通分量，故 <span class="arithmatex">\(\lambda_2=0\)</span>。Ski rental 若 <span class="arithmatex">\(B=5\)</span> 且恰好滑 5 天，在线策略租满 5 天、总成本 5，离线最优成本 5，比值 1；若滑 6 天，在线策略再买入、总成本 10，离线最优成本 5，比值 2；滑 3 天时在线成本 3、离线成本 3。页面脚本会切换图谱和未来长度，显示 Rayleigh 能量与竞争比。</p>
</div>
</section>

## 1. 图拉普拉斯：图的线性代数化身

图 $G$ 的**拉普拉斯矩阵** $L = D - A$（$D$ 度对角阵、$A$ 邻接阵）。它是本段主角，性质全从二次型来：

$$
x^T L x = \sum_{(u,v)\in E}(x_u - x_v)^2 \ge 0
$$

——**半正定**，且这个式子把"相邻点取值差"求和：$L$ 度量一个点标注函数在图上的"不光滑度"。

**特征值 $0=\lambda_1\le\lambda_2\le\cdots\le\lambda_n$ 的意义**：

- $\lambda_1=0$，重数 = **连通分量数**（每个分量的示性向量是零特征向量）。
- $\lambda_2$（**代数连通度 / Fiedler 值**）> 0 ⟺ 图连通；它越大图越"难切开"。对应特征向量（Fiedler 向量）的正负号给出一个好的**图二分**——**谱聚类**的原理。

<figure class="plot" markdown="1">
![Fiedler 向量按正负号切分路径图](assets/img/adv-02-fiedler.svg)
<figcaption><span class="fig-id">图 adv-02.1</span>Fiedler 向量——拉普拉斯第二小特征向量沿图平滑变化，零点附近给出自然二分。</figcaption>
</figure>

**Cheeger 不等式【骨架 + 直觉】**：定义电导（conductance）$\phi$ = "最省的稀疏割"，则

$$
\frac{\lambda_2}{2} \le \phi \le \sqrt{2\lambda_2}.
$$

**特征值夹住了组合的割**——线代量 $\lambda_2$ 与组合量 $\phi$ 互相控制。这是"用特征向量做聚类/分割"可靠的理论依据（🔗 数学站线代的 Rayleigh 商 $\lambda_2 = \min_{x\perp\mathbf 1}\frac{x^TLx}{x^Tx}$ 在这里直接就是"最光滑的非平凡标注"）。

<figure class="diagram" markdown="1">
![Cheeger 不等式连接谱间隙和稀疏割](assets/img/adv-02-cheeger.svg)
<figcaption><span class="fig-id">图 adv-02.2</span>Cheeger 不等式——谱量 λ₂ 与组合瓶颈 φ 互相控制，解释谱切割为何可靠。</figcaption>
</figure>

**应用全景**：谱聚类（ML）、PageRank（随机游走的稳态 = 特定矩阵主特征向量，🔗 math 站 model 线与 grad-math 马尔可夫）、图画法、Laplacian 求解器（Spielman–Teng 近线性时间解 $Lx=b$，现代算法高峰）、expander 图（$\lambda_2$ 大 = 稀疏但强连通，伪随机与纠错码的基石）。

## 2. 随机游走与混合时间

图上随机游走的转移矩阵 $P = D^{-1}A$，稳态分布 $\pi_v\propto\deg(v)$。**混合时间**（走多久才接近稳态）由**谱隙** $1-\lambda_2(P)$ 控制：隙大则混合快。这把"游走多快遍历图"翻译成特征值问题。**expander = 谱隙大 = 快速混合**——MCMC 采样（🔗 physics 站 comp-01 Metropolis、grad-math 马尔可夫）收敛快慢的完整解释就在这里。

**读法**：**"图的动力学（游走）与图的几何（割）都被同一组特征值决定"**——谱图论的中心思想，一句话记住。

## 3. 在线算法：不知未来如何决策

**在线问题**：输入逐个到达，每步必须**不可撤销地**决策，看不到后续。用**竞争比**衡量：

$$
\text{竞争比} = \max_{\text{输入}}\frac{\text{在线算法代价}}{\text{离线最优代价（事后诸葛）}}
$$

——"不知未来"的代价的最坏定量。

**样板一：缓存/分页置换** 内存装 $k$ 页，缺页要换出一页——换哪个？LRU / FIFO 都是 **$k$-竞争**（最坏是最优的 $k$ 倍），且这是确定性算法的下界。**随机化 marking 算法把竞争比降到 $O(\log k)$**——又一次随机性打败最坏情况（呼应 algo-03）。这直接是 csapp-02 缓存、os-03 页面置换的理论天花板。

**样板二：租还是买（ski rental）** 滑雪每天租金 1 元、买断价为 $B$ 元，不知还要滑几天——**"先租到累计花费等于 $B$ 元时再买"是 2-竞争**，且随机化能到 $\frac{e}{e-1}\approx1.58$。这个玩具模型是**一切"何时从租用切换到自建"决策的原型**（云上按量付费 vs 包年、连接池、缓存预热……）。

<figure class="plot" markdown="1">
![滑雪租赁问题租到阈值再买的竞争比](assets/img/adv-02-ski-rental.svg)
<figcaption><span class="fig-id">图 adv-02.3</span>Ski rental——先租到累计成本 B 再买，最坏总成本不超过离线最优的 2 倍。</figcaption>
</figure>

**样板三：在线学习 / 专家问题** $n$ 个专家每天给建议，你要跟着谁？**加权多数 / Multiplicative Weights**：按历史表现给专家指数加权，跟随加权投票——**遗憾（regret）$O(\sqrt{T\log n})$**，趋于最优专家。这个 MW 框架惊人地通用：它统一了 boosting（ML）、求解零和博弈（🔗 math 站博弈论）、近似 LP、甚至 AdaBoost——**"指数加权 + 在线更新"是一把万能钥匙**。

## 4. 势函数法：在线与摊还分析的统一工具

怎么证竞争比 / 摊还复杂度？**势函数 $\Phi$**：定义一个刻画"当前状态好坏"的量，证明"每步真实代价 + 势变化 $\le \rho\times$ 最优代价"，累加即得竞争比。**摊还分析**（动态数组倍增、并查集、伸展树）用同一招：单次操作可能贵，但势的涨落把成本摊平。**势函数是"局部不等式累加成全局界"的通用范式**（🔗 与物理站的李雅普诺夫函数、能量法同构——你在物理站见过这个思想）。

## 5. 练习与要点

**例 1（Fiedler 手算）** 一条 4 点路径图，写出 $L$，求 $\lambda_2$ 与 Fiedler 向量——你会看到向量沿路径单调（正负各半），据此切成两段正是最自然的二分。**谱聚类在最小例子上现形**。

**例 2（ski rental 最优性）** 证明任何确定性"租到第 $d$ 天买"策略的竞争比 $\ge 2-\frac1B$：对手让你刚买完就不滑了。**竞争分析的对手视角**——最坏情况是被精心构造的。

**例 3（MW 一题多解）** 用 Multiplicative Weights 求解一个 2×2 零和博弈的近似均衡：把行策略当"专家"、列的最优反应当"损失"，迭代加权收敛到 minimax 值（🔗 博弈论线）——**同一个算法，昨天做专家预测，今天求纳什均衡**。$\blacksquare$

---

*下一页：计算理论 I——自动机的层级与可计算性的边界，停机问题为什么无解。*
