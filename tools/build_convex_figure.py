"""Two exact polynomial examples: chord/tangent bounds and strict vs strong convexity."""
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 490" role="img" aria-labelledby="title desc">',
       '<title id="title">弦与切线的方向，以及严格凸与强凸的区别</title>',
       '<desc id="desc">左图对二次函数画真实弦和切线；右图比较x四次方与二分之x平方，展示正的二次下界在零附近失败。</desc>',
       '<rect width="1080" height="490" fill="white"/>','<g font-family="sans-serif" fill="#172b45">',
       '<text x="40" y="30" font-size="21">凸性给全局线性下界；强凸还要求统一二次下界</text>']
def text(x,y,value,size=13,anchor="start"):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{value}</text>'
for ident,left,xmin,xmax,ymin,ymax in [('quadratic',65,F(-2),F(5,2),F(-3,2),F(7,2)),('quartic',625,F(-1),F(1),F(0),F(11,10))]:
    mx=lambda x:left+390*float((x-xmin)/(xmax-xmin))
    my=lambda y:370-270*float((y-ymin)/(ymax-ymin))
    parts += [f'<g id="{ident}" data-left="{left}" data-xmin="{float(xmin)}" data-xmax="{float(xmax)}" data-ymin="{float(ymin)}" data-ymax="{float(ymax)}">',
              text(left,70,'f(x)=x²/2：弦在上，切线在下'if ident=='quadratic'else'f(x)=x⁴：严格凸仍可没有正的强凸常数',16)]
    for j in range(5):
        x=xmin+(xmax-xmin)*F(j,4)
        parts += [f'<path d="M{mx(x)} 100V370" stroke="#e1e5e9" fill="none"/>',text(mx(x),391,str(float(x)),12,'middle')]
    for j in range(4):
        y=ymin+(ymax-ymin)*F(j,3)
        parts += [f'<path d="M{left} {my(y)}H{left+390}" stroke="#e1e5e9" fill="none"/>',text(left-9,my(y)+4,f'{float(y):.2f}',12,'end')]
    def curve(name,fn,a,b,color,dash=""):
        xs=[a+(b-a)*F(i,240)for i in range(241)]
        d=' '.join(('M'if i==0 else'L')+f'{mx(x):.9f},{my(fn(x)):.9f}'for i,x in enumerate(xs))
        parts.append(f'<path data-curve="{name}" d="{d}" fill="none" stroke="{color}" stroke-width="2.5" {dash}/>')
    if ident=='quadratic':
        curve('quadratic',lambda x:x*x/2,xmin,xmax,'#315f9d')
        curve('chord',lambda x:x/4+F(3,2),F(-3,2),F(2),'#b64335','stroke-dasharray="7 4"')
        curve('tangent',lambda x:x/2-F(1,8),xmin,xmax,'#39734d')
        for x,y in [(F(-3,2),F(9,8)),(F(2),F(2)),(F(1,2),F(1,8))]:
            parts.append(f'<circle data-x="{float(x)}" data-y="{float(y)}" cx="{mx(x)}" cy="{my(y)}" r="4.5" fill="#b64335"/>')
        parts += [text(left,425,'红弦：x/4+3/2；绿切线：x/2−1/8',14),
                  text(left,451,'弦只在线段 [−1.5,2] 上比较；切线给全局下界。',13)]
    else:
        curve('quartic',lambda x:x**4,xmin,xmax,'#315f9d')
        curve('quadratic-bound',lambda x:x*x/2,xmin,xmax,'#b64335','stroke-dasharray="7 4"')
        x=F(1,2)
        for y in [x**4,x*x/2]:parts.append(f'<circle data-x="{float(x)}" data-y="{float(y)}" cx="{mx(x)}" cy="{my(y)}" r="4" fill="#b64335"/>')
        parts += [text(left,425,'蓝：x⁴；红：x²/2；在 x=0.5 时，1/16＜1/8。',14),
                  text(left,451,'图中反驳 μ=1；任意 μ＞0 的证明见练习 1。',13)]
    parts.append('</g>')
parts += ['</g></svg>']
target=ROOT/'math-course/images/opt-01-convex.svg'
target.write_text('\n'.join(parts)+'\n')
print(target.relative_to(ROOT))
