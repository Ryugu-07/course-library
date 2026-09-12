"""Fixed-record rendering only; no regeneration of observations."""
from pathlib import Path
import sys,json,subprocess,shutil,html
js,fixture,out,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code='''const a=require(process.argv[1]),fs=require('fs'),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),r=Object.fromEntries(f.records.map(v=>[v.key,v.data]));
const q=a.plots(r['quadratic-gap'])[0],e=a.plots(r['exponential-zero'])[0],o=a.plots(r.open)[0],w=a.plots(r.doublewell)[0],d=a.plots(r['dual-invalid'])[4];
e.xMin=-4;e.xMax=0;e.yMin=-.1;e.yMax=1.1;e.series.forEach(s=>s.points=s.points.filter(p=>p[0]>=-4&&p[0]<=0));
w.xMin=-1.5;w.xMax=1.5;w.yMin=-.1;w.yMax=1.8;w.title='双阱势垒与闭凸下松弛';w.series=[w.series[0],a.plots(r.doublewell)[1].series[0]];w.series.forEach(s=>s.points=s.points.filter(p=>Math.abs(p[0])<=1.5));
console.log(JSON.stringify([q,e,o,w,d].map(p=>a.svg(p))));'''
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
labels=['A · 二次函数：x=1，y=0；绿色竖段是间隙1/2','B · exp(x)，y=0；固定记录放大到−4≤x≤0，有限点始终没有接触','C · 开区间(0,1)，y=2；空心端点不属于原函数定义域','D · 四次双阱；固定记录放大到|x|≤1.5，包络抹去中间势垒','E · a=1，b=2，λ=1；候选y=2越界，合法对偶区间仅[−1,1]']
height=80+575*len(plots);parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{height}" viewBox="0 0 1000 {height}" role="img" aria-labelledby="title desc"><title id="title">支撑线、取得性与对偶可行性</title><desc id="desc">五组来自固定记录的对照，保留有限图窗说明和开端点，不把无穷改成大有限数。</desc><rect width="1000" height="{height}" fill="#fffdf7"/><g fill="#263442" color="#263442" font-family="system-ui,sans-serif"><text x="40" y="40" font-size="25">从支撑线读到一个可行证书</text>']
for i,(p,label)in enumerate(zip(plots,labels)):
 y=75+575*i;parts.append(f'<text x="45" y="{y+20}" font-size="16">{html.escape(label)}</text>');parts.append(p.replace('<svg ',f'<svg x="40" y="{y+45}" width="920" height="500" ',1))
out.write_text(''.join(parts)+'</g></svg>')
def fmt(v):return '+∞'if v=='+Infinity'else'−∞'if v=='-Infinity'else'是'if v is True else'否'if v is False else format(v,'.9g')if isinstance(v,(int,float))else str(v)
supportrows=[];dualrows=[]
for r in f['records']:
 s=r['data'];c=s['parameters'];v=s['current'];d=s['dual']['current']
 if not r['key'].startswith('dual-'):supportrows.append('| '+r['key']+' | '+' | '.join(fmt(x)for x in [c['x'],c['y'],v['f'],v['star'],v['gap'],v['attained']])+' |')
 else:dualrows.append('| '+r['key']+' | '+' | '.join(fmt(x)for x in [d['x'],d['y'],d['primal'],d['dualFeasible'],d['dual'],d['gap']])+' |')
text='**无脚本固定对照：**所有曲线与下表读取同一份固定记录。图中的局部放大只选择已有节点；不重新采样、不压平数值。\n\n<figure class="plot" markdown="1">\n![支撑间隙、未取得的指数上确界、开区间端点、双阱凸包络与对偶可行区间。](assets/img/cvx-01-fenchel-ledgers.svg)\n<figcaption>图 cvx-01.1：A的竖段是当前间隙，B的水平线0不在任何有限点接触指数函数，C空心点表示不含端点，D区分函数与松弛，E仅画可行对偶值。</figcaption>\n</figure>\n\n<div class="fenchel171-static" tabindex="0" role="region" aria-label="固定支撑读数，可横向滚动" markdown="1">\n\n| 对照 | x | y | f(x) | f*(y) | 间隙 | 上确界取得 |\n|---|---:|---:|---:|---:|---:|---|\n'+'\n'.join(supportrows)+'\n\n</div>\n\n<div class="fenchel171-static" tabindex="0" role="region" aria-label="固定对偶证书，可横向滚动" markdown="1">\n\n| 对照 | x | y | 原始值 | 对偶可行 | 正式对偶值 | 间隙 |\n|---|---:|---:|---:|---|---:|---:|\n'+'\n'.join(dualrows)+'\n\n</div>\n\n[下载六组完整固定记录](assets/learning/projects/fenchel-certificates/run-snapshot.json)。两个优化例均取a=1、b=2、λ=1；y=2的有限二次表达式不满足共轭有效域，不能充当对偶下界。\n'
md.write_text(text);print({'bytes':out.stat().st_size,'panels':len(plots),'rows':len(supportrows)+len(dualrows)})
