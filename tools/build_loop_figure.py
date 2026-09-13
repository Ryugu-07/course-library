# -*- coding: utf-8 -*-
"""Render supplied loop observations without recomputing scientific records."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['default',1],['quadrature',2],['mismatch',3],['matching',4],['moving',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">圈积分：减法、误差与参数匹配</title><desc id="desc">六个欧氏单通道算例，区分截断、求积网格、减法方案、微扰阶数与极限条件。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">先说明固定哪些量，再判断差为什么变小。</text>']
names=['A · 同一截断下两项增长，动量差趋于有限值','B · 解析余项受1/Λ²上界控制，固定m、Q和Q₀','C · m=0.5、Q=10：端点变化快，要检查积分网格','D · 参考项使用2Λ时，有限偏移不会自行消失','E · 换减法点后，只能把相同微扰阶数进行比较','F · Q=κΛ与固定外动量不是同一种极限']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">正质量欧氏单通道模型；解析上界、网格误差与高阶余项分别解释。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else format(x,'.10g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];q=s['current'];v=[r['key'],s['model']['L'],s['model']['N'],q['continuum'],q['finite'],q['correction'],q['cutoffBound'],q['quadratureError'],s['matching']['directDifference']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留全部求积节点、97个截断点和41个减法点。下列误差是有符号的实际数值差；上界约束解析截断余项的绝对值。\n\n<div class="loop206-static" role="region" tabindex="0" aria-label="圈积分固定记录，可横向滚动" markdown="1">\n\n| 预设 | Λ | N | 连续极限 | 有限截断值 | 截断余项 | 余项上界 | 网格误差 | 未重展开的匹配差 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/loop-certificates/run-snapshot.json){download="loop-frozen-records.json"}。所有质量尺度使用同一单位，积分和教学量F无量纲。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
