"""Independent standard-library audit of every LLN replay row and plotted vertex."""
from pathlib import Path
from decimal import Decimal,localcontext
from fractions import Fraction
import itertools,json,math,shutil,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy'] if shutil.which('rtk') else []
COUNT=0
def check(ok,label):
 global COUNT
 COUNT+=1
 if not ok:raise AssertionError(label)
def near(a,b,label,rel=5e-13,absolute=2e-14):
 check(math.isfinite(a) and abs(a-b)<=absolute+rel*abs(b),(label,a,b))
M=2**32;A=1664525;C=1013904223;inv=pow(A,-1,M)
def back(s):return (inv*(s-C))%M
seeds=[0,1,2,7,13,99,M-1]+[back(back(s))for s in [0,M-1,M//2-1,M//2]]
alphas=[.5,.75,1,math.nextafter(1,0),math.nextafter(1,2),1.5,math.nextafter(2,0),2,math.nextafter(2,3),2.5,3,5]
configs=[dict(modelId=model,n=257,seed=seed,alpha=1.5)for model in ['bernoulli','pareto','cauchy','dependent']for seed in seeds]
configs +=[dict(modelId=model,n=n,seed=13,alpha=1.5)for model in ['bernoulli','pareto','cauchy','dependent']for n in [1,2,5000]]
configs +=[dict(modelId='pareto',n=1000,seed=M-1,alpha=a)for a in alphas]
momentcases=[['pareto',i,a]for i in [1,2,3,4,10,100,1000,5000]for a in alphas]
boundcases=[[n,e]for n in [1,2,3,10,100,1000,1000000]for e in [.001,.1,.5,1,2]]
js=r"""
const fs=require('fs'),h=require('./course-shared/labs/lln-integrability.js'),q=JSON.parse(fs.readFileSync(0,'utf8'));
class E{constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';}setAttribute(k,v){this.attrs[k]=String(v);}append(...x){this.children.push(...x);}appendChild(x){this.children.push(x);}}
const doc={createElementNS:(ns,tag)=>new E(tag)};
const paths=q.configs.map(c=>{let p=h.samplePath(c.modelId,c.n,c.seed,c.alpha);let plots=['averages','observations'].map(k=>h.drawPlot(doc,h.plotData(p,k),'test-'+k));return{p,plots};});
let strict=0;const rejects=[
()=>h.samplePath('constructor',2,1),()=>h.samplePath('toString',2,1),()=>h.samplePath('bad',2,1),
...['',null,NaN,Infinity,-1,0,1.5,5001,'2'].map(n=>()=>h.samplePath('bernoulli',n,1)),
...['',null,NaN,Infinity,-1,1.5,4294967296,'2'].map(s=>()=>h.samplePath('bernoulli',2,s)),
...['',null,NaN,Infinity,.49,5.01,'1.5'].map(a=>()=>h.samplePath('pareto',2,1,a)),
()=>h.truncatedMoments('constructor',1,1),()=>h.truncatedMoments('pareto',0,1),()=>h.truncatedMoments('pareto',1,.1),
()=>h.fourthMomentBound(0,.1),()=>h.fourthMomentBound(1,0),()=>h.plotData(paths[0].p,'bad')];
for(const f of rejects){let hit=false;try{f();}catch(e){hit=true;}if(!hit)throw Error('accepted strict '+strict);strict++;}
let mutation=false;try{h.MODELS.pareto.mean=4;}catch(e){}mutation=h.MODELS.pareto.mean===3&&Object.isFrozen(h.MODELS)&&Object.values(h.MODELS).every(Object.isFrozen)&&Object.isFrozen(h.DEFAULTS);
console.log(JSON.stringify({paths,moments:q.momentcases.map(c=>h.truncatedMoments(...c)),bounds:q.boundcases.map(c=>h.fourthMomentBound(...c)),strict,mutation,self:h.selfTest()},(k,v)=>v===Infinity?'Infinity':v));
"""
q=subprocess.run(PREFIX+['node','-e',js],cwd=ROOT,input=json.dumps(dict(configs=configs,momentcases=momentcases,boundcases=boundcases)),text=True,capture_output=True,check=True)
data=json.loads(q.stdout);check(data['mutation'],'frozen metadata');check(data['strict']==33,'strict count');check(data['self']['status']=='PASS','self')
def rng(seed):
 while True:
  seed=(A*seed+C)%M
  yield (seed+.5)/M
def moments(model,i,a):
 if model=='bernoulli':return .6,.6,.24,0
 if model=='dependent':return 0,1,1,0
 if model=='cauchy':
  b=2/math.pi*(i-math.atan(i));return 0,b,b,2/math.pi*math.atan(1/i)
 def v(r):
  d=r-a
  return a*math.log(i) if d==0 else a*math.expm1(d*math.log(i))/d
 x,y=v(1),v(2);return x,y,y-x*x,i**(-a)
def nodes(e,tag=None):
 if tag is None or e['tag']==tag:yield e
 for c in e['children']:yield from nodes(c,tag)
for c,item in zip(configs,data['paths']):
 p=item['p'];model=c['modelId'];n=c['n'];a=c['alpha'];g=rng(c['seed']);shared=next(g);xs=[];ys=[];ems=[];vs=[];ps=[];discarded=0
 check(len(p['rows'])==n and len(p['running'])==n and len(p['values'])==n,('length',c))
 near(p['sharedU'],shared,'initial draw',0,0)
 for i,r in enumerate(p['rows'],1):
  u=shared if model=='dependent' else next(g)
  x=(-1 if u<.5 else 1)if model=='dependent' else (1 if u<.6 else 0)if model=='bernoulli' else (1-u)**(-1/a)if model=='pareto' else math.tan(math.pi*(u-.5))
  near(r['u'],u,(c,i,'u'),0,0);near(r['x'],x,(c,i,'x'),2e-14,2e-14)
  # Sum-rounding is checked against exact summation of the individually validated binary64 observations.
  xs.append(r['x']);y=r['x'] if abs(r['x'])<=i else 0;ys.append(y);discarded+=y!=r['x']
  e,second,var,tail=moments(model,i,a);ems.append(e);vs.append(var/(i*i));ps.append(tail)
  check(r['i']==i and r['discarded']==discarded,(c,i,'integer ledger'))
  for key,want in [('y',y),('expected',e),('second',second),('variance',var),('tail',tail)]:near(r[key],want,(c,i,key),2e-12,2e-14)
  for key,want,absbudget in [
   ('sum',math.fsum(xs),4e-15*math.fsum(map(abs,xs))),('average',math.fsum(xs)/i,4e-15*math.fsum(map(abs,xs))/i),
   ('truncatedSum',math.fsum(ys),4e-15*math.fsum(map(abs,ys))),('truncatedAverage',math.fsum(ys)/i,4e-15*math.fsum(map(abs,ys))/i),
   ('expectedAverage',math.fsum(ems)/i,2e-14),('weightedVarianceSum',math.fsum(vs),2e-13),('tailProbabilitySum',math.fsum(ps),2e-13)]:
   near(r[key],want,(c,i,key),2e-12,absbudget+2e-14)
  near(p['running'][i-1],r['average'],'public running',0,0);near(p['values'][i-1],r['x'],'public values',0,0)
 near(p['finalMean'],p['rows'][-1]['average'],'final average',0,0);near(p['maxAbs'],max(map(abs,xs)),'max absolute',0,0)
 expectedmean=.6 if model=='bernoulli' else 0 if model=='dependent' else None if model=='cauchy' else a/(a-1) if a>1 else 'Infinity'
 check(p['theory']['mean']==expectedmean,('mean',c,p['theory']));check(p['theory']['integrable']==(model not in ['cauchy','pareto'] or model=='pareto' and a>1),'integrability')
 for kind,svg in zip(['averages','observations'],item['plots']):
  keys=['average','truncatedAverage','expectedAverage']if kind=='averages'else['x','y'];vals=[[r[k]for r in p['rows']]for k in keys]
  reference=expectedmean if kind=='averages' and isinstance(expectedmean,(float,int)) else None
  allvalues=[0]+[v for s in vals for v in s]+([]if reference is None else[reference]);lo,hi=min(allvalues),max(allvalues);pad=1 if hi==lo else .08*(hi-lo);lo-=pad;hi+=pad
  x=lambda i:125 if n==1 else 125+740*(i-1)/(n-1)
  y=lambda v:290-230*(v-lo)/(hi-lo)
  if kind=='averages':
   lines=[e for e in nodes(svg,'polyline')if 'data-series'in e['attrs']];check(len(lines)==3,'three mean series')
   for line,key,values in zip(lines,keys,vals):
    check(line['attrs']['data-series']==key,'series identity');points=[list(map(float,v.split(',')))for v in line['attrs']['points'].split()];check(len(points)==n,'all unthinned vertices')
    for i,(pt,v)in enumerate(zip(points,values),1):near(pt[0],x(i),'x coordinate',0,1e-10);near(pt[1],y(v),'y coordinate',0,1e-10)
   singles=[e for e in nodes(svg,'circle')if 'data-single'in e['attrs']];check(len(singles)==(3 if n==1 else 0),'single point visibility')
  else:
   circles=list(nodes(svg,'circle'));check(len(circles)==2*n,'all discrete observations');check(not list(nodes(svg,'polyline')),'no invented observation interpolation')
   for j,k in enumerate(keys):
    for i,e in enumerate(circles[j*n:(j+1)*n],1):
     at=e['attrs'];check(at['data-series']==k and int(at['data-i'])==i,'point identity');near(float(at['cx']),x(i),'point x',0,1e-10);near(float(at['cy']),y(p['rows'][i-1][k]),'point y',0,1e-10)
  refs=[e for e in nodes(svg,'line')if 'data-reference'in e['attrs']];check(len(refs)==(0 if reference is None else 1),'finite theory reference only')
  if refs:near(float(refs[0]['attrs']['y1']),y(reference),'reference coordinate',0,1e-10)
with localcontext() as ctx:
 ctx.prec=80
 for (model,i,a),actual in zip(momentcases,data['moments']):
  da=Decimal.from_float(a);log=Decimal(i).ln()
  def moment(r):
   d=Decimal(r)-da
   return da*log if not d else da*((d*log).exp()-1)/d
  mean,second=moment(1),moment(2)
  for key,v in [('mean',mean),('second',second),('variance',second-mean*mean),('tail',(-da*log).exp())]:
   near(actual[key],float(v),('Decimal moment',i,a,key),3e-12,1e-14)
 for (n,e),actual in zip(boundcases,data['bounds']):
  dn=Decimal(n);de=Decimal.from_float(e);fourth=Decimal('0.0672')*dn+Decimal('0.1728')*dn*(dn-1);raw=fourth/(dn*de)**4
  for key,v in [('fourth',fourth),('raw',raw),('probabilityBound',min(Decimal(1),raw)),('chebyshev',min(Decimal(1),Decimal('.24')/(dn*de*de)))]:near(actual[key],float(v),'fourth bound',2e-14,1e-20)
# Exhaustively enumerate short Bernoulli sums to verify the fourth-moment combinatorics.
for n in range(1,31):
 exact=sum(Fraction(math.comb(n,k))*Fraction(3,5)**k*Fraction(2,5)**(n-k)*(Fraction(k)-Fraction(3*n,5))**4 for k in range(n+1))
 check(exact==Fraction(42,625)*n+3*n*(n-1)*Fraction(6,25)**2,'binomial fourth moment')
# Pairwise independence, not mutual; the finite example's complete outcomes.
triples=[(u,v,u*v)for u in [-1,1]for v in [-1,1]]
for i,j in itertools.combinations(range(3),2):
 check(sorted((r[i],r[j])for r in triples)==[(-1,-1),(-1,1),(1,-1),(1,1)],'pairwise table')
check(all(math.prod(r)==1 for r in triples),'not mutually independent')
# Squeeze boundaries are exact rational inequalities for the displayed finite example.
t=[1,1,3,3,4,7,9,10]
for n in range(4,9):check(Fraction(t[3],8)<=Fraction(t[n-1],n)<=Fraction(t[7],4),'squeeze')
ns={'s':'http://www.w3.org/2000/svg'};figure=ROOT/'grad-math/images/mt-02-lln.svg';svg=ET.fromstring(figure.read_text())
for e in svg.findall('s:rect',ns):
 if 'data-original'in e.attrib:
  i=int(e.attrib['data-original']);near(float(e.attrib['height']),24*[1,8,2,5][i-1],'static original bar',0,0)
 if 'data-truncated'in e.attrib:
  i=int(e.attrib['data-truncated']);near(float(e.attrib['height']),24*[1,0,2,0][i-1],'static truncated bar',0,0)
points=svg.find('s:polyline[@id="fourth-bound"]',ns).attrib['points'].split();check(len(points)==1000,'static all bounds')
for n,p in enumerate(points,1):
 x,y=map(float,p.split(','));bound=min(1,(.0672*n+.1728*n*(n-1))/(.1*n)**4)
 near(x,150+800*math.log10(n)/3,'static x',0,1e-8);near(y,1090-62*math.log10(bound/.001),'static y',0,1e-8)
body=(ROOT/'grad-math/lectures/mt-02-lln.md').read_text();check(body.count('<details class="answer"')==3,'three full answers');check('\n+E[\\mathbf1_{A_k}(R_n-R_k)^2]'in body,'maximal inequality plus sign')
for c in ['grad-math','math-course','ai-course']:check((ROOT/c/'site/assets/learning/labs/lln-integrability.js').read_bytes()==(ROOT/'course-shared/labs/lln-integrability.js').read_bytes(),'JS mirror')
check(figure.read_bytes()==(ROOT/'grad-math/site/assets/img/mt-02-lln.svg').read_bytes(),'figure mirror')
print(f'LLN PASS: {COUNT:,} checks; {len(configs)} complete paths; {len(momentcases)} Decimal moment cases; {len(boundcases)} bounds; {data["strict"]} strict; {data["self"]["checks"]} self')
