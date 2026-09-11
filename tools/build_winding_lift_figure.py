"""Render fixed full records; do not regenerate numerical evidence during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/winding-lift.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/at-01-winding-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/winding-lift/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(['lift','tiny','touch','word'].map(k=>a.svg(a.plots(f[k])[0]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['A回摆、B匀速：蓝色中间提升两端固定；橙=A，绿=B，玫红=当前点。','方形边长只有0.000002：箭头逆时针，绕数仍为1；绿色为每段最近点。','单位方形右移1：左边包含原点，绕数未定义；碰撞边编号2。','交换子abAB的约化长度最后为4，两个净次数却都为0；它不是空词。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">提升、精确绕数与非交换词的四份账本</title><desc id="desc">固定端点同伦、极细方形、碰撞临界与交换子约化。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">一张路径图，需要哪一种证据？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['lift']['result'];b=f['tiny']['result'];c=f['touch']['result'];d=f['word']['result']
 values=[a['start']['value'],a['endA']['value'],a['endB']['value'],a['winding']['value'],a['current']['value']['value'],len(a['knots']),b['winding'],b['minimumDistance2']['value'],len(b['segments']),b['angleWinding'],'是'if c['valid']else'否','未定义'if c['winding']is None else c['winding'],','.join(map(str,c['collisionSegments'])),c['minimumDistance2']['value'],d['a']['reduced'],d['a']['length'],d['a']['abelianization'][0],d['a']['abelianization'][1]]
 labels=['同伦提升起点','输入A终点','输入B终点','中间提升绕数','t为0.5时的提升值','合并后的分段节点数','极细方形绕数','极细方形最小距离平方','极细方形边数','极细方形浮点辐角绕数','临界平移路径是否合法','临界平移绕数','临界碰撞边编号','临界最小距离平方','交换子的约化词','交换子的约化长度','交换子的a净次数','交换子的b净次数']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部节点、逐段判定与词消去记录](assets/learning/projects/winding-lift/run-snapshot.json)。提升A节点0、1.5、−0.5、1，B节点0、1，各自等时间间隔，s=t=0.5；极细方形顶点为(±0.000001,±0.000001)，逆时针；临界方形原顶点(±1,±1)，水平右移1；词w为abAB，比较词v为空。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+(format(v,'.12g')if isinstance(v,(int,float))else str(v))+' |\n'for label,v in zip(labels,values))
 table+='\n最小距离平方与绕数的精确分数见下载记录。未定义不是0；交换化为(0,0)也不等于自由群词为空。浮点辐角只用于交叉核对。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
