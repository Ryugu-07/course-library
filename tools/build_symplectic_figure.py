"""Four explanatory plots with equal physical axis scales in the phase panel."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-symplectic-integrator.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/comp-02-symplectic-ledgers.svg'
code="const a=require(process.argv[1]),v=a.snapshot({}),m=a.snapshot({method:'midpoint'}),b=a.snapshot({h:2,p0:.1,steps:32}),g=a.snapshot({mode:'geometry'});console.log(JSON.stringify([a.plots(v)[1],a.plots(m)[2],a.plots(b)[0],a.plots(g)[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 'Verlet h=0.2：原能量变化（橙）有界；精确离散二次不变量（绿）只剩舍入残差。',
 '隐式中点法同样h=0.2：谐振子能量可精确保住，相对解析解的相点误差仍增长。',
 'Verlet h=2，初值(1,0.1)：根都为−1，Jordan剪切仍使一般初值的轨道增长。',
 'h(q)=0.5(1+0.5q)：每一步沿精确能量圆走，局部面积却在0.75与1.25之间变化。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">辛积分：能量、相位、稳定与几何</title><desc id="desc">分开核对四种结论：离散不变量、相位精度、Jordan边界和状态依赖步长的面积变化。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">能量没有跑掉，轨道就一定可信吗？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">相图横纵采用相同单位长度；图示是有限数值证据，适用条件由正文说明。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
