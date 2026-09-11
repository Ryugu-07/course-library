"""Render frozen observations only; never regenerate the experiment."""
from pathlib import Path
import subprocess,sys,shutil,json,html
js,fixture,cool_svg,rabi_svg,cool_md,rabi_md=map(Path,sys.argv[1:]);prefix=['rtk','proxy'] if shutil.which('rtk') else []
code='''const a=require(process.argv[1]),fs=require('fs'),f=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),c=Object.fromEntries(f.cooling.map(r=>[r.key,r.data]));
const force=a.plots(c.default)[0],temp=a.plots(c.default)[2],blue=a.plots(c.blue)[2],scan=a.plots(c.default)[4];
temp.title='同一失谐：弱光冷却更慢，平衡温度相同';temp.yLabel='kBT / (ℏΓ)';temp.yMax=2.2;temp.series=[temp.series[0],{name:'光强减半的温度',color:'#b76b16',points:c.weak.nodes.map(r=>[r.time,r.temperature])},temp.series[2]];
blue.title='蓝失谐：OU 方差增长，没有有限稳态';
const colors=['#376fbb','#b76b16','#348054'],names=['共振 π 脉冲','失谐 Δ=Ω','共振 2π 脉冲'];
const rabi={key:'rabi',title:'相干布居曲线：相同初态，不同失谐',xLabel:'t（角频率单位的倒数）',yLabel:'激发概率 Pₑ',xMin:0,xMax:Math.max(...f.rabi.flatMap(r=>r.data.nodes.map(n=>n.t))),yMin:0,yMax:1.05,series:f.rabi.map((r,i)=>({name:names[i],color:colors[i],points:r.data.nodes.map(n=>[n.t,n.probability])}))};
console.log(JSON.stringify({cooling:[force,temp,blue,scan].map(p=>a.svg(p)),rabi:a.svg(rabi)}));'''
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
def document(title,desc,panels,labels):
 height=80+len(panels)*575
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{height}" viewBox="0 0 1000 {height}" role="img" aria-labelledby="title desc"><title id="title">{html.escape(title)}</title><desc id="desc">{html.escape(desc)}</desc><rect width="1000" height="{height}" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="40" font-size="25">{html.escape(title)}</text>']
 for i,p in enumerate(panels):
  y=75+575*i;parts.append(f'<text x="45" y="{y+20}" font-size="17">{html.escape(labels[i])}</text>');parts.append(p.replace('<svg ',f'<svg x="40" y="{y+45}" width="920" height="500" ',1))
 return ''.join(parts)+ '</g></svg>'
cool_svg.write_text(document('从动量账本到冷却温度','全部曲线来自固定记录。A完整弱光响应；B比较光强；C是蓝失谐局部OU反例；D只比较红失谐稳态。',plots['cooling'],['A · δ=−0.5，s=0.01：响应曲线与零速切线','B · δ=−0.5，ε=0.001，θ₀=2，μ₀=0.02；s=0.01 与0.005','C · δ=+0.5，s=0.01，τ≤50；局部近似不能无限外推','D · 正弱光下扫描红失谐；最小值在 δ=−0.5']))
rabi_svg.write_text(document('相干控制的概率与相位分开核对','共振π与2π预设的驱动相同，因此整条概率曲线重合；预设的脉冲终点不同，见下表。', [plots['rabi']],['Ω=1；共振 π 与2π 两条全时域曲线重合，所选终点见表']))
coolrows=[]
for r in f['cooling']:
 d=r['data'];c=d['parameters'];z=d['current'];co=d['coefficients'];coolrows.append('| '+r['key']+' | '+' | '.join(format(v,'.9g')for v in [c['delta'],c['saturation'],c['time'],co['friction'],co['diffusion0'],z['mean'],z['temperature']])+' | '+('不适用'if co['equilibriumTemperature']is None else format(co['equilibriumTemperature'],'.9g'))+' |')
link='[下载两项实验的完整固定记录](assets/learning/projects/cold-atoms/run-snapshot.json)'
cool_md.write_text('**无脚本固定对照：**以下读数与图共享同一份记录。关灯保持初始分布；蓝失谐没有有限稳态。\n\n<figure class="plot" markdown="1">\n![光压力切线、光强减半、蓝失谐反例与红失谐温度扫描。](assets/img/amo-01-doppler-ledgers.svg)\n<figcaption>图 amo-01.2：实线是各自模型的确定性计算，不是实测数据。A保留弱光速度响应，B/C另取局部OU近似，D只画正光强的红失谐稳态。</figcaption>\n</figure>\n\n<div class="amo170-static" tabindex="0" role="region" aria-label="固定冷却读数，可横向滚动" markdown="1">\n\n| 对照 | δ | s | τ | A | d̄ | μ | θ | θeq |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(coolrows)+'\n\n</div>\n\n'+link+'。ε=0.001，θ₀=2，μ₀=0.02；总光强参数是每束s的6倍。\n')
rabirows=[]
for r in f['rabi']:
 d=r['data'];v=d['result'];p=v['params'];amp=d['amplitudes'];rabirows.append('| '+r['key']+' | '+' | '.join(format(vv,'.9g')for vv in [p['omega'],p['delta'],p['t'],v['effectiveOmega'],v['amplitude'],v['probability']])+' |')
rabi_md.write_text('**无脚本固定对照：**先预测终点，再核对整条概率曲线。共振π与2π的驱动相同，曲线重合，但停止时刻不同。\n\n<figure class="plot" markdown="1">\n![三个脉冲预设的激发概率，失谐同时改变振幅与频率。](assets/img/amo-01-rabi-ledgers.svg)\n<figcaption>图 amo-01.1：图画完整时间区间，表列各预设的脉冲终点；相位信息须读完整振幅记录，不能只看概率。</figcaption>\n</figure>\n\n<div class="amo170-static" tabindex="0" role="region" aria-label="固定Rabi读数，可横向滚动" markdown="1">\n\n| 对照 | Ω | Δ | t | Ωeff | 上限 | Pe |\n|---|---:|---:|---:|---:|---:|---:|\n'+'\n'.join(rabirows)+'\n\n</div>\n\n'+link+'。本实验没有自发辐射或外部运动，不模拟冷却。\n')
print({'coolingBytes':cool_svg.stat().st_size,'rabiBytes':rabi_svg.stat().st_size,'panels':5,'fixedRows':7})
