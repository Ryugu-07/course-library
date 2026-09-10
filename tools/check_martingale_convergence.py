"""Independent integer reflection counts, finite histories, and full figure checks."""
from pathlib import Path
from fractions import Fraction as F
from functools import lru_cache
import itertools,json,math,shutil,subprocess,xml.etree.ElementTree as ET,re,html
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
MODULE=ROOT/'course-shared/labs/martingale-convergence.js'
count=0
def check(b,label):
 global count
 count+=1
 if not b:raise AssertionError(label)
def near(a,b,label,rel=3e-12,abs_=1e-14):
 check(isinstance(a,(int,float))and math.isfinite(a)and abs(a-b)<=abs_+rel*abs(b),f'{label}: {a} != {b}')
def node(s):
 q=subprocess.run(PREFIX+['node','-e',s],text=True,capture_output=True,check=True);return json.loads(q.stdout)
configs=[]
for B,n in itertools.product([1,2,5,12,24],[0,1,2,3,8,24,100,1000]):
 for K in [0,1,math.nextafter(float(B),0),float(B),math.nextafter(float(B),math.inf)]:
  configs.append(dict(model='absorbed-walk',n=n,B=B,K=K))
for n in [0,1,2,8,24,100,500,1000]:
 h=2.**n
 for K in [0,1,math.nextafter(h,0),h,math.nextafter(h,math.inf),float.fromhex('0x1.fffffffffffffp+1023')]:
  configs.append(dict(model='spike',n=n,K=K))
data=node("const h=require("+json.dumps(str(MODULE))+");const cs="+json.dumps(configs)+";console.log(JSON.stringify(cs.map(c=>{const s=h.snapshot(c);return {s,plots:h.plots(s)}})));")
@lru_cache(maxsize=1001)
def binomrow(n):
 row=[1]
 for k in range(1,n+1):row.append(row[-1]*(n-k+1)//k)
 return row
def C(row,k):return row[k]if 0<=k<len(row)else 0
@lru_cache(maxsize=None)
def walk(B,n):
 den=2**n;nums=[0]*(2*B+1);row=binomrow(n);L=2*B
 for s in range(-B+1,B):
  if (n+s)%2:continue
  a=(n+s)//2;b=a+B
  nums[s+B]=sum(C(row,a+k*L)-C(row,b+k*L)for k in range(-n//L-2,n//L+3))
 remaining=sum(nums);edge=(den-remaining)//2
 if n==0:check(den-remaining==0,'initial no absorption')
 else:check((den-remaining)%2==0,'symmetric absorbing counts')
 nums[0]=nums[-1]=edge
 return tuple(F(x,den)for x in nums)
def aggregates(B,n,K):
 probs=walk(B,n);xs=range(-B,B+1)
 return dict(mean=F(0),absoluteMean=sum(abs(x)*p for x,p in zip(xs,probs)),second=sum(x*x*p for x,p in zip(xs,probs)),l1Gap=sum(F(B*B-x*x,B)*p for x,p in zip(xs,probs)),transientMass=sum(probs[1:-1]),absorbedMass=probs[0]+probs[-1],tailExpectation=sum(abs(x)*p for x,p in zip(xs,probs)if abs(x)>K))
for c,out in zip(configs,data):
 s=out['s'];n=c['n'];K=c['K'];B=c.get('B',5);check(len(s['rows'])==n+1,'all times')
 if c['model']=='spike':
  prefix=0
  for t,r in enumerate(s['rows']):
   height=2**t;prob=F(1,height);tail=int(F(height)>F.from_float(float(K)));prefix=max(prefix,tail)
   expected=dict(t=t,mean=1,l1Gap=1,tailExpectation=tail,prefixTail=prefix,spikeHeight=float(height),spikeProbability=float(prob),zeroProbability=float(1-prob))
   for k,v in expected.items():near(r[k],v,'spike '+k,abs_=0)
  check(s['wholeTailSup']==1,'spike full-family sup');check(s['prefixTail']==prefix,'spike prefix')
  for r,v,p in zip(s['states'],[0,2**n],[1-F(1,2**n),F(1,2**n)]):
   near(r['x'],float(v),'spike state',abs_=0);near(r['probability'],float(p),'spike mass',abs_=0)
   near(r['meanContribution'],float(v*p),'spike mean contribution',abs_=0);near(r['tailContribution'],float(v*p)if v>K else 0,'spike tail contribution',abs_=0)
 else:
  prefix=F(0)
  for t,r in enumerate(s['rows']):
   exp=aggregates(B,t,K);prefix=max(prefix,exp['tailExpectation']);exp.update(t=t,prefixTail=prefix)
   for k,v in exp.items():near(r[k],float(v),'walk time '+k,abs_=1e-14 if k=='mean'else 0)
  check(s['wholeTailSup']==(B if K<B else 0),'walk full-family sup');near(s['prefixTail'],float(prefix),'walk prefix')
  probs=walk(B,n);check(len(s['states'])==2*B+1,'all states');check(len(s['joint'])==2*(2*B+1),'all joint cells')
  for i,(r,p)in enumerate(zip(s['states'],probs)):
   x=i-B;exp=dict(x=x,probability=p,meanContribution=x*p,absoluteContribution=abs(x)*p,secondContribution=x*x*p,tailContribution=abs(x)*p if abs(x)>K else 0,l1Contribution=F(B*B-x*x,B)*p,conditionalPositive=F(B+x,2*B))
   for k,v in exp.items():near(r[k],float(v),'walk state '+k,abs_=0)
   for j,z in enumerate([-B,B]):
    row=s['joint'][2*i+j];conditional=F(B+z*x//B,2*B);mass=p*conditional
    exp=dict(x=x,z=z,stateProbability=p,jointProbability=mass,terminalContribution=z*mass,distanceContribution=abs(z-x)*mass)
    for k,v in exp.items():near(row[k],float(v),'joint '+k,abs_=0)
    if p==0:check(row['conditionalProbability']is None,'null conditional at zero mass')
    else:near(row['conditionalProbability'],float(conditional),'joint conditional',abs_=0)
  # A second identity uses future absorption time, independently of the product L1 formula.
  rem=sum(F(B*B-(i-B)**2)*p for i,p in enumerate(probs));near(s['final']['l1Gap'],float(rem/B),'remaining-time identity',abs_=0)
 for pi,d in enumerate(out['plots']):
  xs=list(range(n+1))if pi==0 else [r['x']for r in s['states']]
  check(d['xs']==xs,'complete true x coordinates')
  expected=[('gap',[r['l1Gap']for r in s['rows']]),('tail',[r['tailExpectation']for r in s['rows']])]if pi==0 else[('probability',[r['probability']for r in s['states']])]
  for serie,(key,values)in zip(d['series'],expected):check(serie['key']==key and serie['values']==values,'complete graph values')
  check(len(d['series'])==len(expected),'all graph series');check(d['ymin']==0 and d['ymax']>=max(max(v)for _,v in expected),'no graph clipping')
# Exact IEEE thresholds at all representable model heights, including both neighbours.
boundaries=node("const h=require("+json.dumps(str(MODULE))+");const cs="+json.dumps([[n,k]for n in range(1001)for k in [math.nextafter(2.**n,0),2.**n,math.nextafter(2.**n,math.inf)]])+";console.log(JSON.stringify(cs.map(([n,K])=>h.modelA(n,K))));")
for i,r in enumerate(boundaries):check(r['tailExpectation']==(1 if i%3==0 else 0),'strict binary threshold')
# Enumerate every 8-increment fair walk and reconstruct a predictable strategy from prefix values.
paths=[[0]+list(itertools.accumulate(bits))for bits in itertools.product([-1,1],repeat=8)]
cases=[(p,a,b,w)for p in paths for a,b,w in [(-1,1,0),(0,2,7),(-2,0,-3)]]
cross=node("const h=require("+json.dumps(str(MODULE))+");console.log(JSON.stringify("+json.dumps(cases)+".map(c=>h.crossing(...c))));")
gains=[F(0)]*3;ups=[F(0)]*3;negs=[F(0)]*3
for i,((path,a,b,w),out)in enumerate(zip(cases,cross)):
 holding=path[0]<=a;gain=0;U=0
 for t,r in enumerate(out['rows']):
  H=0 if t==0 else int(holding)
  if t:
   gain+=H*(path[t]-path[t-1])
   if holding and path[t]>=b:U+=1;holding=False
   elif not holding and path[t]<=a:holding=True
  vals=dict(t=t,x=path[t],stake=H,increment=0 if t==0 else path[t]-path[t-1],gain=gain,capital=w+gain,upcrossings=U,lower=(b-a)*U-max(a-path[t],0),holding=holding)
  for k,v in vals.items():check(r[k]==v,'complete crossing row '+k)
  check(gain>=vals['lower'],'pathwise crossing inequality')
 idx=i%3;gains[idx]+=F(gain,256);ups[idx]+=F(U*(b-a),256);negs[idx]+=F(max(a-path[-1],0),256)
for i in range(3):check(gains[i]==0,'predictable zero expectation');check(ups[i]<=negs[i],'exact upcrossing expectation')
# All finite probability spaces with two groups: terminal prediction is a martingale,
# Doob's p=2 maximal inequality checked without simulation.
for values in itertools.product(range(-2,3),repeat=4):
 means=[F(values[0]+values[1],2),F(values[2]+values[3],2)];start=sum(means)/2
 mx=[max(abs(start),abs(means[i//2]),abs(F(v)))for i,v in enumerate(values)]
 check(sum(x*x for x in mx)<=4*sum(v*v for v in values),'Doob L2 finite tree')
# Uniform Polya count law by exact probabilities of every binary ordering.
for n in range(9):
 mass=[F(0)]*(n+1)
 for bits in itertools.product([0,1],repeat=n):
  red=blue=1;p=F(1)
  for bit in bits:
   p*=F(red if bit else blue,red+blue)
   if bit:red+=1
   else:blue+=1
  mass[sum(bits)]+=p
 check(all(p==F(1,n+1)for p in mass),'Polya complete count law')
# Exact finite binomial tails check the displayed two-sided constants.
for n in range(1,81):
 for t in range(1,n+1):
  prob=F(sum(math.comb(n,k)for k in range(n+1)if abs(2*k-n)>=t),2**n)
  check(float(prob)<=2*math.exp(-t*t/(2*n))+1e-15,'Azuma exact binomial tail')
  # Bernoulli mean: range 1/n, deviation t/(2n), same bound.
  eps=t/(2*n);bound=2*math.exp(-2*n*eps*eps)
  check(float(prob)<=bound+1e-15,'McDiarmid exact binomial tail')
near(2*math.exp(-5),0.013475893998170934,'exercise concentration constant')
strict=node("const h=require("+json.dumps(str(MODULE))+");let q=[];const bads=[()=>h.config(null),()=>h.config([]),...['','constructor','toString'].map(model=>()=>h.config({model})),...['n','B','K'].flatMap(k=>[null,'1',NaN,Infinity,-Infinity,-1].map(v=>()=>h.config({[k]:v}))),()=>h.config({n:1.5}),()=>h.config({n:1001}),()=>h.config({B:0}),()=>h.config({B:25}),()=>h.modelA('2'),()=>h.modelA(1,NaN),()=>h.walkDistribution(2,1.5),()=>h.crossing([],0,1),()=>h.crossing([1,,2],0,1),()=>h.crossing([0,Infinity],0,1),()=>h.crossing([0],1,1),()=>h.crossing([0],0,1,'0')];for(const f of bads){try{f();q.push(false)}catch(e){q.push(true)}}console.log(JSON.stringify({q,self:h.selfTest()}));")
for v in strict['q']:check(v,'strict rejection')
check(strict['self']['status']=='PASS','module self')
source=(ROOT/'grad-math/lectures/mt-04-martingale-convergence.md').read_text();site=(ROOT/'grad-math/site/mt-04-martingale-convergence.html').read_text()
blocks=re.findall(r'\$\$(.*?)\$\$',source,re.S)
for block in blocks:check(block in html.unescape(site),'every displayed formula identical in shipped HTML')
check(source.count('<details class="answer"')==4,'four complete answers')
check('<img' in site and 'src="assets/img/mt-04-martingale-convergence.svg"'in site,'actual static image element')
check('![尖峰'not in site,'no unrendered image Markdown')
for required in [r'E[(X_n-a)^+]-E[(X_0-a)^+]',r'\le2\exp\left(-\frac{2t^2}',r'(0+2+2+0)',r'\sup_{t\ge0}']:check(required in source,'semantic operator '+required)
ns={'s':'http://www.w3.org/2000/svg'}
fig=ROOT/'grad-math/images/mt-04-martingale-convergence.svg';svg=ET.parse(fig).getroot()
for g,n in zip(svg.findall('s:g[@data-spike-row]',ns),[0,4,8,12]):
 check([x.text for x in g.findall('s:text',ns)]==[str(n),str(2**n),'1'if n==0 else f'1/{2**n}','1','1'if n>8 else'0'],'static exact spike row')
for e,(x,zx,s,z)in zip(svg.findall('s:line[@data-joint]',ns),[(160,350,-2,-2),(550,350,0,-2),(550,750,0,2),(940,750,2,2)]):
 check(e.get('data-joint')==f'{s},{z}','joint topology')
 for k,v in dict(x1=x,x2=zx,y1=565,y2=713).items():near(float(e.get(k)),v,'static joint coordinates',abs_=0)
expected=[(145+200*i,1100-65*v)for i,v in enumerate([0,2,0,2,-1])]
points=[tuple(map(float,p.split(',')))for p in svg.find("s:polyline[@id='crossing-path']",ns).get('points').split()]
check(points==expected,'all static path vertices')
for e,(x,y)in zip(svg.findall('s:circle[@data-path]',ns),expected):near(float(e.get('cx')),x,'static point x');near(float(e.get('cy')),y,'static point y')
for e,i in zip(svg.findall('s:line[@data-held]',ns),[1,3]):
 for k,v in dict(x1=expected[i-1][0],y1=expected[i-1][1],x2=expected[i][0],y2=expected[i][1]).items():near(float(e.get(k)),v,'predictable held segment')
check(fig.read_bytes()==(ROOT/'grad-math/site/assets/img/mt-04-martingale-convergence.svg').read_bytes(),'source/site figure')
for c in ['math-course','grad-math','ai-course']:check(MODULE.read_bytes()==(ROOT/c/'site/assets/learning/labs/martingale-convergence.js').read_bytes(),'shared mirror '+c)
print(f'Martingale convergence PASS: {count:,} checks; {len(configs)} full snapshots; 3003 exact thresholds; 768 complete crossing paths; {len(blocks)} displayed formulas; {len(strict["q"])} strict; {strict["self"]["checks"]} self')
