"""Render frozen observations without recomputing a trajectory."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.standard)[1],a.plots(r.standard)[2],a.plots(r['inconsistent-dual'])[3],a.plots(r.long)[0],a.plots(r.allzero)[0]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 同一轮三个目标：低于最优值的分裂目标尚未满足约束','B · 原始残差与对偶残差：分别检查一致性和驻点','C · 初始乘子不兼容：首步保留原值，残差平方界从第二步使用','D · 迭代到80步：真实小量与浮点零分开，不设置对数图地板','E · λ=4：PG与ADMM的可行点z始终为最优零点，对数间隙图为空']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">ADMM的一致性、目标与势函数</title><desc id="desc">五幅图直接读取六组冻结记录；零值不出现在对数坐标中。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">两个向量怎样重新成为一个解</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];v=s['admm'][-1];rows.append('| '+r['key']+' | '+str(v['k'])+' | '+' | '.join(format(v[k],'.9g')for k in ['objective','splitObjective','primalResidual','dualResidual','V'])+' |')
text='**无脚本对照：**五幅图与下表都来自同一份六组固定记录。表内统一为ADMM最后一行；完整下载同时包含PG和每一步中间量。\n\n<figure class="plot" markdown="1">\n![ADMM的可行目标与分裂目标、两种残差、首步条件和末位精度。](assets/img/cvx-03-splitting-ledgers.svg)\n<figcaption>图 cvx-03.1：A区分目标身份；B同时看两种残差；C保留未满足首步条件的诊断；D没有人为误差地板；E没有正间隙，因此保留空图。</figcaption>\n</figure>\n\n<div class="splitting173-static" role="region" tabindex="0" aria-label="ADMM固定记录，可横向滚动" markdown="1">\n\n| 预设 | 迭代 | 可行F(z) | 分裂目标 | 原始残差 | 对偶残差 | 势函数V |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整固定记录](assets/learning/projects/splitting-certificates/run-snapshot.json)。表内两个目标不同时拥有原始可行性；残差、间隙与乘子各有单独定义。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
