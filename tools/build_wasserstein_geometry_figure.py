"""Render complete fixed wasserstein-geodesic runs; never resample numeric fixture during publication."""
from pathlib import Path
import subprocess,shutil,json,sys,html
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/wasserstein-geodesic.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'grad-math/images/ot-02-wasserstein-ledgers.svg'
FIXTURE=Path(sys.argv[3])if len(sys.argv)>3 else ROOT/'course-shared/projects/wasserstein-geodesic/run-snapshot.json'
code="const a=require(process.argv[1]),f=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify([a.plots(f.atomic)[0],a.plots(f.barycenter)[0],a.plots(f.plane)[3],a.plots(f.gaussian)[2]].map(a.svg)))"
svgs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),str(FIXTURE.resolve())],text=True))
notes=[
 '0处质量拆到−2和2：蓝=源，橙=目标，绿=半程位置；竖线不贡献概率积分。',
 '三个点质量0、2、4，权重0.25、0.25、0.5：分位数平均为2.5，最优目标2.75。',
 '两端分布相同却交叉配对：蓝=实际到源距离平方，绿=最短路，橙=粒子成本上界。',
 '协方差diag(1,4)到diag(4,1)：绿=位移协方差迹，橙=算术平均迹；半程4.5与5。'
]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2140" viewBox="0 0 1000 2140" role="img" aria-labelledby="title desc"><title id="title">Wasserstein路径与重心的四份账本</title><desc id="desc">分位数位移、一维重心、错误粒子配对与高斯协方差。</desc><rect width="1000" height="2140" fill="#faf7ef"/><g fill="#253346" color="#253346" font-family="system-ui,sans-serif"><text x="35" y="48" font-size="28">分布怎样走最短路，又怎样取平均？</text>']
for svg,y,note in zip(svgs,[85,595,1105,1615],notes):
 out.append(svg.replace('<svg xmlns=',f'<svg x="50" y="{y}" xmlns=',1));out.append(f'<text x="35" y="{y+455}" font-size="17">{html.escape(note)}</text>')
out.append('<text x="35" y="2120" font-size="18">固定运行：2026-09-11，Node 24.14.0 / arm64；交互由当前浏览器重新计算。</text></g></svg>')
OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(out));print(OUT)
if len(sys.argv)>4:
 f=json.loads(FIXTURE.read_text());a=f['atomic']['result'];b=f['barycenter']['result'];p=f['plane']['result'];g=f['gaussian']['result'];mid=next(z for z in a['timeRows']if z['time']['value']==0.5)
 values=[a['distanceSquared']['value'],a['distanceApproximation'],a['betweenSquared']['value'],mid['displacementStats']['mean']['value'],mid['displacementStats']['variance']['value'],mid['mixtureStats']['variance']['value'],b['objective']['value'],b['candidateObjective']['value'],b['gap']['value'],b['barycenter'][0]['position']['value'],p['distanceSquared']['value'],p['selectedCost']['value'],next(z for z in p['timeRows']if z['time']['value']==0.5)['startSquared']['value'],p['betweenSquared']['value'],g['distanceSquared'],g['map'][0][0],g['atT']['covariance'][0][0],g['atT']['covariance'][1][1]]
 labels=['拆分端点W2平方', '拆分端点W2', '拆分1/4至1/2的W2平方', '位移半程均值', '位移半程方差', '混合半程方差', '三个点质量最优目标', '候选点2的目标', '候选与最优目标差', '重心点位置', '相同二维端点W2平方', '交叉粒子配对成本', '错误中点到源W2平方', '错误路径1/4至1/2的W2平方', '对角高斯W2平方', '高斯映射第一方向缩放', '高斯半程第一方向方差', '高斯半程第二方向方差']
 table='固定运行：2026-09-11，Node 24.14.0 / darwin arm64。[下载全部分位数、时间、成本和矩阵记录](assets/learning/projects/wasserstein-geodesic/run-snapshot.json)。一维源δ0，目标−2与2处质量0.35与0.65；三分布δ0、δ2、δ4，权重0.25、0.25、0.5，候选δ2；二维两端均(−1,0)、(1,0)各半，选交叉配对；高斯均值均0，源协方差diag(1,4)，目标diag(4,1)。比较时刻s=0.25，当前t=0.5。\n\n| 固定参数下的量 | 参考值 |\n|---|---:|\n'
 table+=''.join('| '+label+' | '+format(value,'.12g')+' |\n'for label,value in zip(labels,values))
 table+='\n原子质量与成本以精确分数为准；高斯矩阵和平方根为浮点近似，误差诊断不是严格区间证书。图线连接读数只辅助观察，重合曲线会覆盖。直线粒子运动仍须核对配对最优性；混合与位移的均值可相同而方差不同。\n'
 Path(sys.argv[4]).write_text(table);print('fallback',len(values))
