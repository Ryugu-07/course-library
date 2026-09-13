"""Full-schema independent stdlib reconstruction; exact types and complex integrals."""
import math,cmath,json,sys
from decimal import Decimal,localcontext
LIMITS={'speedTenths':(0,40),'rotTenths':(0,40),'turnTenths':(-40,40),'thermalHundredths':(1,100),'mobilityTenths':(1,40),'trapTenths':(1,40),'timeTenths':(1,100),'frequencyTenths':(0,60),'densityHundredths':(0,100),'slowdownTenths':(0,60),'gradientTenths':(1,40),'waveTenths':(0,40)}
CHECKS=0
def close(a,b,key='root'):
 global CHECKS
 CHECKS+=1
 if b is None or isinstance(b,(bool,str)):assert type(a)is type(b)and a==b,(key,a,b)
 elif isinstance(b,dict):
  assert type(a)is dict and set(a)==set(b),key
  for k in b:close(a[k],b[k],k)
 elif isinstance(b,list):
  assert type(a)is list and len(a)==len(b),key
  for x,y in zip(a,b):close(x,y,key)
 else:
  assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a),(key,a)
  if key in LIMITS:assert type(a)is int and a==b,(key,a,b)
  else:assert abs(a-b)<=5e-10+3e-9*abs(b),(key,a,b)
def expected_snapshot(c):
 names=['speed','rot','turn','thermal','mobility','stiffness','time','frequency','density','slowdown','gradient','wave']
 scales=[10,10,10,100,10,10,10,10,100,10,10,10]
 M=dict(zip(names,[c[k]/q for k,q in zip(LIMITS,scales)]))
 v,d,o,D,mu,k,tm,w,rho,slow,kap,wave=[M[k]for k in names]
 T=D/mu
 if v==0:act=0;effective=D;status='passive-diffusion'
 elif d==o==0:act=effective=None;status='ballistic-no-finite-diffusion'
 else:act=v*v*complex(1/complex(d,-o)).real/2;effective=D+act;status='bounded-circular-active-displacement'if d==0 else'mixing-orientation-diffusion'
 diff=dict(active=act,effective=effective,status=status)
 def time(t):
  z=complex(d,-o);u=z*t
  if abs(u)<.5:
   first=t*sum((-u)**n/math.factorial(n+1)for n in range(30))
   second=t*t*sum((-u)**n/math.factorial(n+2)for n in range(30))
  else:first=(1-cmath.exp(-u))/z;second=(t-first)/z
  thermal=4*D*t;active=2*v*v*second.real
  if d==0:active=v*v*t*t if o==0 else (2*v*math.sin(o*t/2)/o)**2
  msd=thermal+active;derivative=4*D+2*v*v*first.real
  asym=4*effective*t-2*v*v*(1/z**2).real if d>0 else thermal if v==0 else None
  return dict(t=t,thermal=thermal,active=active,msd=msd,ballistic=v*v*t*t,shortApprox=thermal+v*v*t*t,longSlope=None if effective is None else 4*effective*t,longAsymptote=asym,derivative=derivative,localExponent=1 if t==0 else t*derivative/msd,orientationCos=cmath.exp(-u).real,orientationSin=cmath.exp(-u).imag,angleMean=o*t,angleVariance=2*d*t,angleMSD=o*o*t*t+2*d*t,conditionalX=v*first.real,conditionalY=v*first.imag,meanConvention='conditional theta(0)=0; not a sample path',isotropicMeanX=0,isotropicMeanY=0,forceStepResponse=mu*t)
 def trap(kk):
  rate=mu*kk;a=complex(rate+d,-o);cross=v/a;thermal=D/rate;av=v*cross.real/(2*rate);var=thermal+av
  atoms=[]
  if d==0 and v>0:atoms=[dict(omega=0,weight=2*math.pi*av)]if o==0 else[dict(omega=x,weight=math.pi*av)for x in [-abs(o),abs(o)]]
  return dict(stiffness=kk,rate=rate,thermalVariance=thermal,activeVariance=av,variance=var,equipartitionReading=kk*var,bathTemperature=T,crossParallel=cross.real,crossPerpendicular=cross.imag,atoms=atoms,atomVariance=sum(x['weight']/(2*math.pi)for x in atoms),spectrumType='thermal-continuum-plus-active-delta-atoms'if atoms else'continuous',stationarity='prescribed-uniform-initial-angle-ensemble; not unique angular mixing'if d==0 else'stationary isotropic ABP ensemble')
 def spec(freq):
  rate=mu*k;H=1/complex(rate,-freq);chi=mu*H;thermal=2*D*abs(H)**2
  # Two-sided transform of (v²/2)exp(-Dr|t|)cos(Omega t).
  forcing=0 if d==0 else v*v/2*((1/complex(d,-(freq-o))).real+(1/complex(d,-(freq+o))).real)
  active=forcing*abs(H)**2;cont=thermal+active;ratio=(2*D+forcing)/(2*mu);atoms=d==0 and v>0
  return dict(omega=freq,thermal=thermal,activeContinuous=active,totalContinuous=cont,responseReal=chi.real,responseImag=chi.imag,bathFDT=thermal,continuousTemperatureReading=ratio,wholeSpectrumTemperatureReading=None if atoms else ratio,ratioConvention='continuous-part omega->0 limit; not division by zero'if freq==0 else'omega S_cont/(2 Im chi)',hasActiveAtoms=atoms)
 def density(rr):
  vv=v*math.exp(-slow*rr);vp=-slow*vv;A=vv+rr*vp;dc=None if d==0 else D+vv*A/(2*d)
  return dict(rho=rr,speed=vv,speedDerivative=vp,polarizationCoupling=A,singleParticleDiffusion=(D if v==0 else None)if d==0 else D+vv*vv/(2*d),collectiveDiffusion=dc,spinodal=None if dc is None else dc<0,reductionStatus='no-fast-angular-relaxation'if d==0 else'long-time-long-wavelength-closure',chirality=0)
 def growth(q):
  den=density(rho);vv=den['speed'];AA=den['polarizationCoupling'];a=-D*q*q-kap*q**4;b=-q*vv;c0=q*AA/2;e=-d-D*q*q
  disc=((a-e)/2)**2+b*c0;det=a*e-b*c0;tr=a+e
  with localcontext()as ctx:
   ctx.prec=60
   aD,bD,cD,eD=map(Decimal.from_float,[a,b,c0,e]);h=(aD+eD)/2;dd=((aD-eD)/2)**2+bD*cD
   if dd>=0:plus={'real':float(h+dd.sqrt()),'imag':0};minus={'real':float(h-dd.sqrt()),'imag':0}
   else:plus={'real':float(h),'imag':float((-dd).sqrt())};minus={'real':float(h),'imag':-float((-dd).sqrt())}
  reduced=None if d==0 else-den['collectiveDiffusion']*q*q-kap*q**4
  return dict(q=q,rho=rho,matrix=[[a,b],[c0,e]],trace=tr,determinant=det,discriminant=disc,plus=plus,minus=minus,maxGrowth=max(plus['real'],minus['real']),reducedGrowth=reduced,gap=d,gradientCoefficient=kap,model='nonchiral two-moment closure with phenomenological density q^4 damping')
 tr=trap(k);sp=spec(w);den=density(rho);tc=None if v==0 else 4*D/(v*v);ceiling=None if max(d,abs(o))==0 else 1/max(d,abs(o))
 windows=dict(thermalCrossover=tc,memoryCeiling=ceiling,scaleSeparation=None if tc is None or ceiling is None else ceiling/tc,rotationalTime=None if d==0 else 1/d,persistenceLength=None if d==0 else v/d,warning='ballistic visibility requires lower time bound as well as upper; no arbitrary pass/fail cutoff')
 flags=['thermalDominatesShortestTime','ballisticWindowNeedsSeparation','chiralitySignRetainedInCrossCorrelation','zeroAngularDiffusionNotClamped','circleNotBallisticDiffusion','ensembleMeanNotSamplePath','ABPNotGaussianProcess','secondMomentsNotFullDistribution','deltaAtomsNotDensityHeights','forceDoesNotTorqueOrientation','linearTrapResponseNotThermalization','nonchiralCollectiveModelSeparate','angularHierarchyTruncated','gradientTermPhenomenological','spinodalNotCoexistence','fuelDissipationNotInferred']
 long=[]
 for q in [.1,.01,.001,.0001,.00001]:
  x=growth(q);x['negativeSlowOverQ2']=-x['maxGrowth']/(q*q);long.append(x)
 return dict(schema='active202-v1',parameters=c,model=M,diffusion=diff,windows=windows,chosenTime=time(tm),times=[time(tm*i/240)for i in range(241)],trap=tr,chosenSpectrum=sp,frequencies=[spec(i/30)for i in range(241)],trapScan=[trap((i+1)/20)for i in range(80)],density=den,densityScan=[density(i/200)for i in range(201)],growth=growth(wave),growthScan=[growth(i/60)for i in range(241)],longwaveScan=long,readings=dict(bathTemperature=T,freeDiffusionTemperature=None if effective is None else effective/mu,trapTemperature=tr['equipartitionReading'],spectralTemperature=sp['wholeSpectrumTemperatureReading']),boundaries=dict.fromkeys(flags,True))
def validate(s):
 c=s['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 close(s,expected_snapshot(c))
INTEGER_KEYS=set(LIMITS)
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-active-matter.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/active-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
// Mount the actual runtime; check names before any reveal or numeric computation.
function mountPresetNames(api){
 class E{
  constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.attrs={};this._text='';this.classList={add(){}};}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  append(...xs){this.children.push(...xs);}
  replaceChildren(...xs){this._text='';this.children=[...xs];}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return Object.hasOwn(this.attrs,k)?this.attrs[k]:null;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(){}
 }
 const doc={createElement(t){return new E(t,this);},querySelector(){return null;}};doc.head=new E('head',doc);
 const root=new E('div',doc);api.mount(root);const all=[];function visit(e){if(e.getAttribute('data-preset')!==null)all.push(e);e.children.forEach(visit);}visit(root);
 if(all.length!==api.PRESETS.length)throw Error('Preset mount count');
 all.forEach((b,i)=>{const p=api.PRESETS[i],expected=p.name??p.label,name=(b.getAttribute('aria-label')||b.textContent).trim();if(typeof expected!=='string'||!expected.trim()||name!==expected||b.textContent.trim()!==expected)throw Error('Missing preset accessible name: '+p.id);});
 return all.length;
}
const mountLabels=mountPresetNames(a);
const originalSource=require('fs').readFileSync(process.argv[1],'utf8'),needle='},p.name);';
if(!originalSource.includes(needle))throw Error('Expected mounted name field');
const mutantSource=originalSource.replace(needle,'},p.label);'),sandbox={module:{exports:{}}};
require('vm').runInNewContext(mutantSource,sandbox);let mountMutations=0;
try{mountPresetNames(sandbox.module.exports);}catch(e){mountMutations++;}
if(mountMutations!==1)throw Error('Blank-label mutation not detected');

const extras=[{speedTenths:0,rotTenths:0},{rotTenths:0,turnTenths:-10},{rotTenths:0,turnTenths:0},{speedTenths:40,rotTenths:1,turnTenths:40,timeTenths:100},{thermalHundredths:1,timeTenths:1},{mobilityTenths:1,trapTenths:1},{mobilityTenths:40,trapTenths:40},{densityHundredths:0},{densityHundredths:100,slowdownTenths:60},{waveTenths:0},{waveTenths:40,gradientTenths:40},{speedTenths:31,rotTenths:17,turnTenths:-13,thermalHundredths:23,mobilityTenths:27,trapTenths:19,timeTenths:71,frequencyTenths:37,densityHundredths:63,slowdownTenths:41,gradientTenths:7,waveTenths:23}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{constructor:1},{toString:1},JSON.parse('{"__proto__":{}}')];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,mountLabels,mountMutations,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:validate(s)
science_checks=CHECKS

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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(speedTenths=20.0000000000001),lambda x:x['parameters'].update(waveTenths=5.0000000000001),lambda x:x['parameters'].update(rotTenths=5.0000000000001),lambda x:x['boundaries'].update(thermalDominatesShortestTime=1),lambda x:x['chosenSpectrum'].update(hasActiveAtoms=0),lambda x:x['frequencies'][0].update(totalContinuous=float('nan')),lambda x:x['model'].update(extra=0),lambda x:x['times'][0].update(meanConvention=None),lambda x:x['trap'].update(stationarity=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 M=s['model'];r=s['readings']
 def points(rows,x,y):return[None if p[y]is None else[p[x],p[y]]for p in rows]
 return [
 [points(s['times'],'t',k)for k in ['msd','thermal','shortApprox','longSlope']],
 [points(s['times'],'t','orientationCos'),points(s['times'],'t','orientationSin'),[[p['t'],math.exp(-M['rot']*p['t'])]for p in s['times']]],
 [*[points(s['frequencies'],'omega',k)for k in ['totalContinuous','bathFDT','activeContinuous']],[[M['frequency'],s['chosenSpectrum']['totalContinuous']]]],
 [points(s['trapScan'],'stiffness','equipartitionReading'),[[.05,r['bathTemperature']],[4,r['bathTemperature']]],[]if r['freeDiffusionTemperature']is None else[[.05,r['freeDiffusionTemperature']],[4,r['freeDiffusionTemperature']]],[]if r['spectralTemperature']is None else[[.05,r['spectralTemperature']],[4,r['spectralTemperature']]]],
 [points(s['densityScan'],'rho','collectiveDiffusion'),points(s['densityScan'],'rho','singleParticleDiffusion'),[[0,M['thermal']],[1,M['thermal']]],[]if s['density']['collectiveDiffusion']is None else[[M['density'],s['density']['collectiveDiffusion']]]],
 [points([p for p in s['growthScan']if p['q']<=.5],'q','maxGrowth'),points([p for p in s['growthScan']if p['q']<=.5],'q','reducedGrowth'),[[0,0],[.5,0]],[[M['wave'],s['growth']['maxGrowth']]]if M['wave']<=.5 else[]]
 ]
def expected_tables(s):
 M=s['model']
 def rows(source,keys):return[[p[k]for k in keys]for p in source]
 return {
 'parameters':[['输入',k,v]for k,v in s['parameters'].items()]+[['参考物理量',k,v]for k,v in M.items()]+[['单位','约定','长度、时间、能量各用固定参考单位；kB=1'],['集体模型','Ω',0]],
 'time':rows(s['times'],['t','thermal','active','msd','ballistic','shortApprox','longSlope','longAsymptote','derivative','localExponent']),
 'orientation':rows(s['times'],['t','orientationCos','orientationSin','angleMean','angleVariance','angleMSD','conditionalX','conditionalY','isotropicMeanX','isotropicMeanY','meanConvention']),
 'frequency':rows(s['frequencies'],['omega','thermal','activeContinuous','totalContinuous','responseReal','responseImag','bathFDT','continuousTemperatureReading','wholeSpectrumTemperatureReading','hasActiveAtoms','ratioConvention']),
 'trap':rows(s['trapScan']+[s['trap']],['stiffness','rate','thermalVariance','activeVariance','variance','equipartitionReading','bathTemperature','crossParallel','crossPerpendicular','spectrumType','stationarity']),
 'atoms':[['δ谱线',p['omega'],p['weight'],'Sxx含weight×δ(ω−此频率)']for p in s['trap']['atoms']]+[['谱类型',None,s['trap']['spectrumType'],'Dr>0时主动谱连续，无δ行'],['原子方差',None,s['trap']['atomVariance'],'全部δ权重之和/(2π)'],['主动总方差',None,s['trap']['activeVariance'],'Dr>0时由连续谱积分得到']],
 'windows':[[k,v]for k,v in s['windows'].items()]+[[k,v]for k,v in s['diffusion'].items()]+[['当前时刻MSD',s['chosenTime']['msd']],['当前时刻主动/热比',s['chosenTime']['active']/s['chosenTime']['thermal']],['当前时刻力阶跃响应',s['chosenTime']['forceStepResponse']]],
 'density':rows(s['densityScan'],['rho','speed','speedDerivative','polarizationCoupling','singleParticleDiffusion','collectiveDiffusion','spinodal','reductionStatus','chirality']),
 'growth':[[p['q'],p['matrix'],p['trace'],p['determinant'],p['discriminant'],p['plus']['real'],p['plus']['imag'],p['minus']['real'],p['minus']['imag'],p['maxGrowth'],p['reducedGrowth']]for p in s['growthScan']],
 'longwave':[[p['q'],p['maxGrowth'],p['negativeSlowOverQ2'],s['density']['collectiveDiffusion'],p['reducedGrowth'],p['gap']]for p in s['longwaveScan']],
 'readings':[[k,v]for k,v in s['readings'].items()]+[['完整谱是否含δ线',s['chosenSpectrum']['hasActiveAtoms']],['连续谱温度比值',s['chosenSpectrum']['continuousTemperatureReading']],['当前集体模型Dcoll',s['density']['collectiveDiffusion']],['当前波数最大增长率',s['growth']['maxGrowth']],['当前长波约化增长率',s['growth']['reducedGrowth']],['当前集体模型',s['growth']['model']]],
 'boundaries':[[k,v]for k,v in s['boundaries'].items()]
 }
NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  domains=[[0,s['model']['time']],[0,s['model']['time']],[0,8],[.05,4],[0,1],[0,.5]]
  replay([p['xMin'],p['xMax']],domains[['time','orientation','spectrum','trap','density','growth'].index(p['key'])])
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
    if series.get('markersOnly')or len(points)==1 or(series.get('boundaryMarkers')and index in [0,len(points)-1]):expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color'],series.get('markerRadius',5)))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for q,(X,Y,color,fill,radius)in zip(actual,expected_markers):assert abs(float(q.get('cx'))-X)<1e-9 and abs(float(q.get('cy'))-Y)<1e-9 and q.get('stroke')==color and q.get('fill')==fill and float(q.get('r'))==radius
 expected=expected_tables(s);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];rows=t['rows'];replay(rows,expected[t['key']]);assert all(len(row)==len(t['headers'])for row in t['rows']);table_rows+=len(t['rows'])
mutations=0
for change in [lambda x:x['model'].update(rot=0),lambda x:x['times'][1].update(active=0),lambda x:x['times'][1].update(msd=0),lambda x:x['times'][50].update(orientationCos=0),lambda x:x['times'][50].update(orientationSin=1),lambda x:x['times'][50].update(angleVariance=0),lambda x:x['times'][50].update(conditionalX=0),lambda x:x['diffusion'].update(active=0),lambda x:x['trap'].update(variance=0),lambda x:x['trap'].update(crossParallel=0),lambda x:x['frequencies'][50].update(activeContinuous=0),lambda x:x['frequencies'][50].update(responseImag=0),lambda x:x['readings'].update(freeDiffusionTemperature=0),lambda x:x['density'].update(speed=0),lambda x:x['density'].update(collectiveDiffusion=0),lambda x:x['growthScan'][30]['plus'].update(real=0),lambda x:x['longwaveScan'][-1].update(negativeSlowOverQ2=0),lambda x:x['boundaries'].update(fuelDissipationNotInferred=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
special=0
for key,change in [('straight',lambda x:x['diffusion'].update(effective=0)),('circle',lambda x:x['trap']['atoms'][0].update(weight=0)),('circle',lambda x:x['chosenSpectrum'].update(wholeSpectrumTemperatureReading=0)),('spinodal',lambda x:x['density'].update(spinodal=False))]:
 mutant=copy.deepcopy(next(x['data']for x in f['records']if x['key']==key));change(mutant)
 try:validate(mutant)
 except AssertionError:special+=1
 else:raise AssertionError('Undetected special boundary mutation '+key)
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'boundaryMutations':special,'self':d['self']['checks'],'replayGuards':guards,'mountLabels':d['mountLabels'],'mountMutations':d['mountMutations']}))
