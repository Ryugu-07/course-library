"""Two training-only capacity searches, with independently computed errors."""
from pathlib import Path
from html import escape
import math
ROOT=Path(__file__).resolve().parents[1]
DATA=[120,148,182,220,260,302,345,381,410,430]
def fit(search):
    lo=182*1.02;hi=max(182*search,582);best=None
    for j in range(361):
        K=lo+(hi-lo)*j/360
        z=[math.log(K/y-1)for y in DATA[:3]]
        slope=(z[2]-z[0])/2;intercept=sum(z)/3-slope
        C=math.exp(intercept);rate=-slope
        pred=lambda t,K=K,C=C,rate=rate:K/(1+C*math.exp(-rate*t))
        sse=sum((DATA[i]-pred(i))**2 for i in range(3))
        if best is None or sse<best['sse']:best=dict(K=K,C=C,rate=rate,sse=sse,predict=pred,index=j)
    best['train']=math.sqrt(best['sse']/3)
    best['validation']=math.sqrt(sum((DATA[i]-best['predict'](i))**2 for i in range(3,10))/7)
    return best
fits=[fit(4),fit(12)]
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650" viewBox="0 0 1100 650" role="img" aria-labelledby="title desc">',
     '<title id="title">训练误差更小，留出预测反而更差</title><desc id="desc">同样三个训练点，容量上限728与2184分别得到不同外推；两个最优候选都在搜索边界。其余七个点是留出数据，未来没有观测。</desc>',
     '<rect width="1100" height="650" fill="#faf8f3"/><g fill="#243344" font-family="Arial, PingFang SC, sans-serif">']
def text(x,y,s,size=17,anchor='start',color='#243344'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(s)}</text>')
def line(x1,y1,x2,y2,color='#d5d9db',dash=''):
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-dasharray="{dash}"/>')
text(30,39,"训练误差更小，留出预测反而更差",26)
text(30,76,"同样的前三个点，两种容量搜索上限；每种搜索都比较 361 个候选。",18)
X=lambda t:80+590*t/17
Y=lambda y:470-330*y/1800
for y in [0,450,900,1350,1800]:
    line(80,Y(y),670,Y(y));text(69,Y(y)+5,str(y),14,'end')
for t in [0,3,6,9,12,15,17]:text(X(t),493,str(t),14,'middle')
text(36,125,"人数",16);text(670,522,"时间 t（日）",16,'end')
for search,fit,color,dash in zip([4,12],fits,['#315f9d','#814e92'],['','7 4']):
    pts=[(17*i/160,fit['predict'](17*i/160))for i in range(161)]
    d=' '.join(('M'if i==0 else'L')+f'{X(t):.12f} {Y(y):.12f}'for i,(t,y)in enumerate(pts))
    out.append(f'<path data-search="{search}" data-k="{fit["K"]}" data-rate="{fit["rate"]}" d="{d}" fill="none" stroke="{color}" stroke-width="3" stroke-dasharray="{dash}"/>')
for t,y in enumerate(DATA):
    out.append(f'<circle data-time="{t}" data-value="{y}" cx="{X(t)}" cy="{Y(y)}" r="4.5" fill="{"#478759"if t<3 else"#a5751f"}"/>')
line(X(2.5),140,X(2.5),470,'#b6483d','4 4')
line(X(9.5),140,X(9.5),470,'#687480','3 4')
text(735,137,"搜索结果与验证账本",21)
for y,s in [(178,"蓝实线：容量上限 728"),(348,"紫虚线：容量上限 2184")]:text(735,y,s,18)
for base,fit in zip([212,382],fits):
    text(735,base,f'训练 RMSE：{fit["train"]:.4f} 人')
    text(735,base+34,f'留出 RMSE：{fit["validation"]:.2f} 人')
    text(735,base+68,f't=17 预测：{fit["predict"](17):.2f} 人')
    text(735,base+102,"最优候选触及容量上限",16,color='#9b4a2c')
text(80,563,"绿点：训练 3 点；金点：留出 7 点；t>9 没有观测真值。",18)
text(80,600,"红虚线分训练与留出，灰虚线分观测与未来；搜索范围不是统计置信区间。",18)
text(80,633,"数据为人为选定的教学例子；更小的训练误差不能单独证明容量被识别。",16,color='#52616e')
out.append('</g></svg>')
(ROOT/'math-course/images/model-01-modeling-cycle.svg').write_text('\n'.join(out)+'\n')
print('Built modeling capacity-search figure')
