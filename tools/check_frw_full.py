"""Independent Gauss-Legendre quadrature, analytic limits, full ledgers and plot nodes."""
from pathlib import Path
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/cosmological-horizons.js'
code=r"""
const a=require(process.argv[1]);
const mixes=[[0,1],[1,0],[0,0],[.0001,.2999],[.4,.6],[.000001,.999998],[.999998,.000001],[0,.000001],[.000001,0],[0,.999999]];
const states=[];
for(const [omegaR,omegaM]of mixes){
 for(const mode of ['background','distance'])states.push(a.snapshot({mode,omegaR,omegaM,a:.003,z:3}));
}
for(const emit of [.01,.25,1])for(const beta of [.1,1,1.000001,2,4])states.push(a.snapshot({mode:'photon',emit,beta}));
const points=[];for(const [omegaR,omegaM]of mixes){
 const s=a.config({omegaR,omegaM});for(const x of [.0001,.00013,.01,1,10])points.push({s,p:a.backgroundPoint(s,x,true)});
 for(const z of [0,1e-14,1e-8,.001,2,20])points.push({s,p:a.distances(s,z,true)});
}
let invalid=0;function bad(x){let ok=false;try{a.snapshot(x)}catch(e){ok=true}if(!ok)throw Error('accepted '+JSON.stringify(x));invalid++;}
for(const x of [null,[],true,1,'x'])bad(x);
for(const [key,vs]of Object.entries({mode:['',null,'x'],omegaR:[-1,2,1e-7,'',null],omegaM:[-1,2,1e-7,'',null],H0:[39,101,'',null],a:[0,.00001,11,'',null]}))for(const v of vs)bad({[key]:v});
bad({omegaR:.6,omegaM:.5});bad({omegaR:0,omegaM:.9999999});
for(const [mode,key,vs]of [['distance','z',[-1,21,'',null]],['photon','emit',[0,.001,2,'',null]],['photon','beta',[0,.01,5,'',null]]])for(const v of vs)bad({mode,[key]:v});
const hard=a.quadrature(x=>Math.exp(20*x),true,{depth:0}),nonfinite=a.quadrature(x=>NaN);
console.log(JSON.stringify({states,points,invalid,hard,nonfinite,self:a.selfTest(),ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)}))}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def close(x,y,label,rtol=3e-9,atol=3e-11):
 ck(x is not None and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def rule(n):
 out=[]
 for j in range(1,n+1):
  x=math.cos(math.pi*(j-.25)/(n+.5))
  for _ in range(30):
   p0,p1=1.,x
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*x*p1-(k-1)*p0)/k
   dp=n*(x*p1-p0)/(x*x-1);step=p1/dp;x-=step
   if abs(step)<2e-16:break
  w=2/((1-x*x)*dp*dp);out.append((x,w))
 return out
RULES={n:rule(n)for n in [16,32]}
def gauss(f,lo=0.,hi=1.,depth=18):
 def at(n):return (hi-lo)/2*sum(w*f((lo+hi)/2+(hi-lo)/2*x)for x,w in RULES[n])
 a,b=at(16),at(32)
 if abs(a-b)<2e-13*abs(b)+2e-15*(hi-lo):return b
 assert depth>0,('oracle unconverged',lo,hi,a,b)
 mid=(lo+hi)/2;return gauss(f,lo,mid,depth-1)+gauss(f,mid,hi,depth-1)
def E(s,a):return math.sqrt(s['omegaR']/a**4+s['omegaM']/a**3+s['omegaLambda'])
def oracle(s,x,kind):
 R,M,L=s['omegaR'],s['omegaM'],s['omegaLambda']
 if kind=='particle':
  if R+M==0:return None
  return gauss(lambda u:2/(x*u**3*E(s,x*u*u)))
 if kind=='age':
  if R+M==0:return None
  return gauss(lambda u:2/(u*E(s,x*u*u)))
 if kind=='event':
  if L==0:return None
  return gauss(lambda u:2*u/(x*E(s,x/(u*u))))
 if kind=='elapsed':
  return 0 if x==1 else gauss(lambda u:math.log(x)/E(s,math.exp(u*math.log(x))))
 if kind=='dc':return gauss(lambda u:x/E(s,1/(1+x*u)))if x else 0
 if kind=='lookback':return gauss(lambda u:x/((1+x*u)*E(s,1/(1+x*u))))if x else 0
def panels(s,x,key,q):
 ps=q['panels']
 if not ps:return
 ck(ps[0]['lo']==0 and ps[-1]['hi']==1,'panel full endpoints')
 for j,p in enumerate(ps):
  if j:ck(ps[j-1]['hi']==p['lo'],'no panel gap or overlap')
  lo,hi=p['lo'],p['hi'];h=hi-lo
  # Use the original FRW integrands, with independently reconstructed substitutions.
  def f(u):
   if key in ['particle','age']:
    if u==0:return 2*math.sqrt(x/s['omegaM'])if key=='particle'and s['omegaR']==0 else 0
    return 2/(x*u**3*E(s,x*u*u))if key=='particle'else 2/(u*E(s,x*u*u))
   if key=='event':
    if u==0:return 1/(x*math.sqrt(s['omegaLambda']))
    return 1/(x*E(s,x/u))
   if key=='elapsed':return math.log(x)/E(s,math.exp(u*math.log(x)))
   return x/E(s,1/(1+x*u))/(1+x*u if key=='lookback'else 1)
  vals=[f(lo+h*k/4)for k in range(5)]
  for k,v in zip(['fa','fl','fm','fr','fb'],vals):close(p[k],v,'panel integrand '+key,2e-12,2e-13)
  coarse=h*(vals[0]+4*vals[2]+vals[4])/6
  refined=h*(vals[0]+4*vals[1]+2*vals[2]+4*vals[3]+vals[4])/12
  close(p['coarse'],coarse,'coarse',2e-12,2e-13);close(p['refined'],refined,'refined',2e-12,2e-13)
  close(p['error'],abs(refined-coarse)/15,'embedded estimate',0,1e-12)
  close(p['value'],refined+(refined-coarse)/15,'Richardson',2e-12,2e-13)
  ck(p['converged']==(p['error']<=q['atol']*h+q['rtol']*abs(p['refined'])),'actual acceptance predicate')
 close(q['value'],sum(p['value']for p in ps),'panel total',2e-12,2e-13)
 close(q['error'],sum(p['error']for p in ps),'error total',2e-12,2e-13)
 ck(q['accepted']==len(ps)and q['evaluations']==4*len(ps)+1,'binary subdivision accounting')
def check_point(s,p,full=False):
 x=p.get('a',p.get('z'))
 for key,q in p['integrals'].items():
  expected=oracle(s,x,key)
  if expected is None:
   ck(q['status']==('undefined'if key=='age'else'divergent')and q['value']is None,'analytic status '+key)
  else:
   ck(q['status']=='finite','numerical convergence '+key)
   close(q['value'],expected,'independent Gauss '+key)
   if key in ['dc','lookback']and 0<x<1e-6:close(q['value'],expected,'tiny redshift relative',1e-12,0)
  if full:panels(s,x,key,q)
 if 'a'in p:
  r=s['omegaR']/x**4;m=s['omegaM']/x**3;l=s['omegaLambda'];total=r+m+l
  for k,v in [('E',math.sqrt(total)),('DH',1/math.sqrt(total)),('r',r/total),('m',m/total),('l',l/total),('q',(r+m/2-l)/total),('hdot',-2*r-1.5*m)]:close(p[k],v,'background '+k,2e-13,1e-14)
  for key in ['particle','event']:
   q=p['integrals'][key];ck(p[key]is None if q['status']!='finite'else p[key]==x*q['value'],'physical horizon mapping')
 else:
  dc=p['DC'];close(p['DA'],dc/(1+x),'DA');close(p['DL'],dc*(1+x),'DL');close(p['DL'],(1+x)**2*p['DA'],'duality')
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];curve=d['curve'];tables={t['key']:t for t in ui['tables']}
 ck(len(curve)>=(401 if mode=='background'else 301),'full grid')
 key='z'if mode=='distance'else'a';ck(all(a[key]<b[key]for a,b in zip(curve,curve[1:])),'strict grid order')
 ck(len(tables['curve']['rows'])==len(curve),'all rows exposed')
 if mode=='photon':
  ae,beta=s['emit'],s['beta'];arrival=ae*(1+beta/2)**2;turn=ae*((beta+2)/3)**2 if beta>1 else None
  close(d['arrival'],arrival,'arrival');ck(d['turn']==turn,'future turn only')
  ck(curve[0]['a']==ae and curve[-1]['a']==arrival and curve[-1]['D']==0,'photon endpoints')
  if turn is not None:ck(any(p['a']==turn for p in curve),'explicit turnaround node')
  for p in curve:
   a=p['a'];chi=(beta+2)*math.sqrt(ae)-2*math.sqrt(a);D=a*chi
   for k,v in [('chi',chi),('D',D),('DH',a**1.5),('tau',2*a**1.5/3),('velocity',D/a**1.5-1)]:close(p[k],v,'photon '+k,2e-12,3e-14)
  close(d['current']['velocity'],beta-1,'initial outside velocity')
 else:
  for p in curve:check_point(s,p)
  check_point(s,d['current'],True)
  close(d['scales']['Gpc'],299792.458/s['H0']/1000,'length conversion',2e-15,0)
  close(d['scales']['Gyr'],(648000/math.pi)*149597870.7*1e6/s['H0']/(365.25*86400*1e9),'time conversion',2e-15,0)
  if mode=='background'and s['omegaLambda']==0:ck(d['future'].startswith('物质'if s['omegaM']>0 else'辐射'),'future dominance')
 for p in ui['plots']:
  ck(p['xmax']>p['xmin']and p['ymax']>p['ymin'],'nondegenerate axes')
  expectedmark=math.log10(s['a'])if mode=='background'else s['z']if mode=='distance'else d['turn']
  ck(len(p['markers'])==(0 if expectedmark is None else 1),'current or turning marker')
  if expectedmark is not None:close(p['markers'][0]['x'],expectedmark,'marker coordinate',2e-13,1e-14)
  for series in p['series']:
   ck(len(series['points'])==len(curve),'every finite series includes all nodes')
   for i,(x,y)in enumerate(series['points']):
    row=curve[i];xx=row[key];yy=row[series['key']]
    if mode=='background':xx=math.log10(xx)
    if mode=='background'and series['key']in['DH','particle','event']:yy=math.log10(yy)
    close(x,xx,'plot x',2e-13,1e-14);close(y,yy,'plot y',2e-13,1e-14)
    ck(p['xmin']<=x<=p['xmax']and p['ymin']<=y<=p['ymax'],'point inside axes')
for q in data['points']:check_point(q['s'],q['p'],True)
ck(data['hard']['status']=='unresolved'and data['hard']['value']>0 and data['hard']['failed']==1,'depth cap is unresolved')
ck(data['nonfinite']['status']=='unresolved'and data['nonfinite']['value']is None,'numeric failure not divergence')
ck(data['invalid']>=40,'strict cases')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/cosmo-01-frw.md').read_text();site=(ROOT/'physics-course/site/cosmo-01-frw.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(src.count('<details class="exercise"')==4,'four complete answers')
 for p in ROOT.glob('*/site/assets/learning/labs/cosmological-horizons.js'):ck(p.read_bytes()==JS.read_bytes(),'JS exact mirror')
 image=ROOT/'physics-course/images/cosmo-01-frw-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/cosmo-01-frw-ledgers.svg').read_bytes(),'SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};nested=svg.findall('.//s:svg',ns);ck(len(nested)==4,'four static panels')
 code="const a=require(process.argv[1]),b=a.snapshot(),d=a.snapshot({mode:'distance'}),p=a.snapshot({mode:'photon'});console.log(JSON.stringify([a.plots(b)[0],a.plots(b)[1],a.plots(d)[1],a.plots(p)[0]]))"
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for panel,q in zip(nested,plots):
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  markers=panel.findall('.//s:line[@data-marker]',ns);ck(len(markers)==len(q['markers']),'static event markers')
  for node,m in zip(markers,q['markers']):
   close(float(node.get('x1')),xf(m['x']),'marker x1');close(float(node.get('x2')),xf(m['x']),'marker x2')
  for series in q['series']:
   nodes=panel.findall('.//s:circle[@data-series="'+series['key']+'"]',ns);ck(len(nodes)==len(series['points']),'all static nodes')
   poly=panel.find('.//s:polyline[@data-series="'+series['key']+'"]',ns);coords=[list(map(float,t.split(',')))for t in poly.get('points').split()];ck(len(coords)==len(nodes),'all polyline points')
   for node,(u,v),(x,y)in zip(nodes,coords,series['points']):
    close(float(node.get('cx')),xf(x),'SVG cx',2e-12,1e-12);close(float(node.get('cy')),yf(y),'SVG cy',2e-12,1e-12)
    close(u,xf(x),'poly x',2e-12,1e-12);close(v,yf(y),'poly y',2e-12,1e-12)
 print('formulas',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'extraPoints':len(data['points']),'invalid':data['invalid'],'self':data['self']}))
