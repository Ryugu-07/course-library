from math import sin, cos, pi, sqrt
from build_foundation_figures import save, text, line, BLUE, RED, GREEN, INK

def main():
    b=text(25,37,'同一物理范数，两种坐标',25)
    for cx in [150,450]:
        b+=line(cx-105,200,cx+105,200,INK)+line(cx,285,cx,105,INK)
    for cx,prefix in [(150,"a"),(450,"y")]:
        b+=text(cx+90,226,prefix+"₀",18,INK)+text(cx+12,120,prefix+"₁",18,INK)
        b+=line(cx+60,196,cx+60,204,INK)+text(cx+60,225,"1",15,INK,"middle")
    points=[]
    for i in range(101):
        p=2*pi*i/100; y0,y1=cos(p),sin(p)
        a1=2*y1/sqrt(3); a0=y0-a1/2
        points.append(f'{150+60*a0:.2f},{200-60*a1:.2f}')
    b+='<polyline points="'+' '.join(points)+'" fill="none" stroke="'+BLUE+'" stroke-width="3"/>'
    b+='<circle cx="450" cy="200" r="60" fill="none" stroke="'+GREEN+'" stroke-width="3"/>'
    b+=text(150,83,'a 坐标：a†Na = 1',21,BLUE,'middle')+text(450,83,'y 坐标：y†y = 1',21,GREEN,'middle')
    b+=line(267,175,331,175,RED,True)+text(300,150,'y = Ra',19,RED,'middle')
    b+=text(150,317,'非正交环境，N ≠ I',20,BLUE,'middle')+text(450,317,'正交环境，N = I',20,GREEN,'middle')
    b+=text(300,359,'图示取实坐标；范数与能量一起变换。',21,INK,'middle')
    save('physics-course','bridge-07-mps-metric','MPS 范数矩阵与正交坐标','左图以 θ=60° 绘制 a†Na=1 的椭圆，右图为 y=Ra 后的单位圆。椭圆与圆表示同一组归一化物理态，不能在左图错误使用 a†a=1。',b)

if __name__=='__main__':main()
