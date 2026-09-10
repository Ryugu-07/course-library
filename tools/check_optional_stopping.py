"""Independent exact finite-state, reflection, and full-trajectory audit."""
from pathlib import Path
from fractions import Fraction as F
import itertools,json,math,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[];COUNT=0
def check(ok,label):
 global COUNT
 COUNT+=1
 if not ok:raise AssertionError(label)
def near(a,b,label,rel=3e-12,absolute=2e-12):
 if b is None:check(a is None,label);return
 check(isinstance(a,(int,float))and math.isfinite(a)and abs(a-b)<=absolute+rel*abs(b),(label,a,b))
def base(**kw):
 d=dict(mode='corridor',N=10,k=3,p=.5,cap=20000,T=300,H=80,strategy=0,M=32,seed=20260722,trial=0);d.update(kw);return d
configs=[]
for N,p,cap in itertools.product([2,10,24],[0,.35,.5,.65,1],[1,7,20000]):configs.append(base(N=N,k=N//2,p=p,cap=cap,trial=31))
configs +=[base(N=10,k=k,M=1,seed=seed)for k in [0,10]for seed in [0,4294967295]]
configs +=[base(mode='passage',T=t,M=m,trial=m-1,seed=0)for t in [0,1,2,3,6,50,300,800]for m in [1,64]]
configs +=[base(mode='strategy',H=h,strategy=s,M=32,trial=31,seed=4294967295)for h in [0,1,2,3,4,20,80,160]for s in range(3)]
configs +=[base(mode='strategy',H=160,strategy=1,M=2200,trial=2199)]
theorycases=[[N,N//2,p]for N in range(2,25)for p in [0,.01,.2,math.nextafter(.5,0),.5,math.nextafter(.5,1),.8,.99,math.nextafter(1,0),1]]
finitecases=[[N,k,p,L]for N in [2,5,10,24]for k in [0,N//2,N]for p in [.2,.5,.8]for L in [1,6,31,20000]]
def partitions(n):
 def go(a):
  if len(a)==n:yield a;return
  for v in range(max(a)+2):yield from go(a+[v])
 yield from go([0])
groups=list(partitions(4))
cpcases=[]
for weights in itertools.product(range(3),repeat=4):
 if not sum(weights):continue
 for group in groups:cpcases.append([[w/sum(weights)for w in weights],[0,2,4,6],list(map(str,group))])
cpcases +=[[[1,0,0,0],[0,2,4,6],['A','B','B','B']],[[5e-324,1,0,0],[1e-6,2,4,6],['tiny','main','zero','zero']]]
js=r"""
const fs=require('fs'),h=require('./course-shared/labs/optional-stopping.js'),q=JSON.parse(fs.readFileSync(0,'utf8'));
class E{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';}setAttribute(k,v){this.attrs[k]=String(v);}append(...xs){this.children.push(...xs);}}
const doc={createElementNS:(ns,tag)=>new E(tag)};
let strict=0;const bad=[
{mode:'constructor'},{mode:'toString'},{mode:''},{N:1},{N:25},{N:2.5},{N:'10'},{k:-1},{k:11},{k:1.5},{p:-.01},{p:1.01},{p:NaN},{p:null},{p:''},{cap:0},{cap:20001},{cap:1.5},{T:-1},{T:801},{T:NaN},{H:-1},{H:161},{H:'80'},{strategy:-1},{strategy:3},{strategy:1.5},{M:0},{M:2201},{M:null},{seed:-1},{seed:4294967296},{seed:1.5},{trial:-1},{trial:512},{trial:NaN}];
for(const d of bad){let hit=false;try{h.snapshot(d);}catch(e){hit=true;}if(!hit)throw Error('strict accepted '+JSON.stringify(d));strict++;}
for(const f of [()=>h.moments([]),()=>h.moments([,1]),()=>h.moments([NaN]),()=>h.moments([Number.MAX_VALUE,Number.MAX_VALUE]),()=>h.conditionalPartition([1],[2],[]),()=>h.conditionalPartition([.5],[2],['a']),()=>h.conditionalPartition([1,0],[2,NaN],['a','b']),()=>h.conditionalPartition([1,0],[2,3],[,'b'])]){let hit=false;try{f();}catch(e){hit=true;}if(!hit)throw Error('strict auxiliary');strict++;}
const patterns=new Map();for(let seed=0;patterns.size<256&&seed<20000;seed++){const g=h.makeRng(seed);let bits='';for(let j=0;j<8;j++)bits+=g()<.5?'1':'0';if(!patterns.has(bits))patterns.set(bits,seed);}if(patterns.size!==256)throw Error('missing coin pattern');
const exhaustive=Array.from(patterns,([bits,seed])=>({bits,seed,paths:[0,1,2].map(strategy=>h.strategyPath({mode:'strategy',H:8,strategy},seed))}));
console.log(JSON.stringify({exhaustive,snapshots:q.configs.map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s).map((d,i)=>h.drawPlot(doc,d,'test'+i))};}),theories:q.theorycases.map(c=>h.corridorTheory(...c)),finite:q.finitecases.map(c=>h.corridorFinite(...c)),partitions:q.cpcases.map(c=>h.conditionalPartition(...c)),strict,self:h.selfTest()}));
"""
result=subprocess.run(PREFIX+['node','-e',js],cwd=ROOT,input=json.dumps(dict(configs=configs,theorycases=theorycases,finitecases=finitecases,cpcases=cpcases)),text=True,capture_output=True,check=True)
data=json.loads(result.stdout);check(data['strict']==44,'strict count');check(data['self']['status']=='PASS','self')
def solve_fraction(N,p,rhs):
 # Generic Gauss-Jordan elimination, not the product's tridiagonal algorithm.
 q=1-p;a=[]
 for j in range(1,N):
  row=[F(0)for _ in range(N)]
  row[j-1]=1
  if j>1:row[j-2]=-q
  if j<N-1:row[j]=-p
  row[-1]=rhs[j-1];a.append(row)
 for j in range(N-1):
  pivot=a[j][j];a[j]=[v/pivot for v in a[j]]
  for i in range(N-1):
   if i!=j:
    f=a[i][j]
    if f:a[i]=[x-f*y for x,y in zip(a[i],a[j])]
 return[F(0)]+[row[-1]for row in a]+[F(0)]
cache={}
def absorption(N,p):
 key=(N,p)
 if key in cache:return cache[key]
 p=F(p);q=1-p
 if p==F(1,2):h=[F(j,N)for j in range(N+1)];m=[F(j*(N-j))for j in range(N+1)]
 elif p==0:h=[F(0)]*N+[F(1)];m=list(map(F,range(N)))+[F(0)]
 elif p==1:h=[F(0)]+[F(1)]*N;m=[F(0)]+[F(N-j)for j in range(1,N)]+[F(0)]
 else:
  r=q/p;h=[(1-r**j)/(1-r**N)for j in range(N+1)];m=[(N*h[j]-j)/(p-q)for j in range(N+1)]
 second=solve_fraction(N,p,[2*v-1 for v in m[1:N]])
 cache[key]=(h,m,second);return h,m,second
for args,actual in zip(theorycases,data['theories']):
 N,k,p=args;h,m,second=absorption(N,p);check(len(actual['rows'])==N+1,'all absorption states')
 for j,r in enumerate(actual['rows']):
  near(r['hit'],float(h[j]),('hit',args,j),5e-12,2e-14);near(r['mean'],float(m[j]),('time',args,j),5e-12,2e-12)
  near(r['second'],float(second[j]),('second',args,j),8e-12,1e-10)
  near(r['variance'],float(second[j]-m[j]**2),('variance',args,j),1e-11,1e-24)
 check(actual['martingale']==(p==.5),'exact unbiased condition')
def matmul(a,b):
 cols=list(zip(*b));return[[math.fsum(x*y for x,y in zip(row,col))for col in cols]for row in a]
def matrix_law(N,k,p,L):
 a=[[0.]*(N+1)for _ in range(N+1)];a[0][0]=a[N][N]=1
 for j in range(1,N):a[j][j-1]=1-p;a[j][j+1]=p
 v=[[float(i==k)for i in range(N+1)]]
 while L:
  if L&1:v=matmul(v,a)
  L//=2
  if L:a=matmul(a,a)
 return v[0]
for args,f in zip(finitecases,data['finite']):
 N,k,p,L=args;law=matrix_law(N,k,p,L);h,m,second=absorption(N,p)
 for j,r in enumerate(f['rows']):near(r['probability'],law[j],('matrix-power law',args,j),2e-10,1e-14);near(r['contribution'],j*law[j],'weighted terminal',2e-10,1e-13)
 expectedtime=float(m[k])-math.fsum(law[j]*float(m[j])for j in range(1,N))
 expectedsecond=float(second[k])-math.fsum(law[j]*(2*L*float(m[j])+float(second[j]))for j in range(1,N))
 near(f['meanCappedTime'],expectedtime,('remaining-life time',args),2e-10,2e-10);near(f['secondCappedTime'],expectedsecond,('remaining-life second',args),2e-10,1e-7)
 near(f['survival'],math.fsum(law[1:N]),'finite survival',2e-10,1e-14)
MASK=2**32-1
def signed(n):
 n&=MASK;return n-2**32 if n>=2**31 else n
def imul(a,b):return signed(a*b)
def rng(seed):
 state=seed
 while True:
  state=signed(state+0x6D2B79F5);t=imul(state^((state&MASK)>>15),1|state)
  t=signed(t+imul(t^((t&MASK)>>7),61|t))^t
  yield ((t^((t&MASK)>>14))&MASK)/2**32
def trialseed(seed,mode,index):return(seed^imul(index+1,2654435761)^imul(dict(corridor=101,passage=202,strategy=303)[mode],2246822519))&MASK
def trial(c,i,seed_override=None):
 seed=trialseed(c['seed'],c['mode'],i)if seed_override is None else seed_override;g=rng(seed);mode=c['mode'];rows=[];path=[]
 if mode in ['corridor','passage']:
  x=c['k']if mode=='corridor'else 0;limit=c['cap']if mode=='corridor'else c['T'];hit=None
  path=[x];rows=[dict(t=0,u=None,step=0,x=x,stopped=mode=='corridor'and x in [0,c['N']])]
  for t in range(1,limit+1):
   if mode=='corridor'and x in [0,c['N']]:break
   u=None;step=0
   if hit is None:
    u=next(g);step=1 if u<(c['p']if mode=='corridor'else .5)else-1;x+=step
    if mode=='passage'and x==1:hit=t
   path.append(x);rows.append(dict(t=t,u=u,step=step,x=x,stopped=x in [0,c['N']]if mode=='corridor'else hit is not None))
  if mode=='corridor':summary=dict(i=i,seed=seed,endpoint=x,steps=len(path)-1,upper=int(x==c['N']),censored=int(x not in [0,c['N']]))
  else:summary=dict(i=i,seed=seed,endpoint=x,hit=int(hit is not None),hitTime=hit,cappedTime=c['T']if hit is None else hit)
 else:
  w=pos=loss=peak=drawdown=maxstake=qv=0;path=[0];rows=[dict(t=0,u=None,positionBefore=0,lossBefore=0,stake=0,coin=0,gain=0,wealth=0,position=0,quadratic=0,drawdown=0)]
  for t in range(1,c['H']+1):
   before=pos;beforeloss=loss;b=1 if c['strategy']==0 else 2**min(3,loss)if c['strategy']==1 else(-1 if pos>0 else 1)
   u=next(g);coin=1 if u<.5 else-1;gain=b*coin;w+=gain;pos+=coin;loss=loss+1 if gain<0 else 0;qv+=b*b;peak=max(peak,w);drawdown=max(drawdown,peak-w);maxstake=max(maxstake,abs(b));path.append(w)
   rows.append(dict(t=t,u=u,positionBefore=before,lossBefore=beforeloss,stake=b,coin=coin,gain=gain,wealth=w,position=pos,quadratic=qv,drawdown=drawdown))
  summary=dict(i=i,seed=seed,final=w,maxStake=maxstake,maxDrawdown=drawdown,quadratic=qv)
 return summary,rows,path
def samplemom(xs):
 mu=math.fsum(xs)/len(xs)
 if len(xs)==1:return dict(mean=mu,variance=None,se=None)
 v=math.fsum((x-mu)**2 for x in xs)/(len(xs)-1);return dict(mean=mu,variance=v,se=math.sqrt(v/len(xs)))
def nodes(e,tag):
 if e['tag']==tag:yield e
 for c in e['children']:yield from nodes(c,tag)
for c,item in zip(configs,data['snapshots']):
 s=item['s'];allrows=[];check(len(s['trials'])==c['M'],'all trials')
 for i,r in enumerate(s['trials']):
  want,steps,path=trial(c,i);allrows.append(want)
  for key,v in want.items():check(r[key]==v,('whole trial',c,i,key,r[key],v))
  if i==c['trial']:
   check(s['chosen']['path']==path,'whole selected path');check(len(s['chosen']['rows'])==len(steps),'selected ledger length')
   for row,expected in zip(s['chosen']['rows'],steps):
    for key,v in expected.items():check(row[key]==v,('selected raw ledger',c,row['t'],key))
 if c['mode']=='corridor':
  for key,column in [('upper','upper'),('steps','steps')]:
   for name,v in samplemom([r[column]for r in allrows]).items():near(s[key][name],v,'MC '+key+name)
  check(s['censored']==sum(r['censored']for r in allrows),'censored count')
 elif c['mode']=='passage':
  for name,v in samplemom([r['endpoint']for r in allrows]).items():near(s['endpoint'][name],v,'MC endpoint')
  hit=sum(r['hit']for r in allrows);tail=sum(r['endpoint']for r in allrows if not r['hit']);check(s['hitCount']==hit,'hit count')
  near(s['hitMean'],1 if hit else None,'empty hit conditional');near(s['survivorMean'],tail/(c['M']-hit)if hit<c['M']else None,'empty survivor conditional');near(s['survivorContribution'],tail/c['M'],'survivor contribution')
  prevq=F(1);et=F(0);et2=F(0)
  for t,row in enumerate(s['theory']['rows']):
   if t:et+=prevq;et2+=(2*t-1)*prevq
   q=F(math.comb(t,t//2),2**t);prevq=q
   for key,v in [('survival',q),('hit',1-q),('survivorContribution',q-1),('survivorMean',(q-1)/q),('meanCappedTime',et),('secondCappedTime',et2),('centralBinomialSurvival',q),('endpointSecond',et)]:near(row[key],float(v),('reflection time',t,key),3e-12,2e-12)
   near(row['endpointMean'],0,'exact finite mean residual',0,2e-12)
  T=c['T'];dist={j:F(math.comb(T,(T+j)//2)-(math.comb(T,(T+j)//2-1)if (T+j)//2>0 else 0),2**T)for j in range(-T,1,2)};dist[1]=1-F(math.comb(T,T//2),2**T)
  for r in s['theory']['distribution']:near(r['probability'],float(dist[r['x']]),('reflection endpoint',T,r['x']),3e-12,0);near(r['contribution'],float(r['x']*dist[r['x']]),'reflection contribution',3e-12,0)
 else:
  for key,column in [('wealth','final'),('quadratic','quadratic')]:
   for name,v in samplemom([r[column]for r in allrows]).items():near(s[key][name],v,'strategy '+key+name)
  for r in s['theory']['rows']:
   t=r['t'];var=t if c['strategy']!=1 else([0,1,3.5,9][t]if t<=3 else 11.5*t-25.5)
   near(r['variance'],var,'closed strategy variance',0,0)
   previous=0 if t==0 else t-1 if c['strategy']!=1 else([0,1,3.5,9][t-1]if t-1<=3 else 11.5*(t-1)-25.5)
   near(r['expectedStakeSquared'],var-previous,'expected squared stake',0,0)
   probabilities=[1,0,0,0]if t==0 else[.5,.5,0,0]if t==1 else[.5,.25,.25,0]if t==2 else[.5,.25,.125,.125]
   for actual,want in zip(r['stateProbabilities'],probabilities):near(actual,want,'run-state probability',0,0)
 # Every displayed point and every polyline vertex uses actual coordinates and full data.
 for index,svg in enumerate(item['plots']):
  circles=list(nodes(svg,'circle'));lines=list(nodes(svg,'polyline'))
  if index==0:xs=list(range(len(s['chosen']['path'])));series=[s['chosen']['path']];keys=['path'];pointonly=False
  elif c['mode']=='corridor':xs=list(range(c['N']+1));series=[[r['probability']for r in s['finite']['rows']],[1-s['theory']['hit']]+[0]*(c['N']-1)+[s['theory']['hit']]];keys=['finite','eventual'];pointonly=True
  elif c['mode']=='passage':
   xs=[r['x']for r in s['theory']['distribution']];series=[[r['probability']for r in s['theory']['distribution']],[sum(r['endpoint']==x for r in allrows)/c['M']for x in xs]];keys=['exact','empirical'];pointonly=True
  else:xs=list(range(c['H']+1));series=[[r['variance']for r in s['theory']['rows']],[r['quadratic']for r in s['chosen']['rows']]];keys=['variance','quadratic'];pointonly=False
  flat=[0]+[v for a in series for v in a];lo,hi=min(flat),max(flat);pad=1 if hi==lo else .08*(hi-lo);lo=0 if pointonly else lo-pad;hi+=pad
  x=lambda v:125 if min(xs)==max(xs)else 125+740*(v-min(xs))/(max(xs)-min(xs))
  y=lambda v:290-230*(v-lo)/(hi-lo)
  check(len(circles)==len(xs)*len(series),'all SVG points');check(len(lines)==(0 if pointonly else len(series)),'path vs discrete')
  for a,key,vals in zip(range(len(series)),keys,series):
   for i,v in enumerate(vals):
    attrs=circles[a*len(xs)+i]['attrs'];check(attrs['data-series']==key,'SVG series');near(float(attrs['cx']),x(xs[i]),'SVG x',0,1e-9);near(float(attrs['cy']),y(v),'SVG y',0,1e-9)
   if not pointonly:
    pts=[list(map(float,p.split(',')))for p in lines[a]['attrs']['points'].split()];check(len(pts)==len(xs),'unthinned vertices')
    for i,pt in enumerate(pts):near(pt[0],x(xs[i]),'line x',0,1e-9);near(pt[1],y(vals[i]),'line y',0,1e-9)

# One seed for each of the 256 equiprobable eight-coin histories, all three strategies.
check(len(data['exhaustive'])==256,'complete eight-coin tree');seen=set();totals=[[],[],[]];quadratics=[[],[],[]]
for case in data['exhaustive']:
 g=rng(case['seed']);bits=''.join('1'if next(g)<.5 else'0'for _ in range(8));check(bits==case['bits'],'independent eight-coin identity');seen.add(bits)
 for strategy,actual in enumerate(case['paths']):
  want,rows,path=trial(base(mode='strategy',H=8,strategy=strategy),0,case['seed'])
  check(actual['path']==path,'full exhaustive wealth path')
  for row,expected in zip(actual['rows'],rows):
   for key,v in expected.items():check(row[key]==v,('exhaustive stake ledger',strategy,key))
  totals[strategy].append(want['final']);quadratics[strategy].append(want['quadratic'])
check(len(seen)==256,'independent complete eight-coin histories')
for strategy in range(3):
 check(sum(totals[strategy])==0,'exact exhaustive martingale mean')
 variance=F(sum(x*x for x in totals[strategy]),256)
 check(variance==F(sum(quadratics[strategy]),256),'exact optional isometry')
 check(variance==(F(133,2)if strategy==1 else F(8)),'exact exhaustive risk')

for args,actual in zip(cpcases,data['partitions']):
 ps,vals,labels=args;ps=list(map(F,ps));vs=list(map(F,vals));groups={}
 for p,x,key in zip(ps,vs,labels):
  mass,total=groups.get(key,(F(0),F(0)));groups[key]=(mass+p,total+p*x)
 for row in actual['groups']:
  mass,total=groups[row['group']];near(row['mass'],float(mass),'group mass');near(row['weightedTarget'],float(total),'local average');near(row['conditional'],float(total/mass)if mass else None,'conditional weighted ratio',3e-12,1e-20)
 mse=F(0)
 for row,p,x,key in zip(actual['rows'],ps,vs,labels):
  mass,total=groups[key];z=total/mass if mass else F(0);near(row['z'],float(z),'conditional row',3e-12,1e-20);mse+=p*(x-z)**2
 near(actual['mse'],float(mse),'projection residual',3e-12,1e-20);near(actual['predictionMean'],float(sum(p*x for p,x in zip(ps,vs))),'tower total')
ns={'s':'http://www.w3.org/2000/svg'};fig=ROOT/'grad-math/images/mt-03-conditional-martingale.svg';svg=ET.fromstring(fig.read_text())
for e in svg.findall('s:rect',ns):
 if 'data-x'in e.attrib:near(float(e.attrib['height']),25*[0,2,4,6][int(e.attrib['data-x'])],'static X',0,0)
 if 'data-terminal'in e.attrib:
  j=int(e.attrib['data-terminal']);q=F({-6:1,-4:5,-2:9,0:5,1:44}[j],64);near(float(e.attrib['height']),270*float(q),'static probability',0,0)
for key in ['fixed-variance','doubling-variance']:
 pts=svg.find('s:polyline[@id="'+key+'"]',ns).attrib['points'].split();check(len(pts)==81,'all static risk points')
 for n,p in enumerate(pts):
  x,y=map(float,p.split(','));var=n if key=='fixed-variance'else([0,1,3.5,9][n]if n<=3 else 11.5*n-25.5);near(x,145+10*n,'static risk x',0,1e-10);near(y,1130-.16*var,'static risk y',0,1e-10)
body=(ROOT/'grad-math/lectures/mt-03-conditional-martingale.md').read_text();check(body.count('<details class="answer"')==3,'three full answers');check('\n+E[\\xi_{n+1}^2\\mid\\mathcal F_n]'in body,'square-martingale plus')
for c in ['grad-math','math-course','ai-course']:check((ROOT/c/'site/assets/learning/labs/optional-stopping.js').read_bytes()==(ROOT/'course-shared/labs/optional-stopping.js').read_bytes(),'JS mirror')
check(fig.read_bytes()==(ROOT/'grad-math/site/assets/img/mt-03-conditional-martingale.svg').read_bytes(),'figure mirror')
print(f'Optional stopping PASS: {COUNT:,} checks; {len(configs)} snapshots; {len(theorycases)} absorption cases; {len(finitecases)} matrix-power laws; {len(cpcases)} partitions; 256 complete coin histories x3; {data["strict"]} strict; {data["self"]["checks"]} self')
