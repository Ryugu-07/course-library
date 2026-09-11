"""Render fixed full records; do not regenerate numerical evidence during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/homology-boundary.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/at-03-homology-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/homology-boundary/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([['solid',0],['surface',0],['filled',0],['torsion',2]].map(([k,i])=>a.svg(a.plots(f[k])[i]))))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=['三角形：边序01、02、12，闭链(1,−1,1)恰好是面的一次边界。','四面体表面：面链(−1,1,−1,1)闭合；没有三维链，不能填充。','填入三维单纯形0123：同一个面链成为三维边界；二维同调类消失。','RP²：蓝=整数自由秩，橙=模2，绿=模3，紫=模5；模2的一、二维均为1。']
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">整数同调、三维填充与系数变化</title><desc id="desc">三角形、四面体表面与实体、射影平面的系数对照。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">能否填充，要同时知道链、维数与系数</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['solid']['result'];b=f['surface']['result'];c=f['filled']['result'];d=f['torsion']['result']
 values=[a['integerHomology'][1]['freeRank'],'边界',','.join(a['chain']),','.join(a['integerSelection']['filling']),b['integerHomology'][2]['freeRank'],'无限阶'if b['integerSelection']['order']is None else b['integerSelection']['order'],b['dimensions'][3],c['integerHomology'][2]['freeRank'],'边界',','.join(c['integerSelection']['filling']),c['dimensions'][3],d['integerHomology'][1]['freeRank'],','.join(d['integerHomology'][1]['torsion']),d['integerSelection']['order'],','.join(d['integerSelection']['filling']),d['fieldComparisons'][0]['groups'][1]['dimension'],d['fieldComparisons'][0]['groups'][2]['dimension'],d['fieldComparisons'][1]['groups'][1]['dimension']]
 labels=['实心三角形H1整数自由秩','实心三角形选定链分类','实心三角形的链坐标','实心三角形填充链坐标','四面体表面H2整数自由秩','四面体表面选定类的阶','四面体表面的C3维数','实体四面体H2整数自由秩','实体四面体选定面链分类','实体四面体填充链坐标','实体四面体的C3维数','RP²的H1整数自由秩','RP²的H1非单位Smith因子','RP²选定一维类的精确阶','RP²乘该阶后的填充坐标','RP²模2的一维同调维数','RP²模2的二维同调维数','RP²模3的一维同调维数']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部矩阵、整数逆变换、同调基与填充证书](assets/learning/projects/homology-boundary/run-snapshot.json)。三角形输入012，选一链(1,−1,1)；表面输入012;013;023;123，选二链(−1,1,−1,1)；实体输入0123并保留同一二链；RP²使用一零胞腔、一一胞腔、一二胞腔，D2为乘2，选一链系数1。各组观察系数为整数，素域另行重算。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+str(v)+' |\n'for label,v in zip(labels,values))
 table+='\n无限阶不是计算失败。RP²的填充见证填的是选定链的2倍；面链是否为边界还取决于三维链群。整数自由秩与模素数维数分别记账。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
