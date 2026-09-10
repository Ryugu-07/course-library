"""Independent Gauss-Legendre FD integrals, exact rate/Saha algebra, all displayed nodes."""
from pathlib import Path
import math,json,subprocess,shutil,sys
from functools import lru_cache
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/freezeout-race.js'
code=r"""
const a=require(process.argv[1]),states=[];
for(const [m,n,C,x]of [[5,2,1,.5],[5,2,8,.5],[2,2,1,1],[2,2,2,1],[1,3,1,2],[-8,8,.0001,.01],[8,-8,10000,100],[2+1e-12,2,2,1],[2,2+1e-12,2,1],[0,0,.0001,.1],[1e-100,0,10000,1]])states.push(a.snapshot({m,n,C,x}));
for(const TD of [1,2,10])for(const T of [.01,.1,.511,TD])states.push(a.snapshot({mode:'bath',TD,T}));
for(const eta of [1e-11,6e-10,1e-8])for(const TeV of [.1,.3,13.6,20])states.push(a.snapshot({mode:'saha',eta,TeV}));
let invalid=0;function bad(x){let ok=false;try{a.snapshot(x)}catch(e){ok=true}if(!ok)throw Error('accepted '+JSON.stringify(x));invalid++;}
for(const x of [null,[],true,1,'x'])bad(x);
for(const [key,vs]of Object.entries({mode:['',null,'x'],m:[-9,9,'',null,Infinity],n:[-9,9,'',null],C:[0,1e-5,10001,'',null],x:[0,.001,101,'',null]}))for(const v of vs)bad({[key]:v});
for(const [mode,key,vs]of [['bath','TD',[0,.9,11,'',null]],['bath','T',[0,.001,3,'',null]],['saha','TeV',[0,.01,21,'',null]],['saha','eta',[0,1e-12,1e-7,'',null]]])for(const v of vs)bad({mode,[key]:v});
const points=[.01,.02,.05,.1,.5,1,2,10].map(T=>a.gas(T,true));
const hard=a.integrate(q=>Math.exp(q),{depth:0});
console.log(JSON.stringify({states,points,invalid,hard,self:a.selfTest(),ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),tiny:a.fmt(1e-30),inactive:a.config({mode:'saha',m:null,C:''})}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def close(x,y,label,rtol=3e-9,atol=3e-12):
 ck(x is not None and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def rule(n):
 out=[]
 for j in range(1,n+1):
  x=math.cos(math.pi*(j-.25)/(n+.5))
  for _ in range(30):
   p0,p1=1.,x
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*x*p1-(k-1)*p0)/k
   dp=n*(x*p1-p0)/(x*x-1);step=p1/dp;x-=step
   if abs(step)<2e-16:break
  out.append((x,2/((1-x*x)*dp*dp)))
 return out
RULES={n:rule(n)for n in [16,32]}
def gauss(f,lo,hi,depth=16):
 def at(n):return (hi-lo)/2*sum(w*f((lo+hi)/2+(hi-lo)/2*x)for x,w in RULES[n])
 a,b=at(16),at(32)
 if abs(a-b)<3e-13*abs(b)+1e-29*(hi-lo):return b
 assert depth>0,('oracle unconverged',lo,hi,a,b)
 mid=(lo+hi)/2;return gauss(f,lo,mid,depth-1)+gauss(f,mid,hi,depth-1)
def fermi(q,y,kind):
 E=math.sqrt(q*q+y*y)
 return (q*q*E if kind=='rho'else q**4/E)/(math.exp(E)+1)
@lru_cache(maxsize=2000)
def oracle(T):
 y=.51099895/T
 grid=[0,1,4,10,25,60,120]
 vals=[sum(gauss(lambda q:fermi(q,y,k),a,b)for a,b in zip(grid,grid[1:]))for k in ['rho','P']]
 r,p=vals;gr=2+60*r/math.pi**4;gs=2+45*(r+p/3)/math.pi**4
 return r,p,gr,gs
def panel_check(p,kind,q):
 ps=q['panels'];ck(ps[0]['a']==0 and ps[-1]['b']==80,'full integral interval')
 for i,v in enumerate(ps):
  if i:ck(v['a']==ps[i-1]['b'],'contiguous integration panels')
  a,b=v['a'],v['b'];h=b-a;vals=[fermi(a+j*h/4,p['y'],kind)for j in range(5)]
  for name,w in zip(['fa','fl','fm','fr','fb'],vals):close(v[name],w,'sample '+kind,3e-13,1e-30)
  coarse=h*(vals[0]+4*vals[2]+vals[4])/6;refined=h*(vals[0]+4*vals[1]+2*vals[2]+4*vals[3]+vals[4])/12
  close(v['coarse'],coarse,'coarse',2e-13,1e-28);close(v['refined'],refined,'refined',2e-13,1e-28)
  close(v['error'],abs(v['refined']-v['coarse'])/15,'embedded error',1e-13,1e-30)
  close(v['value'],v['refined']+(v['refined']-v['coarse'])/15,'Richardson',2e-13,1e-30)
  ck(v['converged']==(v['error']<=q['atol']*h/80+q['rtol']*abs(v['refined'])),'local error budget')
 close(q['value'],sum(v['value']for v in ps),'total panels',2e-14,1e-28)
 close(q['error'],sum(v['error']for v in ps),'total errors',2e-14,1e-30)
 ck(q['evaluations']==4*len(ps)+80,'evaluation count')
def gas_check(p,full=False):
 r,P,gr,gs=oracle(p['T'])
 for key,val in [('gr',gr),('gs',gs),('electronGr',gr-2),('electronGs',gs-2)]:close(p[key],val,'FD '+key)
 for kind,key,val in [('rho','rho',r),('P','pressure',P)]:
  q=p[key];close(q['value'],val,'independent FD '+kind)
  ck(q['status']=='finite'and q['value']>0,'positive converged integral')
  expected=math.exp(-80)*(80**3+3*80**2+6*80+6+(p['y']*(80**2+2*80+2)if kind=='rho'else 0))
  close(q['tail'],expected,'tail bound',2e-14,0)
  ck(q['tail']>=gauss(lambda x:fermi(x,p['y'],kind),80,120),'tail bound encloses tail to120')
  if full:panel_check(p,kind,q)
 eps=math.pi**2/15+2/math.pi**2*r;press=math.pi**2/45+2/(3*math.pi**2)*P
 close(p['epsilonT4'],eps,'energy');close(p['pressureT4'],press,'pressure');close(p['w'],press/eps,'equation of state')
 close(p['gs'],45/(2*math.pi**2)*(p['epsilonT4']+p['pressureT4']),'thermodynamic consistency',3e-14,1e-14)
 ck(2<=p['gs']<=5.5 and 2<=p['gr']<=5.5 and p['gs']<=p['gr']+1e-14,'degrees range')
def point(s,p,full=False):
 mode=s['mode']
 if mode=='rate':
  r=s['C']*p['x']**(s['m']-s['n'])
  close(p['ratio'],r,'power law',2e-13,0);close(p['logRatio'],math.log(s['C'])+(s['m']-s['n'])*math.log(p['x']),'log ratio',2e-13,1e-14)
  ck(p['side']==('反应较快'if p['logRatio']>0 else'反应较慢'if p['logRatio']<0 else'速率相等'),'diagnostic sign')
 elif mode=='bath':
  gas_check(p,full);gd=oracle(s['TD'])[3]
  ratio=(p['gs']/gd)**(1/3);a=s['TD']/p['T']/ratio
  close(p['ratio'],ratio,'temperature ratio');close(p['a'],a,'scale factor');close(p['Tnu'],p['T']*ratio,'neutrino temperature')
  close(p['entropyCheck'],1,'entropy conservation',1e-14,1e-14);close(p['nuComovingCheck'],1,'neutrino conservation',1e-14,1e-14)
 else:
  T=p['T'];logS=math.log((510998.95/(2*math.pi*T))**1.5/(s['eta']*2*1.2020569031595943/math.pi**2))-13.6/T
  S=math.exp(logS)
  # Solve by the opposite quadratic form when small S; high S uses neutral-root form.
  X=(math.sqrt(S*S+4*S)-S)/2 if S<1 else 2*S/(S+math.sqrt(S*S+4*S))
  neutral=1/(1+S/2+math.sqrt(S*S+4*S)/2)
  close(p['logS'],logS,'Saha logS',2e-13,1e-13);close(p['X'],X,'Saha root',3e-13,1e-28);close(p['neutral'],neutral,'neutral root',3e-13,1e-28)
  close(p['X']+p['neutral'],1,'composition sum',3e-15,1e-15)
  close(p['X']**2/p['neutral'],S,'mass action',3e-13,0)
  close(p['nGamma'],2*1.2020569031595943/math.pi**2*(T/1.973269804e-7)**3,'photon density',2e-14,0)
  close(p['nH'],s['eta']*p['nGamma'],'hydrogen nuclei',2e-14,0);close(p['kelvin'],T/8.617333262e-5,'Kelvin',2e-14,0)
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];nodes=d['nodes'];tables={t['key']:t for t in ui['tables']}
 key='x'if mode=='rate'else'T';current=s['x']if mode=='rate'else s['T']if mode=='bath'else s['TeV']
 ck(len(nodes)>=(181 if mode=='bath'else 401),'base grid');ck(any(p[key]==current for p in nodes),'current included')
 ck(all(p[key]<q[key]for p,q in zip(nodes,nodes[1:])),'strict increasing grid');ck(len(tables['nodes']['rows'])==len(nodes),'all nodes in ledger')
 for p in nodes:point(s,p)
 point(s,d['current'],True)
 if mode=='rate':
  c=d['cross'];delta=s['m']-s['n']
  if delta==0:ck(c['status']==('all'if s['C']==1 else'none')and c['x']is None,'flat crossing')
  else:
   u=-math.log(s['C'])/delta;close(c['logX'],u,'cross log',2e-14,1e-14)
   ck(c['status']==('inside'if math.log(.01)<=u<=math.log(100)else'outside'),'window vs existence')
   if c['status']=='inside':ck(any(p['x']==c['x']for p in nodes),'crossing included')
 elif mode=='bath':
  ck(all(p['gs']<=q['gs']+1e-12 for p,q in zip(nodes,nodes[1:])),'entropy degrees monotone')
  close(nodes[-1]['ratio'],1,'temperature equal at decoupling',2e-14,0)
  ck(len(tables['rho']['rows'])==len(d['current']['rho']['panels']),'all rho panels in table')
  ck(len(tables['pressure']['rows'])==len(d['current']['pressure']['panels']),'all P panels in table')
 for q in ui['plots']:
  ck(q['xmax']>q['xmin']and q['ymax']>q['ymin'],'nondegenerate axes')
  close(q['markers'][0]['x'],math.log10(current),'current marker',1e-14,1e-14)
  for series in q['series']:
   ck(len(series['points'])==len(nodes),'all plotted points')
   for p,(x,y)in zip(nodes,series['points']):
    close(x,math.log10(p[key]),'plot x',1e-14,1e-14)
    sk=series['key'];expected=p['logRatio']/math.log(10)if sk=='rate'else 0 if sk=='one'else(4/11)**(1/3)if sk=='ideal'else math.log10(p['neutral'])if sk=='neutral-log'else p[sk]
    close(y,expected,'plot y',1e-14,1e-14);ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],('point inside axes',s,q['key'],x,y,q['ymin'],q['ymax']))
for p in data['points']:gas_check(p,True)
ck(data['hard']['status']=='unresolved','depth failure explicit');ck(data['tiny']!='0','tiny positive formatting');ck(data['invalid']>=45,'strict rejection coverage')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/cosmo-02-thermal.md').read_text();site=(ROOT/'physics-course/site/cosmo-02-thermal.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 for p in ROOT.glob('*/site/assets/learning/labs/freezeout-race.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'physics-course/images/cosmo-02-thermal-history.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/cosmo-02-thermal-history.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};nested=svg.findall('.//s:svg',ns);ck(len(nested)==4,'four static panels')
 code="const a=require(process.argv[1]),r=a.snapshot(),b=a.snapshot({mode:'bath'}),s=a.snapshot({mode:'saha'});console.log(JSON.stringify([a.plots(r)[0],...a.plots(b),a.plots(s)[0]]))"
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
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'extraGas':len(data['points']),'invalid':data['invalid'],'self':data['self']}))
