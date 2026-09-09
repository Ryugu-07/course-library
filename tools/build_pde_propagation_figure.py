from pathlib import Path
from math import exp,sqrt,pi
r=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="660" viewBox="0 0 960 660" role="img" aria-labelledby="title desc">','<title id="title">观测点怎样读取初值</title><desc id="desc">在x等于5、t等于3时，输运特征脚点为2，波动依赖区间为2到8，都避开初值支撑负1到1。热积分则在负1到1内部处处为正。</desc>','<rect width="960" height="660" fill="#fbfaf7"/><g font-family="system-ui,sans-serif" fill="#252c36" font-size="14">']
def text(x,y,s,**a):p.append(f'<text x="{x}" y="{y}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+f'>{s}</text>')
def line(x1,y1,x2,y2,color='#818893',**a):p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+'/>')
text(36,33,'同一个观测点，三种读取初值的方式',font_size=22,font_weight=650)
for i,name in enumerate(['输运：沿一条线回到脚点','波动：沿两条线确定依赖区间']):
 left=65+465*i;right=430+465*i;top=95;bottom=295
 X=lambda x:left+(x+2)/11*(right-left)
 Y=lambda t:bottom-t/3*(bottom-top)
 text(left,70,name,font_size=17,font_weight=600)
 p.append(f'<rect x="{X(-1)}" y="{bottom-7}" width="{X(1)-X(-1)}" height="14" fill="#d3ad56" opacity=".75"/>')
 if i:p.append(f'<path id="wave-cone" d="M{X(2):.8f} {Y(0):.8f} L{X(5):.8f} {Y(3):.8f} L{X(8):.8f} {Y(0):.8f} Z" fill="#377cad" fill-opacity=".09" stroke="#377cad" stroke-width="2"/>')
 else:line(X(2),Y(0),X(5),Y(3),'#3b856f',id='transport-characteristic',stroke_width=3)
 for t in [0,1,2,3]:
  line(left,Y(t),right,Y(t),'#dbe0e4');text(left-12,Y(t)+5,str(t),text_anchor='end')
 for x in [-2,0,2,5,8]:text(X(x),bottom+28,str(x),text_anchor='middle')
 line(left,top,left,bottom);line(left,bottom,right,bottom)
 p.append(f'<circle cx="{X(5)}" cy="{Y(3)}" r="4" fill="#9f4b36"/>')
 text(X(5)+10,Y(3)-10,'(5, 3)');text(left-10,top-18,'t');text(right,bottom+28,'x',text_anchor='end')
 text(left,355,'初值支撑 [−1, 1]；脚点 2' if not i else '依赖区间 [2, 8]；ψ = 0 时仅读两端点',font_size=14)
text(65,403,'热：把初值乘以正权重，再把面积加起来',font_size=17,font_weight=600)
left=95;right=865;top=435;bottom=585
X=lambda y:left+(y+1)/2*(right-left)
Y=lambda v:bottom-v/.025*(bottom-top)
for v in [0,.01,.02]:
 line(left,Y(v),right,Y(v),'#dbe0e4');text(left-10,Y(v)+5,f'{v:g}',text_anchor='end')
for y in [-1,-.5,0,.5,1]:text(X(y),bottom+23,str(y),text_anchor='middle')
line(left,top,left,bottom);line(left,bottom,right,bottom)
d=[]
for j in range(501):
 y=-1+2*j/500;v=(1-abs(y))*exp(-(5-y)**2/12)/sqrt(12*pi);d.append(('M' if not j else 'L')+f'{X(y):.8f} {Y(v):.8f}')
p.append('<path id="heat-integrand" d="'+' '.join(d)+'" fill="#bc7144" fill-opacity=".2" stroke="#ac5b31" stroke-width="2"/>')
text(115,454,'(1−|y|) G₁(5−y, 3)',font_size=14);text(560,454,'面积 u(5,3) ≈ 0.02116395 > 0',font_size=14);text(right+17,bottom+23,'y');text(65,643,'图中阴影分别表示初值支撑、波动依赖区间和热积分面积；三者含义不同。',font_size=14)
p.append('</g></svg>');(r/'math-course/images/pde-02-propagation-footprints.svg').write_text('\n'.join(p)+'\n')
