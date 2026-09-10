"""Native FRW mechanisms, all plotted nodes retained."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/cosmological-horizons.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/cosmo-01-frw-ledgers.svg'
code="""const a=require(process.argv[1]),b=a.snapshot(),d=a.snapshot({mode:'distance'}),p=a.snapshot({mode:'photon'});console.log(JSON.stringify([a.plots(b)[0],a.plots(b)[1],a.plots(d)[1],a.plots(p)[0]].map(a.svg)))"""
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '蓝 DH、橙 Dp、绿 De；默认 Ωr=0.0001、Ωm=0.2999、ΩΛ=0.7。',
 '蓝辐射、橙物质、绿 Λ；分数随 a 改变，每个时刻之和为1。',
 '单独展示 DA，避免被大得多的 DL 压平；三种距离的完整对照在交互实验中。',
 '蓝光子 D、橙 DH；a_emit=1/4、β=2，a_turn=4/9，a_arrival=1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">FRW：从密度到光路</title><desc id="desc">三种半径、密度交接、红移距离和 Hubble 半径外的来光。全曲线节点对应实验账本；默认只是教学参数。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先列膨胀账本，再沿一束光走</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">半径图为双对数坐标；发散量不画成零。其余定义、单位、完整证明见正文。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
