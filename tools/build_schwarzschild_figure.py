"""Native SVG: root topology, null barrier and equal-scale relativistic orbits."""
from pathlib import Path
import subprocess,json,html,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/schwarzschild-orbits.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/gr-02-effective-potential.svg'
d=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({bound:a.timelike(),stable:a.timelike({level:'stable'}),photon:a.photon(1),orbit:a.precession(10,.3)}))",str(JS.resolve())],text=True))
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="2050" viewBox="0 0 1100 2050" role="img" aria-labelledby="title desc"><title id="title">允许区、光子球与近日点进动</title><desc id="desc">全真空外部紧化轴上的类时径向速度平方；稳定圆轨道的孤立点；光子临界双重根；等比例的两次径向周期，全部节点可核对。</desc><rect width="1100" height="2050" fill="#faf7ef"/><g font-family="system-ui,sans-serif" fill="#253346">']
def text(x,y,s,size=20,anchor='start',color='#253346'):
 p.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,color='#cad0d5'):
 p.append(f'<line x1="{x1:.12g}" y1="{y1:.12g}" x2="{x2:.12g}" y2="{y2:.12g}" stroke="{color}" stroke-width="1.5"/>')
def circle(x,y,kind,i,color='#347fbd',radius=1.7,stroke='none'):
 p.append(f'<circle data-kind="{kind}" data-index="{i}" cx="{x:.12g}" cy="{y:.12g}" r="{radius}" fill="{color}" stroke="{stroke}" stroke-width="2"/>')
def curve(nodes,x,y,kind,color):
 points=[]
 for i,(a,b)in enumerate(nodes):
  points.append(f'{x(a):.12g},{y(b):.12g}');circle(x(a),y(b),kind,i,color)
 p.append(f'<polyline data-kind="{kind}-line" points="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="1.7"/>')
def axis(left,top,width,height,xmin,xmax,ymin,ymax):
 x=lambda v:left+width*(v-xmin)/(xmax-xmin)
 y=lambda v:top+height-height*(v-ymin)/(ymax-ymin)
 for i in range(5):
  xv=xmin+(xmax-xmin)*i/4;yv=ymin+(ymax-ymin)*i/4
  line(left,y(yv),left+width,y(yv));text(left-12,y(yv)+5,f'{yv:.3g}',16,'end');text(x(xv),top+height+30,f'{xv:.3g}',16,'middle')
 if ymin<=0<=ymax:line(left,y(0),left+width,y(0),'#657586')
 return x,y
text(40,48,'先问速度平方是否为正，再讨论轨道是什么形状',28)
text(40,90,'统一长度 GM/c²；类时与光子的归一化分开，坐标轨迹不等于相机成像。',20)
text(40,145,'① 类时 q=16、K=−0.0246875：三个根，两个分离允许区',23)
s=d['bound'];x,y=axis(135,195,870,240,0,.5,-.09,1)
for i,a in enumerate(s['allowed']):
 p.append(f'<rect data-kind="bound-allowed" data-index="{i}" x="{x(a["uMin"]):.12g}" y="195" width="{x(a["uMax"])-x(a["uMin"]):.12g}" height="240" fill="#348557" fill-opacity=".12"/>')
curve([(r['u'],r['radialSquared'])for r in s['rows']],x,y,'bound-radial','#347fbd')
for i,r in enumerate(s['roots']):circle(x(r['u']),y(0),'bound-root',i,'#faf7ef',5,'#253346')
text(570,508,'横轴 u=1/r：左端为无穷远，右端为视界；纵轴 F=(dr/dτ)²',19,'middle')
text(40,555,'普通根 r≈3.12995、6.76410、30.61228；束缚往返只在外部两根之间。',20)
text(40,594,'近视界允许区与束缚区分离。没有指定初始位置，就不能只说“会被捕获”。',20)
line(40,625,1060,625)
text(40,670,'② 加载稳定圆轨道能量：孤立点不能被涂成一段势阱',23)
text(50,720,'q=16，K=−1/27',21)
text(50,762,'F=32(u−1/12)²(u−1/3)',22)
text(50,808,'0<u<1/3 中除 u=1/12 外，F<0。',20)
text(50,852,'r=12 是精确圆轨道；r=3 是普通根。',20)
text(50,896,'提高能量后，小振幅径向振荡区才展开。',19)
line(605,790,1030,790,'#657586')
circle(675,790,'isolated-stable',0,'#347fbd',8)
p.append('<line x1="890" y1="790" x2="1030" y2="790" stroke="#348557" stroke-width="9"/>')
circle(890,790,'stable-other-root',0,'#faf7ef',7,'#253346')
text(605,748,'允许集合示意（横轴不按比例）',19)
text(675,837,'u=1/12',19,'middle');text(890,837,'u=1/3',19,'middle')
text(675,875,'孤立圆轨道',18,'middle');text(960,875,'近视界允许区',18,'middle')
text(1030,932,'u=1/2 边界不包括在内',17,'end')
line(40,968,1060,968)
text(40,1013,'③ 临界光子 β=1：双重根 r=3；入射光渐近它',23)
s=d['photon'];x,y=axis(135,1060,540,235,0,.5,-.08,1.08)
curve([(r['u'],r['radialSquared'])for r in s['rows']],x,y,'photon-radial','#b87b20')
circle(x(1/3),y(0),'photon-root',0,'#faf7ef',6,'#253346')
text(405,1365,'横轴 u；纵轴归一化径向速度平方',18,'middle')
text(725,1095,'β<1：入射光被捕获',20)
text(725,1143,'β=1：渐近光子圆轨道',20)
text(725,1191,'β>1：在外根散射返回',20)
text(725,1250,'r=2：视界',20)
text(725,1295,'r=3：光子圆轨道',20)
text(725,1340,'r=6：类时 ISCO',20)
line(40,1400,1060,1400)
text(40,1445,'④ p=10、e=0.3：半径周期重复，近日点方向不重复',23)
s=d['orbit'];span=1/(1-s['e'])*1.06;x,y=axis(135,1510,390,390,-span,span,-span,span)
curve([(r['x'],r['y'])for r in s['rows']],x,y,'orbit-first','#347fbd')
curve([(r['x'],r['y'])for r in [s['rows'][-1]]+s['secondCycle']],x,y,'orbit-second','#b87b20')
curve([(r['newtonX'],r['newtonY'])for r in s['rows']],x,y,'orbit-newton','#348557')
text(330,1970,'横轴 x/p，纵轴 y/p；相同单位对应相同长度',18,'middle')
text(610,1550,'蓝：第一径向周期',21,color='#347fbd')
text(610,1596,'橙：第二径向周期',21,color='#956417')
text(610,1642,'绿：Newton 闭合椭圆参考',21,color='#348557')
text(610,1700,'精确额外角 ≈ 3.69384 rad / 径向周期',20)
text(610,1748,'弱场一阶 ≈ 1.88496 rad / 径向周期',20)
text(610,1800,'不是把椭圆拉伸就能得到进动。',20)
text(610,1848,'e=0 时无唯一近日点：改读微扰频率比。',19)
text(610,1900,'无自力、无辐射；旋转与双体需另外建模。',19)
text(40,2020,'公式、四道完整解答与所有数值节点均在正文/实验账本中；图的边界不是适用范围的替代。',18)
p.append('</g></svg>');OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(p))
print(OUT)
