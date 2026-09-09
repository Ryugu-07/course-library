from pathlib import Path
from math import sin,cos,pi
from html import escape
import json
R=Path(__file__).resolve().parents[1]
if not (R/'math-course').exists():R=Path('/Users/karasuakamatsu/course-library')
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1080" viewBox="0 0 1200 1080" role="img" aria-labelledby="title desc">','<title id="title">循环群、陪集商表与二色环轨道</title>','<desc id="desc">上方显示加一的循环及模4加法表，按偶奇分类得到C2商表。下方完整列出16种四位置二色着色的6个旋转轨道及稳定子大小。</desc>','<rect width="1200" height="1080" fill="#faf8f1"/>','<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#5278a5"/></marker></defs>','<style>text{font-family:system-ui,sans-serif;fill:#243746}</style>']
def txt(x,y,s,size=15,anchor='start',extra=''):out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" {extra}>{escape(str(s))}</text>')
def rect(x,y,w,h,fill='#faf8f1',stroke='#c8d1d4',extra=''):out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" {extra}/>')
txt(30,38,'同一个“分块”想法：商掉子群，或把着色按对称归类',24)
txt(35,89,'A · C₄：每次加1，四次回到0',19)
for i in range(4):
 t=pi*i/2;T=pi*(i+1)/2;x,y=200+90*cos(t+.3),235-90*sin(t+.3);X,Y=200+90*cos(T-.3),235-90*sin(T-.3)
 out.append(f'<path data-cycle="{i}" d="M{x},{y}A90,90 0 0,0 {X},{Y}" fill="none" stroke="#5278a5" stroke-width="2" marker-end="url(#arrow)"/>')
for i in range(4):
 t=pi*i/2;x,y=200+90*cos(t),235-90*sin(t);out.append(f'<circle cx="{x}" cy="{y}" r="22" fill="'+('#dbe7f4' if i%2==0 else '#f1e3bf')+'" stroke="#5278a5"/>');txt(x,y+6,i,20,'middle')
txt(200,241,'+1 mod 4',17,'middle');txt(55,375,'蓝底：偶数块 H₀={0,2}',15);txt(55,403,'金底：奇数块 H₁={1,3}',15)
txt(420,89,'B · Cayley 表：行 + 列（模4）',19)
for i in range(5):
 for j in range(5):
  x=435+60*j;y=125+52*i;v='+' if i==j==0 else j-1 if i==0 else i-1 if j==0 else (i+j-2)%4;fill='#e6e9e7' if i==0 or j==0 else '#dbe7f4' if v%2==0 else '#f1e3bf'
  rect(x,y,60,52,fill);txt(x+30,y+33,v,19,'middle',f'data-cayley="{i-1},{j-1}"' if i and j else '')
txt(430,417,'每格既是元素，也标出它属于哪一块。',15)
txt(830,89,'C · 商群 C₄ / H₀ ≅ C₂',19)
for i in range(3):
 for j in range(3):
  x=850+85*j;y=160+65*i;v='+' if i==j==0 else 'H'+str(j-1) if i==0 else 'H'+str(i-1) if j==0 else 'H'+str((i+j-2)%2)
  rect(x,y,85,65,'#e6e9e7' if i==0 or j==0 else '#dbe7f4' if v=='H0' else '#f1e3bf');txt(x+42.5,y+41,v,19,'middle',f'data-quotient="{i-1},{j-1}"' if i and j else '')
txt(835,391,'例如奇数 + 奇数总落在偶数块。',15);txt(835,419,'块的结果不依赖所选代表元。',15)
txt(30,485,'D · 16 种着色，按 C₄ 旋转分成 6 个轨道',22)
txt(30,516,'位置0从顶端起顺时针编号；蓝实心=1，空心=0。颜色互换和翻折不在这里的对称规则中。',15)
seen=set();orbits=[]
for mask in range(16):
 if mask in seen:continue
 bits=f'{mask:04b}';members=sorted({int(bits[k:]+bits[:k],2) for k in range(4)});seen.update(members);orbits.append(members)
for i,members in enumerate(orbits):
 x0=20+395*(i%3);y0=548+222*(i//3);rect(x0,y0,380,205,'#faf8f1','#c8d1d4',f'data-orbit="{i}"')
 txt(x0+14,y0+28,f'轨道 {i+1}：{len(members)} 个结果；稳定子大小 {4//len(members)}',16)
 for j,mask in enumerate(members):
  cx=x0+48+94*j;cy=y0+99
  out.append(f'<circle cx="{cx}" cy="{cy}" r="23" fill="none" stroke="#c8d1d4"/>')
  for k in range(4):
   t=pi*k/2-pi/2;one=(mask>>(3-k))&1;out.append(f'<circle data-bead="{mask}:{k}" cx="{cx+23*cos(t)}" cy="{cy+23*sin(t)}" r="6" fill="'+('#5278a5' if one else '#faf8f1')+'" stroke="#5278a5" stroke-width="1.5"/>')
  txt(cx,cy+52,f'{mask:04b}',14,'middle',f'data-coloring="{mask}"')
 txt(x0+14,y0+186,f'轨道—稳定子：4 = {len(members)} × {4//len(members)}',15)
txt(30,1026,'Burnside：固定着色数为 16、2、4、2，平均 (16+2+4+2)/4 = 6。直接按轨道分块也得到6类。',17)
txt(30,1056,'上方商群的元素是陪集；下方作用的对象是着色。稳定子无需正规，轨道集合也不自动成为群。',15)
out.append('</svg>');(R/'math-course/images/alg-abs-01-cyclic-group.svg').write_text('\n'.join(out));print('C4 Cayley/quotient and all16 colorings rendered')
