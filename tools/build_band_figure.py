"""Two-orbital periodic chain; exact Bloch eigenvalues, not filled energy strips."""
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-labelledby="title desc"><title id="title">周期双原子链的两条能带</title><desc id="desc">跃迁t1为1，t2为0.6。横轴ka从负pi到pi，纵轴能量单位t1。价带顶负0.4，导带底0.4，全局隙0.8。每个k各有两个离散能量。</desc><rect width="800" height="450" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;font-size:14px;fill:#292722}.grid{stroke:#d7d0c2}.lower{fill:none;stroke:#315f9d;stroke-width:3}.upper{fill:none;stroke:#a65f18;stroke-width:3}</style>']
def text(x,y,t,extra=''):parts.append(f'<text x="{x}" y="{y}" {extra}>{t}</text>')
def sx(k):return 80+(k+math.pi)/(2*math.pi)*620
def sy(e):return 232-e*80
text(30,30,'能带是一条条 E(k) 曲线：全局禁带要比较整个区','style="font-size:20px;font-weight:650"')
text(30,57,'双原子周期链；t₁=1、t₂=0.6；蓝色下带填满，橙色上带为空')
parts.append(f'<rect x="80" y="{sy(.4)}" width="620" height="64" fill="#ecd69c" opacity=".55"/>')
for e in [-1.5,-1,-.5,0,.5,1,1.5]:
 parts.append(f'<line x1="80" x2="700" y1="{sy(e)}" y2="{sy(e)}" class="grid"/>');text(69,sy(e)+5,str(e),'text-anchor="end"')
for k,label in [(-math.pi,'−π'),(0,'0'),(math.pi,'π')]:
 parts.append(f'<line x1="{sx(k)}" x2="{sx(k)}" y1="90" y2="374" class="grid"/>');text(sx(k),397,label,'text-anchor="middle"')
for sign,cls in [(-1,'lower'),(1,'upper')]:
 pts=[]
 for i in range(501):
  k=-math.pi+2*math.pi*i/500;e=sign*math.sqrt(1.36+1.2*math.cos(k));pts.append(f'{sx(k):.4f},{sy(e):.4f}')
 parts.append(f'<polyline class="{cls}" points="{" ".join(pts)}"/>')
text(390,238,'所有 k 均无体能级：E ∈ (−0.4, 0.4)','text-anchor="middle"')
text(410,88,'上带 E₊','style="fill:#a65f18"');text(410,378,'下带 E₋','style="fill:#315f9d"')
text(30,220,'E / t₁','transform="rotate(-90 30 220)"');text(732,397,'ka')
text(30,432,'区界隙 0.8；这里恰为全局隙。一般材料不同 k 的能带可能重叠。')
parts.append('</svg>');(ROOT/'physics-course/images/solid-02-bands.svg').write_text('\n'.join(parts)+'\n')
