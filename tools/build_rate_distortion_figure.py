"""Render complete fixed rate-distortion runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/rate-distortion.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/it2-03-rate-distortion-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/rate-distortion/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.biased)[1],a.plots(f.finite)[1],a.plots(f.tail)[1],a.plots(f.water)[0]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 'p=0.1，D=0.05：联合四格为323、1、17、19除以360；前向两种错误率不同。',
 '三位源重构为000或111：蓝=每词实际失真，绿=预算0.1；平均0.09，超额概率0.27。',
 '公平硬币n=100：蓝=精确类型log质量，橙=KL指数，绿=含多项式因子的下界。',
 '独立实高斯方差9、4、1，总预算3：蓝=原方差，橙=分配失真，绿=水位1。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">率失真与有限类型的四份账本</title><desc id="desc">反向最优测试信道、有限源词失真、类型的有限前因子与高斯反注水。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">压缩付出的失真，怎样与信息边界对应？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());o=f['biased']['result']['optimal'];e=f['finite']['result'];t=f['tail']['result'];w=f['water']['result']
 values=[o['rate'],o['reproduction'][1]['value'],o['forward'][0][1]['value'],o['forward'][1][0]['value'],o['distortion']['value'],e['averageDistortion']['value'],e['maximumSupportedDistortion']['value'],e['excessProbability']['value'],e['reconstructionEntropy'],t['eventMass']['value'],t['finiteRate'],t['tailLimitRate'],t['conditionalMean']['value'],w['waterLevel']['value'],w['ratePerVector'],w['ratePerCoordinate'],w['rows'][0]['forwardCoefficient']['value'],w['rows'][0]['forwardNoiseVariance']['value']]
 labels=['偏置源信息率失真', '最优重构P(1)', '前向0误判为1', '前向1误判为0', '最优联合平均失真', '三位码本平均每位失真', '三位码本支持最大失真', '三位码本超0.1概率', '三位重构标签熵bit/块', '百次公平硬币至少0.7概率', '百次事件有限速率', '闭尾事件渐近KL速率', '百次事件条件平均比例', '高斯总预算3的水位', '高斯bit/三维向量', '高斯平均bit/坐标', '第一坐标前向均值系数', '第一坐标前向噪声方差']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载完整测试信道、BA轨迹、源词、类型与水位记录](assets/learning/projects/rate-distortion/run-snapshot.json)。偏置源p=0.1、预算D=0.05、BA的beta=3且初始重构P(1)=0.5迭代40步；有限源p=0.1、三位码本000和111、预算0.1；类型例p=0.5、n=100、比例至少0.7；独立实高斯方差9、4、1、整个向量预算3。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in zip(labels,values))
 table+='\n离散点连线只作读图辅助，重合曲线可能覆盖。有限计数、概率和失真以精确分数为准；熵、对数与BA为浮点近似，诊断不是严格区间证书。有限码本的实际性能与单字母渐近边界分别解释，零事件没有条件分布。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
