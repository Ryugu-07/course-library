"""Independent arithmetic checks for finite JL maps and covariance net certificates."""
from pathlib import Path
import subprocess,json,math,re,html,shutil
from decimal import Decimal,localcontext
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=ROOT/'course-shared/labs/jl-projection.js'
checks=0
def ck(ok,msg):
 global checks
 checks+=1
 assert ok,msg
def close(a,b,msg,tol=3e-12):
 ck(math.isclose(a,b,rel_tol=tol,abs_tol=tol),f'{msg}: {a} != {b}')
program=r"""
const a=require(process.argv[1]),seeds=[20260722,31415926,27182818,8675309,0,4294967295],out={seeds:[],budgets:[],strict:0};
for(const seed of seeds)out.seeds.push({seed,matrix:a.gaussianMatrix(seed),prefix:a.prefixes(seed,.2),runs:Array.from({length:31},(_,i)=>{const k=i+2,d=a.analyze({k,seed,epsilon:.2});return{d,h:a.histogramData(d),c:a.covariance(seed,k)};})});
for(const e of [.001,.01,.1,.2,.5,.6,.99])for(const k of [1,8,32,1000])for(const delta of [.1,.05,1e-6])out.budgets.push(a.budget(k,e,12,delta));
for(const k of [0,1,33,2.5,"8",null,NaN,Infinity]){let ok=false;try{a.analyze({k});}catch(e){ok=true;}if(!ok)throw Error("accepted bad k");out.strict++;}
for(const epsilon of [0,.099,.601,1,".2",null,NaN,Infinity]){let ok=false;try{a.analyze({epsilon});}catch(e){ok=true;}if(!ok)throw Error("accepted bad epsilon");out.strict++;}
for(const seed of [-1,4294967296,1.5,"42",null,NaN,Infinity]){let ok=false;try{a.analyze({seed});}catch(e){ok=true;}if(!ok)throw Error("accepted bad seed");out.strict++;}
for(const v of [null,[],4,"x"]){let ok=false;try{a.analyze(v);}catch(e){ok=true;}if(!ok)throw Error("accepted bad config");out.strict++;}
out.format=[0,10,20,30,100].map(x=>a.format(x,0));out.self=a.selfTest();console.log(JSON.stringify(out));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',program,str(JS)],text=True))
def gaussian_matrix(seed):
 state=seed;mask=2**32-1
 def uniform():
  nonlocal state
  state=(state+0x6D2B79F5)&mask
  t=((state^(state>>15))*(1|state))&mask
  t^=(t+(((t^(t>>7))*(61|t))&mask))&mask
  return ((t^(t>>14))&mask)/2**32
 out=[]
 for i in range(32):
  row=[]
  for j in range(32):
   u=uniform()
   while u==0:u=uniform()
   row.append(math.sqrt(-2*math.log(u))*math.cos(2*math.pi*uniform()))
  out.append(row)
 return out
P=[[0.]*32 for _ in range(12)]
P[1][0]=P[2][1]=P[3][0]=P[3][1]=1.
for j in range(32):
 if j<8:P[4][j]=1/math.sqrt(8);P[5][j]=(-1 if j%2 else 1)/math.sqrt(8)
 P[6][j]=1/math.sqrt(32);P[7][j]=(-1 if j%2 else 1)/math.sqrt(32)
 if j<16:P[8][j]=.25
 else:P[9][j]=.25
 if j<4:P[10][j]=.5;P[11][j]=-.5 if j%2 else .5
for entry in data['seeds']:
 G=gaussian_matrix(entry['seed'])
 for i in range(32):
  for j in range(32):close(entry['matrix'][i][j],G[i][j],'PRNG matrix')
 for rr in entry['runs']:
  d=rr['d'];k=d['k'];ratios=[];inside=0
  for pair in d['pairs']:
   v=[x-y for x,y in zip(P[pair['i']],P[pair['j']])]
   old=math.fsum(x*x for x in v)
   new=math.fsum(math.fsum(x*y for x,y in zip(row,v))**2 for row in G[:k])/k
   ratio=new/old;ratios.append(ratio);inside+=.8<=ratio<=1.2
   close(pair['originalSquared'],old,'original distance');close(pair['projectedSquared'],new,'direct difference projection');close(pair['ratio'],ratio,'ratio');ck(pair['inside']==(.8<=ratio<=1.2),'membership')
  close(d['minRatio'],min(ratios),'min');close(d['maxRatio'],max(ratios),'max');close(d['worstDeviation'],max(abs(x-1)for x in ratios),'worst');ck(d['insideCount']==inside,'inside count')
  bins=[0]*15;mx=max(3,math.ceil(max(ratios)))
  for v in ratios:bins[min(14,int(v/mx*15))]+=1
  ck(rr['h']=={'max':mx,'counts':bins},'full histogram without clamping')
  c=rr['c'];samples=[(2*row[0],row[1]/2)for row in G[:k]]
  av=math.fsum(x for x,y in samples)/k;bv=math.fsum(y for x,y in samples)/k
  a=math.fsum(x*x for x,y in samples)/k;b=math.fsum(x*y for x,y in samples)/k;cc=math.fsum(y*y for x,y in samples)/k
  for got,expected in zip(c['mean'],[av,bv]):close(got,expected,'mean')
  for got,expected in zip(c['second'],[a,b,cc]):close(got,expected,'second')
  for got,expected in zip(c['centered'],[a-av*av,b-av*bv,cc-bv*bv]):close(got,expected,'centered')
  for got,(x,y)in zip(c['samples'],samples):
   for key,val in zip(['x','y','xx','xy','yy'],[x,y,x*x,x*y,y*y]):close(got[key],val,'sample outer product')
  alpha=a/4-1;beta=b;gamma=cc*4-1
  # Evaluate the extrema using stationary angles instead of the product eig formula.
  angle=math.atan2(2*beta,alpha-gamma)/2
  def q(t):return alpha*math.cos(t)**2+beta*math.sin(2*t)+gamma*math.sin(t)**2
  extrema=sorted([q(angle),q(angle+math.pi/2)]);op=max(map(abs,extrema))
  for got,val in zip(c['eigen'],extrema):close(got,val,'stationary eigenvalue')
  close(c['op'],op,'op')
  qnet=[q(2*math.pi*i/16)for i in range(16)]
  eta=2*math.sin(math.pi/32);nm=max(map(abs,qnet))
  close(c['netMax'],nm,'net max');close(c['netBound'],nm/(1-2*eta),'net bound');ck(nm<=op+1e-12 and op<=c['netBound']+1e-12,'continuous net certificate')
  for p in c['net']+c['grid']:close(p['q'],q(p['theta']),'every quadratic plot value')
  absangle=math.atan2(2*b,a-4-(cc-.25))/2
  def aq(t):return (a-4)*math.cos(t)**2+b*math.sin(2*t)+(cc-.25)*math.sin(t)**2
  absolute=max(abs(aq(absangle)),abs(aq(absangle+math.pi/2)))
  close(c['absOp'],absolute,'absolute error');ck(absolute<=4*op+1e-12,'whitening inequality')
 for i,p in enumerate(entry['prefix']):
  d=entry['runs'][i]['d']
  for key,other in [('min','minRatio'),('max','maxRatio'),('worst','worstDeviation'),('inside','insideCount')]:close(p[key],d[other],'prefix row')
for b in data['budgets']:
 with localcontext()as ctx:
  ctx.prec=70;e=Decimal(str(b['epsilon']));one=Decimal(1)
  hp=(e-(one+e).ln())/2;hm=(-e-(one-e).ln())/2
  close(b['hPlus'],float(hp),'Decimal h+',1e-14);close(b['hMinus'],float(hm),'Decimal h-',1e-14)
  k=Decimal(b['k']);single=(-k*hp).exp()+(-k*hm).exp()
  close(b['logSingle'],float(min(one,single).ln()),'single bound');close(b['logUnion'],float(min(one,66*single).ln()),'union bound')
  required=((Decimal(132)/Decimal(str(b['delta']))).ln()/hp).to_integral_value(rounding='ROUND_CEILING')
  ck(b['sufficient']==int(required),'sufficient dimension')
ck(data['format']==['0','10','20','30','100'],'integer formatting')
src=(ROOT/'grad-math/lectures/hdp-02-random-vectors.md').read_text()
site=(ROOT/'grad-math/site/hdp-02-random-vectors.html').read_text()
formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
ck(formulas==actual,'every source and published formula')
ck(src.count('<details')==4,'four answers')
for path in ROOT.glob('*/site/assets/learning/labs/jl-projection.js'):ck(path.read_bytes()==JS.read_bytes(),'JS mirror '+str(path))
ck((ROOT/'grad-math/images/hdp-02-concentration.svg').read_bytes()==(ROOT/'grad-math/site/assets/img/hdp-02-concentration.svg').read_bytes(),'SVG mirror')
# Static coordinates checked from the independently validated snapshot, not generator imports.
import xml.etree.ElementTree as ET
tree=ET.parse(ROOT/'grad-math/images/hdp-02-concentration.svg');ns={'s':'http://www.w3.org/2000/svg'}
root=tree.getroot();ck(root.get('viewBox')=='0 0 1100 1560','static dimensions')
default=data['seeds'][0]['runs'][6];mp=default['d'];cv=default['c'];prefix=data['seeds'][0]['prefix']
def points(kind):
 return root.findall('.//s:circle[@data-kind="'+kind+'"]',ns)
for kind,rows,xy in [
 ('pair',mp['pairs'],lambda p:(135+900*(p['originalSquared']/mp['originalScale'])/3,460-220*(p['projectedSquared']/mp['originalScale'])/3)),
 ('prefix',prefix,lambda p:(135+900*p['k']/32,960-220*p['worst']/(max(r['worst']for r in prefix)*1.1))),
 ('net',cv['net'],lambda p:(135+900*p['theta']/(2*math.pi),1430-220*(p['q']+cv['op']*1.15)/(cv['op']*2.3)))]:
 nodes=points(kind);ck(len(nodes)==len(rows),'static '+kind+' count')
 for node,row in zip(nodes,rows):
  x,y=xy(row);close(float(node.get('cx')),x,'static x',1e-10);close(float(node.get('cy')),y,'static y',1e-10)
poly=root.find('.//s:polyline[@data-kind="covariance"]',ns)
pts=[list(map(float,t.split(',')))for t in poly.get('points').split()]
ck(len(pts)==181,'static quadratic curve')
for pt,row in zip(pts,cv['grid']):
 close(pt[0],135+900*row['theta']/(2*math.pi),'static curve x',1e-10)
 close(pt[1],1430-220*(row['q']+cv['op']*1.15)/(cv['op']*2.3),'static curve y',1e-10)
print(f'JL PASS: {checks} independent checks;186 complete maps/covariances;{len(data["budgets"])} Decimal budgets;{len(formulas)} formulas;{data["strict"]} strict;{data["self"]["checks"]} self')
