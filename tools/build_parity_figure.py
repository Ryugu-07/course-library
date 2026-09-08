from build_foundation_figures import save, text, line, box, BLUE, RED, GREEN, INK

def main():
    b=text(25,38,'周期自旋 ≠ 所有费米子都周期',25)
    b+=box(170,65,260,55,INK)+text(300,101,'P = ∏ σᶻ，先分扇区',23,INK,'middle')
    b+=line(230,123,150,158,BLUE,True)+line(370,123,450,158,RED,True)
    b+=box(25,160,260,106,BLUE)+box(315,160,260,106,RED)
    b+=text(155,192,'偶 P = +1',24,BLUE,'middle')+text(155,224,'反周期：k = (2m+1)π/L',19,BLUE,'middle')
    b+=text(155,253,'最低同扇区激发：两粒子',19,BLUE,'middle')
    b+=text(445,192,'奇 P = −1',24,RED,'middle')+text(445,224,'周期：k = 2mπ/L',20,RED,'middle')
    b+=text(445,253,'检查 0、π 模的占据',20,RED,'middle')
    b+=line(155,269,270,305,BLUE,True)+line(445,269,330,305,RED,True)
    b+=text(300,337,'合并全部能级，再取 E₁ − E₀',24,INK,'middle')
    b+=text(300,370,'保留简并重数；测量还需检查矩阵元。',20,GREEN,'middle')
    save('physics-course','bridge-06-ising-parity','Ising 奇偶扇区与完整谱','周期自旋链分成两个守恒奇偶扇区，Jordan–Wigner 字符串让两块采用不同费米子边界条件。完整谱必须合并两个扇区，不能直接取一条单准粒子能量。',b)

if __name__=='__main__':main()
