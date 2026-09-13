# -*- coding: utf-8 -*-
"""Render supplied spectral-response observations; never regenerate the observations."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['mixed',1],['commuting',2],['coarse',3],['narrow',4],['commuting',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">从算符到谱线与有限时间响应</title><desc id="desc">六组独立比较区分噪声、响应、热平衡、时间网格及记录尾部。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">一个两能级探针，六种不同的检查</text>']
names=['A · 噪声峰非负；对易子响应可以带负号','B · 加入守恒分量：展宽曲线不保证精确热平衡FDT','C · 同一个外场：封闭演化与重新热平衡并不相同','D · 固定记录时长，再检查实际时间网格误差','E · 窄峰需要长记录：解析尾界控制未观察的时间','F · 精确有限外场热平均及零场切线']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">固定−fB、正iωt及ℏ=1；η仅定义展宽，不给封闭演化加入热浴。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'是'if x is True else'否'if x is False else'['+', '.join(fmt(v)for v in x)+']'if isinstance(x,list)else format(x,'.9g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];v=[r['key'],s['static']['retarded'],s['static']['isothermal'],s['current']['chi'],s['window']['value'],s['window']['tailError'],s['numerical']['error'],s['quench']['change'],s['equilibrium']['change']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录把连接噪声、响应与等温比较分开。复数以[实部, 虚部]表示；实际封闭演化不包含热浴。\n\n<div class="response208-static" role="region" tabindex="0" aria-label="谱响应固定记录，可横向滚动" markdown="1">\n\n| 预设 | 迟滞零频极限 | 等温导数 | 无限时间χ | 有限记录χ | 尾部误差 | 时间网格误差 | 封闭演化变化 | 重新热平衡变化 |\n|---|---:|---:|---|---|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/response-certificates/run-snapshot.json){download="response-frozen-records.json"}，含每个时间节点的复贡献、完整谱线与温度/场强/带宽扫描。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
