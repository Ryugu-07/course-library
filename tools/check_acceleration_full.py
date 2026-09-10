"""Independent physical-momentum RKF45 oracle and full kinematic/event/plot ledgers."""
from pathlib import Path
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-inflation-darkenergy.js'
code=r"""
const a=require(process.argv[1]),states=[];
for(const epsilon of [0,.1,1-Number.EPSILON,1,1+Number.EPSILON,1.5])for(const N of [0,60,80])states.push(a.snapshot({epsilon,N}));
for(const omegaM of [.01,.3,1-Number.EPSILON,1])for(const w of [-1.5,-1,-2/3,-1/3,-.2])states.push(a.snapshot({mode:'late',omegaM,w,a:.5}));
for(const u0 of [4,15,20])for(const v0 of [-1,0,1])states.push(a.snapshot({mode:'field',u0,v0}));
let invalid=0;function bad(x){let yes=false;try{a.snapshot(x)}catch(e){yes=true}if(!yes)throw Error('accepted '+JSON.stringify(x));invalid++}
for(const x of [null,[],true,3,'x'])bad(x);
for(const [key,vs]of Object.entries({mode:['',null,'other'],epsilon:[-1,2,'',null,Infinity],N:[-1,81,'',null]}))for(const v of vs)bad({[key]:v});
for(const [mode,key,vs]of [['field','u0',[3,21,'',null]],['field','v0',[-2,2,'',null]],['late','omegaM',[0,2,'',null]],['late','w',[-2,0,'',null]],['late','a',[0,11,'',null]]])for(const v of vs)bad({mode,[key]:v});
console.log(JSON.stringify({states,ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),invalid,self:a.selfTest(),tiny:a.fmt(1e-30)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def close(x,y,label,rtol=3e-12,atol=3e-13):
 ck(x is not None and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def F(y):
 u,w=y;H=math.hypot(u,w)/math.sqrt(6)
 return [w/H,-3*w-u/H]
COEFF=[[],[1/4],[3/32,9/32],[1932/2197,-7200/2197,7296/2197],[439/216,-8,3680/513,-845/4104],[-8/27,2,-3544/2565,1859/4104,-11/40]]
B4=[25/216,0,1408/2565,2197/4104,-1/5,0];B5=[16/135,0,6656/12825,28561/56430,-9/50,2/55]
def advance(y,width):
 remaining=width;h=min(.02,width);attempts=0
 while remaining>0:
  h=min(h,remaining);ks=[]
  for cs in COEFF:
   z=[y[j]+sum(c*k[j]for c,k in zip(cs,ks))for j in range(2)]
   ks.append([h*v for v in F(z)])
  y4=[y[j]+sum(c*k[j]for c,k in zip(B4,ks))for j in range(2)]
  y5=[y[j]+sum(c*k[j]for c,k in zip(B5,ks))for j in range(2)]
  err=max(abs(v-w)/(1e-13+2e-12*max(abs(v),abs(old)))for v,w,old in zip(y5,y4,y))
  attempts+=1;assert attempts<100000,'independent oracle stalled'
  if err<=1:
   y=y5;remaining-=h
   if remaining<width*1e-15:remaining=0
  h*=5 if err==0 else min(5,max(.15,.9*err**-.2))
 return y
def epsilon_of(y):return 3*y[1]**2/(y[0]**2+y[1]**2)
def stage(r):
 h=r['h'];y=r['start']
 def f(y):
  u,v,l=y;e=v*v/2
  return [v,-3*v-6/u+v**3/2+v*v/u,-e]
 k1=f(y);y2=[v+h*k/2 for v,k in zip(y,k1)];k2=f(y2);y3=[v+h*k/2 for v,k in zip(y,k2)];k3=f(y3);y4=[v+h*k for v,k in zip(y,k3)];k4=f(y4)
 end=[y[j]+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6 for j in range(3)]
 for key,vs in [('k1',k1),('y2',y2),('k2',k2),('y3',y3),('k3',k3),('y4',y4),('k4',k4),('end',end)]:
  for v,w in zip(r[key],vs):close(v,w,'stage '+key,1e-11,2e-13)
 close(r['endN'],r['N']+h,'stage time',1e-14,1e-14)
def field(d,tables):
 s=d['config'];f=d['field'];nodes=d['nodes'];u0=s['u0'];v0=s['v0'];H0=u0/math.sqrt(6-v0*v0);y=[u0,v0*H0];lastN=0;before=None
 ck(f['status']=='exit','all supported field states exit');ck(len(nodes)==len(f['rows'])+1,'all accepted nodes')
 ck(len(tables['nodes']['rows'])==len(nodes)and len(tables['stages']['rows'])==len(f['rows']),'all node/stage ledger rows')
 for i,p in enumerate(nodes):
  if i==len(nodes)-1:before=(lastN,y[:])
  y=advance(y,p['N']-lastN);lastN=p['N'];u,w=y;H=math.hypot(u,w)/math.sqrt(6)
  for key,v in [('u',u),('v',w/H),('logH',math.log(H/H0))]:close(p[key],v,'physical momentum oracle '+key,1e-8,1e-6)
  e=p['v']**2/2;constraint=p['u']/u0*math.sqrt((3-v0*v0/2)/(3-e))
  for key,v in [('epsilon',e),('epsilonV',2/p['u']**2),('q',e-1),('w',2*e/3-1),('H',math.exp(p['logH'])),('HOverM',p['u']/math.sqrt(2*(3-e))),('logRadius',-p['N']-p['logH']),('radius',math.exp(-p['N']-p['logH'])),('constraintH',constraint),('constraintResidual',math.exp(2*p['logH'])/constraint**2-1)]:close(p[key],v,'field '+key,2e-12,1e-13 if key!='radius'else 0)
  if i<len(nodes)-1:ck(e<1,'no earlier exit')
  if i:
   r=f['rows'][i-1];ck(r['N']==nodes[i-1]['N']and r['endN']==p['N'],'row times')
   for v,z in zip(r['start'],[nodes[i-1]['u'],nodes[i-1]['v'],nodes[i-1]['logH']]):close(v,z,'row start')
   for v,z in zip(r['end'],[p['u'],p['v'],p['logH']]):close(v,z,'row end')
   stage(r)
 # Locate the physical-momentum oracle's own epsilon=1 crossing.
 n0,y0=before;lo=0;hi=.1
 ck(epsilon_of(y0)<1 and epsilon_of(advance(y0[:],hi))>1,'independent event bracket')
 for _ in range(38):
  mid=(lo+hi)/2
  if epsilon_of(advance(y0[:],mid))>=1:hi=mid
  else:lo=mid
 exactN=n0+(lo+hi)/2
 for p in d['convergence']:
  close(p['N'],exactN,'exit convergence bound',0,1e-6*(p['h']/.025)**4+2e-10)
  close(p['deltaN'],p['N']-d['convergence'][-1]['N'],'relative comparison',1e-14,1e-14)
 c=f['crossing'];ck(c['hi']>c['lo']and c['width']<=1e-11,'product bracket width')
 ck(c['lower'][1]**2/2<1<=c['upper'][1]**2/2,'product bracket straddles')
 stage(c['upperAttempt']);ck(c['upperAttempt']['end'][1]**2/2>=1,'original crossing')
 lo=0;hi=c['upperAttempt']['h']
 for i,t in enumerate(f['trials']):
  ck(t['i']==i and t['lo']==lo and t['hi']==hi and t['mid']==(lo+hi)/2,'event bisection history')
  stage(t['stage']);close(t['epsilon'],t['stage']['end'][1]**2/2,'event epsilon')
  if t['epsilon']>=1:hi=t['mid']
  else:lo=t['mid']
 ck(lo==c['lo']and hi==c['hi'],'final bisection matches')
 ck(len(tables['event']['rows'])==len(f['trials'])and len(tables['event-stages']['rows'])==len(f['trials']),'all event trials exposed')
 close(d['slowRollN'],(u0*u0-2)/4,'slow roll comparison')
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];tables={p['key']:p for p in ui['tables']};nodes=d['nodes']
 if mode=='field':field(d,tables)
 elif mode=='kinematic':
  e=s['epsilon']
  for p in nodes:
   N=p['N'];chi=N if e==1 else math.expm1((e-1)*N)/(e-1);time=N if e==0 else math.expm1(e*N)/e
   for k,v in [('q',e-1),('epsilon',e),('H',math.exp(-e*N)),('radius',math.exp((e-1)*N)),('expansion',math.exp(N)),('light',chi),('time',time),('curvatureRatio',math.exp(2*(e-1)*N)),('logH',-e*N),('logRadius',(e-1)*N)]:close(p[k],v,'kinematic '+k,3e-13,0)
  ck(nodes[0]['N']==0 and nodes[-1]['N']==80 and any(p['N']==s['N']for p in nodes),'geometric window/current')
 else:
  M=s['omegaM'];L=1-M;w=s['w']
  for p in nodes:
   a=p['a'];m=M/a**3;de=L*math.exp(-3*(1+w)*math.log(a));E2=m+de;om=m/E2;od=de/E2;q=.5*(om+(1+3*w)*od)
   for k,v in [('E2',E2),('E',math.sqrt(E2)),('omegaMatter',om),('omegaDE',od),('q',q),('epsilon',q+1),('radius',1/a/math.sqrt(E2)),('logRadius',-math.log10(a)-.5*math.log10(E2)),('densityM',m),('densityDE',de)]:close(p[k],v,'late '+k,3e-12,2e-13)
  for c in [d['cross'],d['equal']]:
   factor=1 if c['kind']=='equality'else -1-3*w
   if L==0 or factor<=0:ck(c['status']=='none'and c['a']is None,'no transition')
   else:
    logA=math.log(M/(factor*L))/(-3*w);close(c['logA'],logA,'transition log')
    close(c['a'],math.exp(logA),'transition scale',3e-12,0)
    ck(c['status']==('inside'if math.log(.01)<=logA<=math.log(10)else'outside'),'outside vs none')
    if c['status']=='inside':ck(any(p['a']==c['a']for p in nodes),'transition node')
 key='a'if mode=='late'else'N'
 ck(all(p[key]<q[key]for p,q in zip(nodes,nodes[1:])),'strict node order');ck(len(tables['nodes']['rows'])==len(nodes),'full node ledger')
 for q in ui['plots']:
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'nondegenerate frame')
  for series in q['series']:
   ck(len(series['points'])==len(nodes),'all curve nodes')
   for p,(x,y)in zip(nodes,series['points']):
    xx=math.log10(p['a'])if mode=='late'else p['N'];sk=series['key']
    expected=1 if sk=='one'else math.log1p(p['light'])/math.log(10)if sk=='logLight'else p[sk]/math.log(10)if sk in ['logRadius','logH']and mode!='late'else p[sk]
    close(x,xx,'plot x');close(y,expected,'plot y')
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point inside frame')
  for marker in q['markers']:ck(q['xmin']<=marker['x']<=q['xmax'],'marker within frame')
ck(data['invalid']>=35 and data['tiny']!='0','strict and tiny')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/cosmo-04-inflation-darkenergy.md').read_text();site=(ROOT/'physics-course/site/cosmo-04-inflation-darkenergy.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 for p in ROOT.glob('*/site/assets/learning/labs/physics-inflation-darkenergy.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'physics-course/images/cosmo-04-acceleration-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/cosmo-04-acceleration-ledgers.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};nested=svg.findall('.//s:svg',ns);ck(len(nested)==4,'four static panels')
 code="const a=require(process.argv[1]),k=a.snapshot(),f=a.snapshot({mode:'field'}),l=a.snapshot({mode:'late'});console.log(JSON.stringify([a.plots(k)[1],a.plots(f)[0],a.plots(f)[1],a.plots(l)[0]]))"
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for panel,q in zip(nested,plots):
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for series in q['series']:
   circles=panel.findall('.//s:circle[@data-series="'+series['key']+'"]',ns);ck(len(circles)==len(series['points']),'static all circles')
   poly=panel.find('.//s:polyline[@data-series="'+series['key']+'"]',ns);coords=[list(map(float,p.split(',')))for p in poly.get('points').split()];ck(len(coords)==len(circles),'static polyline count')
   for node,(u,v),(x,y)in zip(circles,coords,series['points']):
    close(float(node.get('cx')),xf(x),'static cx',2e-12,1e-12);close(float(node.get('cy')),yf(y),'static cy',2e-12,1e-12)
    close(u,xf(x),'static poly x',2e-12,1e-12);close(v,yf(y),'static poly y',2e-12,1e-12)
  markers=panel.findall('.//s:line[@data-marker]',ns);ck(len(markers)==len(q['markers']),'static markers')
  for node,m in zip(markers,q['markers']):close(float(node.get('x1')),xf(m['x']),'static marker x')
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'invalid':data['invalid'],'self':data['self']}))
