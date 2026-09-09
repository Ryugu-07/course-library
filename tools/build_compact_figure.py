"""Reproducible exact open-interval endpoints; no schematic coverage blobs."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1100" role="img" aria-labelledby="title desc">',
'<title id="title">有限子覆盖和永远存在的漏点</title>',
'<desc id="desc">上半部为闭区间的七个相对开邻域，半径十三除以六十；蓝色的U1、U3、U5已覆盖，灰色成员可以删去。下半部为开区间覆盖的四个有限子族，每行标出不属于该子族并集的点一除以二N。</desc>',
'<rect width="1200" height="1100" fill="#faf8f1"/>',
'<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#203447}.title{font-size:25px;font-weight:700}.label{font-size:19px}.small{font-size:17px}</style>']
def text(x,y,s,cls='small',anchor='start'):
 p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
def line(a,y,b,color='#5278a5',width=4,extra=''):
 p.append(f'<line x1="{a:.9f}" y1="{y}" x2="{b:.9f}" y2="{y}" stroke="{color}" stroke-width="{width}" {extra}/>')
def dot(x,y,color,included,extra=''):
 p.append(f'<circle cx="{x:.9f}" cy="{y}" r="5" fill="{color if included else "#faf8f1"}" stroke="{color}" stroke-width="2" {extra}/>')
X=lambda x:150+990*x
text(35,45,'有限子覆盖：删去哪些，仍能覆盖每一个点？','title')
text(35,86,'X=[0,1]；m=6，r=26/120=13/60；Uⱼ=(j/6−r,j/6+r)∩[0,1]。')
text(35,118,'实心端点包含，空心端点排除；蓝色 U₁、U₃、U₅ 已覆盖，灰色四个成员可删。')
line(X(0),168,X(1),'#203447',2)
for j in range(7):
 x=X(j/6);dot(x,168,'#203447',True);text(x,150,'0' if j==0 else '1' if j==6 else f'{j}/6',anchor='middle')
for j in range(7):
 y=222+43*j;lo=20*j-26;hi=20*j+26;c='#5278a5' if j in [1,3,5] else '#9da7ab'
 text(115,y+6,f'U{j}',anchor='end')
 line(X(max(0,lo)/120),y,X(min(120,hi)/120),c,5 if j in [1,3,5] else 2,f'data-cover-j="{j}"')
 dot(X(max(0,lo)/120),y,c,lo<0,f'data-left-j="{j}"')
 dot(X(min(120,hi)/120),y,c,hi>120,f'data-right-j="{j}"')
text(35,534,'这只是给定有限覆盖的删减实例。[0,1] 对任意开覆盖都能抽有限，另由 Heine–Borel 证明。')
text(35,565,'半径若改为 r=1/12（k=10），相邻开区间在被排除的端点处相接，仍然有漏点。')
line(35,605,1165,'#c3cace',1)
text(35,651,'非紧致：有限子族再大，仍能写出一个漏点','title')
text(35,691,'X=(0,1)；Uₙ=(1/n,1)，n≥2。每行是 U₂,…,U_N 的并 (1/N,1)。')
for i,N in enumerate([2,4,8,16]):
 y=750+67*i
 text(112,y+6,f'N={N}',anchor='end');line(X(0),y,X(1),'#d2d7d9',2)
 line(X(1/N),y,X(1),'#3b846c',5,f'data-open-N="{N}"')
 dot(X(1/N),y,'#3b846c',False);dot(X(1),y,'#3b846c',False)
 w=X(1/(2*N));dot(w,y,'#b34e3d',True,f'data-witness-N="{N}"')
 text(w,y+28,f'1/{2*N}',anchor='middle');text(X(1/N),y-14,f'1/{N}',anchor='middle')
text(35,1017,'红点 x=1/(2N) 属于 (0,1)，但小于每个已选成员的左端点；因此它不在有限并中。')
text(35,1052,'任意有限子族都有最大指标 N。原来的无限族覆盖全部 (0,1)，却没有有限子覆盖。')
p.append('</svg>')
(ROOT/'math-course/images/top-02-compact-cover.svg').write_text('\n'.join(p)+'\n')
print('Exact finite subcover and four finite-union witnesses rendered')
