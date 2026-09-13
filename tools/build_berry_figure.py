# -*- coding: utf-8 -*-
"""Render supplied Berry geometry and exact-dynamics observations."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['twist',1],['fast',2],['coarse',3],['default',4],['fast',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">Berry相位：几何与真实演化</title><desc id="desc">六组实验区分规范表示、重叠采样、真实跃迁、时间离散与参考臂干涉。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">同一个复相位，有哪些不同的核对方法？</text>']
names=['A · 几何分段越细，离散回路逼近解析相位','B · 不同端点相位选择：补偿后的复相位相同','C · 有限速度真实演化：不能预设始终占据下带','D · 每一步都幺正，粗时间网格仍可能明显出错','E · 驱动速度的81点采样；不保证解析全部细振荡','F · 明确参考臂后，比较真正的端口概率']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">固定下带及A=i〈u|du〉；能隙关闭不输出隔离带预测，零重叠不取相位。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else'['+', '.join(fmt(v)for v in x)+']'if isinstance(x,list)else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];q=s['current'];d=s['dynamics'];v=[r['key'],s['model']['isolatedBand'],q['defined'],q['invariant'],d['selectedUpperProbability'],s['numerical']['stateError'],d['amplitude'],d['berry'],d['port']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份完整记录区分本征态族几何与真实演化。复数采用[实部, 虚部]；关闭能隙的记录只保留人为选态族的几何，隔离带预测不适用。\n\n<div class="berry207-static" role="region" tabindex="0" aria-label="Berry固定记录，可横向滚动" markdown="1">\n\n| 预设 | 隔离带 | 离散相位有定义 | 离散复相位 | 终态上投影概率 | 时间网格态矢误差 | 真实参考重叠 | Berry预测 | 端口概率 |\n|---|---|---|---|---:|---:|---|---|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/berry-certificates/run-snapshot.json){download="berry-frozen-records.json"}，含全部复态、相邻重叠、曲率和演化扫描。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
