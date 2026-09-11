"""Render complete fixed transport-duality runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/transport-duality.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ot-01-monge-kantorovich-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/transport-duality/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.monotone)[0],a.plots(f.cycle)[1],a.plots(f.line)[1],a.plots(f.tie)[3]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '源质量0.75、0.25：正质量边统一线宽；精确最优成本0.75，原子映射最低1.125。',
 '三原子候选对角计划成本2；两边交换无改进，三边循环交换可降至最优0.5。',
 'CDF差在三段上的高度0.75、0.5、0.75，宽度0.25、0.75、0.25，总面积0.75。',
 '全部成本为1：两个不同运输顶点都最优；四棵生成树不代表四个不同顶点。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">最优传输的四份精确账本</title><desc id="desc">运输网络、三边交换、CDF面积与非唯一最优顶点。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">供需守恒之后，怎样证明运输计划最优？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());o=f['monotone']['result'];c=f['cycle']['result'];l=f['line']['result']['line'];t=f['tie']['result']
 values=[o['optimal']['primal']['value'],o['optimal']['dual']['value'],o['mongeBestCost']['value'],o['mongeGap']['value'],o['vertexCount'],o['spanningTrees'],c['candidate']['primal']['value'],c['optimal']['primal']['value'],c['candidate']['primal']['value']-c['optimal']['primal']['value'],c['mongeBestCost']['value'],l['W1']['value'],l['W2Squared']['value'],l['W2Approximation'],l['testObjective']['value'],t['vertexCount'],t['optimalVertexCount'],t['optimal']['primal']['value'],t['spanningTrees']]
 labels=['最优运输成本', '最优对偶收入', '最优原子映射成本', '映射与拆分成本差', '不同运输顶点数', '完整生成树数', '三边例候选成本', '三边例最优成本', '三边例可改进成本', '三边例最优映射成本', '一维W1', '一维W2平方', '一维W2近似值', '一维检验函数积分', '等成本不同顶点数', '等成本最优顶点数', '等成本最优值', '等成本生成树数']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部基、顶点、映射和证书](assets/learning/projects/transport-duality/run-snapshot.json)。默认源质量0.75、0.25，目标质量0.25、0.75，位置分别0、1和0.25、1.25，采用绝对距离成本。三边例质量两侧均为0.5、0.25、0.25，成本矩阵为2,0,5;5,2,0;0,5,2，候选为对角计划。等成本例两侧质量均0.5、0.5，四格成本均1；全部势平移为0。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in zip(labels,values))
 table+='\n网络中所有正质量边统一线宽，虚线包含零质量或负候选质量；数值看完整账本。CDF每段横线表示该区间的真实高度，竖向连接仅辅助读图。质量、成本与证书以精确分数为准；坐标和W2开方为近似展示。总价相等还须通过非负、边缘和报价可行性检查。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
