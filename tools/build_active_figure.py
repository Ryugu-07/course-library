# -*- coding: utf-8 -*-
"""Render supplied active matter observations without recomputing the science."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),s=f.records.find(r=>r.key==='default').data;console.log(JSON.stringify(a.plots(s).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">主动物质：位移、响应、约束与集体失稳</title><desc id="desc">六图依次展示MSD、方向相关、连续位置谱、不同温度读数、集体扩散和低波数增长谱。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">会扩散，不等于只是更热。</text>']
names=['A · 热项在最短时间主导；短时展开不保证弹道区间可见','B · 旋转使方向相关振荡，旋转噪声使相关衰减','C · 只画连续谱；Dr=0时的主动δ权重另列完整表','D · 谐阱、自由扩散与选频读数一般不能共享一个温度','E · 非手性集体闭合：局部单粒子扩散与集体系数不同','F · 低波数放大；正增长只检验线性失稳，不是共存相图']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">默认v=2，Dr=0.5，Dt=0.2，Ω=0，μ=k=1；集体模型独立规定Ω=0。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return '不适用'if x is None else format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];v=[r['key'],s['chosenTime']['msd'],s['readings']['freeDiffusionTemperature'],s['readings']['trapTemperature'],s['readings']['spectralTemperature'],len(s['trap']['atoms']),s['density']['collectiveDiffusion']]
 rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份记录完整保留位移与方向、谐阱矩、频率扫描、离散谱权重、全部密度和波数、本征值及适用边界。系综均值不是单粒子轨迹，线性失稳不是共存相图。\n\n<figure class="plot" markdown="1">\n![六图：MSD、方向记忆、位置连续谱、温度比值、集体系数与增长谱。](assets/img/neq-03-active-certificates.svg)\n<figcaption>前四图是指定的单粒子模型，后两图是独立的非手性集体闭合。增长图放大低波数；完整波数0至4的数据都保留。存在δ谱线时，连续谱曲线不能代表完整谱。</figcaption>\n</figure>\n\n<div class="active202-static" role="region" tabindex="0" aria-label="主动物质固定记录，可横向滚动" markdown="1">\n\n| 预设 | 观察末MSD | 扩散温度读数 | 谐阱温度读数 | 完整谱选频读数 | δ谱线数 | 集体系数Dcoll |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/active-certificates/run-snapshot.json){download="active-frozen-records.json"}。默认热浴温度为0.2，三种读数却分别为4.2、1.533333和1；这些是不同观测的比值，不是三个额外热浴。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
