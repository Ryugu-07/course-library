"""Deterministic population quantities; no selected random trajectory."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850" viewBox="0 0 1100 850" role="img" aria-labelledby="title desc">',
'<title id="title">AR 与 MA：相关结构和预测方差</title>',
'<desc id="desc">AR 正负0.8与MA0.6的总体ACF和PACF；单位冲击方差、已知参数、两次观测下的高斯预测方差。全部是解析量，不是样本诊断。</desc>',
'<rect width="1100" height="850" fill="#f8fafc"/>',
'<style>text{font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;fill:#172b45;font-size:16px}.grid{stroke:#d7e0eb;stroke-width:1}.axis{stroke:#8092a8;stroke-width:1.2}</style>']
def text(x,y,s,size=16,anchor='start',color=None):
    parts.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px'+(f';fill:{color}' if color else '')+f'">{escape(s)}</text>')
def line(x1,y1,x2,y2,color,extra=''):
    parts.append(f'<line x1="{x1:.12f}" y1="{y1:.12f}" x2="{x2:.12f}" y2="{y2:.12f}" stroke="{color}" stroke-width="2" {extra}/>')
text(40,42,'从总体相关，到条件预测误差',28)
text(40,72,'同一阶数不意味着同一种“记忆”；先检查构造，再读图。',16)
colors=['#2666a8','#c24d46','#27846c']
labels=['AR(1) φ = +0.8','AR(1) φ = −0.8','MA(1) θ = +0.6']
for i,(label,color) in enumerate(zip(labels,colors)):
    line(45+i*330,103,75+i*330,103,color);text(84+i*330,109,label,17)
def panel(x,y,w,h,title,ymax):
    text(x,y-20,title,20)
    for value in ([-1,-.5,0,.5,1] if ymax==1 else [0,1,2,3]):
        yy=y+h-(value+(1 if ymax==1 else 0))/(2 if ymax==1 else ymax)*h
        line(x,yy,x+w,yy,'#d7e0eb');text(x-10,yy+5,f'{value:g}',14,'end')
    line(x,y,x,y+h,'#8092a8')
    return lambda value:y+h-(value+(1 if ymax==1 else 0))/(2 if ymax==1 else ymax)*h
yp=panel(85,175,930,200,'A. 总体 ACF：AR 衰减，MA 在 lag 1 后为零',1)
for s in range(3):
    for k in range(1,13):
        value=(.8 if s==0 else -.8)**k if s<2 else (.6/1.36 if k==1 else 0)
        x=105+(k-1)*79+(s-1)*9
        line(x,yp(0),x,yp(value),colors[s],f'data-panel="acf" data-series="{s}" data-k="{k}"')
        parts.append(f'<circle cx="{x}" cy="{yp(value):.12f}" r="3" fill="{colors[s]}"/>')
for k in range(1,13):text(105+(k-1)*79,399,str(k),14,'middle')
text(1015,424,'lag',14,'end')
yq=panel(85,500,440,205,'B. 总体 PACF：MA 仍拖尾',1)
for s in range(3):
    for k in range(1,13):
        value=((.8 if s==0 else -.8) if k==1 else 0) if s<2 else (-1)**(k+1)*.6**k/sum(.6**(2*j)for j in range(k+1))
        x=99+(k-1)*37+(s-1)*7
        line(x,yq(0),x,yq(value),colors[s],f'data-panel="pacf" data-series="{s}" data-k="{k}"')
        parts.append(f'<circle cx="{x}" cy="{yq(value):.12f}" r="2.5" fill="{colors[s]}"/>')
for k in [1,3,6,9,12]:text(99+(k-1)*37,730,str(k),14,'middle')
text(525,753,'lag',14,'end')
yv=panel(630,500,385,205,'C. 条件预测误差方差',3)
d=1+.6**2;pivot=d-.6**2/d
for s in [0,2]:
    vals=[sum(.8**(2*j)for j in range(h)) if s==0 else (d-.6**2/pivot if h==1 else d)for h in range(1,9)]
    points=[(645+(h-1)*50,yv(v))for h,v in enumerate(vals,1)]
    parts.append(f'<polyline fill="none" stroke="{colors[s]}" stroke-width="2.5" data-panel="variance" data-series="{s}" points="'+' '.join(f'{x:.12f},{y:.12f}'for x,y in points)+'"/>')
    for x,y in points:parts.append(f'<circle cx="{x}" cy="{y:.12f}" r="4" fill="{colors[s]}"/>')
for h in range(1,9):text(645+(h-1)*50,730,str(h),14,'middle')
text(1015,753,'步 h',14,'end')
text(40,794,'C：冲击方差为 1；参数已知；条件于两次观测。MA 从第二步起方差固定为 1.36。',16)
text(40,822,'AR 的 ±0.8 有相同预测方差，但均值预测与相关符号不同；没有用样本图替总体性质作证明。',16)
parts.append('</svg>')
target=ROOT/'math-course/images/ts-01-ar-process.svg'
target.write_text('\n'.join(parts)+'\n')
print(target)
