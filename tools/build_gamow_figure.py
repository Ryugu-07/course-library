"""Reproducible mechanism figure; energies in keV, no external libraries."""
from pathlib import Path
from math import sqrt, exp
from html import escape
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
kt,eg=1.3,500.
e0=(eg*kt*kt/4)**(1/3); delta=4*sqrt(e0*kt/3); f0=3*e0/kt
p=['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="700" viewBox="0 0 960 700" role="img" aria-labelledby="title desc">', '<title id="title">Gamow 峰：两种指数代价的折中</title><desc id="desc">上图显示 E/kT、根号 EG/E 及其和 F；下图显示 exp(F0-F) 与局部高斯，后者的 1/e 全宽不是硬截止。能量单位 keV。</desc><rect width="960" height="700" fill="#fbfaf7"/><g font-family="system-ui,sans-serif" font-size="14" fill="#27313d">']
def text(x,y,s,**a):p.append(f'<text x="{x}" y="{y}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+f'>{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#c7cdd2',**a):p.append(f'<line x1="{x1:.8f}" y1="{y1:.8f}" x2="{x2:.8f}" y2="{y2:.8f}" stroke="{color}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+'/>')
def px(e):return 85+e*40
def curve(name,values,bottom,height,ymax,color,dash=''):
 d=' '.join(('M' if i==0 else 'L')+f'{px(e):.8f} {bottom-v/ymax*height:.8f}' for i,(e,v) in enumerate(values))
 p.append(f'<path id="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="2.5" stroke-dasharray="{dash}"/>')
text(35,35,'为什么既不是最低能量，也不是最高能量？',font_size=22,font_weight=650)
text(85,68,'指数代价：越大越受抑制（无量纲）',font_size=16)
for bottom,height,ymax,ticks in [(285,180,40,[0,10,20,30,40]),(590,190,1,[0,.5,1])]:
 for v in ticks:
  y=bottom-v/ymax*height;line(85,y,885,y);text(72,y+5,str(v),text_anchor='end')
 for e in [0,5,10,15,20]:text(px(e),bottom+23,str(e),text_anchor='middle')
 line(px(e0),bottom-height,px(e0),bottom,'#8c959e',stroke_dasharray='4 4')
 text(885,bottom+44,'相对能量 E / keV',text_anchor='end')
es=[.5+19.5*i/600 for i in range(601)]
curve('thermal-cost',[(e,e/kt) for e in es],285,180,40,'#416fae')
curve('tunnel-cost',[(e,sqrt(eg/e)) for e in es],285,180,40,'#a96c20')
curve('total-cost',[(e,e/kt+sqrt(eg/e)) for e in es],285,180,40,'#8e433e')
text(405,94,'蓝 E/kT     金 √(EG/E)     红 F = 两者之和')
text(85,361,'反应指数核 / 自身峰值（取 S 为常数）',font_size=16)
es=sorted(set([i/30 for i in range(601)]+[e0,e0-delta/2,e0+delta/2]))
curve('kernel',[(e,exp(f0-e/kt-sqrt(eg/e)) if e else 0) for e in es],590,190,1,'#416fae')
curve('gaussian',[(e,exp(-((e-e0)/(delta/2))**2)) for e in es],590,190,1,'#a96c20','6 4')
text(490,424,'蓝：完整指数核',fill='#416fae')
text(490,450,'金虚线：峰附近的高斯近似',fill='#a96c20')
text(490,481,f'E₀ = {e0:.4f} keV；Δ = {delta:.4f} keV')
y=590-190/exp(1);line(px(e0-delta/2),y,px(e0+delta/2),y,'#a96c20',stroke_width='2')
for e in [e0-delta/2,e0+delta/2]:line(px(e),y-6,px(e),y+6,'#a96c20')
text(px(e0),y+23,'高斯的 1/e 全宽 Δ',text_anchor='middle')
text(85,655,'kT = 1.3 keV，EG = 500 keV。峰外仍有贡献；高斯只近似局部形状。',font_size=16)
text(85,680,'狭窄共振、屏蔽或非热分布需另行处理，不能机械套用这张图。')
p.append('</g></svg>');svg='\n'.join(p)+'\n';ET.fromstring(svg)
(root/'physics-course/images/ap-03-gamow.svg').write_text(svg)
print({'E0':e0,'delta':delta,'F0':f0})
