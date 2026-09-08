# 基础衔接 10 · Markov 路径桥：八条路径怎样完成一次熵投影

> 先修：[条件期望与鞅](mt-03-conditional-martingale.html)、[计算最优传输](ot-03-computational.html)。本讲把[Schrödinger 桥](frontier-01-schrodinger-bridge.html)缩到两个状态、三个时刻和八条路径，在一页账本中验证向后势、Doob 转移、三时刻边缘与路径相对熵。我们先选择终端势并由它导出终边缘，再证明所得路径律是这对边缘的熵极小桥；这不是求解任意指定双边缘的 Sinkhorn 算法。

<div data-learning-page></div>
<section class="learning-layer" markdown="1" aria-labelledby="markov-paths-title">

<h2 id="markov-paths-title">只改终点偏好，怎样让每一步都提前作出反应？</h2>

## 1. 一枚会停留或翻面的硬币

状态空间只有 $\{0,1\}$，时刻为 $t=0,1,2$。参考过程从

$$
R_0=(1/2,1/2)
$$

出发，每一步使用同一个转移矩阵

$$
K=\begin{pmatrix}1-r&r\\r&1-r\end{pmatrix},
\qquad 0<r<1.
$$

$r$ 是一次翻转状态的概率。因为所有矩阵元都正，八条路径 $(i,j,k)\in\{0,1\}^3$ 在参考律下都有正概率

$$
R(i,j,k)=R_0(i)K_{ij}K_{jk}.
$$

现在希望新过程从指定分布

$$
\mu=(u,1-u),\qquad 0<u<1
$$

出发，并在终点更偏爱状态 1。先选正终端势

$$
g_2=(1,w),\qquad w>0.
$$

$w$ 不是预先指定的终点概率；它只是给落在状态 1 的路径一个相对权重。把 $g_2$ 整体乘同一正数不会改变最后的路径律，所以固定第一个分量为 1 只是消除尺度自由度。

## 2. 终端信息先向后传播

定义

$$
g_1=Kg_2,\qquad g_0=Kg_1=K^2g_2.
$$

逐项写开：

$$
\begin{aligned}
g_1(0)&=1-r+rw,&
g_1(1)&=r+(1-r)w,\\
g_0(0)&=(1-2r+2r^2)+2r(1-r)w,&
g_0(1)&=2r(1-r)+(1-2r+2r^2)w.
\end{aligned}
$$

这里 $g_t(i)$ 可以读作：参考链目前位于 $i$ 时，未来终端权重的条件平均。它满足向后递推，而概率分布稍后沿相反方向向前演化。

为了把新初始边缘钉成 $\mu$，定义

$$
f_i=\frac{\mu_i}{R_0(i)g_0(i)}.
$$

八条路径的新概率为

$$
\boxed{P(i,j,k)=f_iR_0(i)K_{ij}K_{jk}g_2(k)
=\mu_i\frac{K_{ij}K_{jk}g_2(k)}{g_0(i)}.}
$$

对固定 $i$ 求和，$\sum_{j,k}K_{ij}K_{jk}g_2(k)=(K^2g_2)(i)=g_0(i)$，所以

$$
\sum_{j,k}P(i,j,k)=\mu_i.
$$

这同时证明总概率为 1 和 $P_0=\mu$，不是额外归一化后的巧合。

<figure markdown="1">
![三个时刻上，终端势g2经过K向左递推成g1和g0，初始概率mu再经过由相邻g之比扭转的K星向右流到中间边缘和终边缘nu。](assets/img/bridge-10-markov-paths.svg)
<figcaption>势函数向后传递，概率向前流动。相邻势的比值把终点偏好分摊到每一步，同时使每一行仍精确归一。</figcaption>
</figure>

## 3. Doob 转移为什么每行和为一

对 $t=0,1$ 定义扭转后的转移

$$
K_t^*(i,j)=K_{ij}\frac{g_{t+1}(j)}{g_t(i)}.
$$

因为 $g_t=Kg_{t+1}$，所以

$$
\sum_jK_t^*(i,j)
=\frac{\sum_jK_{ij}g_{t+1}(j)}{g_t(i)}=1.
$$

所有项也非负，因此 $K_t^*$ 确实是转移矩阵。把两步相乘时，中间势望远镜消去：

$$
\begin{aligned}
\mu_iK_0^*(i,j)K_1^*(j,k)
&=\mu_iK_{ij}\frac{g_1(j)}{g_0(i)}
K_{jk}\frac{g_2(k)}{g_1(j)}\\
&=\mu_i\frac{K_{ij}K_{jk}g_2(k)}{g_0(i)}
=P(i,j,k).
\end{aligned}
$$

所以 $P$ 是一条从 $\mu$ 出发的 Markov 链，而不是只在路径表上拼出的联合分布。

终点边缘由演化**计算出来**：

$$
\boxed{\nu_k=P_2(k)
=g_2(k)\sum_i\mu_i\frac{(K^2)_{ik}}{g_0(i)}.}
$$

这一步的逻辑顺序很重要：本讲给定 $(r,u,w)$，输出 $\nu$。若问题反过来给定任意 $\mu,\nu$，必须求出同时满足两端约束的势，通常需要 Schrödinger 系统或 Sinkhorn 迭代。

## 4. 默认八路径账本

取实验默认值

$$
r=\frac14,\qquad w=2,\qquad u=\frac12.
$$

则

$$
g_2=(1,2),\quad
g_1=(5/4,7/4),\quad
g_0=(11/8,13/8),\quad
f=(8/11,8/13).
$$

两步扭转转移分别是

$$
K_0^*=
\begin{pmatrix}
15/22&7/22\\
5/26&21/26
\end{pmatrix},
\qquad
K_1^*=
\begin{pmatrix}
3/5&2/5\\
1/7&6/7
\end{pmatrix}.
$$

因此八条路径全部可以逐格复算：

| 路径 $(i,j,k)$ | 精确概率 | 小数 |
|---|---:|---:|
| 000 | $9/44$ | 0.204545 |
| 001 | $3/22$ | 0.136364 |
| 010 | $1/44$ | 0.022727 |
| 011 | $3/22$ | 0.136364 |
| 100 | $3/52$ | 0.057692 |
| 101 | $1/26$ | 0.038462 |
| 110 | $3/52$ | 0.057692 |
| 111 | $9/26$ | 0.346154 |

按时刻求边缘得到

$$
P_0=(1/2,1/2),\qquad
P_1=(125/286,161/286),
\qquad
P_2=\nu=(49/143,94/143).
$$

也可以从前向演化核对终点：

$$
\begin{aligned}
\nu_0&=\frac{125}{286}\frac35+\frac{161}{286}\frac17
=\frac{49}{143},\\
\nu_1&=\frac{125}{286}\frac25+\frac{161}{286}\frac67
=\frac{94}{143}.
\end{aligned}
$$

<div class="learning-lab" data-learning-lab="research-paths" data-research-topic="markov" markdown="1">

**完整静态后备：**先预测增大 $w$ 后，终点状态 1 的概率是否会直接等于 $w/(1+w)$。实验允许 $r$ 从 0.05 到 0.45、$w$ 从 0.25 到 4、$u$ 从 0.1 到 0.9；默认值如上。答案一般不是 $w/(1+w)$，因为初始边缘和两步可达性也进入 $g_0$ 与 $\nu$。

默认八条路径概率见上表；三时刻状态 1 概率依次为

| 时刻 | $P_t(1)$ |
|---:|---:|
| 0 | $1/2=0.500000$ |
| 1 | $161/286\approx0.562937$ |
| 2 | $94/143\approx0.657343$ |

默认路径相对熵为

$$
H(P\mid R)
=\frac12\log\frac8{11}
+\frac12\log\frac8{13}
+\frac{94}{143}\log2
\approx0.0536544.
$$

</div>

## 5. 固定端点以后，中间桥为什么原封不动

新过程的端点联合分布是

$$
\pi_{ik}=\sum_jP(i,j,k)
=\mu_i\frac{(K^2)_{ik}g_2(k)}{g_0(i)}.
$$

给定起点 $i$ 与终点 $k$ 后，中间状态的条件概率为

$$
\boxed{P(j\mid i,k)
=\frac{K_{ij}K_{jk}}{(K^2)_{ik}}.}
$$

$f_i,R_0(i),g_2(k)$ 全部约掉了。右边恰好也是参考链的 $R(j\mid i,k)$。桥改变了不同端点对的权重，却没有改变同一端点对内部怎样经过中间状态。

同一事实也让完整路径 KL 缩成端点 KL。因为

$$
\frac{P(i,j,k)}{R(i,j,k)}=f_i g_2(k),
\qquad
\frac{\pi_{ik}}{R_{02}(i,k)}=f_i g_2(k),
$$

其中 $R_{02}(i,k)=R_0(i)(K^2)_{ik}$，所以

$$
\boxed{H(P\mid R)=H(\pi\mid R_{02}).}
$$

中间状态没有贡献额外 KL，原因不是它“不重要”，而是条件桥被精确保留。

## 6. 为什么它真是这对边缘的熵极小桥

现在固定本讲已经导出的两端边缘 $\mu,\nu$。任取另一条具有相同边缘的路径律 $Q$，相对熵链式分解给

$$
H(Q\mid R)
=H(Q_{02}\mid R_{02})
+\sum_{i,k}Q_{02}(i,k)
H\bigl(Q(\cdot\mid i,k)\mid R(\cdot\mid i,k)\bigr).
$$

第二项非负，所以给定端点联合分布后，保留参考条件桥最省熵。端点层还需证明 $\pi$ 最优。利用

$$
\log\frac{\pi_{ik}}{R_{02}(i,k)}
=\log f_i+\log g_2(k),
$$

以及 $Q_{02}$ 与 $\pi$ 具有相同的行、列边缘，得到

$$
\begin{aligned}
H(Q_{02}\mid R_{02})
&=H(Q_{02}\mid\pi)
+\sum_{i,k}Q_{02}(i,k)\log\frac{\pi_{ik}}{R_{02}(i,k)}\\
&=H(Q_{02}\mid\pi)+H(\pi\mid R_{02})\\
&\ge H(\pi\mid R_{02}).
\end{aligned}
$$

合起来，

$$
H(Q\mid R)\ge H(P\mid R).
$$

在这里所有参考概率都正，等号要求端点表就是 $\pi$，且每个端点条件桥都等于参考条件桥，因此 $P$ 是唯一极小解。这一证明针对由 $(u,w)$ 生成的 $\mu,\nu$；它没有跳过“任意给定 $\nu$ 时怎样求势”的另一半问题。

## 7. 两道迁移题

**题一。** 保持任意 $0<r<1$ 和 $0<u<1$，但令 $w=1$。求 $g_2,g_1,g_0,f$ 与两步转移，并说明为什么新过程仍不一定等于参考过程。

<details markdown="1"><summary>分开检查转移与初始分布</summary>

$g_2=g_1=g_0=(1,1)$，所以 $K_0^*=K_1^*=K$。但

$$
f_i=\frac{\mu_i}{R_0(i)}=2\mu_i,
$$

因此新过程的初始边缘是 $\mu$，未必是参考的 $(1/2,1/2)$。终边缘为 $\nu=\mu K^2$。终端势不倾斜只恢复了参考**转移**，没有抹掉已经指定的初始边缘变化。

</details>

**题二。** 实验故意不允许 $r=0$。若取边界值 $r=0$，参考链只能走 000 与 111。此时本讲构造导出的 $\nu$ 是什么？能否另外指定 $\mu=(1/2,1/2)$、$\nu=(1/4,3/4)$ 并得到有限 KL 的桥？

<details markdown="1"><summary>先检查参考支持</summary>

$r=0$ 时 $K=I$，故 $g_0=g_1=g_2$，路径权重中的终端势与分母相消，得到 $P(000)=u$、$P(111)=1-u$，所以 $\nu=\mu$，与 $w$ 无关。

若强行要求不同的终边缘，就必须给换状态路径正概率，但参考律在这些路径上为零。候选律不再满足 $P\ll R$，于是 $H(P\mid R)=+\infty$。这不是数值迭代太少，而是支持不可达。实验域取 $r\ge0.05$ 正是为了把可计算的全支持模型与这个边界反例分开。

</details>

</section>

## 速查与资料

| 机制 | 可验算等式 | 它保证什么 |
|---|---|---|
| 势向后传 | $g_t=Kg_{t+1}$ | $K_t^*$ 每行和为 1 |
| 概率向前流 | $P(i,j,k)=\mu_iK_0^*(i,j)K_1^*(j,k)$ | $P_0=\mu$，演化得到 $P_2=\nu$ |
| 固定端点条件桥 | $P(j\mid i,k)=K_{ij}K_{jk}/(K^2)_{ik}$ | 中间路径沿用参考桥 |
| KL 望远镜 | $H(P\mid R)=H(\pi\mid R_{02})$ | 没有额外条件路径代价 |
| 熵投影 | $H(Q\mid R)\ge H(P\mid R)$ | 对导出的 $\mu,\nu$，$P$ 是极小桥 |

路径空间 Schrödinger 问题、熵的条件分解与 $(f,g)$ 变换可参见 Léonard 的 [A survey of the Schrödinger problem and some of its connections with optimal transport](https://arxiv.org/abs/1308.0215)；离散 Markov 近似和迭代比例拟合的现代计算路线可参见 Bernton、Heng、Doucet、Jacob 的 [Schrödinger Bridge Samplers](https://arxiv.org/abs/1912.13170)。本讲的八路径结论已在正文中逐项推导；资料核查：2026-09-08。

连续训练：[路径熵与随机场极限](route-02-stochastic-readiness.html)把有限模型、误差控制和退出题接成可交卷的路线。
