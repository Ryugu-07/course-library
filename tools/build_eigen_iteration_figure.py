"""Render a reproducible figure and no-JavaScript table from a validated runtime snapshot."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/eigen-iteration.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/nla-02-eigen-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/eigen-iteration/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.vectors)[1],a.plots(f.chain)[0],a.plots(f.chain)[2],a.plots(f.slice)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '对称默认起点：幂法蓝、固定反幂橙、Rayleigh绿。先读停止原因，再读残差。',
 '四维链c=2、b=0.4：无移位QR玫红、Wilkinson蓝。所有点来自真实迭代。',
 '相似误差：无移位玫红、移位蓝；正交缺陷：无移位橙、移位绿。零未取对数。',
 'γ=20：最小扰动蓝、原谱距离玫红、容许扰动橙。只展示实轴截面。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">特征值迭代与残差证据</title><desc id="desc">固定运行的真实向量迭代、四维移位QR和实轴伪谱截面。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">数值变小了，它究竟证明了什么？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">快照：2026-09-11，Node 24.14.0 / arm64；交互仍使用当前浏览器运算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());v=f['vectors']['result'];q=f['chain']['result'];s=f['slice']['result'];p=s['result']
 rows=[]
 for m in v['methods']:
  label={'power':'幂法','inverse':'固定反幂','rayleigh':'Rayleigh'}[m['method']]
  rows.extend([(label+'末步ρ',m['final']['rho']),(label+'末步相对残差',m['final']['relativeResidual'])])
 for m in q['methods']:
  label='无移位QR'if m['method']=='unshifted'else'Wilkinson'
  rows.extend([(label+'实际步数',m['stepsTaken']),(label+'末步非对角范数',m['final']['offDiagonal']),(label+'末步相对相似误差',m['final']['relativeSimilarity'])])
 rows.extend([('γ=20,z=1.5：到原谱距离',p['distance']),('同参数最小奇异值',p['sigmaMin']),('实际见证残差',p['actualResidual']),('显式扰动范数',p['perturbationNorm']),('构造后特征方程残差',sum(x*x for x in p['changedResidual'])**.5),('同尺度容许扰动ε',s['threshold'])])
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载完整参数与计算记录](assets/learning/projects/eigen-iteration/run-snapshot.json)。三种模式分别使用对称默认参数、四维链c=2与b=0.4且32步预算、γ=20与z=1.5的实轴截面；共同尺度均为1。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n向量停止原因：'+ '；'.join({'power':'幂法','inverse':'固定反幂','rayleigh':'Rayleigh'}[m['method']]+'＝'+{'zero-floating-residual':'浮点零残差','residual-threshold':'达到残差阈值','iteration-budget':'预算结束','singular-shift':'移位系统奇异'}[m['status']]for m in v['methods'])+'。QR停止原因：'+'；'.join(('无移位'if m['method']=='unshifted'else'Wilkinson')+'＝'+('完成缩减'if m['status']=='deflated'else'预算结束')for m in q['methods'])+'。\n'
 Path(sys.argv[4]).write_text(table);print('fallback18',sys.argv[4])
