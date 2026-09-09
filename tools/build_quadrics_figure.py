"""Six explicit parameterized quadrics with truthful highlighted sections."""
from pathlib import Path
from math import sin,cos,sqrt,pi
from html import escape
import json
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists():R=Path('/Users/karasuakamatsu/course-library')
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="970" viewBox="0 0 1200 970" role="img" aria-labelledby="title desc">','<title id="title">六类二次曲面及指定截面</title>','<desc id="desc">统一正交投影方向，蓝线为方程参数化，金线为指定切片，红点为退化切点；每幅图标出主轴，有限图窗不是曲面的边界。</desc>','<rect width="1200" height="970" fill="#faf8f1"/>','<style>text{font-family:system-ui,sans-serif;fill:#243746}</style>']
def txt(x,y,s,size=15,anchor='start'):out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{escape(s)}</text>')
txt(30,33,'六种标准形：曲面与切片一起读',24)
names=['椭球','单叶双曲面','双叶双曲面','椭圆抛物面','双曲抛物面','二次锥面']
equations=['u²+2v²+3w²=1','u²+v²−w²=1','u²−v²−w²=1','w=u²+v²','w=u²−v²','u²+v²=w²']
notes=['w=0：椭圆；w=1/√3：一点','w=−1,0,1：三个圆截面','u=±1.3：两片各有圆截面','w=1：圆；w=0：顶点','w=0：两条相交直线','w=±1：圆；w=0：锥顶']
records=[]
for panel in range(6):
 x0=400*(panel%3);y0=440*(panel//3);cx=x0+200;cy=y0+260
 def project(p):u,v,w=p;return[cx+60*sqrt(3)/2*(u-v),cy+60*((u+v)/2-w)]
 def path(points,role='mesh'):
  coords=[project(p) for p in points];col='#a87920' if role=='slice' else '#5278a5';width=2.8 if role=='slice' else .8
  key=f'{panel}-{len(records)}';out.append(f'<path data-quadric="{key}" data-role="{role}" d="'+ ' '.join(('M' if i==0 else 'L')+f'{x:.7f},{y:.7f}' for i,(x,y) in enumerate(coords))+f'" fill="none" stroke="{col}" stroke-width="{width}" opacity="'+('1' if role=='slice' else '.65')+'"/>')
  records.append(dict(id=key,panel=panel,role=role,points=points))
 def circle(fn,n=96):return [fn(2*pi*i/n) for i in range(n+1)]
 txt(x0+30,y0+76,f'{panel+1} · {names[panel]}',20);txt(x0+30,y0+104,equations[panel],17)
 for axis,name in enumerate(['u','v','w']):
  a=[0.,0.,0.];a[axis]=-1.8;b=a.copy();b[axis]=1.8;A=project(a);B=project(b)
  out.append(f'<path d="M{A[0]:.7f},{A[1]:.7f}L{B[0]:.7f},{B[1]:.7f}" stroke="#b0b8bd" stroke-width="1.2"/>');txt(B[0]+7,B[1]-5,name,14)
  q=[0.,0.,0.];q[axis]=1;X,Y=project(q);txt(X+5,Y+12,'1',10)
 if panel==0:
  for j in range(1,12):
   z=pi*j/12;path(circle(lambda t:[sin(z)*cos(t),sin(z)*sin(t)/sqrt(2),cos(z)/sqrt(3)]))
  for j in range(12):
   t=2*pi*j/12;path([[sin(z)*cos(t),sin(z)*sin(t)/sqrt(2),cos(z)/sqrt(3)] for z in [pi*i/60 for i in range(61)]])
  path(circle(lambda t:[cos(t),sin(t)/sqrt(2),0]),'slice');q=project([0,0,1/sqrt(3)]);out.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="4" fill="#b64335"/>')
 elif panel==1:
  for j in range(13):
   z=-1.3+2.6*j/12;path(circle(lambda t:[sqrt(1+z*z)*cos(t),sqrt(1+z*z)*sin(t),z]))
  for j in range(16):
   t=2*pi*j/16;path([[sqrt(1+z*z)*cos(t),sqrt(1+z*z)*sin(t),z] for z in [-1.3+2.6*i/60 for i in range(61)]])
  for z in [-1,0,1]:path(circle(lambda t:[sqrt(1+z*z)*cos(t),sqrt(1+z*z)*sin(t),z]),'slice')
 elif panel==2:
  for sign in [-1,1]:
   for j in range(1,11):
    r=.9*j/10;path(circle(lambda t:[sign*sqrt(1+r*r),r*cos(t),r*sin(t)]))
   for j in range(12):
    t=2*pi*j/12;path([[sign*sqrt(1+r*r),r*cos(t),r*sin(t)] for r in [.9*i/50 for i in range(51)]])
   r=sqrt(1.3**2-1);path(circle(lambda t:[sign*1.3,r*cos(t),r*sin(t)]),'slice')
 elif panel==3:
  for j in range(1,13):
   r=1.25*j/12;path(circle(lambda t:[r*cos(t),r*sin(t),r*r]))
  for j in range(16):
   t=2*pi*j/16;path([[r*cos(t),r*sin(t),r*r] for r in [1.25*i/50 for i in range(51)]])
  path(circle(lambda t:[cos(t),sin(t),1]),'slice');X,Y=project([0,0,0]);out.append(f'<circle cx="{X}" cy="{Y}" r="4" fill="#b64335"/>')
 elif panel==4:
  for j in range(17):
   a=-1.1+2.2*j/16;path([[a,b,a*a-b*b] for b in [-1.1+2.2*i/60 for i in range(61)]]);path([[b,a,b*b-a*a] for b in [-1.1+2.2*i/60 for i in range(61)]])
  for sign in [-1,1]:path([[t,sign*t,0] for t in [-1.1+2.2*i/60 for i in range(61)]],'slice')
 else:
  for z in [-1.3+2.6*j/12 for j in range(13)]:path(circle(lambda t:[abs(z)*cos(t),abs(z)*sin(t),z]))
  for j in range(16):
   t=2*pi*j/16;path([[z*cos(t),z*sin(t),z] for z in [-1.3,0,1.3]])
  for z in [-1,1]:path(circle(lambda t:[cos(t),sin(t),z]),'slice')
  X,Y=project([0,0,0]);out.append(f'<circle cx="{X}" cy="{Y}" r="4" fill="#b64335"/>')
 txt(x0+25,y0+435,notes[panel],15)
txt(30,929,'蓝：参数化线框　金：标注切片　红：退化为点的截面。各图同一投影方向与比例；空间坐标轴标出单位刻度。',16)
txt(30,952,'这是三维正交投影，不按屏幕长度测距；线框的采样范围与可见轮廓不是曲面的边界。',15)
out.append('</svg>');(R/'math-course/images/geo-02-quadrics.svg').write_text('\n'.join(out))
(R/'tools/fixtures/quadric-figure-points.json').write_text(json.dumps(records,separators=(',',':'))+'\n');print('six quadrics',len(records),'parameterized paths')
