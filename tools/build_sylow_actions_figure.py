"""Generate static teaching figures from fixed exact records only."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/sylow-actions.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/alg2-01-sylow-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/sylow-actions/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([['s3',0],['a4',0],['s4',3],['a5',1]].map(([k,i])=>a.svg(a.plots(f[k])[i]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['S₃对非正规二阶H的三个左陪集作用：轨道3、稳定子2；陪集尚不是商群。','A₄中一个Sylow 3子群作用：只固定自己，另外三个子群形成一个轨道。','S₄的导出列24→12→4→1；图中所选H为二阶子群，导出列2→1。','A₅类方程60=1+20+15+12+12；这些类的并只有平凡及全群能给正规子群。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">群作用、Sylow固定点与可解性</title><desc id="desc">S₃陪集、A₄的Sylow作用、S₄导出列和A₅共轭类四个固定对照。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">同一套计数规则，作用在不同对象上</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；完整编号与生成词见下载记录。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['s3'];b=f['a4'];c=f['s4'];d=f['a5']
 values=[a['group']['order'],a['selectedSubgroup']['order'],len(a['action']['points']),len(a['action']['selected']['stabilizer']),len(a['action']['kernel']),'是'if a['quotient']['defined']else'否',len(b['action']['actingElements']),','.join(str(o['size'])for o in b['action']['orbits']),len(b['action']['fixed']),next(s['actualCount']for s in b['group']['sylow']if s['prime']==3),','.join(str(s['order'])for s in c['group']['derived']['stages']),'是'if c['group']['derived']['solvable']else'否',c['group']['derived']['length'],len(c['group']['subgroups']),len(c['group']['normalSubgroupIds']),','.join(str(q['size'])for q in d['group']['classes']),'是'if d['group']['simple']else'否',','.join(str(s['order'])for s in d['group']['derived']['stages']),'是'if d['group']['derived']['solvable']else'否',len(d['group']['subgroups']),len(d['group']['normalSubgroupIds'])]
 labels=['S₃群阶','S₃所选H的阶','S₃左陪集数量','S₃所选点稳定子的阶','S₃陪集作用核的阶','S₃所选H是否能定义商群','A₄实验作用者的阶','A₄实验各轨道大小','A₄实验全部固定点数','A₄实际Sylow 3子群数','S₄导出列各群阶','S₄是否可解','S₄导出长度','S₄全部子群数','S₄正规子群数（含平凡及全群）','A₅各共轭类大小','A₅是否为单群','A₅导出列末项阶','A₅是否可解','A₅全部子群数','A₅正规子群数（含平凡及全群）']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载四份完整乘法表、子群列表、生成词与作用证书](assets/learning/projects/sylow-actions/run-snapshot.json)。S₃用H=〈(12)〉的左陪集，全群作用；A₄用首个Sylow 3子群作为作用者，共轭作用在全部Sylow 3子群上；S₄与A₅保留完整导出列及所有子群。具体置换编号、生成元与所选点写在每份参数中。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+str(v)+' |\n'for label,v in zip(labels,values));table+='\n作用核的阶为1表示核平凡。A₅的导出列停在非平凡的60阶群，因此不可解；它没有漏算后续步骤。子群总数来自完整闭包枚举，Sylow计数条件本身不给出所有子群数。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
