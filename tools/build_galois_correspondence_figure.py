"""Build the static Galois panels from fixed exact records."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/galois-correspondence.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/alg2-02-galois-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/galois-correspondence/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([['biquadratic',0],['cubic',1],['finite',3],['nonnormal',2]].map(([k,i])=>a.svg(a.plots(f[k])[i]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['双二次域：H固定的操作越多，K中保留的独立坐标越少。','三次分裂域：复共轭的固定基为1、α、α²，得到Q(α)。','F₆₄：Frobenius生成六阶循环群；表中编号k表示Frob的k次幂。','非正规Q(∛2)：三个共轭根中只有一个留在原域，不能套用次数等于群阶。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2300" viewBox="0 0 1000 2300" role="img" aria-labelledby="title desc"><title id="title">Galois对应与固定域的四个精确对照</title><desc id="desc">双二次对应、三次固定基、有限域Frobenius以及非正规反例。</desc><rect width="1000" height="2300" fill="#faf7ef"/><g fill="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">从根的移动，算出哪些数保持不动</text>']
for svg,y,note in zip(svgs,[85,640,1195,1750],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+490}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2280" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；完整基、矩阵与运算见下载记录。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['biquadratic'];b=f['cubic'];c=f['finite'];d=f['nonnormal']
 values=[a['base']['degree'],a['base']['group']['order'],a['selected']['order'],a['selected']['fixedDimension'],a['element']['minimalPolynomial']['degree'],a['element']['trace'],a['element']['norm'],b['base']['degree'],b['selected']['order'],b['selected']['fixedDimension'],'是'if b['selected']['normal']else'否',b['element']['trace'],b['element']['norm'],c['base']['prime']**c['base']['degree'],c['base']['group']['order'],c['selected']['order'],c['selected']['fixedDimension'],c['base']['prime']**c['selected']['fixedDimension'],d['base']['degree'],d['base']['group']['order'],d['element']['minimalPolynomial']['degree'],len(d['element']['orbit']),'是'if d['element']['orbitPolynomialOverBase']else'否']
 labels=['双二次域的次数','双二次自同构群的阶','双二次所选H的阶','双二次固定域维数','√2+√3的极小次数','√2+√3相对Q的迹','√2+√3相对Q的范数','三次分裂域的次数','复共轭子群的阶','复共轭固定域维数','复共轭子群是否正规','α在六次分裂域中相对Q的迹','α在六次分裂域中相对Q的范数','有限域元素个数','有限域自同构群阶','Frob²生成的H的阶','Frob²固定域相对F₂的维数','Frob²固定域元素个数','非正规Q(α)的次数','非正规Q(α)的自同构群阶','非正规Q(α)中α的极小次数','非正规Q(α)中α的自同构轨道大小','非正规例的轨道多项式系数是否全在Q中']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载四份完整域运算、自同构与固定基记录](assets/learning/projects/galois-correspondence/run-snapshot.json)。双二次域选u=√2+√3、H只改变√2号；三次分裂域选u=α、H为复共轭；有限域采用F₂[t]/(1+t+t⁶)、u=t、H=〈Frob²〉；非正规例为Q(α)/Q、u=α、H平凡。α均指实立方根∛2。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+str(v)+' |\n'for label,v in zip(labels,values));table+='\n非正规例的域内轨道多项式是T−α，其系数不全在Q中；极小多项式仍为T³−2。这里没有把两个多项式混同。三次分裂域中的α范数为4，而在三次实域中相对Q的范数为2。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
