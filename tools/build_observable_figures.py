from build_foundation_figures import save, text, line, box, BLUE, RED, GREEN, INK

def main():
    b=text(25,38,'相关谱取和，响应谱取占据差',24)
    b+=line(65,140,535,140)+text(550,147,'ω',22)
    for x,label,color in [(170,'−ω₀',GREEN),(430,'+ω₀',BLUE)]:
        b+=line(x,140,x,80,color,True)+text(x,170,label,21,color,'middle')
    b+=text(170,66,'2πq²pₑ',21,GREEN,'middle')+text(430,66,'2πq²pɡ',21,BLUE,'middle')
    b+=text(25,207,'上：无序相关 S，两个权重均非负',21)
    b+=line(65,275,535,275)
    b+=line(170,275,170,321,RED,True)+line(430,275,430,229,BLUE,True)
    b+=text(300,355,'下：χ″ 的两条谱线符号相反',22,INK,'middle')
    save('physics-course','bridge-04-spectral-response','两能级相关与响应谱','正负频率的相关权重都是非负数，响应谱由占据差乘以正负两条delta峰构成。箭头表示谱线面积而非有限峰高。',b)
    b=text(25,38,'先叠加振幅，再取模平方',25)
    b+=box(25,80,260,95,BLUE)+box(315,80,260,95,GREEN)
    b+=text(155,119,'G(ω₀−ω,T)',24,BLUE,'middle')+text(155,152,'近共振项',21,BLUE,'middle')
    b+=text(445,119,'G(ω₀+ω,T)',24,GREEN,'middle')+text(445,152,'反旋转项',21,GREEN,'middle')
    b+=line(155,178,280,227,BLUE,True)+line(445,178,320,227,GREEN,True)
    b+=text(300,270,'J = (G₋ + G₊) / 2',25,INK,'middle')
    b+=text(300,315,'P⁽²⁾ = a² |Oₘ₀|² |J|² / ℏ²',24,RED,'middle')
    b+=text(25,360,'短脉冲保留两项；P⁽²⁾ 不再小时检查微扰。',20)
    save('physics-course','research-10-metric-spectroscopy','有限脉冲的两条振幅路径','余弦驱动分成正负频率分量，两条复振幅先相加，再求模平方，不能将两个概率先相加。',b)

if __name__=='__main__':main()
