"""Four native plots of Sobolev scaling, Moser concentration, Poincare and trace."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/sobolev-scaling.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/pde2-02-sobolev-budgets.svg'
code="const a=require(process.argv[1]),h=a.snapshot(),m=a.snapshot({mode:'moser',n:2}),p=a.snapshot({mode:'poincare'}),t=a.snapshot({mode:'trace'});console.log(JSON.stringify([h,m,p,t].map(d=>a.svg(a.plots(d)[1]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '帽：n=3，p=2；蓝q=2，绿q=6，橙q=8；向左收缩，梯度范数恒为1。',
 'Moser：n=p=2；蓝峰值增大，橙L2减小，绿梯度L2恒为1。',
 '零迹正弦：A=1，b=0；蓝与橙重合，绿是减均值后的范数。',
 '边界层：区间长度1；蓝L2减小，橙梯度增大，绿左端迹恒为1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">Sobolev：导数预算与四种控制</title><desc id="desc">四种函数族分别展示临界缩放、临界集中、零迹约束和边界层代价。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">导数受控之后：积分、峰值和边界仍需分别检验</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">图中有限范围不能证明无穷极限；同一条曲线也不能代替一般嵌入定理。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
