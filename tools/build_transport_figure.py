# -*- coding: utf-8 -*-
"""Render supplied finite-ring observations; do not recompute their science."""
from pathlib import Path
import json,subprocess,shutil,sys,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(x=>[x.key,x.data]));console.log(JSON.stringify([0,1,2,3,4,5].map(i=>a.svg(a.plots(i===5?r['biased-step']:r.default)[i]))));"
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">守恒涨落、因果响应与扩散输运</title><desc id="desc">六图连接有限环的空间相关、模式弛豫率、两时相关、频率响应、噪声与数值方差偏差。前五图为默认参数，最后一图为Euler稳定但有偏预设。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从平衡相关到守恒输运：噪声与耗散一起核对</text>']
names=['A · 固定总量导致补偿性负相关；完整协方差仍半正定','B · 静态分布相同，不表示动力学时标相同','C · 相关保留过去的记忆，响应不能早于外场','D · FDT与频谱缩放：重合曲线的原始单位并不相同','E · 耗散消去旧涨落；匹配噪声维持平衡方差','F · 此图使用biased-step预设：ΓΔt=1.35，Euler稳定却有偏']
for i,(p,n)in enumerate(zip(panels,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(n)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">有限受约束Gaussian模型；零模单独处理，电导率解释须恢复单位和静态响应。</text></g></svg>');svg.write_text(''.join(out),encoding='utf-8')
rows=[]
for record in json.loads(fixture.read_text())['records']:
 s=record['data'];vals=[record['key'],s['parameters']['sites'],s['parameters']['mode'],s['selected']['staticVariance'],s['selected']['rate'],s['step']['rateStep'],s['step']['eulerStatus'],s['step']['eulerStationaryVariance']]
 rows.append('| '+' | '.join('不适用'if x is None else format(x,'.8g')if isinstance(x,(int,float))else x for x in vals)+' |')
text='**无脚本对照：**六份固定记录含全部参数、完整L/H/A/Q/C/P矩阵、全部Fourier模式、加密时间采样、201个频率点、100个有限窗积分和65步方差递推。零模由固定总量约束移除；r=0仅在有限受约束环中解释。\n\n<figure class="plot" markdown="1">\n![六图：空间协方差、守恒与非守恒弛豫率、相关与因果响应、频率FDT、噪声维持方差、Euler步长偏差。](assets/img/cm-04-transport-certificates.svg)\n<figcaption>A—E使用默认参数。F使用biased-step预设：ΓΔt=1.35，Euler稳态方差约为正确值的3.076923倍；纵轴为log10(1+V/S)，原始方差见记录。</figcaption>\n</figure>\n\n<div class="transport194-static" role="region" tabindex="0" aria-label="守恒输运固定记录，可横向滚动" markdown="1">\n\n| 预设 | N | m | 平衡方差S | Γ | ΓΔt | Euler状态 | Euler稳态方差 |\n|---|---:|---:|---:|---:|---:|---|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/transport-certificates/run-snapshot.json){download="transport-frozen-records.json"}。stable仅表示均方稳定，未保证平衡方差无偏。constrained-zero表示固定总量的零模；unstable表示数值更新失稳，并非物理相变。频窗[-10Γ,10Γ]只包含约93.655%的非零模方差。\n'
md.write_text(text,encoding='utf-8');print({'panels':6,'rows':len(rows),'bytes':svg.stat().st_size})
