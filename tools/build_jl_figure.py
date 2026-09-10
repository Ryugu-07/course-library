"""Build the reviewed finite-map, prefix and covariance illustration."""
from pathlib import Path
import subprocess,json,html,shutil
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
js=ROOT/'course-shared/labs/jl-projection.js'
data=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({map:a.analyze(),prefix:a.prefixes(20260722,.2),cov:a.covariance(20260722,8)}))",str(js)],text=True))
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1560" viewBox="0 0 1100 1560" role="img" aria-labelledby="title desc"><title id="title">有限点集与连续方向的不同保证</title><desc id="desc">固定12点的66个距离、同一矩阵全部31个前缀、二维协方差的181个曲线节点和16方向覆盖网。图形节点不是随机定理的证明。</desc><rect width="1100" height="1560" fill="#faf7ef"/><g font-family="system-ui, sans-serif" fill="#253346">']
def text(x,y,s,size=20,anchor='start'):
 parts.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,color='#d7d9db'):
 parts.append(f'<line x1="{x1:.12g}" y1="{y1:.12g}" x2="{x2:.12g}" y2="{y2:.12g}" stroke="{color}" stroke-width="1.5"/>')
def circle(x,y,color,kind):
 parts.append(f'<circle data-kind="{kind}" cx="{x:.12g}" cy="{y:.12g}" r="4" fill="{color}"/>')
def axes(top,xmax,ymin,ymax):
 x=lambda v:135+900*v/xmax
 y=lambda v:top+300-220*(v-ymin)/(ymax-ymin)
 for i in range(5):
  xv=xmax*i/4;yv=ymin+(ymax-ymin)*i/4
  line(135,y(yv),1035,y(yv));text(120,y(yv)+6,f'{yv:.4g}',17,'end');text(x(xv),top+330,f'{xv:.4g}',17,'middle')
 return x,y
text(40,48,'有限抽样、概率定理、连续方向证书：三者各有自己的条件',25)
text(40,87,'所有图均可从本页固定矩阵与逐项账本复算；不把一次成功或失败当作定理。',19)
text(40,144,'① 固定12点：66个原始与投影平方距离',23)
m=data['map'];x,y=axes(160,3,0,3)
for slope in [.8,1,1.2]:line(x(0),y(0),x(1),y(slope),'#428458')
for p in m['pairs']:circle(x(p['originalSquared']/m['originalScale']),y(p['projectedSquared']/m['originalScale']),'#347fbd'if p['inside']else'#b6473f','pair')
text(1035,532,'横轴原始 d²/D*²；纵轴投影 d²/D*²',19,'end')
text(40,574,'seed 20260722，k=8，ε=0.2：16/66点对通过；红点也保留原始位置。',19)
text(40,644,'② 同一矩阵前缀：最坏点对偏差并不逐次下降',23)
x,y=axes(660,32,0,max(p['worst']for p in data['prefix'])*1.1)
for p in data['prefix']:circle(x(p['k']),y(p['worst']),'#347fbd','prefix')
text(1035,1032,'横轴 k；纵轴 max |rᵢⱼ−1|',19,'end')
text(40,1074,'从k=4到5，最坏偏差约0.959→1.327；每次都按新的√k缩放。',19)
text(40,1144,'③ 二维误差二次型：16个网点有明确的覆盖证明',23)
c=data['cov'];x,y=axes(1130,2*3.141592653589793,-c['op']*1.15,c['op']*1.15)
pts=' '.join(f'{x(p["theta"]):.12g},{y(p["q"]):.12g}'for p in c['grid'])
parts.append(f'<polyline data-kind="covariance" points="{pts}" fill="none" stroke="#347fbd" stroke-width="2"/>')
for p in c['net']:circle(x(p['theta']),y(p['q']),'#b6473f','net')
text(1035,1520,'θ（弧度）；uᵀBu；η=2 sin(π/32)，网界因子 1/(1−2η)',18,'end')
parts.append('</g></svg>')
out=ROOT/'grad-math/images/hdp-02-concentration.svg';out.write_text('\n'.join(parts)+'\n')
print('Wrote 66 pairs,31 prefixes,181 covariance nodes,16 net points')
