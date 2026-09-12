# -*- coding: utf-8 -*-
"""Render supplied three-flavor observations without recomputing physics."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">三味中微子：相位、物质与统计平均</title><desc id="desc">六图展示基线概率、离散能量响应、CP四组比较、恒定密度、九条能量线和两味解析极限。所有输入为示意值。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">同一个态：换基、传播、投影，再平均</text>']
names=['A · 初始μ味的三个去向；相位会继续振荡，不会单调变味','B · 能量扫描保留离散点，点间可能存在未解析的快速振荡','C · 真空与物质各算ν和反ν；环境差异不直接证明内禀CP','D · 每一点是一条恒定密度路径，不是一次传播的分层剖面','E · 九条正权重能量线；水平线是概率平均，不是振幅平均','F · 此图单独令θ13=θ23=0；最大混合仍需积累传播相位']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">默认L=1300 km、E0=2.5 GeV、ρ=2.8 g/cm³、Ye=0.5；全部为教学设置。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):
 if x is None:return '不适用'
 if isinstance(x,bool):return '是'if x else'否'
 if isinstance(x,(int,float)):return format(x,'.8g')
 return str(x)
rows=[]
for record in json.loads(fixture.read_text())['records']:
 s=record['data'];c=s['parameters'];p=s['current'];vals=[record['key'],c['baselineKm'],c['energyCenti']/100,p['probability'][1][0],s['averaged']['probability'][1][0],s['averaged']['purities'][1],p['evolution']['unitarityResidual'],s['baselinePlot']['currentVisible']]
 rows.append('| '+' | '.join(map(fmt,vals))+' |')
text='**无脚本对照：**六份固定记录保留完整PMNS、六套传播矩阵、九个能量通道及其密度矩阵、201个基线点、121个能量点、181个CP相位的四组对照和131个密度点。下表的概率统一指初始μ味到电子味；平均态纯度也对应初始μ味。\\n\\n'
text=text.replace('\\n','\n')+'<figure class="plot" markdown="1">\n![六图：三味基线概率、离散能量响应、真空和物质CP比较、恒定密度、九能量线平均与两味MSW解析极限。](assets/img/pp-04-neutrino-certificates.svg)\n<figcaption>基线图按频率上界控制采样范围；能量和密度图只画离散点。有限能谱平均不等于波包分离，全部示例参数不代表实验拟合。</figcaption>\n</figure>\n\n<div class="neutrino198-static" role="region" tabindex="0" aria-label="中微子固定记录，可横向滚动" markdown="1">\n\n| 预设 | L/km | E0/GeV | 单能Pμe | 平均Pμe | 平均纯度 | 幺正残差 | 当前L在基线图内 |\n|---|---:|---:|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/neutrino-certificates/run-snapshot.json){download="neutrino-frozen-records.json"}。负质量平方差是相对零点；简并两味角保存为null。快速振荡预设的当前基线仍为13000 km，只有基线图的显示范围缩短。九条能量线的中心是对数中心，平均能量另列。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
