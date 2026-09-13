# -*- coding: utf-8 -*-
"""Render supplied quantum-channel observations without regenerating them."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['boundary',1],['default',2],['default',3],['coarse',4],['default',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">量子操作的六种矩阵检验</title><desc id="desc">振幅衰减、完全正性、辅助纠缠、环境读数与时间近似分别检验。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从系统与环境，到完整通道的六项检查</text>']
names=['A · 同一衰减概率，对人口、相干与纯度的影响不同','B · 单系统正性不够：Choi负值直到q=2/3才消失','C · q=0.5：乘积输入通过，纠缠输入暴露负值','D · 环境结果概率变化，无条件系统输出不变','E · Euler一步精确保迹，任意正步长仍非完全正','F · 固定γt=1：分别检查完整通道误差和负本征值']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">系统在前；归一化Choi迹为一；负本征值保留，零概率不造条件态。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else'['+', '.join(fmt(v)for v in x)+']'if isinstance(x,list)else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];d=s['damping'];n=s['noise'];t=s['time'];v=[r['key'],d['p'],d['system']['purity'],d['environment']['purity'],[b['probability']for b in d['branches']],n['q'],n['cp'],n['eigenvalues'][0],n['jointEigenvalues'][0],t['choiError']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留系统、环境、Choi与时间近似的完整复矩阵。结果概率零时没有条件态；混合转置的负本征值保持原值。\n\n<div class="channels209-static" role="region" tabindex="0" aria-label="量子通道固定记录，可横向滚动" markdown="1">\n\n| 预设 | p | 系统纯度 | 环境纯度 | 原始结果概率 | q | 完全正 | Choi最小本征值 | 联合输出最小本征值 | Euler完整Choi误差 |\n|---|---:|---:|---:|---|---:|---|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/channels-certificates/run-snapshot.json){download="channels-frozen-records.json"}，含幺正扩张、偏迹、四个矩阵单位的重建、所有扫描与实际Euler超算符幂。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
