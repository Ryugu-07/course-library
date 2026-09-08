#!/usr/bin/env python3
"""Six mechanism diagrams for the prerequisite bridges; standard library only."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
INK, BLUE, RED, GREEN = '#25394a', '#286fa7', '#a64b35', '#237d68'

def text(x, y, value, size=21, color=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(value)}</text>'

def line(x, y, a, b, color=INK, arrow=False, dash=''):
    return f'<path d="M{x} {y}L{a} {b}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}"' + (' marker-end="url(#arrow)"' if arrow else '') + '/>'

def box(x, y, w, h, color=BLUE):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="white" stroke="{color}" stroke-width="2"/>'

def save(course, name, title, desc, body, height=380):
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
<rect width="600" height="{height}" rx="12" fill="#faf9f5"/>
<g font-family="system-ui, sans-serif">{body}</g></svg>\n'''
    (ROOT/course/'images'/f'{name}.svg').write_text(svg)

def main():
    b=text(25,38,'乘六是单射，余核却不为零',25)
    b+=text(50,90,'Z',30,BLUE)+line(100,80,245,80,BLUE,True)+text(165,66,'×6',20,BLUE,'middle')+text(265,90,'Z',30,BLUE)
    b+=line(320,80,445,80,BLUE,True)+text(380,65,'取模六',18,BLUE,'middle')+text(465,90,'Z/6Z',28,BLUE)
    b+=text(25,145,'中间整数轴：像只包含六的倍数',21)
    b+=line(45,200,555,200)
    for i in range(13):
        x=50+i*41
        b+=f'<circle cx="{x}" cy="200" r="{7 if i%6==0 else 4}" fill="{BLUE if i%6==0 else "#aab3ba"}"/>'
        if i%3==0: b+=text(x,230,str(i-6),18,INK,'middle')
    b+=text(25,277,'核 = {0}     像 = 6Z',23,BLUE)
    b+=text(25,318,'商保留 0、1、2、3、4、5 六类',22)
    b+=text(25,352,'整数中不可随意除以主元。',20,RED)
    save('grad-math','bridge-01-modules','整数短正合列','整数乘六为单射，像为六的倍数，商有六个剩余类。',b)

    b=text(25,38,'反演二：十二个类变成三个类',24)
    b+=box(180,62,240,64)+text(300,103,'Z/12Z',28,BLUE,'middle')
    b+=line(220,128,140,175,BLUE,True)+line(380,128,460,175,BLUE,True)
    for x,label in [(30,'Z/4Z'),(350,'Z/3Z')]:
        b+=box(x,180,220,65)+text(x+110,222,label,27,BLUE,'middle')
    b+=text(140,272,'2²=0 → 1=0',22,RED,'middle')+text(460,272,'2×2=1，已可逆',20,GREEN,'middle')
    b+=text(140,315,'零环（一个元素）',21,RED,'middle')+text(460,315,'保留 Z/3Z',24,GREEN,'middle')
    b+=text(25,355,'自然映射的核：0、3、6、9',22)
    save('grad-math','bridge-02-localization','模十二反演二','中国剩余分解的模四分量被反演二杀死，模三分量保留。',b)

    b=text(25,38,'闭链相同，允许的边界不同',24)
    for offset,filled in [(0,False),(300,True)]:
        x0,x1,x2=55+offset,240+offset,150+offset
        if filled:b+=f'<path d="M{x0} 245L{x1} 245L{x2} 105z" fill="#dfede7"/>'
        b+=line(x0,245,x1,245,BLUE,True)+line(x1,245,x2,105,BLUE,True)+line(x0,245,x2,105,RED,True)
        b+=text(x0-10,275,'v₀',20)+text(x1,275,'v₁',20)+text(x2-10,92,'v₂',20)
        b+=text(offset+150,190,'有面' if filled else '无面',23,GREEN if filled else INK,'middle')
        b+=text(offset+150,315,'H₁ = 0' if filled else 'H₁ ≅ R',24,BLUE,'middle')
    b+=text(25,355,'回路 e₀₁ + e₁₂ − e₀₂；两侧都闭合',21)
    save('grad-math','bridge-03-complexes','三角形边框和填面','边方向均依编号递增，回路系数为一一负一；填面令同调类成为边界。',b)

    b=text(25,38,'局部常值可以粘合，全局单值常数不行',23)
    b+=line(55,140,235,140,BLUE)+line(365,140,545,140,GREEN)
    for x in [55,235,365,545]:b+=f'<circle cx="{x}" cy="140" r="6" fill="#faf9f5" stroke="{INK}" stroke-width="2"/>'
    b+=text(145,115,'U：取值 0',24,BLUE,'middle')+text(455,115,'V：取值 1',24,GREEN,'middle')
    b+=text(300,189,'U ∩ V = ∅，重叠条件自动满足',22,INK,'middle')
    b+=box(35,217,530,106)+text(55,251,'单一常数：无法兼顾 0 和 1',22,RED)+text(55,293,'局部常值：在两个分支上分别取值',22,GREEN)
    b+=text(25,358,'图示开集由两个不相交区间组成。',21)
    save('grad-math','bridge-04-sheaves','常值预层的粘合失败','不相交区间分别取零和一，局部常值层可粘合，常值预层不能。',b)

    b=text(25,38,'外腿传播 × 相互作用核',25)
    for x,y in [(45,105),(45,235),(260,105),(260,235)]:b+=line(x,y,150,170,BLUE)
    b+='<circle cx="150" cy="170" r="9" fill="#a64b35"/>'
    b+=text(150,280,'每腿 i/(p²−m²+i0)',19,BLUE,'middle')
    b+=line(295,170,400,170,INK,True)+text(350,140,'截四腿',20,INK,'middle')
    b+='<circle cx="475" cy="170" r="13" fill="#a64b35"/>'
    b+=text(475,230,'−iλ',32,RED,'middle')+text(475,278,'iM = −iλ',24,RED,'middle')
    b+=text(25,325,'乘逆传播子，再取壳上极点系数。',22)
    b+=text(25,359,'树级 Z=1；公共动量守恒 δ 已提出。',20)
    save('physics-course','bridge-01-lsz','外腿截肢','四条外腿各带传播子，截肢后仅剩负i乘lambda，约化振幅为负lambda。',b)

    b=text(25,38,'共同发散相消，有限差留下',24)
    b+=box(25,67,550,66)+text(45,108,'BΛ(Q)  =  公共 log Λ  +  有限项(Q)',21,BLUE)
    b+=text(300,165,'减去同一截断处的参考值',21,INK,'middle')
    b+=box(25,187,550,66)+text(45,229,'BΛ(Q₀) = 公共 log Λ + 有限项(Q₀)',21,RED)
    b+=line(300,261,300,296,INK,True)
    b+=text(300,328,'BR(Q;Q₀)：参考点为零，其他点未必为零',21,GREEN,'middle')
    b+=text(25,365,'Λ → ∞ 时，保持 Q、Q₀、m 固定。',21)
    save('physics-course','bridge-02-loop-subtraction','同一正规化下作减法','两个积分中的共同紫外对数相消，留下与外动量和参考点有关的有限差。',b)

if __name__ == '__main__':
    main()
