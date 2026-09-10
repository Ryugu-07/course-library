"""Independent integer probability sums, Decimal Erlang tails and complete rendered nodes."""
from pathlib import Path
import decimal,html,itertools,json,math,re,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
MODULE=ROOT/'course-shared/labs/subgaussian-concentration.js'
decimal.getcontext().prec=90
D=decimal.Decimal
count=0
def check(ok,label):
 global count
 count+=1
 if not ok:raise AssertionError(label)
def near(a,b,label,rel=4e-11,abs_=0):
 a=float(a);b=float(b)
 check(a==b or math.isfinite(a)and math.isfinite(b)and abs(a-b)<=abs_+rel*abs(b),f'{label}: {a} != {b}')
def query(expr):
 return json.loads(subprocess.check_output(PREFIX+['node','-e',"const h=require("+json.dumps(str(MODULE))+");console.log(JSON.stringify("+expr+",(k,v)=>v===Infinity?'Infinity':v===-Infinity?'-Infinity':v));"],cwd=ROOT,text=True))
def logratio(num,den):
 if num==0:return -math.inf
 if num==den:return 0.
 if num>den//2:
  d=D(den-num)/D(den)
  if d<D('1e-25'):return float(-d-d*d/2)
 return float((D(num)/D(den)).ln())
def normal(t):
 if t==0:return 0.
 if t<1:return math.log1p(-math.erf(t/math.sqrt(2)))
 if t<30:return math.log(math.erfc(t/math.sqrt(2)))
 z=D(str(t));term=D(1);s=term
 for k in range(1,100):
  term*=-(2*k-1)/(z*z);s+=term
  if abs(term)<D('1e-30'):break
 return float(D(2).ln()-z*z/2-z.ln()-D(str(2*math.pi)).ln()/2+s.ln())
def mgf(m,x):
 z=D(str(x))
 if x==0:return 0.
 if m=='gaussian':return float(z*z/2)
 if m=='rademacher':return float(((z.exp()+(-z).exp())/2).ln())
 if m=='uniform':return float(((z.exp()-(-z).exp())/(2*z)).ln())
 if m=='laplace':return float(-(1-z*z/2).ln())if z*z<2 else math.inf
 return math.inf
def tail(m,t):
 if m=='gaussian':return normal(t)
 if m=='rademacher':return 0. if t<=1 else -math.inf
 if m=='uniform':return math.log1p(-t)if t<1 else -math.inf
 if m=='laplace':return -math.sqrt(2)*t
 return -3*math.log1p(t)
models=['gaussian','rademacher','uniform','laplace','heavy']
configs=[dict(model=m,dependence=d,n=n,count=0,threshold=t)for m,d,n,t in itertools.product(models,['independent','shared'],[1,32,512],[0,12,512])]
configs += [{'model':'heavy','lambda':x}for x in [0,1e-300,1e-15,-1e-15]]
allitems=query(json.dumps(configs)+'.map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s)}})')
for item in allitems:
 s=item['s'];c=s['config'];m=c['model'];n=c['n'];t=c['threshold'];K=1/3 if m=='uniform'else 1 if m in ['gaussian','rademacher']else None
 check(s['proxyVariance']==K,'proxy scale')
 factor=n if c['dependence']=='independent'else n*n
 near(s['sumVariance'],factor*(1/3 if m=='uniform'else 1),'actual sum variance')
 bound=None if K is None else min(0,math.log(2)-t*t/(2*factor*K))
 if bound is None:check(s['sumLogBound']is None and s['unionLogBound']is None,'no false certificate')
 else:
  near(s['sumLogBound'],bound,'sum bound',abs_=3e-15);near(s['unionLogBound'],min(0,math.log(c['events'])+bound),'union bound',abs_=3e-15)
 if c['dependence']=='shared':ref=tail(m,t/n)
 elif m=='gaussian':ref=normal(t/math.sqrt(n))
 elif m=='rademacher':ref=logratio(sum(math.comb(n,k)for k in range(n+1)if abs(2*k-n)>=t),2**n)
 elif n==1:ref=tail(m,t)
 else:ref=None
 if ref is None:check(s['sumLogActual']is None,'unknown convolution not invented')
 else:near(s['sumLogActual'],ref,'actual sum tail',abs_=0)
 for r in s['lambdaRows']:
  near(r['logMGF'],mgf(m,r['lambda']),'all log MGF',abs_=2e-14 if abs(r['lambda'])>.05 else 1e-28)
  if K is None:check(r['logEnvelope']is None,'no envelope')
  else:near(r['logEnvelope'],K*r['lambda']**2/2,'envelope')
  if m=='uniform':near(r['logRangeEnvelope'],r['lambda']**2/2,'range proxy')
 for r in s['tailRows']:
  near(r['logActual'],tail(m,r['t']),'all true single tails')
  if K is not None:near(r['logBound'],min(0,math.log(2)-r['t']**2/(2*K)),'single bound',abs_=3e-15)
 check(len(s['lambdaRows'])>=163 and len(s['tailRows'])>=201,'complete model grids')
# Small but nonzero normal log tails and deep tails must survive, including floating probability underflow.
ts=[0,1e-300,1e-30,1e-12,.01,.099999,.1,.5,1,math.sqrt(3),2,10,20,30,38,40,100,512]
for t,r in zip(ts,query(json.dumps(ts)+'.map(h.normalLogTwoTail)')):near(r,normal(t),'normal near/deep tail',rel=3e-12)
cs=[dict(mode='binomial',n=n,p=p,count=0)for n,p in itertools.product([1,4,32,100,512],[0,.0001,.01,.5,.9999,1])]
bins=query(json.dumps(cs)+'.map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s)}})')
for item in bins:
 s=item['s'];c=s['config'];n=c['n'];a=round(c['p']*10000);den=10000**n;p=D(a)/10000
 nums=[math.comb(n,k)*a**k*(10000-a)**(n-k)for k in range(n+1)]
 check(sum(nums)==den,'integer binomial mass closure');check(len(s['rows'])==n+1,'all counts')
 before=0
 for k,r in enumerate(s['rows']):
  near(r['logRaw'],logratio(nums[k],den),'raw binomial mass',rel=1e-10,abs_=2e-12)
  near(r['logMass'],logratio(nums[k],den),'normalized binomial mass',rel=1e-10,abs_=2e-12)
  # Relative accuracy is essential for a log probability extremely close to zero.
  near(r['logLowerBefore'],logratio(before,den),'lower complement',rel=2e-10,abs_=0)
  near(r['logUpper'],logratio(den-before,den),'integer exact upper',rel=2e-10,abs_=0)
  t=D(10000*k-n*a)/10000;V=n*p*(1-p);M=max(p,1-p);q=D(k)/n
  H=0. if t<=0 else float(-2*t*t/n)
  B=0. if t<=0 else -math.inf if V==0 else float(-t*t/(2*(V+M*t/3)))
  kl=D(0)if q==p else D('Infinity')if p in[0,1] else -(1-p).ln()if q==0 else -p.ln()if q==1 else q*(q/p).ln()+(1-q)*((1-q)/(1-p)).ln()
  C=0. if t<=0 else float(-n*kl)
  for key,v in [('logHoeffding',H),('logBernstein',B),('logKL',C)]:near(r[key],v,key,rel=2e-10,abs_=0);check(float(r['logUpper'])<=v+1e-10,'valid upper '+key)
  near(r['logUnion'],min(0,math.log(c['events'])+C),'KL union',abs_=2e-14)
  before+=nums[k]
# Independent Erlang/Poisson representation; upper side is a finite polynomial, not product CF.
def gamma_ref(m,x):
 if x==0:return -math.inf,0.
 z=D(str(x));term=D(1);terms=[term]
 for k in range(1,m):term*=z/k;terms.append(term)
 Q=(-z).exp()*sum(terms)
 if z>=m:
  L=(1-Q).ln()if Q<1 else D('-Infinity')
 else:
  term*=z/m;total=term
  for k in range(m+1,5000):
   term*=z/k;total+=term
   if abs(term)<abs(total)*D('1e-85'):break
  L=-z+total.ln()
 return float(L),float(Q.ln())
scs=[dict(mode='shell',dimension=n,deviation=t)for n,t in itertools.product([2,4,32,100,512],[0,2,20])]
shells=query(json.dumps(scs)+'.map(c=>{const s=h.snapshot(c);return{s,plots:h.plots(s)}})')
for item in shells:
 s=item['s'];n=s['config']['dimension'];root=math.sqrt(n);near(s['root'],root,'root radius');near(s['radialMode'],math.sqrt(n-1),'radial mode')
 for r in s['rows']:
  t=r['t'];lo=max(0,root-t);hi=root+t;L=gamma_ref(n//2,lo*lo/2)[0];U=gamma_ref(n//2,hi*hi/2)[1]
  near(r['logLower'],L,'Erlang lower',rel=2e-10,abs_=2e-13);near(r['logUpper'],U,'finite Erlang upper',rel=2e-10,abs_=2e-13)
  ref=0 if t==0 else max(L,U)+math.log1p(math.exp(-abs(L-U)))
  near(r['logActual'],ref,'two-sided shell',rel=2e-10,abs_=2e-13)
  a=max(0,1-t/root);b=1+t/root;low=math.erf(a/math.sqrt(2));up=math.exp(normal(b))
  near(r['logShared'],math.log(low+up),'shared-coordinate counterexample',abs_=3e-14)
  check(float(r['logActual'])<=r['logBound']+2e-12,'Gaussian shell bound');check(r['logRademacher']==(0 if t==0 else '-Infinity'),'constant Rademacher radius')
 for r in s['radial']:
  x=r['r'];ld=-math.inf if x==0 else (1-n/2)*math.log(2)-math.lgamma(n/2)+(n-1)*math.log(x)-x*x/2
  near(r['logDensity'],ld,'radial log density',rel=4e-10,abs_=2e-12);near(r['density'],math.exp(ld),'radial density',rel=4e-11)
  near(r['logPointDensity'],-n/2*math.log(2*math.pi)-x*x/2,'point versus radial density')
 check(len(s['radial'])>=202 and len(s['rows'])>=201,'complete shell grids')
allitems+=bins+shells
for item in allitems:
 for p in item['plots']:
  check(p['xmin']<p['xmax'] and p['ymin']<p['ymax'],'axes nondegenerate')
  for r in p['series']:
   check(len(r['values'])==len(p['xs']),'all plotted nodes')
   for x,v in zip(p['xs'],r['values']):
    check(p['xmin']<=x<=p['xmax'],'x inside axes')
    if v is not None:check(math.isfinite(v)and p['ymin']<=v<=p['ymax'],'finite unclipped ordinate')
   key=p['key'];s=item['s']
   if key=='mgf':refs=s['lambdaRows'];field={'actual':'logMGF','proxy':'logEnvelope','range':'logRangeEnvelope'}[r['key']]
   elif key=='tail':refs=s['tailRows'];field={'actual':'logActual','bound':'logBound'}[r['key']]
   elif key=='binomial-tail':refs=s['rows'];field={'actual':'logUpper','hoeffding':'logHoeffding','bernstein':'logBernstein','kl':'logKL'}[r['key']]
   elif key=='radial':refs=s['radial'];field='density'
   else:refs=s['rows'];field={'actual':'logActual','bound':'logBound','shared':'logShared'}[r['key']]
   for v,row in zip(r['values'],refs):
    ref=row[field]
    if key=='tail'and ref is not None:ref=math.exp(float(ref))
    if ref is None or isinstance(ref,str):check(v is None,'nonfinite values never forged')
    else:near(v,ref,'graph carries verified row')
strict=query("""(()=>{const f=[()=>h.config(null),()=>h.config([]),...['mode','model','dependence'].flatMap(k=>['constructor','',null].map(v=>()=>h.config({[k]:v}))),...Object.keys(h.DEFAULTS).filter(k=>typeof h.DEFAULTS[k]==='number').flatMap(k=>[null,'1',NaN,Infinity,-Infinity].map(v=>()=>h.config({[k]:v}))),...Object.entries({n:[0,513,1.5],events:[0,10001,1.5],threshold:[-1,513],lambda:[-21,21],singleThreshold:[-1,21],p:[-1,2,.12345,1e-15],count:[-1,33,.5],dimension:[1,3,514],deviation:[-1,21]}).flatMap(([k,vs])=>vs.map(v=>()=>h.config({[k]:v}))),()=>h.normalLogTwoTail(null),()=>h.rademacherLogTail(3.5,1),()=>h.binomialRows(0,.5),()=>h.bernoulliKL(-.1,.5),()=>h.bernoulliKL(.5,2)];return{q:f.map(fn=>{try{fn();return false}catch(e){return true}}),self:h.selfTest()}})()""")
for x in strict['q']:check(x,'strict API boundary')
check(strict['self']['status']=='PASS','self')
src=(ROOT/'grad-math/lectures/hdp-01-subgaussian.md').read_text();site=(ROOT/'grad-math/site/hdp-01-subgaussian.html').read_text()
blocks=re.findall(r'\$\$(.*?)\$\$',src,re.S);check(len(blocks)==31,'display formula count')
for b in blocks:check(b in html.unescape(site),'formula ships unchanged')
source_math=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
site_math=[b.strip()for a,b in re.findall(r'<(span|div) class="arithmatex">\\[\(\[](.*?)\\[\)\]]</\1>',html.unescape(site),re.S)]
check(len(source_math)==len(site_math),'all source formulas have actual math wrappers')
for a,b in zip(source_math,site_math):check(a==b,'every inline and display formula matches')
for t in [r'1+\frac{\lambda^2EX_i^2}{2}',r'(2k+1)!',r'6^k k!',r'V+\frac{Mt}{3}<\frac n4',r'K\ge1/\sqrt{\ln2}',r'0.05010246',r'0.6578887',r'10^{-64}']:check(t in src,'essential factor '+t)
check(src.count('<details class="answer"')==4,'four full answers')
check(re.search(r'<img[^>]+src="assets/img/hdp-01-subgaussian-tail.svg"',site)is not None,'real image')
check('assets/learning/labs/subgaussian-concentration.js'in site,'real lab script')
paths=subprocess.check_output(PREFIX+['git','ls-files','*assets/learning/labs/subgaussian-concentration.js'],cwd=ROOT,text=True).splitlines()
check(len(paths)==3,'three site mirrors')
for p in paths:check((ROOT/p).read_bytes()==MODULE.read_bytes(),'JS mirror')
svg=(ROOT/'grad-math/images/hdp-01-subgaussian-tail.svg').read_bytes();check(svg==(ROOT/'grad-math/site/assets/img/hdp-01-subgaussian-tail.svg').read_bytes(),'SVG mirror')
tree=ET.fromstring(svg);ns={'s':'http://www.w3.org/2000/svg'}
ps=query("[h.plots(h.snapshot({model:'uniform'}))[0],h.plots(h.snapshot({mode:'binomial'}))[0],h.plots(h.snapshot({mode:'shell'}))[1]]")
lines=tree.findall('s:polyline',ns);points=tree.findall('s:circle',ns);check(len(lines)==6 and len(points)==132,'all static series and discrete points')
for n,p in enumerate(ps):
 xx=lambda v:145+890*(v-p['xmin'])/(p['xmax']-p['xmin'])
 yy=lambda v:110+440*n+295-210*(v-p['ymin'])/(p['ymax']-p['ymin'])
 for r in p['series']:
  if r['pointsOnly']:
   pts=[e for e in points if e.attrib['data-plot']==p['key']and e.attrib['data-series']==r['key']]
   check(len(pts)==len(p['xs']),'all static integer counts')
   for i,(pt,x,v)in enumerate(zip(pts,p['xs'],r['values'])):check(int(pt.attrib['data-index'])==i,'point index');near(float(pt.attrib['cx']),xx(x),'static discrete x',abs_=2e-8);near(float(pt.attrib['cy']),yy(v),'static discrete y',abs_=2e-8)
  else:
   line=next(e for e in lines if e.attrib['data-plot']==p['key']and e.attrib['data-series']==r['key'])
   coords=[[float(z)for z in pair.split(',')]for pair in line.attrib['points'].split()];check(len(coords)==len(p['xs']),'all static nodes')
   for a,x,v in zip(coords,p['xs'],r['values']):near(a[0],xx(x),'static x',abs_=2e-8);near(a[1],yy(v),'static y',abs_=2e-8)
print(f"Subgaussian PASS: {count:,} checks; {len(configs)} full model, {len(bins)} exact-integer binomial and {len(shells)} Decimal Erlang snapshots; {len(blocks)} formulas; {len(strict['q'])} strict; {strict['self']['checks']} self")
