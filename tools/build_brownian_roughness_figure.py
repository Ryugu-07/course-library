"""Render the frozen record; never sample a new path while building the page."""
from pathlib import Path
import sys,json,subprocess,hashlib,shutil,html
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
js,out,fixture,fallback=map(Path,sys.argv[1:5]);f=json.loads(fixture.read_text())
assert f['schema']==1 and f['provenance']['jsSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code="""const fs=require('fs'),a=require(require('path').resolve(process.argv[1])),f=JSON.parse(fs.readFileSync(process.argv[2]));const panels=[['midpoint',0],['generated',1],['frozen',1],['bridge',5]].map(([key,i])=>({key,svg:a.svg(a.plots(f[key])[i])}));const g=f.generated.record.levels[4],z=f.frozen.record.levels[8],m=f.midpoint.record.coefficients[0],t=f.bridge.tail;const refs=[['生成样本的M',4],['生成网格L',4],['生成网格V',g.actual.totalVariation],['生成网格Q',g.actual.quadraticVariation],['生成网格最大增量',g.actual.maxIncrement],['冻结细分L',8],['冻结细分V',z.actual.totalVariation],['冻结细分Q',z.actual.quadraticVariation],['冻结细分最大增量',z.actual.maxIncrement],['冻结Q的预期比例',1/16],['冻结Q恒等式残差',z.frozenIdentity.qResidual],['首个帽子层m',m.m],['首个帽子的标准差',m.scale],['首个帽子的标准化系数Z',m.z],['首个帽子的峰值',m.amplitude],['首个帽子的实际中点',m.midpoint],['尾部失败概率δ',t.delta],['解析尾界浮点参考',t.analyticUpperBoundApproximation],['前16层之后的概率分配',t.remainingProbabilityAfterRows],['帽函数重建最大残差',f.generated.record.reconstruction.maxAbsResidual]];console.log(JSON.stringify({panels,refs:refs.map(([a,b])=>[a,String(b)]),short:[g.actual.quadraticVariation,z.actual.quadraticVariation].map(a.fmt)}));"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(js),str(fixture)],text=True))
svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2300" viewBox="0 0 1000 2300" role="img"><title>布朗运动：中点、生成网格、冻结细分与缺少的桥</title><desc>四个固定数值场景。区分生成新的高斯细节与细分已有折线；所有图从下载记录重放。</desc><rect width="1000" height="2300" fill="#fff"/>'
titles=['一、中点噪声：先看一层帽子如何加入','二、固定生成层M=4：读取生成网格L=4','三、保持同一折线：测量网格细分至L=8','四、生成网格内部：有限折线缺少的桥协方差']
captions=['标准差是√h/2；旧节点不变。图中的噪声是一个已实现的数。','当前Q='+d['short'][0]+'；均值为1不要求每个样本恰好等于1。','当前Q='+d['short'][1]+'；它是同一M=4折线原Q的1/16，V保持不变。','概率模型是无限独立高斯延伸；有限画面与浮点数字不能代替极限定理。']
for i,p in enumerate(d['panels']):
 y=[85,640,1195,1750][i]
 svg+='<text x="50" y="'+str(y-24)+'" font-family="system-ui,sans-serif" font-size="19" fill="#283b46">'+html.escape(titles[i])+'</text>'+p['svg'].replace('<svg ','<svg x="50" y="'+str(y)+'" ',1)+'<text x="50" y="'+str(y+490)+'" font-family="system-ui,sans-serif" font-size="14" fill="#283b46">'+html.escape(captions[i])+'</text>'
out.write_text(svg+'</svg>\n')
rows='\n'.join('<tr><td>'+html.escape(k)+'</td><td>'+html.escape(v)+'</td></tr>'for k,v in d['refs'])
fallback.write_text('<figure class="plot" markdown="1">\n[![四个固定场景：中点、生成网格、冻结细分与缺少的桥](assets/img/sc-01-brownian-ledgers.svg)](assets/img/sc-01-brownian-ledgers.svg)\n<figcaption>图1.1：打开原图可对照中点噪声、生成层、冻结细分与缺少的桥。</figcaption>\n</figure>\n\n<div class="fallback-scroll" role="region" tabindex="0" aria-label="布朗运动固定数值记录">\n<table><thead><tr><th scope="col">项目</th><th scope="col">固定记录值</th></tr></thead><tbody>\n'+rows+'\n</tbody></table>\n</div>\n\n[下载四个场景的完整固定记录(JSON)](assets/learning/projects/brownian-roughness/run-snapshot.json)。三个M=4场景使用同一种子20260722；中点图使用M=2、L=1。表内保留JSON中的数值，图上刻度为便于阅读做了舍入。\n')
print(json.dumps({'svgBytes':out.stat().st_size,'values':len(d['refs'])}))
