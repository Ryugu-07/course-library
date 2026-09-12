"""Independent scalar/finite-matrix oracle using the Python standard library."""
import math,itertools
from fractions import Fraction as F
checks=0
def eq(a,b):
 global checks
 assert a==b,(a,b);checks+=1
def near(a,b):
 global checks
 assert isinstance(a,(int,float,F))and math.isfinite(a)and abs(float(a)-float(b))<=2e-7*max(1,abs(float(b))),(a,b);checks+=1
def deep(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[deep(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[deep(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(int,float,F))and not isinstance(b,bool):near(a,b)
 else:eq(a,b)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def gen(seed):
 x=seed&0xffffffff or 1
 while True:
  before=x;x^=(x<<13)&0xffffffff;x^=x>>17;x^=(x<<5)&0xffffffff;x&=0xffffffff;yield{'before':before,'after':x,'u':x/2**32}
def rate(kind,n):return .15 if kind=='constant'else 1/math.sqrt(n)if kind=='root'else 1/n
P=[[[1.,0.],[0.,1.]],[[.4,.6],[1.,0.]]];R=[[1.,-2.],[4.,2.]]
def solve(A,b):
 d=A[0][0]*A[1][1]-A[0][1]*A[1][0];return[(b[0]*A[1][1]-A[0][1]*b[1])/d,(A[0][0]*b[1]-b[0]*A[1][0])/d]
def analytic(g):
 gamma=F(str(g));values=[]
 for pi in itertools.product(range(2),repeat=2):
  A=[[F(i==j)-gamma*F(str(P[i][pi[i]][j]))for j in range(2)]for i in range(2)];b=[F(str(R[i][pi[i]]))for i in range(2)];values.append(solve(A,b))
 v=[max(x[i]for x in values)for i in range(2)];q=[[F(str(R[i][a]))+gamma*dot([F(str(x))for x in P[i][a]],v)for a in range(2)]for i in range(2)];return v,q
def audit(s):
 eq(s['version'],180);c=s['parameters'];g=c['gamma'];K=c['steps'];theta=mean=c['theta0'];var=total=squares=mart=0.;rng=gen(c['seed']^0xa341316c)
 eq(len(s['model']),2)
 for i in range(2):
  eq(len(s['model'][i]),2)
  for a in range(2):deep(s['model'][i][a],{'name':[['采集','远行'],['收获','返回']][i][a],'reward':R[i][a],'p':P[i][a]})
 rm=s['rm'];eq(rm['target'],2);eq(len(rm['rows']),K+1)
 for k,row in enumerate(rm['rows']):
  upd=None
  if k:
   alpha=rate(c['alphaKind'],k);random=next(rng)if c['noiseKind']!='alternating'else None;expect=.5 if c['noiseKind']=='biased'else c['scale']*(-1)**(k-1)if c['noiseKind']=='alternating'else 0;center=(-c['scale']if random['u']<.5 else c['scale'])if random else 0;noise=expect+center;upd={'old':theta,'alpha':alpha,'drift':2-theta,'noise':noise,'expectedNoise':expect,'centeredNoise':center,'random':random};theta+=alpha*(2-theta+noise);mean=(1-alpha)*mean+alpha*(2+expect);var=(1-alpha)**2*var+alpha**2*(c['scale']**2 if random else 0);total+=alpha;squares+=alpha**2;mart+=alpha*center
  if upd:eq(row['update']['random'],upd['random'])
  deep(row,{'k':k,'theta':theta,'mean':mean,'variance':var,'mse':var+(mean-2)**2,'alphaSum':total,'squareSum':squares,'centeredAccumulation':mart,'update':upd})
 # Forward propagation of the whole coefficient vector is independent of the product implementation.
 weights=[1.]
 for k in range(1,K+1):
  a=rate(c['alphaKind'],k);weights=[x*(1-a)for x in weights]+[a]
 near(rm['initialWeight'],weights[0]);eq(len(rm['weights']),K);near(sum(weights),1)
 for k,row in enumerate(rm['weights'],1):deep(row,{'k':k,'weight':weights[k],'observation':2+rm['rows'][k]['update']['noise']})
 near(rm['reconstructed'],theta);near(rm['reconstructed'],weights[0]*c['theta0']+sum(weights[k]*(2+rm['rows'][k]['update']['noise'])for k in range(1,K+1)))
 Q=[[0.,0.],[0.,0.]];visits=[[0,0],[0,0]];sums=[[0.,0.],[0.,0.]];sq=[[0.,0.],[0.,0.]];pairs=[(0,0),(0,1),(1,0),(1,1)]if c['coverage']=='full'else[(0,0),(1,0)];rng=gen(c['seed']^0xc8013ea4);q=s['q'];eq(len(q['rows']),K+1)
 if g<1:
  vstar,qstar=analytic(g);deep(q['reference']['value'],vstar);deep(q['reference']['q'],qstar)
 else:eq(q['reference'],None)
 for k,row in enumerate(q['rows']):
  upd=None
  if k:
   i,a=pairs[(k-1)%len(pairs)];random=next(rng);j=0 if random['u']<P[i][a][0]else 1;V=list(map(max,Q));expect=R[i][a]+g*dot(P[i][a],V);variance=sum(P[i][a][n]*(R[i][a]+g*V[n]-expect)**2 for n in range(2));target=R[i][a]+g*V[j];old=Q[i][a];visits[i][a]+=1;alpha=rate(c['alphaKind'],visits[i][a]);Q[i][a]+=alpha*(target-old);sums[i][a]+=alpha;sq[i][a]+=alpha**2
   upd={'s':i,'a':a,'next':j,'reward':R[i][a],'random':random,'visit':visits[i][a],'alpha':alpha,'old':old,'target':target,'conditionalMean':expect,'conditionalVariance':variance,'noise':target-expect,'td':target-old,'newValue':Q[i][a]}
  V=list(map(max,Q));expected=[[R[i][a]+g*dot(P[i][a],V)for a in range(2)]for i in range(2)];delta=[[expected[i][a]-Q[i][a]for a in range(2)]for i in range(2)];res=max(abs(x)for r in delta for x in r);error=None if g==1 else max(abs(Q[i][a]-float(qstar[i][a]))for i in range(2)for a in range(2))
  if upd:eq(row['update']['random'],upd['random'])
  eq(row['visits'],visits)
  deep(row,{'k':k,'Q':Q,'visits':visits,'alphaSums':sums,'squareSums':sq,'expected':expected,'delta':delta,'residual':res,'residualBound':None if g==1 else res/(1-g),'error':error,'covered':sum(v>0 for r in visits for v in r),'update':upd})
  if g<1:assert error<=res/(1-g)+1e-7
 if g==1:eq(s['projection'],None)
 else:
  eq(len(s['projection']),2)
  for rec,d,key in zip(s['projection'],[[2/7,5/7],[.99,.01]],['stationary','reweighted']):
   phi=[1,2];PP=[[0,1],[.4,.6]];r=[-2,4];C=dot(d,[1,4]);A=sum(d[i]*phi[i]*(phi[i]-g*dot(PP[i],phi))for i in range(2));b=dot(d,[-2,8]);projector=[[phi[i]*d[j]*phi[j]/C for j in range(2)]for i in range(2)];root=None if abs(A)<1e-12 else b/A;coef=g*sum(d[i]*phi[i]*dot(PP[i],phi)for i in range(2))/C
   for k,val in {'key':key,'d':d,'P':PP,'r':r,'phi':phi,'C':C,'A':A,'b':b,'projector':projector,'coefficient':coef,'root':root,'rootSuppressed':root is None,'rate':.1,'meanIterationFactor':1-.1*A,'stableMeanIteration':abs(1-.1*A)<1}.items():deep(rec[k],val)
   eq(len(rec['rows']),K+1);w=0
   for k,row in enumerate(rec['rows']):
    value=[v*w for v in phi];tv=[r[i]+g*dot(PP[i],value)for i in range(2)];residual=[tv[i]-value[i]for i in range(2)];projected=[dot(p,tv)for p in projector];drift=dot(d,[phi[i]*residual[i]for i in range(2)])
    deep(row,{'k':k,'w':w,'value':value,'tv':tv,'residual':residual,'projected':projected,'projectedResidual':[projected[i]-value[i]for i in range(2)],'drift':drift})
    if k<K:w+=.1*drift
 bias=s['bias'];eq(len(bias['rows']),16)
 for row,(a0,a1,b0,b1)in zip(bias['rows'],itertools.product([-c['scale'],c['scale']],repeat=4)):
  selected=0 if a0>=a1 else 1;deep(row,{'A':[a0,a1],'B':[b0,b1],'selected':selected,'single':max(a0,a1),'independent':[b0,b1][selected],'sameData':[a0,a1][selected],'probability':1/16})
 near(bias['single'],c['scale']/2);near(bias['independent'],0);near(bias['sameData'],c['scale']/2);eq(bias['trueMaximum'],0);eq(s['theory']['kind'],c['alphaKind']);eq(s['theory']['sum'],'发散');eq(s['theory']['squares'],'收敛'if c['alphaKind']=='harmonic'else'发散');eq(s['theory']['classicStepCondition'],c['alphaKind']=='harmonic')

from pathlib import Path
import subprocess,shutil,hashlib,tempfile,copy,re,xml.etree.ElementTree as ET,json,sys
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1];prefix=['rtk','proxy']if shutil.which('rtk')else[]
js=root/'stochastic-approximation180.js'if staging else root/'course-shared/labs/stochastic-approximation.js'
fixture=(root/'sa-snapshot180.json'if(root/'sa-snapshot180.json').exists()else root/'sa180-preview-observations.json')if staging else root/'course-shared/projects/sa-certificates/run-snapshot.json'
code=r'''
const a=require(process.argv[1]),configs=a.PRESETS.map(p=>p.config);for(const gamma of [0,.625,.999,1,515/1006])for(const alphaKind of ['harmonic','root','constant'])configs.push({gamma,alphaKind,steps:30,seed:4294967295,scale:2,theta0:-10});configs.push({steps:10},{steps:10,coverage:'sparse'},{steps:1},{steps:0,noiseKind:'alternating'},{noiseKind:'biased',scale:0},{noiseKind:'alternating',steps:400});const records=configs.map(c=>a.snapshot(c));const bad=[null,[],3,'x',{bad:1},{constructor:1},JSON.parse('{"__proto__":1}'),{steps:-1},{steps:401},{steps:1.5},{gamma:-.1},{gamma:1.01},{gamma:.9991},{gamma:1-Number.EPSILON/2},{scale:-.1},{scale:2.01},{seed:0},{seed:1.5},{seed:4294967296},{theta0:-11},{theta0:11}];for(const k of ['gamma','steps','scale','seed','theta0'])for(const v of ['1',null,NaN,Infinity,-Infinity])bad.push({[k]:v});for(const k of ['alphaKind','coverage','noiseKind'])for(const v of ['',null,1,[],{}])bad.push({[k]:v});for(const c of bad){let caught=false;try{a.config(c)}catch(e){caught=true}if(!caught)throw Error('Invalid input accepted');}const feedback=[];for(let i=0;i<4;i++)for(let j=0;j<2;j++)feedback.push(a.feedback(i,j));console.log(JSON.stringify({records,views:records.map(s=>({plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)})),invalid:bad.length,feedback,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve())],text=True));records=data['records']
for s in records:audit(s)
f=json.loads(fixture.read_text());eq(len(f['records']),6);eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest())
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))));',str(js.resolve()),str(fixture.resolve())],text=True))
for rec,replay in zip(f['records'],replays):audit(rec['data']);deep(rec['data'],replay)
coords=markers=ledgerRows=0;ns={'s':'http://www.w3.org/2000/svg'};names=[['采集','远行'],['收获','返回']]
def item(row,key):return row['update'].get(key)if row['update']else None
def randomitem(row,key):return row['update']['random'][key]if row['update']and row['update']['random']else None
for s,view in zip(records,data['views']):
 rm=s['rm']['rows'];q=s['q']['rows'];p=s['projection'];last=q[-1];ref=s['q']['reference'];K=s['parameters']['steps']
 expected=[
 [[[r['k'],r[key]]for r in rm]for key in ['theta','mean']]+[[[0,2],[K,2]]],
 [[[r['k'],r[key]]for r in rm]for key in ['mse','variance']],
 [[[r['k'],r[key]]if r[key]is not None else None for r in q]for key in ['error','residualBound']],
 [[[r['k'],r['visits'][i//2][i%2]]for r in q]for i in range(4)],
 [[[r['k'],r['w']]for r in rec['rows']]for rec in p]if p else[],
 [[[0,s['bias']['single']],[1,s['bias']['independent']],[2,s['bias']['sameData']]]]]
 eq(len(view['plots']),6);eq(len(view['svg']),6)
 for plot,raw,expectedPoints in zip(view['plots'],view['svg'],expected):
  eq(len(plot['series']),len(expectedPoints))
  for serie,points in zip(plot['series'],expectedPoints):deep(serie['points'],points)
  tree=ET.fromstring(raw);paths=tree.findall('s:path',ns);eq(len(paths),len(plot['series']));assert plot['xMax']>plot['xMin']and plot['yMax']>plot['yMin']
  X=lambda x:100+(x-plot['xMin'])/(plot['xMax']-plot['xMin'])*755;Y=lambda y:385-(y-plot['yMin'])/(plot['yMax']-plot['yMin'])*290
  expectedMarkers=[]
  for path,serie in zip(paths,plot['series']):
   xy=[(float(a),float(b))for a,b in re.findall(r'[ML]([-\d.]+),([-\d.]+)',path.attrib['d'])];points=[v for v in serie['points']if v is not None];eq(len(xy),len(points))
   for (x,y),point in zip(xy,points):assert abs(x-X(point[0]))<=.0000006 and abs(y-Y(point[1]))<=.0000006;coords+=2
   if serie.get('markersOnly'):expectedMarkers+=points
   elif serie.get('boundaryMarkers')and points:expectedMarkers+=[points[0]]+([points[-1]]if len(points)>1 else[])
  circles=tree.findall('s:circle',ns);eq(len(circles),len(expectedMarkers))
  for circle,point in zip(circles,expectedMarkers):near(float(circle.attrib['cx']),X(point[0]));near(float(circle.attrib['cy']),Y(point[1]));markers+=1
 tables={t['key']:t for t in view['tables']};eq(len(tables),10)
 expectedTables={
 'parameters':[[k,v]for k,v in s['parameters'].items()],
 'model':[[['营地','矿区'][i],names[i][a],R[i][a],*P[i][a]]for i in range(2)for a in range(2)],
 'rm':[[r[k]for k in ['k','theta','mean','variance','mse','alphaSum','squareSum','centeredAccumulation']]+[item(r,k)for k in ['old','alpha','drift','noise','expectedNoise','centeredNoise']]+[randomitem(r,k)for k in ['before','after','u']]for r in rm],
 'q':[[r[k]for k in ['k','Q','visits','alphaSums','squareSums','expected','delta','residual','residualBound','error','covered']]+[[item(r,'s'),item(r,'a')]if r['update']else None]+[item(r,k)for k in ['next','visit','alpha','old','target','conditionalMean','conditionalVariance','noise','td','newValue']]+[randomitem(r,k)for k in ['before','after','u']]for r in q],
 'visits':[[names[i][a],last['visits'][i][a],last['alphaSums'][i][a],last['squareSums'][i][a],last['Q'][i][a],ref['q'][i][a]if ref else None]for i in range(2)for a in range(2)],
 'theory':[['harmonic','发散','收敛',True,'步长合格仍需要噪声、稳定性与访问假设'],['root','发散','发散',False,'未满足经典充分条件，不推出必然不收敛'],['constant','发散','发散',False,'有非退化独立噪声时一般保留误差；零噪声另论']],
 'projection':[[m[k]for k in ['key','d','C','A','b','projector','coefficient','root','meanIterationFactor','stableMeanIteration']]+[r[k]for k in ['k','w','value','tv','residual','projected','projectedResidual','drift']]for m in p for r in m['rows']]if p else[],
 'bias':[[*r['A'],*r['B'],r['selected'],r['single'],r['independent'],r['sameData'],r['probability']]for r in s['bias']['rows']],
 'reference':[[names[i][a],ref['q'][i][a]if ref else None,last['Q'][i][a],last['expected'][i][a],last['delta'][i][a]]for i in range(2)for a in range(2)],
 'weights':[[0,s['rm']['initialWeight'],s['parameters']['theta0'],s['rm']['initialWeight']*s['parameters']['theta0']]]+[[r['k'],r['weight'],r['observation'],r['weight']*r['observation']]for r in s['rm']['weights']]}
 for key,expected in expectedTables.items():deep(tables[key]['rows'],expected);assert all(len(r)==len(tables[key]['headers'])for r in expected);ledgerRows+=len(expected)
eq(data['invalid'],61);eq(len(data['feedback']),8)
for i,fb in enumerate(data['feedback']):eq(fb['correct'],i%2==[0,1,0,1][i//2]);assert len(fb['text'])>25
mutations=0
for path in [('rm','rows',1,'theta'),('rm','rows',1,'variance'),('rm','rows',1,'update','random','after'),('rm','weights',0,'weight'),('q','rows',3,'update','conditionalMean'),('q','rows',3,'visits',1,0),('q','reference','q',0,0),('q','rows',2,'residualBound'),('projection',0,'projector',0,0),('projection',1,'A'),('projection',1,'rows',3,'w'),('bias','rows',0,'independent'),('bias','single')]:
 bad=copy.deepcopy(records[0]);target=bad
 for key in path[:-1]:target=target[key]
 target[path[-1]]+=1
 try:audit(bad)
 except AssertionError:mutations+=1
 else:raise AssertionError('Mutation escaped: '+str(path))
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/stochastic-approximation.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/sa-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/mdp-03-sa-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/mdp-03-sa-ledgers.svg').read_bytes()
 with tempfile.TemporaryDirectory()as td:
  svg=Path(td)/'replay.svg';md=Path(td)/'replay.md';subprocess.run(prefix+[sys.executable,str(root/'tools/build_sa_figure.py'),str(js),str(fixture),str(svg),str(md)],check=True,stdout=subprocess.DEVNULL);assert svg.read_bytes()==(root/'grad-math/images/mdp-03-sa-ledgers.svg').read_bytes();assert md.read_text()in(root/'grad-math/lectures/mdp-03-stochastic-approx.md').read_text()
print(json.dumps({'status':'PASS','records':len(records),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':data['invalid'],'feedback':8,'mutations':mutations,'self':data['self']['checks']}))
