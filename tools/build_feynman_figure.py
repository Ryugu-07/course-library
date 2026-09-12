"""Render stored Feynman observations; never recompute experiment records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.tree)[0],a.plots(r['fish-s'])[0],a.plots(r['fish-s'])[1],a.plots(r.tree)[3],a.plots(r.threshold)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 树图：外部场分别接到一个顶点的四槽，重数24抵消4!','B · 鱼图：同一通道576个缩并，Dyson分母1152，留下1/2','C · 两顶点四外部场的全部分类：图的系数不等于全部振幅','D · 零维λ=0.2：有限阶误差先减小，增加阶数并非无限改善','E · 同种标量树级总截面：精确阈值留空，上阈值极限单独标记']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">从Wick缩并到费曼因子与截面</title><desc id="desc">五面板展示完整配对生成的树图和鱼图、全部拓扑计数、零维渐近误差以及同种末态的树级阈值截面。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">一张图背后的缩并、因子与适用边界</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];q=s['selected'];rows.append('| '+record['key']+' | '+str(s['wick']['total'])+' | '+str(s['wick']['denominator'])+' | '+q['category']+' | '+str(q['vacuumComponents'])+' | '+fmt(s['zeroDimension']['integral']['value'])+' | '+fmt(s['scattering']['total'])+' |')
text='**无脚本对照：**五图与六行数据来自同一份固定记录。完整缩并、形式级数归一化、数值积分子区间和四动量均可下载。\n\n<figure class="plot" markdown="1">\n![实际编号槽配对形成的树图、鱼图，以及完整拓扑系数、零维渐近误差和阈值截面。](assets/img/qft-02-feynman-ledgers.svg)\n<figcaption>蓝线至少连一个外部场，橙线只连内部槽；线的交叉不增加顶点。图D是零维Gaussian积分，图E是四维同质量树级散射，不是同一个可观测量。阈值空心点只表示极限。</figcaption>\n</figure>\n\n<div class="fy182-static" role="region" tabindex="0" aria-label="费曼图固定记录，可横向滚动" markdown="1">\n\n| 预设 | 完整配对数 | Dyson分母 | 当前分类 | 真空分量数 | 零维Z数值 | 同种树级总σ |\n|---|---:|---:|---|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/feynman-certificates/run-snapshot.json)。数值积分的误差估计不是严格证书；余项界由正文Taylor积分公式证明。自缩并计数不消除连续场论的紫外发散。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
