# -*- coding: utf-8 -*-
"""Render supplied color/running/potential observations, without recomputing physics."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">QCD的色矩阵、尺度变化与两通道能级</title><desc id="desc">六图分别呈现一圈倒数与正耦合、色Casimir谱、反夸克变换、示意弦断裂和味数系数。有限颜色代数精确，running与势是标明范围的模型。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">颜色、尺度、束缚态：三个问题分别计算</text>']
names=['A · 比较时固定同一个参考耦合；阈值只改变分段斜率','B · 正耦合图不延拓到负值，也不将大数截成平台','C · 总色荷平方的零空间就是单态；二夸克没有零本征值','D · 反夸克必须使用复共轭表示；错误表示构成反例','E · 示意两通道的避免交叉，不是直接运行格点QCD','F · 味数增多可以改变一圈符号；二圈正零点仍需审慎解释']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">所有数字为教学计算；相同参考αs(100 GeV)，势与颜色模型的参数独立。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):
 if x is None:return '不适用'
 if isinstance(x,(int,float)):return format(x,'.8g')
 return str(x)
rows=[]
for record in json.loads(fixture.read_text())['records']:
 s=record['data'];c=s['current'];vals=[record['key'],c['q'],c['nf'],c['inverse'],c['alpha'],s['rotation']['wrongMesonFidelity'],s['crossingR'],s['crossing']['lowerStringWeight']if s['crossing']else None]
 rows.append('| '+' | '.join(map(fmt,vals))+' |')
text='**无脚本对照：**六份固定记录包含8个完整Gell-Mann矩阵，9/9/27维总Casimir、单态及其生成元作用、SU(3)变换、401个能标的固定/匹配计算、181个颜色角和301个两通道间距。下表的耦合来自当前模式；颜色与势参数独立。全部都是模型计算。\n\n<figure class="plot" markdown="1">\n![六图：固定与匹配的一圈耦合、正耦合分支、三种颜色空间的Casimir谱、正确与错误反夸克表示、两通道能级和味数系数。](assets/img/pp-03-qcd-certificates.svg)\n<figcaption>默认αs(100 GeV)=0.120；势的αV=0.3另行固定。大于1的耦合保留在原始表中但不画成平台；色代数不代替禁闭证明。</figcaption>\n</figure>\n\n<div class="qcd197-static" role="region" tabindex="0" aria-label="QCD固定模型记录，可横向滚动" markdown="1">\n\n| 预设 | Q/GeV | 当前nf | 1/αs | αs | 错误介子重叠² | 交叉r/fm | 解析交叉处低能弦权重 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/qcd-certificates/run-snapshot.json){download="qcd-frozen-records.json"}。不适用值保存为null：包括越过正耦合分支的αs、σ=0时不存在的交叉距离，以及δ=0精确简并时未被选定的单态权重。浮点交叉代入另列，不能拿舍入残差选基。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
