"""Draw the actual eight heat singular values and zero-order filter factors."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
items=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="970" viewBox="0 0 1100 970" role="img" aria-labelledby="title desc">',
'<title id="title">热衰减、正则收缩与一个可复算的第六模态</title>',
'<desc id="desc">左图是三个测量时刻的八个奇异值，采用以十为底的对数坐标。右图在一秒时显示三个正则参数的信号保留比例。底部用第六模态逐步核对信号、指定扰动和两种反演。</desc>',
'<rect width="1100" height="970" fill="#f8fafc"/>',
'<style>text{font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;fill:#172b45;font-size:17px}</style>']
def tx(x,y,s,size=17,anchor='start'):
 items.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px">{escape(str(s))}</text>')
def line(x,y,xx,yy,color='#bdcddd',width=1):
 items.append(f'<line x1="{x}" y1="{y}" x2="{xx}" y2="{yy}" stroke="{color}" stroke-width="{width}"/>')
colors=['#2867a1','#ae7526','#247e5d']
tx(40,47,'热扩散削弱细节，正则化决定怎样处理弱方向',27)
tx(40,90,'模型：L=1 m，κ=0.01 m²/s，k=1…8。两图纵轴不同，不能直接比较线的高度。')
tx(65,139,'A. 晚一点观测，高频衰减更多',21)
tx(615,139,'B. λ 越大，信号保留比例越低',21)
left=105;right=475;top=210;bottom=490
for v in [0,-1,-2,-3,-4,-5]:
 y=top-v/5*(bottom-top);line(left,y,right,y);tx(left-12,y+5,'10⁰' if v==0 else '10'+{'-1':'⁻¹','-2':'⁻²','-3':'⁻³','-4':'⁻⁴','-5':'⁻⁵'}[str(v)],14,'end')
for k in range(1,9):tx(left+(k-1)/7*(right-left),518,k,14,'middle')
tx(105,181,'奇异值 sₖ（对数轴）',16);tx(475,546,'模态 k',16,'end')
for i,t in enumerate([.5,1,1.5]):
 pts=[(left+(k-1)/7*(right-left),top-math.log10(math.exp(-.01*(k*math.pi)**2*t))/5*(bottom-top))for k in range(1,9)]
 items.append(f'<polyline data-decay="{t}" points="'+' '.join(f'{a:.9f},{b:.9f}'for a,b in pts)+f'" fill="none" stroke="{colors[i]}" stroke-width="3"/>')
 for a,b in pts:items.append(f'<circle cx="{a:.9f}" cy="{b:.9f}" r="4" fill="{colors[i]}"/>')
 line(90+i*150,580,114+i*150,580,colors[i],3);tx(122+i*150,585,'t='+str(t)+' s',15)
left=655;right=1025
for v in [0,.25,.5,.75,1]:
 y=bottom-v*(bottom-top);line(left,y,right,y);tx(left-12,y+5,v,14,'end')
for k in range(1,9):tx(left+(k-1)/7*(right-left),518,k,14,'middle')
tx(655,181,'sₖ² / (sₖ²+λ)，固定 t=1 s',16);tx(1025,546,'模态 k',16,'end')
for i,lam in enumerate([.0001,.001,.01]):
 pts=[]
 for k in range(1,9):
  s=math.exp(-.01*(k*math.pi)**2);pts.append((left+(k-1)/7*(right-left),bottom-s*s/(s*s+lam)*(bottom-top)))
 items.append(f'<polyline data-filter="{lam}" points="'+' '.join(f'{a:.9f},{b:.9f}'for a,b in pts)+f'" fill="none" stroke="{colors[i]}" stroke-width="3"/>')
 for a,b in pts:items.append(f'<circle cx="{a:.9f}" cy="{b:.9f}" r="4" fill="{colors[i]}"/>')
 line(610+i*160,580,634+i*160,580,colors[i],3);tx(642+i*160,585,'λ='+str(lam),15)
line(40,621,1060,621)
tx(40,668,'C. 第六模态：方程解对了，仍可能把噪声当成初态',23)
s=math.exp(-.01*(6*math.pi)**2);a=.2;eta=.02;b=s*a+eta;ls=b/s;tik=s*b/(s*s+.001)
rows=[
('1. 初态系数',f'a₆ = {a:.6f} K','仅指定这一模态的扰动；不是一次随机基准抽样。'),
('2. 扩散后信号',f's₆a₆ = {s*a:.6f} K',f's₆ = {s:.6f}，信号已小于 0.02 K。'),
('3. 加入指定扰动',f'b₆ = {b:.6f} K',f'η₆ = {eta:.6f} K，b₆ = s₆a₆ + η₆。'),
('4. 直接反演',f'b₆/s₆ = {ls:.6f} K',f'系数误差 = {ls-a:.6f} K。'),
('5. 手动正则 λ=0.001',f'估计 = {tik:.6f} K','收缩信号和噪声；改善此例不构成普遍定理。')]
for i,(label,value,note)in enumerate(rows):
 y=718+i*43;tx(50,y,label,17);tx(310,y,value,17);tx(660,y,note,15)
items.append('</svg>')
p=ROOT/'math-course/images/project-01-heat-inverse.svg';p.write_text('\n'.join(items)+'\n')
print(p)
