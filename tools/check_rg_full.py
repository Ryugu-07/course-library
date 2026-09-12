"""Independent stdlib numerical oracle; no lesson runtime imported."""
import math
from collections import Counter,defaultdict
checks=0
def eq(g,v):
 global checks
 checks+=1
 assert type(g)is type(v)and g==v,(g,v)
def near(g,v):
 global checks
 checks+=1
 assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)
 assert abs(g-v)<=2e-9*(1+abs(v)),(g,v)
def array(g,v):
 eq(len(g),len(v))
 for a,b in zip(g,v):
  if isinstance(b,list):array(a,b)
  else:near(a,b)
cache={}
def micros(n):
 if n in cache:return cache[n]
 dos=Counter();corr=[Counter()for _ in range(n+1)];marg=defaultdict(Counter)
 for mask in range(1<<n):
  ss=[1 if mask&(1<<i)else -1 for i in range(n)]
  M=sum(ss);B=sum(ss[i]*ss[(i+1)%n]for i in range(n));key=(B,M);dos[key]+=1
  for r in range(n+1):corr[r][(B,M,ss[0]*ss[r%n])]+=1
  target=sum(1<<(i//2)for i in range(0,n,2)if ss[i]>0);marg[target][key]+=1
 cache[n]=(dos,corr,marg);return cache[n]
def matmul(A,B):return [[math.fsum(A[i][k]*B[k][j]for k in range(2))for j in range(2)]for i in range(2)]
def finite_ref(K,h,n):
 dos,corr,mg=micros(n);weights={(B,M):count*math.exp(K*B+h*M)for(B,M),count in dos.items()}
 Z=math.fsum(weights.values());mean=math.fsum(M*w for(B,M),w in weights.items())/(n*Z)
 correlations=[math.fsum(count*math.exp(K*B+h*M)*spin for(B,M,spin),count in row.items())/Z for row in corr]
 T=[[math.exp(K*s*t+h*(s+t)/2)for t in[-1,1]]for s in[-1,1]];P=[[[1,0],[0,1]]]
 for i in range(n):P.append(matmul(P[-1],T))
 return Z,mean,correlations,T,P
def check_finite(f,K,h,n):
 eq(f['size'],n);Z,m,c,T,P=finite_ref(K,h,n)
 near(f['partition'],Z);near(f['logZ'],math.log(Z));near(f['mean'],m);array(f['matrix'],T);array(f['powers'],P)
 eq(len(f['correlations']),n+1)
 for i,row in enumerate(f['correlations']):eq(row['distance'],i);near(row['value'],c[i])
 return Z,m
def check_chain(ch,c):
 K=c['coupling'];h=c['field'];n=16;constant=0
 Z0,m0=check_finite(ch['initial'],K,h,n);eq(len(ch['stages']),c['steps']+1)
 for step,s in enumerate(ch['stages']):
  eq(s['step'],step);eq(s['physicalSpacing'],2**step)
  if step:
   Z,m,_,T,P=finite_ref(K,h,n);U=P[2];la=math.log(U[0][0]);lb=math.log(U[0][1]);ld=math.log(U[1][1])
   k2=(la+ld-2*lb)/4;h2=(ld-la)/2;A=(la+ld+2*lb)/4;tr=s['transformation']
   near(tr['coupling'],k2);near(tr['field'],h2);near(tr['constant'],A);array(tr['squaredMatrix'],U);array(tr['logSquaredMatrix'],[[la,lb],[lb,ld]])
   mg=s['marginal'];eq(len(mg['rows']),1<<(n//2));near(mg['partition'],Z)
   for i,row in enumerate(mg['rows']):
    eq(row['mask'],i);ss=[1 if i&(1<<j)else -1 for j in range(n//2)];eq(row['spins'],ss)
    bins=micros(n)[2][i];terms=[(M,count*math.exp(K*B+h*M))for(B,M),count in bins.items()]
    weight=math.fsum(w for M,w in terms);mag=math.fsum(M*w for M,w in terms)
    near(row['weight'],weight);near(row['weightedOriginalM'],mag);near(row['directConditionalM'],mag/weight)
    near(row['conditionalOriginalM'],mag/weight);near(row['conditionalEliminatedM'],mag/weight-sum(ss));eq(row['retainedM'],sum(ss))
    near(row['probability'],weight/Z);near(row['reconstructedProbability'],weight/Z);near(row['reconstructedLogWeight'],math.log(weight))
    B=sum(ss[j]*ss[(j+1)%len(ss)]for j in range(len(ss)));eq(row['effectiveB'],B);near(row['effectiveLogWeight'],tr['coupling']*B+tr['field']*sum(ss))
   near(mg['originalMean'],m);near(mg['retainedMean'],m)
   constant+=n/2*A;n//=2;K=tr['coupling'];h=tr['field']
  else:eq(s['transformation'],None);eq(s['marginal'],None)
  near(s['coupling'],K);near(s['field'],h);near(s['accumulatedConstant'],constant);near(s['restoredLogZ'],math.log(Z0));check_finite(s['finite'],K,h,n)
 eq(len(ch['zeroFieldFlow']),41)
 for i,row in enumerate(ch['zeroFieldFlow']):
  logq=2**i*math.log(math.tanh(c['coupling']));q=math.exp(logq)
  eq(row['step'],i);eq(row['spacing'],2**i);near(row['logQ'],logq);near(row['q'],q);eq(row['couplingUnderflow'],q==0)
  near(row['coupling'],math.atanh(q));near(row['correlationLengthLattice'],-1/logq);near(row['correlationLengthPhysical'],-1/math.log(math.tanh(c['coupling'])))
def star_ref(K,h):
 ss=[[1 if mask&(1<<i)else -1 for i in range(4)]for mask in range(16)]
 logs=[math.log(math.exp(h+K*sum(s))+math.exp(-h-K*sum(s)))for s in ss]
 chars=[[math.prod(s[i]for i in range(4)if sub&(1<<i))for s in ss]for sub in range(16)]
 coeff=[math.fsum(x*y for x,y in zip(ch,logs))/16 for ch in chars]
 pair=[math.fsum(coeff[a]*chars[a][i]for a in range(16)if a.bit_count()<=2)for i in range(16)]
 lz=math.log(math.fsum(math.exp(x)for x in logs));plz=math.log(math.fsum(math.exp(x)for x in pair));p=[math.exp(x-lz)for x in logs];q=[math.exp(x-plz)for x in pair]
 return ss,logs,coeff,pair,lz,plz,p,q
def check_star(s,K,h,full=True):
 ss,logs,coeff,pair,lz,plz,p,q=star_ref(K,h)
 near(s['coupling'],K)
 if full:near(s['centralField'],h)
 else:near(s['field'],h)
 near(s['logZ'],lz);near(s['pairLogZ'],plz);near(s['klDivergence'],math.fsum(p[i]*(logs[i]-lz-pair[i]+plz)for i in range(16)));near(s['maxProbabilityError'],max(abs(a-b)for a,b in zip(p,q)))
 eq(len(s['coefficients']),16)
 for i,r in enumerate(s['coefficients']):eq(r['subset'],i);eq(r['sites'],[j for j in range(4)if i&(1<<j)]);eq(r['order'],i.bit_count());near(r['value'],coeff[i])
 if full:
  eq(len(s['rows']),16)
  for i,r in enumerate(s['rows']):
   eq(r['mask'],i);eq(r['spins'],ss[i]);eq(r['M'],sum(ss[i]));near(r['logWeight'],logs[i]);near(r['reconstructedLogWeight'],logs[i]);near(r['pairLogWeight'],pair[i]);near(r['probability'],p[i]);near(r['pairProbability'],q[i]);near(r['logProbabilityRatio'],logs[i]-lz-pair[i]+plz);near(r['centralMean'],math.tanh(h+K*sum(ss[i])))
def exponent_ref(e,n):
 r=(n+2)/(n+8)
 return {'epsilon':e,'components':n,'thermalEigenvalue':2-r*e,'omega':e,'nuFirstOrder':.5+r*e/4,'nuReciprocalTruncation':1/(2-r*e),'alphaFirstOrder':(4-n)*e/(2*(n+8)),'betaFirstOrder':.5-1.5*e/(n+8),'gammaFirstOrder':1+r*e/2,'deltaFirstOrder':3+e,'etaAtThisOrder':0}
def check_exponents(g,e,n):
 ref=exponent_ref(e,n);eq(set(g),set(ref))
 for k,v in ref.items():
  if k=='components':eq(g[k],v)
  else:near(g[k],v)
def ode_rows(c,times):
 a=(c['components']+8)/6;b=(c['components']+2)/6
 def rhs(y):g,t,I=y;return [c['epsilon']*g-a*g*g,(2-b*g)*t,g]
 y=[c['initialCoupling'],c['thermal'],0];t=0;out=[]
 for target in times:
  pieces=max(1,math.ceil((target-t)/.001));dt=(target-t)/pieces
  for _ in range(pieces):
   k1=rhs(y);k2=rhs([v+dt*k/2 for v,k in zip(y,k1)]);k3=rhs([v+dt*k/2 for v,k in zip(y,k2)]);k4=rhs([v+dt*k for v,k in zip(y,k3)])
   y=[v+dt*(z1+2*z2+2*z3+z4)/6 for v,z1,z2,z3,z4 in zip(y,k1,k2,k3,k4)]
  out.append(y[:]);t=target
 return out
def check_flow_rows(rows,c):
 eq(len(rows),121);times=[c['ellMax']*i/120 for i in range(121)];ref=ode_rows(c,times)
 a=(c['components']+8)/6;b=(c['components']+2)/6
 for i,(r,y)in enumerate(zip(rows,ref)):
  ell=times[i];g,t,I=y;near(r['ell'],ell);near(r['lengthScale'],math.exp(ell));near(r['coupling'],g);near(r['thermal'],t);near(r['couplingIntegral'],I)
  near(r['denominator'],math.exp(a*I));near(r['betaCoupling'],c['epsilon']*g-a*g*g);near(r['betaThermal'],(2-b*g)*t);near(r['quarticRelativeCorrection'],a*g)
  # Flag thresholds are evaluated on the submitted, separately checked numerical value.
  eq(r['smallThermal'],abs(r['thermal'])<=.1);eq(r['epsilonSmall'],c['epsilon']<=.3);eq(r['quarticCorrectionSmall'],r['quarticRelativeCorrection']<=.3)
def check_snapshot(s):
 eq(s['schemaVersion'],1);c=s['parameters'];check_chain(s['chain'],c);check_star(s['star'],c['coupling'],c['field'])
 f=s['flow'];a=(c['components']+8)/6;b=(c['components']+2)/6;near(f['dimension'],4-c['epsilon']);near(f['a'],a);near(f['b'],b);check_flow_rows(f['rows'],c);check_exponents(f['exponents'],c['epsilon'],c['components'])
 eq(len(f['fixedPoints']),1+int(c['epsilon']>0))
 for i,r in enumerate(f['fixedPoints']):
  eq(r['kind'],'Gaussian'if i==0 else'Wilson-Fisher');near(r['coupling'],0 if i==0 else c['epsilon']/a);near(r['thermal'],0);near(r['thermalEigenvalue'],2 if i==0 else 2-b*c['epsilon']/a);near(r['couplingEigenvalue'],c['epsilon']if i==0 else-c['epsilon'])
 if f['crossing']is not None:
  r=f['crossing'];y=ode_rows(c,[r['ell']])[0];near(abs(y[1]),1);near(r['thermal'],y[1]);near(r['lengthScale'],math.exp(r['ell']))
 else:assert c['thermal']==0 or abs(f['rows'][-1]['thermal'])<1
 eq(len(s['epsilonScan']),21)
 for i,r in enumerate(s['epsilonScan']):check_exponents(r,i/20,c['components'])
 eq(len(s['starScan']),61)
 for i,r in enumerate(s['starScan']):check_star(r,.05+2.95*i/60,c['field'],False)
 family=sorted(set([0,.02,.1,.4,.8,c['initialCoupling']]));eq(len(s['flowFamily']),len(family))
 for g,r in zip(family,s['flowFamily']):near(r['initialCoupling'],g);check_flow_rows(r['rows'],{**c,'initialCoupling':g,'thermal':0})
def check_records(records):
 start=checks
 for r in records:check_snapshot(r)
 return checks-start

from pathlib import Path
import subprocess,sys,json,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/rg-flow.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/rg-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{coupling:.05,field:.75},{coupling:.05,field:-.75},{coupling:3,field:.75},{coupling:3,field:-.75},{epsilon:1e-10,initialCoupling:1,components:8,ellMax:12},{epsilon:0,initialCoupling:1,thermal:.05,ellMax:12},{epsilon:1,initialCoupling:1,components:8,thermal:-.05,ellMax:12},{epsilon:0,initialCoupling:0,thermal:0,ellMax:0},{epsilon:.3,initialCoupling:.2,components:1},{steps:0,ellMax:0},{steps:1,field:.01},{steps:2,field:-.01}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0}];for(const k of Object.keys(a.DEFAULT))for(const v of [null,'1',NaN,Infinity,-Infinity])bad.push({[k]:v});
bad.push({coupling:.049},{coupling:3.001},{field:.751},{field:-.751},{steps:-1},{steps:4},{steps:.5},{epsilon:-.001},{epsilon:1.001},{components:0},{components:9},{components:1.5},{initialCoupling:-.001},{initialCoupling:1.001},{thermal:-.051},{thermal:.051},{ellMax:-.001},{ellMax:12.001});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:check_snapshot(s)
science_checks=checks
INTEGER_KEYS={'schemaVersion','components','steps','size','step','spacing','physicalSpacing','mask','subset','sites','order','spins','M','retainedM','effectiveB','distance'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for x,y in zip(g,v):replay(x,y,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v
 else:assert isinstance(g,(float,int))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=2e-12*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
guards=0
base=f['records'][0]['data']
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(steps=3.0000000000001),
 lambda x:x['chain']['stages'][0].update(step=.0000000000001),
 lambda x:x['star']['coefficients'][0].update(subset=.0000000000001),
 lambda x:x['star']['coefficients'][0].update(sites=[1]),
 lambda x:x['chain']['stages'][0]['finite'].update(size=16.0000000000001),
 lambda x:x['star']['rows'][0].update(probability=float('nan')),
 lambda x:x['flow']['rows'][0].update(smallThermal=1),
 lambda x:x['flow'].update(crossing=None),
 lambda x:x['star'].update(logZ=x['star']['logZ']+.001)
]:
 mutant=copy.deepcopy(base);change(mutant);rejected=False
 try:replay(mutant,base)
 except AssertionError:rejected=True
 assert rejected,'replay guard';guards+=1
plotcoords=markers=table_rows=0
NS='{http://www.w3.org/2000/svg}'
for record,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==11 and len(render['svgs'])==6
 for p,source in zip(render['plots'],render['svgs']):
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']
  assert root.find(NS+'title').text==p['title']
  paths=[x for x in root.findall(NS+'path')if x.get('data-series')is not None];assert len(paths)==len(p['series'])
  expected_markers=0
  for i,(series,path)in enumerate(zip(p['series'],paths)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''))
   points=[v for v in series['points']if v is not None];assert len(coords)==len(points)
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=.000001 and abs(float(xy[1])-Y)<=.000001;plotcoords+=2
   expected_markers+=len(points)if series.get('markersOnly')else(1 if len(points)==1 else 0)
  actual=root.findall(NS+'circle');assert len(actual)==expected_markers;markers+=len(actual)
  # Every legend row must fit within the SVG; six-series plots need a third row.
  for text_node in root.findall(NS+'text'):
   if text_node.text in [s['name']for s in p['series']]:assert float(text_node.get('y'))+8<=580
 for t in render['tables']:
  assert t['title']and t['headers']
  for row in t['rows']:assert len(row)==len(t['headers'])
  table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['chain']['stages'][1].update(accumulatedConstant=0),
 lambda x:x['chain']['stages'][1].update(restoredLogZ=0),
 lambda x:x['chain']['stages'][1]['transformation'].update(constant=0),
 lambda x:x['chain']['stages'][1]['marginal']['rows'][0].update(probability=.5),
 lambda x:x['chain']['stages'][1]['marginal']['rows'][0].update(conditionalOriginalM=0),
 lambda x:x['chain']['initial']['powers'][1][0].__setitem__(0,0),
 lambda x:x['chain']['zeroFieldFlow'][10].update(correlationLengthPhysical=0),
 lambda x:x['star']['coefficients'][15].update(value=0),
 lambda x:x['star']['rows'][0].update(pairProbability=.5),
 lambda x:x['star'].update(klDivergence=0),
 lambda x:x['flow']['rows'][100].update(coupling=0),
 lambda x:x['flow']['rows'][100].update(thermal=0),
 lambda x:x['flow']['fixedPoints'][1].update(couplingEigenvalue=1),
 lambda x:x['epsilonScan'][20].update(nuFirstOrder=.6),
 lambda x:x['starScan'][60]['coefficients'][15].update(value=0),
 lambda x:x['flowFamily'][-1]['rows'][100].update(coupling=0)
]:
 mutant=copy.deepcopy(base);change(mutant);rejected=False
 try:check_snapshot(mutant)
 except AssertionError:rejected=True
 assert rejected,'undetected scientific mutation';mutations+=1
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
