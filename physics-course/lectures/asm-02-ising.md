# 统计进阶 II · Ising 模型

> **对标**：Goldenfeld §3 / Baxter 入门 ｜ **前置**：asm-01、sm-02、ma-03（转移矩阵 = Perron 的舞台）
> 统计物理的果蝇：$H = -J\sum_{\langle ij\rangle}s_is_j - h\sum s_i$（$s = \pm1$）。本页三场战役：**一维精确解**（转移矩阵法——无相变的证明）、**平均场解**（自洽方程）、**二维 Onsager 结果**（精确解与平均场的对照表）。Ising 同时是 ML 的老朋友——Hopfield 网络与玻尔兹曼机就是它。

## 1. 一维精确解：转移矩阵法

**【推导（完整）】** 周期链的配分函数按键分解：

$$
Z = \sum_{\{s\}}\prod_{i}e^{\beta Js_is_{i+1} + \frac{\beta h}{2}(s_i + s_{i+1})} = \mathrm{Tr}\,T^N
$$

其中 $2\times2$ **转移矩阵** $T_{ss'} = e^{\beta Jss' + \frac{\beta h}{2}(s + s')}$。求迹 = 特征值之和：$Z = \lambda_+^N + \lambda_-^N \approx \lambda_+^N$（热力学极限由**最大特征值统治**——ma-03 Perron–Frobenius 的物理正身：$T$ 元素恒正 ⇒ $\lambda_+$ 非简并）。$h = 0$ 时 $\lambda_\pm = 2\cosh\beta J,\ 2\sinh\beta J$：

$$
f = -k_BT\ln(2\cosh\beta J)
$$

——**处处解析 ⇒ 一维 Ising 无相变**（有限温度磁化恒零）。$\blacksquare$

**为什么一维不了（Peierls 论证）【推导直觉】**：翻转一段畴的能量代价 $= 2J$（两个畴壁）**与段长无关**，而位置熵 $\sim k_B\ln N$ 随尺寸增长——$T > 0$ 时熵必胜、序必碎；二维畴壁代价 $\propto$ 周长，能量能与熵抗衡 ⇒ 有相变（Peierls 由此严格证明二维有序【引用】）——**"能量-熵竞争 + 维数"三句话讲清相变存在性**（sm-01 $F = U - TS$ 博弈的最锋利应用）。

## 2. 平均场解（Weiss 自洽场）

<figure class="plot" markdown="1">
![自发磁化随温度消失](assets/img/asm-02-ising-mag.svg)
<figcaption><span class="fig-id">图 2.1</span>自发磁化随温度：低于临界温度 \(T_c\) 出现非零磁化（\(\pm\) 两支），在 \(T_c\) 连续消失——二级相变的标志。</figcaption>
</figure>

每个自旋感受邻居的平均场 $h_{\text{eff}} = Jzm$（$z$ = 配位数）——单自旋在有效场中的磁化自洽：

$$
m = \tanh\big(\beta Jzm + \beta h\big)
$$

**【推导 + 图解】** $h = 0$：直线 $m$ 与曲线 $\tanh(\beta Jzm)$ 的交点——斜率判据给 $T_c = \frac{Jz}{k_B}$；$T < T_c$ 出现非零解对（对称破缺的图解版）；$T_c$ 附近展开 $\tanh$ 回收 Landau 理论（$\beta = \frac12$ 全套——**Landau 是一切平均场的包络**，asm-01 的公式获得微观出身）。**失误清单**：一维预言 $T_c = \frac{2J}{k_B} > 0$（错——精确解说无相变）；二维预言 $T_c = 4J/k_B$ vs 精确 $2.269J/k_B$——**维数越低错得越狠**（涨落被忽略的代价，Ginzburg 判据的实例）。

## 3. 二维 Onsager（对照表级掌握）

**定理（Onsager 1944）【引用】** 二维方格 $h = 0$ 精确可解：$k_BT_c = \frac{2J}{\ln(1 + \sqrt2)} \approx 2.269J$；比热对数发散（$\alpha = 0_{\log}$）；$\beta = \frac18$（Yang 1952）。

| 指数 | 平均场 | 二维精确 | 三维（数值/共形自举【引用】） |
|---|---|---|---|
| $\beta$ | 1/2 | **1/8** | 0.326 |
| $\gamma$ | 1 | 7/4 | 1.237 |
| $\alpha$ | 0（跳变） | 0（对数） | 0.110 |

**读法**：指数只依赖**维数与对称性**（普适性——液气临界点与三维 Ising 同指数：实验证实的惊人事实），不依赖格子细节/相互作用强度——"为什么"是 asm-03 重整化群的中心问题。Onsager 解的技术（转移矩阵的无穷维对角化/费米子化【引用】）属专门课，结果与含义是常识级必备。

## 4. Ising 的第二人生：机器学习

**同一个能量函数的四张面孔**：Hopfield 联想记忆（$J_{ij}$ 存模式、动力学下坡到记忆——能量景观语言）；**玻尔兹曼机**（Ising 的学习版：调 $J_{ij}$ 使 Boltzmann 分布拟合数据——受限版 RBM 是深度学习史前史的主角）；MCMC 采样的试验场（Metropolis 算法的原生舞台——comp-01 主角）；自旋玻璃（随机 $J_{ij}$）→ 神经网络损失面的统计物理【引用 Parisi 线】。**"能量模型"这个 ML 词汇的能量，就是本页的 $H$**——两个学科在同一公式上各自发展了五十年。

## 5. 练习与要点

**例 1（转移矩阵练手）** 加场 $h$ 的一维链：写出 $T$、算 $\lambda_+$、磁化 $m = \frac{\partial\ln\lambda_+}{\partial(\beta h)} = \frac{\sinh\beta h}{\sqrt{\sinh^2\beta h + e^{-4\beta J}}}$——$T \to 0$ 阶跃、$T > 0$ 光滑（无相变的显式面目）；顺手对账 ma-03："最大特征值的一切"。

**例 2（Peierls 估算二维 $T_c$）** 长 $L$ 畴壁：能量 $2JL$、构型熵 $\sim k_BL\ln3$（自回避行走的粗算）⇒ 畴壁自由能变号于 $k_BT \sim \frac{2J}{\ln 3} \approx 1.8J$——与 Onsager 2.269 同量级：三行估算摸到精确解的门口。

**例 3（RBM 对账）** 写出 RBM 能量 $E = -\sum a_iv_i - \sum b_jh_j - \sum v_iW_{ij}h_j$：可见-隐藏二部 Ising + 局域场——对比学习规则 = 用数据均值与模型均值之差调 $J$（最大似然的梯度，信息论线 MLE=KL 的又一实例）。$\blacksquare$

---

*下一页：普适性之谜的解答——重整化群：把"粗粒化"变成动力系统，临界指数 = 不动点的特征值。*
