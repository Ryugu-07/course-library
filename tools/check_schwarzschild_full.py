"""Independent high-precision polynomial roots and AGM elliptic-integral checks."""
from pathlib import Path
from decimal import Decimal,localcontext
import subprocess,json,math,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/schwarzschild-orbits.js'
program=r"""
const a=require(process.argv[1]),d={time:[],photon:[],precession:[],strict:0,self:a.selfTest()};
for(const q of [0,1,6.25,11.99999999,12,12.00000001,16,42.25,100])for(const K of [-.12,-.06,-.0246875,-1e-12,0,1e-12,.01,.2])d.time.push(a.timelike({q,K}));
for(const q of [12.00000001,16,42.25,100])for(const level of ['stable','unstable'])d.time.push(a.timelike({q,level}));
d.time.push(a.timelike({q:12,level:'isco'}));
for(const q of [12,16,42.25])for(const o of a.circular(q))for(const offset of [0,1e-15,-1e-15]){const K=o.K+offset;if(K>=-.12&&K<=.2&&(K===0||Math.abs(K)>=1e-12))d.time.push(a.timelike({q,K}));}
for(const beta of [0,.1,.5,.99,.99999999,.9999999999999999,1,1.0000000000000002,1.00000001,1.01,1.2,2,4])d.photon.push(a.photon(beta));
for(const e of [0,.2,.5,.9])for(const gap of [.02,.1,1,10,100])d.precession.push(a.precession(6+2*e+gap,e));
for(const p of [1e4,1e8])for(const e of [0,.2,.9])d.precession.push(a.precession(p,e));
function bad(f){let yes=false;try{f()}catch(e){yes=true}if(!yes)throw Error('invalid input accepted');d.strict++;}
for(const v of [null,false,[],1,'x']){bad(()=>a.snapshot(v));bad(()=>a.timelike(v));}
for(const key of ['q','K','beta','p','e'])for(const v of [null,NaN,Infinity,'1'])bad(()=>a.snapshot({[key]:v}));
for(const [key,v]of [['q',-1],['q',101],['K',-.121],['K',.201],['K',1e-13],['beta',-1],['beta',4.1],['p',5.9],['p',1e8+1],['e',-.01],['e',.91],['mode','constructor'],['level','toString']])bad(()=>a.snapshot({[key]:v}));
bad(()=>a.timelike({q:11,level:'isco'}));bad(()=>a.timelike({q:12,level:'stable'}));bad(()=>a.timelike({q:11,level:'unstable'}));bad(()=>a.precession(7.8,.9));
for(const q of [null,'12',NaN,-1,101])bad(()=>a.circular(q));
for(const beta of [null,'1',NaN,-1,4.1])bad(()=>a.photon(beta));
for(const pair of [[null,.3],['10',.3],[10,null],[10,NaN]])bad(()=>a.precession(...pair));
if(a.ledgers)d.ui=[...d.time.map(s=>({...s,config:{...s.config,mode:'potential'}})),...d.photon.map(s=>({...s,config:{mode:'photon'}})),...d.precession.map(s=>({...s,config:{mode:'precession'}}))].map(s=>({s,tables:a.ledgers(s),plots:a.plots(s)}));
console.log(JSON.stringify(d));
"""
d=json.loads(subprocess.check_output(PREFIX+['node','-e',program,str(JS.resolve())],text=True))
checks=0
def ck(ok,msg):
 global checks
 checks+=1
 assert ok,msg
def close(got,want,msg,rel=2e-12,absolute=1e-15):
 want=float(want)
 ck(math.isfinite(got)and math.isclose(got,want,rel_tol=rel,abs_tol=absolute),f'{msg}: {got} != {want}')
def D(x):return Decimal.from_float(x)if isinstance(x,float)else Decimal(x)
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899')
def roots(fn,cuts):
 out=[]
 for left,right in zip(cuts,cuts[1:]):
  fl=fn(left);fr=fn(right)
  if fl*fr<0:
   for _ in range(260):
    mid=(left+right)/2;fm=fn(mid)
    if fm==0:left=right=mid;break
    if fl*fm>0:left=mid;fl=fm
    else:right=mid
   out.append((left+right)/2)
 return out
for s in d['time']:
 with localcontext()as ctx:
  ctx.prec=80;q=D(s['q']);K=D(s['config']['K']);half=D('0.5');cs=[]
  if q>=12:
   w=(1-12/q).sqrt();cs=[(1+w)/6]if q==12 else[(1+w)/6,(1-w)/6]
  ck(len(s['orbits'])==len(cs),'circular branch count')
  for got,u in zip(s['orbits'],cs):
   r=1/u;v=-u+q*u*u/2-q*u**3
   close(got['u'],u,'circular u');close(got['r'],r,'circular r')
   close(got['K'],v,'circular K');close(got['E'],(1+2*v).sqrt(),'circular E')
   close(got['second'],-2/r**3+3*q/r**4-12*q/r**5,'direct V second',rel=3e-7,absolute=1e-18)
   close(got['second']/(float(q)/got['r']**4),1-6/r,'radial/azimuthal frequency square ratio',rel=3e-7,absolute=1e-15)
  level=s['config']['level'];multiplicities=[]
  if level!='manual':
   u=cs[0]if level in['isco','unstable']else cs[1];K=-u+q*u*u/2-q*u**3
   expected=[u];multiplicities=[3 if level=='isco'else 2];other=half-2*u
   if level!='isco'and 0<other<half:expected.append(other);multiplicities.append(1)
   paired=sorted(zip(expected,multiplicities));expected=[x for x,m in paired];multiplicities=[m for x,m in paired]
  elif s['status']=='unresolved':
   ck(bool(cs)and min(abs(K-(-u+q*u*u/2-q*u**3))for u in cs)<D('2e-14'),'honest unresolved near critical')
   ck(not s['roots']and not s['allowed'],'no fabricated roots/allowed zones');expected=[]
  else:
   fn=lambda u:2*K+2*u-q*u*u+2*q*u**3
   expected=roots(fn,sorted([D(0),half]+cs));multiplicities=[1]*len(expected)
  ck(len(s['roots'])==len(expected),'complete exterior root count')
  for got,u,m in zip(s['roots'],expected,multiplicities):
   close(got['u'],u,'all turning u',rel=4e-9,absolute=3e-15);close(got['r'],1/u,'all turning r',rel=4e-9)
   ck(got['multiplicity']==m,'root multiplicity')
  fn=lambda u:2*K+2*u-q*u*u+2*q*u**3
  if s['status']=='resolved':
   cuts=sorted([D(0),half]+expected)
   allowed=[(x,y)for x,y in zip(cuts,cuts[1:])if fn((x+y)/2)>0]
   ck(len(s['allowed'])==len(allowed),'all allowed components')
   for got,(x,y)in zip(s['allowed'],allowed):
    close(got['uMin'],x,'allowed min',rel=4e-9);close(got['uMax'],y,'allowed max',rel=4e-9)
  for row in s['rows']:
   u=D(row['u']);v=-u+q*u*u/2-q*u**3
   close(row['potential'],v,'every potential',absolute=5e-15);close(row['newton'],-u+q*u*u/2,'every Newton',absolute=5e-15)
   close(row['K'],K,'every K');close(row['radialSquared'],fn(u),'every radial square',absolute=8e-15)
for s in d['photon']:
 with localcontext()as ctx:
  ctx.prec=80;beta=D(s['beta']);fn=lambda u:1-27*beta*beta*u*u*(1-2*u)
  expected=[]if beta<1 else[D(1)/3]if beta==1 else roots(fn,[D(0),D(1)/3,D('.5')])
  ck(len(expected)==len(s['roots']),'null root count')
  for got,u in zip(s['roots'],expected):
   close(got['u'],u,'null u',rel=1e-12);close(got['r'],1/u,'null r',rel=1e-12)
  for row in s['rows']:
   u=D(row['u']);close(row['radialSquared'],fn(u),'all null radial squares',absolute=5e-15)
   close(row['barrier'],1-fn(u),'all barriers',absolute=5e-15)
# Independent Gauss-Legendre nodes from the polynomial recurrence.
gauss=[]
for j in range(1,9):
 z=math.cos(math.pi*(j-.25)/8.5)
 for _ in range(20):
  p0,p1=1,z
  for n in range(2,9):p0,p1=p1,((2*n-1)*z*p1-(n-1)*p0)/n
  derivative=8*(z*p1-p0)/(z*z-1);dz=p1/derivative;z-=dz
  if abs(dz)<1e-16:break
 gauss.append((z,2/((1-z*z)*derivative*derivative)))
close(sum(w for z,w in gauss),2,'Gauss weights')
def independent_excess(p,e,chi):
 return math.expm1(-.5*math.log1p(-(6+2*e*math.cos(chi))/p))
# Positive-parameter complete elliptic K through the arithmetic-geometric mean.
for s in d['precession']:
 with localcontext()as ctx:
  ctx.prec=80;p=D(s['p']);e=D(s['e']);den=p-6+2*e;m=4*e/den;a=D(1);b=(1-m).sqrt()
  for _ in range(20):a,b=(a+b)/2,(a*b).sqrt()
  total=2*PI*(p/den).sqrt()/a;advance=total-2*PI;weak=6*PI/p
  close(s['advance'],advance,'AGM advance',rel=2e-11,absolute=1e-21)
  close(s['weak'],weak,'1PN advance',absolute=1e-22)
  close(s['higher'],advance-weak,'higher orders',rel=2e-11,absolute=1e-24)
  close(s['relativeWeakError'],(advance-weak)/advance,'stable relative correction',rel=2e-11,absolute=1e-24)
  close(s['K'],(1-e*e)*(4-p)/(2*p*(p-3-e*e)),'stable binding energy')
  close(s['q'],p*p/(p-3-e*e),'Darwin q');close(s['frequencyRatio'],total/(2*PI),'frequency ratio')
  ck(len(s['rows'])==1025 and len(s['secondCycle'])==1024,'full two periods')
  cumulative=0.;parts=[]
  for i,row in enumerate(s['rows']):
   chi=row['chi'];rho=1/(1+float(e)*math.cos(chi));alpha=(6+2*float(e)*math.cos(chi))/float(p)
   close(row['rOverP'],rho,'all radii');close(row['excess'],math.expm1(-.5*math.log1p(-alpha)),'all advance integrand',absolute=1e-23)
   close(row['x'],rho*math.cos(row['phi']),'all x');close(row['y'],rho*math.sin(row['phi']),'all y')
   close(row['r'],float(p)*rho,'dimensional radius')
   close(row['newtonX'],rho*math.cos(chi),'all Newton x');close(row['newtonY'],rho*math.sin(chi),'all Newton y')
   if i:
    left=s['rows'][i-1]['chi'];half=(chi-left)/2;mid=(chi+left)/2
    parts.append(half*math.fsum(w*independent_excess(float(p),float(e),mid+half*z)for z,w in gauss))
    cumulative=math.fsum(parts)
    for key,fraction in [('quarter1Excess',.25),('midpointExcess',.5),('quarter3Excess',.75)]:
     close(row[key],independent_excess(float(p),float(e),left+fraction*(chi-left)),'all internal quadrature evaluations',rel=3e-12,absolute=1e-23)
   else:ck(all(row[k]is None for k in ['quarter1Excess','midpointExcess','quarter3Excess']),'initial row no previous interval')
   close(row['advanceSoFar'],cumulative,'all partial phases independent Gauss',rel=4e-11,absolute=5e-14)
   close(row['phi'],chi+cumulative,'all total phases independent Gauss',rel=4e-11,absolute=5e-14)
  for row,first in zip(s['secondCycle'],s['rows'][1:]):
   expected_phi=first['phi']+2*math.pi+float(advance)
   close(row['phi'],expected_phi,'second cycle phase',rel=2e-11)
   close(row['chi'],first['chi']+2*math.pi,'second cycle chi')
   close(row['rOverP'],first['rOverP'],'second cycle radius')
   close(row['x'],first['rOverP']*math.cos(expected_phi),'second cycle x',absolute=2e-11)
   close(row['y'],first['rOverP']*math.sin(expected_phi),'second cycle y',absolute=2e-11)
  close(s['rows'][-1]['advanceSoFar'],advance,'Boole vs AGM',rel=2e-11,absolute=1e-21)
for item in d.get('ui',[]):
 s=item['s'];mode=s['config']['mode'];ts=item['tables'];ps=item['plots']
 ck(len(ts)==(4 if mode=='photon'else 5),'complete ledgers')
 for t in ts:ck(all(len(row)==len(t['headers'])for row in t['rows']),'rectangular ledger')
 ck(len(ps)==2,'two plots')
 for plot in ps:
  ck(plot['xmax']>plot['xmin']and plot['ymax']>plot['ymin'],'nondegenerate scale')
  for series in plot['series']:
   xs=series.get('xs',plot['xs']);ys=series['values'];ck(len(xs)==len(ys),'all x/y pairs')
   for x,y in zip(xs,ys):
    ck(plot['xmin']<=x<=plot['xmax']and plot['ymin']<=y<=plot['ymax'],'every plotted node fits')
 if mode=='precession':
  ck(ps[0]['equalAspect']and ps[0]['xmax']-ps[0]['xmin']==ps[0]['ymax']-ps[0]['ymin'],'equal physical axes')
  for row,value in zip(s['rows'],ps[1]['series'][1]['values']):
   close(value,(3*row['chi']+s['e']*math.sin(row['chi']))/s['p'],'local 1PN phase includes sine')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'physics-course/lectures/gr-02-einstein-schwarzschild.md').read_text()
 site=(ROOT/'physics-course/site/gr-02-einstein-schwarzschild.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'all source formulas preserved');ck(src.count('<details')==4,'four full answers')
 mirrors=list(ROOT.glob('*/site/assets/learning/labs/schwarzschild-orbits.js'));ck(len(mirrors)==4,'all four mirrors')
 for path in mirrors:ck(path.read_bytes()==JS.read_bytes(),'exact JS mirror')
 svg=ROOT/'physics-course/images/gr-02-effective-potential.svg'
 ck(svg.read_bytes()==(ROOT/'physics-course/site/assets/img/gr-02-effective-potential.svg').read_bytes(),'exact SVG mirror')
 root=ET.parse(svg).getroot();ns={'s':'http://www.w3.org/2000/svg'}
 ck(root.get('viewBox')=='0 0 1100 2050','static canvas')
 stat=json.loads(subprocess.check_output(PREFIX+['node','-e',"const a=require(process.argv[1]);console.log(JSON.stringify({b:a.timelike(),p:a.photon(1),o:a.precession(10,.3)}))",str(JS.resolve())],text=True))
 groups=[('bound-radial',[(r['u'],r['radialSquared'])for r in stat['b']['rows']],lambda x:135+870*x/.5,lambda y:435-240*(y+.09)/1.09),
 ('photon-radial',[(r['u'],r['radialSquared'])for r in stat['p']['rows']],lambda x:135+540*x/.5,lambda y:1295-235*(y+.08)/1.16)]
 o=stat['o'];span=1/(1-o['e'])*1.06
 for kind,rows,kx,ky in [('orbit-first',o['rows'],'x','y'),('orbit-second',[o['rows'][-1]]+o['secondCycle'],'x','y'),('orbit-newton',o['rows'],'newtonX','newtonY')]:
  groups.append((kind,[(r[kx],r[ky])for r in rows],lambda x:135+390*(x+span)/(2*span),lambda y:1900-390*(y+span)/(2*span)))
 for kind,points,xf,yf in groups:
  nodes=root.findall('.//s:circle[@data-kind="'+kind+'"]',ns);ck(len(nodes)==len(points),'static all '+kind)
  poly=root.find('.//s:polyline[@data-kind="'+kind+'-line"]',ns)
  coords=[list(map(float,t.split(',')))for t in poly.get('points').split()];ck(len(coords)==len(points),'static poly count')
  for node,point,(x,y)in zip(nodes,coords,points):
   close(float(node.get('cx')),xf(x),'static x',rel=1e-10);close(float(node.get('cy')),yf(y),'static y',rel=1e-10)
   close(point[0],xf(x),'static poly x',rel=1e-10);close(point[1],yf(y),'static poly y',rel=1e-10)
 print('Formula parity:',len(formulas))
print(json.dumps({'status':'PASS','checks':checks,'timelikeStates':len(d['time']),'nullStates':len(d['photon']),'precessionStates':len(d['precession']),'strict':d['strict'],'self':d['self']},ensure_ascii=False))
