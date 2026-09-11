"""Build four fixed exact-evidence panels; no fresh numerical experiment."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/galois-insolvability.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/alg2-03-insolvability-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/galois-insolvability/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([['insufficient',1],['nonsolvable',2],['binomial',3],['alternating',0]].map(([k,i])=>a.svg(a.plots(f[k])[i]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['只启用p=2：四循环无法区分可解F₂₀与不可解S₅。','精确隔离出三个实根：复共轭为对换，结合不可约性推出S₅。','x⁵−2的五根在二十次根式域中；实际自同构群为可解F₂₀。','x⁵+20x+16：判别式为平方且出现三循环，群为不可解A₅。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2300" viewBox="0 0 1000 2300" role="img" aria-labelledby="title desc"><title id="title">五次方程：从证据不足到可解性证明</title><desc id="desc">候选筛选、精确实根隔离、根式构造与A5反例的四份固定记录。</desc><rect width="1000" height="2300" fill="#faf7ef"/><g fill="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">每一条证据，都要说明它排除了什么</text>']
for svg,y,note in zip(svgs,[85,640,1195,1750],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+490}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2280" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；全部分数、因子与群运算可下载。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['insufficient'];b=f['nonsolvable'];c=f['binomial'];d=f['alternating']
 values=[a['polynomial']['degree'],'、'.join(a['classification']['remaining']),'证据不足'if a['classification']['solvable']is None else'已确定',b['polynomial']['real']['rootCount'],b['polynomial']['real']['leftVariation'],b['polynomial']['real']['rightVariation'],b['polynomial']['discriminant']['value'],b['classification']['exactGroup'],'否'if not b['classification']['solvable']else'是',c['polynomial']['construction']['ambientDegree'],len(c['polynomial']['construction']['roots']),c['classification']['exactGroup'],'是'if c['classification']['solvable']else'否',d['polynomial']['discriminant']['value'],d['polynomial']['discriminant']['square']['root'],d['classification']['exactGroup'],'否'if not d['classification']['solvable']else'是']
 labels=['只用p=2时多项式次数','只用p=2时保留的全部候选','只用p=2时根式结论','默认例不同实根个数','默认例V(−∞)','默认例V(+∞)','默认例判别式','默认例确定群','默认例是否根式可解','x⁵−2所有根所在域次数','x⁵−2实际构造的不同根数','x⁵−2确定群','x⁵−2是否根式可解','A₅例判别式','A₅例判别式的正平方根','A₅例确定群','A₅例是否根式可解']
 for i,j in enumerate(b['polynomial']['real']['leaves']):
  t=b['polynomial']['real']['nodes'][j];labels.append('默认例实根'+str(i+1)+'隔离区间（左不含右含）');values.append('('+t['left']+', '+t['right']+']')
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载四份完整精确记录](assets/learning/projects/galois-insolvability/run-snapshot.json)。默认例为x⁵−6x+3，精度8位；“证据不足”例仅启用p=2，关闭其余证据；根式例为x⁵−2；A₅例为x⁵+20x+16，显示p=7分解。默认、根式与A₅例均启用p=2,3,5,7,11、实根、判别式与范围内的显式构造。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+str(v)+' |\n'for label,v in zip(labels,values));table+='\n无脚本也可比较第一组的两个候选与第三组的实际根式构造。根区间提供误差界，不能将其误称为根式公式；坏素数的重复因子不能直接作Frobenius证据。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
