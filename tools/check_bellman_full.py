"""Independent exact rational policy solves and Bellman recursion; no product imports."""
from pathlib import Path
from fractions import Fraction as F
import json,math,sys
R=[[F(1),F(-2)],[F(4),F(2)]];P=[[[F(1),F(0)],[F(0),F(1)]],[[F(2,5),F(3,5)],[F(1),F(0)]]]
checks=0
def near(a,b):
 global checks
 if b is None:assert a is None
 else:assert isinstance(a,(int,float))and math.isfinite(a)and abs(a-float(b))<=2e-8*max(1,abs(float(b))),(a,float(b))
 checks+=1
def eq(a,b):
 global checks
 assert a==b,(a,b);checks+=1
def vec(a,b):
 eq(len(a),len(b))
 for x,y in zip(a,b):near(x,y)
def norm(v):return max(map(abs,v))
def diff(a,b):return[x-y for x,y in zip(a,b)]
def q(v,g):return[[R[s][a]+g*sum(P[s][a][j]*v[j]for j in range(2))for a in range(2)]for s in range(2)]
def T(v,g):return list(map(max,q(v,g)))
def solve(pi,g):
 a=1-g*P[0][pi[0]][0];b=-g*P[0][pi[0]][1];c=-g*P[1][pi[1]][0];d=1-g*P[1][pi[1]][1];det=a*d-b*c
 return [(R[0][pi[0]]*d-b*R[1][pi[1]])/det,(a*R[1][pi[1]]-c*R[0][pi[0]])/det]if g<1 else None
def audit(s):
 c=s['parameters'];g=F(str(c['gamma']));eps=F(str(c['epsilon']));shift=F(str(c['shift']));v=list(map(lambda k:F(str(c[k])),['camp','mine']));u=[x+shift for x in v];w=v[:];pis=[[0,0],[0,1],[1,0],[1,1]];pvs=[solve(pi,g)for pi in pis];star=[max(vs[i]for vs in pvs)for i in range(2)]if g<1 else None
 if star:vec(s['star'],star);e0=norm(diff(v,star));near(s['initialError'],e0)
 else:eq(s['star'],None);eq(s['initialError'],None)
 eq(len(s['policies']),4)
 for rec,pi,pv in zip(s['policies'],pis,pvs):
  eq(rec['policy'],pi);vec(rec['r'],[R[i][pi[i]]for i in range(2)])
  A=[[F(int(i==j))-g*P[i][pi[i]][j]for j in range(2)]for i in range(2)]
  for i in range(2):vec(rec['P'][i],P[i][pi[i]]);vec(rec['matrix'][i],A[i])
  near(rec['det'],A[0][0]*A[1][1]-A[0][1]*A[1][0])
  if pv:
   vec(rec['value'],pv);vec(rec['residual'],[0,0]);qs=q(pv,g)
   for row,expected in zip(rec['q'],qs):vec(row,expected)
   vec(rec['gaps'],[max(qs[i])-qs[i][pi[i]]for i in range(2)])
  else:
   for key in ['value','q','residual','gaps']:eq(rec[key],None)
 eq(len(s['rows']),c['steps']+1)
 for k,row in enumerate(s['rows']):
  eq(row['k'],k);vec(row['value'],v);qs=q(v,g);tv=list(map(max,qs));d=diff(tv,v);m,M=min(d),max(d);res=norm(d);pi=[0 if pair[0]>=pair[1]else 1 for pair in qs];power=g**k;accum=sum(g**j for j in range(k));pv=pvs[2*pi[0]+pi[1]];tw=T(w,g);wd=diff(tw,w);noise=[eps,eps]if c['pattern']=='bias'else[eps*(-1)**k,-eps*(-1)**k]
  for actual,expected in zip(row['q'],qs):vec(actual,expected)
  vec(row['tv'],tv);vec(row['delta'],d)
  for key,val in [('residual',res),('minDelta',m),('maxDelta',M),('spanDelta',M-m)]:near(row[key],val)
  # At exact ties floating candidates may select either action; all chosen values must attain the exact max.
  for i,a in enumerate(row['policy']):assert qs[i][a]==max(qs[i])or abs(float(qs[i][a]-max(qs[i])))<1e-10
  if star:
   selected=pvs[2*row['policy'][0]+row['policy'][1]];vec(row['policyValue'],selected)
   values={'policyLoss':norm(diff(star,selected)),'policyBound':g*(M-m)/(1-g),'error':norm(diff(v,star)),'geometricBound':power*e0,'residualBound':res/(1-g),'approximateError':norm(diff(w,star)),'approximateBound':power*e0+eps*accum}
   for key,val in values.items():near(row[key],val)
   for key,val in [('lower',[x+m/(1-g)for x in v]),('upper',[x+M/(1-g)for x in v]),('policyLower',[x+g*m/(1-g)for x in tv]),('optimalUpper',[x+g*M/(1-g)for x in tv])]:vec(row[key],val)
   assert norm(diff(v,star))<=res/(1-g);assert norm(diff(star,pv))<=g*(M-m)/(1-g);assert norm(diff(w,star))<=power*e0+eps*accum
   eq(row['certifiedStop'],row['residualBound']<=c['tolerance'])
  else:
   for key in ['policyValue','policyLoss','policyBound','error','geometricBound','residualBound','lower','upper','policyLower','optimalUpper','approximateError','approximateBound']:eq(row[key],None)
   eq(row['certifiedStop'],False)
  vec(row['shifted'],u);vec(row['shiftDifference'],diff(u,v));near(row['shiftExpected'],shift*power);vec(row['shiftDefect'],[0,0]);vec(row['shiftResidual'],diff(T(u,g),u))
  uqs=q(u,g)
  for i,a in enumerate(row['shiftPolicy']):assert uqs[i][a]==max(uqs[i])or abs(float(uqs[i][a]-max(uqs[i])))<1e-10
  vec(row['approximate'],w);vec(row['approximateTV'],tw);vec(row['approximateDelta'],wd);near(row['approximateResidual'],norm(wd));near(row['pathDistance'],norm(diff(w,v)));near(row['pathBound'],eps*accum);assert norm(diff(w,v))<=eps*accum
  if k==c['steps']:eq(row['updateNoise'],None);eq(row['actualNextChange'],None)
  else:vec(row['updateNoise'],noise);near(row['actualNextChange'],norm(diff([x+y for x,y in zip(tw,noise)],w)))
  v=tv;u=T(u,g);w=[x+y for x,y in zip(tw,noise)]
 for row in s['scan']:
  h=F(str(row['gamma']));ps=[solve(pi,h)for pi in pis]
  if h==1:
   for key in ['value','policy','campGap','horizon']:eq(row[key],None)
  else:
   opt=[max(p[i]for p in ps)for i in range(2)];vec(row['value'],opt);qq=q(opt,h);near(row['campGap'],qq[0][0]-qq[0][1]);near(row['horizon'],1/(1-h));eq(row['policy'],[0 if h<=F(5,8)else 1,0])
  eq(row['campTie'],h==F(5,8))
import subprocess,shutil,hashlib,tempfile,copy,re,xml.etree.ElementTree as ET
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1];prefix=['rtk','proxy']if shutil.which('rtk')else[]
js=root/'bellman-contraction178-final.js'if staging else root/'course-shared/labs/bellman-contraction.js'
fixture=(root/'bellman-snapshot178-final.json'if(root/'bellman-snapshot178-final.json').exists()else root/'bellman178-preview-observations.json')if staging else root/'course-shared/projects/bellman-certificates/run-snapshot.json'
code=r'''
const a=require(process.argv[1]);const configs=a.PRESETS.map(p=>p.config);for(const gamma of [0,.2,.624,.625,.626,.8,.99,.999,1])for(const pattern of ['bias','alternating'])configs.push({gamma,steps:35,camp:-17,mine:23,shift:31,epsilon:.3,pattern});configs.push({gamma:.999,steps:300,camp:100,mine:-100,epsilon:1,shift:-100});const records=configs.map(c=>a.snapshot(c));let invalid=0;const bad=[null,[],2,'x',{bad:1},{constructor:1},JSON.parse('{"__proto__":1}'),{steps:1.5},{steps:-1},{steps:301},{pattern:'random'}];for(const k of ['gamma','steps','camp','mine','shift','epsilon','tolerance'])for(const v of ['1',null,NaN,Infinity,-Infinity])bad.push({[k]:v});bad.push({gamma:.9991},{gamma:.999999},{gamma:1-Number.EPSILON/2},{gamma:-.1},{gamma:1.001},{camp:101},{mine:-101},{shift:101},{epsilon:-1},{epsilon:1.1},{tolerance:0},{tolerance:11});for(const b of bad){let caught=false;try{a.config(b)}catch(e){caught=true}if(!caught)throw Error('Invalid accepted');invalid++;}const feedback=[];for(let i=0;i<4;i++)for(let j=0;j<2;j++)feedback.push(a.feedback(i,j));console.log(JSON.stringify({records,views:records.map(s=>({plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)})),invalid,feedback,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve())],text=True));records=data['records']
for s in records:audit(s)
f=json.loads(fixture.read_text());eq(len(f['records']),6);eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest())
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))));',str(js.resolve()),str(fixture.resolve())],text=True))
def deep(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[deep(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[deep(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(float,int))and not isinstance(b,bool):near(a,b)
 else:eq(a,b)
for rec,replay in zip(f['records'],replays):audit(rec['data']);deep(rec['data'],replay)
coords=markers=ledgerRows=0;ns={'s':'http://www.w3.org/2000/svg'}
for s,view in zip(records,data['views']):
 rows=s['rows'];expected=[[[r['value'][0]for r in rows],[r['value'][1]for r in rows]],[[r[k]for r in rows]for k in ['error','residualBound','geometricBound']],[[r[k]for r in rows]for k in ['policyLoss','policyBound']],[[r[k]for r in rows]for k in ['pathDistance','pathBound']],[[r['shiftDifference'][0]for r in rows],[r['shiftExpected']for r in rows]]]
 eq(len(view['plots']),6);eq(len(view['svg']),6)
 for i,(p,raw)in enumerate(zip(view['plots'],view['svg'])):
  if i<5:expectedPoints=[[[r['k'],v]if v is not None else None for r,v in zip(rows,ys)]for ys in expected[i]]
  else:expectedPoints=[[[r['gamma'],r['campGap']]if r['campGap']is not None else None for r in s['scan']],[[.625,0]]]
  eq(len(p['series']),len(expectedPoints))
  for serie,points in zip(p['series'],expectedPoints):deep(serie['points'],points)
  tree=ET.fromstring(raw);paths=tree.findall('s:path',ns);eq(len(paths),len(p['series']));assert p['xMax']>p['xMin']and p['yMax']>p['yMin']
  X=lambda x:100+(x-p['xMin'])/(p['xMax']-p['xMin'])*755;Y=lambda y:385-(y-p['yMin'])/(p['yMax']-p['yMin'])*290
  expectedMarkers=[]
  for path,serie in zip(paths,p['series']):
   xy=[(float(a),float(b))for a,b in re.findall(r'[ML]([-\d.]+),([-\d.]+)',path.attrib['d'])];points=[v for v in serie['points']if v is not None];eq(len(xy),len(points))
   for (x,y),point in zip(xy,points):assert abs(x-X(point[0]))<=.0000006 and abs(y-Y(point[1]))<=.0000006;coords+=2
   if serie.get('markersOnly'):expectedMarkers+=points
   elif serie.get('boundaryMarkers')and points:expectedMarkers+=[points[0]]+([points[-1]]if len(points)>1 else[])
  circles=tree.findall('s:circle',ns);eq(len(circles),len(expectedMarkers))
  for circle,point in zip(circles,expectedMarkers):near(float(circle.attrib['cx']),X(point[0]));near(float(circle.attrib['cy']),Y(point[1]));markers+=1
 tables={t['key']:t for t in view['tables']};eq(len(tables),10)
 expectedTables={
 'parameters':[[k,v]for k,v in s['parameters'].items()],
 'model':[[['营地','矿区'][i],a['name'],a['r'],*a['p']]for i,as_ in enumerate(s['model'])for a in as_],
 'policies':[[s['model'][0][p['policy'][0]]['name'],s['model'][1][p['policy'][1]]['name'],*sum(p['matrix'],[]),p['det'],*(p['value']or[None,None]),p['residual'],p['gaps']]for p in s['policies']],
 'iterations':[[r['k'],*r['value'],*r['tv'],r['residual'],r['error'],r['residualBound'],r['geometricBound'],r['certifiedStop']]for r in rows],
 'actions':[[r['k'],['营地','矿区'][i],s['model'][i][j]['name'],q,r['policy'][i]==j]for r in rows for i,qs in enumerate(r['q'])for j,q in enumerate(qs)],
 'envelopes':[[r['k'],*r['delta'],r['minDelta'],r['maxDelta'],*(r['lower']or[None,None]),*(r['upper']or[None,None])]for r in rows],
 'loss':[[r['k'],*[s['model'][i][a]['name']for i,a in enumerate(r['policy'])],*(r['policyValue']or[None,None]),r['policyLoss'],r['spanDelta'],r['policyBound'],r['policyLower'],r['optimalUpper']]for r in rows],
 'approximate':[[r['k'],*r['approximate'],*r['approximateTV'],r['approximateResidual'],r['actualNextChange'],r['updateNoise'],r['approximateError'],r['approximateBound'],r['pathDistance'],r['pathBound']]for r in rows],
 'shift':[[r['k'],*r['shifted'],*r['shiftDifference'],r['shiftExpected'],r['shiftDefect'],[s['model'][i][a]['name']for i,a in enumerate(r['shiftPolicy'])],r['shiftResidual']]for r in rows],
 'discount':[[r['gamma'],*(r['value']or[None,None]),None if r['policy']is None else s['model'][0][r['policy'][0]]['name'],r['campTie'],r['campGap'],r['horizon']]for r in s['scan']]}
 for key,expected in expectedTables.items():deep(tables[key]['rows'],expected);assert all(len(r)==len(tables[key]['headers'])for r in expected);ledgerRows+=len(expected)
eq(data['invalid'],58);eq(len(data['feedback']),8)
for i,fback in enumerate(data['feedback']):eq(fback['correct'],i%2==[1,1,0,1][i//2]);assert len(fback['text'])>25
mutations=0
for path in [('rows',0,'q',0,0),('rows',0,'delta',0),('rows',0,'residualBound'),('rows',0,'policyBound'),('rows',2,'approximate',0),('rows',1,'shiftExpected'),('scan',0,'campGap'),('policies',0,'value',0),('rows',0,'pathBound')]:
 bad=copy.deepcopy(records[0]);target=bad
 for key in path[:-1]:target=target[key]
 target[path[-1]]+=1
 try:audit(bad)
 except AssertionError:mutations+=1
 else:raise AssertionError('Mutation escaped: '+str(path))
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/bellman-contraction.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/bellman-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/mdp-01-bellman-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/mdp-01-bellman-ledgers.svg').read_bytes()
 with tempfile.TemporaryDirectory()as td:
  svg=Path(td)/'replay.svg';md=Path(td)/'replay.md';subprocess.run(prefix+[sys.executable,str(root/'tools/build_bellman_figure.py'),str(js),str(fixture),str(svg),str(md)],check=True,stdout=subprocess.DEVNULL);assert svg.read_bytes()==(root/'grad-math/images/mdp-01-bellman-ledgers.svg').read_bytes();assert md.read_text()in(root/'grad-math/lectures/mdp-01-bellman.md').read_text()
print(json.dumps({'status':'PASS','records':len(records),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':data['invalid'],'feedback':8,'mutations':mutations,'self':data['self']['checks']}))
