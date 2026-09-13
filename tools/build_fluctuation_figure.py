# -*- coding: utf-8 -*-
"""Render supplied fluctuation observations without recomputing physics."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">非平衡涨落：从响应到完整路径概率比</title><desc id="desc">六图比较OU关联与响应、双边谱、环流计数、功分布、指数平均和逐步能量收支。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">先写清初态与协议，再检验涨落等式</text>']
names=['A · 平衡关联与冲量响应重合；确定零初速的方差是另一初值问题','B · 只画非负频率，数值仍采用双边谱约定，不额外乘2','C · 保留所有右步数；在p=1/2时熵为零，净位移仍可涨落','D · 反向从终点参数的平衡态开始，且交换跳动与松弛的次序','E · 全部样本前缀用自然对数显示；不把稀有大值截平','F · 第一条路径逐步核对ΔU=W−Qbath；其余路径完整保留']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">默认教学单位kB=T=γ=k=m=1，L=2、总时长2、N=12；环流p=0.65、n=20。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):
 if x is None:return '不适用'
 if isinstance(x,bool):return '是'if x else'否'
 return format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];p=s['protocol'];v=[r['key'],p['initialEquilibrium'],p['meanWork'],p['varianceWork'],p['jarzynski'],p['correctedIFT'],p['totalIFT'],s['ring']['negativeProbability']]
 rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留完整OU时域与频域、所有环流计数格及路径、谐势阱每个子步骤的功热收支、完整初末密度和两种反向路径概率、全部样本前缀与随机流。\n\n<figure class="plot" markdown="1">\n![六图：OU关联与响应、双边噪声谱、环流计数、功分布、指数样本平均与单条路径第一定律。](assets/img/neq-01-fluctuation-certificates.svg)\n<figcaption>三个模型分别定义。功图的反向初态为终点参数平衡态；总熵的反向初态则是实际末态。样本曲线不是理论恒等式。</figcaption>\n</figure>\n\n<div class="fluctuation200-static" role="region" tabindex="0" aria-label="涨落固定记录，可横向滚动" markdown="1">\n\n| 预设 | 初态平衡 | 平均功 | 功方差 | 精确功指数平均 | 修正路径比平均 | 总熵指数平均 | 环流负熵概率 |\n|---|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/fluctuation-certificates/run-snapshot.json){download="fluctuation-frozen-records.json"}。平衡环流仍保留完整净位移分布。零位移功为点质量，密度保存为null；非平衡初态改变无修正功等式，但完整路径比仍可核对。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
