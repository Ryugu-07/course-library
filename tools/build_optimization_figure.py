"""Deterministic, equal-unit phase portraits of the same SPD quadratic."""
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 640" role="img" aria-labelledby="title desc">',
       '<title id="title">同一椭圆碗上的换号收敛与增长发散</title>',
       '<desc id="desc">两个面板各自横纵等比例，左窗半宽3，右窗半宽8。初值、曲率和主轴相同，仅步长不同。完整绘制第0至12步。</desc>',
       '<rect width="1100" height="640" fill="white"/>','<g font-family="sans-serif" fill="#172b45">',
       '<text x="35" y="32" font-size="22">换号不等于发散：比较乘子的绝对值</text>',
       '<text x="35" y="60" font-size="15">μ=1，L=10，主轴 θ=30°，初始方向 φ=−20°；两边均画 12 步</text>']
theta=math.pi/6
c,s=math.cos(theta),math.sin(theta)
z0=(math.cos(-50*math.pi/180),math.sin(-50*math.pi/180))
e0=(z0[0]**2+10*z0[1]**2)/2
def text(x,y,t,size=13,anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{t}</text>'
for ident,center,extent,alpha in [('stable',290,3,.18),('unstable',830,8,.22)]:
    mx=lambda x:center+200*x/extent
    my=lambda y:320-200*y/extent
    def xy(a,b):return c*a-s*b,s*a+c*b
    parts+=[f'<g id="{ident}" data-extent="{extent}" data-center="{center}" data-alpha="{alpha}">',
            text(center-200,93,f'α={alpha}：快轴因子 {1-10*alpha:.1f}，'+('换号收敛'if ident=='stable'else'增长发散'),17),
            f'<defs><clipPath id="clip-{ident}"><rect x="{center-200}" y="120" width="400" height="400"/></clipPath></defs>']
    for t in [-1,-.5,0,.5,1]:
        v=t*extent
        parts+=[f'<path d="M{mx(v)} 120V520 M{center-200} {my(v)}H{center+200}" fill="none" stroke="#dbe1e7"/>',
                text(mx(v),542,f'{v:g}',12,'middle'),text(center-207,my(v)+4,f'{v:g}',12,'end')]
    parts.append(f'<g clip-path="url(#clip-{ident})">')
    for axis in [0,1]:
        a=xy(-extent*2 if axis==0 else 0,-extent*2 if axis==1 else 0)
        b=xy(extent*2 if axis==0 else 0,extent*2 if axis==1 else 0)
        parts.append(f'<path d="M{mx(a[0])} {my(a[1])}L{mx(b[0])} {my(b[1])}" fill="none" stroke="#7f8791" stroke-dasharray="6 5"/>')
    for frac in [.04,.16,.45,1]:
        radius=math.sqrt(2*e0*frac);points=[]
        for j in range(241):
            t=2*math.pi*j/240;x,y=xy(radius*math.cos(t),radius*math.sin(t)/math.sqrt(10));points.append((mx(x),my(y)))
        d=' '.join(('M'if i==0 else'L')+f'{x:.9f},{y:.9f}'for i,(x,y)in enumerate(points))
        parts.append(f'<path data-contour="{frac}" d="{d}" fill="none" stroke="#8997a8" stroke-width="1.2"/>')
    points=[]
    for k in range(13):
        z=(z0[0]*(1-alpha)**k,z0[1]*(1-10*alpha)**k)
        x,y=xy(*z);points.append((mx(x),my(y)))
    d=' '.join(('M'if i==0 else'L')+f'{x:.9f},{y:.9f}'for i,(x,y)in enumerate(points))
    parts.append(f'<path data-trajectory="true" d="{d}" fill="none" stroke="#315f9d" stroke-width="2.5"/>')
    for k,(px,py)in enumerate(points):
        parts.append(f'<circle data-k="{k}" cx="{px:.9f}" cy="{py:.9f}" r="2.6" fill="#315f9d"/>')
    for k,color,radius in [(0,'#39734d',6),(12,'#b64335',4)]:
        px,py=points[k];parts.append(f'<circle cx="{px}" cy="{py}" r="{radius}" fill="{"white"if k==0 else color}" stroke="{color}" stroke-width="2.5"/>')
    parts+=['</g>',text(center,574,f'横纵等比例；窗口 ±{extent}；绿环为初点，红点为末点',14,'middle'),'</g>']
parts+=['<text x="35" y="616" font-size="14">注意左右窗口范围不同。全局趋零要求 0＜α＜2/L；图中快轴均非零，故越界后会增长。</text>','</g></svg>']
target=ROOT/'math-course/images/opt-02-gradient-descent.svg'
target.write_text('\n'.join(parts)+'\n');print(target.relative_to(ROOT))
