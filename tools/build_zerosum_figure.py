"""Exact two-line envelopes and backward induction in a finite game tree."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
items=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1030" viewBox="0 0 1100 1030" role="img" aria-labelledby="title desc">',
'<title id="title">零和矩阵的双向证书与完全信息树的逆向归纳</title>',
'<desc id="desc">上方矩阵三零一二的行保底在p等于四分之一时最大，列上界在q等于二分之一时最小，两边都等于二分之三。下方博弈树由B先比较三与二选择拿，A预见后比较二与一也选择拿。</desc>',
'<rect width="1100" height="1030" fill="#f8fafc"/>',
'<style>text{font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;fill:#172b45;font-size:17px}</style>']
def tx(x,y,s,size=17,anchor='start',color='#172b45'):
 items.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px;fill:{color}">{escape(str(s))}</text>')
def line(x,y,xx,yy,color='#b9c9d9',width=1,dash=False):
 items.append(f'<line x1="{x}" y1="{y}" x2="{xx}" y2="{yy}" stroke="{color}" stroke-width="{width}"'+(' stroke-dasharray="6 5"'if dash else'')+'/>')
def circle(x,y,r,color='#247e5d'):
 items.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>')
tx(40,46,'同时选动作：上下界接上；先后选动作：从末端倒推',27)
tx(40,88,'上方行收益 A = [[3, 0], [1, 2]]，列玩家取相反收益。下方收益对先 A 后 B。')
tx(65,137,'A. 行玩家最大化较低的一条线',21)
tx(620,137,'B. 列玩家最小化较高的一条线',21)
for side,left in enumerate([100,650]):
 X=lambda t:left+370*t
 Y=lambda v:425-70*v
 for v in [0,1,1.5,2,3]:
  line(left,Y(v),left+370,Y(v))
  tx(left-12,Y(v)+5,str(v),14,'end')
 for t in [0,.25,.5,.75,1]:
  tx(X(t),452,str(t).rstrip('0').rstrip('.') if t not in [0,1] else str(t),13,'middle')
 if side==0:
  line(X(0),Y(1),X(1),Y(3),'#2867a1',3)
  line(X(0),Y(2),X(1),Y(0),'#ae7526',3)
  pts=[(0,1),(.25,1.5),(1,0)]
  tx(100,183,'蓝：1+2p　金：2−2p',16)
  tx(100,495,'p=1/4 时，保底达到 3/2。',18)
  op=.25
 else:
  line(X(0),Y(0),X(1),Y(3),'#2867a1',3)
  line(X(0),Y(2),X(1),Y(1),'#ae7526',3)
  pts=[(0,2),(.5,1.5),(1,3)]
  tx(650,183,'蓝：3q　金：2−q',16)
  tx(650,495,'q=1/2 时，上界降到 3/2。',18)
  op=.5
 items.append('<polyline points="'+' '.join(f'{X(t)},{Y(v)}'for t,v in pts)+'" fill="none" stroke="#247e5d" stroke-width="5"/>')
 circle(X(op),Y(1.5),7)
 tx(290 if side==0 else 850,320 if side==0 else 385,'(1/4, 3/2)'if side==0 else'(1/2, 3/2)',15)
 tx(left+370,476,'p'if side==0 else'q',18,'middle')
tx(40,536,'两份可行证书的差为 0，因而同时最优。绿色线分别是下包络与上包络。',17)
line(40,558,1060,558)
tx(40,604,'C. 两步树：每个节点比较当前行动者自己的收益',22)
# Complete tree and selected actions.
line(370,655,170,790,'#2867a1',4)
line(370,655,690,755,'#b9c9d9',2)
line(690,755,560,905,'#2867a1',4)
line(690,755,915,905,'#b9c9d9',2)
circle(370,655,24,'#2867a1');tx(370,662,'A',20,'middle','#ffffff')
circle(690,755,24,'#2867a1');tx(690,762,'B',20,'middle','#ffffff')
tx(253,711,'拿',17);tx(525,687,'传',17)
tx(599,827,'拿',17);tx(816,827,'传',17)
for x,y,pay in [(170,790,'(2, 0)'),(560,905,'(1, 3)'),(915,905,'(3, 2)')]:
 items.append(f'<rect x="{x-65}" y="{y-20}" width="130" height="50" rx="6" fill="#e8eff7" stroke="#b9c9d9"/>')
 tx(x,y+13,pay,24,'middle')
tx(55,864,'先看 B：3 > 2，选“拿”。',17)
tx(55,905,'再看 A：2 > 1，也选“拿”。',17)
tx(40,982,'蓝色分支组成完整策略，实际路径在 A 处结束。B 的计划仍是子博弈完美性检查的一部分。',17)
items.append('</svg>')
target=ROOT/'math-course/images/game-02-minimax-tree.svg'
target.write_text('\n'.join(items)+'\n');print(target)
