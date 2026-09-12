"""Independent rational MDP evaluation, flow, and finite LP enumeration."""
from fractions import Fraction as F
import math
R=[[F(1),F(-2)],[F(4),F(2)]]
P=[[[F(1),F(0)],[F(0),F(1)]],[[F(2,5),F(3,5)],[F(1),F(0)]]]
PIS=[[0,0],[0,1],[1,0],[1,1]]
checks=0
def eq(a,b):
 global checks
 assert a==b,(a,b);checks+=1
def near(a,b):
 global checks
 if b is None:assert a is None
 else:assert isinstance(a,(int,float,F))and math.isfinite(a)and abs(float(a)-float(b))<=2e-7*max(1,abs(float(b))),(a,float(b))
 checks+=1
def deep(a,b):
 if isinstance(b,dict):eq(set(a),set(b));[deep(a[k],v)for k,v in b.items()]
 elif isinstance(b,list):eq(len(a),len(b));[deep(x,y)for x,y in zip(a,b)]
 elif isinstance(b,(F,int,float))and not isinstance(b,bool):near(a,b)
 else:eq(a,b)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def solve(A,b):
 det=A[0][0]*A[1][1]-A[0][1]*A[1][0]
 return None if det==0 else [(b[0]*A[1][1]-A[0][1]*b[1])/det,(A[0][0]*b[1]-b[0]*A[1][0])/det]
def system(actual,A,b):
 deep(actual['matrix'],A);deep(actual['right'],b);near(actual['det'],A[0][0]*A[1][1]-A[0][1]*A[1][0]);v=solve(A,b);deep(actual['value'],v);return v
def policy(pi,g,eta=F(0)):
 PP=[P[i][pi[i]]for i in range(2)];rr=[R[i][pi[i]]-eta*int(i==0 and pi[i]==1)for i in range(2)];A=[[F(i==j)-g*PP[i][j]for j in range(2)]for i in range(2)];return PP,rr,A,solve(A,rr)
def qs(v,g):return[[R[i][a]+g*dot(P[i][a],v)for a in range(2)]for i in range(2)]
def occupancy(pi,g,mu):
 PP,rr,A,v=policy(pi,g);At=[[A[j][i]for j in range(2)]for i in range(2)];z=solve(At,mu);x=[F(0)]*4
 for i in range(2):x[2*i+pi[i]]=z[i]
 return At,z,x,v
def candidates(occ,B):
 out=[(i,i,F(1),occ[i])for i in range(4)]
 for i in range(4):
  for j in range(i+1,4):
   den=occ[i][1]-occ[j][1]
   if den==0:continue
   lam=(B-occ[j][1])/den
   if 0<=lam<=1:out.append((i,j,lam,[lam*a+(1-lam)*b for a,b in zip(occ[i],occ[j])]))
 return out
def bestreward(occ,B):return max(dot(sum(R,[]),x)for i,j,l,x in candidates(occ,B)if x[1]<=B)
def audit(s):
 c=s['parameters'];g=F(str(c['gamma']));mu=[F(str(c['muCamp'])),1-F(str(c['muCamp']))];v=[F(str(c[k]))for k in ['camp','mine']];deep(s['mu'],mu)
 A=[[F(i==j)-g*P[i][a][j]for j in range(2)]for i in range(2)for a in range(2)];rr=sum(R,[])
 eq(len(s['constraints']),4)
 for k,con in enumerate(s['constraints']):deep(con,{'state':k//2,'action':k%2,'A':A[k],'r':rr[k],'travel':int(k==1)})
 eq(len(s['vi']['rows']),c['steps']+1)
 for k,row in enumerate(s['vi']['rows']):
  q=qs(v,g);tv=list(map(max,q));res=max(abs(a-b)for a,b in zip(tv,v));deep(row,{'k':k,'value':v,'q':q,'tv':tv,'residual':res,'residualBound':None if g==1 else res/(1-g)})
  if k<c['steps']:v=tv
 deep(s['vi']['finalValue'],v)
 if g==1:
  for key in ['policies','pi','lp','occupancies','constrained']:eq(s[key],None)
  eq(s['budgetScan'],[]);return
 for record,pi in zip(s['policies'],PIS):
  PP,r,M,val=policy(pi,g);eq(record['policy'],pi);deep(record['P'],PP);deep(record['r'],r);system(record['system'],M,r);deep(record['value'],val)
 eq(len(s['policies']),4);current=[c['piCamp'],c['piMine']];seen=[];last=None
 for row in s['pi']['rows']:
  eq(row['k'],len(seen));eq(row['policy'],current);assert current not in seen;seen.append(current[:]);PP,r,M,val=policy(current,g);deep(row['P'],PP);deep(row['r'],r);system(row['system'],M,r);deep(row['value'],val);q=qs(val,g);deep(row['q'],q)
  tol=64*2**-52*max(1,max(abs(float(x))for x in sum(q,[])));near(row['tolerance'],tol)
  for i,a in enumerate(row['improved']):
   assert a in [0,1]
   if a!=current[i]:assert float(q[i][a]-q[i][current[i]])>=tol-1e-10
   else:assert float(q[i][1-a]-q[i][a])<=tol+1e-10
  deep(row['advantage'],[q[i][a]-q[i][current[i]]for i,a in enumerate(row['improved'])]);eq(row['stable'],current==row['improved'])
  if last is not None:assert all(a>=b for a,b in zip(val,last))
  last=val;current=row['improved']
 eq(s['pi']['rows'][-1]['stable'],True);eq(s['pi']['finalPolicy'],s['pi']['rows'][-1]['policy']);deep(s['pi']['finalValue'],last)
 values=[policy(pi,g)[3]for pi in PIS];star=[max(v[i]for v in values)for i in range(2)];deep(last,star)
 eq(len(s['lp']['vertices']),6);pairs=[(i,j)for i in range(4)for j in range(i+1,4)]
 for rec,(i,j)in zip(s['lp']['vertices'],pairs):
  eq([rec['i'],rec['j']],[i,j]);x=system(rec['system'],[A[i],A[j]],[rr[i],rr[j]]);deep(rec['value'],x)
  sl=None if x is None else[dot(row,x)-r for row,r in zip(A,rr)];deep(rec['slacks'],sl);near(rec['objective'],None if x is None else dot(mu,x));near(rec['tolerance'],None if x is None else 1e-9*max(1,max(map(abs,x))));eq(rec['feasible'],sl is not None and min(sl)>=0)
 chosen=s['lp']['best'];deep(chosen,next(v for v in s['lp']['vertices']if(v['i'],v['j'])==(chosen['i'],chosen['j'])))
 near(s['lp']['best']['objective'],dot(mu,star));near(s['lp']['gap'],0);occ=[]
 for o,pi in zip(s['occupancies'],PIS):
  eq(o['policy'],pi);At,z,x,val=occupancy(pi,g,mu);system(o['system'],At,mu);deep(o['z'],z);deep(o['x'],[x[:2],x[2:]]);deep(o['flow'],[0,0]);near(o['total'],1/(1-g));near(o['reward'],dot(x,rr));near(o['travel'],x[1]);deep(o['value'],val);near(o['weightedValue'],dot(mu,val));occ.append(x)
 eq(len(s['occupancies']),4);deep(s['lp']['dual'],next(o for o in s['occupancies']if o['policy']==s['lp']['dual']['policy']));near(s['lp']['dual']['reward'],dot(mu,star));deep(s['lp']['complementarity'],[0]*4);near(s['lp']['complementaritySum'],0)
 con=s['constrained'];B=F(str(c['budget']));near(con['budget'],B);expected=candidates(occ,B)
 # Floating endpoints can add/remove duplicate representations of a deterministic point.
 for record in con['candidates']:
  i,j=record['i'],record['j'];assert 0<=i<=j<4
  lam=F(1)if i==j else(B-occ[j][1])/(occ[i][1]-occ[j][1]);assert -F(1,10**10)<=lam<=1+F(1,10**10);x=[lam*a+(1-lam)*b for a,b in zip(occ[i],occ[j])]
  near(record['lambda'],lam);deep(record['x'],[x[:2],x[2:]]);near(record['travel'],x[1]);near(record['reward'],dot(x,rr));near(record['budgetSlack'],B-x[1]);eq(record['feasible'],x[1]<=B)
 for i,j,lam,x in expected:
  assert any(abs(float(dot(x,rr))-r['reward'])<1e-6 and abs(float(x[1])-r['travel'])<1e-6 for r in con['candidates'])
 best=con['best'];deep(best,next(r for r in con['candidates']if(r['i'],r['j'])==(best['i'],best['j'])));opt=bestreward(occ,B);near(best['reward'],opt);x=[F(str(v))for row in best['x']for v in row];z=[x[0]+x[1],x[2]+x[3]];pr=[([x[2*i]/z[i],x[2*i+1]/z[i]]if z[i]else[F(1),F(0)])for i in range(2)]
 rec=con['recovery'];deep(rec['z'],z);deep(rec['pi'],pr);PP=[[sum(pr[i][a]*P[i][a][j]for a in range(2))for j in range(2)]for i in range(2)];r=[dot(pr[i],R[i])for i in range(2)];deep(rec['P'],PP);deep(rec['r'],r);val=system(rec['system'],[[F(i==j)-g*PP[i][j]for j in range(2)]for i in range(2)],r);near(rec['weightedValue'],dot(mu,val));near(dot(mu,val),opt);deep(rec['flow'],[0,0])
 assert min(x)>=-F(1,10**8);assert x[1]<=B+F(1,10**8)
 prices={F(0)}
 for i,j in pairs:
  if occ[i][1]!=occ[j][1]:
   eta=(dot(occ[i],rr)-dot(occ[j],rr))/(occ[i][1]-occ[j][1])
   if eta>=0:prices.add(eta)
 observed=[]
 for sh in con['shadow']:
  eta=min(prices,key=lambda e:abs(float(e)-sh['eta']));near(sh['eta'],eta);observed.append(eta);vals=[policy(pi,g,eta)[3]for pi in PIS];value=[max(v[i]for v in vals)for i in range(2)];sl=[dot(a,value)+eta*int(k==1)-rr[k]for k,a in enumerate(A)];deep(sh['value'],value);deep(sh['slacks'],sl);assert min(sl)>=0;near(sh['objective'],dot(mu,value)+B*eta)
 eq(set(observed),prices);deep(con['dual'],next(r for r in con['shadow']if r['eta']==con['dual']['eta']));near(con['dual']['objective'],opt);near(con['gap'],0);deep(con['complementarity'],[0]*4);near(con['budgetProduct'],0);near(con['complementaritySum'],0)
 budgets=sorted(set([F(i,4)for i in range(81)]+[x[1]for x in occ if 0<=x[1]<=20]+[B]));assert all(any(abs(float(b)-r['budget'])<1e-8 for r in s['budgetScan'])for b in budgets)
 for row in s['budgetScan']:
  b=min(budgets,key=lambda b:abs(float(b)-row['budget']))
  near(row['budget'],b);near(row['reward'],bestreward(occ,b));near(row['gap'],0);assert row['travel']<=float(b)+1e-7
  pr=[[F(str(v))for v in pair]for pair in row['pi']];PP=[[sum(pr[i][a]*P[i][a][j]for a in range(2))for j in range(2)]for i in range(2)];z=solve([[F(i==j)-g*PP[j][i]for j in range(2)]for i in range(2)],mu);xx=[z[i]*pr[i][a]for i in range(2)for a in range(2)];near(row['travel'],xx[1]);near(row['reward'],dot(xx,rr))
  eta=F(str(row['eta']));assert eta>=0;vals=[policy(pi,g,eta)[3]for pi in PIS];value=[max(v[i]for v in vals)for i in range(2)];near(dot(mu,value)+b*eta,row['reward'])

from pathlib import Path
import subprocess,shutil,hashlib,tempfile,copy,re,xml.etree.ElementTree as ET,json,sys
staging=len(sys.argv)>1;root=Path(sys.argv[1])if staging else Path(__file__).resolve().parents[1];prefix=['rtk','proxy']if shutil.which('rtk')else[]
js=root/'mdp-iteration179.js'if staging else root/'course-shared/labs/mdp-iteration.js'
fixture=(root/'mdp-snapshot179.json'if(root/'mdp-snapshot179.json').exists()else root/'mdp179-preview-observations.json')if staging else root/'course-shared/projects/mdp-certificates/run-snapshot.json'
code=r'''
const a=require(process.argv[1]),configs=a.PRESETS.map(p=>p.config);for(const gamma of [0,.2,.624,.625,.626,.8,.99,.999,1])for(const muCamp of [0,1])configs.push({gamma,muCamp,budget:.1,steps:35,camp:-17,mine:23,piCamp:1,piMine:1});configs.push({gamma:.999,steps:200,camp:100,mine:-100,budget:20},{gamma:.8,muCamp:.3,budget:.5},{gamma:.8,muCamp:.7,budget:2});const records=configs.map(c=>a.snapshot(c));let invalid=0;const bad=[null,[],2,'x',{bad:1},{constructor:1},JSON.parse('{"__proto__":1}'),{steps:1.5},{steps:-1},{steps:201}];for(const k of Object.keys(a.DEFAULTS))for(const v of ['1',null,NaN,Infinity,-Infinity])bad.push({[k]:v});bad.push({gamma:.9991},{gamma:.999999},{gamma:1-Number.EPSILON/2},{gamma:-.1},{gamma:1.001},{camp:101},{mine:-101},{piCamp:.5},{piMine:2},{piCamp:-1},{muCamp:-.1},{muCamp:1.1},{budget:-1},{budget:20.1});for(const b of bad){let caught=false;try{a.config(b)}catch(e){caught=true}if(!caught)throw Error('Invalid accepted');invalid++;}const feedback=[];for(let i=0;i<4;i++)for(let j=0;j<2;j++)feedback.push(a.feedback(i,j));console.log(JSON.stringify({records,views:records.map(s=>({plots:a.plots(s),svg:a.plots(s).map(a.svg),tables:a.tables(s)})),invalid,feedback,self:a.selfTest()}));
'''
data=json.loads(subprocess.check_output(prefix+['node','-e',code,str(js.resolve())],text=True));records=data['records']
for s in records:audit(s)
f=json.loads(fixture.read_text());eq(len(f['records']),6);eq(f['provenance']['sourceSha256'],hashlib.sha256(js.read_bytes()).hexdigest())
replays=json.loads(subprocess.check_output(prefix+['node','-e','const a=require(process.argv[1]),f=require(process.argv[2]);console.log(JSON.stringify(f.records.map(r=>a.snapshot(r.data.parameters))));',str(js.resolve()),str(fixture.resolve())],text=True))
for rec,replay in zip(f['records'],replays):audit(rec['data']);deep(rec['data'],replay)
coords=markers=ledgerRows=0;ns={'s':'http://www.w3.org/2000/svg'};names=[['采集','远行'],['收获','返回']]
for s,view in zip(records,data['views']):
 rows=s['vi']['rows'];p=s['pi'];l=s['lp'];c=s['constrained'];o=s['occupancies']
 expected=[
 [[[r['k'],r['value'][i]]for r in rows]for i in range(2)],
 [[[r['k'],r['value'][i]]for r in p['rows']]if p else[]for i in range(2)],
 [[[i,r['objective']]if r['feasible']else None for i,r in enumerate(l['vertices'])]if l else[],[[i,r['objective']]if not r['feasible']and r['objective']is not None else None for i,r in enumerate(l['vertices'])]if l else[]],
 [[[r['travel'],r['reward']]for r in o]if o else[],[[c['best']['travel'],c['best']['reward']]]if c else[]],
 [[[r['budget'],r['reward']]for r in s['budgetScan']],[[s['parameters']['budget'],c['best']['reward']]]if c else[]],
 [[[r['eta'],r['objective']]for r in c['shadow']]if c else[],[[c['dual']['eta'],c['dual']['objective']]]if c else[]]]
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
 'model':[[['营地','矿区'][r['state']],names[r['state']][r['action']],*r['A'],r['r'],r['travel']]for r in s['constraints']],
 'vi':[[r['k'],*r['value'],*sum(r['q'],[]),*r['tv'],r['residual'],r['residualBound']]for r in rows],
 'pi':[[r['k'],r['policy'],r['system']['matrix'],r['r'],r['system']['det'],r['value'],r['q'],r['tolerance'],r['improved'],r['advantage'],r['stable']]for r in p['rows']]if p else[],
 'vertices':[[r['i'],r['j'],r['system']['matrix'],r['system']['right'],r['system']['det'],r['value'],r['slacks'],r['tolerance'],r['feasible'],r['objective']]for r in l['vertices']]if l else[],
 'flows':[[r['policy'],r['z'],r['x'],r['flow'],r['total'],r['travel'],r['reward'],r['weightedValue']]for r in o]if o else[],
 'candidates':[[r['i'],r['j'],r['lambda'],r['x'],r['travel'],r['reward'],r['budgetSlack'],r['feasible']]for r in c['candidates']]if c else[],
 'recovery':[[['营地','矿区'][i],c['recovery']['z'][i],c['recovery']['pi'][i],c['recovery']['P'][i],c['recovery']['r'][i],c['recovery']['system']['value'][i],c['recovery']['flow'][i]]for i in range(2)]if c else[],
 'shadow':[[r['eta'],r['value'],r['slacks'],r['objective']]for r in c['shadow']]if c else[],
 'budget':[[r['budget'],r['reward'],r['travel'],r['eta'],r['gap'],r['pi']]for r in s['budgetScan']]}
 for key,expected in expectedTables.items():deep(tables[key]['rows'],expected);assert all(len(r)==len(tables[key]['headers'])for r in expected);ledgerRows+=len(expected)
eq(data['invalid'],64);eq(len(data['feedback']),8)
for i,fb in enumerate(data['feedback']):eq(fb['correct'],i%2==[0,1,1,0][i//2]);assert len(fb['text'])>25
mutations=0
for path in [('vi','finalValue',0),('vi','rows',1,'q',0,0),('pi','rows',0,'value',0),('lp','vertices',1,'value',0),('lp','best','value',0),('occupancies',0,'total'),('constrained','best','reward'),('constrained','recovery','pi',0,1),('constrained','shadow',0,'slacks',0),('budgetScan',0,'reward'),('budgetScan',1,'eta'),('constrained','gap')]:
 bad=copy.deepcopy(records[0]);target=bad
 for key in path[:-1]:target=target[key]
 target[path[-1]]+=1
 try:audit(bad)
 except AssertionError:mutations+=1
 else:raise AssertionError('Mutation escaped: '+str(path))
if not staging:
 for course in ['ai-course','grad-math','math-course']:assert(root/course/'site/assets/learning/labs/mdp-iteration.js').read_bytes()==js.read_bytes()
 assert(root/'grad-math/site/assets/learning/projects/mdp-certificates/run-snapshot.json').read_bytes()==fixture.read_bytes()
 assert(root/'grad-math/images/mdp-02-iteration-ledgers.svg').read_bytes()==(root/'grad-math/site/assets/img/mdp-02-iteration-ledgers.svg').read_bytes()
 with tempfile.TemporaryDirectory()as td:
  svg=Path(td)/'replay.svg';md=Path(td)/'replay.md';subprocess.run(prefix+[sys.executable,str(root/'tools/build_mdp_figure.py'),str(js),str(fixture),str(svg),str(md)],check=True,stdout=subprocess.DEVNULL);assert svg.read_bytes()==(root/'grad-math/images/mdp-02-iteration-ledgers.svg').read_bytes();assert md.read_text()in(root/'grad-math/lectures/mdp-02-iteration.md').read_text()
print(json.dumps({'status':'PASS','records':len(records),'frozen':len(f['records']),'checks':checks,'plotCoordinates':coords,'markers':markers,'ledgerRows':ledgerRows,'invalid':data['invalid'],'feedback':8,'mutations':mutations,'self':data['self']['checks']}))
