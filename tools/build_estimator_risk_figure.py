"""Exact Bernoulli risks; standalone SVG with explicit numerical axes."""
from pathlib import Path
from html import escape
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
def risk(n,p,a):return (n*p*(1-p)+a*a*(1-2*p)**2)/(n+2*a)**2
def build():
 s=['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="580" viewBox="0 0 1080 580" role="img" aria-labelledby="title desc">','<title id="title">Exact Bernoulli estimator risks</title><desc id="desc">Three sample sizes and three shrinkage strengths. Central improvements coexist with boundary bias.</desc>','<rect width="1080" height="580" fill="#faf7ef"/>']
 def text(x,y,v,size=14,anchor='start',color='#25251f'):s.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}" font-family="Arial,sans-serif">{escape(str(v))}</text>')
 text(30,34,'Same loss, different risk: shrinkage helps in some regions',21)
 text(30,62,'T_a = (K+a)/(n+2a), K ~ Binomial(n,p). Each panel compares the same three rules.')
 for panel,n in enumerate([5,20,100]):
  left=65+350*panel;top=120;width=285;height=290;bottom=top+height;ymax=max(risk(n,i/100, a)for a in [0,1,2]for i in range(101))*1.12
  text(left,98,f'n = {n}; vertical axis: MSE',16)
  for j in range(5):
   x=left+width*j/4;y=bottom-height*j/4
   s.append(f'<path d="M{x},{top}V{bottom} M{left},{y}H{left+width}" stroke="#d7d4cd" fill="none"/>')
   text(x,bottom+23,f'{j/4:g}',12,'middle');text(left-7,y+4,f'{ymax*j/4:.4f}',12,'end')
  for a,color,label in [(0,'#315f9d','a=0: sample proportion'),(1,'#39734d','a=1: Laplace'),(2,'#9463b5','a=2: stronger shrinkage')]:
   coords=[(left+width*i/600,bottom-height*risk(n,i/600,a)/ymax) for i in range(601)]
   assert all(top<=y<=bottom for x,y in coords)
   d=' '.join(('M' if i==0 else 'L')+f'{x:.7f},{y:.7f}'for i,(x,y)in enumerate(coords))
   s.append(f'<path data-curve="n{n}-a{a}" fill="none" stroke="{color}" stroke-width="2" d="{d}"/>')
   text(left,bottom+52+22*a,label,13,color=color)
 text(30,550,'Risk is expected squared error, not a probability density. There is no uniform winner here.',14)
 s.append('</svg>');output='\n'.join(s);ET.fromstring(output);p=ROOT/'math-course/images/stat-02-estimator-risk.svg';p.write_text(output);print(p)
if __name__=='__main__':build()
