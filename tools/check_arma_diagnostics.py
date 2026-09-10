"""Independent Decimal covariance/Toeplitz references and complete plot geometry."""
from pathlib import Path
from decimal import Decimal as D, localcontext
import json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
JS=r"""
const a=require('./course-shared/labs/arma-diagnostics.js'),assert=require('assert');
const results=[],theories=[],plots=[],special=[];
for(const kind of ['ar1','ma1'])for(const coefficient of [-1.2,-1,-.98,-.8,0,.02,.6,.8,.98,1,1.2])
for(const length of [50,300,1200])for(const seed of [0,17,4294967295])
results.push(a.experiment({kind,coefficient,length,seed}));
for(const coefficient of [-.9999999999999999,.9999999999999999])results.push(a.experiment({kind:'ar1',coefficient,length:1200,seed:17}));
for(const c of [-1.2,-1,-.9999999999999999,-.8,-1e-150,0,1e-150,.6,.9999999999999999,1,1.2])
for(const variance of [Number.MIN_VALUE,1,4])theories.push({c,variance,ar:a.ar1Theory(c,variance,40),ma:a.ma1Theory(c,variance,40)});
for(const p of a.PRESETS)for(const seed of [17,107,20260910]){
 const r=a.experiment({kind:p.kind,coefficient:p.coefficient,seed});
 plots.push({r,trajectory:a.drawTrajectory(r),acf:a.drawCorrelation(r,'acf'),pacf:a.drawCorrelation(r,'pacf'),forecast:a.drawForecast(r)});
}
for(const values of [[0,0,0],[2,2,2],[1,1+Number.EPSILON,1-Number.EPSILON],[Number.MIN_VALUE,0,-Number.MIN_VALUE],
 [1e300,-1e300,1e300,-1e300],[1e-300,-1e-300,2e-300,3e-300]])special.push({values,stats:a.sampleStats(values,values.length-1)});
let strict=0;const reject=f=>{assert.throws(f);strict++;};
for(const c of [null,[],1,{foo:1},{kind:'MA'},{coefficient:'0.8'},{coefficient:NaN},{coefficient:Infinity},{coefficient:1.21},
 {length:49},{length:1201},{length:50.5},{seed:-1},{seed:4294967296},{seed:.5},{maxLag:0},{maxLag:41},{maxLag:'20'}])reject(()=>a.normalizeConfig(c));
for(const v of [[],[1],[1,NaN],[1,Infinity],['1',2]])reject(()=>a.sampleStats(v,1));
reject(()=>a.simulate('ar1',.8,100,17,200));reject(()=>a.sampleStats([1,2],2));reject(()=>a.samplePacf([1,1]));reject(()=>a.forecast('x',.8,[1,2],8));
for(const v of [0,-1,'1',NaN,Infinity])reject(()=>a.ma1Theory(.8,v,20));
const uniforms=[0,17,4294967295].map(seed=>{const f=a.makeRandom(seed);return{seed,values:Array.from({length:1024},f)}});
console.log(JSON.stringify({results,theories,plots,special,strict,uniforms,self:a.selfTest()}));
"""
result=json.loads(subprocess.check_output((['rtk','proxy']if shutil.which('rtk')else[])+['node','-e',JS],cwd=ROOT,text=True))
checks=0
def ok(v,label):
 global checks
 checks+=1
 if not v:raise AssertionError(label)
def near(a,b,rtol=2e-11,atol=2e-13):
 a=float(a);b=float(b)
 ok(a==b or abs(a-b)<=max(atol,rtol*abs(b)),f'{a} vs {b}')
def dec(v):return D.from_float(v)if isinstance(v,float)else D(v)
def solve(matrix,rhs):
 """Pivoted elimination; independent of product Durbin-Levinson recursion."""
 n=len(rhs);a=[list(row)+[rhs[i]]for i,row in enumerate(matrix)]
 for j in range(n):
  best=max(range(j,n),key=lambda i:abs(a[i][j]));a[j],a[best]=a[best],a[j];assert a[j][j]!=0
  for i in range(j+1,n):
   ratio=a[i][j]/a[j][j]
   for k in range(j+1,n+1):a[i][k]-=ratio*a[j][k]
   a[i][j]=D(0)
 x=[D(0)]*n
 for i in range(n-1,-1,-1):x[i]=(a[i][n]-sum(a[i][j]*x[j]for j in range(i+1,n)))/a[i][i]
 return x
def stats(values,lag):
 x=list(map(dec,values));mean=sum(x)/len(x);x=[v-mean for v in x];den=sum(v*v for v in x)
 if den==0:return mean,D(0),[None]*(lag+1),[None]*(lag+1)
 cov=[sum(x[i]*x[i-k]for i in range(k,len(x)))for k in range(lag+1)]
 acf=[v/den for v in cov];pacf=[D(1)]
 for k in range(1,lag+1):pacf.append(solve([[cov[abs(i-j)]for j in range(k)]for i in range(k)],cov[1:k+1])[-1])
 return mean,den/len(x),acf,pacf
def uniforms(seed):
 while True:
  seed=(1664525*seed+1013904223)&(2**32-1)
  yield(seed+.5)/2**32
def noises(seed,n):
 gen=uniforms(seed);out=[]
 while len(out)<n:
  radius=math.sqrt(-2*math.log(next(gen)));angle=2*math.pi*next(gen)
  out.extend([radius*math.cos(angle),radius*math.sin(angle)])
 return out[:n]
for g in result['uniforms']:
 u=uniforms(g['seed'])
 for x in g['values']:ok(x==next(u),'uniform bitwise')
with localcontext()as ctx:
 ctx.prec=90
 for entry in result['theories']:
  c=dec(entry['c']);v=dec(entry['variance']);ar=entry['ar'];ma=entry['ma']
  ok(ar['causalStationary']==(abs(c)<1),'causal certificate');ok(ma['stationary']and ma['invertible']==(abs(c)<1),'MA certificate')
  if abs(c)<1:
   near(ar['variance'],v/(1-c*c),rtol=5e-15,atol=math.ulp(0.0))
   for k in range(41):
    near(ar['acf'][k],D(1)if k==0 else c**k,rtol=2e-14,atol=math.ulp(0.0))
    near(ar['pacf'][k],1 if k==0 else c if k==1 else 0,atol=0)
  else:ok(ar['variance']is None and all(x is None for x in ar['acf']+ar['pacf']),'invalid theory absent')
  near(ma['variance'],v*(1+c*c),rtol=3e-15,atol=math.ulp(0.0))
  for k in range(41):
   near(ma['acf'][k],1 if k==0 else c/(1+c*c)if k==1 else 0,atol=math.ulp(0.0))
   expected=D(1)if k==0 else D((-1)**(k+1))*c**k/sum(D(1)if j==0 else c**(2*j)for j in range(k+1))
   near(ma['pacf'][k],expected,rtol=2e-14,atol=math.ulp(0.0))
 prefixes={}
 for item in result['results']:
  conf=item['config'];kind=conf['kind'];c=dec(conf['coefficient']);n=conf['length'];seed=conf['seed'];values=item['values']
  eps=noises(seed,n+1);previous=eps[0]/math.sqrt(1-float(c)**2)if abs(c)<1 else 0;ref=[]
  for i in range(n):
   previous=float(c)*previous+eps[i+1]if kind=='ar1'else eps[i+1]+float(c)*eps[i];ref.append(previous)
  for a,b in zip(values,ref):near(a,b,rtol=3e-12,atol=3e-12)
  key=(kind,str(c),seed)
  if key in prefixes:ok(values[:len(prefixes[key])]==prefixes[key],'same stream exact prefix')
  prefixes[key]=values
  mean,variance,acf,pacf=stats(values,conf['maxLag']);s=item['sample']
  near(s['mean'],mean,atol=3e-13,rtol=5e-12);near(s['variance'],variance,rtol=5e-13,atol=1e-13)
  for a,b in zip(s['acf'],acf):near(a,b,rtol=5e-12,atol=8e-14)
  for a,b in zip(s['pacf'],pacf):near(a,b,rtol=1e-9,atol=3e-12)
  if kind=='ma1':
   # Continuant / cofactor formula for final inverse row, independent of LDL.
   determinants=[D(1)];power=D(1)
   for j in range(1,n+1):power*=c*c;determinants.append(determinants[-1]+power)
   inverse=[((-c)**(n-j)if n>j else D(1))*determinants[j-1]/determinants[n]for j in range(1,n+1)]
   mean1=c*sum(a*dec(x)for a,x in zip(inverse,values));v1=1+c*c-c*c*determinants[n-1]/determinants[n]
  for row in item['forecast']:
   h=row['h']
   m=c**h*dec(values[-1])if kind=='ar1'else mean1 if h==1 else D(0)
   v=sum(D(1)if j==0 else c**(2*j)for j in range(h))if kind=='ar1'else v1 if h==1 else 1+c*c
   sd=v.sqrt();delta=D('1.959963984540054')*sd
   for name,expect in [('mean',m),('variance',v),('sd',sd),('lower',m-delta),('upper',m+delta)]:
    near(row[name],expect,rtol=4e-12,atol=2e-12)
 # Extreme binary64 observations need enough digits for exact cancellation.
 ctx.prec=1100
 for item in result['special']:
  vals=item['values'];s=item['stats'];mean,v,acf,pacf=stats(vals,len(vals)-1)
  near(s['mean'],mean,rtol=2e-14,atol=math.ulp(0.0));near(s['sd'],v.sqrt(),rtol=2e-14,atol=math.ulp(0.0))
  for name,expected in [('acf',acf),('pacf',pacf)]:
   for a,b in zip(s[name],expected):
    if b is None:ok(a is None,'constant covariance undefined')
    else:near(a,b,rtol=2e-12,atol=3e-14)
  if float(v)==float('inf'):ok(s['variance']is None,'unrepresentable variance')
def points(d):return[(float(a),float(b))for a,b in re.findall(r'[ML]([-\d.e+]+),([-\d.e+]+)',d)]
def bound(vals):
 lo=min(vals);hi=max(vals);width=hi-lo
 return(lo-width*.08,hi+width*.08)if width else(lo-1,hi+1)
def verify_path(root,name,expected):
 path=[e for e in root.iter()if e.get('data-series')==name];ok(len(path)==1,name)
 ps=points(path[0].get('d'));ok(len(ps)==len(expected),'all vertices')
 for(x,y),(xx,yy)in zip(ps,expected):
  near(x,xx,atol=1e-9);near(y,yy,atol=1e-9);ok(50-1e-8<=y<=290+1e-8,'full plot bounds')
for item in result['plots']:
 r=item['r'];values=r['values'];lo,hi=bound(values)
 yp=lambda v:290-(v-lo)/(hi-lo)*240
 verify_path(ET.fromstring(item['trajectory']),'observations',[(125+745*i/(len(values)-1),yp(v))for i,v in enumerate(values)])
 for name in ['acf','pacf']:
  root=ET.fromstring(item[name]);theory=r['theory'][name];sample=r['sample'][name]
  stems=[e for e in root.iter()if e.get('class')=='ad-theory'];dots=[e for e in root.iter()if e.get('class')=='ad-sample']
  ok(len(stems)==(20 if theory[0]is not None else 0),'no invented nonstationary zero stems');ok(len(dots)==20,'all sample correlations')
  for e in stems:
   k=int(e.get('data-lag'));near(e.get('x1'),125+745*(k-1)/19,atol=1e-9);near(e.get('y1'),170);near(e.get('y2'),170-120*theory[k],atol=1e-9)
  for e in dots:
   k=int(e.get('data-lag'));near(e.get('cx'),125+745*(k-1)/19,atol=1e-9);near(e.get('cy'),170-120*sample[k],atol=1e-9)
 root=ET.fromstring(item['forecast']);past=values[-20:];rows=r['forecast'];lo,hi=bound(past+[v for row in rows for v in [row['mean'],row['lower'],row['upper']]])
 yp=lambda v:290-(v-lo)/(hi-lo)*240;xp=lambda i:125+745*i/27
 verify_path(root,'history',[(xp(i),yp(v))for i,v in enumerate(past)])
 verify_path(root,'forecast',[(xp(19),yp(past[-1]))]+[(xp(i+20),yp(v['mean']))for i,v in enumerate(rows)])
 bars=[e for e in root.iter()if e.get('class')=='ad-interval'];ok(len(bars)==8,'all prediction intervals')
 for e,row in zip(bars,rows):
  near(e.get('x1'),xp(row['h']+19),atol=1e-9);near(e.get('y1'),yp(row['lower']),atol=1e-9);near(e.get('y2'),yp(row['upper']),atol=1e-9)
for e in ET.parse(ROOT/'math-course/images/ts-01-ar-process.svg').iter():
 panel=e.get('data-panel')
 if panel in ['acf','pacf']:
  s=int(e.get('data-series'));k=int(e.get('data-k'))
  if panel=='acf':v=(.8 if s==0 else -.8)**k if s<2 else(.6/1.36 if k==1 else 0);y=275-100*v
  else:v=((.8 if s==0 else -.8)if k==1 else 0)if s<2 else(-1)**(k+1)*.6**k/sum(.6**(2*j)for j in range(k+1));y=602.5-102.5*v
  near(e.get('y2'),y,atol=1e-9)
 elif panel=='variance':
  s=int(e.get('data-series'));ps=[list(map(float,p.split(',')))for p in e.get('points').split()]
  ok(len(ps)==8,'all static variance vertices')
  for h,(x,y)in enumerate(ps,1):
   v=sum(.8**(2*j)for j in range(h))if s==0 else(1.36-.36/(1.36-.36/1.36)if h==1 else 1.36)
   near(x,645+(h-1)*50,atol=1e-9);near(y,705-v/3*205,atol=1e-9)
source=(ROOT/'course-shared/labs/arma-diagnostics.js').read_bytes()
for course in ['math-course','grad-math','ai-course']:ok((ROOT/course/'site/assets/learning/labs/arma-diagnostics.js').read_bytes()==source,'mirrors')
lecture=(ROOT/'math-course/lectures/ts-01-stationary-arma.md').read_text()
ok('非因果' in lecture and '有限二阶矩' in lecture and '联合高斯' in lecture,'scope of stationarity')
ok(r'X_t=-\sum_{j=1}^{\infty}\phi^{-j}\varepsilon_{t+j}'in lecture,'anti-causal counterexample')
ok(r'\sum_{t=k+1}^{n}(x_t-\bar x)(x_{t-k}-\bar x)'in lecture,'sample convention')
ok(r'v_1=d-\theta^2(\Sigma_n^{-1})_{nn}'in lecture,'finite observation prediction')
print(f"ARMA PASS: {checks} checks, {len(result['results'])} ensembles, {len(result['theories'])} Decimal90 theory cases, {len(result['plots'])} full plot sets, {result['strict']} strict failures, {result['self']['checks']} self-checks")
