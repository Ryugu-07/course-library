"""Render recorded density matrices and ledgers; never regenerate observations."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.single)[0],a.plots(r.phase)[1],a.plots(r.coherent)[3],a.plots(r.independent)[2],a.plots(r.coherent)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 单X旋转：两个非零综合分支，恢复后都保留原逻辑态','B · 单Z旋转：零综合不保证无逻辑变化；实心输入、空心输出','C · 同样的逐位翻转概率：相干与随机模型的输出Z分量不同','D · 三比特重复码：独立与全相关X错误的逻辑概率不同','E · Shor码：I和27个单Pauli的784个纠错条件逐对检查']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">纠错之后，逻辑量子态发生了什么</title><desc id="desc">五面板来自完整固定记录，包含综合概率、Bloch分量与纠错条件。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">从错误综合一直算到恢复后的态</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];fmt=lambda v:format(v,'.9g');rows.append('| '+r['key']+' | '+fmt(s['fidelity'])+' | '+fmt(s['outputBloch'][1])+' | '+fmt(s['outputBloch'][2])+' | '+str(sum(b['conditional']is None for b in s['branches']))+' | '+fmt(s['tracePreservationDefect'])+' |')
text='<section class="learning-layer" aria-label="预测与量子纠错实验" markdown="1">\n\n<div class="learning-lab" data-learning-lab="qec-channel" markdown="1">\n\n**无脚本对照：**五幅图与下表来自同一份六组记录。固定输入为逻辑+Y态；保真度只针对该输入，不能代替通用纠错条件。零概率分支的条件态记为不适用。\n\n<figure class="plot" markdown="1">\n![单X与单Z旋转、相干和随机噪声、相关错误以及Shor码纠错条件。](assets/img/qi-03-qec-ledgers.svg)\n<figcaption>图 qi-03.1：A检查综合分支；B与C直接比较逻辑观测量；D写清概率模型；E逐对核验码上的误差内积。</figcaption>\n</figure>\n\n<div class="qec177-static" role="region" tabindex="0" aria-label="量子纠错固定记录，可横向滚动" markdown="1">\n\n| 预设 | 输入保真度 | 输出Y | 输出Z | 零概率条件分支数 | 保迹残差 |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/qec-certificates/run-snapshot.json)。保留所有物理Kraus矩阵、逻辑恢复分支、条件态、Shor码基、稳定子群与2619个低权重Pauli。相干旋转没有被换成随机Pauli混合。\n\n</div>\n\n</section>\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
