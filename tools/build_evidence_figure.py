# -*- coding: utf-8 -*-
"""Render supplied observations only; do not recompute synthetic experiments."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['cancel',1],['singular',2],['shared',3],['bounded',4],['bounded',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">前沿证据：从响应模型到条件区间</title><desc id="desc">六个合成例子：级数余量、算符抵消、参数退化、共享噪声、有界偏差与条件尺度下限。它们不是实际实验数据。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">模型条件改变，推断的含义也会改变。</text>']
names=['A · 指定有理函数：x越过1后，仍能算数但不保证展开收敛','B · x=0.1：两个非零算符可以相消','C · r=1：重复通道只识别a+b，自由a没有有限区间','D · 共享高斯误差：保留非零协方差','E · 固定偏差B：随机精度提高后区间仍有下限','F · 固定观测中心为0：尺度限制依赖系数、幂次和偏差假设']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">全部数据为合成算例；置信区间、灵敏度与理论确认分别解释。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];v=[r['key'],s['model']['x'],s['polynomial']['total'],s['fit']['rank'],s['model']['B'],s['bounded']['coverageAtExtremeBias'],s['bounded']['wrongCoverageAtExtremeBias'],s['scale']['logLower']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份记录保留模型、完整扫描、协方差与区间。它们不是实时搜索限值。\n\n<figure class="plot" markdown="1">\n![六图：响应展开、算符抵消、自由与固定参数、共享误差、偏差区间和条件尺度。](assets/img/beyond-01-evidence-certificates.svg)\n<figcaption>每幅图使用独立声明的模型。尺度面板固定零中心值，不由可调的双通道观测直接生成。</figcaption>\n</figure>\n\n<div class="lookout204-static" role="region" tabindex="0" aria-label="前沿判断固定记录，可横向滚动" markdown="1">\n\n| 预设 | x | 两算符总和 | 响应秩 | 固定B | 正确极端偏差覆盖率 | 错误覆盖率 | 条件log₁₀Λ下限 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/evidence-certificates/run-snapshot.json){download="evidence-frozen-records.json"}。零耦合不产生有限尺度界；秩退化不产生有限的自由参数区间。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
