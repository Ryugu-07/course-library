"""Deterministic Coulomb energy diagram; wavelengths are vacuum model values."""
from pathlib import Path
from html import escape
ROOT = Path(__file__).resolve().parents[1]
R = 10973731.568160 * 1836.15267343 / 1837.15267343
hc = 1239.8419843320026
unit = hc * R / 1e9
parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 460" role="img" aria-labelledby="title desc">', '<title id="title">氢的 Coulomb 能级与两条真空谱线</title><desc id="desc">纵坐标是电子相对自由电子的能量，以电子伏特计。箭头从 n=2 到 1 和 n=3 到 2；模型包含质子约化质量，未包含精细和辐射修正。</desc>', '<style>text{font-family:system-ui,sans-serif;fill:#292722;font-size:14px} .small{font-size:13px}.level{stroke:#315f9d;stroke-width:2.5}.grid{stroke:#d7d0c2;stroke-width:1}</style><rect width="800" height="460" fill="#faf7ef"/><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#9b6a12"/></marker></defs>']
def text(x,y,t,extra=''):
 parts.append(f'<text x="{x}" y="{y}" {extra}>{escape(t)}</text>')
def line(x1,y1,x2,y2,extra=''):
 parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {extra}/>')
def sy(E):return 78-E/14*302
text(34,32,'氢原子：从能级间隔读谱线', 'style="font-size:20px;font-weight:650"')
text(34,55,'含有限质子质量的非相对论 Coulomb 模型；波长均为真空值', 'class="small"')
for E in [0,-2,-4,-6,-8,-10,-12,-14]:
 line(80,sy(E),450,sy(E),'class="grid"');text(68,sy(E)+5,str(E),'text-anchor="end"')
line(80,78,80,380,'stroke="#292722"')
text(34,242,'E / eV','transform="rotate(-90 34 242)"')
for n in [1,2,3]:
 E=-unit/n**2;y=sy(E);line(114,y,426,y,'class="level"');text(442,y+5,f'n={n}')
for high,low,x in [(2,1,202),(3,2,345)]:
 line(x,sy(-unit/high**2)+3,x,sy(-unit/low**2)-4,'stroke="#9b6a12" stroke-width="2.5" marker-end="url(#arrow)"')
text(500,95,'自由电子阈值 E=0')
text(500,139,'Lyman α：2p → 1s','style="font-weight:650"')
text(500,164,f'ΔE = {unit*(1-1/4):.6f} eV')
text(500,189,f'λ = {1e9/(R*(1-1/4)):.3f} nm')
text(500,239,'Balmer Hα：3p → 2s','style="font-weight:650"')
text(500,264,f'ΔE = {unit*(1/4-1/9):.6f} eV')
text(500,289,f'λ = {1e9/(R*(1/4-1/9)):.3f} nm')
text(500,339,'高激发层间距更小，光子能量更低。','class="small"')
text(500,363,'图只标 n=1、2、3；更高能级趋近 0。','class="small"')
text(34,416,'箭头选择合法的 p→s 通道；同一 n 层还有此图未展开的轨道与自旋态。','class="small"')
text(34,441,'能量轴是真实线性比例；小修正须另用放大尺度，不能靠随意拉开能级表示。','class="small"')
parts.append('</svg>')
(ROOT/'physics-course/images/atom-01-spectral-lines.svg').write_text('\n'.join(parts)+'\n')
