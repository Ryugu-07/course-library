from build_foundation_figures import save, text, line, box, BLUE, RED, GREEN, INK

def main():
    b=text(25,38,'把局部操作放进纠缠输入中检验',25)
    b+=box(25,75,135,90,BLUE)+text(92,114,'Bell 对',23,BLUE,'middle')
    b+=text(92,147,'|Ω〉',24,BLUE,'middle')
    b+=line(163,95,235,95,BLUE,True)+line(163,150,425,150,GREEN,True)
    b+=box(238,68,135,55,RED)+text(305,103,'Φ 只作用 S',20,RED,'middle')
    b+=line(375,95,425,95,RED,True)
    b+=box(430,70,145,110,INK)+text(502,107,'联合输出 J',22,INK,'middle')
    b+=text(502,149,'检查 J ≥ 0',21,INK,'middle')
    b+=text(285,183,'R 保持不动',20,GREEN,'middle')
    b+=text(25,233,'转置：单比特测试全通过',23)
    b+=text(25,272,'但 J = F/2，在反对称方向：',23)
    b+=text(300,316,'〈ψ⁻|J|ψ⁻〉 = −1/2',27,RED,'middle')
    b+=text(25,361,'负测量概率否决了“这是一个通道”。',21)
    save('physics-course','bridge-05-quantum-channels','完全正性与 Bell 输入','一个 Bell 对的系统端经过待检验映射，参考端不动。联合输出的负本征值揭示单系统正性无法发现的问题。',b)

if __name__=='__main__':main()
