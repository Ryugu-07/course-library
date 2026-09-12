"""Render fixed observations; never resample Newton steps or matrix paths."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.normal)[0],a.plots(r.near)[1],a.plots(r.one)[2],a.plots(r.normal)[4],a.plots(r.normal)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 独立三角形中心参照与默认Newton轨迹：参考曲线不是迭代结果','B · 从x₁=10⁻¹⁰出发：保留实际Newton步，靠近边界不等于不可解','C · 只做一步：候选数值差未认证；合法证书与中心3/t分别标明','D · 独立2×2 SDP：最小本征值趋零，有限t的矩阵仍然正定','E · 同一SDP：原始次优性和原始–对偶间隙是两个量']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">内部点、中心路径与矩阵精度证书</title><desc id="desc">五幅图读取六组冻结记录；独立参考模型与真实Newton运行分别标明。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">内部、中心与可验证的间隙</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
names={'converged':'达到数值容差','max-steps':'步数耗尽','no-strict-feasible-point':'无严格内部','not-strict-feasible-start':'初值不合法'}
def fmt(v):return '无LP终点'if v is None else format(v,'.9g')
for r in f['records']:
 s=r['data'];lp=s['lp'];c=lp['certificate'];rows.append('| '+r['key']+' | '+names.get(lp['status'],lp['status'])+' | '+str(len(lp['rows']))+' | '+' | '.join([fmt(c['candidateGap']if c else None),fmt(c['certifiedGap']if c else None),fmt(s['sdp']['gap'])])+' |')
text='**无脚本对照：**图表读取同一份六组固定记录。LP失败行不会填入一个虚构中心点；最后一列属于另一个已明确说明的二阶SDP模型。\n\n<figure class="plot" markdown="1">\n![三角形中心参照与Newton轨迹、近边界运行、有限步证书和二阶SDP的本征值及间隙。](assets/img/cvx-04-interior-ledgers.svg)\n<figcaption>图 cvx-04.1：A区分参照与迭代；B保留近边界求解；C不冒充精确中心；D与E把标量互补迁移到矩阵互补。</figcaption>\n</figure>\n\n<div class="interior174-static" role="region" tabindex="0" aria-label="内点法固定记录，可横向滚动" markdown="1">\n\n| 预设 | LP状态 | 接受步数 | 候选数值差（未认证） | 合法LP证书 | 独立SDP间隙 |\n|---|---|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整固定记录](assets/learning/projects/interior-certificates/run-snapshot.json)。记录包含所有Newton候选、标量根浮点区间和完整SDP矩阵；它不是严格区间算术证书。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
