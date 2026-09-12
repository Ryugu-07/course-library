# -*- coding: utf-8 -*-
"""Render supplied gauge observations and an oriented four-site schematic."""
from pathlib import Path
import json,subprocess,shutil,sys,html,math
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));records=json.loads(fixture.read_text())['records'];default=next(x['data']for x in records if x['key']=='default')
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4560" viewBox="0 0 1000 4560" role="img" aria-labelledby="title desc"><title id="title">四站规范变换、量子演化与标准模型表示</title><desc id="desc">有向方格示意及六图：局域相位、带联络比较、通量谱、测量概率、非Abelian回路迹、精确异常贡献。全部使用默认参数。</desc><rect width="1000" height="4560" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从局部换基到物理不变量：每一步都能计算</text><defs><marker id="gauge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#3875ba"/></marker></defs>']
positions=[(200,160),(800,160),(800,410),(200,410)]
for index,(i,j)in enumerate([(0,1),(1,2),(2,3),(3,0)]):
 x,y=positions[j];X,Y=positions[i];d=math.hypot(X-x,Y-y);ux=(X-x)/d;uy=(Y-y)/d
 out.append(f'<line x1="{x+42*ux}" y1="{y+42*uy}" x2="{X-42*ux}" y2="{Y-42*uy}" stroke="#3875ba" stroke-width="3" marker-end="url(#gauge-arrow)"/>')
for j,(x,y)in enumerate(positions):
 re,im=default['ring']['psi'][j];out.append(f'<circle cx="{x}" cy="{y}" r="34" fill="#f1eee3" stroke="#777"/><line x1="{x}" y1="{y}" x2="{x+52*re}" y2="{y-52*im}" stroke="#368661" stroke-width="4"/><circle cx="{x}" cy="{y}" r="3"/><text x="{x}" y="{y-52 if j<2 else y+57}" text-anchor="middle" font-size="18">站点{j} · ψ{j}</text>')
out+=['<text x="500" y="130" text-anchor="middle" font-size="18">U01：1 → 0</text>','<text x="860" y="290" font-size="18">U12</text>','<text x="500" y="450" text-anchor="middle" font-size="18">U23：3 → 2</text>','<text x="65" y="290" font-size="18">U30</text>','<rect x="330" y="220" width="340" height="125" rx="8" fill="#f1eee3" stroke="#aaa"/>','<text x="500" y="254" text-anchor="middle" font-size="19">W = U01 U12 U23 U30</text>',f'<text x="500" y="286" text-anchor="middle" font-size="17">默认 Φ/π = {default["ring"]["flux"]/math.pi:.4g}</text>','<text x="500" y="318" text-anchor="middle" font-size="16">从右往左作用：0 → 3 → 2 → 1 → 0</text>','<text x="40" y="515" font-size="17">静态比较态各分量模为1/2；概率演化另取站点0初态。蓝箭头表示j → i。</text>']
names=['A · 相位依赖局部表示，跨过±π不表示物理跳变','B · 带联络比较在换规范前后逐项不变','C · 整个能谱有2π通量周期，固定动量标签可以置换','D · 初态一起变换后，站点概率和局部连续性保持一致','E · SU(2)回路矩阵按起点共轭变换，迹是规范不变量','F · 所有场按左手Weyl计数：各项异常合计为精确零']
for i,(p,n)in enumerate(zip(panels,names)):
 y=560+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4518" font-size="16">外加链路的有限模型不是完整规范场动力学；异常抵消也不唯一决定标准模型。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
rows=[]
for record in records:
 s=record['data'];vals=[record['key'],s['parameters']['fluxDegrees'],s['ring']['J'],s['ring']['wilson'][0],s['ring']['wilson'][1],s['nonabelian']['normalizedTrace'][0],s['selectedTime']['norm']]
 rows.append('| '+' | '.join(format(x,'.8g')if isinstance(x,(int,float))else x for x in vals)+' |')
text='**无脚本对照：**六份固定记录包含U(1)场/链路/Hamiltonian变换、四个本征态、201个时间点的复振幅与概率流、241个通量点、完整SU(2)回路矩阵和181个链路角，以及一代标准模型的精确有理数异常账。\n\n<figure class="plot" markdown="1">\n![有向四站方格与六图：局域相位、带链路比较、通量谱分支、规范不变概率、SU(2)回路迹、标准模型异常抵消。](assets/img/pp-01-gauge-certificates.svg)\n<figcaption>默认参数。方格和A/B采用静态比较态；D另用站点0初态。实线/实点与空心圈表示换规范前后。F的列编号代表不同左手场，精确分数保留在记录中。</figcaption>\n</figure>\n\n<div class="gauge195-static" role="region" tabindex="0" aria-label="规范变换固定记录，可横向滚动" markdown="1">\n\n| 预设 | Φ(度) | J/E0 | ReW(U1) | ImW(U1) | ReTrW(SU2)/2 | 当前总概率 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/gauge-certificates/run-snapshot.json){download="gauge-frozen-records.json"}。U(1)通量与SU(2)交换子回路是两个并列模型；SU(2)局域角用exp(iχσ/2)，不与U(1)的exp(iχ)混用。表中接近0的浮点残差不代表异常未抵消；异常合计另用精确分数0/1记录。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'schematic':1,'rows':6,'bytes':svg.stat().st_size})
