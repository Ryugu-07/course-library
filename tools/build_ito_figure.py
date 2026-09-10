"""Quadratic variation distribution and exact finite-sum bookkeeping."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="800" viewBox="0 0 1100 800" role="img" aria-labelledby="title desc">',
     '<title id="title">二次变差留下一个时间，积分留下半个修正</title><desc id="desc">上图显示T等于1时等长分割的二次变差标准差sqrt(2/n)；下图用四个明确增量核算左端和与梯形和。</desc>',
     '<rect width="1100" height="800" fill="#faf8f3"/><g font-family="Arial, PingFang SC, sans-serif" fill="#243344">']
def text(x,y,s,size=18,color='#243344',anchor='start'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#c8d0d7'):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5"/>')
text(35,42,'从增量平方和，走到 Itô 修正',26)
text(65,92,'1. T=1：二次变差 Qₙ 的总体标准差',21)
X=lambda n:100+500*(math.log2(n)-3)/9
Y=lambda v:320-200*v/.55
for v in [0,.25,.5]:
    line(100,Y(v),600,Y(v));text(88,Y(v)+5,f'{v:g}',14,anchor='end')
for n in [8,32,128,512,2048,4096]:text(X(n),344,str(n),14,anchor='middle')
pts=[(2**(3+j/20),math.sqrt(2/(2**(3+j/20))))for j in range(181)]
d=' '.join(('M'if j==0 else'L')+f'{X(n):.12f} {Y(v):.12f}'for j,(n,v)in enumerate(pts))
out.append(f'<path data-series="sd" d="{d}" fill="none" stroke="#315f9d" stroke-width="3"/>')
text(600,376,'分割段数 n（对数刻度）',16,anchor='end')
text(700,145,'E[Qₙ]=1；Var(Qₙ)=2/n',20)
text(700,190,'标准差 √(2/n)，不是路径误差上界。',17)
text(700,235,'网格趋零 ⇒ Qₙ 在 L² 中趋于 1。',17)
text(700,280,'每个有限 n 的 Qₙ 仍是随机变量。',17)
line(35,400,1065,400)
text(65,445,'2. 四个教学增量：0.5，−0.25，0.75，−0.5',21)
text(65,482,'给定的有限序列；连线用于核算，不宣称是完整 Brownian 路径。',17)
values=[0,.5,.25,1,.5]
X2=lambda j:100+125*j
Y2=lambda v:640-120*v
for v in [0,.5,1]:
    line(100,Y2(v),600,Y2(v));text(88,Y2(v)+5,f'{v:g}',14,anchor='end')
d=' '.join(('M'if j==0 else'L')+f'{X2(j)} {Y2(v)}'for j,v in enumerate(values))
out.append(f'<path data-series="finite-path" d="{d}" stroke="#315f9d" stroke-width="3" fill="none"/>')
for j,v in enumerate(values):
    out.append(f'<circle data-index="{j}" data-value="{v}" cx="{X2(j)}" cy="{Y2(v)}" r="5" fill="#315f9d"/>')
    text(X2(j),665,str(j),14,anchor='middle')
text(600,697,'节点编号（T=1）',16,anchor='end')
for y,label in [(526,'终点 B=0.5；平方和 Q=1.125'),(569,'左端和 (B²−Q)/2 = −0.4375'),(612,'梯形和 B²/2 = 0.125'),(655,'Itô 目标 (B²−T)/2 = −0.375')]:text(700,y,label,18)
text(65,756,'左端和 − Itô 目标 = −(Q−T)/2 = −0.0625；误差来自有限网格的二次变差。',19)
out.append('</g></svg>')
(ROOT/'math-course/images/sde-01-quadratic-variation.svg').write_text('\n'.join(out)+'\n')
print('Built Ito quadratic variation figure')
