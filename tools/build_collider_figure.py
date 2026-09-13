# -*- coding: utf-8 -*-
"""Render supplied collider observations without recomputing their physics."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">对撞机：运动学、响应与控制区计数</title><desc id="desc">六图展示固定模板质量、共同boost、质量响应核、背景profile、计数尾概率与条件二项分布。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从测量到证据：每一步保留可以核对的量</text>']
names=['A · 固定条数合成模板；真值标签只供诊断，不是观测信号率','B · 共同boost改变能量与几何接受度，四动量内积保持不变','C · 每格响应概率还不含选择；下溢、上溢与损失分别记录','D · 每个信号假设重新拟合背景；q超过12的原始值在表中','E · 两种校准的离散比较：有限样本条件尾与渐近正态尾','F · 固定总计数N后的完整二项分布；橙点组成指定上尾']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">教学默认：M=125 GeV，单对象对数响应宽度0.06；独立计数n=35、m=100、τ=5。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];c=s['count'];v=[r['key'],s['data']['ledger']['accepted']['signal'],s['data']['ledger']['accepted']['background'],c['n'],c['m'],c['tau'],c['hat']['s'],c['conditional']['tail'],c['asymptoticTail']]
 rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留全部四动量、随机流、响应与选择、48格计数和溢出账本、22个质量核、201个profile点、完整计数扫描与条件分布。模板计数与on/off观测独立。\n\n<figure class="plot" markdown="1">\n![六图：合成质量、共同boost、质量响应、背景profile、精确与渐近尾概率、条件二项分布。](assets/img/pp-05-collider-certificates.svg)\n<figcaption>质量核不含接受度；似然图只显示q≤12的点，其余原始数值保留。全部为教学模型，不代表实验发现。</figcaption>\n</figure>\n\n<div class="collider199-static" role="region" tabindex="0" aria-label="对撞机固定记录，可横向滚动" markdown="1">\n\n| 预设 | 已选信号标签 | 已选背景标签 | n | m | τ | sHat | 精确条件尾 | 渐近尾 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/collider-certificates/run-snapshot.json){download="collider-frozen-records.json"}。空计数的精确条件尾为1，渐近映射为0.5；控制区零计数不等于精确零背景。不适用的错误固定背景对照保存为null，极小尾部另存自然对数。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
