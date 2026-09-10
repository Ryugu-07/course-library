"""Reproducible clock, flat-acceleration and directional-tide mechanism figure."""
from pathlib import Path
import subprocess,json,html,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/equivalence-tides.js'
OUT=Path(sys.argv[2])if len(sys.argv)>2 else ROOT/'physics-course/images/gr-01-light-bending.svg'
d=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({clock:a.snapshot(),flat:a.snapshot({mode:'rindler'}),tide:a.snapshot({mode:'tides'})}))",str(JS.resolve())],text=True))
p=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1840" viewBox="0 0 1100 1840" role="img" aria-labelledby="title desc"><title id="title">静止钟、平直加速实验室与有方向的潮汐</title><desc id="desc">静止钟的两个互为倒数的比值；Rindler两条世界线的全部201节点和直光线；径向伸长、横向压缩以及181个角度的线性潮汐分量。</desc><defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse"><path d="M0 0L9 4.5L0 9" fill="none" stroke="context-stroke" stroke-width="1.5"/></marker></defs><rect width="1100" height="1840" fill="#faf7ef"/><g font-family="system-ui,sans-serif" fill="#253346">']
def text(x,y,s,size=20,anchor='start',color='#253346'):
 p.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,color='#cad0d5',arrow=False):
 a=' marker-end="url(#arrow)"'if arrow else''
 p.append(f'<line x1="{x1:.12g}" y1="{y1:.12g}" x2="{x2:.12g}" y2="{y2:.12g}" stroke="{color}" stroke-width="2"{a}/>')
def circle(x,y,color,kind,index,r=2.5):
 p.append(f'<circle data-kind="{kind}" data-index="{index}" cx="{x:.12g}" cy="{y:.12g}" r="{r}" fill="{color}"/>')
def box(x,y,w,h):
 p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#fffdf8" stroke="#aab5be"/>')
def curve(nodes,x,y,color,kind):
 points=[]
 for i,(a,b)in enumerate(nodes):
  points.append(f'{x(a):.12g},{y(b):.12g}');circle(x(a),y(b),color,kind,i)
 p.append(f'<polyline data-kind="{kind}-line" points="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="2"/>')
text(40,48,'一个“引力”词，三种需要分别核对的实验',28)
text(40,88,'读图顺序：测量对象 → 参考钟或自由落体标架 → 公式适用范围。',20)
text(40,145,'① 静止钟：光子频率比与钟速率比互为倒数',24)
box(80,195,300,100);text(230,232,'上钟：被支撑在 R+h',21,'middle');text(230,269,'自身走得较快',20,'middle')
box(80,370,300,100);text(230,407,'下钟：被支撑在 R',21,'middle');text(230,444,'从这里发射光',20,'middle')
line(405,420,405,245,'#347fbd',True);text(432,330,'光向上',19)
text(540,223,'接收频率 / 发射频率 = ℛ < 1',22)
text(540,270,'上钟速率 / 下钟速率 = 1/ℛ > 1',22)
text(540,322,'频率损失 D = 1−ℛ',21)
text(540,364,'谱线红移 z = 1/ℛ−1 = D/(1−D)',21)
text(540,414,'22.5 m 地球模型：D ≈ 2.45847×10⁻¹⁵',20)
text(540,457,'静止钟，不含轨道速度或 Doppler 项。',18)
line(40,510,1060,510)
text(40,561,'② Rindler：有钟速梯度，Riemann 曲率却全为零',24)
text(40,604,'χ = a₀L/c² = 0.5；世界线是弯的，惯性坐标中的光线仍为直线。',20)
s=d['flat'];rows=s['worldlines'];sample=s['sample']
xmax=max(r['upperX']for r in rows)*1.05;ymax=max(r['upperCT']for r in rows)*1.05
x=lambda a:135+475*a/xmax;y=lambda b:1020-340*(b+ymax)/(2*ymax)
for i in range(5):
 xv=xmax*i/4;yv=-ymax+2*ymax*i/4
 line(135,y(yv),610,y(yv));text(122,y(yv)+6,f'{yv:.3g}',17,'end');text(x(xv),1055,f'{xv:.3g}',17,'middle')
curve([(r['lowerX'],r['lowerCT'])for r in rows],x,y,'#347fbd','lower-worldline')
curve([(r['upperX'],r['upperCT'])for r in rows],x,y,'#b87b20','upper-worldline')
curve([(0,0),(sample['arrivalX'],sample['arrivalCT'])],x,y,'#348557','null-light')
text(373,1098,'横轴 X/(c²/a₀)；纵轴 cT/(c²/a₀)',19,'middle')
text(675,699,'蓝：下钟 x=0，固有加速度 a₀',20,color='#347fbd')
text(675,746,'橙：上钟 x=L，固有加速度 2a₀/3',19,color='#956417')
text(675,793,'绿：直光线 X=cT',20,color='#348557')
text(675,845,'抵达：s = log(3/2)',21)
text(675,890,'频率比 2/3；损失 1/3；z=1/2',20)
text(675,943,'N=1+a₀x/c²，N″=0',21)
text(675,988,'Rˣ₀ₓ₀ = NN″ = 0',23)
text(675,1032,'坐标加速度不是曲率。',20)
line(40,1140,1060,1140)
text(40,1191,'③ 自由落体双球：径向伸长，横向压缩',24)
text(260,1235,'径向分离：沿径向向外 →',21,'middle')
text(790,1235,'横向分离：径向向外 ↑',21,'middle')
for i,a in enumerate([190,330]):circle(a,1285,'#347fbd','radial-ball',i,12)
line(174,1285,120,1285,'#347fbd',True);line(346,1285,400,1285,'#347fbd',True)
for i,a in enumerate([720,860]):circle(a,1285,'#b87b20','transverse-ball',i,12)
line(736,1285,773,1285,'#b87b20',True);line(844,1285,807,1285,'#b87b20',True)
text(260,1335,'Δaᵣ = +2GMℓ/r³',22,'middle')
text(790,1335,'Δa⊥ = −GMℓ/r³',22,'middle')
text(40,1388,'下图按 GMℓ/r³ 归一化：每个角度都保留符号；线性模型要求 ℓ/r 很小。',20)
x=lambda a:135+880*a/90;y=lambda b:1680-220*(b+1.2)/3.4
for i in range(5):
 xv=90*i/4;yv=-1.2+3.4*i/4;line(135,y(yv),1015,y(yv));text(122,y(yv)+5,f'{yv:.3g}',17,'end');text(x(xv),1715,f'{xv:.3g}',17,'middle')
rows=d['tide']['rows'];scale=d['tide']['sample']['k']*d['tide']['sample']['separation']
curve([(r['angle'],r['linearR']/scale)for r in rows],x,y,'#347fbd','radial-angle')
curve([(r['angle'],r['linearT']/scale)for r in rows],x,y,'#b87b20','transverse-angle')
text(575,1755,'θ（相对径向的角度）',20,'middle')
text(135,1798,'蓝：2 cosθ，径向分量',20,color='#347fbd')
text(660,1798,'橙：−sinθ，横向分量',20,color='#956417')
p.append('</g></svg>');OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(''.join(p))
print(OUT)
