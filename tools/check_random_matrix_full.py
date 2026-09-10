"""Independent arithmetic, full eigenpair, coverage and UI-data checks (stdlib)."""
from pathlib import Path
from decimal import Decimal as D,getcontext
import math,json,subprocess,shutil,sys,xml.etree.ElementTree as ET
getcontext().prec=60
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/random-matrix-norm.js'
code=r"""
const a=require(process.argv[1]),nets=[],matrices=[];
for(const count of [4,8,16,32,64,128,256])for(const angle of [0,17,90,179.99])for(const minor of [0,1,4])nets.push(a.snapshot({count,angle,minor}));
for(const p of a.PRESETS)for(const seed of [0,20260722,4294967295])for(const start of ['ones','axis','difference'])matrices.push(a.snapshot({mode:'matrix',...p,preset:p.id,seed,start}));
for(const p of ['gaussian','rademacher','covariance','correlated','heavy-tail'])for(const [m,n]of [[2,8],[8,2],[8,8]])matrices.push(a.snapshot({mode:'matrix',preset:p,m,n,seed:17,iterations:64}));
let strict=0;function bad(x){let ok=false;try{a.snapshot(x)}catch(e){ok=true}if(!ok)throw Error('invalid accepted '+JSON.stringify(x));strict++;}
for(const x of [null,[],true,1,'x'])bad(x);
for(const [key,values]of Object.entries({major:[0,11,'',null,Infinity],minor:[-1,5,'',null],angle:[-1,181,'',null],count:[0,3,5,512,16.5,''],mode:['x',null]}))for(const v of values)bad({[key]:v});
for(const [key,values]of Object.entries({preset:['x',null],m:[1,9,2.5,'',null],n:[1,9,2.5,'',null],seed:[-1,4294967296,1.5,'',null],iterations:[-1,65,1.5,'',null],start:['x',null]}))for(const v of values)bad({mode:'matrix',[key]:v});
bad({mode:'matrix',preset:'wigner',m:5,n:4});bad({mode:'matrix',preset:'blind'});bad({mode:'matrix',preset:'hole'});
console.log(JSON.stringify({nets,matrices,strict,self:a.selfTest(),ui:[nets[5],...matrices.filter((_,i)=>i%9===0)].map(d=>({d,tables:a.ledgers(d),plots:a.plots(d)}))}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(v,label):
 global checks
 assert v,label;checks+=1
def close(x,y,label,rel=2e-10,scale=1):
 ck(abs(float(x)-float(y))<=rel*max(abs(float(y)),scale),(label,x,y))
def dec(x):return D.from_float(x)if isinstance(x,float)else D(x)
def matvec(a,v):return [sum(dec(x)*dec(y)for x,y in zip(r,v))for r in a]
def vnorm(v):return sum(dec(x)**2 for x in v).sqrt()
def gram(a):return [[sum(dec(r[i])*dec(r[j])for r in a)for j in range(len(a[0]))]for i in range(len(a[0]))]
def sample_matrix(s):
 state=s['seed'];spare=None
 def uniform():
  nonlocal state
  state=(1664525*state+1013904223)%2**32
  return (state+.5)/2**32
 def gaussian():
  nonlocal spare
  if spare is not None:v=spare;spare=None;return v
  radius=math.sqrt(-2*math.log(uniform()));theta=2*math.pi*uniform()
  spare=radius*math.sin(theta);return radius*math.cos(theta)
 def sample():
  if s['preset']=='rademacher':return -1 if uniform()<.5 else 1
  if s['preset']=='heavy-tail':
   sign=-1 if uniform()<.5 else 1
   return sign*.75*(1-uniform())**(-2/3)
  return gaussian()
 if s['preset']=='blind':return [[1,0],[0,2]]
 if s['preset']=='hole':return [[.5]*4,[0]*4]
 if s['preset']=='wigner':
  out=[[0.]*s['n']for _ in range(s['n'])]
  for i in range(s['n']):
   for j in range(i,s['n']):out[i][j]=out[j][i]=sample()/math.sqrt(s['n'])
  return out
 out=[]
 for _ in range(s['m']):
  if s['preset']=='correlated':
   common=1+.15*gaussian();out.append([common+.12*gaussian()for _ in range(s['n'])])
  else:out.append([sample()for _ in range(s['n'])])
 return out
def check_row(a,r):
 close(vnorm(r['vector']),1,'unit direction',rel=3e-14)
 image=matvec(a,r['vector'])
 operation=max(float(sum(abs(dec(x)*dec(y))for x,y in zip(row,r['vector'])))for row in a)
 for x,y in zip(r['image'],image):close(x,y,'matrix image',scale=operation,rel=2e-14)
 close(r['value'],vnorm(image),'direction norm',scale=operation,rel=2e-14)
for d in data['nets']:
 s=d['config'];theta=math.radians(s['angle']);a=[[s['major']*math.cos(theta),s['major']*math.sin(theta)],[-s['minor']*math.sin(theta),s['minor']*math.cos(theta)]]
 for r in d['matrix']:
  ck(all(math.isfinite(v)for v in r),'matrix finite')
 for rows in [d['directions'],d['curve']]:
  for r in rows:
   phi=math.radians(r['angle']);expected=math.hypot(s['major']*math.cos(phi-theta),s['minor']*math.sin(phi-theta))
   check_row(d['matrix'],r);close(r['value'],expected,'analytic response',rel=2e-13)
 ck(len(d['directions'])==s['count']and len(d['curve'])==721,'complete net nodes')
 previous=0
 for level in d['levels']:
  n=level['count'];e=2*math.sin(math.pi/(2*n));L=max(math.hypot(s['major']*math.cos(2*math.pi*k/n-theta),s['minor']*math.sin(2*math.pi*k/n-theta))for k in range(n))
  close(level['epsilon'],e,'cover radius',rel=2e-14);close(level['maximum'],L,'nested maximum',rel=2e-14)
  close(level['generic'],L/(1-e),'generic bound');close(level['sharp'],L/math.cos(math.pi/n),'sharp bound')
  ck(level['maximum']+1e-12>=previous and level['maximum']<=s['major']+1e-12<=level['sharp']+2e-12,'net sandwich')
  previous=level['maximum']
for d in data['matrices']:
 a=d['matrix'];s=d['config'];g=gram(a)
 expected=sample_matrix(s);actual=d['source']or a
 ck(len(actual)==s['m']and all(len(r)==s['n']for r in actual),'source dimensions')
 for row,reference in zip(actual,expected):
  for x,y in zip(row,reference):close(x,y,'independent seeded matrix',rel=2e-13)
 for i,r in enumerate(g):
  for j,x in enumerate(r):close(d['gram'][i][j],x,'Gram',scale=float(abs(x)))
 if d['source']:
  sourcegram=gram(d['source'])
  for i,r in enumerate(a):
   for j,x in enumerate(r):close(x,sourcegram[i][j]/s['m'],'second moment',rel=2e-13,scale=abs(x))
 target=d['target'];scale=float(vnorm([x for row in target for x in row]))
 ck(d['eigen']['converged'],'Jacobi convergence')
 for eigen,t in [(d['eigen'],target)]+([(d['spectrum'],a)]if d['spectrum']else[]):
  ts=float(vnorm([x for row in t for x in row]))
  for i,p in enumerate(eigen['pairs']):
   image=matvec(t,p['vector']);res=[x-dec(p['value'])*dec(v)for x,v in zip(image,p['vector'])]
   close(p['residual'],vnorm(res),'eigen residual',rel=2e-13,scale=ts)
   ck(float(vnorm(res))<=2e-11*max(ts,1e-290),'full eigenpair equation')
   for j,q in enumerate(eigen['pairs']):
    close(sum(dec(x)*dec(y)for x,y in zip(p['vector'],q['vector'])),int(i==j),'complete orthonormal basis',rel=2e-13)
  close(sum(p['value']for p in eigen['pairs']),sum(t[i][i]for i in range(len(t))),'trace spectrum',rel=2e-12,scale=ts)
 for r in d['directions']:check_row(a,r)
 ck(len(d['directions'])==s['n']+24*s['n']*(s['n']-1)//2,'complete plane directions')
 close(d['gridMax'],max(r['value']for r in d['directions']),'grid maximum')
 for i,r in enumerate(d['history']):
  v=r['vector'];image=matvec(target,v);rho=sum(dec(x)*y for x,y in zip(v,image))
  close(vnorm(v),1,'power unit',rel=3e-14)
  for x,y in zip(r['image'],image):close(x,y,'power image',scale=scale)
  close(r['rayleigh'],rho,'Rayleigh',scale=scale)
  close(r['residual'],vnorm([x-rho*dec(y)for x,y in zip(image,v)]),'power residual',scale=scale,rel=3e-13)
  close(r['estimate'],vnorm(matvec(a,v)),'power lower bound',rel=3e-13)
  ck(r['estimate']<=d['operatorNorm']+max(1,d['operatorNorm'])*2e-10,'power below norm')
  if i+1<len(d['history']):
   for x,y in zip(d['history'][i+1]['vector'],image):close(x,y/vnorm(image),'power transition',rel=2e-12)
 if len(d['history'])<s['iterations']+1:ck(vnorm(d['history'][-1]['image'])==0,'zero stop')
 if s['preset']=='blind'and s['start']=='axis':ck(d['operatorNorm']==2 and all(r['estimate']==1 and r['residual']==0 for r in d['history']),'blind point')
 if s['preset']=='hole':close(d['operatorNorm'],1,'hole norm');close(d['gridMax'],math.sqrt(.5),'hole restricted norm')
 ck(d['gridMax']<=d['operatorNorm']*(1+2e-10),'grid lower')
 close(d['frobenius'],vnorm([x for r in a for x in r]),'Frobenius')
for q in data['ui']:
 d=q['d'];tables={t['key']:t for t in q['tables']}
 ck(len(tables['directions']['rows'])==len(d['directions']),'all directions exposed')
 for i,r in enumerate(d['directions']):
  ck(tables['directions']['rows'][i][1:]==[r['vector'],r['image'],r['value']],'ledger direction fidelity')
 for p in q['plots']:
  for series in p['series']:
   ck(all(p['xmin']-1e-12<=x<=p['xmax']+1e-12 and p['ymin']-1e-12<=y<=p['ymax']+1e-12 for x,y in series['points']),'plot range')
if len(sys.argv)==1:
 import re,html
 src=(ROOT/'grad-math/lectures/hdp-03-random-matrices.md').read_text();site=(ROOT/'grad-math/site/hdp-03-random-matrices.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved in order');ck(src.count('<details class="exercise"')==4,'four complete exercises')
 mirrors=list(ROOT.glob('*/site/assets/learning/labs/random-matrix-norm.js'))
 ck(all(ROOT/(course+'/site/assets/learning/labs/random-matrix-norm.js')in mirrors for course in ['grad-math','math-course','ai-course']),'all required existing mirrors')
 for mirror in mirrors:ck(mirror.read_bytes()==JS.read_bytes(),'JS byte parity')
 svg=ROOT/'grad-math/images/hdp-03-net-ledgers.svg';ck(svg.read_bytes()==(ROOT/'grad-math/site/assets/img/hdp-03-net-ledgers.svg').read_bytes(),'SVG byte parity')
 ns={'s':'http://www.w3.org/2000/svg'};root=ET.parse(svg).getroot();panels=root.findall('.//s:svg',ns);ck(len(panels)==4,'four actual SVG panels')
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]),d=a.snapshot(),h=a.snapshot({mode:'matrix',preset:'hole',m:2,n:4}),b=a.snapshot({mode:'matrix',preset:'blind',m:2,n:2,start:'axis'});console.log(JSON.stringify([...a.plots(d),a.plots(h)[1],a.plots(b)[0]]))",str(JS.resolve())],text=True))
 for panel,q,offset in zip(panels,plots,[100,760,1270,1780]):
  ck(int(panel.get('y'))==offset,'panel placement')
  left=250 if q.get('equal')else 100;width=400 if q.get('equal')else 750;height=400 if q.get('equal')else 250
  xf=lambda x:left+width*(x-q['xmin'])/(q['xmax']-q['xmin'])
  yf=lambda y:85+height-height*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for series in q['series']:
   nodes=panel.findall('.//s:circle[@data-series="'+series['key']+'"]',ns);ck(len(nodes)==len(series['points']),'all static series nodes')
   for i,(node,(x,y))in enumerate(zip(nodes,series['points'])):
    ck(int(node.get('data-index'))==i,'static node index');close(float(node.get('cx')),xf(x),'static x');close(float(node.get('cy')),yf(y),'static y')
   if series['line']:
    poly=panel.find('.//s:polyline[@data-series="'+series['key']+'"]',ns);pts=[list(map(float,p.split(',')))for p in poly.get('points').split()]
    ck(len(pts)==len(nodes),'full polyline')
    for (x,y),(u,v)in zip(pts,series['points']):close(x,xf(u),'polyline x');close(y,yf(v),'polyline y')
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'netStates':len(data['nets']),'matrixStates':len(data['matrices']),'invalid':data['strict'],'self':data['self']}))
