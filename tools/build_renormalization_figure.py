"""Render only stored renormalization observations, without recalculating them."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.gaussian)[0],a.plots(r['high-q'])[2],a.plots(r['high-q'])[3],a.plots(r.threshold)[4],a.plots(r.pole)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 明确的两种测度：完整Gaussian与均值为零的约束Gaussian','B · 同一截断下计算两个泡图，保留共同的紫外变化','C · 在Q0=1调整裸参数后，离壳顶点接近有限减法极限','D · MOM的质量阈值与MS系数：不同方案分别显示','E · MS单圈流：极点及其右侧不属于当前初值解']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">Gaussian、实际泡图与尺度变化</title><desc id="desc">五面板展示有限格点的两种协方差、指定截断下的泡积分、调参后的离壳顶点、质量阈值以及仅定义在连通分支的单圈RG解。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">从明确的积分到明确的重整化条件</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];g=s['gaussian'];l=s['loop'];rows.append('| '+record['key']+' | '+fmt(g['logZ'])+' | '+fmt(g['schur']['totalLogZ'])+' | '+fmt(l['selected']['value'])+' | '+fmt(l['renormalized']['value'])+' | '+fmt(l['mom']['value'])+' | '+fmt(l['pole'])+' |')
text='**无脚本对照：**五图和六组记录来自同一份固定数据。图A是有限格点，图B–E是四维φ⁴单圈模型；外动量Q是Euclidean对称点变量。\n\n<figure class="plot" markdown="1">\n![完整Gaussian与零均值约束的协方差、泡图截断、有限减法顶点、MOM阈值和单圈RG连通分支。](assets/img/qft-03-renormalization-ledgers.svg)\n<figcaption>零模、红外发散和极点是不同边界。完整测度未定义的格点参数留空；离壳顶点不是实验截面；极点后的代数负值不接入初值解。RG纵轴采用log₁₀(1+g)。</figcaption>\n</figure>\n\n<div class="pr183-static" role="region" tabindex="0" aria-label="路径积分与重整化固定记录，可横向滚动" markdown="1">\n\n| 预设 | 完整log Z | 消元后log Z | BΛ(Q) | B_R(Q) | MOM阈值因子 | 单圈极点ℓ |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/renormalization-certificates/run-snapshot.json)。记录包含所有矩阵元、Fourier求和项、Schur消元、积分子区间及截断/动量/RG扫描；自适应误差是数值估计，不是严格包围。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
