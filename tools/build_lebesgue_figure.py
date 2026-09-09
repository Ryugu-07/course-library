from pathlib import Path
from math import sqrt
from html import escape
from xml.etree import ElementTree as ET
root=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="570" viewBox="0 0 960 570" role="img" aria-labelledby="title desc">','<title id="title">水平分层怎样成为简单函数积分</title><desc id="desc">函数f等于x乘2减x，定义域零到二。每层高四分之一，只在f至少为j除4的超水平集上计入该层。各层宽度依次为根号三、根号二、一、零，积分下和约为1.036566。</desc><rect width="960" height="570" fill="#fbfaf7"/><g font-family="system-ui,sans-serif" fill="#29313c" font-size="15">']
def text(x,y,s,**a):p.append(f'<text x="{x}" y="{y}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+f'>{escape(s)}</text>')
def line(x1,y1,x2,y2):p.append(f'<line x1="{x1}" x2="{x2}" y1="{y1}" y2="{y2}" stroke="#c4cbd3"/>')
text(35,36,'“按值域分层”怎样变成可复算的面积',font_size=22,font_weight=650)
text(70,82,'f(x)=x(2−x)，0≤x≤2',font_size=17)
left=75;right=440;top=120;bottom=355;X=lambda x:left+(right-left)*x/2;Y=lambda y:bottom-(bottom-top)*y/1.1
for y in [0,.25,.5,.75,1]:line(left,Y(y),right,Y(y));text(left-12,Y(y)+5,str(y),text_anchor='end',font_size=12)
for j in range(1,5):
 d=sqrt(1-j/4);a=1-d;b=1+d;p.append(f'<rect id="layer-{j}" x="{X(a):.9f}" y="{Y(j/4):.9f}" width="{X(b)-X(a):.9f}" height="{(bottom-top)/1.1/4:.9f}" fill="{["#c6d7ee","#a5c0e2","#83a9d5","#618fc5"][j-1]}" stroke="none"/>')
d=[]
for i in range(401):
 x=2*i/400;d.append(('M' if not i else 'L')+f'{X(x):.9f} {Y(x*(2-x)):.9f}')
p.append('<path id="function" d="'+' '.join(d)+'" fill="none" stroke="#354a65" stroke-width="2.5"/>')
for x in [0,.5,1,1.5,2]:text(X(x),bottom+26,str(x),text_anchor='middle',font_size=12)
text(right,bottom+51,'x',text_anchor='end');text(left-15,top-11,'f',text_anchor='end')
text(505,106,'每层高度 × 超水平集长度',font_size=17,font_weight=600)
for x,s in [(505,'j'),(555,'阈值 j/4'),(695,'长度'),(805,'该层面积')]:text(x,143,s,font_size=14)
for j,w in enumerate([sqrt(3),sqrt(2),1,0],1):
 y=155+j*43;line(505,y+14,915,y+14)
 for x,s in [(505,str(j)),(555,str(j/4)),(695,['√3','√2','1','0'][j-1]),(805,f'{w/4:.6f}')]:text(x,y,s,font_size=14)
text(505,379,'I₄=(√3+√2+1)/4 ≈ 1.036566',font_size=16)
text(70,444,'简单函数 s(x)=¼ Σⱼ₌₁⁴ 1_{f(x)≥j/4}，处处位于 f 下方。',font_size=16)
text(70,480,'除最高点外，误差 f−s < 1/4；在最高点误差为0，所以积分误差 ≤ 2/4。',font_size=15)
text(70,521,'真实积分 ∫₀² x(2−x)dx = 4/3。把层高改成1/8、1/16，误差预算继续缩小。',font_size=15)
p.append('</g></svg>');source='\n'.join(p)+'\n';ET.fromstring(source);(root/'math-course/images/real-02-riemann-vs-lebesgue.svg').write_text(source)
