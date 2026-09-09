from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 870" role="img" aria-labelledby="title desc">',
'<title id="title">球面、圆柱、鞍面的真实网格与探针曲率</title>',
'<desc id="desc">三张参数网格用等比例正投影绘制。红点为各自u=v=0的探针，红色法向、蓝色第一参数方向和金色第二参数方向都来自实际导数。下方列出探针处的主曲率、高斯曲率与平均曲率。</desc>',
'<rect width="1200" height="870" fill="#faf8f1"/>',
'<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#203447}.title{font-size:25px;font-weight:700}.label{font-size:20px}.small{font-size:17px}</style>',
'<defs>']
colors=['#b34e3d','#5278a5','#aa7a24']
for i,c in enumerate(colors):p.append(f'<marker id="arrow{i}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L7 3.5L0 7z" fill="{c}"/></marker>')
p.append('</defs>')
def text(x,y,s,cls='small',anchor='start'):
 p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
def project(q):return ((q[0]-q[1])/math.sqrt(2),(q[0]+q[1]-2*q[2])/math.sqrt(6))
text(30,46,'同样在空间里弯，曲率却可以为正、零或负','title')
text(30,89,'三图都是实际参数网格，全部线条显示、无遮挡；红点固定 u=v=0。每图横纵坐标同尺度。')
models=[
 ('sphere','球面 R=2',(-1.45,1.45),(-math.pi,math.pi),lambda u,v:(2*math.cos(u)*math.cos(v),2*math.cos(u)*math.sin(v),2*math.sin(u)),(1,0,0),[(0,0,1),(0,1,0)],
 ['外向法向 n=(1,0,0)','两主曲率：−1/2，−1/2','K=1/4；H=−1/2','所有切方向都同样弯（脐点）']),
 ('cylinder','圆柱 a=3/2',(-math.pi,math.pi),(-1.6,1.6),lambda u,v:(1.5*math.cos(u),1.5*math.sin(u),v),(1,0,0),[(0,1,0),(0,0,1)],
 ['外向法向 n=(1,0,0)','圆周方向：−2/3；轴向：0','K=0；H=−1/3','局部内在平直，仍有外在弯曲']),
 ('saddle','鞍面 z=u²−v²',(-.75,.75),(-.75,.75),lambda u,v:(u,v,u*u-v*v),(0,0,1),[(1,0,0),(0,1,0)],
 ['向上法向 n=(0,0,1)','原点两主曲率：2，−2','原点 K=−4；H=0','整片 H 不恒为0，非极小曲面'])
]
for i,(name,title,ur,vr,fn,n,dirs,notes) in enumerate(models):
 cx=200+400*i;text(cx,147,title,'label','middle')
 lines=[]
 for axis in range(2):
  for j in range(17):
   row=[]
   for k in range(61):
    u=ur[0]+(ur[1]-ur[0])*(j/16 if axis==0 else k/60)
    v=vr[0]+(vr[1]-vr[0])*(k/60 if axis==0 else j/16)
    row.append(fn(u,v))
   lines.append(row)
 probe=fn(0,0);world=[q for line in lines for q in line]+[tuple(probe[j]+d[j] for j in range(3)) for d in [(x,y,z) for x in [-1,1] for y in [-1,1] for z in [-1,1]]]
 pp=[project(q) for q in world];xs=[q[0] for q in pp];ys=[q[1] for q in pp]
 scale=min(335/(max(xs)-min(xs)),285/(max(ys)-min(ys)));ox=cx-scale*(max(xs)+min(xs))/2;oy=340+scale*(max(ys)+min(ys))/2
 def screen(q):a,b=project(q);return ox+scale*a,oy-scale*b
 p.append(f'<g data-model="{name}" data-scale="{scale:.15g}" data-origin-x="{ox:.15g}" data-origin-y="{oy:.15g}">')
 for j,row in enumerate(lines):
  d=' '.join(('M' if k==0 else 'L')+f'{screen(q)[0]:.9f} {screen(q)[1]:.9f}' for k,q in enumerate(row))
  p.append(f'<path d="{d}" fill="none" stroke="#5278a5" stroke-opacity=".48" stroke-width="1" data-grid-line="{j}"/>')
 x,y=screen(probe);p.append(f'<circle cx="{x:.9f}" cy="{y:.9f}" r="4" fill="#b34e3d" data-probe=""/>')
 for j,d in enumerate([n]+dirs):
  X,Y=screen(tuple(probe[k]+.75*d[k] for k in range(3)))
  p.append(f'<line x1="{x:.9f}" y1="{y:.9f}" x2="{X:.9f}" y2="{Y:.9f}" stroke="{colors[j]}" stroke-width="2" marker-end="url(#arrow{j})" data-direction="{j}"/>')
 p.append('</g>')
 text(cx,534,'探针：(u,v)=(0,0)','small','middle')
 for j,note in enumerate(notes):text(cx,577+38*j,note,'small','middle')
text(30,772,'本页约定 S=−dn、II(X,Y)=〈D_XY,n〉。翻转法向会改变 H 与同方向主曲率的符号，K 不变。')
text(30,814,'参数方向在这些探针处恰为主方向；一般点需解 h a = k g a，不能从坐标网格的外观直接认定。')
p.append('</svg>')
(ROOT/'math-course/images/dg-02-gaussian-curvature.svg').write_text('\n'.join(p)+'\n')
print('Three true parameter meshes, normals and probe curvatures rendered')
