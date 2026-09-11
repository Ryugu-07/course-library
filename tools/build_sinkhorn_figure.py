"""Render complete fixed sinkhorn runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/sinkhorn.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ot-03-sinkhorn-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/sinkhorn/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.oneRound)[0],a.plots(f.converging)[1],a.plots(f.bias)[2],a.plots(f.underflow)[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '三仓库示例仅迭代一轮：列账已齐，行账仍偏；每格同时保留数值与自然对数。',
 '同一例连续20轮：蓝=最大行残差，橙=最大列残差；零线用于核对更新的半步。',
 '每个ε运行50轮：蓝=去偏估计，橙/绿=数值端点；重合不表示严格区间证明。',
 '所有成本100、ε=0.0001：直接核九格全下溢；log缩放仍可恢复独立耦合。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">Sinkhorn边缘、去偏与下溢的四份账本</title><desc id="desc">当前矩阵、交替边缘残差、去偏估计与直接指数核下溢。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">先把货对平，再区分误差来自哪里？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['oneRound']['result'];b=f['converging']['result'];c=f['bias']['result'];u=f['underflow']['result'];z=next(q for q in c['sweep']if q['epsilon']==0.8)
 values=[a['steps'],a['run']['current']['mass'],max(map(abs,a['run']['current']['rowResiduals'])),max(map(abs,a['run']['current']['columnResiduals'])),a['run']['current']['transport'],a['run']['certificate']['upper']['value'],a['run']['certificate']['lower']['value'],a['exact']['cost']['value'],b['run']['current']['maxResidual'],b['run']['numericalGap'],b['run']['roundedObjective']['transport'],b['run']['roundedObjective']['regularized'],z['estimate'],z['width'],u['naive']['kernelUnderflows'],u['naive']['failure']['iteration'],u['run']['current']['maxResidual'],u['run']['certificate']['upper']['value']]
 labels=['首例完整轮数','首例当前总质量','首例最大行残差','首例最大列残差','首例运输部分','首例修复成本上界','首例精确成本下界','首例原始LP最优值','20轮最大边缘残差','20轮熵数值上端减下端','20轮修复运输部分','20轮修复完整熵目标','ε为0.8的去偏估计','去偏数值上端减下端','全高成本核下溢格数','直接核失败轮数','log法两轮边缘残差','全高成本精确上界']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载每个半步、三份去偏问题及精确补账记录](assets/learning/projects/sinkhorn/run-snapshot.json)。三仓库例源质量0.5、0.3、0.2，目标0.2、0.3、0.5，两侧位置0、1、2，平方成本，ε=0.8，分别运行1轮、20轮；去偏扫描每个ε运行50轮。下溢例边缘相同，所有成本100，ε=0.0001，运行2轮。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in zip(labels,values))
 table+='\n浮点残差与熵目标的数值差不是严格区间证书；非常小的负差仍保留符号。修复计划与原始线性成本证书以下载记录中的精确分数为准。直接核失败不会被偷偷替换成零分母的近似解。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
