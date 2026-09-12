# -*- coding: utf-8 -*-
"""Independent finite-ring covariance inversion, scalar resolvent and OU checks."""
import math,json,sys
CHECKS=0
def close(a,b,label,tol=3e-9):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'length')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(bool,str)):assert type(a)is type(b)and a==b,(label,a,b)
 else:
  assert not isinstance(a,bool)and isinstance(a,(int,float))and math.isfinite(a),(label,a)
  assert abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def product(A,B):return [[sum(x*y for x,y in zip(row,col))for col in zip(*B)]for row in A]
def inverse(A):
 n=len(A);a=[list(row)+[float(i==j)for j in range(n)]for i,row in enumerate(A)]
 for j in range(n):
  p=max(range(j,n),key=lambda i:abs(a[i][j]));assert abs(a[p][j])>1e-13
  a[j],a[p]=a[p],a[j];pivot=a[j][j];a[j]=[x/pivot for x in a[j]]
  for i in range(n):
   if i!=j:
    factor=a[i][j];a[i]=[x-factor*y for x,y in zip(a[i],a[j])]
 return[row[n:]for row in a]
def validate(s):
 c=s['parameters'];limits={'sites':(8,64),'mode':(0,32),'massPercent':(0,200),'stiffnessPercent':(1,200),'mobilityPercent':(1,200),'temperaturePercent':(1,200),'timeTenths':(0,200),'stepMillis':(1,2000)}
 assert set(c)==set(limits)
 for k,(lo,hi)in limits.items():assert type(c[k])is int and lo<=c[k]<=hi
 N=c['sites'];assert c['mode']<=N//2
 r,k,M,T=[c[x]/100 for x in ['massPercent','stiffnessPercent','mobilityPercent','temperaturePercent']]
 close(s['schema'],'transport194-v1','schema')
 close(s['units'],{'space':'lattice spacing a','energy':'E0','time':'t0','temperature':'kBT/E0','field':'dimensionless density deviation; sum fixed to zero','source':'free energy/E0 contains -h dot phi'},'units')
 B=[[float(i==j)-float((i+1)%N==j)for j in range(N)]for i in range(N)];L=product(list(zip(*B)),B)
 H=[[r*(i==j)+k*L[i][j]for j in range(N)]for i in range(N)]
 A=[[M*x for x in row]for row in product(L,H)];Q=[[2*T*M*x for x in row]for row in L]
 P=[[float(i==j)-1/N for j in range(N)]for i in range(N)]
 inv=inverse([[H[i][j]+1/N for j in range(N)]for i in range(N)])
 C=[[T*x for x in row]for row in product(product(P,inv),P)]
 model=s['model']
 for key,value in [('L',L),('H',H),('A',A),('Q',Q),('C',C),('P',P)]:close(model[key],value,key)
 for key,value in [('N',N),('r',r),('kappa',k),('M',M),('theta',T),('continuumCorrelationLength',math.sqrt(k/r)if r else None),('unconstrainedZeroVariance',T/r if r else None),('diffusionCoefficient',M*r),('conductivityFactor',M)]:close(model[key],value,key)
 modes=[]
 for index in range(N):
  phase=2*math.pi*index/N;wave=2*math.pi*min(index,N-index)/N;ell=2*(1-math.cos(phase));h=r+k*ell;zero=index==0
  modes.append({'index':index,'wave':wave,'phaseWave':phase,'laplacian':ell,'stiffness':h,'staticVariance':0 if zero else T/h,'staticResponse':0 if zero else 1/h,'rate':0 if zero else M*ell*h,'rateA':M*h,'diffusionRate':M*r*wave**2,'continuumRate':M*wave**2*(r+k*wave**2),'noisePower':2*T*M*ell,'zeroMode':zero})
 close(model['modes'],modes,'modes')
 close(model['spatial'],[{'site':j,'distance':min(j,N-j),'covariance':C[j][0],'unconstrainedCovariance':C[j][0]+T/(N*r)if r else None}for j in range(N)],'spatial')
 m=modes[c['mode']];close(s['selected'],m,'selected');S=m['staticVariance'];rate=m['rate'];source=M*m['laplacian'];zero=m['zeroMode']
 def time(t):
  decay=math.exp(-rate*abs(t));positive=t>=0
  return {'time':t,'correlation':S*decay,'response':source*math.exp(-rate*t)if positive else 0,'normalizedCorrelation':None if zero else decay,'normalizedResponse':None if zero else math.exp(-rate*t)if positive else 0,'varianceCold':None if t<0 else S*(-math.expm1(-2*rate*t)),'varianceNoiseOff':None if t<0 else S*math.exp(-2*rate*t),'varianceEquilibrium':S,'causal':positive}
 # Grid membership uses the verified actual rate, avoiding bitwise cosine/sine differences.
 grid=[(i-40)/10 for i in range(241)]
 if not zero:
  for x in [.0625,.125,.25,.5,.75,1,1.5,2,3,4,6,8]:
   for sign in [-1,1]:
    t=sign*x/s['selected']['rate']
    if -4<=t<=20:grid.append(t)
 grid=sorted(set(grid));close(s['time'],[time(t)for t in grid],'time')
 close(s['selectedTime'],time(c['timeTenths']/10),'selected time')
 frequency=[]
 for i in range(201):
  x=(i-100)/10;omega=x*s['selected']['rate']if not zero else x
  if zero:frequency.append({'scaledFrequency':x,'omega':omega,'spectrum':0,'response':[0,0],'fdtSpectrum':0,'active':False})
  else:
   chi=source/complex(rate,-omega);power=2*T*source/abs(complex(rate,-omega))**2
   frequency.append({'scaledFrequency':x,'omega':omega,'spectrum':power,'response':[chi.real,chi.imag],'fdtSpectrum':power,'active':True})
 close(s['frequency'],frequency,'frequency')
 close(s['windows'],[{'scaledHalfWidth':(i+1)/10,'halfWidth':(i+1)/10*(1 if zero else rate),'spectralMass':0 if zero else 2*S*math.atan((i+1)/10)/math.pi,'fullMass':S}for i in range(100)],'windows')
 t=c['timeTenths']/10
 profile=[]
 for j in range(N):
  values=[math.exp(-p['rate']*t)*math.cos(p['phaseWave']*j)/N for p in modes]
  profile.append({'site':j,'initial':float(j==0)-1/N,'value':sum(values[1:]),'covarianceAtTime':sum(v*p['staticVariance']for v,p in zip(values,modes))})
 close(s['profile'],profile,'profile')
 dt=c['stepMillis']/1000;x=rate*dt;alpha=math.exp(-x);rho=(1-x)**2;Qstep=2*T*source*dt
 rows=[]
 for n in range(65):
  # Finite geometric sum is independent of the submitted one-step recursion.
  em=Qstep*sum(rho**j for j in range(n))
  rows.append({'step':n,'time':n*dt,'exactVariance':S*(-math.expm1(-2*x*n)),'eulerVariance':em,'noiseOffVariance':S*math.exp(-2*x*n),'equilibriumVariance':S})
 stable=not zero and x<2
 expected={'dt':dt,'rateStep':x,'alpha':alpha,'noiseVariance':S*(-math.expm1(-2*x)),'eulerAlpha':1-x,'eulerNoiseVariance':Qstep,'eulerStable':stable,'eulerStatus':'constrained-zero'if zero else'stable'if x<2 else'marginal-growth'if x==2 else'unstable','eulerStationaryVariance':S/(1-x/2)if stable else None,'exactStationaryVariance':S,'rows':rows}
 close(s['step'],expected,'step',2e-8)
 keys=['canonicalZeroRemoved','gaussianFiniteRing','noiseConservesTotal','negativeCovarianceAllowed','matrixCovariancePositiveSemidefinite','zeroResponseNotGrandCanonicalSusceptibility','criticalInfiniteVolumeNotClaimed','modelANonzeroComparisonOnly','frequencyGridUsesSelectedRate','eulerInstabilityIsNumerical','quantumFDTNotUsed','conductivityNeedsPhysicalUnits']
 close(s['boundaries'],{key:not zero if key=='frequencyGridUsesSelectedRate'else True for key in keys},'boundaries')
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-correlated-transport.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/transport-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{sites:64,mode:32,massPercent:0,stiffnessPercent:1,mobilityPercent:1,temperaturePercent:1,stepMillis:1},{sites:63,mode:31,massPercent:200,stiffnessPercent:200,mobilityPercent:200,stepMillis:2000},{sites:64,mode:1,massPercent:0,stiffnessPercent:1,mobilityPercent:1},{sites:8,mode:4,massPercent:100,stiffnessPercent:25,mobilityPercent:100,stepMillis:250},{sites:8,mode:0,massPercent:0},{sites:9,mode:4,massPercent:0},{sites:31,mode:7,massPercent:71,stiffnessPercent:39,mobilityPercent:153,temperaturePercent:87,timeTenths:173,stepMillis:417},{sites:17,mode:1,massPercent:1,stiffnessPercent:200},{sites:33,mode:16,mobilityPercent:1,temperaturePercent:1},{sites:64,mode:0,massPercent:200},{sites:8,mode:1,timeTenths:0,stepMillis:1},{sites:64,mode:32,timeTenths:200,stepMillis:2000}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{constructor:1},{toString:1},JSON.parse('{"__proto__":{}}'),{sites:8,mode:5},{sites:63,mode:32}];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:validate(s)
science_checks=CHECKS
INTEGER_KEYS={'sites','mode','massPercent','stiffnessPercent','mobilityPercent','temperaturePercent','timeTenths','stepMillis','N','index','site','distance','step'}
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(sites=16.0000000000001),lambda x:x['parameters'].update(mode=1.0000000000001),lambda x:x['model'].update(N=16.0000000000001),lambda x:x['selected'].update(zeroMode=0),lambda x:x['step'].update(eulerStable=1),lambda x:x['frequency'][0].update(spectrum=float('nan')),lambda x:x['time'][0].update(extra=0),lambda x:x['step']['rows'][0].update(step=.0000000000001),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 m=s['selected'];zero=m['zeroMode'];S=m['staticVariance'];positive=[r for r in s['time']if r['time']>=0];half=s['model']['modes'][1:s['model']['N']//2+1]
 return [
 [[[r['site'],r['covariance']]for r in s['model']['spatial']],[None if r['unconstrainedCovariance']is None else[r['site'],r['unconstrainedCovariance']]for r in s['model']['spatial']]],
 [[[r['wave'],r[k]]for r in half]for k in ['rate','rateA','continuumRate','diffusionRate']],
 [[None if zero else[r['time'],r['normalizedCorrelation']]for r in s['time']],[None if zero else[r['time'],r['normalizedResponse']]for r in positive],[]if zero else[[-4,0],[-.01,0]]],
 [[None if zero else[r['scaledFrequency'],r['spectrum']*m['rate']/(2*S)]for r in s['frequency']]]+[[None if zero else[r['scaledFrequency'],r['response'][i]/m['staticResponse']]for r in s['frequency']]for i in [0,1]]+[[None if zero else[r['scaledFrequency'],r['fdtSpectrum']*m['rate']/(2*S)]for r in s['frequency'][::10]]],
 [[None if zero else[r['time'],r[k]/S]for r in positive]for k in ['varianceCold','varianceNoiseOff','varianceEquilibrium']],
 [[None if zero else[r['step'],math.log10(1+r[k]/S)]for r in s['step']['rows']]for k in ['exactVariance','eulerVariance']]+[[]if zero else[[0,math.log10(2)],[64,math.log10(2)]]]
 ]
def expected_tables(s):
 m=s['selected'];a=s['model'];step=s['step']
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'model':[[v]for v in [a['r'],a['kappa'],a['M'],a['theta'],a['continuumCorrelationLength'],a['diffusionCoefficient'],m['laplacian'],m['stiffness'],m['staticVariance'],m['staticResponse'],m['rate'],m['noisePower'],step['rateStep'],step['eulerStatus'],step['eulerStationaryVariance']]],
 'modes':[[r[k]for k in ['index','wave','phaseWave','laplacian','stiffness','staticVariance','staticResponse','rate']]+[None if r['zeroMode']else r['rateA']]+[r[k]for k in ['diffusionRate','continuumRate','noisePower','zeroMode']]for r in a['modes']],
 'space':[[r[k]for k in ['site','distance','covariance','unconstrainedCovariance']]for r in a['spatial']],
 'matrices':[[key,i,row]for key in ['L','H','A','Q','C','P']for i,row in enumerate(a[key])],
 'time':[[r[k]for k in ['time','correlation','response','normalizedCorrelation','normalizedResponse','varianceCold','varianceNoiseOff','varianceEquilibrium','causal']]for r in s['time']],
 'frequency':[[r['scaledFrequency'],r['omega'],r['spectrum']]+r['response']+[r['fdtSpectrum'],r['active']]for r in s['frequency']],
 'windows':[[r[k]for k in ['scaledHalfWidth','halfWidth','spectralMass','fullMass']]for r in s['windows']],
 'profile':[[r[k]for k in ['site','initial','value','covarianceAtTime']]for r in s['profile']],
 'step':[[step[k]]for k in ['dt','rateStep','alpha','noiseVariance','eulerAlpha','eulerNoiseVariance','eulerStable','eulerStatus','eulerStationaryVariance','exactStationaryVariance']],
 'steps':[[r[k]for k in ['step','time','exactVariance','eulerVariance','noiseOffVariance','equilibriumVariance']]for r in step['rows']],
 'boundaries':[list(x)for x in s['boundaries'].items()]
 }
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
   for index,(xy,(x,y))in enumerate(zip(coords,points)):
    assert math.isfinite(x)and math.isfinite(y)and p['xMin']-1e-12<=x<=p['xMax']+1e-12 and p['yMin']-1e-12<=y<=p['yMax']+1e-12
    X=100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
    assert abs(float(xy[0])-X)<=1e-6 and abs(float(xy[1])-Y)<=1e-6;plotcoords+=2
    if series.get('markersOnly')or len(points)==1 or(series.get('boundaryMarkers')and index in [0,len(points)-1]):expected_markers.append((X,Y,series['color']))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for q,(X,Y,color)in zip(actual,expected_markers):assert abs(float(q.get('cx'))-X)<1e-9 and abs(float(q.get('cy'))-Y)<1e-9 and q.get('stroke')==color and q.get('fill')==color
 expected=expected_tables(s);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];rows=[row[1:]for row in t['rows']]if t['key']in ['model','step']else t['rows'];replay(rows,expected[t['key']]);assert all(len(row)==len(t['headers'])for row in t['rows']);table_rows+=len(t['rows'])
mutations=0
for change in [lambda x:x['model']['L'][0].__setitem__(0,1),lambda x:x['model']['Q'][0].__setitem__(1,0),lambda x:x['model']['C'][0].__setitem__(0,0),lambda x:x['model']['modes'][0].update(staticVariance=4),lambda x:x['model']['modes'][1].update(rate=1),lambda x:x['model'].update(diffusionCoefficient=1),lambda x:x['selected'].update(staticResponse=1),lambda x:x['time'][0].update(response=1),lambda x:x['time'][-1].update(varianceCold=0),lambda x:x['time'][-1].update(varianceNoiseOff=0),lambda x:x['frequency'][100].update(spectrum=0),lambda x:x['frequency'][105]['response'].__setitem__(1,-1),lambda x:x['windows'][10].update(spectralMass=1),lambda x:x['profile'][0].update(value=1),lambda x:x['step'].update(noiseVariance=0),lambda x:x['step']['rows'][10].update(eulerVariance=0),lambda x:x['step'].update(eulerStationaryVariance=1),lambda x:x['boundaries'].update(canonicalZeroRemoved=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
