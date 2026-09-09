from pathlib import Path
from math import sin,cos,pi,hypot,sqrt
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-labelledby="linear-title linear-desc">','<title id="linear-title">同样的相对右端扰动，不同的解漂移</title>','<desc id="linear-desc">三个单位行法向模型，90度敏感方向、5度敏感方向、5度非敏感方向。全部直线和点按真实参数及统一尺度绘制。</desc>','<rect width="1200" height="760" fill="#faf8f0"/>','<style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif;fill:#20364b}.title{font-size:26px;font-weight:700}.label{font-size:18px}.small{font-size:15px}</style>']
def text(x,y,s,cls='small',anchor='start'):p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#c6c4bc',width=1,more=''):p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" {more}/>')
text(30,46,'相同的 1% 右端扰动，交点可以移动得很不一样','title')
text(30,83,'固定 x*=(1,0)，b=A x*，每行法向长度为1；三图横纵同单位，并使用同一放大尺度。')
box=(-.65,1.65,-.7,.7);scale=145
def clip(a,b,r):
 lo,hi,bt,tp=box;pts=[]
 if b:
  for x in [lo,hi]:
   y=(r-a*x)/b
   if bt-1e-12<=y<=tp+1e-12:pts.append((x,y))
 if a:
  for y in [bt,tp]:
   x=(r-b*y)/a
   if lo-1e-12<=x<=hi+1e-12:pts.append((x,y))
 out=[]
 for v in pts:
  if all(hypot(v[0]-w[0],v[1]-w[1])>1e-10 for w in out):out.append(v)
 assert len(out)==2
 return out
for j,(deg,direction,title)in enumerate([(90,'min','直角：敏感与非敏感等价'),(5,'min','近乎平行：敏感方向'),(5,'max','同一个 A：换非敏感方向')]):
 left=30+j*395;cx=left+170;cy=320;c=0 if deg==90 else cos(deg*pi/180);ss=1 if deg==90 else sin(deg*pi/180)
 normb=hypot(1,c);db=(.01*normb/sqrt(2)*(-1 if direction=='min' else 1),.01*normb/sqrt(2));dx=(db[0],(db[1]-c*db[0])/ss);xh=(1+dx[0],dx[1]);forward=hypot(*dx)
 sigma_max=1 if deg==90 else sqrt(2)*cos(deg*pi/360);sigma_min=1 if deg==90 else sqrt(2)*sin(deg*pi/360);kappa=sigma_max/sigma_min
 p.append(f'<g data-angle="{deg}" data-direction="{direction}" data-scale="{scale}" data-cx="{cx}" data-cy="{cy}">')
 mx=lambda x:cx+scale*(x-.5);my=lambda y:cy-scale*y
 text(cx,135,title,'label','middle')
 for x in [0,.5,1,1.5]:
  line(mx(x),my(.7),mx(x),my(-.7));text(mx(x),my(-.7)+22,str(x),'small','middle')
 for y in [-.5,0,.5]:
  line(mx(-.65),my(y),mx(1.65),my(y));text(mx(-.65)-4,my(y)+5,str(y),'small','end')
 for a,b,r,color,shift in [(1,0,1,'#3c64a4',False),(c,ss,c,'#ad762b',False),(1,0,1+db[0],'#3c64a4',True),(c,ss,c+db[1],'#ad762b',True)]:
  (x1,y1),(x2,y2)=clip(a,b,r);more=f'data-a="{a}" data-b="{b}" data-rhs="{r}"'+(' stroke-dasharray="6 4"'if shift else'')
  line(mx(x1),my(y1),mx(x2),my(y2),color,2,more)
 line(mx(1),my(0),mx(xh[0]),my(xh[1]),'#b44435',2)
 p.append(f'<circle data-point="true" cx="{mx(1)}" cy="{my(0)}" r="7" fill="none" stroke="#26774d" stroke-width="2"/>')
 p.append(f'<circle data-point="shifted" cx="{mx(xh[0])}" cy="{my(xh[1])}" r="3.5" fill="#b44435"/>')
 text(mx(1)+10,my(0)+20,'x*');text(mx(xh[0])+10,my(xh[1])-12,'x̂')
 text(cx,493,f'θ={deg}°；κ₂={kappa:.5g}','label','middle')
 text(cx,529,'相对残差 ρ=1%','label','middle')
 text(cx,565,f'相对前向误差={forward*100:.5g}%','label','middle')
 text(cx,598,f'κ₂ρ 上界={kappa:.5g}%','small','middle')
 p.append('</g>')
text(30,653,'蓝/金实线：原方程；同色虚线：扰动方程。绿圈：原交点；红点：扰动交点。')
text(30,689,'几何点很接近时可能重合；读下方数值。条件数给最坏方向上界，不强迫每一次扰动都达到它。')
text(30,725,'此图展示实数扰动模型；实际计算还要另查输入舍入、消元误差，以及残差求值自身的精度。')
p.append('</svg>');(ROOT/'math-course/images/num-02-condition.svg').write_text('\n'.join(p)+'\n')
print('Built three exactly clipped equal-scale line-intersection models')
