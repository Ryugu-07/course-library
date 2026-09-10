"""Published SPARC measurements, finite residuals, and an analytic Jeans projection family."""
from pathlib import Path
from html import escape
import json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
def build():
 script="const h=require('./course-shared/labs/galaxy-rotation.js');const s=h.snapshot({}),j=h.snapshot({mode:'jeans'}),k=h.snapshot({mode:'jeans',tracerSlope:3});console.log(JSON.stringify({s,j,k,plots:h.plots(s),jplots:h.plots(j)}));"
 d=json.loads(subprocess.check_output(PREFIX+['node','-e',script],cwd=ROOT,text=True))
 plots=d['plots'][:2];jp=d['jplots'][0];jp['series'].append(dict(key='gamma3',label='γ=3：该理想族内的 β 抵消',values=[r['mass']for r in d['k']['rows']],color='#b16b18',dash='7 4',errors=None,pointsOnly=False));jp['ymin']=min(r['mass']for r in d['k']['rows'])*.9;plots.append(jp)
 p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1510" viewBox="0 0 1100 1510" role="img" aria-labelledby="title desc"><title id="title">从真实旋转曲线到模型残差和投影退化</title><desc id="desc">SPARC NGC3198全部43个发布点和表列误差，与质量光度比0.5、渐近平坦晕速度134千米每秒、核半径5.5千秒差距模型比较；所有点的残差；固定视线弥散的Jeans投影例。</desc><rect width="1100" height="1510" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;fill:#253345}.h{font-size:23px;font-weight:650}.l{font-size:18px}.s{font-size:16px}</style>']
 def text(x,y,t,cls='l',anchor='start'):p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(str(t))}</text>')
 text(40,39,'先看真实测量，再问模型和几何允许我们推出什么','h')
 text(40,74,'NGC3198：SPARC 2016 全部 43 点；D=13.8 Mpc，i=73°，Υ_d=0.5。','s')
 for n,plot in enumerate(plots):
  top=110+440*n
  titles=['① 发布旋转曲线与当前重子、暗晕模型','② 每一个点的标准化残差，不删去不合意的点','③ 相同 σ_los=150 km/s，r=10 kpc：Jeans 模型的质量']
  text(40,top+20,titles[n],'h')
  xx=lambda v:145+890*(v-plot['xmin'])/(plot['xmax']-plot['xmin'])
  yy=lambda v:top+295-210*(v-plot['ymin'])/(plot['ymax']-plot['ymin'])
  for i in range(5):
   v=plot['ymin']+(plot['ymax']-plot['ymin'])*i/4;x=plot['xmin']+(plot['xmax']-plot['xmin'])*i/4
   p.append(f'<line x1="145" x2="1035" y1="{yy(v)}" y2="{yy(v)}" stroke="#cdd3d7"/>')
   text(130,yy(v)+5,f'{v:.5g}','s','end');text(xx(x),top+325,f'{x:.4g}','s','start'if i==0 else'end'if i==4 else'middle')
  if plot['ymin']<0<plot['ymax']:p.append(f'<line x1="145" x2="1035" y1="{yy(0)}" y2="{yy(0)}" stroke="#67717a" stroke-dasharray="4 4"/>')
  text(1035,top+359,plot['xlabel'],'s','end')
  labels=[['实线：重子+晕','虚线：重子','点与误差棒：发布观测'],['z=(model−data)/eV'],['γ=4：质量随 β 改变','γ=3：本模型内恰好抵消 β']]
  for j,r in enumerate(plot['series']):
   lx=145+j*(290 if n==0 else 440);p.append(f'<line x1="{lx}" x2="{lx+25}" y1="{top+55}" y2="{top+55}" stroke="{r["color"]}" stroke-width="3" stroke-dasharray="{r["dash"]}"/>');text(lx+34,top+60,labels[n][j],'s')
   if not r['pointsOnly']:
    points=' '.join(f'{xx(x):.12g},{yy(v):.12g}'for x,v in zip(plot['xs'],r['values']))
    p.append(f'<polyline data-plot="{plot["key"]}" data-series="{r["key"]}" points="{points}" fill="none" stroke="{r["color"]}" stroke-width="2.5" stroke-dasharray="{r["dash"]}"/>')
   for i,(x,v)in enumerate(zip(plot['xs'],r['values'])):
    if r['errors']:
     a=yy(v-r['errors'][i]);b=yy(v+r['errors'][i]);z=xx(x)
     p.append(f'<line data-error="{i}" x1="{z}" x2="{z}" y1="{a}" y2="{b}" stroke="{r["color"]}"/>')
     for y in [a,b]:p.append(f'<line x1="{z-3}" x2="{z+3}" y1="{y}" y2="{y}" stroke="{r["color"]}"/>')
    if r['pointsOnly']:p.append(f'<circle data-observed="{i}" cx="{xx(x)}" cy="{yy(v)}" r="3" fill="{r["color"]}"/>')
  notes=['v∞=134 km/s，r_c=5.5 kpc；误差棒不含完整倾角与距离系统误差。',
   'χ²_diag='+f'{d["s"]["chi"]:.6f}'+'；这个量依赖误差模型，不是暗物质粒子的显著性。',
   'γ 是示踪密度斜率。γ=3 的抵消依赖常圆速度、常 β 与幂律假设。']
  text(40,top+403,notes[n],'s')
 text(40,1465,'资料：Lelli, McGaugh & Schombert (2016), SPARC；模型、残差与 Jeans 图为本课程计算。','s')
 p.append('</svg>');return '\n'.join(p)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['physics-course/images/ap-06-rotation-curve.svg','physics-course/site/assets/img/ap-06-rotation-curve.svg']:(ROOT/f).write_text(s)
 print('SPARC data and Jeans projection figure written')
