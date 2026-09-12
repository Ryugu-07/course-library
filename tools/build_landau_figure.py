"""Render stored Landau observations; never recalculate data for the figure."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.coexistence)[0],a.plots(r.broken)[1],a.plots(r.coexistence)[2],a.plots(r.broken)[3],a.plots(r['near-critical'])[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 三个等深极小：曲率与低谷宽度仍不相同','B · 有限体积零场双峰：均值为零，绝对值均值非零','C · 温度分支用散点表示，共存处不跨接成连续轨道','D · 两峰间重分配产生的有限体积响应，区别于单相局部响应','E · 三维 Gaussian 自洽比：四次线与三临界线的幂次不同']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">地形、有限体积概率与空间涨落</title><desc id="desc">五面板展示六次Landau多项式的等深低谷、有限体积概率分布、温度驻点分支、体积响应和两条临界线的Gaussian自洽指标。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">从局部极小到概率平均，再检查被忽略的涨落</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return'不适用'if v is None else format(v,'.9g')
for record in f['records']:
 s=record['data'];v=s['finite'];g=s['gaussian'];rows.append('| '+record['key']+' | '+fmt(v['mean'])+' | '+fmt(v['absoluteMean'])+' | '+fmt(v['susceptibility'])+' | '+fmt(v['binder'])+' | '+fmt(g['xi'])+' |')
text='**无脚本对照：**五图与六组记录使用同一份固定数据。前四图是连续序参量模型，第五图是明确动量窗口下的 Gaussian 自洽比较。\n\n<figure class="plot" markdown="1">\n![等深自由能、有限体积双峰、温度驻点分支、体积响应和三维临界自洽比。](assets/img/asm-01-landau-ledgers.svg)\n<figcaption>等深不等于等宽；有限体积均值不等于选相极小。温度分支为独立散点，体积横轴取 log₂V；自洽比双轴取 log₁₀。三临界线在三维的零幂次仍需考虑边缘耦合。</figcaption>\n</figure>\n\n<div class="ld184-static" role="region" tabindex="0" aria-label="Landau固定记录，可横向滚动" markdown="1">\n\n| 预设 | 均值 | 绝对值均值 | 有限χ | Binder U₄ | 选相Gaussian ξ |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/landau-certificates/run-snapshot.json){download="landau-frozen-records.json"}（约25 MB JSON）。包含全部驻点、积分叶区间、尾界、体积/外场扫描与Gaussian维数比较。浮点下溢不是严格零；积分误差为估计。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
