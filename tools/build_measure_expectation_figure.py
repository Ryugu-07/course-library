"""Finite exponential truncations and three spikes on identical axes."""
from pathlib import Path
from html import escape
import math
R=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1080" viewBox="0 0 1100 1080" role="img" aria-labelledby="title desc">',
'<title id="title">有限截断不相同，尖峰变窄不保证平均变小</title>',
'<desc id="desc">上方指数分布的丢弃尾部积分D与封顶积分C在T等于二时分别约0.594和0.865。下方相同宽度十六分之一的三个尖峰，高度四、十六、六十四，对应面积四分之一、一、四，所有坐标使用同一高度刻度。</desc>',
'<rect width="1100" height="1080" fill="#f8fafc"/>',
'<style>text{fill:#172b45;font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;font-size:17px}</style>']
def tx(x,y,s,size=17,anchor='start'):out.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px">{escape(str(s))}</text>')
def line(x,y,xx,yy,color='#bdcddd',w=1):out.append(f'<line x1="{x}" y1="{y}" x2="{xx}" y2="{yy}" stroke="{color}" stroke-width="{w}"/>')
tx(40,48,'从有限计算走到极限：先核对你平均的是哪个变量',26)
tx(40,94,'A. X~Exp(1)：上限相同，丢弃尾部与封顶仍是两种操作',21)
X=lambda t:105+210*t
Y=lambda v:405-230*v
for v in [0,.25,.5,.75,1]:
 line(105,Y(v),945,Y(v));tx(90,Y(v)+5,v,14,'end')
for t in range(5):tx(X(t),432,t,14,'middle')
tx(105,139,'有限期望',16);tx(945,460,'积分上限 T',16,'end')
for name,col,f in [('D','#477cbd',lambda t:1-(1+t)*math.exp(-t)),('C','#b27b28',lambda t:1-math.exp(-t))]:
 pts=[(X(i/40),Y(f(i/40)))for i in range(161)]
 out.append(f'<polyline data-integral="{name}" points="'+' '.join(f'{x:.9f},{y:.9f}'for x,y in pts)+f'" fill="none" stroke="{col}" stroke-width="3"/>')
 v=f(2);out.append(f'<circle data-at-two="{name}" cx="{X(2)}" cy="{Y(v)}" r="6" fill="{col}"/>')
 tx(565,Y(v)+25 if name=='D'else 160,name+'(2) = '+f'{v:.6f}',16)
line(X(2),Y(1-3*math.exp(-2)),X(2),Y(1-math.exp(-2)),'#247e5d',3)
tx(90,494,'蓝 D(T)：X>T 时记为 0',17);tx(515,494,'金 C(T)：X>T 时仍记为 T',17)
tx(90,532,'差 C(2)−D(2) = 2e⁻² ≈ 0.270671；两笔遗漏分别是 3e⁻² 和 e⁻²。',17)
line(40,563,1060,563)
tx(40,608,'B. 同一个 n=16：三条尖峰同样窄，面积却不同',22)
tx(40,648,'Xₙ(ω)=n^α 1{0<ω<1/n}。三图共用高度 0…64；横轴均为 ω∈[0,1]。',17)
for i,(alpha,height,area)in enumerate([(.5,4,.25),(1,16,1),(1.5,64,4)]):
 left=90+350*i;bottom=900;width=250
 for v in [0,16,32,48,64]:
  y=bottom-v*180/64;line(left,y,left+width,y);tx(left-8,y+5,v,13,'end')
 out.append(f'<rect data-spike-alpha="{alpha}" x="{left}" y="{bottom-height*180/64}" width="{width/16}" height="{height*180/64}" fill="{["#477cbd","#b27b28","#247e5d"][i]}" fill-opacity=".65"/>')
 tx(left,930,'0',13,'middle');tx(left+width,930,'1',13,'middle')
 tx(left+width/2,697,'α='+str(alpha),20,'middle')
 tx(left,965,'宽 1/16，高 '+str(height),17)
 tx(left,999,'面积 = '+str(area),20)
tx(40,1048,'每个固定 ω>0 都最终离开尖峰；平均是否趋于 0，还要看高度与尾部的统一控制。',17)
out.append('</svg>')
p=R/'grad-math/images/mt-01-measure-expectation.svg';p.write_text('\n'.join(out)+'\n');print(p)
