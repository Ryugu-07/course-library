"""Four native plots connecting distribution pairings, box approximation and Poisson solutions."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/weak-derivative.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/pde2-01-distribution-pairings.svg'
code="const a=require(process.argv[1]),k=a.snapshot(),b=a.snapshot({test:'odd'}),e=a.snapshot({mode:'box'}),f=a.snapshot({mode:'poisson'});console.log(JSON.stringify([a.plots(k)[0],a.plots(b)[1],a.plots(e)[0],a.plots(f)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '蓝：阶跃左右支；橙：普通导数0；绿：偶测试；跳点的 δ 由配对定义。',
 '固定奇测试形状，移动中心 m；蓝：δc 配对；橙：δc′ 配对。',
 '蓝：H；橙：连续斜坡 Hε；绿：测试；ε=0.1，最大误差仍为1/2。',
 '蓝：盒源的解 u；橙：u′；紫：附加直线，此处 A=B=0。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">分布：跳跃、测量与方程</title><desc id="desc">横轴为位置x或测试函数中心m。跳跃两侧分别连线；点质量以测试配对体现。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">把跳跃的变化交给测试函数，再用它求解方程</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">零配对可能只是一次测量不敏感；有限网格不是所有测试函数恒等式的证明。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
