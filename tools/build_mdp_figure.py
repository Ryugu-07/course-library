"""Render only fixed observation projections; never resample or rerun solvers."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.budget)[0],a.plots(r.budget)[1],a.plots(r.budget)[2],a.plots(r.budget)[3],a.plots(r.budget)[4]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 默认γ=0.8：VI的第0行是初值，末值就是最后一行','B · PI：三次完整评估、两次策略改变，随后停止','C · LP：六对约束逐个求交点，再检查四项slack','D · B=1切出随机策略；圆点是完整策略或最优流，不是轨迹','E · 收益先按价格21/13增加，B≥35/22后不再增加']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">VI、PI、LP与资源预算的五组核对</title><desc id="desc">来自同一份六组固定记录。图C编号对应六组约束配对；图D为散点，不连接为时间路径。完整流量与对偶证书可下载。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">从价值更新走到可验证的资源分配</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];p=s['pi'];c=s['constrained'];rows.append('| '+record['key']+' | '+fmt(s['parameters']['gamma'])+' | '+str(s['parameters']['steps'])+' | '+('不适用'if p is None else str(len(p['rows'])))+' | '+fmt(None if s['lp']is None else s['lp']['best']['objective'])+' | '+fmt(None if c is None else c['best']['reward'])+' | '+fmt(None if c is None else c['best']['travel'])+' |')
text='**无脚本对照：**图和下表读取同一份六组固定记录；完整VI每轮、PI每次评估、六个LP交点和预算证书均在下载中。\n\n<figure class="plot" markdown="1">\n![同一营地矿区模型的VI完整路径、PI评估、六组LP交点、占用量散点和预算收益曲线。](assets/img/mdp-02-iteration-ledgers.svg)\n<figcaption>图 mdp-02.1：默认γ=0.8、初始分布各1/2。图C的六个编号按约束配对(0,1)、(0,2)、(0,3)、(1,2)、(1,3)、(2,3)排列；平行配对不画数值。图E折线连接实际预算采样点，不把离散扫描当作解析证明。</figcaption>\n</figure>\n\n<div class="mdp179-static" role="region" tabindex="0" aria-label="MDP固定记录，可横向滚动" markdown="1">\n\n| 预设 | γ | VI轮数 | PI评估次数 | 无约束目标 | 预算最优收益 | 实际远行占用 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/mdp-certificates/run-snapshot.json)。所有占用量未归一化；γ=1的无限时域量不适用。普通浮点差距和可行性容差保留在完整数据中，不是向外舍入认证。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
