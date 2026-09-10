"""Independent Gauss quadrature and algebra; all growth, transfer, power and RK stages."""
from pathlib import Path
import math,json,subprocess,shutil,sys
from functools import lru_cache
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-structure-growth.js'
code=r"""
const a=require(process.argv[1]),states=[];
for(const omegaM of [.01,.1,.3,.9,1])for(const scale of [.01,.5,10])states.push(a.snapshot({omegaM,a:scale}));
for(const kEq of [.0001,.01,.1])for(const k of [1e-8,.1,10])states.push(a.snapshot({mode:'transfer',k,kEq}));
for(const omegaM of [.01,.3,1])for(const ns of [.8,1.2])states.push(a.snapshot({mode:'power',omegaM,a:.5,ns,k:.05}));
let invalid=0;function bad(x){let ok=false;try{a.snapshot(x)}catch(e){ok=true}if(!ok)throw Error('accepted '+JSON.stringify(x));invalid++;}
for(const x of [null,[],true,1,'x'])bad(x);
for(const [key,vs]of Object.entries({mode:['',null,'x'],omegaM:[0,.001,1.01,'',null,Infinity],a:[0,.001,11,'',null]}))for(const v of vs)bad({[key]:v});
for(const [mode,key,vs]of [['transfer','k',[0,1e-9,11,'',null]],['transfer','kEq',[0,1e-5,.2,'',null]],['power','ns',[.7,1.3,'',null]]])for(const v of vs)bad({mode,[key]:v});
const points=[.01,.05,.2,.5,1,3,10].flatMap(x=>[.01,.2,.99,1-Number.EPSILON,1].map(omegaM=>({s:a.config({omegaM}),p:a.growth(a.config({omegaM}),x,true)})));
console.log(JSON.stringify({states,points,invalid,self:a.selfTest(),ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),boundary:[0,1e-14,1e-9,1,1e8].map(q=>[q,a.bbks(q)]),tiny:a.fmt(1e-30),hard:a.quadrature(x=>Math.exp(20*x),true,{depth:0})}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def close(x,y,label,rtol=2e-9,atol=2e-11):
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
def gauss(f,lo=0.,hi=1.,depth=22):
 def at(n):return (hi-lo)/2*sum(w*f((lo+hi)/2+(hi-lo)/2*x)for x,w in RULES[n])
 a,b=at(16),at(32)
 if abs(a-b)<2e-13*abs(b)+2e-14*(hi-lo):return b
 assert depth>0,('oracle unconverged',lo,hi,a,b)
 mid=(lo+hi)/2;return gauss(f,lo,mid,depth-1)+gauss(f,mid,hi,depth-1)
@lru_cache(maxsize=12000)
def oracle(M,a):
 L=1-M;omega=M/(M+L*a**3)
 # Hamilton at the evaluation epoch. Use v=w^4 (product uses v=u^2),
 # removing the fractional-power endpoint before applying Gauss rules.
 g=2.5*omega*gauss(lambda w:4*w**9/(omega+(1-omega)*w**12)**1.5)
 G=a*g;f=-1.5*omega+2.5*omega/g
 return g,G,f
def growth_point(s,p,full=False):
 M=s['omegaM'];a=p['a'];b=(1-M)/M*a**3;omega=1/(1+b);g,G,f=oracle(M,a)
 ck(p['status']=='finite','finite growth integral')
 for k,v in [('g',g),('G',G),('f',f),('V',G*f),('b',b),('omega',omega),('E',math.sqrt(M/a**3+1-M)),('dlnH',-1.5*omega)]:close(p[k],v,'growth '+k)
 if 'D'in p:
  close(p['D'],G/oracle(M,1)[1],'normalization')
  close(p['approxF'],omega**.55,'approx f',2e-14,1e-14);close(p['approxError'],omega**.55-p['f'],'approx error',2e-14,1e-14)
 if full:
  q=p['integral'];panels=q['panels'];ck(panels[0]['lo']==0 and panels[-1]['hi']==1,'integral domain')
  for i,v in enumerate(panels):
   if i:ck(v['lo']==panels[i-1]['hi'],'contiguous panels')
   lo,hi=v['lo'],v['hi'];h=hi-lo;vals=[2*(lo+j*h/4)**4/(1+b*(lo+j*h/4)**6)**1.5 for j in range(5)]
   for key,z in zip(['fa','fl','fm','fr','fb'],vals):close(v[key],z,'growth integrand',2e-13,1e-25)
   coarse=h*(vals[0]+4*vals[2]+vals[4])/6;refined=h*(vals[0]+4*vals[1]+2*vals[2]+4*vals[3]+vals[4])/12
   close(v['coarse'],coarse,'coarse',3e-13,1e-25);close(v['refined'],refined,'refined',3e-13,1e-25)
   close(v['error'],abs(v['refined']-v['coarse'])/15,'embedded error',1e-14,1e-30)
   close(v['value'],v['refined']+(v['refined']-v['coarse'])/15,'corrected value',1e-14,1e-30)
   ck(v['converged']==(v['error']<=q['atol']*h+q['rtol']*abs(v['refined'])),'budget')
  close(q['value'],sum(v['value']for v in panels),'panel sum',2e-14,1e-14);close(q['error'],sum(v['error']for v in panels),'error sum',2e-14,1e-20)
  ck(q['evaluations']==4*len(panels)+16 and q['accepted']==len(panels),'subdivision accounting')
def transfer(q):
 if q==0:return 1.
 return math.log1p(2.34*q)/(2.34*q)*math.exp(-.25*math.log(1+3.89*q+(16.1*q)**2+(5.46*q)**3+(6.71*q)**4))
def transfer_point(s,p):
 q=p['k']/s['kEq']/13.41;T=transfer(q)
 for k,v in [('ratio',p['k']/s['kEq']),('q',q),('T',T),('logT',math.log10(T)),('low',1-2.1425*q),('high',math.log(2.34*q)/(2.34*6.71*q*q))]:close(p[k],v,'transfer '+k,3e-13,1e-15)
 close(p['oneMinusT'],1-p['T'],'finite correction',2e-14,1e-16);ck(0<p['T']<=1,'transfer bounds')
def rk_check(s,q):
 a=s['a'];N=q['N'];h=math.log(a/.01)/N;rows=q['rows'];initial=oracle(s['omegaM'],.01)
 for v,z in zip(q['initial'],[initial[1],initial[1]*initial[2]]):close(v,z,'growing initial condition')
 prev=q['initial']
 def F(x,state):
  M=s['omegaM']*math.exp(-3*x);L=1-s['omegaM'];omega=M/(M+L)
  return [state[1],1.5*omega*state[0]-(2-1.5*omega)*state[1]]
 ck(q['steps']==(0 if a==.01 else N)and len(rows)==q['steps'],'actual step count')
 for i,p in enumerate(rows):
  ck(p['i']==i and p['start']==prev,'RK continuity')
  close(p['x'],math.log(.01)+i*h,'x step',2e-13,1e-13);close(p['h'],h,'step size',2e-13,1e-15)
  x=p['x'];z=p['start'];k1=F(x,z);y2=[v+h*k/2 for v,k in zip(z,k1)];k2=F(x+h/2,y2)
  y3=[v+h*k/2 for v,k in zip(z,k2)];k3=F(x+h/2,y3);y4=[v+h*k for v,k in zip(z,k3)];k4=F(x+h,y4)
  end=[z[j]+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6 for j in range(2)]
  for name,expected in [('k1',k1),('k2',k2),('k3',k3),('k4',k4),('y2',y2),('y3',y3),('y4',y4),('end',end)]:
   for v,w in zip(p[name],expected):close(v,w,'RK '+name,2e-12,2e-14)
  close(p['endA'],math.exp(x+h),'endpoint a',2e-13,1e-14);prev=p['end']
 close(q['G'],prev[0],'RK G',2e-14,1e-14);close(q['V'],prev[1],'RK V',2e-14,1e-14)
 exact=oracle(s['omegaM'],a)
 close(q['errorG'],q['G']-exact[1],'true G error',2e-7,2e-11);close(q['errorV'],q['V']-exact[1]*exact[2],'true V error',2e-7,2e-11)
 close(q['relativeG'],q['errorG']/exact[1],'relative error',2e-8,2e-11)
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];nodes=d['nodes'];key='a'if mode=='growth'else'k';tables={t['key']:t for t in ui['tables']}
 ck(len(nodes)>=401 and len(tables['nodes']['rows'])==len(nodes),'complete nodes')
 ck(all(p[key]<q[key]for p,q in zip(nodes,nodes[1:])),'strict order');ck(any(p[key]==s[key]for p in nodes),'current included')
 if mode=='growth':
  for p in nodes:growth_point(s,p)
  growth_point(s,d['current'],True)
  for q in d['integration']:rk_check(s,q);ck(len(tables['rk'+str(q['N'])]['rows'])==len(q['rows']),'all RK rows')
 else:
  for p in nodes:
   transfer_point(s,p)
   if mode=='power':
    D=oracle(s['omegaM'],s['a'])[1]/oracle(s['omegaM'],1)[1];star=transfer(.05/(13.41*s['kEq']));power=D*D*(p['k']/.05)**s['ns']*(p['T']/star)**2;delta=(p['k']/.05)**3*power
    close(p['power'],power,'power ratio',3e-9,1e-25);close(p['delta'],delta,'dimensionless power',3e-9,1e-25)
    close(p['logPower'],math.log10(power),'log power');close(p['logDelta'],math.log10(delta),'log delta')
  if mode=='power':growth_point(s,d['growth'],True)
 for q in ui['plots']:
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'axes')
  close(q['markers'][0]['x'],math.log10(s[key]),'marker',2e-14,1e-14)
  for series in q['series']:
   ck(len(series['points'])==len(nodes),'all plot nodes')
   sk=series['key']
   for p,(x,y)in zip(nodes,series['points']):
    close(x,math.log10(p[key]),'plot x',2e-14,1e-14)
    expected=1 if sk=='one'else math.log10(p['D'])if sk=='D'else math.log10(p['a'])if sk=='edsD'else math.log10(p['unfiltered'])if sk=='unfiltered'else p[sk]
    close(y,expected,'plot y',2e-14,1e-14);ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point inside frame')
for d in data['points']:growth_point(d['s'],d['p'],True)
for q,v in data['boundary']:close(v,transfer(q),'BBKS endpoints',3e-13,1e-18)
ck(data['tiny']!='0'and data['hard']['status']=='unresolved','explicit numerical limits')
ck(data['invalid']>=30,'strict invalid cases')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/cosmo-03-perturbations-structure.md').read_text();site=(ROOT/'physics-course/site/cosmo-03-perturbations-structure.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 for p in ROOT.glob('*/site/assets/learning/labs/physics-structure-growth.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'physics-course/images/cosmo-03-growth-ledgers.svg';ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/cosmo-03-growth-ledgers.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};nested=svg.findall('.//s:svg',ns);ck(len(nested)==4,'four static panels')
 code="const a=require(process.argv[1]),g=a.snapshot(),t=a.snapshot({mode:'transfer'});console.log(JSON.stringify([...a.plots(g),a.plots(t)[1]]))"
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
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'points':len(data['points']),'invalid':data['invalid'],'self':data['self']}))
