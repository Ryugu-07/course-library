"""Deterministic projection and conditioning figure; standard library only."""
from pathlib import Path
from math import sqrt
from html import escape
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists(): R=Path('/Users/karasuakamatsu/course-library')
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="650" viewBox="0 0 1080 650" role="img" aria-labelledby="title desc">',
'<title id="title">投影给出最短距离；近乎平行使交点敏感</title>',
'<desc id="desc">左图是固定第三坐标的正交截面，单位比例相同，MH垂直于平面截线HQ。右图绘制k从0.1到2的交点横坐标1减1除以k，不包含零。</desc>',
'<rect width="1080" height="650" fill="#faf8f1"/>',
'<style>text{font-family:system-ui,sans-serif;fill:#243746}.grid{stroke:#d9dedc;stroke-width:1}</style>']
def text(x,y,s,size=15,anchor='start'):out.append(f'<text x="{x}" y="{y}" font-size="{size}px" text-anchor="{anchor}">{escape(s)}</text>')
def line(x,y,X,Y,color='#b7c0c4',width=1,extra=''):out.append(f'<line x1="{x:.7f}" y1="{y:.7f}" x2="{X:.7f}" y2="{Y:.7f}" stroke="{color}" stroke-width="{width}" {extra}/>')
text(35,36,'投影为什么最短？近乎平行为什么不稳定？',23)
text(65,83,'A · 包含法向的真实二维截面',18)
sx=lambda s:80+85*s
sy=lambda r:470-85*r
for s in range(5):line(sx(s),sy(0),sx(s),sy(4));text(sx(s),495,str(s),anchor='middle')
for r in range(5):line(sx(0),sy(r),sx(4),sy(r));text(65,sy(r)+5,str(r),anchor='end')
text(435,493,'s');text(66,118,'r')
h=sqrt(3);s=1/sqrt(2);M=(s,2*h);H=(s,h);Q=(s+1.5,h)
line(sx(0),sy(h),sx(4),sy(h),'#a87920',4,'data-segment="plane"')
for a,b,col,key in [(M,H,'#b64335','MH'),(H,Q,'#39734d','HQ'),(M,Q,'#476d9d','MQ')]:
 line(sx(a[0]),sy(a[1]),sx(b[0]),sy(b[1]),col,3,f'data-segment="{key}"')
for name,p,dx,dy in [('M',M,-25,-10),('H',H,-25,22),('Q',Q,8,22)]:
 out.append(f'<circle data-point="{name}" cx="{sx(p[0]):.7f}" cy="{sy(p[1]):.7f}" r="5" fill="#243746"/>');text(sx(p[0])+dx,sy(p[1])+dy,name)
line(sx(s),sy(h+.15),sx(s+.15),sy(h+.15),'#243746',1.5)
line(sx(s+.15),sy(h+.15),sx(s+.15),sy(h),'#243746',1.5)
text(130,260,'MH = √3',anchor='end');text(230,230,'MQ = √5.25');text(180,343,'HQ = 1.5');text(265,300,'平面截线 r = √3')
text(65,533,'s 沿 u=(1,−1,0)/√2；r 沿 n=(1,1,1)/√3')
text(65,563,'横纵坐标单位比例相同；MH ⟂ HQ')
text(65,593,'MQ² = MH² + HQ² = 3 + 2.25 ≥ 3')
text(590,83,'B · h=1 时，交点 x* = 1−1/k',18)
xx=lambda k:605+400*(k-.1)/1.9
yy=lambda x:470-340*(x+10)/11
for k in [.1,.5,1,1.5,2]:line(xx(k),130,xx(k),470);text(xx(k),495,str(k),anchor='middle')
for x in [-10,-8,-6,-4,-2,0,1]:line(605,yy(x),1005,yy(x));text(590,yy(x)+5,str(x),anchor='end')
text(1020,492,'k');text(583,113,'x*')
points=[(.1+1.9*i/600,1-1/(.1+1.9*i/600)) for i in range(601)]
out.append('<path data-curve="intersection" d="'+' '.join(('M' if i==0 else 'L')+f'{xx(k):.7f},{yy(x):.7f}' for i,(k,x) in enumerate(points))+'" fill="none" stroke="#476d9d" stroke-width="3"/>')
text(630,533,'k 趋近 0⁺ 时，交点向负方向远离。')
text(630,563,'k=0 时平行；此处不连接穿过 k=0。')
text(630,593,'这是方程推导曲线，不是实验测量。')
out.append('</svg>')
p=R/'math-course/images/geo-01-projection.svg';p.write_text('\n'.join(out));print(p)
