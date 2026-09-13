# -*- coding: utf-8 -*-
"""Render supplied complex observations; no recomputation of experiments."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]);const jobs=[['default',0],['residue',1],['path',2],['regular',3],['rescale',4],['path',5]];console.log(JSON.stringify(jobs.map(([k,i])=>a.svg(a.plots(f.records.find(r=>r.key===k).data)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">LSZ：四条外腿与三个极限问题</title><desc id="desc">六个局部复数算例：外腿计数、留数、调节量路径、正则项误差、换场不变性与复平面方向。不是截面模拟。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">先保留每个因子，再判断何时可以取极限。</text>']
names=['A · 剩余一条外腿会留下离壳依赖','B · 每腿Z=1/2：四外态共给出Z²=1/4','C · η=δ与先取η=0，并不给出同一路径极限','D · 正则项带来有限离壳修正；绝对误差包含浮点误差','E · 换场时G与Γ各自改变，Z²Γ保持不变','F · 复平面同时保留符号、相位与模']
for i,(panel,name)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(panel.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">局部无量纲模型；有限η不是粒子宽度，数值路径不替代LSZ定理。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
def fmt(x):return'不适用'if x is None else'['+', '.join(fmt(v)for v in x)+']'if isinstance(x,list)else format(x,'.8g')if isinstance(x,(int,float))else str(x)
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];q=s['current'];v=[r['key'],q['residue'],q['gamma']['value'],q['full']['value'],q['direct']['value'],q['target']['value'],s['rescaled']['full']['value']];rows.append('| '+' | '.join(map(fmt,v))+' |')
text='**无脚本对照：**六份固定记录保留全部复数外腿、路径与换场扫描。复数格式为[实部, 虚部]，数值已提出各自的参考质量单位。\n\n<figure class="plot" markdown="1">\n![六图展示外腿、留数、取极限路径、正则项、场重标定与复数相位。](assets/img/bridge-01-lsz-certificates.svg)\n<figcaption>这些是局部Laurent模型的计算，不是满足全部动量约束的散射模拟，也没有给出截面。</figcaption>\n</figure>\n\n<div class="lsz205-static" role="region" tabindex="0" aria-label="LSZ固定复数记录，可横向滚动" markdown="1">\n\n| 预设 | Z | Γ | Z²Γ | 实分子提取 | 极点目标iM | 换场后Z′²Γ′ |\n|---|---:|---|---|---|---|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/lsz-certificates/run-snapshot.json){download="lsz-frozen-records.json"}。零复数相位不适用；正则项造成的传播子零点不当作单粒子极点。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
