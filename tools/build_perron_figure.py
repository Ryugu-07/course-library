"""Render fixed Perron experiments from the complete immutable numeric snapshot."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/perron-frobenius.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ma-03-perron-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/perron-frobenius/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.cycle)[0],a.plots(f.cycle)[1],a.plots(f.periodic)[1],a.plots(f.pagerank)[4]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '列向量约定：0→1权重2，1→2权重0.5，2→0权重1；图的周期为3。',
 '三环权重积为1：完整谱为1及−0.5±0.866025…i，三点模均为1。',
 '交换矩阵从(1,0.25)出发：两分量轮换；网络连通不意味着原始方向收敛。',
 'α=0.5：蓝=实际误差，橙=残差/(1−α)上界，绿=残差；跳转分布(0.5,0.25,0.25)。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">非负矩阵的网络、周期与验收</title><desc id="desc">同一组固定输入的实际传递图、完整复谱、周期迭代与PageRank误差证书。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">能到达、会混合、算得准：三个问题分别回答</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">快照：2026-09-11，Node 24.14.0 / arm64；交互在当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());c=f['cycle']['result'];p=f['periodic']['result'];j=f['jordan']['result'];v=f['pagerank']['result']
 rows=[('三环谱半径',c['rho']),('三环次根实部',c['eigen'][1]['lambda']['re']),('三环次根正虚部',c['eigen'][1]['lambda']['im']),('三环周期',c['graph']['period']),('三环右主向量第0分量',c['right'][0]),('三环右主向量第1分量',c['right'][1]),
 ('交换矩阵谱半径',p['rho']),('交换矩阵另一个根',p['other']),('交换矩阵周期',p['graph']['period']),('交换例第0步第0分量',p['power']['rows'][0]['x'][0]),('交换例第1步第0分量',p['power']['rows'][1]['x'][0]),('交换例初始CW下界',p['power']['rows'][0]['collatz']['lower']['value']),
 ('Jordan主空间维数',j['dimension']),('Jordan主根代数重数',j['algebraicMultiplicity']),('Jordan第24步L¹方向误差',j['power']['rows'][24]['targetError'])]
 rows.extend(('PageRank精确分布第'+str(i)+'分量的近似值',z['value'])for i,z in enumerate(v['solve']['solution']))
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵、精确分数与计算记录](assets/learning/projects/perron-frobenius/run-snapshot.json)。三环权重为(2,0.5,1)，无自环；交换例起点(1,0.25)；Jordan例为[[1,1],[0,1]]、起点(1,1)；PageRank为三周期列随机矩阵、α=0.5、跳转分布(0.5,0.25,0.25)、起点(1,0,0)。观察24步，单位尺度为1。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n分数的有限位显示不等于精确分数本身；严格CW夹逼和PageRank残差上界以快照中的整数分子、分母为准。三环使用解析谱，有限迭代曲线不替代周期定理。Jordan误差对应当前归一化向量，不能拿一维主空间冒充代数单根。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
