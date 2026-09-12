# -*- coding: utf-8 -*-
"""Independent complex-matrix evolution and exact rational chiral checks (stdlib)."""
import math,cmath,json,sys
from fractions import Fraction as F
CHECKS=0
def close(a,b,label,tol=3e-9):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict) and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(tuple,list)):
  assert isinstance(a,(tuple,list)) and len(a)==len(b),(label,'length')
  for i,(x,y) in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif isinstance(b,complex):close(a,[b.real,b.imag],label,tol)
 elif b is None or isinstance(b,(bool,str)):assert type(a)is type(b) and a==b,(label,a,b)
 else:
  assert isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a),(label,a)
  assert abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def eye(n):return [[complex(i==j) for j in range(n)] for i in range(n)]
def product(A,B):return [[sum(a*b for a,b in zip(row,col)) for col in zip(*B)] for row in A]
def dagger(A):return [[z.conjugate() for z in col] for col in zip(*A)]
def mv(A,v):return [sum(a*b for a,b in zip(row,v)) for row in A]
def expm(A):
 # Scaling/squaring of the full matrix, independent of submitted Fourier evolution.
 n=len(A);norm=max(sum(abs(z) for z in row) for row in A);scale=max(0,math.ceil(math.log2(norm/.25))) if norm else 0
 B=[[z/2**scale for z in row] for row in A];S=eye(n);T=eye(n)
 for k in range(1,40):
  T=[[z/k for z in row] for row in product(T,B)];S=[[x+y for x,y in zip(a,b)] for a,b in zip(S,T)]
  if max(abs(z) for row in T for z in row)<1e-17:break
 else:raise AssertionError('matrix exponential convergence')
 for _ in range(scale):S=product(S,S)
 return S
def pair(q):return [q.numerator,q.denominator]
def sm_expected():
 defs=[('Q','3',3,2,F(1,6)),('L','1',1,2,F(-1,2)),('u^c','bar3',3,1,F(-2,3)),('d^c','bar3',3,1,F(1,3)),('e^c','1',1,1,F(1))];fields=[]
 for name,color,n,m,Y in defs:
  t=[F(1,2),F(-1,2)] if m==2 else [F(0)]
  anomaly=dict(zip(['hyperchargeCubed','gravityHypercharge','colorSquaredHypercharge','weakSquaredHypercharge','colorCubed'],[n*m*Y**3,n*m*Y,m*Y/2 if n==3 else F(0),n*Y/2 if m==2 else F(0),F(m*(1 if color=='3' else -1 if color=='bar3' else 0))]))
  fields.append(dict(name=name,chirality='left-handed Weyl',color=color,colorDimension=n,weakDimension=m,multiplicity=n*m,Y=pair(Y),T3=list(map(pair,t)),charges=[pair(z+Y) for z in t],anomaly={k:pair(v) for k,v in anomaly.items()},weakDoublets=n if m==2 else 0))
 totals={k:pair(sum(F(*f['anomaly'][k]) for f in fields)) for k in fields[0]['anomaly']};assert all(v==[0,1] for v in totals.values())
 yukawa=[]
 for name,ys in [('Q H u^c',[F(1,6),F(1,2),F(-2,3)]),('Q H† d^c',[F(1,6),F(-1,2),F(1,3)]),('L H† e^c',[F(-1,2),F(-1,2),F(1)])]:yukawa.append(dict(name=name,hypercharges=list(map(pair,ys)),sum=pair(sum(ys))))
 return dict(convention='all fermions left-handed; Qelectric=T3+Y; T(fundamental)=1/2; A(3)=1',fields=fields,totals=totals,weylComponents=15,weakDoublets=4,wittenParity=0,higgs=dict(name='H',spin=0,color='1',weakDimension=2,Y=[1,2],charges=[[1,1],[0,1]],includedInFermionAnomalies=False),yukawa=yukawa,rightHandedNeutrinoIncluded=False)
def validate(s):
 c=s['parameters'];limits={'fluxDegrees':(-360,360),'chi0Degrees':(-360,360),'chi1Degrees':(-360,360),'chi2Degrees':(-360,360),'chi3Degrees':(-360,360),'hoppingPercent':(0,200),'timeTenths':(0,200),'nonabelianDegrees':(0,180)}
 assert set(c)==set(limits)
 for k,(lo,hi) in limits.items():assert type(c[k]) is int and lo<=c[k]<=hi
 close(s['schema'],'gauge195-v1','schema');close(s['units'],dict(energy='E0',time='hbar/E0',phase='radians; controls in degrees',flux='dimensionless U(1) holonomy angle; period 2pi',sites='four-site periodic ring; external nondynamical links'),'units')
 flux=math.radians(c['fluxDegrees']);J=c['hoppingPercent']/100;chi=[math.radians(c['chi'+str(i)+'Degrees']) for i in range(4)];omega=[cmath.exp(1j*x) for x in chi];O=[[omega[i] if i==j else 0j for j in range(4)] for i in range(4)]
 links=[cmath.exp(1j*flux/4)]*4;edges=[(0,1),(1,2),(2,3),(3,0)];translinks=[omega[i]*z/omega[j] for z,(i,j) in zip(links,edges)];H=[[0j]*4 for _ in range(4)]
 for (i,j),z in zip(edges,links):H[i][j]=-J*z;H[j][i]=-J*z.conjugate()
 Hp=product(product(O,H),dagger(O));psi=[.5,.5j,-.5,-.5j];psip=mv(O,psi)
 def bilinear(v,u):return [v[i].conjugate()*z*v[j] for z,(i,j) in zip(u,edges)]
 matter=bilinear(psi,links);mp=bilinear(psip,translinks);wrong=bilinear(psip,links);W=math.prod(links);Wp=math.prod(translinks);op=links[0]*links[1];opp=translinks[0]*translinks[1];eigen=[]
 for n in range(4):
  k=math.pi*n/2;v=[cmath.exp(1j*k*j)/2 for j in range(4)];E=-2*J*math.cos(k+flux/4)
  assert max(abs(a-E*b) for a,b in zip(mv(H,v),v))<1e-12
  eigen.append(dict(index=n,momentum=k,energy=E,vector=v,transformedVector=mv(O,v)))
 expected=dict(flux=flux,J=J,chi=chi,omega=omega,links=links,transformedLinks=translinks,psi=psi,transformedPsi=psip,H=H,transformedH=Hp,eigen=eigen,matter=matter,transformedMatter=mp,wrongMatter=wrong,energyExpectation=sum(z.conjugate()*x for z,x in zip(psi,mv(H,psi))).real,transformedEnergyExpectation=sum(z.conjugate()*x for z,x in zip(psip,mv(Hp,psip))).real,wrongEnergyExpectation=sum(z.conjugate()*x for z,x in zip(psip,mv(H,psip))).real,wilson=W,transformedWilson=Wp,reversedWilson=W.conjugate(),wilsonPhase=cmath.phase(W),wilsonAction=1-W.real,open=op,transformedOpen=opp,dressedOpen=psi[0].conjugate()*op*psi[2],transformedDressedOpen=psip[0].conjugate()*opp*psip[2],initial=[1+0j,0j,0j,0j],transformedInitial=[omega[0],0j,0j,0j])
 # Static real components must use the complex-pair schema too.
 expected['psi']=[complex(z) for z in psi]
 close(s['ring'],expected,'ring')
 def time_expected(t,v,vp):
  dv=[-1j*z for z in mv(H,v)];p=[abs(z)**2 for z in v];pp=[abs(z)**2 for z in vp];current=[-2*J*z.imag for z in bilinear(v,links)];cp=[-2*J*z.imag for z in bilinear(vp,translinks)]
  return dict(time=t,amplitude=v,transformedAmplitude=vp,derivative=dv,probability=p,transformedProbability=pp,current=current,transformedCurrent=cp,densityDerivative=[2*(z.conjugate()*d).real for z,d in zip(v,dv)],continuity=[current[i]-current[(i-1)%4] for i in range(4)],norm=sum(p))
 U=expm([[-.1j*z for z in row] for row in H]);Up=expm([[-.1j*z for z in row] for row in Hp]);v=[1+0j,0j,0j,0j];vp=[omega[0],0j,0j,0j];times=[]
 for i in range(201):times.append(time_expected(i/10,v,vp));v=mv(U,v);vp=mv(Up,vp)
 close(s['time'],times,'time')
 t=c['timeTenths']/10;v=mv(expm([[-1j*t*z for z in row] for row in H]),[1,0,0,0]);vp=mv(expm([[-1j*t*z for z in row] for row in Hp]),[omega[0],0,0,0]);close(s['selectedTime'],time_expected(t,v,vp),'selectedTime')
 scan=[]
 for degrees in range(-360,361,3):
  f=math.radians(degrees);scan.append(dict(degrees=degrees,flux=f,energies=[-2*J*math.cos(math.pi*n/2+f/4) for n in range(4)]))
 close(s['fluxScan'],scan,'fluxScan')
 pauli={'x':[[0,1],[1,0]],'y':[[0,-1j],[1j,0]],'z':[[1,0],[0,-1]]}
 def rot(axis,a):return expm([[1j*a*z for z in row] for row in pauli[axis]])
 alpha=math.radians(c['nonabelianDegrees']);A=rot('x',alpha);B=rot('z',alpha);ls=[A,B,dagger(A),dagger(B)];axes=['x','y','z','x'];om=[rot(axis,x/2) for axis,x in zip(axes,chi)];tls=[product(product(om[i],u),dagger(om[j])) for u,(i,j) in zip(ls,edges)]
 K=eye(2);Kp=eye(2)
 for u,up in zip(ls,tls):K=product(K,u);Kp=product(Kp,up)
 rev=dagger(K);comm=[[a-b for a,b in zip(r,q)] for r,q in zip(product(A,B),product(B,A))];tr=lambda M:sum(M[i][i] for i in range(2))/2
 close(s['nonabelian'],dict(alpha=alpha,axes=axes,omega=om,links=ls,transformedLinks=tls,A=A,B=B,wilson=K,transformedWilson=Kp,reversedWilson=rev,normalizedTrace=tr(K),transformedNormalizedTrace=tr(Kp),reversedNormalizedTrace=tr(rev),commutator=comm,norm=math.sqrt(sum(abs(z)**2 for row in comm for z in row)),abelianCommutator=1+0j),'nonabelian')
 close(s['nonabelianScan'],[dict(degrees=d,alpha=math.radians(d),normalizedTrace=complex(1-2*math.sin(math.radians(d))**4),abelian=1) for d in range(181)],'nonabelianScan')
 close(s['standardModel'],sm_expected(),'standardModel')
 keys=['externalLinksNotFullGaugeDynamics','transformInitialStateTogether','onlyDressedOpenPathInvariant','nonabelianWilsonMatrixCovariant','nonabelianTraceInvariant','fluxPeriodPermutesBranches','gaugePrincipleDoesNotFixMatter','allLeftHandedAnomalyConvention','higgsNotInFermionAnomalies','anomalyCancellationNotUniqueSMProof','noDecayLifetimeHeuristic']
 close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/u1-plaquette.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/gauge-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{fluxDegrees:-359,chi0Degrees:13,chi1Degrees:-177,chi2Degrees:311,chi3Degrees:-299,hoppingPercent:1,timeTenths:199,nonabelianDegrees:1},{fluxDegrees:359,hoppingPercent:200,timeTenths:200,nonabelianDegrees:179},{fluxDegrees:1,hoppingPercent:200,timeTenths:0,nonabelianDegrees:89},{fluxDegrees:-180,hoppingPercent:0,nonabelianDegrees:91},{fluxDegrees:0,chi0Degrees:360,chi1Degrees:-360,nonabelianDegrees:180},{fluxDegrees:270,timeTenths:7,nonabelianDegrees:37},{fluxDegrees:-270,hoppingPercent:73,timeTenths:173,nonabelianDegrees:123},{fluxDegrees:179,chi2Degrees:179,chi3Degrees:-179},{fluxDegrees:-179,hoppingPercent:199},{fluxDegrees:45,nonabelianDegrees:135},{fluxDegrees:-45,chi0Degrees:-1,chi1Degrees:1},{fluxDegrees:0,hoppingPercent:1,timeTenths:200}];
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
INTEGER_KEYS={'fluxDegrees','chi0Degrees','chi1Degrees','chi2Degrees','chi3Degrees','hoppingPercent','timeTenths','nonabelianDegrees','index','degrees'}
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
for old,new in zip(f['records'],d['frozen']):
 replay(old['data'],new)
 assert old['data']['standardModel']==new['standardModel']
 def rational_types(x):
  if isinstance(x,dict):
   for v in x.values():rational_types(v)
  elif isinstance(x,list):
   for v in x:rational_types(v)
  elif isinstance(x,(int,float))and not isinstance(x,bool):assert type(x)is int
 rational_types(old['data']['standardModel'])
base=f['records'][0]['data'];guards=0
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(fluxDegrees=90.0000000000001),lambda x:x['parameters'].update(hoppingPercent=100.0000000000001),lambda x:x['ring']['eigen'][0].update(index=.0000000000001),lambda x:x['boundaries'].update(transformInitialStateTogether=1),lambda x:x['standardModel']['higgs'].update(includedInFermionAnomalies=0),lambda x:x['time'][0].update(norm=float('nan')),lambda x:x['time'][0].update(extra=0),lambda x:x['fluxScan'][0].update(degrees=-359.9999999999999),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 r=s['ring'];sm=s['standardModel'];ang=lambda z:math.atan2(z[1],z[0]);keys=['hyperchargeCubed','gravityHypercharge','colorSquaredHypercharge','weakSquaredHypercharge','colorCubed'];val=lambda x:x[0]/x[1]
 return [
  [[[j,ang(z)] for j,z in enumerate(r[k])] for k in ['psi','transformedPsi']],
  [[[j,z[i]] for j,z in enumerate(r[k])] for k,i in [('matter',0),('matter',1),('transformedMatter',0),('transformedMatter',1)]],
  [[[q['flux']/math.pi,q['energies'][n]] for q in s['fluxScan']] for n in range(4)],
  [[[q['time'],q['probability'][j]] for q in s['time']] for j in range(4)]+[[[q['time'],q['transformedProbability'][j]] for q in s['time'][::20]] for j in range(4)],
  [[[q['degrees'],q['normalizedTrace'][0]] for q in s['nonabelianScan']],[[q['degrees'],1] for q in s['nonabelianScan']],[[q['degrees'],q['normalizedTrace'][1]] for q in s['nonabelianScan']],[[s['parameters']['nonabelianDegrees'],s['nonabelian']['normalizedTrace'][0]]]],
  [[[j,val(f['anomaly'][k])] for j,f in enumerate(sm['fields'])]+[[5,val(sm['totals'][k])]] for k in keys]
 ]
def expected_tables(s):
 r=s['ring'];n=s['nonabelian'];sm=s['standardModel'];frac=lambda x:str(F(*x));edges=[[0,1],[1,2],[2,3],[3,0]]
 return {
  'parameters':[list(x) for x in s['parameters'].items()],
  'vertices':[[j,r['chi'][j],r['omega'][j],r['psi'][j],r['transformedPsi'][j]] for j in range(4)],
  'links':[[edges[j]]+[r[k][j] for k in ['links','transformedLinks','matter','transformedMatter','wrongMatter']] for j in range(4)],
  'wilson':[['U(1)闭回路',r['wilson'],r['transformedWilson']],['裸开路径U01U12',r['open'],r['transformedOpen']],['带端点开路径',r['dressedOpen'],r['transformedDressedOpen']],['静态比较态能量/E0',r['energyExpectation'],r['transformedEnergyExpectation']],['反向U(1)回路',r['reversedWilson'],[r['transformedWilson'][0],-r['transformedWilson'][1]]],['只改ψ的能量（通常不是规范变换）',r['energyExpectation'],r['wrongEnergyExpectation']],['SU(2)归一迹',n['normalizedTrace'],n['transformedNormalizedTrace']]],
  'hamiltonian':[[label,j,row] for key,label in [('H','原规范'),('transformedH','变换后')] for j,row in enumerate(r[key])],
  'eigen':[[p[k] for k in ['index','momentum','energy','vector','transformedVector']] for p in r['eigen']],
  'time':[[p[k] for k in ['time','amplitude','transformedAmplitude','derivative','probability','transformedProbability','current','transformedCurrent','densityDerivative','continuity','norm']] for p in s['time']],
  'flux':[[q[k] for k in ['degrees','flux','energies']] for q in s['fluxScan']],
  'su2':[[label,n[key]] for key,label in [('A','A'),('B','B'),('commutator','AB−BA'),('wilson','W'),('transformedWilson','变换后W'),('reversedWilson','反向回路W†')]]+[['局域Ω'+str(i)+'，轴'+n['axes'][i],q] for i,q in enumerate(n['omega'])]+[['原链路'+str(i),q] for i,q in enumerate(n['links'])]+[['变换后链路'+str(i),q] for i,q in enumerate(n['transformedLinks'])],
  'su2scan':[[q['degrees'],q['alpha']]+q['normalizedTrace']+[q['abelian']] for q in s['nonabelianScan']],
  'matter':[[f['name'],f['color'],f['weakDimension'],f['multiplicity'],frac(f['Y']),', '.join(map(frac,f['charges']))]+[frac(q) for q in f['anomaly'].values()] for f in sm['fields']],
  'checks':[[k+'合计',frac(v)] for k,v in sm['totals'].items()]+[['Weyl分量总数',sm['weylComponents']],['SU(2)基本双重态数',sm['weakDoublets']],['Witten奇偶性',sm['wittenParity']],['Higgs Y',frac(sm['higgs']['Y'])],['Higgs电荷',', '.join(map(frac,sm['higgs']['charges']))],['Higgs进入费米异常和',False]]+[[v['name']+'的超荷和',frac(v['sum'])] for v in sm['yukawa']]+[list(x) for x in s['boundaries'].items()]
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
    if series.get('markersOnly')or len(points)==1 or(series.get('boundaryMarkers')and index in [0,len(points)-1]):expected_markers.append((X,Y,series['color'],'none'if series.get('hollow')else series['color'],series.get('markerRadius',5)))
  actual=root.findall(NS+'circle');assert len(actual)==len(expected_markers);markers+=len(actual)
  for q,(X,Y,color,fill,radius)in zip(actual,expected_markers):assert abs(float(q.get('cx'))-X)<1e-9 and abs(float(q.get('cy'))-Y)<1e-9 and q.get('stroke')==color and q.get('fill')==fill and float(q.get('r'))==radius
 expected=expected_tables(s);assert {t['key']for t in render['tables']}==set(expected)
 for t in render['tables']:
  assert t['title']and t['headers'];rows=t['rows'];replay(rows,expected[t['key']]);assert all(len(row)==len(t['headers'])for row in t['rows']);table_rows+=len(t['rows'])
mutations=0
for change in [lambda x:x['ring']['H'][0][1].__setitem__(0,0),lambda x:x['ring']['transformedH'][0][1].__setitem__(1,0),lambda x:x['ring']['links'][0].__setitem__(0,0),lambda x:x['ring']['wilson'].__setitem__(0,1),lambda x:x['ring']['open'].__setitem__(0,0),lambda x:x['ring'].update(energyExpectation=1),lambda x:x['ring']['eigen'][0].update(energy=0),lambda x:x['time'][10]['amplitude'][0].__setitem__(0,0),lambda x:x['time'][10]['current'].__setitem__(0,1),lambda x:x['time'][10]['densityDerivative'].__setitem__(0,1),lambda x:x['selectedTime'].update(norm=0),lambda x:x['fluxScan'][1]['energies'].__setitem__(0,0),lambda x:x['nonabelian']['wilson'][0][0].__setitem__(0,0),lambda x:x['nonabelian']['normalizedTrace'].__setitem__(0,1),lambda x:x['nonabelianScan'][90]['normalizedTrace'].__setitem__(0,1),lambda x:x['standardModel']['fields'][0]['anomaly']['hyperchargeCubed'].__setitem__(0,0),lambda x:x['standardModel'].update(weakDoublets=3),lambda x:x['boundaries'].update(transformInitialStateTogether=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
