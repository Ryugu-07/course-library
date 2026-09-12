"""Read fixed observations and render views without recalculating trajectories."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.switch)[0],a.plots(r.patient)[1],a.plots(r.switch)[2],a.plots(r.alternating)[3],a.plots(r.tie)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · γ=0.8：两个状态的价值逐轮更新','B · γ=0.99：曲线看起来平，不等于已经满足精度','C · 策略损失可以先归零，价值仍在移动','D · 人为有界扰动：实际偏离与可证明的几何和','E · γ=5/8：两动作并列，最优价值仍唯一']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">Bellman价值、策略与误差的五组对照</title><desc id="desc">读取六组固定记录，线性坐标保留零值。完整每轮与每个动作在下载中。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">知道下一步怎么选，也知道还差多少</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];r=s['rows'][-1];rows.append('| '+record['key']+' | '+fmt(s['parameters']['gamma'])+' | '+str(r['k'])+' | '+fmt(r['error'])+' | '+fmt(r['residualBound'])+' | '+fmt(r['policyLoss'])+' | '+fmt(r['policyBound'])+' |')
text='**无脚本对照：**五幅图和六行末轮读数来自同一份固定记录。价值误差与策略损失分别计算。\n\n<figure class="plot" markdown="1">\n![Bellman迭代的价值、残差误差界、策略损失、扰动累积与折现切换点。](assets/img/mdp-01-bellman-ledgers.svg)\n<figcaption>图 mdp-01.1：线性坐标未对零值作log截断。图E只连接实际扫描点，γ=1没有有限折现最优价值。</figcaption>\n</figure>\n\n<div class="bellman178-static" role="region" tabindex="0" aria-label="Bellman固定记录，可横向滚动" markdown="1">\n\n| 预设 | γ | 轮数 | 真误差 | 残差界 | 策略损失 | 策略损失界 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/bellman-certificates/run-snapshot.json)。γ=1的无限时域量不适用；双精度末位差仍保留在完整数据中，数学界未作向外舍入认证。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
