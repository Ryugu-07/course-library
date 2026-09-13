# -*- coding: utf-8 -*-
"""Render supplied Ising/parity observations without regenerating them."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['critical6',1],['localx',2],['default',3],['ordered',4],['default',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">从完整奇偶谱走到实际探针</title><desc id="desc">分别比较能隙定义、完整能级、探针权重、连接相关与临界尺寸。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">完整谱是起点，探针决定哪些信号出现</text>']
names=['A · L=4：完整隙、偶扇区隙和单准粒子尺度不同','B · L=6：两个奇偶块各保留32个能级及全部重数','C · 局部X：谱线要由能量差与实际矩阵元共同构成','D · 同一条链：局部与全链平均探针分配不同权重','E · 零场偶猫态：X涨落恒定，迟滞核却为零','F · 精确临界有限和：1/L幂次相同，前因子仍不同']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">周期自旋；Pauli±1；初态为偶基态；谱线展宽未给时间演化加入热浴。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else'['+', '.join(fmt(v)for v in x)+']'if isinstance(x,list)else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];d=s['dimensionless'];o=s['observables'][s['parameters']['operator']];v=[r['key'],s['model']['L'],s['model']['g'],d['fullGap'],d['evenGap'],d['epsilon'],o['spectral']['variance'],s['correlation']['C'],s['current']['chi'],s['area']['value']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份记录保留全部自旋/JW矩阵、约束费米占据、探针和完整扫描。复数以[实部,虚部]表示；初态固定为偶基态，零场为对称猫态。\n\n<div class="ising210-static" role="region" tabindex="0" aria-label="Ising奇偶固定记录，可横向滚动" markdown="1">\n\n| 预设 | L | g | 完整隙/J | 偶扇区隙/J | ε/J | 探针方差 | 当前C(t) | 当前χ(ω) | 带内面积 |\n|---|---:|---:|---:|---:|---:|---:|---|---|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/ising-parity-certificates/run-snapshot.json){download="ising-frozen-records.json"}，包括全部模式配置、简并子空间强度、每条JW键、所有频率/时间/横场/尺寸与带宽数据。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
