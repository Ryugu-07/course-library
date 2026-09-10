"""Independent Decimal/Fraction audit of truncations, quadrature, UI and plots."""
from pathlib import Path
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
import math,json,subprocess,shutil,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[1];prefix=['rtk','proxy']if shutil.which('rtk')else[]
Ts=[0,5e-324,1e-300,1e-162,1e-160,1e-150,1e-12,.00001,.1,.49,.5,1,2,6,12,100]
quads=[(t,n)for t in Ts for n in [1,2,3,40,160,600,2000]]
caps=list(range(401))+[1e6]
for k in range(1,51):
 for v in [math.nextafter(float(k*k),0),float(k*k),math.nextafter(float(k*k),math.inf)]:caps.append(v)
spikes=[(n,a,m)for n in [1,16,400]for a in [0,.5,1,1.5]for m in [0,1,4,16,100]]
for n in range(1,401):
 for m in [math.nextafter(math.sqrt(n),0),math.sqrt(n),math.nextafter(math.sqrt(n),math.inf)]:spikes.append((n,.5,m))
for n in range(1,22):
 for m in [math.nextafter(n**1.5,0),n**1.5,math.nextafter(n**1.5,math.inf)]:spikes.append((n,1.5,m))
request=dict(quads=quads,caps=caps,signed=list(range(401))+[1000,10000],spikes=spikes)
code=r'''
const fs=require("fs"),h=require("./course-shared/labs/measure-expectation.js"),q=JSON.parse(fs.readFileSync(0,"utf8"));
const quadrature=q.quads.map(([t,n])=>({t,n,d:h.densityExpectation(t,n),c:h.tailIntegral("tail",t,n)}));
const positive=q.caps.map(k=>h.positiveTruncation(k)),signed=q.signed.map(k=>h.signedPartial(k)),spikes=q.spikes.map(a=>h.spikeSnapshot(...a));
const snapshots=[];for(const modelId of Object.keys(h.MODELS))for(const k of [0,4,400])snapshots.push(h.expectationSnapshot({modelId,K:k,T:k===0?0:k===4?.00001:12,steps:k===400?600:40,n:k||1,alpha:k===0?0:k===4?.5:1.5,M:k===400?100:4}));
const node=(tag,attrs={},children=[])=>({tag,attrs,children:[].concat(children),append(...es){this.children.push(...es)}});
const plots=snapshots.map(s=>{
 let series,xmax,unit="";
 if(s.kind==="finite"){series=[{key:"p",xs:h.ATOMS.map(a=>a.x),values:h.ATOMS.map(a=>a.p),bars:true}];xmax=5;}
 else if(s.kind==="density"||s.kind==="tail"){series=[{key:"D",xs:s.series.map(r=>r.x),values:s.series.map(r=>r.densityIntegral)},{key:"C",xs:s.series.map(r=>r.x),values:s.series.map(r=>r.tailIntegral)}];xmax=s.T;}
 else if(s.kind==="positive"){series=[{key:"cap",xs:s.series.map(r=>r.cap),values:s.series.map(r=>r.value)}];xmax=s.K;}
 else if(s.kind==="signed"){series=["positive","negativeMagnitude","finitePartial"].map(key=>({key,xs:s.series.map(r=>r.n),values:s.series.map(r=>r[key])}));xmax=s.K;}
 else {series=["expectation","tailExpectation"].map(key=>({key,xs:s.series.map(r=>r.n),values:s.series.map(r=>r[key])}));xmax=s.n;}
 return{series,xmax,chart:h.drawMeasurePlot(node,"independent geometry",series,{xmax,unit})};
});
const bad=[
 ()=>h.expectationSnapshot(null),()=>h.expectationSnapshot([]),()=>h.expectationSnapshot({modelId:"constructor"}),()=>h.expectationSnapshot({modelId:"toString"}),()=>h.expectationSnapshot({modelId:"missing"}),
 ()=>h.expectationSnapshot({K:"4"}),()=>h.expectationSnapshot({K:-1}),()=>h.expectationSnapshot({K:4.5}),()=>h.expectationSnapshot({K:401}),()=>h.expectationSnapshot({T:NaN}),()=>h.expectationSnapshot({T:13}),()=>h.expectationSnapshot({steps:0}),()=>h.expectationSnapshot({steps:601}),()=>h.expectationSnapshot({alpha:2}),
 ()=>h.densityExpectation(-1,40),()=>h.densityExpectation(101,40),()=>h.densityExpectation("1",40),()=>h.densityExpectation(1,0),()=>h.densityExpectation(1,3.5),()=>h.densityExpectation(1,2001),
 ()=>h.tailIntegral("atoms",2,40),()=>h.survivalValue("positive",1),()=>h.positiveTruncation(-1),()=>h.positiveTruncation(Infinity),()=>h.positiveTruncation(1e6+1),()=>h.signedPartial(-1),()=>h.signedPartial(2.5),()=>h.signedPartial(10001),
 ()=>h.spikeSnapshot(0,.5,4),()=>h.spikeSnapshot(401,.5,4),()=>h.spikeSnapshot(16,2,4),()=>h.spikeSnapshot(16,.5,101),
 ()=>h.atomExpectation([]),()=>h.atomExpectation(new Array(1)),()=>h.atomExpectation([{x:1,p:-1}]),()=>h.atomExpectation([{x:1,p:.5}]),()=>h.atomExpectation([{x:NaN,p:1}]),()=>h.atomTruncation(1,[{x:-1,p:1}])
];let rejected=0;for(const f of bad)try{f()}catch(e){rejected++}
console.log(JSON.stringify({quadrature,positive,signed,spikes,snapshots,plots,rejected,bad:bad.length,self:h.selfTest()},(k,v)=>v===Infinity?"INF":v===-Infinity?"-INF":v));
'''
data=json.loads(subprocess.check_output(prefix+['node','-e',code],cwd=R,input=json.dumps(request),text=True))
checks=0
def eq(a,b,label,rel=3e-13,absolute=0):
 global checks
 bf=float(b);assert isinstance(a,(int,float))and math.isfinite(a),(label,a)
 assert abs(a-bf)<=max(absolute,rel*abs(bf),8*math.ulp(0.0)),(label,a,bf,a-bf)
 checks+=1
def ar(a,b,label,rel=3e-13,absolute=0):
 assert len(a)==len(b)
 for x,y in zip(a,b):eq(x,y,label,rel,absolute)
def dec(v):return D.from_float(float(v))
def atan(x):
 term=x;s=term;n=1
 while True:
  term*=-x*x;n+=2;v=s+term/n
  if v==s:return s
  s=v
with localcontext()as ctx:
 ctx.prec=110
 pi=16*atan(D(1)/5)-4*atan(D(1)/239);c=6/pi**2
 def density(t):
  if t<D('.5'):
   term=D('.5');s=term
   for n in range(1,400):
    term*=(-t/n)*D(n+1)/D(n+2);v=s+term
    if v==s:break
    s=v
   return t*t*s
  return 1-(1+t)*(-t).exp()
 def capexp(t):
  if t<D('.5'):
   term=t;s=term
   for n in range(1,400):
    term*=-t/D(n+1);v=s+term
    if v==s:break
    s=v
   return s
  return 1-(-t).exp()
 for case in data['quadrature']:
  t=dec(case['t']);n=case['n']
  for kind,key in [('density','d'),('tail','c')]:
   a=case[key];total=D(0)
   for i,row in enumerate(a['rows']):
    mid=t*(D(i)+D('.5'))/n;integrand=(-mid).exp()*(mid if kind=='density'else 1);area=integrand*t/n;total+=area
    ar([row[k]for k in ['left','right','midpoint','integrand','area','cumulative']],[t*i/n,t*(i+1)/n,mid,integrand,area,total],(kind,str(t),n,i),rel=3e-13)
   finite=density(t)if kind=='density'else capexp(t);tail=(1+t if kind=='density'else 1)*(-t).exp()
   eq(a['value'],total,'midpoint total');eq(a['exactFinite'],finite,'finite analytic');eq(a['missingTail'],tail,'tail')
   eq(a['midpointErrorBound'],t**3/((12 if kind=='density'else 24)*n*n),'midpoint bound')
   eq(a['error'],total-finite,'numerical quadrature error',rel=3e-12,absolute=2e-15*float(finite))
   assert abs(total-finite)<=t**3/((12 if kind=='density'else 24)*n*n)+D('1e-100'),(kind,t,n)
  eq(case['c']['exactFinite']-case['d']['exactFinite'],t*(-t).exp(),'two truncations',absolute=4e-16)
 for a in data['positive']:
  cap=dec(a['cap']);m=math.isqrt(math.floor(cap))
  while D((m+1)**2)<=cap:m+=1
  assert a['cutoff']==m
  tail=1-c*sum((D(1)/(k*k)for k in range(1,m+1)),D(0))
  eq(a['tailMass'],tail,'positive probability tail',rel=4e-12)
  eq(a['observedTerms'],c*m,'positive observed')
  eq(a['value'],c*m+cap*tail,'positive cap',rel=4e-12)
  assert a['exact']=='INF'
 for a in data['signed']:
  n=a['n'];p=c*sum((D(1)/k for k in range(2,n+1,2)),D(0));negative=c*sum((D(1)/k for k in range(1,n+1,2)),D(0))
  ar([a[k]for k in ['positive','negativeMagnitude','absolute','finitePartial']],[p,negative,p+negative,p-negative],'signed parts')
  assert a['signed']is None and a['exact']is None
  eq(a['orderedLimit'],-c*D(2).ln(),'ordered series')
for a in data['spikes']:
 n,alpha,M=a['n'],a['alpha'],a['M'];mf=F.from_float(M)
 tailvalues=[]
 for row in a['rows']:
  k=row['n'];height=k**alpha;mean=k**(alpha-1)
  above=(F(1)>mf)if alpha==0 else(F(k)>mf*mf)if alpha==.5 else(F(k)>mf)if alpha==1 else(F(k**3)>mf*mf)
  tail=mean if above else 0;tailvalues.append(tail)
  ar([row[k]for k in ['height','width','expectation','tailExpectation']],[height,1/k,mean,tail],'spike row')
 eq(a['finiteTailMaximum'],max(tailvalues),'finite tail maximum')
 if alpha==0:infinite=1 if M<1 else 0
 elif alpha==.5:infinite=1/math.sqrt((mf*mf).__floor__()+1)
 elif alpha==1:infinite=1
 else:infinite='INF'
 if infinite=='INF':assert a['infiniteTailSupremum']=='INF'
 else:eq(a['infiniteTailSupremum'],infinite,'infinite sup')
 assert a['uniformlyIntegrable']==(alpha<1) and a['almostSureLimit']==0
for s in data['snapshots']:
 kind=s['kind']
 if kind=='finite':eq(s['finiteValue'],sum(min(x,s['K'])*p for x,p in [(0,.5),(1,.25),(2,.125),(4,.125)]),'atom cap')
 elif kind in ['density','tail']:
  assert s['finiteValue']==s['density'if kind=='density'else'tail']['value']
  for r in s['series']:
   eq(r['survival'],math.exp(-r['x']),'survival');eq(r['densityIntegrand'],r['x']*math.exp(-r['x']),'density integrand')
 elif kind=='positive':assert len(s['series'])==s['K']+1 and s['finiteValue']==s['positive']['value']
 elif kind=='signed':assert len(s['series'])==s['K']+1 and s['finiteValue']==s['signed']['finitePartial'] and s['exact']is None
 else:assert s['finiteValue']==s['spike']['current']['expectation']
for p in data['plots']:
 series,xmax,chart=p['series'],p['xmax'],p['chart'];allv=[v for s in series for v in s['values']];lo0=min(0,*allv);hi0=max(0,*allv)
 pad=1 if hi0==lo0 else max((hi0-lo0)*.08,8*math.ulp(0.));lo=lo0-pad;hi=hi0+pad
 barxs=[x for se in series if se.get('bars') for x in se['xs']];xmin=min(barxs)-.25 if barxs else 0;right=max(barxs)+.25 if barxs else xmax
 expected={s['key']:[(125+740*(x-xmin)/(right-xmin or 1),285-235*(v-lo)/(hi-lo))for x,v in zip(s['xs'],s['values'])]for s in series}
 for e in chart['children']:
  if not isinstance(e,dict):continue
  a=e['attrs']
  if e['tag']=='circle':
   ar([a['cx'],a['cy']],expected[a['data-point']][a['data-index']],'visible point',absolute=1e-10)
  elif e['tag']=='polyline':
   points=[list(map(float,q.split(',')))for q in a['points'].split()]
   assert len(points)==len(expected[a['data-series']])
   for xy,truth in zip(points,expected[a['data-series']]):ar(xy,truth,'polyline',absolute=1e-10)
  elif e['tag']=='rect':
   x,y=expected[a['data-bar']][a['data-index']];zero=285-235*(0-lo)/(hi-lo)
   ar([a[k]for k in ['x','y','width','height']],[x-14,min(y,zero),28,abs(y-zero)],'probability bar',absolute=1e-10)
 if xmax==0:
  ticks=[e for e in chart['children']if isinstance(e,dict)and e['tag']=='text'and e['attrs'].get('y')==312]
  assert len(ticks)==1
assert data['rejected']==data['bad']==38 and data['self']['checks']==15
# Finite pi-lambda uniqueness: distributions with identical lower-rectangle masses.
for n in range(1,9):
 probs=[F(k+1,n*(n+1)//2)for k in range(n)]
 cdf=[sum(probs[:k+1])for k in range(n)]
 assert [cdf[0]]+[cdf[k]-cdf[k-1]for k in range(1,n)]==probs
 checks+=n
# Exact finite Borel-Cantelli window products, including empty/full boundary windows.
for N in range(2,31):
 for M in range(N,100):
  product=F(1)
  for k in range(N,M+1):product*=1-F(1,k)
  assert product==F(N-1,M)
  checks+=1
ns={'s':'http://www.w3.org/2000/svg'};tree=ET.parse(R/'grad-math/images/mt-01-measure-expectation.svg')
for p in tree.findall('.//s:polyline',ns):
 name=p.attrib['data-integral'];points=[list(map(float,v.split(',')))for v in p.attrib['points'].split()];assert len(points)==161
 for i,xy in enumerate(points):
  t=i/40;v=1-(1+t)*math.exp(-t)if name=='D'else 1-math.exp(-t)
  ar(xy,[105+210*t,405-230*v],'static integrals',absolute=1e-8)
for i,p in enumerate(tree.findall('.//s:rect[@data-spike-alpha]',ns)):
 h=[4,16,64][i];a=p.attrib
 ar([float(a[k])for k in ['x','y','width','height']],[90+350*i,900-h*180/64,250/16,h*180/64],'static spike')
body=(R/'grad-math/lectures/mt-01-measure-expectation.md').read_text()
assert body.count('<details class="answer"')==3
assert '\n+\\mathbb E|c_M(X_n)-c_M(X)|'in body and '\n+\\mathbb E|c_M(X)-X|'in body
assert '1-\\frac{N-1}{M}'in body
shared=(R/'course-shared/labs/measure-expectation.js').read_bytes()
for c in ['grad-math','math-course','ai-course']:assert(R/c/'site/assets/learning/labs/measure-expectation.js').read_bytes()==shared
assert(R/'grad-math/images/mt-01-measure-expectation.svg').read_bytes()==(R/'grad-math/site/assets/img/mt-01-measure-expectation.svg').read_bytes()
print(json.dumps(dict(status='PASS',checks=checks,quadrature_pairs=len(quads),positive_caps=len(caps),signed_truncations=len(data['signed']),spike_families=len(spikes),snapshots=18,plots=18,strict=data['bad'],self=15)))
