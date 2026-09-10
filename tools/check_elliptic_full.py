"""Independent elliptic spectra, quadrature, assembled solves and every displayed node."""
from pathlib import Path
from fractions import Fraction
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/elliptic-coercivity.js'
states=[{}]
for mu in [-16,-9,-4,-1,-1.2,0,4,math.nextafter(-1,-math.inf),math.nextafter(-1,0)]:
 for N in [1,5,32]:states.append(dict(mu=mu,N=N,M=64))
for j in range(1,5):
 for N in [1,j,32]:states.append(dict(mu=-j*j,N=N,zeroAt=j,kernel=-2))
states.extend([dict(F=0,tau=0),dict(F=1e-100,tau=-1e-100,M=512),dict(F=-2,tau=2,mu=-15,N=32,M=512)])
for K in [2,8,64]:
 for grading in [1,2.5,4]:states.append(dict(mode='fem',K=K,grading=grading))
for ratio in [.5,2/3,1,1.5,1.75,math.nextafter(1,0),math.nextafter(1,math.inf)]:
 for rho in [1e-6,.01,1]:states.append(dict(mode='corner',angleRatio=ratio,rho=rho))
code=r"""
const a=require(process.argv[1]),states=JSON.parse(process.argv[2]).map(a.snapshot);
let invalid=0;function bad(s){let ok=false;try{a.snapshot(s)}catch(e){ok=true}if(!ok)throw Error('accepted invalid '+JSON.stringify(s));invalid++}
for(const s of [null,[],true,3,'x'])bad(s);
for(const mode of ['','oops',null])bad({mode});
for(const [mode,fields]of Object.entries({spectral:{mu:[-17,5],N:[0,33,1.5],M:[63,513,100.5],F:[-3,3,1e-101],tau:[-3,3,-1e-101],zeroAt:[-1,5,1.5],kernel:[-3,3,1e-101]},fem:{K:[1,65,3.5],grading:[0,5]},corner:{angleRatio:[.49,1.76],rho:[0,1.1]}}))
for(const [key,values]of Object.entries(fields))for(const v of [...values,'',null,true,[],NaN,Infinity])bad({mode,[key]:v});
const inactive=a.snapshot({mode:'corner',mu:null,N:null,M:null,F:null,K:null,grading:null});
console.log(JSON.stringify({states,ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),invalid,self:a.selfTest(),inactive,tiny:a.fmt(1e-100)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),json.dumps(states)],text=True))
checks=0
def ck(ok,msg):
 global checks
 assert ok,msg;checks+=1
def close(x,y,msg,rtol=4e-11,atol=2e-13):
 ck(x is not None and math.isfinite(x)and abs(x-y)<=atol+rtol*abs(y),(msg,x,y))
def gauss_rule(n):
 out=[]
 for i in range(1,n+1):
  z=math.cos(math.pi*(i-.25)/(n+.5))
  for _ in range(40):
   p0,p1=1.,z
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*z*p1-(k-1)*p0)/k
   der=n*(z*p1-p0)/(z*z-1);step=p1/der;z-=step
   if abs(step)<2e-16:break
  out.append((z,2/((1-z*z)*der*der)))
 return out
G=gauss_rule(32)
def integrate(fn,a,b):
 mid=(a+b)/2;h=(b-a)/2
 return h*math.fsum(w*fn(mid+h*x)for x,w in G)

def force(s,k):return 0 if k==s['zeroAt']else s['F']if k==1 else s['tau']*(-1 if k%2==0 else 1)/(k*k)
def spectrum(s,N):
 roots=[k for k in range(1,5)if Fraction(k*k)+Fraction(s['mu'])==0]
 status=lambda rs:'unique'if not rs else 'multiple'if all(force(s,k)==0 for k in rs)else'no-solution'
 fs,ns=status(roots),status([k for k in roots if k<=N])
 rows=[]
 for k in range(1,s['M']+1):
  gap=float(Fraction(k*k)+Fraction(s['mu']));den=math.pi**2*gap;f=force(s,k)
  full=None if fs=='no-solution'else s['kernel']if k in roots else f/den
  finite=None if ns=='no-solution'else 0 if k>N else s['kernel']if k in roots else f/den
  rows.append(dict(k=k,gap=gap,d=den,f=f,full=full,finite=finite))
 return fs,ns,roots,rows
def check_spectrum(p,s):
 fs,ns,roots,rows=spectrum(s,p['N'])
 ck(p['fullStatus']==fs and p['finiteStatus']==ns,'independent Fredholm classification')
 ck(p['roots']==roots,'all roots')
 for actual,r in zip(p['rows'],rows):
  for k,v in r.items():
   if v is None:ck(actual[k]is None,'undefined coefficient')
   else:close(actual[k],v,'spectral '+k,atol=0)
 full=fs!='no-solution';finite=ns!='no-solution'
 contributions={k:[]for k in ['residual','h1Error','l2Error','energyError','fullH1','fullL2','fullEnergy']}
 for r in rows:
  k=r['k'];lam=math.pi**2*k*k
  if finite:contributions['residual'].append((r['d']*r['finite']-r['f'])**2)
  if full:
   e=r['full']-r['finite']
   for key,v in [('h1Error',lam*e*e),('l2Error',e*e),('energyError',r['d']*e*e),('fullH1',lam*r['full']**2),('fullL2',r['full']**2),('fullEnergy',r['d']*r['full']**2)]:contributions[key].append(v)
 for key,values in contributions.items():
  if (finite if key=='residual'else full):
   total=math.fsum(values);b=p[key];close(b['partial'],total,'independent norm sum '+key,atol=0)
   tail=p['tail'][{'h1Error':'h1','l2Error':'l2','energyError':'energy','fullH1':'h1','fullL2':'l2','fullEnergy':'energy','residual':'residual'}[key]]
   for end in ['lower','upper']:
    val=total+tail[end];val=val if 'Energy'in key or key=='energyError'else math.sqrt(val)
    close(b[end],val,'bounded '+key,atol=0)
  else:ck(p[key]is None,'undefined full quantity')
 ratios=[abs(float(Fraction(k*k)+Fraction(s['mu']))/(k*k))for k in range(1,65)]
 margin=min(1,*ratios);close(p['minimumRelativeMargin'],margin,'inverse margin',atol=0)
 if roots:ck(p['inverseH1Norm']is None,'noninvertible')
 else:close(p['inverseH1Norm'],1/margin,'inverse norm',atol=0)
 close(p['alpha'],min(1,1+s['mu']),'coercivity');close(p['beta'],max(1,abs(1+s['mu'])),'bounded form')
 return rows
def cref(ratio,rho):
 a=Fraction(ratio);nu=float(1/a);delta=float((1-a)/a);theta=math.pi*ratio
 # Integrate in t=-log r: positive kernels, no cancelling powers at ν=1.
 T=-math.log(rho)
 radial=integrate(lambda t:math.exp(-2*delta*t),0,T)
 return dict(delta=delta,nu=nu,radial=radial,coefficient=2*theta*nu**2*delta**2,
  hessian=2*theta*nu**2*delta**2*radial,
  gradient=theta*nu**2*integrate(lambda t:math.exp(-2*nu*t),0,T),
  l2=theta/2*integrate(lambda t:math.exp(-(2*nu+2)*t),0,T),
  classification='diverges'if a>1 else'linear'if a==1 else'finite')
def compare_corner(v,ratio):
 ref=cref(ratio,v['rho'])
 for k,x in ref.items():
  if isinstance(x,str):ck(v[k]==x,'corner classification')
  else:close(v[k],x,'independent corner '+k,rtol=2e-9,atol=0)
def compare_fem(v,g):
 K=v['K'];xs=[(i/K)**g for i in range(K)]+[1];hs=[b-a for a,b in zip(xs,xs[1:])]
 h1=math.fsum(h**3/12 for h in hs);l2=math.fsum(h**5/120 for h in hs)
 close(v['h1Error2'],h1,'Galerkin interpolation gradient',atol=0)
 close(v['l2Error2'],l2,'Galerkin interpolation L2',rtol=2e-9,atol=0)
 close(v['interpolationH1Error2'],h1,'interpolation sum',atol=0)
 close(v['interpolationL2Error2'],l2,'interpolation sum L2',atol=0)
 close(v['energyGap'],h1/2,'variational energy',atol=2e-15)
 for i,node in enumerate(v['nodes']):
  close(node['x'],xs[i],'mesh');close(node['value'],xs[i]*(1-xs[i])/2,'independent nodal oracle',atol=1e-16)
 for e in v['elements']:
  a,b=e['a'],e['b'];slope=(e['right']-e['left'])/(b-a)
  close(e['gradError'],integrate(lambda x:(.5-x-slope)**2,a,b),'actual gradient quadrature',atol=1e-25)
  close(e['l2Error'],integrate(lambda x:(x*(1-x)/2-e['left']-slope*(x-a))**2,a,b),'actual L2 quadrature',rtol=2e-7,atol=1e-38)
 for row in v['forward']:
  i=row['i'];hL,hR=hs[i-1:i+1]
  close(row['diagonal'],1/hL+1/hR,'assembled diagonal')
  close(row['rhs'],(hL+hR)/2,'assembled load')
  close(row['lower'],0 if i==1 else -1/hL,'lower')
  close(row['upper'],0 if i==K-1 else -1/hR,'upper')
  ck(row['pivot']>0,'positive pivot')
 for row in v['backward']:close(row['value'],xs[row['i']]*(1-xs[row['i']])/2,'backward solve',atol=1e-16)
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];p=d['current'];tables={t['key']:t for t in ui['tables']}
 if mode=='spectral':
  rows=check_spectrum(p,s)
  for v in d['nodes']:check_spectrum(v,s)
  M=s['M'];R=M+1024;amp=s['tau']**2;mu=s['mu']
  for key,power,dp,scale in [('residual',4,0,1),('h1',6,2,1/math.pi**2),('l2',8,2,1/math.pi**4),('energy',6,1,1/math.pi**2)]:
   partial=amp*scale*math.fsum(k**(-power)*(1+mu/k**2)**(-dp)for k in range(M+1,R+1))
   lo=partial+amp*scale/(max(1,1+mu/(R+1)**2)**dp*(power-1)*(R+1)**(power-1))
   hi=partial+amp*scale/(min(1,1+mu/(R+1)**2)**dp*(power-1)*R**(power-1))
   ck(p['tail'][key]['lower']<=lo*(1+1e-12) and p['tail'][key]['upper']>=hi*(1-1e-12),'independent infinite tail enclosure '+key)
  for v in d['profile']:
   x=v['x']
   for key,ok in [('full',p['fullOK']),('finite',p['finiteOK'])]:
    if not ok:ck(v[key]is None,'no false profile')
    else:
     expected=0 if x in [0,1]else math.fsum(r[key]*math.sqrt(2)*math.sin(r['k']*math.pi*x)for r in rows)
     close(v[key],expected,'all spectral profile nodes',atol=2e-14*max(1,max(abs(r[key])for r in rows)))
  row=lambda v:[v['N'],v['fullStatus'],v['finiteStatus'],v['finiteResidual'],*(v[k][end]if v[k]else None for k in ['residual','h1Error','energyError']for end in ['lower','upper'])]
  ck(tables['modes']['rows']==[[v[k]for k in ['k','lambda','gap','d','f','included','resonant','full','finite','residual','error','h1Error2','l2Error2','energyError']]for v in p['rows']],'all mode ledger')
  ck(tables['profile']['rows']==[[v['x'],v['full'],v['finite']]for v in d['profile']],'all profile ledger')
 elif mode=='fem':
  for v in [p,*d['nodes']]:compare_fem(v,s['grading'])
  for v in d['profile']:
   ns=p['nodes'];i=next((i for i in range(len(ns)-1)if v['x']<=ns[i+1]['x']),len(ns)-2);a,b=ns[i:i+2]
   expected=a['value']+(b['value']-a['value'])*(v['x']-a['x'])/(b['x']-a['x'])
   close(v['finite'],expected,'FEM profile');close(v['exact'],v['x']*(1-v['x'])/2,'parabola')
  row=lambda v:[v[k]for k in ['K','hmin','hmax','h1Error','l2Error','energyGap','maxResidual']]
  for key,keys in [('mesh',['i','x','value','exact','error','residual']),('elements',['i','a','b','h','left','right','slope','exactMidSlope','stiffness','localLoad','C','D','E','gradError','l2Error']),('forward',['i','lower','diagonal','upper','rhs','factor','pivot','load']),('backward',['i','load','next','pivot','value'])]:
   ck(tables[key]['rows']==[[v[k]for k in keys]for v in p['nodes'if key=='mesh'else key]],'full FEM ledger '+key)
 else:
  for v in [p,*d['nodes']]:compare_corner(v,s['angleRatio'])
  row=lambda v:[v['rho'],str(v['nu']),v['delta'],v['radial'],v['coefficient'],v['l2'],v['gradient'],v['hessian'],v['classification']]
  for i,c in enumerate(d['comparisons']):
   for v,actual in zip(c['nodes'],tables['angle-'+str(i)]['rows']):
    compare_corner(v,c['ratio']);expected=row(v);ck(float(actual[1])==v['nu'],'roundtrip nu');expected[1]=actual[1];ck(actual==expected,'all comparison ledger')
 for actual,v in zip(tables['nodes']['rows'],d['nodes']):
  expected=row(v)
  if mode=='corner':ck(float(actual[1])==v['nu'],'roundtrip current nu');expected[1]=actual[1]
  ck(actual==expected,'all parameter ledger')
 ck(len(tables['nodes']['rows'])==len(d['nodes']),'full node count')
 for j,q in enumerate(ui['plots']):
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'plot bounds')
  for ser in q['series']:
   pts=ser['points'];key=ser['key'];ck(all(a[0]<b[0]for a,b in zip(pts,pts[1:])),'strict graph x')
   if mode=='spectral':
    expected=[[v['k'],v['ratio']]for v in p['rows'][:max(8,s['N']+3)]]if j==0 else [[v['x'],v['full'if key=='reference'else'finite']]for v in d['profile']]if j==1 else [[v['N'],v['h1Error'][key]]for v in d['nodes']]
   elif mode=='fem':expected=[[v['x'],v[key]]for v in d['profile']]if j==0 else [[math.log10(v['K']),math.log10(v['h1Error'if key=='h1'else'l2Error'])]for v in d['nodes']]
   else:expected=[[v['log10Rho'],math.log1p(v[key if j==0 else'hessian'])/math.log(10)]for v in (d['nodes']if j==0 else d['comparisons'][int(key[-1])]['nodes'])]
   ck(len(pts)==len(expected),'every graph node')
   for (x,y),(xx,yy)in zip(pts,expected):
    close(x,xx,'graph x');close(y,yy,'graph y');ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point framed')
  for m in q['markers']:ck(q['xmin']<=m['x']<=q['xmax'],'marker framed')
ck(data['invalid']>=100,'strict invalid coverage');ck(data['tiny']!='0','small nonzero preserved')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'grad-math/lectures/pde2-03-elliptic.md').read_text();site=(ROOT/'grad-math/site/pde2-03-elliptic.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every formula preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_elliptic_full.py')==1,'one CI invocation')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):
   ck((ROOT/'grad-math/site'/target).exists(),('local target',target))
 table=re.search(r'data-learning-lab="elliptic-coercivity".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 h=data['states'][0]['current'];f=next(d['current']for d in data['states']if d['config']==dict(mode='fem',K=8,grading=1));c=cref(1.5,.001)
 refs=[h['alpha'],h['beta'],h['h1Error']['lower'],h['h1Error']['upper'],h['residual']['lower'],h['residual']['upper'],h['tail']['uniform'],f['h1Error'],f['l2Error'],f['J'],f['energyGap'],c['l2'],c['gradient'],c['hessian']]
 ck(len(vals)==len(refs)==14,'all fallback rows')
 for x,y in zip(vals,refs):close(x,y,'fallback numeric',rtol=6e-9)
 for p in ROOT.glob('*/site/assets/learning/labs/elliptic-coercivity.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'grad-math/images/pde2-03-elliptic-ledgers.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/pde2-03-elliptic-ledgers.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};panels=svg.findall('.//s:svg',ns);ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]),s=a.snapshot({mu:-1}),f=a.snapshot({mode:'fem'}),c=a.snapshot({mode:'corner'});console.log(JSON.stringify([a.plots(s)[0],a.plots(f)[0],a.plots(f)[1],a.plots(c)[1]]))"
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for panel,q in zip(panels,plots):
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for ss in q['series']:
   circles=panel.findall('.//s:circle[@data-series="'+ss['key']+'"]',ns);ck(len(circles)==len(ss['points']),'all static circles')
   poly=panel.find('.//s:polyline[@data-series="'+ss['key']+'"]',ns);coords=[list(map(float,v.split(',')))for v in poly.get('points').split()]if poly is not None else [[float(v.get('cx')),float(v.get('cy'))]for v in circles];ck(len(coords)==len(circles),'all polyline nodes')
   for node,(a,b),(x,y)in zip(circles,coords,ss['points']):
    close(float(node.get('cx')),xf(x),'static cx');close(float(node.get('cy')),yf(y),'static cy');close(a,xf(x),'poly x');close(b,yf(y),'poly y')
  markers=panel.findall('.//s:line[@data-marker]',ns);ck(len(markers)==len(q['markers']),'all static markers')
  for m,v in zip(markers,q['markers']):close(float(m.get('x1')),xf(v['x']),'static marker')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
