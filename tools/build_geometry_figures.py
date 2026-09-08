"""Reproducible, native SVG diagrams for the algebra/quantum-geometry bridge."""
from build_foundation_figures import save, text, line, box, BLUE, RED, GREEN, INK
import math

def main():
    b=text(25,38,'换系数后，单射可能失效',25)
    b+=text(35,90,'Z',28,BLUE)+line(90,80,265,80,BLUE,True)+text(175,68,'×6',20,BLUE,'middle')+text(290,90,'Z',28,BLUE)
    b+=text(400,90,'核 = {0}',22)
    b+=text(25,140,'与 Z/4 张量后：',22)
    for i in range(4):
        x=90+i*135;y=210; dest=90+((6*i)%4)*135
        b+=line(x,y,dest,285,RED if i==2 else BLUE,True)
        b+=text(x,195,str(i),24,INK,'middle')+text(x,316,str(i),24,INK,'middle')
    b+=text(25,355,'核 {0,2}；像 {0,2}；余核有两个类',21)
    save('grad-math','bridge-05-tensor-tor','换系数产生新的核','上方整数乘六是单射，下方模四乘六把零和二映到零，一和三映到二。',b)

    b=text(25,38,'O(−3)：两端可消去，中间留下类',24)
    b+=text(25,90,'U₁ 提供 j≤−3',22,BLUE)+text(350,90,'U₀ 提供 j≥0',22,GREEN)
    b+=line(35,170,565,170)
    for j in range(-5,4):
        x=50+(j+5)*62
        color=BLUE if j<=-3 else GREEN if j>=0 else RED
        b+=f'<circle cx="{x}" cy="170" r="9" fill="{color}"/>'+text(x,207,str(j),20,INK,'middle')
    b+=box(170,240,265,65,RED)+text(302,282,'[z⁻²] 与 [z⁻¹]',25,RED,'middle')
    b+=text(25,345,'h⁰ = 0；h¹ = 2。图上的轴标是指数 j。',21)
    save('grad-math','bridge-06-cech','Laurent 指数缺口','指数小于等于负三由第一侧消去，大于等于零由另一侧消去，只剩负二和负一两个独立类。',b)

    b=text(25,38,'局部相位不同，曲率仍然相同',24)
    b+=box(25,80,260,150,BLUE)+box(315,80,260,150,GREEN)
    b+=text(155,115,'北侧规范',23,BLUE,'middle')+text(445,115,'南侧规范',23,GREEN,'middle')
    b+=text(155,162,'Aφ = (1−cos θ)/2',20,BLUE,'middle')+text(445,162,'Aφ = −(1+cos θ)/2',19,GREEN,'middle')
    b+=text(155,206,'北极可用',20,BLUE,'middle')+text(445,206,'南极可用',20,GREEN,'middle')
    b+=text(300,269,'uS = eⁱᵠ uN；AS = AN − dφ',23,INK,'middle')
    b+=text(300,315,'Fθφ = sin θ / 2',26,RED,'middle')
    b+=text(25,358,'下能级；A=i⟨u|du⟩；取向 dθ∧dφ。',20)
    save('physics-course','bridge-03-berry','两套规范同一个曲率','南北两个局部本征态相差相位exp(i phi)，联络相差负dphi，曲率相同。',b)

    b=text(25,38,'局部二次近似不等于有限距离',24)
    b+=line(70,280,550,280)+line(70,280,70,75)
    for e in [0,1,2]:b+=text(70+230*e,310,str(e),19,INK,'middle')
    for loss in [0,.5,1]:b+=text(57,285-190*loss,str(loss),18,INK,'end')
    for color,f in [(BLUE,lambda e:math.sin(e/2)**2),(RED,lambda e:e*e/4)]:
        pts=' '.join(f'{70+230*e:.2f},{280-190*f(e):.2f}' for e in [i/40 for i in range(81)])
        b+=f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="3"/>'
    b+=text(83,86,'1−保真度',18)+text(520,342,'ε / rad',20,INK,'end')
    b+=text(93,131,'θ = π/2',20)+text(93,161,'精确 sin²(ε/2)',19,BLUE)+text(93,191,'近似 ε²/4',19,RED)
    b+=text(25,371,'图示 0≤ε≤2；二次式只在局部准确。',20)
    save('physics-course','research-09-quantum-metric','量子度量近似与精确保真度','赤道两态之间的精确保真度损失为正弦平方，小步长时等于步长平方除四，大步长时两曲线分离。',b,height=400)

if __name__=='__main__':main()
