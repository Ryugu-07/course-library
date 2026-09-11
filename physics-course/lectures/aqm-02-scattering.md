# 高量 II · 散射理论：由边界相位读出远场

> **前置**：[角动量与对称性](aqm-01-symmetry.html)、[量子框架](qm-01-framework.html)、[特殊函数](mp-01-special-functions.html)。**目标**：从概率流建立截面，实际匹配分波，再用光学定理和近似阶数检查答案。

<div class="scattering-course" markdown="1">
<style>.scattering-course .learning-lab{margin-left:0;margin-right:0;width:100%}.scattering-course .fallback-scroll{overflow:auto;max-width:100%}.scattering-course .fallback-scroll td{overflow-wrap:anywhere}.scattering-course .fallback-scroll td:last-child{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:.8em}</style>
<noscript><style>.scattering-course span.arithmatex{overflow-wrap:anywhere;white-space:normal}</style></noscript>

<div data-learning-page></div>
<section class="learning-layer" markdown="1">

## 学习层：势阱更深，远处的计数一定更多吗？

低能粒子进入一个小范围吸引井，井内波长缩短，出井时的相位也改变。但相位变化可以增强散射，也可以让散射振幅接近零。散射测量不是直接拍摄势能曲线，而是读取出射波的角分布，再借助模型解释它。

先用弱井建立直觉，再比较阈值附近与低能散射零点。接着提高入射波数，看看只保留s波会漏掉什么。最后加入一个受限的损失模型：出射弹性流减少了，光学定理记下的总截面却包含被转移到其他通道的概率。

<div class="learning-lab" data-learning-lab="swave-scattering" markdown="1">

**先预测，再揭示。** 实方井固定R=1、2μ/ℏ²=1。逐个求出ℓ=0至6的边界匹配，用所选L截断合成振幅。η=1是实方井；η小于1时，只给保留的有限通道叠加现象学损失，径向图仍是实方井参考。实验没有求解复势或指定实际反应产物。

<figure class="plot" markdown="1">
[![散射的四个固定场景](assets/img/aqm-02-scattering-ledgers.svg)](assets/img/aqm-02-scattering-ledgers.svg)
<figcaption>图2.1：打开原图，比较边界匹配、窄共振和两种截面。</figcaption>
</figure>

<div class="fallback-scroll" role="region" tabindex="0" aria-label="散射固定数值记录">
<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>
<tr><td>弱井：弹性截面</td><td>0.10138506930601118</td></tr>
<tr><td>弱井：反应截面</td><td>0</td></tr>
<tr><td>弱井：总截面</td><td>0.10138506930601114</td></tr>
<tr><td>弱井：光学定理</td><td>0.10138506930601113</td></tr>
<tr><td>弱井：散射长度</td><td>-0.09260497968758098</td></tr>
<tr><td>阈值附近：s波上限占比</td><td>0.9999000047722287</td></tr>
<tr><td>阈值附近：弹性截面</td><td>31412.785093199556</td></tr>
<tr><td>阈值附近：光学定理</td><td>31412.785093199556</td></tr>
<tr><td>阈值附近：k</td><td>0.02</td></tr>
<tr><td>阈值附近：V₀</td><td>2.4674011002723395</td></tr>
<tr><td>深井：L=6弹性截面</td><td>14.572309257156258</td></tr>
<tr><td>深井：只取s波截面</td><td>0.1600300369989637</td></tr>
<tr><td>深井：前向Im f</td><td>2.8990688131752544</td></tr>
<tr><td>深井：Born总截面</td><td>149.8817057379562</td></tr>
<tr><td>深井：散射长度</td><td>1.6761030012493172</td></tr>
<tr><td>完全损失：η</td><td>0</td></tr>
<tr><td>完全损失：L</td><td>3</td></tr>
<tr><td>完全损失：弹性截面</td><td>41.54172103920387</td></tr>
<tr><td>完全损失：反应截面</td><td>41.54172103920387</td></tr>
<tr><td>完全损失：总截面</td><td>83.08344207840774</td></tr>
</tbody></table>
</div>

[下载四个场景的完整分波、匹配与求积记录(JSON)](assets/learning/projects/swave-scattering/run-snapshot.json)。固定R=1、2μ/ℏ²=1。弱井V₀=0.25、k=0.35、L=3、η=1；阈值附近V₀=2.4674011002723395、k=0.02、L=3、η=1；深井V₀=25、k=2.5、L=6、η=1；完全损失V₀=2、k=1.1、L=3、η=0。所选角度均60度。图上显示舍入，表内保留冻结值。


</div>

1–3节建立可观测量，4–7节求解实方井并检查截断，8节加入其他通道，9–11节学习Born近似及其边界，12节给出完整解答。

</section>

## 1. 从概率流到截面：先交代入射态

考虑无自旋、可区分粒子的单个入射通道，约化质量为μ。取时间因子exp(−iEt/ℏ)，短程散射的远场形式是

$$ \psi(\mathbf r)\sim e^{ikz}+f(\theta,\phi)\frac{e^{ikr}}r,
\qquad E=\frac{\hbar^2k^2}{2\mu},\quad k>0. $$

出射符号与时间约定配套：固定相位kr−Et/ℏ随时间向更大的r移动。概率流

$$ \mathbf j=\frac{\hbar}{\mu}\operatorname{Im}(\psi^*\nabla\psi) $$

给入射平面波的通量密度ℏk/μ。对单独的散射球面波，径向导数的主项为ikf exp(ikr)/r，因此穿过r²dΩ的散射流为(ℏk/μ)|f|²dΩ。两者相除得到

$$ \frac{d\sigma_{\rm el}}{d\Omega}=|f|^2. $$

这是弹性、相同出入波数下的式子。多通道末态波数不同会有速度比；相同粒子还要先对振幅作交换对称化，不能把本页公式原样当成所有碰撞的计数率。

远处一般角度的散射强度由|f|²给出；检查整个大球面的总流时，还必须保留入射波与散射波的干涉项。光学定理正是这项不能丢掉的表现。

## 2. 分波展开：把平面波和中心势放进同一套基底

中心势不混合不同ℓ、m。入射方向取z轴，方位角无关，可用Legendre多项式展开：

$$ e^{ikr\cos\theta}=\sum_{\ell=0}^\infty(2\ell+1)i^\ell j_\ell(kr)P_\ell(\cos\theta). $$

系数可由对cosθ积分投影得到，因为∫PℓPℓ′dx=2δℓℓ′/(2ℓ+1)。令约化径向函数uℓ=rRℓ，Schrödinger方程变成

$$ u_\ell''+\left[k^2-\frac{\ell(\ell+1)}{r^2}-\frac{2\mu V(r)}{\hbar^2}\right]u_\ell=0. $$

势外定义sℓ(x)=xjℓ(x)、cℓ(x)=−xyℓ(x)，其中yℓ是球Neumann函数。它们远处分别趋于sin(x−ℓπ/2)、cos(x−ℓπ/2)。实势正则解可选为

$$ u_\ell\propto \cos\delta_\ell\,s_\ell(kr)+\sin\delta_\ell\,c_\ell(kr)
\sim\sin(kr-\ell\pi/2+\delta_\ell). $$

δℓ只定义到模π；把整个实解变号不改变散射。将正弦拆成进、出两支指数，再把入射支归一到平面波的同一分波，出射系数相对自由值乘上Sℓ=exp(2iδℓ)。因此多出来的出射振幅为

$$ f(\theta)=\frac1{2ik}\sum_\ell(2\ell+1)(S_\ell-1)P_\ell(\cos\theta)
=\frac1k\sum_\ell(2\ell+1)e^{i\delta_\ell}\sin\delta_\ell P_\ell(\cos\theta). $$

第二个等号使用实势弹性Sℓ；第一个等号还适用于后面的损失通道模型。分波法本身不限低能，低能只是往往需要的分波较少。

## 3. 光学定理：角积分与前向虚部必须同账

把|f|²展开，角向积分中的交叉项因Pℓ正交性消失，得到

$$ \sigma_{\rm el}=\frac{\pi}{k^2}\sum_\ell(2\ell+1)|S_\ell-1|^2
=\frac{4\pi}{k^2}\sum_\ell(2\ell+1)\sin^2\delta_\ell. $$

又因Pℓ(1)=1，实势下前向振幅的虚部为Σ(2ℓ+1)sin²δℓ/k。于是

$$ \sigma_{\rm tot}=\sigma_{\rm el}=\frac{4\pi}{k}\operatorname{Im}f(0). $$

这里的f(0)指θ=0的前向方向，不是k=0。上面给出的是单通道中心实势的分波证明；若从总流积分推导，前向干涉承担同一项。可对照[Fitzpatrick的光学定理推导](https://farside.ph.utexas.edu/teaching/qm/lectures/node87.html)。

每个弹性分波有上限4π(2ℓ+1)/k²。上限是对固定非零k而言；k趋零时它本身发散，所以不能从“每个k有限”推出统一的零能上界。

实验分别算分波和、角向数值积分、前向虚部。有限L模型的|f|²是cosθ的至多2L阶多项式，32节点Gauss积分在精确算术下已足以对L≤6精确积分；浮点残差仍保留。

## 4. 低能为什么常由s波主导：还要排除什么

离心项ℓ(ℓ+1)/r²阻碍高ℓ波进入小r。半经典估计碰撞参数b≈(ℓ+1/2)/k，当b远大于作用程R时，波一般较少探入势区。这解释了为什么kR小的短程势常只需少数分波。

更精细的阈值展开，在有限程、非奇异且相应阈值参数不发散的条件下，给出δℓ随k的首项量级k^(2ℓ+1)。因此ℓ越大，通常越受低能抑制。但阈值附近的束缚态或形状共振会改变这个判断；相同费米子的交换对称性还可能排除s波。

所以“kR小”是检查的起点。实际计算仍应增加L，观察当前能区的结果是否稳定。本页把0至6的累积截面都列出，最末增量只是观测到的变化，不是对所有未算分波的严格误差界。

## 5. 球方井：用函数和导数的两个条件求相位

取V=−V₀于r小于R、外部为0，V₀≥0。实验用R=1和2μ/ℏ²=1，井内波数q=√(k²+V₀)。正则内解取u=A sℓ(qr)。在R处记

$$ F=s_\ell(qR),\quad F'=q\,\dot s_\ell(qR),\quad
s=s_\ell(kR),\ s'=k\dot s_\ell(kR),\quad
c=c_\ell(kR),\ c'=k\dot c_\ell(kR). $$

这里点表示对函数自变量求导，撇在边界量中表示对r求导。连续条件AF=s cosδ+c sinδ、AF′=s′cosδ+c′sinδ消去A，令

$$ a=F'c-Fc',\qquad b=Fs'-F's,\qquad
(\cos\delta,\sin\delta)=\frac{(a,b)}{\sqrt{a^2+b^2}}. $$

这避免先除以F或tan函数；井内节点F=0时也能正常匹配。外部Wronskian sc′−s′c=−k，且F、F′不能同时为0，所以非零k下(a,b)不会同时消失。

振幅A可用两个边界条件的内积恢复：A=(Fu+F′u′)/(F²+F′²)。单位制已固定；这只是对同一精确匹配的稳定数值恢复，不是把不同单位的实验误差随意相加。表格逐项保留两侧函数值、导数、相位及残差。

对ℓ=0，s₀=sin、c₀=cos，退化为熟悉的q cot(qR)=k cot(kR+δ₀)。径向图在r=R保留两侧独立采样，实际核对是否接上；曲线不会因为网格恰好跳过边界而留下未说明的缺口。

## 6. 散射长度：零能外解的截距

零能s波外解满足u″=0，可写为常数乘(r−aₛ)。它与有限k的sin(kr+δ₀)比较，给aₛ=−lim tanδ₀/k。方井的零能内解sin(κ₀r)，κ₀=√V₀，于边界匹配导数比得到

$$ a_s=R-\frac{\tan(\kappa_0R)}{\kappa_0}. $$

若aₛ有限且非零，低能振幅常写成

$$ f_0(k)=\frac1{k\cot\delta_0-ik},\qquad
k\cot\delta_0=-\frac1{a_s}+\frac{r_e}2k^2+\cdots. $$

第一式是实相移的精确恒等式；第二式是有效程展开，需要相应短程与解析性条件。不能把aₛ=0处的1/aₛ当成有限参数，也不能在阈值极点附近忽略k项而宣称固定k的截面无穷大。

束缚态能量为−ℏ²κ²/(2μ)，井外u∝exp(−κr)，匹配式变为q cot(qR)=−κ，且q²+κ²=V₀。当κ趋零，阈值为√V₀R=(n+1/2)π，正是aₛ的极点。严格零能极限外解不能在无穷远归一化；应称阈值态或半束缚态，不能把它等同于已经有负能的正规化束缚态。

弱井展开tan x=x+x³/3+…，在R=1时aₛ=−V₀/3+O(V₀²)。另一方面，tan√V₀=√V₀的非零解可使aₛ=0：低能散射受抑制，并不意味着势消失。图画的是有限k的sin²δ₀，避免把aₛ极点两侧用一条有限曲线误连。

## 7. 共振、截断和数值误差是三件事

实相移接近π/2模π时，该分波逼近幺正上限。共振是否形成窄峰，还取决于相移随能量的变化以及背景。单个峰不足以证明新粒子或唯一势模型。

本页的L截断将ℓ大于L的Sℓ设为1。这给出一个自洽的有限振幅，但不自动等于完整方井振幅。实势下每项截面非负，增加L的弹性总截面不会下降；角分布则有分波干涉，某个方向的计数可以下降。

采样也会改变图的可信度。井深扫描先求s波cosδ₀=0的位置，再在峰附近加密，避免均匀网格把窄峰画矮；波数扫描则明确只给65个节点，不能保证捕捉每一个窄共振。完整数据保留实际采样位置，连线不冒充额外求解。

还要区分数值舍入。小相移时直接计算1−Re S会丢失微小量，实验改用

$$ 1-\eta\cos(2\delta)=(1-\eta)+2\eta\sin^2\delta $$

保存前向虚部。相移变号的整体约定、分波截断和舍入误差分别检查。零势明确给S=1、全部截面0；不在对数图上把0变成某个未说明的正地板。

## 8. 有其他通道时：弹性损失不等于总概率丢失

对选定入射通道，可将它返回自身的分波S元素写为Sℓ=ηℓexp(2iδℓ)，0≤ηℓ≤1。ηℓ²是这一分波返回弹性通道的流量比例，其余流转入其他通道。完整多通道S仍可幺正，单个弹性元素不必模长1。

对应截面为

$$ \begin{aligned}
\sigma_{\rm el}&=\frac\pi{k^2}\sum_\ell(2\ell+1)|1-S_\ell|^2,\\
\sigma_{\rm reaction}&=\frac\pi{k^2}\sum_\ell(2\ell+1)(1-\eta_\ell^2),\\
\sigma_{\rm tot}&=\frac{2\pi}{k^2}\sum_\ell(2\ell+1)(1-\operatorname{Re}S_\ell).
\end{aligned} $$

把|1−S|²=1+η²−2Re S与1−η²相加，就得到总截面，仍等于4π Im f(0)/k。reaction在此表示从入射弹性通道流出的总和，不指定它去了哪一种产物。

实验对0至L统一使用η，其余S=1。改变L也在改变损失模型的通道范围，所以η小于1时，累积曲线不能被当成固定真实复势的收敛检验。Born曲线则始终是原实方井的一阶结果；与损失叠加结果比较只能用于识别模型不同。

## 9. Lippmann–Schwinger：出射边界条件进入Green函数

令U=2μV/ℏ²，则(∇²+k²)ψ=Uψ。取满足(∇²+k²)G⁺=δ³的出射Green函数

$$ G^+(\mathbf r)=-\frac{e^{ikr}}{4\pi r},\qquad
\psi(\mathbf r)=e^{i\mathbf k\cdot\mathbf r}
+\int G^+(\mathbf r-\mathbf r')U(\mathbf r')\psi(\mathbf r')\,d^3r'. $$

负号来自Helmholtz基本解的delta源约定。积分式施加微分算符就返回Schrödinger方程；出射而非入射的选择则由G⁺给出。这是重新表述问题，未知ψ仍在积分中。

短程势允许在远处用|r−r′|=r−r̂·r′+O(1/r)展开，从e^(ik|r−r′|)提取e^(ikr)e^(−ik′·r′)，其中k′=kr̂。因此

$$ f(\mathbf k',\mathbf k)=-\frac\mu{2\pi\hbar^2}
\int e^{-i\mathbf k'\cdot\mathbf r'}V(\mathbf r')\psi(\mathbf r')\,d^3r'. $$

这一步使Fourier符号有可追溯的来源。相关分波与积分方程约定可对照[Tong散射讲义](https://www.damtp.cam.ac.uk/user/tong/aqm/aqmten.pdf)。

## 10. Born近似：傅里叶符号和微扰阶数都要一致

第一次迭代用入射平面波代替积分中的ψ，定义Q=k′−k，得到

$$ f^{(1)}(\mathbf Q)=-\frac\mu{2\pi\hbar^2}\int
V(\mathbf r)e^{-i\mathbf Q\cdot\mathbf r}\,d^3r. $$

若定义Q=k−k′，指数才相应取正。对中心偶势，变Q的正负不改变答案，因而容易掩盖约定错配；平移势V(r−d)时，振幅实际乘exp(−iQ·d)，可以用来检查符号。

势强乘上小参数g，则f=gf₁+g²f₂+…。实势的前向一阶Born振幅为实数，而截面的首项是g²∫|f₁|²。光学定理在g²阶要求

$$ \frac{4\pi}{k}\operatorname{Im}f_2(0)=\int|f_1|^2d\Omega. $$

所以不能将一阶实振幅的零前向虚部，与它平方得到的二阶截面混用，再判断光学定理失败。Born近似也不会在强共振附近自动满足全阶幺正上限。

本页实方井的一阶振幅，在R=1单位中为

$$ f_B(\theta)=V_0\frac{\sin Q-Q\cos Q}{Q^3},\qquad
Q=2k\sin(\theta/2),\qquad f_B(0)=\frac{V_0}3. $$

Q=0使用连续极限，不算0/0。弱井时−aₛ≈V₀/3与前向低能Born值一致；靠近阈值时aₛ发散，Born仍只有V₀/3，正好展示它漏掉多次散射的地方。小参数与势强、程和能量共同有关，不能只用“高能”宣布适用。

## 11. 两个手算参照：Yukawa与硬球

对V=g exp(−αr)/r、α>0，角积分给4π sin(Qr)/(Qr)。剩下∫exp(−αr)sin(Qr)dr=Q/(α²+Q²)，因此

$$ f_B(Q)=-\frac{2\mu g}{\hbar^2(\alpha^2+Q^2)}. $$

令α形式上趋零会给出Rutherford角依赖，但Coulomb长程尾部改变远场相位；短程平面波加普通球面波的论证不能直接继续使用。相同粒子与自旋效应也须另行处理。

硬球半径a要求u(a)=0。s波外解sin(kr+δ₀)给δ₀=−ka模π，故

$$ \sigma_0(k)=\frac{4\pi}{k^2}\sin^2(ka)
\xrightarrow{ka\to0}4\pi a^2. $$

4πa²是低能极限，有限k时不能省去sin(ka)/(ka)。高能完整硬球总截面趋于2πa²，需要不断增加分波数；本页固定上限6的方井实验既不是硬球，也不能用来证明这个无限分波高能结论。

## 12. 练习：从结果退回它使用的条件

### A. 阈值极点为什么不让固定k的截面无穷大？

<details class="answer" markdown="1"><summary>展开完整解答：先保留振幅的虚部</summary>

f₀=1/(k cotδ₀−ik)。阈值附近若有效程修正可忽略，1/aₛ趋零给f₀≈i/k，于是σ₀≈4π/k²，恰好接近幺正上限。固定k大于0时有限；若再把k趋零，上限才发散。两种极限不能省略先后和条件。数值输入近似π²/4，只代表接近解析阈值，机器输出的大aₛ不是对精确无穷大的测量。

</details>

### B. 完全失去某个分波的弹性返回，为什么弹性截面还不为0？

<details class="answer" markdown="1"><summary>展开完整解答：区分返回系数与相对自由波的改变</summary>

ηℓ=0给Sℓ=0，但散射振幅依赖Sℓ−1，因此该分波仍有弹性衍射贡献。σel,ℓ=π(2ℓ+1)/k²，σreaction,ℓ同样大，总截面为两倍。若0至L都完全损失，用Σ(2ℓ+1)=(L+1)²，得到σel=σreaction=π(L+1)²/k²。它是有限通道模型的精确账，不由此宣称任意吸收体都具有这组S元素。

</details>

### C. 亲自积分球方井的Born振幅，并检查Q=0

<details class="answer" markdown="1"><summary>展开完整解答：系数来自单位约定</summary>

自然单位2μ/ℏ²=1使Born前因子为−1/(4π)。势为−V₀，角积分为4π sin(Qr)/(Qr)，所以fB=V₀∫₀¹r²sin(Qr)/(Qr)dr。分部积分给V₀[sin Q−Q cos Q]/Q³。分子展开为Q³/3−Q⁵/30+…，故前向极限V₀/3。其平方角积分非零而前向虚部为0，是因为两者分别处于g²与g的一阶截断，不是同阶光学定理的反例。

</details>

### D. 平移势会改变单个散射中心的截面吗？

<details class="answer" markdown="1"><summary>展开完整解答：先换积分变量，再取模平方</summary>

对Vd(r)=V(r−d)，令s=r−d，exp(−iQ·r)=exp(−iQ·d)exp(−iQ·s)，所以fd=exp(−iQ·d)f。单个中心的|fd|²与|f|²相同；若有多个相干中心，相对相位会进入干涉。这个例子同时说明为什么仅检查中心势的模平方不能发现Born指数符号和Q定义的错配。

</details>

</div>
