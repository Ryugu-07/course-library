"""Four reproducible mechanism diagrams; no empirical spectral-limit claim."""
from pathlib import Path
import json,subprocess,shutil,sys,html
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/random-matrix-norm.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/hdp-03-net-ledgers.svg'
code="""const a=require(process.argv[1]);let d=a.snapshot(),h=a.snapshot({mode:'matrix',preset:'hole',m:2,n:4}),b=a.snapshot({mode:'matrix',preset:'blind',m:2,n:2,start:'axis'});console.log(JSON.stringify({plots:[...a.plots(d),a.plots(h)[1],a.plots(b)[0]],svgs:[...a.plots(d),a.plots(h)[1],a.plots(b)[0]].map(a.svg)}));"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
    's₁=4，s₂=1，θ=17°，N=16；最大角距离11.25°；红弦长度ε≈0.196034。',
    '蓝：完整响应；橙：网点读数；紫：范数4；绿：二维上界。一般上界见正文。',
    'A第一行为(1,1,1,1)/2，第二行为零；橙色最高仅1/√2，紫色范数为1。',
    'A=diag(1,2)，初始e₁：蓝色始终为1、残差为0，紫色真正范数为2。'
]
offsets=[100,760,1270,1780]
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2290" viewBox="0 0 1000 2290" role="img" aria-labelledby="title desc"><title id="title">ε-网的覆盖证书与两个算法反例</title><desc id="desc">四幅完整坐标图：等角圆网、矩阵方向响应、四维遗漏与幂迭代盲点。每个节点均来自公开实验模型，全部数值表在正文可查。</desc><rect width="1000" height="2290" fill="#faf7ef"/><g color="#253346" fill="#253346" font-family="system-ui,sans-serif"><text x="40" y="50" font-size="28">扫描之后，还需要什么证据？</text>']
for i,(svg,y,note)in enumerate(zip(d['svgs'],offsets,notes)):
    svg=svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1)
    parts.append(svg)
    texty=[705,1205,1715,2225][i]
    parts.append(f'<text x="40" y="{texty}" font-size="19">{html.escape(note)}</text>')
parts.append('</g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(parts));print(OUT)
