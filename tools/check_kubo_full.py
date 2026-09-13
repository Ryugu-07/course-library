# -*- coding: utf-8 -*-
"""Independent stdlib full-schema oracle using complex Laplace transforms."""
import math,cmath,json,sys
CHECKS=0
LIMITS={'weightTenths':(1,40),'tauTenths':(1,40),'mixPercent':(0,100),'tauRatioTenths':(1,50),'fieldTenths':(-20,20),'driveTenths':(0,60),'pulseTenths':(1,50),'cutoffUnits':(2,40),'panels':(4,80),'temperatureTenths':(1,40),'gapTenths':(1,40),'windowUnits':(1,40)}
INTEGER_KEYS=set(LIMITS)|{'index','subintervals'}
def close(a,b,key='root'):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(key,'keys')
  for k,v in b.items():close(a[k],v,k)
 elif isinstance(b,list):
  assert isinstance(a,list)and len(a)==len(b),(key,'length')
  for x,y in zip(a,b):close(x,y,key)
 elif b is None or isinstance(b,(str,bool)):assert type(a)is type(b)and a==b,(key,a,b)
 elif key in INTEGER_KEYS:assert type(a)is int and type(b)is int and a==b,(key,a,b)
 else:assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=4e-10*(1+abs(b)),(key,a,b)
def expected_snapshot(c):
 D=c['weightTenths']/10;tau=c['tauTenths']/10;f=c['mixPercent']/100
 E=c['fieldTenths']/10;w=c['driveTenths']/(10*tau);L=c['pulseTenths']*tau/10
 cutoff=c['cutoffUnits']/tau;Tobs=c['windowUnits']*tau;T=c['temperatureTenths']/10;gap=c['gapTenths']/10
 modes=[dict(index=0,weight=D*(1-f),tau=tau),dict(index=1,weight=D*f,tau=tau*c['tauRatioTenths']/10)]
 M=dict(weight=D,tau=tau,field=E,omega=w,pulse=L,cutoff=cutoff,cutoffX=c['cutoffUnits'],window=Tobs,temperature=T,gap=gap,modes=modes)
 def sigma(om):
  vals=[q['weight']/(1/q['tau']-1j*om)for q in modes];z=sum(vals)
  return dict(omega=om,real=z.real,imag=z.imag,modes=[dict(index=i,real=v.real,imag=v.imag)for i,v in enumerate(vals)])
 def kernel(t):return 0 if t<0 else math.fsum(q['weight']*math.exp(-t/q['tau'])for q in modes)
 def pulse_j(q,t):
  if t<=0:return 0
  start=max(0,t-L)
  return E*q['weight']*q['tau']*(math.exp(-start/q['tau'])-math.exp(-t/q['tau']))
 def time(t):
  e=E if 0<=t<L else 0
  contributions=[dict(index=q['index'],current=pulse_j(q,t),derivative=0 if t<0 else q['weight']*e-pulse_j(q,t)/q['tau'])for q in modes]
  return dict(t=t,field=e,kernel=kernel(t),correlation=T*kernel(abs(t)),stepCurrent=0 if t<=0 else E*math.fsum(q['weight']*q['tau']*(1-math.exp(-t/q['tau']))for q in modes),pulseCurrent=math.fsum(q['current']for q in contributions),derivative=math.fsum(q['derivative']for q in contributions),modes=contributions)
 def window_z(om):return sum(q['weight']*(1-cmath.exp((-1/q['tau']+1j*om)*Tobs))/(1/q['tau']-1j*om)for q in modes)
 def window(panels):
  N=2*panels;h=Tobs/N
  nodes=[]
  for i in range(N+1):
   tt=i*h;v=kernel(tt)*cmath.exp(1j*w*tt)
   nodes.append(dict(index=i,t=tt,weight=1 if i in(0,N)else 4 if i%2 else 2,real=v.real,imag=v.imag))
  z=h/3*sum(p['weight']*complex(p['real'],p['imag'])for p in nodes);exact=window_z(w);ss=sigma(w);tail=complex(ss['real'],ss['imag'])-exact
  return dict(panels=panels,subintervals=N,h=h,real=z.real,imag=z.imag,exactReal=exact.real,exactImag=exact.imag,quadratureErrorReal=z.real-exact.real,quadratureErrorImag=z.imag-exact.imag,missingTailReal=tail.real,missingTailImag=tail.imag,tailMagnitude=abs(tail),tailBound=math.fsum(q['weight']*q['tau']*math.exp(-Tobs/q['tau'])for q in modes),nodes=nodes)
 def kk(x,panels,nodes=False):
  om=x/tau;truth=sigma(om)['real']
  if x==c['cutoffUnits']:return dict(x=x,omega=om,cutoff=cutoff,status='hard-cutoff-endpoint-divergence',realExact=None,realNumeric=None,truth=truth,quadratureError=None,modelTail=None,logPV=None,nodes=[]if nodes else None)
  logpv=0 if om==0 else math.log(abs((cutoff-om)/(cutoff+om)))/(2*om)
  gg=om*sigma(om)['imag']
  closed=2/math.pi*(math.fsum(q['weight']*q['tau']*math.atan(cutoff*q['tau'])/(1+(om*q['tau'])**2)for q in modes)+gg*logpv)
  N=2*panels;h=cutoff/N;ledger=[]
  for i in range(N+1):
   nu=i*h
   value=math.fsum(q['weight']*q['tau']**2/((1+(nu*q['tau'])**2)*(1+(om*q['tau'])**2))for q in modes)
   ledger.append(dict(index=i,nu=nu,weight=1 if i in(0,N)else 4 if i%2 else 2,regular=value))
  numeric=2/math.pi*(h/3*math.fsum(p['weight']*p['regular']for p in ledger)+gg*logpv)
  return dict(x=x,omega=om,cutoff=cutoff,status='inside-band-principal-value'if om<cutoff else'outside-band-ordinary-integral',realExact=closed,realNumeric=numeric,truth=truth,quadratureError=numeric-closed,modelTail=truth-closed,logPV=logpv,nodes=ledger if nodes else None)
 def area(om):
  val=math.fsum(q['weight']*math.atan(om*q['tau'])for q in modes);full=math.pi*D/2
  return dict(omega=om,retained=val,full=full,missing=full-val,fraction=val/full)
 beta=1/T;e=math.exp(-beta*gap);pg=1/(1+e);pe=e/(1+e);r=math.tanh(beta*gap/2);chi=2*r/gap
 def field(ff):
  en=math.hypot(gap/2,ff);a=ff/en*math.tanh(beta*en);lin=chi*ff
  return dict(field=ff,positiveEnergy=en,exact=a,linear=lin,difference=a-lin,relativeDifference=None if lin==0 else(a-lin)/lin,comparison='re-equilibrated Gibbs states; not an isolated quench')
 atoms=[]
 for sign in[-1,1]:
  om=sign*gap;unsym=2*math.pi*(pg if sign>0 else pe);im=sign*math.pi*r;factor=-math.expm1(-beta*om)/2
  atoms.append(dict(omega=om,unsym=unsym,sym=math.pi,chiImag=im,coth=1/math.tanh(beta*om/2),fdtSym=im/math.tanh(beta*om/2),fdtUnsymFactor=factor,fromUnsym=factor*unsym))
 qt=[]
 for i in range(241):
  t=(i-40)*Tobs/200;z=pg*cmath.exp(-1j*gap*t)+pe*cmath.exp(1j*gap*t)
  # Hermitian B gives <[B(t),B(0)]> = C(t)-conj(C(t)).
  comm=z-z.conjugate()
  qt.append(dict(t=t,correlationReal=z.real,correlationImag=z.imag,symmetrized=z.real,commutatorReal=comm.real,commutatorImag=comm.imag,retarded=0 if t<0 else(1j*comm).real))
 Q=dict(beta=beta,gap=gap,pg=pg,pe=pe,imbalance=r,chi0=chi,detailedBalance=e,observedWeightRatio=pe/pg,atoms=atoms,field=field(E),fieldScan=[field((i-40)/20)for i in range(81)],times=qt,spectralConvention='Atom weights multiply delta(omega-position); not density heights',timeConvention='hbar=kB=q=1; H0=Delta*sigma_z/2; Hprime=-f*sigma_x')
 max_tau=max(q['tau']for q in modes)
 tt=sorted(set([-tau+i*(tau+L+6*max_tau)/280 for i in range(281)]+[0,L]))
 freq=[]
 for i in range(241):
  x=i/30;om=x/tau;p=sigma(om);v=window_z(om)
  freq.append(dict(x=x,**p,windowReal=v.real,windowImag=v.imag,phase=math.atan2(p['imag'],p['real']),magnitude=math.hypot(p['real'],p['imag']),currentNoise=2*T*p['real']))
 convergence=[]
 for p in[2,4,8,16,32,64,128]:
  a=window(p);del a['nodes'];convergence.append(dict(panels=p,window=a,kk=kk(c['driveTenths']/10,p)))
 chosen=sigma(w);chosen.update(power=E**2*chosen['real']*(1 if w==0 else .5),powerConvention='DC constant field, no factor one-half'if w==0 else'average over a complete nonzero-frequency sinusoidal period')
 keys=['causalKernel','correlationNotRetardedKernel','positiveMixtureNotUniversalMaterial','fixedTotalDrudeWeight','timeWindowNotMaterialDamping','quadratureSeparateFromTruncation','hardCutoffEndpointNotClipped','kkTailUsesKnownModel','finiteBandNotFullCausalityTest','quantumAtomsNotDensitySamples','thermalReferenceNotPostQuenchState','finiteSystemNotSteadyBath','equilibriumKMSRequired','dcPeriodAverageLimitDistinguished','sourceCouplingSignExplicit','unitsModelSpecific']
 return dict(schema='kubo201-v1',parameters=c,model=M,dc=sigma(0)['real'],poles=[dict(index=q['index'],real=0,imag=-1/q['tau'],weight=q['weight'],present=q['weight']>0)for q in modes],chosen=chosen,times=[time(t)for t in tt],frequency=freq,window=window(c['panels']),kk=kk(c['driveTenths']/10,c['panels'],True),kkScan=[kk(c['cutoffUnits']*i/200,c['panels'])for i in range(241)],spectralWeight=area(cutoff),areaScan=[dict(x=c['cutoffUnits']*i/240,**area(c['cutoffUnits']*i/(240*tau)))for i in range(241)],quantum=Q,convergence=convergence,boundaries=dict.fromkeys(keys,True))
def validate(s):
 c=s['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 e=expected_snapshot(c);close(s,e)
 for x,y in [(s["quantum"]["pe"],e["quantum"]["pe"]),*[(a["unsym"],b["unsym"])for a,b in zip(s["quantum"]["atoms"],e["quantum"]["atoms"])]]:
  assert isinstance(x,(int,float))and not isinstance(x,bool)and abs(x-y)<=max(1e-300,4e-10*abs(y)),("rare quantum weight",x,y)
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-kubo-response.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/kubo-certificates/run-snapshot.json'
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

const extras=[{mixPercent:100},{tauRatioTenths:1},{tauRatioTenths:50,windowUnits:1},{cutoffUnits:2,driveTenths:20},{cutoffUnits:2,driveTenths:19},{cutoffUnits:2,driveTenths:21},{driveTenths:0},{temperatureTenths:1,gapTenths:40},{temperatureTenths:40,gapTenths:1},{weightTenths:1,tauTenths:1,tauRatioTenths:1,cutoffUnits:40,panels:4,driveTenths:60,windowUnits:40},{tauRatioTenths:10,mixPercent:77},{weightTenths:31,tauTenths:17,mixPercent:43,tauRatioTenths:27,fieldTenths:-13,driveTenths:37,pulseTenths:19,cutoffUnits:4,panels:23,temperatureTenths:17,gapTenths:29,windowUnits:11}];
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(weightTenths=10.0000000000001),lambda x:x['parameters'].update(panels=40.0000000000001),lambda x:x['window'].update(subintervals=80.0000000000001),lambda x:x['poles'][0].update(present=1),lambda x:x['boundaries'].update(causalKernel=1),lambda x:x['frequency'][0].update(real=float('nan')),lambda x:x['model'].update(extra=0),lambda x:x['window']['nodes'][0].update(index=.0000000000001),lambda x:x['quantum'].update(spectralConvention=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 M=s['model'];scale=M['weight']*M['tau'];Q=s['quantum'];lo=s['times'][0]['t']/M['tau'];hi=s['times'][-1]['t']/M['tau']
 return [
 [[[lo,0],[0,0],[0,M['field']],[M['pulse']/M['tau'],M['field']],[M['pulse']/M['tau'],0],[hi,0]],[[p['t']/M['tau'],p['pulseCurrent']/scale]for p in s['times']],[v for p in s['times']for v in ([[0,0],[0,p['kernel']/M['weight']]]if p['t']==0 else[[p['t']/M['tau'],p['kernel']/M['weight']]])],[[p['t']/M['tau'],p['correlation']/(M['temperature']*M['weight'])]for p in s['times']]],
 [[[p['x'],p['real']/scale]for p in s['frequency']],[[p['x'],p['imag']/scale]for p in s['frequency']],[[p['x'],p['currentNoise']/(2*M['temperature']*scale)]for p in s['frequency']],[[s['parameters']['driveTenths']/10,s['chosen']['real']/scale]]],
 [[[p['x'],p[k]/scale]for p in s['frequency']]for k in ['real','windowReal','imag','windowImag']],
 [[[p['x'],p['truth']/scale]for p in s['kkScan']],*[[(None if p[k]is None else[p['x'],p[k]/scale])for p in s['kkScan']]for k in ['realExact','realNumeric']]],
 [[[p['x'],p['fraction']]for p in s['areaScan']],[[p['x'],1-p['fraction']]for p in s['areaScan']],[[0,1],[s['parameters']['cutoffUnits'],1]]],
 [[[p['omega']/M['gap'],p[k]/math.pi]for p in Q['atoms']]for k in ['unsym','sym','chiImag']]
 ]
def expected_tables(s):
 M=s['model'];Q=s['quantum']
 return {
 'parameters':[['输入',k,v]for k,v in s['parameters'].items()]+[['参考物理量',k,v]for k,v in M.items()]+[['当前频率',k,v]for k,v in s['chosen'].items()]+[['DC','电导',s['dc']],['量子模型','约定',Q['timeConvention']],['量子模型','静态易感率',Q['chi0']],['量子模型','基态概率',Q['pg']],['量子模型','激发态概率',Q['pe']]],
 'time':[[p[k]for k in ['t','field','kernel','correlation','stepCurrent','pulseCurrent','derivative','modes']]for p in s['times']],
 'frequency':[[p[k]for k in ['x','omega','real','imag','magnitude','phase','currentNoise','windowReal','windowImag','modes']]for p in s['frequency']],
 'window':[['节点',p['index'],p['t'],p['weight'],p['real'],p['imag']]for p in s['window']['nodes']]+[['结果',k,v,None,None,None]for k,v in s['window'].items()if k!='nodes'],
 'kk-nodes':[['节点',p['index'],p['nu'],p['weight'],p['regular']]for p in s['kk']['nodes']]+[['结果',k,v,None,None]for k,v in s['kk'].items()if k!='nodes'],
 'kk-scan':[[p[k]for k in ['x','omega','cutoff','status','realExact','realNumeric','truth','quadratureError','modelTail','logPV']]for p in s['kkScan']],
 'weight':[[p[k]for k in ['x','omega','retained','full','missing','fraction']]for p in s['areaScan']],
 'atoms':[[p[k]for k in ['omega','unsym','sym','chiImag','coth','fdtSym','fdtUnsymFactor','fromUnsym']]for p in Q['atoms']],
 'quantum-time':[[p[k]for k in ['t','correlationReal','correlationImag','symmetrized','commutatorReal','commutatorImag','retarded']]for p in Q['times']],
 'nonlinear':[[p[k]for k in ['field','positiveEnergy','exact','linear','difference','relativeDifference','comparison']]for p in Q['fieldScan']+[Q['field']]],
 'convergence':[[p['panels'],p['window']['real'],p['window']['imag'],p['window']['quadratureErrorReal'],p['window']['quadratureErrorImag'],p['window']['missingTailReal'],p['window']['missingTailImag'],p['kk']['realNumeric'],p['kk']['quadratureError'],p['kk']['modelTail']]for p in s['convergence']],
 'boundaries':[[k,v]for k,v in s['boundaries'].items()]+[['极点',s['poles']],['谱线',Q['spectralConvention']],['谱线详细平衡比',Q['detailedBalance']],['实际权重比',Q['observedWeightRatio']]]
 }

NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  if p['key']=='quantum':assert all(q.get('markersOnly')for q in p['series'])
  domains=[[s['times'][0]['t']/s['model']['tau'],s['times'][-1]['t']/s['model']['tau']],[0,8],[0,8],[0,1.2*s['parameters']['cutoffUnits']],[0,s['parameters']['cutoffUnits']],[-1.5,1.5]]
  replay([p['xMin'],p['xMax']],domains[['time','frequency','window','kk','weight','quantum'].index(p['key'])])
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
for change in [lambda x:x['model'].update(tau=0),lambda x:x['times'][0].update(kernel=1),lambda x:x['times'][0].update(correlation=0),lambda x:x['times'][40].update(pulseCurrent=99),lambda x:x['frequency'][50].update(real=0),lambda x:x['frequency'][50].update(imag=0),lambda x:x['window']['nodes'][0].update(weight=2),lambda x:x['window'].update(missingTailReal=0),lambda x:x['kk'].update(realExact=0),lambda x:x['kkScan'][200].update(realExact=0),lambda x:x['spectralWeight'].update(full=0),lambda x:x['quantum'].update(pg=0),lambda x:x['quantum']['atoms'][0].update(unsym=0),lambda x:x['quantum']['times'][100].update(commutatorImag=0),lambda x:x['quantum']['field'].update(exact=0),lambda x:x['quantum'].update(chi0=0),lambda x:x['convergence'][0]['window'].update(real=0),lambda x:x['boundaries'].update(quantumAtomsNotDensitySamples=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
cold=next(x for x in d['records']if x['parameters']['temperatureTenths']==1 and x['parameters']['gapTenths']==40)
for change in [lambda x:x['quantum'].update(pe=0),lambda x:x['quantum']['atoms'][0].update(unsym=0)]:
 mutant=copy.deepcopy(cold);change(mutant)
 try:validate(mutant)
 except AssertionError:pass
 else:raise AssertionError('Rare quantum line rounded to zero')
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'rareLineMutations':2,'self':d['self']['checks'],'replayGuards':guards,'mountLabels':d['mountLabels'],'mountMutations':d['mountMutations']}))
