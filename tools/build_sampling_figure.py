"""Analytic chi-square, t and F densities, reproducible without plotting libraries."""
from pathlib import Path
import math,html,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
def chi(x,nu):
 if x==0:return .5 if nu==2 else 0.
 return math.exp((nu/2-1)*math.log(x)-x/2-(nu/2)*math.log(2)-math.lgamma(nu/2))
def student(x,nu):return math.exp(math.lgamma((nu+1)/2)-math.lgamma(nu/2)-.5*math.log(nu*math.pi)-(nu+1)/2*math.log1p(x*x/nu))
def fisher(x,m,n):
 if x==0:return 0.
 return math.exp(math.lgamma((m+n)/2)-math.lgamma(m/2)-math.lgamma(n/2)+m/2*math.log(m/n)+(m/2-1)*math.log(x)-(m+n)/2*math.log1p(m*x/n))
els=[]
def add(tag,**a):
 t=a.pop('text',None);attrs=' '.join(f'{k.replace("_","-")}="{html.escape(str(v),quote=True)}"'for k,v in a.items());els.append(f'<{tag} {attrs}>'+html.escape(t)+f'</{tag}>'if t is not None else f'<{tag} {attrs}/>')
def label(x,y,t,**kw):add('text',x=x,y=y,text=t,**kw)
def path(pts,**kw):add('path',d=' '.join(('M'if i==0 else'L')+f'{x:.7f},{y:.7f}'for i,(x,y)in enumerate(pts)),fill='none',**kw)
add('rect',x=0,y=0,width=1080,height=660,fill='#faf8f2')
label(35,38,'Three sampling distributions, three constructions',font_size=23,font_weight=700)
label(35,70,'Independent standard normals generate the square sums and ratios.',font_size=17)
panels=[('Chi-square: sum of squares',0,20,.55,[(f'chi-{nu}',f'df={nu}',lambda x,nu=nu:chi(x,nu))for nu in [2,4,8]]),('t: Z / sqrt(U / df)',-5,5,.42,[(f't-{nu}',f'df={nu}',lambda x,nu=nu:student(x,nu))for nu in [1,4,12]]+[('normal','N(0,1)',lambda x:math.exp(-x*x/2)/math.sqrt(2*math.pi))]),('F: (U / m) / (V / n)',0,5,1.2,[(f'F-{m}-{n}',f'df=({m},{n})',lambda x,m=m,n=n:fisher(x,m,n))for m,n in [(5,5),(5,20),(20,5)]])]
colors=['#315f9d','#b64335','#39734d','#25251f']
for j,(title,a,b,ymax,curves)in enumerate(panels):
 left=60+j*350;top=140;w=285;h=300
 px=lambda x:left+(x-a)/(b-a)*w;py=lambda y:top+h-y/ymax*h
 label(left,110,title,font_size=16,font_weight=700)
 for k in range(5):
  x=a+(b-a)*k/4;y=ymax*k/4;add('line',x1=px(x),x2=px(x),y1=top,y2=top+h,stroke='#d8d4ca');label(px(x),top+h+23,f'{x:g}',text_anchor='middle',font_size=14);add('line',x1=left,x2=left+w,y1=py(y),y2=py(y),stroke='#d8d4ca');label(left-7,py(y)+5,f'{y:.2f}',text_anchor='end',font_size=14)
 for k,(ident,text,fn)in enumerate(curves):
  points=[]
  for i in range(601):
   x=a+(b-a)*i/600;y=fn(x);assert 0<=y<=ymax,(ident,x,y);points.append((px(x),py(y)))
  path(points,stroke=colors[k],stroke_width=2.2,data_curve=ident,stroke_dasharray='6 4'if ident=='normal'else'none')
  label(left,496+23*k,text,font_size=15,fill=colors[k])
label(60,605,'All curves are exact densities; probability is area. Supports extend beyond each finite plot.',font_size=16)
label(60,632,'t with df=1 is Cauchy: symmetry does not make its mean exist.',font_size=16)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 660" role="img" aria-labelledby="t d"><title id="t">Chi square, Student t and F densities</title><desc id="d">Three degrees of freedom per family; t also compared to standard normal. All densities computed from gamma-function formulas.</desc><g font-family="system-ui,sans-serif" fill="#26251f">'+''.join(els)+'</g></svg>'
ET.fromstring(svg);(root/'math-course/images/stat-01-sampling-dists.svg').write_text(svg);print('PASS: 10 analytic curves, 601 points each')
