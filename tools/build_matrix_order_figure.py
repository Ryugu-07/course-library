"""Render fixed matrix-order experiments from a complete provenance snapshot."""
from pathlib import Path
import subprocess,shutil,json,sys,html,math
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/matrix-order-functions.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ma-02-order-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/matrix-order/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.positive)[0],a.plots(f.flat)[0],a.plots(f.escape)[0],a.plots(f.functions)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 'δ=0.1,t=1：A与B都正定；蓝线有负方向，玫红线是平方差的最小特征值。',
 'A=diag(4,0),b=(2,0),C=3：原式、配方与最小值三线重合，都是2。',
 '只把b改成(2,1)：蓝/橙线重合并不断下降；绿色最小值线不存在。',
 'δ=0.1：平方蓝、指数玫红的函数差出现负方向。纵轴归一化后保留符号。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">矩阵序、Schur补与函数证据</title><desc id="desc">四组固定计算分别显示平方不保序、平坦的最小解、范围失配逃逸与实际函数差。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">每个“非负”结论，都有自己的条件</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1))
 out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">快照：2026-09-11，Node 24.14.0 / arm64；交互在当前浏览器重新运算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());p=f['positive']['result'];q=f['flat']['result'];e=f['escape']['result'];v=f['functions']['result']
 rows=[('正定例A最小特征值',p['A'][0][0]/2+p['A'][1][1]/2-math.hypot((p['A'][0][0]-p['A'][1][1])/2,p['A'][0][1])),
 ('正定例B最小特征值',p['B'][1][1]),('正定例平方差行列式',p['square']['eig']['determinant']),('正定例实际负方向二次型',p['square']['quadratic']),
 ('相容零枢轴的Schur值',q['S']),('相容零枢轴的有限最小值',q['minimum']),('相容例枢轴秩',sum(x!=0 for x in q['diagonal'])),('相容例候选点实际二次型',q['actualAtCandidate']),
 ('失配例形式Schur值',e['S']),('失配例范围残差范数',math.hypot(*e['rangeResidual'])),('失配例路径s=10的二次型',e['samples'][-1]['q']),('失配例存在有限最小值（1是0否）',int(e['finiteMinimum']))]
 for fn in ['square','exp','sqrt','log','negative-inverse']:
  r=next(r for r in v['records']if r['f']==fn);rows.append((dict(square='平方',exp='指数',sqrt='平方根',log='对数',**{'negative-inverse':'负倒数'})[fn]+'函数差的最小特征值',r['evidence']['eig']['values'][1]))
 rows.append(('平方凸性恒等式的实际缺陷',v['squareJensenGap']))
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵与计算记录](assets/learning/projects/matrix-order/run-snapshot.json)。正定与函数例采用δ=0.1、t=1；Schur例采用A=diag(4,0)、C=3，耦合分别为(2,0)与(2,1)。单位尺度均为1，凸组合权重为0.5。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n有限数值只描述这些存储矩阵。失配例的形式Schur值不是最小值；函数差中的极小负数或零须结合舍入缺陷和正文定理理解，不能据此否定全维度定理。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
