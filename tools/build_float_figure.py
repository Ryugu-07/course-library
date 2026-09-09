from pathlib import Path
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parents[1]
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 720" role="img" aria-labelledby="float-title float-desc">','<title id="float-title">浮点间距随数值尺度变化</title>','<desc id="float-desc">三位二进制有效精度的正正常数，1到2间距0.25，2到4间距0.5。下方面板显示binary64在1左右间距1比2，并标注正中取偶。</desc>','<rect width="1100" height="720" fill="#faf8f0"/>','<style>text{font-family:-apple-system,BlinkMacSystemFont,sans-serif;fill:#20364b}.title{font-size:26px;font-weight:700}.label{font-size:18px}.small{font-size:15px}</style>']
def text(x,y,s,cls='small',anchor='start'):
 parts.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#58758e',width=2,more=''):
 parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" {more}/>')
text(35,48,'浮点数不是均匀铺满数轴的实数','title')
text(35,84,'上：三位二进制有效精度 p=3 的简化正常数模型；点的位置按实际数值计算。')
start=130;scale=270
for a,b,color in [(1,2,'#3c64a4'),(2,4,'#ad762b')]:
 x=start+(a-1)*scale;w=(b-a)*scale
 parts.append(f'<rect x="{x}" y="120" width="{w}" height="125" fill="{color}" fill-opacity=".07"/>')
line(95,190,995,190)
values=[1+i/4 for i in range(4)]+[2+i/2 for i in range(5)]
for v in values:
 x=start+(v-1)*scale
 parts.append(f'<circle data-float-value="{v}" cx="{x}" cy="190" r="6" fill="#3c64a4"/>')
 text(x,224,str(v).removesuffix('.0'),'label','middle')
text(265,148,'[1, 2)：间距 1/4','label','middle')
text(670,148,'[2, 4)：间距 1/2','label','middle')
mid=start+.125*scale
line(mid,265,mid,195,'#b44435',2,'stroke-dasharray="4 3"')
text(35,290,'1.125 恰在 1 与 1.25 的正中；保留 3 位尾数时，正中取偶选 1.00₂ = 1。')
text(35,321,'“偶”指保留尾数的最低二进制位为 0，不是十进制数值为偶数。')
line(35,350,1065,350,'#d2cbb8',1)
text(35,393,'下：binary64 在 1 附近单独放大','label')
text(35,425,'横轴以 1 为中心，单位为 2⁻⁵³；仍按相同单位等比例定位。')
line(235,494,960,494)
for offset,x,label in [(-1,360,'1 − 2⁻⁵³'),(0,480,'1'),(2,720,'1 + 2⁻⁵²')]:
 parts.append(f'<circle data-binary-offset="{offset}" cx="{x}" cy="494" r="7" fill="#3c64a4"/>')
 text(x,529,label,'label','middle')
line(360,465,480,465,'#3c64a4');line(480,465,720,465,'#ad762b')
text(420,452,'2⁻⁵³','small','middle');text(600,452,'2⁻⁵²','small','middle')
text(35,578,'εmach = 2⁻⁵²：1 到右邻点的距离。u = 2⁻⁵³：最近舍入的标准相对误差界。')
text(35,616,'标准相对模型需要无溢出、正常数等条件；非正常数以固定间距逐渐靠近 0。')
text(35,655,'上图是便于数清点的 p=3 模型；下图才是 binary64。两图不共用缩放尺度。')
parts.append('</svg>')
(ROOT/'math-course/images/num-01-float-line.svg').write_text('\n'.join(parts)+'\n')
print('Built exact floating point number lines')
