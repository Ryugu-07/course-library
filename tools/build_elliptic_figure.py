"""Four native plots of resonance, finite element assembly, convergence and corners."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/elliptic-coercivity.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/pde2-03-elliptic-ledgers.svg'
code="const a=require(process.argv[1]),s=a.snapshot({mu:-1}),f=a.snapshot({mode:'fem'}),c=a.snapshot({mode:'corner'});console.log(JSON.stringify([a.plots(s)[0],a.plots(f)[0],a.plots(f)[1],a.plots(c)[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 'μ=−1：第一谱比为0，是否有解还要看第一强迫系数。',
 '8个均匀单元；蓝精确抛物线，橙由真实刚度装配得到的P1解。',
 '均匀网格；蓝梯度误差一阶，橙函数误差二阶，本例有精确积分。',
 '蓝凸角、绿平角、橙凹角、紫当前角；平角是Hessian恒0的特殊值。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">椭圆弱解：从相容性到误差与角点</title><desc id="desc">谱比检查共振，一维有限元实际装配并核对误差，角点显示二阶正则性的边界。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">弱解怎样存在，近似怎样收敛，光滑性在哪里停下</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">有限矩阵成功不保证全问题可解；内正则性不自动跨过边界角点。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
