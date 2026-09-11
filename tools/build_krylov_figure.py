"""Render a fixed, independently validated Krylov run, not a new floating-point run."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/cg-spectrum.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/nla-03-krylov-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/krylov-methods/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.cg)[0],a.plots(f.rise)[5],a.plots(f.rotation)[4],a.plots(f.weighted)[4]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '均匀谱κ=25：CG蓝、PCG橙；精确算术界绿、玫红。界不含浮点舍入保证。',
 '二维反例：真残差蓝/橙线首步升至4.95；A误差绿/玫红点下降。线性刻度。',
 '二维旋转：完整GMRES绿线两步到零；重启蓝、左玫红、右橙持续停滞。',
 '左预条件：原始残差玫红线，加权目标紫点；各按自身初值归一。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">Krylov方法的能量、真实残差与重启</title><desc id="desc">四个固定运行展示CG区间界、残差上升、GMRES重启停滞与左右预条件的不同最小化目标。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先读纵轴，再判断算法是否进步</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">快照：2026-09-11，Node 24.14.0 / arm64；交互使用当前浏览器运算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());rows=[]
 for m in f['cg']['result']['methods']:
  label='CG'if m['id']=='cg'else'PCG'
  rows.extend([(label+'末步数',m['final']['k']),(label+'末步归一A误差',m['final']['relativeAError']),(label+'末步相对真残差',m['final']['relativeResidual'])])
 r=f['rise']['result']['methods'][0]['rows'][1]
 rows.extend([('二维CG首步α',f['rise']['result']['methods'][0]['records'][0]['alpha']),('二维CG首步相对真残差',r['relativeResidual']),('二维CG首步归一A误差',r['relativeAError']),('二维CG首步rho',r['rho'])])
 for m in f['rotation']['result']['methods'][:2]:
  label='完整GMRES'if m['id']=='full'else'GMRES(1)'
  rows.extend([(label+'实际步数',m['final']['k']),(label+'末步相对真残差',m['final']['relativeResidual'])])
 m=f['weighted']['result']['methods'][2]
 for k in [1,3]:rows.extend([(f'左预条件第{k}步原始相对残差',m['rows'][k]['relativeResidual']),(f'左预条件第{k}步加权相对残差',m['rows'][k]['relativeWeighted'])])
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载完整参数、向量与运算记录](assets/learning/projects/krylov-methods/run-snapshot.json)。CG采用默认均匀谱κ=25和透明分组M；残差反例为diag(1,100)；旋转采用重启长度1；加权反例采用六维Grcar族γ=0、M对角从1到100、重启长度1。均为零初值、共同尺度1、24步预算与10⁻¹²原始相对残差阈值。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n默认CG、PCG均按真实残差达到阈值停止；旋转的完整GMRES浮点真残差为0，GMRES(1)预算结束且相对残差仍为1。左预条件反例的目标下降不替代原始残差验收。这里的浮点零不是精确算术证明。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
