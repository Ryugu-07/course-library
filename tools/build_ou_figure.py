"""Deterministic OU stability and variance figure; no random path selection."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 860" role="img" aria-labelledby="title desc">',
'<title id="title">OU 连续模型、离散稳定性与概率流</title>',
'<desc id="desc">上图比较精确回复乘子和 Euler 乘子；中图在 theta=sigma=T=1 下比较终点方差；下图说明平稳边缘分布相同不代表路径相同。</desc>',
'<rect width="1100" height="860" fill="#faf7ef"/>',
'<style>text{font-family:system-ui,sans-serif;fill:#282822;font-size:16px}.axis{stroke:#686860;stroke-width:1}.grid{stroke:#dedbd0;stroke-width:1}.exact{stroke:#39734d;fill:none;stroke-width:3;stroke-dasharray:9 4}.em{stroke:#315f9d;fill:none;stroke-width:3}.wrong{stroke:#b64335;fill:none;stroke-width:3;stroke-dasharray:3 4}</style>']
def text(x,y,s,size=16,anchor='start'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x1,y1,x2,y2,cl='grid'):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cl}"/>')
text(55,40,'OU：稳定、准确、同分布，是三个不同问题',25)
text(55,80,'A. 连续回复与显式 Euler 的一步乘子',20)
X=lambda x:100+700*x/2.5
Y=lambda y:280-160*(y+1.5)/2.5
for y in [-1.5,-1,0,1]:
    line(100,Y(y),800,Y(y));text(87,Y(y)+5,str(y),14,'end')
for x in [0,.5,1,1.5,2,2.5]:
    line(X(x),120,X(x),280);text(X(x),305,str(x),14,'middle')
for name,fun,cl in [('exact',lambda x:math.exp(-x),'exact'),('euler',lambda x:1-x,'em')]:
    pts=[(j/80,fun(j/80))for j in range(201)]
    d=' '.join(f'{"M" if j==0 else "L"}{X(x):.12f} {Y(y):.12f}'for j,(x,y)in enumerate(pts))
    out.append(f'<path data-series="{name}" d="{d}" class="{cl}"/>')
text(820,146,'绿虚线：exp(−θh)',15);text(820,176,'蓝实线：1−θh',15)
text(820,217,'θh = 2 时 A = −1',15);text(820,245,'超过 2 后失稳',15)
text(100,330,'横轴 θh；OU 总在收缩，但 Euler 需要 0 < θh < 2。',16)
text(55,385,'B. 均值一样，终点方差仍能不同',20)
text(55,414,'固定 θ = σ = T = 1；每个标记对应一个完整步数 n。',16)
ns=[1,2,4,8,16,32,64,128,256];exact=(1-math.exp(-2))/2
for y in [0,.25,.5,.75,1]:
    line(100,620-170*y,800,620-170*y);text(88,625-170*y,str(y),14,'end')
line(100,620-170*exact,800,620-170*exact,'exact')
for i,n in enumerate(ns):
    h=1/n;A=1-h;var=h*sum(A**(2*j)for j in range(n));x=100+700*i/8
    text(x,645,str(n),14,'middle')
    for key,v,cl in [('em-var',var,'em'),('wrong-var',h*var,'wrong')]:
        out.append(f'<circle data-series="{key}" data-n="{n}" cx="{x}" cy="{620-170*v:.12f}" r="4" class="{cl}"/>')
text(820,475,'绿线：精确方差',15);text(820,505,'蓝点：EM 方差',15);text(820,535,'红点：错误缩放',15)
text(820,575,'n 越大，h 越小',15);text(100,674,'横轴步数 n；错误缩放把扩散压向零，尽管两种离散法的均值完全相同。',16)
line(55,706,1045,706)
text(55,741,'C. 平稳 OU 与概率流 ODE：相同边缘分布，不同路径规律',20)
text(75,778,'OU：样本持续波动，协方差按 exp(−θ|t−s|) 衰减。',17)
text(75,810,'精确概率流：平稳高斯 score 恰好抵消漂移，每个初始样本保持不动。',17)
text(75,840,'两者都保持同一个高斯边缘分布；没有理由要求它们的两时刻联合分布相同。',16)
out.append('</svg>')
(ROOT/'math-course/images/sde-02-diffusion.svg').write_text('\n'.join(out)+'\n')
print('OU static figure written')
