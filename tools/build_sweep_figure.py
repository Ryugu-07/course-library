from build_foundation_figures import save, text, line, box, BLUE, RED, GREEN, INK

def main():
    b=text(25,38,'一轮扫描：每一步都使用最新邻居',24)
    for j,x in enumerate([90,230,370,510]):
        b+=box(x-35,100,70,70,BLUE)+text(x,144,str(j+1),27,BLUE,'middle')
        if j<3:b+=line(x+40,135,x+100,135,INK)
    b+=line(75,82,525,82,GREEN,True)+text(300,68,'向右：1 → 2 → 3 → 4',19,GREEN,'middle')
    b+=line(525,190,75,190,RED,True)+text(300,223,'向左：4 → 3 → 2 → 1',19,RED,'middle')
    b+=text(300,266,'邻居 x → bⱼ → 最低局部态 → 新的 xⱼ、zⱼ',21,INK,'middle')
    b+=text(300,310,'完整能量 E = −Σ xⱼxⱼ₊₁ − gΣ zⱼ',22,BLUE,'middle')
    b+=text(300,356,'χ = 1，无纠缠；能量不升 ≠ 全局最优。',21,RED,'middle')
    save('physics-course','bridge-08-product-sweeps','四站乘积 MPS 往返扫描','开放链只有三条键；顺序从一到四再从四到一，每次局部求解使用最新邻居。转向处重复端点，记录整个乘积态能量并比较精确基准。',b)

if __name__=='__main__':main()
