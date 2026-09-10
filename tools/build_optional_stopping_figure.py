"""Actual finite probability ledgers for conditional expectation and stopping."""
from pathlib import Path
from fractions import Fraction
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
def build():
 p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1220" viewBox="0 0 1100 1220" role="img" aria-labelledby="title desc"><title id="title">信息分组、有限停止与公平策略的风险</title><desc id="desc">四个等概率目标的分组平均；首达加一在T等于6时的全部终点概率；固定与封顶倍增策略的理论方差。</desc><rect width="1100" height="1220" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;fill:#253345}.h{font-size:24px;font-weight:650}.l{font-size:18px}.s{font-size:16px}.grid{stroke:#cdd3d7;stroke-width:1}</style>']
 def text(x,y,s,cls='l',anchor='start'):p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
 text(40,40,'① 信息把结果分组：每组使用概率加权平均','h')
 text(40,75,'四种结果各有概率 1/4。X 为蓝柱，给定组后的预测 Z 为金色横线。')
 for i,xval in enumerate([0,2,4,6]):
  x=130+250*i;z=1 if i<2 else 5;color='#eaf0f6'if i<2 else'#f3ecdb'
  p.append(f'<rect x="{x-65}" y="102" width="130" height="236" rx="8" fill="{color}"/>')
  p.append(f'<rect data-x="{i}" x="{x-25}" y="{290-xval*25}" width="50" height="{xval*25}" fill="#3979b8"/>')
  p.append(f'<line data-z="{i}" x1="{x-48}" x2="{x+48}" y1="{290-z*25}" y2="{290-z*25}" stroke="#af731a" stroke-width="3"/>')
  text(x,322,f'X={xval}，Z={z}','s','middle')
 text(255,370,'组 A：平均 1','l','middle');text(755,370,'组 B：平均 5','l','middle')
 text(45,410,'不知分组：均方误差 5   →   知道分组：均方误差 1   →   知道结果：均方误差 0')
 text(40,465,'② 首达 +1，在 T=6 截断：全部终点的精确分布','h')
 dist={-6:Fraction(1,64),-4:Fraction(5,64),-2:Fraction(9,64),0:Fraction(5,64),1:Fraction(44,64)}
 xx=lambda x:145+105*(x+6)
 yy=lambda q:755-270*q
 for q in [0,.25,.5,.75]:
  p.append(f'<line x1="100" x2="970" y1="{yy(q)}" y2="{yy(q)}" class="grid"/>');text(85,yy(q)+5,str(q),'s','end')
 for x,q in dist.items():
  p.append(f'<rect data-terminal="{x}" x="{xx(x)-19}" y="{yy(float(q))}" width="38" height="{270*float(q)}" fill="{("#af731a"if x==1 else"#3979b8")}"/>')
  text(xx(x),yy(float(q))-12,str(q),'s','middle');text(xx(x),784,str(x),'s','middle')
 text(970,814,'停止位置','s','end')
 text(40,850,'已停：44/64 × 1 = 11/16；未停：−11/16。全体均值严格等于 0。')
 text(40,880,'未停概率 5/16，未停条件均值 −11/5 = −2.2；筛掉未停样本会改变问题。','s')
 text(40,930,'③ 公平策略均值都为 0，但方差可以不同','h')
 x=lambda n:145+800*n/80
 y=lambda v:1130-160*v/1000
 for v in [0,250,500,750,1000]:
  p.append(f'<line x1="145" x2="945" y1="{y(v)}" y2="{y(v)}" class="grid"/>');text(130,y(v)+5,str(v),'s','end')
 fixed=[];doubling=[];prob=[Fraction(1),Fraction(0),Fraction(0),Fraction(0)];variance=Fraction(0)
 for n in range(81):
  if n:
   variance+=sum(q*4**i for i,q in enumerate(prob));prob=[Fraction(1,2),prob[0]/2,prob[1]/2,(prob[2]+prob[3])/2]
  fixed.append(f'{x(n)},{y(n)}');doubling.append(f'{x(n)},{y(float(variance))}')
 p.append(f'<polyline id="fixed-variance" points="{" ".join(fixed)}" fill="none" stroke="#3979b8" stroke-width="2.5"/>')
 p.append(f'<polyline id="doubling-variance" points="{" ".join(doubling)}" fill="none" stroke="#af731a" stroke-width="2.5"/>')
 for n in [0,20,40,60,80]:text(x(n),1158,str(n),'s','middle')
 text(340,1003,'封顶倍增：Var(W₈₀)=894.5','s')
 text(500,1110,'固定或反向：Var(W₈₀)=80','s')
 text(40,1200,'末图横轴为时域 H，纵轴为理论方差；方差不是某条路径的最终财富。','s')
 p.append('</svg>');return '\n'.join(p)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['grad-math/images/mt-03-conditional-martingale.svg','grad-math/site/assets/img/mt-03-conditional-martingale.svg']:(ROOT/f).write_text(s)
 print('Conditional expectation and stopping figure written')
