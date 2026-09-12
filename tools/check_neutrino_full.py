# -*- coding: utf-8 -*-
"""Stdlib oracle: explicit PMNS entries and complex Jacobi spectral evolution.
Does not use submitted Taylor/scaling implementation or import the runtime.
"""
import math,cmath,json,sys
CHECKS=0
def close(a,b,label,tol=4e-10):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict)and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple))and len(a)==len(b),(label,'length')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(str,bool)):assert type(a)is type(b)and a==b,(label,a,b)
 else:assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def pair(z):z=complex(z);return[z.real,z.imag]
def cmat(M):return[[pair(z)for z in row]for row in M]
def decode(M):return[[complex(*z)for z in row]for row in M]
def adj(A):return[[complex(A[j][i]).conjugate()for j in range(len(A))]for i in range(len(A))]
def mult(A,B):return[[sum(x*y for x,y in zip(r,col))for col in zip(*B)]for r in A]
def eye(n=3):return[[complex(i==j)for j in range(n)]for i in range(n)]
def norm1(A):return max(sum(abs(z)for z in col)for col in zip(*A))
def residue(S):M=mult(adj(S),S);return max(abs(M[i][j]-int(i==j))for i in range(3)for j in range(3))
def trig(deg):
 if deg in [0,90,-90,180,-180]:return{0:(1.,0.),90:(0.,1.),-90:(0.,-1.),180:(-1.,0.),-180:(-1.,0.)}[deg]
 return math.cos(math.radians(deg)),math.sin(math.radians(deg))
def pmns(c):
 a,x=trig(c['theta12Degrees']);b,y=trig(c['theta13Degrees']);d,z=trig(c['theta23Degrees']);re,im=trig(c['deltaDegrees']);e=complex(re,im)
 U=[[a*b,x*b,y*e.conjugate()],[-x*d-a*z*y*e,a*d-x*z*y*e,z*b],[x*z-a*d*y*e,-a*z-x*d*y*e,d*b]]
 R12=[[a,x,0],[-x,a,0],[0,0,1]];R13=[[b,0,y*e.conjugate()],[0,1,0],[-y*e,0,b]];R23=[[1,0,0],[0,d,z],[0,-z,d]]
 return U,dict(R12=cmat(R12),R13=cmat(R13),R23=cmat(R23),U=cmat(U),J=a*x*d*z*b*b*y*im,quartet=pair(U[0][0]*U[1][1]*complex(U[0][1]).conjugate()*complex(U[1][0]).conjugate()),unitarity=cmat(eye()))
def jacobi(K):
 H=[[complex(z)for z in r]for r in K];V=eye();scale=max(norm1(H),1e-300)
 for iteration in range(80):
  p,q=max([(0,1),(0,2),(1,2)],key=lambda ij:abs(H[ij[0]][ij[1]]))
  z=H[p][q];r=abs(z)
  if r<=2e-16*scale:break
  tau=(H[q][q].real-H[p][p].real)/(2*r)
  t=(1 if tau>=0 else -1)/(abs(tau)+math.hypot(1,tau));co=1/math.hypot(1,t);si=t*co;phase=z/r
  J=eye();J[p][p]=J[q][q]=co;J[p][q]=si*phase;J[q][p]=-si*phase.conjugate()
  H=mult(mult(adj(J),H),J);V=mult(V,J)
 else:raise AssertionError('Jacobi did not converge')
 w=[H[i][i].real for i in range(3)]
 # Independent eigensystem residual, not a normalization repair.
 assert max(abs(sum(K[i][k]*V[k][j]for k in range(3))-V[i][j]*w[j])for i in range(3)for j in range(3))<3e-14*max(1,norm1(K))
 return w,V
KAPPA=1/(2*.1973269804);COEF=7.632e-5
def spectral(K,factor):
 w,V=jacobi(K)
 return mult([[v*cmath.exp(-1j*factor*w[j])for j,v in enumerate(row)]for row in V],adj(V))
def evolution(K,factor):
 trace=sum(K[i][i].real for i in range(3))/3;H=[[z-(trace if i==j else 0)for j,z in enumerate(row)]for i,row in enumerate(K)]
 n=norm1(H)*abs(factor);s=max(0,math.ceil(math.log2(n/.5)))if n else 0;x=n/2**s
 S=spectral(K,factor)
 return dict(matrix=cmat(S),tracePerDimension=trace,traceless=cmat(H),factor=factor,squarings=s,terms=24,scaledNorm=x,stepTaylorTailBound=math.exp(x)*x**25/math.factorial(25),unitarityResidual=0.)
def probability(S):return[[abs(S[b][a])**2 for b in range(3)]for a in range(3)]
def densities(S):return[[[S[i][a]*complex(S[j][a]).conjugate()for j in range(3)]for i in range(3)]for a in range(3)]
def prop(c,E=None,L=None,density=None,anti=None,U=None,full=False):
 E=c['energyCenti']/100 if E is None else E;L=c['baselineKm']if L is None else L;density=c['densityCenti']/100 if density is None else density;anti=bool(c['antineutrino'])if anti is None else anti
 U=pmns(c)[0]if U is None else U
 U=[[complex(v).conjugate()for v in row]for row in U]if anti else U
 m=[0,c['dm21Micro']*1e-6,c['dm31TenMicro']*1e-5];M=mult([[v*m[j]for j,v in enumerate(row)]for row in U],adj(U));A=(-1 if anti else 1)*COEF*density*E
 K=[[v+(A if i==j==0 else 0)for j,v in enumerate(row)]for i,row in enumerate(M)];t=KAPPA*L/E
 S=spectral(K,t);P=probability(S)
 base=dict(energy=E,baseline=L,density=density,antineutrino=anti,probability=P)
 if not full:return{**base,'unitarityResidual':0.}
 return{**base,'U':cmat(U),'massSquaredDifferences':m,'massMatrix':cmat(M),'matterA':A,'K':cmat(K),'evolution':evolution(K,t),'rowSums':[sum(row)for row in P],'columnSums':[sum(col)for col in zip(*P)],'densities':[cmat(R)for R in densities(S)]}
def two(c,density):
 co,si=trig(2*c['theta12Degrees']);dm=c['dm21Micro']*1e-6;E=c['energyCenti']/100;L=c['baselineKm'];A=(-1 if c['antineutrino']else 1)*COEF*density*E;d=dm*co-A;b=dm*si;gap=math.hypot(d,b);amp=b*b/(gap*gap)if gap else None;phase=KAPPA*gap*L/(2*E);p=amp*math.sin(phase)**2 if gap else 0.
 return dict(density=density,theta=c['theta12Degrees'],dm=dm,E=E,L=L,A=A,diagonalDifference=d,twiceOffDiagonal=b,effectiveGap=gap,mixingAmplitude=amp,halfPhase=phase,conversion=p,survival=1-p)
LIMITS={'theta12Degrees':(0,90),'theta13Degrees':(0,90),'theta23Degrees':(0,90),'deltaDegrees':(-180,180),'dm21Micro':(0,200),'dm31TenMicro':(-500,500),'energyCenti':(1,1000),'baselineKm':(0,13000),'densityCenti':(0,1300),'antineutrino':(0,1),'logEnergyWidthPercent':(0,30)}
def validate(s):
 global CHECKS
 c=s['parameters'];assert set(c)==set(LIMITS)
 for k,(lo,hi)in LIMITS.items():assert type(c[k])is int and lo<=c[k]<=hi
 U,mix=pmns(c);close(s['mix'],mix,'PMNS')
 close(s['schema'],'neutrino198-v1','schema')
 close(s['units'],dict(energy='GeV',baseline='km',density='g/cm^3; electron fraction Ye=0.5',massSquared='eV^2; relative to m1^2',kappa=KAPPA,hbarc=.1973269804,matterCoefficient=COEF,probabilityIndex='row initial flavor; column final flavor; flavors e,mu,tau',amplitudeIndex='row final flavor; column initial flavor',model='three active flavors; constant matter; no absorption'),'units')
 def fullcheck(p,e,label):
  global CHECKS
  close(p,e,label)
  # The reported residual is measured on the observed matrix, and the tiny Taylor
  # bound is checked relatively; neither is hidden by the general absolute tolerance.
  measured=residue(decode(p['evolution']['matrix']))
  assert abs(measured-p['evolution']['unitarityResidual'])<3e-15
  x=p['evolution']['scaledNorm'];tail=math.exp(x)*x**25/math.factorial(25)
  assert abs(p['evolution']['stepTaylorTailBound']-tail)<=max(1e-300,2e-13*tail)
  CHECKS+=2
 for key,rho,anti in [('current',None,None),('vacuum',0,None),('neutrino',None,False),('antineutrino',None,True),('vacuumNeutrino',0,False),('vacuumAntineutrino',0,True)]:
  fullcheck(s[key],prop(c,density=rho,anti=anti,U=U,full=True),key)
 H=decode(s['current']['evolution']['traceless']);B=2*norm1(H);period=2*math.pi*(c['energyCenti']/100)/(KAPPA*B)if B>0 else None
 mx=max(3000,c['baselineKm']);mx=min(mx,8*period)if period is not None else mx
 close(s['baselinePlot'],dict(max=mx,spanBound=B,periodLowerBound=period,currentVisible=c['baselineKm']<=mx,samples=201),'baseline metadata')
 assert len(s['baselineScan'])==201 and len(s['energyScan'])==121 and len(s['cpScan'])==181 and len(s['densityScan'])==131 and len(s['twoFlavorScan'])==131
 for i,p in enumerate(s['baselineScan']):close(p,prop(c,L=mx*i/200,U=U),'baseline scan')
 for i,p in enumerate(s['energyScan']):
  lg=-2+3*i/120;close(p,dict(log10Energy=lg,**prop(c,E=10**lg,U=U)),'energy scan')
 for i,p in enumerate(s['densityScan']):close(p,prop(c,density=i/10,U=U),'density scan')
 for i,p in enumerate(s['cpScan']):
  delta=-180+2*i;cc={**c,'deltaDegrees':delta};uu,mm=pmns(cc)
  expected=dict(delta=delta,J=mm['J'])
  for key,rho,anti in [('nu',None,False),('anti',None,True),('vacNu',0,False),('vacAnti',0,True)]:expected[key]=prop(cc,density=rho,anti=anti,U=uu)
  close(p,expected,'CP scan')
 for i,p in enumerate(s['twoFlavorScan']):close(p,two(c,i/10),'two scan')
 t=two(c,c['densityCenti']/100);close(s['twoFlavorCurrent'],t,'two current')
 resonance=c['dm21Micro']*1e-6*trig(2*c['theta12Degrees'])[0]/((-1 if c['antineutrino']else 1)*COEF*(c['energyCenti']/100))if t['twiceOffDiagonal']!=0 else None
 close(s['twoFlavorResonanceDensity'],resonance if resonance is not None and resonance>=0 else None,'resonance')
 zs=[(j-4)/2 for j in range(9)];raw=[math.exp(-z*z/2)for z in zs];weights=[w/sum(raw)for w in raw];sigma=c['logEnergyWidthPercent']/100
 samples=[];rho=[[[0j]*3 for _ in range(3)]for _ in range(3)]
 for z,w in zip(zs,weights):
  E=c['energyCenti']/100*math.exp(sigma*z);p=prop(c,E=E,U=U,full=True)
  sample=dict(z=z,weight=w,energy=E,evolution=p['evolution'],probability=p['probability'],densities=p['densities']);samples.append(sample)
  for a,R in enumerate(p['densities']):
   R=decode(R)
   for i in range(3):
    for j in range(3):rho[a][i][j]+=w*R[i][j]
 avg=dict(kind='nine-positive-energy-lines; classical incoherent mixture',logWidth=sigma,samples=samples,weightSum=sum(weights),meanEnergy=sum(p['energy']*p['weight']for p in samples),densities=[cmat(R)for R in rho],probability=[[R[i][i].real for i in range(3)]for R in rho],purities=[sum(mult(R,R)[i][i].real for i in range(3))for R in rho],traces=[pair(sum(R[i][i]for i in range(3)))for R in rho])
 close(s['averaged'],avg,'ensemble')
 for R in rho:assert min(jacobi(R)[0])>=-3e-10;CHECKS+=1
 phases=[0,.37,.83];Um=[[z*cmath.exp(1j*phases[j])for j,z in enumerate(row)]for row in U]
 invariants=dict(majoranaPhases=phases,majoranaU=cmat(Um),majoranaProbability=prop(c,U=Um)['probability'],commonMassSquaredShift=.007,shiftedProbability=prop(c,U=U)['probability'])
 close(s['invariances'],invariants,'phase invariants')
 keys=['illustrativeParametersNotGlobalFit','relativeMassSquaredCanBeNegative','majoranaPhasesCancelInOscillation','matterAsymmetryNotIntrinsicCP','constantDensityNotSolarProfile','noAbsorptionOrSterileLeakage','energyMixtureNotWavepacketSeparation','nineEnergyLinesNotPrecisionQuadrature','energyPlotDiscreteNotInterpolated','baselineZoomAvoidsAliasing','probabilitiesNotClampedOrRenormalized','degenerateTwoFlavorAngleNotDefined','absoluteMassNotMeasuredByOscillation']
 close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')
 assert set(s)==set(['schema','parameters','units','mix','current','vacuum','neutrino','antineutrino','vacuumNeutrino','vacuumAntineutrino','averaged','baselinePlot','baselineScan','energyScan','cpScan','densityScan','twoFlavorScan','twoFlavorCurrent','twoFlavorResonanceDensity','invariances','boundaries'])
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-flavor-neutrino.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/neutrino-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{theta12Degrees:90},{theta13Degrees:90},{theta23Degrees:90},{deltaDegrees:180},{dm21Micro:0,dm31TenMicro:0,densityCenti:0},{theta12Degrees:0,dm21Micro:0,densityCenti:0},{theta12Degrees:45,theta13Degrees:0,theta23Degrees:0,densityCenti:0},{theta12Degrees:90,antineutrino:1},{energyCenti:1,baselineKm:13000,dm21Micro:200,dm31TenMicro:500,logEnergyWidthPercent:30},{baselineKm:0,logEnergyWidthPercent:30},{theta12Degrees:17,theta13Degrees:63,theta23Degrees:29,deltaDegrees:77,dm21Micro:131,dm31TenMicro:-417,energyCenti:39,baselineKm:9977,densityCenti:711,antineutrino:1,logEnergyWidthPercent:23},{energyCenti:1000,densityCenti:1300}];
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
INTEGER_KEYS=set(LIMITS)|{'squarings','terms','samples','delta','theta','L'}
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(theta12Degrees=33.0000000000001),lambda x:x['parameters'].update(energyCenti=250.0000000000001),lambda x:x['current']['evolution'].update(terms=24.0000000000001),lambda x:x['current'].update(antineutrino=0),lambda x:x['baselinePlot'].update(currentVisible=1),lambda x:x['baselineScan'][0]['probability'][0].__setitem__(0,float('nan')),lambda x:x['energyScan'][0].update(extra=0),lambda x:x['cpScan'][0].update(delta=-180.0000000000001),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 c=s['parameters']
 return [
  [[[p['baseline'],p['probability'][1][b]]for p in s['baselineScan']]for b in range(3)]+[[[c['baselineKm'],s['current']['probability'][1][b]]]if s['baselinePlot']['currentVisible']else[]for b in range(3)],
  [[[p['log10Energy'],p['probability'][1][b]]for p in s['energyScan']]for b in range(3)],
  [[[p['delta'],p[k]['probability'][1][0]]for p in s['cpScan']]for k in ['nu','anti','vacNu','vacAnti']],
  [[[p['density'],p['probability'][1][b]]for p in s['densityScan']]for b in range(3)],
  [[[i,p['probability'][1][b]]for i,p in enumerate(s['averaged']['samples'])]for b in range(3)]+[[[0,s['averaged']['probability'][1][b]],[8,s['averaged']['probability'][1][b]]]for b in range(3)],
  [[None if p['mixingAmplitude']is None else[p['density'],p['mixingAmplitude']]for p in s['twoFlavorScan']],[[p['density'],p['conversion']]for p in s['twoFlavorScan']],[[c['densityCenti']/100,s['twoFlavorCurrent']['conversion']]]]
 ]
def expected_tables(s):
 names={'current':'当前粒子与物质','vacuum':'当前粒子真空','neutrino':'ν在物质中','antineutrino':'反ν在物质中','vacuumNeutrino':'ν在真空中','vacuumAntineutrino':'反ν在真空中'}
 flavors=['e','μ','τ']
 def scan(p):return[p['energy'],p['baseline'],p['density'],p['antineutrino'],*p['probability'],p['unitarityResidual']]
 def two(p):return[p[k]for k in ['density','A','diagonalDifference','twiceOffDiagonal','effectiveGap','mixingAmplitude','halfPhase','conversion','survival']]
 matrices=[['PMNS '+k,'三味',s['mix'][k]]for k in ['R12','R13','R23','U','unitarity']]+[['Jarlskog不变量','J',s['mix']['J']],['复四元积','Ue1 Uμ2 Ue2* Uμ1*',s['mix']['quartet']]]
 for k,n in names.items():
  p=s[k];matrices.extend([['实际U',n,p['U']],['真空质量平方矩阵',n,p['massMatrix']],['物质项A/eV²',n,p['matterA']],['K/eV²',n,p['K']],['K−tr(K)I/3',n,p['evolution']['traceless']],['演化振幅S（行末味，列初味）',n,p['evolution']['matrix']]])
 current=[]
 for k,n in names.items():
  p=s[k];v=p['evolution'];current.append([n,p['energy'],p['baseline'],p['density'],*p['probability'],p['rowSums'],p['columnSums'],v['unitarityResidual'],v['squarings'],v['scaledNorm'],v['stepTaylorTailBound']])
 i=s['invariances'];a=s['averaged'];b=s['baselinePlot']
 return {
  'parameters':[list(x)for x in s['parameters'].items()],
  'matrices':matrices,
  'current':current,
  'densities':[[n,flavors[j],R,None,None]for k,n in names.items()for j,R in enumerate(s[k]['densities'])]+[['九能量线平均',flavors[j],R,a['traces'][j],a['purities'][j]]for j,R in enumerate(a['densities'])],
  'ensemble':[[j,p['z'],p['weight'],p['energy'],p['evolution']['matrix'],p['probability'],*p['densities']]for j,p in enumerate(a['samples'])],
  'baseline':[scan(p)for p in s['baselineScan']],
  'energy':[[p['log10Energy'],*scan(p)]for p in s['energyScan']],
  'cp':[[p['delta'],p['J'],n,*scan(p[k])]for p in s['cpScan']for k,n in [('nu','ν，物质'),('anti','反ν，物质'),('vacNu','ν，真空'),('vacAnti','反ν，真空')]],
  'density':[scan(p)for p in s['densityScan']],
  'two':[['扫描',*two(p)]for p in s['twoFlavorScan']]+[['当前',*two(s['twoFlavorCurrent'])]],
  'invariants':[
   ['Majorana列相位/rad',i['majoranaPhases']],['加入列相位的U',i['majoranaU']],['加入列相位后的P',i['majoranaProbability']],['共同质量平方平移/eV²',i['commonMassSquaredShift']],['共同平移后的P',i['shiftedProbability']],
   ['能谱权重和',a['weightSum']],['能谱平均能量/GeV',a['meanEnergy']],['ln(E/E0)参数σ',a['logWidth']],['平均态全部概率',a['probability']],['平均态三种纯度',a['purities']],
   ['基线图上限/km',b['max']],['谱跨度的范数上界/eV²',b['spanBound']],['最短周期的下界/km',b['periodLowerBound']],['当前基线是否在图内',b['currentVisible']],['两味非平凡共振密度（可超出图域）',s['twoFlavorResonanceDensity']]
  ],
  'boundaries':[list(x)for x in list(s['boundaries'].items())+list(s['units'].items())]
 }

NS='{http://www.w3.org/2000/svg}';plotcoords=markers=table_rows=0
for s,render in zip(d['records'],d['rendered']):
 assert len(render['plots'])==6 and len(render['tables'])==12 and len(render['svgs'])==6
 for p,source,expected in zip(render['plots'],render['svgs'],expected_points(s)):
  replay([q['points']for q in p['series']],expected)
  assert p['xMin']<p['xMax']and p['yMin']<p['yMax']
  if p['key']in ['energy','density']:assert all(q.get('markersOnly')for q in p['series'])
  if p['key']=='cp':
   high=min(1.04,1.1*max(.01,max(r[k]['probability'][1][0]for r in s['cpScan']for k in ['nu','anti','vacNu','vacAnti'])))
   replay([p['yMin'],p['yMax']],[0,high])
  if p['key']=='baseline':replay([p['xMin'],p['xMax']],[0,s['baselinePlot']['max']])

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
for change in [lambda x:x['mix']['U'][0][0].__setitem__(0,0),lambda x:x['mix'].update(J=1),lambda x:x['current'].update(matterA=0),lambda x:x['current']['K'][0][0].__setitem__(0,0),lambda x:x['current']['evolution']['matrix'][0][0].__setitem__(0,0),lambda x:x['current']['probability'][1].__setitem__(0,0),lambda x:x['antineutrino']['probability'][1].__setitem__(0,0),lambda x:x['vacuum']['probability'][1].__setitem__(0,0),lambda x:x['baselineScan'][100]['probability'][1].__setitem__(0,0),lambda x:x['energyScan'][60]['probability'][1].__setitem__(0,0),lambda x:x['cpScan'][90]['anti']['probability'][1].__setitem__(0,0),lambda x:x['densityScan'][50]['probability'][1].__setitem__(0,0),lambda x:x['twoFlavorScan'][50].update(conversion=1),lambda x:x['averaged']['samples'][0].update(weight=0),lambda x:x['averaged']['purities'].__setitem__(1,1),lambda x:x['invariances']['majoranaProbability'][1].__setitem__(0,0),lambda x:x['baselinePlot'].update(max=123),lambda x:x['boundaries'].update(energyMixtureNotWavepacketSeparation=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
