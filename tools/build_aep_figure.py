"""Render complete fixed AEP runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/aep-typicality.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/it2-01-aep-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/aep-typicality/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.biased)[0],a.plots(f.biased)[1],a.plots(f.periodic)[2],a.plots(f.mix)[1]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 'p=0.9，n=100，带宽0.1：蓝=类型质量，绿=入带质量；绿点质量之和约0.759。',
 '蓝=每符号自信息，橙=H，绿=H±0.1；全1冠军落在窄带之外。',
 '公平相位的交替链，n=8：蓝=条件熵，绿=熵率0；只有第一位贡献1比特。',
 '一次选p=0.1或0.5，各占一半：蓝=信息率，橙=平均熵率，绿=平均值±0.1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">AEP的有限概率与过程条件</title><desc id="desc">二项类型、有限典型带、周期链条件熵与一次混合信源的实际固定记录。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">有限样本有多典型，有记忆时又怎样？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());b=f['biased']['result'];e=f['empty']['result'];p=f['periodic']['result'];m=f['mix']['result']
 rows=[('偏置硬币二元熵',b['entropy']),('偏置例典型带质量',b['typicalMass']['value']),('偏置例典型基数log₂',b['typicalLogCount']),('偏置例典型字典整数码长',b['typicalBits']),('47比特最优覆盖率',b['coding']['covered']['value']),('47比特最优块错误率',b['coding']['error']['value']),('偏置例全1冠军每符号自信息',b['rows'][100]['information']),('长度2窄带典型条数',int(e['typicalCount'])),('长度2一码长最优覆盖率',e['coding']['covered']['value']),('交替链长度8块熵',p['blockEntropy']),('交替链熵率',p['entropyRate']),('交替链对公平独立模型的交叉熵',p['crossEntropy']),('交替链对公平独立模型的KL',p['relativeEntropy']),('一次混合平均熵率',m['entropyRate']),('一次混合长度100块熵',m['blockEntropy']),('一次混合隐变量互信息',m['mutualInformation']),('一次混合平均值带内质量',m['typicalMass']['value']),('一次混合块熵除以100',m['blockEntropy']/100)]
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部类型、路径、精确分数与码本记录](assets/learning/projects/aep-typicality/run-snapshot.json)。偏置例p=0.9、n=100、带宽0.1、码长47；长度2例p=0.75、带宽0.1、码长1；交替链真实Q01=Q10=1、平稳初始各1/2、n=8，候选模型为独立公平硬币；一次混合例pA=0.1、pB=0.5、权重各1/2、n=100、带宽0.1。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in rows)
 table+='\n概率和码本覆盖率的精确值以分子、分母为准；熵与对数是有限精度近似，典型边界判断不是区间证书。全路径枚举验证当前有限模型，不替代SMB定理；固定码本允许不可检测块错误。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(rows))
