"""Render only supplied stored observations; never regenerate numerical records."""
from pathlib import Path
import subprocess,shutil,sys,json,html
js,fixture,svg,md=map(Path,sys.argv[1:]);prefix=['rtk','proxy']if shutil.which('rtk')else[]
code="const a=require(process.argv[1]),f=require(process.argv[2]),r=Object.fromEntries(f.records.map(r=>[r.key,r.data]));console.log(JSON.stringify([a.plots(r['square-xor'])[0],a.plots(r.inside)[0],a.plots(r['two-intervals'])[1],a.plots(r['square-xor'])[3],a.plots(r['convex-eight'])[4],a.plots(r['zero-dimension'])[5]].map(a.svg)));"
plots=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve()),str(fixture.resolve())],text=True))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="4080" viewBox="0 0 1000 4080" role="img" aria-labelledby="title desc"><title id="title">VC：从凸包证据到删除递推与随机交换</title><desc id="desc">六面板依次呈现正方形与内部点的分离障碍、两段区间的增长、删除坐标的并集交集、固定样本交换分布，以及不同前提下的概率上界。</desc><rect width="1000" height="4080" fill="#fffdf7"/><g color="#263442" fill="#263442" font-family="system-ui,sans-serif"><text x="40" y="43" font-size="25">一组点能表达什么，怎样接到所有分布的保证？</text>']
names=['A · 正方形的 XOR：两类凸包在对角线交点相遇','B · 三角形与内部点：不可能标签不只来自对角线','C · 至多两段区间：VC=4，并且达到 Sauer 二项和','D · 正方形限制族：删除任意一位，都有 并集数+交集数=14','E · 凸八边形预设：条件于固定6对样本，枚举全部64种交换','F · 零维预设：两条界控制不同事件，并分别检查独立副本条件']
for i,(plot,name)in enumerate(zip(plots,names)):
 y=80+650*i
 out.append(f'<text x="40" y="{y+20}" font-size="17">{html.escape(name)}</text>')
 out.append(plot.replace('<svg ',f'<svg x="40" y="{y+42}" width="920" height="593" ',1))
out.append('<text x="40" y="4038" font-size="16">几何图两轴分别缩放；交换分布仅条件于固定样本。总体界须另满足文中的抽样前提。</text></g></svg>')
svg.write_text(''.join(out))
f=json.loads(fixture.read_text());rows=[]
for r in f['records']:
 s=r['data'];d=s['selectedDeletion']
 cells=[r['key'],str(s['parameters']['pointCount']),str(len(s['patterns'])),str(s['localDimension']),str(s['globalDimension']),'是'if s['selectedTarget']['feasible']else'否',f"{d['unionCount']} + {d['intersectionCount']} = {d['total']}",format(s['swap']['failureProbability'],'.9g')]
 rows.append('| '+' | '.join(cells)+' |')
text='**无脚本对照：**六份完整记录保存每个标签的见证或障碍、全部子集、全部删除坐标与全部随机交换。\n\n<figure class="plot" markdown="1">\n![正方形与内部点的凸包证据、两段区间的增长、删除递推、固定样本交换分布和有条件概率界六面板图。](assets/img/slt-02-vc-certificates.svg)\n<figcaption>A、B 的紫色空心圈表示两组凸包的共同点；C 区分精确增长和全体标签；D 检查并集与交集；E 只对固定配对的交换取概率；F 的两条界分别控制统一偏差与另有可实现前提的风险。两坐标轴分别缩放，视觉夹角不代表真实夹角。</figcaption>\n</figure>\n\n<div class="vc188-static" role="region" tabindex="0" aria-label="VC固定记录，可横向滚动" markdown="1">\n\n| 预设 | n | 限制数 | 局部维数 | 全局VC | 当前标签可实现 | 选定删除的并集+交集 | 条件交换尾概率 |\n|---|---:|---:|---:|---:|---|---|---:|\n'+'\n'.join(rows)+'\n\n</div>\n\n[下载六份完整记录](assets/learning/projects/vc-certificates/run-snapshot.json){download="vc-frozen-records.json"}。整数分离系数、严格间隔、Radon 仿射系数与交点、每个限制集合和交换符号均可逐项复核；统计界的小数是显示近似，其适用条件另外保存。\n'
md.write_text(text);print({'panels':6,'rows':6,'bytes':svg.stat().st_size})
