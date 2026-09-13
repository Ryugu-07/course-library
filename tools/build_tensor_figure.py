# -*- coding: utf-8 -*-
"""Render supplied tensor compression observations; never recompute states."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['entropy',0],['tiny',1],['bells',2],['random',3],['ghz',4],['random',5]];console.log(JSON.stringify(jobs.map(([key,i])=>a.svg(a.plots(f.records.find(r=>r.key===key).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">张量压缩：单切口、全链重建与误差账本</title><desc id="desc">六图分别展示低熵谱、微小正权重、Bell链的切口、实际全链保真度、GHZ逐步误差及压缩能量。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">保存张量，重建全态，再检查误差。</text>']
names=['A · 低熵三权重态：S＜ln2，仍有第三条非零通道','B · ε=10⁻¹²的满秩尾部：对数坐标保留正权重','C · Bell对链：最窄切口不决定统一键维需求','D · 固定复随机态：每个χ都从六个张量实际收缩','E · GHZ、χ=1：只有首步丢弃1/2，后面已是乘积态','F · 压缩态能量不等于优化后的基态能量']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">六站点复数模型；精确秩、数值阈值、近似尾部和物理观测分别核对。</text></g></svg>')
svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];q=s['chain'];v=[r['key'],s['parameters']['chi'],s['selected']['entropy'],q['sumDiscarded'],q['squaredFidelity'],s['comparison']['productOriginalCutFidelities'],s['observables']['original']['variance']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份记录包含输入态、全部切口、逐步张量、重建振幅与完整残差。每张图标明所用态族；连线只帮助比较离散数据。\n\n<figure class="plot" markdown="1">\n![六图：纠缠权重、微小尾部、Bell对切口、全链保真度、逐步误差与能量。](assets/img/mb-01-tensor-certificates.svg)\n<figcaption>单切口最优性不能代替全链重建；实际步骤尾和不同于原始切口尾部。数值阈值不用于截断张量。</figcaption>\n</figure>\n\n<div class="tensor203-static" role="region" tabindex="0" aria-label="张量压缩固定记录，可横向滚动" markdown="1">\n\n| 预设 | χ | 中间切口熵 | 实际步尾和 | 全链F² | 原始切口F²乘积 | 原态完整方差 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/tensor-certificates/run-snapshot.json){download="tensor-frozen-records.json"}。GHZ的五个原始切口F²乘积是1/32，实际全链F²却是1/2；请从保存的张量独立收缩核对。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
