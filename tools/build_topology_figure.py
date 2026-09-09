"""Exact seam sequence and explicit edge identifications."""
from pathlib import Path
from html import escape
import math,json
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1080" role="img" aria-labelledby="title desc">',
'<title id="title">连续双射的接缝与三种商空间</title>',
'<desc id="desc">参数t_n等于2π减1/n，显示n为1、4、16的三个精确位置及圆周像。像趋于(1,0)，参数却不趋于其逆像0。下方分别只粘一对边同向、只粘一对边反向、两对边同向，得到圆柱、Möbius带、环面。</desc>',
'<rect width="1200" height="1080" fill="#faf8f1"/>',
'<defs><marker id="blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7z" fill="#5278a5"/></marker><marker id="gold" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7z" fill="#9b761b"/></marker></defs>',
'<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#203447}.title{font-size:24px;font-weight:700}.label{font-size:19px;font-weight:600}.small{font-size:16px}</style>']
def text(x,y,t,cls='small',anchor='start'):
 p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(t)}</text>')
def line(x,y,X,Y,color='#91a0a9',width=2,marker=None,extra=''):
 end=f' marker-end="url(#{marker})"' if marker else ''
 p.append(f'<path d="M{x:.6f} {y:.6f} L{X:.6f} {Y:.6f}" stroke="{color}" stroke-width="{width}" fill="none"{end} {extra}/>')
def circle(x,y,r,color,fill,extra=''):
 p.append(f'<circle cx="{x:.9f}" cy="{y:.9f}" r="{r}" stroke="{color}" stroke-width="2" fill="{fill}" {extra}/>')
text(30,42,'连续双射为什么还不够？跟着一列点走到接缝','title')
text(30,80,'f : [0,2π) → S¹，f(t) = (cos t, sin t)；蓝色实心端点被包含，空心端点被排除。')
text(300,125,'定义域 [0,2π)','label','middle');text(920,125,'目标圆周 S¹','label','middle')
line(90,260,550,260,'#5278a5',3);circle(90,260,7,'#5278a5','#5278a5');circle(550,260,7,'#5278a5','#faf8f1')
text(90,296,'0','small','middle');text(565,235,'2π（不含）','small','middle')
circle(920,270,125,'#91a0a9','none');circle(1045,270,6,'#5278a5','#5278a5')
text(1072,254,'(1,0)','small')
line(614,210,726,210,'#5278a5',2,'blue');text(670,194,'f','label','middle')
colors=['#9564a1','#b77935','#3b846c'];samples=[]
for i,n in enumerate([1,4,16]):
 t=2*math.pi-1/n;sx=90+460*t/(2*math.pi);cx=920+125*math.cos(t);cy=270-125*math.sin(t)
 color=colors[i];circle(sx,260,4,color,color,f'data-source-n="{n}"');circle(cx,cy,4,color,color,f'data-image-n="{n}"')
 tx=300+80*i;ty=330+28*i;line(sx,268,tx,ty-19,color,1);text(tx,ty,f'n={n}','small','middle')
 text(cx-20,cy+8,'n='+str(n),'small','end')
 samples.append({'n':n,'t':t,'source':[sx,260],'image':[cx,cy],'unit':[math.cos(t),math.sin(t)]})
text(30,453,'tₙ = 2π−1/n 在实线中趋于 2π；在定义域内，它不趋于 0。')
text(30,484,'f(tₙ) → (1,0)，但 f⁻¹(f(tₙ)) = tₙ ↛ 0 = f⁻¹(1,0)：逆映射在接缝处不连续。')
line(30,520,1170,520)
text(30,567,'粘合规则要说完整：只粘一对，还是两对？','title')
rules=[('圆柱面','(0,t) ~ (1,t)','上下边不粘 → 两条边界圆',False,False),
('Möbius 带','(0,t) ~ (1,1−t)','上下边不粘 → 一条边界圆',True,False),
('环面','两对边都同向配对','所有边都粘 → 没有边界',False,True)]
for i,(title,rule,boundary,reverse,both) in enumerate(rules):
 x=55+390*i;y=655;w=270;h=235
 text(x+w/2,620,title,'label','middle')
 # Grey horizontal edges remain unpaired in the first two models.
 line(x,y,x+w,y,'#9b761b' if both else '#abb5ba',3)
 line(x,y+h,x+w,y+h,'#9b761b' if both else '#abb5ba',3)
 line(x,y+h,x,y,'#5278a5',3,extra=f'data-glue="{i}:left"')
 line(x+w,y+h,x+w,y,'#5278a5',3,extra=f'data-glue="{i}:right"')
 line(x,y+h*.66,x,y+h*.36,'#5278a5',3,'blue')
 line(x+w,y+h*(.36 if reverse else .66),x+w,y+h*(.66 if reverse else .36),'#5278a5',3,'blue',extra=f'data-orientation="{i}:{-1 if reverse else 1}"')
 if both:
  for yy in [y,y+h]:line(x+w*.36,yy,x+w*.66,yy,'#9b761b',3,'gold',extra='data-horizontal-pair="torus"')
 text(x-3,y+h+24,'0','small','middle');text(x+w+3,y+h+24,'1','small','middle')
 text(x+w/2,y+111,'[0,1]²','label','middle')
 text(x+w/2,947,rule,'small','middle');text(x+w/2,978,boundary,'small','middle')
 if both:text(x+w/2,1006,'(s,0) ~ (s,1)','small','middle')
text(30,1052,'同色箭头规定参数对应；灰边不配对。两对都粘且其中一对反向，得到 Klein 瓶，不是 Möbius 带。')
p.append('</svg>')
(ROOT/'math-course/images/top-01-homeomorphism.svg').write_text('\n'.join(p)+'\n')
(ROOT/'tools/fixtures/topology-figure-points.json').write_text(json.dumps(samples,indent=2)+'\n')
print('Exact seam sequence and cylinder/Möbius/torus edge rules rendered')
