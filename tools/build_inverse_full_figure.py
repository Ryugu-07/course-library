"""Four explanatory panels; all plotted points come from the audited model."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-inverse-uncertainty.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/comp-05-inverse-ledgers.svg'
code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({mode:'contrast',transmission:0}))[1],a.plots(a.snapshot({}))[0],a.plots(a.snapshot({}))[1],a.plots(a.snapshot({mode:'risk'}))[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 'κ=0时，左右源的平均相同即可产生同一读数；增加数值精度无法分开。',
 '源空间：蓝真值、橙后验均值、绿逐点后验界限；不是同时覆盖带。',
 '红点是固定观测；绿界限传播参数方差，蓝界限还加入一次新测量噪声。',
 '偏差²（橙）+抽样方差（蓝）=MSE（玫红）；条件后验方差（绿）另列。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">逆问题：可辨识性与不确定度</title><desc id="desc">零空间、源重建、参数与预测区间以及重复实验风险。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">拟合得好，源也一定重建对了吗？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定观测，分开检查数据分辨率、先验、数值误差和模型误设。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
