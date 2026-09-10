"""Exact finite ledgers illustrating martingale convergence and predictable crossings."""
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
def build():
 p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1330" viewBox="0 0 1100 1330" role="img" aria-labelledby="title desc"><title id="title">尾部量词、终点联合账与上穿策略</title><desc id="desc">尖峰模型四个时刻的高度概率和固定阈值尾部；B等于2的全部非零当前终点联合概率；五点路径的可预测持仓与上穿收益。</desc><rect width="1100" height="1330" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;fill:#253345}.h{font-size:24px;font-weight:650}.l{font-size:18px}.s{font-size:16px}.grid{stroke:#cdd3d7;stroke-width:1}</style>']
 def text(x,y,s,cls='l',anchor='start'):p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
 text(40,40,'① 尖峰越高、概率越小：两个因子的乘积仍为 1','h')
 text(40,77,'固定阈值 K=256，严格使用 Xₙ>K。每一列保留自己的单位与含义。')
 xs=[120,320,540,740,930]
 for x,label in zip(xs,['时刻 n','尖峰高度 2ⁿ','尖峰概率 2⁻ⁿ','期望 EXₙ','尾部期望']):text(x,126,label,'l','middle')
 for row,n in enumerate([0,4,8,12]):
  y=172+48*row
  p.append(f'<g data-spike-row="{n}">')
  for x,label in zip(xs,[str(n),str(2**n),'1'if n==0 else f'1/{2**n}','1','1'if 2**n>256 else'0']):text(x,y,label,'l','middle')
  p.append('</g>')
  p.append(f'<line x1="65" x2="1035" y1="{y+17}" y2="{y+17}" class="grid"/>')
 text(40,366,'截至 n=8 的尾部最大值为 0；但对所有时刻取上确界，仍是 1。')
 text(40,398,'UI 要求同一个 K 同时控制所有 n，不是让 K 追着当前尖峰跑。','s')
 text(40,461,'② B=2，n=2：当前状态与未来终点的全部非零联合质量','h')
 for x,s,q in [(160,-2,'1/4'),(550,0,'1/2'),(940,2,'1/4')]:
  p.append(f'<rect x="{x-115}" y="495" width="230" height="70" rx="8" fill="#eaf0f6"/>')
  text(x,523,f'当前 X₂={s}','l','middle');text(x,550,f'概率 {q}','s','middle')
 for x,z in [(350,-2),(750,2)]:
  p.append(f'<rect x="{x-110}" y="713" width="220" height="70" rx="8" fill="#f3ecdb"/>')
  text(x,742,f'终点 Z={z}','l','middle');text(x,769,'总概率 1/2','s','middle')
 for i,(x,zx,s,z)in enumerate([(160,350,-2,-2),(550,350,0,-2),(550,750,0,2),(940,750,2,2)]):
  p.append(f'<line data-joint="{s},{z}" x1="{x}" x2="{zx}" y1="565" y2="713" stroke="#3979b8" stroke-width="2.5"/>')
  mid=(x+zx)/2
  p.append(f'<rect x="{mid-58}" y="612" width="116" height="44" rx="5" fill="#faf7ef"/>')
  text(mid,632,'联合概率 1/4','s','middle');text(mid,653,f'距离 {abs(z-s)}','s','middle')
 text(40,823,'L¹ 距离 = (0+2+2+0)/4 = 1；未吸收概率 = 1/2。')
 text(40,854,'当前 0 的两个终点条件概率各 1/2；联合概率还要乘当前质量 1/2。','s')
 text(40,913,'③ 先决定持仓，再看下一步：a=0，b=2','h')
 xx=lambda t:145+200*t
 yy=lambda v:1100-65*v
 for v in [-1,0,1,2]:
  p.append(f'<line x1="145" x2="945" y1="{yy(v)}" y2="{yy(v)}" class="grid"/>');text(125,yy(v)+5,str(v),'s','end')
 path=[0,2,0,2,-1]
 p.append('<polyline id="crossing-path" points="'+' '.join(f'{xx(i)},{yy(v)}'for i,v in enumerate(path))+'" fill="none" stroke="#3979b8" stroke-width="2.5"/>')
 for i in [1,3]:p.append(f'<line data-held="{i}" x1="{xx(i-1)}" y1="{yy(path[i-1])}" x2="{xx(i)}" y2="{yy(path[i])}" stroke="#af731a" stroke-width="5"/>')
 for i,v in enumerate(path):
  p.append(f'<circle data-path="{i}" cx="{xx(i)}" cy="{yy(v)}" r="4" fill="#3979b8"/>');text(xx(i),1200,str(i),'s','middle')
 text(1000,1200,'时刻','s')
 text(40,1241,'本段 H：','s')
 text(40,1272,'收益 G：','s')
 for i,(h,g)in enumerate(zip(['—','1','0','1','0'],[0,2,2,4,4])):
  text(xx(i),1241,h,'s','middle');text(xx(i),1272,str(g),'s','middle')
 text(40,1310,'金色段才持仓。完成 2 次上穿，G₄=4；若初始资本为 7，最终财富为 11。','s')
 p.append('</svg>');return '\n'.join(p)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['grad-math/images/mt-04-martingale-convergence.svg','grad-math/site/assets/img/mt-04-martingale-convergence.svg']:(ROOT/f).write_text(s)
 print('Martingale convergence figure written')
