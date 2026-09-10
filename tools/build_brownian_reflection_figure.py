"""A labelled deterministic reflection schematic and analytic probability curves."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="620" viewBox="0 0 1100 620" role="img" aria-labelledby="title desc">',
     '<title id="title">首次达到之后反射：终点事件与路径事件</title>',
     '<desc id="desc">左图的人为折线在时间0.35首次达到阈值1；之后关于水平线1反射，终点从0.4变成1.6。右图显示标准布朗运动阈值1的终点尾概率及其两倍的最大值越界概率。</desc>',
     '<rect width="1100" height="620" fill="#faf8f3"/><g font-family="Arial, PingFang SC, sans-serif" fill="#243344">']
def text(x,y,value,size=17,anchor="start",color="#243344"):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(value)}</text>')
def line(x1,y1,x2,y2,color='#d4d8dc',dash=''):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-dasharray="{dash}"/>')
text(30,38,"终点回落，不代表路径从未越界",26)
text(30,73,"左图只解释反射操作；右图的概率关系由布朗运动的强 Markov 性与对称性证明。",18)
text(70,118,"首次达到 a=1 后反射",21);text(635,118,"a=1：两种事件的解析概率",21)
mx=lambda t:70+420*t
my=lambda y:440-300*(y+.2)/2.4
for y in [0,1,2]:line(70,my(y),490,my(y));text(58,my(y)+5,str(y),15,'end')
for t in [0,.25,.5,.75,1]:text(mx(t),465,str(t),14,'middle')
line(70,my(1),490,my(1),'#b64335','7 4')
points=[(0,0),(.2,.8),(.35,1),(.6,1.3),(.8,.2),(1,.4)]
reflected=[(t,y if t<=.35 else 2-y)for t,y in points]
for name,pts,color,dash in [('original',points,'#315f9d',''),('reflected',reflected,'#39734d','7 4')]:
    path=' '.join(('M'if i==0 else'L')+f'{mx(t)} {my(y)}'for i,(t,y)in enumerate(pts))
    out.append(f'<path data-series="{name}" d="{path}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}"/>')
    for t,y in pts:
        out.append(f'<circle cx="{mx(t)}" cy="{my(y)}" r="3" fill="{color}" data-series="{name}" data-time="{t}" data-value="{y}"/>')
line(mx(.35),my(1),mx(.35),440,'#b64335','3 4')
text(mx(.35),491,"示意首次达到时刻 0.35",15,'middle')
text(502,my(.4)+5,"原终点 0.4",16,color='#315f9d')
text(502,my(1.6)+5,"反射终点 1.6",16,color='#39734d')
text(70,530,"蓝实线：原折线；绿虚线：反射后的折线",17)
text(70,563,"两终点相加为 2a；这不是一次真实路径观测",16)
rx=lambda t:635+400*t/3
ry=lambda p:440-280*p
for value in [0,.5,1]:line(635,ry(value),1035,ry(value));text(622,ry(value)+5,str(value),14,'end')
for t in [0,1,2,3]:text(rx(t),465,str(t),14,'middle')
text(1035,491,"观察时长 T",16,'end')
for name,multiple,color in [('endpoint',1,'#9b6a12'),('maximum',2,'#315f9d')]:
    pts=[]
    for i in range(121):
        t=i/40;prob=0 if i==0 else multiple*.5*math.erfc(1/math.sqrt(2*t))
        pts.append((t,prob))
    path=' '.join(('M'if i==0 else'L')+f'{rx(t):.12f} {ry(prob):.12f}'for i,(t,prob)in enumerate(pts))
    out.append(f'<path data-probability="{name}" d="{path}" fill="none" stroke="{color}" stroke-width="3"/>')
    val=multiple*.5*math.erfc(1/math.sqrt(2))
    out.append(f'<circle cx="{rx(1)}" cy="{ry(val)}" r="4" fill="{color}" data-probability="{name}" data-time="1" data-value="{val:.17g}"/>')
    text(rx(1)+10,ry(val)+(22 if name=='endpoint'else-12),f'{val:.4f}',16,color=color)
text(635,530,"蓝：P(M_T ≥ 1)；金：P(B_T ≥ 1)",17)
text(635,563,"T=1 时：0.3173 与 0.1587；CDF 不是密度",16)
text(30,604,"连续路径的真实首次通过时间，通常早于首次被网格采样发现的时刻。",17,color='#52616e')
out.append('</g></svg>')
(ROOT/'math-course/images/stoch-04-brownian.svg').write_text('\n'.join(out)+'\n')
print('Built Brownian reflection figure')
