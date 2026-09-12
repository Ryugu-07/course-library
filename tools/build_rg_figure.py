"""Render stored observations only."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r['exact-chain'])[0],a.plots(r['weak-chain'])[2],a.plots(r['exact-chain'])[3],a.plots(r.marginal)[4],a.plots(r['epsilon-one'])[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3840" viewBox="0 0 1000 3840" role="img" aria-labelledby="title desc"><title id="title">从精确消元到有边界的重整化近似</title><desc id="desc">六面板展示十六点环保留偶数自旋、累积常数恢复配分函数、零场相关长度刻度、星图四体项、四维边缘流与热标度场。</desc><rect width="1000" height="3840" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">把消去的影响算进去，再比较不同尺度</text><text x="40" y="95" font-size="17">A · 原环16点：蓝色保留，橙色自旋的两种取值都要求和</text>']
for i in range(16):
 x=60+i*58
 if i<15:out.append(f'<line x1="{x+18}" y1="180" x2="{x+40}" y2="180" stroke="#758190" stroke-width="2"/>')
 out.append(f'<circle cx="{x}" cy="180" r="18" fill="{("#3875ba"if i%2==0 else"#c55b32")}"/><text x="{x}" y="185" fill="white" text-anchor="middle" font-size="12">s{i}</text>')
 if i%2==0:
  out.append(f'<path d="M{x} 205 V322 l-5 -9 m5 9 l5 -9" stroke="#3875ba" stroke-width="2" fill="none"/>')
out.append('<path d="M60 160 Q60 125 120 125 H870 Q930 125 930 160" fill="none" stroke="#758190" stroke-dasharray="5 4"/><text x="475" y="118" text-anchor="middle" font-size="13">周期闭合键</text>')
for i in range(8):
 x=60+116*i
 if i<7:out.append(f'<line x1="{x+18}" y1="370" x2="{x+98}" y2="370" stroke="#3875ba" stroke-width="3"/>')
 out.append(f'<circle cx="{x}" cy="370" r="18" fill="#3875ba"/><text x="{x}" y="375" fill="white" text-anchor="middle" font-size="12">s{2*i}</text>')
out.append('<path d="M60 390 Q60 422 120 422 H812 Q872 422 872 390" fill="none" stroke="#3875ba" stroke-dasharray="5 4"/><text x="40" y="475" font-size="18">两段转移因子相乘：T² = eᶜ T′；每个新间隔的实际长度是 2a。</text><text x="40" y="520" font-size="18">Z₁₆ = e⁸ᶜ Z₈(K′, h′)；遗漏 e⁸ᶜ 会改变自由能。</text><text x="40" y="565" font-size="16">此图画变量与求和关系，不是一帧随机自旋样本。</text><text x="40" y="602" font-size="16">再重复两次得到4点、2点；两点环保留两条周期键。</text>')
labels=['B · 补回常数后，各级恢复同一个 log Z','C · q会数值下溢，但 log q 仍保存了相关长度','D · 零场星图允许四体项：只强制奇数阶项为零','E · ε=0：正四次耦合是边缘无关，不是严格不流动','F · ε=1截断流中的热偏离；阈值不是已测定的物理长度']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=685+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text((''.join(out)+'</g></svg>').replace('fill="white"','style="fill:white"'))
f=json.loads(fixture.read_text());rows=[]
for rec in f['records']:
 s=rec['data'];rows.append('| '+rec['key']+' | '+' | '.join(format(x,'.9g')for x in[s['chain']['initial']['logZ'],s['chain']['stages'][-1]['restoredLogZ'],s['star']['coefficients'][15]['value'],s['star']['klDivergence'],s['flow']['exponents']['nuFirstOrder']])+' |')
text='**无脚本对照：**六组完整固定记录保留精确消元与一圈截断的不同适用范围。\n\n<figure class="plot" markdown="1">\n![16点环的消元关系、配分函数常数、相关长度刻度、星图四体项、边缘流与热偏离的六面板图。](assets/img/asm-03-rg-ledgers.svg)\n<figcaption>图A是变量关系示意；图B恢复绝对配分函数；图C单独假定零场无限链。图D为孤立星图的完整展开。图E、F只解一圈截断方程，RG尺度不是动力学时间。</figcaption>\n</figure>\n\n<div class="rg186-static" role="region" tabindex="0" aria-label="RG固定记录，可横向滚动" markdown="1">\n\n| 预设 | 原始logZ | 恢复logZ | 星图四体系数 | 删项KL | ν一阶式 |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/rg-certificates/run-snapshot.json){download="rg-frozen-records.json"}。含全部矩阵幂、边缘概率、条件观测量、星图系数、扫描与截断ODE流点。固定记录没有把一圈近似升级为精确临界指数。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
