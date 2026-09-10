"""Explicit initial-condition and queue measurement boundaries."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="830" viewBox="0 0 1100 830" role="img" aria-labelledby="title desc">',
     '<title id="title">经典模型的条件不能省略</title><desc id="desc">上方比较Logistic三个初值；中间比较SIR的初始感染与移出条件；下方分开系统人数与总逗留时间的组成。</desc>',
     '<rect width="1100" height="830" fill="#faf8f3"/><g fill="#243344" font-family="Arial, PingFang SC, sans-serif">']
def text(x,y,s,size=17,anchor='start',color='#243344'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#d5d9db',dash=''):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-dasharray="{dash}"/>')
text(30,39,"同一个方程，初值和统计口径仍会改变答案",25)
text(70,84,"1. Logistic：r=0.35 /日，K=600 人",20)
X=lambda t:80+550*t/10
Y=lambda y:290-170*y/1200
for y in [0,600,1200]:line(80,Y(y),630,Y(y));text(70,Y(y)+5,str(y),14,'end')
for t in [0,5,10]:text(X(t),313,str(t),14,'middle')
for initial,color,dash in [(80,'#315f9d',''),(1200,'#814e92','7 4'),(0,'#39784f','3 4')]:
    values=[(i/16,0 if initial==0 else 600/(1+(600/initial-1)*math.exp(-.35*i/16)))for i in range(161)]
    d=' '.join(('M'if j==0 else'L')+f'{X(t):.12f} {Y(y):.12f}'for j,(t,y)in enumerate(values))
    out.append(f'<path data-initial="{initial}" d="{d}" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}" fill="none"/>')
text(630,342,"时间（日）",15,'end')
text(700,145,"蓝：80 → 600，上升",18,color='#315f9d')
text(700,187,"紫：1200 → 600，下降",18,color='#814e92')
text(700,229,"绿：0 → 0，没有自发增长",18,color='#39784f')
text(700,274,"正初值趋向 K；零初值是另一平衡。",16)
line(30,363,1070,363)
text(70,397,"2. SIR：β=0.6 /日，γ=0.2 /日，R₀=3",20)
for x,s0,i0,r0,label in [(70,.98,.02,0,'感染初期增长'),(420,.28,.02,.7,'已有移出人群，感染下降'),(770,1,0,0,'没有感染种子，始终为零')]:
    Re=3*s0;growth=i0*(.6*s0-.2)
    out.append(f'<g data-s0="{s0}" data-i0="{i0}" data-r0="{r0}" data-re="{Re}" data-growth="{growth}">')
    text(x,434,f's₀={s0:g}，i₀={i0:g}，r₀={r0:g}',16)
    text(x,468,f'Rₑ(0)={Re:g}；i′(0)={growth:.5f}',16)
    text(x,502,label,17)
    out.append('</g>')
line(30,533,1070,533)
text(70,567,"3. M/M/1：λ=0.8 /小时，μ=1 /小时，ρ=0.8",20)
for y,quantity,total,first,second,unit in [(635,'L',4,3.2,.8,'人'),(738,'W',5,4,1,'小时')]:
    text(70,y-36,('系统内人数'if quantity=='L'else'总逗留时间')+f' {quantity}={total:g} {unit}',18)
    for value,x,color,name in [(first,80,'#315f9d','waiting'),(second,80+100*first,'#a67724','service')]:
        out.append(f'<rect data-quantity="{quantity}" data-component="{name}" data-value="{value}" x="{x}" y="{y-21}" width="{100*value}" height="28" fill="{color}"/>')
    text(700,y,f'纯等待 {first:g} {unit} + 服务中 {second:g} {unit}',17)
text(70,805,"服务中平均人数是忙碌概率 0.8；每位顾客的平均服务时间是 1 小时。",18)
out.append('</g></svg>')
(ROOT/'math-course/images/model-02-classic-boundaries.svg').write_text('\n'.join(out)+'\n')
print('Built classic model boundaries figure')
