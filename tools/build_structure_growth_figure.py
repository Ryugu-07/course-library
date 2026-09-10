"""Four native plots separating normalization, growth rate and transfer shape."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-structure-growth.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/cosmo-03-growth-ledgers.svg'
code="const a=require(process.argv[1]),g=a.snapshot(),t=a.snapshot({mode:'transfer'});console.log(JSON.stringify([...a.plots(g),a.plots(t)[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '蓝：G/a；橙：EdS 的1；固定相同早期振幅后比较增长。',
 '蓝：D=G/G(1)；橙：EdS 的a；今天归一化为1，纵轴为 log10 D。',
 '蓝：精确 f；橙：Ωm(a)^0.55；经验式不保证极端参数下的相对精度。',
 '蓝：log10 T；q=k/(13.41 keq)，keq=0.01 Mpc⁻¹；当前 k=0.1 Mpc⁻¹。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">结构增长：时间、归一化与尺度</title><desc id="desc">前三幅横轴为 log10 a，末幅为 log10 k。全部节点在交互账本中。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先固定比较基准，再区分时间增长与尺度处理</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="18">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">增长模型：Ωm=0.3、ΩΛ=0.7；无辐射。转移形状不替代完整早期宇宙求解。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
