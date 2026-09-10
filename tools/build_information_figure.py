"""Two explicit scales and a sufficient compression example, in bits."""
from pathlib import Path
from decimal import Decimal as D, localcontext
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
def entropy(p):
    return -(p*p.ln()+(1-p)*(1-p).ln())/D(2).ln()
with localcontext() as ctx:
    ctx.prec=70
    a=D('.1');b=D('.2');t=a+b-2*a*b
    default=[float(1-entropy(a)),float(1-entropy(t))]
    a=D('.4999');t=2*a-2*a*a
    rare=[float(1-entropy(a)),float(1-entropy(t))]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="830" viewBox="0 0 1100 830" role="img" aria-labelledby="title desc">',
     '<title id="title">信息账本的三种读法</title><desc id="desc">上面用相同线性刻度比较默认信道互信息；中间用对数刻度显示近随机信道的极小非零信息；下面用独立噪声说明充分压缩不必恢复原始数据。</desc>',
     '<rect width="1100" height="830" fill="#faf8f3"/><g font-family="Arial, PingFang SC, sans-serif" fill="#243344">']
def text(x,y,s,size=18,color='#243344',anchor='start'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x1,y1,x2,y2):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#bdc7ce"/>')
text(35,42,'信息保留多少？先确认对象与刻度',26)
text(65,92,'1. 默认信道：η=0.1，ρ=0.2，总翻转概率 τ=0.26',21)
for i,(label,v,color) in enumerate(zip(['I(X;Y)','I(X;Z)'],default,['#315f9d','#986717'])):
    y=127+i*72
    text(65,y+23,label)
    out.append(f'<rect data-default="{i}" data-value="{v:.17g}" x="200" y="{y}" width="{600*v:.14f}" height="31" fill="{color}"/>')
    text(200+600*v+15,y+23,f'{v:.6f} bit',18,color)
line(200,255,800,255)
for t in [0,.25,.5,.75,1]:
    x=200+600*t;line(x,249,x,261);text(x,282,f'{t:g}',15,anchor='middle')
text(950,282,'线性刻度（bits）',16,anchor='end')
line(35,308,1065,308)
text(65,350,'2. 近随机信道：η=ρ=0.4999，信息仍非零',21)
text(65,386,'偏差从 2×10⁻⁴ 变为 4×10⁻⁸；互信息在小偏差时近似与偏差平方成正比。',17)
for power in [-16,-12,-8,-4,0]:
    x=200+650*(power+16)/16;line(x,426,x,515);text(x,541,f'10^{power}',15,anchor='middle')
for i,(v,color,y) in enumerate(zip(rare,['#315f9d','#986717'],[446,493])):
    x=200+650*(math.log10(v)+16)/16
    out.append(f'<circle data-rare="{i}" data-value="{v:.17g}" cx="{x:.14f}" cy="{y}" r="7" fill="{color}"/>')
    text(65,y+5,['I(X;Y)','I(X;Z)'][i],18,color)
    text(x+15,y+5,f'{v:.6e} bit',17,color)
text(1020,577,'对数刻度（bits）；零没有有限的对数坐标',16,anchor='end')
line(35,602,1065,602)
text(65,643,'3. 充分压缩：Y=(X,W) → Z=X，X 与 W 是独立均匀比特',21)
text(65,688,'原始观测有两个比特：目标 X + 无关噪声 W',19)
text(65,730,'I(X;Y)=1 bit  →  I(X;Z)=1 bit',23,'#315f9d')
text(65,776,'H(Y|Z)=1 bit：无法恢复 W，但关于 X 的信息全部保留。',19)
out.append('</g></svg>')
(ROOT/'math-course/images/info-02-information-ledger.svg').write_text('\n'.join(out)+'\n')
print('Built information ledger figure')
