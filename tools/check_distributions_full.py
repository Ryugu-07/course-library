"""Independent Gauss quadrature, expanded test jets, signed pairings and all Simpson nodes."""
from pathlib import Path
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/weak-derivative.js'
code=r"""
const a=require(process.argv[1]),states=[];
for(const test of ['even','tilted','odd'])for(const c of [-1,0,1])states.push(a.snapshot({test,c,slope:1,corner:-.7,jump:1.3}));
for(const n of [16,256])for(const r of [.2,.8])states.push(a.snapshot({n,r,c:.37,m:-.41,slope:-2,corner:2,jump:-2}));
for(const test of ['even','odd'])for(const epsilon of [.0125,.1,.8])for(const c of [-1,0,1])states.push(a.snapshot({mode:'box',test,epsilon,c,m:.2,r:.2}));
for(const c of [-.5,0,.5])for(const a0 of [.2,1])states.push(a.snapshot({mode:'poisson',c,a:a0,A:2,B:-2,m:-.4,r:.8}));
states.push(a.snapshot(),a.snapshot({mode:'poisson'}));
let invalid=0;function bad(x){let yes=false;try{a.snapshot(x)}catch(e){yes=true}if(!yes)throw Error('accepted '+JSON.stringify(x));invalid++}
for(const x of [null,[],true,3,'x'])bad(x);
for(const [key,vs]of Object.entries({mode:['',null,'other'],test:['',null,'other'],c:[-2,2,'',null],m:[-2,2,'',true],r:[0,1,'',null],n:[15,17,257,NaN,'',null],slope:[-3,3,'',null],corner:[-3,3,'',null],jump:[-3,3,'',null]}))for(const v of vs)bad({[key]:v});
for(const [mode,key,vs]of [['box','epsilon',[0,1,'',null]],['poisson','a',[0,2,'',null]],['poisson','c',[-1,1]],['poisson','A',[-3,3,'',null]],['poisson','B',[-3,3,'',null]]])for(const v of vs)bad({mode,[key]:v});
console.log(JSON.stringify({states,ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),invalid,self:a.selfTest(),tiny:a.fmt(1e-30)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True));checks=0;max_oracle=0
def ck(ok,label):
 global checks
 assert ok,label;checks+=1
def close(x,y,label,rtol=3e-11,atol=3e-12):
 ck(x is not None and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(label,x,y))
def jet(s,x):
 z=(x-s['m'])/s['r'];q=1-z*z
 if q<=0:return (0.,0.,0.)
 b=math.exp(1-1/q)
 if b==0:return (0.,0.,0.)
 a=0 if s['test']=='odd'else 1;k=1 if s['test']=='odd'else .5 if s['test']=='tilted'else 0;p=a+k*z
 return b*p,b*(k*q*q-2*z*p)/(q*q*s['r']),b*((6*z**4-2)*p-4*k*z*q*q)/(q**4*s['r']**2)
def function(s,x,side):
 if s['mode']=='pairing':
  sign=-1 if side<s['c']else 1
  return s['slope']*x+s['corner']*sign*(x-s['c'])+s['jump']*(sign+1)/2,s['slope']+s['corner']*sign
 z=x-s['c'];a=s['a'];inside=s['c']-a<=side<s['c']+a
 u=-.5*(z*z+a*a)if inside else -a*abs(z)
 return u+s['A']*x+s['B'],-max(-a,min(a,z))+s['A'],1 if inside else 0
def values(s,x,side,e=None):
 f,g,h=jet(s,x)
 if s['mode']=='pairing':
  u,v=function(s,x,side);return [u*g,-v*f,u*h]
 if s['mode']=='poisson':
  u,v,rho=function(s,x,side);return [-u*h,rho*f]
 e=s['epsilon']if e is None else e
 return [f/(2*e),-g/(2*e)]if abs(side-s['c'])<e else[0.,0.]
def gauss_rule(n):
 out=[]
 for i in range(1,n+1):
  z=math.cos(math.pi*(i-.25)/(n+.5))
  for _ in range(30):
   p0,p1=1.,z
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*z*p1-(k-1)*p0)/k
   der=n*(z*p1-p0)/(z*z-1);dz=p1/der;z-=dz
   if abs(dz)<2e-16:break
  out.append((z,2/((1-z*z)*der*der)))
 return out
G16=gauss_rule(16);G32=gauss_rule(32)
def integral(fn,lo,hi,depth=0):
 mid=(lo+hi)/2;half=(hi-lo)/2
 def rule(G):return half*math.fsum(w*fn(mid+half*z)for z,w in G)
 a,b=rule(G16),rule(G32)
 if abs(a-b)<=1e-12*(hi-lo)+1e-11*abs(b):return b
 assert depth<22,('oracle exhausted',lo,hi,a,b)
 return integral(fn,lo,mid,depth+1)+integral(fn,mid,hi,depth+1)
def oracle(s,e=None):
 lo=s['m']-s['r'];hi=s['m']+s['r'];c=s['c']
 extras=[c]if s['mode']=='pairing'else[c-s['a'],c+s['a']]if s['mode']=='poisson'else[c-(s['epsilon']if e is None else e),c+(s['epsilon']if e is None else e)]
 bounds=sorted(set([lo,hi,*[x for x in extras if lo<x<hi]]));dim=3 if s['mode']=='pairing'else 2
 return [math.fsum(integral(lambda x:values(s,x,(a+b)/2,e)[j],a,b)for a,b in zip(bounds,bounds[1:]))for j in range(dim)]
def validate(s,p,keep,e=None):
 global max_oracle
 q=p['quadrature'];dims=3 if s['mode']=='pairing'else 2;tot=[0.]*dims;offset=0
 lo=s['m']-s['r'];hi=s['m']+s['r']
 ck(q['segments'][0]['lo']==lo and q['segments'][-1]['hi']==hi,'full compact support')
 ck(lo>-2 and hi<2,'test support strictly inside domain')
 for segment in q['segments']:
  a,b,h=segment['lo'],segment['hi'],segment['h'];ck(a<b and h>0,'positive segment');close(h,(b-a)/s['n'],'segment width')
  subtotal=[0.]*dims
  for i in range(s['n']+1):
   x=b if i==s['n']else a+h*i;w=1 if i in [0,s['n']]else 2 if i%2==0 else 4;vs=values(s,x,(a+b)/2,e);ts=[h*w*v/3 for v in vs]
   if keep:
    row=q['nodes'][offset];offset+=1
    ck(row['i']==i and row['segment']==segment['k']and row['w']==w,'complete indices and weights')
    close(row['x'],x,'node x');close(row['h'],h,'node h')
    for key,v in zip(['phi','dphi','ddphi'],jet(s,x)):close(row[key],v,'expanded test '+key,2e-10,2e-11)
    for v,y in zip(row['values'],vs):close(v,y,'integrand',2e-10,2e-10)
    for v,y in zip(row['terms'],ts):close(v,y,'weighted contribution',2e-10,2e-12)
   subtotal=[a+b for a,b in zip(subtotal,ts)]
  for v,y in zip(segment['total'],subtotal):close(v,y,'segment totals',2e-10,2e-10)
  tot=[a+b for a,b in zip(tot,subtotal)]
 if keep:ck(offset==len(q['nodes'])==q['count'],'all nodes retained')
 else:ck(q['nodes']==[],'comparison omits only node storage')
 for v,y in zip(q['sums'],tot):close(v,y,'whole sum',2e-10,2e-10)
 if s['mode']=='pairing':
  f,g,_=jet(s,s['c']);rhs=tot[1]-s['jump']*f;second=2*s['corner']*f-s['jump']*g
  expected={'phi':f,'dphi':g,'lhs':tot[0],'regular':tot[1],'jump':-s['jump']*f,'rhs':rhs,'residual':tot[0]-rhs,'omitted':tot[0]-tot[1],'secondLhs':tot[2],'secondRhs':second,'secondResidual':tot[2]-second}
 elif s['mode']=='box':
  f,g,_=jet(s,s['c']);e=p['epsilon']
  expected={'action':tot[0],'delta':f,'error':tot[0]-f,'prime':tot[1],'deltaPrime':-g,'primeError':tot[1]+g,'primeBoundary':-(jet(s,s['c']+e)[0]-jet(s,s['c']-e)[0])/(2*e),'H_L1':e/2,'H_L2':math.sqrt(e/6),'H_Linf':.5,'delta_L1':1,'delta_L2':1/math.sqrt(2*e),'delta_Linf':1/(2*e)}
 else:
  expected={'lhs':tot[0],'rhs':tot[1],'residual':tot[0]-tot[1],'mass':2*s['a'],'leftSlope':s['a']+s['A'],'rightSlope':-s['a']+s['A']}
  for t in p['interfaces']:
   for side,sg in [('left',-1),('right',1)]:
    for key,v in zip(['u','v','f'],function(s,t['x'],t['x']+sg*s['a']/2)):close(t[side][key],v,'interface '+key)
   close(t['left']['u'],t['right']['u'],'continuous u');close(t['left']['v'],t['right']['v'],'continuous derivative')
 for key,v in expected.items():close(p[key],v,'derived '+key,2e-10,3e-10)
 if keep and s['n']>=128:
  ref=oracle(s,e)
  for v,w in zip(q['sums'],ref):
   max_oracle=max(max_oracle,abs(v-w));close(v,w,'independent adaptive Gauss',2e-8,2e-7)
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];validate(s,d['current'],True)
 for p in d['convergence']:validate(dict(s,n=p.get('n',s['n'])),p,False,p.get('epsilon'))
 tables={p['key']:p for p in ui['tables']}
 ck(len(tables['nodes']['rows'])==len(d['current']['quadrature']['nodes']),'all nodes exposed')
 for row,n in zip(tables['nodes']['rows'],d['current']['quadrature']['nodes']):
  ck(row==[n['segment'],n['i'],n['x'],n['h'],n['w'],n['phi'],n['dphi'],n['ddphi'],*n['values'],*n['terms']],'ledger exact nodes')
 for q in ui['plots']:
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'positive frame')
  for ss in q['series']:
   key=ss['key'];pts=ss['points'];ck(all(a[0]<b[0]for a,b in zip(pts,pts[1:])),'strict plot order')
   for x,y in pts:
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point in frame')
    if key=='phi':v=jet(s,x)[0]
    elif s['mode']=='pairing':
     if key in ['delta','second']:
      f,g,_=jet(dict(s,m=x),s['c']);v=s['jump']*f if key=='delta'else 2*s['corner']*f-s['jump']*g
     else:v=function(s,x,s['c']+(-1 if key.endswith('left')else 1))[0 if key.startswith('u')else 1]
    elif s['mode']=='box':
     if key.startswith('H-'):v=0 if key=='H-left'else 1
     elif key=='He':v=max(0,min(1,(x-s['c']+s['epsilon'])/(2*s['epsilon'])))
     else:
      point=min(d['convergence'],key=lambda p:abs(math.log10(p['epsilon'])-x));close(x,math.log10(point['epsilon']),'box log x')
      v=point['action']if key=='box'else point['delta']
    else:
     if key in ['u','v']:v=function(s,x,x)[0 if key=='u'else 1]
     elif key=='affine':v=s['A']*x+s['B']
     else:v=1 if key=='f-inner'else 0
    close(y,v,'plot model '+key,2e-10,2e-11)
   if key in ['u-left','v-left','H-left','f-left','f-inner']:ck(ss.get('endOpen')is True,'open left-branch endpoint')
  for m in q['markers']:ck(q['xmin']<=m['x']<=q['xmax'],'marker inside')
ck(data['invalid']>=55 and data['tiny']!='0','strict and small')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'grad-math/lectures/pde2-01-distributions.md').read_text();site=(ROOT/'grad-math/site/pde2-01-distributions.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all formulas preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 for p in ROOT.glob('*/site/assets/learning/labs/weak-derivative.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'grad-math/images/pde2-01-distribution-pairings.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/pde2-01-distribution-pairings.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};nested=svg.findall('.//s:svg',ns);ck(len(nested)==4,'four static panels')
 code="const a=require(process.argv[1]),k=a.snapshot(),b=a.snapshot({test:'odd'}),e=a.snapshot({mode:'box'}),f=a.snapshot({mode:'poisson'});console.log(JSON.stringify([a.plots(k)[0],a.plots(b)[1],a.plots(e)[0],a.plots(f)[0]]))"
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
print(json.dumps({'status':'PASS','checks':checks,'states':len(data['states']),'invalid':data['invalid'],'self':data['self'],'maxIndependentGaussDifference':max_oracle}))
