"""An exact V4 / biquadratic-extension correspondence, not a decorative lattice."""
from pathlib import Path
from html import escape

ROOT=Path(__file__).resolve().parents[1]
pieces=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000" role="img" aria-labelledby="title desc">',
'<title id="title">Q(√2,√3) 的中间域与 V4 子群反序对应</title>',
'<desc id="desc">左侧 E 包含三个二次域，三个二次域包含 Q；右侧 V4 包含三个二阶子群，三个子群包含恒等子群。同色配对反转包含关系。下方为四个自同构在基 1、√2、√3、√6 上的精确符号。</desc>',
'<rect width="1200" height="1000" fill="#faf8f1"/>',
'<style>text{font-family:system-ui,-apple-system,sans-serif;fill:#203447} .title{font-size:23px;font-weight:700} .label{font-size:18px;font-weight:600} .small{font-size:15px} .edge{stroke:#abb5ba;stroke-width:2;fill:none}</style>']
def text(x,y,value,cls='small',anchor='start',attrs=''):
 pieces.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}" {attrs}>{escape(value)}</text>')
def line(x,y,X,Y,attrs=''):
 pieces.append(f'<path d="M{x} {y} L{X} {Y}" class="edge" {attrs}/>')
def node(x,y,label,detail,color,key):
 pieces.append(f'<rect x="{x-85}" y="{y-35}" width="170" height="82" rx="6" fill="{color}" stroke="#71818b" data-node="{key}"/>')
 text(x,y,label,'label','middle');text(x,y+27,detail,'small','middle')
text(30,38,'Galois 对应：固定的数越多，允许的对称越少','title')
text(30,74,'E = Q(√2,√3)，σ 只翻转 √2，τ 只翻转 √3；这是有限、正规、可分扩张。')
text(310,114,'中间域（大域在上）','label','middle')
text(910,114,'子群（大群在上）','label','middle')
for side,center,xs in [('field',310,[120,310,500]),('group',910,[720,910,1100])]:
 for i,x in enumerate(xs):
  line(center,217,x,295,f'data-edge="{side}:top:{i}"')
  line(x,377,center,465,f'data-edge="{side}:bottom:{i}"')
colors=['#dbe7f5','#f3e5bc','#d9eadb','#f0dcd5','#e1e4e7']
node(310,170,'E = Q(√2,√3)','[E:Q] = 4',colors[0],'field:0')
node(120,330,'Q(√3)','[K:Q] = 2',colors[1],'field:1')
node(310,330,'Q(√2)','[K:Q] = 2',colors[2],'field:2')
node(500,330,'Q(√6)','[K:Q] = 2',colors[3],'field:3')
node(310,500,'Q','[Q:Q] = 1',colors[4],'field:4')
node(910,170,'G = V₄','|G| = 4',colors[4],'group:4')
node(720,330,'{e,σ}','|H| = 2',colors[1],'group:1')
node(910,330,'{e,τ}','|H| = 2',colors[2],'group:2')
node(1100,330,'{e,στ}','|H| = 2',colors[3],'group:3')
node(910,500,'{e}','|H| = 1',colors[0],'group:0')
text(30,590,'同色为一对：K = Eᴴ；[E:K] = |H|， [K:Q] = 4/|H|。连线只表示包含，不表示配对。')
text(30,622,'例如固定 σ 要求 √2、√6 的系数都为零，所以 E^⟨σ⟩ = Q(√3)。')
text(30,678,'把抽象的“固定”化成四个系数的符号','label')
signs=[[1,1,1,1],[1,-1,1,-1],[1,1,-1,-1],[1,-1,-1,1]]
headers=['自同构','1','√2','√3','√6'];labels=['e','σ','τ','στ']
for i in range(5):
 for j in range(5):
  x=30+142*j;y=700+45*i
  value=headers[j] if i==0 else labels[i-1] if j==0 else '+' if signs[i-1][j-1]==1 else '−'
  fill='#e8ecec' if not i or not j else '#faf8f1'
  pieces.append(f'<rect x="{x}" y="{y}" width="142" height="45" fill="{fill}" stroke="#cbd3d5"/>')
  attrs=f'data-sign="{i-1},{j-1}"' if i and j else ''
  text(x+71,y+29,value,'label','middle',attrs)
text(790,746,'σ(a+b√2+c√3+d√6)','label')
text(790,783,'= a−b√2+c√3−d√6','label')
text(790,837,'与原值相等 ⇔ b=d=0')
text(790,877,'基的线性独立性保证逐项比较有效。')
text(30,968,'边界：Q(∛2)/Q 不是正规扩张，自同构群只有恒等，不能按次数 3 套这张对应图。')
pieces.append('</svg>')
target=ROOT/'math-course/images/alg-abs-02-galois-lattice.svg';target.write_text('\n'.join(pieces)+'\n')
print('Five exact intermediate fields, five subgroups, 12 inclusions and 16 signs rendered')
