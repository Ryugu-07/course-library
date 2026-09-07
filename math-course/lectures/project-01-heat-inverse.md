# 综合项目 · 从冷却后的温度反推初态

> 数学入口：一次热扩散实验，把正交投影、奇异值、最小二乘和正则化连成一条推导。本项目使用**按公开协议构造的模拟数据**。三个课程站点共享相同参数、数据划分和实验。
>
> 先修可按需查阅：[内积、正交与奇异值分解](algebra-06-quadratic.html)、[线性系统与数值稳定性](num-02-linear-systems.html)、[热方程与分离变量](pde-01-separation.html)。继续阅读：[物理入口](../../physics-course/site/project-01-heat-inverse.html) · [AI 入口](../../ai-course/site/project-01-heat-inverse.html)。

<div data-learning-page></div>

<section class="learning-layer" markdown="1" aria-labelledby="heat-inverse-math-title">

<h2 id="heat-inverse-math-title">学习层：数据拟合得很好，为什么初始温度仍会错得很远？</h2>

### 1. 要恢复的是什么？

设想一根长 $L=1\,\mathrm m$ 的细棒，初始加热结束后不再有持续热源。我们只在 $t=1\,\mathrm s$ 读到 16 个内部传感器的温度，却想知道刚开始时哪里更热、哪里更冷。热扩散已经削弱了温度起伏；传感器还带有误差。直接把扩散“倒过来算”，会把什么一起放大？

用 $u(x,t)$ 表示相对固定环境的**超额温度**，单位为 K；负值表示比环境冷。两端保持 $u=0$，热扩散率固定为 $\kappa=0.01\,\mathrm{m^2/s}$，忽略对流和辐射。本页先采用这套模型；模型错误留到后面的检验。

传感器位置是 $x_j=jL/17$，$j=1,\ldots,16$。只保留八种正弦形状，把初始读数写成

$$
\mathbf u_0=Q\mathbf a,\qquad
Q_{jk}=\sqrt{\frac{2}{17}}\sin\frac{jk\pi}{17},\quad k=1,\ldots,8.
$$

$\mathbf a=(a_1,\ldots,a_8)^\mathsf T$ 是待恢复的八个系数，单位为 K。$a_1$ 控制宽缓的起伏，较大的 $k$ 对应更细的空间变化。这个归一化使离散列向量满足 $Q^\mathsf TQ=I_8$；它按 **16 个传感器的求和内积**归一化。连续曲线也使用同一个 $\sqrt{2/17}$ 因子，不另换成连续 $L^2$ 归一化。

热方程 $u_t=\kappa u_{xx}$ 使第 $k$ 种形状的系数乘上

$$
s_k(t)=\exp\!\left[-\kappa\left(\frac{k\pi}{L}\right)^2t\right].
$$

指数无量纲：$\kappa$ 的 $\mathrm{m^2/s}$、波数平方的 $\mathrm{m^{-2}}$ 和时间的 $\mathrm s$ 相消。定义 $S=\operatorname{diag}(s_1,\ldots,s_8)$，传感器观测便是

$$
\mathbf y=QS\mathbf a+\boldsymbol\epsilon.
$$

这里 $\boldsymbol\epsilon$ 的 16 个分量独立服从 $N(0,\sigma^2)$，默认 $\sigma=0.02\,\mathrm K$。八模态假设限制了我们能重建的形状；它尚未描述完整的无限维逆热问题。

### 2. 先算两个模态，看噪声怎样进入答案

先做一个人工指定扰动的手算练习：仅令 $a_1=6\,\mathrm K$、$a_6=0.20\,\mathrm K$，其余系数为零。把观测投影为 $\mathbf b=Q^\mathsf T\mathbf y$，这一次指定投影扰动 $\eta_1=0$、$\eta_6=0.02\,\mathrm K$，其余为零。完整随机基准仍使用上一节的独立传感器噪声。

先预测：相同量级的读数误差，放到第 1 模态和第 6 模态上，会造成相同的初态误差吗？

因为 $Q^\mathsf TQ=I$，每个投影读数满足 $b_k=s_ka_k+\eta_k$。在 $t=1\,\mathrm s$：

| 模态 | 衰减 $s_k$ | 初态系数 $a_k$（K） | 投影读数 $b_k$（K） | 直接相除 $b_k/s_k$（K） |
|---|---:|---:|---:|---:|
| $k=1$ | $0.906018$ | $6.000000$ | $5.436108$ | $6.000000$ |
| $k=6$ | $0.028637$ | $0.200000$ | $0.025727$ | $0.898399$ |

第 6 模态的原始信号到观测时刻只剩 $0.028637\times0.20\approx0.005727\,\mathrm K$。把 $0.02\,\mathrm K$ 的扰动一起除以 $0.028637$，初态系数就多出约 $0.698399\,\mathrm K$。算法确实解出了观测方程，但这个方程包含噪声。

### 3. 投影与奇异值：把“难恢复”写成一个数

令 $A=QS$。这是一个 $16\times8$ 矩阵；由于 $Q$ 的列正交归一、$S$ 的对角元正且从大到小排列，

$$
A=QSI_8^\mathsf T
$$

就是它的薄奇异值分解。此处的奇异值恰好是热衰减因子 $s_k$：输入第 $k$ 个单位系数时，输出向量的长度只剩 $s_k$。在 $t=1\,\mathrm s$，$s_8\approx0.00180617$，因此

$$
\operatorname{cond}_2(A)=\frac{s_1}{s_8}\approx501.624.
$$

这个数描述八模态模型最容易与最难传递的方向相差多少。它不表示每一次重建误差都恰好放大 501 倍；实际误差还取决于扰动落在哪些方向。

正交投影还能解释为什么先计算 $\mathbf b$ 不会丢掉可用于这个模型的拟合信息。将 $\mathbf y$ 分成 $Q\mathbf b$ 和与 $Q$ 的列空间垂直的部分，勾股关系给出

$$
\|A\mathbf a-\mathbf y\|_2^2
=\|S\mathbf a-\mathbf b\|_2^2
+\|(I_{16}-QQ^\mathsf T)\mathbf y\|_2^2.
$$

第二项不随 $\mathbf a$ 改变，所以最小化原始 16 个读数的残差，等价于最小化八个模态的残差。它也提醒我们：即使把八个模态完全拟合，16 个传感器的残差通常仍非零。

### 4. 最小二乘解存在，稳定性仍可能很差

支持的时间范围内所有 $s_k>0$，无正则最小二乘解唯一：

$$
\widehat a_k^{\rm LS}=\frac{b_k}{s_k}
=a_k+\frac{\eta_k}{s_k}.
$$

由 $\boldsymbol\eta=Q^\mathsf T\boldsymbol\epsilon$ 和正交归一性，

$$
\operatorname{Cov}(\boldsymbol\eta)
=Q^\mathsf T(\sigma^2I_{16})Q=\sigma^2I_8,
\qquad
\operatorname{Var}(\widehat a_k^{\rm LS}-a_k)=\frac{\sigma^2}{s_k^2}.
$$

投影本身没有增加每个模态的噪声方差；逆运算中的除法才造成放大。观测越晚，高频 $s_k$ 越小。这是数值反演中的关键区别：**方程有唯一解，并不保证数据稍变时答案也只稍变。**

在本页的八模态模型内，传感器上的初态误差还可直接由系数计算：

$$
\operatorname{RMSE}_{\rm initial}
=\sqrt{\frac{1}{16}\|Q(\widehat{\mathbf a}-\mathbf a)\|_2^2}
=\frac{\|\widehat{\mathbf a}-\mathbf a\|_2}{4}.
$$

所以刚才两模态手算的初态 RMSE 约为 $0.174600\,\mathrm K$。分母 4 来自 16 个传感器，与取了几个非零模态无关。

### 5. 从目标函数求导，得到 Tikhonov 滤波器

如果不允许反演任意放大系数，可以增加一个系数大小惩罚：

$$
J(\mathbf a)=\|S\mathbf a-\mathbf b\|_2^2+\lambda\|\mathbf a\|_2^2
=\sum_{k=1}^8\big[(s_ka_k-b_k)^2+\lambda a_k^2\big],
\qquad\lambda>0.
$$

这是**零阶 Tikhonov 正则化**。它惩罚系数幅度，不是空间导数；本协议也没有把残差除以 $\sigma^2$，因此不能在公式里另插一个噪声方差因子。$s_k$ 与 $\lambda$ 均无量纲，$J$ 的单位为 $\mathrm K^2$。

各模态彼此分开，固定其余系数，对 $a_k$ 求偏导：

$$
\frac{\partial J}{\partial a_k}
=2s_k(s_ka_k-b_k)+2\lambda a_k=0
\quad\Longrightarrow\quad
\widehat a_k^{\rm Tik}=\frac{s_kb_k}{s_k^2+\lambda}.
$$

二阶偏导 $2(s_k^2+\lambda)>0$，所以这个驻点就是该模态的唯一最小值。把答案与最小二乘并排写，变化更清楚：

$$
\widehat a_k^{\rm Tik}
=\underbrace{\frac{s_k^2}{s_k^2+\lambda}}_{\text{介于 0 与 1 之间的收缩因子}}
\widehat a_k^{\rm LS}.
$$

当 $s_k^2\gg\lambda$ 时，几乎保留直接反演；当 $s_k^2\ll\lambda$ 时，显著压低这个不稳定方向。这样也会压低真实信号，因此要在偏差与噪声之间取舍。

在两模态手算中取手动 $\lambda=0.001$，得到 $\widehat a_1\approx5.992700\,\mathrm K$、$\widehat a_6\approx0.404793\,\mathrm K$，初态 RMSE 约为 $0.051231\,\mathrm K$。这一组数据的误差改善了；下一组数据是否仍改善，需要检验。

### 6. 先预测，再打开三种反演的共同实验

操作前先写下理由：

1. 从 $t=0.5$ 改到 $1.5\,\mathrm s$，噪声强度相同，哪类空间细节更难恢复？
2. 增大手动 $\lambda$，为什么可能让曲线更平稳，却离真实初态更远？
3. 如果一个算法对 $t+0.5\,\mathrm s$ 的温度预测很好，是否已证明它恢复了初态的高频细节？

实验还提供一个从训练轨迹学得的对角线性滤波器 $\widehat a_k=w_kb_k$。它只有八个权重，不是神经网络；其训练与分布变化问题在 [AI 入口](../../ai-course/site/project-01-heat-inverse.html) 展开。

<div class="learning-lab" data-learning-lab="heat-inverse-project" markdown="1">

**JavaScript 不可用时的完整静态后备。** 默认采用 $L=1\,\mathrm m$、$\kappa=0.01\,\mathrm{m^2/s}$、16 个内部传感器、8 个模态、$t=1\,\mathrm s$、$\sigma=0.02\,\mathrm K$，测试情境为 smooth。数据由公开确定性发生器生成：128 条完整训练轨迹、32 条验证轨迹、32 条测试轨迹，种子分别为 101、202、303；同一条轨迹的传感器读数不跨集合。

从输入到输出的计算步骤是：

1. 对每条轨迹计算 $\mathbf b=Q^\mathsf T\mathbf y$，使用上文 $s_k(t)$。
2. 最小二乘取 $b_k/s_k$。Tikhonov 取 $s_kb_k/(s_k^2+\lambda)$。
3. 仅在训练集拟合 $w_k=\sum b_ka_k/\sum b_k^2$。分母与分子均在 128 条训练轨迹上求和；不使用截距、验证行或测试标签。
4. 从 $10^{-6},10^{-5},10^{-4},10^{-3},10^{-2},10^{-1}$ 中，按 32 条验证轨迹的平均初态 MSE 选 $\lambda$；相等时选较小值。默认选中 $\lambda=0.01$。这是下表的参数，手动探索的默认值 $0.001$ 单独使用。
5. 固定以上参数，在 32 条测试轨迹上评估。每个总体指标先合并所有轨迹、所有传感器的平方误差，再取平均和平方根。

| 默认测试集的算法 | 初态 RMSE（K） | 拟合时刻观测残差 RMS（K） | 独立晚时刻预测 RMSE（K） |
|---|---:|---:|---:|
| 无正则最小二乘 | $3.254382$ | $0.014445$ | $0.022268$ |
| Tikhonov，验证选 $\lambda=0.01$ | $0.052893$ | $0.024608$ | $0.028316$ |
| 训练所得对角线性滤波器 | $0.043310$ | $0.017826$ | $0.022202$ |

这些数值按协议独立计算，保留六位小数。这里的“晚时刻”是 $t+0.5\,\mathrm s$，使用另一组独立传感器噪声；这些读数从未参与拟合。它的 RMSE 是相对**有噪声的新观测**计算，即使初态与模型完全正确，也仍有噪声误差。

最小二乘取得较小的拟合残差，却有很大的初态误差；晚时刻的进一步扩散又削弱了那部分高频错误。因此，不能仅靠残差或未来温度就断言初态细节正确。初态真值在这里可查，是因为数据来自模拟。

下载：[完整协议](assets/learning/projects/heat-inverse/PROTOCOL.md) · [独立 NumPy 参考脚本](assets/learning/projects/heat-inverse/reference.py) · [默认基准完整数据](assets/learning/projects/heat-inverse/benchmark-default.json)。协议固定了随机数发生器、每次抽样顺序、导出字段和评估方式，可离线重复表中计算。

</div>

### 7. 换一个情境，检查结论的边界

**题 A：正则化一定更准吗？** 保持 $t=1\,\mathrm s$，现在没有噪声，且只有 $a_6=6\,\mathrm K$ 非零。比较最小二乘与手动 $\lambda=0.001$ 的重建。解释为什么上一节的排序不构成普遍定理。

<details markdown="1">
<summary>完成题 A 后核对</summary>

此时 $b_6=6s_6$。最小二乘恢复 $a_6=6$；Tikhonov 给

$$
\widehat a_6=6\frac{s_6^2}{s_6^2+0.001}\approx2.703432\,\mathrm K.
$$

它把真实的高频成分也压低了。零噪声且前向模型正确时，这个有限维模型的直接反演能够精确恢复；固定正 $\lambda$ 的收缩反而带来偏差。本题是单模态构造；实验的 high-frequency 情境则在原测试轨迹第 6 系数上按索引交替加减 $6\,\mathrm K$，二者不要混作同一组数据。

</details>

**题 B：如果热扩散率估错了呢？** 无噪声时，真实测试棒的 $\kappa_{\rm true}=0.016\,\mathrm{m^2/s}$，反演仍假设 $\kappa_{\rm assumed}=0.01\,\mathrm{m^2/s}$。写出直接反演的 $\widehat a_k/a_k$（假设 $a_k\ne0$），判断高频会被高估还是低估。

<details markdown="1">
<summary>完成题 B 后核对</summary>

数据由真实衰减生成，计算却除以假设衰减，因此

$$
\frac{\widehat a_k}{a_k}
=\frac{s_k^{\rm true}(t)}{s_k^{\rm assumed}(t)}
=\exp\!\left[-(0.016-0.01)\left(\frac{k\pi}{L}\right)^2t\right]<1.
$$

高频系数的幅度被低估得更严重；这是前向模型错误，即使传感器无噪声也存在。增大样本数或套用一个正则化公式，不会自动修正所假设的扩散率。可在实验的 wrong-diffusivity 情境中检验，并到 [物理入口](../../physics-course/site/project-01-heat-inverse.html) 讨论怎样取得独立的材料与时间证据。

</details>

这个项目中的奇异值告诉我们哪些初态方向在观测中已经很弱，正则化则明确规定怎样处理这些方向。相同问题还会出现在模糊图像复原、层析成像和参数反演中：先写清前向模型、数据噪声与允许的解空间，再决定怎样求逆，以及用什么证据验证答案。

</section>

## 项目速查

| 对象 | 八模态模型中的公式 | 使用条件 |
|---|---|---|
| 前向观测 | $y=QS a+\varepsilon$，$Q^\top Q=I$ | 固定浴温端点，常数扩散率，16 个测点 |
| 奇异值 | $s_k=e^{-\kappa(k\pi/L)^2t}$ | $k=1,\ldots,8$，$L=1$ m |
| 最小二乘 | $\widehat a_k=(Q^\top y)_k/s_k$ | 数据误差会被 $1/s_k$ 放大 |
| 零阶 Tikhonov | $\widehat a_k=s_k(Q^\top y)_k/(s_k^2+\lambda)$ | 惩罚 $\lambda\lVert a\rVert^2$；验证集选择基准参数 |
| 初态 RMSE | $\lVert\widehat a-a\rVert_2/4$ K | 只对本项目的正交离散模型成立；真值来自模拟 |

学习模式包含推导、交互实验与反例。复现文件：[协议](assets/learning/projects/heat-inverse/PROTOCOL.md)、[NumPy 脚本](assets/learning/projects/heat-inverse/reference.py)、[默认数据](assets/learning/projects/heat-inverse/benchmark-default.json)。
