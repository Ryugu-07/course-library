"""Four panels generated from the model's complete displayed series."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/svd-perturbation.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/nla-01-stability-ledgers.svg'
code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({eta:2}))[1],a.plots(a.snapshot({second:2.95}))[4],a.plots(a.snapshot({mode:'qr',delta:1e-8,rho:1}))[2],a.plots(a.snapshot({mode:'backward',delta:1e-8}))[2]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '橙色特征值可以为负；蓝色奇异值始终非负，方向反转由左右向量承担。',
 '小间隙会使方向旋转；红点仅在分离条件成立时给出上界，缺失不是0。',
 '实际Q的正交缺陷：经典GS玫红、改良GS橙、Householder蓝；无绘图下限。',
 '共同改单位：前向误差玫红、后向误差蓝、只改b的后向误差绿，均无量纲。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">SVD、QR与后向误差</title><desc id="desc">区别符号、方向、正交性与相对误差。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先说清楚：哪一种误差变小了？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">图表共享实际运算与完整数值表；算法误差和问题敏感性分别解释。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
