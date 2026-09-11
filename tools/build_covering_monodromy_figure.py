"""Render fixed full records; do not regenerate numerical evidence during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/covering-monodromy.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/at-02-covering-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/covering-monodromy/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([['action',0],['partial',2],['disconnected',0],['schreier',0]].map(([k,i])=>a.svg(a.plots(f[k])[i]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['三层连通覆盖：像群有6个元素，甲板群只有1个；覆盖子群是秩4的无限自由群。','环面关系：纤维3上闭合，另三层却未全部闭合；不能延拓为环面覆盖。','三个相同的一层分支：每个内部无非平凡甲板变换，总甲板群却是S3。','环面覆盖的一维骨架：虚线T是树边，h是自由基；填入圆盘后还要加入提升关系。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">覆盖、关系和子群的四份精确账本</title><desc id="desc">纤维置换、关系的全部提升、断开分支交换、生成树和子群基。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">同一张覆盖图，四种需要分清的对象</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['action']['result'];b=f['partial']['result'];c=f['disconnected']['result'];d=f['schreier']['result']
 values=[a['n'],a['imageOrder'],a['imageStabilizerOrder'],a['deckOrder'],a['freeRankForRose'],a['selectedRun']['end'],b['n'],','.join(map(str,b['relationRuns'][0]['failures'])),b['relationRuns'][0]['runs'][3]['end'],'是'if b['validForPresentation']else'否',len(c['orbits']),c['imageOrder'],c['deckOrder'],d['tree']['graphRank'],len(d['tree']['treeEdges']),len(d['liftedRelations']),'是'if d['validForPresentation']else'否','不适用'if d['freeRankForRose']is None else d['freeRankForRose']]
 labels=['非正规例的层数','非正规例的置换像阶','非正规例的像稳定子阶','非正规例的甲板群阶','非正规例的子群自由秩','从0读b后的终点','部分闭合例的层数','部分闭合例中关系失败的层编号','部分闭合例从3读关系后的终点','部分闭合例能否延拓为环面覆盖','恒等动作的连通分支数','恒等动作的置换像阶','恒等动作的总甲板群阶','环面例一维骨架的自由秩','环面例生成树的边数','环面例全部提升关系数','环面例是否通过全部关系检查','环面最终子群是否直接采用图的自由秩']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部置换、路径、子群基和提升关系](assets/learning/projects/covering-monodromy/run-snapshot.json)。非正规例：σa=(1,2,0)，σb=(0,2,1)，起点0，词b；部分闭合例：σa=(1,2,0,3)，σb=(0,2,1,3)，关系abAB；断开例：两个置换都是(0,1,2)；环面例：σa=σb=(1,2,0)，关系abAB。括号内均为像列表，不是循环记号。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+str(v)+' |\n'for label,v in zip(labels,values))
 table+='\n层数是子群指数，不是子群元素数。图的自由秩属于一维骨架；填入圆盘后的群必须再加提升关系。某一层闭合不等于整个纤维上的恒等作用。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
