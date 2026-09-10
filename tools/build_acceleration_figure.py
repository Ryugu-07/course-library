"""Four native plots connecting acceleration, light paths, scalar dynamics and late backgrounds."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-inflation-darkenergy.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/cosmo-04-acceleration-ledgers.svg'
code="const a=require(process.argv[1]),k=a.snapshot(),f=a.snapshot({mode:'field'}),l=a.snapshot({mode:'late'});console.log(JSON.stringify([a.plots(k)[1],a.plots(f)[0],a.plots(f)[1],a.plots(l)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '蓝：共动哈勃半径；橙：log10(1+光程比)；绿：H/H初始；常 εH=0。',
 '初始 u=φ/Mpl=15、v=0；完整背景方程，积分至首次 εH=1。',
 '蓝：εH；橙：εV；绿：加速边界1；退出附近慢滚估计失效。',
 '蓝：q；橙：εH；Ωm=0.3、w=−1；加速开始先于两种密度相等。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">加速宇宙：尺度、场与两种时代</title><desc id="desc">前三幅横轴为从开始经过的N，末幅为log10 a。所有实际节点可复算。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">加速判据之后，继续计算场怎样动、何时退出</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">二次势只作动力学教学；背景退出不等于完成再热，常 w 背景不唯一确定机制。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
