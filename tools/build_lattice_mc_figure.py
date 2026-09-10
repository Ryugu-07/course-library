"""Four explanatory panels; all plotted points come from the audited model."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-lattice-monte-carlo.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/comp-04-lattice-ledgers.svg'
code="const a=require(process.argv[1]);console.log(JSON.stringify([a.plots(a.snapshot({mode:'exact'}))[1],a.plots(a.snapshot({}))[1],a.plots(a.snapshot({}))[2],a.plots(a.snapshot({mode:'finite'}))[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
notes=[
 '零场磁化的完整概率：正负对称，并不意味着每个构型都没有磁化。',
 '同L、T、h：完整枚举的目标（绿）与本次短链运行均值（橙）。',
 '全部经验ACF：长滞后噪声与中心化约束不能直接充当误差条。',
 '两个小格点的精确比热；竖线是已知无限零场Tc，不是这两条曲线的拟合。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">格点计算：精确参考与有限证据</title><desc id="desc">完整磁化分布、实际采样、相关诊断和有限系统温度曲线。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先算清小格点，再判断随机采样</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">有限系统的精确求和，不等于无限系统的临界证明。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
