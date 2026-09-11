"""Render only stored records, never regenerate scientific observations."""
from pathlib import Path
import subprocess,sys,shutil,json,html
js,fixture,out,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy'] if shutil.which('rtk') else []
code='const a=require(process.argv[1]),fs=require("fs"),f=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));console.log(JSON.stringify(f.records.map(r=>({key:r.key,svg:a.svg(a.plots(r.data)[r.key==="dephasing"?1:0]),summary:a.tables(r.data)[0]}))));'
panels=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True));f=json.loads(fixture.read_text())
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2380" viewBox="0 0 1000 2380" role="img" aria-labelledby="title desc"><title id="title">开放单比特：不同初态与环境的四组固定实验</title><desc id="desc">默认倾斜纯态、激发态零温衰减、基态有限温吸收、纯退相位的平面投影。所有曲线来自随课固定记录。</desc><rect width="1000" height="2380" fill="#fffdf7"/><g fill="#263442" color="#263442" font-family="system-ui,sans-serif"><text x="40" y="40" font-size="25">从状态到通道：四组可复算对照</text>']
labels={'default':'A · 倾斜纯态：合并通道','excited':'B · 激发态：纯度先降后升','thermal':'C · 初始基态：有限温环境可以供能','dephasing':'D · 纯退相位：相干模缩短，z 保持不变'}
for i,p in enumerate(panels):
 y=75+575*i;data=f['records'][i]['data'];c=data['parameters'];rates=data['channel']['rates'];parts.append(f'<text x="45" y="{y+20}" font-size="20">{labels[p["key"]]}</text><text x="45" y="{y+46}" font-size="16">t={c["time"]}；启用速率 Γ₁={rates["gamma1"]:.6g}，Γφ={rates["gammaPhi"]:.6g}，Ω={rates["omega"]:.6g}，q={rates["q"]:.6g}</text>');parts.append(p['svg'].replace('<svg ','<svg x="40" y="'+str(y+55)+'" width="920" height="500" ',1))
parts.append('</g></svg>');out.write_text(''.join(parts))
rows=[]
for r in f['records']:
 d=r['data']['diagnostics'];rows.append('| '+labels[r['key']]+' | '+' | '.join(format(d[k],'.9g') for k in ['population','coherence','purity','minEigenvalue','entropy'])+' |')
text='**无脚本也可以复算：**图中四组参数与下表均来自同一份固定记录。先读第 5 节解析式，再核对各曲线终点。\n\n<figure class="plot" markdown="1">\n![四组开放单比特实验：纯度回升、有限温供能及纯退相位的不同后果。](assets/img/oqs-01-lindblad-ledgers.svg)\n<figcaption>图 oqs-01.1：实线是确定性的解析时间演化，圆点是当前终点。平面投影采用相同的横纵刻度。</figcaption>\n</figure>\n\n<div class="oqs169-static" tabindex="0" role="region" aria-label="固定读数表，可横向滚动" markdown="1">\n\n| 对照 | p₁ | C | P | λmin | S / bit |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载这四组完整固定记录](assets/learning/projects/lindblad-qubit/run-snapshot.json)。默认初态为 (0.8,0.4,√0.2)；B 为激发态，C 为基态、q=0.2。A/B/C 的最终纯度不同，不能用“耗散”一词替代计算。\n'
md.write_text(text);print({'bytes':out.stat().st_size,'panels':4,'values':20})
