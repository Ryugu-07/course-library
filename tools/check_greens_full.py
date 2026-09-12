# -*- coding: utf-8 -*-
"""Independent scalar checks using complex resolvents and full Fock-state sums."""
import cmath,math,json,sys
CHECKS=0
def close(a,b,label,tol=2e-10):
 global CHECKS
 CHECKS+=1
 if isinstance(b,bool)or b is None or isinstance(b,str):
  assert a==b and type(a)is type(b),(label,a,b);return
 if isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'shape')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,f'{label}/{i}',tol)
  return
 if isinstance(b,complex):b=[b.real,b.imag];close(a,b,label,tol);return
 assert not isinstance(a,bool)and isinstance(a,(int,float))and math.isfinite(a),(label,'type',a)
 assert abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def validate(s):
 c=s['parameters'];ea,eb,v,g,eta,U,mu,T=[c[k]/100 for k in ['levelPercent','bathPercent','hybridPercent','gammaPercent','etaPercent','interactionPercent','chemicalPercent','temperaturePercent']]
 limits={'levelPercent':(-300,300),'bathPercent':(-300,300),'hybridPercent':(0,200),'gammaPercent':(0,200),'etaPercent':(1,100),'interactionPercent':(0,600),'chemicalPercent':(-200,800),'temperaturePercent':(0,200)}
 assert set(c)==set(limits)
 for k,(lo,hi)in limits.items():assert type(c[k])is int and lo<=c[k]<=hi
 close(s['schema'],'greens193-v1','schema');close(s['eta'],eta,'eta')
 m=s['two'];a=s['atom'];w=s['wide']
 close(m['hamiltonian'],[[ea,v],[v,eb]],'H')
 mean=(ea+eb)/2;r=math.sqrt(((ea-eb)/2)**2+v*v);energies=[mean-r,mean+r]if r else[mean]
 close([p['energy']for p in m['poles']],energies,'two energies')
 for p in m['poles']:
  E=p['energy'];P=p['projector']
  if r==0:expected=[[1,0],[0,1]]
  else:
   other=2*mean-E;expected=[[(ea-other)/(E-other),v/(E-other)],[v/(E-other),(eb-other)/(E-other)]]
  close(P,expected,'projector')
  close(p['weight'],P[0][0],'weight');close(p['visible'],p['weight']>0,'visible');close(p['rank'],2 if r==0 else 1,'rank')
  close(p['derivativeResidue'],1/(1+v*v/(E-eb)**2)if v else P[0][0],'residue')
 close(m['moments'],[1,ea,ea*ea+v*v],'two moments')
 close(m['period'],math.pi/r if r else None,'period');close(m['transferMaximum'],v*v/r**2 if r else 0,'transfer max');close(m['zero'],eb if v else None,'zero')
 states=[(0,0),(1,0),(0,1),(1,1)];K=[U*n*d-mu*(n+d)for n,d in states];ground=min(K)
 probs=[float(E==ground)if T==0 else math.exp(-(E-ground)/T)for E in K];Z=sum(probs);probs=[p/Z for p in probs]
 n=sum(p*st[0]for p,st in zip(probs,states));moments=[0.,0.,0.];rows=[]
 for i,(nu,nd)in enumerate(states):
  if nu:continue
  j=states.index((1,nd));E=K[j]-K[i];weight=probs[i]+probs[j]
  f=(1 if E<0 else 0 if E>0 else .5)if T==0 else (math.exp(-E/T)/(1+math.exp(-E/T))if E>=0 else 1/(1+math.exp(E/T)))
  rows.append((i,j,E,probs[i],probs[j],weight,f))
  for k in range(3):moments[k]+=weight*E**k
 close(a['energies'],K,'K');close(a['probabilities'],probs,'thermal');close(a['minimum'],ground,'minimum');close(a['shiftedPartition'],Z,'partition');close(a['groundMultiplicity'],K.count(ground),'degeneracy')
 close(a['occupation'],n,'n');close(a['doubleOccupation'],probs[3],'double');close(a['occupiedSpectralWeight'],n,'occupied');close(a['moments'],moments,'moments')
 for actual,expected in zip(a['transitions'],rows):close([actual[k]for k in ['from','to','energy','addition','removal','weight','fermi']],expected,'transition')
 close(len(a['transitions']),2,'transition count')
 expectedPoles=[(-mu,1)]if U==0 else[(q[2],q[5])for q in rows]
 close([[p['energy'],p['weight']]for p in a['poles']],expectedPoles,'atomic poles')
 close(a['zero'],U*(1-n)-mu if U*U*n*(1-n)>0 else None,'atomic zero')
 close([w[k]for k in ['center','gamma','weight','fwhm','amplitudeTime','squaredAmplitudeTime','discrete']], [ea,g,1,2*g,1/g if g else None,1/(2*g)if g else None,g==0],'wide')
 close(w['moments'],[1,None,None]if g else[1,ea,ea*ea],'wide moments')
 # Exact grid uses reported pole locations only after the eigenvalue check above;
 # floating bitwise grid membership is not an independent eigenvalue test.
 centers=[(ea,g)]+[(p['energy'],eta)for p in m['poles']]+[(p['energy'],eta)for p in a['poles']]+[(eb,eta)]
 if a['zero']is not None:centers.append((a['zero'],eta))
 required=[(i-100)/10 for i in range(201)]+[e+q*width for e,width in centers for q in [-8,-4,-2,-1,-.5,-.25,0,.25,.5,1,2,4,8]if -10<=e+q*width<=10]
 expectedGrid=sorted(set(required))
 close([row['energy']for row in s['spectrum']],expectedGrid,'energy grid')
 for row in s['spectrum']:
  E=row['energy'];z=complex(E,eta)
  determinant=(z-ea)*(z-eb)-v*v;gt=(z-eb)/determinant
  ga=sum(q[5]/(z-q[2])for q in rows)
  st=z-ea-1/gt;sa=z+mu-1/ga
  close(row['twoGreen'],gt,'two resolvent');close(row['atomGreen'],ga,'Lehmann resolvent')
  close(row['twoA'],-gt.imag/math.pi,'two A');close(row['atomA'],-ga.imag/math.pi,'atom A')
  close(row['twoSigma'],st,'two Dyson',1e-8);close(row['atomSigma'],sa,'atomic Dyson',1e-8)
  close(row['wide']['discrete'],g==0,'discrete');close(row['wide']['atPole'],g==0 and E==ea,'at pole')
  close(row['wide']['value'],(None if E==ea else 0)if g==0 else -(1/complex(E-ea,g)).imag/math.pi,'wide density')
 for i,row in enumerate(s['time']):
  t=(i-10)/10;close(row['time'],t,'time grid');q=row['two']
  close(q['time'],t,'two time');close(q['causal'],t>=0,'causality');close(row['wide']['causal'],t>=0,'wide causality');close(row['wide']['time'],t,'wide time')
  if t<0:
   for name in ['amplitude','transfer','smoothed','anticommutator']:close(q[name],[0,0],'negative')
   for name in ['survival','transferProbability']:close(q[name],None,'negative undefined')
   close(row['atomicAnticommutator'],[0,0],'negative atomic');close(row['atomicSquaredModulus'],None,'negative atomic undefined');close(row['wide']['amplitude'],[0,0],'negative wide');close(row['wide']['envelope'],0,'negative envelope');close(row['wide']['squaredEnvelope'],0,'negative squared');continue
  amplitude=sum(p['weight']*cmath.exp(-1j*p['energy']*t)for p in m['poles'])
  transfer=sum(p['projector'][1][0]*cmath.exp(-1j*p['energy']*t)for p in m['poles'])
  atomic=sum(q[5]*cmath.exp(-1j*q[2]*t)for q in rows)
  close(q['amplitude'],amplitude,'time Fourier');close(q['transfer'],transfer,'transfer Fourier');close(q['anticommutator'],amplitude,'anticomm')
  close(q['survival'],abs(amplitude)**2,'survival');close(q['transferProbability'],abs(transfer)**2,'transfer');close(q['smoothed'],amplitude*math.exp(-eta*t),'display Fourier')
  close(row['atomicAnticommutator'],atomic,'atomic Fourier');close(row['atomicSquaredModulus'],abs(atomic)**2,'atomic squared')
  close(row['wide']['amplitude'],cmath.exp(complex(-g,-ea)*t),'wide Fourier');close(row['wide']['envelope'],math.exp(-g*t),'wide envelope');close(row['wide']['squaredEnvelope'],math.exp(-2*g*t),'wide squared')
 close(len(s['time']),211,'time count')
 def mass(E,width,W):
  if width==0:return 1 if abs(E)<W else .5 if abs(E)==W else 0
  return(math.atan2(W-E,width)-math.atan2(-W-E,width))/math.pi
 for i,row in enumerate(s['windows']):
  W=(i+1)/10;close(row['halfWidth'],W,'window grid')
  close(row['wideMass'],mass(ea,g,W),'wide window')
  close(row['twoMass'],sum(p['weight']*mass(p['energy'],eta,W)for p in m['poles']),'two window')
  close(row['atomMass'],sum(q[5]*mass(q[2],eta,W)for q in rows),'atomic window')
 close(len(s['windows']),100,'window count')
 assert s['windowMass']==s['windows'][-1]
 expectedBoundary=['etaOnlyDisplay','closedTwoLevelNoDecay','atomicPeaksNoDecay','atomicSquaredIsNotPopulation','widePopulationNeedsModel','broadenedHigherMomentsUndefined','singleFermionDiagonal','tZeroIsRightLimit','windowEndpointHalfWeight','atomicTZeroEqualGroundMixture','atomicModelIsNotLatticeMottProof','exactPolesWithinWindow']
 assert set(s['boundaries'])==set(expectedBoundary)
 for k in expectedBoundary:close(s['boundaries'][k],True,k)
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-greens-quasiparticle.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/greens-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{levelPercent:-300,bathPercent:300,hybridPercent:200,etaPercent:1},{levelPercent:300,bathPercent:-300,hybridPercent:1,etaPercent:100},{levelPercent:0,bathPercent:0,hybridPercent:0,gammaPercent:0},{interactionPercent:600,chemicalPercent:800,temperaturePercent:1},{interactionPercent:600,chemicalPercent:-200,temperaturePercent:1},{interactionPercent:0,chemicalPercent:0,temperaturePercent:0},{interactionPercent:400,chemicalPercent:400,temperaturePercent:0},{interactionPercent:600,chemicalPercent:300,temperaturePercent:0},{levelPercent:-179,bathPercent:73,hybridPercent:49,gammaPercent:17,etaPercent:3,interactionPercent:321,chemicalPercent:189,temperaturePercent:29},{levelPercent:199,bathPercent:199,hybridPercent:1,gammaPercent:1},{interactionPercent:1,chemicalPercent:0,temperaturePercent:1},{interactionPercent:599,chemicalPercent:798,temperaturePercent:200}];
const records=[...a.PRESETS.map(p=>a.compute(p.parameters)),...extras.map(p=>a.compute(p))],frozen=f.records.map(r=>a.compute(r.data.parameters));let invalid=0;
const bad=[null,[],1,'x',{x:0},{constructor:1},{toString:1},JSON.parse('{"__proto__":{}}')];for(const[k,[lo,hi]]of Object.entries(a.LIMITS))for(const v of [null,'1',NaN,Infinity,-Infinity,1.5,lo-1,hi+1])bad.push({[k]:v});
for(const p of bad){let rejected=false;try{a.compute(p)}catch(e){rejected=true}if(!rejected)throw Error('Invalid accepted '+JSON.stringify(p));invalid++;}
let feedback=0;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const r=a.feedback(i,j);if(r.correct!==(j===a.QUESTIONS[i][2])||!r.text)throw Error('Feedback');feedback++;}
process.stdout.write(JSON.stringify({records,frozen,invalid,feedback,self:a.selfTest(),rendered:records.map(r=>({plots:a.plots(r),tables:a.tables(r),svgs:a.plots(r).map(a.svg)}))}));
"""
d=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js),str(fixture)],text=True))
assert len(d['records'])==24 and len(d['frozen'])==6 and d['self']['status']=='PASS'
for s in d['records']+d['frozen']+[r['data']for r in f['records']]:validate(s)
science_checks=CHECKS
INTEGER_KEYS={'levelPercent','bathPercent','hybridPercent','gammaPercent','etaPercent','interactionPercent','chemicalPercent','temperaturePercent','rank','from','to','groundMultiplicity'}
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
 lambda x:x.update(schema=None),
 lambda x:x['parameters'].update(levelPercent=100.0000000000001),
 lambda x:x['parameters'].update(temperaturePercent=50.0000000000001),
 lambda x:x['two']['poles'][0].update(rank=1.0000000000001),
 lambda x:x['two'].update(degenerate=0),
 lambda x:x['spectrum'][0]['wide'].update(discrete=0),
 lambda x:x['windows'][0].update(twoMass=float('nan')),
 lambda x:x['atom']['transitions'][0].update(from_=0),
 lambda x:x['atom'].update(groundMultiplicity=2.0000000000001),
 lambda x:x['units'].update(energy=None)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 positive=[r for r in s['time']if r['time']>=0]
 wide=[[[s['wide']['center'],1]],[[s['wide']['center'],0],[s['wide']['center'],1]]]if s['wide']['discrete']else[[[r['energy'],r['wide']['value']]for r in s['spectrum']]]
 return[
 wide,
 [[[r['energy'],r[k]]for r in s['spectrum']]for k in ['twoA','atomA']],
 [[[r['time'],r['two']['amplitude'][i]]for r in positive]for i in [0,1]]+[[[r['time'],r['atomicAnticommutator'][i]]for r in positive]for i in [0,1]]+[[[-1,0],[-.01,0]]],
 [[[r['time'],r['two'][k]]for r in positive]for k in ['survival','transferProbability']]+[[[r['time'],r['wide']['squaredEnvelope']]for r in positive],[[r['time'],sum(x*x for x in r['two']['smoothed'])]for r in positive]],
 [[[r['energy'],r[k][i]]for r in s['spectrum']]for k in ['twoSigma','atomSigma']for i in [0,1]],
 [[[r['halfWidth'],r[k]]for r in s['windows']]for k in ['wideMass','twoMass','atomMass']]
 ]
def expected_tables(s):
 return{
 'parameters':[list(x)for x in s['parameters'].items()],
 'models':[['宽带中心 ea/E0',s['wide']['center']],['宽带半宽 Γ/E0',s['wide']['gamma']],['宽带FWHM/E0',s['wide']['fwhm']],['振幅时间 E0/ℏ；Γ=0为∞',s['wide']['amplitudeTime']],['指定衰减模型平方时间 E0/ℏ；Γ=0为∞',s['wide']['squaredAmplitudeTime']],['显示η/E0',s['eta']],['两能级真实回返周期 E0/ℏ；简并时常数',s['two']['period']],['两能级最大转移概率',s['two']['transferMaximum']],['原子每自旋占据',s['atom']['occupation']]],
 'poles':[['两能级',p['energy'],p['weight'],p['visible']]for p in s['two']['poles']]+[['原子',p['energy'],p['weight'],p['weight']>0]for p in s['atom']['poles']],
 'states':[[['(0,0)','(1,0)','(0,1)','(1,1)'][i],e,s['atom']['probabilities'][i]]for i,e in enumerate(s['atom']['energies'])],
 'transitions':[[r[k]for k in ['from','to','energy','addition','removal','weight','fermi']]+[r['weight']*r['fermi']]for r in s['atom']['transitions']],
 'spectrum':[[r['energy'],r['wide']['value'],r['wide']['discrete']]+r['twoGreen']+[r['twoA']]+r['atomGreen']+[r['atomA']]for r in s['spectrum']],
 'selfenergy':[[r['energy']]+r['twoSigma']+r['atomSigma']for r in s['spectrum']],
 'time':[[r['time'],r['two']['causal']]+r['two']['amplitude']+r['two']['transfer']+[r['two']['survival'],r['two']['transferProbability']]+r['two']['smoothed']+r['wide']['amplitude']+[r['wide']['squaredEnvelope']]+r['atomicAnticommutator']+[r['atomicSquaredModulus']]for r in s['time']],
 'windows':[[r[k]for k in ['halfWidth','wideMass','twoMass','atomMass']]for r in s['windows']],
 'moments':[['宽带；Γ>0时高阶不填']+s['wide']['moments'],['两能级理想谱']+s['two']['moments'],['原子理想谱']+s['atom']['moments']],
 'residues':[[p[k]for k in ['energy','weight','derivativeResidue','projector','rank']]for p in s['two']['poles']],
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
 lambda x:x['wide'].update(fwhm=.3),
 lambda x:x['wide'].update(squaredAmplitudeTime=10),
 lambda x:x['two']['poles'][0].update(weight=.5),
 lambda x:x['two']['poles'][0]['projector'][0].__setitem__(1,0),
 lambda x:x['two']['moments'].__setitem__(2,1),
 lambda x:x['atom']['probabilities'].__setitem__(0,.5),
 lambda x:x['atom']['transitions'][0].update(energy=2),
 lambda x:x['atom'].update(occupation=.3),
 lambda x:x['atom'].update(zero=1),
 lambda x:x['spectrum'][10]['twoGreen'].__setitem__(0,5),
 lambda x:x['spectrum'][10].update(atomA=-1),
 lambda x:x['spectrum'][10]['atomSigma'].__setitem__(1,1),
 lambda x:x['time'][17]['two'].update(survival=0),
 lambda x:x['time'][17]['two']['smoothed'].__setitem__(0,2),
 lambda x:x['time'][17]['atomicAnticommutator'].__setitem__(0,2),
 lambda x:x['time'][0]['wide'].update(envelope=1),
 lambda x:x['windows'][20].update(wideMass=1),
 lambda x:x['boundaries'].update(etaOnlyDisplay=False)
]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
