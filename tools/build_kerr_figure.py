"""Native coordinate and energy diagram; all curve nodes come from the reviewed model."""
from pathlib import Path
import subprocess,json,html,shutil,sys,math
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-kerr-causality.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/gr-04-kerr-ledgers.svg'
d=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({ext:a.snapshot(),area:a.snapshot({mode:'area'})}))",str(JS.resolve())],text=True))
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="2200" viewBox="0 0 1100 2200" role="img" aria-labelledby="title desc"><title id="title">Kerr：坐标、当地能量与理想抽取</title><desc id="desc">纬度上的坐标静止极限，赤道全径向因果角速度，两种能量的速度扫描，以及固定不可约质量的完整路径。全部曲线由同一显式模型生成，非空间嵌入或真实轨道图。</desc><rect width="1100" height="2200" fill="#faf7ef"/><g font-family="system-ui,sans-serif" fill="#253346">']
def text(x,y,s,size=20,anchor='start',color='#253346'):p.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,color='#cad0d5',attrs=''):p.append(f'<line x1="{x1:.12g}" y1="{y1:.12g}" x2="{x2:.12g}" y2="{y2:.12g}" stroke="{color}" stroke-width="1.6" {attrs}/>')
def curve(points,xf,yf,kind,color):
 pts=[]
 for i,(x,y)in enumerate(points):
  xx,yy=xf(x),yf(y);pts.append(f'{xx:.12g},{yy:.12g}');p.append(f'<circle data-kind="{kind}" data-index="{i}" cx="{xx:.12g}" cy="{yy:.12g}" r="1.4" fill="{color}"/>')
 p.append(f'<polyline data-kind="{kind}-line" points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="1.8"/>')
def axis(left,top,width,height,xmin,xmax,ymin,ymax):
 xf=lambda x:left+width*(x-xmin)/(xmax-xmin);yf=lambda y:top+height-height*(y-ymin)/(ymax-ymin)
 for i in range(5):
  x=xmin+(xmax-xmin)*i/4;y=ymin+(ymax-ymin)*i/4;line(left,yf(y),left+width,yf(y));text(left-12,yf(y)+5,f'{y:.4g}',16,'end');text(xf(x),top+height+27,f'{x:.4g}',16,'middle')
 return xf,yf
text(40,50,'Kerr 黑洞：同一次运动，三种读数',29)
text(40,94,'默认a*=0.8；外部粒子r=1.8、v=-0.8；单位G=c=M初始=1。',20)
text(40,150,'① 视界和静止极限：只在两极相接',24)
xf,yf=axis(125,195,600,275,0,180,1.5,2.1)
for key,kind,color in [('outer','horizon','#347fbd'),('ergosurface','ergosurface','#b87b20')]:
 curve([(r['theta'],r[key])for r in d['ext']['surfaces']],xf,yf,kind,color)
text(425,537,'横轴：θ（度）；纵轴：坐标半径r',19,'middle')
text(780,242,'橙：rE(θ)',22,color='#956417');text(780,298,'蓝：r+=1.6',22,color='#347fbd')
text(780,361,'赤道rE=2',20);text(780,416,'两极rE=r+',20)
text(40,583,'这是r(θ)函数图，不是空间的欧氏嵌入；图上距离不能直接当固有距离。',20)
line(40,611,1060,611)
text(40,659,'② 坐标角速度的允许区间：在能层内被迫共转',24)
r=d['ext']['radial'];xmin=-5;xmax=math.log10(20);ymin=-.2;ymax=.36
xf,yf=axis(125,708,600,270,xmin,xmax,ymin,ymax)
for key,kind,color in [('lower','omega-minus','#347fbd'),('omega','zamo','#348557'),('upper','omega-plus','#b87b20')]:
 curve([(v['logOffset'],v[key])for v in r],xf,yf,kind,color)
line(125,yf(0),725,yf(0),'#657586')
text(425,1044,'横轴：log10(r−r+)；纵轴：Ω=dφ/dt',19,'middle')
text(775,750,'当前r=1.8：',20);text(775,802,'Ω−≈0.0783555',20,color='#347fbd')
text(775,851,'ω≈0.193611',20,color='#348557');text(775,900,'Ω+≈0.308866',20,color='#956417')
text(40,1088,'负自旋时区间整体反号；负角速度此时与黑洞同向，不能一律叫逆转。',20)
line(40,1122,1060,1122)
text(40,1170,'③ 负Killing能量与正的当地能量可以同时出现',24)
rows=d['ext']['velocityRows'];ymin=min(x['energy']for x in rows)*1.1;ymax=max(x['localEnergy']for x in rows)*1.06
xf,yf=axis(125,1215,600,270,-.99,.99,ymin,ymax)
for key,kind,color in [('energy','killing-energy','#347fbd'),('localEnergy','local-energy','#b87b20')]:
 curve([(v['velocity'],v[key])for v in rows],xf,yf,kind,color)
line(125,yf(0),725,yf(0),'#657586')
text(425,1553,'横轴：ZAMO局部v/c；纵轴：能量/μc²',19,'middle')
text(775,1255,'当前v=-0.8：',20);text(775,1305,'当地E/μ=5/3',20,color='#956417')
text(775,1355,'Killing E/μ≈-0.1415',19,color='#347fbd');text(775,1410,'坐标Ω≈+0.1014',20)
text(40,1594,'当地逆转、坐标共转、当地能量为正：先写出参考观察者，再解释正负号。',20)
line(40,1625,1060,1625)
text(40,1674,'④ 理想可逆抽取：面积固定，质量和无量纲自旋都改变',24)
xf,yf=axis(125,1723,600,270,0,1,.88,1.01)
curve([(r['fraction'],r['mass'])for r in d['area']['path']],xf,yf,'reversible-mass','#347fbd')
line(125,yf(d['area']['sample']['mirr']),725,yf(d['area']['sample']['mirr']),'#b87b20',attrs='stroke-dasharray="5 4"')
text(425,2060,'横轴：已移除的角动量比例f；纵轴：M/M初始',18,'middle')
text(775,1762,'初始J=0.8，M=1',20);text(775,1812,'J减半后：',20)
text(775,1856,'M≈0.921954',21,color='#347fbd');text(775,1902,'a*≈0.470588',20)
text(775,1950,'终点Mirr≈0.894427',19,color='#956417')
text(40,2115,'总可释放约10.56%初始质量能；不是单次Penrose效率，也不是实际喷流效率。',20)
text(40,2162,'四道解答、全部数据节点、正则坐标与局部标架推导见正文。',20)
p.append('</g></svg>');OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(p));print(OUT)
