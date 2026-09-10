"""Independent flux-integration solve, quadrature, intermediate steps and displayed data."""
from pathlib import Path
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-pde-fem.js'
states=[{},dict(rule='exact'),dict(A=0,TL=1,TR=1),dict(A=1e-8)]
for N in [2,16,64]:
 for rule in ['exact','midpoint','gauss2']:states.append(dict(N=N,rule=rule,TL=1,TR=-1,A=-2,kappa=.1))
for cut in [.15,.45,.5,.85,math.nextafter(.5,0),math.nextafter(.5,1)]:
 for mesh in ['uniform','fitted']:states.append(dict(mode='interface',N=8,cut=cut,mesh=mesh,kL=.1,kR=10,TL=2,TR=-2))
states.extend([dict(mode='interface',TL=1),dict(mode='interface',TL=1,mesh='uniform'),dict(mode='interface',TL=1,TR=1)])
for robin in [0,1,100]:
 for N in [2,64]:states.append(dict(mode='robin',robin=robin,N=N,kappa=.1,S=-2,TL=2,Tinf=-2))
states.append(dict(mode='robin'))
for p in [dict(S=1,gL=.5,imbalance=0),dict(S=1,gL=.5,imbalance=1e-100),dict(S=0,gL=-1,imbalance=0),dict(S=0,gL=0,imbalance=0),dict(S=-2,gL=-1,imbalance=0),dict(S=.3,gL=.1,imbalance=0)]:
 for N in [2,64]:states.append(dict(mode='neumann',N=N,kappa=10,mean=2,**p))
states.append(dict(mode='neumann'))
code=r"""
const a=require(process.argv[1]),states=JSON.parse(process.argv[2]).map(a.snapshot);
let invalid=0;function bad(s){let ok=false;try{a.config(s)}catch(e){ok=true}if(!ok)throw Error('accepted invalid '+JSON.stringify(s));invalid++}
for(const s of [null,[],true,3,'x'])bad(s);
for(const mode of ['',null,'oops'])bad({mode});
for(const [mode,fields]of Object.entries({sine:{N:[1,65,2.5],kappa:[0,11],A:[-3,3,1e-9,'1e-400'],TL:[-3,3,1e-9],TR:[-3,3,1e-9]},interface:{kL:[0,11],kR:[0,11],cut:[.14,.86],TL:[-3,3,1e-9],TR:[-3,3,1e-9]},robin:{S:[-3,3,1e-9],robin:[-1,101,'1e-400'],Tinf:[-3,3,1e-9]},neumann:{S:[-3,3,1e-9],gL:[-3,3,1e-9],mean:[-3,3,1e-9],imbalance:[-3,3,1e-101,'1e-400']}}))
for(const [key,values]of Object.entries(fields))for(const v of [...values,'',null,true,[],NaN,Infinity])bad({mode,[key]:v});
for(const rule of ['',null,'bad'])bad({rule});for(const mesh of ['',null,'bad'])bad({mode:'interface',mesh});
const inactive=a.config({mode:'interface',kappa:null,A:null,S:null,robin:null,imbalance:null});
console.log(JSON.stringify({states,ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),invalid,self:a.selfTest(),inactive,tiny:a.fmt(1e-100)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),json.dumps(states)],text=True))
checks=0
def ck(v,m):
 global checks
 assert v,m;checks+=1
def close(a,b,m,rtol=2e-8,atol=3e-11):
 ck(a is not None and math.isfinite(a)and abs(a-b)<=atol+rtol*abs(b),(m,a,b))
def gauss(n):
 out=[]
 for i in range(1,n+1):
  z=math.cos(math.pi*(i-.25)/(n+.5))
  for _ in range(40):
   p0,p1=1.,z
   for k in range(2,n+1):p0,p1=p1,((2*k-1)*z*p1-(k-1)*p0)/k
   der=n*(z*p1-p0)/(z*z-1);step=p1/der;z-=step
   if abs(step)<2e-16:break
  out.append((z,2/((1-z*z)*der*der)))
 return sorted(out)
G=gauss(24);G8=gauss(8)
def integ(fn,a,b):return (b-a)/2*math.fsum(w*fn((a+b)/2+(b-a)*z/2)for z,w in G)
def true(s,x):
 m=s['mode']
 if m=='sine':return s['TL']+(s['TR']-s['TL'])*x+s['A']/s['kappa']*(0 if x in [0,1]else math.sin(math.pi*x))
 if m=='interface':
  q=(s['TL']-s['TR'])/(s['cut']/s['kL']+(1-s['cut'])/s['kR'])
  return s['TL']-q*(min(x,s['cut'])/s['kL']+max(0,x-s['cut'])/s['kR'])
 if m=='robin':
  k=s['kappa'];b=s['robin'];C=(s['S']+b*s['S']/(2*k)-b*(s['TL']-s['Tinf']))/(k+b)
  return s['TL']+C*x-s['S']*x*x/(2*k)
 return s['mean']-s['gL']/(2*s['kappa'])+s['S']/(6*s['kappa'])+s['gL']*x/s['kappa']-s['S']*x*x/(2*s['kappa'])
def derivative(s,x,k):
 if s['mode']=='sine':return s['TR']-s['TL']+s['A']*math.pi*math.cos(math.pi*x)/k
 if s['mode']=='interface':return -(s['TL']-s['TR'])/(s['cut']/s['kL']+(1-s['cut'])/s['kR'])/k
 if s['mode']=='robin':return (s['S']+s['robin']*s['S']/(2*k)-s['robin']*(s['TL']-s['Tinf']))/(k+s['robin'])-s['S']*x/k
 return (s['gL']-s['S']*x)/k
def oracle(s,N):
 mode=s['mode'];gauge=mode=='neumann'
 if mode=='interface'and s['mesh']=='fitted':
  nl=max(1,min(N-1,math.floor(N*s['cut']+.5)));nr=N-nl
  xs=[s['cut']*i/nl for i in range(nl)]+[s['cut']+(1-s['cut'])*j/nr for j in range(nr)]+[1]
 else:xs=[i/N for i in range(N)]+[1]
 c=[];F=[0.]*(N+1);els=[]
 for i,(a,b)in enumerate(zip(xs,xs[1:])):
  h=b-a;br=[a]+([s['cut']]if mode=='interface'and a<s['cut']<b else[])+[b]
  parts=[(l,r,s['kappa']if mode!='interface'else s['kL']if r<=s['cut']else s['kR'])for l,r in zip(br,br[1:])]
  ik=math.fsum(k*(r-l)for l,r,k in parts);c.append(ik/h**2)
  if mode=='interface':fl=fr=0
  elif mode!='sine':fl=fr=s['S']*h/2
  else:
   rule=[(0,2)]if s['rule']=='midpoint'else gauss(2)if s['rule']=='gauss2'else G
   fl=h/2*math.fsum(w*s['A']*math.pi**2*math.sin(math.pi*((a+b)/2+h*z/2))*(1-z)/2 for z,w in rule)
   fr=h/2*math.fsum(w*s['A']*math.pi**2*math.sin(math.pi*((a+b)/2+h*z/2))*(1+z)/2 for z,w in rule)
  F[i]+=fl;F[i+1]+=fr;els.append((a,b,ik,fl,fr,parts))
 compatible=not gauge or s['imbalance']==0
 if not compatible:return dict(xs=xs,c=c,F=F,els=els,compatible=False)
 # Integrate discrete flux balance q_i-q_(i-1)=F_i. No Thomas/Gaussian solve.
 prefix=[math.fsum(F[1:i+1])for i in range(N)];R=math.fsum(1/v for v in c);offset=math.fsum(p/v for p,v in zip(prefix,c))
 if mode in ['sine','interface']:q0=(s['TL']-s['TR']-offset)/R
 elif mode=='robin':q0=(s['robin']*(s['TL']-s['Tinf'])-s['robin']*offset-math.fsum(F[1:]))/(1+s['robin']*R)
 else:q0=F[0]-s['gL']
 U=[0 if gauge else s['TL']]
 for v,p in zip(c,prefix):U.append(U[-1]-(q0+p)/v)
 shift=None
 if gauge:
  mean=math.fsum((b-a)*(u+v)/2 for a,b,u,v in zip(xs,xs[1:],U,U[1:]))
  shift=s['mean']-mean;U=[v+shift for v in U]
 h1=l2=node2=energy=mean=0;details=[]
 for i,(a,b,ik,fl,fr,parts)in enumerate(els):
  slope=(U[i+1]-U[i])/(b-a);energy+=ik*slope*slope;mean+=(b-a)*(U[i]+U[i+1])/2
  node2+=(b-a)*((U[i]-true(s,a))**2+(U[i+1]-true(s,b))**2)/2
  for l,r,k in parts:
   uh=lambda x:U[i]+slope*(x-a)
   eh=integ(lambda x:(slope-derivative(s,x,k))**2,l,r);el=integ(lambda x:(uh(x)-true(s,x))**2,l,r)
   h1+=eh;l2+=el;details.append((i,l,r,k,slope,eh,el))
 gL=F[0]-q0;gR=q0+math.fsum(F[1:]);weighted=math.fsum(f*u for f,u in zip(F,U));boundary=U[0]*gL+U[-1]*gR
 return dict(xs=xs,c=c,F=F,els=els,compatible=True,U=U,shift=shift,details=details,h1Error=math.sqrt(h1),l2Error=math.sqrt(l2),nodeL2=math.sqrt(node2),maxNodeError=max(abs(u-true(s,x))for u,x in zip(U,xs)),energy=energy,weightedSource=weighted,weightedBoundary=boundary,gLeft=gL,gRight=gR,mean=mean)
def verify(p,s,full=False):
 o=oracle(s,p['N']);N=p['N'];mode=s['mode'];gauge=mode=='neumann'
 ck(p['compatible']==o['compatible'],'compatibility from prescribed imbalance')
 close(p['balance']['value'],-s['imbalance']if gauge else 0,'physical balance',atol=0)
 ck(p['elementsCount']==N,'same total element budget')
 total=math.fsum(o['F']);exact=2*s['A']*math.pi if mode=='sine'else 0 if mode=='interface'else s['S']
 close(p['totalSource'],total,'independent load sum');close(p['exactSource'],exact,'continuous total')
 close(p['sourceQuadratureError'],total-exact,'source quadrature bias')
 if not o['compatible']:
  for k in ['mean','h1Error','l2Error','nodeL2','energy','weightedSource','weightedBoundary','gLeft','gRight','rawLeft','rawRight','heatResidual','trueHeatResidual','weightedResidual','algebraicResidual','minPivot','shift']:
   ck(p[k]is None,'no fabricated solution '+k)
  ck(not p['forward']and not p['backward']and not p['errors']and not p['fluxParts'],'no solve/error stages when incompatible')
 else:
  for key in ['h1Error','l2Error','nodeL2','maxNodeError','energy','weightedSource','weightedBoundary','gLeft','gRight','mean']:
   close(p[key],o[key],'flux integration oracle '+key,atol=2e-9)
  close(p['heatResidual'],0,'quadrature heat balance',atol=2e-9)
  close(p['trueHeatResidual'],total-exact,'continuous heat discrepancy',atol=2e-9)
  close(p['weightedResidual'],0,'weighted identity',atol=1e-8)
  close(p['algebraicResidual'],0,'all appropriate free rows',atol=2e-8)
 if not full:return o
 ck(len(p['nodes'])==N+1 and len(p['elements'])==N,'all assembly data')
 diag=[(o['c'][i-1]if i else 0)+(o['c'][i]if i<N else 0)for i in range(N+1)]
 rhs=o['F'][:];A=diag[:]
 if mode=='robin':rhs[N]+=s['robin']*s['Tinf'];A[N]+=s['robin']
 if gauge:rhs[0]-=s['gL'];rhs[N]-=s['gR']
 for i,v in enumerate(p['nodes']):
  for k,w in [('x',o['xs'][i]),('diagonal',diag[i]),('systemDiagonal',A[i]),('source',o['F'][i]),('rhs',rhs[i])]:close(v[k],w,'node assembly '+k)
  ck(v['fixed']==(i==0 or (i==N and mode in ['sine','interface'])),'constraint marker')
  ck(v['gauge']==(gauge and i==0),'gauge distinct from physical constraint')
  if not o['compatible']:ck(v['value']is None and v['exact']is None and v['residual']is None,'null incompatible nodes')
  else:
   close(v['value'],o['U'][i],'independent node temperature',atol=2e-10)
   close(v['exact'],true(s,v['x']),'analytic nodes')
   close(v['error'],v['value']-v['exact'],'signed nodal error')
   res=A[i]*v['value']-(o['c'][i-1]*p['nodes'][i-1]['value']if i else 0)-(o['c'][i]*p['nodes'][i+1]['value']if i<N else 0)-rhs[i]
   close(v['residual'],res,'unremoved boundary residual',atol=1e-9)
 for i,(v,e)in enumerate(zip(p['elements'],o['els'])):
  a,b,ik,fl,fr,parts=e
  for k,w in [('a',a),('b',b),('h',b-a),('integralK',ik),('stiffness',o['c'][i])]:close(v[k],w,'element '+k)
  close(p['off'][i],-o['c'][i],'off diagonal')
  close(v['load']['left'],fl,'local load left');close(v['load']['right'],fr,'local load right')
  expected=0 if mode!='sine'or s['rule']=='exact'else 1 if s['rule']=='midpoint'else 2
  ck(len(v['load']['points'])==expected,'honest quadrature nodes')
  for q in v['load']['points']:
   close(q['L'],(b-q['x'])/(b-a),'left basis');close(q['R'],(q['x']-a)/(b-a),'right basis')
   close(q['f'],s['A']*math.pi**2*math.sin(math.pi*q['x']),'source at node')
   for side,basis in [('left','L'),('right','R')]:close(q[side],q['weight']*q['f']*q[basis],'quadrature contribution')
 if not o['compatible']:return o
 fixed={0:0 if gauge else s['TL']}
 if mode in ['sine','interface']:fixed[N]=s['TR']
 free=[i for i in range(N+1)if i not in fixed]
 ck([v['i']for v in p['forward']]==free,'every forward step')
 ck([v['i']for v in p['backward']]==free[::-1],'every backward step')
 prev=None
 for v in p['forward']:
  i=v['i'];left=-o['c'][i-1]if i else 0;right=-o['c'][i]if i<N else 0
  correction=left*fixed.get(i-1,0)+right*fixed.get(i+1,0)
  factor=left/prev['pivot']if prev else 0;pivot=A[i]-factor*(prev['right']if prev else 0)
  load=rhs[i]-correction-factor*(prev['load']if prev else 0)
  for k,w in [('left',left),('right',right),('diagonal',A[i]),('original',rhs[i]),('correction',correction),('rhs',rhs[i]-correction),('factor',factor),('pivot',pivot),('load',load)]:close(v[k],w,'Thomas '+k)
  ck(v['pivot']>0,'positive actual pivot');prev=v
 for v in p['backward']:
  i=v['i'];close(v['value'],o['U'][i]-(o['shift']or 0),'pregauge independent value',atol=2e-10)
  close(v['value'],(v['load']-v['next'])/v['pivot'],'actual back substitution')
 ck(len(p['errors'])==len(o['details'])==len(p['fluxParts']),'all material subintervals')
 for v,f,e in zip(p['errors'],p['fluxParts'],o['details']):
  i,a,b,k,slope,eh,el=e
  close(v['h1'],eh,'independent higher quadrature',atol=1e-12);close(v['l2'],el,'independent whole function error',atol=1e-12)
  close(f['flux'],-k*slope,'one sided physical flux',atol=2e-10)
  close(f['meanElementFlux'],-o['els'][i][2]/(o['xs'][i+1]-o['xs'][i])*slope,'element mean flux',atol=2e-10)
  ck(len(v['nodes'])==8,'all Gauss8 data')
  for q,(z,w)in zip(v['nodes'],G8):
   x=(a+b)/2+(b-a)*z/2;weight=(b-a)*w/2
   close(q['x'],x,'Gauss node');close(q['weight'],weight,'Gauss weight')
   close(q['u'],true(s,x),'analytic quadrature value');close(q['du'],derivative(s,x,k),'analytic gradient')
   close(q['uh'],o['U'][i]+slope*(x-o['xs'][i]),'actual FE quadrature value',atol=2e-10)
   close(q['error'],q['uh']-q['u'],'signed function error');close(q['derivativeError'],v['slope']-q['du'],'signed derivative error')
   close(q['l2'],weight*q['error']**2,'L2 contribution');close(q['h1'],weight*q['derivativeError']**2,'H1 contribution')
 close(p['rawLeft'],-p['fluxParts'][0]['flux'],'raw left normal');close(p['rawRight'],p['fluxParts'][-1]['flux'],'raw right normal')
 return o
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];p=d['current'];o=verify(p,s,True)
 ck([v['N']for v in d['nodes']]==list(range(2,65)),'all 63 convergence grids')
 for v in d['nodes']:verify(v,s)
 xs=o['xs'];U=o.get('U')
 expected=sorted(set([i/256 for i in range(257)]+xs+([s['cut']]if s['mode']=='interface'else[])))
 ck([v['x']for v in d['profile']]==expected,'dense analytic profile includes every FE knot')
 for v in d['profile']:
  if U is None:ck(v['finite']is None and v['exact']is None,'no incompatible curve');continue
  x=v['x'];i=next((i for i in range(len(xs)-1)if x<=xs[i+1]),len(xs)-2)
  close(v['finite'],U[i]+(U[i+1]-U[i])*(x-xs[i])/(xs[i+1]-xs[i]),'all profile temperatures',atol=2e-10)
  close(v['exact'],true(s,x),'analytic profile')
 tables={t['key']:t for t in ui['tables']};ck(len(tables)==11,'all explanatory ledgers')
 fields={'nodes':('nodes','N status h1Error l2Error nodeL2 maxNodeError sourceQuadratureError heatResidual trueHeatResidual weightedResidual algebraicResidual'),
 'forward':('forward','i left diagonal right original correction rhs factor pivot load'),'backward':('backward','i load next pivot value'),
 'parts':('errors','element a b k slope h1 l2'),'flux':('fluxParts','element a b k flux meanElementFlux'),
 'profile':('profile','x exact finite')}
 for key,(source,keys)in fields.items():
  vals=d[source]if source in ['nodes','profile']else p[source]
  ck(tables[key]['rows']==[[v[k]for k in keys.split()]for v in vals],'all table values '+key)
 ck(tables['mesh']['rows']==[[v[k]for k in 'i x value exact error residual diagonal systemDiagonal source rhs fixed gauge'.split()]+[p['off'][i]if i<len(p['off'])else None]for i,v in enumerate(p['nodes'])],'full matrix table')
 ck(tables['elements']['rows']==[[v.get(k)for k in ['i','a','b','h','integralK','stiffness']]+[v['load'].get(k)for k in ['left','right','kind','totalHalf','differenceHalf']]+[v.get(k)for k in ['left','right','slope']]for v in p['elements']],'all element table')
 ck(tables['load']['rows']==[[e['i']]+[v[k]for k in 'x weight f L R left right'.split()]for e in p['elements']for v in e['load']['points']],'all load quadrature table')
 ck(tables['quadrature']['rows']==[[e['element']]+[v[k]for k in 'x weight uh u du error derivativeError l2 h1'.split()]for e in p['errors']for v in e['nodes']],'all error quadrature table')
 summary=[p['status'],p['balance']['value'],s.get('gR')]+[p[k]for k in 'h1Error l2Error nodeL2 maxNodeError totalSource exactSource sourceQuadratureError gLeft gRight rawLeft rawRight heatResidual trueHeatResidual energy weightedSource weightedBoundary weightedResidual algebraicResidual minPivot mean shift'.split()]
 ck([v[1]for v in tables['summary']['rows']]==summary,'all summary values')
 for j,q in enumerate(ui['plots']):
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'nondegenerate plot frame')
  if not p['compatible']:ck(not q['series'],'no fake steady plot');continue
  for ser in q['series']:
   key=ser['key']
   if j==0:expected=[[v['x'],v[key]]for v in d['profile']]
   elif j==1:
    if key=='exact':
     expected=[]
     for v in d['profile']:
      x=v['x'];k=s['kappa']if s['mode']!='interface'else s['kL']if x<=s['cut']else s['kR']
      expected.append([x,-k*derivative(s,x,k)])
    else:
     f=p['fluxParts'][int(key.split('-')[1])];expected=[[f['a'],f['flux']],[f['b'],f['flux']]]
   else:expected=[[v['N'],v[{'h1':'h1Error','l2':'l2Error','node':'nodeL2'}[key]]]for v in d['nodes']]
   ck(len(ser['points'])==len(expected),'all graph nodes')
   for (x,y),(a,b)in zip(ser['points'],expected):
    close(x,a,'graph x');close(y,b,'graph y')
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'graph point inside frame')
ck(data['invalid']==165,'strict invalid field coverage');ck(data['tiny']!='0','tiny nonzero remains visible')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 from html.parser import HTMLParser
 src=(ROOT/'physics-course/lectures/comp-03-pde-fem.md').read_text();site=(ROOT/'physics-course/site/comp-03-pde-fem.html').read_text()
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
 ck(parser.answers==4 and not parser.stack,'four balanced complete answers')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_pde_fem_full.py')==1,'one permanent CI invocation')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):ck((ROOT/'physics-course/site'/target).exists(),('local target',target))
 for mirror in ['course-shared/labs/physics-pde-fem.js','physics-course/site/assets/learning/labs/physics-pde-fem.js']:ck((ROOT/mirror).read_bytes()==JS.read_bytes(),'tracked JS mirror')
 image=ROOT/'physics-course/images/comp-03-heat-balances.svg'
 ck(image.read_bytes()==(ROOT/'physics-course/site/assets/img/comp-03-heat-balances.svg').read_bytes(),'SVG mirror')
 table=re.search(r'data-learning-lab="physics-pde-fem".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 a=data['states'][0]['current'];b=next(d['current']for d in data['states']if d['config']['mode']=='interface'and d['config']['kL']==1 and d['config']['mesh']=='fitted'and d['config']['TR']==0)
 c=next(d['current']for d in data['states']if d['config']['mode']=='interface'and d['config']['kL']==1 and d['config']['mesh']=='uniform')
 r=next(d['current']for d in data['states']if d['config']['mode']=='robin'and d['config']['kappa']==1);n=data['states'][-1]['current']
 refs=[a[k]for k in ['totalSource','exactSource','gLeft','gRight','rawLeft','h1Error','l2Error','nodeL2']]+[b['gRight'],b['h1Error'],c['gRight'],c['h1Error'],r['gLeft'],r['gRight'],n['mean'],n['h1Error']]
 ck(len(vals)==len(refs)==16,'complete static fallback')
 for v,w in zip(vals,refs):close(v,w,'fallback',rtol=6e-9)
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};panels=svg.findall('.//s:svg',ns);ck(len(panels)==4,'four static explanatory panels')
 selection="const a=require(process.argv[1]),s=a.snapshot({N:4,rule:'exact'}),f=a.snapshot({mode:'interface',TL:1,mesh:'uniform'}),r=a.snapshot({mode:'robin'});console.log(JSON.stringify([a.plots(s)[0],a.plots(s)[2],a.plots(f)[1],a.plots(r)[0]]))"
 qs=json.loads(subprocess.check_output(PREFIX+['node','-e',selection,str(JS.resolve())],text=True))
 for panel,q in zip(panels,qs):
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for ss in q['series']:
   circles=panel.findall('.//s:circle[@data-series="'+ss['key']+'"]',ns);ck(len(circles)==len(ss['points']),'all static graph data')
   poly=panel.find('.//s:polyline[@data-series="'+ss['key']+'"]',ns)
   coords=[list(map(float,v.split(',')))for v in poly.get('points').split()]
   ck(len(coords)==len(circles),'all static line nodes')
   for node,(x,y),(a,b)in zip(circles,ss['points'],coords):
    close(float(node.get('cx')),xf(x),'static x');close(float(node.get('cy')),yf(y),'static y')
    close(a,xf(x),'static poly x');close(b,yf(y),'static poly y')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
