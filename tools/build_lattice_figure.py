"""Equal springs and alternating masses; analytic eigenvalues of the dynamical matrix."""
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-labelledby="title desc"><title id="title">双原子链真实声子色散</title><desc id="desc">近邻弹簧常数C，原胞长a，质量比m2/m1等于2。频率单位为根号C除m1。区中心声学支0、光学支根号3；区界分别为1和根号2。</desc><rect width="800" height="440" fill="#faf7ef"/><style>text{font-family:system-ui,sans-serif;font-size:14px;fill:#292722}.grid{stroke:#d7d0c2;stroke-width:1}.a{fill:none;stroke:#315f9d;stroke-width:3}.o{fill:none;stroke:#b64335;stroke-width:3}</style>']
def text(x,y,t,extra=''):parts.append(f'<text x="{x}" y="{y}" {extra}>{t}</text>')
def sx(x):return 82+(x+math.pi)/(2*math.pi)*620
def sy(w):return 342-w/1.9*254
text(34,32,'双原子链：两支来自同一个动力学矩阵','style="font-size:20px;font-weight:650"')
text(34,58,'m₂/m₁=2；相邻弹簧均为 C；a 是含两个原子的原胞长')
for w in [0,.5,1,1.5]:
 parts.append(f'<line x1="82" y1="{sy(w)}" x2="702" y2="{sy(w)}" class="grid"/>');text(70,sy(w)+5,str(w),'text-anchor="end"')
for x,label in [(-math.pi,'−π'),(0,'0'),(math.pi,'π')]:
 parts.append(f'<line x1="{sx(x)}" y1="88" x2="{sx(x)}" y2="342" class="grid"/>');text(sx(x),366,label,'text-anchor="middle"')
for sign,cls in [(-1,'a'),(1,'o')]:
 pts=[]
 for i in range(501):
  x=-math.pi+2*math.pi*i/500;disc=math.sqrt(2.25-2*math.sin(x/2)**2);w=math.sqrt(max(0,1.5+sign*disc));pts.append(f'{sx(x):.4f},{sy(w):.4f}')
 parts.append(f'<polyline points="{" ".join(pts)}" class="{cls}"/>')
text(400,100,'光学支','style="fill:#b64335"');text(500,315,'声学支','style="fill:#315f9d"')
text(34,247,'ω / √(C/m₁)','transform="rotate(-90 34 247)"');text(738,366,'ka')
text(34,401,'中心：0、√3；区界：1、√2。质量相等时区界两支接触。')
text(34,427,'同相 / 反相只描述长波极限；红外活性还要求振动改变电偶极矩。')
parts.append('</svg>');(ROOT/'physics-course/images/solid-01-phonon.svg').write_text('\n'.join(parts)+'\n')
