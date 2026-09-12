"""Render already recorded observations; never recompute a trajectory."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.phase)[0],a.plots(r.phase)[2],a.plots(r.binary)[0],a.plots(r.order21)[0],a.plots(r.classical)[0]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 非二进制相位：最近频率格很可能出现，但不是每次必然出现','B · 固定y：每个复振幅贡献怎样累计；折线连接实际中间和','C · 正好落格：解析概率集中在一格，浮点求和的末位残差另存','D · N=21、a=2：不同余数分支内干涉，分支之间按概率相加','E · N=21、a=3：经典gcd先给出因子，不虚构量子测量分布']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">从相量到频率峰，再到可验证的因子</title><desc id="desc">五幅图读取六组固定记录；完整复振幅与后处理在下载中。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">让干涉的每一步都能复算</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for r in f['records']:
 s=r['data'];v=s['phase']or s['order'];rows.append('| '+r['key']+' | '+str(s['parameters']['bits'])+' | '+str(s['parameters']['y'])+' | '+fmt(v['totalProbability'])+' | '+fmt(v['normalizationDefect'])+' | '+fmt(v.get('nearestProbability'))+' | '+fmt(v.get('verifiedFactorProbability'))+' |')
text='**无脚本对照：**下列五图与六行表读取同一份固定记录。所选y只是查看条件分支，未进行抽样。\n\n<figure class="plot" markdown="1">\n![相位估计的频率峰、相量累计、精确落格、求阶分布与经典提前分支。](assets/img/qi-02-phase-ledgers.svg)\n<figcaption>图 qi-02.1：直接复振幅求和与解析参照分别保存；正交余数组之间按概率相加。空图意味着本次没有量子步骤。</figcaption>\n</figure>\n\n<div class="phase176-static" role="region" tabindex="0" aria-label="相位估计固定记录，可横向滚动" markdown="1">\n\n| 预设 | 控制位m | 所选y | 总概率 | 总概率−1 | 最近格总概率 | 当前策略因子成功概率 |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/phase-certificates/run-snapshot.json)。先得到公因子的分支没有量子分布，故概率项不适用；不能把“不适用”填成零。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
