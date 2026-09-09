from pathlib import Path
from fractions import Fraction as F
from html import escape
root=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" width="960" height="680" viewBox="0 0 960 680" role="img" aria-labelledby="title desc">','<title id="title">相同分支数，不同的长度极限</title><desc id="desc">标准Cantor与fat Cantor都每次将每个区间分成两段，但前者剩余长度趋零、后者趋于二分之一。下方点列是有限阶段的长度，极限由公式和测度连续性证明。</desc><rect width="960" height="680" fill="#fbfaf7"/><g font-family="system-ui,sans-serif" fill="#27313d" font-size="14">']
def text(x,y,s,**a):p.append(f'<text x="{x}" y="{y}" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+f'>{escape(s)}</text>')
def line(x1,y1,x2,y2,**a):p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#c7cdd2" '+ ' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items())+'/>')
text(35,34,'删去哪一段，比“分成几段”更关键',font_size=22,font_weight=650)
for i,mode in enumerate(['standard','fat']):
 left=70+470*i;wid=350;color=['#416fae','#a96c20'][i];text(left,72,'标准 Cantor：每段删去中间 1/3' if i==0 else 'fat Cantor：第 n 步每段删长 4⁻ⁿ',font_size=16)
 intervals=[(F(0),F(1))]
 for n in range(5):
  y=100+n*43;text(left-12,y+15,str(n),text_anchor='end')
  for j,(a,b)in enumerate(intervals):p.append(f'<rect id="{mode}-{n}-{j}" x="{left+wid*float(a):.9f}" y="{y}" width="{wid*float(b-a):.9f}" height="20" fill="{color}"/>')
  nxt=[]
  for a,b in intervals:
   gap=(b-a)/3 if not i else F(1,4**(n+1));nxt.extend([(a,(a+b-gap)/2),((a+b+gap)/2,b)])
  intervals=nxt
 text(left-14,90,'n',text_anchor='end');text(left,313,'0');text(left+wid,313,'1',text_anchor='end')
text(70,361,'长度账本：有限阶段的点，不是极限集合的像素',font_size=17,font_weight=600)
left=85;right=880;top=402;bottom=579
for v in [0,.5,1]:
 y=bottom-v*(bottom-top);line(left,y,right,y);text(left-12,y+5,str(v),text_anchor='end')
for n in [0,3,6,9,12]:text(left+(right-left)*n/12,bottom+25,str(n),text_anchor='middle')
for mode,color in [('standard','#416fae'),('fat','#a96c20')]:
 for n in range(13):
  v=F(2,3)**n if mode=='standard' else F(1,2)+F(1,2**(n+1));x=left+(right-left)*n/12;y=bottom-float(v)*(bottom-top);p.append(f'<circle id="length-{mode}-{n}" cx="{x:.9f}" cy="{y:.9f}" r="3.5" fill="{color}"/>')
text(180,424,'蓝：(2/3)ⁿ → 0');text(580,451,'金：1/2 + 2⁻⁽ⁿ⁺¹⁾ → 1/2');text(right,627,'阶段 n',text_anchor='end');text(70,654,'闭区间递减、初始长度有限 ⇒ 极限集合测度 = 阶段长度的极限。',font_size=16)
p.append('</g></svg>');(root/'math-course/images/real-01-cantor-lengths.svg').write_text('\n'.join(p)+'\n')
