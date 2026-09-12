# -*- coding: utf-8 -*-
"""Independent stdlib vacuum, analytic spectrum, currents and gauge-pole audit."""
import math,json,sys
CHECKS=0
def close(a,b,label,tol=3e-9):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict) and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple)) and len(a)==len(b),(label,'length')
  for i,(x,y) in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(bool,str)):assert type(a)is type(b) and a==b,(label,a,b)
 else:
  assert isinstance(a,(int,float)) and not isinstance(a,bool) and math.isfinite(a),(label,a)
  assert abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def transpose(A):return list(map(list,zip(*A)))
def product(A,B):return [[sum(x*y for x,y in zip(row,col)) for col in zip(*B)] for row in A]
def rot(M,t):
 R=[[math.sin(t),math.cos(t)],[math.cos(t),-math.sin(t)]]
 return product(product(R,M),transpose(R))
def scaled_close(A,B,scale,label):close([[x/scale for x in row] for row in A],[[x/scale for x in row] for row in B],label,2e-12)
def validate(s):
 c=s['parameters'];limits={'gPercent':(0,200),'gpPercent':(0,200),'scaleGeV':(1,500),'massSquaredPercent':(-100,100),'lambdaPercent':(1,200),'angleOffsetDegrees':(-90,90),'yukawaPercent':(0,200),'xiPercent':(0,200)}
 assert set(c)==set(limits)
 for k,(lo,hi)in limits.items():assert type(c[k]) is int and lo<=c[k]<=hi
 close(s['schema'],'electroweak196-v1','schema');close(s['units'],dict(mass='GeV',massSquared='GeV^2',potential='GeV^4; plotted V/S^4',couplings='dimensionless',angle='radians; offset control in degrees',model='tree level; canonical gauge kinetic terms; one Y=1/2 scalar doublet'),'units')
 S=c['scaleGeV'];a=c['massSquaredPercent']/100;L=c['lambdaPercent']/100;m2=a*S*S;broken=a<0;v=S*math.sqrt(-a/L) if broken else 0;h2=-2*m2 if broken else m2;t2=0 if broken else m2
 phi=[0,0,v,0];b=[[0,0],[v/math.sqrt(2),0]];H=[[(h2 if i==2 else t2) if i==j else 0 for j in range(4)] for i in range(4)]
 expected=dict(S=S,a=a,lambda_=L,m2=m2,broken=broken,phase='broken-tree-vacuum' if broken else 'quartic-critical-origin' if a==0 else 'symmetric-tree-vacuum',v=v,phi=phi,doublet=b,potentialMinimum=-m2*m2/(4*L) if broken else 0,radialMassSquared=h2,tangentMassSquared=t2,scalarEigenvalues=[t2,t2,h2,t2],radialMass=math.sqrt(max(0,h2)),globalGoldstones=3 if broken else 0)
 expected['lambda']=expected.pop('lambda_');vac=s['vacuum'];close({k:q for k,q in vac.items() if k not in ['gradient','hessian']},expected,'vacuum');scaled_close(vac['hessian'],H,max(1,S*S,v*v*L),'Hessian')
 assert len(vac['gradient'])==4
 for q in vac['gradient']:assert isinstance(q,(int,float)) and math.isfinite(q) and abs(q)<=32*sys.float_info.epsilon*(abs(m2)*v+L*v**3+1)
 g=c['gPercent']/100;gp=c['gpPercent']/100;r=math.hypot(g,gp);reference=math.atan2(gp,g) if r else 0;sn=gp/r if r else None;co=g/r if r else None;e=g*gp/r if r else 0;w2=g*g*v*v/4;z2=(g*g+gp*gp)*v*v/4;massScale=max(1,z2)
 M=[[w2,0,0,0],[0,w2,0,0],[0,0,w2,-g*gp*v*v/4],[0,0,-g*gp*v*v/4,gp*gp*v*v/4]];N=[row[2:] for row in M[2:]];angle=reference+math.radians(c['angleOffsetDegrees']);rank=0 if not v else 3 if g else 1 if gp else 0
 generators=[[[[0,0],[.5,0]],[[.5,0],[0,0]]],[[[0,0],[0,-.5]],[[0,.5],[0,0]]],[[[.5,0],[0,0]],[[0,0],[-.5,0]]],[[[.5,0],[0,0]],[[0,0],[.5,0]]]];q=v/(2*math.sqrt(2));directions=[[[g*q,0],[0,0]],[[0,-g*q],[0,0]],[[0,0],[-g*q,0]],[[0,0],[gp*q,0]]]
 sin=math.sin(reference);cos=math.cos(reference);eigen=[dict(name=name,massSquared=mass,vector=vec) for name,mass,vec in [('W1',w2,[1,0,0,0]),('W2',w2,[0,1,0,0]),('A-reference',0,[0,0,sin,cos]),('Z-reference',z2,[0,0,cos,-sin])]]
 dof=dict(beforeGauge=8,beforeScalar=4,massiveVectors=rank,masslessVectors=4-rank,physicalScalars=4-rank,absorbedGoldstones=rank,physicalGlobalGoldstones=3-rank if broken else 0,afterGauge=3*rank+2*(4-rank),total=12)
 G=s['gauge'];expected=dict(g=g,gp=gp,r=r,couplings=[g,g,g,gp],generators=generators,directions=directions,matrix=M,neutral=N,thetaW=reference if r else None,thetaReference=reference,sinW=sn,cosW=co,e=e,mW2=w2,mZ2=z2,mW=math.sqrt(w2),mZ=math.sqrt(z2),mPhoton=0,angleUsed=angle,eigen=eigen,photonGenerator=[[[1,0],[0,0]],[[0,0],[0,0]]],Qvacuum=[[0,0],[0,0]],neutralMixingIdentifiable=bool(v and r),neutralRank=1 if z2 else 0,rank=rank,rho=1 if v and g else None,fermiConstant=1/(math.sqrt(2)*v*v) if w2 else None,chargedCurrentCoupling=g/math.sqrt(2),dof=dof)
 close({k:q for k,q in G.items() if k not in ['rotation','referenceRotation']},expected,'gauge')
 scaled_close(G['rotation'],rot(N,angle),massScale,'rotation');scaled_close(G['referenceRotation'],rot(N,reference),massScale,'referenceRotation')
 currents=[]
 for name,T,Y in [('νL',.5,-.5),('eL',-.5,-.5),('eR',0,-1),('uL',.5,1/6),('uR',0,2/3),('dL',-.5,1/6),('dR',0,-1/3)]:
  Q=T+Y;A=g*T*sn+gp*Y*co if r else None;Z=g*T*co-gp*Y*sn if r else None
  currents.append(dict(name=name,T3=T,Y=Y,Q=Q,photonCoupling=A,photonChargeFormula=e*Q if r else None,zCoupling=Z,zChargeFormula=r*(T-sn*sn*Q) if r else None,usesPhysicalChiralityNotConjugate=True))
 close(s['currents'],currents,'currents');y=c['yukawaPercent']/100;close(s['yukawa'],dict(y=y,mass=y*v/math.sqrt(2),hCoupling=y/math.sqrt(2) if broken else None,formalYukawaVertex=y/math.sqrt(2),massOverV=y/math.sqrt(2) if v else None,illustrativeSingleCoupling=True),'yukawa')
 def gf(xi):return dict(xi=xi,channels=[dict(name=name,massSquared=mass,physicalMass=math.sqrt(mass),goldstoneGaugeMassSquared=xi*mass if mass>0 else None,ghostMassSquared=xi*mass,gaugePoleMass=math.sqrt(xi*mass),absorbed=mass>0) for name,mass in [('W1',w2),('W2',w2),('Z',z2)]],physicalPhotonMass=0,unphysicalPolesAreNotExtraParticles=True)
 close(s['gaugeFix'],gf(c['xiPercent']/100),'gaugeFix');close(s['xiScan'],[gf(i/100) for i in range(201)],'xiScan')
 xmax=max(2,1.6*v/S);points=[]
 for i in range(401):
  x=-xmax+2*xmax*i/400;points.append(dict(x=x,field=x*S,potentialOverS4=.5*a*x*x+.25*L*x**4,derivativeOverS3=a*x+L*x**3,curvatureOverS2=a+3*L*x*x))
 close(s['potential'],points,'potential')
 phase=[]
 for i in range(201):
  aa=(i-100)/100;phase.append(dict(a=aa,vOverS=math.sqrt(-aa/L) if aa<0 else 0,radialMassSquaredOverS2=-2*aa if aa<0 else aa,tangentMassSquaredOverS2=0 if aa<0 else aa,potentialMinimumOverS4=-aa*aa/(4*L) if aa<0 else 0))
 close(s['phaseScan'],phase,'phaseScan');assert len(s['mixingScan'])==181
 for i,row in enumerate(s['mixingScan']):
  offset=i-90;t=reference+math.radians(offset);R=rot(N,t);close({k:x for k,x in row.items() if k!='rotation'},dict(offsetDegrees=offset,angle=t,normalized=[[x/z2 for x in rr] for rr in R] if z2 else None),'mixingScan');scaled_close(row['rotation'],R,massScale,'mixing raw')
 coupling=[]
 for i in range(201):
  gg=i/100;rr=math.hypot(g,gg);coupling.append(dict(gp=gg,mW=math.sqrt(w2),mZ=v*rr/2,e=g*gg/rr if rr else 0,thetaW=math.atan2(gg,g) if rr else None))
 close(s['couplingScan'],coupling,'couplingScan')
 keys=['gaugeRedundancyNotPhysicallyBroken','treeLevelNotPrecisionFit','scalarMinimumNotFiniteTemperaturePrediction','zeroCouplingsAreDecouplingLimits','wrongBasisNotPhotonMass','unphysicalGaugePolesNotObservables','globalGoldstonesOnlyWhenNotAbsorbed','fermiMatchingRequiresMassiveW','yukawaHierarchyNotExplained','protonMassNotElementaryYukawa','neutrinoMassRequiresExtension']
 close(s['boundaries'],dict.fromkeys(keys,True),'boundaries');return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/electroweak-mixing.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/electroweak-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{gPercent:200,gpPercent:200,scaleGeV:500,massSquaredPercent:-100,lambdaPercent:1,angleOffsetDegrees:90,xiPercent:200},{gPercent:1,gpPercent:1,scaleGeV:1,massSquaredPercent:-1,lambdaPercent:200,xiPercent:0},{gPercent:0,gpPercent:200,massSquaredPercent:-100,lambdaPercent:1},{gPercent:200,gpPercent:0,massSquaredPercent:0},{gPercent:0,gpPercent:0,massSquaredPercent:100},{gPercent:1,gpPercent:200,angleOffsetDegrees:-90},{gPercent:200,gpPercent:1,angleOffsetDegrees:89},{gPercent:37,gpPercent:83,scaleGeV:173,massSquaredPercent:-39,lambdaPercent:71,yukawaPercent:153,xiPercent:23},{gPercent:0,gpPercent:0,massSquaredPercent:-1,lambdaPercent:200},{gPercent:200,gpPercent:200,massSquaredPercent:1},{massSquaredPercent:-100,lambdaPercent:200,scaleGeV:1},{massSquaredPercent:100,lambdaPercent:1,scaleGeV:500}];
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
INTEGER_KEYS={'gPercent','gpPercent','scaleGeV','massSquaredPercent','lambdaPercent','angleOffsetDegrees','yukawaPercent','xiPercent','S','rank','neutralRank','globalGoldstones','beforeGauge','beforeScalar','massiveVectors','masslessVectors','physicalScalars','absorbedGoldstones','physicalGlobalGoldstones','afterGauge','total','offsetDegrees'}
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(gPercent=65.0000000000001),lambda x:x['parameters'].update(scaleGeV=246.0000000000001),lambda x:x['gauge'].update(rank=3.0000000000001),lambda x:x['vacuum'].update(broken=1),lambda x:x['gaugeFix']['channels'][0].update(absorbed=1),lambda x:x['potential'][0].update(field=float('nan')),lambda x:x['potential'][0].update(extra=0),lambda x:x['gauge']['dof'].update(total=12.0000000000001),lambda x:x['units'].update(mass=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 v=s['vacuum'];G=s['gauge'];S=v['S'];a=v['v']/S;minimum=v['potentialMinimum']/S**4
 return [
  [[[q['x'],q['potentialOverS4']] for q in s['potential']],[[-a,minimum],[a,minimum]] if a else [[0,minimum]]],
  [[[q['a'],q['vOverS']] for q in s['phaseScan']]]+[[[q['a'],math.sqrt(max(0,q[k]))] for q in s['phaseScan']] for k in ['radialMassSquaredOverS2','tangentMassSquaredOverS2']],
  [[None if q['normalized'] is None else [q['offsetDegrees'],q['normalized'][i][j]] for q in s['mixingScan']] for i,j in [(0,0),(1,1),(0,1)]]+[[[s['parameters']['angleOffsetDegrees'],G['rotation'][0][0]/G['mZ2']]] if G['mZ2'] else []],
  [[[q['gp'],q[k]/S] for q in s['couplingScan']] for k in ['mW','mZ']]+[[[G['gp'],G['mZ']/S]]],
  [[None if q[k] is None else [i,q[k]] for i,q in enumerate(s['currents'])] for k in ['photonCoupling','zCoupling']],
  [[[q['xi'],G[k]/S] for q in s['xiScan']] for k in ['mW','mZ']]+[[[q['xi'],q['channels'][i]['gaugePoleMass']/S] if q['channels'][i]['absorbed'] else None for q in s['xiScan']] for i in [0,2]]+[[[s['gaugeFix']['xi'],s['gaugeFix']['channels'][i]['gaugePoleMass']/S]] if s['gaugeFix']['channels'][i]['absorbed'] else [] for i in [0,2]]
 ]
def expected_tables(s):
 v=s['vacuum'];G=s['gauge']
 return {
  'parameters':[list(x) for x in s['parameters'].items()],
  'vacuum':[[k,q] for k,q in v.items() if k!='hessian']+[[k,G[k]] for k in ['g','gp','r','thetaW','thetaReference','sinW','cosW','e','mW2','mZ2','mW','mZ','mPhoton','angleUsed','neutralMixingIdentifiable','neutralRank','rank','rho','fermiConstant','chargedCurrentCoupling']],
  'generators':[[['T1','T2','T3','Y'][i],G['couplings'][i],T,G['directions'][i],G['Qvacuum'] if i==3 else None] for i,T in enumerate(G['generators'])],
  'matrices':[[label,i,row] for label,M in [('标量Hessian/GeV²',v['hessian']),('规范M²/GeV²',G['matrix']),('中性M0²/GeV²',G['neutral']),('参考角旋转/GeV²',G['referenceRotation']),('用户角旋转/GeV²',G['rotation'])] for i,row in enumerate(M)],
  'eigen':[[p[k] for k in ['name','massSquared','vector']] for p in G['eigen']],
  'currents':[[q[k] for k in ['name','T3','Y','Q','photonCoupling','photonChargeFormula','zCoupling','zChargeFormula']] for q in s['currents']],
  'accounting':[list(x) for obj in [G['dof'],s['yukawa'],s['boundaries']] for x in obj.items()],
  'potential':[[q[k] for k in ['x','field','potentialOverS4','derivativeOverS3','curvatureOverS2']] for q in s['potential']],
  'phase':[[q[k] for k in ['a','vOverS','radialMassSquaredOverS2','tangentMassSquaredOverS2','potentialMinimumOverS4']] for q in s['phaseScan']],
  'mixing':[[q[k] for k in ['offsetDegrees','angle','rotation','normalized']] for q in s['mixingScan']],
  'couplings':[[q[k] for k in ['gp','mW','mZ','e','thetaW']] for q in s['couplingScan']],
  'gaugefix':[[q['xi']]+[p[k] for k in ['name','massSquared','physicalMass','goldstoneGaugeMassSquared','ghostMassSquared','gaugePoleMass','absorbed']] for q in s['xiScan'] for p in q['channels']]
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
for change in [lambda x:x['vacuum'].update(v=0),lambda x:x['vacuum']['hessian'][0].__setitem__(0,1),lambda x:x['vacuum']['gradient'].__setitem__(0,1),lambda x:x['gauge']['matrix'][0].__setitem__(0,0),lambda x:x['gauge']['directions'][0][0].__setitem__(0,0),lambda x:x['gauge'].update(mZ=0),lambda x:x['gauge'].update(fermiConstant=0),lambda x:x['gauge']['eigen'][0]['vector'].__setitem__(0,0),lambda x:x['currents'][0].update(zCoupling=0),lambda x:x['potential'][201].update(potentialOverS4=1),lambda x:x['phaseScan'][0].update(radialMassSquaredOverS2=0),lambda x:x['mixingScan'][90]['rotation'][0].__setitem__(0,1),lambda x:x['couplingScan'][100].update(mZ=0),lambda x:x['gaugeFix']['channels'][0].update(ghostMassSquared=0),lambda x:x['xiScan'][10]['channels'][0].update(goldstoneGaugeMassSquared=0),lambda x:x['gauge']['dof'].update(physicalGlobalGoldstones=3),lambda x:x['yukawa'].update(mass=0),lambda x:x['boundaries'].update(wrongBasisNotPhotonMass=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
