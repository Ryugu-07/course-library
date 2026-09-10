"""Exact rational distribution curves; no imported lab or checker."""
from pathlib import Path
from fractions import Fraction as F
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
models=[
 ('mixing','可逆、非周期',[[F(4,5),F(1,5)],[F(3,10),F(7,10)]],[F(3,5),F(2,5)]),
 ('periodic','单向三循环',[[0,1,0],[0,0,1],[1,0,0]],[F(1,3)]*3),
 ('lazy-cycle','非可逆、仍混合',[[F(1,2),F(1,2),0],[0,F(1,2),F(1,2)],[F(1,2),0,F(1,2)]],[F(1,3)]*3)]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="610" viewBox="0 0 1100 610" role="img" aria-labelledby="title desc">',
     '<title id="title">逐步分布与Cesàro平均的总变差距离</title>',
     '<desc id="desc">从点质量零出发。三张图显示可逆混合链、三循环和带一半停留的单向三循环。蓝点表示逐步TV，绿方块表示从零到当前时刻的分布平均TV，金点线只在第一图给出可逆谱上界。</desc>',
     '<rect width="1100" height="610" fill="#faf8f3"/><g font-family="Arial, PingFang SC, sans-serif" fill="#243344">']
def text(x,y,s,size=17,anchor="start",color="#243344"):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(s)}</text>')
text(30,35,"逐步分布与平均分布：把两种收敛画在同一坐标上",25)
text(30,68,"统一从 δ₀ 出发；绿线在时刻 t 使用 M=t+1 项平均。三图的时间和 TV 尺度相同。",18)
for k,(name,title,m,pi) in enumerate(models):
    x0=65+360*k;top=140;bottom=420;width=270;height=280
    out.append(f'<g data-preset="{name}">')
    text(x0,112,title,21)
    mx=lambda t:x0+width*t/12
    my=lambda v:bottom-height*float(v)
    for y in [0,F(1,2),1]:
        out.append(f'<line x1="{x0}" y1="{my(y)}" x2="{x0+width}" y2="{my(y)}" stroke="#d4d8dc"/>')
        text(x0-9,my(y)+5,str(float(y)).rstrip('0').rstrip('.'),14,"end")
    for t in [0,3,6,9,12]:text(mx(t),444,str(t),14,"middle")
    text(x0+width,471,"t",17,"end")
    mu=[F(int(i==0))for i in range(len(m))];sums=[F(0)]*len(m);rows=[]
    for t in range(13):
        sums=[a+b for a,b in zip(sums,mu)]
        tv=sum(abs(a-b)for a,b in zip(mu,pi))/2
        av=sum(abs(a/F(t+1)-b)for a,b in zip(sums,pi))/2
        rows.append((tv,av))
        mu=[sum(mu[i]*m[i][j]for i in range(len(m)))for j in range(len(m))]
    for key,index,color in [('step',0,'#315f9d'),('average',1,'#39734d')]:
        pts=' '.join(('M'if t==0 else'L')+f'{mx(t)} {my(r[index]):.12f}'for t,r in enumerate(rows))
        dash=' stroke-dasharray="7 4"'if key=='average'else''
        out.append(f'<path d="{pts}" fill="none" stroke="{color}" stroke-width="2.5"{dash}/>')
        for t,r in enumerate(rows):
            value=r[index]
            attrs=f'data-series="{key}" data-time="{t}" data-value="{float(value):.17g}"'
            if key=='step':out.append(f'<circle cx="{mx(t)}" cy="{my(value):.12f}" r="3.5" fill="{color}" {attrs}/>')
            else:out.append(f'<rect x="{mx(t)-3}" y="{my(value)-3:.12f}" width="6" height="6" fill="{color}" {attrs}/>')
    if name=='mixing':
        pts=' '.join(('M'if t==0 else'L')+f'{mx(t)} {my(.5*math.sqrt(2/3)*2**(-t)):.12f}'for t in range(13))
        out.append(f'<path data-bound="reversible" d="{pts}" fill="none" stroke="#9b6a12" stroke-width="2" stroke-dasharray="3 4"/>')
        text(x0,504,"π=(0.6,0.4)，ρ*=1/2",16)
        text(x0,534,"上界系数约0.408248，真实系数0.4",14)
    elif name=='periodic':
        text(x0,504,"π=(1/3,1/3,1/3)，d=3",16)
        text(x0,534,"t=2,5,8,11时平均TV恰为0",15)
    else:
        text(x0,504,"L=(I+C)/2，ρ*=1/2",16)
        text(x0,534,"细致平衡失败；不画可逆谱证书",15)
    out.append('</g>')
text(30,578,"蓝实线/圆点：逐步 TV    绿虚线/方块：Cesàro 平均 TV    金点线：适用时的可逆谱上界",18)
out.append('</g></svg>')
(ROOT/'math-course/images/stoch-03-markov-convergence.svg').write_text('\n'.join(out)+'\n')
print('Built Markov convergence SVG')
