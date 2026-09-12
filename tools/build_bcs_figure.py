# -*- coding: utf-8 -*-
"""Render only supplied BCS observations; no scientific recomputation."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(x=>[x.key,x.data]));console.log(JSON.stringify([0,1,2,3,4,5].map(i=>a.svg(a.plots(i===5?r.asymmetric:r.default)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">BCS配对、巨正则势、能谱与相位干涉</title><desc id="desc">六面板连接自洽振幅与稳定性、相干因子、Dynes谱和独立热卷积，并用不对称双结展示临界电流的相消边界。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">先判断配对态是否稳定，再区分能谱与测量</text>']
names=['A · λ=0.30：正常态始终是驻点候选，稳定振幅在Tc消失','B · T=0.5Tc：正根降低巨正则势；零解没有被除法删除','C · T=0.5Tc：谱权重与热占据不同；实规范下显示配对平均','D · Γ=0.04Δ0：Dynes谱填隙；理想边缘仍作为发散保留','E · 相同温度：只对理想谱做热卷积，未加入Dynes参数','F · 独立双结模型a=0.5：半整数磁通的谷底为I0']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">热力学、宽带谱与双结相位模型各有边界；有限截断扫描不直接预测强耦合材料。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
rows=[]
for r in json.loads(fixture.read_text())['records']:
 s=r['data'];c=s['parameters'];vals=[r['key'],c['couplingPercent']/100,c['temperaturePercent']/100,s['selected']['relative'],s['equilibrium']['value'],c['fluxPercent']/100,c['asymmetryPercent']/100,s['selectedSquid']['critical']]
 rows.append('| '+' | '.join(format(x,'.8g')if isinstance(x,(int,float))else x for x in vals)+' |')
text='**无脚本对照：**六份记录保留完整能隙曲线、试探振幅的巨正则势、谱投影、理想与Dynes谱、热卷积和双结相位扫描。积分误差估计不是严格区间界；热卷积尾界另行保存。\n\n<figure class="plot" markdown="1">\n![BCS能隙、巨正则势、相干因子、谱、热卷积与双结干涉六面板图。](assets/img/cm-02-bcs-certificates.svg)\n<figcaption>A、B保留正常态并检验稳定性；C区分谱权重与占据；D、E把谱展宽与测量热卷积分开；F的相位模型独立给定I0，不从能隙推算结参数。</figcaption>\n</figure>\n\n<div class="bcs192-static" role="region" tabindex="0" aria-label="BCS固定记录，可横向滚动" markdown="1">\n\n| 预设 | λ | T/Tc | Δ/Δ0 | 稳定势差/(N0Δ0²) | Φ/Φ0 | a | Ic/I0 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/bcs-certificates/run-snapshot.json){download="bcs-frozen-records.json"}。DOS和电导图窗上限为6，发散不当作0。对称结半磁通处的极小浮点残差对应数学上的零。较高耦合的谱窗可能超出配对壳层，宽带谱只作形式对照。\n'
md.write_text(text,encoding='utf-8');print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
