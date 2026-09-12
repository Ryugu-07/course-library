# -*- coding: utf-8 -*-
"""Render supplied observations only; do not recompute scientific records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.top)[0],a.plots(r.top)[1],a.plots(r.sign)[2],a.plots(r.tilted)[3],a.plots(r.default)[4],a.plots(r.default)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">占据数、交换符号、截断与两粒子干涉</title><desc id="desc">六面板分别呈现玻色阶梯范数、截断对易子、四模式费米符号、两模型能谱、固定初态的占据概率与正规序配对计数。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从算符作用到可以测量的两粒子概率</text>']
names=['A · q=8：显示窗口以外的产生路径，与真正投影删掉的路径','B · q=8：最高态对易子为−8，整个截断空间的迹为0','C · 四费米模式：负号来自前缀奇偶性；小横向错位只为分开标记','D · 势差Δ=2：玻色N=2三条能级；紫线是另一个费米模型的U','E · 自由共振且t=1：玻色P20与P02重合，费米满占据不转移','F · 正规序去掉自配对；无序粒子对还须除以2']
for i,(plot,name)in enumerate(zip(plots,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>');out.append(plot.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">局部占据滑块不改变固定初态动力学；有限扇区的精确解不能直接宣布热力学相变。</text></g></svg>');svg.write_text(''.join(out))
f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];c=s['parameters'];cells=[r['key'],c['statistics'],str(c['cutoff']),str(c['hoppingPercent']/100),str(c['interactionPercent']/100),str(c['detuningPercent']/100),', '.join(format(v,'.8g')for v in s['boson']['eigen']['energies'])];rows.append('| '+' | '.join(cells)+' |')
text='**无脚本对照：**六份完整记录保留每条算符路径、全部四模式CAR、截断缺陷、两模型矩阵、能谱和161个时间点的复振幅。整数与根式系数精确保存；本征分解和时间演化采用浮点数。\n\n<figure class="plot" markdown="1">\n![玻色阶梯、截断对易子、四模式费米符号、能谱、两粒子概率与正规序计数六面板图。](assets/img/cm-01-fock-certificates.svg)\n<figcaption>A、B比较未截断与真正投影；C的零系数表示Pauli阻挡；D的两种U定义不同；E从固定初态一边一个粒子出发；F区分粒子数平方和实际粒子对数。</figcaption>\n</figure>\n\n<div class="fock191-static" role="region" tabindex="0" aria-label="二次量子化固定记录，可横向滚动" markdown="1">\n\n| 预设 | 局部统计 | q | t/E0 | U/E0 | Δ/E0 | 玻色N=2能量/E0 |\n|---|---|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/fock-certificates/run-snapshot.json){download="fock-frozen-records.json"}。q只用于投影代数比较，下面始终完整的两玻色子三态矩阵不随q截断。局部占据选择不改变动力学初态。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
