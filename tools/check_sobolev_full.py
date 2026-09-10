"""Independent scalar oracles, exact binary Fraction criticality and every plot/ledger node."""
from pathlib import Path
from fractions import Fraction
import math,json,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PREFIX=['rtk','proxy']if shutil.which('rtk')else[]
JS=Path(sys.argv[1])if len(sys.argv)>1 else ROOT/'course-shared/labs/sobolev-scaling.js'
boundary=[]
for n in [2,3,6]:
 for p in [1,1.2,n-.1]:
  q=n*p/(n-p)
  for v in [math.nextafter(q,0),q,math.nextafter(q,math.inf)]:
   boundary.append(dict(n=n,p=p,qkind='custom',q=v,epsilon=1e-6))
code=r"""
const a=require(process.argv[1]),states=[];
for(const n of [2,3,6])for(const p of [1,n-.1])for(const epsilon of [1e-6,1])for(const qkind of ['critical','custom'])states.push(a.snapshot({n,p,epsilon,qkind,q:1000}));
for(const n of [2,3,6])for(const L of [1,10,40])states.push(a.snapshot({mode:'moser',n,L}));
for(const ell of [.2,1,10])for(const A of [-2,0,2])for(const b of [-2,0,2])states.push(a.snapshot({mode:'poincare',ell,A,b}));
for(const ell of [.2,10])for(const ratio of [.01,.2,1])states.push(a.snapshot({mode:'trace',ell,ratio}));
for(const s of JSON.parse(process.argv[2]))states.push(a.snapshot(s));
for(const s of [{},{mode:'poincare',b:-2/Math.PI},{mode:'hat',n:4,p:1.6,qkind:'custom',q:1},{mode:'hat',n:5,p:2.7,qkind:'super'}])states.push(a.snapshot(s));
let invalid=0;function bad(s){let ok=false;try{a.snapshot(s)}catch(e){ok=true}if(!ok)throw Error('accepted invalid '+JSON.stringify(s));invalid++}
for(const s of [null,[],true,3,'x'])bad(s);
for(const n of [1,7,2.5])bad({mode:'moser',n});
for(const [key,vs]of Object.entries({mode:['',null,'oops'],n:[1,7,2.5,'',null,true,NaN,Infinity],p:[0,3,'',null,true,NaN],qkind:['',null,'oops'],epsilon:[0,2,'',null,true,NaN]}))for(const v of vs)bad({[key]:v});
for(const [mode,key,vs]of [['hat','q',[0,1001,'',null,true,Infinity]],['moser','L',[0,41,'',null,true,NaN]],['poincare','ell',[0,11,'',null,true]],['poincare','A',[-3,3,'',null,true]],['poincare','b',[-3,3,'',null,true]],['trace','ratio',[0,2,'',null,true]],['trace','ell',[0,11,'',null,true]]])for(const v of vs)bad({mode,qkind:'custom',[key]:v});
const inactive=a.snapshot({mode:'trace',n:null,p:null,qkind:null,q:null,L:null,A:null,b:null});
console.log(JSON.stringify({states,ui:states.map(d=>({tables:a.ledgers(d),plots:a.plots(d)})),invalid,inactive,self:a.selfTest(),tiny:a.fmt(1e-30),bool:a.fmt(false)}));
"""
data=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve()),json.dumps(boundary)],text=True))
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
def volume(n):return math.pi**(n/2)/math.gamma(1+n/2)
def href(s,e,kind=None):
 n,p=s['n'],s['p'];kind=kind or s['qkind'];star=n*p/(n-p)
 q=p if kind=='sub'else star if kind=='critical'else star+2 if kind=='super'else s['q']
 ex=Fraction(0)if kind=='critical'else 1-Fraction(n)/Fraction(p)+Fraction(n)/Fraction(q)
 w=volume(n);beta=math.exp(math.lgamma(n)+math.lgamma(q+1)-math.lgamma(n+q+1))
 amp=e**(1-n/p)*w**(-1/p);lq=amp*(n*w*beta*e**n)**(1/q)
 return dict(q=q,pStar=star,exponent=float(ex),classification='critical'if ex==0 else 'subcritical'if ex>0 else 'supercritical',omega=w,beta=beta,amplitude=amp,volume=w*e**n,gradient=1,lq=lq,logAmplitude=math.log(amp),logLq=math.log(lq),logVolume=math.log(w*e**n))
def mref(n,L):
 S=n*volume(n)
 integral=math.fsum(integrate(lambda t:t**n*math.exp(-n*t),L*i/20,L*(i+1)/20)for i in range(20))
 core=math.exp(-n*L)*L**(n-1)/n;power=integral/L+core
 return dict(S=S,radius=math.exp(-L),peak=L**(1-1/n)/S**(1/n),gradient=1,lnPower=power,lnNorm=power**(1/n),corePower=core,alphaThreshold=n*S**(1/(n-1)))
def pref(s,ell):
 A,b=s['A'],s['b']
 norm2=ell*integrate(lambda t:(b+A*math.sin(math.pi*t))**2,0,1)
 grad2=integrate(lambda t:(A*math.pi*math.cos(math.pi*t))**2,0,1)/ell
 mean=integrate(lambda t:b+A*math.sin(math.pi*t),0,1)
 centered=ell*integrate(lambda t:(b+A*math.sin(math.pi*t)-mean)**2,0,1)
 return dict(ell=ell,mean=mean,norm2=norm2,norm=math.sqrt(norm2),gradient2=grad2,gradient=math.sqrt(grad2),meanZeroNorm=math.sqrt(centered),C=ell/math.pi,traceLeft=b,traceRight=b,inequalityGap=norm2-(ell/math.pi)**2*grad2)
def tref(s,r):
 e=r*s['ell'];return dict(ratio=r,epsilon=e,norm2=e/3,norm=math.sqrt(e/3),gradient2=1/e,gradient=1/math.sqrt(e),traceLeft=1,traceRight=0,w12=math.sqrt(e/3+1/e))
def compare(p,r,label):
 for k,v in r.items():
  if isinstance(v,str):ck(p[k]==v,(label,k,p[k],v))
  else:close(p[k],v,(label,k),atol=0 if k in ['exponent','corePower','radius','volume','amplitude','beta','lnPower']else 3e-12)
for d,ui in zip(data['states'],data['ui']):
 s=d['config'];mode=s['mode'];p=d['current']
 if mode=='hat':
  compare(p,href(s,p['epsilon']),'hat current')
  for v in d['nodes']:compare(v,href(s,v['epsilon']),'hat node')
  for comp in d['comparisons']:
   ck(len(comp['nodes'])==len(d['nodes']),'all comparison nodes')
   for v in comp['nodes']:compare(v,href(s,v['epsilon'],comp['kind']),'comparison')
  close(p['logBeta'],math.log(p['beta']),'log beta')
  for j,t in enumerate(p['betaTerms'],1):
   ck(t['j']==j,'beta index');close(t['factor'],p['q']+j,'beta factor');close(t['log'],math.log(p['q']+j),'beta log')
  row=lambda v:[v['epsilon'],str(v['q']),v['exponent'],v['volume'],v['amplitude'],v['gradient'],v['lq'],v['logAmplitude'],v['logLq']]
 elif mode=='moser':
  for v in [p,*d['nodes']]:compare(v,mref(s['n'],v['L']),'Moser')
  for sh in d['shells']:
   n=s['n'];a,b=sh['a'],sh['b'];h=b-a
   close(sh['lnPower'],integrate(lambda t:t**n*math.exp(-n*t),a,b)/s['L'],'shell integral',atol=0)
   close(sh['gradientPower'],h/s['L'],'shell gradient',atol=0)
   close(sh['rOuter'],math.exp(-a),'outer radius',atol=0);close(sh['rInner'],math.exp(-b),'inner radius',atol=0)
   for part in sh['parts']:
    k=part['k'];moment=integrate(lambda v:v**k*math.exp(-n*v),0,h)
    close(part['moment'],moment,'independent moment',atol=0)
    ck(part['choose']==math.comb(n,k),'binomial');ck(1<part['terms']<100,'converged positive series')
    close(part['contribution'],math.exp(-n*a)*math.comb(n,k)*a**(n-k)*moment,'positive contribution',atol=0)
   close(sum(t['contribution']for t in sh['parts'])/s['L'],sh['lnPower'],'parts sum',atol=0)
  close(d['shellSum'],math.fsum(t['lnPower']for t in d['shells'])+p['corePower'],'shells plus core')
  close(d['shellResidual'],d['shellSum']-p['lnPower'],'residual')
  close(sum(t['gradientPower']for t in d['shells']),1,'full gradient')
  row=lambda v:[v['L'],v['radius'],v['peak'],v['gradient'],v['lnNorm'],v['lnPower']]
 elif mode=='poincare':
  for v in [p,*d['nodes']]:
   compare(v,pref(s,v['ell']),'Poincare')
   if s['A']==0:ck(v['ratio']is None and v['ratioStatus']!='finite','zero denominator explicit')
   else:close(v['ratio'],v['norm']/v['gradient'],'finite ratio')
   ck(v['zeroTrace']==(s['b']==0),'zero trace predicate')
  row=lambda v:[v['ell'],v['norm'],v['gradient'],v['meanZeroNorm'],v['C'],v['ratio'],v['inequalityGap']]
 else:
  for v in [p,*d['nodes']]:compare(v,tref(s,v['ratio']),'trace')
  row=lambda v:[v['ratio'],v['epsilon'],v['norm'],v['gradient'],v['w12'],v['traceLeft'],v['traceRight']]
 tables={t['key']:t for t in ui['tables']}
 ck(len(tables['nodes']['rows'])==len(d['nodes']),'all curve nodes visible')
 for actual,v in zip(tables['nodes']['rows'],d['nodes']):
  expect=row(v)
  if mode=='hat':ck(float(actual[1])==v['q'],'roundtrip q');expect[1]=actual[1]
  ck(actual==expect,'exact node table')
 if mode=='hat':
  ck(tables['beta']['rows']==[[t['j'],t['factor'],t['log']]for t in p['betaTerms']],'beta table')
  for c in d['comparisons']:
   rows=tables['compare-'+c['kind']]['rows'];ck(len(rows)==len(c['nodes']),'comparison table length')
   for actual,v in zip(rows,c['nodes']):
    expect=row(v);ck(float(actual[1])==v['q'],'comparison q precision');expect[1]=actual[1];ck(actual==expect,'comparison table exact')
 elif mode=='moser':
  ck(tables['shells']['rows']==[[t['i'],t['a'],t['b'],t['rOuter'],t['rInner'],t['gradientPower'],t['lnPower']]for t in d['shells']],'all shell ledger')
  ck(tables['moments']['rows']==[[t['i'],q['k'],q['choose'],q['moment'],q['terms'],q['contribution']]for t in d['shells']for q in t['parts']],'all moment ledger')
  ck(tables['gamma']['rows']==[[t['j'],t['term']]for t in p['terms']],'finite sum ledger')
  for t in p['terms']:close(t['term'],(s['n']*s['L'])**t['j']/math.factorial(t['j']),'gamma term')
 for panel_index,q in enumerate(ui['plots']):
  ck(q['xmin']<q['xmax']and q['ymin']<q['ymax'],'positive plot range')
  for ss in q['series']:
   pts=ss['points'];key=ss['key'];ck(all(x[0]<y[0]for x,y in zip(pts,pts[1:])),'strict plot coordinates')
   for x,y in pts:
    ck(q['xmin']<=x<=q['xmax']and q['ymin']<=y<=q['ymax'],'point in frame')
    if mode=='hat':expected=max(0,1-abs(x))if panel_index==0 else math.log10(href(s,10**x,key)['lq'])
    elif mode=='moser':
     expected=min(x,s['L'])/(s['n']*volume(s['n'])*s['L'])**(1/s['n'])if panel_index==0 else mref(s['n'],x)[{'peak':'peak','ln':'lnNorm','gradient':'gradient'}[key]]
    elif mode=='poincare':
     if panel_index==0:
      sn=0 if x in [0,1]else math.sin(math.pi*x)
      expected=s['b']+s['A']*sn if key=='u'else s['A']*(sn-2/math.pi)
     else:
      v=pref(s,x);expected=v['norm']if key=='norm'else v['C']*v['gradient']if key=='bound'else v['meanZeroNorm']
    else:
     if panel_index==0:expected=max(0,1-x/s['ratio'])
     else:expected=0 if key=='trace'else math.log10(tref(s,10**x)[key])
    close(y,expected,'plot '+key)
   if panel_index==1:ck(len(pts)==len(d['nodes']),'all parameter nodes plotted')
  for marker in q['markers']:ck(q['xmin']<=marker['x']<=q['xmax'],'marker inside')
ck(data['invalid']>=70,'strict invalid coverage');ck(data['tiny']!='0'and data['bool']=='否','readable scalars')
if len(sys.argv)==1:
 import re,html,xml.etree.ElementTree as ET
 src=(ROOT/'grad-math/lectures/pde2-02-sobolev.md').read_text();site=(ROOT/'grad-math/site/pde2-02-sobolev.html').read_text()
 formulas=[(a or b).strip()for a,b in re.findall(r'\$\$(.*?)\$\$|(?<!\\)\$(?!\$)(.*?)(?<!\\)\$(?!\$)',src,re.S)]
 actual=[html.unescape(a or b).strip()for a,b in re.findall(r'<(?:span|div) class="arithmatex">(?:\\\((.*?)\\\)|\\\[(.*?)\\\])</(?:span|div)>',site,re.S)]
 ck(formulas==actual,'every formula preserved');ck(src.count('<details class="answer"')==4,'four complete answers')
 ck((ROOT/'.github/workflows/course-audit.yml').read_text().count('python tools/check_sobolev_full.py')==1,'one CI invocation')
 for link in re.findall(r'(?:href|src)="([^"]+)"',site):
  target=link.split('#')[0].split('?')[0]
  if target and not re.match(r'^[a-zA-Z]+:',target)and not target.startswith('/'):
   ck((ROOT/'grad-math/site'/target).exists(),('local target',target))
 table=re.search(r'data-learning-lab="sobolev-scaling".*?<tbody>(.*?)</tbody>',site,re.S).group(1)
 vals=[float(html.unescape(x))for x in re.findall(r'<tr>\s*<td>.*?</td>\s*<td[^>]*>(.*?)</td>\s*</tr>',table,re.S)]
 h0=next(d['current']for d in data['states']if d['config']==dict(mode='hat',n=3,p=2,qkind='critical',epsilon=.1))
 m0=mref(2,10);p0=pref(dict(A=1,b=0),1);t0=tref(dict(ell=1),.1)
 refs=[h0['gradient'],h0['amplitude'],h0['lq'],h0['volume'],m0['gradient'],m0['peak'],m0['lnNorm'],m0['alphaThreshold'],p0['norm'],p0['gradient'],p0['C'],t0['norm'],t0['gradient'],t0['traceLeft']]
 ck(len(vals)==len(refs)==14,'all fallback rows')
 for x,y in zip(vals,refs):close(x,y,'fallback numeric',rtol=6e-9)
 for p in ROOT.glob('*/site/assets/learning/labs/sobolev-scaling.js'):ck(p.read_bytes()==JS.read_bytes(),'exact JS mirror')
 image=ROOT/'grad-math/images/pde2-02-sobolev-budgets.svg';ck(image.read_bytes()==(ROOT/'grad-math/site/assets/img/pde2-02-sobolev-budgets.svg').read_bytes(),'exact SVG mirror')
 svg=ET.parse(image).getroot();ns={'s':'http://www.w3.org/2000/svg'};panels=svg.findall('.//s:svg',ns);ck(len(panels)==4,'four static panels')
 code="const a=require(process.argv[1]);console.log(JSON.stringify([{}, {mode:'moser',n:2},{mode:'poincare'},{mode:'trace'}].map(s=>a.plots(a.snapshot(s))[1])))"
 plots=json.loads(subprocess.check_output(PREFIX+['node','-e',code,str(JS.resolve())],text=True))
 for panel,q in zip(panels,plots):
  xf=lambda x:100+750*(x-q['xmin'])/(q['xmax']-q['xmin']);yf=lambda y:335-250*(y-q['ymin'])/(q['ymax']-q['ymin'])
  for ss in q['series']:
   circles=panel.findall('.//s:circle[@data-series="'+ss['key']+'"]',ns);ck(len(circles)==len(ss['points']),'all static circles')
   poly=panel.find('.//s:polyline[@data-series="'+ss['key']+'"]',ns);coords=[list(map(float,v.split(',')))for v in poly.get('points').split()];ck(len(coords)==len(circles),'all polyline nodes')
   for node,(a,b),(x,y)in zip(circles,coords,ss['points']):
    close(float(node.get('cx')),xf(x),'static cx');close(float(node.get('cy')),yf(y),'static cy');close(a,xf(x),'poly x');close(b,yf(y),'poly y')
  markers=panel.findall('.//s:line[@data-marker]',ns);ck(len(markers)==len(q['markers']),'all static markers')
  for m,v in zip(markers,q['markers']):close(float(m.get('x1')),xf(v['x']),'static marker')
 print('formulas',len(formulas))
print(json.dumps(dict(status='PASS',checks=checks,states=len(data['states']),invalid=data['invalid'],self=data['self'])))
