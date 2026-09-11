"""Render four fixed matrix-analysis experiments, keeping their numeric provenance."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/non-normal-transient.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ma-01-norm-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/matrix-norms/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.transient)[0],a.plots(f.divergent)[2],a.plots(f.perturbation)[1],a.plots(f.disks)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 'r=0.9,g=10：最坏增益蓝与e₂方向橙近乎重合，正规控制绿。仅报告窗口峰值。',
 'A=0.9I,z=0.5：逆范数蓝恒为2.5；Neumann部分和橙增长，逆存在不够。',
 '谱隙1：两方向夹角蓝/橙重合；间隔估计绿/紫也重合，仅在条件满足时显示。',
 '对称三维链：行圆盘蓝、橙、紫；实算谱点玫红。第三行半径为1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">矩阵范数、谱半径与扰动证据</title><desc id="desc">固定运行展示非正规瞬态、Neumann展开失败、对称方向扰动与Gershgorin谱定位。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">同一个矩阵问题，需要哪一种证据？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">快照：2026-09-11，Node 24.14.0 / arm64；交互在当前浏览器重新运算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());p=f['transient']['result'];q=f['divergent']['result'];v=f['perturbation']['result'];g=f['disks']['result']
 rows=[('Jordan谱半径',p['rho']),('e₂第一步增益',p['rows'][1]['selected']),('窗口最大算子增益',p['rows'][p['envelopePeak']]['envelope']),('最早达到该峰值的步数',p['envelopePeak']),('e₂第30步增益',p['final']['selected']),
 ('发散例的逆矩阵范数',q['resolvent']['norm']),('发散例第8阶部分和范数',q['final']['partialNorm']),('逆矩阵减第8阶部分和范数',q['final']['remainderNorm']),
 ('对称例实际扰动范数',v['eta']),('首特征值绝对变化',v['comparisons'][0]['deviation']),('首方向夹角的sin',v['comparisons'][0]['sinAngle']),('小扰动间隔估计',v['comparisons'][0]['gapBound']),
 ('第一行圆盘半径',g['disks'][0]['radius']),('第二行圆盘半径',g['disks'][1]['radius']),('第三行圆盘半径',g['disks'][2]['radius']),('分离组确定的负特征值数',g['negativeCount']),('分离组确定的正特征值数',g['positiveCount']),('Jacobi最大本征残差',max(q['residualNorm']for q in g['pairs']))]
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵、向量和运算记录](assets/learning/projects/matrix-norms/run-snapshot.json)。瞬态使用r=0.9、g=10、e₂与30步窗口；发散例使用A=0.9I、z=0.5与8阶部分和；对称例使用中心1、谱隙1、原轴0°、幅度0.1与扰动正轴45°；圆盘例使用正文三维链。各共同单位尺度均为1。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n这里的峰值仅属于30步窗口。发散例的逆矩阵存在，但Neumann级数不收敛；对称方向估计依赖谱隙条件。圆盘计数来自定理与分离关系，Jacobi残差单独展示实际求解精度。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
