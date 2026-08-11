# 第 16 讲 · 实战：文生图

> 文生图（text-to-image）是生成式 AI 的另一条主线：2022 年（与 ChatGPT 同年）Stable Diffusion 开源与 Midjourney 走红，让"打字出图"飞入寻常百姓家。本讲一半讲原理——扩散模型的思想值得你的数学背景咀嚼——一半讲实操：提示词怎么写、工具怎么选、边界在哪。文中的交互只用固定的玩具数组，不调用模型，也不生成真实图片。

<div data-learning-page></div>

<section class="learning-layer">
<h2>学习层：扩散是在已知噪声通道上学习时刻相关的预测</h2>
<div class="learning-puzzle">
<h3>具体谜题：模型要猜哪一种“噪声”？</h3>
<p>把一张固定的 <span class="arithmatex">\(12\times12\)</span> 像素图记为 <span class="arithmatex">\(x_0\)</span>。如果我们从 <span class="arithmatex">\(x_0\)</span> 一口气构造出 <span class="arithmatex">\(x_t\)</span>，训练目标里的 <span class="arithmatex">\(\epsilon\)</span> 是最后一次转移才加入的 <span class="arithmatex">\(\epsilon_t\)</span>，还是从 <span class="arithmatex">\(x_0\)</span> 到 <span class="arithmatex">\(x_t\)</span> 的合成噪声？先写下答案。再猜：当 <span class="arithmatex">\(\bar\alpha_t\)</span> 很小时，噪声预测只错一点，重建的 <span class="arithmatex">\(\hat x_0\)</span> 会只错一点，还是会被放大？</p>
</div>
<div class="learning-prediction">
<h3>先做预测，再打开实验</h3>
<p>先预测三件事：<strong>①</strong> <span class="arithmatex">\(\bar\alpha_t\)</span> 越小，<span class="arithmatex">\(\mathrm{SNR}=\bar\alpha_t/(1-\bar\alpha_t)\)</span> 越大还是越小？<strong>②</strong> 若 <span class="arithmatex">\(\hat\epsilon=\epsilon+\delta e\)</span>，其中 <span class="arithmatex">\(e\)</span> 的均方根为 1，<span class="arithmatex">\(\delta\)</span> 固定时，把 <span class="arithmatex">\(t\)</span> 推向 1，<span class="arithmatex">\(\hat x_0\)</span> 的误差会怎样？<strong>③</strong> CFG 中 <span class="arithmatex">\(w=0\)</span>、<span class="arithmatex">\(w=1\)</span>、<span class="arithmatex">\(w>1\)</span> 分别对应原点、条件点，还是沿条件方向越过条件点？拖动前先给出自己的几何答案。</p>
</div>
<div class="learning-model">
<h3>最小模型：闭式加噪 + 固定的教学 schedule</h3>
<p>实验固定一张像素图、固定种子生成的一组高斯数组和一个误差方向 <span class="arithmatex">\(e\)</span>。它使用 <span class="arithmatex">\(\bar\alpha(t)=\cos^2(\pi t/2)\)</span>，并把 <span class="arithmatex">\(t\)</span> 限制在 <span class="arithmatex">\([0,0.96]\)</span>；这是为了让公式容易读的教学 schedule，不是某个产品的调度器，也不是对真实采样质量的估计。</p>
<div class="arithmatex">\[
x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon,\qquad
\epsilon\sim\mathcal N(0,I).
\]</div>
<p>这里的 <span class="arithmatex">\(\epsilon\)</span> 是闭式表达式中的<strong>聚合噪声</strong>。它把从 <span class="arithmatex">\(x_0\)</span> 到 <span class="arithmatex">\(x_t\)</span> 的所有增量效果折叠成一个标准高斯变量；它与最后一步刚加入的 <span class="arithmatex">\(\epsilon_t\)</span> 分布上都可为高斯，但不是同一个样本。</p>
</div>
<div class="learning-formal">
<h3>形式化步骤：误差为什么会放大？</h3>
<ol>
<li>逐步过程里的 <span class="arithmatex">\(\epsilon_t\)</span> 只描述一次 <span class="arithmatex">\(x_{t-1}\to x_t\)</span> 的转移；把过程合并成闭式后，DDPM 常见的 epsilon 训练目标是对闭式中抽到的聚合 <span class="arithmatex">\(\epsilon\)</span> 做 <span class="arithmatex">\(\lVert\epsilon-\epsilon_\theta(x_t,t)\rVert^2\)</span>，不是要求网络复述最后一个 <span class="arithmatex">\(\epsilon_t\)</span>。</li>
<li>在这套常见参数化下，用预测噪声还原干净样本：<span class="arithmatex">\(\hat x_0=(x_t-\sqrt{1-\bar\alpha_t}\,\hat\epsilon)/\sqrt{\bar\alpha_t}\)</span>。沿用 <span class="arithmatex">\(\hat\epsilon=\epsilon+\delta e\)</span> 并记误差向量 <span class="arithmatex">\(r=\hat\epsilon-\epsilon=\delta e\)</span>，直接相减得到 <span class="arithmatex">\(\hat x_0-x_0=-\sqrt{(1-\bar\alpha_t)/\bar\alpha_t}\,r\)</span>。因此绝对误差的放大因子是 <span class="arithmatex">\(\sqrt{(1-\bar\alpha_t)/\bar\alpha_t}\)</span>，均方误差的放大因子是它的平方，即 <span class="arithmatex">\(1/\mathrm{SNR}\)</span>。</li>
<li>epsilon prediction 只是常见的一种参数化。网络也可以按约定预测 <span class="arithmatex">\(x_0\)</span>、<span class="arithmatex">\(v\)</span>，或 score；例如某套 VP 高斯约定下 <span class="arithmatex">\(\sigma_t=\sqrt{1-\bar\alpha_t}\)</span> 时，最优的时刻条件 score 与 epsilon 预测可通过 <span class="arithmatex">\(s(x_t,t)\approx-\epsilon_\theta(x_t,t)/\sigma_t\)</span> 转换。这个比例依赖 <span class="arithmatex">\(t\)</span> 和参数化；它描述的是加噪边缘分布在当前时刻的 score（在相应训练/转换成立时），不是网络直接等同于自然图像分布的一个全局梯度。</li>
<li>反向采样还需要 scheduler/sampler：它规定离散时间步、如何把 epsilon/<span class="arithmatex">\(x_0\)</span>/v/score 互换、后验均值与方差以及是否注入随机量。模型预测配合采样器才构成反向轨迹；“模型一项就完整逆转”会漏掉这层工程与数学约定。</li>
</ol>
</div>
<div class="learning-model">
<h3>CFG 几何：在两次预测之间作外推</h3>
<p>在常见的 classifier-free guidance 写法中，同时得到无条件预测 <span class="arithmatex">\(\epsilon_u\)</span> 与条件预测 <span class="arithmatex">\(\epsilon_c\)</span>，再计算</p>
<div class="arithmatex">\[
\epsilon_{\mathrm{guided}}=\epsilon_u+w(\epsilon_c-\epsilon_u).
\]</div>
<p><span class="arithmatex">\(w=0\)</span> 是无条件预测，<span class="arithmatex">\(w=1\)</span> 恰好是条件预测，<span class="arithmatex">\(w>1\)</span> 是沿着无条件到条件的方向继续外推。较大的 <span class="arithmatex">\(w\)</span> 可能加强条件一致性，但也可能牺牲多样性、放大伪影或过饱和；甜点区与 scale 的具体定义取决于模型、训练方式、采样器和实现。下方二维图只演示向量几何，不代表真实图片质量。</p>
<p>这里的 <span class="arithmatex">\(w\)</span> 采用许多界面常见的 scale 约定。Ho 与 Salimans 原论文写成 <span class="arithmatex">\(\tilde\epsilon=(1+w_{\mathrm{paper}})\epsilon_c-w_{\mathrm{paper}}\epsilon_u\)</span>，因此本页的 <span class="arithmatex">\(w=1+w_{\mathrm{paper}}\)</span>；跨论文或软件比较数值前必须先对公式，不能只看参数名。</p>
</div>
<div class="learning-boundary">
<h3>边界：哪些直觉不能直接外推？</h3>
<ul>
<li>本页的固定像素图、固定高斯种子和 cosine schedule 只让误差传播可计算；真实系统可能在 latent 空间工作，使用不同 schedule、参数化、噪声偏置、分辨率和采样步数。</li>
<li>文本交叉注意力是 latent diffusion 等常见架构中的一种条件注入方式，不是所有图像生成路线都必须使用的机制；也有拼接、适配器、控制支路、自回归 token 等路线。</li>
<li>提示词的词序、权重语法和分词影响依模型而异；“越靠前权重越高”不是通用定律。负面提示只在支持它的管线中作为额外条件起作用，也不是保证清除某种内容的开关。</li>
<li>ControlNet 是常见的参考/控制支路之一，不是锁定姿势或构图的唯一解；参考图、适配器、局部重绘与其他条件方式的行为要按具体管线验证。</li>
<li>平台、模型和硬件的速度、成本、隐私、可控性与输出差异随版本和配置变化；不要从一个产品或一台 M4 的体验推出普遍排名或性能结论。</li>
</ul>
</div>
<div class="learning-transfer">
<h3>迁移题：换参数化、换条件、换采样器</h3>
<p>如果网络改为预测 <span class="arithmatex">\(x_0\)</span> 或 <span class="arithmatex">\(v\)</span>，重建公式和误差放大账本要怎样随 schedule 改写？如果只把采样步数减半，哪些量由 sampler 改变，哪些量仍由网络在给定 <span class="arithmatex">\(x_t,t\)</span> 上预测？最后解释：为什么把 <span class="arithmatex">\(w\)</span> 从 1 调到 4 是几何外推，而不是“把文字概率简单乘四”？</p>
</div>
<div class="learning-experiment">
<h3>交互实验：加噪/重建与 CFG 几何</h3>
<p><strong>无 JavaScript 时的静态读法：</strong>在 <span class="arithmatex">\(t=0.80\)</span> 时，<span class="arithmatex">\(\bar\alpha\approx0.0955\)</span>、<span class="arithmatex">\(\mathrm{SNR}\approx0.1056\)</span>，绝对误差放大因子约为 <span class="arithmatex">\(3.08\)</span>；若噪声预测误差方向的 RMS 为 1、<span class="arithmatex">\(\delta=0.10\)</span>，重建误差的 RMS 约为 <span class="arithmatex">\(0.308\)</span>。CFG 的静态向量取 <span class="arithmatex">\(\epsilon_u=(1.1,0.35)\)</span>、<span class="arithmatex">\(\epsilon_c=(2.3,1.7)\)</span>：<span class="arithmatex">\(w=0\)</span> 停在无条件点，<span class="arithmatex">\(w=1\)</span> 到达条件点，<span class="arithmatex">\(w=4\)</span> 越过条件点。交互只显示固定数组、玩具图案和几何指标，不展示真实模型，也不估计任何产品效果。</p>
<div class="learning-lab" data-learning-lab="diffusion-denoise">
<p>实验脚本未加载时：用上面的两个静态例子分别计算噪声误差放大因子，并在纸上画出从 <span class="arithmatex">\(\epsilon_u\)</span> 指向 <span class="arithmatex">\(\epsilon_c\)</span> 的直线。</p>
</div>
</div>
</section>

## 1. 原理：扩散模型十分钟版

LLM 常逐 token 生成文本；经典图像扩散路线采用另一种思路——**扩散模型（diffusion model）**：先定义逐步破坏图像的已知噪声通道，再学习与之配套的反向生成过程。今天也存在自回归、流式与混合路线，所以这不是所有图像模型的统一模板。

**前向过程（固定的、不用学）**：给真实图像 $x_0$ 逐步加高斯噪声；schedule 通常让终点分布接近预设的标准高斯先验，而有限步时不必字面上“完全没有信号”。每步

$$
x_t = \sqrt{1 - \beta_t}\, x_{t-1} + \sqrt{\beta_t}\, \epsilon_t, \qquad \epsilon_t \sim \mathcal{N}(0, I)
$$

反复代入可得任意步的闭式（记 $\alpha_t = 1 - \beta_t$，$\bar\alpha_t = \prod_{s \leq t}\alpha_s$；两个独立高斯之和仍是高斯，方差相加——动笔合并一次就能验证）：

$$
x_t = \sqrt{\bar\alpha_t}\, x_0 + \sqrt{1 - \bar\alpha_t}\, \epsilon, \qquad \epsilon \sim \mathcal{N}(0, I)
$$

**反向过程（学习目标）**：训练一个神经网络 $\epsilon_\theta(x_t, t)$，看着加噪图 $x_t$ 预测闭式表达式中的**聚合噪声** $\epsilon$。它不是在猜最后一步刚加入的 $\epsilon_t$；后者只描述一次局部转移，而闭式里的 $\epsilon$ 已经把从 $x_0$ 到 $x_t$ 的增量合并了。损失朴素得出奇：

$$
L = \mathbb{E}_{x_0, t, \epsilon}\Big[\big\|\epsilon - \epsilon_\theta(x_t, t)\big\|^2\Big]
$$

（DDPM 的加权目标可从变分下界逐项得到；这里常写的无权平方损失 $L_{\mathrm{simple}}$ 是对各时刻项重新加权后的简化目标，不能不加说明地与原始 ELBO 画等号。）**生成** = 从噪声先验出发，交替使用网络预测与 scheduler/sampler 规定的更新一步步去噪。epsilon prediction 只是常见参数化之一，也可以预测 $x_0$、$v$ 或 score；不同参数化要按 schedule 做转换。常见 VP 高斯约定下，epsilon 与时刻条件 score 有类似 $s(x_t,t)\approx-\epsilon_\theta/\sqrt{1-\bar\alpha_t}$ 的时刻相关比例，不能把网络直接说成自然图像分布的全局梯度。

**文字怎么控制图**：在 latent diffusion 等常见架构中，文本编码器输出的向量会通过交叉注意力等条件通道影响每一步去噪；这不是所有图像生成路线的必备机制。CFG 同时算"无条件"与"有条件"两次预测，按
$\epsilon_{\text{guided}}=\epsilon_u+w(\epsilon_c-\epsilon_u)$
组合：$w=0$ 是无条件预测，$w=1$ 是条件预测，$w>1$ 是越过条件预测的外推。较大的 $w$ 可能更贴条件，但也可能牺牲多样性或出现伪影；具体 scale 定义和甜点区依实现而异。

本页采用的是常见界面 scale 约定；Ho 与 Salimans 的原论文把同一组合写成 $(1+w_{\mathrm{paper}})\epsilon_c-w_{\mathrm{paper}}\epsilon_u$，所以两者数值相差 1。跨工具比较 CFG 数值时，应先核对它实际使用的公式。

（补充一嘴生态现状：扩散并非唯一路线——有些系统把图像表示为 token 或其他序列来生成，也有 latent、流式和混合式路线。不同架构在分辨率、控制接口、速度、成本和一致性上的取舍依版本与任务而变，不能用一条产品排序概括。）

## 2. 工具地图（按工作流选择，不做排行榜）

| 路线 | 形态 | 适合先检查 |
|---|---|---|
| 托管式聊天/图像产品 | 网页或应用内对话 | 当前模型能力、编辑接口、隐私条款、计费与导出限制 |
| 开放权重扩散路线 | 本地或云端工作流 | 模型许可证、显存/内存需求、采样器与控制扩展的兼容性 |
| 节点式/桌面式工作流工具 | 把模型、条件和采样步骤显式连线 | 是否需要可复现的 seed、版本锁定、批处理或局部重绘 |
| 自回归或混合式图像系统 | 序列、latent 或混合生成 | 条件接口、分辨率、速度和编辑能力是否满足当前任务 |

选择逻辑：先按任务需要决定是快速迭代、可复现控制、批量处理还是本地隐私，再查当前版本的模型卡、硬件要求、价格与数据政策。即使同一条路线，模型、采样器、前端和参数也会改变体验；一台机器能否顺畅运行，要用目标模型和分辨率实测，不从硬件型号直接推断结果。

## 3. 提示词：结构化描述一张画

文生图提示词的常见骨架（只是组织信息的起点，不是所有模型的固定权重规则）：

```text
[主体]（谁/什么，外观细节） + [动作/情境] + [环境背景] +
[构图视角]（特写/全景/俯视） + [光线]（黄昏逆光/柔光棚拍） +
[风格媒介]（水彩/胶片摄影/等距插画/像素风） + [质量词]（细节丰富…）
```

例："一只戴圆框眼镜的橘猫，趴在堆满数学书的木桌上打盹，午后阳光从左侧窗户斜射进来，浅景深特写，暖色胶片质感，插画风格"。要点：

- **写画面，不写抽象**："孤独感"不如"空旷车站的长椅上一个小小的背影"；模型看得见名词和形容词，看不见你的心情；
- **词序和权重依模型而异**：有的编码器、分词器或前端会对位置、括号/数值权重作不同处理；把顺序当作可验证的变量，不要当成普遍定律；
- **负面提示**（仅在支持的工具中）：可以提供额外的反向条件，例如不希望出现水印或多余手指，但它不是保证清除某种内容的开关；
- **迭代是常态**：固定 seed 往往能在同一模型、采样器和参数栈中帮助复现随机性，但换版本/分辨率/管线后不保证一致；图生图、局部重绘和对话式编辑也各有改变幅度；
- **精确控制**（进阶）：ControlNet 是用骨架图/深度图/线稿等条件约束姿势与构图的常见控制支路之一，但不是唯一解，效果取决于模型、控制图、权重和采样设置。

## 4. 学术与工作中的正确用法

- **能用**：PPT 封面与氛围插图、公众号配图、活动海报底图、论文的**概念示意**草稿（最终版建议矢量工具重绘）；
- **慎用/别用**：**承载证据的论文数据图表**必须由真实数据和可复核代码生成（matplotlib 等，第 15 讲）；生图模型画的坐标轴只是“长得像图表的画”，若把它冒充观测或实验结果就是数据失实。涉及真实人物时要核对肖像、隐私与深度合成规则；投稿前也要查目标期刊对 AI 生成或编辑图像的当前政策（同第 13 讲）。

**版权与合规提醒**：生成物的著作权/邻接权、训练数据许可、肖像与隐私、平台条款和期刊政策都依具体政策、管辖区、事实和版本而变；不要用一句“多数地区都怎样”替代判断。商用、投稿或涉及真实人物前，查当前平台、目标期刊与所在地的规则，必要时让机构或专业人士复核。让 AI 做概念稿、由人类完成并记录实质创作过程有时更便于说明来源，但也不是自动合规的保证。

## 本讲小结

- 扩散模型：闭式加噪中的 epsilon 是聚合噪声；生成还需要参数化转换与 scheduler/sampler；
- 文本条件依架构而异；CFG 用 $\epsilon_u+w(\epsilon_c-\epsilon_u)$ 做无条件到条件的插值/外推；
- 提示词 = 主体 + 情境 + 构图 + 光线 + 风格；顺序、负面提示和控制支路都要按模型验证；
- 学术与商用：数据图表必须代码画；平台、期刊、版权与人物相关规则先查当前要求。

**动手**：先在本页实验中把 $t$ 推到高噪声处、固定 $\delta$，记录重建误差放大；再把 CFG 的 $w$ 设为 0、1、4，解释向量和玩具图案的变化。若之后使用真实工具，把模型、版本、seed、采样器和参数一并记录，不把玩具实验当作产品效果承诺。

---

*下一讲：把 AI 用在幻灯片和文档上——从"给我做个 PPT"的失望，到"大纲—逐页—成稿"的正确工作流。*
