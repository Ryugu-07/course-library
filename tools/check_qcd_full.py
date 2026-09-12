# -*- coding: utf-8 -*-
"""Standard-library oracle: Fierz/permutation Casimirs and reference-boundary integration."""
import math,json,sys,itertools
CHECKS=0
def close(a,b,label,tol=4e-10):
 global CHECKS
 CHECKS+=1
 if isinstance(b,dict):
  assert isinstance(a,dict) and set(a)==set(b),(label,'keys')
  for k in b:close(a[k],b[k],label+'/'+k,tol)
 elif isinstance(b,(list,tuple)):
  assert isinstance(a,(list,tuple)) and len(a)==len(b),(label,'length')
  for i,(x,y)in enumerate(zip(a,b)):close(x,y,label+'/'+str(i),tol)
 elif b is None or isinstance(b,(str,bool)):assert type(a)is type(b) and a==b,(label,a,b)
 else:assert isinstance(a,(int,float))and not isinstance(a,bool)and math.isfinite(a)and abs(a-b)<=tol*(1+abs(b)),(label,a,b)
def pair(z):return [z.real,z.imag]
def cvec(v):return [pair(complex(z))for z in v]
def cmat(M):return [cvec(r)for r in M]
def mult(A,B):return [[sum(x*y for x,y in zip(r,col))for col in zip(*B)]for r in A]
def kron(A,B):return [[x*y for x in ar for y in br]for ar in A for br in B]
def mv(A,v):return [sum(x*y for x,y in zip(r,v))for r in A]
def gram(v):return [[x*complex(y).conjugate()for y in v]for x in v]
def ident(n):return [[int(i==j)for j in range(n)]for i in range(n)]
def generators():
 out=[]
 for a,b in [(0,1),(0,2),(1,2)]:
  for phase in [1,-1j]:
   M=[[0j]*3 for _ in range(3)];M[a][b]=phase/2;M[b][a]=complex(phase).conjugate()/2;out.append(M)
 out.insert(2,[[.5,0,0],[0,-.5,0],[0,0,0]])
 out.append([[1/(2*math.sqrt(3)),0,0],[0,1/(2*math.sqrt(3)),0],[0,0,-1/math.sqrt(3)]])
 return out
T=generators();MSTATE=[int(i==j)/math.sqrt(3) for i in range(3) for j in range(3)]
def eps(t):
 if len(set(t))<3:return 0
 return (-1)**sum(t[i]>t[j]for i in range(3)for j in range(i+1,3))
BSTATE=[eps(t)/math.sqrt(6)for t in itertools.product(range(3),repeat=3)]
def color_expected():
 groups={}
 for kind,n,state,spectrum in [('meson',9,MSTATE,[(0,1),(3,8)]),('diquark',9,None,[(4/3,3),(10/3,6)]),('baryon',27,BSTATE,[(0,1),(3,16),(6,10)])]:
  basis=list(itertools.product(range(3),repeat=3 if kind=='baryon'else 2));C=[]
  for i,left in enumerate(basis):
   row=[]
   for j,right in enumerate(basis):
    if kind=='meson':v=3*int(i==j)-int(left[0]==left[1])*int(right[0]==right[1])
    elif kind=='diquark':v=7/3*int(i==j)+int(left==right[::-1])
    else:
     v=3*int(i==j)
     for a,b in [(0,1),(0,2),(1,2)]:
      q=list(right);q[a],q[b]=q[b],q[a];v+=int(tuple(q)==left)
    row.append(v)
   C.append(row)
  groups[kind]={'dimension':n,'casimir':cmat(C),'spectrum':[dict(value=v,multiplicity=m)for v,m in spectrum],'singlet':None if state is None else cvec(state),'projector':None if state is None else cmat(gram(state)),'actions':None if state is None else [cvec([0]*n)for _ in range(8)],'singletMultiplicity':0 if state is None else 1,'pairColorOperator':None if kind=='baryon'else cmat([[(v-8/3*int(i==j))/2 for j,v in enumerate(row)]for i,row in enumerate(C)])}
 return {'generators':[cmat(t)for t in T],'traceGram':cmat([[.5*int(i==j)for j in range(8)]for i in range(8)]),'fundamentalCasimir':cmat([[4/3*int(i==j)for j in range(3)]for i in range(3)]),'groups':groups}
COLOR=color_expected()
def active(q):return 3+sum(q>=t for t in [1.5,5,175])
def beta(n):return 11-2*n/3
def run(q,c,matched):
 alpha0=c['alphaRefMilli']/1000;lo=min(100,q);hi=max(100,q);sign=1 if q>=100 else -1
 ranges=[(lo,hi,c['fixedNf'])]if not matched else [(max(lo,a),min(hi,b),n)for a,b,n in [(0,1.5,3),(1.5,5,4),(5,175,5),(175,math.inf,6)]if min(hi,b)>max(lo,a)]
 # The runtime retains the zero-length reference segment. Its nf is the local active flavor.
 if not ranges:ranges=[(q,q,active(q))]
 seg=[]
 for a,b,n in ranges:
  log=sign*math.log(b/a);seg.append(dict(from_=a,to=b,nf=n,beta0=beta(n),logRatio=log,increment=beta(n)*log/(2*math.pi)));seg[-1]['from']=seg[-1].pop('from_')
 inv=1/alpha0+math.fsum(p['increment']for p in seg);nf=active(q)if matched else c['fixedNf'];a=1/inv if inv>0 else None
 return dict(q=q,matched=matched,referenceScale=100,referenceAlpha=alpha0,nf=nf,beta0=beta(nf),inverse=inv,alpha=a,status='outside-positive-coupling-branch'if a is None else 'large-coupling-warning'if a>=1 else 'positive-one-loop-branch',slopeInverse=beta(nf)/(2*math.pi),betaOneLoop=None if a is None else -beta(nf)*a*a/(2*math.pi),segments=seg)
def potential(r,c,raw_v=None):
 sigma=c['sigmaMilli']/1000;E=c['thresholdCenti']/100;d=c['gapMilli']/1000;V=-4/3*.3*.1973269804/r+sigma*r/.1973269804 if raw_v is None else raw_v;diff=V-E;split=math.hypot(diff,2*d);P=None if split==0 else [[(1-diff/split)/2,-d/split],[-d/split,(1+diff/split)/2]]
 return dict(r=r,sigma=sigma,threshold=E,gap=d,alphaPotential=.3,stringEnergy=V,matrix=[[V,d],[d,E]],eigenvalues=[(V+E-split)/2,(V+E+split)/2],splitting=split,lowerProjector=P,lowerStringWeight=None if P is None else P[0][0])
def validate(s):
 c=s['parameters'];limits={'fixedNf':(0,20),'alphaRefMilli':(20,400),'logQHundred':(-200,600),'thresholdMode':(0,1),'colorAngleDegrees':(0,180),'sigmaMilli':(0,500),'thresholdCenti':(50,500),'gapMilli':(0,300)}
 assert set(c)==set(limits)
 for k,(lo,hi)in limits.items():assert type(c[k])is int and lo<=c[k]<=hi
 close(s['schema'],'qcd197-v1','schema')
 close(s['units'],dict(energy='GeV',distance='fm',stringTension='GeV^2',hbarc=.1973269804,coupling='dimensionless',color='Gell-Mann T=lambda/2; complex [real,imag]',model='one-loop reference running; exact finite color algebra; illustrative two-channel potential'),'units')
 close(s['colors'],COLOR,'color')
 q=10**(c['logQHundred']/100);F=run(q,c,False);M=run(q,c,True)
 close(s['fixed'],F,'fixed');close(s['matched'],M,'matched');close(s['current'],M if c['thresholdMode'] else F,'current')
 b=beta(c['fixedNf']);pole=math.log(100)-2*math.pi/(b*c['alphaRefMilli']/1000)
 try:scale=math.exp(pole)
 except OverflowError:scale=None
 if scale==0:scale=None
 close(s['fixedPole'],dict(nf=c['fixedNf'],beta0=b,logScale=pole,log10Scale=pole/math.log(10),scale=scale,scaleRepresentable=scale is not None,kind='infrared-one-loop-pole'if b>0 else 'ultraviolet-one-loop-pole'),'pole')
 assert len(s['runningScan'])==401
 for i,p in enumerate(s['runningScan']):
  log=-2+i/50;Q=10**log;close(p,dict(log10Q=log,fixed=run(Q,c,False),matched=run(Q,c,True)),'scan')
 thresholds=[]
 for Q in [1.5,5,175]:
  r=run(Q,c,True);n=active(Q);thresholds.append(dict(q=Q,nfBelow=n-1,nfAbove=n,inverse=r['inverse'],alpha=r['alpha'],slopeBelow=beta(n-1)/(2*math.pi),slopeAbove=beta(n)/(2*math.pi),continuityOnlyAtOneLoop=True))
 close(s['thresholds'],thresholds,'thresholds')
 t=math.radians(c['colorAngleDegrees']);sn=math.sin(t/2);co=math.cos(t/2);phase=lambda x:complex(math.cos(x),math.sin(x));R=[[co,sn,0],[-sn,co,0],[0,0,1]];U=[[phase([1,1,-2][i]*t/(2*math.sqrt(3)))*v for v in row]for i,row in enumerate(R)];wrong=mv(kron(U,U),MSTATE);z=sum(a*b for a,b in zip(MSTATE,wrong))
 close(s['rotation'],dict(degrees=c['colorAngleDegrees'],U=cmat(U),unitarity=cmat(ident(3)),mesonCorrect=cvec(MSTATE),mesonWrong=cvec(wrong),baryonCorrect=cvec(BSTATE),mesonFidelity=1,wrongMesonFidelity=abs(z)**2,baryonFidelity=1,wrongMesonDistanceSquared=sum(abs(a-b)**2 for a,b in zip(wrong,MSTATE))),'rotation')
 angles=[]
 for i in range(181):
  a=math.radians(i)/math.sqrt(3);overlap=(2*phase(a)+phase(-2*a))/3;angles.append(dict(degrees=i,mesonFidelity=1,wrongMesonFidelity=abs(overlap)**2,baryonFidelity=1,wrongMesonDistanceSquared=2-2*overlap.real))
 close(s['rotationScan'],angles,'angles')
 close(s['stringScan'],[potential(.05+2.95*i/300,c)for i in range(301)],'string')
 sigma=c['sigmaMilli']/1000;E=c['thresholdCenti']/100;d=c['gapMilli']/1000
 if sigma==0:close(s['crossingR'],None,'no crossing');close(s['crossing'],None,'no crossing data')
 else:
  r=.1973269804*(E+math.sqrt(E*E+4*sigma*4/3*.3))/(2*sigma);close(s['crossingR'],r,'crossing r')
  raw=s['crossing']['rawEvaluation'];close(raw['stringEnergy'],potential(r,c)['stringEnergy'],'raw crossing V')
  # At exact zero gap the eigenvectors are ill conditioned at the crossing. Validate the raw projector
  # against its actual floating matrix, while validating that matrix against the independent potential.
  cross=dict(r=r,energy=E,gap=d,matrix=[[E,d],[d,E]],eigenvalues=[E-d,E+d],lowerStringWeight=.5 if d else None,rawEvaluation=potential(r,c,raw['stringEnergy']))
  close(s['crossing'],cross,'crossing')
 flavors=[]
 for n in range(21):
  b0=beta(n);b1=102-38*n/3;a=c['alphaRefMilli']/1000;flavors.append(dict(nf=n,beta0=b0,beta1=b1,asymptoticallyFreeAtOneLoop=b0>0,betaAtReference=-b0*a*a/(2*math.pi),betaTwoLoopAtReference=-b0*a*a/(2*math.pi)-b1*a**3/(8*math.pi**2),twoLoopPositiveZero=-4*math.pi*b0/b1 if b0>0 and b1<0 else None,twoLoopZeroNotConformalWindowProof=True))
 close(s['flavors'],flavors,'flavors')
 keys=['referenceCouplingHeldFixed','thresholdsAreTeachingInputs','matchingContinuousOnlyAtThisOrder','negativeInverseNotNegativePhysicalCoupling','alphaOneNotUniversalAccuracyBoundary','twoLoopZeroNotPhaseDiagram','colorSingletNotSufficientForBoundState','finiteColorAlgebraNotConfinementProof','potentialParametersNotQCDfit','twoChannelMixingNotLatticeCalculation','confinementNotIdenticalToMassGap','chiralLimitNotPureYangMills']
 close(s['boundaries'],dict.fromkeys(keys,True),'boundaries')
 assert set(s)==set(['schema','parameters','units','fixed','matched','current','fixedPole','thresholds','runningScan','colors','rotation','rotationScan','stringScan','crossingR','crossing','flavors','boundaries'])
 return True
from pathlib import Path
import subprocess,hashlib,shutil,copy,re,xml.etree.ElementTree as ET
prefix=['rtk','proxy']if shutil.which('rtk')else[]
ROOT=Path(__file__).resolve().parents[1]
js=Path(sys.argv[1]).resolve()if len(sys.argv)>1 else ROOT/'course-shared/labs/physics-qcd-hadrons.js'
fixture=Path(sys.argv[2]).resolve()if len(sys.argv)>2 else ROOT/'course-shared/projects/qcd-certificates/run-snapshot.json'
f=json.loads(fixture.read_text());assert f['provenance']['sourceSha256']==hashlib.sha256(js.read_bytes()).hexdigest()
code=r"""
const a=require(process.argv[1]),f=require(process.argv[2]);
const extras=[{fixedNf:20,alphaRefMilli:20,logQHundred:600},{fixedNf:16,alphaRefMilli:20,logQHundred:-200},{fixedNf:17,alphaRefMilli:20,logQHundred:600},{fixedNf:0,alphaRefMilli:400,logQHundred:-200},{thresholdMode:0,logQHundred:200},{thresholdMode:1,logQHundred:200},{sigmaMilli:1,thresholdCenti:500,gapMilli:0},{sigmaMilli:500,thresholdCenti:50,gapMilli:300},{sigmaMilli:0,gapMilli:0},{colorAngleDegrees:1},{colorAngleDegrees:179},{fixedNf:9,alphaRefMilli:321,logQHundred:57,colorAngleDegrees:117,sigmaMilli:37,thresholdCenti:211,gapMilli:17}];
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
INTEGER_KEYS={'fixedNf','alphaRefMilli','logQHundred','thresholdMode','colorAngleDegrees','sigmaMilli','thresholdCenti','gapMilli','nf','nfBelow','nfAbove','dimension','multiplicity','singletMultiplicity','degrees'}
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
for change in [lambda x:x.update(schema=None),lambda x:x['parameters'].update(fixedNf=5.0000000000001),lambda x:x['parameters'].update(alphaRefMilli=120.0000000000001),lambda x:x['colors']['groups']['meson'].update(dimension=9.0000000000001),lambda x:x['current'].update(matched=1),lambda x:x['fixedPole'].update(scaleRepresentable=1),lambda x:x['runningScan'][0]['fixed'].update(inverse=float('nan')),lambda x:x['runningScan'][0].update(extra=0),lambda x:x['rotation'].update(degrees=60.0000000000001),lambda x:x['units'].update(energy=None)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:replay(mutant,base)
 except AssertionError:guards+=1
 else:raise AssertionError('Replay guard')
def expected_points(s):
 c=s['parameters']
 def p(r):return [math.log10(r['q']),r['alpha']]if r['alpha'] is not None and r['alpha']<=1 else None
 return [
  [[[r['log10Q'],r[k]['inverse']]for r in s['runningScan']]for k in ['fixed','matched']]+[[[c['logQHundred']/100,s['current']['inverse']]],[[-2,0],[6,0]]],
  [[p(r[k])for r in s['runningScan']]for k in ['fixed','matched']]+[[p(s['current'])]if p(s['current'])else []],
  [[[i,r['value']]for r in s['colors']['groups'][k]['spectrum']]for i,k in enumerate(['meson','diquark','baryon'])],
  [[[r['degrees'],r[k]]for r in s['rotationScan']]for k in ['mesonFidelity','wrongMesonFidelity']]+[[[c['colorAngleDegrees'],s['rotation']['wrongMesonFidelity']]]],
  [[[r['r'],r[k]]for r in s['stringScan']]for k in ['stringEnergy','threshold']]+[[[r['r'],r['eigenvalues'][i]]for r in s['stringScan']]for i in [0,1]],
  [[[r['nf'],r['beta0']]for r in s['flavors']],[[r['nf'],r['beta1']/10]for r in s['flavors']],[[c['fixedNf'],11-2*c['fixedNf']/3]]]
 ]
def expected_tables(s):
 groups=s['colors']['groups'];R=s['rotation']
 def rr(r):return [r[k]for k in ['q','nf','beta0','inverse','alpha','status','slopeInverse','betaOneLoop']]
 return {
 'parameters':[list(x)for x in s['parameters'].items()],
 'current':[['固定']+rr(s['fixed']),['匹配']+rr(s['matched'])]+[['固定味数极点',k,v,None,None,None,None,None,None]for k,v in s['fixedPole'].items()],
 'matching':[[label]+[p[k]for k in ['from','to','nf','beta0','logRatio','increment']]for label,name in [('固定','fixed'),('匹配','matched')]for p in s[name]['segments']]+[['阈值：nf下/上、倒数、斜率下/上',p['q'],p['q'],[p['nfBelow'],p['nfAbove']],p['inverse'],p['slopeBelow'],p['slopeAbove']]for p in s['thresholds']],
 'generators':[['T'+str(i+1),i,T]for i,T in enumerate(s['colors']['generators'])]+[['tr(TaTb)',i,r]for i,r in enumerate(s['colors']['traceGram'])]+[['ΣTa²=(4/3)I',i,r]for i,r in enumerate(s['colors']['fundamentalCasimir'])],
 'matrices':[[kind,name,i,r]for kind,g in groups.items()for name,key in [('总Casimir','casimir'),('单态投影','projector'),('T1·T2','pairColorOperator')]if g[key]is not None for i,r in enumerate(g[key])],
 'singlets':[row for kind,g in groups.items()if g['singlet']is not None for row in ([[kind,'单态分量',i,z]for i,z in enumerate(g['singlet'])]+[[kind,'总生成元作用',i+1,v]for i,v in enumerate(g['actions'])])],
 'rotation':[['U',i,r]for i,r in enumerate(R['U'])]+[['U†U',i,r]for i,r in enumerate(R['unitarity'])]+[[k,i,v]for k in ['mesonCorrect','mesonWrong','baryonCorrect']for i,v in enumerate(R[k])]+[[k,'值',R[k]]for k in ['mesonFidelity','wrongMesonFidelity','baryonFidelity','wrongMesonDistanceSquared']],
 'spectrum':[[kind,p['value'],p['multiplicity'],None if kind=='baryon'else (p['value']-8/3)/2]for kind,g in groups.items()for p in g['spectrum']]+[['适用边界',k,v,None]for k,v in s['boundaries'].items()],
 'running':[[p['log10Q'],name]+rr(p[k])for p in s['runningScan']for name,k in [('固定','fixed'),('匹配','matched')]],
 'angles':[[p[k]for k in ['degrees','mesonFidelity','wrongMesonFidelity','baryonFidelity','wrongMesonDistanceSquared']]for p in s['rotationScan']],
 'string':[['扫描',p['r'],p['matrix'],p['eigenvalues'],p['lowerProjector'],p['lowerStringWeight']]for p in s['stringScan']]+([['解析交叉点',s['crossingR'],s['crossing']['matrix'],s['crossing']['eigenvalues'],None,s['crossing']['lowerStringWeight']],['交叉点浮点直接代入',s['crossingR'],s['crossing']['rawEvaluation']['matrix'],s['crossing']['rawEvaluation']['eigenvalues'],s['crossing']['rawEvaluation']['lowerProjector'],s['crossing']['rawEvaluation']['lowerStringWeight']]]if s['crossing'] else [['σ=0：无正距离交叉',None,None,None,None,None]]),
 'flavors':[[p[k]for k in ['nf','beta0','beta1','asymptoticallyFreeAtOneLoop','betaAtReference','betaTwoLoopAtReference','twoLoopPositiveZero']]for p in s['flavors']]
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
for change in [lambda x:x['colors']['generators'][0][0][1].__setitem__(0,0),lambda x:x['colors']['fundamentalCasimir'][0][0].__setitem__(0,1),lambda x:x['colors']['groups']['meson']['casimir'][0][0].__setitem__(0,0),lambda x:x['colors']['groups']['diquark']['spectrum'][0].update(value=0),lambda x:x['colors']['groups']['baryon']['singlet'][5].__setitem__(0,0),lambda x:x['colors']['groups']['meson']['actions'][0][0].__setitem__(0,1),lambda x:x['fixed'].update(alpha=0),lambda x:x['matched'].update(inverse=0),lambda x:x['runningScan'][250]['fixed'].update(inverse=0),lambda x:x['thresholds'][0].update(slopeAbove=0),lambda x:x['fixedPole'].update(logScale=0),lambda x:x['rotation'].update(wrongMesonFidelity=1),lambda x:x['rotationScan'][90].update(wrongMesonFidelity=1),lambda x:x['stringScan'][150]['eigenvalues'].__setitem__(0,0),lambda x:x['stringScan'][150].update(lowerStringWeight=0),lambda x:x['crossing'].update(lowerStringWeight=0),lambda x:x['flavors'][16].update(twoLoopPositiveZero=1),lambda x:x['boundaries'].update(finiteColorAlgebraNotConfinementProof=False)]:
 mutant=copy.deepcopy(base);change(mutant)
 try:validate(mutant)
 except AssertionError:mutations+=1
 else:raise AssertionError('Undetected scientific mutation '+str(mutations))
print(json.dumps({'status':'PASS','records':len(d['records']),'frozen':len(f['records']),'checks':science_checks,'plotCoordinates':plotcoords,'markers':markers,'ledgerRows':table_rows,'invalid':d['invalid'],'feedback':d['feedback'],'mutations':mutations,'self':d['self']['checks'],'replayGuards':guards}))
