# -*- coding: utf-8 -*-
"""Independent Gauss-Legendre quadrature, paired-block projectors and junction phasors; stdlib only."""
import math, cmath, json, sys
from functools import lru_cache
checks=0
def ok(x,msg='invariant'):
 global checks
 checks+=1
 if not x:raise AssertionError(msg)
def near(a,b,tol=3e-8):
 ok(isinstance(a,(float,int))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=tol*max(1,abs(b)),f'{a} != {b}')
@lru_cache(None)
def nodes(n=40):
 out=[]
 for i in range(1,n+1):
  x=math.cos(math.pi*(i-.25)/(n+.5))
  for _ in range(30):
   p0,p1=1,x
   for j in range(2,n+1):p0,p1=p1,((2*j-1)*x*p1-(j-1)*p0)/j
   dp=n*(x*p1-p0)/(x*x-1);dx=p1/dp;x-=dx
   if abs(dx)<2e-16:break
  out.append((x,2/((1-x*x)*dp*dp)))
 return out
def integrate(f,cuts):
 cuts=sorted(set(cuts));return sum((b-a)/2*sum(w*f((a+b)/2+(b-a)*x/2)for x,w in nodes())for a,b in zip(cuts,cuts[1:])if b>a)
def split(scale,upper=1):
 c=[0,upper];x=max(scale,1e-12)
 while x<upper:c.append(x);x*=2
 return c
def I(d,T):
 if not T:return math.asinh(1/d)if d else math.inf
 return integrate(lambda x:math.tanh(math.hypot(x,d)/(2*T))/math.hypot(x,d),split(max(T,d)/4))
@lru_cache(None)
def scales(l):
 d=1/math.sinh(1/l);a,b=d/4,1
 for _ in range(50):
  m=(a+b)/2
  if I(0,m)>1/l:a=m
  else:b=m
 return d,(a+b)/2
@lru_cache(None)
def gap(l,r):
 d,t=scales(l)
 if not r:return d
 if r>=1:return 0
 a,b=0,d
 for _ in range(45):
  m=(a+b)/2
  if I(m,r*t)>1/l:a=m
  else:b=m
 return(a+b)/2
def potential(l,T,r):
 d0,_=scales(l);d=r*d0
 if not d:return 0
 if not T:return r*r*(1/l-math.asinh(1/d)-1/(math.hypot(1,d)+1))
 def f(x):
  E=math.hypot(x,d)
  return(-2*d*d/(E+x)-4*T*(math.log1p(math.exp(-E/T))-math.log1p(math.exp(-x/T))))/(d0*d0)
 return r*r/l+integrate(f,split(min(T,d)/4))
def DOS(e,d,g):
 if not d:return 1
 if not g:
  if abs(e)<d:return 0
  if abs(e)==d:return None
  return abs(e)/math.sqrt(e*e-d*d)
 z=complex(abs(e),g);return(z/cmath.sqrt(z*z-d*d)).real
def kernel(x,T):
 a=math.exp(-abs(x)/T);return a/T/(1+a)**2
def G(v,d,T):
 if not T:return DOS(v,d,0)
 if not d:return 1
 # Hyperbolic energy substitution; independent of submitted xi-Simpson path.
 upper=abs(v)+45*T+max(1,d);umax=math.acosh(upper/d)
 cuts=[0,umax]
 for k in range(1,33):cuts.append(umax*k/32)
 for n in [-24,-12,-4,0,4,12,24]:
  E=abs(v)+n*T
  if d<E<upper:cuts.append(math.acosh(E/d))
 return integrate(lambda u:d*math.cosh(u)*(kernel(d*math.cosh(u)-v,T)+kernel(d*math.cosh(u)+v,T)),cuts)
def verify(rows):
 global checks
 start=checks
 for s in rows:
  c=s['parameters'];l=c['couplingPercent']/100;D=c['cutoffPercent']/100;ratio=c['temperaturePercent']/100;d0,tc=scales(l);d=gap(l,ratio);T=ratio*tc
  ok(len(s['gapCurve'])==66 and len(s['potential'])==101 and len(s['coherence'])==121 and len(s['interference'])==161 and len(s['phaseScan'])==145)
  for i,r in enumerate(s['gapCurve']):near(r['ratio'],i/50)
  for i,r in enumerate(s['potential']):near(r['relative'],i/50)
  for i,r in enumerate(s['coherence']):near(r['xi'],-3+i/20)
  near(s['selectedCoherence']['xi'],c['xiPercent']/100)
  near(s['selected']['ratio'],ratio);near(s['selected']['T'],T)
  ok(s['selected']['status']==('zero-temperature'if ratio==0 else'paired'if ratio<1 else'critical'if ratio==1 else'normal'))
  reported_d=s['selected']['relative']
  for name,key,n,step in [('density','energy',161,20),('tunneling','voltage',81,10)]:
   expected=sorted(set([-4+i/step for i in range(n)]+[-reported_d,reported_d,0]))
   ok(len(s[name])==len(expected))
   for r,e in zip(s[name],expected):near(r[key],e,2e-14)
  for i,r in enumerate(s['interference']):near(r['flux'],-2+i/40);near(r['phase'],c['phaseDegrees']*math.pi/180)
  for i,r in enumerate(s['phaseScan']):near(r['flux'],c['fluxPercent']/100);near(r['phase'],i*math.pi/72)
  near(s['selectedSquid']['flux'],c['fluxPercent']/100);near(s['selectedSquid']['phase'],c['phaseDegrees']*math.pi/180)
  for k,v in [('delta0',D*d0),('kBTc',D*tc),('delta',D*d),('kBT',D*T)]:near(s['units'][k],v)
  near(s['scale']['ratio'],2*d0/tc);near(s['scale']['tcResidual'],0,2e-9)
  near(s['selected']['relative'],d/d0);near(s['equilibrium']['value'],potential(l,T,d/d0))
  ok(s['selected']['normalStationary']is True)
  for r in s['gapCurve']+[s['selected']]:
   temperature=r['ratio']*tc;delta=gap(l,r['ratio']);near(r['delta'],delta);near(r['relative'],delta/d0);near(r['T'],temperature)
   ok(r['low']<=r['delta']<=r['high']);ok(r['high']-r['low']<1e-10)
   if temperature:
    near(r['normalCurvature'],2*(1/l-I(0,temperature)))
    near(r['residual'],l*I(delta,temperature)-1)
   else:ok(r['normalCurvature']is None)
   near(r['quadrature']['value'],I(delta,temperature));ok(r['quadrature']['errorEstimate']>=0)
  for r in s['potential']:
   near(r['value'],potential(l,T,r['relative']))
   dr=r['relative']*d0
   near(r['derivative'],2*r['relative']*(1/l-I(dr,T))if dr else 0)
   ok(r['value']>=s['equilibrium']['value']-2e-8)
  for r in s['coherence']+[s['selectedCoherence']]:
   x=r['xi'];delta=d/d0;t=T/d0;E=math.hypot(x,delta);near(r['E'],E)
   h=[[x,-delta],[-delta,-x]]
   for i in range(2):
    for j in range(2):near(r['bdg'][i][j],h[i][j]);near(sum(h[i][k]*h[k][j]for k in range(2)),E*E*(i==j))
   if E:
    P=r['projectorPositive'];ok(P is not None)
    for i in range(2):
     for j in range(2):
      near(P[i][j],((i==j)+h[i][j]/E)/2)
      near(sum(P[i][k]*P[k][j]for k in range(2)),P[i][j])
      near(sum(h[i][k]*P[k][j]for k in range(2)),E*P[i][j])
    th=math.tanh(E/(2*t))if t else 1
    near(r['u2'],(1+x/E)/2);near(r['v2'],(1-x/E)/2);near(r['u2']+r['v2'],1)
    near(r['anomalous'],delta/(2*E)*th);near(r['occupation'],(1-x/E*th)/2)
   else:
    ok(r['projectorPositive']is None and r['u2']is None and r['v2']is None and r['degenerate'])
    near(r['occupation'],.5);near(r['anomalous'],0)
  for r in s['density']:
   for kind,g in [('ideal',0),('dynes',c['gammaPercent']/100)]:
    value=DOS(r['energy'],s['selected']['relative'],g)
    if value is None:ok(r[kind]['value']is None and r[kind]['singular'])
    else:near(r[kind]['value'],value);ok(not r[kind]['singular']);ok(value>=0)
  for r in s['tunneling']:
   value=G(r['voltage'],d/d0,T/d0)
   if value is None:ok(r['value']is None and r['singular'])
   else:near(r['value'],value,2e-7);ok(not r['singular'])
   ok(r['errorEstimate']>=0 and r['tailBound']>=0)
   if r['upper']is not None:near(r['tailBound'],2*math.exp(-(r['upper']-abs(r['voltage']))/(T/d0)),1e-15)
  for r in s['interference']+s['phaseScan']+[s['selectedSquid']]:
   f=r['flux'];p=r['phase'];a=c['asymmetryPercent']/100
   z=(1+a)*cmath.exp(1j*math.pi*f)+(1-a)*cmath.exp(-1j*math.pi*f)
   near(r['critical'],abs(z));near(r['current'],(cmath.exp(1j*p)*z).imag)
   near(r['I1'],(1+a)*math.sin(p+math.pi*f));near(r['I2'],(1-a)*math.sin(p-math.pi*f))
   near(r['I1']+r['I2'],r['current']);ok(abs(r['current'])<=r['critical']+1e-12)
   if r['maximizingPhase']is not None:near((cmath.exp(1j*r['maximizingPhase'])*z).imag,abs(z))
  ok(s['boundaries']['thermalConvolutionIncludesGamma']is False)
  ok(s['boundaries']['finiteShellThermodynamics']is True and s['boundaries']['quadratureErrorIsEstimate']is True and s['boundaries']['squidIsIndependentPhaseModel']is True and s['boundaries']['materialPrediction']is False)
  ok(s['boundaries']['spectralWindowWithinShell']==(4*d0<1));near(s['boundaries']['inductance'],0)
 return {'status':'PASS','records':len(rows),'checks':checks-start,'method':'Independent Gauss-Legendre in xi/energy variables, paired-block spectral projectors, analytic complex DOS, thermally convolved ideal spectrum and complex junction phasors.'}

from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/bcs-gap.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/bcs-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{couplingPercent:15,temperaturePercent:99,cutoffPercent:50,gammaPercent:0},{couplingPercent:80,temperaturePercent:1,cutoffPercent:200,gammaPercent:1},{couplingPercent:80,temperaturePercent:100,xiPercent:0},{couplingPercent:15,temperaturePercent:130,xiPercent:0},{temperaturePercent:0,xiPercent:-300,gammaPercent:30},{temperaturePercent:0,xiPercent:300,gammaPercent:1},{couplingPercent:47,temperaturePercent:73,xiPercent:-179,phaseDegrees:137,fluxPercent:-67,asymmetryPercent:29},{couplingPercent:61,temperaturePercent:97,phaseDegrees:359,fluxPercent:199,asymmetryPercent:99},{couplingPercent:79,temperaturePercent:101,gammaPercent:0},{phaseDegrees:0,fluxPercent:50,asymmetryPercent:100},{phaseDegrees:360,fluxPercent:-50,asymmetryPercent:0},{couplingPercent:16,temperaturePercent:2,gammaPercent:0,xiPercent:0}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0}];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
verify(d['records']+d['frozen']+[r['data']for r in f['records']]);science_checks=checks
INTEGER_KEYS={'schemaVersion','couplingPercent','cutoffPercent','temperaturePercent','gammaPercent','xiPercent','phaseDegrees','fluxPercent','asymmetryPercent','evaluations','leaves','inductance'}
def replay(g,v,key=None):
 if isinstance(v,dict):
  assert isinstance(g,dict)and set(g)==set(v)
  for k in v:replay(g[k],v[k],k)
 elif isinstance(v,list):
  assert isinstance(g,list)and len(g)==len(v)
  for a,b in zip(g,v):replay(a,b,key)
 elif isinstance(v,bool)or v is None or isinstance(v,str):assert type(g)is type(v)and g==v
 elif key in INTEGER_KEYS:assert type(g)is int and type(v)is int and g==v,(key,g,v)
 else:assert isinstance(g,(int,float))and not isinstance(g,bool)and math.isfinite(g)and abs(g-v)<=5e-11*(1+abs(v)),(key,g,v)
for old,new in zip(f['records'],d['frozen']):replay(old['data'],new)
base=f['records'][0]['data'];guards=0
for change in [
 lambda x:x.update(schemaVersion=1.0000000000001),
 lambda x:x['parameters'].update(couplingPercent=30.0000000000001),
 lambda x:x['parameters'].update(temperaturePercent=50.0000000000001),
 lambda x:x['scale']['tcQuadrature'].update(evaluations=424.0000000000001),
 lambda x:x['selected'].update(normalStationary=1),
 lambda x:x['density'][0]['ideal'].update(singular=0),
 lambda x:x['tunneling'][0].update(value=float('nan')),
 lambda x:x['boundaries'].update(inductance=.0000000000001),
 lambda x:x['selected'].update(status=0),
 lambda x:x['units'].update(energy=None)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def point(x,r):return None if r['singular']else[x,min(6,r['value'])]
def expected_points(s):
 delta=s['selected']['relative']
 return [
  [[[r['ratio'],r['relative']]for r in s['gapCurve']],[[0,0],[1.3,0]],[[s['selected']['ratio'],delta]]],
  [[[r['relative'],r['value']]for r in s['potential']],[[delta,s['equilibrium']['value']]],[[0,0]]],
  [[None if r[k]is None else[r['xi'],r[k]]for r in s['coherence']]for k in ['u2','v2','occupation','anomalous']],
  [[point(r['energy'],r[k])for r in s['density']]for k in ['ideal','dynes']]+[[[r['energy'],6]for r in s['density']if r['ideal']['singular']or r['ideal']['value']>6]],
  [[point(r['voltage'],r)for r in s['tunneling']],[[-4,1],[4,1]],[[r['voltage'],6]for r in s['tunneling']if r['singular']or r['value']>6]],
  [[[r['flux'],r['critical']]for r in s['interference']],[[r['flux'],-r['critical']]for r in s['interference']],[[r['flux'],r['current']]for r in s['interference']],[[s['selectedSquid']['flux'],s['selectedSquid']['current']]]]
 ]
def expected_tables(s):
 def pairs(o):return[list(x)for x in o.items()]
 return{
 'parameters':pairs(s['parameters']),
 'scales':pairs(s['units'])+[['2Δ0/kBTc',s['scale']['ratio']],['Tc/ED二分下界',s['scale']['tcLow']],['Tc/ED二分上界',s['scale']['tcHigh']],['Tc处 λI−1',s['scale']['tcResidual']]],
 'selected':[[k,s['selected'][k]]for k in ['ratio','delta','relative','status','normalStationary','normalCurvature']]+[['稳定点势差/(N0Δ0²)',s['equilibrium']['value']],['所显示|E|≤4Δ0是否位于ED内',s['boundaries']['spectralWindowWithinShell']],['无量纲零温理想凝聚能',-1/(math.hypot(1,s['scale']['delta0'])+1)]],
 'temperature':[[r[k]for k in ['ratio','T','delta','relative','status','low','high','residual','normalCurvature']]+[r['quadrature']['value'],r['quadrature']['errorEstimate']]for r in s['gapCurve']],
 'potential':[[r[k]for k in ['relative','value','derivative','thermal','errorEstimate']]for r in s['potential']],
 'coherence':[[r[k]for k in ['xi','E','u2','v2','thermal','occupation','anomalous','degenerate']]for r in s['coherence']],
 'bdg':pairs(s['selectedCoherence']),
 'density':[[r['energy'],'∞（理想边缘）'if r['ideal']['singular']else r['ideal']['value'],r['ideal']['singular'],'∞（Γ=0边缘）'if r['dynes']['singular']else r['dynes']['value'],r['dynes']['singular'],r['ideal']['singular']or r['ideal']['value']>6,r['dynes']['singular']or r['dynes']['value']>6]for r in s['density']],
 'tunneling':[[r['voltage'],'∞（T=0边缘）'if r['singular']else r['value'],r['singular'],r['errorEstimate'],r['tailBound'],r['upper'],r['evaluations']]for r in s['tunneling']],
 'flux':[[r[k]for k in ['flux','phase','phase1','phase2','I1','I2','current','critical','maximizingPhase']]for r in s['interference']],
 'phase':[[r[k]for k in ['phase','I1','I2','current','critical']]for r in s['phaseScan']],
 'boundaries':pairs(s['boundaries'])}
NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  root=ET.fromstring(source);assert root.get('viewBox')=='0 0 900 580'and root.get('role')=='img'and root.get('aria-label')==p['title']and root.find(NS+'title').text==p['title']
  paths=[q for q in root.findall(NS+'path')if q.get('data-series')is not None];assert len(paths)==len(p['series'])
  expected_markers=[]
  for i,(series,path)in enumerate(zip(p['series'],paths)):
   assert path.get('data-series')==str(i)and path.get('stroke')==series['color']
   coords=re.findall(r'[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',path.get('d',''));points=[q for q in series['points']if q is not None];assert len(coords)==len(points)
   starts=0;pen=False
   for q in series['points']:
    if q is None:pen=False
    else:
     if not pen or series.get('markersOnly'):starts+=1
     pen=True
   assert path.get('d').count('M')==starts
   for xy,(x,y)in zip(coords,points):
    assert math.isfinite(x)and math.isfinite(y)and p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=1e-6 and abs(float(xy[1])-Y)<=1e-6;plotcoords+=2
    if series.get('markersOnly')or len(points)==1:expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color']))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for q,(X,Y,color,fill)in zip(actual,expected_markers):assert abs(float(q.get('cx'))-X)<1e-9 and abs(float(q.get('cy'))-Y)<1e-9 and q.get('stroke')==color and q.get('fill')==fill
 expected=expected_tables(s);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];replay(t['rows'],expected[t['key']]);assert all(len(row)==len(t['headers'])for row in t['rows']);table_rows+=len(t['rows'])
mutations=0
for change in [
 lambda x:x['units'].update(delta0=.7),
 lambda x:x['scale'].update(ratio=3),
 lambda x:x['selected'].update(normalStationary=False),
 lambda x:x['selected'].update(status='normal'),
 lambda x:x['gapCurve'][20].update(relative=0),
 lambda x:x['gapCurve'][20].update(normalCurvature=0),
 lambda x:x['potential'][30].update(value=10),
 lambda x:x['potential'][30].update(derivative=10),
 lambda x:x['selectedCoherence'].update(xi=2),
 lambda x:x['coherence'][10].update(u2=.5),
 lambda x:x['coherence'][60]['projectorPositive'][0].__setitem__(1,.5),
 lambda x:x['coherence'][60].update(occupation=0),
 lambda x:x['density'][0]['ideal'].update(value=0),
 lambda x:x['density'][80]['dynes'].update(value=0),
 lambda x:x['tunneling'][10].update(value=0),
 lambda x:x['interference'][0].update(critical=0),
 lambda x:x['phaseScan'][10].update(current=0),
 lambda x:x['boundaries'].update(thermalConvolutionIncludesGamma=True)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:verify([mutant])
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
