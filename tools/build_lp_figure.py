"""Exact rational product polygon and piecewise shadow-price value function."""
from pathlib import Path
from fractions import Fraction as F
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 630" role="img" aria-labelledby="title desc">',
       '<title id="title">最优顶点的证书，以及影子价格的有效区间</title>',
       '<desc id="desc">左图为产品模型的五个真实顶点，最优点2,6利润36。右图固定a4和b12，最优利润随混合容量C为min(42,18+C,2.5C)，在12和24处转折。</desc>',
       '<rect width="1100" height="630" fill="white"/>','<g font-family="sans-serif" fill="#172b45">',
       '<text x="35" y="32" font-size="22">一个最优点，两种阅读：几何证书与资源边际</text>']
def text(x,y,t,size=13,anchor='start'):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{t}</text>'
for ident,left,xmax,ymax in [('polygon',75,F(8),F(8)),('value',635,F(30),F(50))]:
    mx=lambda x:left+400*float(F(x)/xmax);my=lambda y:505-400*float(F(y)/ymax)
    parts += [f'<g id="{ident}" data-left="{left}" data-xmax="{xmax}" data-ymax="{ymax}">',
              text(left,73,'a=4，b=12，C=18：最大化 3x+5y'if ident=='polygon'else'固定 a=4，b=12，改变混合容量 C',16),
              f'<defs><clipPath id="clip-{ident}"><rect x="{left}" y="105" width="400" height="400"/></clipPath></defs>']
    xticks=range(0,9,2)if ident=='polygon'else range(0,31,6)
    yticks=range(0,9,2)if ident=='polygon'else range(0,51,10)
    for x in xticks:parts += [f'<path d="M{mx(x)} 105V505" fill="none" stroke="#dce2e8"/>',text(mx(x),528,str(x),12,'middle')]
    for y in yticks:parts += [f'<path d="M{left} {my(y)}H{left+400}" fill="none" stroke="#dce2e8"/>',text(left-9,my(y)+4,str(y),12,'end')]
    parts.append(f'<g clip-path="url(#clip-{ident})">')
    def line(name,pts,color,width=2,dash=''):
        d=' '.join(('M'if i==0 else'L')+f'{mx(x):.9f},{my(y):.9f}'for i,(x,y)in enumerate(pts))
        parts.append(f'<path data-curve="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-dasharray="{dash}"/>')
    if ident=='polygon':
        points=[(0,0),(4,0),(4,3),(2,6),(0,6),(0,0)]
        d=' '.join(('M'if i==0 else'L')+f'{mx(x)},{my(y)}'for i,(x,y)in enumerate(points))+' Z'
        parts.append(f'<path data-polygon="true" d="{d}" fill="#315f9d" fill-opacity=".13" stroke="#315f9d" stroke-width="2.5"/>')
        for x in range(5):
            for y in range(7):
                if 3*x+2*y<=18:parts.append(f'<circle data-grid-x="{x}" data-grid-y="{y}" cx="{mx(x)}" cy="{my(y)}" r="2" fill="#315f9d"/>')
        line('x-limit',[(4,0),(4,8)],'#b13d32',1.5,'6 5')
        line('y-limit',[(0,6),(8,6)],'#b13d32',1.5,'6 5')
        line('mixed-limit',[(0,9),(6,0)],'#b13d32',1.5,'6 5')
        line('objective',[(0,F(36,5)),(8,F(12,5))],'#95670d',2.5,'4 5')
        parts.append(f'<circle cx="{mx(2)}" cy="{my(6)}" r="6" fill="#b13d32"/>')
        parts+=['</g>',text(mx(2)+10,my(6)-12,'(2,6)，利润 36',14),text(left,561,'金虚线：3x+5y=36；蓝区：全部可行点。',14),text(left,589,'原始松弛 (2,0,0)，对偶 u=(0,1.5,1)。',14),text(left+409,505,'x',14),text(left,98,'y',14)]
    else:
        line('value',[(0,0),(12,30),(24,42),(30,42)],'#315f9d',3)
        line('old-dual-bound',[(0,18),(30,48)],'#95670d',2,'6 5')
        for x,y in [(12,30),(18,36),(24,42)]:
            parts.append(f'<circle data-C="{x}" data-V="{y}" cx="{mx(x)}" cy="{my(y)}" r="5" fill="#b13d32"/>')
        parts+=['</g>',text(mx(9),my(15)+28,'斜率 2.5',13,'middle'),text(mx(18),my(36)+32,'斜率 1',13,'middle'),text(mx(27),my(42)+29,'斜率 0',13,'middle'),
                text(left,561,'蓝：实际 V(C)；金：旧证书上界 18+C。',14),text(left,589,'容量 24 以后，再加资源不再增加利润。',14),text(left+409,505,'C',14),text(left,98,'V(C)',14)]
    parts.append('</g>')
parts+=['</g></svg>']
target=ROOT/'math-course/images/opt-04-lp.svg';target.write_text('\n'.join(parts)+'\n');print(target.relative_to(ROOT))
