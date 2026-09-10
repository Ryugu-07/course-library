"""Thin-disk figure from the published physical model; no assembled proxy spectrum."""
from pathlib import Path
from html import escape
import json, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
def build():
 script="const h=require('./course-shared/labs/accretion-eddington.js');const s=h.snapshot({});console.log(JSON.stringify({s,plots:h.plots(s)}));"
 data=json.loads(subprocess.check_output(PREFIX+['node','-e',script],cwd=ROOT,text=True))
 s=data['s'];p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1480" viewBox="0 0 1100 1480" role="img" aria-labelledby="title desc"><title id="title">薄盘的温度、Planck 光谱和双面能量账</title><desc id="desc">默认十太阳质量、半 Eddington 光度、内缘六引力半径、Newton效率十二分之一，外缘为内缘的一千倍。三图来自同一个模型。完整节点保留在SVG坐标中及页面交互表中。</desc><rect width="1100" height="1480" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;fill:#253345}.h{font-size:23px;font-weight:650}.l{font-size:18px}.s{font-size:16px}</style>']
 def text(x,y,t,cls='l',anchor='start'):
  p.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(str(t))}</text>')
 text(40,39,'一张盘，三种检查：温度、光谱和积分光度','h')
 text(40,74,'M=10 M☉，λ=0.5，x_in=6，η=1/12，Y=1000；Newton 零力矩模型。','s')
 for n,d in enumerate([data['plots'][0],data['plots'][2],data['plots'][1]]):
  top=110+425*n
  text(40,top+20,str(n+1)+'  '+d['title'],'h')
  xx=lambda v:140+900*(v-d['xmin'])/(d['xmax']-d['xmin'])
  yy=lambda v:top+287-210*(v-d['ymin'])/(d['ymax']-d['ymin'])
  for i in range(5):
   v=d['ymin']+(d['ymax']-d['ymin'])*i/4
   x=d['xmin']+(d['xmax']-d['xmin'])*i/4
   p.append(f'<line x1="140" x2="1040" y1="{yy(v)}" y2="{yy(v)}" stroke="#cdd3d7"/>')
   text(126,yy(v)+5,f'{v:.5g}','s','end')
   text(xx(x),top+317,f'{x:.5g}','s','start' if i==0 else 'end' if i==4 else 'middle')
  text(1040,top+351,d['xlabel'],'s','end')
  for j,r in enumerate(d['series']):
   points=' '.join(f'{xx(x):.12g},{yy(v):.12g}' for x,v in zip(d['xs'],r['values']))
   p.append(f'<polyline data-plot="{d["key"]}" data-series="{r["key"]}" points="{points}" fill="none" stroke="{r["color"]}" stroke-width="2.5" stroke-dasharray="{r["dash"]}"/>')
   text(140+j*480,top+53,r['label'],'s')
  notes=[
   '内缘 T=0；T 在 y=49/36 达峰。虚线与实线共用 T*，没有各自归一化。',
   '每点积分 801 个径向节点；低频 ν²、中频近似 ν¹ᐟ³、高频截断各有适用条件。',
   '最热处 y=49/36 ≠ 对数环带贡献峰 y=9/4；半数辐射来自 y≤4。']
  text(40,top+392,notes[n],'s')
 text(40,1409,'谱的 ∫uSν d ln u = '+f'{s["spectrum"]["integrated"]:.10f}'+'；解析有限盘比例 = '+f'{s["disk"]["outerFraction"]:.10f}'+'。','s')
 text(40,1442,'若用 Schwarzschild η 反推 Ṁ 再套 Newton 通量：L_N/L≈1.4571，暴露模型混用。','s')
 p.append('</svg>');return '\n'.join(p)+'\n'
if __name__=='__main__':
 s=build()
 for f in ['physics-course/images/ap-05-accretion-disk.svg','physics-course/site/assets/img/ap-05-accretion-disk.svg']:(ROOT/f).write_text(s)
 print('Accretion Planck-integral figure written')
