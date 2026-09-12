# -*- coding: utf-8 -*-
"""Render supplied tree-level electroweak observations without recomputing science."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=f.records.find(x=>x.key==='default').data;console.log(JSON.stringify(a.plots(r).map(a.svg)));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">电弱质量、手征流与规范相关极点</title><desc id="desc">六图展示默认树级势的截面、二次项扫描、错误中性混合角、超荷耦合扫描、物理手征流和Rxi内部极点。所有数值来自模型，不是实验测量。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从势与表示出发：质量、耦合、规范选择分别核对</text>']
names=['A · 势的实轴截面；先找最低点，再计算局部曲率','B · 改变二次系数是在改势；不是有限温度相变预测','C · 改变中性基底，不能把AA对角元直接叫光子质量','D · 改变超荷耦合会改变Z质量；这里固定g与势','E · 左右手电子的电荷相同，中性弱流却不同','F · 物理矢量质量不随ξ变化；内部极点不是额外粒子']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">单Higgs双重态、树级与canonical动能；零耦合和零真空边界另有完整记录。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
rows=[]
for record in json.loads(fixture.read_text())['records']:
 s=record['data'];G=s['gauge'];vals=[record['key'],s['vacuum']['v'],G['mW'],G['mZ'],s['vacuum']['radialMass'],G['rank'],G['dof']['physicalGlobalGoldstones'],G['dof']['total']]
 rows.append('| '+' | '.join(format(x,'.8g')if isinstance(x,(int,float))else x for x in vals)+' |')
text='**无脚本对照：**六份固定记录含完整四实场Hessian、四个生成元与真空切向量、四维规范质量矩阵、本征向量、中性混合、7个物理手征分量、401个势点，以及二次项/耦合/混合角/规范参数扫描。所有质量以GeV记录，质量平方以GeV²记录。\n\n<figure class="plot" markdown="1">\n![六图：Higgs势截面与最低点、二次系数扫描、错误中性角旋转、超荷耦合扫描、左右手电弱流、Rxi内部极点与物理质量。](assets/img/pp-02-electroweak-certificates.svg)\n<figcaption>全部使用默认模型参数及各图明示的单变量扫描。固定参考S=246GeV不表示所有预设都令v=246GeV。势截面的两个最低点不应被直接当成两个物理规范真空。</figcaption>\n</figure>\n\n<div class="electroweak196-static" role="region" tabindex="0" aria-label="电弱模型固定记录，可横向滚动" markdown="1">\n\n| 预设 | v/GeV | mW/GeV | mZ/GeV | 径向质量/GeV | 质量矩阵秩 | 物理全局Goldstone数 | 物理自由度 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/electroweak-certificates/run-snapshot.json){download="electroweak-frozen-records.json"}。零耦合是理论解耦极限；对称原点处没有被吸收的Goldstone。无定义的物理角度、比值和匹配量在记录中标null，不用人为补零冒充结论。\n'
md.write_text(text,encoding='utf-8');print({'plots':6,'rows':6,'bytes':svg.stat().st_size})
