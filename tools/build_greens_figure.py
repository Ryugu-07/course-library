# -*- coding: utf-8 -*-
"""Render supplied Green-function observations without recomputing science."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(x=>[x.key,x.data]));console.log(JSON.stringify([0,1,2,3,4,5].map(i=>a.svg(a.plots(r.default)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">Green函数、谱窗、封闭回返和原子Lehmann谱</title><desc id="desc">六面板比较宽带单峰、两个封闭模型的显示谱、复因果函数、回返概率、自能与有限窗质量。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从一个谱峰到机制判断：把模型与测量分开</text>']
names=['A · 宽带单峰Γ=0.3E0：这里才预设指数衰减模型','B · 两个封闭模型：显示η=0.1E0，没有内禀寿命','C · 完整复函数：实部为零不等于粒子消失','D · 两能级往返回返；显示平滑曲线不是实际生存概率','E · 同一个解析自能同时给出实部与虚部','F · 默认窗没有收全Lorentzian尾部；全轴权重仍为1']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">谱线质量、电子占据和生存概率分别计算；有限封闭原子不是晶格Mott相变证明。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];c=s['parameters'];vals=[r['key'],s['wide']['gamma'],s['eta'],s['windowMass']['wideMass'],s['windowMass']['twoMass'],s['windowMass']['atomMass'],s['atom']['occupation'],s['atom']['occupiedSpectralWeight']]
 rows.append('| '+' | '.join(format(x,'.8g')if isinstance(x,(int,float))else x for x in vals)+' |')
text='**无脚本对照：**六份记录保留8项参数、两能级谱投影、原子四态与两条Lehmann跃迁、复Green函数与自能、211个时间点和100个有限窗积分。Γ仅属于宽带模型；η只平滑封闭谱，真实动力学不含η。\n\n<figure class="plot" markdown="1">\n![Green函数六面板：宽带谱、封闭谱、复时间函数、真实回返与显示平滑、自能、有限窗质量。](assets/img/cm-03-greens-certificates.svg)\n<figcaption>所有面板使用默认参数。A预设宽带衰减；B—E的两能级与原子是封闭模型，η不代表内禀寿命；F逐窗积分而不把每个图窗强行归一。</figcaption>\n</figure>\n\n<div class="greens193-static" role="region" tabindex="0" aria-label="Green函数固定记录，可横向滚动" markdown="1">\n\n| 预设 | Γ/E0 | η/E0 | 宽带窗内质量 | 两能级平滑谱窗内质量 | 原子平滑谱窗内质量 | 原子每自旋占据 | 逐谱线fA总和 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/greens-certificates/run-snapshot.json){download="greens-frozen-records.json"}。默认图窗是[-10E0,10E0]。Γ=0改用δ线质量；落在积分窗边时取半质量。T=0采用简并基态等权热极限。高阶谱矩表对应未平滑离散谱，不能从Lorentzian显示尾部作无穷区间积分得到。\n'
md.write_text(text,encoding='utf-8');print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
