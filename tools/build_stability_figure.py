"""Render supplied observations only; do not recompute scientific records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r['odd-weak'])[0],a.plots(r['odd-weak'])[1],a.plots(r.default)[2],a.plots(r.fast)[3],a.plots(r.adaptive)[4],a.plots(r.default)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">稳定性、正则化与在线预测的三种保证</title><desc id="desc">六面板分别呈现全计数最优点、精确稳定性和一般证书、正则偏差、Hedge与OGD regret、自适应标签协议，以及合法在线损失与泄漏回算的差别。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">从一个样本的扰动，到逐轮预测的保证</text>']
names=['A · 奇数弱正则：计数跨过中点，最优输出能从−1跳到+1','B · 固定弱正则：精确邻居最大值与一般证书未必相等','C · 固定m和总体：正则增强，期望gap下降而超额风险可能上升','D · 大步长切换序列：Hedge与OGD各有自己的regret及上界','E · 自适应对手：看到当前分布后，再选择惩罚高权重专家的标签','F · 独立路径总体：合法风险与在线损失重合，泄漏回算不提供证明']
for i,(plot,name)in enumerate(zip(plots,names)):
 y=80+650*i;out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>')
 out.append(plot.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">邻居统一界、固定路径regret、独立抽样期望各有自己的量词；表中保留原界与完整记录。</text></g></svg>')
svg.write_text(''.join(out));f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];a=s['stability'];o=s['online']
 cells=[r['key'],str(s['parameters']['trainCount']),format(a['actualUniformBeta']['value'],'.9g'),format(a['expected']['gap']['value'],'.9g'),format(a['expected']['excess']['value'],'.9g'),format(o['regret'],'.9g'),format(o['bound'],'.9g')]
 rows.append('| '+' | '.join(cells)+' |')
text='**无脚本对照：**六份完整记录保存所有训练计数及邻居、逐轮在线损失与势函数、全部独立标签路径。稳定性部分的有理数精确保存；指数权重与对数使用数值近似。\n\n<figure class="plot" markdown="1">\n![全部计数最优点、统一稳定性、正则偏差、在线regret、自适应协议与独立抽样桥六面板图。](assets/img/slt-04-stability-certificates.svg)\n<figcaption>A 的橙圈是选定计数；B 的蓝点是全体邻居的最大敏感度；C 同时显示两种不同误差；D 比较同一固定基准；E 强调先预测后看标签；F 蓝点与绿色线重合，橙色泄漏损失不能用于泛化证明。</figcaption>\n</figure>\n\n<div class="stability190-static" role="region" tabindex="0" aria-label="稳定性固定记录，可横向滚动" markdown="1">\n\n| 预设 | m | 精确统一β | E gap | E超额风险 | Hedge regret | Hedge理论界 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/stability-certificates/run-snapshot.json){download="stability-frozen-records.json"}。每个总体概率的分子、分母和每轮预测时间顺序均保留。选择一行训练计数不会改变总体分布；固定在线序列也不能替代独立抽样实验。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
