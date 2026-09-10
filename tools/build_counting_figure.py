"""Finite object enumeration plus Pascal's identity; all labels are generated."""
from pathlib import Path
from html import escape
from math import comb
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="940" viewBox="0 0 1100 940" role="img" aria-labelledby="title desc">',
'<title id="title">计数先声明顺序：四组硬币组合、九条投币序列与Pascal分类</title>',
'<desc id="desc">金额5的数量组合分别对应1、4、3、1条有序投币序列。下方Pascal三角形显示按是否含指定元素分类，六选二等于五选一加五选二，即五加十等于十五。</desc>',
'<rect width="1100" height="940" fill="#f8fafc"/>',
'<style>text{font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;fill:#172b45;font-size:17px}.small{font-size:15px}</style>']
def text(x,y,s,size=17,anchor='start',fill=None):
 p.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px'+(f';fill:{fill}'if fill else '')+f'">{escape(str(s))}</text>')
def rect(x,y,w,h,color,stroke='none'):
 p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{color}" stroke="{stroke}"/>')
def line(x1,y1,x2,y2,color,width=2):
 p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>')
text(40,45,'同样凑 5 分：换顺序，算不算新方案？',29)
text(40,79,'面额 1、2、5，无限供应；同面额硬币不可区分。',17)
text(50,126,'A. 不计顺序：4 组数量',21)
text(590,126,'B. 计顺序：9 条完整序列',21)
solutions=[(5,0,0,1),(3,1,0,4),(1,2,0,3),(0,0,1,1)]
for i,(a,b,c,multiplicity)in enumerate(solutions):
 y=154+i*77;rect(45,y,460,63,'#e8eff7')
 text(65,y+25,f'1 分 × {a}，2 分 × {b}，5 分 × {c}')
 text(65,y+49,f'对应 {multiplicity} 条有序序列',15,fill='#41607f')
 p.append(f'<metadata data-combination="{a},{b},{c}" data-orders="{multiplicity}"/>')
sequences=[(1,1,1,1,1),(1,1,1,2),(1,1,2,1),(1,2,1,1),(2,1,1,1),(1,2,2),(2,1,2),(2,2,1),(5,)]
colors={1:'#2666a8',2:'#27846c',5:'#a76115'}
for i,seq in enumerate(sequences):
 y=146+i*35;text(590,y+23,f'{i+1}.',15)
 for j,v in enumerate(seq):
  rect(625+j*55,y,43,28,colors[v]);text(646.5+j*55,y+21,v,17,'middle','#ffffff')
 p.append(f'<metadata data-sequence="{",".join(map(str,seq))}"/>')
text(45,486,'1 + 4 + 3 + 1 = 9；不能把每组都除以同一个阶乘来“忽略顺序”。',17)
line(40,511,1060,511,'#c6d4e3')
text(45,553,'C. Pascal：按是否包含指定元素，分成不重不漏的两类',21)
for n in range(7):
 for k in range(n+1):
  x=285+(k-n/2)*61;y=590+n*43
  highlight=(n,k)in[(5,1),(5,2),(6,2)]
  if highlight:rect(x-24,y-21,48,31,'#e1eee8'if n==5 else'#fde6ce')
  text(x,y,comb(n,k),18,'middle')
  p.append(f'<metadata data-pascal-n="{n}" data-pascal-k="{k}" data-value="{comb(n,k)}"/>')
# Endpoints go between boxes rather than over the numbers.
line(193.5,816,217,828,'#27846c',2);line(254.5,816,231,828,'#27846c',2)
text(565,623,'从 6 个不同对象中选 2 个：',20)
text(565,668,'不含指定对象：从其余 5 个选 2 个 → 10',17)
text(565,707,'包含指定对象：再从其余 5 个选 1 个 → 5',17)
text(565,758,'总计 10 + 5 = 15',24)
text(565,802,'每个二元子集恰好落入其中一类。',17)
text(45,906,'系数的数值要与对象对上：空组合、空序列各算 1 种；这一初值使递推从金额 0 开始。',17)
p.append('</svg>')
target=ROOT/'math-course/images/graph-01-pascal.svg';target.write_text('\n'.join(p)+'\n');print(target)
