"""Explicit proxy constants, full discrete tails, and an independence counterexample."""
from pathlib import Path
from html import escape
import json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
def build():
 script="const h=require('./course-shared/labs/subgaussian-concentration.js');console.log(JSON.stringify([h.plots(h.snapshot({model:'uniform'}))[0],h.plots(h.snapshot({mode:'binomial'}))[0],h.plots(h.snapshot({mode:'shell'}))[1]]));"
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',script],cwd=ROOT,text=True))
 p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1510" viewBox="0 0 1100 1510" role="img" aria-labelledby="title desc"><title id="title">尾概率、证书和依赖条件</title><desc id="desc">Uniform的实际对数矩母函数、最优代理及范围代理；二项式32次成功率1%的全部计数上尾和三种单侧界；32维独立Gaussian的壳外概率与共用一个Gaussian的反例。</desc><rect width="1100" height="1510" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;fill:#253345}.h{font-size:23px;font-weight:650}.l{font-size:18px}.s{font-size:16px}</style>']
 def text(x,y,t,cls='l',anchor='start'):p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(str(t))}</text>')
 text(40,39,'同一个事件：先查模型，再查证书与依赖条件','h')
 text(40,74,'对数概率不是概率本身；有限负数表示正概率，严格零另在数值表中标明。','s')
 titles=['① Uniform[-1,1]：范围相同，不等于常数最优','② Bin(32,0.01)：所有 k=0,…,32 的计数上尾','③ d=32：同样的坐标边缘分布，不同的壳外概率']
 labels=[['真实 ln MGF','最优代理 λ²/6','范围代理 λ²/2'],['真实尾','Hoeffding','Bernstein','Chernoff/KL'],['独立 Gaussian','适用的 Gaussian 界','共用一个 Z 的相关反例']]
 notes=['最优代理来自完整 Uniform 分布；范围证书只使用取值区间。',
 '离散阈值只画点。k=32 时 Hoeffding 反而比 Bernstein 紧；KL 在此等于真实尾。',
 '事件 |‖X‖−√d|≥t；相关反例不满足独立性，不能沿用独立 Gaussian 的界。']
 for n,plot in enumerate(plots):
  top=110+440*n;text(40,top+20,titles[n],'h')
  xx=lambda v:145+890*(v-plot['xmin'])/(plot['xmax']-plot['xmin'])
  yy=lambda v:top+295-210*(v-plot['ymin'])/(plot['ymax']-plot['ymin'])
  for i in range(5):
   v=plot['ymin']+(plot['ymax']-plot['ymin'])*i/4;x=plot['xmin']+(plot['xmax']-plot['xmin'])*i/4
   p.append(f'<line x1="145" x2="1035" y1="{yy(v)}" y2="{yy(v)}" stroke="#cdd3d7"/>')
   text(130,yy(v)+5,f'{v:.5g}','s','end');text(xx(x),top+325,f'{x:.4g}','s','start'if i==0 else'end'if i==4 else'middle')
  text(1035,top+359,plot['xlabel'],'s','end')
  for j,r in enumerate(plot['series']):
   lx=145+j*(220 if n==1 else 290);p.append(f'<line x1="{lx}" x2="{lx+25}" y1="{top+55}" y2="{top+55}" stroke="{r["color"]}" stroke-width="3" stroke-dasharray="{r["dash"]}"/>');text(lx+34,top+60,labels[n][j],'s')
   assert all(v is not None for v in r['values']),'static scenarios should be finite'
   if not r['pointsOnly']:
    points=' '.join(f'{xx(x):.12g},{yy(v):.12g}'for x,v in zip(plot['xs'],r['values']))
    p.append(f'<polyline data-plot="{plot["key"]}" data-series="{r["key"]}" points="{points}" fill="none" stroke="{r["color"]}" stroke-width="2.5" stroke-dasharray="{r["dash"]}"/>')
   else:
    for i,(x,v)in enumerate(zip(plot['xs'],r['values'])):p.append(f'<circle data-plot="{plot["key"]}" data-series="{r["key"]}" data-index="{i}" cx="{xx(x)}" cy="{yy(v)}" r="2.4" fill="{r["color"]}"/>')
  text(40,top+403,notes[n],'s')
 text(40,1465,'所有曲线与离散点均由本页明确的概率模型计算；不是经验抽样图，也不替代定理证明。','s')
 p.append('</svg>');return '\n'.join(p)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['grad-math/images/hdp-01-subgaussian-tail.svg','grad-math/site/assets/img/hdp-01-subgaussian-tail.svg']:(ROOT/f).write_text(s)
 print('Subgaussian constants, discrete tails and Gaussian shell figure written')
