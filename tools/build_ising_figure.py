"""Render stored observations only; never recompute the frozen model."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r.square2)[0],a.plots(r['two-sites'])[1],a.plots(r.chain16)[4],a.plots(r.trapped)[3],a.plots(r.square3)[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
labels=['A · 小方格也有明确的周期键：2×2保留八条键','B · 两点环：离散精确概率与有限轨迹频率分别显示','C · 有限环在r=N回到自身，无限链相关继续衰减','D · 低温轨迹可以困在正相；完整有限平衡均值仍为零','E · 有限绝对磁化、平均场选相和无限方格参考不是同一个平均']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="3220" viewBox="0 0 1000 3220" role="img" aria-labelledby="title desc"><title id="title">Ising模型的精确有限答案与实际抽样</title><desc id="desc">五面板展示2×2周期图、两点环磁化分布、一维有限与无限相关、低温保留轨迹和有限磁化与选相参考。</desc><rect width="1000" height="3220" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="42" font-size="25">先算完整分布，再判断一条轨迹回答了多少</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+625*i;out.append(f'<text x="40" y="{y+20}" font-size="16">{html.escape(label)}</text>');out.append(p.replace('<svg ',f'<svg x="40" y="{y+48}" width="920" height="552" ',1))
svg.write_text(''.join(out)+'</g></svg>');f=json.loads(fixture.read_text());rows=[]
def fmt(v):return '不适用'if v is None else format(v,'.9g')
for rec in f['records']:
 s=rec['data'];e=s['exact'];m=s['sample'];rows.append('| '+rec['key']+' | '+str(e['graph']['size'])+' | '+fmt(e['mean'])+' | '+fmt(e['absoluteMean'])+' | '+fmt(m['mean'])+' | '+fmt(e['heatCapacity'])+' |')
text='**无脚本对照：**下列图表来自六组固定完整记录。精确有限求和、有限轨迹、平均场与无限体系参考保留不同标签。\n\n<figure class="plot" markdown="1">\n![周期图、精确磁化分布、一维相关、低温轨迹以及有限磁化与选相参考的五面板对照。](assets/img/asm-02-ising-ledgers.svg)\n<figcaption>图A只显示真实最后样本；图B是离散概率。有限环相关在绕一周后回到1；低温轨迹的均值不必等于有限平衡均值。图E区分有限〈|m|〉、平均场稳定分支和无限方格零场正相。</figcaption>\n</figure>\n\n<div class="is185-static" role="region" tabindex="0" aria-label="Ising固定记录，可横向滚动" markdown="1">\n\n| 预设 | N | 精确〈m〉 | 精确〈绝对m〉 | 轨迹均值 | 精确每自旋C |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六组完整记录](assets/learning/projects/ising-certificates/run-snapshot.json){download="ising-frozen-records.json"}。包含全部态密度、矩阵幂、原始随机整数、逐次翻转、保留样本、扫描与平均场根。固定种子保证复现，不保证平衡或独立样本。\n'
md.write_text(text);print({'panels':len(plots),'rows':len(rows),'bytes':svg.stat().st_size})
