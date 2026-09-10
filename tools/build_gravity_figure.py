"""Native mechanism diagram for regular light cones, entropy units, TT response and bounded chirps."""
from pathlib import Path
import subprocess,json,html,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/gravitational-chirp.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/gr-03-gw-blackhole.svg'
d=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({bh:a.snapshot(),plus:a.polarization({angle:0}),cross:a.polarization({angle:45}),chirp:a.chirp()}))",str(JS.resolve())],text=True))
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="2200" viewBox="0 0 1100 2200" role="img" aria-labelledby="title desc"><title id="title">黑洞光锥、熵的单位与引力波测量</title><desc id="desc">三个半径的正则未来光锥；质量变化时温度熵与潮汐的缩放；放大标记的加与交叉偏振；三条领先阶频率轨迹各到自己的明确截断，不绘制虚构并合或铃宕。</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="context-stroke" stroke-width="1.5"/></marker></defs><rect width="1100" height="2200" fill="#faf7ef"/><g font-family="system-ui,sans-serif" fill="#253346">']
def text(x,y,s,size=20,anchor='start',color='#253346'):
 p.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,color='#cad0d5',arrow=False,attrs=''):
 p.append(f'<line x1="{x1:.12g}" y1="{y1:.12g}" x2="{x2:.12g}" y2="{y2:.12g}" stroke="{color}" stroke-width="1.8"'+(' marker-end="url(#arrow)"'if arrow else'')+f' {attrs}/>')
def circle(x,y,kind,index,color,r=1.5):
 p.append(f'<circle data-kind="{kind}" data-index="{index}" cx="{x:.12g}" cy="{y:.12g}" r="{r}" fill="{color}"/>')
def curve(points,xf,yf,kind,color):
 nodes=[]
 for i,(a,b)in enumerate(points):
  x,y=xf(a),yf(b);nodes.append(f'{x:.12g},{y:.12g}');circle(x,y,kind,i,color)
 p.append(f'<polyline data-kind="{kind}-line" points="{" ".join(nodes)}" fill="none" stroke="{color}" stroke-width="1.7"/>')
def axis(left,top,width,height,xmin,xmax,ymin,ymax):
 xf=lambda x:left+width*(x-xmin)/(xmax-xmin);yf=lambda y:top+height-height*(y-ymin)/(ymax-ymin)
 for i in range(5):
  x=xmin+(xmax-xmin)*i/4;y=ymin+(ymax-ymin)*i/4;line(left,yf(y),left+width,yf(y));text(left-12,yf(y)+5,f'{y:.3g}',16,'end');text(xf(x),top+height+30,f'{x:.3g}',16,'middle')
 return xf,yf
text(40,50,'黑洞与引力波：把因果、单位和测量对象分开',28)
text(40,94,'先看光锥能去哪，再算温度与熵，最后核对波对探测器和双星能量的作用。',20)
text(40,148,'① 光滑坐标中的未来光锥：视界不是局部物理墙',24)
text(40,191,'x=r/rs，T=cv/rs−x；箭头表示局部未来方向，不是完整光线轨迹。',19)
for i,(x,xc)in enumerate([(.5,250),(1,570),(2,890)]):
 vi=-1;vo=(x-1)/(x+1);p.append(f'<polygon points="{xc},430 {xc+140*vi},245 {xc+140*vo},245" fill="#347fbd" fill-opacity=".12"/>')
 line(xc,430,xc+140*vi,245,'#347fbd',True,f'data-cone="{i}" data-family="in"')
 line(xc,430,xc+140*vo,245,'#b87b20',True,f'data-cone="{i}" data-family="out"')
 text(xc-20,474,'x='+str(x),20,'middle')
 text(xc-20,512,('内部：两族都向较小r','视界：出射族沿视界','外部：出射族可增大r')[i],19,'middle')
line(100,436,100,250,'#657586',True);text(74,334,'T↑',19,'middle')
line(40,550,1060,550)
text(40,600,'② 同一个熵：S/kB 与 S 的 SI 数值相差约 23 个数量级',24)
text(50,646,'一太阳质量：S/kB≈1.04895×10⁷⁷；S≈1.44824×10⁵⁴ J/K。',21)
xf,yf=axis(135,710,490,270,-2,2,-4.6,4.6)
for key,kind,color in [('logEntropyRatio','mass-entropy','#347fbd'),('logTemperatureRatio','mass-temperature','#b87b20'),('logTideRatio','mass-tide','#348557')]:
 curve([(r['logMassRatio'],r[key])for r in d['bh']['scales']],xf,yf,kind,color)
text(380,1050,'横轴 log10(M/M₀)；纵轴各物理量的 log10 比值',18,'middle')
text(695,735,'固定 x=r/rs，比较不同质量：',20)
text(695,786,'蓝：熵∝M²',21,color='#347fbd')
text(695,836,'橙：Hawking温度∝M⁻¹',20,color='#956417')
text(695,886,'绿：局部潮汐特征值∝M⁻²',20,color='#348557')
text(695,945,'TH(M☉)≈6.17007×10⁻⁸ K',20)
text(695,998,'半经典公式；不是实测辐射。',19)
line(40,1090,1060,1090)
text(40,1138,'③ 波使固有分离变化：单臂 ±hL/2，差分 hL',24)
text(40,1182,'下图只把线性形变方向放大；示意幅度 0.3，实际应变 h₀=10⁻²¹。',20)
for kind,key,xc in [('plus','plus',260),('cross','cross',650)]:
 rows=d[key]['ring'];xf=lambda x:xc+130*x;yf=lambda y:1360-130*y
 line(xc-165,1360,xc+165,1360);line(xc,1195,xc,1525)
 curve([(r['x0'],r['y0'])for r in rows],xf,yf,kind+'-reference','#8b959e')
 curve([(r['drawX'],r['drawY'])for r in rows],xf,yf,kind+'-deformed','#347fbd'if key=='plus'else'#b87b20')
 text(xc,1566,'ψ=0°：加偏振'if key=='plus'else'ψ=45°：交叉偏振',21,'middle')
text(875,1263,'L=4000 m，波峰：',19)
text(875,1320,'加偏振单臂',19)
text(875,1360,'±2×10⁻¹⁸ m',21)
text(875,1420,'两臂差分',19)
text(875,1460,'4×10⁻¹⁸ m',21)
text(50,1620,'交叉偏振对当前x/y臂的差分为0，旋转探测器后可有响应；零读数不等于没有波。',20)
line(40,1650,1060,1650)
text(40,1697,'④ 有限旋近：每条质量曲线都在自己的 xPN=0.1 处停止',24)
tracks=d['chirp']['tracks'];xmax=max(t['duration']for t in tracks)*1.03;ymax=max(t['fCut']for t in tracks)*1.06
xf,yf=axis(135,1745,600,265,0,xmax,0,ymax)
for t,color in zip(tracks,['#347fbd','#b87b20','#348557']):
 curve([(r['elapsed'],r['frequency'])for r in t['rows']],xf,yf,'chirp-'+str(t['massFactor']),color)
text(435,2075,'横轴：观测秒；纵轴：GW频率Hz',19,'middle')
text(785,1777,'Mc源=5、10、20 M☉',19)
text(785,1820,'η=1/4，z=0',20)
text(785,1870,'当前10 M☉区间：',19)
text(785,1913,'20→88.9511 Hz',20)
text(785,1956,'约4.64106秒',20)
text(785,1999,'约138.761个波周期',19)
text(40,2130,'这里只画频率演化，不把任意振荡接成并合或铃宕。形式τ与真实并合时刻不同。',20)
text(40,2174,'完整推导、四道解答、各模型全部数值节点，以及图形放大量都在正文和可展开账本。',18)
p.append('</g></svg>');OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(p))
print(OUT)
