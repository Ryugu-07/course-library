"""Read frozen observations; never resample or recompute a trajectory."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.safe)[1],a.plots(r.safe)[4],a.plots(r.long)[1],a.plots(r.stationary)[1],a.plots(r.unstable)[1]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));labels=['A · 标准步长：FISTA可以局部回升，最坏情形速率不等于逐步排名','B · 证明真正控制的势函数；四条曲线各自除以对应的初始半径平方','C · 同一问题迭代到80步：稳定公式保留低于10⁻⁸的读数，不设地板','D · 从复合最优点出发：全部间隙为0，对数图没有可画的正值','E · αL=2.5：保留不稳定轨迹的实际对数值，通用界已经撤下']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">一阶方法的间隙与势函数</title><desc id="desc">五幅图读取冻结记录；对数图在非正读数处断开，空图保留空图。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">曲线、证明与浮点末位</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return format(v,'.9g')
for r in f['records']:
 m=r['data']['methods'][2];v=m['rows'][-1];rows.append('| '+r['key']+' | '+' | '.join([str(v['k']),fmt(m['alpha']),fmt(v['rawGap']),fmt(v['gap']),fmt(v['mappingNorm']),'是'if v['stepValid']else'否'])+' |')
text='**无脚本对照：**下图与表读取同一份六组固定记录。表中统一报告 PG 的最后一行，避免混用目标。\n\n<figure class="plot" markdown="1">\n![一阶方法的有限轨迹、势函数、末位误差和空对数图。](assets/img/cvx-02-first-order-ledgers.svg)\n<figcaption>图 cvx-02.1：A比较同一目标，B检查证明中的组合量；C保留真实小数，D没有正值所以为空，E展示失去标准保证后的诊断。</figcaption>\n</figure>\n\n<div class="firstorder172-static" role="region" tabindex="0" aria-label="PG固定记录，可横向滚动" markdown="1">\n\n| 预设 | 迭代 | α | 原始相减间隙 | 稳定间隙 | 映射范数 | 标准步长 |\n|---|---:|---:|---:|---:|---:|---|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整固定记录](assets/learning/projects/first-order-certificates/run-snapshot.json)。稳定间隙与直接相减的不同不是更换目标，而是同一代数表达式采用不同数值计算方式。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
