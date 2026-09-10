"""Deterministic, source-native figure for the LLN proof."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
def build():
 parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1190" viewBox="0 0 1100 1190" role="img" aria-labelledby="title desc">',
 '<title id="title">逐项截断、子列夹逼与四阶矩界</title><desc id="desc">所有柱高与曲线坐标来自列明的数值和公式。上部为有限教学路径，中部为几何子列间的非负平均夹逼，下部为Bernoulli概率上界。</desc>',
 '<rect width="1100" height="1190" fill="#faf7ef"/>',
 '<style>text{font-family:system-ui,sans-serif;fill:#253345}.grid{stroke:#cdd3d7;stroke-width:1}.small{font-size:16px}.label{font-size:18px}.heading{font-size:24px;font-weight:650}</style>']
 def text(x,y,s,cls='label',anchor='start'):parts.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
 text(40,40,'同一条证明：删去罕见大值，再补齐所有指标','heading')
 text(40,76,'① 第 i 项用阈值 i；蓝柱 Xᵢ，金柱 Yᵢ。四个观测为教学手算，不是 seed 回放。')
 xs=[1,8,2,5];ys=[1,0,2,0]
 for i,(v,w) in enumerate(zip(xs,ys),1):
  x=95+(i-1)*245
  parts.append(f'<rect data-original="{i}" x="{x}" y="{325-24*v}" width="56" height="{24*v}" fill="#3979b8"/>')
  parts.append(f'<rect data-truncated="{i}" x="{x+66}" y="{325-24*w}" width="56" height="{24*w}" fill="#af731a"/>')
  text(x+61,351,f'i={i}，X={v}，Y={w}','small','middle')
  text(x+61,380,f'原始平均 {[1,4.5,11/3,4][i-1]:.6g}','small','middle')
  text(x+61,406,f'截断平均 {[1,.5,1,.75][i-1]:.6g}','small','middle')
 parts.append('<line x1="65" x2="1045" y1="325" y2="325" class="grid"/>')
 text(45,460,'② 先在几何子列端点收敛，再利用非负部分和夹住中间项','heading')
 text(45,493,'教学延长路径的 Y：1, 0, 2, 0, 1, 3, 2, 1。T₄=3，T₈=10。')
 x=lambda n:150+175*(n-4)
 y=lambda v:715-65*v
 for v in [0,.5,1,1.5,2,2.5]:
  parts.append(f'<line x1="150" x2="850" y1="{y(v)}" y2="{y(v)}" class="grid"/>');text(133,y(v)+5,str(v),'small','end')
 for val,color,label in [(.375,'#9360b4','下界 T₄/8 = 0.375'),(2.5,'#3c8b59','上界 T₈/4 = 2.5')]:
  parts.append(f'<line data-squeeze="{val}" x1="150" x2="850" y1="{y(val)}" y2="{y(val)}" stroke="{color}" stroke-width="2" stroke-dasharray="7 4"/>');text(866,y(val)+5,label,'small')
 ts=[3,4,7,9,10]
 pts=[]
 for n,t in zip(range(4,9),ts):
  pts.append(f'{x(n)},{y(t/n)}');parts.append(f'<circle data-average="{n}" cx="{x(n)}" cy="{y(t/n)}" r="5" fill="#3979b8"/>');text(x(n),745,str(n),'small','middle')
 parts.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="#3979b8" stroke-width="2"/>')
 text(850,778,'指标 n（4 ≤ n ≤ 8）','small','end')
 text(45,830,'③ Bernoulli(0.6)：ε=0.1 时的四阶矩概率上界','heading')
 text(45,862,'P(|Sₙ/n−0.6|>0.1) ≤ min(1, [0.1728 n²−0.1056 n]/[0.1 n]⁴)')
 xx=lambda n:150+800*math.log10(n)/3
 yy=lambda v:1090-62*math.log10(v/.001)
 for v in [.001,.01,.1,1]:
  parts.append(f'<line x1="150" x2="950" y1="{yy(v)}" y2="{yy(v)}" class="grid"/>');text(132,yy(v)+5,str(v),'small','end')
 points=[]
 for n in range(1,1001):
  bound=min(1,(.0672*n+.1728*n*(n-1))/(.1*n)**4);points.append(f'{xx(n):.9f},{yy(bound):.9f}')
 parts.append(f'<polyline id="fourth-bound" points="{" ".join(points)}" fill="none" stroke="#3979b8" stroke-width="2.5"/>')
 for n in [1,10,100,1000]:text(xx(n),1120,str(n),'small','middle')
 text(390,964,'n=100：上界 0.171744','small')
 text(500,1070,'n=1000：上界 0.001726944','small')
 text(45,1162,'双对数轴；曲线是可证明的上界，不是实测频率。有限图形不能替代无限求和。','small')
 parts.append('</svg>');return '\n'.join(parts)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['grad-math/images/mt-02-lln.svg','grad-math/site/assets/img/mt-02-lln.svg']:(ROOT/f).write_text(s)
 print('LLN static figure written')
