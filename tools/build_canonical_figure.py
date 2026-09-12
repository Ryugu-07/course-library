"""Render stored finite-field observations, without recalculating records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.spacelike)[2],a.plots(r.spacelike)[3],a.plots(r.spacelike)[4],a.plots(r.top)[5],a.plots(r.product)[1]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 有限模式的等时核：积分为1，却只投影保留的频率','B · 固定t=0.8：光锥边界留空，有限截断仍有类空交换子','C · 同一有质量真空：W的实部、虚部与交换子分别读取','D · 独立六级振子：顶层CCR读数为−5，缺陷不是舍入误差','E · 三个实振子的积态：占据被纳入后，激发项不再随K增长']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">自由实场的模式、交换子与有限矩阵</title><desc id="desc">五面板由六组固定记录投影，展示等时傅里叶核、因果参考、真空相关、有限能级代数缺陷和零点激发分账。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">从有限模式走到场算符：每一步保留适用范围</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];e=s['energy'];p=s['probe'];l=s['ladder']['probe'];rows.append('| '+record['key']+' | '+str(e['modeCount'])+' | '+fmt(e['zeroPoint'])+' | '+fmt(e['excitation'])+' | '+fmt(p['C'])+' | '+fmt(p['continuum'])+' | '+fmt(l['commutator'])+' |')
text='**无脚本对照：**五图与六行读数来自同一份固定记录。模式、空间和时间扫描、逐模传播贡献及有限矩阵元均可下载。\n\n<figure class="plot" markdown="1">\n![等时投影核、有限截断与连续交换子、真空相关函数、有限振子最高层缺陷以及零点和激发能。](assets/img/qft-01-canonical-ledgers.svg)\n<figcaption>图 qft-01.1：K是场的空间模式截断，N是另一个单位振子的能级截断；图B在精确光锥边界断开连续参考，图D的顶层缺陷来自有限矩阵代数。无质量零模不设振子真空，表中的不适用不代表零。</figcaption>\n</figure>\n\n<div class="cf181-static" role="region" tabindex="0" aria-label="正则量子化固定记录，可横向滚动" markdown="1">\n\n| 预设 | 实模式数 | 完整E0 | 有效振子激发 | 当前有限C | 当前连续C | 检查层CCR |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/canonical-certificates/run-snapshot.json)。零模自由粒子的状态未指定；相关函数默认指有质量真空。有限K或N的计算不构成连续相互作用QFT的构造。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
