# -*- coding: utf-8 -*-
"""Render supplied MPS metric records; do not regenerate observations."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['default',1],['complex',2],['cutoff',3],['default',4],['null',5],['default',6]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4730" viewBox="0 0 1000 4730" role="img" aria-labelledby="title desc"><title id="title">MPS局部范数与物理能量的完整对照</title><desc id="desc">坐标、条件数、允许空间、阈值、正则化、能量零点和物理单位范数分别计算。</desc><rect width="1000" height="4730" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">先确定物理态，再解释求解器报告的数</text>']
names=['A · 同一物理问题：正确值、错误目标、错误候选真实能量','B · 范数条件数是映射条件数的平方；无穷不是有限大数','C · 转动实际允许空间，真实变分上界才会改变','D · 阈值删除仍然有效的物理方向，必须记录保留秩','E · 给分母加eta I，目标值与物理能量分开','F · 秩亏且正能量时，修改目标可偏好零物理态','G · 相同坐标比例尺；实坐标截面并非完整复数单位球']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4688" font-size="16">固定局部线性子空间；复数共轭内积；零物理向量不定义Rayleigh能量。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];name={'default':'默认坐标','complex':'复数坐标','rankone':'实际降秩','cutoff':'阈值截断','regularized':'大正则化','null':'零物理态'}[r['key']];v=[name,s['model']['rank'],s['model']['conditionN'],s['exact']['energy'],s['ordinary']['reported'],s['ordinary']['candidate']['energy'],s['threshold']['rank'],s['eta'],s['regularized']['objective'],s['regularized']['candidate']['energy'],s['regularized']['candidate']['exactNull']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留完整复矩阵、支撑变换、候选态与全部扫描。复数为[实部,虚部]；零物理态的真实能量不适用。\n\n<div class="metric211-static" role="region" tabindex="0" aria-label="MPS范数固定记录，可横向滚动" markdown="1">\n\n| 预设 | 实际秩 | kappa(N) | 正确能量 | 忽略N的值 | 错误候选真实能量 | 阈值后秩 | eta | 正则化目标 | 正则化候选真实能量 | 零物理态 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/metric-certificates/run-snapshot.json){download="metric-frozen-records.json"}，含所有原始复矩阵、真实归一化、修改目标、阈值和全部扫描点。\n'
md.write_text(text,encoding='utf-8');print({'plots':7,'rows':6,'bytes':svg.stat().st_size})
