"""Reproducible analytic bivariate-normal slice figure (stdlib only)."""
from pathlib import Path
import math, html, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
rho=.6
probe=1.
phi=lambda x:math.exp(-x*x/2)/math.sqrt(2*math.pi)
cond=lambda y:phi((y-rho*probe)/math.sqrt(1-rho*rho))/math.sqrt(1-rho*rho)
els=[]
def add(tag,**a):
    text=a.pop('text',None)
    attrs=' '.join(f'{k.replace("_","-")}="{html.escape(str(v),quote=True)}"' for k,v in a.items())
    els.append(f'<{tag} {attrs}>'+html.escape(text)+f'</{tag}>' if text is not None else f'<{tag} {attrs}/>')
def label(x,y,t,**kw):add('text',x=x,y=y,text=t,**kw)
def path(points,**kw):add('path',d=' '.join(('M' if i==0 else 'L')+f'{x:.6f},{y:.6f}' for i,(x,y) in enumerate(points)),fill='none',**kw)
add('rect',x=0,y=0,width=1040,height=620,fill='#faf8f2')
label(40,38,'From a joint-density slice to a conditional density',font_size=23,font_weight=700)
label(40,68,'Standard bivariate normal: rho = 0.6; observed X = 1',font_size=17)
lx,ty,size=70,125,340
px=lambda x:lx+(x+3)/6*size
py=lambda y:ty+(3-y)/6*size
for v in range(-3,4):
    add('line',x1=px(v),x2=px(v),y1=ty,y2=ty+size,stroke='#d8d4ca')
    add('line',x1=lx,x2=lx+size,y1=py(v),y2=py(v),stroke='#d8d4ca')
    label(px(v),ty+size+23,str(v),text_anchor='middle',font_size=14)
    label(lx-10,py(v)+5,str(v),text_anchor='end',font_size=14)
for q in [1,2,3]:
    pts=[]
    for i in range(241):
        t=2*math.pi*i/240; x=math.sqrt(q)*math.cos(t); y=rho*x+math.sqrt(1-rho*rho)*math.sqrt(q)*math.sin(t)
        pts.append((px(x),py(y)))
    path(pts,stroke='#315f9d',stroke_width=2,data_q=q)
add('line',x1=px(probe),x2=px(probe),y1=ty,y2=ty+size,stroke='#b64335',stroke_width=2,stroke_dasharray='6 4')
add('circle',cx=px(probe),cy=py(.6),r=5,fill='#39734d')
label(70,105,'Joint density: q = 1, 2, 3 contours',font_size=16)
label(235,510,'X',font_size=17);label(27,300,'Y',font_size=17)
label(70,544,'q = (x² - 2 rho xy + y²)/(1 - rho²)',font_size=15)
label(70,569,'Equal coordinate scales; no random samples',font_size=14)
rx,ry,w,h=530,125,460,340
sx=lambda y:rx+(y+4)/8*w
sy=lambda f:ry+h-f/.55*h
for y in range(-4,5):
    add('line',x1=sx(y),x2=sx(y),y1=ry,y2=ry+h,stroke='#d8d4ca');label(sx(y),ry+h+23,str(y),text_anchor='middle',font_size=14)
for k in range(6):
    f=k/10;add('line',x1=rx,x2=rx+w,y1=sy(f),y2=sy(f),stroke='#d8d4ca');label(rx-10,sy(f)+5,f'{f:.1f}',text_anchor='end',font_size=14)
for name,fn,col in [('marginal',phi,'#315f9d'),('slice',lambda y:phi(probe)*cond(y),'#b64335'),('conditional',cond,'#39734d')]:
    path([(sx(-4+8*i/600),sy(fn(-4+8*i/600))) for i in range(601)],stroke=col,stroke_width=2.5,data_curve=name)
label(530,105,'Same y-axis: three different density functions',font_size=16)
label(750,510,'Y',font_size=17)
for i,(t,col) in enumerate([('Marginal phi(y): full integral = 1','#315f9d'),(f'Slice f(1,y): full integral = phi(1) = {phi(1):.5f}','#b64335'),('Conditional f(y | 1): divide slice by phi(1)','#39734d')]):
    label(530,540+24*i,t,font_size=14,fill=col)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 620" role="img" aria-labelledby="t d"><title id="t">Joint density, slice, and normalized conditional distribution</title><desc id="d">Rho 0.6, X fixed at 1. Conditional mean 0.6, variance 0.64. Both normal supports extend beyond the finite drawing window.</desc><g font-family="system-ui, sans-serif" fill="#26251f">'+''.join(els)+'</g></svg>'
ET.fromstring(svg)
target=ROOT/'math-course/images/prob-03-bivariate-normal.svg'
target.write_text(svg)
print(target)
