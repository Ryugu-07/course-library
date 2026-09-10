"""Payoff comparisons and the probability-space location of equilibria."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850" viewBox="0 0 1100 850" role="img" aria-labelledby="title desc">',
'<title id="title">从单方面改进到概率空间中的 Nash 均衡</title>',
'<desc id="desc">左边囚徒困境四条箭头只改变一位玩家的动作，终点为双方背叛。右边协调博弈有两个角点均衡和精确三分之一的内点混合均衡。</desc>',
'<rect width="1100" height="850" fill="#f8fafc"/>',
'<style>text{font-family:Arial,"Noto Sans CJK SC","PingFang SC",sans-serif;fill:#172b45;font-size:17px}</style>',
'<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#2867a1" stroke-width="1.5"/></marker></defs>']
def tx(x,y,s,size=17,anchor='start',color='#172b45'):
 p.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" style="font-size:{size}px;fill:{color}">{escape(str(s))}</text>')
def line(x1,y1,x2,y2,color='#b9c9d9',arrow=False):
 p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{3 if arrow else 1}"'+(' marker-end="url(#arrow)"'if arrow else'')+'/>')
tx(40,47,'均衡检查的是“谁能独自改进”，不是“哪格总收益最大”',27)
tx(40,85,'收益对先行后列；各自只比较自己的收益。p=P(R₀)，q=P(C₀)。')
line(562,125,562,745)
tx(40,138,'A. 囚徒困境：沿箭头单方面改进',21)
tx(218,192,'C₀ 合作',16,'middle');tx(423,192,'C₁ 背叛',16,'middle')
payoffs=[[(3,3),(0,5)],[(5,0),(1,1)]]
for i in range(2):
 tx(45,266+i*220,'R'+str(i),16);tx(45,294+i*220,'合作'if i==0 else'背叛',16)
 for j in range(2):
  x,y=145+205*j,210+220*i;ne=i==j==1;social=i==j==0
  p.append(f'<rect x="{x}" y="{y}" width="146" height="130" rx="7" fill="{"#fff0d8"if social else"#e7f1ed"if ne else"#e8eff7"}" stroke="{"#247e5d"if ne else"#b9c9d9"}" stroke-width="{3 if ne else 1}"/>')
  tx(x+73,y+51,str(payoffs[i][j]),24,'middle')
  tx(x+73,y+88,'唯一纯均衡'if ne else'收益和 6'if social else'可单方面改进',14,'middle')
  p.append(f'<metadata data-payoff="{i},{j}" data-u="{payoffs[i][j][0]}" data-v="{payoffs[i][j][1]}"/>')
for x,gain in [(218,2),(423,1)]:
 line(x,353,x,414,'#2867a1',True);tx(x+10,389,'行 +'+str(gain),14)
for y,gain in [(275,2),(495,1)]:
 line(302,y,337,y,'#2867a1',True);tx(320,y-14,'列 +'+str(gain),13,'middle')
tx(45,615,'绿色格：(1,1)，两人都无法独自增加收益。',16)
tx(45,653,'金色格：(3,3)，两人一起改变会更好。',16)
tx(45,704,'箭头每次只改一个动作；不是时间演化模型。',15)
tx(610,138,'B. 协调博弈：纯格之外还有内点',21)
tx(610,174,'收益：(4,4)、(0,0)、(0,0)、(2,2)',16)
X=lambda v:670+360*v
Y=lambda v:570-360*v
for t in [0,1/3,2/3,1]:
 line(X(t),210,X(t),570);line(670,Y(t),1030,Y(t))
 tx(X(t),599,{0:'0',1/3:'1/3',2/3:'2/3',1:'1'}[t],14,'middle')
 tx(653,Y(t)+5,{0:'0',1/3:'1/3',2/3:'2/3',1:'1'}[t],14,'end')
tx(1050,605,'p',19);tx(628,217,'q',19)
for a,b,label in [(0,0,'纯均衡 R₁C₁'),(1,1,'纯均衡 R₀C₀'),(1/3,1/3,'混合均衡')]:
 p.append(f'<circle cx="{X(a)}" cy="{Y(b)}" r="7" fill="#247e5d" data-equilibrium="{a},{b}"/>')
 if a==0:tx(690,550,label,15)
 elif a==1:tx(1013,241,label,15,'end')
 else:tx(807,441,label,16);tx(807,468,'(1/3, 1/3)',16)
tx(610,646,'内点处：4q = 2(1−q)，故 q=1/3。',16)
tx(610,682,'列玩家同理给出 p=1/3；每人得 4/3。',16)
tx(610,718,'坐标 0 表示确定选第二个动作，不是“不参加”。',15)
line(40,760,1060,760)
tx(40,800,'学习顺序：读收益 → 固定对手找最佳回应 → 求全部交集 → 用单方面可增加收益复核。',18)
p.append('</svg>')
target=ROOT/'math-course/images/game-01-nash-payoff.svg'
target.write_text('\n'.join(p)+'\n');print(target)
