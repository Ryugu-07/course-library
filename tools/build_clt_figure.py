"""Exact finite binomial CDFs, not Monte Carlo histograms."""
from pathlib import Path
import math,html,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
els=[]
def add(tag,**a):
 t=a.pop('text',None);attrs=' '.join(f'{k.replace("_","-")}="{html.escape(str(v),quote=True)}"'for k,v in a.items());els.append(f'<{tag} {attrs}>'+html.escape(t)+f'</{tag}>'if t is not None else f'<{tag} {attrs}/>')
def label(x,y,t,**kw):add('text',x=x,y=y,text=t,**kw)
def path(points,**kw):add('path',d=' '.join(('M'if i==0 else'L')+f'{x:.7f},{y:.7f}'for i,(x,y)in enumerate(points)),fill='none',**kw)
phi=lambda z:(1+math.erf(z/math.sqrt(2)))/2
add('rect',x=0,y=0,width=1080,height=580,fill='#faf8f2')
label(35,35,'A discrete CDF can converge to a continuous limit',font_size=23,font_weight=700)
label(35,67,'S ~ Binomial(n, 0.2); Z = (S - 0.2n) / sqrt(0.16n)',font_size=18)
records=[]
for j,n in enumerate([10,30,100]):
 left=60+j*350;top=130;w=285;h=300;sd=math.sqrt(.16*n)
 px=lambda z:left+(z+4)/8*w
 py=lambda v:top+h-v*h
 ps=[.8**n]
 for k in range(n):ps.append(ps[-1]*(n-k)/(k+1)*.25)
 cumulative=0;D=0;steps=[]
 for k,p in enumerate(ps):
  z=(k-.2*n)/sd;D=max(D,abs(cumulative-phi(z)),abs(cumulative+p-phi(z)));steps.append((z,cumulative,cumulative+p));cumulative+=p
 records.append((n,D,math.fsum(ps)))
 label(left,104,f'n = {n}; D = {D:.5f}',font_size=17,font_weight=700)
 for z in [-4,-2,0,2,4]:
  add('line',x1=px(z),x2=px(z),y1=top,y2=top+h,stroke='#d8d4ca');label(px(z),top+h+24,str(z),font_size=15,text_anchor='middle')
 for v in [0,.25,.5,.75,1]:
  add('line',x1=left,x2=left+w,y1=py(v),y2=py(v),stroke='#d8d4ca');label(left-8,py(v)+5,f'{v:g}',font_size=14,text_anchor='end')
 initial=sum(p for k,p in enumerate(ps)if(k-.2*n)/sd<-4)
 pts=[(px(-4),py(initial))]
 for z,before,after in steps:
  if -4<=z<=4:pts.extend([(px(z),py(before)),(px(z),py(after))])
 final=sum(p for k,p in enumerate(ps)if(k-.2*n)/sd<=4)
 pts.append((px(4),py(final)));path(pts,stroke='#315f9d',stroke_width=2,data_n=n)
 path([(px(-4+8*i/400),py(phi(-4+8*i/400)))for i in range(401)],stroke='#b64335',stroke_width=2,stroke_dasharray='7 4',data_normal=n)
 label(left+w/2,484,'z',font_size=17,text_anchor='middle')
label(60,525,'Blue: exact finite CDF (jumps shown vertically). Red: standard-normal CDF.',font_size=17)
label(60,552,'D = sup |F_n - Phi|, evaluated on both sides of every jump; not a sampling error.',font_size=16)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 580" role="img" aria-labelledby="t d"><title id="t">Binomial CDFs and central limit theorem</title><desc id="d">Exact sums of binomial masses for n 10, 30, 100 and p 0.2. Standardized variables remain discrete for each finite n.</desc><g font-family="system-ui,sans-serif" fill="#26251f">'+''.join(els)+'</g></svg>'
ET.fromstring(svg);target=root/'math-course/images/prob-05-clt.svg';target.write_text(svg)
print('Exact CDF checks:',records)
