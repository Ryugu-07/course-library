"""Dimensionless Fermi-pressure mechanism figure, standard library only."""
from pathlib import Path
from math import sqrt,asinh,log10
from html import escape
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
def integral(x):
 if x<.5:
  coefficient=1;power=x**5;value=0
  for k in range(24):value+=coefficient*power/(5+2*k);coefficient*=-(2*k+1)/(2*k+2);power*=x*x
  return value
 return (x*(2*x*x-3)*sqrt(1+x*x)+3*asinh(x))/8
p=['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" role="img" aria-labelledby="title desc">','<title id="title">零温电子压力：两个幂律之间的连续过渡</title><desc id="desc">上图为无量纲积分I及NR、ER渐近式，下图为两近似式除以完整I。两轴为对数；比值1才与完整压力相同。</desc><rect width="960" height="720" fill="#fbfaf7"/><g font-family="system-ui,sans-serif" font-size="14" fill="#27313d">']
def text(x,y,s,**a):p.append(f'<text x="{x}" y="{y}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+f'>{escape(s)}</text>')
def line(x1,y1,x2,y2,**a):p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#c7cdd2" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+'/>')
def px(x):return 90+(log10(x)+2)*195
text(35,35,'先看费米动量，再决定能否用一个幂律',font_size=22,font_weight=650)
text(90,71,'无量纲压力积分 I(x)；纵横轴均为对数',font_size=16)
for v in [-10,-5,0,5,10]:
 y=314-(v+12)/22*215;line(90,y,870,y);text(76,y+5,'10^'+str(v),text_anchor='end')
for x in [.01,.1,1,10,100]:text(px(x),339,str(x),text_anchor='middle')
text(90,386,'近似压力 / 完整零温压力；比值 1 表示相同',font_size=16)
for v in [1,10,100]:
 y=611-log10(v)/2.2*180;line(90,y,870,y);text(76,y+5,str(v),text_anchor='end')
for x in [.01,.1,1,10,100]:text(px(x),636,str(x),text_anchor='middle')
for top,bottom in [(99,314),(431,611)]:line(px(1),top,px(1),bottom,stroke_dasharray='4 4')
xs=[10**(-2+4*j/600) for j in range(601)]
for name,fun,color,dash,bottom,height in [('exact',integral,'#416fae','',314,215),('nr',lambda x:x**5/5,'#a96c20','6 4',314,215),('er',lambda x:x**4/4,'#8e433e','3 3',314,215),('nr-ratio',lambda x:x**5/(5*integral(x)),'#a96c20','',611,180),('er-ratio',lambda x:x**4/(4*integral(x)),'#8e433e','',611,180)]:
 d=' '.join(('M' if i==0 else 'L')+f'{px(x):.8f} {bottom-((log10(fun(x))+12)/22 if bottom==314 else log10(fun(x))/2.2)*height:.8f}' for i,x in enumerate(xs))
 p.append(f'<path id="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="2.5" stroke-dasharray="{dash}"/>')
text(110,117,'蓝：I(x)；金：NR x⁵/5；红：ER x⁴/4')
text(560,469,'金 NR 在小 x 接近 1',fill='#a96c20')
text(560,495,'红 ER 在大 x 接近 1',fill='#8e433e')
text(870,666,'x = pF/(mₑc)',text_anchor='end',font_size=16)
text(90,696,'过渡区需要完整 EOS；正确的微观压力仍须接到星体结构方程。',font_size=16)
p.append('</g></svg>');svg='\n'.join(p)+'\n';ET.fromstring(svg)
(root/'physics-course/images/ap-04-mass-radius.svg').write_text(svg)
