"""Four explanatory panels; all plotted points come from the audited model."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/monte-carlo-md.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/comp-01-sampling-ledgers.svg'
code="const a=require(process.argv[1]),v=a.snapshot({mode:'integration'}),c=a.snapshot({}),n=a.snapshot({proposal:.9}),e=a.snapshot({mode:'ensemble'});console.log(JSON.stringify([a.plots(v)[3],a.plots(c)[2],a.plots(n)[3],a.plots(e)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 'x²的一维积分：普通MC（蓝）与分层MC（橙）的理想标准误，全部N=1..256。',
 '正相关链：平稳理论ACF（蓝）与本次经验诊断（橙）；曲线不能混用。',
 '负相关链：完整有限均值概率分布；竖线仅标出本次伪随机样本均值。',
 '固定E的圆（绿）与时间观测（橙），正则相点云（蓝）访问不同能量。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">随机计算：估计对象、相关性与系综</title><desc id="desc">分层方差、理论与经验相关、完整均值分布和两种谐振子测度的对照。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">很多读数，究竟在估计哪个平均？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">概率模型给出参考答案；固定seed只给出一次可重放的伪随机实现。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
