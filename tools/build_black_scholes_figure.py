"""Exact payoff and self-financing accounting diagram."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="830" viewBox="0 0 1100 830" role="img" aria-labelledby="title desc">',
'<title id="title">平价支付与自融资现金账</title><desc id="desc">执行价100，call加债券与put加股票的支付均为max(S,100)；下方列出买入0.1股如何从现金中支付11。</desc>',
'<rect width="1100" height="830" fill="#faf7ef"/><g font-family="Arial, PingFang SC, sans-serif" fill="#282822">']
def text(x,y,s,size=16,anchor='start'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#d9d5ca',dash=''):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-dasharray="{dash}"/>')
text(45,40,'平价证明靠支付相同，自融资证明靠现金守恒',25)
text(55,88,'1. 执行价 K=100：两个组合都支付 max(Sₜ,100)',21)
X=lambda x:100+650*x/200
Y=lambda y:340-y
for x in [0,50,100,150,200]:
    line(X(x),140,X(x),340);text(X(x),368,str(x),15,'middle')
for y in [0,50,100,150,200]:
    line(100,Y(y),750,Y(y));text(87,Y(y)+5,str(y),15,'end')
for key,fun,color,dash in [('stock',lambda x:x,'#a36a16','3 4'),('call-bond',lambda x:max(x-100,0)+100,'#315f9d',''),('put-stock',lambda x:max(100-x,0)+x,'#39734d','9 5')]:
    d=' '.join(f'{"M" if j==0 else "L"}{X(j):.12f} {Y(fun(j)):.12f}'for j in range(201))
    out.append(f'<path data-series="{key}" d="{d}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}"/>')
text(795,175,'蓝实线：call + 债券',17);text(795,215,'绿虚线：put + 股票',17);text(795,255,'金点线：只有股票',17)
text(795,305,'Sₜ < 100 时，',17);text(795,335,'组合支付大于股票。',17)
text(100,400,'横轴：到期股价 Sₜ；纵轴：到期支付。债券在今天的价格是 100 exp(−rτ)。',17)
line(45,435,1055,435)
text(55,475,'2. 调仓前后价值不变：买股的费用必须从现金中扣掉',21)
headers=['时点','股票价格','持股','现金','组合价值'];xs=[80,290,470,650,870]
for x,h in zip(xs,headers):text(x,520,h,18)
rows=[('初始',100,.6,-50,10),('涨价后、调仓前',110,.6,-50,16),('买入 0.1 股后',110,.7,-61,16)]
for j,row in enumerate(rows):
    y=565+48*j
    for x,v in zip(xs,row):text(x,y,str(v),17)
    line(70,y+13,1030,y+13)
text(80,738,'新增股票价值：0.1 × 110 = 11；现金变化：−11。',19)
text(80,780,'调仓前 0.6 × 110 − 50 = 16；调仓后 0.7 × 110 − 61 = 16。',19)
text(80,813,'本小题忽略利息；完整实验先计息，再买卖股票，并逐行保留现金账。',16)
out.append('</g></svg>')
(ROOT/'math-course/images/sde-03-gbm-payoff.svg').write_text('\n'.join(out)+'\n')
print('Black-Scholes payoff and financing figure written')
