"""Deterministic sample path plus theoretical count PMF, with visible tail mass."""
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parents[1]
def uniforms(seed):
    mask=2**32-1;state=seed
    while True:
        state=(state+0x6d2b79f5)&mask
        v=((state^(state>>15))*(state|1))&mask
        v=((v+(((v^(v>>7))*(v|61))&mask))^v)&mask
        yield ((v^(v>>14))+.5)/2**32
rng=uniforms(20260822);events=[];time=0.
while True:
    time-=math.log(next(rng))/2
    if time>4:break
    events.append(time)
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 625" role="img" aria-labelledby="title desc">',
       '<title id="title">一次随机实现与理论计数分布</title>',
       '<desc id="desc">左侧是seed20260822、速率2、观察4小时的右连续计数路径；右侧为Poisson8概率质量，超过20的尾部单列。</desc>',
       '<rect width="1100" height="625" fill="white"/>','<g font-family="sans-serif" fill="#172b45">',
       '<text x="35" y="32" font-size="22">一条路径不是一个分布：计数与概率要分开读</text>',
       '<text x="35" y="63" font-size="15">λ=2 次/小时，T=4 小时；左图使用固定 seed=20260822 的双精度伪随机样本</text>']
def text(x,y,t,size=13,anchor='start'):return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}">{t}</text>'
left=80;top=125;bottom=465;maximum=len(events)+1
mx=lambda t:left+400*t/4;my=lambda n:bottom-340*n/maximum
parts+=['<g id="path">',text(left,99,f'本条路径 N(4)={len(events)}，理论均值仍是 8',17)]
for t in [0,1,2,3,4]:parts += [f'<path d="M{mx(t)} {top}V{bottom}" fill="none" stroke="#dce2e8"/>',text(mx(t),490,str(t),12,'middle')]
for n in range(0,maximum+1,max(1,math.ceil(maximum/5))):parts += [f'<path d="M80 {my(n)}H480" fill="none" stroke="#dce2e8"/>',text(70,my(n)+4,str(n),12,'end')]
parts.append(f'<path d="M{mx(2)} {top}V{bottom}" fill="none" stroke="#95670d" stroke-dasharray="6 5"/>')
points=[(0,0)]
for i,t in enumerate(events):points.extend([(t,i),(t,i+1)])
points.append((4,len(events)))
d=' '.join(('M'if i==0 else'L')+f'{mx(t):.9f},{my(n):.9f}'for i,(t,n)in enumerate(points))
parts.append(f'<path data-stair="true" d="{d}" fill="none" stroke="#315f9d" stroke-width="2"/>')
for i,t in enumerate(events):
    for n,kind in [(i,'left-limit'),(i+1,'value')]:
        parts.append(f'<circle data-event="{i}" data-time="{t:.17g}" data-count="{n}" data-kind="{kind}" cx="{mx(t):.9f}" cy="{my(n):.9f}" r="3.7" stroke="#315f9d" stroke-width="1.4" fill="{"white"if kind=="left-limit"else"#39734d"}"/>')
parts += [text(495,465,'t / 小时',13),text(80,118,'N(t)',13),text(80,532,'实心：到达后的值；空心：左极限。',14),text(80,559,'竖线标跳变，不是同一时刻的一段取值。',14),'</g>']
left=630;bw=400/22;prob=[math.exp(-8)]
for k in range(1,121):prob.append(prob[-1]*8/k)
tail=math.fsum(prob[21:]);vals=prob[:21]+[tail]; ymax=.16
parts+=['<g id="pmf">',text(left,99,'N(4) 的理论分布：Poisson(8)',17)]
for v in [0,.04,.08,.12,.16]:
    y=bottom-340*v/ymax;parts += [f'<path d="M630 {y}H1030" fill="none" stroke="#dce2e8"/>',text(620,y+4,f'{v:.2f}',12,'end')]
for k,value in enumerate(vals):
    x=left+bw*(k+.15);h=340*value/ymax
    parts.append(f'<rect data-k="{k if k<21 else"tail"}" data-prob="{value:.17g}" x="{x:.9f}" y="{bottom-h:.9f}" width="{bw*.7:.9f}" height="{h:.9f}" fill="#95670d"/>')
    if k in [0,4,8,12,16,21]:parts.append(text(left+bw*(k+.5),490,str(k)if k<21 else'>20',12,'middle'))
parts += [text(1045,465,'次数 k',13),text(630,118,'概率',13),text(630,532,f'超过 20 次的理论尾概率约 {tail:.6g}。',14),text(630,559,'尾概率没有被并入零；每根柱是概率质量。',14),'</g>',
          text(35,604,'同一模型的下一条路径可以有不同总数；理论 E[N(4)]=Var[N(4)]=8，不能要求每次恰好等于 8。',14),'</g></svg>']
target=ROOT/'math-course/images/stoch-01-poisson-process.svg';target.write_text('\n'.join(parts)+'\n');print(target.relative_to(ROOT))
