from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">',
'<title id="title">抛物线的密切圆与二阶接触</title>',
'<desc id="desc">抛物线y=x²在顶点的曲率为2，密切圆圆心为(0,1/2)，半径1/2。左侧同尺度画出两条曲线及切向法向；右侧列出二阶导数和局部差值，圆与抛物线并不重合。</desc>',
'<rect width="1200" height="900" fill="#faf8f1"/>',
'<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#203447}.title{font-size:25px;font-weight:700}.label{font-size:20px}.small{font-size:17px}</style>',
'<defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="#203447"/></marker></defs>']
def text(x,y,s,cls='small',anchor='start'):
 p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x,y,X,Y,color='#a2adb6',width=1,extra=''):
 p.append(f'<line x1="{x}" y1="{y}" x2="{X}" y2="{Y}" stroke="{color}" stroke-width="{width}" {extra}/>')
X=lambda x:330+340*x
Y=lambda y:660-340*y
text(30,47,'密切圆：同一点、同一切向、同样的二阶弯曲','title')
text(30,88,'抛物线 y=x² 在 O=(0,0) 处：κ=2，R=1/κ=1/2，C=O+RN=(0,1/2)。')
text(320,147,'横纵坐标同尺度：340 像素 / 单位','label','middle')
line(X(-.8),Y(0),X(.85),Y(0),'#6d7e8c',1.5);line(X(0),Y(-.1),X(0),Y(1.15),'#6d7e8c',1.5)
for x in [-.5,.5]:
 line(X(x),Y(0)-5,X(x),Y(0)+5);text(X(x),Y(0)+31,str(x),anchor='middle')
for y in [.5,1]:
 line(X(0)-5,Y(y),X(0)+5,Y(y));text(X(0)-14,Y(y)+7,str(y),anchor='end')
text(X(.86),Y(0)+6,'x');text(X(0)+12,Y(1.14),'y')
p.append(f'<circle cx="{X(0)}" cy="{Y(.5)}" r="{340*.5}" fill="none" stroke="#b58237" stroke-width="3" data-osculating-circle=""/>')
pts=[(-.8+1.6*i/320) for i in range(321)]
d=' '.join(('M' if i==0 else 'L')+f'{X(x):.9f} {Y(x*x):.9f}' for i,x in enumerate(pts))
p.append(f'<path d="{d}" fill="none" stroke="#5278a5" stroke-width="3" data-parabola=""/>')
for x,y,name in [(0,0,'O'),(0,.5,'C')]:
 p.append(f'<circle cx="{X(x)}" cy="{Y(y)}" r="5" fill="#3b846c" data-point="{name}"/>')
 text(X(x)+13,Y(y)+19,name)
line(X(0),Y(0),X(.28),Y(0),'#203447',2,'marker-end="url(#arrow)"')
line(X(0),Y(0),X(0),Y(.28),'#203447',2,'marker-end="url(#arrow)"')
text(X(.28)+8,Y(0)-12,'T');text(X(0)+14,Y(.28),'N')
text(76,246,'蓝：y=x²');text(76,277,'金：x²+(y−1/2)²=1/4')
text(370,558,'R=1/2')
text(650,163,'二阶接触怎样核对？','label')
text(650,208,'圆的下半支：c(x)=1/2−√(1/4−x²)')
for i,(name,a,b) in enumerate([('值','f(0)=0','c(0)=0'),('一阶','f′(0)=0','c′(0)=0'),('二阶','f″(0)=2','c″(0)=2')]):
 y=268+50*i;text(650,y,name);text(746,y,a);text(932,y,b)
text(650,442,'c(x)=x²+x⁴+O(x⁶)','label')
text(650,480,'二阶相同，不表示在一段区间上相等。')
text(650,535,'x','small');text(752,535,'抛物线 x²');text(934,535,'圆下半支 c(x)')
for i,x in enumerate([.1,.2,.3]):
 y=575+39*i;c=.5-math.sqrt(.25-x*x)
 text(650,y,str(x));text(752,y,f'{x*x:.6f}');text(934,y,f'{c:.6f}')
text(30,778,'圆心沿主法向移动 R；半径取正。若 κ=0，不能用 R=1/κ 制造一个有限密切圆。')
text(30,817,'这里因抛物线与圆的对称性，三阶项也相同，差别从四阶开始；一般密切圆只要求二阶吻合。')
text(30,856,'密切圆描述一点附近的几何，不是把整段曲线拟合成一个圆。')
p.append('</svg>')
(ROOT/'math-course/images/dg-01-curvature.svg').write_text('\n'.join(p)+'\n')
print('Exact parabola, radius, center, T/N and second-order comparison rendered')
