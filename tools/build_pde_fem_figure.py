"""Four native plots with the exact same numerical definitions as the experiment."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-pde-fem.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/comp-03-heat-balances.svg'
code="const a=require(process.argv[1]),s=a.snapshot({N:4,rule:'exact'}),f=a.snapshot({mode:'interface',TL:1,mesh:'uniform'}),r=a.snapshot({mode:'robin'});console.log(JSON.stringify([a.plots(s)[0],a.plots(s)[2],a.plots(f)[1],a.plots(r)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '4单元，解析载荷；蓝为真正正弦，橙为求解折线。节点重合，开单元内仍有差异。',
 '蓝为梯度L2、橙为函数L2、绿为节点L2；63种网格全部保留，零误差不被删去。',
 '界面0.45，κ左=1、κ右=0.2，16均匀单元；平均热流平衡，跨界单元局部热流跳变。',
 'κ=S=b=1，左端与环境温度0；左向外热流0.75、右0.25，总和等于体热源1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">有限元：温度、梯度和边界热量三张账</title><desc id="desc">正弦节点精确不代表函数精确；复合杆热流收支平衡不代表局部热流准确；Robin边界同时影响系统与热量。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">曲线算出来以后，逐项检查它解释了什么</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">所有量均无量纲化；温度加权恒等式与实际热功率守恒分别核对。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
