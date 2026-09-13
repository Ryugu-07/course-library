# -*- coding: utf-8 -*-
"""Render supplied Kubo observations without recalculating their physics."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),s=f.records.find(r=>r.key==='default').data;console.log(JSON.stringify(a.plots(s).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">Kubo响应：时间、频率、有限记录和量子谱</title><desc id="desc">六图分别展示脉冲电流、复电导、时间窗、有限频段主值、谱重与量子谱线权重。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">系统的记忆，有多少进入了你的数据？</text>']
names=['A · 外场已关，已有电流继续衰减；负时间响应严格为零','B · 复电导和噪声来自同一明确的平衡两通道模型','C · 时间窗内的积分可以很准，窗外尾仍未被观测','D · 带内积分不等于完整响应；硬截断端点不改成有限数','E · 固定总Drude权重时，峰高与总谱重不能混为一谈','F · 点表示δ谱线的积分系数；不是有限谱密度高度']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">默认：D=1，τ1=2，τ2=6，第二通道30%；量子模型Δ=T=1，各用自身参考单位。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return '不适用'if x is None else format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];v=[r['key'],s['dc'],s['chosen']['real'],s['chosen']['imag'],s['window']['tailMagnitude'],s['kk']['realExact'],s['spectralWeight']['fraction'],s['quantum']['chi0']]
 rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留全部时间和频率扫描、每个积分节点、积分误差与遗漏尾、谱重、量子谱线和有限场比较。硬截断端点保存为明确的不适用状态。\\n'.replace('\\n','\n')+'\n<figure class="plot" markdown="1">\n![六图：脉冲响应、复电导、有限时间窗、有限频段KK、谱重与量子谱线。](assets/img/neq-02-kubo-certificates.svg)\n<figcaption>前五图属于两通道电流模型，第六图属于独立两能级模型。图中的量子点是δ谱线系数，有限频段尾部参照使用了已知模型。</figcaption>\n</figure>\n\n<div class="kubo201-static" role="region" tabindex="0" aria-label="Kubo固定记录，可横向滚动" markdown="1">\n\n| 预设 | DC电导 | Re σ | Im σ | 时间窗遗漏尾模 | 带内KK | 已含谱重比例 | 量子χ0 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/kubo-certificates/run-snapshot.json){download="kubo-frozen-records.json"}。默认有限窗积分误差约百万分之一，而窗外尾约0.0792；这两类误差由不同原因产生。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})

