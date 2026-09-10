"""Independent matrix powers, generic RK tableau, complex-step tangents and all displayed data."""
from pathlib import Path
from fractions import Fraction
import math,cmath,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-symplectic-integrator.js'
states=[{}]
for method in ['verlet','midpoint','euler','rk4']:
 for h in [.001,.2,2,2.1,3]:states.append(dict(method=method,h=h,steps=32,q0=.7,p0=-.3))
for h in [math.nextafter(2,0),2,math.nextafter(2,math.inf)]:
 for p in [0,.1]:states.append(dict(h=h,p0=p,steps=128))
states.extend([dict(q0=0,p0=0),dict(h=3,omega=3,steps=2048),dict(omega=.25,h=.001,steps=1,q0=1e-8,p0=-1e-8),dict(method='rk4',h=math.sqrt(8),steps=16)])
for method in ['verlet','rk4','euler']:
 for q in [0,.01,.9,1,1.4,2]:states.append(dict(mode='doublewell',method=method,q0=q,h=.05,steps=128))
states.extend([dict(mode='doublewell',q0=2,p0=2,h=.2,steps=1024),dict(mode='doublewell',method='euler',q0=2,p0=-2,h=.2,steps=1024),dict(mode='doublewell',q0=1e-8,p0=0,h=.001,steps=1)])
for eps in [0,.5,.8]:
 for a in [.25,1,4]:states.append(dict(mode='geometry',epsilon=eps,stretch=a,h0=1))
states.append(dict(mode='geometry'))
code=r"""
const a=require(process.argv[1]),states=JSON.parse(process.argv[2]).map(a.snapshot);
let invalid=0;function bad(s){let ok=false;try{a.config(s)}catch(e){ok=true}if(!ok)throw Error('accepted invalid '+JSON.stringify(s));invalid++}
for(const s of [null,[],true,3,'x'])bad(s);for(const mode of ['',null,'bad'])bad({mode});
for(const method of ['',null,'bad'])bad({method});bad({mode:'doublewell',method:'midpoint'});
for(const [mode,fields]of Object.entries({harmonic:{h:[0,3.1],steps:[0,2049,1.5],omega:[.24,3.1],q0:[-3,3,1e-9,'1e-400'],p0:[-3,3,1e-9]},doublewell:{h:[0,.201],steps:[0,1025,1.5]},geometry:{h0:[.01,1.1],epsilon:[-.1,.9,'1e-400'],stretch:[.24,4.1]}}))
for(const [key,values]of Object.entries(fields))for(const v of [...values,'',null,true,[],NaN,Infinity])bad({mode,[key]:v});
const inactive=a.snapshot({mode:'geometry',method:null,h:null,steps:null,q0:null,p0:null,omega:null});
console.log(JSON.stringify({states,ui:states.map(d=>({plots:a.plots(d),tables:a.ledgers(d)})),invalid,self:a.selfTest(),inactive,tiny:a.fmt(1e-100)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),json.dumps(states)],text=True))
checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(a,b,m,rtol=5e-8,atol=3e-10):
 ck(a is not None and math.isfinite(a)and math.isfinite(b)and abs(a-b)<=atol+rtol*abs(b),(m,a,b))
def energy(s,u):return (u[1]*u[1]+s['omega']**2*u[0]**2)/2 if s['mode']=='harmonic'else u[1]*u[1]/2+u[0]**4/4-u[0]*u[0]/2
def grad(s,q):return s['omega']**2*q if s['mode']=='harmonic'else q**3-q
def curv(s,q):return s['omega']**2 if s['mode']=='harmonic'else 3*q*q-1
def method_step(s,u,h,method):
 q,p=u
 if method=='verlet':
  v=p-h*grad(s,q)/2;Q=q+h*v;return [Q,v-h*grad(s,Q)/2]
 if method=='euler':return [q+h*p,p-h*grad(s,q)]
 if method=='midpoint':
  d=1+(h*s['omega']/2)**2;Q=((1-(h*s['omega']/2)**2)*q+h*p)/d
  P=p-h*s['omega']**2*(q+Q)/2;return [Q,P]
 # Generic explicit Runge-Kutta tableau, independent of product's hand-written stages.
 stages=[];table=[[],[.5],[0,.5],[0,0,1]];weights=[1/6,1/3,1/3,1/6]
 for row in table:
  v=[u[j]+h*sum(a*k[j]for a,k in zip(row,stages))for j in range(2)]
  stages.append([v[1],-grad(s,v[0])])
 return [u[j]+h*sum(b*k[j]for b,k in zip(weights,stages))for j in range(2)]
def matrix(s,h,method):
 w=s['omega'];z=w*h
 if method=='verlet':return [1-z*z/2,h,-h*w*w*(1-z*z/4),1-z*z/2]
 if method=='euler':return [1,h,-h*w*w,1]
 if method=='midpoint':
  d=1+z*z/4;return [(1-z*z/4)/d,h/d,-h*w*w/d,(1-z*z/4)/d]
 a=1-z*z/2+z**4/24;b=z-z**3/6;return [a,b/w,-w*b,a]
def truth(s,t):
 c=math.cos(s['omega']*t);v=math.sin(s['omega']*t);w=s['omega']
 return [s['q0']*c+s['p0']/w*v,s['p0']*c-w*s['q0']*v]
def norm(u):return math.hypot(*u)
def tangent(s,u,h,method):
 out=[]
 for j in range(2):
  z=[complex(x)for x in u];z[j]+=1e-30j;v=method_step(s,z,h,method);out.append([x.imag/1e-30 for x in v])
 return [out[0][0],out[1][0],out[0][1],out[1][1]]
def stage_oracle(s,u,h,method):
 q,p=u
 if method=='verlet':
  ph=p-h*grad(s,q)/2;Q=q+h*ph
  return [[q,p,0,-grad(s,q)],[q,ph,ph,0],[Q,ph,0,-grad(s,Q)]]
 if method=='euler':return [[q,p,p,-grad(s,q)]]
 if method=='midpoint':
  Q,P=method_step(s,u,h,method);qm=(q+Q)/2;pm=(p+P)/2
  return [[qm,pm,pm,-grad(s,qm)]]
 out=[];ks=[]
 for row in [[],[.5],[0,.5],[0,0,1]]:
  v=[u[j]+h*sum(a*k[j]for a,k in zip(row,ks))for j in range(2)];k=[v[1],-grad(s,v[0])]
  ks.append(k);out.append(v+k)
 return out
def check_run(s,r,method=None,substeps=1,initial=None,exact_allowed=True):
 method=method or s['method'];h=r['h'];u=list(initial or [s['q0'],s['p0']]);H0=energy(s,u)
 close(r['initialEnergy'],H0,'initial energy')
 th=r['theory'];I0=None
 if s['mode']=='harmonic':
  gap=Fraction(4)-(Fraction(s['omega'])*Fraction(abs(h)))**2;gap8=Fraction(8)-(Fraction(s['omega'])*Fraction(abs(h)))**2
  ck(th['gapSign']==(1 if gap>0 else -1 if gap<0 else 0),'exact stability side')
  close(th['gap'],float(gap),'exact product gap',atol=0);close(th['gap8'],float(gap8),'RK stability gap',atol=0)
  M=matrix(s,h,method)
  for x,y in zip(th['matrix'],M):close(x,y,'one-step matrix',atol=1e-14)
  if method=='verlet':
   ck(th['status']==('power-bounded'if gap>0 else'Jordan-boundary'if gap==0 else'exponential-growth'),'Jordan classification')
   I0=(u[1]**2+s['omega']**2*float(gap)/4*u[0]**2)/2
  elif method=='midpoint':I0=H0
 if I0 is None:ck(r['initialInvariant']is None,'not a claimed quadratic invariant')
 else:close(r['initialInvariant'],I0,'initial quadratic invariant')
 by_step={};trace=r['trace'];maxerr=0;limit=1e100 if s['mode']=='harmonic'else 1e12
 ck(len(trace)==r['completedSteps']+1,'every completed macro step recorded')
 for i,v in enumerate(trace):
  ck(v['i']==i,'sequential trace');close(v['t'],i*h,'fixed step time',atol=0)
  for key,w in zip(['q','p'],u):close(v[key],w,'independent trajectory '+key,atol=2e-8)
  E=energy(s,u);maxerr=max(maxerr,abs(E-H0));close(v['energy'],E,'actual H',atol=1e-8)
  close(v['deltaEnergy'],E-H0,'absolute H change',atol=1e-8)
  if H0==0:ck(v['relativeEnergy']is None,'relative energy undefined')
  else:close(v['relativeEnergy'],(E-H0)/abs(H0),'relative H change',atol=2e-8)
  if s['mode']=='harmonic'and exact_allowed:
   ex=truth(s,i*h)
   for key,w in zip(['exactQ','exactP'],ex):close(v[key],w,'continuous trajectory')
   close(v['error'],math.hypot(u[0]-ex[0],(u[1]-ex[1])/s['omega']),'normalized phase error',atol=2e-8)
  else:ck(v['exactQ']is None and v['exactP']is None and v['error']is None,'no fake analytic solution')
  if I0 is not None:
   coefficient=th['invariantCoefficient'];I=(v['p']**2+coefficient*v['q']**2)/2
   # Outside stability the invariant is indefinite: cancellation is ill-conditioned.
   rounding=8e-15*(v['p']**2+abs(coefficient)*v['q']**2)+1e-12
   close(v['invariant'],I,'actual quadratic form',atol=rounding);close(v['deltaInvariant'],I-I0,'quadratic drift',atol=rounding)
  by_step[i]=[v['q'],v['p']]
  if i<r['completedSteps']:
   for _ in range(substeps):u=method_step(s,u,h/substeps,method)
 close(r['maxEnergyError'],maxerr,'maximum over ALL actual steps',atol=1e-8)
 ck(r['final']==trace[-1],'final is actual last step');close(r['time'],h*r['completedSteps'],'actual stop time',atol=0)
 ck(r['complete']==(r['completedSteps']==r['requestedSteps']),'honest completion')
 if not r['complete']:
  ck(r['stoppedAt']['step']==r['completedSteps']+1,'first uncompleted macro step')
  ck(r['time']!=r['requestedTime'],'no completed-time claim')
 for v in r['stages']:
  i=v['step'];prior=by_step[i-1];expected=tangent(s,prior,h,method)
  for key,y in zip(['q','p','dq','dp'],stage_oracle(s,prior,h,method)[v['stage']-1]):close(v[key],y,'actual integration stage '+key,atol=2e-8)
  for x,y in zip(v['J'],expected):close(x,y,'independent complex-step tangent',atol=2e-8)
  close(v['determinant'],expected[0]*expected[3]-expected[1]*expected[2],'local area factor',atol=2e-8)
  close(v['gradient'],grad(s,v['q']),'stage force',atol=1e-8);close(v['curvature'],curv(s,v['q']),'stage Hessian',atol=1e-8)
 if substeps==1:
  nstage={'verlet':3,'rk4':4,'euler':1,'midpoint':1}[method]
  ck(len(r['stages'])==r['completedSteps']*nstage,'every actual stage retained')
 return by_step
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];p=d['current'];tables={t['key']:t for t in ui['tables']}
 if s['mode']=='geometry':
  ck(len(p['points'])==257,'all circle sample points')
  for v in p['points']:
   q=v['q'];z=v['p'];h=s['h0']*(1+s['epsilon']*q);Q=q*math.cos(h)+z*math.sin(h);P=z*math.cos(h)-q*math.sin(h)
   close(v['Q'],Q,'noncanonical exact-flow point');close(v['P'],P,'noncanonical exact-flow point')
   close(v['energy'],.5,'circle energy');close(v['determinant'],1+s['h0']*s['epsilon']*z,'energy but not area')
   close(v['theoreticalDeterminant'],v['determinant'],'analytic determinant')
   close(v['energyError'],.5*(Q*Q+P*P-q*q-z*z),'actual roundoff energy residual')
   for j in range(2):
    zz=[complex(q),complex(z)];zz[j]+=1e-30j;hh=s['h0']*(1+s['epsilon']*zz[0])
    ww=[zz[0]*cmath.cos(hh)+zz[1]*cmath.sin(hh),zz[1]*cmath.cos(hh)-zz[0]*cmath.sin(hh)]
    close(v['J'][j],ww[0].imag/1e-30,'exact time derivative Q');close(v['J'][2+j],ww[1].imag/1e-30,'exact time derivative P')
  a=s['stretch'];close(p['determinant'],1,'4D volume');close(p['symplecticResidual'],math.sqrt(2*(a-1)**2+2*(1/a-1)**2),'4D residual')
  ck(tables['geometry']['rows']==[[v[k]for k in 'i angle q p h Q P energy energyError determinant theoreticalDeterminant symplecticResidual'.split()]+v['J']for v in p['points']],'all geometry table values')
  ck(tables['matrix4']['rows']==[[i]+[p['diag'][i]if i==j else 0 for j in range(4)]+v for i,v in enumerate(p['residual'])],'4D full matrix table')
 else:
  by=check_run(s,p)
  if p['complete']:
   back=d['backward'];check_run(s,back,initial=[p['final']['q'],p['final']['p']],exact_allowed=False)
   if back['complete']:close(back['returnError'],norm([back['final']['q']-s['q0'],back['final']['p']-s['p0']]),'same method negative h return')
   else:ck(back['returnError']is None,'unfinished return is not a full reversal error')
  else:ck(d['backward']is None,'no false full reversal')
  if d['reference']:
   check_run(s,d['reference']['coarse'],method='rk4',substeps=16);check_run(s,d['reference']['fine'],method='rk4',substeps=32)
  ck([v['N']for v in d['study']['rows']]==[8,16,32,64,128,256,512],'fixed-time refinement')
  for v in d['study']['rows']:
   close(v['h']*v['N'],d['study']['T'],'exact same final time')
   u=[s['q0'],s['p0']];done=True;limit=1e100 if s['mode']=='harmonic'else 1e12
   for _ in range(v['N']):
    try:
     nxt=method_step(s,u,v['h'],s['method'])
     if not all(math.isfinite(x)and abs(x)<=limit for x in nxt):done=False;break
     u=nxt
    except OverflowError:done=False;break
   ck(v['complete']==done,'independent finite computation limit')
   if done:
    close(v['q'],u[0],'all refinement endpoints q',atol=1e-8);close(v['p'],u[1],'all refinement endpoints p',atol=1e-8)
    ex=truth(s,d['study']['T'])if s['mode']=='harmonic'else [d['study']['reference']['q'],d['study']['reference']['p']]
    close(v['error'],norm([u[j]-ex[j]for j in range(2)]),'full-state refinement distance',atol=1e-8)
   else:ck(v['error']is None,'incomplete refinement not a final error')
  tracekeys='i t q p energy deltaEnergy relativeEnergy invariant deltaInvariant exactQ exactP error'.split()
  for key,source in [('trace',p),('reverse',d['backward']),('reference16',d['reference']['coarse']if d['reference']else None),('reference32',d['reference']['fine']if d['reference']else None)]:
   ck(tables[key]['rows']==[[v[k]for k in tracekeys]for v in source['trace']]if source else tables[key]['rows']==[],'every trajectory table '+key)
  ck(tables['stages']['rows']==[[v[k]for k in 'step stage name q p dq dp gradient curvature determinant'.split()]+v['J']for v in p['stages']],'every stage table')
  ck(tables['convergence']['rows']==[[v[k]for k in 'N h T complete actualTime q p error maxEnergyError order'.split()]for v in d['study']['rows']],'every convergence table')
 for j,q in enumerate(ui['plots']):
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'nondegenerate plot')
  if q['square']:close(q['xmax']-q['xmin'],q['ymax']-q['ymin'],'equal phase units',atol=0)
  for ser in q['series']:
   key=ser['key']
   if s['mode']=='geometry':
    if j==0:expected=[[v['q'],v['p']]if key=='input'else[v['Q'],v['P']]for v in p['points']]
    elif j==1:expected=[[v['angle']/math.pi,v['determinant']if key=='actual'else 1]for v in p['points']]
    else:expected=[[v['q']*(s['stretch']if key=='plane1'else 1/s['stretch']if key=='plane2'else 1),v['p']]for v in p['points']]
   elif j==0:
    scale=s['omega']if s['mode']=='harmonic'else 1
    if key=='actual':expected=[[v['q'],v['p']/scale]for v in p['trace']]
    elif s['mode']=='doublewell':expected=[[v['q'],v['p']]for v in d['reference']['fine']['trace']]
    else:
     expected=[]
     for i in range(257):
      u=truth(s,2*math.pi*i/(256*s['omega']))if i<256 else[s['q0'],s['p0']]
      expected.append([u[0],u[1]/scale])
   elif j==1:
    rows=d['reference']['fine']['trace']if key=='reference'else p['trace']
    expected=[[v['t'],v['deltaInvariant'if key=='invariant'else'deltaEnergy']]for v in rows]
   elif j==2:
    rows=d['reference']['fine']['trace']if key=='reference'else p['trace']
    expected=[[v['t'],v['error'if s['mode']=='harmonic'else'q']]for v in rows]
   else:expected=[[math.log2(v['N']),math.log1p(v['error'])/math.log(10)]for v in d['study']['rows']if v['error']is not None]
   ck(len(ser['points'])==len(expected),'all graph points')
   for (x,y),(a,b)in zip(ser['points'],expected):close(x,a,'graph x',atol=1e-12);close(y,b,'graph y',atol=1e-12)
   for x,y in ser['points']:ck(math.isfinite(x)and math.isfinite(y)and q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'every plotted point framed')
ck(data['invalid']>=95,'strict validation coverage');ck(data['tiny']!='0','small nonzero rendering')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 from html.parser import HTMLParser
 src=(ROOT/'physics-course/lectures/comp-02-dynamics-symplectic.md').read_text();site=(ROOT/'physics-course/site/comp-02-dynamics-symplectic.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(all('<'not in v for v in formulas),'math HTML ambiguity absent')
 ck(not re.search(r'<p>\s*<details|</details>\s*</p>',site),'no paragraph-wrapped disclosure')
 class Disclosure(HTMLParser):
  def __init__(self):super().__init__();self.stack=[];self.answers=0
  def handle_starttag(self,tag,attrs):
   if tag=='details':
    ck(not self.stack,'no nested disclosure');kind=dict(attrs).get('class')
    ck(kind in ['answer','page-toc'],'known disclosure');self.stack.append([kind,0]);self.answers+=kind=='answer'
   if tag=='summary':ck(bool(self.stack),'summary owned');self.stack[-1][1]+=1
  def handle_endtag(self,tag):
   if tag=='details':ck(bool(self.stack),'no orphan close');ck(self.stack.pop()[1]==1,'one summary')
 parser=Disclosure();parser.feed(re.search(r'<article[^>]*>(.*?)</article>',site,re.S).group(1))
 ck(parser.answers==4 and not parser.stack,'four balanced answers')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_symplectic_full.py')==1,'one CI invocation')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),('local target',target))
 for mirror in ['course-shared/labs/physics-symplectic-integrator.js','physics-course/site/assets/learning/labs/physics-symplectic-integrator.js']:ck((ROOT/mirror).read_bytes()==JS.read_bytes(),'tracked JS mirror')
 image=ROOT/'physics-course/images/comp-02-symplectic-ledgers.svg'
 ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/comp-02-symplectic-ledgers.svg').read_bytes(),'SVG mirror')
 table=re.search(r'data-learning-lab="physics-symplectic-integrator".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 q=data['states'][0]['current'];first=q['trace'][1];th=q['theory']
 refs=[first['q'],first['p'],first['energy'],first['relativeEnergy'],first['invariant'],th['determinant'],th['frequency'],q['time'],q['final']['error'],q['maxEnergyError'],data['states'][0]['backward']['returnError']]
 ck(len(vals)==len(refs)==11,'all static fallback values')
 for v,w in zip(vals,refs):close(v,w,'fallback',rtol=6e-9,atol=1e-18)
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};panels=svg.findall('.//s:svg',ns);ck(len(panels)==4,'four explanatory static panels')
 code="const a=require(process.argv[1]),v=a.snapshot({}),m=a.snapshot({method:'midpoint'}),b=a.snapshot({h:2,p0:.1,steps:32}),g=a.snapshot({mode:'geometry'});console.log(JSON.stringify([a.plots(v)[1],a.plots(m)[2],a.plots(b)[0],a.plots(g)[1]]))"
 qs=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for panel,q in zip(panels,qs):
  left,width=(325,250)if q['square']else(100,750)
  xf=lambda x:left+width*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for ss in q['series']:
   circles=panel.findall('.//s:circle[@data-series="'+ss['key']+'"]',ns);ck(len(circles)==len(ss['points']),'all static graph data')
   poly=panel.find('.//s:polyline[@data-series="'+ss['key']+'"]',ns)
   coords=[list(map(float,v.split(',')))for v in poly.get('points').split()]if poly is not None else [[float(v.get('cx')),float(v.get('cy'))]for v in circles]
   ck(len(coords)==len(circles),'all static line nodes')
   for node,(x,y),(a,b)in zip(circles,ss['points'],coords):
    close(float(node.get('cx')),xf(x),'static x');close(float(node.get('cy')),yf(y),'static y')
    close(a,xf(x),'static poly x');close(b,yf(y),'static poly y')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
