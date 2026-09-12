"""Render only supplied stored observations; never regenerate numerical records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.singleton)[0],a.plots(r.default)[1],a.plots(r.orthogonal)[2],a.plots(r.polynomial)[3],a.plots(r.zero)[4],a.plots(r.scaled)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">Rademacher：符号、样本、几何与margin</title><desc id="desc">六面板分别说明单例与绝对值定义的区别、期望对称化、正交特征的Jensen等号、多项式特征的Gram范数谱、零margin的ramp损失，以及固定阈值的可加惩罚。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">能拟合随机符号多少，怎样接到样本之外？</text>']
names=['A · 单例：相关和逐项可正可负，平均为0；绝对值是另一个量','B · 完整三输入类：对所有训练样本平均，再比较对称化两端','C · 正交特征：符号和长度固定，精确复杂度达到Jensen上界','D · 多项式特征：范数平方的完整分布，由向量与Gram共同核对','E · 零特征：分数和margin为0，ramp损失仍为1','F · 特征与阈值同时扩大两倍：惩罚不因单位改变而改善']
for i,(plot,name)in enumerate(zip(plots,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>')
 out.append(plot.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">有限概率实验与特征实验分开；大M图仅为可加惩罚，须另有独立抽样和固定ρ等前提。</text></g></svg>')
svg.write_text(''.join(out));f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];o=s['observed'];l=s['linear']
 cells=[r['key'],str(s['parameters']['trainCount']),format(o['complexity']['value'],'.9g'),format(s['exact']['expectedPhi']['value'],'.9g'),format(l['exact'],'.9g'),format(l['jensen'],'.9g'),format(l['empiricalRamp'],'.9g')]
 rows.append('| '+' | '.join(cells)+' |')
text='**无脚本对照：**六份完整记录保存全部符号、理想训练计数、特征与Gram矩阵，以及每个样本量的固定阈值惩罚。小数是显示近似，整数重数和概率分子另存于下载记录。\n\n<figure class="plot" markdown="1">\n![单例的符号相关、对称化两端、正交特征复杂度、多项式范数谱、零margin损失和固定阈值惩罚六面板图。](assets/img/slt-03-rademacher-certificates.svg)\n<figcaption>A 区分带绝对值与不带绝对值的定义；B 对所有训练样本取期望；C 的蓝点与Jensen线重合；D 的重数覆盖全部符号；E 的样本点重合在零margin；F 未加入训练ramp风险，不能当作实际错误率。</figcaption>\n</figure>\n\n<div class="rademacher189-static" role="region" tabindex="0" aria-label="Rademacher固定记录，可横向滚动" markdown="1">\n\n| 预设 | m | 损失类经验R | E sup-gap | 特征分数类精确R | Jensen上界 | 当前ramp训练风险 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/rademacher-certificates/run-snapshot.json){download="rademacher-frozen-records.json"}。有限概率实验与单位球特征实验各有明确的样本空间。固定种子只是本次示例；总体概率通过完整多项式枚举计算。margin阈值的单独保证不能直接用来支持同一份数据上的任意调参。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
